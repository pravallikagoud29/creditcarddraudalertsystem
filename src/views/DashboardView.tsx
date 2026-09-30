// ============================================================================
// Dashboard view — overview of the entire ML pipeline
// ============================================================================

import {
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  Database as DatabaseIcon,
  Brain,
  Target,
  ArrowRight,
  Activity,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import { useAppState } from '@/store/AppState';
import { Card, CardHeader, StatCard, Badge } from '@/components/ui';
import { formatPercent, formatNumber } from '@/ml/stats';

export function DashboardView() {
  const { rawData, datasetInfo, model, alerts, setCurrentView } = useAppState();

  const pipelineSteps = [
    { id: 'dataset', label: 'Load Dataset', done: rawData.length > 0 },
    { id: 'preprocessing', label: 'Preprocess Data', done: rawData.length > 0 },
    { id: 'training', label: 'Train Model', done: model !== null },
    { id: 'evaluation', label: 'Evaluate Model', done: model !== null },
    { id: 'prediction', label: 'Run Predictions', done: model !== null },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-ink-900 via-ink-900 to-primary-950/40 border border-ink-800 p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="info">ML-Powered</Badge>
            <Badge variant="success">Logistic Regression</Badge>
          </div>
          <h1 className="text-3xl font-bold text-ink-100 mb-2">
            Credit Card Fraud Detection
          </h1>
          <p className="text-ink-400 max-w-2xl">
            A machine learning system that analyzes transaction patterns to detect
            potentially fraudulent credit card activity. Train a logistic regression
            model on synthetic transaction data and use it to score new transactions in real time.
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Transactions"
          value={rawData.length > 0 ? rawData.length.toLocaleString() : '—'}
          icon={<DatabaseIcon size={16} />}
          color="primary"
        />
        <StatCard
          label="Fraud Rate"
          value={datasetInfo ? formatPercent(datasetInfo.fraudRate) : '—'}
          icon={<AlertTriangle size={16} />}
          color="danger"
        />
        <StatCard
          label="Model Accuracy"
          value={model ? formatPercent(model.metrics.accuracy, 1) : '—'}
          icon={<Target size={16} />}
          color="success"
        />
        <StatCard
          label="Active Alerts"
          value={alerts.length}
          icon={<Activity size={16} />}
          color="warning"
        />
      </div>

      {/* Pipeline + Model summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Pipeline */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="ML Pipeline"
            subtitle="Track each step of the fraud detection workflow"
            icon={<Brain size={18} />}
          />
          <div className="p-5 pt-4">
            <div className="flex items-center gap-2 flex-wrap">
              {pipelineSteps.map((step, i) => (
                <div key={step.id} className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentView(step.id as never)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 ${
                      step.done
                        ? 'bg-success-500/10 border-success-500/30 text-success-300 hover:bg-success-500/15'
                        : 'bg-ink-800 border-ink-700 text-ink-500 hover:border-ink-600'
                    }`}
                  >
                    {step.done ? (
                      <CheckCircle2 size={14} />
                    ) : (
                      <Circle size={14} />
                    )}
                    <span className="text-xs font-medium">{step.label}</span>
                  </button>
                  {i < pipelineSteps.length - 1 && (
                    <ArrowRight size={14} className="text-ink-600" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Model health */}
        <Card>
          <CardHeader
            title="Model Health"
            subtitle={model ? `Trained ${new Date(model.trainedAt).toLocaleDateString()}` : 'No model yet'}
            icon={<ShieldCheck size={18} />}
          />
          <div className="p-5 pt-4 space-y-3">
            {model ? (
              <>
                <HealthRow label="Precision" value={model.metrics.precision} />
                <HealthRow label="Recall" value={model.metrics.recall} />
                <HealthRow label="F1 Score" value={model.metrics.f1Score} />
                <HealthRow label="AUC-ROC" value={model.metrics.auc} />
                <div className="pt-2 border-t border-ink-800">
                  <button
                    onClick={() => setCurrentView('evaluation')}
                    className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1"
                  >
                    View full evaluation <ArrowRight size={12} />
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <Brain className="w-10 h-10 text-ink-700 mx-auto mb-2" />
                <p className="text-sm text-ink-500 mb-3">
                  No model trained yet
                </p>
                <button
                  onClick={() => setCurrentView('training')}
                  className="text-xs text-primary-400 hover:text-primary-300"
                >
                  Go to Training →
                </button>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Quick start guide */}
      {rawData.length === 0 && (
        <Card className="p-6">
          <h3 className="text-sm font-semibold text-ink-100 mb-4">
            Quick Start Guide
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <QuickStartStep
              num={1}
              title="Generate Dataset"
              desc="Create a synthetic credit card transaction dataset with configurable size and fraud rate."
              action={() => setCurrentView('dataset')}
            />
            <QuickStartStep
              num={2}
              title="Train Model"
              desc="Train a logistic regression classifier with gradient descent on the preprocessed data."
              action={() => setCurrentView('training')}
            />
            <QuickStartStep
              num={3}
              title="Detect Fraud"
              desc="Enter transaction details and get a real-time fraud probability score from the trained model."
              action={() => setCurrentView('prediction')}
            />
          </div>
        </Card>
      )}
    </div>
  );
}

function HealthRow({ label, value }: { label: string; value: number }) {
  const pct = (value * 100).toFixed(1);
  const color = value >= 0.8 ? 'text-success-400' : value >= 0.5 ? 'text-warning-400' : 'text-danger-400';
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-ink-400">{label}</span>
      <span className={`text-sm font-semibold tabular-nums ${color}`}>{pct}%</span>
    </div>
  );
}

function QuickStartStep({
  num,
  title,
  desc,
  action,
}: {
  num: number;
  title: string;
  desc: string;
  action: () => void;
}) {
  return (
    <button
      onClick={action}
      className="text-left p-4 rounded-lg bg-ink-800/50 border border-ink-700 hover:border-primary-500/50 hover:bg-ink-800 transition-all duration-200 group"
    >
      <div className="w-7 h-7 rounded-full bg-primary-600/20 text-primary-400 flex items-center justify-center text-sm font-bold mb-2">
        {num}
      </div>
      <h4 className="text-sm font-medium text-ink-100 mb-1 group-hover:text-primary-300">
        {title}
      </h4>
      <p className="text-xs text-ink-500">{desc}</p>
    </button>
  );
}
