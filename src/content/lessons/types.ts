// Lektionen als Daten (09-lektionen.md, Abschnitt 10). Der Lektions-Player rendert sie.
import type { Ausdruck, FigurId } from '../characters';
import type { TaskPart } from '../../engine/task';
import type { BelegZeile, Eintrag, LagerPosten, Posten, SchauplatzId, Tank } from '../visual-types';

export interface Sprecher {
  figur: FigurId;
  ausdruck: Ausdruck;
  /** höchstens 2 Sätze */
  text: string;
}

export type Visual =
  | {
      typ: 'waage';
      links: Posten[];
      rechts: Posten[];
      titelLinks?: string;
      titelRechts?: string;
      untertitelLinks?: string;
      untertitelRechts?: string;
    }
  | {
      typ: 'tkonto';
      name: string;
      soll: Eintrag[];
      haben: Eintrag[];
      saldo?: boolean;
      untertitel?: string;
    }
  | {
      typ: 'tkonten';
      konten: { name: string; soll: Eintrag[]; haben: Eintrag[]; untertitel?: string }[];
    }
  | { typ: 'brutto-netto'; brutto: string; ustSatz?: string; skontoSatz?: string }
  | {
      typ: 'beleg';
      art?: 'rechnung' | 'kontoauszug';
      absender: string;
      nummer?: string;
      datum?: string;
      zeilen: BelegZeile[];
      fuss?: string;
    }
  | { typ: 'lager'; regal?: LagerPosten[]; tanks?: Tank[]; titel?: string }
  | { typ: 'karten'; karten: { titel: string; text: string; farbe?: string }[] }
  | { typ: 'szene'; ort: SchauplatzId; figuren: { figur: FigurId; ausdruck: Ausdruck }[] }
  /** Kontenkreislauf EBK → Bestands-/Erfolgskonten → GuV → Eigenkapital → SBK; optional ein Schritt hervorgehoben (1–5) */
  | { typ: 'kreislauf'; aktiv?: number }
  /** Kostenstellen-Netz: Vorkostenstellen liefern Leistungen (Pfeile mit Mengen) an andere Stellen */
  | {
      typ: 'kostenstellen';
      hilfs: { name: string; primaer?: string; einheit: string }[];
      haupt: { name: string; primaer?: string }[];
      pfeile: { von: string; an: string; menge: string }[];
    }
  /** Kalkulations-Treppe: Stufen von Einzelkosten bis Preis */
  | { typ: 'treppe'; stufen: { label: string; betrag: string; art: 'basis' | 'zuschlag' | 'summe' }[] }
  /** Abschreibungs-Verlauf: Buchwert über die Jahre, mehrere Verfahren zum Vergleich */
  | {
      typ: 'afa-verlauf';
      basis: string;
      restwert: string;
      nd: number;
      verfahren: ('linear' | 'arithmetisch' | 'geometrisch')[];
      /** geometrisch: Satz als Dezimal-String */
      satz?: string;
    }
  /** Kostenfunktion: Erlös- und Kostengerade mit Gewinnschwelle */
  | { typ: 'kostenfunktion'; preis: string; kv: string; kf: string; xmax: number; einheit?: string };

/** Interaktive Erkunden-Bausteine: etwas verändern und die Wirkung sofort sehen. */
export type Erkunden =
  | {
      art: 'waage-zuordnen';
      /** Posten, die per Tippen links oder rechts abgelegt werden */
      posten: (Posten & { seite: 'links' | 'rechts' })[];
      start?: { links: Posten[]; rechts: Posten[] };
    }
  | {
      art: 'geschaeftsvorfall';
      /** Ausgangsbilanz und Vorfälle, die nacheinander angewendet werden */
      start: { links: Posten[]; rechts: Posten[] };
      vorfaelle: {
        text: string;
        aenderungen: { seite: 'links' | 'rechts'; text: string; delta: string }[];
      }[];
    }
  | {
      art: 'tkonto-buchen';
      konto: string;
      anfang?: { seite: 'soll' | 'haben'; text: string; betrag: string };
      vorgaenge: { text: string; betrag: string; seite: 'soll' | 'haben' }[];
    }
  | {
      art: 'skonto-regler';
      brutto: string;
      ustSatz: string;
      zieltage: number;
      skontotage: number;
    }
  | {
      /** Abschreibungsverfahren umschalten und Buchwertverlauf vergleichen */
      art: 'afa-vergleich';
      basis: string;
      restwert: string;
      nd: number;
      satz?: string;
    }
  | {
      /** Absatzmenge per Schieberegler: Erlös, Kosten und Ergebnis live */
      art: 'kostenfunktion';
      preis: string;
      kv: string;
      kf: string;
      xmax: number;
      einheit?: string;
    }
  | {
      art: 'aufdecken';
      karten: { titel: string; text: string; farbe?: string }[];
    };

export interface Option {
  text: string;
  richtig?: boolean;
  erklaerung?: string;
}

export type Screen =
  | { typ: 'raetsel'; ort: SchauplatzId; sprecher: Sprecher[]; frage: string; visual?: Visual }
  | { typ: 'dialog'; ort?: SchauplatzId; sprecher: Sprecher[]; visual?: Visual }
  | { typ: 'konzept'; titel: string; text: string; visual: Visual; figur?: Sprecher }
  | { typ: 'erkunden'; titel: string; text: string; erkunden: Erkunden; fazit?: string }
  | {
      typ: 'vorhersage';
      frage: string;
      optionen: Option[];
      aufloesung: string;
      visual?: Visual;
      figur?: Sprecher;
      aufloesungVisual?: Visual;
    }
  | {
      typ: 'sortieren';
      titel: string;
      text?: string;
      kategorien: string[];
      elemente: { text: string; kategorie: string; erklaerung?: string }[];
    }
  | {
      typ: 'wer-hat-recht';
      frage: string;
      a: Sprecher;
      b: Sprecher;
      richtig: 'a' | 'b';
      begruendungen: Option[];
      aufloesung: string;
    }
  | {
      typ: 'fehlerjagd';
      titel: string;
      text: string;
      beleg?: Extract<Visual, { typ: 'beleg' }>;
      zeilen?: string[];
      fehlerZeile: number;
      gruende: Option[];
      aufloesung: string;
    }
  | {
      typ: 'vorgerechnet';
      titel: string;
      text?: string;
      schritte: { text: string; rechnung?: string; warum: string }[];
      visual?: Visual;
    }
  | {
      typ: 'luecke';
      titel: string;
      text: string;
      skillId: string;
      seed: number;
      variant?: string;
      partId: string;
      gefragt: string[];
    }
  | {
      typ: 'entscheidung';
      frage: string;
      figur?: Sprecher;
      optionen: { text: string; folge: string; ausdruck?: Ausdruck; empfohlen?: boolean }[];
      fazit: string;
    }
  | { typ: 'verstaendnis'; frage: string; optionen: Option[]; figur?: Sprecher }
  /** Merksatz; `frage` ist die Vorderseite der späteren Wiederholungskarte */
  | { typ: 'merksatz'; id: string; text: string; frage: string; figur?: Sprecher }
  | {
      typ: 'klausur';
      punkte: number;
      aufgabe: string;
      part: TaskPart | { skillId: string; seed: number; variant?: string; partId: string };
      cliffhanger: Sprecher;
    };

export type ScreenTyp = Screen['typ'];

/** Bildschirmtypen, die eine Handlung verlangen (09-lektionen.md, Abschnitt 5: Typen 4–8 und 10–12). */
export const INTERAKTIV: readonly ScreenTyp[] = [
  'erkunden',
  'vorhersage',
  'sortieren',
  'wer-hat-recht',
  'fehlerjagd',
  'luecke',
  'entscheidung',
  'verstaendnis',
];
/** Reine Lese-Bildschirme (nie zwei hintereinander). */
export const LESEN: readonly ScreenTyp[] = ['dialog', 'konzept', 'merksatz', 'vorgerechnet'];

export interface SkipFrage {
  frage: string;
  optionen: Option[];
}

export interface Lektion {
  id: string;
  skillId: string;
  abschnitt: string;
  titel: string;
  kernAha: string;
  dauerMin: number;
  figuren: FigurId[];
  ort: SchauplatzId;
  quelle: string;
  /** Kurzbeschreibung für Startseite („Was heute bei der MBG passiert“) */
  teaser: Sprecher;
  screens: Screen[];
  /** 3–4 Fragen für „Kann ich schon“ */
  skipTest: SkipFrage[];
  /** Qualitäts-Checkliste (09-lektionen.md, Abschnitt 9), selbst geprüft */
  checkliste: {
    raetsel: boolean;
    alltagVorFachbegriff: boolean;
    kernAhaErreicht: boolean;
    figurImDialog: boolean;
    klausurbrueckeUndCliffhanger: boolean;
    fachlichGeprueft: string;
    verstaendlichOhneVorwissen: boolean;
    datum: string;
  };
}
