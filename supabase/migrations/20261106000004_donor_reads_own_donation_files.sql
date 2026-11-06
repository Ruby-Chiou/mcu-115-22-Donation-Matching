-- 捐助者可查看自己上傳的物資照片／影片（歷史紀錄預覽用）

drop policy if exists "donor reads own donation files" on public.donation_files;
create policy "donor reads own donation files"
  on public.donation_files
  for select
  to authenticated
  using (
    public.current_app_role() = 'donor'
    and exists (
      select 1
      from public.donor_daily_donations as donation
      where donation.id::text = donation_id::text
        and donation.donor_uid = (select auth.uid()::text)
    )
  );

drop policy if exists "donor reads own donation file objects" on storage.objects;
create policy "donor reads own donation file objects"
  on storage.objects
  for select
  to authenticated
  using (
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
