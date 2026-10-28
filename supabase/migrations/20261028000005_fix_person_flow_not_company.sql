-- 先前 stage seed 用固定 UUID 把「測試個人捐助者」誤標成企業；改回個人，企業只掛在公司信箱帳號。

update public.user_accounts as a
set
  display_name = coalesce(nullif(btrim(p."displayName"), ''), '測試個人捐助者'),
  donor_kind = 'individual',
  role = 'donor'
from public.donor_profiles as p
where a.user_id::text = p.uid
  and (
    p.email = 'dev.person.flow@example.com'
    or (
      a.user_id = '55555555-5555-4555-8555-555555555555'
      and p.email is distinct from 'dev.company@example.com'
      and coalesce(p."displayName", '') ilike '%個人%'
    )
  );

update public.user_accounts
set display_name = '測試愛心企業',
    donor_kind = 'company',
    role = 'donor'
where email = 'dev.company@example.com';

delete from public.donor_company_applications d
using public.user_accounts a
where d.user_id = a.user_id
  and a.donor_kind = 'individual'
  and (
    a.email = 'dev.person.flow@example.com'
    or a.user_id = '55555555-5555-4555-8555-555555555555'
  );

insert into public.donor_company_applications (
  user_id, company_name, tax_id, representative, contact_phone, address, document_name, status, reviewed_at
)
select
  a.user_id,
  '測試愛心企業',
  '12345678',
  '王經理',
  '0987654321',
  '台北市信義區企業路 8 號',
  'company-registration.pdf',
  'approved',
  now()
from public.user_accounts a
where a.email = 'dev.company@example.com'
on conflict (user_id) do update
set status = 'approved',
    company_name = excluded.company_name,
    reviewed_at = now();

notify pgrst, 'reload schema';
