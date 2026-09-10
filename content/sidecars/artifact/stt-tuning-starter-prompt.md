---
title: The copy-paste starter for a speech-to-text tuning session
topic: faster-whisper-on-8gb
type: artifact
summary: A starter prompt that hands a fresh session the pipeline, the goals and the current dead-end in one block, so the model argues about thresholds rather than re-deriving the setup.
---

# The copy-paste starter for a speech-to-text tuning session

The artifact is a block the author pasted into a fresh chat to open a tuning
session without re-explaining the pipeline each time. It names the stack —
faster-whisper over a CTranslate2 build of a large turbo model, run on real
meeting audio with far and faint speakers — then states the goal in two parts:
raise transcription quality on the quiet speakers, and stop the model inventing
text during silence and room noise.

What makes it a good starter rather than a vague one is that it carries the
current dead-end, not just the aim. It reports that the silence threshold
appeared to do nothing, and then explains why that appearance was misleading:
the threshold only acts in concert with a log-probability guard, and with
upstream voice-activity filtering on, the silent stretches are already gone
before the threshold can see them. It also admits the reporting was itself
untrustworthy — the first version printed segments that merely overlapped a time
range and could not count skipped windows at all.

So the block does two jobs a plain question would not. It pins the shared
context, and it pre-empts the obvious wrong answer by naming the interaction the
author had already ruled out, which is what keeps the session from restarting
the same dead-end.

## What didn't work

Treating the threshold as a single knob. In the first framing it read as a dial
with no effect, and the starter only became useful once it carried the reason —
that the knob is gated by a second guard and by the filtering stage — so the
session could argue about the combination instead of retrying the dial alone.
