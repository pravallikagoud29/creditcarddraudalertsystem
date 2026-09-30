// ============================================================================
// Bar chart — horizontal or vertical bars with labels
// ============================================================================

interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  height?: number;
  horizontal?: boolean;
  showValues?: boolean;
  formatValue?: (v: number) => string;
}

export function BarChart({
  data,
  height = 200,
  horizontal = false,
  showValues = true,
  formatValue = (v) => v.toFixed(2),
}: BarChartProps) {
  const maxVal = Math.max(...data.map((d) => Math.abs(d.value)), 0.001);

  if (horizontal) {
    return (
      <div className="flex flex-col gap-2">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-xs text-ink-400 w-16 text-right shrink-0">
              {d.label}
            </span>
            <div className="flex-1 bg-ink-800 rounded-sm overflow-hidden h-6 relative">
              <div
                className="h-full rounded-sm transition-all duration-500 flex items-center justify-end px-2"
                style={{
                  width: `${(Math.abs(d.value) / maxVal) * 100}%`,
                  backgroundColor: d.color || '#3b82f6',
                  minWidth: showValues ? '3rem' : 0,
                }}
              >
                {showValues && (
                  <span className="text-xs text-white font-medium tabular-nums">
                    {formatValue(d.value)}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          {showValues && (
            <span className="text-xs text-ink-300 font-medium tabular-nums">
              {formatValue(d.value)}
            </span>
          )}
          <div className="w-full flex-1 flex items-end">
            <div
              className="w-full rounded-t-md transition-all duration-500"
              style={{
                height: `${(Math.abs(d.value) / maxVal) * 100}%`,
                backgroundColor: d.color || '#3b82f6',
                minHeight: 2,
              }}
            />
          </div>
          <span className="text-xs text-ink-400 truncate" title={d.label}>
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
}
