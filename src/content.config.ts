import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// A bare YYYY-MM-DD in YAML is a timestamp, so the frontmatter reaches Zod as a
// Date, not a string — the plan's plain z.string() reds on every chapter. Read
// the digits back in UTC (never getFullYear()/getMonth(), which shift a day west
// of Greenwich) and validate the string form, so a typo'd date still reds.
const isoDate = z
  .union([z.string(), z.date()])
  .transform((v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v))
  .pipe(z.string().regex(/^\d{4}-\d{2}-\d{2}$/));

// One collection per content/ section. The markdown never moves into src/ —
// `base` points the loader at the repo's product directory instead.
//
// README.md is the generated GitHub index table and 00-experiments.md is the
// sub-5-commit round-up; neither carries frontmatter, so both would red the
// schema. Excluded here — the experiments reach /journey/ through timeline.json.
const journey = defineCollection({
  loader: glob({ pattern: ['*.md', '!00-experiments.md', '!README.md'], base: './content/journey' }),
  schema: z.object({
    title: z.string(),
    repo: z.string(),
    start: isoDate,
    end: isoDate,
    commits: z.number().int(),
    stage: z.enum(['chat', 'local-llm', 'first-agent', 'config-engineering', 'production-app']),
    tools: z.array(z.string()),
    deck: z.boolean(),
    // Both states are real: scripts/timeline-from-git.py emits `pending` for a
    // fresh chapter stub, and 9 of 13 chapters are still stubs. The evidence
    // rule — a `present` chapter really carries an artifact — is asserted by the
    // vitest content suite (inc3 Stage 3), not by this schema.
    artifact: z.enum(['present', 'pending']),
  }),
});

// The prompts collection: sanitised, reusable prompts lifted from OneNote.
// `captured` is a free-form span ("2025-12-07/2026-06-21"), not a single date —
// the source undates individual prompts, so no ISO shape is imposed on it.
const prompts = defineCollection({
  loader: glob({ pattern: '*.md', base: './content/prompts' }),
  schema: z.object({
    title: z.string(),
    source: z.string(),
    captured: z.string(),
  }),
});

// case-study and course are real collections over real (currently empty) dirs,
// so inc5 ships content by dropping .md files in rather than by building the
// wiring it assumed was already there. Each dir carries a .gitkeep because git
// cannot track an empty one, and a glob loader on a missing `base` warns every
// build. Until inc5 no entry exercises these schemas, so they stay provisional:
// `title` is the one key any index needs; inc5 owns pinning the rest.
const provisional = z.object({
  title: z.string(),
  summary: z.string().optional(),
});

const caseStudy = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/case-study' }),
  schema: provisional,
});

const course = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/course' }),
  schema: provisional,
});

export const collections = { journey, prompts, 'case-study': caseStudy, course };
