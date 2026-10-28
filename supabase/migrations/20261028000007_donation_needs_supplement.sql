-- AI 階段缺照片：標成需補件、通知捐助者；捐助者可在同一筆補圖後再送審（不必重跑整段申請）。

alter table public.donor_daily_donations
  drop constraint if exists donor_daily_donations_status_check;

alter table public.donor_daily_donations
  drop constraint if exists donations_status_check;

alter table public.donor_daily_donations
  add constraint donor_daily_donations_status_check
  check (status in (
    'pending_ai_review',
    'pending_human_review',
    'needs_supplement',
    'human_approved',
    'human_rejected'
  ));

create or replace function public.notify_donation_needs_supplement(p_donation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  donation public.donor_daily_donations%rowtype;
  material text;
  subject text;
  body text;
begin
  select * into donation
  from public.donor_daily_donations
  where id = p_donation_id;

  if donation.id is null
    or donation.donor_uid is null
    or btrim(donation.donor_uid) = ''
    or donation.status <> 'needs_supplement' then
    return;
  end if;

  if exists (
    select 1
    from public.member_messages as mail
    where mail."recipientUid" = donation.donor_uid
      and mail.category = 'DONATION'
      and (
        mail."relatedDonationId" = donation.id::text
        or mail.content like '%' || donation.id::text || '%'
      )
      and mail.subject like 'AI 審核需補件%'
  ) then
    return;
  end if;

  material := coalesce(nullif(btrim(donation.actual_material), ''), '這筆物資');
  subject := 'AI 審核需補件：' || left(material, 40);
  body := '「' || material || '」在 AI 審核階段未通過。'
    || coalesce(nullif(btrim(donation.ai_reason), ''), '請補上傳物資照片後再送審。')
    || E'\n請到會員專區的捐助紀錄，在同一筆申請補件後重新送審，不必重填整份申請。'
    || E'\n捐助編號：' || donation.id::text;

  insert into public.member_messages (
    "recipientUid",
    "recipientName",
    "senderUid",
    "senderName",
    category,
    subject,
    content,
    "relatedDonationId"
  ) values (
    donation.donor_uid,
    coalesce(nullif(btrim(donation.donor_name), ''), '捐助者'),
    null,
    '系統通知',
    'DONATION',
    subject,
    body,
    donation.id::text
  );
end;
$$;

create or replace function public.mark_donation_needs_supplement(
  p_donation_id uuid,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  donation public.donor_daily_donations%rowtype;
  reason text;
begin
  reason := coalesce(
    nullif(btrim(p_reason), ''),
    '沒有上傳物資照片或影片，AI 無法完成審核。請在同一筆申請補上傳照片後再送審。'
  );

  select * into donation
  from public.donor_daily_donations
  where id = p_donation_id
  for update;

  if donation.id is null then
    raise exception '找不到這筆捐助';
  end if;

  if donation.status = 'needs_supplement' then
    perform public.notify_donation_needs_supplement(donation.id);
    return jsonb_build_object(
      'donationId', donation.id,
      'status', 'needs_supplement',
      'decision', 'rejected',
      'reason', coalesce(donation.ai_reason, reason)
    );
  end if;

  if donation.status <> 'pending_ai_review' then
    return jsonb_build_object(
      'donationId', donation.id,
      'status', donation.status,
      'decision', coalesce(donation.ai_decision, ''),
      'reason', coalesce(donation.ai_reason, '')
    );
  end if;

  update public.donor_daily_donations
  set status = 'needs_supplement',
      ai_decision = 'rejected',
      ai_condition = coalesce(nullif(btrim(ai_condition), ''), '無法判斷'),
      ai_reason = reason,
      ai_checked_at = now(),
      human_decision = null,
      human_reason = null,
      human_checked_at = null
  where id = donation.id;

  perform public.notify_donation_needs_supplement(donation.id);

  return jsonb_build_object(
    'donationId', donation.id,
    'status', 'needs_supplement',
    'decision', 'rejected',
    'reason', reason
  );
end;
$$;

-- 捐助者補件後，同一筆重新進入 AI 審核
create or replace function public.resubmit_donation_after_supplement(p_donation_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  donation public.donor_daily_donations%rowtype;
  image_count integer;
  caller text := auth.uid()::text;
begin
  if caller is null or btrim(caller) = '' then
    raise exception '請先登入後再補件送審';
  end if;

  select * into donation
  from public.donor_daily_donations
  where id = p_donation_id
  for update;

  if donation.id is null then
    raise exception '找不到這筆捐助';
  end if;

  if donation.donor_uid is distinct from caller and public.current_app_role() <> 'admin' then
    raise exception '只能補件自己的捐助申請';
  end if;

  if donation.status not in ('needs_supplement', 'human_rejected') then
    raise exception '只有需補件或未通過的申請可以補件後再送審';
  end if;

  select count(*) into image_count
  from public.donation_files
  where donation_id = p_donation_id
    and file_type = 'material_image';

  if image_count < 1 then
    raise exception '請先上傳至少一張物資照片再送審';
  end if;

  update public.donor_daily_donations
  set status = 'pending_ai_review',
      ai_decision = null,
      ai_condition = null,
      ai_reason = null,
      ai_checked_at = null,
      human_decision = null,
      human_reason = null,
      human_checked_at = null
  where id = donation.id;

  return jsonb_build_object(
    'donationId', donation.id,
    'status', 'pending_ai_review',
    'message', '已補件並重新送審，等待 AI 審核'
  );
end;
$$;

-- AI 寫入結果：沒照片時改需補件並通知，不要卡在 AI 審核中或直接丟給機構
create or replace function public.record_ai_donation_review(
  p_donation_id uuid,
  p_decision text,
  p_condition text,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  donation public.donor_daily_donations%rowtype;
  image_count integer;
  marked jsonb;
begin
  if p_decision not in ('accepted', 'rejected') then
    raise exception 'AI 判定只能是通過或不通過';
  end if;

  if p_reason is null or char_length(btrim(p_reason)) < 8 then
    raise exception 'AI 必須附上這張照片的辨識說明';
  end if;

  select count(*) into image_count
  from public.donation_files
  where donation_id = p_donation_id
    and file_type = 'material_image';

  if image_count < 1 then
    marked := public.mark_donation_needs_supplement(
      p_donation_id,
      coalesce(nullif(btrim(p_reason), ''), '沒有上傳物資照片或影片，AI 無法完成審核。請補上傳後再送審。')
    );
    return jsonb_build_object(
      'donationId', marked->>'donationId',
      'status', 'needs_supplement',
      'decision', 'rejected',
      'decisionText', '缺少物資照片，已通知捐助者補件',
      'detectedCondition', coalesce(p_condition, '無法判斷'),
      'reason', marked->>'reason',
      'conditionMatches', false
    );
  end if;

  if p_decision = 'accepted' and image_count < 1 then
    raise exception '沒有物資照片，不能判定通過';
  end if;

  select * into donation
  from public.donor_daily_donations
  where id = p_donation_id
  for update;

  if donation.id is null then
    raise exception '找不到這筆捐助';
  end if;

  if donation.status <> 'pending_ai_review' then
    return jsonb_build_object(
      'donationId', donation.id,
      'status', donation.status,
      'decision', coalesce(donation.ai_decision, ''),
      'decisionText', '已經審過',
      'detectedCondition', coalesce(donation.ai_condition, ''),
      'reason', coalesce(donation.ai_reason, ''),
      'conditionMatches', donation.ai_decision = 'accepted'
    );
  end if;

  update public.donor_daily_donations
  set status = 'pending_human_review',
      ai_decision = p_decision,
      ai_condition = coalesce(p_condition, ''),
      ai_reason = btrim(p_reason),
      ai_checked_at = now()
  where id = donation.id;

  return jsonb_build_object(
    'donationId', donation.id,
    'status', 'pending_human_review',
    'decision', p_decision,
    'decisionText', case when p_decision = 'accepted' then '照片與填寫內容相符，已交給機構審核' else '照片與填寫內容不一致，已交給機構審核' end,
    'detectedCondition', coalesce(p_condition, ''),
    'reason', btrim(p_reason),
    'conditionMatches', p_decision = 'accepted'
  );
end;
$$;

-- 捐助者可更新／刪除需補件的申請內容；未通過也可走 RPC 再送審
drop policy if exists "donor removes own unfinished donation" on public.donor_daily_donations;
create policy "donor removes own unfinished donation"
  on public.donor_daily_donations
  for delete
  to authenticated
  using (
    public.current_app_role() = 'donor'
    and donor_uid = (select auth.uid()::text)
    and status in ('pending_ai_review', 'pending_human_review', 'needs_supplement')
  );

drop policy if exists "donor updates own unfinished donation" on public.donor_daily_donations;
create policy "donor updates own unfinished donation"
  on public.donor_daily_donations
  for update
  to authenticated
  using (
    public.current_app_role() = 'donor'
    and donor_uid = (select auth.uid()::text)
    and status in ('pending_ai_review', 'pending_human_review', 'needs_supplement')
  )
  with check (
    public.current_app_role() = 'donor'
    and donor_uid = (select auth.uid()::text)
    and status in ('pending_ai_review', 'pending_human_review', 'needs_supplement')
  );

revoke all on function public.mark_donation_needs_supplement(uuid, text) from public;
grant execute on function public.mark_donation_needs_supplement(uuid, text) to authenticated, service_role;

revoke all on function public.notify_donation_needs_supplement(uuid) from public;
grant execute on function public.notify_donation_needs_supplement(uuid) to authenticated, service_role;

revoke all on function public.resubmit_donation_after_supplement(uuid) from public;
grant execute on function public.resubmit_donation_after_supplement(uuid) to authenticated;

grant execute on function public.record_ai_donation_review(uuid, text, text, text) to anon, authenticated, service_role;

-- 修正既有：卡在 AI 審核且沒有物資照片的案件 → 需補件並通知
do $$
declare
  row_id uuid;
begin
  for row_id in
    select donation.id
    from public.donor_daily_donations as donation
    where donation.status = 'pending_ai_review'
      and not exists (
        select 1
        from public.donation_files as file
        where file.donation_id = donation.id
          and file.file_type = 'material_image'
      )
  loop
    perform public.mark_donation_needs_supplement(row_id);
  end loop;
end $$;

notify pgrst, 'reload schema';
