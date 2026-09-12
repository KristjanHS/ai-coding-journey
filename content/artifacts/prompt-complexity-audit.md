---
title: An audit prompt, and the schema it forced
source: a private ChatGPT thread, 2025-12-09 — "Audit project complexity"
captured: "2025-12-09"
kind: prompt
---

# Prompt · audit a repo for overengineering, get a ranked plan back

One line, aimed at a whole repository pasted in as a single `repomix` dump: it asks for a
complexity audit and a written refactor plan, not a fix. It is still used as-is.

```text
audit the project for unnecessary complexity and overengineering, and create .md plan for 10 highest value refactors
```

The prompt travelled with one attachment — a `repomix` export of the repo, the flattened
single-file form a model can read end to end. Nothing else steered it.

## The schema it forced

The reply did not answer in prose. It emitted ten numbered refactors, each under the same fixed
skeleton — and because the skeleton is fixed, the ten are comparable at a glance:

- **Symptoms** — what the code actually does today
- **Why it's overkill** — the mismatch with what the project needs
- **Refactor steps** — the numbered edit list
- **Effort / Risk** — a size and a risk band
- **Impact** — what simplifies once it is done

## What it caught

Three findings, quoted from the plan it wrote:

> Overlap between local and CI versions of the same tool (e.g., `semgrep.yml` vs `semgrep_local.yml`).

That names a CI job duplicated against a local `act` copy — the same Semgrep check wired as both
`semgrep.yml` and `semgrep_local.yml`. A second finding named a whole templating layer living
inside a transcription tool:

> Shell + Python automation to **delete app-specific files** and rebrand the repo for a different project.

The third was a migration left half-done, the old paths still carried beside the new:

> Some Windows scripts hard-code paths and variant numbers (e.g., variant 16) which may drift from the main CLI defaults.

## Where it came from

A private ChatGPT export under `sources/chatgpt_conversations2/` — gitignored, not in this repo.
A reader cannot open the thread or check the quotes against it; the live thread URL is withheld as
a corpus leak class. The prompt line and the three quoted findings above are reproduced verbatim
from that export, bold and code spans intact.
