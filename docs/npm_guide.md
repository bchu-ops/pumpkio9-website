## Available scripts

Run these from `frontend/`. The site is built with [Vite](https://vite.dev); product pages live in `../products/<name>/web` and are imported as `@products/<name>/web/...`.

| Command | What it does |
|---|---|
| `npm start` | Dev server at http://localhost:3000/pumpkio9-website/ with hot reload |
| `npm test` | Run all tests once (Vitest): `frontend/src` and `products/*/web` |
| `npm run test:watch` | Tests in watch mode |
| `npm run lint` | ESLint over the site and product pages |
| `npm run build` | Production build into `frontend/build` (what the deploy workflow publishes) |
| `npm run preview` | Build, then serve `build/` locally on port 5055 |

Live OpenF1 check (hits the real API): `OPENF1_LIVE=1 npx vitest run live.integration`.
