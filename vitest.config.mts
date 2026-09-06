import { defineConfig } from 'vitest/config';

// The content suite is the executable half of the two content rules in
// `.claude/rules/content-writing.md` (evidence + anti-hype). It reads markdown
// off disk with node:fs — no Astro, no jsdom, no browser environment needed, so
// the default `node` environment is deliberate rather than unconsidered.
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
