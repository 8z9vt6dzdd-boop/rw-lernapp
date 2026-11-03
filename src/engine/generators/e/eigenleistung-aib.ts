// E2 – Aktivierte Eigenleistungen, Anlagen im Bau, geleistete Anzahlungen auf Sachanlagen
// (BA 3.4.3 und 3.4.4). Eigenleistungen: Anlagekonto an Aktivierte Eigenleistungen zu
// Herstellungskosten, ohne Umsatzsteuer. Anzahlungen sind umsatzsteuerpflichtig; bei der
// Schlussrechnung wird die Anzahlung verrechnet. Erst mit Fertigstellung: Anlagekonto an Anlagen im Bau.
import { loesung, satz, zeile, type BuchungsLoesung } from '../../booking';
import { Val, dec } from '../../money';
import type { ErrorVariant, SolutionStep, TaskPart } from '../../task';
import { FIRMA } from '../../../config';
import { betrag, defineGenerator, eur, feld, isExact, isKrumm, pct, retry } from '../base';

export type EigenleistungVariante = 'eigenleistung' | 'anzahlung' | 'fertigstellung';

export interface EigenleistungParams {
  variante: EigenleistungVariante;
  /** z. B. „eine Förderstrecke zwischen Abfüllung und Lager“ */
  objekt: string;
  konto: string;
  ustSatz: string;
  // Eigenleistung
  material?: string;
  loehne?: string;
  mgkSatz?: string;
  fgkSatz?: string;
  /** Vertriebsgemeinkosten-Zuschlag auf die Herstellungskosten (darf nicht aktiviert werden) */
  vtgkSatz?: string;
  // Anzahlung
  anzahlung?: string;
  schlussrechnung?: string;
  // Fertigstellung
  aibVorjahr?: string;
  partner?: string;
  monat?: string;
}

export interface EigenleistungSolution {
  // Eigenleistung
  mgk?: Val;
  fgk?: Val;
  hk?: Val;
  // Anzahlung
  vstAnzahlung?: Val;
  rest?: Val;
  vstRest?: Val;
  ueberweisung?: Val;
  // Fertigstellung
  vstSchluss?: Val;
  ak?: Val;
  buchungen: Record<string, BuchungsLoesung>;
}

const AE = 'Aktivierte Eigenleistungen';
const AIB = 'Anlagen im Bau';
const GANZ = 'Geleistete Anzahlungen auf Sachanlagen';
const VERB = 'Verbindlichkeiten aus Lieferungen und Leistungen';

interface Rechenweg {
  ohneGemeinkosten?: boolean;
  mitVertrieb?: boolean;
  ertragskonto?: string;
  anzahlungOhneUst?: boolean;
  anzahlungNichtVerrechnet?: boolean;
  anzahlungBrutto?: boolean;
  nurSchlussUmgebucht?: boolean;
  steuerKonto?: string;
}

export function solveEigenleistung(
  p: EigenleistungParams,
  w: Rechenweg = {},
): EigenleistungSolution {
  const u = dec(p.ustSatz);
  const vst = w.steuerKonto ?? 'Vorsteuer';
  switch (p.variante) {
    case 'eigenleistung': {
      const material = new Val(p.material!);
      const loehne = new Val(p.loehne!);
      const mgk = material.times(p.mgkSatz!).fix();
      const fgk = loehne.times(p.fgkSatz!).fix();
      let hk = w.ohneGemeinkosten
        ? material.plus(loehne)
        : material.plus(mgk).plus(loehne).plus(fgk);
      if (w.mitVertrieb && p.vtgkSatz) hk = hk.plus(hk.times(p.vtgkSatz).fix());
      return {
        mgk,
        fgk,
        hk,
        buchungen: {
          buchung: loesung([satz([zeile(p.konto, hk)], [zeile(w.ertragskonto ?? AE, hk)])]),
        },
      };
    }
    case 'anzahlung': {
      const a = new Val(p.anzahlung!);
      const g = new Val(p.schlussrechnung!);
      const vstAnzahlung = a.times(u).fix();
      const rest = g.minus(a);
      const vstRest = (w.anzahlungBrutto ? g : rest).times(u).fix();
      const ueberweisung = rest.plus(rest.times(u).fix());
      const anz = w.anzahlungOhneUst
        ? satz([zeile(GANZ, a.plus(vstAnzahlung))], [zeile('Bank', a.plus(vstAnzahlung))])
        : satz([zeile(GANZ, a), zeile(vst, vstAnzahlung)], [zeile('Bank', a.plus(vstAnzahlung))]);
      const schluss = w.anzahlungNichtVerrechnet
        ? satz([zeile(AIB, rest), zeile(vst, vstRest)], [zeile('Bank', ueberweisung)])
        : satz(
            [zeile(AIB, g), zeile(vst, vstRest)],
            [
              zeile('Bank', ueberweisung),
              zeile(GANZ, w.anzahlungBrutto ? a.plus(vstAnzahlung) : a),
            ],
          );
      return {
        vstAnzahlung,
        rest,
        vstRest,
        ueberweisung,
        buchungen: { anzahlung: loesung([anz]), schluss: loesung([schluss]) },
      };
    }
    case 'fertigstellung': {
      const vj = new Val(p.aibVorjahr!);
      const s = new Val(p.schlussrechnung!);
      const vstSchluss = s.times(u).fix();
      const ak = w.nurSchlussUmgebucht ? s : vj.plus(s);
      return {
        vstSchluss,
        ak,
        buchungen: {
          schluss: loesung([
            satz([zeile(AIB, s), zeile(vst, vstSchluss)], [zeile(VERB, s.plus(vstSchluss))]),
          ]),
          umbuchung: loesung([satz([zeile(p.konto, ak)], [zeile(AIB, ak)])]),
        },
      };
    }
  }
}

const WIRKUNG_RICHTIG = 'Aufwand und Ertrag gleichen sich aus (erfolgsneutral)';
const WIRKUNG = [
  WIRKUNG_RICHTIG,
  'Der Erfolg sinkt um die Herstellungskosten',
  'Der Erfolg steigt um die Herstellungskosten',
];
const AFA_RICHTIG = 'ab dem Monat der Fertigstellung';
const AFA = [
  AFA_RICHTIG,
  'ab der ersten Teilrechnung im Vorjahr',
  'erst ab dem nächsten Geschäftsjahr',
];

function parts(p: EigenleistungParams, s: EigenleistungSolution): TaskPart[] {
  const b = s.buchungen;
  switch (p.variante) {
    case 'eigenleistung':
      return [
        {
          typ: 'rechenkette',
          id: 'hk',
          titel: 'Herstellungskosten der Eigenleistung',
          felder: [
            feld('mgk', 'Materialgemeinkosten', s.mgk!),
            feld('fgk', 'Fertigungsgemeinkosten', s.fgk!),
            feld('hk', 'Herstellungskosten (zu aktivieren)', s.hk!),
            {
              typ: 'auswahl',
              id: 'wirkung',
              label: 'Wirkung auf den Erfolg, zusammen mit den schon gebuchten Aufwendungen',
              optionen: WIRKUNG,
              soll: WIRKUNG_RICHTIG,
            },
          ],
        },
        {
          typ: 'buchungssatz',
          id: 'buchung',
          titel: 'Buchungssatz für die Aktivierung',
          loesung: b.buchung!,
        },
      ];
    case 'anzahlung':
      return [
        {
          typ: 'buchungssatz',
          id: 'anzahlung',
          titel: 'Buchungssatz für die Anzahlung',
          loesung: b.anzahlung!,
        },
        {
          typ: 'rechenkette',
          id: 'rest',
          titel: 'Schlussrechnung abzüglich Anzahlung',
          felder: [
            feld('rest', 'Restbetrag netto', s.rest!),
            feld('vst-rest', 'Vorsteuer auf den Restbetrag', s.vstRest!),
            feld('ueberweisung', 'Überweisungsbetrag', s.ueberweisung!),
          ],
        },
        {
          typ: 'buchungssatz',
          id: 'schluss',
          titel: 'Buchungssatz für die Schlussrechnung',
          loesung: b.schluss!,
        },
      ];
    case 'fertigstellung':
      return [
        {
          typ: 'buchungssatz',
          id: 'schluss',
          titel: 'Buchungssatz für die Schlussrechnung',
          loesung: b.schluss!,
        },
        {
          typ: 'rechenkette',
          id: 'ak',
          titel: 'Fertigstellung',
          felder: [
            feld('ak', 'Anschaffungskosten der fertigen Anlage', s.ak!),
            {
              typ: 'auswahl',
              id: 'afa',
              label: 'Ab wann wird die Anlage planmäßig abgeschrieben?',
              optionen: AFA,
              soll: AFA_RICHTIG,
            },
          ],
        },
        {
          typ: 'buchungssatz',
          id: 'umbuchung',
          titel: 'Buchungssatz für die Umbuchung bei Fertigstellung',
          loesung: b.umbuchung!,
        },
      ];
  }
}

function variants(p: EigenleistungParams): ErrorVariant[] {
  const out: ErrorVariant[] = [];
  const add = (fehlertyp: string, w: Rechenweg) =>
    out.push({ fehlertyp, parts: parts(p, solveEigenleistung(p, w)) });
  switch (p.variante) {
    case 'eigenleistung':
      add('gemeinkosten-vergessen', { ohneGemeinkosten: true });
      if (p.vtgkSatz) add('vertriebskosten-aktiviert', { mitVertrieb: true });
      add('eigenleistung-falsches-ertragskonto', {
        ertragskonto: 'Umsatzerlöse für eigene Erzeugnisse',
      });
      add('eigenleistung-falsches-ertragskonto', { ertragskonto: 'Bestandsveränderungen' });
      break;
    case 'anzahlung':
      add('anzahlung-ohne-ust', { anzahlungOhneUst: true });
      add('anzahlung-nicht-verrechnet', { anzahlungNichtVerrechnet: true });
      add('anzahlung-brutto-verrechnet', { anzahlungBrutto: true });
      add('steuer-falsches-konto', { steuerKonto: 'Umsatzsteuer' });
      break;
    case 'fertigstellung':
      add('aib-teilweise-umgebucht', { nurSchlussUmgebucht: true });
      add('steuer-falsches-konto', { steuerKonto: 'Umsatzsteuer' });
      break;
  }
  return out;
}

const EIGEN_OBJEKTE: { objekt: string; konto: string }[] = [
  {
    objekt: 'eine Förderstrecke zwischen Abfüllung und Logistikzentrum',
    konto: 'Technische Anlagen und Maschinen',
  },
  { objekt: 'einen Mischbehälter für den Sirupkeller', konto: 'Technische Anlagen und Maschinen' },
  {
    objekt: 'eine Vorrichtung zum Wechseln der Dosenformate an der Abfüllanlage',
    konto: 'Technische Anlagen und Maschinen',
  },
  {
    objekt: 'Werkbänke und Regale für die eigene Werkstatt',
    konto: 'Betriebs- und Geschäftsausstattung',
  },
];

const MONATE = ['Februar', 'März', 'April', 'Mai', 'Juni'];

export const eigenleistungAib = defineGenerator<EigenleistungParams, EigenleistungSolution>({
  skillId: 'E2-eigenleistung-aib',
  titel: 'Eigenleistungen und Anlagen im Bau',
  variants: ['eigenleistung', 'anzahlung', 'fertigstellung'],
  points: 4,
  generate: (rng, opts = {}) => {
    const variante =
      (opts.variant as EigenleistungVariante | undefined) ??
      rng.pick<EigenleistungVariante>([
        'eigenleistung',
        'eigenleistung',
        'anzahlung',
        'fertigstellung',
      ]);
    const krumm = isKrumm(rng, opts.krummAnteil);
    const partner = rng.pick(FIRMA.lieferanten.anlagen);
    return retry(
      rng,
      (r): EigenleistungParams => {
        if (variante === 'eigenleistung') {
          const o = r.pick(EIGEN_OBJEKTE);
          const p: EigenleistungParams = {
            variante,
            objekt: o.objekt,
            konto: o.konto,
            ustSatz: '0.19',
            material: betrag(r, 2_000, 40_000, 100, krumm),
            loehne: betrag(r, 2_000, 30_000, 100, krumm),
            mgkSatz: r.pick(['0.08', '0.1', '0.12', '0.15', '0.2']),
            fgkSatz: r.pick(['0.8', '1', '1.2', '1.5', '1.8']),
          };
          if (r.chance(0.5)) p.vtgkSatz = r.pick(['0.04', '0.05', '0.06']);
          return p;
        }
        const objekt = 'die neue Abfülllinie für Glasflaschen';
        if (variante === 'anzahlung') {
          const g = r.step(20_000, 200_000, 1_000);
          const a = r.step(Math.max(5_000, g * 0.2), g * 0.5, 1_000);
          return {
            variante,
            objekt,
            konto: 'Technische Anlagen und Maschinen',
            ustSatz: '0.19',
            anzahlung: String(a),
            schlussrechnung: krumm ? betrag(r, g, g + 999, 1, true) : String(g),
            partner,
          };
        }
        return {
          variante,
          objekt,
          konto: 'Technische Anlagen und Maschinen',
          ustSatz: '0.19',
          aibVorjahr: betrag(r, 50_000, 400_000, 1_000, krumm),
          schlussrechnung: betrag(r, 10_000, 150_000, 1_000, krumm),
          partner,
          monat: r.pick(MONATE),
        };
      },
      (p) => {
        if (krumm) return true;
        const s = solveEigenleistung(p);
        if (p.variante === 'eigenleistung')
          return (
            isExact(new Val(p.material!).times(p.mgkSatz!).exact) &&
            isExact(new Val(p.loehne!).times(p.fgkSatz!).exact)
          );
        if (p.variante === 'anzahlung') return isExact(s.rest!.times(p.ustSatz).exact);
        return true;
      },
    );
  },
  render: (p) => {
    const u = pct(p.ustSatz);
    switch (p.variante) {
      case 'eigenleistung':
        return {
          titel: 'Aktivierte Eigenleistung',
          kontext: 'Juli: Die Werkstatt baut selbst',
          sachverhalt: [
            `Die Werkstatt der MBG hat ${p.objekt} selbst gebaut. Die Anlage wird im eigenen Werk genutzt. Alle Aufwendungen dafür sind bereits auf den Aufwandskonten gebucht.`,
            'Zu aktivieren sind die Herstellungskosten einschließlich der angemessenen Material- und Fertigungsgemeinkosten.',
            ...(p.vtgkSatz
              ? [
                  `Das Controlling rechnet zusätzlich ${pct(p.vtgkSatz)} Vertriebsgemeinkosten auf die Herstellungskosten zu.`,
                ]
              : []),
          ],
          daten: {
            spalten: ['Position', 'Wert'],
            zeilen: [
              ['Verbrauchtes Material', eur(p.material!)],
              ['Materialgemeinkosten', `${pct(p.mgkSatz!)} des Materials`],
              ['Fertigungslöhne der Werkstatt', eur(p.loehne!)],
              ['Fertigungsgemeinkosten', `${pct(p.fgkSatz!)} der Fertigungslöhne`],
            ],
          },
          aufgabe:
            'Ermittle die Herstellungskosten, beurteile die Wirkung auf den Erfolg und bilde den Buchungssatz für die Aktivierung.',
        };
      case 'anzahlung':
        return {
          titel: 'Anzahlung auf eine Anlage im Bau',
          kontext: 'Juli: neue Abfülllinie im Bau',
          sachverhalt: [
            `Für ${p.objekt} verlangt ${p.partner} eine Anzahlung von ${eur(p.anzahlung!)} netto zuzüglich ${u} Umsatzsteuer. Die MBG überweist per Bank.`,
            `Später erteilt ${p.partner} die Schlussrechnung über ${eur(p.schlussrechnung!)} netto zuzüglich ${u} Umsatzsteuer. Die Linie ist noch nicht fertig. Die MBG überweist sofort den Restbetrag unter Verrechnung der Anzahlung.`,
          ],
          aufgabe:
            'Buche die Anzahlung, ermittle den Überweisungsbetrag und buche die Schlussrechnung.',
        };
      case 'fertigstellung':
        return {
          titel: 'Anlage im Bau fertigstellen',
          kontext: 'Folgejahr: Inbetriebnahme der Abfülllinie',
          sachverhalt: [
            `Auf dem Konto Anlagen im Bau stehen aus dem Vorjahr ${eur(p.aibVorjahr!)} für ${p.objekt}.`,
            `Im Januar trifft die Schlussrechnung von ${p.partner} über ${eur(p.schlussrechnung!)} netto zuzüglich ${u} Umsatzsteuer ein (auf Ziel). Die Montage läuft noch.`,
            `Im ${p.monat} ist die Linie fertig und geht in Betrieb.`,
          ],
          aufgabe:
            'Buche die Schlussrechnung, ermittle die Anschaffungskosten der fertigen Anlage und buche die Umbuchung bei Fertigstellung.',
        };
    }
  },
  solve: (p) => solveEigenleistung(p),
  parts,
  steps: (p, s) => {
    const u = pct(p.ustSatz);
    const steps: SolutionStep[] = [];
    switch (p.variante) {
      case 'eigenleistung':
        steps.push(
          {
            titel: 'Gemeinkosten',
            rechnung: `MGK ${eur(p.material!)} × ${pct(p.mgkSatz!)} = ${eur(s.mgk!)}; FGK ${eur(p.loehne!)} × ${pct(p.fgkSatz!)} = ${eur(s.fgk!)}`,
          },
          {
            titel: 'Herstellungskosten',
            rechnung: `${eur(p.material!)} + ${eur(s.mgk!)} + ${eur(p.loehne!)} + ${eur(s.fgk!)} = ${eur(s.hk!)}`,
            erlaeuterung: p.vtgkSatz
              ? 'Vertriebsgemeinkosten dürfen nicht in die Herstellungskosten einbezogen werden.'
              : 'Material- und Fertigungseinzelkosten plus angemessene Gemeinkosten.',
          },
          {
            titel: 'Buchung',
            rechnung: `${p.konto} an Aktivierte Eigenleistungen ${eur(s.hk!)}`,
            erlaeuterung:
              'Ohne Umsatzsteuer, denn nichts wird verkauft. Der Ertrag gleicht die schon gebuchten Aufwendungen aus; die Aufwandskonten selbst bleiben unverändert.',
          },
        );
        break;
      case 'anzahlung':
        steps.push(
          {
            titel: 'Anzahlung',
            rechnung: `Geleistete Anzahlungen ${eur(p.anzahlung!)} + Vorsteuer ${eur(s.vstAnzahlung!)} an Bank ${eur(new Val(p.anzahlung!).plus(s.vstAnzahlung!))}`,
            erlaeuterung:
              'Anzahlungen sind umsatzsteuerpflichtig, die Vorsteuer wird sofort gebucht.',
          },
          {
            titel: 'Restbetrag',
            rechnung: `${eur(p.schlussrechnung!)} − ${eur(p.anzahlung!)} = ${eur(s.rest!)}; Vorsteuer ${u} = ${eur(s.vstRest!)}; Überweisung ${eur(s.ueberweisung!)}`,
            erlaeuterung:
              'Die Vorsteuer auf die Anzahlung ist schon abgezogen. Neu ist nur die Vorsteuer auf den Rest.',
          },
          {
            titel: 'Schlussrechnung',
            rechnung: `Anlagen im Bau ${eur(p.schlussrechnung!)}, Vorsteuer ${eur(s.vstRest!)} an Bank ${eur(s.ueberweisung!)}, an Geleistete Anzahlungen ${eur(p.anzahlung!)}`,
            erlaeuterung: 'Die Anzahlung wird ausgebucht und auf Anlagen im Bau umgebucht.',
          },
        );
        break;
      case 'fertigstellung':
        steps.push(
          {
            titel: 'Schlussrechnung',
            rechnung: `Anlagen im Bau ${eur(p.schlussrechnung!)}, Vorsteuer ${eur(s.vstSchluss!)} an Verbindlichkeiten a. LL ${eur(new Val(p.schlussrechnung!).plus(s.vstSchluss!))}`,
            erlaeuterung: 'Die Anlage ist noch nicht fertig, deshalb Anlagen im Bau.',
          },
          {
            titel: 'Umbuchung',
            rechnung: `${eur(p.aibVorjahr!)} + ${eur(p.schlussrechnung!)} = ${eur(s.ak!)}: ${p.konto} an Anlagen im Bau`,
            erlaeuterung:
              'Mit der Fertigstellung wird der gesamte Bestand umgebucht. Erst ab jetzt wird abgeschrieben.',
          },
        );
        break;
    }
    return steps;
  },
  hints: (p, s) => {
    switch (p.variante) {
      case 'eigenleistung':
        return [
          'Selbst gebaute Anlagen werden zu Herstellungskosten aktiviert. Gegenkonto ist ein Ertragskonto.',
          'Herstellungskosten = Material + Materialgemeinkosten + Fertigungslöhne + Fertigungsgemeinkosten. Vertriebskosten gehören nie dazu.',
          `${p.konto} an Aktivierte Eigenleistungen ${eur(s.hk!)}.`,
        ];
      case 'anzahlung':
        return [
          'Die Anzahlung kommt auf das Konto Geleistete Anzahlungen auf Sachanlagen, mit Vorsteuer.',
          'Bei der Schlussrechnung: volle Summe auf Anlagen im Bau, die Anzahlung im Haben ausbuchen.',
          `Vorsteuer nur noch auf den Rest: ${eur(s.rest!)} × ${pct(p.ustSatz)}.`,
        ];
      case 'fertigstellung':
        return [
          'Solange die Anlage nicht fertig ist, sammeln sich die Kosten auf Anlagen im Bau.',
          'Bei Fertigstellung wird der gesamte Bestand von Anlagen im Bau auf das Anlagekonto umgebucht.',
          `Vorjahr plus Schlussrechnung: ${eur(s.ak!)}.`,
        ];
    }
  },
  errorVariants: variants,
  verfahren: (p) =>
    p.variante === 'eigenleistung'
      ? 'Aktivierte Eigenleistung: Herstellungskosten aktivieren'
      : 'Anlagen im Bau und geleistete Anzahlungen auf Sachanlagen buchen',
});
