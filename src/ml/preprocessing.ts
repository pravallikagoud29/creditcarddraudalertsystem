// ============================================================================
// Data analysis and preprocessing pipeline.
//
// Computes dataset info (row counts, class balance, statistics, missing values,
// duplicates) and applies standardization (z-score normalization) to features.
// Mirrors what scikit-learn's StandardScaler + train_test_split do in the
// Python reference implementation.
// ============================================================================

import {
  RawTransaction,
  DatasetInfo,
  FeatureStats,
  PreprocessedData,
  StandardScaler,
  PreprocessingStep,
} from './types';
import { getCanonicalFeatureNames, transactionToFeatures } from './dataset';
import { mean, std, median, min, max, pearsonCorrelation } from './stats';
import { mulberry32, shuffle } from './random';

export function computeDatasetInfo(data: RawTransaction[]): DatasetInfo {
  const featureNames = getCanonicalFeatureNames();
  const totalRows = data.length;
  const totalCols = featureNames.length + 1; // +1 for Class

  const labels = data.map((d) => d.Class);
  const fraudCount = labels.filter((l) => l === 1).length;
  const normalCount = totalRows - fraudCount;
  const fraudRate = totalRows > 0 ? fraudCount / totalRows : 0;

  const amounts = data.map((d) => d.Amount);
  const times = data.map((d) => d.Time);

  // Missing values
  let missingValues = 0;
  for (const row of data) {
    for (const key of Object.keys(row)) {
      if (row[key as keyof RawTransaction] === null || row[key as keyof RawTransaction] === undefined || Number.isNaN(row[key as keyof RawTransaction] as number)) {
        missingValues++;
      }
    }
  }

  // Duplicate detection (by serializing rows)
  const seen = new Set<string>();
  let duplicateRows = 0;
  for (const row of data) {
    const key = JSON.stringify(row);
    if (seen.has(key)) {
      duplicateRows++;
    } else {
      seen.add(key);
    }
  }

  return {
    totalRows,
    totalCols,
    featureNames,
    fraudCount,
    normalCount,
    fraudRate,
    amountStats: {
      min: min(amounts),
      max: max(amounts),
      mean: mean(amounts),
      median: median(amounts),
      std: std(amounts),
    },
    timeStats: {
      min: min(times),
      max: max(times),
      mean: mean(times),
    },
    missingValues,
    duplicateRows,
    classBalance: {
      normal: normalCount,
      fraud: fraudCount,
    },
  };
}

export function computeFeatureStats(data: RawTransaction[]): FeatureStats[] {
  const featureNames = getCanonicalFeatureNames();
  const labels = data.map((d) => d.Class);
  const stats: FeatureStats[] = [];

  for (let fi = 0; fi < featureNames.length; fi++) {
    const fname = featureNames[fi];
    const values: number[] = [];
    let missing = 0;
    for (const row of data) {
      const v = row[fname as keyof RawTransaction] as number;
      if (v === null || v === undefined || Number.isNaN(v)) {
        missing++;
      } else {
        values.push(v);
      }
    }
    stats.push({
      name: fname,
      mean: mean(values),
      std: std(values),
      min: min(values),
      max: max(values),
      median: median(values),
      missing,
      fraudCorrelation: Math.abs(pearsonCorrelation(values, labels.slice(0, values.length))),
    });
  }

  return stats;
}

export function fitScaler(features: number[][]): StandardScaler {
  const nFeatures = features[0].length;
  const featureNames = getCanonicalFeatureNames();
  const means: number[] = new Array(nFeatures).fill(0);
  const stds: number[] = new Array(nFeatures).fill(1);

  for (let f = 0; f < nFeatures; f++) {
    const col: number[] = [];
    for (let r = 0; r < features.length; r++) {
      col.push(features[r][f]);
    }
    means[f] = mean(col);
    const s = std(col);
    stds[f] = s === 0 ? 1 : s; // avoid division by zero for constant features
  }

  return { means, stds, featureNames };
}

export function applyScaler(features: number[][], scaler: StandardScaler): number[][] {
  return features.map((row) =>
    row.map((v, f) => (v - scaler.means[f]) / scaler.stds[f])
  );
}

export function preprocessData(
  data: RawTransaction[],
  seed: number
): PreprocessedData {
  const steps: PreprocessingStep[] = [
    {
      id: 'load',
      title: 'Load Dataset',
      description: 'Parse CSV rows into structured transaction records',
      status: 'done',
      detail: `${data.length} rows loaded`,
    },
    {
      id: 'validate',
      title: 'Validate Data',
      description: 'Check for missing values, NaN, and duplicate rows',
      status: 'done',
    },
    {
      id: 'extract',
      title: 'Feature Extraction',
      description: 'Extract 30 features (Time, V1-V28, Amount) per transaction',
      status: 'done',
      detail: '30 features per row',
    },
    {
      id: 'standardize',
      title: 'Standardization (Z-Score)',
      description: 'Normalize each feature to mean=0, std=1 using StandardScaler',
      status: 'done',
    },
    {
      id: 'split',
      title: 'Train/Test Split',
      description: 'Shuffle and split data into training and test sets',
      status: 'done',
    },
  ];

  const rawFeatures = data.map(transactionToFeatures);
  const labels = data.map((d) => d.Class);

  const scaler = fitScaler(rawFeatures);
  const normalizedFeatures = applyScaler(rawFeatures, scaler);

  const featureStats = computeFeatureStats(data);

  const fraudCount = labels.filter((l) => l === 1).length;

  return {
    normalizedFeatures,
    labels,
    scaler,
    featureStats,
    classDistribution: {
      normal: labels.length - fraudCount,
      fraud: fraudCount,
    },
    steps,
  };
}

export function trainTestSplit(
  features: number[][],
  labels: number[],
  testSize: number,
  seed: number
): { xTrain: number[][]; yTrain: number[]; xTest: number[][]; yTest: number[]; trainFraudCount: number; testFraudCount: number } {
  const rng = mulberry32(seed);
  const indices = Array.from({ length: features.length }, (_, i) => i);
  shuffle(indices, rng);

  const testCount = Math.floor(features.length * testSize);
  const testIdx = indices.slice(0, testCount);
  const trainIdx = indices.slice(testCount);

  const xTrain = trainIdx.map((i) => features[i]);
  const yTrain = trainIdx.map((i) => labels[i]);
  const xTest = testIdx.map((i) => features[i]);
  const yTest = testIdx.map((i) => labels[i]);

  return {
    xTrain,
    yTrain,
    xTest,
    yTest,
    trainFraudCount: yTrain.filter((l) => l === 1).length,
    testFraudCount: yTest.filter((l) => l === 1).length,
  };
}
