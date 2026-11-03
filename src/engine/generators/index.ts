// Verzeichnis aller Generatoren nach Skill-ID.
import type { Generator } from '../task';
import { aequivalenz } from './aequivalenz';
import { bestandsveraenderung } from './bestandsveraenderung';
import { kalkAfa } from './kalk-afa';
import { simultan, stufenleiter } from './leistungsverrechnung';
import { skontoEinkauf, skontoVerkauf } from './skonto';
import { ustAbschluss } from './ust-abschluss';
import { zuschlag } from './zuschlag';
import { BATCH_C1 } from './batches/c1';
import { BATCH_C2 } from './batches/c2';
import { BATCH_D } from './batches/d';
import { BATCH_E } from './batches/e';
import { BATCH_F1 } from './batches/f1';
import { BATCH_F2 } from './batches/f2';
import { BATCH_G } from './batches/g';
import { BATCH_H } from './batches/h';
import { BATCH_IJ } from './batches/ij';
import { BATCH_J } from './batches/j';
import { BATCH_K1 } from './batches/k1';
import { BATCH_K2 } from './batches/k2';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyGenerator = Generator<any, any>;

const BATCHES = [
  BATCH_C1,
  BATCH_C2,
  BATCH_D,
  BATCH_E,
  BATCH_F1,
  BATCH_F2,
  BATCH_G,
  BATCH_H,
  BATCH_IJ,
  BATCH_J,
  BATCH_K1,
  BATCH_K2,
];

/** Zusätzliche Tabellen- und Fehlerjagd-Skills aus den Batches (für die Kurz-Sitzung). */
export const TABELLEN_ZUSATZ: readonly string[] = BATCHES.flatMap((b) => b.tabellen);
export const FEHLERJAGD_ZUSATZ: readonly string[] = BATCHES.flatMap((b) => b.fehlerjagd);

export const GENERATOREN: readonly AnyGenerator[] = [
  ustAbschluss,
  skontoEinkauf,
  skontoVerkauf,
  bestandsveraenderung,
  kalkAfa,
  stufenleiter,
  simultan,
  aequivalenz,
  zuschlag,
  ...BATCHES.flatMap((b) => b.generatoren),
];

const BY_ID = new Map(GENERATOREN.map((g) => [g.skillId, g]));

export function generatorFuer(skillId: string): AnyGenerator | undefined {
  return BY_ID.get(skillId);
}
