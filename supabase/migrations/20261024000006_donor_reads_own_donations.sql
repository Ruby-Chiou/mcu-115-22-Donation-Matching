-- 登入後的捐助者要能讀到自己的捐助紀錄。既有匿名政策看得到示範列，已登入身分卻被擋掉。

grant select on public.donor_daily_donations to authenticated;

drop policy if exists "donor reads own donations" on public.donor_daily_donations;
create policy "donor reads own donations"
  on public.donor_daily_donations
  for select
  to authenticated
  using (donor_uid = (select auth.uid()::text));
