-- 六位開發人員各有一組密碼，只在申請接入時核對。
-- 密碼雜湊存在資料庫，受助者看得到的是人名，不是密碼。
-- 管理者登入密碼一併從測試用換成正式用。登入信箱維持 dev.admin@example.com。

alter table public.agency_access_grants
  add column if not exists operator_name text not null default '';

create table if not exists public.admin_operators (
  id smallint primary key,
  display_name text not null unique,
  password_hash text not null,
  active boolean not null default true
);

alter table public.admin_operators enable row level security;
revoke all on public.admin_operators from public, anon, authenticated;

insert into public.admin_operators (id, display_name, password_hash)
values
  (1, '開發人員一', extensions.crypt('f3K#plum-91a', extensions.gen_salt('bf'))),
  (2, '開發人員二', extensions.crypt('m8Q#willow-42c', extensions.gen_salt('bf'))),
  (3, '開發人員三', extensions.crypt('p6H#orchid-77e', extensions.gen_salt('bf'))),
  (4, '開發人員四', extensions.crypt('r2D#bamboo-15k', extensions.gen_salt('bf'))),
  (5, '開發人員五', extensions.crypt('t9W#lotus-63m', extensions.gen_salt('bf'))),
  (6, '開發人員六', extensions.crypt('v4N#pine-28q', extensions.gen_salt('bf')))
on conflict (id) do update
set display_name = excluded.display_name,
    password_hash = excluded.password_hash,
    active = true;

update auth.users
set encrypted_password = extensions.crypt('J6#platform-Admin', extensions.gen_salt('bf')),
    updated_at = now()
where email = 'dev.admin@example.com';

update public.user_accounts
set display_name = '平台管理者'
where user_id = '33333333-3333-4333-8333-333333333333';

create or replace function public.list_admin_operator_names()
returns table (display_name text)
language sql
security definer
set search_path = public
as $$
  select display_name
  from public.admin_operators
  where active
    and public.current_app_role() = 'admin'
  order by id;
$$;

revoke all on function public.list_admin_operator_names() from public, anon;
grant execute on function public.list_admin_operator_names() to authenticated;

drop function if exists public.request_agency_access(text, text, text);

create or replace function public.request_agency_access(
  p_agency_uid text,
  p_reason text,
  p_client_label text default '',
  p_operator_name text default '',
  p_operator_password text default ''
)
returns public.agency_access_grants
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  actor uuid := auth.uid();
  actor_name text;
  cleaned text := btrim(coalesce(p_reason, ''));
  client_name text := left(btrim(coalesce(p_client_label, '')), 80);
  operator_name text;
  existing public.agency_access_grants;
  created public.agency_access_grants;
  agency_name text;
begin
  if actor is null or public.current_app_role() is distinct from 'admin' then
    raise exception '只有管理者可以申請接入';
  end if;

  select o.display_name into operator_name
  from public.admin_operators o
  where o.active
    and o.display_name = btrim(coalesce(p_operator_name, ''))
    and o.password_hash = extensions.crypt(coalesce(p_operator_password, ''), o.password_hash);

  if operator_name is null then
    raise exception '開發人員或密碼不正確';
  end if;

  if char_length(cleaned) < 4 or char_length(cleaned) > 200 then
    raise exception '請寫下這次接入的原因';
  end if;

  select "agencyName" into agency_name
  from public.agency_profiles
  where uid = p_agency_uid
    and "accountStatus" is distinct from 'DELETED';

  if agency_name is null then
    raise exception '找不到這家受助者';
  end if;

  select * into existing
  from public.agency_access_grants
  where admin_uid = actor::text
    and status = 'approved'
    and expires_at > now()
  limit 1;

  if existing.id is not null and existing.agency_uid is distinct from p_agency_uid then
    raise exception '先結束目前這家的接入，再申請另一家';
  end if;

  if existing.id is not null then
    return existing;
  end if;

  select * into existing
  from public.agency_access_grants
  where admin_uid = actor::text
    and agency_uid = p_agency_uid
    and status = 'pending'
  limit 1;

  if existing.id is not null then
    return existing;
  end if;

  select display_name into actor_name
  from public.user_accounts
  where user_id = actor;

  insert into public.agency_access_grants (
    agency_uid, admin_uid, admin_name, reason, client_label, operator_name
  ) values (
    p_agency_uid,
    actor::text,
    coalesce(actor_name, '管理者'),
    cleaned,
    client_name,
    operator_name
  )
  returning * into created;

  insert into public.member_messages (
    "recipientUid", "recipientName", "senderUid", "senderName", category, subject, content
  ) values (
    p_agency_uid,
    agency_name,
    actor::text,
    operator_name,
    'SYSTEM',
    '管理者申請接入作業頁',
    operator_name
      || ' 申請在兩小時內協助處理作業頁。'
      || case when client_name = '' then '' else '裝置：' || client_name || '。' end
      || '原因：' || cleaned || '。請到機構總控制台同意或拒絕。'
  );

  return created;
end;
$$;

revoke all on function public.request_agency_access(text, text, text, text, text) from public, anon;
grant execute on function public.request_agency_access(text, text, text, text, text) to authenticated;

notify pgrst, 'reload schema';
