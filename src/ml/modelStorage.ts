// ============================================================================
// Model serialization (save/load) using localStorage.
// Mirrors joblib.dump / joblib.load from the Python reference implementation.
// ============================================================================

import { TrainedModel } from './types';

const STORAGE_KEY = 'fraud_detection_model_v1';

export function saveModel(model: TrainedModel): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(model));
  } catch (e) {
    console.error('Failed to save model:', e);
  }
}

export function loadModel(): TrainedModel | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    return JSON.parse(data) as TrainedModel;
  } catch (e) {
    console.error('Failed to load model:', e);
    return null;
  }
}

export function clearModel(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function hasModel(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null;
}
