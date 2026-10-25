-- 簽收回報，以及讓 AI 審核做完就交給人工，不再停在本機服務。

alter table public.donor_daily_donations
  add column if not exists receipt_confirmed_at timestamptz,
  add column if not exists receipt_partial boolean not null default false,
  add column if not exists receipt_declined_video boolean not null default false,
  add column if not exists receipt_note text;

alter table public.donation_files
  drop constraint if exists donation_files_type_check;

alter table public.donation_files
  add constraint donation_files_type_check
  check (file_type in ('material_image', 'material_video', 'proof', 'receipt_image', 'receipt_video'));

create or replace function public.finish_ai_donation_review(p_donation_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  donation public.donor_daily_donations%rowtype;
  demand_item text;
  image_count int;
  video_count int;
  decision text;
  reason text;
begin
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

  select count(*) into image_count
  from public.donation_files
  where donation_id = donation.id and file_type = 'material_image';

  select count(*) into video_count
  from public.donation_files
  where donation_id = donation.id and file_type = 'material_video';

  select item into demand_item
  from public.agency_daily_supply_items
  where id = donation.demand_id;

  if image_count < 1 then
    decision := 'rejected';
    reason := '沒有物資照片。已交給機構人工決定，不再停在 AI 審核。';
  else
    decision := 'accepted';
    reason := '已收到 ' || image_count || ' 張物資照片';
    if video_count > 0 then
      reason := reason || '、' || video_count || ' 段影片';
    else
      reason := reason || '。這次沒有附操作影片';
    end if;
    reason := reason || '。請機構看過照片後決定，通過後捐助者才上傳物流單號。';
  end if;

  update public.donor_daily_donations
  set status = 'pending_human_review',
      ai_decision = decision,
      ai_condition = coalesce(demand_item, ''),
      ai_reason = reason,
      ai_checked_at = now()
  where id = donation.id;

  return jsonb_build_object(
    'donationId', donation.id,
    'status', 'pending_human_review',
    'decision', decision,
    'decisionText', case when decision = 'accepted' then '已交給機構審核' else '資料不足，已交給機構審核' end,
    'detectedCondition', coalesce(demand_item, ''),
    'reason', reason,
    'conditionMatches', decision = 'accepted'
  );
end;
$$;

create or replace function public.finish_waiting_ai_reviews()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  donation_id uuid;
  finished integer := 0;
begin
  for donation_id in
    select id from public.donor_daily_donations where status = 'pending_ai_review'
  loop
    perform public.finish_ai_donation_review(donation_id);
    finished := finished + 1;
  end loop;

  return finished;
end;
$$;

create or replace function public.confirm_donation_receipt(
  p_donation_id uuid,
  p_partial boolean,
  p_declined_video boolean,
  p_note text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  donation public.donor_daily_donations%rowtype;
  image_count integer;
  video_count integer;
begin
  if public.current_app_role() not in ('agency', 'admin') then
    raise exception '只有受助機構可以做簽收回報';
  end if;

  select * into donation
  from public.donor_daily_donations
  where id = p_donation_id
  for update;

  if donation.id is null then
    raise exception '找不到這筆捐助';
  end if;

  if donation.status <> 'human_approved' then
    raise exception '機構還沒有通過這筆捐助';
  end if;

  if donation.receipt_confirmed_at is not null then
    raise exception '這筆已經簽收過了';
  end if;

  if donation.donation_method = '寄送' and coalesce(btrim(donation.tracking_no), '') = '' then
    raise exception '捐助者還沒有上傳物流單號';
  end if;

  select count(*) into image_count
  from public.donation_files
  where donation_id = p_donation_id and file_type = 'receipt_image';

  select count(*) into video_count
  from public.donation_files
  where donation_id = p_donation_id and file_type = 'receipt_video';

  if image_count < 1 then
    raise exception '請先上傳至少一張收貨照片';
  end if;

  if video_count = 0 and not coalesce(p_declined_video, false) then
    raise exception '沒有錄影時，要確認爭議由雙方各自承擔';
  end if;

  update public.donor_daily_donations
  set receipt_confirmed_at = now(),
      receipt_partial = coalesce(p_partial, false),
      receipt_declined_video = video_count = 0,
      receipt_note = nullif(btrim(coalesce(p_note, '')), '')
  where id = p_donation_id;
end;
$$;

grant execute on function public.finish_ai_donation_review(uuid) to anon, authenticated;
grant execute on function public.finish_waiting_ai_reviews() to anon, authenticated;
grant execute on function public.confirm_donation_receipt(uuid, boolean, boolean, text) to authenticated;

drop policy if exists "agency uploads receipt files" on public.donation_files;
create policy "agency uploads receipt files"
  on public.donation_files
  for insert
  to authenticated
  with check (
    file_type in ('receipt_image', 'receipt_video')
    and public.current_app_role() in ('agency', 'admin')
  );

drop policy if exists "agency reads donation files" on public.donation_files;
create policy "agency reads donation files"
  on public.donation_files
  for select
  to authenticated
  using (public.current_app_role() in ('agency', 'admin'));

drop policy if exists "agency uploads donation receipt files" on storage.objects;
create policy "agency uploads donation receipt files"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'donation-files'
    and public.current_app_role() in ('agency', 'admin')
  );

grant select, insert on public.donation_files to authenticated;

notify pgrst, 'reload schema';
