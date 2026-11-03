// M7-Abnahme: Jeder Skill aus 02-curriculum.md hat eine Lektion und übbaren Inhalt.
import { describe, expect, it } from 'vitest';
import { fallFuerSkill } from '../engine/faelle';
import { generatorFuer } from '../engine/generators';
import { ABSCHNITTE } from './curriculum';
import { lektionFuerSkill } from './lessons';
import { THEORIE } from './theory';

const alle = ABSCHNITTE.flatMap((a) => a.skills);

describe('Abdeckung aller Skills', () => {
  it('jeder Skill hat eine Lektion', () => {
    expect(alle.filter((s) => !lektionFuerSkill(s.id)).map((s) => s.id)).toEqual([]);
  });

  it('jeder Rechen-Skill hat einen Generator oder Fall, jeder Theorie-Skill Theorie-Elemente', () => {
    const fehlt = alle.filter((s) => {
      if (s.art === 'lektion') return false;
      if (s.art === 'theorie') return !THEORIE.some((t) => t.skill === s.id);
      return !generatorFuer(s.id) && !fallFuerSkill(s.id);
    });
    expect(fehlt.map((s) => s.id)).toEqual([]);
  });

  it('alle aktiven Theorie-Elemente haben Quelle und Prüfvermerk', () => {
    for (const t of THEORIE) {
      expect(t.quelle, t.id).toBeTruthy();
      expect(t.pruefung, t.id).toBeTruthy();
    }
    expect(new Set(THEORIE.map((t) => t.id)).size).toBe(THEORIE.length);
  });
});
