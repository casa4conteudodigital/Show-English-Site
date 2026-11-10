-- Execute once in the Supabase SQL editor. Provision accounts via Supabase Auth.
begin;
create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 role text not null check (role in ('teacher','admin'))
);
create table public.rooms (
 id uuid primary key default gen_random_uuid(),
 title text not null,
 starts_at timestamptz,
 active boolean not null default true
);
create table public.room_members (
 room_id uuid not null references public.rooms(id) on delete cascade,
 user_id uuid not null references public.profiles(id) on delete cascade,
 primary key(room_id,user_id)
);
alter table public.profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
revoke all on public.profiles,public.rooms,public.room_members from anon,authenticated;
grant select on public.profiles,public.rooms,public.room_members to authenticated;
create policy own_profile on public.profiles for select to authenticated using (id=auth.uid());
create policy own_membership on public.room_members for select to authenticated using (user_id=auth.uid());
create policy assigned_rooms on public.rooms for select to authenticated using (
 exists(select 1 from public.room_members m where m.room_id=rooms.id and m.user_id=auth.uid())
);
-- Only the SQL editor/trusted administrative backend may assign roles and rooms.
-- Admins also need explicit room membership; no browser-side role escalation.
commit;
