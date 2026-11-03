// A4 – Golden Cases (eigene Zahlen, docs/m7/a.md) und Eigenschaftstests.
import { describe, expect, it } from 'vitest';
import { buchungText, forSeeds } from '../../test-utils';
import { antwortAusParts } from '../../testing';
import { bilanzveraenderung, solveBilanzveraenderung, type A4Params } from './bilanzveraenderung';

const VERB = 'Verbindlichkeiten aus Lieferungen und Leistungen';

const basis: A4Params = {
  variante: 'serie',
  aktiva: [
    { konto: 'Technische Anlagen und Maschinen', betrag: '200000' },
    { konto: 'Fuhrpark', betrag: '30000' },
    { konto: 'Bank', betrag: '50000' },
    { konto: 'Kasse', betrag: '5000' },
  ],
  passiva: [
    { konto: 'Eigenkapital', betrag: '185000' },
    { konto: 'Darlehensschulden', betrag: '70000' },
    { konto: VERB, betrag: '30000' },
  ],
  vorfaelle: [
    { soll: 'Fuhrpark', haben: 'Bank', text: 'Gabelstapler', betrag: '20000' },
    { soll: 'Bank', haben: 'Darlehensschulden', text: 'Darlehen', betrag: '40000' },
    { soll: VERB, haben: 'Darlehensschulden', text: 'Umwandlung', betrag: '10000' },
    { soll: VERB, haben: 'Bank', text: 'Zahlung', betrag: '12000' },
  ],
  frageKonto: 'Bank',
};

describe('Golden Cases A4', () => {
  it('GC-A4-01 bis 04: Aktivtausch, Mehrung, Passivtausch, Minderung mit Bilanzsummen', () => {
    const s = solveBilanzveraenderung(basis);
    expect(s.summeVorher.value.toFixed(2)).toBe('285000.00');
    expect(s.arten).toEqual(['aktivtausch', 'mehrung', 'passivtausch', 'minderung']);
    expect(s.summen.map((x) => x.value.toFixed(0))).toEqual([
      '285000',
      '325000',
      '325000',
      '313000',
    ]);
    expect(s.endbestand.value.toFixed(2)).toBe('58000.00');
  });

  it('GC-A4-02 einzeln: Darlehen 40.000 → Bank 90.000, Darlehen 110.000, Bank an Darlehensschulden', () => {
    const p: A4Params = { ...basis, variante: 'einzeln', vorfaelle: [basis.vorfaelle[1]!] };
    const s = solveBilanzveraenderung(p);
    expect(s.bestandSoll.value.toFixed(0)).toBe('90000');
    expect(s.bestandHaben.value.toFixed(0)).toBe('110000');
    expect(buchungText(s.buchung)).toEqual(['Bank 40.000,00 € an Darlehensschulden 40.000,00 €']);
  });

  it('Tausch als Mehrung gewählt wird erkannt', () => {
    const p: A4Params = { ...basis, variante: 'einzeln', vorfaelle: [basis.vorfaelle[0]!] };
    const s = solveBilanzveraenderung(p);
    const a = antwortAusParts(bilanzveraenderung.parts(p, s));
    a['art'] = { typ: 'wahl', optionId: 'o-mehrung' };
    expect(bilanzveraenderung.check(p, s, a).fehlertypen).toContain(
      'a-tausch-als-mehrung-minderung',
    );
  });
});

describe('A4 Eigenschaften', () => {
  it('nach jedem Vorfall Aktiva = Passiva; Bilanzsumme ändert sich nur bei Mehrung/Minderung', () => {
    forSeeds(bilanzveraenderung, 1000, (p, s) => {
      s.summen.forEach((x, i) => {
        expect(x.value.equals(s.passivSummen[i]!.value)).toBe(true);
        const vorher = i === 0 ? s.summeVorher : s.summen[i - 1]!;
        const d = x.minus(vorher).value;
        const b = p.vorfaelle[i]!.betrag;
        if (s.arten[i] === 'mehrung') expect(d.toFixed(2)).toBe(Number(b).toFixed(2));
        else if (s.arten[i] === 'minderung') expect(d.neg().toFixed(2)).toBe(Number(b).toFixed(2));
        else expect(d.isZero()).toBe(true);
      });
    });
  });
});
