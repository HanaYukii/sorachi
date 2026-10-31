"use strict";
// An optional game; its orders and selections never produce course scores.
const Cafe = (() => {
  const groups = [
    {id:'drink',title:'選飲料',items:[{id:'coffee',jp:'コーヒー',speech:'コーヒー',romaji:'koohii',zh:'咖啡',icon:'☕'},{id:'tea',jp:'紅茶',speech:'こうちゃ',romaji:'koucha',zh:'紅茶',icon:'🫖'}]},
    {id:'temp',title:'選冷熱',items:[{id:'cold',jp:'アイス',speech:'アイス',romaji:'aisu',zh:'冰的',icon:'🧊'},{id:'hot',jp:'ホット',speech:'ホット',romaji:'hotto',zh:'熱的',icon:'♨'}]},
    {id:'count',title:'選數量',items:[{id:'one',jp:'ひとつ',speech:'ひとつ',romaji:'hitotsu',zh:'一份',icon:'1'},{id:'two',jp:'ふたつ',speech:'ふたつ',romaji:'futatsu',zh:'兩份',icon:'2'},{id:'three',jp:'みっつ',speech:'みっつ',romaji:'mittsu',zh:'三份',icon:'3'}]},
  ];
  const item=(group,id)=>groups.find(g=>g.id===group)?.items.find(x=>x.id===id);
  const menu=groups[0].items.flatMap(d=>groups[1].items.flatMap(t=>groups[2].items.map(n=>({drink:d.id,temp:t.id,count:n.id}))));
  // Stable indices 0..11 remain the original exact orders for v1 migration.
  const orders = [...menu,
    {temp:'cold',count:'two'}, {temp:'hot',count:'one'},
    {drink:'tea',count:'two'}, {drink:'coffee',count:'three'},
    {temp:'cold'}, {count:'one'},
  ];
  const cleanSelection = raw => Object.fromEntries(groups.filter(g=>item(g.id,raw?.[g.id])).map(g=>[g.id,raw[g.id]]));
  const complete = selected => groups.every(g=>item(g.id,selected?.[g.id]));
  const matches = (selected,order) => complete(selected) && groups.every(g=>!order[g.id]||order[g.id]===selected[g.id]);
  const recipeId = selected => menu.findIndex(o=>groups.every(g=>o[g.id]===selected[g.id]));
  function create(random=Math.random) {
    const pool=orders.slice(menu.length).map((_,i)=>i+menu.length);
    for(let i=pool.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
    return {version:2,mode:'orders',orders:[Math.floor(random()*menu.length),...pool.slice(0,2)],index:0,selected:{},served:false,roman:false,receipts:[],free:{selected:{},served:false},recipes:[]};
  }
  const draft = s => s.mode==='free'?s.free:s;
  const current = s => s.mode==='free'?{}:orders[s.orders[s.index]];
  const errors = s => groups.filter(g=>!item(g.id,draft(s).selected[g.id])||(current(s)[g.id]&&draft(s).selected[g.id]!==current(s)[g.id])).map(g=>g.id);
  function restore(raw){
    if(!raw||![1,2].includes(raw.version)||!Array.isArray(raw.orders)||raw.orders.length!==3||new Set(raw.orders).size!==3||!raw.orders.every(n=>Number.isInteger(n)&&n>=0&&n<(raw.version===1?menu.length:orders.length))||!Number.isInteger(raw.index)||raw.index<0||raw.index>2)return null;
    const s={version:2,mode:raw.version===2&&raw.mode==='free'?'free':'orders',orders:[...raw.orders],index:raw.index,selected:cleanSelection(raw.selected),served:false,roman:raw.roman===true,receipts:[],free:{selected:cleanSelection(raw.free?.selected),served:false},recipes:[]};
    for(let i=0;i<raw.index;i++){
      const receipt=raw.version===1?menu[raw.orders[i]]:cleanSelection(raw.receipts?.[i]);
      if(!matches(receipt,orders[raw.orders[i]])){s.index=i;s.selected={};break;}
      s.receipts.push({...receipt});
    }
    s.served=s.index===raw.index&&raw.served===true&&matches(s.selected,orders[s.orders[s.index]]);
    if(s.served)s.receipts[s.index]={...s.selected};
    s.recipes=Array.isArray(raw.recipes)?[...new Set(raw.recipes.filter(n=>Number.isInteger(n)&&n>=0&&n<menu.length))].slice(0,menu.length):[];
    s.free.served=raw.free?.served===true&&complete(s.free.selected);
    if(s.free.served)remember(s,s.free.selected);
    return s;
  }
  function choose(s,group,id){const d=draft(s);if(d.served||!item(group,id))return false;d.selected[group]=id;return true;}
  function remember(s,selected){const id=recipeId(selected);if(id>=0&&!s.recipes.includes(id))s.recipes.push(id);}
  function serve(s){
    const d=draft(s);if(d.served)return true;if(errors(s).length)return false;d.served=true;
    if(s.mode==='free')remember(s,d.selected);else s.receipts[s.index]={...d.selected};
    return true;
  }
  function next(s){if(s.mode!=='orders'||!s.served||s.index===2)return false;s.index++;s.selected={};s.served=false;return true;}
  function switchMode(s,mode){if(!['orders','free'].includes(mode))return false;s.mode=mode;return true;}
  function again(s){
    if(s.mode==='free'){s.free={selected:{},served:false};return true;}
    if(!s.served||s.index!==2)return false;
    const fresh=create();for(const key of ['orders','index','selected','served','receipts'])s[key]=fresh[key];return true;
  }
  function remix(s,id){if(!Number.isInteger(id)||!s.recipes.includes(id))return false;s.mode='free';s.free={selected:{...menu[id]},served:false};return true;}
  const label = o => `${item('temp',o.temp).zh}${item('drink',o.drink).zh}，${item('count',o.count).zh}`;
  function request(o){
    const parts=groups.filter(g=>o[g.id]).map(g=>item(g.id,o[g.id]).zh);
    const freedom=groups.filter(g=>!o[g.id]).map(g=>g.title.slice(1));
    return {text:parts.join(' · '),freedom:freedom.length?`${freedom.join('、')}由你搭配。`:'照這份需求準備。'};
  }
  function feedback(s){return errors(s).map(g=>!item(g,draft(s).selected[g])?`先選${groups.find(x=>x.id===g).title.slice(1)}`:`客人想要「${item(g,current(s)[g]).zh}」`).join('，')+'，改好再送一次。';}
  function cups(selected){
    const drink=item('drink',selected.drink),temperature=item('temp',selected.temp),quantity=groups[2].items.findIndex(x=>x.id===selected.count)+1;
    return drink?Array.from({length:quantity||1},()=>`<span class="cafe-cup ${selected.temp||''}" aria-hidden="true"><span>${drink.icon}</span><small>${temperature?.icon||'？'}</small></span>`).join(''):'<span class="cafe-empty">先選一種飲料</span>';
  }
  const entry='<a class="course-row cafe-entry" href="#cafe"><span><strong>雲朵點餐店</strong><span class="reading-label">接待客人，也能自由搭配飲料，留下自己的小菜單。</span></span><span aria-hidden="true">☕ →</span></a>';
  function render(s,audio){
    const d=draft(s),free=s.mode==='free',order=current(s),done=!free&&s.served&&s.index===2,r=request(order);
    const words=selected=>groups.map(g=>{const x=item(g.id,selected[g.id]);return `<p class="spoken-line"><span><strong lang="ja">${x.jp}</strong> · ${x.zh}<br><small>${x.romaji}</small></span>${audio(x.jp,x.speech)}</p>`;}).join('');
    const controls=groups.map((g,i)=>`<fieldset class="cafe-group" id="cafe-${g.id}" tabindex="-1"><legend>${i+1} · ${g.title}</legend><p class="cafe-freedom">${order[g.id]?`客人想要：${item(g.id,order[g.id]).zh}`:'這一項自由搭配'}</p><div class="cafe-options">${g.items.map(x=>`<div class="cafe-option"><button data-action="study-cafe-pick" data-group="${g.id}" data-id="${x.id}" aria-pressed="${d.selected[g.id]===x.id}"><span class="cafe-icon" aria-hidden="true">${x.icon}</span><strong lang="ja">${x.jp}</strong><span>${x.zh}</span>${s.roman?`<small>${x.romaji}</small>`:''}</button>${audio(x.jp,x.speech)}</div>`).join('')}</div></fieldset>`).join('');
    const tray=groups.map(g=>item(g.id,d.selected[g.id])?.zh||'尚未選').join(' · ');
    let workspace;
    if(done){
      workspace=`<section class="cafe-recap" tabindex="-1"><h2>今天接待了 3 位客人</h2><p>你準備的飲料：</p>${s.receipts.map((receipt,i)=>`<details class="cafe-receipt"><summary>客人 ${i+1}：${label(receipt)}</summary>${words(receipt)}</details>`).join('')}<button class="primary" data-action="study-cafe-again">再開店一輪</button><button class="text-button" data-action="study-cafe-mode" data-mode="free">自己搭一份飲料 →</button></section>`;
    }else if(d.served){
      workspace=`<section class="cafe-recap" tabindex="-1"><h2>${free?'收進你的小菜單了':'飲料送到了！'}</h2><div class="cafe-cups">${cups(d.selected)}</div><p>${label(d.selected)}</p>${words(d.selected)}<button class="primary" data-action="study-cafe-${free?'again':'next'}">${free?'再搭一份飲料 →':'下一位客人 →'}</button></section>`;
    }else{
      workspace=`<button class="text-button" data-action="study-cafe-roman" aria-pressed="${s.roman}">${s.roman?'收起羅馬音':'顯示羅馬音'}</button>${controls}<div class="cafe-submit"><button class="primary" data-action="study-cafe-serve">${free?'請雲朵試喝，收進小菜單':'送餐'}</button><p class="cafe-status" role="status" tabindex="-1"></p><button class="text-button cafe-fix" data-action="study-cafe-fix" hidden>回去調整 →</button></div>`;
    }
    const recipeBook=free?`<section class="cafe-recipes"><h2>我的小菜單 · ${s.recipes.length} 種</h2><p>${s.recipes.length?'同一種搭配只收一次。選一份，可以改冷熱、份數，再請雲朵試喝。':'搭好一份飲料，請雲朵試喝後就會放在這裡。'}</p><div class="cafe-recipe-grid">${s.recipes.map(id=>`<button data-action="study-cafe-recipe" data-id="${id}"><span class="cafe-cups">${cups(menu[id])}</span><strong>${label(menu[id])}</strong><span>拿出來調整 →</span></button>`).join('')}</div></section>`:'';
    return `<h1 class="focus-heading" tabindex="-1">雲朵點餐店</h1><p class="study-note">${free?'飲料、冷熱和份數都由你決定，沒有標準答案。':'看客人的中文需求。沒有指定的部分，可以自由搭配。'}</p><div class="cafe-modes" role="group" aria-label="點餐玩法"><button data-action="study-cafe-mode" data-mode="orders" aria-pressed="${!free}">接待客人</button><button data-action="study-cafe-mode" data-mode="free" aria-pressed="${free}">自由調飲</button></div><p class="study-note">切換玩法會保留兩邊的進度。</p><div class="cafe-layout"><aside class="cafe-customer ${d.served?'cafe-happy':''}"><div class="cafe-awning" aria-hidden="true"></div><p class="cafe-ticket">${free?'你的自由調飲':`客人 ${s.index+1} / 3`}${d.served?' · 已送達':''}</p><img src="${Routes.path('#home')}assets/${d.served?'cloud-complete':'cloud-friend'}-256.webp" width="160" height="160" alt="${d.served?'收到飲料的開心雲朵':'等著喝飲料的雲朵'}"><div class="cafe-bubble"><strong>${d.served?'謝謝，我收到啦！':free?'今天想搭什麼？':'我想要…'}</strong><p>${free?(d.served?label(d.selected):'你決定就好'):r.text}</p>${!free?`<span>${r.freedom}</span>`:''}</div><div class="cafe-tray" aria-label="${d.served?'已送達的飲料':'正在準備的托盤'}"><div class="cafe-cups">${cups(d.selected)}</div><span>${d.served?'已送達':'托盤'}：${tray}</span></div></aside><div class="cafe-workspace">${workspace}</div></div>${recipeBook}<p class="study-note">「ひとつ、ふたつ、みっつ」可以點一到三份。進度與小菜單保存在這個瀏覽器，不計時、不扣分。</p><a class="text-button" href="#travel/food">看飲料單字 →</a><button class="text-button" data-action="feedback">這一頁有問題？</button>`;
  }
  return {groups,menu,orders,item,create,current,draft,errors,feedback,restore,choose,serve,next,switchMode,again,remix,label,entry,render};
})();
