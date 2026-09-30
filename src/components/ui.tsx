// ============================================================================
// Shared UI primitives
// ============================================================================

import { ReactNode } from 'react';

export function Card({
  children,
  className = '',
  hover = false,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div className={`card ${hover ? 'card-hover' : ''} ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  icon,
  action,
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between p-5 pb-0">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="w-9 h-9 rounded-lg bg-ink-800 flex items-center justify-center text-primary-400">
            {icon}
          </div>
        )}
        <div>
          <h3 className="text-sm font-semibold text-ink-100">{title}</h3>
          {subtitle && <p className="text-xs text-ink-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon,
  trend,
  color = 'primary',
}: {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: { value: string; positive: boolean };
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'accent';
}) {
  const colorMap: Record<string, string> = {
    primary: 'text-primary-400 bg-primary-500/10',
    success: 'text-success-400 bg-success-500/10',
    warning: 'text-warning-400 bg-warning-500/10',
    danger: 'text-danger-400 bg-danger-500/10',
    accent: 'text-accent-400 bg-accent-500/10',
  };

  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-ink-500 font-medium">{label}</span>
        {icon && (
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
            {icon}
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-ink-100 tabular-nums">
        {value}
      </div>
      {trend && (
        <div className="flex items-center gap-1 mt-2">
          <span
            className={`text-xs font-medium ${
              trend.positive ? 'text-success-400' : 'text-danger-400'
            }`}
          >
            {trend.positive ? '+' : ''}
            {trend.value}
          </span>
        </div>
      )}
    </div>
  );
}

export function Badge({
  children,
  variant = 'info',
}: {
  children: ReactNode;
  variant?: 'success' | 'danger' | 'warning' | 'info';
}) {
  const variantMap: Record<string, string> = {
    success: 'badge-success',
    danger: 'badge-danger',
    warning: 'badge-warning',
    info: 'badge-info',
  };
  return <span className={variantMap[variant]}>{children}</span>;
}

export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <div
      className="animate-spin rounded-full border-2 border-ink-700 border-t-primary-500"
      style={{ width: size, height: size }}
    />
  );
}

export function ProgressBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="w-full h-2 bg-ink-800 rounded-full overflow-hidden">
      <div
        className="h-full bg-primary-500 rounded-full transition-all duration-300"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
