// Lernpfad (Vorstufe): verfügbare Aufgabentypen zum gezielten Üben.
// Kompetenzringe, Wiederholungsplanung und Einstufung folgen mit dem vollständigen Lernpfad.
import { GENERATOREN } from '../../engine/generators';
import { Card, Chip, Icon } from '../components/ui';

const ABSCHNITTE: { id: string; titel: string }[] = [
  { id: 'B', titel: 'Umsatzsteuer' },
  { id: 'C', titel: 'Beschaffung' },
  { id: 'D', titel: 'Absatz und Privat' },
  { id: 'E', titel: 'Anlagen und Bestände' },
  { id: 'H', titel: 'Kostenartenrechnung' },
  { id: 'I', titel: 'Kostenstellenrechnung' },
  { id: 'J', titel: 'Kostenträgerrechnung' },
];

export function LernpfadScreen() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Lernpfad</h1>
        <p className="mt-1 text-muted">
          Wähle einen Aufgabentyp, um ihn gezielt zu üben (4 Aufgaben).
        </p>
      </div>
      {ABSCHNITTE.map((a) => {
        const gens = GENERATOREN.filter((g) => g.skillId.startsWith(a.id));
        if (gens.length === 0) return null;
        return (
          <Card key={a.id}>
            <div className="mb-2 flex items-center gap-2">
              <Chip tone="accent">{a.id}</Chip>
              <h2 className="font-semibold">{a.titel}</h2>
            </div>
            <ul className="flex flex-col">
              {gens.map((g) => (
                <li key={g.skillId}>
                  <a
                    href={`#/sitzung?skill=${encodeURIComponent(g.skillId)}`}
                    className="flex min-h-12 items-center justify-between gap-3 border-t border-line py-2 text-[15px] hover:text-accent"
                  >
                    <span>{g.titel}</span>
                    <Icon name="pfeil" className="h-5 w-5 text-muted" />
                  </a>
                </li>
              ))}
            </ul>
          </Card>
        );
      })}
      <p className="text-sm text-muted">
        Weitere Abschnitte und die Übersicht über deinen Lernfortschritt folgen.
      </p>
    </div>
  );
}
