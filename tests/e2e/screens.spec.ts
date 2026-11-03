// Bildschirmfotos zur Sichtprüfung (nur mit SCREENS=1): npx playwright test screens
import { test } from '@playwright/test';
import { teileFuer, teilLoesen } from './helpers';

test.skip(!process.env.SCREENS, 'nur auf Anfrage');

const ziel = (name: string, project: string) => `test-results/screens/${project}-${name}.png`;

for (const theme of ['hell', 'dunkel'] as const) {
  test(`Bildschirme ${theme}`, async ({ page }, info) => {
    const p = `${info.project.name}-${theme}`;
    await page.goto('./#/einstellungen');
    await page.getByRole('radio', { name: theme === 'hell' ? 'Hell' : 'Dunkel' }).click();
    await page.goto('./');
    await page.screenshot({ path: ziel('start', p), fullPage: true });

    // Skonto: Rechenkette richtig, Buchung mit Fehler
    await page.goto('./#/sitzung?skill=C5-skonto-einkauf&seed=11');
    const [kette] = teileFuer('C5-skonto-einkauf', 11);
    await teilLoesen(page, kette!);
    await page.getByRole('button', { name: 'Prüfen' }).click();
    await page.getByRole('button', { name: 'Weiter' }).click();
    await page
      .locator('[data-satz="0"]')
      .getByRole('button', { name: /^Soll-Konto 1:/ })
      .click();
    await page.screenshot({ path: ziel('kontoauswahl', p) });
    await page.getByRole('searchbox').fill('Verbindlichkeiten a. LL');
    await page.getByRole('searchbox').press('Enter');
    await page.getByRole('textbox', { name: 'Betrag Soll 1' }).first().fill('5236');
    await page
      .locator('[data-satz="0"]')
      .getByRole('button', { name: /^Haben-Konto 1:/ })
      .click();
    await page.getByRole('searchbox').fill('Bank');
    await page.getByRole('searchbox').press('Enter');
    await page.getByRole('textbox', { name: 'Betrag Haben 1' }).first().fill('5000');
    await page.getByRole('button', { name: 'Prüfen' }).click();
    await page.screenshot({ path: ziel('buchung-feedback', p), fullPage: true });
    await page.getByRole('button', { name: 'Lösung zeigen' }).click();
    await page.getByRole('button', { name: 'Rechenweg ansehen' }).click();
    await page.screenshot({ path: ziel('rechenweg', p), fullPage: true });

    // Stufenleiter-Tabelle
    await page.goto('./#/sitzung?skill=I4-stufenleiter&seed=3');
    const [reihenfolge] = teileFuer('I4-stufenleiter', 3);
    await teilLoesen(page, reihenfolge!);
    await page.getByRole('button', { name: 'Prüfen' }).click();
    await page.getByRole('button', { name: 'Weiter' }).click();
    await page.getByRole('button', { name: 'Hilfe' }).click();
    await page.screenshot({ path: ziel('stufenleiter', p), fullPage: true });
  });
}
