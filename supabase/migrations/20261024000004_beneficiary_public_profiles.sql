-- 捐助者個資沿用既有 public.donor_profiles（會員專區已在讀寫），不另建第二張表。
-- 這支只新增民眾可看的受助機構公開資料。不含經辦人姓名、私人信箱與證件。

create table if not exists public.beneficiary_public_profiles (
  "id"                 bigint generated always as identity primary key,
  "organizationName"   text not null unique,
  "city"               text not null,
  "image"              text not null default '',
  "introImages"        text[] not null default '{}',
  "establishedYear"    text not null default '',
  "registrationLabel"  text not null default '',
  "serviceArea"        text not null default '',
  "serviceTargets"     text[] not null default '{}',
  "publicPhone"        text not null default '',
  "mission"            text not null default '',
  "background"         text not null default '',
  "verified"           boolean not null default false,
  "createdAt"          timestamptz not null default now(),
  "updatedAt"          timestamptz not null default now()
);

grant select on public.beneficiary_public_profiles to anon, authenticated;

alter table public.beneficiary_public_profiles enable row level security;

drop policy if exists "public read beneficiary profiles" on public.beneficiary_public_profiles;
create policy "public read beneficiary profiles"
  on public.beneficiary_public_profiles
  for select
  to anon, authenticated
  using (true);

do $seed$
declare
  p text := 'https://images.unsplash.com/';
  q text := '?auto=format&fit=crop&w=960&h=640&q=80';
begin
  insert into public.beneficiary_public_profiles (
    "organizationName", "city", "image", "introImages", "establishedYear", "registrationLabel",
    "serviceArea", "serviceTargets", "publicPhone", "mission", "background", "verified"
  )
  values
  (
    '示範社福機構', '臺北市',
    p || 'photo-1469571486292-0ba58a3f068b' || q,
    array[p || 'photo-1469571486292-0ba58a3f068b' || q, p || 'photo-1488521787991-ed7bbaae773c' || q, p || 'photo-1593113598332-cd288d649433' || q],
    '2014', '府社團字第 103000123 號', '臺北市中山區、信義區', array['社區家庭', '急難戶'],
    '02-2500-1000', '把物資送到正在等待的家庭',
    '示範社福機構長期協助臺北市社區家庭整理生活物資與急難需求，並在平台上公開可捐助的項目。捐助者可由此了解服務範圍與公開聯絡方式。',
    true
  ),
  (
    '暖陽社會福利協會', '新北市',
    p || 'photo-1516307365426-bea591f05011' || q,
    array[p || 'photo-1516307365426-bea591f05011' || q, p || 'photo-1559027615-cd4628902d4a' || q, p || 'photo-1576765608535-5f04d1e3f289' || q],
    '2011', '府社團字第115001號', '新北市板橋區、中和區', array['獨居長者', '低收入家庭'],
    '02-2345-6789', '讓社區裡的人被看見、被照顧',
    '暖陽社會福利協會以新北市社區關懷為主，協助獨居長者與低收入家庭整理日常所需，並媒合鄰近住家可以就近送達的生活物資。',
    true
  ),
  (
    '愛心關懷基金會', '桃園市',
    p || 'photo-1559027615-cd4628902d4a' || q,
    array[p || 'photo-1559027615-cd4628902d4a' || q, p || 'photo-1469571486292-0ba58a3f068b' || q, p || 'photo-1503676260728-1c00da094a0b' || q],
    '2008', '府社字第115002號', '桃園市桃園區', array['弱勢家庭', '災後安置戶'],
    '03-456-7890', '把關懷留在需要的地方',
    '愛心關懷基金會位於桃園，協助弱勢家庭與安置戶媒合物資。住在桃園附近的捐助者，可以依服務地區判斷是否方便面交或寄送。',
    true
  ),
  (
    '竹北家庭支持協會', '新竹縣',
    p || 'photo-1476703993599-0035a21b17a9' || q,
    array[p || 'photo-1476703993599-0035a21b17a9' || q, p || 'photo-1503676260728-1c00da094a0b' || q, p || 'photo-1488521787991-ed7bbaae773c' || q],
    '2016', '府社團字第105018號', '新竹縣竹北市', array['雙薪家庭', '學齡兒童'],
    '03-550-2188', '讓竹北的家庭就近得到支持',
    '竹北家庭支持協會服務新竹縣竹北市的學齡家庭，整理課後照顧、生活用品與臨時協助。機構資料供民眾辨識住家附近的受助單位。',
    true
  ),
  (
    '希望兒少關懷中心', '臺中市',
    p || 'photo-1488521787991-ed7bbaae773c' || q,
    array[p || 'photo-1488521787991-ed7bbaae773c' || q, p || 'photo-1476703993599-0035a21b17a9' || q, p || 'photo-1469474968028-56623f02e42e' || q],
    '2006', '府社福字第114023號', '臺中市西屯區、北屯區', array['兒少', '主要照顧者'],
    '04-2222-3333', '陪伴孩子穩定生活',
    '希望兒少關懷中心提供臺中兒少生活支持與照顧者協助，資格文件已完成確認。捐助者可在此閱讀機構如何使用物資，並以公開電話聯繫。',
    true
  ),
  (
    '博幼基金會', '南投縣',
    p || 'photo-1503676260728-1c00da094a0b' || q,
    array[p || 'photo-1503676260728-1c00da094a0b' || q, p || 'photo-1476703993599-0035a21b17a9' || q, p || 'photo-1488521787991-ed7bbaae773c' || q],
    '2002', '已於主管機關完成財團法人登記', '南投縣偏鄉社區', array['偏鄉學童', '資源不足家庭'],
    '049-291-1180', '教育脫貧，讓知識帶希望回家',
    '博幼基金會於 2002 年成立，以提升偏鄉資源不足孩子的學習成就與自信心為使命，藉由社工輔導及課輔教育，培育社區師資、開發學習教材，讓偏鄉孩子有充足的學習資源。',
    true
  ),
  (
    '臺南安平長照中心', '臺南市',
    p || 'photo-1576765608535-5f04d1e3f289' || q,
    array[p || 'photo-1576765608535-5f04d1e3f289' || q, p || 'photo-1516307365426-bea591f05011' || q, p || 'photo-1593113598332-cd288d649433' || q],
    '2013', '府社團字第102077號', '臺南市安平區、中西區', array['長者', '家庭照顧者'],
    '06-299-4500', '讓長者在熟悉的社區被照顧',
    '臺南安平長照中心協助長者與家庭照顧者整理生活與照護物資，服務範圍集中在安平與中西區，方便附近居民判斷是否就近捐助。',
    true
  ),
  (
    '高雄港都福利協會', '高雄市',
    p || 'photo-1593113598332-cd288d649433' || q,
    array[p || 'photo-1593113598332-cd288d649433' || q, p || 'photo-1469571486292-0ba58a3f068b' || q, p || 'photo-1576765608535-5f04d1e3f289' || q],
    '2009', '府社團字第098221號', '高雄市前鎮區、苓雅區', array['港區家庭', '臨時安置戶'],
    '07-333-4567', '把港口邊的需要接起來',
    '高雄港都福利協會服務前鎮與苓雅一帶的家庭和臨時安置戶，公開服務地區與聯絡電話，讓高雄在地捐助者可以先確認距離再決定捐助方式。',
    true
  ),
  (
    '宜蘭家庭資源中心', '宜蘭縣',
    p || 'photo-1469474968028-56623f02e42e' || q,
    array[p || 'photo-1469474968028-56623f02e42e' || q, p || 'photo-1500530855697-b586d89ba3ee' || q, p || 'photo-1516307365426-bea591f05011' || q],
    '2015', '府社團字第104056號', '宜蘭縣宜蘭市、礁溪鄉', array['兒童', '新住民家庭'],
    '03-932-7700', '讓宜蘭的家庭找得到資源',
    '宜蘭家庭資源中心整理兒童與新住民家庭的生活需求，服務據點在宜蘭市與礁溪。民眾可依縣市篩選，找到住家附近的受助單位。',
    true
  ),
  (
    '花蓮光復關懷站', '花蓮縣',
    p || 'photo-1500530855697-b586d89ba3ee' || q,
    array[p || 'photo-1500530855697-b586d89ba3ee' || q, p || 'photo-1469474968028-56623f02e42e' || q, p || 'photo-1593113598332-cd288d649433' || q],
    '2018', '府社團字第107033號', '花蓮縣光復鄉、花蓮市', array['災後家庭', '社區居民'],
    '03-870-2211', '災後也要把日常照顧接回來',
    '花蓮光復關懷站協助光復鄉與花蓮市的災後家庭重整生活物資，並公開機構地址所在的縣市，方便鄰近民眾辨識與聯繫。',
    true
  )
  on conflict ("organizationName") do nothing;
end
$seed$;
