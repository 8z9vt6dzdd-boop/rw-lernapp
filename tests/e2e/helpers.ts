// Hilfen für die Playwright-Durchläufe: Aufgaben mit der Engine nachrechnen und Eingaben ausfüllen.
import { expect, type Page } from '@playwright/test';
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
  satz: number,
  seite: 'soll' | 'haben',
  zeile: number,
  konto: string,
) {
  const block = page.locator(`[data-satz="${satz}"]`);
  const label = seite === 'soll' ? 'Soll' : 'Haben';
  await block.getByRole('button', { name: new RegExp(`^${label}-Konto ${zeile + 1}:`) }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('searchbox', { name: 'Konto suchen' }).fill(getKonto(konto).name);
  await dialog.getByRole('searchbox', { name: 'Konto suchen' }).press('Enter');
  await expect(dialog).toBeHidden();
}

export async function buchungEingeben(page: Page, saetze: SatzEingabe[]) {
  for (const [si, s] of saetze.entries()) {
    const block = page.locator(`[data-satz="${si}"]`);
    if ((await block.count()) === 0)
      await page.getByRole('button', { name: 'weiterer Buchungssatz' }).click();
    for (const seite of ['soll', 'haben'] as const) {
      const label = seite === 'soll' ? 'Soll' : 'Haben';
      for (const [zi, z] of s[seite].entries()) {
        const vorhanden = await block
          .getByRole('button', { name: new RegExp(`^${label}-Konto `) })
          .count();
        if (zi >= vorhanden) await block.getByRole('button', { name: `Zeile ${label}` }).click();
        await waehleKonto(page, si, seite, zi, z.konto);
        await block.getByRole('textbox', { name: `Betrag ${label} ${zi + 1}` }).fill(z.betrag);
      }
    }
  }
}

/** Füllt einen Aufgabenteil mit der richtigen Lösung aus. */
export async function teilLoesen(page: Page, part: TaskPart) {
  switch (part.typ) {
    case 'rechenkette':
    case 'tabelle':
      for (const f of felderVon(part)) {
        if (f.typ === 'auswahl') {
          await page
            .getByRole('radiogroup', { name: f.label, exact: true })
            .getByRole('radio', { name: f.soll, exact: true })
            .click();
        } else {
          const wert =
            f.kind === 'zahl' || f.kind === 'menge'
              ? formatPlain(f.soll.value, f.dp ?? 2)
              : formatNumber(f.soll.exact, f.dp ?? 2);
          await page.getByRole('textbox', { name: f.label, exact: true }).fill(wert);
        }
      }
      return;
    case 'buchungssatz':
      await buchungEingeben(page, eingabeAusLoesung(part.loesung));
      return;
    default: {
      const richtig = part.optionen.find((o) => o.richtig)!;
      await page.getByRole('radio', { name: richtig.text }).click();
    }
  }
}

export { formatSoll };
