// F8 – Rückstellungen: bilden, in Anspruch nehmen (mit Mehr- oder Minderbetrag), auflösen.
// Fachliche Grundlage: BA 6.4 (§ 249 HGB); 03-aufgabentypen.md (F8). Spezifikation: docs/m7/f2.md.
import {
  formatSatz,
  loesung,
  satz,
  zeile,
  type BuchungsLoesung,
  type ErwZeile,
} from '../../booking';
import { Val, dec } from '../../money';
import type { Rng } from '../../rng';
import type {
  ErrorVariant,
  GenOptions,
  SolutionStep,
  TaskPart,
  TaskText,
  WahlPart,
} from '../../task';
import { betrag as zufallsBetrag, defineGenerator, eur, feld, isKrumm, pct, retry } from '../base';

export type F8Fall = 'bildung' | 'inanspruchnahme' | 'aufloesung';
export const F8_FAELLE: readonly F8Fall[] = ['bildung', 'inanspruchnahme', 'aufloesung'];

export type F8Anlass = 'prozess' | 'instandhaltung' | 'abschluss' | 'garantie' | 'kulanz';

/** Grund der Passivierungspflicht nach § 249 HGB (BA 6.4) */
export type F8Art = 'ungewiss' | 'instandhaltung' | 'kulanz';

export interface F8Params {
  fall: F8Fall;
  anlass: F8Anlass;
  /** Höhe der Rückstellung (netto, ohne Umsatzsteuer), Dezimal-String in € */
  rueckstellung: string;
  /** inanspruchnahme: tatsächlicher Betrag netto; sonst gleich der Rückstellung */
  tatsaechlich: string;
  ustSatz: string;
}

export type Differenz = 'Mehrbetrag' | 'Minderbetrag' | 'keine Differenz';
export const DIFFERENZEN: readonly Differenz[] = ['Mehrbetrag', 'Minderbetrag', 'keine Differenz'];

export interface F8Solution {
  art: F8Art;
  differenzArt: Differenz;
  differenz: Val;
  vorsteuer: Val;
  bank: Val;
  buchung: BuchungsLoesung;
}

interface Anlass {
  konto: string;
  art: F8Art;
  /** Rechnung im neuen Jahr enthält Umsatzsteuer */
  mitUst: boolean;
  faelle: F8Fall[];
  bereich: [number, number, number];
  bildung: (p: F8Params) => string[];
  /** Kurzer Rückblick im neuen Jahr */
  rueckblick?: string;
  spaeter?: (p: F8Params) => string;
}

const RS = 'Rückstellungen';
const BANK = 'Bank';
const VST = 'Vorsteuer';
const PFA = 'Periodenfremde Aufwendungen';
const ERTRAG = 'Erträge aus der Auflösung von Rückstellungen';
const SV = 'Sonstige Verbindlichkeiten';

const ANLAESSE: Record<F8Anlass, Anlass> = {
  prozess: {
    konto: 'Sonstige betriebliche Aufwendungen',
    art: 'ungewiss',
    mitUst: false,
    faelle: ['bildung', 'inanspruchnahme', 'aufloesung'],
    bereich: [3_000, 60_000, 500],
    bildung: (p) => [
      'Ein Gastronom hat die MBG im November auf Schadenersatz verklagt: Eine Lieferung Fassbier sei verdorben gewesen. Das Verfahren läuft noch.',
      `Die Anwältin der MBG schätzt Schadenersatz und Prozesskosten auf ${eur(p.rueckstellung)}. Die MBG erfasst solche Kosten auf dem Konto Sonstige betriebliche Aufwendungen.`,
    ],
    rueckblick:
      'Ein Gastronom hatte die MBG im Vorjahr auf Schadenersatz verklagt, weil eine Lieferung Fassbier verdorben gewesen sei.',
    spaeter: (p) =>
      dec(p.tatsaechlich).gt(0)
        ? `Im März endet der Rechtsstreit mit einem Vergleich. Die MBG überweist insgesamt ${eur(p.tatsaechlich)} (ohne Umsatzsteuer).`
        : 'Im Februar zieht der Gastronom die Klage zurück. Der MBG entstehen keine Kosten.',
  },
  instandhaltung: {
    konto: 'Fremdinstandhaltung',
    art: 'instandhaltung',
    mitUst: true,
    faelle: ['bildung', 'inanspruchnahme'],
    bereich: [2_000, 40_000, 500],
    bildung: (p) => [
      'Die fällige Generalüberholung der Abfüllanlage wurde im Dezember wegen des Weihnachtsgeschäfts verschoben. Sie wird im Februar von einer Fachfirma nachgeholt.',
      `Laut Kostenvoranschlag kostet sie ${eur(p.rueckstellung)} zuzüglich ${pct(p.ustSatz)} Umsatzsteuer.`,
    ],
    rueckblick:
      'Die fällige Generalüberholung der Abfüllanlage war im Dezember verschoben worden und wird im Februar nachgeholt.',
    spaeter: (p) =>
      `Im Februar ist die Überholung erledigt. Die Rechnung der Fachfirma lautet über ${eur(p.tatsaechlich)} zuzüglich ${pct(p.ustSatz)} Umsatzsteuer; die MBG überweist sofort.`,
  },
  abschluss: {
    konto: 'Sonstige betriebliche Aufwendungen',
    art: 'ungewiss',
    mitUst: true,
    faelle: ['bildung', 'inanspruchnahme'],
    bereich: [2_000, 20_000, 250],
    bildung: (p) => [
      'Die Steuerberatungskanzlei erstellt im neuen Jahr den Jahresabschluss der MBG für das alte Jahr. Ein genaues Honorar steht noch nicht fest.',
      `Die MBG rechnet mit ${eur(p.rueckstellung)} zuzüglich ${pct(p.ustSatz)} Umsatzsteuer und erfasst Beratungskosten auf dem Konto Sonstige betriebliche Aufwendungen.`,
    ],
    rueckblick:
      'Die Steuerberatungskanzlei hat den Jahresabschluss der MBG für das Vorjahr erstellt.',
    spaeter: (p) =>
      `Im April geht die Rechnung der Kanzlei ein: ${eur(p.tatsaechlich)} zuzüglich ${pct(p.ustSatz)} Umsatzsteuer. Die MBG überweist sofort.`,
  },
  garantie: {
    konto: 'Sonstige betriebliche Aufwendungen',
    art: 'ungewiss',
    mitUst: false,
    faelle: ['bildung'],
    bereich: [2_000, 30_000, 500],
    bildung: (p) => [
      'Im Dezember wurden Leihfässer mit undichten Ventilen an Gastronomen ausgeliefert. Die MBG ist aus Gewährleistung verpflichtet, Schäden zu ersetzen; wie viele Kunden sich melden, ist offen.',
      `Die MBG schätzt die Kosten auf ${eur(p.rueckstellung)} und erfasst sie auf dem Konto Sonstige betriebliche Aufwendungen.`,
    ],
  },
  kulanz: {
    konto: 'Sonstige betriebliche Aufwendungen',
    art: 'kulanz',
    mitUst: false,
    faelle: ['bildung'],
    bereich: [1_000, 15_000, 250],
    bildung: (p) => [
      'Ein langjähriger Großhändler beschwert sich über verblasste Etiketten – die Gewährleistungsfrist ist schon abgelaufen. Die MBG sagt trotzdem zu, die Ware im neuen Jahr kostenlos neu zu etikettieren.',
      `Sie schätzt die Kosten auf ${eur(p.rueckstellung)} und erfasst sie auf dem Konto Sonstige betriebliche Aufwendungen.`,
    ],
  },
};

export function anlassF8(p: F8Params): Anlass {
  return ANLAESSE[p.anlass];
}

interface Rechenweg {
  mitUst?: boolean;
  sonstigeVerbindlichkeit?: boolean;
  /** Differenz auf das ursprüngliche Aufwandskonto statt Periodenfremde Aufwendungen/Ertrag */
  differenzAufAufwand?: boolean;
  restStehen?: boolean;
  ohneVorsteuer?: boolean;
  art?: F8Art | 'sv';
}

export function rechneF8(p: F8Params, w: Rechenweg = {}): F8Solution {
  const a = anlassF8(p);
  const r = new Val(p.rueckstellung);
  const u = dec(p.ustSatz);
  const art = a.art;
  const leer = new Val(0);
  if (p.fall === 'bildung') {
    const vst = r.times(u).fix();
    let s;
    if (w.mitUst) s = satz([zeile(a.konto, r), zeile(VST, vst)], [zeile(RS, r.plus(vst))]);
    else if (w.sonstigeVerbindlichkeit) s = satz([zeile(a.konto, r)], [zeile(SV, r)]);
    else s = satz([zeile(a.konto, r)], [zeile(RS, r)], 'Bildung zum 31.12.');
    return {
      art,
      differenzArt: 'keine Differenz',
      differenz: leer,
      vorsteuer: leer,
      bank: leer,
      buchung: loesung([s]),
    };
  }
  if (p.fall === 'aufloesung') {
    const s = w.differenzAufAufwand
      ? satz([zeile(RS, r)], [zeile(a.konto, r)])
      : satz([zeile(RS, r)], [zeile(ERTRAG, r)], 'Auflösung');
    return {
      art,
      differenzArt: 'Minderbetrag',
      differenz: r,
      vorsteuer: leer,
      bank: leer,
      buchung: loesung([s]),
    };
  }
  // Inanspruchnahme
  const t = new Val(p.tatsaechlich);
  const vorsteuer = a.mitUst ? t.times(u).fix() : leer;
  const bank = t.plus(vorsteuer);
  // Vergleich mit der Rückstellung: ohne Vorsteuer (Fehler: brutto verglichen)
  const vergleich = w.ohneVorsteuer ? bank : t;
  const d = vergleich.minus(r);
  const differenzArt: Differenz = d.exact.isZero()
    ? 'keine Differenz'
    : d.isNegative()
      ? 'Minderbetrag'
      : 'Mehrbetrag';
  const differenz = d.abs();
  const soll: ErwZeile[] = [];
  const haben: ErwZeile[] = [zeile(BANK, bank)];
  if (w.restStehen && differenzArt === 'Minderbetrag') {
    soll.push(zeile(RS, t));
  } else {
    soll.push(zeile(RS, r));
    if (differenzArt === 'Mehrbetrag')
      soll.push(zeile(w.differenzAufAufwand ? a.konto : PFA, differenz));
    if (differenzArt === 'Minderbetrag') {
      if (w.differenzAufAufwand) haben.push(zeile(a.konto, differenz));
      else haben.push(zeile(ERTRAG, differenz));
    }
  }
  if (!w.ohneVorsteuer && !vorsteuer.value.isZero()) soll.push(zeile(VST, vorsteuer));
  return {
    art,
    differenzArt,
    differenz,
    vorsteuer,
    bank,
    buchung: loesung([satz(soll, haben, 'Inanspruchnahme')]),
  };
}

export function solveF8(p: F8Params): F8Solution {
  return rechneF8(p);
}

// ---------- Aufgabenteile ----------

const ART_OPTIONEN: { id: F8Art | 'sv'; text: string }[] = [
  { id: 'ungewiss', text: 'Rückstellung für ungewisse Verbindlichkeiten' },
  {
    id: 'instandhaltung',
    text: 'Rückstellung für unterlassene Instandhaltung (Nachholung in den ersten drei Monaten)',
  },
  {
    id: 'kulanz',
    text: 'Rückstellung für Gewährleistungen ohne rechtliche Verpflichtung (Kulanz)',
  },
  { id: 'sv', text: 'Sonstige Verbindlichkeit (Höhe und Fälligkeit stehen fest)' },
];

function artPart(p: F8Params, gewaehlt: F8Art | 'sv'): WahlPart {
  const richtig = anlassF8(p).art;
  return {
    typ: 'aufgabe-erkennen',
    id: 'art',
    frage: 'Wie ist der Sachverhalt zum 31.12. zu erfassen?',
    optionen: ART_OPTIONEN.map((o) => {
      const opt: WahlPart['optionen'][number] = {
        id: o.id,
        text: o.text,
        richtig: o.id === gewaehlt,
      };
      if (o.id !== richtig)
        opt.fehlertyp =
          o.id === 'sv' ? 'verbindlichkeit-statt-rueckstellung' : 'rueckstellungsart-falsch';
      return opt;
    }),
    begruendung:
      'Rückstellungen sind Pflicht für ungewisse Verbindlichkeiten, drohende Verluste aus schwebenden Geschäften, unterlassene Instandhaltung mit Nachholung in den ersten drei Monaten und Kulanzgewährleistungen (§ 249 HGB).',
  };
}

const AUFLOESUNG_OPTIONEN = [
  {
    id: 'ertrag',
    text: 'Rückstellung vollständig auflösen: Ertrag aus der Auflösung von Rückstellungen',
  },
  { id: 'aufwand', text: 'Rückstellung gegen das ursprüngliche Aufwandskonto ausbuchen' },
  { id: 'bleibt', text: 'Rückstellung bleibt bis zum nächsten Jahresabschluss stehen' },
];

function aufloesungPart(gewaehlt: string): WahlPart {
  return {
    typ: 'aufgabe-erkennen',
    id: 'art',
    frage: 'Der Anlass der Rückstellung ist entfallen. Was ist zu tun?',
    optionen: AUFLOESUNG_OPTIONEN.map((o) => {
      const opt: WahlPart['optionen'][number] = {
        id: o.id,
        text: o.text,
        richtig: o.id === gewaehlt,
      };
      if (o.id === 'aufwand') opt.fehlertyp = 'differenz-falsch-gebucht';
      if (o.id === 'bleibt') opt.fehlertyp = 'rueckstellung-rest-nicht-aufgeloest';
      return opt;
    }),
    begruendung:
      'Eine Rückstellung wird aufgelöst, sobald ihr Grund entfallen ist. Der Aufwand wurde im alten Jahr gebucht; im neuen Jahr entsteht deshalb ein Ertrag.',
  };
}

export function partsF8(p: F8Params, s: F8Solution, gewaehlt?: string): TaskPart[] {
  const buchung: TaskPart = {
    typ: 'buchungssatz',
    id: 'buchung',
    titel:
      p.fall === 'bildung'
        ? 'Buchungssatz zum 31.12.'
        : p.fall === 'aufloesung'
          ? 'Buchungssatz für die Auflösung'
          : 'Buchungssatz für die Inanspruchnahme',
    loesung: s.buchung,
  };
  if (p.fall === 'bildung')
    return [artPart(p, (gewaehlt as F8Art | 'sv' | undefined) ?? s.art), buchung];
  if (p.fall === 'aufloesung') return [aufloesungPart(gewaehlt ?? 'ertrag'), buchung];
  const felder = [
    {
      typ: 'auswahl' as const,
      id: 'differenz-art',
      label: 'Vergleich mit der Rückstellung',
      optionen: [...DIFFERENZEN],
      soll: s.differenzArt,
    },
    feld('differenz', 'Differenz', s.differenz),
  ];
  if (anlassF8(p).mitUst) felder.push(feld('vorsteuer', 'Vorsteuer', s.vorsteuer));
  felder.push(feld('bank', 'Überweisungsbetrag', s.bank));
  return [
    { typ: 'rechenkette', id: 'vergleich', titel: 'Rückstellung und Zahlung vergleichen', felder },
    buchung,
  ];
}

// ---------- Erzeugen und Texte ----------

export function generateF8(rng: Rng, opts: GenOptions = {}): F8Params {
  const fall: F8Fall = (F8_FAELLE as readonly string[]).includes(opts.variant ?? '')
    ? (opts.variant as F8Fall)
    : rng.pick(['bildung', 'bildung', 'inanspruchnahme', 'inanspruchnahme', 'aufloesung'] as const);
  const krumm = isKrumm(rng, opts.krummAnteil);
  const moeglich = (Object.keys(ANLAESSE) as F8Anlass[]).filter((k) =>
    ANLAESSE[k].faelle.includes(fall),
  );
  const anlass = rng.pick(moeglich);
  const [min, max, step] = ANLAESSE[anlass].bereich;
  const rueckstellung = krumm
    ? zufallsBetrag(rng, min, max, 1, true)
    : String(rng.step(min, max, step));
  let tatsaechlich = rueckstellung;
  if (fall === 'inanspruchnahme' && !rng.chance(0.15)) {
    tatsaechlich = retry(
      rng,
      (r) => {
        const f = r.pick(['0.7', '0.8', '0.85', '0.9', '1.1', '1.15', '1.2', '1.25']);
        const t = dec(rueckstellung).times(f);
        return krumm
          ? t.toDecimalPlaces(2).toFixed(2)
          : t.div(50).toDecimalPlaces(0).times(50).toFixed(2);
      },
      (t) => !dec(t).equals(rueckstellung),
    );
  }
  if (fall === 'aufloesung') tatsaechlich = '0';
  return { fall, anlass, rueckstellung, tatsaechlich, ustSatz: '0.19' };
}

export function renderF8(p: F8Params): TaskText {
  const a = anlassF8(p);
  if (p.fall === 'bildung') {
    return {
      titel: 'Rückstellungen',
      kontext: '31. Dezember: Abschlussbuchungen',
      sachverhalt: a.bildung(p),
      aufgabe:
        'Bestimme, wie der Sachverhalt zum 31.12. zu erfassen ist, und bilde den Buchungssatz.',
    };
  }
  const vorjahr = `Zum 31.12. des Vorjahres hat die MBG dafür eine Rückstellung von ${eur(p.rueckstellung)} gebildet.`;
  return {
    titel: 'Rückstellungen',
    kontext: 'Neues Geschäftsjahr: Rückstellung aus dem Vorjahr',
    sachverhalt: [a.rueckblick!, vorjahr, a.spaeter!(p)],
    aufgabe:
      p.fall === 'aufloesung'
        ? 'Entscheide, was mit der Rückstellung geschieht, und bilde den Buchungssatz.'
        : 'Vergleiche die Zahlung mit der Rückstellung und bilde den Buchungssatz für die Zahlung.',
  };
}

export function stepsF8(p: F8Params, s: F8Solution): SolutionStep[] {
  const a = anlassF8(p);
  if (p.fall === 'bildung') {
    return [
      {
        titel: 'Grund',
        ergebnis: ART_OPTIONEN.find((o) => o.id === s.art)!.text,
        erlaeuterung:
          'Der Aufwand gehört ins alte Jahr, seine Höhe (und meist der Zeitpunkt) ist aber noch ungewiss.',
      },
      {
        titel: 'Buchung',
        rechnung: `${a.konto} an Rückstellungen ${eur(p.rueckstellung)}`,
        erlaeuterung: a.mitUst
          ? 'Ohne Umsatzsteuer: Vorsteuer gibt es erst mit der Rechnung im neuen Jahr.'
          : 'Der Aufwand mindert schon im alten Jahr den Gewinn.',
      },
    ];
  }
  if (p.fall === 'aufloesung') {
    return [
      {
        titel: 'Auflösung',
        rechnung: `Rückstellungen an Erträge aus der Auflösung von Rückstellungen ${eur(p.rueckstellung)}`,
        erlaeuterung:
          'Der Grund ist entfallen. Der Aufwand des Vorjahres war zu hoch – im neuen Jahr entsteht ein Ertrag.',
      },
    ];
  }
  const steps: SolutionStep[] = [
    {
      titel: 'Vergleich',
      rechnung: `${eur(p.tatsaechlich)} (netto) − ${eur(p.rueckstellung)} → ${s.differenzArt}${
        s.differenz.value.isZero() ? '' : ` ${eur(s.differenz)}`
      }`,
      erlaeuterung: 'Verglichen wird der Nettobetrag der Rechnung mit der Rückstellung.',
    },
  ];
  if (a.mitUst)
    steps.push({
      titel: 'Vorsteuer',
      rechnung: `${eur(p.tatsaechlich)} × ${pct(p.ustSatz)} = ${eur(s.vorsteuer)}`,
    });
  steps.push({
    titel: 'Buchung',
    rechnung: formatSatz(s.buchung.saetze[0]!),
    erlaeuterung:
      s.differenzArt === 'Mehrbetrag'
        ? 'Der Mehrbetrag betrifft das alte Jahr, wird aber erst jetzt bekannt: periodenfremder Aufwand.'
        : s.differenzArt === 'Minderbetrag'
          ? 'Die Rückstellung wird ganz ausgebucht; der nicht benötigte Teil ist ein Ertrag aus der Auflösung.'
          : 'Die Rückstellung deckt die Zahlung genau.',
  });
  return steps;
}

export function hintsF8(p: F8Params, s: F8Solution): [string, string, string] {
  const a = anlassF8(p);
  if (p.fall === 'bildung')
    return [
      'Steht die Höhe fest? Wenn nicht, ist das ein Fall für eine Rückstellung.',
      'Gebucht wird auf das Aufwandskonto im Soll – die Umsatzsteuer bleibt außen vor.',
      `${a.konto} an Rückstellungen ${eur(p.rueckstellung)}.`,
    ];
  if (p.fall === 'aufloesung')
    return [
      'Der Anlass ist weggefallen: Die Rückstellung wird nicht mehr gebraucht.',
      'Der Aufwand wurde im Vorjahr gebucht. Wird er nicht fällig, entsteht jetzt ein Ertrag.',
      `Rückstellungen an Erträge aus der Auflösung von Rückstellungen ${eur(p.rueckstellung)}.`,
    ];
  return [
    'Vergleiche den Nettobetrag der Zahlung mit der Rückstellung.',
    'Mehrbetrag: Periodenfremde Aufwendungen. Minderbetrag: Erträge aus der Auflösung von Rückstellungen.',
    a.mitUst
      ? `Die Rückstellung wird ganz ausgebucht (${eur(p.rueckstellung)}); die Vorsteuer (${eur(s.vorsteuer)}) kommt zusätzlich ins Soll.`
      : `Die Rückstellung wird ganz ausgebucht (${eur(p.rueckstellung)}); Bank ${eur(s.bank)} im Haben.`,
  ];
}

export function variantsF8(p: F8Params): ErrorVariant[] {
  const out: ErrorVariant[] = [];
  const add = (fehlertyp: string, w: Rechenweg, gewaehlt?: string) =>
    out.push({ fehlertyp, parts: partsF8(p, rechneF8(p, w), gewaehlt) });
  const a = anlassF8(p);
  if (p.fall === 'bildung') {
    if (a.mitUst) add('rueckstellung-mit-ust', { mitUst: true });
    add('verbindlichkeit-statt-rueckstellung', { sonstigeVerbindlichkeit: true }, 'sv');
    const falscheArt = (['ungewiss', 'instandhaltung', 'kulanz'] as const).find(
      (x) => x !== a.art,
    )!;
    add('rueckstellungsart-falsch', {}, falscheArt);
    return out;
  }
  if (p.fall === 'aufloesung') {
    add('differenz-falsch-gebucht', { differenzAufAufwand: true }, 'aufwand');
    return out;
  }
  const s = solveF8(p);
  if (s.differenzArt !== 'keine Differenz')
    add('differenz-falsch-gebucht', { differenzAufAufwand: true });
  if (s.differenzArt === 'Minderbetrag')
    add('rueckstellung-rest-nicht-aufgeloest', { restStehen: true });
  if (a.mitUst) add('vorsteuer-bei-inanspruchnahme-vergessen', { ohneVorsteuer: true });
  return out;
}

const VERFAHREN: Record<F8Fall, string> = {
  bildung: 'Rückstellung bilden: Aufwand an Rückstellungen (ohne Umsatzsteuer)',
  inanspruchnahme: 'Rückstellung in Anspruch nehmen: Differenz periodenfremd bzw. als Ertrag',
  aufloesung: 'Rückstellung auflösen: Ertrag aus der Auflösung von Rückstellungen',
};

export const rueckstellungen = defineGenerator<F8Params, F8Solution>({
  skillId: 'F8-rueckstellungen',
  titel: 'Rückstellungen',
  variants: [...F8_FAELLE],
  points: 3,
  generate: generateF8,
  render: (p) => renderF8(p),
  solve: solveF8,
  parts: (p, s) => partsF8(p, s),
  steps: stepsF8,
  hints: hintsF8,
  errorVariants: variantsF8,
  verfahren: (p) => VERFAHREN[p.fall],
});
