// Automatische Qualitätsprüfung der Lektionen (09-lektionen.md, Abschnitte 4, 5 und 9).
import { describe, expect, it } from 'vitest';
import { checkPart } from '../../engine/check';
import { generatorFuer } from '../../engine/generators';
import { createRng } from '../../engine/rng';
import { antwortAusPart } from '../../engine/testing';
import { AUSDRUECKE, FIGUREN } from '../characters';
import { LEKTIONEN } from './index';
import { skillInfo } from '../curriculum';
import { INTERAKTIV, LESEN, type Screen } from './types';

function woerter(t: string): number {
  return t.trim().split(/\s+/).length;
}

function saetze(t: string): number {
  // Satzende: . ! ? vor Leerzeichen/Ende, aber nicht nach einer Ziffer (31. Dezember, 5.000 €.)
  return (t.match(/(?<!\d)[.!?](\s|$)|€\.(\s|$)/g) ?? []).length || 1;
}

describe.each(LEKTIONEN.map((l) => [l.id, l] as const))('Lektion %s', (_id, l) => {
  const typen = l.screens.map((s) => s.typ);

  it('beginnt mit einem Rätsel und endet mit Klausurbrücke und Cliffhanger', () => {
    expect(typen[0]).toBe('raetsel');
    expect(typen.at(-1)).toBe('klausur');
    expect(typen).toContain('merksatz');
  });

  it('mindestens 4 interaktive Bildschirme aus mindestens 3 verschiedenen Typen', () => {
    const interaktiv = typen.filter((t) => INTERAKTIV.includes(t));
    expect(interaktiv.length).toBeGreaterThanOrEqual(4);
    expect(new Set(interaktiv).size).toBeGreaterThanOrEqual(3);
  });

  it('nie zwei reine Lese-Bildschirme hintereinander', () => {
    for (let i = 1; i < typen.length; i++) {
      expect(
        LESEN.includes(typen[i - 1]!) && LESEN.includes(typen[i]!),
        `${typen[i - 1]} → ${typen[i]}`,
      ).toBe(false);
    }
  });

  it('Figuren sprechen in kurzen Blasen (höchstens 2 Sätze), Dialoge höchstens 3 Blasen', () => {
    const blasen = l.screens.flatMap((s: Screen) => {
      if (s.typ === 'raetsel' || s.typ === 'dialog') return s.sprecher;
      if (s.typ === 'wer-hat-recht') return [s.a, s.b];
      if (s.typ === 'klausur') return [s.cliffhanger];
      if ('figur' in s && s.figur) return [s.figur];
      return [];
    });
    expect(blasen.length).toBeGreaterThan(0);
    for (const b of blasen) {
      expect(saetze(b.text), b.text).toBeLessThanOrEqual(2);
      expect(AUSDRUECKE).toContain(b.ausdruck);
      if (b.figur !== 'ich') expect(FIGUREN[b.figur]).toBeDefined();
    }
    for (const s of l.screens)
      if (s.typ === 'dialog') expect(s.sprecher.length).toBeLessThanOrEqual(3);
  });

  it('Konzept-Bildschirme haben höchstens 40 Wörter und immer eine Visualisierung', () => {
    for (const s of l.screens) {
      if (s.typ !== 'konzept') continue;
      expect(woerter(s.text), s.text).toBeLessThanOrEqual(40);
      expect(s.visual).toBeDefined();
    }
  });

  it('Auswahlfragen haben genau eine richtige Antwort', () => {
    for (const s of l.screens) {
      if (s.typ === 'vorhersage' || s.typ === 'verstaendnis')
        expect(s.optionen.filter((o) => o.richtig)).toHaveLength(1);
      if (s.typ === 'wer-hat-recht' || s.typ === 'fehlerjagd') {
        const o = s.typ === 'wer-hat-recht' ? s.begruendungen : s.gruende;
        expect(o.filter((x) => x.richtig)).toHaveLength(1);
      }
    }
    expect(l.skipTest.length).toBeGreaterThanOrEqual(3);
    expect(l.skipTest.length).toBeLessThanOrEqual(4);
    for (const f of l.skipTest) expect(f.optionen.filter((o) => o.richtig)).toHaveLength(1);
  });

  it('Klausurbrücke und Lückenbeispiel sind mit der Engine lösbar', () => {
    for (const s of l.screens) {
      if (s.typ === 'klausur') {
        let part;
        let variants: ReturnType<NonNullable<ReturnType<typeof generatorFuer>>['errorVariants']> =
          [];
        if ('typ' in s.part) part = s.part;
        else {
          const g = generatorFuer(s.part.skillId)!;
          const p = g.generate(
            createRng(s.part.seed),
            s.part.variant ? { variant: s.part.variant } : {},
          );
          part = g
            .parts(p, g.solve(p))
            .find((x) => x.id === (s.part as { partId: string }).partId)!;
          variants = g.errorVariants(p);
        }
        expect(checkPart(part, antwortAusPart(part), variants).korrekt).toBe(true);
      }
      if (s.typ === 'luecke') {
        const g = generatorFuer(s.skillId)!;
        const p = g.generate(createRng(s.seed), s.variant ? { variant: s.variant } : {});
        const part = g.parts(p, g.solve(p)).find((x) => x.id === s.partId)!;
        expect(part.typ).toBe('rechenkette');
        if (part.typ === 'rechenkette')
          for (const id of s.gefragt) expect(part.felder.some((f) => f.id === id)).toBe(true);
      }
    }
  });

  it('Sortier-Kategorien passen zu den Elementen', () => {
    for (const s of l.screens) {
      if (s.typ !== 'sortieren') continue;
      for (const e of s.elemente) expect(s.kategorien).toContain(e.kategorie);
    }
  });

  it('Qualitäts-Checkliste vollständig abgehakt', () => {
    const c = l.checkliste;
    expect(
      [
        c.raetsel,
        c.alltagVorFachbegriff,
        c.kernAhaErreicht,
        c.figurImDialog,
        c.klausurbrueckeUndCliffhanger,
        c.verstaendlichOhneVorwissen,
      ].every(Boolean),
    ).toBe(true);
    expect(c.fachlichGeprueft.length).toBeGreaterThan(10);
    expect(l.kernAha.length).toBeGreaterThan(20);
  });

  it('gehört zu einem Skill des Lehrplans, Merksätze haben eine Kartenfrage', () => {
    expect(skillInfo(l.skillId), l.skillId).toBeDefined();
    expect(LEKTIONEN.filter((x) => x.id === l.id)).toHaveLength(1);
    for (const s of l.screens) if (s.typ === 'merksatz') expect(s.frage.length).toBeGreaterThan(10);
    expect(l.dauerMin).toBeLessThanOrEqual(l.abschnitt === '0' ? 6 : 8);
  });

  it('Lektion ist nicht zu lang', () => {
    expect(l.screens.length).toBeGreaterThanOrEqual(8);
    expect(l.screens.length).toBeLessThanOrEqual(13);
  });
});
