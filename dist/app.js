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
let feedbackDraft = { category: "問題回報", message: "", contact: "" };
let feedbackBusy = false, feedbackSent = false, feedbackSubmission = null, feedbackStatus = "";
const directFeedback = () => Boolean(account.service() && CloudConfig.turnstileSiteKey);
const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
const metadata = (id) => ({title: id === "intro" ? "日文的三種文字" : Content.getCourse(id)?.title ?? Content.retiredTitles[id], legacyRevision: Content.legacyCourseRevision[id]});
const validHistory = (value) => DataStore.normalizeAttempts(value, metadata).slice(-DataStore.MAX_ATTEMPTS);
let browserStorage;
try { browserStorage = localStorage; } catch { /* Restricted browser environment. */ }
let dataStore = DataStore.create({storage: browserStorage, metadata, supportedCourseIds: Object.keys(Content.courses)});
function loadProgress() {
progress = dataStore.readProgress();
const introRevision = progress.contentRevision ?? Content.legacyCourseRevision.intro;
if (introRevision !== Content.courseRevision("intro")) {
  // Keep earned completion and historical scores; restart only incompatible work.
  Object.assign(progress, {step:0,inProgress:false,answers:{},firstAnswers:{}});
}
progress.contentRevision = Content.courseRevision("intro");
progress.study = Study.sanitize(progress.study);
canStore = dataStore.canPersist();
}
loadProgress();
// The page shows warnings as plain text; a single region outside #app announces
// only a change in saving state, so redraws and repeated failures stay quiet.
const saveState = () => canStore ? "ok" : dataStore.isConflict() ? "conflict" : dataStore.lockReason() || "blocked";
let announcedState = saveState();
function updateStorageWarning() {
  const message = warningMessage();
  const status = app.querySelector("#storage-status");
  if (status && status.innerHTML !== message) status.innerHTML = message;
  const state = saveState();
  if (state !== announcedState) {
    const announcer = document.querySelector("#announcer");
    if (announcer) announcer.textContent = canStore ? "已恢復儲存。" : state === "conflict" ? "另一個分頁更新了資料，這個分頁已停止儲存。" : "這次的進度沒有存到瀏覽器。";
  }
  announcedState = state;
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
  check:
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m5 12 4 4 10-9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  book: '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5C8 3 5 3 3 4v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-2-1-5-1-9 1Zm0 0v15" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};
// WebP sizes come from art/*.png; `size` is the largest CSS width the image is shown at.
const imageWidths = { "cloud-friend": [128, 256, 512, 768], "cloud-complete": [256, 512], "cloud-kana": [128, 256, 512], "cloud-travel": [128, 256], "cloud-drill": [128, 256, 512] };
const friend = (className = "", alt = "", asset = "cloud-friend", size = 252, sizes = `${size}px`) => {
  const widths = imageWidths[asset];
  const [width, height] = asset === "cloud-kana" || asset === "cloud-travel" || asset === "cloud-drill" ? [256, 256] : [1229, 1280];
  const fallback = widths.find((width) => width >= size * 2) || widths.at(-1);
  return `<img class="${className}" src="./assets/${asset}-${fallback}.webp" srcset="${widths.map((width) => `./assets/${asset}-${width}.webp ${width}w`).join(", ")}" sizes="${sizes}" alt="${alt}" width="${width}" height="${height}">`;
};
const footer = () =>
  (location.hostname === "hanayukii.github.io" ? '<aside class="domain-move"><strong>SoraChi 新網址：<a href="https://sorachi.app/">sorachi.app</a></strong><p>這裡保留舊版和原本的進度。要搬到新站，先在「學習紀錄」下載備份，再到新站的「學習紀錄」從備份檔還原。</p><button class="text-button" data-action="history">學習紀錄與備份 →</button></aside>' : '') + '<footer class="footer"><span>SoraChi · 日文入門<br><a class="author-credit" href="#about">花雪（HanaYukii）製作</a></span><nav class="quiet-links" aria-label="小工具"><a class="text-button" href="#about">關於 SoraChi</a><button class="text-button" data-action="history">學習紀錄</button><a class="text-button" href="#settings">學習設定</a><button class="text-button" data-action="feedback">問題與建議</button><a class="text-button" href="./privacy.html">隱私政策</a><a class="text-button" href="./terms.html">使用條款</a></nav></footer>';
const warningMessage = () =>
  canStore
    ? ""
    : dataStore.isConflict() ? '<p class="storage-warning storage-conflict">另一個分頁已更新或清除資料。這個分頁已停止儲存，請重新載入後再繼續。<button class="text-button" data-action="reload">重新載入</button></p>'
    : dataStore.lockReason() === "newer" ? '<p class="storage-warning">網站已更新，這個頁面還是舊版本，練習暫時不會儲存。<button class="text-button" data-action="reload">重新整理</button></p>'
    : dataStore.lockReason() === "invalid" ? `<p class="storage-warning">瀏覽器裡的學習資料無法讀取，練習暫時不會儲存；原始資料沒有被改動。${location.hash === "#history" ? "" : '<button class="text-button" data-action="history">到學習紀錄處理</button>'}</p>`
    : dataStore.isProtected() ? '<p class="storage-warning">目前無法讀取瀏覽器中的資料，練習不會儲存，也不會改動原有紀錄。</p>'
    : '<p class="storage-warning">目前瀏覽器無法儲存進度；這次仍可正常上課，關閉後可能需要重新開始。</p>';

const warning = () => `<div id="storage-status">${warningMessage()}</div>`;

// Where a lesson or review was opened from (#82): home, the kana table or the grammar list decides where 回 leads.
// It is kept in the history entry, so a reload and the browser's back and forward keep it. A lesson opened from a
// lesson or review (the next group), or after feedback, keeps the earlier source; anything else, such as a direct
// link, has none. An entry gets its source once, when it is first shown, so going back to it never changes it.
const exits = ["#home", "#kana", "#grammar"];
const passesOn = (page) => /^#(study\/|kana-review$|grammar-review$|kana-random$|grammar-random$|drill$|feedback$)/.test(page || "");
let cameFrom = null, shown = null, shownHash = null, shownFeedback = null;
function arrive() {
  if (window.history.state?.from === undefined) window.history.replaceState({ from: exits.includes(shown) ? shown : passesOn(shown) ? cameFrom : null }, "");
  route();
}

Study.bind({
  getState: () => progress.study,
  history: () => progress.history,
  preferences: () => dataStore.readSnapshot().preferences,
  favorites: () => dataStore.readSnapshot().favorites,
  savePreferences: value => { canStore = dataStore.savePreferences(value); updateStorageWarning(); return canStore; },
  saveFavorites: ids => { canStore = dataStore.saveFavorites(ids); updateStorageWarning(); return canStore; },
  save,
  record: (entry) => {
    progress.history = validHistory([...progress.history, DataStore.makeAttempt(entry)]);
    save();
  },
  icons, footer, warning, go,
  from: () => cameFrom,
});

let logoutRemoval = null;
let accountLoading = Boolean(CloudConfig.url && CloudConfig.publishableKey);
const account = Account.create({
  render: () => { accountLoading=false; route(); },
  owner: accountId => { dataStore = DataStore.create({storage:browserStorage,metadata,supportedCourseIds:Object.keys(Content.courses),accountId}); loadProgress(); },
  lock: locked => { app.inert = locked; },
  notice: message => { const note=document.querySelector("#account-alert"); note.textContent=message; note.hidden=false; },
  beforeLogout: id => { logoutRemoval = id; },
  reload: () => {
    restarting = true;
    if(logoutRemoval) {
      try {
        DataStore.removeAccountData(browserStorage, logoutRemoval);
      } catch { window.alert("已登出，但瀏覽器無法移除這台裝置上的帳號紀錄。若是公用電腦，請確認資料已移除後再離開。"); }
    }
    Study.stopAudio(); location.reload();
  },
  export: () => dataStore.exportBackup(),
  importSummary,
  importGuest: () => {
    const guest=DataStore.create({storage:browserStorage,metadata,supportedCourseIds:Object.keys(Content.courses)});
    try { const result=dataStore.importBackupDetailed(guest.exportBackup()); if(result.ok) loadProgress(); return result; }
    catch { return {ok:false,reason:"write"}; }
  },
  importRemote: payload => { const result=dataStore.importBackupDetailed(JSON.stringify(payload)); if(result.ok) loadProgress(); return result; },
});
function accountPage() {
  document.title = `${account.user()?"我的帳號":"登入"}｜SoraChi`;
  app.innerHTML = `<div class="lesson-shell">${Navigation.header(location.hash)}<main id="main" tabindex="-1" class="utility-main">${account.render()}${warning()}</main>${footer()}</div>`;
  focusHeading();
}
function home() {
  document.title = "SoraChi｜五十音、基礎句型與旅遊日語｜零基礎也能學";
  const begun = progress.inProgress;
  const grammarNext = Study.grammarNext();
  const grammarStarted = Content.grammar.some(c => progress.study.courses[c.id]?.completedAt || Study.hasProgress(c.id));
  const rowIds = (group) => (script) => Content.rowGroups[group].map((row) => `${script}-${row}`);
  const basic = rowIds("basic"), voiced = rowIds("voiced"), youon = rowIds("youon");
  // Learners who already moved on to katakana keep going there before returning to voiced hiragana.
  const startedKatakana = basic("k").some((id) => progress.study.courses[id]?.completedAt);
  const kanaIds = startedKatakana ? [...basic("h"), ...basic("k"), ...voiced("h"), ...voiced("k"), ...youon("h"), ...youon("k")] : [...basic("h"), ...voiced("h"), ...youon("h"), ...basic("k"), ...voiced("k"), ...youon("k")];
  // 促音・長音 are lessons on the kana page, not characters: they follow the 52 groups and are resumed like them.
  const soundIds = Content.sounds.map((course) => course.id);
  const unfinished = (id) => Study.hasProgress(id) && progress.study.courses[id]?.active?.phase !== "done";
  const kanaPath = [...kanaIds, ...soundIds];
  const nextKana = kanaPath.find(unfinished) || kanaPath.find((id) => !progress.study.courses[id]?.completedAt) || "h-a";
  const sound = soundIds.includes(nextKana);
  const kanaTitle = Study.title(nextKana);
  const review = Study.reviewSummary();
  const kanaOpen = unfinished(nextKana);
  const saved = Study.dashboardSummary().savedPhrases;
  const newVisitor = !progress.completed && !progress.inProgress && !progress.history.length && !saved && !Object.keys(progress.study.courses).some(id => Study.hasProgress(id) || progress.study.courses[id]?.completedAt);
  const allKanaDone = kanaPath.every((id) => progress.study.courses[id]?.completedAt);
  const kanaStarted = kanaPath.some((id) => progress.study.courses[id]?.completedAt || unfinished(id));
  const kanaNext = kanaStarted && (kanaOpen || !allKanaDone) ? { id: nextKana, title: kanaTitle, open: kanaOpen, sound } : null;
  const entry = (kind, image, title, description, label, action) => `<article class="home-entry ${kind}-entry">${friend("home-entry-art", "", image, 128, "(max-width: 360px) 80px, (max-width: 899px) 112px, 128px")}<div class="home-entry-copy"><h2>${title}</h2><p>${description}</p><button class="primary" data-action="${action}">${label}${icons.arrow}</button></div></article>`;
  const shortcuts = `<section class="home-shortcuts" aria-labelledby="quick-title"><div><h2 id="quick-title">隨機練習</h2><p>每輪 5 題，從最基礎的內容開始。不記成績。</p></div><div class="quick-actions"><button class="text-button" data-action="study-kana-random" aria-label="五十音隨機練習"><span>五十音<span class="quick-detail">隨機</span>練習</span>${icons.arrow}</button><button class="text-button" data-action="study-grammar-random" aria-label="句型隨機練習"><span>句型<span class="quick-detail">隨機</span>練習</span>${icons.arrow}</button></div></section>`;
  const entries = `<section class="home-entries" aria-label="學習與旅遊">${entry("kana", "cloud-kana", "五十音", "入門必學，搭配各式技巧好好記熟。", "學五十音", "kana")}${entry("grammar", "cloud-complete", "基礎句型", "日文基本的句子架構。", "學基礎句型", "grammar")}${entry("travel", "cloud-travel", "旅遊常用語", "記好這些關鍵字，不用完整句，也能清楚表達意思。", "查常用語", "travel")}${entry("drill", "cloud-drill", "基礎刷題", "練習本站提到的日文基礎，也可作為 N5、N4 的準備。", progress.study.drill.session ? "接著刷題" : "開始刷題", "study-drill")}</section>`;
  const below = newVisitor ? `<div class="script-supplement intro-entry"><button class="text-button" data-action="start">認識三種日文寫法${icons.arrow}</button><p>平假名、片假名與漢字的用法。</p></div>` : homeDashboard({ grammarNext, grammarStarted, begun, review, saved, kanaNext, otherSounds: soundIds.filter((id) => id !== nextKana && unfinished(id)) });
  app.innerHTML = `<div class="shell">
    <header class="site-header home-header"><a class="brand" href="#home" aria-label="SoraChi 首頁">${friend("", "", "cloud-friend", 42)}<span class="brand-word">SoraChi<span class="brand-dot">.</span></span></a><div class="header-tools">${Navigation.accountLink()}${Navigation.feedbackLink()}</div></header>
    <main id="main" tabindex="-1" class="home"><section class="welcome"><h1 class="focus-heading" tabindex="-1">日文入門</h1><p>零基礎也可以用。學五十音、練句型，旅行時查常用語。</p></section>
    ${shortcuts}
    ${entries}
    ${below}
    <aside class="gentle-note">${icons.book}<span>${account.user() ? "目前使用帳號進度；可到「帳號」儲存雲端備份。" : "不用登入也能學；訪客進度保存在這個瀏覽器。"}</span></aside>${warning()}</main>${footer()}</div>`;
}

// Stable illustrated entries stay above the returning learner’s next steps and local progress.
// No streaks or points: the numbers only describe what has been learned, and each appears once.
function homeDashboard({ grammarNext, grammarStarted, begun, review, saved, kanaNext, otherSounds }) {
  const courses = progress.study.courses, done = (id) => Boolean(courses[id]?.completedAt);
  const kanaIds = (script) => Object.values(Content.rowGroups).flat().map((row) => `${script}-${row}`);
  const chars = (ids) => ids.reduce((sum, id) => sum + Study.total(id), 0);
  const grammarDone = Content.grammar.filter((course) => done(course.id)).length;
  const soundsDone = Content.sounds.filter((course) => done(course.id)).length;
  const hasRecord = progress.history.length > 0 || Object.keys(courses).some(done);
  const scored = progress.history.filter((entry) => Number.isInteger(entry.firstCorrect) && entry.total > 0);
  // Rounded down, so one slip in a thousand never shows as 100%.
  const firstRight = scored.length ? Math.floor(100 * scored.reduce((sum, entry) => sum + entry.firstCorrect, 0) / scored.reduce((sum, entry) => sum + entry.total, 0)) : null;
  const units = Study.grammarUnits().map((unit) => ({ title: unit.title, total: unit.lessons.length, done: unit.lessons.filter((course) => done(course.id)).length }));
  const { grammarReviewSize, grammarReviewResume } = Study.dashboardSummary();
  const stat = (label, value, unit) => `<div><dt>${label}</dt><dd><strong>${value}</strong>${unit}</dd></div>`;
  const bar = (label, count, total) => `<li><span>${escapeHTML(label)}</span><span class="dash-count">${count} / ${total} 課</span><span class="dash-bar" aria-hidden="true"><i style="width:${total ? Math.round(100 * count / total) : 0}%"></i></span></li>`;
  // Rows that only change page are links; rows that open a lesson or a round are buttons.
  const row = (target, title, text, meta = "") => `<li>${target.startsWith("#") ? `<a class="dash-row" href="${target}">` : `<button class="dash-row" ${target}>`}<span class="dash-row-main"><strong>${title}</strong><span>${text}</span></span>${meta ? `<span class="dash-row-meta">${meta}</span>` : ""}${icons.arrow}${target.startsWith("#") ? "</a>" : "</button>"}</li>`;
  // The writing-system introduction is offered next while it is paused or before any practice; otherwise it waits under the learning tools.
  const introNext = begun || (!progress.completed && !hasRecord);
  const intro = row('data-action="start"', "日文的三種文字", begun ? `接著學，上次學到第 ${progress.step + 1} 步` : "平假名、片假名與漢字的用法", introNext ? "" : progress.completed ? "已完成" : "還沒看");
  const unitOf = (id) => escapeHTML(Content.lessonPlan[id]?.unit || "");
  const kanaRow = kanaNext ? row(`data-action="study-open" data-course="${kanaNext.id}"`, "五十音", `${kanaNext.open ? "接著學" : kanaNext.sound ? "下一課" : "下一組"}：${escapeHTML(kanaNext.title)}`) : "";
  const grammarRow = grammarNext ? grammarStarted ? row(`data-action="study-open" data-course="${grammarNext.courseId}"`, "基礎句型", `${grammarNext.resume ? "接著學" : "下一課"}：${escapeHTML(grammarNext.title)}`, unitOf(grammarNext.courseId)) : row("#grammar", "基礎句型", `從第一課開始：${escapeHTML(grammarNext.title)}`, unitOf(grammarNext.courseId)) : "";
  // Unfinished lessons first, in the order of the welcome line, then what comes next.
  const next = [
    kanaNext?.open ? kanaRow : "",
    // An unfinished 促音・長音 lesson other than the one above.
    ...otherSounds.map((id) => row(`data-action="study-open" data-course="${id}"`, "五十音", `接著學：${escapeHTML(Study.title(id))}`)),
    grammarNext?.resume ? grammarRow : "",
    kanaNext?.open ? "" : kanaRow,
    grammarNext?.resume ? "" : grammarRow,
    review.availableCount ? row('data-action="study-review-start"', "五十音複習", review.wrongCount ? `先練上次答錯的 ${review.wrongCount} 個字` : "從學過的字挑幾個混在一起練", review.canResume ? "繼續" : `${Math.min(5, review.availableCount)} 個字`) : "",
    grammarReviewSize ? row('data-action="study-grammar-review"', "句型小複習", "從完成的課裡挑幾題混在一起練", grammarReviewResume ? "繼續" : `${grammarReviewSize} 題`) : "",
    saved ? row("#travel/favorites", "我的常用語", "收藏的旅遊用語", `${saved} 張`) : "",
    introNext ? intro : "",
  ].join("");
  const progressPanel = hasRecord
    ? `<dl class="dash-stats">${stat("平假名", chars(kanaIds("h").filter(done)), ` / ${chars(kanaIds("h"))} 字`)}${stat("片假名", chars(kanaIds("k").filter(done)), ` / ${chars(kanaIds("k"))} 字`)}${stat("促音・長音", soundsDone, ` / ${Content.sounds.length} 課`)}${stat("基礎句型", grammarDone, ` / ${Content.grammar.length} 課`)}${stat("上次答錯的字", review.wrongCount, " 個")}${stat("第一次答對", firstRight === null ? "還沒有" : firstRight, firstRight === null ? "" : "%")}</dl>
      <details class="dash-units"><summary>句型各單元進度</summary><ul class="dash-bars">${units.map((unit) => bar(unit.title, unit.done, unit.total)).join("")}</ul></details>
      <p class="dash-note">${scored.length ? `依這個瀏覽器最近 ${scored.length} 次完成的練習計算。第一次答對只算每題第一次的選擇，重試和複習不算。` : "依這個瀏覽器的紀錄計算。"}</p>`
    : `<p class="dash-note">完成第一組練習後，這裡會顯示學過多少。</p>`;
  const records = progress.history.length >= DataStore.MAX_ATTEMPTS ? `最近 ${DataStore.MAX_ATTEMPTS} 次` : progress.history.length ? `${progress.history.length} 次` : "";
  return `<div class="home-dashboard">
    ${next ? `<section class="dash-next" aria-labelledby="dash-next-title"><h2 id="dash-next-title">接著做</h2><ul class="dash-list">${next}</ul></section>` : ""}
    <section class="dash-progress" aria-labelledby="dash-progress-title"><h2 id="dash-progress-title">你的進度</h2>${progressPanel}</section>
    <section class="dash-tools" aria-labelledby="dash-tools-title"><h2 id="dash-tools-title">其他學習工具</h2><ul class="dash-list">${introNext ? "" : intro}${row("#history", "學習紀錄", "完成時間與第一次作答的成績", records)}</ul></section>
  </div>`;
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
  app.innerHTML = `<div class="lesson-shell">${Navigation.header(location.hash)}<div class="lesson-progress"><div class="track" role="progressbar" aria-label="日文的三種文字進度" aria-valuemin="1" aria-valuemax="${TOTAL_STEPS}" aria-valuenow="${step + 1}" aria-valuetext="第 ${step + 1} 步，共 ${TOTAL_STEPS} 步"><span style="width:${((step + 1) / TOTAL_STEPS) * 100}%"></span></div><span class="step-count">${step + 1} / ${TOTAL_STEPS}</span></div>
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
  app.innerHTML = `<div class="lesson-shell">${Navigation.header(location.hash)}<main id="main" tabindex="-1" class="finish"><div class="finish-art">${friend("", "SoraChi 雲朵精靈開心地抱著小書，陪你完成日文的三種文字", "cloud-complete", 160)}<span class="finish-check">${icons.check}</span></div><h1 tabindex="-1" class="focus-heading">日文的三種文字已完成</h1><p>本課介紹了平假名、片假名和漢字。</p><div class="summary"><span><b lang="ja">ねこ</b> · 平假名</span><span><b lang="ja">パン</b> · 片假名</span><span><b lang="ja">山</b> · 漢字</span></div>${resultCard()}<div class="finish-actions"><button class="primary" data-action="kana">接著認識五十音${icons.arrow}</button><button class="text-button" data-action="home">回首頁</button><button class="text-button" data-action="restart">再看一次這堂課</button></div><p class="storage-note">${canStore ? "完成紀錄已保存在這個瀏覽器。" : "這次已完成，但瀏覽器無法保存紀錄。"}</p>${warning()}</main>${footer()}</div>`;
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
  return `<section class="backup-panel" aria-labelledby="backup-title"><h2 id="backup-title">備份</h2><p>進度、收藏與設定都存在這個瀏覽器。換瀏覽器或清除網站資料前，可以先下載備份檔，之後再還原。</p><div class="quiet-links"><button class="text-button" data-action="export-backup">下載備份</button><label class="text-button file-button">從備份檔還原<input type="file" id="backup-file"></label></div><p id="backup-status" role="status" aria-live="polite"></p></section>`;
}
function importSummary(result) {
  if(!result.ok && result.reason === "owner") return "這份備份屬於另一個帳號，請先登入原本的帳號再匯入。這台裝置的紀錄沒有改動。";
  if (!result.ok) return result.reason === "too-large" ? "這個檔案太大，不像 SoraChi 的備份檔。" : result.reason === "write" ? (dataStore.isConflict() ? "另一個分頁更新了資料，請重新整理後再還原。" : "這次沒有還原成功，瀏覽器無法儲存。原本的紀錄沒有改動。") : "讀不懂這個檔案，請選 SoraChi 下載的備份檔。原本的紀錄沒有改動。";
  return `已從備份還原：新增 ${result.added} 筆紀錄${result.existing ? `，${result.existing} 筆原本就有` : ""}${result.skipped ? `，${result.skipped} 筆較舊的紀錄超過 ${DataStore.MAX_ATTEMPTS} 筆上限，沒有加入` : ""}${result.dropped ? `，本機 ${result.dropped} 筆較舊的紀錄超過 ${DataStore.MAX_ATTEMPTS} 筆上限，已移除` : ""}。課程進度已合併${result.clearApplied ? "；其中一邊較晚清除過紀錄，未完成的五十音練習、五十音複習與句型小複習以那一邊為準" : ""}。`;
}
async function importFile(file) {
  const status = app.querySelector("#backup-status");
  if (!file) return;
  if (file.size > DataStore.MAX_BACKUP_CHARS * 4) { status.textContent = importSummary({ok:false,reason:"too-large"}); return; }
  let result;
  const targetStore=dataStore;
  try { const raw=await file.text(); if(restarting || targetStore !== dataStore) return; result = targetStore.importBackupDetailed(raw); } catch { result = {ok:false,reason:"invalid"}; }
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
  app.innerHTML = `<div class="lesson-shell">${Navigation.header(location.hash)}<main id="main" tabindex="-1" class="utility-main"><h1 class="focus-heading" tabindex="-1">學習紀錄</h1><p class="utility-intro">課後練習會記錄成績；基礎刷題會記住這次練習，回首頁可接著做。</p>${entries.length ? `<p class="record-note">保留最近 ${DataStore.MAX_ATTEMPTS} 次完成紀錄。「第一次答對」以每題第一次選擇計算，重試不會改寫成績。</p><ol class="history-list" role="list">${entries.map((entry) => `<li><div class="record-top"><span>${entry.courseId ? escapeHTML(entry.courseTitle || Study.title(entry.courseId) || entry.courseId) : "日文的三種文字"}</span><time datetime="${entry.date}">${new Date(entry.date).toLocaleString("zh-TW", {month:"numeric",day:"numeric",year:"numeric",hour:"2-digit",minute:"2-digit",hour12:false})}</time></div><h2>${entry.firstCorrect === null ? "已完成 · 未記錄第一次作答成績" : `第一次答對 <strong>${entry.firstCorrect} / ${entry.total || 2}</strong> 題`}</h2><p>${entry.retryQuestions.length ? `第一次答錯：${entry.courseId ? Study.retryLabels(entry).map(escapeHTML).join("、") : entry.retryQuestions.map((q) => `第 ${q - 3} 題`).join("、")}` : entry.firstCorrect === (entry.total || 2) ? "全部題目第一次都答對。" : "這次已完成練習。"}</p></li>`).join("")}</ol>` : dataStore.isProtected() ? `<section class="empty-record">${icons.book}<h2>目前無法讀取成績紀錄</h2></section>` : `<section class="empty-record">${icons.book}<h2>還沒有新的成績紀錄</h2><p>${progress.completed ? "你已完成過日文的三種文字；舊版尚未留下成績。下次練習完成後，就會記在這裡。" : "完成一堂課的課後練習，紀錄就會顯示在這裡。"}</p><button class="primary" data-action="kana">看五十音表${icons.arrow}</button></section>`}${recoveryPanel(confirmRestart)}${backupPanel()}<p class="record-note">進度會先保存在這個瀏覽器。也可到<a href="#account">我的帳號</a>手動儲存雲端備份；清除網站資料前請先備份。</p>${warning()}${!dataStore.isProtected() && (entries.length || hasReviewData) ? confirmClear ? `<section class="clear-confirm" aria-label="確認清除"><p>清除全部成績與複習紀錄？這也會結束尚未完成的五十音練習、五十音複習、句型小複習與基礎刷題；已完成狀態與其他課程進度會保留。</p><div class="quiet-links"><button class="text-button" data-action="history">先保留</button><button class="text-button" data-action="confirm-clear">確認清除紀錄</button></div></section>` : `<button class="text-button clear-button" data-action="clear-history">清除成績與複習紀錄</button>` : ""}</main>${footer()}</div>`;
  focusHeading();
  // Announce the restore result once, after the page exists, so the live region reads it.
  if (importNote) {
    const note = importNote; importNote = null;
    setTimeout(() => { const status = app.querySelector("#backup-status"); if (status) status.textContent = note; }, 50);
  }
}
function captureFeedback(hash) {
  const id = hash.startsWith("#study/") ? hash.slice(7) : null;
  return Diagnostics.capture({hash, progress, scripts: document.scripts, practice: Study.currentPractice(), review: Study.currentReview(), ...(id ? {attempt: Study.currentAttempt(id)} : {})});
}
function feedbackPage() {
  feedbackDiagnostics ||= captureFeedback("#home");
  document.title = "問題與建議｜SoraChi";
  const direct=directFeedback();
  const form=feedbackSent ? `<section class="account-panel"><h2>已收到你的回報</h2><p>謝謝你告訴我們。回報內容只會提供給網站管理者。</p><button class="primary" data-action="feedback-back">回到剛才的頁面</button><button class="text-button" data-action="feedback-new">再寫一則</button></section>` : `<form id="feedback-form" class="feedback-form"><fieldset${feedbackBusy?' disabled':''}><label for="feedback-category">回報類型</label><select id="feedback-category" name="category">${["問題回報","學習建議","其他想法"].map(kind => `<option${feedbackDraft.category === kind ? " selected" : ""}>${kind}</option>`).join("")}</select><label for="feedback-message">內容</label><textarea id="feedback-message" name="message" rows="5" maxlength="600" aria-describedby="feedback-limit feedback-privacy" required placeholder="例如：這個說明看不太懂，希望多一個例子。">${escapeHTML(feedbackDraft.message)}</textarea><p class="record-note" id="feedback-limit">最多 600 字。會附上所在位置：${escapeHTML(feedbackContext)}，以及版本與教材識別碼。</p>${direct ? `<label for="feedback-contact">聯絡方式（選填）</label><input id="feedback-contact" maxlength="200" value="${escapeHTML(feedbackDraft.contact || "")}" placeholder="希望收到回覆時再填寫 Email" aria-describedby="feedback-privacy"><aside class="feedback-privacy" id="feedback-privacy">不用登入也能送出。內容不公開，只供網站管理者處理；不會附上你的答案或學習紀錄。${account.user()?'目前已登入，回報會附上帳號識別碼；聯絡方式仍由你自行選擇是否填寫。':''}</aside><div id="feedback-challenge"></div><button class="primary" type="submit">${feedbackBusy?'送出中…':'送出回報'}</button>` : `<aside class="feedback-privacy" id="feedback-privacy">站內回報目前尚未連線，可改用 GitHub。需要 GitHub 帳號，送出後內容會公開，請勿填入姓名、Email 或其他私人資料。</aside><button class="primary" type="submit">準備回報內容 ${icons.arrow}</button><p class="record-note">下一步會產生連結，讓你到 GitHub 確認後送出。</p>`}</fieldset><div id="feedback-ready" role="status" aria-live="polite">${escapeHTML(feedbackStatus)}</div></form>`;
  app.innerHTML = `<div class="lesson-shell">${Navigation.header(location.hash, feedbackReturn, "回到剛才的頁面", "feedback-back")}<main id="main" tabindex="-1" class="utility-main"><h1 class="focus-heading" tabindex="-1">問題與建議</h1><p class="utility-intro">回報操作問題、教材錯誤，或提出課程建議。</p>${form}</main>${footer()}</div>`;
  if(direct && !feedbackSent) FeedbackChallenge.mount(CloudConfig.turnstileSiteKey,()=>{ const status=app.querySelector("#feedback-ready"); if(status) status.textContent="驗證沒有載入，請確認網路後重新開啟回報頁。內容會保留。"; });
  focusHeading();
}
async function sendDirectFeedback(category, message) {
  if(feedbackBusy) return;
  const challenge=FeedbackChallenge.token();
  if(!challenge) { app.querySelector("#feedback-ready").textContent="請先完成下方驗證，再送出回報。"; return; }
  feedbackDraft={category,message,contact:app.querySelector("#feedback-contact")?.value || ""};
  feedbackSubmission ||= crypto.randomUUID();
  const id=feedbackSubmission;
  feedbackBusy=true; feedbackStatus="送出中…";
  const fields=app.querySelector("fieldset"); if(fields) fields.disabled=true;
  app.querySelector("#feedback-ready").textContent=feedbackStatus;
  try {
    await account.service().sendFeedback({id,category:{"問題回報":"bug","學習建議":"wish","其他想法":"other"}[category],message,contact:feedbackDraft.contact,context:feedbackContext,diagnostics:feedbackDiagnostics,challenge});
    if(feedbackSubmission===id) { feedbackSent=true; feedbackDraft={category:"問題回報",message:"",contact:""}; feedbackStatus=""; }
  } catch { feedbackStatus="這次沒有送出成功，內容已保留。請再試一次。"; }
  finally { feedbackBusy=false; if(location.hash==="#feedback") feedbackPage(); }
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
app.addEventListener("input", (event) => {
  if (event?.target?.id === "travel-search") { Study.searchTravel(event.target.value, event.isComposing); return; }
  if (location.hash !== "#feedback" || feedbackBusy || feedbackSent) return;
  feedbackSubmission=null; feedbackStatus="";
  feedbackDraft = {category: app.querySelector("#feedback-category").value, message: app.querySelector("#feedback-message").value, contact: app.querySelector("#feedback-contact")?.value || ""};
  app.querySelector("#feedback-ready").replaceChildren();
});
// A word finished with an input method searches once, when it is done. Enter in the search box moves to the results
// heading: the results are already there, a phone keyboard closes and a keyboard user keeps their place. The Enter
// that finishes an input method's word does not move (Safari sends it after compositionend, with keyCode 229).
app.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" || event.isComposing || event.keyCode === 229 || event.target?.id !== "travel-search") return;
  const heading = app.querySelector("#travel-results")?.querySelector("h2");
  if (heading) { event.preventDefault(); heading.focus(); }
});
app.addEventListener("compositionend", (event) => {
  if (event.target?.id === "travel-search") Study.searchTravel(event.target.value);
});
app.addEventListener("submit", (event) => {
  if (event.target.id !== "feedback-form") return;
  event.preventDefault();
  if(feedbackBusy) return;
  const message = app.querySelector("#feedback-message");
  const category = app.querySelector("#feedback-category").value;
  if (!message.value.trim() || message.value.length > 600) {
    message.setCustomValidity(message.value.length > 600 ? "請縮短到 600 字以內。" : "請先寫下一點內容。");
    message.reportValidity();
    message.addEventListener("input", () => message.setCustomValidity(""), {once:true});
    return;
  }
  if(directFeedback()) { sendDirectFeedback(category,message.value); return; }
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
  app.innerHTML = `<div class="lesson-shell">${Navigation.header(location.hash)}<main id="main" tabindex="-1" class="utility-main info-page"><h1 class="focus-heading" tabindex="-1">關於 SoraChi</h1>
    <section class="info-section"><h2>緣起</h2><p>把 Jabiko 分享出去後，我發現完全沒有日文基礎的人，其實很難直接使用。五十音還不熟，就要面對單字、句型和題目，往往不知道從哪裡開始。所以另外做了 SoraChi，從五十音和基本句子架構開始，讓零基礎的人也能用。</p><p>後來又想到，這些剛入門的人，也常有去日本旅遊的需求。點餐、結帳、買票、寄放行李，記得幾個簡單的關鍵字，就能處理不少事情，不一定要先學會完整句子。因此 SoraChi 把旅遊常用語獨立成一區，需要時可以直接查，也能在出發前先記熟。</p><p>學習內容會逐步往 N5／N4 延伸，目前先把入門基礎整理好。</p></section>
    <section class="info-section"><h2>吉祥物：雲朵精靈</h2><p>Sora（そら）在日文裡是「天空」；Chi 則取自「ちゃん（chan）」親暱、可愛的稱呼語感，組成了 SoraChi 這個名字。</p><p>吉祥物是一隻頭上有淡紫色葉子、繫著淡黃色圍巾的雲朵精靈，和 Sora 的天空意象相呼應。</p>${friend("about-mascot", "SoraChi 的雲朵精靈", "cloud-friend", 150, "(max-width: 540px) 120px, 150px")}</section>
    <section class="info-section"><h2>作者</h2><p class="author-name">花雪（HanaYukii）</p><p>程式競賽選手出身，碩士畢業後進入 Google，任職三年，目前在 AI 新創從事研發工作，也大量接觸 AI agent。</p><p>以前考過日檢 N2，2024 年重新追起日系偶像後又開始使用日文，也製作過大量偶像相關翻譯素材。</p><p>除了翻譯，也持續開發日文練習網站 Jabiko 與 SoraChi，整理教材、練習功能與題庫。</p><p>除了這個入門版本，後續也會推出適合我自己程度使用的 N2、N1 與 Post-N1（N1 之後的進階學習）版本。</p><a class="text-button" href="https://hanayukii.dev/about" target="_blank" rel="noopener noreferrer">作者的個人網站 ↗</a></section>
    </main>${footer()}</div>`;
  focusHeading();
}
function route() {
  // Do not open or save a lesson under the guest owner while a saved login is loading.
  if(accountLoading) return;
  FeedbackChallenge.dispose();
  // Keep old bookmarks working, with one canonical home address and no extra history entry.
  if (location.hash === "#home") window.history.replaceState(window.history.state, "", (location.pathname || "./") + (location.search || ""));
  Study.stopAudio();
  cameFrom = exits.includes(window.history.state?.from) ? window.history.state.from : null;
  // The lesson on screen until now, so its list can bring that row back into view.
  const leaving = shown?.startsWith("#study/") ? shown.slice(7) : null, left = Study.title(leaving) ? leaving : null;
  // A historical completion URL must never claim an active replay is finished.
  if (location.hash === "#done" && progress.inProgress) {
    replaceRoute("#lesson");
    return;
  }
  // The retired #study/t-* travel courses now live in the phrasebook under the same id.
  const retired = location.hash.match(/^#study\/(t-[a-z-]+)$/)?.[1];
  if (retired && Study.travelTitle(retired)) {
    replaceRoute(`#travel/${retired}`);
    return;
  }
  selectedWrong = null;
  window.scrollTo({ top: 0, behavior: "instant" });
  const studyPage = Study.render(location.hash);
  // Pages without a route of their own show home.
  shown = studyPage !== null || ["#lesson", "#history", "#feedback", "#about", "#account"].includes(location.hash) || location.hash === "#done" && progress.completed ? location.hash : "#home";
  shownHash = location.hash;
  if (studyPage !== null) {
    document.title = `${Navigation.page(location.hash).title}｜SoraChi`;
    app.innerHTML = studyPage;
    focusHeading();
    // Back on the kana table or the grammar list from a lesson, that lesson's row is in view and has focus.
    const row = (location.hash === "#kana" || location.hash === "#grammar") && left ? app.querySelector(`.course-row[data-course="${left}"]`) : null;
    if (row) { const unit = row.closest?.("details"); if (unit) unit.open = true; row.focus({ preventScroll: true }); row.scrollIntoView?.({ block: "center" }); }
    // A travel card opened from a search result, or back on the search, the result that was opened.
    const found = app.querySelector(".travel-found") || app.querySelector(".return-focus");
    if (found) { found.focus({ preventScroll: true }); found.scrollIntoView?.({ block: found.matches?.(".return-focus") ? "center" : "start" }); }
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
  else if (location.hash === "#feedback") {
    // A feedback page keeps its way back, context and report in its history entry, so going back to an older one
    // returns where that one came from.
    const saved = window.history.state?.feedback;
    if (saved) ({ back: feedbackReturn, context: feedbackContext, diagnostics: feedbackDiagnostics } = saved);
    else window.history.replaceState({ ...window.history.state, feedback: { back: feedbackReturn, context: feedbackContext, diagnostics: feedbackDiagnostics } }, "");
    shownFeedback = JSON.stringify(window.history.state?.feedback ?? null);
    feedbackPage();
  }
  else if (location.hash === "#about") aboutPage();
  else if (location.hash === "#account") accountPage();
  else {
    home();
    focusHeading();
  }
}
function replaceRoute(hash) {
  window.history.replaceState({ from: null }, "", hash);
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
  // The second click of a double click never answers: after 再練, 下一題 or 開始練習 a new option can sit under the pointer.
  // When it lands on an option already answered, focus goes back to 下一題, where the answer had put it.
  if (event.detail > 1 && (button.dataset.action === "study-answer" || button.dataset.answer !== undefined)) {
    const next = button.dataset.action === "study-answer" ? app.querySelector('[data-action="study-next"]') : null;
    if (next && !next.disabled) next.focus({ preventScroll: true });
    return;
  }
  if (button.dataset.action?.startsWith("account-")) { account.action(button.dataset.action); return; }
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
      // Before the records go, so the clear is dated after them.
      Study.clearReview();
      progress.history = [];
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
    case "feedback-new":
      if(feedbackBusy) break;
      feedbackSent=false; feedbackSubmission=null; feedbackStatus=""; feedbackPage(); break;
    case "feedback":
      if (location.hash !== "#feedback" && !feedbackBusy) {
        if(feedbackSent) { feedbackSent=false; feedbackSubmission=null; }
        feedbackDiagnostics = captureFeedback(location.hash || "#home");
        feedbackReturn = Navigation.page(location.hash).kind !== "unknown" || Study.context(location.hash) ? location.hash : "#home";
        feedbackContext = Study.context(feedbackReturn) || (feedbackReturn === "#lesson" ? `日文的三種文字・第 ${progress.step + 1} 步${progress.step >= 4 ? `・小練習 ${progress.step - 3}` : ""}` : feedbackReturn === "#done" ? "日文的三種文字完成頁" : feedbackReturn === "#home" ? "首頁" : Navigation.page(feedbackReturn).title);
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
  if (event.key !== null && event.key !== dataStore.key) return;
  dataStore.checkForUpdates();
  canStore = dataStore.canPersist();
  updateStorageWarning();
});
window.addEventListener("hashchange", arrive);
// Back or forward between two entries with the same address fires no hashchange, but their sources can differ, and
// two feedback pages with the same source can be about different pages.
window.addEventListener("popstate", () => {
  if (location.hash !== shownHash) return;
  const from = exits.includes(window.history.state?.from) ? window.history.state.from : null;
  if (from !== cameFrom || location.hash === "#feedback" && JSON.stringify(window.history.state?.feedback ?? null) !== shownFeedback) route();
});
// The page opened first has no source; marking it keeps a later visit back from giving it one.
if (window.history.state?.from === undefined) window.history.replaceState({ from: null }, "");
route();
function beforeUpdateReload() {
  if (restarting) return false;
  const draft = app.querySelector("#feedback-message")?.value ?? feedbackDraft.message;
  const warning = !canStore ? "目前有進度無法儲存，更新後可能無法接續。要現在更新嗎？"
    : draft.trim() ? "更新會清除尚未送出的回報內容。要現在更新嗎？"
    : /^#(?:(?:kana|grammar)-random)$/.test(location.hash) ? "這輪隨機練習不會保存，更新後會重新開始。要現在更新嗎？" : "";
  if (warning && !window.confirm(warning)) return false;
  restarting = true;
  Study.stopAudio();
  return true;
}
UpdateNotice.start({ beforeReload: beforeUpdateReload });
account.start();
