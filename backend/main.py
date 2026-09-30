"""
Credit Card Fraud Detection - FastAPI Backend
=============================================

A REST API that loads a trained scikit-learn model and serves fraud predictions.

Requirements:
    pip install fastapi uvicorn pandas numpy scikit-learn joblib python-multipart

Usage:
    uvicorn main:app --reload --port 8000

Endpoints:
    GET  /              - API info
    GET  /health        - Health check
    POST /train         - Train model from uploaded CSV
    POST /predict       - Predict fraud for a single transaction
    GET  /model/info    - Get trained model metadata
"""

import io
import os
import json
import time
from typing import Optional

import numpy as np
import pandas as pd
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, roc_auc_score
)
import joblib

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
os.makedirs(MODEL_DIR, exist_ok=True)

MODEL_PATH = os.path.join(MODEL_DIR, "fraud_model.joblib")
SCALER_PATH = os.path.join(MODEL_DIR, "scaler.joblib")
META_PATH = os.path.join(MODEL_DIR, "metadata.json")

FEATURE_COLUMNS = [f"V{i}" for i in range(1, 29)] + ["Amount"]
TIME_COLUMN = "Time"
LABEL_COLUMN = "Class"

# ---------------------------------------------------------------------------
# FastAPI App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Credit Card Fraud Detection API",
    description="ML-powered fraud detection using logistic regression",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Request / Response Models
# ---------------------------------------------------------------------------

class TransactionInput(BaseModel):
    Time: float
    V1: float = 0.0
    V2: float = 0.0
    V3: float = 0.0
    V4: float = 0.0
    V5: float = 0.0
    V6: float = 0.0
    V7: float = 0.0
    V8: float = 0.0
    V9: float = 0.0
    V10: float = 0.0
    V11: float = 0.0
    V12: float = 0.0
    V13: float = 0.0
    V14: float = 0.0
    V15: float = 0.0
    V16: float = 0.0
    V17: float = 0.0
    V18: float = 0.0
    V19: float = 0.0
    V20: float = 0.0
    V21: float = 0.0
    V22: float = 0.0
    V23: float = 0.0
    V24: float = 0.0
    V25: float = 0.0
    V26: float = 0.0
    V27: float = 0.0
    V28: float = 0.0
    Amount: float = 0.0


class PredictionResponse(BaseModel):
    probability: float
    is_fraud: bool
    risk_level: str
    confidence: float


class TrainResponse(BaseModel):
    status: str
    metrics: dict
    rows_trained: int


# ---------------------------------------------------------------------------
# Model Loading
# ---------------------------------------------------------------------------

def load_model():
    """Load the trained model, scaler, and metadata from disk."""
    if not os.path.exists(MODEL_PATH):
        return None, None, None
    model = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)
    metadata = None
    if os.path.exists(META_PATH):
        with open(META_PATH, "r") as f:
            metadata = json.load(f)
    return model, scaler, metadata


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/")
def root():
    return {
        "name": "Credit Card Fraud Detection API",
        "version": "1.0.0",
        "endpoints": ["/health", "/train", "/predict", "/model/info"],
    }


@app.get("/health")
def health():
    model, scaler, _ = load_model()
    return {
        "status": "healthy",
        "model_loaded": model is not None,
    }


@app.post("/train", response_model=TrainResponse)
async def train(file: UploadFile = File(...)):
    """Train a logistic regression model from an uploaded CSV file."""
    content = await file.read()
    df = pd.read_csv(io.BytesIO(content))

    if LABEL_COLUMN not in df.columns:
        raise HTTPException(status_code=400, detail=f"CSV must contain '{LABEL_COLUMN}' column")

    X = df[FEATURE_COLUMNS].values
    y = df[LABEL_COLUMN].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.3, random_state=42, stratify=y
    )

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    model = LogisticRegression(
        class_weight="balanced",
        max_iter=1000,
        random_state=42,
    )
    model.fit(X_train_scaled, y_train)

    y_pred = model.predict(X_test_scaled)
    y_prob = model.predict_proba(X_test_scaled)[:, 1]

    metrics = {
        "accuracy": float(accuracy_score(y_test, y_pred)),
        "precision": float(precision_score(y_test, y_pred, zero_division=0)),
        "recall": float(recall_score(y_test, y_pred, zero_division=0)),
        "f1_score": float(f1_score(y_test, y_pred, zero_division=0)),
        "auc_roc": float(roc_auc_score(y_test, y_prob)),
        "confusion_matrix": confusion_matrix(y_test, y_pred).tolist(),
    }

    joblib.dump(model, MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)
    with open(META_PATH, "w") as f:
        json.dump({
            "trained_at": time.time(),
            "rows": len(df),
            "features": FEATURE_COLUMNS,
            "metrics": metrics,
        }, f, indent=2)

    return TrainResponse(
        status="trained",
        metrics=metrics,
        rows_trained=len(df),
    )


@app.post("/predict", response_model=PredictionResponse)
def predict(tx: TransactionInput):
    """Predict fraud probability for a single transaction."""
    model, scaler, _ = load_model()
    if model is None:
        raise HTTPException(status_code=404, detail="No trained model. POST to /train first.")

    features = np.array([[
        tx.V1, tx.V2, tx.V3, tx.V4, tx.V5, tx.V6, tx.V7, tx.V8,
        tx.V9, tx.V10, tx.V11, tx.V12, tx.V13, tx.V14, tx.V15,
        tx.V16, tx.V17, tx.V18, tx.V19, tx.V20, tx.V21, tx.V22,
        tx.V23, tx.V24, tx.V25, tx.V26, tx.V27, tx.V28, tx.Amount,
    ]])

    features_scaled = scaler.transform(features)
    probability = float(model.predict_proba(features_scaled)[0, 1])

    is_fraud = probability >= 0.5
    if probability >= 0.75:
        risk_level = "high"
    elif probability >= 0.4:
        risk_level = "medium"
    else:
        risk_level = "low"

    confidence = abs(probability - 0.5) * 2

    return PredictionResponse(
        probability=probability,
        is_fraud=is_fraud,
        risk_level=risk_level,
        confidence=confidence,
    )


@app.get("/model/info")
def model_info():
    """Return metadata about the currently trained model."""
    _, _, metadata = load_model()
    if metadata is None:
        raise HTTPException(status_code=404, detail="No trained model found.")
    return metadata


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
