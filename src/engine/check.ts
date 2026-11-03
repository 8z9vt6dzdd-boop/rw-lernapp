// Allgemeine Bewertung der Aufgabenteile. Generatoren liefern nur Teile und Fehlervarianten.
import {
  erkenneBuchungsfehler,
  parseEingabe,
  vergleicheBuchung,
  type BuchungsVergleich,
} from './booking';
import { bewerte, formatNumber, formatPlain, parseNumber, type Bewertung } from './money';
import type {
  BuchungPart,
  CheckResult,
  ErrorVariant,
  Feld,
  FeldErgebnis,
  PartAnswer,
  PartResult,
  TaskAnswer,
  TaskPart,
  ZahlFeld,
} from './task';

export function felderVon(part: TaskPart): Feld[] {
  if (part.typ === 'rechenkette') return part.felder;
  if (part.typ === 'tabelle') {
    return part.zeilen.flatMap((z) => z.zellen.filter((c): c is ZahlFeld => c.typ === 'zahl'));
  }
  return [];
}

export function formatSoll(f: Feld): string {
  if (f.typ === 'auswahl') return f.soll;
  const s =
    f.kind === 'zahl' || f.kind === 'menge'
      ? formatPlain(f.soll.value, f.dp ?? 2)
      : formatNumber(f.soll.exact, f.dp ?? 2);
  return f.einheit ? `${s} ${f.einheit}` : s;
}

export function bewerteFeld(f: Feld, eingabe: string | undefined): Bewertung {
  const raw = (eingabe ?? '').trim();
  if (f.typ === 'auswahl') return raw === f.soll ? 'richtig' : 'falsch';
  const n = parseNumber(raw);
  if (!n) return 'falsch';
  return bewerte(n, f.soll, f.kind, f.dp ?? (f.kind === 'menge' ? 0 : 2));
}

function partWeight(part: TaskPart): number {
  switch (part.typ) {
    case 'rechenkette':
    case 'tabelle':
      return Math.max(1, felderVon(part).length);
    case 'buchungssatz':
      return Math.max(
        1,
        part.loesung.saetze.reduce((a, s) => a + s.soll.length + s.haben.length, 0),
      );
    default:
      return 1;
  }
}

type VPart = { fehlertyp: string; part: TaskPart };

function checkFelder(
  part: TaskPart,
  answer: PartAnswer | undefined,
  variants: VPart[],
): PartResult {
  const werte = answer?.typ === 'felder' ? answer.werte : {};
  const felder = felderVon(part);
  const ergebnisse: Record<string, FeldErgebnis> = {};
  let richtig = 0;
  let rundung = false;
  for (const f of felder) {
    const b = bewerteFeld(f, werte[f.id]);
    if (b !== 'falsch') richtig++;
    if (b === 'rundung') rundung = true;
    ergebnisse[f.id] = { bewertung: b, eingabe: werte[f.id] ?? '', erwartet: formatSoll(f) };
  }
  const fehlertypen = new Set<string>();
  for (const { fehlertyp, part: vp } of variants) {
    const vFelder = new Map(felderVon(vp).map((f) => [f.id, f]));
    for (const f of felder) {
      if (ergebnisse[f.id]?.bewertung !== 'falsch') continue;
      const vf = vFelder.get(f.id);
      if (!vf || formatSoll(vf) === formatSoll(f)) continue;
      if (bewerteFeld(vf, werte[f.id]) !== 'falsch') fehlertypen.add(fehlertyp);
    }
  }
  const n = felder.length;
  const feedback: string[] = [];
  if (n > 0) {
    feedback.push(
      richtig === n
        ? n === 1
          ? 'Der Wert stimmt.'
          : `Alle ${n} Werte stimmen.`
        : `${richtig} von ${n} Werten stimmen.`,
    );
  }
  return {
    partId: part.id,
    korrekt: richtig === n,
    score: n === 0 ? 1 : richtig / n,
    feedback,
    felder: ergebnisse,
    fehlertypen: [...fehlertypen],
    rundungshinweis: rundung,
  };
}

function bestBuchung(part: BuchungPart, answer: PartAnswer | undefined) {
  const eingabe = answer?.typ === 'buchung' ? answer.saetze : [];
  const { saetze, probleme } = parseEingabe(eingabe);
  const kandidaten = [part.loesung, ...(part.alternativen ?? [])];
  let best: { v: BuchungsVergleich; loesung: (typeof kandidaten)[number] } | null = null;
  for (const l of kandidaten) {
    const v = vergleicheBuchung(l, saetze);
    if (!best || v.score > best.v.score) best = { v, loesung: l };
  }
  return { best: best!, saetze, probleme };
}

function checkBuchung(
  part: BuchungPart,
  answer: PartAnswer | undefined,
  variants: VPart[],
): PartResult {
  const { best, saetze, probleme } = bestBuchung(part, answer);
  const { v } = best;
  const feedback: string[] = [...probleme];
  const zeilen = v.zeilen;
  const n = zeilen.length;
  const kontenOk = zeilen.filter(
    (z) => z.status === 'richtig' || z.status === 'betrag-falsch',
  ).length;
  const betraegeOk = zeilen.filter((z) => z.status === 'richtig').length;
  if (saetze.length === 0) {
    feedback.push('Es wurde noch keine Buchung eingegeben.');
  } else if (v.korrekt) {
    feedback.push(
      v.zusammengefasst
        ? 'Richtig gebucht (zusammengefasst bzw. aufgeteilt – fachlich gleichwertig).'
        : 'Konten, Seiten und Beträge stimmen.',
    );
    if (best.loesung.methode && part.alternativen?.length) {
      feedback.push(`Erkannt als ${best.loesung.methode}.`);
    }
  } else {
    feedback.push(
      kontenOk === n
        ? 'Alle Konten stehen auf der richtigen Seite.'
        : `${kontenOk} von ${n} Konten richtig auf Soll/Haben.`,
    );
    feedback.push(
      betraegeOk === n ? 'Alle Beträge stimmen.' : `${betraegeOk} von ${n} Beträgen stimmen.`,
    );
    if (v.ueberzaehlig.length > 0) {
      feedback.push(
        `Nicht erwartet: ${v.ueberzaehlig.map((z) => `${z.konto} (${z.seite === 'soll' ? 'Soll' : 'Haben'})`).join(', ')}.`,
      );
    }
    if (v.unausgeglichen.length > 0) feedback.push('Soll und Haben sind nicht gleich hoch.');
    if (v.anzahlHinweis) {
      feedback.push(
        v.anzahlHinweis === 1
          ? 'Erwartet wird ein Buchungssatz.'
          : `Erwartet werden ${v.anzahlHinweis} getrennte Buchungssätze.`,
      );
    }
  }
  const fehlertypen = v.korrekt
    ? []
    : erkenneBuchungsfehler(
        best.loesung,
        variants.flatMap(({ fehlertyp, part: vp }) =>
          vp.typ === 'buchungssatz' ? [{ fehlertyp, loesung: vp.loesung }] : [],
        ),
        saetze,
      );
  return {
    partId: part.id,
    korrekt: v.korrekt && probleme.length === 0,
    score: probleme.length > 0 ? v.score * 0.9 : v.score,
    feedback,
    zeilen,
    ueberzaehlig: v.ueberzaehlig,
    fehlertypen,
    rundungshinweis: v.rundung,
  };
}

export function checkPart(
  part: TaskPart,
  answer: PartAnswer | undefined,
  variants: readonly ErrorVariant[],
): PartResult {
  // Fehlervarianten: gleicher Teil (gleiche ID) aus einem fehlerhaften Lösungsweg.
  const vparts: VPart[] = [];
  for (const v of variants) {
    const vp = v.parts.find((p) => p.id === part.id);
    if (vp) vparts.push({ fehlertyp: v.fehlertyp, part: vp });
  }
  switch (part.typ) {
    case 'rechenkette':
    case 'tabelle':
      return checkFelder(part, answer, vparts);
    case 'buchungssatz':
      return checkBuchung(part, answer, vparts);
    case 'mc':
    case 'aufgabe-erkennen': {
      const id = answer?.typ === 'wahl' ? answer.optionId : undefined;
      const opt = part.optionen.find((o) => o.id === id);
      const korrekt = opt?.richtig === true;
      const feedback: string[] = [];
      if (!opt) feedback.push('Keine Antwort gewählt.');
      else if (korrekt) feedback.push('Richtig.');
      else if (opt.erklaerung) feedback.push(opt.erklaerung);
      else feedback.push('Nicht richtig.');
      return {
        partId: part.id,
        korrekt,
        score: korrekt ? 1 : 0,
        feedback,
        fehlertypen: !korrekt && opt?.fehlertyp ? [opt.fehlertyp] : [],
        rundungshinweis: false,
      };
    }
  }
}

export function combineResults(
  parts: readonly TaskPart[],
  results: readonly PartResult[],
): CheckResult {
  let total = 0;
  let weighted = 0;
  for (const p of parts) {
    const w = partWeight(p);
    total += w;
    weighted += w * (results.find((r) => r.partId === p.id)?.score ?? 0);
  }
  const fehlertypen = [...new Set(results.flatMap((r) => r.fehlertypen))];
  return {
    korrekt: parts.every((p) => results.find((r) => r.partId === p.id)?.korrekt === true),
    score: total === 0 ? 0 : weighted / total,
    parts: [...results],
    fehlertypen,
    rundungshinweis: results.some((r) => r.rundungshinweis),
  };
}

export function checkTask(
  parts: readonly TaskPart[],
  variants: readonly ErrorVariant[],
  answer: TaskAnswer,
): CheckResult {
  return combineResults(
    parts,
    parts.map((p) => checkPart(p, answer[p.id], variants)),
  );
}
