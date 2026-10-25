-- 選用：開發用種子資料（db push --include-seed 或本地 db reset 才會套用）
-- 感謝狀 fileUrl 請指向本專案 Storage 公開路徑

insert into public.donor_profiles
  ("uid", "email", "displayName", "accountName", "fullName", "phoneNumber", "city", "loginProvider", "accountStatus")
values
  ('11111111-1111-4111-8111-111111111111', 'dev.donor@example.com', '測試捐助者', 'demo_donor', '測試捐助者', '0912345678', '台北市', 'email', 'ACTIVE')
on conflict ("uid") do nothing;

insert into public.member_notification_settings ("uid")
values ('11111111-1111-4111-8111-111111111111')
on conflict ("uid") do nothing;

insert into public.donor_receipts
  (
    "receiptNo", "donorUid", "donorName", "receiptTitle", "agencyName", "donationItem", "donationDate",
    "agencyNameEn", "orgTaxId", "approvalNo", "donorIdNo", "donorAddress", "donorPhone", "note",
    "accountName", "postalAccount", "orgPhone", "orgFax", "orgEmail", "orgAddress", "handlerName",
    "donorEmail", "handoverMethod", "completedOn", "lineItems"
  )
values
  (
    'RC-2026-0001', '11111111-1111-4111-8111-111111111111', '測試捐助者', '測試捐助者', '陽光兒童之家', '冬季衣物 20 件', '2026-10-01',
    'Sunshine Children Home', '87654321', '衛部救字第1150001234號', 'A123456789', '台北市中正區示範路1號', '0912345678', '冬季衣物，供安置使用',
    '陽光兒童之家', '12345678', '02-2345-6789', '02-2345-6790', 'sunshine@example.org', '台北市大安區希望路10號', '林小安',
    'dev.donor@example.com', '寄送', '2026-10-01',
    '[{"name":"冬季衣物","quantity":20,"unit":"件","estimatedPrice":150}]'::jsonb
  ),
  (
    'RC-2026-0002', '11111111-1111-4111-8111-111111111111', '測試捐助者', '測試捐助者', '長青關懷協會', '成人紙尿褲 10 箱', '2026-09-15',
    'Evergreen Care Association', '11223344', '衛部救字第1140005678號', 'A123456789', '台北市中正區示範路1號', '0912345678', '成人紙尿褲，供長照使用',
    '長青關懷協會', '87654321', '02-8765-4321', '02-8765-4322', 'evergreen@example.org', '新北市板橋區長青街20號', '陳志明',
    'dev.donor@example.com', '面交', '2026-09-15',
    '[{"name":"成人紙尿褲","quantity":10,"unit":"箱","estimatedPrice":450}]'::jsonb
  )
on conflict ("receiptNo") do nothing;

insert into public.public_donation_thanks
  ("donorUid", "displayName", "honorific", "donationItem", "agencyName", "isPublic")
select '11111111-1111-4111-8111-111111111111', '測*者', '君', '冬季衣物 20 件', '陽光兒童之家', true
where not exists (
  select 1 from public.public_donation_thanks
  where "donorUid" = '11111111-1111-4111-8111-111111111111' and "donationItem" = '冬季衣物 20 件' and "agencyName" = '陽光兒童之家'
);

-- 將示範電話的既有日常捐助掛到測試會員，方便開發期查看歷史
update public.donor_daily_donations
set donor_uid = '11111111-1111-4111-8111-111111111111'
where (donor_uid is null or donor_uid = '')
  and phone = '0912345678';
