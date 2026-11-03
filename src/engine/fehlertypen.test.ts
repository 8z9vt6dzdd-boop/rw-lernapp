import { describe, expect, it } from 'vitest';
import * as alle from './fehlertypen';
import { FEHLERTYPEN_C1 } from './fehlertypen-batches/c1';
import { FEHLERTYPEN_C2 } from './fehlertypen-batches/c2';
import { FEHLERTYPEN_D } from './fehlertypen-batches/d';
import { FEHLERTYPEN_E } from './fehlertypen-batches/e';
import { FEHLERTYPEN_F1 } from './fehlertypen-batches/f1';
import { FEHLERTYPEN_F2 } from './fehlertypen-batches/f2';
import { FEHLERTYPEN_G } from './fehlertypen-batches/g';
import { FEHLERTYPEN_H } from './fehlertypen-batches/h';
import { FEHLERTYPEN_IJ } from './fehlertypen-batches/ij';
import { FEHLERTYPEN_J } from './fehlertypen-batches/j';
import { FEHLERTYPEN_K1 } from './fehlertypen-batches/k1';
import { FEHLERTYPEN_K2 } from './fehlertypen-batches/k2';
import { GENERATOREN } from './generators';
import { createRng } from './rng';

describe('Fehlertypen', () => {
  it('keine ID wird von zwei Bereichen unterschiedlich belegt', () => {
    const quellen = {
      BASIS: alle.FEHLERTYPEN_BASIS,
      C1: FEHLERTYPEN_C1,
      C2: FEHLERTYPEN_C2,
      D: FEHLERTYPEN_D,
      E: FEHLERTYPEN_E,
      F1: FEHLERTYPEN_F1,
      F2: FEHLERTYPEN_F2,
      G: FEHLERTYPEN_G,
      H: FEHLERTYPEN_H,
      IJ: FEHLERTYPEN_IJ,
      J: FEHLERTYPEN_J,
      K1: FEHLERTYPEN_K1,
      K2: FEHLERTYPEN_K2,
    };
    const gesehen = new Map<string, string>();
    const doppelt: string[] = [];
    for (const [name, rec] of Object.entries(quellen))
      for (const id of Object.keys(rec)) {
        if (gesehen.has(id)) doppelt.push(`${id} (${gesehen.get(id)} und ${name})`);
        gesehen.set(id, name);
      }
    expect(doppelt).toEqual([]);
  });

  it('jede Fehlervariante aller Generatoren hat eine Erklärung', () => {
    const fehlend = new Set<string>();
    for (const g of GENERATOREN)
      for (let seed = 1; seed <= 20; seed++)
        for (const v of g.errorVariants(g.generate(createRng(seed))))
          if (!alle.FEHLERTYPEN[v.fehlertyp]) fehlend.add(`${g.skillId}: ${v.fehlertyp}`);
    expect([...fehlend]).toEqual([]);
  });
});
