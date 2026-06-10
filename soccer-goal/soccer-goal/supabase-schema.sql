-- Soccer Goal – komplettes Schema in Supabase SQL Editor ausführen
-- Danach: Database → Replication → soccer_rooms + match_queue aktivieren
-- Auth → Providers → Email → „Confirm email“ AUS (für sofortiges Spielen)

-- ========== PROFILE (Alias pro Account) ==========
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  alias text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists profiles_alias_lower_idx on public.profiles (lower(alias));

alter table public.profiles enable row level security;

create policy "profiles read aliases"
on public.profiles for select to anon, authenticated using (true);

create policy "profiles insert own"
on public.profiles for insert to authenticated
with check (auth.uid() = id);

create policy "profiles update own"
on public.profiles for update to authenticated
using (auth.uid() = id);

-- ========== SPIELRÄUME (Party + Zufall) ==========
create table if not exists public.soccer_rooms (
  id uuid primary key default gen_random_uuid(),
  room_code text unique,
  mode text not null default 'party',
  player1_id uuid references auth.users(id) on delete set null,
  player2_id uuid references auth.users(id) on delete set null,
  player1_name text not null default 'Spieler 1',
  player2_name text,
  player1_client text not null,
  player2_client text,
  host_slot smallint not null default 0,
  status text not null default 'waiting',
  game_state jsonb not null default '{}'::jsonb,
  log_lines jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists soccer_rooms_code_idx on public.soccer_rooms (room_code);
create index if not exists soccer_rooms_status_idx on public.soccer_rooms (status);

alter table public.soccer_rooms enable row level security;

create policy "soccer read rooms"
on public.soccer_rooms for select to anon, authenticated using (true);

create policy "soccer insert rooms"
on public.soccer_rooms for insert to anon, authenticated with check (true);

create policy "soccer update rooms"
on public.soccer_rooms for update to anon, authenticated using (true);

create policy "soccer delete rooms"
on public.soccer_rooms for delete to anon, authenticated using (true);

-- ========== WARTESCHLANGE (Zufallssuche) ==========
create table if not exists public.match_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  alias text not null,
  client_id text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists match_queue_user_idx on public.match_queue (user_id);

alter table public.match_queue enable row level security;

create policy "queue read all"
on public.match_queue for select to anon, authenticated using (true);

create policy "queue insert own"
on public.match_queue for insert to authenticated
with check (auth.uid() = user_id);

create policy "queue delete own"
on public.match_queue for delete to authenticated
using (auth.uid() = user_id);

create policy "queue delete any for matchmaking"
on public.match_queue for delete to authenticated using (true);
