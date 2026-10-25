-- 受助者的捐助發票審核要讀得到已通過的捐助。
-- 登入後原本只允許捐助者讀自己的列，機構帳號因此看到空白清單。

drop policy if exists "agency reads approved donations" on public.donor_daily_donations;
create policy "agency reads approved donations"
  on public.donor_daily_donations
  for select
  to authenticated
  using (
    status = 'human_approved'
    and public.current_app_role() in ('agency', 'admin')
  );

drop policy if exists "agency records shipment on approved donations" on public.donor_daily_donations;
create policy "agency records shipment on approved donations"
  on public.donor_daily_donations
  for update
  to authenticated
  using (
    status = 'human_approved'
    and public.current_app_role() = 'agency'
  )
  with check (
    status = 'human_approved'
    and public.current_app_role() = 'agency'
  );
