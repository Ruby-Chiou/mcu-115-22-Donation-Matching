-- 申請接入時記下瀏覽器報上的系統與名稱，讓受助者辨認是哪一台。
-- 這只是紀錄，不是第二組密碼，也不能證明實體裝置。

alter table public.agency_access_grants
  add column if not exists client_label text not null default '';

drop function if exists public.request_agency_access(text, text);

create or replace function public.request_agency_access(
  p_agency_uid text,
  p_reason text,
  p_client_label text default ''
)
returns public.agency_access_grants
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  actor_name text;
  cleaned text := btrim(coalesce(p_reason, ''));
  client_name text := left(btrim(coalesce(p_client_label, '')), 80);
  existing public.agency_access_grants;
  created public.agency_access_grants;
  agency_name text;
begin
  if actor is null or public.current_app_role() is distinct from 'admin' then
    raise exception '只有管理者可以申請接入';
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

  insert into public.agency_access_grants (agency_uid, admin_uid, admin_name, reason, client_label)
  values (p_agency_uid, actor::text, coalesce(actor_name, '管理者'), cleaned, client_name)
  returning * into created;

  insert into public.member_messages (
    "recipientUid", "recipientName", "senderUid", "senderName", category, subject, content
  ) values (
    p_agency_uid,
    agency_name,
    actor::text,
    coalesce(actor_name, '管理者'),
    'SYSTEM',
    '管理者申請接入作業頁',
    coalesce(actor_name, '管理者')
      || ' 申請在兩小時內協助處理作業頁。'
      || case when client_name = '' then '' else '裝置：' || client_name || '。' end
      || '原因：' || cleaned || '。請到機構總控制台同意或拒絕。'
  );

  return created;
end;
$$;

revoke all on function public.request_agency_access(text, text, text) from public, anon;
grant execute on function public.request_agency_access(text, text, text) to authenticated;

notify pgrst, 'reload schema';
