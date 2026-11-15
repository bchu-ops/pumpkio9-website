# In-depth File Structure
```text
SpeedDemon/
├── .github/workflows/			# AUTOMATION (CI/CD)
│	├── ci.yml					# Continuous Integration pipeline (linting, testing, Docker builds)
│	├── deploy.yml				# Deployment pipeline (builds images, pushes to Docker Hub, deploys to Kubernetes)
│	└── pages.yml				# GitHub Pages deployment (builds and deploys frontend)
├── backend/					# Backend Python Service
│	├── notebooks/				# Research & EDA
│	│	└── eda/				# Exploratory data analysis notebooks
│	├── data/					# Data storage directory (medallion architecture)
│	│	├── .cache/				# Cached data files (temporary storage for intermediate processing)
│	│	├── bronze/				# Raw, unprocessed data from sources (as-is from extract)
│	│	├──	silver/				# Cleaned and validated data (after transform operations)
│	│	└── gold/				# Business-ready, aggregated data (feature-engineered for ML) 
│	├── src/					# Source code
│	│	├── data_pipeline/		# E-L-T Engine
│	│	│	├── extract.py		# Pulls from Kafka/APIs/DBs/Caches/LocalData
│	│	│	├── load.py			# Dumps raw files to Bronze
│	│	│	└── transform.py	# Complex cleaning (Silver) & Feature prep (Gold)
│	│	├── ml/					# THE INTELLIGENCE LAYER (Machine Learning)
│	│	│	├── features.py		# Converts Gold data to Tensors/ML-ready arrays
│	│	│	├── model_logic.py	# Model architectures (Ridge, Lasso, etc.)
│	│	│	└── train.py		# Training loops & Hyperparameter tuning (L1/L2)
│	│	├── warehouse/			# THE SQL LAYER (Analytics & KPIs)
│	│	│	├── schema.sql		# DuckDB table definitions
│	│	│	└── models.sql		# SQL-based business logic/joins
│	│	└── main.py			# Backend entry point

│	├── tests/					# Unit Testing
│	│	├── data_pipeline/		# ETL tests
│	│	└── cloud_services/		# Cloud integration tests
│	└── pyproject.toml			# Backend dependencies
├── frontend/					# Frontend React Application
│	├── src/					# Source code
│	│	├── components/			# Reusable UI components (Header, Footer)
│	│	├── pages/				# Page components (Home)
│	│	├── services/			# API client functions
│	│	├── App.jsx				# Main app component
│	│	├── main.jsx			# React entry point
│	│	└── *.css				# Component and global styles
│	├── reports/				# Reports directory (preserved)
│	├── index.html				# HTML entry point
│	├── vite.config.js			# Vite configuration
│	├── package.json			# Frontend dependencies
│	└── package-lock.json		# Locked dependency versions
├── deploy/						# Infrastructure & Automation
│   ├── Dockerfile.backend		# Backend multi-stage production recipe
│   ├── Dockerfile.frontend		# Frontend production build recipe
│   ├── docker-compose.yml		# Service orchestration (backend, frontend, notebook)
│   ├── .dockerignore			# Docker build exclusion rules
│   ├── k8s-deployment.yml		# Kubernetes Deployment (Pods/Replicas)
│   └── k8s-service.yml		# Kubernetes Networking (LoadBalancer)
├── docs/						# Architectural decisions (ADRs) & API docs
│	├── data_architecture.md	# Visualizes data flow from source to Gold layer
│	├── file_structure.md		# Defines folder hierarchy and naming conventions
│	├── ml_architecture.md		# Maps model training and feature engineering logic
│	├── naming_conventions.md	# Naming conventions for data, models, notebooks, and reports
│	├── reports.md				# Catalogs generated insights and stakeholder KPIs
│	├── SETUP.md				# Step-by-step local environment installation guide
│	├── to_do.md				# Tasks left to do
│	└── workflows.md			# Documents CI/CD and automated pipeline schedules
├── .env.example				# Example environment variable file
├── .gitignore					# Git ignore rules (__pycache__, .env, .venv, .DS_Store, node_modules, etc.)
├── Makefile					# Project management commands (build, up, dev, etc.)
├── README.md					# Project overview and documentation links
├── setup.sh					# Local environment setup script (uv, jq, Docker, Python, .env, Kubernetes(optional))
├── pyproject.toml				# Root workspace configuration and dependencies
└── uv.lock					# Dependency lock file for reproducible environments

```

## 🚀 Quick Start - Running the Application

### Docker (Recommended)

```bash
# Setup environment
./setup.sh

# Start all services
make up

# Or start in development mode
make dev

# Or start specific services
make dev frontend backend
```

**Access Services:**
```
═══════════════════════════════════════════════════════════════
VIEW YOUR SERVICES AT (LOCAL DEVELOPMENT):
═══════════════════════════════════════════════════════════════
FRONTEND (UI):    http://localhost:3000
BACKEND (API):    http://localhost:8000
NOTEBOOK (ML):    http://localhost:8888
═══════════════════════════════════════════════════════════════
```

### Local Development (Without Docker)

**Backend:**
```bash
# From project root
make sync  # Syncs dependencies with --all-packages
uv run python backend/src/main.py
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Access Services:**
```
═══════════════════════════════════════════════════════════════
VIEW YOUR SERVICES AT (LOCAL DEVELOPMENT):
═══════════════════════════════════════════════════════════════
FRONTEND (UI):    http://localhost:3000
BACKEND (API):    http://localhost:8000
═══════════════════════════════════════════════════════════════
```

### Production Deployment

**GitHub Pages (Frontend):**
```
═══════════════════════════════════════════════════════════════
VIEW YOUR DEPLOYED WEBSITE (GITHUB PAGES):
═══════════════════════════════════════════════════════════════
PRODUCTION SITE:  https://bchu-ops.github.io/speeddemon/
═══════════════════════════════════════════════════════════════
```

**Base Path:** The frontend automatically uses `/speeddemon/` as the base path for GitHub Pages (configured in `frontend/vite.config.js`).
