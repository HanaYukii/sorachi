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
  sharedStorage = null,
  historyState = null,
} = {}) {
  let initialKey = key;
  try { if (JSON.parse(raw)?.schemaVersion) initialKey = "sorachi:data:v2"; } catch {}
  // Two tabs of one browser pass the same Map.
  const storage = sharedStorage ?? new Map([[initialKey, raw ?? JSON.stringify(saved)]]);
  let setItemFails = false;
  const windowListeners = new Map();
  const documentListeners = new Map();
  const pending = [];
  let html = "";
  let renderCount = 0;
  let reloads = 0;
  const created = [];
  let focused = null;
  let currentHash = hash;
  // The tab's history: one entry per hash change, each with its own state; a reload keeps the current entry's state.
  const entries = [{ hash, state: historyState }];
  let at = 0;
  const url = (value) => `http://localhost/${value}`;
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
        const oldURL = url(currentHash);
        currentHash = value;
        entries.splice(at + 1, Infinity, { hash: value, state: null });
        at++;
        pending.push(() => dispatch(windowListeners, "hashchange", { oldURL, newURL: url(value) }));
      }
    },
  });
  function traverse(step) {
    if (!entries[at + step]) return;
    const oldURL = url(currentHash);
    at += step;
    currentHash = entries[at].hash;
    dispatch(windowListeners, "hashchange", { oldURL, newURL: url(currentHash) });
    flush();
  }
  const context = vm.createContext({
    document,
    location,
    window: {
      location,
      history: {
        get state() { return entries[at].state; },
        replaceState(state, _title, hash) {
          entries[at] = { hash: hash ?? entries[at].hash, state: state ?? null };
          currentHash = entries[at].hash;
        },
      },
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
        if (setItemFails) throw new Error("QuotaExceededError");
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
    // The browser's back and forward buttons.
    back() { traverse(-1); },
    forward() { traverse(1); },
    get historyState() { return JSON.parse(JSON.stringify(entries[at].state)); },
    blockStorage() { storageBlocked = true; },
    // A full quota: only setItem throws, so reads and the other-tab check keep working.
    failSetItem(fail = true) { setItemFails = fail; },
    // Another tab wrote the shared storage; the browser tells this tab.
    storageEvent(name = "sorachi:data:v2") {
      dispatch(windowListeners, "storage", {key:name});
      flush();
    },
    run(code) { return vm.runInContext(code, context); },
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


test("home explains the task: the kana card leads to the table, and a beginner can start あ行 straight away", () => {
  const b = browser();
  assert.match(b.html, /日文入門/);
  assert.match(b.html, /看字表、聽讀音，選一行開始。/);
  assert.match(b.html, /<button class="primary" data-action="kana">學五十音/);
  assert.match(b.html, /data-action="study-open" data-course="h-a">先學あ行/);
  assert.doesNotMatch(b.html, /data-action="study-review-start"/, 'Nothing to review yet');
  assert.doesNotMatch(b.html, /あ、ア、山/);
  b.action('kana');
  assert.equal(b.hash, '#kana');
  b.navigate('#home');
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
  assert.match(b.html, /接著學：平假名・か行/);
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
  for (const file of ['content','app','study','storage']) assert.ok(body.includes(`${file}.js: ${index.match(new RegExp(file + '\\.js\\?v=([a-f0-9]{10})'))[1]}`), file);
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
  assert.deepEqual(JSON.parse(b.stored).learning,JSON.parse(before).learning,'Hint switching must not create learning progress');
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
  assert.match(hiragana.html, /下一組：平假名・が行/);
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

test('home uses the travel card while utility pages keep their travel shortcut', () => {
  const b = browser();
  assert.doesNotMatch(b.html.match(/<header[\s\S]*?<\/header>/)[0], /href="#travel"/);
  b.action("travel");
  assert.equal(b.hash, "#travel");
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
test('grammar mini-review: feedback names the question on screen, like the kana review', () => {
  const b = browser({ hash: '#grammar' });
  const lesson = (id) => JSON.parse(vm.runInContext(`JSON.stringify(Content.courses[${JSON.stringify(id)}])`, contentContext));
  for (const id of ['g-identity', 'g-question']) {
    const course = lesson(id);
    b.study('study-open', { course: id });
    for (let i = 0; i < course.steps.length; i++) b.study('study-next');
    for (let i = 0; i < course.questions.length; i++) {
      const active = b.state.study.courses[id].active;
      b.study('study-answer', { choice: course.questions[active.order[active.cursor]].answer });
      b.study('study-next');
    }
  }
  b.navigate('#grammar-review'); b.study('study-grammar-review');
  assert.equal(b.title, '句型小複習｜SoraChi');
  const title = b.html.match(/複習 · 1 \/ \d+ · ([^<]+)<\/p>/)[1], prompt = b.html.match(/study-quiz"><h2>([^<]*)</)[1];
  const question = ['g-identity', 'g-question'].map(lesson).flatMap((c) => c.questions).find((q) => q.prompt === prompt);
  b.action('feedback'); b.submitFeedback('問題回報', '解釋看不懂');
  const body = new URL(b.node('#feedback-ready').children[1].href).searchParams.get('body');
  assert.ok(body.includes(`questionId: ${question.id}`), body);
  assert.ok(body.includes(`所在位置：句型小複習・第 1 題・${title}`), body);
  b.action('feedback-back');
  assert.match(b.html, /複習 · 1 \//, 'Coming back from feedback keeps the round');
});

function completedGrammarBrowser() {
  const b=browser();
  for(const id of ['g-identity','g-question']) {
    const course=vm.runInContext(`Content.courses[${JSON.stringify(id)}]`,contentContext);
    b.study('study-open',{course:id});for(const step of course.steps)b.study('study-next');
    for(const q of course.questions) {
      const active=b.state.study.courses[id].active;
      b.study('study-answer',{choice:course.questions[active.order[active.cursor]].answer});b.study('study-next');
    }
  }
  return b;
}
async function importAndReload(b,raw) {
  b.navigate('#history');b.change('backup-file',[{size:raw.length,text:async()=>raw}]);
  await new Promise(resolve=>setImmediate(resolve));assert.equal(b.reloads,1);
  return browser({raw:b.stored,hash:'#grammar-review'});
}
test('grammar review, favorites and preferences survive backup restore; newer clears win in both directions',async()=>{
  const b=completedGrammarBrowser();b.navigate('#grammar-review');b.study('study-grammar-review');
  const item=b.state.study.grammarReviewSession.items[0];
  const question=vm.runInContext(`Content.courses[${JSON.stringify(item.courseId)}].questions[${item.q}]`,contentContext);
  b.study('study-answer',{choice:(question.answer+1)%question.options.length});
  b.navigate('#travel/t-pay');const phrase=vm.runInContext('Content.phrasebook.find(p=>p.id==="t-pay").steps[0].id',contentContext);
  b.study('study-favorite',{phrase});b.navigate('#settings');b.study('study-rate',{rate:'0.65'});
  b.study('study-open',{course:'h-a'});b.study('study-hint');
  const before=b.stored,restored=await importAndReload(browser(),before);
  assert.equal(restored.state.study.grammarReviewSession.items[0].questionId,question.id);
  assert.equal(restored.state.study.grammarReview[question.id].wrong,true);
  const envelope=JSON.parse(restored.stored);
  assert.deepEqual(envelope.favorites,[phrase]);assert.equal(envelope.preferences.ttsRate,0.65);assert.equal(envelope.preferences.kanaHints['あ'],1);
  const cleared=JSON.parse(before);cleared.learning.study.reviewClearedAt=new Date(Date.now()+1000).toISOString();
  cleared.learning.study.grammarReview={};cleared.learning.study.grammarReviewSession=null;cleared.attempts=[];
  for(const [local,incoming] of [[before,JSON.stringify(cleared)],[JSON.stringify(cleared),before]]) {
    const result=await importAndReload(browser({raw:local}),incoming);
    assert.equal(result.state.study.grammarReviewSession,null);
    assert.deepEqual(JSON.parse(JSON.stringify(result.state.study.grammarReview)),{});
    assert.ok(result.state.study.courses['g-identity'].completedAt);
    const again=browser({raw:result.stored,hash:'#grammar-review'});assert.equal(again.state.study.grammarReviewSession,null);
  }
});
test('clearing review ends grammar sessions, preserves favorites/settings and reports blocked writes',()=>{
 const b=completedGrammarBrowser();b.navigate('#grammar-review');b.study('study-grammar-review');
 b.navigate('#settings');b.study('study-rate',{rate:'0.65'});
 b.navigate('#history');b.action('clear-history');b.action('confirm-clear');
 const r=browser({raw:b.stored});assert.equal(r.state.study.grammarReviewSession,null);assert.equal(JSON.parse(r.stored).preferences.ttsRate,0.65);
 const blocked=browser({hash:'#travel/t-pay'});const before=blocked.stored;blocked.blockStorage();
 const phrase=vm.runInContext('Content.phrasebook.find(p=>p.id==="t-pay").steps[0].id',contentContext);
 blocked.study('study-favorite',{phrase});assert.equal(blocked.stored,before);assert.match(blocked.node('#storage-status').innerHTML,/無法讀取|無法儲存/);
 blocked.navigate('#settings');blocked.study('study-rate',{rate:'1'});assert.equal(blocked.stored,before);assert.match(blocked.html,/aria-pressed="true">一般/);
});


test('grammar review write failure preserves the last stored round and never add scores',()=>{
 const b=completedGrammarBrowser();b.navigate('#grammar-review');b.study('study-grammar-review');
 const original=b.stored,history=JSON.parse(original).attempts;
 const item=b.state.study.grammarReviewSession.items[0];
 const answer=vm.runInContext(`Content.courses[${JSON.stringify(item.courseId)}].questions[${item.q}].answer`,contentContext);
 b.blockStorage();b.study('study-answer',{choice:answer});b.study('study-next');
 assert.equal(b.stored,original);assert.match(b.html,/無法讀取|無法儲存/);
 const r=browser({raw:b.stored,hash:'#grammar-review'});
 assert.equal(r.state.study.grammarReviewSession.cursor,0);
 assert.deepEqual(JSON.parse(JSON.stringify(r.state.study.grammarReviewSession.first)),{});
 assert.deepEqual(JSON.parse(r.stored).attempts,history);
});

// #36: state and data stress scenarios for the kana short review and first scores.
const practiceOf = (b, where) => where === 'review' ? b.state.study.reviewSession : b.state.study.courses[where].active.practice;
const questionOf = (session) => (session.round === 'retry' ? session.retryQuestions : session.questions)[session.cursor];
const choiceFor = (question, wrong = false) => question.options.findIndex((id) => wrong ? id !== question.id : id === question.id);
// The warning is updated in place after an answer and rendered into the page after a redraw.
const storageWarning = (b) => `${b.node('#storage-status')?.innerHTML || ''}${b.html.match(/<div id="storage-status">(.*?)<\/div>/)?.[1] || ''}`;
function openKanaQuiz(b, course) {
  b.study('study-open', { course });
  for (let i = 0; i < 10 && b.state.study.courses[course]?.active?.phase !== 'quiz'; i++) b.study('study-next');
  assert.equal(b.state.study.courses[course].active.phase, 'quiz');
}
// Plays to the end of the round; `miss` picks the first-round questions to answer wrong, the retry is answered right.
function playRound(b, where, miss = () => false) {
  for (let guard = 0; guard < 15; guard++) {
    const session = practiceOf(b, where);
    if (session.round === 'done') return;
    b.study('study-answer', { choice: choiceFor(questionOf(session), session.round === 'first' && miss(questionOf(session), session)) });
    b.study('study-next');
  }
  assert.fail('The round must finish');
}

test('a course answer during an unfinished review updates the mistake list but never the review round, also after reload', () => {
  for (const courseWrong of [false, true]) {
    let b = browser({ hash: '#study/h-a' });
    openKanaQuiz(b, 'h-a');
    const x = questionOf(practiceOf(b, 'h-a')).id;
    playRound(b, 'h-a', (q) => q.id === x);
    assert.equal(b.state.study.kanaReview[x].wrong, false);
    b.navigate('#kana-review'); b.study('study-review-start');
    // Leave the review on x, answered wrong, before 下一題.
    for (let guard = 0; guard < 5; guard++) {
      const q = questionOf(practiceOf(b, 'review'));
      b.study('study-answer', { choice: choiceFor(q, q.id === x) });
      if (q.id === x) break;
      b.study('study-next');
    }
    assert.equal(b.state.study.kanaReview[x].wrong, true);
    const round = JSON.stringify(b.state.study.reviewSession);
    b.navigate('#kana');
    openKanaQuiz(b, 'h-a');
    for (let guard = 0; guard < 5; guard++) {
      const q = questionOf(practiceOf(b, 'h-a'));
      if (q.id === x) { b.study('study-answer', { choice: choiceFor(q, courseWrong) }); break; }
      b.study('study-answer', { choice: choiceFor(q) }); b.study('study-next');
    }
    assert.equal(b.state.study.kanaReview[x].wrong, courseWrong, 'The latest answer decides');
    assert.equal(JSON.stringify(b.state.study.reviewSession), round, 'A course quiz never changes the review round');
    b = browser({ raw: b.stored, hash: '#kana-review' });
    assert.equal(JSON.stringify(b.state.study.reviewSession), round, 'The review round survives the reload unchanged');
    assert.equal(b.state.study.kanaReview[x].wrong, courseWrong);
    const records = b.state.history.length;
    let retried = false;
    b.study('study-next');
    for (let guard = 0; guard < 12 && practiceOf(b, 'review').round !== 'done'; guard++) {
      const session = practiceOf(b, 'review');
      retried ||= session.round === 'retry' && questionOf(session).id === x;
      b.study('study-answer', { choice: choiceFor(questionOf(session)) }); b.study('study-next');
    }
    assert.equal(practiceOf(b, 'review').round, 'done');
    assert.ok(retried, 'x, missed first in this round, comes back in its retry');
    assert.equal(b.state.study.kanaReview[x].wrong, false);
    assert.equal(b.state.history.length, records, 'The review adds no record');
  }
});

test('clearing records drops an untouched kana draft; restoring a pre-clear backup brings back its history records by design, but not mistakes, the review round or unfinished kana practice', async () => {
  const b = browser({ hash: '#study/h-a' });
  const attempt = (id) => JSON.parse(b.run(`JSON.stringify(Study.currentAttempt(${JSON.stringify(id)}))`));
  openKanaQuiz(b, 'h-a');
  playRound(b, 'h-a', (q, session) => session.cursor === 0);
  openKanaQuiz(b, 'h-ka');
  b.study('study-answer', { choice: choiceFor(questionOf(practiceOf(b, 'h-ka')), true) });
  b.navigate('#kana-review'); b.study('study-review-start');
  b.study('study-answer', { choice: choiceFor(questionOf(practiceOf(b, 'review')), true) });
  const backup = b.stored, before = JSON.parse(backup).learning.study;
  assert.equal(JSON.parse(backup).attempts.length, 1);
  assert.ok(Object.values(before.kanaReview).some((item) => item.wrong) && before.reviewSession && before.courses['h-ka'].active);
  b.navigate('#kana'); b.study('study-open', { course: 'h-sa' });
  b.navigate('#grammar'); b.study('study-open', { course: 'g-identity' });
  const grammarDraft = attempt('g-identity');
  assert.equal(attempt('h-sa').touched, false);
  assert.equal(JSON.parse(b.stored).learning.study.courses['h-sa'], undefined, 'An untouched draft is never stored');
  tick();
  b.navigate('#history'); b.action('clear-history'); b.action('confirm-clear');
  assert.equal(attempt('h-sa'), null, 'The untouched kana draft ends with the other kana practice');
  assert.deepEqual(attempt('g-identity'), grammarDraft, 'A grammar draft is not kana practice');
  b.study('study-open', { course: 'h-sa' });
  const fresh = attempt('h-sa');
  assert.equal(fresh.touched, false); assert.equal(fresh.phase, 'cards'); assert.equal(fresh.cursor, 0);
  assert.ok(fresh.practice.answers.every((answer) => answer === null), 'Reopening builds a fresh draft');
  const restored = await importAndReload(b, backup);
  restored.navigate('#kana');
  assert.equal(restored.state.history.length, 1, 'Records merge back by id, so the restore brings the cleared history back');
  assert.deepEqual(restored.state.study.kanaReview, {});
  assert.equal(restored.state.study.reviewSession, null);
  assert.equal(restored.state.study.courses['h-ka'].active, null);
  assert.ok(restored.state.study.courses['h-a'].completedAt);
  assert.doesNotMatch(restored.html, /答錯的字/);
});

test('when only saving fails, answers, next, completion and review keep the last stored snapshot and warn; after recovery one save writes everything with exactly one record', () => {
  const b = browser({ hash: '#study/h-a' });
  openKanaQuiz(b, 'h-a');
  const last = b.stored, full = /目前瀏覽器無法儲存進度/;
  b.failSetItem();
  const missed = questionOf(practiceOf(b, 'h-a'));
  b.study('study-answer', { choice: choiceFor(missed, true) });
  assert.equal(b.stored, last, 'answer');
  assert.notEqual(practiceOf(b, 'h-a').answers[0], null, 'The page keeps the answer');
  assert.equal(b.state.study.kanaReview[missed.id].wrong, true);
  assert.match(storageWarning(b), full);
  assert.equal(b.node('#announcer').textContent, '這次的進度沒有存到瀏覽器。');
  b.study('study-next');
  assert.equal(b.stored, last, 'next');
  assert.equal(practiceOf(b, 'h-a').cursor, 1);
  assert.match(storageWarning(b), full);
  const lost = browser({ raw: b.stored, hash: '#study/h-a' });
  assert.deepEqual(practiceOf(lost, 'h-a').answers, [null, null, null, null, null], 'A reload now shows the last stored snapshot');
  playRound(b, 'h-a');
  assert.equal(b.state.study.courses['h-a'].active.phase, 'done');
  assert.equal(b.state.history.length, 1);
  assert.equal(b.stored, last, 'completion');
  assert.match(b.html, /練習完成/);
  assert.match(storageWarning(b), full);
  b.navigate('#kana-review'); b.study('study-review-start');
  b.study('study-answer', { choice: choiceFor(questionOf(practiceOf(b, 'review')), true) }); b.study('study-next');
  assert.equal(b.stored, last, 'review');
  assert.equal(practiceOf(b, 'review').cursor, 1);
  assert.match(storageWarning(b), full);
  b.failSetItem(false);
  b.study('study-answer', { choice: choiceFor(questionOf(practiceOf(b, 'review'))) });
  assert.equal(b.node('#announcer').textContent, '已恢復儲存。');
  const saved = JSON.parse(b.stored);
  assert.equal(saved.attempts.length, 1, 'Exactly one record');
  assert.equal(saved.attempts[0].firstCorrect, 4);
  assert.equal(saved.learning.study.courses['h-a'].active.phase, 'done');
  assert.ok(saved.learning.study.courses['h-a'].completedAt);
  assert.deepEqual(saved.learning.study.reviewSession, b.state.study.reviewSession);
  assert.deepEqual(saved.learning.study.kanaReview, b.state.study.kanaReview);
  b.study('study-next');
  assert.match(b.html, /<div id="storage-status"><\/div>/);
  const reloaded = browser({ raw: b.stored, hash: '#kana-review' });
  assert.equal(reloaded.state.history.length, 1);
  assert.equal(practiceOf(reloaded, 'review').cursor, 2);
});

test('two tabs on one storage: the later writer is refused and warned, a storage event warns at once, and a stale tab cannot undo a clear', () => {
  const seed = browser({ hash: '#study/h-a' });
  openKanaQuiz(seed, 'h-a');
  const shared = new Map(seed.storage), raw = () => shared.get('sorachi:data:v2'), conflict = /另一個分頁已更新或清除資料/;
  const a = browser({ sharedStorage: shared, hash: '#study/h-a' }), b = browser({ sharedStorage: shared, hash: '#study/h-a' });
  const q = questionOf(practiceOf(a, 'h-a'));
  assert.equal(questionOf(practiceOf(b, 'h-a')).id, q.id);
  a.study('study-answer', { choice: choiceFor(q) });
  const afterA = raw();
  b.study('study-answer', { choice: choiceFor(q, true) });
  assert.equal(raw(), afterA, 'The later writer is refused');
  assert.notEqual(practiceOf(b, 'h-a').answers[0], null, 'Its own answer stays on its page');
  assert.match(storageWarning(b), conflict);
  a.study('study-next'); b.study('study-next');
  assert.notEqual(raw(), afterA, 'The first tab keeps saving');
  assert.match(storageWarning(b), conflict, 'The second tab stays stopped');
  const reopened = practiceOf(browser({ sharedStorage: shared, hash: '#study/h-a' }), 'h-a');
  assert.equal(reopened.questions[0].options[reopened.answers[0]], q.id, 'A reload shows the saved right answer, not the refused wrong one');
  // A storage event warns before the stale tab does anything.
  const c = browser({ sharedStorage: shared, hash: '#kana' }), d = browser({ sharedStorage: shared, hash: '#kana' });
  c.study('study-script', { script: 'k' });
  const afterC = raw();
  d.storageEvent();
  assert.match(d.node('#storage-status').innerHTML, conflict);
  assert.equal(d.node('#announcer').textContent, '另一個分頁更新了資料，這個分頁已停止儲存。');
  d.study('study-script', { script: 'h' });
  assert.equal(raw(), afterC);
  // A tab still in a quiz cannot write back what another tab cleared.
  const e = browser({ sharedStorage: shared, hash: '#study/h-a' }), f = browser({ sharedStorage: shared, hash: '#history' });
  f.action('clear-history'); f.action('confirm-clear');
  const cleared = raw();
  e.study('study-answer', { choice: choiceFor(questionOf(practiceOf(e, 'h-a')), true) });
  assert.equal(raw(), cleared);
  assert.deepEqual(JSON.parse(cleared).learning.study.kanaReview, {});
  assert.equal(JSON.parse(cleared).learning.study.courses['h-a'].active, null);
  assert.match(storageWarning(e), conflict);
});

test('a review of exactly two characters says 複習 2 個字, mixes both directions with three same-row options, and ends with 再複習 2 個字 without a record', () => {
  for (const course of ['h-ya', 'k-wa']) for (let run = 0; run < 4; run++) {
    let b = browser({ hash: '#kana' });
    openKanaQuiz(b, course);
    b.study('study-answer', { choice: choiceFor(questionOf(practiceOf(b, course)), true) }); b.study('study-next');
    b.study('study-answer', { choice: choiceFor(questionOf(practiceOf(b, course)), true) });
    b.navigate('#kana');
    assert.match(b.html, /複習 2 個字/);
    b.navigate('#kana-review'); b.study('study-review-start');
    const session = practiceOf(b, 'review');
    assert.equal(session.questions.length, 2);
    assert.equal(new Set(session.questions.map((q) => q.direction)).size, 2, 'Two questions still ask both ways');
    for (const q of session.questions) {
      assert.equal(q.options.length, 3);
      assert.ok(q.options.every((id) => id.startsWith(`${course}/`)), 'Options stay in the row');
    }
    b.study('study-answer', { choice: choiceFor(questionOf(session), true) });
    b = browser({ raw: b.stored, hash: '#kana-review' });
    b.study('study-next');
    playRound(b, 'review', () => true);
    const done = practiceOf(b, 'review');
    assert.ok(done.retryQuestions.every((q, i) => q.direction !== done.questions[i].direction), 'The retry asks the other way round');
    assert.match(b.html, /再複習 2 個字/);
    assert.equal(b.state.history.length, 0);
  }
});

test('feedback from a retry round names the retried question and round, in a course and in the review; completion pages name no question', () => {
  const b = browser({ hash: '#study/h-a' });
  const report = () => {
    const stored = b.stored;
    b.action('feedback'); b.submitFeedback('問題回報', '測試');
    const body = new URL(b.node('#feedback-ready').children[1].href).searchParams.get('body');
    b.action('feedback-back');
    assert.equal(b.stored, stored, 'Feedback never writes progress');
    return body;
  };
  const retryReport = (where, place) => {
    for (let guard = 0; guard < 20 && practiceOf(b, where).round === 'first'; guard++) {
      const session = practiceOf(b, where);
      b.study('study-answer', { choice: choiceFor(questionOf(session), session.cursor === 0) }); b.study('study-next');
    }
    assert.equal(practiceOf(b, where).round, 'retry', 'The first round must reach the retry');
    const question = questionOf(practiceOf(b, where)), course = question.id.split('/')[0], body = report();
    const revision = vm.runInContext(`Content.courseRevision(${JSON.stringify(course)})`, contentContext);
    for (const line of [`所在位置：${place}`, `courseId: ${course}`, `courseRevision: ${revision}`, `questionId: ${question.id}`, `direction: ${question.direction}`, 'practiceVersion: 1', 'round: retry']) assert.ok(body.split('\n').includes(line), `${line}\n${body}`);
  };
  const doneReport = (place) => {
    const body = report();
    assert.ok(body.includes(`所在位置：${place}`), body);
    assert.doesNotMatch(body, /questionId:|round:/);
  };
  openKanaQuiz(b, 'h-a');
  retryReport('h-a', '平假名・あ行・再試一次第 1 步');
  playRound(b, 'h-a');
  doneReport('平假名・あ行・完成頁');
  b.navigate('#kana-review'); b.study('study-review-start');
  retryReport('review', '五十音複習・再試一次第 1 步');
  playRound(b, 'review');
  doneReport('五十音複習・完成頁');
});

test('on the review page a forced 回去看看 changes nothing, while switching script and opening a course still work', () => {
  const b = browser({ hash: '#study/h-a' });
  openKanaQuiz(b, 'h-a'); playRound(b, 'h-a');
  b.navigate('#kana-review'); b.study('study-review-start');
  b.study('study-answer', { choice: choiceFor(questionOf(practiceOf(b, 'review'))) });
  const round = JSON.stringify(b.state.study.reviewSession), stored = b.stored;
  b.study('study-review');
  assert.equal(b.stored, stored); assert.equal(b.hash, '#kana-review');
  b.study('study-script', { script: 'k' });
  assert.equal(b.state.study.script, 'k', 'The script switch is not swallowed by the review page');
  assert.equal(b.hash, '#kana-review');
  b.study('study-open', { course: 'h-ka' });
  assert.equal(b.hash, '#study/h-ka', 'Opening a course is not swallowed by the review page');
  assert.equal(JSON.stringify(b.state.study.reviewSession), round, 'Neither touches the review round');
  b.navigate('#kana-review'); b.study('study-next');
  assert.equal(practiceOf(b, 'review').cursor, 1, 'The round goes on where it was');
  playRound(b, 'review');
  const done = b.stored;
  b.study('study-answer', { choice: 0 }); b.study('study-next');
  assert.equal(b.stored, done, 'The done page still ignores answers');
  b.study('study-open', { course: 'k-a' });
  assert.equal(b.hash, '#study/k-a');
});

// Pins Date inside one page so a test can move its clock, also backwards.
function setClock(b, iso) {
  b.run(`if (!globalThis.__realDate) { globalThis.__realDate = Date; globalThis.Date = class extends __realDate { constructor(...args) { super(...(args.length ? args : [globalThis.__now])); } static now() { return globalThis.__now; } }; } globalThis.__now = __realDate.parse(${JSON.stringify(iso)});`);
}
test('with a clock that went backwards, a kana answer is still dated after the last clear and the previous answer, so a backup restore keeps it', async () => {
  // After a clear: the next answer must not look older than the clear.
  const b = browser({ hash: '#study/h-a' });
  setClock(b, '2026-10-16T10:00:00.000Z');
  openKanaQuiz(b, 'h-a');
  b.study('study-answer', { choice: choiceFor(questionOf(practiceOf(b, 'h-a')), true) });
  setClock(b, '2026-10-16T10:05:00.000Z');
  b.navigate('#history'); b.action('clear-history'); b.action('confirm-clear');
  setClock(b, '2026-10-16T10:01:00.000Z');
  openKanaQuiz(b, 'h-a');
  const after = questionOf(practiceOf(b, 'h-a')).id;
  b.study('study-answer', { choice: choiceFor(questionOf(practiceOf(b, 'h-a')), true) });
  const { kanaReview, reviewClearedAt } = b.state.study;
  assert.ok(kanaReview[after].lastSeen > reviewClearedAt, `${kanaReview[after].lastSeen} must follow the clear at ${reviewClearedAt}`);
  const elsewhere = await importAndReload(browser(), b.stored);
  assert.equal(elsewhere.state.study.kanaReview[after]?.wrong, true, 'Restoring the backup keeps the mistake made after the clear');
  // After an earlier answer: a right answer must not look older than the miss it replaces.
  const c = browser({ hash: '#study/h-a' });
  setClock(c, '2026-10-16T10:00:00.000Z');
  openKanaQuiz(c, 'h-a');
  const x = questionOf(practiceOf(c, 'h-a')).id;
  c.study('study-answer', { choice: choiceFor(questionOf(practiceOf(c, 'h-a')), true) });
  const backup = c.stored;
  setClock(c, '2026-10-16T09:50:00.000Z');
  c.study('study-next');
  playRound(c, 'h-a');
  assert.equal(c.state.study.kanaReview[x].wrong, false);
  assert.ok(c.state.study.kanaReview[x].lastSeen > '2026-10-16T10:00:00.000Z', c.state.study.kanaReview[x].lastSeen);
  const restored = await importAndReload(c, backup);
  assert.equal(restored.state.study.kanaReview[x].wrong, false, 'The older backup cannot bring the mistake back');
});

test('a second clear still ends what a backup made before it holds, when the clock went back or both clears fall in one millisecond', async () => {
  const phrase = vm.runInContext('Content.phrasebook.find(p=>p.id==="t-pay").steps[0].id', contentContext);
  const clear = (b) => { b.navigate('#history'); b.action('clear-history'); b.action('confirm-clear'); };
  for (const [label, first, practice, second, step] of [
    ['clock went back', '2026-10-17T10:00:00.000Z', '2026-10-17T10:01:00.000Z', '2026-10-17T09:00:00.000Z', 30000],
    ['same millisecond', '2026-10-17T10:00:00.000Z', '2026-10-17T10:00:00.000Z', '2026-10-17T10:00:00.000Z', 0],
  ]) {
    const b = completedGrammarBrowser();
    setClock(b, first);
    b.navigate('#study/h-a');
    for (let i = 0; i < 5; i++) b.study('study-next');
    finishKanaRound(b, { missFirst: true });
    clear(b);
    // After the first clear: an unfinished kana review and grammar review, a missed kana round and an open lesson.
    setClock(b, practice);
    b.navigate('#kana-review'); b.study('study-review-start');
    b.study('study-answer', { choice: choiceFor(questionOf(practiceOf(b, 'review')), true) });
    b.navigate('#grammar-review'); b.study('study-grammar-review');
    const item = b.state.study.grammarReviewSession.items[0];
    const question = vm.runInContext(`Content.courses[${JSON.stringify(item.courseId)}].questions[${item.q}]`, contentContext);
    b.study('study-answer', { choice: (question.answer + 1) % question.options.length });
    // The clock moves on between steps, so the round's record is dated after every answer: the clear must follow the record too.
    let now = Date.parse(practice);
    openKanaQuiz(b, 'k-a');
    for (let guard = 0; guard < 15 && practiceOf(b, 'k-a').round !== 'done'; guard++) {
      const session = practiceOf(b, 'k-a');
      b.study('study-answer', { choice: choiceFor(questionOf(session), session.round === 'first' && session.cursor === 0) });
      now += step; setClock(b, new Date(now).toISOString());
      b.study('study-next');
    }
    assert.ok(b.state.study.courses['k-a'].completedAt, label);
    b.study('study-open', { course: 'h-ka' }); b.study('study-next');
    b.navigate('#travel/t-pay'); b.study('study-favorite', { phrase });
    b.navigate('#settings'); b.study('study-rate', { rate: '0.65' });
    const backup = b.stored, saved = JSON.parse(backup).learning.study;
    assert.ok(saved.reviewSession && saved.grammarReviewSession && saved.courses['h-ka'].active && Object.keys(saved.kanaReview).length && Object.keys(saved.grammarReview).length, label);
    setClock(b, second);
    // A clear that cannot be saved changes nothing, the records and the date of the last clear included.
    const kept = b.state;
    b.failSetItem(); clear(b); b.failSetItem(false);
    assert.equal(b.stored, backup, label);
    assert.deepEqual(b.state, kept, label);
    clear(b);
    const cleared = b.stored;
    assert.ok(JSON.parse(cleared).learning.study.reviewClearedAt > saved.reviewClearedAt, `${label}: the second clear must be dated after the first`);
    for (const [direction, local, incoming] of [['restore into the cleared browser', cleared, backup], ['restore the cleared data into the old browser', backup, cleared]]) {
      const restored = await importAndReload(browser({ raw: local }), incoming);
      for (const page of [restored, browser({ raw: restored.stored, hash: '#kana-review' })]) {
        const study = page.state.study, where = `${label}, ${direction}`;
        assert.equal(study.courses['h-ka']?.active ?? null, null, where);
        assert.equal(study.reviewSession, null, where);
        assert.equal(study.grammarReviewSession, null, where);
        assert.deepEqual(Object.keys(study.kanaReview), [], where);
        assert.deepEqual(Object.keys(study.grammarReview), [], where);
        for (const id of ['h-a', 'k-a', 'g-identity', 'g-question']) assert.ok(study.courses[id].completedAt, `${where}: ${id} stays completed`);
        const envelope = JSON.parse(page.stored);
        assert.deepEqual(envelope.favorites, [phrase], where);
        assert.equal(envelope.preferences.ttsRate, 0.65, where);
      }
    }
  }
});

test('a restored record dated past year 9999 does not date a clear at the end of time, so later mistakes survive a reload', async () => {
  const b = browser({ hash: '#study/h-a' });
  for (let i = 0; i < 5; i++) b.study('study-next');
  finishKanaRound(b, { missFirst: true });
  const backup = JSON.parse(b.stored);
  backup.attempts.push({ ...backup.attempts[0], id: 'far-future', date: '+275760-09-13T00:00:00.000Z' });
  const restored = await importAndReload(browser(), JSON.stringify(backup));
  assert.ok(restored.state.history.some((entry) => entry.id === 'far-future'), 'The backup is accepted with the odd record');
  restored.navigate('#history'); restored.action('clear-history'); restored.action('confirm-clear');
  const clearedAt = restored.state.study.reviewClearedAt;
  assert.ok(clearedAt < '2100', clearedAt);
  openKanaQuiz(restored, 'h-ka');
  const x = questionOf(practiceOf(restored, 'h-ka')).id;
  restored.study('study-answer', { choice: choiceFor(questionOf(practiceOf(restored, 'h-ka')), true) });
  assert.equal(browser({ raw: restored.stored }).state.study.kanaReview[x]?.wrong, true);
});

test('returning learners get a home dashboard of next steps, everything on offer and progress; new visitors do not', () => {
  const b = browser();
  assert.doesNotMatch(b.html, /home-dashboard/, 'A new visitor keeps the single way in');
  const lesson = (id) => JSON.parse(vm.runInContext(`JSON.stringify(Content.courses[${JSON.stringify(id)}])`, contentContext));
  const grammarCount = vm.runInContext('Content.grammar.length', contentContext);
  b.study('study-open', { course: 'h-a' });
  for (let i = 0; i < 5; i++) b.study('study-next');
  finishKanaRound(b, { missFirst: true });
  for (const id of ['g-identity', 'g-question']) {
    const course = lesson(id);
    b.study('study-open', { course: id });
    for (let i = 0; i < course.steps.length; i++) b.study('study-next');
    for (let i = 0; i < course.questions.length; i++) {
      const active = b.state.study.courses[id].active;
      b.study('study-answer', { choice: course.questions[active.order[active.cursor]].answer });
      b.study('study-next');
    }
  }
  b.navigate('#travel/hotel');
  b.study('study-favorite', { phrase: 'phrase/hotel/check-in' });
  b.navigate('#home');
  const html = b.html, section = (name) => html.match(new RegExp(`<section class="${name}"[\\s\\S]*?</section>`))[0];
  assert.match(html, /<p>接下來可以：練平假名・か行，或學「指示詞：これ・それ・あれ」。<\/p>/, 'Where to go next, without "today" pressure');
  const progress = section('dash-progress');
  assert.match(progress, /<dt>平假名<\/dt><dd><strong>5<\/strong> \/ 104 字<\/dd>/);
  assert.match(progress, new RegExp(`<dt>基礎句型</dt><dd><strong>2</strong> / ${grammarCount} 課</dd>`));
  // h-a: 4 of 5 right the first time, plus 2 + 2 grammar questions right: 8 of 9 is 88.9%, shown rounded down.
  assert.match(progress, /<dt>第一次答對<\/dt><dd><strong>88<\/strong>%<\/dd>/);
  assert.match(progress, /<dt>上次答錯的字<\/dt><dd><strong>0<\/strong> 個<\/dd>/);
  assert.doesNotMatch(progress, /完成練習|平假名<\/span><span class="dash-count">/, 'Counts shown elsewhere are not repeated');
  assert.match(progress, /<summary>句型各單元進度<\/summary>[\s\S]*<span>基本句子<\/span><span class="dash-count">2 \/ /);
  assert.match(progress, /aria-hidden="true"><i style="width:/, 'Bars are decoration; the counts are text');
  assert.match(progress, /最近 3 次完成的練習計算。第一次答對只算每題第一次的選擇，重試和複習不算/);
  const next = section('dash-next');
  assert.match(next, /data-action="study-open" data-course="g-demo"[\s\S]*?下一課：指示詞：これ・それ・あれ[\s\S]*?基本句子/);
  assert.match(next, /data-action="study-grammar-review"[\s\S]*?4 題/, 'Two finished lessons offer the grammar review');
  assert.match(next, /href="#travel\/favorites"[\s\S]*?1 張/);
  const everything = section('dash-all');
  for (const hash of ['#kana', '#grammar', '#travel', '#history']) assert.match(everything, new RegExp(`<a class="dash-row" href="${hash}">`), hash);
  assert.match(everything, /各 26 組/);
  assert.match(everything, /data-action="start"[\s\S]*?還沒看/, 'After practice the introduction waits in 全部內容');
  assert.equal((html.match(/data-action="start"/g) || []).length, 1, 'One way into the writing-system introduction');
  assert.ok(html.indexOf('dash-next') < html.indexOf('dash-progress'), 'What to do next comes first, also for keyboard and screen readers');
  assert.match(html, /data-action="study-open" data-course="h-ka"/, 'The kana card still leads to the next group');
});

test('home dashboard edge cases: paused introduction, saved phrases only, kana finished, unscored history, unfinished grammar review', () => {
  const section = (b, name) => (b.html.match(new RegExp(`<section class="${name}"[\\s\\S]*?</section>`)) || [''])[0];
  const starts = (b) => (b.html.match(/data-action="start"/g) || []).length;
  // Only the introduction, paused at step 2: nothing to count yet.
  const paused = browser({ hash: '#lesson' });
  paused.action('next');
  paused.navigate('#home');
  assert.match(section(paused, 'dash-progress'), /完成第一組練習後，這裡會顯示學過多少。/);
  assert.doesNotMatch(section(paused, 'dash-progress'), /dash-stats/, 'No wall of zeros');
  assert.match(section(paused, 'dash-next'), /data-action="start"[\s\S]*?接著學，上次學到第 2 步/);
  assert.equal(starts(paused), 1);
  // Someone who only saved a travel phrase finds it again from home.
  const traveller = browser({ hash: '#travel/hotel' });
  traveller.study('study-favorite', { phrase: 'phrase/hotel/check-in' });
  traveller.navigate('#home');
  assert.match(traveller.html, /home-dashboard/);
  assert.match(section(traveller, 'dash-next'), /href="#travel\/favorites"[\s\S]*?1 張/);
  assert.equal(starts(traveller), 1);
  // Both scripts and the 促音・長音 lessons done: the main card leads to grammar instead of replaying kana.
  const data = JSON.parse(browser().stored);
  const kanaRows = vm.runInContext('JSON.stringify(Object.values(Content.rowGroups).flat())', contentContext);
  for (const row of JSON.parse(kanaRows)) for (const script of ['h', 'k']) data.learning.study.courses[`${script}-${row}`] = { completedAt: '2026-10-01T00:00:00.000Z' };
  for (const id of ['s-sokuon', 's-long']) data.learning.study.courses[id] = { completedAt: '2026-10-01T00:00:00.000Z' };
  data.attempts = [{ id: 'old', courseId: 'h-a', date: '2026-10-01T00:00:00.000Z', total: 5, firstCorrect: null, retryQuestions: [] }];
  const fluent = browser({ raw: JSON.stringify(data) });
  assert.match(section(fluent, 'lesson-hero'), /<span class="number">基礎句型<\/span>[\s\S]*?data-action="study-open" data-course="g-identity"/);
  assert.match(section(fluent, 'lesson-hero'), /句型已完成 0 \//);
  assert.doesNotMatch(section(fluent, 'dash-next'), /基礎句型/, 'Grammar is not offered twice');
  assert.match(section(fluent, 'dash-progress'), /<dt>平假名<\/dt><dd><strong>104<\/strong> \/ 104 字/);
  assert.match(section(fluent, 'dash-progress'), /<dt>第一次答對<\/dt><dd><strong>還沒有<\/strong><\/dd>/, 'Records without first answers are not scored');
  // An unfinished grammar review round says it continues.
  const reviewer = browser();
  for (const id of ['g-identity', 'g-question']) {
    const course = JSON.parse(vm.runInContext(`JSON.stringify(Content.courses[${JSON.stringify(id)}])`, contentContext));
    reviewer.study('study-open', { course: id });
    for (let i = 0; i < course.steps.length; i++) reviewer.study('study-next');
    for (let i = 0; i < course.questions.length; i++) {
      const active = reviewer.state.study.courses[id].active;
      reviewer.study('study-answer', { choice: course.questions[active.order[active.cursor]].answer });
      reviewer.study('study-next');
    }
  }
  reviewer.navigate('#home');
  reviewer.study('study-grammar-review');
  assert.equal(reviewer.hash, '#grammar-review');
  reviewer.navigate('#home');
  assert.match(section(reviewer, 'dash-next'), /data-action="study-grammar-review"[\s\S]*?繼續/);
});

test('home resumes the 促音 and 長音 lessons where they stopped and offers them after the 52 groups, never as characters', () => {
  const section = (b, name) => (b.html.match(new RegExp(`<section class="${name}"[\\s\\S]*?</section>`)) || [''])[0];
  const lesson = (id) => JSON.parse(vm.runInContext(`JSON.stringify(Content.courses[${JSON.stringify(id)}])`, contentContext));
  const offers = (b, id) => b.html.includes(`data-action="study-open" data-course="${id}"`);
  // Opening the first card is not progress, for a new visitor or for someone who finished あ行.
  const peek = browser();
  peek.study('study-open', { course: 's-sokuon' });
  peek.navigate('#home');
  assert.ok(!offers(peek, 's-sokuon'));
  const learner = browser({ hash: '#study/h-a' });
  for (let i = 0; i < 5; i++) learner.study('study-next');
  finishKanaRound(learner);
  learner.study('study-open', { course: 's-sokuon' });
  learner.navigate('#home');
  assert.ok(!offers(learner, 's-sokuon'));
  assert.match(section(learner, 'dash-next'), /data-course="h-ka"[\s\S]*?下一組：平假名・か行/);
  // Stopped on the second card: home leads back to it, also after reload.
  const cards = browser();
  cards.study('study-open', { course: 's-sokuon' }); cards.study('study-next');
  cards.navigate('#home');
  for (const page of [cards, browser({ raw: cards.stored })]) {
    assert.match(section(page, 'dash-next'), /data-course="s-sokuon"[\s\S]*?<strong>五十音<\/strong><span>接著學：促音：小的 っ 停一拍<\/span>/, 'Home offers the unfinished 促音 lesson');
    assert.match(page.html, /接下來可以：接著學促音。/);
    assert.doesNotMatch(section(page, 'dash-next'), /個字/, 'A sound lesson is not counted in characters');
    page.study('study-open', { course: 's-sokuon' });
    assert.equal(page.hash, '#study/s-sokuon');
    assert.equal(page.state.study.courses['s-sokuon'].active.cursor, 1);
    assert.ok(page.html.includes(lesson('s-sokuon').steps[1].title));
  }
  // Stopped in the quiz: 長音 comes back at the same question.
  const long = lesson('s-long'), quiz = browser();
  quiz.study('study-open', { course: 's-long' });
  for (let i = 0; i < long.steps.length; i++) quiz.study('study-next');
  const first = quiz.state.study.courses['s-long'].active;
  assert.equal(first.phase, 'quiz');
  quiz.study('study-answer', { choice: long.questions[first.order[first.cursor]].answer }); quiz.study('study-next');
  quiz.navigate('#home');
  for (const page of [quiz, browser({ raw: quiz.stored })]) {
    assert.ok(offers(page, 's-long'));
    page.study('study-open', { course: 's-long' });
    const active = page.state.study.courses['s-long'].active;
    assert.equal(active.phase, 'quiz');
    assert.equal(active.cursor, 1);
  }
  // A kana group and a sound lesson both unfinished: the group comes first, the lesson is still offered.
  const both = browser();
  both.study('study-open', { course: 's-long' }); both.study('study-next');
  both.study('study-open', { course: 'h-a' }); both.study('study-next');
  both.navigate('#home');
  assert.match(section(both, 'dash-next'), /data-course="h-a"[\s\S]*?接著學：平假名・あ行[\s\S]*?data-course="s-long"[\s\S]*?接著學「長音：把音拉長一拍」/);
  // A katakana-first learner keeps the unfinished lesson too.
  const katakana = browser({ hash: '#study/k-a' });
  for (let i = 0; i < 5; i++) katakana.study('study-next');
  playRound(katakana, 'k-a');
  katakana.study('study-open', { course: 's-long' }); katakana.study('study-next');
  katakana.navigate('#home');
  assert.match(section(katakana, 'dash-next'), /data-course="s-long"[\s\S]*?接著學：長音：把音拉長一拍/);
  // All 52 groups done: 促音 and then 長音 come next, and the character counts stay 104.
  const data = JSON.parse(browser().stored);
  for (const row of JSON.parse(vm.runInContext('JSON.stringify(Object.values(Content.rowGroups).flat())', contentContext))) for (const script of ['h', 'k']) data.learning.study.courses[`${script}-${row}`] = { completedAt: '2026-10-01T00:00:00.000Z' };
  const groups = browser({ raw: JSON.stringify(data) });
  assert.match(section(groups, 'dash-next'), /data-course="s-sokuon"[\s\S]*?下一課：促音：小的 っ 停一拍/);
  assert.match(section(groups, 'lesson-hero'), /data-action="study-review-start"/, 'The five-character review stays on the kana card');
  assert.match(groups.html, /<dt>平假名<\/dt><dd><strong>104<\/strong> \/ 104 字/);
  assert.match(groups.html, /<dt>促音・長音<\/dt><dd><strong>0<\/strong> \/ 2 課/);
  // An unfinished grammar lesson comes before the 促音 lesson not yet begun, as in the welcome line.
  const grammarFirst = browser({ raw: JSON.stringify(data) });
  grammarFirst.study('study-open', { course: 'g-identity' }); grammarFirst.study('study-next');
  grammarFirst.navigate('#home');
  assert.match(section(grammarFirst, 'dash-next'), /data-course="g-identity"[\s\S]*?接著學：[\s\S]*?data-course="s-sokuon"[\s\S]*?下一課：促音/);
  assert.match(grammarFirst.html, /接下來可以：把「[^」]+」學完，或學促音。/);
  data.learning.study.courses['s-sokuon'] = { completedAt: '2026-10-02T00:00:00.000Z' };
  assert.match(section(browser({ raw: JSON.stringify(data) }), 'dash-next'), /data-course="s-long"[\s\S]*?下一課：長音/);
  data.learning.study.courses['s-long'] = { completedAt: '2026-10-02T00:00:00.000Z' };
  const done = browser({ raw: JSON.stringify(data) });
  assert.ok(!offers(done, 's-sokuon') && !offers(done, 's-long'), 'Finished lessons are not offered again');
  assert.match(done.html, /<dt>促音・長音<\/dt><dd><strong>2<\/strong> \/ 2 課/);
  // Practising a finished lesson again is resumed like any other.
  done.study('study-open', { course: 's-sokuon' }); done.study('study-next');
  done.navigate('#home');
  assert.ok(offers(done, 's-sokuon'));
});

test('回 leads back to where a lesson or review was opened, through the next group, feedback, a reload and the back button', () => {
  const exit = (b) => b.html.match(/<a class="exit" href="([^"]+)">← ([^<]+)<\/a>/)?.slice(1);
  const reload = (b) => browser({ raw: b.stored, hash: b.hash, historyState: b.historyState });
  // From home: the header and the done page lead home, and the done page puts that first.
  const b = browser();
  b.study('study-open', { course: 'h-a' });
  assert.deepEqual(b.historyState, { from: '#home' });
  assert.deepEqual(exit(b), ['#home', '回首頁']);
  for (let i = 0; i < 5; i++) b.study('study-next');
  finishKanaRound(b);
  const records = b.state.history.length;
  assert.match(b.html, /<div class="study-nav"><a class="primary" href="#home">回首頁<\/a><button class="text-button" data-action="study-open" data-course="h-ka">下一組：か行<\/button><button class="text-button" data-action="study-restart">重新練習<\/button><\/div>/);
  assert.equal(b.hash, '#study/h-a', 'Answers and the done page add no history entries');
  b.back();
  assert.equal(b.hash, '#home');
  b.forward();
  assert.equal(b.hash, '#study/h-a');
  assert.deepEqual(exit(b), ['#home', '回首頁']);
  assert.equal(b.state.history.length, records, 'Going back and forth records nothing again');
  // The next group, a feedback detour and a reload keep the first source.
  b.study('study-open', { course: 'h-ka' });
  assert.deepEqual(exit(b), ['#home', '回首頁']);
  b.action('feedback'); b.action('feedback-back');
  assert.equal(b.hash, '#study/h-ka');
  assert.deepEqual(exit(b), ['#home', '回首頁']);
  assert.deepEqual(exit(reload(b)), ['#home', '回首頁']);
  // From the kana table: back to the table; a direct link has no source and leads there too.
  const table = browser({ hash: '#kana' });
  table.study('study-open', { course: 'h-ka' });
  assert.deepEqual(exit(table), ['#kana', '回五十音表']);
  assert.deepEqual(exit(browser({ hash: '#study/h-ka' })), ['#kana', '回五十音表']);
  assert.deepEqual(exit(browser({ hash: '#study/s-sokuon' })), ['#kana', '回五十音表']);
  // The short review: home leads home, the table leads to the table; its done page puts the way back first.
  b.navigate('#home'); b.study('study-review-start');
  assert.equal(b.hash, '#kana-review');
  assert.deepEqual(exit(b), ['#home', '回首頁']);
  playRound(b, 'review');
  assert.match(b.html, /<div class="study-nav"><a class="primary" href="#home">回首頁<\/a><button class="text-button" data-action="study-review-start">再複習 \d 個字<\/button><\/div>/);
  b.navigate('#kana'); b.navigate('#kana-review');
  assert.deepEqual(exit(b), ['#kana', '回五十音表']);
  // Grammar works the same way: home leads home, the list leads to the list.
  const g = browser({ hash: '#grammar' });
  g.study('study-open', { course: 'g-identity' });
  assert.deepEqual(exit(g), ['#grammar', '回句型列表']);
  g.navigate('#home'); g.study('study-open', { course: 'g-identity' });
  assert.deepEqual(exit(g), ['#home', '回首頁']);
});

test('the kana card always leads to the table: its other way in is あ行 before anything is learned, then the short review', () => {
  const card = (b) => (b.html.match(/<section class="lesson-hero"[\s\S]*?<\/section>/) || [''])[0];
  const fresh = browser();
  assert.match(card(fresh), /<button class="primary" data-action="kana">學五十音/);
  assert.match(card(fresh), /data-action="study-open" data-course="h-a">先學あ行/);
  // Begun but nothing learned yet: the card stays the same, and carrying on is listed under 接著做.
  const begun = browser();
  begun.study('study-open', { course: 'h-a' }); begun.study('study-next');
  begun.navigate('#home');
  assert.equal(card(begun), card(fresh));
  assert.match(begun.html, /<section class="dash-next"[\s\S]*?data-course="h-a"[\s\S]*?接著學：平假名・あ行/);
  // Something learned: the short review replaces あ行; the card never opens a lesson itself.
  const learned = browser({ hash: '#study/h-a' });
  for (let i = 0; i < 5; i++) learned.study('study-next');
  finishKanaRound(learned);
  learned.navigate('#home');
  const hero = learned.html.match(/<section class="lesson-hero"[\s\S]*?<\/section>\s*<\/section>/)[0];
  assert.match(hero, /<button class="primary" data-action="kana">學五十音/);
  assert.match(hero, /data-action="study-review-start">複習 5 個字/);
  assert.doesNotMatch(hero, /data-action="study-open"/);
});
