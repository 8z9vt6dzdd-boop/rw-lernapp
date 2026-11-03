// Mini-Klausur je Abschnitt und Probeklausur (02-curriculum.md, Probeklausur-Verteilung).
// 1 Punkt = 1 Minute. Bewertet wird ohne Hilfen; Teilpunkte nach dem Anteil richtiger Felder und Zeilen.
import { ABSCHNITTE } from '../content/curriculum';
import { checkTask } from '../engine/check';
import { geschaeftsgangFall } from '../engine/faelle/geschaeftsgang';
import { klrFall } from '../engine/faelle/klr-fall';
import type { Fall, FallSchritt } from '../engine/faelle/types';
import { generatorFuer } from '../engine/generators';
import { createRng } from '../engine/rng';
import { randomSeedFrom } from './session';
import type { CheckResult, TaskAnswer } from '../engine/task';
import { prepareTask, type PreparedTask } from './prepare';

/** Teilkosten-Skills, aus denen bei zugeschalteten Teilkosten eine Aufgabe gezogen wird. */
export const TEILKOSTEN_SKILLS = [
  'K3-break-even',
  'K5-preisuntergrenze',
  'K6-engpass',
  'K7-make-or-buy',
  'K4-db-mehrstufig',
];

export interface KlausurAufgabe {
  key: string;
  titel: string;
  skillId: string;
  seed: number;
  punkte: number;
  variant?: string;
  /** Schritt aus einem Fall statt einer Generator-Aufgabe */
  fall?: { id: 'geschaeftsgang' | 'klr'; schritt: string };
}

export interface KlausurPlan {
  id: string;
  art: 'mini' | 'probe';
  titel: string;
  abschnittId?: string;
  minuten: number;
  aufgaben: KlausurAufgabe[];
  /** Hinweis, z. B. zu noch fehlenden Teilkosten-Aufgaben */
  hinweis?: string;
}

const FALL: Record<'geschaeftsgang' | 'klr', (seed: number) => Fall> = {
  geschaeftsgang: geschaeftsgangFall,
  klr: klrFall,
};

export function schrittAlsTask(
  fallId: string,
  seed: number,
  schritt: FallSchritt,
  key = `${fallId}-${schritt.id}`,
): PreparedTask {
  return {
    spec: {
      key,
      art: 'aufgabe',
      skillId: schritt.skillId,
      seed,
      variant: `fall-${fallId}-${schritt.id}`,
    },
    text: schritt.text,
    parts: schritt.parts,
    variants: schritt.variants,
    hints: schritt.hints,
    steps: schritt.steps,
    params: { fall: fallId, seed, schritt: schritt.id },
    solution: {},
    points: schritt.punkte,
  };
}

/** Aufgabe einer Klausur als vorbereitete Aufgabe (deterministisch aus Seed und Skill). */
export function klausurTask(a: KlausurAufgabe): PreparedTask {
  if (a.fall) {
    const f = FALL[a.fall.id](a.seed);
    const schritt = f.schritte.find((s) => s.id === a.fall!.schritt)!;
    return { ...schrittAlsTask(a.fall.id, a.seed, schritt, a.key), points: a.punkte };
  }
  const spec = { key: a.key, art: 'aufgabe' as const, skillId: a.skillId, seed: a.seed };
  const t = prepareTask(a.variant ? { ...spec, variant: a.variant } : spec);
  return { ...t, points: a.punkte };
}

/** Skills mit Rechenübung (Generator oder Fall) in einem Abschnitt. */
export function klausurSkills(abschnittId: string): string[] {
  const a = ABSCHNITTE.find((x) => x.id === abschnittId);
  if (!a) return [];
  return a.skills
    .filter((s) => generatorFuer(s.id) || s.id === 'E5-geschaeftsgang')
    .map((s) => s.id);
}

export function miniKlausurMoeglich(abschnittId: string): boolean {
  return klausurSkills(abschnittId).length > 0;
}

export function miniKlausur(abschnittId: string, seed: number): KlausurPlan {
  const rng = createRng(seed);
  const a = ABSCHNITTE.find((x) => x.id === abschnittId)!;
  const skills = klausurSkills(abschnittId);
  const aufgaben: KlausurAufgabe[] = [];
  const liste =
    skills.length >= 3 ? skills.slice(0, 4) : [...skills, ...skills, ...skills].slice(0, 3);
  liste.forEach((skillId, i) => {
    const s = randomSeedFrom(rng);
    if (skillId === 'E5-geschaeftsgang') {
      aufgaben.push({
        key: `m${i}`,
        titel: 'Geschäftsgang: laufende Buchungen',
        skillId,
        seed: s,
        punkte: 12,
        fall: { id: 'geschaeftsgang', schritt: 'laufend' },
      });
      return;
    }
    const g = generatorFuer(skillId)!;
    aufgaben.push({
      key: `m${i}`,
      titel: g.titel,
      skillId,
      seed: s,
      punkte: Math.min(g.points, 10),
    });
  });
  return {
    id: `mini-${abschnittId}-${seed}`,
    art: 'mini',
    titel: `Mini-Klausur ${a.id}: ${a.titel}`,
    abschnittId,
    minuten: aufgaben.reduce((x, y) => x + y.punkte, 0),
    aufgaben,
  };
}

/** Probeklausur mit 90 Punkten: ca. 40 Buchführung, ca. 50 Kosten- und Leistungsrechnung. */
export function probeklausur(seed: number, opts: { teilkosten?: boolean } = {}): KlausurPlan {
  const rng = createRng(seed);
  const s = () => randomSeedFrom(rng);
  const gg = s();
  const abschlussSkill = rng.pick(['B3-ust-abschluss', 'E4-bestandsveraenderung']);
  const lvSkill = rng.pick(['I4-stufenleiter', 'I5-simultan']);
  const kalkSkill = rng.pick(['J4-zuschlag', 'J3-aequivalenz']);
  const aufgaben: KlausurAufgabe[] = [
    {
      key: 'a1',
      titel: 'Buchungssätze im Geschäftsjahr',
      skillId: 'E5-geschaeftsgang',
      seed: gg,
      punkte: 12,
      fall: { id: 'geschaeftsgang', schritt: 'laufend' },
    },
    { key: 'a2', titel: 'Lieferantenskonto', skillId: 'C5-skonto-einkauf', seed: s(), punkte: 4 },
    { key: 'a3', titel: 'Kundenskonto', skillId: 'D4-skonto-verkauf', seed: s(), punkte: 4 },
    {
      key: 'a4',
      titel: generatorFuer(abschlussSkill)!.titel,
      skillId: abschlussSkill,
      seed: s(),
      punkte: 10,
    },
    {
      key: 'a5',
      titel: 'Vorbereitende Abschlussbuchungen',
      skillId: 'E5-geschaeftsgang',
      seed: gg,
      punkte: 10,
      fall: { id: 'geschaeftsgang', schritt: 'abschluss' },
    },
    { key: 'a6', titel: generatorFuer(lvSkill)!.titel, skillId: lvSkill, seed: s(), punkte: 24 },
    {
      key: 'a7',
      titel: generatorFuer(kalkSkill)!.titel,
      skillId: kalkSkill,
      seed: s(),
      punkte: 20,
    },
    {
      key: 'a8',
      titel: 'Kalkulatorische Abschreibung',
      skillId: 'H4-kalk-afa',
      seed: s(),
      punkte: 6,
    },
  ];
  const plan: KlausurPlan = {
    id: `probe-${seed}`,
    art: 'probe',
    titel: 'Probeklausur Rechnungswesen',
    minuten: 90,
    aufgaben,
  };
  if (opts.teilkosten) {
    // 02-curriculum: Eine K-Aufgabe (15 P.) ersetzt die BAB- oder Kalkulationsaufgabe; die
    // Leistungsverrechnung bekommt die übrigen 5 Punkte, damit es bei 90 Punkten bleibt.
    const kSkills = TEILKOSTEN_SKILLS.filter((id) => generatorFuer(id));
    if (kSkills.length > 0) {
      const kSkill = rng.pick(kSkills);
      plan.aufgaben = plan.aufgaben.map((a) =>
        a.key === 'a7'
          ? {
              key: 'a7',
              titel: generatorFuer(kSkill)!.titel,
              skillId: kSkill,
              seed: s(),
              punkte: 15,
            }
          : a.key === 'a6'
            ? { ...a, punkte: 29 }
            : a,
      );
    } else {
      plan.hinweis =
        'Teilkosten-Aufgaben kommen mit dem nächsten Ausbau dazu. Bis dahin enthält die Probeklausur nur Vollkosten-Aufgaben.';
    }
  }
  return plan;
}

// ---------- Bewertung ----------

export interface AufgabenErgebnis {
  key: string;
  skillId: string;
  titel: string;
  punkte: number;
  max: number;
  check: CheckResult;
}

export interface KlausurErgebnis {
  punkte: number;
  max: number;
  prozent: number;
  aufgaben: AufgabenErgebnis[];
  /** je Skill: erreichte und mögliche Punkte, schwächste zuerst */
  skills: { skillId: string; punkte: number; max: number }[];
}

/** Teilpunkte auf halbe Punkte abrunden (wie bei der Korrektur üblich). */
export function punkteAus(score: number, max: number): number {
  return Math.floor(score * max * 2 + 1e-9) / 2;
}

export function bewerteKlausur(
  plan: KlausurPlan,
  antworten: Record<string, TaskAnswer>,
): KlausurErgebnis {
  const aufgaben = plan.aufgaben.map((a) => {
    const t = klausurTask(a);
    const check = checkTask(t.parts, t.variants, antworten[a.key] ?? {});
    return {
      key: a.key,
      skillId: a.skillId,
      titel: a.titel,
      punkte: punkteAus(check.score, a.punkte),
      max: a.punkte,
      check,
    };
  });
  const punkte = aufgaben.reduce((x, y) => x + y.punkte, 0);
  const max = aufgaben.reduce((x, y) => x + y.max, 0);
  const jeSkill = new Map<string, { punkte: number; max: number }>();
  for (const a of aufgaben) {
    const v = jeSkill.get(a.skillId) ?? { punkte: 0, max: 0 };
    jeSkill.set(a.skillId, { punkte: v.punkte + a.punkte, max: v.max + a.max });
  }
  const skills = [...jeSkill.entries()]
    .map(([skillId, v]) => ({ skillId, ...v }))
    .sort((x, y) => x.punkte / x.max - y.punkte / y.max);
  return { punkte, max, prozent: max > 0 ? Math.round((punkte / max) * 100) : 0, aufgaben, skills };
}
