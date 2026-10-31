# 程式盤點清單（#81）

定期清掉沒在用的程式、樣式與過期說明，順手做小的重構。每輪另開一個有範圍的 issue 並引用 #81，做完就關，不無限重構。

## 什麼時候做

- 一批主要功能做完、上線之後。
- 持續開發期間，每月一次。

## 每輪步驟

1. **基準**：最新 main、`git status` 乾淨、CI 通過；記下開始的 commit。
2. **找候選**
   - CSS：每個 class 有沒有 `dist/*.js` 或 `index.html` 產生它，包括 template 裡拼出來的 class（例如 `tone-${...}`）和 `classList.toggle`。組合的選擇器（`A + B`、`A > B`）要確認畫面上真的有這個組合，不是兩個 class 各自存在就算。
   - JS：沒人讀的變數、函式、匯出；前面已經 return 掉、走不到的分支。
   - 文件：README 和 `docs/` 有沒有還在描述已經拿掉的功能。引用測試寫測試標題、引用程式寫函式名稱，不寫行號；把舊行號換成標題時，行號可能是更早的版本寫的，前後版本都查，並讀過那個測試確認真的在測這件事。
3. **分類**：確認可刪、可以重構、仍需查證。
   - 文字搜尋零筆不等於沒用。還要查動態 class、`data-action` 事件、字串 key、全域匯出、發佈腳本與測試入口。
4. **不動舊資料相容**：見下一節。真的要拿掉，另開 issue，寫淘汰理由和資料保護方式。
5. **一批一個目的**，各自 commit，可以單獨回退。
   - 每批都跑 `node scripts/check-content.mjs`、全部測試、`node scripts/prepare-release.mjs`。
   - 動到畫面的，用瀏覽器看過。
   - 明確的 bug 另外修，不混在純整理裡。

## 一定保留（舊資料相容）

- `preferences.kanaHints` 的合併：舊備份裡的提示選擇，現在不影響畫面。
- `LEGACY_KEY`／`forgetLegacy`、`legacyCourseRevision`、`retiredTitles`。
- `#done` 的保護和 `#study/t-*` 的轉址（舊的旅遊課網址）。
- 清除標記 `reviewClearedAt`：清除之後，舊備份不能把錯字、複習和未完成的練習帶回來。
- 跨分頁保護：寫入前比對原文的衝突鎖、`storage` 事件的警告。
- 讀不懂或較新的資料：鎖住不寫、提供下載，重新開始時先存到 quarantine key。
- 以下舊紀錄的處理：
  - `sanitize()` 的舊格式路徑；
  - `retryLabels` 對舊紀錄的備用寫法；
  - 未知課程的紀錄保留；
  - 學習紀錄裡「舊版」的文字。
- 只給測試用的匯出：`store.importBackup`、`DataStore.mergeAttempts`、`KanaPractice.firstCorrect`、`Study.nextCourse`、`Content.revisionOf`、`Content.rows`（程式內部仍在用，從外面只有測試讀）。

## 2026-10-17 第一輪（b6ae022 之後）

| 做了什麼 | commit |
| --- | --- |
| 刪掉沒有任何畫面會產生的樣式：29 條規則（舊首頁、prototype 標籤、course-sections 等），另從字級下限的選擇器清單拿掉兩個，以及 `--radius`；也刪掉沒用到的程式：`clock`／`leaf` 圖示、`Study.bind` 沒讀的 `escape`／`friend`、`ROWS`。測試不再允許已經不存在的 `hintChoices.clear()`。 | 5c1cfc9 |
| 句型測驗裡走不到的五十音分支拿掉。課程卡不再畫只有舊旅遊課才有的關鍵字、完整說法和延伸說法，內容檢查改成拒收這些欄位（連同店員問句和完整說法的語音用字）。 | 6c1b065 |
| 修過期文字：設定頁的「換個記法」、空紀錄頁的按鈕（改成「看五十音表」）、README 與文件。kana-practice-audit 的測試引用改成標題。 | f5deb96 |
| `iso()` 只留 KanaPractice 一份；兩個一模一樣的題目 helper 合成 `roundItem`。 | 46b66f2 |
| 審查後補：kana-practice-audit 有四個測試引用指錯，改正（舊行號有的照 7ced429、有的照 b93513a，也有指在測試上一行的，兩個版本都要查），程式引用改成函式名稱；README 的記憶提示說明；拿掉只有舊課程卡會用的 `.phrase-label + .grammar-example` 和內容檢查裡讀 `polite` 的一處。 | 「Correct the kana audit's test citations and fill the checklist」 |

驗證：內容檢查、全部測試、prepare-release，並在瀏覽器開過主要頁面，沒有錯誤訊息。審查用 641 個畫面狀態比對前後的 HTML，除了刻意改的兩段文字完全相同。

## 下一輪候選（這輪沒做）

- 作答回饋文字有三份，已經不一致：只有隨機練習會附正確答案的讀音。要不要統一屬於行為改變，另開 issue。
- 這兩類 HTML 有好幾份：
  - 選項按鈕：句型三份、五十音兩份；
  - 答題後捲動並移動焦點的段落：三份。
  - 可以抽成共用，但要一起確認讀屏的行為。
- `app.js` 的頁面標題表和 Study 的頁名各寫一份，新增頁面要改兩個地方。
- `styles.css` 最後的無障礙下限（#15）蓋掉前面約 20 個設定，另外有幾條規則完全被後面覆蓋。合併時要逐頁看畫面。
- 旅遊分類副標題的字級：下限要 14px，但權重較高的規則讓它維持 13px，要決定用哪一個。
- 關於頁的 768px 雲朵圖只在很高的像素密度才會用到；`friend()` 的預設大小 252 沒有人用。
- `diagnostics.js` 沒有回報自己的版本。

## 2026-10-17 第二輪：首頁改版後的失效樣式（#87）

基準為主線 69647ad，接續 #77／#84／#86 的本機整合 91e7382。刪除舊 hero、path-card、review-entry 與相關手機覆寫；保留仍在使用的 study-review-entry。核對 JS 模板、動態 class 與 index 後才刪除。未改儲存、舊路由或資料相容行為。

前述候選的進展：#84 已將頁首與頁面標題收斂至 Navigation；#86 共用 grammarFeedback 和 showFeedback，但各模式的保存、選項與焦點政策仍分開。其餘候選保留待後續具體範圍，不為減少行數繼續拆分。

## 2026-10-18 第三輪：路徑網址改版後（#91）

基準為 `68aa7ae`（網址與字級調整完成，339 項測試通過）。本輪只整理新增路由與相關失效樣式：

- 頁面名稱、所屬區塊與種類集中於 `Routes.page`；Navigation 保留頁首的呈現。移除重複的路由清單和 Routes 對 Navigation 的反向依賴，靜態頁生成只需要 Content 與 Routes。路由查詢改用同一組登記資料，不在每個連結重建清單。
- 刪除 `.aqua-label`、`.header-link`；已核對 JS 模板、動態 class、classList 操作與產生的 HTML，沒有畫面使用。保留 `tone-*`、`*-entry` 等動態樣式。
- 清掉流程測試中未使用的 URL helper，整理 release 腳本縮排。資料格式、清除標記、儲存鎖、舊課程／備份處理與 OAuth callback 均保留。
- 以改版前後程式各自載入 Content／Routes／Navigation，比對全部 131 個登記頁面的 metadata、頁面種類和 header HTML，完全相同。既有行為測試照常執行，不以重構後的實作重新定義預期。

驗證：教材檢查、339/339 Node 測試及 deterministic release 檢查通過；174 個本機資源與全部目錄入口逐檔相符。CUA 重載後確認首頁、設定頁及鍵盤焦點，按鈕仍有 3px 外框；本輪延續前述 320px／1280px 與前後頁驗收。

本輪不繼續拆分 Study、儲存或測驗模組；後續有具體需求再另立範圍。

## 2026-11-01 第四輪：四個小遊戲（#96）

基準 `8db351f`。先獨立提交新手提示與手機回饋修正，再清掉點餐不可達分支、沒有使用的照片 class 與重複 CSS；保留 storage 相容。範圍、玩法判斷與驗收詳見 [games-review.md](games-review.md)。本輪不繼續拆分整個 Study 或新增遊戲框架。
