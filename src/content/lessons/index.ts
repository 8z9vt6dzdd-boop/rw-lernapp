// Verzeichnis aller Lektionen (Reihenfolge = Lernpfad).
import { lektion01 } from './l0-1';
import { lektion03 } from './l0-3';
import { lektion05 } from './l0-5';
import { lektion06 } from './l0-6';
import { lektionC5 } from './lc5';
import { LEKTIONEN_FUNDAMENT } from './batch-fundament';
import { LEKTIONEN_GRUNDLAGEN } from './batch-grundlagen';
import { LEKTIONEN_KLR } from './batch-klr';
import type { Lektion } from './types';

export const LEKTIONEN: readonly Lektion[] = [
  lektion01,
  lektion03,
  lektion05,
  lektion06,
  lektionC5,
  ...LEKTIONEN_GRUNDLAGEN,
  ...LEKTIONEN_FUNDAMENT,
  ...LEKTIONEN_KLR,
];

const BY_SKILL = new Map(LEKTIONEN.map((l) => [l.skillId, l]));
const BY_ID = new Map(LEKTIONEN.map((l) => [l.id, l]));

export function lektionFuerSkill(skillId: string): Lektion | undefined {
  return BY_SKILL.get(skillId);
}

export function lektion(id: string): Lektion | undefined {
  return BY_ID.get(id);
}
