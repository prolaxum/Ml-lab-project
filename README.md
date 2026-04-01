# Network Anomaly Detector

A full-stack intrusion detection project that uses machine learning to classify network traffic and visualize threats in a live dashboard.

## Overview

This project combines:

- A `Next.js` frontend dashboard for live monitoring and traffic simulation
- A `FastAPI` backend for prediction, analytics, and model metrics
- A Python ML pipeline trained on the `NSL-KDD` dataset
- A local `SQLite` database for storing traffic event history

The application predicts whether a packet or traffic sample is:

- `Safe`
- `Probe (Scanning)`
- `DoS Attack`
- `R2L (Unauthorized Access)`
- `U2R (Superuser Hijack)`
- `Unknown Attack`

## Project Structure

```text
Ml-lab-project/
+-- network-anomaly-detector/
    +-- frontend/              # Next.js monitoring dashboard
    +-- backend/               # FastAPI API and SQLite logging
    +-- ml_pipeline/           # Training notebooks, dataset, saved models
```

## Features

- Real-time threat dashboard built with `Next.js` and `Recharts`
- Simulated attack injection buttons for Safe, DoS, Probe, R2L, and U2R traffic
- FastAPI prediction endpoint for network packet classification
- Analytics endpoint for live timeline and threat distribution charts
- Stored traffic logs in SQLite for recent activity tracking
- Model performance metrics exposed to the UI
- Training pipeline using a `RandomForestClassifier`

## Tech Stack

### Frontend

- `Next.js 16`
- `React 19`
- `TypeScript`
- `Tailwind CSS`
- `Recharts`

### Backend

- `FastAPI`
- `SQLAlchemy`
- `Pydantic`
- `SQLite`
- `NumPy`
- `Joblib`

### ML Pipeline

- `Pandas`
- `scikit-learn`
- `NSL-KDD` dataset

## How It Works

The model is trained using four numeric traffic features:

- `duration`
- `src_bytes`
- `dst_bytes`
- `count`

The backend loads the trained model from:

`network-anomaly-detector/ml_pipeline/scripts/anomaly_model.pkl`

When the frontend sends a packet profile to the backend:

1. The backend predicts the traffic class.
2. The result is stored in `SQLite`.
3. The dashboard refreshes analytics every 2 seconds.
4. Charts update with the latest event distribution and timeline.

## Local Setup

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd Ml-lab-project
```

### 2. Frontend setup

```bash
cd network-anomaly-detector/frontend
npm install
npm run dev
```

The frontend runs on:

`http://localhost:3000`

### 3. Backend setup

Open a second terminal and run:

```bash
cd network-anomaly-detector/backend/app
python -m pip install fastapi uvicorn sqlalchemy pydantic joblib numpy scikit-learn pandas
python -m uvicorn main:app --reload --port 8000
```

The backend runs on:

`http://localhost:8000`

Note: the current backend code loads the model using a relative path, so running `uvicorn` from `network-anomaly-detector/backend/app` is the safest option.

## API Endpoints

### `POST /api/predict`

Classifies a traffic sample.

Example request body:

```json
{
  "duration": 0.0,
  "src_bytes": 491.0,
  "dst_bytes": 0.0,
  "count": 2.0
}
```

Example response:

```json
{
  "status": "Safe"
}
```

### `GET /api/analytics`

Returns recent traffic logs formatted for the dashboard charts.

### `GET /api/model-stats`

Returns saved model performance metrics from `model_metrics.json`.

## Model Training

To retrain the model:

```bash
cd network-anomaly-detector/ml_pipeline/scripts
python train_model.py
```

This script:

- Loads the NSL-KDD training dataset
- Maps raw attack labels into higher-level threat categories
- Trains a multiclass `RandomForestClassifier`
- Saves the model as `anomaly_model.pkl`
- Saves evaluation metrics as `model_metrics.json`

## Dataset

The training data used in this project is the `NSL-KDD` dataset, included in:

`network-anomaly-detector/ml_pipeline/data/KDDTrain+.txt`

## Current Notes

- The frontend currently expects the backend at `http://localhost:8000`
- The backend uses permissive CORS for local development
- The SQLite database file is stored in `network-anomaly-detector/backend/app/network_logs.db`
- The backend `requirements.txt` is currently empty, so dependency installation is documented above directly

## Future Improvements

- Add a populated backend `requirements.txt`
- Add Docker support for one-command startup
- Use environment variables for API base URLs and model paths
- Add authentication and role-based access for the dashboard
- Extend the model with more network traffic features
- Add automated tests for API and UI behavior

## Screens and Workflow

The dashboard includes:

- Threat distribution pie chart
- Temporal anomaly heartbeat chart
- Static ROC-style visualization
- Feature weight visualization
- Recent traffic event table
- Simulation buttons for different attack profiles

## License

Add a license here if you plan to publish or open-source the project.
