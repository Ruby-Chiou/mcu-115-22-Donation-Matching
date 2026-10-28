-- 個人／企業捐助者以信箱密碼註冊後立刻可登入，不再卡在「等確認信」。
-- Gmail、學校信箱同樣適用；受助者帳號仍走管理者審核，不在此自動放行登入權限以外的資格。

create or replace function public.auto_confirm_donor_email()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  assigned text := lower(coalesce(new.raw_user_meta_data->>'role', 'donor'));
begin
  if assigned = 'agency' or assigned = 'admin' then
    return new;
  end if;

  if new.email_confirmed_at is null then
    update auth.users
    set email_confirmed_at = coalesce(email_confirmed_at, now()),
        updated_at = now()
    where id = new.id
      and email_confirmed_at is null;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_confirm_donor on auth.users;
create trigger on_auth_user_confirm_donor
  after insert on auth.users
  for each row
  execute function public.auto_confirm_donor_email();

-- 補齊既有尚未確認、但已是捐助者的帳號
update auth.users as u
set email_confirmed_at = coalesce(u.email_confirmed_at, now()),
    updated_at = now()
where u.email_confirmed_at is null
  and exists (
    select 1
    from public.user_accounts a
    where a.user_id = u.id
      and a.role = 'donor'
  );

notify pgrst, 'reload schema';
