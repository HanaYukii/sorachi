import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../dist/study.js', import.meta.url), 'utf8');
const clone = (value) => JSON.parse(JSON.stringify(value));
// Reconstruct the written reading, not the hidden speaker label, when checking complete examples.
const kanaHtml = html => html.replace(/<ruby>[^<]*<rp>（<\/rp><rt>(.*?)<\/rt><rp>）<\/rp><\/ruby>/gs, '$1').replace(/<span class="with-furigana">(.*?)<\/span>/gs, '$1');

function harness(saved, voices = [], history = [], options = {}) {
  let prefs = clone(options.preferences || {}), favorites = clone(options.favorites || []), localWriteBlocked = false;
  let html = '', focused = null, stored = null, currentState, pressed = null;
  const records = [], utterances = [], speechEvents = {};
  const status = { textContent: '' };
  let renders = 0, scrolls = 0, saves = 0;
  const timers = new Map(); let timerId = 0;
  const makeNode = () => ({ textContent: '', dataset: {}, disabled: false, classList: { toggle() {} }, setAttribute(k,v) { this[k] = v; }, focus() { focused = this.selector; }, scrollIntoView() { scrolls++; }, querySelector() { return this.mark; } });
  const feedback = makeNode(), next = makeNode(), slot = makeNode(); next.selector = '[data-action="study-next"]'; slot.innerHTML = '';
  let answerNodes = [];

  let cancels = 0, voiceReads = 0;
  const app = {
    get innerHTML() { return html; },
    set innerHTML(value) {
      html = value; renders++;
      answerNodes = [...value.matchAll(/data-action="study-answer" data-choice="(\d+)"/g)].map(m => { const node = makeNode(); node.dataset.choice = m[1]; node.mark = makeNode(); return node; });
    },
    querySelector(selector) { return { focus() { focused = selector; } }; },
  };
  const document = { querySelectorAll() { return answerNodes; }, querySelector(selector) { if (selector === '.study-feedback') return feedback; if (selector === '[data-action="study-next"]') return next; if (selector === '.look-back-slot') return slot; return selector === '#app' ? app : (selector === '.study-audio-status' || selector.startsWith('[data-audio-for=')) ? status : null; } };
  const location = { hash: '#kana' };
  const speechSynthesis = { speaking: false, pending: false,
    getVoices() { voiceReads++; return voices; },
    cancel() { cancels++; },
    speak(u) { utterances.push(u); u.onstart?.(); },
    addEventListener(name, callback) { (speechEvents[name] ||= new Set()).add(callback); }, removeEventListener(name, callback) { speechEvents[name]?.delete(callback); },
  };
  const context = vm.createContext({ setTimeout(fn) { timers.set(++timerId, fn); return timerId; }, clearTimeout(id) { timers.delete(id); }, document, location, window: { speechSynthesis }, SpeechSynthesisUtterance: class { constructor(text) { this.text = text; } }, console });
  vm.runInContext(readFileSync(new URL("../dist/content.js", import.meta.url), "utf8"), context);
  vm.runInContext(readFileSync(new URL("../dist/kana-practice.js", import.meta.url), "utf8"), context);
  vm.runInContext(readFileSync(new URL("../dist/navigation.js", import.meta.url), "utf8"), context);
  for(const file of ["drill-bank","drill"]) vm.runInContext(readFileSync(new URL(`../dist/${file}.js`,import.meta.url),"utf8"),context);
  vm.runInContext(`${source}\nglobalThis.moduleStudy = Study; globalThis.moduleContent = Content; globalThis.modulePractice = KanaPractice; globalThis.moduleDrill = Drill; globalThis.moduleDrillPool = Drill.pool(Content.grammar,DrillBank.questions);`, context);
  const study = context.moduleStudy;
  currentState = study.sanitize(saved);
  const render = (hash = location.hash) => { location.hash = hash; app.innerHTML = study.render(hash); return html; };
  study.bind({
    getState: () => currentState,
    preferences: () => clone(prefs), favorites: () => clone(favorites),
    savePreferences: value => { if (localWriteBlocked) return false; prefs=clone(value); return true; },
    saveFavorites: value => { if (localWriteBlocked) return false; favorites=clone(value); return true; },
    save() { saves++; stored = clone(currentState); },
    record(record) {
      // Root record() saves immediately; completion must already be durable.
      assert.equal(currentState.courses[record.courseId].active.phase, 'done');
      stored = clone(currentState);
      records.push(clone(record));
    },
    history: () => history, footer: () => '<footer>footer</footer>', warning: () => '', go: render,
  });
  return {
    study, drillEngine: context.moduleDrill, drillPool: context.moduleDrillPool, loadHints() { vm.runInContext(readFileSync(new URL('../dist/kana-hints.js', import.meta.url), 'utf8'),context); }, practice: context.modulePractice, content: context.moduleContent, records, utterances, status, render, feedback, next, slot, speechSynthesis,
    get preferences() { return clone(prefs); }, get favorites() { return clone(favorites); }, blockLocalWrites() { localWriteBlocked = true; },
    get answers() { return answerNodes; }, get renders() { return renders; }, get saves() { return saves; }, get scrolls() { return scrolls; }, flushTimers() { const jobs = [...timers.values()]; timers.clear(); jobs.forEach(fn => fn()); },
    // The pressed button keeps its classes, so a test can see the speaker that is playing.
    action(action, data = {}) { const classes = new Set(); pressed = { dataset: { action: `study-${action}`, ...data }, disabled: false, classes, classList: { toggle(name, force) { if (force) classes.add(name); else classes.delete(name); } } }; return study.handle(pressed); },
    get pressed() { return pressed; },
    get state() { return currentState; }, set state(value) { currentState = value; }, get html() { return html; }, get stored() { return stored; }, get focused() { return focused; }, get cancels() { return cancels; },
    get voiceReads() { return voiceReads; }, voicesReady() { for (const callback of [...(speechEvents.voiceschanged || [])]) callback(); },
  };
}
const groupKeys = ['a','ka','sa','ta','na','ha','ma','ya','ra','wa','ga','za','da','ba','pa','kya','sha','cha','nya','hya','mya','rya','gya','ja','bya','pya'];
function startQuiz(b, id) {
  b.action('open', { course: id });
  const course = b.content.courses[id]; const count = course.type === 'kana' ? course.letters.length : course.steps.length;
  for (let i = 0; i < count; i++) b.action('next');
  assert.equal(b.state.courses[id].active.phase, 'quiz');
}
function correctChoice(b, id, q) { return b.content.courses[id].questions[q].answer; }
function chooseCurrent(b,id,wrong=false) {
  const a=b.state.courses[id].active;
  if(a.practice){const q=b.practice.current(a.practice),correct=q.options.indexOf(q.id);return wrong?(correct+1)%q.options.length:correct;}
  const q=a.order[a.cursor],correct=correctChoice(b,id,q);
  return wrong?a.options[q].find(x=>x!==correct):correct;
}
function finishQuiz(b, id, missFirst = false) {
  const active = b.state.courses[id].active;
  let guard=0;
  while(active.phase==='quiz'){
    assert.ok(++guard<25,'practice must terminate');
    b.action('answer',{choice:String(chooseCurrent(b,id,missFirst))});
    if(missFirst && !active.practice)b.action('answer',{choice:String(chooseCurrent(b,id))});
    missFirst=false;b.action('next');
  }
}

test('two scripts cover 46 basic and 25 voiced characters each and only one script is listed', () => {
  const b = harness();
  assert.equal(b.study.render('#home'), null);
  assert.equal(b.study.total('missing'), 0);
  assert.equal(b.study.title('missing'), null);
  for (const script of ['h', 'k']) {
    b.render('#kana'); b.action('script', { script });
    // 26 kana rows plus the two special-sound lessons.
    assert.equal((b.html.match(/class="course-row" data-action="study-open"/g) || []).length, 28);
    for (const heading of ['濁音・半濁音', '拗音', '促音・長音']) assert.match(b.html, new RegExp(`<h2[^>]*class="course-list-heading">${heading}</h2>`));
    const letters = [];
    for (const key of groupKeys) {
      const id = `${script}-${key}`;
      const n = ['ya', 'wa'].includes(key) || key.length === 3 || key === 'ja' ? 3 : 5;
      assert.equal(b.study.total(id), n);
      b.action('open', { course: id });
      for (let i = 0; i < n; i++) {
        letters.push(b.html.match(/<div class="kana-character" lang="ja">([^<]+)</)[1]);
        b.action('next');
      }
    }
    assert.equal(letters.length, 104);
    assert.equal(new Set(letters).size, 104);
    assert.ok(!letters.some((c) => ['ゐ','ゑ','ヰ','ヱ'].includes(c)));
  }
});

test('each kana appears once with mixed directions; choices and order persist after reload', () => {
  for (const id of ['h-a', 'h-ya', 'h-wa', 'k-wa']) {
    const b = harness(); startQuiz(b, id);
    const a = b.state.courses[id].active, n = b.study.total(id);
    assert.deepEqual([...a.order].sort(), Array.from({ length: n }, (_, i) => i));
    assert.equal(new Set(a.practice.questions.map(q=>q.direction)).size,2);
    assert.equal(new Set(a.practice.questions.map(q=>q.id)).size,n);
    // No other row is learned, so every option comes from this course; `option` must not shadow `id`.
    const fromRow=options=>options.every(option=>b.practice.entry(option).courseId===id && b.practice.entry(option).script===id[0]);
    for(const q of a.practice.questions) assert.ok(fromRow(q.options),id);
    const otherRow=b.practice.entries.find(item=>item.script===id[0] && item.courseId!==id).id;
    assert.equal(fromRow([...a.practice.questions[0].options,otherRow]),false,'The check rejects an option from another row');
    const restored = harness(b.stored); restored.render(`#study/${id}`);
    assert.deepEqual(clone(restored.state.courses[id].active.order), clone(a.order));
    assert.deepEqual(clone(restored.state.courses[id].active.practice), clone(a.practice));
  }
});

test('wrong first answer survives reload and retry; completion records once with displayed question numbers', () => {
  const b = harness(); startQuiz(b, 'h-a');
  const a = b.state.courses['h-a'].active;
  const selected=a.practice.questions.findIndex(q=>q.id.endsWith('u304a'));
  [a.practice.questions[0],a.practice.questions[selected]]=[a.practice.questions[selected],a.practice.questions[0]];
  const q=4, question=a.practice.questions[0],wrong=(question.options.indexOf(question.id)+1)%question.options.length;
  b.action('answer', { choice: String(wrong) });
  assert.equal(a.first[q], false);
  assert.match(b.feedback.textContent, /正確答案/);
  b.action('next'); assert.equal(a.cursor, 1);
  const restored = harness(b.stored); restored.render('#study/h-a');
  finishQuiz(restored, 'h-a');
  assert.equal(restored.records.length, 1);
  assert.equal(restored.records[0].firstCorrect, 4);
  assert.deepEqual(restored.records[0].retryQuestions, [1]);
  assert.equal(restored.records[0].total, 5);
  restored.action('next'); assert.equal(restored.records.length, 1);
  const done = harness(restored.stored); done.render('#study/h-a');
  assert.match(done.html, /練習完成/);
  assert.equal(done.records.length, 0);
});

test('resume preserves card and quiz progress; replay remains mixed without changing prior snapshot', () => {
  const b = harness(); b.action('open', { course: 'h-wa' }); b.action('next');
  const paused = harness(b.stored); paused.render('#study/h-wa');
  assert.equal(paused.state.courses['h-wa'].active.cursor, 1);
  paused.action('next'); paused.action('next'); finishQuiz(paused, 'h-wa');
  const savedResult = clone(paused.state.courses['h-wa'].lastResult);
  paused.action('restart');
  assert.equal(new Set(paused.study.currentAttempt('h-wa').practice.questions.map(q=>q.direction)).size,2);
  assert.deepEqual(clone(paused.state.courses['h-wa'].lastResult), savedResult);
  for (let i = 0; i < 3; i++) paused.action('next');
  assert.match(paused.html, /這個讀音，對應哪個字|這個字，讀音是哪一個/);
  assert.equal((paused.html.match(/data-action="study-answer"/g) || []).length, 3);
  finishQuiz(paused, 'h-wa');
  assert.equal(paused.records.length, 2);
  assert.equal(paused.state.courses['h-wa'].attempts, 2);
});

test('reviewing cards mid-quiz retains original answers and resumes at first incomplete item', () => {
  const b = harness(); startQuiz(b, 'h-ya');
  const active = b.state.courses['h-ya'].active;
  b.action('answer', { choice: String(chooseCurrent(b,'h-ya')) }); b.action('next');
  b.action('review');
  for (let i = 0; i < 3; i++) b.action('next');
  assert.equal(active.cursor, 1);
  assert.equal(Object.keys(active.first).length, 1);
  finishQuiz(b, 'h-ya'); assert.equal(b.records[0].firstCorrect, 3);
});

test('the grammar list opens the unit with the next lesson, says what each unit teaches and how far the learner is', () => {
  // A goal line may hold kana examples, each tagged as Japanese.
  const sections = (html) => [...html.matchAll(/<details class="unit-section"( open)?><summary><h2 class="unit-title">([^<]+)<\/h2><span class="unit-goal">((?:[^<]|<span lang="ja">[^<]+<\/span>)*)<\/span><span class="unit-count">已完成 (\d+) \/ (\d+) 課<\/span><\/summary>/g)]
    .map(([, open, title, goal, done, total]) => ({ open: Boolean(open), title, goal: goal.replace(/<\/?span[^>]*>/g, ''), markup: goal, done: Number(done), total: Number(total) }));
  const openUnits = (html) => sections(html).filter((unit) => unit.open).map((unit) => unit.title);
  const done = (ids) => ({ courses: Object.fromEntries(ids.map((id) => [id, { completedAt: '2026-10-01T00:00:00.000Z', attempts: 1 }])) });
  // A first visit: only 基本句子 is open; the next lesson and the units come before practice without a lesson, so a
  // phone shows where to start. Each unit is a heading with the goal line kept on its first lesson in the plan.
  const b = harness();
  const first = sections(b.render('#grammar'));
  assert.equal(first.length, 5);
  assert.deepEqual(openUnits(b.html), ['基本句子']);
  const units = b.study.grammarUnits();
  first.forEach((unit, i) => {
    assert.equal(unit.goal, b.content.lessonPlan[units[i].lessons[0].id].unitGoal, unit.title);
    assert.equal(unit.done, 0);
    assert.doesNotMatch(unit.markup.replace(/<span lang="ja">[^<]+<\/span>/g, ''), /[ぁ-ゖァ-ヺ]/, `${unit.title}: every kana is tagged`);
  });
  assert.match(first[4].markup, /<span lang="ja">のむ<\/span>、<span lang="ja">たべる<\/span>/);
  assert.ok(b.html.indexOf('data-course="g-identity"') < b.html.indexOf('data-course="g-question"'));
  assert.ok(b.html.indexOf('<h2>下一課</h2>') < b.html.indexOf('<details class="unit-section"'));
  assert.ok(b.html.lastIndexOf('</details>') < b.html.indexOf('<h2>句型隨機練習</h2>'));
  assert.equal(first.reduce((sum, unit) => sum + unit.total, 0), b.content.grammar.length, 'Every lesson is in a unit');
  // Partway through the first unit, it stays open and counts what is done.
  const firstUnit = units[0].lessons.map((course) => course.id);
  const partway = harness(done(firstUnit.slice(0, 3)));
  assert.deepEqual(openUnits(partway.render('#grammar')), ['基本句子']);
  assert.equal(sections(partway.html)[0].done, 3);
  // Past the first unit: 時間與數字 opens instead, and 基本句子 shows it is done.
  const later = harness(done(firstUnit));
  const next = sections(later.render('#grammar'));
  assert.deepEqual(next.filter((unit) => unit.open).map((unit) => unit.title), ['時間與數字']);
  assert.equal(next[0].done, next[0].total);
  // A lesson left unfinished in a later unit opens that unit, as 接著學 does.
  const resume = harness(done(firstUnit.slice(0, 2)));
  resume.action('open', { course: 'g-verbs' }); resume.action('next');
  assert.equal(resume.study.grammarNext().courseId, 'g-verbs');
  assert.deepEqual(openUnits(resume.render('#grammar')), ['動作與地點']);
  assert.match(resume.html, /<h2>接著學<\/h2><button class="text-button" data-action="study-open" data-course="g-verbs">/);
  // Everything done: no unit needs to be open, and every lesson can still be opened again.
  const all = harness(done(b.content.grammar.map((course) => course.id)));
  assert.deepEqual(openUnits(all.render('#grammar')), []);
  assert.equal((all.html.match(/class="course-row" data-action="study-open"/g) || []).length, b.content.grammar.length);
});

test('unit goals live with the lesson plan: one per unit, in Chinese, on its first lesson only', () => {
  const b = harness();
  const plan = JSON.parse(JSON.stringify(b.content.lessonPlan));
  const check = (mutate) => { const copy = JSON.parse(JSON.stringify({ rows: b.content.rows, grammar: b.content.grammar, lessonPlan: plan, sounds: b.content.sounds, phrasebook: b.content.phrasebook, intro: b.content.intro })); mutate(copy); return b.content.validate(copy).join('\n'); };
  assert.equal(check(() => {}), '');
  assert.match(check((copy) => { delete copy.lessonPlan['g-days'].unitGoal; }), /lessonPlan\.g-days\.unitGoal: required nonempty text/);
  assert.match(check((copy) => { copy.lessonPlan['g-question'].unitGoal = '問是不是'; }), /lessonPlan\.g-question\.unitGoal: only the first lesson of a unit has the unit goal/);
  assert.match(check((copy) => { copy.lessonPlan['g-identity'].unitGoal = 'AはBです'; }), /lessonPlan\.g-identity\.unitGoal: required Chinese text/);
  // Goals are plain Chinese with examples: no pattern notation (AはBです, 〜て), and they never start by repeating the
  // unit's own name. Whether each line is true to its lessons is a review question, not a test one.
  for (const unit of b.study.grammarUnits()) {
    const goal = plan[unit.lessons[0].id].unitGoal;
    assert.doesNotMatch(goal, /[A-Za-z]|〜/, unit.title);
    assert.ok(!goal.startsWith(unit.title.slice(0, 2)), unit.title);
  }
});

test('all grammar courses complete their content-defined cards and questions with stable score semantics', () => {
  const b = harness(); b.render('#grammar');
  assert.equal((b.html.match(/class="course-row" data-action="study-open"/g) || []).length, b.content.grammar.length);
  assert.deepEqual([...b.html.matchAll(/<summary><h2 class="unit-title">([^<]+)<\/h2>/g)].map(m => m[1]), ['基本句子', '時間與數字', '動作與地點', '形容詞與連接', '動詞原形與て形'], 'One section per unit, in teaching order');
  assert.deepEqual([...b.html.matchAll(/class="course-row" data-action="study-open" data-course="([^"]+)"/g)].map(m => m[1]), [...b.content.grammar.map(lesson => lesson.id)], 'Units keep the teaching order');
  for (const { id } of b.content.grammar) {
    assert.equal(b.study.total(id), b.content.courses[id].questions.length);
    startQuiz(b, id); finishQuiz(b, id, true);
    const result = b.records.at(-1);
    assert.equal(result.courseId, id); assert.equal(result.firstCorrect, b.content.courses[id].questions.length - 1); assert.deepEqual(result.retryQuestions, [1]);
  }
});

test('sanitization rejects malformed kana sessions, old versions and skipped unanswered questions', () => {
  const b=harness();startQuiz(b,'h-a');const saved=clone(b.stored);
  saved.courses['h-a'].active.practice.cursor=4;
  assert.equal(b.study.sanitize(saved).courses['h-a'].active,null);
  const legacy=clone(b.stored);delete legacy.courses['h-a'].active.practiceVersion;
  legacy.courses['h-a'].completedAt='2026-01-01T00:00:00Z';legacy.courses['h-a'].lastResult={firstCorrect:3,total:5};
  const clean=b.study.sanitize(legacy).courses['h-a'];assert.equal(clean.active,null);assert.equal(clean.lastResult.firstCorrect,3);assert.ok(clean.completedAt);
  const invalid=clone(b.stored);invalid.courses['h-a'].active.practice.questions[0].options[0]='unknown';assert.equal(b.study.sanitize(invalid).courses['h-a'].active,null);
  assert.deepEqual(clone(b.study.sanitize(null)),{drill:{version:1,clearedAt:null,session:null},script:'h',courses:{},kanaReview:{},reviewSession:null,reviewClearedAt:null,grammarReview:{},grammarReviewSession:null,lastGrammarId:null});
});

test('old or malformed kana review rounds restart empty while completions and kana mistakes stay', () => {
  const b=harness(), ids=b.content.courses['h-a'].questions.map(q=>q.id);
  const valid=clone(b.practice.create(ids.slice(0,3),{mode:'review'}));
  const base={courses:{'h-a':{attempts:1,completedAt:'2026-10-01T00:00:00.000Z',lastResult:{firstCorrect:4,total:5},active:null}},kanaReview:{[ids[0]]:{lastSeen:'2026-10-01T00:00:00.000Z',wrong:true}}};
  assert.ok(b.study.sanitize(clone({...base,reviewSession:valid})).reviewSession,'A current round is kept');
  const variants={'version 0':{...valid,version:0},'version 2':{...valid,version:2},'mode course':{...valid,mode:'course'},'no revisions':{...valid,revisions:undefined},
    'stale revision':{...valid,revisions:{'h-a':'c1-0000000000000000'}},'old shape':{ids:valid.questions.map(q=>q.id),cursor:1}};
  for(const [name,reviewSession] of Object.entries(variants)) {
    const state=b.study.sanitize(clone({...base,reviewSession}));
    assert.equal(state.reviewSession,null,name);
    assert.equal(state.courses['h-a'].completedAt,'2026-10-01T00:00:00.000Z',name);
    assert.deepEqual(clone(state.courses['h-a'].lastResult),{firstCorrect:4,total:5},name);
    assert.deepEqual(clone(state.kanaReview),base.kanaReview,name);
  }
});

test('an unavailable Japanese voice shows visible fallback and never speaks English', () => {
  const voices = [{ lang: 'en-US', name: 'English' }];
  const b = harness(null, voices); b.action('open', { course: 'h-a' });
  b.action('audio', { index: '0' });
  assert.equal(b.utterances.length, 0);
  assert.equal(b.status.textContent, '目前無法播放日文讀音，可以先看讀音。');
  voices.push({ lang: 'ja-JP', name: 'Japanese' }); b.voicesReady();
  assert.equal(b.status.textContent, '日文讀音準備好了，可以再按一次。');
  b.action('audio', { index: '0' });
  assert.equal(b.utterances.length, 1);
  // Playing normally writes nothing: the hint goes, and the pressed speaker shows it is playing until the end.
  assert.equal(b.status.textContent, '');
  assert.ok(b.pressed.classes.has('playing'));
  const playing = b.pressed;
  b.utterances[0].onend();
  assert.ok(!playing.classes.has('playing'));
  b.action('audio', { index: '0' });
  const again = b.pressed;
  assert.ok(again.classes.has('playing'));
  b.action('audio', { index: '1' });
  assert.ok(!again.classes.has('playing') && b.pressed.classes.has('playing'), 'Only the speaker pressed last shows playing');
  assert.equal(b.utterances[0].lang, 'ja-JP');
  assert.equal(b.utterances[0].rate, 0.8);
  assert.equal(b.utterances[0].voice.lang, 'ja-JP');
  // A late "interrupted" error from an earlier request changes nothing; an error on the current one ends the ring and says so.
  const current = b.pressed;
  b.utterances[0].onerror({ error: 'interrupted' });
  assert.equal(b.status.textContent, '');
  assert.ok(current.classes.has('playing'));
  b.utterances.at(-1).onerror({ error: 'synthesis-failed' });
  assert.ok(!current.classes.has('playing'));
  assert.match(b.status.textContent, /沒有播放成功/);
  // Playing again clears the hint; leaving the page stops the audio and the ring.
  b.action('audio', { index: '1' });
  assert.equal(b.status.textContent, '');
  const last = b.pressed;
  b.study.stopAudio();
  assert.ok(!last.classes.has('playing'));
  b.utterances.at(-1).onend(); assert.equal(b.status.textContent, '');
});

test('audio uses ha and he for standalone kana, o for wo, and n for the nasal', () => {
  const b = harness(null, [{ lang: 'ja-JP' }]);
  b.action('open', { course: 'k-ha' });
  b.action('audio', { index: '0' }); assert.equal(b.utterances.at(-1).text, 'ハ');
  b.action('audio', { index: '3' }); assert.equal(b.utterances.at(-1).text, 'ヘ');
  b.action('open', { course: 'k-wa' });
  b.action('audio', { index: '1' }); assert.equal(b.utterances.at(-1).text, 'お');
  b.action('audio', { index: '2' }); assert.equal(b.utterances.at(-1).text, 'ん');
});

test('unknown route/course cannot inject markup and unrelated actions pass through', () => {
  const b = harness();
  assert.equal(b.study.handle({ dataset: { action: 'feedback' } }), false);
  assert.equal(b.study.render('#home'), null);
  assert.equal(b.study.render('#done'), null);
  assert.equal(b.study.context('#feedback'), null);
  const html = b.render('#study/<img src=x onerror=alert(1)>');
  assert.match(html, /找不到/); assert.doesNotMatch(html, /onerror/);
  assert.match(b.render('#study/__proto__'), /找不到/);
  assert.match(b.render('#study/constructor'), /找不到/);
  assert.equal(b.study.total('__proto__'), 0);
  assert.equal(b.study.context('#kana'), '五十音表');
});

test('travel section is separate; each situation shows keywords and playable phrases without a quiz', () => {
  const b = harness(null, [{lang: 'ja-JP'}]);
  b.render('#travel');
  assert.equal((b.html.match(/href="#travel\//g) || []).length, b.content.phrasebook.length + 1);
  assert.doesNotMatch(b.html, /data-action="study-open"/);
  assert.doesNotMatch(b.html, /data-course="g-identity"/);
  assert.equal(b.study.context('#travel'), '旅遊常用語列表');
  for (const id of ['t-place', 't-order', 't-pay', 't-charge']) {
    b.render(`#travel/${id}`);
    assert.match(b.html, /關鍵字/);
    assert.match(b.html, /href="#travel"/);
    assert.doesNotMatch(b.html, /data-action="study-answer"|選一個答案/);
    b.action('travel-audio', {course: id, index: '0'});
    assert.ok(b.utterances.at(-1).text.length > 0);
    assert.equal(b.study.render(`#study/${id}`).includes('找不到這堂課'), true, 'Retired quiz routes are redirected by the app');
  }
  b.render('#travel/t-order');
  for (const word of [/ひとつ/, /ふたつ/, /みっつ/, /ホット/, /アイス/, /rokku/, /sooda wari/, /atatakai/, /tsumetai/, /namimori/, /oomori/]) assert.match(b.html, word);
  assert.match(b.html, /<details class="phrase-more"><summary>進階補充：點酒的喝法/);
  assert.doesNotMatch(b.html, /ROKU|琴酒品牌/);
});

test('phrasebook freely shows keywords without changing learning progress, and audio uses the chosen card', () => {
  const b = harness(null, [{lang:'ja-JP'}]);
  b.action('open', {course:'h-a'}); b.action('next');
  const before = clone(b.state);
  for (const id of ['basics','t-order','dining','t-pay','shopping','lines','t-place','t-charge','transit','hotel','live']) {
    b.render(`#travel/${id}`);
    assert.match(b.html, /關鍵字/);
    // The short phrase is visible; only a fuller form sits behind the expander.
    assert.match(b.html, /<div class="phrase-short"><h3 class="phrase-label">可以這樣說<\/h3>/);
    assert.doesNotMatch(b.html, /data-action="study-next"|開始練習|data-action="study-answer"/);
    assert.deepEqual(clone(b.state), before);
    assert.equal(b.records.length, 0);
  }
  b.render('#travel/t-pay');
  assert.match(b.html, /カード/); assert.match(b.html, /現金/);
  assert.match(b.html, /Suica<span class="kw-kana">（スイカ）<\/span>/);
  assert.match(b.html, /suika wa tsukaemasu ka/);
  b.render('#travel/t-order');
  assert.match(b.html, /ひとつ/); assert.match(b.html, /並盛/);
  b.action('travel-audio', {course:'t-order',index:'2'});
  assert.equal(b.utterances.at(-1).text, 'アイスでお願いします。');
  assert.equal(b.status.textContent, '', 'Normal playback adds no text');
  assert.ok(b.pressed.classes.has('playing'));
  b.action('travel-audio', {course:'t-order',index:'2',full:'0'});
  assert.equal(b.utterances.at(-1).text, 'アイス。', 'The short phrase plays on its own');
  b.render('#travel/t-place');
  const stuck = b.content.phrasebook.find(c => c.id === 't-place').steps.findIndex(s => s.id.endsWith('locker-stuck'));
  b.action('travel-audio', {course:'t-place',index:String(stuck),full:'0'});
  assert.equal(b.utterances.at(-1).text, 'すみません、あきません。', 'Kana speech text avoids the ひらきません misreading');
  b.render('#travel/t-order');
  b.action('travel-audio', {course:'t-order',index:'99'});
  b.action('travel-audio', {course:'hotel',index:'0'});
  assert.equal(b.utterances.length, 3);
  assert.deepEqual(clone(b.state), before);
  assert.match(b.render('#travel/__proto__'), /找不到這個情境/);
  assert.equal(b.study.context('#travel/__proto__'), null);
});


test('voice choice prefers Kyoko over Eloquence, preserves fallback and avoids idle cancel', () => {
  const eddy = {name:'Eddy', voiceURI:'com.apple.eloquence.ja-JP.Eddy', lang:'ja-JP', localService:true};
  const kyoko = {name:'Kyoko', lang:'ja-JP', localService:true};
  const b = harness(null, [eddy, kyoko]); b.action('open',{course:'h-a'});
  const cancels = b.cancels; b.action('audio',{index:'0'});
  assert.equal(b.utterances[0].voice, kyoko); assert.equal(b.cancels,cancels);
  const only = harness(null,[eddy]); only.action('open',{course:'h-a'}); only.action('audio',{index:'0'}); assert.equal(only.utterances[0].voice,eddy);
});

test('busy audio delays playback and superseded timers or voice listeners cannot affect a new page', () => {
  const b = harness(null,[{lang:'ja-JP'}]); b.action('open',{course:'h-a'});
  b.speechSynthesis.speaking = true; b.action('audio',{index:'0'});
  assert.equal(b.utterances.length,0);
  b.speechSynthesis.speaking = false; b.action('audio',{index:'1'}); assert.equal(b.utterances.length,0); b.flushTimers(); assert.equal(b.utterances.length,1); assert.equal(b.utterances[0].text,'い');
  b.speechSynthesis.speaking = true; b.action('audio',{index:'2'}); b.study.stopAudio(); b.flushTimers(); assert.equal(b.utterances.length,1);
  const voices=[]; const late=harness(null,voices); late.action('open',{course:'h-a'}); late.action('audio',{index:'0'}); late.study.stopAudio();
  voices.push({lang:'ja-JP'}); const before=late.status.textContent; late.voicesReady(); assert.equal(late.status.textContent,before);
});

test('speech engine exceptions use visible fallback and never break navigation', () => {
  for (const method of ['getVoices','speak','cancel']) {
    const b=harness(null,[{lang:'ja-JP'}]); b.action('open',{course:'h-a'}); b.speechSynthesis.speaking=true;
    b.speechSynthesis[method]=()=>{throw new Error('engine unavailable');};
    assert.doesNotThrow(()=>b.action('audio',{index:'0'})); b.flushTimers(); assert.match(b.status.textContent,/沒有播放成功/);
    assert.doesNotThrow(()=>b.action('next'));
  }
});

test('kana answers retain options and live region, mark wrong in text and allow the next question', () => {
  const b=harness(); startQuiz(b,'h-a'); const a=b.state.courses['h-a'].active;
  const nodes=b.answers, feedback=b.feedback, renders=b.renders;
  b.action('answer',{choice:String(chooseCurrent(b,'h-a',true))});
  assert.equal(b.renders,renders); assert.equal(b.answers,nodes); assert.equal(b.feedback,feedback);
  assert.ok(nodes.some(n=>n.mark.textContent.includes('稍後再考'))); assert.match(feedback.textContent,/正確答案/);
  assert.equal(b.next.disabled,false); assert.equal(b.renders,renders); assert.equal(b.next.disabled,false); assert.equal(b.focused,'[data-action="study-next"]'); assert.ok(b.scrolls>=1);
  assert.match(b.html,/study-quiz/); assert.match(b.html,/kana-options/);
  const g=harness(); startQuiz(g,'g-identity'); assert.doesNotMatch(g.html,/kana-options/);
});

test('retry labels use question identity and revision, with safe historical and legacy fallbacks', () => {
  const b=harness(); startQuiz(b,'h-a'); finishQuiz(b,'h-a',true); const entry=b.records[0];
  const q=b.content.courses['h-a'].questions.find(q=>q.id===entry.questionIds[0]);
  assert.deepEqual([...b.study.retryLabels(entry)],[`${q.character}（${q.reading}）`]);
  assert.deepEqual([...b.study.retryLabels({...entry,courseRevision:'old'})],[q.character]);
  assert.deepEqual([...b.study.retryLabels({...entry,questionIds:undefined})],['第 1 題']);
  assert.match(b.html,/第一次答錯/); assert.match(b.html,/下一組/);
  assert.equal(b.study.nextCourse('h-a'),'h-ka'); assert.equal(b.study.nextCourse('k-a'),'k-ka'); assert.equal(b.study.nextCourse('k-wa'),'k-ga'); assert.equal(b.study.nextCourse('h-pa'),'h-kya'); assert.equal(b.study.nextCourse('h-pya'),null); assert.equal(b.study.nextCourse('k-pya'),null); assert.equal(b.study.nextCourse('g-identity'),'g-question'); assert.equal(b.study.nextCourse('g-kara-made'),'g-days'); assert.equal(b.study.nextCourse(b.content.grammar[b.content.grammar.length-1].id),null); assert.equal(b.study.nextCourse('s-long'),null);
});

test('katakana special hints distinguish o from wo by character', () => {
 const b=harness(); b.action('open',{course:'k-a'}); for(let i=0;i<4;i++)b.action('next'); assert.doesNotMatch(b.html,/對應平假名/);
 b.action('open',{course:'k-wa'}); b.action('next'); assert.match(b.html,/對應平假名「を」/);
});


test('voice fallback ranking accepts language variants and prioritizes local standard Japanese', () => {
  const cases = [
    [[{name:'remote',lang:'ja-JP',localService:false},{name:'local',lang:'JA_jp',localService:true}], 'local'],
    [[{name:'generic',lang:'ja',localService:true},{name:'regional',lang:'ja-JP',localService:false}], 'generic'],
    [[{name:'Eddy',voiceURI:'eloquence',lang:'ja-JP',localService:true},{name:'other',lang:'ja',localService:true}], 'other'],
  ];
  for(const [voices,name] of cases) { const b=harness(null,voices); b.action('open',{course:'h-a'}); b.action('audio',{index:'0'}); assert.equal(b.utterances[0].voice.name,name); }
  const b=harness(null,[{lang:'javanese'},{lang:'en-US'}]); b.action('open',{course:'h-a'}); b.action('audio',{index:'0'}); assert.equal(b.utterances.length,0);
});

test('malformed or unrelated historical question IDs never become current kana readings', () => {
 const b=harness();
 for(const questionIds of [['h-ka/question/u3042'],['h-a/question/u003c'],['k-a/question/u3042'],['h-a/question/uZZZZ']]) {
  assert.deepEqual([...b.study.retryLabels({courseId:'h-a',courseRevision:'old',questionIds,retryQuestions:[1]})],['第 1 題']);
 }
 assert.deepEqual([...b.study.retryLabels(null)],[]);
});


test('kana feedback gives one mapping then delays retry without revealing it; grammar keeps explanation', () => {
  const b=harness();startQuiz(b,'h-a');const a=b.state.courses['h-a'].active,q=b.practice.current(a.practice),item=b.practice.entry(q.id);
  b.action('answer',{choice:String(chooseCurrent(b,'h-a',true))});
  assert.equal(b.feedback.textContent,`正確答案：${item.character}＝${item.reading}`);
  b.action('next');while(a.practice.round==='first'){b.action('answer',{choice:String(chooseCurrent(b,'h-a'))});b.action('next');}
  assert.equal(a.practice.round,'retry');assert.doesNotMatch(b.html,/正確答案：/);assert.doesNotMatch(b.html,/記憶提示|audio-button/);
  b.action('answer',{choice:String(chooseCurrent(b,'h-a',true))});assert.doesNotMatch(b.feedback.textContent,/＝|正確答案/);b.action('next');assert.equal(a.phase,'done');assert.equal(b.records[0].firstCorrect,4);
  const g=harness();startQuiz(g,'g-identity');const question=g.content.courses['g-identity'].questions[g.state.courses['g-identity'].active.order[0]];
  g.action('answer',{choice:String((question.answer+1)%question.options.length)});assert.ok(g.feedback.textContent.includes(question.explanation));
});

test('bind primes Japanese voices and voice events without auto-playing or changing lesson state', () => {
  const voices=[]; const b=harness(null,voices); assert.equal(b.voiceReads,1); assert.equal(b.utterances.length,0);
  voices.push({name:'Kyoko',lang:'ja-JP',localService:true}); b.voicesReady(); assert.equal(b.voiceReads,2); assert.equal(b.utterances.length,0); assert.equal(b.stored,null);
  b.action('open',{course:'h-a'}); b.action('audio',{index:'0'}); assert.equal(b.utterances.length,1); assert.equal(b.utterances[0].voice.name,'Kyoko');
});

test('all eight named fallback voices rank below standard Japanese even without Eloquence URI', () => {
  for(const name of ['Eddy','Flo','Grandma','Grandpa','Reed','Rocko','Sandy','Shelley']) {
    const fallback={name:`${name} (日文（日本）)`,voiceURI:name,lang:'ja-JP',localService:true};
    const standard={name:'Otoya',lang:'ja-JP',localService:true}; const b=harness(null,[fallback,standard]); b.action('open',{course:'h-a'}); b.action('audio',{index:'0'}); assert.equal(b.utterances[0].voice,standard);
    const only=harness(null,[fallback]); only.action('open',{course:'h-a'}); only.action('audio',{index:'0'}); assert.equal(only.utterances[0].voice,fallback);
  }
});

test('opening and reading a first card stays a private draft even when another course saves', () => {
  const b=harness(); b.render('#study/h-ka'); assert.equal(b.stored,null); assert.equal(b.study.hasProgress('h-ka'),false);
  assert.equal(b.study.currentAttempt('h-ka').cursor,0); const snapshot=b.study.currentAttempt('h-ka'); snapshot.cursor=4; assert.equal(b.study.currentAttempt('h-ka').cursor,0);
  assert.match(b.study.context('#study/h-ka'),/認識第 1 步/);
  b.action('open',{course:'h-a'}); assert.equal(b.stored,null); b.action('next');
  assert.equal(b.study.hasProgress('h-a'),true); assert.equal(b.study.hasProgress('h-ka'),false);
  assert.ok(!b.stored.courses['h-ka']?.active); assert.equal(b.stored.courses['h-a'].active.touched,true);
  b.action('prev'); assert.equal(b.state.courses['h-a'].active.cursor,0); assert.equal(b.study.hasProgress('h-a'),true);
  const reloaded=harness(b.stored); assert.equal(reloaded.study.hasProgress('h-a'),true); assert.equal(reloaded.study.hasProgress('h-ka'),false);
  assert.equal(reloaded.study.currentAttempt('h-ka'),null); assert.equal(reloaded.study.currentAttempt('unknown'),null);
});

test('sanitization preserves touched kana cards and discards persisted untouched drafts', () => {
  const b=harness(); b.render('#study/h-a'); const draft=b.study.currentAttempt('h-a');
  for(const explicit of [true,false]) {
    const saved={script:'h',courses:{'h-a':{active:{...draft,touched:false}}}};
    if (!explicit) delete saved.courses['h-a'].active.touched;
    const restored=harness(saved); assert.equal(restored.study.hasProgress('h-a'),false); assert.equal(restored.state.courses['h-a'].active,null);
  }
  b.action('next'); b.action('prev'); const touched=clone(b.stored); assert.equal(harness(touched).study.hasProgress('h-a'),true);
  delete touched.courses['h-a'].active.touched; touched.courses['h-a'].active.cursor=1; assert.equal(harness(touched).study.hasProgress('h-a'),true);
  touched.courses['h-a'].active.cursor=0; touched.courses['h-a'].active.touched=true; assert.equal(harness(touched).study.hasProgress('h-a'),true);
});

test('completed group stays completed until a replay draft is actually advanced', () => {
  const b=harness(); startQuiz(b,'h-a'); finishQuiz(b,'h-a'); const count=b.records.length, saved=clone(b.stored);
  b.action('restart'); assert.equal(b.study.currentAttempt('h-a').touched,false); assert.equal(new Set(b.study.currentAttempt('h-a').practice.questions.map(q=>q.direction)).size,2);
  assert.deepEqual(b.stored,saved); assert.match(b.render('#kana'),/已完成・可再練/);
  b.render('#study/h-a'); b.action('next'); assert.equal(b.state.courses['h-a'].active.touched,true); assert.equal(new Set(b.state.courses['h-a'].active.practice.questions.map(q=>q.direction)).size,2);
  assert.equal(b.records.length,count); assert.equal(b.study.nextCourse('h-a'),'h-ka');
});


test('draft preview, first-card back, and hidden quiz audio do not create learning progress', () => {
 const b=harness(null,[{name:'Kyoko',lang:'ja-JP',localService:true}]); b.render('#study/h-a');
 b.action('prev'); b.action('audio',{index:'0'}); assert.equal(b.stored,null); assert.equal(b.study.hasProgress('h-a'),false);
 for(let i=0;i<5;i++)b.action('next'); const count=b.utterances.length; b.action('audio',{index:'0'}); assert.equal(b.utterances.length,count);
});


test('short review persists retries without creating course completions or history, and can restart immediately', () => {
 const b=harness();startQuiz(b,'h-ya');const active=b.state.courses['h-ya'].active;const id=b.practice.current(active.practice).id;
 b.action('answer',{choice:String(chooseCurrent(b,'h-ya',true))});
 assert.equal(b.study.reviewSummary().availableCount,1);assert.equal(b.study.reviewSummary().wrongCount,1);
 b.render('#kana');assert.match(b.html,/複習 1 個字/);b.render('#kana-review');assert.match(b.html,/開始複習/);
 const before=clone(b.state.courses);b.action('review-start');assert.equal(b.state.reviewSession.questions.length,1);
 let session=b.state.reviewSession,q=b.practice.current(session);b.action('answer',{choice:String((q.options.indexOf(q.id)+1)%q.options.length)});b.action('next');assert.equal(session.round,'retry');
 const reloaded=harness(b.stored);reloaded.render('#kana-review');assert.equal(reloaded.state.reviewSession.round,'retry');assert.doesNotMatch(reloaded.html,/正確答案/);
 session=reloaded.state.reviewSession;q=reloaded.practice.current(session);reloaded.action('answer',{choice:String((q.options.indexOf(q.id)+1)%q.options.length)});reloaded.action('next');
 assert.equal(session.round,'done');assert.equal(reloaded.study.reviewSummary().wrongCount,1);assert.equal(reloaded.records.length,0);assert.deepEqual(clone(reloaded.state.courses),before);
 assert.match(reloaded.html,/再複習 1 個字/);reloaded.action('review-start');assert.equal(reloaded.state.reviewSession.round,'first');assert.equal(reloaded.state.reviewSession.questions[0].id,id);
});

test('the kana review done page says when first answers were wrong, even if the retry fixed them all', () => {
 const b=harness();startQuiz(b,'h-a');finishQuiz(b,'h-a');
 const play=(missFirst,missRetry)=>{
  b.render('#kana-review');b.action('review-start');const session=b.state.reviewSession;
  for(let guard=0;guard<20&&session.round!=='done';guard++){const q=b.practice.current(session),right=q.options.indexOf(q.id),miss=session.round==='first'?missFirst.includes(session.cursor):missRetry;b.action('answer',{choice:String(miss?(right+1)%q.options.length:right)});b.action('next');}
  assert.equal(session.round,'done','The review round must finish');
  return session;
 };
 const summary=()=>b.render('#kana-review').match(/<h2>複習完成<\/h2>(.*?)<button/)[1];
 play([0,2],false);
 assert.match(summary(),/<p>第一次答錯 2 個字，再考一次都答對了。<\/p>/);
 assert.doesNotMatch(summary(),/這次的字都答對了/,'Two first answers were wrong this round');
 play([],false);
 assert.match(summary(),/<p>這次的字都答對了。<\/p>/);
 const missed=play([1],true).questions[1].id;
 assert.match(summary(),/<p>還可以再練：[^<]+（[a-z]+）<\/p>/);assert.doesNotMatch(summary(),/都答對了/);
 // The done page stays reachable from #kana; a course quiz that fixes the retry miss must not make the retry look right.
 b.render('#kana');startQuiz(b,'h-a');
 const active=b.state.courses['h-a'].active;
 while(b.practice.current(active.practice).id!==missed){b.action('answer',{choice:String(chooseCurrent(b,'h-a'))});b.action('next');}
 b.action('answer',{choice:String(chooseCurrent(b,'h-a'))});
 assert.equal(b.state.kanaReview[missed].wrong,false);
 assert.match(summary(),/<p>第一次答錯 1 個字。<\/p>/);
 assert.equal(b.records.length,1,'Reviews add no record');
});

test('delayed success stays removed after completion and reload with the newer history timestamp', () => {
 const b=harness();startQuiz(b,'h-a');const id=b.practice.current(b.state.courses['h-a'].active.practice).id;finishQuiz(b,'h-a',true);
 assert.equal(b.state.kanaReview[id].wrong,false);const history=clone(b.records);history[0].date=new Date(Date.now()+1000).toISOString();
 const restored=harness(b.stored,[],history);assert.equal(restored.study.reviewSummary().wrongCount,0);assert.equal(restored.state.kanaReview[id].wrong,false);
 assert.equal(history[0].firstCorrect,4);assert.deepEqual(history[0].retryQuestions,[1]);
});

test('the hint box shows origin, comparison and example together, plays the example word, and never shows on a question', () => {
 const b=harness(null,[{lang:'ja-JP'}]);b.loadHints();b.action('open',{course:'h-a'});
 assert.match(b.html,/<p class="hint-title">記憶提示<\/p><dl class="hint-list"><div><dt>字源<\/dt><dd>由漢字「安」草寫變來。<\/dd><\/div><div><dt>比一比<\/dt>/);
 assert.match(b.html,/<button class="audio-button" data-action="study-word-audio" data-letter="あ">[\s\S]*?播放「<span lang="ja">あめ<\/span>」的讀音/);
 assert.doesNotMatch(b.html,/換個記法|study-hint/);
 const attempt=b.study.currentAttempt('h-a');
 b.action('word-audio',{letter:'あ'});
 assert.equal(b.utterances.at(-1).text,'あめ');
 assert.equal(b.stored,null);assert.deepEqual(clone(b.study.currentAttempt('h-a')),clone(attempt));
 b.action('word-audio',{letter:'い'});assert.equal(b.utterances.length,1,'Only the word on the card on screen plays');
 b.action('hint');assert.equal(b.stored,null,'The old switch does nothing');
 assert.match(b.html,/<dt>比一比<\/dt><dd><span lang="ja">お<\/span> 右上多一個點；<span lang="ja">あ<\/span> 沒有。<\/dd>/,'Kana in the Chinese is marked Japanese');
 assert.match(b.html,/關於記憶提示/);
 for(let i=0;i<5;i++)b.action('next');assert.doesNotMatch(b.html,/記憶提示|hint-word/);
 // Every copy of the kana in the example is marked; a card without an origin or an example has no note about them.
 const m=harness(null,[{lang:'ja-JP'}]);m.loadHints();m.action('open',{course:'h-ma'});m.action('next');
 assert.match(m.html,/<span class="hint-word" lang="ja"><mark>み<\/mark><mark>み<\/mark><\/span>/);
 m.action('open',{course:'h-ga'});
 assert.match(m.html,/<dt>濁點<\/dt>/);assert.match(m.html,/關於記憶提示/);
});

test('grammar still requires a correct retry and preserves its live region and first score', () => {
 const b=harness();startQuiz(b,'g-identity');const active=b.state.courses['g-identity'].active,renders=b.renders,nodes=b.answers,feedback=b.feedback;
 b.action('answer',{choice:String(chooseCurrent(b,'g-identity',true))});assert.equal(b.next.disabled,true);b.action('next');assert.equal(active.cursor,0);
 b.action('answer',{choice:String(chooseCurrent(b,'g-identity'))});assert.equal(b.renders,renders);assert.equal(b.answers,nodes);assert.equal(b.feedback,feedback);assert.equal(b.next.disabled,false);assert.equal(b.focused,'[data-action="study-next"]');
 finishQuiz(b,'g-identity');assert.equal(b.records[0].firstCorrect,b.content.courses['g-identity'].questions.length-1);
});

test('grammar examples can be played and Japanese quiz options show romaji', () => {
  const b = harness(null, [{ lang: 'ja-JP' }]);
  b.action('open', { course: 'g-identity' });
  assert.match(b.html, /data-action="study-audio"/);
  b.action('audio', { index: '1' }); assert.equal(b.utterances.at(-1).text, 'わたしは がくせいです。', 'The complete sentence preview plays while still on the vocabulary card');
  b.action('audio', { index: '0' }); assert.equal(b.utterances.at(-1).text, 'わたし、がくせい');
  assert.match(b.html, /data-audio-for="g-identity-0"/);
  assert.match(b.html, /data-audio-for="g-identity-1"/);
  b.action('next'); b.action('audio', { index: '1' }); assert.equal(b.utterances.at(-1).text, 'わたしは がくせいです。');
  b.action('next'); b.action('next');
  // Question order is shuffled; answer the plain-romaji question first if it comes up.
  if (!/option-reading/.test(b.html)) { b.action('answer', { choice: '1' }); b.action('next'); }
  assert.match(b.html, /<span lang="ja">です<\/span><span class="option-reading">desu<\/span>/);
  b.render('#grammar');
  assert.doesNotMatch(b.html, /reading-help|日文下方的英文字母怎麼看/);
  b.render('#kana');
  assert.match(b.html, /每格下方的英文字母是羅馬音/);
  assert.match(b.html, /<details class="phrase-more reading-help"><summary>日文下方的英文字母怎麼看？<\/summary>/);
  assert.match(b.html, /ou、ei 也常念成長音/);
});

test('ぢ／づ cards say up front that they share a reading with じ／ず', () => {
  const b = harness();
  b.action('open', { course: 'h-da' }); b.action('next');
  assert.match(b.html, /ぢ 和 じ 同音，都讀 ji/);
  b.action('open', { course: 'k-da' }); b.action('next'); b.action('next');
  assert.match(b.html, /ヅ 和 ズ 同音，都讀 zu/);
});

test('the kana table pairs every character with its romaji from the lesson data, and the quiz shows none', () => {
  const b = harness(null, [{ lang: 'ja-JP' }]);
  for (const script of ['h', 'k']) {
    b.render('#kana'); b.action('script', { script });
    const html = b.render('#kana');
    const ids = Object.values(b.content.rowGroups).flat().map((row) => `${script}-${row}`);
    for (const id of ids) {
      const course = b.content.courses[id];
      const rowHtml = html.match(new RegExp(`data-course="${id}">([\\s\\S]*?)</button>`))[1];
      const cells = [...rowHtml.matchAll(/<span class="kana-cell"><span lang="ja">([^<]+)<\/span><span class="kana-roman">([^<]+)<\/span><\/span>/g)].map((m) => [m[1], m[2]]);
      assert.deepEqual(cells, [...course.letters].map((letter, i) => [letter, course.readings[i]]), id);
      const name = course.row.endsWith('行') ? `${course.letters[0]}行` : course.letters.join('・');
      assert.ok(rowHtml.includes(`<strong lang="ja">${name}</strong>`), `${id}: group title uses the selected script`);
      assert.ok(rowHtml.includes(`data-count="${course.letters.length}"`), `${id}: three-character groups have three cells, without misleading vowel columns`);
      assert.match(rowHtml, /學這組/);
    }
  }
  const pairs = (id) => Object.fromEntries(b.content.courses[id].letters.map((letter, i) => [letter, b.content.courses[id].readings[i]]));
  assert.deepEqual([pairs('h-sa').し, pairs('h-ta').ち, pairs('h-ta').つ, pairs('h-ha').ふ, pairs('h-wa').を, pairs('h-wa').ん, pairs('k-wa').ヲ, pairs('h-da').ぢ, pairs('h-da').づ], ['shi', 'chi', 'tsu', 'fu', 'o', 'n', 'o', 'ji', 'zu']);
  startQuiz(b, 'h-ka');
  assert.doesNotMatch(b.html, /kana-roman|row-roman/, 'The quiz gives no romaji away');
});

test('audio buttons say what is visible, keyword boxes are not repeated landmarks, kana rows are marked Japanese', () => {
  const b = harness(null, [{ lang: 'ja-JP' }]);
  b.render('#travel/t-order');
  assert.doesNotMatch(b.html, /aria-label="播放/);
  // One speaker per phrase: an icon hidden from screen readers, named by the Japanese it plays; no engine notes.
  const names = [...b.html.matchAll(/<button class="audio-button"[^>]*><svg[^>]*aria-hidden="true">[\s\S]*?<\/svg><span class="visually-hidden">播放「<span lang="ja">([^<]+)<\/span>」的讀音<\/span><\/button>/g)].map((m) => m[1]);
  const order = b.content.phrasebook.find((c) => c.id === 't-order');
  for (const step of order.steps) {
    assert.ok(names.includes(step.example.replace(/&/g, '&amp;')), step.example);
    if (step.polite) assert.ok(names.includes(step.polite.replace(/&/g, '&amp;')), step.polite);
  }
  assert.equal(names.length, (b.html.match(/class="audio-button"/g) || []).length, 'Every speaker has a name');
  assert.doesNotMatch(b.html, /裝置合成語音|>播放讀音</);
  // Kana cards, grammar cards and 我的常用語 use the same speaker.
  const speakerFor = (html, action, text) => new RegExp(`<button class="audio-button" data-action="${action}"[^>]*><svg[^>]*aria-hidden="true">[\\s\\S]*?</svg><span class="visually-hidden">播放「<span lang="ja">${text}</span>」的讀音</span></button>`).test(html);
  b.action('open', { course: 'h-a' });
  assert.ok(speakerFor(b.html, 'study-audio', 'あ'));
  b.action('open', { course: 'g-identity' });
  assert.ok(speakerFor(b.html, 'study-audio', b.content.courses['g-identity'].steps[0].example));
  const phrase = order.steps[0];
  const saved = harness(null, [{ lang: 'ja-JP' }], [], { favorites: [phrase.id] });
  assert.ok(speakerFor(saved.render('#travel/favorites'), 'study-travel-audio', phrase.example));
  for (const html of [b.html, saved.html]) assert.doesNotMatch(html, /裝置合成語音|>播放讀音</);
  assert.doesNotMatch(b.html, /<section class="keyword-box"|aria-label="關鍵字"/);
  b.render('#kana');
  assert.match(b.html, /<strong lang="ja">あ行<\/strong>/);
  b.render('#grammar');
  assert.match(b.html, /<span class="course-subtitle">/);
});

test('travel pages show staff questions and Japanese keywords; study headers keep the return route', () => {
  const b = harness();
  b.render('#travel');
  // Situations come in four groups, each with its own colour, and the saved phrases' arrow is not read out.
  assert.match(b.html, /<h2 id="travel-group-1">吃飯與購物<\/h2><p>點餐、內用外帶、結帳、買東西<\/p>/);
  assert.deepEqual([...b.html.matchAll(/class="travel-group tone-([a-z]+)"/g)].map((m) => m[1]), ['purple', 'apricot', 'aqua', 'rose']);
  assert.match(b.html, /<a class="course-row favorites-entry" href="#travel\/favorites"><strong>我的常用語<\/strong><span class="favorites-count">0 張收藏<span aria-hidden="true"> →<\/span><\/span><\/a>/);
  // Each card is named by its title and Chinese line, and shows two or three of its own words: Chinese first, never a
  // word that reads the same in Chinese (出口), never a meaning twice, and a pair stays together.
  assert.match(b.html, /<span class="travel-words"><span class="travel-word">結帳<span lang="ja">お会計<\/span><\/span><span class="travel-word">信用卡<span lang="ja">カード<\/span><\/span><span class="travel-word">西瓜卡<span lang="ja">Suica<\/span><\/span><\/span>/);
  assert.match(b.html, /<span class="travel-word">內用<span lang="ja">店内<\/span><\/span><span class="travel-word">外帶<span lang="ja">持ち帰り<\/span><\/span>/);
  assert.doesNotMatch(b.html, /<span lang="ja">(お願いします|これ|どこ|出口|一日券)<\/span><\/span>/);
  for (const item of b.content.phrasebook) {
    const cards = b.html.match(new RegExp(`<a class="course-row" href="#travel/${item.id}"[\\s\\S]*?</a>`, 'g')) || [];
    assert.equal(cards.length, 1, `${item.id} appears once`);
    assert.match(cards[0], new RegExp(`aria-labelledby="travel-${item.id}-name travel-${item.id}-note"><span><strong id="travel-${item.id}-name">`));
    assert.doesNotMatch(item.subtitle, /^[぀-ヿ]/, `${item.id}: the Chinese line starts in Chinese`);
    const words = [...cards[0].matchAll(/<span class="travel-word">([^<]+)<span lang="ja">([^<]+)<\/span><\/span>/g)].map(([, meaning, word]) => ({ meaning, word }));
    // Three words a card (two for 交通卡加值, which has only two to show): a misspelt pick would quietly drop one.
    assert.equal(words.length, item.id === 't-charge' ? 2 : 3, `${item.id}: ${words.length} words`);
    const keywords = item.steps.flatMap((step) => step.keywords);
    for (const { meaning, word } of words) {
      assert.notEqual(meaning, word, `${item.id}: ${word}`);
      assert.ok(keywords.some(([w, , m]) => w.replace(/（.*?）/u, '') === word && m.split('／')[0] === meaning), `${item.id}: ${word} is one of its keywords`);
    }
    assert.equal(new Set(words.map(({ meaning }) => meaning)).size, words.length, `${item.id}: no meaning twice`);
  }
  // On the kana table, the basic rows have their own heading after the random practice box.
  b.render('#kana');
  assert.match(b.html, /<section[^>]*aria-labelledby="kana-basic-heading"><h2 id="kana-basic-heading"[^>]*>基本字<\/h2>/);
  assert.ok(b.html.indexOf('<h2>五十音隨機練習</h2>') < b.html.indexOf('id="kana-basic-heading"'));
  b.render('#travel');
  b.render('#travel/dining');
  assert.match(b.html, /<p class="staff-asks"><span class="staff-asks-label">對方可能會問<\/span><span lang="ja">店内でお召し上がりですか？<\/span>/);
  b.render('#kana');
  assert.match(b.html.split("</header>")[0], /href="#kana" aria-current="page"/);
  assert.match(b.html, /class="exit" href="#home"/);
});

test('contracted-sound cards show their hint and special-sound lessons return to the kana page', () => {
  const b = harness(null, [{ lang: 'ja-JP' }]);
  b.action('open', { course: 'h-kya' });
  assert.match(b.html, /<div class="kana-character" lang="ja">きゃ<\/div>/);
  b.action('audio', { index: '0' }); assert.equal(b.utterances.at(-1).text, 'きゃ');
  b.action('open', { course: 's-sokuon' });
  assert.match(b.html, /發音說明 · 1 \/ 3/);
  assert.match(b.html, /href="#kana"/);
  assert.match(b.html, /回五十音/);
  for (let i = 0; i < 3; i++) b.action('next');
  assert.equal(b.state.courses['s-sokuon'].active.phase, 'quiz');
  b.render('#grammar');
  assert.doesNotMatch(b.html, /s-sokuon|s-long/, 'Special-sound lessons are not grammar lessons');
});

test('history labels decode contracted-sound question IDs even after the course changes', () => {
  const b = harness();
  const entry = { courseId: 'h-kya', courseRevision: 'old', total: 3, firstCorrect: 1, retryQuestions: [1, 3], questionIds: ['h-kya/question/u304d-3083', 'h-kya/question/u304d-3085', 'h-kya/question/u304d-3087'] };
  assert.deepEqual([...b.study.retryLabels(entry)], ['きゃ', 'きょ']);
  assert.deepEqual([...b.study.retryLabels({ ...entry, questionIds: ['h-kya/question/u30ad-3083', 'x', 'y'] })], ['第 1 題', '第 3 題'], 'Katakana code points in a hiragana course are not trusted');
});

test('every travel situation except help links to the help situation', () => {
  const b = harness();
  for (const category of b.content.phrasebook) {
    b.render(`#travel/${category.id}`);
    if (category.id === 'basics') assert.doesNotMatch(b.html, /需要幫忙時/);
    else assert.match(b.html, /<a class="text-button" href="#travel\/basics">需要幫忙時<\/a>/, category.id);
  }
});

test('a wrong grammar answer links to its explanation card and returns to the same question without changing the score', () => {
  const b = harness();
  startQuiz(b, 'g-place');
  const active = b.state.courses['g-place'].active;
  const q = active.order[active.cursor];
  const question = b.content.courses['g-place'].questions[q];
  const wrong = question.options.findIndex((_, i) => i !== question.answer);
  b.action('answer', { choice: String(wrong) });
  const cardId = b.content.lessonPlan['g-place'].review[question.id];
  const index = b.content.courses['g-place'].steps.findIndex((s) => s.id === cardId);
  assert.match(b.slot.innerHTML, new RegExp(`data-action="study-look" data-card="${index}">回看說明：`), 'A wrong answer fills the link in place');
  assert.match(b.render(`#study/g-place`), new RegExp(`data-action="study-look" data-card="${index}">回看說明：`));
  b.action('look', { card: String(index) });
  assert.equal(active.phase, 'cards'); assert.equal(active.cursor, index);
  assert.match(b.html, /data-action="study-resume">回到第 \d+ 題/);
  const reloaded = harness(b.stored); reloaded.render('#study/g-place');
  assert.match(reloaded.html, /回到第 \d+ 題/, 'Looking back survives a reload');
  b.action('resume');
  assert.equal(active.phase, 'quiz'); assert.equal(active.order[active.cursor], q);
  assert.equal(active.first[q], false, 'The first answer stays wrong');
  assert.equal(b.records.length, 0, 'Looking back never records a completion');
  b.action('answer', { choice: String(question.answer) });
  assert.equal(b.slot.innerHTML, '', 'Solving clears the link in place');
  assert.doesNotMatch(b.render('#study/g-place'), /data-action="study-look"/, 'No look-back link once solved');
});

test('the last card leads back to the question once the quiz has answers', () => {
  const b = harness();
  startQuiz(b, 'g-place');
  const active = b.state.courses['g-place'].active;
  const question = b.content.courses['g-place'].questions[active.order[active.cursor]];
  b.action('answer', { choice: String(question.options.findIndex((_, i) => i !== question.answer)) });
  const last = b.content.courses['g-place'].steps.length - 1;
  b.action('look', { card: String(last) });
  assert.equal(active.cursor, last);
  assert.match(b.html, /<button class="primary" data-action="study-resume">回到第 \d+ 題<\/button><\/div>/);
  assert.doesNotMatch(b.html, /開始練習|data-action="study-next"/, 'Only one way forward on the last card');
  b.action('prev');
  assert.match(b.html, /<button class="text-button" data-action="study-resume">回到第 \d+ 題<\/button><button class="primary" data-action="study-next">下一張 →/);
});

test('the grammar result page offers the next lesson', () => {
  const b = harness();
  startQuiz(b, 'g-identity'); finishQuiz(b, 'g-identity');
  assert.match(b.html, /data-action="study-open" data-course="g-question">下一課：問對方：你是學生嗎？/);
});

// Grammar mini-review (#44): read the current question from the page, as a learner would.
const unescapeHTML = (text) => text.replace(/&(amp|lt|gt|quot|#39);/g, (_, name) => ({ amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'" })[name]);
// The progress line names no lesson (that would give the answer away), so the question is the one a report would name,
// checked against the prompt on the page.
function reviewQuestion(b) {
  assert.match(b.html, /複習 · \d+ \/ \d+ · 選一個答案<\/p>/);
  const prompt = unescapeHTML(b.html.match(/<section class="study-card study-quiz"><h2>([^<]*)<\/h2>/)[1]);
  const { courseId, questionId } = b.study.currentReview();
  const course = b.content.courses[courseId], question = course.questions.find((q) => q.id === questionId);
  assert.equal(question.prompt, prompt);
  return { course, question };
}
function playReview(b, wrongAt = []) {
  const seen = [];
  for (let step = 0; step < 10 && /複習 · \d+ \/ \d+/.test(b.html); step++) {
    const { course, question } = reviewQuestion(b);
    seen.push([course.id, question.id]);
    if (wrongAt.includes(step)) {
      b.action('answer', { choice: String(question.options.findIndex((_, i) => i !== question.answer)) });
      assert.match(b.feedback.textContent, /^正確答案：/);
      const card = course.steps.find((s) => s.id === b.content.lessonPlan[course.id].review[question.id]);
      assert.ok(b.slot.innerHTML.includes(`<summary>回看說明：${card.title}</summary>`), 'A wrong answer opens the explaining card in place');
      assert.equal(b.next.disabled, true);
    }
    b.action('answer', { choice: String(question.answer) });
    assert.equal(b.slot.innerHTML, ''); assert.equal(b.next.disabled, false);
    b.action('answer', { choice: String(question.options.findIndex((_, i) => i !== question.answer)) });
    assert.match(b.feedback.textContent, /^答對了/, 'Clicking again after solving changes nothing');
    b.action('next');
  }
  return seen;
}

test('grammar mini-review mixes completed lessons and saves independently of lesson records and scores', () => {
  const b = harness();
  assert.doesNotMatch(b.render('#grammar'), /grammar-review/, 'No review before two lessons are complete');
  assert.match(b.render('#grammar-review'), /先完成兩課句型/);
  for (const id of ['g-identity', 'g-question', 'g-demo']) { startQuiz(b, id); finishQuiz(b, id); }
  const courses = JSON.stringify(b.state.courses), saves = b.saves, records = b.records.length;
  assert.match(b.render('#grammar'), /<a class="text-button" href="#grammar-review">複習 5 題<\/a>/);
  b.render('#grammar-review'); b.action('grammar-review');
  assert.match(b.study.context('#grammar-review'), /^句型小複習・第 1 題・/);
  const seen = playReview(b, [0]);
  assert.equal(seen.length, 5);
  assert.equal(new Set(seen.map(([, q]) => q)).size, 5, 'No question repeats in a round');
  for (const id of new Set(seen.map(([c]) => c))) {
    assert.ok(['g-identity', 'g-question', 'g-demo'].includes(id), 'Only completed lessons');
    assert.ok(seen.filter(([c]) => c === id).length <= 2, 'At most two per lesson with three lessons done');
  }
  assert.match(b.html, /複習完成/); assert.match(b.html, /第一次答對 <strong>4 \/ 5<\/strong> 題/);
  assert.match(b.html, new RegExp(`data-action="study-open" data-course="${seen[0][0]}"`), 'Links back to the lesson with a mistake');
  assert.equal(b.study.context('#grammar-review'), '句型小複習・完成頁');
  assert.equal(JSON.stringify(b.state.courses), courses, 'Lesson progress and scores stay the same');
  assert.ok(b.saves > saves, 'Review progress is saved');
  assert.equal(b.records.length, records, 'Nothing is recorded');
  const reloaded = harness(b.stored); assert.match(reloaded.render('#grammar-review'), /複習完成/, 'A reload retains the completed round');
});

test('grammar mini-review puts first-time mistakes from the latest record first', () => {
  const history = [];
  const b = harness(undefined, [], history);
  for (const id of ['g-identity', 'g-question']) { startQuiz(b, id); finishQuiz(b, id); }
  const ids = b.content.courses['g-question'].questions.map((q) => q.id);
  assert.match(b.render('#grammar'), /複習 4 題/, 'The first two lessons have two questions each, so the round says 4');
  history.push({ date: '2026-10-01T00:00:00.000Z', courseId: 'g-question', questionIds: ids, total: ids.length, firstCorrect: ids.length - 1, retryQuestions: [1] });
  history.push({ date: '2026-10-02T00:00:00.000Z', courseId: 'g-question', questionIds: ids, total: ids.length, firstCorrect: ids.length - 1, retryQuestions: [2] });
  for (let round = 0; round < 6; round++) {
    b.render('#grammar-review'); b.action('grammar-review');
    const seen = playReview(b);
    assert.equal(seen.length, 4);
    assert.ok(seen.some(([, q]) => q === ids[1]), 'The latest record decides which mistakes come first');
    for (const id of ['g-identity', 'g-question']) assert.ok(seen.filter(([c]) => c === id).length <= 3, 'At most three per lesson with two lessons done');
  }
});
test('grammar mini-review: latest-record mistakes fill the per-lesson cap (3 with two lessons, 2 with more)', () => {
  const history = [], b = harness(undefined, [], history);
  for (const id of ['g-demo', 'g-place']) { startQuiz(b, id); finishQuiz(b, id); }
  const ids = b.content.courses['g-place'].questions.map((q) => q.id);
  const add = (date, retryQuestions) => history.push({ date, courseId: 'g-place', questionIds: ids, total: 3, firstCorrect: 3 - retryQuestions.length, retryQuestions });
  add('2026-10-01T00:00:00.000Z', [1]); add('2026-10-02T00:00:00.000Z', [2, 3]);
  const fresh = () => { const legacy = clone(b.stored); delete legacy.grammarReview; const r = harness(legacy, [], history); r.render('#grammar-review'); r.action('grammar-review'); return playReview(r); };
  for (let round = 0; round < 5; round++) {
    const seen = fresh();
    assert.equal(seen.length, 5, 'Two lessons of three questions still make five');
    assert.ok([ids[1], ids[2]].every((id) => seen.some(([, q]) => q === id)), 'Both latest mistakes are in');
    assert.equal(new Set(seen.map(([, q]) => q)).size, seen.length, 'A mistake is not asked twice');
  }
  startQuiz(b, 'g-kono'); finishQuiz(b, 'g-kono');
  for (let round = 0; round < 5; round++) {
    assert.deepEqual(fresh().filter(([c]) => c === 'g-place').map(([, q]) => q).sort(), [ids[1], ids[2]].sort(), 'The latest mistakes fill the cap of two; the older one never does');
  }
});

test('grammar mini-review: labels give the real size, and only completed grammar lessons are used', () => {
  const b = harness();
  for (const id of ['g-identity', 'g-question']) { startQuiz(b, id); finishQuiz(b, id); }
  startQuiz(b, 'g-demo'); b.action('answer', { choice: '0' });
  for (const lesson of b.content.sounds) { startQuiz(b, lesson.id); finishQuiz(b, lesson.id); }
  assert.match(b.render('#grammar'), /複習 4 題/);
  b.render('#grammar-review'); b.action('grammar-review');
  const seen = playReview(b);
  assert.equal(seen.length, 4);
  assert.ok(seen.every(([c]) => ['g-identity', 'g-question'].includes(c)), 'No unfinished or special-sound lesson');
  assert.match(b.html, /再複習 4 題/);
});

test('grammar mini-review resumes after leaving, ignores stray input and resets with a new state object', () => {
  const b = harness();
  for (const id of ['g-identity', 'g-question', 'g-demo']) { startQuiz(b, id); finishQuiz(b, id); }
  b.render('#grammar-review'); b.action('grammar-review');
  const saves = b.saves; b.feedback.textContent = '';
  b.action('answer', { choice: '9' }); b.action('look', { card: '0' }); b.action('restart'); b.action('next');
  assert.equal(b.feedback.textContent, ''); assert.match(b.study.context('#grammar-review'), /第 1 題/);
  const { question } = reviewQuestion(b);
  b.action('answer', { choice: String(question.answer) });
  b.action('answer', { choice: String(question.options.findIndex((_, i) => i !== question.answer)) });
  assert.equal(b.next.disabled, false, 'A click after solving keeps the way forward');
  assert.match(b.render('#grammar'), /繼續複習/);
  assert.match(b.render('#grammar-review'), /✓ 答對了/, 'Coming back shows the same solved question');
  b.action('next'); playReview(b);
  assert.match(b.html, /第一次答對 <strong>5 \/ 5<\/strong> 題/, 'Out-of-range choices never count as a first answer');
  assert.ok(b.saves > saves);
  b.state = clone(b.state);
  assert.match(b.render('#grammar-review'), /複習完成/, 'Replacing state preserves the saved round');
});

test('grammar mini-review: 再複習 moves questions answered right last round to the back', () => {
  const b = harness();
  for (const id of ['g-identity', 'g-question', 'g-demo', 'g-place', 'g-kono']) { startQuiz(b, id); finishQuiz(b, id, true); }
  const history = b.records.map((r, i) => ({ ...r, id: `r${i}` }));
  const r = harness(b.stored, [], history);
  r.render('#grammar-review'); r.action('grammar-review');
  const first = playReview(r).map(([, q]) => q);
  r.action('grammar-review');
  const second = playReview(r).map(([, q]) => q);
  assert.equal(second.filter((q) => first.includes(q)).length, 0, 'With enough other questions, the next round is all new');
});

test('grammar review survives reload with exact order, answers and choices, without changing course scores', () => {
  const b = harness();
  for (const id of ['g-identity','g-question','g-demo']) { startQuiz(b,id); finishQuiz(b,id); }
  const lessons = JSON.stringify(b.state.courses);
  b.render('#grammar-review'); b.action('grammar-review');
  const {question} = reviewQuestion(b);
  b.action('answer',{choice:String((question.answer+1)%question.options.length)});
  const saved = clone(b.stored);
  assert.ok(saved.grammarReviewSession);
  b.action("grammar-review");assert.deepEqual(clone(b.state.grammarReviewSession),saved.grammarReviewSession,"Repeated start resumes instead of replacing a round");
  const r = harness(saved); r.render('#grammar-review');
  assert.equal(reviewQuestion(r).question.id,question.id);
  assert.deepEqual(clone(r.state.grammarReviewSession),saved.grammarReviewSession);
  assert.match(r.html,/正確答案/);
  r.action('answer',{choice:String(question.answer)});
  assert.equal(r.state.grammarReview[question.id].wrong,true,'An immediate retry does not erase a first miss');
  r.action('next'); playReview(r);
  assert.deepEqual(clone(r.state.courses),JSON.parse(lessons));
  assert.equal(r.records.length,0);
  const done = harness(r.stored); assert.match(done.render('#grammar-review'),/複習完成/);
  done.study.clearReview(); assert.equal(done.state.grammarReviewSession,null);
  assert.deepEqual(clone(done.state.grammarReview),{});
});

test('grammar review rejects corrupted, stale and unlearned sessions without losing earned completion', () => {
  const b = harness();
  for (const id of ['g-identity','g-question']) { startQuiz(b,id); finishQuiz(b,id); }
  b.render('#grammar-review'); b.action('grammar-review');
  for (const corrupt of [s=>s.grammarReviewSession.items[0].courseRevision='old',s=>s.grammarReviewSession.items[0].questionId='unknown',s=>s.grammarReviewSession.items[0].options=[0,0,0],s=>s.grammarReviewSession.done=true,s=>s.grammarReviewSession.cursor=99,s=>s.courses[s.grammarReviewSession.items[0].courseId].completedAt=null]) {
    const saved=clone(b.stored); corrupt(saved);
    const r=harness(saved); assert.equal(r.state.grammarReviewSession,null);
    assert.equal(r.state.courses['g-question'].attempts,1);
  }
});

test('resume target follows meaningful grammar activity and ignores merely opened cards', () => {
  const b=harness(); b.action('open',{course:'g-identity'}); b.action('next');
  b.action('open',{course:'g-question'});
  assert.equal(b.study.grammarNext().courseId,'g-identity');
  b.action('next'); assert.equal(b.study.grammarNext().courseId,'g-question');
  const r=harness(b.stored); assert.equal(r.study.grammarNext().courseId,'g-question');
  assert.match(r.render('#grammar'),/接著學/);
  const finished=harness({courses:Object.fromEntries(b.content.grammar.map(c=>[c.id,{completedAt:'2026-01-01T00:00:00Z',attempts:1}]))});
  assert.equal(finished.study.grammarNext(),null);
  assert.match(finished.render('#grammar'),/複習學過的句型/);
});

test('speed preferences survive reload and affect speech; a hint choice saved by an older version changes nothing', () => {
  const b=harness(null,[{lang:'ja-JP'}]);b.loadHints();
  b.render('#settings');assert.doesNotMatch(b.html,/記法/,'No hint choice is left to remember');b.action('rate',{rate:'0.65'});
  const r=harness(null,[{lang:'ja-JP'}],[],{preferences:{...b.preferences,kanaHints:{'あ':1}}});r.loadHints();r.action('open',{course:'h-a'});
  assert.match(r.html,/<dt>字源<\/dt>[\s\S]*<dt>比一比<\/dt>[\s\S]*<dt>例子<\/dt>/,'Every hint shows, whatever the old choice was');
  r.action('audio',{index:'0'});assert.equal(r.utterances.at(-1).rate,0.65);
  r.render('#travel/t-pay');r.action('travel-audio',{course:'t-pay',index:'0',full:'0'});r.flushTimers();
  assert.equal(r.utterances.at(-1).rate,0.65);
  r.blockLocalWrites();r.render('#settings');r.action('rate',{rate:'1'});assert.equal(r.preferences.ttsRate,0.65);
  assert.equal(r.preferences.kanaHints['あ'],1,'The old choice is kept as it was');
});

test('travel favorites are independent of course progress, render saved cards and allow playback and removal', () => {
  const b=harness(null,[{lang:'ja-JP'}]); const step=b.content.phrasebook.find(p=>p.id==='t-pay').steps[0];
  b.render('#travel/t-pay');b.action('favorite',{phrase:step.id});
  assert.deepEqual(b.favorites,[step.id]); assert.equal(b.saves,0); assert.equal(b.records.length,0);
  const r=harness(null,[{lang:'ja-JP'}],[],{favorites:b.favorites});
  assert.match(r.render('#travel/favorites'),new RegExp(step.title));
  r.action('travel-audio',{course:'t-pay',index:'0',full:'0'});assert.equal(r.utterances.length,1);
  r.action('favorite',{phrase:step.id}); assert.match(r.html,/還沒有收藏/);
  r.action('favorite',{phrase:'not-real'});assert.deepEqual(r.favorites,[]);
  r.blockLocalWrites();r.action('favorite',{phrase:step.id});assert.deepEqual(r.favorites,[]);
});

test('a fresh correct review answer clears an old mistake and a later wrong answer adds it back', () => {
  const b=harness();for(const id of ['g-identity','g-question']){startQuiz(b,id);finishQuiz(b,id);}
  b.render('#grammar-review');b.action('grammar-review');
  const {question}=reviewQuestion(b);b.action('answer',{choice:String((question.answer+1)%question.options.length)});
  playReview(b); assert.equal(b.state.grammarReview[question.id].wrong,true);
  b.action('grammar-review');playReview(b);assert.equal(b.state.grammarReview[question.id].wrong,false);
});

// Port of Jabiko srs.test.ts "re-adds a question that is missed again after being cleared" (#37).
test('a kana character answered right leaves the mistake pool, and a later wrong answer puts it back', () => {
  const b=harness();startQuiz(b,'h-a');
  const id=b.practice.current(b.state.courses['h-a'].active.practice).id, item=b.practice.entry(id), label=`${item.character}（${item.reading}）`;
  const pool=()=>[...b.study.reviewSummary().wrongLabels];
  assert.deepEqual(pool(),[]);
  b.action('answer',{choice:String(chooseCurrent(b,'h-a',true))});
  assert.deepEqual(pool(),[label],'A miss enters the pool at once');
  b.action('next');finishQuiz(b,'h-a');
  assert.equal(b.state.kanaReview[id].wrong,false);assert.deepEqual(pool(),[],'One right answer takes it out');
  b.render('#kana-review');b.action('review-start');
  const session=b.state.reviewSession;
  for(let guard=0;guard<5&&b.practice.current(session).id!==id;guard++){const q=b.practice.current(session);b.action('answer',{choice:String(q.options.indexOf(q.id))});b.action('next');}
  const q=b.practice.current(session);assert.equal(q.id,id);
  b.action('answer',{choice:String((q.options.indexOf(id)+1)%q.options.length)});
  assert.deepEqual(pool(),[label],'Missed again after being cleared: back in');
  assert.equal(b.practice.selectReview(b.state.kanaReview,b.state.courses)[0],id,'and first in the next round');
});

test('extreme saved dates are dropped, so answering kana never throws', () => {
  // +1ms on a year-275760 date overflows toISOString(); such dates only come from hand-edited data.
  const far = '+275760-09-13T00:00:00.000Z', id = 'h-a/question/u3042';
  const b = harness({ reviewClearedAt: far, kanaReview: { [id]: { lastSeen: far, wrong: true } } });
  assert.equal(b.state.reviewClearedAt, null);
  assert.equal(b.state.kanaReview[id], undefined);
  startQuiz(b, 'h-a');
  assert.doesNotThrow(() => b.action('answer', { choice: String(chooseCurrent(b, 'h-a')) }));
  for (const item of Object.values(b.state.kanaReview)) assert.match(item.lastSeen, /^\d{4}-/);
});


test('lesson phases follow a saved attempt through cards, quiz, reload and completion', () => {
  const b = harness(null);
  b.action('open', { course: 'g-identity' });
  const phase = html => html.match(/<li aria-current="step"><span aria-hidden="true">\d<\/span>([^<]+)/)?.[1];
  assert.equal(phase(b.html), '看說明');
  assert.match(b.html, /介紹自己：我是學生/);
  assert.match(kanaHtml(b.html), /わたし<\/span><span class="example-reading">watashi<\/span><span class="part-meaning">我/);
  for (let i = 0; i < 3; i++) b.action('next');
  assert.equal(phase(b.html), '做練習');
  const restored = harness(b.stored);
  restored.render('#study/g-identity');
  assert.equal(phase(restored.html), '做練習');
  assert.deepEqual(clone(restored.state.courses['g-identity'].active), clone(b.state.courses['g-identity'].active));
  finishQuiz(restored, 'g-identity');
  assert.equal(phase(restored.html), '完成');
  assert.equal(restored.records.length, 1);
});

test('display annotations pair authored words with readings without changing course revisions', () => {
  const b = harness(null);
  const normalize = value => value.replace(/[\s／/。]/gu, '');
  for (const [id, presentation] of Object.entries(b.content.lessonPresentation)) {
    const course = b.content.getCourse(id);
    assert.ok(course);
    assert.equal(b.content.courseRevision(id), b.content.revisionOf(course));
    assert.ok(Object.isFrozen(presentation.parts));
    for (const [cardId, parts] of Object.entries(presentation.parts)) {
      const step = course.steps.find(step => step.id === cardId);
      assert.ok(step, cardId);
      assert.equal(normalize(parts.map(p => p[0]).join('')), normalize(step.example));
      assert.equal(normalize(parts.map(p => p[1]).join('')), normalize(step.reading));
      for (const tuple of parts) assert.ok(tuple.length === 3 && tuple.every(v => typeof v === 'string' && v.trim()));
    }
  }
  b.action('open', { course: 'g-no' });
  assert.match(b.html, /class="grammar-example" lang="ja"/);
  assert.match(b.html, /class="example-reading"/);
});

test('grammar retry explains the next action and reveals the right choice without changing the first score', () => {
  const b = harness(); startQuiz(b, 'g-identity');
  const active=b.state.courses['g-identity'].active, q=active.order[active.cursor], question=b.content.courses['g-identity'].questions[q];
  assert.doesNotMatch(b.html,/✓ 正確答案|請選一次正確答案/,'Never leak the answer before an attempt');
  b.action('answer',{choice:String(question.options.findIndex((_,i)=>i!==question.answer))});
  assert.match(b.feedback.textContent,/請選一次正確答案，再繼續/);
  assert.equal(b.next.disabled,true);
  const right=b.answers.find(n=>Number(n.dataset.choice)===question.answer);
  assert.match(right.mark.textContent,/✓ 正確答案/);
  const reloaded=harness(b.stored); reloaded.render('#study/g-identity');
  assert.doesNotMatch(reloaded.html,/✓ 正確答案/, "Reload resets temporary hints, but retains the first score");
  assert.equal(reloaded.state.courses['g-identity'].active.first[q],false);
  assert.match(reloaded.html,/data-action="study-next" disabled/);
  reloaded.action('answer',{choice:String(question.answer)});
  assert.equal(reloaded.next.disabled,false);
  assert.equal(reloaded.state.courses['g-identity'].active.first[q],false);
});


test('all grammar lessons have beginner titles, while optional notes keep the core rule visible', () => {
  const b=harness();
  for(const course of b.content.grammar){
    assert.ok(b.content.lessonPresentation[course.id]?.title,course.id);
    assert.doesNotMatch(b.content.displayTitle(course.id), /[ぁ-ヿ]/u, 'Entry titles must make sense without reading kana');
    b.action('open',{course:course.id});
    assert.ok(b.html.includes(b.content.displayTitle(course.id)));
    assert.match(b.html,/class="lesson-example" aria-label="[^"]+"/);
    assert.match(b.html,/aria-label="學習重點"/);
    assert.match(b.html,/aria-current="step"/);
  }
  b.action('open',{course:'g-question'}); b.action('next');
  assert.match(b.html, /在「です」後加上「か」/);
  assert.match(b.html, /<details class="lesson-extra"><summary>補充說明<\/summary>/);
  assert.doesNotMatch(b.html, /<details[^>]*open/);
});

test('a course result keeps one primary and one secondary action, with restart optional', () => {
 const b=harness();startQuiz(b,'g-identity');finishQuiz(b,'g-identity');
 const nav=b.html.match(/<div class="study-nav">(.*?)<\/div>/s)[1];
 assert.equal((nav.match(/class="primary"/g)||[]).length,1);
 assert.equal((nav.match(/class="text-button"/g)||[]).length,1);
 assert.doesNotMatch(nav,/study-restart/);
 assert.match(b.html,/<details class="result-extra"><summary>其他練習選項<\/summary>/);
 assert.match(b.html,/課後練習會記錄第一次作答的成績/);
 assert.equal(b.records.length,1);
 b.action('restart'); assert.equal(b.records.length,1,'Opening a new attempt does not duplicate the previous score');
});


test('word preparation keeps the complete target sentence visible and grouped examples never replace it',()=>{
 const b=harness();b.action('open',{course:'g-identity'});
 assert.match(b.html,/這課會說的句子/);
 assert.match(b.html,/先認識單字/);
 const sentence=b.content.getCourse('g-identity').steps[1];
 assert.ok(b.html.includes(sentence.example));assert.ok(b.html.includes(sentence.reading));assert.ok(b.html.includes(sentence.meaning));
 assert.match(b.html,/data-action="study-audio" data-course="g-identity" data-index="1"/);
 for(const course of b.content.grammar){
  b.action('open',{course:course.id});
  for(let i=0;i<course.steps.length;i++){
   const step=course.steps[i];
   if(step.example.includes('。')){
    const example=kanaHtml(b.html).match(/<p class="grammar-example" lang="ja">(.*?)<\/p>/s)?.[1];
    assert.equal(example,step.example,step.id+' retains the complete example');
    assert.ok(b.html.replaceAll('&#39;', "'").includes(step.reading),step.id+' retains its full reading');
   }
   if(i<course.steps.length-1)b.action('next');
  }
 }
});


test('vocabulary and verb lists use honest labels and preserve each Japanese-reading-meaning pair', () => {
 const b=harness();
 const labels={words:'單字與意思',phrase:'短語與意思',forms:'動詞變化對照',mixed:'短語與例句',usage:'用法整理'};
 for(const course of b.content.grammar){
  b.action('open',{course:course.id});
  const presentation=b.content.lessonPresentation[course.id];
  for(let i=0;i<course.steps.length;i++){
   const step=course.steps[i],kind=presentation.kinds?.[step.id],parts=presentation.parts?.[step.id];
   if(!step.example.includes('。'))assert.ok(labels[kind],step.id+' needs an explicit non-sentence label');
   if(kind&&!presentation.previews?.[step.id])assert.ok(b.html.includes('aria-label="'+labels[kind]+'"'),step.id);
   if(parts&&(kind==='words'||kind==='forms')){
    assert.equal((b.html.match(/class="example-part"/g)||[]).length,parts.length,step.id);
    const plain=kanaHtml(b.html).replaceAll('&#39;',"'");
    for(const [jp,reading,meaning] of parts){
     assert.ok(plain.includes('<span lang="ja">'+jp+'</span><span class="example-reading">'+reading+'</span><span class="part-meaning">'+meaning+'</span>'),step.id+' keeps the pair together');
    }
    if(kind==='forms')assert.match(b.html,/example-parts example-rows/);
   }
   if(i<course.steps.length-1)b.action('next');
  }
 }
});


test('reviewed kanji spellings preserve every kana segment and spoken lesson text', () => {
 const b=harness(null,[{lang:'ja-JP'}]);
 for(const course of b.content.grammar){
  const presentation=b.content.lessonPresentation[course.id];
  const allowed=new Set([...course.steps.map(step=>step.example),...Object.values(presentation.parts).flat().map(part=>part[0])]);
  for(const [text,tokens] of Object.entries(presentation.writing||{})){
   assert.ok(allowed.has(text),'Only explicitly reviewed examples or groups may be annotated');
   assert.equal(tokens.map(t=>typeof t==='string'?t:t[1]).join(''),text,'Kanji never replaces or drops a kana reading');
   for(const token of tokens)if(typeof token!=='string'){
    assert.equal(token.length,2);assert.ok(token.every(v=>typeof v==='string'&&v.length>0));
   }
  }
 }
 b.action('open',{course:'g-identity'});
 assert.match(b.html,/<ruby>私<rp>（<\/rp><rt>わたし<\/rt>/);
 assert.match(b.html,/<ruby>学生<rp>（<\/rp><rt>がくせい<\/rt>/);
 b.action('audio',{index:'1'});assert.equal(b.utterances.at(-1).text,'わたしは がくせいです。');
 b.action('open',{course:'h-a'});assert.doesNotMatch(b.html,/<ruby>/,'Kana recognition cards remain unchanged');
});


test('all grammar lessons have reviewed spellings with contextual readings and unchanged audio', () => {
 const b=harness(null,[{lang:'ja-JP'}]);
 const kanaOnly=['g-demo','g-place','g-kono','g-kochira'];
 for(const course of b.content.grammar){
  const presentation=b.content.lessonPresentation[course.id];
  assert.ok(Object.hasOwn(presentation,'writing'),course.id+' needs a spelling review');
  assert.equal(Object.keys(presentation.writing).length===0,kanaOnly.includes(course.id),course.id);
  b.action('open',{course:course.id});
  for(let i=0;i<course.steps.length;i++){
   const step=course.steps[i];
   const parts=presentation.parts[step.id];
   const displayed=(parts && ['words','forms'].includes(presentation.kinds?.[step.id])) ? parts.map(p=>p[0]) : [step.example,...(parts||[]).map(p=>p[0])];
   for(const text of displayed){
    for(const token of presentation.writing[text]||[]){
     if(Array.isArray(token))assert.ok(b.html.includes('<ruby>'+token[0]+'<rp>（</rp><rt>'+token[1]+'</rt>'),step.id+' must render its kanji and reading');
    }
   }
   b.action('audio',{index:String(i)});
   assert.equal(b.utterances.at(-1).text,(step.speech||step.example).replace(/\s*／\s*/g,'、'),step.id+' keeps original speech');
   if(i<course.steps.length-1)b.action('next');
  }
 }
 const writing=id=>b.content.lessonPresentation[id].writing;
 assert.deepEqual(clone(writing('g-who')['なに']),[['何','なに']]);
 assert.deepEqual(clone(writing('g-who')['なんですか']),[['何','なん'],'ですか']);
 assert.deepEqual(clone(writing('g-verb-forms')['きます → くる']),[['来','き'],'ます → ',['来','く'],'る']);
 assert.deepEqual(clone(writing('g-clock')['よじ']),[['4時','よじ']]);
 assert.deepEqual(clone(writing('g-dates-2')['ついたち']),[['1日','ついたち']]);
 assert.deepEqual(clone(writing('g-dates-3')['はつか']),[['20日','はつか']]);
 assert.ok(writing('g-te-iru')['いま、コーヒーを のんで います。'].at(-1).endsWith('います。'),'Auxiliary います is not 今');
});


test('all extended kana examples highlight the sound, show meaning and romaji, and play without changing attempts', () => {
 const b=harness(null,[{lang:'ja-JP'}]);b.loadHints();
 let count=0;
 for(const course of Object.values(b.content.courses).filter(c=>c.type==='kana' && !['h-a','k-a'].includes(c.id))){
  b.action('open',{course:course.id});
  for(let i=0;i<course.letters.length;i++){
   const letter=course.letters[i];
   // The extended inventory starts at the voiced row; basic rows are already covered above.
   const first=b.html.includes('<dt>濁點</dt>')||b.html.includes('<dt>半濁點</dt>')||b.html.includes('<dt>拗音</dt>');
   if(first){
    count++;
    const attempt=clone(b.study.currentAttempt(course.id)),before=JSON.stringify(b.stored);
    assert.match(b.html,/<span class="hint-word" lang="ja">.*<mark>.+<\/mark>.*<\/span>/);
    assert.match(b.html,/<span class="hint-roman">[a-z]+<\/span>/);
    b.action('word-audio',{letter});
    const displayed=b.html.match(/<span class="hint-word" lang="ja">(.*?)<\/span>/)[1].replace(/<[^>]+>/g,'');
    assert.equal(b.utterances.at(-1)?.text,displayed);
    assert.equal(JSON.stringify(b.stored),before);
    assert.deepEqual(clone(b.study.currentAttempt(course.id)),attempt);
   }
   if(i<course.letters.length-1)b.action('next');
  }
 }
 assert.equal(count,116);
 const p=harness(null,[{lang:'ja-JP'}]);p.loadHints();p.action('open',{course:'h-pa'});
 assert.match(p.html,/<mark>パ<\/mark>ン/);
 assert.match(p.html,/同音：<span lang="ja">ぱ ＝ パ<\/span>/);
 p.action('word-audio',{letter:'ぱ'});assert.equal(p.utterances.at(-1).text,'パン');
 p.action('word-audio',{letter:'ぴ'});assert.equal(p.utterances.at(-1).text,'パン');
});

test('every grammar entry and explanation card states its own teaching scope', () => {
 const b=harness();b.render('#grammar');
 assert.equal((b.html.match(/class="course-topic"/g)||[]).length,48);
 let cards=0;
 const text=html=>html.replace(/<[^>]+>/g,'');
 for(const course of b.content.grammar){
  const p=b.content.lessonPresentation[course.id];
  assert.ok(['文法','單字與讀法'].includes(p.focus[0]),course.id);
  assert.ok(p.focus[1].trim());
  assert.deepEqual(Object.keys(p.cardFocus).sort(),[...course.steps].map(s=>s.id).sort(),course.id);
  for(const id of Object.keys(p.cardTitles||{}))assert.ok(course.steps.some(s=>s.id===id));
  b.action('open',{course:course.id});
  for(let i=0;i<course.steps.length;i++){
   const step=course.steps[i],focus=p.cardFocus[step.id];cards++;
   assert.ok(focus.length===2 && focus.every(x=>typeof x==='string' && x.trim()),step.id);
   assert.equal(text(b.html.match(/<h1[^>]*>(.*?)<\/h1>/s)[1]),course.title);
   assert.ok(text(b.html.match(/<p class="lesson-topic">(.*?)<\/p>/s)[1]).includes(b.content.displayTitle(course.id)));
   assert.equal(text(b.html.match(/<p class="card-focus"[^>]*>(.*?)<\/p>/s)[1]),focus.join(''),step.id);
   if(i<course.steps.length-1)b.action('next');
  }
 }
 assert.equal(cards,153);
});

test('the question lesson labels its affirmative baseline before teaching the question', () => {
 const b=harness();b.action('open',{course:'g-question'});
 assert.match(b.html,/<h2>先看肯定句：是學生<\/h2>/);
 assert.match(b.html,/肯定句對照/);
 assert.match(kanaHtml(b.html),/<p class="grammar-example" lang="ja">がくせいです。<\/p>/);
 assert.match(b.html,/下一張會在句尾加上「か」/);
 assert.doesNotMatch(b.html.match(/<p class="card-focus"[^>]*>(.*?)<\/p>/s)[1],/疑問句/);
 b.action('next');
 assert.match(b.html.match(/<p class="card-focus"[^>]*>(.*?)<\/p>/s)[1],/疑問句/);
 assert.match(kanaHtml(b.html),/<p class="grammar-example" lang="ja">がくせいですか。<\/p>/);
 b.action('next');assert.match(b.html,/省略主題/);
 const restored=harness(b.stored);restored.render('#study/g-question');
 assert.match(restored.html,/省略主題/);
 assert.equal(restored.state.courses['g-question'].active.cursor,2);
});

test('random lesson entries stay in their unit, open explanations, and keep random questions separate', () => {
 const b=harness(); b.render('#grammar');
 assert.equal((b.html.match(/class="unit-random text-button"/g)||[]).length,5);
 assert.match(b.html,/data-action="study-grammar-random"/);
 const heading=()=>b.html.match(/<h1[^>]*>(.*?)<\/h1>/s)[1].replace(/<[^>]+>/g,'');
 for(const unit of b.study.grammarUnits()) {
  let previous=null;
  for(let i=0;i<4;i++) {
   b.render('#grammar');b.action('random-lesson',{unit:unit.lessons[0].id});
   const chosen=unit.lessons.find(c=>c.title===heading());assert.ok(chosen,unit.title);
   assert.notEqual(chosen.id,previous);previous=chosen.id;
   assert.match(b.html,/句型說明/);assert.doesNotMatch(b.html,/data-action="study-answer"/);
  }
 }
 assert.equal(b.records.length,0);assert.equal(b.saves,0,'Choosing a topic alone does not complete it');
 const before=b.html;b.action('random-lesson',{unit:'not-a-unit'});assert.equal(b.html,before);
});

test('random lessons preserve existing quiz answers, and completion offers another topic in the same unit', () => {
 const b=harness(), unit=b.study.grammarUnits()[0], before={};
 for(const course of unit.lessons) {
  startQuiz(b,course.id);b.action('answer',{choice:String(chooseCurrent(b,course.id))});
  before[course.id]=clone(b.state.courses[course.id].active);
 }
 b.render('#grammar');b.action('random-lesson',{unit:unit.lessons[0].id});
 const course=unit.lessons.find(c=>b.state.courses[c.id].active.phase==='cards');assert.ok(course);
 const active=b.state.courses[course.id].active;
 for(const field of ['first','solved','order','options']) assert.deepEqual(clone(active[field]),before[course.id][field],field);
 for(let i=0;i<course.steps.length;i++)b.action('next');
 finishQuiz(b,course.id);
 assert.match(b.html,/data-action="study-random-lesson" data-unit="g-identity">再隨機進一課/);
 const result=clone(b.state.courses[course.id]);b.action('random-lesson',{unit:'g-identity'});
 assert.deepEqual(clone(b.state.courses[course.id]),result,'Picking another lesson keeps the completed result');
 assert.match(b.html,/句型說明/);
});


test('finishing the explanation can lead to another lesson without doing or completing a quiz', () => {
 const b=harness();b.action('open',{course:'g-question'});b.action('next');b.action('next');
 assert.match(b.html,/再隨機進一課/);assert.match(b.html,/開始練習/);
 b.action('random-lesson',{unit:'g-identity'});
 assert.match(b.html,/句型說明/);assert.equal(b.records.length,0);
 assert.equal(b.state.courses['g-question'].active.phase,'cards');
 assert.equal(b.state.courses['g-question'].completedAt,null);
});

test('continuous practice covers the mixed bank without repeats, then reshuffles without changing learning data', () => {
  const b = harness(); const before = clone(b.state);
  b.action('drill');
  const pool = b.drillPool.map(q => q.id);
  let previous = null;
  for (let pass = 0; pass < 2; pass++) {
    const seen = new Set();
    for (let i = 0; i < pool.length; i++) {
      const current = b.study.currentReview();
      assert.ok(current); assert.notEqual(current.questionId, previous);
      assert.ok(!seen.has(current.questionId)); seen.add(current.questionId);
      const question = b.drillPool.find(q => q.id === current.questionId).question;
      const unchanged = b.html;
      b.action('next'); b.action('answer', {choice:'999'});
      assert.equal(b.html, unchanged);
      const choice = (i % 2) ? (question.answer + 1) % question.options.length : question.answer;
      b.action('answer', {choice:String(choice)});
      assert.ok(b.feedback.textContent.includes(question.explanation));
      const feedback = b.feedback.textContent;
      b.action('answer', {choice:String(question.answer)});
      assert.equal(b.feedback.textContent, feedback, 'Only first answer counts');
      previous = current.questionId;
      b.action('next');
      assert.doesNotMatch(b.html, /看結果 →|練習完成/);
    }
    assert.deepEqual([...seen].sort(), [...pool].sort());
  }
  b.action('drill-stop');
  assert.match(b.html, new RegExp(`${Math.ceil(pool.length / 2) * 2} / ${pool.length * 2}`));
  assert.equal(b.study.currentReview(), null);
  assert.deepEqual({...clone(b.state),drill:before.drill}, before); assert.ok(b.saves > 0); assert.equal(b.records.length, 0);
});

test('continuous practice can stop, resume the same unanswered question and return from feedback', () => {
  const b = harness(); b.render('#drill');
  const first = b.study.currentReview();
  b.action('drill-stop'); assert.match(b.html, /0 \/ 0/);
  b.action('next'); b.action('answer', {choice:'0'}); assert.match(b.html, /0 \/ 0/);
  b.action('drill-continue'); assert.deepEqual(b.study.currentReview(), first);
  b.action('answer', {choice:'0'}); const answered = b.render('#drill');
  b.render('#grammar'); assert.equal(b.render('#drill'), answered);
  b.action('drill-stop'); b.action('drill-continue');
  assert.notDeepEqual(b.study.currentReview(), first);
  assert.match(b.html, /第 2 題/);
  assert.ok(b.saves > 0);
  const reloaded = harness(b.stored); reloaded.render('#drill'); assert.match(reloaded.html, /第 2 題/);
  assert.deepEqual(clone(reloaded.state.drill),clone(b.state.drill));
});

test('food keywords can be searched, bookmarked and spoken individually without quiz records', () => {
  const b = harness(null, [{lang:'ja-JP',name:'Kyoko'}]);
  b.render('#travel/food');
  assert.equal((b.html.match(/data-action="study-food-audio"/g)||[]).length,24);
  const food = b.content.phrasebook.find(c => c.id === 'food');
  for (const step of food.steps) for (const [index, word] of step.keywords.entries()) {
    b.action('food-audio',{phrase:step.id,index:String(index)});
    assert.equal(b.utterances.at(-1).text,word[0].match(/（(.*?)）/u)?.[1]||word[0]);
  }
  const count=b.utterances.length;
  b.action('food-audio',{phrase:'phrase/food/sides',index:'99'});
  assert.equal(b.utterances.length,count);
  b.action('favorite',{phrase:'phrase/food/noodles'});
  b.render('#travel/favorites'); assert.match(b.html,/麵類：拉麵/);
  b.study.searchTravel('炸雞'); b.render('#travel'); assert.match(b.html,/data-step="phrase\/food\/sides"/);
  b.study.searchTravel('onigiri'); b.render('#travel'); assert.match(b.html,/data-step="phrase\/food\/rice"/);
  assert.equal(b.records.length,0);
});


test('all 32 second-batch drill questions render reading aids, explain answers and resume',()=>{
 const b=harness(), additions=b.drillPool.filter(q=>q.question.source?.batch==='2026-10-17-200');
 assert.equal(additions.length,32);
 for(const entry of additions) {
  b.state.drill=b.drillEngine.start(b.drillEngine.blank(),[entry]);
  b.render('#drill');
  assert.ok(b.html.includes(entry.question.prompt),entry.id);
  for(const reading of entry.question.readings.filter(Boolean))assert.ok(b.html.includes(reading),entry.id);
  if(entry.question.promptReading)assert.ok(b.html.includes(entry.question.promptReading),entry.id);
  b.action('answer',{choice:String(entry.question.answer)});
  assert.ok(b.feedback.textContent.includes(entry.question.explanation),entry.id);
  const restored=harness(b.stored);restored.render('#drill');
  assert.equal(restored.study.currentReview().questionId,entry.id);
  assert.match(restored.html,/✓ 答對了/);
 }
});

test('common travel additions speak kana and distinguish staff replies from questions', () => {
  const b = harness(null, [{lang:'ja-JP', name:'Kyoko'}]);
  const before = clone(b.state);
  for (const [category, slug, spoken] of [
    ['dining', 'warm-up', 'あたためてください。'],
    ['dining', 'utensils', 'おはし、おねがいします。'],
    ['food', 'meal-set', 'たんぴんでおねがいします。'],
    ['food', 'meat', 'これはぶたにくですか？'],
    ['hotel', 'wifi', 'ワイファイのパスワードは？'],
    ['hotel', 'towels', 'タオル、おねがいします。'],
    ['transit', 'missed-stop', 'のりすごしました。'],
    ['transit', 'gate-help', 'すみません、とおれません。'],
  ]) {
    b.render(`#travel/${category}`);
    const index = b.content.phrasebook.find(c => c.id === category).steps.findIndex(s => s.id === `phrase/${category}/${slug}`);
    b.action('travel-audio', {course:category, index:String(index), full:'0'});
    assert.equal(b.utterances.at(-1).text, spoken, `${category}/${slug}`);
  }
  b.render('#travel/hotel');
  assert.match(b.html, /對方可能會說<\/span><span lang="ja">少々お待ちください。<\/span><span class="staff-asks-reading">shoushou omachi kudasai<\/span><span>請稍等一下。/);
  assert.doesNotMatch(b.html, /對方可能會問<\/span><span lang="ja">少々お待ちください/);
  assert.deepEqual(clone(b.state), before, 'Reading and playback do not change study progress');
  assert.equal(b.records.length, 0);
});
