Deployed on https://bchu-ops.github.io/pumpkio9-website/

## Layout

```
frontend/            the website (Vite + React): home, navbar, footer, Notion pages
backend/automations/ scheduled scripts: Notion sync, resume → Notion, Spotify sync, F1 snapshot
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
| Spotify | `/Spotify` | `products/spotify/` |
| Product 2 | `/Product2` (placeholder) | `products/product2/` |

Commands: see `docs/npm_guide.md`. Secrets and `.env` files: `docs/secrets.md`. How changes get deployed: `docs/workflow.md` (feature branch → PR → squash into `dev` → Promote to `main`).
