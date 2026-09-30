// ============================================================================
// Histogram — distribution of Amount values
// ============================================================================

interface HistogramProps {
  values: number[];
  bins?: number;
  color?: string;
  height?: number;
}

export function Histogram({
  values,
  bins = 20,
  color = '#3b82f6',
  height = 160,
}: HistogramProps) {
  if (values.length === 0) {
    return (
      <div className="flex items-center justify-center text-ink-500 text-sm" style={{ height }}>
        No data
      </div>
    );
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const binWidth = range / bins;

  const counts = new Array(bins).fill(0);
  for (const v of values) {
    let idx = Math.floor((v - min) / binWidth);
    if (idx >= bins) idx = bins - 1;
    if (idx < 0) idx = 0;
    counts[idx]++;
  }

  const maxCount = Math.max(...counts);

  return (
    <div className="flex items-end gap-0.5" style={{ height }}>
      {counts.map((count, i) => (
        <div
          key={i}
          className="flex-1 rounded-t-sm transition-all duration-300"
          style={{
            height: `${(count / maxCount) * 100}%`,
            backgroundColor: color,
            minHeight: count > 0 ? 2 : 0,
            opacity: 0.4 + (count / maxCount) * 0.6,
          }}
          title={`${(min + i * binWidth).toFixed(2)} - ${(min + (i + 1) * binWidth).toFixed(2)}: ${count} transactions`}
        />
      ))}
    </div>
  );
}
