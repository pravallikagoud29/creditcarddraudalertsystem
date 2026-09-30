import { AppProvider, useAppState } from '@/store/AppState';
import { Sidebar } from '@/components/Sidebar';
import { DashboardView } from '@/views/DashboardView';
import { DatasetView } from '@/views/DatasetView';
import { PreprocessingView } from '@/views/PreprocessingView';
import { TrainingView } from '@/views/TrainingView';
import { EvaluationView } from '@/views/EvaluationView';
import { PredictionView } from '@/views/PredictionView';
import { AlertsView } from '@/views/AlertsView';

function MainContent() {
  const { currentView } = useAppState();

  switch (currentView) {
    case 'dashboard':
      return <DashboardView />;
    case 'dataset':
      return <DatasetView />;
    case 'preprocessing':
      return <PreprocessingView />;
    case 'training':
      return <TrainingView />;
    case 'evaluation':
      return <EvaluationView />;
    case 'prediction':
      return <PredictionView />;
    case 'alerts':
      return <AlertsView />;
    default:
      return <DashboardView />;
  }
}

function App() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-ink-950 flex">
        <Sidebar />
        <main className="flex-1 overflow-x-hidden">
          <div className="max-w-7xl mx-auto p-6 lg:p-8">
            <MainContent />
          </div>
        </main>
      </div>
    </AppProvider>
  );
}

export default App;
