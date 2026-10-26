-- 登入捐助者送出日常捐助時，資料表沒有 INSERT，Postgres 回 42501。
-- 照片接著寫進 donation_files 與 donation-files，原本只有受助機構能上傳收據檔。

grant insert, delete on public.donor_daily_donations to authenticated;

drop policy if exists "donor inserts own donation" on public.donor_daily_donations;
create policy "donor inserts own donation"
  on public.donor_daily_donations
  for insert
  to authenticated
  with check (
    public.current_app_role() = 'donor'
    and donor_uid = (select auth.uid()::text)
  );

drop policy if exists "donor removes own unfinished donation" on public.donor_daily_donations;
create policy "donor removes own unfinished donation"
  on public.donor_daily_donations
  for delete
  to authenticated
  using (
    public.current_app_role() = 'donor'
    and donor_uid = (select auth.uid()::text)
    and status = 'pending_ai_review'
  );

do $$
declare
  seq regclass;
begin
  seq := pg_get_serial_sequence('public.donor_daily_donations', 'id');
  if seq is not null then
    execute format('grant usage, select on sequence %s to authenticated', seq);
  end if;

  seq := pg_get_serial_sequence('public.donation_files', 'id');
  if seq is not null then
    execute format('grant usage, select on sequence %s to authenticated', seq);
  end if;
end $$;

drop policy if exists "donor records own material files" on public.donation_files;
create policy "donor records own material files"
  on public.donation_files
  for insert
  to authenticated
  with check (
    file_type in ('material_image', 'material_video')
    and public.current_app_role() = 'donor'
    and exists (
      select 1
      from public.donor_daily_donations as donation
      where donation.id::text = donation_id::text
        and donation.donor_uid = (select auth.uid()::text)
    )
  );

drop policy if exists "donor uploads own material files" on storage.objects;
create policy "donor uploads own material files"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'donation-files'
    and public.current_app_role() = 'donor'
    and (storage.foldername(name))[1] = 'donations'
    and exists (
      select 1
      from public.donor_daily_donations as donation
      where donation.id::text = (storage.foldername(name))[2]
        and donation.donor_uid = (select auth.uid()::text)
    )
  );

notify pgrst, 'reload schema';
