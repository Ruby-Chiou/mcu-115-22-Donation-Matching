-- 機構核發收據／上傳感謝狀：以 donationId 對應日常捐助紀錄

alter table public.donor_receipts
  add column if not exists "donationId" text;

create index if not exists donor_receipts_donation_idx
  on public.donor_receipts ("donationId");

alter table public.agency_uploaded_certificates
  add column if not exists "donationId" text;

create index if not exists agency_uploaded_certificates_donation_idx
  on public.agency_uploaded_certificates ("donationId");
