// Fehlertypen M7, Batch c2.
import type { Fehlertyp } from '../fehlertypen';

export const FEHLERTYPEN_C2: Record<string, Fehlertyp> = {
  // Leihverpackung (C6)
  'leihverpackung-als-forderung': {
    titel: 'Leihverpackung als Forderung gebucht',
    erklaerung:
      'Berechnete Leihverpackung gehört zu den Anschaffungsnebenkosten. Sie wird auf dem Unterkonto Bezugskosten des Stoffes gebucht, nicht als Forderung. Eine spätere Gutschrift mindert dann die Bezugskosten.',
  },
  'leihverpackung-im-stoffkonto': {
    titel: 'Leihverpackung direkt auf dem Stoffkonto',
    erklaerung:
      'Leihverpackung wird zunächst getrennt auf dem Unterkonto Bezugskosten erfasst. So bleibt sichtbar, was eine Rückgabe gutschreiben kann. Erst der Rest wird später auf das Stoffkonto umgebucht.',
  },
  'leihverpackung-ohne-vorsteuer': {
    titel: 'Vorsteuer nur vom Warenwert',
    erklaerung:
      'Auch die berechnete Leihverpackung ist umsatzsteuerpflichtig. Die Vorsteuer wird von Warenwert und Verpackung zusammen gerechnet.',
  },
  'leihverpackung-gutschrift-stoffkonto': {
    titel: 'Gutschrift auf dem Stoffkonto statt auf Bezugskosten',
    erklaerung:
      'Zurückgegeben wird die Verpackung, nicht die Ware. Die Gutschrift mindert deshalb das Konto, auf dem die Verpackung gebucht wurde: Bezugskosten, im Haben.',
  },
  'leihverpackung-gutschrift-nachlass': {
    titel: 'Gutschrift als Nachlass gebucht',
    erklaerung:
      'Die Gutschrift für zurückgegebene Leihverpackung ist kein Preisnachlass auf die Ware. Sie macht berechnete Bezugskosten rückgängig und wird auf dem Bezugskostenkonto im Haben gebucht.',
  },
  'leihverpackung-gutschrift-ohne-vorsteuer': {
    titel: 'Vorsteuer bei der Gutschrift nicht korrigiert',
    erklaerung:
      'Die Gutschrift mindert das Entgelt. Deshalb sinkt auch die Vorsteuer: Verbindlichkeiten a. LL (brutto) an Bezugskosten (netto), an Vorsteuer.',
  },
  'leihverpackung-gutschrift-alle': {
    titel: 'Gutschrift für alle Verpackungen gerechnet',
    erklaerung:
      'Gutgeschrieben werden nur die zurückgegebenen Stücke. Was die MBG behält, bleibt als Bezugskosten stehen und erhöht die Anschaffungskosten.',
  },
  'leihverpackung-gutschrift-voll': {
    titel: 'Gutschriftsatz übersehen',
    erklaerung:
      'Schreibt der Lieferant nur einen Teil des berechneten Werts gut, wird auch nur dieser Teil gebucht. Der Rest bleibt als Bezugskosten bei der MBG.',
  },

  // Bezugskalkulation (C7)
  'bezugskalk-skonto-vom-listenpreis': {
    titel: 'Skonto vom Listenpreis gerechnet',
    erklaerung:
      'Zuerst wird der Rabatt vom Listeneinkaufspreis abgezogen. Der Skonto bezieht sich auf den verbleibenden Zieleinkaufspreis.',
  },
  'bezugskalk-bezugskosten-skontiert': {
    titel: 'Bezugskosten mitskontiert',
    erklaerung:
      'Der Lieferant gewährt Skonto nur auf seine Warenrechnung. Fracht und Versicherung einer Spedition kommen erst nach dem Skonto hinzu.',
  },
  'bezugskalk-bezugskosten-vergessen': {
    titel: 'Bezugskosten vergessen',
    erklaerung:
      'Der Bezugspreis (Einstandspreis) enthält alle Kosten, bis die Ware im Lager ist: Bareinkaufspreis plus Bezugskosten wie Fracht und Versicherung.',
  },
  'bezugskalk-fracht-basis': {
    titel: 'Fracht „je 100 Einheiten“ falsch umgerechnet',
    erklaerung:
      'Ist die Fracht je 100 Einheiten angegeben, wird sie mit Menge ÷ 100 multipliziert, nicht mit der ganzen Menge.',
  },
  'bezugskalk-listenpreis-verglichen': {
    titel: 'Angebote nach dem Listenpreis verglichen',
    erklaerung:
      'Der niedrigste Listenpreis ist nicht automatisch das günstigste Angebot. Rabatt, Skonto und Bezugskosten verändern den Preis; verglichen werden die Bezugspreise.',
  },

  // Handelswaren (C8)
  'handelswaren-wareneinsatz-gleich-einkauf': {
    titel: 'Wareneinsatz mit den Einkäufen gleichgesetzt',
    erklaerung:
      'Eingekauft ist nicht gleich verkauft. Wareneinsatz = Anfangsbestand + Einkäufe − Schlussbestand lt. Inventur; die Bestandsveränderung gehört dazu.',
  },
  'handelswaren-bestaende-vertauscht': {
    titel: 'Anfangs- und Schlussbestand vertauscht',
    erklaerung:
      'Der Anfangsbestand stand schon im Lager und wird verkauft – er erhöht den Wareneinsatz. Der Schlussbestand ist noch da und wird abgezogen.',
  },
  'handelswaren-unterkonten-vergessen': {
    titel: 'Bezugskosten oder Nachlässe nicht umgebucht',
    erklaerung:
      'Vor der Ermittlung des Wareneinsatzes werden die Unterkonten auf das Konto Handelswaren umgebucht: Bezugskosten erhöhen, Nachlässe mindern den Einstandswert.',
  },
  'handelswaren-mehr-minder-vertauscht': {
    titel: 'Mehr- und Minderbestand verwechselt',
    erklaerung:
      'Schlussbestand größer als Anfangsbestand ist ein Mehrbestand: Ein Teil der gebuchten Einkäufe liegt noch im Lager und mindert den Aufwand (Handelswaren an Aufwendungen für Handelswaren).',
  },
  'handelswaren-als-aufwand': {
    titel: 'Einkauf als Aufwand gebucht',
    erklaerung:
      'Bei bestandsorientierter Erfassung kommt der Einkauf auf das Bestandskonto Handelswaren. Aufwand wird erst der Wareneinsatz, den die Inventur am Jahresende zeigt.',
  },
  'handelswaren-erloese-eigene-erzeugnisse': {
    titel: 'Erlös auf Umsatzerlöse für eigene Erzeugnisse',
    erklaerung:
      'Zugekaufte und unverändert weiterverkaufte Ware ist kein eigenes Erzeugnis. Ihr Erlös steht getrennt auf Umsatzerlöse für Handelswaren.',
  },
  'handelswaren-verkauf-ueber-warenkonto': {
    titel: 'Verkauf im Haben des Warenkontos gebucht',
    erklaerung:
      'Der Verkauf ist ein Ertrag zum Verkaufspreis und gehört auf Umsatzerlöse für Handelswaren. Das Konto Handelswaren wird nicht beim Verkauf, sondern über die Inventur am Jahresende entlastet.',
  },
};
