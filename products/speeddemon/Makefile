# --- Path Logic (Industry Standard for Folder Isolation) ---
# ROOT_DIR:    The project root (where Makefile is located)
# DEPLOY_DIR:  The deploy directory containing docker-compose.yml and k8s files
# K8S_NAME:    The name of the Kubernetes Secret to sync with .env keys
ROOT_DIR    := $(abspath $(dir $(lastword $(MAKEFILE_LIST))))
DEPLOY_DIR  := $(ROOT_DIR)/deploy
K8S_NAME    := app-secrets

# --- Service Names (Matches docker-compose) ---
BACKEND_NAME  := speeddemon_backend
FRONTEND_NAME := speeddemon_frontend
NOTEBOOK_NAME := speeddemon_notebook

# --- Docker Variable ---
COMPOSE = docker compose -f $(DEPLOY_DIR)/docker-compose.yml

.PHONY: help build up down restart logs clean dev dev-up dev-down dev-logs dev-backend dev-frontend dev-notebook backend-build backend-up backend-down status health sync add test lint shell notebook-url frontend-shell
# --- Help ---
help: ## Show all available commands
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# --- Production Commands ---
build: ## Build all Docker images
	$(COMPOSE) build

up: ## Start all services (detached)
	$(COMPOSE) up -d

down: ## Stop all services
	$(COMPOSE) down

restart: ## Restart all services
	$(COMPOSE) restart

clean: ## Deep clean: remove containers, images, volumes, and orphans
	$(COMPOSE) down --rmi all --volumes --remove-orphans

# --- Development Commands ---
dev: ## Start in development mode (Hot-reload via bind mounts). Usage: make dev [service1] [service2] (e.g., make dev backend frontend)
	$(COMPOSE) up $(filter-out $@,$(MAKECMDGOALS))

dev-up: ## Start development services (detached)
	$(COMPOSE) up -d

dev-down: ## Stop development services
	$(COMPOSE) down

# --- ML & Research Commands (New!) ---
notebook-url: ## Get the login URL for the Jupyter Notebook container
	@docker logs $(NOTEBOOK_NAME) 2>&1 | grep -m 1 "token=" | sed 's/.*or http/http/' | sed 's/0.0.0.0/localhost/'

shell: ## Open a shell in the Backend (ELT/API) container
	docker exec -it $(BACKEND_NAME) bash

frontend-shell: ## Open a shell in the Frontend (React) container
	docker exec -it $(FRONTEND_NAME) bash

# --- Backend Specific Commands ---
backend-build: ## Build only backend services
	$(COMPOSE) build backend

backend-up: ## Start only backend services (detached)
	$(COMPOSE) up -d backend

dev-backend: ## Start only backend in development mode (foreground with logs)
	$(COMPOSE) up backend

backend-down: ## Stop only backend services
	$(COMPOSE) stop backend

# --- Frontend Specific Commands ---
frontend-build: ## Build only frontend services
	$(COMPOSE) build frontend

frontend-up: ## Start only frontend services (detached)
	$(COMPOSE) up -d frontend

dev-frontend: ## Start only frontend in development mode (foreground with logs)
	$(COMPOSE) up frontend

frontend-down: ## Stop only frontend services
	$(COMPOSE) stop frontend

# --- Notebook Specific Commands ---
notebook-build: ## Build only notebook services
	$(COMPOSE) build notebook

notebook-up: ## Start only notebook services (detached)
	$(COMPOSE) up -d notebook

dev-notebook: ## Start only notebook in development mode (foreground with logs)
	$(COMPOSE) up notebook

notebook-down: ## Stop only notebook services
	$(COMPOSE) stop notebook

# --- Status & Health ---
status: ## Show status of all services
	$(COMPOSE) ps

health: ## Check health of all services
	$(COMPOSE) ps --filter "status=running"

# --- Quality & Logs ---
logs: ## View logs from all services
	$(COMPOSE) logs -f

dev-logs: ## View development logs (Backend specifically)
	$(COMPOSE) logs -f $(BACKEND_NAME)

test: ## Run tests inside the backend container
	$(COMPOSE) run --rm backend pytest

test-cov: ## Run tests and generate a coverage report (HTML)
	$(COMPOSE) run --rm backend pytest --cov=backend/src --cov-report=html

lint: ## Check for code style issues locally
	@cd $(ROOT_DIR) && uv run ruff check .

# --- Dependency Management (Logic fixed for Folder Isolation) ---
sync: ## Auto-detect missing imports, update pyproject.toml and lockfile
	@echo "🔍 Scanning code for missing packages..."
	@cd $(ROOT_DIR) && \
		TMP_JSON=$$(mktemp) && \
		(uv run deptry backend --json-output $$TMP_JSON 2>&1 | grep -v "^\[" || true) && \
		if [ -s $$TMP_JSON ]; then \
			jq -r '.[].module' $$TMP_JSON | sort -u | grep -vE '^(notebooks)$$' | \
			xargs -r -I {} sh -c 'uv add --package speeddemon-backend {} 2>&1 || echo "⚠️  Skipped invalid package: {}"' || true; \
		fi && \
		rm -f $$TMP_JSON
	@echo "📦 Installing all workspace dependencies..."
	@cd $(ROOT_DIR) && uv sync --all-packages
	@echo "✅ Dependencies synced to backend package."

add: ## Add a package manually: make add PKG=pandas
	@if [ -z "$(PKG)" ]; then echo "Usage: make add PKG=package-name"; exit 1; fi
	@cd $(ROOT_DIR) && uv add $(PKG) --package speeddemon-backend

# --- Kubernetes Commands ---
k8s-sync-secrets: ## Sync local .env keys to Kubernetes
	@echo "🔐 Syncing .env to Kubernetes Secrets [$(K8S_NAME)]..."
	@kubectl create secret generic $(K8S_NAME) \
		--from-env-file=$(ROOT_DIR)/.env \
		--dry-run=client -o yaml | kubectl apply -f -

k8s-deploy: k8s-sync-secrets ## Deploy everything to Kubernetes (Secrets + App + Service)
	@kubectl apply -f $(DEPLOY_DIR)/k8s-deployment.yml
	@kubectl apply -f $(DEPLOY_DIR)/k8s-service.yml
	@echo "🚀 Successfully deployed to Kubernetes!"

# #########		FUTURE?		###########		--- Database Migrations ---

# # If you use a database (PostgreSQL/MySQL), you need commands to update the schema.
# migrate: ## Run database migrations (Alembic/Django)
# 	$(COMPOSE) run --rm backend alembic upgrade head

# migration-new: ## Create a new migration file: make migration-new MSG="add_user_table"
# 	$(COMPOSE) run --rm backend alembic revision --autogenerate -m "$(MSG)"

# Catch-all target to prevent Make from complaining about service names passed as arguments to dev
%:
	@:
