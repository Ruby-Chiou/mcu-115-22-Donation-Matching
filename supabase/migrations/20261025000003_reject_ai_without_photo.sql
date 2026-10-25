-- 沒有物資照片時，不能把 AI 判定寫成通過。
-- 已經被標成通過、但資料庫裡沒有照片或影片的案件，改回不通過。

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

update public.donor_daily_donations as donation
set ai_decision = 'rejected',
    ai_condition = '無法判斷',
    ai_reason = '沒有上傳物資照片或影片，不能判定通過。'
where donation.ai_decision = 'accepted'
  and not exists (
    select 1
    from public.donation_files as file
    where file.donation_id = donation.id
      and file.file_type in ('material_image', 'material_video')
  );

notify pgrst, 'reload schema';
