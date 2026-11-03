// Bereitet eine Aufgabe aus einer Spezifikation (Skill, Seed, Art) für die Oberfläche vor.
import { FIRMA } from '../config';
import { kurzantwortElemente, mcAlsPart, mcElemente } from '../content/theory';
import { generatorFuer, GENERATOREN, type AnyGenerator } from '../engine/generators';
import { createRng } from '../engine/rng';
import type {
  BuchungPart,
  ErrorVariant,
  FehlerFindenPart,
  SolutionStep,
  TaskPart,
  TaskText,
  WahlOption,
  WahlPart,
} from '../engine/task';
import { getKonto } from '../engine/accounts';
import { fehlertyp } from '../engine/fehlertypen';
import { formatEuro } from '../engine/money';

export type TaskArt = 'aufgabe' | 'erkennen' | 'mc' | 'karte' | 'fehler' | 'kurzantwort';

export interface TaskSpec {
  key: string;
  art: TaskArt;
  skillId: string;
  seed: number;
  variant?: string;
  /** Zweiter Versuch nach einem Fehler in derselben Sitzung */
  wiederholung?: boolean;
  /** Kurzmodus auf dem Handy: nur Teilschritte ohne große Tabelle */
  teilschritt?: boolean;
  /** Aufgabe stammt aus der Liste „Am Laptop weitermachen“ (Verweis auf das Merken-Ereignis) */
  laptopRef?: string;
  /** Theorie-Element bei art 'mc' */
  elementId?: string;
}

export interface PreparedTask {
  spec: TaskSpec;
  text: TaskText;
  parts: TaskPart[];
  variants: ErrorVariant[];
  hints: [string, string, string];
  steps: SolutionStep[];
  params: unknown;
  solution: unknown;
  points: number;
}

/** Verfahren, aus denen falsche Antwortoptionen für „Aufgabe erkennen“ gezogen werden. */
const VERFAHREN_BUCHFUEHRUNG = [
  'Lieferantenskonto: Skonto zerlegen, Vorsteuer korrigieren',
  'Kundenskonto: Skonto zerlegen, Umsatzsteuer korrigieren',
  'Rücksendung an den Lieferer: Stornobuchung auf dem Stoffkonto',
  'Nachlass vom Lieferer: Buchung auf dem Nachlasskonto',
  'Umsatzsteuer-Abschluss: Zahllast oder Vorsteuerüberhang',
  'Bestandsveränderungen buchen und über die GuV abschließen',
  'Erlösberichtigung wegen Mängelrüge',
  'Aktive Rechnungsabgrenzung zum Jahresabschluss',
];

const VERFAHREN_KLR = [
  'Kalkulatorische Abschreibung (linear)',
  'Kalkulatorische Abschreibung (arithmetisch-degressiv)',
  'Kalkulatorische Abschreibung (leistungsbezogen)',
  'Kalkulatorische Abschreibung (geometrisch-degressiv)',
  'Stufenleiterverfahren: Reihenfolge per Wertvergleich, ohne Rückverrechnung',
  'Simultanverfahren: Gleichungssystem mit gegenseitiger Verrechnung',
  'Anbauverfahren: nur Leistungen an Hauptkostenstellen verrechnen',
  'Äquivalenzziffernkalkulation (Sortenfertigung)',
  'Divisionskalkulation (Massenfertigung eines Produkts)',
  'Zuschlagskalkulation: Selbstkosten nach Kalkulationsschema',
  'Angebotskalkulation: von den Selbstkosten zum Listenverkaufspreis',
];

let verfahrenCache: { bf: string[]; klr: string[] } | null = null;

/** Distraktoren: feste Liste plus die Verfahrensbeschreibungen aller Generatoren desselben Bereichs. */
function verfahrenPool(): { bf: string[]; klr: string[] } {
  if (verfahrenCache) return verfahrenCache;
  const bf = new Set(VERFAHREN_BUCHFUEHRUNG);
  const klr = new Set(VERFAHREN_KLR);
  for (const g of GENERATOREN) {
    for (const variant of g.variants.length ? g.variants : [undefined]) {
      try {
        const p = g.generate(createRng(7), variant ? { variant } : {});
        (/^[A-F]/.test(g.skillId) ? bf : klr).add(g.verfahren(p));
      } catch {
        /* Variante nicht erzeugbar – überspringen */
      }
    }
  }
  verfahrenCache = { bf: [...bf], klr: [...klr] };
  return verfahrenCache;
}

function erkennenPart(g: AnyGenerator, p: unknown, seed: number): WahlPart {
  const richtig = g.verfahren(p);
  const pool = (/^[A-F]/.test(g.skillId) ? verfahrenPool().bf : verfahrenPool().klr).filter(
    (v) => v !== richtig,
  );
  const rng = createRng(seed ^ 0x5eed);
  const distraktoren = rng.shuffle(pool).slice(0, 3);
  const optionen = rng.shuffle([richtig, ...distraktoren]).map((text, i) => {
    const o: WahlPart['optionen'][number] = { id: `v${i}`, text, richtig: text === richtig };
    if (text !== richtig) o.fehlertyp = 'verfahren-verwechselt';
    return o;
  });
  return {
    typ: 'aufgabe-erkennen',
    id: 'erkennen',
    frage: 'Welches Vorgehen ist hier gefragt? Noch nicht rechnen – nur erkennen.',
    optionen,
    begruendung: `Richtig: ${richtig}.`,
  };
}

/** Aus einer typischen Fehlervariante eine „Fehler finden“-Aufgabe bauen (nur einzeilige Abweichung im Buchungssatz). */
export function fehlerFindenTeil(
  g: AnyGenerator,
  p: unknown,
  s: unknown,
  seed: number,
): FehlerFindenPart | null {
  const richtig = g.parts(p, s).find((x: TaskPart): x is BuchungPart => x.typ === 'buchungssatz');
  if (!richtig || richtig.loesung.saetze.length !== 1) return null;
  const zeilenVon = (b: BuchungPart) =>
    b.loesung.saetze[0]!.soll.map((z) => ({
      seite: 'Soll',
      konto: z.konto,
      betrag: z.betrag.value.toFixed(2),
    })).concat(
      b.loesung.saetze[0]!.haben.map((z) => ({
        seite: 'Haben',
        konto: z.konto,
        betrag: z.betrag.value.toFixed(2),
      })),
    );
  const ref = zeilenVon(richtig).map((z) => `${z.seite}|${z.konto}|${z.betrag}`);
  const kandidaten = (g.errorVariants(p) as ErrorVariant[]).flatMap((v) => {
    const b = v.parts.find(
      (x): x is BuchungPart => x.id === richtig.id && x.typ === 'buchungssatz',
    );
    if (!b || b.loesung.saetze.length !== 1) return [];
    const zeilen = zeilenVon(b);
    const anders = zeilen
      .map((z, i) => ({ z, i }))
      .filter(({ z }) => !ref.includes(`${z.seite}|${z.konto}|${z.betrag}`));
    return zeilen.length === ref.length && anders.length === 1
      ? [{ v, zeilen, fehler: anders[0]!.i }]
      : [];
  });
  if (kandidaten.length === 0) return null;
  const rng = createRng(seed ^ 0xfe41);
  const k = rng.pick(kandidaten);
  const andere = [
    ...new Set((g.errorVariants(p) as ErrorVariant[]).map((v) => v.fehlertyp)),
  ].filter((t) => t !== k.v.fehlertyp);
  const ablenker = rng
    .shuffle([...andere, 'konto-falsche-seite', 'summen-ungleich'])
    .filter((t, i, a) => a.indexOf(t) === i && t !== k.v.fehlertyp)
    .slice(0, 2);
  const gruende = rng.shuffle([k.v.fehlertyp, ...ablenker]).map((t, i) => {
    const o: WahlOption = { id: `g${i}`, text: fehlertyp(t).titel, richtig: t === k.v.fehlertyp };
    if (t !== k.v.fehlertyp)
      o.erklaerung = `Nein – richtig ist: ${fehlertyp(k.v.fehlertyp).titel}. ${fehlertyp(k.v.fehlertyp).erklaerung}`;
    else o.fehlertyp = t;
    return o;
  });
  return {
    typ: 'fehler-finden',
    id: 'fehler',
    frage: 'Ein Kollege hat so gebucht. Welche Zeile ist falsch?',
    zeilen: k.zeilen.map((z) => `${z.seite}: ${getKonto(z.konto).kurz} ${formatEuro(z.betrag)}`),
    fehlerZeile: k.fehler,
    gruende,
  };
}

export function prepareTask(spec: TaskSpec): PreparedTask {
  if (spec.art === 'karte') {
    // Merksatz-Karten werden in der Sitzung direkt angezeigt (KarteRunner), hier nur Platzhalter
    return {
      spec,
      text: { titel: 'Karte', sachverhalt: [], aufgabe: '' },
      parts: [],
      variants: [],
      hints: ['', '', ''],
      steps: [],
      params: {},
      solution: {},
      points: 0,
    };
  }
  if (spec.art === 'kurzantwort') {
    const el = kurzantwortElemente().find((e) => e.id === spec.elementId);
    if (!el) throw new Error(`Keine Kurzantwort ${spec.elementId}`);
    return {
      spec,
      text: {
        titel: 'Kurzantwort wie in der Klausur',
        sachverhalt: [],
        aufgabe: 'Antworte in eigenen Worten. Danach vergleichst du mit den Musterpunkten.',
      },
      parts: [
        {
          typ: 'kurzantwort',
          id: 'kurzantwort',
          frage: el.frage,
          punkte: el.punkte,
          checkliste: el.checkliste,
          muster: el.muster,
        },
      ],
      variants: [],
      hints: [
        'Nenne zuerst den Begriff, dann die Begründung, dann ein Beispiel.',
        'Jeder Musterpunkt bringt einen Punkt: Schreibe lieber mehrere kurze, klare Aussagen.',
        `Ein Musterpunkt lautet: ${el.checkliste[0]?.aussage ?? ''}`,
      ],
      steps: [],
      params: { elementId: el.id },
      solution: { muster: el.muster },
      points: el.punkte,
    };
  }
  if (spec.art === 'mc') {
    const el = mcElemente().find((e) => e.id === spec.elementId) ?? mcElemente()[0];
    if (!el) throw new Error('Keine Multiple-Choice-Inhalte vorhanden');
    const reihenfolge = createRng(spec.seed).shuffle(el.optionen.map((_, i) => i));
    const richtig = el.optionen.find((o) => o.richtig)?.text ?? '';
    return {
      spec,
      text: { titel: 'Verständnisfrage', sachverhalt: [], aufgabe: 'Wähle die richtige Antwort.' },
      parts: [mcAlsPart(el, reihenfolge)],
      variants: [],
      hints: [
        'Überlege, welche Größe genau gefragt ist, bevor du rechnest.',
        'Zerlege den Betrag Schritt für Schritt.',
        `Richtig ist: ${richtig}`,
      ],
      steps: [],
      params: { elementId: el.id },
      solution: { richtig },
      points: 1,
    };
  }
  const g = generatorFuer(spec.skillId);
  if (!g) throw new Error(`Kein Generator für ${spec.skillId}`);
  const opts = spec.variant ? { variant: spec.variant } : {};
  const p = g.generate(createRng(spec.seed), opts);
  const s = g.solve(p);
  const text = g.render(p, FIRMA);
  if (spec.art === 'fehler') {
    const teil = fehlerFindenTeil(g, p, s, spec.seed);
    if (teil) {
      return {
        spec,
        text: { ...text, aufgabe: 'Fehlerjagd: Finde die falsche Zeile und begründe.' },
        parts: [teil],
        variants: [],
        hints: [
          'Prüfe jede Zeile: Stimmt das Konto, die Seite und der Betrag?',
          'Achte besonders auf Steuerkonten und darauf, wovon Prozente gerechnet werden.',
          `Der Fehler steckt in Zeile ${teil.fehlerZeile + 1}.`,
        ],
        steps: g.steps(p, s),
        params: p,
        solution: s,
        points: 2,
      };
    }
  }
  if (spec.art === 'erkennen') {
    return {
      spec,
      text: { ...text, aufgabe: 'Lies den Sachverhalt und bestimme den Aufgabentyp.' },
      parts: [erkennenPart(g, p, spec.seed)],
      variants: [],
      hints: [
        'Achte auf Signalwörter: Wer zahlt wen? Welche Größe ist gegeben, welche gesucht?',
        'Buchführung oder Kostenrechnung? Geht es um eine Buchung oder um eine Kalkulation?',
        `Richtig: ${g.verfahren(p)}`,
      ],
      steps: [],
      params: p,
      solution: { verfahren: g.verfahren(p) },
      points: 1,
    };
  }
  const alleTeile = g.parts(p, s);
  const ohneTabelle = alleTeile.filter((t) => t.typ !== 'tabelle');
  const teilschritt =
    spec.teilschritt === true && ohneTabelle.length > 0 && ohneTabelle.length < alleTeile.length;
  return {
    spec,
    text: teilschritt
      ? {
          ...text,
          aufgabe: `${text.aufgabe} Hier auf dem Handy nur der erste Teilschritt – die ganze Tabelle übst du am Laptop.`,
        }
      : text,
    parts: teilschritt ? ohneTabelle : alleTeile,
    variants: g.errorVariants(p),
    hints: g.hints(p, s),
    steps: g.steps(p, s),
    params: p,
    solution: s,
    points: g.points,
  };
}

export function skillTitel(skillId: string): string {
  return GENERATOREN.find((g) => g.skillId === skillId)?.titel ?? skillId;
}
