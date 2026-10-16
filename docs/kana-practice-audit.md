# 五十音練習：Jabiko 對照與壓力情境（#36、#37）

2026-10-16 依程式逐行核對。Jabiko 是唯讀參考，以 commit `31c96ab` 為準；SoraChi 以撰寫時的 main 為準，程式位置用「檔案:行」標示，日後改版可能位移。

## Jabiko 對照（#37）

| 機制 | Jabiko 做法 | SoraChi 做法 | 結論 |
| --- | --- | --- | --- |
| 干擾項與形近字 | 先取 14 組形近字（kanaDrill.ts:28-45），再取同行（110-112），再從本字往後繞整張表（113-116）；固定 3 個干擾項，候選是全部 104 字，不管學過哪幾行，也沒有亂數 | 只從本行和已完成的行、同一種假名取（kana-practice.js:27, 41-42）；強／鬆兩層形近字計分；2 個同行、最多 1 個跨行，最多 4 個選項（30-34） | 保留 SoraChi（只出學過的字）；補上 Jabiko 有、SoraChi 沒有的形近組 ま／も、ク／フ、ク／ワ |
| 同讀音排除 | 三種題型都排除同 romaji（kanaDrill.ts:177, 211-212, 259） | 用讀音去重（kana-practice.js:19, 30），を／ヲ 讀 o；重新載入時再驗一次 | 保留 SoraChi；補上點名同音字的測試 |
| 選項排列 | 字典序排序後依題號旋轉（kanaDrill.ts:131-135；practice.ts:167-172, 412-415），正解位置可從題號推算 | 每題洗牌一次並存檔，重新整理順序不變（kana-practice.js:35, 46） | 保留 SoraChi |
| 錯題進出 | 不另存狀態，重播作答紀錄推導（srs.ts:16-23, 56-77）；答錯就進、答對一次就出（#525） | 每個字一筆 `kanaReview`，每次作答覆寫；歷史只補缺的字（kana-practice.js:101-110） | 語意相同，保留 SoraChi |
| 錯題排序 | 依最近一次答錯，由舊到新（srs.ts:96-101）；一次跑完整個錯題池 | 錯題優先，再依 lastSeen 由舊到新，最多 5 個（kana-practice.js:115-116） | 保留 SoraChi |
| 冷卻期 | 沒有。移除原因寫在 srs.ts:8-14：舊版答錯後冷卻 2 天，一次練很多題的新手看到空的弱點清單，回報「錯題沒被記錄」 | 沒有，剛答錯就能複習 | 兩邊一致 |
| 練習中保存 | 進行中的一輪不保存，重新整理就重開（usePracticeSession.ts:355, 369-373；sessionPools.ts:374-376） | 整個 session 每次作答和下一題都存，載入時逐欄驗證，有獨立的 practiceVersion | 保留 SoraChi |
| 多分頁 | 沒有 storage 事件；每次寫入先讀再 append（storage.ts:23-35, 53），不互蓋但畫面會過時 | 寫入前比對原文；收到 storage 事件就警告；衝突後停止寫入，不自動合併（storage.js:138-158） | 保留 SoraChi；append 合併要改 schema，暫不引入 |
| 寫入失敗 | 靜默改用記憶體（storage.ts:44-48） | 保留上次成功的內容並警告；清除失敗會回滾 | 保留 SoraChi |
| 測試設計 | 全域固定 Math.random（setup.ts:30-33），誘答用 mulberry32 以題目為 seed（practice.ts:364-385） | 原本靠多次重跑 | 引入：測試裡用固定 seed 掃過選項產生 |
| 語音、資源修復 | 取第一個本機 ja-JP（macOS 會選到 Eddy）；修復時註銷整個 origin 的 Service Worker 並清快取（assetRecovery.ts:54-63） | — | 不引入：語音規則會選錯；SoraChi 在共用 origin |

## 壓力情境（#36）

issue 列的情境逐一寫成測試。「舊程式會失敗」表示修正前跑這個測試會失敗，也就是找到並修好的問題；其餘是原本行為就正確，補上測試鎖住。

| 情境 | 測試 | 結論 |
| --- | --- | --- |
| 每一步都重新載入；重考時按「回去看看」；連點 | `kana-review-audit.test.mjs:29`、`flow.test.mjs:1545`「on the review page a forced 回去看看 changes nothing…」 | 不跳題、成績不變；重考時按「回去看看」沒有作用。複習頁原本會吞掉切換假名、開課等按鈕，已修（舊程式會失敗） |
| 複習進行中，在課程頁答同一個字 | `flow.test.mjs:1321` | 錯字狀態以最後一次作答為準，複習那一輪不受影響 |
| 答對後錯字又出現 | `storage.test.mjs:371`、`study.test.mjs:863` | 備份匯入時每個字取較晚的作答；答對移出、之後答錯再進 |
| 清除後草稿、複習、歷史、v1 復活 | `flow.test.mjs:1365`、`flow.test.mjs:892` | 都不會復活。例外是設計如此：匯入清除前的備份，成績紀錄會合併回來，錯字、複習和未完成練習不會 |
| 作答、下一題、完成、清除時寫入失敗 | `flow.test.mjs:1400`、`flow.test.mjs:872` | 保留上次成功存的內容並警告，恢復後存一次、只記 1 筆。清除失敗會整個回滾 |
| 兩個分頁同時練習 | `flow.test.mjs:1446` | 後寫的分頁被拒並警告；過時分頁不能撤銷另一邊的清除 |
| 只有 1–2 個字可以複習 | `flow.test.mjs:1484` | 題數跟著縮短，兩種方向都有，不產生紀錄 |
| や／わ 行沒有其他已完成的行 | `kana-practice.test.mjs:171` | 每題都是該行的 3 個字。原本 `study.test.mjs:118` 的同行檢查是空檢查（參數名稱蓋掉外層變數），已修 |
| 複習頁與重考時的回報內容 | `flow.test.mjs:1511`、`diagnostics.test.mjs:178` | 附上題目、方向與回合，完成頁不附題目；回報原本缺 study.js、storage.js 的版本，已補（舊程式會失敗） |
| 時鐘倒退 | `flow.test.mjs:1573` | 五十音作答的時間原本可能早於上次清除，還原備份時會被丟掉；改成和句型複習同一條規則（舊程式會失敗） |
| 完成頁文案 | `study.test.mjs:479` | 第一輪答錯、重考才答對時，原本顯示「這次的字都答對了」；改成「第一次答錯 N 個字，再考一次都答對了」（舊程式會失敗） |
| 存檔裡有極端日期（年份超過四位數） | `study.test.mjs` 最後一個測試「extreme saved dates are dropped…」 | 這種日期只會來自手動改過的資料，但會讓作答時的時間計算拋錯；現在讀取時直接丟掉（舊程式會失敗） |

#8 的 8 項說法：
1. 每輪最多 5 字、錯字優先（等最久的先），答對一次就移出，沒有冷卻期：`kana-review-audit.test.mjs:51`、`study.test.mjs:863`。
2. 一輪混合兩種方向，排除同讀音：`kana-practice.test.mjs:187` 點名 お／を、オ／ヲ、じ／ぢ、ず／づ、ジ／ヂ、ズ／ヅ。
3. 重考不改第一次的成績：`kana-practice.test.mjs:24`。
4. 複習不產生完成紀錄、可重新載入：`flow.test.mjs:1484`、`study.test.mjs:446`。
5. 只留最近 200 筆，清除會結束未完成的五十音：`storage.test.mjs:17`、`kana-review-audit.test.mjs:102`。「存檔失敗回復記憶體」只適用於清除；作答失敗是保留上次存的內容，見上表。
6. 練習有獨立版本號，舊格式安全重開：`study.test.mjs:199`、`study.test.mjs:210`。
7. 每個字的狀態只在缺少時才從歷史補：`kana-review-audit.test.mjs:22`。
8. 跨分頁比對原文，不是交易、不自動合併：`flow.test.mjs:1446`、`storage.test.mjs:163`。

## Jabiko 移植的改善與測試（#37）

- 形近字：補上 ま／も、ク／フ、ク／ワ（`kana-practice.js:11`）。測試：`kana-practice.test.mjs:78`（舊程式會失敗）。
- 固定 seed：測試裡用 mulberry32 取代 Math.random，在幾個固定 seed 上掃過全部課程的選項規則；失敗時可以重現（`kana-practice.test.mjs:144`）。不改正式版的亂數。
- 移植的測試：同讀音不同題（對應 Jabiko `kanaDrill.test.ts:46-61`）、答對移出後再錯會再進（`srs.test.ts:122-129`）、形近字優先（`kanaDrill.test.ts:76-81`）。
