---
title: Faster-whisper on the 8 GB box
summary: Tuning a speech-to-text pipeline on the home GPU so the transcript is trustworthy, and so the experiment that compares two settings is trustworthy too.
---

# Faster-whisper on the 8 GB box

A run of source threads on a speech-to-text pipeline built with faster-whisper
over a CTranslate2 build of a large Whisper turbo model, run on the 8 GB home
GPU against real meeting audio. The subject is not the model but the two things
that sit around it: the decoding thresholds that decide whether a silent stretch
is transcribed as hallucinated text, and the harness that is supposed to tell
you whether changing one of those thresholds changed anything.

What ties the threads together is that both turned out to be the same problem.
A threshold that looks inert is often inert only because a second guard upstream
made it irrelevant, and a report that shows a difference is often showing a
segmentation artifact rather than a real change. The sidecar below is the
starter that framed that work for a fresh session.
