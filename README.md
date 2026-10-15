# SoraChi

以日文新手學習為主，逐步銜接 N5／N4 準備，也提供旅遊前可練習的簡單用語。

**線上雛形：** https://hanayukii.github.io/sorachi/

## 這一版

首頁以五十音為主要學習入口，另設基礎句型與獨立的旅遊常用語入口。學習區逐組練習並儲存進度；旅遊區依八種情境自由查閱，直接看關鍵字、讀音與中文，需要時再展開完整說法，不需完成課程或測驗。文字介紹保留為簡單補充。

視覺使用原創雲朵精靈，淡紫為主、水色輔助、杏橘色作為主要操作。白色留白與單一學習路徑優先於功能數量。

這是新手基礎課程雛形，尚未包含完整 N5/N4 課程或題庫。五十音目前涵蓋平假名、片假名各 46 個基本字；濁音、半濁音、拗音、促音、長音與書寫練習尚未加入。後續以新手學習為主，題庫作為練習補充。

## Beginner learning flow

- Kana: 20 groups (10 per script), each with 3–5 cards followed by a shuffled recognition quiz. Distractors stay within the taught group. Repeated completed attempts alternate character-to-reading and reading-to-character. The UI records practice rather than claiming long-term mastery, and encourages revisiting groups on a later day.
- Pronunciation: device speech synthesis explicitly selects an available Japanese voice. A missing Japanese voice or failed playback produces a visible fallback message. Audio quality and availability depend on the device; these are not reviewed human recordings. Isolated は/へ are synthesized as ハ/ヘ to avoid particle readings; を is synthesized as お while preserving its displayed spelling.
- Grammar: three micro-lessons cover noun sentences with は／です, questions with ですか, and spatial これ／それ／あれ. Each contains three explanation cards and two questions. Examples include romaji support and Chinese meanings; no kana completion gate is imposed.
- Travel phrasebook: independent `#travel` index and `#travel/<category>` pages cover asking for help, ordering, dining needs, credit card/Suica/cash payments, shopping, places, IC top-ups, and hotels/reservations. Keyword/romaji/Chinese panels are immediately visible; full expressions and device audio are collapsed by default. The drink-style supplement stays optional. Browsing never creates attempts, scores, or learning progress. Per-card audio reports status beside the selected example. Contextual feedback returns to the exact category. Previous `#study/t-*` routes and records remain compatible but are not the phrasebook entry points.
- Travel references: drink-style terminology checked against [Suntory rocks](https://www.suntory.co.jp/whisky/hibiki/time/drinkstyle/rocks.html) and [soda](https://www.suntory.co.jp/whisky/hibiki/time/drinkstyle/soda.html) guides. Top-up context checked against [JR East Suica charging guidance](https://www.jreast.co.jp/es/suica/chrg/index.html/); examples are original.
- Progress and first responses survive reload. All courses use the same history and contextual feedback entry points. A completed round is recorded once; clearing history preserves active course progress and completed-course status.
- Reference checks: [Japan Foundation kana chart](https://www.irodori.jpf.go.jp/assets/data/Kana_all.pdf), [Tokyo University of Foreign Studies spatial demonstratives](https://www.coelang.tufs.ac.jp/mt/ja/gmod/contents/explanation/011.html), and [MDN device voice availability](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis/getVoices). Lesson examples and questions were authored for this prototype.

## Simplified Jabiko features

- **Learning records:** each completed lesson keeps its date, first-response score, and which questions needed a retry. Local storage retains the latest 30 completions. Retrying never overwrites the first response. Existing progress is preserved; legacy attempts without first-response data are left unscored.
- **Feedback:** a small footer entry and an in-lesson report entry collect a category, up to 600 UTF-16 code units of text, and the originating lesson step. Preparing a report creates a GitHub issue draft link for this repository. It does not submit automatically. GitHub sign-in is required and submitted issues are public. Draft text is kept only in page memory and is lost on reload; scores and contact details are not attached.
- **Deletion:** records can be cleared after confirmation without resetting lesson progress or earned completion. Failed storage writes do not report a successful deletion.
- The app borrows Jabiko's local-first tracking and feedback patterns, not its React/Supabase implementation. Anonymous submissions, accounts, and cloud synchronization are not included.

Recommended next additions: a small review of initially missed questions; mixed recognition across previously learned kana rows; special sounds and reviewed pronunciation recordings. Full mock exams, streaks, and detailed statistics can wait until the course has enough content.

## 後續題庫的沿用原則

- 假名：先教完一小組字與讀音，再出題；干擾選項也限於已學的字。
- 基礎詞彙：依先備字音挑選；拗音、促音和長音分開引入。
- N5/N4：按已教詞彙與句型篩選，解說也改成新手能懂的語句，不直接按級數整包匯入。

## 本機預覽

無需安裝套件或建置；使用 Python 3 啟動靜態伺服器：

```sh
python3 -m http.server 4173 --bind 127.0.0.1 --directory dist
```

開啟 http://127.0.0.1:4173 。

## 檢查

需要 Node.js 22 或更新版本，不需要 npm 套件：

```sh
node --check dist/app.js
node --check dist/study.js
node scripts/check-content.mjs
node --test tests/*.test.mjs
```

測試以 DOM double 驗證答題、重試、接續進度與儲存失敗等行為；實際排版、鍵盤操作與完整課程流程另以瀏覽器檢查。

## 發佈

`main` 保存程式與測試；`gh-pages` 只發佈 `dist/`。GitHub Pages 的來源設定為 `gh-pages` 分支根目錄。

CSS、JavaScript 或任何發佈資源變更後，先執行：

```sh
node scripts/prepare-release.mjs
```

它會依檔案內容自動更新 `index.html` 的 JS/CSS `?v=`，並產生 `dist/release.json`（build ID、檔案 SHA-256、大小及 MIME）。版本不依賴提交 SHA，重跑結果相同。請一併提交產生的檔案；CI 以 `--check` 模式檢查，不會偷偷改檔。

先提交變更並推送 `main`，再執行：

```sh
./scripts/publish.sh
```

發佈腳本要求乾淨的 `main`，本機 HEAD 與 `origin/main` 一致，並等候**同一提交**的 push CI 成功；等待後再次檢查狀態，才推送 `gh-pages`。CI 包含語法、內容驗證、全部回歸測試及 release manifest 檢查。

發佈後等候 GitHub Pages 建置完成，再執行：

```sh
node scripts/verify-deploy.mjs --attempts 12
```

部署驗證會檢查網站入口、全部 manifest 資源與 release.json 的 HTTP 狀態、MIME、長度及完整雜湊，並確認不存在的資源回傳 404。`#travel` 等 hash 路由不會送到伺服器；頁面操作、版型與語音仍須另做瀏覽器 QA。

## 檔案

- `dist/index.html`：頁面入口與網站資訊。
- `dist/styles.css`：桌機與手機版型、配色與互動狀態。
- `dist/app.js`：首頁、文字介紹、共用成績紀錄、回報與本機進度。
- `dist/study.js`：課程畫面、打散測驗、日文合成語音與課程狀態。
- `dist/content.js`：獨立教材、穩定課程／題目／卡片 ID、內容版本與驗證。
- `dist/diagnostics.js`：公開回報用的版本與教材 ID 白名單，不包含身分或成績。
- `dist/kana-practice.js`：短輪混合練習、延後重考、字級複習狀態與進行中資料驗證。
- `dist/kana-hints.js`：92 個基本假名的兩種原創記憶提示。
- `dist/storage.js`：版本化本機資料、舊版遷移、成績合併與備份 primitives。
- `dist/release.json`：自動產生的發佈內容清單。
- `tests/content.test.mjs`、`storage.test.mjs`、`revision.test.mjs`、`deploy.test.mjs`：教材、資料、教材改版與發佈保護測試。
- `dist/assets/cloud-friend.png`、`cloud-complete.png`：本專案使用的原創 AI 生成角色與抱書完成姿勢。
- `tests/flow.test.mjs`：跨頁互動流程回歸檢查。
- `tests/study.test.mjs`：五十音、文法、重試、題序與語音狀態測試。

進度只存在目前瀏覽器，沒有帳號或跨裝置同步；清除網站資料也會移除紀錄。網站未加入分析追蹤。字型使用 Google Fonts，無法取得時會使用裝置的字型。

## 基礎 infra 實作順序與完成條件

- [x] **1. 教材獨立與內容檢查。** 五十音、文法、旅遊常用語、文字介紹均集中於 `content.js`；驗證穩定 ID、必要文字、讀音、中文、答案及干擾選項。調整內容時更新 snapshot 測試；不得為了讓測試通過而重設舊版遷移基準。
- [x] **2. 資料版本與舊進度相容。** `sorachi:data:v2` 以單一原子寫入保存 `learning`、`attempts`、`favorites`、`preferences` 與 guest identity。首次遷移從 `sorachi:first-lesson:v1` 讀取，保留舊 key 原文作備份，不再寫回它。成績保留當時題數、課名、內容版本及題目 ID；題庫改變不會重算舊成績。只有題目內容版本一致的進行中練習才會接續；不相容時重新開始該輪，保留完成狀態及歷史結果。
- [x] **3. CI 與可驗證的發佈。** main／PR 自動檢查、資源版本自動更新、同一提交 CI 成功才可發佈、線上逐檔比對。

儲存失敗不會宣稱已成功保存；讀取失敗、損壞或較新版本的主要資料會鎖住寫入，避免覆寫未知資料。修復瀏覽器存取權限後重新載入再試。history 現在保留最近 200 次，不是永久完整紀錄。寫入前會比對最後一次讀取／成功寫入的原始資料；若其他分頁已變更資料，舊分頁停止儲存並提示重新載入。這不是跨分頁合併，也不是鎖定交易；極短時間內兩個分頁同時通過比對的競態仍需後續以跨分頁鎖處理。

`DataStore` 提供可測試的本機 JSON 匯出／匯入介面：以穩定 attempt ID 合併紀錄，保留目前瀏覽器已有的進度及 guest identity、補上尚無進度的課程。重複匯入不重複增加同一紀錄；無效備份拒絕匯入。尚未提供使用者備份按鈕，也未接雲端。`favorites`／`preferences` 目前是資料預留欄位，沒有新增收藏或設定介面。

後續依序處理：備份／移轉操作介面 → 正式網域設定與舊站資料移轉 → 選定登入與資料服務 → 訪客紀錄認領、跨裝置合併、登出後隔離與刪除流程。更換網域會改變 localStorage 的來源，資料不會自動跟過去；需在切換前完成備份／移轉介面。這一批沒有建立帳號服務、資料庫或購買網域。Jabiko 的 Supabase auth、全站 Service Worker／快取清除機制不直接搬入 GitHub Pages 共用來源。


## Claude review 第一批（2026-10-16）

以完整 review 的建議為參考，逐項核對程式並補回歸測試；保留目前新手課程與獨立旅遊查閱，不擴充教材量。

| 項目 | 本批處理 | 範圍與限制 |
| --- | --- | --- |
| 舊分頁覆寫資料、清除紀錄後復活 | 偵測主要資料變更後拒絕舊分頁寫入，提供重新載入 | 不做自動合併；同步競態仍需 async lock |
| 主要資料含無效成績 | 保留原始資料並鎖住寫入 | 舊版資料遷移的寬鬆清理規則保持相容 |
| 手機答題、錯誤提示 | 短假名選項改成三欄、縮小測驗字卡、回饋原地更新，錯誤有文字 | 真實螢幕閱讀器與 iOS／Android 另需實機測試 |
| 完成文字介紹後返回 | 保留完成結果，只有明確「再看一次」才重新開始 | 使用 replaceState 修正舊路由，不新增往返循環 |
| 日文合成語音 | 調整日文聲音優先順序，取消播放後延遲與回呼失效保護 | 系統提供的聲音不同；未保證每台裝置音質相同 |
| 成績與下一課 | 顯示可辨認的答錯字／讀音、下一組按鈕，首頁列出分組進度 | 無安全題目對應的舊紀錄仍顯示題號 |
| は、指示詞與旅遊用字 | 主題助詞說明、題目干擾選項、補それ、少量旅遊文字修正 | 固定 legacy revision 基準不變；舊成績不重算 |
| 小型介面修正 | 日文字型、按鈕觸控範圍、完成摘要換行、初始載入提示 | 不更換角色或整體配色 |

暫緩：備份與匯入介面（含原始資料救援、匯入後刷新記憶體狀態、容量限制與摘要）、舊版 migration backup 在新 key 遺失時的復活處理、完整多分頁交易／合併、跨組混合複習、字型與圖片載入最佳化、登入與新網域移轉。這些需要各自完整設計，不與本批修正混在一起。

Jabiko 可參考的是語音播放取消後短暫等待、回報時附上有限診斷欄位及帳號流程的實際案例；不直接搬入全來源 Service Worker／cache 清除、無上限成績儲存、或未驗證 JSON。SoraChi 目前的教材版本保護、同一提交 CI 與逐檔部署驗證繼續保留。Claude 提到的「オ顯示ヲ說明」未在目前程式重現；僅將特例判斷改成依字元，避免把所有讀音 o 都當特殊助詞。


本批驗證：95 項 Node 回歸測試、教材檢查與語法檢查通過；另在獨立 localhost 來源以 375×667 瀏覽器視窗走過五十音答錯／重試／完成／成績紀錄、跨分頁更新警告與重新載入、文字介紹完成後瀏覽器返回。這是桌面瀏覽器的手機尺寸檢查，非真實手機或螢幕閱讀器實測。

## Issues #1–#7 補齊（2026-10-16）

依 [review 總表 #24](https://github.com/HanaYukii/sorachi/issues/24) 核對第一批與尚未完成的項目。

| Issue | 實作與驗證 | 尚待處理 |
| --- | --- | --- |
| #1 | 假名回饋縮成「正確答案：い＝i」，已在畫面內時不額外捲動。375×667 可同屏看到題目、五個選項、回饋與下一題；320×568 無水平溢出，最多一次向下捲動。原地更新回饋與焦點有回歸測試。 | iOS／Android 黏住 hover、VoiceOver／TalkBack 需實機測試。 |
| #2 | 沿用前批的寫入前原文比對與拒絕過期寫入。本批再以兩分頁重現：另一頁完成 3/5 後，舊頁切換假名會顯示警告，重新載入仍保留成績及錯字。 | 不宣稱原子交易或自動合併；#12、#21 必須另外設計合併與清除規則。 |
| #3 | 補三種文字混用的卡片例子、去掉指示詞題幹提示、補疑問句標點與語調說明；同步修正旅遊查閱與舊課程。固定 legacy revision 不變。 | 不採用無來源支持的概括說法，詳見下方來源與取捨。 |
| #4 | 預熱語音清單，標準本機 ja-JP 優先，Eloquence 名稱群延後選用，保留閒置同步播放及取消保護。本機 Chrome 155 的 Eddy 排第一、Kyoko 排第五；攔截實際 speak 參數，あ 與旅遊句均選 Kyoko。 | Safari 尚未驗證，issue 保持開啟。此檢查未評估實際發音與音質。 |
| #5 | 只打開第一張卡使用暫存草稿，不寫入進度或改變首頁推薦；實際翻卡／作答後才保存。重開已完成課程也不立即覆蓋舊結果。統一名稱，第一次答錯顯示字與讀音；新訪客的文字介紹入口移到主卡下，仍只有一個入口。 | 沒有可靠題目 ID 的舊成績繼續顯示題號。 |
| #6 | 前批已修正完成後返回不重開；本批完整 flow suite 持續覆蓋明確重練及不重複記錄。 | 無本批程式待辦。 |
| #7 | 進入回報前擷取當前版本、courseRevision 與打散後實際題目 ID；診斷採白名單並支援未保存的第一張卡。頁面明示會附上教材版本及 ID。 | 回報仍需使用者前往 GitHub 確認送出；沒有自動提交。 |

本批 118 項回歸測試包含私有草稿、舊 active 相容處理、語音清單預熱與挑選、診斷白名單、600 字中文回報 URL 小於 8 KB。瀏覽器 QA 使用隔離 localhost 來源；首次使用首頁、完成後紀錄、跨分頁衝突與回報診斷均已核對。假語音測試與攔截播放參數不等於真人聆聽。

教材取捨：課名用「名詞句：〜は〜です」，避免重新加入使用者不喜歡的口吻。保留分詞形式 `sen en`；不把可讀的分詞寫法當錯誤。加值改為「到有人櫃檯」，限定 7-Eleven／全家與支援設備，不擴大宣稱所有自助收銀機均不可加值。交通卡提醒先看店家支援標示，不宣稱所有卡都適用。

加值與交通卡來源：[7-Eleven](https://www.sej.co.jp/services/cash/traffic.html)、[全家](https://www.family.co.jp/services/payment/traffic_e_money.html)、[JR 東日本 Suica 加值](https://www.jreast.co.jp/suica/ic/use/chrg/)、[JR 東日本手機 Suica 設備說明](https://media.jreast.co.jp/articles/320)、[JR 西日本 ICOCA 範圍](https://www.jr-odekake.net/icoca/area/index.html)。服務依店家與設備而異。

下一批從 #8 開始；#17–#23 等正式網域／登入方案確定再處理。保持五十音主線與旅遊查閱分開，不在此批新增大量功能。


## 五十音複習與記憶提示（Issue #8）

五十音仍以每組認字卡為主。學過後，首頁與五十音列表提供短輪複習入口，一輪最多 5 個不同字：先取最近答錯的字，再補較久未練的已學字；不足 5 個就縮短，不用每天簽到或連續天數解鎖。答對即移出最近錯字，沒有冷卻期。「本次答對」不代表已長期記住。

同一輪混合「看字選讀音」與「看讀音選字」。選項從同組及已完成組別取用，優先加入形近字，同題排除相同讀音（例如 お／を、オ／ヲ）。首輪答錯會揭曉答案，直接前往下一題；輪末換方向重考一次，作答前不揭答案，仍錯就保留到下次，不要求一直重選直到答對。整組完成紀錄仍計算首輪第一次答案，延後重考不改分數；短輪複習只更新字級狀態，不假裝完成一整組課。

每個基本字提供「字形聯想」與「聲音連結」兩種提示，卡片一次只顯示一種，可按「換個記法」切換。切換提示不建立學習進度。聯想為原創輔助，並非字源或筆順，也沒有保證記憶效果；詞語只幫助連結聲音，不加入本輪考試範圍。讀音與基本字集核對[國際交流基金假名表](https://www.irodori.jpf.go.jp/assets/data/Kana_all.pdf)，保留 を／ヲ 的 o、は／へ 基本讀音 ha／he 與 ん／ン 的 n 說明。

複習 session 使用獨立 practice version、穩定題目 ID 與教材 revision。舊五十音進行中測驗安全重開，已完成狀態與原成績保留；舊字級錯誤狀態只從可靠歷史題目 ID 初始化，不用題號猜測，也不以舊初答成績覆蓋新的重考結果。最近紀錄上限由 30 輪增加到 200 輪，先前已截去的資料不會復原。清除成績與複習紀錄會結束未完成五十音練習，保留已完成狀態及其他課程進度；儲存失敗時保留記憶體中的原紀錄。

本批驗證：143 項 Node 回歸測試、教材檢查與語法檢查通過。隔離 localhost 瀏覽器已走過認字卡切換提示、首輪答錯、輪末換方向重考、重新載入接續、完成後保留首輪成績、短輪複習移除錯字；作者頁在 320 px 寬無水平溢出。這是桌面瀏覽器手機尺寸測試，未取代 iOS／Android、Safari 語音或報讀器實測。

新增「關於 SoraChi」與作者資訊，連到花雪（HanaYukii）的個人網站，介紹包含製作大量偶像相關翻譯素材的背景。依使用者決定，使用說明書／介紹文章等功能與流程較完整後再寫，目前沒有說明書頁面或入口。

本批完成後先停在 #8，交由使用者安排 Claude 再審；不自動接續 #9。待審重點為複習狀態與清除／重載的一致性、兩種記憶提示的正確性與可理解性，以及新手是否能自然找到複習入口。#4 的實機語音驗證、#9–#16 與網域／登入項目仍依總表保留。
