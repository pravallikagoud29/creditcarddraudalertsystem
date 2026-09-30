// ============================================================================
// Core type definitions for the Credit Card Fraud Detection ML engine
// ============================================================================

export interface RawTransaction {
  Time: number;
  V1: number;
  V2: number;
  V3: number;
  V4: number;
  V5: number;
  V6: number;
  V7: number;
  V8: number;
  V9: number;
  V10: number;
  V11: number;
  V12: number;
  V13: number;
  V14: number;
  V15: number;
  V16: number;
  V17: number;
  V18: number;
  V19: number;
  V20: number;
  V21: number;
  V22: number;
  V23: number;
  V24: number;
  V25: number;
  V26: number;
  V27: number;
  V28: number;
  Amount: number;
  Class: number;
}

export type TransactionFeatures = number[];

export interface Transaction {
  features: TransactionFeatures;
  label: number;
  amount: number;
  time: number;
}

export interface DatasetInfo {
  totalRows: number;
  totalCols: number;
  featureNames: string[];
  fraudCount: number;
  normalCount: number;
  fraudRate: number;
  amountStats: {
    min: number;
    max: number;
    mean: number;
    median: number;
    std: number;
  };
  timeStats: {
    min: number;
    max: number;
    mean: number;
  };
  missingValues: number;
  duplicateRows: number;
  classBalance: {
    normal: number;
    fraud: number;
  };
}

export interface FeatureStats {
  name: string;
  mean: number;
  std: number;
  min: number;
  max: number;
  median: number;
  missing: number;
  fraudCorrelation: number;
}

export interface PreprocessedData {
  normalizedFeatures: number[][];
  labels: number[];
  scaler: StandardScaler;
  featureStats: FeatureStats[];
  classDistribution: { normal: number; fraud: number };
  steps: PreprocessingStep[];
}

export interface PreprocessingStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'done';
  detail?: string;
}

export interface StandardScaler {
  means: number[];
  stds: number[];
  featureNames: string[];
}

export interface TrainTestSplit {
  xTrain: number[][];
  yTrain: number[];
  xTest: number[][];
  yTest: number[];
  trainFraudCount: number;
  testFraudCount: number;
}

export type ModelType = 'logistic' | 'logistic_balanced';

export interface TrainingConfig {
  modelType: ModelType;
  learningRate: number;
  iterations: number;
  testSize: number;
  randomSeed: number;
  classWeightBalanced: boolean;
  l2Regularization: number;
  threshold: number;
}

export interface TrainingProgress {
  iteration: number;
  loss: number;
  accuracy: number;
}

export interface ConfusionMatrix {
  truePositives: number;
  falsePositives: number;
  trueNegatives: number;
  falseNegatives: number;
}

export interface EvaluationMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  specificity: number;
  falsePositiveRate: number;
  auc: number;
  confusionMatrix: ConfusionMatrix;
  threshold: number;
}

export interface RocPoint {
  fpr: number;
  tpr: number;
  threshold: number;
}

export interface PrcPoint {
  recall: number;
  precision: number;
  threshold: number;
}

export interface TrainedModel {
  weights: number[];
  bias: number;
  scaler: StandardScaler;
  config: TrainingConfig;
  metrics: EvaluationMetrics;
  rocCurve: RocPoint[];
  prcCurve: PrcPoint[];
  trainingHistory: TrainingProgress[];
  featureNames: string[];
  featureImportance: { name: string; importance: number }[];
  trainedAt: number;
}

export interface PredictionInput {
  Time: number;
  Amount: number;
  V1: number;
  V2: number;
  V3: number;
  V4: number;
  V5: number;
  V6: number;
  V7: number;
  V8: number;
  V9: number;
  V10: number;
  V11: number;
  V12: number;
  V13: number;
  V14: number;
  V15: number;
  V16: number;
  V17: number;
  V18: number;
  V19: number;
  V20: number;
  V21: number;
  V22: number;
  V23: number;
  V24: number;
  V25: number;
  V26: number;
  V27: number;
  V28: number;
}

export interface PredictionResult {
  probability: number;
  isFraud: boolean;
  confidence: number;
  riskLevel: 'low' | 'medium' | 'high';
  topContributingFeatures: { name: string; value: number; contribution: number }[];
}

export interface FraudAlert {
  id: string;
  timestamp: number;
  probability: number;
  amount: number;
  riskLevel: 'low' | 'medium' | 'high';
  topFeatures: { name: string; contribution: number }[];
  timeOfDay: string;
}
