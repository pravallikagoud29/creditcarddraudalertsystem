// ============================================================================
// Prediction utilities — apply trained model to new transaction data.
// ============================================================================

import {
  TrainedModel,
  PredictionInput,
  PredictionResult,
  FraudAlert,
} from './types';
import { predictProba } from './logistic';
import { getCanonicalFeatureNames } from './dataset';

// Convert PredictionInput to canonical feature array [Time, V1..V28, Amount]
export function inputToFeatures(input: PredictionInput): number[] {
  return [
    input.Time,
    input.V1, input.V2, input.V3, input.V4, input.V5, input.V6, input.V7,
    input.V8, input.V9, input.V10, input.V11, input.V12, input.V13, input.V14,
    input.V15, input.V16, input.V17, input.V18, input.V19, input.V20,
    input.V21, input.V22, input.V23, input.V24, input.V25, input.V26,
    input.V27, input.V28,
    input.Amount,
  ];
}

// Normalize features using the model's stored scaler
export function normalizeFeatures(
  features: number[],
  model: TrainedModel
): number[] {
  return features.map((v, f) =>
    (v - model.scaler.means[f]) / model.scaler.stds[f]
  );
}

export function predictTransaction(
  input: PredictionInput,
  model: TrainedModel
): PredictionResult {
  const rawFeatures = inputToFeatures(input);
  const normalized = normalizeFeatures(rawFeatures, model);
  const probability = predictProba(normalized, model.weights, model.bias);

  const threshold = model.config.threshold;
  const isFraud = probability >= threshold;

  let riskLevel: 'low' | 'medium' | 'high';
  if (probability >= 0.75) riskLevel = 'high';
  else if (probability >= 0.4) riskLevel = 'medium';
  else riskLevel = 'low';

  // Compute per-feature contributions to the fraud probability
  const contributions: { name: string; value: number; contribution: number }[] = [];
  for (let f = 0; f < normalized.length; f++) {
    contributions.push({
      name: model.featureNames[f] || `F${f}`,
      value: rawFeatures[f],
      contribution: normalized[f] * model.weights[f],
    });
  }
  contributions.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));

  const confidence = Math.abs(probability - 0.5) * 2;

  return {
    probability,
    isFraud,
    confidence,
    riskLevel,
    topContributingFeatures: contributions.slice(0, 5),
  };
}

export function createAlert(
  input: PredictionInput,
  result: PredictionResult,
  model: TrainedModel
): FraudAlert {
  const hours = Math.floor(input.Time / 3600);
  const mins = Math.floor((input.Time % 3600) / 60);
  const secs = Math.floor(input.Time % 60);
  const timeOfDay = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return {
    id: `alert_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
    probability: result.probability,
    amount: input.Amount,
    riskLevel: result.riskLevel,
    topFeatures: result.topContributingFeatures.map((f) => ({
      name: f.name,
      contribution: f.contribution,
    })),
    timeOfDay,
  };
}
