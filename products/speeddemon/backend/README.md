# SpeedDemon backend

Placeholder Python package (`speeddemon-backend`, a uv workspace member of the root `pyproject.toml`). It has no source code yet: the Speed Demon web page runs entirely in the browser, and its F1 snapshot is fetched by `backend/automations/scripts/prefetch-f1.mjs` at the repo root.

The dependencies in `pyproject.toml` are only what 
otebooks/track_visualization_transformations.py imports (fastf1, matplotlib, numpy) plus Jupyter for the compose `notebook` service. See [../docs/roadmap.md](../docs/roadmap.md).
