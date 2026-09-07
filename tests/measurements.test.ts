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
