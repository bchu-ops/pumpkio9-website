# Speed Demon: lap telemetry explorer

Status: v1 live at `/speed-demon` (Products → Speed Demon). Written 2026-11-09.

## What it does

Pick a season, a session, and two drivers. Their fastest laps are lined up by track position:

- **Lap summary:** lap times, sectors, and plain-language notes (overall gap, biggest gains, top speed, braking points).
- **Track map:** coloured by who was quicker in each of 24 mini-sectors.
- **Stacked charts:** gap, speed, throttle, brake and gear against lap distance. Hovering or tapping any chart moves a cursor on all of them and puts both cars on the map.
- **Shareable URL:** `?year=2025&event=9835&a=1&b=4`.

It defaults to the most recent finished qualifying session and its two fastest drivers.

## Infra stack

| Layer | v1 (shipped) | Later |
|---|---|---|
| Hosting | GitHub Pages, static React (CRA). Route lazy-loaded so the home page doesn't pay for it | — |
| Data | [OpenF1](https://openf1.org) REST, called from the browser (free historical data, no key, CORS `*`) | Live race weekends need OpenF1's paid tier or our own feed |
| Client | `lib/openf1.js`: max 2 requests at once, retry once on 429/5xx, memory + sessionStorage cache, rejects non-list responses | — |
| Analysis | `lib/telemetry.js`: pure functions, unit-tested | — |
| Charts | Hand-rolled SVG (no chart library) | — |
| AI notes | Rule-based insights in the browser | LLM lap commentary via a small serverless proxy (Cloudflare Worker) holding the key |
| Own car data | — | Go-kart telemetry → OpenTelemetry collector → time-series DB (AWS) → PySpark batch → static JSON on the site, same shape as OpenF1 so the viewer is reused |

About 8 requests per comparison (sessions, drivers, all laps, then car + location data for 2 laps). Repeat views are served from cache.

## How laps are lined up

1. `buildTrace` turns OpenF1 `car_data` (about 3.7 Hz) into a trace. It adds time from the line, distance (summed speed), and x/y interpolated from `location`.
2. Summed speed drifts by tens of metres over a lap, which shows up as fake 0.4s swings in slow corners. Projected track position doesn't drift but is noisy. So `compareLaps` keeps B's summed distance and corrects it by the smoothed (±1s) gap to its position projected onto A's racing line.
3. The gap at the line always equals the official lap-time difference.

**Known limit:** short swings of about 0.1–0.2s can remain around heavy braking zones, because of the roughly 4 Hz sampling. Insights use 12 longer sectors to avoid over-reading them.

## Verification

- `npx react-scripts test src/products`: 44 unit tests covering:
  - lap-time formatting
  - fastest-lap choice
  - distance integration
  - resampling
  - gap maths
  - position alignment under sensor drift
  - braking zones
  - insights
  - colours
  - session filtering
  - driver ranking
  - the API client (encoding, cache, retry, concurrency, bad responses)
- `OPENF1_LIVE=1 CI=true npx react-scripts test src/products`: live end-to-end on 2025 Abu Dhabi qualifying. VER 1:22.207 vs NOR 1:22.408. The computed lap is 5,223 m (official 5,281 m), and the gap at the line matches the official 0.201s.
- Manual in the browser: default load (2026 São Paulo qualifying), deep link, synced hover across charts and map, dark mode, no horizontal overflow.

## Open questions for Brian

1. Where does the AI part show up first: "ask the race" chat, per-lap commentary, or a driver-style fingerprint (GraphRAG)?
2. Past sessions only, or also live weekends (paid OpenF1 tier or own feed)?
3. Should go-kart data sit in the same viewer, so you can compare yourself with an F1 lap shape?
4. Pick any lap (not just the fastest), or add a full-race view (pace per lap, tyre stints from OpenF1 `stints`)?
