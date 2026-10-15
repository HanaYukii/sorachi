"use strict";

// Beginner courses share one small, browser-local state. No account is required.
const Study = (() => {
  const ROWS = Content.rows, GRAMMAR = Content.grammar, TRAVEL = Content.travel;
  const PHRASEBOOK = Content.phrasebook, courses = Content.courses;
  const travelItem = (id) => PHRASEBOOK.find(item => item.id === id);
  let api;
  let audioGeneration = 0;
  let voiceListener = null;
  let audioTimer = null;
  let warmVoiceListener = null;
  const drafts = new Map();
  let draftState = null;
  const hintChoices = new Map();
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
  const completedKanaIds = () => Object.keys(state().courses).filter(id => courses[id]?.type === 'kana' && state().courses[id].completedAt);
  function syncKana(active, course) {
    const practice = active.practice;
    active.order = practice.questions.map(question => course.questions.findIndex(q => q.id === question.id));
    active.first = {}; active.solved = {};
    practice.questions.forEach((question,index) => {
      const q = active.order[index];
      if (practice.answers[index] !== null) { active.first[q] = question.options[practice.answers[index]] === question.id; active.solved[q] = true; }
    });
    active.direction = KanaPractice.current(practice)?.direction || 'character';
    if (active.phase === 'quiz') active.cursor = practice.cursor;
  }
  function freshAttempt(course, attempts) {
    const active = {
      courseRevision: Content.courseRevision(course.id), questionIds: course.questions.map(q => q.id),
      phase: "cards", cursor: 0, touched: false, order: shuffle(size(course)),
      options: course.type === "kana" ? [] : Array.from({ length: size(course) }, (_, q) => shuffle(course.questions[q].options.length)),
      direction: course.type === "kana" && attempts % 2 === 1 ? "reading" : "character",
      first: {}, solved: {}, wrong: null,
    };
    if (course.type === 'kana') {
      active.practiceVersion = KanaPractice.VERSION;
      active.practice = KanaPractice.create(course.questions.map(q => q.id), {completedIds:completedKanaIds()});
      syncKana(active, course);
    }
    return active;
  }
  function sanitize(saved) {
    const state = { script: saved?.script === "k" ? "k" : "h", courses: {}, kanaReview: KanaPractice.sanitizeReview(saved?.kanaReview), reviewSession: null, reviewClearedAt: iso(saved?.reviewClearedAt) };
    const review = KanaPractice.sanitize(saved?.reviewSession);
    if (review?.mode === 'review') state.reviewSession = review;
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
      if (course.type === 'kana') {
        const allowedCourseIds = Object.keys(saved?.courses || {}).filter(key => courses[key]?.type === 'kana' && iso(saved.courses[key]?.completedAt));
        allowedCourseIds.push(id);
        const practice = active?.practiceVersion === KanaPractice.VERSION ? KanaPractice.sanitize(active.practice, {allowedCourseIds}) : null;
        const sameQuestions = practice?.questions.length === n && practice.questions.every(q => course.questions.some(item => item.id === q.id));
        if (practice?.mode === 'course' && sameQuestions && active.courseRevision === Content.courseRevision(id) && ['cards','quiz','done'].includes(active.phase) && (active.phase === 'done') === (practice.round === 'done') && (active.phase !== 'done' || result.completedAt)) {
          result.active = {practiceVersion:KanaPractice.VERSION,practice,courseRevision:active.courseRevision,questionIds:course.questions.map(q=>q.id),phase:active.phase,cursor:Math.max(0,Math.min(Number.isInteger(active.cursor)?active.cursor:0,cards(course)-1)),touched:active.touched===true,options:[],wrong:null};
          syncKana(result.active, course);
          result.active.touched ||= result.active.cursor>0 || practice.answers.some(answer=>answer!==null) || active.phase!=='cards';
          if (!result.active.touched) result.active=null;
        }
        state.courses[id] = result;
        continue;
      }
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
        result.active.touched = active.touched === true || result.active.cursor > 0 || Object.keys(result.active.first).length > 0 || phase === "quiz" || phase === "done";
        // A restored quiz cannot skip a question that was never completed.
        if (phase === "quiz") {
          const firstOpen = result.active.order.findIndex((q) => !result.active.solved[q]);
          if (firstOpen !== -1) result.active.cursor = Math.min(result.active.cursor, firstOpen);
        }
        if (!result.active.touched) result.active = null;
      }
      state.courses[id] = result;
    }
    return state;
  }
  function bind(callbacks) {
    api = callbacks;
    warmVoices();
    KanaPractice.seedReview(state().kanaReview, api.history?.() || [], state().reviewClearedAt);
  }
  const state = () => api.getState();
  const courseState = (id) => state().courses[id] || blankCourse();
  function peekAttempt(id) {
    const current = state();
    if (draftState !== current) { drafts.clear(); draftState = current; }
    return drafts.get(id) || current.courses[id]?.active || null;
  }
  function currentAttempt(id) {
    const active = peekAttempt(id);
    return active ? JSON.parse(JSON.stringify(active)) : null;
  }
  const hasProgress = id => peekAttempt(id)?.touched === true;
  function draftAttempt(course, saved) {
    peekAttempt(course.id);
    const active = freshAttempt(course, saved.attempts);
    drafts.set(course.id, active);
    return active;
  }
  function touch(course, saved, active) {
    active.touched = true;
    saved.active = active;
    state().courses[course.id] = saved;
    drafts.delete(course.id);
  }
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
    if (hasProgress(id) && peekAttempt(id).phase !== "done") return "接著練";
    if (saved?.completedAt) return "已完成・可再練";
    return "開始";
  }
  function row(course) {
    const learned = state().courses[course.id];
    return `<button class="course-row" data-action="study-open" data-course="${course.id}"><span><strong>${escape(course.type === "kana" ? course.row : course.title)}</strong><span class="reading-label"${course.type === "kana" ? ' lang="ja"' : ""}>${escape(course.type === "kana" ? course.letters.join("　") : course.subtitle || `一個句型 · ${size(course)} 題練習`)}</span></span><span class="course-state">${status(course.id)}${learned?.lastResult && learned.lastResult.firstCorrect === learned.lastResult.total ? " · 上次全對" : ""}</span></button>`;
  }
  const voicedRows = new Set(["ga", "za", "da", "ba", "pa"]);
  const kanaRows = (script, voiced) => Object.values(courses).filter((c) => c.type === "kana" && c.script === script && voicedRows.has(c.id.slice(2)) === voiced);
  function reviewSummary() {
    const data = state();
    // Same order as KanaPractice.selectReview, so the listed characters are the ones the next round practices.
    const wrong = KanaPractice.entries.filter(item => data.kanaReview[item.id]?.wrong).sort((a,b)=>data.kanaReview[a.id].lastSeen.localeCompare(data.kanaReview[b.id].lastSeen)||a.id.localeCompare(b.id));
    const availableCount = KanaPractice.entries.filter(item => data.kanaReview[item.id] || data.courses[item.courseId]?.completedAt).length;
    return {wrongCount:wrong.length,availableCount,wrongLabels:wrong.slice(0,5).map(item=>`${item.character}（${item.reading}）`),canResume:Boolean(data.reviewSession && data.reviewSession.round!=='done'),hasData:Object.keys(data.kanaReview).length>0 || Boolean(data.reviewSession)};
  }
  function clearReview() {
    const data=state(); data.kanaReview={}; data.reviewSession=null; data.reviewClearedAt=new Date().toISOString();
    for (const id of Object.keys(courses)) if(courses[id].type==='kana') {if(data.courses[id])data.courses[id].active=null;drafts.delete(id);}
  }
  function currentPractice() {
    const review=location.hash==='#kana-review';
    const course=review?null:courses[currentId()];
    const active=course?peekAttempt(course.id):null;
    const session=review?state().reviewSession:active?.phase==='quiz'?active.practice:null;
    const q=KanaPractice.current(session);
    return q?{courseId:KanaPractice.entry(q.id).courseId,questionId:q.id,direction:q.direction,round:session.round,practiceVersion:KanaPractice.VERSION}:null;
  }
  const wrongLine = summary => `答錯的字：${summary.wrongLabels.map(escape).join('、')}${summary.wrongCount>summary.wrongLabels.length?`（共 ${summary.wrongCount} 個）`:''}`;
  function reviewEntry() {
    const summary=reviewSummary();
    return summary.availableCount ? `<section class="study-review-entry"><h2>${summary.canResume?'還有一輪沒練完':'複習學過的字'}</h2>${summary.wrongLabels.length?`<p class="study-note">${wrongLine(summary)}</p>`:''}<a class="text-button" href="#kana-review">${summary.canResume?'繼續複習':`複習 ${Math.min(5,summary.availableCount)} 個字`}</a></section>`:'';
  }
  function kanaPage() {
    const script = state().script;
    const learnedBefore = Object.values(state().courses).some((c) => wasEarlierDay(c.completedAt));
    return wrap(`<h1 class="focus-heading" tabindex="-1">五十音練習</h1><p class="study-note">每組 3–5 個字，包含認字、讀音與選擇題。羅馬字只作讀音提示，不是照英文拼字唸。</p><div class="script-tabs" role="group" aria-label="選擇假名種類"><button data-action="study-script" data-script="h" aria-pressed="${script === "h"}">平假名</button><button data-action="study-script" data-script="k" aria-pressed="${script === "k"}">片假名</button></div>${reviewEntry()}${learnedBefore ? '<p class="study-note">可以重新測試之前練過的組別，確認是否還記得。</p>' : ""}<div class="course-list">${kanaRows(script, false).map(row).join("")}</div><h2 class="course-list-heading">濁音・半濁音</h2><p class="study-note">在字的右上加兩點（濁點）或小圈（半濁點），讀音會改變，例如 か ka → が ga、は ha → ぱ pa。</p><div class="course-list">${kanaRows(script, true).map(row).join("")}</div><p class="study-note">每種假名先練 46 個基本字，再練 25 個濁音・半濁音。拗音（きゃ）、促音（小っ）與長音之後再學。</p>`);
  }
  function grammarPage() {
    return wrap(`<h1 class="focus-heading" tabindex="-1">基礎句型</h1><p class="study-note">每課介紹一個句型，再用選擇題確認理解。例句附中文意思、羅馬字與語音。羅馬字裡的 ou、ei 和 aa、ii、uu、ee、oo 通常是拉長的音，例如 gakusei 唸成「ga-ku-see」。</p><div class="course-list">${GRAMMAR.map(row).join("")}</div>`);
  }
  function travelPage(id) {
    if (!id) return wrap(`<h1 class="focus-heading" tabindex="-1">旅遊常用語</h1><p class="study-note">常用關鍵字、讀音與中文。依情境查看，需要時再展開完整說法。羅馬字裡的 aa、ii、uu、ee、oo 和 ou、ei 通常是拉長的音，例如 chaaji（チャージ）。</p><nav class="travel-categories" aria-label="旅遊情境">${PHRASEBOOK.map(item => `<a class="course-row" href="#travel/${item.id}"><span><strong>${escape(item.title)}</strong><span class="reading-label">${escape(item.subtitle)}</span></span><span aria-hidden="true">→</span></a>`).join("")}</nav>`);
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
  function hintCard(course, index) {
    const hints=typeof KanaHints!=='undefined'?KanaHints.get(course.letters[index]):[];
    if(!hints?.length)return '';
    const key=`${course.id}:${index}`, selected=(hintChoices.get(key)||0)%hints.length, hint=hints[selected];
    return `<aside class="kana-hint"><div aria-live="polite" aria-atomic="true"><p class="reading-label hint-label">記憶提示 · ${escape(hint.label)}</p><p class="hint-text">${escape(hint.text)}</p></div>${hints.length>1?'<button class="text-button" data-action="study-hint">換個記法</button>':''}${KanaHints.notice?`<details><summary>關於記憶提示</summary><p class="study-note">${escape(KanaHints.notice)}</p></details>`:''}</aside>`;
  }
  const sameSoundNote = { "ぢ": "ぢ 和 じ 同音，都讀 ji；一般多寫 じ。", "づ": "づ 和 ず 同音，都讀 zu；一般多寫 ず。", "ヂ": "ヂ 和 ジ 同音，都讀 ji；一般多寫 ジ。", "ヅ": "ヅ 和 ズ 同音，都讀 zu；一般多寫 ズ。" };
  function card(course, active) {
    const i = active.cursor;
    let body;
    if (course.type === "kana") {
      const letter = course.letters[i];
      const special = course.script === "k" && ["ン", "ヲ", "ハ", "ヘ"].includes(letter)
        ? `${letter} 讀作 ${course.readings[i]}，對應平假名「${course.spoken[i]}」。`
        : course.readings[i] === "n" ? "ん 是鼻音，羅馬字寫作 n。"
        : course.spoken[i] === "を" ? "を 現代只當助詞用，讀作 o。"
        : course.spoken[i] === "は" ? "は 的基本讀音是 ha；作助詞時讀 wa。"
        : course.spoken[i] === "へ" ? "へ 的基本讀音是 he；作助詞時讀 e。"
        : sameSoundNote[letter] || "";
      body = `<div class="kana-character" lang="ja">${course.letters[i]}</div><div class="reading-label">讀音 <strong>${course.readings[i]}</strong></div>${audioButton(course, i)}${special?`<p class="study-note">${special}</p>`:""}${hintCard(course,i)}`;
    } else {
      const step = course.steps[i];
      const keywords = step.keywords ? keywordBox(step.keywords) : "";
      const extra = step.extra;
      const supplement = extra ? `<details class="phrase-more"><summary>${escape(extra.title)}</summary>${keywordBox(extra.keywords)}<p lang="ja">${escape(extra.example)}</p><p class="reading-label">${escape(extra.reading)}</p><p>${escape(extra.meaning)}</p><p class="study-note">${escape(extra.body)}</p></details>` : "";
      body = `<h2>${escape(step.title)}</h2>${keywords}${step.keywords ? '<h3 class="phrase-label">可以這樣說</h3>' : ""}<p class="grammar-example" lang="ja">${escape(step.example)}</p>${step.reading ? `<p class="reading-label">${escape(step.reading)}</p>` : ""}<p>${escape(step.meaning)}</p>${audioButton(course, i)}<p class="study-note">${escape(step.body)}</p>${step.polite ? `<details class="phrase-more"><summary>較完整的說法</summary><p lang="ja">${escape(step.polite)}</p><p class="reading-label">${escape(step.politeReading)}</p><p>${escape(step.politeMeaning)}</p></details>` : ""}${supplement}`;
    }
    return `<p class="reading-label">${course.type === "kana" ? "認字與讀音" : course.group === "travel" ? "旅遊用語" : "句型說明"} · ${i + 1} / ${cards(course)}</p><section class="study-card">${body}</section><div class="study-nav"><button class="text-button" data-action="study-prev"${i === 0 ? " disabled" : ""}>← 上一張</button><button class="primary" data-action="study-next">${i === cards(course) - 1 ? "開始練習" : "下一張 →"}</button></div>`;
  }
  function practiceFeedback(session) {
    if(!KanaPractice.answered(session))return '';
    const q=KanaPractice.current(session), answers=session.round==='retry'?session.retryAnswers:session.answers;
    const correct=q.options[answers[session.cursor]]===q.id, item=KanaPractice.entry(q.id);
    if(session.round==='retry')return correct?'答對了，這個字已從答錯的字移出。':'這個字還要再練，完成後可以再複習。';
    return `${correct?'答對了':'正確答案'}：${item.character}＝${item.reading}`;
  }
  function practiceQuiz(session, review=false) {
    const q=KanaPractice.current(session), item=KanaPractice.entry(q.id), answered=KanaPractice.answered(session);
    const answers=session.round==='retry'?session.retryAnswers:session.answers, chosen=answers[session.cursor], correct=answered && q.options[chosen]===q.id;
    const count=session.round==='retry'?session.retryQuestions.length:session.questions.length;
    return `<p class="reading-label">${session.round==='retry'?'再試一次':'練習'} · ${session.cursor+1} / ${count} · 選一個答案</p><section class="study-card study-quiz"><h2>${q.direction==='reading'?'這個讀音，對應哪個字？':'這個字，讀音是哪一個？'}</h2><div class="kana-character"${q.direction==='character'?' lang="ja"':''}>${escape(q.direction==='reading'?item.reading:item.character)}</div><div class="study-options kana-options" role="group" aria-label="答案選項">${q.options.map((id,index)=>{const option=KanaPractice.entry(id);return `<button class="answer${answered&&chosen===index?(correct?' correct':' wrong'):''}" data-action="study-answer" data-choice="${index}" aria-disabled="${answered}"${answered?' tabindex="-1"':''}${q.direction==='reading'?' lang="ja"':''}>${escape(q.direction==='reading'?option.character:option.reading)}<span class="answer-status">${answered&&chosen===index?(correct?' ✓ 答對了':session.round==='retry'?' ✕ 下次再練':' ✕ 稍後再考'):''}</span></button>`;}).join('')}</div><p class="study-feedback${answered&&!correct?' wrong':''}" role="status" aria-live="polite">${escape(practiceFeedback(session))}</p></section><div class="study-nav">${!review&&session.round==='first'?'<button class="text-button" data-action="study-review">回去看看</button>':''}<button class="primary" data-action="study-next"${answered?'':' disabled'}>${session.cursor+1===count?(session.round==='retry'?'完成練習':'繼續 →'):'下一題 →'}</button></div><p class="study-note">${session.round==='retry'?'憑記憶再答一次；這次不會改變第一次作答的成績。':'答錯可直接往下，這一輪最後會再考一次。'}</p>`;
  }
  function updatePractice(session) {
    const q=KanaPractice.current(session), answers=session.round==='retry'?session.retryAnswers:session.answers, choice=answers[session.cursor], correct=q.options[choice]===q.id;
    for(const node of document.querySelectorAll('[data-action="study-answer"]')){
      const selected=Number(node.dataset.choice)===choice;
      node.classList.toggle('correct',selected&&correct);node.classList.toggle('wrong',selected&&!correct);node.setAttribute('aria-disabled','true');node.setAttribute('tabindex','-1');
      const mark=node.querySelector('.answer-status');if(mark)mark.textContent=selected?(correct?' ✓ 答對了':session.round==='retry'?' ✕ 下次再練':' ✕ 稍後再考'):'';
    }
    const feedback=document.querySelector('.study-feedback');
    if(feedback){feedback.textContent=practiceFeedback(session);feedback.classList.toggle('wrong',!correct);const bounds=feedback.getBoundingClientRect?.();if(!bounds||bounds.top<0||bounds.bottom>window.innerHeight)feedback.scrollIntoView?.({block:'nearest',behavior:'smooth'});}
    const next=document.querySelector('[data-action="study-next"]');if(next){next.disabled=false;next.focus({preventScroll:true});}
  }
  function rememberAnswer(outcome) { state().kanaReview[outcome.id]={lastSeen:new Date().toISOString(),wrong:!outcome.correct}; }
  function reviewPage() {
    const session=state().reviewSession, summary=reviewSummary();
    let body;
    if(session?.round==='done'){
      const remaining=session.questions.filter(q=>state().kanaReview[q.id]?.wrong).map(q=>KanaPractice.entry(q.id));
      body=`<h2>複習完成</h2><p>這次練了 ${session.questions.length} 個字。</p>${remaining.length?`<p>還可以再練：${remaining.map(item=>escape(`${item.character}（${item.reading}）`)).join('、')}</p>`:'<p>這次的字都答對了。</p>'}<button class="primary" data-action="study-review-start">再複習 ${Math.min(5,summary.availableCount)} 個字</button>`;
    }else if(session)body=practiceQuiz(session,true);
    else body=`<p>先練答錯的字，較早答錯的先練；再複習較久沒練的字，最多 5 個。</p>${summary.wrongLabels.length?`<p>${wrongLine(summary)}</p>`:''}${summary.availableCount?'<button class="primary" data-action="study-review-start">開始複習</button>':'<p>先完成一組五十音練習，就可以在這裡複習。</p>'}`;
    return wrap(`<h1 class="focus-heading" tabindex="-1">五十音複習</h1>${body}<div class="lesson-utilities"><button class="text-button" data-action="feedback">這一頁有問題？</button></div>`,'#kana','回五十音');
  }
  function answerFeedback(course, active) {
    const q = active.order[active.cursor], solved = active.solved[q] === true;
    if (!solved && active.wrong === null) return "";
    if (course.type === "kana") return `${solved ? "答對了" : "正確答案"}：${course.letters[q]}＝${course.readings[q]}`;
    const question = course.questions[q];
    return solved ? `答對了。${question.explanation}` : `正確答案：${question.options[question.answer]}。${question.explanation}`;
  }
  function quiz(course, active) {
    if(course.type==='kana')return practiceQuiz(active.practice);
    const q = active.order[active.cursor];
    const solved = active.solved[q] === true;
    const question = course.type === "grammar" ? course.questions[q] : null;
    const prompt = question ? question.prompt : active.direction === "reading" ? "這個讀音，對應哪個字？" : "這個字，讀音是哪一個？";
    const correct = question ? question.answer : q;
    const options = question ? question.options : active.direction === "reading" ? course.letters : course.readings;
    const feedback = answerFeedback(course, active);
    return `<p class="reading-label">練習 · ${active.cursor + 1} / ${size(course)} · 選一個答案</p><section class="study-card study-quiz"><h2>${escape(prompt)}</h2>${question ? "" : `<div class="kana-character"${active.direction === "character" ? ' lang="ja"' : ""}>${escape(active.direction === "reading" ? course.readings[q] : course.letters[q])}</div>`}<div class="study-options${course.type === "kana" ? " kana-options" : ""}" role="group" aria-label="答案選項">${active.options[q].map((choice) => `<button class="answer${solved && choice === correct ? " correct" : active.wrong === choice ? " wrong" : ""}" data-action="study-answer" data-choice="${choice}" aria-disabled="${solved}"${solved ? ' tabindex="-1"' : ""}${course.type === "kana" && active.direction === "reading" ? ' lang="ja"' : ""}>${question?.readings ? `<span lang="ja">${escape(options[choice])}</span><span class="option-reading">${escape(question.readings[choice])}</span>` : escape(options[choice])}<span class="answer-status">${solved && choice === correct ? ' ✓ 答對了' : active.wrong === choice ? ' ✕ 再試一次' : ''}</span></button>`).join("")}</div><p class="study-feedback${!solved && active.wrong !== null ? " wrong" : ""}" role="status" aria-live="polite">${escape(feedback)}</p></section><div class="study-nav"><button class="text-button" data-action="study-review">回去看看</button><button class="primary" data-action="study-next"${solved ? "" : " disabled"}>${active.cursor === size(course) - 1 ? "完成這一輪" : "下一題 →"}</button></div><p class="study-note">答錯可以重試；第一次的答案會留下紀錄，重試不會改寫第一次作答的成績。</p>`;
  }
  function nextCourse(id) {
    const course = courses[id];
    if (course?.type !== "kana") return null;
    const siblings = Object.values(courses).filter(item => item.type === "kana" && item.script === course.script);
    return siblings[siblings.findIndex(item => item.id === id) + 1]?.id || null;
  }
  function retryLabels(entry) {
    const course = courses[entry?.courseId];
    return (Array.isArray(entry?.retryQuestions) ? entry.retryQuestions : []).filter(n => Number.isInteger(n) && n > 0).map(number => {
      const id = entry.questionIds?.[number - 1];
      if (course && entry.courseRevision === Content.courseRevision(course.id)) {
        const question = course.questions.find(item => item.id === id);
        if (question?.character && question?.reading) return `${question.character}（${question.reading}）`;
      }
      // A stable kana ID records the old character, never the current reading.
      const match = typeof id === "string" && id.startsWith(`${entry.courseId}/question/`) && id.match(/^[hk]-[a-z]+\/question\/u([0-9a-f]{4})$/);
      if (match) {
        const point = parseInt(match[1], 16);
        if ((id.startsWith('h-') && point >= 0x3041 && point <= 0x3096) || (id.startsWith('k-') && point >= 0x30a1 && point <= 0x30fa)) return String.fromCodePoint(point);
      }
      return `第 ${number} 題`;
    });
  }
  function result(course, saved) {
    const score = saved.lastResult, active = peekAttempt(course.id);
    const retries = retryLabels({ courseId: course.id, courseRevision: active.courseRevision, questionIds: active.order.map(q => active.questionIds[q]), retryQuestions: active.order.flatMap((q, index) => active.first[q] === false ? [index + 1] : []) });
    const next = nextCourse(course.id);
    return `<section class="study-card study-result"><h2>${score && score.firstCorrect === score.total ? "全部答對" : "練習完成"}</h2>${score ? `<p>第一次答對 <strong>${score.firstCorrect} / ${score.total}</strong> 題</p>` : ""}${retries.length ? `<p class="study-note">第一次答錯：${retries.map(escape).join("、")}</p>` : ""}<p class="study-note">${course.type === "kana" ? "可重練本組，或返回選擇其他組。" : course.group === "travel" ? "可重練本組，或返回選擇其他情境。" : "可重練本課，或返回選擇其他句型。"}</p><p class="reading-label">${saved.completedAt ? `完成於 ${escape(new Date(saved.completedAt).toLocaleDateString("zh-TW"))}` : ""}</p><div class="study-nav">${next ? `<button class="primary" data-action="study-open" data-course="${next}">下一組：${escape(courses[next].row)}</button>` : ""}<button class="${next ? "text-button" : "primary"}" data-action="study-restart">重新練習</button><a class="text-button" href="${backHash(course)}">回到${course.type === "kana" ? "五十音" : course.group === "travel" ? "旅遊用語" : "句型列表"}</a></div></section>`;
  }
  function updateAnswer(course, active) {
    const q = active.order[active.cursor], solved = active.solved[q] === true;
    const correct = course.type === "kana" ? q : course.questions[q].answer;
    for (const node of document.querySelectorAll('[data-action="study-answer"]')) {
      const choice = Number(node.dataset.choice), right = solved && choice === correct, wrong = !solved && choice === active.wrong;
      node.classList.toggle("correct", right); node.classList.toggle("wrong", wrong);
      node.setAttribute("aria-disabled", String(solved)); node.setAttribute("tabindex", solved ? "-1" : "0");
      const mark = node.querySelector('.answer-status');
      if (mark) mark.textContent = right ? " ✓ 答對了" : wrong ? " ✕ 再試一次" : "";
    }
    const feedback = document.querySelector('.study-feedback');
    if (feedback) {
      feedback.textContent = answerFeedback(course, active);
      feedback.classList.toggle('wrong', !solved);
      const bounds = feedback.getBoundingClientRect?.();
      if (!bounds || bounds.top < 0 || bounds.bottom > window.innerHeight) feedback.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
    }
    const next = document.querySelector('[data-action="study-next"]');
    if (next) { next.disabled = !solved; if (solved) next.focus({ preventScroll: true }); }
  }
  function coursePage(course) {
    const saved = courseState(course.id);
    const active = peekAttempt(course.id) || draftAttempt(course, saved);
    return wrap(`<h1 class="focus-heading" tabindex="-1">${escape(course.title)}</h1>${active.phase === "done" ? result(course, saved) : active.phase === "quiz" ? quiz(course, active) : card(course, active)}<div class="lesson-utilities"><button class="text-button" data-action="feedback">這一頁有問題？</button></div>`, backHash(course), course.type === "kana" ? "回五十音" : course.group === "travel" ? "回旅遊用語" : "回句型列表");
  }
  function render(hash) {
    if (hash === "#kana") return kanaPage();
    if (hash === "#kana-review") return reviewPage();
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
  function warmVoices() {
    if (warmVoiceListener) {
      try { warmVoiceListener.synth.removeEventListener?.('voiceschanged', warmVoiceListener.callback); } catch { /* Optional engine capability. */ }
      warmVoiceListener = null;
    }
    try {
      const synth = typeof window !== "undefined" && window.speechSynthesis;
      if (!synth) return;
      const callback = () => { try { synth.getVoices(); } catch { /* Playback has its own visible fallback. */ } };
      // Subscribe before priming: some engines populate the list asynchronously.
      if (synth.addEventListener) {
        synth.addEventListener('voiceschanged', callback);
        warmVoiceListener = { synth, callback };
      }
      callback();
    } catch { /* Voice discovery must never interrupt course setup. */ }
  }
  function pickVoice(voices) {
    const japanese = voices.filter(v => /^ja(?:-|_|$)/i.test(v.lang || ''));
    const preferred = [/kyoko/i, /otoya/i, /o-ren/i, /hattori/i, /google.*日本語/i, /microsoft.*(?:nanami|ayumi|haruka|ichiro)/i];
    const rank = v => {
      const jp = /^ja[-_]jp$/i.test(v.lang), local = v.localService === true;
      const name = `${v.name || ''} ${v.voiceURI || ''}`;
      const fallback = /eloquence|\b(?:eddy|flo|grandma|grandpa|reed|rocko|sandy|shelley)\b/i.test(name);
      const preferredIndex = preferred.findIndex(pattern => pattern.test(name));
      return (fallback ? 10000 : 0) + (local ? (jp ? 0 : 100) : (jp ? 200 : 300)) + (preferredIndex === -1 ? 20 : preferredIndex);
    };
    return japanese.sort((a,b) => rank(a) - rank(b))[0] || null;
  }
  function clearAudioRequest() {
    audioGeneration++;
    if (audioTimer !== null) { clearTimeout(audioTimer); audioTimer = null; }
    if (voiceListener) {
      try { voiceListener.synth.removeEventListener?.('voiceschanged', voiceListener.callback); } catch { /* Generation guards stale callbacks. */ }
      voiceListener = null;
    }
  }
  function stopAudio() {
    clearAudioRequest();
    try {
      const synth = typeof window !== "undefined" && window.speechSynthesis;
      if (synth && (synth.speaking || synth.pending)) synth.cancel();
    } catch { /* Navigation must remain usable when the speech engine fails. */ }
  }
  function speak(course, index, selector = ".study-audio-status", full = false) {
    const waiting = audioTimer !== null;
    clearAudioRequest();
    const generation = audioGeneration;
    const status = text => {
      if (generation !== audioGeneration) return;
      const node = document.querySelector(selector);
      if (node) node.textContent = text;
    };
    const failed = () => status("這次沒有播放成功，可以再試一次，或先看讀音練習。");
    try {
      const synth = window.speechSynthesis;
      const voice = synth ? pickVoice(synth.getVoices()) : null;
      if (!synth || typeof SpeechSynthesisUtterance === "undefined" || !voice) {
        status("這個瀏覽器目前沒有日文語音，先看讀音練習也可以。");
        if (synth?.addEventListener) {
          const callback = () => {
            if (generation !== audioGeneration) return;
            voiceListener = null;
            try { if (pickVoice(synth.getVoices())) status("日文語音已準備好，可以再按一次播放。"); } catch { failed(); }
          };
          voiceListener = { synth, callback }; synth.addEventListener('voiceschanged', callback, { once: true });
        }
        return;
      }
      const spoken = course.type === "kana" ? ({ "を": "お", "は": "ハ", "へ": "ヘ" }[course.spoken[index]] || course.spoken[index]) : (full ? course.steps[index].polite || course.steps[index].example : course.steps[index].example).replace(/\s*／\s*/g, "、");
      const utterance = new SpeechSynthesisUtterance(spoken);
      utterance.voice = voice; utterance.lang = "ja-JP"; utterance.rate = 0.8;
      utterance.onstart = () => status("正在播放日文讀音…");
      utterance.onend = () => status("播放完了，也可以再聽一次。");
      utterance.onerror = failed;
      const play = () => {
        if (generation !== audioGeneration) return;
        audioTimer = null;
        try { synth.speak(utterance); } catch { failed(); }
      };
      if (waiting || synth.speaking || synth.pending) {
        if (synth.speaking || synth.pending) synth.cancel();
        status("準備播放日文讀音…"); audioTimer = setTimeout(play, 130);
      } else play();
    } catch { failed(); }
  }
  function complete(course, saved) {
    const active = saved.active;
    if (!active || active.phase !== "quiz" || (course.type==='kana'?active.practice.round!=='done':!active.order.every((q) => active.solved[q] === true))) return;
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
    if (action === 'study-review-start') {
      if(state().reviewSession&&state().reviewSession.round!=='done'){api.go('#kana-review');return true;}
      const ids=KanaPractice.selectReview(state().kanaReview,state().courses);
      if(ids.length){state().reviewSession=KanaPractice.create(ids,{completedIds:completedKanaIds(),mode:'review'});save();api.go('#kana-review');}
      return true;
    }
    if(location.hash==='#kana-review'){
      const session=state().reviewSession;
      if(!session||session.round==='done')return true;
      if(action==='study-answer'){
        const outcome=KanaPractice.answer(session,Number(button.dataset.choice));
        if(outcome){rememberAnswer(outcome);save();updatePractice(session);}
      }else if(action==='study-next'&&KanaPractice.next(session)){save();redraw();}
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
      const active = peekAttempt(course.id);
      if (!active || active.phase === "done") draftAttempt(course, saved);
      api.go(`#study/${course.id}`); return true;
    }
    const course = courses[currentId()];
    if (!course) return true;
    const saved = courseState(course.id);
    const active = peekAttempt(course.id);
    if (!active) return true;
    if (action === "study-audio") {
      const index = Number(button.dataset.index);
      if (active.phase === "cards" && (course.type === "kana" || course.type === "grammar") && Number.isInteger(index) && index >= 0 && index < cards(course)) speak(course, index);
      return true;
    }
    if(action==='study-hint'&&course.type==='kana'&&active.phase==='cards'){
      const key=`${course.id}:${active.cursor}`;hintChoices.set(key,(hintChoices.get(key)||0)+1);
      // Update in place so the live region announces the new hint and focus stays on the button.
      const hints=KanaHints.get(course.letters[active.cursor]),hint=hints[hintChoices.get(key)%hints.length];
      const label=document.querySelector('.hint-label'),text=document.querySelector('.hint-text');
      if(hint&&label&&text){label.textContent=`記憶提示 · ${hint.label}`;text.textContent=hint.text;}else redraw('[data-action="study-hint"]');
      return true;
    }
    if(course.type==='kana'&&active.phase==='quiz'){
      if(action==='study-answer'){
        const outcome=KanaPractice.answer(active.practice,Number(button.dataset.choice));
        if(outcome){rememberAnswer(outcome);syncKana(active,course);touch(course,saved,active);save();updatePractice(active.practice);}
        return true;
      }
      if(action==='study-next'){
        if(KanaPractice.next(active.practice)){syncKana(active,course);if(active.practice.round==='done')complete(course,saved);save();redraw();}
        return true;
      }
      if(action==='study-review'&&active.practice.round!=='first')return true;
    }
    stopAudio();
    if (action === "study-restart") { draftAttempt(course, saved); redraw(); return true; }
    else if (action === "study-prev" && active.phase === "cards") {
      if (active.cursor === 0) return true;
      active.cursor--;
    }
    else if (action === "study-review" && active.phase === "quiz") { active.phase = "cards"; active.cursor = 0; active.wrong = null; }
    else if (action === "study-answer" && active.phase === "quiz") {
      const q = active.order[active.cursor];
      const choice = Number(button.dataset.choice);
      if (active.solved[q] || !active.options[q].includes(choice)) return true;
      const correct = choice === (course.type === "kana" ? q : course.questions[q].answer);
      if (active.first[q] === undefined) active.first[q] = correct;
      if (correct) { active.solved[q] = true; active.wrong = null; }
      else active.wrong = choice;
      touch(course, saved, active);
      save();
      updateAnswer(course, active);
      return true;
    } else if (action === "study-next") {
      if (active.phase === "cards") {
        if (active.cursor < cards(course) - 1) active.cursor++;
        else {
          active.phase = "quiz";
          if(course.type==='kana')syncKana(active,course);
          else {
            const next = active.order.findIndex((q) => !active.solved[q]);
            active.cursor = next === -1 ? size(course) - 1 : next;
          }
        }
      } else if (active.phase === "quiz" && active.solved[active.order[active.cursor]]) {
        if (active.cursor === size(course) - 1) complete(course, saved);
        else { active.cursor++; active.wrong = null; }
      } else return true;
    } else return true;
    touch(course, saved, active);
    save(); redraw();
    return true;
  }
  function context(hash) {
    if (hash === "#kana") return "五十音學習路線";
    if (hash === "#kana-review") return state().reviewSession?.round==='done'?'五十音複習・完成頁':`五十音複習${state().reviewSession?`・${state().reviewSession.round==='retry'?'再試一次':'練習'}第 ${state().reviewSession.cursor+1} 步`:''}`;
    if (hash === "#grammar") return "基礎句型學習路線";
    if (hash === "#travel") return "旅遊常用語列表";
    if (hash.startsWith("#travel/")) return travelItem(hash.slice(8)) ? `旅遊常用語・${travelItem(hash.slice(8)).title}` : null;
    const course = courses[hash.slice(7)];
    if (!hash.startsWith("#study/") || !course) return null;
    const active = peekAttempt(course.id);
    if(course.type==='kana'&&active?.phase==='quiz'&&active.practice.round==='retry')return `${course.title}・再試一次第 ${active.practice.cursor+1} 步`;
    return `${course.title}${active ? active.phase === "done" ? "・完成頁" : `・${active.phase === "cards" ? "認識" : "練習"}第 ${active.cursor + 1} 步` : ""}`;
  }
  return { sanitize, bind, render, handle, context, stopAudio, title, travelTitle, total, retryLabels, nextCourse, hasProgress, currentAttempt, reviewSummary, clearReview, currentPractice };
})();
