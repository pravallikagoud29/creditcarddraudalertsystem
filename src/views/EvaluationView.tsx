// ============================================================================
// Evaluation view — model performance metrics, ROC/PRC curves, confusion matrix
// ============================================================================

import {
  BarChart3,
  Target,
  TrendingUp,
  Activity,
  Gauge,
  ArrowRight,
} from 'lucide-react';
import { useAppState } from '@/store/AppState';
import { Card, CardHeader, Badge, StatCard } from '@/components/ui';
import { ConfusionMatrixChart } from '@/components/charts/ConfusionMatrixChart';
import { LineChart } from '@/components/charts/LineChart';
import { formatPercent, formatNumber } from '@/ml/stats';

export function EvaluationView() {
  const { model, setCurrentView } = useAppState();

  if (!model) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h2 className="text-xl font-bold text-ink-100 mb-1">Model Evaluation</h2>
          <p className="text-sm text-ink-500">
            Assess model performance with confusion matrix, ROC curve, and precision-recall analysis.
          </p>
        </div>
        <Card className="p-12 text-center">
          <BarChart3 className="w-12 h-12 text-ink-700 mx-auto mb-3" />
          <p className="text-ink-400 mb-4">No trained model available</p>
          <button onClick={() => setCurrentView('training')} className="btn-primary">
            Go to Training →
          </button>
        </Card>
      </div>
    );
  }

  const { metrics } = model;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-ink-100 mb-1">Model Evaluation</h2>
        <p className="text-sm text-ink-500">
          Comprehensive performance analysis of the trained logistic regression model.
        </p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="Accuracy" value={formatPercent(metrics.accuracy, 1)} icon={<Target size={16} />} color="success" />
        <StatCard label="Precision" value={formatPercent(metrics.precision, 1)} icon={<Gauge size={16} />} color="primary" />
        <StatCard label="Recall" value={formatPercent(metrics.recall, 1)} icon={<Activity size={16} />} color="warning" />
        <StatCard label="F1 Score" value={formatPercent(metrics.f1Score, 1)} icon={<TrendingUp size={16} />} color="accent" />
        <StatCard label="Specificity" value={formatPercent(metrics.specificity, 1)} icon={<Target size={16} />} color="primary" />
        <StatCard label="AUC-ROC" value={formatPercent(metrics.auc, 1)} icon={<Gauge size={16} />} color="success" />
      </div>

      {/* Confusion matrix + ROC curve */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader
            title="Confusion Matrix"
            subtitle={`Decision threshold: ${metrics.threshold.toFixed(2)}`}
            icon={<BarChart3 size={18} />}
          />
          <div className="p-5 pt-4">
            <ConfusionMatrixChart matrix={metrics.confusionMatrix} />
          </div>
        </Card>

        <Card>
          <CardHeader
            title="ROC Curve"
            subtitle={`AUC = ${formatNumber(metrics.auc, 4)}`}
            icon={<TrendingUp size={18} />}
          />
          <div className="p-5 pt-4">
            <LineChart
              series={[
                {
                  name: 'ROC',
                  color: '#3b82f6',
                  points: model.rocCurve.map((p) => ({ x: p.fpr, y: p.tpr })),
                },
                {
                  name: 'Random',
                  color: '#475569',
                  points: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
                },
              ]}
              xLabel="False Positive Rate"
              yLabel="True Positive Rate"
              xFormat={(v) => v.toFixed(2)}
              yFormat={(v) => v.toFixed(2)}
              height={260}
              fillArea
            />
          </div>
        </Card>
      </div>

      {/* PRC curve + additional metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader
            title="Precision-Recall Curve"
            subtitle="Performance across all thresholds"
            icon={<TrendingUp size={18} />}
          />
          <div className="p-5 pt-4">
            <LineChart
              series={[
                {
                  name: 'PRC',
                  color: '#f97316',
                  points: model.prcCurve.map((p) => ({ x: p.recall, y: p.precision })),
                },
              ]}
              xLabel="Recall"
              yLabel="Precision"
              xFormat={(v) => v.toFixed(2)}
              yFormat={(v) => v.toFixed(2)}
              height={260}
              showLegend={false}
              fillArea
            />
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Detailed Metrics"
            subtitle="Full evaluation breakdown"
            icon={<Gauge size={18} />}
          />
          <div className="p-5 pt-4 space-y-3">
            <MetricRow label="True Positives (TP)" value={metrics.confusionMatrix.truePositives} color="text-primary-400" />
            <MetricRow label="True Negatives (TN)" value={metrics.confusionMatrix.trueNegatives} color="text-success-400" />
            <MetricRow label="False Positives (FP)" value={metrics.confusionMatrix.falsePositives} color="text-warning-400" />
            <MetricRow label="False Negatives (FN)" value={metrics.confusionMatrix.falseNegatives} color="text-danger-400" />
            <div className="pt-2 border-t border-ink-800 space-y-3">
              <MetricRow label="False Positive Rate" value={formatPercent(metrics.falsePositiveRate, 2)} color="text-warning-400" />
              <MetricRow label="Decision Threshold" value={metrics.threshold.toFixed(2)} color="text-ink-200" />
              <MetricRow label="Model Type" value={model.config.modelType === 'logistic_balanced' ? 'Logistic (Balanced)' : 'Logistic'} color="text-ink-200" />
              <MetricRow label="Training Iterations" value={model.config.iterations} color="text-ink-200" />
              <MetricRow label="Learning Rate" value={model.config.learningRate} color="text-ink-200" />
            </div>
          </div>
        </Card>
      </div>

      <div className="flex justify-end">
        <button onClick={() => setCurrentView('prediction')} className="btn-primary">
          Start Predicting <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

function MetricRow({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-ink-400">{label}</span>
      <span className={`text-sm font-semibold tabular-nums ${color}`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </span>
    </div>
  );
}
