// Bereitet eine Aufgabe aus einer Spezifikation (Skill, Seed, Art) für die Oberfläche vor.
import { FIRMA } from '../config';
import { mcAlsPart, mcElemente } from '../content/theory';
import { generatorFuer, GENERATOREN, type AnyGenerator } from '../engine/generators';
import { createRng } from '../engine/rng';
import type { ErrorVariant, SolutionStep, TaskPart, TaskText, WahlPart } from '../engine/task';

export type TaskArt = 'aufgabe' | 'erkennen' | 'mc';

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

function erkennenPart(g: AnyGenerator, p: unknown, seed: number): WahlPart {
  const richtig = g.verfahren(p);
  const pool = (/^[A-F]/.test(g.skillId) ? VERFAHREN_BUCHFUEHRUNG : VERFAHREN_KLR).filter(
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

export function prepareTask(spec: TaskSpec): PreparedTask {
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
