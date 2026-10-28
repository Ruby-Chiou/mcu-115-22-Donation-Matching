-- 註冊當下就把信箱標成已確認，避免遠端仍開「須驗證信箱」時 Gmail／學校信箱無法用帳密密碼登入。
-- 受助者／管理者同樣確認信箱；資格審核仍由既有 agency／admin 流程把關。

create or replace function public.auto_confirm_signup_email()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if new.email_confirmed_at is null then
    new.email_confirmed_at := now();
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_confirm_donor on auth.users;
drop trigger if exists on_auth_user_confirm_signup on auth.users;

create trigger on_auth_user_confirm_signup
  before insert on auth.users
  for each row
  execute function public.auto_confirm_signup_email();

-- 補齊既有未確認帳號（含曾用 Gmail 註冊卻卡在驗證的）
update auth.users
set email_confirmed_at = coalesce(email_confirmed_at, now()),
    updated_at = now()
where email_confirmed_at is null;

notify pgrst, 'reload schema';
