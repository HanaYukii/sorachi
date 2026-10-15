import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import vm from 'node:vm';

const contentSource=readFileSync(new URL('../dist/content.js',import.meta.url),'utf8');
const diagnosticsPath=new URL('../dist/diagnostics.js',import.meta.url);
const diagnosticsSource=existsSync(diagnosticsPath)?readFileSync(diagnosticsPath,'utf8'):'';
const scripts=[{src:'https://example.test/sorachi/content.js?v=0123456789'},{src:'./app.js?v=abcdef0123'}];
function setup(source=contentSource) {
 const document={scripts};
 const context=vm.createContext({document});
 vm.runInContext(source+'\n'+diagnosticsSource+'\nglobalThis.api={Content,Diagnostics:typeof Diagnostics==="undefined"?null:Diagnostics};',context);
 return context.api;
}
function active(Content,id,overrides={}) {
 const course=Content.getCourse(id), n=course.questions.length;
 return {courseRevision:Content.courseRevision(id),questionIds:course.questions.map(q=>q.id),phase:'quiz',cursor:0,order:Array.from({length:n},(_,i)=>n-i-1),direction:'character',...overrides};
}
const flat=(id,attempt)=>({study:{courses:{[id]:{active:attempt}}}});
const plain=value=>JSON.parse(JSON.stringify(value));

test('versions come from the loaded script tags without exposing their URLs or query secrets',()=>{
 const {Diagnostics}=setup();
 const result=Diagnostics.capture({hash:'#home',scripts:[
  {src:'https://example.test/private/content.js?v=0123456789&token=secret-query'},
  {src:'./app.js?v=ABCDEF0123#secret-fragment'},
  {src:'./study.js?v=ffffffffff'},
 ]});
 assert.deepEqual(plain(result),{contentVersion:'0123456789',appVersion:'abcdef0123'});
 assert.deepEqual(plain(Diagnostics.capture({hash:'#home'})),{contentVersion:'0123456789',appVersion:'abcdef0123'});
 assert.doesNotMatch(Diagnostics.format(result),/https|private|token|secret|study\.js/);
});

test('quiz diagnostics resolve the shuffled question index and whitelist kana direction',()=>{
 const {Content,Diagnostics}=setup(), id='h-a';
 const attempt=active(Content,id,{order:[3,0,4,1,2],cursor:1,direction:'reading'});
 const progress=flat(id,attempt), before=JSON.stringify(progress);
 const result=Diagnostics.capture({hash:'#study/h-a',progress,scripts});
 assert.equal(result.courseId,id); assert.equal(result.courseRevision,Content.courseRevision(id));
 assert.equal(result.questionId,Content.getCourse(id).questions[0].id);
 assert.equal(result.direction,'reading'); assert.equal(result.cardId,undefined);
 assert.equal(JSON.stringify(progress),before); assert.equal(Object.isFrozen(result),true);
 assert.match(Diagnostics.format(result),/direction: reading/);
});

test('grammar questions and explicit draft cards use trusted content IDs',()=>{
 const {Content,Diagnostics}=setup(), id='g-identity';
 const progress=flat(id,active(Content,id));
 const quiz=Diagnostics.capture({hash:`#study/${id}`,progress});
 assert.equal(quiz.questionId,Content.getCourse(id).questions[1].id);
 assert.equal(quiz.direction,undefined);
 const draft=active(Content,id,{phase:'cards',cursor:0});
 const card=Diagnostics.capture({hash:`#study/${id}`,progress,attempt:draft});
 assert.equal(card.cardId,Content.getCourse(id).steps[0].id);
 assert.equal(card.questionId,undefined);
 const kana=Diagnostics.capture({hash:'#study/h-a',attempt:active(Content,'h-a',{phase:'cards',cursor:2})});
 assert.equal(kana.cardId,Content.getCourse('h-a').cards[2].id);
});

test('intro cards and both questions use the intro step mapping, while completion has no question',()=>{
 const {Content,Diagnostics}=setup(), revision=Content.courseRevision('intro');
 for(const step of [0,2,4,5]) {
  const result=Diagnostics.capture({hash:'#lesson',progress:{step,contentRevision:revision}});
  assert.equal(result.courseId,'intro'); assert.equal(result.courseRevision,revision);
  assert.equal(result.cardId,step<4?Content.intro.lessons[step].id:undefined);
  assert.equal(result.questionId,step>=4?Content.intro.questions[step].id:undefined);
 }
 const done=Diagnostics.capture({hash:'#done',progress:{step:5,contentRevision:revision}});
 assert.equal(done.courseId,'intro'); assert.equal(done.questionId,undefined);
});

test('phrasebook reports only a known category, never a guessed card or course question',()=>{
 const {Diagnostics}=setup();
 const result=Diagnostics.capture({hash:'#travel/t-order',progress:{step:5}});
 assert.equal(result.categoryId,'t-order');
 for(const key of ['courseId','questionId','cardId','direction']) assert.equal(result[key],undefined);
 assert.equal(Diagnostics.capture({hash:'#travel/hotel'}).categoryId,'hotel');
 assert.equal(Diagnostics.capture({hash:'#travel/unknown-secret'}).categoryId,undefined);
});

test('incompatible revisions and changed question mappings never report a misleading question',()=>{
 const {Content,Diagnostics}=setup(), id='g-identity';
 for(const attempt of [
  active(Content,id,{courseRevision:'c1-0000000000000000'}),
  active(Content,id,{questionIds:[...Content.getCourse(id).questions.map(q=>q.id)].reverse()}),
  active(Content,id,{order:[0,0]}),
  active(Content,id,{cursor:99}),
 ]) {
  const result=Diagnostics.capture({hash:`#study/${id}`,progress:flat(id,attempt)});
  assert.equal(result.courseRevision,Content.courseRevision(id));
  assert.equal(result.questionId,undefined);
 }
 const old=active(Content,id);
 const oldId=Content.getCourse(id).questions[1].id;
 const next=setup(contentSource.replaceAll(oldId,oldId+'-revised'));
 const changed=next.Diagnostics.capture({hash:`#study/${id}`,attempt:old});
 assert.equal(changed.questionId,undefined);
 const fresh=next.Diagnostics.capture({hash:`#study/${id}`,attempt:active(next.Content,id)});
 assert.equal(fresh.questionId,next.Content.getCourse(id).questions[1].id);
});

test('legacy attempts map only when the frozen legacy revision still matches loaded content',()=>{
 const {Content,Diagnostics}=setup();
 const id=Object.keys(Content.courses).find(id=>Content.legacyCourseRevision[id]===Content.courseRevision(id));
 assert.ok(id);
 const legacy=active(Content,id); delete legacy.courseRevision; delete legacy.questionIds;
 assert.equal(Diagnostics.capture({hash:`#study/${id}`,attempt:legacy}).questionId,Content.getCourse(id).questions.at(-1).id);
 const changed=Object.keys(Content.courses).find(id=>Content.legacyCourseRevision[id]!==Content.courseRevision(id));
 assert.ok(changed);
 const incompatible=active(Content,changed); delete incompatible.courseRevision; delete incompatible.questionIds;
 assert.equal(Diagnostics.capture({hash:`#study/${changed}`,attempt:incompatible}).questionId,undefined);
});

test('no active attempt is created or inferred for unknown routes, unopened courses or done pages',()=>{
 const {Content,Diagnostics}=setup(), progress={study:{courses:{}}};
 const before=JSON.stringify(progress);
 const result=Diagnostics.capture({hash:'#study/h-a',progress});
 assert.equal(result.courseId,'h-a'); assert.equal(result.questionId,undefined); assert.equal(result.cardId,undefined);
 assert.equal(JSON.stringify(progress),before);
 assert.equal(Diagnostics.capture({hash:'#study/h-a',attempt:active(Content,'h-a',{phase:'done'})}).questionId,undefined);
 for(const hash of ['#study/__proto__','#study/constructor','#study/h-a?token=secret','#feedback','#history']) {
  assert.deepEqual(plain(Diagnostics.capture({hash,progress})),{contentVersion:'0123456789',appVersion:'abcdef0123'});
 }
});

test('capture and formatting never serialize identities, scores, history or injected storage strings',()=>{
 const {Content,Diagnostics}=setup();
 const progress=flat('h-a',active(Content,'h-a',{questionIds:['secret-question'],courseRevision:'secret-revision',direction:'secret-direction'}));
 Object.defineProperty(progress,'history',{get(){throw Error('Must not read private history');}});
 progress.owner={id:'guest-secret'}; progress.firstCorrect=500; progress.token='secret-token';
 const result=Diagnostics.capture({hash:'#study/h-a',progress});
 assert.equal(result.questionId,undefined);
 const formatted=Diagnostics.format({...result,owner:progress.owner,history:['secret-history'],score:500,url:'https://secret-url',courseRevision:'secret-revision',questionId:'secret-question',cardId:'secret-card',direction:'secret-direction'});
 assert.doesNotMatch(formatted,/secret|guest|owner|history|score|500|url|UA|viewport/i);
 assert.ok(formatted.length<400);
});

test('malformed or ambiguous version tokens and overlong inputs are omitted instead of echoed',()=>{
 const {Diagnostics}=setup();
 const result=Diagnostics.capture({hash:'#'+ 'secret'.repeat(500),scripts:[
  './content.js?v=0123456789&v=abcdef0123',
  './app.js?v=abcdef0123secret',
  './content.js?v='+ 'a'.repeat(5000),
 ]});
 assert.deepEqual(plain(result),{});
 assert.equal(Diagnostics.format({contentVersion:'secret',appVersion:'a'.repeat(5000),courseId:'__proto__',categoryId:'unknown'}),'');
});

test('mixed review reports the actual source question and round without learner data',()=>{
 const {Content,Diagnostics}=setup();
 const question=Content.getCourse('k-sa').questions[1];
 const practice={courseId:'k-sa',questionId:question.id,direction:'reading',round:'retry',practiceVersion:1,wrong:true,lastSeen:'private-date',guest:'private-owner'};
 const result=Diagnostics.capture({hash:'#kana-review',practice});
 assert.equal(result.questionId,question.id);
 assert.equal(result.courseRevision,Content.courseRevision('k-sa'));
 assert.equal(result.direction,'reading'); assert.equal(result.round,'retry');
 const formatted=Diagnostics.format(result);
 assert.match(formatted,/practiceVersion: 1/); assert.match(formatted,/round: retry/);
 assert.doesNotMatch(JSON.stringify(result)+formatted,/private|lastSeen|wrong|guest/);
 for(const invalid of [{...practice,practiceVersion:99},{...practice,questionId:'h-a/question/u3042'},{...practice,round:'secret'}]) {
  assert.equal(Diagnostics.capture({hash:'#kana-review',practice:invalid}).questionId,undefined);
 }
 assert.equal(Diagnostics.capture({hash:'#study/h-a',practice}).questionId,undefined);
 assert.equal(Diagnostics.capture({hash:'#travel/t-pay',practice}).questionId,undefined);
});


test('practice and hint asset hashes identify their exact loaded releases without leaking source paths',()=>{
 const {Diagnostics}=setup();
 const snapshot=Diagnostics.capture({scripts:['https://host.test/private/kana-practice.js?v=123456789a&secret=hidden','./kana-hints.js?v=abc4567890']});
 assert.equal(snapshot.practiceAssetVersion,'123456789a');
 assert.equal(snapshot.hintsVersion,'abc4567890');
 assert.match(Diagnostics.format(snapshot),/kana-practice\.js: 123456789a/);
 assert.doesNotMatch(Diagnostics.format(snapshot),/private|hidden|host|secret/);
});
