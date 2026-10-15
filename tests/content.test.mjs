import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import vm from 'node:vm';

const context = vm.createContext({});
vm.runInContext(readFileSync(new URL('../dist/content.js', import.meta.url), 'utf8') + '\nglobalThis.loaded = Content;', context);
const Content = context.loaded;
const plain = value => JSON.parse(JSON.stringify(value));
const data = () => plain({ rows: Content.rows, grammar: Content.grammar, phrasebook: Content.phrasebook, intro: Content.intro });
const errors = mutate => { const copy = data(); mutate(copy); return Content.validate(copy).join('\n'); };

test('current reviewed content matches the editorial snapshot', () => {
  const original = JSON.stringify(data(), (key, value) => key === 'id' && typeof value === 'string' && value.includes('/') ? undefined : value);
  assert.equal(createHash('sha256').update(original).digest('hex'), '9f4ea5055b56b03f1f525455e4628475a3ffbd1190bbe2df1a95cee61b6a0a07');
  assert.deepEqual(plain(Content.validate()), []);
});

test('reviewed grammar teaches topic marking and tests all three spatial demonstratives', () => {
  const identity = Content.getCourse('g-identity');
  assert.equal(identity.title, '名詞句：〜は〜です');
  assert.doesNotMatch(identity.steps.map(s => s.body).join(''), /接起來|連接/);
  assert.match(identity.steps[1].body, /主題/);
  assert.match(identity.questions[0].prompt, /わたし＿＿がくせいです/);
  assert.deepEqual(plain(identity.questions[0].options), ['は', 'わ', 'です']);
  assert.equal(identity.questions[0].options[identity.questions[0].answer], 'は');
  assert.doesNotMatch(identity.questions[1].prompt, /連接/);
  const demo = Content.getCourse('g-demo');
  assert.doesNotMatch(demo.questions[0].prompt, /這是麵包/);
  assert.equal(demo.questions.length, 3);
  assert.deepEqual([...new Set(demo.questions.map(q => q.options[q.answer]))].sort(), ['あれ', 'これ', 'それ'].sort());
});

test('intro teaches mixed scripts before testing them and uses neutral lesson copy', () => {
  const cards = Content.intro.lessons.map(card => `${card.intro} ${card.content} ${card.tip}`).join('');
  assert.match(cards, /日本のパン/);
  assert.match(cards, /三種文字.*一起|一起.*三種文字/);
  assert.doesNotMatch(cards, /有意思|重要起點/);
});

test('question particle explanation does not depend on a question mark or mandatory rising tone', () => {
  const card = Content.getCourse('g-question').steps[1];
  assert.equal(card.example, 'がくせいですか。');
  assert.match(card.body, /句號|「。」/);
  assert.match(card.body, /不一定|依情境/);
  assert.doesNotMatch(card.body, /都要.*上揚|一律.*上揚/);
});

test('travel guidance scopes charge and IC acceptance rules and keeps shared cards consistent', () => {
  for (const collection of [Content.phrasebook]) {
    const bill = collection.find(c => c.id === 't-pay').steps[0];
    assert.ok(bill.keywords.some(word => word[0] === 'レジ' && word[1] === 'reji'));
    assert.match(bill.body, /有些餐廳/);
    const charge = collection.find(c => c.id === 't-charge').steps[0];
    assert.match(charge.body, /有人櫃檯/);
    assert.match(charge.body, /7-Eleven.*全家.*現金/);
    assert.match(charge.body, /部分門市/);
    assert.match(charge.body, /支援.*Suica.*售票機/);
    assert.ok(charge.body.split('。').filter(Boolean).length <= 3);
    assert.equal(collection.find(c => c.id === 't-order').steps.find(s => s.id.endsWith('portion')).title, '份量：一般份量、大份量');
    assert.equal(collection.find(c => c.id === 't-charge').steps[1].keywords[0][1], 'sen en');
  }
  const suica = Content.phrasebook.find(c => c.id === 't-pay').steps.find(s => s.id.endsWith('suica'));
  assert.match(suica.body, /ICOCA.*PASMO/);
  assert.match(suica.body, /店家.*支援標示/);
  assert.match(suica.body, /自己的卡名/);
  assert.doesNotMatch(suica.body, /相互利用|PiTaPa|全部|所有/);
  const decline = Content.phrasebook.find(c => c.id === 'dining').steps.find(s => s.id.endsWith('decline'));
  assert.match(decline.body, /大丈夫です/);
  assert.match(decline.body, /情境/);
  // The phrasebook is the only travel source now; nothing can drift from a second copy.
  assert.equal(Content.travel, undefined);
});

test('question lesson avoids punctuation giveaways and untaught teacher distractors', () => {
  const questions = Content.getCourse('g-question').questions;
  assert.doesNotMatch(questions[0].prompt, /詢問他的身分|がくせいですか？/);
  assert.doesNotMatch(questions.flatMap(q => q.options).join(''), /老師/);
  for (const question of questions) assert.ok(question.options.every(option => !/[？?。]/u.test(option)));
  assert.deepEqual(plain(questions[0].options), ['你是學生嗎', '我是學生嗎', '我是學生']);
});

test('intro distractors are balanced and travel phrases retain concise contextual wording', () => {
  const options = Content.intro.questions[5].options;
  const lengths = options.map(option => [...option].length);
  assert.ok(Math.max(...lengths) - Math.min(...lengths) <= 6);
  assert.doesNotMatch(options.join(''), /只會/);
  for (const collection of [Content.phrasebook]) {
    const pay = collection.find(c => c.id === 't-pay').steps[0];
    assert.equal(pay.keywords[0][0], 'お会計（おかいけい）');
    assert.equal(pay.keywords[0][1], 'okaikei');
    const place = collection.find(c => c.id === 't-place').steps[0];
    assert.match(place.body, /すみません/);
    assert.doesNotMatch(place.body, /通常就知道/);
    const order = collection.find(c => c.id === 't-order').steps;
    assert.equal(order.find(s => s.id.endsWith('drink-temperature')).politeMeaning, '我要冰的，麻煩你。');
  }
  assert.doesNotMatch(JSON.stringify(Content.phrasebook), /1000 円/);
  const reservation = Content.phrasebook.find(c => c.id === 'hotel').steps.find(s => s.id.endsWith('reservation'));
  assert.equal(reservation.keywords.length, 1);
  assert.equal(reservation.keywords[0][0], '予約（よやく）');
});

test('registry includes 30 kana groups and three grammar courses; retired travel courses keep only a title', () => {
  assert.equal(Object.keys(Content.courses).length, 33);
  for (const id of ['t-place', 't-order', 't-pay', 't-charge']) {
    assert.equal(Content.getCourse(id), null);
    assert.ok(Content.phrasebook.some(c => c.id === id));
    assert.match(Content.retiredTitles[id], /\p{Script=Han}/u);
    assert.ok(Content.legacyCourseRevision[id], 'The immutable v1 baseline keeps retired ids');
  }
  for (const script of ['h', 'k']) {
    const courses = Object.values(Content.courses).filter(c => c.script === script);
    assert.equal(courses.length, 15);
    assert.equal(courses.flatMap(c => c.letters).length, 71);
    assert.equal(new Set(courses.flatMap(c => c.letters)).size, 71);
    assert.equal(courses.flatMap(c => c.cards).length, 71);
    assert.equal(courses.flatMap(c => c.questions).length, 71);
    for (const c of courses) assert.ok(c.cards.every(card => card.id.includes(card.character.codePointAt(0).toString(16))));
  }
  assert.equal(Content.getCourse('__proto__'), null);
  assert.equal(Content.getCourse('constructor'), null);
  assert.equal(Content.courseRevision('missing'), null);
});

test('each card/question/phrase has a stable explicit ID; duplicate source objects cannot hide in registry', () => {
  assert.match(errors(d => d.grammar.push(d.grammar[0])), /duplicate.*course.*g-identity/i);
  assert.match(errors(d => d.grammar[0].id = 'h-a'), /duplicate.*course.*h-a/i);
  assert.match(errors(d => d.grammar[0].steps[1].id = d.grammar[0].steps[0].id), /duplicate.*card/i);
  assert.match(errors(d => d.grammar[0].questions[1].id = d.grammar[0].questions[0].id), /duplicate.*question/i);
  assert.match(errors(d => d.phrasebook[0].steps.push(d.phrasebook[0].steps[0])), /duplicate.*phrase/i);
  assert.match(errors(d => delete d.intro.lessons[0].id), /id/i);
});

test('schema guards reject missing Japanese, readings, Chinese and partial polite examples', () => {
  assert.match(errors(d => d.grammar[0].steps[0].example = 'English only'), /Japanese/i);
  assert.match(errors(d => d.grammar[0].steps[0].reading = ''), /reading/i);
  assert.match(errors(d => d.grammar[0].steps[0].meaning = ''), /meaning/i);
  assert.match(errors(d => d.phrasebook[0].steps[0].politeReading = ''), /politeReading/i);
  assert.match(errors(d => d.phrasebook[0].steps[0].keywords[0][1] = ''), /reading/i);
});

test('options must be distinct nonempty strings and the correct index must exist', () => {
  assert.match(errors(d => d.grammar[0].questions[0].options[1] = d.grammar[0].questions[0].options[0]), /distinct/i);
  assert.match(errors(d => d.grammar[1].questions[0].answer = 100), /answer/i);
  assert.match(errors(d => d.phrasebook[0].questions = []), /not quizzes/i);
  assert.match(errors(d => d.grammar[0].group = 'travel'), /phrasebook/i);
  assert.match(errors(d => d.grammar[0].questions[0].answer = 0.5), /answer/i);
  assert.match(errors(d => d.intro.questions[4].options = []), /options/i);
  assert.match(errors(d => d.intro.questions[5].hint = ''), /hint/i);
});

test('kana guards detect missing/duplicate characters, shifted readings and invalid short rows', () => {
  assert.match(errors(d => d.rows[0][2] = 'ああうえお'), /kana|coverage|duplicate/i);
  assert.match(errors(d => d.rows[7][2] += 'ゐ'), /kana|row|coverage/i);
  assert.match(errors(d => d.rows[0][4][0] = 'wrong'), /reading/i);
  assert.match(errors(d => d.rows.pop()), /kana|row|coverage/i);
});

test('malformed schema produces diagnostics instead of throwing', () => {
  for (const value of [null, {}, { rows: [null], grammar: [null], phrasebook: [1], intro: null }]) {
    assert.doesNotThrow(() => Content.validate(value));
    assert.ok(Content.validate(value).length > 0);
  }
  assert.match(errors(d => d.grammar[0].steps = null), /steps/i);
  assert.match(errors(d => d.phrasebook[0].steps[0].extra = []), /extra/i);
});

test('course revisions cover cards, question order, answers and options, but not object key order', () => {
  const original = plain(Content.getCourse('g-identity'));
  const rev = Content.revisionOf(original);
  const reorderKeys = Object.fromEntries(Object.entries(original).reverse());
  assert.equal(Content.revisionOf(reorderKeys), rev);
  for (const mutate of [c => c.steps[0].body += 'x', c => c.questions.reverse(), c => c.questions[0].answer = 1, c => c.questions[0].options.reverse(), c => c.steps.reverse()]) {
    const copy = plain(original); mutate(copy);
    assert.notEqual(Content.revisionOf(copy), rev);
  }
});

test('legacy revision baseline is literal and matches the exact initial extraction', () => {
  // This checksum must stay fixed when current content changes. Only the visible-content snapshot may be updated.
  assert.equal(createHash('sha256').update(JSON.stringify(Content.legacyCourseRevision)).digest('hex'), '7ecc70385445db1f657ee2c425ea12599d169deaa65aadba457c12cf725fe763');
  for (const revision of Object.values(Content.legacyCourseRevision)) assert.match(revision, /^c1-[a-f0-9]{16}$/);
  const source = readFileSync(new URL('../dist/content.js', import.meta.url), 'utf8');
  assert.match(source, /const legacyCourseRevision = Object\.freeze\(\{/);
  assert.notEqual(Content.revisionOf({ ...plain(Content.getCourse('g-identity')), title: 'changed' }), Content.legacyCourseRevision['g-identity']);
});

test('voiced and semi-voiced rows are required with the shared ji／zu readings', () => {
  const voiced = Content.rows.slice(10).map(row => row[0]);
  assert.deepEqual(plain(voiced), ['ga', 'za', 'da', 'ba', 'pa']);
  assert.deepEqual(plain(Content.getCourse('h-da').readings), ['da', 'ji', 'zu', 'de', 'do']);
  assert.deepEqual(plain(Content.getCourse('k-pa').letters), ['パ', 'ピ', 'プ', 'ペ', 'ポ']);
  const withoutPa = { ...JSON.parse(JSON.stringify(data())), rows: plain(Content.rows).slice(0, 14) };
  assert.ok(plain(Content.validate(withoutPa)).some(message => /fifteen rows/.test(message)));
});

test('grammar questions with Japanese options must carry matching romaji, travel legacy courses are exempt', () => {
  const candidate = JSON.parse(JSON.stringify(data()));
  delete candidate.grammar[0].questions[0].readings;
  candidate.grammar[2].questions[0].readings = ['kore'];
  const messages = plain(Content.validate(candidate));
  assert.ok(messages.some((m) => /grammar\[0\]\.questions\[0\]\.readings: Japanese options require readings/.test(m)));
  assert.ok(messages.some((m) => /grammar\[2\]\.questions\[0\]\.readings: readings must match options/.test(m)));
  assert.ok(!messages.some((m) => m.startsWith('travel')));
});
