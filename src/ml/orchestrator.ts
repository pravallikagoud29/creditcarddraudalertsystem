// ============================================================================
// Model orchestration — ties together dataset generation, preprocessing,
// training, and evaluation into a single callable pipeline.
// ============================================================================

import {
  RawTransaction,
  DatasetInfo,
  PreprocessedData,
  TrainingConfig,
  TrainedModel,
  TrainingProgress,
  FeatureStats,
} from './types';
import { generateDataset, getCanonicalFeatureNames } from './dataset';
import { computeDatasetInfo, preprocessData, trainTestSplit } from './preprocessing';
import { trainLogisticRegression, computeMetrics, computeRocCurve, computePrcCurve, predictProba } from './logistic';

export function generateAndAnalyze(
  totalRows: number,
  fraudRate: number,
  seed: number
): { data: RawTransaction[]; info: DatasetInfo } {
  const data = generateDataset(totalRows, fraudRate, seed);
  const info = computeDatasetInfo(data);
  return { data, info };
}

export function runPreprocessing(
  data: RawTransaction[],
  seed: number
): PreprocessedData {
  return preprocessData(data, seed);
}

export interface TrainingCallbacks {
  onProgress?: (p: TrainingProgress) => void;
}

export function trainModel(
  data: RawTransaction[],
  config: TrainingConfig,
  callbacks: TrainingCallbacks = {}
): TrainedModel {
  const preprocessed = preprocessData(data, config.randomSeed);
  const split = trainTestSplit(
    preprocessed.normalizedFeatures,
    preprocessed.labels,
    config.testSize,
    config.randomSeed
  );

  const { weights, bias, history } = trainLogisticRegression(
    split.xTrain,
    split.yTrain,
    config,
    callbacks.onProgress
  );

  // Predict on test set
  const yProb = split.xTest.map((x) => predictProba(x, weights, bias));
  const metrics = computeMetrics(split.yTest, yProb, config.threshold);
  const rocCurve = computeRocCurve(split.yTest, yProb);
  const prcCurve = computePrcCurve(split.yTest, yProb);

  // Feature importance = absolute weight value
  const featureNames = getCanonicalFeatureNames();
  const featureImportance = weights.map((w, i) => ({
    name: featureNames[i] || `F${i}`,
    importance: Math.abs(w),
  }));
  featureImportance.sort((a, b) => b.importance - a.importance);

  return {
    weights,
    bias,
    scaler: preprocessed.scaler,
    config,
    metrics,
    rocCurve,
    prcCurve,
    trainingHistory: history,
    featureNames,
    featureImportance,
    trainedAt: Date.now(),
  };
}

export { computeFeatureStats } from './preprocessing';
export type { FeatureStats };
