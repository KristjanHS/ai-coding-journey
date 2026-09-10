import { describe, expect, it } from 'vitest';

import { eraSpans } from '../src/lib/measurements';
import { byId, document } from './helpers';

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

  it('agrees with the sqlite mirror — the only clean cross-check in the ladder', () => {
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

describe('gemini era — a CLI agent configured, never given a context file', () => {
  const era = byId('gemini');

  it('records the config spread and that no GEMINI.md was ever written', () => {
    // The era whole finding: the config was stamped into repo after repo, but the
    // uppercase GEMINI.md the CLI actually loads was written in none of them.
    expect(era.coverage.configuredRepos).toBe(8);
    expect(era.coverage.geminiMdFiles).toBe(0);
  });

  it('logs no tokens, so takes no share of the floor', () => {
    expect(era.availability.tokens).toBe('none');
    expect(era.share).toBeNull();
    expect(era.logStart).toBeNull();
    expect(era.logEnd).toBeNull();
  });

  it('dates the era from the cross-repo git config span, measured not bracketed', () => {
    expect(era.dateMethod).toBe('measured');
    expect(era.dateLow).toBeNull();
    expect([era.gitStart, era.gitEnd]).toEqual(['2025-07-04', '2026-06-23']);
    expect(era.gitCommits).toBe(18);
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

  it('draws one bar from the onset while keeping the record start distinct', () => {
    const span = eraSpans.find((s) => s.id === 'claude-code')!;
    expect(span.onset).toBe('2026-02-28');
    expect(span.onsetLeadDays).toBeGreaterThan(100);
    // The records still begin later — the gap is data, not a rounding artifact.
    expect(span.start > span.onset!).toBe(true);
    // ...and the drawn bar reaches back to cover it, in one piece.
    expect(span.barStart).toBe(span.onset);
  });

  it('leaves barStart equal to start for every era without an onset', () => {
    for (const span of eraSpans.filter((s) => s.onset === null)) {
      expect(span.barStart).toBe(span.start);
    }
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
