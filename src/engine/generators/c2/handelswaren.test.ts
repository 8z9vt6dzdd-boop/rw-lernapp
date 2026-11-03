import { describe, expect, it } from 'vitest';
import { createRng } from '../../rng';
import { antwortAusParts } from '../../testing';
import { alleAusgeglichen, buchungText, forSeeds, selbstpruefung } from '../../test-utils';
import { handelswaren, solveHw, type HwParams } from './handelswaren';

// GC-C8 (docs/m7/c2.md): Liboriwein, AB 18.000, Einkäufe 64.000, Bezugskosten 1.500,
// Nachlässe 800, SB 21.000, Umsatzerlöse für Handelswaren 92.000.
const GC: HwParams = {
  variante: 'bestandsorientiert',
  ware: 'Weißwein „Liboriwein“',
  lieferant: 'Weinkellerei Lindemeier (Detmold)',
  kunde: 'Landhotel Kerkhoff GmbH (Bad Driburg)',
  ab: '18000',
  einkauf: '64000',
  bezugskosten: '1500',
  nachlaesse: '800',
  sb: '21000',
  umsatz: '92000',
  ustSatz: '0.19',
};

describe('Golden Cases Handelswaren (GC-C8)', () => {
  it('GC-C8-1 bestandsorientiert: Wareneinsatz per Inventur, Rohgewinn', () => {
    const s = solveHw(GC);
    expect(s.wareneinsatz.value.toFixed(2)).toBe('61700.00');
    expect(s.rohgewinn.value.toFixed(2)).toBe('30300.00');
    expect(buchungText(s.abschluss)).toEqual([
      'Handelswaren 1.500,00 € an Bezugskosten für Handelswaren 1.500,00 €',
      'Nachlässe für Handelswaren 800,00 € an Handelswaren 800,00 €',
      'SBK 21.000,00 € an Handelswaren 21.000,00 €',
      'Aufwendungen für Handelswaren 61.700,00 € an Handelswaren 61.700,00 €',
    ]);
  });

  it('GC-C8-2 aufwandsorientiert: nur die Bestandsveränderung wird gebucht', () => {
    const p: HwParams = {
      ...GC,
      variante: 'aufwandsorientiert',
      bezugskosten: '0',
      nachlaesse: '0',
    };
    const s = solveHw(p);
    expect(s.bestandsveraenderung.value.toFixed(2)).toBe('3000.00');
    expect(s.wareneinsatz.value.toFixed(2)).toBe('61000.00');
    expect(s.rohgewinn.value.toFixed(2)).toBe('31000.00');
    expect(buchungText(s.abschluss)).toEqual([
      'Handelswaren 3.000,00 € an Aufwendungen für Handelswaren 3.000,00 €',
      'SBK 21.000,00 € an Handelswaren 21.000,00 €',
    ]);
  });

  it('GC-C8-2b beide Methoden ergeben denselben Wareneinsatz', () => {
    const ohne = { ...GC, bezugskosten: '0', nachlaesse: '0' };
    expect(solveHw(ohne).wareneinsatz.value.toFixed(2)).toBe(
      solveHw({ ...ohne, variante: 'aufwandsorientiert' }).wareneinsatz.value.toFixed(2),
    );
  });

  it('GC-C8-3 laufende Buchungen: Einkauf und Verkauf', () => {
    const p: HwParams = {
      ...GC,
      variante: 'laufende-buchungen',
      ware: 'Vodka „Domkreuz Vodka“',
      einkauf: '4800',
      umsatz: '6600',
    };
    const s = solveHw(p);
    expect(buchungText(s.einkauf)).toEqual([
      'Handelswaren 4.800,00 €, Vorsteuer 912,00 € an Verbindlichkeiten a. LL 5.712,00 €',
    ]);
    expect(buchungText(s.verkauf)).toEqual([
      'Forderungen a. LL 7.854,00 € an Umsatzerlöse für Handelswaren 6.600,00 €, an Umsatzsteuer 1.254,00 €',
    ]);
  });
});

describe('Handelswaren: Bewertung und Fehlertypen', () => {
  it('erkennt Erlös auf Umsatzerlöse für eigene Erzeugnisse', () => {
    const p: HwParams = { ...GC, variante: 'laufende-buchungen', einkauf: '4800', umsatz: '6600' };
    const s = solveHw(p);
    const answer = antwortAusParts(handelswaren.parts(p, s));
    answer['verkauf'] = {
      typ: 'buchung',
      saetze: [
        {
          soll: [{ konto: 'Forderungen a. LL', betrag: '7854' }],
          haben: [
            { konto: 'Umsatzerlöse', betrag: '6600' },
            { konto: 'USt', betrag: '1254' },
          ],
        },
      ],
    };
    const r = handelswaren.check(p, s, answer);
    expect(r.korrekt).toBe(false);
    expect(r.fehlertypen).toContain('handelswaren-erloese-eigene-erzeugnisse');
  });

  it('erkennt Wareneinsatz = Einkäufe', () => {
    const s = solveHw(GC);
    const answer = antwortAusParts(handelswaren.parts(GC, s));
    answer['rechnung'] = { typ: 'felder', werte: { wareneinsatz: '64700', rohgewinn: '27300' } };
    expect(handelswaren.check(GC, s, answer).fehlertypen).toContain(
      'handelswaren-wareneinsatz-gleich-einkauf',
    );
  });

  it('erkennt vertauschten Mehr- und Minderbestand', () => {
    const p: HwParams = {
      ...GC,
      variante: 'aufwandsorientiert',
      bezugskosten: '0',
      nachlaesse: '0',
    };
    const s = solveHw(p);
    const answer = antwortAusParts(handelswaren.parts(p, s));
    answer['rechnung'] = {
      typ: 'felder',
      werte: { art: 'Minderbestand', bv: '3000', wareneinsatz: '67000', rohgewinn: '25000' },
    };
    expect(handelswaren.check(p, s, answer).fehlertypen).toContain(
      'handelswaren-mehr-minder-vertauscht',
    );
  });
});

describe('Handelswaren: Eigenschaften über 1.000 Seeds', () => {
  it('Soll = Haben, Konto Handelswaren geht auf, Rohgewinn = Umsatz − Wareneinsatz', () => {
    forSeeds(handelswaren, 1000, (p, s) => {
      for (const l of [s.abschluss, s.einkauf, s.verkauf]) expect(alleAusgeglichen(l)).toBe(true);
      if (p.variante === 'bestandsorientiert') {
        // Soll: AB + Einkäufe + Bezugskosten = Haben: Nachlässe + SB + Wareneinsatz
        const soll = s.wareneinsatz
          .plus(p.sb)
          .plus(p.nachlaesse)
          .minus(p.ab)
          .minus(p.einkauf)
          .minus(p.bezugskosten);
        expect(soll.value.isZero()).toBe(true);
      }
      if (p.variante !== 'laufende-buchungen') {
        expect(s.wareneinsatz.exact.gt(0)).toBe(true);
        expect(s.rohgewinn.exact.gt(0)).toBe(true);
        expect(s.bestandsveraenderung.exact.isZero()).toBe(false);
      }
      expect(selbstpruefung(handelswaren, p, s)).toBe(true);
    });
  });

  it('deterministisch bei gleichem Seed', () => {
    expect(handelswaren.generate(createRng(42))).toEqual(handelswaren.generate(createRng(42)));
  });
});
