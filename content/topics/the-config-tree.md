---
title: The config tree
summary: The two repos where instructions to the agent stopped living in chat and became versioned files — rules, skills and hooks loaded before the first token.
---

# The config tree

`dotfiles` and `claudeconf`, named after the repos themselves. What they share is
the unit of instruction: not a prompt or a plan but a file that applies to every
session whose path matches it, committed and reverted like code.

That is what puts them at the configuring rung. The atoms below are mined from
their chapters.
