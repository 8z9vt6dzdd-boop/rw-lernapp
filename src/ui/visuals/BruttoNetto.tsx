// Brutto-Netto-Balken: Rechnungsbetrag aus Netto und Steuer; optional der Skonto-Anteil, ebenfalls zerlegt.
import { Decimal, formatEuro, formatProzent, round } from '../../engine/money';

export function BruttoNetto({
  brutto,
  ustSatz = '0.19',
  skontoSatz,
}: {
  brutto: string;
  ustSatz?: string;
  skontoSatz?: string;
}) {
  const b = new Decimal(brutto);
  const netto = round(b.div(new Decimal(1).plus(ustSatz)));
  const steuer = b.minus(netto);
  const skBrutto = skontoSatz ? round(b.times(skontoSatz)) : null;
  const skNetto = skBrutto ? round(skBrutto.div(new Decimal(1).plus(ustSatz))) : null;
  const skSteuer = skBrutto && skNetto ? skBrutto.minus(skNetto) : null;
  const pct = (x: InstanceType<typeof Decimal>) => `${x.div(b).times(100).toFixed(2)}%`;
  return (
    <figure
      className="w-full"
      aria-label={`Rechnung ${formatEuro(b)}: netto ${formatEuro(netto)}, Steuer ${formatEuro(steuer)}`}
    >
      <div className="mb-1 flex justify-between text-xs text-muted">
        <span>Rechnungsbetrag (brutto)</span>
        <span className="num font-semibold text-ink">{formatEuro(b)}</span>
      </div>
      <div className="flex h-10 w-full overflow-hidden rounded-md border-2 border-[color:var(--peep-ink)]">
        <div
          className="flex items-center justify-center bg-[#1c6670] text-xs font-medium text-white transition-all duration-500"
          style={{ width: pct(netto) }}
        >
          netto
        </div>
        <div
          className="flex items-center justify-center bg-[#e8792b] text-xs font-medium text-white transition-all duration-500"
          style={{ width: pct(steuer) }}
        >
          {formatProzent(ustSatz, 0)}
        </div>
      </div>
      <div className="num mt-1 flex justify-between text-xs">
        <span>Netto {formatEuro(netto)}</span>
        <span>USt {formatEuro(steuer)}</span>
      </div>
      {skBrutto && skNetto && skSteuer ? (
        <div className="einblenden mt-4 rounded-lg border border-line bg-surface-2 p-3">
          <div className="mb-1 flex justify-between text-xs text-muted">
            <span>Darin: Skonto {formatProzent(skontoSatz!)} vom Bruttobetrag</span>
            <span className="num font-semibold text-ink">{formatEuro(skBrutto)}</span>
          </div>
          <div className="flex h-8 w-full overflow-hidden rounded-md border-2 border-[color:var(--peep-ink)]">
            <div
              className="flex items-center justify-center bg-[#1c6670] text-[11px] text-white"
              style={{ width: `${skNetto.div(skBrutto).times(100).toFixed(2)}%` }}
            >
              netto
            </div>
            <div
              className="flex items-center justify-center bg-[#e8792b] text-[11px] text-white"
              style={{ width: `${skSteuer.div(skBrutto).times(100).toFixed(2)}%` }}
            >
              Steuer
            </div>
          </div>
          <div className="num mt-1 flex justify-between text-xs">
            <span>Skonto netto {formatEuro(skNetto)}</span>
            <span>Steueranteil {formatEuro(skSteuer)}</span>
          </div>
        </div>
      ) : null}
    </figure>
  );
}
