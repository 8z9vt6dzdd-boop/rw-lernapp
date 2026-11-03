// Katalog der erkannten Denkfehler mit gezielter Erklärung (01-didaktik.md, Prinzip 6).
import { FEHLERTYPEN_A } from './fehlertypen-batches/a';
import { FEHLERTYPEN_B } from './fehlertypen-batches/b';
import { FEHLERTYPEN_C1 } from './fehlertypen-batches/c1';
import { FEHLERTYPEN_C2 } from './fehlertypen-batches/c2';
import { FEHLERTYPEN_D } from './fehlertypen-batches/d';
import { FEHLERTYPEN_E } from './fehlertypen-batches/e';
import { FEHLERTYPEN_F1 } from './fehlertypen-batches/f1';
import { FEHLERTYPEN_F2 } from './fehlertypen-batches/f2';
import { FEHLERTYPEN_G } from './fehlertypen-batches/g';
import { FEHLERTYPEN_H } from './fehlertypen-batches/h';
import { FEHLERTYPEN_IJ } from './fehlertypen-batches/ij';
import { FEHLERTYPEN_J } from './fehlertypen-batches/j';
import { FEHLERTYPEN_K1 } from './fehlertypen-batches/k1';
import { FEHLERTYPEN_K2 } from './fehlertypen-batches/k2';

export interface Fehlertyp {
  titel: string;
  erklaerung: string;
}

export const FEHLERTYPEN_BASIS: Record<string, Fehlertyp> = {
  // Allgemein
  'summen-ungleich': {
    titel: 'Soll und Haben sind ungleich',
    erklaerung:
      'In jedem Buchungssatz muss die Summe der Soll-Beträge der Summe der Haben-Beträge entsprechen. Prüfe, ob ein Teilbetrag fehlt oder doppelt erfasst ist.',
  },
  'soll-haben-vertauscht': {
    titel: 'Soll und Haben vertauscht',
    erklaerung:
      'Die Konten sind richtig, stehen aber auf der jeweils anderen Seite. Frage dich je Konto: Nimmt der Bestand zu oder ab, entsteht Aufwand oder Ertrag?',
  },
  'konto-falsche-seite': {
    titel: 'Konto auf der falschen Seite',
    erklaerung:
      'Mindestens ein Konto steht auf der falschen Seite. Aktivkonten nehmen im Soll zu, Passivkonten im Haben; Aufwand steht im Soll, Ertrag im Haben.',
  },
  'steuer-falsches-konto': {
    titel: 'Vorsteuer und Umsatzsteuer verwechselt',
    erklaerung:
      'Beim Einkauf betrifft die Steuer immer das Konto Vorsteuer, beim Verkauf immer das Konto Umsatzsteuer – auch bei späteren Korrekturen durch Skonto oder Nachlässe.',
  },
  'verfahren-verwechselt': {
    titel: 'Verfahren verwechselt',
    erklaerung:
      'Lies den Sachverhalt noch einmal auf Signalwörter: Sie verraten, welcher Aufgabentyp vorliegt und welches Schema du brauchst.',
  },

  // Skonto (C5, D4)
  'skonto-vom-netto': {
    titel: 'Skonto vom Nettobetrag berechnet',
    erklaerung:
      'Skonto wird vom Rechnungsbetrag (brutto) abgezogen. Erst danach wird der Bruttoskonto in Nettoskonto und Steueranteil zerlegt.',
  },
  'keine-steuerkorrektur': {
    titel: 'Steuerkorrektur vergessen',
    erklaerung:
      'Skonto mindert nachträglich das Entgelt. Deshalb muss die enthaltene Steuer korrigiert werden: Bruttoskonto ÷ (1 + Steuersatz) = Nettoskonto, die Differenz ist die Steuerkorrektur.',
  },
  'skonto-auf-zahlbetrag': {
    titel: 'Rechnungsbetrag falsch zurückgerechnet',
    erklaerung:
      'Ist der Zahlbetrag nach Skontoabzug gegeben, entspricht er (100 % − Skontosatz) der Rechnung. Also: Rechnung = Zahlbetrag ÷ (1 − Skontosatz), nicht Zahlbetrag × (1 + Skontosatz).',
  },
  'nachlass-statt-anlagekonto': {
    titel: 'Skonto bei Anlagegut über Nachlasskonto',
    erklaerung:
      'Skonto auf ein Anlagegut mindert die Anschaffungskosten. Der Nettoskonto wird deshalb direkt auf dem Anlagekonto im Haben gebucht.',
  },
  'falscher-steuersatz': {
    titel: 'Falscher Steuersatz',
    erklaerung:
      'Für die Skontokorrektur gilt derselbe Steuersatz wie in der ursprünglichen Rechnung.',
  },

  // USt-Abschluss (B3)
  'richtung-vertauscht': {
    titel: 'Verrechnung in falscher Richtung',
    erklaerung:
      'Die Verrechnung lautet in beiden Fällen Umsatzsteuer an Vorsteuer, und zwar mit dem kleineren der beiden Beträge. Bei einer Zahllast ist das die Vorsteuer, bei einem Vorsteuerüberhang die Umsatzsteuer.',
  },
  'zahllast-aktiviert': {
    titel: 'Zahllast auf der Aktivseite',
    erklaerung:
      'Eine Zahllast ist eine Schuld gegenüber dem Finanzamt. Sie steht im SBK auf der Passivseite: Umsatzsteuer an SBK.',
  },
  'ueberhang-passiviert': {
    titel: 'Vorsteuerüberhang auf der Passivseite',
    erklaerung:
      'Ein Vorsteuerüberhang ist ein Erstattungsanspruch gegenüber dem Finanzamt, also eine Forderung. Sie steht im SBK auf der Aktivseite: SBK an Vorsteuer.',
  },

  // Bestandsveränderungen (E4)
  'mehrung-als-aufwand': {
    titel: 'Mehr- und Minderbestand verwechselt',
    erklaerung:
      'Endbestand größer als Anfangsbestand = Mehrbestand: Das Erzeugniskonto nimmt zu (Soll), Bestandsveränderungen im Haben (erhöht den Erfolg). Bei einem Minderbestand ist es umgekehrt.',
  },
  'minderbestand-als-ertragsminderung': {
    titel: 'Minderbestand von den Erträgen abgezogen',
    erklaerung:
      'Im GuV-Konto steht ein Minderbestand im Soll, also auf der Aufwandsseite, und ein Mehrbestand im Haben. Der Gewinn bleibt gleich, aber die Summen der Erträge und Aufwendungen ändern sich. Nur in der Staffelform nach HGB erscheint die Bestandsveränderung als eigene Ertragsposition.',
  },
  'privat-als-aufwand': {
    titel: 'Privatentnahme vergessen oder als Aufwand behandelt',
    erklaerung:
      'Privatentnahmen sind kein Aufwand und stehen nicht in der GuV. Sie mindern das Eigenkapital direkt: Eigenkapital am Ende = Anfangsbestand − Entnahmen + Einlagen + Gewinn.',
  },
  'saldo-falsche-seite': {
    titel: 'Saldo der Bestandsveränderungen falsch abgeschlossen',
    erklaerung:
      'Überwiegen die Mehrbestände, hat das Konto Bestandsveränderungen einen Habensaldo: Bestandsveränderungen an GuV. Überwiegen die Minderbestände: GuV an Bestandsveränderungen.',
  },
  'ue-fe-verrechnet': {
    titel: 'Unfertige und fertige Erzeugnisse nicht getrennt',
    erklaerung:
      'Die Bestandsveränderung wird für jedes Erzeugniskonto einzeln gebucht. Erst der Saldo des Kontos Bestandsveränderungen fasst beide zusammen.',
  },

  // Kalkulatorische Abschreibung (H4)
  'nebenkosten-vergessen': {
    titel: 'Nebenkosten vergessen',
    erklaerung:
      'Zur Abschreibungsbasis gehören auch Anschaffungsnebenkosten wie Montage oder Transport.',
  },
  'restwert-vergessen': {
    titel: 'Restwert nicht abgezogen',
    erklaerung:
      'Abgeschrieben wird nur der Betrag, der tatsächlich verbraucht wird: Anschaffungskosten einschließlich Nebenkosten abzüglich Restwert.',
  },
  'jahresziffern-falsch': {
    titel: 'Jahresziffern falsch angewendet',
    erklaerung:
      'Arithmetisch-degressiv: Degressionsbetrag = Abschreibungsbasis ÷ Summe der Jahresziffern (1 + 2 + … + n). Im ersten Jahr wird mit der höchsten Ziffer n multipliziert, dann mit n − 1 usw.',
  },
  'wurzel-vergessen': {
    titel: 'Satz ohne n-te Wurzel ermittelt',
    erklaerung:
      'Geometrisch-degressiv schrumpft der Buchwert jedes Jahr um denselben Prozentsatz. Deshalb: p = 100 · (1 − n-te Wurzel aus Restwert ÷ Anschaffungswert), nicht (1 − Restwert ÷ Anschaffungswert) ÷ n.',
  },
  'satz-vorab-gerundet': {
    titel: 'Satz je Einheit vorab gerundet',
    erklaerung:
      'Den Abschreibungssatz je Leistungseinheit möglichst nicht vor dem Multiplizieren runden. Das Ergebnis gilt trotzdem als richtig, ist aber ungenauer.',
  },

  // Stufenleiter (I4)
  'reihenfolge-falsch': {
    titel: 'Falsche Reihenfolge der Vorkostenstellen',
    erklaerung:
      'Zuerst wird die Vorkostenstelle abgerechnet, die wertmäßig mehr an die andere liefert: primäre Kosten ÷ Gesamtleistung × an die andere Stelle abgegebene Menge. Vergleiche beide Werte.',
  },
  'rueckfluss-nicht-abgezogen': {
    titel: 'Leistung an bereits abgerechnete Stelle nicht abgezogen',
    erklaerung:
      'Beim Stufenleiterverfahren wird nicht zurückverrechnet. Die Leistung der zweiten Stelle an die erste wird deshalb von deren Gesamtleistung abgezogen, bevor der Verrechnungssatz gebildet wird.',
  },
  'primaerkosten-statt-gesamt': {
    titel: 'Empfangene Kosten nicht berücksichtigt',
    erklaerung:
      'Der Verrechnungssatz der zweiten Stelle enthält ihre primären Kosten plus die Kosten, die sie von der ersten Stelle empfangen hat.',
  },

  // Simultan (I5)
  'eigenverbrauch-falsch': {
    titel: 'Eigenverbrauch nicht in der Gleichung',
    erklaerung:
      'Wird die Gesamtleistung einschließlich Eigenverbrauch rechts angesetzt, muss der Eigenverbrauch links auch als empfangene Leistung stehen. Alternativ: links ohne Eigenverbrauch, rechts Gesamtleistung minus Eigenverbrauch.',
  },
  'zeile-spalte-vertauscht': {
    titel: 'Liefer- und Empfangsrichtung verwechselt',
    erklaerung:
      'In die Gleichung einer Stelle gehören die Mengen, die sie von anderen Stellen empfängt, nicht die Mengen, die sie selbst abgibt.',
  },
  'gesamtleistung-ohne-eigenverbrauch': {
    titel: 'Eigenverbrauch doppelt berücksichtigt',
    erklaerung:
      'Der Eigenverbrauch darf nur einmal berücksichtigt werden: entweder links als empfangene Leistung (rechts dann Gesamtleistung) oder rechts als Abzug von der Gesamtleistung.',
  },

  // Äquivalenzziffern (J3)
  'menge-statt-re': {
    titel: 'Mit Mengen statt Rechnungseinheiten gerechnet',
    erklaerung:
      'Die Kosten werden durch die Summe der Rechnungseinheiten (Menge × Äquivalenzziffer) geteilt, nicht durch die Summe der Stückzahlen.',
  },
  'aez-relativ-falsch': {
    titel: 'Äquivalenzziffer falsch abgeleitet',
    erklaerung:
      '„Um 30 % höher als die Einheitssorte“ bedeutet Äquivalenzziffer 1,3; „um 20 % niedriger“ bedeutet 0,8. Bezugsgröße ist immer die Einheitssorte mit Ziffer 1.',
  },

  // Zuschlagskalkulation (J4)
  'im-hundert-statt-vom-hundert': {
    titel: 'Im Hundert und vom Hundert verwechselt',
    erklaerung:
      'Skonto und Provision werden vom Zielverkaufspreis berechnet, Rabatt vom Listenverkaufspreis. Beim Hochrechnen deshalb teilen: Barverkaufspreis ÷ (1 − Skonto − Provision), Zielverkaufspreis ÷ (1 − Rabatt).',
  },
  'zuschlagsbasis-falsch': {
    titel: 'Falsche Zuschlagsbasis',
    erklaerung:
      'Materialgemeinkosten auf das Fertigungsmaterial, Fertigungsgemeinkosten auf die Fertigungslöhne, Verwaltungs- und Vertriebsgemeinkosten auf die Herstellkosten.',
  },
  'sek-vergessen': {
    titel: 'Sondereinzelkosten vergessen',
    erklaerung:
      'Sondereinzelkosten der Fertigung gehören in die Herstellkosten, Sondereinzelkosten des Vertriebs in die Selbstkosten. Sie erhalten keinen Zuschlag.',
  },
};

export const FEHLERTYPEN: Record<string, Fehlertyp> = {
  ...FEHLERTYPEN_BASIS,
  ...FEHLERTYPEN_A,
  ...FEHLERTYPEN_B,
  ...FEHLERTYPEN_C1,
  ...FEHLERTYPEN_C2,
  ...FEHLERTYPEN_D,
  ...FEHLERTYPEN_E,
  ...FEHLERTYPEN_F1,
  ...FEHLERTYPEN_F2,
  ...FEHLERTYPEN_G,
  ...FEHLERTYPEN_H,
  ...FEHLERTYPEN_IJ,
  ...FEHLERTYPEN_J,
  ...FEHLERTYPEN_K1,
  ...FEHLERTYPEN_K2,
};

export function fehlertyp(id: string): Fehlertyp {
  return (
    FEHLERTYPEN[id] ?? {
      titel: 'Abweichung von der Lösung',
      erklaerung: 'Vergleiche deinen Weg Schritt für Schritt mit dem Rechenweg.',
    }
  );
}
