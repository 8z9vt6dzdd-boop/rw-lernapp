import { describe, expect, it } from 'vitest';
import { codeAusEingabe, codeAusHash, neuerCode, verbindenLink } from './kopplung';
import { WOERTER } from './woerter';

describe('Kopplungscode', () => {
  it('Wortliste: 256 eindeutige Wörter ohne Umlaute', () => {
    expect(WOERTER).toHaveLength(256);
    expect(new Set(WOERTER).size).toBe(256);
    for (const w of WOERTER) expect(w).toMatch(/^[a-z]{3,9}$/);
  });
  it('erzeugt 8 Wörter und liest sie tolerant zurück', () => {
    const code = neuerCode(() => new Uint8Array([0, 1, 2, 3, 252, 253, 254, 255]));
    expect(code.split('-')).toHaveLength(8);
    expect(codeAusEingabe(code.toUpperCase().replace(/-/g, '  '))).toBe(code);
  });
  it('Umlaute werden umgeschrieben, falsche Wörter abgelehnt', () => {
    expect(codeAusEingabe('Löwe löwe löwe löwe löwe löwe löwe Mühle')).toBe(
      'loewe-loewe-loewe-loewe-loewe-loewe-loewe-muehle',
    );
    expect(codeAusEingabe('apfel apfel')).toBeNull();
    expect(codeAusEingabe('apfel apfel apfel apfel apfel apfel apfel quatsch')).toBeNull();
  });
  it('Link mit Code hin und zurück', () => {
    const code = neuerCode();
    const link = verbindenLink(code, 'https://x.github.io/rw-lernapp/#/einstellungen');
    expect(link).toBe(`https://x.github.io/rw-lernapp/#verbinden-${code}`);
    expect(codeAusHash(new URL(link).hash)).toBe(code);
    expect(codeAusHash('#/start')).toBeNull();
  });
});

describe('QR-Code', () => {
  it('erzeugt passende Versionen und lehnt zu lange Texte ab', async () => {
    const { qrMatrix } = await import('../util/qr');
    expect(qrMatrix('HALLO')).toHaveLength(21);
    const link = verbindenLink(neuerCode(), 'https://8z9vt6dzdd-boop.github.io/rw-lernapp/');
    const n = qrMatrix(link).length;
    expect((n - 17) / 4).toBeLessThanOrEqual(8);
    expect(() => qrMatrix('x'.repeat(400))).toThrow();
  });
});
