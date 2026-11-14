# SpeedDemon
Files and Process of Building a Kart, paired with optimizing laptimes using OpenAI Groq Chatbot and PostgreSQL


**Target Customers:**  
**Project Focus:** 

## 🚀 Quick Start

First, run the setup script to configure your environment:

```bash
./setup.sh
```

This script will:

- Check prerequisites (Docker, Node.js, Python, uv)
- Create environment files for all services
- Set up dependencies for frontend and backend
- Validate the complete setup

Next, add your OpenAI API key:

In `.env`, add:

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
├── frontend/                # React + Vite + JavaScript (UI)
│   ├── src/
│   │   ├── components/      # React components (Header, Footer)
│   │   ├── pages/           # Page components (Home)
│   │   ├── services/        # API client
│   │   ├── App.jsx          # Main application
│   │   └── main.jsx         # React entry point
│   ├── reports/             # Reports directory
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
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
│   ├── Dockerfile.frontend  # Frontend Docker image
│   ├── k8s-deployment.yml   # Kubernetes deployment
│   └── k8s-service.yml      # Kubernetes service
├── .github/workflows/       # CI/CD pipelines
├── docs/                    # Documentation
├── Makefile                 # Project management commands
├── setup.sh                 # Automated setup script
├── pyproject.toml           # Root workspace config
└── README.md
```

## 🛠️ Development Commands

The project includes a comprehensive **Master Makefile** at the root for easy management across **ELT, ML, and Frontend** services:

### Production Commands
```bash
- `make build`          # Build all Docker images (Backend, Frontend, Notebook)
- `make up`             # Start all services in the background
- `make down`           # Stop all services and remove containers
- `make restart`        # Restart all services
- `make logs`           # View combined logs from all services
- `make clean`          # Deep clean: remove containers, images, volumes, and `.venv`
```

### Development Commands (with hot reload)
```bash
- `make dev`            # Start all services in development mode (foreground with logs)
- `make dev [services]` # Start specific services (e.g., `make dev frontend backend`)
- `make dev-up`         # Start development services in the background
- `make dev-down`       # Stop development services
- `make dev-logs`       # View development logs (Backend specifically)
- `make dev-backend`    # Start only backend (foreground with logs)
- `make dev-frontend`   # Start only frontend (foreground with logs)
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
- `make frontend-shell`  # Open a terminal inside the running Frontend container
- `make dev-frontend`     # Start only the Frontend service (foreground with logs)
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
# FRONTEND (UI):    http://localhost:3000
# BACKEND (API):    http://localhost:8000
# NOTEBOOK (ML):    http://localhost:8888
# ═══════════════════════════════════════════════════════════════
```

### Option 2: Development Mode (with hot reload)

```bash
make dev

# Services run with hot reload for development
# Frontend changes auto-reload
# Backend changes auto-reload

# ═══════════════════════════════════════════════════════════════
# VIEW YOUR SERVICES AT (LOCAL DEVELOPMENT):
# ═══════════════════════════════════════════════════════════════
# FRONTEND (UI):    http://localhost:3000
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

# Run Frontend and Backend together (No Notebook to save RAM)
make dev frontend backend

# ═══════════════════════════════════════════════════════════════
# VIEW YOUR SERVICES AT (LOCAL DEVELOPMENT):
# ═══════════════════════════════════════════════════════════════
# FRONTEND (UI):    http://localhost:3000
# BACKEND (API):    http://localhost:8000
# ═══════════════════════════════════════════════════════════════
```

### Option 4: Local Development

**Requirements:**
- Python 3.10+
- Node.js 20+
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

```bash
# Frontend
cd frontend
npm install
npm run dev

# ═══════════════════════════════════════════════════════════════
# VIEW YOUR SERVICES AT (LOCAL DEVELOPMENT):
# ═══════════════════════════════════════════════════════════════
# FRONTEND (UI):    http://localhost:3000
# BACKEND (API):    http://localhost:8000 (if running separately)
# ═══════════════════════════════════════════════════════════════
```

## 🔧 Services

The application consists of three main services:

1. **Backend**: Python FastAPI service for data pipeline, ML inference, and API endpoints
2. **Frontend**: React application for user interface
3. **Notebook**: Jupyter notebook environment for ML research and experimentation

## ⚙️ Configuration

### Environment Variables
in .env.example

- `OPENAI_API_KEY` (required)
- `OPENAI_MODEL` (default: `gpt-5.1`)

## 🔍 Health & Monitoring

### Local Development (Docker)
```
═══════════════════════════════════════════════════════════════
VIEW YOUR SERVICES AT (LOCAL DEVELOPMENT):
═══════════════════════════════════════════════════════════════
FRONTEND (UI):    http://localhost:3000
BACKEND (API):    http://localhost:8000
NOTEBOOK (ML):    http://localhost:8888
═══════════════════════════════════════════════════════════════
```

### Production Deployment (GitHub Pages)
```
═══════════════════════════════════════════════════════════════
VIEW YOUR DEPLOYED WEBSITE (GITHUB PAGES):
═══════════════════════════════════════════════════════════════
PRODUCTION SITE:  https://bchu-ops.github.io/speeddemon/
═══════════════════════════════════════════════════════════════
```
*Note: The URL is automatically generated based on your repository name. For this repo, it's `https://bchu-ops.github.io/speeddemon/`*

## 🛠️ Tech Stack

### Frontend
- React 19 with JavaScript (JSX)
- Vite for fast development and building
- Modern CSS with responsive design
- Component-based architecture

### Backend
- Python 3.10+ with FastAPI (when implemented)
- uv for dependency management
- Pydantic for data validation (when implemented)
- Data pipeline (ETL) with pandas
- Machine learning with scikit-learn
- Docker and Docker Compose for containerization

### Infrastructure
- Docker for containerization
- Docker Compose for orchestration
- Makefile for project management
- Automated setup script for environment configuration
- Kubernetes deployment files (k8s-deployment.yml, k8s-service.yml)
- GitHub Pages for frontend deployment (automatic via GitHub Actions)

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

### GitHub Pages Deployment (Frontend)

The frontend is automatically deployed to GitHub Pages when you push to the `main` branch.

**Deployment URL:**
```
═══════════════════════════════════════════════════════════════
VIEW YOUR DEPLOYED WEBSITE (GITHUB PAGES):
═══════════════════════════════════════════════════════════════
PRODUCTION SITE:  https://bchu-ops.github.io/speeddemon/
═══════════════════════════════════════════════════════════════
```

**Base Path Configuration:**
- The frontend automatically uses `/speeddemon/` as the base path for GitHub Pages
- Configured in `frontend/vite.config.js` - auto-detects repository name
- Local/Docker development uses `/` (root path)
- No manual configuration needed - works automatically

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
- **Port conflicts:** Check if ports 3000, 8000, 8888 are available
- **Environment variables:** Ensure `.env` file is properly configured with `OPENAI_API_KEY`
- **Dependencies:** Run `./setup.sh` to ensure all dependencies are installed
- **Frontend not connecting:** Ensure backend is running on port 8000

### Getting Help
- Check service logs: `make logs` or `make dev-logs`
- Verify health endpoints: `make health`
- Review service-specific READMEs:
  - `backend/README.md`
  - `frontend/README.md`

### Service Status

```bash
# Check all services
make status

# Check health of all services
make health
```
