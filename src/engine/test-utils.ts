// Nur für Tests: kompakte Darstellung von Buchungen und Zufallsläufe über viele Seeds.
import { formatSatz, istAusgeglichen, type BuchungsLoesung } from './booking';
import { createRng } from './rng';
import { antwortAusParts } from './testing';
import type { Generator, GenOptions } from './task';

/** Buchungssätze als Text, „ €“ mit normalem Leerzeichen. */
export function buchungText(l: BuchungsLoesung): string[] {
  return l.saetze.map((s) => formatSatz(s).replace(/\u00a0/g, ' '));
}

export function alleAusgeglichen(l: BuchungsLoesung): boolean {
  return l.saetze.every(istAusgeglichen);
}

/** Führt `fn` für `n` Seeds aus und liefert Parameter und Lösung. */
export function forSeeds<P, S>(
  g: Generator<P, S>,
  n: number,
  fn: (p: P, s: S, seed: number) => void,
  opts?: GenOptions,
): void {
  for (let seed = 1; seed <= n; seed++) {
    const p = g.generate(createRng(seed), opts);
    const s = g.solve(p);
    try {
      fn(p, s, seed);
    } catch (e) {
      throw new Error(`Seed ${seed}: ${(e as Error).message}\nParameter: ${JSON.stringify(p)}`, {
        cause: e,
      });
    }
  }
}

/** Die eigene Musterlösung muss als vollständig richtig bewertet werden. */
export function selbstpruefung<P, S>(g: Generator<P, S>, p: P, s: S): boolean {
  const parts = g.parts(p, s);
  return g.check(p, s, antwortAusParts(parts)).korrekt;
}
