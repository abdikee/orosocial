# Supabase Deployment Runbook

## 1) Prerequisites

- Supabase project created
- Supabase CLI installed and authenticated
- Production secrets available:
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_URL`

## 2) Environment setup

- Copy `.env.production.example` to your deployment secret manager (or CI vars).
- Set frontend public vars:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- Set edge runtime vars:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `ALLOWED_ORIGINS`
  - `WRITE_RATE_LIMIT_WINDOW_MS`
  - `WRITE_RATE_LIMIT_MAX`

## 3) Database migration

- Apply schema migration:
  - `supabase/migrations/20260331_000001_social_schema.sql`
- Optional non-production seed:
  - `supabase/seed.sql`

## 4) Edge function deployment

- Deploy function:
  - `supabase functions deploy server --project-ref <project-ref>`
- Confirm health endpoint:
  - `/functions/v1/server/make-server-112187e4/health`

## 5) Frontend deployment

- Build app:
  - `npm run build`
- Deploy `dist/` with production env values configured.

## 6) Post-deploy validation

- Verify auth:
  - signup, login, logout, session restore after refresh
- Verify social flow:
  - feed load, create post, comment, like, follow/unfollow
- Verify security:
  - unauthenticated API calls return `401`
  - invalid payloads return `validation_error`

## 7) Rollback strategy

- Frontend: redeploy previous artifact.
- Edge function: redeploy last known stable function bundle.
- Database: keep backward-compatible migrations; avoid destructive down migrations in production.
