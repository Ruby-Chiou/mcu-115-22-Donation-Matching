-- Singleton disaster-mode state shared by every browser/device.
-- Images intentionally remain in the browser cache because the current UI stores them as data URLs.

create table if not exists public.disaster_control_state (
  id smallint primary key default 1 check (id = 1),
  is_open boolean not null default false,
  closed_at bigint,
  scheduled_close_at timestamptz,
  announcement text not null default '',
  name text not null default '',
  description text not null default '',
  material_needs jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.disaster_control_state (id)
values (1)
on conflict (id) do nothing;

grant select on public.disaster_control_state to anon, authenticated;
grant insert, update on public.disaster_control_state to authenticated;

alter table public.disaster_control_state enable row level security;

drop policy if exists "public reads disaster control state" on public.disaster_control_state;
create policy "public reads disaster control state"
  on public.disaster_control_state
  for select
  to anon, authenticated
  using (true);

drop policy if exists "admins update disaster control state" on public.disaster_control_state;
create policy "admins update disaster control state"
  on public.disaster_control_state
  for all
  to authenticated
  using (public.current_app_role() = 'admin')
  with check (id = 1 and public.current_app_role() = 'admin');

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'disaster_control_state'
  ) then
    alter publication supabase_realtime add table public.disaster_control_state;
  end if;
end
$$;
