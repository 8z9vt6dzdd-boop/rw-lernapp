// Lektion E1 – Kauf von Anlagegütern (eigene Formulierung; geprüft gegen BA 3.3 und 3.4.2,
// S. 93 und 108: Schema der Anschaffungskosten, Nettobuchung von Rabatt und Skonto bei Anlagen).
// Alle Beträge werden von der Engine berechnet.
import { solveAnlagenkauf, type AnlagenkaufParams } from '../../engine/generators/e/anlagenkauf';
import { formatEuro, formatProzent, type Val } from '../../engine/money';
import type { Lektion } from './types';

const e = (v: Val) => formatEuro(v.value.toString());

// Beispiel der Lektion (GC-E1-a/b in docs/m7/e.md)
const BEISPIEL: AnlagenkaufParams = {
  variante: 'skonto',
  anlage: 'eine Etikettiermaschine',
  bezeichnung: 'Etikettiermaschine',
  konto: 'Technische Anlagen und Maschinen',
  verkaeufer: 'Anlagenbau Tiemann KG (Warburg)',
  listenpreis: '50000',
  rabattSatz: '0.1',
  nebenkosten: [
    { art: 'Transport', betrag: '800' },
    { art: 'Montage', betrag: '1200' },
  ],
  ustSatz: '0.19',
  skontoSatz: '0.02',
};
const S = solveAnlagenkauf(BEISPIEL);
const OHNE_NK = solveAnlagenkauf(BEISPIEL, { nebenkostenAlsAufwand: true });
const MIT_VST = solveAnlagenkauf(BEISPIEL, { vorsteuerAktiviert: true });
const RABATT = formatProzent(BEISPIEL.rabattSatz);
const SKONTO = formatProzent(BEISPIEL.skontoSatz!);

export const lektionE1: Lektion = {
  id: 'E1',
  skillId: 'E1-anlagenkauf',
  abschnitt: 'E',
  titel: 'Anlagenkauf: Was kostet die Maschine wirklich?',
  kernAha:
    'Eine Anlage kommt mit ihren Anschaffungskosten auf das Anlagekonto: Anschaffungspreis minus Preisminderungen (Rabatt, Skonto) plus Nebenkosten wie Transport und Montage. Die Vorsteuer gehört nicht dazu.',
  dauerMin: 8,
  figuren: ['tobias', 'jana', 'frank'],
  ort: 'abfuellung',
  quelle: 'BA 3.3 (S. 93), BA 3.4.2 (S. 108); 04-fachregeln.md (GC-05)',
  teaser: {
    figur: 'tobias',
    ausdruck: 'freut',
    text: 'Die neue Etikettiermaschine ist da! Laut Rechnung kostet sie 50.000 €.',
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'abfuellung',
      visual: {
        typ: 'beleg',
        absender: BEISPIEL.verkaeufer,
        nummer: '2026-0712',
        datum: '12.07.',
        zeilen: [
          { text: `${BEISPIEL.bezeichnung}, Listenpreis`, betrag: BEISPIEL.listenpreis },
          { text: `abzüglich ${RABATT} Rabatt`, betrag: S.rabatt.neg().value.toString() },
          ...BEISPIEL.nebenkosten.map((n) => ({ text: n.art, betrag: n.betrag })),
          { text: 'Summe netto', betrag: S.anschaffungskosten.value.toString(), fett: true },
          { text: 'Umsatzsteuer 19 %', betrag: S.vorsteuer.value.toString() },
          { text: 'Rechnungsbetrag', betrag: S.rechnung.value.toString(), fett: true },
        ],
        fuss: `Zahlbar in 30 Tagen netto, innerhalb von 10 Tagen mit ${SKONTO} Skonto.`,
      },
      sprecher: [
        {
          figur: 'tobias',
          ausdruck: 'freut',
          text: `Die neue Etikettiermaschine ist da! ${formatEuro(BEISPIEL.listenpreis)}, steht ganz oben auf der Rechnung.`,
        },
        {
          figur: 'jana',
          ausdruck: 'gruebelt',
          text: 'Oben steht viel. Gekostet hat sie uns trotzdem etwas anderes.',
        },
      ],
      frage: 'Mit welchem Betrag kommt die Maschine in die Bücher der MBG?',
    },
    {
      typ: 'dialog',
      ort: 'abfuellung',
      sprecher: [
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Denk an eine neue Küche: Preis im Möbelhaus, minus Rabatt, plus Lieferung und Aufbau. Erst dann kannst du darin kochen.',
        },
        {
          figur: 'frank',
          ausdruck: 'gruebelt',
          text: 'Und die Umsatzsteuer auf der Rechnung? Die haben wir doch auch bezahlt.',
        },
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Die verrechnen wir als Vorsteuer mit dem Finanzamt. Zum Preis der Maschine gehört sie deshalb nicht.',
        },
      ],
    },
    {
      typ: 'vorhersage',
      frage:
        'Mit welchem Betrag wird die Etikettiermaschine auf dem Konto Technische Anlagen und Maschinen erfasst?',
      optionen: [
        { text: formatEuro(BEISPIEL.listenpreis) },
        { text: e(S.anschaffungskosten), richtig: true },
        { text: e(S.rechnung) },
        { text: e(S.anschaffungspreis) },
      ],
      aufloesung: `Listenpreis ${formatEuro(BEISPIEL.listenpreis)} minus ${RABATT} Rabatt ergibt ${e(S.anschaffungspreis)}. Transport und Montage machen die Maschine erst betriebsbereit, also kommen ${e(S.nebenkosten)} dazu: ${e(S.anschaffungskosten)}. Die Vorsteuer von ${e(S.vorsteuer)} bleibt außen vor.`,
    },
    {
      typ: 'konzept',
      titel: 'Das Schema der Anschaffungskosten',
      text: 'Anschaffungspreis minus Anschaffungspreisminderungen plus Anschaffungsnebenkosten ergibt die Anschaffungskosten. Ein Sofortrabatt wird gar nicht erst gebucht. Die Vorsteuer gehört nie dazu.',
      visual: {
        typ: 'karten',
        karten: [
          {
            titel: 'Anschaffungspreis',
            text: `Listenpreis abzüglich Sofortrabatt: ${e(S.anschaffungspreis)}`,
            farbe: '#e2b13c',
          },
          {
            titel: '− Anschaffungspreisminderungen',
            text: 'nachträglich, zum Beispiel Skonto oder Bonus für genau diese Anlage',
            farbe: '#e8792b',
          },
          {
            titel: '+ Anschaffungsnebenkosten',
            text: `Transport, Montage, Fundament, Überführung: hier ${e(S.nebenkosten)}`,
            farbe: '#8cbf3f',
          },
          {
            titel: '= Anschaffungskosten',
            text: `${e(S.anschaffungskosten)} auf das Anlagekonto`,
            farbe: '#1c6670',
          },
        ],
      },
    },
    {
      typ: 'sortieren',
      titel: 'Gehört das zu den Anschaffungskosten?',
      kategorien: [
        'Erhöht die Anschaffungskosten',
        'Mindert die Anschaffungskosten',
        'Gehört nicht dazu',
      ],
      elemente: [
        {
          text: 'Transport der Maschine ins Werk Paderborn',
          kategorie: 'Erhöht die Anschaffungskosten',
        },
        { text: 'Montage durch den Hersteller', kategorie: 'Erhöht die Anschaffungskosten' },
        {
          text: 'Betonfundament für den neuen Lagertank',
          kategorie: 'Erhöht die Anschaffungskosten',
          erklaerung: 'Ohne Fundament kann der Tank nicht betrieben werden.',
        },
        { text: 'Rabatt auf den Listenpreis', kategorie: 'Mindert die Anschaffungskosten' },
        {
          text: 'Skonto bei Zahlung der Rechnung',
          kategorie: 'Mindert die Anschaffungskosten',
          erklaerung: 'Bei Anlagen mindert der Nettoskonto direkt das Anlagekonto.',
        },
        {
          text: 'Vorsteuer auf der Rechnung',
          kategorie: 'Gehört nicht dazu',
          erklaerung: 'Sie wird mit der Umsatzsteuer verrechnet und belastet die MBG nicht.',
        },
      ],
    },
    {
      typ: 'wer-hat-recht',
      frage: 'Frank und Jana sind sich bei der Montage nicht einig. Wer hat recht?',
      a: {
        figur: 'frank',
        ausdruck: 'neutral',
        text: 'Montage ist eine Dienstleistung, kein Teil der Maschine. Die buchen wir als Aufwand.',
      },
      b: {
        figur: 'jana',
        ausdruck: 'erklaert',
        text: 'Ohne Montage läuft die Maschine nicht. Die Kosten gehören auf das Anlagekonto.',
      },
      richtig: 'b',
      begruendungen: [
        {
          text: 'Alles, was nötig ist, um die Anlage zu erwerben und betriebsbereit zu machen, zählt zu den Anschaffungskosten.',
          richtig: true,
        },
        { text: 'Dienstleistungen dürfen grundsätzlich nicht aktiviert werden.' },
        { text: 'Montagekosten sind Aufwand, wenn sie auf einer eigenen Rechnung stehen.' },
      ],
      aufloesung: `Montage und Transport sind Anschaffungsnebenkosten, auch wenn sie von einer anderen Firma kommen. Als Aufwand gebucht, wäre die Maschine mit ${e(OHNE_NK.anschaffungskosten)} zu niedrig bewertet und der Gewinn dieses Jahres zu klein.`,
    },
    {
      typ: 'vorgerechnet',
      titel: 'Der Rechnungseingang',
      text: 'Die Rechnung aus dem Rätsel wird auf Ziel gebucht.',
      schritte: [
        {
          text: 'Anschaffungskosten aufs Anlagekonto',
          rechnung: `Technische Anlagen und Maschinen ${e(S.anschaffungskosten)}`,
          warum:
            'Das Anlagekonto ist ein Aktivkonto. Der Zugang steht im Soll, netto und einschließlich der Nebenkosten.',
        },
        {
          text: 'Vorsteuer getrennt',
          rechnung: `Vorsteuer ${e(S.vorsteuer)}`,
          warum: `Wer die Vorsteuer mit aktiviert, bucht ${e(MIT_VST.anschaffungskosten)} auf das Anlagekonto und schreibt später Steuer ab, die das Finanzamt längst erstattet hat.`,
        },
        {
          text: 'Gegenbuchung',
          rechnung: `an Verbindlichkeiten aus Lieferungen und Leistungen ${e(S.rechnung)}`,
          warum: 'Die MBG schuldet dem Lieferanten den vollen Rechnungsbetrag, bis sie zahlt.',
        },
      ],
    },
    {
      typ: 'vorhersage',
      frage: `Die MBG zahlt innerhalb der Frist mit ${SKONTO} Skonto. Was passiert mit den Anschaffungskosten der Maschine?`,
      optionen: [
        { text: `Sie sinken um den Nettoskonto von ${e(S.skontoNetto!)}.`, richtig: true },
        { text: 'Sie bleiben gleich, der Skonto kommt auf ein Nachlasskonto.' },
        { text: `Sie sinken um den Bruttoskonto von ${e(S.skontoBrutto!)}.` },
      ],
      aufloesung: `Skonto ist eine nachträgliche Anschaffungspreisminderung. Vom Bruttoskonto ${e(S.skontoBrutto!)} sind ${e(S.steuerKorrektur!)} Steuer, die Vorsteuer wird korrigiert. Die Maschine steht danach mit ${e(S.akEndgueltig!)} in den Büchern.`,
      aufloesungVisual: {
        typ: 'tkonto',
        name: 'Technische Anlagen und Maschinen',
        soll: [{ text: 'Verbindlichkeiten a. LL', betrag: S.anschaffungskosten.value.toString() }],
        haben: [{ text: 'Skonto (netto)', betrag: S.skontoNetto!.value.toString(), neu: true }],
        saldo: true,
      },
    },
    {
      typ: 'fehlerjagd',
      titel: 'Ein Kollege bucht die Zahlung',
      text: `Zahlung der Rechnung über ${e(S.rechnung)} mit ${SKONTO} Skonto. In einer Zeile steckt der Fehler.`,
      zeilen: [
        `Soll: Verbindlichkeiten a. LL ${e(S.rechnung)}`,
        `Haben: Bank ${e(S.zahlbetrag!)}`,
        `Haben: Nachlässe für Rohstoffe ${e(S.skontoNetto!)}`,
        `Haben: Vorsteuer ${e(S.steuerKorrektur!)}`,
      ],
      fehlerZeile: 2,
      gruende: [
        {
          text: 'Skonto auf eine Anlage mindert direkt das Anlagekonto, nicht ein Nachlasskonto für Stoffe.',
          richtig: true,
        },
        { text: 'Die Vorsteuer darf bei Skonto nicht korrigiert werden.' },
        { text: 'Die Bank muss den vollen Rechnungsbetrag zeigen.' },
      ],
      aufloesung: `Richtig: an Technische Anlagen und Maschinen ${e(S.skontoNetto!)}. Nachlasskonten gibt es nur für Stoffe und Handelswaren.`,
    },
    {
      typ: 'luecke',
      titel: 'Jetzt du',
      text: 'Ein Lagertank wird gekauft. Ergänze Anschaffungskosten, Vorsteuer und Rechnungsbetrag.',
      skillId: 'E1-anlagenkauf',
      seed: 2,
      variant: 'kauf',
      partId: 'ak',
      gefragt: ['ak', 'vorsteuer', 'rechnung'],
    },
    {
      typ: 'merksatz',
      id: 'E1-m1',
      frage: 'Wie ermittelt man die Anschaffungskosten einer Anlage, und wie wird Skonto gebucht?',
      text: 'Anschaffungspreis − Anschaffungspreisminderungen + Anschaffungsnebenkosten = Anschaffungskosten, immer netto. Buchung: Anlagekonto und Vorsteuer an Verbindlichkeiten. Skonto mindert das Anlagekonto (netto), die Vorsteuer wird korrigiert.',
    },
    {
      typ: 'klausur',
      punkte: 2,
      aufgabe: 'Bilden Sie den Buchungssatz für den Eingang der Rechnung.',
      part: { skillId: 'E1-anlagenkauf', seed: 5, variant: 'kauf', partId: 'eingang' },
      cliffhanger: {
        figur: 'frank',
        ausdruck: 'gruebelt',
        text: 'Unsere Werkstatt will die nächste Förderstrecke selbst bauen. Wie bucht man eigentlich etwas, das niemand verkauft hat?',
      },
    },
  ],
  skipTest: [
    {
      frage:
        'Listenpreis 20.000 €, 5 % Rabatt, Transport 500 €, Montage 1.000 € (alles netto). Anschaffungskosten?',
      optionen: [{ text: '20.500 €', richtig: true }, { text: '21.500 €' }, { text: '24.395 €' }],
    },
    {
      frage: 'Gehört die Vorsteuer zu den Anschaffungskosten einer Maschine?',
      optionen: [
        { text: 'Nein, sie wird mit der Umsatzsteuer verrechnet.', richtig: true },
        { text: 'Ja, sie wurde schließlich bezahlt.' },
        { text: 'Nur wenn die Rechnung sofort bezahlt wird.' },
      ],
    },
    {
      frage: 'Skonto bei der Zahlung für einen Lkw: Auf welchem Konto steht der Nettoskonto?',
      optionen: [
        { text: 'Fuhrpark (Haben)', richtig: true },
        { text: 'Nachlässe für Rohstoffe (Haben)' },
        { text: 'Erlösberichtigungen (Soll)' },
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
      'BA 3.3 S. 93 (Schema Anschaffungskosten, Sofortrabatt nicht gebucht), BA 3.4.2 S. 108 (Nettobuchung von Rabatt und Skonto bei Anlagen), 04-fachregeln.md GC-05; Zahlen aus der Engine; 03.11.2026',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
