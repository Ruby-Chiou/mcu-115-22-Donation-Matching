-- 受助機構自己填官方網站。捐助地圖與此公開視圖共用登記地址與座標。

alter table public.agency_profiles
  add column if not exists "websiteUrl" text not null default '';

alter table public.agency_profiles
  add column if not exists latitude double precision;

alter table public.agency_profiles
  add column if not exists longitude double precision;

comment on column public.agency_profiles."websiteUrl" is
  '受助機構自行填寫的官方網站，會出現在公開頁與捐助地圖。';

drop view if exists public.agency_public_profiles;
create view public.agency_public_profiles
with (security_invoker = false) as
select
  uid,
  "agencyName",
  city,
  image,
  "introImages",
  "establishedYear",
  "registrationLabel",
  "serviceArea",
  "serviceTargets",
  "contactPhone",
  mission,
  background,
  "verificationStatus",
  "defaultAddress",
  "websiteUrl",
  latitude,
  longitude
from public.agency_profiles
where "accountStatus" = 'ACTIVE'
  and "verificationStatus" = 'approved';

comment on view public.agency_public_profiles is
  '從 agency_profiles 投影民眾可看的欄位，含登記地址、官網與地圖座標。';

revoke all on public.agency_public_profiles from public;
grant select on public.agency_public_profiles to anon, authenticated;

-- 只補還沒改過的示範地址，避免蓋掉機構後來自己填的資料。
update public.agency_profiles as profiles
set
  "defaultAddress" = places.address,
  latitude = places.latitude,
  longitude = places.longitude
from (
  values
    ('示範社福機構', '臺北市中山區南京東路二段132號', 25.0517841::double precision, 121.5336704::double precision),
    ('暖陽社會福利協會', '新北市板橋區中山路一段161號', 25.0125017::double precision, 121.4654477::double precision),
    ('愛心關懷基金會', '桃園市桃園區縣府路1號', 24.9932463::double precision, 121.3009813::double precision),
    ('竹北家庭支持協會', '新竹縣竹北市縣政二路103號', 24.8268655::double precision, 121.0157225::double precision),
    ('希望兒少關懷中心', '臺中市西屯區惠來路二段101號', 24.16284::double precision, 120.64095::double precision),
    ('博幼基金會', '南投縣埔里鎮安四街131號', 23.9666667::double precision, 120.9691462::double precision),
    ('臺南安平長照中心', '臺南市安平區古堡街108號', 23.0034521::double precision, 120.1597942::double precision),
    ('高雄港都福利協會', '高雄市前鎮區中山三路43號', 22.6047112::double precision, 120.3078006::double precision),
    ('宜蘭家庭資源中心', '宜蘭縣宜蘭市縣政北路1號', 24.7304129::double precision, 121.7631313::double precision),
    ('花蓮光復關懷站', '花蓮縣光復鄉中華路257號', 23.6694087::double precision, 121.4232928::double precision)
) as places(name, address, latitude, longitude)
where profiles."agencyName" = places.name
  and (
    profiles."defaultAddress" = ''
    or profiles."defaultAddress" like '%示範路%'
  );

update public.agency_profiles
set "websiteUrl" = 'https://www.boyo.org.tw/boyoV2/'
where "agencyName" = '博幼基金會'
  and "websiteUrl" = '';

notify pgrst, 'reload schema';
