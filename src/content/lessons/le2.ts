// Lektion E2 – Aktivierte Eigenleistungen, Anlagen im Bau, Anzahlungen (eigene Formulierung; geprüft
// gegen BA 3.4.3 und 3.4.4, S. 109–111, und BA 5.2, S. 131–132 zu den Herstellungskosten).
// Alle Beträge werden von der Engine berechnet.
import {
  solveEigenleistung,
  type EigenleistungParams,
} from '../../engine/generators/e/eigenleistung-aib';
import { Val, formatEuro, formatProzent } from '../../engine/money';
import type { Lektion } from './types';

const e = (v: Val) => formatEuro(v.value.toString());

// Beispiele der Lektion (GC-E2-a/b in docs/m7/e.md)
const EIGEN: EigenleistungParams = {
  variante: 'eigenleistung',
  objekt: 'eine Förderstrecke zwischen Abfüllung und Logistikzentrum',
  konto: 'Technische Anlagen und Maschinen',
  ustSatz: '0.19',
  material: '12000',
  loehne: '8000',
  mgkSatz: '0.1',
  fgkSatz: '1.5',
  vtgkSatz: '0.05',
};
const S = solveEigenleistung(EIGEN);
const NUR_EINZEL = solveEigenleistung(EIGEN, { ohneGemeinkosten: true });
const MIT_VERTRIEB = solveEigenleistung(EIGEN, { mitVertrieb: true });
const MIT_UST = S.hk!.times('1.19').fix();

const ANZ: EigenleistungParams = {
  variante: 'anzahlung',
  objekt: 'die neue Abfülllinie für Glasflaschen',
  konto: 'Technische Anlagen und Maschinen',
  ustSatz: '0.19',
  anzahlung: '30000',
  schlussrechnung: '90000',
  partner: 'Abfülltechnik Hagedorn GmbH (Lippstadt)',
};
const A = solveEigenleistung(ANZ);
const A_FALSCH = solveEigenleistung(ANZ, { anzahlungNichtVerrechnet: true });
const anzBrutto = new Val(ANZ.anzahlung!).plus(A.vstAnzahlung!);

export const lektionE2: Lektion = {
  id: 'E2',
  skillId: 'E2-eigenleistung-aib',
  abschnitt: 'E',
  titel: 'Selbst gebaut und noch im Bau',
  kernAha:
    'Was die MBG selbst baut, wird zu Herstellungskosten aktiviert: Anlagekonto an Aktivierte Eigenleistungen, ein Ertrag, der die schon gebuchten Aufwendungen ausgleicht. Unfertiges sammelt sich auf Anlagen im Bau, Anzahlungen auf einem eigenen Konto.',
  dauerMin: 8,
  figuren: ['frank', 'jana', 'tobias'],
  ort: 'abfuellung',
  quelle: 'BA 3.4.3 und 3.4.4 (S. 109–111), BA 5.2 (S. 131–132)',
  teaser: {
    figur: 'frank',
    ausdruck: 'gruebelt',
    text: 'Unsere Werkstatt hat eine Förderstrecke gebaut. In den Büchern sieht das aus, als hätten wir Geld verbrannt.',
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'abfuellung',
      sprecher: [
        {
          figur: 'frank',
          ausdruck: 'gruebelt',
          text: `Unsere Werkstatt hat die neue Förderstrecke selbst gebaut. Material für ${formatEuro(EIGEN.material!)} und Löhne für ${formatEuro(EIGEN.loehne!)} stehen schon als Aufwand in den Büchern.`,
        },
        {
          figur: 'jana',
          ausdruck: 'neutral',
          text: 'Und die Förderstrecke selbst steht nirgends. Als hätten wir das Geld verbrannt.',
        },
      ],
      frage: 'Wie kommt eine selbst gebaute Anlage in die Bilanz?',
    },
    {
      typ: 'dialog',
      ort: 'abfuellung',
      sprecher: [
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Stell dir vor, du baust ein Gartenhaus selbst. Holz und Schrauben sind weg, aber im Garten steht jetzt etwas, das einen Wert hat.',
        },
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Diesen Wert holen wir als Ertrag zurück. Das Konto heißt Aktivierte Eigenleistungen.',
        },
        {
          figur: 'frank',
          ausdruck: 'freut',
          text: 'Und auf der Aktivseite steht dann endlich unsere Förderstrecke.',
        },
      ],
    },
    {
      typ: 'vorhersage',
      frage: `Material ${formatEuro(EIGEN.material!)}, Materialgemeinkosten ${formatProzent(EIGEN.mgkSatz!)}, Fertigungslöhne ${formatEuro(EIGEN.loehne!)}, Fertigungsgemeinkosten ${formatProzent(EIGEN.fgkSatz!)}. Das Controlling rechnet noch ${formatProzent(EIGEN.vtgkSatz!)} Vertriebsgemeinkosten zu. Mit welchem Wert wird die Förderstrecke aktiviert?`,
      optionen: [
        { text: e(S.hk!), richtig: true },
        { text: e(NUR_EINZEL.hk!) },
        { text: e(MIT_VERTRIEB.hk!) },
        { text: e(MIT_UST) },
      ],
      aufloesung: `Herstellungskosten: ${formatEuro(EIGEN.material!)} + ${e(S.mgk!)} + ${formatEuro(EIGEN.loehne!)} + ${e(S.fgk!)} = ${e(S.hk!)}. Die angemessenen Gemeinkosten gehören dazu, Vertriebskosten nie. Umsatzsteuer fällt nicht an, denn nichts wird verkauft.`,
    },
    {
      typ: 'konzept',
      titel: 'Die Buchung der Eigenleistung',
      text: 'Anlagekonto an Aktivierte Eigenleistungen, zu Herstellungskosten und ohne Umsatzsteuer. Das Ertragskonto gleicht die schon gebuchten Aufwendungen aus; die Aufwandskonten selbst bleiben unverändert.',
      visual: {
        typ: 'tkonten',
        konten: [
          {
            name: 'Technische Anlagen und Maschinen',
            soll: [
              { text: 'Aktivierte Eigenleistungen', betrag: S.hk!.value.toString(), neu: true },
            ],
            haben: [],
          },
          {
            name: 'Aktivierte Eigenleistungen',
            soll: [],
            haben: [{ text: 'TA und Maschinen', betrag: S.hk!.value.toString(), neu: true }],
            untertitel: 'Ertragskonto, Abschluss über die GuV',
          },
        ],
      },
    },
    {
      typ: 'sortieren',
      titel: 'Aktivieren oder nur Aufwand?',
      text: 'Was macht die Werkstatt hier?',
      kategorien: ['Aktivierte Eigenleistung', 'Nur Aufwand, keine Aktivierung'],
      elemente: [
        { text: 'Sie baut Regale für das Logistikzentrum', kategorie: 'Aktivierte Eigenleistung' },
        {
          text: 'Sie erweitert die Abfüllanlage um eine zusätzliche Station',
          kategorie: 'Aktivierte Eigenleistung',
          erklaerung: 'Werterhöhend: Die Anlage kann danach mehr als vorher.',
        },
        {
          text: 'Sie tauscht verschlissene Dichtungen an der Abfüllanlage',
          kategorie: 'Nur Aufwand, keine Aktivierung',
          erklaerung:
            'Werterhaltend: Die Anlage kann danach nur wieder das, was sie vorher konnte.',
        },
        {
          text: 'Sie wartet die Gabelstapler wie jedes Jahr',
          kategorie: 'Nur Aufwand, keine Aktivierung',
        },
        {
          text: 'Sie baut einen Mischbehälter für den Sirupkeller',
          kategorie: 'Aktivierte Eigenleistung',
        },
      ],
    },
    {
      typ: 'dialog',
      ort: 'abfuellung',
      sprecher: [
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: `Die neue Abfülllinie baut ${ANZ.partner} über viele Monate. Bis sie fertig ist, sammeln wir alle Rechnungen auf dem Konto Anlagen im Bau.`,
        },
        {
          figur: 'tobias',
          ausdruck: 'gruebelt',
          text: 'Und abgeschrieben wird sie schon ab jetzt?',
        },
        {
          figur: 'jana',
          ausdruck: 'neutral',
          text: 'Erst ab Fertigstellung, vorher nutzt sie ja niemand. Anzahlungen kommen bis dahin auf ein eigenes Konto.',
        },
      ],
    },
    {
      typ: 'wer-hat-recht',
      frage: `Hagedorn verlangt eine Anzahlung von ${formatEuro(ANZ.anzahlung!)} netto. Wer hat recht?`,
      a: {
        figur: 'tobias',
        ausdruck: 'neutral',
        text: 'Geliefert ist ja noch nichts. Also gibt es auf die Anzahlung auch keine Vorsteuer.',
      },
      b: {
        figur: 'jana',
        ausdruck: 'erklaert',
        text: 'Auch Anzahlungen sind umsatzsteuerpflichtig. Die Vorsteuer buchen wir sofort.',
      },
      richtig: 'b',
      begruendungen: [
        {
          text: `Anzahlungen unterliegen der Umsatzsteuer: Geleistete Anzahlungen ${formatEuro(ANZ.anzahlung!)} und Vorsteuer ${e(A.vstAnzahlung!)} an Bank ${e(anzBrutto)}.`,
          richtig: true,
        },
        { text: 'Die Vorsteuer entsteht erst mit der Schlussrechnung.' },
        { text: 'Anzahlungen sind Aufwand und haben deshalb keine Vorsteuer.' },
      ],
      aufloesung:
        'Die Anzahlung steht als Geleistete Anzahlungen auf Sachanlagen im Anlagevermögen, netto. Die Vorsteuer darauf zieht die MBG sofort ab.',
    },
    {
      typ: 'vorgerechnet',
      titel: 'Die Schlussrechnung verrechnet die Anzahlung',
      text: `Die Schlussrechnung lautet über ${formatEuro(ANZ.schlussrechnung!)} netto. Die Linie ist noch nicht fertig, die MBG überweist den Rest sofort.`,
      schritte: [
        {
          text: 'Restbetrag',
          rechnung: `${formatEuro(ANZ.schlussrechnung!)} − ${formatEuro(ANZ.anzahlung!)} = ${e(A.rest!)} netto`,
          warum: 'Die Anzahlung ist schon bezahlt und wird abgezogen.',
        },
        {
          text: 'Vorsteuer nur auf den Rest',
          rechnung: `${e(A.rest!)} × 19 % = ${e(A.vstRest!)}; Überweisung ${e(A.ueberweisung!)}`,
          warum: 'Die Vorsteuer auf die Anzahlung wurde bereits bei der Anzahlung gebucht.',
        },
        {
          text: 'Buchung',
          rechnung: `Anlagen im Bau ${formatEuro(ANZ.schlussrechnung!)}, Vorsteuer ${e(A.vstRest!)} an Bank ${e(A.ueberweisung!)}, an Geleistete Anzahlungen ${formatEuro(ANZ.anzahlung!)}`,
          warum:
            'Die ganze Leistung kommt auf Anlagen im Bau. Die Anzahlung wird ausgebucht, ihr Konto steht danach auf null.',
        },
      ],
    },
    {
      typ: 'fehlerjagd',
      titel: 'Ein Kollege bucht die Schlussrechnung',
      text: 'Die Anzahlung von oben ist längst bezahlt. In einer Zeile steckt der Fehler.',
      zeilen: [
        `Soll: Anlagen im Bau ${e(A_FALSCH.rest!)}`,
        `Soll: Vorsteuer ${e(A_FALSCH.vstRest!)}`,
        `Haben: Bank ${e(A_FALSCH.ueberweisung!)}`,
      ],
      fehlerZeile: 0,
      gruende: [
        {
          text: 'Auf Anlagen im Bau gehört die volle Summe; die Anzahlung muss im Haben ausgebucht werden.',
          richtig: true,
        },
        { text: 'Die Vorsteuer muss auf die volle Schlussrechnung berechnet werden.' },
        { text: 'Die Bank muss die volle Schlussrechnung brutto zeigen.' },
      ],
      aufloesung: `Sonst bliebe die Anzahlung von ${formatEuro(ANZ.anzahlung!)} für immer auf ihrem Konto stehen, und Anlagen im Bau wäre zu niedrig. Richtig: Anlagen im Bau ${formatEuro(ANZ.schlussrechnung!)}, zusätzlich an Geleistete Anzahlungen ${formatEuro(ANZ.anzahlung!)}.`,
    },
    {
      typ: 'luecke',
      titel: 'Jetzt du',
      text: 'Die Werkstatt hat wieder gebaut. Ergänze die Gemeinkosten und die Herstellungskosten.',
      skillId: 'E2-eigenleistung-aib',
      seed: 4,
      variant: 'eigenleistung',
      partId: 'hk',
      gefragt: ['mgk', 'fgk', 'hk'],
    },
    {
      typ: 'merksatz',
      id: 'E2-m1',
      frage:
        'Wie bucht man aktivierte Eigenleistungen, Anlagen im Bau und Anzahlungen auf Sachanlagen?',
      text: 'Selbst gebaute Anlagen: Anlagekonto an Aktivierte Eigenleistungen, zu Herstellungskosten, ohne Umsatzsteuer. Unfertige Anlagen sammeln sich auf Anlagen im Bau, Anzahlungen (mit Vorsteuer) auf Geleistete Anzahlungen. Bei Fertigstellung umbuchen, erst dann abschreiben.',
    },
    {
      typ: 'klausur',
      punkte: 3,
      aufgabe:
        'Bilden Sie den Buchungssatz für die Schlussrechnung unter Verrechnung der Anzahlung.',
      part: { skillId: 'E2-eigenleistung-aib', seed: 4, variant: 'anzahlung', partId: 'schluss' },
      cliffhanger: {
        figur: 'frank',
        ausdruck: 'gruebelt',
        text: 'Die neue Etikettiermaschine läuft seit September. Wie viel ist sie bis Silvester schon weniger wert?',
      },
    },
  ],
  skipTest: [
    {
      frage:
        'Die Werkstatt baut eine Anlage für den eigenen Betrieb. Welcher Buchungssatz ist richtig?',
      optionen: [
        { text: 'Anlagekonto an Aktivierte Eigenleistungen', richtig: true },
        { text: 'Anlagekonto an Umsatzerlöse für eigene Erzeugnisse' },
        { text: 'Anlagekonto und Vorsteuer an Löhne' },
      ],
    },
    {
      frage: 'Wann wird eine Anlage im Bau planmäßig abgeschrieben?',
      optionen: [
        { text: 'Erst ab ihrer Fertigstellung', richtig: true },
        { text: 'Ab der ersten Teilrechnung' },
        { text: 'Gar nicht, Anlagen im Bau sind Umlaufvermögen' },
      ],
    },
    {
      frage: 'Anzahlung 10.000 € netto auf eine Maschine, per Bank. Buchung?',
      optionen: [
        {
          text: 'Geleistete Anzahlungen auf Sachanlagen 10.000 €, Vorsteuer 1.900 € an Bank 11.900 €',
          richtig: true,
        },
        { text: 'Geleistete Anzahlungen auf Sachanlagen 11.900 € an Bank 11.900 €' },
        { text: 'Anlagen im Bau 10.000 € an Bank 10.000 €' },
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
      'BA 3.4.3 S. 109–110 (Anlagekonto an aktivierte Eigenleistungen, Ertragskonto, werterhöhende vs. werterhaltende Reparatur), BA 3.4.4 S. 110–111 (Anlagen im Bau, Anzahlungen umsatzsteuerpflichtig, Verrechnung, keine Abschreibung vor Fertigstellung), BA 5.2 S. 131–132 (Herstellungskosten ohne Vertriebskosten); Zahlen aus der Engine; 03.11.2026',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
