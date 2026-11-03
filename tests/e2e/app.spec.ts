import { expect, test } from '@playwright/test';
import { GENERATOREN } from '../../src/engine/generators';
import { buchungEingeben, sammleFehler, teileFuer, teilLoesen } from './helpers';

test('Startseite lädt ohne Fehler, Navigation erreicht alle Bereiche', async ({ page }) => {
  const fehler = sammleFehler(page);
  await page.goto('./');
  // Begrüßung beim ersten Start
  await expect(page.getByRole('heading', { name: 'Willkommen bei der MBG!' })).toBeVisible();
  await page.getByRole('button', { name: /Los geht/ }).click();
  await page.getByRole('radio', { name: 'Afro' }).click();
  await page.getByRole('button', { name: 'Weiter' }).click();
  await page.getByRole('radio', { name: /leicht/ }).click();
  await page.getByRole('button', { name: 'Weiter' }).click();
  await expect(
    page.getByRole('heading', { name: 'Lernst du auch auf einem zweiten Gerät?' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Nein, nur dieses Gerät' }).click();
  await page.getByRole('button', { name: 'Bei null anfangen' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Lernpfad' })).toBeVisible();
  await expect(page.getByText('Lernszenario mit fiktiven Zahlen').first()).toBeVisible();
  const nav = page.getByRole('navigation', { name: 'Hauptnavigation' }).locator('visible=true');
  for (const [label, heading] of [
    ['Lernpfad', 'Lernpfad'],
    ['Firma', 'MBG Getränke OHG (Lernversion)'],
    ['Statistik', 'Statistik'],
    ['Einstellungen', 'Einstellungen'],
    ['Start', 'Hallo!'],
  ]) {
    await nav.getByRole('button', { name: label }).click();
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  expect(fehler).toEqual([]);
});

test('Darstellung hell/dunkel umschalten', async ({ page }) => {
  await page.goto('./#/einstellungen');
  await page.getByRole('radio', { name: 'Dunkel' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dunkel');
  await page.getByRole('radio', { name: 'Hell' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'hell');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'hell');
});

for (const g of GENERATOREN) {
  test(`Aufgabe richtig lösen: ${g.titel} (${g.skillId})`, async ({ page }) => {
    const fehler = sammleFehler(page);
    const seed = 11;
    await page.goto(`./#/sitzung?skill=${g.skillId}&seed=${seed}`);
    const hier = page.getByRole('button', { name: 'Trotzdem hier lösen' });
    await expect(page.getByText(/Aufgabe 1 von/).or(hier)).toBeVisible();
    if (await hier.isVisible()) await hier.click();
    const parts = teileFuer(g.skillId, seed);
    for (const [i, part] of parts.entries()) {
      await teilLoesen(page, part);
      await page.getByRole('button', { name: 'Prüfen' }).click();
      await expect(page.getByText('Richtig', { exact: true }).nth(i)).toBeVisible();
      if (i < parts.length - 1) await page.getByRole('button', { name: 'Weiter' }).click();
    }
    await expect(page.getByRole('heading', { name: 'Aufgabe gelöst' })).toBeVisible();
    await page.getByRole('button', { name: 'Rechenweg ansehen' }).click();
    await page.getByRole('button', { name: /Nächste Aufgabe/ }).click();
    await expect(page.getByText('Aufgabe 2 von 4')).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
    ).toBe(true);
    expect(fehler).toEqual([]);
  });
}

test('Fehler zeigt den konkreten Denkfehler und führt zu erneuter Übung', async ({ page }) => {
  const seed = 21;
  await page.goto(`./#/sitzung?skill=C5-skonto-einkauf&seed=${seed}`);
  const [kette, buchung] = teileFuer('C5-skonto-einkauf', seed);
  await teilLoesen(page, kette!);
  await page.getByRole('button', { name: 'Prüfen' }).click();
  await page.getByRole('button', { name: 'Weiter' }).click();
  if (buchung?.typ !== 'buchungssatz') throw new Error('Buchungsteil erwartet');
  // Vorsteuer durch Umsatzsteuer ersetzen
  const saetze = buchung.loesung.saetze.map((s) => ({
    soll: s.soll.map((z) => ({
      konto: z.konto === 'Vorsteuer' ? 'Umsatzsteuer' : z.konto,
      betrag: z.betrag.value.toFixed(2).replace('.', ','),
    })),
    haben: s.haben.map((z) => ({
      konto: z.konto === 'Vorsteuer' ? 'Umsatzsteuer' : z.konto,
      betrag: z.betrag.value.toFixed(2).replace('.', ','),
    })),
  }));
  await buchungEingeben(page, saetze);
  await page.getByRole('button', { name: 'Prüfen' }).click();
  await expect(page.getByText('Erkannter Denkfehler').first()).toBeVisible();
  await expect(page.getByText('Vorsteuer und Umsatzsteuer verwechselt')).toBeVisible();
  await page.getByRole('button', { name: 'Lösung zeigen' }).click();
  await expect(page.getByText('Lösung', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /Nächste Aufgabe/ }).click();
  await expect(page.getByText('Aufgabe 2 von 5')).toBeVisible();
});

test('Komplette Kurz-Sitzung bis zur Auswertung, Lernstand wird gespeichert', async ({ page }) => {
  const fehler = sammleFehler(page);
  await page.goto('./#/sitzung?seed=4');
  const ende = page.getByRole('heading', { name: 'Sitzung abgeschlossen' });
  for (let n = 0; n < 150 && !(await ende.isVisible()); n++) {
    const pruefen = page.getByRole('button', { name: 'Prüfen' });
    const loesung = page.getByRole('button', { name: 'Lösung zeigen' });
    const weiter = page.getByRole('button', {
      name: /^(Weiter|Nächste Aufgabe|Sitzung abschließen)/,
    });
    if (await loesung.isVisible()) await loesung.click();
    else if (await weiter.isVisible()) await weiter.click();
    else if (await pruefen.isEnabled().catch(() => false)) await pruefen.click();
    else {
      // Irgendeine Eingabe machen, damit geprüft werden kann
      const kontoWahl = page.getByRole('button', { name: /-Konto 1: wählen/ }).first();
      const radio = page.locator('form [role=radio]:not([disabled])').first();
      const feld = page.locator('form input[inputmode=decimal]:not([disabled])').first();
      if (await kontoWahl.isVisible()) {
        await kontoWahl.click();
        await page.getByRole('searchbox', { name: 'Konto suchen' }).fill('Bank');
        await page.getByRole('searchbox', { name: 'Konto suchen' }).press('Enter');
      } else if (await radio.isVisible()) await radio.click();
      else if (await feld.isVisible()) await feld.fill('1');
    }
    await page.waitForTimeout(30);
  }
  await expect(ende).toBeVisible();
  await page.getByRole('button', { name: 'Zur Startseite' }).click();
  const anzahl = await page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        const req = indexedDB.open('rw-lernapp');
        req.onsuccess = () => {
          const tx = req.result.transaction('events', 'readonly');
          const c = tx.objectStore('events').count();
          c.onsuccess = () => resolve(c.result);
        };
      }),
  );
  expect(anzahl).toBeGreaterThanOrEqual(8);
  expect(fehler).toEqual([]);
});

test('App startet offline (nach dem ersten Besuch)', async ({ page, context }) => {
  await page.goto('./');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await context.setOffline(true);
  await page.goto('./#/lernpfad');
  await expect(page.getByRole('heading', { name: 'Lernpfad' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Lernpfad' })).toBeVisible();
});

test('Manifest ist für die Installation vollständig', async ({ request }) => {
  const res = await request.get('./manifest.webmanifest');
  expect(res.ok()).toBe(true);
  const m = await res.json();
  expect(m.display).toBe('standalone');
  expect(m.icons.map((i: { sizes: string }) => i.sizes)).toEqual(
    expect.arrayContaining(['192x192', '512x512']),
  );
  expect(m.icons.some((i: { purpose?: string }) => i.purpose === 'maskable')).toBe(true);
  for (const i of m.icons) expect((await request.get(`./${i.src}`)).ok()).toBe(true);
  expect((await request.get('./apple-touch-icon.png')).ok()).toBe(true);
});
