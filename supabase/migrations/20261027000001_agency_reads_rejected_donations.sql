-- 機構把審核中的捐助改成不接受時，新狀態是 human_rejected。
-- 既有的 SELECT 只涵蓋審核中與已通過，PostgREST 回傳更新後的列時會被 RLS 擋成 42501。

drop policy if exists "agency reads rejected donations" on public.donor_daily_donations;
create policy "agency reads rejected donations"
  on public.donor_daily_donations
  for select
  to authenticated
  using (
    status = 'human_rejected'
    and public.current_app_role() in ('agency', 'admin')
  );

notify pgrst, 'reload schema';
