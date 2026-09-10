// Shared, typed reading of `content/measurements/data/eras.json` for the
// /measurements/ route (and the mirror tests). That JSON is GENERATED —
// `make measurements` fills a PRIVATE full store under `sources/` (gitignored), and
// `scripts/measurements-public.py` redacts it into the committed file this module
// reads. Never hand-edit it, and never re-derive these views from a chapter.
//
// The redaction policy, restated here because this module is where a breach would
// surface: the public data carries **states, dates and shares** — no absolute token
// volume, no session or message count, and no money figure at all. Every view below is
// therefore relative or categorical by construction. There is nothing to unredact: an
// absolute cannot be recovered from a share whose denominator is unpublished.
//
// The binding shape rule (inc5a D5): the eras are a LIST, never a hardcoded pair or a
// three-band collapse. Nothing here hardcodes the count or a fixed pair — every view
// maps over `eras`. `group` is a colour/section tag only; it never reduces the rows to
// their groups.
//
// One era (`chat`) has neither a git range nor a log: ChatGPT's web app wrote nothing to
// the machine. Its span comes from an authored date BRACKET, and `dateMethod` marks it
// `estimated` where every other era is `measured`. The two are different kinds of claim
// and no view here may flatten them into one.
import data from '../../content/measurements/data/eras.json';

// ── Raw JSON shapes ───────────────────────────────────────────────────────────
// `coverage` differs per era by construction (each tool measures to a different depth),
// so it stays loosely typed here — tests/measurements-*.test.ts pins the per-era shapes.
export type EraId = 'chat' | 'copilot' | 'continue' | 'codex' | 'cursor' | 'gemini' | 'claude-code';
export type TokenState = 'yes' | 'floor' | 'none';
export type Group = 'chat' | 'vscode-plugin' | 'cursor' | 'gemini' | 'claude-code';
/** How an era's span was arrived at. `estimated` is a bracket, never a record. */
export type DateMethod = 'estimated' | 'measured';

export interface Availability {
  tokens: TokenState;
  counts: string;
  skills: 'yes' | 'none';
}

export interface SkillsBlock {
  liveSkillFiles: number;
  commits: number;
  commitsAreFloor: boolean;
  datesAre: string;
  vcStart: string;
  vcEnd: string;
  caveat: string;
  example: { name: string; bucket: string; commits: number; firstCommit: string; snapshotDate: string };
}

export interface GovernanceBlock {
  hookEvents: number;
  hookCommands: number;
  memoryFiles: number;
  memoryProjects: number;
  caveat: string;
}

/** Era-start dates that survive log pruning (Claude Code only, so far). */
export interface EraOnset {
  firstToken: string; // first token ever spent in this tool — the era's real start
  firstTokenStamp: string;
  firstStart: string | null; // first launch of the binary; NOT the same event
  firstStartStamp: string | null;
  firstPromptStamp: string | null; // corroboration from a second file
  firstPromptProject: string | null;
  logsArePruned: boolean;
  source: string;
}

export interface Era {
  id: EraId;
  tool: string;
  group: Group;
  availability: Availability;
  configDir: string | null;
  gitCommits: number | null;
  gitStart: string | null;
  gitEnd: string | null;
  /** Null for an era that kept no log at all — an absence, never an empty string. */
  logStart: string | null;
  logEnd: string | null;
  /** Authored bracket, present only where neither git nor a log dates the era. */
  dateLow: string | null;
  dateHigh: string | null;
  dateMethod: DateMethod;
  provenance: { git: string | null; logs: string; skills?: string; configRepo: string };
  coverage: Record<string, any>;
  /** Fraction of the combined cross-era floor. `null` for a tool that logs no tokens. */
  share: number | null;
  skills?: SkillsBlock;
  governance?: GovernanceBlock;
  onset?: EraOnset;
}

/** What the public store deliberately does not contain, as data the page can render. */
export interface Redaction {
  policy: string;
  bearingTools: number;
  totalTools: number;
  withheld: string[];
  note: string;
}

/** The eras, in spec order (ChatGPT → Claude Code). A list, never a pair. */
export const eras = data.eras as unknown as Era[];

/** The redaction declaration — rendered on the page, never silently assumed. */
export const redaction = (data as { redaction: Redaction }).redaction;

/** The stt-faster experimentation corpus — a top-level sibling of the era list. */
export const sttFaster = (data as { sttFaster: Record<string, any> }).sttFaster;

// ── Time axis over the REAL spans ─────────────────────────────────────────────
// Each era's displayed span is the UNION of its git range, its log range and its
// authored bracket — the first two disagree (that is a shown finding, below), so the
// axis must cover both. Copilot has no git range (gitStart/gitEnd null), so the union
// folds to the log range alone; the chat era has neither, so it folds to the bracket.
// `minDate`/`maxDate` already filter nulls, so a third source is an extra argument
// rather than a new abstraction (inc5c refactor ruling).
export type Domain<T> = readonly [T, T];

function minDate(...dates: (string | null)[]): string {
  return dates.filter((d): d is string => d !== null).reduce((a, b) => (a < b ? a : b));
}
function maxDate(...dates: (string | null)[]): string {
  return dates.filter((d): d is string => d !== null).reduce((a, b) => (a > b ? a : b));
}

export interface EraSpan {
  id: EraId;
  tool: string;
  group: Group;
  start: string; // union start of git + log
  end: string; // union end of git + log
  // The era's real start where a pruning-proof artifact dates it. Kept SEPARATE from
  // `start`, which stays the record start: the gap between the two is the finding, and
  // the page draws it inside the bar rather than erasing it.
  onset: string | null;
  onsetLeadDays: number | null; // start - onset, positive = the records start late
  // Where the bar is DRAWN from: the earliest thing that dates the era, so a pruned log
  // does not shorten it. Folds onset in; equals `start` for every era without one.
  barStart: string;
  // Read from the data, never a hardcoded string: the page's badge must be able to say
  // "estimated" only where the store says the dates are.
  dateMethod: DateMethod;
}

/** Per-era displayed span (git ∪ log), derived — never hardcoded. */
export const eraSpans: EraSpan[] = eras.map((e) => ({
  id: e.id,
  tool: e.tool,
  group: e.group,
  start: minDate(e.gitStart, e.logStart, e.dateLow),
  end: maxDate(e.gitEnd, e.logEnd, e.dateHigh),
  onset: e.onset?.firstToken ?? null,
  onsetLeadDays: e.onset
    ? days(minDate(e.gitStart, e.logStart, e.dateLow)) - days(e.onset.firstToken)
    : null,
  barStart: minDate(e.gitStart, e.logStart, e.dateLow, e.onset?.firstToken ?? null),
  dateMethod: e.dateMethod,
}));

// DERIVED from the spans, so a regenerated eras.json widens the axis instead of
// clamping against a stale literal. Exported and pinned by a test that names the data.
export const TIME_DOMAIN: Domain<string> = [
  eraSpans.reduce((min, s) => (s.barStart < min ? s.barStart : min), eraSpans[0]!.barStart),
  eraSpans.reduce((max, s) => (s.end > max ? s.end : max), eraSpans[0]!.end),
];

function days(date: string): number {
  return Date.parse(`${date}T00:00:00Z`) / 86_400_000;
}
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Position of an ISO date on the shared time axis, as a fraction in [0, 1]. */
export function dateFraction(date: string, domain: Domain<string> = TIME_DOMAIN): number {
  const [start, end] = domain;
  const span = days(end) - days(start);
  if (span <= 0) return 0;
  return clamp((days(date) - days(start)) / span, 0, 1);
}

// ── Overlap: the structural guard against a false "sequential" claim ───────────
/** Two spans overlap iff each starts on or before the other ends (closed intervals). */
export function overlaps(a: EraSpan, b: EraSpan): boolean {
  return a.start <= b.end && b.start <= a.end;
}

export interface OverlapPair {
  a: EraId;
  b: EraId;
  start: string; // the shared interval
  end: string;
}

/** Every unordered pair of eras whose displayed spans intersect — derived, non-empty. */
export const overlappingPairs: OverlapPair[] = eras.flatMap((_, i) =>
  eraSpans.slice(i + 1).map((b) => ({ a: eraSpans[i]!, b })).filter(({ a, b }) => overlaps(a, b)).map(
    ({ a, b }) => ({
      a: a.id,
      b: b.id,
      start: a.start > b.start ? a.start : b.start,
      end: a.end < b.end ? a.end : b.end,
    }),
  ),
);

/** The overlapping pairs named for the axis's `data-overlap` attribute. */
export const overlapLabel = overlappingPairs.map((p) => `${p.a}∩${p.b}`).join(' ');

// ── Token SHAPE: shares of a floor whose total is not published ────────────────
// The replacement for the old absolute headline. Each token-bearing tool carries its
// fraction of the combined cross-era floor; the floor itself lives in the private
// store, so these four numbers say which tool dominated without saying how much
// anything was. `share` is null for Copilot, which logs no token field at all — that
// null renders as a named absence and must never render as a zero.
export interface ShareRow {
  id: EraId;
  tool: string;
  state: TokenState;
  share: number | null; // fraction of the floor, or null for a non-bearing tool
  /** Bar width in [0, 1] on a log scale, so a <1% share is still visible beside a 60%
   *  one. Deliberately unlabelled on the page: it encodes rank and rough spread, and
   *  refuses to be read back as a quantity. */
  logWidth: number;
  qualifier: string; // what makes this share a floor, or what makes it exact
}

// A share three decades below the largest still has to be visible, so the bar is
// log-scaled across that range and clamped at the bottom.
const LOG_FLOOR = 1e-4;
function logWidth(share: number | null): number {
  if (!share || share <= 0) return 0;
  const decades = Math.log10(1 / LOG_FLOOR);
  return clamp((Math.log10(Math.max(share, LOG_FLOOR)) - Math.log10(LOG_FLOOR)) / decades, 0, 1);
}

const SHARE_QUALIFIER: Record<EraId, string> = {
  chat: 'A browser tab logged nothing locally — the era has no share to take.',
  copilot: 'No token field exists in these logs — an absence, not a zero.',
  continue: 'Exact: every token event is logged, and a SQLite mirror agrees to the event.',
  codex: 'A floor — the token_count event only starts 2025-09-23, in a third of the rollouts.',
  cursor: "A floor, and Cursor's own client-side estimate — 4.86% of bubbles carry a count.",
  gemini: 'The Gemini CLI kept no local token or session log on this machine — an absence, not a zero.',
  'claude-code': 'Exact within the surviving transcripts, which Claude Code prunes as it goes.',
};

export const tokenShape = {
  bearingCount: redaction.bearingTools, // 4
  totalTools: redaction.totalTools, // 5
  label: `token share · ${redaction.bearingTools} of ${redaction.totalTools} tools log any`,
  rows: eras.map<ShareRow>((e) => ({
    id: e.id,
    tool: e.tool,
    state: e.availability.tokens,
    share: e.share,
    logWidth: logWidth(e.share),
    qualifier: SHARE_QUALIFIER[e.id],
  })),
  /** The shares of the bearing tools sum to 1 — the guard that no tool was dropped. */
  get bearingRows(): ShareRow[] {
    return this.rows.filter((r) => r.share !== null);
  },
  get shareTotal(): number {
    return this.bearingRows.reduce((sum, r) => sum + (r.share ?? 0), 0);
  },
};

// ── What is NOT published, as a first-class view ───────────────────────────────
// The withheld list is rendered, not implied. A reader who wants to know why there is
// no total on this page gets told, in the same table as the shares.
export const withheld: string[] = redaction.withheld;

// ── Cross-check: git range vs log range, the delta SHOWN not reconciled ────────
export interface CrossCheckRow {
  id: EraId;
  tool: string;
  gitStart: string | null;
  gitEnd: string | null;
  logStart: string | null;
  logEnd: string | null;
  startDeltaDays: number | null; // log - git, positive = log starts later
  endDeltaDays: number | null;
  disagrees: boolean; // any non-zero delta; false only when git ranges git == log
}

export const crossCheck: CrossCheckRow[] = eras.map((e) => {
  // Both records must exist for a delta to mean anything. An era missing either has no
  // disagreement to report — which is not the same as agreeing, and renders as neither.
  const hasBoth =
    e.gitStart !== null && e.gitEnd !== null && e.logStart !== null && e.logEnd !== null;
  const startDeltaDays = hasBoth ? days(e.logStart!) - days(e.gitStart!) : null;
  const endDeltaDays = hasBoth ? days(e.logEnd!) - days(e.gitEnd!) : null;
  return {
    id: e.id,
    tool: e.tool,
    gitStart: e.gitStart,
    gitEnd: e.gitEnd,
    logStart: e.logStart,
    logEnd: e.logEnd,
    startDeltaDays,
    endDeltaDays,
    disagrees: hasBoth ? startDeltaDays !== 0 || endDeltaDays !== 0 : false,
  };
});

// ── Availability matrix: one named row per era; skills empty before Claude Code ──
export interface MatrixRow {
  id: EraId;
  tool: string;
  group: Group;
  tokens: TokenState;
  counts: string;
  skills: SkillsBlock | null; // null renders EMPTY — the emptiness must show, not hide
}

export const availabilityMatrix: MatrixRow[] = eras.map((e) => ({
  id: e.id,
  tool: e.tool,
  group: e.group,
  tokens: e.availability.tokens,
  counts: e.availability.counts,
  skills: e.skills ?? null,
}));

// ── Caveats: the findings that must never silently drop, as derived data ───────
// Authored here (not in the JSON) because they are the PAGE's rendering obligation.
// The mirror tests assert each string is present; a red demo removes one and reds.
export interface EraCaveats {
  id: EraId;
  tool: string;
  lines: string[];
}

export const caveats: EraCaveats[] = [
  {
    id: 'copilot',
    tool: 'GitHub Copilot Chat',
    lines: ['No token field in any session JSON — the era has no share to take.'],
  },
  {
    id: 'codex',
    tool: 'OpenAI Codex plugin',
    lines: [
      'A floor — the token_count event only starts 2025-09-23.',
      'Counts come from the rollout jsonl; history.jsonl is a 3-line stub.',
    ],
  },
  {
    id: 'cursor',
    tool: 'Cursor',
    lines: [
      'A floor — 4.86% of message bubbles carry a count, all of them assistant turns.',
      "Cursor's own client-side estimate; nothing here was billed.",
    ],
  },
];

/** Flattened caveat lines for a page-wide presence check. */
export const allCaveatLines: string[] = caveats.flatMap((c) => c.lines);

// ── Skills: a Claude-Code-era-only attribute (D6) ──────────────────────────────
/** The skills block, exposed only for Claude Code (undefined for every other era). */
export const skills: SkillsBlock | undefined = eras.find((e) => e.id === 'claude-code')?.skills;

// ── Governance: hook and memory counts (inc5e) ────────────────────────────────
/** The governance block, Claude-Code-era-only for the same reason skills is. */
export const governance: GovernanceBlock | undefined = eras.find(
  (e) => e.id === 'claude-code',
)?.governance;

export interface GovernanceRow {
  label: string;
  value: number;
  qualifier: string;
}

/**
 * The rows the page renders. Every value is read from the store — a figure typed into
 * markup here would survive a regen that moved it, which is exactly the drift the
 * counts exist to expose.
 */
export const governanceRows: GovernanceRow[] =
  governance && skills
    ? [
        {
          label: 'hook commands',
          value: governance.hookCommands,
          qualifier: `wired across ${governance.hookEvents} events — commands, not the matcher groups holding them, and not the scripts on disk`,
        },
        {
          label: 'memory files',
          value: governance.memoryFiles,
          qualifier: `across ${governance.memoryProjects} project dirs that hold at least one`,
        },
        {
          label: 'commits touching skills/',
          value: skills.commits,
          qualifier: `a floor — ${skills.vcStart}..${skills.vcEnd}, and skills authored before the dir entered version control contribute zero`,
        },
        {
          label: 'live SKILL.md files',
          value: skills.liveSkillFiles,
          qualifier: 'a count of the tree today, with no history behind it',
        },
      ]
    : [];

// ── Abandonment traces: how widely a tool was set up vs how much it got used ────
// Ladder §2's corroboration that the overlap is one of RUNG, not only of time. Each
// figure is a config/install count beside a use count; the gap is the trace a tool
// left as it fell out of use — an abandonment trace, never a satisfaction score,
// which is what lets it stand as evidence. Read from the store like every view here,
// with Gemini's own date window carried alongside so a comparative reading keeps its
// months rather than floating free of them.
const coverageOf = (id: EraId): Record<string, unknown> =>
  eras.find((e) => e.id === id)?.coverage ?? {};

export const abandonmentTraces = {
  copilot: {
    workspacesTotal: coverageOf('copilot').workspacesTotal as number,
    workspacesWithChat: coverageOf('copilot').workspacesWithChat as number,
  },
  gemini: {
    configuredRepos: coverageOf('gemini').configuredRepos as number,
    geminiMdFiles: coverageOf('gemini').geminiMdFiles as number, // auto-loaded GEMINI.md (uppercase)
    guidelineFiles: coverageOf('gemini').guidelineFiles as number, // lowercase gemini.md a case-sensitive FS never loads
    gitCommits: eras.find((e) => e.id === 'gemini')?.gitCommits ?? null,
    from: eras.find((e) => e.id === 'gemini')?.gitStart ?? null,
    to: eras.find((e) => e.id === 'gemini')?.gitEnd ?? null,
  },
} as const;
