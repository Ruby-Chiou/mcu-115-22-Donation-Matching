-- 登入者只能刪自己寫進資料庫的留言。示範留言不在這三張表裡。

do $$
declare
  comment_table text;
begin
  foreach comment_table in array array['daily_comments', 'disaster_comments', 'volunteer_comments']
  loop
    if to_regclass(format('public.%I', comment_table)) is null then
      continue;
    end if;

    execute format('grant delete on public.%I to authenticated', comment_table);
    execute format('drop policy if exists "author deletes own comment" on public.%I', comment_table);
    execute format(
      $policy$
        create policy "author deletes own comment"
          on public.%I
          for delete
          to authenticated
          using (user_id::text = (select auth.uid()::text))
      $policy$,
      comment_table
    );
  end loop;
end $$;

notify pgrst, 'reload schema';
