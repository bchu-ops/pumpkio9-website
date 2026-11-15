# SpeedDemon Backend

<!-- Purpose: Add your purpose statement here -->

## Overview

Python backend service for the SpeedDemon kart racing optimization platform. This backend handles data pipeline operations (ETL), machine learning inference, and provides API endpoints for the frontend.

## Architecture

The backend is organized into several key modules:

- **Data Pipeline**: Extract, Transform, Load (ETL) operations for racing telemetry data
- **Machine Learning**: Feature engineering, model training, and inference
- **Warehouse**: SQL schemas and data models for analytics
- **API**: RESTful endpoints (FastAPI - when implemented)

## Prerequisites

- **Python**: Version 3.10 or higher
- **uv**: Python package manager (installed via `./setup.sh`)
- **Docker**: For containerized development (optional)

## Installation

### Using Docker (Recommended)

The backend is containerized and managed through the root Makefile:

```bash
# From project root
make backend-build  # Build the backend image
make backend-up     # Start the backend service
```

### Local Development

1. Ensure you're in the project root:
   ```bash
   cd /path/to/SpeedDemon
   ```

2. Sync dependencies using uv (must use --all-packages to install workspace member dependencies):
   ```bash
   uv sync --all-packages
   # Or use the Makefile command
   make sync
   ```

3. Run the backend:
   ```bash
   uv run python backend/src/main.py
   ```

## Project Structure

```
backend/
├── src/
│   ├── data_pipeline/      # ETL operations
│   │   ├── extract.py      # Data extraction from sources
│   │   ├── load.py         # Data loading to storage
│   │   └── transform.py     # Data transformation and cleaning
│   ├── ml/                  # Machine learning
│   │   ├── features.py     # Feature engineering
│   │   ├── model_logic.py  # Model architectures
│   │   └── train.py        # Training pipelines
│   ├── warehouse/           # Data warehouse
│   │   ├── schema.sql      # Database schema definitions
│   │   └── models.sql      # SQL business logic and queries
│   └── main.py             # Backend entry point
├── data/                    # Data storage (medallion architecture)
│   ├── .cache/              # Cached intermediate data files
│   ├── bronze/              # Raw, unprocessed data (as-is from extract)
│   ├── silver/              # Cleaned and validated data (after transform)
│   └── gold/                # Business-ready, feature-engineered data (for ML)
├── notebooks/               # Jupyter notebooks for research
│   └── eda/                # Exploratory data analysis
├── tests/                   # Unit tests
│   ├── data_pipeline/      # ETL tests
│   └── cloud_services/     # Cloud integration tests
└── pyproject.toml          # Backend dependencies
```

## Dependencies

### Core Dependencies

- **fastapi**: Web framework for building APIs (when implemented)
- **uvicorn**: ASGI server for FastAPI
- **pandas**: Data manipulation and analysis
- **scikit-learn**: Machine learning algorithms
- **boto3**: AWS S3 integration for data storage
- **mlflow**: MLOps and model tracking
- **jupyter**: Notebook environment for research

### Development Dependencies

- **pytest**: Testing framework
- **ruff**: Fast Python linter
- **deptry**: Dependency management tool

## Running the Backend

### Option 1: Using Docker (Recommended)

From the project root:

```bash
# Build the backend image
make backend-build

# Start backend only (detached)
make backend-up

# Start backend in development mode (foreground with logs)
make dev-backend

# Start all services (backend + frontend + notebook)
make up

# Development mode with hot reload for all services
make dev

# ═══════════════════════════════════════════════════════════════
# VIEW YOUR SERVICES AT (LOCAL DEVELOPMENT):
# ═══════════════════════════════════════════════════════════════
# BACKEND (API):    http://localhost:8000
# NOTEBOOK (ML):    http://localhost:8888
# ═══════════════════════════════════════════════════════════════
```

### Option 2: Local Development (Without Docker)

**Requirements:**
- Python 3.10+
- uv (Python package manager)

```bash
# From project root, sync workspace dependencies (must use --all-packages)
uv sync --all-packages
# Or use the Makefile command
make sync

# Run the main application
uv run python backend/src/main.py

# Or run specific modules
uv run python -m backend.src.data_pipeline.extract

# ═══════════════════════════════════════════════════════════════
# VIEW YOUR SERVICES AT (LOCAL DEVELOPMENT):
# ═══════════════════════════════════════════════════════════════
# BACKEND (API):    http://localhost:8000 (if FastAPI server is running)
# ═══════════════════════════════════════════════════════════════
```

### Jupyter Notebook

Access the Jupyter notebook environment:

```bash
# Start notebook service (Docker)
make dev-notebook

# Get the login URL
make notebook-url

# ═══════════════════════════════════════════════════════════════
# VIEW YOUR SERVICES AT (LOCAL DEVELOPMENT):
# ═══════════════════════════════════════════════════════════════
# NOTEBOOK (ML):    http://localhost:8888
# ═══════════════════════════════════════════════════════════════
```

## Development Workflow

1. **Sync Dependencies**: Run `make sync` or `uv sync --all-packages` after pulling changes
2. **Run Tests**: Use `make test` or `uv run pytest backend/tests/`
3. **Lint Code**: Use `make lint` or `uv run ruff check backend`
4. **Add Dependencies**: Use `make add PKG=package-name` or `uv add --package speeddemon-backend package-name`

**Quick Commands:**
```bash
# Start backend in Docker
make dev-backend

# View logs
make dev-logs

# Open shell in container
make shell

# Stop services
make dev-down
```

## API Endpoints

When FastAPI is implemented, the backend will expose:

- `GET /health`: Health check endpoint
- `GET /api/pipeline/status`: Data pipeline status
- `POST /api/ml/predict`: ML model predictions
- `GET /api/reports`: Generated reports

## Environment Variables

Configure the backend using environment variables in `.env`:

```env
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-5.1
ENV=development
DEBUG=True
```

## Testing

Run tests using pytest:

```bash
# Run all tests
make test

# Run tests with coverage
make test-cov

# Run tests locally
uv run pytest backend/tests/
```

## Code Quality

### Linting

```bash
# Run ruff linter
make lint

# Or manually
uv run ruff check backend
```

### Dependency Management

```bash
# Auto-detect missing imports
make sync

# Add a new package
make add PKG=package-name
```

## Data Pipeline

The ETL pipeline consists of three stages:

1. **Extract**: Pull data from sources (Kafka, APIs, databases, S3)
2. **Transform**: Clean, validate, and prepare data for analysis
3. **Load**: Store processed data in the data warehouse (Bronze/Silver/Gold layers)

### Data Storage Architecture (Medallion Pattern)

The `backend/data/` directory follows a medallion architecture pattern:

- **bronze/**: Raw, unprocessed data files exactly as received from sources. Files are stored with timestamps and source identifiers (e.g., `20240315_fastf1_laps.parquet`).
- **silver/**: Cleaned and validated data after transformation operations. Data is deduplicated, type-corrected, and ready for analysis.
- **gold/**: Business-ready, aggregated data with feature engineering applied. This layer contains ML-ready features and business metrics.
- **.cache/**: Temporary storage for intermediate processing results and cached computations.

## Machine Learning

The ML module provides:

- **Feature Engineering**: Transform raw data into ML-ready features
- **Model Training**: Train models (Ridge, Lasso, etc.) with hyperparameter tuning
- **Inference**: Make predictions on new data

## Contributing

When adding new features:

1. Follow the existing module structure
2. Add tests in the `tests/` directory
3. Update `pyproject.toml` if adding new dependencies
4. Run `make lint` before committing
5. Update this README if adding new functionality

## Troubleshooting

### Dependencies Not Found

```bash
# Re-sync dependencies (must use --all-packages for workspace members)
uv sync --all-packages

# Or use the Makefile command (recommended)
make sync
```

### Import Errors

Ensure you're running from the project root and using `uv run`:

```bash
uv run python backend/src/main.py
```

### Docker Issues

```bash
# Rebuild the backend image
make backend-build

# Check container logs
make dev-logs
```

## License

This project is for educational and research purposes.
