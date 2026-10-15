# SoraChi

給幾乎零基礎的日文學習者，一次只學一個小觀念。

**線上雛形：** https://hanayukii.github.io/sorachi/

## 這一版

首頁只有一張課程卡。第一課用六個小步驟認識平假名、片假名與漢字，再完成兩題有提示、可以重試的小練習。進度保存在目前瀏覽器，可中途離開、接著學或完成後重看。

視覺使用原創雲朵精靈，淡紫為主、水色輔助、杏橘色作為主要操作。白色留白與單一學習路徑優先於功能數量。

這是首頁與第一課的互動雛形，尚未包含完整五十音、N5/N4 課程或題庫。後續以新手學習為主，題庫作為練習補充；適合的 Jabiko 內容需逐題檢查程度與說明後再沿用。

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
node --test tests/flow.test.mjs
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
- `dist/app.js`：六步小課、答題回饋與本機進度。
- `dist/assets/cloud-friend.png`、`cloud-complete.png`：本專案使用的原創 AI 生成角色與抱書完成姿勢。
- `tests/flow.test.mjs`：互動流程回歸檢查。

進度只存在目前瀏覽器，沒有帳號或跨裝置同步；清除網站資料也會移除紀錄。網站未加入分析追蹤。字型使用 Google Fonts，無法取得時會使用裝置的字型。
