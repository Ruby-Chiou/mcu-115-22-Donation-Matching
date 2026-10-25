-- 機構不能自行把資格改成已確認，也不能改掉登入信箱。
-- 介紹圖片放到公開圖檔空間，證明文件不放這裡。

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
  new."accountStatus" := old."accountStatus";
  new."createdAt" := old."createdAt";
  new."deletedAt" := old."deletedAt";
  return new;
end;
$$;

drop trigger if exists protect_agency_profile_fields on public.agency_profiles;
create trigger protect_agency_profile_fields
  before update on public.agency_profiles
  for each row execute function public.protect_agency_profile_fields();

revoke all on function public.protect_agency_profile_fields() from public, anon, authenticated;

insert into storage.buckets (id, name, public)
values ('agency-intro', 'agency-intro', true)
on conflict (id) do nothing;

drop policy if exists "agency intro read" on storage.objects;
create policy "agency intro read"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'agency-intro');

drop policy if exists "agency intro insert" on storage.objects;
create policy "agency intro insert"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'agency-intro'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "agency intro update" on storage.objects;
create policy "agency intro update"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'agency-intro'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

notify pgrst, 'reload schema';
