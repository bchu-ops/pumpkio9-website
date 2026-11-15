# SpeedDemon
Files and Process of Building a Kart, paired with optimizing laptimes using OpenAI Groq Chatbot and PostgreSQL

> Part of [pumpkio9-website](../../README.md) (merged from the archived github.com/bchu-ops/speeddemon). The Speed Demon web page is `web/` here and is built and deployed by the site (`frontend/`), at https://bchu-ops.github.io/pumpkio9-website/speed-demon. This folder holds the backend, data pipeline, deploy files and docs.


**Target Customers:**  
**Project Focus:** 

## 🚀 Quick Start

First, run the setup script to configure your environment:

```bash
./setup.sh
```

This script will:

- Check prerequisites (Docker, Python, uv)
- Create environment files for all services
- Set up backend dependencies
- Validate the complete setup

Next, add your OpenAI API key:

In the repo-root `.env` (`cp ../../.env.example ../../.env`), add:

```env
OPENAI_API_KEY=your_api_key_here
```

Then, start the services:

```bash
make up
```

## 🏗️ Architecture

```
```

## 📁 Project Structure

```
Project/
├── web/                     # Speed Demon page (React), built by the site's frontend/
├── backend/
│   ├── src/
│   │   ├── data_pipeline/  # ETL pipeline (extract, load, transform)
│   │   ├── ml/              # Machine learning (features, model_logic, train)
│   │   ├── warehouse/       # SQL schemas and models
│   │   └── main.py          # Backend entry point
│   ├── data/                # Data storage (medallion architecture)
│   │   ├── .cache/          # Cached intermediate data
│   │   ├── bronze/          # Raw, unprocessed data
│   │   ├── silver/          # Cleaned and validated data
│   │   └── gold/            # Business-ready, feature-engineered data
│   ├── notebooks/           # Jupyter notebooks for research
│   ├── tests/               # Unit tests
│   └── pyproject.toml       # Backend dependencies
├── deploy/
│   ├── docker-compose.yml   # Service orchestration
│   ├── Dockerfile.backend   # Backend Docker image
│   ├── k8s-deployment.yml   # Kubernetes deployment
│   └── k8s-service.yml      # Kubernetes service
├── docs/                    # Documentation
├── Makefile                 # Project management commands
├── setup.sh                 # Automated setup script
├── pyproject.toml           # Root workspace config
└── README.md
```

## 🛠️ Development Commands

The project includes a comprehensive **Master Makefile** at the root for easy management across **ELT, ML, and Notebook** services:

### Production Commands
```bash
- `make build`          # Build all Docker images (Backend, Notebook)
- `make up`             # Start all services in the background
- `make down`           # Stop all services and remove containers
- `make restart`        # Restart all services
- `make logs`           # View combined logs from all services
- `make clean`          # Deep clean: remove containers, images, volumes, and `.venv`
```

### Development Commands (with hot reload)
```bash
- `make dev`            # Start all services in development mode (foreground with logs)
- `make dev [services]` # Start specific services (e.g., `make dev backend notebook`)
- `make dev-up`         # Start development services in the background
- `make dev-down`       # Stop development services
- `make dev-logs`       # View development logs (Backend specifically)
- `make dev-backend`    # Start only backend (foreground with logs)
- `make dev-notebook`   # Start only notebook (foreground with logs)
```

### Backend & Research Commands
```bash
- `make backend-build`   # Build only the Backend/ML image
- `make backend-up`      # Start only the Backend service (detached)
- `make dev-backend`      # Start only the Backend service (foreground with logs)
- `make backend-down`    # Stop only the Backend service
- `make shell`           # Open a terminal inside the running Backend container
- `make notebook-url`     # Get the Jupyter login URL for ML research
- `make dev-notebook`     # Start only the Notebook service (foreground with logs)
```

### Utility & Dependency Commands
```bash
- `make sync`           # Auto-scan code for missing imports and update `uv` workspace
- `make add PKG=x`      # Add a specific package to the backend (e.g., `make add PKG=boto3`)
- `make status`         # Show status of all services
- `make health`         # Check health of all services
- `make lint`           # Run ruff linter on backend code
- `make test`           # Run tests inside backend container
- `make help`           # Show all available commands
```

## 🚀 Running the Application

### Option 1: Full Stack with Docker (Recommended)

```bash
# Ensure your tools and .env are ready
./setup.sh

# Start the stable production-style stack
make up

# ═══════════════════════════════════════════════════════════════
# VIEW YOUR SERVICES AT (LOCAL DEVELOPMENT):
# ═══════════════════════════════════════════════════════════════
# BACKEND (API):    http://localhost:8000
# NOTEBOOK (ML):    http://localhost:8888
# ═══════════════════════════════════════════════════════════════
```

### Option 2: Development Mode (with hot reload)

```bash
make dev

# Services run with hot reload for development
# Backend changes auto-reload
# Backend changes auto-reload

# ═══════════════════════════════════════════════════════════════
# VIEW YOUR SERVICES AT (LOCAL DEVELOPMENT):
# ═══════════════════════════════════════════════════════════════
# BACKEND (API):    http://localhost:8000
# NOTEBOOK (ML):    http://localhost:8888
# ═══════════════════════════════════════════════════════════════
```

### Option 3: Targeted Service Development (With Hot-Reload)

If you only want to work on a specific part of the **SpeedDemon** platform while keeping hot-reload active:

```bash
# Run ONLY the ML Research environment (Jupyter)
make dev-notebook

# Run ONLY the Backend API and ELT logic (FastAPI)
make dev-backend

# Run Backend and Notebook together
make dev backend notebook

# ═══════════════════════════════════════════════════════════════
# VIEW YOUR SERVICES AT (LOCAL DEVELOPMENT):
# ═══════════════════════════════════════════════════════════════
# BACKEND (API):    http://localhost:8000
# ═══════════════════════════════════════════════════════════════
```

### Option 4: Local Development

**Requirements:**
- Python 3.10+
- uv
- jq

```bash
# Backend
# Sync workspace and run API locally (use --all-packages to install workspace member dependencies)
uv sync --all-packages
# Or use the Makefile command which includes this
make sync
uv run python backend/src/main.py
```



### Infrastructure
- Docker for containerization
- Docker Compose for orchestration
- Makefile for project management
- Automated setup script for environment configuration
- Kubernetes deployment files (k8s-deployment.yml, k8s-service.yml)
- Web page deployed with the site (pumpkio9-website GitHub Pages)

## 🚀 Deployment & Scaling

### Production Deployment

```bash
# Build and start all services
make build
make up
```

### Development Workflow

```bash
# Start development environment
make dev

# View logs
make dev-logs

# Stop development environment
make dev-down
```

### Kubernetes Deployment

```bash
# Sync secrets to Kubernetes
make k8s-sync-secrets

# Deploy to Kubernetes
make k8s-deploy
```

## 🧪 Testing

Run the service integration tests:

```bash
# Run tests inside backend container
make test

# Run tests with coverage
make test-cov
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Run the setup script: `./setup.sh`
4. Make your changes and test with `make dev`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a pull request

## 📄 License

This project is for educational and research purposes.

## 🆘 Support & Troubleshooting

### Common Issues
- **Docker not running:** Start Docker Desktop
- **Port conflicts:** Check if ports 8000 and 8888 are available
- **Environment variables:** Ensure the repo-root `.env` is properly configured with `OPENAI_API_KEY`
- **Dependencies:** Run `./setup.sh` to ensure all dependencies are installed

### Getting Help
- Check service logs: `make logs` or `make dev-logs`
- Verify health endpoints: `make health`
- Review service-specific READMEs:
  - `backend/README.md`
  - `docs/frontend-README.md` (old starter frontend, for reference)

### Service Status

```bash
# Check all services
make status

# Check health of all services
make health
```
