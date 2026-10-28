-- 自管重設密碼權杖：信內連結走本站，設密由 service role 寫入，不依賴 Supabase 預設信或 verify 轉址。

create table if not exists public.password_reset_tokens (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists password_reset_tokens_user_idx
  on public.password_reset_tokens (user_id, created_at desc);

alter table public.password_reset_tokens enable row level security;
alter table public.password_reset_tokens force row level security;

revoke all on table public.password_reset_tokens from public, anon, authenticated;

-- 僅 service role（Edge Function）可讀寫；前端不直接碰這張表。

create or replace function public.find_auth_user_id_by_email(p_email text)
returns uuid
language sql
security definer
set search_path = auth, public
as $$
  select id
  from auth.users
  where lower(email) = lower(btrim(p_email))
  limit 1;
$$;

revoke all on function public.find_auth_user_id_by_email(text) from public, anon, authenticated;
grant execute on function public.find_auth_user_id_by_email(text) to service_role;

grant select, insert, update on table public.password_reset_tokens to service_role;

notify pgrst, 'reload schema';
