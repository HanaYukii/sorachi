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

function browser({
  saved = null,
  raw,
  hash = "#home",
  storageBlocked = false,
} = {}) {
  const storage = new Map([[key, raw ?? JSON.stringify(saved)]]);
  const windowListeners = new Map();
  const documentListeners = new Map();
  const pending = [];
  let html = "";
  let renderCount = 0;
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
    querySelector,
    createElement(tag) {
      return element(tag, `<${tag}>`);
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
  const location = {};
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
  });
  const flush = () => {
    while (pending.length) pending.shift()();
  };
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
    node: querySelector,
    get renderCount() {
      return renderCount;
    },
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
      return storage.get(key);
    },
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
  b.action("home");
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
  assert.equal(JSON.parse(b.stored).step, 1);
  assert.doesNotMatch(b.html, /目前瀏覽器無法儲存進度/);
});

test("out-of-range saved step is clamped and unmet question prerequisite is restored", () => {
  const b = browser({
    saved: { step: 99, completed: false, answers: {} },
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
  assert.match(feedback.textContent, /再看一次/);
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
  b.action("home");
  const reloaded = browser({ raw: b.stored });
  assert.match(reloaded.html, />接著學/);
  reloaded.action("start");
  assert.equal(reloaded.state.step, 1);
});
