# SoraChi 開發與發佈

純靜態網站：`dist/` 就是原始碼，不需要建置或安裝套件。`HanaYukii/sorachi` 的 `main` 放程式與測試，`HanaYukii/sorachi-site` 的 `gh-pages` 只發佈 `dist/` 到 https://sorachi.app/ 。原 repo 的 `gh-pages` 保留為舊站，不再推送新版本。

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
2. 推送 `main` 後執行 `./scripts/publish.sh`：要求乾淨的 `main`、HEAD 等於 `origin/main`、同一提交的 CI 成功；推送 `sorachi-site` 的 `gh-pages` 後會等 Pages 送出這一版，逐檔驗證通過才印出 `Published and verified build <buildId>`。
3. 需要重新驗證時：`node scripts/verify-deploy.mjs --attempts 18 --interval-ms 10000`。

### 自訂網域

2026-10-18 採 #17 做法 Y：正式站由 `HanaYukii/sorachi-site` 的 `gh-pages` 提供，原始碼與 CI 仍在 `HanaYukii/sorachi`。`scripts/publish.mjs` 固定把通過同一提交 CI 的 `dist/` 推到正式站 repo；驗證預設 https://sorachi.app/ 。`dist/CNAME` 隨原始碼提交，勿在 GitHub Settings 另存網域造成發佈分支分岔。

舊站 https://hanayukii.github.io/sorachi/ 保留 HTTP 200，凍結於來源提交 `693902f`（發佈分支 `e72b833395dac9a1087129fdd6ba46c4a86ea07c`）。不要將含 CNAME 的新版推到原 repo 的 `gh-pages`，否則舊網址會轉址、讀不到原有瀏覽器資料。舊站頁尾提供「學習紀錄與備份」入口；使用者以原瀏覽器下載備份，在新站還原。只使用既有的檔案合併機制，不自動傳送 localStorage、也不把資料放進網址。

Cloudflare DNS：四筆 GitHub Pages A（185.199.108–111.153）、四筆 AAAA（2606:50c0:8000–8003::153）、www CNAME 指向 hanayukii.github.io，皆為 DNS only、TTL 300。GitHub 帳號已驗證 sorachi.app，保留 `_github-pages-challenge-HanaYukii` TXT；HTTPS 由 GitHub Pages 提供。網域續約與 DNS 在 Cloudflare 管理。

### 回滾

- 一般情況：`git revert <壞的提交>` → `node scripts/prepare-release.mjs` → 推送 → `./scripts/publish.sh`。
- 緊急情況（`main` 一時過不了 CI）：

  ```sh
  git ls-remote https://github.com/HanaYukii/sorachi-site.git refs/heads/gh-pages
  git push --force-with-lease=refs/heads/gh-pages:<目前 gh-pages 的 SHA> https://github.com/HanaYukii/sorachi-site.git $(git subtree split --prefix=dist <好的提交>):refs/heads/gh-pages
  git worktree add ../sorachi-good <好的提交>
  node scripts/verify-deploy.mjs --dir ../sorachi-good --attempts 18 --interval-ms 10000
  git worktree remove ../sorachi-good
  ```

  事後仍要在 `main` 上 revert。改過 storage 格式或遷移的版本只往前修，不回滾。

- 2026-10-16 演練過一般情況：
  - `git revert 3f8bfa6`（只改記憶提示文字和測試，沒動 storage）。生成檔 `dist/index.html`、`dist/release.json` 會衝突，先取 HEAD 版本再跑 `node scripts/prepare-release.mjs`。
  - 推送後發佈：撤銷版 build `68d908bb` 約 2 分鐘上線，線上確認變回舊提示。
  - 再 revert 一次還原，回到原本的 build `85b560b3`。
- 推送後馬上發佈，可能查不到剛建立的 CI run：GitHub API 有 60 秒快取。publish 會拒絕並提示重試，等一分鐘再跑即可。

### 共用 origin 的規則

`hanayukii.github.io` 上還有其他專案，共用 localStorage 與儲存配額：不加 Service Worker、不清 Cache Storage、不呼叫 `localStorage.clear()`／`sessionStorage.clear()`，key 一律以 `sorachi:` 開頭，也不要請使用者「清除網站資料」。`tests/assets.test.mjs` 會檢查這些規則。

## 資料

- 主要資料是 `sorachi:data:v2`，一次寫入整份。第一次載入時從 `sorachi:first-lesson:v1` 遷移，舊 key 保留原文。
- 寫入前比對上次讀到的原文；其他分頁改過資料時，這個分頁停止儲存並提示重新載入（不是合併，也不是交易）。
- 資料損壞、缺欄位或版本較新時鎖住寫入、不覆寫。紀錄頁提供下載原始資料，以及另存到 `sorachi:data:v2:quarantine:<時間>` 後重新開始。
- 成績紀錄保留最近 200 筆，題目改版不重算舊成績；只有教材 revision 一致的進行中練習才會接續。
- 備份還原：紀錄依 attempt ID 合併；每課保留最近一次完成與成績、較大的練習次數。任一邊清除過紀錄時，錯字只留較晚清除之後的作答，五十音／句型複習與未完成的五十音練習只留清除較晚那一邊的。清除時間會排在上一次清除和這個瀏覽器記下的作答與成績時間之後（時鐘倒退或同一毫秒清除兩次也一樣；年份超出 9999 的日期不算），所以清除前做的備份不會被當成比較新。還原後重新載入頁面。

## 句型課的順序與先備

- 句型課照 `Content.grammar` 的順序教，完成頁的「下一課」也照這個順序。
- `Content.lessonPresentation` 是純顯示用的中文課名與人工分段例句，不參與課程 revision；48 堂句型都有白話課名，33 堂課的 77 張卡有人工分組（含單字配對及動詞變化）。每組依序是日文、羅馬音、中文／功能提示，完整例句、整句讀音及意思仍沿用原教材；分段不能取代整句。第一堂單字卡透過 `previews` 指向本課既有例句，先呈現完整目標句再列單字，兩者各有對應喇叭及播放狀態。`kinds` 明確區分單字、短語、動詞變化、混合例子與用法整理；不由標點自動猜類型。單字／變化清單每組保留日文、讀音及意思，完整句子仍先整句呈現再拆解。`notes` 可把補充說明收合，但主規則保持可見。增加分段時必須逐組核對，並跑測試確認串回的日文與讀音符合原卡片；沒有分段資料的課程顯示完整例句。不要把新題目或語意變更藏在這裡。
- `lessonPresentation.writing` 是逐課核對的漢字與假名標音，鍵必須是原例句或分組的完整字串。值由原樣文字與 `[漢字, 假名讀音]` 組成，讀音串回後必須完全等於原文；用原生 ruby 顯示，送假名保留在正文。只影響說明卡，不改朗讀、測驗、教材 revision；不在執行時猜漢字或切詞。羅馬音與中文仍保留。48 堂課都已盤點：44 堂共 269 個例句／分組字串使用漢字或數字標音，另外 4 堂指示詞與地點詞維持自然假名寫法（空映射表示已檢查）。日期、時間、金額使用常見阿拉伯數字，例如 4月、1日、3時；依當課語境標讀音，不做單字全域替換。
- `lessonPresentation.focus` 記錄 `[類別, 文法或讀法重點]`；目錄及課內頁首以原教材 `course.title` 作為文法主標題，白話 `displayTitle` 放在「用法／單字」輔助列，避免例句情境蓋過文法。`cardFocus` 以穩定卡片 ID 標示當張的 `[作用, 重點]`，例如「肯定句對照」「疑問句」「單字準備」。48 堂／153 張都須有對應，不從課程標題或標點猜測當張句型。`cardTitles` 可修正顯示標題，使比較用例句與課程目標不混淆；以上皆為顯示資料，不改題目或 revision。
- `Content.lessonPlan` 記錄每課的 `unit`（句型頁的單元標題，同一單元的課要排在一起）、`requires`（要先學的課，只能是前面的課）、`words`／`grammar`（這課新教的詞與句型）、`review`（每題答錯時回看的卡片），以及移植題的 `sources`。
- `validate()` 會檢查例句、正確答案與題幹裡的假名，只用這課與先備課教過的詞。新增課程時先寫好 lessonPlan，檢查不過就表示用了還沒教的詞。
- 限制：檢查是把教過的詞從句子裡拿掉、看還剩什麼，所以完全由教過的詞拼成的新詞（例如 どこか）不會被抓到。數字 に、ご 和 じ、はん 這類很短的詞讓盲點變大：學過數字後，助詞 に（えきに）和 ごはん（ご＋はん）都會直接通過，之後教助詞 に 的課要人工核對。分鐘與日期的 ふん、ぷん、がつ、にち，以及 いい、はい 也是這類短詞。干擾選項可以是刻意的錯誤形式，不檢查。
- Jabiko 題目的盤點與移植紀錄見 [jabiko-inventory.md](jabiko-inventory.md)。
- 旅遊卡裡講到服務規定的句子，依 [travel-sources.md](travel-sources.md) 列的官方頁面核對；規定改了要同時更新卡片和清單。
- 句型小複習（`#grammar-review`）保存在 `learning.study.grammarReviewSession`，重載保留題序、選項、首答與目前位置；不呼叫 `record()`、不改課程成績。題目從完成的句型課挑，最多 5 題、每課最多 2 題（只完成兩課時 3 題）；以穩定題目 ID 記錄最近一次獨立作答結果，錯題優先；同題看完答案立即重試不移出錯題，下次獨立答對才移出。舊歷史只在沒有較新題目狀態時初始化。上一輪第一次就答對的題排到最後。答錯時打開 `lessonPlan.review` 指的那張卡。

## 教材原則

- 假設讀者沒有日文或文法基礎。名詞、助詞、動詞等術語第一次出現時，用白話和當課例子解釋；解答先說清楚本題，不順帶塞入尚未教的用法。
- 學習入口先說從哪裡開始、怎麼操作；羅馬字等補充說明可收合，保留需要時查閱的方式。
- 先教再考；五十音的干擾選項只用已學過的字。
- 拗音、促音、長音分開引入；N5／N4 內容依已教的詞彙與句型挑選，不整包匯入。
- 旅遊區是查閱，不設門檻、不計分；店家、票務等規定只寫簡短提醒，以現場說明為準。
- 新增或修改教材後，更新 `tests/content.test.mjs` 的內容快照；`legacyCourseRevision` 是固定的遷移基準，不要重新產生。

## 檔案

- `dist/content.js`：教材（五十音、句型、旅遊常用語、文字介紹）、穩定 ID、revision 與 `validate()`。
- `dist/navigation.js`：共用頁首、區域導覽與路由標題；來源返回和學習狀態仍由原模組管理。
- `dist/study.js`：課程與旅遊頁面、測驗流程、語音。
- `dist/app.js`：首頁、文字介紹、學習紀錄、備份、回報。
- `dist/kana-practice.js`、`dist/kana-hints.js`：五十音練習與複習、記憶提示。
- `dist/storage.js`：本機資料、遷移、鎖定與備份合併。
- `dist/diagnostics.js`：回報附帶的版本與教材 ID。
- `art/`：角色原圖與生成提示（不發佈）；`dist/assets/` 是轉出的 WebP 與圖示。
- 定期盤點程式與文件的步驟、一定要保留的相容處理：[maintenance.md](maintenance.md)。

## 來源

- 假名表：[國際交流基金](https://www.irodori.jpf.go.jp/assets/data/Kana_all.pdf)
- 指示詞：[東京外國語大學](https://www.coelang.tufs.ac.jp/mt/ja/gmod/contents/explanation/011.html)
- 裝置語音：[MDN getVoices](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis/getVoices)
- 喝法：[Suntory ロック](https://www.suntory.co.jp/whisky/hibiki/time/drinkstyle/rocks.html)、[ソーダ割り](https://www.suntory.co.jp/whisky/hibiki/time/drinkstyle/soda.html)
- 加值與交通卡：[7-Eleven](https://www.sej.co.jp/services/cash/traffic.html)、[全家](https://www.family.co.jp/services/payment/traffic_e_money.html)、[JR 東日本 Suica 加值](https://www.jreast.co.jp/suica/ic/use/chrg/)、[JR 西日本 ICOCA](https://www.jr-odekake.net/icoca/area/index.html)
- 車票與座位：[JR 東日本旅客指南](https://www.jreast.co.jp/E/downloads/pdf/jr-east_guide_e.pdf)

## Local continuity (issues #69–#72)

- Grammar review sessions include a version, stable question IDs and course revisions. Incompatible or malformed sessions are discarded; completed lessons and historical scores remain intact. Clearing review resets both kana and grammar review, not normal grammar lessons.
- Travel bookmarks use stable phrase-card IDs. `favoriteChanges` stores per-card additions/removals; newer changes win, removal wins timestamp ties, and explicit removals beat old backup lists without change metadata. Local changes advance the timestamp when clicks share a millisecond.
- `preferences.ttsRate` uses the existing protected storage writer; failed writes keep the previous saved rate and show the existing storage warning. `preferences.kanaHints` (a hint choice per character) is only kept for older data and backups since #35 removed the choice: import still merges it per character (local wins a conflict), and nothing reads it.
- `lastGrammarId` changes only after meaningful lesson activity, not when opening a first card. The next action resumes that unfinished lesson, otherwise uses teaching order; completed learners can review. Opening a running review again resumes it.
- User study protocol: [beginner-usability.md](beginner-usability.md). This is a test script, not evidence that real beginners have participated.

## 新版提示與隨機選課

- `prepare-release.mjs` 把所有發佈檔案（包含圖片與頁面文字）算成 `sorachi-version`；計算時先清空標記，避免循環雜湊。`release.json` 仍獨立驗證每個實際檔案。
- `update-notice.js` 以開頁時內嵌的版本作基準，載入時、每 5 分鐘、回到分頁及恢復連線時讀取同站 `index.html`；使用 no-store 與時間參數，兩次檢查至少相隔 60 秒，隱藏分頁不輪詢。10 秒逾時、離線、無效頁面與重新導向均安靜忽略。
- 有新版只顯示「有新版本，點此更新」，不自動刷新。更新控制項在 `#app` 外，切換課程不會把提示洗掉；不使用 Service Worker、不清除共用 origin 的快取或儲存。未保存進度、回報草稿與只在記憶體的隨機題目會在點擊更新時提醒；正常課程靠原有即時儲存接續。
- 每個句型單元有「隨機進一課」，抽取範圍只在該單元，避開目前課程與同次開頁的上一次抽選。課程已有未完成測驗時先回說明，保留題序、選項與首答；已完成課程保留成績，另開閱讀草稿。最後一張說明卡及完成頁都有「再隨機進一課」，不強迫先做題，也不把純閱讀算成測驗完成。原有「隨機練 5 題」維持獨立入口。
- 本機更新驗收使用獨立 4209 埠副本，僅把輪詢時間縮短；模擬版本替換後出現提示，點擊刷新仍留在同課第 2 張，提示消失。另測單元收合時直接選課、讀完說明換另一課、320px 與 1280px 排版。未在正式站修改使用者資料。

## 基礎刷題

- 首頁第四張卡進入 `#drill`，混合 48 堂基礎句型的 150 題與 50 題獨立加題，共 200 題（單字、助詞、句型），不要求先完成課程或選分類。是基礎練習，不是完整 N4／N5 模擬考。
- 每次洗牌走完題庫才重新洗牌，避免跨輪連續同題；選項也洗牌。每題只計第一次作答，顯示解釋後可直接下一題，不限題數。只保存目前題、有限題序和總計，長時間作答不會累積無限紀錄。
- 「結束這次練習」顯示本次答對數，可繼續；未答題不列入總數。狀態保存在 `learning.study.drill`，重新整理仍保留同題、選項順序、首答與累計；首頁顯示「接著刷題」。不寫入課程完成、成績或錯題。儲存失敗仍可在分頁內練習，但顯示既有未儲存警告；更新前會提醒。
- 與既有 5 題隨機練習共用題目及解答呈現；原有學習、複習與旅遊流程保留。

## 刷題圖像與食物卡（2026-10-17）

- `art/cloud-drill.png` 使用內建 image_gen，參考 `art/cloud-kana.png`，改成持答題板與鉛筆的同一角色；完整提示見 `art/cloud-drill-prompt.txt`。保留透明背景，以 cwebp -q 85 轉出 128／256／512 三種尺寸。
- 旅遊新增 `food` 情境：4 張卡、12 個菜單常見名稱，漢字有假名、各詞有羅馬音、中文及獨立播放，並沿用搜尋／收藏。關鍵字播放只從登記的 food 卡取詞，括號內假名送語音；沒有猜測讀音。
- 加卡後搜尋「飯」「有麵嗎」現在有真正的食物結果；保留「這樣就好」不應誤找出所有含「好」的卡片。單字拆解的常見語尾不因題庫變大而變成稀有主題。
- 後續 #88：依 Jabiko 5752419 的純題池、固定當次設定及儲存降級設計，規劃刷題引擎與受保護本機接續；仍沿用 SoraChi 資料保護，不搬登入或分類介面。#89：重新盤點目前 48 課已教考點後小批加題，與 #41 的詞彙小課分開。兩項已於下一批完成，規格與驗收見下節。


## 刷題接續與第一批題目（#88、#89）

- `drill.js` 是純題池與狀態轉移模組，參考 Jabiko `5752419` 的 `sessionPools.ts` 與固定當次題序設計；不移植 React hooks、模式選擇或登入。`drill-bank.js` 放獨立加題，來源與教材盤點見 [jabiko-inventory.md](jabiko-inventory.md)。
- domain version 1，穩定 question ID 加每題 revision，題目／解答／讀音變更會改 revision。題序只保存尚未出現的題目，因此新增題在下輪加入；排序改變不影響舊輪。剩餘題目或目前題被刪除／改版時，重開本次練習並提示，不重算舊成績。持久化大小只隨題池大小增加，不隨作答次數無限增加。
- `DataStore` 在載入、匯入及寫入時驗證刷題結構。未知新版、損壞欄位／選項／日期鎖住整份原文；保留現有原始資料下載與救援。跨分頁仍採原文比對保護，不宣稱原子跨分頁交易。寫入失敗的作答只留在這個分頁，最後一次成功保存的資料不動。
- 學習紀錄的清除會同時結束刷題；`clearedAt` 晚於上一次清除與本輪更新時間。每輪帶 `startedAt`、`updatedAt`，匯入時只接續晚於雙方最新清除時間開始的練習，取較新整輪（同時刻本機優先），不加總兩份備份的計數。清除後新開的輪可以保留，清除前的備份不能復活舊輪。
- `tests/drill.test.mjs`、`flow.test.mjs` 覆蓋固定題序、兩輪不重複、首答、重載／結束／接續、版本升級、失敗寫入、跨分頁、雙向備份與清除；原有課程 revision 相容測試繼續執行。回報只附已登記題目 ID／revision，不附答案與進度。
- 第一批 18 題：6 題 Jabiko 自撰題改寫、12 題本站自撰；所有考點都對應現有課。日文附假名與羅馬音，中文解釋先回答本題；不宣稱完整 N4／N5 模擬考。不加分類、複習演算法或跨裝置同步。
- 本批本機驗收：299 項 Node 測試與教材檢查通過；CUA 使用獨立 localhost:4213，確認首頁進入、答錯後重載同題同順序、結束後重載結果、繼續與鍵盤 Enter 操作。抽到新題「老師的包包」「買車票」，320px 無水平溢出，日文與羅馬音改為上下排列；1280px 及主控台檢查無錯誤。未做 Safari／iOS／Android 實機驗證。


## 刷題第二批：補至 200 題（2026-10-17）

- 使用者要求補至 200 題；新增 32 題本站自撰題，獨立加題累計 50 題（6 題 Jabiko 改寫、44 題本站自撰），加上原有課內 150 題，共 200 題。仍從同一入口混合出題。
- 範圍涵蓋指示詞視角、問答配對、否定等義、時間與日期讀法、目的地／動作地點、位置、形容詞、原因／轉折、くる 的變化、請求與許可。使用已教詞與句型，每題有中文解釋、關聯課與來源；日文題幹／選項附假名及羅馬音。
- 原有 168 題的 ID 與 revision 完全保留；新增題不打亂已保存的一輪，在下一輪洗牌才加入。測試鎖住前版題目摘要，並以完整 168 → 200 的接續情境驗證；32 題也逐題跑顯示、作答解釋及重載接續。
- 本批驗收：301 項 Node 測試與教材檢查通過；獨立 localhost:4214 透過備份還原載入新題，檢查 320px 最長雙空格題幹無水平溢出、答錯解釋與重載首答保留；1280px 桌面與主控台無錯誤。未做手機實機驗證。
