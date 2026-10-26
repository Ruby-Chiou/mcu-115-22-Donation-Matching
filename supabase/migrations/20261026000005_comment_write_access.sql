-- 前台登入後仍寫不進留言，是這三張表沒把權限給 authenticated。
-- Postgres 直接回 permission denied（42501），不是登入狀態不見。

do $$
declare
  comment_table text;
  seq regclass;
begin
  foreach comment_table in array array['daily_comments', 'disaster_comments', 'volunteer_comments']
  loop
    if to_regclass(format('public.%I', comment_table)) is null then
      continue;
    end if;

    execute format('grant select on public.%I to anon, authenticated', comment_table);
    execute format('grant insert on public.%I to authenticated', comment_table);

    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = comment_table
        and column_name = 'like_count'
    ) then
      execute format('grant update (like_count) on public.%I to authenticated', comment_table);
    end if;

    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = comment_table
        and column_name = 'liked_user_ids'
    ) then
      execute format('grant update (liked_user_ids) on public.%I to authenticated', comment_table);
    end if;

    execute format('alter table public.%I enable row level security', comment_table);
    execute format('drop policy if exists "comments are public" on public.%I', comment_table);
    execute format(
      'create policy "comments are public" on public.%I for select to anon, authenticated using (true)',
      comment_table
    );
    execute format('drop policy if exists "author inserts own comment" on public.%I', comment_table);
    execute format(
      $policy$
        create policy "author inserts own comment"
          on public.%I
          for insert
          to authenticated
          with check (user_id::text = auth.uid()::text)
      $policy$,
      comment_table
    );
    execute format('drop policy if exists "members update reactions" on public.%I', comment_table);
    execute format(
      'create policy "members update reactions" on public.%I for update to authenticated using (true) with check (true)',
      comment_table
    );

    seq := pg_get_serial_sequence(format('public.%I', comment_table), 'id');
    if seq is not null then
      execute format('grant usage, select on sequence %s to authenticated', seq);
    end if;
  end loop;
end $$;

do $$
declare
  fn record;
begin
  for fn in
    select p.proname, pg_get_function_identity_arguments(p.oid) as args
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'toggle_daily_comment_like'
  loop
    execute format(
      'grant execute on function public.%I(%s) to authenticated',
      fn.proname,
      fn.args
    );
  end loop;
end $$;
