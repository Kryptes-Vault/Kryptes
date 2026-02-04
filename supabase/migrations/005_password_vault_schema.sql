-- Kryptex: Password Vault schema extension.
-- Adds metadata columns for password management and a dedicated audit log.
-- Apply via Supabase SQL Editor or `supabase db push`.
-- ─────────────────────────────────────────────────────────────────────

-- 1. Extend vault_items with password-specific metadata (searchable plaintext)
alter table public.vault_items
  add column if not exists website_url text,
  add column if not exists category text not null default 'other',
  add column if not exists item_type text not null default 'secret';

comment on column public.vault_items.website_url is 'Plaintext URL for favicon resolution; never contains credentials.';
comment on column public.vault_items.category is 'User-assigned category: social, work, shopping, finance, other.';
comment on column public.vault_items.item_type is 'Distinguishes password entries from generic secrets: password | secret.';

-- 2. Index for category filtering
create index if not exists vault_items_category_idx
  on public.vault_items (user_id, category);

create index if not exists vault_items_item_type_idx
  on public.vault_items (user_id, item_type);

-- 3. Vault Audit Log — tracks reveal, copy, create, delete actions
create table if not exists public.vault_audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  vault_item_id uuid references public.vault_items (id) on delete set null,
  action text not null,  -- 'reveal' | 'copy' | 'create' | 'delete'
  metadata jsonb default '{}',
  created_at timestamptz not null default now()
);

create index if not exists vault_audit_log_user_idx
  on public.vault_audit_log (user_id, created_at desc);

comment on table public.vault_audit_log is 'Zero-knowledge audit trail; logs credential access events without storing decrypted content.';

-- 4. RLS for vault_audit_log
alter table public.vault_audit_log enable row level security;

create policy "audit_log_select_own"
  on public.vault_audit_log for select
  to authenticated
  using (user_id = auth.uid());

create policy "audit_log_insert_own"
  on public.vault_audit_log for insert
  to authenticated
  with check (user_id = auth.uid());

-- Users cannot update or delete audit logs (immutable trail)
create policy "audit_log_deny_update"
  on public.vault_audit_log for update
  to authenticated
  using (false);

create policy "audit_log_deny_delete"
  on public.vault_audit_log for delete
  to authenticated
  using (false);
