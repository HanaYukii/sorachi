"use strict";

// Small authored boards. Each word is an existing kana example (source = kana-hints key).
const Crossword = (() => {
  const VERSION = 1;
  const words = {
    kasa: ['かさ','kasa','傘','か'], sakana: ['さかな','sakana','魚','さ'], hana: ['はな','hana','花','は'],
    sakura: ['さくら','sakura','櫻花','ら'], sora: ['そら','sora','天空','そ'],
    watashi: ['わたし','watashi','我','わ'], tamago: ['たまご','tamago','蛋','た'], ringo: ['りんご','ringo','蘋果','り'],
    nori: ['のり','nori','海苔','の'], shio: ['しお','shio','鹽','し'], onigiri: ['おにぎり','onigiri','飯糰','お'], tori: ['とり','tori','鳥','と'],
    keitai: ['けいたい','keitai','手機','け'], inu: ['いぬ','inu','狗','い'], iro: ['いろ','iro','顏色','ろ'], natsu: ['なつ','natsu','夏天','な'],
  };
  const layouts = [
    [['kasa',0,0,'across'],['sakana',0,1,'down'],['hana',2,0,'across']],
    [['kasa',0,0,'across'],['sakura',0,1,'down'],['sora',2,0,'across']],
    [['watashi',0,1,'across'],['tamago',0,2,'down'],['ringo',2,0,'across']],
    [['nori',0,1,'across'],['ringo',0,2,'down'],['tamago',2,0,'across']],
    [['shio',0,0,'across'],['onigiri',0,1,'down'],['tori',3,0,'across']],
    [['keitai',0,0,'down'],['inu',1,0,'across'],['iro',3,0,'across']],
    [['kasa',0,0,'across'],['sakana',0,1,'down'],['natsu',2,1,'across']],
    [['sakana',0,1,'across'],['sakura',0,1,'down'],['sora',2,0,'across']],
  ];
  const boards = layouts.map((layout, index) => {
    const cells = {}, entries = layout.map(([id,row,col,direction], n) => {
      const [word,reading,meaning,source] = words[id];
      const keys = [...word].map((letter,i) => {
        const r=row+(direction==='down'?i:0),c=col+(direction==='across'?i:0),key=`${r}-${c}`;
        if(cells[key] && cells[key].letter!==letter) throw Error('Conflicting crossword intersection');
        cells[key] ||= {row:r,col:c,letter,entries:[]}; cells[key].entries.push(n); return key;
      });
      return {id,word,reading,meaning,source,row,col,direction,keys,number:n+1};
    });
    return {id:`basic-${index+1}`,entries,cells,rows:Math.max(...Object.values(cells).map(c=>c.row))+1,cols:Math.max(...Object.values(cells).map(c=>c.col))+1,
      bank:[...new Set([...Object.values(cells).map(c=>c.letter),'あ','う'])].sort((a,b)=>a.localeCompare(b,'ja'))};
  });
  const board = id => boards.find(b=>b.id===id);
  function create(id = boards[0].id) { const b=board(id)||boards[0]; return {version:VERSION,boardId:b.id,values:{},entry:0,cell:b.entries[0].keys[0],roman:[],hints:[],done:false}; }
  function restore(raw) {
    if(!raw || raw.version!==VERSION || !board(raw.boardId)) return null;
    const b=board(raw.boardId), s=create(b.id);
    for(const key of Object.keys(b.cells)) if(typeof raw.values?.[key]==='string' && b.bank.includes(raw.values[key])) s.values[key]=raw.values[key];
    s.entry=Number.isInteger(raw.entry)&&b.entries[raw.entry]?raw.entry:0;
    s.cell=b.entries[s.entry].keys.includes(raw.cell)?raw.cell:b.entries[s.entry].keys[0];
    s.roman=Array.isArray(raw.roman)?[...new Set(raw.roman.filter(n=>Number.isInteger(n)&&b.entries[n]))]:[];
    s.hints=Array.isArray(raw.hints)?[...new Set(raw.hints.filter(key=>b.cells[key] && s.values[key]===b.cells[key].letter))]:[];
    s.done=raw.done===true&&errors(s).length===0;
    return s;
  }
  function errors(s) { const b=board(s.boardId); return Object.keys(b.cells).filter(key=>s.values[key]!==b.cells[key].letter); }
  function select(s,entry,cell) { const e=board(s.boardId).entries[entry]; if(!e)return false; s.entry=entry;s.cell=e.keys.includes(cell)?cell:e.keys[0];return true; }
  function fill(s,letter) {
    const b=board(s.boardId);if(s.done||!b.cells[s.cell]||!b.bank.includes(letter))return false;
    s.values[s.cell]=letter; s.hints=s.hints.filter(k=>k!==s.cell);
    const keys=b.entries[s.entry].keys,at=keys.indexOf(s.cell); if(at<keys.length-1)s.cell=keys[at+1]; return true;
  }
  function hint(s) { if(s.done)return false; const b=board(s.boardId), e=b.entries[s.entry]; const key=e.keys.find(k=>s.values[k]!==b.cells[k].letter);if(!key)return false;s.values[key]=b.cells[key].letter;if(!s.hints.includes(key))s.hints.push(key);s.cell=key;return true; }
  return {VERSION,boards,board,create,restore,errors,select,fill,hint};
})();
