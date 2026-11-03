import { describe, expect, it } from 'vitest';
import { KONTEN, canonicalKonto, searchKonten } from './accounts';

describe('Kontenliste', () => {
  it('Namen und Synonyme sind eindeutig', () => {
    const seen = new Map<string, string>();
    for (const k of KONTEN) {
      for (const n of [k.name, ...k.synonyme]) {
        const c = canonicalKonto(n);
        expect(c, n).toBeDefined();
        if (seen.has(n)) expect(seen.get(n)).toBe(k.name);
        seen.set(n, k.name);
      }
    }
  });

  it.each([
    ['TA u. Maschinen', 'Technische Anlagen und Maschinen'],
    ['TA und Maschinen', 'Technische Anlagen und Maschinen'],
    ['Verbindlichkeiten a. LL', 'Verbindlichkeiten aus Lieferungen und Leistungen'],
    ['Verbindlichkeiten a.LL', 'Verbindlichkeiten aus Lieferungen und Leistungen'],
    ['forderungen a. ll', 'Forderungen aus Lieferungen und Leistungen'],
    ['VSt', 'Vorsteuer'],
    ['Erlösschmälerungen', 'Erlösberichtigungen'],
    ['Nachlässe Rohstoffe', 'Nachlässe für Rohstoffe'],
    ['SBK', 'Schlussbilanzkonto'],
    ['GuV', 'Gewinn- und Verlustkonto'],
    ['Entnahme v. G. u. s. L.', 'Entnahme von Gegenständen und sonstigen Leistungen'],
    ['BGA', 'Betriebs- und Geschäftsausstattung'],
  ])('%s → %s', (input, expected) => {
    expect(canonicalKonto(input)).toBe(expected);
  });

  it('Suche findet Präfixe zuerst', () => {
    expect(searchKonten('vor')[0]?.name).toBe('Vorsteuer');
    expect(searchKonten('nachl').every((k) => k.name.startsWith('Nachlässe'))).toBe(true);
    expect(searchKonten('bank')[0]?.name).toBe('Bank');
  });
});
