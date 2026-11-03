// Lernpfad und Skills nach 02-curriculum.md. Klausurrelevanz ist eine Annahme und hier leicht änderbar.

export type Relevanz = 'hoch' | 'mittel' | 'niedrig' | 'voraussetzung';

export interface Skill {
  id: string;
  titel: string;
  relevanz: Relevanz;
  /** Theorie-Skills haben (noch) keine Rechenübung */
  art: 'lektion' | 'generator' | 'theorie' | 'fall';
}

export interface Abschnitt {
  id: string;
  titel: string;
  /** Kapitel im Geschäftsjahr der MBG (08-firma-mbg.md) */
  kapitel: string;
  skills: Skill[];
}

const s = (
  id: string,
  titel: string,
  relevanz: Relevanz,
  art: Skill['art'] = 'generator',
): Skill => ({ id, titel, relevanz, art });

export const ABSCHNITTE: readonly Abschnitt[] = [
  {
    id: '0',
    titel: 'Grundverständnis',
    kapitel: 'Erster Tag bei der MBG',
    skills: [
      s('0.1-wozu', 'Wozu das alles?', 'voraussetzung', 'lektion'),
      s('0.2-inventur', 'Inventur: Die MBG zählt alles', 'voraussetzung', 'lektion'),
      s('0.3-bilanz', 'Die Bilanz: das Foto am 31.12.', 'voraussetzung', 'lektion'),
      s('0.4-guv', 'Vom Foto zum Film: Gewinn und Verlust', 'voraussetzung', 'lektion'),
      s('0.5-doppik', 'Warum doppelt?', 'voraussetzung', 'lektion'),
      s('0.6-konto', 'Das Konto: zwei Spalten', 'voraussetzung', 'lektion'),
      s(
        '0.7-zwei-brillen',
        'Zwei Brillen: Buchhaltung und Kostenrechnung',
        'voraussetzung',
        'lektion',
      ),
    ],
  },
  {
    id: 'A',
    titel: 'Fundament',
    kapitel: '1. Januar: Eröffnungsbilanz',
    skills: [
      s('A1-rw-aufbau', 'Aufgaben und Teilbereiche', 'niedrig', 'theorie'),
      s('A2-gob', 'Grundsätze ordnungsmäßiger Buchführung', 'niedrig', 'theorie'),
      s('A3-kontenarten', 'Kontenarten zuordnen', 'hoch'),
      s('A4-bilanzveraenderung', 'Bilanzveränderungen', 'mittel'),
      s('A5-buchungssatz-basis', 'Einfache Buchungssätze', 'hoch'),
      s('A6-eroeffnung-abschluss', 'Eröffnung und Abschluss der Konten', 'hoch'),
      s('A7-ek-vergleich', 'Eigenkapitalvergleich', 'mittel'),
    ],
  },
  {
    id: 'B',
    titel: 'Umsatzsteuer',
    kapitel: 'Januar: erste Voranmeldung',
    skills: [
      s('B1-ust-rechnen', 'Brutto, Netto, Steuer', 'hoch'),
      s('B2-ust-buchen', 'Ein- und Verkauf mit Steuer buchen', 'hoch'),
      s('B3-ust-abschluss', 'Umsatzsteuer-Abschluss', 'hoch'),
    ],
  },
  {
    id: 'C',
    titel: 'Beschaffung',
    kapitel: 'Februar–März: Einkauf für die Sommersaison',
    skills: [
      s('C1-bestand-vs-aufwand', 'Bestands- und aufwandsorientierte Erfassung', 'hoch'),
      s('C2-bezugskosten', 'Bezugskosten', 'hoch'),
      s('C3-ruecksendung-einkauf', 'Rücksendungen an Lieferer', 'hoch'),
      s('C4-nachlaesse-einkauf', 'Nachlässe vom Lieferer', 'hoch'),
      s('C5-skonto-einkauf', 'Skonto beim Einkauf', 'hoch'),
      s('C6-leihverpackung', 'Leihverpackung', 'mittel'),
      s('C7-bezugskalkulation', 'Bezugskalkulation', 'mittel'),
      s('C8-handelswaren', 'Handelswaren', 'mittel'),
    ],
  },
  {
    id: 'D',
    titel: 'Absatz und Privat',
    kapitel: 'April–Juni: Saisonstart Gastronomie',
    skills: [
      s('D1-verkauf', 'Verkauf eigener Erzeugnisse', 'hoch'),
      s('D2-ruecksendung-verkauf', 'Rücksendungen von Kunden', 'hoch'),
      s('D3-erloesberichtigung', 'Erlösberichtigungen', 'hoch'),
      s('D4-skonto-verkauf', 'Skonto beim Verkauf', 'hoch'),
      s('D5-ausgangsfrachten', 'Ausgangsfrachten', 'mittel'),
      s('D6-privat', 'Privatentnahmen und -einlagen', 'hoch'),
    ],
  },
  {
    id: 'E',
    titel: 'Anlagen und Bestände',
    kapitel: 'Juli: neue Abfülllinie',
    skills: [
      s('E1-anlagenkauf', 'Kauf von Anlagegütern', 'hoch'),
      s('E2-eigenleistung-aib', 'Eigenleistungen, Anlagen im Bau', 'niedrig'),
      s('E3-bilanz-afa', 'Bilanzielle Abschreibung', 'hoch'),
      s('E4-bestandsveraenderung', 'Bestandsveränderungen', 'hoch'),
      s('E5-geschaeftsgang', 'Kompletter Geschäftsgang', 'hoch', 'fall'),
    ],
  },
  {
    id: 'F',
    titel: 'Jahresabschluss',
    kapitel: 'Dezember: Jahresabschluss',
    skills: [
      s('F1-bilanztheorien', 'Bilanztheorien', 'niedrig', 'theorie'),
      s('F2-hgb-grundlagen', 'Drittes Buch HGB', 'niedrig', 'theorie'),
      s('F3-wertmassstaebe', 'Wertmaßstäbe', 'mittel'),
      s('F4-ansatz', 'Bilanzansatz', 'niedrig', 'theorie'),
      s('F5-bewertung-uv', 'Bewertung des Umlaufvermögens', 'mittel'),
      s('F6-forderungsbewertung', 'Forderungsbewertung', 'hoch'),
      s('F7-rap', 'Rechnungsabgrenzung', 'hoch'),
      s('F8-rueckstellungen', 'Rückstellungen', 'hoch'),
      s('F9-guv-aufbau', 'Aufbau der GuV', 'niedrig', 'theorie'),
      s('F10-ifrs', 'IFRS-Grundzüge', 'niedrig', 'theorie'),
    ],
  },
  {
    id: 'G',
    titel: 'KLR-Grundlagen',
    kapitel: 'Januar Folgejahr: Controlling startet',
    skills: [
      s('G1-grundbegriffe', 'Auszahlung, Aufwand, Kosten', 'hoch'),
      s('G2-abgrenzung', 'Abgrenzung neutraler Aufwand', 'hoch'),
      s('G3-kostenbegriff', 'Kostenbegriffe', 'niedrig', 'theorie'),
      s('G4-fix-variabel', 'Fixe und variable Kosten', 'mittel'),
      s('G5-einzel-gemein', 'Einzel- und Gemeinkosten', 'hoch'),
      s('G6-prinzipien', 'Kostenrechnungsprinzipien', 'niedrig', 'theorie'),
    ],
  },
  {
    id: 'H',
    titel: 'Kostenartenrechnung',
    kapitel: 'Kalkulatorische Kosten der Abfüllanlage',
    skills: [
      s('H1-materialmengen', 'Verbrauchsmengen', 'mittel'),
      s('H2-materialbewertung', 'Materialbewertung', 'hoch'),
      s('H3-arbeitskosten', 'Arbeitskosten', 'niedrig', 'theorie'),
      s('H4-kalk-afa', 'Kalkulatorische Abschreibung', 'hoch'),
      s('H5-kalk-zinsen', 'Kalkulatorische Zinsen', 'mittel'),
      s('H6-wagnisse', 'Kalkulatorische Wagnisse', 'mittel'),
      s('H7-sonstige-kostenarten', 'Sonstige Kostenarten', 'niedrig', 'theorie'),
    ],
  },
  {
    id: 'I',
    titel: 'Kostenstellenrechnung',
    kapitel: 'BAB der MBG',
    skills: [
      s('I1-kostenstellenbildung', 'Kostenstellen bilden', 'niedrig', 'theorie'),
      s('I2-bab-verteilung', 'BAB: Gemeinkosten verteilen', 'hoch'),
      s('I3-anbau', 'Anbauverfahren', 'mittel'),
      s('I4-stufenleiter', 'Stufenleiterverfahren', 'hoch'),
      s('I5-simultan', 'Simultanverfahren', 'hoch'),
      s('I6-zuschlagssaetze', 'Zuschlagssätze, Über-/Unterdeckung', 'mittel'),
    ],
  },
  {
    id: 'J',
    titel: 'Kostenträgerrechnung',
    kapitel: 'Kalkulation der Dosengrößen',
    skills: [
      s('J1-ktr-grundlagen', 'Kalkulationsverfahren wählen', 'mittel', 'theorie'),
      s('J2-division', 'Divisionskalkulation', 'mittel'),
      s('J3-aequivalenz', 'Äquivalenzziffern', 'hoch'),
      s('J4-zuschlag', 'Zuschlagskalkulation', 'hoch'),
      s('J5-maschinensatz', 'Maschinenstundensatz', 'mittel'),
      s('J6-kuppel', 'Kuppelproduktkalkulation', 'niedrig'),
      s('J7-gkv-ukv', 'Gesamt- und Umsatzkostenverfahren', 'mittel'),
    ],
  },
  {
    id: 'K',
    titel: 'Teilkostenrechnung',
    kapitel: 'Sortimentsentscheidungen',
    skills: [
      s('K1-kostenverlauf', 'Kostenverlauf', 'mittel'),
      s('K2-db-einstufig', 'Deckungsbeitrag', 'mittel'),
      s('K3-break-even', 'Gewinnschwelle', 'mittel'),
      s('K4-db-mehrstufig', 'Mehrstufige Deckungsbeitragsrechnung', 'mittel'),
      s('K5-preisuntergrenze', 'Preisuntergrenze, Zusatzauftrag', 'mittel'),
      s('K6-engpass', 'Engpassplanung', 'mittel'),
      s('K7-make-or-buy', 'Eigenfertigung oder Fremdbezug', 'mittel'),
      s('K8-voll-vs-teil', 'Voll- vs. Teilkostenrechnung', 'mittel', 'theorie'),
      s('K9-plankosten', 'Plankostenrechnung', 'niedrig'),
    ],
  },
];

export const RELEVANZ_GEWICHT: Record<Relevanz, number> = {
  hoch: 3,
  mittel: 2,
  niedrig: 1,
  voraussetzung: 1,
};

export function abschnittVon(skillId: string): Abschnitt | undefined {
  return ABSCHNITTE.find((a) => a.skills.some((s) => s.id === skillId));
}

export function skillInfo(skillId: string): Skill | undefined {
  for (const a of ABSCHNITTE) {
    const s = a.skills.find((x) => x.id === skillId);
    if (s) return s;
  }
  return undefined;
}
