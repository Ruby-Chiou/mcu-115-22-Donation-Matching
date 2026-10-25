-- 資格證明文件本體只給本人與管理者讀。註冊當下還沒有登入階段時，允許這筆待審核資料寫入一次。

create table if not exists public.agency_verification_files (
  uid text primary key references public.agency_profiles (uid) on delete cascade,
  file_name text not null,
  content_type text not null,
  body bytea not null,
  updated_at timestamptz not null default now()
);

alter table public.agency_verification_files enable row level security;
alter table public.agency_verification_files force row level security;

revoke all on table public.agency_verification_files from public, anon, authenticated;

create or replace function public.save_agency_verification_file(
  p_uid text,
  p_name text,
  p_type text,
  p_base64 text
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  raw bytea;
  profile public.agency_profiles%rowtype;
  clean_name text;
begin
  clean_name := left(regexp_replace(coalesce(p_name, ''), '[\\/]+', '_', 'g'), 120);
  if clean_name = '' then
    raise exception '缺少檔名';
  end if;

  if p_type not in ('application/pdf', 'image/jpeg', 'image/png', 'image/webp') then
    raise exception '證明文件請用 PDF、JPG、PNG 或 WEBP';
  end if;

  raw := decode(p_base64, 'base64');
  if octet_length(raw) = 0 or octet_length(raw) > 8388608 then
    raise exception '證明文件需小於 8MB';
  end if;

  select * into profile from public.agency_profiles where uid = p_uid;
  if not found then
    raise exception '找不到這筆機構資料';
  end if;

  if profile."accountStatus" = 'DELETED' then
    raise exception '此機構帳號已註銷';
  end if;

  if auth.uid()::text is distinct from p_uid then
    if profile."verificationStatus" <> 'pending'
      or profile."createdAt" < now() - interval '30 minutes'
      or exists (select 1 from public.agency_verification_files where uid = p_uid)
    then
      raise exception '不能上傳這份證明文件';
    end if;
  end if;

  if exists (select 1 from public.agency_verification_files where uid = p_uid) then
    update public.agency_verification_files
    set file_name = clean_name,
        content_type = p_type,
        body = raw,
        updated_at = now()
    where uid = p_uid;
  else
    insert into public.agency_verification_files (uid, file_name, content_type, body)
    values (p_uid, clean_name, p_type, raw);
  end if;

  update public.agency_profiles
  set "verificationDocumentUrl" = 'stored:' || clean_name,
      "updatedAt" = now()
  where uid = p_uid;

  return 'stored:' || clean_name;
end;
$$;

create or replace function public.read_agency_verification_file(p_uid text)
returns table (file_name text, content_type text, body_base64 text)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid()::text is distinct from p_uid
    and public.current_app_role() is distinct from 'admin'
  then
    raise exception '不能讀取這份證明文件';
  end if;

  return query
  select f.file_name, f.content_type, encode(f.body, 'base64')
  from public.agency_verification_files f
  where f.uid = p_uid;
end;
$$;

revoke all on function public.save_agency_verification_file(text, text, text, text) from public;
grant execute on function public.save_agency_verification_file(text, text, text, text) to anon, authenticated;

revoke all on function public.read_agency_verification_file(text) from public;
grant execute on function public.read_agency_verification_file(text) to authenticated;

notify pgrst, 'reload schema';
