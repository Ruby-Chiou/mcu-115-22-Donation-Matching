-- 站內信可直接連到對應捐助，收件匣不必再繞回捐助紀錄手動找。

alter table public.member_messages
  add column if not exists "relatedDonationId" text;

create index if not exists member_messages_related_donation_idx
  on public.member_messages ("relatedDonationId")
  where "relatedDonationId" is not null;

comment on column public.member_messages."relatedDonationId" is
  '捐贈進度信對應的 donor_daily_donations.id；前端可直接開捐助紀錄或審核頁。';

-- 舊信／示範信：補上捐助編號並回填關聯
update public.member_messages
set content = content || E'\n捐助編號：a1111111-1111-4111-8111-111111111103'
where subject = '捐助審核結果：台糖礦泉水'
  and content not like '%捐助編號：%';

update public.member_messages
set content = content || E'\n捐助編號：a1111111-1111-4111-8111-111111111106'
where subject = '捐助審核結果：過期飲用水'
  and content not like '%捐助編號：%';

update public.member_messages
set content = content || E'\n捐助編號：a1111111-1111-4111-8111-111111111107'
where subject = '企業捐助已通過'
  and content not like '%捐助編號：%';

update public.member_messages
set "relatedDonationId" = substring(content from '捐助編號：\s*([0-9a-fA-F-]{36})')
where category = 'DONATION'
  and "relatedDonationId" is null
  and content ~ '捐助編號：\s*[0-9a-fA-F-]{36}';

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
      and (
        "relatedDonationId" = donation.id::text
        or content like '%' || donation.id::text || '%'
      )
  ) then
    return;
  end if;

  material := coalesce(nullif(btrim(donation.actual_material), ''), '這筆物資');

  if donation.status = 'human_approved' then
    subject := '物資審核已通過：' || left(material, 40);
    body := '「' || material || '」已由受助機構接受。';
    if donation.donation_method = '寄送' then
      body := body || '請到會員專區的捐助紀錄選擇物流公司，並上傳物流單號。也可直接點信件裡的操作按鈕。';
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
    content,
    "relatedDonationId"
  ) values (
    donation.donor_uid,
    coalesce(nullif(btrim(donation.donor_name), ''), '捐助者'),
    null,
    '受助機構',
    'DONATION',
    subject,
    body,
    donation.id::text
  );
end;
$$;

revoke all on function public.notify_donation_review(uuid) from public;
grant execute on function public.notify_donation_review(uuid) to authenticated;

notify pgrst, 'reload schema';
