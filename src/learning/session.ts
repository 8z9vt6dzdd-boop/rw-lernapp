// Zusammenstellung einer Kurz-Sitzung (5–10 Minuten): ca. 70 % fällige Wiederholungen (FSRS), 30 % Neues
// aus dem aktuellen Abschnitt, gemischt (Interleaving). Ohne Lernstand: freie Mischung (für Tests per Seed).
import { ABSCHNITTE, RELEVANZ_GEWICHT, skillInfo } from '../content/curriculum';
import { elementIdVon, gemeldet } from './meldungen';
import { kurzantwortElemente, mcElemente } from '../content/theory';
import { FEHLERJAGD_ZUSATZ, TABELLEN_ZUSATZ, generatorFuer } from '../engine/generators';
import { createRng, randomSeed, type Rng } from '../engine/rng';
import { hatLektion, lektionErledigt, naechsterKnoten } from './fortschritt';
import type { TaskSpec } from './prepare';
import { abrufwahrscheinlichkeit, faellig, karten } from './scheduler';
import type { LernEreignis } from './types';

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

/** Skills mit großen Tabellen: auf dem Handy im Kurzmodus nur als Teilschritt. */
export const TABELLEN_SKILLS = [
  'I4-stufenleiter',
  'I5-simultan',
  'J3-aequivalenz',
  ...TABELLEN_ZUSATZ,
];

export function kurzSitzung(seed = randomSeed(), opts: { mobil?: boolean } = {}): TaskSpec[] {
  const rng = createRng(seed);
  const rechnen = gewichtetZiehen(rng, KURZ_GEWICHTE, 5);
  // „Aufgabe erkennen“ bevorzugt aus Skills, die in dieser Sitzung nicht gerechnet werden
  const rest = Object.fromEntries(
    Object.entries(KURZ_GEWICHTE).filter(([s]) => !rechnen.includes(s)),
  );
  const erkennen = gewichtetZiehen(rng, Object.keys(rest).length >= 2 ? rest : KURZ_GEWICHTE, 2);
  const specs: TaskSpec[] = [
    ...rechnen.map((skillId) => {
      const spec: TaskSpec = { key: key(), art: 'aufgabe', skillId, seed: randomSeedFrom(rng) };
      if (opts.mobil && TABELLEN_SKILLS.includes(skillId)) spec.teilschritt = true;
      return spec;
    }),
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

export function randomSeedFrom(rng: Rng): number {
  return Math.floor(rng.next() * 2 ** 32);
}

/** Neue Aufgabe desselben Skills nach einem Fehler („Fehler führen zu erneuter Übung“). */
export function wiederholung(spec: TaskSpec): TaskSpec {
  return { ...spec, key: key(), seed: randomSeed(), wiederholung: true };
}

export const SITZUNG_GROESSE = 8;
/** Skills, deren Buchungssatz sich für „Fehler finden“ eignet */
export const FEHLERJAGD_SKILLS = ['C5-skonto-einkauf', 'D4-skonto-verkauf', ...FEHLERJAGD_ZUSATZ];
export const ANTEIL_WIEDERHOLUNG = 0.7;

/** Skills mit Übung, die schon frei sind (Lektion erledigt oder keine Lektion vorhanden). */
export function freieSkills(events: readonly LernEreignis[]): string[] {
  return ABSCHNITTE.flatMap((a) => a.skills.map((s) => s.id)).filter(
    (id) => generatorFuer(id) && (!hatLektion(id) || lektionErledigt(events, id)),
  );
}

/** Mischen so, dass möglichst nie zwei Aufgaben desselben Skills direkt aufeinander folgen. */
export function verschraenken(rng: Rng, specs: TaskSpec[]): TaskSpec[] {
  const a = rng.shuffle(specs);
  for (let i = 1; i < a.length; i++) {
    if (a[i]!.skillId !== a[i - 1]!.skillId) continue;
    const j = a.findIndex(
      (x, k) =>
        k > i &&
        x.skillId !== a[i - 1]!.skillId &&
        (k + 1 >= a.length || a[k + 1]!.skillId !== a[i]!.skillId),
    );
    if (j > 0) [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/**
 * Geplante Kurz-Sitzung. Gibt eine leere Liste zurück, wenn noch nichts frei ist (dann zuerst eine Lektion).
 */
export function kurzSitzungGeplant(
  events: readonly LernEreignis[],
  now: Date,
  seed = randomSeed(),
  opts: { mobil?: boolean } = {},
): TaskSpec[] {
  const rng = createRng(seed);
  const k = karten(events);
  const gem = gemeldet(events);
  const frei = new Set(freieSkills(events).filter((id) => !gem.has(`aufgabe:${id}`)));
  const gewicht = (skillId: string) => RELEVANZ_GEWICHT[skillInfo(skillId)?.relevanz ?? 'mittel'];
  const aufgabe = (skillId: string): TaskSpec => {
    const spec: TaskSpec = { key: key(), art: 'aufgabe', skillId, seed: randomSeedFrom(rng) };
    if (opts.mobil && TABELLEN_SKILLS.includes(skillId)) spec.teilschritt = true;
    return spec;
  };
  const karteSpec = (id: string, skillId: string): TaskSpec => ({
    key: key(),
    art: 'karte',
    skillId,
    seed: randomSeedFrom(rng),
    elementId: id,
  });

  // 1. Fällige Wiederholungen: geringste Abrufwahrscheinlichkeit × Klausurrelevanz zuerst
  const faelligeKarten = [...k.values()]
    .filter(
      (x) => x.wiederholungen > 0 && faellig(x, now) && (x.art === 'karte' || frei.has(x.skillId)),
    )
    .map((x) => ({ x, prio: (1 - abrufwahrscheinlichkeit(x, now)) * gewicht(x.skillId) }))
    .sort((a, b) => b.prio - a.prio)
    .slice(0, Math.ceil(SITZUNG_GROESSE * ANTEIL_WIEDERHOLUNG))
    .map(({ x }) =>
      x.art === 'karte' ? karteSpec(x.id.slice('karte:'.length), x.skillId) : aufgabe(x.skillId),
    );

  // 2. Neues aus dem aktuellen Abschnitt: freie Skills ohne bisherige Übung und neue Merksatz-Karten
  const naechster = naechsterKnoten(events);
  const aktuellerAbschnitt = ABSCHNITTE.find((a) =>
    a.skills.some((s) => s.id === naechster?.skill.id),
  );
  // Vorrang: Skills, deren Lektion gerade erledigt ist; dann der aktuelle Abschnitt; dann der Rest
  const rang = (id: string) =>
    hatLektion(id) && lektionErledigt(events, id)
      ? 0
      : aktuellerAbschnitt?.skills.some((s) => s.id === id)
        ? 1
        : 2;
  const neueSkills = [...frei]
    .filter((id) => !(k.get(id)?.wiederholungen ?? 0))
    .sort((a, b) => rang(a) - rang(b));
  const neueKarten = [...k.values()].filter((x) => x.art === 'karte' && x.wiederholungen === 0);
  // Übungen und Merksatz-Karten abwechselnd
  const neu: TaskSpec[] = [];
  for (let n = 0; n < Math.max(neueSkills.length, neueKarten.length); n++) {
    if (neueSkills[n]) neu.push(aufgabe(neueSkills[n]!));
    const karte = neueKarten[n];
    if (karte) neu.push(karteSpec(karte.id.slice('karte:'.length), karte.skillId));
  }
  const specs: TaskSpec[] = [
    ...faelligeKarten,
    ...neu.slice(
      0,
      Math.max(
        SITZUNG_GROESSE - faelligeKarten.length,
        Math.floor(SITZUNG_GROESSE * (1 - ANTEIL_WIEDERHOLUNG)),
      ),
    ),
  ];

  // 3. Auffüllen: weitere Übungen der freien Skills (schwächste zuerst) und „Aufgabe erkennen“
  const r = (id: string) => {
    const c = k.get(id);
    return c ? abrufwahrscheinlichkeit(c, now) : 0;
  };
  const geuebt = [...frei].sort((a, b) => r(a) - r(b));
  let i = 0;
  while (specs.length < SITZUNG_GROESSE - 2 && geuebt.length > 0 && i < 20)
    specs.push(aufgabe(geuebt[i++ % geuebt.length]!));
  if (frei.size >= 2) {
    for (const skillId of rng.shuffle([...frei]).slice(0, 2))
      specs.push({ key: key(), art: 'erkennen', skillId, seed: randomSeedFrom(rng) });
  }
  // Eine Verständnisfrage aus den Theorie-Inhalten bereits gelernter Skills
  const fragen = mcElemente().filter(
    (el) =>
      hatLektion(el.skill) && lektionErledigt(events, el.skill) && !gem.has(`theorie:${el.id}`),
  );
  if (fragen.length > 0) {
    const el = rng.pick(fragen);
    specs.push({
      key: key(),
      art: 'mc',
      skillId: el.skill,
      seed: randomSeedFrom(rng),
      elementId: el.id,
    });
  }
  // Am Laptop: eine Kurzantwort im Klausurstil zu einem gelernten Theorie-Thema
  if (!opts.mobil) {
    const ka = kurzantwortElemente().filter(
      (el) =>
        hatLektion(el.skill) && lektionErledigt(events, el.skill) && !gem.has(`theorie:${el.id}`),
    );
    if (ka.length > 0) {
      const el = rng.pick(ka);
      specs.push({
        key: key(),
        art: 'kurzantwort',
        skillId: el.skill,
        seed: randomSeedFrom(rng),
        elementId: el.id,
      });
    }
  }
  // Gemeldete Inhalte kommen bis zur Prüfung nicht mehr vor
  const erlaubt = specs.filter((s) => !gem.has(elementIdVon(s)));
  if (erlaubt.length === 0) return [];
  return verschraenken(rng, erlaubt.slice(0, SITZUNG_GROESSE + 2));
}
