-- 示範資料去「測試」字眼，並確保首頁非常緊急輪播至少有 5 筆上架日常需求。

-- ========== 顯示名稱（導覽、跑馬燈、感謝牆）==========
update public.user_accounts
set display_name = case
  when display_name ilike '%測試愛心企業%' or display_name = '測試愛心企業' then '愛心企業股份有限公司'
  when display_name ilike '%測試個人捐助%' then '王美玲'
  when display_name ilike '%測試捐助%' then '陳志明'
  when display_name ilike '%測試受助%' then '希望家園社福協會'
  when display_name ilike '%測試%' then replace(display_name, '測試', '')
  else display_name
end
where display_name ilike '%測試%';

update public.donor_profiles
set
  "displayName" = case
    when coalesce("displayName", '') ilike '%測試愛心企業%' then '愛心企業股份有限公司'
    when coalesce("displayName", '') ilike '%測試個人捐助%' then '王美玲'
    when coalesce("displayName", '') ilike '%測試捐助%' then '陳志明'
    when coalesce("displayName", '') ilike '%測試%' then replace("displayName", '測試', '')
    else "displayName"
  end,
  "fullName" = case
    when coalesce("fullName", '') ilike '%測試愛心企業%' then '愛心企業股份有限公司'
    when coalesce("fullName", '') ilike '%測試個人捐助%' then '王美玲'
    when coalesce("fullName", '') ilike '%測試捐助%' then '陳志明'
    when coalesce("fullName", '') ilike '%測試%' then replace("fullName", '測試', '')
    else "fullName"
  end
where coalesce("displayName", '') ilike '%測試%'
   or coalesce("fullName", '') ilike '%測試%';

update public.agency_profiles
set
  "agencyName" = case
    when coalesce("agencyName", '') ilike '%測試%' then '希望家園社福協會'
    else coalesce(nullif(btrim("agencyName"), ''), '希望家園社福協會')
  end,
  "updatedAt" = now()
where coalesce("agencyName", '') ilike '%測試%';

-- 捐助紀錄／留言／公開感謝上的姓名
update public.donor_daily_donations
set donor_name = case
  when donor_name ilike '%測試愛心企業%' then '愛心企業股份有限公司'
  when donor_name ilike '%測試個人捐助%' then '王美玲'
  when donor_name ilike '%測試捐助%' then '陳志明'
  when donor_name ilike '%測試%' then replace(donor_name, '測試', '')
  else donor_name
end
where donor_name ilike '%測試%';

update public.public_donation_thanks
set "displayName" = case
  when coalesce("displayName", '') ilike '%測試愛心企業%' then '愛心企業股份有限公司'
  when coalesce("displayName", '') ilike '%測試個人捐助%' then '王美玲'
  when coalesce("displayName", '') ilike '%測試捐助%' then '陳志明'
  when coalesce("displayName", '') ilike '%測試%' then replace("displayName", '測試', '')
  else "displayName"
end
where coalesce("displayName", '') ilike '%測試%';

do $comments$
begin
  if to_regclass('public.daily_comments') is not null then
    execute $sql$
      update public.daily_comments
      set user_name = case
        when user_name ilike '%測試愛心企業%' then '愛心企業股份有限公司'
        when user_name ilike '%測試個人捐助%' then '王美玲'
        when user_name ilike '%測試捐助%' then '陳志明'
        when user_name ilike '%測試%' then replace(user_name, '測試', '')
        else user_name
      end
      where user_name ilike '%測試%'
    $sql$;
  end if;

  if to_regclass('public.disaster_comments') is not null then
    execute $sql$
      update public.disaster_comments
      set user_name = case
        when user_name ilike '%測試愛心企業%' then '愛心企業股份有限公司'
        when user_name ilike '%測試個人捐助%' then '王美玲'
        when user_name ilike '%測試捐助%' then '陳志明'
        when user_name ilike '%測試%' then replace(user_name, '測試', '')
        else user_name
      end
      where user_name ilike '%測試%'
    $sql$;
  end if;

  if to_regclass('public.volunteer_comments') is not null then
    execute $sql$
      update public.volunteer_comments
      set user_name = case
        when user_name ilike '%測試愛心企業%' then '愛心企業股份有限公司'
        when user_name ilike '%測試個人捐助%' then '王美玲'
        when user_name ilike '%測試捐助%' then '陳志明'
        when user_name ilike '%測試%' then replace(user_name, '測試', '')
        else user_name
      end
      where user_name ilike '%測試%'
    $sql$;
  end if;
end;
$comments$;

-- 需求文案去掉「測試／示範測試」口吻
update public.agency_daily_supply_items
set
  reason = replace(replace(coalesce(reason, ''), '以便測試分頁', '以利民眾瀏覽'), '測試', ''),
  description = replace(coalesce(description, ''), '測試', ''),
  note = replace(coalesce(note, ''), '測試', '')
where coalesce(reason, '') ilike '%測試%'
   or coalesce(description, '') ilike '%測試%'
   or coalesce(note, '') ilike '%測試%';

update public.agency_disaster_supply_items
set
  reason = replace(replace(coalesce(reason, ''), '方便測試', '方便瀏覽'), '測試', ''),
  description = replace(coalesce(description, ''), '測試', ''),
  note = replace(coalesce(note, ''), '測試', '')
where coalesce(reason, '') ilike '%測試%'
   or coalesce(description, '') ilike '%測試%'
   or coalesce(note, '') ilike '%測試%';

update public.agency_disaster_volunteer_items
set
  reason = replace(coalesce(reason, ''), '測試', ''),
  "workContent" = replace(coalesce("workContent", ''), '測試', ''),
  note = replace(coalesce(note, ''), '測試', '')
where coalesce(reason, '') ilike '%測試%'
   or coalesce("workContent", '') ilike '%測試%'
   or coalesce(note, '') ilike '%測試%';

-- ========== 至少 5 筆上架「非常緊急」日常需求（首頁輪播）==========
do $urgent$
declare
  listed int;
  need int;
  template public.agency_daily_supply_items%rowtype;
  i int;
  next_serial int;
  items text[] := array[
    '成人紙尿褲',
    '高蛋白營養奶粉',
    '氣墊床',
    '輪椅輔具',
    '血氧機',
    '拋棄式看護墊',
    '醫療口罩箱'
  ];
  categories text[] := array[
    '健康與照護用品',
    '食品與飲用水',
    '健康與照護用品',
    '健康與照護用品',
    '健康與照護用品',
    '健康與照護用品',
    '健康與照護用品'
  ];
begin
  select count(*) into listed
  from public.agency_daily_supply_items
  where status = '上架'
    and priority in ('非常緊急', 'P1');

  need := greatest(0, 5 - listed);
  if need = 0 then
    return;
  end if;

  select * into template
  from public.agency_daily_supply_items
  where status = '上架'
  order by id
  limit 1;

  if template.id is null then
    raise notice 'skip urgent insert: no template row';
    return;
  end if;

  select coalesce(max("serialNo"), 0) + 1 into next_serial
  from public.agency_daily_supply_items;

  for i in 1..need loop
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
      note, image, "imageFileNames"
    ) values (
      next_serial + i - 1,
      now() - ((i || ' hours')::interval),
      now() - (((i - 1) || ' hours')::interval),
      now() + interval '30 days',
      items[((i - 1) % array_length(items, 1)) + 1],
      20 + i * 4,
      12 + i * 2,
      coalesce(nullif(template.unit, ''), '件'),
      '急需物資',
      categories[((i - 1) % array_length(categories, 1)) + 1],
      '機構個案急需補充，懇請民眾協助捐贈。',
      '請提供可用期限充足、包裝完整的物資；可寄送或面交。',
      coalesce(template.brand, '不限品牌'),
      coalesce(template."serviceTargets", array['貧困','老人']::text[]),
      template."customServiceTargets",
      coalesce(template.conditions, array['全新:接受','二手:不接受']::text[]),
      template."customConditions",
      '非常緊急',
      '上架',
      null,
      coalesce(template."receiveMethod", array['寄送','面交']::text[]),
      coalesce(template.recipient, '希望家園社福協會'),
      coalesce(template.address, '台北市大安區希望路 10 號'),
      template.latitude,
      template.longitude,
      coalesce(template.phone, '0223456789'),
      coalesce(template."contactTimeWeekday", true),
      coalesce(template."contactTimeWeekend", true),
      coalesce(template."contactTimeMorning", true),
      coalesce(template."contactTimeAfternoon", true),
      coalesce(template."contactTimeEvening", false),
      '平日下午較方便收件',
      template.image,
      coalesce(template."imageFileNames", '[]'::json)
    );
  end loop;
end;
$urgent$;
