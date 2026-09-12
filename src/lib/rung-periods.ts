// The six rungs as PERIODS of the journey, not properties of a repo. Each rung
// lasted a stretch of time; every repo alive at a given moment was on the same
// rung as every other. Starts are dated; ends come from the last day the rung's
// own tools logged activity, read out of the generated eras data.
//
// `gemini` and `claude-code` are deliberately unmapped below: Claude Code spans
// rungs 4-6 and so can end none of them, and Gemini left no log at all. The
// three upper starts are therefore literals, each carrying its own source.
import eras from '../../content/measurements/data/eras.json';
// `RUNGS` is imported for the totality typing only (a `typeof` type query, so
// the import is erased at build time) — vitest has no `astro:content`
// resolution here, exactly as in `src/lib/rungs.ts`.
import type { RUNGS } from '../content.config';

type Rung = (typeof RUNGS)[number];

export interface RungPeriod {
  rung: Rung;
  start: string;
  startSource: string;
  /** `null` when nothing measures an end — the lane fades out instead. */
  end: string | null;
  endSource: string;
  /** True when the boundary is inferred rather than read off a log. */
  estimated: boolean;
}

interface EraRow {
  id: string;
  dateLow: string | null;
  dateHigh: string | null;
  logStart: string | null;
  logEnd: string | null;
}

const rows = eras.eras as EraRow[];

const byId = (id: string): EraRow => {
  const row = rows.find((r) => r.id === id);
  if (!row) throw new Error(`eras.json has no era "${id}"`);
  return row;
};

/** The tools whose logs bound a rung. Order inside a rung does not matter. */
const TOOL_RUNG: Record<string, Rung> = {
  chat: 'asking',
  copilot: 'suggesting',
  continue: 'delegating',
  codex: 'delegating',
  cursor: 'delegating',
};

const toolsFor = (rung: Rung): string[] =>
  Object.keys(TOOL_RUNG).filter((id) => TOOL_RUNG[id] === rung);

const minLogStart = (rung: Rung): string =>
  toolsFor(rung)
    .map((id) => byId(id).logStart)
    .filter((d): d is string => d !== null)
    .sort()[0];

const maxLogEnd = (rung: Rung): string =>
  toolsFor(rung)
    .map((id) => byId(id).logEnd)
    .filter((d): d is string => d !== null)
    .sort()
    .slice(-1)[0];

/**
 * The six periods in ladder order. A `null` end means no proxy measures one:
 * the lane is drawn solid to the next rung's start and fades to nothing after
 * it. `governing` has no successor, so it stays solid and live.
 */
export const RUNG_PERIODS: RungPeriod[] = [
  {
    rung: 'asking',
    start: byId('chat').dateLow!,
    startSource: 'chat.dateLow (estimated)',
    end: byId('chat').dateHigh,
    endSource: 'chat.dateHigh (estimated)',
    estimated: true,
  },
  {
    rung: 'suggesting',
    start: byId('copilot').logStart!,
    startSource: 'copilot.logStart',
    end: byId('copilot').logEnd,
    endSource: 'copilot.logEnd',
    estimated: false,
  },
  {
    rung: 'delegating',
    start: minLogStart('delegating'),
    startSource: 'earliest logStart of continue/codex/cursor',
    end: maxLogEnd('delegating'),
    endSource: 'latest logEnd of continue/codex/cursor',
    estimated: false,
  },
  {
    rung: 'planning',
    start: '2026-02-28',
    startSource: 'first Claude Code token',
    end: null,
    endSource: 'no proxy',
    estimated: false,
  },
  {
    rung: 'configuring',
    start: '2026-04-05',
    startSource: 'dotfiles first commit',
    end: null,
    endSource: 'no proxy',
    estimated: false,
  },
  {
    rung: 'governing',
    start: '2026-07-09',
    startSource: 'skills/ enters dotfiles',
    end: null,
    endSource: 'live',
    estimated: false,
  },
];

/** The periods a `[first, last]` span overlaps, in ladder order. */
export const livedThrough = (first: string, last: string): Rung[] =>
  RUNG_PERIODS.filter((p) => p.start <= last && (p.end === null || p.end >= first)).map(
    (p) => p.rung,
  );
