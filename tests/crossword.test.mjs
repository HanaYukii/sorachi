import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const ctx=vm.createContext({});
for(const file of ['kana-hints','crossword']) vm.runInContext(readFileSync(new URL(`../dist/${file}.js`,import.meta.url),'utf8'),ctx);
const {Crossword:C,KanaHints:H}=vm.runInContext('({Crossword,KanaHints})',ctx);

test('eight connected boards use only taught words and have no accidental extra words',()=>{
 assert.equal(C.boards.length,8);
 for(const b of C.boards){
  assert.equal(b.entries.length,3); assert.ok(b.cols<=5&&b.rows<=5);
  const visited=new Set([0]);let changed=true;
  while(changed){changed=false;for(const cell of Object.values(b.cells))if(cell.entries.some(i=>visited.has(i)))for(const i of cell.entries)if(!visited.has(i)){visited.add(i);changed=true;}}
  assert.equal(visited.size,3,b.id+' is connected');
  for(const e of b.entries){
   const source=H.get(e.source).find(h=>h.word===e.word);assert.ok(source,e.word+' must already be taught');
   assert.equal(e.reading,source.romaji);assert.equal(e.meaning,source.meaning);
   assert.match(e.word,/^[ぁ-ゖ]+$/);assert.equal(e.keys.map(k=>b.cells[k].letter).join(''),e.word);
  }
  for(const cell of Object.values(b.cells))for(const [dr,dc] of [[0,1],[1,0]]){
   const next=b.cells[`${cell.row+dr}-${cell.col+dc}`];
   if(next)assert.ok(cell.entries.some(i=>next.entries.includes(i)),b.id+' accidental adjacent cells');
  }
 }
});

test('shared cells, edits, hints and reload preserve one consistent board',()=>{
 const s=C.create(),b=C.board(s.boardId),cross=Object.keys(b.cells).find(k=>b.cells[k].entries.length===2);
 C.select(s,0,cross);assert.equal(C.fill(s,b.cells[cross].letter),true);
 assert.equal(s.values[cross],b.entries[1].word[0]);
 C.select(s,1);C.hint(s);assert.equal(s.hints.length,1);assert.ok(C.errors(s).length>0);
 const copy=C.restore(JSON.parse(JSON.stringify(s)));assert.deepEqual(JSON.parse(JSON.stringify(copy)),JSON.parse(JSON.stringify(s)));
 for(const [key,cell] of Object.entries(b.cells))s.values[key]=cell.letter;
 s.done=true;assert.equal(C.restore(s).done,true);assert.equal(C.fill(s,'あ'),false);
 s.values[cross]='う';assert.equal(C.restore(s).done,false);
});

test('invalid or old progress never becomes a completed puzzle',()=>{
 assert.equal(C.restore({version:0,boardId:'basic-1'}),null);
 assert.equal(C.restore({version:1,boardId:'missing'}),null);
 const s=C.restore({...C.create(),values:{'0-0':'<script>','99-99':'あ'},entry:999,cell:'99-99',roman:[0,99,0],hints:['99-99'],done:true});
 assert.equal(Object.keys(s.values).length,0);assert.equal(s.entry,0);assert.equal(s.done,false);assert.equal(s.roman.length,1);assert.equal(s.hints.length,0);
});
