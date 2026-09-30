// ============================================================================
// Sidebar navigation
// ============================================================================

import {
  LayoutDashboard,
  Database,
  Settings2,
  Brain,
  BarChart3,
  ScanSearch,
  Bell,
  ShieldAlert,
} from 'lucide-react';
import { useAppState } from '@/store/AppState';

type ViewName =
  | 'dashboard'
  | 'dataset'
  | 'preprocessing'
  | 'training'
  | 'evaluation'
  | 'prediction'
  | 'alerts';

const NAV_ITEMS: {
  id: ViewName;
  label: string;
  icon: typeof LayoutDashboard;
  description: string;
}[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'Overview & metrics' },
  { id: 'dataset', label: 'Dataset', icon: Database, description: 'Load & inspect data' },
  { id: 'preprocessing', label: 'Preprocessing', icon: Settings2, description: 'Clean & normalize' },
  { id: 'training', label: 'Training', icon: Brain, description: 'Train ML model' },
  { id: 'evaluation', label: 'Evaluation', icon: BarChart3, description: 'Model performance' },
  { id: 'prediction', label: 'Prediction', icon: ScanSearch, description: 'Detect fraud' },
  { id: 'alerts', label: 'Alert Monitor', icon: Bell, description: 'Fraud alert log' },
];

export function Sidebar() {
  const { currentView, setCurrentView, model, rawData, alerts } = useAppState();

  return (
    <aside className="w-64 bg-ink-900 border-r border-ink-800 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-5 border-b border-ink-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-600/30">
            <ShieldAlert className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-ink-100 leading-tight">
              Fraud Alert
            </h1>
            <p className="text-xs text-ink-500 leading-tight">Detection System</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = currentView === item.id;
          const hasBadge = item.id === 'alerts' && alerts.length > 0;

          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 group ${
                active
                  ? 'bg-primary-600/15 text-primary-300 border border-primary-500/30'
                  : 'text-ink-400 hover:text-ink-100 hover:bg-ink-800/50 border border-transparent'
              }`}
            >
              <Icon
                className={`w-4.5 h-4.5 shrink-0 ${active ? 'text-primary-400' : 'text-ink-500 group-hover:text-ink-300'}`}
                size={18}
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium leading-tight">{item.label}</div>
                <div className="text-[10px] text-ink-600 leading-tight mt-0.5">
                  {item.description}
                </div>
              </div>
              {hasBadge && (
                <span className="w-5 h-5 rounded-full bg-danger-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {alerts.length > 99 ? '99+' : alerts.length}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Status footer */}
      <div className="p-3 border-t border-ink-800 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-ink-500">Dataset</span>
          <span className={`font-medium ${rawData.length > 0 ? 'text-success-400' : 'text-ink-600'}`}>
            {rawData.length > 0 ? `${rawData.length.toLocaleString()} rows` : 'Not loaded'}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-ink-500">Model</span>
          <span className={`font-medium ${model ? 'text-success-400' : 'text-ink-600'}`}>
            {model ? 'Trained' : 'Not trained'}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-ink-500">Alerts</span>
          <span className={`font-medium ${alerts.length > 0 ? 'text-warning-400' : 'text-ink-600'}`}>
            {alerts.length}
          </span>
        </div>
      </div>
    </aside>
  );
}
