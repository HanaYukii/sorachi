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

需要 Node.js 18 或更新版本，不需要 npm 套件：

```sh
node --check dist/app.js
node --check dist/study.js
node --test tests/*.test.mjs
```

測試以 DOM double 驗證答題、重試、接續進度與儲存失敗等行為；實際排版、鍵盤操作與完整課程流程另以瀏覽器檢查。

## 發佈

`main` 保存程式與測試；`gh-pages` 只發佈 `dist/`。GitHub Pages 的來源設定為 `gh-pages` 分支根目錄。

CSS 或 JavaScript 變更後，請更新 `index.html` 中對應資源的 `?v=` 版本值，避免瀏覽器繼續沿用舊快取。

先提交變更並推送 `main`，再執行：

```sh
./scripts/publish.sh
```

發佈後仍需等候 GitHub Pages 建置完成，確認線上首頁與資源載入成功。

## 檔案

- `dist/index.html`：頁面入口與網站資訊。
- `dist/styles.css`：桌機與手機版型、配色與互動狀態。
- `dist/app.js`：首頁、文字介紹、共用成績紀錄、回報與本機進度。
- `dist/study.js`：五十音與入門句型、打散測驗、日文合成語音與課程狀態。
- `dist/assets/cloud-friend.png`、`cloud-complete.png`：本專案使用的原創 AI 生成角色與抱書完成姿勢。
- `tests/flow.test.mjs`：跨頁互動流程回歸檢查。
- `tests/study.test.mjs`：五十音、文法、重試、題序與語音狀態測試。

進度只存在目前瀏覽器，沒有帳號或跨裝置同步；清除網站資料也會移除紀錄。網站未加入分析追蹤。字型使用 Google Fonts，無法取得時會使用裝置的字型。
