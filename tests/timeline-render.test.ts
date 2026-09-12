import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeAll, describe, expect, it } from 'vitest';

import { RUNG_PERIODS } from '../src/lib/rung-periods';
import { chapters, dateFraction, experiments, rows } from '../src/lib/timeline';

// Asserts the SHIPPED artifact, not a rendered-in-memory component: `make check`
// runs `astro build` before vitest, so dist/ is fresh. Standalone: `make build`.
const DIST = join(process.cwd(), 'dist');
// What the chart DRAWS -- the chapter rows, not every row in timeline.json. Since
// inc-era-labels a one-day repo is an experiment line, and the JSON keeps it
// (it is git truth) while the chart does not.
const CORPUS = chapters.length;
// The six-rung ladder is asking → suggesting → delegating → planning → configuring
// → governing. Since inc-eras the rungs are PERIODS of the journey, not properties
// of a repo, so the strip carries all six in ladder order — it is no longer
// filtered by which rung a repo happened to open on. `governing` belongs here even
// though no repo opens on it.
const STAGES = ['asking', 'suggesting', 'delegating', 'planning', 'configuring', 'governing'];

// Inlined CSS mentions every `.tl-*` selector, so a bare substring search would
// report the legend as present on a page that never renders it.
const markup = (html: string) => html.replace(/<style[\s\S]*?<\/style>/g, '');

const count = (html: string, pattern: RegExp) => (html.match(pattern) ?? []).length;

let home = '';
let journey = '';

beforeAll(() => {
  const read = (rel: string) => {
    let html: string;
    try {
      html = readFileSync(join(DIST, rel), 'utf8');
    } catch {
      throw new Error(`dist/${rel} is missing — run \`make build\` before \`make test\``);
    }
    if (html.length < 500) throw new Error(`dist/${rel} is ${html.length} bytes — the build is broken`);
    return markup(html);
  };
  home = read('index.html');
  journey = read('journey/index.html');
});

describe('vacuity anchors', () => {
  it('read both pages, past their headings', () => {
    expect(home).toMatch(/<h1[^>]*>ai-coding-journey<\/h1>/);
    expect(journey).toMatch(/<h1[^>]*>The journey<\/h1>/);
  });

  it('agrees with timeline.json on the corpus size', () => {
    const json = JSON.parse(readFileSync(join(process.cwd(), 'content', 'timeline.json'), 'utf8'));
    expect(json).toHaveLength(rows.length);
    // The drawn set is a STRICT subset: were it the whole file, every assertion
    // below counting CORPUS bars would pass on a chart that drew experiments too.
    expect(CORPUS).toBeGreaterThan(0);
    expect(CORPUS).toBeLessThan(rows.length);
    expect(CORPUS + experiments.length).toBe(rows.length);
  });

  // The demotion, asserted on the SHIPPED html rather than on the library: a
  // one-day repo must reach neither chart, neither sr-only table, and no chapter
  // link. `xls-analyser` and `gitlab-standup` cleared MIN_COMMITS and had
  // chapters until this increment, so this is the assertion that would catch
  // them coming back through a regen.
  it('draws no one-day repo on either page', () => {
    const oneDay = rows.filter((row) => row.last_commit === row.first_commit);
    expect(oneDay.length).toBeGreaterThan(0);
    for (const row of oneDay) {
      for (const [name, html] of [['/', home], ['/journey/', journey]] as const) {
        expect(html, `${row.repo} still drawn on ${name}`).not.toContain(`data-repo="${row.repo}"`);
        expect(html, `${row.repo} still linked on ${name}`).not.toContain(`/journey/${row.repo}`);
      }
    }
  });
});

describe('compact variant on /', () => {
  it('renders the island with one bar per repo', () => {
    expect(home).toContain('data-variant="compact"');
    expect(count(home, /data-tl-bar(?!-)/g)).toBe(CORPUS);
  });

  it('keeps the time axis — bars encode time, so both variants show its endpoints', () => {
    const rows = JSON.parse(readFileSync(join(process.cwd(), 'content', 'timeline.json'), 'utf8'));
    const first = rows.map((r: { first_commit: string }) => r.first_commit).sort()[0];
    const last = rows.map((r: { last_commit: string }) => r.last_commit).sort().at(-1);
    for (const [name, html] of [['/', home], ['/journey/', journey]] as const) {
      expect(html, `no time axis on ${name}`).toContain('class="tl-axis"');
      expect(html, `axis start missing on ${name}`).toContain(`<span>${first}</span>`);
      expect(html, `axis end missing on ${name}`).toContain(`<span>${last}</span>`);
    }
  });

  // The lane names are the controls since stage 3, so compact shipping "no
  // legend" now means shipping no lane BUTTON — the strip itself is there.
  it('drops the controls and the numeric count labels', () => {
    expect(count(home, /tl-lane-btn/g)).toBe(0);
    expect(count(home, /<button/g)).toBe(0);
    expect(count(home, /class="tl-count"/g)).toBe(0);
  });
});

describe('full variant on /journey/', () => {
  it('renders the island with one bar per repo', () => {
    expect(journey).toContain('data-variant="full"');
    expect(count(journey, /data-tl-bar(?!-)/g)).toBe(CORPUS);
  });

  it('names every rung in the era strip, in ladder order', () => {
    const named = [...journey.matchAll(/data-tl-lane="true" data-era="([a-z-]+)"/g)].map((m) => m[1]);
    expect(named).toEqual(STAGES);
  });

  it('labels every bar with its commit count', () => {
    expect(count(journey, /class="tl-count"/g)).toBe(CORPUS);
  });
});

// The rungs are periods, so a BAR must claim none of them: it says when a repo
// lived, and the strip above it says which rung the journey was on.
describe('the era strip carries the rungs, and the bars carry none', () => {
  const BARS = /<div class="tl-bar"[^>]*>/g;

  it('paints every bar in the one neutral ink, on both pages', () => {
    for (const [name, html] of [['/', home], ['/journey/', journey]] as const) {
      const rendered = html.match(BARS) ?? [];
      expect(rendered, `no bars parsed on ${name}`).toHaveLength(CORPUS);
      for (const bar of rendered) {
        expect(bar, `a bar still claims a rung on ${name}`).not.toMatch(/var\(--stage-/);
        expect(bar, `a bar is not --bar-ink on ${name}`).toContain('background:var(--bar-ink)');
      }
    }
  });

  it('ships the strip and one seam per rung on BOTH variants', () => {
    for (const [name, html] of [['/', home], ['/journey/', journey]] as const) {
      const lanes = [...html.matchAll(/data-tl-lane="true" data-era="([a-z-]+)"/g)].map((m) => m[1]);
      expect(lanes, `wrong lanes on ${name}`).toEqual(STAGES);
      expect(count(html, /data-tl-seam/g), `wrong seam count on ${name}`).toBe(STAGES.length);
    }
  });

  // Pinned against the library the lanes are drawn from, so a measurements regen
  // that moves a period reds here as well as in tests/rung-periods.test.ts.
  it('gives each lane the start and end RUNG_PERIODS says it has', () => {
    const attrs = [...journey.matchAll(
      /data-era="([a-z-]+)" data-era-start="([0-9-]+)" data-era-end="([a-z0-9-]+)"/g,
    )].map((m) => ({ rung: m[1], start: m[2], end: m[3] }));
    expect(attrs).toHaveLength(STAGES.length);
    for (const period of RUNG_PERIODS) {
      const drawn = attrs.find((a) => a.rung === period.rung);
      expect(drawn, `no lane drawn for ${period.rung}`).toBeDefined();
      expect(drawn!.start).toBe(period.start);
      expect(drawn!.end).toBe(period.end ?? 'open');
    }
  });
});

// The geometry the lanes are actually drawn with. `dateFraction` is the same
// function the strip is built from, so this pins the WIRING — that each lane
// got its own period's dates — not the arithmetic, which timeline-lib owns.
describe('lane geometry follows the periods', () => {
  const LANES = /data-era="([a-z-]+)" data-era-start="[0-9-]+" data-era-end="[a-z0-9-]+" style="left:([0-9.]+)%;width:([0-9.]+)%/g;

  const drawn = (html: string) =>
    [...html.matchAll(LANES)].map((m) => ({ rung: m[1], left: Number(m[2]), width: Number(m[3]) }));

  it('places every lane at its own start, and none at the axis origin by accident', () => {
    const lanes = drawn(journey);
    expect(lanes, 'no lane geometry parsed').toHaveLength(RUNG_PERIODS.length);
    for (const lane of lanes) {
      const period = RUNG_PERIODS.find((p) => p.rung === lane.rung)!;
      expect(lane.left, `${lane.rung} is not at its start`).toBeCloseTo(
        dateFraction(period.start) * 100,
        6,
      );
      expect(lane.width, `${lane.rung} has no width`).toBeGreaterThan(0);
      expect(lane.left + lane.width, `${lane.rung} runs past the axis`).toBeLessThanOrEqual(100.001);
    }
    // `asking` starts before the first commit and clamps to the origin; every
    // other lane must be strictly inside, or a zeroed `left` would pass above.
    expect(lanes.filter((l) => l.left === 0).map((l) => l.rung)).toEqual(['asking']);
  });

  // The ruling: an open end runs SOLID to its successor's start, then fades to
  // fully transparent. `governing` has no successor, so it never fades.
  it('fades only the rungs nothing measures an end for', () => {
    const fading = [...journey.matchAll(/data-era="([a-z-]+)"[^>]*background:linear-gradient/g)]
      .map((m) => m[1]);
    expect(fading).toEqual(['planning', 'configuring']);
    expect(journey).toMatch(/data-era="governing"[^>]*background:var\(--stage-governing\)/);
  });
});

describe('interaction hooks in the shipped HTML', () => {
  // The gate cannot see behaviour (dev-workflow.md), so these assert the static
  // hooks that enable it; the live hover/dim/nav is Stage 5's e2e.
  it('links every drawn bar to its chapter — every bar now has one', () => {
    // Since inc-era-labels the drawn set IS the chapter set, so the old
    // "some bars have no link" split is gone: a bar with no link would mean a
    // row reached the chart that earned no chapter.
    expect(CORPUS).toBeGreaterThan(0);
    expect(count(journey, /data-tl-bar-link/g)).toBe(CORPUS);
    expect(count(journey, /<a class="tl-link" href="\/journey\/[^"]+"/g)).toBe(CORPUS);
    expect(count(journey, /class="tl-hit"/g), 'a drawn bar has no chapter behind it').toBe(0);
  });

  // Pinned as an exact SET, never per-slug presence: a loop over the six rungs
  // asserting each is present cannot see a SEVENTH button, and the legend grew
  // exactly such a dead entry once. Dimming follows the PERIOD now, so every
  // rung earns a button — `governing`, which no repo opened on, included.
  it('makes every lane name a real button, and ships no button that is not a lane', () => {
    const buttons = [...journey.matchAll(
      /<button type="button" class="tl-lane-btn" data-era="([a-z-]+)" aria-pressed="/g,
    )].map((m) => m[1]);
    expect(buttons).toEqual(STAGES);
    expect(count(journey, /<button/g), 'a button ships that is not a lane').toBe(STAGES.length);
  });

  it('ships the text status line — dimming is never the only channel', () => {
    expect(journey).toMatch(/data-tl-status/);
    expect(journey).toContain('showing all eras');
  });
});

// The bug this guards: rows were a fixed 10px (compact) while `commitThickness`
// returns up to 22px, so the fattest bars spilled over their neighbours and the
// stack read as one blur. Rows are now sized FROM the bar they hold.
describe('bars never overflow their row', () => {
  const ROWS = /class="tl-row[^"]*" style="height:(\d+)px/g;
  const BARS = /class="tl-bar" data-tl-bar[^>]*data-repo="([^"]+)"[^>]*style="height:(\d+)px/g;

  const geometry = (html: string) => {
    const rows = [...html.matchAll(ROWS)].map((m) => Number(m[1]));
    const bars = [...html.matchAll(BARS)].map((m) => ({ repo: m[1], px: Number(m[2]) }));
    return { rows, bars };
  };

  it('read a row height and a bar height off both pages', () => {
    for (const [name, html] of [['/', home], ['/journey/', journey]] as const) {
      const { rows, bars } = geometry(html);
      expect(rows, `no row heights parsed on ${name}`).toHaveLength(CORPUS);
      expect(bars, `no bar heights parsed on ${name}`).toHaveLength(CORPUS);
      expect(new Set(bars.map((b) => b.px)).size, `all bars one thickness on ${name}`).toBeGreaterThan(1);
    }
  });

  it('leaves a gutter between every bar and the next row', () => {
    for (const [name, html] of [['/', home], ['/journey/', journey]] as const) {
      const { rows, bars } = geometry(html);
      bars.forEach((bar, i) => {
        expect(rows[i] - bar.px, `${bar.repo} fills its row on ${name}`).toBeGreaterThanOrEqual(4);
      });
    }
  });
});

describe('accessibility floor: the text equivalent', () => {
  it('ships the sr-only table on both variants', () => {
    for (const [name, html] of [['/', home], ['/journey/', journey]] as const) {
      expect(html, `no sr-only timeline table on ${name}`).toMatch(/class="sr-only" data-tl-table/);
      expect(count(html, /data-tl-table-row/g), `wrong row count on ${name}`).toBe(CORPUS);
    }
  });

  // The strip is an island too, so it owes its own text equivalent: the six
  // periods with the source of each date. Its rows are `data-tl-era-row` and
  // never `data-tl-table-row`, which the repo-row count above parses.
  it('ships the sr-only periods table on both variants', () => {
    for (const [name, html] of [['/', home], ['/journey/', journey]] as const) {
      expect(html, `no sr-only periods table on ${name}`).toMatch(/class="sr-only" data-tl-era-table/);
      expect(count(html, /data-tl-era-row/g), `wrong era row count on ${name}`).toBe(STAGES.length);
      for (const period of RUNG_PERIODS) {
        expect(html, `${period.rung} has no start source on ${name}`).toContain(
          `(${period.startSource})`,
        );
        // Both halves: §6 of the plan lists the END source too, and a regen that
        // garbled one would otherwise stay green on a start-source-only pin.
        expect(html, `${period.rung} has no end source on ${name}`).toContain(
          `(${period.endSource})`,
        );
      }
    }
  });
});

// inc-era-labels: the compact strip used to name each era by absolutely
// positioning grey text ON its own 6px coloured lane. These pin the replacement.
describe('era pills (compact)', () => {
  // The seam is carried as a custom property: the CSS clamps `left` off it.
  const PILLS = /class="tl-pill" data-tl-pill="true" data-era="([a-z-]+)" style="--tl-pill-left:([0-9.]+)%/g;

  const pills = (html: string) =>
    [...html.matchAll(PILLS)].map((m) => ({ rung: m[1]!, left: Number(m[2]) }));

  it('names every rung in a pill, at its own era start', () => {
    const drawn = pills(home);
    // Sorted, not in ladder order: the pills are emitted ROW by row, so their
    // document order is the greedy placement's, not the ladder's. Compared as a
    // sorted array rather than a set, so a duplicate or a seventh pill still reds.
    expect([...drawn.map((p) => p.rung)].sort()).toEqual([...STAGES].sort());
    for (const p of drawn) {
      const period = RUNG_PERIODS.find((r) => r.rung === p.rung)!;
      expect(p.left, `${p.rung} pill is not at its start`).toBeCloseTo(
        dateFraction(period.start) * 100,
        6,
      );
    }
  });

  it('ships no label painted onto a lane any more', () => {
    expect(count(home, /tl-lane-name/g)).toBe(0);
  });

  // The greedy row assignment: the six pills must land on rows that separate
  // them. Read the rows back out of the html and assert that no two pills on the
  // SAME row are closer than the gap the placement claims to keep.
  it('separates the pills it puts on one row', () => {
    // Slice the pill block out first, then split it on the row element: a
    // page-wide regex would run past the strip and read the lanes as a row.
    const block = home.slice(home.indexOf('class="tl-pills"'), home.indexOf('class="tl-strip"'));
    const rowsHtml = block.split('<div class="tl-pill-row">').slice(1);
    expect(rowsHtml.length, 'no pill rows parsed').toBeGreaterThan(1);
    for (const rowHtml of rowsHtml) {
      const lefts = pills(rowHtml).map((p) => p.left).sort((a, b) => a - b);
      for (let i = 1; i < lefts.length; i += 1) {
        expect(lefts[i]! - lefts[i - 1]!, 'two pills collide on one row').toBeGreaterThan(8);
      }
    }
    // Vacuity anchor: the rows really do hold every pill between them.
    expect(rowsHtml.reduce((n, html) => n + pills(html).length, 0)).toBe(STAGES.length);
  });

  it('colours every seam by the rung it opens, on both pages', () => {
    for (const [name, html] of [['/', home], ['/journey/', journey]] as const) {
      for (const rung of STAGES) {
        const seam = new RegExp(
          `data-tl-seam="true" data-era="${rung}"[^>]*border-left-color:var\\(--stage-${rung}\\)`,
        );
        expect(html, `${rung}'s seam is not its own colour on ${name}`).toMatch(seam);
      }
    }
  });
});

// inc5b Stage 1: the generated index is built by enumerating REPOS, so a chapter
// that belongs to no repo (the reserved 90- band) is invisible to the generator
// unless index() walks the tree for it. This asserts the shipped README.md, not
// dist/ — it guards the generator's output, which is a tracked source file.
describe('generated journey index lists non-repo chapters', () => {
  const JOURNEY_DIR = join(process.cwd(), 'content', 'journey');
  const readme = () => readFileSync(join(JOURNEY_DIR, 'README.md'), 'utf8');

  // Files with a `[0-9][0-9]-` prefix, minus the round-up (no frontmatter, own rows).
  const chapterFiles = () =>
    readdirSync(JOURNEY_DIR)
      .filter((f) => /^\d\d-.+\.md$/.test(f) && f !== '00-experiments.md')
      .sort();

  const noRepoChapters = () =>
    chapterFiles().filter((f) => {
      const fm = /^---\n([\s\S]*?\n)---\n/.exec(readFileSync(join(JOURNEY_DIR, f), 'utf8'));
      return fm !== null && !/^repo: *\S/m.test(fm[1]);
    });

  // Vacuity anchor on the CORPUS the walker read, never on the population it
  // drains: the walk found the chapter files, parsed their frontmatter, and the
  // README really is the generated table with a known repo row in it.
  it('walked the chapter corpus and read the generated table', () => {
    expect(chapterFiles().length).toBeGreaterThanOrEqual(CORPUS - 1);
    expect(chapterFiles().length - noRepoChapters().length).toBeGreaterThan(0);
    expect(readme()).toContain('| # | repo | start | end | commits | stage | chapter |');
    expect(readme()).toContain('| 01 | hands-on-llm |');
  });

  it('gives every non-repo chapter a row linking its file', () => {
    const index = readme();
    for (const f of noRepoChapters()) {
      expect(index, `${f} is missing from the generated index`).toContain(`[${f}](${f})`);
    }
  });
});
