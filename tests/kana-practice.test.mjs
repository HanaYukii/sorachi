import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const context=vm.createContext({console});
for(const file of ['content','kana-practice']) vm.runInContext(readFileSync(new URL(`../dist/${file}.js`,import.meta.url),'utf8'),context);
const {P,C}=vm.runInContext('({P:KanaPractice,C:Content})',context);
const ids=id=>C.courses[id].questions.map(q=>q.id);
const clone=x=>JSON.parse(JSON.stringify(x));
function finishFirst(s,wrong=[],K=P) { while(s.round==='first'){const q=K.current(s);const correct=q.options.indexOf(q.id);K.answer(s,wrong.includes(q.id)?(correct+1)%q.options.length:correct);K.next(s);} }
// Sweeps run in their own context with Math.random swapped for mulberry32, so a failing seed replays exactly.
// Production code still uses Math.random.
const SEEDS=[1,2,3,0x5eed,20261016];
const seededContext=vm.createContext({console});
for(const file of ['content','kana-practice']) vm.runInContext(readFileSync(new URL(`../dist/${file}.js`,import.meta.url),'utf8'),seededContext);
function seeded(seed) {
 vm.runInContext(`{let a=${seed}|0;Math.random=()=>{a=(a+0x6d2b79f5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}`,seededContext);
 return vm.runInContext('({P:KanaPractice,random:Math.random})',seededContext);
}

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

test('review selection is bounded, prioritizes wrong then oldest learned, and migrates safe history only',()=>{
 const all=ids('h-a');const review={}; const history=[{date:'2026-01-01T00:00:00Z',courseId:'h-a',questionIds:all,retryQuestions:[2],total:5}];
 P.seedReview(review,history,null);assert.equal(review[all[1]].wrong,true);assert.equal(P.selectReview(review,{},5)[0],all[1]);
 review[all[1]]={lastSeen:'2026-02-01T00:00:00.000Z',wrong:false};P.seedReview(review,history,null);assert.equal(review[all[1]].wrong,false);
 assert.equal(P.selectReview(review,{},5).length,5);assert.equal(P.selectReview({}, {'h-ka':{completedAt:'2025-01-01T00:00:00Z'}},5).length,5);
 const empty={};P.seedReview(empty,[{...history[0],questionIds:undefined}],null);assert.equal(Object.keys(empty).length,0);P.seedReview(empty,history,'2026-01-02T00:00:00Z');assert.equal(Object.keys(empty).length,0);
 assert.equal(Object.keys(P.sanitizeReview({...review,unknown:{lastSeen:'bad',wrong:true}})).length,5);
});

test('repeated misses rotate so every missed character returns within two short rounds',()=>{
 const row=[...ids('h-a'),...ids('h-ka').slice(0,2)];
 const review=Object.fromEntries(row.map((id,i)=>[id,{lastSeen:`2026-10-0${i+1}T00:00:00.000Z`,wrong:true}]));
 const seen=new Set();
 for(let round=0;round<2;round++){
  const chosen=P.selectReview(review,{});
  assert.equal(chosen.length,5);
  chosen.forEach((id,i)=>{seen.add(id);review[id]={lastSeen:`2026-11-0${round+1}T00:00:0${i}.000Z`,wrong:true};});
 }
 assert.equal(seen.size,row.length);
});

test('looser look-alikes from a learned row fill the cross-row slot (き meets ち)',()=>{
 for(let run=0;run<40;run++){
  const s=P.create(ids('h-ka'),{completedIds:['h-ta']});
  const ki=[...s.questions].find(q=>P.entry(q.id).character==='き');
  assert.ok(ki.options.some(id=>P.entry(id).character==='ち'));
 }
});

test('Jabiko look-alikes always meet: ま with も in their row, ク with フ or ワ from a learned row',()=>{
 for(const seed of SEEDS){
  const {P}=seeded(seed);
  const meets=(course,learned,target,partner)=>{
   for(let run=0;run<8;run++){
    const q=P.create(ids(course),{completedIds:learned}).questions.find(q=>P.entry(q.id).character===target);
    assert.ok(q.options.some(id=>P.entry(id).character===partner),`seed ${seed}, run ${run}: ${target} should meet ${partner}`);
   }
  };
  meets('h-ma',[],'ま','も');meets('h-ma',[],'も','ま');
  meets('k-ka',['k-ha'],'ク','フ');meets('k-ha',['k-ka'],'フ','ク');
  meets('k-ka',['k-wa'],'ク','ワ');meets('k-wa',['k-ka'],'ワ','ク');
  // A common confusion: ク outranks the looser ウ for フ's one cross-row slot.
  meets('k-ha',['k-a','k-ka'],'フ','ク');
 }
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

test('options keep two same-row peers so the row label cannot reveal the answer',()=>{
 const rows=['a','ka','sa','ta','na','ha','ma','ya','ra','wa'];
 const check=(q,label)=>{
  const row=P.entry(q.id).courseId,same=q.options.filter(id=>P.entry(id).courseId===row).length;
  assert.ok(same>=3,`${label} ${P.entry(q.id).character}: only ${same} same-row options`);
  assert.ok(q.options.length-same<=1,`${label} ${P.entry(q.id).character}: more than one cross-row option`);
 };
 for(const script of ['h','k'])for(let r=1;r<rows.length;r++){
  const id=`${script}-${rows[r]}`,completed=rows.slice(0,r).map(row=>`${script}-${row}`);
  for(let run=0;run<20;run++){
   const s=P.create(ids(id),{completedIds:completed});
   s.questions.forEach(q=>check(q,id));
   finishFirst(s,s.questions.map(q=>q.id));
   s.retryQuestions.forEach(q=>check(q,`${id} retry`));
  }
 }
 for(let run=0;run<20;run++){
  const s=P.create([...ids('h-ka').slice(0,2),...ids('h-a').slice(0,3)],{completedIds:['h-a','h-ka','h-sa'],mode:'review'});
  s.questions.forEach(q=>check(q,'review'));
 }
});

test('voiced rows contrast with their learned base row and long review pools still reload',()=>{
 for(let run=0;run<30;run++){
  const s=P.create(ids('h-ga'),{completedIds:['h-ka']});
  for(const q of s.questions){
   const base=P.entry(q.id).character.normalize('NFD')[0];
   assert.ok(q.options.some(id=>P.entry(id).character===base),`${P.entry(q.id).character} should meet ${base}`);
  }
  const d=P.create(ids('h-da'),{completedIds:['h-za']});
  for(const q of d.questions) assert.equal(new Set(q.options.map(id=>P.entry(id).reading)).size,q.options.length);
 }
 const all=Object.values(C.courses).filter(c=>c.type==='kana').map(c=>c.id);
 const s=P.create(ids('h-pa'),{completedIds:all,mode:'review'});
 assert.ok(s.pool.length>92);
 assert.ok(P.sanitize(clone(s)));
});

test('every kana course with any learned rows yields legal options over fixed seeds: one answer, distinct readings, same script, 2–5 choices, two same-row peers',()=>{
 const kana=Object.values(C.courses).filter(c=>c.type==='kana');
 for(const seed of SEEDS){
  const {P,random}=seeded(seed);
  for(const course of kana){
   const sameScript=kana.filter(c=>c.script===course.script&&c.id!==course.id).map(c=>c.id);
   for(let run=0;run<6;run++){
    const learned=sameScript.filter(()=>random()<0.4), at=`seed ${seed}, ${course.id}, run ${run}`;
    const s=P.create(ids(course.id),{completedIds:learned});
    finishFirst(s,ids(course.id),P);
    for(const q of [...s.questions,...s.retryQuestions]){
     assert.ok(q.options.length>=2&&q.options.length<=5,at);
     assert.equal(q.options.filter(id=>id===q.id).length,1,at);
     assert.equal(new Set(q.options).size,q.options.length,at);
     assert.equal(new Set(q.options.map(id=>P.entry(id).reading)).size,q.options.length,at);
     assert.ok(q.options.every(id=>P.entry(id).script===course.script),at);
     assert.ok(q.options.every(id=>[course.id,...learned].includes(P.entry(id).courseId)),at);
     const same=q.options.filter(id=>P.entry(id).courseId===course.id).length;
     assert.ok(same>=3&&q.options.length-same<=1,`${at}: ${same} same-row options of ${q.options.length}`);
    }
   }
  }
 }
 const replay=()=>JSON.stringify(seeded(SEEDS[0]).P.create(ids('h-sa'),{completedIds:['h-a','h-ka','h-ta']}));
 assert.equal(replay(),replay(),'The same seed gives the same round');
});

test('や and わ rows with no other learned row: every first and retry question offers exactly the three kana of the row',()=>{
 for(const seed of SEEDS){
  const {P}=seeded(seed);
  for(const course of ['h-ya','k-ya','h-wa','k-wa']) for(let run=0;run<5;run++){
   const s=P.create(ids(course),{completedIds:[]});
   finishFirst(s,ids(course),P);
   assert.equal(s.retryQuestions.length,3);
   for(const q of [...s.questions,...s.retryQuestions]){
    assert.deepEqual([...q.options].sort(),[...ids(course)].sort(),`seed ${seed}, ${course}`);
    assert.equal(new Set(q.options.map(id=>P.entry(id).reading)).size,3);
   }
  }
 }
});

// Port of Jabiko kanaDrill.test.ts "NEVER offer a same-romaji distractor" (#37), with the pairs named.
test('same-reading pairs never appear as answer and distractor in one question: お／を、オ／ヲ、じ／ぢ、ず／づ、ジ／ヂ、ズ／ヅ',()=>{
 const pairs=[['お','を'],['オ','ヲ'],['じ','ぢ'],['ず','づ'],['ジ','ヂ'],['ズ','ヅ']];
 for(const seed of SEEDS){
  const {P}=seeded(seed);
  for(const [x,y] of pairs){
   const a=P.entries.find(item=>item.character===x),b=P.entries.find(item=>item.character===y);
   assert.equal(a.reading,b.reading,`${x} and ${y} share one reading`);
   // Each target meets the other's row: in its own course, and both together in a review.
   for(let run=0;run<10;run++) for(const s of [P.create(ids(a.courseId),{completedIds:[b.courseId]}),P.create(ids(b.courseId),{completedIds:[a.courseId]}),P.create([a.id,b.id],{mode:'review'})]){
    finishFirst(s,s.questions.map(q=>q.id),P);
    for(const q of [...s.questions,...s.retryQuestions]){
     const shown=q.options.map(id=>P.entry(id).character);
     assert.ok(!(shown.includes(x)&&shown.includes(y)),`seed ${seed}: ${x} and ${y} offered together for ${P.entry(q.id).character}`);
    }
   }
  }
 }
});

test('a learned contracted sound does not crowd out a single kana classic look-alike (き still meets さ)',()=>{
 for(let run=0;run<30;run++){
  const s=P.create(ids('h-ka'),{completedIds:['h-sa','h-kya']});
  const ki=s.questions.find(q=>P.entry(q.id).character==='き');
  assert.ok(ki.options.some(id=>P.entry(id).character==='さ'));
 }
 for(let run=0;run<30;run++){
  const s=P.create(ids('h-kya'),{completedIds:['h-ka']});
  for(const q of s.questions) assert.ok(q.options.some(id=>P.entry(id).character==='き'),'A contracted sound still meets its base');
 }
});
