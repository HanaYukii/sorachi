import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
const context=vm.createContext({});
for(const file of ['content','drill-bank','drill','storage']) vm.runInContext(readFileSync(new URL(`../dist/${file}.js`,import.meta.url),'utf8'),context);
const {D,B,C,S}=vm.runInContext('({D:Drill,B:DrillBank,C:Content,S:DataStore})',context);
const clone=v=>JSON.parse(JSON.stringify(v));
const pool=D.pool(C.grammar,B.questions);
const sample=pool.slice(0,5);
const current=d=>d.session.items[0];
const answer=(d,entries=sample)=>D.act(d,entries,'answer',entries.find(e=>e.id===current(d).id).question.answer);
const store=()=>{const map=new Map();const storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};return {map,storage,create:()=>S.create({storage})};};

test('drill uses stable IDs and revision per question; 50 additions do not mutate course question banks',()=>{
 assert.equal(pool.length,200);assert.equal(B.questions.length,50);assert.equal(C.grammar.flatMap(c=>c.questions).length,150);
 assert.deepEqual(clone(B.validate(C)),[]);assert.equal(new Set(pool.map(q=>q.id)).size,pool.length);
 assert.equal(B.questions.filter(q=>q.source.kind==='jabiko-adapted').length,6);
 const reversed=D.pool([...C.grammar].reverse(),[...B.questions].reverse());
 for(const q of pool)assert.equal(reversed.find(x=>x.id===q.id).revision,q.revision);
 for(const q of B.questions){assert.ok(q.explanation.length>20);assert.equal(q.readings.length,q.options.length);for(let i=0;i<q.options.length;i++)if(/[ぁ-ヿ]/u.test(q.options[i]))assert.ok(q.readings[i]);}
});

test('a pass survives reordering/additions/reload and takes new questions only in the following pass',()=>{
 let data=D.start(D.blank(),sample,()=>0.5), before=clone(data), expanded=[...sample,pool[5]].reverse();
 assert.deepEqual(clone(D.restore(data,expanded)),before);
 const seen=[];
 for(let i=0;i<sample.length;i++) {seen.push(current(data).id);data=D.act(answer(data,expanded),expanded,'next');}
 assert.deepEqual(seen.sort(),clone(sample.map(x=>x.id)).sort());
 const second=[];
 for(let i=0;i<expanded.length;i++){second.push(current(data).id);data=D.act(answer(data,expanded),expanded,'next');}
 assert.deepEqual(second.sort(),expanded.map(x=>x.id).sort());
});

test('deleting or changing remaining content restarts safely; changed reading also changes revision',()=>{
 const initial=D.start(D.blank(),sample), data=answer(initial);
 const changed=clone(sample);changed.find(q=>q.id===current(data).id).revision+='new';
 for(const entries of [changed,sample.filter(q=>q.id!==current(data).id)]) {
  const restored=D.restore(data,entries);assert.ok(restored.session.restarted);assert.equal(restored.session.answered,0);assert.equal(D.inspect(restored),null);
 }
 const q=clone(B.questions[0]), old=D.pool([], [q])[0].revision;q.promptReading='changed';
 assert.notEqual(D.pool([], [q])[0].revision,old);
 assert.equal(data.session.answered,1,'Pure transitions never mutate input');
});

test('first answer counts once, stop/continue does not skip unanswered questions, storage is bounded',()=>{
 let data=D.start(D.blank(),sample), first=current(data).id;
 data=D.act(data,sample,'stop');assert.equal(D.act(data,sample,'next'),null);
 data=D.act(data,sample,'continue');assert.equal(current(data).id,first);
 for(let i=0;i<100;i++) {
  const previous=current(data).id;
  const correct=sample.find(e=>e.id===previous).question.answer;
  data=D.act(data,sample,'answer',(correct+1)%3);
  assert.equal(D.act(data,sample,'answer',correct),null);
  data=D.act(data,sample,'next');assert.notEqual(current(data).id,previous);
  assert.equal(D.inspect(data),null);assert.ok(data.session.deck.length<sample.length);assert.equal(data.session.items.length,1);
 }
 assert.equal(data.session.answered,100);assert.equal(data.session.correct,0);
});

test('malformed and future drill snapshots protect the full envelope and reject backup imports',()=>{
 const base=store(), s=base.create(), p=s.readProgress();p.study.drill=D.start(D.blank(),sample);assert.ok(s.writeProgress(p));
 const original=JSON.parse(base.map.get(S.KEY));
 const variants=[null,{version:2}, {...clone(p.study.drill),session:{}},clone(p.study.drill),clone(p.study.drill),clone(p.study.drill)];
 variants[3].session.items[0].options=[0,0,1];variants[4].session.answers=[999];variants[5].session.updatedAt='+275760-09-13T00:00:00.000Z';
 for(const drill of variants) {
  const raw=JSON.stringify({...original,learning:{...original.learning,study:{...original.learning.study,drill}}});
  base.map.set(S.KEY,raw);const locked=base.create();
  assert.ok(locked.isProtected());assert.equal(locked.lockReason(),drill?.version===2?'newer':'invalid');
  assert.equal(locked.writeProgress({study:{}}),false);assert.equal(base.map.get(S.KEY),raw);assert.equal(locked.rawData(),raw);
  assert.equal(store().create().importBackupDetailed(raw).ok,false);
 }
});

test('backup merge keeps the newer whole session and clearing wins in both directions, including reload',()=>{
 const env=store(), local=env.create(), p=local.readProgress();p.study.drill=answer(D.start(D.blank(),sample));local.writeProgress(p);
 const old=local.exportBackup();const cleared=D.clear(p.study.drill);p.study.drill=cleared;local.writeProgress(p);const clearedBackup=local.exportBackup();
 assert.ok(local.importBackup(old));assert.equal(env.create().readProgress().study.drill.session,null);
 const other=store(), s=other.create();s.importBackup(old);s.importBackup(clearedBackup);assert.equal(other.create().readProgress().study.drill.session,null);
 // A new round after clearing survives older imports; never sum the same answers twice.
 const fresh=s.readProgress();fresh.study.drill=answer(D.start(fresh.study.drill,sample));s.writeProgress(fresh);s.importBackup(old);s.importBackup(s.exportBackup());
 assert.equal(other.create().readProgress().study.drill.session.answered,1);
 assert.ok(other.create().readProgress().study.drill.session.startedAt>cleared.clearedAt);
});


test('the 200-question release preserves all 168 previous question revisions and an in-progress pass',()=>{
 const original=pool.filter(q=>q.question.source?.batch!=='2026-10-17-200');
 const added=pool.filter(q=>q.question.source?.batch==='2026-10-17-200');
 assert.equal(original.length,168);assert.equal(added.length,32);
 assert.equal(createHash('sha256').update(JSON.stringify(original.map(q=>[q.id,q.revision]))).digest('hex'),'f25e0e5a51ff7d00f0ecedf715f940e372c5eba54a780f1e350ac073b6b5688c');
 let data=answer(D.start(D.blank(),original),original);
 assert.deepEqual(clone(D.restore(data,pool)),clone(data));
 for(let i=0;i<original.length;i++) {
  assert.ok(!added.some(q=>q.id===current(data).id));
  if(!data.session.answers.length)data=answer(data,pool);
  data=D.act(data,pool,'next');
 }
 const nextPass=[current(data).id,...data.session.deck.map(q=>q.id)];
 assert.equal(new Set(nextPass).size,200);
 for(const q of added)assert.ok(nextPass.includes(q.id));
});
