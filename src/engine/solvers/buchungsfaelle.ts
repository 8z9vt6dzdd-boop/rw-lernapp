// Rechen- und Buchungslogik für Buchungsfälle, deren Generatoren in späteren Meilensteinen folgen.
// Bereits jetzt gegen die Golden Cases getestet (GC-06, GC-07, GC-08, GC-12, GC-13).
import { bezugskostenKonto, type Stoff } from '../accounts';
import { loesung, satz, zeile, type BuchungsLoesung } from '../booking';
import { Val, dec, type NumLike } from '../money';

/** GC-06: Rücksendung an den Lieferer = Stornobuchung auf dem Stoffkonto. */
export function ruecksendungEinkauf(
  stoff: Stoff,
  netto: NumLike,
  ust: NumLike = '0.19',
): BuchungsLoesung {
  const n = new Val(netto);
  const st = n.times(dec(ust)).fix();
  return loesung([
    satz(
      [zeile('Verbindlichkeiten aus Lieferungen und Leistungen', n.plus(st))],
      [zeile(stoff, n), zeile('Vorsteuer', st)],
    ),
  ]);
}

/** GC-07: Einkauf mit Bezugskosten (bestandsorientiert) und Umbuchung beim Abschluss. */
export function einkaufMitBezugskosten(
  stoff: Stoff,
  warenwert: NumLike,
  bezugskosten: NumLike,
  ust: NumLike = '0.19',
): { einkauf: BuchungsLoesung; abschluss: BuchungsLoesung } {
  const w = new Val(warenwert);
  const b = new Val(bezugskosten);
  const st = w.plus(b).times(dec(ust)).fix();
  return {
    einkauf: loesung([
      satz(
        [zeile(stoff, w), zeile(bezugskostenKonto(stoff), b), zeile('Vorsteuer', st)],
        [zeile('Verbindlichkeiten aus Lieferungen und Leistungen', w.plus(b).plus(st))],
      ),
    ]),
    abschluss: loesung([satz([zeile(stoff, b)], [zeile(bezugskostenKonto(stoff), b)])]),
  };
}

/** GC-08: Privatentnahme von Gegenständen mit Umsatzsteuer. */
export function privatentnahmeGegenstand(netto: NumLike, ust: NumLike = '0.19'): BuchungsLoesung {
  const n = new Val(netto);
  const st = n.times(dec(ust)).fix();
  return loesung([
    satz(
      [zeile('Privat', n.plus(st))],
      [zeile('Entnahme von Gegenständen und sonstigen Leistungen', n), zeile('Umsatzsteuer', st)],
    ),
  ]);
}

/**
 * GC-12: Forderungsbewertung. Zweifelhafte Forderung umbuchen, Einzelwertberichtigung vom Nettobetrag,
 * Pauschalwertberichtigung vom Nettobetrag des einwandfreien Restbestands.
 */
export function forderungsbewertung(opts: {
  zweifelhaftBrutto: NumLike;
  ausfallQuote: NumLike;
  restBrutto: NumLike;
  pwbSatz: NumLike;
  ust?: NumLike;
}): {
  umbuchung: BuchungsLoesung;
  ewb: BuchungsLoesung;
  pwb: BuchungsLoesung;
  ewbBetrag: Val;
  pwbBetrag: Val;
} {
  const u = dec(opts.ust ?? '0.19');
  const zb = new Val(opts.zweifelhaftBrutto);
  const ewbBetrag = zb.div(dec(1).plus(u)).fix().times(dec(opts.ausfallQuote)).fix();
  const pwbBetrag = new Val(opts.restBrutto)
    .div(dec(1).plus(u))
    .fix()
    .times(dec(opts.pwbSatz))
    .fix();
  return {
    umbuchung: loesung([
      satz(
        [zeile('Zweifelhafte Forderungen', zb)],
        [zeile('Forderungen aus Lieferungen und Leistungen', zb)],
      ),
    ]),
    ewb: loesung([
      satz(
        [zeile('Einstellung in Wertberichtigungen', ewbBetrag)],
        [zeile('Einzelwertberichtigung zu Forderungen', ewbBetrag)],
      ),
    ]),
    pwb: loesung([
      satz(
        [zeile('Einstellung in Wertberichtigungen', pwbBetrag)],
        [zeile('Pauschalwertberichtigung zu Forderungen', pwbBetrag)],
      ),
    ]),
    ewbBetrag,
    pwbBetrag,
  };
}

/**
 * GC-13: Aktive Rechnungsabgrenzung bei Vorauszahlung eines Aufwands.
 * `monateGesamt` Leistungszeitraum, davon `monateAltesJahr` im alten Geschäftsjahr.
 */
export function aktiveRechnungsabgrenzung(opts: {
  aufwandskonto: string;
  betrag: NumLike;
  monateGesamt: number;
  monateAltesJahr: number;
}): { zahlung: BuchungsLoesung; abschluss: BuchungsLoesung; abgrenzung: Val } {
  const b = new Val(opts.betrag);
  const abgrenzung = b
    .times(opts.monateGesamt - opts.monateAltesJahr)
    .div(opts.monateGesamt)
    .fix();
  return {
    zahlung: loesung([satz([zeile(opts.aufwandskonto, b)], [zeile('Bank', b)])]),
    abschluss: loesung([
      satz(
        [zeile('Aktive Rechnungsabgrenzung', abgrenzung)],
        [zeile(opts.aufwandskonto, abgrenzung)],
      ),
    ]),
    abgrenzung,
  };
}
