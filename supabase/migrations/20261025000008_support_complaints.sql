-- 聯絡我們送進來的客訴。管理者在會員專區收信、回覆；有帳號的人同時收到站內信。

create table if not exists public.support_complaints (
  id bigint generated always as identity primary key,
  "senderName" text not null,
  "senderEmail" text not null,
  "senderUid" text,
  category text not null,
  subject text not null,
  body text not null,
  status text not null default 'open' check (status in ('open', 'replied', 'closed')),
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table if not exists public.support_replies (
  id bigint generated always as identity primary key,
  "complaintId" bigint not null references public.support_complaints (id) on delete cascade,
  "authorUid" text not null,
  "authorName" text not null,
  body text not null,
  "createdAt" timestamptz not null default now()
);

alter table public.support_complaints enable row level security;
alter table public.support_replies enable row level security;

revoke all on public.support_complaints from public, anon, authenticated;
revoke all on public.support_replies from public, anon, authenticated;
grant insert on public.support_complaints to anon, authenticated;
grant select, update on public.support_complaints to authenticated;
grant select, insert on public.support_replies to authenticated;
grant usage, select on sequence public.support_complaints_id_seq to anon, authenticated;
grant usage, select on sequence public.support_replies_id_seq to authenticated;

drop policy if exists "anyone submits a complaint" on public.support_complaints;
create policy "anyone submits a complaint"
  on public.support_complaints
  for insert
  to anon, authenticated
  with check (
    status = 'open'
    and category in ('account', 'donation', 'logistics', 'disaster', 'system', 'other')
    and char_length(trim("senderName")) between 1 and 40
    and char_length(trim("senderEmail")) between 3 and 120
    and char_length(trim(subject)) between 1 and 80
    and char_length(trim(body)) between 1 and 2000
    and (
      ("senderUid" is null and auth.uid() is null)
      or "senderUid" = auth.uid()::text
    )
  );

drop policy if exists "admin reads complaints" on public.support_complaints;
create policy "admin reads complaints"
  on public.support_complaints
  for select
  to authenticated
  using (public.current_app_role() = 'admin');

drop policy if exists "sender reads own complaints" on public.support_complaints;
create policy "sender reads own complaints"
  on public.support_complaints
  for select
  to authenticated
  using ("senderUid" = auth.uid()::text);

drop policy if exists "admin updates complaints" on public.support_complaints;
create policy "admin updates complaints"
  on public.support_complaints
  for update
  to authenticated
  using (public.current_app_role() = 'admin')
  with check (public.current_app_role() = 'admin');

drop policy if exists "admin reads replies" on public.support_replies;
create policy "admin reads replies"
  on public.support_replies
  for select
  to authenticated
  using (public.current_app_role() = 'admin');

drop policy if exists "sender reads replies" on public.support_replies;
create policy "sender reads replies"
  on public.support_replies
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.support_complaints complaint
      where complaint.id = "complaintId"
        and complaint."senderUid" = auth.uid()::text
    )
  );

drop policy if exists "admin writes replies" on public.support_replies;
create policy "admin writes replies"
  on public.support_replies
  for insert
  to authenticated
  with check (public.current_app_role() = 'admin' and "authorUid" = auth.uid()::text);

notify pgrst, 'reload schema';
