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
// The six-rung ladder. Exported so pages, components and the content suite read
// the vocabulary from one place instead of re-typing it.
export const RUNGS = [
  'asking',
  'suggesting',
  'delegating',
  'planning',
  'configuring',
  'governing',
] as const;

// The context ledger's five closed value sets. Each answers one question about
// what the machine had to work with, in the order the ledger block renders:
// could see → retrieved → versioned → verified by → cost to look.
export const COULD_SEE = ['pasted', 'open-file', 'repo-index', 'path-gated-rules'] as const;
export const RETRIEVED = ['copy-paste', 'editor-index', 'grep-on-demand'] as const;
export const VERSIONED = ['nothing', 'code', 'code-and-rules', 'governance'] as const;
export const VERIFIED_BY = ['nothing', 'me-reading', 'tests', 'agent-run-gate'] as const;
export const COST_TO_LOOK = ['no-log', 'counts-only', 'floor', 'cache-reuse'] as const;

const journey = defineCollection({
  loader: glob({ pattern: ['*.md', '!00-experiments.md', '!README.md'], base: './content/journey' }),
  schema: z.object({
    title: z.string(),
    // inc5b: the five git-derived keys are optional because the spine needs two
    // chapters that belong to no repo (the reserved 90- band). Author-owned keys
    // below stay required — a chapter with no title/tools/deck/artifact is a bug
    // in every case, repo-backed or not. timeline-from-git.py never opens a
    // repo-less file (main() enumerates repos, not chapter files), so these keys
    // are absent by construction there, not merely unvalidated.
    repo: z.string().optional(),
    start: isoDate.optional(),
    end: isoDate.optional(),
    commits: z.number().int().optional(),
    // The six-rung ladder (2026-09-08 taxonomy ruling). `stage` is the rung the
    // repo OPENED on, read off its first commit date — mechanical, never an
    // authored judgement. Seams: rung 4 opens 2026-02-28, 4→5 2026-04-05,
    // 5→6 2026-07-09.
    stage: z.enum(RUNGS).optional(),
    // `stage_peak` is the highest rung the repo REACHED. Defaults to `stage`;
    // a higher value ships only with a git-dated artifact inside that repo
    // evidencing the higher rung, which keeps this column as mechanical as the
    // first. Optional for the same reason `stage` is: the repo-less chapters of
    // the reserved 90- band carry neither.
    stage_peak: z.enum(RUNGS).optional(),
    // The context ledger — five enumerated fields, one block per chapter. Every
    // value is drawn from a closed set so the 13 × 5 comparison table is
    // computable and the vitest content suite can assert that a claimed value
    // owes its artifact, the same mechanism as the evidence rule. Prose values
    // were rejected: they would leave "context engineering" resting on prose,
    // which is what the anti-hype gate exists to catch. All five are optional —
    // the chapters fill them as they are drafted (ledger-first drafting), and a
    // required key would red `astro build` on nine stubs today.
    could_see: z.enum(COULD_SEE).optional(),
    retrieved: z.enum(RETRIEVED).optional(),
    versioned: z.enum(VERSIONED).optional(),
    verified_by: z.enum(VERIFIED_BY).optional(),
    cost_to_look: z.enum(COST_TO_LOOK).optional(),
    tools: z.array(z.string()),
    // inc5c: tools tried and rejected in this chapter's window. Distinct from
    // `tools` (what the era actually ran on) — a rejection is evidence too, and
    // the chapter that names one owes the reason in its prose. Optional because
    // the other twelve chapters carry no such key; making it required would red
    // `astro build` on all of them (the inc5b precedent for repo/start/etc.).
    evaluated: z.array(z.string()).optional(),
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

// inc5 pins the case-study schema: every artifact but the landing index.md carries
// `origin` (the relative path/commit it was rewritten from) and the `date` of that
// source. Both stay optional here because index.md carries neither — the vitest
// provenance guard (Stage 8) is what makes `origin` mandatory for the artifacts.
const caseStudy = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/case-study' }),
  schema: z.object({
    title: z.string(),
    summary: z.string().optional(),
    origin: z.string().optional(),
    date: isoDate.optional(),
  }),
});

const course = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/course' }),
  schema: provisional,
});

// inc5a: the citable narrative for each measured era lands here as one .md per era
// (D3 — a bespoke /measurements/ index links them; no generated [slug] route). The
// glob stays a shallow `*.md` on purpose: content/measurements/data/eras.json is the
// generated numbers, read by src/lib/measurements.ts, and must never enter the loader.
const measurements = defineCollection({
  loader: glob({ pattern: '*.md', base: './content/measurements' }),
  schema: provisional,
});

export const collections = { journey, prompts, 'case-study': caseStudy, course, measurements };
