// B2 – Umsatzsteuer buchen: Ein- und Verkauf auf Ziel, bar oder per Bank mit Vorsteuer bzw.
// Umsatzsteuer, auch mit mehreren Positionen; Überweisung der Zahllast (Vorauszahlung) und
// Erstattung eines Vorsteuerüberhangs. Lehrbrief BA 2.3.5.3 (nur lokal gelesen, eigene Formulierung);
// Zahllast „Umsatzsteuer an Bank“ nach 04-fachregeln.md, Abschnitt 6. Spezifikation: docs/m7/b.md.
import {
  formatSatz,
  loesung,
  satz,
  zeile,
  type BuchungsLoesung,
  type ErwZeile,
} from '../../booking';
import { Val, sum } from '../../money';
import type { Rng } from '../../rng';
import type { ErrorVariant, GenOptions, SolutionStep, TaskPart, TaskText } from '../../task';
import { FIRMA } from '../../../config';
import { betrag, defineGenerator, eur, feld, isKrumm, pct } from '../base';
import {
  EINKAUF_19,
  FORDERUNGEN,
  KONTEXT_B,
  REGELSATZ,
  VERBINDLICHKEITEN,
  VERKAUF,
  faktor,
  glattBrutto,
  nettoAusBrutto,
  steuerVomBruttoFalsch,
  steuerVomNetto,
} from './gemeinsam';

export type B2Fall = 'einkauf' | 'verkauf' | 'zahllast' | 'erstattung';
export type Zahlung = 'ziel' | 'bank' | 'bar';

export interface B2Position {
  konto: string;
  text: string;
  /** Betrag laut Beleg (netto; bei `brutto` einschließlich Umsatzsteuer) */
  betrag: string;
}

export interface B2Params {
  fall: B2Fall;
  zahlung: Zahlung;
  partner: string;
  positionen: B2Position[];
  /** Nur bei genau einer Position: Betrag ist brutto angegeben */
  brutto: boolean;
  ustSatz: string;
  /** zahllast / erstattung: Betrag laut Voranmeldung */
  betrag: string;
  monat: string;
  vorlage: number;
}

export interface KontoBetrag {
  konto: string;
  betrag: Val;
}

export interface B2Solution {
  netto: Val;
  steuer: Val;
  brutto: Val;
  /** Nettobeträge je Konto (Positionen mit gleichem Konto zusammengefasst) */
  jeKonto: KontoBetrag[];
  buchung: BuchungsLoesung;
}

interface Rechenweg {
  prozentVomBrutto?: boolean;
  bruttoAlsNetto?: boolean;
}

interface Kontenwahl {
  steuerKonto?: string;
  zahlKonto?: string;
  /** Steuer nicht gebucht: Sach- bzw. Erlöskonto mit dem Bruttobetrag */
  ohneSteuer?: boolean;
  /** Anderes Erlöskonto (eigene Erzeugnisse ↔ Handelswaren) */
  erloesTausch?: boolean;
  /** Alle Positionen auf das erste Konto */
  einKonto?: boolean;
  /** zahllast/erstattung: Gegenkonto der Bank ersetzen */
  finanzamtKonto?: string;
  vertauscht?: boolean;
}

const STOFFE = new Set([
  'Rohstoffe',
  'Hilfsstoffe',
  'Betriebsstoffe',
  'Vorprodukte und Fremdbauteile',
  'Handelswaren',
]);

const ERLOES_EIGEN = 'Umsatzerlöse für eigene Erzeugnisse';
const ERLOES_HW = 'Umsatzerlöse für Handelswaren';

function istHandel(p: B2Params): boolean {
  return p.fall === 'einkauf' || p.fall === 'verkauf';
}

function jeKonto(positionen: { konto: string; netto: Val }[]): KontoBetrag[] {
  const out: KontoBetrag[] = [];
  for (const x of positionen) {
    const k = out.find((o) => o.konto === x.konto);
    if (k) k.betrag = k.betrag.plus(x.netto);
    else out.push({ konto: x.konto, betrag: x.netto });
  }
  return out;
}

export function rechneB2(p: B2Params, w: Rechenweg = {}): Omit<B2Solution, 'buchung'> {
  if (!istHandel(p)) {
    const b = new Val(p.betrag);
    return { netto: b, steuer: new Val(0), brutto: b, jeKonto: [] };
  }
  if (p.brutto) {
    const pos = p.positionen[0]!;
    const brutto = new Val(pos.betrag);
    let netto: Val;
    let steuer: Val;
    if (w.bruttoAlsNetto) {
      netto = brutto;
      steuer = steuerVomNetto(netto, p.ustSatz);
    } else if (w.prozentVomBrutto) {
      steuer = steuerVomBruttoFalsch(brutto, p.ustSatz);
      netto = brutto.minus(steuer);
    } else {
      netto = nettoAusBrutto(brutto, p.ustSatz);
      steuer = brutto.minus(netto);
    }
    return {
      netto,
      steuer,
      brutto: netto.plus(steuer),
      jeKonto: [{ konto: pos.konto, betrag: netto }],
    };
  }
  const liste = p.positionen.map((x) => ({ konto: x.konto, netto: new Val(x.betrag) }));
  const netto = sum(liste.map((x) => x.netto));
  // Die Steuer wird auf die Summe der Nettobeträge berechnet (ein Steuersatz je Rechnung).
  const steuer = steuerVomNetto(netto, p.ustSatz);
  return { netto, steuer, brutto: netto.plus(steuer), jeKonto: jeKonto(liste) };
}

function zahlKonto(p: B2Params): string {
  if (p.zahlung === 'bank') return 'Bank';
  if (p.zahlung === 'bar') return 'Kasse';
  return p.fall === 'einkauf' ? VERBINDLICHKEITEN : FORDERUNGEN;
}

/** Plausible Verwechslung des Zahlungskontos (Fehlertyp b-zahlungskonto-falsch). */
function falschesZahlKonto(p: B2Params): string {
  if (p.zahlung === 'ziel' || p.zahlung === 'bar') return 'Bank';
  return p.fall === 'einkauf' ? VERBINDLICHKEITEN : FORDERUNGEN;
}

function buchen(p: B2Params, v: Omit<B2Solution, 'buchung'>, k: Kontenwahl = {}): BuchungsLoesung {
  if (!istHandel(p)) {
    const b = v.brutto;
    const steuerKonto = p.fall === 'zahllast' ? 'Umsatzsteuer' : 'Vorsteuer';
    const fa = k.finanzamtKonto ?? steuerKonto;
    let soll: ErwZeile[] = p.fall === 'zahllast' ? [zeile(fa, b)] : [zeile('Bank', b)];
    let haben: ErwZeile[] = p.fall === 'zahllast' ? [zeile('Bank', b)] : [zeile(fa, b)];
    if (k.vertauscht) [soll, haben] = [haben, soll];
    return loesung([
      satz(
        soll,
        haben,
        p.fall === 'zahllast' ? 'Überweisung der Zahllast' : 'Erstattung des Vorsteuerüberhangs',
      ),
    ]);
  }
  const zk = k.zahlKonto ?? zahlKonto(p);
  const tausch = (konto: string) =>
    k.erloesTausch ? (konto === ERLOES_EIGEN ? ERLOES_HW : ERLOES_EIGEN) : konto;
  let sach: KontoBetrag[] = v.jeKonto.map((x) => ({ konto: tausch(x.konto), betrag: x.betrag }));
  if (k.einKonto) sach = [{ konto: sach[0]!.konto, betrag: v.netto }];
  if (k.ohneSteuer) sach = [{ konto: sach[0]!.konto, betrag: v.brutto }];
  const sachZeilen = sach.map((x) => zeile(x.konto, x.betrag));
  const steuerZeilen = k.ohneSteuer
    ? []
    : [zeile(k.steuerKonto ?? (p.fall === 'einkauf' ? 'Vorsteuer' : 'Umsatzsteuer'), v.steuer)];
  if (p.fall === 'einkauf') {
    return loesung([
      satz([...sachZeilen, ...steuerZeilen], [zeile(zk, v.brutto)], 'Eingangsrechnung'),
    ]);
  }
  return loesung([
    satz([zeile(zk, v.brutto)], [...sachZeilen, ...steuerZeilen], 'Ausgangsrechnung'),
  ]);
}

export function solveB2(p: B2Params): B2Solution {
  const v = rechneB2(p);
  return { ...v, buchung: buchen(p, v) };
}

function steuerName(p: B2Params): string {
  return p.fall === 'einkauf' ? 'Vorsteuer' : 'Umsatzsteuer';
}

function parts(p: B2Params, s: B2Solution): TaskPart[] {
  const out: TaskPart[] = [];
  if (istHandel(p) && p.brutto) {
    out.push({
      typ: 'rechenkette',
      id: 'zerlegung',
      titel: 'Bruttobetrag zerlegen',
      felder: [feld('netto', 'Nettobetrag', s.netto), feld('steuer', steuerName(p), s.steuer)],
    });
  }
  out.push({
    typ: 'buchungssatz',
    id: 'buchung',
    titel: istHandel(p)
      ? p.fall === 'einkauf'
        ? 'Buchungssatz für die Eingangsrechnung'
        : 'Buchungssatz für die Ausgangsrechnung'
      : p.fall === 'zahllast'
        ? 'Buchungssatz für die Überweisung'
        : 'Buchungssatz für die Erstattung',
    loesung: s.buchung,
  });
  return out;
}

function errorVariants(p: B2Params): ErrorVariant[] {
  const out: ErrorVariant[] = [];
  const add = (fehlertyp: string, k: Kontenwahl, w: Rechenweg = {}) => {
    const v = rechneB2(p, w);
    out.push({ fehlertyp, parts: parts(p, { ...v, buchung: buchen(p, v, k) }) });
  };
  if (p.fall === 'zahllast') {
    add('b-zahllast-als-aufwand', { finanzamtKonto: 'Betriebssteuern' });
    add('b-zahllast-ueber-vorsteuer', { finanzamtKonto: 'Vorsteuer' });
    add('soll-haben-vertauscht', { vertauscht: true });
    return out;
  }
  if (p.fall === 'erstattung') {
    add('b-erstattung-ueber-umsatzsteuer', { finanzamtKonto: 'Umsatzsteuer' });
    add('soll-haben-vertauscht', { vertauscht: true });
    return out;
  }
  const v = rechneB2(p);
  const einKonto = v.jeKonto.length === 1;
  add('steuer-falsches-konto', {
    steuerKonto: p.fall === 'einkauf' ? 'Umsatzsteuer' : 'Vorsteuer',
  });
  add('b-zahlungskonto-falsch', { zahlKonto: falschesZahlKonto(p) });
  if (einKonto) {
    add(p.fall === 'einkauf' ? 'einkauf-ohne-vorsteuer' : 'b-verkauf-ohne-umsatzsteuer', {
      ohneSteuer: true,
    });
    if (p.fall === 'verkauf') add('erloeskonto-verwechselt', { erloesTausch: true });
  } else {
    add('b-positionen-zusammengefasst', { einKonto: true });
  }
  if (p.brutto) {
    add('brutto-als-netto', {}, { bruttoAlsNetto: true });
    add('b-prozent-vom-brutto', {}, { prozentVomBrutto: true });
  }
  return out;
}

// ---------- Texte ----------

const FOLGEMONAT: Record<string, string> = {
  Januar: 'Februar',
  Februar: 'März',
  März: 'April',
};

const ZAHLUNG_EINKAUF: Record<Zahlung, string> = {
  ziel: 'Die Rechnung ist in 30 Tagen fällig (Kauf auf Ziel).',
  bank: 'Die MBG bezahlt die Rechnung sofort per Banküberweisung.',
  bar: 'Jana Kröger bezahlt sofort bar aus der Kasse.',
};

const ZAHLUNG_VERKAUF: Record<Zahlung, string> = {
  ziel: 'Der Kunde zahlt später (Verkauf auf Ziel).',
  bank: 'Der Kunde überweist den Rechnungsbetrag sofort auf das Bankkonto der MBG.',
  bar: 'Der Kunde bezahlt bar; das Geld kommt in die Kasse.',
};

function betragText(p: B2Params, pos: B2Position): string {
  return p.brutto
    ? `${eur(pos.betrag)} einschließlich ${pct(p.ustSatz)} Umsatzsteuer`
    : `${eur(pos.betrag)} netto zuzüglich ${pct(p.ustSatz)} Umsatzsteuer`;
}

function render(p: B2Params): TaskText {
  const u = pct(p.ustSatz);
  if (p.fall === 'zahllast') {
    return {
      titel: 'Zahllast überweisen',
      kontext: `${FOLGEMONAT[p.monat] ?? 'Februar'}: Umsatzsteuer-Vorauszahlung`,
      sachverhalt: [
        `Die Umsatzsteuer-Voranmeldung für ${p.monat} ergibt eine Zahllast von ${eur(p.betrag)}. Vorsteuer und Umsatzsteuer sind bereits miteinander verrechnet.`,
        p.vorlage === 0
          ? `Am 10. ${FOLGEMONAT[p.monat] ?? 'Februar'} überweist die MBG die Vorauszahlung an das Finanzamt.`
          : `Jana Kröger gibt die Überweisung an das Finanzamt am 10. ${FOLGEMONAT[p.monat] ?? 'Februar'} frei.`,
      ],
      aufgabe: 'Bilde den Buchungssatz für die Überweisung der Zahllast.',
    };
  }
  if (p.fall === 'erstattung') {
    return {
      titel: 'Erstattung vom Finanzamt',
      kontext: `${FOLGEMONAT[p.monat] ?? 'Februar'}: Umsatzsteuer-Voranmeldung`,
      sachverhalt: [
        `Wegen einer großen Investition ergab die Voranmeldung für ${p.monat} einen Vorsteuerüberhang von ${eur(p.betrag)}. Die Verrechnung ist gebucht; der Überhang steht noch auf dem Konto Vorsteuer.`,
        'Das Finanzamt überweist den Betrag auf das Bankkonto der MBG.',
      ],
      aufgabe: 'Bilde den Buchungssatz für die Erstattung.',
    };
  }
  const sachverhalt: string[] = [];
  const einkauf = p.fall === 'einkauf';
  let daten: TaskText['daten'];
  if (p.positionen.length === 1) {
    const pos = p.positionen[0]!;
    if (p.zahlung === 'bar') {
      sachverhalt.push(
        einkauf
          ? `Jana Kröger kauft bei ${p.partner} ${pos.text}. Der Kassenbon lautet auf ${betragText(p, pos)}.`
          : `Im Werksverkauf holt ${p.partner} ${pos.text} ab. Der Kassenbon lautet auf ${betragText(p, pos)}.`,
      );
    } else if (p.vorlage === 0) {
      sachverhalt.push(
        einkauf
          ? `Eingangsrechnung von ${p.partner}: ${pos.text}, ${betragText(p, pos)}.`
          : `Ausgangsrechnung der MBG an ${p.partner}: ${pos.text}, ${betragText(p, pos)}.`,
      );
    } else {
      sachverhalt.push(
        einkauf
          ? `Die MBG erhält ${pos.text} von ${p.partner}. Die Rechnung lautet auf ${betragText(p, pos)}.`
          : `Die MBG liefert ${pos.text} an ${p.partner} und berechnet ${betragText(p, pos)}.`,
      );
    }
  } else {
    sachverhalt.push(
      einkauf
        ? `Eingangsrechnung von ${p.partner} mit mehreren Positionen. Alle Beträge sind netto; auf die Summe kommen ${u} Umsatzsteuer.`
        : `Ausgangsrechnung der MBG an ${p.partner} mit mehreren Positionen. Alle Beträge sind netto; auf die Summe kommen ${u} Umsatzsteuer.`,
    );
    daten = {
      spalten: ['Position', 'Nettobetrag'],
      zeilen: p.positionen.map((x) => [x.text, eur(x.betrag)]),
    };
  }
  sachverhalt.push(einkauf ? ZAHLUNG_EINKAUF[p.zahlung] : ZAHLUNG_VERKAUF[p.zahlung]);
  if (einkauf && p.positionen.some((x) => STOFFE.has(x.konto)))
    sachverhalt.push('Werkstoffe und Handelswaren werden bestandsorientiert erfasst.');
  const t: TaskText = {
    titel: einkauf ? 'Einkauf mit Vorsteuer buchen' : 'Verkauf mit Umsatzsteuer buchen',
    kontext: KONTEXT_B,
    sachverhalt,
    aufgabe: p.brutto
      ? `Zerlege den Bruttobetrag und bilde den Buchungssatz.`
      : 'Bilde den Buchungssatz.',
  };
  if (daten) t.daten = daten;
  return t;
}

function satzText(s: B2Solution): string {
  const x = s.buchung.saetze[0];
  return x ? formatSatz(x) : '';
}

function steps(p: B2Params, s: B2Solution): SolutionStep[] {
  if (p.fall === 'zahllast') {
    return [
      {
        titel: 'Was passiert?',
        erlaeuterung:
          'Nach der Verrechnung steht die Zahllast als Schuld auf dem Konto Umsatzsteuer. Mit der Überweisung wird diese Schuld getilgt: Umsatzsteuer nimmt im Soll ab, Bank im Haben.',
      },
      { titel: 'Buchung', rechnung: satzText(s) },
    ];
  }
  if (p.fall === 'erstattung') {
    return [
      {
        titel: 'Was passiert?',
        erlaeuterung:
          'Der Vorsteuerüberhang ist eine Forderung an das Finanzamt (Saldo im Soll des Kontos Vorsteuer). Die Erstattung erhöht die Bank und gleicht die Forderung aus.',
      },
      { titel: 'Buchung', rechnung: satzText(s) },
    ];
  }
  const out: SolutionStep[] = [];
  const u = pct(p.ustSatz);
  if (p.brutto) {
    out.push({
      titel: 'Bruttobetrag zerlegen',
      rechnung: `${eur(s.brutto)} ÷ ${faktor(p.ustSatz)} = ${eur(s.netto)}; ${eur(s.brutto)} − ${eur(s.netto)} = ${eur(s.steuer)}`,
      erlaeuterung: `Der Bruttobetrag enthält die Steuer bereits. Nicht ${u} vom Bruttobetrag abziehen.`,
    });
  } else {
    out.push({
      titel: 'Steuer und Bruttobetrag',
      rechnung: `${eur(s.netto)} × ${u} = ${eur(s.steuer)}; ${eur(s.netto)} + ${eur(s.steuer)} = ${eur(s.brutto)}`,
      erlaeuterung:
        p.positionen.length > 1
          ? 'Die Steuer wird auf die Summe aller Nettobeträge berechnet.'
          : undefined,
    });
  }
  if (s.jeKonto.length > 1 || p.positionen.length > 1) {
    out.push({
      titel: 'Nettobeträge je Konto',
      rechnung: s.jeKonto.map((x) => `${x.konto} ${eur(x.betrag)}`).join('; '),
      erlaeuterung: 'Jede Position kommt auf ihr eigenes Konto; gleiche Konten werden addiert.',
    });
  }
  out.push({
    titel: 'Buchung',
    rechnung: satzText(s),
    erlaeuterung:
      p.fall === 'einkauf'
        ? 'Netto auf das Sach- bzw. Bestandskonto, die Steuer als Forderung an das Finanzamt auf Vorsteuer (Soll); der Bruttobetrag wird geschuldet bzw. bezahlt.'
        : 'Der Kunde schuldet bzw. zahlt den Bruttobetrag. Erlöse netto im Haben, die Steuer schuldet die MBG dem Finanzamt: Umsatzsteuer im Haben.',
  });
  return out.map((x) => {
    if (x.erlaeuterung === undefined) delete x.erlaeuterung;
    return x;
  });
}

function hints(p: B2Params, s: B2Solution): [string, string, string] {
  if (p.fall === 'zahllast') {
    return [
      'Auf welchem Konto steht die Zahllast nach der Verrechnung – als Schuld oder als Forderung?',
      'Eine Schuld wird durch Zahlung kleiner: Das Passivkonto nimmt im Soll ab.',
      `Umsatzsteuer an Bank ${eur(s.brutto)}.`,
    ];
  }
  if (p.fall === 'erstattung') {
    return [
      'Der Vorsteuerüberhang ist eine Forderung der MBG an das Finanzamt.',
      'Das Geld kommt auf die Bank (Soll); die Forderung auf dem Aktivkonto Vorsteuer sinkt (Haben).',
      `Bank an Vorsteuer ${eur(s.brutto)}.`,
    ];
  }
  const zk = getKurz(zahlKonto(p));
  return [
    p.fall === 'einkauf'
      ? 'Beim Einkauf entsteht Vorsteuer (Forderung an das Finanzamt, Soll). Sach- und Bestandskonten stehen netto in den Büchern.'
      : 'Beim Verkauf entsteht Umsatzsteuer (Schuld gegenüber dem Finanzamt, Haben). Umsatzerlöse stehen netto in den Büchern.',
    p.brutto
      ? `Netto = ${eur(s.brutto)} ÷ ${faktor(p.ustSatz)} = ${eur(s.netto)}; Steuer ${eur(s.steuer)}. Gezahlt bzw. geschuldet wird über ${zk}.`
      : `Steuer = ${eur(s.netto)} × ${pct(p.ustSatz)} = ${eur(s.steuer)}; Bruttobetrag ${eur(s.brutto)} über ${zk}.`,
    satzText(s),
  ];
}

function getKurz(konto: string): string {
  if (konto === VERBINDLICHKEITEN) return 'Verbindlichkeiten a. LL';
  if (konto === FORDERUNGEN) return 'Forderungen a. LL';
  return konto;
}

// ---------- Erzeugung ----------

interface Kombi {
  partner: string;
  positionen: { konto: string; text: string; min: number; max: number }[];
}

const L = FIRMA.lieferanten;

const KOMBIS_EINKAUF: readonly Kombi[] = [
  {
    partner: L.hilfsstoffe[1]!,
    positionen: [
      { konto: 'Hilfsstoffe', text: `Etiketten „${FIRMA.produkte.lemon}“`, min: 1_000, max: 8_000 },
      { konto: 'Werbung', text: 'Werbeplakate für die Sommersaison', min: 500, max: 5_000 },
      { konto: 'Büromaterial', text: 'Briefpapier mit Firmenlogo', min: 100, max: 900 },
    ],
  },
  {
    partner: L.rohstoffe[0]!,
    positionen: [
      { konto: 'Rohstoffe', text: 'Aromen', min: 2_000, max: 20_000 },
      {
        konto: 'Vorprodukte und Fremdbauteile',
        text: 'Getränkegrundstoff',
        min: 2_000,
        max: 15_000,
      },
    ],
  },
  {
    partner: L.betriebsstoffe[0]!,
    positionen: [
      { konto: 'Betriebsstoffe', text: 'Kohlensäure (CO₂)', min: 500, max: 6_000 },
      { konto: 'Fremdinstandhaltung', text: 'Wartung der CO₂-Versorgung', min: 200, max: 2_000 },
    ],
  },
  {
    partner: L.hilfsstoffe[2]!,
    positionen: [
      { konto: 'Hilfsstoffe', text: 'Kronkorken', min: 500, max: 8_000 },
      {
        konto: 'Fremdinstandhaltung',
        text: 'Austausch von Verschleißteilen am Verschließer',
        min: 300,
        max: 3_000,
      },
    ],
  },
  {
    partner: L.hilfsstoffe[0]!,
    positionen: [
      { konto: 'Hilfsstoffe', text: 'Getränkedosen 0,33 l', min: 2_000, max: 20_000 },
      { konto: 'Hilfsstoffe', text: 'Getränkedosen 0,5 l', min: 2_000, max: 20_000 },
    ],
  },
];

function wert(rng: Rng, min: number, max: number, krumm: boolean, brutto: boolean): string {
  if (krumm) return betrag(rng, min, max, 1, true);
  const netto = rng.step(min, max, max >= 2_000 ? 100 : 10);
  return brutto ? glattBrutto(netto, REGELSATZ) : String(netto);
}

function generate(rng: Rng, opts: GenOptions = {}): B2Params {
  const krumm = isKrumm(rng, opts.krummAnteil);
  const v = opts.variant;
  let fall: B2Fall;
  if (v === 'einkauf' || v === 'verkauf' || v === 'zahllast' || v === 'erstattung') fall = v;
  else if (v === 'bar' || v === 'brutto' || v === 'mehrere-positionen')
    fall = rng.chance(0.5) ? 'einkauf' : 'verkauf';
  else {
    const r = rng.next();
    fall = r < 0.45 ? 'einkauf' : r < 0.83 ? 'verkauf' : r < 0.95 ? 'zahllast' : 'erstattung';
  }
  const basis: B2Params = {
    fall,
    zahlung: 'bank',
    partner: '',
    positionen: [],
    brutto: false,
    ustSatz: REGELSATZ,
    betrag: '0',
    monat: rng.pick(['Januar', 'Februar', 'März']),
    vorlage: rng.int(0, 1),
  };
  if (fall === 'zahllast') return { ...basis, betrag: wert(rng, 2_000, 60_000, krumm, false) };
  if (fall === 'erstattung') return { ...basis, betrag: wert(rng, 1_000, 30_000, krumm, false) };

  const mehrere = v === 'mehrere-positionen' || (v === undefined && rng.chance(0.2));
  let zahlung: Zahlung;
  if (v === 'bar') zahlung = 'bar';
  else if (mehrere || v === 'brutto') zahlung = rng.chance(0.7) ? 'ziel' : 'bank';
  else {
    const r = rng.next();
    zahlung = r < 0.6 ? 'ziel' : r < 0.85 ? 'bank' : 'bar';
  }
  // Ein Kassenbon nennt immer den Bruttobetrag.
  const brutto = !mehrere && (v === 'brutto' || zahlung === 'bar' || rng.chance(0.2));

  if (mehrere) {
    if (fall === 'einkauf') {
      const k = rng.pick(KOMBIS_EINKAUF);
      const anzahl = rng.int(2, k.positionen.length);
      const positionen = k.positionen.slice(0, anzahl).map((x) => ({
        konto: x.konto,
        text: x.text,
        betrag: wert(rng, x.min, x.max, krumm, false),
      }));
      return { ...basis, zahlung, partner: k.partner, positionen };
    }
    const anzahl = rng.int(2, 3);
    const artikel = rng.shuffle(VERKAUF).slice(0, anzahl);
    return {
      ...basis,
      zahlung,
      partner: rng.pick(FIRMA.kunden),
      positionen: artikel.map((a) => ({
        konto: a.konto,
        text: a.text,
        betrag: wert(rng, 1_000, 30_000, krumm, false),
      })),
    };
  }

  if (fall === 'einkauf') {
    const auswahl = zahlung === 'bar' ? EINKAUF_19.filter((a) => a.barOk) : EINKAUF_19;
    const a = rng.pick(auswahl);
    const max = zahlung === 'bar' ? Math.min(a.max, 900) : a.max;
    const min = zahlung === 'bar' ? Math.min(a.min, 40) : a.min;
    return {
      ...basis,
      zahlung,
      brutto,
      partner: a.partner,
      positionen: [{ konto: a.konto, text: a.text, betrag: wert(rng, min, max, krumm, brutto) }],
    };
  }
  const a = rng.pick(VERKAUF);
  const [min, max] = zahlung === 'bar' ? [50, 900] : [1_000, 40_000];
  return {
    ...basis,
    zahlung,
    brutto,
    partner: rng.pick(FIRMA.kunden),
    positionen: [{ konto: a.konto, text: a.text, betrag: wert(rng, min, max, krumm, brutto) }],
  };
}

function verfahren(p: B2Params): string {
  switch (p.fall) {
    case 'zahllast':
      return 'Umsatzsteuer-Vorauszahlung (Zahllast) an das Finanzamt überweisen';
    case 'erstattung':
      return 'Erstattung eines Vorsteuerüberhangs durch das Finanzamt buchen';
    case 'einkauf':
      return p.positionen.length > 1
        ? 'Eingangsrechnung mit mehreren Positionen: jede Position auf ihr Konto, Vorsteuer in einer Summe'
        : 'Eingangsrechnung buchen: Nettobetrag auf das Sachkonto, Steuer auf Vorsteuer';
    case 'verkauf':
      if (p.positionen.length > 1)
        return 'Ausgangsrechnung mit mehreren Positionen: Erlöse je Konto, Umsatzsteuer in einer Summe';
      // gleicher Text wie D1, damit beide nicht als widersprüchliche Optionen erscheinen
      return p.positionen[0]!.konto === ERLOES_EIGEN
        ? 'Verkauf eigener Erzeugnisse: Umsatzerlöse und Umsatzsteuer buchen'
        : 'Verkauf von Handelswaren: Umsatzerlöse für Handelswaren und Umsatzsteuer buchen';
  }
}

export const ustBuchen = defineGenerator<B2Params, B2Solution>({
  skillId: 'B2-ust-buchen',
  titel: 'Umsatzsteuer buchen',
  variants: ['einkauf', 'verkauf', 'bar', 'brutto', 'mehrere-positionen', 'zahllast', 'erstattung'],
  points: 2,
  generate,
  render,
  solve: solveB2,
  parts,
  steps,
  hints,
  errorVariants,
  verfahren,
});
