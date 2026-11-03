import { describe, expect, it } from 'vitest';
import { sollSumme, habenSumme } from '../booking';
import { antwortAusPart } from '../testing';
import type { TaskAnswer } from '../task';
import { generateGeschaeftsgang, geschaeftsgangFall, solveGeschaeftsgang } from './geschaeftsgang';
import { createRng } from '../rng';
import { pruefeSchritt } from './types';

describe('Fall E5 Geschäftsgang', () => {
  it('Bilanzgleichung: Aktiva = Passiva für viele Seeds', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const s = solveGeschaeftsgang(generateGeschaeftsgang(createRng(seed)));
      expect(s.summeAktiva.toFixed(2)).toBe(s.summePassiva.toFixed(2));
      expect(s.gewinn.gt(0)).toBe(true);
      expect(s.bank.saldo.gt(0)).toBe(true);
    }
  });

  it('Soll = Haben in jedem Buchungssatz', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const s = solveGeschaeftsgang(generateGeschaeftsgang(createRng(seed)));
      for (const l of Object.values(s.buchungen)) {
        for (const satz of l.saetze)
          expect(sollSumme(satz).value.toFixed(2)).toBe(habenSumme(satz).value.toFixed(2));
      }
    }
  });

  it('Golden Case: feste Werte', () => {
    const p = {
      ab: {
        maschinen: '200000',
        rohstoffe: '40000',
        fe: '20000',
        forderungen: '15000',
        bank: '60000',
        darlehen: '100000',
        verbindlichkeiten: '20000',
      },
      einkauf: '30000',
      verkauf: '100000',
      loehne: '20000',
      privat: '3000',
      afa: '20000',
      sbRohstoffe: '25000',
      sbFe: '25000',
      lieferant: 'L',
      kunde: 'K',
    };
    const s = solveGeschaeftsgang(p);
    // EK Anfang 200.000 + 40.000 + 20.000 + 15.000 + 60.000 − 100.000 − 20.000 = 215.000
    expect(s.ekAnfang.toFixed(2)).toBe('215000.00');
    // Skonto netto 600, Verbrauch 40.000 + 30.000 − 600 − 25.000 = 44.400
    // Erträge 100.000 + 5.000 = 105.000; Aufwand 44.400 + 20.000 + 20.000 = 84.400; Gewinn 20.600
    expect(s.ertraege.toFixed(2)).toBe('105000.00');
    expect(s.aufwendungen.toFixed(2)).toBe('84400.00');
    expect(s.gewinn.toFixed(2)).toBe('20600.00');
    // Bank 60.000 + 15.000 − 34.986 (35.700 × 98 %) − 20.000 − 3.000 = 17.014
    expect(s.bank.saldo.toFixed(2)).toBe('17014.00');
    expect(s.ekSchluss.toFixed(2)).toBe('232600.00');
    // Aktiva: 180.000 + 25.000 + 25.000 + 119.000 + 17.014 = 366.014
    expect(s.bilanzsumme.toFixed(2)).toBe('366014.00');
  });

  it('Musterlösung jedes Schritts erreicht volle Punktzahl', () => {
    for (let seed = 1; seed <= 30; seed++) {
      for (const schritt of geschaeftsgangFall(seed).schritte) {
        const a: TaskAnswer = {};
        for (const part of schritt.parts) a[part.id] = antwortAusPart(part);
        const r = pruefeSchritt(schritt, a);
        expect(r.korrekt, `${seed}/${schritt.id}`).toBe(true);
      }
    }
  });
});

describe('KLR-Fall', () => {
  it('Musterlösung jedes Schritts erreicht volle Punktzahl, Sätze plausibel', async () => {
    const { klrFall } = await import('./klr-fall');
    for (let seed = 1; seed <= 40; seed++) {
      const f = klrFall(seed);
      for (const schritt of f.schritte) {
        const a: TaskAnswer = {};
        for (const part of schritt.parts) a[part.id] = antwortAusPart(part);
        expect(pruefeSchritt(schritt, a).korrekt, `${seed}/${schritt.id}`).toBe(true);
      }
    }
  });

  it('Golden Case Zuschlagssätze', async () => {
    const { solveSaetze } = await import('./klr-fall');
    const { Val } = await import('../money');
    // MGK 12.000 auf FM 100.000 = 12 %; FGK 90.000 auf FL 60.000 = 150 %;
    // HK = 100.000 + 12.000 + 60.000 + 90.000 = 262.000; VwGK 26.200 = 10 %; VtGK 13.100 = 5 %
    const s = solveSaetze({
      mgk: new Val(12_000),
      fgk: new Val(90_000),
      vwgk: new Val(26_200),
      vtgk: new Val(13_100),
      fm: 100_000,
      fl: 60_000,
    });
    expect(s.mgk.value.toFixed(2)).toBe('12.00');
    expect(s.fgk.value.toFixed(2)).toBe('150.00');
    expect(s.hk.value.toFixed(2)).toBe('262000.00');
    expect(s.vwgk.value.toFixed(2)).toBe('10.00');
    expect(s.vtgk.value.toFixed(2)).toBe('5.00');
  });
});

describe('T-Konto-Einträge', () => {
  it('sind als Dezimal-Text lesbar', () => {
    const bank = geschaeftsgangFall(3).schritte.find((s) => s.id === 'bank')!.parts[0]!;
    if (bank.typ !== 'tkonto') throw new Error('kein T-Konto');
    for (const e of [...bank.soll, ...bank.haben]) expect(e.betrag).toMatch(/^\d+\.\d{2}$/);
  });
});
