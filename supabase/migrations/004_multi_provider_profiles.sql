-- Kryptex: Multi-provider profile mapping with Twitter (X) metadata support.
-- Adds avatar_url and auth_provider columns; rewrites the trigger to extract
-- display_name and avatar_url from ANY provider's raw_user_meta_data.
--
-- Twitter metadata keys:
--   user_name        → Twitter handle (e.g. "kryptex_vault")
--   name             → Display name
--   avatar_url       → Profile picture URL
--   picture          → (Google uses this key instead)
--   full_name        → (Google / email uses this)
--
-- Apply via: Supabase SQL Editor → paste & run, or `supabase db push`
-- ─────────────────────────────────────────────────────────────────────

-- 1. Add new columns if they don't exist
alter table public.profiles
  add column if not exists avatar_url text,
  add column if not exists auth_provider text default 'email';

-- 2. Replace the trigger function to handle ALL providers
create or replace function public.handle_new_user()
returns trigger as $$
declare
  _display_name text;
  _avatar_url   text;
  _provider     text;
begin
  -- ── Resolve provider ─────────────────────────────────────────────
  -- Supabase stores the primary identity provider in app_metadata.provider
  _provider := coalesce(
    new.raw_app_meta_data ->> 'provider',
    'email'
  );

  -- ── Resolve display name (provider-priority cascade) ─────────────
  -- Twitter:  "name" or "user_name"
  -- Google:   "full_name" or "name"
  -- Azure:    "full_name" or "preferred_username"
  -- Email:    falls back to email prefix
  _display_name := coalesce(
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'name',
    new.raw_user_meta_data ->> 'user_name',
    new.raw_user_meta_data ->> 'preferred_username',
    split_part(new.email, '@', 1)
  );

  -- ── Resolve avatar URL ───────────────────────────────────────────
  -- Twitter:  "avatar_url"
  -- Google:   "avatar_url" or "picture"
  -- Azure:    "picture"
  _avatar_url := coalesce(
    new.raw_user_meta_data ->> 'avatar_url',
    new.raw_user_meta_data ->> 'picture'
  );

  -- ── Upsert into profiles ─────────────────────────────────────────
  insert into public.profiles (id, display_name, avatar_url, auth_provider, updated_at)
  values (new.id, _display_name, _avatar_url, _provider, now())
  on conflict (id) do update set
    display_name  = coalesce(excluded.display_name, public.profiles.display_name),
    avatar_url    = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    auth_provider = excluded.auth_provider,
    updated_at    = now();

  return new;
end;
$$ language plpgsql security definer;

-- 3. Recreate the trigger (safe: drops if exists first)
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. Also fire on UPDATE so returning OAuth users get fresh metadata
-- (Supabase updates auth.users when a user signs in with OAuth again
-- after profile changes on the provider side)
drop trigger if exists on_auth_user_updated on auth.users;

create trigger on_auth_user_updated
  after update of raw_user_meta_data on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. Backfill existing users who signed in before this migration
-- This is idempotent — ON CONFLICT handles duplicates.
insert into public.profiles (id, display_name, avatar_url, auth_provider, updated_at)
select
  u.id,
  coalesce(
    u.raw_user_meta_data ->> 'full_name',
    u.raw_user_meta_data ->> 'name',
    u.raw_user_meta_data ->> 'user_name',
    split_part(u.email, '@', 1)
  ),
  coalesce(
    u.raw_user_meta_data ->> 'avatar_url',
    u.raw_user_meta_data ->> 'picture'
  ),
  coalesce(u.raw_app_meta_data ->> 'provider', 'email'),
  now()
from auth.users u
on conflict (id) do update set
  display_name  = coalesce(excluded.display_name, public.profiles.display_name),
  avatar_url    = coalesce(excluded.avatar_url, public.profiles.avatar_url),
  auth_provider = coalesce(excluded.auth_provider, public.profiles.auth_provider),
  updated_at    = now();
