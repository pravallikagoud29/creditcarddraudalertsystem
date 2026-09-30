# Credit Card Fraud Alert System

A complete, working machine learning system that detects potentially fraudulent credit card transactions in real time.

## What This Project Does

- **Generates** a synthetic credit card transaction dataset (same structure as the ULB creditcard.csv: Time, V1-V28, Amount, Class)
- **Preprocesses** the data with standardization (z-score normalization) and train/test splitting
- **Trains** a logistic regression classifier with gradient descent, L2 regularization, and class weighting
- **Evaluates** the model with confusion matrix, ROC curve, precision-recall curve, and full metrics
- **Predicts** fraud probability for individual transactions in real time
- **Logs** flagged transactions as alerts, persisted to a Supabase database

## Architecture

### Frontend (React + Vite + TypeScript)
- **ML Engine** (`src/ml/`): Logistic regression implemented from scratch — sigmoid, binary cross-entropy loss, gradient descent, StandardScaler, train/test split, ROC/PRC/AUC computation
- **Dashboard** (`src/views/`): 7 views — Dashboard, Dataset, Preprocessing, Training, Evaluation, Prediction, Alert Monitor
- **Charts** (`src/components/charts/`): Custom SVG charts — donut, bar, line, histogram, confusion matrix (no external chart library)
- **State** (`src/store/`): React context with global app state management
- **Persistence** (`src/lib/`): Fraud alerts saved to Supabase with localStorage fallback

### Backend (Python + FastAPI)
- `backend/main.py` — FastAPI REST API with `/train`, `/predict`, `/model/info` endpoints
- `backend/generate_dataset.py` — Synthetic dataset generator (NumPy/Pandas)
- `backend/requirements.txt` — Python dependencies

### Notebook
- `notebooks/fraud_detection_experiment.ipynb` — Full ML pipeline walkthrough using scikit-learn, pandas, matplotlib, and joblib

## Running the Frontend

The dev server runs automatically. The frontend ML engine works entirely in the browser — no backend required for the dashboard to function.

## Running the Python Backend (Optional)

```bash
cd backend
pip install -r requirements.txt
python generate_dataset.py --rows 5000 --output creditcard.csv
uvicorn main:app --reload --port 8000
```

API endpoints:
- `GET /health` — health check
- `POST /train` — upload CSV to train model
- `POST /predict` — predict fraud for a transaction
- `GET /model/info` — get model metadata

## ML Pipeline

1. **Dataset** — Generate or upload CSV (Time, V1-V28, Amount, Class)
2. **Preprocessing** — StandardScaler normalization + 70/30 train/test split
3. **Training** — Logistic regression with gradient descent (configurable learning rate, iterations, L2, class weighting)
4. **Evaluation** — Accuracy, precision, recall, F1, AUC-ROC, confusion matrix, ROC/PRC curves
5. **Prediction** — Real-time fraud scoring with feature contribution analysis
6. **Alerts** — Flagged transactions logged and persisted

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS |
| Charts | Custom SVG (no external library) |
| ML Engine | TypeScript (logistic regression from scratch) |
| Backend | Python 3, FastAPI, scikit-learn, pandas, numpy |
| Model Persistence | joblib (Python), localStorage (frontend) |
| Database | Supabase (PostgreSQL) for alert history |
| Notebook | Jupyter Notebook |
