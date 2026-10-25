-- 身分屏障前的示範會員 dev-donor-001，改掛到測試捐助者。
-- 收據、感謝狀、站內信、捐助歷史與個人資料上的電話、城市一併搬過去。

update public.donor_profiles as dst
set
  "phoneNumber" = coalesce(nullif(dst."phoneNumber", ''), src."phoneNumber"),
  "city" = coalesce(nullif(dst."city", ''), src."city"),
  "avatarUrl" = coalesce(nullif(dst."avatarUrl", ''), src."avatarUrl"),
  "updatedAt" = now()
from public.donor_profiles as src
where dst."uid" = '11111111-1111-4111-8111-111111111111'
  and src."uid" = 'dev-donor-001';

update public.member_notification_settings as dst
set
  "inAppSystem" = src."inAppSystem",
  "inAppAgency" = src."inAppAgency",
  "inAppDonation" = src."inAppDonation",
  "emailEnabled" = src."emailEnabled",
  "emailSystem" = src."emailSystem",
  "emailAgency" = src."emailAgency",
  "emailDonation" = src."emailDonation",
  "emailDigestMode" = src."emailDigestMode",
  "quietHoursEnabled" = src."quietHoursEnabled",
  "quietHoursStart" = src."quietHoursStart",
  "quietHoursEnd" = src."quietHoursEnd",
  "updatedAt" = now()
from public.member_notification_settings as src
where dst."uid" = '11111111-1111-4111-8111-111111111111'
  and src."uid" = 'dev-donor-001';

update public.donor_receipts
set
  "donorUid" = '11111111-1111-4111-8111-111111111111',
  "donorEmail" = 'dev.donor@example.com'
where "donorUid" = 'dev-donor-001';

update public.agency_uploaded_certificates
set "donorUid" = '11111111-1111-4111-8111-111111111111'
where "donorUid" = 'dev-donor-001';

update public.public_donation_thanks
set "donorUid" = '11111111-1111-4111-8111-111111111111'
where "donorUid" = 'dev-donor-001';

update public.member_messages
set "recipientUid" = '11111111-1111-4111-8111-111111111111'
where "recipientUid" = 'dev-donor-001';

update public.member_messages
set "senderUid" = '11111111-1111-4111-8111-111111111111'
where "senderUid" = 'dev-donor-001';

update public.donor_daily_donations
set donor_uid = '11111111-1111-4111-8111-111111111111'
where donor_uid = 'dev-donor-001';

delete from public.member_notification_settings
where "uid" = 'dev-donor-001';

delete from public.donor_profiles
where "uid" = 'dev-donor-001';
