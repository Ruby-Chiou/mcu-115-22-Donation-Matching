-- 物流公司與單號由捐助者上傳。機構審核接受或不接受時，寫一封站內信到該捐助者的收件匣。

alter table public.donor_daily_donations
  add column if not exists logistics_carrier text;

drop function if exists public.upload_donation_tracking(uuid, text, text);

create or replace function public.upload_donation_tracking(
  p_donation_id uuid,
  p_donor_uid text,
  p_tracking text,
  p_carrier text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_id uuid;
begin
  if p_tracking is null or btrim(p_tracking) = '' then
    raise exception '請輸入物流單號';
  end if;

  if p_carrier is null or btrim(p_carrier) not in ('黑貓宅急便', '7-ELEVEN', '全家', '中華郵政', '新竹物流') then
    raise exception '請選擇物流公司';
  end if;

  update public.donor_daily_donations
  set tracking_no = btrim(p_tracking),
      logistics_carrier = btrim(p_carrier),
      tracking_uploaded_at = now()
  where id = p_donation_id
    and donor_uid = p_donor_uid
    and status = 'human_approved'
    and donation_method = '寄送'
  returning id into updated_id;

  if updated_id is null then
    raise exception '只有審核通過的寄送捐助可以上傳物流資料';
  end if;
end;
$$;

revoke all on function public.upload_donation_tracking(uuid, text, text, text) from public;
grant execute on function public.upload_donation_tracking(uuid, text, text, text) to anon, authenticated;

create or replace function public.notify_donation_review(p_donation_id uuid)
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
  if auth.uid() is not null and public.current_app_role() not in ('agency', 'admin') then
    raise exception '只有受助機構可以送出審核通知';
  end if;

  select * into donation
  from public.donor_daily_donations
  where id = p_donation_id;

  if donation.id is null
    or donation.donor_uid is null
    or btrim(donation.donor_uid) = ''
    or donation.status not in ('human_approved', 'human_rejected') then
    return;
  end if;

  if exists (
    select 1
    from public.member_messages
    where "recipientUid" = donation.donor_uid
      and category = 'DONATION'
      and content like '%' || donation.id::text || '%'
  ) then
    return;
  end if;

  material := coalesce(nullif(btrim(donation.actual_material), ''), '這筆物資');

  if donation.status = 'human_approved' then
    subject := '物資審核已通過：' || left(material, 40);
    body := '「' || material || '」已由受助機構接受。';
    if donation.donation_method = '寄送' then
      body := body || '請到會員專區的捐助紀錄選擇物流公司，並上傳物流單號。';
    end if;
  else
    subject := '物資審核未通過：' || left(material, 40);
    body := '「' || material || '」未接受。原因：' || coalesce(nullif(btrim(donation.human_reason), ''), '未填寫原因');
  end if;

  body := body || E'\n捐助編號：' || donation.id::text;

  insert into public.member_messages (
    "recipientUid",
    "recipientName",
    "senderUid",
    "senderName",
    category,
    subject,
    content
  ) values (
    donation.donor_uid,
    coalesce(nullif(btrim(donation.donor_name), ''), '捐助者'),
    null,
    '受助機構',
    'DONATION',
    subject,
    body
  );
end;
$$;

revoke all on function public.notify_donation_review(uuid) from public;
grant execute on function public.notify_donation_review(uuid) to authenticated;

do $$
declare
  row_id uuid;
begin
  for row_id in
    select id
    from public.donor_daily_donations
    where status in ('human_approved', 'human_rejected')
      and donor_uid is not null
      and btrim(donor_uid) <> ''
  loop
    perform public.notify_donation_review(row_id);
  end loop;
end $$;

notify pgrst, 'reload schema';
