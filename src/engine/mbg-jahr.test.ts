import { describe, expect, it } from 'vitest';
import { habenSumme, sollSumme } from './booking';
import { KAPITEL_VORFAELLE, mbgJahr } from './mbg-jahr';

const ALLE = Object.keys(KAPITEL_VORFAELLE);

describe('MBG-Geschäftsjahr (Dashboard)', () => {
  it('jeder Vorfall: Soll = Haben', () => {
    for (const v of Object.values(KAPITEL_VORFAELLE).flat())
      expect(sollSumme(v.satz).value.toFixed(2)).toBe(habenSumme(v.satz).value.toFixed(2));
  });

  it('Bilanz ist für jede Kombination erledigter Kapitel ausgeglichen, Bank nie negativ', () => {
    for (let maske = 0; maske < 2 ** ALLE.length; maske++) {
      const erledigt = new Set(ALLE.filter((_, i) => maske & (1 << i)));
      const j = mbgJahr(erledigt);
      const passiva = j.passiva.reduce((a, x) => a.plus(x.betrag), j.summe.minus(j.summe));
      expect(passiva.toFixed(2)).toBe(j.summe.toFixed(2));
      const bank = j.aktiva.find((x) => x.konto === 'Bank');
      expect(bank === undefined || bank.betrag.gte(0)).toBe(true);
    }
  });

  it('Golden Case: Erfolg und Eigenkapital nach allen Kapiteln', () => {
    const j = mbgJahr(new Set(ALLE));
    // Erträge 400.000 + 650.000 + 15.000 = 1.065.000; Aufwand 270.000 + 190.000 + 297.600 = 757.600
    expect(j.erfolg.toFixed(2)).toBe('307400.00');
    // EK: 1.110.000 − 12.000 + 307.400 = 1.405.400
    expect(j.passiva.find((x) => x.konto === 'Eigenkapital')!.betrag.toFixed(2)).toBe('1405400.00');
    // Zahllast: 199.500 − (28.500 + 22.800 − 456 + 57.000) = 91.656
    expect(j.passiva.find((x) => x.konto === 'Umsatzsteuer')!.betrag.toFixed(2)).toBe('91656.00');
  });

  it('ohne erledigte Kapitel: Eröffnungsbilanz', () => {
    const j = mbgJahr(new Set());
    expect(j.summe.toFixed(2)).toBe('2085000.00');
    expect(j.erfolg.toFixed(2)).toBe('0.00');
  });
});
