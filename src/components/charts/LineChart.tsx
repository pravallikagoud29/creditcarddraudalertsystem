// ============================================================================
// Line chart — training loss / accuracy over iterations, or ROC/PRC curves
// ============================================================================

interface LineChartProps {
  series: {
    name: string;
    color: string;
    points: { x: number; y: number }[];
  }[];
  width?: number;
  height?: number;
  xLabel?: string;
  yLabel?: string;
  xFormat?: (v: number) => string;
  yFormat?: (v: number) => string;
  showLegend?: boolean;
  fillArea?: boolean;
}

export function LineChart({
  series,
  width = 500,
  height = 240,
  xLabel,
  yLabel,
  xFormat = (v) => v.toFixed(0),
  yFormat = (v) => v.toFixed(2),
  showLegend = true,
  fillArea = false,
}: LineChartProps) {
  const padding = { top: 16, right: 16, bottom: 32, left: 48 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  const allPoints = series.flatMap((s) => s.points);
  if (allPoints.length === 0) {
    return (
      <div className="flex items-center justify-center text-ink-500 text-sm" style={{ height }}>
        No data
      </div>
    );
  }

  const xMin = Math.min(...allPoints.map((p) => p.x));
  const xMax = Math.max(...allPoints.map((p) => p.x));
  const yMin = Math.min(...allPoints.map((p) => p.y));
  const yMax = Math.max(...allPoints.map((p) => p.y));

  const xRange = xMax - xMin || 1;
  const yRange = yMax - yMin || 1;

  const toX = (x: number) => padding.left + ((x - xMin) / xRange) * plotW;
  const toY = (y: number) => padding.top + plotH - ((y - yMin) / yRange) * plotH;

  // Grid lines
  const gridY = [0, 0.25, 0.5, 0.75, 1].map((f) => yMin + f * yRange);

  return (
    <div className="w-full">
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        {/* Grid */}
        {gridY.map((gy, i) => (
          <g key={i}>
            <line
              x1={padding.left}
              y1={toY(gy)}
              x2={padding.left + plotW}
              y2={toY(gy)}
              stroke="#1e293b"
              strokeWidth={1}
              strokeDasharray="2 4"
            />
            <text
              x={padding.left - 8}
              y={toY(gy) + 4}
              textAnchor="end"
              className="fill-ink-500 text-[10px]"
            >
              {yFormat(gy)}
            </text>
          </g>
        ))}

        {/* X axis label */}
        {xLabel && (
          <text
            x={padding.left + plotW / 2}
            y={height - 4}
            textAnchor="middle"
            className="fill-ink-500 text-[10px]"
          >
            {xLabel}
          </text>
        )}

        {/* Y axis label */}
        {yLabel && (
          <text
            x={-(padding.top + plotH / 2)}
            y={12}
            textAnchor="middle"
            transform="rotate(-90)"
            className="fill-ink-500 text-[10px]"
          >
            {yLabel}
          </text>
        )}

        {/* Series */}
        {series.map((s, si) => {
          const path = s.points
            .map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(p.x)} ${toY(p.y)}`)
            .join(' ');

          const areaPath =
            fillArea && s.points.length > 0
              ? `${path} L ${toX(s.points[s.points.length - 1].x)} ${toY(yMin)} L ${toX(s.points[0].x)} ${toY(yMin)} Z`
              : '';

          return (
            <g key={si}>
              {fillArea && areaPath && (
                <path
                  d={areaPath}
                  fill={s.color}
                  fillOpacity={0.12}
                />
              )}
              <path
                d={path}
                fill="none"
                stroke={s.color}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </g>
          );
        })}
      </svg>

      {showLegend && series.length > 1 && (
        <div className="flex flex-wrap gap-3 mt-2 justify-center">
          {series.map((s, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs">
              <span
                className="w-3 h-0.5 rounded"
                style={{ backgroundColor: s.color }}
              />
              <span className="text-ink-400">{s.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
