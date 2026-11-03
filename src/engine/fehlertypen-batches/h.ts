// Fehlertypen M7, Batch h.
import type { Fehlertyp } from '../fehlertypen';

export const FEHLERTYPEN_H: Record<string, Fehlertyp> = {
  // Materialmengen (H1)
  'mengen-zugang-vergessen': {
    titel: 'Zugänge vergessen',
    erklaerung:
      'Bei der Inventurmethode gilt: Verbrauch = Anfangsbestand + Zugänge − Endbestand laut Inventur. Ohne die Zugänge laut Lieferscheinen fehlt alles, was im Monat neu ins Lager kam.',
  },
  'festwert-statt-inventur': {
    titel: 'Zugang als Verbrauch angesetzt',
    erklaerung:
      'Verbrauch = Zugang ist das vereinfachte Festwertverfahren. Die Inventurmethode berücksichtigt zusätzlich, wie sich der Bestand vom Anfang zum Ende verändert hat.',
  },
  'inventurdifferenz-vorzeichen': {
    titel: 'Inventurdifferenz falsch herum gerechnet',
    erklaerung:
      'Inventurdifferenz = rechnerischer Endbestand (Soll) − Endbestand laut Inventur (Ist). Liegt der Ist-Bestand darunter, ist Material verloren gegangen: Die Differenz ist positiv.',
  },
  'stueckliste-nicht-angewendet': {
    titel: 'Stückliste nicht angewendet',
    erklaerung:
      'Bei der retrograden Methode wird jede hergestellte Einheit mit ihrem Materialbedarf laut Stückliste multipliziert. Die Zahl der Erzeugnisse allein ist noch kein Materialverbrauch.',
  },
  'gesamtdifferenz-als-schwund': {
    titel: 'Schwund und Mehrverbrauch vermischt',
    erklaerung:
      'Der Unterschied zwischen Inventur- und Sollverbrauch hat zwei Ursachen: Schwund im Lager (rechnerischer gegen tatsächlichen Endbestand) und Mehrverbrauch in der Fertigung (Entnahmen gegen Stückliste). Beide getrennt ermitteln.',
  },

  // Materialbewertung (H2)
  'ungewichteter-durchschnitt': {
    titel: 'Ungewogener Durchschnitt',
    erklaerung:
      'Der Durchschnittspreis wird mit den Mengen gewichtet: Gesamtwert ÷ Gesamtmenge. Einfach die Preise zu mitteln, übersieht, dass von manchen Partien viel mehr auf Lager liegt.',
  },
  'durchschnitt-ohne-anfangsbestand': {
    titel: 'Anfangsbestand nicht berücksichtigt',
    erklaerung:
      'Verlangt ist der Durchschnitt mit Anfangsbestand: Wert und Menge des Anfangsbestands gehören in Zähler und Nenner.',
  },
  'fifo-lifo-vertauscht': {
    titel: 'Fifo und Lifo verwechselt',
    erklaerung:
      'Fifo (first in – first out): die ältesten Partien gelten als zuerst verbraucht. Lifo (last in – first out): die zuletzt eingelagerten Partien zuerst.',
  },
  'hifo-lofo-vertauscht': {
    titel: 'Hifo und Lofo verwechselt',
    erklaerung:
      'Hifo (highest in – first out): die teuersten Partien zuerst. Lofo (lowest in – first out): die billigsten Partien zuerst.',
  },
  'endbestand-statt-verbrauch': {
    titel: 'Endbestand und Verbrauch vertauscht',
    erklaerung:
      'Materialverbrauchskosten sind der Wert der Abgänge. Was danach noch im Lager liegt, ist der Endbestand. Beide zusammen ergeben den Wert von Anfangsbestand und Zugängen.',
  },
  'periodisch-statt-permanent': {
    titel: 'Periodisch statt permanent gerechnet',
    erklaerung:
      'Permanent wird jeder Abgang zum Zeitpunkt der Entnahme bewertet – nur mit den Partien, die dann schon auf Lager sind. Periodisch wird erst am Monatsende der Gesamtverbrauch bewertet.',
  },

  // Kalkulatorische Zinsen (H5)
  'zinsen-vom-anschaffungswert': {
    titel: 'Zinsen vom vollen Anschaffungswert',
    erklaerung:
      'Abnutzbares Anlagevermögen bindet über die Nutzungsdauer im Durchschnitt nur etwa die Hälfte des Kapitals. Bei der Durchschnittswertverzinsung deshalb (Anschaffungswert + Restwert) ÷ 2 ansetzen.',
  },
  'restwert-bei-durchschnitt-vergessen': {
    titel: 'Restwert beim Durchschnittswert vergessen',
    erklaerung:
      'Der Restwert bleibt bis zum Ende der Nutzung gebunden. Das durchschnittlich gebundene Kapital ist deshalb (Anschaffungswert + Restwert) ÷ 2.',
  },
  'restwert-jahresende': {
    titel: 'Restwert vom Jahresende verwendet',
    erklaerung:
      'Verlangt ist die Verzinsung des Restwerts zu Beginn des Jahres: Im ersten Jahr ist das der volle Anschaffungswert, danach jeweils eine Jahresabschreibung weniger.',
  },
  'nicht-betriebsnotwendig-einbezogen': {
    titel: 'Nicht betriebsnotwendiges Vermögen einbezogen',
    erklaerung:
      'Kalkulatorische Zinsen gibt es nur auf Vermögen, das dem Betriebszweck dient. Vermietete Wohnhäuser, reine Geldanlagen oder stillgelegte Anlagen werden ausgesondert.',
  },
  'abzugskapital-vergessen': {
    titel: 'Abzugskapital nicht abgezogen',
    erklaerung:
      'Kundenanzahlungen und Lieferantenkredite stehen der MBG zinslos zur Verfügung. Sie werden vom betriebsnotwendigen Vermögen abgezogen, um das betriebsnotwendige Kapital zu erhalten.',
  },
  'darlehen-als-abzugskapital': {
    titel: 'Verzinstes Darlehen als Abzugskapital',
    erklaerung:
      'Abzugskapital ist nur zinslos überlassenes Kapital. Ein Bankdarlehen kostet Zinsen und gehört zum betriebsnotwendigen Kapital, das verzinst wird.',
  },
  'endbestand-statt-mittelwert': {
    titel: 'Endbestand statt Mittelwert',
    erklaerung:
      'Das Umlaufvermögen schwankt im Jahr. Angesetzt wird deshalb der Mittelwert aus Anfangs- und Endbestand, nicht ein einzelner Stichtagswert.',
  },

  // Wagnisse und Zusatzkosten (H6)
  'wagnissatz-vom-durchschnitt': {
    titel: 'Schäden durch den Jahresdurchschnitt geteilt',
    erklaerung:
      'Schäden und Bezugsbasis müssen denselben Zeitraum betreffen: Summe der Schäden aller Vorjahre ÷ Summe der Bezugsbasis aller Vorjahre.',
  },
  'wagnis-als-zusatzkosten': {
    titel: 'Wagniskosten als Zusatzkosten eingeordnet',
    erklaerung:
      'In der Finanzbuchhaltung werden die tatsächlich eingetretenen Schäden als Aufwand gebucht. Die Kostenrechnung setzt stattdessen einen geglätteten Betrag an: Das sind Anderskosten.',
  },
  'zusatzkosten-als-anderskosten': {
    titel: 'Zusatzkosten als Anderskosten eingeordnet',
    erklaerung:
      'Für kalkulatorischen Unternehmerlohn und kalkulatorische Miete eigener Räume gibt es in der Personengesellschaft keinen Aufwand. Kosten ohne Aufwand heißen Zusatzkosten.',
  },
  'unternehmerlohn-nur-ein-gesellschafter': {
    titel: 'Nur ein Gesellschafter berücksichtigt',
    erklaerung:
      'Der kalkulatorische Unternehmerlohn wird für jeden mitarbeitenden Gesellschafter angesetzt – hier für beide.',
  },
  'zusatzkosten-monat-statt-jahr': {
    titel: 'Monats- und Jahreswert verwechselt',
    erklaerung:
      'Die Vergleichsgehälter und die ortsübliche Miete sind Monatswerte. Für das Jahr mit 12 multiplizieren.',
  },
};
