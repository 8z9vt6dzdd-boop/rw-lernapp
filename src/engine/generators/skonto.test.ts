import { describe, expect, it } from 'vitest';
import { FIRMA } from '../../config';
import { dec } from '../money';
import { createRng } from '../rng';
import { antwortAusParts, eingabeAusLoesung } from '../testing';
import { alleAusgeglichen, buchungText, forSeeds, selbstpruefung } from '../test-utils';
import { skontoEinkauf, skontoVerkauf, solveSkonto, type SkontoParams } from './skonto';

const basis: Omit<SkontoParams, 'seite' | 'art' | 'methode' | 'gegeben' | 'betrag' | 'skontoSatz'> =
  {
    ustSatz: '0.19',
    partner: 'Testlieferant',
    gegenstand: 'Zucker',
    vorlage: 0,
  };

describe('Golden Cases Skonto', () => {
  it('GC-01 Lieferantenskonto, Nettomethode', () => {
    const s = solveSkonto({
      ...basis,
      seite: 'einkauf',
      art: 'Rohstoffe',
      methode: 'netto',
      gegeben: 'rechnung',
      betrag: '11900',
      skontoSatz: '0.02',
    });
    expect(s.skontoBrutto.value.toFixed(2)).toBe('238.00');
    expect(s.skontoNetto.value.toFixed(2)).toBe('200.00');
    expect(s.steuer.value.toFixed(2)).toBe('38.00');
    expect(s.zahlbetrag.value.toFixed(2)).toBe('11662.00');
    expect(buchungText(s.buchung)).toEqual([
      'Verbindlichkeiten a. LL 11.900,00 € an Bank 11.662,00 €, an Nachlässe für Rohstoffe 200,00 €, an Vorsteuer 38,00 €',
    ]);
  });

  it('GC-02 Lieferantenskonto, Bruttomethode', () => {
    const s = solveSkonto({
      ...basis,
      seite: 'einkauf',
      art: 'Rohstoffe',
      methode: 'brutto',
      gegeben: 'rechnung',
      betrag: '11900',
      skontoSatz: '0.02',
    });
    expect(buchungText(s.buchung)).toEqual([
      'Verbindlichkeiten a. LL 11.900,00 € an Bank 11.662,00 €, an Nachlässe für Rohstoffe 238,00 €',
      'Nachlässe für Rohstoffe 38,00 € an Vorsteuer 38,00 €',
    ]);
  });

  it('GC-03 Kundenskonto', () => {
    const s = solveSkonto({
      ...basis,
      seite: 'verkauf',
      art: 'Erzeugnisse',
      methode: 'netto',
      gegeben: 'rechnung',
      betrag: '5950',
      skontoSatz: '0.03',
    });
    expect(buchungText(s.buchung)).toEqual([
      'Bank 5.771,50 €, Erlösberichtigungen 150,00 €, Umsatzsteuer 28,50 € an Forderungen a. LL 5.950,00 €',
    ]);
  });

  it('GC-04 Zahlbetrag gegeben', () => {
    const s = solveSkonto({
      ...basis,
      seite: 'verkauf',
      art: 'Erzeugnisse',
      methode: 'netto',
      gegeben: 'zahlbetrag',
      betrag: '9702',
      skontoSatz: '0.02',
    });
    expect(s.rechnung.value.toFixed(2)).toBe('9900.00');
    expect(s.skontoBrutto.value.toFixed(2)).toBe('198.00');
    expect(s.skontoNetto.value.toFixed(2)).toBe('166.39');
    expect(s.steuer.value.toFixed(2)).toBe('31.61');
    expect(buchungText(s.buchung)).toEqual([
      'Bank 9.702,00 €, Erlösberichtigungen 166,39 €, Umsatzsteuer 31,61 € an Forderungen a. LL 9.900,00 €',
    ]);
  });

  it('GC-05 Skonto auf Anlagegut', () => {
    const s = solveSkonto({
      ...basis,
      seite: 'einkauf',
      art: 'Anlagegut',
      anlagekonto: 'Technische Anlagen und Maschinen',
      methode: 'brutto',
      gegeben: 'rechnung',
      betrag: '11900',
      skontoSatz: '0.02',
    });
    expect(buchungText(s.buchung)).toEqual([
      'Verbindlichkeiten a. LL 11.900,00 € an Bank 11.662,00 €, an TA und Maschinen 200,00 €, an Vorsteuer 38,00 €',
    ]);
  });
});

describe('Skonto: Bewertung und Fehlertypen', () => {
  const p: SkontoParams = {
    ...basis,
    seite: 'einkauf',
    art: 'Rohstoffe',
    methode: 'netto',
    gegeben: 'rechnung',
    betrag: '11900',
    skontoSatz: '0.02',
  };
  const s = solveSkonto(p);
  const parts = skontoEinkauf.parts(p, s);

  it('erkennt die richtige Lösung, auch mit anderer Zeilenreihenfolge und Synonymen', () => {
    const answer = antwortAusParts(parts);
    answer['buchung'] = {
      typ: 'buchung',
      saetze: [
        {
          soll: [{ konto: 'Verbindlichkeiten a. LL', betrag: '11.900' }],
          haben: [
            { konto: 'VSt', betrag: '38' },
            { konto: 'Nachlässe Rohstoffe', betrag: '200,00' },
            { konto: 'bank', betrag: '11662' },
          ],
        },
      ],
    };
    expect(skontoEinkauf.check(p, s, answer).korrekt).toBe(true);
  });

  it('akzeptiert getrennte, ausgeglichene Teilbuchungen', () => {
    const answer = antwortAusParts(parts);
    answer['buchung'] = {
      typ: 'buchung',
      saetze: [
        {
          soll: [{ konto: 'Verbindlichkeiten a. LL', betrag: '11662' }],
          haben: [{ konto: 'Bank', betrag: '11662' }],
        },
        {
          soll: [{ konto: 'Verbindlichkeiten a. LL', betrag: '238' }],
          haben: [
            { konto: 'Nachlässe für Rohstoffe', betrag: '200' },
            { konto: 'Vorsteuer', betrag: '38' },
          ],
        },
      ],
    };
    expect(skontoEinkauf.check(p, s, answer).korrekt).toBe(true);
  });

  it('erkennt Umsatzsteuer statt Vorsteuer', () => {
    const answer = antwortAusParts(parts);
    answer['buchung'] = {
      typ: 'buchung',
      saetze: [
        {
          soll: [{ konto: 'Verbindlichkeiten a. LL', betrag: '11900' }],
          haben: [
            { konto: 'Bank', betrag: '11662' },
            { konto: 'Nachlässe für Rohstoffe', betrag: '200' },
            { konto: 'Umsatzsteuer', betrag: '38' },
          ],
        },
      ],
    };
    const r = skontoEinkauf.check(p, s, answer);
    expect(r.korrekt).toBe(false);
    expect(r.fehlertypen).toContain('steuer-falsches-konto');
    expect(r.score).toBeGreaterThan(0.5);
  });

  it('erkennt fehlende Steuerkorrektur', () => {
    const answer = antwortAusParts(parts);
    answer['buchung'] = {
      typ: 'buchung',
      saetze: [
        {
          soll: [{ konto: 'Verbindlichkeiten a. LL', betrag: '11900' }],
          haben: [
            { konto: 'Bank', betrag: '11662' },
            { konto: 'Nachlässe für Rohstoffe', betrag: '238' },
          ],
        },
      ],
    };
    expect(skontoEinkauf.check(p, s, answer).fehlertypen).toContain('keine-steuerkorrektur');
  });

  it('erkennt Skonto vom Nettobetrag in der Rechenkette', () => {
    const answer = antwortAusParts(parts);
    answer['rechnung'] = {
      typ: 'felder',
      werte: {
        'skonto-brutto': '200',
        'skonto-netto': '168,07',
        steuer: '31,93',
        zahlbetrag: '11700',
      },
    };
    expect(skontoEinkauf.check(p, s, answer).fehlertypen).toContain('skonto-vom-netto');
  });

  it('akzeptiert bei offener Methode Netto- und Bruttomethode', () => {
    const po: SkontoParams = { ...p, methode: 'offen' };
    const so = solveSkonto(po);
    const brutto = so.alternativen[0]!;
    const answer = antwortAusParts(skontoEinkauf.parts(po, so));
    answer['buchung'] = { typ: 'buchung', saetze: eingabeAusLoesung(brutto) };
    expect(skontoEinkauf.check(po, so, answer).korrekt).toBe(true);
  });

  it('Bruttomethode: zusammengefasste Buchung ist nicht gleichwertig', () => {
    const pb: SkontoParams = { ...p, methode: 'brutto' };
    const sb = solveSkonto(pb);
    const answer = antwortAusParts(skontoEinkauf.parts(pb, sb));
    answer['buchung'] = { typ: 'buchung', saetze: eingabeAusLoesung(s.buchung) };
    expect(skontoEinkauf.check(pb, sb, answer).korrekt).toBe(false);
  });
});

describe('Skonto: Eigenschaften über 1.000 Seeds', () => {
  for (const g of [skontoEinkauf, skontoVerkauf]) {
    it(`${g.skillId}: Soll = Haben, Netto + Steuer = Brutto, Musterlösung wird akzeptiert`, () => {
      forSeeds(g, 1000, (p, s) => {
        expect(alleAusgeglichen(s.buchung)).toBe(true);
        for (const alt of s.alternativen) expect(alleAusgeglichen(alt)).toBe(true);
        expect(s.skontoNetto.plus(s.steuer).value.equals(s.skontoBrutto.value)).toBe(true);
        expect(s.zahlbetrag.plus(s.skontoBrutto).value.equals(s.rechnung.value)).toBe(true);
        expect(s.skontoBrutto.exact.gt(0)).toBe(true);
        expect(selbstpruefung(g, p, s)).toBe(true);
        // Der Sachverhalt nennt immer die gegebenen Beträge.
        const text = g.render(p, FIRMA).sachverhalt.join(' ');
        expect(text).toContain('Skonto');
      });
    });

    it(`${g.skillId}: deterministisch bei gleichem Seed`, () => {
      expect(g.generate(createRng(42))).toEqual(g.generate(createRng(42)));
    });
  }

  it('klausurfreundliche Werte überwiegen', () => {
    let exakt = 0;
    forSeeds(skontoEinkauf, 500, (_p, s) => {
      if (s.skontoNetto.exact.equals(s.skontoNetto.value)) exakt++;
    });
    expect(exakt).toBeGreaterThan(300);
    expect(dec(1).toString()).toBe('1');
  });
});

describe('Skonto: keine Fehlmeldung bei bloß unvollständiger Eingabe', () => {
  it('Bruttomethode, nur Zahlungssatz mit falschem Betrag → nicht „Steuerkorrektur vergessen“', () => {
    const p: SkontoParams = {
      ...basis,
      seite: 'einkauf',
      art: 'Rohstoffe',
      methode: 'brutto',
      gegeben: 'rechnung',
      betrag: '11900',
      skontoSatz: '0.02',
    };
    const s = solveSkonto(p);
    const answer = antwortAusParts(skontoEinkauf.parts(p, s));
    answer['buchung'] = {
      typ: 'buchung',
      saetze: [
        {
          soll: [{ konto: 'Verbindlichkeiten a. LL', betrag: '11900' }],
          haben: [{ konto: 'Bank', betrag: '11000' }],
        },
      ],
    };
    expect(skontoEinkauf.check(p, s, answer).fehlertypen).not.toContain('keine-steuerkorrektur');
  });

  it('Bruttomethode, Zahlung richtig aber Korrektur fehlt → „Steuerkorrektur vergessen“', () => {
    const p: SkontoParams = {
      ...basis,
      seite: 'einkauf',
      art: 'Rohstoffe',
      methode: 'brutto',
      gegeben: 'rechnung',
      betrag: '11900',
      skontoSatz: '0.02',
    };
    const s = solveSkonto(p);
    const answer = antwortAusParts(skontoEinkauf.parts(p, s));
    answer['buchung'] = {
      typ: 'buchung',
      saetze: eingabeAusLoesung({ ...s.buchung, saetze: s.buchung.saetze.slice(0, 1) }),
    };
    expect(skontoEinkauf.check(p, s, answer).fehlertypen).toContain('keine-steuerkorrektur');
  });
});

describe('Zusammengefasster USt-Abschluss', () => {
  it('gilt als richtig, Feedback zeigt getrennte Sätze als Klausur-Standard', async () => {
    const { ustAbschluss, solveUstAbschluss } = await import('./ust-abschluss');
    const p = {
      vorsteuer: '30000',
      umsatzsteuer: '45000',
      anlass: 'jahresabschluss' as const,
      monat: 'Dezember',
    };
    const s = solveUstAbschluss(p);
    const answer = antwortAusParts(ustAbschluss.parts(p, s));
    answer['buchung'] = {
      typ: 'buchung',
      saetze: [
        {
          soll: [{ konto: 'Umsatzsteuer', betrag: '45000' }],
          haben: [
            { konto: 'Vorsteuer', betrag: '30000' },
            { konto: 'SBK', betrag: '15000' },
          ],
        },
      ],
    };
    const r = ustAbschluss.check(p, s, answer);
    expect(r.korrekt).toBe(true);
    const fb = r.parts.find((x) => x.partId === 'buchung')!.feedback.join(' ');
    expect(fb).toContain('getrennte Buchungssätze');
    expect(fb).toContain('Umsatzsteuer 15.000,00');
  });
});
