// Rahmenfirma (siehe 08-firma-mbg.md). Werte stehen zentral in src/config.ts.

export interface FirmaConfig {
  name: string;
  kurz: string;
  ort: string;
  hinweisFiktiv: string;
  gesellschafter: [string, string];
  produkte: {
    energy: string;
    lemon: string;
    bier: string;
    wein: string;
    vodka: string;
  };
  kostenstellen: {
    energie: string;
    instandhaltung: string;
    material: string;
    fertigung1: string;
    fertigung2: string;
    verwaltung: string;
    vertrieb: string;
  };
  /** Frei erfundene Geschäftspartner. */
  lieferanten: {
    rohstoffe: string[];
    hilfsstoffe: string[];
    betriebsstoffe: string[];
    vorprodukte: string[];
    handelswaren: string[];
    anlagen: string[];
  };
  kunden: string[];
}
