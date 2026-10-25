-- 管理者要進入某一家受助者的作業頁時，必須由那一家同意。
-- 同意只維持兩小時，對方或管理者都可以提前結束。不另發一組共用密碼。

create table if not exists public.agency_access_grants (
  id bigint generated always as identity primary key,
  agency_uid text not null,
  admin_uid text not null,
  admin_name text not null default '',
  reason text not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'revoked')),
  requested_at timestamptz not null default now(),
  decided_at timestamptz,
  expires_at timestamptz
);

create index if not exists agency_access_grants_admin_idx
  on public.agency_access_grants (admin_uid, requested_at desc);

create index if not exists agency_access_grants_agency_idx
  on public.agency_access_grants (agency_uid, requested_at desc);

alter table public.agency_access_grants enable row level security;

revoke all on public.agency_access_grants from public, anon;
grant select on public.agency_access_grants to authenticated;

drop policy if exists "read own agency access grants" on public.agency_access_grants;
create policy "read own agency access grants"
  on public.agency_access_grants
  for select
  to authenticated
  using (
    (public.current_app_role() = 'admin' and admin_uid = auth.uid()::text)
    or (public.current_app_role() = 'agency' and agency_uid = auth.uid()::text)
  );

create or replace function public.request_agency_access(p_agency_uid text, p_reason text)
returns public.agency_access_grants
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  actor_name text;
  cleaned text := btrim(coalesce(p_reason, ''));
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

  insert into public.agency_access_grants (agency_uid, admin_uid, admin_name, reason)
  values (p_agency_uid, actor::text, coalesce(actor_name, '管理者'), cleaned)
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
    coalesce(actor_name, '管理者') || ' 申請在兩小時內協助處理作業頁。原因：' || cleaned || '。請到機構總控制台同意或拒絕。'
  );

  return created;
end;
$$;

create or replace function public.decide_agency_access(p_id bigint, p_accept boolean)
returns public.agency_access_grants
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  target public.agency_access_grants;
begin
  if actor is null or public.current_app_role() is distinct from 'agency' then
    raise exception '只有這家受助者可以決定';
  end if;

  select * into target
  from public.agency_access_grants
  where id = p_id
    and agency_uid = actor::text
    and status = 'pending';

  if target.id is null then
    raise exception '這筆申請已經處理過';
  end if;

  update public.agency_access_grants
  set status = case when p_accept then 'approved' else 'rejected' end,
      decided_at = now(),
      expires_at = case when p_accept then now() + interval '2 hours' else null end
  where id = p_id
  returning * into target;

  insert into public.member_messages (
    "recipientUid", "recipientName", "senderUid", "senderName", category, subject, content
  ) values (
    target.admin_uid,
    target.admin_name,
    actor::text,
    '受助者',
    'SYSTEM',
    case when p_accept then '受助者已同意接入' else '受助者已拒絕接入' end,
    case
      when p_accept then '對方同意你在兩小時內協助處理作業頁。時間到了會自動鎖上。'
      else '對方拒絕了這次接入申請。'
    end
  );

  return target;
end;
$$;

create or replace function public.revoke_agency_access(p_id bigint)
returns public.agency_access_grants
language plpgsql
security definer
set search_path = public
as $$
declare
  actor text := auth.uid()::text;
  target public.agency_access_grants;
begin
  if actor is null then
    raise exception '尚未登入';
  end if;

  select * into target
  from public.agency_access_grants
  where id = p_id
    and status in ('pending', 'approved')
    and (admin_uid = actor or agency_uid = actor);

  if target.id is null then
    raise exception '這次接入已經結束';
  end if;

  update public.agency_access_grants
  set status = 'revoked',
      expires_at = now()
  where id = p_id
  returning * into target;

  return target;
end;
$$;

revoke all on function public.request_agency_access(text, text) from public, anon;
revoke all on function public.decide_agency_access(bigint, boolean) from public, anon;
revoke all on function public.revoke_agency_access(bigint) from public, anon;
grant execute on function public.request_agency_access(text, text) to authenticated;
grant execute on function public.decide_agency_access(bigint, boolean) to authenticated;
grant execute on function public.revoke_agency_access(bigint) to authenticated;

notify pgrst, 'reload schema';
