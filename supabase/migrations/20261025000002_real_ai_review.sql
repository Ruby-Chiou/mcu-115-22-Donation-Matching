-- 機構要看得到還在審核的捐助，總控台才數得出需要人工審核的筆數。
-- AI 判定改由影像 API 寫入，資料庫不再自己產生通過說明。

drop policy if exists "agency reads donations awaiting review" on public.donor_daily_donations;
create policy "agency reads donations awaiting review"
  on public.donor_daily_donations
  for select
  to authenticated
  using (
    status in ('pending_ai_review', 'pending_human_review')
    and public.current_app_role() in ('agency', 'admin')
  );

create or replace function public.finish_ai_donation_review(p_donation_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  raise exception 'AI 審核必須先呼叫影像 API，不能在資料庫裡直接結案';
end;
$$;

create or replace function public.finish_waiting_ai_reviews()
returns integer
language plpgsql
security definer
set search_path = public
as $$
begin
  raise exception 'AI 審核必須先呼叫影像 API，不能在資料庫裡直接結案';
end;
$$;

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
begin
  if p_decision not in ('accepted', 'rejected') then
    raise exception 'AI 判定只能是通過或不通過';
  end if;

  if p_reason is null or char_length(btrim(p_reason)) < 8 then
    raise exception 'AI 必須附上這張照片的辨識說明';
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

grant execute on function public.record_ai_donation_review(uuid, text, text, text) to anon, authenticated;

notify pgrst, 'reload schema';
