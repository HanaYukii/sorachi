import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const contentSource = readFileSync(new URL('../dist/content.js', import.meta.url), 'utf8');
const studySource = readFileSync(new URL('../dist/study.js', import.meta.url), 'utf8');
const plain = value => JSON.parse(JSON.stringify(value));
const completedAt = '2026-10-15T10:00:00.000Z';

function load(mutation = '') {
  const marker = '  const courses = buildCourses(data);';
  assert.equal(contentSource.split(marker).length, 2, 'The fixture must mutate content before registry construction and freezing.');
  const source = contentSource.replace(marker, `${mutation}\n${marker}`);
  const context = vm.createContext({});
  vm.runInContext(source, context, { filename: 'dist/content.js' });
  vm.runInContext(studySource, context, { filename: 'dist/study.js' });
  return {
    content: vm.runInContext('Content', context),
    study: vm.runInContext('Study', context),
  };
}

function legacySaved() {
  // V1 stored indexes, with the second authored question presented first.
  return {
    script: 'h',
    courses: {
      'g-identity': {
        attempts: 2, completedAt, lastResult: { firstCorrect: 2, total: 2 },
        active: {
          phase: 'quiz', cursor: 1, order: [1, 0], options: [[2, 0, 1], [1, 2, 0]],
          direction: 'character', first: { 1: false }, solved: { 1: true }, wrong: null,
        },
      },
    },
  };
}

function versionedSaved() {
  const original = load();
  const saved = legacySaved();
  const active = saved.courses['g-identity'].active;
  active.courseRevision = original.content.courseRevision('g-identity');
  active.questionIds = plain(original.content.getCourse('g-identity').questions.map(q => q.id));
  return saved;
}

function assertEarnedResultSurvives(result) {
  assert.equal(result.completedAt, completedAt);
  assert.equal(result.attempts, 2);
  assert.deepEqual(plain(result.lastResult), { firstCorrect: 2, total: 2 });
}

test('legacy baseline resumes shuffled indexes and first responses while stamping revision and IDs', () => {
  const { content, study } = load();
  const result = study.sanitize(legacySaved()).courses['g-identity'];
  assertEarnedResultSurvives(result);
  assert.equal(result.active.phase, 'quiz');
  assert.equal(result.active.cursor, 1);
  assert.deepEqual(plain(result.active.order), [1, 0]);
  assert.deepEqual(plain(result.active.options), [[2, 0, 1], [1, 2, 0]]);
  assert.deepEqual(plain(result.active.first), { 1: false });
  assert.deepEqual(plain(result.active.solved), { 1: true });
  assert.equal(result.active.courseRevision, content.legacyCourseRevision['g-identity']);
  assert.deepEqual(plain(result.active.questionIds), plain(content.getCourse('g-identity').questions.map(q => q.id)));
});

test('a current versioned attempt resumes without changing its score or original question order', () => {
  const { study } = load();
  const saved = versionedSaved();
  const result = study.sanitize(saved).courses['g-identity'];
  assertEarnedResultSurvives(result);
  assert.deepEqual(plain(result.active), saved.courses['g-identity'].active);
});

test('changed card content invalidates both legacy and versioned active attempts but preserves earned completion', () => {
  const original = load();
  const changed = load('grammar[0].steps[0].body += " 補充說明。";');
  assert.deepEqual(plain(changed.content.validate()), []);
  assert.notEqual(changed.content.courseRevision('g-identity'), original.content.courseRevision('g-identity'));
  assert.equal(changed.content.legacyCourseRevision['g-identity'], original.content.legacyCourseRevision['g-identity']);
  for (const saved of [legacySaved(), versionedSaved()]) {
    const result = changed.study.sanitize(saved).courses['g-identity'];
    assert.equal(result.active, null);
    assertEarnedResultSurvives(result);
  }
});

test('reordering questions with the same count invalidates saved index-based answers', () => {
  const changed = load('grammar[0].questions.reverse();');
  assert.deepEqual(plain(changed.content.validate()), []);
  assert.equal(changed.study.total('g-identity'), 2);
  for (const saved of [legacySaved(), versionedSaved()]) {
    const result = changed.study.sanitize(saved).courses['g-identity'];
    assert.equal(result.active, null);
    assertEarnedResultSurvives(result);
  }
});

test('adding a question invalidates the active attempt without rewriting old result total', () => {
  const changed = load('grammar[0].questions.push({ ...grammar[0].questions[0], id: "g-identity/question/new-example", prompt: "另一個例句，應使用哪個句尾？" });');
  assert.deepEqual(plain(changed.content.validate()), []);
  assert.equal(changed.study.total('g-identity'), 3);
  for (const saved of [legacySaved(), versionedSaved()]) {
    const result = changed.study.sanitize(saved).courses['g-identity'];
    assert.equal(result.active, null);
    assertEarnedResultSurvives(result);
    assert.notEqual(result.lastResult.total, changed.study.total('g-identity'));
  }
});

test('question ID mismatch is rejected even when the revision claims to be current', () => {
  const { study } = load();
  for (const change of [ids => ids.reverse(), ids => ids.splice(0, 1), ids => { ids[0] = 'g-identity/question/unknown'; }]) {
    const saved = versionedSaved();
    change(saved.courses['g-identity'].active.questionIds);
    const result = study.sanitize(saved).courses['g-identity'];
    assert.equal(result.active, null);
    assertEarnedResultSurvives(result);
  }
});

test('an unknown explicit revision never falls back to the compatible legacy baseline', () => {
  const { study } = load();
  const saved = versionedSaved();
  saved.courses['g-identity'].active.courseRevision = 'c1-0000000000000000';
  const result = study.sanitize(saved).courses['g-identity'];
  assert.equal(result.active, null);
  assertEarnedResultSurvives(result);
});

test('completed attempts are also revision checked without erasing prior completion evidence', () => {
  const saved = versionedSaved();
  const active = saved.courses['g-identity'].active;
  active.phase = 'done'; active.first = { 0: true, 1: true }; active.solved = { 0: true, 1: true };
  const changed = load('grammar[0].questions[0].answer = 1;');
  const result = changed.study.sanitize(saved).courses['g-identity'];
  assert.equal(result.active, null);
  assertEarnedResultSurvives(result);
});

test('opening an invalidated course starts clean cards at the new revision without recording a completion', () => {
  const changed = load('grammar[0].steps[0].body += " 新版內容。";');
  const state = changed.study.sanitize(versionedSaved());
  let saves = 0, records = 0;
  changed.study.bind({ getState: () => state, save: () => { saves++; }, record: () => { records++; }, footer: () => '', warning: () => '' });
  const html = changed.study.render('#study/g-identity');
  const course = state.courses['g-identity'];
  assert.equal(course.active.phase, 'cards');
  assert.equal(course.active.cursor, 0);
  assert.equal(course.active.courseRevision, changed.content.courseRevision('g-identity'));
  assert.deepEqual(plain(course.active.first), {});
  assert.deepEqual(plain(course.active.solved), {});
  assertEarnedResultSurvives(course);
  assert.match(html, /新版內容/);
  assert.equal(records, 0);
  assert.equal(saves, 1);
});
