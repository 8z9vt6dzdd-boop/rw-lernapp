// QR-Code als SVG. Immer dunkel auf hell (auch im Dark Mode), damit jede Kamera ihn erkennt.
import { useMemo } from 'react';
import { qrMatrix, qrSvgPfad } from '../../util/qr';

export function QrCode({
  text,
  label,
  className,
}: {
  text: string;
  label: string;
  className?: string;
}) {
  const { pfad, groesse } = useMemo(() => qrSvgPfad(qrMatrix(text)), [text]);
  return (
    <svg
      viewBox={`0 0 ${groesse} ${groesse}`}
      role="img"
      aria-label={label}
      shapeRendering="crispEdges"
      className={className}
    >
      <rect width={groesse} height={groesse} fill="#ffffff" />
      <path d={pfad} fill="#000000" />
    </svg>
  );
}
