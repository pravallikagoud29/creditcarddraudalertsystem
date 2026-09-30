// ============================================================================
// Alert Monitor view — real-time fraud alert log
// ============================================================================

import {
  Bell,
  Trash2,
  ShieldAlert,
  Clock,
  DollarSign,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react';
import { useAppState } from '@/store/AppState';
import { Card, CardHeader, Badge, StatCard } from '@/components/ui';
import { formatPercent, formatNumber } from '@/ml/stats';

export function AlertsView() {
  const { alerts, clearAllAlerts, setCurrentView } = useAppState();

  const highRisk = alerts.filter((a) => a.riskLevel === 'high');
  const mediumRisk = alerts.filter((a) => a.riskLevel === 'medium');
  const lowRisk = alerts.filter((a) => a.riskLevel === 'low');
  const totalAmount = alerts.reduce((sum, a) => sum + a.amount, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-ink-100 mb-1">Alert Monitor</h2>
          <p className="text-sm text-ink-500">
            Real-time log of flagged fraudulent transactions detected by the model.
          </p>
        </div>
        {alerts.length > 0 && (
          <button
            onClick={clearAllAlerts}
            className="btn-ghost text-danger-400 hover:bg-danger-500/10"
          >
            <Trash2 size={16} /> Clear All
          </button>
        )}
      </div>

      {alerts.length === 0 ? (
        <Card className="p-12 text-center">
          <CheckCircle2 className="w-12 h-12 text-success-500 mx-auto mb-3" />
          <p className="text-ink-300 font-medium mb-1">No alerts detected</p>
          <p className="text-sm text-ink-500 mb-4">
            Run fraud predictions to generate alerts. Flagged transactions will appear here.
          </p>
          <button onClick={() => setCurrentView('prediction')} className="btn-primary">
            Go to Prediction →
          </button>
        </Card>
      ) : (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Total Alerts"
              value={alerts.length}
              icon={<Bell size={16} />}
              color="warning"
            />
            <StatCard
              label="High Risk"
              value={highRisk.length}
              icon={<ShieldAlert size={16} />}
              color="danger"
            />
            <StatCard
              label="Medium Risk"
              value={mediumRisk.length}
              icon={<TrendingUp size={16} />}
              color="warning"
            />
            <StatCard
              label="Total Amount"
              value={`$${totalAmount.toFixed(2)}`}
              icon={<DollarSign size={16} />}
              color="accent"
            />
          </div>

          {/* Alert list */}
          <Card>
            <CardHeader
              title="Alert History"
              subtitle={`${alerts.length} flagged transaction${alerts.length !== 1 ? 's' : ''}`}
              icon={<Bell size={18} />}
            />
            <div className="p-5 pt-4 space-y-3">
              {alerts.map((alert) => {
                const riskColor =
                  alert.riskLevel === 'high'
                    ? 'border-danger-500/30 bg-danger-500/5'
                    : alert.riskLevel === 'medium'
                    ? 'border-warning-500/30 bg-warning-500/5'
                    : 'border-success-500/30 bg-success-500/5';

                const riskBadge =
                  alert.riskLevel === 'high' ? 'danger' : alert.riskLevel === 'medium' ? 'warning' : 'success';

                return (
                  <div
                    key={alert.id}
                    className={`rounded-lg border p-4 ${riskColor} transition-all duration-200 hover:border-ink-600`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                            alert.riskLevel === 'high'
                              ? 'bg-danger-500/20 text-danger-400'
                              : alert.riskLevel === 'medium'
                              ? 'bg-warning-500/20 text-warning-400'
                              : 'bg-success-500/20 text-success-400'
                          }`}
                        >
                          <ShieldAlert size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={riskBadge as 'danger' | 'warning' | 'success'}>
                              {alert.riskLevel.toUpperCase()} RISK
                            </Badge>
                            <span className="text-xs text-ink-500 flex items-center gap-1">
                              <Clock size={11} />
                              {new Date(alert.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <div>
                              <span className="text-ink-500 text-xs">Probability</span>
                              <p className="text-ink-100 font-semibold tabular-nums">
                                {formatPercent(alert.probability, 2)}
                              </p>
                            </div>
                            <div>
                              <span className="text-ink-500 text-xs">Amount</span>
                              <p className="text-ink-100 font-semibold tabular-nums">
                                ${alert.amount.toFixed(2)}
                              </p>
                            </div>
                            <div>
                              <span className="text-ink-500 text-xs">Time</span>
                              <p className="text-ink-100 font-semibold tabular-nums">
                                {alert.timeOfDay}
                              </p>
                            </div>
                          </div>
                          {alert.topFeatures.length > 0 && (
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <span className="text-[10px] text-ink-600">Key factors:</span>
                              {alert.topFeatures.slice(0, 3).map((f, i) => (
                                <span
                                  key={i}
                                  className="text-[10px] text-ink-400 bg-ink-800 px-1.5 py-0.5 rounded"
                                >
                                  {f.name} ({formatNumber(f.contribution, 2)})
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
