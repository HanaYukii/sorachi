"use strict";

// Beginner courses share one small, browser-local state. No account is required.
const Study = (() => {
  const ROWS = [
    ["a", "あ行", "あいうえお", "アイウエオ", ["a", "i", "u", "e", "o"]],
    ["ka", "か行", "かきくけこ", "カキクケコ", ["ka", "ki", "ku", "ke", "ko"]],
    ["sa", "さ行", "さしすせそ", "サシスセソ", ["sa", "shi", "su", "se", "so"]],
    ["ta", "た行", "たちつてと", "タチツテト", ["ta", "chi", "tsu", "te", "to"]],
    ["na", "な行", "なにぬねの", "ナニヌネノ", ["na", "ni", "nu", "ne", "no"]],
    ["ha", "は行", "はひふへほ", "ハヒフヘホ", ["ha", "hi", "fu", "he", "ho"]],
    ["ma", "ま行", "まみむめも", "マミムメモ", ["ma", "mi", "mu", "me", "mo"]],
    ["ya", "や行", "やゆよ", "ヤユヨ", ["ya", "yu", "yo"]],
    ["ra", "ら行", "らりるれろ", "ラリルレロ", ["ra", "ri", "ru", "re", "ro"]],
    ["wa", "わ・を・ん", "わをん", "ワヲン", ["wa", "o", "n"]],
  ];
  const GRAMMAR = [
    {
      id: "g-identity", type: "grammar", title: "A 是 B：は・です", subtitle: "名詞句的基本結構",
      steps: [
        { title: "本課單字", example: "わたし ／ がくせい", reading: "watashi / gakusei", meaning: "我 ／ 學生", body: "本課用這兩個詞，練習自我介紹。" },
        { title: "句型：A は B です", example: "わたしは がくせいです。", reading: "watashi wa gakusei desu", meaning: "我是學生。", body: "「わたし」是我，「がくせい」是學生。在這種「A 是 B」的句子裡，用「は」接起來，再以「です」結尾；這是比較禮貌的說法。" },
        { title: "助詞 は 的讀音", example: "わたし は がくせい です。", reading: "watashi wa gakusei desu", meaning: "說到我：我是學生。", body: "這裡的「は」標出我們正在說誰，要讀成 wa。雖然念 wa，寫的仍是「は」，不是「わ」。" },
      ],
      questions: [
        { prompt: "想說「我是學生。」：わたしは がくせい＿＿。最後應放哪一個？", options: ["です", "は", "わたし"], answer: 0, explanation: "句尾放「です」，就是「わたしは がくせいです。」——我是學生。" },
        { prompt: "在「わたしは がくせいです。」裡，連接兩部分的「は」讀作什麼？", options: ["ha", "wa", "ka"], answer: 1, explanation: "這裡的「は」是標出主題的小詞，讀作 wa；寫法仍然是「は」。" },
      ],
    },
    {
      id: "g-question", type: "grammar", title: "疑問句：〜ですか", subtitle: "用「か」表示疑問",
      steps: [
        { title: "敘述句：〜です", example: "がくせいです。", reading: "gakusei desu", meaning: "是學生。", body: "「がくせい」是學生，「です」讓這個名詞句以比較禮貌的方式結尾。這句話是在說明，不是在發問。" },
        { title: "疑問句：〜ですか", example: "がくせいですか？", reading: "gakusei desu ka", meaning: "是學生嗎？", body: "在剛才的「です」後面加上「か」，就能把說明變成問題。「か」讀作 ka。" },
        { title: "情境清楚時，可省略人稱", example: "がくせいですか？", reading: "gakusei desu ka", meaning: "你是學生嗎？", body: "例如正面對一個人、詢問他的身分時，這句就是「你是學生嗎？」。日文常把情境裡已經清楚的人省略，不必每句都加上「你」。" },
      ],
      questions: [
        { prompt: "正面對一個人，詢問他的身分。「がくせいですか？」在問什麼？", options: ["你是學生嗎？", "我是學生。", "我是老師。"], answer: 0, explanation: "句尾有「か」，是在發問。這個情境下，意思是「你是學生嗎？」。" },
        { prompt: "想把「是學生。」改成「是學生嗎？」：がくせいです＿＿？要加哪一個？", options: ["わたし", "は", "か"], answer: 2, explanation: "在「です」後加「か」：がくせいですか？意思是「是學生嗎？」。" },
      ],
    },
    {
      id: "g-demo", type: "grammar", title: "指示詞：これ・それ・あれ", subtitle: "依物品的位置選擇指示詞",
      steps: [
        { title: "靠近我：これ", example: "これは パンです。", reading: "kore wa pan desu", meaning: "這是麵包。", body: "先認識「パン」：麵包。說眼前的物品時，靠近說話者自己的東西用「これ」。例如你拿在手上的麵包。" },
        { title: "靠近對方：それ", example: "それは パンです。", reading: "sore wa pan desu", meaning: "那是麵包。（靠近對方）", body: "物品靠近你正在說話的對象、離你較遠時，用「それ」。例如朋友在幾步外，拿著一個麵包。" },
        { title: "離我們都遠：あれ", example: "あれは パンです。", reading: "are wa pan desu", meaning: "那是麵包。（離兩人都遠）", body: "物品離說話者和聽話者都遠時，用「あれ」。這裡介紹指眼前物品的用法，不用來稱呼人。" },
      ],
      questions: [
        { prompt: "你拿著一個麵包，朋友站在離你幾步外。你想說「這是麵包。」：＿＿は パンです。", options: ["それ", "これ", "あれ"], answer: 1, explanation: "麵包就在說話的你手上，靠近你自己，所以用「これ」。" },
        { prompt: "你和朋友站在一起。麵包放在房間另一頭，離你們兩人都很遠。你指著它說：＿＿は パンです。", options: ["あれ", "それ", "これ"], answer: 0, explanation: "麵包離說話的你和聽話的朋友都遠，所以用「あれ」。" },
      ],
    },
  ];
  const TRAVEL = [
    {
      id: "t-place", type: "grammar", group: "travel", title: "問位置：廁所、車站", subtitle: "トイレ・駅・どこ",
      steps: [
        { title: "找廁所", keywords: [["トイレ", "toire", "廁所"], ["どこ", "doko", "哪裡"]], example: "トイレ？", reading: "toire?", meaning: "廁所？", body: "對店員用疑問語氣說「トイレ？」，對方通常就知道你在找廁所。想說清楚位置，可以加上「どこ」（哪裡）。", polite: "トイレはどこですか？", politeReading: "toire wa doko desu ka", politeMeaning: "廁所在哪裡？" },
        { title: "找車站", keywords: [["駅（えき）", "eki", "車站"], ["どこ", "doko", "哪裡"]], example: "駅、どこですか？", reading: "eki, doko desu ka", meaning: "車站，在哪裡？", body: "把「トイレ」換成「駅」，就能問車站在哪裡。也可以指著地圖上的車站，幫對方確認你想去哪。", polite: "駅はどこですか？", politeReading: "eki wa doko desu ka", politeMeaning: "車站在哪裡？" },
      ],
      questions: [
        { prompt: "你想找廁所，先對店員說哪個關鍵字？", options: ["トイレ", "駅", "どこ"], answer: 0, explanation: "「トイレ」是廁所。用疑問語氣說，對方可能就知道你在找廁所；「どこ」則是問哪裡。" },
        { prompt: "「駅、どこですか？」中的「どこ」，是在問什麼？", options: ["要一個", "在哪裡", "要結帳"], answer: 1, explanation: "「どこ」是「哪裡」。把地點名稱放在前面，就能表達你想找哪個地方。" },
      ],
    },
    {
      id: "t-order", type: "grammar", group: "travel", title: "點餐：品項、數量、冷熱與份量", subtitle: "これ・ふたつ・ホット・並盛",
      steps: [
        { title: "指著菜單選餐點", keywords: [["これ", "kore", "這個"], ["お願いします", "onegaishimasu", "麻煩你／請幫我"]], example: "これ、お願いします。", reading: "kore, onegaishimasu", meaning: "我要這個，麻煩你。", body: "指著菜單上的餐點說「これ」，店員通常就知道你選哪一道。加上「お願いします」更有禮貌。" },
        { title: "點一份、兩份、三份", keywords: [["ひとつ", "hitotsu", "一個／一份"], ["ふたつ", "futatsu", "兩個／兩份"], ["みっつ", "mittsu", "三個／三份"]], example: "これ、ふたつ。", reading: "kore, futatsu", meaning: "這個，兩份。", body: "指著菜單上的同一道餐點，說數量，店員通常就能理解。要一份換成「ひとつ」，三份換成「みっつ」。「みっつ」的小「っ」要停頓一下。", polite: "これ、ふたつお願いします。", politeReading: "kore, futatsu onegaishimasu", politeMeaning: "這個請給我兩份。" },
        { title: "飲料：熱的、冰的", keywords: [["ホット", "hotto", "熱的"], ["アイス", "aisu", "冰的"]], example: "アイス。", reading: "aisu", meaning: "冰的。", body: "已經選好飲料，店員確認冷熱時，回答「ホット」或「アイス」即可。這裡的「アイス」指冰飲。", polite: "アイスでお願いします。", politeReading: "aisu de onegaishimasu", politeMeaning: "請幫我做冰的。", extra: { title: "進階補充：點酒的喝法", keywords: [["ロック", "rokku", "加冰塊喝"], ["ソーダ割り（ソーダわり）", "sooda wari", "加蘇打水喝"]], example: "ロックで。 ／ ソーダ割りで。", reading: "rokku de / sooda wari de", meaning: "加冰。／加蘇打水。", body: "已經選好威士忌或燒酎等酒款，店員問喝法時，可以這樣回答。「ロック」是酒加冰塊；「ソーダ割り」是酒加蘇打水。" } },
        { title: "烏龍麵：熱的、冷的", keywords: [["温かい（あたたかい）", "atatakai", "熱的／溫熱的"], ["冷たい（つめたい）", "tsumetai", "冷的"]], example: "温かいの。", reading: "atatakai no", meaning: "熱的那個。", body: "點烏龍麵，店員確認要熱的還是冷的時，回答「温かい」或「冷たい」，通常就能理解。加上「の」就是「熱的／冷的那個」。", polite: "温かいの、お願いします。", politeReading: "atatakai no, onegaishimasu", politeMeaning: "請給我熱的。" },
        { title: "飯量：一般份、大份", keywords: [["並盛（なみもり）", "namimori", "一般份量"], ["大盛（おおもり）", "oomori", "大份"]], example: "並盛。", reading: "namimori", meaning: "一般份量。", body: "例如點牛丼，菜單有列份量、店員詢問要哪一種時，回答「並盛」或「大盛」即可。「大盛」開頭的 o 音要拉長。", polite: "並盛でお願いします。", politeReading: "namimori de onegaishimasu", politeMeaning: "請給我一般份量。" },
      ],
      questions: [
        { prompt: "你指著菜單上一道餐點說「これ」，是什麼意思？", options: ["一份", "這個", "結帳"], answer: 1, explanation: "「これ」是「這個」。指著品項，店員才知道你要的是哪一個。" },
        { prompt: "你指著菜單上的一道餐點，想要兩份，要說哪個？", options: ["ひとつ", "みっつ", "ふたつ"], answer: 2, explanation: "「ふたつ」是兩個或兩份。指著品項說「これ、ふたつ」，就是「這個，兩份」。" },
      ],
    },
    {
      id: "t-pay", type: "grammar", group: "travel", title: "結帳：請店員算錢", subtitle: "会計（kaikei）・お願いします",
      steps: [
        { title: "吃完後要結帳", keywords: [["会計（かいけい）", "kaikei", "結帳"]], example: "会計。", reading: "kaikei", meaning: "結帳。", body: "餐廳吃完，向店員說「会計」，通常就能表達想結帳。「お会計」是常見的較客氣說法，意思一樣。", polite: "お会計、お願いします。", politeReading: "okaikei, onegaishimasu", politeMeaning: "麻煩幫我結帳。" },
        { title: "在需求後加上禮貌用語", keywords: [["お願いします", "onegaishimasu", "麻煩你／請幫我"], ["お会計（おかいけい）", "okaikei", "結帳"]], example: "お会計、お願いします。", reading: "okaikei, onegaishimasu", meaning: "麻煩幫我結帳。", body: "「お会計」是你要做的事，「お願いします」是「麻煩你」。先說需求，再加上這句就可以。" },
      ],
      questions: [
        { prompt: "吃完飯對店員說「お会計」，是在表達什麼需求？", options: ["想結帳", "想加點餐點", "想找廁所"], answer: 0, explanation: "「お会計」是結帳。可以說「お会計、お願いします」。" },
        { prompt: "在「お会計、お願いします」中，「お願いします」有什麼作用？", options: ["告訴店員要一份", "讓請求更有禮貌", "詢問廁所的位置"], answer: 1, explanation: "需求是「お会計」，「お願いします」則是「麻煩你／請幫我」。" },
      ],
    },
    {
      id: "t-charge", type: "grammar", group: "travel", title: "交通卡加值", subtitle: "チャージ・1000 円",
      steps: [
        { title: "請店員幫交通卡加值", keywords: [["チャージ", "chaaji", "加值"], ["お願いします", "onegaishimasu", "麻煩你／請幫我"]], example: "チャージ、お願いします。", reading: "chaaji, onegaishimasu", meaning: "麻煩幫我加值。", body: "在支援加值的超商櫃檯，出示交通卡說「チャージ」，再告訴店員金額。這裡指交通卡加值；「aa」是拉長的 a 音。" },
        { title: "告訴店員加值金額", keywords: [["1000 円（せんえん）", "sen en", "一千日圓"], ["チャージ", "chaaji", "加值"]], example: "1000 円、お願いします。", reading: "sen en, onegaishimasu", meaning: "一千日圓，麻煩你。", body: "店員已經知道你要加值時，接著說「1000 円」就能表達金額：一千日圓。", polite: "1000 円、チャージお願いします。", politeReading: "sen en, chaaji onegaishimasu", politeMeaning: "麻煩加值一千日圓。" },
      ],
      questions: [
        { prompt: "在支援加值的超商櫃檯，出示交通卡說「チャージ」，是什麼意思？", options: ["替手機充電", "買一張車票", "替交通卡加值"], answer: 2, explanation: "在交通卡的情境裡，「チャージ」是加值；還要告訴店員金額。" },
        { prompt: "店員已知道你要加值。你說「1000 円」，是在告訴他什麼？", options: ["加值一千日圓", "要一千張卡", "問車站的位置"], answer: 0, explanation: "「1000 円」讀 sen en，是一千日圓。這裡用來說明加值金額。" },
      ],
    },
  ];
  // The phrasebook reads independently of course attempts and scores.
  const phrase = (title, keywords, body, example, reading, meaning) => ({ title, keywords, body, example, reading, meaning });
  const PHRASEBOOK = [
    { id: "basics", title: "找人幫忙、聽不懂時", subtitle: "叫店員・再說一次・慢一點", steps: [
      phrase("叫一下店員", [["すみません", "sumimasen", "不好意思"]], "想請店員幫忙時，可以先說這個字，等對方回應再說需求。", "すみません。", "sumimasen", "不好意思。"),
      phrase("請對方再說一次", [["もう一度（もういちど）", "mou ichido", "再一次"]], "剛才沒聽清楚，說「もう一度」，對方通常就知道你想再聽一次。", "もう一度、お願いします。", "mou ichido, onegaishimasu", "麻煩再說一次。"),
      phrase("請對方慢一點", [["ゆっくり", "yukkuri", "慢慢地"]], "對方說太快時，可以用這個詞請他放慢。", "ゆっくり話してください。", "yukkuri hanashite kudasai", "請慢一點說。"),
      phrase("回應與道謝", [["はい", "hai", "是／好"], ["いいえ", "iie", "不是"], ["ありがとう", "arigatou", "謝謝"]], "確認選項時用「はい／いいえ」。受到幫忙後，可以說謝謝。", "ありがとうございます。", "arigatou gozaimasu", "謝謝您。"),
    ] },
    { ...TRAVEL.find(c => c.id === "t-order"), title: "點餐：數量、冷熱、份量", subtitle: "一到三份・熱的或冷的・一般份或大份" },
    { id: "dining", title: "內用外帶、用餐需求", subtitle: "內用・外帶・水・不需要", steps: [
      phrase("內用還是外帶", [["店内（てんない）", "tennai", "內用"], ["持ち帰り（もちかえり）", "mochikaeri", "外帶"]], "店員問在哪裡吃時，直接回答其中一個即可。", "持ち帰りでお願いします。", "mochikaeri de onegaishimasu", "我要外帶，麻煩你。"),
      phrase("想要水", [["お水（おみず）", "omizu", "水"]], "在餐廳向店員表示想要水，可以說「お水」。", "お水をお願いします。", "omizu o onegaishimasu", "麻煩給我水。"),
      phrase("再來一杯或一碗", [["おかわり", "okawari", "續杯／再一碗"]], "指著杯子或碗說，讓店員知道你想再來一份。是否能續、是否收費要依店家確認。", "おかわりをお願いします。", "okawari o onegaishimasu", "麻煩再給我一份。"),
      phrase("回答不需要", [["いりません", "irimasen", "不需要"]], "店員問要不要袋子、收據等物品時，可以用這句回答。", "袋はいりません。", "fukuro wa irimasen", "我不需要袋子。"),
    ] },
    { ...TRAVEL.find(c => c.id === "t-pay"), title: "結帳與付款", subtitle: "会計・刷卡・現金", steps: [...TRAVEL.find(c => c.id === "t-pay").steps,
      phrase("刷卡或付現金", [["カード", "kaado", "卡片／刷卡"], ["現金（げんきん）", "genkin", "現金"]], "店員問付款方式時，回答「カード」或「現金」。不確定能不能刷卡時，可以展開下面的問法。", "カードは使えますか？", "kaado wa tsukaemasu ka", "可以刷卡嗎？"),
    ] },
    { id: "shopping", title: "買東西", subtitle: "價格・袋子・收據・試穿", steps: [
      phrase("問價格", [["いくら", "ikura", "多少錢"]], "指著想買的商品詢問，對方才知道你在問哪一樣。", "これはいくらですか？", "kore wa ikura desu ka", "這個多少錢？"),
      phrase("需要袋子", [["袋（ふくろ）", "fukuro", "袋子"]], "結帳時說「袋」，可以讓店員知道你需要袋子。袋子可能另外收費。", "袋をお願いします。", "fukuro o onegaishimasu", "麻煩給我袋子。"),
      phrase("需要收據", [["レシート", "reshiito", "購物收據"]], "結帳時，可以用這個詞索取一般購物收據。", "レシートをお願いします。", "reshiito o onegaishimasu", "麻煩給我收據。"),
      phrase("想試穿", [["試着（しちゃく）", "shichaku", "試穿"]], "拿著想試的衣服問店員。說「試着、いいですか？」就能表達想試穿。", "試着してもいいですか？", "shichaku shite mo ii desu ka", "可以試穿嗎？"),
    ] },
    { ...TRAVEL.find(c => c.id === "t-place"), title: "找廁所、問位置", subtitle: "廁所・車站・出口・電梯", steps: [...TRAVEL.find(c => c.id === "t-place").steps,
      phrase("看標示、找設施", [["出口（でぐち）", "deguchi", "出口"], ["エレベーター", "erebeetaa", "電梯"], ["改札（かいさつ）", "kaisatsu", "車站驗票閘門"]], "記住這幾個名稱，找標示時用得上。問路時可以把名稱接在「どこですか」前面。", "エレベーターはどこですか？", "erebeetaa wa doko desu ka", "電梯在哪裡？"),
    ] },
    { ...TRAVEL.find(c => c.id === "t-charge"), subtitle: "チャージ・加值金額" },
    { id: "hotel", title: "飯店與預約", subtitle: "入住・已預約・寄放行李", steps: [
      phrase("辦理入住", [["チェックイン", "chekku in", "辦理入住"]], "到飯店櫃檯說「チェックイン」，就能讓工作人員知道你的來意。", "チェックインをお願いします。", "chekku in o onegaishimasu", "麻煩幫我辦理入住。"),
      phrase("告訴對方已經預約", [["予約（よやく）", "yoyaku", "預約／訂位"], ["予約してます", "yoyaku shitemasu", "我有預約"]], "在飯店或餐廳，說完已有預約，再告訴對方名字或出示訂單。", "予約しています。", "yoyaku shite imasu", "我有預約。"),
      phrase("想寄放行李", [["荷物（にもつ）", "nimotsu", "行李"], ["預けたい（あずけたい）", "azuketai", "想寄放"]], "指著行李說「荷物、預けたいです」，表達想寄放。單說「荷物」還沒有說明你需要什麼協助。", "荷物を預けてもいいですか？", "nimotsu o azukete mo ii desu ka", "可以寄放行李嗎？"),
    ] },
  ];
  const travelItem = (id) => PHRASEBOOK.find(item => item.id === id);
  const courses = Object.create(null);
  for (const course of [...GRAMMAR, ...TRAVEL]) courses[course.id] = course;
  for (const script of ["h", "k"]) {
    for (const [key, row, hiragana, katakana, readings] of ROWS) {
      const id = `${script}-${key}`;
      courses[id] = {
        id, type: "kana", script, row,
        title: `${script === "h" ? "平假名" : "片假名"}・${row}`,
        letters: [...(script === "h" ? hiragana : katakana)],
        spoken: [...hiragana], readings,
      };
    }
  }
  let api;
  let audioGeneration = 0;
  let voicesListening = false;
  const escape = (text) => String(text).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  const size = (course) => course.type === "kana" ? course.letters.length : course.questions.length;
  const cards = (course) => course.type === "kana" ? course.letters.length : course.steps.length;
  const title = (id) => courses[id]?.title || null;
  const travelTitle = (id) => travelItem(id)?.title || null;
  const total = (id) => courses[id] ? size(courses[id]) : 0;
  const iso = (value) => typeof value === "string" && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : null;
  const permutation = (value, n) => Array.isArray(value) && value.length === n && new Set(value).size === n && value.every((v) => Number.isInteger(v) && v >= 0 && v < n);
  const shuffle = (n) => {
    const list = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  };
  const blankCourse = () => ({ attempts: 0, completedAt: null, lastResult: null, active: null });
  function freshAttempt(course, attempts) {
    return {
      phase: "cards", cursor: 0, order: shuffle(size(course)),
      options: Array.from({ length: size(course) }, (_, q) => shuffle(course.type === "kana" ? size(course) : course.questions[q].options.length)),
      direction: course.type === "kana" && attempts % 2 === 1 ? "reading" : "character",
      first: {}, solved: {}, wrong: null,
    };
  }
  function sanitize(saved) {
    const state = { script: saved?.script === "k" ? "k" : "h", courses: {} };
    for (const [id, course] of Object.entries(courses)) {
      const raw = saved?.courses?.[id];
      if (!raw || typeof raw !== "object") continue;
      const n = size(course);
      const result = blankCourse();
      result.attempts = Number.isInteger(raw.attempts) ? Math.max(0, Math.min(1000000, raw.attempts)) : 0;
      result.completedAt = iso(raw.completedAt);
      if (result.completedAt && raw.lastResult && Number.isInteger(raw.lastResult.firstCorrect) && raw.lastResult.firstCorrect >= 0 && raw.lastResult.firstCorrect <= n) {
        result.lastResult = { firstCorrect: raw.lastResult.firstCorrect, total: n };
      }
      const active = raw.active;
      if (active && ["cards", "quiz", "done"].includes(active.phase) && permutation(active.order, n) && Array.isArray(active.options) && active.options.length === n && active.options.every((v, q) => permutation(v, course.type === "kana" ? n : course.questions[q].options.length))) {
        const phase = active.phase === "done" && !result.completedAt ? "cards" : active.phase;
        result.active = {
          phase, cursor: Math.max(0, Math.min(Number.isInteger(active.cursor) ? active.cursor : 0, (phase === "cards" ? cards(course) : n) - 1)),
          order: [...active.order], options: active.options.map((v) => [...v]),
          direction: course.type === "kana" && active.direction === "reading" ? "reading" : "character",
          first: {}, solved: {}, wrong: null,
        };
        for (let q = 0; q < n; q++) {
          if (typeof active.first?.[q] === "boolean") result.active.first[q] = active.first[q];
          if (active.solved?.[q] === true && typeof result.active.first[q] === "boolean") result.active.solved[q] = true;
        }
        // A restored quiz cannot skip a question that was never completed.
        if (phase === "quiz") {
          const firstOpen = result.active.order.findIndex((q) => !result.active.solved[q]);
          if (firstOpen !== -1) result.active.cursor = Math.min(result.active.cursor, firstOpen);
        }
      }
      state.courses[id] = result;
    }
    return state;
  }
  function bind(callbacks) { api = callbacks; }
  const state = () => api.getState();
  const courseState = (id) => state().courses[id] ||= blankCourse();
  const save = () => api.save();
  const currentId = () => location.hash.startsWith("#study/") ? location.hash.slice(7) : null;
  const backHash = (course) => course.type === "kana" ? "#kana" : course.group === "travel" ? "#travel" : "#grammar";
  const footer = () => api.footer ? api.footer() : "";
  const warning = () => api.warning ? api.warning() : "";
  const wasEarlierDay = (date) => date && new Date(date).toDateString() !== new Date().toDateString();
  function header(destination, label) {
    return `<header class="lesson-header"><a class="exit" href="${destination}">← ${label}</a><span class="lesson-name">SoraChi · 日文入門</span></header>`;
  }
  function wrap(content, destination = "#home", label = "回首頁") {
    return `<div class="lesson-shell">${header(destination, label)}<main id="main" tabindex="-1" class="study-main">${content}${warning()}</main>${footer()}</div>`;
  }
  function status(id) {
    const saved = state().courses[id];
    if (saved?.active && saved.active.phase !== "done") return "接著練";
    if (saved?.completedAt) return "已練習 · 重練";
    return "開始";
  }
  function row(course) {
    const learned = state().courses[course.id];
    return `<button class="course-row" data-action="study-open" data-course="${course.id}"><span><strong>${escape(course.type === "kana" ? course.row : course.title)}</strong><span class="reading-label"${course.type === "kana" ? ' lang="ja"' : ""}>${escape(course.type === "kana" ? course.letters.join("　") : course.subtitle || "一個句型 · 兩題練習")}</span></span><span class="course-state">${status(course.id)}${learned?.lastResult?.firstCorrect === total(course.id) ? " · 上次全對" : ""}</span></button>`;
  }
  function kanaPage() {
    const script = state().script;
    const learnedBefore = Object.values(state().courses).some((c) => wasEarlierDay(c.completedAt));
    return wrap(`<h1 class="focus-heading" tabindex="-1">五十音練習</h1><p class="study-note">每組 3–5 個字，包含認字、讀音與選擇題。羅馬字只作讀音提示，不是照英文拼字唸。</p><div class="script-tabs" role="group" aria-label="選擇假名種類"><button data-action="study-script" data-script="h" aria-pressed="${script === "h"}">平假名</button><button data-action="study-script" data-script="k" aria-pressed="${script === "k"}">片假名</button></div>${learnedBefore ? '<p class="study-note">可以重新測試之前練過的組別，確認是否還記得。</p>' : ""}<div class="course-list">${Object.values(courses).filter((c) => c.type === "kana" && c.script === script).map(row).join("")}</div><p class="study-note">先練平假名、片假名各 46 個基本字；濁音、半濁音、拗音、促音與長音之後再學。</p>`);
  }
  function grammarPage() {
    return wrap(`<h1 class="focus-heading" tabindex="-1">基礎句型</h1><p class="study-note">每課介紹一個句型，再用兩題練習確認理解。例句附中文意思與讀音。</p><div class="course-list">${GRAMMAR.map(row).join("")}</div>`);
  }
  function travelPage(id) {
    if (!id) return wrap(`<h1 class="focus-heading" tabindex="-1">旅遊常用語</h1><p class="study-note">常用關鍵字、讀音與中文。依情境查看，需要時再展開完整說法。</p><nav class="travel-categories" aria-label="旅遊情境">${PHRASEBOOK.map(item => `<a class="course-row" href="#travel/${item.id}"><span><strong>${escape(item.title)}</strong><span class="reading-label">${escape(item.subtitle)}</span></span><span aria-hidden="true">→</span></a>`).join("")}</nav>`);
    const item = travelItem(id);
    if (!item) return wrap('<h1 class="focus-heading" tabindex="-1">找不到這個情境</h1><a class="text-button" href="#travel">回旅遊常用語</a>');
    return wrap(`<h1 class="focus-heading" tabindex="-1">${escape(item.title)}</h1><p class="study-note">先看關鍵字與意思，需要時再展開例句。</p>${item.steps.map((step, index) => `<section class="study-card travel-card"><h2>${escape(step.title)}</h2>${keywordBox(step.keywords)}<p class="study-note">${escape(step.body)}</p><details class="phrase-more"><summary>看完整說法與讀音</summary><p lang="ja">${escape(step.polite || step.example)}</p><p class="reading-label">${escape(step.politeReading || step.reading)}</p><p>${escape(step.politeMeaning || step.meaning)}</p>${audioButton(item, index, true)}</details>${step.extra ? `<details class="phrase-more"><summary>${escape(step.extra.title)}</summary>${keywordBox(step.extra.keywords)}<p lang="ja">${escape(step.extra.example)}</p><p class="reading-label">${escape(step.extra.reading)}</p><p>${escape(step.extra.meaning)}</p><p class="study-note">${escape(step.extra.body)}</p></details>` : ""}</section>`).join("")}<div class="study-nav"><a class="text-button" href="#travel">← 換個情境</a><button class="text-button" data-action="feedback">這一頁有問題？</button></div>`, "#travel", "回旅遊常用語");
  }
  function audioButton(course, index, travel = false) {
    return `<button class="text-button" data-action="${travel ? "study-travel-audio" : "study-audio"}" data-course="${course.id}" data-index="${index}" aria-label="播放 ${escape(course.type === "kana" ? course.letters[index] : (travel ? course.steps[index].polite || course.steps[index].example : course.steps[index].example))} 的日文讀音">播放讀音</button><span class="reading-label">裝置合成語音</span><p class="study-audio-status study-note"${travel ? ` data-audio-for="${course.id}-${index}"` : ""} role="status" aria-live="polite"></p>`;
  }
  function keywordBox(keywords) {
    return `<section class="keyword-box" aria-label="關鍵字"><h3>關鍵字</h3><dl>${keywords.map(([word, reading, meaning]) => `<div><dt><strong lang="ja">${escape(word)}</strong><span>${escape(reading)}</span></dt><dd>${escape(meaning)}</dd></div>`).join("")}</dl></section>`;
  }
  function card(course, active) {
    const i = active.cursor;
    let body;
    if (course.type === "kana") {
      const letter = course.letters[i];
      const special = course.script === "k" && ["n", "o", "ha", "he"].includes(course.readings[i])
        ? `${letter} 讀作 ${course.readings[i]}，對應平假名「${course.spoken[i]}」。`
        : course.readings[i] === "n" ? "ん 是鼻音，羅馬字寫作 n。"
        : course.spoken[i] === "を" ? "を 通常用作助詞，讀作 o。"
        : course.spoken[i] === "は" ? "は 的基本讀音是 ha；作助詞時讀 wa。"
        : course.spoken[i] === "へ" ? "へ 的基本讀音是 he；作助詞時讀 e。"
        : "記住字形和讀音，再進行辨認練習。";
      body = `<div class="kana-character" lang="ja">${course.letters[i]}</div><div class="reading-label">讀音 <strong>${course.readings[i]}</strong></div>${audioButton(course, i)}<p class="study-note">${special}</p>`;
    } else {
      const step = course.steps[i];
      const keywords = step.keywords ? keywordBox(step.keywords) : "";
      const extra = step.extra;
      const supplement = extra ? `<details class="phrase-more"><summary>${escape(extra.title)}</summary>${keywordBox(extra.keywords)}<p lang="ja">${escape(extra.example)}</p><p class="reading-label">${escape(extra.reading)}</p><p>${escape(extra.meaning)}</p><p class="study-note">${escape(extra.body)}</p></details>` : "";
      body = `<h2>${escape(step.title)}</h2>${keywords}${step.keywords ? '<h3 class="phrase-label">可以這樣說</h3>' : ""}<p class="grammar-example" lang="ja">${escape(step.example)}</p>${step.reading ? `<p class="reading-label">${escape(step.reading)}</p>` : ""}<p>${escape(step.meaning)}</p>${step.keywords ? audioButton(course, i) : ""}<p class="study-note">${escape(step.body)}</p>${step.polite ? `<details class="phrase-more"><summary>較完整的說法</summary><p lang="ja">${escape(step.polite)}</p><p class="reading-label">${escape(step.politeReading)}</p><p>${escape(step.politeMeaning)}</p></details>` : ""}${supplement}`;
    }
    return `<p class="reading-label">${course.type === "kana" ? "認字與讀音" : course.group === "travel" ? "旅遊用語" : "句型說明"} · ${i + 1} / ${cards(course)}</p><section class="study-card">${body}</section><div class="study-nav"><button class="text-button" data-action="study-prev"${i === 0 ? " disabled" : ""}>← 上一張</button><button class="primary" data-action="study-next">${i === cards(course) - 1 ? "開始練習" : "下一張 →"}</button></div>`;
  }
  function quiz(course, active) {
    const q = active.order[active.cursor];
    const solved = active.solved[q] === true;
    const question = course.type === "grammar" ? course.questions[q] : null;
    const prompt = question ? question.prompt : active.direction === "reading" ? "這個讀音，對應哪個字？" : "這個字，讀音是哪一個？";
    const correct = question ? question.answer : q;
    const options = question ? question.options : active.direction === "reading" ? course.letters : course.readings;
    const explanation = question ? question.explanation : `「${course.letters[q]}」的讀音是 ${course.readings[q]}。`;
    const feedback = solved ? `答對了。${explanation}` : active.wrong !== null ? `正解是「${options[correct]}」。${explanation} 再選一次試試看。` : "";
    return `<p class="reading-label">練習 · ${active.cursor + 1} / ${size(course)} · 選一個答案</p><section class="study-card"><h2>${escape(prompt)}</h2>${question ? "" : `<div class="kana-character"${active.direction === "character" ? ' lang="ja"' : ""}>${escape(active.direction === "reading" ? course.readings[q] : course.letters[q])}</div>`}<div class="study-options" role="group" aria-label="答案選項">${active.options[q].map((choice) => `<button class="answer${solved && choice === correct ? " correct" : active.wrong === choice ? " wrong" : ""}" data-action="study-answer" data-choice="${choice}" aria-disabled="${solved}"${solved ? ' tabindex="-1"' : ""}${course.type === "kana" && active.direction === "reading" ? ' lang="ja"' : ""}>${escape(options[choice])}${solved && choice === correct ? '<span class="answer-status"> ✓ 答對了</span>' : ""}</button>`).join("")}</div><p class="study-feedback${!solved && active.wrong !== null ? " wrong" : ""}" role="status" aria-live="polite">${escape(feedback)}</p></section><div class="study-nav"><button class="text-button" data-action="study-review">回去看看</button><button class="primary" data-action="study-next"${solved ? "" : " disabled"}>${active.cursor === size(course) - 1 ? "完成這一輪" : "下一題 →"}</button></div><p class="study-note">答錯可以重試；第一次的答案會留下紀錄，重試不會改寫初答成績。</p>`;
  }
  function result(course, saved) {
    const score = saved.lastResult;
    return `<section class="study-card study-result"><h2>${score?.firstCorrect === size(course) ? "全部答對" : "練習完成"}</h2>${score ? `<p>第一次答對 <strong>${score.firstCorrect} / ${score.total}</strong> 題</p>` : ""}<p class="study-note">${course.type === "kana" ? "可重練本組，或返回選擇其他組。" : course.group === "travel" ? "可重練本組，或返回選擇其他情境。" : "可重練本課，或返回選擇其他句型。"}</p><p class="reading-label">${saved.completedAt ? `完成於 ${escape(new Date(saved.completedAt).toLocaleDateString("zh-TW"))}` : ""}</p><div class="study-nav"><a class="text-button" href="${backHash(course)}">回到${course.type === "kana" ? "五十音" : course.group === "travel" ? "旅遊用語" : "句型列表"}</a><button class="primary" data-action="study-restart">重新練習</button></div></section>`;
  }
  function coursePage(course) {
    const saved = courseState(course.id);
    if (!saved.active) {
      saved.active = freshAttempt(course, saved.attempts);
      save();
    }
    const active = saved.active;
    return wrap(`<h1 class="focus-heading" tabindex="-1">${escape(course.title)}</h1>${active.phase === "done" ? result(course, saved) : active.phase === "quiz" ? quiz(course, active) : card(course, active)}<div class="lesson-utilities"><button class="text-button" data-action="feedback">這一頁有問題？</button></div>`, backHash(course), course.type === "kana" ? "回五十音" : course.group === "travel" ? "回旅遊用語" : "回句型列表");
  }
  function render(hash) {
    if (hash === "#kana") return kanaPage();
    if (hash === "#grammar") return grammarPage();
    if (hash === "#travel") return travelPage();
    if (hash.startsWith("#travel/")) return travelPage(hash.slice(8));
    if (hash.startsWith("#study/")) {
      const course = courses[hash.slice(7)];
      return course ? coursePage(course) : wrap('<h1 class="focus-heading" tabindex="-1">找不到這堂課</h1><p class="study-note">請返回課程列表重新選擇。</p><a class="primary" href="#kana">看看五十音</a>');
    }
    return null;
  }
  function redraw(selector = ".focus-heading") {
    const app = document.querySelector("#app");
    app.innerHTML = render(location.hash);
    if (selector === ".focus-heading") window.scrollTo?.({ top: 0, behavior: "instant" });
    app.querySelector(selector)?.focus({ preventScroll: true });
  }
  function stopAudio() {
    audioGeneration++;
    if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
  }
  function speak(course, index, selector = ".study-audio-status", full = false) {
    stopAudio();
    const generation = audioGeneration;
    const status = (text) => {
      if (generation !== audioGeneration) return;
      const node = document.querySelector(selector);
      if (node) node.textContent = text;
    };
    const synth = window.speechSynthesis;
    const voice = synth?.getVoices().find((v) => /^ja(?:-|_|$)/i.test(v.lang));
    if (!synth || typeof SpeechSynthesisUtterance === "undefined" || !voice) {
      status("這個瀏覽器目前沒有日文語音，先看讀音練習也可以。");
      if (synth && !voicesListening) {
        voicesListening = true;
        synth.addEventListener("voiceschanged", () => {
          voicesListening = false;
          const node = document.querySelector(selector);
          if (node && synth.getVoices().some((v) => /^ja(?:-|_|$)/i.test(v.lang))) node.textContent = "日文語音已準備好，可以再按一次播放。";
        }, { once: true });
      }
      return;
    }
    const spoken = course.type === "kana" ? ({ "を": "お", "は": "ハ", "へ": "ヘ" }[course.spoken[index]] || course.spoken[index]) : full ? course.steps[index].polite || course.steps[index].example : course.steps[index].example;
    const utterance = new SpeechSynthesisUtterance(spoken);
    utterance.voice = voice;
    utterance.lang = "ja-JP";
    utterance.rate = 0.8;
    utterance.onstart = () => status("正在播放日文讀音…");
    utterance.onend = () => status("播放完了，也可以再聽一次。");
    utterance.onerror = () => status("這次沒有播放成功，可以再試一次，或先看讀音練習。");
    synth.speak(utterance);
  }
  function complete(course, saved) {
    const active = saved.active;
    if (!active || active.phase !== "quiz" || !active.order.every((q) => active.solved[q] === true)) return;
    const firstCorrect = active.order.filter((q) => active.first[q] === true).length;
    const date = new Date().toISOString();
    active.phase = "done";
    saved.completedAt = date;
    saved.attempts++;
    saved.lastResult = { firstCorrect, total: size(course) };
    api.record({ date, courseId: course.id, title: course.title, total: size(course), firstCorrect, retryQuestions: active.order.flatMap((q, position) => active.first[q] === false ? [position + 1] : []) });
    save();
  }
  function handle(button) {
    const action = button.dataset.action;
    if (!action?.startsWith("study-")) return false;
    if (button.disabled) return true;
    if (action === "study-travel-audio") {
      const item = location.hash.startsWith("#travel/") ? travelItem(location.hash.slice(8)) : null;
      const index = Number(button.dataset.index);
      if (item && item.id === button.dataset.course && Number.isInteger(index) && index >= 0 && index < item.steps.length) speak(item, index, `[data-audio-for="${item.id}-${index}"]`, true);
      return true;
    }
    if (action === "study-script") {
      state().script = button.dataset.script === "k" ? "k" : "h";
      save(); redraw(`[data-script="${state().script}"]`); return true;
    }
    if (action === "study-open") {
      const course = courses[button.dataset.course];
      if (!course) return true;
      const saved = courseState(course.id);
      if (!saved.active || saved.active.phase === "done") saved.active = freshAttempt(course, saved.attempts);
      save(); api.go(`#study/${course.id}`); return true;
    }
    const course = courses[currentId()];
    if (!course) return true;
    const saved = courseState(course.id);
    const active = saved.active;
    if (!active) return true;
    if (action === "study-audio") {
      const index = Number(button.dataset.index);
      if ((course.type === "kana" || course.group === "travel") && Number.isInteger(index) && index >= 0 && index < cards(course)) speak(course, index);
      return true;
    }
    stopAudio();
    if (action === "study-restart") saved.active = freshAttempt(course, saved.attempts);
    else if (action === "study-prev" && active.phase === "cards") active.cursor = Math.max(0, active.cursor - 1);
    else if (action === "study-review" && active.phase === "quiz") { active.phase = "cards"; active.cursor = 0; active.wrong = null; }
    else if (action === "study-answer" && active.phase === "quiz") {
      const q = active.order[active.cursor];
      const choice = Number(button.dataset.choice);
      if (active.solved[q] || !active.options[q].includes(choice)) return true;
      const correct = choice === (course.type === "kana" ? q : course.questions[q].answer);
      if (active.first[q] === undefined) active.first[q] = correct;
      if (correct) { active.solved[q] = true; active.wrong = null; }
      else active.wrong = choice;
      save();
      redraw(`[data-action="study-answer"][data-choice="${choice}"]`);
      return true;
    } else if (action === "study-next") {
      if (active.phase === "cards") {
        if (active.cursor < cards(course) - 1) active.cursor++;
        else {
          active.phase = "quiz";
          const next = active.order.findIndex((q) => !active.solved[q]);
          active.cursor = next === -1 ? size(course) - 1 : next;
        }
      } else if (active.phase === "quiz" && active.solved[active.order[active.cursor]]) {
        if (active.cursor === size(course) - 1) complete(course, saved);
        else { active.cursor++; active.wrong = null; }
      } else return true;
    } else return true;
    save(); redraw();
    return true;
  }
  function context(hash) {
    if (hash === "#kana") return "五十音學習路線";
    if (hash === "#grammar") return "基礎句型學習路線";
    if (hash === "#travel") return "旅遊常用語列表";
    if (hash.startsWith("#travel/")) return travelItem(hash.slice(8)) ? `旅遊常用語・${travelItem(hash.slice(8)).title}` : null;
    const course = courses[hash.slice(7)];
    if (!hash.startsWith("#study/") || !course) return null;
    const active = state().courses[course.id]?.active;
    return `${course.title}${active ? active.phase === "done" ? "・完成頁" : `・${active.phase === "cards" ? "認識" : "練習"}第 ${active.cursor + 1} 步` : ""}`;
  }
  return { sanitize, bind, render, handle, context, stopAudio, title, travelTitle, total };
})();
