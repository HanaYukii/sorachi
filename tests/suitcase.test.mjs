import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';
const ctx=vm.createContext({});for(const f of ['content','routes','kana-hints','suitcase'])vm.runInContext(readFileSync(new URL(`../dist/${f}.js`,import.meta.url),'utf8'),ctx);
const {S,H}=vm.runInContext('({S:Suitcase,H:KanaHints})',ctx);const clone=x=>JSON.parse(JSON.stringify(x));
test('all five suitcase items are taught words and have a real trip action',()=>{
 for(const x of S.items){const hint=H.get(x.source).find(h=>h.word===x.jp);assert.ok(hint,x.jp);assert.equal(hint.romaji,x.romaji);assert.equal(hint.meaning,x.zh);assert.ok(S.scenes.some(scene=>scene.options.some(o=>o.item===x.id)),x.id);}
});
test('every three-item combination and every offered branch can finish, reload and record actual choices',()=>{
 let combinations=0,paths=0;const endings=new Set(),used=new Set();
 function walk(s){
  assert.deepEqual(clone(S.restore(s)),clone(s));
  if(s.phase==='done'){
   paths++;endings.add(S.chosen(s,2).ending);
   const html=S.render(s,()=>'<button>audio</button>');for(let i=0;i<3;i++){const choice=S.chosen(s,i);assert.ok(html.includes(choice.memory));if(choice.item)used.add(choice.item);}
   return;
  }
  assert.ok(S.options(s).some(o=>!o.item),'a no-item fallback is always possible');
  for(const choice of S.options(s)){
   const branch=S.restore(clone(s));assert.equal(S.act(branch,'next'),null);
   S.act(branch,'use',choice.id);assert.equal(branch.used,true);assert.equal(branch.choices[branch.scene],choice.id);
   assert.equal(S.act(branch,'use',choice.id),null);assert.deepEqual(clone(S.restore(branch)),clone(branch));
   S.act(branch,'next');walk(branch);
  }
 }
 for(let a=0;a<3;a++)for(let b=a+1;b<4;b++)for(let c=b+1;c<5;c++){
  combinations++;const s=S.create();for(const n of [a,b,c])S.act(s,'toggle',S.items[n].id);
  assert.ok(S.ready(s));S.act(s,'depart');walk(s);
 }
 assert.equal(combinations,10);assert.ok(paths>30);assert.equal(endings.size,4);assert.equal(used.size,5);
});
test('packing can be changed and unavailable actions never become answers',()=>{
 const s=S.create();assert.match(S.act(s,'depart'),/再選 3 件/);
 for(const id of ['phone','apple','water'])S.act(s,'toggle',id);
 assert.match(S.act(s,'toggle','hat'),/放 3 件/);S.act(s,'remove','water');S.act(s,'toggle','hat');S.act(s,'depart');
 assert.equal(S.act(s,'use','umbrella'),null);assert.equal(s.used,false);
 S.act(s,'use','shade');S.act(s,'next');S.act(s,'use','shelter');S.act(s,'next');S.act(s,'use','phone');S.act(s,'next');
 const html=S.render(s,()=> '');assert.match(html,/帶回一張旅行照片/);assert.match(html,/拍了一張公園照片/);assert.doesNotMatch(html,/喝水休息|戴帽子逛公園/);
});
test('legacy packing, unfinished and completed routes migrate without losing their place',()=>{
 const old={version:1,phase:'trip',packed:['hat','umbrella','water'],selected:'water',scene:1,used:false};
 let s=S.restore(old);assert.equal(s.version,2);assert.equal(s.scene,1);assert.equal(s.used,false);assert.deepEqual(clone(s.choices),['hat',null,null]);
 s=S.restore({...old,used:true});assert.deepEqual(clone(s.choices),['hat','umbrella',null]);assert.equal(s.used,true);
 s=S.restore({...old,phase:'done',scene:2,used:true});assert.equal(s.phase,'done');assert.deepEqual(clone(s.choices),['hat','umbrella','water']);
 s=S.restore({...old,phase:'pack',packed:['phone','apple']});assert.equal(s.phase,'pack');assert.deepEqual(clone(s.packed),['phone','apple']);
});
test('invalid saved choices cannot invent endings, use unpacked gear or skip a stop',()=>{
 assert.equal(S.restore({version:9}),null);assert.equal(S.restore({version:2,phase:'missing'}),null);
 const base={...S.create(),phase:'done',scene:2,used:true,packed:['phone','apple','water']};
 let s=S.restore({...base,choices:['hat','shelter','phone']});assert.equal(s.phase,'trip');assert.equal(s.scene,0);assert.equal(s.used,false);
 s=S.restore({...base,choices:['shade',null,'phone']});assert.equal(s.scene,1);assert.deepEqual(clone(s.choices),['shade',null,null]);
 s=S.restore({...base,choices:['shade','shelter','<script>']});assert.equal(s.scene,2);assert.equal(s.used,false);
 s=S.restore({...base,scene:900,packed:['water','water','<script>']});assert.equal(s.phase,'pack');assert.deepEqual(clone(s.packed),['water']);
});
