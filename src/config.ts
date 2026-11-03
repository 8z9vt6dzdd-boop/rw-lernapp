// Zentrale Einstellungen. Die Rahmenfirma ist eine fiktive Lernversion (08-firma-mbg.md):
// Name und Branche dienen nur als Kulisse; alle Zahlen, Personen und Partner sind erfunden.
import type { FirmaConfig } from './engine/firma';

export const FIRMA: FirmaConfig = {
  name: 'MBG Getränke OHG (Lernversion)',
  kurz: 'MBG',
  ort: 'Paderborn',
  hinweisFiktiv:
    'Lernszenario mit fiktiven Zahlen. Kein Bezug zu tatsächlichen Geschäftsdaten der MBG Group.',
  gesellschafter: ['Jana Hölscher', 'Tim Overbeck'],
  produkte: {
    energy: 'Paderquell Energy',
    lemon: 'Senne Lemon',
    bier: 'Almeblick Tequila-Bier',
    wein: 'Liboriwein',
    vodka: 'Domkreuz Vodka',
  },
  kostenstellen: {
    energie: 'Energie',
    instandhaltung: 'Instandhaltung',
    material: 'Material',
    fertigung1: 'Fertigung I (Sirup- und Braukeller)',
    fertigung2: 'Fertigung II (Abfüllung)',
    verwaltung: 'Verwaltung',
    vertrieb: 'Vertrieb',
  },
  lieferanten: {
    rohstoffe: [
      'Aromahaus Tewes GmbH (Bielefeld)',
      'Zuckerkontor Hellwegland KG (Lippstadt)',
      'Fruchtkonzentrate Brakemeier GmbH (Detmold)',
      'Malzmühle Eggetal GmbH (Warburg)',
    ],
    hilfsstoffe: [
      'Dosenwerk Rüther KG (Bielefeld)',
      'Etikettendruck Schlüter & Söhne (Detmold)',
      'Verschlusstechnik Nolting GmbH (Lippstadt)',
    ],
    betriebsstoffe: [
      'Kohlensäure-Service Bökamp (Paderborn)',
      'Reinigungschemie Ostwald KG (Bielefeld)',
    ],
    vorprodukte: ['Grundstoffwerk Kötter GmbH (Bad Driburg)'],
    handelswaren: [
      'Weinkellerei Lindemeier (Detmold)',
      'Spirituosenimport Wiemers OHG (Bielefeld)',
    ],
    anlagen: ['Abfülltechnik Hagedorn GmbH (Lippstadt)', 'Anlagenbau Tiemann KG (Warburg)'],
  },
  kunden: [
    'Gastro-Großhandel Nolte KG (Bielefeld)',
    'Getränkemarkt Brinkmann (Detmold)',
    'Landhotel Kerkhoff GmbH (Bad Driburg)',
    'Tankstellenkette Weskamp OHG (Lippstadt)',
    'Lebensmittelmarkt Hüsken KG (Warburg)',
    'Bistro Paderufer Lüke (Paderborn)',
  ],
};

export const UST_STANDARD = '0.19';
export const WOCHENZIEL_STANDARD = 5;
