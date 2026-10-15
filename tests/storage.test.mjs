import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('../dist/storage.js', import.meta.url),'utf8');
function setup(initial={}, options={}) {
  const map=new Map(Object.entries(initial)); let blocked=false;
  const storage={getItem:k=>map.get(k)??null,setItem(k,v){if(blocked) throw Error('quota'); map.set(k,v);}};
  const ctx=vm.createContext({console}); vm.runInContext(source+'\nglobalThis.api=DataStore;',ctx);
  const api=ctx.api;
  const config={storage, metadata:id=>id==='g-old'?{title:'Old course',legacyRevision:'old-revision'}:null,...options};
  return {api,map,store:api.create(config), config, block(){blocked=true;}, unblock(){blocked=false;}};
}
const legacyKey='sorachi:first-lesson:v1', key='sorachi:data:v2';
const old={step:4,completed:true,inProgress:true,answers:{4:true},firstAnswers:{4:false},study:{script:'k',courses:{}},history:[{courseId:'g-old',date:'2026-10-15T00:00:00Z',total:2,firstCorrect:1,retryQuestions:[1]}]};

test('legacy migration is repeatable, preserves source and separates progress from records',()=>{
 const raw=JSON.stringify(old); const b=setup({[legacyKey]:raw});
 assert.equal(b.map.get(legacyKey),raw);
 const snapshot=JSON.parse(b.map.get(key));
 assert.equal(snapshot.schemaVersion,2);
 assert.equal(snapshot.learning.intro.step,4);
 assert.equal(snapshot.learning.study.script,'k');
 assert.equal(snapshot.attempts[0].total,2);
 assert.equal(snapshot.attempts[0].courseRevision,'old-revision');
 assert.equal(snapshot.attempts[0].courseTitle,'Old course');
 assert.ok(snapshot.attempts[0].id);
 assert.deepEqual(snapshot.favorites,[]); assert.deepEqual(snapshot.preferences,{});
 const second=b.api.create(b.config);
 assert.equal(second.readProgress().history[0].id,snapshot.attempts[0].id);
 assert.equal(second.readSnapshot().owner.id,snapshot.owner.id);
});

test('history retains original denominators and retired courses instead of matching today’s bank',()=>{
 const b=setup();
 const entries=b.api.normalizeAttempts([
  {id:'old-1',courseId:'g-retired',courseTitle:'Retired',date:'2026-10-15',total:2,firstCorrect:2,retryQuestions:[]},
  {id:'new-1',courseId:'g-old',date:'2026-10-16',total:4,firstCorrect:3,retryQuestions:[2]},
  {courseId:'g-old',date:'2026-10-16',total:2,firstCorrect:3,retryQuestions:[]},
 ]);
 assert.equal(entries.length,2); assert.equal(entries[0].total,2); assert.equal(entries[1].total,4);
 assert.equal(entries[0].courseTitle,'Retired');
});

test('writing progress leaves favorites, preferences and guest identity intact',()=>{
 const b=setup();
 assert.equal(b.store.saveFavorites(['phrase-one','phrase-one','phrase-two']),true);
 assert.equal(b.store.savePreferences({ttsRate:0.8}),true);
 const owner=b.store.readSnapshot().owner.id;
 assert.equal(b.store.writeProgress(old),true);
 const data=b.store.readSnapshot();
 assert.equal(data.owner.id,owner);
 assert.deepEqual(JSON.parse(JSON.stringify(data.favorites)),['phrase-one','phrase-two']);
 assert.equal(data.preferences.ttsRate,0.8);
 assert.equal(b.store.readProgress().history[0].total,2);
});

test('migration storage failure retains legacy source and permits retry',()=>{
 const raw=JSON.stringify(old); const map=new Map([[legacyKey,raw]]); let blocked=true;
 const b=setup({}, {storage:{getItem:k=>map.get(k)??null,setItem(k,v){if(blocked)throw Error('quota');map.set(k,v);}}});
 assert.equal(map.has(key),false); assert.equal(map.get(legacyKey),raw);
 assert.equal(b.store.readProgress().step,4); assert.equal(b.store.canPersist(),false);
 blocked=false; assert.equal(b.store.writeProgress(b.store.readProgress()),true);
 assert.ok(map.has(key)); assert.equal(map.get(legacyKey),raw);
});

test('future or malformed primary data is never overwritten by the older app',()=>{
 for(const raw of ['broken-json',JSON.stringify({schemaVersion:99,important:'keep'})]) {
  const b=setup({[key]:raw,[legacyKey]:JSON.stringify(old)});
  assert.equal(b.store.writeProgress(old),false);
  assert.equal(b.map.get(key),raw);
  assert.equal(b.store.canPersist(),false);
 }
});

test('failed persistent writes do not replace the last committed snapshot',()=>{
 const b=setup(); assert.equal(b.store.writeProgress(old),true); const before=b.map.get(key);
 b.block(); assert.equal(b.store.writeProgress({...old,history:[]}),false);
 assert.equal(b.map.get(key),before); assert.equal(b.store.readSnapshot().attempts.length,1);
});

test('record merge deduplicates identities and keeps independent same-course attempts',()=>{
 const b=setup(); const a=b.api.makeAttempt(old.history[0]); const c=b.api.makeAttempt(old.history[0]);
 assert.notEqual(a.id,c.id);
 const merged=b.api.mergeAttempts([a],[a,c]); assert.equal(merged.length,2);
 assert.equal(b.api.mergeAttempts(merged,[a,c]).length,2);
});

test('portable snapshot round trip is validated and keeps new-origin guest progress',()=>{
 const a=setup(); a.store.writeProgress(old); a.store.saveFavorites(['phrase-one']);
 const portable=a.store.exportBackup();
 const b=setup();
 assert.equal(b.store.importBackup(portable),true);
 assert.equal(b.store.readProgress().history[0].total,2);
 assert.equal(b.store.readSnapshot().favorites[0],'phrase-one');
 const before=b.map.get(key);
 assert.equal(b.store.importBackup('{"schemaVersion":999}'),false);
 assert.equal(b.map.get(key),before);
});

test('unknown read failure cannot overwrite data after writes become available',()=>{
 const raw=JSON.stringify({schemaVersion:99,important:'keep'});
 const map=new Map([[key,raw]]); let readBlocked=true;
 const b=setup({}, {storage:{getItem(k){if(readBlocked) throw Error('denied');return map.get(k)??null;},setItem(k,v){map.set(k,v);}}});
 readBlocked=false;
 assert.equal(b.store.writeProgress(old),false); assert.equal(map.get(key),raw);
 assert.throws(()=>b.store.exportBackup(),/unavailable/i);
});

test('protected data is never presented as a successful empty backup',()=>{
 for(const raw of ['invalid',JSON.stringify({schemaVersion:99})]) {
  const b=setup({[key]:raw}); assert.throws(()=>b.store.exportBackup(),/unavailable/i);
 }
});

test('backup import refuses invalid records instead of silently losing them',()=>{
 const b=setup(); const incoming=JSON.parse(b.store.exportBackup());
 incoming.attempts=[{...old.history[0],firstCorrect:7}];
 const before=b.map.get(key);
 assert.equal(b.store.importBackup(JSON.stringify(incoming)),false);
 assert.equal(b.map.get(key),before);
});

test('backup import merges idempotently and preserves existing progress and records',()=>{
 const a=setup(); a.store.writeProgress(old); a.store.saveFavorites(['phrase-a']);
 const b=setup(); const own={...old,step:2,history:[{...old.history[0],id:'own',date:'2026-10-16'}]};
 b.store.writeProgress(own); b.store.saveFavorites(['phrase-b']);
 const owner=b.store.readSnapshot().owner.id;
 assert.equal(b.store.importBackup(a.store.exportBackup()),true);
 assert.equal(b.store.importBackup(a.store.exportBackup()),true);
 const progress=b.store.readProgress(); assert.equal(progress.step,2); assert.equal(progress.history.length,2);
 assert.equal(b.store.readSnapshot().owner.id,owner);
 assert.deepEqual([...b.store.readSnapshot().favorites].sort(),['phrase-a','phrase-b']);
});

test('legacy storage read failure is distinct from malformed JSON and locks writes',()=>{
 const map=new Map([[legacyKey,JSON.stringify(old)]]);
 const b=setup({}, {storage:{getItem(k){if(k===legacyKey)throw Error('denied');return null;},setItem(k,v){map.set(k,v);}}});
 assert.equal(b.store.writeProgress(old),false); assert.equal(map.has(key),false);
 assert.equal(map.get(legacyKey),JSON.stringify(old));
});

test('import into an unused browser restores the selected kana script',()=>{
 const a=setup(); a.store.writeProgress(old);
 const b=setup(); assert.equal(b.store.importBackup(a.store.exportBackup()),true);
 assert.equal(b.store.readProgress().study.script,'k');
});

test('every mutation rejects an outdated tab without replacing the newer raw data',()=>{
 const mutations=[
  (store,flat)=>store.writeProgress(flat),
  store=>store.saveFavorites(['stale-favorite']),
  store=>store.savePreferences({ttsRate:0.7}),
  (store,flat,backup)=>store.importBackup(backup),
 ];
 for(const mutate of mutations) {
  const b=setup(); const stale=b.api.create(b.config);
  const flat=stale.readProgress(), backup=stale.exportBackup();
  assert.equal(b.store.writeProgress(old),true);
  const newer=b.map.get(key);
  assert.equal(mutate(stale,flat,backup),false);
  assert.equal(stale.isConflict(),true); assert.equal(stale.canPersist(),false);
  assert.equal(b.map.get(key),newer);
  assert.equal(stale.savePreferences({ttsRate:0.9}),false);
  assert.equal(b.map.get(key),newer);
 }
});

test('a stale tab cannot resurrect history cleared by another tab',()=>{
 const b=setup(); b.store.writeProgress(old);
 const stale=b.api.create(b.config), oldFlat=stale.readProgress();
 const cleared=b.store.readProgress(); cleared.history=[];
 assert.equal(b.store.writeProgress(cleared),true);
 assert.equal(stale.writeProgress(oldFlat),false);
 assert.equal(JSON.parse(b.map.get(key)).attempts.length,0);
});

test('update checks lock deleted, replaced, and same-timestamp data until reload',()=>{
 for(const replacement of [null,JSON.stringify({schemaVersion:99}), 'same-time']) {
  const b=setup(); const original=b.map.get(key);
  if(replacement===null) b.map.delete(key);
  else if(replacement==='same-time') {
   const changed=JSON.parse(original); changed.favorites=['other-tab'];
   b.map.set(key,JSON.stringify(changed));
  } else b.map.set(key,replacement);
  assert.equal(b.store.checkForUpdates(),false);
  assert.equal(b.store.isConflict(),true); assert.equal(b.store.canPersist(),false);
  b.map.set(key,original);
  assert.equal(b.store.checkForUpdates(),false);
  assert.equal(b.store.writeProgress(old),false);
 }
});

test('own writes advance the raw baseline and quota failures remain retryable',()=>{
 const b=setup();
 assert.equal(b.api.KEY,key);
 assert.equal(b.store.checkForUpdates(),true);
 assert.equal(b.store.saveFavorites(['one']),true);
 assert.equal(b.store.checkForUpdates(),true);
 const before=b.map.get(key);
 b.block(); assert.equal(b.store.writeProgress(old),false);
 assert.equal(b.store.isConflict(),false); assert.equal(b.store.isProtected(),false);
 assert.equal(b.map.get(key),before);
 b.unblock(); assert.equal(b.store.writeProgress(old),true);
 assert.equal(b.store.checkForUpdates(),true); assert.equal(b.store.canPersist(),true);
});

test('an unreadable commit preflight protects data even if reads later recover',()=>{
 const map=new Map(); let failReads=false;
 const b=setup({}, {storage:{getItem(k){if(failReads)throw Error('read denied');return map.get(k)??null;},setItem(k,v){map.set(k,v);}}});
 const before=map.get(key); failReads=true;
 assert.equal(b.store.saveFavorites(['one']),false);
 assert.equal(b.store.isProtected(),true); assert.equal(b.store.canPersist(),false);
 failReads=false;
 assert.equal(b.store.writeProgress(old),false); assert.equal(map.get(key),before);
});

test('malformed attempts inside schema two protect the original primary bytes',()=>{
 const seed=setup(); const envelope=JSON.parse(seed.store.exportBackup());
 envelope.attempts=[{...old.history[0],firstCorrect:9}];
 const raw=JSON.stringify(envelope), b=setup({[key]:raw});
 assert.equal(b.store.isProtected(),true);
 assert.equal(b.store.savePreferences({ttsRate:0.8}),false);
 assert.equal(b.store.writeProgress(old),false);
 assert.equal(b.map.get(key),raw);
 assert.throws(()=>b.store.exportBackup(),/unavailable/i);
});

test('unknown course progress survives a filtered save while known course resets stay cleared',()=>{
 const seed=setup(); const envelope=JSON.parse(seed.store.exportBackup());
 envelope.learning.study={script:'h',courses:{
  'g-known':{active:{phase:'quiz'},attempts:1},
  'g-remove':{active:{phase:'quiz'},attempts:2},
  'future-course':{active:{futureFormat:99},earned:'keep'},
 }};
 const b=setup({[key]:JSON.stringify(envelope)}, {supportedCourseIds:['g-known','g-remove']});
 const flat=b.store.readProgress(); flat.study={script:'h',courses:{'g-known':{active:null,attempts:1}}};
 assert.equal(b.store.writeProgress(flat),true);
 const courses=JSON.parse(b.map.get(key)).learning.study.courses;
 assert.deepEqual(courses['future-course'],envelope.learning.study.courses['future-course']);
 assert.equal(courses['g-known'].active,null);
 assert.equal(Object.hasOwn(courses,'g-remove'),false);
});
