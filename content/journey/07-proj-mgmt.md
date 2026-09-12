---
title: proj-mgmt
repo: proj-mgmt
start: 2026-03-29
end: 2026-08-11
commits: 11
stage: planning
stage_peak: planning
could_see: repo-index
versioned: code-and-rules
verified_by: tests
cost_to_look: no-log
tools: []
deck: false
artifact: present
---

# 07 · proj-mgmt

## What I was trying to do

Build a small project-management tool for myself — people and projects as JSON, an Excel importer and
exporter around them, and a handful of repo-local commands to ask questions of the data.

It was designed and built as a planning exercise. The first commit of the day adds a design document
with a versioned roadmap; the last one of the day moves that document into a folder named
`old_already_implemented`. Eight commits are dated 2026-03-29. The next commit in the repo is dated
2026-08-11.

## What didn't work

**A documentation pass that graded its own output.** One run generated roughly 1,800 lines across six
documents — a testing guide, a system architecture with diagrams, code standards, a project overview, a
codebase summary and a README — against roughly 2,900 lines of Python, tests included. It then scored
itself, and the score it reported was 100%.

What the validator actually checked is in its own summary: 318 references, of which 24 were internal
links and the rest file, function, constant and type references. That is reference integrity. It is a
real property and it is not the property the number sounds like. Nothing in the pass asked whether a
testing guide describes the tests that exist, or whether a reader needs 460 lines to run three test
files. The repo then sat untouched for four and a half months, so no reader ever put the documents
under load. A gate that can only resolve links will report a perfect score on documentation that is
never read.

**Declaring v1 complete on the day it was designed.** The roadmap was versioned — there was a v2 and a
v3 written down. Neither happened. Moving the design document to `old_already_implemented` the same day
it was written made the roadmap's later versions invisible in the tree, and the thing that actually
arrived in August was not v2: it was configuration copied in from another repo.

**The configuration layer arrived by inheritance, not by authorship.** In August this repo took its
rules, its settings and its skill file from chapter 08's repo and adapted them. That is consuming
governance, not writing it, which is why this chapter's peak rung stays at `planning` even though the
tree today looks like a configured repo. The dated evidence inside the repo is a design document and a
review fix; there is no in-repo commit where a policy was authored for this project's own reasons.

## What I learned

**A self-reported score names the thing it could reach, not the thing you wanted.** 100% here meant
"every reference resolves". The useful question — is this document true, and is it the right length for
its reader — has no checker, so it silently became the question that was not asked. The reading that
survives is the same one chapter 13 arrives at from the other direction: a passing gate is a claim, and
the claim it makes is only as wide as what it executed.

**The review pass was the part of the day that paid.** A one-day build reviewed by an agent produced
five concrete defects, one of which was a dead quadratic block in the validation path. None of them
would have been found by the documentation pass, which was the more impressive-looking artifact of the
two.

**Planning is a rung you can stop on.** This repo reached a design document, a roadmap and a working
v1, and then stopped. Nothing here was governed; the policy layer is borrowed. Reading the tree as it
stands today would date that layer to March, and it belongs to August and to a different repo.

## Artifact

The review fix, verbatim from the repo's own git log — commit `3355e94`, dated 2026-03-29. One external
tracker's field name is elided; nothing else is changed:

```text
Fix code review issues: type safety, dead code, consistency

- Remove dead O(n^2) code block in schema.py task validation
- Fix Task TypedDict: use NotRequired only for [an external tracker's id]
- Eliminate redundant people.json load in import main()
- Warn on non-YYYY-MM-DD date strings in import
- Make export main() return int consistently with import
```

And the documentation pass's own score block, verbatim from
`learn/260329-1625-proj-mgmt/summary.md`, dated 2026-03-29:

```text
validation_score = 100%
docs_coverage    = 100% (6/6 core docs for this project type)
size_compliance  = 100% (all under 800/300 line limits)

learn_score = (100 × 0.5) + (100 × 0.3) + (100 × 0.2) = 100
```

The three inputs are link resolution, a count of document types against a checklist, and a line-count
limit. The weighted total is presented as a score for the documentation. It is a score for the
formatting.
