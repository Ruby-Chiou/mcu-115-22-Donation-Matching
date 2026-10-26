select kind, id
from (
  select 'disaster'::text as kind, id::text as id
  from public.agency_disaster_supply_items
  limit 1
) disaster
union all
select kind, id
from (
  select 'daily'::text as kind, id::text as id
  from public.agency_daily_supply_items
  limit 1
) daily;
