# Secrets and config

Rule: real values live in a git-ignored `.env` locally and in GitHub Actions secrets for CI. Only `.env.example` files (placeholders) are committed. The repo `.gitignore` ignores every `.env` and `.env.*` except `.env.example`.

| Value | Secret? | Local file | GitHub (Settings → Secrets and variables → Actions) | Used by |
|---|---|---|---|---|
| `NOTION_TOKEN` | **yes** | `backend/automations/.env` | — (sync runs locally) | `sync_notion.py`, `pdf_to_notion` |
| `NOTION_PAGE_ID`, `NOTION_*_DB_ID`, `NOTION_*_COLLECTION_ID` | no (IDs) | `backend/automations/.env` | — | `sync_notion.py`, `pdf_to_notion` |
| `SPOTIFY_CLIENT_SECRET` | **yes** | `backend/automations/.env` | Secret `SPOTIFY_CLIENT_SECRET` | `sync_spotify.py` in `deploy.yml` |
| `SPOTIFY_REFRESH_TOKEN` | **yes** | `backend/automations/.env` | Secret `SPOTIFY_REFRESH_TOKEN` | `sync_spotify.py` in `deploy.yml` |
| `SPOTIFY_CLIENT_ID` | no (public) | `backend/automations/.env` | Secret `SPOTIFY_CLIENT_ID` **and** variable `SPOTIFY_CLIENT_ID` | secret: `sync_spotify.py`; variable: site build as `VITE_SPOTIFY_CLIENT_ID` |
| `VITE_SPOTIFY_CLIENT_ID` | no (public) | `frontend/.env.local` | (from variable `SPOTIFY_CLIENT_ID`) | Spotify page "Yours" tab |
| `OPENAI_API_KEY` etc. | **yes** | `products/speeddemon/.env` | — | Speed Demon backend (Docker, local only) |

## Setup

```sh
cp backend/automations/.env.example backend/automations/.env      # then fill in
cp frontend/.env.example frontend/.env.local                       # optional, public values only
cp products/speeddemon/.env.example products/speeddemon/.env       # only if running that backend
```

## Rules

- Anything under `frontend/` or with a `VITE_` prefix ends up in the public site. Never put a secret there.
- Workflows get secrets only as step-level `env:`. GitHub masks them in logs. Scripts must not print them.
- If a secret is ever committed: rotate it first (Notion: regenerate the integration token; Spotify: reset the client secret and re-run `spotify_auth.py`), then remove it from the repo.
