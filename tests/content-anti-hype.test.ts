import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { BANNED } from '../src/lib/content-rules';
import { bounded, CHAPTERS, CONTENT, CONTENT_FILES, read, section } from './helpers';

describe('premise guards', () => {
  // A vacuous suite passes forever. Each of the three assertions below iterates
  // over a set that could be empty by accident (a moved directory, an emptied
  // list); these fail loudly when it is.
  it('has a non-empty banned-vocabulary list', () => {
    expect(BANNED.length).toBeGreaterThan(0);
  });

  it('found the journey chapters', () => {
    expect(CHAPTERS.length).toBeGreaterThan(0);
  });

  it('found the content files to sweep', () => {
    expect(CONTENT_FILES.length).toBeGreaterThan(0);
  });
});

describe('anti-hype rule', () => {
  // (b) Failures get equal billing: the heading is the structural guarantee.
  it.each(CHAPTERS)("%s: has a `## What didn't work` section", (path) => {
    expect(section(read(path), "What didn't work")).toBeDefined();
  });

  // (c) Word-boundary, case-insensitive, across every authored content file --
  // not just the chapters -- because the rule's own `paths:` is content/**/*.md.
  it.each(CONTENT_FILES)('%s: uses no banned vocabulary', (path) => {
    const body = read(path);
    const hits = BANNED.filter((word) => new RegExp(bounded(word), 'i').test(body));
    expect(hits, `${path}: banned vocabulary`).toEqual([]);
  });
});

describe('rule prose vs its machine half', () => {
  // `BANNED` has ONE machine source (`src/lib/content-rules.ts`); the rule file
  // restates it as prose for authors. Parse the rule's bullet and compare the
  // two sets, so adding a word in one place and not the other reds here rather
  // than silently going unenforced.
  it('banned list matches `content-writing.md` §Anti-hype', () => {
    const rule = read(join('.claude', 'rules', 'content-writing.md'));
    const bullet = rule.match(/^- \*\*Banned vocabulary\*\*[^\n]*\n(?:[ \t]+[^\n]*\n)*/m);
    expect(bullet, 'could not find the `Banned vocabulary` bullet').not.toBeNull();

    const fromRule = [...bullet![0].matchAll(/`([^`]+)`/g)].map((m) => m[1]);
    expect(new Set(fromRule)).toEqual(new Set(BANNED));
  });

  // `content/timeline.json` is generated, so these assert the GENERATOR's two
  // honesty rules rather than hand-authored prose.
  //
  // (1) End-dates exclude AI-config-only commits. A `chore(claude):` deny-list
  //     sweep touched 13 repos on 2026-09-06; counting it made every one of them
  //     claim activity that day. `dewpoint`'s pinned date is the discriminating
  //     case: it moves 14 months if the exclusion pathspec is dropped.
  // (2) `dewpoint-app` (the Python original) and `dewpoint-ts` (the Node port
  //     made to deploy on Vercel) are ONE project, so they collapse into a
  //     single `dewpoint` row via the generator's REPO_GROUPS map.
  //
  // The pinned dates are data assertions naming a specific value on purpose: if
  // one of these repos is legitimately reactivated, this test reds and the line
  // has to be re-pinned. That is real work being flagged, not a false alarm.
  describe('timeline.json honesty', () => {
    const rows: Array<{
      repo: string;
      first_commit: string;
      last_commit: string;
      commits: number;
      stage: string;
    }> = JSON.parse(read(join(CONTENT, 'timeline.json')));

    // Vacuity anchors: a parser that silently yields [] or a truncated array
    // would let every assertion below pass by looping over nothing.
    it('parses to the full 14-row corpus', () => {
      expect(Array.isArray(rows)).toBe(true);
      expect(rows).toHaveLength(14);
    });

    it('dates the dewpoint row past the AI-config sweep, not on it', () => {
      const dewpoint = rows.find((r) => r.repo === 'dewpoint');
      expect(dewpoint, 'no dewpoint row in timeline.json').toBeDefined();
      // Drop `:(exclude).claude/**` & friends from the generator and this
      // becomes 2026-09-06 -- the sweep date.
      expect(dewpoint!.last_commit).toBe('2026-06-25');
      expect(dewpoint!.first_commit).toBe('2025-07-15');
    });

    it('merges the two dewpoint repos into one row', () => {
      expect(rows.filter((r) => r.repo.startsWith('dewpoint'))).toHaveLength(1);
      for (const gone of ['dewpoint-app', 'dewpoint-ts']) {
        expect(rows.some((r) => r.repo === gone), `${gone} still a row`).toBe(false);
      }
      // 4 commits in the Python original + 102 in the TS port.
      expect(rows.find((r) => r.repo === 'dewpoint')!.commits).toBe(106);
    });

    // The 2026-09-06 `chore(claude):` sweep touched AI-config in 13 repos; the
    // AI_CONFIG_PATHS exclusions mean only the two doing real work that day may be
    // dated on or after it. Pinned as `>=`, not `=== SWEEP_DAY`: both repos have
    // since committed again, and a pin on the day itself goes vacuously green the
    // moment they move on — which is also how it would look if the exclusions broke.
    it('leaves only the genuinely-active repos dated on or after the sweep day', () => {
      const SWEEP_DAY = '2026-09-06';
      const since = rows.filter((r) => r.last_commit >= SWEEP_DAY).map((r) => r.repo);
      expect(since.sort()).toEqual(['claudeconf', 'crash-dash', 'dotfiles']);
    });

    it('never ends a repo before it started, or in the future', () => {
      // Read today rather than pinning it: a literal end-date bound reds every time
      // an upstream repo commits, which is drift in the clock, not in the data.
      const today = new Date().toISOString().slice(0, 10);
      for (const r of rows) {
        expect(r.first_commit <= r.last_commit, `${r.repo} ends before it starts`).toBe(true);
        expect(r.last_commit <= today, `${r.repo} ends in the future`).toBe(true);
      }
    });
  });
});
