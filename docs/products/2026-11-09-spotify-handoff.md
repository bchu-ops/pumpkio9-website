# Handoff: Spotify product page

Status: v1 built on `dev` (2026-11-09). Waiting on Spotify app setup (see "Setup" below) before real data shows.
Owner: Brian. Written 2026-11-09.

## What Brian asked for

> "another would be the spotify one"

Brian's earlier note in `docs/docs.md` describes it as a "spotify program to read my last 5-10 songs played". The hero section already has a **Recent Songs** button that routes to `/Spotify`. The footer logo also uses a Spotify icon. The Personal Website entry in Notion and the CV already lists "Spotify API" as a tool, so this page should ship before that claim gets questioned.

## What exists today

| Piece | Where | State |
|---|---|---|
| Route `/Spotify` | `frontend/src/App.js` | Live, renders `<h1>Spotify Page</h1>` |
| Page component | `frontend/src/components/pages/Spotify.js` | 6-line placeholder |
| Hero button "Recent Songs" | `frontend/src/components/HeroSection.js` (`routeChange('/Spotify')`) | Live, points at the placeholder |
| Products menu | `frontend/src/components/Navbar.js` (Product 1–3) | Placeholders, keep them |
| Content pipeline to copy | `backend/automations/scripts/sync_notion.py` → `frontend/public/notion/*.json` | Working pattern: Python job writes static JSON, React reads it |

## Hard constraints

- **Static hosting.** The site is GitHub Pages (React CRA, `basename /pumpkio9-website`). There is no server, so no secret can live in the browser.
- **Spotify auth.** "Recently played" (`GET /v1/me/player/recently-played`, scope `user-read-recently-played`) needs a user OAuth token. Treat the client secret and refresh token like passwords: GitHub Actions secrets only, never in the repo or the bundle.
- **Spotify API changes (Nov 2024).** New apps lost access to audio features, audio analysis, recommendations and related artists. Do not design around danceability/energy charts unless the app is confirmed to still have access. **Verify current limits before building.**
- **Dev-mode apps** are limited to allow-listed users. That's fine here, since only Brian's own account is read.
- Keep the Notion look of the site. Respect dark mode. Hit accessibility 100. Don't regress CLS (the hero already reserves space).

## Proposed approach (my recommendation, not yet agreed)

Same shape as the Notion sync: **fetch on a schedule, publish static JSON**.

1. One-time: Brian creates a Spotify app and runs a tiny local script that does the OAuth code flow and prints a **refresh token**. Store `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN` as GitHub Actions secrets.
2. `backend/automations/scripts/sync_spotify.py` refreshes the access token, then pulls:
   - recently played (last 50, with `played_at`)
   - top tracks and top artists for the short-, medium- and long-term ranges
   - optional: currently playing, at sync time only
3. It writes `frontend/public/spotify/listening.json` (track, artists, album art URL, Spotify URL, `played_at`, preview length).
4. A GitHub Actions cron (e.g. every 30–60 min) runs the script and redeploys only when the JSON changed.
5. `Spotify.js` reads the JSON. No tokens ever reach the browser.

Trade-off: the data is "as of last sync", not live. To get live data you'd need a serverless function (Cloudflare Worker or Vercel) holding the refresh token. That's a later upgrade if wanted.

## Page ideas to react to (creative, pick what fits)

- **Recently played timeline.** Album-art cards with relative times ("12 min ago"), grouped by day. This is the core of the "last 5–10 songs" ask.
- **Listening clock.** A 24-hour radial chart of when Brian listens (from `played_at`). It's cheap to build and personal.
- **Top this month vs all time.** Two columns built from `top/tracks` and `top/artists` across the time ranges.
- **"On repeat" detector.** Tracks that show up 3+ times in recent plays.
- **Embed play.** Spotify's official iframe embed per track, so visitors can listen without auth.
- **Tie-in with the footer "secret section".** A small "now playing / last played" pill.

## Open questions for Brian

1. Is the page for visitors ("what Brian's listening to"), for you (personal stats), or both?
2. How fresh does it need to be? Hourly sync, or live (needs a serverless function)?
3. Which 2–3 of the page ideas above matter most?
4. Should it live at `/Spotify` (the current hero link), under the Products menu, or both?
5. Is there anything you'd **not** want shown publicly (certain artists, podcasts, timestamps)?

## Verification plan (how we prove it works)

- The sync script runs locally and in Actions, and writes valid JSON that's checked against a schema (pydantic model).
- The Actions log shows a token refresh and N tracks fetched, with secrets masked.
- In Brian's open Chrome tab: `/Spotify` renders the latest tracks, and the timestamps match Spotify's own "Recently played".
- Lighthouse: accessibility 100, CLS < 0.1, in light and dark mode.
- Failure mode: if the sync fails, the page shows the last good JSON plus an "as of" time, never a blank page.

## Out of scope for v1

- Logging visitors into their own Spotify.
- Writing to Spotify (playlists, playback control).

## Built (v1, 2026-11-09)

Brian asked for visitor login too, so v1 has two tabs on `/Spotify`:

- **Mine:** hourly GitHub Action (`.github/workflows/sync-spotify.yml`) runs `backend/automations/scripts/sync_spotify.py`, which writes `frontend/public/spotify/listening.json`. The workflow commits only when the data changed, then dispatches `deploy.yml`.
- **Yours:** visitors log in with Spotify's PKCE flow entirely in the browser (`frontend/src/products/spotify/lib/pkce.js`). There's no client secret, tokens live in sessionStorage, and nothing is sent to the site.
- **Page:** "On repeat" chips, recently played grouped by day (10 shown, expandable to 50), and top tracks and artists for 4 weeks, 6 months and all time. Supports dark mode and 390px phone width.

## Decisions

| Decision | Chosen | Over | Why |
|---|---|---|---|
| Visitor login | Mine for everyone, plus login for invited friends | Login only, or mine only | Dev-mode apps cap at 5 users (owner included) and need a manual allowlist. Extended quota is org-only with 250k+ MAU since 2025-05-15, so strangers would just get a 403. |
| Visitor auth flow | PKCE in the browser | Serverless token proxy | No server or secret needed, and it fits GitHub Pages. Spotify recommends PKCE for single-page apps. |
| Brian's data | Hourly Actions cron writing static JSON | Live serverless function | Same pattern as the Notion sync, with no new infra. Data is at most about an hour old. |
| Brian's auth | Auth code flow with client secret (one-time `spotify_auth.py`) | PKCE | PKCE refresh tokens can rotate, which would break a stored Actions secret. |
| Freshness label | "Last song played N ago" | "As of <sync time>" | JSON is only rewritten when data changes, so a sync timestamp would look stale. |
| Redirect URI | `/pumpkio9-website/Spotify` via the existing 404.html SPA redirect | A dedicated callback page | The 404.html encoding keeps `code` and `state` intact. |
| Data shown | Plays, top tracks, top artists | Audio features, popularity, follower counts | Removed for dev-mode apps (Nov 2024 and Feb 2026 changes). Endpoints were checked against Spotify's Feb 2026 "still available" list. |
| Token storage | sessionStorage | localStorage | Cleared when the tab closes, which reduces exposure. |

## Setup (one time, Brian)

1. In the Spotify dashboard, create an app with Web API enabled. Add these redirect URIs:
   - `http://127.0.0.1:8888/callback`
   - `https://bchu-ops.github.io/pumpkio9-website/Spotify`
   - `http://127.0.0.1:3000/pumpkio9-website/Spotify`
2. Put `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` in `backend/automations/.env`. From `backend/automations`, run `uv run python scripts/spotify_auth.py` and copy the refresh token it prints.
3. Add the GitHub repo secrets `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET` and `SPOTIFY_REFRESH_TOKEN`, and the repo variable `SPOTIFY_CLIENT_ID`.
4. In the dashboard's User Management, allowlist friends (4 max).
5. The owner account needs Spotify Premium.

## Later ideas

Listening clock (24h radial chart from `played_at`), Spotify embed players, and a "last played" pill in the footer.
