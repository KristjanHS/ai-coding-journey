import { describe, expect, it } from 'vitest';

import { redaction, withheld } from '../src/lib/measurements';
import { document, leaves, measFiles, readMeas } from './helpers';

// ── (1) The redaction boundary ────────────────────────────────────────────────
// The policy: states, dates and shares cross into this repo; absolute volumes and every
// money figure do not. `scripts/measurements-public.py` enforces it at generation time;
// this suite enforces it at gate time, over the committed artifact, so a hand-edit of
// eras.json is caught even though no generator ran.
//
// The ceiling matches the script's ABSOLUTE_LIMIT. No state, date part, small structural
// count or share is this large; anything that is, is a volume.
const ABSOLUTE_LIMIT = 10_000;
const PRICED_KEY = /cost|usd|token|cachecreation|cacheread/i;

const allLeaves = leaves(document);

describe('redaction boundary — the public store carries no volume and no money', () => {
  it('holds no number large enough to be an absolute volume', () => {
    const offenders = allLeaves.filter(
      (l) => typeof l.value === 'number' && Math.abs(l.value) >= ABSOLUTE_LIMIT,
    );
    expect(offenders.map((o) => `${o.path}=${o.value}`)).toEqual([]);
  });

  it('holds no numeric value under a token- or money-shaped key that is not a fraction', () => {
    // A string, a date or a boolean under such a key is a STATE and crosses freely
    // ("tokens": "floor", "firstToken": "2026-02-28", "costFieldPresent": false). A
    // number does not, unless it is a share in [0, 1].
    const offenders = allLeaves.filter(
      (l) =>
        PRICED_KEY.test(l.key) &&
        typeof l.value === 'number' &&
        !(l.value >= 0 && l.value <= 1),
    );
    expect(offenders.map((o) => `${o.path}=${o.value}`)).toEqual([]);
  });

  it('gives no era a cost availability state or a cost metrics block', () => {
    // The cost dimension does not exist publicly at all — not as a number, and not as
    // the four typed states it used to carry.
    for (const era of document.eras) {
      expect(Object.keys(era.availability)).not.toContain('cost');
      expect(era).not.toHaveProperty('metrics');
      expect(Object.keys(era.provenance)).not.toContain('cost');
    }
  });

  it('declares what it withholds, rather than leaving the gap unexplained', () => {
    expect(document.schema).toBe(2);
    expect(redaction.policy).toBe('states-dates-shares');
    expect(withheld.length).toBeGreaterThanOrEqual(3);
    expect(withheld.join(' ')).toMatch(/cost/i);
    expect(withheld.join(' ')).toMatch(/token/i);
  });

  it('prints no money figure and no long number in any public measurement prose', () => {
    // The prose half of the same boundary. A dollar amount, or any number with two or
    // more thousands groups, is a volume that escaped the JSON guard by being typed by
    // hand into a narrative.
    for (const file of measFiles()) {
      const body = readMeas(file);
      expect(body, `${file}: dollar figure in public prose`).not.toMatch(/\$\s?\d/);
      expect(body, `${file}: absolute volume in public prose`).not.toMatch(
        /\b\d{1,3}(,\d{3}){2,}\b/,
      );
    }
  });
});
