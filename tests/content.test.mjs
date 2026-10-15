import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import vm from 'node:vm';

const context = vm.createContext({});
vm.runInContext(readFileSync(new URL('../dist/content.js', import.meta.url), 'utf8') + '\nglobalThis.loaded = Content;', context);
const Content = context.loaded;
const plain = value => JSON.parse(JSON.stringify(value));
const data = () => plain({ rows: Content.rows, grammar: Content.grammar, travel: Content.travel, phrasebook: Content.phrasebook, intro: Content.intro });
const errors = mutate => { const copy = data(); mutate(copy); return Content.validate(copy).join('\n'); };

test('extracted visible content exactly matches the pre-extraction snapshot', () => {
  const original = JSON.stringify(data(), (key, value) => key === 'id' && typeof value === 'string' && value.includes('/') ? undefined : value);
  assert.equal(createHash('sha256').update(original).digest('hex'), '845b99c16bcc30bbf559ad95622d91fdeff23bab24b1428855e2daf6993afafe');
  assert.deepEqual(plain(Content.validate()), []);
});

test('registry includes 20 kana groups, three grammar courses and four compatible travel courses', () => {
  assert.equal(Object.keys(Content.courses).length, 27);
  for (const script of ['h', 'k']) {
    const courses = Object.values(Content.courses).filter(c => c.script === script);
    assert.equal(courses.length, 10);
    assert.equal(courses.flatMap(c => c.letters).length, 46);
    assert.equal(new Set(courses.flatMap(c => c.letters)).size, 46);
    assert.equal(courses.flatMap(c => c.cards).length, 46);
    assert.equal(courses.flatMap(c => c.questions).length, 46);
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
  assert.match(errors(d => d.travel[0].steps[0].politeReading = ''), /politeReading/i);
  assert.match(errors(d => d.phrasebook[0].steps[0].keywords[0][1] = ''), /reading/i);
});

test('options must be distinct nonempty strings and the correct index must exist', () => {
  assert.match(errors(d => d.grammar[0].questions[0].options[1] = d.grammar[0].questions[0].options[0]), /distinct/i);
  assert.match(errors(d => d.travel[0].questions[0].answer = 100), /answer/i);
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
  for (const value of [null, {}, { rows: [null], grammar: [null], travel: {}, phrasebook: [1], intro: null }]) {
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
