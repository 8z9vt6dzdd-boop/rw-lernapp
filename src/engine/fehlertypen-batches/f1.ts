// Fehlertypen M7, Batch f1.
import type { Fehlertyp } from '../fehlertypen';

export const FEHLERTYPEN_F1: Record<string, Fehlertyp> = {
  // F3 – Wertmaßstäbe
  'hk-nur-einzelkosten': {
    titel: 'Wertuntergrenze nur aus Einzelkosten',
    erklaerung:
      'Zur Wertuntergrenze der Herstellungskosten gehören neben den Material- und Fertigungseinzelkosten und den Sondereinzelkosten der Fertigung auch die notwendigen Material- und Fertigungsgemeinkosten.',
  },
  'vertriebskosten-aktiviert': {
    titel: 'Vertriebskosten einbezogen',
    erklaerung:
      'Vertriebskosten – auch Sondereinzelkosten des Vertriebs – dürfen nicht in die Herstellungskosten einbezogen werden. Sie entstehen erst beim Verkauf, nicht bei der Herstellung.',
  },
  'verwaltung-in-untergrenze': {
    titel: 'Verwaltungskosten in der Untergrenze',
    erklaerung:
      'Kosten der allgemeinen Verwaltung sind ein Wahlbestandteil. Sie gehören in die Wertobergrenze, nicht in die Wertuntergrenze.',
  },
  'niederstwert-missachtet': {
    titel: 'Niedrigeren Wert nicht angesetzt',
    erklaerung:
      'Im Umlaufvermögen gilt das strenge Niederstwertprinzip: Liegt der Wert am Bilanzstichtag unter den Anschaffungskosten, muss auf den niedrigeren Wert abgeschrieben werden.',
  },
  'tageswert-ueber-ak': {
    titel: 'Wert über den Anschaffungskosten angesetzt',
    erklaerung:
      'Die (fortgeführten) Anschaffungs- oder Herstellungskosten sind die Obergrenze. Ein höherer Tageswert darf nicht angesetzt werden, sonst würde ein noch nicht realisierter Gewinn ausgewiesen.',
  },
  'gemildert-statt-streng': {
    titel: 'Gemildertes statt strenges Niederstwertprinzip',
    erklaerung:
      'Das Umlaufvermögen unterliegt dem strengen Niederstwertprinzip: Abgeschrieben wird auch dann, wenn die Wertminderung nur vorübergehend ist.',
  },
  'streng-statt-gemildert': {
    titel: 'Strenges statt gemildertes Niederstwertprinzip',
    erklaerung:
      'Für das Anlagevermögen gilt das gemilderte Niederstwertprinzip: Außerplanmäßig abschreiben muss man nur bei voraussichtlich dauernder Wertminderung.',
  },
  'abwertung-ohne-dauer': {
    titel: 'Abgeschrieben, obwohl die Wertminderung vorübergehend ist',
    erklaerung:
      'Bei einer Sachanlage mit nur vorübergehender Wertminderung bleibt es bei den fortgeführten Anschaffungskosten. Eine außerplanmäßige Abschreibung verlangt das gemilderte Niederstwertprinzip nur bei voraussichtlich dauernder Wertminderung.',
  },
  'fortfuehrung-vergessen': {
    titel: 'Planmäßige Abschreibungen nicht berücksichtigt',
    erklaerung:
      'Beim Anlagevermögen wird der beizulegende Wert mit den fortgeführten Anschaffungskosten verglichen: Anschaffungskosten minus bisherige planmäßige Abschreibungen.',
  },
  'kurs-multipliziert': {
    titel: 'Kurs falsch angewendet',
    erklaerung:
      'Lautet der Kurs „1 € = x US-Dollar“, erhältst du den Euro-Wert, indem du den Dollarbetrag durch den Kurs teilst.',
  },
  'hoechstwert-missachtet': {
    titel: 'Höheren Wert der Schuld nicht angesetzt',
    erklaerung:
      'Nach dem Höchstwertprinzip ist von zwei möglichen Werten einer Verbindlichkeit der höhere anzusetzen. Ist die Schuld durch den Kurs gestiegen, muss sie in der Bilanz erhöht werden.',
  },

  // F5 – Bewertung des Umlaufvermögens
  'durchschnitt-ungewichtet': {
    titel: 'Einfacher statt gewogener Durchschnitt',
    erklaerung:
      'Beim gewogenen Durchschnitt zählt jede Lieferung mit ihrer Menge: Gesamtwert aller Posten geteilt durch die Gesamtmenge – nicht der Mittelwert der Einzelpreise.',
  },
  'endbestand-fifo-lifo-vertauscht': {
    titel: 'Fifo und Lifo vertauscht',
    erklaerung:
      'Fifo: Das zuerst Beschaffte gilt als zuerst verbraucht, der Endbestand stammt aus den letzten Zugängen. Lifo: Das zuletzt Beschaffte gilt als zuerst verbraucht, der Endbestand stammt aus Anfangsbestand und ersten Zugängen.',
  },
};
