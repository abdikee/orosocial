# OROSOCIAL

OROSOCIAL is a social media app where community connect online.

This project started from the Mini Social Media UI Design concept and has been customized into the OROSOCIAL brand and experience.

## Running the code

Run `npm i` to install the dependencies.

Copy `.env.example` to `.env` and fill:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Apply database migration:

- `supabase/migrations/20260331_000001_social_schema.sql`

Optional local seed:

- `supabase/seed.sql`

Production template:

- `.env.production.example`

Run `npm run dev` to start the development server.

Run test suite:

- `npm run test:run`

Validation and deployment docs:

- `guidelines/backend-auth-validation-checklist.md`
- `guidelines/supabase-deployment-runbook.md`
