# Handoff: Spotify product page

Status: not started. Discovery only, no design approved yet.
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
