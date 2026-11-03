// Bildschirmfotos Fallmodus, Klausur, Firma, Statistik (nur mit SCREENS=1).
import { test } from '@playwright/test';
import { geschaeftsgangFall } from '../../src/engine/faelle/geschaeftsgang';
import { klausurTask, miniKlausur } from '../../src/learning/klausur';
import { teilLoesen } from './helpers';

test.skip(!process.env.SCREENS, 'nur auf Anfrage');

const ziel = (name: string, p: string) => `test-results/screens/${p}-${name}.png`;

for (const theme of ['hell', 'dunkel'] as const) {
  test(`M4/M5-Bildschirme ${theme}`, async ({ page }, info) => {
    test.setTimeout(180_000);
    const p = `${info.project.name}-${theme}`;
    await page.goto('./#/einstellungen');
    await page.getByRole('radio', { name: theme === 'hell' ? 'Hell' : 'Dunkel' }).click();
    await page.goto('./#/pruefen');
    await page.screenshot({ path: ziel('pruefen', p), fullPage: true });

    // Fall: erster Schritt mit einem gelösten und einem falschen Teil
    await page.goto('./#/fall/geschaeftsgang?seed=4242');
    const hier = page.getByRole('button', { name: 'Trotzdem hier lösen' });
    if (await hier.isVisible()) {
      await page.screenshot({ path: ziel('fall-laptophinweis', p), fullPage: true });
      await hier.click();
    }
    await page.getByRole('button', { name: 'Fall starten' }).click();
    const fall = geschaeftsgangFall(4242);
    const teil = fall.schritte[0]!.parts[0]!;
    await teilLoesen(page, teil, page.locator(`[data-part="${teil.id}"]`));
    await page.getByRole('button', { name: 'Prüfen' }).click();
    await page.screenshot({ path: ziel('fall-schritt', p), fullPage: false });

    // Mini-Klausur: erste Aufgabe ausgefüllt, dann Auswertung
    const plan = miniKlausur('I', 5);
    await page.goto('./#/klausur/mini/I?seed=5');
    await page.getByRole('button', { name: 'Klausur beginnen' }).click();
    for (const part of klausurTask(plan.aufgaben[0]!).parts)
      await teilLoesen(page, part, page.locator(`[data-part="${part.id}"]`));
    await page.screenshot({ path: ziel('klausur-schreiben', p), fullPage: false });
    await page.getByRole('button', { name: 'Abgeben' }).click();
    await page.getByRole('button', { name: 'Jetzt abgeben' }).click();
    await page.getByText('Auswertung').first().waitFor();
    await page.screenshot({ path: ziel('klausur-auswertung', p), fullPage: true });

    await page.goto('./#/firma');
    await page.screenshot({ path: ziel('firma', p), fullPage: true });
    await page.goto('./#/statistik');
    await page.screenshot({ path: ziel('statistik', p), fullPage: true });
  });
}
