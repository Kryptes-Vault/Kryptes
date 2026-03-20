-- Kryptes: virtual folder/file metadata in Postgres; blobs live in MEGA (flat root).
-- Folder codes and file codes are opaque identifiers; structure is enforced only in this DB.

-- ── Folders ───────────────────────────────────────────────────────────────────
create table if not exists public.vault_folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  folder_name text not null,
  -- Human-facing label; uniqueness per user is enforced below.
  unique_folder_code text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vault_folders_folder_name_not_empty check (char_length(trim(folder_name)) > 0),
  constraint vault_folders_code_format check (unique_folder_code ~ '^F-[A-Z0-9]{6,14}$')
);

-- Codes must be unique globally so vault_files can reference by code alone.
create unique index if not exists vault_folders_unique_folder_code_key
  on public.vault_folders (unique_folder_code);

create unique index if not exists vault_folders_user_folder_name_key
  on public.vault_folders (user_id, lower(folder_name));

create index if not exists vault_folders_user_id_idx on public.vault_folders (user_id);

-- ── Files ─────────────────────────────────────────────────────────────────────
create table if not exists public.vault_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  file_name text not null,
  -- Shareable link returned by MEGA after upload (encrypted transport; link is public to holder).
  mega_file_link text not null,
  unique_file_code text not null,
  linked_folder_code text not null references public.vault_folders (unique_folder_code) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vault_files_file_name_not_empty check (char_length(trim(file_name)) > 0),
  constraint vault_files_code_format check (unique_file_code ~ '^(IMG|DOC|FILE)-[A-Z0-9]{6,14}$')
);

create unique index if not exists vault_files_unique_file_code_key
  on public.vault_files (unique_file_code);

create index if not exists vault_files_user_id_idx on public.vault_files (user_id);
create index if not exists vault_files_linked_folder_code_idx on public.vault_files (linked_folder_code);
create index if not exists vault_files_user_folder_idx on public.vault_files (user_id, linked_folder_code);

-- Ensure file row belongs to the same user as the linked folder (defense in depth with RLS).
create or replace function public.enforce_vault_file_folder_user_match()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  folder_owner uuid;
begin
  select vf.user_id into folder_owner
  from public.vault_folders vf
  where vf.unique_folder_code = new.linked_folder_code;

  if folder_owner is null then
    raise exception 'Invalid linked_folder_code';
  end if;

  if folder_owner <> new.user_id then
    raise exception 'linked_folder_code does not belong to user_id';
  end if;

  return new;
end;
$$;

drop trigger if exists vault_files_enforce_folder_user on public.vault_files;
create trigger vault_files_enforce_folder_user
  before insert or update on public.vault_files
  for each row
  execute procedure public.enforce_vault_file_folder_user_match();

create or replace function public.set_vault_folders_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists vault_folders_set_updated_at on public.vault_folders;
create trigger vault_folders_set_updated_at
  before update on public.vault_folders
  for each row
  execute procedure public.set_vault_folders_updated_at();

create or replace function public.set_vault_files_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists vault_files_set_updated_at on public.vault_files;
create trigger vault_files_set_updated_at
  before update on public.vault_files
  for each row
  execute procedure public.set_vault_files_updated_at();

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table public.vault_folders enable row level security;
alter table public.vault_files enable row level security;

create policy "vault_folders_select_own"
  on public.vault_folders for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "vault_folders_insert_own"
  on public.vault_folders for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "vault_folders_update_own"
  on public.vault_folders for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "vault_folders_delete_own"
  on public.vault_folders for delete
  to authenticated
  using (user_id = (select auth.uid()));

create policy "vault_files_select_own"
  on public.vault_files for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "vault_files_insert_own"
  on public.vault_files for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "vault_files_update_own"
  on public.vault_files for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "vault_files_delete_own"
  on public.vault_files for delete
  to authenticated
  using (user_id = (select auth.uid()));

comment on table public.vault_folders is 'Virtual folders; MEGA has no nested paths for these.';
comment on table public.vault_files is 'File metadata and MEGA link; binary lives in MEGA root with opaque name.';
comment on column public.vault_files.mega_file_link is 'MEGA public link for the uploaded blob; keep server-side only if you prefer signed URLs.';
