// Gemeinsame Typen für Aufgaben, Interaktionen und Bewertung.
import type { FieldKind, Val, Bewertung } from './money';
import type { Rng } from './rng';
import type { FirmaConfig } from './firma';
import type { BuchungsLoesung } from './booking';

// ---------- Felder ----------

export interface ZahlFeld {
  typ: 'zahl';
  id: string;
  label: string;
  kind: FieldKind;
  /** Einheit für die Anzeige, z. B. „€“, „%“, „€/kWh“, „Stk.“ */
  einheit?: string;
  /** Erwarteter Wert (beide Lösungspfade). Bei kind 'prozent' in Prozentpunkten (z. B. 12,5). */
  soll: Val;
  /** Nachkommastellen für Vergleich und Anzeige (Standard 2). */
  dp?: number;
  hilfe?: string;
}

export interface AuswahlFeld {
  typ: 'auswahl';
  id: string;
  label: string;
  optionen: string[];
  soll: string;
}

export type Feld = ZahlFeld | AuswahlFeld;

// ---------- Interaktionen (Teile einer Aufgabe) ----------

export interface RechenkettePart {
  typ: 'rechenkette';
  id: string;
  titel: string;
  felder: Feld[];
}

export type Zelle = { typ: 'fest'; text: string } | { typ: 'leer' } | ZahlFeld;

export interface TabellenZeile {
  label: string;
  zellen: Zelle[];
  /** Summen- oder Ergebniszeile (fett, mit Linie). */
  summe?: boolean;
}

export interface TabellePart {
  typ: 'tabelle';
  id: string;
  titel: string;
  spalten: string[];
  zeilen: TabellenZeile[];
  hinweis?: string;
}

export interface BuchungPart {
  typ: 'buchungssatz';
  id: string;
  titel: string;
  loesung: BuchungsLoesung;
  /** Weitere fachlich zulässige Lösungen (z. B. Brutto- statt Nettomethode, wenn keine genannt). */
  alternativen?: BuchungsLoesung[];
}

export interface WahlOption {
  id: string;
  text: string;
  richtig: boolean;
  fehlertyp?: string;
  erklaerung?: string;
}

export interface WahlPart {
  typ: 'mc' | 'aufgabe-erkennen';
  id: string;
  frage: string;
  optionen: WahlOption[];
  /** Erklärung, die nach der Antwort immer gezeigt wird. */
  begruendung?: string;
}

export type TaskPart = RechenkettePart | TabellePart | BuchungPart | WahlPart;

// ---------- Antworten ----------

export interface ZeilenEingabe {
  konto: string;
  betrag: string;
}

export interface SatzEingabe {
  soll: ZeilenEingabe[];
  haben: ZeilenEingabe[];
}

export type PartAnswer =
  | { typ: 'felder'; werte: Record<string, string> }
  | { typ: 'buchung'; saetze: SatzEingabe[] }
  | { typ: 'wahl'; optionId: string };

export type TaskAnswer = Record<string, PartAnswer>;

// ---------- Ergebnis ----------

export interface FeldErgebnis {
  bewertung: Bewertung;
  eingabe: string;
  erwartet: string;
}

export interface ZeilenErgebnis {
  seite: 'soll' | 'haben';
  konto: string;
  erwartet: string;
  status: 'richtig' | 'betrag-falsch' | 'seite-falsch' | 'fehlt';
  /** Index des erwarteten Buchungssatzes. */
  satz: number;
}

export interface PartResult {
  partId: string;
  korrekt: boolean;
  score: number;
  /** Kurze Rückmeldungen, was stimmt und was nicht. */
  feedback: string[];
  felder?: Record<string, FeldErgebnis>;
  zeilen?: ZeilenErgebnis[];
  /** Zeilen der Eingabe, die in der Lösung nicht vorkommen. */
  ueberzaehlig?: { seite: 'soll' | 'haben'; konto: string }[];
  fehlertypen: string[];
  rundungshinweis: boolean;
}

export interface CheckResult {
  korrekt: boolean;
  score: number;
  parts: PartResult[];
  fehlertypen: string[];
  rundungshinweis: boolean;
}

// ---------- Texte und Rechenweg ----------

export interface TaskText {
  titel: string;
  /** Kapitel im Geschäftsjahr der MBG, z. B. „Februar: Rohstoffeinkauf“. */
  kontext?: string;
  sachverhalt: string[];
  daten?: { spalten: string[]; zeilen: string[][] };
  aufgabe: string;
}

export interface SolutionStep {
  titel: string;
  rechnung?: string;
  ergebnis?: string;
  erlaeuterung?: string;
}

export interface ErrorVariant {
  fehlertyp: string;
  parts: TaskPart[];
}

export interface GenOptions {
  variant?: string;
  /** Anteil „krummer“ Werte (Standard 0,2). */
  krummAnteil?: number;
}

export interface Generator<P, S> {
  skillId: string;
  titel: string;
  variants: string[];
  points: number;
  generate(rng: Rng, opts?: GenOptions): P;
  render(p: P, firma: FirmaConfig): TaskText;
  solve(p: P): S;
  parts(p: P, s: S): TaskPart[];
  steps(p: P, s: S): SolutionStep[];
  hints(p: P, s: S): [string, string, string];
  /** Typische fehlerhafte Lösungswege zur Fehlertyp-Erkennung. */
  errorVariants(p: P): ErrorVariant[];
  check(p: P, s: S, answer: TaskAnswer): CheckResult;
  /** Kurzbeschreibung des Verfahrens (für „Aufgabe erkennen“). */
  verfahren(p: P): string;
}
