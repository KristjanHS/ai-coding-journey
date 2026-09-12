import { describe, expect, it } from 'vitest';

import { CHAPTERS, byId, read, section } from './helpers';

// Prose under content/journey/** that quotes a value eras.json GENERATES. Two
// surfaces, each pinned so it reds instead of drifting:
//   (a) a `json` fence — every line is an object keyed by `id`, and every
//       numeric field it carries must equal the era's field in eras.json. The
//       SET of files holding such fences is pinned exactly: a new fence anywhere
//       under content/journey/ reds until it is listed here and reconciled.
//       (S12 found 90-what-i-got-wrong quoting a share eras.json no longer
//       emitted; that fence has since become an atom link, so the set is empty.)
//   (b) a dated window in a `## What I evaluated and dropped` section that cites
//       an era's git-measured span — the bracket must equal gitStart..gitEnd.

const JSON_FENCE_FILES: readonly string[] = [];

const jsonFences = (body: string): string[] =>
  [...body.matchAll(/^```json\n([\s\S]*?)^```/gm)].map((m) => m[1]);

describe('json fences quoting eras.json', () => {
  it('the set of chapters holding a `json` fence is exactly the pinned one', () => {
    const holders = CHAPTERS.filter((path) => jsonFences(read(path)).length > 0).sort();
    expect(holders).toEqual([...JSON_FENCE_FILES].sort());
  });

  it.each(JSON_FENCE_FILES)('%s: every numeric field in the fence matches eras.json', (path) => {
    for (const fence of jsonFences(read(path))) {
      for (const line of fence.split('\n').filter((l) => l.trim())) {
        const row = JSON.parse(line.replace(/,\s*$/, '')) as Record<string, unknown>;
        const era = byId(String(row.id)) as unknown as Record<string, unknown>;
        expect(era, `${path}: no era \`${row.id}\``).toBeDefined();
        for (const [key, value] of Object.entries(row)) {
          if (typeof value === 'number') expect(era[key], `${path}: ${row.id}.${key}`).toBe(value);
        }
      }
    }
  });
});

describe('evaluated-and-dropped windows citing an era span', () => {
  // The window is the whole claim: "tried in these months" is what the sceptic
  // gate asks for, so a bracket that no longer equals the measured span is a
  // dated comparison that has quietly become undated.
  const WINDOWS: [string, string, string][] = [
    ['content/journey/01-hands-on-llm.md', 'Gemini CLI', 'gemini'],
  ];

  it.each(WINDOWS)('%s: the %s bracket equals eras.json %s gitStart..gitEnd', (path, tool, id) => {
    const body = section(read(path), 'What I evaluated and dropped');
    expect(body, `${path}: no \`## What I evaluated and dropped\``).toBeDefined();
    const era = byId(id);
    expect(body).toContain(`**${tool}.** [${era.gitStart}..${era.gitEnd}]`);
  });
});
