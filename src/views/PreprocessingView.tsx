// ============================================================================
// Preprocessing view — data cleaning and feature normalization
// ============================================================================

import {
  Settings2,
  Play,
  CheckCircle2,
  Loader2,
  ArrowRight,
  BarChart3,
} from 'lucide-react';
import { useAppState } from '@/store/AppState';
import { Card, CardHeader, Badge, Spinner } from '@/components/ui';
import { BarChart } from '@/components/charts/BarChart';
import { formatNumber } from '@/ml/stats';

export function PreprocessingView() {
  const { rawData, preprocessed, isPreprocessing, runPreprocessing, setCurrentView } = useAppState();

  const topFeatures = preprocessed
    ? [...preprocessed.featureStats]
        .sort((a, b) => b.fraudCorrelation - a.fraudCorrelation)
        .slice(0, 10)
    : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-ink-100 mb-1">Data Preprocessing</h2>
        <p className="text-sm text-ink-500">
          Clean, validate, and normalize transaction features before model training.
        </p>
      </div>

      {rawData.length === 0 ? (
        <Card className="p-12 text-center">
          <Settings2 className="w-12 h-12 text-ink-700 mx-auto mb-3" />
          <p className="text-ink-400 mb-4">No dataset loaded yet</p>
          <button onClick={() => setCurrentView('dataset')} className="btn-primary">
            Go to Dataset →
          </button>
        </Card>
      ) : (
        <>
          {/* Pipeline steps */}
          <Card>
            <CardHeader
              title="Preprocessing Pipeline"
              subtitle="StandardScaler normalization + train/test split"
              icon={<Settings2 size={18} />}
              action={
                <button
                  onClick={runPreprocessing}
                  disabled={isPreprocessing}
                  className="btn-primary"
                >
                  {isPreprocessing ? <Spinner size={16} /> : <Play size={16} />}
                  {isPreprocessing ? 'Processing...' : 'Run Preprocessing'}
                </button>
              }
            />
            <div className="p-5 pt-4">
              <div className="space-y-2">
                {preprocessed?.steps.map((step) => (
                  <div
                    key={step.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-300 ${
                      step.status === 'done'
                        ? 'bg-success-500/5 border-success-500/20'
                        : step.status === 'running'
                        ? 'bg-primary-500/5 border-primary-500/20'
                        : 'bg-ink-800/50 border-ink-700'
                    }`}
                  >
                    {step.status === 'done' ? (
                      <CheckCircle2 size={18} className="text-success-400 shrink-0" />
                    ) : step.status === 'running' ? (
                      <Loader2 size={18} className="text-primary-400 animate-spin shrink-0" />
                    ) : (
                      <div className="w-4.5 h-4.5 rounded-full border-2 border-ink-600 shrink-0" />
                    )}
                    <div className="flex-1">
                      <div className="text-sm font-medium text-ink-100">{step.title}</div>
                      <div className="text-xs text-ink-500">{step.description}</div>
                    </div>
                    {step.detail && (
                      <Badge variant="info">{step.detail}</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Results */}
          {preprocessed && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-slide-up">
              {/* Feature statistics */}
              <Card>
                <CardHeader
                  title="Feature Statistics"
                  subtitle="Mean, std, and fraud correlation per feature"
                  icon={<BarChart3 size={18} />}
                />
                <div className="p-5 pt-4">
                  <div className="max-h-80 overflow-y-auto space-y-1">
                    <div className="grid grid-cols-5 gap-2 text-[10px] text-ink-500 font-medium pb-1 border-b border-ink-800 sticky top-0 bg-ink-900">
                      <span>Feature</span>
                      <span className="text-right">Mean</span>
                      <span className="text-right">Std</span>
                      <span className="text-right">Min</span>
                      <span className="text-right">Corr</span>
                    </div>
                    {preprocessed.featureStats.map((stat) => (
                      <div
                        key={stat.name}
                        className="grid grid-cols-5 gap-2 text-xs py-1 hover:bg-ink-800/30 rounded"
                      >
                        <span className="text-ink-200 font-medium">{stat.name}</span>
                        <span className="text-right text-ink-400 tabular-nums">{formatNumber(stat.mean, 3)}</span>
                        <span className="text-right text-ink-400 tabular-nums">{formatNumber(stat.std, 3)}</span>
                        <span className="text-right text-ink-400 tabular-nums">{formatNumber(stat.min, 2)}</span>
                        <span className="text-right tabular-nums font-medium" style={{
                          color: stat.fraudCorrelation > 0.15 ? '#f97316' : '#64748b'
                        }}>
                          {formatNumber(stat.fraudCorrelation, 3)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Top correlated features */}
              <Card>
                <CardHeader
                  title="Top Fraud Correlations"
                  subtitle="Features most correlated with fraud"
                  icon={<BarChart3 size={18} />}
                />
                <div className="p-5 pt-4">
                  <BarChart
                    data={topFeatures.map((f) => ({
                      label: f.name,
                      value: f.fraudCorrelation,
                      color: '#f97316',
                    }))}
                    horizontal
                    showValues
                    formatValue={(v) => v.toFixed(3)}
                  />
                  <div className="mt-4 pt-4 border-t border-ink-800 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-ink-500">Class Distribution</span>
                      <span className="text-ink-300">
                        {preprocessed.classDistribution.normal.toLocaleString()} normal /{' '}
                        {preprocessed.classDistribution.fraud.toLocaleString()} fraud
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-ink-500">Scaler</span>
                      <span className="text-ink-300">StandardScaler (mean=0, std=1)</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-ink-500">Features</span>
                      <span className="text-ink-300">{preprocessed.scaler.means.length} normalized</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Next step */}
          {preprocessed && (
            <div className="flex justify-end">
              <button onClick={() => setCurrentView('training')} className="btn-primary">
                Proceed to Training <ArrowRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
