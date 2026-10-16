/** Dependency-free state/interaction regression checks.
 * Run: node --test tests/flow.test.mjs
 * This deliberately small DOM double verifies app behavior, not layout or AT output.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const source = readFileSync(new URL("../dist/app.js", import.meta.url), "utf8");
const index = readFileSync(
  new URL("../dist/index.html", import.meta.url),
  "utf8",
);
const key = "sorachi:first-lesson:v1";
const contentContext = vm.createContext({});
vm.runInContext(readFileSync(new URL('../dist/content.js', import.meta.url), 'utf8'), contentContext);
const introRevision = vm.runInContext('Content.courseRevision("intro")', contentContext);

function browser({
  saved = null,
  raw,
  hash = "#home",
  storageBlocked = false,
} = {}) {
  let initialKey = key;
  try { if (JSON.parse(raw)?.schemaVersion) initialKey = "sorachi:data:v2"; } catch {}
  const storage = new Map([[initialKey, raw ?? JSON.stringify(saved)]]);
  const windowListeners = new Map();
  const documentListeners = new Map();
  const pending = [];
  let html = "";
  let renderCount = 0;
  let reloads = 0;
  const created = [];
  let focused = null;
  let currentHash = hash;
  const elements = new Map();
  const add = (map, type, fn) => map.set(type, [...(map.get(type) || []), fn]);
  const dispatch = (map, type, event) =>
    (map.get(type) || []).forEach((fn) => fn(event));

  function element(selector, markup = "") {
    const listeners = new Map();
    const attributes = {};
    for (const match of markup.matchAll(/([\w-]+)="([^"]*)"/g))
      attributes[match[1]] = match[2];
    const node = {
      selector,
      attributes,
      dataset: Object.fromEntries(
        Object.entries(attributes)
          .filter(([name]) => name.startsWith("data-"))
          .map(([name, value]) => [name.slice(5), value]),
      ),
      disabled: /\sdisabled(?:\s|>|=)/.test(markup),
      innerHTML: "",
      textContent: "",
      children: [],
      querySelector(query) {
        this._descendants ||= new Map();
        if (!this._descendants.has(query))
          this._descendants.set(query, element(`${selector} ${query}`));
        return this._descendants.get(query);
      },
      append(child) {
        this.children.push(child);
        this.textContent += child.textContent;
      },
      replaceChildren(...children) {
        this.children = children;
        this.textContent = children.map((child) => child.textContent).join("");
      },
      remove() {
        this.removed = true;
      },
      removeAttribute(name) {
        delete attributes[name];
      },
      classList: {
        toggle(name, force) {
          const names = new Set(
            (attributes.class || "").split(" ").filter(Boolean),
          );
          if (force) names.add(name);
          else names.delete(name);
          attributes.class = [...names].join(" ");
        },
        contains(name) {
          return (attributes.class || "").split(" ").includes(name);
        },
      },
      focus() {
        focused = selector;
      },
      scrollIntoView() {},
      setCustomValidity(value) { this.validationMessage = value; },
      reportValidity() { return !this.validationMessage; },
      setAttribute(name, value) {
        attributes[name] = String(value);
      },
      getAttribute(name) {
        return attributes[name] ?? null;
      },
      addEventListener(type, fn) {
        add(listeners, type, fn);
      },
      closest(query) {
        if (
          query === selector ||
          (query === "button" && markup.startsWith("<button"))
        )
          return node;
        if (query === "a" && markup.startsWith("<a")) return node;
        return null;
      },
      _listeners: listeners,
    };
    return node;
  }
  function querySelector(selector) {
    if (selector === "#app") return app;
    if (elements.has(selector)) return elements.get(selector);
    let match;
    if (selector === "#main" || selector === "main")
      match = html.match(/<main\b[^>]*>/);
    else if (selector === ".focus-heading") match = html.match(/<h1\b[^>]*>/);
    else if (/^\[data-(action|answer)=/.test(selector)) {
      const [, name, value] =
        selector.match(/^\[data-(action|answer)=["']([^"']+)["']\]$/) || [];
      match = html.match(
        new RegExp(`<button\\b[^>]*data-${name}="${value}"[^>]*>`),
      );
    } else if (selector.startsWith("#"))
      match = (html + index).match(
        new RegExp(`<[^>]+id="${selector.slice(1)}"[^>]*>`),
      );
    else if (selector.startsWith("."))
      match = (html + index).match(
        new RegExp(`<[^>]+class="[^"]*\\b${selector.slice(1)}\\b[^"]*"[^>]*>`),
      );
    if (!match) return null;
    const node = element(selector, match[0]);
    elements.set(selector, node);
    return node;
  }
  const app = element("#app");
  Object.defineProperty(app, "innerHTML", {
    get() {
      return html;
    },
    set(value) {
      html = value;
      renderCount++;
      // The skip link lives outside #app and retains its listeners across renders.
      for (const selector of elements.keys())
        if (selector !== ".skip-link") elements.delete(selector);
    },
  });
  app.querySelector = querySelector;
  const document = {
    title: "",
    scripts: [...index.matchAll(/<script[^>]+src="([^"]+)"/g)].map(([,src]) => ({src})),
    querySelector,
    querySelectorAll(selector) {
      if (selector !== '[data-action="study-answer"]') return [];
      return [...html.matchAll(/<button\b[^>]*data-action="study-answer"[^>]*>/g)].map(([markup]) => {
        const choice = markup.match(/data-choice="(\d+)"/)[1];
        const key = `study-answer-${choice}`;
        if (!elements.has(key)) elements.set(key, element(key, markup));
        return elements.get(key);
      });
    },
    createElement(tag) {
      const node = element(tag, `<${tag}>`);
      node.click = () => { node.clicked = true; };
      created.push(node);
      return node;
    },
    createTextNode(text) {
      return { textContent: text };
    },
    getElementById(id) {
      return querySelector(`#${id}`);
    },
    addEventListener(type, fn) {
      add(documentListeners, type, fn);
    },
  };
  const location = { reload() { reloads++; } };
  Object.defineProperty(location, "hash", {
    get() {
      return currentHash;
    },
    set(value) {
      if (value !== currentHash) {
        currentHash = value;
        pending.push(() => dispatch(windowListeners, "hashchange", {}));
      }
    },
  });
  const context = vm.createContext({
    document,
    location,
    window: {
      location,
      history: {replaceState(_state, _title, hash) { currentHash = hash; }},
      scrollTo() {},
      addEventListener(type, fn) {
        add(windowListeners, type, fn);
      },
    },
    localStorage: {
      getItem(name) {
        if (storageBlocked) throw new Error("storage unavailable");
        return storage.get(name) ?? null;
      },
      setItem(name, value) {
        if (storageBlocked) throw new Error("storage unavailable");
        storage.set(name, value);
      },
      removeItem(name) {
        if (storageBlocked) throw new Error("storage unavailable");
        storage.delete(name);
      },
    },
    setTimeout(fn) {
      pending.push(fn);
      return pending.length;
    },
    clearTimeout() {},
    requestAnimationFrame(fn) {
      pending.push(fn);
    },
    console,
    URL,
  });
  const flush = () => {
    while (pending.length) pending.shift()();
  };
  for (const file of ["content.js", "storage.js", "kana-practice.js", "kana-hints.js"]) vm.runInContext(readFileSync(new URL(`../dist/${file}`, import.meta.url), "utf8"), context);
  vm.runInContext(readFileSync(new URL("../dist/study.js", import.meta.url), "utf8"), context);
  vm.runInContext(readFileSync(new URL("../dist/diagnostics.js", import.meta.url), "utf8"), context);
  vm.runInContext(source, context, { filename: "dist/app.js" });
  flush();
  function click(selector, { force = false } = {}) {
    const node = querySelector(selector);
    assert.ok(node, `Expected visible control ${selector}`);
    if (node.disabled && !force) return;
    const originalDisabled = node.disabled;
    if (force) node.disabled = false;
    const event = {
      target: node,
      defaultPrevented: false,
      preventDefault() {
        this.defaultPrevented = true;
      },
    };
    node.focus();
    dispatch(node._listeners, "click", event);
    if (selector !== ".skip-link") dispatch(app._listeners, "click", event);
    dispatch(documentListeners, "click", event);
    if (!event.defaultPrevented && node.attributes.href)
      location.hash = node.attributes.href;
    node.disabled = originalDisabled;
    flush();
  }
  return {
    click,
    navigate(hash) { location.hash = hash; flush(); },
    blockStorage() { storageBlocked = true; },
    externalWrite(value) {
      storage.set("sorachi:data:v2", value);
      dispatch(windowListeners, "storage", {key:"sorachi:data:v2"});
      flush();
    },
    submitFeedback(category, message) {
      querySelector('#feedback-category').value = category;
      querySelector('#feedback-message').value = message;
      dispatch(app._listeners, 'submit', {target:{id:'feedback-form'}, preventDefault() {}});
    },
    inputFeedback(category, message) {
      querySelector('#feedback-category').value = category;
      querySelector('#feedback-message').value = message;
      dispatch(app._listeners, 'input', {});
    },
    node: querySelector,
    get renderCount() {
      return renderCount;
    },
    study(action, extra = {}) {
      const markup = `<button data-action="${action}" ${Object.entries(extra).map(([key,value]) => `data-${key}="${value}"`).join(' ')}>`;
      dispatch(app._listeners, 'click', {target:element('button', markup)});
      flush();
    },
    get title() { return document.title; },
    action(name, options) {
      click(`[data-action="${name}"]`, options);
    },
    answer(number) {
      click(`[data-answer="${number}"]`);
    },
    get state() {
      return JSON.parse(vm.runInContext("JSON.stringify(progress)", context));
    },
    get html() {
      return html;
    },
    get hash() {
      return currentHash;
    },
    get focused() {
      return focused;
    },
    get stored() {
      return storage.get("sorachi:data:v2") ?? storage.get(key);
    },
    get legacy() {
      return storage.get(key);
    },
    get reloads() { return reloads; },
    change(id, files) {
      dispatch(app._listeners, 'change', { target: { id, files } });
      flush();
    },
    get created() { return created; },
    get storage() { return storage; },
    get nextDisabled() {
      return querySelector('[data-action="next"]')?.disabled;
    },
  };
}

function reachQuiz(b) {
  b.action("start");
  for (let i = 0; i < 4; i++) b.action("next");
}
function complete(b) {
  reachQuiz(b);
  b.answer(0);
  b.action("next");
  b.answer(1);
  b.action("next");
}

test("skip link focuses main without changing lesson or progress", () => {
  const b = browser();
  b.action("start");
  b.action("next");
  b.click(".skip-link");
  assert.equal(b.hash, "#lesson");
  assert.equal(b.state.step, 1);
  assert.ok(["#main", "main"].includes(b.focused));
  assert.match(b.html, /lesson-main/);
});

test("earned completion survives replay, and paused replay resumes after reload", () => {
  const b = browser();
  complete(b);
  assert.equal(b.hash, "#done");
  assert.equal(b.state.completed, true);
  b.action("restart");
  b.action("next");
  b.action("next");
  assert.equal(b.state.completed, true);
  b.navigate('#home');
  const reloaded = browser({ raw: b.stored });
  assert.match(reloaded.html, />接著學/);
  reloaded.action("start");
  assert.equal(reloaded.state.step, 2);
  assert.equal(reloaded.state.completed, true);
  assert.equal(reloaded.hash, "#lesson");
});

test("malformed saved JSON recovers to a usable, persistable fresh lesson", () => {
  const b = browser({ raw: "{broken json" });
  assert.equal(b.state.step, 0);
  assert.equal(b.state.completed, false);
  assert.doesNotMatch(b.html, /目前瀏覽器無法儲存進度/);
  b.action("start");
  b.action("next");
  assert.equal(JSON.parse(b.stored).learning.intro.step, 1);
  assert.doesNotMatch(b.html, /目前瀏覽器無法儲存進度/);
});

test("out-of-range saved step is clamped and unmet question prerequisite is restored", () => {
  const b = browser({
    saved: { step: 99, completed: false, answers: {}, contentRevision: introRevision },
    hash: "#lesson",
  });
  assert.equal(b.state.step, 4);
  assert.equal(b.nextDisabled, true);
  const malformed = browser({
    saved: { step: "garbage", completed: "yes", answers: null },
    hash: "#lesson",
  });
  assert.equal(malformed.state.step, 0);
  assert.equal(malformed.state.completed, false);
});

test("wrong answer can be retried and neither unanswered quiz can be bypassed", () => {
  const b = browser();
  reachQuiz(b);
  assert.equal(b.state.step, 4);
  assert.equal(b.nextDisabled, true);
  b.action("next", { force: true });
  assert.equal(b.state.step, 4);
  b.answer(1);
  assert.equal(b.nextDisabled, true);
  assert.equal(b.node(".feedback").classList.contains("wrong"), true);
  b.answer(0);
  assert.equal(b.nextDisabled, false);
  assert.equal(b.state.answers[4], true);
  b.action("next");
  assert.equal(b.state.step, 5);
  b.action("next", { force: true });
  assert.equal(b.state.completed, false);
  assert.equal(b.hash, "#lesson");
  b.answer(0);
  assert.equal(b.nextDisabled, true);
  b.answer(1);
  b.action("next");
  assert.equal(b.state.completed, true);
  assert.equal(b.hash, "#done");
});

test("blocked storage still allows finishing and explains that progress cannot be saved", () => {
  const b = browser({ storageBlocked: true });
  complete(b);
  assert.equal(b.state.completed, true);
  assert.equal(b.hash, "#done");
  assert.match(b.html, /無法保存紀錄|無法儲存進度/);
});

test("answer feedback and focused choices remain mounted across retries and success", () => {
  const b = browser();
  reachQuiz(b);
  const feedback = b.node(".feedback");
  const correctChoice = b.node('[data-answer="0"]');
  const renders = b.renderCount;
  b.answer(1);
  assert.equal(b.renderCount, renders);
  assert.equal(b.node(".feedback"), feedback);
  assert.equal(b.focused, '[data-answer="1"]');
  assert.match(feedback.textContent, /再看一下提示/);
  b.answer(0);
  assert.equal(b.renderCount, renders);
  assert.equal(b.node(".feedback"), feedback);
  assert.equal(b.node('[data-answer="0"]'), correctChoice);
  assert.equal(b.focused, '[data-answer="0"]');
  assert.match(feedback.textContent, /沒錯，是平假名/);
  assert.equal(correctChoice.classList.contains("correct"), true);
  assert.equal(
    correctChoice.disabled,
    false,
    "Avoid native disabling the focused element",
  );
  assert.equal(correctChoice.getAttribute("aria-disabled"), "true");
  assert.equal(correctChoice.tabIndex, -1);
  assert.equal(b.node('[data-action="next"]').disabled, false);
  b.answer(2); // Repeated activation must not change a correct response.
  assert.match(feedback.textContent, /沒錯，是平假名/);
});

test("opening the lesson URL directly records an active resumable attempt", () => {
  const b = browser({ hash: "#lesson" });
  assert.equal(b.state.inProgress, true);
  b.action("next");
  b.navigate('#home');
  const reloaded = browser({ raw: b.stored });
  assert.match(reloaded.html, />接著學/);
  reloaded.action("start");
  assert.equal(reloaded.state.step, 1);
});

test("start button begins at the first step when a stale attempt is no longer active", () => {
  const b = browser({
    saved: { step: 3, completed: false, inProgress: false },
  });
  assert.match(b.html, />認識三種日文寫法/);
  b.action("start");
  assert.equal(b.state.step, 0);
  assert.equal(b.state.inProgress, true);
});

test("first response is retained through retries and reload and recorded once", () => {
  const b = browser();
  reachQuiz(b);
  b.answer(2);
  const resumed = browser({ raw: b.stored, hash: '#lesson' });
  resumed.answer(0);
  resumed.action('next');
  resumed.answer(1);
  resumed.action('next');
  assert.equal(resumed.state.history.length, 1);
  assert.equal(resumed.state.history[0].firstCorrect, 1);
  assert.deepEqual(resumed.state.history[0].retryQuestions, [4]);
  const done = browser({ raw: resumed.stored, hash: '#done' });
  assert.equal(done.state.history.length, 1);
  done.navigate('#home');
  complete(done);
  assert.equal(done.state.history.length, 2);
  assert.equal(done.state.history[1].firstCorrect, 2);
});

test("legacy completions do not invent a score and history clear preserves learning progress", () => {
  const b = browser({ saved: { step: 5, completed: true, answers: {4:true,5:true} }, hash:'#history' });
  assert.match(b.html, /尚未留下成績/);
  assert.equal(b.state.history.length, 0);
  b.navigate('#home');
  complete(b);
  b.action('history');
  b.action('clear-history');
  assert.equal(b.state.history.length, 1, 'Clearing needs a second deliberate action');
  b.action('confirm-clear');
  assert.equal(b.state.history.length, 0);
  assert.equal(b.state.completed, true);
});

test("back to the lesson after completion preserves results until explicit replay", () => {
  const b = browser();
  complete(b);
  const revisit = browser({ raw:b.stored, hash:'#lesson' });
  assert.equal(revisit.hash, '#done');
  assert.equal(revisit.state.step, 5);
  assert.deepEqual(revisit.state.firstAnswers, b.state.firstAnswers);
  assert.match(revisit.html, /日文的三種文字已完成/);
  revisit.action('restart');
  assert.equal(revisit.hash, '#lesson');
  assert.equal(revisit.state.step, 0);
  assert.deepEqual(revisit.state.firstAnswers, {});
  assert.equal(revisit.state.history.length, 1);
});

test("invalid history entries are discarded, valid scores stay bounded", () => {
  const b = browser({ saved: {history: [null, {date:'<img>', firstCorrect:2}, {date:'2026-10-15T10:00:00.000Z',firstCorrect:9,retryQuestions:[]}]}, hash:'#history' });
  assert.equal(b.state.history.length, 0);
  assert.doesNotMatch(b.html, /<img>/);
});


test("feedback creates a correctly encoded draft link without publishing or leaking scores", () => {
  const b = browser();
  reachQuiz(b);
  b.action('feedback');
  assert.match(b.html, /小練習 1/);
  b.submitFeedback('問題回報', '  ');
  assert.equal(b.node('#feedback-message').validationMessage, '請先寫下一點內容。');
  assert.equal(b.node('#feedback-ready').children.length, 0);
  const message = '<script>alert("hello")</script> & # + 日本語';
  b.submitFeedback('問題回報', message);
  const ready = b.node('#feedback-ready');
  assert.equal(ready.children.length, 2);
  const url = new URL(ready.children[1].href);
  assert.equal(url.origin, 'https://github.com');
  assert.equal(url.pathname, '/HanaYukii/sorachi/issues/new');
  assert.match(url.searchParams.get('body'), /<script>alert/);
  assert.match(url.searchParams.get('body'), /小練習 1/);
  assert.doesNotMatch(url.searchParams.get('body'), /firstAnswers|history/);
  b.inputFeedback('學習建議', message);
  assert.equal(ready.children.length, 0, 'Edits must invalidate the prepared link');
  b.action('feedback-back');
  assert.equal(b.state.step, 4);
  b.action('feedback');
  assert.match(b.html, /&lt;script&gt;/);
  assert.doesNotMatch(b.html, /<script>alert/);
});

test("history keeps two hundred completions and compatible partial attempts with missing first answers remain unscored", () => {
  const history = Array.from({length:205}, (_,i) => ({date:new Date(2026,0,i+1).toISOString(),firstCorrect:2,retryQuestions:[]}));
  const b = browser({saved:{step:5,inProgress:true,answers:{4:true},history,contentRevision:introRevision}, hash:'#lesson'});
  assert.equal(b.state.history.length, 200);
  b.answer(1);
  b.action('next');
  assert.equal(b.state.history.length, 200);
  assert.equal(b.state.history[199].firstCorrect, null);
});


test("failed deletion does not falsely show an empty history", () => {
  const b = browser();
  complete(b);
  b.action('history');
  b.blockStorage();
  b.action('clear-history');
  b.action('confirm-clear');
  assert.equal(b.state.history.length, 1);
  assert.match(b.node('.storage-warning').textContent, /尚未清除/);
});


test("feedback rejects overlong input and its maximum CJK draft stays below 8 KB", () => {
  const b = browser({ hash:'#feedback' });
  b.submitFeedback('問題回報', '字'.repeat(601));
  assert.equal(b.node('#feedback-ready').children.length, 0);
  assert.match(b.node('#feedback-message').validationMessage, /600/);
  b.submitFeedback('問題回報', '字'.repeat(600));
  const url = b.node('#feedback-ready').children[1].href;
  assert.ok(url.length < 8000);
  assert.ok(new URL(url).searchParams.get('body').startsWith('字'.repeat(600)));
});

test("an old completion route cannot show an unfinished replay as completed", () => {
  const b = browser();
  complete(b);
  b.action('restart');
  for (let i = 0; i < 4; i++) b.action('next');
  b.answer(0);
  b.action('next');
  b.answer(0);
  const revisit = browser({ raw:b.stored, hash:'#done' });
  assert.equal(revisit.hash, '#lesson');
  assert.equal(revisit.state.inProgress, true);
  assert.equal(revisit.state.history.length, 1);
  assert.equal(revisit.state.history[0].firstCorrect, 2);
  assert.doesNotMatch(revisit.html, /兩題都完成了/);
});


test("kana attempts share the history store and resume first responses across reload", () => {
  const b = browser({hash:'#study/h-a'});
  for (let i=0;i<5;i++) b.study('study-next');
  const firstQ = b.state.study.courses['h-a'].active.order[0];
  const firstPractice = b.state.study.courses['h-a'].active.practice.questions[0];
  b.study('study-answer', {choice:firstPractice.options.findIndex(id=>id!==firstPractice.id)});
  const resumed = browser({raw:b.stored, hash:'#study/h-a'});
  assert.equal(resumed.state.study.courses['h-a'].active.first[firstQ], false);
  for (let guard=0;guard<12 && resumed.state.study.courses['h-a'].active.phase!=='done';guard++) {
    const session = resumed.state.study.courses['h-a'].active.practice;
    const q = (session.round==='retry'?session.retryQuestions:session.questions)[session.cursor];
    resumed.study('study-answer', {choice:q.options.indexOf(q.id)});
    resumed.study('study-next');
  }
  assert.equal(resumed.state.history.length, 1);
  assert.equal(resumed.state.history[0].courseId, 'h-a');
  assert.equal(resumed.state.history[0].total, 5);
  assert.equal(resumed.state.history[0].firstCorrect, 4);
  const reloaded = browser({raw:resumed.stored,hash:'#history'});
  assert.match(reloaded.html, /平假名・あ行/);
  assert.match(reloaded.html, /4 \/ 5/);
  reloaded.action('clear-history');
  reloaded.action('confirm-clear');
  assert.equal(reloaded.state.history.length, 0);
  assert.equal(reloaded.state.study.courses['h-a'].attempts, 1);
});

test("feedback returns to the current study card with its course title", () => {
  const b = browser({hash:'#study/g-question'});
  b.study('study-next');
  b.action('feedback');
  assert.match(b.html, /認識第 2 步/);
  b.action('feedback-back');
  assert.equal(b.hash, '#study/g-question');
  assert.match(b.title, /疑問句/);
  assert.equal(b.state.study.courses['g-question'].active.cursor, 1);
});


test("home explains the task and sends beginners directly to the first kana group", () => {
  const b = browser();
  assert.match(b.html, /日文入門/);
  assert.match(b.html, /看字與讀音，再做選擇題/);
  assert.match(b.html, /data-action="study-open" data-course="h-a"/);
  assert.doesNotMatch(b.html, /あ、ア、山/);
  b.study('study-open', {course:'h-a'});
  assert.equal(b.hash, '#study/h-a');
  assert.match(b.html, /認字與讀音 · 1 \/ 5/);
  assert.equal(b.state.study.courses['h-a']?.active ?? null, null);
});

test('retired travel quiz routes open the phrasebook and old travel records keep their titles', () => {
  const list = browser({hash:'#travel'});
  assert.equal(list.title, '旅遊常用語｜SoraChi');
  list.action('feedback');
  assert.match(list.html, /旅遊常用語列表/);
  list.action('feedback-back');
  assert.equal(list.hash, '#travel');
  list.navigate('#study/t-pay');
  assert.equal(list.hash, '#travel/t-pay');
  assert.doesNotMatch(list.html, /找不到這堂課/);
  assert.match(list.html, /お会計/);
  assert.equal(list.state.study.courses['t-pay'], undefined, 'Browsing the phrasebook never creates course progress');
  const data = JSON.parse(list.stored);
  data.attempts = [
    { id: 'old-pay', courseId: 't-pay', date: '2026-10-01T00:00:00.000Z', courseTitle: '結帳：請店員算錢', courseRevision: 'c1-013959d1f911ef92', total: 2, firstCorrect: 2, retryQuestions: [] },
    { id: 'old-order', courseId: 't-order', date: '2026-10-02T00:00:00.000Z', total: 2, firstCorrect: 1, retryQuestions: [2] },
  ];
  const reloaded = browser({ raw: JSON.stringify(data), hash: '#history' });
  assert.match(reloaded.html, /結帳：請店員算錢/);
  assert.match(reloaded.html, /點餐：品項、數量、冷熱與份量/, 'A record saved without a title falls back to the retired course title');
  assert.match(reloaded.html, /2 \/ 2/);
  assert.equal(reloaded.state.history.length, 2);
});

test('home travel entry is separate from grammar and phrasebook feedback returns without starting a course', () => {
  const b = browser();
  assert.match(b.html, /data-action="travel"/);
  b.action('travel');
  assert.equal(b.hash, '#travel');
  assert.doesNotMatch(b.html, /基礎句型|data-action="study-open"/);
  assert.deepEqual(Object.keys(b.state.study.courses), []);
  const item = browser({hash:'#travel/hotel'});
  assert.equal(item.title, '飯店與預約｜SoraChi');
  item.action('feedback');
  assert.match(item.html, /旅遊常用語・飯店與預約/);
  item.action('feedback-back');
  assert.equal(item.hash, '#travel/hotel');
  assert.equal(item.title, '飯店與預約｜SoraChi');
  assert.equal(item.state.history.length, 0);
  assert.deepEqual(Object.keys(item.state.study.courses), []);
});


test("external storage changes warn in place and block stale progress writes", () => {
  const b = browser();
  reachQuiz(b);
  const renderCount = b.renderCount;
  const changed = JSON.parse(b.stored);
  changed.preferences.ttsRate = 0.8;
  const raw = JSON.stringify(changed);
  b.externalWrite(raw);
  assert.equal(b.renderCount, renderCount, 'Keep the current question and focus mounted');
  assert.match(b.node('#storage-status').innerHTML, /另一個分頁/);
  assert.match(b.node('#storage-status').innerHTML, /storage-conflict/, 'Use the pinned conflict style');
  b.answer(0);
  assert.equal(b.stored, raw, 'Do not overwrite the other tab after answering');
  assert.match(b.node('#storage-status').innerHTML, /重新載入/);
});


test("saving known lessons retains progress for a retired course", () => {
  const first = browser();
  first.action('start');
  const snapshot = JSON.parse(first.stored);
  const retired = {attempts:2,completedAt:'2026-10-15T10:00:00.000Z',lastResult:{firstCorrect:2,total:2},active:null};
  snapshot.learning.study.courses['retired-course'] = retired;
  const b = browser({raw:JSON.stringify(snapshot)});
  b.action('start');
  b.action('next');
  assert.deepEqual(JSON.parse(b.stored).learning.study.courses['retired-course'], retired);
});

test("invalid primary history remains intact and is not described as no previous learning", () => {
  const first = browser();
  first.action('start');
  const snapshot = JSON.parse(first.stored);
  snapshot.attempts = [{date:'2026-10-15T10:00:00.000Z',firstCorrect:9,total:2,retryQuestions:[]}];
  const raw = JSON.stringify(snapshot);
  const b = browser({raw,hash:'#history'});
  assert.match(b.html, /目前無法讀取成績紀錄/);
  assert.equal(b.stored, raw);
});


test("changed intro content resets legacy active answers without erasing earned completion or history", () => {
  const history = [{date:'2026-10-15T10:00:00.000Z',firstCorrect:2,retryQuestions:[]}];
  const b = browser({saved:{step:5,inProgress:true,completed:true,answers:{4:true},firstAnswers:{4:true},history},hash:'#lesson'});
  assert.equal(b.hash, '#done');
  assert.equal(b.state.inProgress, false);
  assert.deepEqual(b.state.firstAnswers, {});
  assert.equal(b.state.completed, true);
  assert.equal(b.state.history.length, 1);
  assert.equal(b.state.history[0].firstCorrect, 2);
});


test("viewing a later kana group does not hijack the home recommendation; flipping a card does", () => {
  const b = browser();
  const initial = b.stored;
  b.study('study-open', {course:'h-sa'});
  assert.equal(b.stored, initial);
  b.navigate('#home');
  assert.match(b.html, /data-course="h-a"/);
  b.study('study-open', {course:'h-ka'});
  b.study('study-next');
  b.study('study-prev');
  b.navigate('#home');
  assert.match(b.html, /data-course="h-ka"/);
  assert.match(b.html, /接著練五十音/);
  const resumed = browser({raw:b.stored});
  assert.match(resumed.html, /data-course="h-ka"/);
});

test("the writing-system introduction stays available after the main learning and travel entries", () => {
  const b = browser();
  assert.equal((b.html.match(/data-action="start"/g) || []).length, 1);
  assert.ok(b.html.indexOf('intro-entry') > b.html.indexOf('learning-path'));
  assert.ok(b.html.indexOf('data-action="grammar"') < b.html.indexOf('intro-entry'));
  assert.ok(b.html.indexOf('data-action="travel"') < b.html.indexOf('intro-entry'));
  b.study('study-open', {course:'h-a'});
  b.study('study-next');
  b.navigate('#home');
  assert.doesNotMatch(b.html, /intro-entry/);
  assert.equal((b.html.match(/data-action="start"/g) || []).length, 1);
  assert.match(b.html, /不用登入；進度只存在這個瀏覽器/);
});

test("feedback captures the displayed shuffled question and loaded asset versions without private learning data", () => {
  const b = browser({hash:'#study/h-a'});
  for (let i=0;i<5;i++) b.study('study-next');
  const active = b.state.study.courses['h-a'].active;
  const questionId = active.questionIds[active.order[active.cursor]];
  const owner = JSON.parse(b.stored).owner.id;
  b.action('feedback');
  b.submitFeedback('問題回報','字'.repeat(600));
  const href = b.node('#feedback-ready').children[1].href;
  const body = new URL(href).searchParams.get('body');
  assert.match(body, /h-a/);
  assert.ok(body.includes(questionId));
  assert.ok(body.includes(active.courseRevision));
  assert.ok(body.includes(active.direction));
  for (const file of ['content','app']) assert.ok(body.includes(index.match(new RegExp(file + '\\.js\\?v=([a-f0-9]{10})'))[1]));
  assert.ok(!body.includes(owner));
  assert.doesNotMatch(body, /firstCorrect|firstAnswers|history|guest|成績|螢幕|userAgent/i);
  assert.ok(Buffer.byteLength(href) < 8192);
});

function finishKanaRound(b, {missFirst=false,missRetry=false}={}) {
  for(let guard=0;guard<12;guard++) {
    const active=b.state.study.courses['h-a'].active;
    if(active.phase==='done')return;
    const session=active.practice;
    const q=(session.round==='retry'?session.retryQuestions:session.questions)[session.cursor];
    const miss=(session.round==='first'&&session.cursor===0&&missFirst)||(session.round==='retry'&&missRetry);
    b.study('study-answer',{choice:q.options.findIndex(id=>miss?id!==q.id:id===q.id)});
    b.study('study-next');
  }
  assert.fail('Kana round must finish after bounded delayed retries');
}

test('short review is reachable from home, clears a recent mistake, and leaves first-attempt history intact',()=>{
  const b=browser({hash:'#study/h-a'});
  const before=b.stored;
  const renders=b.renderCount;
  b.study('study-hint');
  assert.equal(b.stored,before,'Hint switching must not create learning progress');
  assert.equal(b.renderCount,renders,'Hint switching updates the live region in place');
  assert.match(b.node('.hint-label').textContent,/聲音連結/);
  assert.match(b.node('.hint-text').textContent,/讀 a/);
  assert.match(b.html,/<div aria-live="polite" aria-atomic="true"><p class="reading-label hint-label">/);
  for(let i=0;i<5;i++)b.study('study-next');
  const missedId=b.state.study.courses['h-a'].active.practice.questions[0].id;
  finishKanaRound(b,{missFirst:true,missRetry:true});
  assert.equal(b.state.history[0].firstCorrect,4);
  assert.equal(b.state.study.kanaReview[missedId].wrong,true);
  const resumed=browser({raw:b.stored});
  assert.match(resumed.html,/有 1 個字上次答錯/);
  assert.match(resumed.html,/data-action="study-review-start"/);
  resumed.action('study-review-start');
  assert.equal(resumed.title,'五十音複習｜SoraChi');
  assert.ok(resumed.state.study.reviewSession.questions.some(q=>q.id===missedId));
  const first=resumed.state.study.reviewSession.questions[0];
  resumed.action('feedback'); resumed.submitFeedback('問題回報','字'.repeat(600));
  const link=resumed.node('#feedback-ready').children[1].href;
  const body=new URL(link).searchParams.get('body');
  assert.ok(body.includes(first.id)); assert.ok(body.includes(first.direction));
  assert.match(body,/practiceVersion: 1/); assert.match(body,/round: first/);
  assert.ok(Buffer.byteLength(link)<8192);
  resumed.action('feedback-back');
  for(let guard=0;guard<12&&resumed.state.study.reviewSession.round!=='done';guard++){
    const session=resumed.state.study.reviewSession;
    const q=(session.round==='retry'?session.retryQuestions:session.questions)[session.cursor];
    resumed.study('study-answer',{choice:q.options.indexOf(q.id)}); resumed.study('study-next');
  }
  assert.equal(resumed.state.study.reviewSession.round,'done');
  assert.equal(resumed.state.history.length,1); assert.equal(resumed.state.history[0].firstCorrect,4);
  const final=browser({raw:resumed.stored});
  assert.equal(final.state.study.kanaReview[missedId].wrong,false);
  assert.doesNotMatch(final.html,/有 1 個字上次答錯/);
});

test('clearing review-only data explains unfinished practice, persists atomically, and rolls back on write failure',()=>{
  const b=browser({hash:'#study/h-a'});
  for(let i=0;i<5;i++)b.study('study-next');
  const q=b.state.study.courses['h-a'].active.practice.questions[0];
  b.study('study-answer',{choice:q.options.findIndex(id=>id!==q.id)});
  assert.equal(b.state.history.length,0);
  b.navigate('#history'); assert.match(b.html,/清除成績與複習紀錄/);
  b.action('clear-history'); assert.match(b.html,/結束尚未完成的五十音/);
  const stored=b.stored, state=b.state.study;
  b.blockStorage(); b.action('confirm-clear');
  assert.equal(b.stored,stored); assert.deepEqual(b.state.study,state);
  const restored=browser({raw:stored,hash:'#history'});
  restored.action('clear-history'); restored.action('confirm-clear');
  assert.deepEqual(restored.state.study.kanaReview,{});
  assert.equal(restored.state.study.courses['h-a'].active,null);
  const reloaded=browser({raw:restored.stored});
  assert.deepEqual(reloaded.state.study.kanaReview,{});
  assert.doesNotMatch(reloaded.html,/有 1 個字上次答錯/);
});

test('clearing records also retires the v1 copy so a lost v2 key cannot revive cleared history',()=>{
  const legacy={ step: 5, completed: true, answers: {4:true,5:true} };
  const failed=browser({ saved: legacy, hash:'#home' });
  complete(failed); failed.action('history');
  failed.blockStorage(); failed.action('clear-history'); failed.action('confirm-clear');
  assert.ok(failed.legacy, 'A failed clear must not drop the v1 source');
  const b=browser({ saved: legacy, hash:'#home' });
  assert.ok(b.legacy, 'Migration keeps the v1 source until an explicit clear');
  complete(b); b.action('history');
  b.action('clear-history'); b.action('confirm-clear');
  assert.equal(b.state.history.length, 0);
  assert.equal(b.legacy, undefined);
});

test('starting review again while a round is unfinished resumes it instead of replacing it',()=>{
  const b=browser({hash:'#study/h-a'});
  for(let i=0;i<5;i++)b.study('study-next');
  finishKanaRound(b);
  b.navigate('#kana-review'); b.study('study-review-start');
  const session=b.state.study.reviewSession, q=session.questions[0];
  b.study('study-answer',{choice:q.options.indexOf(q.id)}); b.study('study-next');
  b.study('study-review-start');
  assert.equal(b.state.study.reviewSession.cursor,1);
  assert.deepEqual(b.state.study.reviewSession.questions.map(x=>x.id),session.questions.map(x=>x.id));
});

test('author route links the personal website without changing learning progress or publishing a guide',()=>{
 const b=browser({hash:'#study/h-a'});
 b.study('study-next'); const stored=b.stored;
 b.navigate('#about');
 assert.equal(b.title,'關於 SoraChi｜SoraChi');
 assert.match(b.html,/花雪（HanaYukii）/);
 assert.match(b.html,/大量偶像相關翻譯素材/);
 assert.match(b.html,/href="https:\/\/hanayukii.dev\/about" target="_blank" rel="noopener noreferrer"/);
 assert.doesNotMatch(b.html,/#guide|使用說明書/);
 assert.equal(b.stored,stored);
 b.navigate('#home'); assert.match(b.html,/href="#about"/);
 assert.doesNotMatch(b.html,/#guide|使用說明書/);
});

test('home goes on to voiced hiragana after the basic rows, but keeps katakana learners on katakana', () => {
  const withCompleted = (ids) => {
    const data = JSON.parse(browser().stored);
    for (const id of ids) data.learning.study.courses[id] = { completedAt: '2026-10-01T00:00:00.000Z' };
    return browser({ raw: JSON.stringify(data) });
  };
  const basicH = ['a','ka','sa','ta','na','ha','ma','ya','ra','wa'].map((row) => `h-${row}`);
  const hiragana = withCompleted(basicH);
  assert.match(hiragana.html, /data-action="study-open" data-course="h-ga"/);
  assert.match(hiragana.html, /平假名已完成 10 \/ 15 組/);
  const katakana = withCompleted([...basicH, 'k-a', 'k-ka']);
  assert.match(katakana.html, /data-action="study-open" data-course="k-sa"/);
});

test('locked data offers a raw download and a restart that keeps the original and skips v1 migration', () => {
  const locked = JSON.stringify({ schemaVersion: 3, learning: {} });
  const b = browser({ raw: locked, hash: '#history' });
  b.storage.set(key, JSON.stringify({ step: 5, completed: true, answers: {4:true,5:true} }));
  assert.match(b.html, /網站已更新/);
  assert.match(b.html, /目前無法讀取成績紀錄/);
  assert.doesNotMatch(b.html, /還沒有新的成績紀錄/);
  assert.doesNotMatch(b.html, /data-action="clear-history"/);
  b.action('download-raw');
  const link = b.created.at(-1);
  assert.equal(link.clicked, true);
  assert.equal(decodeURIComponent(link.href.replace(/^data:application\/json;charset=utf-8,/, '')), locked);
  assert.match(link.download, /^sorachi-data-\d{4}-\d{2}-\d{2}\.json$/);
  b.action('restart-protected');
  assert.match(b.html, /原始資料會另外保存在這個瀏覽器/);
  b.action('confirm-restart');
  assert.equal(b.reloads, 1);
  const quarantine = [...b.storage.keys()].find((name) => name.startsWith('sorachi:data:v2:quarantine:'));
  assert.equal(b.storage.get(quarantine), locked);
  const fresh = browser({ raw: b.storage.get('sorachi:data:v2'), hash: '#history' });
  assert.match(fresh.html, /還沒有新的成績紀錄/);
  assert.equal(fresh.state.completed, false, 'Restart must not migrate the v1 copy again');
});

test('damaged data points to the record page instead of claiming there is nothing to show', () => {
  const b = browser({ raw: '{"schemaVersion":2}', hash: '#kana' });
  assert.match(b.html, /學習資料無法讀取/);
  assert.match(b.html, /data-action="history">到學習紀錄處理/);
  b.action('history');
  assert.match(b.html, /損壞或缺少欄位/);
  assert.match(b.html, /data-action="download-raw"/);
});

test('newer data leads with refresh, warns that restart hides it from the new site, and ignores clicks while reloading', () => {
  const b = browser({ raw: JSON.stringify({ schemaVersion: 3 }), hash: '#history' });
  assert.match(b.html, /先重新整理這個頁面/);
  assert.match(b.html, /<button class="text-button" data-action="reload">重新整理<\/button><button class="text-button" data-action="download-raw">/);
  assert.match(b.html, /<textarea class="raw-data" readonly[^>]*>\{&quot;schemaVersion&quot;:3\}<\/textarea>/);
  assert.doesNotMatch(b.html, /選擇五十音練習/);
  b.action('restart-protected');
  assert.match(b.html, /之後新版網站也不會顯示這份資料/);
  b.action('confirm-restart');
  assert.equal(b.reloads, 1);
  const stored = b.stored;
  b.action('history');
  assert.equal(b.stored, stored, 'Clicks after a successful restart wait for the reload');
});

test('backup can be downloaded and restored; the restore reloads so later answers cannot overwrite it', async () => {
  const source = browser({ hash: '#home' });
  complete(source);
  const backup = JSON.parse(source.stored);
  const b = browser({ hash: '#history' });
  assert.match(b.html, /data-action="export-backup"/);
  assert.match(b.html, /<input type="file" id="backup-file"/);
  b.action('export-backup');
  assert.match(b.created.at(-1).download, /^sorachi-backup-\d{4}-\d{2}-\d{2}\.json$/);
  const raw = JSON.stringify(backup);
  const file = { size: raw.length, text: async () => raw };
  b.change('backup-file', [file]);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(b.reloads, 1);
  const stored = b.stored;
  b.navigate('#home');
  b.navigate('#lesson');
  assert.equal(b.stored, stored, 'Clicks and route changes before the reload must not save stale memory');
  const reloaded = browser({ raw: stored, hash: '#history' });
  assert.equal(reloaded.state.history.length, 1);
  assert.equal(reloaded.state.completed, true);
  const bad = browser({ hash: '#history' });
  bad.change('backup-file', [{ size: 5, text: async () => 'nope!' }]);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(bad.reloads, 0);
  assert.match(bad.node('#backup-status').textContent, /讀不懂這個檔案/);
});

test('old t-* course progress loads quietly, survives saves, and only known phrasebook ids redirect', () => {
  const data = JSON.parse(browser().stored);
  data.learning.study.courses = { 't-pay': { attempts: 2, completedAt: '2026-09-01T00:00:00.000Z', lastResult: { firstCorrect: 2, total: 2 }, active: { phase: 'done' } } };
  const b = browser({ raw: JSON.stringify(data), hash: '#home' });
  assert.equal(b.state.study.courses['t-pay'], undefined);
  b.study('study-open', { course: 'h-a' });
  assert.equal(JSON.parse(b.stored).learning.study.courses['t-pay'].attempts, 2, 'Retired progress stays in storage untouched');
  b.navigate('#study/t-charge');
  assert.equal(b.hash, '#travel/t-charge');
  assert.equal(b.title, '交通卡加值｜SoraChi');
  b.navigate('#study/t-unknown');
  assert.equal(b.hash, '#study/t-unknown');
  assert.match(b.html, /找不到這堂課/);
  const legacy = browser({ saved: { step: 5, completed: true, answers: {4:true,5:true}, history: [{ courseId: 't-charge', date: '2026-08-01T00:00:00.000Z', total: 2, firstCorrect: 1, retryQuestions: [2] }] }, hash: '#history' });
  assert.match(legacy.html, /交通卡加值/);
  assert.match(legacy.html, /第 2 題/);
});

test('accessibility details: progress text, list role, form descriptions, plain warnings and not-found title', () => {
  const lesson = browser({ hash: '#lesson' });
  assert.match(lesson.html, /role="progressbar"[^>]*aria-valuemin="1"[^>]*aria-valuenow="1" aria-valuetext="第 1 步，共 6 步"><span style="width:16\.\d+%">/);
  assert.match(lesson.html, /<a class="exit" href="#home">/);
  const home = browser();
  assert.match(home.html, /<h2>基礎句型<\/h2>/);
  assert.doesNotMatch(home.html, /<h3>基礎句型<\/h3>/);
  complete(home); home.action('history');
  assert.match(home.html, /<ol class="history-list" role="list">/);
  home.action('feedback');
  assert.match(home.html, /aria-describedby="feedback-limit feedback-privacy"/);
  assert.match(home.html, /id="feedback-limit"/); assert.match(home.html, /id="feedback-privacy"/);
  const blocked = browser({ storageBlocked: true });
  assert.match(blocked.html, /<div id="storage-status"><p class="storage-warning">/);
  assert.doesNotMatch(blocked.html, /storage-warning[^>]*role="status"/);
  const missing = browser({ hash: '#study/nope' });
  assert.equal(missing.title, '找不到頁面｜SoraChi');
});

test('a change in saving state is announced once outside the page, not on every answer', () => {
  const b = browser({ hash: '#study/h-a' });
  for (let i = 0; i < 5; i++) b.study('study-next');
  const announcer = b.node('#announcer');
  assert.equal(announcer.textContent, '');
  b.blockStorage();
  let q = b.state.study.courses['h-a'].active.practice.questions[0];
  b.study('study-answer', { choice: q.options.indexOf(q.id) });
  assert.equal(announcer.textContent, '這次的進度沒有存到瀏覽器。');
  announcer.textContent = '';
  b.study('study-next');
  q = b.state.study.courses['h-a'].active.practice.questions[1];
  b.study('study-answer', { choice: q.options.indexOf(q.id) });
  assert.equal(announcer.textContent, '', 'A repeated failure is not announced again');
  assert.doesNotMatch(b.html, /storage-warning[^>]*role="status"/);
});

test('home and utility pages reach the travel phrases in one tap', () => {
  const b = browser();
  assert.match(b.html, /<a class="header-link" href="#travel">旅遊常用語<\/a>/);
  for (const hash of ['#history', '#about', '#feedback', '#lesson']) {
    b.navigate(hash);
    assert.match(b.html, /<a class="header-link" href="#travel">旅遊常用語<\/a>/, hash);
  }
});

function startKanaQuiz(b, course) {
  b.study('study-open', { course });
  for (let i = 0; i < 10 && b.state.study.courses[course]?.active?.phase !== 'quiz'; i++) b.study('study-next');
  const q = b.state.study.courses[course].active.practice.questions[0];
  b.study('study-answer', { choice: q.options.findIndex((id) => id !== q.id) });
}
const tick = () => { const until = Date.now() + 3; while (Date.now() < until); };

test('a restore never revives practice that a newer clear ended, on either side', async () => {
  const restore = async (b, raw) => {
    b.change('backup-file', [{ size: raw.length, text: async () => raw }]);
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(b.reloads, 1);
    return browser({ raw: b.stored, hash: '#kana' });
  };
  const clearedAt = (b) => JSON.parse(b.stored).learning.study.reviewClearedAt;
  // 1. This browser cleared after the backup was made: the backup's active quiz and review stay ended.
  const a = browser({ hash: '#study/h-a' });
  for (let i = 0; i < 5; i++) a.study('study-next');
  finishKanaRound(a, { missFirst: true });
  startKanaQuiz(a, 'h-ka');
  a.navigate('#kana-review'); a.study('study-review-start');
  const q = a.state.study.reviewSession.questions[0];
  a.study('study-answer', { choice: q.options.indexOf(q.id) });
  const before = JSON.parse(a.stored);
  assert.ok(before.learning.study.reviewSession && before.learning.study.courses['h-ka'].active.phase === 'quiz');
  tick();
  // 1a. Both sides have h-ka.
  a.navigate('#history'); a.action('clear-history'); a.action('confirm-clear');
  const cleared = browser({ raw: a.stored, hash: '#history' });
  const afterLocalClear = await restore(cleared, JSON.stringify(before));
  assert.equal(afterLocalClear.state.study.reviewSession, null);
  assert.equal(afterLocalClear.state.study.courses['h-ka'].active, null);
  assert.ok(afterLocalClear.state.study.courses['h-a'].completedAt, 'Earned completion is kept');
  assert.deepEqual(afterLocalClear.state.study.kanaReview, {});
  assert.equal(afterLocalClear.state.study.reviewClearedAt, clearedAt(cleared));
  // 1b. Only the backup has h-ka.
  const c = browser({ hash: '#study/h-a' });
  for (let i = 0; i < 5; i++) c.study('study-next');
  finishKanaRound(c);
  c.navigate('#history'); c.action('clear-history'); c.action('confirm-clear');
  assert.equal(JSON.parse(c.stored).learning.study.courses['h-ka'], undefined);
  const fresh = browser({ raw: c.stored, hash: '#history' });
  const afterLocalOnly = await restore(fresh, JSON.stringify(before));
  assert.equal(afterLocalOnly.state.study.courses['h-ka']?.active ?? null, null);
  assert.equal(afterLocalOnly.state.study.reviewSession, null);
  assert.deepEqual(afterLocalOnly.state.study.kanaReview, {});
  // 2. The backup cleared after this browser's practice began: local kana rounds and review end,
  //    whether or not the backup has that course; grammar progress stays.
  const b = browser({ hash: '#study/h-a' });
  for (let i = 0; i < 5; i++) b.study('study-next');
  finishKanaRound(b, { missFirst: true });
  startKanaQuiz(b, 'h-ka');
  startKanaQuiz(b, 'k-a');
  b.study('study-open', { course: 'g-demo' }); b.study('study-next');
  assert.equal(b.state.study.courses['g-demo'].active.cursor, 1);
  b.navigate('#kana-review'); b.study('study-review-start');
  assert.ok(b.state.study.reviewSession);
  tick();
  const other = browser({ hash: '#study/h-a' });
  for (let i = 0; i < 5; i++) other.study('study-next');
  finishKanaRound(other);
  startKanaQuiz(other, 'h-ka');
  other.navigate('#history'); other.action('clear-history'); other.action('confirm-clear');
  assert.equal(JSON.parse(other.stored).learning.study.courses['h-ka'].active, null, 'Both sides have h-ka');
  const mine = browser({ raw: b.stored, hash: '#history' });
  const afterRemoteClear = await restore(mine, other.stored);
  const study = afterRemoteClear.state.study;
  assert.equal(study.reviewSession, null);
  assert.equal(study.courses['h-ka'].active, null);
  assert.equal(study.courses['k-a'].active, null, 'A course only this browser has ends too');
  assert.equal(study.courses['g-demo'].active.cursor, 1, 'Grammar progress is not a kana round');
  assert.ok(study.courses['h-a'].completedAt);
  assert.deepEqual(study.kanaReview, {});
  assert.equal(study.reviewClearedAt, clearedAt(other));
});


test('the home shortcut resumes the same review after reload and leaves the next course intact', () => {
  const b = browser({hash: '#study/h-a'});
  for (let i = 0; i < 5; i++) b.study('study-next');
  finishKanaRound(b);
  b.navigate('#home');
  assert.match(b.html, /複習 5 個字/);
  b.action('study-review-start');
  const question = b.state.study.reviewSession.questions[0];
  b.study('study-answer', {choice: question.options.indexOf(question.id)});
  b.study('study-next');
  const session = JSON.stringify(b.state.study.reviewSession);
  const courses = JSON.stringify(b.state.study.courses);
  const reloaded = browser({raw: b.stored});
  assert.match(reloaded.html, /繼續複習/);
  assert.match(reloaded.html, /data-course="h-ka"/);
  reloaded.action('study-review-start');
  assert.equal(reloaded.hash, '#kana-review');
  assert.equal(JSON.stringify(reloaded.state.study.reviewSession), session);
  assert.deepEqual(reloaded.state.study.courses, JSON.parse(courses));
});

test('home category controls open grammar and kana lists without starting a course', () => {
  const b = browser();
  const initial = b.stored;
  b.action('grammar');
  assert.equal(b.hash, '#grammar');
  assert.equal(b.stored, initial);
  b.navigate('#home');
  b.action('kana');
  assert.equal(b.hash, '#kana');
  assert.equal(b.stored, initial);
});
