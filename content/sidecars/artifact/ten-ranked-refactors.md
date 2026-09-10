---
title: Ten ranked refactors, each with its own sizing
topic: cutting-a-repo-back-to-one-job
type: artifact
summary: A plan file that opens by naming the three jobs one repository was doing, then ranks ten refactors by impact against effort — every row carrying symptoms, why it is overkill, numbered steps, an effort and risk sizing, and the impact.
---

# Ten ranked refactors, each with its own sizing

The artifact is a markdown plan file produced from one instruction and a pasted
snapshot of the repository. It opens with a diagnosis rather than a list: the
repository is doing three jobs at once — the speech-to-text tool it is named
for, a generic project-bootstrap template, and a playground for AI agent
configuration. Everything that follows is downstream of that sentence.

Then ten refactors, ordered by impact against effort, each in the same five
fields: the symptoms you would notice, why the current shape is more than the
job needs, the numbered steps to change it, an effort and risk sizing, and what
you get. The uniform row shape is what makes the list rulable — you can compare
item three against item eight without re-reading either in full.

The items are concrete about removal. Lift the bootstrap template system out
into its own repository. Collapse five parallel agent-configuration files into
one canonical document. Cut nine CI workflows to one or two. Unify two
container definitions and replace the tests that assert on image labels with a
single smoke test. Narrow the configuration to the tool's actual job, dropping
settings left over from retrieval and model-serving experiments the repository
no longer runs.

It closes with an execution order grouping the ten into three passes, which is
the part that turns a ranked list into a sequence someone could actually work
through.
