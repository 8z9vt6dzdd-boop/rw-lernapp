// A3 – Golden Cases (eigene Zahlen, docs/m7/a.md) und Eigenschaftstests.
import { describe, expect, it } from 'vitest';
import { antwortAusParts } from '../../testing';
import { forSeeds } from '../../test-utils';
import { kontenart, saldoSeite, zugangsSeite } from './gemeinsam';
import { kontenarten, solveKontenarten, type A3Params } from './kontenarten';

const leer: A3Params = {
  variante: 'kontostand',
  konten: [],
  seiten: [],
  konto: 'Bank',
  ab: '0',
  bewegungen: [],
};

const bank: A3Params = {
  ...leer,
  konto: 'Bank',
  ab: '30000',
  bewegungen: [
    {
      text: 'Kunde',
      gegen: 'Forderungen aus Lieferungen und Leistungen',
      zugang: true,
      betrag: '8000',
    },
    { text: 'Darlehen', gegen: 'Darlehensschulden', zugang: true, betrag: '5000' },
    { text: 'Miete', gegen: 'Mietaufwendungen', zugang: false, betrag: '2500' },
    {
      text: 'Lieferant',
      gegen: 'Verbindlichkeiten aus Lieferungen und Leistungen',
      zugang: false,
      betrag: '12000',
    },
  ],
};

describe('Golden Cases A3', () => {
  it('GC-A3-01 Zuordnung: Vorsteuer, Umsatzsteuer, Darlehen, Zinserträge, Rohstoffaufwand', () => {
    const s = solveKontenarten({
      ...leer,
      variante: 'zuordnen',
      konten: [
        'Vorsteuer',
        'Umsatzsteuer',
        'Darlehensschulden',
        'Zinserträge',
        'Aufwendungen für Rohstoffe',
      ],
    });
    expect(s.arten).toEqual([
      'Aktivkonto',
      'Passivkonto',
      'Passivkonto',
      'Ertragskonto',
      'Aufwandskonto',
    ]);
  });

  it('GC-A3-02 Kontostand Bank: AB 30.000, Zugänge 13.000, Abgänge 14.500 → SB 28.500 im Haben', () => {
    const s = solveKontenarten(bank);
    expect(s.zugaenge.value.toFixed(2)).toBe('13000.00');
    expect(s.abgaenge.value.toFixed(2)).toBe('14500.00');
    expect(s.saldo.value.toFixed(2)).toBe('28500.00');
    expect([s.seiteAB, s.seiteSaldo]).toEqual(['Soll', 'Haben']);
  });

  it('GC-A3-03 Kontostand Verbindlichkeiten: AB 20.000 + 6.000 − 9.000 = 17.000 im Soll', () => {
    const s = solveKontenarten({
      ...leer,
      konto: 'Verbindlichkeiten aus Lieferungen und Leistungen',
      ab: '20000',
      bewegungen: [
        { text: 'Dosen', gegen: 'Hilfsstoffe', zugang: true, betrag: '6000' },
        { text: 'Zahlung', gegen: 'Bank', zugang: false, betrag: '9000' },
      ],
    });
    expect(s.saldo.value.toFixed(2)).toBe('17000.00');
    expect([s.seiteAB, s.seiteSaldo]).toEqual(['Haben', 'Soll']);
  });

  it('GC-A3-04 T-Konto Mietaufwendungen: 3.000 + 2.000 − 500 = 4.500 im Haben (Kontosumme 5.000)', () => {
    const s = solveKontenarten({
      ...leer,
      variante: 'tkonto',
      konto: 'Mietaufwendungen',
      bewegungen: [
        { text: 'a', gegen: 'Bank', zugang: true, betrag: '3000' },
        { text: 'b', gegen: 'Bank', zugang: true, betrag: '2000' },
        { text: 'c', gegen: 'Bank', zugang: false, betrag: '500' },
      ],
    });
    expect(s.saldo.value.toFixed(2)).toBe('4500.00');
    expect(s.kontosumme.value.toFixed(2)).toBe('5000.00');
    expect(s.seiteSaldo).toBe('Haben');
  });

  it('GC-A3-05 Seiten: AB Darlehen Haben, Minderung Zinserträge Soll, SB Kasse Haben, Löhne Soll', () => {
    const s = solveKontenarten({
      ...leer,
      variante: 'seiten',
      seiten: [
        { konto: 'Darlehensschulden', vorgang: 'ab' },
        { konto: 'Zinserträge', vorgang: 'abgang' },
        { konto: 'Kasse', vorgang: 'saldo' },
        { konto: 'Löhne', vorgang: 'zugang' },
      ],
    });
    expect(s.seiten).toEqual(['Haben', 'Soll', 'Haben', 'Soll']);
  });
});

describe('A3 Bewertung', () => {
  it('Vorsteuer als Aufwandskonto wird als Bestand/Erfolg-Verwechslung erkannt', () => {
    const p: A3Params = {
      ...leer,
      variante: 'zuordnen',
      konten: ['Vorsteuer', 'Bank', 'Löhne', 'Zinserträge'],
    };
    const s = solveKontenarten(p);
    const a = antwortAusParts(kontenarten.parts(p, s));
    a['kontenarten'] = {
      typ: 'felder',
      werte: { k0: 'Aufwandskonto', k1: 'Aktivkonto', k2: 'Aufwandskonto', k3: 'Ertragskonto' },
    };
    expect(kontenarten.check(p, s, a).fehlertypen).toContain('a-bestand-erfolg-verwechselt');
  });

  it('Abgänge addiert wird erkannt', () => {
    const s = solveKontenarten(bank);
    const a = antwortAusParts(kontenarten.parts(bank, s));
    const w = (a['kontostand'] as { typ: 'felder'; werte: Record<string, string> }).werte;
    w['saldo'] = '57.500,00';
    expect(kontenarten.check(bank, s, a).fehlertypen).toContain('a-abgaenge-addiert');
  });
});

describe('A3 Eigenschaften', () => {
  it('Saldo = Zugangsseite − Abgänge > 0; Saldo auf der Gegenseite des Anfangsbestands', () => {
    forSeeds(kontenarten, 500, (p, s) => {
      if (p.variante !== 'kontostand' && p.variante !== 'tkonto') return;
      expect(s.saldo.exact.gt(0)).toBe(true);
      expect(s.kontosumme.minus(s.abgaenge).value.equals(s.saldo.value)).toBe(true);
      expect(s.seiteSaldo).not.toBe(s.seiteAB);
      expect(s.seiteSaldo).toBe(saldoSeite(kontenart(p.konto)));
    });
  });

  it('Zuordnung: jede Kontenart kommt vor; Seiten folgen der Zugangsregel', () => {
    forSeeds(kontenarten, 300, (p, s) => {
      if (p.variante === 'zuordnen') expect(new Set(s.arten).size).toBe(4);
      if (p.variante === 'seiten')
        p.seiten.forEach((x, i) => {
          const z = zugangsSeite(kontenart(x.konto));
          expect(s.seiten[i]).toBe(
            x.vorgang === 'ab' || x.vorgang === 'zugang' ? z : z === 'Soll' ? 'Haben' : 'Soll',
          );
        });
    });
  });
});
