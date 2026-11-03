// Spielt jede Pilotlektion vollständig durch (wie eine lernende Person) und prüft den Abschluss.
import { expect, test, type Page } from '@playwright/test';
import { LEKTIONEN } from '../../src/content/lessons';
import type { Screen } from '../../src/content/lessons/types';
import { generatorFuer } from '../../src/engine/generators';
import { createRng } from '../../src/engine/rng';
import { sammleFehler, teilLoesen } from './helpers';

const FOTOS = !!process.env.SCREENS;

async function weiter(page: Page) {
  const btn = page.getByRole('button', { name: /^(Weiter|Finde es heraus|Lektion abschließen)/ });
  await expect(btn).toBeEnabled();
  await btn.click();
}

async function bildschirmBearbeiten(page: Page, s: Screen) {
  switch (s.typ) {
    case 'erkunden': {
      const e = s.erkunden;
      if (e.art === 'aufdecken')
        for (const k of e.karten)
          await page
            .getByRole('button', { name: k.titel, exact: false })
            .filter({ hasText: k.titel })
            .first()
            .click();
      if (e.art === 'waage-zuordnen')
        for (const p of e.posten)
          await page
            .getByRole('radiogroup', { name: `Seite für ${p.text}` })
            .getByRole('radio', { name: p.seite })
            .click();
      if (e.art === 'waage-zuordnen') await page.getByRole('button', { name: /Passt/ }).click();
      if (e.art === 'geschaeftsvorfall')
        for (let i = 0; i < e.vorfaelle.length; i++)
          await page.getByRole('button', { name: 'Vorfall buchen' }).click();
      if (e.art === 'tkonto-buchen')
        for (const v of e.vorgaenge)
          await page
            .getByRole('button', {
              name: v.seite === 'soll' ? /Soll \(links\)/ : /Haben \(rechts\)/,
            })
            .click();
      if (e.art === 'skonto-regler') await page.getByRole('slider').fill('20');
      if (e.art === 'afa-vergleich')
        for (const name of ['arithmetisch-degressiv', 'geometrisch-degressiv'])
          await page.getByRole('button', { name, exact: true }).click();
      if (e.art === 'kostenfunktion') await page.getByRole('slider').fill('10');
      return;
    }
    case 'vorhersage':
    case 'verstaendnis':
      await page
        .getByRole('radio', { name: s.optionen.find((o) => o.richtig)!.text, exact: true })
        .click();
      return;
    case 'sortieren':
      for (const e of s.elemente)
        await page
          .getByRole('radiogroup', { name: `Kategorie für: ${e.text}` })
          .getByRole('radio', { name: e.kategorie, exact: true })
          .click();
      await page.getByRole('button', { name: 'Zuordnung prüfen' }).click();
      return;
    case 'wer-hat-recht': {
      const name = {
        jana: 'Jana',
        tobias: 'Tobias',
        leni: 'Leni',
        frank: 'Frank',
        sabine: 'Sabine',
        ich: 'Ich',
      }[(s.richtig === 'a' ? s.a : s.b).figur];
      await page.getByRole('button', { name: `${name} hat recht` }).click();
      await page.getByRole('radio', { name: s.begruendungen.find((o) => o.richtig)!.text }).click();
      return;
    }
    case 'fehlerjagd':
      await page.getByRole('button', { name: s.zeilen![s.fehlerZeile]!, exact: true }).click();
      await page.getByRole('button', { name: 'Diese Zeile ist falsch' }).click();
      await page.getByRole('radio', { name: s.gruende.find((o) => o.richtig)!.text }).click();
      return;
    case 'vorgerechnet':
      for (let i = 1; i < s.schritte.length; i++)
        await page.getByRole('button', { name: 'Nächster Schritt' }).click();
      return;
    case 'luecke': {
      const g = generatorFuer(s.skillId)!;
      const p = g.generate(createRng(s.seed), s.variant ? { variant: s.variant } : {});
      const part = g.parts(p, g.solve(p)).find((x) => x.id === s.partId)!;
      if (part.typ !== 'rechenkette') throw new Error('Rechenkette erwartet');
      await teilLoesen(page, {
        ...part,
        felder: part.felder.filter((f) => s.gefragt.includes(f.id)),
      });
      await page.getByRole('button', { name: 'Prüfen', exact: true }).click();
      await expect(page.getByText('Richtig', { exact: true })).toBeVisible();
      return;
    }
    case 'entscheidung':
      await page.getByRole('button', { name: s.optionen.find((o) => o.empfohlen)!.text }).click();
      return;
    case 'klausur': {
      let part;
      if ('typ' in s.part) part = s.part;
      else {
        const g = generatorFuer(s.part.skillId)!;
        const p = g.generate(
          createRng(s.part.seed),
          s.part.variant ? { variant: s.part.variant } : {},
        );
        part = g.parts(p, g.solve(p)).find((x) => x.id === (s.part as { partId: string }).partId)!;
      }
      await teilLoesen(page, part);
      await page.getByRole('button', { name: 'Prüfen', exact: true }).click();
      await expect(page.getByText('Und dann …')).toBeVisible();
      return;
    }
    default:
      return;
  }
}

for (const l of LEKTIONEN) {
  test(`Lektion ${l.id} „${l.titel}“ vollständig durchspielen`, async ({ page }, info) => {
    const fehler = sammleFehler(page);
    await page.goto(`./#/lektion/${l.id}`);
    await expect(page.getByRole('heading', { name: l.titel })).toBeVisible();
    if (FOTOS)
      await page.screenshot({
        path: `test-results/lektionen/${info.project.name}-${l.id}-00-start.png`,
        fullPage: true,
      });
    await page.getByRole('button', { name: /Los geht/ }).click();
    for (const [i, s] of l.screens.entries()) {
      await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', String(i + 1));
      await bildschirmBearbeiten(page, s);
      if (FOTOS) {
        await page.waitForTimeout(1200);
        await page.screenshot({
          path: `test-results/lektionen/${info.project.name}-${l.id}-${String(i + 1).padStart(2, '0')}-${s.typ}.png`,
          fullPage: true,
        });
      }
      await weiter(page);
    }
    await expect(page.getByRole('heading', { name: 'Lektion geschafft!' })).toBeVisible();
    if (FOTOS)
      await page.screenshot({
        path: `test-results/lektionen/${info.project.name}-${l.id}-99-geschafft.png`,
        fullPage: true,
      });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
    ).toBe(true);
    // Fortschritt: Lektion im Lernpfad erledigt
    await page.goto('./#/lernpfad');
    await expect(
      page.getByRole('button', { name: new RegExp(`Lektion: .* – erledigt`) }).first(),
    ).toBeVisible();
    expect(fehler).toEqual([]);
  });
}

test('„Kann ich schon“: bestandener Test schaltet die Übung frei', async ({ page }) => {
  const l = LEKTIONEN.find((x) => x.id === 'C5')!;
  await page.goto(`./#/lektion/${l.id}`);
  await page.getByRole('button', { name: /Kann ich schon/ }).click();
  for (const f of l.skipTest) {
    await page.getByRole('radio', { name: f.optionen.find((o) => o.richtig)!.text }).click();
    await page.getByRole('button', { name: /(Nächste Frage|Auswerten)/ }).click();
  }
  await expect(page.getByRole('heading', { name: 'Bestanden!' })).toBeVisible();
  await page.getByRole('button', { name: 'Zum Lernpfad' }).click();
  await expect(
    page.getByRole('button', { name: /Übung: Skonto beim Einkauf – (offen|erledigt)/ }),
  ).toBeVisible();
});

test('Abschnitt überspringen: nicht bestanden führt freundlich zur Lektion', async ({ page }) => {
  await page.goto('./#/test/abschnitt/0');
  for (let i = 0; i < 40; i++) {
    const naechste = page.getByRole('button', { name: /(Nächste Frage|Auswerten)/ });
    if (!(await naechste.isVisible())) break;
    const letzte = (await naechste.textContent())?.includes('Auswerten');
    await page.getByRole('radio').first().click();
    await naechste.click();
    if (letzte) break;
  }
  await expect(page.getByText('Lass uns das kurz gemeinsam ansehen')).toBeVisible();
});
