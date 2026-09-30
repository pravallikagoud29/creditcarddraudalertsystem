// ============================================================================
// Donut chart — shows class distribution (fraud vs normal)
// ============================================================================

interface DonutChartProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
}

export function DonutChart({
  data,
  size = 160,
  thickness = 28,
  centerLabel,
  centerValue,
}: DonutChartProps) {
  const total = data.reduce((a, b) => a + b.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let offset = 0;
  const segments = data.map((d) => {
    const fraction = total > 0 ? d.value / total : 0;
    const length = fraction * circumference;
    const seg = {
      ...d,
      dashArray: `${length} ${circumference - length}`,
      dashOffset: -offset,
    };
    offset += length;
    return seg;
  });

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={thickness}
          className="text-ink-800"
        />
        {total > 0 &&
          segments.map((seg, i) => (
            <circle
              key={i}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={thickness}
              strokeDasharray={seg.dashArray}
              strokeDashoffset={seg.dashOffset}
              strokeLinecap="butt"
              className="transition-all duration-700"
            />
          ))}
      </svg>
      {(centerLabel || centerValue) && (
        <div className="text-center -mt-[calc(100%+20px)] mb-[calc(100%-20px)] pointer-events-none flex flex-col items-center justify-center" style={{ height: 0 }}>
          {centerValue && (
            <span className="text-2xl font-bold text-ink-100">{centerValue}</span>
          )}
          {centerLabel && (
            <span className="text-xs text-ink-500 mt-0.5">{centerLabel}</span>
          )}
        </div>
      )}
      <div className="flex flex-col gap-1.5 mt-1">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span
              className="w-2.5 h-2.5 rounded-sm"
              style={{ backgroundColor: d.color }}
            />
            <span className="text-ink-400">{d.label}</span>
            <span className="text-ink-200 font-medium tabular-nums">
              {d.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
