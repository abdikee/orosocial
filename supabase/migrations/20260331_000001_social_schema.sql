create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (char_length(username) >= 3),
  display_name text not null,
  avatar_url text,
  bio text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.posts (
  id bigint generated always as identity primary key,
  author_id uuid not null references public.profiles (id) on delete cascade,
  content text not null default '' check (char_length(content) <= 5000),
  image_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.comments (
  id bigint generated always as identity primary key,
  post_id bigint not null references public.posts (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  content text not null check (char_length(content) > 0 and char_length(content) <= 2000),
  created_at timestamptz not null default now()
);

create table if not exists public.likes (
  post_id bigint not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint follows_not_self check (follower_id <> following_id)
);

create index if not exists idx_posts_created_at on public.posts (created_at desc);
create index if not exists idx_posts_author_id_created_at on public.posts (author_id, created_at desc);
create index if not exists idx_comments_post_id_created_at on public.comments (post_id, created_at asc);
create index if not exists idx_likes_user_id on public.likes (user_id);
create index if not exists idx_follows_following_id on public.follows (following_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  email_prefix text;
  generated_username text;
begin
  email_prefix := split_part(new.email, '@', 1);
  generated_username := lower(regexp_replace(coalesce(email_prefix, 'user'), '[^a-zA-Z0-9_]', '', 'g'));

  if generated_username is null or generated_username = '' then
    generated_username := 'user';
  end if;

  generated_username := left(generated_username, 20) || '_' || right(new.id::text, 6);

  insert into public.profiles (id, username, display_name, avatar_url, bio)
  values (
    new.id,
    generated_username,
    coalesce(new.raw_user_meta_data ->> 'display_name', email_prefix, generated_username),
    'https://api.dicebear.com/7.x/avataaars/svg?seed=' || generated_username,
    ''
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.likes enable row level security;
alter table public.follows enable row level security;

drop policy if exists "profiles_read_all" on public.profiles;
create policy "profiles_read_all" on public.profiles
for select
using (true);

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self" on public.profiles
for insert
with check (auth.uid() = id);

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self" on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "posts_read_all" on public.posts;
create policy "posts_read_all" on public.posts
for select
using (true);

drop policy if exists "posts_insert_self" on public.posts;
create policy "posts_insert_self" on public.posts
for insert
with check (auth.uid() = author_id);

drop policy if exists "posts_update_self" on public.posts;
create policy "posts_update_self" on public.posts
for update
using (auth.uid() = author_id)
with check (auth.uid() = author_id);

drop policy if exists "posts_delete_self" on public.posts;
create policy "posts_delete_self" on public.posts
for delete
using (auth.uid() = author_id);

drop policy if exists "comments_read_all" on public.comments;
create policy "comments_read_all" on public.comments
for select
using (true);

drop policy if exists "comments_insert_self" on public.comments;
create policy "comments_insert_self" on public.comments
for insert
with check (auth.uid() = author_id);

drop policy if exists "comments_update_self" on public.comments;
create policy "comments_update_self" on public.comments
for update
using (auth.uid() = author_id)
with check (auth.uid() = author_id);

drop policy if exists "comments_delete_self" on public.comments;
create policy "comments_delete_self" on public.comments
for delete
using (auth.uid() = author_id);

drop policy if exists "likes_read_all" on public.likes;
create policy "likes_read_all" on public.likes
for select
using (true);

drop policy if exists "likes_insert_self" on public.likes;
create policy "likes_insert_self" on public.likes
for insert
with check (auth.uid() = user_id);

drop policy if exists "likes_delete_self" on public.likes;
create policy "likes_delete_self" on public.likes
for delete
using (auth.uid() = user_id);

drop policy if exists "follows_read_all" on public.follows;
create policy "follows_read_all" on public.follows
for select
using (true);

drop policy if exists "follows_insert_self" on public.follows;
create policy "follows_insert_self" on public.follows
for insert
with check (auth.uid() = follower_id);

drop policy if exists "follows_delete_self" on public.follows;
create policy "follows_delete_self" on public.follows
for delete
using (auth.uid() = follower_id);
