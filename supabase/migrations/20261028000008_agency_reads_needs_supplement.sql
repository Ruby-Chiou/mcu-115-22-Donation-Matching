-- 機構可看到「待捐助者補件」的案件，才知道為何還沒進人工審核。

drop policy if exists "agency reads needs_supplement donations" on public.donor_daily_donations;
create policy "agency reads needs_supplement donations"
  on public.donor_daily_donations
  for select
  to authenticated
  using (
    status = 'needs_supplement'
    and public.current_app_role() in ('agency', 'admin')
  );

notify pgrst, 'reload schema';
