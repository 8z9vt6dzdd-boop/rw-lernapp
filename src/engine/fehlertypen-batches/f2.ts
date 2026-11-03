// Fehlertypen M7, Batch f2 (F6 Forderungsbewertung, F7 Rechnungsabgrenzung, F8 Rückstellungen).
import type { Fehlertyp } from '../fehlertypen';

export const FEHLERTYPEN_F2: Record<string, Fehlertyp> = {
  // F6 – Forderungsbewertung
  'abschreibung-vom-brutto': {
    titel: 'Vom Bruttobetrag abgeschrieben',
    erklaerung:
      'Wertberichtigungen und Abschreibungen auf Forderungen werden immer vom Nettobetrag gerechnet. Die enthaltene Umsatzsteuer ist kein Verlust der MBG: Sie wird bei einem endgültigen Ausfall über das Konto Umsatzsteuer korrigiert.',
  },
  'ust-korrektur-zu-frueh': {
    titel: 'Umsatzsteuer zu früh korrigiert',
    erklaerung:
      'Bei einer Wertberichtigung ist der Ausfall nur geschätzt. Die Umsatzsteuer darf erst korrigiert werden, wenn der Ausfall endgültig feststeht (oder die Insolvenzquote bekannt ist).',
  },
  'pwb-auf-gesamtbestand': {
    titel: 'Zweifelhafte Forderung nicht herausgerechnet',
    erklaerung:
      'Die Pauschalwertberichtigung gilt nur für die einwandfreien Forderungen. Zweifelhafte Forderungen haben schon eine eigene Einzelwertberichtigung und werden vorher vom Forderungsbestand abgezogen.',
  },
  'wb-differenz-ignoriert': {
    titel: 'Vorhandene Wertberichtigung nicht berücksichtigt',
    erklaerung:
      'Eine Wertberichtigung aus dem Vorjahr wird nur angepasst: Gebucht wird die Differenz zwischen neuem Soll-Bestand und vorhandenem Bestand – als Einstellung, wenn mehr gebraucht wird, sonst als Ertrag aus der Herabsetzung.',
  },
  'ewb-direkt-abgeschrieben': {
    titel: 'Direkt statt indirekt abgeschrieben',
    erklaerung:
      'Solange der Ausfall nur geschätzt ist, bleibt die Forderung in voller Höhe stehen (sie wird noch für Mahnung und Insolvenzverfahren gebraucht). Der geschätzte Ausfall wird indirekt über die Einzelwertberichtigung erfasst.',
  },
  'insolvenzquote-verwechselt': {
    titel: 'Ausfall- und Erstattungsquote verwechselt',
    erklaerung:
      'Lies genau, welche Quote genannt ist: Die Erstattungsquote ist der Teil, der gezahlt wird, die Ausfallquote der Teil, der verloren ist. Beide ergeben zusammen 100 %.',
  },
  'ust-lebt-nicht-wieder-auf': {
    titel: 'Umsatzsteuer beim Zahlungseingang vergessen',
    erklaerung:
      'Wurde eine Forderung mit Steuerkorrektur abgeschrieben und zahlt der Kunde doch noch, lebt die Umsatzsteuer wieder auf. Der Zahlungseingang wird in Nettoertrag und Umsatzsteuer zerlegt.',
  },
  // F7 – Rechnungsabgrenzung
  'arap-prap-vertauscht': {
    titel: 'Aktive und passive Rechnungsabgrenzung vertauscht',
    erklaerung:
      'Hat die MBG im Voraus bezahlt (Aufwand gehört ins neue Jahr), entsteht ein Anspruch auf eine Gegenleistung: aktive Rechnungsabgrenzung. Hat sie im Voraus Geld erhalten (Ertrag gehört ins neue Jahr), schuldet sie noch eine Leistung: passive Rechnungsabgrenzung.',
  },
  'rap-statt-sonstige': {
    titel: 'Rechnungsabgrenzung und sonstige Forderung/Verbindlichkeit verwechselt',
    erklaerung:
      'Rechnungsabgrenzungen gibt es nur, wenn das Geld schon im alten Jahr geflossen ist. Fließt das Geld erst im neuen Jahr für einen Erfolg des alten Jahres, entsteht eine sonstige Forderung (Ertrag) bzw. sonstige Verbindlichkeit (Aufwand).',
  },
  'zeitanteil-falsch': {
    titel: 'Falscher Zeitanteil',
    erklaerung:
      'Zähle die Monate genau: Abgegrenzt wird bei Vorauszahlungen der Teil, der ins neue Jahr gehört; bei nachträglicher Zahlung der Teil, der das alte Jahr betrifft. Betrag ÷ Monate des Zeitraums × betroffene Monate.',
  },
  // F8 – Rückstellungen
  'rueckstellung-mit-ust': {
    titel: 'Rückstellung mit Umsatzsteuer gebildet',
    erklaerung:
      'Eine Rückstellung wird ohne Umsatzsteuer gebildet: Es gibt noch keine Rechnung und damit keine abziehbare Vorsteuer. Die Vorsteuer wird erst gebucht, wenn die Rechnung im neuen Jahr eingeht.',
  },
  'differenz-falsch-gebucht': {
    titel: 'Differenz zur Rückstellung falsch gebucht',
    erklaerung:
      'Der Aufwand gehört zum alten Jahr und wurde dort schon erfasst. Zahlt die MBG mehr, ist der Mehrbetrag ein periodenfremder Aufwand; zahlt sie weniger oder gar nichts, entsteht ein Ertrag aus der Auflösung von Rückstellungen.',
  },
  'verbindlichkeit-statt-rueckstellung': {
    titel: 'Sonstige Verbindlichkeit statt Rückstellung',
    erklaerung:
      'Eine sonstige Verbindlichkeit setzt voraus, dass Höhe und Fälligkeit feststehen. Sind Höhe und/oder Fälligkeit noch ungewiss, wird eine Rückstellung gebildet.',
  },
  'rueckstellung-rest-nicht-aufgeloest': {
    titel: 'Rest der Rückstellung stehen gelassen',
    erklaerung:
      'Ist der Anlass erledigt, wird die Rückstellung vollständig ausgebucht. Ein nicht benötigter Rest wird als Ertrag aus der Auflösung von Rückstellungen erfasst.',
  },
  'vorsteuer-bei-inanspruchnahme-vergessen': {
    titel: 'Vorsteuer aus der Rechnung vergessen',
    erklaerung:
      'Die Rechnung im neuen Jahr enthält Umsatzsteuer, die die MBG als Vorsteuer abziehen darf. Die Rückstellung wird mit dem Nettobetrag verglichen; die Vorsteuer kommt zusätzlich ins Soll.',
  },
  'rueckstellungsart-falsch': {
    titel: 'Falscher Grund für die Rückstellung',
    erklaerung:
      'Prüfe den Anlass: Besteht eine rechtliche Pflicht mit ungewisser Höhe (ungewisse Verbindlichkeit), wurde eine Instandhaltung unterlassen, die in den ersten drei Monaten nachgeholt wird, oder leistet die MBG freiwillig aus Kulanz?',
  },
};
