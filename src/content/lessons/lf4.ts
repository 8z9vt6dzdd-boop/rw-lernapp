// Lektion F4 – Bilanzansatz: Pflicht, Wahlrecht, Verbot, Zurechnung, Bilanzierungszeitpunkt
// (eigene Formulierung; geprüft gegen BA 5.3.2–5.3.4)
import type { Lektion } from './types';

const PFLICHT = 'Bilanzierungspflicht';
const WAHL = 'Bilanzierungswahlrecht';
const VERBOT = 'Bilanzierungsverbot';

export const lektionF4: Lektion = {
  id: 'F4',
  skillId: 'F4-ansatz',
  abschnitt: 'F',
  titel: 'Was kommt überhaupt in die Bilanz?',
  kernAha:
    'Alles, was der MBG wirtschaftlich gehört, muss in die Bilanz (Vollständigkeit, § 246 Abs. 1 HGB) – entscheidend ist das wirtschaftliche, nicht das rechtliche Eigentum; Ausnahmen gibt es nur, wo das Gesetz ein Wahlrecht oder ein Verbot vorsieht.',
  dauerMin: 7,
  figuren: ['tobias', 'jana', 'frank'],
  ort: 'lager',
  quelle: 'BA 5.3.2–5.3.4, S. 138–142',
  teaser: {
    figur: 'tobias',
    ausdruck: 'freut',
    text: 'Geleaste Stapler, Dosen unter Eigentumsvorbehalt – das muss doch nicht in die Bilanz, oder?',
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'lager',
      sprecher: [
        {
          figur: 'tobias',
          ausdruck: 'freut',
          text: 'Die neuen Gabelstapler sind geleast, und die Dosen vom Dosenwerk gehören laut Vertrag noch dem Lieferanten, bis wir zahlen. Also bleibt beides draußen aus der Bilanz, richtig?',
        },
        {
          figur: 'jana',
          ausdruck: 'gruebelt',
          text: 'Nicht so schnell. Für die Bilanz zählt nicht, wessen Name im Vertrag steht.',
        },
      ],
      frage: 'Was muss in die Bilanz der MBG – und wonach wird das entschieden?',
    },
    {
      typ: 'dialog',
      ort: 'buero',
      sprecher: [
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Kennst du das von einem Auto auf Raten? Der Fahrzeugbrief liegt bei der Bank, aber du fährst den Wagen jeden Tag.',
        },
        {
          figur: 'frank',
          ausdruck: 'neutral',
          text: 'Rechtlich gehört er also der Bank, wirtschaftlich mir. So ähnlich denkt die Bilanz.',
        },
      ],
    },
    {
      typ: 'vorhersage',
      frage:
        'Das Dosenwerk hat die Dosen unter Eigentumsvorbehalt geliefert. Wer nimmt sie in seine Bilanz?',
      optionen: [
        { text: 'Die MBG als Erwerber', richtig: true },
        {
          text: 'Das Dosenwerk, weil es noch rechtlicher Eigentümer ist',
          erklaerung: 'Das rechtliche Eigentum allein entscheidet nicht über die Bilanzierung.',
        },
        {
          text: 'Niemand, bis die Rechnung bezahlt ist',
          erklaerung: 'Nach dem Grundsatz der Vollständigkeit muss sie jemand bilanzieren.',
        },
      ],
      aufloesung:
        'Maßgeblich ist das wirtschaftliche Eigentum (§ 39 Abs. 2 Nr. 1 AO): Wer die tatsächliche Herrschaft über ein Wirtschaftsgut hat und den Eigentümer im Regelfall für die gewöhnliche Nutzungsdauer ausschließen kann, bilanziert. Bei Eigentumsvorbehalt ist das der Erwerber.',
    },
    {
      typ: 'konzept',
      titel: 'Grundsatz der Vollständigkeit',
      text: 'Nach § 246 Abs. 1 HGB gehören alle Vermögensgegenstände, Schulden und Rechnungsabgrenzungsposten in die Bilanz: Bilanzierungspflicht. Ausnahmen gibt es nur dort, wo das Gesetz ein Wahlrecht einräumt oder ein Verbot ausspricht.',
      visual: {
        typ: 'karten',
        karten: [
          {
            titel: PFLICHT,
            text: 'Der Regelfall: Vorräte, Maschinen, Forderungen, Verbindlichkeiten.',
            farbe: '#1c6670',
          },
          {
            titel: WAHL,
            text: 'Darf angesetzt werden, z. B. ein Disagio (§ 250 Abs. 3 HGB).',
            farbe: '#e2b13c',
          },
          {
            titel: VERBOT,
            text: 'Darf nicht angesetzt werden, z. B. Gründungsaufwendungen (§ 248 Abs. 1 HGB).',
            farbe: '#e8792b',
          },
        ],
      },
    },
    {
      typ: 'sortieren',
      titel: 'Pflicht, Wahlrecht oder Verbot?',
      kategorien: [PFLICHT, WAHL, VERBOT],
      elemente: [
        { text: 'Vorräte an Aromakonzentrat', kategorie: PFLICHT },
        { text: 'Verbindlichkeiten gegenüber dem Dosenwerk', kategorie: PFLICHT },
        { text: 'Aufwendungen für die Gründung des Unternehmens', kategorie: VERBOT },
        { text: 'Aufwendungen für die Beschaffung von Eigenkapital', kategorie: VERBOT },
        {
          text: 'Disagio eines Bankdarlehens',
          kategorie: WAHL,
          erklaerung:
            'Ist der Rückzahlungsbetrag höher als der Ausgabebetrag, darf der Unterschied aktiviert werden (§ 250 Abs. 3 HGB).',
        },
        {
          text: 'Rückstellung für einen Zweck, den § 249 Abs. 1 HGB nicht nennt',
          kategorie: VERBOT,
        },
        {
          text: 'Pensionsrückstellung für eine Zusage aus dem Jahr 1985',
          kategorie: WAHL,
          erklaerung: 'Für Pensionszusagen vor dem 1.1.1987 besteht ein Passivierungswahlrecht.',
        },
      ],
    },
    {
      typ: 'verstaendnis',
      frage:
        'Die Gabelstapler haben eine betriebsgewöhnliche Nutzungsdauer von 5 Jahren. Die Grundmietzeit beträgt 4 Jahre, eine Kauf- oder Verlängerungsoption gibt es nicht. Wer bilanziert die Stapler?',
      figur: {
        figur: 'jana',
        ausdruck: 'erklaert',
        text: 'Beim Leasing kommt es auf das Verhältnis von Grundmietzeit zu Nutzungsdauer an.',
      },
      optionen: [
        {
          text: 'Der Leasinggeber – die Grundmietzeit liegt mit 80 % zwischen 40 % und 90 % der Nutzungsdauer.',
          richtig: true,
          erklaerung:
            'Richtig: Ohne Option bleibt der Gegenstand in diesem Fall beim Leasinggeber.',
        },
        {
          text: 'Die MBG – geleaste Gegenstände bilanziert immer der Leasingnehmer.',
          erklaerung:
            'Das gilt nur bei einer Grundmietzeit über 90 % oder unter 40 % der Nutzungsdauer.',
        },
        {
          text: 'Die MBG – weil die Grundmietzeit über 40 % liegt.',
          erklaerung:
            'Umgekehrt: Zwischen 40 % und 90 % ohne Option wird beim Leasinggeber bilanziert.',
        },
      ],
    },
    {
      typ: 'entscheidung',
      frage:
        'Im November hat die MBG 40 Tonnen Zucker zum festen Preis für eine Lieferung im Februar bestellt. Am 31.12. ist weder geliefert noch gezahlt. Was gehört in die Bilanz?',
      figur: {
        figur: 'jana',
        ausdruck: 'gruebelt',
        text: 'Der Vertrag ist unterschrieben, aber noch hat keiner etwas geleistet.',
      },
      optionen: [
        {
          text: 'Nichts – solange Leistung und Gegenleistung gleichwertig sind',
          folge:
            'Richtig: Ein schwebendes Geschäft erscheint nicht in der Bilanz. Das Realisationsprinzip verhindert einen vorzeitigen Gewinnausweis.',
          ausdruck: 'freut',
          empfohlen: true,
        },
        {
          text: 'Den Zucker als Vorrat und eine Verbindlichkeit einbuchen',
          folge:
            'Zu früh: Der Zucker ist noch nicht geliefert, also gibt es weder einen Vorrat noch eine Schuld aus einer Lieferung.',
          ausdruck: 'entsetzt',
        },
        {
          text: 'Den erwarteten Vorteil aus dem günstigen Festpreis als Ertrag buchen',
          folge: 'Das verbietet das Realisationsprinzip: Gewinne erst, wenn sie realisiert sind.',
          ausdruck: 'entsetzt',
        },
      ],
      fazit:
        'Anders, wenn der Zuckerpreis bis zum Stichtag deutlich unter den vereinbarten Preis fällt: Dann droht ein Verlust, und dafür ist schon jetzt eine Rückstellung zu bilden. Steuerlich ist diese Drohverlustrückstellung allerdings verboten.',
    },
    {
      typ: 'fehlerjagd',
      titel: 'Die Notizen des Praktikanten',
      text: 'Ein Praktikant hat sich Regeln für die Bilanzaufstellung notiert. Eine Notiz verstößt gegen eine Vorschrift.',
      zeilen: [
        'Forderungen an Kunden erfasse ich in der Regel bei Rechnungsstellung.',
        'Zahlungen erfasse ich, wenn das Geld fließt.',
        'Unser Bankguthaben und das Darlehen bei einer anderen Bank verrechne ich – dann steht nur der Unterschied in der Bilanz.',
        'Erlösschmälerungen ziehe ich von den Umsatzerlösen ab.',
      ],
      fehlerZeile: 2,
      gruende: [
        {
          text: 'Verrechnungsverbot (§ 246 Abs. 2 HGB): Posten der Aktivseite dürfen nicht mit Posten der Passivseite saldiert werden.',
          richtig: true,
        },
        { text: 'Forderungen dürfen erst bei Zahlungseingang erfasst werden.' },
        { text: 'Erlösschmälerungen dürfen nie von den Umsatzerlösen abgezogen werden.' },
      ],
      aufloesung:
        'Soll- und Habenposten, Aufwand und Ertrag werden grundsätzlich nicht verrechnet. Erlösschmälerungen von den Umsatzerlösen abzuziehen, ist eine gesetzliche Ausnahme (§ 277 Abs. 1 HGB).',
    },
    {
      typ: 'merksatz',
      id: 'F4-m1',
      frage: 'Was gehört nach dem Grundsatz der Vollständigkeit in die Bilanz?',
      text: 'Alle Vermögensgegenstände, Schulden und Rechnungsabgrenzungsposten (§ 246 Abs. 1 HGB), zugerechnet nach dem wirtschaftlichen Eigentum. Ausnahmen nur bei gesetzlichem Wahlrecht (etwa Disagio) oder Verbot (etwa Gründungsaufwendungen). Verrechnen ist grundsätzlich verboten.',
    },
    {
      typ: 'klausur',
      punkte: 3,
      aufgabe:
        'Erklären Sie das Rechtsinstitut des wirtschaftlichen Eigentums und nennen Sie ein Beispiel aus der Bilanzierungspraxis.',
      part: {
        typ: 'kurzantwort',
        id: 'wirtschaftliches-eigentum',
        frage:
          'Erklären Sie das Rechtsinstitut des wirtschaftlichen Eigentums und nennen Sie ein Beispiel aus der Bilanzierungspraxis.',
        punkte: 3,
        checkliste: [
          {
            aussage:
              'Für die Zurechnung in der Bilanz zählt das wirtschaftliche, nicht das rechtliche Eigentum (§ 39 Abs. 2 Nr. 1 AO).',
            punkte: 1,
          },
          {
            aussage:
              'Wirtschaftlicher Eigentümer ist, wer die tatsächliche Herrschaft ausübt und den rechtlichen Eigentümer im Regelfall für die gewöhnliche Nutzungsdauer ausschließen kann.',
            punkte: 1,
          },
          {
            aussage:
              'Beispiel: Ware unter Eigentumsvorbehalt bilanziert der Erwerber; oder Leasing mit Grundmietzeit über 90 % bzw. unter 40 % der Nutzungsdauer beim Leasingnehmer.',
            punkte: 1,
          },
        ],
        muster:
          'Ob ein Gegenstand in die eigene Bilanz gehört, richtet sich nicht nach dem rechtlichen, sondern nach dem wirtschaftlichen Eigentum (§ 39 Abs. 2 Nr. 1 AO). Wirtschaftlicher Eigentümer ist, wer – ohne rechtlicher Eigentümer zu sein – tatsächlich über das Wirtschaftsgut bestimmt und den rechtlichen Eigentümer während der gewöhnlichen Nutzungsdauer in aller Regel von jeder Einwirkung ausschließen kann. Beispiel: Ware, die unter Eigentumsvorbehalt geliefert wurde, bilanziert der Erwerber, obwohl sie rechtlich bis zur Bezahlung dem Lieferanten gehört.',
      },
      cliffhanger: {
        figur: 'jana',
        ausdruck: 'gruebelt',
        text: 'Morgen ist Inventur im Konzentratlager. Wir haben dieses Jahr zu vier verschiedenen Preisen eingekauft – welcher Preis kommt da in die Bilanz?',
      },
    },
  ],
  skipTest: [
    {
      frage: 'Was verlangt der Grundsatz der Vollständigkeit (§ 246 Abs. 1 HGB)?',
      optionen: [
        {
          text: 'Alle Vermögensgegenstände, Schulden und Rechnungsabgrenzungsposten anzusetzen',
          richtig: true,
        },
        { text: 'Nur bezahlte Vermögensgegenstände anzusetzen' },
        { text: 'Nur Gegenstände im rechtlichen Eigentum anzusetzen' },
      ],
    },
    {
      frage: 'Wer bilanziert Ware, die unter Eigentumsvorbehalt geliefert wurde?',
      optionen: [
        { text: 'Der Erwerber', richtig: true },
        { text: 'Der Lieferant' },
        { text: 'Niemand bis zur Bezahlung' },
      ],
    },
    {
      frage: 'Wofür besteht ein Bilanzierungsverbot?',
      optionen: [
        { text: 'Aufwendungen für die Gründung des Unternehmens', richtig: true },
        { text: 'Disagio' },
        { text: 'Vorräte' },
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
      'BA 5.3.2 (Vollständigkeit § 246 Abs. 1, wirtschaftliches Eigentum § 39 Abs. 2 Nr. 1 AO, Eigentumsvorbehalt, Leasing 40/90 %), BA 5.3.3 (Bilanzierungszeitpunkt, schwebende Geschäfte, Drohverlustrückstellung), BA 5.3.4 (Verbote § 248 Abs. 1, § 249 Abs. 2; Verrechnungsverbot § 246 Abs. 2 mit Ausnahmen; Wahlrechte Disagio, Altzusagen vor 1987) abgeglichen am 03.11.2026',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
