import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const contentSource = readFileSync(new URL('../dist/content.js', import.meta.url), 'utf8');
const studySource = readFileSync(new URL('../dist/study.js', import.meta.url), 'utf8');
const plain = value => JSON.parse(JSON.stringify(value));
const completedAt = '2026-10-15T10:00:00.000Z';

// Fixed deployed V1 fixture; current reviewed content may evolve independently.
const baselineIdentity = {
  "id": "g-identity",
  "type": "grammar",
  "title": "A 是 B：は・です",
  "subtitle": "名詞句的基本結構",
  "steps": [
    {
      "title": "本課單字",
      "example": "わたし ／ がくせい",
      "reading": "watashi / gakusei",
      "meaning": "我 ／ 學生",
      "body": "本課用這兩個詞，練習自我介紹。",
      "id": "g-identity/card/nouns"
    },
    {
      "title": "句型：A は B です",
      "example": "わたしは がくせいです。",
      "reading": "watashi wa gakusei desu",
      "meaning": "我是學生。",
      "body": "「わたし」是我，「がくせい」是學生。在這種「A 是 B」的句子裡，用「は」接起來，再以「です」結尾；這是比較禮貌的說法。",
      "id": "g-identity/card/noun-sentence"
    },
    {
      "title": "助詞 は 的讀音",
      "example": "わたし は がくせい です。",
      "reading": "watashi wa gakusei desu",
      "meaning": "說到我：我是學生。",
      "body": "這裡的「は」標出我們正在說誰，要讀成 wa。雖然念 wa，寫的仍是「は」，不是「わ」。",
      "id": "g-identity/card/topic-reading"
    }
  ],
  "questions": [
    {
      "prompt": "想說「我是學生。」：わたしは がくせい＿＿。最後應放哪一個？",
      "options": [
        "です",
        "は",
        "わたし"
      ],
      "answer": 0,
      "explanation": "句尾放「です」，就是「わたしは がくせいです。」——我是學生。",
      "id": "g-identity/question/sentence-ending"
    },
    {
      "prompt": "在「わたしは がくせいです。」裡，連接兩部分的「は」讀作什麼？",
      "options": [
        "ha",
        "wa",
        "ka"
      ],
      "answer": 1,
      "explanation": "這裡的「は」是標出主題的小詞，讀作 wa；寫法仍然是「は」。",
      "id": "g-identity/question/topic-reading"
    }
  ]
};

function load(mutation = '', useBaseline = false) {
  const marker = '  const courses = buildCourses(data);';
  assert.equal(contentSource.split(marker).length, 2, 'The fixture must mutate content before registry construction and freezing.');
  const fixture = useBaseline ? `grammar[0] = ${JSON.stringify(baselineIdentity)};` : "";
  const source = contentSource.replace(marker, `${fixture}\n${mutation}\n${marker}`);
  const context = vm.createContext({});
  vm.runInContext(source, context, { filename: 'dist/content.js' });
  for (const file of ['drill-bank.js','drill.js','kana-practice.js','kana-hints.js']) vm.runInContext(readFileSync(new URL('../dist/' + file, import.meta.url),'utf8'),context);
  vm.runInContext(readFileSync(new URL("../dist/routes.js", import.meta.url), "utf8"), context);
  vm.runInContext(readFileSync(new URL("../dist/navigation.js", import.meta.url), "utf8"), context);
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
  const { content, study } = load('', true);
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
  assert.deepEqual(plain(result.active), {...saved.courses['g-identity'].active,touched:true});
});

test('reviewed current content rejects the fixed legacy attempt while keeping earned results', () => {
  const { content, study } = load();
  assert.notEqual(content.courseRevision('g-identity'), content.legacyCourseRevision['g-identity']);
  const result = study.sanitize(legacySaved()).courses['g-identity'];
  assert.equal(result.active, null);
  assertEarnedResultSurvives(result);
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
  const changed = load('grammar[0].questions.push({ ...grammar[0].questions[0], id: "g-identity/question/new-example", prompt: "另一個例句，應使用哪個句尾？" }); lessonPlan["g-identity"].review["g-identity/question/new-example"] = "g-identity/card/noun-sentence";');
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
  assert.equal(course.active, null);
  const draft = changed.study.currentAttempt('g-identity');
  assert.equal(draft.phase, 'cards');
  assert.equal(draft.cursor, 0);
  assert.equal(draft.courseRevision, changed.content.courseRevision('g-identity'));
  assert.deepEqual(plain(draft.first), {});
  assert.deepEqual(plain(draft.solved), {});
  assertEarnedResultSurvives(course);
  assert.match(html, /新版內容/);
  assert.equal(records, 0);
  assert.equal(saves, 0);
});
