// Zusammenstellung einer Kurz-Sitzung (5–10 Minuten). Bis zum Lernpfad mit Wiederholungsplanung
// (Meilenstein 3) wird gemischt aus allen vorhandenen Aufgabentypen gezogen (Interleaving).
import { mcElemente } from '../content/theory';
import { createRng, randomSeed, type Rng } from '../engine/rng';
import type { TaskSpec } from './prepare';

/** Gewichte für den Kurzmodus: tabellenlastige Verfahren seltener auf dem Handy. */
const KURZ_GEWICHTE: Record<string, number> = {
  'B3-ust-abschluss': 1,
  'C5-skonto-einkauf': 1,
  'D4-skonto-verkauf': 1,
  'E4-bestandsveraenderung': 1,
  'H4-kalk-afa': 1,
  'J3-aequivalenz': 0.7,
  'J4-zuschlag': 1,
  'I4-stufenleiter': 0.5,
  'I5-simultan': 0.4,
};

function gewichtetZiehen(rng: Rng, gewichte: Record<string, number>, n: number): string[] {
  const pool = Object.entries(gewichte);
  const out: string[] = [];
  while (out.length < n && pool.length > 0) {
    const total = pool.reduce((a, [, w]) => a + w, 0);
    let x = rng.next() * total;
    const idx = pool.findIndex(([, w]) => (x -= w) < 0);
    const [skill] = pool.splice(idx < 0 ? pool.length - 1 : idx, 1)[0]!;
    out.push(skill);
  }
  return out;
}

let zaehler = 0;
function key(): string {
  zaehler += 1;
  return `t${Date.now().toString(36)}${zaehler}`;
}

export function kurzSitzung(seed = randomSeed()): TaskSpec[] {
  const rng = createRng(seed);
  const rechnen = gewichtetZiehen(rng, KURZ_GEWICHTE, 5);
  // „Aufgabe erkennen“ bevorzugt aus Skills, die in dieser Sitzung nicht gerechnet werden
  const rest = Object.fromEntries(
    Object.entries(KURZ_GEWICHTE).filter(([s]) => !rechnen.includes(s)),
  );
  const erkennen = gewichtetZiehen(rng, Object.keys(rest).length >= 2 ? rest : KURZ_GEWICHTE, 2);
  const specs: TaskSpec[] = [
    ...rechnen.map((skillId) => ({
      key: key(),
      art: 'aufgabe' as const,
      skillId,
      seed: randomSeedFrom(rng),
    })),
    ...erkennen.map((skillId) => ({
      key: key(),
      art: 'erkennen' as const,
      skillId,
      seed: randomSeedFrom(rng),
    })),
  ];
  const mc = mcElemente();
  if (mc.length > 0) {
    const el = rng.pick(mc);
    specs.push({
      key: key(),
      art: 'mc',
      skillId: el.skill,
      seed: randomSeedFrom(rng),
      elementId: el.id,
    });
  }
  return rng.shuffle(specs);
}

function randomSeedFrom(rng: Rng): number {
  return Math.floor(rng.next() * 2 ** 32);
}

/** Neue Aufgabe desselben Skills nach einem Fehler („Fehler führen zu erneuter Übung“). */
export function wiederholung(spec: TaskSpec): TaskSpec {
  return { ...spec, key: key(), seed: randomSeed(), wiederholung: true };
}
