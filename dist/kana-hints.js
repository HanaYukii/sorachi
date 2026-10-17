"use strict";

// Hints on kana cards for learners starting from zero (#35). A basic kana has up to three:
// - 字源: the kanji it came from. Every one was checked against デジタル大辞泉, 精選版 日本国語大辞典 and
//   日本大百科全書 on Kotobank (sources per character: docs/kana-hints-review.md). Where a dictionary also names
//   another theory the text says 一般認為; where the origin is open (つ, ツ, ん, ン) there is none.
// - 比一比: only where another kana is easy to mix up, where the two differ in the site's font.
// - 例子: one everyday word with the kana marked, its romaji and meaning. It is something to hear, never tested.
// Voiced, semi-voiced and contracted kana keep the base explanation plus an example, without invented origins.
const KanaHints = (() => {
  // Hiragana came from whole kanji written in cursive; a variant also gives the form Taiwan uses.
  const hiraganaKanji = {
    'あ': '安', 'い': '以', 'う': '宇', 'え': '衣', 'お': '於', 'か': '加', 'き': '幾', 'く': '久', 'け': '計', 'こ': '己',
    'さ': '左', 'し': '之', 'す': '寸', 'せ': '世', 'そ': '曾', 'た': '太', 'ち': '知', 'て': '天', 'と': '止',
    'な': '奈', 'に': '仁', 'ぬ': '奴', 'ね': ['祢', '禰'], 'の': '乃', 'は': '波', 'ひ': '比', 'ふ': '不', 'ほ': '保',
    'ま': '末', 'み': '美', 'む': '武', 'め': '女', 'も': '毛', 'や': '也', 'ゆ': '由', 'よ': ['与', '與'],
    'ら': '良', 'り': '利', 'る': '留', 'れ': ['礼', '禮'], 'ろ': '呂', 'わ': '和', 'を': '遠',
  };
  const named = (kanji) => Array.isArray(kanji) ? `「${kanji[0]}」（${kanji[1]}）` : `「${kanji}」`;
  const origins = {
    ...Object.fromEntries(Object.entries(hiraganaKanji).map(([kana, kanji]) => [kana, `由漢字${named(kanji)}草寫變來。`])),
    'へ': '由漢字「部」右邊的「阝」草寫變來。',
    'ア': '取自漢字「阿」左邊的「阝」。', 'イ': '取自漢字「伊」左邊的「亻」。', 'ウ': '取自漢字「宇」上面的「宀」。',
    'エ': '取自漢字「江」右邊的「工」。', 'オ': '取自漢字「於」的左半邊。',
    'カ': '取自漢字「加」左邊的「力」。', 'キ': '由漢字「幾」草寫後簡化而來。', 'ク': '取自漢字「久」的前兩筆。',
    'ケ': '取自漢字「介」的前三筆。', 'コ': '取自漢字「己」的前兩筆。',
    'サ': '一般認為取自漢字「散」的前三筆。', 'シ': '由漢字「之」草寫變來。', 'ス': '由漢字「須」最後三筆的行書寫法變來。',
    'セ': '由漢字「世」草寫變來。', 'ソ': '取自漢字「曾」的前兩筆。',
    'タ': '取自漢字「多」上面的「夕」。', 'チ': '由漢字「千」變來。', 'テ': '取自漢字「天」的前三筆。', 'ト': '取自漢字「止」的前兩筆。',
    'ナ': '取自漢字「奈」的前兩筆。', 'ニ': '由漢字「二」變來。', 'ヌ': '取自漢字「奴」右邊的「又」。',
    'ネ': '取自漢字「祢」（禰）左邊的「礻」。', 'ノ': '取自漢字「乃」的第一筆。',
    'ハ': '一般認為由漢字「八」變來。', 'ヒ': '取自漢字「比」右邊的「匕」。', 'フ': '取自漢字「不」的前兩筆。',
    'ヘ': '由漢字「部」右邊的「阝」草寫變來。', 'ホ': '取自漢字「保」右下的「木」。',
    'マ': '一般認為由漢字「末」和「万」的前兩筆變來。', 'ミ': '由漢字「三」變來。', 'ム': '取自漢字「牟」上面的「厶」。',
    'メ': '由漢字「女」變來。', 'モ': '取自漢字「毛」的後三筆。',
    'ヤ': '由漢字「也」草寫後簡化而來。', 'ユ': '由漢字「由」的最後兩筆變形而來。', 'ヨ': '由漢字「与」（與）變來。',
    'ラ': '取自漢字「良」的前兩筆。', 'リ': '取自漢字「利」右邊的「刂」。', 'ル': '一般認為取自漢字「流」的最後兩筆。',
    'レ': '取自漢字「礼」的最後一筆。', 'ロ': '一般認為取自漢字「呂」上面的「口」。',
    'ワ': '一般認為由漢字「和」右邊的「口」草寫變來。', 'ヲ': '由漢字「乎」的前三筆變形而來。',
  };
  // Checked against the glyphs of Noto Sans JP, the font the cards use.
  const compare = {
    'あ': 'お 右上多一個點；あ 沒有。', 'お': 'あ 沒有右上那個點；お 有。',
    'い': 'り 右邊那筆很長、往下拉；い 兩筆都短。', 'り': 'い 兩筆都短；り 右邊那筆很長、往下拉。',
    'う': 'ら 的下半先往下寫一小段直線，再往右彎；う 一開始就往右彎。', 'ら': 'う 的下半一開始就往右彎；ら 先往下寫一小段直線才彎。',
    'き': 'さ 上面只有一條橫線；き 有兩條。', 'さ': 'き 上面多一條橫線；ち 下面的彎向右鼓起，さ 向左。',
    'ち': 'さ 下面的彎向左鼓起；ち 向右鼓起。',
    'け': 'は 右下多打一個小圈；け 沒有。', 'は': 'ほ 右上多一條橫線；け 右下沒有 は 的小圈。', 'ほ': 'は 右上只有一條橫線；ほ 有兩條。',
    'ま': 'ほ 左邊多一條直線；ま 沒有。', 'よ': 'ま 有兩條橫線穿過直線；よ 只有右邊一條短橫。',
    'ぬ': 'め 右下沒有小圈；ぬ 有。', 'め': 'ぬ 右下多一個小圈；め 沒有。',
    'ね': 'れ 右下往外勾出去，わ 右下是一個大彎；ね 收成小圈。', 'れ': 'ね 右下收成小圈，わ 右下是一個大彎；れ 往外勾出去。',
    'わ': 'ね 右下收成小圈，れ 往外勾出去；わ 是一個大彎。',
    'る': 'ろ 下面沒有小圈；る 有。', 'ろ': 'る 下面多一個小圈；ろ 沒有。',
    'シ': 'ツ 的兩點在上面，長的一筆往左下撇；シ 的兩點在左邊，長的一筆往右上挑。',
    'ツ': 'シ 的兩點在左邊，長的一筆往右上挑；ツ 的兩點在上面，長的一筆往左下撇。',
    'ソ': 'ン 長的一筆比較平，往右上挑；ソ 比較直，往左下撇。', 'ン': 'ソ 長的一筆比較直，往左下撇；ン 比較平，往右上挑。',
    'ク': 'タ 比 ク 中間多一筆短斜線；ケ 上面是平的橫線，從橫線往下拉一條長線。', 'タ': 'ク 中間沒有那一筆短斜線；タ 有。',
    'ケ': 'ク 是一筆往右再彎下來；ケ 上面是平的橫線，往下另拉一條長線。',
    'ウ': 'ワ 頂上沒有 ウ 的短豎；フ 連左邊的短直線也沒有。', 'ワ': 'ウ 頂上多一個短豎；フ 沒有 ワ 左邊的短直線。',
    'フ': 'ワ 左邊多一小段直線，ウ 再加上頂上的短豎；フ 都沒有。',
    'コ': 'ユ 下面的橫線往右超出直線，ロ 四邊都封起來，ヨ 中間多一條橫線；コ 左邊開口，三樣都沒有。', 'ユ': 'コ 下面的橫線不會超出直線；ユ 往右超出。',
    'ロ': 'コ 左邊是開的；ロ 四邊都封起來。', 'ヨ': 'コ 中間沒有橫線；ヨ 多一條。',
    'ナ': 'メ 是兩條斜線交叉，沒有平的橫線；ナ 有。', 'メ': 'ナ 有一條平的橫線；メ 只有兩條斜線交叉。',
    'チ': 'テ 最上面是一條平的短橫；チ 最上面是一筆往左下的短撇。', 'テ': 'チ 最上面是一筆往左下的短撇；テ 是一條平的短橫。',
    'ス': 'ヌ 的短斜線穿過長的那筆；ス 的不穿過。', 'ヌ': 'ス 的短斜線不穿過長的那筆；ヌ 的穿過去，形成交叉。',
    'カ': '和同音的平假名 か 很像，少了右邊的點。', 'キ': '和同音的平假名 き 很像，少了下面的彎。',
    'セ': '和同音的 せ 比：せ 右邊多一條穿過橫線的短直線；セ 是橫線右端往下彎。', 'ヘ': '和同音的平假名 へ 幾乎一樣。', 'モ': '和同音的 も 比：も 的直線穿出最上面的橫線；モ 不出頭。',
    'ヤ': '和同音的 や 比：や 上面中間多一個短點；ヤ 沒有。', 'リ': '和同音的平假名 り 幾乎一樣。',
  };
  // [kana, word, romaji, meaning]: common words a beginner can picture; every copy of the kana in the word is marked.
  // を has none: it is only a particle. ゆ keeps ゆめ because 〜行き（ゆき）on a travel card means 往〜.
  const words = [
    ['あ', 'あめ', 'ame', '雨'], ['い', 'いぬ', 'inu', '狗'], ['う', 'うみ', 'umi', '海'], ['え', 'えき', 'eki', '車站'], ['お', 'おにぎり', 'onigiri', '飯糰'],
    ['か', 'かさ', 'kasa', '傘'], ['き', 'き', 'ki', '樹'], ['く', 'くつ', 'kutsu', '鞋子'], ['け', 'けいたい', 'keitai', '手機'], ['こ', 'こめ', 'kome', '米'],
    ['さ', 'さかな', 'sakana', '魚'], ['し', 'しお', 'shio', '鹽'], ['す', 'すし', 'sushi', '壽司'], ['せ', 'せんせい', 'sensei', '老師'], ['そ', 'そら', 'sora', '天空'],
    ['た', 'たまご', 'tamago', '蛋'], ['ち', 'ちず', 'chizu', '地圖'], ['つ', 'つき', 'tsuki', '月亮'], ['て', 'て', 'te', '手'], ['と', 'とり', 'tori', '鳥'],
    ['な', 'なつ', 'natsu', '夏天'], ['に', 'にく', 'niku', '肉'], ['ぬ', 'いぬ', 'inu', '狗'], ['ね', 'ねこ', 'neko', '貓'], ['の', 'のり', 'nori', '海苔'],
    ['は', 'はな', 'hana', '花'], ['ひ', 'ひと', 'hito', '人'], ['ふ', 'ふね', 'fune', '船'], ['へ', 'へや', 'heya', '房間'], ['ほ', 'ほし', 'hoshi', '星星'],
    ['ま', 'まめ', 'mame', '豆子'], ['み', 'みみ', 'mimi', '耳朵'], ['む', 'むし', 'mushi', '蟲'], ['め', 'め', 'me', '眼睛'], ['も', 'もも', 'momo', '桃子'],
    ['や', 'やま', 'yama', '山'], ['ゆ', 'ゆめ', 'yume', '夢'], ['よ', 'よる', 'yoru', '晚上'],
    ['ら', 'さくら', 'sakura', '櫻花'], ['り', 'りんご', 'ringo', '蘋果'], ['る', 'はる', 'haru', '春天'], ['れ', 'これ', 'kore', '這個'], ['ろ', 'いろ', 'iro', '顏色'],
    ['わ', 'わたし', 'watashi', '我'], ['ん', 'ほん', 'hon', '書'],
    ['ア', 'アニメ', 'anime', '動畫'], ['イ', 'イヤホン', 'iyahon', '耳機'], ['ウ', 'ウクレレ', 'ukurere', '烏克麗麗'], ['エ', 'エアコン', 'eakon', '冷氣'], ['オ', 'オレンジ', 'orenji', '柳橙'],
    ['カ', 'カメラ', 'kamera', '相機'], ['キ', 'キウイ', 'kiui', '奇異果'], ['ク', 'クラス', 'kurasu', '班級'], ['ケ', 'ケーキ', 'keeki', '蛋糕'], ['コ', 'コーヒー', 'koohii', '咖啡'],
    ['サ', 'サラダ', 'sarada', '沙拉'], ['シ', 'タクシー', 'takushii', '計程車'], ['ス', 'バス', 'basu', '公車'], ['セ', 'セーター', 'seetaa', '毛衣'], ['ソ', 'ソファ', 'sofa', '沙發'],
    ['タ', 'タオル', 'taoru', '毛巾'], ['チ', 'チーズ', 'chiizu', '起司'], ['ツ', 'ツナ', 'tsuna', '鮪魚'], ['テ', 'テレビ', 'terebi', '電視'], ['ト', 'トマト', 'tomato', '番茄'],
    ['ナ', 'バナナ', 'banana', '香蕉'], ['ニ', 'テニス', 'tenisu', '網球'], ['ネ', 'ネクタイ', 'nekutai', '領帶'], ['ノ', 'ノート', 'nooto', '筆記本'],
    ['ハ', 'ハム', 'hamu', '火腿'], ['ヒ', 'ヒント', 'hinto', '提示'], ['フ', 'フルーツ', 'furuutsu', '水果'], ['ヘ', 'ヘルメット', 'herumetto', '安全帽'], ['ホ', 'ホテル', 'hoteru', '飯店'],
    ['マ', 'マスク', 'masuku', '口罩'], ['ミ', 'ミルク', 'miruku', '牛奶'], ['ム', 'ゲーム', 'geemu', '遊戲'], ['メ', 'メロン', 'meron', '哈密瓜'], ['モ', 'メモ', 'memo', '便條'],
    ['ヤ', 'タイヤ', 'taiya', '輪胎'], ['ユ', 'ユーロ', 'yuuro', '歐元'], ['ヨ', 'ヨーグルト', 'yooguruto', '優格'],
    ['ラ', 'ラーメン', 'raamen', '拉麵'], ['リ', 'リモコン', 'rimokon', '遙控器'], ['ル', 'ビール', 'biiru', '啤酒'], ['レ', 'レモン', 'remon', '檸檬'], ['ロ', 'ロボット', 'robotto', '機器人'],
    ['ワ', 'ワイン', 'wain', '葡萄酒'], ['ン', 'パン', 'pan', '麵包'],
  ];
  const data = Object.create(null);
  const basic = 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをんアイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
  const example = Object.fromEntries(words.map(([kana, word, romaji, meaning]) => [kana, Object.freeze({ label: '例子', word, romaji, meaning, text: `${word}（${romaji}）${meaning}` })]));
  for (const kana of basic) {
    data[kana] = Object.freeze([
      origins[kana] && Object.freeze({ label: '字源', text: origins[kana] }),
      compare[kana] && Object.freeze({ label: '比一比', text: compare[kana] }),
      example[kana],
    ].filter(Boolean));
  }
  // Voiced (゛) and semi-voiced (゜) kana reuse the base shape, so their hint points back to it.
  const voiced = [
    ['かきくけこ', 'ka ki ku ke ko', 'ga gi gu ge go'], ['さしすせそ', 'sa shi su se so', 'za ji zu ze zo'],
    ['たちつてと', 'ta chi tsu te to', 'da ji zu de do'], ['はひふへほ', 'ha hi fu he ho', 'ba bi bu be bo'],
    ['はひふへほ', 'ha hi fu he ho', 'pa pi pu pe po'],
  ];
  voiced.forEach(([bases, baseReadings, readings], row) => {
    const semi = row === 4, from = baseReadings.split(' '), to = readings.split(' ');
    for (const katakana of [false, true]) [...bases].forEach((plain, i) => {
      const base = katakana ? String.fromCharCode(plain.charCodeAt(0) + 0x60) : plain;
      const letter = (base + (semi ? '゚' : '゙')).normalize('NFC');
      data[letter] = Object.freeze([Object.freeze({ label: semi ? '半濁點' : '濁點', text: `${base} 右上加${semi ? '一個小圈（半濁點）' : '兩點（濁點）'}，讀音從 ${from[i]} 變成 ${to[i]}。` })]);
    });
  });
  // Contracted sounds (拗音): a small ゃ／ゅ／ょ joins the i-column kana into one beat.
  const contracted = [
    ['き', 'ki', 'kya kyu kyo'], ['し', 'shi', 'sha shu sho'], ['ち', 'chi', 'cha chu cho'], ['に', 'ni', 'nya nyu nyo'],
    ['ひ', 'hi', 'hya hyu hyo'], ['み', 'mi', 'mya myu myo'], ['り', 'ri', 'rya ryu ryo'], ['ぎ', 'gi', 'gya gyu gyo'],
    ['じ', 'ji', 'ja ju jo'], ['び', 'bi', 'bya byu byo'], ['ぴ', 'pi', 'pya pyu pyo'],
  ];
  const smalls = [['ゃ', 'や', 'ya'], ['ゅ', 'ゆ', 'yu'], ['ょ', 'よ', 'yo']];
  const toKatakana = (text) => [...text].map((ch) => String.fromCharCode(ch.charCodeAt(0) + 0x60)).join('');
  for (const [plain, baseReading, readings] of contracted) {
    const to = readings.split(' ');
    for (const katakana of [false, true]) smalls.forEach(([small, big, smallReading], i) => {
      const kana = (text) => katakana ? toKatakana(text) : text;
      const base = kana(plain), mark = kana(small), full = kana(big);
      data[base + mark] = Object.freeze([Object.freeze({ label: '拗音', text: `${base}（${baseReading}）後面接小的 ${mark}（${smallReading}），合成一拍讀 ${to[i]}；寫成大的 ${full} 就是 ${base}、${full} 兩個音。` })]);
    });
  }
  // Natural everyday spellings, including both scripts. The optional fifth value
  // marks the same sound in the other script rather than inventing unusual spellings.
  const extendedWords = [
    ["が", "がくせい", "gakusei", "學生"],
    ["ぎ", "ぎんこう", "ginkou", "銀行"],
    ["ぐ", "ぐあい", "guai", "身體狀況"],
    ["げ", "げんき", "genki", "元氣"],
    ["ご", "ごはん", "gohan", "飯"],
    ["ざ", "ざるそば", "zarusoba", "蕎麥涼麵"],
    ["じ", "じかん", "jikan", "時間"],
    ["ず", "みず", "mizu", "水"],
    ["ぜ", "ぜんぶ", "zenbu", "全部"],
    ["ぞ", "ぞう", "zou", "大象"],
    ["だ", "だいじょうぶ", "daijoubu", "沒問題"],
    ["ぢ", "はなぢ", "hanaji", "鼻血"],
    ["づ", "つづく", "tsuzuku", "繼續"],
    ["で", "でぐち", "deguchi", "出口"],
    ["ど", "どこ", "doko", "哪裡"],
    ["ば", "ばんごはん", "bangohan", "晚餐"],
    ["び", "びん", "bin", "瓶子"],
    ["ぶ", "ぶた", "buta", "豬"],
    ["べ", "べんとう", "bentou", "便當"],
    ["ぼ", "ぼうし", "boushi", "帽子"],
    ["ぱ", "パン", "pan", "麵包", "パ"],
    ["ぴ", "ピザ", "piza", "披薩", "ピ"],
    ["ぷ", "プリン", "purin", "布丁", "プ"],
    ["ぺ", "ペン", "pen", "筆", "ペ"],
    ["ぽ", "ポスト", "posuto", "郵筒", "ポ"],
    ["きゃ", "きゃく", "kyaku", "客人"],
    ["きゅ", "きゅう", "kyuu", "九"],
    ["きょ", "きょう", "kyou", "今天"],
    ["しゃ", "しゃしん", "shashin", "照片"],
    ["しゅ", "しゅっぱつ", "shuppatsu", "出發"],
    ["しょ", "しょくじ", "shokuji", "用餐"],
    ["ちゃ", "おちゃ", "ocha", "茶"],
    ["ちゅ", "ちゅうもん", "chuumon", "點餐"],
    ["ちょ", "ちょっと", "chotto", "一下、稍微"],
    ["にゃ", "にゃんこ", "nyanko", "貓咪"],
    ["にゅ", "にゅうよく", "nyuuyoku", "泡澡"],
    ["にょ", "にょう", "nyou", "尿液"],
    ["ひゃ", "ひゃく", "hyaku", "一百"],
    ["ひゅ", "ひゅうひゅう", "hyuuhyuu", "風呼呼吹的聲音"],
    ["ひょ", "じこくひょう", "jikokuhyou", "時刻表"],
    ["みゃ", "みゃく", "myaku", "脈搏"],
    ["みゅ", "ミュージック", "myuujikku", "音樂", "ミュ"],
    ["みょ", "みょうにち", "myounichi", "明天（較正式）"],
    ["りゃ", "りゃくご", "ryakugo", "縮寫"],
    ["りゅ", "リュック", "ryukku", "背包", "リュ"],
    ["りょ", "りょうきん", "ryoukin", "費用"],
    ["ぎゃ", "ぎゃく", "gyaku", "相反方向"],
    ["ぎゅ", "ぎゅうにく", "gyuuniku", "牛肉"],
    ["ぎょ", "ぎょうざ", "gyouza", "餃子"],
    ["じゃ", "じゃがいも", "jagaimo", "馬鈴薯"],
    ["じゅ", "じゅう", "juu", "十"],
    ["じょ", "じょせい", "josei", "女性"],
    ["びゃ", "さんびゃく", "sanbyaku", "三百"],
    ["びゅ", "ビュッフェ", "byuffe", "自助餐", "ビュ"],
    ["びょ", "びょういん", "byouin", "醫院"],
    ["ぴゃ", "ろっぴゃく", "roppyaku", "六百"],
    ["ぴゅ", "ピューレ", "pyuure", "蔬果泥", "ピュ"],
    ["ぴょ", "ぴょんぴょん", "pyonpyon", "蹦蹦跳跳"],
    ["ガ", "ガイド", "gaido", "導遊"],
    ["ギ", "ギター", "gitaa", "吉他"],
    ["グ", "グラス", "gurasu", "玻璃杯"],
    ["ゲ", "ゲーム", "geemu", "遊戲"],
    ["ゴ", "ゴミ", "gomi", "垃圾"],
    ["ザ", "ピザ", "piza", "披薩"],
    ["ジ", "ジーンズ", "jiinzu", "牛仔褲"],
    ["ズ", "ズボン", "zubon", "褲子"],
    ["ゼ", "ゼリー", "zerii", "果凍"],
    ["ゾ", "ゾーン", "zoon", "區域"],
    ["ダ", "サンダル", "sandaru", "涼鞋"],
    ["ヂ", "はなぢ", "hanaji", "鼻血", "ぢ"],
    ["ヅ", "つづく", "tsuzuku", "繼續", "づ"],
    ["デ", "デザート", "dezaato", "甜點"],
    ["ド", "ドア", "doa", "門"],
    ["バ", "バス", "basu", "公車"],
    ["ビ", "ビール", "biiru", "啤酒"],
    ["ブ", "ブラシ", "burashi", "刷子"],
    ["ベ", "ベッド", "beddo", "床"],
    ["ボ", "ボタン", "botan", "按鈕"],
    ["パ", "パン", "pan", "麵包"],
    ["ピ", "ピザ", "piza", "披薩"],
    ["プ", "プリン", "purin", "布丁"],
    ["ペ", "ペン", "pen", "筆"],
    ["ポ", "ポスト", "posuto", "郵筒"],
    ["キャ", "キャッシュ", "kyasshu", "現金"],
    ["キュ", "キュウリ", "kyuuri", "小黃瓜"],
    ["キョ", "きょう", "kyou", "今天", "きょ"],
    ["シャ", "シャワー", "shawaa", "淋浴"],
    ["シュ", "シュークリーム", "shuukuriimu", "泡芙"],
    ["ショ", "ショッピング", "shoppingu", "購物"],
    ["チャ", "チャーハン", "chaahan", "炒飯"],
    ["チュ", "チューブ", "chuubu", "軟管"],
    ["チョ", "チョコレート", "chokoreeto", "巧克力"],
    ["ニャ", "ニャー", "nyaa", "喵叫聲"],
    ["ニュ", "ニュース", "nyuusu", "新聞"],
    ["ニョ", "にょう", "nyou", "尿液", "にょ"],
    ["ヒャ", "ひゃく", "hyaku", "一百", "ひゃ"],
    ["ヒュ", "ひゅうひゅう", "hyuuhyuu", "風呼呼吹的聲音", "ひゅ"],
    ["ヒョ", "じこくひょう", "jikokuhyou", "時刻表", "ひょ"],
    ["ミャ", "みゃく", "myaku", "脈搏", "みゃ"],
    ["ミュ", "ミュージック", "myuujikku", "音樂"],
    ["ミョ", "みょうにち", "myounichi", "明天（較正式）", "みょ"],
    ["リャ", "りゃくご", "ryakugo", "縮寫", "りゃ"],
    ["リュ", "リュック", "ryukku", "背包"],
    ["リョ", "りょうきん", "ryoukin", "費用", "りょ"],
    ["ギャ", "ギャラリー", "gyararii", "藝廊"],
    ["ギュ", "ぎゅうにく", "gyuuniku", "牛肉", "ぎゅ"],
    ["ギョ", "ギョーザ", "gyooza", "餃子"],
    ["ジャ", "ジャム", "jamu", "果醬"],
    ["ジュ", "ジュース", "juusu", "果汁"],
    ["ジョ", "ジョギング", "jogingu", "慢跑"],
    ["ビャ", "さんびゃく", "sanbyaku", "三百", "びゃ"],
    ["ビュ", "ビュッフェ", "byuffe", "自助餐"],
    ["ビョ", "びょういん", "byouin", "醫院", "びょ"],
    ["ピャ", "ろっぴゃく", "roppyaku", "六百", "ぴゃ"],
    ["ピュ", "ピューレ", "pyuure", "蔬果泥"],
    ["ピョ", "ピョンピョン", "pyonpyon", "蹦蹦跳跳"],
  ];
  for (const [letter, word, romaji, meaning, match = letter] of extendedWords) {
    const example = Object.freeze({ label: '例子', word, romaji, meaning, match, text: `${word}（${romaji}）${meaning}` });
    data[letter] = Object.freeze([...data[letter], example]);
  }
  Object.freeze(data);
  const empty = Object.freeze([]);
  return Object.freeze({
    get(letter) { return typeof letter === 'string' && Object.hasOwn(data, letter) ? data[letter] : empty; },
    notice: '字源依日文辭典的記載；例子裡的詞只是陪你記讀音，不用背，練習也不會考。',
  });
})();
