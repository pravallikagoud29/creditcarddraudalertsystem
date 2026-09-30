// ============================================================================
// Fraud alert persistence — Supabase with localStorage fallback.
// ============================================================================

import { FraudAlert } from '@/ml/types';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const LOCAL_KEY = 'fraud_alerts_local';

// Try Supabase first, fall back to localStorage if it fails
export async function getAlertsAsync(): Promise<FraudAlert[]> {
  try {
    const { data, error } = await supabase
      .from('fraud_alerts')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(200);

    if (error) throw error;
    if (data && data.length > 0) {
      return data.map(rowToAlert);
    }
    return [];
  } catch {
    return getLocalAlerts();
  }
}

export function getAlerts(): FraudAlert[] {
  // Synchronous version for initial state — returns local cache
  return getLocalAlerts();
}

export async function addAlertAsync(alert: FraudAlert): Promise<void> {
  try {
    const { error } = await supabase.from('fraud_alerts').insert({
      id: alert.id,
      timestamp: alert.timestamp,
      probability: alert.probability,
      amount: alert.amount,
      risk_level: alert.riskLevel,
      top_features: alert.topFeatures,
      time_of_day: alert.timeOfDay,
    });
    if (error) throw error;
  } catch {
    addLocalAlert(alert);
  }
}

// Synchronous wrapper that also kicks off async save
export function addAlert(alert: FraudAlert): void {
  addLocalAlert(alert);
  addAlertAsync(alert).catch(() => {});
}

export async function clearAlertsAsync(): Promise<void> {
  try {
    const { error } = await supabase.from('fraud_alerts').delete().neq('id', '');
    if (error) throw error;
  } catch {
    // ignore
  }
  clearLocalAlerts();
}

export function clearAlerts(): void {
  clearLocalAlerts();
  clearAlertsAsync().catch(() => {});
}

// --- localStorage fallback ---

function getLocalAlerts(): FraudAlert[] {
  try {
    const data = localStorage.getItem(LOCAL_KEY);
    if (!data) return [];
    return JSON.parse(data) as FraudAlert[];
  } catch {
    return [];
  }
}

function addLocalAlert(alert: FraudAlert): void {
  const alerts = getLocalAlerts();
  alerts.unshift(alert);
  if (alerts.length > 200) alerts.length = 200;
  localStorage.setItem(LOCAL_KEY, JSON.stringify(alerts));
}

function clearLocalAlerts(): void {
  localStorage.removeItem(LOCAL_KEY);
}

function rowToAlert(row: Record<string, unknown>): FraudAlert {
  return {
    id: row.id as string,
    timestamp: row.timestamp as number,
    probability: row.probability as number,
    amount: row.amount as number,
    riskLevel: row.risk_level as 'low' | 'medium' | 'high',
    topFeatures: (row.top_features as { name: string; contribution: number }[]) || [],
    timeOfDay: row.time_of_day as string,
  };
}
