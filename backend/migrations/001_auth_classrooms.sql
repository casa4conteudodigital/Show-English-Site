begin;

create table if not exists public.schema_migrations (
  version text primary key,
  applied_at timestamptz not null default now()
);
alter table public.schema_migrations enable row level security;
revoke all on public.schema_migrations from anon, authenticated;

  update public.classrooms c set lifecycle_status='open', updated_at=now()
    where c.id=p_classroom_id and c.lifecycle_status='scheduled' and c.scheduled_start <= now();
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  avatar_url text,
  terms_version text,
  terms_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles add column if not exists display_name text not null default '';
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists terms_version text;
alter table public.profiles add column if not exists terms_accepted_at timestamptz;
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='role') then
    alter table public.profiles alter column role drop not null;
  end if;
end $$;

create table if not exists public.user_roles (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('student','teacher','admin')),
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
create index if not exists user_roles_user_role_idx on public.user_roles(user_id, role);

create table if not exists public.classrooms (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) between 1 and 120),
  description text,
  owner_id uuid not null references public.profiles(id) on delete restrict,
  livekit_room_name text not null unique,
  access_mode text not null default 'members_only' check (access_mode in ('authenticated_demo','members_only')),
  lifecycle_status text not null default 'scheduled' check (lifecycle_status in ('scheduled','open','closed')),
  scheduled_start timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists classrooms_owner_status_idx on public.classrooms(owner_id, lifecycle_status);
create index if not exists classrooms_status_start_idx on public.classrooms(lifecycle_status, scheduled_start);

create table if not exists public.classroom_members (
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('host','participant')),
  created_at timestamptz not null default now(),
  primary key (classroom_id, user_id)
);
create index if not exists classroom_members_user_idx on public.classroom_members(user_id, classroom_id);

create table if not exists public.classroom_sessions (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  livekit_session_id text,
  connection_id uuid not null unique,
  user_id uuid not null references public.profiles(id) on delete cascade,
  participant_identity text not null unique,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  last_livekit_event_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.classroom_sessions add column if not exists last_livekit_event_at timestamptz;
create index if not exists classroom_sessions_room_active_idx on public.classroom_sessions(classroom_id, ended_at);
create index if not exists classroom_sessions_user_active_idx on public.classroom_sessions(user_id, ended_at);

create table if not exists public.livekit_events (
  event_id text primary key,
  event_type text not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  classroom_id uuid references public.classrooms(id) on delete set null,
  livekit_room_name text,
  livekit_session_id text,
  participant_identity text,
  payload_hash text not null
);
create index if not exists livekit_events_room_received_idx on public.livekit_events(classroom_id, received_at desc);
create table if not exists public.classroom_token_issues (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  issued_at timestamptz not null default now()
);
create index if not exists classroom_token_issues_user_time_idx on public.classroom_token_issues(user_id, issued_at desc);
create table if not exists public.classroom_token_issues (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  issued_at timestamptz not null default now()
);
create index if not exists classroom_token_issues_user_time_idx on public.classroom_token_issues(user_id, issued_at desc);

-- Preserve existing collaborator roles and rooms when upgrading the previous schema.
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='role') then
    execute $copy_roles$insert into public.user_roles(user_id, role)
      select id, case when role in ('teacher','admin') then role else 'student' end
      from public.profiles where role in ('teacher','admin')
      on conflict (user_id, role) do nothing$copy_roles$;
    alter table public.profiles drop column role;
  end if;
  if to_regclass('public.rooms') is not null then
    execute 'alter table public.rooms add column if not exists created_by uuid';
    execute 'alter table public.rooms add column if not exists created_at timestamptz not null default now()';
    execute 'alter table public.rooms add column if not exists updated_at timestamptz not null default now()';
    execute $copy_rooms$insert into public.classrooms(id, title, owner_id, livekit_room_name, access_mode, lifecycle_status, scheduled_start, created_at, updated_at)
      select r.id, r.title,
        coalesce(r.created_by, m.user_id),
        'se-' || replace(r.id::text, '-', ''),
        'members_only',
        case when r.active then 'open' else 'closed' end,
        r.starts_at, now(), now()
      from public.rooms r
      left join lateral (
        select rm.user_id from public.room_members rm where rm.room_id=r.id order by rm.user_id limit 1
      ) m on true
      where coalesce(r.created_by, m.user_id) is not null
      on conflict (id) do nothing$copy_rooms$;
    execute $copy_members$insert into public.classroom_members(classroom_id, user_id, role)
      select r.id, rm.user_id,
        case when c.owner_id=rm.user_id then 'host' else 'participant' end
      from public.rooms r
      join public.room_members rm on rm.room_id=r.id
      join public.classrooms c on c.id=r.id
      on conflict (classroom_id, user_id) do nothing$copy_members$;
  end if;
end $$;

create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, display_name, terms_version, terms_accepted_at)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data->>'display_name',''), 100),
    case when new.raw_user_meta_data->>'terms_accepted' = 'true' then left(new.raw_user_meta_data->>'terms_version', 30) else null end,
    case when new.raw_user_meta_data->>'terms_accepted' = 'true' then now() else null end
  ) on conflict (id) do nothing;
  insert into public.user_roles(user_id, role) values (new.id, 'student') on conflict (user_id, role) do nothing;
  return new;
end;
$$;

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function public.touch_updated_at() from public, anon, authenticated;
drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at before update on public.profiles for each row execute function public.touch_updated_at();
drop trigger if exists classrooms_touch_updated_at on public.classrooms;
create trigger classrooms_touch_updated_at before update on public.classrooms for each row execute function public.touch_updated_at();
revoke all on function public.handle_new_auth_user() from public, anon, authenticated;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_auth_user();
insert into public.profiles(id, display_name)
  select u.id, left(coalesce(u.raw_user_meta_data->>'display_name',''),100)
  from auth.users u
  on conflict (id) do update set display_name=case when public.profiles.display_name='' then excluded.display_name else public.profiles.display_name end;
insert into public.user_roles(user_id, role)
  select p.id, 'student' from public.profiles p
  where not exists(select 1 from public.user_roles ur where ur.user_id=p.id)
  on conflict (user_id, role) do nothing;

create or replace function public.is_classroom_manager(p_classroom_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.classrooms c
    where c.id=p_classroom_id and (
      c.owner_id=auth.uid() or exists (
        select 1 from public.user_roles ur where ur.user_id=auth.uid() and ur.role='admin'
      )
    )
  );
$$;
revoke all on function public.is_classroom_manager(uuid) from public, anon;
grant execute on function public.is_classroom_manager(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.classrooms enable row level security;
alter table public.classroom_members enable row level security;
alter table public.classroom_sessions enable row level security;
alter table public.livekit_events enable row level security;
alter table public.classroom_token_issues enable row level security;
revoke all on public.profiles, public.user_roles, public.classrooms, public.classroom_members, public.classroom_sessions, public.livekit_events, public.classroom_token_issues from anon, authenticated;
grant select on public.profiles, public.user_roles, public.classrooms, public.classroom_members to authenticated;
grant update (display_name, avatar_url) on public.profiles to authenticated;

drop policy if exists profile_read_self on public.profiles;
create policy profile_read_self on public.profiles for select to authenticated using (id=auth.uid());
drop policy if exists profile_update_self on public.profiles;
create policy profile_update_self on public.profiles for update to authenticated using (id=auth.uid()) with check (id=auth.uid());
drop policy if exists roles_read_self on public.user_roles;
create policy roles_read_self on public.user_roles for select to authenticated using (user_id=auth.uid());
drop policy if exists classrooms_read_authorized on public.classrooms;
create policy classrooms_read_authorized on public.classrooms for select to authenticated using (
  lifecycle_status <> 'closed' and (
    owner_id=auth.uid() or access_mode='authenticated_demo' or exists (
      select 1 from public.classroom_members m where m.classroom_id=id and m.user_id=auth.uid()
    )
  )
);
drop policy if exists classroom_members_read_authorized on public.classroom_members;
create policy classroom_members_read_authorized on public.classroom_members for select to authenticated using (
  user_id=auth.uid() or public.is_classroom_manager(classroom_id)
);

create or replace function public.create_classroom(
  p_title text, p_description text, p_scheduled_start timestamptz,
  p_access_mode text, p_livekit_room_name text
) returns setof public.classrooms
language plpgsql security definer set search_path = '' as $$
declare v_user_id uuid := auth.uid(); v_id uuid;
begin
  if v_user_id is null or not exists(select 1 from public.user_roles ur where ur.user_id=v_user_id and ur.role in ('teacher','admin')) then
    raise exception 'not authorized' using errcode='42501';
  end if;
  if length(trim(p_title)) not between 1 and 120 or p_access_mode not in ('authenticated_demo','members_only') or p_livekit_room_name !~ '^se-[0-9a-f]{32}$' then
    raise exception 'invalid classroom data' using errcode='22023';
  end if;
  insert into public.classrooms(title, description, owner_id, livekit_room_name, access_mode, lifecycle_status, scheduled_start)
    values(trim(p_title), nullif(trim(p_description),''), v_user_id, p_livekit_room_name, p_access_mode,
      case when p_scheduled_start is null or p_scheduled_start <= now() then 'open' else 'scheduled' end, p_scheduled_start)
    returning id into v_id;
  insert into public.classroom_members(classroom_id,user_id,role) values(v_id,v_user_id,'host');
  return query select c.* from public.classrooms c where c.id=v_id;
end;
$$;

create or replace function public.join_classroom(p_classroom_id uuid)
returns setof public.classrooms
language plpgsql security definer set search_path = '' as $$
declare v_user_id uuid := auth.uid(); v_class public.classrooms;
begin
  if v_user_id is null then raise exception 'not authenticated' using errcode='42501'; end if;
  update public.classrooms c set lifecycle_status='open', updated_at=now()
    where c.id=p_classroom_id and c.lifecycle_status='scheduled' and c.scheduled_start <= now();
  select * into v_class from public.classrooms c where c.id=p_classroom_id and c.lifecycle_status <> 'closed';
  if not found then raise exception 'classroom unavailable' using errcode='P0002'; end if;
  if v_class.access_mode='members_only' and not exists (
    select 1 from public.classroom_members m where m.classroom_id=p_classroom_id and m.user_id=v_user_id
  ) then raise exception 'not authorized' using errcode='42501'; end if;
  insert into public.classroom_members(classroom_id,user_id,role) values(p_classroom_id,v_user_id,'participant')
    on conflict(classroom_id,user_id) do nothing;
  return next v_class;
end;
$$;

create or replace function public.list_authorized_classrooms()
returns table(
  id uuid, title text, description text, owner_id uuid, owner_name text,
  livekit_room_name text, access_mode text, lifecycle_status text,
  scheduled_start timestamptz, created_at timestamptz
)
language sql stable security definer set search_path = '' as $$
  select c.id, c.title, c.description, c.owner_id, p.display_name,
    c.livekit_room_name, c.access_mode, c.lifecycle_status, c.scheduled_start, c.created_at
  from public.classrooms c
  join public.profiles p on p.id=c.owner_id
  where auth.uid() is not null and c.lifecycle_status <> 'closed' and (
    c.owner_id=auth.uid() or c.access_mode='authenticated_demo' or exists (
      select 1 from public.classroom_members m where m.classroom_id=c.id and m.user_id=auth.uid()
    ) or exists (
      select 1 from public.user_roles ur where ur.user_id=auth.uid() and ur.role='admin'
    )
  )
  order by c.scheduled_start asc nulls last;
$$;

create or replace function public.consume_classroom_token_rate(p_window_seconds integer, p_limit integer)
returns boolean language plpgsql security definer set search_path = '' as $$
declare v_user_id uuid := auth.uid(); v_count integer;
begin
  if v_user_id is null or p_window_seconds not between 1 and 300 or p_limit not between 1 and 30 then
    raise exception 'invalid request' using errcode='22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text, 0));
  delete from public.classroom_token_issues where issued_at < now() - interval '10 minutes';
  select count(*) into v_count from public.classroom_token_issues
    where user_id=v_user_id and issued_at > now() - make_interval(secs => p_window_seconds);
  if v_count >= p_limit then raise exception 'rate limited' using errcode='22023'; end if;
  insert into public.classroom_token_issues(user_id) values(v_user_id);
  return true;
end;
$$;

create or replace function public.open_classroom_session(
  p_classroom_id uuid, p_connection_id uuid, p_participant_identity text
) returns setof public.classroom_sessions language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := auth.uid();
  v_room public.classrooms;
  v_existing public.classroom_sessions;
  v_count integer;
begin
  if v_user_id is null then raise exception 'not authenticated' using errcode='42501'; end if;
  update public.classrooms c set lifecycle_status='open', updated_at=now()
    where c.id=p_classroom_id and c.lifecycle_status='scheduled' and c.scheduled_start <= now();
  select * into v_room from public.classrooms where id=p_classroom_id;
  if not found or v_room.lifecycle_status='closed' then raise exception 'unavailable' using errcode='P0002'; end if;
  if v_room.lifecycle_status='scheduled' then raise exception 'not started' using errcode='22023'; end if;
  if not exists(select 1 from public.classroom_members where classroom_id=p_classroom_id and user_id=v_user_id) then
    raise exception 'not authorized' using errcode='42501';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text, 1));
  select * into v_existing from public.classroom_sessions
    where connection_id=p_connection_id and classroom_id=p_classroom_id and user_id=v_user_id;
  if found then
    if v_existing.participant_identity <> p_participant_identity then raise exception 'session mismatch' using errcode='42501'; end if;
    update public.classroom_sessions set ended_at=null where id=v_existing.id returning * into v_existing;
    return next v_existing;
    return;
  end if;
  select count(*) into v_count from public.classroom_sessions
    where user_id=v_user_id and ended_at is null and started_at > now() - interval '2 hours';
  if v_count >= 4 then return; end if;
  insert into public.classroom_sessions(classroom_id, connection_id, user_id, participant_identity)
    values(p_classroom_id,p_connection_id,v_user_id,p_participant_identity) returning * into v_existing;
  return next v_existing;
end;
$$;

create or replace function public.end_classroom_session(p_classroom_id uuid, p_connection_id uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  update public.classroom_sessions set ended_at=coalesce(ended_at,now())
    where classroom_id=p_classroom_id and connection_id=p_connection_id and user_id=auth.uid();
  return true;
end;
$$;

create or replace function public.close_classroom(p_classroom_id uuid)
returns setof public.classrooms
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_classroom_manager(p_classroom_id) then raise exception 'not authorized' using errcode='42501'; end if;
  update public.classrooms set lifecycle_status='closed', updated_at=now() where id=p_classroom_id;
  update public.classroom_sessions set ended_at=coalesce(ended_at,now()) where classroom_id=p_classroom_id and ended_at is null;
  return query select c.* from public.classrooms c where c.id=p_classroom_id;
end;
$$;

create or replace function public.store_livekit_event(
  p_event_id text, p_event_type text, p_room_name text, p_session_id text,
  p_participant_identity text, p_payload_hash text, p_occurred_at timestamptz
) returns boolean language plpgsql security definer set search_path = '' as $$
declare v_class_id uuid; v_inserted integer;
begin
  if length(p_event_id) not between 1 and 200 or length(p_payload_hash) <> 64 then raise exception 'invalid event' using errcode='22023'; end if;
  select id into v_class_id from public.classrooms where livekit_room_name=p_room_name;
  insert into public.livekit_events(event_id,event_type,classroom_id,livekit_room_name,livekit_session_id,participant_identity,payload_hash,received_at,processed_at)
  values(p_event_id,p_event_type,v_class_id,p_room_name,p_session_id,p_participant_identity,p_payload_hash,coalesce(p_occurred_at,now()),now())
  on conflict(event_id) do nothing;
  get diagnostics v_inserted = row_count;
  if v_inserted=0 then return false; end if;
  if p_event_type='room_started' and v_class_id is not null then
    update public.classrooms set lifecycle_status='open', updated_at=now() where id=v_class_id and lifecycle_status='scheduled';
  elsif p_event_type='participant_joined' and v_class_id is not null and p_participant_identity is not null then
    update public.classroom_sessions
      set livekit_session_id=coalesce(livekit_session_id,p_session_id),
          last_livekit_event_at=coalesce(p_occurred_at,now())
      where classroom_id=v_class_id and participant_identity=p_participant_identity
        and (last_livekit_event_at is null or last_livekit_event_at <= coalesce(p_occurred_at,now()));
  elsif p_event_type='participant_left' and v_class_id is not null and p_participant_identity is not null then
    update public.classroom_sessions
      set ended_at=coalesce(ended_at,coalesce(p_occurred_at,now())),
          last_livekit_event_at=coalesce(p_occurred_at,now())
      where classroom_id=v_class_id and participant_identity=p_participant_identity
        and (last_livekit_event_at is null or last_livekit_event_at <= coalesce(p_occurred_at,now()));
  elsif p_event_type='room_finished' and v_class_id is not null then
    update public.classroom_sessions
      set ended_at=coalesce(ended_at,coalesce(p_occurred_at,now())),
          last_livekit_event_at=coalesce(p_occurred_at,now())
      where classroom_id=v_class_id and (p_session_id is null or livekit_session_id=p_session_id)
        and (last_livekit_event_at is null or last_livekit_event_at <= coalesce(p_occurred_at,now()));
  end if;
  return true;
end;
$$;

revoke all on function public.create_classroom(text,text,timestamptz,text,text) from public, anon;
revoke all on function public.join_classroom(uuid) from public, anon;
revoke all on function public.list_authorized_classrooms() from public, anon;
revoke all on function public.close_classroom(uuid) from public, anon;
revoke all on function public.consume_classroom_token_rate(integer,integer) from public, anon;
revoke all on function public.open_classroom_session(uuid,uuid,text) from public, anon;
revoke all on function public.end_classroom_session(uuid,uuid) from public, anon;
revoke all on function public.store_livekit_event(text,text,text,text,text,text,timestamptz) from public, anon, authenticated;
grant execute on function public.create_classroom(text,text,timestamptz,text,text) to authenticated;
grant execute on function public.join_classroom(uuid) to authenticated;
grant execute on function public.list_authorized_classrooms() to authenticated;
grant execute on function public.close_classroom(uuid) to authenticated;
grant execute on function public.consume_classroom_token_rate(integer,integer) to authenticated;
grant execute on function public.open_classroom_session(uuid,uuid,text) to authenticated;
grant execute on function public.end_classroom_session(uuid,uuid) to authenticated;
grant execute on function public.store_livekit_event(text,text,text,text,text,text,timestamptz) to service_role;

insert into public.schema_migrations(version) values ('001_auth_classrooms') on conflict (version) do nothing;

commit;
