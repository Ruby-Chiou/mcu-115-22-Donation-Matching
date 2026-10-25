-- 客訴寄信函式用 service_role 寫入並取回編號。原先只開放 anon / authenticated。

grant select, insert on public.support_complaints to service_role;
grant usage, select on sequence public.support_complaints_id_seq to service_role;
