// Pure renderer over serializable props: all geometry is precomputed in
// Timeline.astro. Handler-free until Stage 4 adds hover/legend-dim/links.

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

export default function Timeline({ variant, bars, stages, domain }: TimelineProps) {
  const full = variant === 'full';
  const rowHeight = full ? 22 : 10;

  return (
    <div class="tl" data-timeline data-variant={variant}>
      {/* The drawn chart is decorative: the table below is the accessible tree. */}
      <div class="tl-chart" aria-hidden="true">
        {bars.map((bar) => (
          <div class="tl-row" key={bar.repo} style={{ height: `${rowHeight}px` }}>
            {full && <span class="tl-label">{bar.repo}</span>}
            <div class="tl-track">
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
            </div>
            {full && <span class="tl-count">{bar.commits.toLocaleString('en-US')} commits</span>}
          </div>
        ))}
      </div>

      {full && (
        <div class="tl-axis" aria-hidden="true">
          <span>{domain[0]}</span>
          <span>{domain[1]}</span>
        </div>
      )}

      {full && (
        <div class="tl-legend" aria-hidden="true">
          {stages.map((stage) => (
            <span class="tl-legend-item" data-stage={stage} key={stage}>
              <span class="tl-swatch" style={{ background: `var(--stage-${stage})` }} />
              {STAGE_LABEL[stage] ?? stage}
            </span>
          ))}
        </div>
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
              <th scope="row">{bar.repo}</th>
              <td>{STAGE_LABEL[bar.stage] ?? bar.stage}</td>
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
