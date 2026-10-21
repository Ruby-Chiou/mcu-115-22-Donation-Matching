-- 捐助者個人捐助歷史：在既有捐助表加上 donor_uid，供會員專區／歷史頁依身分查詢

do $$
begin
  if to_regclass('public.donor_daily_donations') is null then
    raise notice 'skip donor_uid: public.donor_daily_donations does not exist';
    return;
  end if;

  alter table public.donor_daily_donations
    add column if not exists donor_uid text;

  create index if not exists donor_daily_donations_donor_uid_idx
    on public.donor_daily_donations (donor_uid, created_at desc);

  update public.donor_daily_donations
  set donor_uid = 'dev-donor-001'
  where (donor_uid is null or donor_uid = '')
    and phone = '0912345678';
end $$;
