-- 電子收據改為實務欄位，並把加密 PDF 留在捐助者的收據資料裡。

alter table public.donor_receipts
  add column if not exists "donorEmail" text not null default '',
  add column if not exists "lineItems" jsonb not null default '[]'::jsonb,
  add column if not exists "handoverMethod" text not null default '',
  add column if not exists "completedOn" date,
  add column if not exists "pdfUrl" text not null default '',
  add column if not exists "pdfFileName" text not null default '';

do $$
begin
  if to_regclass('public.donor_daily_donations') is not null then
    alter table public.donor_daily_donations
      add column if not exists donor_email text,
      add column if not exists donor_id_no text,
      add column if not exists receipt_lines jsonb;
  end if;
end $$;

insert into storage.buckets ("id", "name", "public")
values ('donor-receipts', 'donor-receipts', true)
on conflict ("id") do nothing;

drop policy if exists "donor receipts read" on storage.objects;
create policy "donor receipts read" on storage.objects
  for select to anon, authenticated using (bucket_id = 'donor-receipts');

drop policy if exists "donor receipts write" on storage.objects;
create policy "donor receipts write" on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'donor-receipts');

drop policy if exists "donor receipts update" on storage.objects;
create policy "donor receipts update" on storage.objects
  for update to anon, authenticated using (bucket_id = 'donor-receipts');
