---
title: token-monitor
repo: token-monitor
start: 2026-04-04
end: 2026-04-24
commits: 20
stage: configuring
stage_peak: configuring
could_see: repo-index
versioned: code-and-rules
verified_by: tests
cost_to_look: cache-reuse
tools: []
deck: false
artifact: present
---

# 10 · token-monitor

## What I was trying to do

Find out where the tokens go. A small Python command-line tool, standard library only, that reads
Claude Code's own session logs and reports per-session and per-project token usage — input, output,
cache writes and cache reads, per turn — and appends one row per analysed session to a running log.

The design document is dated 2026-04-04 and its approach is stated in one line: observe first, add a
few efficiency rules to the instruction file second, and no hooks. Twelve commits landed in the first
hour of that day; the tool was built, reviewed, documented and had its test suite cut down before
lunch. Four more days of commits followed over the next three weeks, and the last one, on 2026-04-24,
is titled "Optimize context subcommand for PostToolUse hook invocation". The thing the design ruled
out on day one is what the tool was being tuned for by day twenty.

This is the repo whose first commit lands one day inside the `planning` band and is ruled
`configuring` anyway: it opens with a 55-line `CLAUDE.md` carrying three numbered rules, rewritten
thirty-one minutes later (`3ea4845`) into a two-level disclosure scheme, and its purpose is to measure
the cost of the governance the other repos were accumulating.

## What didn't work

**The core lookup was broken from the first commit, and the reviewer's suite did not catch it.** The
tool finds a project's session logs by turning the working directory into a slug. The slug computation
doubled a leading dash, so the directory was never found from inside a project. The fix landed
sixteen minutes after the "comprehensive test suite" commit. Two days later the same lookup failed
again, from a git worktree this time, and needed a fallback chain that walks the `.git` file to the
main repo.

**The comprehensive test suite was one third padding.** Forty-four minutes after it was written,
eighteen tests were deleted for verifying Python language guarantees — that `len` returns a length,
that a dataclass has its defaults. Three more fragile tests went next, one of them testing a string
method instead of the production code. Ten tests of one function became three. What survived is a suite of a bit over a
hundred, and the README still says the tool has a hundred and seven of them; the tree holds more,
and no check ties the two.

**A third copy of the global config was committed and deleted within thirteen minutes.** The design doc
already described the changes; a `config-backup/` directory was added anyway, then removed with the
note that two copies were enough. That is a small thing, and it is the pattern of the whole day: the
agent produces the artifact that looks complete, and the reviewer pass — human or agent — is where the
day's actual work happens.

## What I learned

**A measuring tool has a ledger of its own, and it was not spared.** The tool that counts wasted tokens
began with eighteen tests it did not need, a duplicated config directory and a broken path lookup.
Nothing about the subject matter of a repo makes its first-hour output more careful.

**"No hooks" was a scoping decision, not a finding.** The design's out-of-scope list was written before
the data existed. Once the numbers were readable, the obvious next move was to read them on every tool
call — and the last commit rewrote the parser to read only the tail of a log file so that the hook
would be cheap enough to run. The hook itself lives in the global config, outside this repo, so this
chapter cannot show it; what it can show is the commit that made it affordable.

**A count documented in prose drifts the moment it is written.** The README's test count was true on
the day and false a day later. The same lesson runs through this whole site: a number in a paragraph
is a claim about a moment, and the only counts worth trusting are the ones a check regenerates.

## Artifact

The repo's own instruction file on its first day — the three numbered rules that make this repo's
peak `configuring`:
[Day one opened with an instruction file](../atoms/configuring--day-one-had-an-instruction-file.md)

## Atoms

- [Day one opened with an instruction file](../atoms/configuring--day-one-had-an-instruction-file.md)
