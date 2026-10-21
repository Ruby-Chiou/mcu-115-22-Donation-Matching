-- 捐贈收據可附上社福機構大章、負責人小章

alter table public.donor_receipts
  add column if not exists "largeSealUrl" text not null default '',
  add column if not exists "smallSealUrl" text not null default '';
