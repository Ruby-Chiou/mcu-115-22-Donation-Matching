-- 受助者主檔：註冊當下的機構與經辦人資料都在這張表。
-- 民眾頁不另存一份。agency_public_profiles 只是這張表的公開欄位視圖，
-- 避免瀏覽用的金鑰把負責人、經辦人與證明文件一起讀走。

create table if not exists public.agency_profiles (
  uid                      text primary key,
  email                    text not null default '',
  "agencyName"             text not null,
  "registrationNumber"     text not null default '',
  representative           text not null default '',
  "contactPhone"           text not null default '',
  "defaultAddress"         text not null default '',
  "contactPersonName"      text not null default '',
  "contactPersonTitle"     text not null default '',
  department               text not null default '',
  "contactPersonPhone"     text not null default '',
  "contactPersonEmail"     text not null default '',
  "verificationDocumentUrl" text not null default '',
  "verificationStatus"     text not null default 'pending'
                           check ("verificationStatus" in ('pending', 'approved', 'rejected')),
  "consentToContact"       boolean not null default false,
  "agreeToTerms"           boolean not null default false,
  city                     text not null default '',
  image                    text not null default '',
  "introImages"            text[] not null default '{}',
  "establishedYear"        text not null default '',
  "registrationLabel"      text not null default '',
  "serviceArea"            text not null default '',
  "serviceTargets"         text[] not null default '{}',
  mission                  text not null default '',
  background               text not null default '',
  "accountStatus"          text not null default 'ACTIVE',
  "deletedAt"              timestamptz,
  "createdAt"              timestamptz not null default now(),
  "updatedAt"              timestamptz not null default now()
);

insert into public.agency_profiles (
  uid,
  email,
  "agencyName",
  "registrationNumber",
  representative,
  "contactPhone",
  "defaultAddress",
  "contactPersonName",
  "contactPersonTitle",
  department,
  "contactPersonPhone",
  "contactPersonEmail",
  "verificationDocumentUrl",
  "verificationStatus",
  "consentToContact",
  "agreeToTerms",
  city,
  image,
  "introImages",
  "establishedYear",
  "registrationLabel",
  "serviceArea",
  "serviceTargets",
  mission,
  background
)
select
  case
    when "organizationName" = '示範社福機構' then '22222222-2222-4222-8222-222222222222'
    else 'demo-agency-' || id::text
  end,
  case
    when "organizationName" = '示範社福機構' then 'dev.agency@example.com'
    else 'demo-agency-' || id::text || '@example.com'
  end,
  "organizationName",
  'DEMO-' || lpad(id::text, 4, '0'),
  '示範負責人',
  "publicPhone",
  city || '示範路1號',
  '示範經辦人',
  '社工',
  '社會服務部',
  "publicPhone",
  'handler@example.com',
  '',
  case when verified then 'approved' else 'pending' end,
  true,
  true,
  city,
  image,
  "introImages",
  "establishedYear",
  "registrationLabel",
  "serviceArea",
  "serviceTargets",
  mission,
  background
from public.beneficiary_public_profiles
on conflict (uid) do nothing;

create or replace view public.agency_public_profiles
with (security_invoker = false) as
select
  "agencyName",
  city,
  image,
  "introImages",
  "establishedYear",
  "registrationLabel",
  "serviceArea",
  "serviceTargets",
  "contactPhone",
  mission,
  background,
  "verificationStatus"
from public.agency_profiles
where "accountStatus" = 'ACTIVE';

comment on view public.agency_public_profiles is
  '從 agency_profiles 投影民眾可看的欄位，不是另一份受助者資料。';

revoke all on public.agency_profiles from public, anon;
grant select, insert, update on public.agency_profiles to authenticated;

revoke all on public.agency_public_profiles from public;
grant select on public.agency_public_profiles to anon, authenticated;

alter table public.agency_profiles enable row level security;

drop policy if exists "owner reads agency profile" on public.agency_profiles;
create policy "owner reads agency profile"
  on public.agency_profiles
  for select
  to authenticated
  using (uid = auth.uid()::text or public.current_app_role() = 'admin');

drop policy if exists "owner inserts agency profile" on public.agency_profiles;
create policy "owner inserts agency profile"
  on public.agency_profiles
  for insert
  to authenticated
  with check (uid = auth.uid()::text);

drop policy if exists "owner updates agency profile" on public.agency_profiles;
create policy "owner updates agency profile"
  on public.agency_profiles
  for update
  to authenticated
  using (uid = auth.uid()::text)
  with check (uid = auth.uid()::text);

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
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  insert into public.user_accounts (user_id, email, display_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(display, split_part(coalesce(new.email, 'member'), '@', 1)),
    assigned
  )
  on conflict (user_id) do nothing;

  if assigned = 'agency' then
    insert into public.agency_profiles (
      uid,
      email,
      "agencyName",
      "registrationNumber",
      representative,
      "contactPhone",
      "defaultAddress",
      "contactPersonName",
      "contactPersonTitle",
      department,
      "contactPersonPhone",
      "contactPersonEmail",
      "verificationDocumentUrl",
      "verificationStatus",
      "consentToContact",
      "agreeToTerms"
    )
    values (
      new.id::text,
      coalesce(new.email, ''),
      coalesce(nullif(trim(meta->>'agency_name'), ''), coalesce(display, '未命名機構')),
      coalesce(meta->>'registration_number', ''),
      coalesce(meta->>'representative', ''),
      coalesce(meta->>'contact_phone', ''),
      coalesce(meta->>'default_address', ''),
      coalesce(meta->>'contact_person_name', ''),
      coalesce(meta->>'contact_person_title', ''),
      coalesce(meta->>'department', ''),
      coalesce(meta->>'contact_person_phone', ''),
      coalesce(meta->>'contact_person_email', ''),
      coalesce(meta->>'verification_document_url', ''),
      'pending',
      coalesce((meta->>'consent_to_contact')::boolean, false),
      coalesce((meta->>'agree_to_terms')::boolean, false)
    )
    on conflict (uid) do nothing;
  end if;

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.handle_new_user() to supabase_auth_admin, service_role;

drop table if exists public.beneficiary_public_profiles;

notify pgrst, 'reload schema';
