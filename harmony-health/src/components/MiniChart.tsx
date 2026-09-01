import { useMemo } from 'react'

export interface LinePoint {
  label: string
  value: number
  secondary?: number
}

interface Props {
  data: LinePoint[]
  height?: number
  color?: string
  secondaryColor?: string
  showGrid?: boolean
  showAxis?: boolean
  referenceLine?: { value: number; label?: string; color?: string }
  padding?: { top: number; right: number; bottom: number; left: number }
}

// A tiny, dependency-free line chart tuned for the two places the app uses
// one: the dashboard 14-day preview and the weight-tracker main chart.
// Draws value + optional secondary line, optional gridlines and Y-axis
// labels, and an optional reference line (goal weight).
export function MiniChart({
  data,
  height = 200,
  color = '#C9A961',
  secondaryColor = '#7B9E89',
  showGrid = false,
  showAxis = false,
  referenceLine,
  padding = { top: 12, right: 12, bottom: 24, left: showAxis ? 34 : 12 },
}: Props) {
  const width = 800 // viewBox width — the SVG scales via preserveAspectRatio.

  const bounds = useMemo(() => {
    const values = data.flatMap(d => [d.value, ...(d.secondary != null ? [d.secondary] : [])])
    if (referenceLine) values.push(referenceLine.value)
    const raw = values.length ? values : [0, 1]
    const min = Math.min(...raw)
    const max = Math.max(...raw)
    const range = Math.max(max - min, 0.5)
    return {
      min: min - range * 0.1,
      max: max + range * 0.1,
    }
  }, [data, referenceLine])

  const chartW = width - padding.left - padding.right
  const chartH = height - padding.top - padding.bottom

  function x(i: number) {
    if (data.length <= 1) return padding.left + chartW / 2
    return padding.left + (i / (data.length - 1)) * chartW
  }
  function y(v: number) {
    const t = (v - bounds.min) / (bounds.max - bounds.min)
    return padding.top + (1 - t) * chartH
  }

  const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(d.value).toFixed(1)}`).join(' ')
  const areaPath = `${linePath} L ${x(data.length - 1).toFixed(1)} ${padding.top + chartH} L ${x(0).toFixed(1)} ${padding.top + chartH} Z`
  const hasSecondary = data.some(d => d.secondary != null)
  const secondaryPath = hasSecondary
    ? data
        .filter(d => d.secondary != null)
        .map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(data.indexOf(d)).toFixed(1)} ${y(d.secondary!).toFixed(1)}`)
        .join(' ')
    : ''

  const gridLines = useMemo(() => {
    if (!showGrid) return []
    const count = 4
    return Array.from({ length: count + 1 }, (_, i) => {
      const v = bounds.min + (bounds.max - bounds.min) * (i / count)
      return { v, y: y(v) }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showGrid, bounds])

  const idSuffix = useMemo(() => Math.random().toString(36).slice(2, 8), [])

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      style={{ width: '100%', height, display: 'block' }}
    >
      <defs>
        <linearGradient id={`grad-${idSuffix}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {showGrid && gridLines.map((g, i) => (
        <g key={i}>
          <line
            x1={padding.left}
            x2={width - padding.right}
            y1={g.y}
            y2={g.y}
            stroke="rgba(11,31,58,0.06)"
            strokeDasharray="3 3"
          />
          {showAxis && (
            <text x={padding.left - 6} y={g.y + 4} textAnchor="end" fontSize="10" fill="#8B95A5">
              {g.v.toFixed(1)}
            </text>
          )}
        </g>
      ))}

      {referenceLine && (
        <g>
          <line
            x1={padding.left}
            x2={width - padding.right}
            y1={y(referenceLine.value)}
            y2={y(referenceLine.value)}
            stroke={referenceLine.color ?? '#C9A961'}
            strokeDasharray="4 4"
            strokeWidth="1.5"
          />
          {referenceLine.label && (
            <text
              x={padding.left + 6}
              y={y(referenceLine.value) - 6}
              fontSize="10"
              fill={referenceLine.color ?? '#A88A45'}
              fontWeight="600"
            >
              {referenceLine.label}
            </text>
          )}
        </g>
      )}

      {data.length > 1 && (
        <>
          <path d={areaPath} fill={`url(#grad-${idSuffix})`} />
          <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {hasSecondary && (
            <path d={secondaryPath} fill="none" stroke={secondaryColor} strokeWidth="2" strokeDasharray="5 5" strokeLinecap="round" />
          )}
        </>
      )}

      {data.map((d, i) => (
        <circle key={i} cx={x(i)} cy={y(d.value)} r="4" fill={color}>
          <title>{`${d.label}: ${d.value}`}</title>
        </circle>
      ))}

      {/* X-axis labels — sparse to avoid crowding */}
      {showAxis && data.map((d, i) => {
        const step = Math.max(1, Math.floor(data.length / 6))
        if (i % step !== 0 && i !== data.length - 1) return null
        return (
          <text key={i} x={x(i)} y={height - 6} textAnchor="middle" fontSize="10" fill="#8B95A5">
            {d.label}
          </text>
        )
      })}
    </svg>
  )
}
