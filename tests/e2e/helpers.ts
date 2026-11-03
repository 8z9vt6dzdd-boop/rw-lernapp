// Hilfen für die Playwright-Durchläufe: Aufgaben mit der Engine nachrechnen und Eingaben ausfüllen.
import { expect, type Locator, type Page } from '@playwright/test';
import { felderVon, formatSoll } from '../../src/engine/check';
import { generatorFuer } from '../../src/engine/generators';
import { getKonto } from '../../src/engine/accounts';
import { formatNumber, formatPlain } from '../../src/engine/money';
import { createRng } from '../../src/engine/rng';
import type { SatzEingabe, TaskPart } from '../../src/engine/task';
import { eingabeAusLoesung } from '../../src/engine/testing';

export function teileFuer(skillId: string, seed: number): TaskPart[] {
  const g = generatorFuer(skillId);
  if (!g) throw new Error(`Unbekannter Skill ${skillId}`);
  const p = g.generate(createRng(seed));
  return g.parts(p, g.solve(p));
}

export function sammleFehler(page: Page): string[] {
  const fehler: string[] = [];
  page.on('console', (m) => m.type() === 'error' && fehler.push(m.text()));
  page.on('pageerror', (e) => fehler.push(e.message));
  return fehler;
}

async function waehleKonto(
  page: Page,
  root: Page | Locator,
  satz: number,
  seite: 'soll' | 'haben',
  zeile: number,
  konto: string,
) {
  const block = root.locator(`[data-satz="${satz}"]`);
  const label = seite === 'soll' ? 'Soll' : 'Haben';
  await block.getByRole('button', { name: new RegExp(`^${label}-Konto ${zeile + 1}:`) }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('searchbox', { name: 'Konto suchen' }).fill(getKonto(konto).name);
  await dialog.getByRole('searchbox', { name: 'Konto suchen' }).press('Enter');
  await expect(dialog).toBeHidden();
}

export async function buchungEingeben(
  page: Page,
  saetze: SatzEingabe[],
  root: Page | Locator = page,
) {
  for (const [si, s] of saetze.entries()) {
    const block = root.locator(`[data-satz="${si}"]`);
    if ((await block.count()) === 0)
      await root.getByRole('button', { name: 'weiterer Buchungssatz' }).click();
    for (const seite of ['soll', 'haben'] as const) {
      const label = seite === 'soll' ? 'Soll' : 'Haben';
      for (const [zi, z] of s[seite].entries()) {
        const vorhanden = await block
          .getByRole('button', { name: new RegExp(`^${label}-Konto `) })
          .count();
        if (zi >= vorhanden) await block.getByRole('button', { name: `Zeile ${label}` }).click();
        await waehleKonto(page, root, si, seite, zi, z.konto);
        await block.getByRole('textbox', { name: `Betrag ${label} ${zi + 1}` }).fill(z.betrag);
      }
    }
  }
}

/** Füllt einen Aufgabenteil mit der richtigen Lösung aus. */
export async function teilLoesen(page: Page, part: TaskPart, scope?: Page | Locator) {
  const root = scope ?? page;
  switch (part.typ) {
    case 'rechenkette':
    case 'tabelle':
    case 'tkonto':
    case 'gleichungssystem':
      for (const f of felderVon(part)) {
        if (f.typ === 'auswahl') {
          await root
            .getByRole('radiogroup', { name: f.label, exact: true })
            .getByRole('radio', { name: f.soll, exact: true })
            .click();
        } else {
          const wert =
            f.kind === 'zahl' || f.kind === 'menge'
              ? formatPlain(f.soll.value, f.dp ?? 2)
              : formatNumber(f.soll.exact, f.dp ?? 2);
          await root.getByRole('textbox', { name: f.label, exact: true }).fill(wert);
        }
      }
      return;
    case 'buchungssatz':
      await buchungEingeben(page, eingabeAusLoesung(part.loesung), root);
      return;
    case 'mc':
    case 'aufgabe-erkennen': {
      const richtig = part.optionen.find((o) => o.richtig)!;
      await root.getByRole('radio', { name: richtig.text }).click();
      return;
    }
    case 'fehler-finden': {
      await root.getByRole('button', { name: new RegExp(`^${part.fehlerZeile + 1}\\. `) }).click();
      await root
        .getByRole('radio', { name: part.gruende.find((g) => g.richtig)!.text, exact: true })
        .click();
      return;
    }
    case 'kurzantwort':
      await root.getByRole('textbox', { name: 'Deine Antwort' }).fill(part.muster);
      await root.getByRole('button', { name: /mit den Musterpunkten vergleichen/ }).click();
      for (const c of part.checkliste) {
        await root.getByRole('checkbox', { name: c.aussage, exact: false }).check();
      }
  }
}

export { formatSoll };
