-- 面交證明、一天後提醒，以及帳號停用／註銷通知。

alter table public.donor_daily_donations
  add column if not exists proof_uploaded_at timestamptz;

create table if not exists public.member_scheduled_messages (
  id bigint generated always as identity primary key,
  job_type text not null,
  recipient_uid text not null,
  recipient_name text not null default '',
  donation_id uuid references public.donor_daily_donations(id) on delete cascade,
  subject text not null,
  content text not null,
  scheduled_for timestamptz not null,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (job_type, donation_id)
);

create index if not exists member_scheduled_messages_due_idx
  on public.member_scheduled_messages (scheduled_for)
  where processed_at is null;

revoke all on table public.member_scheduled_messages from public, anon, authenticated;
grant select, insert, update on table public.member_scheduled_messages to service_role;
alter table public.member_scheduled_messages enable row level security;

create or replace function public.schedule_handover_proof_reminder()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.donation_method = '面交'
    and new.donor_uid is not null
    and btrim(new.donor_uid) <> '' then
    insert into public.member_scheduled_messages (
      job_type, recipient_uid, recipient_name, donation_id,
      subject, content, scheduled_for
    ) values (
      'HANDOVER_PROOF_REMINDER',
      new.donor_uid,
      coalesce(nullif(btrim(new.donor_name), ''), '捐助者'),
      new.id,
      '提醒：請上傳面交捐贈證明',
      '您的面交捐助已建立。完成面交後，請到「會員專區 → 捐贈紀錄」上傳照片或 PDF 證明。'
        || E'\n捐助編號：' || new.id::text,
      new.created_at + interval '1 day'
    )
    on conflict (job_type, donation_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists schedule_handover_proof_reminder on public.donor_daily_donations;
create trigger schedule_handover_proof_reminder
  after insert on public.donor_daily_donations
  for each row execute function public.schedule_handover_proof_reminder();

create or replace function public.process_due_member_scheduled_messages()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  job public.member_scheduled_messages%rowtype;
  inserted_count integer := 0;
begin
  for job in
    select *
    from public.member_scheduled_messages
    where processed_at is null
      and scheduled_for <= now()
    order by id
    limit 100
    for update skip locked
  loop
    if job.job_type <> 'HANDOVER_PROOF_REMINDER'
      or exists (
        select 1 from public.donor_daily_donations d
        where d.id = job.donation_id
          and d.donation_method = '面交'
          and d.proof_uploaded_at is null
          and d.status <> 'human_rejected'
      ) then
      insert into public.member_messages (
        "recipientUid", "recipientName", "senderUid", "senderName",
        category, subject, content, "relatedDonationId"
      ) values (
        job.recipient_uid, job.recipient_name, null, '系統通知',
        'DONATION', job.subject, job.content, job.donation_id::text
      );
      inserted_count := inserted_count + 1;
    end if;
    update public.member_scheduled_messages set processed_at = now() where id = job.id;
  end loop;
  return inserted_count;
end;
$$;

revoke all on function public.process_due_member_scheduled_messages() from public, anon, authenticated;
grant execute on function public.process_due_member_scheduled_messages() to service_role;

drop policy if exists "donor uploads own handover proof" on public.donation_files;
create policy "donor uploads own handover proof"
  on public.donation_files for insert to authenticated
  with check (
    file_type = 'proof'
    and exists (
      select 1 from public.donor_daily_donations d
      where d.id = donation_id
        and d.donor_uid = auth.uid()::text
        and d.donation_method = '面交'
    )
  );

drop policy if exists "donor uploads own handover proof object" on storage.objects;
create policy "donor uploads own handover proof object"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'donation-files'
    and name like 'donations/%/proof/%'
    and exists (
      select 1 from public.donor_daily_donations d
      where d.id::text = split_part(name, '/', 2)
        and d.donor_uid = auth.uid()::text
        and d.donation_method = '面交'
    )
  );

create or replace function public.mark_handover_proof_uploaded(p_donation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.donor_daily_donations
  set proof_uploaded_at = now()
  where id = p_donation_id
    and donor_uid = auth.uid()::text
    and donation_method = '面交'
    and exists (
      select 1 from public.donation_files
      where donation_id = p_donation_id and file_type = 'proof'
    );
  if not found then
    raise exception '找不到可更新的面交捐助或證明檔';
  end if;
end;
$$;

revoke all on function public.mark_handover_proof_uploaded(uuid) from public, anon;
grant execute on function public.mark_handover_proof_uploaded(uuid) to authenticated;

create or replace function public.enqueue_account_status_notice()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  mailbox text;
  member_name text;
  status_label text;
  body text;
  created_message_id bigint;
begin
  if new."accountStatus" not in ('SUSPENDED', 'DELETED')
    or new."accountStatus" is not distinct from old."accountStatus" then
    return new;
  end if;

  mailbox := coalesce(
    nullif(btrim(old.email), ''),
    (select nullif(btrim(email), '') from auth.users where id::text = new.uid)
  );
  member_name := coalesce(
    nullif(btrim(to_jsonb(old)->>'displayName'), ''),
    nullif(btrim(to_jsonb(old)->>'agencyName'), ''),
    '會員'
  );
  status_label := case when new."accountStatus" = 'DELETED' then '註銷' else '停用' end;
  body := '您的平台帳號已' || status_label || '。如有疑問，請聯絡客服信箱 donation.matching1113@gmail.com。';

  insert into public.member_messages (
    "recipientUid", "recipientName", "senderUid", "senderName",
    category, subject, content
  ) values (
    new.uid, member_name, null, '平台客服', 'SYSTEM',
    '帳號已' || status_label, body
  )
  returning id into created_message_id;

  if mailbox is not null
    and position('@' in mailbox) > 1
    and not exists (
      select 1 from public.member_email_outbox where message_id = created_message_id
    ) then
    insert into public.member_email_outbox (
      recipient_uid, recipient_email, recipient_name, category,
      subject, content, message_id, scheduled_for
    ) values (
      new.uid, mailbox, member_name, 'SYSTEM',
      '帳號已' || status_label, body, created_message_id, now()
    );
  end if;
  return new;
end;
$$;

drop trigger if exists donor_account_status_notice on public.donor_profiles;
create trigger donor_account_status_notice
  after update of "accountStatus" on public.donor_profiles
  for each row execute function public.enqueue_account_status_notice();

drop trigger if exists agency_account_status_notice on public.agency_profiles;
create trigger agency_account_status_notice
  after update of "accountStatus" on public.agency_profiles
  for each row execute function public.enqueue_account_status_notice();

notify pgrst, 'reload schema';
