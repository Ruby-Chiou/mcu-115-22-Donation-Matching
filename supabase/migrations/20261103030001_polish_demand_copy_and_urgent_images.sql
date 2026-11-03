-- 清掉需求明細裡不正式的示範文案（測試聯絡人、自定義對象A7、專案補助戶…），
-- 並為非常緊急物資換上與品項相符的圖片。

-- ========== 日常物資：聯絡人 ==========
update public.agency_daily_supply_items
set recipient = (array['王雅婷', '陳志明', '林小安', '黃美惠', '張家豪', '李淑芬', '吳佳玲', '蔡宗憲'])[
  1 + ((coalesce(id, 0) - 1) % 8)
]
where coalesce(recipient, '') ~* '(測試|示範聯絡|聯絡人[0-9]|Recipient|contact)';

-- ========== 日常物資：需求對象（去重、去掉示範自訂字）==========
update public.agency_daily_supply_items d
set "serviceTargets" = cleaned.targets
from (
  select
    s.id,
    coalesce(
      nullif(
        (
          select array_agg(x order by x)
          from (
            select distinct btrim(t) as x
            from unnest(coalesce(s."serviceTargets", array[]::text[])) as t
            where btrim(coalesce(t, '')) <> ''
              and btrim(t) !~* '(測試|自定義|補助戶|對象A|對象B|demo)'
          ) q
        ),
        array[]::text[]
      ),
      array['老人', '身障']::text[]
    ) as targets
  from public.agency_daily_supply_items s
) cleaned
where d.id = cleaned.id
  and (
    exists (
      select 1
      from unnest(coalesce(d."serviceTargets", array[]::text[])) as t
      where btrim(coalesce(t, '')) ~* '(測試|自定義|補助戶|對象A|對象B)'
    )
    or (
      select count(*) from unnest(coalesce(d."serviceTargets", array[]::text[])) u
      where btrim(coalesce(u, '')) <> ''
    ) <> (
      select count(distinct btrim(u)) from unnest(coalesce(d."serviceTargets", array[]::text[])) u
      where btrim(coalesce(u, '')) <> ''
    )
    or coalesce(cardinality(d."serviceTargets"), 0) = 0
  );

-- 清掉自訂需求對象裡的示範字（相容 json / jsonb / json[]）
do $custom_targets$
declare
  data_type text;
begin
  select c.data_type into data_type
  from information_schema.columns c
  where c.table_schema = 'public'
    and c.table_name = 'agency_daily_supply_items'
    and c.column_name = 'customServiceTargets';

  if data_type is null then
    return;
  end if;

  if data_type = 'ARRAY' then
    execute $sql$
      update public.agency_daily_supply_items
      set "customServiceTargets" = '{}'::json[]
      where coalesce("customServiceTargets"::text, '') ~* '(測試|自定義|補助戶|對象A|對象B|專案補助)'
    $sql$;
  else
    execute format($sql$
      update public.agency_daily_supply_items
      set "customServiceTargets" = %s
      where coalesce("customServiceTargets"::text, '') ~* '(測試|自定義|補助戶|對象A|對象B|專案補助)'
    $sql$, case when data_type = 'jsonb' then '''[]''::jsonb' else '''[]''::json' end);
  end if;
end;
$custom_targets$;

-- 文案去「測試／示範」
update public.agency_daily_supply_items
set
  reason = nullif(btrim(regexp_replace(coalesce(reason, ''), '(測試|示範補充上架資料|示範需求：?)', '', 'g')), ''),
  description = nullif(btrim(regexp_replace(coalesce(description, ''), '測試', '', 'g')), ''),
  note = nullif(btrim(regexp_replace(coalesce(note, ''), '測試', '', 'g')), ''),
  "amountDescription" = case
    when coalesce("amountDescription", '') ~* '測試|示範' then '依機構實際需求'
    else "amountDescription"
  end,
  brand = case
    when coalesce(brand, '') ~* '測試' then '不限品牌'
    else brand
  end
where coalesce(reason, '') ~* '測試|示範'
   or coalesce(description, '') ~* '測試'
   or coalesce(note, '') ~* '測試'
   or coalesce("amountDescription", '') ~* '測試|示範'
   or coalesce(brand, '') ~* '測試';

update public.agency_disaster_supply_items
set
  reason = nullif(btrim(regexp_replace(coalesce(reason, ''), '測試', '', 'g')), ''),
  description = nullif(btrim(regexp_replace(coalesce(description, ''), '測試', '', 'g')), ''),
  note = nullif(btrim(regexp_replace(coalesce(note, ''), '測試', '', 'g')), '')
where coalesce(reason, '') ilike '%測試%'
   or coalesce(description, '') ilike '%測試%'
   or coalesce(note, '') ilike '%測試%';

update public.agency_disaster_volunteer_items
set
  contact = case
    when coalesce(contact, '') ~* '(測試|聯絡人[0-9])' then
      (array['陳志明', '林小安', '黃美惠', '王雅婷', '張家豪'])[
        1 + ((coalesce(id, 0) - 1) % 5)
      ]
    else contact
  end,
  reason = nullif(btrim(regexp_replace(coalesce(reason, ''), '測試', '', 'g')), ''),
  "workContent" = nullif(btrim(regexp_replace(coalesce("workContent", ''), '(測試|示範協力工作內容：?)', '', 'g')), ''),
  note = nullif(btrim(regexp_replace(coalesce(note, ''), '(測試|示範補充資料)', '', 'g')), '')
where coalesce(contact, '') ~* '(測試|聯絡人[0-9])'
   or coalesce(reason, '') ilike '%測試%'
   or coalesce("workContent", '') ~* '測試|示範'
   or coalesce(note, '') ~* '測試|示範';

-- ========== 非常緊急物資：相符圖片（依欄位型別逐筆更新，避免 CASE 型別衝突）==========
do $urgent_images$
declare
  image_udt text;
  names_udt text;
  custom_udt text;
  custom_empty text;
  rec record;
  img_sql text;
  names_sql text;
begin
  select c.udt_name into image_udt
  from information_schema.columns c
  where c.table_schema = 'public'
    and c.table_name = 'agency_daily_supply_items'
    and c.column_name = 'image';

  select c.udt_name into names_udt
  from information_schema.columns c
  where c.table_schema = 'public'
    and c.table_name = 'agency_daily_supply_items'
    and c.column_name = 'imageFileNames';

  select c.udt_name into custom_udt
  from information_schema.columns c
  where c.table_schema = 'public'
    and c.table_name = 'agency_daily_supply_items'
    and c.column_name = 'customServiceTargets';

  custom_empty := case custom_udt
    when '_json' then '''{}''::json[]'
    when '_jsonb' then '''{}''::jsonb[]'
    when 'jsonb' then '''[]''::jsonb'
    else '''[]''::json'
  end;

  for rec in
    select *
    from (
      values
        ('成人紙尿褲', 'https://images.unsplash.com/photo-1576765608866-5b51046452a7?auto=format&fit=crop&w=900&q=80', 'adult-care.jpg'),
        ('高蛋白營養奶粉', 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=900&q=80', 'nutrition-milk.jpg'),
        ('氣墊床', 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=900&q=80', 'air-mattress.jpg'),
        ('輪椅輔具', 'https://images.unsplash.com/photo-1565615833231-e8c91a38a012?auto=format&fit=crop&w=900&q=80', 'wheelchair.jpg'),
        ('血氧機', 'https://images.pexels.com/photos/8376321/pexels-photo-8376321.jpeg?auto=compress&cs=tinysrgb&w=900', 'pulse-oximeter.jpg'),
        ('拋棄式看護墊', 'https://images.unsplash.com/photo-1581594693700-5bb7ff4b0c4a?auto=format&fit=crop&w=900&q=80', 'care-pad.jpg'),
        ('醫療口罩箱', 'https://images.unsplash.com/photo-1584634736454-add5500c54c1?auto=format&fit=crop&w=900&q=80', 'masks.jpg')
    ) as t(item, url, file_name)
  loop
    img_sql := case image_udt
      when '_text' then format('array[%L]::text[]', rec.url)
      when '_varchar' then format('array[%L]::text[]', rec.url)
      when '_jsonb' then format('array[to_jsonb(%L::text)]::jsonb[]', rec.url)
      when '_json' then format('array[to_json(%L::text)]::json[]', rec.url)
      when 'jsonb' then format('jsonb_build_array(%L)', rec.url)
      else format('json_build_array(%L)', rec.url)
    end;

    names_sql := case names_udt
      when '_text' then format('array[%L]::text[]', rec.file_name)
      when '_varchar' then format('array[%L]::text[]', rec.file_name)
      when '_jsonb' then format('array[to_jsonb(%L::text)]::jsonb[]', rec.file_name)
      when '_json' then format('array[to_json(%L::text)]::json[]', rec.file_name)
      when 'jsonb' then format('jsonb_build_array(%L)', rec.file_name)
      else format('json_build_array(%L)', rec.file_name)
    end;

    execute format($sql$
      update public.agency_daily_supply_items
      set
        image = %s,
        "imageFileNames" = %s,
        recipient = case
          when coalesce(recipient, '') ~* '(測試|聯絡人[0-9]|示範)' then '王雅婷'
          else recipient
        end,
        "serviceTargets" = array['老人', '身障']::text[],
        "customServiceTargets" = %s,
        reason = coalesce(nullif(btrim(reason), ''), '機構個案急需補充，懇請民眾協助捐贈。'),
        description = coalesce(
          nullif(btrim(description), ''),
          '請提供可用期限充足、包裝完整的物資；可寄送或面交。'
        )
      where status = '上架'
        and priority in ('非常緊急', 'P1')
        and item = %L
    $sql$, img_sql, names_sql, custom_empty, rec.item);
  end loop;
end;
$urgent_images$;
