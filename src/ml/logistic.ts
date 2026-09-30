// ============================================================================
// Logistic Regression — implemented from scratch (gradient descent).
//
// This is a real, working logistic regression classifier with:
//   - Sigmoid activation
//   - Binary cross-entropy loss
//   - L2 regularization
//   - Optional class weighting (balanced) to handle imbalanced fraud datasets
//   - Configurable learning rate, iterations, and decision threshold
//
// It trains on the standardized feature matrix and produces weights + bias
// that can be used for prediction. This mirrors scikit-learn's
// LogisticRegression(solver='lbfgs', class_weight='balanced') conceptually.
// ============================================================================

import {
  TrainingConfig,
  TrainingProgress,
  ConfusionMatrix,
  EvaluationMetrics,
  RocPoint,
  PrcPoint,
} from './types';

export function sigmoid(z: number): number {
  if (z >= 0) {
    return 1 / (1 + Math.exp(-z));
  }
  const ez = Math.exp(z);
  return ez / (1 + ez);
}

export function predictProba(
  features: number[],
  weights: number[],
  bias: number
): number {
  let z = bias;
  for (let i = 0; i < features.length; i++) {
    z += features[i] * weights[i];
  }
  return sigmoid(z);
}

export function trainLogisticRegression(
  xTrain: number[][],
  yTrain: number[],
  config: TrainingConfig,
  onProgress?: (p: TrainingProgress) => void
): { weights: number[]; bias: number; history: TrainingProgress[] } {
  const nSamples = xTrain.length;
  const nFeatures = xTrain[0].length;

  let weights = new Array(nFeatures).fill(0);
  let bias = 0;

  // Class weights for balanced mode
  let weightPos = 1.0;
  let weightNeg = 1.0;
  if (config.classWeightBalanced) {
    const nPos = yTrain.filter((y) => y === 1).length;
    const nNeg = nSamples - nPos;
    if (nPos > 0 && nNeg > 0) {
      weightPos = nSamples / (2 * nPos);
      weightNeg = nSamples / (2 * nNeg);
    }
  }

  const history: TrainingProgress[] = [];
  const lr = config.learningRate;
  const l2 = config.l2Regularization;

  for (let iter = 0; iter < config.iterations; iter++) {
    let totalLoss = 0;
    let correct = 0;

    // Gradients
    const gradW = new Array(nFeatures).fill(0);
    let gradB = 0;

    for (let i = 0; i < nSamples; i++) {
      const xi = xTrain[i];
      const yi = yTrain[i];
      const prob = predictProba(xi, weights, bias);
      const w = yi === 1 ? weightPos : weightNeg;

      // Loss: weighted binary cross-entropy
      const eps = 1e-12;
      const p = Math.min(Math.max(prob, eps), 1 - eps);
      totalLoss += w * (-(yi * Math.log(p) + (1 - yi) * Math.log(1 - p)));

      // Prediction for accuracy
      if ((prob >= 0.5 ? 1 : 0) === yi) correct++;

      // Gradient: dL/dz = (prob - yi) * weight
      const dz = (prob - yi) * w;

      for (let f = 0; f < nFeatures; f++) {
        gradW[f] += dz * xi[f];
      }
      gradB += dz;
    }

    // Average gradients
    for (let f = 0; f < nFeatures; f++) {
      gradW[f] = gradW[f] / nSamples + l2 * weights[f];
    }
    gradB = gradB / nSamples;

    // Update weights
    for (let f = 0; f < nFeatures; f++) {
      weights[f] -= lr * gradW[f];
    }
    bias -= lr * gradB;

    const avgLoss = totalLoss / nSamples;
    const accuracy = correct / nSamples;

    if (iter % 10 === 0 || iter === config.iterations - 1) {
      const progress: TrainingProgress = {
        iteration: iter + 1,
        loss: avgLoss,
        accuracy,
      };
      history.push(progress);
      onProgress?.(progress);
    }
  }

  return { weights, bias, history };
}

export function evaluatePredictions(
  yTrue: number[],
  yPred: number[]
): ConfusionMatrix {
  let tp = 0, fp = 0, tn = 0, fn = 0;
  for (let i = 0; i < yTrue.length; i++) {
    if (yPred[i] === 1 && yTrue[i] === 1) tp++;
    else if (yPred[i] === 1 && yTrue[i] === 0) fp++;
    else if (yPred[i] === 0 && yTrue[i] === 0) tn++;
    else fn++;
  }
  return { truePositives: tp, falsePositives: fp, trueNegatives: tn, falseNegatives: fn };
}

export function computeMetrics(
  yTrue: number[],
  yProb: number[],
  threshold: number
): EvaluationMetrics {
  const yPred = yProb.map((p) => (p >= threshold ? 1 : 0));
  const cm = evaluatePredictions(yTrue, yPred);

  const accuracy = yTrue.length > 0
    ? (cm.truePositives + cm.trueNegatives) / yTrue.length
    : 0;
  const precision = cm.truePositives + cm.falsePositives > 0
    ? cm.truePositives / (cm.truePositives + cm.falsePositives)
    : 0;
  const recall = cm.truePositives + cm.falseNegatives > 0
    ? cm.truePositives / (cm.truePositives + cm.falseNegatives)
    : 0;
  const f1Score = precision + recall > 0
    ? (2 * precision * recall) / (precision + recall)
    : 0;
  const specificity = cm.trueNegatives + cm.falsePositives > 0
    ? cm.trueNegatives / (cm.trueNegatives + cm.falsePositives)
    : 0;
  const fpr = cm.trueNegatives + cm.falsePositives > 0
    ? cm.falsePositives / (cm.trueNegatives + cm.falsePositives)
    : 0;

  const auc = computeAuc(yTrue, yProb);

  return {
    accuracy,
    precision,
    recall,
    f1Score,
    specificity,
    falsePositiveRate: fpr,
    auc,
    confusionMatrix: cm,
    threshold,
  };
}

// ROC curve: sweep threshold from 1.0 to 0.0
export function computeRocCurve(
  yTrue: number[],
  yProb: number[]
): RocPoint[] {
  const sorted = [...yProb].sort((a, b) => b - a);
  const points: RocPoint[] = [];
  const thresholds = [1.01, ...sorted, -0.01];

  for (const threshold of thresholds) {
    let tp = 0, fp = 0, tn = 0, fn = 0;
    for (let i = 0; i < yTrue.length; i++) {
      const pred = yProb[i] >= threshold ? 1 : 0;
      if (pred === 1 && yTrue[i] === 1) tp++;
      else if (pred === 1 && yTrue[i] === 0) fp++;
      else if (pred === 0 && yTrue[i] === 0) tn++;
      else fn++;
    }
    const tpr = tp + fn > 0 ? tp / (tp + fn) : 0;
    const fpr = fp + tn > 0 ? fp / (fp + tn) : 0;
    points.push({ fpr, tpr, threshold });
  }

  return points;
}

// Precision-Recall curve
export function computePrcCurve(
  yTrue: number[],
  yProb: number[]
): PrcPoint[] {
  const sorted = [...yProb].sort((a, b) => b - a);
  const points: PrcPoint[] = [];
  const thresholds = [1.01, ...sorted, -0.01];

  for (const threshold of thresholds) {
    let tp = 0, fp = 0, fn = 0;
    for (let i = 0; i < yTrue.length; i++) {
      const pred = yProb[i] >= threshold ? 1 : 0;
      if (pred === 1 && yTrue[i] === 1) tp++;
      else if (pred === 1 && yTrue[i] === 0) fp++;
      else fn++;
    }
    const precision = tp + fp > 0 ? tp / (tp + fp) : 1;
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
    points.push({ recall, precision, threshold });
  }

  return points;
}

// AUC via trapezoidal rule on the ROC curve
export function computeAuc(yTrue: number[], yProb: number[]): number {
  const roc = computeRocCurve(yTrue, yProb);
  // Sort by FPR ascending
  const sorted = [...roc].sort((a, b) => a.fpr - b.fpr);
  let area = 0;
  for (let i = 1; i < sorted.length; i++) {
    const dx = sorted[i].fpr - sorted[i - 1].fpr;
    area += (dx * (sorted[i].tpr + sorted[i - 1].tpr)) / 2;
  }
  return Math.max(0, Math.min(1, area));
}
