// Fehlertypen M7, Batch e (Skills E1, E2, E3).
import type { Fehlertyp } from '../fehlertypen';

export const FEHLERTYPEN_E: Record<string, Fehlertyp> = {
  // E1 – Anlagenkauf
  'vorsteuer-aktiviert': {
    titel: 'Vorsteuer aktiviert',
    erklaerung:
      'Die Vorsteuer gehört nicht zu den Anschaffungskosten, weil die MBG sie mit der Umsatzsteuer verrechnen kann. Auf das Anlagekonto kommt nur der Nettobetrag, die Vorsteuer auf ihr eigenes Konto.',
  },
  'nebenkosten-als-aufwand': {
    titel: 'Anschaffungsnebenkosten als Aufwand gebucht',
    erklaerung:
      'Transport, Montage, Fundament oder Überführung sind nötig, damit die Anlage betriebsbereit ist. Sie erhöhen die Anschaffungskosten und werden auf dem Anlagekonto aktiviert, nicht als Aufwand gebucht.',
  },
  'rabatt-vergessen': {
    titel: 'Rabatt nicht abgezogen',
    erklaerung:
      'Ein Sofortrabatt mindert den Anschaffungspreis direkt. Er wird nicht gesondert gebucht: Zuerst den Rabatt vom Listenpreis abziehen, dann die Nebenkosten addieren.',
  },
  // E2 – Eigenleistungen, Anlagen im Bau, Anzahlungen
  'gemeinkosten-vergessen': {
    titel: 'Gemeinkosten nicht einbezogen',
    erklaerung:
      'Zu den Herstellungskosten gehören neben Material und Fertigungslöhnen auch die angemessenen Material- und Fertigungsgemeinkosten. Rechne die Zuschläge aus und addiere sie.',
  },
  'vertriebskosten-aktiviert': {
    titel: 'Vertriebskosten aktiviert',
    erklaerung:
      'Vertriebskosten dürfen nicht in die Herstellungskosten einbezogen werden. Eine selbst gebaute Anlage wird ja nicht verkauft.',
  },
  'eigenleistung-falsches-ertragskonto': {
    titel: 'Falsches Gegenkonto für die Eigenleistung',
    erklaerung:
      'Eine selbst erstellte Anlage, die im eigenen Betrieb bleibt, ist weder Umsatz noch Bestandsveränderung. Gegenkonto ist das Ertragskonto Aktivierte Eigenleistungen.',
  },
  'anzahlung-ohne-ust': {
    titel: 'Anzahlung ohne Vorsteuer gebucht',
    erklaerung:
      'Anzahlungen sind umsatzsteuerpflichtig. Auf das Konto Geleistete Anzahlungen auf Sachanlagen kommt der Nettobetrag, die Vorsteuer wird sofort gebucht.',
  },
  'anzahlung-nicht-verrechnet': {
    titel: 'Anzahlung nicht ausgebucht',
    erklaerung:
      'Mit der Schlussrechnung ist die Anzahlung verbraucht. Auf Anlagen im Bau kommt die volle Rechnungssumme netto, die Anzahlung wird im Haben ausgebucht.',
  },
  'anzahlung-brutto-verrechnet': {
    titel: 'Vorsteuer der Anzahlung doppelt berücksichtigt',
    erklaerung:
      'Die Vorsteuer auf die Anzahlung wurde schon bei der Anzahlung gebucht. In der Schlussrechnung zählt nur noch die Vorsteuer auf den Restbetrag; die Anzahlung wird netto ausgebucht.',
  },
  'aib-teilweise-umgebucht': {
    titel: 'Nicht der gesamte Bestand umgebucht',
    erklaerung:
      'Bei Fertigstellung wird der gesamte Bestand des Kontos Anlagen im Bau umgebucht, also auch die Beträge aus dem Vorjahr. Sie gehören alle zu den Anschaffungskosten der Anlage.',
  },
  // E3 – Bilanzielle Abschreibung
  'volle-jahres-afa': {
    titel: 'Volle Jahresabschreibung im Anschaffungsjahr',
    erklaerung:
      'Im Anschaffungsjahr wird zeitanteilig (pro rata temporis) abgeschrieben: nur für die Monate ab der Anschaffung bis Dezember.',
  },
  'anschaffungsmonat-vergessen': {
    titel: 'Anschaffungsmonat nicht mitgezählt',
    erklaerung:
      'Monatsgenau gerechnet zählt der Monat der Anschaffung voll mit. Bei Anschaffung im September sind es also 4 Monate (September bis Dezember).',
  },
  'degressiv-vom-ak': {
    titel: 'Degressiver Satz auf die Anschaffungskosten angewendet',
    erklaerung:
      'Geometrisch-degressiv gilt der Satz jedes Jahr für den Buchwert des Vorjahres. Nur im ersten Jahr ist das der Anschaffungswert.',
  },
};
