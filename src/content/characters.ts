// Feste Figuren der MBG (fiktiv, 10-optik-und-motivation.md A2). Jede Figur ist eine feste
// Kombination aus Open-Peeps-Bausteinen und Farben; Ausdruck und Haltung wählt die Lektion.

export type FigurId = 'jana' | 'tobias' | 'leni' | 'frank' | 'sabine' | 'ich';

export type Ausdruck =
  'neutral' | 'erklaert' | 'freut' | 'gruebelt' | 'ueberrascht' | 'feiert' | 'entsetzt';

export const AUSDRUECKE: readonly Ausdruck[] = [
  'neutral',
  'erklaert',
  'freut',
  'gruebelt',
  'ueberrascht',
  'feiert',
  'entsetzt',
];

export interface FigurAussehen {
  /** Haltung je Ausdruck (Open-Peeps-Büste) */
  posen: Record<Ausdruck, string>;
  frisur: string;
  brille?: string;
  bart?: string;
  /** Kleidungsfarbe (flächig) */
  farbe: string;
}

export interface Figur extends FigurAussehen {
  id: FigurId;
  name: string;
  rolle: string;
  kurz: string;
}

/** Gesicht je Ausdruck – für alle Figuren gleich, damit Ausdrücke wiedererkennbar sind. */
export const GESICHT: Record<Ausdruck, string> = {
  neutral: 'Calm',
  erklaert: 'Explaining',
  freut: 'Smile',
  gruebelt: 'Suspicious',
  ueberrascht: 'Awe',
  feiert: 'SmileLol',
  entsetzt: 'ConcernedFear',
};

/** Farbwelt: frisch und getränkig (A4). */
export const FARBEN = {
  petrol: '#1c6670',
  limette: '#8cbf3f',
  orange: '#e8792b',
  senf: '#e2b13c',
  marine: '#2f4b7c',
  beere: '#b8475a',
  himmel: '#4a9fd8',
  salbei: '#7fa88e',
} as const;

const posen = (
  basis: string,
  erklaert: string,
  feiert = 'PointingUp',
  gruebelt = basis,
): Record<Ausdruck, string> => ({
  neutral: basis,
  erklaert,
  freut: basis,
  gruebelt,
  ueberrascht: basis,
  feiert,
  entsetzt: basis,
});

export const FIGUREN: Record<Exclude<FigurId, 'ich'>, Figur> = {
  jana: {
    id: 'jana',
    name: 'Jana Kröger',
    kurz: 'Jana',
    rolle: 'Buchhaltung',
    posen: posen('BlazerBlackTee', 'Explaining', 'PointingUp'),
    frisur: 'Bun',
    brille: 'GlassRound',
    farbe: FARBEN.petrol,
  },
  tobias: {
    id: 'tobias',
    name: 'Tobias Hesse',
    kurz: 'Tobias',
    rolle: 'Vertrieb',
    posen: posen('Device', 'ButtonShirt', 'PointingUp', 'Device'),
    frisur: 'ShortMessy',
    farbe: FARBEN.orange,
  },
  leni: {
    id: 'leni',
    name: 'Dr. Leni Brandt',
    kurz: 'Leni',
    rolle: 'Controlling',
    posen: posen('Geek', 'Sweater', 'PointingUp', 'Geek'),
    frisur: 'Long',
    brille: 'GlassClubmaster',
    farbe: FARBEN.senf,
  },
  frank: {
    id: 'frank',
    name: 'Frank Wessel',
    kurz: 'Frank',
    rolle: 'Gesellschafter',
    posen: posen('Coffee', 'Explaining', 'PointingUp'),
    frisur: 'GrayShort',
    bart: 'Chin',
    farbe: FARBEN.marine,
  },
  sabine: {
    id: 'sabine',
    name: 'Sabine Wessel',
    kurz: 'Sabine',
    rolle: 'Gesellschafterin',
    posen: posen('Sweater', 'Explaining', 'PointingUp', 'Device'),
    frisur: 'GrayBun',
    farbe: FARBEN.beere,
  },
};

// ---------- Eigene Figur der lernenden Person ----------

export const ICH_FRISUREN = [
  'ShortCurly',
  'Bangs',
  'Afro',
  'Medium',
  'ShortWavy',
  'LongCurly',
  'Pomp',
  'FlatTop',
] as const;
export const ICH_FARBEN = [
  FARBEN.limette,
  FARBEN.himmel,
  FARBEN.orange,
  FARBEN.beere,
  FARBEN.senf,
  FARBEN.salbei,
] as const;
export const ICH_ACCESSOIRES = [
  { id: 'keins', label: 'ohne' },
  { id: 'GlassRound', label: 'runde Brille' },
  { id: 'GlassButterflyOutline', label: 'eckige Brille' },
] as const;

export interface IchAussehen {
  frisur: string;
  farbe: string;
  accessoire: string;
}

export const ICH_STANDARD: IchAussehen = {
  frisur: 'ShortCurly',
  farbe: FARBEN.limette,
  accessoire: 'keins',
};

export function ichFigur(a: IchAussehen, name = 'Du'): Figur {
  const f: Figur = {
    id: 'ich',
    name,
    kurz: name,
    rolle: 'Neu im Rechnungswesen',
    posen: posen('PocketShirt', 'Explaining', 'PointingUp', 'Whatever'),
    frisur: a.frisur,
    farbe: a.farbe,
  };
  if (a.accessoire !== 'keins') f.brille = a.accessoire;
  return f;
}
