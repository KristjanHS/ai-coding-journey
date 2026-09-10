// The anti-hype rule's machine half: the ONE list of banned words. The vitest
// content suite greps `content/**` for these; `.claude/rules/content-writing.md`
// §Anti-hype restates them as prose for authors, and a test compares that prose
// to this list so a reworded rule reds instead of rotting quietly.
export const BANNED: readonly string[] = [
  '10x',
  'game-changer',
  'game changer',
  'revolution',
  'revolutionary',
  'anyone can',
  'in minutes',
  'no code needed',
  'effortless',
  'magic',
];
