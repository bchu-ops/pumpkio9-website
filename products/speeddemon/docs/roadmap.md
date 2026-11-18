# Speed Demon roadmap

Only work that is still open. What is already built (snapshot prefetch, lap picker, race pace, corner notes, share image, teammate button) is described in [2026-11-09-speed-demon.md](2026-11-09-speed-demon.md).

## Product questions to decide

- Where the AI part shows up first: "ask the race" chat, per-lap commentary, or a driver-style fingerprint (GraphRAG).
- Live race weekends: needs OpenF1's paid tier or our own feed. Today the site only shows finished sessions.
- Whether go-kart laps share the same viewer, so a kart lap can be compared with an F1 lap shape.

## Viewer

- LLM lap commentary through a small serverless proxy (for example a Cloudflare Worker) that holds the API key. Insights are rule-based in the browser today.
- Short swings of about 0.1 to 0.2 s remain around heavy braking zones because car data is sampled at about 4 Hz. Revisit if a better source appears.

## Own kart telemetry

- Capture: phone or logger (GPS, gyroscope, accelerometer) on the kart. Streaming path: a short windowed buffer for real-time cues (for example signal magnitude area for high-intensity motion).
- Storage and batch: collector into a time-series store, batch job to static JSON in the same shape as OpenF1 so the existing viewer is reused.
- Research path: land raw logs as Parquet (bronze), clean with DuckDB or Polars (silver), engineer features such as heading drift correction and rolling variance (gold).
- Lap-time model: regularised regression (Ridge, Lasso or ElasticNet) over lap features, to see which inputs drive lap time. Needs real kart data first.

## Backend and deploy

- `backend/` is only a placeholder uv workspace member and its dependencies (FastAPI, boto3, mlflow, moto and others) are unused. Add real code, or drop the package, the compose `backend` service and `deploy/Dockerfile.backend` together.
- `deploy/k8s-*.yml` is a template. Replace the placeholder image (`your-dockerhub-user/speeddemon`) and add a workflow that applies it once a backend exists; no workflow deploys to Kubernetes today.
- Add pytest and mypy to the backend once there is backend code to test.
- Turn `notebooks/track_visualization_transformations.py` (FastF1 and matplotlib track plots) into proper notebooks once EDA resumes, following `docs/naming_conventions.md`.
