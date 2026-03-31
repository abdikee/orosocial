-- Optional local/dev seed script.
-- This script only runs inserts when there are at least 2 profiles already created via auth signup.

do $$
declare
  first_user uuid;
  second_user uuid;
  first_post_id bigint;
begin
  select id into first_user from public.profiles order by created_at asc limit 1;
  select id into second_user from public.profiles where id <> first_user order by created_at asc limit 1;

  if first_user is null or second_user is null then
    raise notice 'Skipping seed: create at least two auth users first.';
    return;
  end if;

  insert into public.posts (author_id, content, image_url)
  values (
    first_user,
    'Hello from the seeded feed. This post verifies backend connectivity.',
    null
  )
  returning id into first_post_id;

  insert into public.comments (post_id, author_id, content)
  values (first_post_id, second_user, 'Seeded comment: backend comments are working.')
  on conflict do nothing;

  insert into public.likes (post_id, user_id)
  values (first_post_id, second_user)
  on conflict do nothing;

  insert into public.follows (follower_id, following_id)
  values (second_user, first_user)
  on conflict do nothing;
end $$;
