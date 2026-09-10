import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// The reachability guard, inc8. It replaces `root page links every top-level
// route` in content.test.ts, which asserted that every route directory appears
// in src/pages/index.astro ITSELF. Three doors deliberately removes seven of
// those direct links -- /case-study/ and /measurements/ move behind the journey
// door, /topics/, /atoms/, /sidecars/ and /artifacts/ behind the corpus door,
// /course/ behind the deck door -- so the old assertion contradicts the new IA
// and had to go rather than be relaxed twice.
//
// The rule that survives is the one that mattered: /measurements/ shipped in
// inc5a with no link from anywhere and was reachable only by typing the URL. A
// route is reachable when the root page links it, OR when one of the three door
// indexes does. That is the whole guard against a dissolved section becoming an
// orphan.
//
// The route set is derived from the src/pages/ directory listing, NOT from the
// `collections` keys in content.config.ts. Two of the nine routes -- /deck/ and
// /corpus/ -- have no collection behind them at all (the deck's count is a
// filtered `journey`; the corpus door is pure navigation), so a collections-keyed
// test would leave exactly the two newest doors unguarded.
const PAGES = join('src', 'pages');
const DOORS = ['journey', 'corpus', 'deck'];

const read = (path: string) => readFileSync(path, 'utf8');

const routes = readdirSync(PAGES, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

// Every door is itself a route directory, so the haystack is assembled from
// paths this same listing produced -- a renamed door reds `door indexes exist`
// below rather than silently shrinking the haystack to nothing and passing.
const doorIndexes = DOORS.map((door) => join(PAGES, door, 'index.astro'));

describe('every top-level route is reachable', () => {
  it('finds the route directories', () => {
    expect(routes.length, `no route dirs under ${PAGES}`).toBeGreaterThan(0);
  });

  it.each(DOORS)('the %s door index exists', (door) => {
    const path = join(PAGES, door, 'index.astro');
    expect(existsSync(path), `no ${path}`).toBe(true);
  });

  it.each(routes)('/%s/ is linked from the root page or a door', (route) => {
    const needle = `'/${route}/'`;
    const href = `href="/${route}/"`;
    const haystacks = [join(PAGES, 'index.astro'), ...doorIndexes];
    const found = haystacks.filter((path) => {
      const body = read(path);
      return body.includes(needle) || body.includes(href);
    });
    expect(
      found,
      `${route}: no link to /${route}/ in ${haystacks.join(', ')}`,
    ).not.toHaveLength(0);
  });
});

// inc8 Stage 2's other falsifier: the root page carries exactly three doors. It
// is asserted against the BUILT page, not the `sections` array in source --
// `make check` runs `astro build` before vitest, so dist/index.html exists, and
// the rendered list is what a reader actually gets. A fourth row added to the
// array reds this whether or not it renders.
describe('the root page carries exactly three doors', () => {
  const ROOT = join(process.cwd(), 'dist', 'index.html');
  const built = existsSync(ROOT) ? readFileSync(ROOT, 'utf8') : null;

  it('is built at all', () => {
    expect(built, `no built root page at ${ROOT} \u2014 run \`make build\``).not.toBeNull();
  });

  it('renders three <li> in the sections list', () => {
    // Astro appends a scope attribute (`data-astro-cid-*`) to every styled
    // element, so the open tag is matched loosely rather than literally.
    const list = (built ?? '').match(/<ul class="sections"[^>]*>([\s\S]*?)<\/ul>/);
    expect(list, 'no <ul class="sections"> in the built root page').not.toBeNull();
    const rows = [...(list?.[1] ?? '').matchAll(/<li[\s>]/g)].length;
    expect(rows, 'the root page is meant to carry three doors').toBe(3);
  });
});
