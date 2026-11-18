# SpeedDemon

A lap telemetry explorer for F1 sessions, and the starting point for analysing my own go-kart laps.

> Part of [pumpkio9-website](../../README.md) (merged from the archived github.com/bchu-ops/speeddemon). The Speed Demon page is `web/` here. It is built, tested and deployed by the site (`frontend/`) and is live at https://bchu-ops.github.io/pumpkio9-website/speed-demon.

## What is here

- `web/`: the React page. Lines up two drivers' laps by track position, with a track map, stacked speed/throttle/brake/gear/gap charts, corner notes, race pace and a share-as-image button. Data comes from [OpenF1](https://openf1.org), with a build-time snapshot for the latest race weekends.
- `docs/`: [design notes for the page](docs/2026-11-09-speed-demon.md), [roadmap](docs/roadmap.md) (open work), [workflows](docs/workflows.md), [naming conventions](docs/naming_conventions.md).
- `notebooks/`: FastF1 and matplotlib helpers for track and speed plots (exploratory, not part of the site).
- `backend/`: placeholder Python package for the planned kart telemetry pipeline. No code yet.
- `deploy/`: Docker Compose and Kubernetes templates for a future backend. Placeholders, not used by the site.
- `Makefile`, `setup.sh`, `pyproject.toml`: tooling for the Docker and uv setup above.

## Working on the page

From the repo root:

```bash
cd frontend
npm ci
npm start      # run the site locally
npm test       # includes the Speed Demon unit tests in ../products/speeddemon/web/lib
```

To fetch the F1 snapshot locally (optional; the page falls back to the live API):

```bash
cd backend/automations
node scripts/prefetch-f1.mjs --meetings 2
```

## Docker and uv tooling (placeholder backend)

Needs Docker, [uv](https://docs.astral.sh/uv/) and jq. From this folder:

```bash
./setup.sh      # checks prerequisites and creates the repo-root .env from .env.example
make help       # list all targets
make build      # build the images
make up         # start the services (the backend exits immediately: it is a placeholder)
make notebook-url  # Jupyter login URL (http://localhost:8888)
make down
```

Other targets: `restart`, `logs`, `clean`, `dev`, `dev-up`, `dev-down`, `dev-logs`, `backend-build`, `backend-up`, `backend-down`, `dev-backend`, `notebook-build`, `notebook-up`, `notebook-down`, `dev-notebook`, `shell`, `status`, `health`, `lint` (ruff), `sync` (update uv dependencies from imports), `add PKG=name`, `k8s-sync-secrets`, `k8s-deploy`.

## Deployment

The page is deployed with the site by the repo-root GitHub Actions; see [docs/workflows.md](docs/workflows.md). `make k8s-deploy` applies the Kubernetes templates in `deploy/`, which still contain a placeholder image and are not used in production.

## Roadmap

See [docs/roadmap.md](docs/roadmap.md).

## License

For educational and research purposes.
