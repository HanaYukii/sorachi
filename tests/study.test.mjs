import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../dist/study.js', import.meta.url), 'utf8');
const clone = (value) => JSON.parse(JSON.stringify(value));
function harness(saved, voices = []) {
  let html = '', focused = null, stored = null, currentState;
  const records = [], utterances = [], speechEvents = {};
  const status = { textContent: '' };
  let renders = 0, scrolls = 0;
  const timers = new Map(); let timerId = 0;
  const makeNode = () => ({ textContent: '', dataset: {}, disabled: false, classList: { toggle() {} }, setAttribute(k,v) { this[k] = v; }, focus() { focused = this.selector; }, scrollIntoView() { scrolls++; }, querySelector() { return this.mark; } });
  const feedback = makeNode(), next = makeNode(); next.selector = '[data-action="study-next"]';
  let answerNodes = [];

  let cancels = 0;
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
    getVoices() { return voices; },
    cancel() { cancels++; },
    speak(u) { utterances.push(u); u.onstart?.(); },
    addEventListener(name, callback) { speechEvents[name] = callback; }, removeEventListener(name, callback) { if (speechEvents[name] === callback) delete speechEvents[name]; },
  };
  const context = vm.createContext({ setTimeout(fn) { timers.set(++timerId, fn); return timerId; }, clearTimeout(id) { timers.delete(id); }, document, location, window: { speechSynthesis }, SpeechSynthesisUtterance: class { constructor(text) { this.text = text; } }, console });
  vm.runInContext(readFileSync(new URL("../dist/content.js", import.meta.url), "utf8"), context);
  vm.runInContext(`${source}\nglobalThis.moduleStudy = Study; globalThis.moduleContent = Content;`, context);
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
    footer: () => '<footer>footer</footer>', warning: () => '', go: render,
  });
  return {
    study, content: context.moduleContent, records, utterances, status, render, feedback, next, speechSynthesis,
    get answers() { return answerNodes; }, get renders() { return renders; }, get scrolls() { return scrolls; }, flushTimers() { const jobs = [...timers.values()]; timers.clear(); jobs.forEach(fn => fn()); },
    action(action, data = {}) { return study.handle({ dataset: { action: `study-${action}`, ...data }, disabled: false }); },
    get state() { return currentState; }, get html() { return html; }, get stored() { return stored; }, get focused() { return focused; }, get cancels() { return cancels; },
    voicesReady() { speechEvents.voiceschanged?.(); },
  };
}
const groupKeys = ['a','ka','sa','ta','na','ha','ma','ya','ra','wa'];
function startQuiz(b, id) {
  b.action('open', { course: id });
  const course = b.content.courses[id]; const count = course.type === 'kana' ? course.letters.length : course.steps.length;
  for (let i = 0; i < count; i++) b.action('next');
  assert.equal(b.state.courses[id].active.phase, 'quiz');
}
function correctChoice(b, id, q) { return b.content.courses[id].questions[q].answer; }
function finishQuiz(b, id, missFirst = false) {
  const active = b.state.courses[id].active;
  while (active.phase === 'quiz') {
    const q = active.order[active.cursor];
    const correct = correctChoice(b, id, q);
    if (missFirst && active.cursor === 0) {
      b.action('answer', { choice: String(active.options[q].find((x) => x !== correct)) });
      missFirst = false;
    }
    b.action('answer', { choice: String(correct) });
    b.action('next');
  }
}

test('two scripts cover exactly 46 unique basic characters each and only one script is listed', () => {
  const b = harness();
  assert.equal(b.study.render('#home'), null);
  assert.equal(b.study.total('missing'), 0);
  assert.equal(b.study.title('missing'), null);
  for (const script of ['h', 'k']) {
    b.render('#kana'); b.action('script', { script });
    assert.equal((b.html.match(/data-action="study-open"/g) || []).length, 10);
    const letters = [];
    for (const key of groupKeys) {
      const id = `${script}-${key}`;
      const n = ['ya', 'wa'].includes(key) ? 3 : 5;
      assert.equal(b.study.total(id), n);
      b.action('open', { course: id });
      for (let i = 0; i < n; i++) {
        letters.push(b.html.match(/<div class="kana-character" lang="ja">([^<]+)</)[1]);
        b.action('next');
      }
    }
    assert.equal(letters.length, 46);
    assert.equal(new Set(letters).size, 46);
    assert.ok(!letters.some((c) => ['ゐ','ゑ','ヰ','ヱ'].includes(c)));
  }
});

test('each kana appears once; choices stay inside its own row and preserve shuffle after reload', () => {
  for (const id of ['h-a', 'h-ya', 'h-wa', 'k-wa']) {
    const b = harness(); startQuiz(b, id);
    const a = b.state.courses[id].active, n = b.study.total(id);
    assert.deepEqual([...a.order].sort(), Array.from({ length: n }, (_, i) => i));
    for (const options of a.options) assert.deepEqual([...options].sort(), Array.from({ length: n }, (_, i) => i));
    const restored = harness(b.stored); restored.render(`#study/${id}`);
    assert.deepEqual(clone(restored.state.courses[id].active.order), clone(a.order));
    assert.deepEqual(clone(restored.state.courses[id].active.options), clone(a.options));
  }
});

test('wrong first answer survives reload and retry; completion records once with displayed question numbers', () => {
  const b = harness(); startQuiz(b, 'h-a');
  const a = b.state.courses['h-a'].active;
  a.order = [4, 0, 1, 2, 3]; // Deliberately non-identity; displayed question 1 is source item 5.
  const q = a.order[0];
  const wrong = (q + 1) % 5;
  b.action('answer', { choice: String(wrong) });
  assert.equal(a.first[q], false);
  assert.match(b.feedback.textContent, /正解是/);
  b.action('next'); assert.equal(a.cursor, 0);
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

test('resume preserves card and quiz progress; replay alternates direction without changing prior snapshot', () => {
  const b = harness(); b.action('open', { course: 'h-wa' }); b.action('next');
  const paused = harness(b.stored); paused.render('#study/h-wa');
  assert.equal(paused.state.courses['h-wa'].active.cursor, 1);
  paused.action('next'); paused.action('next'); finishQuiz(paused, 'h-wa');
  const savedResult = clone(paused.state.courses['h-wa'].lastResult);
  paused.action('restart');
  assert.equal(paused.state.courses['h-wa'].active.direction, 'reading');
  assert.deepEqual(clone(paused.state.courses['h-wa'].lastResult), savedResult);
  for (let i = 0; i < 3; i++) paused.action('next');
  assert.match(paused.html, /這個讀音，對應哪個字/);
  assert.equal((paused.html.match(/data-action="study-answer"/g) || []).length, 3);
  finishQuiz(paused, 'h-wa');
  assert.equal(paused.records.length, 2);
  assert.equal(paused.state.courses['h-wa'].attempts, 2);
});

test('reviewing cards mid-quiz retains original answers and resumes at first incomplete item', () => {
  const b = harness(); startQuiz(b, 'h-ya');
  const active = b.state.courses['h-ya'].active;
  b.action('answer', { choice: String(active.order[0]) }); b.action('next');
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

test('sanitization rejects malformed attempts, clamps indices, and prevents skipping unsolved questions', () => {
  const b = harness(); startQuiz(b, 'h-a');
  const stored = clone(b.stored);
  stored.courses['h-a'].active.cursor = 100;
  stored.courses['h-a'].active.first['<script>'] = true;
  stored.courses['h-a'].active.solved[0] = true;
  stored.courses['unknown'] = { completedAt: '<img>' };
  const clean = b.study.sanitize(stored);
  assert.equal(clean.courses['h-a'].active.cursor, 0);
  assert.equal(clean.courses['h-a'].active.solved[0], undefined);
  assert.equal(clean.courses['h-a'].active.first['<script>'], undefined);
  assert.equal(clean.courses.unknown, undefined);
  stored.courses['h-a'].active.order = [0,0,0,0,0];
  assert.equal(b.study.sanitize(stored).courses['h-a'].active, null);
  assert.deepEqual(clone(b.study.sanitize(null)), { script: 'h', courses: {} });
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

test('travel section is separate, and lessons teach keywords before contextual comprehension questions', () => {
  const b = harness(null, [{lang: 'ja-JP'}]);
  const answers = Object.fromEntries(['t-place','t-order','t-pay','t-charge'].map(id => [id,b.content.courses[id].questions.map(q=>q.answer)]));
  b.render('#travel');
  assert.equal((b.html.match(/href="#travel\//g) || []).length, 8);
  assert.doesNotMatch(b.html, /data-action="study-open"/);
  assert.doesNotMatch(b.html, /data-course="g-identity"/);
  assert.equal(b.study.context('#travel'), '旅遊常用語列表');
  for (const [id, correct] of Object.entries(answers)) {
    b.action('open', {course: id});
    assert.match(b.html, /關鍵字/);
    assert.match(b.html, /可以這樣說/);
    assert.match(b.html, /href="#travel"/);
    b.action('audio', {index: '0'});
    assert.ok(b.utterances.at(-1).text.length > 0);
    b.action('next');
    const reloaded = harness(b.stored);
    reloaded.render(`#study/${id}`);
    assert.equal(reloaded.state.courses[id].active.cursor, 1);
    if (id === 't-order') {
      assert.match(reloaded.html, /ひとつ/);
      assert.match(reloaded.html, /ふたつ/);
      assert.match(reloaded.html, /みっつ/);
      reloaded.action('next');
      assert.match(reloaded.html, /ホット/);
      assert.match(reloaded.html, /アイス/);
      assert.match(reloaded.html, /<details class="phrase-more"><summary>進階補充：點酒的喝法/);
      assert.match(reloaded.html, /rokku/);
      assert.match(reloaded.html, /sooda wari/);
      assert.doesNotMatch(reloaded.html, /ROKU|琴酒品牌/);
      reloaded.action('next');
      assert.match(reloaded.html, /atatakai/);
      assert.match(reloaded.html, /tsumetai/);
      reloaded.action('next');
      assert.match(reloaded.html, /namimori/);
      assert.match(reloaded.html, /oomori/);
    }
    reloaded.action('next');
    const a = reloaded.state.courses[id].active;
    assert.equal(a.phase, 'quiz');
    const q = a.order[0];
    reloaded.action('answer', {choice: String((correct[q]+1)%3)});
    reloaded.action('next');
    assert.equal(a.cursor, 0);
    while (a.phase === 'quiz') {
      reloaded.action('answer', {choice: String(correct[a.order[a.cursor]])});
      reloaded.action('next');
    }
    assert.equal(reloaded.records.length, 1);
    assert.equal(reloaded.records[0].firstCorrect, correct.length - 1);
    assert.deepEqual(reloaded.records[0].retryQuestions, [1]);
    assert.match(reloaded.html, /href="#travel"/);
    const done = harness(reloaded.stored);
    done.render(`#study/${id}`);
    assert.equal(done.records.length, 0);
    assert.equal(done.state.courses[id].active.phase, 'done');
  }
});

test('phrasebook freely shows keywords without changing learning progress, and audio uses the chosen card', () => {
  const b = harness(null, [{lang:'ja-JP'}]);
  b.action('open', {course:'h-a'}); b.action('next');
  const before = clone(b.state);
  for (const id of ['basics','t-order','dining','t-pay','shopping','t-place','t-charge','hotel']) {
    b.render(`#travel/${id}`);
    assert.match(b.html, /關鍵字/);
    assert.match(b.html, /看完整說法與讀音/);
    assert.doesNotMatch(b.html, /data-action="study-next"|開始練習|data-action="study-answer"/);
    assert.deepEqual(clone(b.state), before);
    assert.equal(b.records.length, 0);
  }
  b.render('#travel/t-pay');
  assert.match(b.html, /カード/); assert.match(b.html, /現金/);
  assert.match(b.html, /Suica（スイカ）/);
  assert.match(b.html, /suika wa tsukaemasu ka/);
  b.render('#travel/t-order');
  assert.match(b.html, /ひとつ/); assert.match(b.html, /並盛/);
  b.action('travel-audio', {course:'t-order',index:'2'});
  assert.equal(b.utterances.at(-1).text, 'アイスでお願いします。');
  assert.match(b.status.textContent, /正在播放/);
  b.action('travel-audio', {course:'t-order',index:'99'});
  b.action('travel-audio', {course:'hotel',index:'0'});
  assert.equal(b.utterances.length, 1);
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

test('answer updates retain options and live region, mark wrong in text and focus next only after success', () => {
  const b=harness(); startQuiz(b,'h-a'); const a=b.state.courses['h-a'].active, q=a.order[0];
  const nodes=b.answers, feedback=b.feedback, renders=b.renders;
  b.action('answer',{choice:String((q+1)%5)});
  assert.equal(b.renders,renders); assert.equal(b.answers,nodes); assert.equal(b.feedback,feedback);
  assert.ok(nodes.some(n=>n.mark.textContent.includes('再試一次'))); assert.match(feedback.textContent,/正解是/);
  b.action('answer',{choice:String(q)}); assert.equal(b.renders,renders); assert.equal(b.next.disabled,false); assert.equal(b.focused,'[data-action="study-next"]'); assert.ok(b.scrolls>=1);
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
  assert.equal(b.study.nextCourse('h-a'),'h-ka'); assert.equal(b.study.nextCourse('k-a'),'k-ka'); assert.equal(b.study.nextCourse('k-wa'),null); assert.equal(b.study.nextCourse('g-identity'),null);
});

test('katakana special hints distinguish o from wo by character', () => {
 const b=harness(); b.action('open',{course:'k-a'}); for(let i=0;i<4;i++)b.action('next'); assert.doesNotMatch(b.html,/對應平假名/);
 b.action('open',{course:'k-wa'}); b.action('next'); assert.match(b.html,/對應平假名「を」/);
});


test('voice fallback ranking accepts language variants and prioritizes local standard Japanese', () => {
  const cases = [
    [[{name:'remote',lang:'ja-JP',localService:false},{name:'local',lang:'JA_jp',localService:true}], 'local'],
    [[{name:'generic',lang:'ja',localService:true},{name:'regional',lang:'ja-JP',localService:false}], 'regional'],
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
