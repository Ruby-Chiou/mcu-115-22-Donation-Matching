-- 申請接入時記下這次連線的 IP。位址從連線標頭讀取，不採用畫面自行填寫的值。

alter table public.agency_access_grants
  add column if not exists client_ip text not null default '';

create or replace function public.access_request_ip()
returns text
language plpgsql
stable
as $$
declare
  headers json;
  forwarded text;
  candidate text;
begin
  begin
    headers := current_setting('request.headers', true)::json;
  exception when others then
    return '';
  end;

  forwarded := coalesce(
    headers->>'cf-connecting-ip',
    headers->>'x-real-ip',
    headers->>'x-forwarded-for',
    ''
  );
  candidate := btrim(split_part(forwarded, ',', 1));
  if candidate = '' then
    return '';
  end if;

  begin
    return candidate::inet::text;
  exception when others then
    return '';
  end;
end;
$$;

revoke all on function public.access_request_ip() from public, anon, authenticated;

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
  typed_name text := btrim(coalesce(p_operator_name, ''));
  client_ip text := public.access_request_ip();
  matched_id smallint;
  existing public.agency_access_grants;
  created public.agency_access_grants;
  agency_name text;
begin
  if actor is null or public.current_app_role() is distinct from 'admin' then
    raise exception '只有管理者可以申請接入';
  end if;

  if char_length(typed_name) < 1 or char_length(typed_name) > 30 then
    raise exception '請填寫維修人員';
  end if;

  select o.id into matched_id
  from public.admin_operators o
  where o.active
    and o.password_hash = extensions.crypt(coalesce(p_operator_password, ''), o.password_hash)
  limit 1;

  if matched_id is null then
    raise exception '密碼不正確';
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
    agency_uid, admin_uid, admin_name, reason, client_label, client_ip, operator_name, operator_id
  ) values (
    p_agency_uid,
    actor::text,
    coalesce(actor_name, '管理者'),
    cleaned,
    client_name,
    client_ip,
    typed_name,
    matched_id
  )
  returning * into created;

  insert into public.member_messages (
    "recipientUid", "recipientName", "senderUid", "senderName", category, subject, content
  ) values (
    p_agency_uid,
    agency_name,
    actor::text,
    typed_name,
    'SYSTEM',
    '管理者申請接入作業頁',
    typed_name
      || ' 申請在兩小時內協助處理作業頁。'
      || case when client_name = '' then '' else '裝置：' || client_name || '。' end
      || case when client_ip = '' then '' else 'IP：' || client_ip || '。' end
      || '原因：' || cleaned || '。請到機構總控制台同意或拒絕。'
  );

  return created;
end;
$$;

revoke all on function public.request_agency_access(text, text, text, text, text) from public, anon;
grant execute on function public.request_agency_access(text, text, text, text, text) to authenticated;

notify pgrst, 'reload schema';
