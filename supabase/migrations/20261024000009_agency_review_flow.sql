-- 把受助者註冊、管理者審核、通過後才能登入接成同一條。
-- 同時保留公司捐助者的審核寫入，避免後寫入的註冊函式把另一邊蓋掉。

alter table public.user_accounts
  add column if not exists donor_kind text not null default 'individual';

alter table public.user_accounts
  drop constraint if exists user_accounts_donor_kind_check;

alter table public.user_accounts
  add constraint user_accounts_donor_kind_check
  check (donor_kind in ('individual', 'company'));

create table if not exists public.donor_company_applications (
  user_id uuid primary key references auth.users (id) on delete cascade,
  company_name text not null,
  tax_id text not null,
  representative text not null,
  contact_phone text not null default '',
  address text not null default '',
  document_name text not null default '',
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'supplement')),
  review_note text not null default '',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

alter table public.donor_company_applications enable row level security;
alter table public.donor_company_applications force row level security;

revoke all on table public.donor_company_applications from public, anon, authenticated;
grant select on table public.donor_company_applications to authenticated;
grant update (status, review_note, reviewed_at) on table public.donor_company_applications to authenticated;

drop policy if exists "company reads own application" on public.donor_company_applications;
create policy "company reads own application"
  on public.donor_company_applications
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "admin reviews company donors" on public.donor_company_applications;
create policy "admin reviews company donors"
  on public.donor_company_applications
  for all
  to authenticated
  using (public.current_app_role() = 'admin')
  with check (public.current_app_role() = 'admin');

alter table public.agency_profiles
  add column if not exists "reviewNote" text not null default '';

do $$
declare
  constraint_name text;
begin
  for constraint_name in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'agency_profiles'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%verificationStatus%'
  loop
    execute format('alter table public.agency_profiles drop constraint %I', constraint_name);
  end loop;
end $$;

alter table public.agency_profiles
  add constraint agency_profiles_verification_status_check
  check ("verificationStatus" in ('pending', 'approved', 'rejected', 'supplement'));

create or replace function public.protect_agency_profile_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.current_app_role() = 'admin' then
    return new;
  end if;

  new.uid := old.uid;
  new.email := old.email;
  new."verificationStatus" := old."verificationStatus";
  new."reviewNote" := old."reviewNote";
  new."accountStatus" := old."accountStatus";
  new."createdAt" := old."createdAt";
  new."deletedAt" := old."deletedAt";
  return new;
end;
$$;

drop policy if exists "admin updates agency profile" on public.agency_profiles;
create policy "admin updates agency profile"
  on public.agency_profiles
  for update
  to authenticated
  using (public.current_app_role() = 'admin')
  with check (public.current_app_role() = 'admin');

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
where "accountStatus" = 'ACTIVE'
  and "verificationStatus" = 'approved';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested text := lower(coalesce(new.raw_user_meta_data->>'role', 'donor'));
  assigned text := case when requested = 'agency' then 'agency' else 'donor' end;
  display text := nullif(trim(coalesce(
    new.raw_user_meta_data->>'display_name',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    ''
  )), '');
  kind text := case
    when assigned = 'donor' and lower(coalesce(new.raw_user_meta_data->>'donor_kind', 'individual')) = 'company'
      then 'company'
    else 'individual'
  end;
  provider text := coalesce(nullif(new.raw_app_meta_data->>'provider', ''), 'email');
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  insert into public.user_accounts (user_id, email, display_name, role, donor_kind)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(display, split_part(coalesce(new.email, 'member'), '@', 1)),
    assigned,
    kind
  )
  on conflict (user_id) do nothing;

  if assigned = 'donor' then
    insert into public.donor_profiles (
      "uid", "email", "displayName", "fullName", "accountName", "phoneNumber", "loginProvider", "accountStatus"
    )
    values (
      new.id::text,
      coalesce(new.email, ''),
      coalesce(display, split_part(coalesce(new.email, 'member'), '@', 1)),
      nullif(trim(coalesce(meta->>'full_name', meta->>'name', '')), ''),
      nullif(trim(coalesce(meta->>'account_name', '')), ''),
      nullif(trim(coalesce(meta->>'phone', '')), ''),
      provider,
      'ACTIVE'
    )
    on conflict ("uid") do nothing;
  end if;

  if kind = 'company' then
    insert into public.donor_company_applications (
      user_id, company_name, tax_id, representative, contact_phone, address, document_name
    )
    values (
      new.id,
      coalesce(nullif(trim(meta->>'company_name'), ''), display, '未填公司名稱'),
      coalesce(nullif(trim(meta->>'tax_id'), ''), '00000000'),
      coalesce(nullif(trim(meta->>'representative'), ''), '未填負責人'),
      coalesce(meta->>'phone', ''),
      coalesce(meta->>'address', ''),
      coalesce(meta->>'document_name', '')
    )
    on conflict (user_id) do nothing;
  end if;

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

notify pgrst, 'reload schema';
