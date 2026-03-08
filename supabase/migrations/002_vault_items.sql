-- Kryptex: zero-knowledge vault item storage (ciphertext only; no plaintext secrets).
-- Apply via Supabase SQL editor or `supabase db push`.

create table if not exists public.vault_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  -- Encrypted payload (e.g. base64); produced client-side before insert
  ciphertext text not null,
  -- Initialization vector / nonce for the AEAD scheme (e.g. base64)
  iv text not null,
  -- Optional salt for KDF / per-item wrapping; omit in application if unused (nullable)
  salt text,
  -- Optional non-secret crypto metadata (e.g. algorithm version string)
  encryption_version text not null default 'v1',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists vault_items_user_id_idx on public.vault_items (user_id);
create index if not exists vault_items_user_updated_idx on public.vault_items (user_id, updated_at desc);

create or replace function public.set_vault_items_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists vault_items_set_updated_at on public.vault_items;
create trigger vault_items_set_updated_at
  before update on public.vault_items
  for each row
  execute procedure public.set_vault_items_updated_at();

alter table public.vault_items enable row level security;

-- Strict tenant isolation: only the authenticated user may touch their rows
create policy "vault_items_select_own"
  on public.vault_items for select
  to authenticated
  using (user_id = auth.uid());

create policy "vault_items_insert_own"
  on public.vault_items for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "vault_items_update_own"
  on public.vault_items for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "vault_items_delete_own"
  on public.vault_items for delete
  to authenticated
  using (user_id = auth.uid());

comment on table public.vault_items is 'Opaque ciphertext blobs; plaintext only exists on client devices.';
comment on column public.vault_items.ciphertext is 'Encrypted vault payload; never store plaintext secrets here.';
comment on column public.vault_items.iv is 'Nonce/IV for AEAD (e.g. AES-GCM).';
comment on column public.vault_items.salt is 'Optional salt for KDF or per-item key derivation.';
