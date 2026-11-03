// Lektion F6 – Forderungsbewertung (eigene Formulierung; Buchungsregeln nach 04-fachregeln.md,
// Abschnitt 2 Nr. 8 und GC-12). Alle Beträge werden von der Engine berechnet.
import { Val, formatEuro, formatProzent } from '../../engine/money';
import { solveF6, type F6Params } from '../../engine/generators/f2/forderungsbewertung';
import type { Lektion } from './types';

const e = (v: { value: { toString(): string } } | string) =>
  formatEuro(typeof v === 'string' ? v : v.value.toString());

const BISTRO = 'Bistro Paderufer Lüke (Paderborn)';
const BASIS: F6Params = {
  fall: 'ewb',
  kunde: BISTRO,
  ustSatz: '0.19',
  brutto: '8330',
  quote: '0.6',
  quoteArt: 'ausfall',
  zweifelhaft: true,
  bestand: '0',
  pwbSatz: '0',
  altBestand: '0',
};
const EWB = solveF6(BASIS);
const QUOTE = formatProzent(BASIS.quote);
// Typischer Fehler: Wertberichtigung vom Bruttobetrag
const FALSCH_BRUTTO = formatEuro(new Val(BASIS.brutto).times(BASIS.quote).fix().value.toString());
const UST_RECHNUNG = new Val(BASIS.brutto).minus(EWB.netto);
// Was im neuen Jahr passieren kann (gleiche Forderung)
const TOTAL = solveF6({ ...BASIS, fall: 'ausfall' });
const QUOTE_FALL = solveF6({
  ...BASIS,
  fall: 'insolvenzquote',
  quote: '0.3',
  quoteArt: 'erstattung',
});
const EINGANG = solveF6({ ...BASIS, fall: 'eingang', brutto: '1190' });
// Pauschalwertberichtigung: übrige Forderungen
const PWB = solveF6({
  ...BASIS,
  fall: 'pwb',
  bestand: '246330',
  pwbSatz: '0.01',
  altBestand: '0',
});

export const lektionF6: Lektion = {
  id: 'F6',
  skillId: 'F6-forderungsbewertung',
  abschnitt: 'F',
  titel: 'Wenn ein Kunde nicht zahlen kann',
  kernAha:
    'Eine zweifelhafte Forderung bleibt in voller Höhe stehen; der erwartete Ausfall wird indirekt über eine Wertberichtigung vom Nettobetrag erfasst. Die Umsatzsteuer wird erst korrigiert, wenn der Ausfall endgültig feststeht.',
  dauerMin: 8,
  figuren: ['tobias', 'jana', 'frank'],
  ort: 'buero',
  quelle: 'BA 5.3.5.2; 04-fachregeln.md (Abschnitt 2 Nr. 8, GC-12)',
  teaser: {
    figur: 'tobias',
    ausdruck: 'entsetzt',
    text: 'Das Bistro am Paderufer ist pleite – und schuldet uns noch Geld!',
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'buero',
      visual: {
        typ: 'beleg',
        absender: 'MBG Getränke OHG (Lernversion)',
        nummer: 'AR-2026-1187',
        datum: '14.11.',
        zeilen: [
          { text: `An: ${BISTRO}` },
          { text: 'Fassbier und Limonade, Lieferung November', betrag: EWB.netto.value.toString() },
          {
            text: 'zzgl. 19 % Umsatzsteuer',
            betrag: UST_RECHNUNG.value.toString(),
          },
          { text: 'Rechnungsbetrag', betrag: BASIS.brutto, fett: true },
        ],
        fuss: 'Zahlbar innerhalb von 30 Tagen. Stand 20.12.: nicht bezahlt.',
      },
      sprecher: [
        {
          figur: 'tobias',
          ausdruck: 'entsetzt',
          text: 'Das Bistro hat Insolvenz angemeldet. Sind die Euro jetzt einfach weg?',
        },
        {
          figur: 'jana',
          ausdruck: 'gruebelt',
          text: 'Vielleicht nicht alle. Aber in voller Höhe glaube ich auch nicht mehr daran.',
        },
      ],
      frage: `In den Büchern steht die Forderung mit ${e(BASIS.brutto)}. Was ist sie am 31.12. wirklich wert?`,
    },
    {
      typ: 'dialog',
      ort: 'buero',
      sprecher: [
        {
          figur: 'jana',
          ausdruck: 'erklaert',
          text: 'Stell dir vor, du hast einem Freund 100 € geliehen, und er verliert seinen Job. Du streichst ihn nicht aus dem Notizbuch, rechnest aber nicht mehr mit allem.',
        },
        {
          figur: 'jana',
          ausdruck: 'neutral',
          text: 'Genau so ist das Bistro jetzt eine zweifelhafte Forderung: Ob und wie viel kommt, ist unsicher.',
        },
        {
          figur: 'frank',
          ausdruck: 'gruebelt',
          text: 'Und wann ist das Geld wirklich verloren?',
        },
      ],
    },
    {
      typ: 'sortieren',
      titel: 'Wie gut ist die Forderung?',
      text: 'Ordne jede Forderung der MBG ein.',
      kategorien: ['einwandfrei', 'zweifelhaft', 'uneinbringlich'],
      elemente: [
        {
          text: 'Ein Getränkemarkt zahlt seit Jahren pünktlich, die Rechnung ist noch nicht fällig.',
          kategorie: 'einwandfrei',
        },
        {
          text: 'Über das Vermögen eines Hotels wurde das Insolvenzverfahren eröffnet.',
          kategorie: 'zweifelhaft',
          erklaerung:
            'Ein Teil kann noch über das Insolvenzverfahren kommen. Der Eingang ist unsicher.',
        },
        {
          text: 'Eine Tankstelle zahlt trotz dreier Mahnungen nicht.',
          kategorie: 'zweifelhaft',
        },
        {
          text: 'Das Insolvenzverfahren eines Kiosks wurde mangels Masse eingestellt.',
          kategorie: 'uneinbringlich',
          erklaerung: 'Es ist kein Vermögen mehr da: Der Ausfall steht endgültig fest.',
        },
        {
          text: 'Ein Großhändler hat im Dezember bestellt und bekommt Ware auf Rechnung.',
          kategorie: 'einwandfrei',
        },
      ],
    },
    {
      typ: 'konzept',
      titel: 'Schritt 1: Umbuchen',
      text: 'Eine zweifelhafte Forderung wird in voller Höhe (brutto) auf ein eigenes Konto umgebucht: Zweifelhafte Forderungen. So sieht jeder sofort, wo ein Risiko steckt. Der Betrag selbst ändert sich dadurch noch nicht.',
      visual: {
        typ: 'tkonten',
        konten: [
          {
            name: 'Forderungen a. LL',
            soll: [{ text: 'Rechnung Bistro', betrag: BASIS.brutto }],
            haben: [{ text: 'Zweifelhafte Forderungen', betrag: BASIS.brutto, neu: true }],
          },
          {
            name: 'Zweifelhafte Forderungen',
            soll: [{ text: 'Forderungen a. LL', betrag: BASIS.brutto, neu: true }],
            haben: [],
          },
        ],
      },
    },
    {
      typ: 'vorhersage',
      frage: `Die Insolvenzverwalterin rechnet mit ${QUOTE} Ausfall. Wie hoch ist die Wertberichtigung?`,
      optionen: [
        { text: FALSCH_BRUTTO, erklaerung: 'Das sind 60 % vom Bruttobetrag.' },
        { text: e(EWB.wert), richtig: true },
        { text: e(EWB.netto) },
      ],
      aufloesung: `Abgeschrieben wird vom Nettobetrag: ${e(BASIS.brutto)} ÷ 1,19 = ${e(EWB.netto)}, davon ${QUOTE} = ${e(EWB.wert)}. Die Umsatzsteuer im Bruttobetrag ist kein Verlust der MBG – sie wird erst korrigiert, wenn der Ausfall feststeht.`,
      figur: {
        figur: 'frank',
        ausdruck: 'gruebelt',
        text: 'Ich hätte jetzt einfach den Rechnungsbetrag genommen.',
      },
    },
    {
      typ: 'wer-hat-recht',
      frage: 'Darf die MBG schon jetzt die Umsatzsteuer zurückholen?',
      a: {
        figur: 'tobias',
        ausdruck: 'freut',
        text: 'Klar, das Geld kommt ja eh nicht. Dann holen wir uns wenigstens die Steuer zurück!',
      },
      b: {
        figur: 'jana',
        ausdruck: 'erklaert',
        text: 'Noch nicht. Solange nur geschätzt wird, bleibt die Umsatzsteuer unverändert.',
      },
      richtig: 'b',
      begruendungen: [
        {
          text: 'Die Umsatzsteuer darf erst korrigiert werden, wenn der Ausfall endgültig feststeht.',
          richtig: true,
        },
        { text: 'Umsatzsteuer wird bei Forderungsausfällen nie korrigiert.' },
        { text: 'Die Steuer korrigiert nur das Finanzamt selbst.' },
      ],
      aufloesung:
        'Die Wertberichtigung ist eine Schätzung. Erst wenn feststeht, wie viel ausfällt (Quote oder Totalausfall), mindert sich das Entgelt – dann wird die Umsatzsteuer anteilig korrigiert.',
    },
    {
      typ: 'vorgerechnet',
      titel: 'Die Buchungen zum 31.12.',
      text: `Forderung an das Bistro ${e(BASIS.brutto)}, erwarteter Ausfall ${QUOTE}.`,
      visual: {
        typ: 'tkonto',
        name: 'Einzelwertberichtigung zu Forderungen',
        soll: [],
        haben: [{ text: 'Einstellung in Wertberichtigungen', betrag: EWB.wert.value.toString() }],
      },
      schritte: [
        {
          text: 'Umbuchung',
          rechnung: `Zweifelhafte Forderungen an Forderungen a. LL ${e(BASIS.brutto)}`,
          warum: 'Die Forderung wird für Mahnung und Insolvenzverfahren in voller Höhe gebraucht.',
        },
        {
          text: 'Nettobetrag',
          rechnung: `${e(BASIS.brutto)} ÷ 1,19 = ${e(EWB.netto)}`,
          warum: 'Nur der Nettobetrag ist Ertrag der MBG und kann verloren gehen.',
        },
        {
          text: 'Einzelwertberichtigung',
          rechnung: `${e(EWB.netto)} × ${QUOTE} = ${e(EWB.wert)}`,
          warum: 'Der erwartete Ausfall mindert den Gewinn schon im alten Jahr (Vorsicht).',
        },
        {
          text: 'Buchungssatz',
          rechnung: `Einstellung in Wertberichtigungen an Einzelwertberichtigung zu Forderungen ${e(EWB.wert)}`,
          warum:
            'Indirekt: Die Forderung bleibt stehen, auf der Passivseite steht der Korrekturposten EWB.',
        },
      ],
    },
    {
      typ: 'erkunden',
      titel: 'Wie geht es im neuen Jahr weiter?',
      text: 'Decke auf, was mit der Forderung des Bistros passieren kann.',
      erkunden: {
        art: 'aufdecken',
        karten: [
          {
            titel: 'Totalausfall',
            text: `Verfahren mangels Masse eingestellt: Abschreibungen auf Forderungen ${e(TOTAL.netto)} und Umsatzsteuer ${e(TOTAL.steuer)} an Zweifelhafte Forderungen ${e(BASIS.brutto)}.`,
            farbe: '#c2410c',
          },
          {
            titel: 'Quote von 30 %',
            text: `Bank ${e(QUOTE_FALL.bank)}, Abschreibungen auf Forderungen ${e(QUOTE_FALL.netto)}, Umsatzsteuer ${e(QUOTE_FALL.steuer)} an Zweifelhafte Forderungen ${e(BASIS.brutto)}.`,
            farbe: '#1c6670',
          },
          {
            titel: 'Später doch Geld',
            text: `Nach dem Totalausfall überweist der Wirt doch ${e('1190')}: Bank an Erträge aus abgeschriebenen Forderungen ${e(EINGANG.netto)} und an Umsatzsteuer ${e(EINGANG.steuer)}.`,
            farbe: '#65a30d',
          },
        ],
      },
      fazit:
        'Jetzt steht der Ausfall fest, also wird die Umsatzsteuer auf den verlorenen Teil korrigiert. Kommt später doch Geld, lebt die Steuer wieder auf.',
    },
    {
      typ: 'konzept',
      titel: 'Und die übrigen Kunden?',
      text: 'Auch gute Kunden fallen manchmal aus. Dafür gibt es die Pauschalwertberichtigung: ein Prozentsatz auf die einwandfreien Forderungen, netto. Zweifelhafte Forderungen werden vorher herausgerechnet – sie haben ihre Einzelwertberichtigung schon.',
      visual: {
        typ: 'karten',
        karten: [
          {
            titel: 'Forderungen a. LL',
            text: `${e(PWB.brutto2.plus(BASIS.brutto))} brutto, darin das Bistro`,
            farbe: '#1c6670',
          },
          {
            titel: '− zweifelhaft',
            text: `${e(BASIS.brutto)} (eigene EWB)`,
            farbe: '#c2410c',
          },
          {
            titel: '= einwandfrei',
            text: `${e(PWB.brutto2)} brutto = ${e(PWB.netto)} netto → 1 % = ${e(PWB.wert)}`,
            farbe: '#65a30d',
          },
        ],
      },
    },
    {
      typ: 'luecke',
      titel: 'Jetzt du',
      text: 'Neuer Abschluss, gleiches Muster. Ergänze die einwandfreien Forderungen und die erforderliche Pauschalwertberichtigung.',
      skillId: 'F6-forderungsbewertung',
      seed: 20,
      variant: 'pwb',
      partId: 'rechnung',
      gefragt: ['einwandfrei', 'wert'],
    },
    {
      typ: 'merksatz',
      id: 'F6-m1',
      frage: 'Wie wird eine zweifelhafte Forderung zum Jahresabschluss behandelt?',
      text: 'Zweifelhafte Forderung brutto umbuchen, den geschätzten Ausfall vom Nettobetrag indirekt wertberichtigen (EWB). Umsatzsteuer erst korrigieren, wenn der Ausfall endgültig feststeht. PWB nur auf die einwandfreien Forderungen, netto.',
    },
    {
      typ: 'klausur',
      punkte: 4,
      aufgabe:
        'Bilden Sie die Buchungssätze zum 31.12. (Umbuchung der zweifelhaften Forderung und Einzelwertberichtigung).',
      part: { skillId: 'F6-forderungsbewertung', seed: 14, variant: 'ewb', partId: 'buchung' },
      cliffhanger: {
        figur: 'tobias',
        ausdruck: 'freut',
        text: 'Gute Nachricht zum Schluss: Den Messestand für Februar habe ich schon im Dezember bezahlt. Das sind doch Kosten von diesem Jahr, oder?',
      },
    },
  ],
  skipTest: [
    {
      frage:
        'Forderung 2.380 € brutto (19 % USt), erwarteter Ausfall 50 %. Wie hoch ist die Einzelwertberichtigung?',
      optionen: [
        { text: '1.000,00 €', richtig: true },
        { text: '1.190,00 €' },
        { text: '190,00 €' },
      ],
    },
    {
      frage: 'Wann wird bei einer zweifelhaften Forderung die Umsatzsteuer korrigiert?',
      optionen: [
        { text: 'Erst wenn der Ausfall endgültig feststeht', richtig: true },
        { text: 'Sofort bei der Umbuchung auf Zweifelhafte Forderungen' },
        { text: 'Bei der Bildung der Einzelwertberichtigung' },
      ],
    },
    {
      frage: 'Worauf wird die Pauschalwertberichtigung berechnet?',
      optionen: [
        { text: 'Auf die einwandfreien Forderungen, netto', richtig: true },
        { text: 'Auf alle Forderungen einschließlich der zweifelhaften, brutto' },
        { text: 'Auf die zweifelhaften Forderungen, netto' },
      ],
    },
    {
      frage:
        'Eine bereits abgeschriebene Forderung wird doch noch bezahlt. Was gilt für die Umsatzsteuer?',
      optionen: [
        { text: 'Sie lebt wieder auf und wird im Haben gebucht.', richtig: true },
        { text: 'Sie bleibt unberücksichtigt, alles ist Ertrag.' },
        { text: 'Sie wird als Vorsteuer gebucht.' },
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
      'Gegen BA 5.3.5.2 geprüft (Umbuchung brutto, EWB/PWB vom Nettobetrag, USt-Korrektur erst bei feststehendem Ausfall, Wiederaufleben der USt); Zahlen aus der Engine (solveF6); 03.11.2026',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
