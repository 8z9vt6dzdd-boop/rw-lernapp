import { describe, expect, it } from 'vitest';
import { sicherungLesen } from './transfer';

describe('Lernstand-Datei', () => {
  it('liest gültige Sicherungen und filtert kaputte Einträge', () => {
    const r = sicherungLesen(
      JSON.stringify({
        format: 'rw-lernapp-lernstand',
        version: 1,
        erstellt: 'x',
        events: [{ id: '1', typ: 'attempt', ts: 't' }, { foo: 1 }, null],
      }),
    );
    expect('events' in r && r.events.map((e) => e.id)).toEqual(['1']);
  });
  it('lehnt fremde Dateien verständlich ab', () => {
    expect(sicherungLesen('kein json')).toHaveProperty('fehler');
    expect(sicherungLesen('{"format":"anders","events":[]}')).toHaveProperty('fehler');
  });
});
