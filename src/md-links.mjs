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

/** `content/course/skeleton.md` → `/course/skeleton/`; null if outside content/. */
export const routeForContentFile = (absPath) => {
  const rel = relative(CONTENT_DIR, absPath);
  if (rel.startsWith('..') || !rel.endsWith('.md')) return null;
  return `/${rel.slice(0, -'.md'.length)}/`;
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
  };
}
