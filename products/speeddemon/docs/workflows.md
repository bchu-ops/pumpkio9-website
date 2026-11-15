# CI/CD Workflow Documentation

## ci.yml (Continuous Integration Pipeline)

Runs automated quality checks and verification on every push and pull request. This workflow installs the uv package manager, runs ruff linting on the backend code, syncs dependencies, and verifies that both backend and frontend Docker images build successfully. The pipeline ensures code quality and build integrity before changes are merged, catching issues early in the development cycle.

**Key Steps:**
- Installs uv package manager
- Runs ruff linter on backend code
- Syncs Python dependencies
- Verifies backend Docker image builds
- Verifies frontend Docker image builds

---

## deploy.yml (Deployment Pipeline)

Manually triggered deployment workflow that builds, pushes, and deploys the SpeedDemon application to production. The pipeline authenticates with Docker Hub, builds both backend and frontend Docker images with version tags, pushes them to the registry, then deploys to a Kubernetes cluster using the manifests in the deploy directory. It performs a rolling update of the deployment and verifies successful pod startup, ensuring zero-downtime deployments with proper secret injection.

**Key Steps:**
- Authenticates with Docker Hub
- Builds and pushes backend image (latest + SHA tag)
- Builds and pushes frontend image (latest + SHA tag)
- Sets Kubernetes context from secrets
- Applies Kubernetes deployment and service manifests
- Performs rolling update with new image tags
- Verifies deployment rollout status
