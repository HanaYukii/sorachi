"use strict";
// A small trip with real choices. Only authored ids are saved, never display text.
const Suitcase = (() => {
  const items = [
    {id:'umbrella',jp:'かさ',romaji:'kasa',zh:'傘',icon:'☂️',source:'か',purpose:'遮陽，也能擋雨'},
    {id:'water',jp:'みず',romaji:'mizu',zh:'水',icon:'💧',source:'ず',purpose:'休息時喝水'},
    {id:'hat',jp:'ぼうし',romaji:'boushi',zh:'帽子',icon:'👒',source:'ぼ',purpose:'戴著逛晴天的公園'},
    {id:'phone',jp:'けいたい',romaji:'keitai',zh:'手機',icon:'📱',source:'け',purpose:'拍一張旅行照片'},
    {id:'apple',jp:'りんご',romaji:'ringo',zh:'蘋果',icon:'🍎',source:'り',purpose:'休息時吃點心'},
  ];
  const scenes = [
    {id:'sun',title:'公園出太陽了',prompt:'陽光有點強。想怎麼逛公園？',icon:'☀️',options:[
      {id:'hat',item:'hat',label:'戴帽子，走陽光小路',result:'戴好帽子，沿著陽光小路慢慢走。',memory:'戴帽子逛公園',view:'sun'},
      {id:'umbrella',item:'umbrella',label:'撐傘遮陽',result:'把傘撐開，帶著一小片陰影散步。',memory:'撐傘走過晴天',view:'sun'},
      {id:'pavilion',label:'先到涼亭歇一會兒',result:'到涼亭坐了一會兒，等不那麼熱了再走。',memory:'在涼亭乘涼',view:'shelter',icon:'🏠'},
      {id:'shade',label:'走樹蔭下的小路',result:'轉進樹蔭下，吹著涼風走到公園另一邊。',memory:'走了樹蔭小路',view:'shade',icon:'🌳'},
    ]},
    {id:'rain',title:'路上突然下雨',prompt:'下起一陣小雨。要繼續走，還是休息一下？',icon:'🌧️',options:[
      {id:'umbrella',item:'umbrella',label:'撐傘，繼續散步',result:'傘擋住雨滴，雲朵走過濕漉漉的小路。',memory:'撐傘走過雨天',view:'rain'},
      {id:'covered',label:'沿有屋頂的走道走',result:'順著有屋頂的走道慢慢走，沒有淋到雨。',memory:'沿有屋頂的走道散步',view:'shelter',icon:'🏠'},
      {id:'shelter',label:'到屋簷下等雨停',result:'在屋簷下聽了一會兒雨聲。雨停了，再繼續走。',memory:'在屋簷下聽雨',view:'shelter',icon:'🏠'},
    ]},
    {id:'rest',title:'坐下來休息',prompt:'走到公園長椅了。回家前，想做點什麼？',icon:'🌳',options:[
      {id:'water',item:'water',label:'喝點水，歇一會兒',result:'喝了帶來的水，在長椅上歇歇腳。',memory:'喝水休息',view:'rest',ending:'帶著水的悠閒散步'},
      {id:'apple',item:'apple',label:'吃蘋果，來個小野餐',result:'拿出蘋果，在公園吃了一份小點心。',memory:'吃蘋果小野餐',view:'picnic',ending:'公園裡的小野餐'},
      {id:'phone',item:'phone',label:'用手機拍照留念',result:'拿出手機，拍下雲朵今天的公園旅行。',memory:'拍了一張公園照片',view:'photo',ending:'帶回一張旅行照片'},
      {id:'bench',label:'坐著看看風景',result:'不急著做什麼，坐著看看公園，再慢慢回家。',memory:'坐著看公園風景',view:'rest',icon:'🌿',ending:'慢慢看風景的一天'},
    ]},
  ];
  const item = id => items.find(x => x.id === id);
  const options = (s, index = s.scene) => scenes[index].options.filter(o => !o.item || s.packed.includes(o.item));
  const chosen = (s, index = s.scene) => options(s,index).find(o => o.id === s.choices[index]);
  const create = () => ({version:2,phase:'pack',packed:[],selected:'umbrella',scene:0,used:false,choices:[null,null,null]});
  const ready = s => s.packed.length === 3 && new Set(s.packed).size === 3 && s.packed.every(id => item(id));
  function restore(raw) {
    if (!raw || ![1,2].includes(raw.version) || !['pack','trip','done'].includes(raw.phase)) return null;
    const s = create();
    s.packed = Array.isArray(raw.packed) ? [...new Set(raw.packed.filter(id => item(id)))].slice(0,3) : [];
    s.selected = item(raw.selected) ? raw.selected : 'umbrella';
    if (raw.phase === 'pack' || !ready(s)) return s;
    if (!Number.isInteger(raw.scene) || raw.scene < 0 || raw.scene >= scenes.length) return s;
    let choices = raw.choices;
    if (raw.version === 1) {
      // Old routes always used hat -> umbrella -> water. Preserve completed stops.
      const legacy = ['hat','umbrella','water'];
      if (!legacy.every(id => s.packed.includes(id))) return s;
      choices = legacy.map((id,i) => i < raw.scene || (i === raw.scene && raw.used === true) ? id : null);
    }
    s.phase = 'trip';
    for (let i = 0; i <= raw.scene; i++) {
      if (!Array.isArray(choices) || !options(s,i).some(o => o.id === choices[i])) {
        s.scene = i;
        return s; // Resume at the first missing/invalid choice; never invent a result.
      }
      s.choices[i] = choices[i];
    }
    s.scene = raw.scene;
    s.used = true;
    if (raw.phase === 'done' && s.scene === scenes.length-1) s.phase = 'done';
    return s;
  }
  function act(s, action, id) {
    if (action === 'toggle' && s.phase === 'pack' && item(id)) {
      s.selected = id;
      if (s.packed.includes(id)) { s.packed = s.packed.filter(x => x !== id); return `已拿出${item(id).zh}。`; }
      if (s.packed.length === 3) return '行李箱放 3 件就好，可以先拿出一件。';
      s.packed.push(id); return `已放入${item(id).zh}。`;
    }
    if (action === 'remove' && s.phase === 'pack' && s.packed.includes(id)) { s.packed = s.packed.filter(x => x !== id); return `已拿出${item(id).zh}。`; }
    if (action === 'depart' && s.phase === 'pack') {
      if (!ready(s)) return `再選 ${3-s.packed.length} 件就能出門，沒有指定組合。`;
      s.phase = 'trip'; return '';
    }
    if (action === 'use' && s.phase === 'trip' && !s.used) {
      const choice = options(s).find(o => o.id === id);
      if (!choice) return null;
      s.choices[s.scene] = choice.id; s.used = true; return '';
    }
    if (action === 'next' && s.phase === 'trip' && s.used) {
      if (s.scene === scenes.length-1) s.phase = 'done';
      else { s.scene++; s.used = false; }
      return '';
    }
    return null;
  }
  const entry = '<a class="course-row suitcase-entry" href="#suitcase"><span><strong>雲朵行李箱</strong><span class="reading-label">任選 3 件物品，決定這趟散步怎麼過。</span></span><span aria-hidden="true">🧳 →</span></a>';
  function render(s, audio) {
    const scene = scenes[s.scene], packing = s.phase === 'pack', done = s.phase === 'done', choice = chosen(s);
    const words = x => `<strong lang="ja">${x.jp}</strong><small>${x.romaji}</small><span>${x.zh}</span>`;
    const wordLine = x => `<div class="spoken-line"><span>${words(x)}</span>${audio(x.jp)}</div>`;
    const usedItems = [...new Set(s.choices.flatMap((_,i) => chosen(s,i)?.item ? [chosen(s,i).item] : []))];
    const bag = s.packed.map(id => { const x = item(id); return packing ? `<button class="trip-bag-item" data-action="study-suitcase-remove" data-id="${id}" aria-label="拿出${x.zh}"><span aria-hidden="true">${x.icon}</span><span>${x.zh} ×</span></button>` : `<div class="trip-bag-item"><span aria-hidden="true">${x.icon}</span><span>${x.zh}</span></div>`; }).join('');
    const result = done ? chosen(s,2).ending : choice?.result;
    const view = packing ? 'room' : done ? 'home' : choice?.view || scene.id;
    const prop = choice?.item ? item(choice.item).icon : choice?.icon;
    const picture = `<aside class="trip-scene trip-${view} ${s.used&&!packing?'trip-used':''}"><p class="trip-scene-title">${packing?'準備去公園':done?'平安回家了':scene.title}</p><div class="trip-landscape"><span class="trip-weather" aria-hidden="true">${packing?'🪟':done?'🏡':choice?.icon||scene.icon}</span><img src="${Routes.path('#home')}assets/${done?'cloud-complete':'cloud-travel'}-256.webp" width="180" height="180" alt="${done?'旅行回家的雲朵':choice?choice.result:'帶著行李箱的雲朵'}">${!packing&&!done&&choice?.item?`<span class="trip-prop prop-${choice.item}" aria-hidden="true">${prop}</span>`:''}${view==='photo'?'<span class="trip-photo-frame" aria-hidden="true"></span>':''}</div><p class="trip-request">${packing?'晴天、小雨、長椅休息。任選 3 件都能出門。':done?result:choice?choice.result:scene.prompt}</p><div class="trip-bag" aria-label="行李箱裡的物品"><span class="trip-bag-label">🧳 行李箱 ${s.packed.length} / 3</span>${bag||'<span>還沒放東西</span>'}</div><p class="trip-status" tabindex="-1" role="status"></p></aside>`;
    let content;
    if (packing) {
      content = `<h2>選 3 件想帶的東西</h2><p>點一下放入，再點一次拿出。</p><div class="trip-shelf">${items.map(x=>`<div class="trip-shelf-item"><button data-action="study-suitcase-toggle" data-id="${x.id}" aria-pressed="${s.packed.includes(x.id)}"><span class="trip-item-icon" aria-hidden="true">${x.icon}</span>${words(x)}<span class="trip-purpose">${x.purpose}</span><span class="trip-packed">${s.packed.includes(x.id)?'✓ 已裝入':'＋ 放入'}</span></button>${audio(x.jp)}</div>`).join('')}</div><button class="primary trip-depart" data-action="study-suitcase-depart">裝好了，出門 →</button>`;
    } else if (done) {
      content = `<h2>${result}</h2><p>這次的旅行小記</p><ol class="trip-memories">${scenes.map((stop,i)=>`<li><span>${stop.icon} ${stop.title}</span><strong>${chosen(s,i).memory}</strong></li>`).join('')}</ol><h3>這次用到的單字</h3>${usedItems.length?usedItems.map(id=>`<div class="trip-recap"><span class="trip-item-icon" aria-hidden="true">${item(id).icon}</span>${wordLine(item(id))}</div>`).join(''):'<p>這趟選擇沿路休息，沒有拿出行李。帶著的單字也可以再看一次。</p>'}<details class="trip-packed-words"><summary>看看帶來的 ${s.packed.length} 件物品</summary>${s.packed.map(id=>wordLine(item(id))).join('')}</details><button class="primary" data-action="study-suitcase-again">換個行李，再走一次 →</button>`;
    } else if (s.used) {
      content = `<p class="reading-label">途中 ${s.scene+1} / 3</p><h2>${choice.memory}</h2><div class="trip-result">${choice.item?wordLine(item(choice.item)):''}<button class="primary" data-action="study-suitcase-next">${s.scene===2?'回家，看旅行小記':'繼續走 →'}</button></div>`;
    } else {
      const available = options(s), gear = available.filter(o=>o.item), other = available.filter(o=>!o.item);
      content = `<p class="reading-label">途中 ${s.scene+1} / 3</p><h2>這次想怎麼做？</h2><p>下面的做法都可以，選自己喜歡的。</p>${gear.length?`<div class="trip-choice-list">${gear.map(o=>{const x=item(o.item);return `<div class="trip-choice"><button data-action="study-suitcase-use" data-id="${o.id}"><span class="trip-item-icon" aria-hidden="true">${x.icon}</span><span><span class="trip-choice-label">${o.label}</span>${words(x)}</span></button>${audio(x.jp)}</div>`;}).join('')}</div>`:''}<p class="trip-alternative-label">不用拿出物品，也可以</p><div class="trip-alternatives">${other.map(o=>`<button data-action="study-suitcase-use" data-id="${o.id}"><span aria-hidden="true">${o.icon}</span> ${o.label} →</button>`).join('')}</div>`;
    }
    return `<h1 class="focus-heading" tabindex="-1">雲朵行李箱</h1><p class="study-note">${packing?'自由搭配行李，決定沿路怎麼玩。沒有標準答案，不用拖曳。':done?'不同的行李和選擇，會留下不同的旅行小記。':'中文說明會告訴你能做什麼，日文單字可以按喇叭聽。'}</p><p class="trip-phase">${packing?'① 裝行李 → ② 選擇旅途做法 → ③ 旅行小記':done?'③ 旅行小記':'② 選擇旅途做法'}</p><div class="trip-layout">${picture}<section class="trip-work" tabindex="-1">${content}</section></div><p class="study-note">會記住這趟旅行的進度。不計時、不扣分，也不影響課程成績。</p><button class="text-button" data-action="feedback">這一頁有問題？</button>`;
  }
  return {items,scenes,item,options,chosen,create,ready,restore,act,entry,render};
})();
