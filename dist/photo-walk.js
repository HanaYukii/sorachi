"use strict";
const PhotoWalk=(()=>{
 const subjects=[
  {id:'cat',jp:'ねこ',romaji:'neko',zh:'貓',icon:'🐈',source:'ね',reaction:'貓抬起頭，看看你的相機。'},
  {id:'flower',jp:'はな',romaji:'hana',zh:'花',icon:'🌷',source:'は',reaction:'花在風裡輕輕搖晃。'},
  {id:'tree',jp:'き',romaji:'ki',zh:'樹',icon:'🌳',source:'き',reaction:'樹葉沙沙響，樹下很涼快。'},
  {id:'dog',jp:'いぬ',romaji:'inu',zh:'狗',icon:'🐕',source:'い',reaction:'狗搖搖尾巴，停下來看你。'},
  {id:'bird',jp:'とり',romaji:'tori',zh:'鳥',icon:'🐦',source:'と',reaction:'鳥停在枝頭，歪了一下頭。'},
 ];
 const targets=['cat','flower','tree'];const subject=id=>subjects.find(x=>x.id===id);
 const create=()=>({version:1,selected:null,photos:[],album:false,roman:false});
 function restore(raw){if(!raw||raw.version!==1)return null;return {version:1,selected:subject(raw.selected)?raw.selected:null,photos:Array.isArray(raw.photos)?[...new Set(raw.photos.filter(id=>subject(id)))]:[],album:raw.album===true,roman:raw.roman===true};}
 function act(s,action,id){
  if(action==='look'&&subject(id)){s.selected=id;s.album=false;return subject(id).reaction;}
  if(action==='snap'&&subject(s.selected)&&!s.album){if(s.photos.includes(s.selected))return '這張已在相簿裡，不會重複存。';s.photos.push(s.selected);return `拍好了！${subject(s.selected).zh}的照片已放進相簿。`;}
  if(action==='album'){s.album=true;return '';}
  if(action==='park'){s.album=false;return '';}
  if(action==='roman'){s.roman=!s.roman;return '';}
  return null;
 }
 const complete=s=>targets.every(id=>s.photos.includes(id));
 function render(s,audio){
  const current=subject(s.selected),art=`${Routes.path('#home')}assets/cloud-photo-256.webp`;
  const word=x=>`<strong lang="ja">${x.jp}</strong><span>${x.zh}</span>${s.roman?`<small>${x.romaji}</small>`:''}`;
  const album=`<section class="walk-album"><h2>我的小相簿 · ${s.photos.length} 張</h2>${s.photos.length?`<div class="walk-photos">${s.photos.map(id=>{const x=subject(id);return `<article class="walk-photo"><div class="walk-print" aria-label="公園裡的${x.zh}"><span aria-hidden="true">${x.icon}</span></div><div class="spoken-line"><div>${word(x)}</div>${audio(x.jp)}</div></article>`;}).join('')}</div>`:'<p>還沒有照片。回公園點一個物件，再按「拍下來」。</p>'}<button class="primary" data-action="study-walk-park">回公園繼續逛 →</button></section>`;
  const park=`<div class="walk-layout"><section class="walk-park" tabindex="-1" aria-label="公園，點物件看看"><div class="walk-path" aria-hidden="true"></div><span class="walk-sun" aria-hidden="true">☀️</span><img class="walk-cloud" src="${art}" width="95" height="100" alt="帶著相機散步的雲朵">${subjects.map(x=>`<button class="walk-object object-${x.id}${s.selected===x.id?' in-frame':''}" data-action="study-walk-look" data-id="${x.id}" aria-label="看看${x.zh}" aria-pressed="${s.selected===x.id}"><span class="walk-object-art" aria-hidden="true">${x.icon}</span><span class="walk-object-name">${x.zh}</span>${s.photos.includes(x.id)?'<span class="walk-saved" aria-label="已拍過">✓</span>':''}</button>`).join('')}</section><section class="walk-camera" tabindex="-1" aria-label="取景與拍照">${current?`<div class="walk-view" aria-label="取景：${current.zh}"><span aria-hidden="true">${current.icon}</span></div><p class="walk-reaction">${current.reaction}</p><div class="spoken-line"><div class="walk-word">${word(current)}</div>${audio(current.jp)}</div><button class="primary walk-shutter" data-action="study-walk-snap" ${s.photos.includes(current.id)?'disabled':''}>${s.photos.includes(current.id)?'✓ 已收進相簿':'◎ 拍下來'}</button><div class="walk-toolbar"><button class="text-button" data-action="study-walk-park">回公園看看</button><button class="text-button" data-action="study-walk-album">翻相簿</button></div>`:`<h2>想先拍什麼？</h2><p>點公園裡的貓、花或其他物件，看看它們的日文。</p><p>不用照順序，想拍的都能留下來。</p>`}</section></div>`;
  return `<h1 class="focus-heading" tabindex="-1">雲朵拍照散步</h1><p class="study-note">點物件看看，再按快門。想先拍哪個都可以。</p><div class="walk-toolbar"><button class="text-button" data-action="study-walk-${s.album?'park':'album'}">${s.album?'回公園':'我的相簿'}${s.album?'':`（${s.photos.length}）`}</button><button class="text-button" data-action="study-walk-roman" aria-pressed="${s.roman}">${s.roman?'收起羅馬音':'顯示羅馬音'}</button></div><div class="walk-wishlist"><span>${complete(s)?'想拍的三張都有了！也可以繼續逛。':'今天想拍：'}</span>${targets.map(id=>{const x=subject(id);return `<span>${s.photos.includes(id)?'✓':'○'} ${x.zh}</span>`;}).join('')}</div>${s.album?album:park}<p class="walk-status" role="status" tabindex="-1"></p><p class="study-note">照片與進度會記在這個瀏覽器。同一物件只留一張，不計時、不計分。</p><button class="text-button" data-action="feedback">這一頁有問題？</button>`;
 }
 function games(){return `<div class="games-intro"><img src="${Routes.path('#home')}assets/cloud-games-256.webp" width="160" height="166" alt="開心拿著遊戲手把的雲朵"><div><h1 class="focus-heading" tabindex="-1">小遊戲</h1><p>認識本站教過的日文。可以看中文、聽讀音，慢慢玩。</p></div></div><div class="games-grid">${[
 ['photo-walk','cloud-photo','雲朵拍照散步','逛公園，拍下貓、花和樹，收進自己的小相簿。','探索 · 基本單字'],
 ['suitcase','cloud-travel','雲朵行李箱','任選 3 件物品，決定旅途做法，留下不同小記。','情境 · 旅行物品'],
 ['cafe','cloud-friend','雲朵點餐店','選飲料、冷熱和數量，幫 3 位客人送餐。','情境 · 點餐關鍵字'],
 ['crossword','cloud-kana','平假名小填字','看中文提示，選假名把單字填進格子。','填字 · 假名與單字'],
 ].map(([route,image,title,description,tag])=>`<a class="game-card" href="#${route}"><img src="${Routes.path('#home')}assets/${image}-256.webp" width="110" height="114" alt=""><div><span class="game-tag">${tag}</span><h2>${title}</h2><p>${description}</p><strong>開始玩 →</strong></div></a>`).join('')}</div><p class="study-note">不用登入也能玩，進度保存在目前瀏覽器，不影響課程成績。</p>`;}
 return {subjects,targets,subject,create,restore,act,complete,render,games};
})();
