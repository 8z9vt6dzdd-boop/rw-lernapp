// Datentypen der Visualisierungs-Bausteine (von Lektionen und Oberfläche gemeinsam genutzt).

export type SchauplatzId = 'buero' | 'lager' | 'abfuellung' | 'besprechung' | 'gesellschafter';

/** Posten auf der Bilanz-Waage */
export interface Posten {
  text: string;
  /** Betrag in Euro als Dezimal-String (optional; ohne Betrag zählt jeder Posten 1) */
  betrag?: string;
  neu?: boolean;
}

/** Eintrag in einem T-Konto */
export interface Eintrag {
  text: string;
  betrag: string;
  neu?: boolean;
}

export interface BelegZeile {
  text: string;
  betrag?: string;
  fett?: boolean;
}

export interface LagerPosten {
  name: string;
  /** Anzahl Paletten (0–8) */
  paletten: number;
  farbe?: string;
}

export interface Tank {
  name: string;
  /** Füllstand 0–1 */
  fuellung: number;
  farbe?: string;
}
