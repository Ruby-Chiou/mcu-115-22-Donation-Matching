-- 管理者可看全部捐助者帳號，並維護系統公告、感謝牆公告與黑名單。

drop policy if exists "admin reads accounts" on public.user_accounts;
create policy "admin reads accounts"
  on public.user_accounts
  for select
  to authenticated
  using (public.current_app_role() = 'admin');

create table if not exists public.platform_announcements (
  id bigint generated always as identity primary key,
  body text not null,
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.board_announcements (
  id bigint generated always as identity primary key,
  board text not null check (board in ('thank_wall', 'blacklist')),
  headline text not null default '',
  body text not null,
  published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.platform_announcements enable row level security;
alter table public.board_announcements enable row level security;

revoke all on public.platform_announcements from public, anon, authenticated;
revoke all on public.board_announcements from public, anon, authenticated;
grant select on public.platform_announcements to anon, authenticated;
grant select on public.board_announcements to anon, authenticated;
grant insert, update, delete on public.platform_announcements to authenticated;
grant insert, update, delete on public.board_announcements to authenticated;
grant usage, select on sequence public.platform_announcements_id_seq to authenticated;
grant usage, select on sequence public.board_announcements_id_seq to authenticated;

drop policy if exists "public reads published platform announcements" on public.platform_announcements;
create policy "public reads published platform announcements"
  on public.platform_announcements
  for select
  to anon, authenticated
  using (published = true);

drop policy if exists "admin reads platform announcements" on public.platform_announcements;
create policy "admin reads platform announcements"
  on public.platform_announcements
  for select
  to authenticated
  using (public.current_app_role() = 'admin');

drop policy if exists "admin writes platform announcements" on public.platform_announcements;
create policy "admin writes platform announcements"
  on public.platform_announcements
  for all
  to authenticated
  using (public.current_app_role() = 'admin')
  with check (public.current_app_role() = 'admin');

drop policy if exists "public reads published board announcements" on public.board_announcements;
create policy "public reads published board announcements"
  on public.board_announcements
  for select
  to anon, authenticated
  using (published = true);

drop policy if exists "admin reads board announcements" on public.board_announcements;
create policy "admin reads board announcements"
  on public.board_announcements
  for select
  to authenticated
  using (public.current_app_role() = 'admin');

drop policy if exists "admin writes board announcements" on public.board_announcements;
create policy "admin writes board announcements"
  on public.board_announcements
  for all
  to authenticated
  using (public.current_app_role() = 'admin')
  with check (public.current_app_role() = 'admin');

insert into public.platform_announcements (body, published, published_at)
select seed.body, true, seed.published_at
from (
  values
    ('系統更新通知：平台已於 26/09/07 完成系統更新，請使用者重新登入以享受最新功能。', timestamptz '2026-09-07 09:00:00+08'),
    ('平台新增「災害救助」功能，提供民眾在災害發生時快速提出需求。', timestamptz '2026-09-06 09:00:00+08'),
    ('系統維護通知：平台將於 26/09/07 進行系統維護，屆時可能暫時無法使用。', timestamptz '2026-09-05 09:00:00+08')
) as seed(body, published_at)
where not exists (select 1 from public.platform_announcements);

insert into public.board_announcements (board, headline, body, published, sort_order)
select seed.board, seed.headline, seed.body, true, seed.sort_order
from (
  values
    ('thank_wall', '公開說明', '機構接受捐助後，會以遮罩姓名公開在感謝牆。這裡的公告由管理者維護。', 0),
    ('blacklist', '吳○○', '冒名行為', 1),
    ('blacklist', '蔡○○', '未依約寄送', 2),
    ('blacklist', '林○○', '調換捐贈物品', 3),
    ('blacklist', '陳○○', '冒充官方單位', 4)
) as seed(board, headline, body, sort_order)
where not exists (select 1 from public.board_announcements);

notify pgrst, 'reload schema';
