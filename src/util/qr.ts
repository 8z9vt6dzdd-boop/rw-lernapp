// Kleiner QR-Code-Erzeuger (Byte-Modus, Fehlerkorrektur M, Version 1–10) nach ISO/IEC 18004.
// Eigene Umsetzung statt Fremdbibliothek; genügt für den Verbindungslink der App.

const ECC_JE_BLOCK_M = [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26];
const BLOECKE_M = [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5];
const FORMAT_M = 0; // Formatbits der Stufe M

function rohModule(ver: number): number {
  let r = (16 * ver + 128) * ver + 64;
  if (ver >= 2) {
    const n = Math.floor(ver / 7) + 2;
    r -= (25 * n - 10) * n - 55;
    if (ver >= 7) r -= 36;
  }
  return r;
}

function datenCodewoerter(ver: number): number {
  return Math.floor(rohModule(ver) / 8) - ECC_JE_BLOCK_M[ver]! * BLOECKE_M[ver]!;
}

function mal(x: number, y: number): number {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z;
}

function rsDivisor(grad: number): number[] {
  const r = new Array<number>(grad).fill(0);
  r[grad - 1] = 1;
  let wurzel = 1;
  for (let i = 0; i < grad; i++) {
    for (let j = 0; j < r.length; j++) {
      r[j] = mal(r[j]!, wurzel);
      if (j + 1 < r.length) r[j]! ^= r[j + 1]!;
    }
    wurzel = mal(wurzel, 0x02);
  }
  return r;
}

export function rsRest(daten: readonly number[], divisor: readonly number[]): number[] {
  const r = new Array<number>(divisor.length).fill(0);
  for (const b of daten) {
    const faktor = b ^ r.shift()!;
    r.push(0);
    divisor.forEach((c, i) => (r[i]! ^= mal(c, faktor)));
  }
  return r;
}

function bit(x: number, i: number): boolean {
  return ((x >>> i) & 1) !== 0;
}

/** Erzeugt die Modulmatrix (true = dunkel) für den Text. */
export function qrMatrix(text: string): boolean[][] {
  const bytes = [...new TextEncoder().encode(text)];
  let ver = 1;
  for (; ver <= 10; ver++) {
    const zaehlBits = ver <= 9 ? 8 : 16;
    if (4 + zaehlBits + bytes.length * 8 <= datenCodewoerter(ver) * 8) break;
  }
  if (ver > 10) throw new Error('Text zu lang für den QR-Code');

  // Bitstrom: Modus Byte, Länge, Daten, Abschluss, Füllbytes
  const bits: number[] = [];
  const add = (wert: number, n: number) => {
    for (let i = n - 1; i >= 0; i--) bits.push((wert >>> i) & 1);
  };
  add(0b0100, 4);
  add(bytes.length, ver <= 9 ? 8 : 16);
  for (const b of bytes) add(b, 8);
  const kapazitaet = datenCodewoerter(ver) * 8;
  add(0, Math.min(4, kapazitaet - bits.length));
  add(0, (8 - (bits.length % 8)) % 8);
  for (let pad = 0xec; bits.length < kapazitaet; pad ^= 0xec ^ 0x11) add(pad, 8);
  const daten: number[] = [];
  for (let i = 0; i < bits.length; i += 8) daten.push(parseInt(bits.slice(i, i + 8).join(''), 2));

  // Fehlerkorrektur und Verschränkung
  const anzahlBloecke = BLOECKE_M[ver]!;
  const eccLaenge = ECC_JE_BLOCK_M[ver]!;
  const roh = Math.floor(rohModule(ver) / 8);
  const kurzeBloecke = anzahlBloecke - (roh % anzahlBloecke);
  const kurzLaenge = Math.floor(roh / anzahlBloecke);
  const div = rsDivisor(eccLaenge);
  const bloecke: number[][] = [];
  for (let i = 0, k = 0; i < anzahlBloecke; i++) {
    const dat = daten.slice(k, k + kurzLaenge - eccLaenge + (i < kurzeBloecke ? 0 : 1));
    k += dat.length;
    const ecc = rsRest(dat, div);
    if (i < kurzeBloecke) dat.push(0);
    bloecke.push(dat.concat(ecc));
  }
  const codewoerter: number[] = [];
  for (let i = 0; i < bloecke[0]!.length; i++) {
    bloecke.forEach((b, j) => {
      if (i !== kurzLaenge - eccLaenge || j >= kurzeBloecke) codewoerter.push(b[i]!);
    });
  }

  // Matrix mit Funktionsmustern
  const groesse = ver * 4 + 17;
  const m: boolean[][] = Array.from({ length: groesse }, () =>
    new Array<boolean>(groesse).fill(false),
  );
  const fkt: boolean[][] = Array.from({ length: groesse }, () =>
    new Array<boolean>(groesse).fill(false),
  );
  const setze = (x: number, y: number, dunkel: boolean) => {
    m[y]![x] = dunkel;
    fkt[y]![x] = true;
  };
  for (let i = 0; i < groesse; i++) {
    setze(6, i, i % 2 === 0);
    setze(i, 6, i % 2 === 0);
  }
  const finder = (x: number, y: number) => {
    for (let dy = -4; dy <= 4; dy++)
      for (let dx = -4; dx <= 4; dx++) {
        const d = Math.max(Math.abs(dx), Math.abs(dy));
        const xx = x + dx;
        const yy = y + dy;
        if (xx >= 0 && xx < groesse && yy >= 0 && yy < groesse) setze(xx, yy, d !== 2 && d !== 4);
      }
  };
  finder(3, 3);
  finder(groesse - 4, 3);
  finder(3, groesse - 4);
  if (ver >= 2) {
    const n = Math.floor(ver / 7) + 2;
    const schritt = Math.ceil((ver * 4 + 4) / (n * 2 - 2)) * 2;
    const pos = [6];
    for (let p = groesse - 7; pos.length < n; p -= schritt) pos.splice(1, 0, p);
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        if ((i === 0 && j === 0) || (i === 0 && j === n - 1) || (i === n - 1 && j === 0)) continue;
        for (let dy = -2; dy <= 2; dy++)
          for (let dx = -2; dx <= 2; dx++)
            setze(pos[i]! + dx, pos[j]! + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
      }
  }
  const formatBits = (maske: number) => {
    const d = (FORMAT_M << 3) | maske;
    let r = d;
    for (let i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537);
    const b = ((d << 10) | r) ^ 0x5412;
    for (let i = 0; i <= 5; i++) setze(8, i, bit(b, i));
    setze(8, 7, bit(b, 6));
    setze(8, 8, bit(b, 7));
    setze(7, 8, bit(b, 8));
    for (let i = 9; i < 15; i++) setze(14 - i, 8, bit(b, i));
    for (let i = 0; i < 8; i++) setze(groesse - 1 - i, 8, bit(b, i));
    for (let i = 8; i < 15; i++) setze(8, groesse - 15 + i, bit(b, i));
    setze(8, groesse - 8, true);
  };
  formatBits(0);
  if (ver >= 7) {
    let r = ver;
    for (let i = 0; i < 12; i++) r = (r << 1) ^ ((r >>> 11) * 0x1f25);
    const b = (ver << 12) | r;
    for (let i = 0; i < 18; i++) {
      const a = groesse - 11 + (i % 3);
      const c = Math.floor(i / 3);
      setze(a, c, bit(b, i));
      setze(c, a, bit(b, i));
    }
  }

  // Daten im Zickzack eintragen
  let i = 0;
  for (let rechts = groesse - 1; rechts >= 1; rechts -= 2) {
    if (rechts === 6) rechts = 5;
    for (let v = 0; v < groesse; v++)
      for (let j = 0; j < 2; j++) {
        const x = rechts - j;
        const hoch = ((rechts + 1) & 2) === 0;
        const y = hoch ? groesse - 1 - v : v;
        if (!fkt[y]![x] && i < codewoerter.length * 8) {
          m[y]![x] = bit(codewoerter[i >>> 3]!, 7 - (i & 7));
          i++;
        }
      }
  }

  const maskiere = (maske: number) => {
    for (let y = 0; y < groesse; y++)
      for (let x = 0; x < groesse; x++) {
        if (fkt[y]![x]) continue;
        const inv = [
          (x + y) % 2 === 0,
          y % 2 === 0,
          x % 3 === 0,
          (x + y) % 3 === 0,
          (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
          ((x * y) % 2) + ((x * y) % 3) === 0,
          (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
          (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
        ][maske]!;
        if (inv) m[y]![x] = !m[y]![x];
      }
  };

  // Maske mit der geringsten (vereinfachten) Strafpunktzahl wählen
  let beste = 0;
  let besteStrafe = Infinity;
  for (let maske = 0; maske < 8; maske++) {
    maskiere(maske);
    formatBits(maske);
    const s = strafe(m);
    if (s < besteStrafe) {
      besteStrafe = s;
      beste = maske;
    }
    maskiere(maske);
  }
  maskiere(beste);
  formatBits(beste);
  return m;
}

/** Vereinfachte Bewertung nach N1 (Reihen), N2 (2×2-Blöcke) und N4 (Hell-Dunkel-Verhältnis). */
function strafe(m: boolean[][]): number {
  const n = m.length;
  let s = 0;
  const reihe = (get: (i: number) => boolean) => {
    let lauf = 1;
    for (let i = 1; i < n; i++) {
      if (get(i) === get(i - 1)) lauf++;
      else {
        if (lauf >= 5) s += lauf - 2;
        lauf = 1;
      }
    }
    if (lauf >= 5) s += lauf - 2;
  };
  for (let k = 0; k < n; k++) {
    reihe((i) => m[k]![i]!);
    reihe((i) => m[i]![k]!);
  }
  let dunkel = 0;
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      if (m[y]![x]) dunkel++;
      if (x < n - 1 && y < n - 1) {
        const c = m[y]![x];
        if (c === m[y]![x + 1] && c === m[y + 1]![x] && c === m[y + 1]![x + 1]) s += 3;
      }
    }
  s += Math.floor(Math.abs(dunkel * 20 - n * n * 10) / (n * n)) * 10;
  return s;
}

/** SVG-Pfad der dunklen Module (ein Rechteck je Modul), mit Ruhezone von 4 Modulen. */
export function qrSvgPfad(m: boolean[][]): { pfad: string; groesse: number } {
  const teile: string[] = [];
  m.forEach((zeile, y) =>
    zeile.forEach((d, x) => {
      if (d) teile.push(`M${x + 4} ${y + 4}h1v1h-1z`);
    }),
  );
  return { pfad: teile.join(''), groesse: m.length + 8 };
}
