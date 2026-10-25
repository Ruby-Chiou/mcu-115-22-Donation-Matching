-- inet 轉文字會帶上網段，畫面只留位址本身。

create or replace function public.access_request_ip()
returns text
language plpgsql
stable
as $$
declare
  headers json;
  forwarded text;
  candidate text;
begin
  begin
    headers := current_setting('request.headers', true)::json;
  exception when others then
    return '';
  end;

  forwarded := coalesce(
    headers->>'cf-connecting-ip',
    headers->>'x-real-ip',
    headers->>'x-forwarded-for',
    ''
  );
  candidate := btrim(split_part(forwarded, ',', 1));
  if candidate = '' then
    return '';
  end if;

  begin
    return host(candidate::inet);
  exception when others then
    return '';
  end;
end;
$$;

revoke all on function public.access_request_ip() from public, anon, authenticated;

update public.agency_access_grants
set client_ip = host(client_ip::inet)
where client_ip ~ '/';
