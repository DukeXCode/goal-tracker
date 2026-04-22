# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun install                # install all dependencies
bun run dev                # run API + web concurrently
bun run dev:api            # run API only (wrangler dev on :8787)
bun run dev:web            # run web only (vite on :5173)
bun run setup:db           # initialize local D1 database with migrations
```

Deploy: `cd apps/api && npx wrangler deploy`

No test runner or linter is configured yet.

## Architecture

Bun monorepo with three workspaces:

- **`apps/api`** — Hono API on Cloudflare Workers with D1 (SQLite). Routes are in `src/routes/`. The `Bindings` type (defining `DB: D1Database`) is exported from `src/index.ts` and used by all route files.
- **`apps/web`** — React 19 SPA with Vite, Tailwind CSS v4, and React Router v7. In dev, Vite proxies `/api` requests to the worker on `:8787`. The `VITE_API_URL` env var overrides the API base URL in production.
- **`packages/shared`** — TypeScript types (`Goal`, `JournalEntry`, and their CRUD input types) shared between API and web via `@goal-tracker/shared`.

## Data Model

Current schema in `apps/api//apps/api/src/db/schema.sql`

## API Routes

All routes are prefixed with `/api`:
Responses wrap data in `{ data: ... }` (or `{ error: ... }` on failure).

## Frontend Patterns

- Pages are in `src/pages/`, reusable components in `src/components/`
