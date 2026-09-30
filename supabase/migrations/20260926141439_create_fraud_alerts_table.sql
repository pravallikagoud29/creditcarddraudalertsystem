/*
# Create fraud_alerts table (single-tenant, no auth)

1. New Tables
- `fraud_alerts`
  - `id` (text, primary key) — unique alert identifier
  - `timestamp` (bigint) — Unix epoch milliseconds when alert was created
  - `probability` (double precision) — model's fraud probability score (0-1)
  - `amount` (double precision) — transaction amount in dollars
  - `risk_level` (text) — 'low', 'medium', or 'high'
  - `top_features` (jsonb) — array of {name, contribution} objects for top contributing features
  - `time_of_day` (text) — formatted time string HH:MM:SS
  - `created_at` (timestamptz) — database record creation time

2. Security
- Enable RLS on `fraud_alerts`.
- Allow anon + authenticated CRUD because this is a single-tenant dashboard app with no sign-in.
- All data is intentionally shared/public within the app.

3. Notes
- The app generates synthetic credit card transactions, runs a logistic regression
  model to detect fraud, and stores flagged alerts for monitoring.
- This table persists alert history across page reloads.
*/

CREATE TABLE IF NOT EXISTS fraud_alerts (
  id text PRIMARY KEY,
  timestamp bigint NOT NULL,
  probability double precision NOT NULL,
  amount double precision NOT NULL,
  risk_level text NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
  top_features jsonb NOT NULL DEFAULT '[]'::jsonb,
  time_of_day text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE fraud_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_fraud_alerts" ON fraud_alerts;
CREATE POLICY "anon_select_fraud_alerts" ON fraud_alerts FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_fraud_alerts" ON fraud_alerts;
CREATE POLICY "anon_insert_fraud_alerts" ON fraud_alerts FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_fraud_alerts" ON fraud_alerts;
CREATE POLICY "anon_delete_fraud_alerts" ON fraud_alerts FOR DELETE
  TO anon, authenticated USING (true);
