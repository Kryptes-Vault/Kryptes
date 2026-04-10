-- Kryptex: OTP Support Grant Escrow schema
-- Apply via Supabase SQL editor or `supabase db push`.

create table if not exists public.support_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  otp_hash text not null,
  escrow_wrapped_key text not null,
  escrow_iv text not null,
  vault_snapshot text not null,
  expires_at timestamptz not null default (now() + interval '24 hours'),
  created_at timestamptz not null default now()
);

create index if not exists support_grants_user_idx on public.support_grants (user_id, expires_at);

alter table public.support_grants enable row level security;

-- The user who owns the grant can view it
create policy "support_grants_select_own"
  on public.support_grants for select
  to authenticated
  using (user_id = auth.uid());

-- The user can create their own support grants
create policy "support_grants_insert_own"
  on public.support_grants for insert
  to authenticated
  with check (user_id = auth.uid());

-- The user can explicitly revoke (delete) their support grant
create policy "support_grants_delete_own"
  on public.support_grants for delete
  to authenticated
  using (user_id = auth.uid());

comment on table public.support_grants is 'Temporary access payloads encrypted with an OTP-derived key for developer support and debugging.';
