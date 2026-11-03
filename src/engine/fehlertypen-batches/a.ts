// Fehlertypen M7, Batch a (Fundament: A3–A7). Alle IDs mit Präfix „a-“.
import type { Fehlertyp } from '../fehlertypen';

export const FEHLERTYPEN_A: Record<string, Fehlertyp> = {
  // A3 Kontenarten
  'a-aktiv-passiv-vertauscht': {
    titel: 'Aktiv- und Passivkonto verwechselt',
    erklaerung:
      'Aktivkonten zeigen, was die MBG besitzt (Vermögen, auch Forderungen und Bankguthaben). Passivkonten zeigen, woher die Mittel stammen: Eigenkapital und Schulden wie Darlehen oder Lieferantenverbindlichkeiten.',
  },
  'a-aufwand-ertrag-vertauscht': {
    titel: 'Aufwands- und Ertragskonto verwechselt',
    erklaerung:
      'Aufwand ist Werteverzehr (die MBG zahlt oder verbraucht etwas), Ertrag ist Wertzuwachs (die MBG verdient etwas). Achte auf die Richtung: Zinsen zahlen ist Aufwand, Zinsen erhalten ist Ertrag.',
  },
  'a-bestand-erfolg-verwechselt': {
    titel: 'Bestandskonto und Erfolgskonto verwechselt',
    erklaerung:
      'Bestandskonten (aktiv, passiv) zeigen, was am Stichtag vorhanden ist bzw. geschuldet wird. Erfolgskonten (Aufwand, Ertrag) sammeln nur, was im Jahr verbraucht oder verdient wird. Lagerbestand ist Vermögen, erst der Verbrauch ist Aufwand; Vorsteuer ist eine Forderung, Umsatzsteuer eine Schuld.',
  },
  'a-kontoseite-vertauscht': {
    titel: 'Zugang oder Abgang auf der falschen Kontoseite',
    erklaerung:
      'Aktiv- und Aufwandskonten nehmen im Soll zu und im Haben ab. Passiv- und Ertragskonten nehmen im Haben zu und im Soll ab. Der Anfangsbestand steht auf der Zugangsseite.',
  },
  'a-saldo-seite': {
    titel: 'Saldo auf der falschen Seite',
    erklaerung:
      'Der Saldo gleicht das Konto aus. Er wird auf der wertmäßig kleineren Seite eingetragen – bei Aktiv- und Aufwandskonten also im Haben, bei Passiv- und Ertragskonten im Soll.',
  },
  'a-abgaenge-addiert': {
    titel: 'Abgänge addiert statt abgezogen',
    erklaerung:
      'Schlussbestand = Anfangsbestand + Zugänge − Abgänge. Abgänge stehen auf der Gegenseite des Kontos und verringern den Bestand.',
  },
  'a-anfangsbestand-vergessen': {
    titel: 'Anfangsbestand vergessen',
    erklaerung:
      'Bestandskonten starten mit dem Anfangsbestand aus der Eröffnungsbilanz. Er gehört zur Zugangsseite und muss in den Schlussbestand eingerechnet werden.',
  },
  'a-zugang-abgang-verwechselt': {
    titel: 'Zugang und Abgang verwechselt',
    erklaerung:
      'Frage bei jedem Vorfall: Hat die MBG danach mehr oder weniger auf diesem Konto? Eine bezahlte Lieferantenrechnung verringert die Verbindlichkeiten; ein neues Darlehen erhöht sie.',
  },
  'a-summe-statt-saldo': {
    titel: 'Kontosumme statt Saldo',
    erklaerung:
      'Die Summe der größeren Kontoseite ist nicht der Saldo. Der Saldo ist der Unterschied zwischen beiden Seiten – also Summe der größeren Seite minus Summe der kleineren Seite.',
  },

  // A4 Bilanzveränderungen
  'a-aktivtausch-passivtausch-vertauscht': {
    titel: 'Aktivtausch und Passivtausch verwechselt',
    erklaerung:
      'Beim Aktivtausch ändern sich zwei Posten der Aktivseite (z. B. Bank und Fuhrpark), beim Passivtausch zwei Posten der Passivseite (z. B. Verbindlichkeiten und Darlehen). Prüfe, auf welcher Bilanzseite die berührten Posten stehen.',
  },
  'a-tausch-als-mehrung-minderung': {
    titel: 'Tausch als Mehrung oder Minderung eingeordnet',
    erklaerung:
      'Ändern sich zwei Posten derselben Bilanzseite gegenläufig, ist es ein Tausch: Die Bilanzsumme bleibt gleich. Mehrung und Minderung betreffen immer beide Bilanzseiten.',
  },
  'a-mehrung-minderung-als-tausch': {
    titel: 'Mehrung oder Minderung als Tausch eingeordnet',
    erklaerung:
      'Sind ein Aktiv- und ein Passivposten berührt, ändert sich die Bilanzsumme: Nehmen beide zu, ist es eine Aktiv-Passiv-Mehrung, nehmen beide ab, eine Aktiv-Passiv-Minderung.',
  },
  'a-mehrung-minderung-vertauscht': {
    titel: 'Mehrung und Minderung verwechselt',
    erklaerung:
      'Ein neues Darlehen oder ein Kauf auf Ziel verlängert die Bilanz (Mehrung). Eine Tilgung oder die Bezahlung einer Lieferantenrechnung verkürzt sie (Minderung).',
  },

  // A5 Buchungssätze
  'a-zahlungsweg-verwechselt': {
    titel: 'Bank und Kasse verwechselt',
    erklaerung:
      'Bar bezahlt heißt Kasse, per Überweisung oder Abbuchung heißt Bank. Lies im Sachverhalt genau, wie gezahlt wird.',
  },
  'a-ziel-zahlung-verwechselt': {
    titel: 'Kauf auf Ziel und sofortige Zahlung verwechselt',
    erklaerung:
      '„Auf Ziel“ oder „auf Rechnung“ bedeutet: Es fließt noch kein Geld, es entsteht eine Verbindlichkeit (bzw. beim Verkauf eine Forderung). Nur bei sofortiger Zahlung steht Bank oder Kasse im Buchungssatz.',
  },
  'a-forderung-verbindlichkeit-verwechselt': {
    titel: 'Forderungen und Verbindlichkeiten verwechselt',
    erklaerung:
      'Forderungen hat die MBG gegenüber Kunden (diese schulden ihr Geld). Verbindlichkeiten hat sie gegenüber Lieferanten (sie schuldet ihnen Geld).',
  },
  'a-anlage-als-aufwand': {
    titel: 'Anlagegut als Aufwand gebucht',
    erklaerung:
      'Gegenstände, die die MBG über Jahre nutzt (Gabelstapler, Maschinen, Büromöbel), sind Vermögen und kommen auf ein Anlagekonto. Aufwand entsteht erst nach und nach über die Abschreibung.',
  },
  'a-aufwand-ertrag-konto': {
    titel: 'Aufwands- statt Ertragskonto (oder umgekehrt)',
    erklaerung:
      'Zahlt die MBG Zinsen oder Miete, ist das Aufwand (Soll). Erhält sie Zinsen oder Miete, ist das Ertrag (Haben). Das Konto richtet sich danach, wer zahlt.',
  },
  'a-verkauf-als-bestandsabgang': {
    titel: 'Verkauf über das Erzeugniskonto gebucht',
    erklaerung:
      'Beim Verkauf entsteht Ertrag: Gebucht wird auf Umsatzerlöse. Das Konto Fertige Erzeugnisse wird nur über die Inventur bzw. Bestandsveränderungen angepasst.',
  },
  'a-tilgung-als-aufwand': {
    titel: 'Tilgung als Zinsaufwand gebucht',
    erklaerung:
      'Die Tilgung verringert die Schuld (Darlehensschulden im Soll) und ist kein Aufwand. Nur die Zinsen sind Aufwand.',
  },
  'a-teilbetrag-falsch': {
    titel: 'Gesamtbetrag und Teilbeträge vermischt',
    erklaerung:
      'Beim zusammengesetzten Buchungssatz bekommt jedes Konto nur seinen Teilbetrag. Die Summe der Soll-Beträge muss der Summe der Haben-Beträge entsprechen.',
  },

  // A6 Eröffnung und Abschluss
  'a-eroeffnung-seiten-vertauscht': {
    titel: 'Eröffnungsbuchung falsch herum',
    erklaerung:
      'Aktivkonten erhalten ihren Anfangsbestand im Soll: Aktivkonto an EBK. Passivkonten im Haben: EBK an Passivkonto. Das EBK ist deshalb das Spiegelbild der Eröffnungsbilanz – Aktiva im Haben, Passiva im Soll.',
  },
  'a-eroeffnung-ueber-sbk': {
    titel: 'Eröffnung über das Schlussbilanzkonto',
    erklaerung:
      'Gegenkonto der Eröffnungsbuchungen ist das Eröffnungsbilanzkonto (auch Saldenvortrag genannt). Das Schlussbilanzkonto nimmt erst am Jahresende die Schlussbestände auf.',
  },
  'a-abschluss-richtung': {
    titel: 'Abschlussbuchung falsch herum',
    erklaerung:
      'Der Saldo steht auf der kleineren Kontoseite. Daraus folgt: SBK an Aktivkonto, Passivkonto an SBK, GuV an Aufwandskonto, Ertragskonto an GuV.',
  },
  'a-bestandskonto-ueber-guv': {
    titel: 'Bestandskonto über die GuV abgeschlossen',
    erklaerung:
      'Bestandskonten (Vermögen und Schulden) werden über das Schlussbilanzkonto abgeschlossen. In die GuV gehören nur Aufwands- und Ertragskonten.',
  },
  'a-erfolgskonto-ueber-sbk': {
    titel: 'Erfolgskonto über das SBK abgeschlossen',
    erklaerung:
      'Aufwands- und Ertragskonten haben keinen Anfangsbestand und werden über das Gewinn- und Verlustkonto abgeschlossen. Erst dessen Saldo gelangt ins Eigenkapital.',
  },
  'a-guv-ergebnis-vertauscht': {
    titel: 'Gewinn und Verlust verwechselt',
    erklaerung:
      'Sind die Erträge größer als die Aufwendungen, entsteht ein Gewinn: GuV an Eigenkapital (das Eigenkapital wächst im Haben). Bei einem Verlust: Eigenkapital an GuV.',
  },
  'a-guv-ueber-sbk': {
    titel: 'GuV über das Schlussbilanzkonto abgeschlossen',
    erklaerung:
      'Das Gewinn- und Verlustkonto wird über das Eigenkapital abgeschlossen. Erst das Eigenkapital geht mit seinem Schlussbestand ins Schlussbilanzkonto.',
  },

  // A7 Eigenkapitalvergleich
  'a-entnahmen-vorzeichen': {
    titel: 'Privatentnahmen mit falschem Vorzeichen',
    erklaerung:
      'Entnahmen haben das Eigenkapital gesenkt, ohne den Erfolg zu mindern. Beim Eigenkapitalvergleich werden sie deshalb hinzugerechnet. Rechnest du vom Erfolg auf das Eigenkapital, werden sie abgezogen.',
  },
  'a-einlagen-vorzeichen': {
    titel: 'Privateinlagen mit falschem Vorzeichen',
    erklaerung:
      'Einlagen (z. B. eine Erbschaft) haben das Eigenkapital erhöht, sind aber nicht erwirtschaftet. Beim Eigenkapitalvergleich werden sie abgezogen; vom Erfolg zum Eigenkapital werden sie addiert.',
  },
  'a-privat-vergessen': {
    titel: 'Privatvorgänge nicht berücksichtigt',
    erklaerung:
      'Bei einer Personengesellschaft verändern Entnahmen und Einlagen das Eigenkapital. Die bloße Eigenkapitaldifferenz ist deshalb noch nicht der Erfolg: + Entnahmen − Einlagen.',
  },
  'a-ek-differenz-vertauscht': {
    titel: 'Eigenkapitaldifferenz falsch herum',
    erklaerung:
      'Gerechnet wird Eigenkapital am Ende minus Eigenkapital am Anfang. Ist das Eigenkapital gesunken, ist die Veränderung negativ.',
  },
  'a-schulden-nicht-abgezogen': {
    titel: 'Schulden nicht abgezogen',
    erklaerung:
      'Eigenkapital = Vermögen − Schulden. Erst nach Abzug der Schulden lassen sich die Eigenkapitalbestände vergleichen.',
  },
};
