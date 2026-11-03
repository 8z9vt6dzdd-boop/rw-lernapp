// Verzeichnis aller Lektionen (Reihenfolge = Lernpfad).
import { lektion01 } from './l0-1';
import { lektion03 } from './l0-3';
import { lektion05 } from './l0-5';
import { lektion06 } from './l0-6';
import { lektionC5 } from './lc5';
import { LEKTIONEN_FUNDAMENT } from './batch-fundament';
import { LEKTIONEN_GRUNDLAGEN } from './batch-grundlagen';
import { LEKTIONEN_KLR } from './batch-klr';
import { LEKTIONEN_C1 } from './batch-c1';
import { LEKTIONEN_C2 } from './batch-c2';
import { LEKTIONEN_D } from './batch-d';
import { LEKTIONEN_E } from './batch-e';
import { LEKTIONEN_F1 } from './batch-f1';
import { LEKTIONEN_F2 } from './batch-f2';
import { LEKTIONEN_G } from './batch-g';
import { LEKTIONEN_H } from './batch-h';
import { LEKTIONEN_IJ } from './batch-ij';
import { LEKTIONEN_J } from './batch-j';
import { LEKTIONEN_K1 } from './batch-k1';
import { LEKTIONEN_K2 } from './batch-k2';
import { ABSCHNITTE } from '../curriculum';
import type { Lektion } from './types';

const ALLE: Lektion[] = [
  lektion01,
  lektion03,
  lektion05,
  lektion06,
  lektionC5,
  ...LEKTIONEN_GRUNDLAGEN,
  ...LEKTIONEN_FUNDAMENT,
  ...LEKTIONEN_KLR,
  ...LEKTIONEN_C1,
  ...LEKTIONEN_C2,
  ...LEKTIONEN_D,
  ...LEKTIONEN_E,
  ...LEKTIONEN_F1,
  ...LEKTIONEN_F2,
  ...LEKTIONEN_G,
  ...LEKTIONEN_H,
  ...LEKTIONEN_IJ,
  ...LEKTIONEN_J,
  ...LEKTIONEN_K1,
  ...LEKTIONEN_K2,
];

/** Alle Lektionen in der Reihenfolge des Lernpfads (02-curriculum.md). */
const REIHENFOLGE = new Map(ABSCHNITTE.flatMap((a) => a.skills).map((s, i) => [s.id, i]));
export const LEKTIONEN: readonly Lektion[] = [...ALLE].sort(
  (a, b) => (REIHENFOLGE.get(a.skillId) ?? 999) - (REIHENFOLGE.get(b.skillId) ?? 999),
);

const BY_SKILL = new Map(LEKTIONEN.map((l) => [l.skillId, l]));
const BY_ID = new Map(LEKTIONEN.map((l) => [l.id, l]));

export function lektionFuerSkill(skillId: string): Lektion | undefined {
  return BY_SKILL.get(skillId);
}

export function lektion(id: string): Lektion | undefined {
  return BY_ID.get(id);
}
