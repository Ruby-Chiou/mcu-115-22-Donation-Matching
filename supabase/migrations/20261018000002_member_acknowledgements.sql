-- 捐贈回饋：收據、機構上傳感謝狀、公開感謝

drop table if exists public.donor_certificates;

create table if not exists public.donor_receipts (
  "id"            bigint generated always as identity primary key,
  "receiptNo"     text not null unique,
  "donorUid"      text not null,
  "donorName"     text not null default '',
  "receiptTitle"  text not null default '',
  "agencyName"    text not null,
  "donationItem"  text not null,
  "donationDate"  date not null,
  "issuedAt"      timestamptz not null default now()
);

create index if not exists donor_receipts_donor_idx
  on public.donor_receipts ("donorUid", "issuedAt" desc);

create table if not exists public.agency_uploaded_certificates (
  "id"            bigint generated always as identity primary key,
  "donorUid"      text not null,
  "agencyName"    text not null,
  "donationItem"  text not null default '',
  "donationDate"  date,
  "fileUrl"       text not null,
  "fileName"      text not null default '',
  "mimeType"      text not null default 'application/pdf',
  "note"          text not null default '',
  "uploadedAt"    timestamptz not null default now()
);

create index if not exists agency_uploaded_certificates_donor_idx
  on public.agency_uploaded_certificates ("donorUid", "uploadedAt" desc);

create table if not exists public.public_donation_thanks (
  "id"            bigint generated always as identity primary key,
  "donorUid"      text not null,
  "displayName"   text not null,
  "honorific"     text not null default '',
  "donationItem"  text not null,
  "agencyName"    text not null,
  "isPublic"      boolean not null default true,
  "publishedAt"   timestamptz not null default now()
);

create index if not exists public_donation_thanks_donor_idx
  on public.public_donation_thanks ("donorUid", "publishedAt" desc);

create index if not exists public_donation_thanks_wall_idx
  on public.public_donation_thanks ("isPublic", "publishedAt" desc);

grant select, insert, update, delete on public.donor_receipts to anon, authenticated;
grant select, insert, update, delete on public.agency_uploaded_certificates to anon, authenticated;
grant select, insert, update, delete on public.public_donation_thanks to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

alter table public.donor_receipts enable row level security;
alter table public.agency_uploaded_certificates enable row level security;
alter table public.public_donation_thanks enable row level security;

drop policy if exists "dev full access" on public.donor_receipts;
create policy "dev full access" on public.donor_receipts
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "dev full access" on public.agency_uploaded_certificates;
create policy "dev full access" on public.agency_uploaded_certificates
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "dev full access" on public.public_donation_thanks;
create policy "dev full access" on public.public_donation_thanks
  for all to anon, authenticated using (true) with check (true);

insert into storage.buckets ("id", "name", "public")
values ('agency-certificates', 'agency-certificates', true)
on conflict ("id") do nothing;

drop policy if exists "agency certificates read" on storage.objects;
create policy "agency certificates read" on storage.objects
  for select to anon, authenticated using (bucket_id = 'agency-certificates');

drop policy if exists "agency certificates write" on storage.objects;
create policy "agency certificates write" on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'agency-certificates');

drop policy if exists "agency certificates update" on storage.objects;
create policy "agency certificates update" on storage.objects
  for update to anon, authenticated using (bucket_id = 'agency-certificates');
