---SupabaseSQL---
create extension if not exists pgcrypto;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  created_by uuid not null,
  created_at timestamptz not null default now()
);

create table if not exists public.project_members (
  user_id uuid not null,
  project_id uuid not null references public.projects(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, project_id)
);

create table if not exists public.project_names (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null,
  display_name text not null,
  device_hash text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists uq_project_names_project_device
  on public.project_names(project_id, device_hash);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null,
  title text not null,
  body text not null,
  media_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null,
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);


create table if not exists public.app_admins (
  user_id uuid primary key,
  created_at timestamptz not null default now()
);

alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.project_names enable row level security;
alter table public.messages enable row level security;
alter table public.posts enable row level security;
alter table public.announcements enable row level security;
alter table public.app_admins enable row level security;

drop policy if exists app_admins_select on public.app_admins;
create policy app_admins_select on public.app_admins
for select to authenticated
using (user_id = auth.uid());

-- Zugriff nur für eingeloggte Nutzer.
drop policy if exists projects_select on public.projects;
create policy projects_select on public.projects
for select to authenticated
using (
  exists (
    select 1 from public.project_members pm
    where pm.project_id = projects.id and pm.user_id = auth.uid()
  )
);

drop policy if exists projects_insert on public.projects;
create policy projects_insert on public.projects
for insert to authenticated
with check (created_by = auth.uid());

drop policy if exists project_members_select on public.project_members;
create policy project_members_select on public.project_members
for select to authenticated
using (user_id = auth.uid());

drop policy if exists project_members_insert on public.project_members;
create policy project_members_insert on public.project_members
for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists project_names_select on public.project_names;
create policy project_names_select on public.project_names
for select to authenticated
using (
  exists (
    select 1 from public.project_members pm
    where pm.project_id = project_names.project_id and pm.user_id = auth.uid()
  )
);

drop policy if exists project_names_insert on public.project_names;
create policy project_names_insert on public.project_names
for insert to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.project_members pm
    where pm.project_id = project_names.project_id and pm.user_id = auth.uid()
  )
);

drop policy if exists messages_select on public.messages;
create policy messages_select on public.messages
for select to authenticated
using (
  exists (
    select 1 from public.project_members pm
    where pm.project_id = messages.project_id and pm.user_id = auth.uid()
  )
);

drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages
for insert to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.project_members pm
    where pm.project_id = messages.project_id and pm.user_id = auth.uid()
  )
);

drop policy if exists posts_select on public.posts;
create policy posts_select on public.posts
for select to authenticated
using (
  exists (
    select 1 from public.project_members pm
    where pm.project_id = posts.project_id and pm.user_id = auth.uid()
  )
);

drop policy if exists posts_insert on public.posts;
create policy posts_insert on public.posts
for insert to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.project_members pm
    where pm.project_id = posts.project_id and pm.user_id = auth.uid()
  )
);

drop policy if exists posts_update on public.posts;
create policy posts_update on public.posts
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists posts_delete on public.posts;
create policy posts_delete on public.posts
for delete to authenticated
using (user_id = auth.uid());

drop policy if exists announcements_select on public.announcements;
create policy announcements_select on public.announcements
for select to authenticated
using (
  exists (
    select 1 from public.project_members pm
    where pm.project_id = announcements.project_id and pm.user_id = auth.uid()
  )
);

drop policy if exists announcements_insert on public.announcements;
create policy announcements_insert on public.announcements
for insert to authenticated
with check (
  exists (select 1 from public.app_admins a where a.user_id = auth.uid())
  and user_id = auth.uid()
);

drop policy if exists announcements_update on public.announcements;
create policy announcements_update on public.announcements
for update to authenticated
using (exists (select 1 from public.app_admins a where a.user_id = auth.uid()))
with check (exists (select 1 from public.app_admins a where a.user_id = auth.uid()));

drop policy if exists announcements_delete on public.announcements;
create policy announcements_delete on public.announcements
for delete to authenticated
using (exists (select 1 from public.app_admins a where a.user_id = auth.uid()));


-- Globaler Admin-Zugriff: trage deine auth.uid in app_admins ein.
drop policy if exists projects_admin_all on public.projects;
create policy projects_admin_all on public.projects
for all to authenticated
using (exists (select 1 from public.app_admins a where a.user_id = auth.uid()))
with check (exists (select 1 from public.app_admins a where a.user_id = auth.uid()));

drop policy if exists project_members_admin_all on public.project_members;
create policy project_members_admin_all on public.project_members
for all to authenticated
using (exists (select 1 from public.app_admins a where a.user_id = auth.uid()))
with check (exists (select 1 from public.app_admins a where a.user_id = auth.uid()));

drop policy if exists project_names_admin_all on public.project_names;
create policy project_names_admin_all on public.project_names
for all to authenticated
using (exists (select 1 from public.app_admins a where a.user_id = auth.uid()))
with check (exists (select 1 from public.app_admins a where a.user_id = auth.uid()));

drop policy if exists messages_admin_all on public.messages;
create policy messages_admin_all on public.messages
for all to authenticated
using (exists (select 1 from public.app_admins a where a.user_id = auth.uid()))
with check (exists (select 1 from public.app_admins a where a.user_id = auth.uid()));

drop policy if exists posts_admin_all on public.posts;
create policy posts_admin_all on public.posts
for all to authenticated
using (exists (select 1 from public.app_admins a where a.user_id = auth.uid()))
with check (exists (select 1 from public.app_admins a where a.user_id = auth.uid()));

drop policy if exists announcements_admin_all on public.announcements;
create policy announcements_admin_all on public.announcements
for all to authenticated
using (exists (select 1 from public.app_admins a where a.user_id = auth.uid()))
with check (exists (select 1 from public.app_admins a where a.user_id = auth.uid()));

