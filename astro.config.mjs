// @ts-check
import { defineConfig } from 'astro/config';

// Static output: Vercel auto-detects an Astro static build, so inc3 deliberately
// ships no @astrojs/vercel adapter (see the inc3 spec, Contract 2).
export default defineConfig({
  site: 'https://ai-coding-journey.vercel.app',
  // The markdown IS the product and lives at content/, not src/content/ — the
  // collections in src/content.config.ts reach it with the glob loader's `base`.
  srcDir: './src',
});
