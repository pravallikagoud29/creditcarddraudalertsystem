// ============================================================================
// Prediction view — enter transaction data and get real-time fraud scores
// ============================================================================

import { useState } from 'react';
import {
  ScanSearch,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Send,
  Dice5,
  Bell,
  TrendingUp,
} from 'lucide-react';
import { useAppState } from '@/store/AppState';
import { Card, CardHeader, Badge, Spinner } from '@/components/ui';
import { BarChart } from '@/components/charts/BarChart';
import { predictTransaction, createAlert } from '@/ml/predict';
import { PredictionInput, PredictionResult, FraudAlert } from '@/ml/types';
import { formatNumber, formatPercent } from '@/ml/stats';

const DEFAULT_INPUT: PredictionInput = {
  Time: 100000, Amount: 150.0,
  V1: -1.5, V2: 0.8, V3: -1.2, V4: 1.3, V5: -0.8, V6: -0.5,
  V7: 1.0, V8: -0.2, V9: -1.1, V10: -1.4, V11: 1.5, V12: -1.8,
  V13: 0.1, V14: -2.0, V15: 0.3, V16: -1.3, V17: -1.6, V18: -0.7,
  V19: 0.6, V20: 0.2, V21: 0.1, V22: -0.1, V23: 0.05, V24: -0.3,
  V25: 0.1, V26: -0.2, V27: 0.4, V28: -0.1,
};

const V_FIELDS = Array.from({ length: 28 }, (_, i) => `V${i + 1}`) as (keyof PredictionInput)[];

export function PredictionView() {
  const { model, setCurrentView, addNewAlert } = useAppState();
  const [input, setInput] = useState<PredictionInput>(DEFAULT_INPUT);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [alertCreated, setAlertCreated] = useState(false);

  if (!model) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h2 className="text-xl font-bold text-ink-100 mb-1">Fraud Prediction</h2>
          <p className="text-sm text-ink-500">
            Enter transaction details to get a real-time fraud probability score.
          </p>
        </div>
        <Card className="p-12 text-center">
          <ScanSearch className="w-12 h-12 text-ink-700 mx-auto mb-3" />
          <p className="text-ink-400 mb-4">No trained model available</p>
          <button onClick={() => setCurrentView('training')} className="btn-primary">
            Train a Model First →
          </button>
        </Card>
      </div>
    );
  }

  const handlePredict = () => {
    setIsPredicting(true);
    setAlertCreated(false);
    setTimeout(() => {
      const res = predictTransaction(input, model);
      setResult(res);
      setIsPredicting(false);

      // Auto-create alert for high-risk predictions
      if (res.isFraud) {
        const alert = createAlert(input, res, model);
        addNewAlert(alert);
        setAlertCreated(true);
      }
    }, 200);
  };

  const handleRandomize = () => {
    const newInput: PredictionInput = { ...DEFAULT_INPUT };
    for (const field of V_FIELDS) {
      newInput[field] = Math.round((Math.random() * 4 - 2) * 1e6) / 1e6;
    }
    newInput.Time = Math.floor(Math.random() * 172800);
    newInput.Amount = Math.round(Math.random() * 2000 * 100) / 100;
    setInput(newInput);
    setResult(null);
    setAlertCreated(false);
  };

  const updateField = (field: keyof PredictionInput, value: number) => {
    setInput((prev) => ({ ...prev, [field]: value }));
  };

  const riskColor =
    result?.riskLevel === 'high'
      ? 'text-danger-400'
      : result?.riskLevel === 'medium'
      ? 'text-warning-400'
      : 'text-success-400';

  const riskBg =
    result?.riskLevel === 'high'
      ? 'bg-danger-500/10 border-danger-500/30'
      : result?.riskLevel === 'medium'
      ? 'bg-warning-500/10 border-warning-500/30'
      : 'bg-success-500/10 border-success-500/30';

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-ink-100 mb-1">Fraud Prediction</h2>
        <p className="text-sm text-ink-500">
          Enter transaction features to get a real-time fraud probability score from the trained model.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Input form */}
        <Card>
          <CardHeader
            title="Transaction Details"
            subtitle="30 features (Time, V1-V28, Amount)"
            icon={<ScanSearch size={18} />}
            action={
              <button onClick={handleRandomize} className="btn-ghost text-xs">
                <Dice5 size={14} /> Randomize
              </button>
            }
          />
          <div className="p-5 pt-4">
            {/* Time and Amount */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <FieldInput label="Time (seconds)" field="Time" value={input.Time} onChange={updateField} />
              <FieldInput label="Amount ($)" field="Amount" value={input.Amount} onChange={updateField} />
            </div>

            {/* V1-V28 grid */}
            <div className="grid grid-cols-4 gap-2">
              {V_FIELDS.map((field) => (
                <FieldInput
                  key={field}
                  label={field}
                  field={field}
                  value={input[field]}
                  onChange={updateField}
                  compact
                />
              ))}
            </div>

            <button
              onClick={handlePredict}
              disabled={isPredicting}
              className="btn-primary w-full mt-4"
            >
              {isPredicting ? <Spinner size={16} /> : <Send size={16} />}
              {isPredicting ? 'Analyzing...' : 'Analyze Transaction'}
            </button>
          </div>
        </Card>

        {/* Result */}
        <Card>
          <CardHeader
            title="Prediction Result"
            subtitle={result ? 'Fraud analysis complete' : 'Run a prediction to see results'}
            icon={result?.isFraud ? <ShieldAlert size={18} /> : <ShieldCheck size={18} />}
          />
          <div className="p-5 pt-4">
            {!result && !isPredicting && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <ScanSearch className="w-16 h-16 text-ink-700 mb-3" />
                <p className="text-sm text-ink-500">
                  Click "Analyze Transaction" to get a fraud prediction
                </p>
              </div>
            )}

            {isPredicting && (
              <div className="flex flex-col items-center justify-center py-16">
                <Spinner size={32} />
                <p className="text-sm text-ink-500 mt-3">Running model inference...</p>
              </div>
            )}

            {result && !isPredicting && (
              <div className="space-y-4 animate-slide-up">
                {/* Verdict */}
                <div className={`rounded-xl border p-5 ${riskBg}`}>
                  <div className="flex items-center gap-3 mb-3">
                    {result.isFraud ? (
                      <ShieldAlert className={`w-10 h-10 ${riskColor}`} />
                    ) : (
                      <ShieldCheck className={`w-10 h-10 ${riskColor}`} />
                    )}
                    <div>
                      <div className={`text-lg font-bold ${riskColor}`}>
                        {result.isFraud ? 'FRAUD DETECTED' : 'TRANSACTION APPEARS NORMAL'}
                      </div>
                      <div className="text-xs text-ink-500">
                        Risk Level: <span className={`font-medium ${riskColor}`}>{result.riskLevel.toUpperCase()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Probability gauge */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-ink-400">Fraud Probability</span>
                      <span className={`font-bold tabular-nums ${riskColor}`}>
                        {formatPercent(result.probability, 2)}
                      </span>
                    </div>
                    <div className="h-3 bg-ink-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${result.probability * 100}%`,
                          backgroundColor:
                            result.riskLevel === 'high' ? '#ef4444'
                              : result.riskLevel === 'medium' ? '#f59e0b'
                              : '#22c55e',
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-ink-600 mt-1">
                      <span>0% (Normal)</span>
                      <span>50% (Threshold)</span>
                      <span>100% (Fraud)</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-ink-700/50">
                    <div>
                      <span className="text-xs text-ink-500">Confidence</span>
                      <p className="text-sm font-semibold text-ink-200 tabular-nums">
                        {formatPercent(result.confidence, 1)}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-ink-500">Amount</span>
                      <p className="text-sm font-semibold text-ink-200 tabular-nums">
                        ${input.Amount.toFixed(2)}
                      </p>
                    </div>
                    {alertCreated && (
                      <Badge variant="danger">
                        <Bell size={10} /> Alert logged
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Top contributing features */}
                <div>
                  <h4 className="text-xs font-medium text-ink-400 mb-2 flex items-center gap-1">
                    <TrendingUp size={12} /> Top Contributing Features
                  </h4>
                  <BarChart
                    data={result.topContributingFeatures.map((f) => ({
                      label: f.name,
                      value: f.contribution,
                      color: f.contribution > 0 ? '#ef4444' : '#22c55e',
                    }))}
                    horizontal
                    showValues
                    formatValue={(v) => formatNumber(v, 3)}
                  />
                  <p className="text-[10px] text-ink-600 mt-2">
                    Red bars push toward fraud, green bars push toward normal
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function FieldInput({
  label,
  field,
  value,
  onChange,
  compact = false,
}: {
  label: string;
  field: keyof PredictionInput;
  value: number;
  onChange: (field: keyof PredictionInput, value: number) => void;
  compact?: boolean;
}) {
  return (
    <div>
      <label className={`${compact ? 'text-[10px]' : 'text-xs'} text-ink-400 font-medium block mb-1`}>
        {label}
      </label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(field, Number(e.target.value))}
        step="any"
        className={`input w-full ${compact ? 'text-xs py-1.5' : ''}`}
      />
    </div>
  );
}
