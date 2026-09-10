---
title: Four simplifications of fifteen, chosen by risk
topic: rag-simplify-align
type: decision
summary: Fifteen over-engineered areas came back; four were done. The filter was not impact but whether the refactor could lose a feature.
---

# Four simplifications of fifteen, chosen by risk

The simplification scan returned fifteen areas. The fork was whether to work
through all of them or cut the list, and the cut was made on a narrower test
than impact: take only the items where the refactor could not lose a feature.

Four survived it. Logging dropped its writable-directory probing and wrote to
stdout and stderr instead. Model preload stopped toggling behaviour on a
test-mode environment variable and became lazy loading with fixtures. The Ollama
path replaced multi-step detection and progress tracking with a single attempt
to pull. And the CI workflows lost their parallel local and formatted variants,
leaving one canonical version per job.

What the choice cost is the eleven that stayed on the list — the test-support
module's re-exports, merging the Docker variants, centralising the Weaviate
client. Those are not harder to understand; they are harder to undo, because
each one has a consumer whose behaviour is not pinned by a test. The four that
shipped all had the same three properties: no feature to lose, an obvious
fallback if the simpler form misbehaved, and test coverage already in place
before the edit started.

## What didn't work

Ranking the fifteen by impact first. The ranking was produced and then ignored,
because impact and risk did not correlate — two of the highest-impact rows were
exactly the ones with unpinned consumers, and the ordering the list arrived in
was never the order anything was done in.
