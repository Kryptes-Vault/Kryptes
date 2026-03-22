-- Kryptex: Ephemeral sharing (burn-on-read). Recipient may be outside Kryptex — proof of possession = secret UUID.
-- Apply after enabling extensions as noted below.

create table if not exists public.shared_secrets (
  id uuid primary key default gen_random_uuid(),
  ciphertext text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  burn_after_read boolean not null default true
);

create index if not exists shared_secrets_expires_at_idx on public.shared_secrets (expires_at);

comment on table public.shared_secrets is 'Opaque ciphertext blobs for time-limited sharing; prefer RPC get_and_burn_secret for reads.';
comment on column public.shared_secrets.ciphertext is 'Client-encrypted payload; never plaintext user content.';

alter table public.shared_secrets enable row level security;

-- Inserts: only signed-in Supabase users (creators inside Kryptex)
create policy "shared_secrets_insert_authenticated"
  on public.shared_secrets for insert
  to authenticated
  with check (true);

-- Direct SELECT on the table would allow enumeration if misconfigured; we block reads at the table level.
-- Anon + authenticated must use get_and_burn_secret(secret_id) for access (proof of UUID possession).
create policy "shared_secrets_deny_select_table"
  on public.shared_secrets for select
  to anon, authenticated
  using (false);

-- Updates/deletes: not used by app flow except via burn function; deny by default
create policy "shared_secrets_deny_update"
  on public.shared_secrets for update
  to anon, authenticated
  using (false);

create policy "shared_secrets_deny_delete"
  on public.shared_secrets for delete
  to anon, authenticated
  using (false);

-- Atomic read + optional burn: SECURITY DEFINER bypasses RLS; keep search_path pinned
create or replace function public.get_and_burn_secret(secret_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.shared_secrets%rowtype;
  v_out text;
begin
  select * into v_row
  from public.shared_secrets
  where id = secret_id
  for update;

  if not found then
    return null;
  end if;

  if v_row.expires_at <= now() then
    delete from public.shared_secrets where id = secret_id;
    return null;
  end if;

  if v_row.burn_after_read then
    delete from public.shared_secrets
    where id = secret_id
    returning ciphertext into v_out;
    return v_out;
  end if;

  return v_row.ciphertext;
end;
$$;

comment on function public.get_and_burn_secret(uuid) is 'Returns ciphertext and deletes row when burn_after_read; enforces expiry.';

grant execute on function public.get_and_burn_secret(uuid) to anon, authenticated;

-- Optional: allow creators to purge expired rows via SQL; cron handles bulk cleanup below.

-- ---------------------------------------------------------------------------
-- Automated cleanup (requires pg_cron — enable under Database > Extensions in Supabase)
-- ---------------------------------------------------------------------------
-- Run once in SQL editor after pg_cron is enabled:
--
-- select cron.schedule(
--   'kryptex_purge_expired_shared_secrets',
--   '15 * * * *',  -- hourly at :15; adjust as needed
--   $$delete from public.shared_secrets where expires_at < now()$$
-- );
