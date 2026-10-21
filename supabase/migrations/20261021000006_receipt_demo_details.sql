-- 示範收據補上預覽用明細。只填目前還是空白的假資料，不覆寫已填過的內容。

update public.donor_receipts
set
  "agencyNameEn" = 'Sunshine Children Home',
  "orgTaxId" = '87654321',
  "approvalNo" = '衛部救字第1150001234號',
  "donorIdNo" = 'A123456789',
  "donorAddress" = '台北市中正區示範路1號',
  "donorPhone" = '0912345678',
  "note" = '冬季衣物，供安置使用',
  "accountName" = '陽光兒童之家',
  "postalAccount" = '12345678',
  "orgPhone" = '02-2345-6789',
  "orgFax" = '02-2345-6790',
  "orgEmail" = 'sunshine@example.org',
  "orgAddress" = '台北市大安區希望路10號',
  "handlerName" = '林小安'
where "receiptNo" = 'RC-2026-0001'
  and "orgTaxId" = '';

update public.donor_receipts
set
  "agencyNameEn" = 'Evergreen Care Association',
  "orgTaxId" = '11223344',
  "approvalNo" = '衛部救字第1140005678號',
  "donorIdNo" = 'A123456789',
  "donorAddress" = '台北市中正區示範路1號',
  "donorPhone" = '0912345678',
  "note" = '成人紙尿褲，供長照使用',
  "accountName" = '長青關懷協會',
  "postalAccount" = '87654321',
  "orgPhone" = '02-8765-4321',
  "orgFax" = '02-8765-4322',
  "orgEmail" = 'evergreen@example.org',
  "orgAddress" = '新北市板橋區長青街20號',
  "handlerName" = '陳志明'
where "receiptNo" = 'RC-2026-0002'
  and "orgTaxId" = '';

update public.donor_receipts
set
  "agencyNameEn" = 'Demo Welfare Organization',
  "orgTaxId" = '55667788',
  "approvalNo" = '衛部救字第1150002468號',
  "donorIdNo" = 'A123456789',
  "donorAddress" = '台北市中正區示範路1號',
  "donorPhone" = '0912345678',
  "note" = '狗飼料，供機構犬隻使用',
  "accountName" = '示範社福機構',
  "postalAccount" = '50001234',
  "orgPhone" = '02-2500-1000',
  "orgFax" = '02-2500-1001',
  "orgEmail" = 'demo-agency@example.org',
  "orgAddress" = '台北市中山區示範路88號',
  "handlerName" = '王小慈'
where "receiptNo" = 'RC-2026-0003'
  and "orgTaxId" = '';

update public.donor_receipts
set
  "agencyNameEn" = 'Demo Welfare Organization',
  "orgTaxId" = '55667788',
  "approvalNo" = '衛部救字第1150002468號',
  "donorIdNo" = 'A123456789',
  "donorAddress" = '台北市中正區示範路1號',
  "donorPhone" = '0912345678',
  "note" = '洗衣精，供環境清潔使用',
  "accountName" = '示範社福機構',
  "postalAccount" = '50001234',
  "orgPhone" = '02-2500-1000',
  "orgFax" = '02-2500-1001',
  "orgEmail" = 'demo-agency@example.org',
  "orgAddress" = '台北市中山區示範路88號',
  "handlerName" = '王小慈'
where "receiptNo" = 'RC-2026-0004'
  and "orgTaxId" = '';
