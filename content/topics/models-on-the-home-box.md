---
title: Models on the home box
summary: What a 7-billion-parameter model actually costs in VRAM once it loads, and how the server log — not a spec sheet — is where you read whether it fit.
---

# Models on the home box

A source thread built around a single server-startup log: the local runner
coming up, finding the laptop GPU, and loading a 4-bit 7-billion-parameter model
onto it. The subject is the gap between the decision and the evidence. The model
was chosen on published figures and a VRAM budget; whether that arithmetic held
is a separate question, and the only honest answer to it is in the log the
runner printed while it loaded.

The threads grouped here share that shape: a choice made on paper, then a log
read back to confirm the choice survived contact with the hardware. The sidecar
describes what that log showed; the atom quotes the one line that settled it.
