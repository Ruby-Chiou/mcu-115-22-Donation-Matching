-- 留言名片只公開縣市與個人／企業，不放出電話、信箱與身分證。
-- 受助者名片沿用既有公開欄位，並補上 uid 才能從留言對到機構。

create or replace view public.donor_public_cards
with (security_invoker = false) as
select
  p.uid,
  nullif(trim(p.city), '') as city,
  a.donor_kind
from public.donor_profiles p
join public.user_accounts a on a.user_id::text = p.uid
where a.role = 'donor'
  and p."accountStatus" = 'ACTIVE';

comment on view public.donor_public_cards is
  '留言區可看的捐助者名片：所在縣市與個人或企業。不含電話、信箱與姓名。';

revoke all on public.donor_public_cards from public;
grant select on public.donor_public_cards to anon, authenticated;

drop view if exists public.agency_public_profiles;
create view public.agency_public_profiles
with (security_invoker = false) as
select
  uid,
  "agencyName",
  city,
  image,
  "introImages",
  "establishedYear",
  "registrationLabel",
  "serviceArea",
  "serviceTargets",
  "contactPhone",
  mission,
  background,
  "verificationStatus"
from public.agency_profiles
where "accountStatus" = 'ACTIVE'
  and "verificationStatus" = 'approved';

revoke all on public.agency_public_profiles from public;
grant select on public.agency_public_profiles to anon, authenticated;
