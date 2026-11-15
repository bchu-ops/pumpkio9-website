# Secrets and config

**One file:** all local config lives in `.env` at the repo root. Copy it from `.env.example` (same folder), which is the only env file in git. `.env` is git-ignored, as is every other `.env*` except `.env.example`.

```sh
cp .env.example .env   # then fill in real values
```

Everything reads that one file: the automations scripts (`backend/automations/scripts/*` load `<repo>/.env`), the site build (Vite `envDir` is the repo root; only `VITE_*` values reach the site), and the Speed Demon Docker setup (`env_file: ../../../.env`).

For CI, the same names go in GitHub → Settings → Secrets and variables → Actions.

| Value | Secret? | GitHub Actions | Used by |
|---|---|---|---|
| `NOTION_TOKEN` | **yes** | — (Notion sync runs locally) | `sync_notion.py`, `pdf_to_notion` |
| `NOTION_PAGE_ID`, `NOTION_*_DB_ID`, `NOTION_*_COLLECTION_ID` | no (IDs) | — | `sync_notion.py`, `pdf_to_notion` |
| `SPOTIFY_CLIENT_SECRET` | **yes** | secret `SPOTIFY_CLIENT_SECRET` | `sync_spotify.py` in `deploy.yml` |
| `SPOTIFY_REFRESH_TOKEN` | **yes** | secret `SPOTIFY_REFRESH_TOKEN` | `sync_spotify.py` in `deploy.yml` |
| `SPOTIFY_CLIENT_ID` | no (public) | variable `SPOTIFY_CLIENT_ID` | `sync_spotify.py` in `deploy.yml`, and the site build as `VITE_SPOTIFY_CLIENT_ID` |
| `VITE_SPOTIFY_CLIENT_ID` | no (public, built into the site) | (from variable `SPOTIFY_CLIENT_ID`) | Spotify page "Invited" tab (invite-only, max 5 accounts) |
| `OPENAI_API_KEY`, `PDF_SERVICE_TOKEN` | **yes** | — | Speed Demon backend (Docker, local only) |

## Rules

- Never give a secret a `VITE_` name: Vite builds `VITE_*` values into the public site.
- Workflows get secrets only as step-level `env:`. GitHub masks them in logs. Scripts must not print them.
- No other `.env` files anywhere in the repo.
- If a secret is ever committed: rotate it first (Notion: regenerate the integration token; Spotify: reset the client secret and re-run `spotify_auth.py`; OpenAI: revoke the key), then remove it from the repo.
