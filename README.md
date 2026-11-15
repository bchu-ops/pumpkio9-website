Deployed on https://bchu-ops.github.io/pumpkio9-website/

## Layout

```
frontend/            the website (Vite + React): home, navbar, footer, Notion pages
backend/automations/ scripts: Notion sync, resume → Notion (run locally); Spotify + F1 snapshots (run by the hourly deploy)
products/<name>/     everything for one product
  web/               its page on the site, imported by frontend as @products/<name>/web/...
  docs/              its write-ups and research
  backend/ ...       its own backend, if it has one
docs/                site-wide notes
```

## Products

| Product | Page | Folder |
|---|---|---|
| Speed Demon | `/speed-demon` | `products/speeddemon/` (web page, plus the kart/telemetry project merged from github.com/bchu-ops/speeddemon with history) |
| Process Lab | `/process-lab` | `products/processlab/` |
| My Spotify | `/Spotify` | `products/spotify/` |

Commands: see `docs/npm_guide.md`. Secrets and `.env` files: `docs/secrets.md`. How changes get deployed: `docs/workflow.md` (feature branch → PR → squash into `dev` → Promote to `main`).
