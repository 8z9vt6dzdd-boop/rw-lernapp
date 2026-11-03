// Verzeichnis aller Generatoren nach Skill-ID.
import type { Generator } from '../task';
import { aequivalenz } from './aequivalenz';
import { bestandsveraenderung } from './bestandsveraenderung';
import { kalkAfa } from './kalk-afa';
import { simultan, stufenleiter } from './leistungsverrechnung';
import { skontoEinkauf, skontoVerkauf } from './skonto';
import { ustAbschluss } from './ust-abschluss';
import { zuschlag } from './zuschlag';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyGenerator = Generator<any, any>;

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
];

const BY_ID = new Map(GENERATOREN.map((g) => [g.skillId, g]));

export function generatorFuer(skillId: string): AnyGenerator | undefined {
  return BY_ID.get(skillId);
}
