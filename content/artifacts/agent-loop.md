---
title: The agent loop
source: OneNote — "AI coding agent prompts"
kind: prompt
captured: 2025-12-07/2026-06-21
---

# Prompts · the agent loop

Captured in OneNote between 2025-12-07 and 2026-06-21. Individual prompts are undated in the
source and no date is inferred. Whether a given prompt is still in use is likewise not recorded —
entries are unmarked rather than guessed.

These are reproduced as written, including typos and the Estonian notes-to-self. They are not
cleaned up, because the point of the page is what was actually typed.

The section headings below are the author's own, in the order they appear in the notebook. They
trace one loop — plan, review the plan, execute under a gate, check against the goal, review the
result, and debug when it fails. The taxonomy is the artifact here; the individual prompts are
slot-fillers in it.

## Create a plan

The flagship entry is not a prompt but a hand-run pipeline across three models in separate tabs.
The Estonian lines are the stage directions:

> 1. Audit my testing approach / Alternatiiv: Audit the contents of my test scripts
>     - against best practices, and make a small plan to resolve only the biggest problem. don't execute the plan
>     - Teises tabis gemini Pro: kopeerida plaan ja execute the plan
>     - Peale gemini poolset plan executionit uus o3 prompt:
>         - review the modifications to make sure best practices are followed. then make next small plan to resolve next biggest problem. don't execute the plan.

*Alternatiiv* — alternative. *Teises tabis gemini Pro: kopeerida plaan ja execute the plan* — "in the
other tab, Gemini Pro: copy the plan and execute the plan". *Peale gemini poolset plan executionit uus
o3 prompt* — "after Gemini's plan execution, a new o3 prompt". One model plans, a second executes, a
third reviews, and the human is the message bus between them.

A plainer variant, for when the whole suite is red:

> Currently i have a lot of failing tests in my test suite. Familiarize with my test suite, then make a small plan to make the test suite work, one small step at a time: for ex find out the first failing test and plan its isolated debug+fix, before continuing to find the next failing test. Start with the simple tests. Dont execute the created plan.

And the sizing constraint that makes a plan executable by an agent at all:

> audit the preparation_todo.md keeping in mind it is intended for use by AI agent - so each step must be small / granular enough so it can be tried, fixed and fix-verified within a single agent chat session
> now make sure the todo list is not too restrictive for execution agent - we don't want to prescribe the details that can change during the actual todo execution

## Review the plan

One formula recurs across at least four prompts and four different models. The load-bearing clause is
the parenthesis — it asks for justification rather than compliance, which makes disagreement a valid
answer:

> validate all planned tasks against best practices (explaining why you think they were right, or admitting the problem), and change the plan to correct the tasks that were not following the best practices, while keeping it simple, not over-engineering. Modify the plan as tasks in product_todo.md. Don't yet execute the plan.

For a fork in the design rather than a whole plan:

> propose 3 alternatives how to implement problem 9 solution, from cleanest to best practices@docs/archit_audit.md aligned

## Execute the plan

Used on Gemini CLI — the notebook says `kasutasin gemini CLI peal`. The gate is the whole point: a
review after every task, no advance without permission, and verification before anything is marked
done.

> start executing the P0 plan in product_todo.md, making a review after completing every task, and continuing to next task only after my permission. make sure you pass verification step before marking task done.

## Feature changes vs goal

> Now check if the modified solution really satisfies the goals of P… Make a simplest possible plan to only correct the code changes that went in the wrong direction.

## Review the implemented solution

The same justify-or-admit clause, turned on the diff after the fact:

> Now check all the code changes made in this chat session, search for the best practices for cases that were solved here, validate all code changes against these best practices (explaining why you think they were right, or admitting the problem), and make a simplest possible plan to only correct the code changes that went in the wrong direction.

Followed by a simplification pass:

> Re-think the solutions: is it possible to make these simpler while still aligning with best practices?

## Tests failing

The most transferable prompt on the page. It refuses to assume the code is wrong, which is the
default failure mode when an agent is told "fix the failing test":

> Describe what the failing test(s) are trying to assert. Then, describe the actual behavior of the solution code covered by this test. Finally, decide which is incorrect and needs modification: the test or the solution code.

Supporting asks from the same section:

> Check to make sure the failing tests are making right assumptions about the application logic.

When neither side is legible yet, instrument first:

> Add reusable logs to the problematic places, so that you would get more info about the failure reasons.

## Plan for debug

> Take a step back, focus only on one top problem, and make a plan how to debug and solve it in small incremental steps.

## Questions for research

The notebook's margin note here records a surprise: `gemini CLI hakkas ise peale küsimuste püstitamist
neid googeldama!` — "Gemini CLI started googling them itself after formulating the questions!"

> Take a step back and provide the overall problem decription, as a context for specific research questions. Then list the questions to be researched by online searching, also explaining the problem to be solved.

These two are prefixes, not standalone prompts — `Gemini küsimuse ette panna`, "put in front of the
Gemini question":

> Search the web for answers, then provide clear (but not restrictive) answers that I can lean on when creating my next step plan. I want my solution to be aligned with best practices but not over-engineered.

The second variant hands the same job over when the questions came from another agent rather than
from the author:

> Here are new questions from AI coding agent. Search the web for answers, then provide answers that are not too restrictive, aiming to help agent create its plan for proceeding.

And the counterpart when the answers go back to the coding agent — `Cursor agendile vastuse andmisel
ette panna`, "put in front when giving the answer to the Cursor agent". The hedge is the interesting
part: the agent is told to distrust the human.

> Here are my answers. Now make **action** plan based on that, but still be sceptical when using my answers - maybe i got some info wrong.

## What recurs

Four phrases appear across every model used — Copilot, Cursor, Gemini, o3, DeepSeek:

- "explaining why you think they were right, or admitting the problem"
- "the simplest possible plan"
- "don't yet execute the plan"
- "be sceptical when using my answers - maybe i got some info wrong"

Three of the four are brakes. The prompts are mostly not asking for code; they are asking for a plan,
withholding permission to act on it, and then asking for the plan to be argued against.
