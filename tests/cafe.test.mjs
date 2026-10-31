import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const context=vm.createContext({});
for(const file of ['content','routes','cafe'])vm.runInContext(readFileSync(new URL(`../dist/${file}.js`,import.meta.url),'utf8'),context);
const {Cafe:C,Content}=vm.runInContext('({Cafe,Content})',context);
const copy=x=>JSON.parse(JSON.stringify(x));
test('cafe only teaches existing words and creates three different valid orders',()=>{
 const taught=JSON.stringify(Content.phrasebook);
 for(const g of C.groups)for(const item of g.items)assert.ok(taught.includes(item.jp),item.jp);
 for(let i=0;i<30;i++){const s=C.create();assert.equal(new Set(s.orders).size,3);assert.ok(s.orders.every(n=>C.menu[n]));assert.equal(new Set(s.orders.map(n=>C.menu[n].drink)).size,2);assert.equal(new Set(s.orders.map(n=>C.menu[n].temp)).size,2);}
});
test('cafe prevents skipping, supports corrections, saves a served order and ends after three guests',()=>{
 const s=C.create();assert.equal(C.next(s),false);assert.equal(C.serve(s),false);
 for(let i=0;i<3;i++){
  const order=C.current(s);for(const g of C.groups)assert.equal(C.choose(s,g.id,order[g.id]),true);
  assert.equal(C.serve(s),true);assert.equal(C.choose(s,'drink','tea'),false);
  assert.deepEqual(copy(C.restore(copy(s))),copy(s));
  assert.equal(C.next(s),i<2);
 }
 assert.equal(s.index,2);assert.equal(s.served,true);
 const html=C.render(s,()=>'<button>audio</button>');assert.match(html,/今天接待了 3 位客人/);assert.match(html,/再開店一輪/);assert.match(html,/src="\/assets\/cloud-complete-256.webp"/);
});
test('cafe sanitizes corrupt data and refuses false completion',()=>{
 assert.equal(C.restore({version:2}),null);
 const s=C.create();assert.equal(C.restore({...s,orders:[0,0,1]}),null);assert.equal(C.restore({...s,index:3}),null);
 const clean=C.restore({...s,selected:{drink:'<script>'},served:true});assert.equal(clean.served,false);assert.deepEqual(copy(clean.selected),{});
 assert.equal(C.choose(s,'unknown','one'),false);
 assert.match(C.render(s,()=>''),/看客人的中文需求/);
});
