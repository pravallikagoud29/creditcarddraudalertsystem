// ============================================================================
// Global application state — React context store.
// ============================================================================

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
} from 'react';
import {
  RawTransaction,
  DatasetInfo,
  PreprocessedData,
  TrainedModel,
  TrainingConfig,
  FraudAlert,
} from '@/ml/types';
import { generateAndAnalyze, runPreprocessing, trainModel } from '@/ml/orchestrator';
import { computeDatasetInfo } from '@/ml/preprocessing';
import { saveModel, loadModel, clearModel } from '@/ml/modelStorage';
import { getAlerts, addAlert, clearAlerts } from '@/lib/alertStore';

type ViewName =
  | 'dashboard'
  | 'dataset'
  | 'preprocessing'
  | 'training'
  | 'evaluation'
  | 'prediction'
  | 'alerts';

interface AppState {
  // Navigation
  currentView: ViewName;
  setCurrentView: (v: ViewName) => void;

  // Dataset
  rawData: RawTransaction[];
  datasetInfo: DatasetInfo | null;
  isGenerating: boolean;
  generateDataset: (rows: number, fraudRate: number, seed: number) => void;
  loadCsvData: (data: RawTransaction[]) => void;

  // Preprocessing
  preprocessed: PreprocessedData | null;
  isPreprocessing: boolean;
  runPreprocessing: () => void;

  // Training
  model: TrainedModel | null;
  isTraining: boolean;
  trainingProgress: { iteration: number; loss: number; accuracy: number } | null;
  trainingConfig: TrainingConfig;
  setTrainingConfig: (c: Partial<TrainingConfig>) => void;
  train: () => Promise<void>;
  clearTrainedModel: () => void;

  // Alerts
  alerts: FraudAlert[];
  refreshAlerts: () => void;
  addNewAlert: (alert: FraudAlert) => void;
  clearAllAlerts: () => void;
}

const defaultTrainingConfig: TrainingConfig = {
  modelType: 'logistic_balanced',
  learningRate: 0.1,
  iterations: 300,
  testSize: 0.3,
  randomSeed: 42,
  classWeightBalanced: true,
  l2Regularization: 0.01,
  threshold: 0.5,
};

const AppContext = createContext<AppState | null>(null);

export function useAppState(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppState must be used within AppProvider');
  return ctx;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentView, setCurrentView] = useState<ViewName>('dashboard');
  const [rawData, setRawData] = useState<RawTransaction[]>([]);
  const [datasetInfo, setDatasetInfo] = useState<DatasetInfo | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [preprocessed, setPreprocessed] = useState<PreprocessedData | null>(null);
  const [isPreprocessing, setIsPreprocessing] = useState(false);
  const [model, setModel] = useState<TrainedModel | null>(null);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState<{ iteration: number; loss: number; accuracy: number } | null>(null);
  const [trainingConfig, setTrainingConfigState] = useState<TrainingConfig>(defaultTrainingConfig);
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);

  // Load saved model on mount
  useEffect(() => {
    const saved = loadModel();
    if (saved) setModel(saved);
    setAlerts(getAlerts());
  }, []);

  const generateDatasetData = useCallback((rows: number, fraudRate: number, seed: number) => {
    setIsGenerating(true);
    // Defer to next tick so UI can update
    setTimeout(() => {
      const { data, info } = generateAndAnalyze(rows, fraudRate, seed);
      setRawData(data);
      setDatasetInfo(info);
      setPreprocessed(null);
      setIsGenerating(false);
    }, 50);
  }, []);

  const loadCsvData = useCallback((data: RawTransaction[]) => {
    const info = computeDatasetInfo(data);
    setRawData(data);
    setDatasetInfo(info);
    setPreprocessed(null);
  }, []);

  const runPreprocessingFn = useCallback(() => {
    if (rawData.length === 0) return;
    setIsPreprocessing(true);
    setTimeout(() => {
      const result = runPreprocessing(rawData, trainingConfig.randomSeed);
      setPreprocessed(result);
      setIsPreprocessing(false);
    }, 50);
  }, [rawData, trainingConfig.randomSeed]);

  const train = useCallback(async () => {
    if (rawData.length === 0) return;
    setIsTraining(true);
    setTrainingProgress(null);
    await new Promise((resolve) => setTimeout(resolve, 50));
    const trained = trainModel(rawData, trainingConfig, {
      onProgress: (p) => setTrainingProgress(p),
    });
    setModel(trained);
    saveModel(trained);
    setIsTraining(false);
  }, [rawData, trainingConfig]);

  const clearTrainedModel = useCallback(() => {
    clearModel();
    setModel(null);
  }, []);

  const setTrainingConfig = useCallback((c: Partial<TrainingConfig>) => {
    setTrainingConfigState((prev) => ({ ...prev, ...c }));
  }, []);

  const refreshAlerts = useCallback(() => {
    setAlerts(getAlerts());
  }, []);

  const addNewAlert = useCallback((alert: FraudAlert) => {
    addAlert(alert);
    setAlerts(getAlerts());
  }, []);

  const clearAllAlerts = useCallback(() => {
    clearAlerts();
    setAlerts([]);
  }, []);

  return (
    <AppContext.Provider
      value={{
        currentView,
        setCurrentView,
        rawData,
        datasetInfo,
        isGenerating,
        generateDataset: generateDatasetData,
        loadCsvData,
        preprocessed,
        isPreprocessing,
        runPreprocessing: runPreprocessingFn,
        model,
        isTraining,
        trainingProgress,
        trainingConfig,
        setTrainingConfig,
        train,
        clearTrainedModel,
        alerts,
        refreshAlerts,
        addNewAlert,
        clearAllAlerts,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
