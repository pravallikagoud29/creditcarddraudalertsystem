// ============================================================================
// Training view — configure and train the logistic regression model
// ============================================================================

import {
  Brain,
  Play,
  Trash2,
  TrendingUp,
  Activity,
  Target,
  Zap,
} from 'lucide-react';
import { useAppState } from '@/store/AppState';
import { Card, CardHeader, Badge, Spinner, ProgressBar } from '@/components/ui';
import { LineChart } from '@/components/charts/LineChart';
import { formatPercent } from '@/ml/stats';

export function TrainingView() {
  const {
    rawData,
    model,
    isTraining,
    trainingProgress,
    trainingConfig,
    setTrainingConfig,
    train,
    clearTrainedModel,
    setCurrentView,
  } = useAppState();

  const history = model?.trainingHistory || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-ink-100 mb-1">Model Training</h2>
        <p className="text-sm text-ink-500">
          Train a logistic regression classifier using gradient descent on the preprocessed dataset.
        </p>
      </div>

      {rawData.length === 0 ? (
        <Card className="p-12 text-center">
          <Brain className="w-12 h-12 text-ink-700 mx-auto mb-3" />
          <p className="text-ink-400 mb-4">No dataset loaded yet</p>
          <button onClick={() => setCurrentView('dataset')} className="btn-primary">
            Go to Dataset →
          </button>
        </Card>
      ) : (
        <>
          {/* Config + Train button */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader
                title="Training Configuration"
                subtitle="Hyperparameters for the logistic regression model"
                icon={<Zap size={18} />}
              />
              <div className="p-5 pt-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <ConfigInput
                    label="Learning Rate"
                    value={trainingConfig.learningRate}
                    onChange={(v) => setTrainingConfig({ learningRate: v })}
                    step={0.01}
                    min={0.001}
                    max={1}
                  />
                  <ConfigInput
                    label="Iterations"
                    value={trainingConfig.iterations}
                    onChange={(v) => setTrainingConfig({ iterations: Math.floor(v) })}
                    step={50}
                    min={50}
                    max={2000}
                  />
                  <ConfigInput
                    label="Test Size (%)"
                    value={trainingConfig.testSize * 100}
                    onChange={(v) => setTrainingConfig({ testSize: v / 100 })}
                    step={5}
                    min={10}
                    max={50}
                  />
                  <ConfigInput
                    label="L2 Regularization"
                    value={trainingConfig.l2Regularization}
                    onChange={(v) => setTrainingConfig({ l2Regularization: v })}
                    step={0.001}
                    min={0}
                    max={1}
                  />
                  <ConfigInput
                    label="Threshold"
                    value={trainingConfig.threshold}
                    onChange={(v) => setTrainingConfig({ threshold: v })}
                    step={0.05}
                    min={0.1}
                    max={0.9}
                  />
                  <ConfigInput
                    label="Random Seed"
                    value={trainingConfig.randomSeed}
                    onChange={(v) => setTrainingConfig({ randomSeed: Math.floor(v) })}
                    step={1}
                    min={0}
                    max={9999}
                  />
                </div>

                <div className="mt-4 pt-4 border-t border-ink-800">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={trainingConfig.classWeightBalanced}
                      onChange={(e) => setTrainingConfig({ classWeightBalanced: e.target.checked })}
                      className="w-4 h-4 rounded accent-primary-500"
                    />
                    <span className="text-sm text-ink-200">
                      Class Weight Balanced
                    </span>
                    <span className="text-xs text-ink-500">
                      (weights fraud samples higher to combat imbalance)
                    </span>
                  </label>
                </div>

                <div className="flex items-center gap-3 mt-4">
                  <button
                    onClick={train}
                    disabled={isTraining}
                    className="btn-primary"
                  >
                    {isTraining ? <Spinner size={16} /> : <Play size={16} />}
                    {isTraining ? 'Training...' : 'Train Model'}
                  </button>
                  {model && !isTraining && (
                    <button
                      onClick={clearTrainedModel}
                      className="btn-ghost text-danger-400 hover:bg-danger-500/10"
                    >
                      <Trash2 size={16} /> Clear Model
                    </button>
                  )}
                </div>
              </div>
            </Card>

            {/* Live training progress */}
            <Card>
              <CardHeader
                title="Training Progress"
                subtitle={isTraining ? 'Training in progress...' : model ? 'Training complete' : 'Not started'}
                icon={<Activity size={18} />}
              />
              <div className="p-5 pt-4">
                {isTraining && trainingProgress ? (
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-ink-500">Iteration</span>
                        <span className="text-ink-200 font-medium tabular-nums">
                          {trainingProgress.iteration} / {trainingConfig.iterations}
                        </span>
                      </div>
                      <ProgressBar value={trainingProgress.iteration} max={trainingConfig.iterations} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-ink-800/50 rounded-lg p-3">
                        <div className="text-xs text-ink-500">Loss</div>
                        <div className="text-lg font-bold text-primary-400 tabular-nums">
                          {trainingProgress.loss.toFixed(4)}
                        </div>
                      </div>
                      <div className="bg-ink-800/50 rounded-lg p-3">
                        <div className="text-xs text-ink-500">Accuracy</div>
                        <div className="text-lg font-bold text-success-400 tabular-nums">
                          {formatPercent(trainingProgress.accuracy, 1)}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : model ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-success-400 text-sm font-medium">
                      <Target size={16} /> Model trained successfully
                    </div>
                    <div className="text-xs text-ink-500">
                      Trained at {new Date(model.trainedAt).toLocaleString()}
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <MetricBox label="Accuracy" value={formatPercent(model.metrics.accuracy, 1)} color="text-success-400" />
                      <MetricBox label="F1 Score" value={formatPercent(model.metrics.f1Score, 1)} color="text-primary-400" />
                      <MetricBox label="Precision" value={formatPercent(model.metrics.precision, 1)} color="text-primary-400" />
                      <MetricBox label="Recall" value={formatPercent(model.metrics.recall, 1)} color="text-warning-400" />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Brain className="w-10 h-10 text-ink-700 mx-auto mb-2" />
                    <p className="text-sm text-ink-500">Ready to train</p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Training history chart */}
          {history.length > 0 && !isTraining && (
            <Card>
              <CardHeader
                title="Training History"
                subtitle="Loss and accuracy over iterations"
                icon={<TrendingUp size={18} />}
              />
              <div className="p-5 pt-4">
                <LineChart
                  series={[
                    {
                      name: 'Loss',
                      color: '#ef4444',
                      points: history.map((h) => ({ x: h.iteration, y: h.loss })),
                    },
                    {
                      name: 'Accuracy',
                      color: '#22c55e',
                      points: history.map((h) => ({ x: h.iteration, y: h.accuracy })),
                    },
                  ]}
                  xLabel="Iteration"
                  yLabel="Value"
                  xFormat={(v) => v.toFixed(0)}
                  yFormat={(v) => v.toFixed(2)}
                  height={280}
                />
              </div>
            </Card>
          )}

          {/* Feature importance */}
          {model && !isTraining && (
            <Card>
              <CardHeader
                title="Feature Importance"
                subtitle="Top features by absolute weight magnitude"
                icon={<Target size={18} />}
              />
              <div className="p-5 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
                  {model.featureImportance.slice(0, 20).map((f, i) => {
                    const maxImp = model.featureImportance[0].importance;
                    const pct = (f.importance / maxImp) * 100;
                    return (
                      <div key={f.name} className="flex items-center gap-3 py-1">
                        <span className="text-xs text-ink-500 w-4 text-right">{i + 1}</span>
                        <span className="text-xs text-ink-200 font-medium w-10">{f.name}</span>
                        <div className="flex-1 h-2 bg-ink-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: i < 5 ? '#f97316' : '#3b82f6',
                            }}
                          />
                        </div>
                        <span className="text-xs text-ink-400 tabular-nums w-12 text-right">
                          {f.importance.toFixed(3)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          )}

          {model && !isTraining && (
            <div className="flex justify-end gap-3">
              <button onClick={() => setCurrentView('evaluation')} className="btn-secondary">
                View Evaluation
              </button>
              <button onClick={() => setCurrentView('prediction')} className="btn-primary">
                Start Predicting →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ConfigInput({
  label,
  value,
  onChange,
  step,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step: number;
  min: number;
  max: number;
}) {
  return (
    <div>
      <label className="text-xs text-ink-400 font-medium block mb-1.5">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        step={step}
        min={min}
        max={max}
        className="input w-full"
      />
    </div>
  );
}

function MetricBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-ink-800/50 rounded-lg p-2.5">
      <div className="text-xs text-ink-500">{label}</div>
      <div className={`text-sm font-bold tabular-nums ${color}`}>{value}</div>
    </div>
  );
}
