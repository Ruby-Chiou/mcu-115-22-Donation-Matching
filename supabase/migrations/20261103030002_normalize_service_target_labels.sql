-- 把資料庫需求對象用語對齊編輯表單勾選項（長者→老人、身心障礙→身障）

update public.agency_daily_supply_items
set "serviceTargets" = (
  select coalesce(array_agg(distinct mapped order by mapped), array[]::text[])
  from (
    select case btrim(t)
      when '長者' then '老人'
      when '長輩' then '老人'
      when '身心障礙' then '身障'
      when '障礙' then '身障'
      when '兒童' then '孩童'
      when '嬰兒' then '嬰幼兒'
      when '幼兒' then '嬰幼兒'
      when '街友' then '無家者'
      when '弱勢' then '貧困'
      when '重症' then '重症照護'
      else btrim(t)
    end as mapped
    from unnest(coalesce("serviceTargets", array[]::text[])) as t
    where btrim(coalesce(t, '')) <> ''
  ) q
)
where exists (
  select 1
  from unnest(coalesce("serviceTargets", array[]::text[])) as t
  where btrim(t) in ('長者', '長輩', '身心障礙', '障礙', '兒童', '嬰兒', '幼兒', '街友', '弱勢', '重症')
);
