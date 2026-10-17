-- 會員通知偏好（站內／私人信箱／頻率／勿擾）

create table if not exists public.member_notification_settings (
  "uid"                 text primary key,
  "inAppSystem"         boolean not null default true,
  "inAppAgency"         boolean not null default true,
  "inAppDonation"       boolean not null default true,
  "emailEnabled"        boolean not null default false,
  "emailSystem"         boolean not null default false,
  "emailAgency"         boolean not null default true,
  "emailDonation"       boolean not null default true,
  "emailDigestMode"     text not null default 'DAILY'
                        check ("emailDigestMode" in ('INSTANT', 'DAILY', 'WEEKLY', 'OFF')),
  "quietHoursEnabled"   boolean not null default true,
  "quietHoursStart"     time not null default '22:00',
  "quietHoursEnd"       time not null default '08:00',
  "updatedAt"           timestamptz not null default now()
);

grant select, insert, update, delete on public.member_notification_settings to anon, authenticated;

alter table public.member_notification_settings enable row level security;

drop policy if exists "dev full access" on public.member_notification_settings;
create policy "dev full access" on public.member_notification_settings
  for all to anon, authenticated using (true) with check (true);
