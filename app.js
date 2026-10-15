"use strict";

const app = document.querySelector("#app");

const TOTAL_STEPS = 6;
let canStore = true;
let restarting = false; // set once a reload is pending; later clicks would save stale memory
let progress = { step: 0, completed: false, inProgress: false, answers: {}, firstAnswers: {}, history: [] };
let selectedWrong = null;
let feedbackReturn = "#home";
let feedbackContext = "首頁";
let feedbackDiagnostics;
let feedbackDraft = { category: "問題回報", message: "" };
const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
const metadata = (id) => ({title: id === "intro" ? "日文的三種文字" : Content.getCourse(id)?.title, legacyRevision: Content.legacyCourseRevision[id]});
const validHistory = (value) => DataStore.normalizeAttempts(value, metadata).slice(-DataStore.MAX_ATTEMPTS);
let browserStorage;
try { browserStorage = localStorage; } catch { /* Restricted browser environment. */ }
const dataStore = DataStore.create({storage: browserStorage, metadata, supportedCourseIds: Object.keys(Content.courses)});
progress = dataStore.readProgress();
const introRevision = progress.contentRevision ?? Content.legacyCourseRevision.intro;
if (introRevision !== Content.courseRevision("intro")) {
  // Keep earned completion and historical scores; restart only incompatible work.
  Object.assign(progress, {step:0,inProgress:false,answers:{},firstAnswers:{}});
}
progress.contentRevision = Content.courseRevision("intro");
progress.study = Study.sanitize(progress.study);
canStore = dataStore.canPersist();
function updateStorageWarning() {
  const status = app.querySelector("#storage-status");
  if (status) status.innerHTML = warningMessage();
}
function save() {
  if (restarting) return;
  canStore = dataStore.writeProgress(progress);
  updateStorageWarning();
}

const icons = {
  arrow:
    '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14m-5-5 5 5-5 5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  back: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m14 6-6 6 6 6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  clock:
    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="8.2" stroke="currentColor" stroke-width="1.5"/><path d="M12 7v5l3 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  leaf: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 19c0-10 3-14 14-14 0 11-4 14-14 14Zm0 0 9-9" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>',
  check:
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m5 12 4 4 10-9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  book: '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5C8 3 5 3 3 4v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-2-1-5-1-9 1Zm0 0v15" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};
// WebP sizes come from art/*.png; `size` is the largest CSS width the image is shown at.
const imageWidths = { "cloud-friend": [128, 256, 512, 768], "cloud-complete": [256, 512] };
const friend = (className = "", alt = "", asset = "cloud-friend", size = 252, sizes = `${size}px`) => {
  const widths = imageWidths[asset];
  const fallback = widths.find((width) => width >= size * 2) || widths.at(-1);
  return `<img class="${className}" src="./assets/${asset}-${fallback}.webp" srcset="${widths.map((width) => `./assets/${asset}-${width}.webp ${width}w`).join(", ")}" sizes="${sizes}" alt="${alt}" width="1229" height="1280">`;
};
const footer = () =>
  '<footer class="footer"><span>SoraChi · 日文入門<br><a class="author-credit" href="#about">花雪（HanaYukii）製作</a></span><nav class="quiet-links" aria-label="小工具"><a class="text-button" href="#about">關於 SoraChi</a><button class="text-button" data-action="history">學習紀錄</button><button class="text-button" data-action="feedback">問題與建議</button></nav></footer>';
const warningMessage = () =>
  canStore
    ? ""
    : dataStore.isConflict() ? '<p class="storage-warning storage-conflict" role="status">另一個分頁已更新或清除資料。這個分頁已停止儲存，請重新載入後再繼續。<button class="text-button" data-action="reload">重新載入</button></p>'
    : dataStore.lockReason() === "newer" ? '<p class="storage-warning" role="status">網站已更新，這個頁面還是舊版本，練習暫時不會儲存。<button class="text-button" data-action="reload">重新整理</button></p>'
    : dataStore.lockReason() === "invalid" ? `<p class="storage-warning" role="status">瀏覽器裡的學習資料無法讀取，練習暫時不會儲存；原始資料沒有被改動。${location.hash === "#history" ? "" : '<button class="text-button" data-action="history">到學習紀錄處理</button>'}</p>`
    : dataStore.isProtected() ? '<p class="storage-warning" role="status">目前無法讀取瀏覽器中的資料，練習不會儲存，也不會改動原有紀錄。</p>'
    : '<p class="storage-warning" role="status">目前瀏覽器無法儲存進度；這次仍可正常上課，關閉後可能需要重新開始。</p>';

const warning = () => `<div id="storage-status">${warningMessage()}</div>`;

Study.bind({
  getState: () => progress.study,
  history: () => progress.history,
  save,
  record: (entry) => {
    progress.history = validHistory([...progress.history, DataStore.makeAttempt(entry)]);
    save();
  },
  escape: escapeHTML, friend, icons, footer, warning, go,
});

function home() {
  document.title = "SoraChi｜日文入門練習";
  const begun = progress.inProgress;
  const action = begun ? "接著學" : progress.completed ? "再練習一次" : "認識三種日文寫法";
  const basic = (script) => Content.rows.slice(0, 10).map(([row]) => `${script}-${row}`), voiced = (script) => Content.rows.slice(10).map(([row]) => `${script}-${row}`);
  // Learners who already moved on to katakana keep going there before returning to voiced hiragana.
  const startedKatakana = basic("k").some((id) => progress.study.courses[id]?.completedAt);
  const kanaIds = startedKatakana ? [...basic("h"), ...basic("k"), ...voiced("h"), ...voiced("k")] : [...basic("h"), ...voiced("h"), ...basic("k"), ...voiced("k")];
  const nextKana = kanaIds.find((id) => Study.hasProgress(id) && progress.study.courses[id]?.active?.phase !== "done") || kanaIds.find((id) => !progress.study.courses[id]?.completedAt) || "h-a";
  const kanaTitle = Study.title(nextKana);
  const review = Study.reviewSummary();
  const reviewEntry = review.availableCount ? `<section class="review-entry" aria-label="五十音複習"><div><h2>${review.canResume ? "還有一輪沒練完" : "複習學過的字"}</h2><p>${review.wrongCount ? `有 ${review.wrongCount} 個字上次答錯，這輪會優先練。` : "混合學過的字，先練較久沒碰到的。"}</p></div><a class="text-button" href="#kana-review">${review.canResume ? "繼續複習" : `複習 ${Math.min(5, review.availableCount)} 個字`}${icons.arrow}</a></section>` : "";
  const scriptName = nextKana.startsWith("h-") ? "平假名" : "片假名";
  const scriptCompleted = kanaIds.filter((id) => id[0] === nextKana[0] && progress.study.courses[id]?.completedAt).length;
  const activeKana = progress.study.courses[nextKana]?.active;
  const kanaAction = Study.hasProgress(nextKana) && activeKana && activeKana.phase !== "done" ? "接著練五十音" : progress.study.courses[nextKana]?.completedAt ? "再練一次五十音" : "開始學五十音";
  const newVisitor = !progress.completed && !progress.inProgress && !progress.history.length && !Object.keys(progress.study.courses).some(id => Study.hasProgress(id) || progress.study.courses[id]?.completedAt);
  const introEntry = `<div class="script-supplement${newVisitor ? " intro-entry" : ""}"><span>日文的三種文字</span>${newVisitor ? '<p>認識平假名、片假名與漢字的用法。</p>' : ''}<button class="text-button" data-action="start">${action}${icons.arrow}</button>${begun ? `<span class="path-progress">上次學到第 ${progress.step + 1} 步</span>` : progress.completed ? '<span class="path-progress">已完成</span>' : ''}</div>`;
  app.innerHTML = `<div class="shell">
    <header class="site-header"><a class="brand" href="#home" aria-label="SoraChi 首頁">${friend("", "", "cloud-friend", 42)}<span class="brand-word">SoraChi<span class="brand-dot">.</span></span></a><span class="header-note">日文入門練習</span><span class="prototype">初學者版</span></header>
    <main id="main" tabindex="-1" class="home"><section class="welcome"><h1 class="focus-heading" tabindex="-1">日文入門</h1><p>學習區從五十音與基礎句型開始。<br>旅遊常用語可依情境直接查閱。</p></section>
    <section class="lesson-hero" aria-labelledby="course-title"><div class="hero-copy"><div class="lesson-label"><span class="number">五十音</span><span>${Study.hasProgress(nextKana) && activeKana?.phase !== "done" ? "接著練習" : progress.study.courses[nextKana]?.completedAt ? "複習" : "下一組"}</span></div><h2 id="course-title">${escapeHTML(kanaTitle)}</h2><p class="hero-description">看字與讀音，再做選擇題。<br>${scriptName}已完成 ${scriptCompleted} / ${Content.rows.length} 組。</p><div class="meta"><span>${icons.clock} 每組約 3–5 分鐘</span><span>${icons.leaf} 這組 ${Study.total(nextKana)} 個字</span></div><button class="primary" data-action="study-open" data-course="${nextKana}">${kanaAction}${icons.arrow}</button><div><button class="text-button course-map-link" data-action="kana">查看全部五十音分組</button></div></div><div class="hero-art" aria-hidden="true"><span class="spark">✦</span><span class="small-spark">✧</span><span class="orbit"></span>${friend("", "", "cloud-friend", 252, "(max-width: 740px) 130px, (min-width: 1300px) 252px, 232px")}</div></section>${reviewEntry}${newVisitor ? introEntry : ""}
    <section class="learning-path" aria-label="學習與旅遊"><div class="path-cards"><div class="path-card"><span class="path-number aqua-label">學習</span><h3>基礎句型</h3><p>認識「A 是 B」、疑問句和指示詞，<br>每課附說明與練習。</p><button class="text-button" data-action="grammar">看基礎句型${icons.arrow}</button></div><div class="path-card travel-entry"><span class="path-number">旅行時查用</span><h3>旅遊常用語</h3><p>點餐、結帳、問路、住宿。<br>先記關鍵字，需要時再看完整說法。</p><button class="text-button" data-action="travel">查旅遊常用語${icons.arrow}</button></div></div>${newVisitor ? "" : introEntry}</section>
    <aside class="gentle-note">${icons.book}<span>不用登入；進度只存在這個瀏覽器。</span></aside>${warning()}</main>${footer()}</div>`;
}

const {lessons, questions} = Content.intro;

function lesson(focus = true) {
  const step = progress.step;
  const isQuiz = step >= 4;
  document.title = "日文的三種文字｜SoraChi";
  const current = isQuiz ? questions[step] : lessons[step];
  const answered = progress.answers[step] === true;
  const content = isQuiz
    ? `<span class="question-tag">小練習 ${step - 3} / 2 · 選一個答案</span>${current.word ? `<div class="question-word" lang="ja">${current.word}</div><p class="question-note">${current.note}</p>` : '<div style="height:22px"></div>'}<div class="answers" role="group" aria-label="答案選項">${current.options.map((option, i) => `<button class="answer${answered && i === current.answer ? " correct" : selectedWrong === i ? " wrong" : ""}" data-answer="${i}" ${answered ? 'aria-disabled="true" tabindex="-1"' : ""}><span class="letter">${answered && i === current.answer ? icons.check : String.fromCharCode(65 + i)}</span><span>${option}</span>${answered && i === current.answer ? '<span class="answer-status">答對了</span>' : ""}</button>`).join("")}</div><div class="feedback${selectedWrong !== null ? " wrong" : ""}" role="status" aria-live="polite" aria-atomic="true" ${!answered && selectedWrong === null ? 'style="display:block;padding:0;margin:0"' : ""}>${answered ? `<strong>${current.correct}</strong>${current.explanation}` : selectedWrong !== null ? `<strong>${current.wrong}</strong>${current.hint}` : ""}</div>`
    : current.content;
  app.innerHTML = `<div class="lesson-shell"><header class="lesson-header"><button class="exit" data-action="home">${icons.back}回首頁</button><span class="lesson-name">日文的三種文字</span></header><div class="lesson-progress"><div class="track" role="progressbar" aria-label="日文的三種文字進度" aria-valuemin="0" aria-valuemax="${TOTAL_STEPS}" aria-valuenow="${step}"><span style="width:${(step / TOTAL_STEPS) * 100}%"></span></div><span class="step-count">${step + 1} / ${TOTAL_STEPS}</span></div>
    <main id="main" tabindex="-1" class="lesson-main"><div class="eyebrow">${isQuiz ? "確認理解" : current.label}</div><h1 tabindex="-1" class="lesson-title focus-heading">${current.title}</h1><p class="lesson-intro">${isQuiz ? "選擇一個答案。答錯時可看提示後重試。" : current.intro}</p><section class="content-card ${current.className || ""} ${isQuiz ? "quiz-card" : ""}" aria-label="${isQuiz ? "練習題" : "課程內容"}">${content}</section>${isQuiz ? "" : `<aside class="mascot-tip">${friend("", "", "cloud-friend", 40)}<span>${current.tip}</span></aside>`}${warning()}
    <div class="lesson-navigation"><button class="back-button" data-action="back">${icons.back}${step === 0 ? "回首頁" : "上一步"}</button><div class="next-wrap"><button class="primary" data-action="next" ${isQuiz && !answered ? "disabled" : ""}>${step === 5 ? "完成練習" : isQuiz ? "下一題" : step === 3 ? "開始練習" : "下一步"}${icons.arrow}</button>${isQuiz && !answered ? '<p class="step-hint">先選一個答案</p>' : ""}</div></div><div class="lesson-utilities"><button class="text-button" data-action="feedback">這一頁有問題？</button></div></main></div>`;
  if (focus) focusHeading();
}

function updateAnswerFeedback() {
  const question = questions[progress.step];
  const answered = progress.answers[progress.step] === true;
  question.options.forEach((option, index) => {
    const choice = app.querySelector(`[data-answer="${index}"]`);
    choice.classList.toggle("correct", answered && index === question.answer);
    choice.classList.toggle("wrong", !answered && selectedWrong === index);
    if (answered) {
      // aria-disabled keeps the currently focused answer mounted and focused.
      // Removing choices from the tab order lets keyboard users leave the group.
      choice.setAttribute("aria-disabled", "true");
      choice.tabIndex = -1;
      if (index === question.answer) {
        choice.querySelector(".letter").innerHTML = icons.check;
        const status = document.createElement("span");
        status.className = "answer-status";
        status.textContent = "答對了";
        choice.append(status);
      }
    }
  });
  const feedback = app.querySelector(".feedback");
  feedback.classList.toggle("wrong", !answered);
  feedback.removeAttribute("style");
  const heading = document.createElement("strong");
  heading.textContent = answered ? question.correct : question.wrong;
  feedback.replaceChildren(
    heading,
    document.createTextNode(answered ? question.explanation : question.hint),
  );
  app.querySelector('[data-action="next"]').disabled = !answered;
  if (answered) app.querySelector(".step-hint")?.remove();
}

function finish() {
  document.title = "完成日文的三種文字｜SoraChi";
  app.innerHTML = `<div class="lesson-shell"><header class="lesson-header"><button class="exit" data-action="home">${icons.back}回首頁</button><span class="lesson-name">日文的三種文字</span></header><main id="main" tabindex="-1" class="finish"><div class="finish-art">${friend("", "SoraChi 雲朵精靈開心地抱著小書，陪你完成日文的三種文字", "cloud-complete", 160)}<span class="finish-check">${icons.check}</span></div><h1 tabindex="-1" class="focus-heading">日文的三種文字已完成</h1><p>本課介紹了平假名、片假名和漢字。</p><div class="summary"><span><b lang="ja">ねこ</b> · 平假名</span><span><b lang="ja">パン</b> · 片假名</span><span><b lang="ja">山</b> · 漢字</span></div>${resultCard()}<div class="finish-actions"><button class="primary" data-action="kana">接著認識五十音${icons.arrow}</button><button class="text-button" data-action="home">回首頁</button><button class="text-button" data-action="restart">再看一次這堂課</button></div><p class="storage-note">${canStore ? "完成紀錄已保存在這個瀏覽器。" : "這次已完成，但瀏覽器無法保存紀錄。"}</p>${warning()}</main>${footer()}</div>`;
  focusHeading();
}

function currentResult() {
  const known = [4, 5].every((q) => typeof progress.firstAnswers[q] === "boolean");
  return {
    date: new Date().toISOString(), total: 2, courseTitle: "日文的三種文字",
    courseRevision: Content.courseRevision("intro"), questionIds: [questions[4].id, questions[5].id],
    firstCorrect: known ? [4, 5].filter((q) => progress.firstAnswers[q]).length : null,
    retryQuestions: [4, 5].filter((q) => progress.firstAnswers[q] === false),
  };
}
function resultCard() {
  const result = currentResult();
  if (result.firstCorrect === null) return "";
  return `<div class="result-card"><span>練習結果</span><strong>第一次答對 ${result.firstCorrect} / 2 題</strong><p>${result.firstCorrect === 2 ? "兩題第一次都答對。" : "兩題已完成，包含看提示後重試的題目。"}</p><button class="text-button" data-action="history">看看學習紀錄 ${icons.arrow}</button></div>`;
}
// Offered only while stored data is locked; both paths keep the original text.
function recoveryPanel(confirmRestart) {
  const raw = dataStore.rawData();
  if (raw === null) return "";
  const newer = dataStore.lockReason() === "newer";
  const intro = newer ? "這份資料是較新版本的網站寫的，先重新整理這個頁面。通常重新整理後就能繼續。" : "這份資料損壞或缺少欄位，目前的網站讀不了。可以先下載原始資料留存，再重新開始。";
  const confirmText = newer ? "重新開始後，學習紀錄與進度會從空白開始，之後新版網站也不會顯示這份資料。原始資料會另外保存在這個瀏覽器，建議先下載一份。" : "重新開始後，學習紀錄與進度會從空白開始。原始資料會另外保存在這個瀏覽器，建議先下載一份。";
  const actions = confirmRestart
    ? `<p>${confirmText}</p><div class="quiet-links"><button class="text-button" data-action="history">先不要</button><button class="text-button" data-action="confirm-restart">確認重新開始</button></div>`
    : `<div class="quiet-links">${newer ? '<button class="text-button" data-action="reload">重新整理</button>' : ""}<button class="text-button" data-action="download-raw">下載原始資料</button><button class="text-button" data-action="restart-protected">${newer ? "重新整理後還是這樣：重新開始" : "保存原始資料後重新開始"}</button></div>`;
  // Download can fail silently in in-app browsers, so the text stays copyable here.
  return `<section class="recovery-panel" aria-label="處理無法讀取的資料"><p>${intro}</p>${actions}<details><summary>沒有下載成功？直接複製原始資料</summary><textarea class="raw-data" readonly rows="4" aria-label="原始資料">${escapeHTML(raw)}</textarea></details></section>`;
}
function downloadRaw() {
  const raw = dataStore.rawData();
  if (raw !== null) downloadText(raw, "sorachi-data");
}
function downloadText(raw, name) {
  const link = document.createElement("a");
  let href;
  try { href = URL.createObjectURL(new Blob([raw], { type: "application/json" })); } catch { href = `data:application/json;charset=utf-8,${encodeURIComponent(raw)}`; }
  link.href = href;
  link.download = `${name}-${new Date().toISOString().slice(0, 10)}.json`;
  document.body?.append(link); link.click?.(); link.remove?.();
  if (href.startsWith("blob:")) setTimeout(() => URL.revokeObjectURL(href), 1000);
}
// The import result survives the reload that rebuilds every view from storage.
const IMPORT_NOTE = "sorachi:import-note";
let importNote = null;
try { importNote = sessionStorage.getItem(IMPORT_NOTE); sessionStorage.removeItem(IMPORT_NOTE); } catch { /* Optional. */ }
function backupPanel() {
  if (dataStore.isProtected()) return "";
  return `<section class="backup-panel" aria-labelledby="backup-title"><h2 id="backup-title">備份</h2><p>紀錄只存在這個瀏覽器。換瀏覽器或清除網站資料前，可以先下載備份檔，之後再還原。</p><div class="quiet-links"><button class="text-button" data-action="export-backup">下載備份</button><label class="text-button file-button">從備份檔還原<input type="file" id="backup-file"></label></div><p id="backup-status" role="status" aria-live="polite"></p></section>`;
}
function importSummary(result) {
  if (!result.ok) return result.reason === "too-large" ? "這個檔案太大，不像 SoraChi 的備份檔。" : result.reason === "write" ? (dataStore.isConflict() ? "另一個分頁更新了資料，請重新整理後再還原。" : "這次沒有還原成功，瀏覽器無法儲存。原本的紀錄沒有改動。") : "讀不懂這個檔案，請選 SoraChi 下載的備份檔。原本的紀錄沒有改動。";
  return `已從備份還原：新增 ${result.added} 筆紀錄${result.existing ? `，${result.existing} 筆原本就有` : ""}${result.skipped ? `，${result.skipped} 筆較舊的紀錄超過 ${DataStore.MAX_ATTEMPTS} 筆上限，沒有加入` : ""}${result.dropped ? `，本機 ${result.dropped} 筆較舊的紀錄超過 ${DataStore.MAX_ATTEMPTS} 筆上限，已移除` : ""}。課程進度已合併。`;
}
async function importFile(file) {
  const status = app.querySelector("#backup-status");
  if (!file) return;
  if (file.size > DataStore.MAX_BACKUP_CHARS * 4) { status.textContent = importSummary({ok:false,reason:"too-large"}); return; }
  let result;
  try { result = dataStore.importBackupDetailed(await file.text()); } catch { result = {ok:false,reason:"invalid"}; }
  if (!result.ok) { status.textContent = importSummary(result); return; }
  // Reload so the in-memory progress cannot overwrite what was just imported.
  try { sessionStorage.setItem(IMPORT_NOTE, importSummary(result)); } catch { /* The reload still shows the merged data. */ }
  restarting = true;
  location.reload();
}
function historyPage(confirmClear = false, confirmRestart = false) {
  document.title = "學習紀錄｜SoraChi";
  const entries = [...progress.history].reverse();
  const hasReviewData = Study.reviewSummary().hasData;
  app.innerHTML = `<div class="lesson-shell"><header class="lesson-header"><button class="exit" data-action="home">${icons.back}回首頁</button><span class="lesson-name">SoraChi</span></header><main id="main" tabindex="-1" class="utility-main"><h1 class="focus-heading" tabindex="-1">學習紀錄</h1><p class="utility-intro">查看完成時間與第一次作答的成績。</p>${entries.length ? `<p class="record-note">保留最近 ${DataStore.MAX_ATTEMPTS} 次完成紀錄。「第一次答對」以每題第一次選擇計算，重試不會改寫成績。</p><ol class="history-list">${entries.map((entry) => `<li><div class="record-top"><span>${entry.courseId ? escapeHTML(entry.courseTitle || Study.title(entry.courseId) || entry.courseId) : "日文的三種文字"}</span><time datetime="${entry.date}">${new Date(entry.date).toLocaleString("zh-TW", {month:"numeric",day:"numeric",year:"numeric",hour:"2-digit",minute:"2-digit",hour12:false})}</time></div><h2>${entry.firstCorrect === null ? "已完成 · 未記錄第一次作答成績" : `第一次答對 <strong>${entry.firstCorrect} / ${entry.total || 2}</strong> 題`}</h2><p>${entry.retryQuestions.length ? `第一次答錯：${entry.courseId ? Study.retryLabels(entry).map(escapeHTML).join("、") : entry.retryQuestions.map((q) => `第 ${q - 3} 題`).join("、")}` : entry.firstCorrect === (entry.total || 2) ? "全部題目第一次都答對。" : "這次已完成練習。"}</p></li>`).join("")}</ol>` : dataStore.isProtected() ? `<section class="empty-record">${icons.book}<h2>目前無法讀取成績紀錄</h2></section>` : `<section class="empty-record">${icons.book}<h2>還沒有新的成績紀錄</h2><p>${progress.completed ? "你已完成過日文的三種文字；舊版尚未留下成績。下次練習完成後，就會記在這裡。" : "完成任一組練習後，紀錄會顯示在這裡。"}</p><button class="primary" data-action="kana">選擇五十音練習${icons.arrow}</button></section>`}${recoveryPanel(confirmRestart)}${backupPanel()}<p class="record-note">只保存在這個瀏覽器，沒有跨裝置同步。清除網站資料也會移除紀錄。</p>${warning()}${!dataStore.isProtected() && (entries.length || hasReviewData) ? confirmClear ? `<section class="clear-confirm" aria-label="確認清除"><p>清除全部成績與複習紀錄？這也會結束尚未完成的五十音練習與複習；已完成狀態與其他課程進度會保留。</p><div class="quiet-links"><button class="text-button" data-action="history">先保留</button><button class="text-button" data-action="confirm-clear">確認清除紀錄</button></div></section>` : `<button class="text-button clear-button" data-action="clear-history">清除成績與複習紀錄</button>` : ""}</main>${footer()}</div>`;
  focusHeading();
  // Announce the restore result once, after the page exists, so the live region reads it.
  if (importNote) {
    const note = importNote; importNote = null;
    setTimeout(() => { const status = app.querySelector("#backup-status"); if (status) status.textContent = note; }, 50);
  }
}
function captureFeedback(hash) {
  const id = hash.startsWith("#study/") ? hash.slice(7) : null;
  return Diagnostics.capture({hash, progress, scripts: document.scripts, practice: Study.currentPractice(), ...(id ? {attempt: Study.currentAttempt(id)} : {})});
}
function feedbackPage() {
  feedbackDiagnostics ||= captureFeedback("#home");
  document.title = "問題與建議｜SoraChi";
  app.innerHTML = `<div class="lesson-shell"><header class="lesson-header"><button class="exit" data-action="feedback-back">${icons.back}回到剛才的頁面</button><span class="lesson-name">SoraChi</span></header><main id="main" tabindex="-1" class="utility-main"><h1 class="focus-heading" tabindex="-1">問題與建議</h1><p class="utility-intro">回報操作問題、教材錯誤，或提出課程建議。</p><form id="feedback-form" class="feedback-form"><label for="feedback-category">回報類型</label><select id="feedback-category" name="category">${["問題回報","學習建議","其他想法"].map((kind) => `<option${feedbackDraft.category === kind ? " selected" : ""}>${kind}</option>`).join("")}</select><label for="feedback-message">內容</label><textarea id="feedback-message" name="message" rows="5" maxlength="600" required placeholder="例如：這個說明看不太懂，希望多一個例子。">${escapeHTML(feedbackDraft.message)}</textarea><p class="record-note">最多 600 字。會附上所在位置：${escapeHTML(feedbackContext)}，以及版本與教材識別碼。</p><aside class="feedback-privacy">這版使用 GitHub 接收回報，需要 GitHub 帳號。送出後內容會公開，請勿填入姓名、Email 或其他私人資料。</aside><button class="primary" type="submit">準備回報內容 ${icons.arrow}</button><p class="record-note">下一步會產生連結，讓你到 GitHub 確認後送出。</p><div id="feedback-ready" role="status" aria-live="polite"></div></form></main>${footer()}</div>`;
  focusHeading();
}
function buildFeedbackURL(category, message, context) {
  const url = new URL("https://github.com/HanaYukii/sorachi/issues/new");
  url.searchParams.set("title", `[${category}] SoraChi 使用回饋`);
  url.searchParams.set("body", `${message.trim()}\n\n---\n所在位置：${context}\n${Diagnostics.format(feedbackDiagnostics || captureFeedback("#home"))}`);
  return url.href;
}
app.addEventListener("change", (event) => {
  if (event.target?.id !== "backup-file" || restarting) return;
  const file = event.target.files?.[0];
  // Clearing the value lets the same file be chosen again after a failed try.
  try { event.target.value = ""; } catch { /* Read-only in some engines. */ }
  importFile(file);
});
app.addEventListener("input", () => {
  if (location.hash !== "#feedback") return;
  feedbackDraft = {category: app.querySelector("#feedback-category").value, message: app.querySelector("#feedback-message").value};
  app.querySelector("#feedback-ready").replaceChildren();
});
app.addEventListener("submit", (event) => {
  if (event.target.id !== "feedback-form") return;
  event.preventDefault();
  const message = app.querySelector("#feedback-message");
  const category = app.querySelector("#feedback-category").value;
  if (!message.value.trim() || message.value.length > 600) {
    message.setCustomValidity(message.value.length > 600 ? "請縮短到 600 字以內。" : "請先寫下一點內容。");
    message.reportValidity();
    message.addEventListener("input", () => message.setCustomValidity(""), {once:true});
    return;
  }
  feedbackDraft = {category, message: message.value};
  const ready = app.querySelector("#feedback-ready");
  const note = document.createElement("p");
  note.textContent = "內容已準備好，還沒有送出。";
  const link = document.createElement("a");
  link.href = buildFeedbackURL(category, message.value, feedbackContext);
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.className = "text-button";
  link.textContent = "前往 GitHub 確認並送出 ↗";
  ready.replaceChildren(note, link);
});

function focusHeading() {
  app.querySelector(".focus-heading")?.focus({ preventScroll: true });
}
function aboutPage() {
  document.title = "關於 SoraChi｜SoraChi";
  app.innerHTML = `<div class="lesson-shell"><header class="lesson-header"><a class="exit" href="#home">← 回首頁</a><span class="lesson-name">SoraChi</span></header><main id="main" tabindex="-1" class="utility-main info-page"><h1 class="focus-heading" tabindex="-1">關於 SoraChi</h1>
    <section class="info-section"><h2>給剛開始學日文的人</h2><p>SoraChi 從五十音和基礎句型開始，也提供旅行時可直接查用的常用語。每次只練少量內容，學過的字可以回來混合複習。</p><p>這個專案的方向是新手入門、N5／N4 準備與簡單旅遊日文；目前的內容仍在逐步補齊。</p></section>
    <section class="info-section"><h2>作者</h2><p class="author-name">花雪（HanaYukii）</p><p>我製作過大量偶像相關翻譯素材，也做了日文練習網站 Jabiko。SoraChi 另外把五十音、基本句型和旅遊關鍵字整理成適合新手使用的版本。</p><a class="text-button" href="https://hanayukii.dev/about" target="_blank" rel="noopener noreferrer">作者的個人網站 ↗</a></section>
    <section class="info-section"><h2>本站的素材與資料</h2><p>雲朵角色為本專案使用的原創 AI 生成圖像。假名記憶提示是輔助聯想，不是字源或筆順教學；讀音播放使用裝置合成語音。</p><p>網站沒有帳號或分析追蹤，學習資料只存在瀏覽器。字型使用 Google Fonts，無法載入時會使用裝置字型。</p></section>
    </main>${footer()}</div>`;
  focusHeading();
}
function route() {
  Study.stopAudio();
  // A historical completion URL must never claim an active replay is finished.
  if (location.hash === "#done" && progress.inProgress) {
    replaceRoute("#lesson");
    return;
  }
  selectedWrong = null;
  window.scrollTo({ top: 0, behavior: "instant" });
  const studyPage = Study.render(location.hash);
  if (studyPage !== null) {
    document.title = `${location.hash === "#kana-review" ? "五十音複習" : location.hash === "#kana" ? "五十音練習" : location.hash === "#travel" ? "旅遊常用語" : location.hash === "#grammar" ? "基礎句型" : (location.hash.startsWith("#travel/") ? Study.travelTitle(location.hash.slice(8)) : Study.title(location.hash.slice(7))) || "學習路線"}｜SoraChi`;
    app.innerHTML = studyPage;
    focusHeading();
    return;
  }
  if (location.hash === "#lesson") {
    if (progress.completed && !progress.inProgress) {
      replaceRoute("#done");
      return;
    }
    if (!progress.inProgress) {
      progress.step = 0;
      progress.answers = {};
      progress.firstAnswers = {};
      progress.inProgress = true;
      save();
    }
    lesson();
  } else if (location.hash === "#done" && progress.completed) finish();
  else if (location.hash === "#history") historyPage();
  else if (location.hash === "#feedback") feedbackPage();
  else if (location.hash === "#about") aboutPage();
  else {
    home();
    focusHeading();
  }
}
function replaceRoute(hash) {
  window.history.replaceState(null, "", hash);
  route();
}
function go(hash) {
  if (location.hash === hash) route();
  else location.hash = hash;
}
function restart() {
  progress.step = 0;
  progress.answers = {};
  progress.firstAnswers = {};
  progress.inProgress = true;
  // Retain the earned completion record while replaying the lesson.
  selectedWrong = null;
  save();
  go("#lesson");
}
app.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button || button.disabled || restarting) return;
  if (Study.handle(button)) return;
  if (button.dataset.answer !== undefined) {
    const answer = Number(button.dataset.answer);
    const question = questions[progress.step];
    if (!question || progress.answers[progress.step]) return;
    if (progress.firstAnswers[progress.step] === undefined) progress.firstAnswers[progress.step] = answer === question.answer;
    if (answer === question.answer) {
      progress.answers[progress.step] = true;
      selectedWrong = null;
      save();
    } else selectedWrong = answer;
    save();
    updateAnswerFeedback();
    return;
  }
  switch (button.dataset.action) {
    case "reload":
      location.reload();
      break;
    case "download-raw":
      downloadRaw();
      break;
    case "export-backup":
      try { downloadText(dataStore.exportBackup(), "sorachi-backup"); }
      catch { app.querySelector("#backup-status").textContent = dataStore.isConflict() ? "另一個分頁更新了資料，請重新整理後再下載備份。" : "目前讀不到瀏覽器裡的資料，沒辦法下載備份。"; }
      break;
    case "restart-protected":
      historyPage(false, true);
      app.querySelector('[data-action="confirm-restart"]').focus();
      break;
    case "confirm-restart":
      // A clean reload rebuilds every in-memory view from the fresh snapshot; until it
      // happens, ignore clicks so the old in-memory progress is not saved into it.
      if (dataStore.restartProtected()) { restarting = true; location.reload(); }
      else { historyPage(); app.querySelector(".storage-warning")?.append(document.createTextNode(dataStore.isConflict() ? " 另一個分頁已經處理過這份資料，請重新整理。" : " 這次沒有重新開始，原始資料保持不變。")); }
      break;
    case "kana":
      go("#kana");
      break;
    case "travel":
      go("#travel");
      break;
    case "grammar":
      go("#grammar");
      break;
    case "history":
      go("#history");
      break;
    case "clear-history":
      historyPage(true);
      app.querySelector('[data-action="history"]').focus();
      break;
    case "confirm-clear": {
      const previous = progress.history;
      const previousStudy = JSON.parse(JSON.stringify(progress.study));
      progress.history = [];
      Study.clearReview();
      save();
      if (!canStore) { progress.history = previous; progress.study = previousStudy; }
      else dataStore.forgetLegacy();
      historyPage();
      if (!canStore) {
        const warning = app.querySelector(".storage-warning");
        warning.append(document.createTextNode(" 成績紀錄尚未清除。"));
      }
      break;
    }
    case "feedback":
      if (location.hash !== "#feedback") {
        feedbackDiagnostics = captureFeedback(location.hash || "#home");
        feedbackReturn = ["#lesson", "#done", "#history"].includes(location.hash) || Study.context(location.hash) ? location.hash : "#home";
        feedbackContext = Study.context(feedbackReturn) || (feedbackReturn === "#lesson" ? `日文的三種文字・第 ${progress.step + 1} 步${progress.step >= 4 ? `・小練習 ${progress.step - 3}` : ""}` : feedbackReturn === "#done" ? "日文的三種文字完成頁" : feedbackReturn === "#history" ? "學習紀錄" : "首頁");
      }
      go("#feedback");
      break;
    case "feedback-back":
      go(feedbackReturn);
      break;
    case "home":
      go("#home");
      break;
    case "start":
      if (!progress.inProgress) restart();
      else {
        progress.inProgress = true;
        save();
        go("#lesson");
      }
      break;
    case "restart":
      restart();
      break;
    case "back":
      if (progress.step === 0) go("#home");
      else {
        progress.step--;
        selectedWrong = null;
        save();
        lesson();
        window.scrollTo(0, 0);
      }
      break;
    case "next":
      if (progress.step >= 4 && !progress.answers[progress.step]) return;
      if (progress.step === 5) {
        if (progress.inProgress) progress.history = validHistory([...progress.history, DataStore.makeAttempt(currentResult())]);
        progress.completed = true;
        progress.inProgress = false;
        save();
        go("#done");
      } else {
        progress.step++;
        selectedWrong = null;
        save();
        lesson();
        window.scrollTo(0, 0);
      }
      break;
  }
});
document.querySelector(".skip-link").addEventListener("click", (event) => {
  event.preventDefault();
  document.querySelector("#main")?.focus();
});
window.addEventListener("storage", (event) => {
  if (event.key !== null && event.key !== DataStore.KEY) return;
  dataStore.checkForUpdates();
  canStore = dataStore.canPersist();
  updateStorageWarning();
});
window.addEventListener("hashchange", route);
route();
