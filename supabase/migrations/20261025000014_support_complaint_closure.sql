-- 回覆不等於結案。客服回覆後開始等對方；滿七天沒有再回覆就自動結案。

alter table public.support_complaints
  add column if not exists "awaitingReplyAt" timestamptz,
  add column if not exists "closeMethod" text,
  add column if not exists "closedAt" timestamptz,
  add column if not exists "closeNotifiedAt" timestamptz;

alter table public.support_complaints
  drop constraint if exists support_complaints_close_method_check;

alter table public.support_complaints
  add constraint support_complaints_close_method_check
  check ("closeMethod" is null or "closeMethod" in ('manual', 'auto'));

update public.support_complaints
set "awaitingReplyAt" = "updatedAt"
where status = 'replied'
  and "awaitingReplyAt" is null;

update public.support_complaints
set "closeMethod" = 'manual',
    "closedAt" = "updatedAt"
where status = 'closed'
  and "closeMethod" is null;

grant update on public.support_complaints to service_role;
grant insert on public.member_messages to service_role;
grant usage, select on all sequences in schema public to service_role;

notify pgrst, 'reload schema';
