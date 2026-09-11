import { readFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// One source form for two surfaces. Chapters link each other as relative `.md`
// paths so GitHub — where the markdown IS the product — resolves them as files;
// this plugin rewrites those same links to site routes at build time. Writing the
// site form in the source would invert the breakage: correct on Vercel, dead on
// GitHub (a leading slash resolves against github.com).
//
// A Sätteri mdast plugin, not a `remarkPlugins` entry: Astro 7 replaced the
// unified processor with Sätteri, and `markdown.remarkPlugins` now hard-errors
// unless @astrojs/markdown-remark is installed alongside it.
const CONTENT_DIR = resolve(process.cwd(), 'content');
const RELATIVE_MD = /^\.\.?\//;

// The deck ships on a USB stick and opens from `file://`, where Astro's default
// `/_astro/…` image asset would resolve to filesystem root and vanish — the same
// failure `tests/deck-offline.test.ts` guards for stylesheets. A markdown image
// under `content/media/` is therefore inlined as a `data:` URI at build time, so
// the `.md` source stays a plain relative path (GitHub renders it as a file) while
// the built HTML carries no external reference. Rewriting the mdast node's url
// before Astro's `collect-images` sees it keeps the src out of `localImagePaths`,
// so the asset pipeline never tries to emit it.
const MEDIA_DIR = resolve(CONTENT_DIR, 'media');
const MEDIA_MIME = {
  gif: 'image/gif',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  svg: 'image/svg+xml',
  webp: 'image/webp',
};

/** A relative image url resolving into `content/media/` → a `data:` URI; null otherwise. */
export const dataUriForImage = (url, fromFile) => {
  if (typeof url !== 'string' || !RELATIVE_MD.test(url)) return null;
  const abs = resolve(dirname(fromFile), url.split(/[?#]/)[0]);
  if (relative(MEDIA_DIR, abs).startsWith('..')) return null;
  const mime = MEDIA_MIME[abs.slice(abs.lastIndexOf('.') + 1).toLowerCase()];
  if (!mime) return null;
  return `data:${mime};base64,${readFileSync(abs).toString('base64')}`;
};

// The site's REAL route table, not "every file under content/". `measurements`
// has an index page and no `[slug]` route, so a link into it would rewrite to a
// route that 404s on the built site; `case-study` is nested, strips `/index` the
// way the glob loader does, and renders its landing entry at the section root;
// `sidecars` is nested too, but with no landing entry and no `/index` stripping.
// Anything this map cannot place is refused — inventing a route is worse than
// leaving the `.md` link alone, because the build stays green either way.
const CASE_STUDY_LANDING = 'crash-dash'; // mirrors LANDING_ID in [...slug].astro
const FLAT_COLLECTIONS = new Set(['journey', 'artifacts', 'course', 'atoms', 'topics']);
// `sidecars` is the second nested collection: its ids carry the type directory
// (`decision/foo`), which is why its page is a rest route and not `[slug]`. Two
// segments exactly -- one would be a type directory with no file, three a depth
// the loader never produces.
const NESTED_SIDECAR_SEGMENTS = 2;

/** `content/course/skeleton.md` → `/course/skeleton/`; null when unroutable. */
export const routeForContentFile = (absPath) => {
  const rel = relative(CONTENT_DIR, absPath);
  if (rel.startsWith('..') || !rel.endsWith('.md')) return null;
  const [collection, ...rest] = rel.slice(0, -'.md'.length).split('/');
  const id = rest.join('/').replace(/(^|\/)index$/, '');
  if (FLAT_COLLECTIONS.has(collection)) return rest.length === 1 ? `/${collection}/${id}/` : null;
  if (collection === 'case-study') {
    if (!id) return null;
    return id === CASE_STUDY_LANDING ? '/case-study/' : `/case-study/${id}/`;
  }
  if (collection === 'sidecars') {
    return rest.length === NESTED_SIDECAR_SEGMENTS ? `/sidecars/${id}/` : null;
  }
  return null; // `measurements` and anything new: no per-slug route to point at.
};

/** The rewrite itself, split out so it is testable without a compile. */
export const rewriteMdLink = (url, fromFile) => {
  if (!RELATIVE_MD.test(url)) return null;
  const [path, hash] = url.split('#');
  if (!path.endsWith('.md')) return null;
  const route = routeForContentFile(resolve(dirname(fromFile), path));
  if (!route) return null;
  return hash === undefined ? route : `${route}#${hash}`;
};

export default function mdLinksPlugin() {
  return {
    name: 'content-md-links',
    link(node, ctx) {
      if (!ctx.fileURL) return;
      const next = rewriteMdLink(node.url, fileURLToPath(ctx.fileURL));
      if (next) ctx.setProperty(node, 'url', next);
    },
    image(node, ctx) {
      if (!ctx.fileURL) return;
      const uri = dataUriForImage(node.url, fileURLToPath(ctx.fileURL));
      if (uri) ctx.setProperty(node, 'url', uri);
    },
  };
}
