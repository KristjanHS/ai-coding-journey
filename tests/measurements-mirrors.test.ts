import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { byId, document, measFiles, readMeas } from './helpers';

// ── Narrative ↔ JSON mirror ───────────────────────────────────────────────────
const corpus = () => measFiles().map(readMeas).join('\n');

/** Each token state must be CHARACTERISED in prose, not merely spelled. */
const STATE_PHRASE: Record<string, RegExp> = {
  yes: /exact/i,
  floor: /is a floor|floor, not a total|share is a floor/i,
  none: /no token field|absence, not a zero/i,
};

/** Each era's share, formatted the way the prose must print it. */
const SHARE_TEXT: [string, string][] = [
  ['01-continue.md', `${(byId('continue').share * 100).toFixed(2)}%`],
  ['02-codex.md', `${(byId('codex').share * 100).toFixed(1)}%`],
  ['03-cursor.md', `${(byId('cursor').share * 100).toFixed(1)}%`],
  ['04-claude-code.md', `${(byId('claude-code').share * 100).toFixed(1)}%`],
];

describe('measurements narrative ↔ JSON mirror', () => {
  it.each(SHARE_TEXT)('%s prints the share exactly as the JSON derives it', (file, text) => {
    expect(readMeas(file).includes(text), `${file}: missing derived share ${text}`).toBe(true);
  });

  it('gives every measurement file a "measured how" line', () => {
    // Anti-hype rule: a number without how it was measured is not evidence.
    const files = measFiles();
    expect(files.length).toBeGreaterThanOrEqual(5);
    for (const file of files) {
      expect(/measured how/i.test(readMeas(file)), `${file}: no measured-how line`).toBe(true);
    }
  });

  it('states the eras overlap, naming the Cursor∩Codex pair in prose', () => {
    const stated = measFiles()
      .map(readMeas)
      .some((b) => /overlap|concurrent/i.test(b) && /cursor/i.test(b) && /codex/i.test(b));
    expect(stated).toBe(true);
  });

  it('characterises every token state the JSON carries, not just the enum', () => {
    // Three distinct states, three distinct claims. `floor` and `none` are NOT the same
    // finding — one is a measurement that undercounts, the other is no measurement at
    // all — and prose that flattens them is the failure this guards.
    const states = [...new Set(document.eras.map((e) => e.availability.tokens))];
    expect(states.length).toBe(3);
    const text = corpus();
    for (const state of states) {
      expect(text.includes(state), `token state not named in prose: ${state}`).toBe(true);
      expect(STATE_PHRASE[state].test(text), `state not characterised: ${state}`).toBe(true);
    }
  });

  it('says in every era file what that file does not publish', () => {
    // The redaction is disclosed per era, not buried in one page-level note: a reader
    // landing on a single narrative must learn that its volumes are withheld.
    for (const file of measFiles()) {
      if (file.startsWith('05-')) continue; // the stt corpus has no token or cost data
      expect(/not published/i.test(readMeas(file)), `${file}: no withholding note`).toBe(true);
    }
  });
});

// ── The deck chapters ↔ JSON mirror ───────────────────────────────────────────
const JOURNEY = join(process.cwd(), 'content', 'journey');
const readChapter = (file: string) => readFileSync(join(JOURNEY, file), 'utf8');

describe('journey deck chapters ↔ JSON mirror', () => {
  it('01 claims the chat era has nothing quantitative only while the JSON agrees', () => {
    const era = byId('copilot');
    expect(era.coverage.tokenFieldPresent).toBe(false);
    const body = readChapter('01-hands-on-llm.md');
    expect(body).toMatch(/no token field/i);
    expect(body).toContain(`${era.coverage.workspacesWithChat} of ${era.coverage.workspacesTotal}`);
  });

  it('02 states the local-provider share the JSON actually carries', () => {
    const share = byId('continue').coverage.localProviderEventShare;
    expect(readChapter('02-kri-local-rag.md')).toContain(`${(share * 100).toFixed(1)}%`);
  });

  it('02 claims two agreeing sources only while the cross-check agrees', () => {
    expect(byId('continue').coverage.mirrorAgrees).toBe(true);
    expect(readChapter('02-kri-local-rag.md')).toMatch(/agree to the event/i);
  });

  it('90 keeps the four tools distinguishable, in the chapter about the absences', () => {
    // The chapter's thesis is that the four answers are different KINDS of answer.
    // Flattening them into "no data" is exactly the fiction it warns against.
    const body = readChapter('90-what-i-got-wrong.md');
    expect(body).toMatch(/exact/i);
    expect(body).toMatch(/floor/i);
    expect(body).toMatch(/absent|no token field/i);
    expect(body).toMatch(/states, not missing values/i);
  });

  it('90 names the redaction as a decision, not an omission', () => {
    expect(readChapter('90-what-i-got-wrong.md')).toMatch(/privat/i);
  });

  it('no journey chapter prints a money figure or an absolute volume', () => {
    for (const file of readdirSync(JOURNEY).filter((f) => f.endsWith('.md'))) {
      const body = readChapter(file);
      expect(body, `${file}: dollar figure`).not.toMatch(/\$\s?\d/);
      expect(body, `${file}: absolute volume`).not.toMatch(/\b\d{1,3}(,\d{3}){2,}\b/);
    }
  });
});
