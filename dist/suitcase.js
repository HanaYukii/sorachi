"use strict";
// One short authored trip. Item ids connect packing, scenes and the recap.
const Suitcase = (() => {
  const items = [
    {id:'umbrella',jp:'かさ',romaji:'kasa',zh:'傘',icon:'☂️',source:'か'},
    {id:'water',jp:'みず',romaji:'mizu',zh:'水',icon:'💧',source:'ず'},
    {id:'hat',jp:'ぼうし',romaji:'boushi',zh:'帽子',icon:'👒',source:'ぼ'},
    {id:'phone',jp:'けいたい',romaji:'keitai',zh:'手機',icon:'📱',source:'け'},
    {id:'apple',jp:'りんご',romaji:'ringo',zh:'蘋果',icon:'🍎',source:'り'},
  ];
  const scenes = [
    {id:'sun',need:'hat',title:'公園出太陽了',prompt:'太陽有點大，找一件可以戴在頭上的東西。',result:'戴上帽子，繼續逛公園！',icon:'☀️'},
    {id:'rain',need:'umbrella',title:'路上突然下雨',prompt:'找一件可以擋雨的東西，幫雲朵保持乾爽。',result:'傘打開了！雲朵躲在傘下走過雨天。',icon:'🌧️'},
    {id:'rest',need:'water',title:'坐下來休息',prompt:'走了一段路，雲朵口渴了。拿什麼給它喝呢？',result:'喝點水，這趟散步結束了。',icon:'🌳'},
  ];
  const required=['umbrella','water','hat'];
  const item=id=>items.find(x=>x.id===id);
  const create=()=>({version:1,phase:'pack',packed:[],selected:'umbrella',scene:0,used:false});
  const ready=s=>s.packed.length===3&&required.every(id=>s.packed.includes(id));
  function restore(raw){
    if(!raw||raw.version!==1||!['pack','trip','done'].includes(raw.phase))return null;
    const s=create();s.packed=Array.isArray(raw.packed)?[...new Set(raw.packed.filter(id=>item(id)))].slice(0,3):[];
    s.selected=item(raw.selected)?raw.selected:'umbrella';
    if(raw.phase!=='pack'&&ready(s)&&Number.isInteger(raw.scene)&&raw.scene>=0&&raw.scene<scenes.length){
      s.phase='trip';s.scene=raw.scene;s.used=raw.used===true;
      if(raw.phase==='done'&&s.scene===scenes.length-1&&s.used)s.phase='done';
    }
    return s;
  }
  function act(s,action,id){
    if(action==='toggle'&&s.phase==='pack'&&item(id)){
      s.selected=id;
      if(s.packed.includes(id)){s.packed=s.packed.filter(x=>x!==id);return `已拿出${item(id).zh}。`;}
      if(s.packed.length===3)return '行李箱放 3 件就好，可以先拿出一件。';
      s.packed.push(id);return `已放入${item(id).zh}。`;
    }
    if(action==='remove'&&s.phase==='pack'&&s.packed.includes(id)){s.packed=s.packed.filter(x=>x!==id);return `已拿出${item(id).zh}。`;}
    if(action==='depart'&&s.phase==='pack'){
      if(!ready(s))return `清單還需要：${required.filter(id=>!s.packed.includes(id)).map(id=>item(id).zh).join('、')}。可以先拿出不需要的物品。`;
      s.phase='trip';return '';
    }
    if(action==='use'&&s.phase==='trip'&&!s.used&&s.packed.includes(id)){
      if(id!==scenes[s.scene].need)return `${item(id).zh}現在還用不到。${scenes[s.scene].prompt}`;
      s.used=true;return scenes[s.scene].result;
    }
    if(action==='next'&&s.phase==='trip'&&s.used){if(s.scene===scenes.length-1)s.phase='done';else{s.scene++;s.used=false;}return '';}
    return null;
  }
  const entry='<a class="course-row suitcase-entry" href="#suitcase"><span><strong>雲朵行李箱</strong><span class="reading-label">裝好 3 件物品，陪雲朵出門，途中拿出來用。</span></span><span aria-hidden="true">🧳 →</span></a>';
  function render(s,audio){
    const scene=scenes[s.scene],packing=s.phase==='pack',done=s.phase==='done';
    const words=x=>`<strong lang="ja">${x.jp}</strong><small>${x.romaji}</small><span>${x.zh}</span>`;
    const bag=s.packed.map(id=>{const x=item(id);return `<div class="trip-bag-item"><span aria-hidden="true">${x.icon}</span><span>${x.zh}</span>${packing?`<button class="text-button" data-action="study-suitcase-remove" data-id="${id}" aria-label="拿出${x.zh}">拿出</button>`:''}</div>`;}).join('');
    const sceneLabel=packing?'準備去公園':done?'平安回家了':scene.title;
    const picture=`<aside class="trip-scene ${packing?'trip-room':done?'trip-home':`trip-${scene.id}`} ${s.used&&!packing?'trip-used':''}"><p class="trip-scene-title">${sceneLabel}</p><div class="trip-landscape"><span class="trip-weather" aria-hidden="true">${packing?'🪟':done?'🏡':scene.icon}</span><img src="${Routes.path('#home')}assets/${done?'cloud-complete':'cloud-travel'}-256.webp" width="180" height="180" alt="${done?'旅行回家的雲朵':!packing&&s.used?scene.result:'帶著行李箱的雲朵'}">${!packing&&!done&&s.used?`<span class="trip-prop prop-${scene.need}" aria-hidden="true">${item(scene.need).icon}</span>`:''}</div><p class="trip-request">${packing?'今天要帶：傘、水、帽子。':done?'三件物品，旅行中都用到了。':s.used?scene.result:scene.prompt}</p><div class="trip-bag" aria-label="行李箱裡的物品"><span class="trip-bag-label">🧳 行李箱 ${s.packed.length} / 3</span>${bag||'<span>還沒放東西</span>'}</div><p class="trip-status" tabindex="-1" role="status"></p></aside>`;
    const pack=`<section class="trip-work"><h2>點物品裝箱，再點一次拿出</h2><div class="trip-shelf">${items.map(x=>`<div class="trip-shelf-item"><button data-action="study-suitcase-toggle" data-id="${x.id}" aria-pressed="${s.packed.includes(x.id)}"><span class="trip-item-icon" aria-hidden="true">${x.icon}</span>${words(x)}<span class="trip-packed">${s.packed.includes(x.id)?'✓ 已裝入':'＋ 放入'}</span></button>${audio(x.jp)}</div>`).join('')}</div><button class="primary trip-depart" data-action="study-suitcase-depart">裝好了，出門 →</button></section>`;
    const trip=`<section class="trip-work"><p class="reading-label">途中 ${s.scene+1} / 3</p><h2>${s.used?'這件物品派上用場了':'從行李箱拿出一件物品'}</h2>${s.used?`<div class="trip-result"><p class="spoken-line"><span>${words(item(scene.need))}</span>${audio(item(scene.need).jp)}</p><button class="primary" data-action="study-suitcase-next">${s.scene===2?'回家，看這次用過的詞':'繼續走 →'}</button></div>`:`<div class="trip-use-list">${s.packed.map(id=>{const x=item(id);return `<div class="trip-use-item"><button data-action="study-suitcase-use" data-id="${id}"><span class="trip-item-icon" aria-hidden="true">${x.icon}</span>${words(x)}</button>${audio(x.jp)}</div>`;}).join('')}</div>`}</section>`;
    const recap=`<section class="trip-work"><h2>這次旅行用到的單字</h2>${scenes.map(scene=>{const x=item(scene.need);return `<div class="trip-recap"><span class="trip-item-icon" aria-hidden="true">${x.icon}</span><div><p>${scene.title}</p><div class="spoken-line"><span>${words(x)}</span>${audio(x.jp)}</div></div></div>`;}).join('')}<button class="primary" data-action="study-suitcase-again">再去散步一次</button></section>`;
    return `<h1 class="focus-heading" tabindex="-1">雲朵行李箱</h1><p class="study-note">${packing?"點物品裝箱，不用拖曳。帶好清單上的 3 件東西就出門。":done?"回顧剛剛派上用場的單字。":"看看發生什麼事，點物品幫雲朵。"}</p><p class="trip-phase">${packing?'① 裝行李 → ② 出門使用 → ③ 回家看單字':done?'③ 回家看單字':'② 出門使用'}</p><div class="trip-layout">${picture}${packing?pack:done?recap:trip}</div><p class="study-note">可以聽讀音、慢慢試，不計時、不扣分。會記住這趟旅行的進度，不影響課程成績。</p><button class="text-button" data-action="feedback">這一頁有問題？</button>`;
  }
  return {items,scenes,required,item,create,ready,restore,act,entry,render};
})();
