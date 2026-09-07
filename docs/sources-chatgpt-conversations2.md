# Source inventory: `sources/chatgpt_conversations2/`

37 exported ChatGPT threads covering the **agent era** of this journey — the months
`sources/chatgpt_conversations/` does not reach. The directory is **gitignored** (it lives under
`sources/`, like the OneNote exports and the first corpus), so this page is the durable index of what is
in it.

Unlike its sibling page, this one is not a dating argument. **These files carry their own timestamps**,
so the inventory below is measured, and the effort goes into what the threads are *evidence for*.

- [What is different about this corpus](#what-is-different-about-this-corpus)
- [Dated inventory](#dated-inventory)
- [What this is evidence for](#what-this-is-evidence-for)
- [Sanitisation: heavier than corpus 1](#sanitisation-heavier-than-corpus-1)
- [Known gaps and traps](#known-gaps-and-traps)
- [Open questions](#open-questions)

---

## What is different about this corpus

The first corpus was exported as bare `**You:**` / `**ChatGPT:**` transcripts with no metadata, which is
why dating it took three signals and a bracket. This corpus was saved by a **browser extension** that
writes a header block:

```text
# Amazon Q LLM usage

**User:** Anonymous
**Created:** 11/12/2025 19:54:45
**Updated:** 11/12/2025 19:54:55
**Exported:** 9/7/2026 20:53:02
**Link:** [https://chatgpt.com/c/<conversation-uuid>](https://chatgpt.com/c/<conversation-uuid>)
```

Corpus 1 contains exactly one file in this format (`Sep 26, 2025 12-17-17 PM Markdown Content.md`, noted
there as the only one whose name carries a real date). Here it is all 37.

Three consequences:

1. **Every date on this page is measured**, not estimated. The living spec's rule — *"until then no corpus
   date is cited as measured"* — was written about corpus 1 and does not bind this corpus. Reproduce with:

   ```bash
   grep -m1 '^\*\*Created:\*\*' sources/chatgpt_conversations2/*.md
   ```

2. **Per-turn timestamps survive too.** Each `## Prompt:` / `## Response:` carries its own time, so a
   resumed thread can be split at the turn rather than guessed at.
3. **The `Link:` field is a real thread URL.** Some carry a `/g/g-p-<id>/` segment, which identifies the
   ChatGPT *project folder* the thread lived in — the same grouping corpus 1 could only read off filename
   prefixes.

### It does not date corpus 1

Title overlap between the two corpora is **zero** (checked by normalising both filename sets and running
`comm -12`). No corpus-1 thread reappears here with a timestamp attached, so the bracketing method on the
sibling page stands unaided. Combined, the two corpora are **98 unique threads** (61 + 37; corpus 1's
74 files are 73 threads after its known byte-identical pair, and 61 remain in the directory).

The standing open call — re-download the export ZIP for `conversations.json` — is therefore still open
**for corpus 1 only**.

### The era boundary this establishes

Corpus 1 closes in the pre-agent era. This one **opens on 2025-10-20** and runs to **2026-02-08**, so
between them the two corpora cover the journey continuously. Its own internal boundary is the Cursor
breakdown of early December 2025, which is where the material stops being about *building things* and
starts being about *the tool failing to build things*.

## Dated inventory

37 threads, **126,712 words**, no byte-identical duplicates (`md5sum | uniq -d` is empty — unlike
corpus 1). Verdicts are from a one-pass skim of each file: **HIGH** = carries a reusable prompt or a
failure-with-resolution; **MED** = usable era evidence or a citable figure; **DROP** = off-topic or
content-free.

### Cluster 1 — `llm-eng-template` bring-up (2025-10-20, 3 threads)

Three failures in one day, in sequence — the template's first working session.

| Thread | Time | Words | What it holds | Verdict |
| --- | --- | --- | --- | --- |
| Cookiecutter template issue | 10:14 | 3,843 | Jinja renders `Makefile` line 187's raw `{{ }}` and crashes; fix is `{% raw %}` or rename | MED |
| Dockerfile build error fix | 11:16 | 1,504 | `docker.io/token: 503 Service Unavailable` resolving `# syntax=docker/dockerfile:1.7`; fix is a digest-pinned base | MED |
| Git commands for GitHub setup | 11:31 | 186 | Generic `git init` / `remote add` / `push` cheat-sheet | DROP |

### Cluster 2 — RAG theory and MCP (2025-11-12 → 11-26, 6 threads)

| Thread | Date | Words | What it holds | Verdict |
| --- | --- | --- | --- | --- |
| Hike checklist 10 km | 11-12 | 759 | Non-coding; hiking gear | DROP |
| Amazon Q LLM usage | 11-12 | 907 | Amazon Q on Bedrock; no measured figure | DROP |
| Next steps for MVP | 11-15 | 3,224 | 48h hackathon slicing, RICE-lite, Kano; not AI-coding | DROP |
| Cross encoder vs LLM for reranking | 11-15 | 669 | Names `ms-marco-MiniLM-LCE-v2`; rerank window 20–200 candidates | MED |
| Search types in RAG | 11-15 | 1,805 | Vector/BM25/hybrid/rerank taxonomy; carries a `gpt-5.1-mini` era stamp | MED |
| MCP for offline AI | 11-26 | 3,831 | MCP as interface layer, not retrieval; `search_docs(query, top_k)` tool shape | MED |

### Cluster 3 — the Cursor breakdown and the WSL/CUDA fights (2025-12-04 → 12-09, 15 threads)

The densest and most useful cluster. Five threads on 12-05 alone.

| Thread | Date | Words | What it holds | Verdict |
| --- | --- | --- | --- | --- |
| Find Docker image | 12-04 | 1,313 | `est-asr-pipeline:1.1b` Estonian Kaldi ASR, a **7.8 GB** GPU image, tags dated 2025-11-13 | MED |
| File creation in Cursor | 12-05 | 720 | A plan file shown as `+380` lines but absent from disk until Apply | MED |
| Terminal issue debugging | 12-05 | 8,719 | Every Shell-tool command returns `exit -1`, `pid: -1`, no stdout under WSL | **HIGH** |
| Auto-apply edits in Cursor | 12-05 | 5,776 | Turning off per-file Accept prompts in multi-file agent edits | MED |
| Cursor IDE debugging tips | 12-05 | 3,028 | Write/StrReplace return success having changed nothing; refs CVE-2025-59944 | **HIGH** |
| Cursor agent plan storage | 12-05 | 726 | Agent plans held in internal SQLite outside the repo, not as files | MED |
| Set HF_TOKEN in WSL | 12-06 | 1,202 | `setx` + `wsl --shutdown` to cross the Windows/WSL env boundary | DROP |
| Monkey patching in testing | 12-06 | 903 | *"monkey patching is not a best practice… it can hide bad design"* | MED |
| Start using Python 3.14 | 12-06 | 3,416 | 3.12 → 3.14 via uv; free-threading is optional | MED |
| CUDA-enabled ctranslate2 wheel | 12-07 | 4,607 | The CPU-only-install trap (see below) | **HIGH** |
| Fix pre-commit issues | 12-07 | 1,368 | Agent sandbox blocks `~/.cache`; fix is `UV_CACHE_DIR` + `PRE_COMMIT_HOME` into the tree | **HIGH** |
| WSL POSIX semaphore issue | 12-07 | 5,723 | joblib `SemLock → PermissionError` degrading silently to serial | **HIGH** |
| SOTA AI agents for VSCode | 12-08 | 2,491 | The field as of 2025-12-08: Copilot, Cline, Continue, Cody, Codeium, Tabnine; forks Cursor, Windsurf, Void | MED |
| Start antigravity in WSL | 12-08 | 303 | Asked to launch Google Antigravity, got the `python -m antigravity` easter egg | MED |
| Audit project complexity | 12-09 | 4,487 | The complexity-audit prompt and the defects it caught (see below) | **HIGH** |

### Cluster 4 — local models, then the move to Claude Code (2025-12-28 → 2026-02-08, 13 threads)

| Thread | Date | Words | What it holds | Verdict |
| --- | --- | --- | --- | --- |
| Stop Being Nice Guide | 12-28 | 6,741 | Personal assertiveness coaching; no coding content | DROP |
| Best OpenAI Models for Reasoning | 01-01 | 6,811 | Open-weight ranking with licences: DeepSeek-R1 (MIT), Qwen3 (Apache 2.0), Qwen2.5-72B-Instruct (128k) | MED |
| Qwen3-30B-A3B Comparison | 01-01 | 3,580 | KV-cache growth caps usable context well under the 256k the model advertises | MED |
| AI Alignment Contribution Ideas | 01-24 | 6,296 | Named eval repos and benchmarks | MED |
| Materials to learn — AI Alignment Contribution Paths | 01-24 | 9,339 | A time-boxed study plan, hours → first PR | MED |
| AI Safety Tests at Home | 01-25 | 10,659 | Local eval stack: Inspect AI, garak, promptfoo, DeepEval, Phoenix/Langfuse, MLflow; attacker/judge role split | MED |
| AI Safety Contributions Bumpers | 01-26 | 7,075 | A "toy spec-gaming suite" eval design, 20–50 sub-second cases | MED |
| Free AI Coding Agents (1) | 02-07 | 5,859 | Top-3 free alternatives, capability-mapped: OpenCode, Cline, OpenHands-CLI | **HIGH** |
| Claude code retention | 02-08 | 1,689 | Retaining knowledge across a context cleanup, via `CLAUDE.md` and `/compact` | MED |
| Free AI Coding Agents | 02-08 | 805 | Which free agents support the `SubagentStart` hook | MED |
| Cursor subagent capabilities | 02-08 | 358 | *"tool-use only (within the same conversation context)"* — the transition's stated reason | **HIGH** |
| Enterprise Claude Code Inference | 02-08 | 4,233 | Private-cloud inference patterns; generic, but see the note below | DROP |
| Cursor vs Claude Code | 02-08 | 1,793 | `Esc Esc` / `/rewind`; checkpoints track only Claude's own changes | MED |

## What this is evidence for

- **Chapter `90-what-i-got-wrong` is missing the behavioural half of the Cursor story.** It currently
  indicts Cursor as a *bookkeeping* failure — it "prices only 4.86% of its message bubbles". The 12-05
  cluster is the other indictment, dated to the hour: the Shell tool returning `exit -1` on everything,
  edits reporting success without touching the file, files not written until Apply, plans stored where the
  repo cannot see them. Four independent failures in one afternoon is an argument the chapter cannot
  currently make.

- **Two stub chapters can fill their `artifact:` slot from this corpus.** `05-stt-faster` and
  `06-xls-analyser` are 16-line stubs with `tools: []` and `artifact: pending`. Both candidates are
  failure-with-resolution, the shape the evidence rule wants:
  - **CTranslate2** — GPU tests failed because `get_cuda_device_count()` returned 0 and `ctranslate2.cuda`
    was absent. The diagnosis is the interesting part: *not* a missing CUDA wheel but a plain CPU-only
    install, because on x86-64 Linux/WSL2 the standard PyPI wheels for CTranslate2 ≥ 4.4 already carry
    CUDA 12 support and no `+cu125`-style variant exists. Fixed by force-reinstalling `ctranslate2==4.6.2`.
  - **joblib on WSL** — creating a POSIX semaphore raised `PermissionError: [Errno 13]` and the pool fell
    back to serial *silently*. Traced to a sandbox/LSM layer above WSL rather than to WSL itself.

- **Three `content/prompts/` candidates, verbatim rather than reconstructed.** Corpus 1 could only offer
  prompt *shapes*; these are the prompts themselves.
  1. **The complexity audit** — *"audit the project for unnecessary complexity and overengineering, and
     create .md plan for 10 highest value refactors"*, fed a `repomix` dump of the repo, producing a fixed
     per-item schema (Symptoms / Why it's overkill / Refactor steps / Effort-Risk / Impact). It has its own
     evidence attached: duplicated CI (`semgrep.yml` beside `semgrep_local.yml`, CodeQL twice), a
     bootstrap-template system, and an unfinished 16-variant migration still carrying legacy paths.
  2. **The scoped-research scaffold**, appearing near-verbatim in two independent threads — *"aligned with
     best practices but not over-engineered… Research questions to pursue: 1)… 2)…"* — a reusable
     "research before planning" shape independent of either bug it was used on.
  3. **A learning-path prompt** from the alignment cluster (time-boxed hours → first contribution), usable
     only after heavy sanitisation; see below.

- **The tool transition has a one-line, dated, quotable cause.** On 2026-02-08 the finding is that a Cursor
  subagent is *"tool-use only (within the same conversation context)"* — no delegate-then-summarise-back,
  which is exactly the capability needed to read many files without spending the main context. Beside it,
  the 02-07 scouting of free alternatives (OpenCode, Cline, OpenHands-CLI, Aider) shows the switch was
  cost- and lock-in-aware rather than purely capability-chasing.

- **The alignment cluster is mostly out of scope.** Four threads, ~33k words, on AI-safety career pivoting.
  The reusable seam is thin: one sanitised learning-path prompt and a vetted external-resource list
  (Inspect / Inspect Evals, Petri, Bloom, garak, promptfoo, DeepEval, PyRIT, TransformerLens, nnsight;
  benchmarks PoisonedRAG, SafeRAG) that could feed an advanced module in `content/course/skeleton.md`.
  Everything framed as *contribute directly / first PR / get noticed* is career material the
  personal-material constraint bans, and no standalone safety chapter should be built from it.

## Sanitisation: heavier than corpus 1

**No live credentials.** Screened for `hf_`, `sk-`, `ghp_` and `AKIA` key shapes across all 37 files —
zero hits.

**Machine and account fingerprints are pervasive**, more so than in corpus 1, because this corpus is full
of environment debugging. Observed: the Windows hostname `DESKTOP-26A9125`, `/home/kristjans/…` paths (in
6 files), `C:\Users\Kristjan\…`, the GCP project id `speech2text-218910`, GitHub repo URLs carrying the
account name, and an attachment filename embedding it. In two threads the assistant addresses the user by
first name inside its own reasoning.

**Every file carries a live thread URL.** The `Link:` header is a real `chatgpt.com/c/<uuid>` address, and
the threads that lived in a ChatGPT project folder carry a `/g/g-p-<id>/` segment too — conversation and
project identifiers. They must not reach `content/`, and they are a candidate for the same grep guard the
public-store generator already runs. The sample block above is redacted for this reason.

Treat **every** HIGH and MED row as requiring a scrub before any excerpt reaches `content/`. The existing
rule applies unchanged: quote a *prompt shape*, never a thread verbatim.

**Home-hardware figures stay; the office box does not.** `8 GB VRAM` and `RTX 3070` are already
published — chapter `01-hands-on-llm` states the 8 GB ceiling capped its model shortlist, and the living
spec names that ceiling as a headline figure. They stay, and they remain the ceiling for the whole period.

The **32 GB VRAM box in the January 2026 threads is an employer-side server, not personal hardware**
(ruled by the user, 2026-09-07). It is therefore employer-identifying context and is **barred from
`content/`** — publishing a second ceiling with no personal-hardware explanation is itself the disclosure.
See [Open questions](#open-questions).

**`Enterprise Claude Code Inference` is dropped on topic, not on content.** Read in full, it names no
employer, no internal policy and no fingerprint — it is generic AWS/GCP/Kubernetes/vLLM/LiteLLM
architecture. What it leaks is the *question*: someone evaluating how to keep coding-agent inference in a
private cloud. The four prompts imply an employer motive and add no measured value, so the file is
excluded whole rather than quoted carefully.

## Known gaps and traps

- **The verdicts and quotes here come from a single skim per file, not a verified read.** They are a
  routing aid. Under the evidence rule, any figure or quotation must be re-read in its source file before
  it reaches `content/` — this page is not itself a citable source.
- **Seven threads were resumed after their `Created` date**, so a single date misrepresents them. Anchor on
  the first user turn and treat the tail separately — the same trap corpus 1 documents. Worst offenders:
  `Materials to learn` (01-24 → **02-03**), `Stop Being Nice Guide` (12-28 → **01-09**), `Set HF_TOKEN`
  (12-06 → 12-08). Per-turn timestamps make the split exact here, unlike in corpus 1.

  ```bash
  # threads whose Updated date differs from Created
  cd sources/chatgpt_conversations2 && for f in *.md; do
    c=$(grep -m1 '^\*\*Created:\*\*' "$f" | sed 's/.*\*\* //;s/ .*//')
    u=$(grep -m1 '^\*\*Updated:\*\*' "$f" | sed 's/.*\*\* //;s/ .*//')
    [ "$c" != "$u" ] && echo "$c -> $u  $f"
  done
  ```

- **The two `Free AI Coding Agents` files are not duplicates**, despite identical titles. The 2026-02-07
  file (5,859 words) is a capability-mapped top-3 comparison; the 2026-02-08 one (805 words) answers only a
  narrow `SubagentStart`-hook question. Different dates, different scope, keep both.
- **`Exported:` is not a dating signal here.** All 37 were exported on 2026-09-07 in one batch. Corpus 1's
  three-batch mtime bracket has no analogue and needs none.
- **Public repo.** Same standing rule as corpus 1: no employer detail, no colleague names, no private
  deployment URLs, and no thread quoted verbatim.

## Open questions

- ~~**The stated VRAM ceiling moves between the eras.**~~ **Resolved 2026-09-07 (user).** It never moved:
  the two figures are two different machines. **8 GB / RTX 3070 remains the home-machine ceiling** for the
  whole period, and it is the one chapter `01-hands-on-llm` already publishes. The 32 GB box named in the
  January 2026 threads (14 mentions across three files) is an **employer-side local AI server**, not
  personal hardware.

  This makes the 32 GB figure **employer-identifying context, and it must not reach `content/`** — the
  personal-material constraint covers it exactly as it covers the private-repo rules. The corpus itself is
  clean (the employer is named in no file: `grep -lic` returns nothing), so the leak would be introduced by
  *us*, by publishing a second VRAM ceiling that has no personal-hardware explanation. Cite 8 GB, and say
  nothing about the larger box.

  The open question that remains is narrower and worth keeping: the three January threads were written
  against hardware the journey's own narrative does not have, so **the local-model shortlists in them are
  not evidence about what fitted this journey's machine.** Use them as era evidence for *what was being
  evaluated when*, never as a constraint story.
- **Whether the ChatGPT project-folder ids in the `Link:` fields are worth extracting** as a grouping
  signal, the way corpus 1 uses filename prefixes. Cheap to do, unclear whether anything depends on it.
- **Whether the increment that consumes this corpus is `inc5c` or a new rung.** `inc5c` as written covers
  the *chat-only* era from corpus 1. This corpus is evidence for the *agent* era, which that rung does not
  claim — extending it and adding a sibling are both defensible, and the choice is the user's.
