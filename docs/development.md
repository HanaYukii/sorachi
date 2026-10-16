# SoraChi 開發與發佈

純靜態網站：`dist/` 就是原始碼，不需要建置或安裝套件。`main` 放程式與測試，`gh-pages` 只發佈 `dist/`。

## 本機預覽與檢查

```sh
python3 -m http.server 4173 --bind 127.0.0.1 --directory dist
node --test tests/*.test.mjs
node scripts/check-content.mjs
node scripts/prepare-release.mjs --check
```

需要 Node.js 22 以上。測試通過不代表教材正確：日文、中文與字形說明要另外人工核對。

## 發佈

1. `node scripts/prepare-release.mjs`：依檔案內容更新 `index.html` 的 `?v=`，並產生 `dist/release.json`，一起提交。
2. 推送 `main` 後執行 `./scripts/publish.sh`：要求乾淨的 `main`、HEAD 等於 `origin/main`、同一提交的 CI 成功；推送 `gh-pages` 後會等 Pages 送出這一版，逐檔驗證通過才印出 `Published and verified build <buildId>`。
3. 需要重新驗證時：`node scripts/verify-deploy.mjs --attempts 18 --interval-ms 10000`。

### 自訂網域

把網域寫進 `dist/CNAME` 再照一般流程發佈，不要在 GitHub Settings 設定（會在 `gh-pages` 直接提交 CNAME，之後的 subtree push 會被拒）。換網域等於換 origin，使用者的進度不會跟過去：切換前先引導使用者「下載備份」，再到新網域「從備份檔還原」，並更新 `scripts/verify-deploy.mjs` 的預設網址。細節見 #17、#18。

### 回滾

- 一般情況：`git revert <壞的提交>` → `node scripts/prepare-release.mjs` → 推送 → `./scripts/publish.sh`。
- 緊急情況（`main` 一時過不了 CI）：

  ```sh
  git ls-remote origin refs/heads/gh-pages
  git push --force-with-lease=refs/heads/gh-pages:<目前 gh-pages 的 SHA> origin $(git subtree split --prefix=dist <好的提交>):refs/heads/gh-pages
  git worktree add ../sorachi-good <好的提交>
  node scripts/verify-deploy.mjs --dir ../sorachi-good --attempts 18 --interval-ms 10000
  git worktree remove ../sorachi-good
  ```

  事後仍要在 `main` 上 revert。改過 storage 格式或遷移的版本只往前修，不回滾。回滾步驟尚未實際演練。

### 共用 origin 的規則

`hanayukii.github.io` 上還有其他專案，共用 localStorage 與儲存配額：不加 Service Worker、不清 Cache Storage、不呼叫 `localStorage.clear()`／`sessionStorage.clear()`，key 一律以 `sorachi:` 開頭，也不要請使用者「清除網站資料」。`tests/assets.test.mjs` 會檢查這些規則。

## 資料

- 主要資料是 `sorachi:data:v2`，一次寫入整份。第一次載入時從 `sorachi:first-lesson:v1` 遷移，舊 key 保留原文。
- 寫入前比對上次讀到的原文；其他分頁改過資料時，這個分頁停止儲存並提示重新載入（不是合併，也不是交易）。
- 資料損壞、缺欄位或版本較新時鎖住寫入、不覆寫。紀錄頁提供下載原始資料，以及另存到 `sorachi:data:v2:quarantine:<時間>` 後重新開始。
- 成績紀錄保留最近 200 筆，題目改版不重算舊成績；只有教材 revision 一致的進行中練習才會接續。
- 備份還原：紀錄依 attempt ID 合併；每課保留最近一次完成與成績、較大的練習次數。任一邊清除過紀錄時，錯字只留較晚清除之後的作答，複習與未完成的五十音練習只留清除較晚那一邊的。還原後重新載入頁面。

## 教材原則

- 先教再考；五十音的干擾選項只用已學過的字。
- 拗音、促音、長音分開引入；N5／N4 內容依已教的詞彙與句型挑選，不整包匯入。
- 旅遊區是查閱，不設門檻、不計分；店家、票務等規定只寫簡短提醒，以現場說明為準。
- 新增或修改教材後，更新 `tests/content.test.mjs` 的內容快照；`legacyCourseRevision` 是固定的遷移基準，不要重新產生。

## 檔案

- `dist/content.js`：教材（五十音、句型、旅遊常用語、文字介紹）、穩定 ID、revision 與 `validate()`。
- `dist/study.js`：課程與旅遊頁面、測驗流程、語音。
- `dist/app.js`：首頁、文字介紹、學習紀錄、備份、回報。
- `dist/kana-practice.js`、`dist/kana-hints.js`：五十音練習與複習、記憶提示。
- `dist/storage.js`：本機資料、遷移、鎖定與備份合併。
- `dist/diagnostics.js`：回報附帶的版本與教材 ID。
- `art/`：角色原圖與生成提示（不發佈）；`dist/assets/` 是轉出的 WebP 與圖示。

## 來源

- 假名表：[國際交流基金](https://www.irodori.jpf.go.jp/assets/data/Kana_all.pdf)
- 指示詞：[東京外國語大學](https://www.coelang.tufs.ac.jp/mt/ja/gmod/contents/explanation/011.html)
- 裝置語音：[MDN getVoices](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis/getVoices)
- 喝法：[Suntory ロック](https://www.suntory.co.jp/whisky/hibiki/time/drinkstyle/rocks.html)、[ソーダ割り](https://www.suntory.co.jp/whisky/hibiki/time/drinkstyle/soda.html)
- 加值與交通卡：[7-Eleven](https://www.sej.co.jp/services/cash/traffic.html)、[全家](https://www.family.co.jp/services/payment/traffic_e_money.html)、[JR 東日本 Suica 加值](https://www.jreast.co.jp/suica/ic/use/chrg/)、[JR 西日本 ICOCA](https://www.jr-odekake.net/icoca/area/index.html)
- 車票與座位：[JR 東日本旅客指南](https://www.jreast.co.jp/E/downloads/pdf/jr-east_guide_e.pdf)
