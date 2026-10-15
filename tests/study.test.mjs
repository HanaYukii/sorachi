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
  let cancels = 0;
  const app = {
    get innerHTML() { return html; },
    set innerHTML(value) { html = value; },
    querySelector(selector) { return { focus() { focused = selector; } }; },
  };
  const document = { querySelector(selector) { return selector === '#app' ? app : (selector === '.study-audio-status' || selector.startsWith('[data-audio-for=')) ? status : null; } };
  const location = { hash: '#kana' };
  const speechSynthesis = {
    getVoices() { return voices; },
    cancel() { cancels++; },
    speak(u) { utterances.push(u); u.onstart?.(); },
    addEventListener(name, callback) { speechEvents[name] = callback; },
  };
  const context = vm.createContext({ document, location, window: { speechSynthesis }, SpeechSynthesisUtterance: class { constructor(text) { this.text = text; } }, console });
  vm.runInContext(`${source}\nglobalThis.moduleStudy = Study;`, context);
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
    study, records, utterances, status, render,
    action(action, data = {}) { return study.handle({ dataset: { action: `study-${action}`, ...data }, disabled: false }); },
    get state() { return currentState; }, get html() { return html; }, get stored() { return stored; }, get focused() { return focused; }, get cancels() { return cancels; },
    voicesReady() { speechEvents.voiceschanged?.(); },
  };
}
const groupKeys = ['a','ka','sa','ta','na','ha','ma','ya','ra','wa'];
function startQuiz(b, id) {
  b.action('open', { course: id });
  const count = id.startsWith('g-') ? 3 : b.study.total(id);
  for (let i = 0; i < count; i++) b.action('next');
  assert.equal(b.state.courses[id].active.phase, 'quiz');
}
function correctChoice(id, q) {
  return id === 'g-identity' ? [0, 1][q] : id === 'g-question' ? [0, 2][q] : id === 'g-demo' ? [1, 0][q] : q;
}
function finishQuiz(b, id, missFirst = false) {
  const active = b.state.courses[id].active;
  while (active.phase === 'quiz') {
    const q = active.order[active.cursor];
    const correct = correctChoice(id, q);
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
  assert.match(b.html, /正解是/);
  assert.equal(b.focused, `[data-action="study-answer"][data-choice="${wrong}"]`);
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

test('all three grammar courses have three explanations and two questions with stable score semantics', () => {
  const b = harness(); b.render('#grammar');
  assert.equal((b.html.match(/data-action="study-open"/g) || []).length, 3);
  for (const id of ['g-identity', 'g-question', 'g-demo']) {
    assert.equal(b.study.total(id), 2);
    startQuiz(b, id); finishQuiz(b, id, true);
    const result = b.records.at(-1);
    assert.equal(result.courseId, id); assert.equal(result.firstCorrect, 1); assert.deepEqual(result.retryQuestions, [1]);
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
  const answers = { 't-place': [0, 1], 't-order': [1, 2], 't-pay': [0, 1], 't-charge': [2, 0] };
  const b = harness(null, [{lang: 'ja-JP'}]);
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
