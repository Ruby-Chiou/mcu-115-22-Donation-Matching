-- 公開感謝對應日常捐助，並把已通過的捐助補上感謝牆

alter table public.public_donation_thanks
  add column if not exists "donationId" text;

create unique index if not exists public_donation_thanks_donation_uidx
  on public.public_donation_thanks ("donationId")
  where "donationId" is not null;

insert into public.public_donation_thanks (
  "donorUid",
  "displayName",
  "honorific",
  "donationItem",
  "agencyName",
  "isPublic",
  "donationId",
  "publishedAt"
)
select distinct on (d.id)
  d.donor_uid,
  case
    when d.donor_name is null or btrim(d.donor_name) = '' then '匿名'
    when char_length(btrim(d.donor_name)) <= 2 then left(btrim(d.donor_name), 1) || '*'
    else left(btrim(d.donor_name), 1) || '*' || right(btrim(d.donor_name), 1)
  end,
  '',
  coalesce(
    nullif(btrim(regexp_replace(coalesce(d.actual_material, ''), '（尚未[^）]*）', '', 'g')), ''),
    '捐贈物資'
  ),
  coalesce(nullif(btrim(r."agencyName"), ''), '示範社福機構'),
  true,
  d.id::text,
  coalesce(d.human_checked_at, now())
from public.donor_daily_donations d
left join public.donor_receipts r on r."donationId" = d.id::text
where d.status = 'human_approved'
  and d.donor_uid is not null
  and btrim(d.donor_uid) <> ''
  and not exists (
    select 1
    from public.public_donation_thanks t
    where t."donationId" = d.id::text
  )
order by d.id, r."issuedAt" desc nulls last;

update public.public_donation_thanks
set "donationItem" = btrim(regexp_replace("donationItem", '（尚未[^）]*）', '', 'g'))
where "donationItem" ~ '（尚未';
