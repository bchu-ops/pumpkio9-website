# SpeedDemon To-Do List

## 🏗️ Core Infrastructure
- [ ] Implement `main.py` orchestrator (currently commented out)
- [ ] Create `__init__.py` files in all `src/` subdirectories
- [ ] Set up DuckDB schema (`warehouse/schema.sql`)
- [ ] Implement SQL business logic (`warehouse/models.sql`)

## 📊 Data Pipeline
- [ ] Implement `data_pipeline/extract.py` (Kafka, FastF1 API, etc.)
- [ ] Implement `data_pipeline/load.py` (Bronze layer writes)
- [ ] Implement `data_pipeline/transform.py` (Silver/Gold transformations)

## 🤖 ML Layer
- [ ] Implement `ml/features.py` (feature engineering)
- [ ] Implement `ml/model_logic.py` (Ridge, Lasso architectures)
- [ ] Implement `ml/train.py` (training loops & hyperparameter tuning)

## 🧪 Testing & Quality
- [ ] Write unit tests in `tests/data_pipeline/`
- [ ] Write unit tests in `tests/ml/`
- [ ] Configure CI/CD workflows (test.yml, deploy.yml)
- [ ] Add type checking (mypy) & linting (pylint)

## 📝 Documentation
- [ ] Complete `docs/data_architecture.md`
- [ ] Complete `docs/ml_architecture.md`
- [ ] Complete `docs/workflows.md` (CI/CD details)
- [ ] Complete `docs/reports.md` (KPI catalog)

## ☁️ Deployment
- [ ] Configure cloud storage (AWS S3 bucket setup)
- [ ] Set up PostgreSQL credentials management
- [ ] Prepare Docker entrypoint in `scripts/`

## 🔧 Development
- [ ] Add `pyproject.toml` (replace setup.py pattern)
- [ ] Create first notebooks in `notebooks/eda/`, `notebooks/prototypes/`
