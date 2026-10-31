import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';
const ctx=vm.createContext({});for(const f of ['content','routes','kana-hints','suitcase'])vm.runInContext(readFileSync(new URL(`../dist/${f}.js`,import.meta.url),'utf8'),ctx);
const {S,H}=vm.runInContext('({S:Suitcase,H:KanaHints})',ctx);const clone=x=>JSON.parse(JSON.stringify(x));
test('all suitcase words have matching taught examples and every packed requirement is used',()=>{
 for(const x of S.items){const hint=H.get(x.source).find(h=>h.word===x.jp);assert.ok(hint,x.jp);assert.equal(hint.romaji,x.romaji);assert.equal(hint.meaning,x.zh);}
 assert.deepEqual([...S.scenes.map(x=>x.need)].sort(),[...S.required].sort());
});
test('pack, remove, departure and all scene actions preserve the same inventory',()=>{
 const s=S.create();assert.equal(S.act(s,'next'),null);assert.match(S.act(s,'depart'),/清單還需要/);
 for(const id of ['phone','water','hat']){S.act(s,'toggle',id);}
 assert.match(S.act(s,'toggle','umbrella'),/放 3 件/);assert.match(S.act(s,'depart'),/傘/);
 S.act(s,'remove','phone');S.act(s,'toggle','umbrella');S.act(s,'depart');assert.equal(s.phase,'trip');
 assert.match(S.act(s,'use','water'),/現在還用不到/);assert.equal(S.act(s,'next'),null);
 for(const scene of S.scenes){S.act(s,'use',scene.need);assert.equal(s.used,true);assert.equal(S.act(s,'toggle','water'),null);assert.deepEqual(clone(S.restore(clone(s))),clone(s));S.act(s,'next');}
 assert.equal(s.phase,'done');assert.deepEqual(clone(S.restore(s)),clone(s));assert.equal(s.packed.length,3);
 assert.match(S.render(s,()=>''),/這次旅行用到的單字/);
});
test('malformed saved trips cannot bypass packing or escape the authored scenes',()=>{
 assert.equal(S.restore({version:9}),null);assert.equal(S.restore({version:1,phase:'missing'}),null);
 const s=S.restore({...S.create(),phase:'done',scene:200,used:true,packed:['<script>','water','water']});assert.equal(s.phase,'pack');assert.deepEqual(clone(s.packed),['water']);
 const falseEnd=S.restore({...S.create(),phase:'done',scene:0,used:true,packed:[...S.required]});assert.equal(falseEnd.phase,'trip');
 assert.equal(S.act(S.create(),'toggle','<script>'),null);
});
