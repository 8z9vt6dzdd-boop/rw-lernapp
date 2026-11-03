// Lektion H3 – Arbeitskosten (eigene Formulierung; geprüft gegen K1 Kap. 2.3, S. 66–69).
// Beträge werden mit der Engine (Val, exakt) berechnet.
import { feld } from '../../engine/generators/base';
import { Val, formatEuro } from '../../engine/money';
import type { Lektion } from './types';

const e = (v: Val) => formatEuro(v.value);

// Zeitliche Abgrenzung des Weihnachtsgelds
const WG_PLAN = new Val('60000');
const WG_MONAT = WG_PLAN.div(12);
const WG_IST = new Val('62400');
const WG_DIFF = WG_IST.minus(WG_PLAN);

// Personalkosten eines Monats (Abfüllteam der MBG)
const MA = 8;
const LOHN_MONAT = '2800';
const URLAUBSGELD = '500';
const WEIHNACHTSGELD = '1200';
const SOZIAL_JAHR = '56000';
const LOHN_JAHR = new Val(LOHN_MONAT).times(MA).times(12);
const SONDER = new Val(URLAUBSGELD).plus(WEIHNACHTSGELD).times(MA);
const GESAMT = LOHN_JAHR.plus(SONDER).plus(SOZIAL_JAHR);
const JANUAR = GESAMT.div(12);

export const lektionH3: Lektion = {
  id: 'H3',
  skillId: 'H3-arbeitskosten',
  abschnitt: 'H',
  titel: 'Arbeitskosten: Wer trägt das Weihnachtsgeld?',
  kernAha:
    'Arbeitskosten umfassen Löhne, Gehälter, Personalnebenkosten, sonstige Personalkosten und den kalkulatorischen Unternehmerlohn. Ungleichmäßig anfallende Zahlungen wie Weihnachts- oder Urlaubsgeld werden gleichmäßig auf alle Monate verteilt, damit kein Monat künstlich teuer wird.',
  dauerMin: 7,
  figuren: ['leni', 'frank', 'jana'],
  ort: 'buero',
  quelle: 'K1 2.3 (S. 66–69)',
  teaser: {
    figur: 'frank',
    ausdruck: 'gruebelt',
    text: 'Im November zahlt die MBG das Weihnachtsgeld. Werden die Novemberdosen dadurch teurer?',
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'buero',
      sprecher: [
        {
          figur: 'leni',
          ausdruck: 'gruebelt',
          text: `Im November überweisen wir rund ${e(WG_PLAN)} Weihnachtsgeld an das Team.`,
        },
        {
          figur: 'frank',
          ausdruck: 'neutral',
          text: 'Dann sind die Dosen im November eben teurer. So ist das Leben.',
        },
      ],
      frage: 'Sollen die im November abgefüllten Dosen das ganze Weihnachtsgeld tragen?',
    },
    {
      typ: 'dialog',
      ort: 'buero',
      sprecher: [
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Wie der Jahresbeitrag fürs Fitnessstudio: einmal bezahlt, aber du trainierst das ganze Jahr. Pro Monat rechnest du dir ein Zwölftel an.',
        },
        {
          figur: 'leni',
          ausdruck: 'erklaert',
          text: 'Genauso verteilt die Kostenrechnung Weihnachts- und Urlaubsgeld gleichmäßig auf alle Monate. Das heißt zeitliche Abgrenzung.',
        },
      ],
    },
    {
      typ: 'vorhersage',
      frage: `Geplant sind ${e(WG_PLAN)} Weihnachtsgeld, gezahlt wird im November. Welche Kosten für Weihnachtsgeld setzt Leni im Januar an?`,
      optionen: [
        { text: e(WG_MONAT), richtig: true },
        { text: formatEuro('0') },
        { text: e(WG_PLAN) },
      ],
      aufloesung: `${e(WG_PLAN)} ÷ 12 Monate = ${e(WG_MONAT)} pro Monat. Schon im Januar erarbeitet das Team ein Zwölftel seines Anspruchs – also gehört auch ein Zwölftel in die Januarkosten.`,
    },
    {
      typ: 'konzept',
      titel: 'Woraus Arbeitskosten bestehen',
      text: 'Löhne (Zeit- oder Leistungslohn), Gehälter, Personalnebenkosten (gesetzlich wie der Arbeitgeberanteil zur Sozialversicherung, freiwillig oder tariflich), sonstige Personalkosten (Einstellung, Abfindung) und der kalkulatorische Unternehmerlohn.',
      visual: {
        typ: 'karten',
        karten: [
          { titel: 'Löhne', text: 'Zeitlohn oder Leistungslohn (Akkord)', farbe: '#1c6670' },
          { titel: 'Gehälter', text: 'Monatlich, meist fix', farbe: '#e8792b' },
          {
            titel: 'Personalnebenkosten',
            text: 'Gesetzliche, freiwillige und tarifliche Sozialkosten',
            farbe: '#8cbf3f',
          },
          {
            titel: 'Sonstige Personalkosten',
            text: 'Inserate, Umzug, Abfindung, Sozialplan',
            farbe: '#e2b13c',
          },
          {
            titel: 'Kalkulatorischer Unternehmerlohn',
            text: 'Für mitarbeitende Inhaber und Gesellschafter',
            farbe: '#6b7280',
          },
        ],
      },
    },
    {
      typ: 'sortieren',
      titel: 'Einzel- oder Gemeinkosten?',
      text: 'Bezogen auf den Kostenträger, also die einzelne Flasche oder Dose.',
      kategorien: ['Einzelkosten', 'Gemeinkosten'],
      elemente: [
        {
          text: 'Akkordlohn in der Abfüllung',
          kategorie: 'Einzelkosten',
          erklaerung:
            'Beim Akkordlohn bleiben die Lohnkosten je Stück konstant; man kann sie dem Erzeugnis direkt zurechnen.',
        },
        {
          text: 'Zeitlohn der Lagerarbeiter',
          kategorie: 'Gemeinkosten',
          erklaerung: 'Bezahlt wird die Arbeitszeit, nicht das einzelne Produkt.',
        },
        {
          text: 'Gehalt in der Buchhaltung',
          kategorie: 'Gemeinkosten',
          erklaerung:
            'Gehälter sind für Kostenträger in der Regel Gemeinkosten, für die Kostenstelle Verwaltung aber Einzelkosten.',
        },
        {
          text: 'Lohnfortzahlung im Krankheitsfall',
          kategorie: 'Gemeinkosten',
          erklaerung: 'Soziallöhne hängen nicht an der Arbeit am Produkt.',
        },
      ],
    },
    {
      typ: 'vorgerechnet',
      titel: 'Personalkosten des Abfüllteams im Januar',
      text: `${MA} Mitarbeitende mit je ${formatEuro(LOHN_MONAT)} Monatslohn, je ${formatEuro(URLAUBSGELD)} Urlaubsgeld und ${formatEuro(WEIHNACHTSGELD)} Weihnachtsgeld im Jahr, gesetzliche Sozialkosten ${formatEuro(SOZIAL_JAHR)} im Jahr.`,
      schritte: [
        {
          text: 'Löhne im Jahr',
          rechnung: `${MA} × ${formatEuro(LOHN_MONAT)} × 12 = ${e(LOHN_JAHR)}`,
          warum:
            'Erst das ganze Jahr betrachten, damit Sonderzahlungen gleichmäßig verteilt werden können.',
        },
        {
          text: 'Sonderzahlungen und Sozialkosten',
          rechnung: `${MA} × (${formatEuro(URLAUBSGELD)} + ${formatEuro(WEIHNACHTSGELD)}) = ${e(SONDER)}; plus ${formatEuro(SOZIAL_JAHR)}`,
          warum:
            'Urlaubs- und Weihnachtsgeld fallen nur in einzelnen Monaten an, gehören aber zu jedem Monat.',
        },
        {
          text: 'Personalkosten im Januar',
          rechnung: `${e(GESAMT)} ÷ 12 = ${e(JANUAR)}`,
          warum: 'Jeder Monat trägt ein Zwölftel – egal, wann tatsächlich gezahlt wird.',
        },
      ],
    },
    {
      typ: 'wer-hat-recht',
      frage:
        'Frank und Sabine Wessel arbeiten voll in der MBG mit, beziehen aber als Gesellschafter kein Gehalt. Kostet ihre Arbeit etwas?',
      a: {
        figur: 'frank',
        ausdruck: 'freut',
        text: 'Für uns steht kein Gehalt in der Buchhaltung. Also kostet unsere Arbeit die MBG nichts.',
      },
      b: {
        figur: 'leni',
        ausdruck: 'erklaert',
        text: 'Ihr könntet woanders ein Gehalt verdienen. Diesen Verzicht setzen wir als kalkulatorischen Unternehmerlohn an.',
      },
      richtig: 'b',
      begruendungen: [
        {
          text: 'Es entstehen Opportunitätskosten; ohne Unternehmerlohn wären die Kosten nicht mit denen einer Kapitalgesellschaft vergleichbar.',
          richtig: true,
        },
        { text: 'Der Unternehmerlohn muss in der Finanzbuchhaltung als Aufwand gebucht werden.' },
        { text: 'Unternehmerlohn gibt es nur bei Aktiengesellschaften.' },
      ],
      aufloesung:
        'In der Personengesellschaft darf für die Gesellschafter kein Gehalt als Aufwand gebucht werden. Der kalkulatorische Unternehmerlohn orientiert sich am Gehaltsniveau der Branche und ist immer Zusatzkosten.',
    },
    {
      typ: 'verstaendnis',
      frage: `Im November werden statt der geplanten ${e(WG_PLAN)} tatsächlich ${e(WG_IST)} Weihnachtsgeld ausgezahlt. Was passiert mit der Differenz von ${e(WG_DIFF)}?`,
      optionen: [
        {
          text: 'Sie wirkt sich auf das neutrale Ergebnis aus; die Vormonate werden nicht korrigiert.',
          richtig: true,
          erklaerung:
            'Sonst müssten alle Monatsergebnisse nachträglich geändert werden und wären nicht mehr vergleichbar.',
        },
        {
          text: 'Alle Monatskalkulationen seit Januar werden neu berechnet.',
          erklaerung: 'Genau das vermeidet man: Der gleichmäßige Ansatz soll bestehen bleiben.',
        },
        {
          text: 'Sie wird vollständig den Novemberdosen angelastet.',
          erklaerung: 'Dann wäre der November wieder künstlich teuer.',
        },
      ],
    },
    {
      typ: 'verstaendnis',
      frage: 'Warum lassen sich Akkordlöhne als Einzelkosten verrechnen, Zeitlöhne meist nicht?',
      figur: {
        figur: 'jana',
        ausdruck: 'erklaert',
        text: 'Denk an die Lohnkosten für eine einzelne Kiste.',
      },
      optionen: [
        {
          text: 'Beim Akkordlohn bleiben die Lohnkosten je Stück konstant.',
          richtig: true,
          erklaerung:
            'Mehr Leistung, mehr Lohn – je Stück bleibt es gleich. So lässt sich der Lohn dem Produkt direkt zurechnen.',
        },
        {
          text: 'Akkordlöhne sind immer niedriger als Zeitlöhne.',
          erklaerung: 'Über die Höhe sagt das nichts. Es geht um die Zurechenbarkeit.',
        },
        {
          text: 'Zeitlöhne werden nicht in der Lohnabrechnung erfasst.',
          erklaerung: 'Auch Zeitlöhne kommen aus der Lohn- und Gehaltsabrechnung.',
        },
      ],
    },
    {
      typ: 'merksatz',
      id: 'H3-m1',
      frage:
        'Was gehört zu den Arbeitskosten und wie werden Sonderzahlungen in der Kostenrechnung behandelt?',
      text: 'Arbeitskosten: Löhne, Gehälter, Personalnebenkosten, sonstige Personalkosten, kalkulatorischer Unternehmerlohn (Zusatzkosten). Urlaubs- und Weihnachtsgeld werden gleichmäßig auf alle Monate verteilt; Abweichungen gehen ins neutrale Ergebnis.',
    },
    {
      typ: 'klausur',
      punkte: 3,
      aufgabe: `Ein Team von ${MA} Mitarbeitenden erhält je ${formatEuro(LOHN_MONAT)} Monatslohn sowie im Jahr je ${formatEuro(URLAUBSGELD)} Urlaubsgeld und ${formatEuro(WEIHNACHTSGELD)} Weihnachtsgeld. Die gesetzlichen Sozialkosten betragen ${formatEuro(SOZIAL_JAHR)} im Jahr. Ermitteln Sie die Personalkosten für den Monat Januar.`,
      part: {
        typ: 'rechenkette',
        id: 'personal',
        titel: 'Personalkosten',
        felder: [
          feld('lohn', 'Löhne im Jahr', LOHN_JAHR),
          feld('sonder', 'Urlaubs- und Weihnachtsgeld im Jahr', SONDER),
          feld('gesamt', 'Personalkosten im Jahr', GESAMT),
          feld('januar', 'Personalkosten im Januar', JANUAR),
        ],
      },
      cliffhanger: {
        figur: 'leni',
        ausdruck: 'gruebelt',
        text: 'Personal ist verteilt. Aber die neue Etikettiermaschine hat 100.000 € gekostet – welchen Teil davon trägt ein einzelnes Jahr?',
      },
    },
  ],
  skipTest: [
    {
      frage: 'Geplantes Weihnachtsgeld 36.000 €, gezahlt im November. Kosten im März?',
      optionen: [{ text: '3.000 €', richtig: true }, { text: '0 €' }, { text: '36.000 €' }],
    },
    {
      frage: 'Wie ist der kalkulatorische Unternehmerlohn einzuordnen?',
      optionen: [
        { text: 'Zusatzkosten', richtig: true },
        { text: 'Anderskosten' },
        { text: 'Neutraler Aufwand' },
      ],
    },
    {
      frage: 'Welche Lohnform lässt sich meist als Einzelkosten verrechnen?',
      optionen: [
        { text: 'Akkordlohn', richtig: true },
        { text: 'Zeitlohn' },
        { text: 'Urlaubslohn' },
      ],
    },
  ],
  checkliste: {
    raetsel: true,
    alltagVorFachbegriff: true,
    kernAhaErreicht: true,
    figurImDialog: true,
    klausurbrueckeUndCliffhanger: true,
    fachlichGeprueft:
      'K1 Kap. 2.3 (S. 66–69: Bestandteile der Arbeitskosten, Zeit- und Akkordlohn, Gehälter, gesetzliche und freiwillige Sozialkosten, Gemeinkostencharakter, zeitliche Abgrenzung mit Differenz ins neutrale Ergebnis, kalkulatorischer Unternehmerlohn als Zusatzkosten) abgeglichen am 03.11.2026',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
