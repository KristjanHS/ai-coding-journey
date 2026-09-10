---
title: The server-startup log that showed the model fit
topic: models-on-the-home-box
type: artifact
summary: A local runner's startup log — the GPU it found, the 4-bit 7B weights it loaded, and the one line stating the model fit the card's VRAM in a single GPU.
---

# The server-startup log that showed the model fit

The artifact is the log a local inference runner printed on startup. It reads
top to bottom as a sequence of decisions the runner made: it enumerated the
hardware, found one CUDA device — a laptop RTX 3070 reporting 8.0 GiB total and
about 7.0 GiB free — and then loaded a 4-bit quantised 7-billion-parameter
Mistral instruct model whose weights on disk are 3.83 GiB.

The line worth reading is the scheduler's verdict before it committed: it
computed the full requirement at 5.9 GiB against roughly 6.7 GiB available and
declared the model would fit in a single GPU, then offloaded all 33 layers onto
the card. Everything after that — the key-value cache sizing, the compute
buffers, the runner coming up in a little over a second — is the arithmetic
playing out, not a new claim.

That is what makes a startup log a usable artifact at the asking rung. The
decision about which model to run was already made on paper; the log is where
you read, in the runner's own words, whether the paper held once the weights
met the hardware.

## What didn't work

Reading the same log a second time expecting it to report a problem. A later
run with almost no VRAM free offloaded nothing and ran on the processor instead,
and the log said so just as plainly — but only on one line among dozens, which
is easy to skim past when the previous run had taught you the load always
succeeds.
