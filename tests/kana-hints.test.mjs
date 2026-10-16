import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const context = vm.createContext({});
vm.runInContext(readFileSync(new URL('../dist/content.js', import.meta.url), 'utf8') + '\nglobalThis.content = Content;', context);
vm.runInContext(readFileSync(new URL('../dist/kana-hints.js', import.meta.url), 'utf8') + '\nglobalThis.hints = KanaHints;', context);
const { content, hints } = context;
const letters = content.rows.flatMap(row => [...row[2], ...row[3]]);

test('all 142 taught kana have two distinct short plain-text memory hints', () => {
  assert.equal(letters.length, 142);
  for (const letter of letters) {
    const entries = hints.get(letter);
    assert.equal(entries.length, 2, letter);
    assert.equal(new Set(entries.map(entry => entry.label)).size, 2, letter);
    assert.equal(new Set(entries.map(entry => entry.text)).size, 2, letter);
    for (const entry of entries) {
      assert.deepEqual(Object.keys(entry).sort(), ['label', 'text']);
      assert.ok(entry.label.trim() && entry.text.trim(), letter);
      assert.ok([...entry.text].length <= 100, letter);
      assert.ok(entry.text.split(/[。！？]/u).filter(Boolean).length <= 2, letter);
      assert.doesNotMatch(entry.text, /[<>]|保證|一定記住|字源|第一筆|第二筆/);
    }
  }
});

test('sound connections agree with the existing kana readings', () => {
  for (const row of content.rows) {
    for (const script of [row[2], row[3]]) [...script].forEach((letter, i) => {
      assert.ok(hints.get(letter)[1].text.includes(` ${row[4][i]}`), letter);
    });
  }
  for (const letter of ['を', 'ヲ']) {
    assert.match(hints.get(letter)[1].text, /助詞/);
    assert.match(hints.get(letter)[1].text, / o/);
    assert.doesNotMatch(hints.get(letter)[1].text, / wo/);
  }
  for (const letter of ['ん', 'ン']) {
    assert.match(hints.get(letter)[1].text, / n/);
    assert.match(hints.get(letter)[1].text, /不.*u/);
  }
  assert.match(hints.get('は')[1].text, / ha/);
  assert.match(hints.get('へ')[1].text, / he/);
});

test('hints and unknown results are immutable and do not resolve inherited properties', () => {
  assert.ok(Object.isFrozen(hints));
  for (const letter of letters) {
    assert.ok(Object.isFrozen(hints.get(letter)));
    for (const entry of hints.get(letter)) assert.ok(Object.isFrozen(entry));
  }
  assert.throws(() => { hints.get('あ')[0].text = 'changed'; }, TypeError);
  for (const value of ['', 'あい', 'ゔ', 'ゃ', 'A', '__proto__', 'constructor', null, undefined, 1, {}]) {
    assert.equal(hints.get(value).length, 0);
    assert.ok(Object.isFrozen(hints.get(value)));
  }
});

test('memory aid notice distinguishes invention from writing instruction', () => {
  assert.match(hints.notice, /不是字源或筆順/);
  assert.match(hints.notice, /不用背/);
});

test('a memory-hint anchor word never means something else on a travel card', () => {
  const phrasebook = new Map();
  for (const category of content.phrasebook) for (const step of category.steps) for (const [word, , meaning] of step.keywords) {
    phrasebook.set(word.replace(/（.*?）/u, ''), meaning);
  }
  let parsed = 0;
  for (const letter of letters) {
    const anchor = hints.get(letter)[1].text.match(/^「(.+?)」（(.+?)）/u);
    if (!anchor) continue;
    parsed++;
    // e.g. アイス once meant 冰淇淋 here but 冰的 on the drink card.
    if (phrasebook.has(anchor[1])) assert.equal(anchor[2], phrasebook.get(anchor[1]), `${letter}: ${anchor[1]}`);
  }
  assert.ok(parsed >= 80, 'Anchors must parse, or the check would silently pass');
  assert.ok(phrasebook.size >= 60);
});
