-- 刷新示範上架資料：刪除未引用的下架假資料，並確保日常／災害物資／協力者各有 12 筆以上架中項目（超過捐助者列表分頁）。

-- ========== 日常物資 ==========
-- 先清未再被捐助引用的下架列留言，再刪需求本身
delete from public.daily_comments c
where exists (
  select 1
  from public.agency_daily_supply_items d
  where d.id = c.demand_id
    and d.status = '下架'
    and not exists (
      select 1 from public.donor_daily_donations x where x.demand_id = d.id
    )
);

delete from public.agency_daily_supply_items d
where d.status = '下架'
  and not exists (
    select 1 from public.donor_daily_donations x where x.demand_id = d.id
  );

-- 其餘非上架（含仍被引用的下架、隱藏）改回上架並延長下架日
update public.agency_daily_supply_items
set
  status = '上架',
  "offShelfReason" = null,
  "publishedAt" = coalesce("publishedAt", now() - interval '2 days'),
  "expectedOffShelfAt" = now() + interval '45 days'
where status is distinct from '上架';

-- 已上架但快到期／已過期的也延長
update public.agency_daily_supply_items
set "expectedOffShelfAt" = now() + interval '45 days'
where status = '上架'
  and (
    "expectedOffShelfAt" is null
    or "expectedOffShelfAt" < now() + interval '14 days'
  );

-- 若仍不足 12 筆上架，依範本補新列
do $daily$
declare
  listed int;
  need int;
  template public.agency_daily_supply_items%rowtype;
  i int;
  next_serial int;
  items text[] := array[
    '即食泡麵箱','罐裝罐頭組','兒童維他命','冬季毛毯','成人雨衣',
    '清潔手套組','嬰兒濕紙巾','行動照明燈','炊事鍋具組','收納箱'
  ];
  categories text[] := array[
    '食品與飲用水','食品與飲用水','醫療與照護用品','衣物與保暖用品','衣物與保暖用品',
    '清潔與衛生用品','嬰幼兒用品','防災與照明用品','生活與炊事用品','居住安置與修繕用品'
  ];
begin
  select count(*) into listed
  from public.agency_daily_supply_items
  where status = '上架';

  need := greatest(0, 12 - listed);
  if need = 0 then
    return;
  end if;

  select * into template
  from public.agency_daily_supply_items
  where status = '上架'
  order by id
  limit 1;

  if template.id is null then
    raise notice 'skip daily insert: no template row';
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
      now() - ((i || ' days')::interval),
      now() - (((i - 1) || ' days')::interval),
      now() + interval '50 days',
      items[((i - 1) % array_length(items, 1)) + 1],
      40 + i * 5,
      30 + i * 3,
      coalesce(nullif(template.unit, ''), '件'),
      '示範補充上架資料',
      categories[((i - 1) % array_length(categories, 1)) + 1],
      '示範需求：補充上架數量以便測試分頁',
      '此為示範資料，可接受常溫寄送或面交（依接收方式）。',
      coalesce(template.brand, '不限品牌'),
      coalesce(template."serviceTargets", array['貧困']::text[]),
      template."customServiceTargets",
      coalesce(template.conditions, array['全新:接受','二手:不接受']::text[]),
      template."customConditions",
      case when i % 3 = 0 then '非常緊急' when i % 2 = 0 then '緊急' else '普通' end,
      '上架',
      null,
      case (i % 3)
        when 0 then array['寄送']::text[]
        when 1 then array['寄送','面交']::text[]
        else array['面交']::text[]
      end,
      coalesce(template.recipient, '示範社福機構'),
      coalesce(template.address, '台北市大安區希望路 10 號'),
      template.latitude,
      template.longitude,
      coalesce(template.phone, '0223456789'),
      coalesce(template."contactTimeWeekday", true),
      coalesce(template."contactTimeWeekend", true),
      coalesce(template."contactTimeMorning", true),
      coalesce(template."contactTimeAfternoon", true),
      coalesce(template."contactTimeEvening", false),
      '示範補充資料',
      template.image,
      coalesce(template."imageFileNames", '[]'::json)
    );
  end loop;
end;
$daily$;

-- ========== 災害物資 ==========
delete from public.disaster_comments c
where exists (
  select 1
  from public.agency_disaster_supply_items d
  where d.id = c.demand_id and d.status = '下架'
);

delete from public.agency_disaster_supply_items
where status = '下架';

update public.agency_disaster_supply_items
set
  status = '上架',
  "publishedAt" = coalesce("publishedAt", now() - interval '2 days'),
  "expectedOffShelfAt" = now() + interval '40 days'
where status is distinct from '上架';

update public.agency_disaster_supply_items
set "expectedOffShelfAt" = now() + interval '40 days'
where status = '上架'
  and (
    "expectedOffShelfAt" is null
    or "expectedOffShelfAt" < now() + interval '14 days'
  );

do $disaster$
declare
  listed int;
  need int;
  template public.agency_disaster_supply_items%rowtype;
  i int;
  next_serial int;
  items text[] := array[
    '瓶裝水箱','乾糧口糧包','雨衣雨鞋組','睡袋','急救耗材補充包',
    '消毒酒精箱','嬰幼兒奶粉','手電筒電池組','瓦斯罐','防水帆布'
  ];
  categories text[] := array[
    '食品與飲用水','食品與飲用水','衣物與保暖用品','居住安置與修繕用品','醫療與照護用品',
    '清潔與衛生用品','嬰幼兒用品','防災與照明用品','生活與炊事用品','居住安置與修繕用品'
  ];
begin
  select count(*) into listed
  from public.agency_disaster_supply_items
  where status = '上架';

  need := greatest(0, 12 - listed);
  if need = 0 then
    return;
  end if;

  select * into template
  from public.agency_disaster_supply_items
  where status = '上架'
  order by id
  limit 1;

  if template.id is null then
    raise notice 'skip disaster insert: no template row';
    return;
  end if;

  select coalesce(max("serialNo"), 0) + 1 into next_serial
  from public.agency_disaster_supply_items;

  for i in 1..need loop
    insert into public.agency_disaster_supply_items (
      "serialNo", created_at, "publishedAt", "expectedOffShelfAt",
      item, amount, remaining, unit, "amountDescription", category,
      reason, description, brand, image, "imageFileNames",
      "conditionDescription", priority, status,
      address, phone, latitude, longitude,
      "contactTimeDifferent",
      "contactTimeMorning", "contactTimeAfternoon", "contactTimeEvening",
      "weekdayMorning", "weekdayAfternoon", "weekdayEvening",
      "weekendMorning", "weekendAfternoon", "weekendEvening",
      note, "offShelfReason"
    )
    select
      next_serial + i - 1,
      now() - ((i || ' days')::interval),
      now() - (((i - 1) || ' days')::interval),
      now() + interval '35 days',
      items[((i - 1) % array_length(items, 1)) + 1],
      50 + i * 4,
      35 + i * 2,
      coalesce(nullif(template.unit, ''), '組'),
      '示範災害物資',
      categories[((i - 1) % array_length(categories, 1)) + 1],
      '示範災後整備需求',
      '示範資料，方便測試災害物資列表分頁。',
      coalesce(template.brand, '不限品牌'),
      coalesce(template.image, '[]'::jsonb),
      coalesce(template."imageFileNames", '[]'::jsonb),
      coalesce(template."conditionDescription", '{}'::jsonb),
      case when i % 3 = 0 then '非常緊急' when i % 2 = 0 then '緊急' else '普通' end,
      '上架',
      coalesce(template.address, '花蓮縣光復鄉中正路 1 號'),
      coalesce(template.phone, '038701234'),
      template.latitude,
      template.longitude,
      coalesce(template."contactTimeDifferent", false),
      true, true, false,
      coalesce(template."weekdayMorning", false),
      coalesce(template."weekdayAfternoon", false),
      coalesce(template."weekdayEvening", false),
      coalesce(template."weekendMorning", false),
      coalesce(template."weekendAfternoon", false),
      coalesce(template."weekendEvening", false),
      '示範補充資料',
      null;
  end loop;
end;
$disaster$;

-- ========== 災害協力者 ==========
delete from public.volunteer_comments c
where exists (
  select 1
  from public.agency_disaster_volunteer_items d
  where d.id = c.demand_id and d.status = '下架'
);

delete from public.agency_disaster_volunteer_items
where status = '下架';

update public.agency_disaster_volunteer_items
set
  status = '上架',
  "publishedAt" = coalesce("publishedAt", now() - interval '1 day'),
  "offShelfAt" = now() + interval '30 days'
where status is distinct from '上架';

update public.agency_disaster_volunteer_items
set "offShelfAt" = now() + interval '30 days'
where status = '上架'
  and (
    "offShelfAt" is null
    or "offShelfAt" < now() + interval '14 days'
  );

do $helper$
declare
  listed int;
  need int;
  template public.agency_disaster_volunteer_items%rowtype;
  i int;
  next_serial int;
  types text[] := array[
    '環境清潔','物資搬運','餐食協助','關懷訪視','文書行政',
    '交通接送','場地整備','物資分類','陪同就醫','夜間輪值'
  ];
begin
  select count(*) into listed
  from public.agency_disaster_volunteer_items
  where status = '上架';

  need := greatest(0, 12 - listed);
  if need = 0 then
    return;
  end if;

  select * into template
  from public.agency_disaster_volunteer_items
  where status = '上架'
  order by id
  limit 1;

  if template.id is null then
    raise notice 'skip helper insert: no template row';
    return;
  end if;

  select coalesce(max("serialNo"), 0) + 1 into next_serial
  from public.agency_disaster_volunteer_items;

  for i in 1..need loop
    insert into public.agency_disaster_volunteer_items (
      "serialNo", "createdAt", "publishedAt", "offShelfAt",
      type, people, location, latitude, longitude,
      condition, "workContent", reason, priority, status,
      contact, phone, note
    ) values (
      next_serial + i - 1,
      now() - ((i || ' days')::interval),
      now() - (((i - 1) || ' days')::interval),
      now() + interval '28 days',
      types[((i - 1) % array_length(types, 1)) + 1],
      4 + (i % 6),
      coalesce(template.location, '花蓮縣光復鄉中正路 1 號'),
      template.latitude,
      template.longitude,
      coalesce(template.condition, '戶外、需自備手套'),
      '示範協力工作內容：協助現場整備與支援。',
      '示範協力需求，用於測試列表分頁。',
      case when i % 3 = 0 then '非常緊急' when i % 2 = 0 then '緊急' else '普通' end,
      '上架',
      coalesce(template.contact, '陳志明'),
      coalesce(template.phone, '038701234'),
      '示範補充資料'
    );
  end loop;
end;
$helper$;
