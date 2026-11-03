// Hilfen, um aus einer Lösung die passende Eingabe zu erzeugen (Tests, „Lösung übernehmen“).
import { felderVon } from './check';
import type { BuchungsLoesung, ErwSatz } from './booking';
import { formatNumber } from './money';
import type { PartAnswer, SatzEingabe, TaskAnswer, TaskPart } from './task';

export function eingabeAusLoesung(l: BuchungsLoesung): SatzEingabe[] {
  return l.saetze.map((s: ErwSatz) => ({
    soll: s.soll.map((z) => ({ konto: z.konto, betrag: formatNumber(z.betrag) })),
    haben: s.haben.map((z) => ({ konto: z.konto, betrag: formatNumber(z.betrag) })),
  }));
}

export function antwortAusPart(part: TaskPart): PartAnswer {
  switch (part.typ) {
    case 'fehler-finden':
      return {
        typ: 'fehler',
        zeile: part.fehlerZeile,
        grundId: part.gruende.find((g) => g.richtig)?.id ?? '',
      };
    case 'kurzantwort':
      return { typ: 'kurzantwort', text: part.muster, abgehakt: part.checkliste.map((_, i) => i) };
    case 'rechenkette':
    case 'tabelle':
    case 'tkonto':
    case 'gleichungssystem': {
      const werte: Record<string, string> = {};
      for (const f of felderVon(part)) {
        werte[f.id] =
          f.typ === 'auswahl' ? f.soll : formatNumber(f.soll, f.dp ?? (f.kind === 'menge' ? 0 : 2));
      }
      return { typ: 'felder', werte };
    }
    case 'buchungssatz':
      return { typ: 'buchung', saetze: eingabeAusLoesung(part.loesung) };
    case 'mc':
    case 'aufgabe-erkennen':
      return { typ: 'wahl', optionId: part.optionen.find((o) => o.richtig)?.id ?? '' };
  }
}

export function antwortAusParts(parts: readonly TaskPart[]): TaskAnswer {
  return Object.fromEntries(parts.map((p) => [p.id, antwortAusPart(p)]));
}
