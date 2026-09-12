// Pure renderer over serializable props: all geometry is precomputed in
// Timeline.astro. Interaction state is local; nothing here reads the DOM.
import { useState } from 'preact/hooks';

export interface TimelineBar {
  repo: string;
  stage: string;
  commits: number;
  first_commit: string;
  last_commit: string;
  /** Left edge as a percentage of the time axis. */
  left: number;
  /** Width as a percentage of the time axis. */
  width: number;
  /** Bar thickness in px, on the log commit scale. */
  thickness: number;
  /** The rungs whose period overlaps this repo's span, in ladder order. */
  lived: string[];
  /** The repo's chapter, or null for a sub-MIN_COMMITS experiment. */
  href: string | null;
}

/** One rung drawn as a period. Geometry is precomputed in Timeline.astro. */
export interface TimelineLane {
  rung: string;
  start: string;
  startSource: string;
  /** `null` when no log measures an end — the lane fades out after `solidTo`. */
  end: string | null;
  endSource: string;
  left: number;
  width: number;
  /** Where the fade begins, as a percentage of the LANE's own width. */
  solidTo: number;
  open: boolean;
  live: boolean;
}

export interface TimelineSeam {
  rung: string;
  left: number;
}

/** One era name, placed above the strip. Row assignment is precomputed. */
export interface TimelinePill {
  rung: string;
  /** The era's start on the axis, as a percentage. */
  left: number;
  /** Which pill row it was greedily assigned to, 0 = topmost. */
  row: number;
  /** Estimated pill width in px: the clamp that keeps it on the track. */
  widthPx: number;
}

export interface TimelineProps {
  variant: 'compact' | 'full';
  bars: TimelineBar[];
  lanes: TimelineLane[];
  seams: TimelineSeam[];
  pills: TimelinePill[];
  /** How many rows the greedy placement needed. */
  pillRows: number;
  domain: [string, string];
}

const STAGE_LABEL: Record<string, string> = {
  asking: 'asking',
  suggesting: 'suggesting',
  delegating: 'delegating',
  planning: 'planning',
  configuring: 'configuring',
  governing: 'governing',
};

const label = (stage: string) => STAGE_LABEL[stage] ?? stage;

// Every era name and every era bar links to the ONE place that defines the
// rung: its row in the six-rung table on /journey/ (`id="rung-<rung>"`). No
// per-era pages exist, and none should — the table row is the description.
const rungHref = (rung: string) => `/journey/#rung-${rung}`;

// Vertical gutter between one bar and the next. Rows are sized from the bar
// they hold PLUS this, so a 22px bar can never bleed into its neighbours'
// rows -- the old fixed row height was shorter than the thickest bars.
const ROW_GAP = { compact: 5, full: 6 };

// Compact stacks the whole corpus into a homepage block, so the log thickness
// is halved there; the ordering the scale encodes survives, the overlap does not.
const COMPACT_SCALE = 0.55;
const COMPACT_MIN_PX = 3;

// Lanes are a constant thickness: a period has a duration, never a magnitude,
// so varying their height would encode a quantity that does not exist.
const LANE_PX = { compact: 6, full: 9 };

export default function Timeline({
  variant,
  bars,
  lanes,
  seams,
  pills,
  pillRows,
  domain,
}: TimelineProps) {
  const full = variant === 'full';
  const gap = full ? ROW_GAP.full : ROW_GAP.compact;
  const barHeight = (bar: TimelineBar) =>
    Math.round(full ? bar.thickness : Math.max(COMPACT_MIN_PX, bar.thickness * COMPACT_SCALE));
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<TimelineBar | null>(null);

  // The selection is a PERIOD now, not a repo-opening rung: picking one lights
  // its band through the rows and dims every repo that did not live through it.
  const selectedLane = lanes.find((lane) => lane.rung === selected) ?? null;

  const lanePx = full ? LANE_PX.full : LANE_PX.compact;
  const laneFill = (lane: TimelineLane) => {
    const hue = `var(--stage-${lane.rung})`;
    // An open end fades to FULLY transparent: past its successor's start
    // nothing measures this rung, and the lane says so by running out.
    return lane.open && lane.solidTo < 100
      ? `linear-gradient(to right, ${hue} 0%, ${hue} ${lane.solidTo}%, transparent 100%)`
      : hue;
  };

  return (
    <div class="tl" data-timeline data-variant={variant}>
      {/* The era strip: the rungs are periods of the journey, so they are drawn
          once above every row rather than coloured into the bars. In `full` the
          lane names ARE the controls, so the strip cannot be aria-hidden there;
          the decorative halves carry their own aria-hidden instead. `compact`
          ships no controls, so the whole strip stays hidden. */}
      {/* The era names, compact only: `full` has a label column whose buttons are
          already readable. Each pill is a LINK to the rung's row in the six-rung
          table, so the nav is real and not aria-hidden. */}
      {!full && (
        <nav class="tl-pills" data-tl-pills aria-label="Eras">
          {Array.from({ length: pillRows }, (_, row) => (
            <div class="tl-pill-row" key={row}>
              {/* Drops first, so a pill never sits under its neighbour's line. */}
              {pills
                .filter((pill) => pill.row < row)
                .map((pill) => (
                  <span
                    class="tl-pill-drop"
                    data-tl-pill-drop
                    key={pill.rung}
                    style={{ left: `${pill.left}%`, borderLeftColor: `var(--stage-${pill.rung})` }}
                  />
                ))}
              {pills
                .filter((pill) => pill.row === row)
                .map((pill) => (
                  <a
                    href={rungHref(pill.rung)}
                    class="tl-pill"
                    data-tl-pill
                    data-era={pill.rung}
                    key={pill.rung}
                    style={{ '--tl-pill-left': `${pill.left}%`, '--tl-pill-w': `${pill.widthPx}px` }}
                  >
                    <span class="tl-pill-dot" style={{ background: `var(--stage-${pill.rung})` }} />
                    {label(pill.rung)}
                  </a>
                ))}
            </div>
          ))}
        </nav>
      )}
      {/* Strip and chart share one positioned body, so a seam is ONE line from
          the era lane it opens down through every repo row: split in two, it
          vanished exactly where the eye crossed from the lanes to the bars. */}
      <div class="tl-body">
        {/* One dashed vertical per rung start, through the lanes AND every row. */}
        <div class="tl-seams" aria-hidden="true">
          {full && <span />}
          <div class="tl-track">
            {seams.map((seam) => (
              <span
                class="tl-seam"
                data-tl-seam
                data-era={seam.rung}
                key={seam.rung}
                style={{ left: `${seam.left}%`, borderLeftColor: `var(--stage-${seam.rung})` }}
              />
            ))}
          </div>
          {full && <span />}
        </div>
        <div class="tl-strip" aria-hidden={full ? undefined : 'true'}>
          {lanes.map((lane) => (
            <div class="tl-lane-row" key={lane.rung} style={{ height: `${lanePx + gap}px` }}>
              {full && (
                <button
                  type="button"
                  class="tl-lane-btn"
                  data-era={lane.rung}
                  aria-pressed={selected === lane.rung}
                  onClick={() => setSelected(selected === lane.rung ? null : lane.rung)}
                >
                  <span class="tl-swatch" style={{ background: `var(--stage-${lane.rung})` }} aria-hidden="true" />
                  {label(lane.rung)}
                </button>
              )}
              <div class="tl-track" aria-hidden="true">
                <a
                  href={rungHref(lane.rung)}
                  tabIndex={-1}
                  class="tl-lane"
                  data-tl-lane
                  data-era={lane.rung}
                  data-era-start={lane.start}
                  data-era-end={lane.end ?? 'open'}
                  style={{
                    left: `${lane.left}%`,
                    width: `${lane.width}%`,
                    height: `${lanePx}px`,
                    background: laneFill(lane),
                  }}
                />
                {lane.live && <span class="tl-live" style={{ left: `${lane.left + lane.width}%` }}>▶</span>}
              </div>
              {full && <span class="tl-era-dates" aria-hidden="true">{lane.end ?? 'open'}</span>}
            </div>
          ))}
        </div>
        {/* Decorative: the sr-only tables below are the accessible tree, so nothing
            in here is focusable — the table's repo cells carry the real links. */}
        <div class="tl-chart" aria-hidden="true">
          {/* The selected period, banded through every row. Same grid as the seams,
              so the band lands on the track column and not under the labels. */}
          {selectedLane && (
            <div class="tl-seams">
              {full && <span />}
              <div class="tl-track">
                <span
                  class="tl-band-fill"
                  data-tl-band
                  data-era={selectedLane.rung}
                  style={{ left: `${selectedLane.left}%`, width: `${selectedLane.width}%` }}
                />
              </div>
              {full && <span />}
            </div>
          )}
          {bars.map((bar) => {
            // Dimming follows the PERIOD, not `bar.stage`: a repo is undimmed when
            // it was alive at any point inside the selected rung's span.
            const dimmed = selected !== null && !bar.lived.includes(selected);
            const rect = (
              <div
                class="tl-bar"
                data-tl-bar
                data-repo={bar.repo}
                data-stage={bar.stage}
                style={{
                  height: `${barHeight(bar)}px`,
                  background: 'var(--bar-ink)',
                }}
              />
            );
            // The span, not the bar, is the pointer target: it spans the full row
            // height, so a 3px hairline is still hoverable and clickable.
            const span = { left: `${bar.left}%`, width: `${bar.width}%` };
            return (
              <div
                class={`tl-row${dimmed ? ' is-dimmed' : ''}${hovered?.repo === bar.repo ? ' is-hovered' : ''}`}
                key={bar.repo}
                style={{ height: `${barHeight(bar) + gap}px` }}
                onMouseEnter={() => setHovered(bar)}
                onMouseLeave={() => setHovered(null)}
              >
                {full && <span class="tl-label">{bar.repo}</span>}
                <div class="tl-track">
                  {bar.href
                    ? <a class="tl-link" href={bar.href} tabIndex={-1} data-tl-bar-link style={span}>{rect}</a>
                    : <div class="tl-hit" style={span}>{rect}</div>}
                </div>
                {full && <span class="tl-count">{bar.commits.toLocaleString('en-US')} commits</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* the time axis survives in compact — bars encode time, so both variants need its endpoints */}
      <div class="tl-axis" aria-hidden="true">
        <span>{domain[0]}</span>
        <span>{domain[1]}</span>
      </div>

      {/* Always rendered, so naming the hovered bar never reflows what is below it. */}
      <p class="tl-card" data-tl-card aria-hidden="true">
        {hovered
          ? <>
              <strong>{hovered.repo}</strong> · {hovered.commits.toLocaleString('en-US')} commits ·{' '}
              lived through: {hovered.lived.map(label).join(' → ')} · {hovered.first_commit} →{' '}
              {hovered.last_commit}
            </>
          : 'hover a bar for its repo, commit count and span'}
      </p>

      {full && (
        // Selection is never carried by opacity alone: this line and the lane
        // buttons' aria-pressed are the other two channels.
        <p class="tl-status" data-tl-status aria-live="polite">
          {selectedLane
            ? `showing: ${label(selectedLane.rung)} · ${selectedLane.start} → ${selectedLane.end ?? 'open'}`
            : 'showing all eras'}
        </p>
      )}

      <table class="sr-only" data-tl-table>
        <caption>
          Every repo in the journey, {domain[0]} to {domain[1]}: the eras it lived through, commit
          count and active span.
        </caption>
        <thead>
          <tr>
            <th scope="col">Repo</th>
            <th scope="col">Eras lived through</th>
            <th scope="col">Commits</th>
            <th scope="col">Span</th>
          </tr>
        </thead>
        <tbody>
          {bars.map((bar) => (
            <tr key={bar.repo} data-tl-table-row>
              <th scope="row">
                {bar.href ? <a href={bar.href}>{bar.repo}</a> : bar.repo}
              </th>
              <td>{bar.lived.map(label).join(', ')}</td>
              <td>{bar.commits.toLocaleString('en-US')}</td>
              <td>
                {bar.first_commit} to {bar.last_commit}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* The strip's own text equivalent: the six periods and where each date
          comes from. Renders on BOTH variants — the strip does too. */}
      <table class="sr-only" data-tl-era-table>
        <caption>The six rungs as periods of the journey, in ladder order.</caption>
        <thead>
          <tr>
            <th scope="col">Era</th>
            <th scope="col">Start</th>
            <th scope="col">End</th>
          </tr>
        </thead>
        <tbody>
          {lanes.map((lane) => (
            <tr key={lane.rung} data-tl-era-row>
              <th scope="row"><a href={rungHref(lane.rung)}>{label(lane.rung)}</a></th>
              <td>
                {lane.start} ({lane.startSource})
              </td>
              <td>
                {lane.end ?? 'open'} ({lane.endSource})
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
