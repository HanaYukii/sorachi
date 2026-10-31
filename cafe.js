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
  function create(random=Math.random) {
    const pool=menu.map((_,i)=>i); for(let i=pool.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
    const first=pool[0];
    const second=pool.find(n=>menu[n].drink!==menu[first].drink&&menu[n].temp!==menu[first].temp);
    const third=pool.find(n=>n!==first&&n!==second);
    return {version:1,orders:[first,second,third],index:0,selected:{},served:false,roman:false};
  }
  const current=s=>menu[s.orders[s.index]];
  const errors=s=>groups.filter(g=>s.selected[g.id]!==current(s)[g.id]).map(g=>g.id);
  function restore(raw){
    if(!raw||raw.version!==1||!Array.isArray(raw.orders)||raw.orders.length!==3||new Set(raw.orders).size!==3||!raw.orders.every(n=>Number.isInteger(n)&&menu[n])||!Number.isInteger(raw.index)||raw.index<0||raw.index>2)return null;
    const s={version:1,orders:[...raw.orders],index:raw.index,selected:{},served:false,roman:raw.roman===true};
    for(const g of groups)if(item(g.id,raw.selected?.[g.id]))s.selected[g.id]=raw.selected[g.id];
    s.served=raw.served===true&&!errors(s).length;return s;
  }
  function choose(s,group,id){if(s.served||!item(group,id))return false;s.selected[group]=id;return true;}
  function serve(s){if(s.served)return true;s.served=!errors(s).length;return s.served;}
  function next(s){if(!s.served||s.index===2)return false;s.index++;s.selected={};s.served=false;return true;}
  const label=o=>`${item('temp',o.temp).zh}${item('drink',o.drink).zh}，${item('count',o.count).zh}`;
  const entry='<a class="course-row cafe-entry" href="#cafe"><span><strong>雲朵點餐店</strong><span class="reading-label">幫 3 位客人準備飲料，練冷熱和數量。</span></span><span aria-hidden="true">☕ →</span></a>';
  function render(s,audio){
    const order=current(s), done=s.served&&s.index===2;
    const options=groups.map((g,i)=>`<fieldset class="cafe-group"><legend>${i+1} · ${g.title}</legend><div class="cafe-options">${g.items.map(x=>`<div class="cafe-option"><button data-action="study-cafe-pick" data-group="${g.id}" data-id="${x.id}" aria-pressed="${s.selected[g.id]===x.id}" ${s.served?'disabled':''}><span class="cafe-icon" aria-hidden="true">${x.icon}</span><strong lang="ja">${x.jp}</strong><span>${x.zh}</span>${s.roman?`<small>${x.romaji}</small>`:''}</button>${audio(x.jp,x.speech)}</div>`).join('')}</div></fieldset>`).join('');
    const tray=groups.map(g=>item(g.id,s.selected[g.id])?.zh||'尚未選').join(' · ');
    const delivered=`<section class="cafe-recap"><h2>飲料送到了！</h2><p>這次點餐用到的詞：</p>${groups.map(g=>{const x=item(g.id,order[g.id]);return `<p class="spoken-line"><span><strong lang="ja">${x.jp}</strong> · ${x.zh}<br><small>${x.romaji}</small></span>${audio(x.jp,x.speech)}</p>`;}).join('')}<button class="primary" data-action="study-cafe-next">下一位客人 →</button></section>`;
    const recap=done?`<section class="cafe-recap"><h2>今天接待了 3 位客人</h2><p>點餐時不用一口氣說完，飲料、冷熱、數量分開說也可以。</p>${groups.map(g=>`<div><h3>${g.title.slice(1)}</h3>${g.items.filter(x=>s.orders.some(n=>menu[n][g.id]===x.id)).map(x=>`<p class="spoken-line"><span><strong lang="ja">${x.jp}</strong> · ${x.zh}<br><small>${x.romaji}</small></span>${audio(x.jp,x.speech)}</p>`).join('')}</div>`).join('')}<button class="primary" data-action="study-cafe-again">再開店一輪</button></section>`:'';
    return `<h1 class="focus-heading" tabindex="-1">雲朵點餐店</h1><p class="study-note">看客人的中文需求，選飲料、冷熱和數量，再送餐。可以聽讀音，不計時、不扣分。</p><div class="cafe-layout"><aside class="cafe-customer ${s.served?'cafe-happy':''}"><div class="cafe-awning" aria-hidden="true"></div><p class="cafe-ticket">客人 ${s.index+1} / 3 ${s.served?'· 已送達':''}</p><img src="${Routes.path('#home')}assets/${s.served?'cloud-complete':'cloud-friend'}-256.webp" width="160" height="160" alt="${s.served?'收到飲料的開心雲朵':'等著點餐的雲朵'}"><div class="cafe-bubble"><strong>${s.served?'謝謝，這就是我要的！':'我想要…'}</strong><p>${label(order)}</p></div><p class="cafe-tray">${s.served?'☕ 已送達':'托盤'}：${tray}</p></aside><div class="cafe-workspace">${done?recap:s.served?delivered:`<button class="text-button" data-action="study-cafe-roman" aria-pressed="${s.roman}">${s.roman?'收起羅馬音':'顯示羅馬音'}</button>${options}<div class="cafe-submit"><button class="primary" data-action="study-cafe-${s.served?'next':'serve'}">${s.served?'下一位客人 →':'送餐'}</button><p class="cafe-status" role="status" tabindex="-1"></p></div>`}</div></div><p class="study-note">數量先用「ひとつ、ふたつ、みっつ」點一到三份，不用先背杯子的量詞。進度會保存在這個瀏覽器，不計入課程成績。</p><a class="text-button" href="#travel/food">看飲料單字 →</a><button class="text-button" data-action="feedback">這一頁有問題？</button>`;
  }
  return {groups,menu,item,create,current,errors,restore,choose,serve,next,label,entry,render};
})();
