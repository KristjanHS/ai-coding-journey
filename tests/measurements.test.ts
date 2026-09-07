import { describe, expect, it } from 'vitest';

import eras from '../content/measurements/data/eras.json';

// Hermetic over the COMMITTED eras.json — this suite never shells out to git. The
// generator (`make measurements`) is what talks to the config repo; these assertions
// pin what it produced, so the gate stays runnable on a machine that does not have
// ~/projects/kri-local-rag at all.
//
// Two kinds of assertion, split the same way tests/timeline-lib.test.ts splits them:
//   (1) SHAPE — the era list's contract. These red when a parser or a schema change
//       collapses the list, drops an era, or flattens a typed field.
//   (2) DATA PINS — the four config-dir commit counts, recomputed by the generator
//       from git before they were pinned here. These red when the config repo moves.

const EXPECTED_IDS = ['copilot', 'continue', 'codex', 'cursor', 'claude-code'] as const;

// inc5a decision D4: cost is a typed state, never a nullable number. The four states
// are distinct findings — near-zero-by-construction is NOT the same claim as
// unknown-server-side, and the page must not render them alike.
const COST_STATES = ['derived', 'near-zero-local', 'unknown-server-side', 'absent'];
const TOKEN_STATES = ['yes', 'floor', 'none'];

// inc5a decision D5: `group` is a visual layer only. The list stays five rows.
const GROUPS = ['vscode-plugin', 'cursor', 'claude-code'];

describe('eras.json shape', () => {
  it('is a list of exactly the five eras, in spec order', () => {
    expect(Array.isArray(eras.eras)).toBe(true);
    expect(eras.eras.map((e) => e.id)).toEqual([...EXPECTED_IDS]);
  });

  it('carries a typed availability matrix on every era', () => {
    for (const era of eras.eras) {
      expect(COST_STATES, `${era.id} cost`).toContain(era.availability.cost);
      expect(TOKEN_STATES, `${era.id} tokens`).toContain(era.availability.tokens);
      expect(GROUPS, `${era.id} group`).toContain(era.group);
    }
  });

  it('leaves the skills row empty for every era before Claude Code', () => {
    const withSkills = eras.eras.filter((e) => e.availability.skills === 'yes');
    expect(withSkills.map((e) => e.id)).toEqual(['claude-code']);
  });

  it('never lets a group stand in for the five separate eras', () => {
    // D5's falsifier: grouping three VS Code plugins into one band would leave three
    // distinct groups where the page is required to show five overlapping rows.
    expect(new Set(eras.eras.map((e) => e.group)).size).toBeLessThan(eras.eras.length);
    expect(eras.eras).toHaveLength(5);
  });
});

describe('git-derived spine', () => {
  it('orders every era range forwards in time', () => {
    for (const era of eras.eras) {
      if (era.gitStart === null) continue;
      expect(era.gitStart! <= era.gitEnd!, `${era.id} ${era.gitStart}..${era.gitEnd}`).toBe(true);
    }
  });

  it('gives every era with a config dir a positive commit count, and only those', () => {
    for (const era of eras.eras) {
      if (era.configDir === null) {
        expect(era.gitCommits, `${era.id}`).toBeNull();
        expect(era.gitStart, `${era.id}`).toBeNull();
      } else {
        expect(era.gitCommits, `${era.id}`).toBeGreaterThan(0);
      }
    }
  });

  // Recomputed fixtures: the generator derived these from `git log -- <dir>` in
  // ~/projects/kri-local-rag before they were written here. Copilot Chat stores nothing
  // in a project tree, so it has no config dir and no git range — a genuine absence.
  it('pins the four config-dir commit counts', () => {
    const commits = Object.fromEntries(eras.eras.map((e) => [e.id, e.gitCommits]));
    expect(commits).toEqual({
      copilot: null,
      continue: 2,
      codex: 9,
      cursor: 41,
      'claude-code': 15,
    });
  });

  it('pins the config-dir date ranges', () => {
    const spans = Object.fromEntries(
      eras.eras.filter((e) => e.gitStart !== null).map((e) => [e.id, [e.gitStart, e.gitEnd]]),
    );
    expect(spans).toEqual({
      continue: ['2025-07-13', '2025-08-16'],
      codex: ['2025-08-28', '2025-09-09'],
      cursor: ['2025-07-31', '2026-06-23'],
      'claude-code': ['2026-06-23', '2026-09-06'],
    });
  });

  it('shows the eras overlap rather than succeed one another', () => {
    // The structural finding the page must encode: Cursor's range spans Codex's
    // entirely and touches Claude Code's start. A generator that emitted consecutive
    // non-overlapping bands would red here.
    const by = Object.fromEntries(eras.eras.map((e) => [e.id, e]));
    expect(by.cursor!.gitStart! < by.codex!.gitStart!).toBe(true);
    expect(by.cursor!.gitEnd! > by.codex!.gitEnd!).toBe(true);
    expect(by.cursor!.gitEnd! >= by['claude-code']!.gitStart!).toBe(true);
  });
});

// ── Era 4: Claude Code ────────────────────────────────────────────────────────
// The one era with tokens, money and sessions all derivable. Pins here are
// RECOMPUTED fixtures: `make measurements` derived them from the live log tree, and a
// regeneration is EXPECTED to move them — the corpus grows daily and old transcripts
// age out. A red here after a regen means "update the pin with the new measurement",
// which is the point: the narrative in content/measurements/*.md is mirrored against
// these, so a figure can never drift silently.

const cc = eras.eras.find((e) => e.id === 'claude-code')!;
const CLASSES = ['input', 'cacheCreation', 'cacheRead', 'output'] as const;

describe('claude-code era metrics', () => {
  it('pins the session and transcript counts', () => {
    expect(cc.metrics.main.sessions).toBe(723);
    expect(cc.metrics.main.files).toBe(749);
    // 898 subagent transcripts, spread across 346 of the main sessions — the subagent
    // side's distinct sessionId count is the PARENT count, not a subagent count.
    expect(cc.metrics.subagent.files).toBe(898);
    expect(cc.metrics.subagent.parentSessions).toBe(346);
  });

  it('keeps the parent and subagent sides distinct and both non-empty (D1)', () => {
    // The D1 ruling prints both figures side by side, so neither side may be zero by
    // construction. This is the falsifier for the sidechain filter: every assistant
    // record in a subagent transcript carries isSidechain: true, so a filter applied
    // with the same sense to both sides zeroes this one.
    for (const klass of CLASSES) {
      expect(cc.metrics.main.tokens[klass], `main ${klass}`).toBeGreaterThan(0);
      expect(cc.metrics.subagent.tokens[klass], `subagent ${klass}`).toBeGreaterThan(0);
    }
  });

  it('reconciles per-model token sums against each side total', () => {
    for (const side of ['main', 'subagent'] as const) {
      const models = Object.values(cc.metrics[side].perModel);
      for (const klass of CLASSES) {
        const summed = models.reduce((total, m) => total + m[klass], 0);
        expect(summed, `${side} ${klass}`).toBe(cc.metrics[side].tokens[klass]);
      }
    }
  });

  it('keeps the four token classes separate, cache_read never folded in', () => {
    // D2's cache-class ruling lives in the DATA here: the headline (input +
    // cacheCreation + output) must be reconstructible, which it only is while
    // cacheRead is its own field. cacheRead dominates — that is exactly why.
    const t = cc.metrics.main.tokens;
    const headline = t.input + t.cacheCreation + t.output;
    expect(t.cacheRead).toBeGreaterThan(headline);
    expect(headline).toBeGreaterThan(0);
  });

  it('reconciles per-model cost against the session cost total', () => {
    const summed = Object.values(cc.metrics.cost.perModelUSD).reduce((a, b) => a + b, 0);
    expect(Math.abs(summed - cc.metrics.cost.totalUSD)).toBeLessThan(0.01);
    expect(cc.metrics.cost.hasUnknownModelCost).toBe(false);
  });

  it('pins the derived cost and marks the era cost-derivable', () => {
    expect(cc.metrics.cost.totalUSD).toBeCloseTo(<redacted>, 3);
    expect(cc.metrics.cost.sessionsWithCostState).toBe(293);
    expect(cc.availability.cost).toBe('derived');
  });

  it('dates the log range forwards and records that it starts after the git range', () => {
    expect(cc.logStart! <= cc.logEnd!).toBe(true);
    // A real cross-check disagreement, shown rather than smoothed away: the .claude/
    // config dir dates the era from 2026-06-23, but the oldest surviving transcript is
    // later — Claude Code prunes its own logs, so the log range is a floor on the era,
    // not its start.
    expect(cc.logStart! > cc.gitStart!).toBe(true);
  });
});

// ── Era 3: Cursor ─────────────────────────────────────────────────────────────
// Recomputed fixtures again, but from a DEAD corpus: state.vscdb was last written
// 2026-05-18 and Cursor is no longer in use, so unlike the Claude Code pins these are
// not expected to move. A red here means the generator changed, not the world.

const cursor = eras.eras.find((e) => e.id === 'cursor')!;

describe('cursor era metrics', () => {
  it('pins the session and message counts and the user/assistant split', () => {
    expect(cursor.metrics.sessions).toBe(<redacted>);
    expect(cursor.metrics.messages.total).toBe(<redacted>);
    expect(cursor.metrics.messages.user).toBe(<redacted>);
    expect(cursor.metrics.messages.assistant).toBe(<redacted>);
    expect(cursor.metrics.messages.untyped).toBe(623);
    const { user, assistant, untyped, total } = cursor.metrics.messages;
    expect(user + assistant + untyped).toBe(total);
  });

  it('pins the client-side token floor', () => {
    expect(cursor.metrics.tokens.input).toBe(<redacted>);
    expect(cursor.metrics.tokens.output).toBe(<redacted>);
  });

  it('carries both caveats as data, so the page cannot print the sum bare', () => {
    // The figure above is a FLOOR (only <redacted> of <redacted> bubbles carry a non-zero
    // tokenCount, and every one of them is an assistant turn) and an ESTIMATE (Cursor
    // computes it client-side; nothing here was billed). Dropping either flag from the
    // generator reds this — they are the page's obligation to render, in data form.
    expect(cursor.metrics.isFloor).toBe(true);
    expect(cursor.metrics.estimateSource).toBe('cursor-client');
    expect(cursor.metrics.pricedBubbles).toBe(<redacted>);
    expect(cursor.metrics.pricedBubblesAssistant).toBe(cursor.metrics.pricedBubbles);
    expect(cursor.metrics.nonZeroBubbleFraction).toBeCloseTo(0.0486, 4);
    expect(cursor.metrics.nonZeroBubbleFraction).toBeLessThan(0.1);
  });

  it('pins the log range and leaves cost unknown rather than estimating it (D4)', () => {
    expect([cursor.logStart, cursor.logEnd]).toEqual(['2025-07-09', '2026-05-18']);
    expect(cursor.logStart! <= cursor.logEnd!).toBe(true);
    // D4: no model name and no cost field exists anywhere in state.vscdb, so the era
    // states its absence in its own terms. A metrics.cost object appearing here would
    // mean someone estimated money from a token count — ground-truth-forbidden.
    expect(cursor.availability.cost).toBe('unknown-server-side');
    expect(cursor.availability.tokens).toBe('floor');
    expect('cost' in cursor.metrics).toBe(false);
  });
});

// ── Era 1: Continue ───────────────────────────────────────────────────────────
// A dead corpus too — the last token event is 2025-08-16 and the tool is long gone —
// so these pins are stable by nature. The interesting assertions here are not the sums
// but the two disagreements the era must keep visible: chat sessions stop five days in
// while token events run on for six more weeks, and cost is a near-zero FINDING rather
// than the unknown Cursor has.

const cont = eras.eras.find((e) => e.id === 'continue')!;

describe('continue era metrics', () => {
  it('pins the token sums and the event/session counts', () => {
    expect(cont.metrics.tokens.promptTokens).toBe(<redacted>);
    expect(cont.metrics.tokens.generatedTokens).toBe(<redacted>);
    expect(cont.metrics.tokens.events).toBe(<redacted>);
    expect(cont.metrics.sessions.count).toBe(16);
  });

  it('agrees with the sqlite mirror, and records the delta either way', () => {
    // The cross-check is emitted as data whether it agrees or not, so a future
    // regeneration that diverges becomes a visible finding instead of a silent pick.
    const check = cont.metrics.crossCheck;
    expect(check.mirror.promptTokens).toBe(cont.metrics.tokens.promptTokens);
    expect(check.mirror.generatedTokens).toBe(cont.metrics.tokens.generatedTokens);
    expect(check.mirror.events).toBe(cont.metrics.tokens.events);
    expect(Object.values(check.delta)).toEqual([0, 0, 0]);
    expect(check.agrees).toBe(true);
  });

  it('keeps the session range and the token-event range apart', () => {
    // They genuinely differ: the 16 chats stop 2025-07-09, autocomplete kept generating
    // to 2025-08-16. Collapsing them into one era range would shorten or lengthen it.
    expect([cont.metrics.sessions.start, cont.metrics.sessions.end]).toEqual([
      '2025-07-04',
      '2025-07-09',
    ]);
    expect([cont.logStart, cont.logEnd]).toEqual(['2025-07-04', '2025-08-16']);
    expect(cont.logEnd! > cont.metrics.sessions.end).toBe(true);
    // And the logs predate the config dir's first commit — the git spine is a floor on
    // this era's start, the mirror image of Claude Code's pruned-log finding.
    expect(cont.logStart! < cont.gitStart!).toBe(true);
  });

  it('states near-zero-local cost as a finding, distinct from Cursor unknown (D4)', () => {
    expect(cont.availability.cost).toBe('near-zero-local');
    expect(cont.metrics.costFinding).toBe('near-zero-local');
    expect(cursor.availability.cost).not.toBe(cont.availability.cost);
    // The evidence for the claim, not just the claim: the provider split has to show a
    // local-inference majority, or "near-zero marginal money" is an assertion.
    const events = cont.metrics.byProvider.events as Record<string, number>;
    expect(events.ollama / cont.metrics.tokens.events).toBeGreaterThan(0.9);
    expect(cont.metrics.byProvider.tokens.ollama.prompt).toBeGreaterThan(
      cont.metrics.byProvider.tokens.gemini.prompt,
    );
  });
});

// ── Eras 0 + 2: Copilot and Codex ─────────────────────────────────────────────
// The two eras the plan expected to be counts-only. Copilot is: no token field, no cost
// field, and its recomputed 86 turns did reproduce the brief's figure (the suspected
// collision with a Continue number was benign). Codex did NOT stay counts-only — see
// the token block below and the D2 amendment in the plan.

const copilot = eras.eras.find((e) => e.id === 'copilot')!;
const codex = eras.eras.find((e) => e.id === 'codex')!;

describe('copilot era metrics', () => {
  it('pins the recomputed session, turn and workspace counts', () => {
    expect(copilot.metrics.sessions).toBe(7);
    expect(copilot.metrics.turns).toBe(86);
    expect(copilot.metrics.workspacesWithChat).toBe(6);
    expect(copilot.metrics.workspacesWithChat).toBeLessThan(copilot.metrics.workspacesTotal);
  });

  it('records the absence of tokens and cost as data, and dates the era', () => {
    expect(copilot.metrics.tokenFieldPresent).toBe(false);
    expect(copilot.metrics.costFieldPresent).toBe(false);
    expect(copilot.availability.tokens).toBe('none');
    // D4: `absent` is the free tier billing nothing — NOT Cursor's server-side unknown.
    expect(copilot.availability.cost).toBe('absent');
    expect(copilot.availability.cost).not.toBe(cursor.availability.cost);
    expect([copilot.logStart, copilot.logEnd]).toEqual(['2025-06-20', '2025-12-08']);
  });
});

describe('codex era metrics', () => {
  it('counts BOTH rollout header formats', () => {
    // The finding that overturned the plan's Era 2 givens: reading only the old
    // top-level {id} header sees 137 files and calls that the session count. A parser
    // that regresses to one shape reds here, because the format split is pinned.
    expect(codex.metrics.files).toBe(223);
    expect(codex.metrics.sessions).toBe(223);
    expect(codex.metrics.headerFormats['top-level-id']).toBe(137);
    expect(codex.metrics.headerFormats['session_meta']).toBe(86);
    const formats = Object.values(codex.metrics.headerFormats) as number[];
    expect(formats.reduce((a, b) => a + b, 0)).toBe(codex.metrics.files);
  });

  it('separates injected context turns from human prompts', () => {
    expect(codex.metrics.prompts).toBe(<redacted>);
    expect(codex.metrics.environmentPrompts).toBe(463);
    expect(codex.metrics.humanPrompts).toBe(<redacted>);
    expect(codex.metrics.humanPrompts + codex.metrics.environmentPrompts).toBe(codex.metrics.prompts);
  });

  it('carries a token floor with its own partial-logging reason (D2 as amended)', () => {
    // Codex joins the headline as the fourth token-bearing tool, but its floor has a
    // DIFFERENT reason from Cursor's: the token_count event only exists from
    // 2025-09-23, so the first weeks of the era contribute nothing.
    expect(codex.availability.tokens).toBe('floor');
    expect(codex.metrics.tokens.partialLogging).toBe(true);
    expect(codex.metrics.tokens.loggingStart).toBe('2025-09-23');
    expect(codex.metrics.tokens.loggingStart! > codex.logStart!).toBe(true);
    expect(codex.metrics.tokens.filesWithTokens).toBe(83);
    expect(codex.metrics.tokens.filesWithTokens).toBeLessThan(codex.metrics.files);
    expect(codex.metrics.tokens.input_tokens).toBe(<redacted>);
    expect(codex.metrics.tokens.output_tokens).toBe(<redacted>);
  });

  it('keeps cached input as a SUBSET of input, never an extra class', () => {
    // OpenAI's cached_input_tokens is already inside input_tokens, and
    // reasoning_output_tokens inside output_tokens — adding either to a headline
    // double-counts. The identity below is what the measured data actually satisfies
    // (total = input + output, both subsets excluded), and it is the falsifier for
    // treating either subset as a fifth class.
    const t = codex.metrics.tokens;
    expect(t.cached_input_tokens).toBeLessThan(t.input_tokens);
    expect(t.reasoning_output_tokens).toBeLessThan(t.output_tokens);
    expect(t.input_tokens + t.output_tokens).toBe(t.total_tokens);
  });

  it('leaves cost unknown and never derives money from the tokens (D4)', () => {
    expect(codex.availability.cost).toBe('unknown-server-side');
    expect('cost' in codex.metrics).toBe(false);
  });
});

describe('the cross-era token headline (D2 as amended)', () => {
  it('is a floor over exactly four of the five tools', () => {
    const bearing = eras.eras.filter((e) => e.availability.tokens !== 'none');
    expect(bearing.map((e) => e.id)).toEqual(['continue', 'codex', 'cursor', 'claude-code']);
    // Two of the four are floors, for two different reasons — the label the page prints
    // ("4 of 5 tools", "≥") is only honest while both remain true.
    const floors = bearing.filter((e) => e.availability.tokens === 'floor');
    expect(floors.map((e) => e.id)).toEqual(['codex', 'cursor']);
    expect(eras.eras).toHaveLength(5);
  });
});

describe('skills — a Claude-Code-era-only attribute (D6: git headline only)', () => {
  const cc = eras.eras.find((e) => e.id === 'claude-code')!;

  it('pins the live skill count and the commit floor, both scoped to skills/', () => {
    // Recomputed by scripts/measurements-skills.py from git before being pinned. The
    // red demo widens either scope — SKILL.md repo-wide, or all commits rather than
    // those touching skills/ — and both figures below move.
    expect(cc.skills.liveSkillFiles).toBe(29);
    expect(cc.skills.commits).toBe(103);
    expect(cc.skills.vcStart).toBe('2026-07-09');
    expect(cc.skills.vcEnd).toBe('2026-08-20');
  });

  it('flags the count a floor over version-control dates, never authoring dates', () => {
    // Without this the 103 reads as "all the iteration there was". The example is the
    // proof it is not: authored on/before its 2026-06-18 snapshot, one commit, 2026-08-20.
    expect(cc.skills.commitsAreFloor).toBe(true);
    expect(cc.skills.datesAre).toBe('adopted-into-vc');
    expect(cc.skills.example.name).toBe('detect-ai-text-cl-op');
    expect(cc.skills.example.bucket).toBe('original');
    expect(cc.skills.example.commits).toBe(1);
    expect(cc.skills.example.snapshotDate < cc.skills.example.firstCommit).toBe(true);
  });

  it('gives no era before Claude Code a skills block at all', () => {
    const withBlock = eras.eras.filter((e) => 'skills' in e);
    expect(withBlock.map((e) => e.id)).toEqual(['claude-code']);
  });
});

describe('stt-faster experimentation corpus (D7: counts + a one-file schema probe)', () => {
  const stt = (eras as { sttFaster: any }).sttFaster;

  it('keeps the three .bat generations split, never collapsed into one total', () => {
    // The split IS the measurement — three stacked harness generations, none deleted.
    // The red demo sums them, and the per-generation pins below go undefined.
    expect(stt.batGenerations).toEqual({ root: 8, bat: 8, old_bat: 7 });
    expect(stt.batTotal).toBe(23);
    expect(stt.files).toEqual({ txt: 175, aac: 120, json: 38 });
  });

  it('records failed/ as empty and names the superseded generations instead', () => {
    // There is no failure log here; the "what didn't work" evidence is what was
    // abandoned. Stating the emptiness stops a later session hunting for it.
    expect(stt.failedDirEmpty).toBe(true);
    expect(stt.supersededGenerations).toContain('old_bat');
    expect(stt.abandonedRuntimeVariants).toEqual(['_docker', '_32bit_cpu']);
  });

  it('reports the sampled schema and refuses the benchmark claim it does not support', () => {
    // One .json was read, not 38. It is raw transcription output with no per-variant
    // comparison, so the corpus stays a generation count.
    expect(stt.schemaSampledFrom).toBe(1);
    expect(stt.isBenchmark).toBe(false);
  });

  it('shows the corpus-vs-repo span delta rather than reconciling it', () => {
    expect(stt.mtimeStart).toBe('2025-12-04');
    expect(stt.mtimeEnd).toBe('2026-09-01');
    expect(stt.repo.commits).toBe(274);
    // The corpus starts after the repo does and ends just before it — both real, both shown.
    expect(stt.mtimeStart > stt.repo.gitStart).toBe(true);
    expect(stt.mtimeEnd < stt.repo.gitEnd).toBe(true);
  });

  it('lets no transcript text, filename or person name reach an emitted field', () => {
    // The sanitisation guard, enforced not documented. Every string the block emits
    // must be structural — a key-shaped token, a date, or one of the two documented
    // prose fields. A transcript snippet or a source filename injected anywhere reds.
    const strings: string[] = [];
    const walk = (node: unknown) => {
      if (typeof node === 'string') strings.push(node);
      else if (Array.isArray(node)) node.forEach(walk);
      else if (node && typeof node === 'object') Object.values(node).forEach(walk);
    };
    walk(stt);
    const structural = /^(_?[a-z0-9][a-z0-9_]*(\.bat)?|\d{4}-\d{2}-\d{2}|OLD_compare_variants\.bat)$/;
    const prose = [stt.schemaFinding];
    for (const value of strings) {
      if (prose.includes(value)) continue;
      expect(structural.test(value), `non-structural emitted string: ${value}`).toBe(true);
    }
    // The prose fields carry no source filename either.
    for (const line of prose) {
      expect(/\.(aac|txt|json)\b/.test(line), `filename in prose: ${line}`).toBe(false);
    }
  });
});

// ── inc5a Stage 8: the derived LIB views (D8 — pin the lib, NOT built dist/) ────
// These assert over src/lib/measurements.ts, the same data the /measurements/ page
// renders. A pure render regression is out of scope by D8; a build break still reds
// through `astro build` in the gate.
import {
  allCaveatLines,
  availabilityMatrix,
  caveats,
  eraSpans,
  overlaps,
  overlappingPairs,
  tokenHeadline,
} from '../src/lib/measurements';

describe('measurements lib — overlap view (D8: derived, not dist/)', () => {
  it('has at least two era spans that intersect in time', () => {
    // The structural guard against a false "sequential" claim: if the axis laid the
    // eras end-to-end, no two spans would share a column and this reds.
    const cursor = eraSpans.find((s) => s.id === 'cursor')!;
    const codex = eraSpans.find((s) => s.id === 'codex')!;
    expect(overlaps(cursor, codex)).toBe(true);
    expect(overlappingPairs.length).toBeGreaterThanOrEqual(1);
  });

  it('names the Cursor∩Codex overlap in the derived pairs list', () => {
    const hasCursorCodex = overlappingPairs.some(
      (p) =>
        (p.a === 'cursor' && p.b === 'codex') || (p.a === 'codex' && p.b === 'cursor'),
    );
    expect(hasCursorCodex).toBe(true);
  });
});

describe('measurements lib — caveats never silently drop (D8)', () => {
  it('carries the Cursor floor and client-side-estimate caveats', () => {
    // Flatten first so removing the whole Cursor entry reds this as a clean assertion,
    // not a crash on a missing entry — the caveat's absence is the failure, either way.
    const cursorLines = caveats.filter((c) => c.id === 'cursor').flatMap((c) => c.lines);
    expect(cursorLines.some((l) => /floor/i.test(l))).toBe(true);
    expect(cursorLines.some((l) => /client-side estimate/i.test(l))).toBe(true);
  });

  it('carries the Continue near-zero-local finding', () => {
    const cont = caveats.find((c) => c.id === 'continue')!;
    expect(cont.lines.some((l) => /near-zero-local/i.test(l))).toBe(true);
    // and it survives into the flattened page-wide list the presence check would use
    expect(allCaveatLines.some((l) => /near-zero-local/i.test(l))).toBe(true);
  });
});

describe('measurements lib — availability matrix (D5/D6)', () => {
  it('names all five eras in spec order', () => {
    expect(availabilityMatrix.map((r) => r.id)).toEqual([...EXPECTED_IDS]);
  });

  it('renders the skills row empty for eras 0–3 and populated only for Claude Code', () => {
    const withSkills = availabilityMatrix.filter((r) => r.skills !== null);
    expect(withSkills.map((r) => r.id)).toEqual(['claude-code']);
    // the emptiness must be representable, not hidden: the first four are literally null
    for (const row of availabilityMatrix.slice(0, 4)) {
      expect(row.skills, `${row.id} skills`).toBeNull();
    }
  });
});

describe('measurements lib — token headline floor (D2 as amended)', () => {
  it('is a floor over exactly the four token-bearing tools', () => {
    expect(tokenHeadline.contributions.map((c) => c.id)).toEqual([
      'continue',
      'codex',
      'cursor',
      'claude-code',
    ]);
    expect(tokenHeadline.bearingCount).toBe(4);
    expect(tokenHeadline.totalTools).toBe(5);
  });

  it('keeps cacheRead OUT of the headline sum', () => {
    // The floor is exactly the sum of the three-class contributions; cacheRead is real
    // and large but must not be inside it. Folding it in would break this identity.
    const summed = tokenHeadline.contributions.reduce((a, c) => a + c.headline, 0);
    expect(tokenHeadline.floor).toBe(summed);
    expect(tokenHeadline.cacheRead).toBeGreaterThan(0);
    expect(tokenHeadline.floor + tokenHeadline.cacheRead).not.toBe(tokenHeadline.floor);
  });
});

// ── inc5a Stage 9: the citable narrative ↔ JSON mirror tests ───────────────────
// content/measurements/*.md is the single source every chapter/slide/post cites.
// A headline figure printed there must equal what the lib derives from eras.json,
// or it reds — the MIN_COMMITS-mirror pattern applied to prose. The canonical
// strings below are COMPUTED from src/lib/measurements.ts, never restated as
// literals, so a figure fabricated in the .md with no JSON backing has nothing to
// match and reds too. Read hermetically from disk (node:fs), never via git.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { costStates, eras as libEras, skills, sttFaster } from '../src/lib/measurements';

const MEAS_DIR = join(process.cwd(), 'content', 'measurements');
const readMeas = (file: string) => readFileSync(join(MEAS_DIR, file), 'utf8');
const measFiles = () => readdirSync(MEAS_DIR).filter((f) => f.endsWith('.md'));
const corpus = () => measFiles().map(readMeas).join('\n');

const nf = (n: number) => n.toLocaleString('en-US');
const libEra = (id: string) => libEras.find((e) => e.id === id)!;
const contrib = (id: string) => tokenHeadline.contributions.find((c) => c.id === id)!;
const ccContrib = contrib('claude-code');
const copilotMetrics = libEra('copilot').metrics;
const contMetrics = libEra('continue').metrics;
const codexMetrics = libEra('codex').metrics;
const cursorMetrics = libEra('cursor').metrics;
const ccMain = libEra('claude-code').metrics.main;
const ccSub = libEra('claude-code').metrics.subagent;
const ccCost = libEra('claude-code').metrics.cost;
const ccSkills = skills!;
const bt = '`'; // backtick, so the stt split strings mirror the .md verbatim
const ccUsd = costStates.find((r) => r.id === 'claude-code')!.usd!;

// [file, [canonical strings the file must print verbatim]] — every string derived
// from the lib. The exact figure the JSON produces has to appear; rounded prose
// beside it ("~224M input tokens, a floor") is free and unpinned.
const PINNED: [string, string[]][] = [
  [
    '00-copilot.md',
    [
      `${copilotMetrics.workspacesWithChat} of ${copilotMetrics.workspacesTotal}`,
      nf(copilotMetrics.turns),
      nf(copilotMetrics.sessions),
    ],
  ],
  [
    '01-continue.md',
    [
      nf(contrib('continue').headline),
      nf(contMetrics.tokens.promptTokens),
      nf(contMetrics.tokens.generatedTokens),
      nf(contMetrics.tokens.events),
      nf(contMetrics.sessions.count),
    ],
  ],
  [
    '02-codex.md',
    [
      nf(contrib('codex').headline),
      nf(codexMetrics.humanPrompts),
      nf(codexMetrics.environmentPrompts),
      nf(codexMetrics.prompts),
      nf(codexMetrics.files),
      nf(codexMetrics.headerFormats['top-level-id']),
      nf(codexMetrics.headerFormats['session_meta']),
      nf(codexMetrics.tokens.input_tokens),
      nf(codexMetrics.tokens.output_tokens),
      nf(codexMetrics.tokens.cached_input_tokens),
      `${codexMetrics.tokens.filesWithTokens} of ${codexMetrics.files}`,
    ],
  ],
  [
    '03-cursor.md',
    [
      nf(cursorMetrics.tokens.input),
      nf(cursorMetrics.tokens.output),
      nf(cursorMetrics.sessions),
      nf(cursorMetrics.messages.total),
      nf(cursorMetrics.messages.user),
      nf(cursorMetrics.messages.assistant),
      `${nf(cursorMetrics.pricedBubbles)} of ${nf(cursorMetrics.messages.total)}`,
      `${(cursorMetrics.nonZeroBubbleFraction * 100).toFixed(2)}%`,
      // ...and the two counts that fraction is OF, so the denominator cannot drift
      // away from the claim the way "of its assistant messages" did in review.
      `${nf(cursorMetrics.pricedBubbles)} of ${nf(cursorMetrics.messages.total)}`,
    ],
  ],
  [
    '04-claude-code.md',
    [
      nf(ccContrib.sides!.mainPlusSubagent.headline),
      nf(ccContrib.sides!.main.headline),
      nf(tokenHeadline.floor),
      `$${nf(Math.round(ccUsd))}`,
      nf(ccMain.sessions),
      nf(ccMain.files),
      nf(ccSub.files),
      nf(ccSub.parentSessions),
      nf(ccCost.sessionsWithCostState),
      nf(ccSkills.liveSkillFiles),
      nf(ccSkills.commits),
    ],
  ],
  [
    '05-stt-corpus.md',
    [
      nf(sttFaster.batTotal),
      nf(sttFaster.files.txt),
      nf(sttFaster.files.aac),
      nf(sttFaster.files.json),
      `root ${sttFaster.batGenerations.root}`,
      `bat/${bt} ${sttFaster.batGenerations.bat}`,
      `old_bat/${bt} ${sttFaster.batGenerations.old_bat}`,
    ],
  ],
];

describe('measurements narrative ↔ JSON mirror (Stage 9)', () => {
  it.each(PINNED)('%s prints every headline figure exactly as the JSON derives it', (file, figures) => {
    const body = readMeas(file);
    for (const figure of figures) {
      expect(body.includes(figure), `${file}: missing canonical figure ${figure}`).toBe(true);
    }
  });

  it('gives every measurement file a "measured how" line', () => {
    // Anti-hype rule: a number without how it was measured is not evidence. Deleting
    // a "Measured how:" line from any file reds this.
    const files = measFiles();
    expect(files.length).toBeGreaterThanOrEqual(5);
    for (const file of files) {
      expect(/measured how/i.test(readMeas(file)), `${file}: no measured-how line`).toBe(true);
    }
  });

  it('states the eras overlap, naming the Cursor∩Codex pair in prose', () => {
    // The structural finding the prose must carry, not only the axis: at least one
    // file says the eras overlap AND names both Cursor and Codex in that context.
    const stated = measFiles()
      .map(readMeas)
      .some((b) => /overlap|concurrent/i.test(b) && /cursor/i.test(b) && /codex/i.test(b));
    expect(stated).toBe(true);
  });

  it('names all four distinct cost states in the prose', () => {
    // Derived from the lib, not restated: near-zero-local is a FINDING, not an
    // unknown — the four must each be named so the page cannot flatten them.
    const states = [...new Set(costStates.map((r) => r.state))];
    expect(states.length).toBe(4);
    const text = corpus();
    for (const state of states) {
      expect(text.includes(state), `cost state not named in prose: ${state}`).toBe(true);
    }
  });
});

// ── inc5b: the deck chapters ↔ JSON mirror ────────────────────────────────────
// Same contract as the Stage-9 block above, applied to content/journey/. A deck
// chapter that quotes a measured figure must print exactly what the lib derives,
// so a figure edited in prose without the JSON moving reds here. Every expected
// string is COMPUTED — a fabricated figure has nothing to match.
const JOURNEY_DIR = join(process.cwd(), 'content', 'journey');
const readChapter = (file: string) => readFileSync(join(JOURNEY_DIR, file), 'utf8');
const usd2 = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const JOURNEY_PINNED: [string, string[]][] = [
  [
    '90-what-i-got-wrong.md',
    [
      // Copilot's recoverable remnant: turns, and the workspace ratio behind them.
      `${nf(copilotMetrics.turns)} turns`,
      `${copilotMetrics.workspacesWithChat} of ${copilotMetrics.workspacesTotal}`,
      // Cursor's session count and the priced fraction that makes its tokens a floor.
      `${nf(cursorMetrics.sessions)} sessions`,
      `${(cursorMetrics.nonZeroBubbleFraction * 100).toFixed(2)}%`,
      // ...and the two counts that fraction is OF, so the denominator cannot drift
      // away from the claim the way "of its assistant messages" did in review.
      `${nf(cursorMetrics.pricedBubbles)} of ${nf(cursorMetrics.messages.total)}`,
      // Codex logged tokens only from this date — the reason its total is a floor.
      `${codexMetrics.tokens.loggingStart}`,
      // The one era with a derived figure rather than a state.
      `$${usd2(ccUsd)}`,
    ],
  ],
];

describe('journey deck chapters ↔ JSON mirror (inc5b)', () => {
  it.each(JOURNEY_PINNED)('%s prints every quoted figure exactly as the JSON derives it', (file, figures) => {
    const body = readChapter(file);
    for (const figure of figures) {
      expect(body.includes(figure), `${file}: missing canonical figure ${figure}`).toBe(true);
    }
  });

  it('names all four cost states in the chapter that is about the absences', () => {
    // The chapter's whole argument is that three of the four answers are states,
    // not numbers. This is a presence floor, not proof each state is used
    // meaningfully: one enumerating sentence satisfies it. What it does catch is a
    // state being renamed in the lib, or dropped from the chapter entirely.
    const body = readChapter('90-what-i-got-wrong.md');
    const states = [...new Set(costStates.map((r) => r.state))];
    expect(states.length).toBe(4);
    for (const state of states) {
      expect(body.includes(state), `cost state not named: ${state}`).toBe(true);
    }
  });
});
