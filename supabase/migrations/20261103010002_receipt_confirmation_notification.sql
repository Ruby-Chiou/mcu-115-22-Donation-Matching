-- Confirm receipt and notify the donor in the same database transaction.

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
  material text;
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

  if donation.donor_uid is not null and btrim(donation.donor_uid) <> '' then
    material := coalesce(nullif(btrim(donation.actual_material), ''), '捐贈物資');
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
      '機構已收到您的捐贈：' || left(material, 40),
      '受助機構已確認收到「' || material || '」。'
        || case when coalesce(p_partial, false) then E'\n本次登記為部分到貨，請查看捐助紀錄中的簽收說明。' else '' end
        || coalesce(E'\n簽收說明：' || nullif(btrim(coalesce(p_note, '')), ''), '')
        || E'\n捐助編號：' || donation.id::text,
      donation.id::text
    );
  end if;
end;
$$;

grant execute on function public.confirm_donation_receipt(uuid, boolean, boolean, text) to authenticated;
