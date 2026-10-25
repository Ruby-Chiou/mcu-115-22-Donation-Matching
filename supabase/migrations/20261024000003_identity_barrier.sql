-- 身分屏障：身分別只存在 user_accounts，使用者不能自行新增或改寫。
-- 開發測試帳（明文只在這支 migration，不會打進前端打包檔）：
--   dev.donor@example.com  / Km7#donate-Gate  / 捐助者 測試捐助者
--   dev.agency@example.com / Km7#agency-Gate  / 受助者 測試受助者
--   dev.admin@example.com  / Km7#admin-Gate   / 管理者 測試管理者

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.user_accounts (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null default '',
  display_name text not null,
  role text not null check (role in ('donor', 'agency', 'admin')),
  created_at timestamptz not null default now()
);

create unique index if not exists user_accounts_email_idx on public.user_accounts (email);

alter table public.user_accounts enable row level security;
alter table public.user_accounts force row level security;

revoke all on table public.user_accounts from public, anon, authenticated;
grant select on table public.user_accounts to authenticated;

drop policy if exists "read own account" on public.user_accounts;
create policy "read own account"
  on public.user_accounts
  for select
  to authenticated
  using (user_id = auth.uid());

create or replace function public.current_app_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.user_accounts where user_id = auth.uid()
$$;

revoke all on function public.current_app_role() from public, anon, authenticated;
grant execute on function public.current_app_role() to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested text := lower(coalesce(new.raw_user_meta_data->>'role', 'donor'));
  assigned text := case when requested = 'agency' then 'agency' else 'donor' end;
  display text := nullif(trim(coalesce(new.raw_user_meta_data->>'display_name', '')), '');
begin
  insert into public.user_accounts (user_id, email, display_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(display, split_part(coalesce(new.email, 'member'), '@', 1)),
    assigned
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.handle_new_user() to supabase_auth_admin, service_role;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.seed_dev_login(
  p_id uuid,
  p_email text,
  p_password text,
  p_display_name text,
  p_role text
)
returns void
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  instance uuid;
begin
  if exists (select 1 from auth.users where id = p_id or email = p_email) then
    return;
  end if;

  select id into instance from auth.instances limit 1;
  if instance is null then
    instance := '00000000-0000-0000-0000-000000000000';
  end if;

  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token,
    email_change_token_current,
    reauthentication_token,
    is_sso_user,
    is_anonymous
  ) values (
    instance,
    p_id,
    'authenticated',
    'authenticated',
    p_email,
    extensions.crypt(p_password, extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('display_name', p_display_name, 'role', p_role),
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    false,
    false
  );

  insert into auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) values (
    p_id,
    p_id,
    jsonb_build_object('sub', p_id::text, 'email', p_email, 'email_verified', true),
    'email',
    p_id::text,
    now(),
    now(),
    now()
  );
end;
$$;

revoke all on function public.seed_dev_login(uuid, text, text, text, text) from public, anon, authenticated;

select public.seed_dev_login(
  '11111111-1111-4111-8111-111111111111',
  'dev.donor@example.com',
  'Km7#donate-Gate',
  '測試捐助者',
  'donor'
);

select public.seed_dev_login(
  '22222222-2222-4222-8222-222222222222',
  'dev.agency@example.com',
  'Km7#agency-Gate',
  '測試受助者',
  'agency'
);

select public.seed_dev_login(
  '33333333-3333-4333-8333-333333333333',
  'dev.admin@example.com',
  'Km7#admin-Gate',
  '測試管理者',
  'admin'
);

update public.user_accounts
set role = 'admin',
    display_name = '測試管理者'
where user_id = '33333333-3333-4333-8333-333333333333';

insert into public.donor_profiles
  ("uid", "email", "displayName", "accountName", "fullName", "loginProvider", "accountStatus")
values
  (
    '11111111-1111-4111-8111-111111111111',
    'dev.donor@example.com',
    '測試捐助者',
    'dev_donor',
    '測試捐助者',
    'email',
    'ACTIVE'
  )
on conflict ("uid") do nothing;

insert into public.member_notification_settings ("uid")
values ('11111111-1111-4111-8111-111111111111')
on conflict ("uid") do nothing;

drop function public.seed_dev_login(uuid, text, text, text, text);
