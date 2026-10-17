-- 選用：開發用種子資料（db push --include-seed 或本地 db reset 才會套用）
-- 感謝狀 fileUrl 請指向本專案 Storage 公開路徑

insert into public.donor_profiles
  ("uid", "email", "displayName", "accountName", "fullName", "phoneNumber", "city", "loginProvider", "accountStatus")
values
  ('dev-donor-001', 'donor@example.com', '測試捐助者', 'demo_donor', '測試捐助者', '0912345678', '台北市', 'email', 'ACTIVE')
on conflict ("uid") do nothing;

insert into public.member_notification_settings ("uid")
values ('dev-donor-001')
on conflict ("uid") do nothing;

insert into public.donor_receipts
  ("receiptNo", "donorUid", "donorName", "receiptTitle", "agencyName", "donationItem", "donationDate")
values
  ('RC-2026-0001', 'dev-donor-001', '測試捐助者', '測試捐助者', '陽光兒童之家', '冬季衣物 20 件', '2026-10-01'),
  ('RC-2026-0002', 'dev-donor-001', '測試捐助者', '測試捐助者', '長青關懷協會', '成人紙尿褲 10 箱', '2026-09-15')
on conflict ("receiptNo") do nothing;

insert into public.public_donation_thanks
  ("donorUid", "displayName", "honorific", "donationItem", "agencyName", "isPublic")
select 'dev-donor-001', '測*者', '君', '冬季衣物 20 件', '陽光兒童之家', true
where not exists (
  select 1 from public.public_donation_thanks
  where "donorUid" = 'dev-donor-001' and "donationItem" = '冬季衣物 20 件' and "agencyName" = '陽光兒童之家'
);
