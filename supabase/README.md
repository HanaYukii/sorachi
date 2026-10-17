# SoraChi 登入、雲端備份與回報

僅部署到 HanaYukii 個人 Free organization 的 SoraChi 專案 `hrmozzvwycnxdmrhagua`。Jabiko 專案只作為設計參考，不共用資料表或登入憑證。

## 本批範圍

- Google OAuth / PKCE；所有學習功能仍可用訪客身分操作。
- 訪客資料沿用 `sorachi:data:v2`，每個帳號另用 `sorachi:acct:<user id>:v1`。登入不自動搬入訪客資料、不自動上傳；帳號頁可確認後帶入。
- 手動雲端備份：先查看／帶入雲端版本，再儲存合併結果。資料庫以 revision compare-and-swap 拒絕舊裝置覆寫。保留目前最多 200 筆成績；這不是 #21 規劃的自動跨裝置同步。
- 登出可保留或移除目前帳號的本機紀錄（包含損壞資料救援另存的 quarantine 副本），訪客與其他帳號不受影響。只在登出成功後移除；失敗時會提示。
- 匿名或登入者都能站內回報，內容只供管理者處理。最多 600 字、聯絡方式選填；只附版本／教材 ID，不附答案與學習紀錄。

## 部署設定

1. 執行 `migrations/202610180001_accounts_feedback.sql`。
2. Auth Site URL：`https://sorachi.app/`；redirect allowlist：精確 `https://sorachi.app/#account`。
3. Google Cloud 專案 `sorachi-app` 的獨立 Web OAuth client：來源 `https://sorachi.app`，callback `https://hrmozzvwycnxdmrhagua.supabase.co/auth/v1/callback`。Google Client Secret 只放 Supabase Auth provider。
4. 部署 `functions/sorachi-feedback/index.ts`。依 `config.toml` 關閉 legacy JWT gateway 檢查，由函式驗證登入 JWT；訪客以 Turnstile 驗證。前端仍使用 publishable key。
5. Turnstile widget 限定 `sorachi.app`，Managed 模式、不啟用 pre-clearance。Secret key 僅放 Edge Function secret `TURNSTILE_SECRET_KEY`；公開 site key 放 `dist/cloud-config.js`。
6. `dist/cloud-config.js` 只能放 Supabase URL、`sb_publishable_...` 和 Turnstile site key。任何 OAuth secret、service-role / secret key 都不得進入 Git 或前端。

回報函式限制 origin、輸入長度及本文串流大小，驗證 challenge 的 hostname 與 action。已登入請求以 Auth 服務確認 user id，無效登入不降級成訪客。submission UUID 支援回應遺失後重送；與原回報內容不符時拒絕。資料庫不給 anon 或 authenticated 任何回報表權限。

## 驗證

```sh
node --test tests/account.test.mjs tests/cloud.test.mjs tests/feedback-edge.test.mjs tests/storage.test.mjs tests/flow.test.mjs
node supabase/check-public-access.mjs
```

在專案 SQL Editor 執行 `tests/accounts.sql`：以 transaction 建立兩個合成測試帳號，驗證 owner isolation、stale revision、偽造 owner、直接刪除及匿名權限，最後 rollback，不留下測試資料。2026-10-18 已執行，結果 PASS。

公開 API 驗收確認匿名讀取兩個表、寫入備份都被拒絕；回報函式拒絕其他 origin 與無效本文。

2026-10-18 正式站 Chrome 已完成 Google 授權並回到「我的帳號」，重新整理仍保持登入；以首次登入的空白帳號資料完成雲端儲存與重新讀回，沒有帶入訪客進度。首次驗收曾因 provider 密鑰不符而失敗，使用者重新設定後成功。失敗回跳現在顯示可理解的提示、移除網址的錯誤資訊與失效授權碼；不顯示 provider 原始錯誤，也不修改學習紀錄。

Turnstile 在自動操作的 Chrome 曾出現 `300030`；改由使用者親自完成驗證並送出後，正式站已顯示「已收到你的回報」。內容明確標示為部署驗收測試，沒有填入聯絡方式。仍未做 Safari／手機實機與所有擴充套件環境驗收。

## SDK 來源

前端延遲載入官方 `@supabase/supabase-js@2.108.2` UMD，避免導入新打包流程。已與 npm 官方 tarball 比對完整檔案，並驗證 registry 的 SHA-512 integrity。MIT license 同放 `dist/vendor/`。

`dist/vendor/supabase-2.108.2.js` SHA-256：`c123f7e874934778b7d89fee7dce8de26c858a2c3a92fd7a3f870394a6a2f91f`。

## 後續限制

- 尚未實作自動同步、完整雲端歷史、帳號刪除自助頁及訪客資料 claimedBy 標記；不能因此關閉 #20–#22 的全部需求。
- 本機資料沒有加密；共用電腦應使用獨立瀏覽器設定檔或訪客模式。不要宣稱登出會清除使用者下載的備份檔。
- 回報信箱在 SoraChi 專案的 Table Editor → `sorachi_feedback`；目前沒有通知信或回覆管理台。
- Free 方案可能有暫停與用量限制。連線失敗會保留本機學習；回報草稿在目前分頁保留，重新整理會消失。
