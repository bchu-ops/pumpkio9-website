# Development workflow

Three kinds of branch:

| Branch | Lives | What it is |
|---|---|---|
| `feat/…`, `fix/…`, `docs/…`, `chore/…` | one change, then deleted | where work happens |
| `dev` | forever | integration: every merged change, one squashed commit each |
| `main` | forever | production: the deployed site. Only ever fast-forwarded to `dev` |

```
feat/x ──PR, squash──▶ dev ──Promote (fast-forward)──▶ main ──▶ GitHub Pages
```

Because `main` only fast-forwards to `dev`, both have the same commits: one per change, no merge commits.

## Steps

1. **Branch from `dev`.**
   ```sh
   git switch dev && git pull
   git switch -c feat/<short-name>
   ```
2. **Work and check locally.** From `frontend/`: `npm run lint && npm test && npm run build`, then look at it with `npm start` (http://localhost:3000/pumpkio9-website/).
3. **Push and open a PR into `dev`.**
   ```sh
   git push -u origin feat/<short-name>
   gh pr create --base dev --fill
   ```
   CI (`.github/workflows/ci.yml`) runs lint, tests and the build for the site and product pages, and pytest for the automations. It runs on PRs into `dev` or `main` and on pushes to `dev`.
4. **Review** the PR's "Files changed" tab. Fix anything by pushing more commits to the same branch.
5. **Squash and merge into `dev`** once CI is green. Title it like a conventional commit (`feat: …`, `fix: …`). Delete the branch.
6. **Release in batches:** merge everything that's ready into `dev` first, then Actions → **Promote dev to main** → Run workflow on `dev`, once. It re-runs CI on `dev`, fast-forwards `main` to `dev` and starts the deploy; everything merged since the last release goes out together. `deploy.yml` also runs hourly and on manual dispatch to refresh the Spotify and F1 snapshots.

To refresh Notion content: Actions → **Sync Notion** → Run workflow. If anything changed it opens a PR into `dev` (CI is dispatched on it); merge it, then Promote.

## Formatting

Prettier is adopted in parts. `frontend/.prettier-allowlist` lists the files it formats; `npm run format:check` (run in CI) checks only those, and `npm run format` rewrites them. To bring another file under Prettier, run it through `npm run format` and add its path to the allowlist in the same PR, so the list grows file by file.

## Rules

- Never commit or push to `main` directly. Never squash or merge-commit `dev` into `main`; that would give `main` commits `dev` doesn't have and stop fast-forwards.
- Never push to `dev` directly either; changes arrive by squashed PR.
- Keep PRs small: one feature or fix each. Large moves (renames, refactors) get their own PR, separate from behaviour changes.
- Workflows never push to `dev`. Promote only fast-forwards `main`; **Sync Notion** pushes a `sync/notion-*` branch and opens a PR into `dev`, which you review and squash like any other. Generated data (F1 snapshot, Spotify listening) is fetched at build time by `deploy.yml`, not committed.
- If `dev` moves while a PR is open: `git fetch && git rebase origin/dev`, then `git push --force-with-lease`.
- Hotfix: same path (branch from `dev` → PR → squash → Promote). If `main` ever gets a commit `dev` lacks, Promote stops and says so; open a PR `main` → `dev` to bring it back.

## Why squash into dev

`dev` and `main` read as one commit per change, each one deployable and easy to revert with `git revert <sha>`. The individual commits stay visible in the closed PR.
