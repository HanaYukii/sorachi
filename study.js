"use strict";

// Beginner courses share one small, browser-local state. No account is required.
const Study = (() => {
  const GRAMMAR = Content.grammar;
  const drillPool = Drill.pool(GRAMMAR, DrillBank.questions);
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
  // The same date check as KanaPractice, so kana and grammar dates compare with reviewClearedAt alike.
  const iso = KanaPractice.iso;
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
    const state = { photoWalk: PhotoWalk.restore(saved?.photoWalk), suitcase: Suitcase.restore(saved?.suitcase), cafe: Cafe.restore(saved?.cafe), crossword: Crossword.restore(saved?.crossword), drill: Drill.restore(saved?.drill, drillPool), script: saved?.script === "k" ? "k" : "h", courses: {}, kanaReview: KanaPractice.sanitizeReview(saved?.kanaReview), reviewSession: null, reviewClearedAt: iso(saved?.reviewClearedAt), grammarReview: {}, grammarReviewSession: null, lastGrammarId: null };
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
  const currentId = () => Routes.current().startsWith("#study/") ? Routes.current().slice(7) : null;
  // Special-sound lessons are grammar-style courses that belong with the kana.
  const kanaArea = (course) => course.type === "kana" || course.home === "kana";
  const backHash = (course) => kanaArea(course) ? "#kana" : "#grammar";
  const footer = () => api.footer ? api.footer() : "";
  const warning = () => api.warning ? api.warning() : "";
  const wasEarlierDay = (date) => date && new Date(date).toDateString() !== new Date().toDateString();
  // 回 leads back to where a lesson or review was opened (#82): home, or else its own list, also for a direct link.
  const exitTo = (list) => api.from?.() === "#home" ? ["#home", "回首頁"] : list === "#kana" ? ["#kana", "回五十音表"] : ["#grammar", "回基礎句型"];
  function wrap(content, destination = "#home", label = "回首頁", wide = false, pageClass = "") {
    return `<div class="lesson-shell${wide ? " lesson-wide" : ""}${pageClass ? ` ${pageClass}` : ""}">${Navigation.header(Routes.current(), destination, label)}<main id="main" tabindex="-1" class="study-main">${content}${warning()}</main>${footer()}</div>`;
  }
  function status(id) {
    const saved = state().courses[id];
    if (hasProgress(id) && peekAttempt(id).phase !== "done") return "接著學";
    if (saved?.completedAt) return "已完成・可再練";
    return "開始";
  }
  // These are grouped lesson entries, not vowel-column tables or individual character buttons.
  const kanaCells = (course) => `<span class="kana-cells" data-count="${course.letters.length}">${course.letters.map((letter, i) => `<span class="kana-cell"><span lang="ja">${escape(letter)}</span><span class="kana-roman">${escape(course.readings[i])}</span></span>`).join("")}</span>`;
  // Explicit teaching scope: a course topic is not necessarily the current card's sentence type.
  const focusText = (focus, prefix = "") => `<span class="focus-label">${escape(prefix + focus[0])}</span><span>${japaneseRuns(focus[1])}</span>`;
  function row(course) {
    const learned = state().courses[course.id];
    if (course.type === "kana") {
      const name = course.row.endsWith("行") ? `${course.letters[0]}行` : course.letters.join("・");
      const progress = status(course.id) === "開始" ? "學這組" : status(course.id);
      return `<button class="course-row" data-action="study-open" data-course="${course.id}"><span class="kana-row-heading"><strong lang="ja">${escape(name)}</strong><span class="course-state">${progress}${learned?.lastResult && learned.lastResult.firstCorrect === learned.lastResult.total ? " · 上次全對" : ""}<span aria-hidden="true"> →</span></span></span>${kanaCells(course)}</button>`;
    }
    const focus = Content.lessonPresentation[course.id]?.focus;
    const name = `<strong>${japaneseRuns(focus ? course.title : Content.displayTitle(course.id))}</strong>`;
    return `<button class="course-row" data-action="study-open" data-course="${course.id}"><span>${name}<span class="course-subtitle"${course.home === "kana" ? ' lang="ja"' : ""}>${focus ? `<span class="course-topic">${focusText([focus[0] === "文法" ? "用法" : "單字", Content.displayTitle(course.id)])}</span>` : escape(course.subtitle || `一個句型 · ${size(course)} 題練習`)}</span></span><span class="course-state">${status(course.id)}${learned?.lastResult && learned.lastResult.firstCorrect === learned.lastResult.total ? " · 上次全對" : ""}</span></button>`;
  }
  const kanaRows = (script, group) => Content.rowGroups[group].map((key) => courses[`${script}-${key}`]).filter(Boolean);
  function reviewSummary() {
    const data = state();
    // Same order as KanaPractice.selectReview, so the listed characters are the ones the next round practices.
    const wrong = KanaPractice.entries.filter(item => data.kanaReview[item.id]?.wrong).sort((a,b)=>data.kanaReview[a.id].lastSeen.localeCompare(data.kanaReview[b.id].lastSeen)||a.id.localeCompare(b.id));
    const availableCount = KanaPractice.entries.filter(item => data.kanaReview[item.id] || data.courses[item.courseId]?.completedAt).length;
    return {wrongCount:wrong.length,availableCount,wrongLabels:wrong.slice(0,5).map(item=>`${item.character}（${item.reading}）`),canResume:Boolean(data.reviewSession && data.reviewSession.round!=='done'),hasData:Boolean(data.drill.session) || Object.keys(data.kanaReview).length>0 || Boolean(data.reviewSession) || Object.keys(data.grammarReview).length>0 || Boolean(data.grammarReviewSession)};
  }
  // A clear is dated after the previous clear and after every answer and record this browser has dated, also when the
  // clock went back or two clears fall in one millisecond; otherwise a backup made before it looks newer and brings
  // ended rounds and mistakes back (#36). Dates iso() would drop are skipped, and the clear stays within LAST_DATE.
  function clearReview() {
    const data=state();
    data.drill=Drill.clear(data.drill);
    const dates=[data.reviewClearedAt,...Object.values(data.kanaReview).map(item=>item.lastSeen),...Object.values(data.grammarReview).map(item=>item.lastSeen),...(api.history?.()||[]).map(entry=>entry?.date)].map(date=>Date.parse(iso(date))).filter(Number.isFinite);
    data.kanaReview={}; data.reviewSession=null; data.grammarReview={}; data.grammarReviewSession=null; data.reviewClearedAt=new Date(Math.min(LAST_DATE,Math.max(Date.now(),...dates.map(time=>time+1)))).toISOString();
    for (const id of Object.keys(courses)) if(courses[id].type==='kana') {if(data.courses[id])data.courses[id].active=null;drafts.delete(id);}
  }
  function currentPractice() {
    if (Routes.current() === "#kana-random") {
      const q = randomRound && !randomRound.done ? randomRound.items[randomRound.cursor] : null;
      return q ? {courseId:KanaPractice.entry(q.id).courseId,questionId:q.id,direction:q.direction,round:"random",practiceVersion:KanaPractice.VERSION} : null;
    }
    const review=Routes.current()==='#kana-review';
    const course=review?null:courses[currentId()];
    const active=course?peekAttempt(course.id):null;
    const session=review?state().reviewSession:active?.phase==='quiz'?active.practice:null;
    const q=KanaPractice.current(session);
    return q?{courseId:KanaPractice.entry(q.id).courseId,questionId:q.id,direction:q.direction,round:session.round,practiceVersion:KanaPractice.VERSION}:null;
  }
  const wrongLine = summary => `答錯的字：${summary.wrongLabels.map(escape).join('、')}${summary.wrongCount>summary.wrongLabels.length?`（共 ${summary.wrongCount} 個）`:''}`;
  function reviewEntry() {
    const summary=reviewSummary();
    return summary.availableCount ? `<section class="study-review-entry"><div><h2>${summary.canResume?'還有一輪沒練完':'複習學過的字'}</h2>${summary.wrongLabels.length?`<p class="study-note">${wrongLine(summary)}</p>`:''}</div><a class="text-button" href="#kana-review">${summary.canResume?'繼續複習':`複習 ${Math.min(5,summary.availableCount)} 個字`}</a></section>`:'';
  }
  let crosswordMessage = "";
  let crosswordChecked = false;
  function crosswordPage() {
    const game = state().crossword || (state().crossword = Crossword.create());
    const board = Crossword.board(game.boardId), current = board.entries[game.entry];
    const mistakes = crosswordChecked ? Crossword.errors(game) : [];
    const directions = e => e.direction === "across" ? "橫向 →" : "直向 ↓";
    const entries = board.entries.map((e,i) => `<button class="crossword-clue" data-action="study-crossword-clue" data-entry="${i}" aria-pressed="${i===game.entry}"><strong>${e.number} · ${e.meaning}</strong><span>${directions(e)} · ${e.keys.length} 格</span></button>`).join("");
    const grid = Array.from({length:board.rows},(_,r)=>Array.from({length:board.cols},(_,c)=>{
      const key=`${r}-${c}`,cell=board.cells[key]; if(!cell)return '<span class="crossword-blank" aria-hidden="true"></span>';
      const starts=board.entries.filter(e=>e.keys[0]===key).map(e=>e.number).join("/");
      return `<button class="crossword-cell${current.keys.includes(key)?" in-word":""}${game.cell===key?" selected":""}${mistakes.includes(key)?" needs-fix":""}" data-action="study-crossword-cell" data-cell="${key}" aria-pressed="${game.cell===key}" aria-label="第 ${r+1} 列第 ${c+1} 格，${game.values[key]||"空格"}${mistakes.includes(key)?"，還要修改":""}"${game.done?" disabled":""}>${starts?`<small>${starts}</small>`:""}<span lang="ja">${escape(game.values[key]||"·")}</span></button>`;
    }).join("")).join("");
    const complete = game.done ? `<section class="crossword-complete"><h2>這盤完成了</h2><p>再看一次剛剛填的 3 個單字。${game.hints.length?`用了 ${game.hints.length} 格提示。`:""}</p>${board.entries.map(e=>`<div class="crossword-word"><div class="spoken-line"><strong lang="ja">${e.word}</strong>${inlineAudio(e.word)}</div><span>${e.reading} · ${e.meaning}</span></div>`).join("")}<button class="primary" data-action="study-crossword-next">再玩一盤 →</button></section>` : `<section class="crossword-controls" aria-label="選字與提示"><h2>${current.number} · ${current.meaning}</h2><p>${directions(current)}，共 ${current.keys.length} 格。點下面的字，填入有深色框的格子。</p><div class="crossword-hints">${inlineAudio(current.word)}<button class="text-button" data-action="study-crossword-roman" aria-expanded="${game.roman.includes(game.entry)}">${game.roman.includes(game.entry)?"收起羅馬音":"看羅馬音"}</button><button class="text-button" data-action="study-crossword-hint">提示一格</button></div>${game.roman.includes(game.entry)?`<p class="crossword-reading">${current.reading}</p>`:""}<div class="crossword-bank" role="group" aria-label="選一個平假名">${board.bank.map(letter=>`<button data-action="study-crossword-fill" data-letter="${letter}" lang="ja">${letter}</button>`).join("")}</div><div class="crossword-actions"><button class="text-button" data-action="study-crossword-erase">清掉這格</button><button class="primary" data-action="study-crossword-check">檢查答案</button></div></section>`;
    return wrap(`<h1 class="focus-heading" tabindex="-1">平假名小填字</h1><p class="study-note">看中文提示，點格子，再選平假名。交叉的格子是兩個詞共用的字。不會也沒關係，可以聽或看提示。</p><p class="reading-label">第 ${Crossword.boards.indexOf(board)+1} / ${Crossword.boards.length} 盤 · 每盤 3 個詞 · 不計成績</p><div class="crossword-layout"><section class="crossword-board" aria-label="填字盤面"><div class="crossword-grid" style="--cols:${board.cols}"><p class="crossword-current">${game.done?"全部填好了":`正在填：${current.number} · ${current.meaning}（${directions(current)}）`}</p>${grid}</div><div class="crossword-clues" aria-label="中文提示">${entries}</div></section>${complete}</div><p class="crossword-status" tabindex="-1" role="status" aria-live="polite">${escape(crosswordMessage)}</p><p class="study-note">會記住這一盤的進度。單字來自五十音的例子；這裡是選玩的練習，不影響課程成績。</p><div class="lesson-utilities"><button class="text-button" data-action="feedback">這一頁有問題？</button></div>`,"#games","回小遊戲",true,"crossword-page");
  }
  function crosswordAction(button) {
    if(Routes.current()!=="#crossword")return true;
    const game=state().crossword, action=button.dataset.action, board=Crossword.board(game.boardId);
    let selector='.crossword-status'; crosswordMessage="";
    if(action==='study-crossword-clue') { if(!Crossword.select(game,Number(button.dataset.entry)))return true; selector=`[data-action="study-crossword-clue"][data-entry="${game.entry}"]`; }
    else if(action==='study-crossword-cell') { const key=button.dataset.cell,cell=board.cells[key];if(!cell||game.done)return true; Crossword.select(game,cell.entries.includes(game.entry)?game.entry:cell.entries[0],key); selector=`[data-cell="${key}"]`; }
    else if(action==='study-crossword-fill') { if(!Crossword.fill(game,button.dataset.letter))return true; crosswordChecked=false; selector=`[data-cell="${game.cell}"]`; }
    else if(action==='study-crossword-erase') { if(game.done)return true; delete game.values[game.cell];game.hints=game.hints.filter(k=>k!==game.cell);crosswordChecked=false;selector=`[data-cell="${game.cell}"]`; }
    else if(action==='study-crossword-roman') { if(game.done)return true;game.roman=game.roman.includes(game.entry)?game.roman.filter(i=>i!==game.entry):[...game.roman,game.entry];selector='[data-action="study-crossword-roman"]'; }
    else if(action==='study-crossword-hint') { if(game.done)return true;crosswordMessage=Crossword.hint(game)?'已填好一格，可以繼續選字。':'這個詞已經填對了，試試其他提示。';crosswordChecked=false; }
    else if(action==='study-crossword-check') { crosswordChecked=true; const errors=Crossword.errors(game);game.done=!errors.length;crosswordMessage=game.done?'3 個詞都填對了！':`還有 ${errors.length} 格沒填好。橘框的格子可以再改，也可以用提示。`; }
    else if(action==='study-crossword-next' && game.done) { state().crossword=Crossword.create(Crossword.boards[(Crossword.boards.indexOf(board)+1)%Crossword.boards.length].id);crosswordChecked=false;selector='.focus-heading'; }
    else return true;
    stopAudio();save();redraw(selector);return true;
  }
  function kanaPage() {
    const script = state().script;
    const learnedBefore = Object.values(state().courses).some((c) => wasEarlierDay(c.completedAt));
    return wrap(`<h1 class="focus-heading" tabindex="-1">五十音表</h1>
      <p class="study-note">第一次學日文，先選「平假名」，從「あ行」開始。點一組字，先看字、聽讀音，再做練習。</p>
      <div class="script-tabs" role="group" aria-label="選擇假名種類"><button data-action="study-script" data-script="h" aria-pressed="${script === "h"}">平假名</button><button data-action="study-script" data-script="k" aria-pressed="${script === "k"}">片假名</button></div>
      <p class="study-note">${script === "h" ? "平假名用來寫許多日文詞語。" : "片假名常用來寫外來語，例如「コーヒー」（咖啡）。讀音和平假名對應，字形不同。"}每格下方的英文字母是羅馬音，幫你對照讀音。</p>
      ${readingHelp()}
      <div class="kana-practice-links">${reviewEntry()}<section class="study-review-entry"><div><h2>五十音隨機練習</h2><p class="study-note">基本平假名・5 題，不記成績。</p></div><button class="text-button" data-action="study-kana-random">練 5 題 →</button></section></div>
      <a class="course-row crossword-entry" href="#crossword"><span><strong>平假名小填字</strong><span class="reading-label">看中文、選假名。每盤 3 個基本單字，可以聽讀音或看提示。</span></span><span aria-hidden="true">→</span></a>
      <div class="kana-layout">
        <section class="kana-section kana-basic" aria-labelledby="kana-basic-heading"><h2 id="kana-basic-heading" class="course-list-heading">基本字</h2>${learnedBefore ? '<p class="study-note">可以重新測試之前練過的組別，確認是否還記得。</p>' : ""}<div class="course-list kana-chart">${kanaRows(script, "basic").map(row).join("")}</div></section>
        <section class="kana-section kana-voiced" aria-labelledby="kana-voiced-heading"><h2 id="kana-voiced-heading" class="course-list-heading">濁音・半濁音</h2><p class="study-note">右上加兩點或小圈，讀音就會改變。例如 か ka → が ga、は ha → ぱ pa。</p><div class="course-list kana-chart">${kanaRows(script, "voiced").map(row).join("")}</div></section>
        <section class="kana-section kana-sounds" aria-labelledby="kana-sounds-heading"><h2 id="kana-sounds-heading" class="course-list-heading">促音・長音</h2><p class="study-note">學過基本字後，再練「停一下」和「拉長音」。</p><div class="course-list">${Content.sounds.map(row).join("")}</div></section>
        <section class="kana-section kana-youon" aria-labelledby="kana-youon-heading"><h2 id="kana-youon-heading" class="course-list-heading">拗音</h2><p class="study-note">把兩個字合在一起念，例如 き＋小的 ゃ → きゃ（kya）。不要拆成 ki、ya 兩個音。</p><div class="course-list kana-chart">${kanaRows(script, "youon").map(row).join("")}</div></section>
      </div><p class="study-note">每種假名有 46 個基本字、25 個濁音・半濁音和 33 個拗音，可以一組一組學。</p>`, "#home", "回首頁", true, "kana-catalog");
  }
  function settingsPage() {
    return wrap(`<h1 class="focus-heading" tabindex="-1">學習設定</h1><section class="study-card"><h2>播放語速</h2><p class="study-note">五十音、句型與旅遊用語都會使用這個速度。</p><div class="script-tabs" role="group" aria-label="播放語速">${[[0.65,"慢速"],[0.8,"一般"],[1,"原速"]].map(([rate,label]) => `<button data-action="study-rate" data-rate="${rate}" aria-pressed="${speechRate() === rate}">${label}</button>`).join("")}</div><p class="study-note">設定存在這個瀏覽器。</p></section>`);
  }
  function readingHelp() {
    return `<details class="phrase-more reading-help"><summary>日文下方的英文字母怎麼看？</summary><p class="study-note">這是「羅馬字」（也常叫羅馬音），用英文字母提示日文讀音。例如 あ 是 a、か 是 ka。先對照字和讀音，不用照英文單字念；進入每組課程後，可以按喇叭跟著念。</p><p class="study-note">shi（し）、chi（ち）、tsu（つ）、fu（ふ）是常見的寫法，幾個英文字母合起來表示一個音。遇到不確定的讀音，就按喇叭聽。</p><p class="study-note">aa、ii、uu、ee、oo 表示把音拉長，例如 おばあさん obaasan（奶奶）的 aa 要念久一點。ou、ei 也常念成長音，例如 がくせい gakusei（學生）的「せい」通常把 e 拉長。學過基本字後，可以看「長音」課的例子。</p></details>`;
  }
  function grammarNext() {
    const unfinished = c => state().courses[c.id]?.active?.touched && state().courses[c.id].active.phase !== "done";
    const course = GRAMMAR.find(c => c.id === state().lastGrammarId && unfinished(c)) || GRAMMAR.find(unfinished) || GRAMMAR.find(c => !state().courses[c.id]?.completedAt);
    return course ? {courseId:course.id,title:Content.displayTitle(course.id),resume:Boolean(unfinished(course))} : null;
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
      return `<div class="unit-group"><button class="unit-random text-button" data-action="study-random-lesson" data-unit="${unit.lessons[0].id}" aria-label="${escape(unit.title)}：隨機進一課">隨機進一課 →</button><details class="unit-section"${unit.title === open ? " open" : ""}><summary><h2 class="unit-title">${escape(unit.title)}</h2><span class="unit-goal">${japaneseRuns(unit.goal)}</span><span class="unit-count">已完成 ${done} / ${unit.lessons.length} 課</span></summary><div class="course-list">${unit.lessons.map(row).join("")}</div></details></div>`;
    }).join("");
  }
  // The next lesson and the units come first, so a phone shows where to start; practice without a lesson follows.
  function grammarPage() {
    return wrap(`<h1 class="focus-heading" tabindex="-1">基礎句型</h1><div class="grammar-overview"><div><p class="study-note">第一次學，從「基本句子」的第一課開始。每課先看例子，再做幾題練習。還不熟五十音也能先看中文意思，按喇叭跟著念。</p></div>${grammarNextEntry()}</div>${grammarUnitList()}${grammarReviewEntry()}<section class="study-review-entry"><h2>句型隨機練習</h2><p class="study-note">入門句型・5 題，不用先學過，也不會記成績。</p><button class="text-button" data-action="study-grammar-random">練 5 題 →</button></section>`, "#home", "回首頁", true, "grammar-catalog");
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
    const random = Routes.current() === "#grammar-random", round = random ? grammarRandomRound : Routes.current() === "#drill" ? state().drill.session : Routes.current() === "#grammar-review" ? grammarRound() : null;
    if (!round || round.done) return null;
    const { course, question } = roundItem(round);
    return { courseId: course.id, questionId: question.id };
  }
  // The question on screen in a grammar review or random round.
  const roundItem = (round) => { const item = round.items[round.cursor], course = courses[item.courseId]; return { item, course, question: item.id ? drillPool.find(q=>q.id===item.id).question : course.questions[item.q] }; };
  function grammarFeedback(question, correct, retry = false) {
    if (correct) return `答對了。${question.explanation}`;
    const reading = question.readings?.[question.answer];
    return `正確答案：${question.options[question.answer]}${reading ? `（${reading}）` : ""}。${retry ? "請選一次正確答案，再繼續。" : ""}${question.explanation}`;
  }
  function showFeedback(text, wrong) {
    const feedback = document.querySelector('.study-feedback');
    if (!feedback) return;
    feedback.textContent = text;
    feedback.classList.toggle('wrong', wrong);
    const bounds = feedback.getBoundingClientRect?.();
    const nav = document.querySelector('.active-lesson .study-main > .study-nav')?.getBoundingClientRect?.();
    const visibleBottom = window.innerWidth <= 700 && nav ? nav.top : window.innerHeight;
    if (!bounds || bounds.top < 0 || bounds.bottom > visibleBottom) feedback.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
  }
  function grammarReviewFeedback(round) {
    const { question } = roundItem(round), solved = round.solved[round.cursor] === true;
    if (!solved && round.wrong === null) return "";
    return grammarFeedback(question, solved, true);
  }
  // After a wrong answer the explaining card opens in place, so the round never leaves this page.
  function grammarReviewLook(round) {
    const { course, question } = roundItem(round);
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
      body = `<section class="study-card study-result"><h2>複習完成</h2><p class="result-scope">這輪用來複習，不新增課程成績。</p><p class="result-score">第一次答對 <strong>${firstCorrect} / ${round.items.length}</strong> 題</p>${missed.length ? `<details class="result-lessons"><summary>回看相關課程（${missed.length}）</summary><ul class="review-lessons">${missed.map(id => `<li><button class="text-button" data-action="study-open" data-course="${id}">${escape(Content.displayTitle(id))} →</button></li>`).join("")}</ul></details>` : '<p class="study-note">這次都答對了。</p>'}${resultActions(exit, exitLabel, `<button class="text-button" data-action="study-grammar-review">再複習 ${reviewSize()} 題</button>`)}</section>`;
    } else if (round) {
      const { item, course, question } = roundItem(round), solved = round.solved[round.cursor] === true;
      body = `<p class="reading-label">複習 · ${round.cursor + 1} / ${round.items.length} · 選一個答案</p><section class="study-card study-quiz"><h2>${escape(question.prompt)}</h2>${question.promptReading ? `<p class="study-note">${escape(question.promptReading)}</p>` : ""}<div class="study-options" role="group" aria-label="答案選項">${item.options.map(choice => `<button class="answer${(solved || round.wrong !== null) && choice === question.answer ? " correct" : round.wrong === choice ? " wrong" : ""}" data-action="study-answer" data-choice="${choice}" aria-disabled="${solved}"${solved ? ' tabindex="-1"' : ""}>${question.readings ? `<span lang="ja">${escape(question.options[choice])}</span><span class="option-reading">${escape(question.readings[choice])}</span>` : escape(question.options[choice])}<span class="answer-status">${(solved || round.wrong !== null) && choice === question.answer ? (solved ? " ✓ 答對了" : " ✓ 正確答案") : round.wrong === choice ? " ✕ 再試一次" : ""}</span></button>`).join("")}</div><p class="study-feedback${!solved && round.wrong !== null ? " wrong" : ""}" role="status" aria-live="polite">${escape(grammarReviewFeedback(round))}</p><div class="look-back-slot">${grammarReviewLook(round)}</div></section><div class="study-nav"><button class="primary" data-action="study-next"${solved ? "" : " disabled"}>${round.cursor === round.items.length - 1 ? "完成複習" : "下一題 →"}</button></div>`;
    } else body = reviewSize() ? `<p>從完成的句型課挑 ${reviewSize()} 題混在一起練，最近答錯、還沒獨立答對的題目會優先出現。答錯時會顯示正確答案和說明，可以再選一次。</p><button class="primary" data-action="study-grammar-review">開始複習</button>` : '<p>先完成兩課句型，就可以在這裡複習。</p><a class="primary" href="#grammar">看基礎句型</a>';
    return wrap(`<h1 class="focus-heading" tabindex="-1">句型小複習</h1>${body}<p class="study-note">複習進度會保存在這個瀏覽器，下次可以接著練；不會改變各課的完成紀錄和成績。</p><div class="lesson-utilities"><button class="text-button" data-action="feedback">這一頁有問題？</button></div>`, exit, exitLabel);
  }
  // A card opened from a search result is marked, so it gets focus and comes into view.
  function staffLine(part, label) { return part ? `<p class="staff-asks"><span class="staff-asks-label">${label}</span><span class="spoken-line"><span lang="ja">${escape(part.example)}</span>${inlineAudio(part.example, part.speech || part.example)}</span><span class="staff-asks-reading">${escape(part.reading)}</span><span>${escape(part.meaning)}</span></p>` : ""; }
  function travelCard(item,step,index,found=false) { return `<section class="study-card travel-card${found ? " travel-found" : ""}"${found ? ' tabindex="-1"' : ""}><div class="travel-card-heading"><h2>${escape(step.title)}</h2><button class="text-button favorite-toggle" data-action="study-favorite" data-phrase="${step.id}" aria-pressed="${favoriteIds().includes(step.id)}" aria-label="${escape(step.title)}：收藏">${favoriteIds().includes(step.id) ? "已收藏" : "收藏"}</button></div>${keywordBox(step.keywords, step.id)}<div class="phrase-short"><h3 class="phrase-label">可以這樣說</h3><div class="spoken-line"><p lang="ja">${escape(step.example)}</p>${audioButton(item, index, true, false)}</div><p class="reading-label">${escape(step.reading)}</p><p>${escape(step.meaning)}</p></div>${staffLine(step.staffAsks, "對方可能會問")}${staffLine(step.staffSays, "對方可能會說")}<p class="study-note">${escape(step.body)}</p>${step.polite ? `<details class="phrase-more"><summary>看完整說法與讀音</summary><div class="spoken-line"><p lang="ja">${escape(step.polite)}</p>${audioButton(item, index, true, true)}</div><p class="reading-label">${escape(step.politeReading)}</p><p>${escape(step.politeMeaning)}</p></details>` : ""}${step.extra ? `<details class="phrase-more"><summary>${escape(step.extra.title)}</summary>${keywordBox(step.extra.keywords)}<div class="spoken-line"><p lang="ja">${escape(step.extra.example)}</p>${inlineAudio(step.extra.example, step.extra.speech || step.extra.example)}</div><p class="reading-label">${escape(step.extra.reading)}</p><p>${escape(step.extra.meaning)}</p><p class="study-note">${escape(step.extra.body)}</p></details>` : ""}</section>`; }
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
      return wrap(`<h1 class="focus-heading" tabindex="-1">旅遊常用語</h1><p class="study-note">依情境找需要的詞。先記關鍵字，配合指物或出示畫面，通常就能讓對方了解意思；需要時再看完整說法。</p>${readingHelp()}<div class="travel-search" role="search"><label for="travel-search">找詞或情境</label><input id="travel-search" type="search" value="${escape(travelQuery)}" placeholder="例如：結帳、Suica、寄放行李" autocomplete="off" enterkeyhint="search" maxlength="80"><p id="travel-status" class="visually-hidden" role="status" aria-live="polite"></p></div><div id="travel-results">${travelShown}</div><a class="course-row favorites-entry" href="#travel/favorites"><strong>我的常用語</strong><span class="favorites-count">${savedPhrases().length} 張收藏<span aria-hidden="true"> →</span></span></a>${Cafe.entry}${Suitcase.entry}${travelGroups()}`, "#home", "回首頁", true, "travel-catalog");
    }
    const item = travelItem(id), found = travelFound;
    travelFound = null;
    if (!item) return wrap('<h1 class="focus-heading" tabindex="-1">找不到這個情境</h1><a class="text-button" href="#travel">回旅遊常用語</a>');
    return wrap(`<h1 class="focus-heading" tabindex="-1">${escape(item.title)}</h1><p class="study-note">先看關鍵字與意思，需要時再展開例句。</p>${item.steps.map((step, index) => travelCard(item,step,index,step.id === found)).join("")}<div class="study-nav"><a class="text-button" href="#travel">← 換個情境</a>${item.id === "basics" ? "" : '<a class="text-button" href="#travel/basics">需要幫忙時</a>'}<button class="text-button" data-action="feedback">這一頁有問題？</button></div>`, "#travel", "回旅遊常用語");
  }
  // Travel search (#75): every card with what a traveller might type: its title, keywords with their readings and
  // meanings, the short and full phrases, what staff may ask and any extra part, each with romaji and meaning; and
  // each situation's title and Chinese line. Width, case, punctuation, katakana versus hiragana, 臺／台 and long vowels
  // in romaji (hoomu, homu, toukyou) are ignored, and a few everyday words lead to the ones the cards use. The query
  // lives only in this page: nothing is saved or sent.
  let travelQuery = "", travelFound = null, travelReturn = null, travelIndex = null, travelShown = null;
  // Spaces vanish, except between romaji words, which keep a boundary (rokkaa|doko); fields are joined by line breaks.
  // A long vowel and a doubled consonant (a small っ) fold too, so a beginner who misses either still finds the card
  // (roka, kipu); only a pair of consonants folds, so nonsense like zzzz stays nonsense.
  const fold = (text) => String(text).normalize("NFKC").toLowerCase().replace(/[|\n]/gu, "").replace(/臺/gu, "台").replace(/[ァ-ヶ]/gu, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60))
    .replace(/([a-z])[\s,.!?'’\-/]+(?=[a-z])/gu, "$1|").replace(/[\s・、。，,.!?！？「」『』（）()〜~'’\-／/]/gu, "").replace(/ou/gu, "o").replace(/([aiueo])\1+/gu, "$1").replace(/([b-df-hj-np-tv-z])\1/gu, "$1");
  // A term matches text as it is; romaji may also run across word boundaries when it starts a word, so chekkuin
  // finds chekku in and dokodesuka finds doko desu ka. Romaji never starts inside a word, so kaado misses rokkaa doko.
  // Only for terms of a realistic length: a pasted page of romaji would make the pattern too big to run.
  const matcher = (term) => {
    const letters = term.replace(/\|/gu, "");
    const loose = letters.length <= 60 && /^[a-z]+$/u.test(letters) ? new RegExp(`(?:^|[|\\n])${[...letters].join("\\|?")}`, "u") : null;
    return (text) => text.includes(term) || Boolean(loose?.test(text));
  };
  const TRAVEL_ALIASES = [["寄物櫃", "置物櫃"], ["寄物", "寄放"], ["寄行李", "寄放行李"], ["行李寄放", "寄放行李"], ["洗手間", "廁所"], ["化妝室", "廁所"], ["買單", "結帳"], ["埋單", "結帳"], ["會計", "会計"], ["付款", "付現", "結帳"], ["打包", "外帶"], ["儲值", "加值"], ["千円", "1000円"], ["交通卡", "交通ic卡"], ["icoca", "交通ic卡"], ["pasmo", "交通ic卡"], ["發票", "收據"], ["不用", "不需要"], ["不要", "不需要"], ["來回票", "來回"], ["關門", "營業"], ["打烊", "營業"],
    ["剪票口", "驗票閘門"], ["轉車", "轉乘"], ["換車", "轉乘"], ["劃位", "對號座"], ["熱飲", "熱的"], ["冰飲", "冰的"], ["大碗", "大份"], ["加大", "大份"], ["幾個人", "幾位"], ["兩位", "幾位"],
    ["帶走", "外帶"], ["開水", "水"], ["冰水", "水"], ["怎麼賣", "多少錢"], ["試衣間", "試穿"], ["塑膠袋", "袋子"], ["當天票", "當日票"], ["門票", "當日票"], ["現場票", "當日票"], ["服務生", "店員"],
    ["出去再進來", "再入場"], ["再進去", "再入場"], ["再進場", "再入場"], ["日文不好", "不太懂日文"], ["日語不好", "不太懂日文"], ["女廁", "廁所"], ["男廁", "廁所"], ["上小號", "廁所"], ["上大號", "廁所"], ["futari", "nanmeisama"], ["hitori", "nanmeisama"], ["ふたり", "何名様"], ["ひとり", "何名様"], ["兩個人", "幾位"], ["一個人", "幾位"], ["小號", "尺寸"], ["大號", "尺寸"], ["手洗い", "トイレ"], ["otearai", "toire"], ["tearai", "toire"], ["切符", "きっぷ"], ["開かない", "開きません"], ["開けられない", "開きません"], ["拿行李", "領回"], ["領行李", "領回"], ["取行李", "領回"], ["checkin", "chekkuin"], ["check in", "chekku in"], ["checkout", "chekkuauto"], ["check out", "chekku auto"]];
  const fields = (part) => part ? [part.title, ...(part.keywords || []).flat(), part.example, part.reading, part.meaning, part.polite, part.politeReading, part.politeMeaning].filter(Boolean).map(fold) : [];
  // The aliases are folded once; a term holding one also tries the words the cards use.
  let travelAliases = null;
  const aliasList = () => travelAliases ||= TRAVEL_ALIASES.map((words) => words.map(fold));
  const variants = (q) => [q, ...aliasList().filter(([alias]) => q.includes(alias)).flatMap(([alias, ...words]) => words.map((word) => q.replace(alias, word)))];
  // The words of a query, split at spaces and punctuation; a word mixing romaji with Chinese or kana is split where
  // they meet (suica加值).
  const queryWords = (query) => String(query).normalize("NFKC").split(/[\s、，,・。.！？!?／/]+/u).filter(Boolean);
  const splitScripts = (word) => word.replace(/([a-z])(?=[^\x00-\x7f])/giu, "$1 ").replace(/([^\x00-\x7f])(?=[a-z])/giu, "$1 ").split(" ");
  // Every two characters in a row of a Chinese or kana word (說出金額 → 說出, 出金, 金額).
  const pairs = (word) => { const chars = [...word]; return chars.slice(1).map((ch, i) => chars[i] + ch); };
  const isRomaji = (word) => /^[a-z|]+$/u.test(word);
  // Greetings, requests, question endings and "how do you say it in Japanese" say how to ask, not what about: around a
  // word they are trimmed off (袋ください → 袋, 我想要廁所 → 廁所, 謝謝的日文 → 謝謝), and on their own they only
  // order the list.
  const FILLER_LEAD = ["おはようございます", "おはよう", "すみません", "不好意思", "請問一下", "請問", "どうも", "我想要", "我要", "我想", "請給我", "給我", "幫我", "麻煩", "可以", "請", "有", "日文的", "日語的"];
  // 日文 alone is not trimmed off a phrase: in 不會日文 it is what the phrase is about.
  const FILLER_TAIL = ["をください", "ください", "をお願いします", "お願いします", "をおねがいします", "おねがいします", "はどこですか", "どこですか", "がありますか", "ありますか", "がほしいです", "ほしいです", "できますか", "ございます", "ございました", "ですか", "です", "可以嗎", "在哪裡", "在哪", "嗎", "呢", "吧", "啊", "を", "は", "が",
    "的日文怎麼說", "日文怎麼說", "的日語怎麼說", "日語怎麼說", "怎麼說", "的日文", "的日語", "的日本語", "是什麼意思", "什麼意思", "的意思"];
  // Particles, endings and "in Japanese" typed as words of their own carry nothing at all; the other fillers still
  // tell cards apart when nothing else does (不好意思 日文 → the 不好意思 card).
  const PARTICLES = ["wa", "ga", "o", "ni", "de", "mo", "no", "to", "e", "ka", "ne", "yo", "desu", "masu", "は", "が", "を", "に", "で", "も", "の", "と", "へ", "か", "です", "ますか", "ですか", "呢", "吧", "啊",
    "的日文怎麼說", "日文怎麼說", "怎麼說", "的日文", "日文", "日語", "日本語", "是什麼意思", "什麼意思", "的意思", "意思", "意味"];
  // Romaji typed in one run (kippukudasai) loses the same kind of words from its ends.
  const ROMAJI_LEAD = ["sumimasen", "domo"], ROMAJI_TAIL = ["onegaishimasu", "arimasuka", "arimasu", "kudasai", "desuka", "desu", "doko", "wa", "ga", "wo", "o", "de", "ni", "mo"];
  let fillers = null;
  const longestFirst = (list) => list.map(fold).sort((a, b) => b.length - a.length);
  const fillerWords = () => fillers ||= {
    lead: longestFirst(FILLER_LEAD), tail: longestFirst(FILLER_TAIL), particles: new Set(PARTICLES.map(fold)),
    romajiLead: longestFirst(ROMAJI_LEAD), romajiTail: longestFirst(ROMAJI_TAIL),
    words: new Set([...FILLER_LEAD, ...FILLER_TAIL, ...PARTICLES, ...ROMAJI_LEAD, ...ROMAJI_TAIL, "sumimasen", "kudasai", "onegaishimasu", "arimasu", "hoshii", "doko", "どこ", "謝謝", "ありがとう", "arigatou", "domo", "gozaimasu", "gozaimashita", "一下", "先", "好", "意味"].map(fold)),
  };
  // The word without its greetings and requests, taken off one at a time from the ends (endings first) until what is
  // left is a word some card holds (`stop`): 我要這個的日文 → 我要這個, not 這個. Also says where what is left starts,
  // so the two characters across a cut can be tried. A few steps at most: nobody types more.
  const trimFillers = (word, stop, romaji = false) => {
    const { lead, tail, romajiLead, romajiTail } = fillerWords(), parts = [];
    const [leads, tails] = romaji ? [romajiLead, romajiTail] : [lead, tail];
    // Kana still ending in a one-kana particle is not done yet: 袋は is held (袋はいりません), but 袋 is meant.
    const done = (rest) => stop(rest) && (romaji || [...rest].length < 2 || !tails.some((part) => /^[ぁ-ゖ]$/u.test(part) && rest.endsWith(part)));
    let start = 0;
    for (let step = 0; step < 8 && !done(word); step++) {
      // An ending that starts with 的 may leave the 的 when the word then is one a card holds (熱的日文 → 熱的).
      const ends = tails.filter((part) => word.length > part.length && word.endsWith(part)).flatMap((part) => part.startsWith("的") ? [part.slice(1), part] : [part]);
      const end = ends.find((part) => done(word.slice(0, -part.length))) || ends.find((part) => tails.includes(part));
      if (end) { word = word.slice(0, -end.length); parts.push(end); continue; }
      const front = leads.find((part) => word.length > part.length && word.startsWith(part));
      if (!front) break;
      word = word.slice(front.length); parts.push(front); start += front.length;
    }
    return { core: word, parts, start };
  };
  // Each keyword of a card on its own: the Japanese, its reading, romaji and every meaning (荷物, にもつ, nimotsu, 行李),
  // with romaji spaces left out (chekkuin is the keyword chekku in).
  const keywordParts = (step) => (step.keywords || []).flatMap(([word, romaji, meaning]) => [word.replace(/（.*?）/u, ""), (word.match(/（(.*?)）/u) || [])[1], romaji, ...meaning.split("／")]).filter(Boolean).map((part) => fold(part).replace(/\|/gu, ""));
  function travelMatches(query) {
    // A card's title and keywords say most about it; `exact` holds each keyword alone.
    travelIndex ||= PHRASEBOOK.flatMap((item) => item.steps.map((step) => ({ item, step, own: [...fields(step), ...fields(step.staffAsks), ...fields(step.staffSays), ...fields(step.extra)].join("\n"), title: fold(step.title), keys: (step.keywords || []).flat().map(fold).join("\n"), exact: new Set(keywordParts(step)), situation: [item.title, item.subtitle].filter(Boolean).map(fold).join("\n") })));
    const q = fold(query);
    if (!q) return [];
    // A word is tried with its aliases; each word's matchers are built once per search.
    const tried = new Map();
    const has = (text, word) => { if (!tried.has(word)) tried.set(word, variants(word).map(matcher)); return tried.get(word).some((match) => match(text)); };
    const held = (word) => travelIndex.some((entry) => has(entry.own, word) || has(entry.situation, word));
    // How much a word says about a card: one of its keywords (荷物 → the luggage card), in its title, in a keyword.
    // A keyword reached through an alias counts too (幾點check-in → the check-in card); one typed as it is only breaks
    // a tie (大人 ふたり → the day pass before 幾位).
    const literally = (entry, word) => entry.exact.has(word.replace(/\|/gu, "")), exactly = (entry, word) => variants(word).some((term) => entry.exact.has(term.replace(/\|/gu, "")));
    const standing = (entry, word, test = has) => exactly(entry, word) ? 3 : test(entry.title, word) ? 2 : test(entry.keys, word) ? 1 : 0;
    const words = [...new Set(queryWords(query).flatMap((token) => { const word = fold(token); return /[a-z]/u.test(word) && /[^\x00-\x7f]/u.test(word) ? splitScripts(token).map(fold) : [word]; }).filter(Boolean))];
    // What orders a list: the query's words and, for Chinese or kana, their pairs of characters.
    const pieces = [...new Set(words.flatMap((word) => isRomaji(word) ? [word] : [word, ...pairs(word)]))];
    const byOverlap = (list) => list.map((entry) => ({ entry, n: pieces.filter((piece) => has(entry.own, piece)).length })).sort((a, b) => b.n - a.n).map(({ entry }) => entry);
    // Cards whose own words match, the ones where the query is a keyword or in the title first (袋 → the bag card);
    // then every card of a situation whose name or line matches, when none of its own did, the cards sharing most of
    // the query first (退房 寄放 → the luggage card). One character is too little to name a situation (飯 of 飯店).
    const own = travelIndex.filter((entry) => has(entry.own, q)).map((entry) => ({ entry, n: standing(entry, q) })).sort((a, b) => b.n - a.n).map(({ entry }) => entry);
    // A category heading such as 交通 still lists its cards when a new card also contains that word.
    // Specific phrases (寄放行李) keep the narrower card match instead of opening the whole category.
    const named = [...q].length < 2 ? [] : travelIndex.filter((entry) => !own.includes(entry) && has(entry.situation, q) &&
      (!own.some((match) => match.item === entry.item) || q === fold(entry.item.title.split(/[：:]/u)[0])));
    if (own.length || named.length) return [...own, ...byOverlap(named)];
    // From here a romaji word of three letters or fewer must be a whole word (iku is not ikura, in is not genkin).
    const inText = (text, word) => /^[a-z]{1,3}$/u.test(word) ? new RegExp(`(?:^|[^a-z])${word}(?![a-z])`, "u").test(text) : has(text, word);
    const heldAsWord = (word) => travelIndex.some((entry) => inText(entry.own, word) || inText(entry.situation, word));
    // Words that never appear together. A Chinese or kana word no card or situation holds whole loses its greetings
    // and requests (袋ください → 袋, ください), down to what a card holds; a single character left must be a keyword of
    // some card (袋, 水, 駅), not just any character (那 of 那是什麼意思). What is still not held is tried two
    // characters at a time, aliases included (西瓜卡加值; 塑膠袋要錢 → 袋子). A place word of one character at its end
    // (駅 站 口 梯) is tried alone and with what follows (新宿駅|はどこですか → 駅, 駅は; 東京站|在哪 → 站在). In a
    // word of three or more characters, a last character that is a keyword few cards hold is tried alone when no card
    // holds it with the one before (一杯水 → 水; 開發票 stays 發票, not 票; 這樣就好 not 好). The character after a
    // request of one or two characters is tried with it only when a card holds the two together (我要這; not
    // 不好意思|打). A word none of whose pieces any card holds is about something not here (吹風機). Romaji typed in
    // one run loses particles and requests from its ends until a card holds what is left (kippukudasai → kippu).
    const fragments = new Set();
    let keywords = null;
    const settled = (word) => held(word) && ([...word].length > 1 || (keywords ||= new Set(travelIndex.flatMap((entry) => [...entry.exact]))).has(word));
    // Generic endings must not become topic words merely because the catalogue grows.
    const rare = (word) => !fillerWords().words.has(word) && travelIndex.filter((entry) => has(entry.own, word)).length <= travelIndex.length / 10;
    const expand = (word) => {
      // Keep a kana greeting whole: おはよう must not match the おは in おはし as the catalogue grows.
      if (held(word) || /^[ぁ-ゖ]+$/u.test(word) && fillerWords().words.has(word)) return [word];
      if (/[a-z]/u.test(word)) {
        const { core, parts } = trimFillers(word, held, true);
        return held(core) ? [core, ...parts] : [word];
      }
      const { core, parts, start } = trimFillers(word, settled);
      if (settled(core) || /^[ぁ-ゖ]+$/u.test(core) && fillerWords().words.has(core)) return [core, ...parts];
      // A lone character stays a word (傘 lists nothing, 冰 finds the drink card), except one a card holds left by
      // "what does it mean" or "in Japanese" (那是什麼意思, 我的日文).
      if ([...core].length === 1 && !/[駅站口梯]/u.test(core) && !(held(core) && parts.some((part) => /意思|怎麼說|日文|日語|日本語|意味/u.test(part)))) return [core, ...parts];
      const chars = [...word], from = [...word.slice(0, start)].length, to = from + [...core].length, last = chars[to - 1], place = /[駅站口梯]/u.test(last);
      // A pair already tries its own aliases (冰水 → 水); an alias longer than a pair adds the word it stands for, as
      // one word (塑膠袋要錢 → 袋子; ひとりいくら → 何名様 once, so the price card still leads).
      const forms = aliasList().filter(([alias]) => [...alias].length > 2 && core.includes(alias)).flatMap(([, ...words]) => words);
      const split = [...new Set([...pairs(core), ...forms])];
      const bits = [...([...core].length > 2 ? split : [...core].length === 2 || place ? [core] : []),
        ...((place || [...core].length > 2 && settled(last) && rare(last) && !held(chars[to - 2] + last)) && [...core].length > 1 ? [last] : []),
        ...(from > 0 && fillerWords().lead.some((lead) => [...lead].length <= 2 && word.slice(0, start).endsWith(lead) && held(lead + chars[from])) ? [chars[from - 1] + chars[from]] : []),
        ...(to < chars.length && place ? [last + chars[to]] : [])];
      bits.forEach((bit) => { if (bit !== core) fragments.add(bit); });
      return [...bits, ...([...core].length > 2 && !bits.some(held) ? [core] : []), ...parts];
    };
    const counted = [...new Set(words.flatMap(expand))];
    if (counted.length === 1 && counted[0] === q) return [];
    // A card is found by a topic word that few cards hold (in no more than one card in ten). Without one, every word
    // but particles counts, greetings and requests included, and just the cards holding the most of them are kept
    // (すみません これ ください → the これください card). Order: more found words, a word that is one of the card's
    // keywords (荷物 → the luggage card) or in its title, rarer words, keywords typed as they are, more of all the
    // words, then words in the card's situation (演唱會 飲料 → the concert's drink card).
    const reach = new Map(counted.map((word) => [word, travelIndex.filter((entry) => inText(entry.own, word)).length]));
    // A single romaji letter (the i of ii desu ka) says no more than a particle. Two characters cut from a longer word
    // are never particles, so the 日文 of 不會日文 still counts when nothing else does.
    const { words: fillerSet, particles } = fillerWords();
    const filler = (word) => fillerSet.has(word), bare = (word) => !fragments.has(word) && particles.has(word) || /^[a-z]$/u.test(word);
    const topics = counted.filter((word) => reach.get(word) && reach.get(word) <= travelIndex.length / 10 && !filler(word) && !bare(word));
    // A word the query names that no card or situation holds (吹風機) means it asks about something not here: with no
    // topic found, nothing is listed, rather than cards that only share its greetings.
    if (!topics.length && counted.some((word) => !fragments.has(word) && !filler(word) && !bare(word) && !reach.get(word) && !heldAsWord(word))) return [];
    // A word only a situation's name or line holds (可以叫店員嗎 → 叫店員) lists its cards, not those sharing the requests.
    const situational = travelIndex.filter((entry) => counted.some((word) => !reach.get(word) && !filler(word) && !bare(word) && [...word].length > 1 && inText(entry.situation, word)));
    if (!topics.length && situational.length) return byOverlap(situational);
    const keys = topics.length ? topics : counted.filter((word) => reach.get(word) && !bare(word));
    const weight = (list) => list.reduce((sum, word) => sum + 1 / reach.get(word), 0);
    let kept = travelIndex.map((entry) => {
      const found = keys.filter((word) => inText(entry.own, word));
      return { entry, found, head: found.reduce((sum, word) => sum + standing(entry, word, inText), 0), literal: found.filter((word) => literally(entry, word)).length, all: counted.filter((word) => inText(entry.own, word)).length, named: counted.filter((word) => inText(entry.situation, word)).length };
    }).filter(({ found }) => found.length);
    // A situation's name matching only one character (飯 of 飯店) lists nothing.
    if (!kept.length) return byOverlap(travelIndex.filter((entry) => counted.some((word) => [...word].length > 1 && inText(entry.situation, word))));
    if (!topics.length) { const most = Math.max(...kept.map(({ found }) => found.length)); kept = kept.filter(({ found }) => found.length === most); }
    return kept.sort((a, b) => b.found.length - a.found.length || b.head - a.head || weight(b.found) - weight(a.found) || b.literal - a.literal || b.all - a.all || b.named - a.named).map(({ entry }) => entry);
  }
  // The row of the card just looked at is marked, so coming back puts focus on it.
  function travelResults(back = null, found = travelMatches(travelQuery)) {
    if (!fold(travelQuery)) return "";
    if (!found.length) return `<section class="travel-results"><h2 tabindex="-1">找不到「${escape(travelQuery.trim())}」</h2><p class="study-note">換個說法試試，或從下面的情境找。</p><button class="text-button" data-action="study-travel-clear">清除搜尋</button></section>`;
    return `<section class="travel-results"><div class="travel-results-head"><h2 tabindex="-1">找到 ${found.length} 張卡</h2><button class="text-button" data-action="study-travel-clear">清除搜尋</button></div><ul class="dash-list">${found.map(({ item, step }) => `<li><button class="dash-row${step.id === back ? " return-focus" : ""}" data-action="study-travel-open" data-situation="${item.id}" data-step="${escape(step.id)}"><span class="dash-row-main"><strong>${escape(step.title)}</strong><span><span lang="ja">${escape(step.example)}</span>　${escape(step.meaning)}</span></span><span class="dash-row-meta">${escape(item.title.split("（")[0])}</span>${api.icons?.arrow || "→"}</button></li>`).join("")}</ul></section>`;
  }
  // Only the count is announced; the list itself is not a live region, so typing is not read out row by row.
  const travelStatus = (found) => !fold(travelQuery) ? "" : found.length ? `找到 ${found.length} 張卡` : "找不到符合的卡";
  // While a word is still being composed with an input method the results wait, so the composition is not broken;
  // a query that changes nothing redraws and announces nothing. One search serves the list and the count.
  function searchTravel(value, composing = false) {
    travelQuery = String(value || "");
    if (composing || Routes.current() !== "#travel") return;
    const found = travelMatches(travelQuery), html = travelResults(null, found);
    if (html === travelShown) return;
    travelShown = html;
    const results = document.querySelector("#travel-results"), status = document.querySelector("#travel-status");
    if (results) results.innerHTML = html;
    if (status) status.textContent = travelStatus(found);
  }
  // The travel list in a few groups, each with a plain Chinese line, so a situation is found without reading Japanese
  // (#79). A situation missing here still shows, in a last group.
  const TRAVEL_GROUPS = [
    { title: "隨時用得到", note: "叫人、聽不懂、東西不見", tone: "purple", ids: ["basics"] },
    { title: "吃飯與購物", note: "點餐、內用外帶、結帳、買東西", tone: "apricot", ids: ["t-order", "food", "dining", "t-pay", "shopping"] },
    { title: "搭車與找路", note: "買票、月台、加值、找廁所和置物櫃", tone: "aqua", ids: ["transit", "t-charge", "t-place"] },
    { title: "住宿與景點", note: "飯店、排隊、入場與活動", tone: "rose", ids: ["hotel", "lines", "live"] },
  ];
  // Words that show what a situation covers, picked by hand from its cards: a pair stays together (內用、外帶) and a
  // word written exactly like its Chinese meaning (出口) is left out; close ones such as 袋／袋子 stay. The Chinese
  // comes first: the Japanese is the thing to say once the situation is found.
  const TRAVEL_WORDS = {
    basics: ["すみません", "もう一度", "わかりません"],
    "t-order": ["ひとつ", "アイス", "大盛"],
    food: ["うどん", "おにぎり", "唐揚げ"],
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
  let audioLineId = 0;
  function inlineAudio(text, spoken = text) {
    const id = `line-${++audioLineId}`;
    return `<span class="inline-audio"><button class="audio-button" data-action="study-line-audio" data-spoken="${escape(spoken)}" data-status="${id}" aria-label="播放${escape(text)}的讀音">${speaker}</button><span class="study-audio-status study-note" data-audio-for="${id}" role="status" aria-live="polite"></span></span>`;
  }
  function audioButton(course, index, travel = false, full = false) {
    const step = course.steps?.[index];
    const text = course.type === "kana" ? course.letters[index] : full ? step.polite : step.example;
    return `<button class="audio-button" data-action="${travel ? "study-travel-audio" : "study-audio"}" data-course="${course.id}" data-index="${index}"${travel ? ` data-full="${full ? 1 : 0}"` : ""}>${speaker}<span class="visually-hidden">播放「<span lang="ja">${escape(text)}</span>」的讀音</span></button><p class="study-audio-status study-note" data-audio-for="${course.id}-${index}${full ? "-full" : ""}" role="status" aria-live="polite"></p>`;
  }
  function keywordBox(keywords, phrase = null) {
    // The kana reading in （） stays on one line so narrow screens do not split it.
    const word = (text) => { const at = text.indexOf("（"); return at < 0 ? escape(text) : `${escape(text.slice(0, at))}<span class="kw-kana">${escape(text.slice(at))}</span>`; };
    return `<div class="keyword-box"><h3>關鍵字</h3><dl>${keywords.map(([text, reading, meaning], index) => `<div><dt><strong lang="ja">${word(text)}</strong>${phrase ? `<button class="audio-button keyword-audio" data-action="study-food-audio" data-phrase="${phrase}" data-index="${index}" aria-label="播放${escape(text)}的讀音">${speaker}</button><p class="study-audio-status study-note" data-audio-for="${phrase}-${index}" role="status" aria-live="polite"></p>` : ""}${!phrase ? inlineAudio(text, text.match(/（(.*?)）/u)?.[1] || text) : ""}<span>${escape(reading)}</span></dt><dd>${escape(meaning)}</dd></div>`).join("")}</dl></div>`;
  }
  // One box with everything a kana has (#35): its kanji origin, how it differs from a kana easy to mix up, and an
  // example word to hear with the kana marked. Nothing to switch between; words are examples and never tested.
  // Every copy of the kana in the example is marked (みみ, バナナ); kana inside the Chinese is tagged Japanese for screen readers.
  const markKana = (word, letter) => word.split(letter).map(escape).join(`<mark>${escape(letter)}</mark>`);
  const japaneseRuns = (text) => escape(text).replace(/[ぁ-ゖァ-ヺー]+/gu, (run) => `<span lang="ja">${run}</span>`);
  function hintCard(course, index) {
    const letter = course.letters[index], hints = typeof KanaHints !== "undefined" ? KanaHints.get(letter) : [];
    if (!hints?.length) return "";
    const item = (hint) => `<div><dt>${escape(hint.label)}</dt><dd>${hint.word ? `<span class="spoken-line"><span class="hint-word" lang="ja">${markKana(hint.word, hint.match || letter)}</span><button class="audio-button" data-action="study-word-audio" data-letter="${escape(letter)}">${speaker}<span class="visually-hidden">播放「<span lang="ja">${escape(hint.word)}</span>」的讀音</span></button></span><span class="hint-roman">${escape(hint.romaji)}</span><span>${escape(hint.meaning)}</span>${hint.match && hint.match !== letter ? `<span class="hint-script-note">同音：<span lang="ja">${escape(letter)} ＝ ${escape(hint.match)}</span></span>` : ""}` : japaneseRuns(hint.text)}</dd></div>`;
    return `<aside class="kana-hint"><p class="hint-title">記憶提示</p><dl class="hint-list">${hints.map(item).join("")}</dl>${hints.some((hint) => hint.word) ? '<p class="study-audio-status study-note" data-audio-for="hint-word" role="status" aria-live="polite"></p>' : ""}${KanaHints.notice && hints.some((hint) => hint.label === "字源" || hint.word) ? `<details><summary>關於記憶提示</summary><p class="study-note">${escape(KanaHints.notice)}</p></details>` : ""}</aside>`;
  }
  const sameSoundNote = { "ぢ": "ぢ 和 じ 同音，都讀 ji；一般多寫 じ。", "づ": "づ 和 ず 同音，都讀 zu；一般多寫 ず。", "ヂ": "ヂ 和 ジ 同音，都讀 ji；一般多寫 ジ。", "ヅ": "ヅ 和 ズ 同音，都讀 zu；一般多寫 ズ。" };
  function lessonJapanese(course, text) {
    const tokens = Content.lessonPresentation[course.id]?.writing?.[text];
    if (!tokens) return escape(text);
    return `<span class="with-furigana">${tokens.map(token => typeof token === "string" ? escape(token) : `<ruby>${escape(token[0])}<rp>（</rp><rt>${escape(token[1])}</rt><rp>）</rp></ruby>`).join("")}</span>`;
  }
  function fullExample(course, step) {
    if (step.example.includes("／")) {
      const written = lessonJapanese(course, step.example).replace(/^<span class="with-furigana">/, "").replace(/<\/span>$/, "").split(/\s*／\s*/);
      const spoken = (step.speech || step.example).split(/\s*／\s*/);
      const readings = (step.reading || "").split(/\s*\/\s*/);
      return step.example.split(/\s*／\s*/).map((text, i) => `<div class="spoken-line"><p class="grammar-example" lang="ja">${written[i]}</p>${inlineAudio(text, spoken.length === step.example.split("／").length ? spoken[i] : text)}</div>${readings[i] ? `<p class="example-reading">${escape(readings[i])}</p>` : ""}`).join("");
    }
    return `<div class="spoken-line"><p class="grammar-example" lang="ja">${lessonJapanese(course, step.example)}</p>${audioButton(course, course.steps.indexOf(step))}</div>${step.reading ? `<p class="example-reading">${escape(step.reading)}</p>` : ""}`;
  }
  function spokenPart(course, word, reading) {
    const segments = word.split(/\s*→\s*/);
    const written = lessonJapanese(course, word).replace(/^<span class="with-furigana">/, "").replace(/<\/span>$/, "").split(/\s*→\s*/);
    return segments.map((text, i) => `<div class="spoken-line"><span lang="ja">${written[i]}</span>${inlineAudio(text, text === "は" && reading === "wa" ? "わ" : text === "へ" && reading === "e" ? "え" : text === "を" ? "お" : text)}</div>`).join('<span class="form-arrow" aria-label="変化">→</span>');
  }
  const exampleLabels = { words: "單字與意思", phrase: "短語與意思", forms: "動詞變化對照", mixed: "短語與例句", usage: "用法整理" };
  function lessonExample(course, step, kind) {
    const parts = Content.lessonPresentation[course.id]?.parts?.[step.id];
    if (!parts) return fullExample(course, step);
    const pairedList = kind === "words" || kind === "forms";
    const guide = kind === "words" ? "日文搭配讀音與中文意思。" : kind === "forms" ? "每列是一組說法，下面是讀音和意思。" : "分開看：每組依序是日文、讀音和意思。";
    return `${pairedList ? "" : fullExample(course, step)}<p class="example-guide">${guide}</p><div class="example-parts${kind === "forms" ? " example-rows" : kind === "words" ? " example-words" : ""}">${parts.map(([word, reading, meaning]) => `<div class="example-part">${spokenPart(course, word, reading)}<span class="example-reading">${escape(reading)}</span><span class="part-meaning">${escape(meaning)}</span></div>`).join("")}</div>`;
  }
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
      // A lesson card: the example, its reading and meaning, and the explanation (travel-only parts are rejected by
      // Content.validate, so there is nothing else to show).
      const step = course.steps[i];
      const presentation = Content.lessonPresentation[course.id];
      const kind = presentation?.kinds?.[step.id];
      const label = exampleLabels[kind] || "例句與意思";
      const pairedList = (kind === "words" || kind === "forms") && presentation?.parts?.[step.id];
      const note = presentation?.notes?.[step.id];
      const previewIndex = course.steps.findIndex(item => item.id === Content.lessonPresentation[course.id]?.previews?.[step.id]);
      const preview = course.steps[previewIndex];
      const focus = presentation?.cardFocus?.[step.id];
      body = `<h2>${escape(presentation?.cardTitles?.[step.id] || step.title)}</h2>${focus ? `<p class="card-focus" aria-label="這張卡片的重點">${focusText(focus)}</p>` : ""}<div class="lesson-blocks"><section class="lesson-example" aria-label="${preview ? "這課會說的句子與單字" : label}"><h3>${preview ? "這課會說的句子" : label}</h3>${preview ? `${fullExample(course, preview)}<p class="example-meaning">${escape(preview.meaning)}</p><h3 class="example-subheading">先認識單字</h3>` : ""}${lessonExample(course, step, kind)}${preview || pairedList ? "" : `<p class="example-meaning">${escape(step.meaning)}</p>`}</section><section class="lesson-rule" aria-label="學習重點"><h3>學習重點</h3><p>${escape(note?.main || step.body)}</p>${note?.extra ? `<details class="lesson-extra"><summary>補充說明</summary><p>${escape(note.extra)}</p></details>` : ""}</section></div>`;
    }
    // Once a grammar quiz has answers, the cards lead back to the question instead of restarting it.
    const resumable = course.type === "grammar" && Object.keys(active.first || {}).length > 0;
    const resumeAt = active.order.findIndex(q => !active.solved[q]);
    const resumeLabel = `回到第 ${resumeAt < 0 ? size(course) : resumeAt + 1} 題`;
    return `<p class="reading-label">${course.type === "kana" ? "認字與讀音" : course.home === "kana" ? "發音說明" : "句型說明"} · ${i + 1} / ${cards(course)}</p><section class="study-card${course.type === "kana" ? "" : " lesson-card"}">${body}</section><div class="study-nav"><button class="text-button" data-action="study-prev"${i === 0 ? " disabled" : ""}>← 上一張</button>${resumable && i < cards(course) - 1 ? `<button class="text-button" data-action="study-resume">${resumeLabel}</button>` : ""}${resumable && i === cards(course) - 1 ? `<button class="primary" data-action="study-resume">${resumeLabel}</button>` : `<button class="primary" data-action="study-next">${i === cards(course) - 1 ? "開始練習" : "下一張 →"}</button>`}</div>${i === cards(course) - 1 ? randomLessonNext(course) : ""}`;
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
      body = `<section class="study-card study-result"><h2>${missed.length ? "練習完成" : "全部答對"}</h2><p class="result-scope">隨機練習只顯示這輪結果，不加入學習紀錄。</p><p class="result-score">這輪答對 <strong>${total - missed.length} / ${total}</strong> 題</p>${missed.length ? `<p class="study-note">答錯的字：${missed.map((item) => escape(`${item.character}（${item.reading}）`)).join("、")}</p>` : ""}${resultActions(exit, exitLabel, `<button class="text-button" data-action="study-random-again">再練 ${RANDOM_SIZE} 題</button>`)}</section>`;
    } else {
      const q = round.items[round.cursor], item = KanaPractice.entry(q.id), chosen = round.answers[round.cursor], answered = chosen !== undefined, correct = answered && q.options[chosen] === q.id;
      body = `<p class="reading-label">基本平假名 · ${round.cursor + 1} / ${total} · 選一個答案</p><section class="study-card study-quiz"><h2>${q.direction === "reading" ? "這個讀音，對應哪個字？" : "這個字，讀音是哪一個？"}</h2><div class="kana-character"${q.direction === "character" ? ' lang="ja"' : ""}>${escape(q.direction === "reading" ? item.reading : item.character)}</div><div class="study-options kana-options" role="group" aria-label="答案選項">${q.options.map((id, index) => { const option = KanaPractice.entry(id); return `<button class="answer${answered && id === q.id ? " correct" : answered && chosen === index ? " wrong" : ""}" data-action="study-answer" data-choice="${index}" aria-disabled="${answered}"${answered ? ' tabindex="-1"' : ""}>${q.direction === "reading" ? `<span lang="ja">${escape(option.character)}</span>` : escape(option.reading)}<span class="answer-status">${answered ? answerMark(chosen === index, id === q.id, correct) : ""}</span></button>`; }).join("")}</div><p class="study-feedback${answered && !correct ? " wrong" : ""}" role="status" aria-live="polite">${escape(randomFeedback(round))}</p></section><div class="study-nav"><button class="primary" data-action="study-next"${answered ? "" : " disabled"}>${round.cursor + 1 === total ? "看結果 →" : "下一題 →"}</button></div>`;
    }
    return wrap(`<h1 class="focus-heading" tabindex="-1">五十音隨機練習</h1>${body}${round.done ? "" : '<p class="study-note">從 46 個基本平假名隨機出題，不用先學過；這裡的作答不會記成成績，也不會改變複習。</p>'}<div class="lesson-utilities">${table}<button class="text-button" data-action="feedback">這一頁有問題？</button></div>`, exit, exitLabel);
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
    showFeedback(feedbackText, !correct);
    const next = document.querySelector('[data-action="study-next"]'); if (next) { next.disabled = false; next.focus({ preventScroll: true }); }
  }
  // 句型隨機練習 (#83): five questions from the noun-sentence lessons that open 基本句子, for anyone, with or without
  // records. Like 五十音隨機練習 a round lives in this page only and records nothing; each question is asked once,
  // and a miss shows the answer with its reading and explanation.
  // The pool is picked by hand, question by question, for a learner starting from zero: each says in Chinese what to
  // say or what is asked, and every Japanese option has its reading, so it can be answered without a lesson; a first
  // try may be a guess, and the explanation teaches the point. Left out: questions asking the meaning of Japanese
  // shown without a reading, and g-to/question/point, whose Chinese never says what これと それです means (a test can
  // check readings and the rest, not that). A question added to these lessons later does not join by itself.
  const GRAMMAR_RANDOM_POOL = ["g-identity/question/topic-reading", "g-question/question/question-ending", "g-demo/question/held-item", "g-demo/question/distant-item", "g-demo/question/listener-item", "g-negative/question/ja-nai", "g-negative/question/answer", "g-no/question/my-bread", "g-mo/question/me-too", "g-to/question/and"];
  let grammarRandomRound = null;
  function newGrammarRandomRound() {
    const pool = GRAMMAR_RANDOM_POOL.map((id) => { const courseId = id.split("/")[0]; return { courseId, q: courses[courseId]?.questions.findIndex((question) => question.id === id) ?? -1 }; }).filter(({ q }) => q >= 0);
    const items = shuffle(pool.length).slice(0, RANDOM_SIZE).map((i) => ({ ...pool[i], options: shuffle(courses[pool[i].courseId].questions[pool[i].q].options.length) }));
    return { items, cursor: 0, answers: [], done: false };
  }
  function grammarRandomFeedback(round) {
    const choice = round.answers[round.cursor];
    if (choice === undefined) return "";
    const { question } = roundItem(round);
    return grammarFeedback(question, choice === question.answer);
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
      body = `<section class="study-card study-result"><h2>${missed.length ? "練習完成" : "全部答對"}</h2><p class="result-scope">隨機練習只顯示這輪結果，不加入學習紀錄。</p><p class="result-score">這輪答對 <strong>${round.items.filter(right).length} / ${total}</strong> 題</p>${missed.length ? `<details class="result-lessons"><summary>回看相關課程（${missed.length}）</summary><ul class="review-lessons">${missed.map((id) => `<li><button class="text-button" data-action="study-open" data-course="${id}">${escape(Content.displayTitle(id))} →</button></li>`).join("")}</ul></details>` : ""}${resultActions(exit, exitLabel, `<button class="text-button" data-action="study-grammar-random-again">再練一次</button>`)}</section>`;
    } else {
      body = grammarQuestion(round, `入門句型 · ${round.cursor + 1} / ${total}`, round.cursor + 1 === total ? "看結果 →" : "下一題 →");
    }
    return wrap(`<h1 class="focus-heading" tabindex="-1">句型隨機練習</h1>${body}${round.done ? "" : '<p class="study-note">從「基本句子」開頭幾課的名詞句隨機出題，不用先學過；這裡的作答不會記成成績，也不會改變複習。</p>'}<div class="lesson-utilities">${list}<button class="text-button" data-action="feedback">這一頁有問題？</button></div>`, exit, exitLabel);
  }
  // Both short practice and continuous practice share answer rendering and feedback.
  function grammarQuestion(round, position, nextLabel = "下一題 →") {
    const { item, question } = roundItem(round), chosen = round.answers[round.cursor], answered = chosen !== undefined, correct = chosen === question.answer;
    return `<p class="reading-label">${position} · 選一個答案</p><section class="study-card study-quiz"><h2>${escape(question.prompt)}</h2>${question.promptReading ? `<p class="study-note">${escape(question.promptReading)}</p>` : ""}<div class="study-options grammar-options" role="group" aria-label="答案選項">${item.options.map((choice) => `<button class="answer${answered && choice === question.answer ? " correct" : answered && chosen === choice ? " wrong" : ""}" data-action="study-answer" data-choice="${choice}" aria-disabled="${answered}"${answered ? ' tabindex="-1"' : ""}>${question.readings?.[choice] ? `<span lang="ja">${escape(question.options[choice])}</span><span class="option-reading">${escape(question.readings[choice])}</span>` : escape(question.options[choice])}<span class="answer-status">${answered ? answerMark(chosen === choice, choice === question.answer, correct) : ""}</span></button>`).join("")}</div><p class="study-feedback${answered && !correct ? " wrong" : ""}" role="status" aria-live="polite">${escape(grammarRandomFeedback(round))}</p></section><div class="study-nav"><button class="primary" data-action="study-next"${answered ? "" : " disabled"}>${nextLabel}</button></div>`;
  }
  function drillPage() {
    if (!state().drill.session) { state().drill=Drill.start(state().drill,drillPool); save(); }
    const round = state().drill.session;
    const body = round.done
      ? `<section class="study-card study-result"><h2>本次練習</h2><p class="result-score">答對 <strong>${round.correct} / ${round.answered}</strong> 題</p><div class="finish-actions"><button class="primary" data-action="study-drill-continue">繼續刷題 →</button><a class="text-button" href="#home">回首頁</a></div></section>`
      : grammarQuestion(round, `第 ${round.answered + (round.answers[0] === undefined ? 1 : 0)} 題`) + '<button class="text-button drill-stop" data-action="study-drill-stop">結束這次練習</button>';
    return wrap(`<h1 class="focus-heading" tabindex="-1">基礎刷題</h1><p class="study-note">單字、助詞與句型混合出題。選答案後看解釋，再按「下一題」，想停時就結束。</p>${round.restarted ? '<p class="study-note" role="status">題目內容已更新，這次練習已重新開始；課程進度與成績都保留。</p>' : ""}${body}<p class="study-note">自動記住這次練習，離開後可接著做。不影響課程進度；可到「學習紀錄」清除。</p><div class="lesson-utilities"><button class="text-button" data-action="feedback">這一頁有問題？</button></div>`);
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
    return `<p class="reading-label">${session.round==='retry'?'再試一次':'練習'} · ${session.cursor+1} / ${count} · 選一個答案</p><section class="study-card study-quiz"><h2>${q.direction==='reading'?'這個讀音，對應哪個字？':'這個字，讀音是哪一個？'}</h2><div class="kana-character"${q.direction==='character'?' lang="ja"':''}>${escape(q.direction==='reading'?item.reading:item.character)}</div><div class="study-options kana-options" role="group" aria-label="答案選項">${q.options.map((id,index)=>{const option=KanaPractice.entry(id);return `<button class="answer${answered&&chosen===index?(correct?' correct':' wrong'):''}" data-action="study-answer" data-choice="${index}" aria-disabled="${answered}"${answered?' tabindex="-1"':''}>${q.direction==='reading'?`<span lang="ja">${escape(option.character)}</span>`:escape(option.reading)}<span class="answer-status">${answered&&chosen===index?(correct?' ✓ 答對了':session.round==='retry'?' ✕ 下次再練':' ✕ 稍後再考'):''}</span></button>`;}).join('')}</div><p class="study-feedback${answered&&!correct?' wrong':''}" role="status" aria-live="polite">${escape(practiceFeedback(session))}</p></section><div class="study-nav">${!review&&session.round==='first'?'<button class="text-button" data-action="study-review">回看這課說明</button>':''}<button class="primary" data-action="study-next"${answered?'':' disabled'}>${session.cursor+1===count?(session.round==='retry'?'完成練習':'繼續 →'):'下一題 →'}</button></div><p class="study-note">${session.round==='retry'?'憑記憶再答一次；這次不會改變第一次作答的成績。':'答錯可直接往下，這一輪最後會再考一次。'}</p>`;
  }
  function updatePractice(session) {
    const q=KanaPractice.current(session), answers=session.round==='retry'?session.retryAnswers:session.answers, choice=answers[session.cursor], correct=q.options[choice]===q.id;
    for(const node of document.querySelectorAll('[data-action="study-answer"]')){
      const selected=Number(node.dataset.choice)===choice;
      node.classList.toggle('correct',selected&&correct);node.classList.toggle('wrong',selected&&!correct);node.setAttribute('aria-disabled','true');node.setAttribute('tabindex','-1');
      const mark=node.querySelector('.answer-status');if(mark)mark.textContent=selected?(correct?' ✓ 答對了':session.round==='retry'?' ✕ 下次再練':' ✕ 稍後再考'):'';
    }
    showFeedback(practiceFeedback(session), !correct);
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
      body=`<section class="study-card study-result"><h2>複習完成</h2><p class="result-scope">這輪用來複習，不新增課程成績。</p><p>這次練了 ${session.questions.length} 個字。</p>${remaining.length?`<p>還可以再練：${remaining.map(item=>escape(`${item.character}（${item.reading}）`)).join('、')}</p>`:missed?`<p>第一次答錯 ${missed} 個字${retryRight?`，再考一次${missed>1?'都':''}答對了`:''}。</p>`:'<p>這次的字都答對了。</p>'}${resultActions(exit, exitLabel, `<button class="text-button" data-action="study-review-start">再複習 ${Math.min(5,summary.availableCount)} 個字</button>`)}</section>`;
    }else if(session)body=practiceQuiz(session,true);
    else body=`<p>先練答錯的字，較早答錯的先練；再複習較久沒練的字，最多 5 個。</p>${summary.wrongLabels.length?`<p>${wrongLine(summary)}</p>`:''}${summary.availableCount?'<button class="primary" data-action="study-review-start">開始複習</button>':'<p>先完成一組五十音練習，就可以在這裡複習。</p>'}`;
    return wrap(`<h1 class="focus-heading" tabindex="-1">五十音複習</h1>${body}<div class="lesson-utilities"><button class="text-button" data-action="feedback">這一頁有問題？</button></div>`,exit,exitLabel);
  }
  // A grammar or special-sound lesson's question; kana lessons answer through KanaPractice instead.
  function answerFeedback(course, active) {
    const q = active.order[active.cursor], solved = active.solved[q] === true;
    if (!solved && active.wrong === null) return "";
    const question = course.questions[q];
    return grammarFeedback(question, solved, true);
  }
  // After a wrong answer, link straight to the card that explains it; the first answer stays recorded.
  function lookBack(course, active) {
    const question = course.type === "grammar" ? course.questions[active.order[active.cursor]] : null;
    const cardId = question && Content.lessonPlan[course.id]?.review?.[question.id];
    const index = cardId ? course.steps.findIndex((step) => step.id === cardId) : -1;
    return index >= 0 && !active.solved[active.order[active.cursor]] && active.wrong !== null ? `<button class="text-button look-back" data-action="study-look" data-card="${index}">回看說明：${escape(course.steps[index].title)}</button>` : "";
  }
  // Kana lessons practise through KanaPractice; the rest is the grammar (and special-sound) quiz.
  function quiz(course, active) {
    if(course.type==='kana')return practiceQuiz(active.practice);
    const q = active.order[active.cursor], solved = active.solved[q] === true, question = course.questions[q], correct = question.answer;
    return `<p class="reading-label">練習 · ${active.cursor + 1} / ${size(course)} · 選一個答案</p><section class="study-card study-quiz"><h2>${escape(question.prompt)}</h2>${question.promptReading ? `<p class="study-note">${escape(question.promptReading)}</p>` : ""}<div class="study-options" role="group" aria-label="答案選項">${active.options[q].map((choice) => `<button class="answer${(solved || active.wrong !== null) && choice === correct ? " correct" : active.wrong === choice ? " wrong" : ""}" data-action="study-answer" data-choice="${choice}" aria-disabled="${solved}"${solved ? ' tabindex="-1"' : ""}>${question.readings ? `<span lang="ja">${escape(question.options[choice])}</span><span class="option-reading">${escape(question.readings[choice])}</span>` : escape(question.options[choice])}<span class="answer-status">${(solved || active.wrong !== null) && choice === correct ? (solved ? ' ✓ 答對了' : ' ✓ 正確答案') : active.wrong === choice ? ' ✕ 再試一次' : ''}</span></button>`).join("")}</div><p class="study-feedback${!solved && active.wrong !== null ? " wrong" : ""}" role="status" aria-live="polite">${escape(answerFeedback(course, active))}</p><div class="look-back-slot">${lookBack(course, active)}</div></section><div class="study-nav"><button class="text-button" data-action="study-review">回看這課說明</button><button class="primary" data-action="study-next"${solved ? "" : " disabled"}>${active.cursor === size(course) - 1 ? "完成這一輪" : "下一題 →"}</button></div><p class="study-note">答錯可以重試；第一次的答案會留下紀錄，重試不會改寫第一次作答的成績。</p>`;
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
  function randomLessonNext(course) {
    const unit = grammarUnits().find(unit => unit.lessons.some(item => item.id === course.id));
    return unit ? `<div class="random-lesson-next"><button class="text-button" data-action="study-random-lesson" data-unit="${unit.lessons[0].id}">再隨機進一課 →</button><span>從「${escape(unit.title)}」選另一課，先看說明。</span></div>` : "";
  }
  function resultActions(exit, exitLabel, secondary, extra = "") {
    return `<div class="study-nav"><a class="primary" href="${exit}">${exitLabel}</a>${secondary}</div>${extra ? `<details class="result-extra"><summary>其他練習選項</summary>${extra}</details>` : ""}`;
  }
  function result(course, saved) {
    const score = saved.lastResult, active = peekAttempt(course.id);
    const retries = retryLabels({ courseId: course.id, courseRevision: active.courseRevision, questionIds: active.order.map(q => active.questionIds[q]), retryQuestions: active.order.flatMap((q, index) => active.first[q] === false ? [index + 1] : []) });
    // The way back comes first; the next group and a fresh round are the quieter choices (#82).
    const next = nextCourse(course.id), [exit, exitLabel] = exitTo(backHash(course));
    return `<section class="study-card study-result"><h2>${score && score.firstCorrect === score.total ? "全部答對" : "練習完成"}</h2>${score ? `<p class="result-score">第一次答對 <strong>${score.firstCorrect} / ${score.total}</strong> 題</p>` : ""}${retries.length ? `<p class="study-note">第一次答錯：${retries.map(escape).join("、")}</p>` : ""}<p class="reading-label">${saved.completedAt ? `完成於 ${escape(new Date(saved.completedAt).toLocaleDateString("zh-TW"))}` : ""}</p><p class="result-scope">課後練習會記錄第一次作答的成績。</p>${resultActions(exit, exitLabel, next ? `<button class="text-button" data-action="study-open" data-course="${next}">${courses[next].type === "kana" ? `下一組：${escape(courses[next].row)}` : `下一課：${escape(Content.displayTitle(next))}`}</button>` : '<button class="text-button" data-action="study-restart">重新練習</button>', next ? '<button class="text-button" data-action="study-restart">重新練習</button>' : "")}${randomLessonNext(course)}</section>`;
  }
  function updateAnswer(course, active) {
    const q = active.order[active.cursor];
    paintAnswer(course.questions[q].answer, active.solved[q] === true, active.wrong, answerFeedback(course, active), lookBack(course, active));
  }
  function paintAnswer(correct, solved, wrongChoice, feedbackText, lookHtml) {
    for (const node of document.querySelectorAll('[data-action="study-answer"]')) {
      const choice = Number(node.dataset.choice), right = (solved || wrongChoice !== null) && choice === correct, wrong = !solved && choice === wrongChoice;
      node.classList.toggle("correct", right); node.classList.toggle("wrong", wrong);
      node.setAttribute("aria-disabled", String(solved)); node.setAttribute("tabindex", solved ? "-1" : "0");
      const mark = node.querySelector('.answer-status');
      if (mark) mark.textContent = right ? (solved ? " ✓ 答對了" : " ✓ 正確答案") : wrong ? " ✕ 再試一次" : "";
    }
    showFeedback(feedbackText, !solved);
    const slot = document.querySelector('.look-back-slot');
    if (slot && !(lookHtml && slot.firstElementChild)) slot.innerHTML = lookHtml;
    const next = document.querySelector('[data-action="study-next"]');
    if (next) { next.disabled = !solved; if (solved) next.focus({ preventScroll: true }); }
  }
  // Orientation only: these labels reflect the existing attempt, never advance or reset it.
  function lessonPhases(phase) {
    return `<ol class="lesson-phases" aria-label="課程進度">${[["cards", "看說明"], ["quiz", "做練習"], ["done", "完成"]].map(([key, label], index) => `<li${key === phase ? ' aria-current="step"' : ""}><span aria-hidden="true">${index + 1}</span>${label}</li>`).join("")}</ol>`;
  }
  function coursePage(course) {
    const saved = courseState(course.id);
    const active = peekAttempt(course.id) || draftAttempt(course, saved);
    return wrap(`<h1 class="focus-heading" tabindex="-1">${japaneseRuns(Content.lessonPresentation[course.id]?.focus ? course.title : Content.displayTitle(course.id))}</h1>${Content.lessonPresentation[course.id]?.focus ? `<p class="lesson-topic">${focusText([Content.lessonPresentation[course.id].focus[0] === "文法" ? "用法" : "單字", Content.displayTitle(course.id)])}</p>` : Content.lessonPresentation[course.id] ? `<p class="study-note">${escape(course.title)}</p>` : ""}${lessonPhases(active.phase)}${active.phase === "done" ? result(course, saved) : active.phase === "quiz" ? quiz(course, active) : card(course, active)}<div class="lesson-utilities"><button class="text-button" data-action="feedback">這一頁有問題？</button></div>`, ...exitTo(backHash(course)), course.type !== "kana", active.phase === "done" ? "" : "active-lesson");
  }
  function render(hash) {
    // The opened search result gets focus only when coming back from the travel cards, not on a later visit.
    if (!hash.startsWith("#travel")) travelReturn = null;
    if (hash === "#games") return wrap(PhotoWalk.games(), "#home", "回首頁", true, "games-page");
    if (hash === "#photo-walk") return wrap(PhotoWalk.render(state().photoWalk || (state().photoWalk = PhotoWalk.create()), inlineAudio), "#games", "回小遊戲", true, "photo-walk-page");
    if (hash === "#suitcase") return wrap(Suitcase.render(state().suitcase || (state().suitcase = Suitcase.create()), inlineAudio), "#games", "回小遊戲", true, "suitcase-page");
    if (hash === "#cafe") return wrap(Cafe.render(state().cafe || (state().cafe = Cafe.create()), inlineAudio), "#games", "回小遊戲", true, "cafe-page");
    if (hash === "#crossword") return crosswordPage();
    if (hash === "#kana") return kanaPage();
    if (hash === "#kana-review") return reviewPage();
    if (hash === "#kana-random") return randomPage();
    if (hash === "#grammar-random") return grammarRandomPage();
    if (hash === "#drill") return drillPage();
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
    app.innerHTML = Routes.links(render(Routes.current()));
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
  const lastRandomLesson = new Map();
  function handle(button) {
    const action = button.dataset.action;
    if (!action?.startsWith("study-")) return false;
    if (button.disabled) return true;
    if (action === "study-random-lesson") {
      const unit = grammarUnits().find(unit => unit.lessons[0].id === button.dataset.unit);
      if (!unit) return true;
      const others = unit.lessons.filter(course => course.id !== currentId() && course.id !== lastRandomLesson.get(button.dataset.unit));
      const pool = others.length ? others : unit.lessons;
      const course = pool[shuffle(pool.length)[0]], saved = courseState(course.id);
      let active = peekAttempt(course.id);
      if (!active || active.phase === "done") active = draftAttempt(course, saved);
      else if (active.phase === "quiz") {
        // Open the explanation without throwing away the saved question order or first answers.
        active.phase = "cards"; active.cursor = 0; active.wrong = null; save();
      }
      lastRandomLesson.set(button.dataset.unit, course.id);
      api.go(`#study/${course.id}`);
      return true;
    }
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
    if (action === "study-travel-clear") { travelQuery = ""; if (Routes.current() === "#travel") redraw("#travel-search"); return true; }
    if (action === "study-favorite") {
      const id = button.dataset.phrase;
      if (!Routes.current().startsWith("#travel/") || !PHRASEBOOK.some(item => item.steps.some(step => step.id === id))) return true;
      const wasSaved = favoriteIds().includes(id), next = wasSaved ? favoriteIds().filter(value => value !== id) : [...favoriteIds(),id];
      if (api.saveFavorites?.(next)) {
        // The list is drawn again, so a phrase playing from it stops instead of losing its speaker.
        if (Routes.current() === "#travel/favorites") { stopAudio(); redraw(); }
        else { button.textContent = wasSaved ? "收藏" : "已收藏"; button.setAttribute?.("aria-pressed",String(!wasSaved)); }
      }
      return true;
    }
    if (action === "study-line-audio") {
      if (button.dataset.spoken && /^line-\d+$/.test(button.dataset.status || "")) say(button.dataset.spoken, `[data-audio-for="${button.dataset.status}"]`, button);
      return true;
    }
    if(action.startsWith("study-walk-") && Routes.current()==="#photo-walk") {
      const verb=action.slice('study-walk-'.length),game=state().photoWalk;
      const message=PhotoWalk.act(game,verb,button.dataset.id);if(message===null)return true;
      stopAudio();save();
      const focus=verb==='look'?'.walk-camera':verb==='park'?'.walk-park':verb==='roman'?'[data-action="study-walk-roman"]':verb==='snap'?'.walk-status':'.focus-heading';
      redraw(focus);const status=document.querySelector('.walk-status');if(status)status.textContent=message;
      if(verb==='look'||verb==='park')document.querySelector(verb==='look'?'.walk-camera':'.walk-park')?.scrollIntoView?.({block:'nearest',behavior:'instant'});
      return true;
    }
    if(action.startsWith("study-suitcase-") && Routes.current()==="#suitcase") {
      const game=state().suitcase, verb=action.slice('study-suitcase-'.length), before=game.phase;
      let message,focus='.trip-status';
      if(verb==='again' && game.phase==='done'){state().suitcase=Suitcase.create();message='';focus='.focus-heading';}
      else {message=Suitcase.act(game,verb,button.dataset.id);if(message===null)return true;
        if(verb==='toggle')focus=`[data-action="study-suitcase-toggle"][data-id="${game.selected}"]`;
        if(game.phase!==before||verb==='next'||(verb==='use'&&game.used))focus='.focus-heading';
      }
      stopAudio();save();redraw(focus);
      const status=document.querySelector('.trip-status');if(status){status.textContent=message;if(message&&focus==='.trip-status')status.scrollIntoView?.({block:'nearest'});}
      return true;
    }
    if (action.startsWith("study-cafe-") && Routes.current()==="#cafe") {
      const game=state().cafe; let message="", focus=".cafe-status";
      if(action==="study-cafe-pick") { if(!Cafe.choose(game,button.dataset.group,button.dataset.id))return true; focus=`[data-group="${button.dataset.group}"][data-id="${button.dataset.id}"]`; }
      else if(action==="study-cafe-roman") { game.roman=!game.roman;focus='[data-action="study-cafe-roman"]'; }
      else if(action==="study-cafe-serve") { if(Cafe.serve(game)) {message="送對了！客人收到飲料了。";focus='.focus-heading';} else message=Cafe.errors(game).map(g=>`${Cafe.groups.find(x=>x.id===g).title.slice(1)}要選「${Cafe.item(g,Cafe.current(game)[g]).zh}」`).join('，')+"，改好再送一次。"; }
      else if(action==="study-cafe-next") { if(!Cafe.next(game))return true;focus='.focus-heading'; }
      else if(action==="study-cafe-again" && game.served && game.index===2) { state().cafe=Cafe.create();focus='.focus-heading'; }
      else return true;
      stopAudio();save();redraw(focus);
      const status=document.querySelector('.cafe-status');if(status)status.textContent=message;
      return true;
    }
    if (action.startsWith("study-crossword-")) return crosswordAction(button);
    if (action === "study-food-audio") {
      const step = PHRASEBOOK.flatMap(item => item.steps).find(step => step.id === button.dataset.phrase);
      const index = Number(button.dataset.index), keyword = Number.isInteger(index) && step?.keywords[index];
      if (Routes.current().startsWith("#travel") && keyword) {
        const text = keyword[0], spoken = text.match(/（(.*?)）/u)?.[1] || text;
        say(spoken, `[data-audio-for="${step.id}-${index}"]`, button);
      }
      return true;
    }
    if (action === "study-travel-audio") {
      const item = Routes.current() === "#travel/favorites" ? travelItem(button.dataset.course) : Routes.current().startsWith("#travel/") ? travelItem(Routes.current().slice(8)) : null;
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
    if (action === "study-kana-random") { randomRound = newRandomRound(); if (Routes.current() === "#kana-random") redraw(); else api.go("#kana-random"); return true; }
    if (Routes.current() === "#kana-random" && ["study-answer", "study-next", "study-random-again"].includes(action)) {
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
    if (action === "study-drill") { api.go("#drill"); return true; }
    if (Routes.current() === "#drill" && ["study-answer", "study-next", "study-drill-stop", "study-drill-continue"].includes(action)) {
      const command = {"study-answer":"answer","study-next":"next","study-drill-stop":"stop","study-drill-continue":"continue"}[action];
      const updated = Drill.act(state().drill,drillPool,command,Number(button.dataset.choice));
      if (!updated) return true;
      state().drill=updated; save();
      if(command==='answer') { const round=updated.session, {question}=roundItem(round); paintChoice(round.answers[0],question.answer,grammarRandomFeedback(round)); }
      else redraw();
      return true;
    }

    if (action === "study-grammar-random") { grammarRandomRound = newGrammarRandomRound(); if (Routes.current() === "#grammar-random") redraw(); else api.go("#grammar-random"); return true; }
    if (Routes.current() === "#grammar-random" && ["study-answer", "study-next", "study-grammar-random-again"].includes(action)) {
      if (action === "study-grammar-random-again") { grammarRandomRound = newGrammarRandomRound(); redraw(); return true; }
      const round = grammarRandomRound;
      if (!round || round.done) return true;
      if (action === "study-answer") {
        const choice = Number(button.dataset.choice), { item, question } = roundItem(round);
        if (round.answers[round.cursor] === undefined && item.options.includes(choice)) { round.answers[round.cursor] = choice; paintChoice(choice, question.answer, grammarRandomFeedback(round)); }
      } else if (round.answers[round.cursor] !== undefined) {
        if (round.cursor + 1 < round.items.length) round.cursor++; else round.done = true;
        redraw();
      }
      return true;
    }
    // The review page owns only answer and next; study-open, study-script and the like go to the handlers below.
    if(Routes.current()==='#kana-review'&&(action==='study-answer'||action==='study-next')){
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
      if (startGrammarRound()) { if (Routes.current() === "#grammar-review") redraw(); else api.go("#grammar-review"); }
      return true;
    }
    if (Routes.current() === "#grammar-review") {
      const round = grammarRound();
      if (!round || round.done) return true;
      const { item, question } = roundItem(round);
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
      if (active.phase === "cards" && (course.type === "kana" || course.type === "grammar") && Number.isInteger(index) && index >= 0 && index < cards(course)) speak(course, index, `[data-audio-for="${course.id}-${index}"]`, false, button);
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
      const correct = choice === course.questions[q].answer;
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
    if (hash === "#drill") return state().drill.session?.done ? "基礎刷題・本次結果" : "基礎刷題";
    if (hash === "#kana") return "五十音表";
    if (hash === "#grammar-random") return grammarRandomRound ? grammarRandomRound.done ? "句型隨機練習・結果" : `句型隨機練習・第 ${grammarRandomRound.cursor + 1} 題` : "句型隨機練習";
    if (hash === "#kana-random") return randomRound ? randomRound.done ? "五十音隨機練習・結果" : `五十音隨機練習・第 ${randomRound.cursor + 1} 題` : "五十音隨機練習";
    if (hash === "#kana-review") return state().reviewSession?.round==='done'?'五十音複習・完成頁':`五十音複習${state().reviewSession?`・${state().reviewSession.round==='retry'?'再試一次':'練習'}第 ${state().reviewSession.cursor+1} 步`:''}`;
    if (hash === "#settings") return "學習設定";
    if (hash === "#travel/favorites") return "我的常用語";
    if (hash === "#grammar") return "基礎句型";
    if (hash === "#grammar-review") { const round = grammarRound(); return round ? round.done ? "句型小複習・完成頁" : `句型小複習・第 ${round.cursor + 1} 題・${roundItem(round).course.title}` : "句型小複習"; }
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
