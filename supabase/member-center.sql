-- 會員專區：個人資料 / 收件匣 / 感謝狀
-- 於 Supabase Dashboard > SQL Editor 執行一次即可

-- =========================================
-- 1. 捐助者個人資料
-- =========================================
create table if not exists public.donor_profiles (
  "uid"         text primary key,
  "email"       text not null default '',
  "displayName" text not null default '',
  "phoneNumber" text,
  "avatarUrl"   text,
  "createdAt"   timestamptz not null default now(),
  "updatedAt"   timestamptz not null default now()
);

-- =========================================
-- 2. 站內信
-- =========================================
create table if not exists public.member_messages (
  "id"               bigint generated always as identity primary key,
  "recipientUid"     text not null,
  "recipientName"    text not null default '',
  "senderUid"        text,
  "senderName"       text not null default '',
  "category"         text not null default 'SYSTEM'
                     check ("category" in ('SYSTEM', 'AGENCY', 'DONATION')),
  "subject"          text not null,
  "content"          text not null,
  "parentId"         bigint references public.member_messages ("id") on delete set null,
  "isRead"           boolean not null default false,
  "isStarred"        boolean not null default false,
  "recipientDeleted" boolean not null default false,
  "senderDeleted"    boolean not null default false,
  "createdAt"        timestamptz not null default now()
);

create index if not exists member_messages_recipient_idx on public.member_messages ("recipientUid", "createdAt" desc);
create index if not exists member_messages_sender_idx on public.member_messages ("senderUid", "createdAt" desc);

-- =========================================
-- 3. 感謝狀
-- =========================================
create table if not exists public.donor_certificates (
  "id"                   bigint generated always as identity primary key,
  "certificateNo"        text not null unique,
  "donorUid"             text not null,
  "donorName"            text not null,
  "agencyName"           text not null,
  "agencyRepresentative" text not null default '',
  "donationItem"         text not null,
  "donationDate"         date not null,
  "message"              text not null,
  "issuedAt"             timestamptz not null default now()
);

create index if not exists donor_certificates_donor_idx on public.donor_certificates ("donorUid", "issuedAt" desc);

-- =========================================
-- 4. RLS
-- 目前前端尚未串接登入，先開放 anon 讀寫；
-- 串好 Supabase Auth 後應改為以 auth.uid()::text 比對 uid / recipientUid / senderUid / donorUid
-- =========================================
alter table public.donor_profiles enable row level security;
alter table public.member_messages enable row level security;
alter table public.donor_certificates enable row level security;

drop policy if exists "dev full access" on public.donor_profiles;
create policy "dev full access" on public.donor_profiles
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "dev full access" on public.member_messages;
create policy "dev full access" on public.member_messages
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "dev read access" on public.donor_certificates;
create policy "dev read access" on public.donor_certificates
  for select to anon, authenticated using (true);

-- =========================================
-- 5. 大頭貼 Storage bucket
-- =========================================
insert into storage.buckets ("id", "name", "public")
values ('member-avatars', 'member-avatars', true)
on conflict ("id") do nothing;

drop policy if exists "member avatars read" on storage.objects;
create policy "member avatars read" on storage.objects
  for select to anon, authenticated using (bucket_id = 'member-avatars');

drop policy if exists "member avatars write" on storage.objects;
create policy "member avatars write" on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'member-avatars');

drop policy if exists "member avatars update" on storage.objects;
create policy "member avatars update" on storage.objects
  for update to anon, authenticated using (bucket_id = 'member-avatars');

-- =========================================
-- 6. 測試資料（開發用帳號 dev-donor-001）
-- =========================================
insert into public.donor_profiles ("uid", "email", "displayName", "phoneNumber")
values ('dev-donor-001', 'donor@example.com', '測試捐助者', '0912345678')
on conflict ("uid") do nothing;

insert into public.member_messages
  ("recipientUid", "recipientName", "senderUid", "senderName", "category", "subject", "content", "isRead", "createdAt")
values
  ('dev-donor-001', '測試捐助者', null, '系統管理員', 'SYSTEM',
   '歡迎加入智慧捐助媒合平台',
   E'感謝您註冊成為捐助者！\n您可以在「日常捐助」與「災害救助」專區瀏覽各機構的需求。',
   true, now() - interval '7 days'),
  ('dev-donor-001', '測試捐助者', 'agency-001', '陽光兒童之家', 'AGENCY',
   '感謝您捐贈的冬季衣物',
   E'您好，我們已收到您捐贈的冬季衣物 20 件，孩子們都非常開心。\n如有任何問題歡迎回信與我們聯繫。',
   false, now() - interval '2 days'),
  ('dev-donor-001', '測試捐助者', null, '物流通知', 'DONATION',
   '您的捐贈物資已送達',
   E'捐贈單號 D-20261001-001 已於今日送達「陽光兒童之家」。\n感謝狀將由機構審核後寄發。',
   false, now() - interval '1 day'),
  ('dev-donor-001', '測試捐助者', 'agency-002', '長青關懷協會', 'AGENCY',
   '物資需求更新通知',
   E'您關注的「成人紙尿褲」需求已更新數量，歡迎再次前往捐助大廳查看。',
   false, now() - interval '3 hours');

insert into public.donor_certificates
  ("certificateNo", "donorUid", "donorName", "agencyName", "agencyRepresentative", "donationItem", "donationDate", "message")
values
  ('TY-2026-0001', 'dev-donor-001', '測試捐助者', '陽光兒童之家', '王小明',
   '冬季衣物 20 件', '2026-10-01',
   '承蒙 台端慷慨解囊，捐贈冬季衣物予本院，使院內孩童得以溫暖過冬，善行義舉，特頒此狀，以表謝忱。'),
  ('TY-2026-0002', 'dev-donor-001', '測試捐助者', '長青關懷協會', '李美華',
   '成人紙尿褲 10 箱', '2026-09-15',
   '感謝 台端熱心公益，捐贈物資照護長者生活所需，愛心善舉，嘉惠長者，特頒此狀，以資感謝。')
on conflict ("certificateNo") do nothing;
