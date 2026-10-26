-- 寄信函式用 service_role 讀取並標記已寄。建表時沒有這兩項權限，呼叫會失敗。
grant select, update on table public.member_email_outbox to service_role;
