-- 測試帳號各流程階段可用資料：需求、留言、捐助狀態、物流、簽收、站內信、企業帳號。
-- 可重複執行；固定 UUID / serialNo 已存在時略過。

create or replace function public.seed_dev_login(
  p_id uuid,
  p_email text,
  p_password text,
  p_display_name text,
  p_role text
)
returns void
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  instance uuid;
begin
  if exists (select 1 from auth.users where id = p_id or email = p_email) then
    return;
  end if;

  select id into instance from auth.instances limit 1;
  if instance is null then
    instance := '00000000-0000-0000-0000-000000000000';
  end if;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token,
    email_change_token_current, reauthentication_token, is_sso_user, is_anonymous
  ) values (
    instance, p_id, 'authenticated', 'authenticated', p_email,
    extensions.crypt(p_password, extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('display_name', p_display_name, 'role', p_role,
      'donor_kind', case when p_role = 'donor' and p_email like '%company@%' then 'company' else 'individual' end,
      'company_name', '測試愛心企業', 'tax_id', '12345678', 'representative', '王經理',
      'phone', '0987654321', 'address', '台北市信義區企業路 8 號', 'full_name', p_display_name,
      'account_name', 'demo_company'),
    now(), now(), '', '', '', '', '', '', false, false
  );

  insert into auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  ) values (
    p_id, p_id,
    jsonb_build_object('sub', p_id::text, 'email', p_email, 'email_verified', true),
    'email', p_id::text, now(), now(), now()
  );
end;
$$;

revoke all on function public.seed_dev_login(uuid, text, text, text, text) from public, anon, authenticated;

-- 企業捐助者（留言名片與企業審核流程用）。只依公司信箱對帳，勿硬改其他測試個人 UUID。
select public.seed_dev_login(
  '44444444-4444-4444-8444-444444444444',
  'dev.company@example.com',
  'Km7#company-Gate',
  '測試愛心企業',
  'donor'
);

insert into public.user_accounts (user_id, email, display_name, role, donor_kind)
select
  u.id,
  'dev.company@example.com',
  '測試愛心企業',
  'donor',
  'company'
from auth.users u
where u.email = 'dev.company@example.com'
  and not exists (
    select 1 from public.user_accounts a where a.email = 'dev.company@example.com' or a.user_id = u.id
  )
limit 1;

update public.user_accounts
set display_name = '測試愛心企業',
    role = 'donor',
    donor_kind = 'company'
where email = 'dev.company@example.com';

insert into public.donor_profiles
  ("uid", "email", "displayName", "accountName", "fullName", "phoneNumber", "city", "loginProvider", "accountStatus")
select
  a.user_id::text,
  'dev.company@example.com',
  '測試愛心企業',
  'demo_company',
  '測試愛心企業',
  '0987654321',
  '台北市',
  'email',
  'ACTIVE'
from public.user_accounts a
where a.email = 'dev.company@example.com'
  and not exists (
    select 1 from public.donor_profiles p
    where p."email" = 'dev.company@example.com' or p."uid" = a.user_id::text
  )
limit 1;

insert into public.member_notification_settings ("uid")
select a.user_id::text
from public.user_accounts a
where a.email = 'dev.company@example.com'
  and not exists (
    select 1 from public.member_notification_settings s where s."uid" = a.user_id::text
  )
limit 1;

insert into public.donor_company_applications (
  user_id, company_name, tax_id, representative, contact_phone, address, document_name, status, reviewed_at
)
select
  a.user_id,
  '測試愛心企業',
  '12345678',
  '王經理',
  '0987654321',
  '台北市信義區企業路 8 號',
  'company-registration.pdf',
  'approved',
  now()
from public.user_accounts a
where a.email = 'dev.company@example.com'
limit 1
on conflict (user_id) do update
set status = 'approved',
    company_name = excluded.company_name,
    reviewed_at = now();

drop function public.seed_dev_login(uuid, text, text, text, text);

-- 確保測試受助者可刊登／審核
update public.agency_profiles
set "verificationStatus" = 'approved',
    "agencyName" = coalesce(nullif(btrim("agencyName"), ''), '示範社福機構'),
    "updatedAt" = now()
where uid = '22222222-2222-4222-8222-222222222222';

do $$
declare
  donor_uid text := '11111111-1111-4111-8111-111111111111';
  company_uid text := '44444444-4444-4444-8444-444444444444';
  agency_uid text := '22222222-2222-4222-8222-222222222222';
  daily_id bigint;
  disaster_id bigint;
  helper_id bigint;
  comment_parent bigint;
begin
  select coalesce(
    (select user_id::text from public.user_accounts where email = 'dev.company@example.com' limit 1),
    company_uid
  ) into company_uid;

  if to_regclass('public.agency_daily_supply_items') is null
     or to_regclass('public.donor_daily_donations') is null then
    raise notice 'skip stage demo: donation tables missing';
    return;
  end if;

  select id into daily_id
  from public.agency_daily_supply_items
  where "serialNo" = 9001
  limit 1;

  if daily_id is null then
    select id into daily_id
    from public.agency_daily_supply_items
    where status = '上架'
    order by id
    limit 1;
  end if;

  if daily_id is null then
    insert into public.agency_daily_supply_items (
      "serialNo", "createdAt", "publishedAt", "expectedOffShelfAt",
      item, amount, remaining, unit, "amountDescription", category,
      reason, description, brand,
      "serviceTargets", "customServiceTargets",
      conditions, "customConditions",
      priority, status, "offShelfReason",
      "receiveMethod", recipient, address, latitude, longitude, phone,
      "contactTimeWeekday", "contactTimeWeekend",
      "contactTimeMorning", "contactTimeAfternoon", "contactTimeEvening",
      note
    ) values (
      9001, now() - interval '5 days', now() - interval '4 days', now() + interval '20 days',
      '瓶裝水', 100, 72, '箱', '每箱 24 瓶', '食品與飲用水',
      '安置個案日常飲用需求', '接受常溫瓶裝水，勿寄玻璃瓶。', '不限品牌',
      array['孩童','貧困']::text[], '{}'::json[],
      array['全新:接受','二手:不接受','過期:不接受']::text[], '{}'::json[],
      '緊急', '上架', 'natural',
      array['寄送','面交']::text[], '林小安', '台北市大安區希望路 10 號', 25.033964, 121.564468, '0223456789',
      true, true, true, true, false,
      '平日下午較方便收件'
    )
    returning id into daily_id;
  end if;

  if to_regclass('public.agency_disaster_supply_items') is not null then
    select id into disaster_id
    from public.agency_disaster_supply_items
    where "serialNo" = 9101
    limit 1;

    if disaster_id is null then
      select id into disaster_id
      from public.agency_disaster_supply_items
      where status = '上架'
      order by id
      limit 1;
    end if;

    if disaster_id is null then
      insert into public.agency_disaster_supply_items (
        "serialNo", created_at, "publishedAt", "expectedOffShelfAt",
        item, amount, remaining, unit, "amountDescription", category,
        reason, description, brand, image, "imageFileNames",
        "conditionDescription", priority, status,
        address, phone,
        "contactTimeMorning", "contactTimeAfternoon", "contactTimeEvening",
        note
      ) values (
        9101, now() - interval '3 days', now() - interval '2 days', now() + interval '10 days',
        '清潔用具組', 40, 28, '組', '掃把、垃圾袋、手套', '清潔與衛生用品',
        '災後環境整理', '請成組寄送，方便現場發放。', '不限品牌', array[]::text[], array[]::text[],
        '全新:接受、二手:接受', '非常緊急', '上架',
        '花蓮縣光復鄉中正路 1 號', '038701234',
        true, true, false,
        '到貨請先打電話'
      )
      returning id into disaster_id;
    end if;
  end if;

  if to_regclass('public.agency_disaster_volunteer_items') is not null then
    select id into helper_id
    from public.agency_disaster_volunteer_items
    where "serialNo" = 9201
    limit 1;

    if helper_id is null then
      select id into helper_id
      from public.agency_disaster_volunteer_items
      where status = '上架'
      order by id
      limit 1;
    end if;

    if helper_id is null then
      insert into public.agency_disaster_volunteer_items (
        "serialNo", "createdAt", "publishedAt", "offShelfAt",
        type, people, location, latitude, longitude,
        condition, "workContent", reason, priority, status,
        contact, phone, note
      ) values (
        9201, now() - interval '2 days', now() - interval '1 day', now() + interval '7 days',
        '環境整理', 8, '花蓮縣光復鄉中正路 1 號', 23.668738, 121.421342,
        '戶外、需自備手套', '協助搬運與清理淤泥', '災後復原需要人力支援', '緊急', '上架',
        '陳志明', '038701234', '請穿防滑鞋'
      )
      returning id into helper_id;
    end if;
  end if;

  -- 日常留言（捐助者提問 + 機構回覆）
  if to_regclass('public.daily_comments') is not null and daily_id is not null then
    if not exists (
      select 1 from public.daily_comments
      where demand_id = daily_id
        and user_id::text = donor_uid
        and content = '請問平日下午兩點後可以收貨嗎？'
    ) then
      insert into public.daily_comments (
        demand_id, user_id, user_role, user_name, content, created_at, parent_comment_id, like_count
      ) values (
        daily_id, donor_uid::uuid, 'donor', '測試捐助者', '請問平日下午兩點後可以收貨嗎？',
        now() - interval '2 days', null, 1
      )
      returning id into comment_parent;

      insert into public.daily_comments (
        demand_id, user_id, user_role, user_name, content, created_at, parent_comment_id, like_count
      ) values (
        daily_id, agency_uid::uuid, 'agency', '示範社福機構', '可以，請提前半小時打電話給櫃檯。',
        now() - interval '1 day 20 hours', comment_parent, 0
      );
    end if;
  end if;

  if to_regclass('public.disaster_comments') is not null and disaster_id is not null then
    if not exists (
      select 1 from public.disaster_comments
      where demand_id = disaster_id and user_id::text = donor_uid
        and content = '清潔用具可以明天寄出，請問收件人寫哪個單位？'
    ) then
      insert into public.disaster_comments (
        demand_id, user_id, user_role, user_name, content, created_at, parent_comment_id, like_count
      ) values (
        disaster_id, donor_uid::uuid, 'donor', '測試捐助者',
        '清潔用具可以明天寄出，請問收件人寫哪個單位？',
        now() - interval '20 hours', null, 0
      );
    end if;
  end if;

  if to_regclass('public.volunteer_comments') is not null and helper_id is not null then
    if not exists (
      select 1 from public.volunteer_comments
      where demand_id = helper_id and user_id::text = donor_uid
        and content = '我週六上午可以到場，需要自己帶工具嗎？'
    ) then
      insert into public.volunteer_comments (
        demand_id, user_id, user_role, user_name, content, created_at, parent_comment_id, like_count
      ) values (
        helper_id, donor_uid::uuid, 'donor', '測試捐助者',
        '我週六上午可以到場，需要自己帶工具嗎？',
        now() - interval '12 hours', null, 0
      );
    end if;
  end if;

  -- 各階段日常捐助（掛在測試捐助者）
  insert into public.donor_daily_donations (
    id, demand_id, donor_uid, donor_name, phone, actual_material, quantity, donation_method,
    note, need_receipt, need_thank_you, thank_name_mode, thank_public,
    status, ai_decision, ai_reason, ai_checked_at,
    human_decision, human_reason, human_checked_at,
    logistics_carrier, tracking_no, tracking_uploaded_at,
    receipt_confirmed_at, receipt_partial, receipt_declined_video, receipt_note,
    donor_email, donor_id_no, receipt_title, receipt_lines, created_at
  )
  values
    (
      'a1111111-1111-4111-8111-111111111101', daily_id, donor_uid, '測試捐助者', '0912345678',
      '統一純水 600ml', 5, '寄送', '等待 AI 審核中', false, true, 'masked', true,
      'pending_ai_review', null, null, null, null, null, null,
      null, null, null, null, false, false, null,
      'dev.donor@example.com', null, null, null, now() - interval '1 hour'
    ),
    (
      'a1111111-1111-4111-8111-111111111102', daily_id, donor_uid, '測試捐助者', '0912345678',
      '悅氏礦泉水', 8, '寄送', 'AI 已通過，待機構審核', false, true, 'masked', true,
      'pending_human_review', 'accepted', '外觀完整，符合全新條件', now() - interval '6 hours',
      null, null, null, null, null, null, null, false, false, null,
      'dev.donor@example.com', null, null, null, now() - interval '8 hours'
    ),
    (
      'a1111111-1111-4111-8111-111111111103', daily_id, donor_uid, '測試捐助者', '0912345678',
      '台糖礦泉水', 10, '面交', '已通過，可安排面交／機構簽收', true, true, 'full', true,
      'human_approved', 'accepted', '符合需求', now() - interval '2 days',
      'accepted', '物資與數量都正確', now() - interval '1 day',
      null, null, null, null, false, false, null,
      'dev.donor@example.com', 'A123456789', '測試捐助者',
      '[{"name":"台糖礦泉水","quantity":10,"unit":"箱","estimatedPrice":200}]'::jsonb,
      now() - interval '3 days'
    ),
    (
      'a1111111-1111-4111-8111-111111111104', daily_id, donor_uid, '測試捐助者', '0912345678',
      '多喝水礦泉水', 12, '寄送', '已上傳物流，待機構簽收', true, true, 'masked', true,
      'human_approved', 'accepted', '符合需求', now() - interval '4 days',
      'accepted', '可寄送', now() - interval '3 days',
      '黑貓宅急便', 'DEMO76420001', now() - interval '2 days',
      null, false, false, null,
      'dev.donor@example.com', 'A123456789', '測試捐助者',
      '[{"name":"多喝水礦泉水","quantity":12,"unit":"箱","estimatedPrice":180}]'::jsonb,
      now() - interval '5 days'
    ),
    (
      'a1111111-1111-4111-8111-111111111105', daily_id, donor_uid, '測試捐助者', '0912345678',
      '波爾天然水', 6, '寄送', '機構已簽收完成', true, true, 'masked', true,
      'human_approved', 'accepted', '符合需求', now() - interval '10 days',
      'accepted', '可寄送', now() - interval '9 days',
      '中華郵政', 'DEMO76420002', now() - interval '8 days',
      now() - interval '6 days', false, false, '外箱完整',
      'dev.donor@example.com', 'A123456789', '測試捐助者',
      '[{"name":"波爾天然水","quantity":6,"unit":"箱","estimatedPrice":220}]'::jsonb,
      now() - interval '11 days'
    ),
    (
      'a1111111-1111-4111-8111-111111111106', daily_id, donor_uid, '測試捐助者', '0912345678',
      '過期飲用水', 2, '寄送', '機構不接受', false, false, 'masked', false,
      'human_rejected', 'rejected', '疑似保存期限不足', now() - interval '7 days',
      'rejected', '有效期限不符合機構要求', now() - interval '6 days',
      null, null, null, null, false, false, null,
      'dev.donor@example.com', null, null, null, now() - interval '8 days'
    ),
    (
      'a1111111-1111-4111-8111-111111111107', daily_id, company_uid, '測試愛心企業', '0987654321',
      '企業批量瓶裝水', 20, '寄送', '企業捐助，待上傳物流', true, true, 'full', true,
      'human_approved', 'accepted', '符合需求', now() - interval '2 days',
      'accepted', '感謝企業協助', now() - interval '1 day',
      null, null, null, null, false, false, null,
      'dev.company@example.com', '24567890', '測試愛心企業',
      '[{"name":"企業批量瓶裝水","quantity":20,"unit":"箱","estimatedPrice":160}]'::jsonb,
      now() - interval '3 days'
    )
  on conflict (id) do nothing;

  -- 已簽收那筆掛公開感謝（物流已上傳）
  if to_regclass('public.public_donation_thanks') is not null then
    insert into public.public_donation_thanks
      ("donorUid", "displayName", "honorific", "donationItem", "agencyName", "isPublic", "donationId", "publishedAt")
    select donor_uid, '測*者', '君', '波爾天然水 6 箱', '示範社福機構', true,
           'a1111111-1111-4111-8111-111111111105', now() - interval '6 days'
    where not exists (
      select 1 from public.public_donation_thanks
      where "donationId" = 'a1111111-1111-4111-8111-111111111105'
    );
  end if;

  -- 站內信：審核通知、機構往來
  if to_regclass('public.member_messages') is not null then
    if not exists (
      select 1 from public.member_messages
      where "recipientUid" = donor_uid
        and subject = '捐助審核結果：台糖礦泉水'
    ) then
      insert into public.member_messages (
        "recipientUid", "recipientName", "senderUid", "senderName",
        category, subject, content, "isRead", "createdAt"
      ) values
        (
          donor_uid, '測試捐助者', agency_uid, '示範社福機構',
          'DONATION', '捐助審核結果：台糖礦泉水',
          '您的面交捐助已通過。請依約定時間送達台北市大安區希望路 10 號。' || E'\n捐助編號：a1111111-1111-4111-8111-111111111103',
          false, now() - interval '1 day'
        ),
        (
          donor_uid, '測試捐助者', agency_uid, '示範社福機構',
          'DONATION', '捐助審核結果：過期飲用水',
          '很抱歉，這筆捐助因有效期限不符合需求而未通過。' || E'\n捐助編號：a1111111-1111-4111-8111-111111111106',
          true, now() - interval '6 days'
        ),
        (
          agency_uid, '示範社福機構', donor_uid, '測試捐助者',
          'AGENCY', '面交時間確認',
          '明天下午三點可以送到希望路，請問櫃檯方便嗎？',
          false, now() - interval '20 hours'
        ),
        (
          company_uid, '測試愛心企業', agency_uid, '示範社福機構',
          'DONATION', '企業捐助已通過',
          '企業批量瓶裝水已通過審核，請到捐助紀錄上傳物流單號。' || E'\n捐助編號：a1111111-1111-4111-8111-111111111107',
          false, now() - interval '1 day'
        );
    end if;
  end if;
end $$;

notify pgrst, 'reload schema';
