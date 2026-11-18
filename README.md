# pumpkio9-website

Brian Chu's portfolio site. It is a React single-page app built with Vite, its Experience, Projects and Papers content is synced from a public Notion page, and it is deployed to GitHub Pages. It also hosts a few product pages (Speed Demon, Process Lab, My Spotify).

Live: https://bchu-ops.github.io/pumpkio9-website/

## Stack

- Frontend: React 19, Vite, React Router, Tailwind CSS, react-notion-x; Vitest for tests, ESLint for linting
- Automations: Python (managed with [uv](https://docs.astral.sh/uv/)) and Node scripts that fetch Notion, Spotify and OpenF1 data
- CI/CD: GitHub Actions, hosting on GitHub Pages

## Quickstart

Requires Node 22 and, for the automations, uv.

```sh
cd frontend
npm install
npm start          # dev server at http://localhost:3000/pumpkio9-website/
npm test           # run the tests once
npm run lint
npm run build      # production build into frontend/build
npm run preview    # build, then serve it locally
```

Automations tests:

```sh
cd backend/automations
uv run --group dev pytest -q
```

More commands: [docs/npm_guide.md](docs/npm_guide.md).

## Repo layout

```
frontend/            the site (Vite + React): home, navbar, footer, Notion pages
products/<name>/     one folder per product: web/ (its page on the site), docs/, optional backend
backend/automations/ scripts: Notion sync, resume PDF to Notion, Spotify and F1 snapshots
docs/                site-wide notes
.github/             workflows
```

## CI/CD

- `ci.yml`: lint, tests and build for the site and product pages, plus pytest for the automations. Runs on PRs into `dev` or `main` and on pushes to `dev`.
- `promote.yml`: manual "Promote dev to main". Runs CI on `dev`, fast-forwards `main` to `dev`, then triggers the deploy.
- `deploy.yml`: builds the site and publishes it to GitHub Pages. Runs on pushes to `main`, manually, and hourly (the hourly build refreshes the Spotify and F1 snapshots).
- `sync-notion.yml`: manual "Sync Notion". Pulls the public Notion page into `frontend/public/notion/` and opens a PR into `dev` if anything changed. It never merges or deploys. One-time setup: enable Settings > Actions > General > "Allow GitHub Actions to create and approve pull requests", otherwise the PR step fails (the sync branch is still pushed).

## Branch flow

Feature branch, then a PR into `dev`, squash merge once CI is green, then run Promote to release to `main`. Details: [docs/workflow.md](docs/workflow.md).

## Docs

- [docs/workflow.md](docs/workflow.md): branching and release flow
- [docs/secrets.md](docs/secrets.md): `.env` and GitHub Actions secrets
- [docs/npm_guide.md](docs/npm_guide.md): frontend commands
- [backend/automations/scripts/README.md](backend/automations/scripts/README.md): the automation scripts
