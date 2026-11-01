-- 公開說明改為與前台一致的文案，避免與舊描述重複。

update public.board_announcements
set body = '捐助者可自行設定匿名、全名或不公開的方式顯示於本名單下，感謝如下愛心人士們的幫助。',
    updated_at = now()
where board = 'thank_wall'
  and headline = '公開說明';
