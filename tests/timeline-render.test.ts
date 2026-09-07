import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeAll, describe, expect, it } from 'vitest';

// Asserts the SHIPPED artifact, not a rendered-in-memory component: `make check`
// runs `astro build` before vitest, so dist/ is fresh. Standalone: `make build`.
const DIST = join(process.cwd(), 'dist');
const CORPUS = 14;
const STAGES = ['chat', 'local-llm', 'first-agent', 'config-engineering', 'production-app'];

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
    expect(count(home, /data-tl-bar/g)).toBe(CORPUS);
  });

  it('drops the legend and the numeric count labels', () => {
    expect(count(home, /tl-legend-item/g)).toBe(0);
    expect(count(home, /class="tl-count"/g)).toBe(0);
  });
});

describe('full variant on /journey/', () => {
  it('renders the island with one bar per repo', () => {
    expect(journey).toContain('data-variant="full"');
    expect(count(journey, /data-tl-bar/g)).toBe(CORPUS);
  });

  it('names every stage in the legend', () => {
    const named = [...journey.matchAll(/tl-legend-item" data-stage="([a-z-]+)"/g)].map((m) => m[1]);
    expect(named).toEqual(STAGES);
  });

  it('labels every bar with its commit count', () => {
    expect(count(journey, /class="tl-count"/g)).toBe(CORPUS);
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
