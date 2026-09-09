---
title: "Case study: the governance layer of a private app"
summary: "Six sanitised markdown artifacts from a private ~5k-commit repo — the layer that governs the agent, not the code it wrote."
---

The app this journey ends at is private, so none of its code appears here. What can travel is the layer
above the code: the markdown that tells an agent how to work in that repo — and that layer turns out to be
the part worth copying anyway.

Each artifact below is a **rewrite**, not an excerpt. Domain identifiers are generalised to placeholders,
paths are relative, and nothing here is a source file. Every artifact names the relative path it was
rewritten from, so the shape stays checkable even though the original does not ship.

## Why these six

Governance in that repo is a *layer*, not a file, and the six slots are the six distinct jobs the layer
does. Each names the ledger field on `/journey/` it is the evidence for:

1. **Governance root** — the always-loaded instructions that set the repo's non-negotiables. Ledger field: **versioned**.
2. **Path-gated rule** — a convention that loads only when you touch the files it governs. Ledger field: **could see**.
3. **Shipped plan doc** — how a change is specified before it is built, alternatives-rejected included. Ledger field: **versioned**.
4. **Reviewer-caught defect** — what an independent review sub-agent found that the author had not. Ledger field: **verified by**.
5. **Test / red-demo discipline** — the rule that a new assertion must be shown to fail first. Ledger field: **verified by**.
6. **Postmortem** — what the repo records after something breaks. Ledger field: **cost to look**.

Drop any one and the layer stops working: the root without path-gated rules loads everything at once, the
rules without a red-demo discipline accumulate checks that cannot fail, and the plan docs without a
postmortem never learn from what shipped broken.

## What this is not

Not a tutorial and not a template to copy wholesale. The interesting claim is the *shape* — that a coding
agent working in a large repo needs a governance layer with these six jobs in it, and that the layer is
maintained like code, with its own review and its own failing tests.
