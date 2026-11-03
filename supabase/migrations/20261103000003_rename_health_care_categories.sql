update public.agency_daily_supply_items
set category = '健康與照護用品'
where category = '醫療與照護用品';

update public.agency_disaster_supply_items
set category = '健康與照護用品'
where category = '醫療與照護用品';

update public.agency_disaster_volunteer_items
set type = '健康照護'
where type = '醫療照護';
