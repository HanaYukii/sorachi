import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const context = vm.createContext({ console });
for (const file of ['content', 'kana-practice']) {
  vm.runInContext(readFileSync(new URL(`../dist/${file}.js`, import.meta.url), 'utf8'), context);
}
const { P, C } = vm.runInContext('({P:KanaPractice,C:Content})', context);
const clone = value => JSON.parse(JSON.stringify(value));
const ids = course => C.courses[course].questions.map(question => question.id);

test('history seeding cannot undo a live delayed-retry success recorded just before completion', () => {
  const questions = ids('h-a');
  const review = { [questions[0]]: { lastSeen: '2026-01-01T00:00:09.000Z', wrong: false } };
  const history = [{ date: '2026-01-01T00:00:10.000Z', courseId: 'h-a', questionIds: questions, total: 5, retryQuestions: [1] }];
  P.seedReview(review, history, null);
  assert.equal(review[questions[0]].wrong, false);
});

test('history seeding tolerates damaged records and cannot mark unknown IDs for review', () => {
  const review = {};
  const bad = [null, undefined, {}, { date: '2026-01-01', courseId: 'h-a', questionIds: ['secret'], total: 1, retryQuestions: [1] }];
  assert.doesNotThrow(() => P.seedReview(review, bad, null));
  assert.deepEqual(Object.keys(review), []);
});

test('every intermediate first/retry state can reload without changing results or skipping work', () => {
  for (const course of ['h-a', 'h-wa', 'k-wa']) {
    let session = P.create(ids(course), { completedIds: ['h-ka', 'k-ka'] });
    while (session.round !== 'done') {
      session = P.sanitize(clone(session));
      assert.ok(session);
      assert.equal(P.next(session), false);
      const q = P.current(session);
      const choice = (q.options.indexOf(q.id) + 1) % q.options.length;
      assert.equal(P.answer(session, choice).correct, false);
      const score = P.firstCorrect(session);
      session = P.sanitize(clone(session));
      assert.ok(session);
      assert.equal(P.firstCorrect(session), score);
      assert.equal(P.answer(session, q.options.indexOf(q.id)), null);
      assert.equal(P.next(session), true);
    }
    assert.equal(P.firstCorrect(session), 0);
    assert.ok(P.sanitize(clone(session)));
  }
});

test('review puts mistakes first, longest-waiting first, then oldest learned, at most five unique characters', () => {
  const questions = ids('h-a');
  const review = Object.fromEntries(questions.map((id, index) => [id, {
    lastSeen: `2026-01-0${index + 1}T00:00:00.000Z`, wrong: index < 2,
  }]));
  const chosen = [...P.selectReview(review, { 'h-ka': { completedAt: '2025-01-01T00:00:00Z' } }, 99)];
  assert.equal(chosen.length, 5);
  assert.equal(new Set(chosen).size, 5);
  assert.deepEqual(chosen.slice(0, 2), [questions[0], questions[1]]);
  assert.ok(chosen.slice(2).every(id => P.entry(id).courseId === 'h-ka'));
});

function studyHarness(saved, history = []) {
  const location = { hash: '#kana' };
  const node = { dataset: {}, classList: { toggle() {} }, setAttribute() {}, focus() {}, scrollIntoView() {}, querySelector() { return null; } };
  const app = { innerHTML: '', querySelector() { return node; } };
  const sandbox = vm.createContext({ console, location, window: {}, document: {
    querySelector(selector) { return selector === '#app' ? app : node; }, querySelectorAll() { return []; },
  } });
  for (const file of ['content', 'drill-bank', 'drill', 'kana-practice', 'routes', 'navigation', 'crossword', 'study']) {
    vm.runInContext(readFileSync(new URL(`../dist/${file}.js`, import.meta.url), 'utf8'), sandbox);
  }
  const { S, P } = vm.runInContext('({S:Study,P:KanaPractice})', sandbox);
  const state = S.sanitize(saved);
  const render = hash => { location.hash = hash; app.innerHTML = S.render(hash); };
  S.bind({ getState: () => state, history: () => history, save() {}, record(record) { history.push(clone(record)); }, footer: () => '', warning: () => '', go: render });
  return { S, P, state, history, render, action(action, data = {}) { S.handle({ dataset: { action: `study-${action}`, ...data }, disabled: false }); } };
}

test('returning to cards does not skip or overwrite an answered question, including after reload', () => {
  let b = studyHarness();
  b.action('open', { course: 'h-a' });
  for (let i = 0; i < 5; i++) b.action('next');
  const session = b.state.courses['h-a'].active.practice;
  const q = b.P.current(session);
  b.action('answer', { choice: String((q.options.indexOf(q.id) + 1) % q.options.length) });
  b.action('review');
  assert.equal(b.state.courses['h-a'].active.phase, 'cards');
  b = studyHarness(clone(b.state));
  b.render('#study/h-a');
  for (let i = 0; i < 5; i++) b.action('next');
  const restored = b.state.courses['h-a'].active.practice;
  assert.equal(restored.cursor, 0);
  assert.equal(b.P.current(restored).id, q.id);
  assert.equal(b.P.answered(restored), true);
  b.action('answer', { choice: String(q.options.indexOf(q.id)) });
  assert.equal(b.P.firstCorrect(restored), 0);
  b.action('next');
  assert.equal(restored.cursor, 1);
});

test('clear ends active course and review sessions without reviving old mistakes on reload', () => {
  const b = studyHarness();
  b.action('open', { course: 'h-a' });
  for (let i = 0; i < 5; i++) b.action('next');
  const active = b.state.courses['h-a'].active;
  const q = b.P.current(active.practice);
  b.action('answer', { choice: String((q.options.indexOf(q.id) + 1) % q.options.length) });
  b.render('#kana-review'); b.action('review-start');
  assert.ok(b.state.reviewSession);
  b.S.clearReview();
  assert.equal(b.state.courses['h-a'].active, null);
  assert.equal(b.state.reviewSession, null);
  assert.equal(b.S.currentAttempt('h-a'), null);
  const oldHistory = [{ date: '2020-01-01T00:00:00Z', courseId: 'h-a', questionIds: ids('h-a'), total: 5, retryQuestions: [1] }];
  const restored = studyHarness(clone(b.state), oldHistory);
  assert.deepEqual(Object.keys(restored.state.kanaReview), []);
  assert.equal(restored.state.reviewSession, null);
  assert.equal(restored.S.reviewSummary().wrongCount, 0);
});

test('with more than five mistakes, the listed characters are exactly the ones the next round practices', () => {
  const missed = [...ids('h-a'), ...ids('h-ka').slice(0, 2)];
  const kanaReview = Object.fromEntries(missed.map((id, i) => [id, { lastSeen: `2026-10-0${i + 1}T00:00:00.000Z`, wrong: true }]));
  const b = studyHarness({ kanaReview });
  const html = b.S.render('#kana-review');
  const listed = html.match(/答錯的字：([^<]*)/)[1];
  assert.match(listed, /（共 7 個）$/);
  const chosen = [...b.P.selectReview(b.state.kanaReview, b.state.courses)].map(id => b.P.entry(id).character);
  assert.deepEqual(listed.replace(/（共.*$/, '').split('、').map(label => label[0]), chosen);
});
