-- 感謝牆與黑名單改掛在捐助者帳號上。客訴信箱補幾筆範例，方便看版面。

alter table public.board_announcements
  add column if not exists donor_uid text;

create index if not exists board_announcements_donor_idx
  on public.board_announcements (donor_uid);

insert into public.support_complaints (
  "senderName", "senderEmail", "senderUid", category, subject, body, status, "createdAt", "updatedAt"
)
select *
from (
  values
    (
      '陳小姐',
      'chen.demo@example.com',
      null::text,
      'logistics',
      '物流相關',
      '上週寄出的白米，物流顯示已送達，但機構說沒有收到。單號是 DEMO-1042，想請平台幫忙確認。',
      'open',
      now() - interval '6 hours',
      now() - interval '6 hours'
    ),
    (
      '王先生',
      'wang.demo@example.com',
      null::text,
      'account',
      '帳號與登入',
      '我用 Google 登入後，會員專區一直顯示尚未登入。重新整理也一樣，手機和電腦都試過。',
      'open',
      now() - interval '1 day',
      now() - interval '1 day'
    ),
    (
      '林同學',
      'lin.demo@example.com',
      null::text,
      'donation',
      '捐助相關',
      '災害救助的需求我已經填完，送出後畫面沒有捐助編號。不確定有沒有成功，怕重複捐一次。',
      'open',
      now() - interval '2 days',
      now() - interval '2 days'
    ),
    (
      '張女士',
      'chang.demo@example.com',
      null::text,
      'system',
      '平台使用問題',
      '感謝牆上看得到我的名字，但會員專區的公開感謝是空的。想確認是不是同一筆資料。',
      'replied',
      now() - interval '3 days',
      now() - interval '1 day'
    ),
    (
      '周先生',
      'chou.demo@example.com',
      null::text,
      'other',
      '其他問題',
      '公司捐助的審核電話我沒接到，可以改約明天下午嗎？',
      'closed',
      now() - interval '5 days',
      now() - interval '4 days'
    )
) as sample(
  "senderName", "senderEmail", "senderUid", category, subject, body, status, "createdAt", "updatedAt"
)
where not exists (
  select 1 from public.support_complaints existing where existing."senderEmail" = sample."senderEmail"
);

insert into public.support_replies ("complaintId", "authorUid", "authorName", body, "createdAt")
select complaint.id, 'sample-admin', '平台客服', '公開感謝牆與會員專區讀的是同一份紀錄。若會員專區是空的，多半是這筆捐助還沒標成公開。我已經請機構再確認一次。', now() - interval '1 day'
from public.support_complaints complaint
where complaint."senderEmail" = 'chang.demo@example.com'
  and not exists (
    select 1 from public.support_replies reply where reply."complaintId" = complaint.id
  );

notify pgrst, 'reload schema';
