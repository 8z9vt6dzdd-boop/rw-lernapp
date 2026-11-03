// Sparsame Sound-Effekte, vollständig im Code erzeugt (Web Audio) – keine fremden Aufnahmen, keine Lizenzfragen.
// iPhone: Audio-Sitzung „ambient“ → Stummschalter wird respektiert, laufende Musik/Podcasts laufen weiter.

export type Ton = 'richtig' | 'falsch' | 'klack' | 'lektion' | 'serie' | 'erfolg' | 'feier' | 'akkord';

const LAUTSTAERKE = 0.16;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let an = true;

type AudioSessionNavigator = Navigator & { audioSession?: { type: string } };

function audioSessionAmbient(): void {
  try {
    const nav = navigator as AudioSessionNavigator;
    if (nav.audioSession) nav.audioSession.type = 'ambient';
  } catch {
    /* ältere Browser ohne Audio-Session-API */
  }
}

function context(): AudioContext | null {
  if (!an || typeof window === 'undefined') return null;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) {
    audioSessionAmbient();
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = LAUTSTAERKE;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/** Beim ersten Antippen entsperren (iOS erlaubt Ton erst nach einer Berührung). */
export function toeneEntsperren(): void {
  if (typeof window === 'undefined') return;
  const einmal = () => {
    context();
    window.removeEventListener('pointerdown', einmal);
  };
  window.addEventListener('pointerdown', einmal);
}

export function setToeneAn(wert: boolean): void {
  an = wert;
  if (!wert && ctx) void ctx.suspend();
}

// ---------- Bausteine ----------

function ton(c: AudioContext, freq: number, start: number, dauer: number, opts: { typ?: OscillatorType; lautstaerke?: number; bis?: number } = {}) {
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = opts.typ ?? 'sine';
  o.frequency.setValueAtTime(freq, start);
  if (opts.bis) o.frequency.exponentialRampToValueAtTime(opts.bis, start + dauer);
  const v = opts.lautstaerke ?? 1;
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(v, start + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dauer);
  o.connect(g).connect(master!);
  o.start(start);
  o.stop(start + dauer + 0.02);
}

function rauschen(c: AudioContext, start: number, dauer: number, opts: { von: number; bis: number; q?: number; lautstaerke?: number; huellkurve?: 'zisch' | 'klack' | 'wellen' }) {
  const laenge = Math.ceil(c.sampleRate * dauer);
  const buffer = c.createBuffer(1, laenge, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < laenge; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buffer;
  const f = c.createBiquadFilter();
  f.type = 'bandpass';
  f.Q.value = opts.q ?? 1.2;
  f.frequency.setValueAtTime(opts.von, start);
  f.frequency.exponentialRampToValueAtTime(opts.bis, start + dauer);
  const g = c.createGain();
  const v = opts.lautstaerke ?? 1;
  g.gain.setValueAtTime(0.0001, start);
  if (opts.huellkurve === 'klack') {
    g.gain.exponentialRampToValueAtTime(v, start + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dauer);
  } else if (opts.huellkurve === 'wellen') {
    // Einschenken: plätschernde Lautstärkeschwankungen
    g.gain.exponentialRampToValueAtTime(v * 0.6, start + 0.08);
    for (let t = 0.1; t < dauer - 0.1; t += 0.07) g.gain.setValueAtTime(v * (0.45 + 0.4 * Math.abs(Math.sin(t * 37))), start + t);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dauer);
  } else {
    g.gain.exponentialRampToValueAtTime(v, start + 0.02);
    g.gain.setValueAtTime(v * 0.8, start + dauer * 0.4);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dauer);
  }
  src.connect(f).connect(g).connect(master!);
  src.start(start);
  src.stop(start + dauer + 0.02);
}

/** Gläser- bzw. Flaschenklang: unharmonische Teiltöne, die ausklingen. */
function kling(c: AudioContext, start: number, grund: number, lautstaerke = 0.5) {
  for (const [faktor, v, d] of [
    [1, 1, 0.7],
    [2.76, 0.5, 0.45],
    [5.4, 0.25, 0.25],
  ] as const) {
    ton(c, grund * faktor, start, d, { lautstaerke: lautstaerke * v });
  }
}

const NOTE = (halbtoene: number) => 523.25 * 2 ** (halbtoene / 12); // ab c''

// ---------- Effekte ----------

export function spiele(t: Ton): void {
  const c = context();
  if (!c || !master) return;
  const s = c.currentTime + 0.01;
  switch (t) {
    case 'richtig':
      ton(c, NOTE(12), s, 0.09, { lautstaerke: 0.5 });
      ton(c, NOTE(19), s + 0.07, 0.16, { lautstaerke: 0.45 });
      break;
    case 'falsch':
      ton(c, 220, s, 0.28, { typ: 'triangle', lautstaerke: 0.45, bis: 185 });
      break;
    case 'klack':
      rauschen(c, s, 0.05, { von: 2400, bis: 1600, q: 3, lautstaerke: 0.7, huellkurve: 'klack' });
      ton(c, 140, s, 0.06, { lautstaerke: 0.35 });
      break;
    case 'lektion':
      // Dose öffnen: „Pssst“, dann kurzer Jingle
      rauschen(c, s, 0.45, { von: 6000, bis: 2500, q: 0.8, lautstaerke: 0.55, huellkurve: 'zisch' });
      [0, 4, 7, 12].forEach((n, i) => ton(c, NOTE(n), s + 0.5 + i * 0.09, 0.22, { typ: 'triangle', lautstaerke: 0.4 }));
      break;
    case 'serie':
      // Einschenken
      rauschen(c, s, 1.0, { von: 900, bis: 1700, q: 2.5, lautstaerke: 0.5, huellkurve: 'wellen' });
      break;
    case 'erfolg':
      // Anstoßen mit Flaschen
      kling(c, s, 1850, 0.45);
      kling(c, s + 0.11, 2050, 0.35);
      break;
    case 'feier': {
      // Längerer Jingle zur Szene (ca. 2,5 s)
      const melodie = [0, 4, 7, 12, 7, 9, 11, 12];
      melodie.forEach((n, i) => ton(c, NOTE(n), s + i * 0.18, 0.3, { typ: 'triangle', lautstaerke: 0.38 }));
      [0, 4, 7, 12].forEach((n) => ton(c, NOTE(n - 12), s + 1.5, 1.0, { lautstaerke: 0.22 }));
      break;
    }
    case 'akkord':
      [0, 4, 7].forEach((n, i) => ton(c, NOTE(n), s + i * 0.03, 0.6, { typ: 'triangle', lautstaerke: 0.3 }));
      break;
  }
}
