import { describe, expect, it } from 'vitest';
import { KONTEN, canonicalKonto } from './accounts';

describe('Kontensynonyme', () => {
  it('Saldenvortrag/SV gilt als Eröffnungsbilanzkonto (04-fachregeln, Abschnitt 7.1)', () => {
    for (const s of ['SV', 'Saldenvortrag', 'saldenvortrag', 'EBK'])
      expect(canonicalKonto(s)).toBe('Eröffnungsbilanzkonto');
  });
  it('kein Synonym ist mehrdeutig', () => {
    const alle = KONTEN.flatMap((k) => [k.name, ...k.synonyme].map((x) => x.toLowerCase()));
    expect(new Set(alle).size).toBe(alle.length);
  });
});
