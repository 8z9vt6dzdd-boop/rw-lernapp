// E1 – Kauf von Anlagegütern: Anschaffungskosten = Anschaffungspreis − Anschaffungspreisminderungen
// + Anschaffungsnebenkosten (BA 3.3/3.4.2, § 255 Abs. 1 HGB). Vorsteuer gehört nicht dazu.
// Skonto auf ein Anlagegut mindert das Anlagekonto, Nettobuchung (04-fachregeln.md, GC-05).
import { loesung, satz, zeile, type BuchungsLoesung } from '../../booking';
import { Val, dec, sum } from '../../money';
import type { Rng } from '../../rng';
import type { ErrorVariant, SolutionStep, TaskPart, ZahlFeld } from '../../task';
import { FIRMA } from '../../../config';
import { betrag, defineGenerator, eur, feld, isExact, isKrumm, pct, retry } from '../base';

export type AnlagenkaufVariante = 'kauf' | 'nebenkosten-getrennt' | 'skonto';

export interface Nebenkosten {
  art: string;
  betrag: string;
}

export interface AnlagenkaufParams {
  variante: AnlagenkaufVariante;
  /** z. B. „eine Etikettiermaschine“ */
  anlage: string;
  /** Rechnungsposition, z. B. „Etikettiermaschine“ */
  bezeichnung: string;
  konto: string;
  /** Verkäufer (Name aus config.ts oder neutrale Beschreibung) */
  verkaeufer: string;
  /** nur bei getrennter Nebenkosten-Rechnung */
  dienstleister?: string;
  listenpreis: string;
  /** Sofortrabatt auf den Listenpreis als Dezimal-String („0“ = kein Rabatt) */
  rabattSatz: string;
  nebenkosten: Nebenkosten[];
  ustSatz: string;
  skontoSatz?: string;
}

export interface AnlagenkaufSolution {
  rabatt: Val;
  anschaffungspreis: Val;
  nebenkosten: Val;
  anschaffungskosten: Val;
  vorsteuer: Val;
  rechnung: Val;
  /** getrennte Rechnung: Vorsteuer und Betrag der Nebenkosten-Rechnung */
  vorsteuerNk?: Val;
  rechnungNk?: Val;
  skontoBrutto?: Val;
  skontoNetto?: Val;
  steuerKorrektur?: Val;
  zahlbetrag?: Val;
  akEndgueltig?: Val;
  eingang: BuchungsLoesung;
  nebenkostenBuchung?: BuchungsLoesung;
  zahlung?: BuchungsLoesung;
}

const VERB = 'Verbindlichkeiten aus Lieferungen und Leistungen';
const AUFWAND_FALSCH = 'Sonstige betriebliche Aufwendungen';

interface Rechenweg {
  vorsteuerAktiviert?: boolean;
  nebenkostenAlsAufwand?: boolean;
  rabattVergessen?: boolean;
  steuerKonto?: string;
  /** Skonto: Minderung auf ein falsches Konto */
  minderungsKonto?: string;
  ohneSteuerkorrektur?: boolean;
}

export function solveAnlagenkauf(p: AnlagenkaufParams, w: Rechenweg = {}): AnlagenkaufSolution {
  const u = dec(p.ustSatz);
  const steuer = w.steuerKonto ?? 'Vorsteuer';
  const listen = new Val(p.listenpreis);
  const anschaffungspreis = w.rabattVergessen
    ? listen
    : listen.times(dec(1).minus(p.rabattSatz)).fix();
  const rabatt = listen.minus(anschaffungspreis);
  const nebenkosten = sum(p.nebenkosten.map((n) => n.betrag));
  const getrennt = p.variante === 'nebenkosten-getrennt';
  const anschaffungskosten = w.nebenkostenAlsAufwand
    ? anschaffungspreis
    : anschaffungspreis.plus(nebenkosten);
  const netto = getrennt ? anschaffungspreis : anschaffungspreis.plus(nebenkosten);
  const vorsteuer = netto.times(u).fix();
  const rechnung = netto.plus(vorsteuer);
  const akSicht = w.vorsteuerAktiviert
    ? getrennt
      ? anschaffungspreis.plus(vorsteuer).plus(nebenkosten.times(dec(1).plus(u)).fix())
      : rechnung
    : anschaffungskosten;

  // Rechnungseingang
  const sollEingang = w.vorsteuerAktiviert
    ? [zeile(p.konto, rechnung)]
    : w.nebenkostenAlsAufwand && !getrennt
      ? [
          zeile(p.konto, anschaffungspreis),
          zeile(AUFWAND_FALSCH, nebenkosten),
          zeile(steuer, vorsteuer),
        ]
      : [zeile(p.konto, netto), zeile(steuer, vorsteuer)];
  const eingang = loesung([satz(sollEingang, [zeile(VERB, rechnung)], 'Rechnungseingang')]);

  const s: AnlagenkaufSolution = {
    rabatt,
    anschaffungspreis,
    nebenkosten,
    anschaffungskosten: akSicht,
    vorsteuer,
    rechnung,
    eingang,
  };

  if (getrennt) {
    const vorsteuerNk = nebenkosten.times(u).fix();
    const rechnungNk = nebenkosten.plus(vorsteuerNk);
    const zielNk = w.nebenkostenAlsAufwand ? AUFWAND_FALSCH : p.konto;
    s.vorsteuerNk = vorsteuerNk;
    s.rechnungNk = rechnungNk;
    s.nebenkostenBuchung = loesung([
      satz(
        w.vorsteuerAktiviert
          ? [zeile(zielNk, rechnungNk)]
          : [zeile(zielNk, nebenkosten), zeile(steuer, vorsteuerNk)],
        [zeile('Bank', rechnungNk)],
        'Nebenkosten',
      ),
    ]);
  }

  if (p.variante === 'skonto' && p.skontoSatz) {
    const skontoBrutto = rechnung.times(p.skontoSatz).fix();
    const skontoNetto = w.ohneSteuerkorrektur
      ? skontoBrutto
      : skontoBrutto.div(dec(1).plus(u)).fix();
    const steuerKorrektur = skontoBrutto.minus(skontoNetto);
    const zahlbetrag = rechnung.minus(skontoBrutto);
    s.skontoBrutto = skontoBrutto;
    s.skontoNetto = skontoNetto;
    s.steuerKorrektur = steuerKorrektur;
    s.zahlbetrag = zahlbetrag;
    s.akEndgueltig = anschaffungskosten.minus(skontoNetto);
    const haben = [zeile('Bank', zahlbetrag), zeile(w.minderungsKonto ?? p.konto, skontoNetto)];
    if (!w.ohneSteuerkorrektur) haben.push(zeile(steuer, steuerKorrektur));
    s.zahlung = loesung(
      [satz([zeile(VERB, rechnung)], haben, 'Zahlung mit Skonto')],
      false,
      'Nettomethode',
    );
  }
  return s;
}

function parts(p: AnlagenkaufParams, s: AnlagenkaufSolution): TaskPart[] {
  const mitRabatt = !dec(p.rabattSatz).isZero();
  const preisFeld = feld(
    'anschaffungspreis',
    mitRabatt ? 'Anschaffungspreis (nach Abzug des Rabatts)' : 'Anschaffungspreis',
    s.anschaffungspreis,
  );
  const out: TaskPart[] = [];
  if (p.variante === 'nebenkosten-getrennt') {
    out.push(
      {
        typ: 'buchungssatz',
        id: 'eingang',
        titel: 'Buchungssatz für die Rechnung des Verkäufers',
        loesung: s.eingang,
      },
      {
        typ: 'buchungssatz',
        id: 'nebenkosten',
        titel: 'Buchungssatz für die Rechnung der Nebenkosten',
        loesung: s.nebenkostenBuchung!,
      },
      {
        typ: 'rechenkette',
        id: 'ak',
        titel: 'Anschaffungskosten',
        felder: [
          preisFeld,
          feld('nebenkosten', 'Anschaffungsnebenkosten', s.nebenkosten),
          feld('ak', 'Anschaffungskosten', s.anschaffungskosten),
        ],
      },
    );
    return out;
  }
  const felder: ZahlFeld[] = [
    preisFeld,
    feld('nebenkosten', 'Anschaffungsnebenkosten', s.nebenkosten),
    feld('ak', 'Anschaffungskosten', s.anschaffungskosten),
    feld('vorsteuer', 'Vorsteuer', s.vorsteuer),
    feld('rechnung', 'Rechnungsbetrag (brutto)', s.rechnung),
  ];
  out.push(
    { typ: 'rechenkette', id: 'ak', titel: 'Anschaffungskosten und Rechnungsbetrag', felder },
    {
      typ: 'buchungssatz',
      id: 'eingang',
      titel: 'Buchungssatz für den Rechnungseingang',
      loesung: s.eingang,
    },
  );
  if (p.variante === 'skonto') {
    out.push(
      {
        typ: 'rechenkette',
        id: 'skonto',
        titel: 'Zahlung mit Skonto',
        felder: [
          feld('skonto-brutto', 'Skonto brutto', s.skontoBrutto!),
          feld('skonto-netto', 'Skonto netto', s.skontoNetto!),
          feld('steuer', 'Vorsteuerkorrektur', s.steuerKorrektur!),
          feld('zahlbetrag', 'Überweisungsbetrag', s.zahlbetrag!),
          feld('ak-endgueltig', 'Anschaffungskosten nach Skontoabzug', s.akEndgueltig!),
        ],
      },
      {
        typ: 'buchungssatz',
        id: 'zahlung',
        titel: 'Buchungssatz für die Zahlung',
        loesung: s.zahlung!,
      },
    );
  }
  return out;
}

function variants(p: AnlagenkaufParams): ErrorVariant[] {
  const out: ErrorVariant[] = [];
  const add = (fehlertyp: string, w: Rechenweg) =>
    out.push({ fehlertyp, parts: parts(p, solveAnlagenkauf(p, w)) });
  add('vorsteuer-aktiviert', { vorsteuerAktiviert: true });
  add('nebenkosten-als-aufwand', { nebenkostenAlsAufwand: true });
  if (!dec(p.rabattSatz).isZero()) add('anlage-rabatt-vergessen', { rabattVergessen: true });
  add('steuer-falsches-konto', { steuerKonto: 'Umsatzsteuer' });
  if (p.variante === 'skonto') {
    add('nachlass-statt-anlagekonto', { minderungsKonto: 'Nachlässe für Rohstoffe' });
    add('nachlass-statt-anlagekonto', { minderungsKonto: 'Nachlässe für Hilfsstoffe' });
    add('keine-steuerkorrektur', { ohneSteuerkorrektur: true });
  }
  return out;
}

// ---------- Sachverhalte ----------

interface Vorlage {
  anlage: string;
  bezeichnung: string;
  konto: string;
  nebenkosten: string[];
  /** Listenpreis-Spanne netto in € (klausurfreundlich in Schritten von `schritt`) */
  min: number;
  max: number;
  schritt: number;
  verkaeufer: 'anlagenbau' | string;
  dienstleister: 'anlagenbau' | string;
}

const TAUM = 'Technische Anlagen und Maschinen';

const VORLAGEN: Vorlage[] = [
  {
    anlage: 'eine Etikettiermaschine',
    bezeichnung: 'Etikettiermaschine',
    konto: TAUM,
    nebenkosten: ['Transport', 'Montage'],
    min: 20_000,
    max: 120_000,
    schritt: 1_000,
    verkaeufer: 'anlagenbau',
    dienstleister: 'anlagenbau',
  },
  {
    anlage: 'einen Sirup-Lagertank',
    bezeichnung: 'Sirup-Lagertank',
    konto: TAUM,
    nebenkosten: ['Transport', 'Fundamentarbeiten'],
    min: 15_000,
    max: 80_000,
    schritt: 1_000,
    verkaeufer: 'anlagenbau',
    dienstleister: 'anlagenbau',
  },
  {
    anlage: 'eine Palettieranlage',
    bezeichnung: 'Palettieranlage',
    konto: TAUM,
    nebenkosten: ['Transport', 'Montage und Inbetriebnahme'],
    min: 40_000,
    max: 240_000,
    schritt: 1_000,
    verkaeufer: 'anlagenbau',
    dienstleister: 'anlagenbau',
  },
  {
    anlage: 'einen Auslieferungs-Lkw',
    bezeichnung: 'Auslieferungs-Lkw',
    konto: 'Fuhrpark',
    nebenkosten: ['Überführung'],
    min: 40_000,
    max: 140_000,
    schritt: 1_000,
    verkaeufer: 'einem Nutzfahrzeughändler in Paderborn',
    dienstleister: 'einem Überführungsdienst aus Lippstadt',
  },
  {
    anlage: 'Büromöbel für die Verwaltung',
    bezeichnung: 'Büromöbel (Schreibtische, Schränke)',
    konto: 'Betriebs- und Geschäftsausstattung',
    nebenkosten: ['Lieferung und Aufbau'],
    min: 3_000,
    max: 30_000,
    schritt: 100,
    verkaeufer: 'einem Büroeinrichter in Bielefeld',
    dienstleister: 'einer Spedition aus Detmold',
  },
];

function nameVon(rng: Rng, wer: string, ausser?: string): string {
  if (wer !== 'anlagenbau') return wer;
  const liste = FIRMA.lieferanten.anlagen.filter((n) => n !== ausser);
  return rng.pick(liste.length > 0 ? liste : FIRMA.lieferanten.anlagen);
}

function generate(rng: Rng, variante: AnlagenkaufVariante, krumm: boolean): AnlagenkaufParams {
  const v = rng.pick(VORLAGEN);
  const listenpreis = betrag(rng, v.min, v.max, v.schritt, krumm);
  const rabattSatz = rng.pick(['0', '0', '0.05', '0.1', '0.08']);
  const anzahl = v.nebenkosten.length === 1 ? 1 : rng.int(1, v.nebenkosten.length);
  const nkMax = Math.max(500, Math.floor(Number(listenpreis) * 0.06));
  const nebenkosten = v.nebenkosten.slice(0, anzahl).map((art) => ({
    art,
    betrag: betrag(rng, 200, nkMax, 100, krumm),
  }));
  const verkaeufer = nameVon(rng, v.verkaeufer);
  const p: AnlagenkaufParams = {
    variante,
    anlage: v.anlage,
    bezeichnung: v.bezeichnung,
    konto: v.konto,
    verkaeufer,
    listenpreis,
    rabattSatz,
    nebenkosten,
    ustSatz: '0.19',
  };
  if (variante === 'nebenkosten-getrennt')
    p.dienstleister = nameVon(rng, v.dienstleister, verkaeufer);
  if (variante === 'skonto') p.skontoSatz = rng.pick(['0.02', '0.02', '0.03', '0.025']);
  return p;
}

function nkText(p: AnlagenkaufParams): string {
  return p.nebenkosten.map((n) => `${n.art} ${eur(n.betrag)}`).join(', ');
}

function nkArten(p: AnlagenkaufParams): string {
  return p.nebenkosten.map((n) => n.art).join(' und ');
}

export const anlagenkauf = defineGenerator<AnlagenkaufParams, AnlagenkaufSolution>({
  skillId: 'E1-anlagenkauf',
  titel: 'Kauf von Anlagegütern',
  variants: ['kauf', 'nebenkosten-getrennt', 'skonto'],
  points: 5,
  generate: (rng, opts = {}) => {
    const variante =
      (opts.variant as AnlagenkaufVariante | undefined) ??
      rng.pick<AnlagenkaufVariante>(['kauf', 'kauf', 'nebenkosten-getrennt', 'skonto', 'skonto']);
    const krumm = isKrumm(rng, opts.krummAnteil);
    return retry(
      rng,
      (r) => generate(r, variante, krumm),
      (p) => {
        if (krumm) return true;
        const s = solveAnlagenkauf(p);
        return (
          isExact(new Val(p.listenpreis).times(dec(1).minus(p.rabattSatz)).exact) &&
          isExact(s.anschaffungskosten.times(p.ustSatz).exact) &&
          (!s.skontoBrutto || isExact(s.rechnung.times(p.skontoSatz!).exact)) &&
          (!s.skontoNetto || isExact(s.skontoBrutto!.div(dec(1).plus(p.ustSatz)).exact))
        );
      },
    );
  },
  render: (p) => {
    const u = pct(p.ustSatz);
    const rabatt = dec(p.rabattSatz).isZero() ? null : pct(p.rabattSatz);
    const zeilen: string[][] = [[`${p.bezeichnung}, Listenpreis`, eur(p.listenpreis)]];
    if (rabatt) zeilen.push([`abzüglich ${rabatt} Rabatt auf den Listenpreis`, '']);
    if (p.variante !== 'nebenkosten-getrennt')
      for (const n of p.nebenkosten) zeilen.push([n.art, eur(n.betrag)]);
    zeilen.push([`zuzüglich ${u} Umsatzsteuer`, '']);
    const sachverhalt: string[] = [];
    if (p.variante === 'nebenkosten-getrennt') {
      sachverhalt.push(
        `Juli im Werk Paderborn: Die MBG kauft bei ${p.verkaeufer} ${p.anlage} auf Ziel. Die Rechnung des Verkäufers steht in der Tabelle (Beträge netto).`,
        `${nkArten(p)} übernimmt ${p.dienstleister}: Rechnung über ${eur(sum(p.nebenkosten.map((n) => n.betrag)))} netto zuzüglich ${u} Umsatzsteuer, die MBG überweist sofort per Bank.`,
      );
    } else {
      sachverhalt.push(
        `Juli im Werk Paderborn: Die MBG kauft bei ${p.verkaeufer} ${p.anlage} auf Ziel. Die Eingangsrechnung steht in der Tabelle (Beträge netto).`,
      );
      if (p.variante === 'skonto')
        sachverhalt.push(
          `Die MBG begleicht die gesamte Rechnung innerhalb der Skontofrist unter Abzug von ${pct(p.skontoSatz!)} Skonto per Banküberweisung.`,
        );
    }
    return {
      titel: 'Kauf einer Anlage',
      kontext: 'Juli: neue Anlagen für das Werk',
      sachverhalt,
      daten: { spalten: ['Rechnungsposition', 'Betrag'], zeilen },
      aufgabe:
        p.variante === 'kauf'
          ? 'Ermittle die Anschaffungskosten, die Vorsteuer und den Rechnungsbetrag. Bilde den Buchungssatz für den Rechnungseingang.'
          : p.variante === 'nebenkosten-getrennt'
            ? 'Bilde die Buchungssätze für beide Rechnungen und ermittle die Anschaffungskosten.'
            : 'Ermittle Anschaffungskosten und Rechnungsbetrag und buche den Rechnungseingang. Zerlege dann den Skonto, buche die Zahlung (Nettomethode) und ermittle die endgültigen Anschaffungskosten.',
    };
  },
  solve: (p) => solveAnlagenkauf(p),
  parts,
  steps: (p, s) => {
    const u = pct(p.ustSatz);
    const steps: SolutionStep[] = [];
    if (!s.rabatt.exact.isZero()) {
      steps.push({
        titel: 'Anschaffungspreis',
        rechnung: `${eur(p.listenpreis)} − ${pct(p.rabattSatz)} Rabatt (${eur(s.rabatt)}) = ${eur(s.anschaffungspreis)}`,
        erlaeuterung:
          'Ein Sofortrabatt wird nicht gebucht, er mindert direkt den Anschaffungspreis.',
      });
    }
    steps.push({
      titel: 'Anschaffungskosten',
      rechnung: `${eur(s.anschaffungspreis)} + Nebenkosten ${eur(s.nebenkosten)} (${nkText(p)}) = ${eur(s.anschaffungskosten)}`,
      erlaeuterung:
        'Alles, was nötig ist, um die Anlage zu erwerben und betriebsbereit zu machen, wird aktiviert. Die Vorsteuer gehört nicht dazu.',
    });
    if (p.variante === 'nebenkosten-getrennt') {
      steps.push(
        {
          titel: 'Rechnung des Verkäufers',
          rechnung: `Vorsteuer ${eur(s.anschaffungspreis)} × ${u} = ${eur(s.vorsteuer)}; Verbindlichkeit ${eur(s.rechnung)}`,
        },
        {
          titel: 'Rechnung der Nebenkosten',
          rechnung: `Vorsteuer ${eur(s.nebenkosten)} × ${u} = ${eur(s.vorsteuerNk!)}; Überweisung ${eur(s.rechnungNk!)}`,
          erlaeuterung: `Auch diese Nebenkosten gehen auf das Konto ${p.konto}, nicht in den Aufwand.`,
        },
      );
    } else {
      steps.push({
        titel: 'Rechnungsbetrag',
        rechnung: `${eur(s.anschaffungskosten)} + ${u} Vorsteuer (${eur(s.vorsteuer)}) = ${eur(s.rechnung)}`,
        erlaeuterung: `Buchung: ${p.konto} und Vorsteuer an Verbindlichkeiten a. LL.`,
      });
    }
    if (p.variante === 'skonto') {
      steps.push(
        {
          titel: 'Skonto zerlegen',
          rechnung: `${eur(s.rechnung)} × ${pct(p.skontoSatz!)} = ${eur(s.skontoBrutto!)}; netto ${eur(s.skontoBrutto!)} ÷ (1 + ${u}) = ${eur(s.skontoNetto!)}; Vorsteuerkorrektur ${eur(s.steuerKorrektur!)}`,
        },
        {
          titel: 'Zahlung',
          rechnung: `Überweisung ${eur(s.rechnung)} − ${eur(s.skontoBrutto!)} = ${eur(s.zahlbetrag!)}`,
          erlaeuterung: `Der Nettoskonto mindert die Anschaffungskosten: Er wird im Haben auf ${p.konto} gebucht, nicht auf ein Nachlasskonto. Endgültige Anschaffungskosten ${eur(s.akEndgueltig!)}.`,
        },
      );
    }
    return steps;
  },
  hints: (p, s) => [
    'Schema: Anschaffungspreis − Anschaffungspreisminderungen + Anschaffungsnebenkosten = Anschaffungskosten.',
    `Die Nebenkosten (${nkArten(p)}) gehören zur Anlage. Die Vorsteuer ist kein Teil der Anschaffungskosten.`,
    p.variante === 'skonto'
      ? `Skonto vom Rechnungsbetrag ${eur(s.rechnung)} berechnen, in netto und Steuer zerlegen; der Nettoskonto steht im Haben auf ${p.konto}.`
      : `Im Soll: ${p.konto} mit ${eur(s.anschaffungskosten)} und Vorsteuer${p.variante === 'nebenkosten-getrennt' ? ', jeweils je Rechnung' : ''}.`,
  ],
  errorVariants: variants,
  verfahren: (p) =>
    p.variante === 'skonto'
      ? 'Anlagenkauf mit Skonto: Skonto mindert das Anlagekonto'
      : 'Anlagenkauf: Anschaffungskosten einschließlich Nebenkosten aktivieren',
});
