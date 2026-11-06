-- AI 判定不通過 → 需補件（捐助者可同一筆重傳圖／影片再送審）
-- 機構「略過 AI／基礎設施失敗」改走 handoff，不要再用 rejected 假裝轉人工

create or replace function public.handoff_donation_to_human_review(
  p_donation_id uuid,
  p_reason text
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
    '系統影像辨識未完成，請機構直接依照片人工確認。'
  );

  if char_length(reason) < 8 then
    reason := reason || '請機構直接依照片人工確認。';
  end if;

  select * into donation
  from public.donor_daily_donations
  where id = p_donation_id
  for update;

  if donation.id is null then
    raise exception '找不到這筆捐助';
  end if;

  if donation.status not in ('pending_ai_review', 'needs_supplement') then
    return jsonb_build_object(
      'donationId', donation.id,
      'status', donation.status,
      'decision', coalesce(donation.ai_decision, ''),
      'decisionText', '已經審過',
      'detectedCondition', coalesce(donation.ai_condition, ''),
      'reason', coalesce(donation.ai_reason, reason),
      'conditionMatches', donation.ai_decision = 'accepted'
    );
  end if;

  update public.donor_daily_donations
  set status = 'pending_human_review',
      ai_decision = null,
      ai_condition = '改由人工確認',
      ai_reason = reason,
      ai_checked_at = now()
  where id = donation.id;

  return jsonb_build_object(
    'donationId', donation.id,
    'status', 'pending_human_review',
    'decision', 'rejected',
    'decisionText', '已轉交機構人工審核',
    'detectedCondition', '改由人工確認',
    'reason', reason,
    'conditionMatches', false
  );
end;
$$;

revoke all on function public.handoff_donation_to_human_review(uuid, text) from public;
grant execute on function public.handoff_donation_to_human_review(uuid, text) to anon, authenticated, service_role;

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
  reason text;
begin
  if p_decision not in ('accepted', 'rejected') then
    raise exception 'AI 判定只能是通過或不通過';
  end if;

  reason := btrim(coalesce(p_reason, ''));
  if char_length(reason) < 8 then
    raise exception 'AI 必須附上這張照片的辨識說明';
  end if;

  select count(*) into image_count
  from public.donation_files
  where donation_id = p_donation_id
    and file_type = 'material_image';

  if image_count < 1 then
    marked := public.mark_donation_needs_supplement(
      p_donation_id,
      coalesce(nullif(reason, ''), '沒有上傳物資照片或影片，AI 無法完成審核。請補上傳後再送審。')
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

  -- AI 不通過：同一筆需補件，捐助者可重傳圖／影片，不必撤回重送
  if p_decision = 'rejected' then
    update public.donor_daily_donations
    set status = 'needs_supplement',
        ai_decision = 'rejected',
        ai_condition = coalesce(nullif(btrim(p_condition), ''), '不符合需求'),
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
      'decisionText', 'AI 未通過，已通知捐助者補上傳照片／影片後再送審',
      'detectedCondition', coalesce(nullif(btrim(p_condition), ''), '不符合需求'),
      'reason', reason,
      'conditionMatches', false
    );
  end if;

  update public.donor_daily_donations
  set status = 'pending_human_review',
      ai_decision = 'accepted',
      ai_condition = coalesce(p_condition, ''),
      ai_reason = reason,
      ai_checked_at = now()
  where id = donation.id;

  return jsonb_build_object(
    'donationId', donation.id,
    'status', 'pending_human_review',
    'decision', 'accepted',
    'decisionText', '照片與填寫內容相符，已交給機構審核',
    'detectedCondition', coalesce(p_condition, ''),
    'reason', reason,
    'conditionMatches', true
  );
end;
$$;

-- 已卡在「機構審核中」但 AI 已不通過、機構尚未決定的舊資料 → 改需補件
update public.donor_daily_donations
set status = 'needs_supplement'
where status = 'pending_human_review'
  and ai_decision = 'rejected'
  and human_decision is null;

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
