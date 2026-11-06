-- AI 未通過時捐助者可反覆補件；若機構已人工決定，後續補件／AI 結果一律無效，以人工為準。

create or replace function public.decide_donation_human_review(
  p_donation_id uuid,
  p_decision text,
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
  if public.current_app_role() not in ('agency', 'admin') then
    raise exception '只有受助機構可以做人工審核';
  end if;

  if p_decision not in ('accepted', 'rejected') then
    raise exception '人工判定只能是通過或不通過';
  end if;

  reason := nullif(btrim(coalesce(p_reason, '')), '');
  if p_decision = 'rejected' and (reason is null or char_length(reason) < 2) then
    raise exception '不通過時請填寫原因';
  end if;

  select * into donation
  from public.donor_daily_donations
  where id = p_donation_id
  for update;

  if donation.id is null then
    raise exception '找不到這筆捐助';
  end if;

  -- 已人工結案：鎖定，不再覆寫
  if donation.status in ('human_approved', 'human_rejected') then
    return jsonb_build_object(
      'donationId', donation.id,
      'status', donation.status,
      'decision', donation.human_decision,
      'locked', true,
      'message', '此筆已由人工審核鎖定，無法再改判定'
    );
  end if;

  -- 補件／AI 進行中／待人工：機構都可依目前媒體做決定
  if donation.status not in ('pending_human_review', 'needs_supplement', 'pending_ai_review') then
    raise exception '目前狀態無法人工審核';
  end if;

  update public.donor_daily_donations
  set status = case when p_decision = 'accepted' then 'human_approved' else 'human_rejected' end,
      human_decision = p_decision,
      human_reason = case when p_decision = 'accepted' then null else reason end,
      human_checked_at = now()
  where id = donation.id;

  return jsonb_build_object(
    'donationId', donation.id,
    'status', case when p_decision = 'accepted' then 'human_approved' else 'human_rejected' end,
    'decision', p_decision,
    'locked', true,
    'message', '人工審核已鎖定，之後補件無效'
  );
end;
$$;

revoke all on function public.decide_donation_human_review(uuid, text, text) from public;
grant execute on function public.decide_donation_human_review(uuid, text, text) to authenticated, service_role;

-- AI 寫入：若人工已鎖定，忽略這次 AI／補件結果
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

  select * into donation
  from public.donor_daily_donations
  where id = p_donation_id
  for update;

  if donation.id is null then
    raise exception '找不到這筆捐助';
  end if;

  if donation.status in ('human_approved', 'human_rejected') then
    return jsonb_build_object(
      'donationId', donation.id,
      'status', donation.status,
      'decision', coalesce(donation.ai_decision, ''),
      'decisionText', '人工審核已鎖定，本次 AI／補件結果無效',
      'detectedCondition', coalesce(donation.ai_condition, ''),
      'reason', coalesce(donation.human_reason, donation.ai_reason, '已由機構人工決定'),
      'conditionMatches', donation.human_decision = 'accepted',
      'lockedByHuman', true
    );
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
    where id = donation.id
      and status = 'pending_ai_review';

    -- 競態：更新當下已被人工鎖定
    if not found then
      select * into donation from public.donor_daily_donations where id = p_donation_id;
      return jsonb_build_object(
        'donationId', donation.id,
        'status', donation.status,
        'decision', coalesce(donation.ai_decision, ''),
        'decisionText', '人工審核已鎖定，本次 AI／補件結果無效',
        'detectedCondition', coalesce(donation.ai_condition, ''),
        'reason', coalesce(donation.human_reason, donation.ai_reason, '已由機構人工決定'),
        'conditionMatches', donation.human_decision = 'accepted',
        'lockedByHuman', true
      );
    end if;

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
  where id = donation.id
    and status = 'pending_ai_review';

  if not found then
    select * into donation from public.donor_daily_donations where id = p_donation_id;
    return jsonb_build_object(
      'donationId', donation.id,
      'status', donation.status,
      'decision', coalesce(donation.ai_decision, ''),
      'decisionText', '人工審核已鎖定，本次 AI／補件結果無效',
      'detectedCondition', coalesce(donation.ai_condition, ''),
      'reason', coalesce(donation.human_reason, donation.ai_reason, '已由機構人工決定'),
      'conditionMatches', donation.human_decision = 'accepted',
      'lockedByHuman', true
    );
  end if;

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

  -- 人工已通過：補件無效
  if donation.status = 'human_approved' then
    raise exception '機構已人工通過並鎖定，後續補件無效';
  end if;

  -- 人工不通過：允許刻意再補；若仍是 AI 未過／需補件則可反覆送
  if donation.status not in ('needs_supplement', 'human_rejected') then
    if donation.status in ('pending_human_review', 'pending_ai_review') then
      raise exception '目前已進入審核流程，請稍候再試；若機構已人工決定，補件會無效';
    end if;
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
  where id = donation.id
    and status in ('needs_supplement', 'human_rejected');

  if not found then
    raise exception '機構已人工審核鎖定，後續補件無效';
  end if;

  return jsonb_build_object(
    'donationId', donation.id,
    'status', 'pending_ai_review',
    'message', '已補件並重新送審，等待 AI 審核'
  );
end;
$$;

-- 需補件時也不要被 mark 覆寫人工結果
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

  if donation.status in ('human_approved', 'human_rejected') then
    return jsonb_build_object(
      'donationId', donation.id,
      'status', donation.status,
      'decision', coalesce(donation.human_decision, ''),
      'reason', coalesce(donation.human_reason, reason),
      'lockedByHuman', true
    );
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
  where id = donation.id
    and status = 'pending_ai_review';

  if not found then
    select * into donation from public.donor_daily_donations where id = p_donation_id;
    return jsonb_build_object(
      'donationId', donation.id,
      'status', donation.status,
      'decision', coalesce(donation.human_decision, donation.ai_decision, ''),
      'reason', coalesce(donation.human_reason, donation.ai_reason, reason),
      'lockedByHuman', donation.status in ('human_approved', 'human_rejected')
    );
  end if;

  perform public.notify_donation_needs_supplement(donation.id);

  return jsonb_build_object(
    'donationId', donation.id,
    'status', 'needs_supplement',
    'decision', 'rejected',
    'reason', reason
  );
end;
$$;
