import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import vm from 'node:vm';

const context = vm.createContext({});
vm.runInContext(readFileSync(new URL('../dist/content.js', import.meta.url), 'utf8') + '\nglobalThis.loaded = Content;', context);
const Content = context.loaded;
const plain = value => JSON.parse(JSON.stringify(value));
const data = () => plain({ rows: Content.rows, grammar: Content.grammar, lessonPlan: Content.lessonPlan, sounds: Content.sounds, phrasebook: Content.phrasebook, intro: Content.intro });
const errors = mutate => { const copy = data(); mutate(copy); return Content.validate(copy).join('\n'); };

test('current reviewed content matches the editorial snapshot', () => {
  const original = JSON.stringify(data(), (key, value) => key === 'id' && typeof value === 'string' && value.includes('/') ? undefined : value);
  assert.equal(createHash('sha256').update(original).digest('hex'), '9a085f25f5a3ea7f79ce22bc01f09c64240d4b5bd0bdcb8e8a9d5dec0563c0f6');
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

test('registry includes 52 kana groups, twenty-six grammar lessons and two special-sound lessons; retired travel courses keep only a title', () => {
  assert.equal(Object.keys(Content.courses).length, 80);
  assert.equal(Content.grammar.length, 26);
  for (const id of ['t-place', 't-order', 't-pay', 't-charge']) {
    assert.equal(Content.getCourse(id), null);
    assert.ok(Content.phrasebook.some(c => c.id === id));
    assert.match(Content.retiredTitles[id], /\p{Script=Han}/u);
    assert.ok(Content.legacyCourseRevision[id], 'The immutable v1 baseline keeps retired ids');
  }
  for (const script of ['h', 'k']) {
    const courses = Object.values(Content.courses).filter(c => c.script === script);
    assert.equal(courses.length, 26);
    assert.equal(courses.flatMap(c => c.letters).length, 104);
    assert.equal(new Set(courses.flatMap(c => c.letters)).size, 104);
    assert.equal(courses.flatMap(c => c.cards).length, 104);
    assert.equal(courses.flatMap(c => c.questions).length, 104);
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
  assert.match(errors(d => d.grammar[0].id = 'k-kanji'), /reserved for kana/i);
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
  const voiced = Content.rows.slice(10, 15).map(row => row[0]);
  assert.deepEqual(plain(voiced), ['ga', 'za', 'da', 'ba', 'pa']);
  assert.deepEqual(plain(Content.getCourse('h-da').readings), ['da', 'ji', 'zu', 'de', 'do']);
  assert.deepEqual(plain(Content.getCourse('k-pa').letters), ['パ', 'ピ', 'プ', 'ペ', 'ポ']);
  const withoutPa = { ...JSON.parse(JSON.stringify(data())), rows: plain(Content.rows).filter(row => row[0] !== 'pa') };
  assert.ok(plain(Content.validate(withoutPa)).some(message => /twenty-six rows/.test(message)));
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

test('four travel cards say what staff may ask, and party size is answered by gesture', () => {
  const card = (cat, tail) => Content.phrasebook.find(c => c.id === cat).steps.find(s => s.id.endsWith(`/${tail}`));
  const expected = { 'dining/takeout': '店内でお召し上がりですか？', 'shopping/bag': '袋はご利用ですか？', 'dining/decline': '温めますか？', 'hotel/check-in': 'パスポートをお願いします。' };
  for (const [key, ask] of Object.entries(expected)) {
    const [cat, tail] = key.split('/');
    const staff = card(cat, tail).staffAsks;
    assert.equal(staff.example, ask);
    assert.match(staff.reading, /^[a-z -]+$/); assert.match(staff.meaning, /\p{Script=Han}/u);
  }
  const party = card('dining', 'party-size');
  assert.equal(party.example, '何名様ですか？');
  assert.match(party.body, /比手指/);
  assert.ok(card('t-pay', 'bill').keywords.some(k => k[0] === 'レジ'));
  assert.match(card('shopping', 'receipt').body, /領収書/);
  assert.match(card('t-order', 'drink-temperature').extra.body, /ハイボール/);
  assert.match(errors(d => { d.phrasebook[2].steps[1].staffAsks = { example: 'English', reading: 'x', meaning: '中文' }; }), /staffAsks\.example/);
});

test('transit phrases pair the concepts, keep the question context, and hedge ticket rules', () => {
  const transit = Content.phrasebook.find(c => c.id === 'transit');
  const card = (tail) => transit.steps.find(s => s.id === `phrase/transit/${tail}`);
  assert.deepEqual(plain(card('ticket').keywords.slice(1).map(k => k[1])), ['katamichi', 'oufuku']);
  assert.deepEqual(plain(card('seat').keywords.map(k => k[2])), ['對號座', '自由座']);
  assert.match(card('seat').body, /不保證有位子/);
  assert.match(card('seat').body, /以車站說明為準/);
  assert.match(card('day-pass').body, /區域和路線不同/);
  assert.match(card('direction').example, /この電車.*京都/);
  assert.match(card('transfer').polite, /京都まで行きたいです。どこで乗り換えますか？/);
  assert.match(card('get-off').example, /降りればいい/);
  assert.match(card('platform').body, /「〇〇行き」表示開往〇〇/);
  assert.doesNotMatch(card('platform').body, /「行き」後面/);
  assert.doesNotMatch(card('platform').body, /行先欄/);
  assert.equal(card('get-off').keywords[0][0], 'どの駅（どのえき）', 'The minimal question is visible without expanding');
  assert.equal(card('day-pass').staffAsks.example, '何枚ですか？');
  for (const step of transit.steps) assert.ok(step.keywords.length <= 3, step.id);
  const at = Content.phrasebook.findIndex(c => c.id === 'transit');
  assert.equal(Content.phrasebook[at - 1].id, 't-charge', 'Transport stays next to IC top-ups');
});

test('contracted sounds are two-character kana rows with joined IDs, and special sounds are lessons on the kana page', () => {
  assert.deepEqual(plain(Content.rowGroups.youon), ['kya', 'sha', 'cha', 'nya', 'hya', 'mya', 'rya', 'gya', 'ja', 'bya', 'pya']);
  const kya = Content.getCourse('h-kya');
  assert.deepEqual(plain(kya.letters), ['きゃ', 'きゅ', 'きょ']);
  assert.deepEqual(plain(kya.readings), ['kya', 'kyu', 'kyo']);
  assert.equal(kya.cards[0].id, 'h-kya/card/u304d-3083');
  assert.deepEqual(plain(Content.getCourse('k-ja').letters), ['ジャ', 'ジュ', 'ジョ']);
  assert.equal(Content.getCourse('h-a').cards[0].id, 'h-a/card/u3042', 'Single-character IDs stay the same');
  for (const id of ['s-sokuon', 's-long']) {
    const lesson = Content.getCourse(id);
    assert.equal(lesson.home, 'kana');
    assert.ok(lesson.steps.length >= 3 && lesson.questions.length >= 3);
  }
  assert.match(Content.getCourse('s-sokuon').steps[0].reading, /kippu/);
  assert.match(Content.getCourse('s-long').steps[0].reading, /obaasan/);
  assert.match(errors(d => { d.sounds[0].home = undefined; }), /special-sound/);
  assert.match(errors(d => { d.grammar[0].home = 'kana'; }), /special-sound/);
  assert.match(errors(d => { d.rows[15][2] = ['きゃ', 'きゅ']; }), /coverage/);
  assert.match(errors(d => { d.rows[15][2] = 'きゃ きゅ きょ'; }), /coverage/, 'A contracted row written as one string would split into single kana');
  assert.equal(Content.courseRevision('h-kya'), Content.courseRevision('h-kya'));
  assert.equal(Content.courseRevision('nope'), null);
});

test('travel additions fill existing situations and keep events optional', () => {
  const phrase = (cat, slug) => Content.phrasebook.find(c => c.id === cat).steps.find(s => s.id === `phrase/${cat}/${slug}`);
  // #27 hotel: check-out, luggage before/after, pick-up, name.
  assert.equal(phrase('hotel', 'check-out').example, 'チェックアウトは何時ですか？');
  assert.match(phrase('hotel', 'luggage').polite, /チェックアウト後/);
  assert.match(phrase('hotel', 'luggage').body, /依飯店而定/);
  assert.equal(phrase('hotel', 'pick-up').example, '荷物を受け取りたいです。');
  assert.equal(phrase('hotel', 'reservation').staffAsks.example, 'お名前をお願いします。');
  // #28 + #32 help: not understood, pointing at a screen, left behind vs lost.
  assert.equal(phrase('basics', 'not-understood').keywords[0][0], 'わかりません');
  assert.match(phrase('basics', 'point').body, /畫面/);
  assert.match(phrase('basics', 'left-behind').example, /忘れました/);
  assert.match(phrase('basics', 'lost').example, /なくしました/);
  // #29 lockers, #31 size and choosing.
  assert.equal(phrase('t-place', 'locker').keywords[0][0], 'ロッカー');
  assert.match(phrase('t-place', 'locker-stuck').example, /開きません/);
  assert.match(phrase('shopping', 'size').polite, /大きいサイズ/);
  assert.equal(phrase('shopping', 'this-one').example, 'これ、ください。');
  // #30 + #33 in one situation; photos do not imply video.
  assert.match(phrase('lines', 'queue').body, /取號|登記/);
  assert.match(phrase('lines', 'photo').body, /不代表可以錄影/);
  // #34 stays last and is labelled optional.
  const live = Content.phrasebook.at(-1);
  assert.equal(live.id, 'live');
  assert.match(live.title, /選用/);
  assert.match(phrase('live', 'number').body, /不是座位號碼/);
  for (const category of Content.phrasebook) for (const step of category.steps) assert.ok(step.keywords.length <= 3, step.id);
});

test('speech text is kana only and fixes readings device voices may get wrong', () => {
  const step = (cat, slug) => Content.phrasebook.find(c => c.id === cat).steps.find(s => s.id === `phrase/${cat}/${slug}`);
  assert.equal(step('t-place', 'locker-stuck').speech, 'すみません、あきません。');
  assert.match(step('hotel', 'luggage').politeSpeech, /^チェックアウトご、/);
  assert.match(step('transit', 'platform').speech, /きょうとゆき/);
  assert.match(errors(d => { d.phrasebook[0].steps[0].speech = 'sumimasen'; }), /kana only/);
  assert.match(errors(d => { d.phrasebook[0].steps[0].politeSpeech = 'すみません'; }), /needs polite/);
});

test('grammar lessons follow a plan: earlier requirements, taught words only, a card to revisit for every question', () => {
  const ids = Content.grammar.map(g => g.id);
  assert.deepEqual(plain(ids), ['g-identity', 'g-question', 'g-demo', 'g-place', 'g-kono', 'g-who', 'g-negative', 'g-no', 'g-mo', 'g-to', 'g-kara-made', 'g-days', 'g-day-parts', 'g-weekdays', 'g-numbers', 'g-prices', 'g-counting', 'g-people', 'g-clock', 'g-kara-made-time', 'g-verbs', 'g-masen', 'g-mashita', 'g-ni-de', 'g-arimasu', 'g-position']);
  for (const lesson of Content.grammar) {
    const plan = Content.lessonPlan[lesson.id];
    for (const req of plan.requires) assert.ok(ids.indexOf(req) < ids.indexOf(lesson.id), `${lesson.id} requires ${req}`);
    for (const q of lesson.questions) assert.ok(lesson.steps.some(s => s.id === plan.review[q.id]), q.id);
  }
  assert.match(errors(d => { d.grammar[3].steps[0].example = 'ここ ／ ほん'; }), /not taught: ほん/);
  assert.match(errors(d => { d.grammar[3].questions[0].prompt = '你問：ほんは どこですか。'; }), /not taught: ほん/, 'Unquoted Japanese in a prompt is checked too');
  assert.match(errors(d => { const q = d.grammar[3].questions[0]; q.options[q.answer] = 'ほんです'; }), /not taught: ほん/, 'The correct option is checked');
  assert.doesNotMatch(errors(d => { const q = d.grammar[3].questions[0]; q.options[(q.answer + 1) % q.options.length] = 'ほんです'; }), /not taught/, 'Distractors may show forms not taught yet');
  assert.doesNotThrow(() => errors(d => { d.grammar[3].steps = null; d.grammar[4].questions = 'x'; }));
  assert.match(errors(d => { d.lessonPlan['g-kono'].requires = ['g-who']; }), /must be an earlier lesson/);
  assert.match(errors(d => { delete d.lessonPlan['g-mo'].review['g-mo/question/meaning']; }), /needs a card to revisit/);
  assert.match(errors(d => { delete d.lessonPlan['g-to']; }), /needs a plan entry/);
  assert.deepEqual([...new Set(Content.grammar.map(lesson => Content.lessonPlan[lesson.id].unit))], ['名詞句', '時間與數字', '動作與地點']);
  assert.match(errors(d => { d.lessonPlan['g-to'].unit = '時間與數字'; }), /lessons in a unit must be next to each other/);
  assert.match(errors(d => { delete d.lessonPlan['g-days'].unit; }), /lessonPlan.g-days.unit: required nonempty text/);
  assert.match(errors(d => { d.lessonPlan['g-days'].unit = '時間與數字 '; }), /unit title has surrounding spaces/);
});

test('ported Jabiko questions keep their source and stems', () => {
  const sources = Object.assign({}, ...Object.values(Content.lessonPlan).map(plan => plan.sources || {}));
  assert.deepEqual(Object.keys(sources).sort(), ['g-arimasu/question/jabiko-ga', 'g-no/question/jabiko-no', 'g-who/question/jabiko-doko']);
  for (const [id, source] of Object.entries(sources)) assert.match(source, /^Jabiko src\/domain\/exam\/items\/n5\.ts n5-grammar-[a-z-]+ @31c96ab$/, id);
  const question = (course, id) => Content.getCourse(course).questions.find(q => q.id === id);
  assert.match(question('g-no', 'g-no/question/jabiko-no').prompt, /これは わたし ＿＿ かさです。/);
  assert.deepEqual(plain(question('g-who', 'g-who/question/jabiko-doko').options), ['どこ', 'だれ', 'いつ', 'なに']);
  assert.match(question('g-arimasu', 'g-arimasu/question/jabiko-ga').prompt, /あそこに ねこ ＿＿ います。/);
  assert.deepEqual(plain(question('g-arimasu', 'g-arimasu/question/jabiko-ga').options), ['が', 'を', 'へ', 'と']);
});

test('reviewed number readings stay fixed: 4 and 9 on the clock, four people, 300 yen', () => {
  const answer = id => { const q = Content.grammar.flatMap(lesson => lesson.questions).find(item => item.id === id); return q.options[q.answer]; };
  assert.equal(answer('g-clock/question/four'), 'よじ');
  assert.equal(answer('g-clock/question/nine'), 'くじ');
  assert.equal(answer('g-people/question/four'), 'よにん');
  assert.equal(answer('g-prices/question/sanbyaku'), 'さんびゃくえん');
  // はん after a time is spoken from katakana so a device voice cannot read it as the particle は.
  for (const id of ['g-clock/card/han', 'g-clock/card/ask']) assert.match(Content.grammar.flatMap(lesson => lesson.steps).find(step => step.id === id).speech, /ハン/);
});
