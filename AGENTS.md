# Project agent memory

This file is the project's committed home for project-intrinsic agent knowledge: build, test, release, architecture, and sharp-edge notes that should travel with the code.

- Add durable project-specific notes here as they are discovered through real work.

## Deployment (Vercel multi-service)

- `vercel.json` at repo root deploys `frontend/` (Next.js) and `backend/` (FastAPI) as separate services with path-based rewrites: `/api/*` -> backend, everything else -> frontend.
- Backend routers are already prefixed with `/api` (see `backend/app/main.py` and `backend/app/api/routes/*.py`), so the root rewrite must forward the full `/api/(.*)` path unchanged - do not add an extra path segment (e.g. `/api/backend/...`) or the backend's own routes won't match.
- `backend/app/main.py` and its submodules import via the absolute `backend.app.*` path (this also matches how `render.yaml` and CI run pytest from the repo root) - do not refactor these to relative `app.*` imports without also updating `render.yaml` and `.github/workflows/ci.yml`.
- `backend/api/index.py` is the Vercel entrypoint. It tries `backend.app.main` first, then falls back to `app.main`, so it works whether Vercel's "root": "backend" isolates that directory or keeps the full repo tree - this was unverified against a live Vercel account, so re-check it if the backend service fails to boot on Vercel.
- `backend/vercel.json` adds a catch-all rewrite (`/(.*) -> /api/index`) inside the backend service, since Vercel's Python runtime otherwise only maps `api/index.py` to the literal `/api`/`/api/index` paths.
- Frontend reads `NEXT_PUBLIC_API_URL` at build time (`frontend/src/lib/api.ts`); it must be `/api` in production for same-origin rewrites to work. This is set via the frontend service's `env` block in `vercel.json`, but that has not been confirmed against a live Vercel deploy - if the build doesn't pick it up, set it directly in the Vercel project's environment variables instead.
- `DATABASE_URL` and `FRONTEND_URL` are not set anywhere in `vercel.json` (same as they weren't in `render.yaml`) - they must be configured as Vercel project environment variables.

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.
