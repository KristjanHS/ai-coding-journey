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

export interface TimelineProps {
  variant: 'compact' | 'full';
  bars: TimelineBar[];
  stages: string[];
  domain: [string, string];
}

const STAGE_LABEL: Record<string, string> = {
  chat: 'chat',
  'local-llm': 'local LLM',
  'first-agent': 'first agent',
  'config-engineering': 'config engineering',
  'production-app': 'production app',
};

const label = (stage: string) => STAGE_LABEL[stage] ?? stage;

export default function Timeline({ variant, bars, stages, domain }: TimelineProps) {
  const full = variant === 'full';
  const rowHeight = full ? 22 : 10;
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<TimelineBar | null>(null);

  return (
    <div class="tl" data-timeline data-variant={variant}>
      {/* Decorative: the sr-only table below is the accessible tree, so nothing
          in here is focusable — the table's repo cells carry the real links. */}
      <div class="tl-chart" aria-hidden="true">
        {bars.map((bar) => {
          const dimmed = selected !== null && bar.stage !== selected;
          const rect = (
            <div
              class="tl-bar"
              data-tl-bar
              data-repo={bar.repo}
              data-stage={bar.stage}
              style={{
                left: `${bar.left}%`,
                width: `${bar.width}%`,
                height: `${bar.thickness}px`,
                background: `var(--stage-${bar.stage})`,
              }}
            />
          );
          return (
            <div
              class={`tl-row${dimmed ? ' is-dimmed' : ''}`}
              key={bar.repo}
              style={{ height: `${rowHeight}px` }}
              onMouseEnter={() => setHovered(bar)}
              onMouseLeave={() => setHovered(null)}
            >
              {full && <span class="tl-label">{bar.repo}</span>}
              <div class="tl-track">
                {bar.href
                  ? <a class="tl-link" href={bar.href} tabIndex={-1} data-tl-bar-link>{rect}</a>
                  : rect}
              </div>
              {full && <span class="tl-count">{bar.commits.toLocaleString('en-US')} commits</span>}
            </div>
          );
        })}
      </div>

      {full && (
        <div class="tl-axis" aria-hidden="true">
          <span>{domain[0]}</span>
          <span>{domain[1]}</span>
        </div>
      )}

      {full && hovered && (
        <p class="tl-card" aria-hidden="true">
          <strong>{hovered.repo}</strong> · {hovered.commits.toLocaleString('en-US')} commits ·{' '}
          {label(hovered.stage)} · {hovered.first_commit} → {hovered.last_commit}
        </p>
      )}

      {full && (
        <>
          <div class="tl-legend">
            {stages.map((stage) => (
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
