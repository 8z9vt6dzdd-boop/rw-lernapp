// A6 – Golden Cases (eigene Zahlen, docs/m7/a.md) und Eigenschaftstests.
import { describe, expect, it } from 'vitest';
import { getKonto } from '../../accounts';
import { alleAusgeglichen, buchungText, forSeeds } from '../../test-utils';
import { antwortAusParts } from '../../testing';
import {
  eroeffnungAbschluss,
  solveEroeffnungAbschluss,
  type A6Params,
} from './eroeffnung-abschluss';

const VERB = 'Verbindlichkeiten aus Lieferungen und Leistungen';
const leer: A6Params = {
  variante: 'eroeffnung',
  aktiva: [],
  passiva: [],
  konto: 'Bank',
  ab: '0',
  bewegungen: [],
  salden: [],
};

const eroeffnung: A6Params = {
  ...leer,
  aktiva: [
    { konto: 'Technische Anlagen und Maschinen', betrag: '120000' },
    { konto: 'Rohstoffe', betrag: '30000' },
    { konto: 'Bank', betrag: '50000' },
  ],
  passiva: [
    { konto: 'Eigenkapital', betrag: '140000' },
    { konto: 'Darlehensschulden', betrag: '40000' },
    { konto: VERB, betrag: '20000' },
  ],
};

describe('Golden Cases A6', () => {
  it('GC-A6-01 Eröffnung: Aktivkonten an EBK 200.000, EBK an Passivkonten 200.000', () => {
    const s = solveEroeffnungAbschluss(eroeffnung);
    expect(s.summe.value.toFixed(0)).toBe('200000');
    expect(buchungText(s.buchung)).toEqual([
      'TA und Maschinen 120.000,00 €, Rohstoffe 30.000,00 €, Bank 50.000,00 € an EBK 200.000,00 €',
      'EBK 200.000,00 € an Eigenkapital 140.000,00 €, an Darlehensschulden 40.000,00 €, an Verbindlichkeiten a. LL 20.000,00 €',
    ]);
  });

  it('GC-A6-01b Einzelsätze mit „Saldenvortrag“ gelten als richtig', () => {
    const s = solveEroeffnungAbschluss(eroeffnung);
    const a = antwortAusParts(eroeffnungAbschluss.parts(eroeffnung, s));
    const sv = (soll: string, haben: string, b: string) => ({
      soll: [{ konto: soll, betrag: b }],
      haben: [{ konto: haben, betrag: b }],
    });
    a['buchung'] = {
      typ: 'buchung',
      saetze: [
        sv('TA und Maschinen', 'Saldenvortrag', '120.000'),
        sv('Rohstoffe', 'SV', '30.000'),
        sv('Bank', 'Saldenvortrag', '50.000'),
        sv('Saldenvortrag', 'Eigenkapital', '140.000'),
        sv('Saldenvortrag', 'Darlehen', '40.000'),
        sv('SV', 'Verbindlichkeiten a. LL', '20.000'),
      ],
    };
    expect(eroeffnungAbschluss.check(eroeffnung, s, a).korrekt).toBe(true);
  });

  it('GC-A6-02 Bank: AB 30.000 + 8.000 − 2.500 − 12.000 → SBK an Bank 23.500', () => {
    const s = solveEroeffnungAbschluss({
      ...leer,
      variante: 'bestandskonto',
      konto: 'Bank',
      ab: '30000',
      bewegungen: [
        {
          text: 'a',
          gegen: 'Forderungen aus Lieferungen und Leistungen',
          zugang: true,
          betrag: '8000',
        },
        { text: 'b', gegen: 'Mietaufwendungen', zugang: false, betrag: '2500' },
        { text: 'c', gegen: VERB, zugang: false, betrag: '12000' },
      ],
    });
    expect(s.seite).toBe('Haben');
    expect(buchungText(s.buchung)).toEqual(['SBK 23.500,00 € an Bank 23.500,00 €']);
  });

  it('GC-A6-03 Verbindlichkeiten: AB 20.000 + 6.000 − 9.000 → Verbindlichkeiten an SBK 17.000', () => {
    const s = solveEroeffnungAbschluss({
      ...leer,
      variante: 'bestandskonto',
      konto: VERB,
      ab: '20000',
      bewegungen: [
        { text: 'a', gegen: 'Hilfsstoffe', zugang: true, betrag: '6000' },
        { text: 'b', gegen: 'Bank', zugang: false, betrag: '9000' },
      ],
    });
    expect(s.seite).toBe('Soll');
    expect(buchungText(s.buchung)).toEqual([
      'Verbindlichkeiten a. LL 17.000,00 € an SBK 17.000,00 €',
    ]);
  });

  it('GC-A6-04 Mietaufwendungen 3.000 + 2.000 − 500 → GuV an Mietaufwendungen 4.500', () => {
    const s = solveEroeffnungAbschluss({
      ...leer,
      variante: 'erfolgskonto',
      konto: 'Mietaufwendungen',
      bewegungen: [
        { text: 'a', gegen: 'Bank', zugang: true, betrag: '3000' },
        { text: 'b', gegen: 'Bank', zugang: true, betrag: '2000' },
        { text: 'c', gegen: 'Bank', zugang: false, betrag: '500' },
      ],
    });
    expect(buchungText(s.buchung)).toEqual(['GuV 4.500,00 € an Mietaufwendungen 4.500,00 €']);
  });

  it('GC-A6-05 GuV mit Gewinn 8.000', () => {
    const s = solveEroeffnungAbschluss({
      ...leer,
      variante: 'guv',
      salden: [
        { konto: 'Löhne', betrag: '64000' },
        { konto: 'Werbung', betrag: '11000' },
        { konto: 'Umsatzerlöse für eigene Erzeugnisse', betrag: '82000' },
        { konto: 'Zinserträge', betrag: '1000' },
      ],
    });
    expect([s.aufwand, s.ertrag, s.erfolg].map((x) => x.value.toFixed(0))).toEqual([
      '75000',
      '83000',
      '8000',
    ]);
    expect(s.ergebnis).toBe('Gewinn');
    expect(buchungText(s.buchung)).toEqual([
      'GuV 64.000,00 € an Löhne 64.000,00 €',
      'GuV 11.000,00 € an Werbung 11.000,00 €',
      'Umsatzerlöse 82.000,00 € an GuV 82.000,00 €',
      'Zinserträge 1.000,00 € an GuV 1.000,00 €',
      'GuV 8.000,00 € an Eigenkapital 8.000,00 €',
    ]);
  });

  it('GC-A6-06 GuV mit Verlust 7.000 → Eigenkapital an GuV', () => {
    const s = solveEroeffnungAbschluss({
      ...leer,
      variante: 'guv',
      salden: [
        { konto: 'Löhne', betrag: '70000' },
        { konto: 'Mietaufwendungen', betrag: '25000' },
        { konto: 'Umsatzerlöse für eigene Erzeugnisse', betrag: '88000' },
      ],
    });
    expect(s.ergebnis).toBe('Verlust');
    expect(buchungText(s.buchung).at(-1)).toBe('Eigenkapital 7.000,00 € an GuV 7.000,00 €');
  });
});

describe('A6 Eigenschaften', () => {
  it('Soll = Haben; Bestandskonten nur über SBK/EBK, Erfolgskonten nur über GuV', () => {
    forSeeds(eroeffnungAbschluss, 1000, (p, s) => {
      expect(alleAusgeglichen(s.buchung)).toBe(true);
      const gegen = s.buchung.saetze.flatMap((x) =>
        [...x.soll, ...x.haben]
          .filter((z) => getKonto(z.konto).typ === 'abschluss')
          .map((z) => z.konto),
      );
      if (p.variante === 'eroeffnung')
        expect(new Set(gegen)).toEqual(new Set(['Eröffnungsbilanzkonto']));
      if (p.variante === 'bestandskonto') expect(gegen).toEqual(['Schlussbilanzkonto']);
      if (p.variante === 'erfolgskonto' || p.variante === 'guv')
        expect(new Set(gegen)).toEqual(new Set(['Gewinn- und Verlustkonto']));
      if (p.variante === 'eroeffnung') {
        // EBK ist Spiegelbild der Eröffnungsbilanz: beide Seiten = Bilanzsumme
        const [a, b] = s.buchung.saetze;
        expect(a!.haben[0]!.betrag.value.equals(b!.soll[0]!.betrag.value)).toBe(true);
      }
      if (p.variante === 'guv') {
        // GuV-Konto geht nach dem Abschluss auf
        let saldo = s.aufwand.minus(s.aufwand);
        for (const x of s.buchung.saetze)
          for (const z of x.soll)
            if (z.konto === 'Gewinn- und Verlustkonto') saldo = saldo.plus(z.betrag);
        for (const x of s.buchung.saetze)
          for (const z of x.haben)
            if (z.konto === 'Gewinn- und Verlustkonto') saldo = saldo.minus(z.betrag);
        expect(saldo.value.isZero()).toBe(true);
      }
    });
  });
});
