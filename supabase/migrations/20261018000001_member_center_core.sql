-- 會員專區核心：個人資料、站內信、大頭貼 Storage
-- （欄位已含後續擴充：fullName / accountName / city / loginProvider / accountStatus）

create table if not exists public.donor_profiles (
  "uid"            text primary key,
  "email"          text not null default '',
  "displayName"    text not null default '',
  "accountName"    text,
  "fullName"       text,
  "phoneNumber"    text,
  "city"           text,
  "avatarUrl"      text,
  "loginProvider"  text not null default 'email',
  "accountStatus"  text not null default 'ACTIVE',
  "deletedAt"      timestamptz,
  "createdAt"      timestamptz not null default now(),
  "updatedAt"      timestamptz not null default now()
);

-- 若表已存在但缺欄位（早期手動建表），補齊
alter table public.donor_profiles
  add column if not exists "fullName" text,
  add column if not exists "accountName" text,
  add column if not exists "city" text,
  add column if not exists "loginProvider" text not null default 'email',
  add column if not exists "accountStatus" text not null default 'ACTIVE',
  add column if not exists "deletedAt" timestamptz;

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

create index if not exists member_messages_recipient_idx
  on public.member_messages ("recipientUid", "createdAt" desc);

create index if not exists member_messages_sender_idx
  on public.member_messages ("senderUid", "createdAt" desc);

grant select, insert, update, delete on public.donor_profiles to anon, authenticated;
grant select, insert, update, delete on public.member_messages to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

alter table public.donor_profiles enable row level security;
alter table public.member_messages enable row level security;

drop policy if exists "dev full access" on public.donor_profiles;
create policy "dev full access" on public.donor_profiles
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "dev full access" on public.member_messages;
create policy "dev full access" on public.member_messages
  for all to anon, authenticated using (true) with check (true);

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
