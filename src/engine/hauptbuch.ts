// Kleines Hauptbuch: Buchungssätze auf Konten verteilen, Salden bilden, GuV und Bilanz ableiten.
import { getKonto, type KontoTyp } from './accounts';
import type { ErwSatz } from './booking';
import { Decimal, type Dec } from './money';

export interface KontoBuch {
  soll: { gegen: string; betrag: Dec }[];
  haben: { gegen: string; betrag: Dec }[];
}

export class Hauptbuch {
  readonly konten = new Map<string, KontoBuch>();

  private konto(name: string): KontoBuch {
    let k = this.konten.get(name);
    if (!k) {
      k = { soll: [], haben: [] };
      this.konten.set(name, k);
    }
    return k;
  }

  /** Anfangsbestand: Aktivkonten im Soll, Passivkonten im Haben (Gegenkonto EBK). */
  eroeffne(name: string, betrag: Dec | string): void {
    const b = new Decimal(betrag);
    if (getKonto(name).typ === 'aktiv')
      this.konto(name).soll.push({ gegen: 'Eröffnungsbilanzkonto', betrag: b });
    else this.konto(name).haben.push({ gegen: 'Eröffnungsbilanzkonto', betrag: b });
  }

  buche(s: ErwSatz): void {
    const gegenHaben = s.haben.map((z) => z.konto).join(', ');
    const gegenSoll = s.soll.map((z) => z.konto).join(', ');
    for (const z of s.soll)
      this.konto(z.konto).soll.push({ gegen: gegenHaben, betrag: z.betrag.value });
    for (const z of s.haben)
      this.konto(z.konto).haben.push({ gegen: gegenSoll, betrag: z.betrag.value });
  }

  /** Saldo Soll minus Haben. */
  saldo(name: string): Dec {
    const k = this.konten.get(name);
    if (!k) return new Decimal(0);
    const sum = (xs: { betrag: Dec }[]) => xs.reduce((a, x) => a.plus(x.betrag), new Decimal(0));
    return sum(k.soll).minus(sum(k.haben));
  }

  kontenVomTyp(...typen: KontoTyp[]): string[] {
    return [...this.konten.keys()].filter((k) => typen.includes(getKonto(k).typ));
  }

  /** Aktiva und Passiva mit Schlussbeständen (Unterkonten sind vorher abzuschließen). */
  bilanz(): {
    aktiva: { konto: string; betrag: Dec }[];
    passiva: { konto: string; betrag: Dec }[];
    summeAktiva: Dec;
    summePassiva: Dec;
  } {
    const aktiva = this.kontenVomTyp('aktiv')
      .map((konto) => ({ konto, betrag: this.saldo(konto) }))
      .filter((x) => !x.betrag.isZero());
    const passiva = this.kontenVomTyp('passiv')
      .map((konto) => ({ konto, betrag: this.saldo(konto).neg() }))
      .filter((x) => !x.betrag.isZero());
    const s = (xs: { betrag: Dec }[]) => xs.reduce((a, x) => a.plus(x.betrag), new Decimal(0));
    return { aktiva, passiva, summeAktiva: s(aktiva), summePassiva: s(passiva) };
  }

  /** Erfolg = Erträge − Aufwendungen (vor Abschluss der Erfolgskonten). */
  erfolg(): Dec {
    const ertrag = this.kontenVomTyp('ertrag').reduce(
      (a, k) => a.minus(this.saldo(k)),
      new Decimal(0),
    );
    const aufwand = this.kontenVomTyp('aufwand').reduce(
      (a, k) => a.plus(this.saldo(k)),
      new Decimal(0),
    );
    return ertrag.minus(aufwand);
  }
}
