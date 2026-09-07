import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import mdLinksPlugin, { rewriteMdLink, routeForContentFile } from '../src/md-links.mjs';

const CONTENT = join(process.cwd(), 'content');
const CLOSE = resolve(CONTENT, 'journey', '91-the-close.md');

/** Drives the plugin's `link` visitor the way Sätteri does, and reports the url. */
const visit = (url: string, from = CLOSE) => {
  const node = { type: 'link', url };
  const ctx = {
    fileURL: pathToFileURL(from),
    setProperty: (n: { url: string }, key: string, value: string) => {
      if (key === 'url') n.url = value;
    },
  };
  mdLinksPlugin().link(node as never, ctx as never);
  return node.url;
};

describe('md-links — one source form for GitHub and the site', () => {
  it('rewrites a relative .md link to its site route', () => {
    expect(visit('../course/skeleton.md')).toBe('/course/skeleton/');
  });

  it('keeps a fragment, and leaves every other link shape alone', () => {
    expect(visit('../course/skeleton.md#modules')).toBe('/course/skeleton/#modules');
    expect(visit('/course/skeleton/')).toBe('/course/skeleton/'); // already a route
    expect(visit('https://example.com/a.md')).toBe('https://example.com/a.md'); // external
    expect(visit('../course/skeleton.json')).toBe('../course/skeleton.json'); // not markdown
  });

  it('refuses the collections that have no per-slug route', () => {
    // measurements/ ships an index page only (src/pages/measurements/), so a
    // rewrite here would mint a route that 404s on the built site while the build
    // stayed green. Refusing leaves the .md link alone, which is no worse.
    expect(routeForContentFile(resolve(CONTENT, 'measurements', '04-claude-code.md'))).toBe(null);
    expect(visit('../measurements/04-claude-code.md')).toBe('../measurements/04-claude-code.md');
  });

  it('routes case-study the way its loader and [...slug] route actually do', () => {
    // The glob loader strips `/index` from the id, and [...slug].astro excludes the
    // landing id, rendering it at the section root instead.
    expect(routeForContentFile(resolve(CONTENT, 'case-study', 'crash-dash', 'index.md'))).toBe(
      '/case-study/',
    );
    expect(
      routeForContentFile(resolve(CONTENT, 'case-study', 'crash-dash', 'path-gated-rule.md')),
    ).toBe('/case-study/crash-dash/path-gated-rule/');
  });

  it('refuses a nested path in a flat collection', () => {
    // journey/prompts/course render a single `[slug]`, so a nested file has no route.
    expect(routeForContentFile(resolve(CONTENT, 'journey', 'sub', 'deep.md'))).toBe(null);
  });

  it('refuses a path that escapes content/', () => {
    expect(routeForContentFile(resolve(CONTENT, '../README.md'))).toBe(null);
    expect(rewriteMdLink('../../README.md', CLOSE)).toBe(null);
  });

  it('the close links the skeleton as a GitHub-resolvable file that exists', () => {
    // The point of the whole plugin: the SOURCE must be the .md form (dead on the
    // site without the rewrite, live on GitHub), and it must point at a real file.
    const body = readFileSync(CLOSE, 'utf8');
    expect(body.includes('](../course/skeleton.md)')).toBe(true);
    expect(() => readFileSync(join(CONTENT, 'course', 'skeleton.md'))).not.toThrow();
  });
});
