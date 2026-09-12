---
title: proj-mgmt
repo: proj-mgmt
start: 2026-03-29
end: 2026-08-11
commits: 11
stage: planning
stage_peak: configuring
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

It was designed and built in an afternoon. The first commit of the day, at 12:55, adds a design
document with a versioned roadmap; by 13:36 that document has been moved into a folder named
`old_already_implemented` and v1 is declared complete. The day's last commit, at 16:26, is a
documentation pass. Eight commits are dated 2026-03-29. The next commit in the repo is dated
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

**The policy layer was written before the tool had earned it, and the borrowed half arrived after the
tool was dead.** Between 13:09 and 13:29 this repo authored seven `/pm:` commands and a 62-line project
`CLAUDE.md` — instruction files written for this project's own reasons, git-dated inside it, and the
reason this chapter's peak rung is `configuring` rather than the `planning` it opened on. Three hours
later the tool was finished and nobody ran any of them again.

Then in August the repo took `.claude/rules/` and a skill edit from chapter 08's repo and adapted
them — fifty-one lines of adopted governance landing in a repo with nothing left to govern. The
distinction matters both ways round: the commands are authored and count, the rules are consumed and
do not, and neither of them was ever load-bearing here.

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

**Reaching a rung is not living on it.** The peak this chapter records is a two-minute stretch of one
afternoon. That is what the measurement says and it is all it says — a ladder built from the highest
rung a repo touched will always read as more governed than the repo felt, and this one is the clearest
case of it in the set. Reading today's tree would date the whole config layer to March, when half of
it belongs to August and to a different repo.

## Artifact

The review fix, the commit message body verbatim from the repo's own git log — commit `3355e94`, dated
2026-03-29. One external tracker's field name is elided, and the trailer is dropped:

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

And one of the seven commands authored in-repo that afternoon — the opening of
`.claude/commands/pm/conflict-check.md`, committed 13:27 on 2026-03-29. This is the artifact that
raises the chapter's peak to `configuring`: it is a checkable procedure written for this project, not
a baseline adopted from elsewhere.

```markdown
Detect dependency conflicts and date inconsistencies within a project.

$ARGUMENTS — project slug. If omitted and multiple projects exist, ask which one.

## Steps

1. **Load and validate data.**
   Read `data/people.json` via `pm.loader.load_people`, then load the project via `pm.loader.load_project`. Stop on validation errors — schema issues are reported here, not below.

2. **Check dependency chains.**
   - **Circular dependencies**: walk the dependency graph (DFS). Report each cycle found. (The schema validator already catches these, but confirm and explain them in plain language.)
   - **Finish-to-start violations**: for every `finish-to-start` dependency, verify the predecessor's end date is before the dependent task's start date. Flag violations with both task names and dates.
```

It names the loader functions it must call and the order it must check in, and it says where errors
stop. That is the shape the later rules layer has too — which is exactly why adopting that layer read
as progress when it was not.
