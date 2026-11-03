// Zusätzliche Konten M7, Batch f2 (nur wenn in accounts.ts noch nicht vorhanden; Bezeichnung exakt nach 04-fachregeln.md).
// Beide Konten fehlen in 04-fachregeln.md, Abschnitt 1, werden aber vom Lehrbrief verwendet (BA 5.3.5.2, BA 6.4).
// [ANNAHME – bitte prüfen] Kanonische Bezeichnungen siehe docs/m7/f2.md, Abschnitt „Offene fachliche Fragen“.
import type { Konto } from '../accounts';

export const KONTEN_F2: Konto[] = [
  {
    // Gegenkonto zu „Einstellung in Wertberichtigungen“ bei der Herabsetzung von EWB und PWB.
    name: 'Erträge aus der Herabsetzung von Wertberichtigungen',
    kurz: 'Erträge aus Herabsetzung von WB',
    typ: 'ertrag',
    synonyme: [
      'Erträge aus der Herabsetzung von Wertberichtigungen auf Forderungen',
      'Erträge aus der Auflösung von Wertberichtigungen',
      'Erträge aus der Auflösung von Einzelwertberichtigungen',
      'Erträge aus der Auflösung von Pauschalwertberichtigungen',
      'Erträge aus der Herabsetzung von Einzelwertberichtigungen',
      'Erträge aus der Herabsetzung von Pauschalwertberichtigungen',
      'Erträge aus der Auflösung von EWB',
      'Erträge aus der Auflösung von PWB',
      'Erträge aus der Herabsetzung von EWB',
      'Erträge aus der Herabsetzung von PWB',
    ],
  },
  {
    // Mehrbetrag bei der Inanspruchnahme einer Rückstellung (BA 6.4).
    name: 'Periodenfremde Aufwendungen',
    kurz: 'Periodenfremde Aufwendungen',
    typ: 'aufwand',
    synonyme: ['Periodenfremder Aufwand'],
  },
];
