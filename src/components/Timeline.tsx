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
  /** The repo's chapter, or null for a sub-MIN_COMMITS experiment. */
  href: string | null;
}

/** One rung drawn as a period. Geometry is precomputed in Timeline.astro. */
export interface TimelineLane {
  rung: string;
  start: string;
  /** `null` when no log measures an end — the lane fades out after `solidTo`. */
  end: string | null;
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

export interface TimelineProps {
  variant: 'compact' | 'full';
  bars: TimelineBar[];
  lanes: TimelineLane[];
  seams: TimelineSeam[];
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

export default function Timeline({ variant, bars, lanes, seams, domain }: TimelineProps) {
  const full = variant === 'full';
  const gap = full ? ROW_GAP.full : ROW_GAP.compact;
  const barHeight = (bar: TimelineBar) =>
    Math.round(full ? bar.thickness : Math.max(COMPACT_MIN_PX, bar.thickness * COMPACT_SCALE));
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<TimelineBar | null>(null);

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
          once above every row rather than coloured into the bars. */}
      <div class="tl-strip" aria-hidden="true">
        {lanes.map((lane) => (
          <div class="tl-lane-row" key={lane.rung} style={{ height: `${lanePx + gap}px` }}>
            {full && <span class="tl-label tl-lane-name">{lane.rung}</span>}
            <div class="tl-track">
              <div
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
              {/* compact has no label column, so the lane names itself in place */}
              {!full && (
                <span class="tl-lane-name is-inline" style={{ left: `${lane.left}%` }}>
                  {lane.rung}
                </span>
              )}
              {lane.live && <span class="tl-live" style={{ left: `${lane.left + lane.width}%` }}>▶</span>}
            </div>
            {full && <span class="tl-era-dates">{lane.end ?? 'open'}</span>}
          </div>
        ))}
      </div>
      {/* Decorative: the sr-only table below is the accessible tree, so nothing
          in here is focusable — the table's repo cells carry the real links. */}
      <div class="tl-chart" aria-hidden="true">
        {/* One dashed vertical per rung start, dropped through every row. */}
        <div class="tl-seams">
          {full && <span />}
          <div class="tl-track">
            {seams.map((seam) => (
              <span class="tl-seam" data-tl-seam data-era={seam.rung} key={seam.rung} style={{ left: `${seam.left}%` }} />
            ))}
          </div>
          {full && <span />}
        </div>
        {bars.map((bar) => {
          const dimmed = selected !== null && bar.stage !== selected;
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
              {label(hovered.stage)} · {hovered.first_commit} → {hovered.last_commit}
            </>
          : 'hover a bar for its repo, commit count and span'}
      </p>

      {full && (
        <>
          {/* Still the rungs a repo OPENED on, and still dimming by `bar.stage`:
              the legend moves onto the lanes in stage 3. A rung no repo opened
              on would dim every bar at once. */}
          <div class="tl-legend">
            {lanes
              .map((lane) => lane.rung)
              .filter((stage) => bars.some((bar) => bar.stage === stage))
              .map((stage) => (
              <button
                type="button"
                class="tl-legend-item"
                data-stage={stage}
                key={stage}
                aria-pressed={selected === stage}
                onClick={() => setSelected(selected === stage ? null : stage)}
              >
                <span class="tl-swatch" style={{ background: `var(--stage-${stage})` }} aria-hidden="true" />
                {label(stage)}
              </button>
              ))}
          </div>
          {/* Selection is never carried by opacity alone: this line and
              aria-pressed are the other two channels. */}
          <p class="tl-status" data-tl-status aria-live="polite">
            {selected ? `showing: ${label(selected)}` : 'showing all stages'}
          </p>
        </>
      )}

      <table class="sr-only" data-tl-table>
        <caption>
          Every repo in the journey, {domain[0]} to {domain[1]}: stage, commit count and active span.
        </caption>
        <thead>
          <tr>
            <th scope="col">Repo</th>
            <th scope="col">Stage</th>
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
              <td>{label(bar.stage)}</td>
              <td>{bar.commits.toLocaleString('en-US')}</td>
              <td>
                {bar.first_commit} to {bar.last_commit}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
