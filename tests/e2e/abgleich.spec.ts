// Automatischer Abgleich zwischen zwei Geräten (lokaler Abgleich-Dienst, siehe playwright.config.ts).
import { expect, test, type Browser, type Page } from '@playwright/test';
import { sammleFehler } from './helpers';

test.describe.configure({ mode: 'serial' });

async function geraet(browser: Browser) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    timezoneId: test.info().project.use.timezoneId,
  });
  const page = await context.newPage();
  const fehler = sammleFehler(page);
  return { context, page, fehler };
}

async function woerter(page: Page): Promise<string[]> {
  await page.goto('./#/geraete');
  const liste = page.getByRole('list', { name: 'Die 8 Wörter dieses Geräts' });
  await expect(liste.getByRole('listitem')).toHaveCount(8);
  return (await liste.getByRole('listitem').allTextContents()).map((t) =>
    t.replace(/^\d+\.\s*/, '').trim(),
  );
}

/** Leere Mini-Klausur abgeben: erzeugt Lernereignisse und einen Eintrag im Klausur-Protokoll. */
async function miniKlausur(page: Page, abschnitt: string) {
  await page.goto(`./#/klausur/mini/${abschnitt}?seed=3`);
  await page.getByRole('button', { name: 'Klausur beginnen' }).click();
  await page.getByRole('button', { name: 'Abgeben' }).click();
  await page.getByRole('button', { name: 'Jetzt abgeben' }).click();
  await expect(page.getByText('Auswertung')).toBeVisible();
}

async function zeigtMini(page: Page, abschnitt: string) {
  await expect(async () => {
    // Neu laden wie beim erneuten Öffnen der App (dabei wird abgeglichen)
    await page.goto('./#/pruefen');
    await page.reload();
    await expect(
      page
        .getByRole('listitem')
        .filter({ hasText: new RegExp(`^${abschnitt}:`) })
        .getByText(/zuletzt/),
    ).toBeVisible({ timeout: 1500 });
  }).toPass({ timeout: 30_000 });
}

test('Zwei Geräte gleichen ihren Lernstand ab – auch nach Offline-Lernen und langer Pause', async ({
  browser,
}) => {
  test.setTimeout(150_000);
  const a = await geraet(browser);
  const b = await geraet(browser);

  // Gerät A lernt etwas
  await miniKlausur(a.page, 'C');
  const code = await woerter(a.page);

  // Gerät B verbindet sich mit den 8 Wörtern
  await b.page.goto('./#/geraete');
  await b.page.getByRole('textbox', { name: '8 Wörter des anderen Geräts' }).fill(code.join(' '));
  await b.page.getByRole('button', { name: 'Verbinden', exact: true }).click();
  await b.page.getByRole('button', { name: 'Ja, verbinden' }).click();
  await expect(b.page.getByText(/Verbunden\. Dein Lernstand/)).toBeVisible();
  await zeigtMini(b.page, 'C');

  // Gerät B lernt, A sieht es
  await miniKlausur(b.page, 'D');
  await zeigtMini(a.page, 'D');
  await a.page.goto('./#/geraete');
  await expect(a.page.getByText('2 Geräte verbunden').first()).toBeVisible({ timeout: 15_000 });

  // B lernt offline, der Abgleich holt nach, sobald wieder Netz da ist
  await b.context.setOffline(true);
  await miniKlausur(b.page, 'E');
  await b.context.setOffline(false);
  await b.page.evaluate(() => window.dispatchEvent(new Event('online')));
  await zeigtMini(a.page, 'E');

  // 14 Tage Pause (simuliert): der Abgleich funktioniert weiter
  await a.page.clock.install({ time: Date.now() + 14 * 86_400_000 });
  await miniKlausur(a.page, 'H');
  await zeigtMini(b.page, 'H');

  // Keine Doppelungen: jede Klausur genau einmal in der Statistik
  await b.page.goto('./#/statistik');
  for (const t of ['Mini-Klausur C', 'Mini-Klausur D', 'Mini-Klausur E', 'Mini-Klausur H'])
    await expect(b.page.getByText(new RegExp(`^${t}`))).toHaveCount(1);

  expect(a.fehler.filter((f) => !f.includes('ERR_INTERNET_DISCONNECTED'))).toEqual([]);
  expect(b.fehler.filter((f) => !f.includes('ERR_INTERNET_DISCONNECTED'))).toEqual([]);
  await a.context.close();
  await b.context.close();
});

test('Verbinden über den Link im QR-Code', async ({ browser }) => {
  const a = await geraet(browser);
  const c = await geraet(browser);
  const code = await woerter(a.page);
  await a.page.goto('./#/geraete');
  await expect(a.page.getByRole('img', { name: /QR-Code zum Verbinden/ })).toBeVisible();
  await c.page.goto(`./#verbinden-${code.join('-')}`);
  await expect(c.page.getByRole('heading', { name: 'Gerät verbinden' })).toBeVisible();
  await c.page.getByRole('button', { name: 'Ja, verbinden' }).click();
  await expect(c.page.getByText('Verbunden. Dein Lernstand wird jetzt abgeglichen.')).toBeVisible();
  await c.page.getByRole('button', { name: 'Weiter' }).click();
  expect(await woerter(c.page)).toEqual(code);
  expect(c.fehler).toEqual([]);
  await a.context.close();
  await c.context.close();
});

test('Zurücksetzen trennt das Gerät vom gemeinsamen Lernstand', async ({ browser }) => {
  test.setTimeout(120_000);
  const a = await geraet(browser);
  const b = await geraet(browser);
  await miniKlausur(a.page, 'F');
  const code = await woerter(a.page);
  await b.page.goto('./#/geraete');
  await b.page.getByRole('textbox', { name: '8 Wörter des anderen Geräts' }).fill(code.join(' '));
  await b.page.getByRole('button', { name: 'Verbinden', exact: true }).click();
  await b.page.getByRole('button', { name: 'Ja, verbinden' }).click();
  await zeigtMini(b.page, 'F');

  // B setzt in den Einstellungen alles zurück
  await b.page.goto('./#/einstellungen');
  await b.page.getByRole('button', { name: 'Alles zurücksetzen …' }).click();
  await b.page.getByRole('button', { name: 'Ja, endgültig löschen' }).click();
  await expect(b.page.getByText(/mit keinem Lernstand mehr verbunden/)).toBeVisible();

  // B hat neue Wörter, keinen alten Lernstand und bekommt nichts mehr von A
  const neu = await woerter(b.page);
  expect(neu).not.toEqual(code);
  await miniKlausur(a.page, 'G');
  await a.page.goto('./#/geraete');
  await expect(a.page.getByText(/Lernstand abgeglichen/).first()).toBeVisible({ timeout: 15_000 });
  for (let i = 0; i < 3; i++) {
    await b.page.goto('./#/pruefen');
    await b.page.reload();
    await b.page.waitForTimeout(1500);
  }
  for (const x of ['F', 'G'])
    await expect(
      b.page
        .getByRole('listitem')
        .filter({ hasText: new RegExp(`^${x}:`) })
        .getByText(/zuletzt/),
    ).toHaveCount(0);
  await b.page.goto('./#/geraete');
  await expect(b.page.getByText(/Geräte verbunden/)).toHaveCount(0);
  await a.context.close();
  await b.context.close();
});

test('Lernstand als Datei sichern und auf einem anderen Gerät übernehmen', async ({ browser }) => {
  const a = await geraet(browser);
  const b = await geraet(browser);
  await miniKlausur(a.page, 'I');
  await a.page.goto('./#/geraete');
  const download = a.page.waitForEvent('download');
  await a.page.getByRole('button', { name: 'Lernstand sichern' }).click();
  const pfad = await (await download).path();
  await b.page.goto('./#/geraete');
  await b.page.getByLabel('Lernstand-Datei auswählen').setInputFiles(pfad);
  await expect(b.page.getByText(/neue Einträge übernommen/)).toBeVisible();
  await b.page.getByLabel('Lernstand-Datei auswählen').setInputFiles(pfad);
  await expect(
    b.page.getByText('Alles schon vorhanden – nichts Neues in der Datei.'),
  ).toBeVisible();
  await a.context.close();
  await b.context.close();
});
