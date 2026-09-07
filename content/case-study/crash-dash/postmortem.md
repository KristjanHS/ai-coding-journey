---
title: "The defect log: what went wrong, and what now catches it"
summary: "Every entry carries a seam and a falsifier. Entries are deleted when their fix ships, so the log's length is the debt."
origin: "docs/backlog.md"
date: 2026-09-07
---

*Fallback source.* The two documents scouted for this slot did not qualify: one is a stub that redirects
elsewhere, the other is a taxonomy of verification patterns rather than a record of incidents. The defect
log is the document that is actually postmortem-shaped, so it fills the slot.

Its unit is not "a bug" but **what went wrong · the seam · the falsifier that now guards it · severity**.
An entry without a falsifier is not finished being written.

## Eight entries, generalised

1. A feature stage shipped with unit-level parity only, so parts of the interface were never painted.
   *Falsifier:* a manual run against user data with more than one entry.
2. The coverage gate went dark when the continuous-integration budget ran out — a regression could deploy
   unobserved. *Falsifier:* delete a test until coverage drops; the local check stays green anyway, which
   is the defect.
3. A local database snapshot could not be restored: a migration existed in the repo and in production but
   not locally. *Falsifier:* reset the database and re-run the restore; it must exit clean.
4. Live data fetches remained in code after the store became authoritative. *Falsifier:* a search for
   fetch calls — every hit is debt, by definition.
5. A scheduled smoke test degraded a `<signal>` and exited successfully anyway. *Falsifier:* degrade one
   identifier deliberately; the scheduled run must fail.
6. Prose conventions were not machine-checked — the guard that verifies rule citations walked code and
   scripts but never documentation. *Falsifier:* write a citation in a document; it passes today.
7. **Highest severity, output-visible.** An incomplete response from an upstream API was persisted as a
   complete read set, with the shortfall unrecorded. A `<signal>` floor rendered with no data, a detector
   set came back empty, and a fallback row was shown to the user as if it were an answer. The seam: the
   degradation-handling function swallowed the unread batch without logging it. *Falsifier:* query the run
   readings by timestamp; the expected identifiers must all be present.
8. A per-`<signal>` multiplier was accepted in configuration and never applied — only the shared
   multiplier reached the threshold. *Falsifier:* a search for the per-signal value's use returns zero
   call sites.

## The pattern across them

Five classes recur: prose that no longer matches the code it describes; processes that exit successfully
while failing; values nothing pins; off-by-one and inverted conditions; and — the expensive one — fixing
one instance of a defect without sweeping the class.

Entry 7 is all five at once, which is why it is the one that reached the output.

## The process

An entry records its owner, the date it was found, the seam, and a falsifier or probe. It is **deleted in
the commit that ships its fix** — no tombstones, no "done" markers. That single convention makes the log's
length a live measure of debt rather than a growing archive nobody reads. Highest-severity items triage
first; anything too large to fix in place becomes a plan document with a back-pointer.

## What didn't work

The log began with severity labels and no falsifiers. Entries then aged into folklore: a sentence
describing a symptom nobody could still reproduce, which could neither be fixed nor honestly deleted.
Requiring a falsifier per entry at writing time fixed that — not because the falsifiers all get run, but
because an entry you cannot state a falsifier for turns out, most of the time, not to be an entry.
