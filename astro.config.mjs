// @ts-check
import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';

// Static output: Vercel auto-detects an Astro static build, so inc3 deliberately
// ships no @astrojs/vercel adapter (see the inc3 spec, Contract 2).
export default defineConfig({
  site: 'https://ai-coding-journey-five.vercel.app',
  // The markdown IS the product and lives at content/, not src/content/ — the
  // collections in src/content.config.ts reach it with the glob loader's `base`.
  srcDir: './src',
  // The timeline is the site's only island (inc4 ruling b). Preact, not React:
  // it is the first runtime dependency and the first client JS to ship.
  integrations: [preact()],
});
