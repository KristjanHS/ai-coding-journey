---
title: xls-analyser
repo: xls-analyser
start: 2025-12-06
end: 2025-12-06
commits: 9
stage: delegating
stage_peak: delegating
could_see: path-gated-rules
retrieved: editor-index
versioned: code-and-rules
verified_by: me-reading
cost_to_look: floor
tools: []
deck: false
artifact: present
---

# 06 · xls-analyser

## What I was trying to do

Turn raw Excel exports of cleaning-shift data into a report a non-technical reviewer could check against
what actually happened in the building — per-floor and per-cleaner time, heatmaps by hour and by date,
delivered as HTML and PDF. The whole thing was built in one day, 2025-12-06. The point was never the
Python; it was handing someone charts they could hold against reality and say "that's wrong."

## What didn't work

Two dead ends, both dated 2025-12-06. First, the PDF's links to the generated csv files pointed at
absolute home paths instead of the folder the report itself lived in, so they broke the moment the report
moved — fixed the same evening (commits `pdf links to csv relative. heatmap for full day hours` at 23:38
and `fixed pdf relative linking problem` at 23:51). Second, and worse because nothing flagged it: the
hourly heatmap showed floor 1 as heavily cleaned around 21:00. The number was correct; the meaning was
not. Cleaners were leaving the building *through* floor 1 at the end of a shift, not working there. A
chart can be arithmetically right and still lie, and no test in the repo could tell the difference.

## What I learned

Output that renders is not output that is right. The repo has the full gate — pre-commit, pyright, unit
tests, CI — and every bit of it verifies that the code runs, not that a heatmap means what it appears to
mean. The correctness of an analysis gets verified by a person who knows the building looking at the
chart, and each catch turned into a rule for the next run ("ignore exits via floor 1", "there is always
one cleaner — drop the 'team' axis"). That is the shape of delegating well: the agent writes the code, a
human owns whether the answer is true.

## Artifact

The reviewer's own note from the project's working page (2025-12-06), which became two same-day fix
commits (home path and run id sanitised):

> the links in pdf don't work: they should refer to the same folder as pdf itself, but currently they
> refer to home:
> `file:///home/<user>/projects/xls-analyser/UserData/results/<run>/team_floor_wing.csv`

The git log confirms the fix landed hours later: `pdf links to csv relative. heatmap for full day hours`
(23:38) and `fixed pdf relative linking problem` (23:51).

And the correctness catch that no gate could make, from the same page (Estonian in source, translated):

> Right now the heatmap claims floor 1 was cleaned enormously — in fact people came from cleaning another
> floor and left via floor 1 around 21:00. There should be no volume at 21:00 — why does it show a large
> volume? Answer: ignore exits via floor 1.
