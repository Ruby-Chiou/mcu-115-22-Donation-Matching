-- 捐助者更新開啟密碼後，受助者才需要重新發送收據。
-- 密碼時間記在捐助者自己的資料表，再抄到捐助單上給受助者讀，不把字號交出去。

alter table public.donor_profiles
  add column if not exists "passwordUpdatedAt" timestamptz;

alter table public.donor_daily_donations
  add column if not exists receipt_password_changed_at timestamptz;

alter table public.donor_receipts
  add column if not exists "pdfSentAt" timestamptz;

create or replace function public.note_receipt_password_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new."passwordUpdatedAt" is distinct from old."passwordUpdatedAt"
     and new."passwordUpdatedAt" is not null then
    update public.donor_daily_donations
    set receipt_password_changed_at = new."passwordUpdatedAt"
    where donor_uid = new.uid;
  end if;

  return new;
end;
$$;

drop trigger if exists donor_password_updates_receipts on public.donor_profiles;

create trigger donor_password_updates_receipts
  after update of "passwordUpdatedAt" on public.donor_profiles
  for each row
  execute function public.note_receipt_password_change();
