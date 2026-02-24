# 🏦 CreditScoring — Pre-CIBIL Credit Readiness Platform

> A behavior-driven, transparent alternative credit assessment framework for first-time borrowers.

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js-black?style=flat&logo=next.js)](https://nextjs.org/)
[![XGBoost](https://img.shields.io/badge/ML-XGBoost-EC6C2D?style=flat)](https://xgboost.readthedocs.io/)
[![Firebase](https://img.shields.io/badge/Auth-Firebase-FFCA28?style=flat&logo=firebase)](https://firebase.google.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 📌 Overview

Many individuals remain **credit-invisible** despite maintaining stable income and responsible financial habits. Traditional credit systems rely heavily on past borrowing records — leaving first-time borrowers without a path forward.

**CreditScoring** bridges that gap by analyzing real transaction patterns from bank statements and converting behavioral financial signals into a standardized **Credit Readiness Score (0–100)**. The output is a structured score and a downloadable certificate that users can share directly with lenders.

The platform evaluates only structured financial behavior voluntarily provided by the user. It does **not** rely on passive surveillance such as SMS scraping or device tracking.

---

## ✨ Features

- 🔐 Secure user authentication via Firebase
- 📄 Bank statement ingestion (CSV and PDF)
- 🤖 ML-powered financial behavior analysis using XGBoost
- 📊 Credit Readiness Score (0–100) with trend analysis
- 🏅 Downloadable Credit Readiness Certificate (PDF)
- 🔄 Controlled score recalculation
- 🧠 Fully explainable, rule-transparent scoring logic

---

## 🏗️ Architecture

```
CreditScoring/
├── frontend/        # Next.js application
├── backend/         # FastAPI backend
└── ml_pipeline/     # ML training & synthetic data generation
```

### System Flow

```
User (Browser)
    │
    ▼
Frontend — Next.js + Firebase Auth
    │  (ID Token)
    ▼
Backend — FastAPI + Firebase Admin Verification
    │
    ├──▶ Firestore Database (store & retrieve scores)
    │
    └──▶ ML Inference Engine (XGBoost)
              │
              └──▶ Credit Readiness Score (0–100)
```

---

## 🛠️ Technology Stack

### Frontend
| Technology | Purpose |
|---|---|
| Next.js (React 19, App Router) | UI framework |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| Framer Motion | Animations |
| Axios | HTTP client |
| Firebase Web SDK | Authentication |

### Backend
| Technology | Purpose |
|---|---|
| FastAPI | REST API framework |
| Uvicorn | ASGI server |
| Firebase Admin SDK | Token verification |
| Google Cloud Firestore | Database |
| Pandas & NumPy | Data processing |
| pypdf | PDF statement parsing |
| ReportLab | Certificate generation |

### Machine Learning
| Technology | Purpose |
|---|---|
| XGBoost Classifier | Stability prediction model |
| Scikit-learn | Preprocessing & evaluation |
| Joblib | Model serialization |
| Synthetic data generator | Training dataset creation |

---

## 🧠 ML Scoring Engine

The scoring engine uses a supervised **XGBoost classifier** trained on synthetic but behaviorally realistic banking datasets.

### Extracted Features

| Feature | Description |
|---|---|
| `income_regularity_ratio` | Consistency of monthly income credits |
| `income_volatility_index` | Variance in income amounts over time |
| `recurring_commitment_ratio` | Proportion of stable recurring payments |
| `payment_timeliness_ratio` | On-time payment behavior |
| `missed_commitment_count` | Count of missed recurring obligations |
| `transaction_variance_index` | Spending pattern unpredictability |
| `active_month_coverage_ratio` | Financial activity across observed months |

The model outputs a **probability of financial stability**, which is mapped to a standardized 0–100 Credit Readiness Score.

### Score Bands

| Score Range | Rating |
|---|---|
| 🟢 80 – 100 | Stable |
| 🟡 50 – 79 | Moderate Risk |
| 🔴 0 – 49 | High Risk |

---

## 🔒 Security & Design Principles

- All API routes require Firebase ID token verification
- No secrets committed to the repository (environment-variable driven)
- No passive data collection (no SMS scraping, no device tracking)
- Structured, auditable, and explainable scoring logic
- Score recalculation is explicitly user-initiated

---

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 18
- Python ≥ 3.10
- A Firebase project with Authentication and Firestore enabled
- Firebase service account credentials (JSON)

### Environment Setup

Create the necessary `.env` files before running the project.

**Backend (`backend/.env`)**
```env
FIREBASE_CREDENTIALS_PATH=path/to/serviceAccountKey.json
```

**Frontend (`frontend/.env.local`)**
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
```

### Running the Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`.

### Running the Frontend

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:3000`.

### Training the ML Model

```bash
cd ml_pipeline
python train_model.py
```

This generates a synthetic dataset and saves the trained XGBoost model for inference.

---

## 📂 Project Structure

```
CreditScoring/
│
├── backend/
│   ├── __pycache__/          # Python cache files
│   ├── models/               # ML models directory
│   ├── services/             # Business logic services
│   ├── __init__.py           # Package initialization
│   └── main.py               # FastAPI entry point & routes
│
├── frontend/
│   ├── .next/                # Next.js build output
│   ├── node_modules/         # npm dependencies
│   ├── public/               # Static assets
│   ├── src/                  # Source code
│   ├── .gitignore            # Git ignore rules
│   ├── eslint.config.mjs     # ESLint configuration
│   ├── next-env.d.ts         # Next.js TypeScript declarations
│   ├── next.config.ts        # Next.js configuration
│   ├── package-lock.json     # npm lock file
│   ├── package.json          # npm dependencies
│   ├── postcss.config.mjs    # PostCSS configuration
│   ├── README.md             # Frontend documentation
│   └── tsconfig.json         # TypeScript configuration
│
├── ml_pipeline/
│   ├── data/                 # Training data directory
│   ├── models/               # Trained ML models
│   ├── generate_synthetic_data.py  # Data generation script
│   └── train_model.py        # Model training script
│
├── firebase-service-account.json  # Firebase credentials
├── Project_Comprehensive_Manual.txt  # Project documentation
├── README.md                 # Main project README
└── run_backend.ps1           # PowerShell script to run backend
```

---

## 🎯 Objective

CreditScoring aims to create a **scalable, transparent, and behavior-driven** alternative credit assessment framework — enabling first-time borrowers to demonstrate financial responsibility before accessing traditional credit systems, without relying on borrowing history they don't yet have.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome. Feel free to open an issue or submit a pull request.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
