// K5 – Preisuntergrenze und Zusatzauftrag (Teilkostenrechnung, Kulisse MBG Paderborn).
// Spezifikation und Golden Cases: docs/m7/k2.md (GC-22 aus docs/04-fachregeln.md).
import { Val, dec } from '../../money';
import type { Rng } from '../../rng';
import type { ErrorVariant, Feld, SolutionStep, TaskPart } from '../../task';
import { defineGenerator, eur, feld, isExact, isKrumm, plain, retry } from '../base';
import { einheitVon, wahlPart, type WahlText } from './common';

export type PugVariante = 'zusatzauftrag' | 'kurz-lang' | 'verdraengung';

export interface PugParams {
  variante: PugVariante;
  produkt: string;
  /** variable Kosten je Stück (Dezimal-String) */
  kv: string;
  /** Fixkosten je Monat */
  kf: string;
  /** Kapazität der Abfüllanlage je Monat (Stück) */
  kapazitaet: number;
  /** laufende Produktions- und Absatzmenge je Monat (Stück) */
  menge: number;
  /** laufender Verkaufspreis je Stück */
  preis: string;
  /** Zusatzauftrag bzw. Angebot: Menge und Preis je Stück */
  zusatzMenge: number;
  zusatzPreis: string;
}

export type PugEntscheidung =
  | 'annehmen-kv'
  | 'ablehnen-vk'
  | 'ablehnen-kv'
  | 'annehmen-verdr'
  | 'ablehnen-verdr'
  | 'lang'
  | 'kurz'
  | 'unter-kv';

export interface PugSolution {
  /** kurzfristige (absolute) Preisuntergrenze = variable Stückkosten */
  kurzPug: Val;
  fixJeStueck: Val;
  /** langfristige Preisuntergrenze = variable Stückkosten + fixe Stückkosten (Selbstkosten) */
  langPug: Val;
  freieKapazitaet: number;
  verdraengt: number;
  dbJeStueck: Val;
  dbZusatz: Val;
  entgangenerDb: Val;
  ergebnis: Val;
  /** Preisuntergrenze des Zusatzauftrags bei Verdrängung */
  pugAuftrag: Val;
  entscheidung: PugEntscheidung;
}

export interface PugWeg {
  /** typischer Fehler: Selbstkosten (Vollkosten) als kurzfristige Preisuntergrenze */
  vollkosten?: boolean;
  /** typischer Fehler: verdrängte Normalmenge übersehen */
  verdraengungIgnoriert?: boolean;
}

export function solvePug(p: PugParams, w: PugWeg = {}): PugSolution {
  const kv = new Val(p.kv);
  const fixJeStueck = new Val(p.kf).div(p.menge).round();
  const langPug = kv.plus(fixJeStueck);
  const kurzPug = w.vollkosten ? langPug : kv;
  const freieKapazitaet = p.kapazitaet - p.menge;
  const verdraengt =
    p.variante === 'verdraengung' && !w.verdraengungIgnoriert
      ? Math.max(0, p.zusatzMenge - freieKapazitaet)
      : 0;
  const dbJeStueck = new Val(p.zusatzPreis).minus(kurzPug);
  const dbZusatz = dbJeStueck.times(p.zusatzMenge).round();
  const dbNormal = new Val(p.preis).minus(kv);
  const entgangenerDb = dbNormal.times(verdraengt).round();
  const ergebnis = dbZusatz.minus(entgangenerDb);
  const pugAuftrag = kurzPug.plus(entgangenerDb.div(p.zusatzMenge).round());

  let entscheidung: PugEntscheidung;
  const zp = dec(p.zusatzPreis);
  if (p.variante === 'kurz-lang') {
    if (zp.lt(kurzPug.stepped)) entscheidung = 'unter-kv';
    else if (zp.lt(langPug.stepped)) entscheidung = 'kurz';
    else entscheidung = 'lang';
  } else if (p.variante === 'zusatzauftrag') {
    if (w.vollkosten) entscheidung = zp.lt(langPug.stepped) ? 'ablehnen-vk' : 'annehmen-kv';
    else entscheidung = zp.gt(kv.stepped) ? 'annehmen-kv' : 'ablehnen-kv';
  } else if (w.vollkosten) {
    entscheidung = 'ablehnen-vk';
  } else if (w.verdraengungIgnoriert) {
    entscheidung = zp.gt(kv.stepped) ? 'annehmen-kv' : 'ablehnen-kv';
  } else {
    entscheidung = ergebnis.isNegative() ? 'ablehnen-verdr' : 'annehmen-verdr';
  }
  return {
    kurzPug,
    fixJeStueck,
    langPug,
    freieKapazitaet,
    verdraengt,
    dbJeStueck,
    dbZusatz,
    entgangenerDb,
    ergebnis,
    pugAuftrag,
    entscheidung,
  };
}

const OPT_ZUSATZ: WahlText[] = [
  {
    id: 'annehmen-kv',
    text: 'Annehmen: Der Preis liegt über den variablen Stückkosten, die Fixkosten fallen ohnehin an.',
  },
  {
    id: 'ablehnen-vk',
    text: 'Ablehnen: Der Preis liegt unter den Selbstkosten je Stück.',
    erklaerung:
      'Die Fixkosten fallen auch ohne den Auftrag an. Kurzfristig zählt nur, ob der Preis die variablen Stückkosten übersteigt.',
  },
  {
    id: 'ablehnen-kv',
    text: 'Ablehnen: Der Preis deckt nicht einmal die variablen Stückkosten.',
    erklaerung: 'Vergleiche den angebotenen Preis noch einmal mit den variablen Stückkosten.',
  },
];

const OPT_VERDR: WahlText[] = [
  {
    id: 'annehmen-verdr',
    text: 'Annehmen: Auch nach Abzug des entgangenen Deckungsbeitrags verbessert sich das Ergebnis.',
    erklaerung:
      'Rechne nach: Der entgangene Deckungsbeitrag der verdrängten Menge ist größer als der Deckungsbeitrag des Zusatzauftrags.',
  },
  {
    id: 'ablehnen-verdr',
    text: 'Ablehnen: Der entgangene Deckungsbeitrag der verdrängten Menge ist größer als der zusätzliche Deckungsbeitrag.',
    erklaerung:
      'Rechne nach: Der Deckungsbeitrag des Zusatzauftrags ist größer als das, was durch die Verdrängung verloren geht.',
  },
  {
    id: 'annehmen-kv',
    text: 'Annehmen: Der Preis liegt über den variablen Stückkosten.',
    erklaerung:
      'Die freie Kapazität reicht nicht. Ein Teil der normalen Verkäufe fällt weg, deren Deckungsbeitrag muss mit eingerechnet werden.',
  },
  {
    id: 'ablehnen-vk',
    text: 'Ablehnen: Der Preis liegt unter den Selbstkosten je Stück.',
    erklaerung:
      'Die Fixkosten fallen ohnehin an. Entscheidend sind die variablen Kosten und der Deckungsbeitrag, der durch die Verdrängung verloren geht.',
  },
];

const OPT_KURZLANG: WahlText[] = [
  {
    id: 'lang',
    text: 'Der Preis deckt alle Kosten: Er liegt auch über der langfristigen Preisuntergrenze.',
  },
  {
    id: 'kurz',
    text: 'Der Preis deckt die variablen Kosten und einen Teil der Fixkosten: kurzfristig vertretbar, auf Dauer nicht.',
  },
  {
    id: 'unter-kv',
    text: 'Der Preis deckt nicht einmal die variablen Kosten: Jedes verkaufte Stück verschlechtert das Ergebnis.',
  },
];

function fehlwegeVon(p: PugParams): { fehlertyp: string; optionId: string }[] {
  const out = [
    {
      fehlertyp: 'vollkosten-als-untergrenze',
      optionId: solvePug(p, { vollkosten: true }).entscheidung,
    },
  ];
  if (p.variante === 'verdraengung') {
    out.push({
      fehlertyp: 'verdraengung-ignoriert',
      optionId: solvePug(p, { verdraengungIgnoriert: true }).entscheidung,
    });
  }
  return out;
}

function partsPug(p: PugParams, s: PugSolution, fehlwege = fehlwegeVon(p)): TaskPart[] {
  const { ein } = einheitVon(p.produkt);
  const je = `€/${ein}`;
  let felder: Feld[];
  let frage: string;
  let optionen: WahlText[];
  if (p.variante === 'kurz-lang') {
    felder = [
      feld('kurz', 'Kurzfristige Preisuntergrenze', s.kurzPug, 'betrag', je),
      feld('fix', `Fixkosten je ${ein}`, s.fixJeStueck, 'betrag', je),
      feld('lang', 'Langfristige Preisuntergrenze', s.langPug, 'betrag', je),
    ];
    frage = `Wie ist der angebotene Preis von ${eur(p.zusatzPreis)} je ${ein} zu beurteilen?`;
    optionen = OPT_KURZLANG;
  } else if (p.variante === 'zusatzauftrag') {
    felder = [
      feld('frei', 'Freie Kapazität', s.freieKapazitaet, 'menge', `${einheitVon(p.produkt).mehr}`),
      feld('pug', 'Kurzfristige Preisuntergrenze', s.kurzPug, 'betrag', je),
      feld('db', `Deckungsbeitrag je ${ein} des Zusatzauftrags`, s.dbJeStueck, 'betrag', je),
      feld('ergebnis', 'Veränderung des Betriebsergebnisses', s.ergebnis),
    ];
    frage = 'Soll die MBG den Zusatzauftrag annehmen?';
    optionen = OPT_ZUSATZ;
  } else {
    const mehr = einheitVon(p.produkt).mehr;
    felder = [
      feld('frei', 'Freie Kapazität', s.freieKapazitaet, 'menge', mehr),
      feld('verdraengt', 'Verdrängte Normalmenge', s.verdraengt, 'menge', mehr),
      feld('dbzusatz', 'Deckungsbeitrag des Zusatzauftrags', s.dbZusatz),
      feld('entgangen', 'Entgangener Deckungsbeitrag', s.entgangenerDb),
      feld('ergebnis', 'Veränderung des Betriebsergebnisses', s.ergebnis),
      feld('pug', 'Preisuntergrenze des Zusatzauftrags', s.pugAuftrag, 'betrag', je),
    ];
    frage = 'Soll die MBG den Zusatzauftrag annehmen?';
    optionen = OPT_VERDR;
  }
  return [
    { typ: 'rechenkette', id: 'rechnung', titel: 'Rechnung', felder },
    wahlPart('mc', 'entscheidung', frage, optionen, s.entscheidung, fehlwege),
  ];
}

const PRODUKTE = [
  'Paderquell Energy 0,33 l',
  'Senne Lemon 0,33 l',
  'Almeblick Tequila-Bier 0,33 l',
];

function erzeuge(rng: Rng, variante: PugVariante, krumm: boolean): PugParams {
  const produkt = rng.pick(PRODUKTE);
  const kv = dec(rng.step(30, 70, krumm ? 1 : 5)).div(100);
  const menge = rng.step(400_000, 1_500_000, 50_000);
  const fix = dec(rng.step(10, 40, krumm ? 1 : 5)).div(100);
  const kf = fix.times(menge);
  const vk = kv.plus(fix);
  const preis = vk.plus(dec(rng.step(5, 30, 5)).div(100));
  if (variante === 'kurz-lang') {
    const klasse = rng.pick(['lang', 'kurz', 'kurz', 'unter']);
    const zp =
      klasse === 'lang'
        ? vk.plus(dec(rng.int(1, 10)).div(100))
        : klasse === 'kurz'
          ? kv.plus(dec(rng.int(1, Math.max(1, fix.times(100).toNumber() - 1))).div(100))
          : kv.minus(dec(rng.int(1, 8)).div(100));
    return {
      variante,
      produkt,
      kv: kv.toString(),
      kf: kf.toFixed(2),
      kapazitaet: menge + rng.step(100_000, 400_000, 50_000),
      menge,
      preis: preis.toString(),
      zusatzMenge: rng.step(20_000, 200_000, 10_000),
      zusatzPreis: zp.toString(),
    };
  }
  if (variante === 'zusatzauftrag') {
    const frei = rng.step(100_000, 500_000, 50_000);
    const zusatzMenge = rng.step(50_000, frei, 10_000);
    const zp = kv.plus(dec(rng.int(1, Math.max(1, fix.times(100).toNumber() - 1))).div(100));
    return {
      variante,
      produkt,
      kv: kv.toString(),
      kf: kf.toFixed(2),
      kapazitaet: menge + frei,
      menge,
      preis: preis.toString(),
      zusatzMenge,
      zusatzPreis: zp.toString(),
    };
  }
  // Verdrängung: freie Kapazität reicht nicht für den ganzen Zusatzauftrag.
  const frei = rng.step(20_000, 200_000, 10_000);
  const zusatzMenge = frei + rng.step(10_000, 150_000, 10_000);
  const zp = kv.plus(
    dec(rng.int(2, Math.max(2, preis.minus(kv).times(100).toNumber() - 1))).div(100),
  );
  return {
    variante,
    produkt,
    kv: kv.toString(),
    kf: kf.toFixed(2),
    kapazitaet: menge + frei,
    menge,
    preis: preis.toString(),
    zusatzMenge,
    zusatzPreis: zp.toString(),
  };
}

export const preisuntergrenze = defineGenerator<PugParams, PugSolution>({
  skillId: 'K5-preisuntergrenze',
  titel: 'Preisuntergrenze und Zusatzauftrag',
  variants: ['zusatzauftrag', 'kurz-lang', 'verdraengung'],
  points: 6,
  generate: (rng, opts = {}) => {
    const krumm = isKrumm(rng, opts.krummAnteil);
    const variante =
      (opts.variant as PugVariante | undefined) ??
      rng.pick<PugVariante>(['zusatzauftrag', 'zusatzauftrag', 'kurz-lang', 'verdraengung']);
    return retry(
      rng,
      (r) => erzeuge(r, variante, krumm),
      (p) => {
        const s = solvePug(p);
        if (s.ergebnis.exact.isZero()) return false;
        if (p.variante === 'zusatzauftrag') {
          // Der Preis liegt zwischen variablen Kosten und Selbstkosten: genau dort wirkt die Falle.
          if (!(dec(p.zusatzPreis).gt(p.kv) && dec(p.zusatzPreis).lt(s.langPug.exact)))
            return false;
        }
        if (p.variante === 'kurz-lang') {
          const zp = dec(p.zusatzPreis);
          if (zp.equals(s.kurzPug.exact) || zp.equals(s.langPug.exact) || zp.lte(0)) return false;
        }
        if (p.variante === 'verdraengung') {
          if (!(s.verdraengt > 0 && s.verdraengt < p.zusatzMenge)) return false;
          if (!dec(p.zusatzPreis).lt(p.preis)) return false;
          if (!isExact(s.entgangenerDb.exact.div(p.zusatzMenge))) return false;
        }
        return true;
      },
    );
  },
  render: (p) => {
    const { ein, mehr } = einheitVon(p.produkt);
    const s = solvePug(p);
    const basis = [
      `Die MBG verkauft im Monat ${plain(p.menge)} ${mehr} ${p.produkt} zu ${eur(p.preis)} je ${ein}. Die Abfüllanlage schafft höchstens ${plain(p.kapazitaet)} ${mehr} im Monat.`,
      `Variable Kosten: ${eur(p.kv)} je ${ein}. Fixkosten: ${eur(p.kf)} im Monat.`,
    ];
    if (p.variante === 'kurz-lang') {
      return {
        titel: 'Kurz- und langfristige Preisuntergrenze',
        kontext: 'Teilkostenrechnung: Sortimentsentscheidungen',
        sachverhalt: [
          ...basis,
          `Ein Getränkegroßhändler fragt, ob die MBG ihm ${plain(p.zusatzMenge)} ${mehr} für ${eur(p.zusatzPreis)} je ${ein} liefern würde.`,
        ],
        aufgabe:
          'Ermittle die kurzfristige und die langfristige Preisuntergrenze je Stück (Fixkosten auf die laufende Menge verteilt) und beurteile den angebotenen Preis.',
      };
    }
    const sachverhalt = [
      ...basis,
      `Die Kalkulation im Controlling weist Selbstkosten von ${eur(s.langPug)} je ${ein} aus.`,
      `Ein Discounter möchte zusätzlich ${plain(p.zusatzMenge)} ${mehr} als Eigenmarke für ${eur(p.zusatzPreis)} je ${ein}. Die variablen Kosten der Eigenmarke entsprechen denen der eigenen Sorte.`,
    ];
    if (p.variante === 'verdraengung') {
      sachverhalt.push(
        `Reicht die freie Kapazität nicht, fallen normale Verkäufe zu ${eur(p.preis)} je ${ein} weg. Die Fixkosten ändern sich nicht.`,
      );
      return {
        titel: 'Zusatzauftrag bei knapper Kapazität',
        kontext: 'Teilkostenrechnung: Eigenmarke für einen Discounter',
        sachverhalt,
        aufgabe:
          'Ermittle freie Kapazität, verdrängte Menge, den zusätzlichen und den entgangenen Deckungsbeitrag, die Veränderung des Betriebsergebnisses und die Preisuntergrenze des Auftrags. Entscheide.',
      };
    }
    sachverhalt.push(
      'Die laufenden Verkäufe sind davon nicht berührt. Die Fixkosten ändern sich nicht.',
    );
    return {
      titel: 'Zusatzauftrag: Eigenmarke für einen Discounter',
      kontext: 'Teilkostenrechnung: Eigenmarke für einen Discounter',
      sachverhalt,
      aufgabe:
        'Prüfe die freie Kapazität, ermittle die kurzfristige Preisuntergrenze, den Deckungsbeitrag je Stück und die Veränderung des Betriebsergebnisses. Soll die MBG annehmen?',
    };
  },
  solve: (p) => solvePug(p),
  parts: (p, s) => partsPug(p, s),
  steps: (p, s) => {
    const { ein, mehr } = einheitVon(p.produkt);
    if (p.variante === 'kurz-lang') {
      return [
        {
          titel: 'Kurzfristige Preisuntergrenze',
          ergebnis: eur(s.kurzPug),
          erlaeuterung:
            'Sie entspricht den variablen Stückkosten. Auf die Deckung der Fixkosten wird vorübergehend verzichtet.',
        },
        {
          titel: `Fixkosten je ${ein}`,
          rechnung: `${eur(p.kf)} ÷ ${plain(p.menge)} = ${eur(s.fixJeStueck)}`,
        },
        {
          titel: 'Langfristige Preisuntergrenze',
          rechnung: `${eur(s.kurzPug)} + ${eur(s.fixJeStueck)} = ${eur(s.langPug)}`,
          erlaeuterung:
            'Auf Dauer muss der Preis alle Kosten decken, also die Selbstkosten je Stück.',
        },
        {
          titel: 'Beurteilung',
          erlaeuterung: OPT_KURZLANG.find((o) => o.id === s.entscheidung)!.text,
        },
      ];
    }
    const steps: SolutionStep[] = [
      {
        titel: 'Kapazität prüfen',
        rechnung: `${plain(p.kapazitaet)} − ${plain(p.menge)} = ${plain(s.freieKapazitaet)} ${mehr} frei`,
        erlaeuterung:
          s.verdraengt > 0
            ? `Der Auftrag braucht ${plain(p.zusatzMenge)} ${mehr}. ${plain(s.verdraengt)} ${mehr} der normalen Verkäufe werden verdrängt.`
            : `Der Auftrag über ${plain(p.zusatzMenge)} ${mehr} passt in die freie Kapazität.`,
      },
      {
        titel: 'Kurzfristige Preisuntergrenze',
        ergebnis: eur(s.kurzPug),
        erlaeuterung: `Die variablen Stückkosten. Die Selbstkosten von ${eur(s.langPug)} enthalten Fixkosten, die ohnehin anfallen.`,
      },
      {
        titel: 'Deckungsbeitrag des Zusatzauftrags',
        rechnung: `(${eur(p.zusatzPreis)} − ${eur(s.kurzPug)}) × ${plain(p.zusatzMenge)} = ${eur(s.dbZusatz)}`,
      },
    ];
    if (p.variante === 'verdraengung') {
      steps.push(
        {
          titel: 'Entgangener Deckungsbeitrag',
          rechnung: `(${eur(p.preis)} − ${eur(p.kv)}) × ${plain(s.verdraengt)} = ${eur(s.entgangenerDb)}`,
          erlaeuterung: 'Die verdrängten normalen Verkäufe hätten diesen Deckungsbeitrag gebracht.',
        },
        {
          titel: 'Preisuntergrenze des Auftrags',
          rechnung: `${eur(s.kurzPug)} + ${eur(s.entgangenerDb)} ÷ ${plain(p.zusatzMenge)} = ${eur(s.pugAuftrag)}`,
          erlaeuterung:
            'Variable Stückkosten plus entgangener Deckungsbeitrag je Stück des Auftrags.',
        },
      );
    }
    steps.push({
      titel: 'Veränderung des Betriebsergebnisses',
      rechnung:
        p.variante === 'verdraengung'
          ? `${eur(s.dbZusatz)} − ${eur(s.entgangenerDb)} = ${eur(s.ergebnis)}`
          : `${eur(s.dbJeStueck)} × ${plain(p.zusatzMenge)} = ${eur(s.ergebnis)}`,
      erlaeuterung: s.ergebnis.isNegative()
        ? 'Das Ergebnis sinkt: ablehnen.'
        : 'Das Ergebnis steigt: annehmen.',
    });
    return steps;
  },
  hints: (p, s) => {
    const { ein } = einheitVon(p.produkt);
    if (p.variante === 'kurz-lang') {
      return [
        'Kurzfristig: Welche Kosten entstehen nur, wenn produziert wird? Langfristig: Alle Kosten müssen gedeckt sein.',
        `Fixkosten je ${ein}: Fixkosten ÷ laufende Menge.`,
        `Kurzfristig ${eur(s.kurzPug)}, langfristig ${eur(s.langPug)} je ${ein}.`,
      ];
    }
    return [
      'Die Fixkosten fallen mit und ohne Auftrag an. Welche Kosten kommen durch den Auftrag hinzu?',
      p.variante === 'verdraengung'
        ? 'Reicht die freie Kapazität nicht, fehlt der Deckungsbeitrag der verdrängten normalen Verkäufe.'
        : `Kurzfristige Preisuntergrenze = variable Stückkosten = ${eur(s.kurzPug)}.`,
      p.variante === 'verdraengung'
        ? `Zusätzlicher Deckungsbeitrag ${eur(s.dbZusatz)}, entgangener Deckungsbeitrag ${eur(s.entgangenerDb)}.`
        : `(${eur(p.zusatzPreis)} − ${eur(s.kurzPug)}) × ${plain(p.zusatzMenge)} = ${eur(s.ergebnis)}.`,
    ];
  },
  errorVariants: (p) => {
    const out: ErrorVariant[] = [
      {
        fehlertyp: 'vollkosten-als-untergrenze',
        parts: partsPug(p, solvePug(p, { vollkosten: true }), []),
      },
    ];
    if (p.variante === 'verdraengung') {
      out.push({
        fehlertyp: 'verdraengung-ignoriert',
        parts: partsPug(p, solvePug(p, { verdraengungIgnoriert: true }), []),
      });
    }
    return out;
  },
  verfahren: (p) =>
    p.variante === 'kurz-lang'
      ? 'Preisuntergrenze: kurzfristig variable Stückkosten, langfristig Selbstkosten'
      : 'Zusatzauftrag: Preis mit variablen Stückkosten vergleichen (Teilkostenrechnung)',
});
