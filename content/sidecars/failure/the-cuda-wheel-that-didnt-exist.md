---
title: The CUDA wheel that didn't exist
topic: faster-whisper-on-8gb
type: failure
summary: GPU tests failed because the speech-to-text backend saw zero CUDA devices, and the first plan — hunt down a version-matched CUDA wheel — chased a download that was never the problem.
---

# The CUDA wheel that didn't exist

The speech-to-text stack stopped loading on the GPU. The backend tensor library
reported zero CUDA devices and its CUDA submodule was missing, so faster-whisper
fell back to the processor. The system tool still listed the card and the CUDA
runtime was a current 12.x, so the obvious next step looked like finding the
right GPU build of the library — a wheel matching the exact CUDA version, for
the right Python.

That premise was the dead end. On this platform the published wheel already
carries GPU support and loads the system CUDA at runtime; there is no separate
version-tagged wheel to track down. A report of zero devices from a wheel that
should have them almost always means one of two ordinary things: the active
environment is running a processor-only build installed somewhere other than the
project, or the CUDA runtime libraries are no longer on the loader's search path
for that shell.

## What didn't work

Searching for a download that the package does not publish. The setup had worked
before, which was the strongest clue that the card, the driver and the platform
were all fine and something local had drifted — a library-path line overwritten
without keeping its previous value, or a build installed into the wrong
environment by a coding agent. The check that settled it was not a download at
all: print which file the imported library resolves to, then ask it directly how
many devices it sees, from inside the same environment the tests run in.
