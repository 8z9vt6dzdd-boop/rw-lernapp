// Datentabelle eines Sachverhalts (z. B. Leistungsabgaben im BAB, Anfangsbestände).
import type { TaskText } from '../../engine/task';
import { cx } from './ui';

export function DatenTabelle({ daten }: { daten: NonNullable<TaskText['daten']> }) {
  return (
    <div className="-mx-4 mt-3 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <table className="num w-full border-collapse text-sm">
        {daten.spalten.some((s) => s) ? (
          <thead>
            <tr>
              {daten.spalten.map((s, i) => (
                <th
                  key={i}
                  className={cx(
                    'border-b border-line px-2 py-1.5 text-xs font-semibold text-muted',
                    i === 0 ? 'text-left' : 'text-right',
                  )}
                >
                  {s}
                </th>
              ))}
            </tr>
          </thead>
        ) : null}
        <tbody>
          {daten.zeilen.map((z, zi) => (
            <tr key={zi} className="border-b border-line last:border-0">
              {z.map((c, ci) => (
                <td
                  key={ci}
                  className={cx(
                    'px-2 py-1.5',
                    ci === 0 ? 'text-left' : 'text-right whitespace-nowrap',
                  )}
                >
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
