import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync } from 'node:fs';

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
