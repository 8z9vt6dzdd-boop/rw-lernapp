// F6 – Golden Cases (GC-12 aus 04-fachregeln.md, GC-F6-x aus docs/m7/f2.md) und Eigenschaftstests.
import { describe, expect, it } from 'vitest';
import { formatNumber } from '../../money';
import { buchungText, forSeeds } from '../../test-utils';
import { antwortAusParts } from '../../testing';
import { forderungsbewertung as g, solveF6, type F6Params } from './forderungsbewertung';

const basis: F6Params = {
  fall: 'ewb',
  kunde: 'Bistro Paderufer Lüke (Paderborn)',
  ustSatz: '0.19',
  brutto: '0',
  quote: '0',
  quoteArt: 'ausfall',
  zweifelhaft: false,
  bestand: '0',
  pwbSatz: '0',
  altBestand: '0',
};
const f = formatNumber;

describe('F6 Golden Cases', () => {
  it('GC-12 Umbuchung und Einzelwertberichtigung (40 % vom Nettobetrag)', () => {
    const s = solveF6({ ...basis, brutto: '11900', quote: '0.4' });
    expect(f(s.netto)).toBe('10.000,00');
    expect(buchungText(s.buchung)).toEqual([
      'Zweifelhafte Forderungen 11.900,00 € an Forderungen a. LL 11.900,00 €',
      'Einstellung in Wertberichtigungen 4.000,00 € an EWB 4.000,00 €',
    ]);
  });

  it('GC-12 Pauschalwertberichtigung auf den einwandfreien Restbestand (1 %)', () => {
    const s = solveF6({
      ...basis,
      fall: 'pwb',
      brutto: '11900',
      bestand: '249900',
      pwbSatz: '0.01',
    });
    expect(f(s.brutto2)).toBe('238.000,00');
    expect(f(s.netto)).toBe('200.000,00');
    expect(buchungText(s.buchung)).toEqual([
      'Einstellung in Wertberichtigungen 2.000,00 € an PWB 2.000,00 €',
    ]);
  });

  it('GC-F6-1 Herabsetzung der Pauschalwertberichtigung', () => {
    const s = solveF6({
      ...basis,
      fall: 'pwb',
      brutto: '11900',
      bestand: '368900',
      pwbSatz: '0.015',
      altBestand: '6000',
    });
    expect(f(s.wert)).toBe('4.500,00');
    expect(s.anpassung).toBe('Herabsetzung (Ertrag)');
    expect(buchungText(s.buchung)).toEqual([
      'PWB 1.500,00 € an Erträge aus Herabsetzung von WB 1.500,00 €',
    ]);
  });

  it('GC-F6-2 Anpassung der Einzelwertberichtigung (Herabsetzung und Erhöhung)', () => {
    const p = { ...basis, fall: 'ewb-anpassung' as const, brutto: '23800', quote: '0.3' };
    expect(buchungText(solveF6({ ...p, altBestand: '8000' }).buchung)).toEqual([
      'EWB 2.000,00 € an Erträge aus Herabsetzung von WB 2.000,00 €',
    ]);
    expect(buchungText(solveF6({ ...p, altBestand: '5000' }).buchung)).toEqual([
      'Einstellung in Wertberichtigungen 1.000,00 € an EWB 1.000,00 €',
    ]);
  });

  it('GC-F6-3 Endgültiger Ausfall mit Umsatzsteuerkorrektur', () => {
    const p = { ...basis, fall: 'ausfall' as const, brutto: '4760' };
    expect(buchungText(solveF6(p).buchung)).toEqual([
      'Abschreibungen auf Forderungen 4.000,00 €, Umsatzsteuer 760,00 € an Forderungen a. LL 4.760,00 €',
    ]);
    expect(buchungText(solveF6({ ...p, zweifelhaft: true }).buchung)).toEqual([
      'Abschreibungen auf Forderungen 4.000,00 €, Umsatzsteuer 760,00 € an Zweifelhafte Forderungen 4.760,00 €',
    ]);
  });

  it('GC-F6-4 Insolvenzquote (Erstattungsquote 25 % = Ausfallquote 75 %)', () => {
    const p = { ...basis, fall: 'insolvenzquote' as const, brutto: '35700', zweifelhaft: true };
    const erwartet = [
      'Bank 8.925,00 €, Abschreibungen auf Forderungen 22.500,00 €, Umsatzsteuer 4.275,00 € an Zweifelhafte Forderungen 35.700,00 €',
    ];
    expect(buchungText(solveF6({ ...p, quote: '0.25', quoteArt: 'erstattung' }).buchung)).toEqual(
      erwartet,
    );
    expect(buchungText(solveF6({ ...p, quote: '0.75', quoteArt: 'ausfall' }).buchung)).toEqual(
      erwartet,
    );
  });

  it('GC-F6-5 Eingang einer abgeschriebenen Forderung: Umsatzsteuer lebt wieder auf', () => {
    expect(buchungText(solveF6({ ...basis, fall: 'eingang', brutto: '2975' }).buchung)).toEqual([
      'Bank 2.975,00 € an Erträge aus abgeschriebenen Forderungen 2.500,00 €, an Umsatzsteuer 475,00 €',
    ]);
  });
});

describe('F6 Eigenschaften', () => {
  for (const variant of g.variants) {
    it(`${variant}: Rechenregeln gelten über 500 Seeds`, () => {
      forSeeds(
        g,
        500,
        (p, s) => {
          const brutto = s.netto.value.plus(s.steuer.value);
          switch (p.fall) {
            case 'ewb':
            case 'ewb-anpassung':
              // Wertberichtigung nie höher als die Nettoforderung, Umsatzsteuer bleibt unberührt
              expect(s.wert.value.lte(s.netto.value)).toBe(true);
              expect(JSON.stringify(s.buchung)).not.toContain('"Umsatzsteuer"');
              break;
            case 'pwb':
              // Basis der PWB = Forderungsbestand ohne die zweifelhafte Forderung
              expect(s.brutto2.exact.plus(p.brutto).equals(p.bestand)).toBe(true);
              expect(s.wert.value.lt(s.netto.value)).toBe(true);
              break;
            case 'ausfall':
            case 'eingang':
              expect(brutto.equals(p.brutto)).toBe(true);
              break;
            case 'insolvenzquote':
              expect(s.bank.value.plus(brutto).equals(p.brutto)).toBe(true);
              break;
          }
          if (p.fall === 'ewb-anpassung' || p.fall === 'pwb') {
            const vorzeichen = s.anpassung === 'Erhöhung (Einstellung)' ? 1 : -1;
            expect(
              s.differenz.value.times(vorzeichen).plus(p.altBestand).equals(s.wert.value),
            ).toBe(true);
          }
          // jede Fehlervariante unterscheidet sich von der Musterlösung
          for (const v of g.errorVariants(p)) {
            expect(g.check(p, s, antwortAusParts(v.parts)).korrekt, v.fehlertyp).toBe(false);
          }
        },
        { variant },
      );
    });
  }

  it('Lösungen mit Bruttobasis werden als „vom Brutto“ erkannt', () => {
    const p = { ...basis, brutto: '11900', quote: '0.4' };
    const s = solveF6(p);
    const falsch = g.errorVariants(p).find((v) => v.fehlertyp === 'abschreibung-vom-brutto')!;
    expect(g.check(p, s, antwortAusParts(falsch.parts)).fehlertypen).toContain(
      'abschreibung-vom-brutto',
    );
  });
});
