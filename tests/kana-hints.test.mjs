import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const context = vm.createContext({});
vm.runInContext(readFileSync(new URL('../dist/content.js', import.meta.url), 'utf8') + '\nglobalThis.content = Content;', context);
vm.runInContext(readFileSync(new URL('../dist/kana-hints.js', import.meta.url), 'utf8') + '\nglobalThis.hints = KanaHints;', context);
const { content, hints } = context;
const plain = (value) => JSON.parse(JSON.stringify(value));
const letters = content.rows.flatMap(row => [...row[2], ...row[3]]);
const basic = content.rows.slice(0, 10).flatMap(row => [...row[2], ...row[3]]);
const entry = (letter, label) => hints.get(letter).find((item) => item.label === label);

test('every taught kana has a short plain hint, and a basic kana shows 字源, 比一比 and 例子 in that order', () => {
  assert.equal(letters.length, 208);
  assert.equal(basic.length, 92);
  const order = ['字源', '比一比', '例子'];
  for (const letter of letters) {
    const entries = hints.get(letter);
    assert.ok(entries.length >= 1, letter);
    for (const item of entries) {
      assert.ok(item.text.trim() && [...item.text].length <= 70, `${letter}: ${item.text}`);
      // No made-up pictures (像一根柱子…) or claims about stroke order.
      assert.doesNotMatch(item.text, /[<>]|(?<!很)像|聯想|保證|一定記住|筆順/u, `${letter}: ${item.text}`);
    }
  }
  for (const letter of basic) {
    const labels = [...hints.get(letter)].map((item) => item.label);
    assert.deepEqual(labels, order.filter((label) => labels.includes(label)), letter);
  }
});

test('kanji origins come from the dictionaries, and kana whose origin is open have none', () => {
  const open = ['つ', 'ツ', 'ん', 'ン'];
  for (const letter of basic) {
    const origin = entry(letter, '字源');
    if (open.includes(letter)) { assert.equal(origin, undefined, letter); continue; }
    assert.ok(origin, letter);
    assert.match(origin.text, /^(一般認為)?(由|取自)漢字「[㐀-鿿]」/u, `${letter}: ${origin.text}`);
    // Hiragana came from whole kanji in cursive (へ from 部's 阝); katakana mostly kept a part.
    if (/[ぁ-ゖ]/u.test(letter)) assert.match(origin.text, /草寫變來。$/u, letter);
  }
  // Spot checks against デジタル大辞泉, 日本国語大辞典 and ニッポニカ (docs/kana-hints-review.md).
  const expected = {
    'あ': '由漢字「安」草寫變來。', 'へ': '由漢字「部」右邊的「阝」草寫變來。', 'ね': '由漢字「祢」（禰）草寫變來。', 'を': '由漢字「遠」草寫變來。',
    'ア': '取自漢字「阿」左邊的「阝」。', 'ウ': '取自漢字「宇」上面的「宀」。', 'オ': '取自漢字「於」的左半邊。', 'ケ': '取自漢字「介」的前三筆。',
    'タ': '取自漢字「多」上面的「夕」。', 'ニ': '由漢字「二」變來。', 'ハ': '一般認為由漢字「八」變來。', 'メ': '由漢字「女」變來。',
    'ル': '一般認為取自漢字「流」的最後兩筆。', 'ヲ': '取自漢字「乎」的前三筆。',
  };
  for (const [letter, text] of Object.entries(expected)) assert.equal(entry(letter, '字源').text, text, letter);
});

test('a comparison names another basic kana and says where they differ', () => {
  let count = 0;
  for (const letter of basic) {
    const item = entry(letter, '比一比');
    if (!item) continue;
    count++;
    assert.ok([...item.text].some((ch) => basic.includes(ch) && ch !== letter), `${letter}: ${item.text}`);
    assert.ok(item.text.includes(letter) || /同音的平假名/u.test(item.text), `${letter}: ${item.text}`);
  }
  assert.ok(count >= 40, 'Confusable pairs are covered');
  // The pairs beginners mix up most say where the dots sit and which way the long stroke goes.
  assert.match(entry('シ', '比一比').text, /シ 的兩點在左邊，長的一筆往右上挑/u);
  assert.match(entry('ツ', '比一比').text, /ツ 的兩點在上面，長的一筆往左下撇/u);
  assert.match(entry('ソ', '比一比').text, /ソ 往左下撇/u);
  assert.match(entry('ン', '比一比').text, /ン 往右上挑/u);
});

test('an example word holds its kana, spells romaji the way the lessons do, and is never needed to learn the kana', () => {
  // Romaji from the lesson readings: a small っ doubles the next consonant and ー repeats the vowel before it.
  const readings = new Map();
  for (const row of content.rows) for (const script of [row[2], row[3]]) [...script].forEach((letter, i) => readings.set(letter, row[4][i]));
  const romaji = (word) => {
    let out = '', double = false;
    for (let i = 0; i < word.length; i++) {
      const pair = word.slice(i, i + 2), ch = word[i];
      let reading;
      if (readings.has(pair)) { reading = readings.get(pair); i++; }
      else if (pair === 'ファ') { reading = 'fa'; i++; }
      else if (ch === 'っ' || ch === 'ッ') { double = true; continue; }
      else if (ch === 'ー') reading = out.at(-1);
      else reading = readings.get(ch);
      assert.ok(reading, `${word}: ${ch}`);
      out += double ? reading[0] + reading : reading;
      double = false;
    }
    return out;
  };
  let count = 0;
  for (const letter of basic) {
    const item = entry(letter, '例子');
    if (!item) continue;
    count++;
    assert.ok(item.word.includes(letter), `${letter}: ${item.word}`);
    assert.equal(romaji(item.word), item.romaji, item.word);
    assert.match(item.meaning, /^[一-鿿]+$/u, item.word);
    assert.equal(item.text, `${item.word}（${item.romaji}）${item.meaning}`);
  }
  assert.ok(count >= 88, 'Almost every basic kana has an example');
  assert.equal(entry('を', '例子'), undefined, 'を is only a particle');
});

test('an example word never means something else on a travel card', () => {
  const phrasebook = new Map();
  for (const category of content.phrasebook) for (const step of category.steps) for (const [word, , meaning] of step.keywords) {
    // Index the kana reading in （） too: 〜行き（ゆき）would otherwise hide a ゆき example meaning 雪.
    const reading = word.match(/（(.+?)）/u)?.[1];
    for (const key of [word.replace(/（.*?）/u, ''), reading]) if (key) phrasebook.set(key.replace(/〜/gu, ''), meaning);
  }
  assert.ok(phrasebook.size >= 60);
  for (const letter of basic) {
    const item = entry(letter, '例子');
    if (item && phrasebook.has(item.word)) assert.equal(item.meaning, phrasebook.get(item.word), `${letter}: ${item.word}`);
  }
});

test('voiced, semi-voiced and contracted hints point back to the base kana with the lesson readings, and claim no origin', () => {
  assert.deepEqual(plain(hints.get('が')), [{ label: '濁點', text: 'か 右上加兩點（濁點），讀音從 ka 變成 ga。' }]);
  assert.deepEqual(plain(hints.get('パ')), [{ label: '半濁點', text: 'ハ 右上加一個小圈（半濁點），讀音從 ha 變成 pa。' }]);
  assert.deepEqual(plain(hints.get('きゃ')), [{ label: '拗音', text: 'き（ki）後面接小的 ゃ（ya），合成一拍讀 kya；寫成大的 や 就是 き、や 兩個音。' }]);
  assert.deepEqual(plain(hints.get('ジョ')), [{ label: '拗音', text: 'ジ（ji）後面接小的 ョ（yo），合成一拍讀 jo；寫成大的 ヨ 就是 ジ、ヨ 兩個音。' }]);
  for (const row of content.rows.slice(10)) for (const script of [row[2], row[3]]) [...script].forEach((letter, i) => {
    const items = hints.get(letter);
    assert.equal(items.length, 1, letter);
    assert.ok(items[0].text.includes(` ${row[4][i]}`), `${letter}: ${items[0].text}`);
    assert.notEqual(items[0].label, '字源', letter);
  });
  assert.equal(hints.get('ゃ').length, 0);
});

test('hints and unknown results are immutable and do not resolve inherited properties', () => {
  assert.ok(Object.isFrozen(hints));
  for (const letter of letters) {
    assert.ok(Object.isFrozen(hints.get(letter)));
    for (const item of hints.get(letter)) assert.ok(Object.isFrozen(item));
  }
  assert.throws(() => { hints.get('あ')[0].text = 'changed'; }, TypeError);
  for (const value of ['', 'あい', 'ゔ', 'ゃ', 'A', '__proto__', 'constructor', null, undefined, 1, {}]) {
    assert.equal(hints.get(value).length, 0);
    assert.ok(Object.isFrozen(hints.get(value)));
  }
});

test('the note says where origins come from and that example words need no memorising', () => {
  assert.match(hints.notice, /字源/u);
  assert.match(hints.notice, /不用背/u);
  assert.doesNotMatch(hints.notice, /不是字源/u);
});
