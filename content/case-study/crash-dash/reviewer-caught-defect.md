---
title: "A defect the reviewer caught: a cache that locked in failure"
summary: "An independent review sub-agent found a seam where a swallowed error would be memoised for the rest of the day."
origin: "a code review over one commit, 2026-09-06"
date: 2026-09-06
---

Every change in that repo is reviewed by a sub-agent with no memory of writing it. This is the clearest
thing that practice has caught.

## The change

A memoisation helper was being extended so a caller could evict a cached value on a condition of its own,
rather than only when the loader threw.

## The defect

The cache was keyed on the vintage of the data. Underneath it, the loader swallowed read failures from the
store and returned an *empty* result instead of raising — an empty collection, or entries with nothing in
them. The memoisation layer could not tell that apart from a genuine empty answer, so it cached it.

The failure scenario is specific. On a warm instance, the first request for a given vintage misses the
cache. If the store is briefly unavailable at that exact moment, the loader returns empty, the empty result
is stored, and **every subsequent request for that vintage gets the empty result** — long after the store
has recovered. A transient failure lasting seconds becomes a wrong answer lasting until the vintage rolls
over. Nothing errors; the output is simply blank.

## Why nobody saw it

The author saw a helper doing what it was asked. The existing tests asserted that a *rejection* is not
cached — which was true, and which is exactly the assertion that makes the gap invisible: it establishes
that the error path is handled, so the resolved path looks settled. And the two call sites both swallowed
store failures into empty structures, which is a reasonable local decision at each site and only becomes a
defect where it meets a cache.

A reviewer holding only the diff and no memory of the intent asked the question the author had already
answered for themselves: *is every resolved value a valid one?*

## The falsifier

Three assertions were added. When the caller's predicate says do-not-cache, the value is still returned but
not stored, and the next call re-runs the loader. When it says cache, behaviour is unchanged. With no
predicate at all, an empty value is still cached — the protection is opt-in, so existing callers are not
silently altered.

## The red demo

The commit message records the proof that those assertions can fail:

- Remove the predicate from the call ⇒ `expected 1 to be 2` — the empty result was cached, so the retry
  the test expects never happened.
- Force the predicate to always refuse ⇒ **7 failed tests**, including the one asserting that without a
  predicate an empty value *is* cached.
- With the fix in place: 289 tests passing, types clean.

The middle demo matters as much as the first: it proves the new assertions are not all pointing the same
way, so a change that breaks the opt-in contract is caught too.

## What didn't work

The instinct on reading the finding was to fix the *loader* — stop swallowing the store error. That is the
better fix and it was rejected here, because both call sites depend on the empty-on-failure behaviour and
changing it is a wider change than the commit under review. The lesson is not "always fix at the root"; it
is that a resolved value from a loader is not automatically a valid one, and a cache is where that
distinction stops being free.
