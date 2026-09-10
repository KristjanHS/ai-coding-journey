---
title: A proposal list is not cheaper to review than a patch
topic: rag-simplify-align
type: misconception
summary: Asking for proposals moves the reading cost rather than removing it — and the move is only worth it when the ruling is the hard part.
---

# A proposal list is not cheaper to review than a patch

The obvious reading of the proposals-not-edits move is that it saves work: a
numbered list is shorter than a diff, so reviewing it must be faster. That is
not what happens. A patch can be read against the code it touches — the
surrounding lines say whether the change is right. A proposal has no such
anchor. Deciding whether item four is worth doing means reconstructing the part
of the repository it describes, from memory or by going to look.

So the cost does not disappear; it moves from reading to deciding. The move pays
when deciding is the part you actually want to own, and when the alternative is
a patch you would have had to unpick anyway. It does not pay on work where the
right answer is obvious once you see the code, because then the list has made
you fetch the context the diff would have handed you.

The failure mode this produces is a long list ruled on too quickly. Nine items
arrive, three are clearly good, and the remaining six get waved through on the
strength of the first three. That is worse than reviewing a patch badly, because
nothing was shown.

## What didn't work

Treating list length as a proxy for scope. A nine-item list of one-line edits
and a nine-item list of architectural rewrites look identical at the point of
ruling, and only the second kind needs the repository open.
