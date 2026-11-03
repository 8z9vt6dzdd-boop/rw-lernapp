// Fehlertypen M7, Batch c1 (Skills C1–C4, Beschaffung).
import type { Fehlertyp } from '../fehlertypen';

export const FEHLERTYPEN_C1: Record<string, Fehlertyp> = {
  // Erfassung des Werkstoffeinkaufs (C1, auch C2–C4)
  'erfassungsmethode-verwechselt': {
    titel: 'Bestands- und aufwandsorientierte Erfassung verwechselt',
    erklaerung:
      'Bestandsorientiert landet der Einkauf auf dem Bestandskonto (z. B. Rohstoffe), aufwandsorientiert direkt auf dem Aufwandskonto (z. B. Aufwendungen für Rohstoffe). Bezugskosten, Nachlässe und Rücksendungen folgen immer dem Konto, auf dem der Einkauf gebucht wurde.',
  },
  'einkauf-ohne-vorsteuer': {
    titel: 'Vorsteuer beim Einkauf vergessen',
    erklaerung:
      'Auf den Warenwert berechnet der Lieferer Umsatzsteuer. Für die MBG ist sie Vorsteuer: Sie steht im Soll, die Verbindlichkeit im Haben in Höhe des Bruttobetrags.',
  },
  'anfangsbestand-vergessen': {
    titel: 'Anfangsbestand nicht berücksichtigt',
    erklaerung:
      'Verbraucht werden kann auch, was schon am Anfang im Lager lag. Deshalb: Anfangsbestand + Zugänge − Schlussbestand = Verbrauch bzw. Anfangsbestand + Zugänge − Entnahmen = Buchbestand.',
  },
  'schlussbestand-als-verbrauch': {
    titel: 'Schlussbestand mit dem Verbrauch verwechselt',
    erklaerung:
      'Der Schlussbestand laut Inventur ist das, was noch im Lager liegt. Er geht ins Schlussbilanzkonto. Aufwand ist nur der Rest: Anfangsbestand + Zugänge − Schlussbestand.',
  },
  'mehr-minder-verwechselt': {
    titel: 'Mehr- und Minderbestand verwechselt',
    erklaerung:
      'Ist der Schlussbestand höher als der Anfangsbestand, liegt ein Mehrbestand vor: Stoffkonto an Aufwandskonto, der Aufwand sinkt. Ist er niedriger, liegt ein Minderbestand vor: Aufwandskonto an Stoffkonto, der Aufwand steigt.',
  },
  'einkauf-gleich-verbrauch': {
    titel: 'Bestandsveränderung beim Aufwand vergessen',
    erklaerung:
      'Aufwandsorientiert stehen zunächst alle Einkäufe im Aufwand. Der tatsächliche Verbrauch ergibt sich erst nach der Bestandsveränderung: Einkäufe − Mehrbestand bzw. + Minderbestand.',
  },

  // Bezugskosten (C2)
  'bezugskosten-ohne-vorsteuer': {
    titel: 'Vorsteuer auf die Bezugskosten vergessen',
    erklaerung:
      'Bezugskosten sind umsatzsteuerpflichtig. Die Vorsteuer wird auf Warenwert und Nebenkosten zusammen berechnet; bei einer Speditionsrechnung wird der Bruttobetrag in Netto und Vorsteuer zerlegt.',
  },
  'bezugskosten-als-ausgangsfracht': {
    titel: 'Eingangsfracht als Ausgangsfracht gebucht',
    erklaerung:
      'Fracht für den Einkauf gehört zu den Anschaffungskosten des Werkstoffs und kommt auf das Unterkonto Bezugskosten. Ausgangsfrachten sind nur Versandkosten beim Verkauf an Kunden.',
  },
  'bezugskosten-direkt-auf-stoffkonto': {
    titel: 'Bezugskosten nicht auf dem Unterkonto erfasst',
    erklaerung:
      'Die Anschaffungskosten wären im Ergebnis gleich hoch. Gebucht wird aber auf einem eigenen Unterkonto (Bezugskosten für …), damit die Nebenkosten kontrolliert werden können. Erst am Periodenende wird umgebucht.',
  },
  'frachtanteil-nicht-herausgerechnet': {
    titel: 'Frachtanteil nicht herausgerechnet',
    erklaerung:
      'Enthält der Rechnungsbetrag einen Frachtanteil, wird er mit dem Prozentsatz herausgerechnet und auf Bezugskosten gebucht. Nur der Rest ist der Warenwert.',
  },
  'schluessel-gewicht-wert-vertauscht': {
    titel: 'Gewichts- und Wertspesen vertauscht',
    erklaerung:
      'Fracht und Rollgeld hängen vom Gewicht ab und werden nach Gewicht verteilt. Versicherung hängt vom Wert ab und wird nach dem Warenwert verteilt.',
  },
  'umbuchung-unterkonto-richtung': {
    titel: 'Unterkonto in falscher Richtung abgeschlossen',
    erklaerung:
      'Ein Unterkonto wird über sein Hauptkonto abgeschlossen, der Saldo steht dabei auf der Gegenseite: Bezugskosten (Sollsaldo) mit „Stoffkonto an Bezugskosten“, Nachlässe (Habensaldo) mit „Nachlässe an Stoffkonto“.',
  },
  'unterkonto-saldo-falsch': {
    titel: 'Saldo des Unterkontos falsch gebildet',
    erklaerung:
      'Der Saldo ist die Differenz beider Seiten. Buchungen auf der Gegenseite (z. B. eine Gutschrift auf dem Bezugskostenkonto oder eine Vorsteuerkorrektur auf dem Nachlasskonto) werden abgezogen.',
  },

  // Rücksendungen (C3)
  'ruecksendung-als-nachlass': {
    titel: 'Rücksendung als Nachlass gebucht',
    erklaerung:
      'Eine Rücksendung ist ein Storno: Die Ware verlässt die MBG wieder, deshalb wird das Konto korrigiert, auf dem der Einkauf gebucht wurde (z. B. Rohstoffe). Das Nachlasskonto ist nur für Preisnachlässe, bei denen die Ware bleibt.',
  },
  'ruecksendung-ohne-vorsteuer': {
    titel: 'Vorsteuer bei der Rücksendung nicht korrigiert',
    erklaerung:
      'Mit der Rücksendung sinkt das Entgelt. Deshalb wird auch die Vorsteuer anteilig zurückgebucht: Vorsteuer im Haben, die Verbindlichkeit sinkt um den Bruttobetrag.',
  },
  'gutschrift-brutto-als-netto': {
    titel: 'Bruttobetrag der Gutschrift als Nettowert behandelt',
    erklaerung:
      'Eine Gutschrift „einschließlich Umsatzsteuer“ ist ein Bruttobetrag. Netto = Brutto ÷ (1 + Steuersatz); die Differenz ist die Vorsteuerkorrektur. Die Verbindlichkeit sinkt genau um den Gutschriftsbetrag.',
  },
  'sofortrabatt-nicht-abgezogen': {
    titel: 'Sofortrabatt nicht abgezogen',
    erklaerung:
      'Ein Sofortrabatt auf der Rechnung wurde nie gebucht: Auf dem Stoffkonto steht nur der rabattierte Preis. Zurückgebucht wird deshalb auch nur der Listenpreis abzüglich Rabatt.',
  },

  // Nachlässe (C4)
  'nachlass-ohne-vorsteuer': {
    titel: 'Vorsteuer beim Nachlass nicht korrigiert',
    erklaerung:
      'Ein nachträglicher Preisnachlass mindert das Entgelt und damit auch die Vorsteuer. Nettomethode: Nachlass netto auf das Nachlasskonto, Steueranteil sofort an Vorsteuer.',
  },
  'nachlass-direkt-auf-stoffkonto': {
    titel: 'Nachlass nicht auf dem Unterkonto erfasst',
    erklaerung:
      'Bleibt die Ware bei der MBG und sinkt nur der Preis, wird der Nachlass auf dem Unterkonto „Nachlässe für …“ gebucht, nicht direkt auf dem Stoffkonto. Direkt auf das Stoffkonto gehört nur die Rücksendung (Storno).',
  },
  'nachlass-als-erloesberichtigung': {
    titel: 'Einkaufsnachlass als Erlösberichtigung gebucht',
    erklaerung:
      'Erlösberichtigungen betreffen den Verkauf: Nachlässe, die die MBG ihren Kunden gewährt. Nachlässe, die die MBG von Lieferern erhält, kommen auf das Nachlasskonto des Werkstoffs.',
  },
  'nachlass-vom-bruttobetrag': {
    titel: 'Nachlass vom Bruttobetrag als Nettowert behandelt',
    erklaerung:
      'Wird der Prozentsatz auf den Rechnungsbetrag (brutto) angewendet, ergibt sich der Bruttonachlass. Er muss noch in Nachlass netto und Vorsteueranteil zerlegt werden. Einfacher: Prozentsatz auf den Warenwert netto anwenden.',
  },
  'bruttomethode-ohne-korrektur': {
    titel: 'Steuerkorrektur der Bruttomethode vergessen',
    erklaerung:
      'Bei der Bruttomethode steht der Nachlass zunächst brutto auf dem Nachlasskonto. Am Ende des Voranmeldungszeitraums folgt die Korrektur: Nachlässe an Vorsteuer mit dem Steueranteil.',
  },
};
