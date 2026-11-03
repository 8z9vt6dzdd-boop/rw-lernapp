import { describe, expect, it } from 'vitest';
import { prepareTask } from './prepare';
import { FEHLERJAGD_SKILLS } from './session';

describe('Fehlerjagd', () => {
  for (const skillId of FEHLERJAGD_SKILLS) {
    it(`${skillId}: genau eine falsche Zeile und genau ein richtiger Grund`, () => {
      let gebaut = 0;
      for (let seed = 1; seed <= 60; seed++) {
        const t = prepareTask({ key: 'k', art: 'fehler', skillId, seed });
        const teil = t.parts[0]!;
        if (teil.typ !== 'fehler-finden') continue;
        gebaut++;
        expect(teil.fehlerZeile).toBeGreaterThanOrEqual(0);
        expect(teil.fehlerZeile).toBeLessThan(teil.zeilen.length);
        expect(teil.gruende.filter((g) => g.richtig)).toHaveLength(1);
        expect(new Set(teil.gruende.map((g) => g.text)).size).toBe(teil.gruende.length);
      }
      expect(gebaut).toBeGreaterThan(20);
    });
  }
});
