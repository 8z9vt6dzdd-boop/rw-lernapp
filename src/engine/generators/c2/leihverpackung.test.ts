import { describe, expect, it } from 'vitest';
import { FIRMA } from '../../../config';
import { prepareTask } from '../../../learning/prepare';
import { createRng } from '../../rng';
import { antwortAusParts, eingabeAusLoesung } from '../../testing';
import { alleAusgeglichen, buchungText, forSeeds, selbstpruefung } from '../../test-utils';
import { leihverpackung, solveLeih, type LeihParams } from './leihverpackung';

// GC-C6 (docs/m7/c2.md): Getränkedosen 24.000,00 netto, 20 Leihpaletten à 15,00 netto,
// später 16 zurück, Gutschrift 75 % des berechneten Werts.
const GC: LeihParams = {
  variante: 'gesamt',
  stoff: 'Hilfsstoffe',
  gegenstand: 'Getränkedosen',
  verpackung: 'Mehrweg-Leihpaletten',
  partner: 'Dosenwerk Rüther KG (Bielefeld)',
  warenwert: '24000',
  anzahl: 20,
  preis: '15',
  zurueck: 16,
  gutschriftSatz: '0.75',
  ustSatz: '0.19',
  vorlage: 0,
};

describe('Golden Cases Leihverpackung (GC-C6)', () => {
  const s = solveLeih(GC);

  it('GC-C6-1 Eingangsrechnung mit berechneter Leihverpackung', () => {
    expect(s.leih.value.toFixed(2)).toBe('300.00');
    expect(s.vorsteuer.value.toFixed(2)).toBe('4617.00');
    expect(s.rechnungBrutto.value.toFixed(2)).toBe('28917.00');
    expect(buchungText(s.rechnung)).toEqual([
      'Hilfsstoffe 24.000,00 €, Bezugskosten für Hilfsstoffe 300,00 €, Vorsteuer 4.617,00 € an Verbindlichkeiten a. LL 28.917,00 €',
    ]);
  });

  it('GC-C6-2 Gutschrift bei Rückgabe mindert Bezugskosten und Vorsteuer', () => {
    expect(s.gutschriftNetto.value.toFixed(2)).toBe('180.00');
    expect(s.vstKorrektur.value.toFixed(2)).toBe('34.20');
    expect(s.gutschriftBrutto.value.toFixed(2)).toBe('214.20');
    expect(buchungText(s.gutschrift)).toEqual([
      'Verbindlichkeiten a. LL 214,20 € an Bezugskosten für Hilfsstoffe 180,00 €, an Vorsteuer 34,20 €',
    ]);
  });

  it('GC-C6-3 Rest der Bezugskosten wird auf das Stoffkonto umgebucht', () => {
    expect(s.restBezugskosten.value.toFixed(2)).toBe('120.00');
    expect(buchungText(s.umbuchung)).toEqual([
      'Hilfsstoffe 120,00 € an Bezugskosten für Hilfsstoffe 120,00 €',
    ]);
  });
});

describe('Leihverpackung: Bewertung und Fehlertypen', () => {
  const p: LeihParams = { ...GC, variante: 'berechnung' };
  const s = solveLeih(p);
  const parts = leihverpackung.parts(p, s);

  it('erkennt Leihverpackung als Forderung', () => {
    const answer = antwortAusParts(parts);
    answer['buchung'] = {
      typ: 'buchung',
      saetze: [
        {
          soll: [
            { konto: 'Hilfsstoffe', betrag: '24000' },
            { konto: 'Sonstige Forderungen', betrag: '300' },
            { konto: 'Vorsteuer', betrag: '4617' },
          ],
          haben: [{ konto: 'Verbindlichkeiten a. LL', betrag: '28917' }],
        },
      ],
    };
    const r = leihverpackung.check(p, s, answer);
    expect(r.korrekt).toBe(false);
    expect(r.fehlertypen).toContain('leihverpackung-als-forderung');
  });

  it('erkennt Vorsteuer nur vom Warenwert', () => {
    const answer = antwortAusParts(parts);
    answer['rechnung'] = {
      typ: 'felder',
      werte: { leih: '300', vorsteuer: '4560', brutto: '28860' },
    };
    expect(leihverpackung.check(p, s, answer).fehlertypen).toContain(
      'leihverpackung-ohne-vorsteuer',
    );
  });

  it('erkennt Gutschrift auf Nachlässe statt auf Bezugskosten', () => {
    const pr: LeihParams = { ...GC, variante: 'rueckgabe' };
    const sr = solveLeih(pr);
    const answer = antwortAusParts(leihverpackung.parts(pr, sr));
    answer['buchung'] = {
      typ: 'buchung',
      saetze: [
        {
          soll: [{ konto: 'Verbindlichkeiten a. LL', betrag: '214,20' }],
          haben: [
            { konto: 'Nachlässe für Hilfsstoffe', betrag: '180' },
            { konto: 'Vorsteuer', betrag: '34,20' },
          ],
        },
      ],
    };
    expect(leihverpackung.check(pr, sr, answer).fehlertypen).toContain(
      'leihverpackung-gutschrift-nachlass',
    );
  });

  it('erkennt Gutschrift für alle statt für die zurückgegebenen Paletten', () => {
    const pr: LeihParams = { ...GC, variante: 'rueckgabe' };
    const sr = solveLeih(pr);
    const answer = antwortAusParts(leihverpackung.parts(pr, sr));
    answer['rechnung'] = {
      typ: 'felder',
      werte: { 'gutschrift-netto': '225', 'vst-korrektur': '42,75', 'gutschrift-brutto': '267,75' },
    };
    expect(leihverpackung.check(pr, sr, answer).fehlertypen).toContain(
      'leihverpackung-gutschrift-alle',
    );
  });

  it('Rechnung und Gutschrift sind zeitlich getrennt und nicht zusammenfassbar', () => {
    const answer = antwortAusParts(leihverpackung.parts(GC, solveLeih(GC)));
    const zusammen = {
      ...solveLeih(GC).rechnung,
      saetze: [
        {
          soll: [
            ...solveLeih(GC).rechnung.saetze[0]!.soll,
            ...solveLeih(GC).gutschrift.saetze[0]!.soll,
          ],
          haben: [
            ...solveLeih(GC).rechnung.saetze[0]!.haben,
            ...solveLeih(GC).gutschrift.saetze[0]!.haben,
          ],
        },
      ],
    };
    answer['buchung'] = { typ: 'buchung', saetze: eingabeAusLoesung(zusammen) };
    expect(leihverpackung.check(GC, solveLeih(GC), answer).korrekt).toBe(false);
  });
});

describe('Leihverpackung: Eigenschaften über 1.000 Seeds', () => {
  it('Soll = Haben, Brutto = Netto + Steuer, Rest = berechnet − gutgeschrieben', () => {
    forSeeds(leihverpackung, 1000, (p, s) => {
      expect(alleAusgeglichen(s.rechnung)).toBe(true);
      expect(alleAusgeglichen(s.gutschrift)).toBe(true);
      expect(alleAusgeglichen(s.umbuchung)).toBe(true);
      expect(s.gutschriftNetto.plus(s.vstKorrektur).value.equals(s.gutschriftBrutto.value)).toBe(
        true,
      );
      expect(s.leih.minus(s.gutschriftNetto).value.equals(s.restBezugskosten.value)).toBe(true);
      expect(s.gutschriftNetto.cmp(s.leih)).toBeLessThanOrEqual(0);
      expect(p.zurueck).toBeLessThanOrEqual(p.anzahl);
      expect(selbstpruefung(leihverpackung, p, s)).toBe(true);
      expect(leihverpackung.render(p, FIRMA).sachverhalt.join(' ')).toContain(p.verpackung);
    });
  });

  it('klausurfreundliche Werte überwiegen', () => {
    let glatt = 0;
    forSeeds(leihverpackung, 500, (_p, s) => {
      if (s.vorsteuer.exact.equals(s.vorsteuer.value) && s.leih.exact.equals(s.leih.value)) glatt++;
    });
    expect(glatt).toBeGreaterThan(350);
  });

  it('deterministisch bei gleichem Seed', () => {
    expect(leihverpackung.generate(createRng(42))).toEqual(leihverpackung.generate(createRng(42)));
  });

  it('eignet sich für „Fehler finden“ (einzeiliger Fehler im Buchungssatz)', () => {
    let gebaut = 0;
    for (let seed = 1; seed <= 60; seed++) {
      const t = prepareTask({ key: 'k', art: 'fehler', skillId: 'C6-leihverpackung', seed });
      if (t.parts[0]?.typ === 'fehler-finden') gebaut++;
    }
    expect(gebaut).toBeGreaterThan(20);
  });
});
