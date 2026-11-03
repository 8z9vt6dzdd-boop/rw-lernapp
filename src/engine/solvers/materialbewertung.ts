// H2 – Materialbewertung (periodisch): FIFO, LIFO, gewogener Durchschnitt. Getestet mit GC-15.
import { Val, dec, type Dec } from '../money';

export interface Posten {
  menge: number;
  preis: string;
}

export interface Bewertung {
  verbrauch: Val;
  endbestand: Val;
  durchschnittspreis?: Val;
}

function wert(p: Posten): Val {
  return new Val(p.preis).times(p.menge);
}

function verbrauchAus(posten: readonly Posten[], abgang: number): Val {
  let rest = abgang;
  let summe = new Val(0);
  for (const p of posten) {
    if (rest <= 0) break;
    const m = Math.min(rest, p.menge);
    summe = summe.plus(new Val(p.preis).times(m));
    rest -= m;
  }
  if (rest > 0) throw new Error('Abgang größer als verfügbarer Bestand');
  return summe;
}

/** Periodisch: Anfangsbestand und Zugänge in zeitlicher Reihenfolge, ein Gesamtabgang. */
export function bewertePeriodisch(
  verfahren: 'fifo' | 'lifo' | 'durchschnitt',
  posten: readonly Posten[],
  abgang: number,
): Bewertung {
  const gesamtWert = posten.reduce((a, p) => a.plus(wert(p)), new Val(0));
  const gesamtMenge = posten.reduce((a, p) => a + p.menge, 0);
  if (verfahren === 'durchschnitt') {
    const durchschnittspreis = gesamtWert.div(gesamtMenge).round();
    const verbrauch = durchschnittspreis.times(abgang).round();
    return { verbrauch, endbestand: gesamtWert.minus(verbrauch), durchschnittspreis };
  }
  const reihenfolge = verfahren === 'fifo' ? posten : [...posten].reverse();
  const verbrauch = verbrauchAus(reihenfolge, abgang);
  return { verbrauch, endbestand: gesamtWert.minus(verbrauch) };
}

export function summeWert(posten: readonly Posten[]): Dec {
  return posten.reduce((a, p) => a.plus(dec(p.preis).times(p.menge)), dec(0));
}
