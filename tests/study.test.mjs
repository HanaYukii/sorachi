import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../dist/study.js', import.meta.url), 'utf8');
const clone = (value) => JSON.parse(JSON.stringify(value));
function harness(saved, voices = [], history = []) {
  let html = '', focused = null, stored = null, currentState;
  const records = [], utterances = [], speechEvents = {};
  const status = { textContent: '' };
  let renders = 0, scrolls = 0;
  const timers = new Map(); let timerId = 0;
  const makeNode = () => ({ textContent: '', dataset: {}, disabled: false, classList: { toggle() {} }, setAttribute(k,v) { this[k] = v; }, focus() { focused = this.selector; }, scrollIntoView() { scrolls++; }, querySelector() { return this.mark; } });
  const feedback = makeNode(), next = makeNode(); next.selector = '[data-action="study-next"]';
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
  const document = { querySelectorAll() { return answerNodes; }, querySelector(selector) { if (selector === '.study-feedback') return feedback; if (selector === '[data-action="study-next"]') return next; return selector === '#app' ? app : (selector === '.study-audio-status' || selector.startsWith('[data-audio-for=')) ? status : null; } };
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
  vm.runInContext(`${source}\nglobalThis.moduleStudy = Study; globalThis.moduleContent = Content; globalThis.modulePractice = KanaPractice;`, context);
  const study = context.moduleStudy;
  currentState = study.sanitize(saved);
  const render = (hash = location.hash) => { location.hash = hash; app.innerHTML = study.render(hash); return html; };
  study.bind({
    getState: () => currentState,
    save() { stored = clone(currentState); },
    record(record) {
      // Root record() saves immediately; completion must already be durable.
      assert.equal(currentState.courses[record.courseId].active.phase, 'done');
      stored = clone(currentState);
      records.push(clone(record));
    },
    history: () => history, footer: () => '<footer>footer</footer>', warning: () => '', go: render,
  });
  return {
    study, loadHints() { vm.runInContext(readFileSync(new URL('../dist/kana-hints.js', import.meta.url), 'utf8'),context); }, practice: context.modulePractice, content: context.moduleContent, records, utterances, status, render, feedback, next, speechSynthesis,
    get answers() { return answerNodes; }, get renders() { return renders; }, get scrolls() { return scrolls; }, flushTimers() { const jobs = [...timers.values()]; timers.clear(); jobs.forEach(fn => fn()); },
    action(action, data = {}) { return study.handle({ dataset: { action: `study-${action}`, ...data }, disabled: false }); },
    get state() { return currentState; }, get html() { return html; }, get stored() { return stored; }, get focused() { return focused; }, get cancels() { return cancels; },
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
    assert.equal((b.html.match(/data-action="study-open"/g) || []).length, 28);
    for (const heading of ['濁音・半濁音', '拗音', '促音・長音']) assert.match(b.html, new RegExp(`<h2 class="course-list-heading">${heading}</h2>`));
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
    for(const q of a.practice.questions) assert.ok(q.options.every(id=>b.practice.entry(id).courseId===id.split('/')[0] && b.practice.entry(id).script===id[0]));
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

test('all grammar courses complete their content-defined cards and questions with stable score semantics', () => {
  const b = harness(); b.render('#grammar');
  assert.equal((b.html.match(/data-action="study-open"/g) || []).length, 3);
  for (const id of ['g-identity', 'g-question', 'g-demo']) {
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
  assert.deepEqual(clone(b.study.sanitize(null)),{script:'h',courses:{},kanaReview:{},reviewSession:null,reviewClearedAt:null});
});

test('an unavailable Japanese voice shows visible fallback and never speaks English', () => {
  const voices = [{ lang: 'en-US', name: 'English' }];
  const b = harness(null, voices); b.action('open', { course: 'h-a' });
  b.action('audio', { index: '0' });
  assert.equal(b.utterances.length, 0);
  assert.match(b.status.textContent, /沒有日文語音/);
  voices.push({ lang: 'ja-JP', name: 'Japanese' }); b.voicesReady();
  assert.match(b.status.textContent, /已準備好/);
  b.action('audio', { index: '0' });
  assert.equal(b.utterances.length, 1);
  assert.equal(b.utterances[0].lang, 'ja-JP');
  assert.equal(b.utterances[0].rate, 0.8);
  assert.equal(b.utterances[0].voice.lang, 'ja-JP');
  b.study.stopAudio(); const oldText = b.status.textContent;
  b.utterances[0].onend(); assert.equal(b.status.textContent, oldText);
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
  assert.equal(b.study.context('#kana'), '五十音學習路線');
});

test('travel section is separate; each situation shows keywords and playable phrases without a quiz', () => {
  const b = harness(null, [{lang: 'ja-JP'}]);
  b.render('#travel');
  assert.equal((b.html.match(/href="#travel\//g) || []).length, 11);
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
  assert.match(b.status.textContent, /正在播放/);
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
  assert.equal(b.study.nextCourse('h-a'),'h-ka'); assert.equal(b.study.nextCourse('k-a'),'k-ka'); assert.equal(b.study.nextCourse('k-wa'),'k-ga'); assert.equal(b.study.nextCourse('h-pa'),'h-kya'); assert.equal(b.study.nextCourse('h-pya'),null); assert.equal(b.study.nextCourse('k-pya'),null); assert.equal(b.study.nextCourse('g-identity'),null);
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
  assert.equal(a.practice.round,'retry');assert.doesNotMatch(b.html,/正確答案：/);assert.doesNotMatch(b.html,/記憶提示|播放讀音/);
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

test('delayed success stays removed after completion and reload with the newer history timestamp', () => {
 const b=harness();startQuiz(b,'h-a');const id=b.practice.current(b.state.courses['h-a'].active.practice).id;finishQuiz(b,'h-a',true);
 assert.equal(b.state.kanaReview[id].wrong,false);const history=clone(b.records);history[0].date=new Date(Date.now()+1000).toISOString();
 const restored=harness(b.stored,[],history);assert.equal(restored.study.reviewSummary().wrongCount,0);assert.equal(restored.state.kanaReview[id].wrong,false);
 assert.equal(history[0].firstCorrect,4);assert.deepEqual(history[0].retryQuestions,[1]);
});

test('memory hints switch without persisting, speaking, or appearing on a question', () => {
 const b=harness(null,[{lang:'ja-JP'}]);b.loadHints();b.action('open',{course:'h-a'});assert.match(b.html,/記憶提示/);const before=b.html,attempt=b.study.currentAttempt('h-a'),cancels=b.cancels;
 b.action('hint');assert.notEqual(b.html,before);assert.equal(b.stored,null);assert.equal(b.utterances.length,0);assert.equal(b.cancels,cancels);assert.deepEqual(clone(b.study.currentAttempt('h-a')),clone(attempt));
 for(let i=0;i<5;i++)b.action('next');assert.doesNotMatch(b.html,/記憶提示|換個記法/);
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
  b.action('audio', { index: '0' }); assert.equal(b.utterances.at(-1).text, 'わたし、がくせい');
  b.action('next'); b.action('audio', { index: '1' }); assert.equal(b.utterances.at(-1).text, 'わたしは がくせいです。');
  b.action('next'); b.action('next');
  // Question order is shuffled; answer the plain-romaji question first if it comes up.
  if (!/option-reading/.test(b.html)) { b.action('answer', { choice: '1' }); b.action('next'); }
  assert.match(b.html, /<span lang="ja">です<\/span><span class="option-reading">desu<\/span>/);
  b.render('#grammar');
  assert.match(b.html, /ou、ei 和 aa、ii、uu、ee、oo 通常是拉長的音/);
});

test('ぢ／づ cards say up front that they share a reading with じ／ず', () => {
  const b = harness();
  b.action('open', { course: 'h-da' }); b.action('next');
  assert.match(b.html, /ぢ 和 じ 同音，都讀 ji/);
  b.action('open', { course: 'k-da' }); b.action('next'); b.action('next');
  assert.match(b.html, /ヅ 和 ズ 同音，都讀 zu/);
});

test('audio buttons say what is visible, keyword boxes are not repeated landmarks, kana rows are marked Japanese', () => {
  const b = harness(null, [{ lang: 'ja-JP' }]);
  b.render('#travel/t-order');
  assert.doesNotMatch(b.html, /aria-label="播放/);
  assert.match(b.html, />播放讀音<span class="visually-hidden">：<span lang="ja">/);
  assert.doesNotMatch(b.html, /<section class="keyword-box"|aria-label="關鍵字"/);
  b.render('#kana');
  assert.match(b.html, /<strong lang="ja">あ行<\/strong>/);
  b.render('#grammar');
  assert.match(b.html, /<span class="course-subtitle">/);
});

test('travel pages show staff questions and Japanese keywords; other pages link to travel phrases', () => {
  const b = harness();
  b.render('#travel');
  assert.match(b.html, /<span class="travel-keywords" lang="ja">お会計・レジ・カード・現金・Suica<\/span>/);
  assert.match(b.html, />何名様・店内・持ち帰り・お水・おかわり・いりません</);
  assert.doesNotMatch(b.html, /travel-keywords[^>]*>[^<]*(お願いします|1000円)/);
  b.render('#travel/dining');
  assert.match(b.html, /<p class="staff-asks"><span class="staff-asks-label">店員可能會問<\/span><span lang="ja">店内でお召し上がりですか？<\/span>/);
  b.render('#kana');
  assert.match(b.html, /<a class="header-link" href="#travel">旅遊常用語<\/a>/);
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
