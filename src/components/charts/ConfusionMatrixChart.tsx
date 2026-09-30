// ============================================================================
// Confusion matrix visualization — 2x2 grid showing TP, FP, TN, FN
// ============================================================================

import { ConfusionMatrix as CM } from '@/ml/types';

interface ConfusionMatrixChartProps {
  matrix: CM;
}

export function ConfusionMatrixChart({ matrix }: ConfusionMatrixChartProps) {
  const { truePositives: tp, falsePositives: fp, trueNegatives: tn, falseNegatives: fn } = matrix;
  const total = tp + fp + tn + fn || 1;

  const cells = [
    { label: 'True Negative', value: tn, sub: 'Predicted Normal · Actual Normal', color: 'bg-success-600', text: 'text-success-300' },
    { label: 'False Positive', value: fp, sub: 'Predicted Fraud · Actual Normal', color: 'bg-warning-600', text: 'text-warning-300' },
    { label: 'False Negative', value: fn, sub: 'Predicted Normal · Actual Fraud', color: 'bg-danger-600', text: 'text-danger-300' },
    { label: 'True Positive', value: tp, sub: 'Predicted Fraud · Actual Fraud', color: 'bg-primary-600', text: 'text-primary-300' },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {cells.map((cell, i) => {
          const pct = (cell.value / total) * 100;
          return (
            <div
              key={i}
              className="relative rounded-lg border border-ink-700 p-4 overflow-hidden"
            >
              <div
                className={`absolute inset-0 ${cell.color} opacity-15`}
              />
              <div className="relative">
                <div className="text-3xl font-bold tabular-nums text-ink-100">
                  {cell.value.toLocaleString()}
                </div>
                <div className={`text-xs font-medium mt-1 ${cell.text}`}>
                  {cell.label}
                </div>
                <div className="text-[10px] text-ink-500 mt-0.5">
                  {cell.sub}
                </div>
                <div className="text-[10px] text-ink-400 mt-1 tabular-nums">
                  {pct.toFixed(1)}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between text-xs text-ink-500">
        <span>Total: {total.toLocaleString()} predictions</span>
        <span>Correct: {((tp + tn) / total * 100).toFixed(1)}%</span>
      </div>
    </div>
  );
}
