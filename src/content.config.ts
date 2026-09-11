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

// ---------------------------------------------------------------------------
// inc7b — the atom corpus. A deck is a query over these facets, not a file
// order, so every facet is a closed set: an open string would make the query
// unwritable and the vitest pins vacuous.

// Who a cut is for. Fixed by the vision, not chosen here.
export const AUDIENCES = ['university', 'rnd-engineers', 'meetup', 'linkedin'] as const;

// The lecture's running-order slots, in order. Mirrors `content/deck.json`'s
// slot ids: z.enum needs a literal tuple (a JSON import is not one), so the two
// are separate sources and `tests/deck-slots.test.ts` pins them equal in order.
export const SLOTS = ['open', 'locate', 'climb', 'toolkit', 'live', 'worksheet', 'qa'] as const;

// What the atom DOES to a listener — deliberately not a reader-experience scale
// (intro/practitioner/expert), which maps near-1:1 onto `audience[]` and would
// encode one axis in two keys. `orient` says what changed, `show` puts the thing
// on screen, `govern` names the gate that holds it.
export const LEVELS = ['orient', 'show', 'govern'] as const;

// NAME COLLISION, on purpose: the frontmatter facet `evidence:` is the KIND of
// the atom's one verbatim line; the `## Evidence` section is the line itself.
// The four values are cut by what a line can display, which is why the eight
// sidecar types are not reused — `era`, `misconception` and `method` are never
// a shown line, so those members would be unreachable by construction.
export const EVIDENCE_KINDS = ['defect', 'number', 'artifact', 'transcript'] as const;

// The governance concern an atom answers — the ledger's five fields grouped:
// could-see + retrieved → control, versioned → provenance, verified-by →
// quality, cost-to-look → cost; control also takes who keeps the decision.
// The concern follows what the `## Evidence` line shows. Rung × concern is the coverage grid.
export const CONCERNS = ['control', 'provenance', 'quality', 'cost'] as const;

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

// The context-artifact collection: a prompt is one of FIVE kinds of thing you put
// in front of a model, and `kind` is what makes the other four sayable at all.
// `captured` is a free-form span ("2025-12-07/2026-06-21"), not a single date —
// the source undates individual entries, so no ISO shape is imposed on it.
export const ARTIFACT_KINDS = ['prompt', 'rule', 'skill', 'hook', 'memory'] as const;

const artifacts = defineCollection({
  loader: glob({ pattern: '*.md', base: './content/artifacts' }),
  schema: z.object({
    title: z.string(),
    source: z.string(),
    captured: z.string(),
    kind: z.enum(ARTIFACT_KINDS),
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
// provenance guard (Stage 8) is what makes `origin` mandatory for those pages.
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

// A topic groups one idea: its atom(s) and (from Stage 2) its sidecars. Topics
// are files rather than a free-text tag so that "every sidecar resolves a topic"
// is a referential-integrity check over the filesystem rather than prose.
const topics = defineCollection({
  loader: glob({ pattern: '*.md', base: './content/topics' }),
  schema: z.object({
    title: z.string(),
    summary: z.string().optional(),
  }),
});

// One claim plus one shown piece of evidence, ~15 lines, slide-ready as written.
// `minutes` is a spoken-duration estimate, informational only: nothing gates on it.
const atoms = defineCollection({
  loader: glob({ pattern: '*.md', base: './content/atoms' }),
  schema: z.object({
    title: z.string(),
    // Required, all of them: an atom missing a facet is not queryable, and an
    // unqueryable atom cannot reach a deck. This is the one collection where an
    // optional facet would defeat the schema's whole job.
    topic: z.string(),
    rung: z.enum(RUNGS),
    concern: z.enum(CONCERNS),
    question: z.string(),
    audience: z.array(z.enum(AUDIENCES)).nonempty(),
    evidence: z.enum(EVIDENCE_KINDS),
    minutes: z.number(),
    level: z.enum(LEVELS),
    // The chapter this was mined for. Stage 4's transclusion query keys on it.
    source_chapter: z.string(),
    // The running-order slot this atom is spoken in. Required: an atom with no
    // slot has no place in the deck, and the deck route groups strictly by slot.
    slot: z.enum(SLOTS),
    // Where the `## Evidence` quote is reproduced FROM, when that file is public
    // and in-repo. `source_chapter` cannot serve: it is a mining target, not
    // provenance. Absent means the quote came from a private source, and the
    // verbatim gate skips the atom explicitly rather than passing it silently.
    quote_from: z.string().optional(),
  }),
});

// The eight kinds of supporting material a topic can carry. Totality is pinned
// by set-equality against the `content/sidecars/` directory listing in both
// directions (`tests/content-sidecars.test.ts`), so every member here
// owes a directory on disk and every directory owes a member here.
export const SIDECAR_TYPES = [
  'transcript',
  'artifact',
  'decision',
  'failure',
  'tool-eval',
  'method',
  'misconception',
  'era',
] as const;

// Supporting material for a topic: what the source showed, described rather
// than reproduced. There is deliberately NO evidence or quote field -- the
// public tier carries descriptions, and identifying detail stays in the private
// store. A no-blockquote guard over `content/sidecars/**` enforces that at the
// gate; see the Stage 2 rulings in docs/plans/2026-09-09-inc7-mine-spec.md for
// what it does and does not catch.
const sidecars = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/sidecars' }),
  schema: z.object({
    title: z.string(),
    // Both required. A sidecar with no topic is unreachable material, and a
    // sidecar with no type cannot be grouped -- the two facets ARE the index.
    topic: z.string(),
    type: z.enum(SIDECAR_TYPES),
    summary: z.string().optional(),
  }),
});

export const collections = {
  journey,
  artifacts,
  'case-study': caseStudy,
  course,
  measurements,
  topics,
  atoms,
  sidecars,
};
