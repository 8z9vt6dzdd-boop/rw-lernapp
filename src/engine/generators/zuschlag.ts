// J4 – Zuschlagskalkulation (summarisch, differenzierend, Angebotskalkulation).
import { FIRMA } from '../../config';
import { Val, dec } from '../money';
import type { ErrorVariant, TaskPart, ZahlFeld } from '../task';
import { betrag, defineGenerator, eur, feld, isExact, isKrumm, pct, retry } from './base';

export type ZuschlagVariante = 'summarisch' | 'differenzierend' | 'differenzierend-sek' | 'angebot';

export interface Fertigungsstelle {
  name: string;
  fl: string;
  fgk: string;
}

export interface ZuschlagParams {
  variante: ZuschlagVariante;
  auftrag: string;
  kunde: string;
  fm?: string;
  mgk?: string;
  fertigung?: Fertigungsstelle[];
  sekF?: string;
  vwgk?: string;
  vtgk?: string;
  sekV?: string;
  /** summarisch: ein Zuschlag auf die gesamten Einzelkosten */
  gkSatz?: string;
  /** Angebot: Selbstkosten gegeben */
  sk?: string;
  gewinn?: string;
  skonto?: string;
  provision?: string;
  rabatt?: string;
}

export interface ZuschlagSolution {
  werte: { id: string; label: string; wert: Val }[];
}

interface Weg {
  imHundertFalsch?: boolean;
  vtAufHkPlusVw?: boolean;
  fgkAufFm?: boolean;
  ohneSek?: boolean;
}

export function solveZuschlag(p: ZuschlagParams, w: Weg = {}): ZuschlagSolution {
  const werte: ZuschlagSolution['werte'] = [];
  const put = (id: string, label: string, v: Val) => {
    werte.push({ id, label, wert: v });
    return v;
  };
  if (p.variante === 'angebot') {
    const sk = new Val(p.sk!);
    const gewinn = put('gewinn', `Gewinn (${pct(p.gewinn!)})`, sk.times(dec(p.gewinn!)).round());
    const bvp = put('bvp', 'Barverkaufspreis', sk.plus(gewinn));
    const sp = dec(p.skonto!).plus(p.provision ?? '0');
    const zvp = w.imHundertFalsch
      ? bvp.times(dec(1).plus(sp)).round()
      : bvp.div(dec(1).minus(sp)).round();
    put('skonto', `Kundenskonto (${pct(p.skonto!)})`, zvp.times(dec(p.skonto!)).round());
    if (p.provision && !dec(p.provision).isZero()) {
      put(
        'provision',
        `Vertreterprovision (${pct(p.provision)})`,
        zvp.times(dec(p.provision)).round(),
      );
    }
    put('zvp', 'Zielverkaufspreis', zvp);
    const r = dec(p.rabatt!);
    const lvp = w.imHundertFalsch
      ? zvp.times(dec(1).plus(r)).round()
      : zvp.div(dec(1).minus(r)).round();
    put('rabatt', `Kundenrabatt (${pct(p.rabatt!)})`, lvp.minus(zvp));
    put('lvp', 'Listenverkaufspreis', lvp);
    return { werte };
  }
  if (p.variante === 'summarisch') {
    const ek = put(
      'ek',
      'Einzelkosten (Material und Löhne)',
      new Val(p.fm!).plus(p.fertigung![0]!.fl),
    );
    const gk = put('gk', `Gemeinkosten (${pct(p.gkSatz!)})`, ek.times(dec(p.gkSatz!)).round());
    put('sk', 'Selbstkosten', ek.plus(gk));
    return { werte };
  }
  const fm = new Val(p.fm!);
  const mgk = put('mgk', `Materialgemeinkosten (${pct(p.mgk!)})`, fm.times(dec(p.mgk!)).round());
  const mk = put('mk', 'Materialkosten', fm.plus(mgk));
  let fk = new Val(0);
  p.fertigung!.forEach((f, i) => {
    const basis = w.fgkAufFm ? fm : new Val(f.fl);
    const fgk = put(
      `fgk-${i}`,
      `Fertigungsgemeinkosten ${f.name} (${pct(f.fgk)})`,
      basis.times(dec(f.fgk)).round(),
    );
    fk = fk.plus(f.fl).plus(fgk);
  });
  if (p.sekF && !w.ohneSek) fk = fk.plus(p.sekF);
  put('fk', 'Fertigungskosten', fk);
  const hk = put('hk', 'Herstellkosten', mk.plus(fk));
  const vw = put(
    'vwgk',
    `Verwaltungsgemeinkosten (${pct(p.vwgk!)})`,
    hk.times(dec(p.vwgk!)).round(),
  );
  const vtBasis = w.vtAufHkPlusVw ? hk.plus(vw) : hk;
  const vt = put(
    'vtgk',
    `Vertriebsgemeinkosten (${pct(p.vtgk!)})`,
    vtBasis.times(dec(p.vtgk!)).round(),
  );
  let sk = hk.plus(vw).plus(vt);
  if (p.sekV && !w.ohneSek) sk = sk.plus(p.sekV);
  put('sk', 'Selbstkosten', sk);
  return { werte };
}

export function zuschlagParts(_p: ZuschlagParams, s: ZuschlagSolution): TaskPart[] {
  const felder: ZahlFeld[] = s.werte.map((w) => feld(w.id, w.label, w.wert));
  return [{ typ: 'rechenkette', id: 'schema', titel: 'Kalkulationsschema', felder }];
}

const AUFTRAEGE = [
  { auftrag: '2.000 Kartons Senne Lemon 0,33 l', kunde: 'eine Hotelkette' },
  { auftrag: '1.500 Kartons Paderquell Energy 0,25 l', kunde: 'eine Tankstellenkette' },
  { auftrag: '800 Fässer Almeblick Tequila-Bier', kunde: 'einen Festivalveranstalter' },
  { auftrag: '3.000 Kartons Senne Lemon 0,33 l', kunde: 'einen Getränkefachgroßhandel' },
];

function generate(
  rng: import('../rng').Rng,
  variante: ZuschlagVariante,
  krumm: boolean,
): ZuschlagParams {
  const a = rng.pick(AUFTRAEGE);
  const base: ZuschlagParams = { variante, auftrag: a.auftrag, kunde: a.kunde };
  const satz = (list: string[]) => rng.pick(list);
  if (variante === 'angebot') {
    return retry(
      rng,
      (r) => {
        const p: ZuschlagParams = {
          ...base,
          gewinn: r.pick(['0.1', '0.12', '0.15', '0.2', '0.25']),
          skonto: r.pick(['0.02', '0.03']),
          provision: r.pick(['0', '0.03', '0.05', '0.06']),
          rabatt: r.pick(['0.05', '0.1', '0.15', '0.2', '0.07']),
        };
        if (krumm) {
          p.sk = betrag(r, 10_000, 90_000, 1, true);
          return p;
        }
        // Rückwärts konstruieren, damit alle Stufen glatt sind.
        const lvp = dec(r.step(20_000, 150_000, 1_000));
        const zvp = lvp.times(dec(1).minus(p.rabatt!));
        const bvp = zvp.times(dec(1).minus(p.skonto!).minus(p.provision!));
        const sk = bvp.div(dec(1).plus(p.gewinn!));
        p.sk = sk.mod(1).isZero() ? sk.toFixed(2) : sk.toFixed(10);
        return p;
      },
      (p) => krumm || (isExact(p.sk!) && dec(p.sk!).mod(1).isZero()),
    );
  }
  const fm = String(rng.step(5_000, 60_000, 500));
  const fl = String(rng.step(2_000, 30_000, 500));
  if (variante === 'summarisch') {
    return {
      ...base,
      fm,
      fertigung: [{ name: 'Fertigung', fl, fgk: '0' }],
      gkSatz: satz(['0.8', '1', '1.2', '1.5', '1.75', '2']),
    };
  }
  const k = FIRMA.kostenstellen;
  const p: ZuschlagParams = {
    ...base,
    fm: krumm ? betrag(rng, 5_000, 60_000, 1, true) : fm,
    mgk: satz(['0.05', '0.08', '0.1', '0.12', '0.15', '0.2']),
    fertigung: [{ name: k.fertigung1, fl, fgk: satz(['0.8', '1', '1.2', '1.5', '1.8', '2']) }],
    vwgk: satz(['0.08', '0.1', '0.12', '0.15']),
    vtgk: satz(['0.04', '0.05', '0.06', '0.08', '0.1']),
  };
  if (variante === 'differenzierend-sek') {
    p.fertigung!.push({
      name: k.fertigung2,
      fl: String(rng.step(1_000, 20_000, 500)),
      fgk: satz(['1.2', '1.5', '2', '2.5', '3']),
    });
    p.sekF = String(rng.step(200, 3_000, 100));
    p.sekV = String(rng.step(100, 2_000, 50));
  }
  return p;
}

export const zuschlag = defineGenerator<ZuschlagParams, ZuschlagSolution>({
  skillId: 'J4-zuschlag',
  titel: 'Zuschlagskalkulation',
  variants: ['summarisch', 'differenzierend', 'differenzierend-sek', 'angebot'],
  points: 8,
  generate: (rng, opts = {}) => {
    const krumm = isKrumm(rng, opts.krummAnteil);
    const variante =
      (opts.variant as ZuschlagVariante | undefined) ??
      rng.pick<ZuschlagVariante>([
        'summarisch',
        'differenzierend',
        'differenzierend',
        'differenzierend-sek',
        'angebot',
        'angebot',
      ]);
    return generate(rng, variante, krumm);
  },
  render: (p) => {
    const sachverhalt: string[] = [];
    let daten: { spalten: string[]; zeilen: string[][] } | undefined;
    if (p.variante === 'angebot') {
      sachverhalt.push(
        `Die MBG kalkuliert ein Angebot über ${p.auftrag} für ${p.kunde}. Die Selbstkosten betragen ${eur(p.sk!)}.`,
        `Geplant sind ${pct(p.gewinn!)} Gewinn. Der Kunde erhält ${pct(p.skonto!)} Skonto und ${pct(p.rabatt!)} Rabatt${
          p.provision && !dec(p.provision).isZero()
            ? `; der Außendienst bekommt ${pct(p.provision)} Provision vom Zielverkaufspreis`
            : ''
        }.`,
      );
    } else {
      sachverhalt.push(
        `Für einen Auftrag über ${p.auftrag} für ${p.kunde} liegen folgende Werte vor:`,
      );
      const zeilen: string[][] = [['Fertigungsmaterial', eur(p.fm!)]];
      if (p.variante === 'summarisch') {
        zeilen.push(
          ['Fertigungslöhne', eur(p.fertigung![0]!.fl)],
          ['Gemeinkostenzuschlag auf die Einzelkosten', pct(p.gkSatz!)],
        );
      } else {
        zeilen.push(['Materialgemeinkosten', pct(p.mgk!)]);
        for (const f of p.fertigung!)
          zeilen.push(
            [`Fertigungslöhne ${f.name}`, eur(f.fl)],
            [`Fertigungsgemeinkosten ${f.name}`, pct(f.fgk)],
          );
        if (p.sekF)
          zeilen.push(['Sondereinzelkosten der Fertigung (Spezialetiketten)', eur(p.sekF)]);
        zeilen.push(
          ['Verwaltungsgemeinkosten', pct(p.vwgk!)],
          ['Vertriebsgemeinkosten', pct(p.vtgk!)],
        );
        if (p.sekV)
          zeilen.push(['Sondereinzelkosten des Vertriebs (Spezialtransport)', eur(p.sekV)]);
      }
      daten = { spalten: ['Position', 'Wert'], zeilen };
    }
    const text = {
      titel: p.variante === 'angebot' ? 'Angebotskalkulation' : 'Zuschlagskalkulation',
      kontext: 'Angebot der MBG',
      sachverhalt,
      aufgabe:
        p.variante === 'angebot'
          ? 'Ermittle den Listenverkaufspreis. Runde jeden Zwischenwert auf Cent.'
          : 'Ermittle die Selbstkosten des Auftrags nach dem Kalkulationsschema.',
    };
    return daten ? { ...text, daten } : text;
  },
  solve: (p) => solveZuschlag(p),
  parts: zuschlagParts,
  steps: (p, s) => {
    const get = (id: string) => s.werte.find((w) => w.id === id)?.wert;
    if (p.variante === 'angebot') {
      const sp = dec(p.skonto!).plus(p.provision ?? '0');
      return [
        {
          titel: 'Barverkaufspreis',
          rechnung: `${eur(p.sk!)} + ${eur(get('gewinn')!)} = ${eur(get('bvp')!)}`,
          erlaeuterung: 'Gewinn vom Hundert der Selbstkosten.',
        },
        {
          titel: 'Zielverkaufspreis',
          rechnung: `${eur(get('bvp')!)} ÷ (1 − ${pct(sp)}) = ${eur(get('zvp')!)}`,
          erlaeuterung: 'Skonto und Provision werden vom Zielverkaufspreis gerechnet (im Hundert).',
        },
        {
          titel: 'Listenverkaufspreis',
          rechnung: `${eur(get('zvp')!)} ÷ (1 − ${pct(p.rabatt!)}) = ${eur(get('lvp')!)}`,
          erlaeuterung: 'Der Rabatt wird vom Listenverkaufspreis gerechnet (im Hundert).',
        },
      ];
    }
    return s.werte.map((w) => ({ titel: w.label, rechnung: eur(w.wert) }));
  },
  hints: (p) =>
    p.variante === 'angebot'
      ? [
          'Angebotskalkulation: Selbstkosten + Gewinn = Barverkaufspreis → Zielverkaufspreis → Listenverkaufspreis.',
          'Skonto und Provision beziehen sich auf den Zielverkaufspreis: Barverkaufspreis ÷ (1 − Skonto − Provision).',
          'Rabatt bezieht sich auf den Listenverkaufspreis: Zielverkaufspreis ÷ (1 − Rabatt).',
        ]
      : p.variante === 'summarisch'
        ? [
            'Summarisch: ein Zuschlag auf alle Einzelkosten.',
            'Einzelkosten = Fertigungsmaterial + Fertigungslöhne.',
            'Selbstkosten = Einzelkosten + Gemeinkosten.',
          ]
        : [
            'Schema: Materialkosten + Fertigungskosten = Herstellkosten; + Verwaltungs- und Vertriebsgemeinkosten = Selbstkosten.',
            'MGK auf das Fertigungsmaterial, FGK auf die jeweiligen Fertigungslöhne, VwGK und VtGK auf die Herstellkosten.',
            p.variante === 'differenzierend-sek'
              ? 'Sondereinzelkosten der Fertigung gehören in die Fertigungskosten, die des Vertriebs direkt in die Selbstkosten.'
              : 'Herstellkosten = Materialkosten + Fertigungskosten.',
          ],
  errorVariants: (p) => {
    const out: ErrorVariant[] = [];
    const add = (fehlertyp: string, w: Weg) =>
      out.push({ fehlertyp, parts: zuschlagParts(p, solveZuschlag(p, w)) });
    if (p.variante === 'angebot') add('im-hundert-statt-vom-hundert', { imHundertFalsch: true });
    if (p.variante === 'differenzierend' || p.variante === 'differenzierend-sek') {
      add('zuschlagsbasis-falsch', { vtAufHkPlusVw: true });
      add('zuschlagsbasis-falsch', { fgkAufFm: true });
    }
    if (p.variante === 'differenzierend-sek') add('sek-vergessen', { ohneSek: true });
    return out;
  },
  verfahren: (p) =>
    p.variante === 'angebot'
      ? 'Angebotskalkulation: von den Selbstkosten zum Listenverkaufspreis'
      : 'Zuschlagskalkulation: Selbstkosten nach Kalkulationsschema',
});
