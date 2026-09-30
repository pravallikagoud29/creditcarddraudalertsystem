// ============================================================================
// Synthetic credit card fraud dataset generator.
//
// Generates realistic-looking transactions that mimic the structure of the
// well-known ULB creditcard.csv dataset: 28 anonymized PCA features (V1-V28),
// Time (seconds since first transaction), Amount, and Class (0=normal, 1=fraud).
//
// Fraud transactions have distinct statistical signatures in certain features
// (V14, V12, V10, V17, V4, V7, V11) so a logistic regression model can learn
// meaningful decision boundaries — this is NOT random noise.
// ============================================================================

import { RawTransaction } from './types';
import { gaussian, mulberry32 } from './random';

const FEATURE_NAMES = [
  'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9', 'V10',
  'V11', 'V12', 'V13', 'V14', 'V15', 'V16', 'V17', 'V18', 'V19', 'V20',
  'V21', 'V22', 'V23', 'V24', 'V25', 'V26', 'V27', 'V28',
];

// Base distribution parameters for normal transactions per feature (mean, std)
const NORMAL_PARAMS: [number, number][] = [
  [0.0, 1.0], [0.0, 1.0], [0.0, 1.0], [0.0, 1.0], [0.0, 1.0],
  [0.0, 1.0], [0.0, 1.0], [0.0, 1.0], [0.0, 1.0], [0.0, 1.0],
  [0.0, 1.0], [0.0, 1.0], [0.0, 1.0], [0.0, 1.0], [0.0, 1.0],
  [0.0, 1.0], [0.0, 1.0], [0.0, 1.0], [0.0, 1.0], [0.0, 1.0],
  [0.0, 1.0], [0.0, 1.0], [0.0, 1.0], [0.0, 1.0], [0.0, 1.0],
  [0.0, 1.0], [0.0, 1.0], [0.0, 1.0],
];

// Fraud transactions shift the mean of certain features (the "signal" features)
// and reduce variance, matching the real ULB dataset's fraud signatures.
const FRAUD_SHIFT: Record<number, number> = {
  1: -1.5, 3: -1.2, 4: 1.3, 5: -0.8, 6: -0.5, 7: 1.0,
  9: -1.1, 10: -1.4, 11: 1.5, 12: -1.8, 14: -2.0, 16: -1.3,
  17: -1.6, 18: -0.7, 19: 0.6,
};

const FRAUD_STD_MULT: Record<number, number> = {
  14: 0.5, 12: 0.6, 10: 0.7, 17: 0.5, 4: 0.8, 11: 0.7,
};

export function getFeatureNames(): string[] {
  return [...FEATURE_NAMES];
}

export function generateDataset(
  totalRows: number,
  fraudRate: number,
  seed: number
): RawTransaction[] {
  const rng = mulberry32(seed);
  const fraudCount = Math.floor(totalRows * fraudRate);
  const normalCount = totalRows - fraudCount;
  const rows: RawTransaction[] = [];

  // Generate normal transactions
  for (let i = 0; i < normalCount; i++) {
    const features: number[] = [];
    for (let f = 0; f < 28; f++) {
      const [m, s] = NORMAL_PARAMS[f];
      features.push(gaussian(rng, m, s));
    }
    const time = Math.floor(rng() * 172800); // up to 48 hours
    const amount = Math.max(0.01, Math.round(gaussian(rng, 88, 250) * 100) / 100);
    rows.push(makeTransaction(features, time, amount, 0));
  }

  // Generate fraud transactions with shifted feature distributions
  for (let i = 0; i < fraudCount; i++) {
    const features: number[] = [];
    for (let f = 0; f < 28; f++) {
      const [m, s] = NORMAL_PARAMS[f];
      const shift = FRAUD_SHIFT[f + 1] || 0;
      const stdMult = FRAUD_STD_MULT[f + 1] || 1.0;
      features.push(gaussian(rng, m + shift, s * stdMult));
    }
    const time = Math.floor(rng() * 172800);
    // Fraud tends to have unusual amounts — either very small or very large
    const isLargeAmount = rng() > 0.5;
    const amount = isLargeAmount
      ? Math.max(1, Math.round(gaussian(rng, 500, 600) * 100) / 100)
      : Math.max(0.01, Math.round(gaussian(rng, 10, 5) * 100) / 100);
    rows.push(makeTransaction(features, time, amount, 1));
  }

  // Interleave by shuffling deterministically
  for (let i = rows.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [rows[i], rows[j]] = [rows[j], rows[i]];
  }

  return rows;
}

function makeTransaction(
  features: number[],
  time: number,
  amount: number,
  cls: number
): RawTransaction {
  const tx: Record<string, number> = { Time: time, Amount: amount, Class: cls };
  for (let i = 0; i < 28; i++) {
    tx[`V${i + 1}`] = Math.round(features[i] * 1e6) / 1e6;
  }
  return tx as unknown as RawTransaction;
}

// Convert RawTransaction to feature array in canonical order:
// [Time, V1..V28, Amount] — 30 features
export function transactionToFeatures(tx: RawTransaction): number[] {
  const features = [tx.Time];
  for (let i = 1; i <= 28; i++) {
    features.push(tx[`V${i}` as keyof RawTransaction] as number);
  }
  features.push(tx.Amount);
  return features;
}

export function getCanonicalFeatureNames(): string[] {
  return ['Time', ...FEATURE_NAMES, 'Amount'];
}
