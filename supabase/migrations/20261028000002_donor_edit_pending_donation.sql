-- 捐助者可撤回或修正尚未被機構決定的物資審核（AI 審核中／待人工審核）。

drop policy if exists "donor removes own unfinished donation" on public.donor_daily_donations;
create policy "donor removes own unfinished donation"
  on public.donor_daily_donations
  for delete
  to authenticated
  using (
    public.current_app_role() = 'donor'
    and donor_uid = (select auth.uid()::text)
    and status in ('pending_ai_review', 'pending_human_review')
  );

drop policy if exists "donor updates own unfinished donation" on public.donor_daily_donations;
create policy "donor updates own unfinished donation"
  on public.donor_daily_donations
  for update
  to authenticated
  using (
    public.current_app_role() = 'donor'
    and donor_uid = (select auth.uid()::text)
    and status in ('pending_ai_review', 'pending_human_review')
  )
  with check (
    public.current_app_role() = 'donor'
    and donor_uid = (select auth.uid()::text)
    and status in ('pending_ai_review', 'pending_human_review')
  );

grant update on public.donor_daily_donations to authenticated;

notify pgrst, 'reload schema';
