import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';

const read = (file) => readFileSync(new URL(`../dist/${file}`, import.meta.url), 'utf8');
const exists = (file) => existsSync(new URL(`../dist/${file}`, import.meta.url));

test('fonts load from the page head, not a render-blocking CSS @import', () => {
  assert.doesNotMatch(read('styles.css'), /@import/);
  const html = read('index.html');
  assert.match(html, /<link rel="preconnect" href="https:\/\/fonts\.gstatic\.com" crossorigin \/>/);
  assert.match(html, /family=Noto\+Sans\+TC:wght@400\.\.800&family=Noto\+Sans\+JP:wght@400\.\.700&display=swap/);
  assert.ok(html.indexOf('fonts.googleapis.com/css2') < html.indexOf('styles.css'));
});

test('images and icons are small WebP/PNG files that exist and are referenced with srcset', () => {
  const html = read('index.html'), app = read('app.js');
  for (const icon of ['assets/favicon-32.png', 'assets/apple-touch-icon.png']) {
    assert.ok(html.includes(`./${icon}`)); assert.ok(exists(icon)); assert.ok(statSync(new URL(`../dist/${icon}`, import.meta.url)).size < 20000);
  }
  assert.doesNotMatch(html + app, /cloud-(friend|complete)\.png/);
  const widths = JSON.parse(app.match(/const imageWidths = ({[^;]+});/)[1].replace(/"?([\w-]+)"?:/g, '"$1":'));
  for (const [name, list] of Object.entries(widths)) for (const width of list) {
    const file = `assets/${name}-${width}.webp`;
    assert.ok(exists(file), file);
    assert.ok(statSync(new URL(`../dist/${file}`, import.meta.url)).size < 60000, file);
  }
  assert.match(app, /srcset="\$\{widths\.map/);
});

test('shared-origin rules: no service worker or blanket clears, every storage key is namespaced', () => {
  const sources = readdirSync(new URL('../dist/', import.meta.url)).filter((file) => file.endsWith('.js')).map(read).join('\n');
  assert.doesNotMatch(sources, /serviceWorker|caches\./);
  // Only the drafts Map may be cleared; no storage object may be cleared or used outside get/set/removeItem.
  for (const [call] of sources.matchAll(/(\w+)\.clear\(\)/g)) assert.match(call, /^drafts\.clear\(\)$/, call);
  assert.doesNotMatch(sources, /(?:local|session)Storage\s*(?:\[|\.(?!getItem|setItem|removeItem))/);
  // Every storage call names its key through a constant (or ${KEY}-prefixed template) defined as sorachi:...
  const constants = Object.fromEntries([...sources.matchAll(/\b([A-Z_]+) = ["']([^"']+)["']/g)].map(([, name, value]) => [name, value]));
  const calls = [...sources.matchAll(/\.(?:get|set|remove)Item\(([^,)]+)/g)].map(([, arg]) => arg.trim());
  assert.ok(calls.length >= 6);
  for (const arg of calls) {
    const derived = sources.match(new RegExp(`\\b${arg} = \`\\$\\{([A-Z_]+)\\}`))?.[1];
    const name = arg.match(/^`?\$\{([A-Z_]+)\}/)?.[1] ?? derived ?? arg;
    assert.match(constants[name] ?? '', /^sorachi:/, arg);
  }
});

test('the page shows a static loading note that stays if the scripts never run', () => {
  assert.match(read('index.html'), /<div id="app"><main class="shell"><p role="status">正在載入 SoraChi…<\/p><p>若一直停在這裡，請重新整理頁面。<\/p>/);
});

test('accessibility floor keeps small text readable, targets tall and disabled controls distinct', () => {
  const css = read('styles.css');
  const floor = css.slice(css.indexOf('/* Accessibility floor (#15)'));
  assert.ok(floor.length > 100);
  assert.match(floor, /\.exit, \.brand, \.author-credit \{ min-height: 44px;/);
  assert.match(floor, /\.storage-warning, \.feedback-privacy, \.study-feedback, \.phrase-more \.reading-label[^{]*\{ font-size: 14px; \}/);
  assert.match(floor, /\.storage-note, \.step-hint, \.question-tag, \.result-card > span, \.word-type \{ font-size: 12px; \}/);
  assert.match(floor, /\.course-state, \.course-row \.course-state \{ font-size: 12px; \}/);
  assert.match(floor, /button\.text-button:disabled \{ color: var\(--muted\);/);
  assert.match(floor, /summary:focus-visible \{ outline: 3px solid/);
  assert.match(floor, /\.visually-hidden \{ position: absolute;/);
});
