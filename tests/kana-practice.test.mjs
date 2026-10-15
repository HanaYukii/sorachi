import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const context=vm.createContext({console});
for(const file of ['content','kana-practice']) vm.runInContext(readFileSync(new URL(`../dist/${file}.js`,import.meta.url),'utf8'),context);
const {P,C}=vm.runInContext('({P:KanaPractice,C:Content})',context);
const ids=id=>C.courses[id].questions.map(q=>q.id);
const clone=x=>JSON.parse(JSON.stringify(x));
function finishFirst(s,wrong=[]) { while(s.round==='first'){const q=P.current(s);const correct=q.options.indexOf(q.id);P.answer(s,wrong.includes(q.id)?(correct+1)%q.options.length:correct);P.next(s);} }

test('each round mixes directions with bounded cross-row options and no duplicate readings',()=>{
 for(let run=0;run<30;run++){
  const s=P.create(ids('k-sa'),{completedIds:['k-ta','k-wa']});
  assert.equal(new Set(s.questions.map(q=>q.direction)).size,2);
  for(const q of s.questions){assert.ok(q.options.length<=5);assert.ok(q.options.length>=3);assert.equal(new Set(q.options.map(id=>P.entry(id).reading)).size,q.options.length);assert.ok(q.options.includes(q.id));assert.ok(q.options.some(id=>P.entry(id).courseId!=='k-sa'));}
  const shi=s.questions.find(q=>P.entry(q.id).character==='シ');assert.ok(shi.options.some(id=>P.entry(id).character==='ツ'));
  const so=s.questions.find(q=>P.entry(q.id).character==='ソ');assert.ok(so.options.some(id=>P.entry(id).character==='ン'));
 }
 const s=P.create(ids('h-wa'),{completedIds:['h-a']});
 for(const q of s.questions) assert.ok(!(q.options.some(id=>P.entry(id).character==='お')&&q.options.some(id=>P.entry(id).character==='を')));
});

test('wrong first answers advance once, return only after the first round and never rewrite score',()=>{
 const s=P.create(ids('h-a')); const missed=s.questions[0].id;const q=P.current(s),right=q.options.indexOf(q.id);
 assert.equal(P.next(s),false); assert.equal(P.answer(s,99),null); assert.equal(P.answer(s,(right+1)%q.options.length).correct,false);assert.equal(P.answer(s,right),null); assert.equal(P.next(s),true);assert.equal(s.round,'first');
 finishFirst(s);assert.equal(s.round,'retry');assert.equal(P.current(s).id,missed);assert.equal(P.firstCorrect(s),4);
 const retry=P.current(s);P.answer(s,retry.options.indexOf(retry.id));P.next(s);assert.equal(s.round,'done');assert.equal(P.firstCorrect(s),4);assert.equal(P.next(s),false);
});

test('reload validates all answers, unique options, revisions and prevents skipped retry work',()=>{
 const s=P.create(ids('h-a'));finishFirst(s,[s.questions[0].id]);
 assert.deepEqual(clone(P.sanitize(clone(s))),clone(s));
 for(const mutate of [x=>x.cursor=99,x=>x.answers[0]=99,x=>x.questions[0].options[1]=x.questions[0].options[0],x=>x.revisions['h-a']='changed',x=>x.round='done',x=>x.retryQuestions=[]]){
  const bad=clone(s);mutate(bad);assert.equal(P.sanitize(bad),null);
 }
 const retry=P.current(s);P.answer(s,(retry.options.indexOf(retry.id)+1)%retry.options.length);P.next(s);assert.equal(s.round,'done');assert.ok(P.sanitize(clone(s)));
});

test('review selection is bounded, prioritizes recent wrong then oldest learned, and migrates safe history only',()=>{
 const all=ids('h-a');const review={}; const history=[{date:'2026-01-01T00:00:00Z',courseId:'h-a',questionIds:all,retryQuestions:[2],total:5}];
 P.seedReview(review,history,null);assert.equal(review[all[1]].wrong,true);assert.equal(P.selectReview(review,{},5)[0],all[1]);
 review[all[1]]={lastSeen:'2026-02-01T00:00:00.000Z',wrong:false};P.seedReview(review,history,null);assert.equal(review[all[1]].wrong,false);
 assert.equal(P.selectReview(review,{},5).length,5);assert.equal(P.selectReview({}, {'h-ka':{completedAt:'2025-01-01T00:00:00Z'}},5).length,5);
 const empty={};P.seedReview(empty,[{...history[0],questionIds:undefined}],null);assert.equal(Object.keys(empty).length,0);P.seedReview(empty,history,'2026-01-02T00:00:00Z');assert.equal(Object.keys(empty).length,0);
 assert.equal(Object.keys(P.sanitizeReview({...review,unknown:{lastSeen:'bad',wrong:true}})).length,5);
});

test('short review presents the selected recent mistake before older successful characters',()=>{
 const row=ids('h-a');
 const review=Object.fromEntries(row.map((id,i)=>[id,{lastSeen:`2026-10-1${i+1}T00:00:00.000Z`,wrong:i===3}]));
 const selected=P.selectReview(review,{});
 for(let i=0;i<10;i++){
  const session=P.create(selected,{mode:'review'});
  assert.equal(session.questions[0].id,row[3]);
  assert.deepEqual(clone(session.questions.map(q=>q.id)),clone(selected));
 }
});
