"use strict";

// Drill-only additions: course quizzes/revisions and earned results stay unchanged.
const DrillBank = (() => {
  const questions = [
  {
    "id": "drill/basic/student-answer",
    "courseId": "g-question",
    "prompt": "對方問你是不是學生，你確實是學生。哪個回答符合？",
    "options": [
      "学生（がくせい）です。",
      "学生（がくせい）ですか。",
      "学生（がくせい）じゃないです。"
    ],
    "readings": [
      "gakusei desu",
      "gakusei desu ka",
      "gakusei ja nai desu"
    ],
    "answer": 0,
    "explanation": "「学生です」是「是學生」。「ですか」是在問問題；「じゃないです」是否定，表示不是學生。",
    "source": {
      "kind": "sorachi-original",
      "batch": "2026-10-17"
    }
  },
  {
    "id": "drill/basic/ask-name-object",
    "courseId": "g-who",
    "prompt": "朋友拿著一樣你不認識的東西。想問「那是什麼？」，選哪一句？",
    "options": [
      "それは 何（なん）ですか。",
      "それは どこですか。",
      "それは いつですか。"
    ],
    "readings": [
      "sore wa nan desu ka",
      "sore wa doko desu ka",
      "sore wa itsu desu ka"
    ],
    "answer": 0,
    "explanation": "「何ですか」問是什麼；「どこ」問地點；「いつ」問時間。這裡要知道東西的名稱，所以用「何」。",
    "source": {
      "kind": "sorachi-original",
      "batch": "2026-10-17"
    }
  },
  {
    "id": "drill/basic/owner-direction",
    "courseId": "g-no",
    "prompt": "「先生（せんせい）の かばん」指的是什麼？",
    "options": [
      "老師的包包",
      "包包的老師",
      "老師和包包"
    ],
    "readings": [
      "",
      "",
      ""
    ],
    "answer": 0,
    "explanation": "「AのB」裡，後面的 B 是主要的東西，前面的 A 說明是誰的。「先生のかばん」就是老師的包包。",
    "source": {
      "kind": "sorachi-original",
      "batch": "2026-10-17"
    },
    "promptReading": "sensei no kaban"
  },
  {
    "id": "drill/basic/also-going",
    "courseId": "g-mo",
    "prompt": "田中先生要去，你也要去。「我也要去」怎麼說？",
    "options": [
      "私（わたし）も 行（い）きます。",
      "私（わたし）は 行（い）きません。",
      "私（わたし）も 行（い）きません。"
    ],
    "readings": [
      "watashi mo ikimasu",
      "watashi wa ikimasen",
      "watashi mo ikimasen"
    ],
    "answer": 0,
    "explanation": "「も」表示「也」；「行きます」是要去。「行きません」是不去，和這裡的意思不同。",
    "source": {
      "kind": "jabiko-adapted",
      "id": "n5-grammar-mo-watashi-iku",
      "commit": "57524190e53d947cc0be8813af4d8cef60201f00"
    }
  },
  {
    "id": "drill/basic/buy-ticket",
    "courseId": "g-nouns",
    "prompt": "想說「我要買車票」，要選哪一句？",
    "options": [
      "切符（きっぷ）を 買（か）います。",
      "かばんを 買（か）います。",
      "水（みず）を 買（か）います。"
    ],
    "readings": [
      "kippu o kaimasu",
      "kaban o kaimasu",
      "mizu o kaimasu"
    ],
    "answer": 0,
    "explanation": "「切符」是車票，「買います」是買。「かばん」是包包，「水」是水。",
    "source": {
      "kind": "sorachi-original",
      "batch": "2026-10-17"
    }
  },
  {
    "id": "drill/basic/bread-action",
    "courseId": "g-verbs",
    "prompt": "「パンを 食（た）べます。」哪個詞表示吃的東西？",
    "options": [
      "パン",
      "を",
      "食（た）べます"
    ],
    "readings": [
      "pan",
      "o",
      "tabemasu"
    ],
    "answer": 0,
    "explanation": "「パン」是麵包。「を」放在動作對象後面，這裡說明吃的是麵包；「食べます」才是吃這個動作。",
    "source": {
      "kind": "jabiko-adapted",
      "id": "n5-grammar-wo-pan",
      "commit": "57524190e53d947cc0be8813af4d8cef60201f00"
    },
    "promptReading": "pan o tabemasu"
  },
  {
    "id": "drill/basic/drink-action",
    "courseId": "g-verbs",
    "prompt": "想表達「喝水」，選哪個動作？水（みず）を＿＿。",
    "options": [
      "飲（の）みます",
      "買（か）います",
      "食（た）べます"
    ],
    "readings": [
      "nomimasu",
      "kaimasu",
      "tabemasu"
    ],
    "answer": 0,
    "explanation": "「飲みます」是喝，「買います」是買，「食べます」是吃。「水を飲みます」就是喝水。",
    "source": {
      "kind": "jabiko-adapted",
      "id": "n5-vocab-nomimasu-mizu",
      "commit": "57524190e53d947cc0be8813af4d8cef60201f00"
    },
    "promptReading": "mizu o ___"
  },
  {
    "id": "drill/basic/past-or-now",
    "courseId": "g-mashita",
    "prompt": "想說「昨天買了車票」，哪一句符合？",
    "options": [
      "昨日（きのう）、切符（きっぷ）を 買（か）いました。",
      "昨日（きのう）、切符（きっぷ）を 買（か）いませんでした。",
      "明日（あした）、切符（きっぷ）を 買（か）います。"
    ],
    "readings": [
      "kinō, kippu o kaimashita",
      "kinō, kippu o kaimasen deshita",
      "ashita, kippu o kaimasu"
    ],
    "answer": 0,
    "explanation": "「昨日」是昨天；「買いました」表示買了。「買いませんでした」是沒有買，第三句則是明天要買。",
    "source": {
      "kind": "sorachi-original",
      "batch": "2026-10-17"
    }
  },
  {
    "id": "drill/basic/location-versus-transport",
    "courseId": "g-transport",
    "prompt": "「バスで 京都（きょうと）に 行（い）きます。」哪個詞說明搭什麼交通工具？",
    "options": [
      "バス",
      "京都（きょうと）",
      "行（い）きます"
    ],
    "readings": [
      "basu",
      "Kyōto",
      "ikimasu"
    ],
    "answer": 0,
    "explanation": "「バス」是公車，後面接「で」表示搭公車。「京都に」說目的地是京都。",
    "source": {
      "kind": "sorachi-original",
      "batch": "2026-10-17"
    },
    "promptReading": "basu de Kyōto ni ikimasu"
  },
  {
    "id": "drill/basic/hours-range",
    "courseId": "g-kara-made-time",
    "prompt": "「九時（くじ）から 一時（いちじ）まで」裡，哪個詞標出結束時間？",
    "options": [
      "まで",
      "から",
      "の"
    ],
    "readings": [
      "made",
      "kara",
      "no"
    ],
    "answer": 0,
    "explanation": "「から」是從……開始，「まで」是到……為止。這裡是從九點到一點。",
    "source": {
      "kind": "jabiko-adapted",
      "id": "n5-grammar-made-kuji-hataraku",
      "commit": "57524190e53d947cc0be8813af4d8cef60201f00"
    },
    "promptReading": "kuji kara ichiji made"
  },
  {
    "id": "drill/basic/two-things-not-people",
    "courseId": "g-counting",
    "prompt": "買兩個麵包，想先說「兩個」，要用哪一個？",
    "options": [
      "ふたつ",
      "ふたり",
      "ふつか"
    ],
    "readings": [
      "futatsu",
      "futari",
      "futsuka"
    ],
    "answer": 0,
    "explanation": "「ふたつ」數東西，是兩個；「ふたり」是兩個人；「ふつか」是每月二日。這裡買麵包，用「ふたつ」。",
    "source": {
      "kind": "sorachi-original",
      "batch": "2026-10-17"
    }
  },
  {
    "id": "drill/basic/people-question-answer",
    "courseId": "g-people",
    "prompt": "店員問「何人（なんにん）ですか」。你一個人，怎麼回答？",
    "options": [
      "一人（ひとり）です。",
      "一つ（ひとつ）です。",
      "一日（ついたち）です。"
    ],
    "readings": [
      "hitori desu",
      "hitotsu desu",
      "tsuitachi desu"
    ],
    "answer": 0,
    "explanation": "「何人ですか」問有幾個人。一個人是「一人（ひとり）」，不能用數東西的「ひとつ」。",
    "source": {
      "kind": "sorachi-original",
      "batch": "2026-10-17"
    },
    "promptReading": "nan-nin desu ka"
  },
  {
    "id": "drill/basic/price-reading",
    "courseId": "g-prices",
    "prompt": "價錢寫「600円」。哪個讀法正確？",
    "options": [
      "ろっぴゃくえん",
      "ろくひゃくえん",
      "ろっぴゃくじ"
    ],
    "readings": [
      "roppyaku en",
      "rokuhyaku en",
      "roppyaku ji"
    ],
    "answer": 0,
    "explanation": "600 念「ろっぴゃく」，日圓是「えん」，合起來是「ろっぴゃくえん」。這裡的「ひゃく」會變成「ぴゃく」。",
    "source": {
      "kind": "sorachi-original",
      "batch": "2026-10-17"
    }
  },
  {
    "id": "drill/basic/bigger-bag",
    "courseId": "g-adj-i",
    "prompt": "包包太小，你想要大的包包。要選哪一個？",
    "options": [
      "大（おお）きい かばん",
      "小（ちい）さい かばん",
      "安（やす）い かばん"
    ],
    "readings": [
      "ōkii kaban",
      "chiisai kaban",
      "yasui kaban"
    ],
    "answer": 0,
    "explanation": "「大きい」表示大，「小さい」表示小。「安い」是便宜，說的是價錢，沒有說明大小。",
    "source": {
      "kind": "jabiko-adapted",
      "id": "n5-vocab-ookii-kaban",
      "commit": "57524190e53d947cc0be8813af4d8cef60201f00"
    }
  },
  {
    "id": "drill/basic/negative-price",
    "courseId": "g-adj-neg",
    "prompt": "「この パンは 高（たか）くないです。」意思是？",
    "options": [
      "這個麵包不貴",
      "這個麵包很貴",
      "這個麵包很小"
    ],
    "readings": [
      "",
      "",
      ""
    ],
    "answer": 0,
    "explanation": "「高い」在這裡是貴，改成「高くない」就是不貴。い形容詞的否定，把最後的「い」換成「くない」。",
    "source": {
      "kind": "sorachi-original",
      "batch": "2026-10-17"
    },
    "promptReading": "kono pan wa takaku nai desu"
  },
  {
    "id": "drill/basic/doing-now",
    "courseId": "g-te-iru",
    "prompt": "朋友正在喝咖啡，你要描述他眼前的動作，選哪一句？",
    "options": [
      "今（いま）、コーヒーを 飲（の）んでいます。",
      "昨日（きのう）、コーヒーを 飲（の）みました。",
      "コーヒーを 飲（の）んでもいいですか。"
    ],
    "readings": [
      "ima, kōhī o nonde imasu",
      "kinō, kōhī o nomimashita",
      "kōhī o nonde mo ii desu ka"
    ],
    "answer": 0,
    "explanation": "「飲んでいます」表示正在喝。「飲みました」說過去喝了；「飲んでもいいですか」是在問可不可以喝。",
    "source": {
      "kind": "jabiko-adapted",
      "id": "n5-grammar-teimasu-shinbun",
      "commit": "57524190e53d947cc0be8813af4d8cef60201f00"
    }
  },
  {
    "id": "drill/basic/permission-not-request",
    "courseId": "g-te-kudasai",
    "prompt": "店員說「ここで 待（ま）ってください」。他是在表達什麼？",
    "options": [
      "請你在這裡等",
      "問他自己可不可以在這裡等",
      "告訴你他正在這裡等"
    ],
    "readings": [
      "",
      "",
      ""
    ],
    "answer": 0,
    "explanation": "「待ってください」是請對方等。「待ってもいいですか」才是問可不可以等；「待っています」則是在說正在等。",
    "source": {
      "kind": "sorachi-original",
      "batch": "2026-10-17"
    },
    "promptReading": "koko de matte kudasai"
  },
  {
    "id": "drill/basic/sequence-before-coffee",
    "courseId": "g-te-sequence",
    "prompt": "「コーヒーを 飲（の）んでから、パンを 食（た）べます。」哪件事在後面做？",
    "options": [
      "吃麵包",
      "喝咖啡",
      "兩件事同時做"
    ],
    "readings": [
      "",
      "",
      ""
    ],
    "answer": 0,
    "explanation": "「Aてから、B」表示先做 A，再做 B。這句先喝咖啡，之後才吃麵包。",
    "source": {
      "kind": "sorachi-original",
      "batch": "2026-10-17"
    },
    "promptReading": "kōhī o nonde kara, pan o tabemasu"
  }
];
  function validate(content) {
    const errors=[], ids=new Set(content.grammar.flatMap(c=>c.questions.map(q=>q.id))), prompts=new Set(content.grammar.flatMap(c=>c.questions.map(q=>q.prompt)));
    for(const q of questions) {
      if(!q.id.startsWith('drill/basic/') || ids.has(q.id)) errors.push(`Duplicate/invalid drill id: ${q.id}`);
      ids.add(q.id);
      if(!content.grammar.some(c=>c.id===q.courseId)) errors.push(`Unknown drill lesson: ${q.id}`);
      if(prompts.has(q.prompt)) errors.push(`Duplicate drill prompt: ${q.id}`);
      prompts.add(q.prompt);
      if(!q.prompt || !q.explanation || !Array.isArray(q.options) || q.options.length<2 || new Set(q.options).size!==q.options.length || !Number.isInteger(q.answer) || !q.options[q.answer] || q.readings?.length!==q.options.length) errors.push(`Incomplete drill question: ${q.id}`);
      if(!['sorachi-original','jabiko-adapted'].includes(q.source?.kind) || (q.source.kind==='jabiko-adapted' && (!q.source.id || !/^[a-f0-9]{40}$/.test(q.source.commit)))) errors.push(`Missing drill source: ${q.id}`);
    }
    return errors;
  }
  return {questions,validate};
})();
