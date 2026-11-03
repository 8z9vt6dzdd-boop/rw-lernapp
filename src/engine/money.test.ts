import { describe, expect, it } from 'vitest';
import {
  Val,
  bewerte,
  dec,
  formatEuro,
  formatNumber,
  formatProzent,
  parseNumber,
  round,
} from './money';

describe('parseNumber', () => {
  it.each([
    ['1.234,5', '1234.5'],
    ['1234,50', '1234.5'],
    ['1234.5', '1234.5'],
    ['1.234', '1234'],
    ['1.234.567,89', '1234567.89'],
    ['1,234.56', '1234.56'],
    ['12,5 %', '12.5'],
    ['11.662,00 €', '11662'],
    ['-3.000', '-3000'],
    ['−3.000', '-3000'],
    [',5', '0.5'],
    ['0,05', '0.05'],
    [' 200 ', '200'],
  ])('%s → %s', (input, expected) => {
    expect(parseNumber(input)?.toString()).toBe(expected);
  });

  it.each(['', 'abc', '1,2,3', '1.2.3,4.5', '12a', '-', '1.23.456'])(
    '„%s“ ist ungültig',
    (input) => {
      expect(parseNumber(input)).toBeNull();
    },
  );
});

describe('Formatierung', () => {
  it('deutsches Zahlenformat', () => {
    expect(formatNumber('1234.5')).toBe('1.234,50');
    expect(formatNumber('-0.004')).toBe('0,00');
    expect(formatNumber('-1234567.891')).toBe('−1.234.567,89');
    expect(formatEuro('11662')).toBe('11.662,00 €');
    expect(formatProzent('0.025')).toBe('2,5 %');
  });

  it('kaufmännisch runden (ROUND_HALF_UP)', () => {
    expect(round('0.125').toString()).toBe('0.13');
    expect(round('2.675').toString()).toBe('2.68');
    expect(round('-0.125').toString()).toBe('-0.13');
  });
});

describe('Zwei Lösungspfade und Toleranz', () => {
  const skontoNetto = new Val(198).div('1.19').round(); // 166,386… → 166,39

  it('exakter Wert ist richtig', () => {
    expect(bewerte(dec('166.39'), skontoNetto, 'betrag')).toBe('richtig');
  });

  it('± 0,01 je Rundungsschritt gilt als Rundungsabweichung', () => {
    expect(bewerte(dec('166.38'), skontoNetto, 'betrag')).toBe('rundung');
    expect(bewerte(dec('166.41'), skontoNetto, 'betrag')).toBe('falsch');
  });

  it('ohne Rundungsschritt muss der Wert auf den Cent stimmen', () => {
    expect(bewerte(dec('200.01'), new Val(200), 'betrag')).toBe('falsch');
  });

  it('schrittweise gerundeter Weg wird akzeptiert (Satz vorab gerundet)', () => {
    // 317.700 € ÷ 48.000 h = 6,61875 €/h; Klausurweg: 6,62 × 7.700 = 50.974,00
    const satz = new Val('317700').div(48000).round();
    const jahr = satz.times(7700).round();
    expect(bewerte(dec('50964.38'), jahr, 'betrag')).toBe('richtig');
    expect(bewerte(dec('50974'), jahr, 'betrag')).toBe('rundung');
    expect(bewerte(dec('50980'), jahr, 'betrag')).toBe('falsch');
  });

  it('Toleranz höchstens 0,05 € gesamt, für Sätze höchstens 0,01', () => {
    let v = new Val('1').div(3);
    for (let i = 0; i < 10; i++) v = v.round().times('1.0001');
    expect(v.steps).toBeGreaterThan(5);
    const exact = round(v.exact);
    expect(bewerte(exact.plus('0.05'), v, 'betrag')).not.toBe('falsch');
    expect(bewerte(exact.plus('0.06').plus(v.stepped.minus(v.exact).abs()), v, 'betrag')).toBe(
      'falsch',
    );
    expect(bewerte(exact.plus('0.02'), v, 'satz')).toBe('falsch');
  });

  it('fix() rundet beide Pfade auf echte Centbeträge', () => {
    const v = new Val('942.8436').fix();
    expect(v.exact.toString()).toBe('942.84');
    expect(v.stepped.toString()).toBe('942.84');
  });
});
