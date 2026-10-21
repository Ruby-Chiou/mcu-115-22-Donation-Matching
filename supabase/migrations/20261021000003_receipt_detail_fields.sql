-- 捐贈收據補上範例格式需要的明細欄位

alter table public.donor_receipts
  add column if not exists "agencyNameEn" text not null default '',
  add column if not exists "orgTaxId" text not null default '',
  add column if not exists "approvalNo" text not null default '',
  add column if not exists "donorIdNo" text not null default '',
  add column if not exists "donorAddress" text not null default '',
  add column if not exists "donorPhone" text not null default '',
  add column if not exists "note" text not null default '',
  add column if not exists "accountName" text not null default '',
  add column if not exists "postalAccount" text not null default '',
  add column if not exists "orgPhone" text not null default '',
  add column if not exists "orgFax" text not null default '',
  add column if not exists "orgEmail" text not null default '',
  add column if not exists "orgAddress" text not null default '',
  add column if not exists "handlerName" text not null default '';
