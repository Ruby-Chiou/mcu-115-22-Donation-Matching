-- 新增嘉里物流，且機構確認簽收後不再允許修改物流資料。

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
begin
  if p_tracking is null or btrim(p_tracking) = '' then
    raise exception '請輸入物流單號';
  end if;

  if p_carrier is null or btrim(p_carrier) not in ('黑貓宅急便', '7-ELEVEN', '全家', '中華郵政', '新竹物流', '嘉里物流') then
    raise exception '請選擇物流公司';
  end if;

  if btrim(p_carrier) in ('7-ELEVEN', '全家') and (store_name is null or store_address is null) then
    raise exception '超商取件請填寫門市名稱與地址';
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
    and receipt_confirmed_at is null
  returning id into updated_id;

  if updated_id is null then
    raise exception '只有尚未確認簽收的審核通過寄送捐助可以上傳物流資料';
  end if;
end;
$$;

revoke all on function public.upload_donation_tracking(uuid, text, text, text) from public;
revoke all on function public.upload_donation_tracking(uuid, text, text, text, text, text) from public;
grant execute on function public.upload_donation_tracking(uuid, text, text, text, text, text) to anon, authenticated;
