-- 管理者登入信箱改成組內公用客服信箱。密碼與顯示名稱維持現況。

do $$
begin
  if exists (
    select 1
    from auth.users
    where lower(email) = 'donation.matching1113@gmail.com'
      and id <> '33333333-3333-4333-8333-333333333333'
  ) then
    raise exception '客服信箱已經綁在別的帳號上，管理者登入信箱沒有更改';
  end if;

  if exists (
    select 1
    from public.user_accounts
    where lower(email) = 'donation.matching1113@gmail.com'
      and user_id <> '33333333-3333-4333-8333-333333333333'
  ) then
    raise exception '客服信箱已經綁在別的帳號上，管理者登入信箱沒有更改';
  end if;
end $$;

update auth.users
set email = 'donation.matching1113@gmail.com',
    raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
      || jsonb_build_object('display_name', '平台管理者'),
    updated_at = now()
where id = '33333333-3333-4333-8333-333333333333';

update auth.identities
set identity_data = coalesce(identity_data, '{}'::jsonb)
      || jsonb_build_object(
        'email', 'donation.matching1113@gmail.com',
        'email_verified', true
      ),
    updated_at = now()
where user_id = '33333333-3333-4333-8333-333333333333'
  and provider = 'email';

update public.user_accounts
set email = 'donation.matching1113@gmail.com',
    display_name = '平台管理者'
where user_id = '33333333-3333-4333-8333-333333333333';
