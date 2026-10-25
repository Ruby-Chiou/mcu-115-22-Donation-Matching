-- 捐助者可選擇感謝牆用匿名或全名，以及這筆要不要公開。

alter table public.donor_daily_donations
  add column if not exists thank_name_mode text not null default 'masked';

alter table public.donor_daily_donations
  drop constraint if exists donor_daily_donations_thank_name_mode_check;

alter table public.donor_daily_donations
  add constraint donor_daily_donations_thank_name_mode_check
  check (thank_name_mode in ('masked', 'full'));

alter table public.donor_daily_donations
  add column if not exists thank_public boolean not null default true;

alter table public.public_donation_thanks
  add column if not exists "nameMode" text not null default 'masked';

alter table public.public_donation_thanks
  drop constraint if exists public_donation_thanks_name_mode_check;

alter table public.public_donation_thanks
  add constraint public_donation_thanks_name_mode_check
  check ("nameMode" in ('masked', 'full'));

create or replace function public.set_donation_visibility(
  p_donation_id text,
  p_name_mode text,
  p_public boolean
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  donation public.donor_daily_donations%rowtype;
  shown text;
  trimmed text;
begin
  if p_name_mode not in ('masked', 'full') then
    raise exception '姓名顯示方式不正確';
  end if;

  select * into donation
  from public.donor_daily_donations
  where id::text = p_donation_id;

  if not found then
    raise exception '找不到這筆捐助';
  end if;

  if donation.donor_uid is distinct from auth.uid()::text
     and public.current_app_role() is distinct from 'admin' then
    raise exception '只能修改自己的捐助';
  end if;

  trimmed := btrim(coalesce(donation.donor_name, ''));

  if p_name_mode = 'full' then
    shown := case when trimmed = '' then '捐助者' else trimmed end;
  elsif trimmed = '' then
    shown := '匿名';
  elsif char_length(trimmed) <= 2 then
    shown := left(trimmed, 1) || '*';
  else
    shown := left(trimmed, 1) || '*' || right(trimmed, 1);
  end if;

  update public.donor_daily_donations
  set thank_name_mode = p_name_mode,
      thank_public = p_public
  where id::text = p_donation_id;

  update public.public_donation_thanks
  set "nameMode" = p_name_mode,
      "displayName" = shown,
      "isPublic" = p_public
  where "donationId" = p_donation_id;
end;
$$;

grant execute on function public.set_donation_visibility(text, text, boolean) to authenticated;

grant update on public.donor_daily_donations to authenticated;

drop policy if exists "admin repairs donor donations" on public.donor_daily_donations;
create policy "admin repairs donor donations"
  on public.donor_daily_donations
  for update
  to authenticated
  using (public.current_app_role() = 'admin')
  with check (public.current_app_role() = 'admin');

update public.board_announcements
set body = '機構接受捐助後，會依照捐助者選擇的方式出現在感謝牆。可以選擇匿名或全名，也可以改成不公開。',
    updated_at = now()
where board = 'thank_wall'
  and donor_uid is null
  and body like '%遮罩%';

notify pgrst, 'reload schema';
