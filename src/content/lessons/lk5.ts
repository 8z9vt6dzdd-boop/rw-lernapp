// Lektion K5 – Preisuntergrenze und Zusatzauftrag (eigene Formulierung; Inhalt nach den
// Lehrbuch-Übungen zur Deckungsbeitragsrechnung, Golden Case GC-22 aus 04-fachregeln.md).
// Alle Beträge werden von der Engine berechnet.
import { solvePug, type PugParams } from '../../engine/generators/k2/k5-preisuntergrenze';
import { formatEuro, formatPlain } from '../../engine/money';
import type { Lektion } from './types';

// GC-22: Eigenmarke für einen Discounter
const GC22: PugParams = {
  variante: 'zusatzauftrag',
  produkt: 'Paderquell Energy 0,33 l',
  kv: '0.5',
  kf: '240000',
  kapazitaet: 1_200_000,
  menge: 800_000,
  preis: '0.95',
  zusatzMenge: 200_000,
  zusatzPreis: '0.55',
};
const S = solvePug(GC22);
const VK = solvePug(GC22, { vollkosten: true });
// Sommer: Anlage fast voll, ein Teil der normalen Verkäufe würde verdrängt
const SOMMER: PugParams = {
  ...GC22,
  variante: 'verdraengung',
  kapazitaet: 1_000_000,
  menge: 880_000,
  zusatzPreis: '0.6',
};
const SO = solvePug(SOMMER);
const SO_IGN = solvePug(SOMMER, { verdraengungIgnoriert: true });

const e = formatEuro;
const n = formatPlain;

export const lektionK5: Lektion = {
  id: 'K5',
  skillId: 'K5-preisuntergrenze',
  abschnitt: 'K',
  titel: 'Zusatzauftrag: Die Eigenmarke für den Discounter',
  kernAha:
    'Kurzfristig liegt die Preisuntergrenze bei den variablen Stückkosten: Bei freier Kapazität verbessert jeder Preis darüber das Ergebnis, weil die Fixkosten ohnehin anfallen. Langfristig muss der Preis alle Kosten decken.',
  dauerMin: 8,
  figuren: ['tobias', 'leni', 'frank'],
  ort: 'besprechung',
  quelle:
    'Lehrbuch-Übungen Deckungsbeitragsrechnung (Preisuntergrenzen, Zusatzauftrag); 04-fachregeln.md GC-22',
  teaser: {
    figur: 'tobias',
    ausdruck: 'freut',
    text: `Ein Discounter will ${n(GC22.zusatzMenge)} Dosen als Eigenmarke. Der Preis ist niedrig, aber die Menge ist groß!`,
  },
  screens: [
    {
      typ: 'raetsel',
      ort: 'besprechung',
      sprecher: [
        {
          figur: 'tobias',
          ausdruck: 'freut',
          text: `Ein Discounter will ${n(GC22.zusatzMenge)} Dosen Paderquell Energy als Eigenmarke – für ${e(GC22.zusatzPreis)} je Dose.`,
        },
        {
          figur: 'frank',
          ausdruck: 'entsetzt',
          text: `Unsere Selbstkosten liegen bei ${e(S.langPug)}. Da verlieren wir doch an jeder Dose Geld!`,
        },
      ],
      frage: 'Verliert die MBG mit diesem Auftrag wirklich Geld?',
    },
    {
      typ: 'dialog',
      ort: 'besprechung',
      sprecher: [
        {
          figur: 'leni',
          ausdruck: 'erklaert',
          text: 'Stell dir eine WG mit einem leeren Zimmer vor: Die Miete zahlt ihr sowieso. Vermietet ihr es für ein Wochenende, zählt nur, ob der Gast mehr bringt als Strom und Bettwäsche kosten.',
        },
        {
          figur: 'leni',
          ausdruck: 'neutral',
          text: `Bei uns ist es genauso: Die Fixkosten von ${e(GC22.kf)} im Monat fallen mit und ohne Discounter an. Für den Zusatzauftrag zählen nur die variablen Kosten.`,
        },
      ],
    },
    {
      typ: 'vorhersage',
      frage: `Die Anlage hat ${n(S.freieKapazitaet)} Dosen im Monat frei. Wie verändert sich das Betriebsergebnis, wenn die MBG den Auftrag annimmt?`,
      optionen: [
        { text: `Es steigt um ${e(S.ergebnis)}.`, richtig: true },
        {
          text: `Es sinkt um ${e(VK.ergebnis.abs())}.`,
          erklaerung:
            'So rechnet, wer die Selbstkosten ansetzt. Die Fixkosten entstehen aber nicht durch den Auftrag.',
        },
        {
          text: 'Es bleibt gleich.',
          erklaerung: 'Jede zusätzliche Dose bringt einen Deckungsbeitrag.',
        },
      ],
      aufloesung: `Jede Dose bringt ${e(GC22.zusatzPreis)} und kostet zusätzlich nur ${e(GC22.kv)}. Das sind ${e(S.dbJeStueck)} Deckungsbeitrag je Dose, bei ${n(GC22.zusatzMenge)} Dosen also ${e(S.ergebnis)} mehr Ergebnis.`,
    },
    {
      typ: 'konzept',
      titel: 'Zwei Preisuntergrenzen',
      text: 'Kurzfristige Preisuntergrenze: die variablen Stückkosten. Darunter verliert jedes Stück Geld. Langfristige Preisuntergrenze: die Selbstkosten je Stück. Nur dann sind auf Dauer alle Kosten gedeckt.',
      visual: {
        typ: 'karten',
        karten: [
          {
            titel: 'kurzfristig',
            text: `variable Stückkosten = ${e(S.kurzPug)}`,
            farbe: '#8cbf3f',
          },
          {
            titel: 'langfristig',
            text: `${e(S.kurzPug)} + ${e(S.fixJeStueck)} Fixkosten je Dose = ${e(S.langPug)}`,
            farbe: '#e8792b',
          },
        ],
      },
    },
    {
      typ: 'erkunden',
      titel: 'Nur der Zusatzauftrag',
      text: 'Schiebe die Menge des Discounter-Auftrags. Erlöse und Kosten zeigen nur das, was durch den Auftrag dazukommt.',
      erkunden: {
        art: 'kostenfunktion',
        preis: GC22.zusatzPreis,
        kv: GC22.kv,
        kf: '0',
        xmax: GC22.zusatzMenge,
        einheit: 'Dosen',
      },
      fazit: `Zusätzliche Fixkosten gibt es nicht. Deshalb verbessert schon die erste Dose das Ergebnis, um ${e(S.dbJeStueck)} je Dose.`,
    },
    {
      typ: 'wer-hat-recht',
      frage: 'Soll die MBG den Auftrag annehmen?',
      a: {
        figur: 'frank',
        ausdruck: 'gruebelt',
        text: 'Unter den Selbstkosten verkaufen wir nicht. Das ist ein Verlustgeschäft.',
      },
      b: {
        figur: 'leni',
        ausdruck: 'erklaert',
        text: `Die Anlage hat Platz und der Preis liegt über ${e(GC22.kv)}. Jede Dose verbessert unser Ergebnis.`,
      },
      richtig: 'b',
      begruendungen: [
        {
          text: 'Die Fixkosten fallen ohnehin an. Der Auftrag muss nur die zusätzlichen, variablen Kosten decken.',
          richtig: true,
        },
        {
          text: 'Selbstkosten sind für Discounter-Aufträge nicht wichtig.',
          erklaerung:
            'Auf Dauer müssen alle Kosten gedeckt sein. Es geht um die kurzfristige Sicht bei freier Kapazität.',
        },
        {
          text: 'Große Mengen lohnen sich immer.',
          erklaerung:
            'Liegt der Preis unter den variablen Kosten, macht jede weitere Dose das Ergebnis schlechter.',
        },
      ],
      aufloesung: `Frank denkt in Vollkosten. Kurzfristig und bei freier Kapazität zählt aber der Deckungsbeitrag: ${e(S.dbJeStueck)} je Dose, zusammen ${e(S.ergebnis)}.`,
    },
    {
      typ: 'vorgerechnet',
      titel: 'Der Zusatzauftrag Schritt für Schritt',
      schritte: [
        {
          text: 'Kapazität prüfen',
          rechnung: `${n(GC22.kapazitaet)} − ${n(GC22.menge)} = ${n(S.freieKapazitaet)} Dosen frei`,
          warum: `Die ${n(GC22.zusatzMenge)} Dosen passen hinein, normale Verkäufe fallen nicht weg.`,
        },
        {
          text: 'Kurzfristige Preisuntergrenze',
          rechnung: `variable Stückkosten = ${e(S.kurzPug)}`,
          warum: 'Nur diese Kosten entstehen zusätzlich.',
        },
        {
          text: 'Deckungsbeitrag je Dose',
          rechnung: `${e(GC22.zusatzPreis)} − ${e(S.kurzPug)} = ${e(S.dbJeStueck)}`,
          warum: 'Das bleibt je Dose übrig, um Fixkosten zu decken.',
        },
        {
          text: 'Veränderung des Betriebsergebnisses',
          rechnung: `${e(S.dbJeStueck)} × ${n(GC22.zusatzMenge)} = ${e(S.ergebnis)}`,
          warum:
            'Die Fixkosten bleiben gleich, also steigt das Ergebnis um den gesamten Deckungsbeitrag.',
        },
      ],
    },
    {
      typ: 'entscheidung',
      frage: `Im Juli ist die Anlage fast voll: Nur ${n(SO.freieKapazitaet)} Dosen sind frei. Der Discounter will ${n(SOMMER.zusatzMenge)} Dosen für ${e(SOMMER.zusatzPreis)} je Dose. Normale Dosen verkaufen wir für ${e(SOMMER.preis)}. Was tust du?`,
      figur: {
        figur: 'tobias',
        ausdruck: 'gruebelt',
        text: 'Der Preis ist sogar höher als im Frühjahr. Da kann doch nichts schiefgehen?',
      },
      optionen: [
        {
          text: 'Annehmen, der Preis liegt über den variablen Kosten',
          folge: `${n(SO.verdraengt)} normale Dosen fallen weg. Zusätzlicher Deckungsbeitrag ${e(SO.dbZusatz)}, entgangener Deckungsbeitrag ${e(SO.entgangenerDb)}: Das Ergebnis sinkt um ${e(SO.ergebnis.abs())}. Ohne die Verdrängung hätte es nach ${e(SO_IGN.ergebnis)} Plus ausgesehen.`,
          ausdruck: 'entsetzt',
        },
        {
          text: 'Nur die freie Menge anbieten oder nachverhandeln',
          folge: `Damit bleibt das normale Geschäft unberührt. Für die volle Menge müsste der Discounter mindestens ${e(SO.pugAuftrag)} je Dose zahlen.`,
          ausdruck: 'freut',
          empfohlen: true,
        },
        {
          text: 'Ablehnen, weil der Preis unter den Selbstkosten liegt',
          folge:
            'Die Entscheidung stimmt, die Begründung nicht: Entscheidend ist der Deckungsbeitrag, der durch die Verdrängung verloren geht.',
          ausdruck: 'gruebelt',
        },
      ],
      fazit: `Ist die Kapazität knapp, kommt zu den variablen Kosten der entgangene Deckungsbeitrag hinzu. Die Preisuntergrenze steigt hier auf ${e(SO.pugAuftrag)} je Dose.`,
    },
    {
      typ: 'luecke',
      titel: 'Jetzt du',
      text: 'Ein neuer Zusatzauftrag. Die freie Kapazität steht schon da. Ergänze Preisuntergrenze, Deckungsbeitrag je Stück und die Veränderung des Betriebsergebnisses.',
      skillId: 'K5-preisuntergrenze',
      seed: 4,
      variant: 'zusatzauftrag',
      partId: 'rechnung',
      gefragt: ['pug', 'db', 'ergebnis'],
    },
    {
      typ: 'merksatz',
      id: 'K5-m1',
      frage: 'Wo liegen kurz- und langfristige Preisuntergrenze?',
      text: 'Kurzfristig: bei den variablen Stückkosten (bei freier Kapazität). Langfristig: bei den Selbstkosten je Stück. Fehlt Kapazität, kommt der entgangene Deckungsbeitrag der verdrängten Menge hinzu.',
    },
    {
      typ: 'klausur',
      punkte: 3,
      aufgabe: 'Ermitteln Sie die kurzfristige und die langfristige Preisuntergrenze je Stück.',
      part: { skillId: 'K5-preisuntergrenze', seed: 7, variant: 'kurz-lang', partId: 'rechnung' },
      cliffhanger: {
        figur: 'leni',
        ausdruck: 'gruebelt',
        text: 'Im Juli reicht die Abfüllanlage nicht für alle Sorten. Welche Sorte soll dann laufen und welche warten?',
      },
    },
  ],
  skipTest: [
    {
      frage: 'Wo liegt die kurzfristige Preisuntergrenze?',
      optionen: [
        { text: 'Bei den variablen Stückkosten', richtig: true },
        { text: 'Bei den Selbstkosten je Stück' },
        { text: 'Bei den fixen Stückkosten' },
      ],
    },
    {
      frage:
        'Freie Kapazität, variable Kosten 0,40 € je Stück, Selbstkosten 0,70 €. Ein Kunde bietet 0,50 € für 10.000 Stück. Wie ändert sich das Ergebnis?',
      optionen: [{ text: '+1.000 €', richtig: true }, { text: '−2.000 €' }, { text: '0 €' }],
    },
    {
      frage: 'Was muss der Preis langfristig decken?',
      optionen: [
        { text: 'Alle Kosten, also variable und fixe Kosten', richtig: true },
        { text: 'Nur die variablen Kosten' },
        { text: 'Nur die Fixkosten' },
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
      'Lehrbuch-Übungen Deckungsbeitragsrechnung (kurzfristige/absolute und langfristige Preisuntergrenze, Zusatzauftrag bei freier Kapazität) und GC-22 abgeglichen am 03.11.2026; Verdrängungsfall als [ANNAHME – bitte prüfen] in docs/m7/k2.md',
    verstaendlichOhneVorwissen: true,
    datum: '2026-11-03',
  },
};
