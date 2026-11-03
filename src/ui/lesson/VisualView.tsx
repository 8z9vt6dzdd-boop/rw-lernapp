// Rendert einen Visualisierungs-Baustein aus den Lektionsdaten.
import type { Visual } from '../../content/lessons/types';
import { Character } from '../figures/Character';
import { Beleg } from '../visuals/Beleg';
import { BruttoNetto } from '../visuals/BruttoNetto';
import { Lager } from '../visuals/Lager';
import { Schauplatz } from '../visuals/Schauplatz';
import { TKonto } from '../visuals/TKonto';
import { Waage } from '../visuals/Waage';
import { AfaVerlauf, Kostenfunktion, Kostenstellen, Kreislauf, Treppe } from '../visuals/Diagramme';

export function VisualView({ v }: { v: Visual }) {
  switch (v.typ) {
    case 'waage':
      return <Waage {...v} />;
    case 'tkonto':
      return (
        <div className="flex justify-center">
          <TKonto {...v} />
        </div>
      );
    case 'tkonten':
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          {v.konten.map((k) => (
            <TKonto key={k.name} {...k} kompakt />
          ))}
        </div>
      );
    case 'brutto-netto':
      return <BruttoNetto {...v} />;
    case 'beleg':
      return (
        <div className="flex justify-center py-1">
          <Beleg {...v} />
        </div>
      );
    case 'lager':
      return <Lager {...v} />;
    case 'karten':
      return (
        <div className="grid gap-2 sm:grid-cols-3">
          {v.karten.map((k, i) => (
            <div
              key={k.titel}
              className="einblenden rounded-xl border-2 border-[color:var(--peep-ink)] bg-[color:var(--peep-paper)] p-3 text-[color:var(--peep-ink)]"
              style={{ animationDelay: `${i * 120}ms`, borderTopColor: k.farbe, borderTopWidth: 6 }}
            >
              <div className="hand font-bold">{k.titel}</div>
              <p className="mt-1 text-sm">{k.text}</p>
            </div>
          ))}
        </div>
      );
    case 'szene':
      return (
        <Schauplatz ort={v.ort}>
          {v.figuren.map((f, i) => (
            <Character
              key={f.figur}
              id={f.figur}
              ausdruck={f.ausdruck}
              groesse={92}
              gespiegelt={i % 2 === 1}
              hintergrund={false}
            />
          ))}
        </Schauplatz>
      );
    case 'kreislauf':
      return <Kreislauf aktiv={v.aktiv} />;
    case 'kostenstellen':
      return <Kostenstellen hilfs={v.hilfs} haupt={v.haupt} pfeile={v.pfeile} />;
    case 'treppe':
      return <Treppe stufen={v.stufen} />;
    case 'afa-verlauf':
      return <AfaVerlauf basis={v.basis} restwert={v.restwert} nd={v.nd} verfahren={v.verfahren} satz={v.satz} />;
    case 'kostenfunktion':
      return <Kostenfunktion preis={v.preis} kv={v.kv} kf={v.kf} xmax={v.xmax} einheit={v.einheit} />;
  }
}
