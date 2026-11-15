#!/bin/bash

# SpeedDemon Setup Script
# This script sets up the complete SpeedDemon development environment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "🛠️ Starting Project Setup..."
# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# ============================================================================
# PACKAGE & LANGUAGE SETUP
# ============================================================================

# Setup Python package manager (uv)
setup_python_package_manager() {
    log_info "Checking for uv (Python Manager)..."
    
    if ! command_exists uv; then
        log_info "Installing uv..."
        curl -LsSf https://astral.sh/uv/install.sh | sh
        log_success "uv installed successfully"
    else
        log_success "uv found ✓"
    fi
    if ! command_exists deptry; then
        log_info "Installing deptry..."
        uv add --dev deptry
        log_success "deptry installed successfully"
    else
        log_success "deptry found ✓"
    fi
    if ! command_exists ruff; then
        log_info "Installing ruff..."
        uv add --dev ruff
        log_success "ruff installed successfully"
    else
        log_success "ruff found ✓"
    fi
    if ! command_exists pytest; then
        log_info "Installing pytest..."
        uv add --dev pytest
        log_success "pytest installed successfully"
    else
        log_success "pytest found ✓"
    fi
}

# Setup Python environment
setup_python_environment() {
    log_info "Setting up Python environment..."
    
    # Check Python version
    if ! command_exists python3; then
        log_warning "Python 3 is not installed. Backend development requires Python 3.10+."
        log_info "Download from: https://www.python.org/downloads/"
        return
    fi
    
    PYTHON_VERSION=$(python3 --version 2>&1 | cut -d' ' -f2 | cut -d'.' -f1,2)
    PYTHON_MAJOR=$(echo "$PYTHON_VERSION" | cut -d'.' -f1)
    PYTHON_MINOR=$(echo "$PYTHON_VERSION" | cut -d'.' -f2)
    
    if [ "$PYTHON_MAJOR" -lt 3 ] || ([ "$PYTHON_MAJOR" -eq 3 ] && [ "$PYTHON_MINOR" -lt 10 ]); then
        log_warning "Python version is $PYTHON_VERSION. Required version is 3.10+."
        log_info "Please upgrade Python to 3.10 or higher"
    else
        log_info "Python version $PYTHON_VERSION detected ✓"
    fi
    
    # Initialize local Python environment with uv
    if command_exists uv; then
        log_info "Initializing Python dependencies with uv..."
        uv sync
        log_success "Python dependencies synced"
    else
        log_warning "uv not found, skipping Python dependency sync"
    fi
}

# Setup Node.js and npm (for frontend)
setup_nodejs() {
    log_info "Checking for Node.js..."
    
    if ! command_exists node; then
        log_warning "Node.js is not installed. Frontend development will require Node.js 18+."
        log_info "Download from: https://nodejs.org/"
    else
        NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_VERSION" -lt 18 ]; then
            log_warning "Node.js version is $NODE_VERSION. Recommended version is 18+."
        else
            log_info "Node.js version $(node --version) detected ✓"
        fi
    fi
}

# Setup jq (required for dependency management)
setup_jq() {
    log_info "Checking for jq..."
    
    if ! command_exists jq; then
        log_error "jq not found. Install it with 'brew install jq' or 'sudo apt install jq'"
        log_info "jq is required for 'make sync' command"
        exit 1
    else
        log_success "jq found ✓"
    fi
}

# ============================================================================
# DOCKER SETUP
# ============================================================================

# Check Docker prerequisites
check_docker_prerequisites() {
    log_info "Checking Docker prerequisites..."
    
    # Check Docker
    if ! command_exists docker; then
        log_error "Docker is not installed. Please install Docker Desktop first."
        log_info "Download from: https://www.docker.com/products/docker-desktop"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command_exists docker compose && ! docker compose version >/dev/null 2>&1; then
        log_error "Docker Compose is not installed or accessible."
        exit 1
    fi
    
    # Check if Docker is running
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker is not running. Please start Docker Desktop."
        exit 1
    fi
    
    log_success "Docker prerequisites met ✓"
}

# Fix Docker issues
fix_docker_issues() {
    log_info "Fixing common Docker issues..."
    
    # Clean up Docker system
    log_info "Cleaning Docker system..."
    docker system prune -f >/dev/null 2>&1 || true
    
    # Try to clean build cache
    log_info "Cleaning Docker build cache..."
    docker builder prune -f >/dev/null 2>&1 || true
    
    # Restart Docker BuildKit
    log_info "Restarting Docker BuildKit..."
    docker buildx rm --all-inactive >/dev/null 2>&1 || true
    
    log_success "Docker cleanup completed"
}

# ============================================================================
# KUBERNETES SETUP (Optional)
# ============================================================================

# Setup Kubernetes
setup_kubernetes() {
    log_info "Checking Kubernetes setup..."
    
    echo -e "\n${YELLOW}Would you like to verify/setup Kubernetes for local testing? (y/N):${NC} "
    read -r response
    
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        log_info "Setting up Kubernetes..."
        
        # Check kubectl
        if ! command_exists kubectl; then
            log_info "Installing kubectl..."
            # Mac example (Brew); Script can be branched for Windows/Linux
            if command_exists brew; then
                brew install kubectl
            else
                curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/darwin/arm64/kubectl"
                chmod +x kubectl
                sudo mv kubectl /usr/local/bin/
            fi
        else
            log_success "kubectl found ✓"
        fi
        
        # Verify Docker Desktop K8s Status
        log_info "Verifying Kubernetes cluster status..."
        if ! kubectl cluster-info >/dev/null 2>&1; then
            log_error "Kubernetes is not running in Docker Desktop."
            log_info "Please go to: Docker Desktop > Settings > Kubernetes > Enable Kubernetes"
            exit 1
        else
            # Automatically switch to the correct local context
            kubectl config use-context docker-desktop >/dev/null 2>&1
            log_success "Kubernetes cluster is Ready (docker-desktop context active) ✓"
        fi
    else
        log_info "Skipping Kubernetes setup. You can still use non-k8 commands for Docker Compose."
    fi
}

# ============================================================================
# ENVIRONMENT FILES SETUP
# ============================================================================

# Create root .env file
create_root_env_file() {
    log_info "Creating root .env file..."
    
    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            log_info "Creating .env from .env.example..."
            cp .env.example .env
            log_success ".env created. Update it with your real API keys!"
        else
            log_warning ".env.example not found, skipping root .env creation"
        fi
    else
        log_info ".env already exists, skipping..."
    fi
}

# Create environment files for services
create_environment_files() {
    log_info "Creating environment file templates..."
    
    # Frontend environment file
    frontend_env="frontend/.env"
    if [ ! -f "$frontend_env" ]; then
        log_info "Creating $frontend_env"
        cat > "$frontend_env" << EOF
# Frontend Environment Variables
NODE_ENV=development
VITE_APP_NAME=SpeedDemon

# Backend API URL (for production)
VITE_API_URL=http://localhost:8000

# Feature Flags
VITE_ENABLE_DEBUG_MODE=true

# Add frontend-specific environment variables below
EOF
    else
        log_info "$frontend_env already exists, skipping..."
    fi
    
    log_success "Environment files created"
}

# ============================================================================
# BACKEND & FRONTEND SETUP
# ============================================================================

# Setup backend
setup_backend() {
    log_info "Setting up backend..."
    
    if [ ! -d "backend" ]; then
        log_warning "backend directory does not exist, skipping..."
        return
    fi
    
    if [ ! -f "backend/pyproject.toml" ]; then
        log_warning "backend/pyproject.toml not found, skipping backend setup..."
        return
    fi
    
    log_info "Backend structure verified ✓"
    log_success "Backend setup completed"
}

# Setup frontend
setup_frontend() {
    log_info "Setting up frontend..."
    
    if [ ! -d "frontend" ]; then
        log_warning "frontend directory does not exist, skipping..."
        return
    fi
    
    cd frontend
    
    # Check if package.json exists
    if [ ! -f "package.json" ]; then
        log_warning "package.json not found in frontend, skipping..."
        cd - >/dev/null
        return
    fi
    
    # Check if package-lock.json exists and node_modules is up to date
    if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
        if command_exists npm; then
            log_info "Installing frontend dependencies..."
            npm ci >/dev/null 2>&1 || npm install >/dev/null 2>&1
            log_success "Frontend dependencies installed"
        else
            log_warning "npm not found, skipping frontend dependency installation"
        fi
    else
        log_info "Frontend dependencies are up to date"
    fi
    
    cd - >/dev/null
    
    log_success "Frontend setup completed"
}

# ============================================================================
# VALIDATION
# ============================================================================

# Validate setup
validate_setup() {
    log_info "Validating setup..."
    
    # Check if all required files exist
    REQUIRED_FILES=(
        "deploy/docker-compose.yml"
        "deploy/Dockerfile.backend"
        "deploy/Dockerfile.frontend"
        "Makefile"
        "pyproject.toml"
    )
    
    for file in "${REQUIRED_FILES[@]}"; do
        if [ ! -f "$file" ]; then
            log_error "Required file missing: $file"
            exit 1
        fi
    done
    
    # Check if backend structure exists
    if [ ! -d "backend/src" ]; then
        log_warning "Backend src directory missing: backend/src"
    fi
    
    if [ ! -f "backend/src/main.py" ]; then
        log_warning "Backend entry point missing: backend/src/main.py"
    fi
    
    if [ ! -f "backend/pyproject.toml" ]; then
        log_warning "Backend pyproject.toml missing"
    fi
    
    # Check if frontend exists
    if [ ! -d "frontend" ]; then
        log_warning "Frontend directory missing"
    elif [ ! -f "frontend/package.json" ]; then
        log_warning "Frontend package.json missing"
    fi
    
    log_success "Setup validation completed"
}

# ============================================================================
# MAIN SETUP FUNCTION
# ============================================================================

main() {
    echo "======================================"
    echo "      SpeedDemon Setup Script v1.0    "
    echo "======================================"
    echo ""
    
    # Ensure we're in the project root
    if [ ! -f "deploy/docker-compose.yml" ] || [ ! -d "deploy" ]; then
        log_warning "Some expected directories/files are missing. Continuing setup..."
        log_info "This script will create necessary files and directories."
    fi
    
    log_info "Starting SpeedDemon setup..."
    
    # Package & Language Setup
    setup_python_package_manager
    setup_jq
    setup_nodejs
    setup_python_environment
    
    # Docker Setup
    check_docker_prerequisites
    fix_docker_issues
    
    # Environment Files Setup
    create_root_env_file
    create_environment_files
    
    # Backend & Frontend Setup
    setup_backend
    setup_frontend
    
    # Validation
    validate_setup
    
    # Kubernetes Setup (Optional)
    setup_kubernetes
        
    echo ""
    echo "======================================"
    log_success "🚀 SETUP COMPLETE!"
    echo "======================================"
    echo ""
    echo "Next steps:"
    echo "1. Review and customize the .env file (add OPENAI_API_KEY)"
    echo "2. Run 'make build' to build all Docker images"
    echo "3. Run 'make up' to start all services"
    echo "4. Access the application:"
    echo "   - Frontend: http://localhost:3000"
    echo "   - Backend:  http://localhost:8000"
    echo "   - Notebook: http://localhost:8888"
    echo ""
    echo "For more information, see:"
    echo "- README.md"
    echo "- Run 'make help' for available commands"
    echo ""
    echo "Development commands:"
    echo "- Start Dev Mode (with hot reload):  make dev"
    echo "- Deploy to K8s:                    make k8s-deploy"
    echo "- Sync Packages (scan new imports):  make sync"
    echo -e "${GREEN}🚀 System is Ready!${NC}"
    echo ""
    
}
# Run main function
main "$@"
