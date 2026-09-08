import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeAll, describe, expect, it } from 'vitest';

// Asserts the SHIPPED artifact, not a rendered-in-memory component: `make check`
// runs `astro build` before vitest, so dist/ is fresh. Standalone: `make build`.
const DIST = join(process.cwd(), 'dist');
const CORPUS = 14;
// The six-rung ladder is asking → suggesting → delegating → planning → configuring
// → governing (Base.astro tokens, Timeline RAMP/STAGE_LABEL all carry six). The
// legend renders only rungs a repo OPENED on, in ladder order: no repo in the corpus
// opens on `governing` (it is reached as a `stage_peak`, never a `stage`), so the
// rendered legend is these five. A sixth entry here would red against real markup.
const STAGES = ['asking', 'suggesting', 'delegating', 'planning', 'configuring'];

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
    const rows = JSON.parse(readFileSync(join(process.cwd(), 'content', 'timeline.json'), 'utf8'));
    expect(rows).toHaveLength(CORPUS);
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

  it('drops the legend and the numeric count labels', () => {
    expect(count(home, /tl-legend-item/g)).toBe(0);
    expect(count(home, /class="tl-count"/g)).toBe(0);
  });
});

describe('full variant on /journey/', () => {
  it('renders the island with one bar per repo', () => {
    expect(journey).toContain('data-variant="full"');
    expect(count(journey, /data-tl-bar(?!-)/g)).toBe(CORPUS);
  });

  it('names every stage in the legend', () => {
    const named = [...journey.matchAll(/tl-legend-item" data-stage="([a-z-]+)"/g)].map((m) => m[1]);
    expect(named).toEqual(STAGES);
  });

  it('labels every bar with its commit count', () => {
    expect(count(journey, /class="tl-count"/g)).toBe(CORPUS);
  });
});

describe('interaction hooks in the shipped HTML', () => {
  // The gate cannot see behaviour (dev-workflow.md), so these assert the static
  // hooks that enable it; the live hover/dim/nav is Stage 5's e2e.
  it('links every chapter bar to its chapter, and no experiment bar', () => {
    const rows = JSON.parse(readFileSync(join(process.cwd(), 'content', 'timeline.json'), 'utf8'));
    const chapters = rows.filter((row: { commits: number }) => row.commits >= 5).length;
    expect(chapters).toBeGreaterThan(0);
    expect(chapters).toBeLessThan(CORPUS);

    expect(count(journey, /data-tl-bar-link/g)).toBe(chapters);
    expect(count(journey, /<a class="tl-link" href="\/journey\/[^"]+"/g)).toBe(chapters);
  });

  it('makes every legend swatch a real button carrying its stage slug', () => {
    for (const stage of STAGES) {
      expect(journey, `no legend button for ${stage}`).toMatch(
        new RegExp(`<button type="button" class="tl-legend-item" data-stage="${stage}" aria-pressed="`),
      );
    }
  });

  it('ships the text status line — dimming is never the only channel', () => {
    expect(journey).toMatch(/data-tl-status/);
    expect(journey).toContain('showing all stages');
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
