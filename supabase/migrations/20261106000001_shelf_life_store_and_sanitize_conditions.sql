-- 1) 假資料／既有資料：毀損若被設成「接受」改為「不接受」
-- 2) 需求可勾選保質期、可指定超商門市
-- 3) 捐助紀錄保存製造日期／保存時長／保存期限

-- ---------------------------------------------------------------------------
-- Sanitize unreasonable 毀損:接受
-- ---------------------------------------------------------------------------
update public.agency_daily_supply_items
set conditions = array_replace(conditions, '毀損:接受', '毀損:不接受')
where conditions is not null
  and conditions @> array['毀損:接受']::text[];

-- disaster conditionDescription：字串內容含「毀損:接受」時改為不接受
do $$
begin
  if to_regclass('public.agency_disaster_supply_items') is null then
    return;
  end if;

  update public.agency_disaster_supply_items
  set "conditionDescription" = replace("conditionDescription"::text, '毀損:接受', '毀損:不接受')::jsonb
  where "conditionDescription"::text like '%毀損:接受%';
exception
  when others then
    -- 欄位型別若非 jsonb，略過；日常需求的 array_replace 已處理主要假資料
    null;
end;
$$;

-- 示範資料：耐用品／非食品明確標「毀損不接受」；食品維持過期不接受、二手不接受
update public.agency_daily_supply_items
set conditions = array['全新:接受', '二手:不接受', '過期:不接受', '毀損:不接受']
where item in ('瓶裝水', '即食泡麵箱', '罐裝罐頭組', '兒童維他命', '高蛋白營養奶粉', '嬰幼兒奶粉')
   or category = '食品與飲用水';

update public.agency_daily_supply_items
set conditions = array['全新:接受', '二手:接受', '有擦痕:接受', '毀損:不接受']
where item in ('冬季毛毯', '成人雨衣', '行動照明燈', '炊事鍋具組', '收納箱', '氣墊床', '輪椅輔具', '血氧機')
  and coalesce(category, '') <> '食品與飲用水';

-- ---------------------------------------------------------------------------
-- Demand: shelf life flag + convenience store set by agency
-- ---------------------------------------------------------------------------
alter table public.agency_daily_supply_items
  add column if not exists require_shelf_life boolean not null default false,
  add column if not exists logistics_store_chain text,
  add column if not exists logistics_store_name text,
  add column if not exists logistics_store_address text;

comment on column public.agency_daily_supply_items.require_shelf_life is
  '受助者勾選後，捐助者須填製造日期／保存時長／保存期限，且照片須可供 AI 辨識日期';
comment on column public.agency_daily_supply_items.logistics_store_chain is
  '受助者指定超商品牌（7-ELEVEN／全家）；空白表示未指定超商取貨門市';
comment on column public.agency_daily_supply_items.logistics_store_name is
  '受助者指定超商門市名稱';
comment on column public.agency_daily_supply_items.logistics_store_address is
  '受助者指定超商門市地址';

do $$
begin
  if to_regclass('public.agency_disaster_supply_items') is not null then
    alter table public.agency_disaster_supply_items
      add column if not exists require_shelf_life boolean not null default false;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Donation: donor-entered shelf-life fields
-- ---------------------------------------------------------------------------
alter table public.donor_daily_donations
  add column if not exists manufacture_date date,
  add column if not exists shelf_life_duration text,
  add column if not exists expiry_date date;

comment on column public.donor_daily_donations.manufacture_date is '製造日期（需求勾選保質期時必填）';
comment on column public.donor_daily_donations.shelf_life_duration is '保存時長，例如 12 個月';
comment on column public.donor_daily_donations.expiry_date is '保存期限／有效日期';

-- ---------------------------------------------------------------------------
-- Tracking upload: 若需求已指定門市，可用需求門市；否則仍由捐助者填
-- ---------------------------------------------------------------------------
create or replace function public.upload_donation_tracking(
  p_donation_id uuid,
  p_donor_uid text,
  p_tracking text,
  p_carrier text,
  p_store_name text default null,
  p_store_address text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_id uuid;
  store_name text := nullif(btrim(coalesce(p_store_name, '')), '');
  store_address text := nullif(btrim(coalesce(p_store_address, '')), '');
  demand_store_name text;
  demand_store_address text;
begin
  if p_tracking is null or btrim(p_tracking) = '' then
    raise exception '請輸入物流單號';
  end if;

  if p_carrier is null or btrim(p_carrier) not in ('黑貓宅急便', '7-ELEVEN', '全家', '中華郵政', '新竹物流', '嘉里大榮') then
    raise exception '請選擇物流公司';
  end if;

  if btrim(p_carrier) in ('7-ELEVEN', '全家') then
    select nullif(btrim(coalesce(d.logistics_store_name, '')), ''),
           nullif(btrim(coalesce(d.logistics_store_address, '')), '')
      into demand_store_name, demand_store_address
    from public.donor_daily_donations don
    join public.agency_daily_supply_items d on d.id = don.demand_id
    where don.id = p_donation_id;

    store_name := coalesce(store_name, demand_store_name);
    store_address := coalesce(store_address, demand_store_address);

    if store_name is null or store_address is null then
      raise exception '超商取件請填寫門市名稱與地址（或請受助機構先在需求指定門市）';
    end if;
  end if;

  update public.donor_daily_donations
  set tracking_no = btrim(p_tracking),
      logistics_carrier = btrim(p_carrier),
      logistics_store_name = case when btrim(p_carrier) in ('7-ELEVEN', '全家') then store_name else null end,
      logistics_store_address = case when btrim(p_carrier) in ('7-ELEVEN', '全家') then store_address else null end,
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
revoke all on function public.upload_donation_tracking(uuid, text, text, text, text, text) from public;
grant execute on function public.upload_donation_tracking(uuid, text, text, text, text, text) to anon, authenticated;
