-- 站內信寫入後，依收件者的通知設定排入寄信佇列。
-- 即時信在勿擾時段改到時段結束；每日為台北時間 08:00，每週為週一 08:00。

create table if not exists public.member_email_outbox (
  id bigint generated always as identity primary key,
  recipient_uid text not null,
  recipient_email text not null,
  recipient_name text not null default '',
  category text not null,
  subject text not null,
  content text not null,
  message_id bigint,
  scheduled_for timestamptz not null,
  sent_at timestamptz,
  last_error text,
  created_at timestamptz not null default now()
);

create index if not exists member_email_outbox_due_idx
  on public.member_email_outbox (scheduled_for)
  where sent_at is null;

revoke all on table public.member_email_outbox from public, anon, authenticated;
grant select, update on table public.member_email_outbox to service_role;
alter table public.member_email_outbox enable row level security;

create or replace function public.member_in_quiet_hours(
  p_local timestamp,
  p_enabled boolean,
  p_start time,
  p_end time
) returns boolean
language sql
immutable
as $$
  select
    p_enabled
    and p_start <> p_end
    and case
      when p_start < p_end then p_local::time >= p_start and p_local::time < p_end
      else p_local::time >= p_start or p_local::time < p_end
    end
$$;

create or replace function public.member_quiet_end_after(
  p_local timestamp,
  p_end time
) returns timestamp
language sql
immutable
as $$
  select case
    when p_local::time < p_end then date_trunc('day', p_local) + p_end
    else date_trunc('day', p_local) + interval '1 day' + p_end
  end
$$;

create or replace function public.next_member_mail_at(
  p_mode text,
  p_quiet_enabled boolean,
  p_quiet_start time,
  p_quiet_end time
) returns timestamptz
language plpgsql
stable
as $$
declare
  local_now timestamp := timezone('Asia/Taipei', now());
  candidate timestamp;
  guard integer := 0;
begin
  if p_mode = 'INSTANT'
    and not public.member_in_quiet_hours(local_now, p_quiet_enabled, p_quiet_start, p_quiet_end) then
    return now();
  end if;

  if p_mode = 'INSTANT' then
    candidate := public.member_quiet_end_after(local_now, p_quiet_end);
    return candidate at time zone 'Asia/Taipei';
  end if;

  if p_mode = 'WEEKLY' then
    candidate := date_trunc('day', local_now);
    while extract(isodow from candidate) <> 1 loop
      candidate := candidate + interval '1 day';
    end loop;
    candidate := candidate + time '08:00';
    if candidate <= local_now then
      candidate := candidate + interval '7 days';
    end if;
  else
    candidate := date_trunc('day', local_now) + time '08:00';
    if candidate <= local_now then
      candidate := candidate + interval '1 day';
    end if;
  end if;

  while public.member_in_quiet_hours(candidate, p_quiet_enabled, p_quiet_start, p_quiet_end) loop
    candidate := public.member_quiet_end_after(candidate, p_quiet_end);
    guard := guard + 1;
    exit when guard > 3;
  end loop;

  return candidate at time zone 'Asia/Taipei';
end;
$$;

create or replace function public.enqueue_member_message_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  settings public.member_notification_settings%rowtype;
  allowed boolean := false;
  mailbox text;
begin
  begin
    select * into settings
    from public.member_notification_settings
    where uid = new."recipientUid";

    if not found
      or settings."emailEnabled" is not true
      or settings."emailDigestMode" = 'OFF' then
      return new;
    end if;

    allowed := case new.category
      when 'SYSTEM' then settings."emailSystem"
      when 'AGENCY' then settings."emailAgency"
      when 'DONATION' then settings."emailDonation"
      else false
    end;

    if allowed is not true then
      return new;
    end if;

    select coalesce(
      (select nullif(btrim(email), '') from auth.users where id::text = new."recipientUid"),
      (select nullif(btrim(email), '') from public.donor_profiles where uid = new."recipientUid"),
      (select nullif(btrim(email), '') from public.agency_profiles where uid = new."recipientUid")
    )
    into mailbox;

    if mailbox is null or position('@' in mailbox) < 2 then
      return new;
    end if;

    insert into public.member_email_outbox (
      recipient_uid,
      recipient_email,
      recipient_name,
      category,
      subject,
      content,
      message_id,
      scheduled_for
    ) values (
      new."recipientUid",
      mailbox,
      coalesce(nullif(btrim(new."recipientName"), ''), '會員'),
      new.category,
      new.subject,
      new.content,
      new.id,
      public.next_member_mail_at(
        settings."emailDigestMode",
        settings."quietHoursEnabled",
        settings."quietHoursStart",
        settings."quietHoursEnd"
      )
    );
  exception
    when others then
      raise warning '通知信沒有排入：%', sqlerrm;
  end;

  return new;
end;
$$;

drop trigger if exists enqueue_member_message_email on public.member_messages;
create trigger enqueue_member_message_email
  after insert on public.member_messages
  for each row
  execute function public.enqueue_member_message_email();
