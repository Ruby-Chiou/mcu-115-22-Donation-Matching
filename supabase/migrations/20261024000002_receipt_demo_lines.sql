-- 補上示範收據的品項明細、單價與合計所需欄位。只填還是空白的假資料。

update public.donor_receipts
set
  "donorEmail" = case when "donorEmail" = '' then 'donor@example.com' else "donorEmail" end,
  "handoverMethod" = case when "handoverMethod" = '' then '寄送' else "handoverMethod" end,
  "completedOn" = coalesce("completedOn", "donationDate"),
  "lineItems" = '[{"name":"冬季衣物","quantity":20,"unit":"件","estimatedPrice":150}]'::jsonb
where "receiptNo" = 'RC-2026-0001'
  and ("lineItems" is null or "lineItems" = '[]'::jsonb);

update public.donor_receipts
set
  "donorEmail" = case when "donorEmail" = '' then 'donor@example.com' else "donorEmail" end,
  "handoverMethod" = case when "handoverMethod" = '' then '面交' else "handoverMethod" end,
  "completedOn" = coalesce("completedOn", "donationDate"),
  "lineItems" = '[{"name":"成人紙尿褲","quantity":10,"unit":"箱","estimatedPrice":450}]'::jsonb
where "receiptNo" = 'RC-2026-0002'
  and ("lineItems" is null or "lineItems" = '[]'::jsonb);

update public.donor_receipts
set
  "donorEmail" = case when "donorEmail" = '' then 'donor@example.com' else "donorEmail" end,
  "handoverMethod" = case when "handoverMethod" = '' then '寄送' else "handoverMethod" end,
  "completedOn" = coalesce("completedOn", "donationDate"),
  "lineItems" = '[{"name":"狗飼料","quantity":5,"unit":"公斤","estimatedPrice":160}]'::jsonb
where "receiptNo" = 'RC-2026-0003'
  and ("lineItems" is null or "lineItems" = '[]'::jsonb);

update public.donor_receipts
set
  "donorEmail" = case when "donorEmail" = '' then 'donor@example.com' else "donorEmail" end,
  "handoverMethod" = case when "handoverMethod" = '' then '面交' else "handoverMethod" end,
  "completedOn" = coalesce("completedOn", "donationDate"),
  "lineItems" = '[{"name":"橘子工坊洗衣精","quantity":3,"unit":"瓶","estimatedPrice":120}]'::jsonb
where "receiptNo" = 'RC-2026-0004'
  and ("lineItems" is null or "lineItems" = '[]'::jsonb);

update public.donor_receipts
set "completedOn" = "donationDate"
where "receiptNo" in ('RC-2026-0001', 'RC-2026-0002', 'RC-2026-0003', 'RC-2026-0004')
  and "completedOn" is distinct from "donationDate";
