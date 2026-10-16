"use strict";

// Beginner courses share one small, browser-local state. No account is required.
const Study = (() => {
  const GRAMMAR = Content.grammar;
  const PHRASEBOOK = Content.phrasebook, courses = Content.courses;
  const travelItem = (id) => PHRASEBOOK.find(item => item.id === id);
  let api;
  let audioGeneration = 0;
  let voiceListener = null;
  let audioTimer = null;
  let playingButton = null;
  let warmVoiceListener = null;
  const drafts = new Map();
  let draftState = null;
  const preferences = () => api.preferences?.() || {};
  const favoriteIds = () => api.favorites?.() || [];
  const speechRate = () => [0.65, 0.8, 1].includes(preferences().ttsRate) ? preferences().ttsRate : 0.8;
  const escape = (text) => String(text).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  const size = (course) => course.type === "kana" ? course.letters.length : course.questions.length;
  const cards = (course) => course.type === "kana" ? course.letters.length : course.steps.length;
  const title = (id) => courses[id]?.title || null;
  const travelTitle = (id) => id === "favorites" ? "我的常用語" : travelItem(id)?.title || null;
  const total = (id) => courses[id] ? size(courses[id]) : 0;
  // Four-digit years only: an extreme saved date (+275760-…) would make later +1ms arithmetic throw.
  const iso = (value) => { const text = typeof value === "string" && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : null; return text && /^\d{4}-/.test(text) ? text : null; };
  const LAST_DATE = Date.parse("9999-12-31T23:59:59.999Z");
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
    const state = { script: saved?.script === "k" ? "k" : "h", courses: {}, kanaReview: KanaPractice.sanitizeReview(saved?.kanaReview), reviewSession: null, reviewClearedAt: iso(saved?.reviewClearedAt), grammarReview: {}, grammarReviewSession: null, lastGrammarId: null };
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
    for (const course of GRAMMAR) for (const question of course.questions) {
      const item = saved?.grammarReview?.[question.id];
      if (item?.courseRevision === Content.courseRevision(course.id) && iso(item.lastSeen) && typeof item.wrong === "boolean" && (!state.reviewClearedAt || iso(item.lastSeen) > state.reviewClearedAt)) {
        state.grammarReview[question.id] = { courseRevision: item.courseRevision, lastSeen: iso(item.lastSeen), wrong: item.wrong };
      }
    }
    state.grammarReviewSession = sanitizeGrammarRound(saved?.grammarReviewSession, state.courses);
    if (GRAMMAR.some(c => c.id === saved?.lastGrammarId)) state.lastGrammarId = saved.lastGrammarId;
    return state;
  }
  // Saved choices are meaningful only for the exact question IDs and course revisions.
  function sanitizeGrammarRound(raw, learned) {
    if (!raw || raw.version !== 1 || !Array.isArray(raw.items) || raw.items.length < 1 || raw.items.length > 5 || typeof raw.done !== "boolean") return null;
    const items = [];
    for (const item of raw.items) {
      const course = GRAMMAR.find(c => c.id === item?.courseId), question = course?.questions[item.q];
      if (!course || !Number.isInteger(item.q) || !learned[course.id]?.completedAt || !question || question.id !== item.questionId || item.courseRevision !== Content.courseRevision(course.id) || !permutation(item.options, question.options.length) || items.some(i => i.questionId === question.id)) return null;
      items.push({courseId:course.id, q:item.q, questionId:question.id, courseRevision:item.courseRevision, options:[...item.options]});
    }
    if (!Number.isInteger(raw.cursor) || raw.cursor < 0 || raw.cursor >= items.length) return null;
    const first = {}, solved = {};
    for (let i=0; i<items.length; i++) {
      if (typeof raw.first?.[i] === "boolean") first[i] = raw.first[i];
      if (raw.solved?.[i] === true && typeof first[i] === "boolean") solved[i] = true;
      if (first[i] === true && !solved[i] || i < raw.cursor && !solved[i] || i > raw.cursor && first[i] !== undefined) return null;
    }
    if (raw.done && (raw.cursor !== items.length-1 || items.some((_,i) => !solved[i]))) return null;
    let wrong = null;
    const current = items[raw.cursor], question = courses[current.courseId].questions[current.q];
    if (!solved[raw.cursor] && first[raw.cursor] === false && Number.isInteger(raw.wrong) && current.options.includes(raw.wrong) && raw.wrong !== question.answer) wrong = raw.wrong;
    return {version:1,items,cursor:raw.cursor,first,solved,wrong,done:raw.done};
  }
  function bind(callbacks) {
    api = callbacks;
    warmVoices();
    KanaPractice.seedReview(state().kanaReview, api.history?.() || [], state().reviewClearedAt);
    for (const entry of api.history?.() || []) {
      const course = GRAMMAR.find(c => c.id === entry.courseId);
      if (!course || entry.courseRevision && entry.courseRevision !== Content.courseRevision(course.id) || !iso(entry.date) || state().reviewClearedAt && iso(entry.date) <= state().reviewClearedAt) continue;
      for (const [i,id] of (entry.questionIds || []).entries()) if (course.questions.some(q => q.id === id) && (!state().grammarReview[id] || iso(entry.date) > state().grammarReview[id].lastSeen)) {
        state().grammarReview[id] = {courseRevision:Content.courseRevision(course.id),lastSeen:iso(entry.date),wrong:(entry.retryQuestions || []).includes(i+1)};
      }
    }
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
    if (GRAMMAR.some(c => c.id === course.id)) state().lastGrammarId = course.id;
    saved.active = active;
    state().courses[course.id] = saved;
    drafts.delete(course.id);
  }
  const save = () => api.save();
  const currentId = () => location.hash.startsWith("#study/") ? location.hash.slice(7) : null;
  // Special-sound lessons are grammar-style courses that belong with the kana.
  const kanaArea = (course) => course.type === "kana" || course.home === "kana";
  const backHash = (course) => kanaArea(course) ? "#kana" : "#grammar";
  const footer = () => api.footer ? api.footer() : "";
  const warning = () => api.warning ? api.warning() : "";
  const wasEarlierDay = (date) => date && new Date(date).toDateString() !== new Date().toDateString();
  function header(destination, label) {
    return `<header class="lesson-header"><a class="exit" href="${destination}">← ${label}</a>${globalThis.location?.hash?.startsWith("#travel") ? '<span class="lesson-name">SoraChi · 日文入門</span>' : '<a class="header-link" href="#travel">旅遊常用語</a>'}</header>`;
  }
  // 回 leads back to where a lesson or review was opened (#82): home, or else its own list, also for a direct link.
  const exitTo = (list) => api.from?.() === "#home" ? ["#home", "回首頁"] : list === "#kana" ? ["#kana", "回五十音表"] : ["#grammar", "回基礎句型"];
  function wrap(content, destination = "#home", label = "回首頁") {
    return `<div class="lesson-shell">${header(destination, label)}<main id="main" tabindex="-1" class="study-main">${content}${warning()}</main>${footer()}</div>`;
  }
  function status(id) {
    const saved = state().courses[id];
    if (hasProgress(id) && peekAttempt(id).phase !== "done") return "接著學";
    if (saved?.completedAt) return "已完成・可再練";
    return "開始";
  }
  // A kana row shows each character with its romaji underneath as one unit, so a wrapped row never mismatches them (#80).
  const kanaCells = (course) => `<span class="kana-cells">${course.letters.map((letter, i) => `<span class="kana-cell"><span lang="ja">${escape(letter)}</span><span class="kana-roman">${escape(course.readings[i])}</span></span>`).join("")}</span>`;
  function row(course) {
    const learned = state().courses[course.id];
    const name = course.type === "kana" ? `<strong lang="ja">${escape(course.row)}</strong>${course.row.endsWith("行") ? `<span class="row-roman">（${escape(course.readings[0])}）</span>` : ""}` : `<strong>${escape(course.title)}</strong>`;
    return `<button class="course-row" data-action="study-open" data-course="${course.id}"><span>${name}${course.type === "kana" ? kanaCells(course) : `<span class="course-subtitle"${course.home === "kana" ? ' lang="ja"' : ""}>${escape(course.subtitle || `一個句型 · ${size(course)} 題練習`)}</span>`}</span><span class="course-state">${status(course.id)}${learned?.lastResult && learned.lastResult.firstCorrect === learned.lastResult.total ? " · 上次全對" : ""}</span></button>`;
  }
  const kanaRows = (script, group) => Content.rowGroups[group].map((key) => courses[`${script}-${key}`]).filter(Boolean);
  function reviewSummary() {
    const data = state();
    // Same order as KanaPractice.selectReview, so the listed characters are the ones the next round practices.
    const wrong = KanaPractice.entries.filter(item => data.kanaReview[item.id]?.wrong).sort((a,b)=>data.kanaReview[a.id].lastSeen.localeCompare(data.kanaReview[b.id].lastSeen)||a.id.localeCompare(b.id));
    const availableCount = KanaPractice.entries.filter(item => data.kanaReview[item.id] || data.courses[item.courseId]?.completedAt).length;
    return {wrongCount:wrong.length,availableCount,wrongLabels:wrong.slice(0,5).map(item=>`${item.character}（${item.reading}）`),canResume:Boolean(data.reviewSession && data.reviewSession.round!=='done'),hasData:Object.keys(data.kanaReview).length>0 || Boolean(data.reviewSession) || Object.keys(data.grammarReview).length>0 || Boolean(data.grammarReviewSession)};
  }
  // A clear is dated after the previous clear and after every answer and record this browser has dated, also when the
  // clock went back or two clears fall in one millisecond; otherwise a backup made before it looks newer and brings
  // ended rounds and mistakes back (#36). Dates iso() would drop are skipped, and the clear stays within LAST_DATE.
  function clearReview() {
    const data=state();
    const dates=[data.reviewClearedAt,...Object.values(data.kanaReview).map(item=>item.lastSeen),...Object.values(data.grammarReview).map(item=>item.lastSeen),...(api.history?.()||[]).map(entry=>entry?.date)].map(date=>Date.parse(iso(date))).filter(Number.isFinite);
    data.kanaReview={}; data.reviewSession=null; data.grammarReview={}; data.grammarReviewSession=null; data.reviewClearedAt=new Date(Math.min(LAST_DATE,Math.max(Date.now(),...dates.map(time=>time+1)))).toISOString();
    for (const id of Object.keys(courses)) if(courses[id].type==='kana') {if(data.courses[id])data.courses[id].active=null;drafts.delete(id);}
  }
  function currentPractice() {
    if (location.hash === "#kana-random") {
      const q = randomRound && !randomRound.done ? randomRound.items[randomRound.cursor] : null;
      return q ? {courseId:KanaPractice.entry(q.id).courseId,questionId:q.id,direction:q.direction,round:"random",practiceVersion:KanaPractice.VERSION} : null;
    }
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
    return wrap(`<h1 class="focus-heading" tabindex="-1">五十音表</h1><p class="study-note">第一次學日文，可以先選「平假名」，從「あ行」開始。每組先看字、聽讀音，再做選擇題；不需要先背完整張表。</p><div class="script-tabs" role="group" aria-label="選擇假名種類"><button data-action="study-script" data-script="h" aria-pressed="${script === "h"}">平假名</button><button data-action="study-script" data-script="k" aria-pressed="${script === "k"}">片假名</button></div><p class="study-note">${script === "h" ? "平假名用來寫許多日文詞語。先認字，再慢慢練熟讀音。" : "片假名常用來寫外來語，例如「コーヒー」（咖啡）。讀音和平假名對應，字形不同。"}</p>${reviewEntry()}<section class="study-review-entry"><h2>五十音隨機練習</h2><p class="study-note">基本平假名・5 題，不用先學過，也不會記成績。</p><button class="text-button" data-action="study-kana-random">練 5 題 →</button></section><h2 class="course-list-heading">基本字</h2>${learnedBefore ? '<p class="study-note">可以重新測試之前練過的組別，確認是否還記得。</p>' : ""}<div class="course-list">${kanaRows(script, "basic").map(row).join("")}</div><h2 class="course-list-heading">濁音・半濁音</h2><p class="study-note">在字的右上加兩點（濁點）或小圈（半濁點），讀音會改變，例如 か ka → が ga、は ha → ぱ pa。</p><div class="course-list">${kanaRows(script, "voiced").map(row).join("")}</div><h2 class="course-list-heading">促音・長音</h2><p class="study-note">學過基本字後，再練「停一下」和「拉長音」。課內會用例子說明怎麼念。</p><div class="course-list">${Content.sounds.map(row).join("")}</div><h2 class="course-list-heading">拗音</h2><p class="study-note">把兩個字合在一起念，例如 き＋小的 ゃ → きゃ（kya）。不要拆成 ki、ya 兩個音；這種組合叫「拗音」。</p><div class="course-list">${kanaRows(script, "youon").map(row).join("")}</div><p class="study-note">每種假名先練 46 個基本字，再練 25 個濁音・半濁音和 33 個拗音。</p>`);
  }
  function settingsPage() {
    return wrap(`<h1 class="focus-heading" tabindex="-1">學習設定</h1><section class="study-card"><h2>播放語速</h2><p class="study-note">五十音、句型與旅遊用語都會使用這個速度。</p><div class="script-tabs" role="group" aria-label="播放語速">${[[0.65,"慢速"],[0.8,"一般"],[1,"原速"]].map(([rate,label]) => `<button data-action="study-rate" data-rate="${rate}" aria-pressed="${speechRate() === rate}">${label}</button>`).join("")}</div><p class="study-note">設定存在這個瀏覽器。假名字卡的「換個記法」也會記住你的選擇。</p></section>`);
  }
  function readingHelp() {
    return `<details class="phrase-more reading-help"><summary>日文下方的英文字母怎麼看？</summary><p class="study-note">這是「羅馬字」，用英文字母提示日文讀音，不是照英文單字念。不確定時可以按喇叭聽讀音。</p><p class="study-note">aa、ii、uu、ee、oo 表示把音拉長。ou、ei 也常念成長音，例如 gakusei（學生）的最後念成 see：ga-ku-see。五十音區的「長音」課有更多例子。</p></details>`;
  }
  function grammarNext() {
    const unfinished = c => state().courses[c.id]?.active?.touched && state().courses[c.id].active.phase !== "done";
    const course = GRAMMAR.find(c => c.id === state().lastGrammarId && unfinished(c)) || GRAMMAR.find(unfinished) || GRAMMAR.find(c => !state().courses[c.id]?.completedAt);
    return course ? {courseId:course.id,title:course.title,resume:Boolean(unfinished(course))} : null;
  }
  function grammarNextEntry() {
    const next = grammarNext();
    return next ? `<section class="study-review-entry"><h2>${next.resume ? "接著學" : "下一課"}</h2><button class="text-button" data-action="study-open" data-course="${next.courseId}">${escape(next.title)} →</button></section>` : "";
  }
  // The lessons in their units (#76), each a section that opens, with a plain line of what it teaches (kept in the
  // lesson plan) and how far the learner is. The unit with the next lesson starts open (the first one on a first
  // visit), so nobody has to scan all the lessons; every lesson stays one click away. The unit names stay headings.
  function grammarUnitList() {
    const open = Content.lessonPlan[grammarNext()?.courseId]?.unit;
    return grammarUnits().map((unit) => {
      const done = unit.lessons.filter((course) => state().courses[course.id]?.completedAt).length;
      return `<details class="unit-section"${unit.title === open ? " open" : ""}><summary><h2 class="unit-title">${escape(unit.title)}</h2><span class="unit-goal">${escape(unit.goal)}</span><span class="unit-count">已完成 ${done} / ${unit.lessons.length} 課</span></summary><div class="course-list">${unit.lessons.map(row).join("")}</div></details>`;
    }).join("");
  }
  // The next lesson and the units come first, so a phone shows where to start; practice without a lesson follows.
  function grammarPage() {
    return wrap(`<h1 class="focus-heading" tabindex="-1">基礎句型</h1><p class="study-note">第一次學，從「基本句子」的第一課開始。每課先看例子，再做幾題練習。還不熟五十音也能先看中文意思，按喇叭跟著念。</p>${readingHelp()}${grammarNextEntry()}${grammarUnitList()}${grammarReviewEntry()}<section class="study-review-entry"><h2>句型隨機練習</h2><p class="study-note">入門句型・5 題，不用先學過，也不會記成績。</p><button class="text-button" data-action="study-grammar-random">練 5 題 →</button></section>`);
  }
  // Consecutive lessons with the same unit share one heading, in teaching order; the first lesson has the unit's goal.
  function grammarUnits() {
    const units = [];
    for (const course of GRAMMAR) {
      const plan = Content.lessonPlan[course.id], title = plan?.unit || "其他";
      if (!units.length || units[units.length - 1].title !== title) units.push({ title, goal: plan?.unitGoal || "", lessons: [] });
      units[units.length - 1].lessons.push(course);
    }
    return units;
  }
  // Grammar mini-review (#44): up to 5 questions from completed lessons. Questions answered wrong the first
  // time in a lesson's latest record come first; at most 2 per lesson (3 with only two lessons) keeps it mixed.
  const completedGrammar = () => GRAMMAR.filter(course => state().courses[course.id]?.completedAt);
  const reviewCap = (done) => done.length >= 3 ? 2 : 3;
  // The first two lessons have two questions each, so a round can be shorter than 5.
  const reviewSize = () => { const done = completedGrammar(); return done.length < 2 ? 0 : Math.min(5, done.reduce((sum, course) => sum + Math.min(reviewCap(done), course.questions.length), 0)); };
  function grammarRound() { return state().grammarReviewSession; }
  function rememberGrammar(course, question, correct) {
    const previous = Date.parse(state().grammarReview[question.id]?.lastSeen) || 0, cleared = Date.parse(state().reviewClearedAt) || 0;
    state().grammarReview[question.id] = {courseRevision:Content.courseRevision(course.id),lastSeen:new Date(Math.max(Date.now(),previous+1,cleared+1)).toISOString(),wrong:!correct};
  }
  const reviewKey = (item) => `${item.courseId}:${item.q}`;
  function selectGrammarReview(recent = new Set()) {
    const done = completedGrammar();
    if (done.length < 2) return [];
    const wrong = done.flatMap(course => course.questions.flatMap((question,q) => state().grammarReview[question.id]?.wrong ? [{courseId:course.id,q}] : []));
    const rest = done.flatMap(course => course.questions.map((_, q) => ({ courseId: course.id, q })));
    const ordered = [...shuffle(wrong.length).map(i => wrong[i]), ...shuffle(rest.length).map(i => rest[i])];
    const cap = reviewCap(done), count = {}, picked = [];
    // Questions answered right the first time in the previous round go last, so 再複習 does not repeat the same set.
    for (const item of [...ordered.filter(item => !recent.has(reviewKey(item))), ...ordered.filter(item => recent.has(reviewKey(item)))]) {
      if (picked.length === 5) break;
      if ((count[item.courseId] || 0) >= cap || picked.some(p => reviewKey(p) === reviewKey(item))) continue;
      count[item.courseId] = (count[item.courseId] || 0) + 1;
      picked.push(item);
    }
    return shuffle(picked.length).map(i => picked[i]);
  }
  function startGrammarRound() {
    const last = grammarRound(), recent = new Set(last?.done ? last.items.filter((_, i) => last.first[i]).map(reviewKey) : []);
    const items = selectGrammarReview(recent);
    state().grammarReviewSession = items.length ? { version:1, items: items.map(item => ({ ...item, questionId:courses[item.courseId].questions[item.q].id, courseRevision:Content.courseRevision(item.courseId), options: shuffle(courses[item.courseId].questions[item.q].options.length) })), cursor: 0, first: {}, solved: {}, wrong: null, done: false } : null;
    if (state().grammarReviewSession) save();
    return grammarRound();
  }
  // Counts for the home dashboard that only Study can compute (saved phrases, the grammar review round).
  function dashboardSummary() {
    const round = grammarRound();
    return { savedPhrases: savedPhrases().length, grammarReviewSize: reviewSize(), grammarReviewResume: Boolean(round && !round.done) };
  }
  function grammarReviewEntry() {
    if (completedGrammar().length < 2) return "";
    const round = grammarRound();
    return `<section class="study-review-entry"><h2>複習學過的句型</h2><p class="study-note">從完成的課裡挑 ${reviewSize()} 題混在一起練。</p><a class="text-button" href="#grammar-review">${round && !round.done ? "繼續複習" : `複習 ${reviewSize()} 題`}</a></section>`;
  }
  function currentReview() {
    const random = location.hash === "#grammar-random", round = random ? grammarRandomRound : location.hash === "#grammar-review" ? grammarRound() : null;
    if (!round || round.done) return null;
    const { course, question } = random ? grammarRandomItem(round) : reviewItem(round);
    return { courseId: course.id, questionId: question.id };
  }
  const reviewItem = (round) => { const item = round.items[round.cursor], course = courses[item.courseId]; return { item, course, question: course.questions[item.q] }; };
  function grammarReviewFeedback(round) {
    const { question } = reviewItem(round), solved = round.solved[round.cursor] === true;
    if (!solved && round.wrong === null) return "";
    return solved ? `答對了。${question.explanation}` : `正確答案：${question.options[question.answer]}。${question.explanation}`;
  }
  // After a wrong answer the explaining card opens in place, so the round never leaves this page.
  function grammarReviewLook(round) {
    const { course, question } = reviewItem(round);
    const step = course.steps.find(card => card.id === Content.lessonPlan[course.id]?.review?.[question.id]);
    if (!step || round.solved[round.cursor] || round.wrong === null) return "";
    return `<details class="phrase-more"><summary>回看說明：${escape(step.title)}</summary><p class="grammar-example" lang="ja">${escape(step.example)}</p>${step.reading ? `<p class="reading-label">${escape(step.reading)}</p>` : ""}<p>${escape(step.meaning)}</p><p class="study-note">${escape(step.body)}</p></details>`;
  }
  function grammarReviewPage() {
    const round = grammarRound(), [exit, exitLabel] = exitTo("#grammar");
    let body;
    if (round?.done) {
      const firstCorrect = round.items.filter((_, i) => round.first[i] === true).length;
      const missed = [...new Set(round.items.filter((_, i) => round.first[i] === false).map(item => item.courseId))];
      body = `<section class="study-card study-result"><h2>複習完成</h2><p>第一次答對 <strong>${firstCorrect} / ${round.items.length}</strong> 題</p>${missed.length ? `<p class="study-note">可以回這幾課再看看：</p><ul class="review-lessons">${missed.map(id => `<li><button class="text-button" data-action="study-open" data-course="${id}">${escape(courses[id].title)} →</button></li>`).join("")}</ul>` : '<p class="study-note">這次都答對了。</p>'}<div class="study-nav"><a class="primary" href="${exit}">${exitLabel}</a><button class="text-button" data-action="study-grammar-review">再複習 ${reviewSize()} 題</button></div></section>`;
    } else if (round) {
      const { item, course, question } = reviewItem(round), solved = round.solved[round.cursor] === true;
      body = `<p class="reading-label">複習 · ${round.cursor + 1} / ${round.items.length} · 選一個答案</p><section class="study-card study-quiz"><h2>${escape(question.prompt)}</h2><div class="study-options" role="group" aria-label="答案選項">${item.options.map(choice => `<button class="answer${solved && choice === question.answer ? " correct" : round.wrong === choice ? " wrong" : ""}" data-action="study-answer" data-choice="${choice}" aria-disabled="${solved}"${solved ? ' tabindex="-1"' : ""}>${question.readings ? `<span lang="ja">${escape(question.options[choice])}</span><span class="option-reading">${escape(question.readings[choice])}</span>` : escape(question.options[choice])}<span class="answer-status">${solved && choice === question.answer ? " ✓ 答對了" : round.wrong === choice ? " ✕ 再試一次" : ""}</span></button>`).join("")}</div><p class="study-feedback${!solved && round.wrong !== null ? " wrong" : ""}" role="status" aria-live="polite">${escape(grammarReviewFeedback(round))}</p><div class="look-back-slot">${grammarReviewLook(round)}</div></section><div class="study-nav"><button class="primary" data-action="study-next"${solved ? "" : " disabled"}>${round.cursor === round.items.length - 1 ? "完成複習" : "下一題 →"}</button></div>`;
    } else body = reviewSize() ? `<p>從完成的句型課挑 ${reviewSize()} 題混在一起練，最近答錯、還沒獨立答對的題目會優先出現。答錯時會顯示正確答案和說明，可以再選一次。</p><button class="primary" data-action="study-grammar-review">開始複習</button>` : '<p>先完成兩課句型，就可以在這裡複習。</p><a class="primary" href="#grammar">看基礎句型</a>';
    return wrap(`<h1 class="focus-heading" tabindex="-1">句型小複習</h1>${body}<p class="study-note">複習進度會保存在這個瀏覽器，下次可以接著練；不會改變各課的完成紀錄和成績。</p><div class="lesson-utilities"><button class="text-button" data-action="feedback">這一頁有問題？</button></div>`, exit, exitLabel);
  }
  // A card opened from a search result is marked, so it gets focus and comes into view.
  function travelCard(item,step,index,found=false) { return `<section class="study-card travel-card${found ? " travel-found" : ""}"${found ? ' tabindex="-1"' : ""}><div class="travel-card-heading"><h2>${escape(step.title)}</h2><button class="text-button favorite-toggle" data-action="study-favorite" data-phrase="${step.id}" aria-pressed="${favoriteIds().includes(step.id)}" aria-label="${escape(step.title)}：收藏">${favoriteIds().includes(step.id) ? "已收藏" : "收藏"}</button></div>${keywordBox(step.keywords)}<div class="phrase-short"><h3 class="phrase-label">可以這樣說</h3><p lang="ja">${escape(step.example)}</p><p class="reading-label">${escape(step.reading)}</p><p>${escape(step.meaning)}</p>${audioButton(item, index, true, false)}</div>${step.staffAsks ? `<p class="staff-asks"><span class="staff-asks-label">店員可能會問</span><span lang="ja">${escape(step.staffAsks.example)}</span><span class="staff-asks-reading">${escape(step.staffAsks.reading)}</span><span>${escape(step.staffAsks.meaning)}</span></p>` : ""}<p class="study-note">${escape(step.body)}</p>${step.polite ? `<details class="phrase-more"><summary>看完整說法與讀音</summary><p lang="ja">${escape(step.polite)}</p><p class="reading-label">${escape(step.politeReading)}</p><p>${escape(step.politeMeaning)}</p>${audioButton(item, index, true, true)}</details>` : ""}${step.extra ? `<details class="phrase-more"><summary>${escape(step.extra.title)}</summary>${keywordBox(step.extra.keywords)}<p lang="ja">${escape(step.extra.example)}</p><p class="reading-label">${escape(step.extra.reading)}</p><p>${escape(step.extra.meaning)}</p><p class="study-note">${escape(step.extra.body)}</p></details>` : ""}</section>`; }
  const savedPhrases = () => favoriteIds().flatMap(id => PHRASEBOOK.flatMap(item => item.steps.flatMap((step,index) => step.id === id ? [{item,step,index}] : [])));
  function travelPage(id) {
    if (id === "favorites") {
      const saved = savedPhrases();
      return wrap(`<h1 class="focus-heading" tabindex="-1">我的常用語</h1><p class="study-note">收藏的詞存在這個瀏覽器，旅行時可以直接來這裡找。</p>${saved.length ? saved.map(({item,step,index}) => travelCard(item,step,index)).join("") : '<section class="study-card"><h2>還沒有收藏</h2><p>在旅遊用語卡上按「收藏」，就會出現在這裡。</p><a class="text-button" href="#travel">找旅遊常用語 →</a></section>'}`,"#travel","回旅遊常用語");
    }
    if (!id) {
      const back = travelReturn;
      travelReturn = null;
      travelShown = travelResults(back);
      return wrap(`<h1 class="focus-heading" tabindex="-1">旅遊常用語</h1><p class="study-note">依情境找需要的詞。先記關鍵字，配合指物或出示畫面，通常就能讓對方了解意思；需要時再看完整說法。</p>${readingHelp()}<div class="travel-search" role="search"><label for="travel-search">找詞或情境</label><input id="travel-search" type="search" value="${escape(travelQuery)}" placeholder="例如：結帳、Suica、寄放行李" autocomplete="off" enterkeyhint="search"><p id="travel-status" class="visually-hidden" role="status" aria-live="polite"></p></div><div id="travel-results">${travelShown}</div><a class="course-row favorites-entry" href="#travel/favorites"><strong>我的常用語</strong><span class="favorites-count">${savedPhrases().length} 張收藏<span aria-hidden="true"> →</span></span></a>${travelGroups()}`);
    }
    const item = travelItem(id), found = travelFound;
    travelFound = null;
    if (!item) return wrap('<h1 class="focus-heading" tabindex="-1">找不到這個情境</h1><a class="text-button" href="#travel">回旅遊常用語</a>');
    return wrap(`<h1 class="focus-heading" tabindex="-1">${escape(item.title)}</h1><p class="study-note">先看關鍵字與意思，需要時再展開例句。</p>${item.steps.map((step, index) => travelCard(item,step,index,step.id === found)).join("")}<div class="study-nav"><a class="text-button" href="#travel">← 換個情境</a>${item.id === "basics" ? "" : '<a class="text-button" href="#travel/basics">需要幫忙時</a>'}<button class="text-button" data-action="feedback">這一頁有問題？</button></div>`, "#travel", "回旅遊常用語");
  }
  // Travel search (#75): every card with what a traveller might type: its title, keywords with their readings and
  // meanings, the short and full phrases, what staff may ask and any extra part, each with romaji and meaning. Width,
  // case, spaces, punctuation, katakana versus hiragana, 臺／台 and long vowels in romaji (hoomu, homu, toukyou) are
  // ignored, and a few everyday words lead to the ones the cards use. The query lives only in this page: nothing is
  // saved or sent.
  let travelQuery = "", travelFound = null, travelReturn = null, travelIndex = null, travelShown = null;
  // Romaji words keep a boundary (rokkaa | doko), so a query never matches across two words or two fields.
  const fold = (text) => String(text).normalize("NFKC").toLowerCase().replace(/\|/gu, "").replace(/臺/gu, "台").replace(/[ァ-ヶ]/gu, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60))
    .replace(/([a-z])[\s,.!?'’\-/]+(?=[a-z])/gu, "$1|").replace(/[\s・、。，,.!?！？「」『』（）()〜~'’\-／/]/gu, "").replace(/ou/gu, "o").replace(/([aiueo])\1+/gu, "$1");
  const TRAVEL_ALIASES = [["寄物櫃", "置物櫃"], ["寄物", "寄放"], ["寄行李", "寄放行李"], ["行李寄放", "寄放行李"], ["洗手間", "廁所"], ["化妝室", "廁所"], ["買單", "結帳"], ["埋單", "結帳"], ["會計", "会計"], ["付款", "付現", "結帳"], ["打包", "外帶"], ["儲值", "加值"], ["交通卡", "交通ic卡"], ["icoca", "交通ic卡"], ["pasmo", "交通ic卡"], ["發票", "收據"], ["不用", "不需要"], ["不要", "不需要"], ["來回票", "來回"]];
  const fields = (part) => part ? [part.title, ...(part.keywords || []).flat(), part.example, part.reading, part.meaning, part.polite, part.politeReading, part.politeMeaning].filter(Boolean).map(fold) : [];
  const variants = (q) => [q, ...TRAVEL_ALIASES.filter(([alias]) => q.includes(fold(alias))).flatMap(([alias, ...words]) => words.map((word) => q.replace(fold(alias), fold(word))))];
  function travelMatches(query) {
    travelIndex ||= PHRASEBOOK.flatMap((item) => item.steps.map((step) => ({ item, step, own: [...fields(step), ...fields(step.staffAsks), ...fields(step.extra)].join("|"), situation: fold(item.title) })));
    const q = fold(query);
    if (!q) return [];
    const inCard = (entry, word) => variants(word).some((term) => entry.own.includes(term));
    const inSituation = (entry, word) => variants(word).some((term) => entry.situation.includes(term));
    // Cards whose own words match; then every card of a situation whose name matches, when none of its own did.
    const own = travelIndex.filter((entry) => inCard(entry, q));
    const named = travelIndex.filter((entry) => !own.some((match) => match.item === entry.item) && inSituation(entry, q));
    if (own.length || named.length) return [...own, ...named];
    // Several words that never appear together: the cards matching more of them come first.
    const words = String(query).trim().split(/\s+/u).map(fold).filter(Boolean);
    if (words.length < 2) return [];
    return travelIndex.map((entry) => ({ entry, score: words.filter((word) => inCard(entry, word) || inSituation(entry, word)).length }))
      .filter(({ score }) => score).sort((a, b) => b.score - a.score).map(({ entry }) => entry);
  }
  // The row of the card just looked at is marked, so coming back puts focus on it.
  function travelResults(back = null) {
    if (!fold(travelQuery)) return "";
    const found = travelMatches(travelQuery);
    if (!found.length) return `<section class="travel-results"><h2>找不到「${escape(travelQuery.trim())}」</h2><p class="study-note">換個說法試試，或從下面的情境找。</p><button class="text-button" data-action="study-travel-clear">清除搜尋</button></section>`;
    return `<section class="travel-results"><div class="travel-results-head"><h2>找到 ${found.length} 張卡</h2><button class="text-button" data-action="study-travel-clear">清除搜尋</button></div><ul class="dash-list">${found.map(({ item, step }) => `<li><button class="dash-row${step.id === back ? " return-focus" : ""}" data-action="study-travel-open" data-situation="${item.id}" data-step="${escape(step.id)}"><span class="dash-row-main"><strong>${escape(step.title)}</strong><span><span lang="ja">${escape(step.example)}</span>　${escape(step.meaning)}</span></span><span class="dash-row-meta">${escape(item.title.split("（")[0])}</span>${api.icons?.arrow || "→"}</button></li>`).join("")}</ul></section>`;
  }
  // Only the count is announced; the list itself is not a live region, so typing is not read out row by row.
  const travelStatus = () => { if (!fold(travelQuery)) return ""; const n = travelMatches(travelQuery).length; return n ? `找到 ${n} 張卡` : "找不到符合的卡"; };
  // While a word is still being composed with an input method the results wait, so the composition is not broken;
  // a query that changes nothing redraws and announces nothing.
  function searchTravel(value, composing = false) {
    travelQuery = String(value || "");
    if (composing || location.hash !== "#travel") return;
    const html = travelResults();
    if (html === travelShown) return;
    travelShown = html;
    const results = document.querySelector("#travel-results"), status = document.querySelector("#travel-status");
    if (results) results.innerHTML = html;
    if (status) status.textContent = travelStatus();
  }
  // The travel list in a few groups, each with a plain Chinese line, so a situation is found without reading Japanese
  // (#79). A situation missing here still shows, in a last group.
  const TRAVEL_GROUPS = [
    { title: "隨時用得到", note: "叫人、聽不懂、東西不見", tone: "purple", ids: ["basics"] },
    { title: "吃飯與購物", note: "點餐、內用外帶、結帳、買東西", tone: "apricot", ids: ["t-order", "dining", "t-pay", "shopping"] },
    { title: "搭車與找路", note: "買票、月台、加值、找廁所和置物櫃", tone: "aqua", ids: ["transit", "t-charge", "t-place"] },
    { title: "住宿與景點", note: "飯店、排隊、入場與活動", tone: "rose", ids: ["hotel", "lines", "live"] },
  ];
  // Words that show what a situation covers, picked by hand from its cards: a pair stays together (內用、外帶) and a
  // word that reads the same in Chinese (出口) is left out. The Chinese comes first: the Japanese is the thing to say
  // once the situation is found.
  const TRAVEL_WORDS = {
    basics: ["すみません", "もう一度", "わかりません"],
    "t-order": ["ひとつ", "アイス", "大盛"],
    dining: ["店内", "持ち帰り", "お水"],
    "t-pay": ["お会計", "カード", "Suica"],
    shopping: ["いくら", "試着", "袋"],
    transit: ["片道", "ホーム", "乗り換え"],
    "t-charge": ["チャージ", "1000円"],
    "t-place": ["トイレ", "エレベーター", "ロッカー"],
    hotel: ["チェックイン", "チェックアウト", "荷物"],
    lines: ["最後尾", "何時まで", "当日券"],
    live: ["開場", "物販", "ドリンク代"],
  };
  function travelWords(item) {
    const words = item.steps.flatMap((step) => step.keywords).map(([word, , meaning]) => ({ word: word.replace(/（.*?）/u, ""), meaning: meaning.split("／")[0] }));
    return (TRAVEL_WORDS[item.id] || []).map((word) => words.find((entry) => entry.word === word)).filter(Boolean)
      .map(({ word, meaning }) => `<span class="travel-word">${escape(meaning)}<span lang="ja">${escape(word)}</span></span>`).join("");
  }
  // A card is named by its title and plain Chinese line; the words below would only repeat them.
  function travelGroups() {
    const grouped = new Set(TRAVEL_GROUPS.flatMap((group) => group.ids)), rest = PHRASEBOOK.filter((item) => !grouped.has(item.id));
    const groups = [...TRAVEL_GROUPS, ...(rest.length ? [{ title: "其他", note: "", tone: "purple", ids: rest.map((item) => item.id) }] : [])];
    return `<nav class="travel-groups" aria-label="旅遊情境">${groups.map((group, n) => `<section class="travel-group tone-${group.tone}" aria-labelledby="travel-group-${n}"><h2 id="travel-group-${n}">${escape(group.title)}</h2>${group.note ? `<p>${escape(group.note)}</p>` : ""}<div class="travel-categories">${group.ids.map(travelItem).filter(Boolean).map((item) => `<a class="course-row" href="#travel/${item.id}" aria-labelledby="travel-${item.id}-name travel-${item.id}-note"><span><strong id="travel-${item.id}-name">${escape(item.title)}</strong><span class="reading-label" id="travel-${item.id}-note">${escape(item.subtitle)}</span><span class="travel-words">${travelWords(item)}</span></span><span aria-hidden="true">→</span></a>`).join("")}</div></section>`).join("")}</nav>`;
  }
  // Travel cards have a short phrase and, sometimes, a fuller form; each gets its own button and status.
  // A speaker button whose name says which Japanese it plays (#78); the status line stays empty unless audio cannot play.
  const speaker = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M15.5 9a4.2 4.2 0 0 1 0 6M18 6.5a7.8 7.8 0 0 1 0 11" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>';
  function audioButton(course, index, travel = false, full = false) {
    const step = course.steps?.[index];
    const text = course.type === "kana" ? course.letters[index] : full ? step.polite : step.example;
    return `<button class="audio-button" data-action="${travel ? "study-travel-audio" : "study-audio"}" data-course="${course.id}" data-index="${index}"${travel ? ` data-full="${full ? 1 : 0}"` : ""}>${speaker}<span class="visually-hidden">播放「<span lang="ja">${escape(text)}</span>」的讀音</span></button><p class="study-audio-status study-note"${travel ? ` data-audio-for="${course.id}-${index}${full ? "-full" : ""}"` : ""} role="status" aria-live="polite"></p>`;
  }
  function keywordBox(keywords) {
    // The kana reading in （） stays on one line so narrow screens do not split it.
    const word = (text) => { const at = text.indexOf("（"); return at < 0 ? escape(text) : `${escape(text.slice(0, at))}<span class="kw-kana">${escape(text.slice(at))}</span>`; };
    return `<div class="keyword-box"><h3>關鍵字</h3><dl>${keywords.map(([text, reading, meaning]) => `<div><dt><strong lang="ja">${word(text)}</strong><span>${escape(reading)}</span></dt><dd>${escape(meaning)}</dd></div>`).join("")}</dl></div>`;
  }
  // One box with everything a kana has (#35): its kanji origin, how it differs from a kana easy to mix up, and an
  // example word to hear with the kana marked. Nothing to switch between; words are examples and never tested.
  // Every copy of the kana in the example is marked (みみ, バナナ); kana inside the Chinese is tagged Japanese for screen readers.
  const markKana = (word, letter) => word.split(letter).map(escape).join(`<mark>${escape(letter)}</mark>`);
  const japaneseRuns = (text) => escape(text).replace(/[ぁ-ゖァ-ヺー]+/gu, (run) => `<span lang="ja">${run}</span>`);
  function hintCard(course, index) {
    const letter = course.letters[index], hints = typeof KanaHints !== "undefined" ? KanaHints.get(letter) : [];
    if (!hints?.length) return "";
    const item = (hint) => `<div><dt>${escape(hint.label)}</dt><dd>${hint.word ? `<span class="hint-word" lang="ja">${markKana(hint.word, letter)}</span><span class="hint-roman">${escape(hint.romaji)}</span><span>${escape(hint.meaning)}</span><button class="audio-button" data-action="study-word-audio" data-letter="${escape(letter)}">${speaker}<span class="visually-hidden">播放「<span lang="ja">${escape(hint.word)}</span>」的讀音</span></button>` : japaneseRuns(hint.text)}</dd></div>`;
    return `<aside class="kana-hint"><p class="hint-title">記憶提示</p><dl class="hint-list">${hints.map(item).join("")}</dl>${hints.some((hint) => hint.word) ? '<p class="study-audio-status study-note" data-audio-for="hint-word" role="status" aria-live="polite"></p>' : ""}${KanaHints.notice && hints.some((hint) => hint.label === "字源" || hint.word) ? `<details><summary>關於記憶提示</summary><p class="study-note">${escape(KanaHints.notice)}</p></details>` : ""}</aside>`;
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
        : course.spoken[i] === "を" ? "を 讀 o，和「お」同音。常放在吃、喝等動作所對應的東西後面，句型課會再練。"
        : course.spoken[i] === "は" ? "は 單獨認字時讀 ha；放在句子裡表示正在說誰或什麼時，會讀 wa，句型課會再練。"
        : course.spoken[i] === "へ" ? "へ 單獨認字時讀 he；放在地點後面表示「往那裡」時，會讀 e，句型課會再練。"
        : sameSoundNote[letter] || "";
      body = `<div class="kana-character" lang="ja">${course.letters[i]}</div><div class="reading-label">讀音 <strong>${course.readings[i]}</strong></div>${audioButton(course, i)}${special?`<p class="study-note">${special}</p>`:""}${hintCard(course,i)}`;
    } else {
      const step = course.steps[i];
      const keywords = step.keywords ? keywordBox(step.keywords) : "";
      const extra = step.extra;
      const supplement = extra ? `<details class="phrase-more"><summary>${escape(extra.title)}</summary>${keywordBox(extra.keywords)}<p lang="ja">${escape(extra.example)}</p><p class="reading-label">${escape(extra.reading)}</p><p>${escape(extra.meaning)}</p><p class="study-note">${escape(extra.body)}</p></details>` : "";
      body = `<h2>${escape(step.title)}</h2>${keywords}${step.keywords ? '<h3 class="phrase-label">可以這樣說</h3>' : ""}<p class="grammar-example" lang="ja">${escape(step.example)}</p>${step.reading ? `<p class="reading-label">${escape(step.reading)}</p>` : ""}<p>${escape(step.meaning)}</p>${audioButton(course, i)}<p class="study-note">${escape(step.body)}</p>${step.polite ? `<details class="phrase-more"><summary>較完整的說法</summary><p lang="ja">${escape(step.polite)}</p><p class="reading-label">${escape(step.politeReading)}</p><p>${escape(step.politeMeaning)}</p></details>` : ""}${supplement}`;
    }
    // Once a grammar quiz has answers, the cards lead back to the question instead of restarting it.
    const resumable = course.type === "grammar" && Object.keys(active.first || {}).length > 0;
    return `<p class="reading-label">${course.type === "kana" ? "認字與讀音" : course.home === "kana" ? "發音說明" : "句型說明"} · ${i + 1} / ${cards(course)}</p><section class="study-card">${body}</section><div class="study-nav"><button class="text-button" data-action="study-prev"${i === 0 ? " disabled" : ""}>← 上一張</button>${resumable && i < cards(course) - 1 ? '<button class="text-button" data-action="study-resume">回到題目</button>' : ""}${resumable && i === cards(course) - 1 ? '<button class="primary" data-action="study-resume">回到題目</button>' : `<button class="primary" data-action="study-next">${i === cards(course) - 1 ? "開始練習" : "下一張 →"}</button>`}</div>`;
  }
  // 五十音隨機練習 (#82): five basic-hiragana questions drawn at random, for anyone, with or without records. A round
  // lives in this page only: it records nothing and never touches course completion, review rounds or the mistake
  // list, and a reload starts a new round. Each question is asked once; a miss shows the answer and the round goes on.
  const RANDOM_SIZE = 5;
  let randomRound = null;
  function newRandomRound() {
    const pool = KanaPractice.entries.filter((item) => item.script === "h" && Content.rowGroups.basic.includes(item.courseId.slice(2)));
    // Five characters with five different readings, so お and を never both appear as the prompt "o".
    const picked = [];
    for (const i of shuffle(pool.length)) if (picked.length < RANDOM_SIZE && !picked.some((item) => item.reading === pool[i].reading)) picked.push(pool[i]);
    const items = picked.map((item) => {
      const others = [];
      // Options never share the answer's reading, or each other's, so お and を are never both right.
      for (const j of shuffle(pool.length)) {
        const other = pool[j];
        if (other.reading !== item.reading && !others.some((o) => o.reading === other.reading)) others.push(other);
        if (others.length === 3) break;
      }
      const options = [item, ...others];
      return { id: item.id, direction: Math.random() < 0.5 ? "reading" : "character", options: shuffle(options.length).map((k) => options[k].id) };
    });
    return { items, cursor: 0, answers: [], done: false };
  }
  const randomExit = () => api.from?.() === "#kana" ? ["#kana", "回五十音表"] : ["#home", "回首頁"];
  function randomFeedback(round) {
    const q = round.items[round.cursor], choice = round.answers[round.cursor];
    if (choice === undefined) return "";
    const item = KanaPractice.entry(q.id);
    return `${q.options[choice] === q.id ? "答對了" : "正確答案"}：${item.character}＝${item.reading}`;
  }
  function randomPage() {
    randomRound ||= newRandomRound();
    const round = randomRound, [exit, exitLabel] = randomExit(), total = round.items.length;
    const table = exit === "#kana" ? "" : '<a class="text-button" href="#kana">看五十音表</a>';
    let body;
    if (round.done) {
      const missed = round.items.filter((q, i) => q.options[round.answers[i]] !== q.id).map((q) => KanaPractice.entry(q.id));
      body = `<section class="study-card study-result"><h2>${missed.length ? "練習完成" : "全部答對"}</h2><p>這輪答對 <strong>${total - missed.length} / ${total}</strong> 題</p>${missed.length ? `<p class="study-note">答錯的字：${missed.map((item) => escape(`${item.character}（${item.reading}）`)).join("、")}</p>` : ""}<div class="study-nav"><a class="primary" href="${exit}">${exitLabel}</a><button class="text-button" data-action="study-random-again">再練 ${RANDOM_SIZE} 題</button></div></section>`;
    } else {
      const q = round.items[round.cursor], item = KanaPractice.entry(q.id), chosen = round.answers[round.cursor], answered = chosen !== undefined, correct = answered && q.options[chosen] === q.id;
      body = `<p class="reading-label">基本平假名 · ${round.cursor + 1} / ${total} · 選一個答案</p><section class="study-card study-quiz"><h2>${q.direction === "reading" ? "這個讀音，對應哪個字？" : "這個字，讀音是哪一個？"}</h2><div class="kana-character"${q.direction === "character" ? ' lang="ja"' : ""}>${escape(q.direction === "reading" ? item.reading : item.character)}</div><div class="study-options kana-options" role="group" aria-label="答案選項">${q.options.map((id, index) => { const option = KanaPractice.entry(id); return `<button class="answer${answered && id === q.id ? " correct" : answered && chosen === index ? " wrong" : ""}" data-action="study-answer" data-choice="${index}" aria-disabled="${answered}"${answered ? ' tabindex="-1"' : ""}>${q.direction === "reading" ? `<span lang="ja">${escape(option.character)}</span>` : escape(option.reading)}<span class="answer-status">${answered ? answerMark(chosen === index, id === q.id, correct) : ""}</span></button>`; }).join("")}</div><p class="study-feedback${answered && !correct ? " wrong" : ""}" role="status" aria-live="polite">${escape(randomFeedback(round))}</p></section><div class="study-nav"><button class="primary" data-action="study-next"${answered ? "" : " disabled"}>${round.cursor + 1 === total ? "看結果 →" : "下一題 →"}</button></div>`;
    }
    return wrap(`<h1 class="focus-heading" tabindex="-1">五十音隨機練習</h1>${body}<p class="study-note">從 46 個基本平假名隨機出題，不用先學過；這裡的作答不會記成成績，也不會改變複習。</p><div class="lesson-utilities">${table}<button class="text-button" data-action="feedback">這一頁有問題？</button></div>`, exit, exitLabel);
  }
  // Like updatePractice: a random round's answer is marked in place, so a screen reader hears the feedback and
  // focus moves on to 下一題. After a miss the right option is marked too.
  const answerMark = (selected, right, correct) => selected ? (correct ? " ✓ 答對了" : " ✕ 答錯了") : !correct && right ? " ✓ 正確答案" : "";
  function paintChoice(choice, rightChoice, feedbackText) {
    const correct = choice === rightChoice;
    for (const node of document.querySelectorAll('[data-action="study-answer"]')) {
      const value = Number(node.dataset.choice), selected = value === choice, right = value === rightChoice;
      node.classList.toggle("correct", right); node.classList.toggle("wrong", selected && !correct); node.setAttribute("aria-disabled", "true"); node.setAttribute("tabindex", "-1");
      const mark = node.querySelector(".answer-status"); if (mark) mark.textContent = answerMark(selected, right, correct);
    }
    const feedback = document.querySelector(".study-feedback");
    if (feedback) {
      feedback.textContent = feedbackText; feedback.classList.toggle("wrong", !correct);
      const bounds = feedback.getBoundingClientRect?.();
      if (!bounds || bounds.top < 0 || bounds.bottom > window.innerHeight) feedback.scrollIntoView?.({ block: "nearest", behavior: "smooth" });
    }
    const next = document.querySelector('[data-action="study-next"]'); if (next) { next.disabled = false; next.focus({ preventScroll: true }); }
  }
  // 句型隨機練習 (#83): five questions from the noun-sentence lessons that open 基本句子, for anyone, with or without
  // records. Like 五十音隨機練習 a round lives in this page only and records nothing; each question is asked once,
  // and a miss shows the answer with its reading and explanation.
  // Each question was checked for a learner starting from zero: it says in Chinese what to say or what is asked, and
  // every Japanese option has its reading, so it can be answered without a lesson; a first try may be a guess, and the
  // explanation teaches the point. Questions asking the meaning of Japanese shown without a reading stay out, as does
  // one whose sentence has no Chinese meaning (これと それです); a question added to these lessons later does not join.
  const GRAMMAR_RANDOM_POOL = ["g-identity/question/topic-reading", "g-question/question/question-ending", "g-demo/question/held-item", "g-demo/question/distant-item", "g-demo/question/listener-item", "g-negative/question/ja-nai", "g-negative/question/answer", "g-no/question/my-bread", "g-mo/question/me-too", "g-to/question/and"];
  let grammarRandomRound = null;
  function newGrammarRandomRound() {
    const pool = GRAMMAR_RANDOM_POOL.map((id) => { const courseId = id.split("/")[0]; return { courseId, q: courses[courseId]?.questions.findIndex((question) => question.id === id) ?? -1 }; }).filter(({ q }) => q >= 0);
    const items = shuffle(pool.length).slice(0, RANDOM_SIZE).map((i) => ({ ...pool[i], options: shuffle(courses[pool[i].courseId].questions[pool[i].q].options.length) }));
    return { items, cursor: 0, answers: [], done: false };
  }
  const grammarRandomItem = (round) => { const item = round.items[round.cursor], course = courses[item.courseId]; return { item, course, question: course.questions[item.q] }; };
  function grammarRandomFeedback(round) {
    const choice = round.answers[round.cursor];
    if (choice === undefined) return "";
    const { question } = grammarRandomItem(round);
    return choice === question.answer ? `答對了。${question.explanation}` : `正確答案：${question.options[question.answer]}${question.readings ? `（${question.readings[question.answer]}）` : ""}。${question.explanation}`;
  }
  function grammarRandomPage() {
    grammarRandomRound ||= newGrammarRandomRound();
    const round = grammarRandomRound, total = round.items.length;
    const [exit, exitLabel] = api.from?.() === "#grammar" ? ["#grammar", "回基礎句型"] : ["#home", "回首頁"];
    const list = exit === "#grammar" ? "" : '<a class="text-button" href="#grammar">看基礎句型</a>';
    const right = (item, i) => round.answers[i] === courses[item.courseId].questions[item.q].answer;
    let body;
    if (round.done) {
      const missed = [...new Set(round.items.filter((item, i) => !right(item, i)).map((item) => item.courseId))];
      body = `<section class="study-card study-result"><h2>${missed.length ? "練習完成" : "全部答對"}</h2><p>這輪答對 <strong>${round.items.filter(right).length} / ${total}</strong> 題</p>${missed.length ? `<p class="study-note">想多看說明，可以看這幾課：</p><ul class="review-lessons">${missed.map((id) => `<li><button class="text-button" data-action="study-open" data-course="${id}">${escape(courses[id].title)} →</button></li>`).join("")}</ul>` : ""}<div class="study-nav"><a class="primary" href="${exit}">${exitLabel}</a><button class="text-button" data-action="study-grammar-random-again">再練一次</button></div></section>`;
    } else {
      const { item, question } = grammarRandomItem(round), chosen = round.answers[round.cursor], answered = chosen !== undefined, correct = chosen === question.answer;
      body = `<p class="reading-label">入門句型 · ${round.cursor + 1} / ${total} · 選一個答案</p><section class="study-card study-quiz"><h2>${escape(question.prompt)}</h2><div class="study-options" role="group" aria-label="答案選項">${item.options.map((choice) => `<button class="answer${answered && choice === question.answer ? " correct" : answered && chosen === choice ? " wrong" : ""}" data-action="study-answer" data-choice="${choice}" aria-disabled="${answered}"${answered ? ' tabindex="-1"' : ""}>${question.readings ? `<span lang="ja">${escape(question.options[choice])}</span><span class="option-reading">${escape(question.readings[choice])}</span>` : escape(question.options[choice])}<span class="answer-status">${answered ? answerMark(chosen === choice, choice === question.answer, correct) : ""}</span></button>`).join("")}</div><p class="study-feedback${answered && !correct ? " wrong" : ""}" role="status" aria-live="polite">${escape(grammarRandomFeedback(round))}</p></section><div class="study-nav"><button class="primary" data-action="study-next"${answered ? "" : " disabled"}>${round.cursor + 1 === total ? "看結果 →" : "下一題 →"}</button></div>`;
    }
    return wrap(`<h1 class="focus-heading" tabindex="-1">句型隨機練習</h1>${body}<p class="study-note">從「基本句子」開頭幾課的名詞句隨機出題，不用先學過；這裡的作答不會記成成績，也不會改變複習。</p><div class="lesson-utilities">${list}<button class="text-button" data-action="feedback">這一頁有問題？</button></div>`, exit, exitLabel);
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
  // Like rememberGrammar: a clock that went back never dates an answer before the previous one or the last clear.
  function rememberAnswer(outcome) {
    const previous=Date.parse(state().kanaReview[outcome.id]?.lastSeen)||0, cleared=Date.parse(state().reviewClearedAt)||0;
    state().kanaReview[outcome.id]={lastSeen:new Date(Math.max(Date.now(),previous+1,cleared+1)).toISOString(),wrong:!outcome.correct};
  }
  function reviewPage() {
    const session=state().reviewSession, summary=reviewSummary(), [exit, exitLabel]=exitTo('#kana');
    let body;
    if(session?.round==='done'){
      const remaining=session.questions.filter(q=>state().kanaReview[q.id]?.wrong).map(q=>KanaPractice.entry(q.id));
      // retryQuestions are this round's first-time misses; a miss fixed in the retry is not "all right".
      const missed=session.retryQuestions.length, retryRight=session.retryQuestions.every((q,i)=>q.options[session.retryAnswers[i]]===q.id);
      body=`<h2>複習完成</h2><p>這次練了 ${session.questions.length} 個字。</p>${remaining.length?`<p>還可以再練：${remaining.map(item=>escape(`${item.character}（${item.reading}）`)).join('、')}</p>`:missed?`<p>第一次答錯 ${missed} 個字${retryRight?`，再考一次${missed>1?'都':''}答對了`:''}。</p>`:'<p>這次的字都答對了。</p>'}<div class="study-nav"><a class="primary" href="${exit}">${exitLabel}</a><button class="text-button" data-action="study-review-start">再複習 ${Math.min(5,summary.availableCount)} 個字</button></div>`;
    }else if(session)body=practiceQuiz(session,true);
    else body=`<p>先練答錯的字，較早答錯的先練；再複習較久沒練的字，最多 5 個。</p>${summary.wrongLabels.length?`<p>${wrongLine(summary)}</p>`:''}${summary.availableCount?'<button class="primary" data-action="study-review-start">開始複習</button>':'<p>先完成一組五十音練習，就可以在這裡複習。</p>'}`;
    return wrap(`<h1 class="focus-heading" tabindex="-1">五十音複習</h1>${body}<div class="lesson-utilities"><button class="text-button" data-action="feedback">這一頁有問題？</button></div>`,exit,exitLabel);
  }
  function answerFeedback(course, active) {
    const q = active.order[active.cursor], solved = active.solved[q] === true;
    if (!solved && active.wrong === null) return "";
    if (course.type === "kana") return `${solved ? "答對了" : "正確答案"}：${course.letters[q]}＝${course.readings[q]}`;
    const question = course.questions[q];
    return solved ? `答對了。${question.explanation}` : `正確答案：${question.options[question.answer]}。${question.explanation}`;
  }
  // After a wrong answer, link straight to the card that explains it; the first answer stays recorded.
  function lookBack(course, active) {
    const question = course.type === "grammar" ? course.questions[active.order[active.cursor]] : null;
    const cardId = question && Content.lessonPlan[course.id]?.review?.[question.id];
    const index = cardId ? course.steps.findIndex((step) => step.id === cardId) : -1;
    return index >= 0 && !active.solved[active.order[active.cursor]] && active.wrong !== null ? `<button class="text-button look-back" data-action="study-look" data-card="${index}">回看說明：${escape(course.steps[index].title)}</button>` : "";
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
    return `<p class="reading-label">練習 · ${active.cursor + 1} / ${size(course)} · 選一個答案</p><section class="study-card study-quiz"><h2>${escape(prompt)}</h2>${question ? "" : `<div class="kana-character"${active.direction === "character" ? ' lang="ja"' : ""}>${escape(active.direction === "reading" ? course.readings[q] : course.letters[q])}</div>`}<div class="study-options${course.type === "kana" ? " kana-options" : ""}" role="group" aria-label="答案選項">${active.options[q].map((choice) => `<button class="answer${solved && choice === correct ? " correct" : active.wrong === choice ? " wrong" : ""}" data-action="study-answer" data-choice="${choice}" aria-disabled="${solved}"${solved ? ' tabindex="-1"' : ""}>${question?.readings ? `<span lang="ja">${escape(options[choice])}</span><span class="option-reading">${escape(question.readings[choice])}</span>` : course.type === "kana" && active.direction === "reading" ? `<span lang="ja">${escape(options[choice])}</span>` : escape(options[choice])}<span class="answer-status">${solved && choice === correct ? ' ✓ 答對了' : active.wrong === choice ? ' ✕ 再試一次' : ''}</span></button>`).join("")}</div><p class="study-feedback${!solved && active.wrong !== null ? " wrong" : ""}" role="status" aria-live="polite">${escape(feedback)}</p><div class="look-back-slot">${lookBack(course, active)}</div></section><div class="study-nav"><button class="text-button" data-action="study-review">回去看看</button><button class="primary" data-action="study-next"${solved ? "" : " disabled"}>${active.cursor === size(course) - 1 ? "完成這一輪" : "下一題 →"}</button></div><p class="study-note">答錯可以重試；第一次的答案會留下紀錄，重試不會改寫第一次作答的成績。</p>`;
  }
  function nextCourse(id) {
    const course = courses[id];
    // Grammar lessons follow their teaching order; special-sound lessons stand alone.
    if (course?.type === "grammar" && GRAMMAR.includes(course)) return GRAMMAR[GRAMMAR.indexOf(course) + 1]?.id || null;
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
      // A stable kana ID records the old character, never the current reading; contracted sounds join two code points (u304d-3083 is きゃ).
      const match = typeof id === "string" && id.startsWith(`${entry.courseId}/question/`) && id.match(/^[hk]-[a-z]+\/question\/u([0-9a-f]{4}(?:-[0-9a-f]{4})?)$/);
      if (match) {
        const points = match[1].split("-").map((hex) => parseInt(hex, 16));
        const [low, high] = id.startsWith("h-") ? [0x3041, 0x3096] : [0x30a1, 0x30fa];
        if (points.every((point) => point >= low && point <= high)) return String.fromCodePoint(...points);
      }
      return `第 ${number} 題`;
    });
  }
  function result(course, saved) {
    const score = saved.lastResult, active = peekAttempt(course.id);
    const retries = retryLabels({ courseId: course.id, courseRevision: active.courseRevision, questionIds: active.order.map(q => active.questionIds[q]), retryQuestions: active.order.flatMap((q, index) => active.first[q] === false ? [index + 1] : []) });
    // The way back comes first; the next group and a fresh round are the quieter choices (#82).
    const next = nextCourse(course.id), [exit, exitLabel] = exitTo(backHash(course));
    return `<section class="study-card study-result"><h2>${score && score.firstCorrect === score.total ? "全部答對" : "練習完成"}</h2>${score ? `<p>第一次答對 <strong>${score.firstCorrect} / ${score.total}</strong> 題</p>` : ""}${retries.length ? `<p class="study-note">第一次答錯：${retries.map(escape).join("、")}</p>` : ""}<p class="reading-label">${saved.completedAt ? `完成於 ${escape(new Date(saved.completedAt).toLocaleDateString("zh-TW"))}` : ""}</p><div class="study-nav"><a class="primary" href="${exit}">${exitLabel}</a>${next ? `<button class="text-button" data-action="study-open" data-course="${next}">${courses[next].type === "kana" ? `下一組：${escape(courses[next].row)}` : `下一課：${escape(courses[next].title)}`}</button>` : ""}<button class="text-button" data-action="study-restart">重新練習</button></div></section>`;
  }
  function updateAnswer(course, active) {
    const q = active.order[active.cursor];
    paintAnswer(course.type === "kana" ? q : course.questions[q].answer, active.solved[q] === true, active.wrong, answerFeedback(course, active), lookBack(course, active));
  }
  function paintAnswer(correct, solved, wrongChoice, feedbackText, lookHtml) {
    for (const node of document.querySelectorAll('[data-action="study-answer"]')) {
      const choice = Number(node.dataset.choice), right = solved && choice === correct, wrong = !solved && choice === wrongChoice;
      node.classList.toggle("correct", right); node.classList.toggle("wrong", wrong);
      node.setAttribute("aria-disabled", String(solved)); node.setAttribute("tabindex", solved ? "-1" : "0");
      const mark = node.querySelector('.answer-status');
      if (mark) mark.textContent = right ? " ✓ 答對了" : wrong ? " ✕ 再試一次" : "";
    }
    const feedback = document.querySelector('.study-feedback');
    if (feedback) {
      feedback.textContent = feedbackText;
      feedback.classList.toggle('wrong', !solved);
      const bounds = feedback.getBoundingClientRect?.();
      if (!bounds || bounds.top < 0 || bounds.bottom > window.innerHeight) feedback.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
    }
    const slot = document.querySelector('.look-back-slot');
    if (slot && !(lookHtml && slot.firstElementChild)) slot.innerHTML = lookHtml;
    const next = document.querySelector('[data-action="study-next"]');
    if (next) { next.disabled = !solved; if (solved) next.focus({ preventScroll: true }); }
  }
  function coursePage(course) {
    const saved = courseState(course.id);
    const active = peekAttempt(course.id) || draftAttempt(course, saved);
    return wrap(`<h1 class="focus-heading" tabindex="-1">${escape(course.title)}</h1>${active.phase === "done" ? result(course, saved) : active.phase === "quiz" ? quiz(course, active) : card(course, active)}<div class="lesson-utilities"><button class="text-button" data-action="feedback">這一頁有問題？</button></div>`, ...exitTo(backHash(course)));
  }
  function render(hash) {
    // The opened search result gets focus only when coming back from the travel cards, not on a later visit.
    if (!hash.startsWith("#travel")) travelReturn = null;
    if (hash === "#kana") return kanaPage();
    if (hash === "#kana-review") return reviewPage();
    if (hash === "#kana-random") return randomPage();
    if (hash === "#grammar-random") return grammarRandomPage();
    if (hash === "#grammar") return grammarPage();
    if (hash === "#grammar-review") return grammarReviewPage();
    if (hash === "#settings") return settingsPage();
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
  // The speaker being played shows a ring; nothing is written while audio plays normally.
  function stopPlaying() {
    playingButton?.classList?.toggle?.("playing", false);
    playingButton = null;
  }
  function clearAudioRequest() {
    audioGeneration++;
    stopPlaying();
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
  function speak(course, index, selector = ".study-audio-status", full = false, button = null) {
    say(course.type === "kana" ? ({ "を": "お", "は": "ハ", "へ": "ヘ" }[course.spoken[index]] || course.spoken[index]) : (full && course.steps[index].polite ? course.steps[index].politeSpeech || course.steps[index].polite : course.steps[index].speech || course.steps[index].example).replace(/\s*／\s*/g, "、"), selector, button);
  }
  function say(spoken, selector, button) {
    const waiting = audioTimer !== null;
    clearAudioRequest();
    const generation = audioGeneration;
    const status = text => {
      if (generation !== audioGeneration) return;
      const node = document.querySelector(selector);
      if (node) node.textContent = text;
    };
    const failed = () => status("這次沒有播放成功，可以再按一次，或先看讀音。");
    try {
      const synth = window.speechSynthesis;
      const voice = synth ? pickVoice(synth.getVoices()) : null;
      if (!synth || typeof SpeechSynthesisUtterance === "undefined" || !voice) {
        status("目前無法播放日文讀音，可以先看讀音。");
        if (synth?.addEventListener) {
          const callback = () => {
            if (generation !== audioGeneration) return;
            voiceListener = null;
            try { if (pickVoice(synth.getVoices())) status("日文讀音準備好了，可以再按一次。"); } catch { failed(); }
          };
          voiceListener = { synth, callback }; synth.addEventListener('voiceschanged', callback, { once: true });
        }
        return;
      }
      const utterance = new SpeechSynthesisUtterance(spoken);
      utterance.voice = voice; utterance.lang = "ja-JP"; utterance.rate = speechRate();
      // Hints under any speaker go as soon as audio can play.
      for (const node of document.querySelectorAll(".study-audio-status")) node.textContent = "";
      status("");
      utterance.onstart = () => { if (generation !== audioGeneration) return; playingButton = button; button?.classList?.toggle?.("playing", true); };
      utterance.onend = () => { if (generation === audioGeneration) stopPlaying(); };
      utterance.onerror = () => { if (generation === audioGeneration) stopPlaying(); failed(); };
      const play = () => {
        if (generation !== audioGeneration) return;
        audioTimer = null;
        try { synth.speak(utterance); } catch { failed(); }
      };
      if (waiting || synth.speaking || synth.pending) {
        if (synth.speaking || synth.pending) synth.cancel();
        audioTimer = setTimeout(play, 130);
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
    if (action === "study-rate") {
      const rate = Number(button.dataset.rate);
      if ([0.65,0.8,1].includes(rate) && api.savePreferences?.({...preferences(),ttsRate:rate})) { stopAudio(); redraw(`[data-rate="${rate}"]`); }
      return true;
    }
    // A search result opens its situation with that card in view; clearing puts the cursor back in the box.
    if (action === "study-travel-open") {
      const item = travelItem(button.dataset.situation);
      if (item?.steps.some((step) => step.id === button.dataset.step)) { travelFound = travelReturn = button.dataset.step; api.go(`#travel/${item.id}`); }
      return true;
    }
    if (action === "study-travel-clear") { travelQuery = ""; if (location.hash === "#travel") redraw("#travel-search"); return true; }
    if (action === "study-favorite") {
      const id = button.dataset.phrase;
      if (!location.hash.startsWith("#travel/") || !PHRASEBOOK.some(item => item.steps.some(step => step.id === id))) return true;
      const wasSaved = favoriteIds().includes(id), next = wasSaved ? favoriteIds().filter(value => value !== id) : [...favoriteIds(),id];
      if (api.saveFavorites?.(next)) {
        // The list is drawn again, so a phrase playing from it stops instead of losing its speaker.
        if (location.hash === "#travel/favorites") { stopAudio(); redraw(); }
        else { button.textContent = wasSaved ? "收藏" : "已收藏"; button.setAttribute?.("aria-pressed",String(!wasSaved)); }
      }
      return true;
    }
    if (action === "study-travel-audio") {
      const item = location.hash === "#travel/favorites" ? travelItem(button.dataset.course) : location.hash.startsWith("#travel/") ? travelItem(location.hash.slice(8)) : null;
      const index = Number(button.dataset.index);
      const full = button.dataset.full !== "0" && Boolean(item?.steps?.[index]?.polite);
      if (item && item.id === button.dataset.course && Number.isInteger(index) && index >= 0 && index < item.steps.length) speak(item, index, `[data-audio-for="${item.id}-${index}${full ? "-full" : ""}"]`, full, button);
      return true;
    }
    if (action === 'study-review-start') {
      if(state().reviewSession&&state().reviewSession.round!=='done'){api.go('#kana-review');return true;}
      const ids=KanaPractice.selectReview(state().kanaReview,state().courses);
      if(ids.length){state().reviewSession=KanaPractice.create(ids,{completedIds:completedKanaIds(),mode:'review'});save();api.go('#kana-review');}
      return true;
    }
    // A new random round starts from home every time; on the page itself, answers mark in place and 下一題 moves on.
    if (action === "study-kana-random") { randomRound = newRandomRound(); if (location.hash === "#kana-random") redraw(); else api.go("#kana-random"); return true; }
    if (location.hash === "#kana-random" && ["study-answer", "study-next", "study-random-again"].includes(action)) {
      if (action === "study-random-again") { randomRound = newRandomRound(); redraw(); return true; }
      const round = randomRound;
      if (!round || round.done) return true;
      if (action === "study-answer") {
        const choice = Number(button.dataset.choice);
        const q = round.items[round.cursor];
        if (round.answers[round.cursor] === undefined && Number.isInteger(choice) && q.options[choice]) { round.answers[round.cursor] = choice; paintChoice(choice, q.options.indexOf(q.id), randomFeedback(round)); }
      } else if (round.answers[round.cursor] !== undefined) {
        if (round.cursor + 1 < round.items.length) round.cursor++; else round.done = true;
        redraw();
      }
      return true;
    }
    if (action === "study-grammar-random") { grammarRandomRound = newGrammarRandomRound(); if (location.hash === "#grammar-random") redraw(); else api.go("#grammar-random"); return true; }
    if (location.hash === "#grammar-random" && ["study-answer", "study-next", "study-grammar-random-again"].includes(action)) {
      if (action === "study-grammar-random-again") { grammarRandomRound = newGrammarRandomRound(); redraw(); return true; }
      const round = grammarRandomRound;
      if (!round || round.done) return true;
      if (action === "study-answer") {
        const choice = Number(button.dataset.choice), { item, question } = grammarRandomItem(round);
        if (round.answers[round.cursor] === undefined && item.options.includes(choice)) { round.answers[round.cursor] = choice; paintChoice(choice, question.answer, grammarRandomFeedback(round)); }
      } else if (round.answers[round.cursor] !== undefined) {
        if (round.cursor + 1 < round.items.length) round.cursor++; else round.done = true;
        redraw();
      }
      return true;
    }
    // The review page owns only answer and next; study-open, study-script and the like go to the handlers below.
    if(location.hash==='#kana-review'&&(action==='study-answer'||action==='study-next')){
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
    if (action === "study-grammar-review") {
      if (grammarRound() && !grammarRound().done) { api.go("#grammar-review"); return true; }
      if (startGrammarRound()) { if (location.hash === "#grammar-review") redraw(); else api.go("#grammar-review"); }
      return true;
    }
    if (location.hash === "#grammar-review") {
      const round = grammarRound();
      if (!round || round.done) return true;
      const { item, question } = reviewItem(round);
      if (action === "study-answer") {
        const choice = Number(button.dataset.choice);
        if (round.solved[round.cursor] || !item.options.includes(choice)) return true;
        const correct = choice === question.answer;
        if (round.first[round.cursor] === undefined) {
          round.first[round.cursor] = correct;
          rememberGrammar(courses[item.courseId], question, correct);
        }
        if (correct) { round.solved[round.cursor] = true; round.wrong = null; } else round.wrong = choice;
        save();
        paintAnswer(question.answer, correct, round.wrong, grammarReviewFeedback(round), grammarReviewLook(round));
      } else if (action === "study-next" && round.solved[round.cursor]) {
        if (round.cursor === round.items.length - 1) round.done = true;
        else { round.cursor++; round.wrong = null; }
        save(); redraw();
      }
      return true;
    }
    const course = courses[currentId()];
    if (!course) return true;
    const saved = courseState(course.id);
    const active = peekAttempt(course.id);
    if (!active) return true;
    if (action === "study-audio") {
      const index = Number(button.dataset.index);
      if (active.phase === "cards" && (course.type === "kana" || course.type === "grammar") && Number.isInteger(index) && index >= 0 && index < cards(course)) speak(course, index, ".study-audio-status", false, button);
      return true;
    }
    if (action === "study-word-audio") {
      const letter = course.type === "kana" && active.phase === "cards" ? course.letters[active.cursor] : null;
      const example = letter && letter === button.dataset.letter && typeof KanaHints !== "undefined" ? KanaHints.get(letter).find((hint) => hint.word) : null;
      if (example) say(example.word, '[data-audio-for="hint-word"]', button);
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
    else if (action === "study-look" && active.phase === "quiz" && course.type === "grammar") {
      const index = Number(button.dataset.card);
      if (!Number.isInteger(index) || index < 0 || index >= cards(course)) return true;
      active.phase = "cards"; active.cursor = index; active.wrong = null;
    }
    else if (action === "study-resume" && active.phase === "cards" && course.type === "grammar" && Object.keys(active.first).length) {
      active.phase = "quiz";
      const next = active.order.findIndex((q) => !active.solved[q]);
      active.cursor = next === -1 ? size(course) - 1 : next;
    }
    else if (action === "study-answer" && active.phase === "quiz") {
      const q = active.order[active.cursor];
      const choice = Number(button.dataset.choice);
      if (active.solved[q] || !active.options[q].includes(choice)) return true;
      const correct = choice === (course.type === "kana" ? q : course.questions[q].answer);
      if (active.first[q] === undefined) {
        active.first[q] = correct;
        if (GRAMMAR.some(c => c.id === course.id)) rememberGrammar(course, course.questions[q], correct);
      }
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
    if (hash === "#kana") return "五十音表";
    if (hash === "#grammar-random") return grammarRandomRound ? grammarRandomRound.done ? "句型隨機練習・結果" : `句型隨機練習・第 ${grammarRandomRound.cursor + 1} 題` : "句型隨機練習";
    if (hash === "#kana-random") return randomRound ? randomRound.done ? "五十音隨機練習・結果" : `五十音隨機練習・第 ${randomRound.cursor + 1} 題` : "五十音隨機練習";
    if (hash === "#kana-review") return state().reviewSession?.round==='done'?'五十音複習・完成頁':`五十音複習${state().reviewSession?`・${state().reviewSession.round==='retry'?'再試一次':'練習'}第 ${state().reviewSession.cursor+1} 步`:''}`;
    if (hash === "#settings") return "學習設定";
    if (hash === "#travel/favorites") return "我的常用語";
    if (hash === "#grammar") return "基礎句型";
    if (hash === "#grammar-review") { const round = grammarRound(); return round ? round.done ? "句型小複習・完成頁" : `句型小複習・第 ${round.cursor + 1} 題・${reviewItem(round).course.title}` : "句型小複習"; }
    if (hash === "#travel") return "旅遊常用語列表";
    if (hash.startsWith("#travel/")) return travelItem(hash.slice(8)) ? `旅遊常用語・${travelItem(hash.slice(8)).title}` : null;
    const course = courses[hash.slice(7)];
    if (!hash.startsWith("#study/") || !course) return null;
    const active = peekAttempt(course.id);
    if(course.type==='kana'&&active?.phase==='quiz'&&active.practice.round==='retry')return `${course.title}・再試一次第 ${active.practice.cursor+1} 步`;
    return `${course.title}${active ? active.phase === "done" ? "・完成頁" : `・${active.phase === "cards" ? "認識" : "練習"}第 ${active.cursor + 1} 步` : ""}`;
  }
  return { sanitize, bind, render, handle, context, stopAudio, searchTravel, title, travelTitle, total, retryLabels, nextCourse, hasProgress, currentAttempt, reviewSummary, clearReview, currentPractice, currentReview, grammarNext, grammarUnits, dashboardSummary };
})();
