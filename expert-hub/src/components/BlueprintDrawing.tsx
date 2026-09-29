/**
 * Decorative elevation drawing of a three-bay, three-storey frame with grid
 * axes, dimension lines and an I-section detail. Lines draw in sequence on
 * load (.draw); reduced-motion users get the finished drawing.
 * Axis labels are drawing annotations only — no data.
 */
export function BlueprintDrawing({ className }: { className?: string }) {
  const bays = [60, 180, 300, 420];
  const levels = [300, 220, 140, 60];
  const line = { stroke: 'var(--line)', strokeWidth: 1.5, fill: 'none', pathLength: 1 };
  const thin = { ...line, strokeWidth: 0.75, opacity: 0.55 };
  const d = (i: number) => ({ ['--delay' as string]: `${0.15 * i}s` }) as React.CSSProperties;

  return (
    <svg
      viewBox="0 0 550 380"
      className={`draw ${className ?? ''}`}
      role="img"
      aria-label="Blueprint drawing of a building frame"
      style={{ direction: 'ltr' }}
    >
      {/* grid axes */}
      {bays.map((x, i) => (
        <g key={`ax-${x}`}>
          <line x1={x} y1={30} x2={x} y2={335} {...thin} pathLength={undefined} style={{ ...d(i), strokeDasharray: '6 4', animation: 'none' }} />
          <circle cx={x} cy={352} r={11} {...thin} opacity={0.8} style={d(i + 1)} />
          <text x={x} y={356} textAnchor="middle" className="mono" fontSize="11" fill="var(--text-muted)">
            {String.fromCharCode(65 + i)}
          </text>
        </g>
      ))}

      {/* ground */}
      <line x1={30} y1={300} x2={450} y2={300} {...line} strokeWidth={2} style={d(2)} />
      {Array.from({ length: 14 }, (_, i) => (
        <line key={`h-${i}`} x1={40 + i * 30} y1={300} x2={30 + i * 30} y2={310} {...thin} style={d(3)} />
      ))}

      {/* columns */}
      {bays.map((x, i) => (
        <line key={`c-${x}`} x1={x} y1={300} x2={x} y2={60} {...line} strokeWidth={2.5} style={d(4 + i * 0.5)} />
      ))}
      {/* beams */}
      {levels.slice(1).map((y, i) => (
        <line key={`b-${y}`} x1={60} y1={y} x2={420} y2={y} {...line} strokeWidth={2.5} style={d(6 + i * 0.5)} />
      ))}
      {/* bracing in the middle bay */}
      <polyline points="180,300 300,220 180,140 300,60" {...line} strokeWidth={1.25} style={d(8)} />

      {/* level marks */}
      {levels.map((y, i) => (
        <g key={`lv-${y}`}>
          <polyline points={`432,${y} 440,${y - 7} 448,${y}`} {...thin} opacity={0.9} style={d(9 + i * 0.3)} />
          <text x={454} y={y + 4} className="mono" fontSize="10" fill="var(--text-muted)">
            {i === 0 ? '±0.00' : `L${i}`}
          </text>
        </g>
      ))}

      {/* dimension line */}
      <line x1={60} y1={22} x2={420} y2={22} {...thin} opacity={0.9} style={d(10)} />
      {bays.map((x) => (
        <line key={`t-${x}`} x1={x - 4} y1={26} x2={x + 4} y2={18} {...thin} opacity={0.9} style={d(10)} />
      ))}

      {/* I-section detail */}
      <g transform="translate(490 110)">
        <rect x={-8} y={-10} width={52} height={96} rx={2} {...thin} pathLength={undefined} style={{ ...d(11), strokeDasharray: '3 3', animation: 'none' }} />
        <path d="M2 0h32M2 76h32M18 0v76" stroke="var(--accent)" strokeWidth={3} fill="none" pathLength={1} style={d(12)} />
        <text x={18} y={104} textAnchor="middle" className="mono" fontSize="9" fill="var(--text-muted)">
          DET-1
        </text>
      </g>
    </svg>
  );
}
