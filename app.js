"use strict";

const app = document.querySelector("#app");
const STORAGE_KEY = "sorachi:first-lesson:v1";
const TOTAL_STEPS = 6;
let canStore = true;
let progress = { step: 0, completed: false, inProgress: false, answers: {}, firstAnswers: {}, history: [] };
let selectedWrong = null;
let feedbackReturn = "#home";
let feedbackContext = "首頁";
let feedbackDraft = { category: "問題回報", message: "" };
const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
function validHistory(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => item && typeof item.date === "string" && Number.isFinite(Date.parse(item.date)) &&
    (item.firstCorrect === null || (Number.isInteger(item.firstCorrect) && item.firstCorrect >= 0 && item.firstCorrect <= 2)) &&
    Array.isArray(item.retryQuestions) && item.retryQuestions.every((q) => q === 4 || q === 5))
    .slice(-30).map(({date, firstCorrect, retryQuestions}) => ({date: new Date(date).toISOString(), firstCorrect, retryQuestions: [...new Set(retryQuestions)]}));
}

let saved = null;
try {
  const raw = localStorage.getItem(STORAGE_KEY);
  // Corrupt data can be discarded; it does not mean storage access is blocked.
  try {
    saved = JSON.parse(raw || "null");
  } catch {
    /* Start fresh. */
  }
} catch {
  canStore = false;
}

if (saved && typeof saved === "object") {
  progress = {
    step: Number.isInteger(saved.step)
      ? Math.max(0, Math.min(5, saved.step))
      : 0,
    completed: saved.completed === true,
    inProgress:
      saved.inProgress === true ||
      (saved.inProgress === undefined && saved.step > 0 && !saved.completed),
    answers: { 4: saved.answers?.[4] === true, 5: saved.answers?.[5] === true },
    firstAnswers: Object.fromEntries([4, 5].filter((q) => typeof saved.firstAnswers?.[q] === "boolean").map((q) => [q, saved.firstAnswers[q]])),
    history: validHistory(saved.history),
  };
  // Never restore a later question unless the prerequisite was answered.
  if (progress.step === 5 && !progress.answers[4]) progress.step = 4;
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    canStore = true;
  } catch {
    canStore = false;
  }
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
const friend = (className = "", alt = "", asset = "cloud-friend.png") =>
  `<img class="${className}" src="./assets/${asset}" alt="${alt}" width="400" height="420">`;
const footer = () =>
  '<footer class="footer"><span class="jp" lang="ja">ひとつずつ、ゆっくり。</span><nav class="quiet-links" aria-label="小工具"><button class="text-button" data-action="history">學習紀錄</button><button class="text-button" data-action="feedback">問題與建議</button></nav></footer>';
const warning = () =>
  canStore
    ? ""
    : '<p class="storage-warning" role="status">目前瀏覽器無法儲存進度；這次仍可正常上課，關閉後可能需要重新開始。</p>';

function home() {
  document.title = "SoraChi｜日語，從一小步開始";
  const begun = progress.inProgress;
  const action = begun
    ? "接著學"
    : progress.completed
      ? "再練習一次"
      : "開始第一堂小課";
  app.innerHTML = `<div class="shell">
    <header class="site-header"><a class="brand" href="#home" aria-label="SoraChi 首頁">${friend()}<span class="brand-word">SoraChi<span class="brand-dot">.</span></span></a><span class="header-note">日語，從一小步開始</span><span class="prototype">${begun || progress.completed ? "歡迎回來" : "初次見面"}</span></header>
    <main id="main" tabindex="-1" class="home"><section class="welcome"><div class="eyebrow">給剛開始學日文的你</div><h1 class="focus-heading" tabindex="-1">慢慢來，<br class="mobile-break">今天學一點就好。</h1><p>不需要先會五十音，也不用知道從哪裡開始。<br>和 SoraChi 一起，從第一個小觀念學起。</p></section>
    <section class="lesson-hero" aria-labelledby="course-title"><div class="hero-copy"><div class="lesson-label"><span class="number">LESSON 01</span><span>認識日文</span></div><h2 id="course-title">日文，有三種文字？</h2><p class="hero-description">あ、ア、山，看起來很不一樣。<br>先認識它們，日文就不再那麼陌生。</p><div class="meta"><span>${icons.clock} 約 3–5 分鐘</span><span>${icons.leaf} 零基礎也可以</span></div><button class="primary" data-action="start">${action}${icons.arrow}</button>${begun ? `<p class="home-progress">上次學到第 ${progress.step + 1} 步，進度已幫你留著。</p>` : progress.completed ? `<p class="home-progress visited">${icons.check} 第一堂小課，已完成</p>` : ""}</div><div class="hero-art" aria-hidden="true"><span class="spark">✦</span><span class="small-spark">✧</span><span class="kana-float" lang="ja">あ</span><span class="orbit"></span>${friend()}</div></section>
    <section class="under-hero" aria-label="這堂課的學習重點"><div><h3 class="section-kicker">今天，只認識這三位新朋友</h3></div><div class="three-things"><div class="tiny-script"><strong lang="ja">あ</strong>平假名</div><div class="tiny-script"><strong lang="ja">ア</strong>片假名</div><div class="tiny-script"><strong lang="ja">山</strong>漢字</div></div></section>
    <aside class="gentle-note">${icons.book}<span>這裡不用趕進度。先看懂一個觀念，再用兩個小問題試試看。</span></aside>${warning()}</main>${footer()}</div>`;
}

const lessons = [
  {
    label: "先認識一下",
    title: "日文的三種文字，常常一起出現。",
    intro: "它們各有自己的樣子，也各有用途。這堂課先認識名字和例子就好。",
    content: `<div class="script-row"><div class="script-cell"><div class="character" lang="ja">あ</div><p>平假名</p></div><div class="script-cell"><div class="character" lang="ja">ア</div><p>片假名</p></div><div class="script-cell"><div class="character" lang="ja">山</div><p>漢字</p></div></div>`,
    tip: "先不用背讀音，也不用一次記住所有字。我們一種一種看。",
  },
  {
    label: "第一位朋友 · 平假名",
    title: "先從平假名認識日文。",
    intro: "平假名可以記錄日文的聲音，也是學習日文的重要起點。",
    content: `<span class="word-type">平假名</span><div class="example-large"><span class="example-word" lang="ja">ねこ</span><span class="example-meaning"><small>意思是</small>貓</span></div><p class="explain"><strong lang="ja">ね、こ</strong> 都是平假名。<br>這兩個字組在一起，就是「貓」。先記住這個例子就好，不用現在背讀音。</p>`,
    tip: "之後學五十音時，我們會再慢慢認識每個字的聲音。",
  },
  {
    label: "第二位朋友 · 片假名",
    title: "外來語，常會用到片假名。",
    intro: "片假名常用來寫從其他語言借來的詞。",
    className: "example-aqua",
    content: `<span class="word-type">片假名</span><div class="example-large"><span class="example-word" lang="ja">パン</span><span class="example-meaning"><small>意思是</small>麵包</span></div><p class="explain"><strong lang="ja">パン</strong> 使用片假名書寫。<br>外來語和外國人名，常會用到片假名。</p>`,
    tip: "片假名也有其他用途，今天先記住「外來語常會用到它」。",
  },
  {
    label: "第三位朋友 · 漢字",
    title: "有些字，你可能已經認得。",
    intro: "日文也使用漢字，像「山」「人」「日」。",
    className: "example-orange",
    content: `<span class="word-type">漢字</span><div class="example-large"><span class="example-word" lang="ja">山</span><span class="example-meaning"><small>意思是</small>山</span></div><p class="explain">漢字能幫助我們辨認詞的意思。<br>不過，<strong>看得懂字形，不代表日文讀音和中文一樣</strong>；讀音之後再學就好。</p>`,
    tip: "認得一些字，是很好的開始。遇到不熟的日文讀音也很正常。",
  },
];
const questions = {
  4: {
    title: "剛剛的「<span lang='ja'>ねこ</span>」，是哪種文字？",
    word: "ねこ",
    note: "剛才見過的「貓」",
    options: ["平假名", "片假名", "漢字"],
    answer: 0,
    correct: "沒錯，是平假名。",
    explanation: "「ね、こ」都是平假名，組在一起表示「貓」。",
    wrong: "沒關係，我們再看一次。",
    hint: "「ねこ」是剛才介紹平假名時的例子。再選一次就好。",
  },
  5: {
    title: "哪一句話，比較接近今天學到的？",
    options: [
      "看得懂漢字，日文讀音就和中文一樣。",
      "平假名、片假名和漢字，可以一起出現在日文裡。",
      "日文只會用平假名。",
    ],
    answer: 1,
    correct: "對，它們會一起出現在日文裡。",
    explanation: "你已經認識這三種文字。下一次看到日文，可以先找找它們的身影。",
    wrong: "沒關係，我們一起回想。",
    hint: "日文會使用三種文字；看起來熟悉的漢字，讀音也可能和中文不同。",
  },
};

function lesson(focus = true) {
  const step = progress.step;
  const isQuiz = step >= 4;
  document.title = "第一堂小課｜SoraChi";
  const current = isQuiz ? questions[step] : lessons[step];
  const answered = progress.answers[step] === true;
  const content = isQuiz
    ? `<span class="question-tag">小練習 ${step - 3} / 2 · 選一個答案</span>${current.word ? `<div class="question-word" lang="ja">${current.word}</div><p class="question-note">${current.note}</p>` : '<div style="height:22px"></div>'}<div class="answers" role="group" aria-label="答案選項">${current.options.map((option, i) => `<button class="answer${answered && i === current.answer ? " correct" : selectedWrong === i ? " wrong" : ""}" data-answer="${i}" ${answered ? 'aria-disabled="true" tabindex="-1"' : ""}><span class="letter">${answered && i === current.answer ? icons.check : String.fromCharCode(65 + i)}</span><span>${option}</span>${answered && i === current.answer ? '<span class="answer-status">答對了</span>' : ""}</button>`).join("")}</div><div class="feedback${selectedWrong !== null ? " wrong" : ""}" role="status" aria-live="polite" aria-atomic="true" ${!answered && selectedWrong === null ? 'style="display:block;padding:0;margin:0"' : ""}>${answered ? `<strong>${current.correct}</strong>${current.explanation}` : selectedWrong !== null ? `<strong>${current.wrong}</strong>${current.hint}` : ""}</div>`
    : current.content;
  app.innerHTML = `<div class="lesson-shell"><header class="lesson-header"><button class="exit" data-action="home">${icons.back}回首頁</button><span class="lesson-name">SoraChi · 認識日文</span></header><div class="lesson-progress"><div class="track" role="progressbar" aria-label="小課進度" aria-valuemin="0" aria-valuemax="${TOTAL_STEPS}" aria-valuenow="${step}"><span style="width:${(step / TOTAL_STEPS) * 100}%"></span></div><span class="step-count">${step + 1} / ${TOTAL_STEPS}</span></div>
    <main id="main" tabindex="-1" class="lesson-main"><div class="eyebrow">${isQuiz ? "不用緊張，試試看" : current.label}</div><h1 tabindex="-1" class="lesson-title focus-heading">${current.title}</h1><p class="lesson-intro">${isQuiz ? "答錯也沒關係，看看提示，再試一次。" : current.intro}</p><section class="content-card ${current.className || ""} ${isQuiz ? "quiz-card" : ""}" aria-label="${isQuiz ? "練習題" : "課程內容"}">${content}</section>${isQuiz ? "" : `<aside class="mascot-tip">${friend()}<span>${current.tip}</span></aside>`}${warning()}
    <div class="lesson-navigation"><button class="back-button" data-action="back">${icons.back}${step === 0 ? "回首頁" : "上一步"}</button><div class="next-wrap"><button class="primary" data-action="next" ${isQuiz && !answered ? "disabled" : ""}>${step === 5 ? "完成這堂小課" : isQuiz ? "下一個小問題" : step === 3 ? "試兩個小問題" : "下一步"}${icons.arrow}</button>${isQuiz && !answered ? '<p class="step-hint">先選一個答案</p>' : ""}</div></div><div class="lesson-utilities"><button class="text-button" data-action="feedback">這一頁有問題？</button></div></main></div>`;
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
  document.title = "完成第一堂小課｜SoraChi";
  app.innerHTML = `<div class="lesson-shell"><header class="lesson-header"><button class="exit" data-action="home">${icons.back}回首頁</button><span class="lesson-name">SoraChi · 第一個小步伐</span></header><main id="main" tabindex="-1" class="finish"><div class="finish-art">${friend("", "SoraChi 雲朵精靈開心地抱著小書，陪你完成第一堂課", "cloud-complete.png")}<span class="finish-check">${icons.check}</span></div><div class="eyebrow">第一堂小課，完成了</div><h1 tabindex="-1" class="focus-heading">你和日文，又熟悉了一點。</h1><p>現在你知道，日文裡有這三種文字。<br>今天學到這裡，就很好。</p><div class="summary"><span><b lang="ja">あ</b> · 平假名</span><span><b lang="ja">ア</b> · 片假名</span><span><b lang="ja">山</b> · 漢字</span></div>${resultCard()}<div class="finish-actions"><button class="primary" data-action="home">回首頁${icons.arrow}</button><button class="text-button" data-action="restart">再看一次這堂課</button></div><p class="storage-note">${canStore ? "完成紀錄已保存在這個瀏覽器。" : "這次已完成，但瀏覽器無法保存紀錄。"}</p>${warning()}</main>${footer()}</div>`;
  focusHeading();
}

function currentResult() {
  const known = [4, 5].every((q) => typeof progress.firstAnswers[q] === "boolean");
  return {
    date: new Date().toISOString(),
    firstCorrect: known ? [4, 5].filter((q) => progress.firstAnswers[q]).length : null,
    retryQuestions: [4, 5].filter((q) => progress.firstAnswers[q] === false),
  };
}
function resultCard() {
  const result = currentResult();
  if (result.firstCorrect === null) return "";
  return `<div class="result-card"><span>這次的小練習</span><strong>第一次答對 ${result.firstCorrect} / 2 題</strong><p>${result.firstCorrect === 2 ? "兩個小觀念，都掌握了。" : "看過提示後，兩題都完成了。再想一次，也是學習。"}</p><button class="text-button" data-action="history">看看學習紀錄 ${icons.arrow}</button></div>`;
}
function historyPage(confirmClear = false) {
  document.title = "學習紀錄｜SoraChi";
  const entries = [...progress.history].reverse();
  app.innerHTML = `<div class="lesson-shell"><header class="lesson-header"><button class="exit" data-action="home">${icons.back}回首頁</button><span class="lesson-name">SoraChi · 小小的累積</span></header><main id="main" tabindex="-1" class="utility-main"><div class="eyebrow">每一步，都算數</div><h1 class="focus-heading" tabindex="-1">學習紀錄</h1><p class="utility-intro">記下每一次練習，不急著和誰比較。</p>${entries.length ? `<p class="record-note">保留最近 30 次完成紀錄。「第一次答對」以每題第一次選擇計算，重試不會改寫成績。</p><ol class="history-list">${entries.map((entry) => `<li><div class="record-top"><span>認識日文 · 第一課</span><time datetime="${entry.date}">${new Date(entry.date).toLocaleString("zh-TW", {month:"numeric",day:"numeric",year:"numeric",hour:"2-digit",minute:"2-digit",hour12:false})}</time></div><h2>${entry.firstCorrect === null ? "已完成 · 未記錄初答成績" : `第一次答對 <strong>${entry.firstCorrect} / 2</strong> 題`}</h2><p>${entry.retryQuestions.length ? `第 ${entry.retryQuestions.map((q) => q - 3).join("、")} 題看過提示後完成` : entry.firstCorrect === 2 ? "兩題都一次答對，做得很好。" : "這次已完成兩題練習。"}</p></li>`).join("")}</ol>` : `<section class="empty-record">${icons.book}<h2>還沒有新的成績紀錄</h2><p>${progress.completed ? "你已完成過第一課；舊版尚未留下成績。下次練習完成後，就會記在這裡。" : "完成第一堂小課後，你的小小累積就會出現在這裡。"}</p><button class="primary" data-action="start">${progress.inProgress ? "接著學" : progress.completed ? "再練習一次" : "開始第一堂小課"}${icons.arrow}</button></section>`}<p class="record-note">只保存在這個瀏覽器，沒有跨裝置同步。清除網站資料也會移除紀錄。</p>${warning()}${entries.length ? confirmClear ? `<section class="clear-confirm" aria-label="確認清除"><p>清除這個瀏覽器的全部成績紀錄？課程進度與已完成狀態會保留。</p><div class="quiet-links"><button class="text-button" data-action="history">先保留</button><button class="text-button" data-action="confirm-clear">確認清除紀錄</button></div></section>` : `<button class="text-button clear-button" data-action="clear-history">清除成績紀錄</button>` : ""}</main>${footer()}</div>`;
  focusHeading();
}
function feedbackPage() {
  document.title = "問題與建議｜SoraChi";
  app.innerHTML = `<div class="lesson-shell"><header class="lesson-header"><button class="exit" data-action="feedback-back">${icons.back}回到剛才的頁面</button><span class="lesson-name">SoraChi · 一起變得更好</span></header><main id="main" tabindex="-1" class="utility-main"><div class="eyebrow">想聽聽你的聲音</div><h1 class="focus-heading" tabindex="-1">問題與建議</h1><p class="utility-intro">哪裡看不懂、哪裡卡住了，或想學些什麼？</p><form id="feedback-form" class="feedback-form"><label for="feedback-category">你想告訴我們什麼？</label><select id="feedback-category" name="category">${["問題回報","學習建議","其他想法"].map((kind) => `<option${feedbackDraft.category === kind ? " selected" : ""}>${kind}</option>`).join("")}</select><label for="feedback-message">內容</label><textarea id="feedback-message" name="message" rows="5" maxlength="600" required placeholder="例如：這個說明看不太懂，希望多一個例子。">${escapeHTML(feedbackDraft.message)}</textarea><p class="record-note">最多 600 字。會附上所在位置：${escapeHTML(feedbackContext)}。</p><aside class="feedback-privacy">這版使用 GitHub 接收回報，需要 GitHub 帳號。送出後內容會公開，請勿填入姓名、Email 或其他私人資料。</aside><button class="primary" type="submit">準備回報內容 ${icons.arrow}</button><p class="record-note">下一步會產生連結，讓你到 GitHub 確認後送出。</p><div id="feedback-ready" role="status" aria-live="polite"></div></form></main>${footer()}</div>`;
  focusHeading();
}
function buildFeedbackURL(category, message, context) {
  const url = new URL("https://github.com/HanaYukii/sorachi/issues/new");
  url.searchParams.set("title", `[${category}] SoraChi 使用回饋`);
  url.searchParams.set("body", `${message.trim()}\n\n---\n所在位置：${context}\n版本：第一課雛形`);
  return url.href;
}
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
function route() {
  // A historical completion URL must never claim an active replay is finished.
  if (location.hash === "#done" && progress.inProgress) {
    go("#lesson");
    return;
  }
  selectedWrong = null;
  window.scrollTo({ top: 0, behavior: "instant" });
  if (location.hash === "#lesson") {
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
  else {
    home();
    focusHeading();
  }
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
  if (!button || button.disabled) return;
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
    case "history":
      go("#history");
      break;
    case "clear-history":
      historyPage(true);
      app.querySelector('[data-action="history"]').focus();
      break;
    case "confirm-clear": {
      const previous = progress.history;
      progress.history = [];
      save();
      if (!canStore) progress.history = previous;
      historyPage();
      if (!canStore) {
        const warning = app.querySelector(".storage-warning");
        warning.textContent = "瀏覽器無法儲存變更，成績紀錄尚未清除。請稍後再試。";
      }
      break;
    }
    case "feedback":
      if (location.hash !== "#feedback") {
        feedbackReturn = ["#lesson", "#done", "#history"].includes(location.hash) ? location.hash : "#home";
        feedbackContext = feedbackReturn === "#lesson" ? `第一課・第 ${progress.step + 1} 步${progress.step >= 4 ? `・小練習 ${progress.step - 3}` : ""}` : feedbackReturn === "#done" ? "第一課完成頁" : feedbackReturn === "#history" ? "學習紀錄" : "首頁";
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
        if (progress.inProgress) progress.history = [...progress.history, currentResult()].slice(-30);
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
window.addEventListener("hashchange", route);
route();
