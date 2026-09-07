import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import eras_ from '../content/measurements/data/eras.json';
import {
  allCaveatLines,
  availabilityMatrix,
  caveats,
  eraSpans,
  eras,
  overlaps,
  overlappingPairs,
  redaction,
  tokenShape,
  withheld,
} from '../src/lib/measurements';

// Hermetic over the COMMITTED eras.json — this suite never shells out to git and never
// reads the private full store. The generators (`make measurements`) talk to the config
// repo and the log trees; `scripts/measurements-public.py` redacts their output into the
// file pinned here, so the gate stays runnable on a machine that has neither.
//
// Three kinds of assertion:
//   (1) REDACTION — the boundary itself. These red when an absolute volume or a money
//       figure reappears anywhere public, which is the failure that actually matters.
//   (2) SHAPE — the era list's contract. These red when a parser or schema change
//       collapses the list, drops an era, or flattens a typed field.
//   (3) DATA PINS — commit counts, date ranges and coverage ratios, recomputed by the
//       generators before they were pinned here. These red when the sources move.
const document = eras_ as unknown as {
  schema: number;
  redaction: { policy: string; bearingTools: number; totalTools: number; withheld: string[]; note: string };
  eras: any[];
  sttFaster: Record<string, any>;
};

const SPEC_ORDER = ['copilot', 'continue', 'codex', 'cursor', 'claude-code'];
const TOKEN_STATES = new Set(['yes', 'floor', 'none']);
const GROUPS = new Set(['vscode-plugin', 'cursor', 'claude-code']);

const byId = (id: string) => document.eras.find((e) => e.id === id)!;

// ── (1) The redaction boundary ────────────────────────────────────────────────
// The policy: states, dates and shares cross into this repo; absolute volumes and every
// money figure do not. `scripts/measurements-public.py` enforces it at generation time;
// this suite enforces it at gate time, over the committed artifact, so a hand-edit of
// eras.json is caught even though no generator ran.
//
// The ceiling matches the script's ABSOLUTE_LIMIT. No state, date part, small structural
// count or share is this large; anything that is, is a volume.
const ABSOLUTE_LIMIT = 10_000;
const PRICED_KEY = /cost|usd|token|cachecreation|cacheread/i;

interface Leaf {
  path: string;
  key: string;
  value: unknown;
}

function leaves(node: unknown, path = '', key = ''): Leaf[] {
  if (Array.isArray(node)) return node.flatMap((v, i) => leaves(v, `${path}[${i}]`, key));
  if (node && typeof node === 'object') {
    return Object.entries(node).flatMap(([k, v]) => leaves(v, path ? `${path}.${k}` : k, k));
  }
  return [{ path, key, value: node }];
}

const allLeaves = leaves(document);

describe('redaction boundary — the public store carries no volume and no money', () => {
  it('holds no number large enough to be an absolute volume', () => {
    const offenders = allLeaves.filter(
      (l) => typeof l.value === 'number' && Math.abs(l.value) >= ABSOLUTE_LIMIT,
    );
    expect(offenders.map((o) => `${o.path}=${o.value}`)).toEqual([]);
  });

  it('holds no numeric value under a token- or money-shaped key that is not a fraction', () => {
    // A string, a date or a boolean under such a key is a STATE and crosses freely
    // ("tokens": "floor", "firstToken": "2026-02-28", "costFieldPresent": false). A
    // number does not, unless it is a share in [0, 1].
    const offenders = allLeaves.filter(
      (l) =>
        PRICED_KEY.test(l.key) &&
        typeof l.value === 'number' &&
        !(l.value >= 0 && l.value <= 1),
    );
    expect(offenders.map((o) => `${o.path}=${o.value}`)).toEqual([]);
  });

  it('gives no era a cost availability state or a cost metrics block', () => {
    // The cost dimension does not exist publicly at all — not as a number, and not as
    // the four typed states it used to carry.
    for (const era of document.eras) {
      expect(Object.keys(era.availability)).not.toContain('cost');
      expect(era).not.toHaveProperty('metrics');
      expect(Object.keys(era.provenance)).not.toContain('cost');
    }
  });

  it('declares what it withholds, rather than leaving the gap unexplained', () => {
    expect(document.schema).toBe(2);
    expect(redaction.policy).toBe('states-dates-shares');
    expect(withheld.length).toBeGreaterThanOrEqual(3);
    expect(withheld.join(' ')).toMatch(/cost/i);
    expect(withheld.join(' ')).toMatch(/token/i);
  });

  it('prints no money figure and no long number in any public measurement prose', () => {
    // The prose half of the same boundary. A dollar amount, or any number with two or
    // more thousands groups, is a volume that escaped the JSON guard by being typed by
    // hand into a narrative.
    for (const file of measFiles()) {
      const body = readMeas(file);
      expect(body, `${file}: dollar figure in public prose`).not.toMatch(/\$\s?\d/);
      expect(body, `${file}: absolute volume in public prose`).not.toMatch(
        /\b\d{1,3}(,\d{3}){2,}\b/,
      );
    }
  });
});

// ── (2) Shape ─────────────────────────────────────────────────────────────────
describe('eras.json shape', () => {
  it('is a list of exactly the five eras, in spec order', () => {
    expect(document.eras.map((e) => e.id)).toEqual(SPEC_ORDER);
  });

  it('carries a typed availability matrix on every era', () => {
    for (const era of document.eras) {
      expect(TOKEN_STATES.has(era.availability.tokens), `${era.id} tokens`).toBe(true);
      expect(['yes', 'none']).toContain(era.availability.skills);
      expect(typeof era.availability.counts).toBe('string');
    }
  });

  it('leaves the skills row empty for every era before Claude Code', () => {
    for (const era of document.eras) {
      expect(Boolean(era.skills), `${era.id} skills block`).toBe(era.id === 'claude-code');
    }
  });

  it('never lets a group stand in for the five separate eras', () => {
    // D5: `group` is a colour tag. Three groups over five eras — if a refactor ever
    // collapses the list to its groups, this reds.
    expect(new Set(document.eras.map((e) => e.group)).size).toBeLessThan(document.eras.length);
    for (const era of document.eras) expect(GROUPS.has(era.group)).toBe(true);
  });

  it('gives every token-bearing era a share and every other era none', () => {
    for (const era of document.eras) {
      const bearing = era.availability.tokens !== 'none';
      expect(typeof era.share === 'number', `${era.id} share`).toBe(bearing);
      if (bearing) {
        expect(era.share).toBeGreaterThan(0);
        expect(era.share).toBeLessThanOrEqual(1);
      } else {
        // null, never 0 — an absence must not render as a measured zero.
        expect(era.share).toBeNull();
      }
    }
  });

  it('has the four bearing shares account for the whole floor', () => {
    const total = document.eras.reduce((sum, e) => sum + (e.share ?? 0), 0);
    expect(total).toBeGreaterThan(0.999);
    expect(total).toBeLessThan(1.001);
  });
});

// ── (3) Data pins: the git spine ──────────────────────────────────────────────
describe('git-derived spine', () => {
  it('orders every era range forwards in time', () => {
    for (const era of document.eras) {
      if (era.gitStart) expect(era.gitStart <= era.gitEnd).toBe(true);
      expect(era.logStart <= era.logEnd).toBe(true);
    }
  });

  it('gives every era with a config dir a positive commit count, and only those', () => {
    for (const era of document.eras) {
      if (era.configDir === null) {
        expect(era.gitCommits, `${era.id}`).toBeNull();
      } else {
        expect(era.gitCommits, `${era.id}`).toBeGreaterThan(0);
      }
    }
  });

  it('pins the four config-dir commit counts', () => {
    expect(byId('continue').gitCommits).toBe(2);
    expect(byId('codex').gitCommits).toBe(9);
    expect(byId('cursor').gitCommits).toBe(41);
    expect(byId('claude-code').gitCommits).toBe(15);
    expect(byId('copilot').gitCommits).toBeNull();
  });

  it('pins the config-dir date ranges', () => {
    expect([byId('continue').gitStart, byId('continue').gitEnd]).toEqual(['2025-07-13', '2025-08-16']);
    expect([byId('codex').gitStart, byId('codex').gitEnd]).toEqual(['2025-08-28', '2025-09-09']);
    expect([byId('cursor').gitStart, byId('cursor').gitEnd]).toEqual(['2025-07-31', '2026-06-23']);
    expect([byId('claude-code').gitStart, byId('claude-code').gitEnd]).toEqual(['2026-06-23', '2026-09-06']);
  });

  it('shows the eras overlap rather than succeed one another', () => {
    // The load-bearing structural claim of the whole page: a tidy succession would be
    // a false story, and the data must be able to refute it.
    expect(overlappingPairs.length).toBeGreaterThanOrEqual(4);
  });
});

// ── (3) Data pins: per-era coverage ratios ────────────────────────────────────
// These replaced the absolute metrics. Each is a fraction or a small structural count,
// and each carries the qualifier its era's headline figure needs.
describe('copilot era — an absence, recorded as data', () => {
  const c = byId('copilot').coverage;

  it('records the absence of tokens and of price as booleans, not as zeroes', () => {
    expect(c.tokenFieldPresent).toBe(false);
    expect(c.costFieldPresent).toBe(false);
    expect(byId('copilot').availability.tokens).toBe('none');
  });

  it('pins the workspace coverage that is the era whole finding', () => {
    expect(c.workspacesWithChat).toBe(6);
    expect(c.workspacesTotal).toBe(18);
    expect(c.workspacesWithChat).toBeLessThan(c.workspacesTotal);
  });

  it('dates the era from its log range alone, having no git range', () => {
    expect([byId('copilot').logStart, byId('copilot').logEnd]).toEqual(['2025-06-20', '2025-12-08']);
  });
});

describe('continue era — exact, local, and the smallest share', () => {
  const era = byId('continue');

  it('pins the local-provider event share that explains the era', () => {
    expect(era.coverage.localProviderEventShare).toBeGreaterThan(0.98);
    expect(era.coverage.modelsSeen).toBe(24);
  });

  it('agrees with the sqlite mirror — the only clean cross-check in five eras', () => {
    expect(era.coverage.mirrorAgrees).toBe(true);
  });

  it('keeps the session range and the token-event range apart', () => {
    // Two ranges that disagree, shown rather than reconciled: chat sessions stop five
    // days in, token events run six more weeks.
    expect(era.coverage.sessionLogEnd).toBe('2025-07-09');
    expect(era.logEnd).toBe('2025-08-16');
    expect(era.coverage.sessionLogEnd < era.logEnd).toBe(true);
  });

  it('takes the smallest share of the floor, by orders of magnitude', () => {
    const others = document.eras.filter((e) => e.share !== null && e.id !== 'continue');
    for (const other of others) expect(era.share).toBeLessThan(other.share / 100);
  });
});

describe('codex era — a floor because logging starts late', () => {
  const era = byId('codex');

  it('pins the partial-logging coverage that makes the share a floor', () => {
    expect(era.availability.tokens).toBe('floor');
    expect(era.coverage.partialLogging).toBe(true);
    expect(era.coverage.loggingStart).toBe('2025-09-23');
    expect(era.coverage.loggingStart > era.logStart).toBe(true);
    expect(era.coverage.rolloutsWithTokenShare).toBeLessThan(0.5);
  });

  it('separates human prompts from injected context', () => {
    // Counting raw user messages would inflate the prompt figure by half again.
    expect(era.coverage.humanPromptShare).toBeGreaterThan(0.6);
    expect(era.coverage.humanPromptShare).toBeLessThan(0.8);
  });

  it('records the two header formats, so a one-shape reader cannot look complete', () => {
    expect(era.coverage.headerFormats).toBe(2);
  });
});

describe('cursor era — a floor because most bubbles are unpriced', () => {
  const era = byId('cursor');

  it('pins the priced-bubble fraction and that every priced bubble is an assistant turn', () => {
    expect(era.availability.tokens).toBe('floor');
    expect(era.coverage.pricedBubbleShare).toBeCloseTo(0.0486, 4);
    expect(era.coverage.pricedBubblesAllAssistant).toBe(true);
    expect(era.coverage.isFloor).toBe(true);
  });

  it('names the estimate as the client own, never a billed figure', () => {
    expect(era.coverage.estimateSource).toBe('cursor-client');
  });

  it('pins the log range of a dead corpus', () => {
    expect([era.logStart, era.logEnd]).toEqual(['2025-07-09', '2026-05-18']);
  });
});

describe('claude-code era — the richest logs', () => {
  const era = byId('claude-code');

  it('keeps the main and subagent sides distinct and both non-trivial (D1)', () => {
    const { mainShareOfEra, subagentShareOfEra } = era.coverage;
    expect(mainShareOfEra).toBeGreaterThan(0.1);
    expect(subagentShareOfEra).toBeGreaterThan(0.1);
    expect(mainShareOfEra + subagentShareOfEra).toBeCloseTo(1, 3);
  });

  it('reports reuse as a multiple, never folded into the share', () => {
    // cacheRead against the three-class headline. Above 1 means most of what the model
    // reads it has read before — the finding, without its size.
    expect(era.coverage.cacheReuseMultiple).toBeGreaterThan(1);
  });

  it('pins the fraction of sessions that delegate at all', () => {
    expect(era.coverage.sessionsUsingSubagentsShare).toBeGreaterThan(0);
    expect(era.coverage.sessionsUsingSubagentsShare).toBeLessThan(1);
  });

  it('dates the era from artifacts that survive log pruning, not from the logs', () => {
    const onset = era.onset;
    expect(onset.logsArePruned).toBe(true);
    expect(onset.firstToken).toBe('2026-02-28');
    // The corroborating file agrees to the minute without being derived from the first.
    expect(onset.firstPromptStamp.slice(0, 10)).toBe(onset.firstToken);
    // First launch is NOT first token: installed, then left alone for six months.
    expect(onset.firstStart! < onset.firstToken).toBe(true);
    // And the logs start long after the era does — the gap the bar keeps open.
    expect(onset.firstToken < era.logStart).toBe(true);
  });

  it('keeps the drawn bar apart from the onset instead of widening it', () => {
    const span = eraSpans.find((s) => s.id === 'claude-code')!;
    expect(span.onset).toBe('2026-02-28');
    expect(span.onsetLeadDays).toBeGreaterThan(100);
    expect(span.start > span.onset!).toBe(true);
  });

  it('takes the largest share — more than the other three combined', () => {
    const others = document.eras
      .filter((e) => e.share !== null && e.id !== 'claude-code')
      .reduce((sum, e) => sum + e.share, 0);
    expect(era.share).toBeGreaterThan(others);
  });
});

// ── Skills: a Claude-Code-era-only attribute (D6) ─────────────────────────────
describe('skills — a Claude-Code-era-only attribute (D6: git headline only)', () => {
  const skills = byId('claude-code').skills;

  it('pins the live skill count and the commit floor, both scoped to skills/', () => {
    expect(skills.liveSkillFiles).toBe(29);
    expect(skills.commits).toBe(103);
    expect([skills.vcStart, skills.vcEnd]).toEqual(['2026-07-09', '2026-08-20']);
  });

  it('flags the count a floor over version-control dates, never authoring dates', () => {
    expect(skills.commitsAreFloor).toBe(true);
    expect(skills.datesAre).toBe('adopted-into-vc');
    expect(skills.caveat).toMatch(/floor/i);
    // The worked example proves the caveat: a skill whose snapshot predates its first
    // commit by two months is one whose git date is not its authoring date.
    expect(skills.example.snapshotDate < skills.example.firstCommit).toBe(true);
  });

  it('gives no era before Claude Code a skills block at all', () => {
    for (const era of document.eras) {
      if (era.id === 'claude-code') continue;
      expect(era.skills, `${era.id}`).toBeUndefined();
      expect(era.availability.skills).toBe('none');
    }
  });
});

// ── stt-faster corpus (D7) ────────────────────────────────────────────────────
describe('stt-faster experimentation corpus (D7: counts + a one-file schema probe)', () => {
  const stt = document.sttFaster;

  it('keeps the three .bat generations split, never collapsed into one total', () => {
    const { bat, old_bat, root } = stt.batGenerations;
    expect(bat + old_bat + root).toBe(stt.batTotal);
    expect(Object.keys(stt.batGenerations).length).toBe(3);
  });

  it('records failed/ as empty and names the superseded generations instead', () => {
    expect(stt.failedDirEmpty).toBe(true);
    expect(stt.supersededGenerations).toContain('old_bat');
    expect(stt.abandonedRuntimeVariants.length).toBeGreaterThan(0);
  });

  it('reports the sampled schema and refuses the benchmark claim it does not support', () => {
    expect(stt.schemaSampledFrom).toBe(1);
    expect(stt.isBenchmark).toBe(false);
    expect(stt.schemaFinding).toMatch(/not a benchmark/i);
  });

  it('shows the corpus-vs-repo span delta rather than reconciling it', () => {
    expect(stt.mtimeStart > stt.repo.gitStart).toBe(true);
  });

  it('lets no transcript text, filename or person name reach an emitted field', () => {
    // The sanitisation guard, enforced not documented. Every string the block emits must
    // be structural — a key-shaped token, a date, or the one documented prose field.
    const strings: string[] = [];
    const walk = (node: unknown) => {
      if (typeof node === 'string') strings.push(node);
      else if (Array.isArray(node)) node.forEach(walk);
      else if (node && typeof node === 'object') Object.values(node).forEach(walk);
    };
    walk(stt);
    const structural = /^(_?[a-z0-9][a-z0-9_]*(\.bat)?|\d{4}-\d{2}-\d{2}|OLD_compare_variants\.bat)$/;
    for (const value of strings) {
      if (value === stt.schemaFinding) continue;
      expect(structural.test(value), `non-structural emitted string: ${value}`).toBe(true);
    }
    expect(/\.(aac|txt|json)\b/.test(stt.schemaFinding)).toBe(false);
  });
});

// ── The derived LIB views (D8 — pin the lib, NOT built dist/) ─────────────────
describe('measurements lib — overlap view (D8: derived, not dist/)', () => {
  it('has at least two era spans that intersect in time', () => {
    const intersecting = eraSpans.some((a, i) => eraSpans.slice(i + 1).some((b) => overlaps(a, b)));
    expect(intersecting).toBe(true);
  });

  it('names the Cursor∩Codex overlap in the derived pairs list', () => {
    const pair = overlappingPairs.find(
      (p) => (p.a === 'codex' && p.b === 'cursor') || (p.a === 'cursor' && p.b === 'codex'),
    );
    expect(pair, 'the two concurrent plugin eras stopped overlapping').toBeDefined();
    expect(pair!.start <= pair!.end).toBe(true);
  });
});

describe('measurements lib — token shape replaces the absolute headline', () => {
  it('gives a row per era, with a share for the four bearing tools only', () => {
    expect(tokenShape.rows.map((r) => r.id)).toEqual(SPEC_ORDER);
    expect(tokenShape.bearingRows.length).toBe(4);
    expect(tokenShape.bearingCount).toBe(4);
    expect(tokenShape.totalTools).toBe(5);
  });

  it('sums the bearing shares to the whole floor', () => {
    expect(tokenShape.shareTotal).toBeCloseTo(1, 2);
  });

  it('exposes no absolute anywhere in the view', () => {
    // The lib is where a breach would surface as a rendered figure. Nothing it emits may
    // be a quantity: every number is a fraction or a bar width.
    for (const row of tokenShape.rows) {
      if (row.share !== null) {
        expect(row.share).toBeGreaterThan(0);
        expect(row.share).toBeLessThanOrEqual(1);
      }
      expect(row.logWidth).toBeGreaterThanOrEqual(0);
      expect(row.logWidth).toBeLessThanOrEqual(1);
    }
  });

  it('keeps the smallest share visible on the log-scaled bar', () => {
    // The whole reason the bar is log-scaled: Continue is three decades below Claude
    // Code, and on a linear bar it would render as nothing at all.
    const continueRow = tokenShape.rows.find((r) => r.id === 'continue')!;
    const claudeRow = tokenShape.rows.find((r) => r.id === 'claude-code')!;
    expect(continueRow.share! * 100).toBeLessThan(claudeRow.share!);
    expect(continueRow.logWidth).toBeGreaterThan(0.05);
    expect(continueRow.logWidth).toBeLessThan(claudeRow.logWidth);
  });

  it('renders a non-bearing tool as an absence, never as a zero share', () => {
    const copilot = tokenShape.rows.find((r) => r.id === 'copilot')!;
    expect(copilot.share).toBeNull();
    expect(copilot.logWidth).toBe(0);
    expect(copilot.qualifier).toMatch(/absence|not a zero/i);
  });

  it('carries a qualifier on every row, so no share can be read bare', () => {
    for (const row of tokenShape.rows) expect(row.qualifier.length).toBeGreaterThan(20);
  });
});

describe('measurements lib — caveats never silently drop (D8)', () => {
  it('carries the Cursor floor and client-side-estimate caveats', () => {
    const cursor = caveats.find((c) => c.id === 'cursor')!;
    expect(cursor.lines.some((l) => /floor/i.test(l))).toBe(true);
    expect(cursor.lines.some((l) => /client-side|estimate/i.test(l))).toBe(true);
  });

  it('carries the Copilot absence as a caveat of its own', () => {
    const copilot = caveats.find((c) => c.id === 'copilot')!;
    expect(copilot.lines.some((l) => /no token field/i.test(l))).toBe(true);
  });

  it('states every caveat as prose a reader can act on', () => {
    expect(allCaveatLines.length).toBeGreaterThanOrEqual(4);
    for (const line of allCaveatLines) expect(line.length).toBeGreaterThan(20);
  });
});

describe('measurements lib — availability matrix (D5/D6)', () => {
  it('names all five eras in spec order', () => {
    expect(availabilityMatrix.map((r) => r.id)).toEqual(SPEC_ORDER);
  });

  it('renders the skills row empty for eras 0–3 and populated only for Claude Code', () => {
    for (const row of availabilityMatrix) {
      expect(row.skills === null, `${row.id}`).toBe(row.id !== 'claude-code');
    }
  });

  it('carries no cost field into the matrix at all', () => {
    for (const row of availabilityMatrix) expect(Object.keys(row)).not.toContain('cost');
  });
});

// ── Narrative ↔ JSON mirror ───────────────────────────────────────────────────
const MEAS = join(process.cwd(), 'content', 'measurements');
const measFiles = () => readdirSync(MEAS).filter((f) => f.endsWith('.md')).sort();
const readMeas = (file: string) => readFileSync(join(MEAS, file), 'utf8');
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
