// F6 – Forderungsbewertung: zweifelhafte Forderungen, Einzel- und Pauschalwertberichtigung,
// endgültiger Ausfall mit Umsatzsteuerkorrektur, Insolvenzquote, Eingang abgeschriebener Forderungen.
// Fachliche Grundlage: BA 5.3.5.2; 04-fachregeln.md, Abschnitt 2 Nr. 8 und GC-12. Spezifikation: docs/m7/f2.md.
import { loesung, satz, zeile, type BuchungsLoesung, type ErwSatz } from '../../booking';
import { Val, dec } from '../../money';
import type { Rng } from '../../rng';
import type { ErrorVariant, Feld, GenOptions, SolutionStep, TaskPart, TaskText } from '../../task';
import { betrag as zufallsBetrag, defineGenerator, eur, feld, isKrumm, pct, retry } from '../base';
import { FIRMA } from '../../../config';

export type F6Fall = 'ewb' | 'ewb-anpassung' | 'pwb' | 'ausfall' | 'insolvenzquote' | 'eingang';

export const F6_FAELLE: readonly F6Fall[] = [
  'ewb',
  'ewb-anpassung',
  'pwb',
  'ausfall',
  'insolvenzquote',
  'eingang',
];

export interface F6Params {
  fall: F6Fall;
  kunde: string;
  ustSatz: string;
  /**
   * Forderung brutto (ewb, ewb-anpassung, ausfall, insolvenzquote), zweifelhafte Forderung brutto (pwb)
   * bzw. Zahlungseingang brutto (eingang). Dezimal-String in €.
   */
  brutto: string;
  /** ewb, ewb-anpassung: geschätzte Ausfallquote; insolvenzquote: genannte Quote (siehe quoteArt). */
  quote: string;
  /** insolvenzquote: Die genannte Quote ist die Ausfall- oder die Erstattungsquote. */
  quoteArt: 'ausfall' | 'erstattung';
  /** ausfall: Die Forderung war bereits auf „Zweifelhafte Forderungen“ umgebucht. */
  zweifelhaft: boolean;
  /** pwb: Saldo Forderungen a. LL vor der Umbuchung (enthält die zweifelhafte Forderung). */
  bestand: string;
  /** pwb: Pauschalsatz */
  pwbSatz: string;
  /** pwb: Bestand PWB aus dem Vorjahr; ewb-anpassung: Bestand EWB aus dem Vorjahr. */
  altBestand: string;
}

export type Anpassung = 'Erhöhung (Einstellung)' | 'Herabsetzung (Ertrag)';
export const ANPASSUNG: readonly Anpassung[] = ['Erhöhung (Einstellung)', 'Herabsetzung (Ertrag)'];

export interface F6Solution {
  /** ewb/ausfall: Nettoforderung; pwb: einwandfreie Forderungen netto; insolvenzquote: Ausfall netto; eingang: Ertrag netto */
  netto: Val;
  /** EWB-Betrag, Soll-Bestand EWB/PWB oder Abschreibung (netto) */
  wert: Val;
  /** Umsatzsteuerkorrektur (ausfall, insolvenzquote, eingang) */
  steuer: Val;
  /** insolvenzquote: Zahlung des Insolvenzverwalters; eingang: Zahlungseingang */
  bank: Val;
  /** insolvenzquote: Ausfall brutto; pwb: einwandfreie Forderungen brutto */
  brutto2: Val;
  /** ewb-anpassung, pwb: Betrag der Anpassung (immer positiv) */
  differenz: Val;
  anpassung: Anpassung;
  buchung: BuchungsLoesung;
}

const FLL = 'Forderungen aus Lieferungen und Leistungen';
const ZF = 'Zweifelhafte Forderungen';
const EWB = 'Einzelwertberichtigung zu Forderungen';
const PWB = 'Pauschalwertberichtigung zu Forderungen';
const EINST = 'Einstellung in Wertberichtigungen';
const HERAB = 'Erträge aus der Herabsetzung von Wertberichtigungen';
const AAF = 'Abschreibungen auf Forderungen';
const UST = 'Umsatzsteuer';
const BANK = 'Bank';
const EAF = 'Erträge aus abgeschriebenen Forderungen';

/** Fehlerhafte Rechenwege für die Fehlertyp-Erkennung. */
interface Rechenweg {
  vomBrutto?: boolean;
  gesamtbestand?: boolean;
  differenzIgnoriert?: boolean;
  quoteVerwechselt?: boolean;
  ustZuFrueh?: boolean;
  direkt?: boolean;
}

function anpassungsSatz(
  konto: string,
  soll: Val,
  alt: Val,
  ignoriert = false,
): {
  differenz: Val;
  anpassung: Anpassung;
  satz: ErwSatz;
} {
  if (ignoriert) {
    return {
      differenz: soll,
      anpassung: 'Erhöhung (Einstellung)',
      satz: satz([zeile(EINST, soll)], [zeile(konto, soll)], 'Einstellung'),
    };
  }
  const d = soll.minus(alt);
  if (d.isNegative()) {
    const b = d.abs();
    return {
      differenz: b,
      anpassung: 'Herabsetzung (Ertrag)',
      satz: satz([zeile(konto, b)], [zeile(HERAB, b)], 'Herabsetzung'),
    };
  }
  return {
    differenz: d,
    anpassung: 'Erhöhung (Einstellung)',
    satz: satz([zeile(EINST, d)], [zeile(konto, d)], 'Einstellung'),
  };
}

export function rechneF6(p: F6Params, w: Rechenweg = {}): F6Solution {
  const eins = dec(1).plus(p.ustSatz);
  const b = new Val(p.brutto);
  const q = dec(p.quote);
  const null0 = new Val(0);
  const basis = {
    steuer: null0,
    bank: null0,
    brutto2: null0,
    differenz: null0,
    anpassung: 'Erhöhung (Einstellung)' as Anpassung,
  };
  switch (p.fall) {
    case 'ewb': {
      const netto = b.div(eins).fix();
      const wert = (w.vomBrutto ? b : netto).times(q).fix();
      const umbuchung = satz([zeile(ZF, b)], [zeile(FLL, b)], 'Umbuchung');
      let ewbSatz: ErwSatz;
      if (w.ustZuFrueh) {
        const ust = b.minus(netto).times(q).fix();
        ewbSatz = satz([zeile(EINST, wert), zeile(UST, ust)], [zeile(EWB, wert.plus(ust))]);
      } else if (w.direkt) {
        ewbSatz = satz([zeile(AAF, wert)], [zeile(ZF, wert)]);
      } else {
        ewbSatz = satz([zeile(EINST, wert)], [zeile(EWB, wert)], 'Einzelwertberichtigung');
      }
      return { ...basis, netto, wert, buchung: loesung([umbuchung, ewbSatz]) };
    }
    case 'ewb-anpassung': {
      const netto = b.div(eins).fix();
      const wert = (w.vomBrutto ? b : netto).times(q).fix();
      const a = anpassungsSatz(EWB, wert, new Val(p.altBestand), w.differenzIgnoriert);
      return {
        ...basis,
        netto,
        wert,
        differenz: a.differenz,
        anpassung: a.anpassung,
        buchung: loesung([a.satz]),
      };
    }
    case 'pwb': {
      const einwandfrei = new Val(p.bestand).minus(w.gesamtbestand ? 0 : b);
      const netto = w.vomBrutto ? einwandfrei : einwandfrei.div(eins).fix();
      const wert = netto.times(dec(p.pwbSatz)).fix();
      const a = anpassungsSatz(PWB, wert, new Val(p.altBestand), w.differenzIgnoriert);
      return {
        ...basis,
        netto,
        wert,
        brutto2: einwandfrei,
        differenz: a.differenz,
        anpassung: a.anpassung,
        buchung: loesung([a.satz]),
      };
    }
    case 'ausfall': {
      const netto = b.div(eins).fix();
      const steuer = b.minus(netto);
      const haben = p.zweifelhaft ? ZF : FLL;
      const s = w.vomBrutto
        ? satz([zeile(AAF, b)], [zeile(haben, b)])
        : satz([zeile(AAF, netto), zeile(UST, steuer)], [zeile(haben, b)]);
      return { ...basis, netto, wert: netto, steuer, buchung: loesung([s]) };
    }
    case 'insolvenzquote': {
      const erstattet =
        (p.quoteArt === 'erstattung') !== Boolean(w.quoteVerwechselt) ? q : dec(1).minus(q);
      const bank = b.times(erstattet).fix();
      const ausfall = b.minus(bank);
      const netto = ausfall.div(eins).fix();
      const steuer = ausfall.minus(netto);
      const s = w.vomBrutto
        ? satz([zeile(BANK, bank), zeile(AAF, ausfall)], [zeile(ZF, b)])
        : satz([zeile(BANK, bank), zeile(AAF, netto), zeile(UST, steuer)], [zeile(ZF, b)]);
      return {
        ...basis,
        netto,
        wert: netto,
        steuer,
        bank,
        brutto2: ausfall,
        buchung: loesung([s]),
      };
    }
    case 'eingang': {
      const netto = w.vomBrutto ? b : b.div(eins).fix();
      const steuer = b.minus(netto);
      const s = w.vomBrutto
        ? satz([zeile(BANK, b)], [zeile(EAF, b)])
        : satz([zeile(BANK, b)], [zeile(EAF, netto), zeile(UST, steuer)]);
      return { ...basis, netto, wert: netto, steuer, bank: b, buchung: loesung([s]) };
    }
  }
}

export function solveF6(p: F6Params): F6Solution {
  return rechneF6(p);
}

// ---------- Aufgabenteile ----------

function anpassungFeld(s: F6Solution): Feld {
  return {
    typ: 'auswahl',
    id: 'anpassung',
    label: 'Art der Anpassung',
    optionen: [...ANPASSUNG],
    soll: s.anpassung,
  };
}

function rechenFelder(p: F6Params, s: F6Solution): Feld[] {
  switch (p.fall) {
    case 'ewb':
      return [
        feld('netto', 'Nettoforderung', s.netto),
        feld('wert', 'Einzelwertberichtigung', s.wert),
      ];
    case 'ewb-anpassung':
      return [
        feld('netto', 'Nettoforderung', s.netto),
        feld('wert', 'Erforderliche Einzelwertberichtigung', s.wert),
        anpassungFeld(s),
        feld('differenz', 'Anpassungsbetrag', s.differenz),
      ];
    case 'pwb':
      return [
        feld('einwandfrei', 'Einwandfreie Forderungen (brutto)', s.brutto2),
        feld('netto', 'Einwandfreie Forderungen (netto)', s.netto),
        feld('wert', 'Erforderliche Pauschalwertberichtigung', s.wert),
        anpassungFeld(s),
        feld('differenz', 'Anpassungsbetrag', s.differenz),
      ];
    case 'ausfall':
      return [
        feld('netto', 'Forderungsausfall netto', s.netto),
        feld('steuer', 'Umsatzsteuerkorrektur', s.steuer),
      ];
    case 'insolvenzquote':
      return [
        feld('bank', 'Zahlung des Insolvenzverwalters', s.bank),
        feld('ausfall', 'Ausfall brutto', s.brutto2),
        feld('netto', 'Ausfall netto', s.netto),
        feld('steuer', 'Umsatzsteuerkorrektur', s.steuer),
      ];
    case 'eingang':
      return [feld('netto', 'Ertrag netto', s.netto), feld('steuer', 'Umsatzsteuer', s.steuer)];
  }
}

const RECHEN_TITEL: Record<F6Fall, string> = {
  ewb: 'Einzelwertberichtigung berechnen',
  'ewb-anpassung': 'Einzelwertberichtigung anpassen',
  pwb: 'Pauschalwertberichtigung berechnen',
  ausfall: 'Ausfall zerlegen',
  insolvenzquote: 'Insolvenzquote auswerten',
  eingang: 'Zahlungseingang zerlegen',
};

const BUCHUNG_TITEL: Record<F6Fall, string> = {
  ewb: 'Buchungssätze (Umbuchung und Einzelwertberichtigung)',
  'ewb-anpassung': 'Buchungssatz für die Anpassung zum 31.12.',
  pwb: 'Buchungssatz für die Anpassung zum 31.12.',
  ausfall: 'Buchungssatz für den Forderungsausfall',
  insolvenzquote: 'Buchungssatz für den Abschluss des Insolvenzverfahrens',
  eingang: 'Buchungssatz für den Zahlungseingang',
};

export function partsF6(p: F6Params, s: F6Solution): TaskPart[] {
  return [
    { typ: 'rechenkette', id: 'rechnung', titel: RECHEN_TITEL[p.fall], felder: rechenFelder(p, s) },
    { typ: 'buchungssatz', id: 'buchung', titel: BUCHUNG_TITEL[p.fall], loesung: s.buchung },
  ];
}

// ---------- Erzeugen ----------

const QUOTEN_EWB = ['0.2', '0.25', '0.3', '0.4', '0.5', '0.6', '0.7', '0.75', '0.8'];
const QUOTEN_INSOLVENZ = [
  '0.1',
  '0.15',
  '0.2',
  '0.25',
  '0.3',
  '0.35',
  '0.4',
  '0.45',
  '0.6',
  '0.65',
];
const PWB_SAETZE = ['0.01', '0.01', '0.015', '0.02', '0.025', '0.03'];

/** Bruttobetrag aus einem glatten Nettobetrag (klausurfreundlich) oder krumm. */
function bruttoAus(r: Rng, min: number, max: number, step: number, krumm: boolean, ust: string) {
  if (krumm) return zufallsBetrag(r, min, max, 1, true);
  return dec(r.step(min, max, step))
    .times(dec(1).plus(ust))
    .toFixed(2);
}

export function generateF6(rng: Rng, opts: GenOptions = {}): F6Params {
  const variant = opts.variant;
  const fall: F6Fall = (F6_FAELLE as readonly string[]).includes(variant ?? '')
    ? (variant as F6Fall)
    : rng.pick(F6_FAELLE);
  const krumm = isKrumm(rng, opts.krummAnteil);
  const ustSatz = '0.19';
  const kunde = rng.pick(FIRMA.kunden);
  const base: F6Params = {
    fall,
    kunde,
    ustSatz,
    brutto: '0',
    quote: '0',
    quoteArt: 'ausfall',
    zweifelhaft: false,
    bestand: '0',
    pwbSatz: '0',
    altBestand: '0',
  };
  switch (fall) {
    case 'ewb':
      return {
        ...base,
        brutto: bruttoAus(rng, 2_000, 40_000, 100, krumm, ustSatz),
        quote: rng.pick(QUOTEN_EWB),
      };
    case 'ewb-anpassung':
      return retry(
        rng,
        (r) => {
          const brutto = bruttoAus(r, 4_000, 40_000, 100, krumm, ustSatz);
          const netto = dec(brutto).div(dec(1).plus(ustSatz));
          const alt = netto.times(r.pick(QUOTEN_EWB)).toDecimalPlaces(0).toFixed(2);
          return { ...base, brutto, quote: r.pick(QUOTEN_EWB), altBestand: alt };
        },
        (x) => !solveF6(x).differenz.value.isZero(),
      );
    case 'pwb':
      return retry(
        rng,
        (r) => {
          const einwandfrei = krumm
            ? zufallsBetrag(r, 60_000, 600_000, 1, true)
            : dec(r.step(50_000, 500_000, 1_000))
                .times(dec(1).plus(ustSatz))
                .toFixed(2);
          const zweifelhaft = bruttoAus(r, 2_000, 30_000, 100, krumm, ustSatz);
          const pwbSatz = r.pick(PWB_SAETZE);
          const sollNetto = dec(einwandfrei).div(dec(1).plus(ustSatz)).times(pwbSatz);
          const alt = r.chance(0.25)
            ? '0'
            : sollNetto
                .times(r.pick(['0.6', '0.7', '0.8', '1.2', '1.3', '1.5']))
                .div(50)
                .toDecimalPlaces(0)
                .times(50)
                .toFixed(2);
          return {
            ...base,
            brutto: zweifelhaft,
            bestand: dec(einwandfrei).plus(zweifelhaft).toFixed(2),
            pwbSatz,
            altBestand: alt,
          };
        },
        (x) => !solveF6(x).differenz.value.isZero(),
      );
    case 'ausfall':
      return {
        ...base,
        brutto: bruttoAus(rng, 500, 30_000, 100, krumm, ustSatz),
        zweifelhaft: rng.chance(0.5),
      };
    case 'insolvenzquote':
      return {
        ...base,
        brutto: bruttoAus(rng, 2_000, 40_000, 100, krumm, ustSatz),
        quote: rng.pick(QUOTEN_INSOLVENZ),
        quoteArt: rng.chance(0.5) ? 'ausfall' : 'erstattung',
        zweifelhaft: true,
      };
    case 'eingang':
      return { ...base, brutto: bruttoAus(rng, 200, 12_000, 10, krumm, ustSatz) };
  }
}

// ---------- Texte ----------

export function renderF6(p: F6Params): TaskText {
  const u = pct(p.ustSatz);
  const b = eur(p.brutto);
  const k = p.kunde;
  const sachverhalt: string[] = [];
  let aufgabe = '';
  let kontext = 'Dezember: Forderungen prüfen';
  switch (p.fall) {
    case 'ewb':
      sachverhalt.push(
        `Über das Vermögen von ${k} wurde im Dezember das Insolvenzverfahren eröffnet. Die MBG hat noch eine Forderung von ${b} (einschließlich ${u} Umsatzsteuer).`,
        `Zum Bilanzstichtag rechnet die MBG mit einem Ausfall von ${pct(p.quote)}.`,
      );
      aufgabe =
        'Bilde die Buchungen im alten Geschäftsjahr: Umbuchung der Forderung und Einzelwertberichtigung zum 31.12.';
      break;
    case 'ewb-anpassung':
      sachverhalt.push(
        `Die Forderung an ${k} über ${b} (einschließlich ${u} Umsatzsteuer) steht seit dem Vorjahr auf dem Konto Zweifelhafte Forderungen. Für sie besteht eine Einzelwertberichtigung von ${eur(p.altBestand)}.`,
        `Zum 31.12. schätzt die MBG den Ausfall neu auf ${pct(p.quote)}.`,
      );
      aufgabe = 'Passe die Einzelwertberichtigung zum 31.12. an und bilde den Buchungssatz.';
      break;
    case 'pwb':
      sachverhalt.push(
        `Das Konto Forderungen a. LL weist zum 31.12. vor den Abschlussbuchungen ${eur(p.bestand)} aus (einschließlich ${u} Umsatzsteuer).`,
        `Darin enthalten ist die Forderung an ${k} über ${b}. Sie ist zweifelhaft und wird gesondert einzelwertberichtigt.`,
        `Für das allgemeine Ausfallrisiko setzt die MBG ${pct(p.pwbSatz)} an. ${
          dec(p.altBestand).isZero()
            ? 'Eine Pauschalwertberichtigung besteht bisher nicht.'
            : `Aus dem Vorjahr besteht eine Pauschalwertberichtigung von ${eur(p.altBestand)}.`
        }`,
      );
      aufgabe = 'Ermittle die Pauschalwertberichtigung und bilde die Buchung zum 31.12.';
      break;
    case 'ausfall':
      sachverhalt.push(
        p.zweifelhaft
          ? `Die Forderung an ${k} über ${b} (einschließlich ${u} Umsatzsteuer) war bereits auf Zweifelhafte Forderungen umgebucht. Jetzt wird das Insolvenzverfahren mangels Masse eingestellt.`
          : `${k} ist nicht mehr auffindbar, Vollstreckungsversuche sind gescheitert. Die Forderung von ${b} (einschließlich ${u} Umsatzsteuer) steht noch auf dem Konto Forderungen a. LL.`,
        'Der Ausfall steht damit endgültig fest.',
      );
      aufgabe = 'Bilde den Buchungssatz für den endgültigen Forderungsausfall.';
      kontext = 'Laufendes Jahr: Forderungsausfall';
      break;
    case 'insolvenzquote':
      sachverhalt.push(
        `Die Forderung an ${k} über ${b} (einschließlich ${u} Umsatzsteuer) steht auf dem Konto Zweifelhafte Forderungen.`,
        p.quoteArt === 'ausfall'
          ? `Das Insolvenzverfahren ist abgeschlossen. Die Ausfallquote beträgt ${pct(p.quote)}; den Rest überweist der Insolvenzverwalter auf das Bankkonto der MBG.`
          : `Das Insolvenzverfahren ist abgeschlossen. Der Insolvenzverwalter überweist eine Quote von ${pct(p.quote)} auf das Bankkonto der MBG; der Rest ist verloren.`,
      );
      aufgabe = 'Werte die Quote aus und bilde den Buchungssatz.';
      kontext = 'Folgejahr: Insolvenzverfahren abgeschlossen';
      break;
    case 'eingang':
      sachverhalt.push(
        `Eine Forderung an ${k} wurde im Vorjahr als uneinbringlich abgeschrieben, die Umsatzsteuer wurde dabei korrigiert.`,
        `Überraschend gehen jetzt ${b} auf dem Bankkonto der MBG ein (Steuersatz ${u}).`,
      );
      aufgabe = 'Zerlege den Zahlungseingang und bilde den Buchungssatz.';
      kontext = 'Folgejahr: unerwarteter Zahlungseingang';
      break;
  }
  return { titel: 'Forderungsbewertung', kontext, sachverhalt, aufgabe };
}

// ---------- Rechenweg, Hilfen, Fehlervarianten ----------

export function stepsF6(p: F6Params, s: F6Solution): SolutionStep[] {
  const u = `(1 + ${pct(p.ustSatz)})`;
  const anpassungText = (konto: string) =>
    s.anpassung === 'Erhöhung (Einstellung)'
      ? `Einstellung in Wertberichtigungen an ${konto} ${eur(s.differenz)}`
      : `${konto} an Erträge aus der Herabsetzung von Wertberichtigungen ${eur(s.differenz)}`;
  switch (p.fall) {
    case 'ewb':
      return [
        {
          titel: 'Umbuchung',
          rechnung: `Zweifelhafte Forderungen an Forderungen a. LL ${eur(p.brutto)}`,
          erlaeuterung:
            'Die Forderung wird in voller Höhe (brutto) auf ein eigenes Konto umgebucht.',
        },
        { titel: 'Nettoforderung', rechnung: `${eur(p.brutto)} ÷ ${u} = ${eur(s.netto)}` },
        {
          titel: 'Einzelwertberichtigung',
          rechnung: `${eur(s.netto)} × ${pct(p.quote)} = ${eur(s.wert)}`,
          erlaeuterung:
            'Der Ausfall ist nur geschätzt: indirekt abschreiben, die Umsatzsteuer bleibt unverändert.',
        },
      ];
    case 'ewb-anpassung':
      return [
        { titel: 'Nettoforderung', rechnung: `${eur(p.brutto)} ÷ ${u} = ${eur(s.netto)}` },
        {
          titel: 'Erforderliche EWB',
          rechnung: `${eur(s.netto)} × ${pct(p.quote)} = ${eur(s.wert)}`,
        },
        {
          titel: 'Anpassung',
          rechnung: `${eur(s.wert)} − ${eur(p.altBestand)} → ${anpassungText('EWB')}`,
          erlaeuterung: 'Gebucht wird nur die Differenz zum vorhandenen Bestand.',
        },
      ];
    case 'pwb':
      return [
        {
          titel: 'Einwandfreie Forderungen',
          rechnung: `${eur(p.bestand)} − ${eur(p.brutto)} = ${eur(s.brutto2)}`,
          erlaeuterung: 'Die zweifelhafte Forderung hat eine eigene Einzelwertberichtigung.',
        },
        { titel: 'Netto', rechnung: `${eur(s.brutto2)} ÷ ${u} = ${eur(s.netto)}` },
        {
          titel: 'Erforderliche PWB',
          rechnung: `${eur(s.netto)} × ${pct(p.pwbSatz)} = ${eur(s.wert)}`,
        },
        {
          titel: 'Anpassung',
          rechnung: `${eur(s.wert)} − ${eur(p.altBestand)} → ${anpassungText('PWB')}`,
        },
      ];
    case 'ausfall':
      return [
        { titel: 'Ausfall netto', rechnung: `${eur(p.brutto)} ÷ ${u} = ${eur(s.netto)}` },
        {
          titel: 'Umsatzsteuerkorrektur',
          rechnung: `${eur(p.brutto)} − ${eur(s.netto)} = ${eur(s.steuer)}`,
          erlaeuterung:
            'Der Ausfall steht endgültig fest: Das Entgelt ist weggefallen, also wird die Umsatzsteuer korrigiert.',
        },
      ];
    case 'insolvenzquote':
      return [
        {
          titel: 'Zahlung des Insolvenzverwalters',
          rechnung: `${eur(p.brutto)} × ${
            p.quoteArt === 'erstattung' ? pct(p.quote) : `(100 % − ${pct(p.quote)})`
          } = ${eur(s.bank)}`,
        },
        {
          titel: 'Ausfall brutto',
          rechnung: `${eur(p.brutto)} − ${eur(s.bank)} = ${eur(s.brutto2)}`,
        },
        { titel: 'Ausfall netto', rechnung: `${eur(s.brutto2)} ÷ ${u} = ${eur(s.netto)}` },
        {
          titel: 'Umsatzsteuerkorrektur',
          rechnung: `${eur(s.brutto2)} − ${eur(s.netto)} = ${eur(s.steuer)}`,
          erlaeuterung: 'Korrigiert wird nur die Steuer auf den ausgefallenen Teil.',
        },
      ];
    case 'eingang':
      return [
        { titel: 'Ertrag netto', rechnung: `${eur(p.brutto)} ÷ ${u} = ${eur(s.netto)}` },
        {
          titel: 'Umsatzsteuer',
          rechnung: `${eur(p.brutto)} − ${eur(s.netto)} = ${eur(s.steuer)}`,
          erlaeuterung: 'Die beim Ausfall korrigierte Umsatzsteuer lebt wieder auf.',
        },
      ];
  }
}

export function hintsF6(p: F6Params, s: F6Solution): [string, string, string] {
  switch (p.fall) {
    case 'ewb':
      return [
        'Zuerst die zweifelhafte Forderung in voller Höhe (brutto) auf ein eigenes Konto umbuchen.',
        `Die Einzelwertberichtigung rechnet vom Nettobetrag: ${eur(p.brutto)} ÷ 1,19 × ${pct(p.quote)}.`,
        `Einstellung in Wertberichtigungen an EWB ${eur(s.wert)} – die Umsatzsteuer bleibt unverändert.`,
      ];
    case 'ewb-anpassung':
      return [
        'Berechne zuerst, wie hoch die Einzelwertberichtigung jetzt sein muss (vom Nettobetrag).',
        `Vergleiche mit dem vorhandenen Bestand von ${eur(p.altBestand)}: Gebucht wird nur die Differenz.`,
        s.anpassung === 'Erhöhung (Einstellung)'
          ? `Einstellung in Wertberichtigungen an EWB ${eur(s.differenz)}.`
          : `EWB an Erträge aus der Herabsetzung von Wertberichtigungen ${eur(s.differenz)}.`,
      ];
    case 'pwb':
      return [
        'Ziehe die zweifelhafte Forderung vom Forderungsbestand ab – sie hat eine eigene Einzelwertberichtigung.',
        `Rechne den Rest netto und wende ${pct(p.pwbSatz)} an. Vergleiche dann mit dem vorhandenen Bestand.`,
        s.anpassung === 'Erhöhung (Einstellung)'
          ? `Einstellung in Wertberichtigungen an PWB ${eur(s.differenz)}.`
          : `PWB an Erträge aus der Herabsetzung von Wertberichtigungen ${eur(s.differenz)}.`,
      ];
    case 'ausfall':
      return [
        'Der Ausfall steht endgültig fest: Jetzt wird direkt abgeschrieben und die Umsatzsteuer korrigiert.',
        `Abschreibung netto = ${eur(p.brutto)} ÷ 1,19; die Differenz korrigiert das Konto Umsatzsteuer im Soll.`,
        `Im Haben steht ${p.zweifelhaft ? 'Zweifelhafte Forderungen' : 'Forderungen a. LL'} mit dem vollen Bruttobetrag.`,
      ];
    case 'insolvenzquote':
      return [
        p.quoteArt === 'ausfall'
          ? 'Genannt ist die Ausfallquote. Gezahlt wird der Rest bis 100 %.'
          : 'Genannt ist die Erstattungsquote. Das ist der Teil, der gezahlt wird.',
        'Nur der ausgefallene Teil wird abgeschrieben (netto) und bei der Umsatzsteuer korrigiert.',
        `Bank, Abschreibungen auf Forderungen und Umsatzsteuer an Zweifelhafte Forderungen ${eur(p.brutto)}.`,
      ];
    case 'eingang':
      return [
        'Beim Ausfall wurde die Umsatzsteuer korrigiert. Zahlt der Kunde doch, lebt sie wieder auf.',
        `Zerlege ${eur(p.brutto)} in netto (÷ 1,19) und Umsatzsteuer.`,
        'Bank an Erträge aus abgeschriebenen Forderungen (netto) und an Umsatzsteuer.',
      ];
  }
}

export function variantsF6(p: F6Params): ErrorVariant[] {
  const out: ErrorVariant[] = [];
  const add = (fehlertyp: string, w: Rechenweg) =>
    out.push({ fehlertyp, parts: partsF6(p, rechneF6(p, w)) });
  switch (p.fall) {
    case 'ewb':
      add('abschreibung-vom-brutto', { vomBrutto: true });
      add('ust-korrektur-zu-frueh', { ustZuFrueh: true });
      add('ewb-direkt-abgeschrieben', { direkt: true });
      break;
    case 'ewb-anpassung':
      add('abschreibung-vom-brutto', { vomBrutto: true });
      add('wb-differenz-ignoriert', { differenzIgnoriert: true });
      break;
    case 'pwb':
      add('pwb-auf-gesamtbestand', { gesamtbestand: true });
      add('abschreibung-vom-brutto', { vomBrutto: true });
      if (!dec(p.altBestand).isZero()) add('wb-differenz-ignoriert', { differenzIgnoriert: true });
      break;
    case 'ausfall':
      add('abschreibung-vom-brutto', { vomBrutto: true });
      break;
    case 'insolvenzquote':
      add('abschreibung-vom-brutto', { vomBrutto: true });
      if (!dec(p.quote).equals('0.5'))
        add('insolvenzquote-verwechselt', { quoteVerwechselt: true });
      break;
    case 'eingang':
      add('ust-lebt-nicht-wieder-auf', { vomBrutto: true });
      break;
  }
  return out;
}

const VERFAHREN: Record<F6Fall, string> = {
  ewb: 'Zweifelhafte Forderung umbuchen und einzelwertberichtigen (vom Nettobetrag)',
  'ewb-anpassung': 'Einzelwertberichtigung an den neuen Schätzwert anpassen',
  pwb: 'Pauschalwertberichtigung auf die einwandfreien Forderungen (netto)',
  ausfall: 'Endgültiger Forderungsausfall mit Umsatzsteuerkorrektur',
  insolvenzquote: 'Insolvenzquote: Zahlung, Abschreibung und Umsatzsteuerkorrektur',
  eingang: 'Eingang einer abgeschriebenen Forderung: Umsatzsteuer lebt wieder auf',
};

export const forderungsbewertung = defineGenerator<F6Params, F6Solution>({
  skillId: 'F6-forderungsbewertung',
  titel: 'Forderungsbewertung',
  variants: [...F6_FAELLE],
  points: 4,
  generate: (rng, opts = {}) => generateF6(rng, opts),
  render: (p) => renderF6(p),
  solve: solveF6,
  parts: partsF6,
  steps: stepsF6,
  hints: hintsF6,
  errorVariants: variantsF6,
  verfahren: (p) => VERFAHREN[p.fall],
});
