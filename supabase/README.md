# Supabase Migration 教學（做法二）

這份文件教你用 **Supabase CLI** 管理資料庫結構，而不是每次到 Dashboard 貼 SQL。

你們的雲端專案 ref（從網址看出來）：`wxryryyiakzkeeoorlrq`  
（Dashboard → Project Settings → General → Reference ID）

---

## 0. 先搞懂三個詞

| 詞 | 白話 |
|---|---|
| **CLI** | 在終端機（PowerShell）打指令的工具，不是網頁。 |
| **Migration** | 一支「資料庫變更腳本」，檔名有時間戳，例如 `20261018000001_xxx.sql`。 |
| **db push** | 把「本地還沒套用過的 migration」依序套到**已連結的雲端資料庫**。 |

流程想像：

```
你改 migrations/*.sql  →  git 存起來  →  supabase db push  →  雲端資料庫更新
```

之後請盡量**不要**再在雲端 SQL Editor 直接改表結構（會跟 migration 紀錄對不起來）。

---

## 1. 安裝（本專案已用 npm 裝好）

專案已把 `supabase` 放在 `devDependencies`。請用：

```powershell
cd c:\mcu-115-22-Donation-Matching
npx supabase --version
```

看到版本號（例如 `2.121.0`）即可。  
（也可寫成 `npm run supabase -- --version`，見下方 scripts。）

> 不需要另外裝 Docker，也能做「連雲端 + db push」。  
> Docker 只有在你要 `supabase start`（本機一整套假 Supabase）時才需要。課堂可先跳過。

---

## 2. 登入 CLI（每人做一次）

1. 瀏覽器打開：https://supabase.com/dashboard/account/tokens  
2. 產生一個 **Access Token**（可取名 `school-pc`）  
3. 在專案目錄執行：

```powershell
npx supabase login
```

依提示貼上 token。成功後本機會記住登入狀態。

---

## 3. 把本專案「連結」到雲端資料庫（每人／每台電腦做一次）

```powershell
npx supabase link --project-ref wxryryyiakzkeeoorlrq
```

會問 **Database password**（建立專案時設的資料庫密碼，不是 anon key）。  
若忘記：Dashboard → Project Settings → Database → Reset database password。

連結成功後，資料夾會有本機設定（含敏感資訊時勿亂貼到公開聊天）。

---

## 4. 看目前 migration 狀態

```powershell
npx supabase migration list
```

會列出：

- **Local**：你電腦 `supabase/migrations/` 裡有哪些  
- **Remote**：雲端已經「登記跑過」哪些  

兩邊對齊才正常。

---

## 5. 重要：你們雲端「已經手動建過表」怎麼辦？

會員相關表你們先前已在 SQL Editor 建好了。  
若直接 `db push`，CLI 可能再跑一次（我們的腳本多用 `if not exists`，多數情況還行），但**歷史紀錄**可能混亂。

### 建議第一次這樣對齊（標記「這些已經套用過了」）

```powershell
npx supabase migration repair --status applied 20261018000001
npx supabase migration repair --status applied 20261018000002
npx supabase migration repair --status applied 20261018000003
npx supabase migration list
```

意思是：告訴雲端「這三支我早就跑過了，別重跑」。  
之後**只有新的 migration** 才會被 `db push` 套用。

> 若 `repair` 參數寫法隨版本不同而報錯，執行：  
> `npx supabase migration repair --help`  
> 依說明操作。

---

## 6. 平常怎麼「新增」一次資料庫變更？

例如要加一個欄位：

```powershell
npx supabase migration new add_donor_nickname
```

會多一支空的：

`supabase/migrations/時間戳_add_donor_nickname.sql`

用編輯器寫入 SQL，例如：

```sql
alter table public.donor_profiles
  add column if not exists "nickname" text;
```

存檔 → 交給組員 review → 再：

```powershell
npx supabase db push
```

可先預覽：

```powershell
npx supabase db push --dry-run
```

---

## 7. 種子資料（測試用假資料）

- 結構變更 → `migrations/`  
- 測試資料 → `seed.sql`（選用）

套用種子（小心，會插入資料）：

```powershell
npx supabase db push --include-seed
```

感謝狀檔案本體仍在 **Storage**，不是 SQL 能完整代替的。

---

## 8. 組員協作規則（請遵守）

1. **改表結構只走 migration**，不要在雲端 Table Editor／SQL Editor 偷改（除非緊急，改完要用 `db pull` 補檔）。  
2. **一次一人 `db push`**，避免搶著推。  
3. Migration 檔 **不要改已經 push 過的內容**；要改就再 `migration new` 一支。  
4. 舊手貼 SQL 已移除；只維護 `migrations/` 與（選用）`seed.sql`。

---

## 9. 本專案現有 migration

| 檔名 | 內容 |
|---|---|
| `20261018000001_member_center_core.sql` | 個人資料、站內信、大頭貼 bucket |
| `20261018000002_member_acknowledgements.sql` | 收據、感謝狀檔、公開感謝 |
| `20261018000003_member_notification_settings.sql` | 通知設定 |
| `20261020000001_donor_donation_history.sql` | 捐助歷史：`donor_daily_donations.donor_uid` |
| `20261021000001_agency_receipt_issuance.sql` | 收據／感謝狀對應 `donationId` |
| `20261021000002_receipt_seals.sql` | 收據大章、小章網址 |
| `20261021000003_receipt_detail_fields.sql` | 收據明細（統編、地址、戶名、經辦人） |
| `20261021000004_public_thank_donation_link.sql` | 感謝牆對應捐助，並補上已通過的公開感謝 |
| `20261021000005_donation_tracking_no.sql` | 捐助物流單號，供跑馬燈廣播 |
| `20261021000006_receipt_demo_details.sql` | 示範收據補上預覽用明細 |

---

## 10. 常用指令速查

```powershell
npx supabase --version
npx supabase login
npx supabase link --project-ref wxryryyiakzkeeoorlrq
npx supabase migration list
npx supabase migration new 說明用英文或拼音
npx supabase db push --dry-run
npx supabase db push
```

npm scripts（等同上面）：

```powershell
npm run sb:login
npm run sb:link
npm run sb:migration:list
npm run sb:push
npm run sb:push:dry
```

---

## 11. 你現在請依序做（檢查清單）

- [ ] `npx supabase --version` 有版本號  
- [ ] `npx supabase login` 成功  
- [ ] `npx supabase link --project-ref wxryryyiakzkeeoorlrq` 成功  
- [ ] `npx supabase migration list` 看得到三支 local  
- [ ] 因為表已存在：對三支執行 `migration repair --status applied ...`  
- [ ] 再 `migration list` 確認 Remote 也打勾  
- [ ] 之後要改 DB：只 `migration new` + `db push`

卡住時把終端機完整錯誤訊息貼給組員或助教／AI 即可。

官方文件：https://supabase.com/docs/guides/deployment/database-migrations
