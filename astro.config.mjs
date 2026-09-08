// @ts-check
import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import { satteri } from '@astrojs/markdown-satteri';
import mdLinksPlugin from './src/md-links.mjs';

// Static output: Vercel auto-detects an Astro static build, so inc3 deliberately
// ships no @astrojs/vercel adapter (see the inc3 spec, Contract 2).
export default defineConfig({
  site: 'https://ai-coding-journey-five.vercel.app',
  // The markdown IS the product and lives at content/, not src/content/ — the
  // collections in src/content.config.ts reach it with the glob loader's `base`.
  srcDir: './src',
  // Cross-content links are authored as relative `.md` paths (GitHub-resolvable)
  // and rewritten to site routes here — see src/md-links.mjs.
  markdown: { processor: satteri({ mdastPlugins: [mdLinksPlugin()] }) },
  // The timeline is the site's only island (inc4 ruling b). Preact, not React:
  // it is the first runtime dependency and the first client JS to ship.
  integrations: [preact()],
  // /prompts/ was the collection's address until it was reframed as context
  // artifacts; the old URL is already published, so it redirects rather than 404s.
  redirects: {
    '/prompts': '/artifacts',
    '/prompts/[slug]': '/artifacts/[slug]',
  },
});
