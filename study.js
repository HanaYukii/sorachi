"use strict";

// Beginner courses share one small, browser-local state. No account is required.
const Study = (() => {
  const ROWS = Content.rows, GRAMMAR = Content.grammar, TRAVEL = Content.travel;
  const PHRASEBOOK = Content.phrasebook, courses = Content.courses;
  const travelItem = (id) => PHRASEBOOK.find(item => item.id === id);
  let api;
  let audioGeneration = 0;
  let voicesListening = false;
  const escape = (text) => String(text).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  const size = (course) => course.type === "kana" ? course.letters.length : course.questions.length;
  const cards = (course) => course.type === "kana" ? course.letters.length : course.steps.length;
  const title = (id) => courses[id]?.title || null;
  const travelTitle = (id) => travelItem(id)?.title || null;
  const total = (id) => courses[id] ? size(courses[id]) : 0;
  const iso = (value) => typeof value === "string" && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : null;
  const permutation = (value, n) => Array.isArray(value) && value.length === n && new Set(value).size === n && value.every((v) => Number.isInteger(v) && v >= 0 && v < n);
  const shuffle = (n) => {
    const list = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  };
  const blankCourse = () => ({ attempts: 0, completedAt: null, lastResult: null, active: null });
  function freshAttempt(course, attempts) {
    return {
      courseRevision: Content.courseRevision(course.id), questionIds: course.questions.map(q => q.id),
      phase: "cards", cursor: 0, order: shuffle(size(course)),
      options: Array.from({ length: size(course) }, (_, q) => shuffle(course.type === "kana" ? size(course) : course.questions[q].options.length)),
      direction: course.type === "kana" && attempts % 2 === 1 ? "reading" : "character",
      first: {}, solved: {}, wrong: null,
    };
  }
  function sanitize(saved) {
    const state = { script: saved?.script === "k" ? "k" : "h", courses: {} };
    for (const [id, course] of Object.entries(courses)) {
      const raw = saved?.courses?.[id];
      if (!raw || typeof raw !== "object") continue;
      const n = size(course);
      const result = blankCourse();
      result.attempts = Number.isInteger(raw.attempts) ? Math.max(0, Math.min(1000000, raw.attempts)) : 0;
      result.completedAt = iso(raw.completedAt);
      if (result.completedAt && raw.lastResult && Number.isInteger(raw.lastResult.firstCorrect) && raw.lastResult.firstCorrect >= 0 && Number.isInteger(raw.lastResult.total) && raw.lastResult.total > 0 && raw.lastResult.firstCorrect <= raw.lastResult.total) {
        result.lastResult = { firstCorrect: raw.lastResult.firstCorrect, total: raw.lastResult.total };
      }
      const active = raw.active;
      // A legacy index-based attempt is safe only against the exact deployed baseline.
      const revision = active?.courseRevision ?? Content.legacyCourseRevision[id];
      const compatibleIds = active?.questionIds === undefined || (Array.isArray(active.questionIds) && active.questionIds.length === n && active.questionIds.every((v,q) => v === course.questions[q].id));
      if (active && revision === Content.courseRevision(id) && compatibleIds && ["cards", "quiz", "done"].includes(active.phase) && permutation(active.order, n) && Array.isArray(active.options) && active.options.length === n && active.options.every((v, q) => permutation(v, course.type === "kana" ? n : course.questions[q].options.length))) {
        const phase = active.phase === "done" && !result.completedAt ? "cards" : active.phase;
        result.active = {
          courseRevision: revision, questionIds: course.questions.map(q => q.id),
          phase, cursor: Math.max(0, Math.min(Number.isInteger(active.cursor) ? active.cursor : 0, (phase === "cards" ? cards(course) : n) - 1)),
          order: [...active.order], options: active.options.map((v) => [...v]),
          direction: course.type === "kana" && active.direction === "reading" ? "reading" : "character",
          first: {}, solved: {}, wrong: null,
        };
        for (let q = 0; q < n; q++) {
          if (typeof active.first?.[q] === "boolean") result.active.first[q] = active.first[q];
          if (active.solved?.[q] === true && typeof result.active.first[q] === "boolean") result.active.solved[q] = true;
        }
        // A restored quiz cannot skip a question that was never completed.
        if (phase === "quiz") {
          const firstOpen = result.active.order.findIndex((q) => !result.active.solved[q]);
          if (firstOpen !== -1) result.active.cursor = Math.min(result.active.cursor, firstOpen);
        }
      }
      state.courses[id] = result;
    }
    return state;
  }
  function bind(callbacks) { api = callbacks; }
  const state = () => api.getState();
  const courseState = (id) => state().courses[id] ||= blankCourse();
  const save = () => api.save();
  const currentId = () => location.hash.startsWith("#study/") ? location.hash.slice(7) : null;
  const backHash = (course) => course.type === "kana" ? "#kana" : course.group === "travel" ? "#travel" : "#grammar";
  const footer = () => api.footer ? api.footer() : "";
  const warning = () => api.warning ? api.warning() : "";
  const wasEarlierDay = (date) => date && new Date(date).toDateString() !== new Date().toDateString();
  function header(destination, label) {
    return `<header class="lesson-header"><a class="exit" href="${destination}">← ${label}</a><span class="lesson-name">SoraChi · 日文入門</span></header>`;
  }
  function wrap(content, destination = "#home", label = "回首頁") {
    return `<div class="lesson-shell">${header(destination, label)}<main id="main" tabindex="-1" class="study-main">${content}${warning()}</main>${footer()}</div>`;
  }
  function status(id) {
    const saved = state().courses[id];
    if (saved?.active && saved.active.phase !== "done") return "接著練";
    if (saved?.completedAt) return "已練習 · 重練";
    return "開始";
  }
  function row(course) {
    const learned = state().courses[course.id];
    return `<button class="course-row" data-action="study-open" data-course="${course.id}"><span><strong>${escape(course.type === "kana" ? course.row : course.title)}</strong><span class="reading-label"${course.type === "kana" ? ' lang="ja"' : ""}>${escape(course.type === "kana" ? course.letters.join("　") : course.subtitle || "一個句型 · 兩題練習")}</span></span><span class="course-state">${status(course.id)}${learned?.lastResult && learned.lastResult.firstCorrect === learned.lastResult.total ? " · 上次全對" : ""}</span></button>`;
  }
  function kanaPage() {
    const script = state().script;
    const learnedBefore = Object.values(state().courses).some((c) => wasEarlierDay(c.completedAt));
    return wrap(`<h1 class="focus-heading" tabindex="-1">五十音練習</h1><p class="study-note">每組 3–5 個字，包含認字、讀音與選擇題。羅馬字只作讀音提示，不是照英文拼字唸。</p><div class="script-tabs" role="group" aria-label="選擇假名種類"><button data-action="study-script" data-script="h" aria-pressed="${script === "h"}">平假名</button><button data-action="study-script" data-script="k" aria-pressed="${script === "k"}">片假名</button></div>${learnedBefore ? '<p class="study-note">可以重新測試之前練過的組別，確認是否還記得。</p>' : ""}<div class="course-list">${Object.values(courses).filter((c) => c.type === "kana" && c.script === script).map(row).join("")}</div><p class="study-note">先練平假名、片假名各 46 個基本字；濁音、半濁音、拗音、促音與長音之後再學。</p>`);
  }
  function grammarPage() {
    return wrap(`<h1 class="focus-heading" tabindex="-1">基礎句型</h1><p class="study-note">每課介紹一個句型，再用兩題練習確認理解。例句附中文意思與讀音。</p><div class="course-list">${GRAMMAR.map(row).join("")}</div>`);
  }
  function travelPage(id) {
    if (!id) return wrap(`<h1 class="focus-heading" tabindex="-1">旅遊常用語</h1><p class="study-note">常用關鍵字、讀音與中文。依情境查看，需要時再展開完整說法。</p><nav class="travel-categories" aria-label="旅遊情境">${PHRASEBOOK.map(item => `<a class="course-row" href="#travel/${item.id}"><span><strong>${escape(item.title)}</strong><span class="reading-label">${escape(item.subtitle)}</span></span><span aria-hidden="true">→</span></a>`).join("")}</nav>`);
    const item = travelItem(id);
    if (!item) return wrap('<h1 class="focus-heading" tabindex="-1">找不到這個情境</h1><a class="text-button" href="#travel">回旅遊常用語</a>');
    return wrap(`<h1 class="focus-heading" tabindex="-1">${escape(item.title)}</h1><p class="study-note">先看關鍵字與意思，需要時再展開例句。</p>${item.steps.map((step, index) => `<section class="study-card travel-card"><h2>${escape(step.title)}</h2>${keywordBox(step.keywords)}<p class="study-note">${escape(step.body)}</p><details class="phrase-more"><summary>看完整說法與讀音</summary><p lang="ja">${escape(step.polite || step.example)}</p><p class="reading-label">${escape(step.politeReading || step.reading)}</p><p>${escape(step.politeMeaning || step.meaning)}</p>${audioButton(item, index, true)}</details>${step.extra ? `<details class="phrase-more"><summary>${escape(step.extra.title)}</summary>${keywordBox(step.extra.keywords)}<p lang="ja">${escape(step.extra.example)}</p><p class="reading-label">${escape(step.extra.reading)}</p><p>${escape(step.extra.meaning)}</p><p class="study-note">${escape(step.extra.body)}</p></details>` : ""}</section>`).join("")}<div class="study-nav"><a class="text-button" href="#travel">← 換個情境</a><button class="text-button" data-action="feedback">這一頁有問題？</button></div>`, "#travel", "回旅遊常用語");
  }
  function audioButton(course, index, travel = false) {
    return `<button class="text-button" data-action="${travel ? "study-travel-audio" : "study-audio"}" data-course="${course.id}" data-index="${index}" aria-label="播放 ${escape(course.type === "kana" ? course.letters[index] : (travel ? course.steps[index].polite || course.steps[index].example : course.steps[index].example))} 的日文讀音">播放讀音</button><span class="reading-label">裝置合成語音</span><p class="study-audio-status study-note"${travel ? ` data-audio-for="${course.id}-${index}"` : ""} role="status" aria-live="polite"></p>`;
  }
  function keywordBox(keywords) {
    return `<section class="keyword-box" aria-label="關鍵字"><h3>關鍵字</h3><dl>${keywords.map(([word, reading, meaning]) => `<div><dt><strong lang="ja">${escape(word)}</strong><span>${escape(reading)}</span></dt><dd>${escape(meaning)}</dd></div>`).join("")}</dl></section>`;
  }
  function card(course, active) {
    const i = active.cursor;
    let body;
    if (course.type === "kana") {
      const letter = course.letters[i];
      const special = course.script === "k" && ["n", "o", "ha", "he"].includes(course.readings[i])
        ? `${letter} 讀作 ${course.readings[i]}，對應平假名「${course.spoken[i]}」。`
        : course.readings[i] === "n" ? "ん 是鼻音，羅馬字寫作 n。"
        : course.spoken[i] === "を" ? "を 通常用作助詞，讀作 o。"
        : course.spoken[i] === "は" ? "は 的基本讀音是 ha；作助詞時讀 wa。"
        : course.spoken[i] === "へ" ? "へ 的基本讀音是 he；作助詞時讀 e。"
        : "記住字形和讀音，再進行辨認練習。";
      body = `<div class="kana-character" lang="ja">${course.letters[i]}</div><div class="reading-label">讀音 <strong>${course.readings[i]}</strong></div>${audioButton(course, i)}<p class="study-note">${special}</p>`;
    } else {
      const step = course.steps[i];
      const keywords = step.keywords ? keywordBox(step.keywords) : "";
      const extra = step.extra;
      const supplement = extra ? `<details class="phrase-more"><summary>${escape(extra.title)}</summary>${keywordBox(extra.keywords)}<p lang="ja">${escape(extra.example)}</p><p class="reading-label">${escape(extra.reading)}</p><p>${escape(extra.meaning)}</p><p class="study-note">${escape(extra.body)}</p></details>` : "";
      body = `<h2>${escape(step.title)}</h2>${keywords}${step.keywords ? '<h3 class="phrase-label">可以這樣說</h3>' : ""}<p class="grammar-example" lang="ja">${escape(step.example)}</p>${step.reading ? `<p class="reading-label">${escape(step.reading)}</p>` : ""}<p>${escape(step.meaning)}</p>${step.keywords ? audioButton(course, i) : ""}<p class="study-note">${escape(step.body)}</p>${step.polite ? `<details class="phrase-more"><summary>較完整的說法</summary><p lang="ja">${escape(step.polite)}</p><p class="reading-label">${escape(step.politeReading)}</p><p>${escape(step.politeMeaning)}</p></details>` : ""}${supplement}`;
    }
    return `<p class="reading-label">${course.type === "kana" ? "認字與讀音" : course.group === "travel" ? "旅遊用語" : "句型說明"} · ${i + 1} / ${cards(course)}</p><section class="study-card">${body}</section><div class="study-nav"><button class="text-button" data-action="study-prev"${i === 0 ? " disabled" : ""}>← 上一張</button><button class="primary" data-action="study-next">${i === cards(course) - 1 ? "開始練習" : "下一張 →"}</button></div>`;
  }
  function quiz(course, active) {
    const q = active.order[active.cursor];
    const solved = active.solved[q] === true;
    const question = course.type === "grammar" ? course.questions[q] : null;
    const prompt = question ? question.prompt : active.direction === "reading" ? "這個讀音，對應哪個字？" : "這個字，讀音是哪一個？";
    const correct = question ? question.answer : q;
    const options = question ? question.options : active.direction === "reading" ? course.letters : course.readings;
    const explanation = question ? question.explanation : `「${course.letters[q]}」的讀音是 ${course.readings[q]}。`;
    const feedback = solved ? `答對了。${explanation}` : active.wrong !== null ? `正解是「${options[correct]}」。${explanation} 再選一次試試看。` : "";
    return `<p class="reading-label">練習 · ${active.cursor + 1} / ${size(course)} · 選一個答案</p><section class="study-card"><h2>${escape(prompt)}</h2>${question ? "" : `<div class="kana-character"${active.direction === "character" ? ' lang="ja"' : ""}>${escape(active.direction === "reading" ? course.readings[q] : course.letters[q])}</div>`}<div class="study-options" role="group" aria-label="答案選項">${active.options[q].map((choice) => `<button class="answer${solved && choice === correct ? " correct" : active.wrong === choice ? " wrong" : ""}" data-action="study-answer" data-choice="${choice}" aria-disabled="${solved}"${solved ? ' tabindex="-1"' : ""}${course.type === "kana" && active.direction === "reading" ? ' lang="ja"' : ""}>${escape(options[choice])}${solved && choice === correct ? '<span class="answer-status"> ✓ 答對了</span>' : ""}</button>`).join("")}</div><p class="study-feedback${!solved && active.wrong !== null ? " wrong" : ""}" role="status" aria-live="polite">${escape(feedback)}</p></section><div class="study-nav"><button class="text-button" data-action="study-review">回去看看</button><button class="primary" data-action="study-next"${solved ? "" : " disabled"}>${active.cursor === size(course) - 1 ? "完成這一輪" : "下一題 →"}</button></div><p class="study-note">答錯可以重試；第一次的答案會留下紀錄，重試不會改寫初答成績。</p>`;
  }
  function result(course, saved) {
    const score = saved.lastResult;
    return `<section class="study-card study-result"><h2>${score && score.firstCorrect === score.total ? "全部答對" : "練習完成"}</h2>${score ? `<p>第一次答對 <strong>${score.firstCorrect} / ${score.total}</strong> 題</p>` : ""}<p class="study-note">${course.type === "kana" ? "可重練本組，或返回選擇其他組。" : course.group === "travel" ? "可重練本組，或返回選擇其他情境。" : "可重練本課，或返回選擇其他句型。"}</p><p class="reading-label">${saved.completedAt ? `完成於 ${escape(new Date(saved.completedAt).toLocaleDateString("zh-TW"))}` : ""}</p><div class="study-nav"><a class="text-button" href="${backHash(course)}">回到${course.type === "kana" ? "五十音" : course.group === "travel" ? "旅遊用語" : "句型列表"}</a><button class="primary" data-action="study-restart">重新練習</button></div></section>`;
  }
  function coursePage(course) {
    const saved = courseState(course.id);
    if (!saved.active) {
      saved.active = freshAttempt(course, saved.attempts);
      save();
    }
    const active = saved.active;
    return wrap(`<h1 class="focus-heading" tabindex="-1">${escape(course.title)}</h1>${active.phase === "done" ? result(course, saved) : active.phase === "quiz" ? quiz(course, active) : card(course, active)}<div class="lesson-utilities"><button class="text-button" data-action="feedback">這一頁有問題？</button></div>`, backHash(course), course.type === "kana" ? "回五十音" : course.group === "travel" ? "回旅遊用語" : "回句型列表");
  }
  function render(hash) {
    if (hash === "#kana") return kanaPage();
    if (hash === "#grammar") return grammarPage();
    if (hash === "#travel") return travelPage();
    if (hash.startsWith("#travel/")) return travelPage(hash.slice(8));
    if (hash.startsWith("#study/")) {
      const course = courses[hash.slice(7)];
      return course ? coursePage(course) : wrap('<h1 class="focus-heading" tabindex="-1">找不到這堂課</h1><p class="study-note">請返回課程列表重新選擇。</p><a class="primary" href="#kana">看看五十音</a>');
    }
    return null;
  }
  function redraw(selector = ".focus-heading") {
    const app = document.querySelector("#app");
    app.innerHTML = render(location.hash);
    if (selector === ".focus-heading") window.scrollTo?.({ top: 0, behavior: "instant" });
    app.querySelector(selector)?.focus({ preventScroll: true });
  }
  function stopAudio() {
    audioGeneration++;
    if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
  }
  function speak(course, index, selector = ".study-audio-status", full = false) {
    stopAudio();
    const generation = audioGeneration;
    const status = (text) => {
      if (generation !== audioGeneration) return;
      const node = document.querySelector(selector);
      if (node) node.textContent = text;
    };
    const synth = window.speechSynthesis;
    const voice = synth?.getVoices().find((v) => /^ja(?:-|_|$)/i.test(v.lang));
    if (!synth || typeof SpeechSynthesisUtterance === "undefined" || !voice) {
      status("這個瀏覽器目前沒有日文語音，先看讀音練習也可以。");
      if (synth && !voicesListening) {
        voicesListening = true;
        synth.addEventListener("voiceschanged", () => {
          voicesListening = false;
          const node = document.querySelector(selector);
          if (node && synth.getVoices().some((v) => /^ja(?:-|_|$)/i.test(v.lang))) node.textContent = "日文語音已準備好，可以再按一次播放。";
        }, { once: true });
      }
      return;
    }
    const spoken = course.type === "kana" ? ({ "を": "お", "は": "ハ", "へ": "ヘ" }[course.spoken[index]] || course.spoken[index]) : full ? course.steps[index].polite || course.steps[index].example : course.steps[index].example;
    const utterance = new SpeechSynthesisUtterance(spoken);
    utterance.voice = voice;
    utterance.lang = "ja-JP";
    utterance.rate = 0.8;
    utterance.onstart = () => status("正在播放日文讀音…");
    utterance.onend = () => status("播放完了，也可以再聽一次。");
    utterance.onerror = () => status("這次沒有播放成功，可以再試一次，或先看讀音練習。");
    synth.speak(utterance);
  }
  function complete(course, saved) {
    const active = saved.active;
    if (!active || active.phase !== "quiz" || !active.order.every((q) => active.solved[q] === true)) return;
    const firstCorrect = active.order.filter((q) => active.first[q] === true).length;
    const date = new Date().toISOString();
    active.phase = "done";
    saved.completedAt = date;
    saved.attempts++;
    saved.lastResult = { firstCorrect, total: size(course) };
    api.record({ date, courseId: course.id, courseTitle: course.title, courseRevision: active.courseRevision, questionIds: active.order.map(q => course.questions[q].id), total: size(course), firstCorrect, retryQuestions: active.order.flatMap((q, position) => active.first[q] === false ? [position + 1] : []) });
    save();
  }
  function handle(button) {
    const action = button.dataset.action;
    if (!action?.startsWith("study-")) return false;
    if (button.disabled) return true;
    if (action === "study-travel-audio") {
      const item = location.hash.startsWith("#travel/") ? travelItem(location.hash.slice(8)) : null;
      const index = Number(button.dataset.index);
      if (item && item.id === button.dataset.course && Number.isInteger(index) && index >= 0 && index < item.steps.length) speak(item, index, `[data-audio-for="${item.id}-${index}"]`, true);
      return true;
    }
    if (action === "study-script") {
      state().script = button.dataset.script === "k" ? "k" : "h";
      save(); redraw(`[data-script="${state().script}"]`); return true;
    }
    if (action === "study-open") {
      const course = courses[button.dataset.course];
      if (!course) return true;
      const saved = courseState(course.id);
      if (!saved.active || saved.active.phase === "done") saved.active = freshAttempt(course, saved.attempts);
      save(); api.go(`#study/${course.id}`); return true;
    }
    const course = courses[currentId()];
    if (!course) return true;
    const saved = courseState(course.id);
    const active = saved.active;
    if (!active) return true;
    if (action === "study-audio") {
      const index = Number(button.dataset.index);
      if ((course.type === "kana" || course.group === "travel") && Number.isInteger(index) && index >= 0 && index < cards(course)) speak(course, index);
      return true;
    }
    stopAudio();
    if (action === "study-restart") saved.active = freshAttempt(course, saved.attempts);
    else if (action === "study-prev" && active.phase === "cards") active.cursor = Math.max(0, active.cursor - 1);
    else if (action === "study-review" && active.phase === "quiz") { active.phase = "cards"; active.cursor = 0; active.wrong = null; }
    else if (action === "study-answer" && active.phase === "quiz") {
      const q = active.order[active.cursor];
      const choice = Number(button.dataset.choice);
      if (active.solved[q] || !active.options[q].includes(choice)) return true;
      const correct = choice === (course.type === "kana" ? q : course.questions[q].answer);
      if (active.first[q] === undefined) active.first[q] = correct;
      if (correct) { active.solved[q] = true; active.wrong = null; }
      else active.wrong = choice;
      save();
      redraw(`[data-action="study-answer"][data-choice="${choice}"]`);
      return true;
    } else if (action === "study-next") {
      if (active.phase === "cards") {
        if (active.cursor < cards(course) - 1) active.cursor++;
        else {
          active.phase = "quiz";
          const next = active.order.findIndex((q) => !active.solved[q]);
          active.cursor = next === -1 ? size(course) - 1 : next;
        }
      } else if (active.phase === "quiz" && active.solved[active.order[active.cursor]]) {
        if (active.cursor === size(course) - 1) complete(course, saved);
        else { active.cursor++; active.wrong = null; }
      } else return true;
    } else return true;
    save(); redraw();
    return true;
  }
  function context(hash) {
    if (hash === "#kana") return "五十音學習路線";
    if (hash === "#grammar") return "基礎句型學習路線";
    if (hash === "#travel") return "旅遊常用語列表";
    if (hash.startsWith("#travel/")) return travelItem(hash.slice(8)) ? `旅遊常用語・${travelItem(hash.slice(8)).title}` : null;
    const course = courses[hash.slice(7)];
    if (!hash.startsWith("#study/") || !course) return null;
    const active = state().courses[course.id]?.active;
    return `${course.title}${active ? active.phase === "done" ? "・完成頁" : `・${active.phase === "cards" ? "認識" : "練習"}第 ${active.cursor + 1} 步` : ""}`;
  }
  return { sanitize, bind, render, handle, context, stopAudio, title, travelTitle, total };
})();
