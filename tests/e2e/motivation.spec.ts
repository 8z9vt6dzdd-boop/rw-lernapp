// Startseite, Lernpfad, Motivation und Laptop-Hinweis aus Sicht der lernenden Person.
import { expect, test } from '@playwright/test';

const FOTOS = !!process.env.SCREENS;

async function begruessungUeberspringen(page: import('@playwright/test').Page) {
  await page.goto('./');
  await page.getByRole('button', { name: /Los geht/ }).click();
  await page.getByRole('button', { name: 'Weiter' }).click();
  await page.getByRole('button', { name: 'Weiter' }).click();
  await page.getByRole('button', { name: 'Bei null anfangen' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Lernpfad' })).toBeVisible();
}

test('Startseite zeigt Serie, Tagesaufgaben, Karriere, nächste Szene und Klausur-Stand', async ({
  page,
}, info) => {
  if (FOTOS) {
    await page.goto('./');
    await page.waitForTimeout(1200);
    await page.screenshot({
      path: `test-results/screens/${info.project.name}-willkommen.png`,
      fullPage: true,
    });
  }
  await begruessungUeberspringen(page);
  if (FOTOS) {
    await page.waitForTimeout(800);
    await page.screenshot({
      path: `test-results/screens/${info.project.name}-lernpfad.png`,
      fullPage: true,
    });
  }
  await page.goto('./#/');
  await expect(page.getByText('Tage in Folge')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Tagesaufgaben' })).toBeVisible();
  await expect(page.getByText('Neu im Team').first()).toBeVisible();
  await expect(page.getByText('Was heute bei der MBG passiert')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Lektion 0.1 starten' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Klausur-Stand' })).toBeVisible();
  if (FOTOS) {
    await page.waitForTimeout(800);
    await page.screenshot({
      path: `test-results/screens/${info.project.name}-start.png`,
      fullPage: true,
    });
  }
});

test('Nach einer Lektion: Serie 1, Belohnung „Erster Arbeitstag“, Lernpfad zeigt nächste Lektion', async ({
  page,
}, info) => {
  await begruessungUeberspringen(page);
  // Lektion 0.1 per „Kann ich schon“ erledigen geht nicht ins Tagesziel; daher kurz durchspielen über den Test-Weg der Lektion
  await page.goto('./#/test/lektion/0.1');
  for (const antwort of [
    'Was hat die MBG an Werten und Schulden?',
    'Die Geschäftsführung',
    'Nein, vom Umsatz gehen noch die Aufwendungen ab.',
  ]) {
    await page.getByRole('radio', { name: antwort }).click();
    await page.getByRole('button', { name: /(Nächste Frage|Auswerten)/ }).click();
  }
  await expect(page.getByRole('heading', { name: 'Bestanden!' })).toBeVisible();
  await page.getByRole('button', { name: 'Zum Lernpfad' }).click();
  // Belohnung für den ersten Erfolg erscheint einmal
  await expect(page.getByRole('dialog', { name: 'Belohnung' })).toBeVisible();
  if (FOTOS) {
    await page.waitForTimeout(600);
    await page.screenshot({ path: `test-results/screens/${info.project.name}-belohnung.png` });
  }
  await page
    .getByRole('dialog', { name: 'Belohnung' })
    .getByRole('button', { name: 'Weiter' })
    .click();
  await expect(
    page.getByRole('button', { name: /Lektion: Die Bilanz: das Foto am 31.12. – offen/ }),
  ).toBeVisible();
  await page.goto('./#/erfolge');
  await expect(page.getByText(/[1-9]\d* von \d+ gesammelt/)).toBeVisible();
  if (FOTOS)
    await page.screenshot({
      path: `test-results/screens/${info.project.name}-erfolge.png`,
      fullPage: true,
    });
});

test('Tabellenaufgabe auf dem Handy: Laptop-Hinweis, merken, Liste am Laptop', async ({
  browser,
}) => {
  // Handy: Aufgabe merken
  const handy = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const p = await handy.newPage();
  await p.goto('./#/sitzung?skill=I4-stufenleiter&seed=3');
  await expect(
    p.getByText('Diese Aufgabe lässt sich am Laptop deutlich bequemer bearbeiten.'),
  ).toBeVisible();
  if (FOTOS) await p.screenshot({ path: 'test-results/screens/handy-laptophinweis.png' });
  await p.getByRole('button', { name: 'Für den Laptop merken' }).click();
  await expect(
    p.getByText('Diese Aufgabe lässt sich am Laptop deutlich bequemer bearbeiten.'),
  ).toBeVisible();
  await p.getByRole('button', { name: 'Trotzdem hier lösen' }).click();
  await expect(p.getByRole('heading', { name: 'Stufenleiterverfahren' })).toBeVisible();
  // Gleiches Gerät, Laptop-Breite: Liste erscheint (Abgleich zwischen Geräten folgt mit M6)
  await p.setViewportSize({ width: 1366, height: 860 });
  await p.goto('./');
  await p.evaluate(async () => {
    const req = indexedDB.open('rw-lernapp');
    await new Promise((r) => (req.onsuccess = r));
    const tx = req.result.transaction('kv', 'readwrite');
    const s = await new Promise<Record<string, unknown>>((r) => {
      const g = tx.objectStore('kv').get('settings');
      g.onsuccess = () => r((g.result as Record<string, unknown>) ?? {});
    });
    tx.objectStore('kv').put({ ...s, onboardingErledigt: true }, 'settings');
    await new Promise((r) => (tx.oncomplete = r));
  });
  await p.reload();
  await expect(p.getByRole('heading', { name: 'Am Laptop weitermachen' })).toBeVisible();
  await p.getByRole('button', { name: 'Jetzt lösen' }).click();
  await expect(p.getByRole('heading', { name: 'Stufenleiterverfahren' })).toBeVisible();
  await handy.close();
});

test('Bewegung reduzieren schaltet Animationen ab', async ({ page }) => {
  await page.goto('./#/einstellungen');
  await page.getByRole('switch').click();
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduziert');
});
