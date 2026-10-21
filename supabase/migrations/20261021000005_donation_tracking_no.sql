-- 捐助者在審核通過後上傳物流單號，跑馬燈才廣播

alter table public.donor_daily_donations
  add column if not exists tracking_no text,
  add column if not exists tracking_uploaded_at timestamptz;

create index if not exists donor_daily_donations_tracking_idx
  on public.donor_daily_donations (tracking_uploaded_at desc)
  where tracking_no is not null and btrim(tracking_no) <> '';

-- 既有政策只允許改「審核中」的列，已通過的捐助要另外走這個函式才能補單號
create or replace function public.upload_donation_tracking(
  p_donation_id uuid,
  p_donor_uid text,
  p_tracking text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_id uuid;
begin
  if p_tracking is null or btrim(p_tracking) = '' then
    raise exception '請輸入物流單號';
  end if;

  update public.donor_daily_donations
  set tracking_no = btrim(p_tracking),
      tracking_uploaded_at = now()
  where id = p_donation_id
    and donor_uid = p_donor_uid
    and status = 'human_approved'
    and donation_method = '寄送'
  returning id into updated_id;

  if updated_id is null then
    raise exception '只有審核通過的寄送捐助可以上傳物流單號';
  end if;
end;
$$;

grant execute on function public.upload_donation_tracking(uuid, text, text) to anon, authenticated;
