# 程式盤點清單（#81）

定期清掉沒在用的程式、樣式與過期說明，順手做小的重構。每輪另開一個有範圍的 issue 並引用 #81，做完就關，不無限重構。

## 什麼時候做

- 一批主要功能做完、上線之後。
- 持續開發期間，每月一次。

## 每輪步驟

1. **基準**：最新 main、`git status` 乾淨、CI 通過；記下開始的 commit。
2. **找候選**
   - CSS：每個 class 有沒有 `dist/*.js` 或 `index.html` 產生它，包括 template 裡拼出來的 class（例如 `tone-${...}`）和 `classList.toggle`。
   - JS：沒人讀的變數、函式、匯出；前面已經 return 掉、走不到的分支。
   - 文件：README 和 `docs/` 有沒有還在描述已經拿掉的功能；引用測試寫測試標題，不寫行號。
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
- 以下舊紀錄的處理：
  - `sanitize()` 的舊格式路徑；
  - `retryLabels` 對舊紀錄的備用寫法；
  - 未知課程的紀錄保留；
  - 學習紀錄裡「舊版」的文字。
- 只給測試用的匯出：`store.importBackup`、`KanaPractice.firstCorrect`、`Study.nextCourse`、`Content.revisionOf`。

## 2026-10-17 第一輪（到 main 46b66f2）

| 做了什麼 | commit |
| --- | --- |
| 刪掉沒有任何畫面會產生的樣式：29 條規則（舊首頁、prototype 標籤、course-sections 等），另從字級下限的選擇器清單拿掉兩個，以及 `--radius`；也刪掉沒用到的程式：`clock`／`leaf` 圖示、`Study.bind` 沒讀的 `escape`／`friend`、`ROWS`。測試不再允許已經不存在的 `hintChoices.clear()`。 | 5c1cfc9 |
| 句型測驗裡走不到的五十音分支拿掉。課程卡不再畫只有舊旅遊課才有的關鍵字、完整說法和延伸說法，內容檢查改成拒收這些欄位。 | 6c1b065 |
| 修過期文字：設定頁的「換個記法」、空紀錄頁的按鈕（改成「看五十音表」）、README 與文件。kana-practice-audit 的測試引用改成標題。 | f5deb96 |
| `iso()` 只留 KanaPractice 一份；兩個一模一樣的題目 helper 合成 `roundItem`。 | 46b66f2 |

驗證：內容檢查、全部測試（261 個）、prepare-release，並在瀏覽器開過主要頁面，沒有錯誤訊息。

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
