// Fallmodus und Klausuren am Laptop: vollständig bearbeiten, Punkte und Auswertung prüfen.
import { expect, test } from '@playwright/test';
import { geschaeftsgangFall } from '../../src/engine/faelle/geschaeftsgang';
import { klrFall } from '../../src/engine/faelle/klr-fall';
import { klausurTask, miniKlausur, probeklausur } from '../../src/learning/klausur';
import { sammleFehler, teilLoesen } from './helpers';

test.use({ viewport: { width: 1280, height: 900 } });

async function ohneBegruessung(page: import('@playwright/test').Page) {
  await page.goto('./');
}

for (const [id, erstelle, max] of [
  ['geschaeftsgang', geschaeftsgangFall, 37],
  ['klr', klrFall, 30],
] as const) {
  test(`Fall ${id} vollständig richtig lösen`, async ({ page }) => {
    test.setTimeout(180_000);
    const fehler = sammleFehler(page);
    const seed = 4242;
    const fall = erstelle(seed);
    await ohneBegruessung(page);
    await page.goto(`./#/fall/${id}?seed=${seed}`);
    await page.getByRole('button', { name: 'Fall starten' }).click();
    for (const schritt of fall.schritte) {
      await expect(page.getByRole('heading', { name: schritt.text.titel, level: 2 })).toBeVisible();
      for (const part of schritt.parts) {
        const scope = page.locator(`[data-part="${part.id}"]`);
        await teilLoesen(page, part, scope);
        await page.getByRole('button', { name: 'Prüfen' }).click();
        await expect(page.getByText('Richtig', { exact: true }).last()).toBeVisible();
        await page.locator('form').evaluate((f: HTMLFormElement) => f.requestSubmit());
      }
    }
    await expect(page.getByText('Fall abgeschlossen')).toBeVisible();
    await expect(page.getByText(`${max} von ${max} Punkten`)).toBeVisible();
    expect(fehler).toEqual([]);
  });
}

test('Probeklausur: alle Aufgaben richtig ergeben 90 von 90 Punkten mit Skill-Auswertung', async ({
  page,
}) => {
  test.setTimeout(300_000);
  const fehler = sammleFehler(page);
  const seed = 77;
  const plan = probeklausur(seed);
  await ohneBegruessung(page);
  await page.goto(`./#/klausur/probe?seed=${seed}`);
  await page.getByRole('button', { name: 'Klausur beginnen' }).click();
  await expect(page.getByRole('timer')).toContainText('Noch etwa 90 Minuten');
  for (const [i, a] of plan.aufgaben.entries()) {
    const t = klausurTask(a);
    await expect(page.getByRole('heading', { name: t.text.titel, level: 2 })).toBeVisible();
    for (const part of t.parts)
      await teilLoesen(page, part, page.locator(`[data-part="${part.id}"]`));
    if (i < plan.aufgaben.length - 1)
      await page.getByRole('button', { name: 'Nächste Aufgabe' }).click();
  }
  await page.getByRole('button', { name: 'Abgeben' }).click();
  await expect(
    page.getByText(`${plan.aufgaben.length} von ${plan.aufgaben.length} Aufgaben bearbeitet`),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Jetzt abgeben' }).click();
  await expect(page.getByText('von 90 Punkten (100 %)')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Nach Themen' })).toBeVisible();
  // Protokoll in der Übersicht
  await page.getByRole('button', { name: 'Zur Übersicht' }).click();
  await expect(page.getByText(/Zuletzt: 90 von 90 Punkten/)).toBeVisible();
  expect(fehler).toEqual([]);
});

test('Mini-Klausur: leere Abgabe wird ruhig mit 0 Punkten bewertet', async ({ page }) => {
  const fehler = sammleFehler(page);
  const plan = miniKlausur('I', 5);
  await ohneBegruessung(page);
  await page.goto('./#/klausur/mini/I?seed=5');
  await page.getByRole('button', { name: 'Klausur beginnen' }).click();
  await page.getByRole('button', { name: 'Abgeben' }).click();
  await page.getByRole('button', { name: 'Jetzt abgeben' }).click();
  await expect(
    page.getByText(`von ${plan.aufgaben.reduce((a, x) => a + x.punkte, 0)} Punkten (0 %)`),
  ).toBeVisible();
  await expect(page.getByText('Noch unter der Hälfte der Punkte')).toBeVisible();
  expect(fehler).toEqual([]);
});
