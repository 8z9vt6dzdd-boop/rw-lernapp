// Hinweis vor Tabellenaufgaben und Fällen auf dem Handy (CLAUDE.md, Regel 9).
import { Sprechblase } from '../lesson/Sprechblase';
import { Button, Card } from './ui';

export function LaptopHinweis({ onHier, onMerken }: { onHier: () => void; onMerken: () => void }) {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <Sprechblase
          s={{
            figur: 'leni',
            ausdruck: 'erklaert',
            text: 'Diese Aufgabe lässt sich am Laptop deutlich bequemer bearbeiten. Große Tabellen sind auf dem Handy etwas fummelig.',
          }}
        />
      </Card>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button variant="primary" onClick={onMerken}>
          Für den Laptop merken
        </Button>
        <Button onClick={onHier}>Trotzdem hier lösen</Button>
      </div>
      <p className="text-sm text-muted">
        Gemerkte Aufgaben erscheinen am Laptop oben auf der Startseite unter „Am Laptop
        weitermachen“.
      </p>
    </div>
  );
}
