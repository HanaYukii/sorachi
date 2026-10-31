import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import vm from 'node:vm';
const context=vm.createContext({});for(const file of ['content','routes','cafe'])vm.runInContext(readFileSync(new URL(`../dist/${file}.js`,import.meta.url),'utf8'),context);
const {Cafe:C,Content}=vm.runInContext('({Cafe,Content})',context);const copy=x=>JSON.parse(JSON.stringify(x));
const fill=(s,recipe)=>{for(const g of C.groups)C.choose(s,g.id,recipe[g.id]);};
test('new cafe rounds use taught words, one exact order and two different open orders',()=>{
 const taught=JSON.stringify(Content.phrasebook);for(const g of C.groups)for(const x of g.items)assert.ok(taught.includes(x.jp),x.jp);
 for(let i=0;i<30;i++){const s=C.create();assert.equal(new Set(s.orders).size,3);assert.ok(s.orders[0]<C.menu.length);assert.ok(s.orders.slice(1).every(n=>n>=C.menu.length));assert.deepEqual(copy(C.restore(s)),copy(s));}
});
test('every open order accepts all matching recipes, with multiple valid results and targeted correction',()=>{
 for(let id=C.menu.length;id<C.orders.length;id++){
  let accepted=0;
  for(const recipe of C.menu){const s=C.create();s.orders=[id,0,1];fill(s,recipe);
   const valid=C.groups.every(g=>!C.orders[id][g.id]||C.orders[id][g.id]===recipe[g.id]);
   assert.equal(C.serve(s),valid);if(valid){accepted++;assert.deepEqual(copy(s.receipts[0]),copy(recipe));assert.deepEqual(copy(C.restore(s)),copy(s));}
   else assert.ok(C.errors(s).every(g=>C.orders[id][g]));
  }
  assert.ok(accepted>=2,`open order ${id} needs multiple valid combinations`);
 }
 const s=C.create();s.orders=[12,0,1];assert.equal(C.serve(s),false);assert.match(C.feedback(s),/先選/);
 fill(s,{drink:'tea',temp:'hot',count:'two'});assert.deepEqual([...C.errors(s)],['temp']);assert.match(C.feedback(s),/冰的/);
});
test('free mixing saves every valid recipe once, survives reload and never replaces an order draft',()=>{
 let s=C.create();C.choose(s,'drink','tea');const order=copy(s);C.switchMode(s,'free');assert.equal(C.serve(s),false);
 for(const recipe of C.menu){fill(s,recipe);assert.equal(C.serve(s),true);assert.equal(C.serve(s),true);s=C.restore(copy(s));assert.ok(s.free.served);C.again(s);}
 assert.equal(s.recipes.length,C.menu.length);assert.equal(s.index,order.index);assert.deepEqual(copy(s.selected),order.selected);
 const first=s.recipes[0];assert.ok(C.remix(s,first));assert.deepEqual(copy(s.free.selected),copy(C.menu[first]));assert.equal(s.free.served,false);C.serve(s);assert.equal(s.recipes.length,C.menu.length);
 C.switchMode(s,'orders');assert.deepEqual(copy(s.selected),order.selected);assert.equal(s.served,false);
});
test('order recap contains actual freely chosen recipes; new rounds preserve the recipe book and free draft',()=>{
 const s=C.create();s.orders=[12,14,17];const recipes=[{drink:'tea',temp:'cold',count:'two'},{drink:'tea',temp:'hot',count:'two'},{drink:'coffee',temp:'hot',count:'one'}];
 C.switchMode(s,'free');fill(s,C.menu[0]);C.serve(s);C.again(s);C.choose(s,'drink','coffee');C.switchMode(s,'orders');
 for(let i=0;i<3;i++){assert.equal(C.next(s),false);fill(s,recipes[i]);C.serve(s);assert.equal(C.choose(s,'drink','coffee'),false);assert.deepEqual(copy(C.restore(s)),copy(s));assert.equal(C.next(s),i<2);}
 assert.deepEqual(copy(s.receipts),recipes);const html=C.render(s,()=>'');assert.match(html,/冰的紅茶，兩份/);assert.match(html,/熱的咖啡，一份/);
 assert.ok(C.again(s));assert.equal(s.index,0);assert.equal(s.recipes.length,1);assert.equal(s.free.selected.drink,'coffee');assert.equal(s.receipts.length,0);
});
test('legacy cafe rounds migrate without changing orders, progress or completed receipts',()=>{
 const raw={version:1,orders:[0,4,8],index:1,selected:{...C.menu[4]},served:true,roman:true};
 const s=C.restore(raw);assert.equal(s.version,2);assert.equal(s.index,1);assert.equal(s.served,true);assert.deepEqual(copy(s.orders),raw.orders);assert.deepEqual(copy(s.receipts),[copy(C.menu[0]),copy(C.menu[4])]);
 assert.deepEqual(copy(C.restore(s)),copy(s));assert.equal(C.restore({...raw,orders:[12,4,8]}),null);
});
test('invalid recipes and missing receipts cannot invent completion or inject display text',()=>{
 assert.equal(C.restore({version:9}),null);const s=C.create();assert.equal(C.restore({...s,orders:[0,0,1]}),null);
 const clean=C.restore({...s,selected:{drink:'<script>'},served:true,recipes:[-1,0,0,100,'<script>'],free:{selected:{drink:'tea'},served:true}});
 assert.equal(clean.served,false);assert.equal(clean.free.served,false);assert.deepEqual(copy(clean.recipes),[0]);assert.deepEqual(copy(clean.selected),{});
 const skipped=C.restore({...s,index:2,served:true,selected:C.menu[0],receipts:[]});assert.equal(skipped.index,0);assert.equal(skipped.served,false);
 assert.equal(C.remix(s,100),false);assert.equal(C.switchMode(s,'unknown'),false);assert.equal(C.choose(s,'unknown','one'),false);
});
test('tray reflects actual selections and all free recipes are renderable after reload',()=>{
 const s=C.create();C.switchMode(s,'free');fill(s,{drink:'tea',temp:'cold',count:'three'});
 let html=C.render(C.restore(s),()=>'');assert.equal((html.match(/class="cafe-cup cold"/g)||[]).length,3);assert.match(html,/托盤：紅茶 · 冰的 · 三份/);
 C.serve(s);html=C.render(C.restore(s),()=>'');assert.match(html,/我的小菜單 · 1 種/);assert.match(html,/收進你的小菜單了/);
});
