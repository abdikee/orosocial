# Backend/Auth Validation Checklist

## Slice A: Auth + Protected Routes + Profile Bootstrap

- [ ] `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set in local `.env`.
- [ ] Database migration `supabase/migrations/20260331_000001_social_schema.sql` is applied.
- [ ] Signup creates an auth user and profile row.
- [ ] Login succeeds and redirects from `/login` to `/`.
- [ ] Unauthenticated visits to `/`, `/search`, and `/profile/:userId` redirect to `/login`.
- [ ] Logout ends session and blocks protected routes.
- [ ] Refresh keeps a logged-in session and restores protected UI.
- [ ] Profile endpoint `/api/v1/profiles/me` returns expected data.

## Slice B: Feed + Posts + Comments + Likes + Follows

- [ ] Feed endpoint `/api/v1/feed` returns posts with author, counts, and `is_liked`.
- [ ] Creating a post updates home feed immediately.
- [ ] Opening comments on a post loads comments from backend.
- [ ] Adding a comment persists and increments comment count.
- [ ] Like toggle updates state and persists after refresh.
- [ ] Search endpoint returns users for username and display name matches.
- [ ] Follow/unfollow from Search/Followers/Following updates relationship state.
- [ ] RLS checks: authenticated users can only write own profile/posts/comments/likes/follows rows.

## Deployment Smoke Checks

- [ ] Edge function is deployed and reachable at `/make-server-112187e4/health`.
- [ ] Edge API routes under `/make-server-112187e4/api/v1/*` return JSON error bodies on failures.
- [ ] Browser console shows no auth or fetch errors during full user flow.
