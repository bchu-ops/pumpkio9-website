# CI/CD workflows

Speed Demon has no workflows of its own. It is built, tested and deployed by the repo-root workflows in `.github/workflows/`, together with the rest of the site. Nothing in this folder builds container images or deploys to Kubernetes.

## ci.yml

Runs on pull requests into `dev` and `main`, on pushes to `dev`, manually, and when called by `promote.yml`. Two jobs:

- **web** (`frontend/`): `npm ci`, `npm run lint`, `npm test`, `npm run build`. The tests include the Speed Demon unit tests in `products/speeddemon/web/lib/`, and the build includes the page.
- **automations** (`backend/automations/`): `uv run --group dev pytest -q`.

## promote.yml

Manual release button, run on `dev`. Runs `ci.yml`, fast-forwards `main` to `dev` (it fails if `main` has commits `dev` lacks), then starts `deploy.yml` on `main`.

## deploy.yml

Builds and publishes the site to GitHub Pages. Runs on pushes to `main`, manually, and hourly. For Speed Demon it restores or creates the F1 snapshot: `actions/cache` keyed by date, and on a miss `node scripts/prefetch-f1.mjs --meetings 2` in `backend/automations` (the latest two race weekends, written to `frontend/public/f1`, not committed). The prefetch never fails the deploy; the page falls back to the live OpenF1 API for anything not cached. It then runs lint, tests and the Vite build, and deploys the result.

## sync-notion.yml

Manual. Pulls the public Notion portfolio into `frontend/public/notion/` and opens a PR into `dev` if anything changed. Not related to Speed Demon.
