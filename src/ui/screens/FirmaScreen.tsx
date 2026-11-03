// Firma: Steckbrief der Lernversion. Bilanz/GuV-Dashboard und Zeitleiste folgen.
import { FIRMA } from '../../config';
import { Card } from '../components/ui';

export function FirmaScreen() {
  const p = FIRMA.produkte;
  const k = FIRMA.kostenstellen;
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">{FIRMA.name}</h1>
        <p className="mt-1 text-muted">{FIRMA.ort} · Getränkehersteller · Personengesellschaft</p>
      </div>
      <Card className="border-warn/40 bg-warn-soft">
        <p className="text-[15px]">{FIRMA.hinweisFiktiv}</p>
      </Card>
      <Card>
        <h2 className="font-semibold">Dein Auftrag</h2>
        <p className="mt-1 text-[15px]">
          Du führst ein Geschäftsjahr lang die Buchhaltung und Kostenrechnung der MBG – vom
          Rohstoffeinkauf für die Sommersaison über den Jahresabschluss bis zur Kalkulation neuer
          Sorten.
        </p>
      </Card>
      <Card>
        <h2 className="font-semibold">Produkte</h2>
        <ul className="mt-2 flex flex-col gap-1 text-[15px]">
          <li>{p.energy} – Energydrink in drei Dosengrößen (eigenes Erzeugnis)</li>
          <li>{p.lemon} – Limonade im Glas (eigenes Erzeugnis)</li>
          <li>{p.bier} (eigenes Erzeugnis)</li>
          <li>
            {p.wein} und {p.vodka} – zugekaufte Handelswaren
          </li>
        </ul>
      </Card>
      <Card>
        <h2 className="font-semibold">Kostenstellen</h2>
        <ul className="mt-2 grid gap-1 text-[15px] sm:grid-cols-2">
          <li>{k.energie} (Vorkostenstelle)</li>
          <li>{k.instandhaltung} (Vorkostenstelle)</li>
          <li>{k.material}</li>
          <li>{k.fertigung1}</li>
          <li>{k.fertigung2}</li>
          <li>{k.verwaltung}</li>
          <li>{k.vertrieb}</li>
        </ul>
      </Card>
      <Card>
        <h2 className="font-semibold">Gesellschafter</h2>
        <p className="mt-1 text-[15px]">
          {FIRMA.gesellschafter.join(' und ')} (erfundene Personen)
        </p>
      </Card>
    </div>
  );
}
