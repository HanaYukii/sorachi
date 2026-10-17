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
  },
  {
    "id": "drill/basic/sore-listener-view",
    "courseId": "g-demo",
    "prompt": "朋友站在離你幾步外，指著你手上的麵包說「それ」。他指的是哪一個？",
    "options": [
      "你手上的麵包",
      "他自己手上的東西",
      "離你們兩人都遠的東西"
    ],
    "readings": [
      "",
      "",
      ""
    ],
    "answer": 0,
    "explanation": "「それ」指靠近聽話者的東西。這次是朋友在說話，你是聽話者，所以指你手上的麵包。",
    "source": {
      "kind": "sorachi-original",
      "batch": "2026-10-17-200"
    },
    "promptReading": "sore"
  },
  {
    "id": "drill/basic/kono-before-noun",
    "courseId": "g-kono",
    "prompt": "你拿著一本書，想說「這本書」。哪個說法可以直接放在「本」前面？",
    "options": [
      "この 本（ほん）",
      "これ 本（ほん）",
      "ここ 本（ほん）"
    ],
    "readings": [
      "kono hon",
      "kore hon",
      "koko hon"
    ],
    "answer": 0,
    "explanation": "「この」後面接東西的名稱，所以「この本」是這本書。「これ」本身已經是「這個」，不能直接接「本」；「ここ」是這裡。",
    "source": {
      "kind": "sorachi-original",
      "batch": "2026-10-17-200"
    }
  },
  {
    "id": "drill/basic/dare-answer-person",
    "courseId": "g-who",
    "prompt": "朋友問「あの 人（ひと）は 誰（だれ）ですか」。哪個回答是在說那個人是誰？",
    "options": [
      "田中（たなか）さんです。",
      "駅（えき）です。",
      "明日（あした）です。"
    ],
    "readings": [
      "Tanaka-san desu",
      "eki desu",
      "ashita desu"
    ],
    "answer": 0,
    "explanation": "「誰ですか」問人是誰，所以用名字「田中さん」回答。「駅」是車站，「明日」是明天。",
    "source": {
      "kind": "sorachi-original",
      "batch": "2026-10-17-200"
    },
    "promptReading": "ano hito wa dare desu ka"
  },
  {
    "id": "drill/basic/two-negative-forms",
    "courseId": "g-negative",
    "prompt": "哪一句和「学生（がくせい）じゃありません」意思相同？",
    "options": [
      "学生（がくせい）じゃないです。",
      "学生（がくせい）です。",
      "学生（がくせい）ですか。"
    ],
    "readings": [
      "gakusei ja nai desu",
      "gakusei desu",
      "gakusei desu ka"
    ],
    "answer": 0,
    "explanation": "「じゃありません」和「じゃないです」都表示「不是」。後兩句分別是「是學生」和「是學生嗎」，沒有否定的意思。",
    "source": {
      "kind": "sorachi-original",
      "batch": "2026-10-17-200"
    },
    "promptReading": "gakusei ja arimasen"
  },
  {
    "id": "drill/basic/to-lists-two-items",
    "courseId": "g-to",
    "prompt": "想把麵包和水列在一起，哪個說法表示「麵包和水」？",
    "options": [
      "パンと 水（みず）",
      "パンの 水（みず）",
      "パンから 水（みず）まで"
    ],
    "readings": [
      "pan to mizu",
      "pan no mizu",
      "pan kara mizu made"
    ],
    "answer": 0,
    "explanation": "「と」可以把兩個名稱並列，表示「和」。「の」不是「和」；「から〜まで」則表示從一端到另一端。",
    "source": {
      "kind": "sorachi-original",
      "batch": "2026-10-17-200"
    }
  },
  {
    "id": "drill/basic/ima-now",
    "courseId": "g-days",
    "prompt": "「今（いま）」指的是什麼時候？",
    "options": [
      "現在",
      "昨天",
      "明天"
    ],
    "readings": [
      "",
      "",
      ""
    ],
    "answer": 0,
    "explanation": "「今」是現在、此刻。「昨日（きのう）」是昨天，「明日（あした）」是明天。先記住這三個時間詞。",
    "source": {
      "kind": "sorachi-original",
      "batch": "2026-10-17-200"
    },
    "promptReading": "ima"
  },
  {
    "id": "drill/basic/weekday-answer",
    "courseId": "g-weekdays",
    "prompt": "對方問「何曜日（なんようび）ですか」。哪個回答是在說星期幾？",
    "options": [
      "金曜日（きんようび）です。",
      "九時（くじ）です。",
      "九月（くがつ）です。"
    ],
    "readings": [
      "kin-yōbi desu",
      "kuji desu",
      "kugatsu desu"
    ],
    "answer": 0,
    "explanation": "「何曜日」問星期幾，「金曜日」是星期五。「九時」是九點，「九月」是九月，回答的內容不同。",
    "source": {
      "kind": "sorachi-original",
      "batch": "2026-10-17-200"
    },
    "promptReading": "nan-yōbi desu ka"
  },
  {
    "id": "drill/basic/zero-reading",
    "courseId": "g-numbers",
    "prompt": "「ゼロ」是哪個數字？",
    "options": [
      "0",
      "6",
      "10"
    ],
    "readings": [
      "",
      "",
      ""
    ],
    "answer": 0,
    "explanation": "「ゼロ」是 0。6 是「ろく」，10 是「じゅう」，不要把這幾個讀音混在一起。",
    "source": {
      "kind": "sorachi-original",
      "batch": "2026-10-17-200"
    },
    "promptReading": "zero"
  },
  {
    "id": "drill/basic/thousand-yen",
    "courseId": "g-prices",
    "prompt": "「千円（せんえん）」是多少日圓？",
    "options": [
      "1,000 日圓",
      "100 日圓",
      "10 日圓"
    ],
    "readings": [
      "",
      "",
      ""
    ],
    "answer": 0,
    "explanation": "「せん」是千，「えん」是日圓，所以「せんえん」是 1,000 日圓。100 日圓則是「ひゃくえん」。",
    "source": {
      "kind": "sorachi-original",
      "batch": "2026-10-17-200"
    },
    "promptReading": "sen en"
  },
  {
    "id": "drill/basic/three-things",
    "courseId": "g-counting",
    "prompt": "買三個麵包，先說「三個」要用哪個詞？",
    "options": [
      "みっつ",
      "ひとつ",
      "いつつ"
    ],
    "readings": [
      "mittsu",
      "hitotsu",
      "itsutsu"
    ],
    "answer": 0,
    "explanation": "「みっつ」是三個，「ひとつ」是一個，「いつつ」是五個。「みっつ」中間的小「っ」要停一拍。",
    "source": {
      "kind": "sorachi-original",
      "batch": "2026-10-17-200"
    }
  },
  {
    "id": "drill/basic/seven-thirty",
    "courseId": "g-clock",
    "prompt": "「七時半（しちじはん）」是幾點？",
    "options": [
      "7 點 30 分",
      "7 點整",
      "8 點 30 分"
    ],
    "readings": [
      "",
      "",
      ""
    ],
    "answer": 0,
    "explanation": "「しちじ」是七點，「はん」表示半小時。合起來「しちじはん」就是七點半，也就是 7 點 30 分。",
    "source": {
      "kind": "sorachi-original",
      "batch": "2026-10-17-200"
    },
    "promptReading": "shichiji han"
  },
  {
    "id": "drill/basic/one-minute",
    "courseId": "g-minutes",
    "prompt": "「1 分」的讀音是哪一個？",
    "options": [
      "いっぷん",
      "ろっぷん",
      "じゅっぷん"
    ],
    "readings": [
      "ippun",
      "roppun",
      "juppun"
    ],
    "answer": 0,
    "explanation": "1 分念「いっぷん」，有小「っ」，後面是「ぷん」。「ろっぷん」是 6 分，「じゅっぷん」是 10 分。",
    "source": {
      "kind": "sorachi-original",
      "batch": "2026-10-17-200"
    }
  },
  {
    "id": "drill/basic/september-reading",
    "courseId": "g-dates",
    "prompt": "「9 月」的讀音是哪一個？",
    "options": [
      "くがつ",
      "くじ",
      "きゅうにち"
    ],
    "readings": [
      "kugatsu",
      "kuji",
      "kyūnichi"
    ],
    "answer": 0,
    "explanation": "9 月念「くがつ」，這裡的 9 念「く」，月份用「がつ」。「くじ」是九點；9 日要另外記「ここのか」，不是「きゅうにち」。",
    "source": {
      "kind": "sorachi-original",
      "batch": "2026-10-17-200"
    }
  },
  {
    "id": "drill/basic/fourth-date",
    "courseId": "g-dates-2",
    "prompt": "每月的「4 日」怎麼念？",
    "options": [
      "よっか",
      "よっつ",
      "ふつか"
    ],
    "readings": [
      "yokka",
      "yottsu",
      "futsuka"
    ],
    "answer": 0,
    "explanation": "日期的 4 日念「よっか」；「よっつ」是四個東西，「ふつか」是日期的 2 日。日期和個數的讀法不同。",
    "source": {
      "kind": "sorachi-original",
      "batch": "2026-10-17-200"
    }
  },
  {
    "id": "drill/basic/june-sixth",
    "courseId": "g-dates-3",
    "prompt": "「6 月 6 日」怎麼念？",
    "options": [
      "ろくがつ むいか",
      "むいか ろくがつ",
      "ろくがつ なのか"
    ],
    "readings": [
      "rokugatsu muika",
      "muika rokugatsu",
      "rokugatsu nanoka"
    ],
    "answer": 0,
    "explanation": "日文日期先說月份再說幾日。「ろくがつ」是 6 月，「むいか」是 6 日；「なのか」則是 7 日。",
    "source": {
      "kind": "sorachi-original",
      "batch": "2026-10-17-200"
    }
  },
  {
    "id": "drill/basic/decline-drink",
    "courseId": "g-masen",
    "prompt": "朋友問你要不要喝咖啡。你想說「我不喝」，選哪一句？",
    "options": [
      "飲（の）みません。",
      "飲（の）みます。",
      "飲（の）みますか。"
    ],
    "readings": [
      "nomimasen",
      "nomimasu",
      "nomimasu ka"
    ],
    "answer": 0,
    "explanation": "「飲みません」是「不喝」。「飲みます」是喝；加上「か」的「飲みますか」是在問對方喝不喝。",
    "source": {
      "kind": "sorachi-original",
      "batch": "2026-10-17-200"
    }
  },
  {
    "id": "drill/basic/past-negative-meaning",
    "courseId": "g-mashita",
    "prompt": "「昨日（きのう）、行（い）きませんでした。」是什麼意思？",
    "options": [
      "昨天沒有去",
      "明天不去",
      "昨天去了"
    ],
    "readings": [
      "",
      "",
      ""
    ],
    "answer": 0,
    "explanation": "「昨日」是昨天，「行きませんでした」表示過去沒有去。「ませんでした」是動作句的過去否定說法。",
    "source": {
      "kind": "sorachi-original",
      "batch": "2026-10-17-200"
    },
    "promptReading": "kinō, ikimasen deshita"
  },
  {
    "id": "drill/basic/ni-and-de-two-roles",
    "courseId": "g-ni-de",
    "prompt": "想說「去車站，在車站買車票」。兩個空格依序放什麼？駅（えき）＿＿行（い）きます。駅（えき）＿＿切符（きっぷ）を 買（か）います。",
    "options": [
      "に／で",
      "で／に",
      "を／が"
    ],
    "readings": [
      "ni / de",
      "de / ni",
      "o / ga"
    ],
    "answer": 0,
    "explanation": "去的目的地用「に」：駅に行きます。在某處做動作用「で」：駅で切符を買います。兩句都有車站，但車站在句子裡的作用不同。",
    "source": {
      "kind": "sorachi-original",
      "batch": "2026-10-17-200"
    },
    "promptReading": "eki ___ ikimasu. eki ___ kippu o kaimasu"
  },
  {
    "id": "drill/basic/imasu-living-thing",
    "courseId": "g-arimasu",
    "prompt": "想說「車站有一隻貓」。空格放哪一個？駅（えき）に＿＿が います。",
    "options": [
      "猫（ねこ）",
      "本（ほん）",
      "切符（きっぷ）"
    ],
    "readings": [
      "neko",
      "hon",
      "kippu"
    ],
    "answer": 0,
    "explanation": "「猫」是貓，說人或貓在某處用「います」。書和車票是物品，說物品在某處通常用「あります」。",
    "source": {
      "kind": "sorachi-original",
      "batch": "2026-10-17-200"
    },
    "promptReading": "eki ni ___ ga imasu"
  },
  {
    "id": "drill/basic/under-the-desk",
    "courseId": "g-position",
    "prompt": "「机（つくえ）の 下（した）」是哪個位置？",
    "options": [
      "桌子下面",
      "桌子裡面",
      "桌子後面"
    ],
    "readings": [
      "",
      "",
      ""
    ],
    "answer": 0,
    "explanation": "「下」是下面，「中（なか）」是裡面，「後ろ（うしろ）」是後面。「机の下」就是桌子下面。",
    "source": {
      "kind": "sorachi-original",
      "batch": "2026-10-17-200"
    },
    "promptReading": "tsukue no shita"
  },
  {
    "id": "drill/basic/not-big",
    "courseId": "g-adj-neg",
    "prompt": "「この 部屋（へや）は 大（おお）きくないです。」是什麼意思？",
    "options": [
      "這個房間不大",
      "這個房間很大",
      "這個房間不安靜"
    ],
    "readings": [
      "",
      "",
      ""
    ],
    "answer": 0,
    "explanation": "「大きい」是大，把最後的「い」換成「くない」，就是「大きくない」，表示不大。這句沒有說房間安不安靜。",
    "source": {
      "kind": "sorachi-original",
      "batch": "2026-10-17-200"
    },
    "promptReading": "kono heya wa ōkiku nai desu"
  },
  {
    "id": "drill/basic/na-sentence-ending",
    "courseId": "g-adj-na",
    "prompt": "想說「這個房間很安靜」，句尾哪個說法正確？この 部屋（へや）は＿＿。",
    "options": [
      "静（しず）かです",
      "静（しず）かなです",
      "静（しず）かのです"
    ],
    "readings": [
      "shizuka desu",
      "shizuka na desu",
      "shizuka no desu"
    ],
    "answer": 0,
    "explanation": "這裡直接用「静かです」結束句子。接在名詞前面時才說「静かな部屋」，不要把那個「な」搬到「です」前面。",
    "source": {
      "kind": "sorachi-original",
      "batch": "2026-10-17-200"
    },
    "promptReading": "kono heya wa ___"
  },
  {
    "id": "drill/basic/how-to-get-there",
    "courseId": "g-who-2",
    "prompt": "朋友回答「バスで 行（い）きます」。你剛才是在問「怎麼去」，哪句合適？",
    "options": [
      "どうやって 行（い）きますか。",
      "いつ 行（い）きますか。",
      "どこに 行（い）きますか。"
    ],
    "readings": [
      "dō yatte ikimasu ka",
      "itsu ikimasu ka",
      "doko ni ikimasu ka"
    ],
    "answer": 0,
    "explanation": "「どうやって」問方法，這裡是問搭什麼交通工具去。「いつ」問時間，「どこに」問去哪裡。",
    "source": {
      "kind": "sorachi-original",
      "batch": "2026-10-17-200"
    },
    "promptReading": "basu de ikimasu"
  },
  {
    "id": "drill/basic/soshite-two-good-points",
    "courseId": "g-soshite-demo",
    "prompt": "談到一個麵包，朋友說「安（やす）いです。そして、おいしいです」。他覺得怎麼樣？",
    "options": [
      "便宜，而且好吃",
      "便宜，但不好吃",
      "不便宜，但好吃"
    ],
    "readings": [
      "",
      "",
      ""
    ],
    "answer": 0,
    "explanation": "「安い」是便宜，「おいしい」是好吃。「そして」把兩個優點接起來，表示便宜，而且好吃。",
    "source": {
      "kind": "sorachi-original",
      "batch": "2026-10-17-200"
    },
    "promptReading": "yasui desu. soshite, oishii desu"
  },
  {
    "id": "drill/basic/reason-before-kara",
    "courseId": "g-kara-reason",
    "prompt": "「寒（さむ）いですから、うちに います。」待在家的原因是什麼？",
    "options": [
      "天氣冷",
      "家很小",
      "今天休假"
    ],
    "readings": [
      "",
      "",
      ""
    ],
    "answer": 0,
    "explanation": "「から」前面是原因：寒いです，天氣冷。後面「うちにいます」是因此待在家，沒有提到房子的大小或休假。",
    "source": {
      "kind": "sorachi-original",
      "batch": "2026-10-17-200"
    },
    "promptReading": "samui desu kara, uchi ni imasu"
  },
  {
    "id": "drill/basic/node-because",
    "courseId": "g-dakara",
    "prompt": "「寒（さむ）いですので、うちに います。」裡的「ので」連接了哪種關係？",
    "options": [
      "因為天冷，所以待在家",
      "雖然天冷，還是待在家",
      "先天冷，再待在家"
    ],
    "readings": [
      "",
      "",
      ""
    ],
    "answer": 0,
    "explanation": "「ので」用來說原因。前面說天氣冷，後面說因此待在家；不是表示「雖然」或事情的先後順序。",
    "source": {
      "kind": "sorachi-original",
      "batch": "2026-10-17-200"
    },
    "promptReading": "samui desu node, uchi ni imasu"
  },
  {
    "id": "drill/basic/kedo-small-convenient",
    "courseId": "g-kedo",
    "prompt": "「この 部屋（へや）は 小（ちい）さいですけど、便利（べんり）です。」意思是？",
    "options": [
      "這個房間雖然小，但是方便",
      "這個房間因為小，所以方便",
      "這個房間小，而且不方便"
    ],
    "readings": [
      "",
      "",
      ""
    ],
    "answer": 0,
    "explanation": "「けど」在這裡是「雖然……但是……」：先提房間小，再補充它方便的優點，沒有說小是方便的原因。",
    "source": {
      "kind": "sorachi-original",
      "batch": "2026-10-17-200"
    },
    "promptReading": "kono heya wa chiisai desu kedo, benri desu"
  },
  {
    "id": "drill/basic/kuru-dictionary-form",
    "courseId": "g-verb-forms",
    "prompt": "「来（き）ます」（來）的原形是哪一個？",
    "options": [
      "くる",
      "いく",
      "する"
    ],
    "readings": [
      "kuru",
      "iku",
      "suru"
    ],
    "answer": 0,
    "explanation": "「きます」的原形是「くる」，表示來。「いく」是去，「する」是做。這裡的原形，就是字典裡查到的基本形式。",
    "source": {
      "kind": "sorachi-original",
      "batch": "2026-10-17-200"
    }
  },
  {
    "id": "drill/basic/kite-te-form",
    "courseId": "g-te-forms",
    "prompt": "「来（き）ます」（來）的て形是哪一個？",
    "options": [
      "きて",
      "くって",
      "きって"
    ],
    "readings": [
      "kite",
      "kutte",
      "kitte"
    ],
    "answer": 0,
    "explanation": "「くる／きます」要另外記，て形是「きて」。它不是直接加「って」，也沒有小「っ」。",
    "source": {
      "kind": "sorachi-original",
      "batch": "2026-10-17-200"
    }
  },
  {
    "id": "drill/basic/kudasai-request-marker",
    "courseId": "g-te-kudasai",
    "prompt": "「ちょっと 待（ま）ってください。」哪個部分讓這句變成「請你等一下」的請求？",
    "options": [
      "ください",
      "ちょっと",
      "待（ま）って"
    ],
    "readings": [
      "kudasai",
      "chotto",
      "matte"
    ],
    "answer": 0,
    "explanation": "「ください」接在動詞的て形後面，表示請對方做。「ちょっと」是一下；「待って」是「等待」的て形。",
    "source": {
      "kind": "sorachi-original",
      "batch": "2026-10-17-200"
    },
    "promptReading": "chotto matte kudasai"
  },
  {
    "id": "drill/basic/ongoing-versus-future",
    "courseId": "g-te-iru",
    "prompt": "想明確說「現在正在等」，空格放哪一個？今（いま）、待（ま）って＿＿。",
    "options": [
      "います",
      "ください",
      "もいいですか"
    ],
    "readings": [
      "imasu",
      "kudasai",
      "mo ii desu ka"
    ],
    "answer": 0,
    "explanation": "「待っています」表示正在等。「待ってください」是請對方等；「待ってもいいですか」是問可不可以等。",
    "source": {
      "kind": "sorachi-original",
      "batch": "2026-10-17-200"
    },
    "promptReading": "ima, matte ___"
  },
  {
    "id": "drill/basic/permission-positive-reply",
    "courseId": "g-te-mo-ii",
    "prompt": "你問可不可以吃這個，對方回答「はい、どうぞ」。意思最接近哪一個？",
    "options": [
      "可以，請用",
      "不可以吃",
      "請等一下"
    ],
    "readings": [
      "",
      "",
      ""
    ],
    "answer": 0,
    "explanation": "這個情境下，「はい、どうぞ」是在同意你的請求，表示可以、請用。它不是拒絕，也不是請你等待。",
    "source": {
      "kind": "sorachi-original",
      "batch": "2026-10-17-200"
    },
    "promptReading": "hai, dōzo"
  },
  {
    "id": "drill/basic/umbrella-not-bag",
    "courseId": "g-nouns",
    "prompt": "下雨時想找自己的「雨傘」，要認哪個詞？",
    "options": [
      "傘（かさ）",
      "かばん",
      "切符（きっぷ）"
    ],
    "readings": [
      "kasa",
      "kaban",
      "kippu"
    ],
    "answer": 0,
    "explanation": "「傘」是雨傘；「かばん」是包包；「切符」是車票。這題要找能擋雨的雨傘，所以選「傘」。",
    "source": {
      "kind": "jabiko-adapted",
      "id": "n5-vocab-kasa",
      "commit": "57524190e53d947cc0be8813af4d8cef60201f00",
      "batch": "2026-10-18-jabiko"
    },
    "scope": [
      "g-nouns"
    ]
  },
  {
    "id": "drill/basic/station-not-shop",
    "courseId": "g-nouns",
    "prompt": "要搭電車，先找「車站」。哪個詞表示車站？",
    "options": [
      "駅（えき）",
      "店（みせ）",
      "ホテル"
    ],
    "readings": [
      "eki",
      "mise",
      "hoteru"
    ],
    "answer": 0,
    "explanation": "「駅」是車站；「店」是店家；「ホテル」是飯店。搭電車要找的車站是「駅」。",
    "source": {
      "kind": "jabiko-adapted",
      "id": "n5-vocab-eki",
      "commit": "57524190e53d947cc0be8813af4d8cef60201f00",
      "batch": "2026-10-18-jabiko"
    },
    "scope": [
      "g-nouns"
    ]
  },
  {
    "id": "drill/basic/room-word",
    "courseId": "g-adj-na",
    "prompt": "飯店人員說「部屋（へや）」，這個詞是什麼意思？",
    "options": [
      "房間",
      "車站",
      "店家"
    ],
    "readings": [
      "",
      "",
      ""
    ],
    "answer": 0,
    "explanation": "「部屋」是房間。車站是「駅」，店家是「店」；這些都是地點的名稱，但指的地方不同。",
    "source": {
      "kind": "jabiko-adapted",
      "id": "n5-vocab-heya",
      "commit": "57524190e53d947cc0be8813af4d8cef60201f00",
      "batch": "2026-10-18-jabiko"
    },
    "scope": [
      "g-adj-na",
      "g-nouns"
    ],
    "promptReading": "heya"
  },
  {
    "id": "drill/basic/buy-bread-past",
    "courseId": "g-mashita",
    "prompt": "「パンを 買（か）いました。」告訴你哪件事已經做了？",
    "options": [
      "買了麵包",
      "吃了麵包",
      "沒有買麵包"
    ],
    "readings": [
      "",
      "",
      ""
    ],
    "answer": 0,
    "explanation": "「買いました」是「買了」；吃了要說「食べました」；沒有買則是「買いませんでした」。這句只說買了，沒有說吃了。",
    "source": {
      "kind": "jabiko-adapted",
      "id": "n5-vocab-kau",
      "commit": "57524190e53d947cc0be8813af4d8cef60201f00",
      "batch": "2026-10-18-jabiko"
    },
    "scope": [
      "g-mashita"
    ],
    "promptReading": "pan o kaimashita"
  },
  {
    "id": "drill/basic/return-to-hotel",
    "courseId": "g-te-sequence",
    "prompt": "逛完街，想說「回飯店」。哪一句符合？",
    "options": [
      "ホテルに 帰（かえ）ります。",
      "ホテルで 待（ま）ちます。",
      "ホテルで 食（た）べます。"
    ],
    "readings": [
      "hoteru ni kaerimasu",
      "hoteru de machimasu",
      "hoteru de tabemasu"
    ],
    "answer": 0,
    "explanation": "「帰ります」是回去，所以「ホテルに帰ります」是回飯店。其他兩句分別是在飯店等、在飯店吃東西，沒有表示回去。",
    "source": {
      "kind": "jabiko-adapted",
      "id": "n5-vocab-kaeru",
      "commit": "57524190e53d947cc0be8813af4d8cef60201f00",
      "batch": "2026-10-18-jabiko"
    },
    "scope": [
      "g-te-sequence",
      "g-nouns"
    ]
  },
  {
    "id": "drill/basic/kuru-meaning",
    "courseId": "g-verb-forms",
    "prompt": "「来（く）る」是「来（き）ます」的原形。它表示哪個動作？",
    "options": [
      "來",
      "去",
      "買"
    ],
    "readings": [
      "",
      "",
      ""
    ],
    "answer": 0,
    "explanation": "「来る／来ます」是來；去是「行く／行きます」；買是「買う／買います」。同一個動作可以有原形和禮貌說法。",
    "source": {
      "kind": "jabiko-adapted",
      "id": "n5-vocab-kuru-tomodachi-ie",
      "commit": "57524190e53d947cc0be8813af4d8cef60201f00",
      "batch": "2026-10-18-jabiko"
    },
    "scope": [
      "g-verb-forms"
    ],
    "promptReading": "kuru / kimasu"
  },
  {
    "id": "drill/basic/look-at-this",
    "courseId": "g-verb-forms",
    "prompt": "想表達「看這個」，空格要放哪個動作？これを＿＿。",
    "options": [
      "見（み）ます",
      "買（か）います",
      "飲（の）みます"
    ],
    "readings": [
      "mimasu",
      "kaimasu",
      "nomimasu"
    ],
    "answer": 0,
    "explanation": "「見ます」是看，所以「これを見ます」是看這個。「買います」是買，「飲みます」是喝，都不是題目要說的「看」。",
    "source": {
      "kind": "jabiko-adapted",
      "id": "n5-vocab-miru-terebi",
      "commit": "57524190e53d947cc0be8813af4d8cef60201f00",
      "batch": "2026-10-18-jabiko"
    },
    "scope": [
      "g-verb-forms"
    ],
    "promptReading": "kore o ___"
  },
  {
    "id": "drill/basic/go-station-action",
    "courseId": "g-ni-de",
    "prompt": "「駅（えき）に 行（い）きます。」是在表達什麼？",
    "options": [
      "要去車站",
      "在車站買東西",
      "車站有廁所"
    ],
    "readings": [
      "",
      "",
      ""
    ],
    "answer": 0,
    "explanation": "「行きます」是去，「駅に」說明去的地方。這句沒有買東西的動作，也沒有說哪裡有廁所。",
    "source": {
      "kind": "jabiko-adapted",
      "id": "n5-vocab-iku-kaisha",
      "commit": "57524190e53d947cc0be8813af4d8cef60201f00",
      "batch": "2026-10-18-jabiko"
    },
    "scope": [
      "g-ni-de"
    ],
    "promptReading": "eki ni ikimasu"
  },
  {
    "id": "drill/basic/cheap-not-small",
    "courseId": "g-adj-i",
    "prompt": "想說麵包「便宜」，不是說它「小」。哪一句符合？",
    "options": [
      "この パンは 安（やす）いです。",
      "この パンは 小（ちい）さいです。",
      "この パンは 高（たか）いです。"
    ],
    "readings": [
      "kono pan wa yasui desu",
      "kono pan wa chiisai desu",
      "kono pan wa takai desu"
    ],
    "answer": 0,
    "explanation": "「安い」說價錢便宜；「小さい」說大小；談麵包的價錢時，「高い」是貴。便宜和小不是同一個意思。",
    "source": {
      "kind": "jabiko-adapted",
      "id": "n5-vocab-yasui-mise",
      "commit": "57524190e53d947cc0be8813af4d8cef60201f00",
      "batch": "2026-10-18-jabiko"
    },
    "scope": [
      "g-adj-i"
    ]
  },
  {
    "id": "drill/basic/tasty-not-cheap",
    "courseId": "g-who-2",
    "prompt": "吃了一口麵包，想稱讚「好吃」。選哪一句？",
    "options": [
      "おいしいです。",
      "安（やす）いです。",
      "大（おお）きいです。"
    ],
    "readings": [
      "oishii desu",
      "yasui desu",
      "ookii desu"
    ],
    "answer": 0,
    "explanation": "「おいしい」說味道好吃；「安い」說價錢便宜；「大きい」說大小。題目要稱讚味道，所以選「おいしいです」。",
    "source": {
      "kind": "jabiko-adapted",
      "id": "n5-vocab-oishii",
      "commit": "57524190e53d947cc0be8813af4d8cef60201f00",
      "batch": "2026-10-18-jabiko"
    },
    "scope": [
      "g-who-2"
    ]
  },
  {
    "id": "drill/basic/cold-versus-warm-water",
    "courseId": "g-adj-neg",
    "prompt": "想要冷的水，哪個說法符合？",
    "options": [
      "冷（つめ）たい 水（みず）",
      "温（あたた）かい 水（みず）",
      "高（たか）い 水（みず）"
    ],
    "readings": [
      "tsumetai mizu",
      "atatakai mizu",
      "takai mizu"
    ],
    "answer": 0,
    "explanation": "「冷たい」說水或飲料是冷的；「温かい」是溫暖的；談水的價錢時，「高い」是貴。只有第一個在說冷水。",
    "source": {
      "kind": "jabiko-adapted",
      "id": "n5-vocab-tsumetai",
      "commit": "57524190e53d947cc0be8813af4d8cef60201f00",
      "batch": "2026-10-18-jabiko"
    },
    "scope": [
      "g-adj-neg"
    ]
  },
  {
    "id": "drill/basic/speak-slowly-word",
    "courseId": "g-te-kudasai",
    "prompt": "「ゆっくり 話（はな）してください。」裡，哪個詞表示「慢慢地」，說明說話的速度？",
    "options": [
      "ゆっくり",
      "話（はな）して",
      "ください"
    ],
    "readings": [
      "yukkuri",
      "hanashite",
      "kudasai"
    ],
    "answer": 0,
    "explanation": "「ゆっくり」是慢慢地；「話して」是說話的て形；「ください」把這句變成請求。表示速度慢一點的是「ゆっくり」。",
    "source": {
      "kind": "jabiko-adapted",
      "id": "n5-vocab-yukkuri",
      "commit": "57524190e53d947cc0be8813af4d8cef60201f00",
      "batch": "2026-10-18-jabiko"
    },
    "scope": [
      "g-te-kudasai"
    ],
    "promptReading": "yukkuri hanashite kudasai"
  },
  {
    "id": "drill/basic/chotto-wait-amount",
    "courseId": "g-te-kudasai",
    "prompt": "店員請你「ちょっと 待（ま）ってください」。這裡的「ちょっと」是什麼意思？",
    "options": [
      "一下子",
      "慢慢地",
      "明天"
    ],
    "readings": [
      "",
      "",
      ""
    ],
    "answer": 0,
    "explanation": "在「ちょっと待ってください」裡，「ちょっと」表示一下子，整句是請等一下。「ゆっくり」才是慢慢地；「あした」是明天。",
    "source": {
      "kind": "jabiko-adapted",
      "id": "n5-vocab-chotto",
      "commit": "57524190e53d947cc0be8813af4d8cef60201f00",
      "batch": "2026-10-18-jabiko"
    },
    "scope": [
      "g-te-kudasai"
    ],
    "promptReading": "chotto matte kudasai"
  },
  {
    "id": "drill/basic/clean-room-description",
    "courseId": "g-adj-na",
    "prompt": "想說「這個房間很乾淨」，選哪一句？",
    "options": [
      "この 部屋（へや）は きれいです。",
      "この 部屋（へや）は きれいじゃないです。",
      "この 部屋（へや）は 小（ちい）さいです。"
    ],
    "readings": [
      "kono heya wa kirei desu",
      "kono heya wa kirei ja nai desu",
      "kono heya wa chiisai desu"
    ],
    "answer": 0,
    "explanation": "「きれい」可以形容乾淨、漂亮；第二句的「じゃないです」是否定，表示不乾淨；第三句只說房間小。",
    "source": {
      "kind": "jabiko-adapted",
      "id": "n5-usage-kirei",
      "commit": "57524190e53d947cc0be8813af4d8cef60201f00",
      "batch": "2026-10-18-jabiko"
    },
    "scope": [
      "g-adj-na"
    ]
  },
  {
    "id": "drill/basic/convenient-not-quiet",
    "courseId": "g-adj-na",
    "prompt": "想說飯店「很方便」，選哪個說法？",
    "options": [
      "便利（べんり）です。",
      "静（しず）かです。",
      "きれいです。"
    ],
    "readings": [
      "benri desu",
      "shizuka desu",
      "kirei desu"
    ],
    "answer": 0,
    "explanation": "「便利」是方便；「静か」是安靜；「きれい」是乾淨、漂亮。這些都能形容飯店，但題目指定要說的是「方便」。",
    "source": {
      "kind": "jabiko-adapted",
      "id": "n5-syn-benri",
      "commit": "57524190e53d947cc0be8813af4d8cef60201f00",
      "batch": "2026-10-18-jabiko"
    },
    "scope": [
      "g-adj-na"
    ]
  },
  {
    "id": "drill/basic/behind-the-station",
    "courseId": "g-position",
    "prompt": "「駅（えき）の 後（うし）ろに ホテルが あります。」飯店在哪裡？",
    "options": [
      "車站後面",
      "車站前面",
      "車站裡面"
    ],
    "readings": [
      "",
      "",
      ""
    ],
    "answer": 0,
    "explanation": "「後ろ」是後面，所以飯店在車站後面。「前」是前面，「中」是裡面；不要把這三個位置混在一起。",
    "source": {
      "kind": "jabiko-adapted",
      "id": "n5-usage-ushiro",
      "commit": "57524190e53d947cc0be8813af4d8cef60201f00",
      "batch": "2026-10-18-jabiko"
    },
    "scope": [
      "g-position",
      "g-nouns"
    ],
    "promptReading": "eki no ushiro ni hoteru ga arimasu"
  },
  {
    "id": "drill/basic/topic-versus-owner",
    "courseId": "g-no",
    "prompt": "比較「私（わたし）は 学生（がくせい）です」和「私（わたし）の 本（ほん）」時，哪一組意思正確？",
    "options": [
      "我是學生／我的書",
      "我的學生／我是書",
      "我是老師／我的書"
    ],
    "readings": [
      "",
      "",
      ""
    ],
    "answer": 0,
    "explanation": "「私は学生です」用「は」說明我是誰；「私の本」用「の」表示我的書。老師是「先生」，不是「学生」。",
    "source": {
      "kind": "jabiko-adapted",
      "id": "n5-grammar-ha-watashi-gakusei",
      "commit": "57524190e53d947cc0be8813af4d8cef60201f00",
      "batch": "2026-10-18-jabiko"
    },
    "scope": [
      "g-no",
      "g-nouns"
    ],
    "promptReading": "watashi wa gakusei desu / watashi no hon"
  },
  {
    "id": "drill/basic/ka-polite-question",
    "courseId": "g-nouns",
    "prompt": "你指著一張票，想確認「是車票嗎？」。哪一句是在提問？",
    "options": [
      "切符（きっぷ）ですか。",
      "切符（きっぷ）です。",
      "切符（きっぷ）じゃないです。"
    ],
    "readings": [
      "kippu desu ka",
      "kippu desu",
      "kippu ja nai desu"
    ],
    "answer": 0,
    "explanation": "句尾加「か」成為問題：「切符ですか」是「是車票嗎？」。第二句是肯定說法，第三句是否定說法，都不是這裡要問的問題。",
    "source": {
      "kind": "jabiko-adapted",
      "id": "n5-grammar-ka",
      "commit": "57524190e53d947cc0be8813af4d8cef60201f00",
      "batch": "2026-10-18-jabiko"
    },
    "scope": [
      "g-nouns",
      "g-negative"
    ]
  },
  {
    "id": "drill/basic/whose-book-reply",
    "courseId": "g-nouns",
    "prompt": "這本書屬於老師。想說「老師的書」，要選哪個？",
    "options": [
      "先生（せんせい）の 本（ほん）",
      "先生（せんせい）と 本（ほん）",
      "本（ほん）の 先生（せんせい）"
    ],
    "readings": [
      "sensei no hon",
      "sensei to hon",
      "hon no sensei"
    ],
    "answer": 0,
    "explanation": "「AのB」可表示 A 的 B，所以老師的書是「先生の本」。「先生と本」是把老師和書列在一起；把順序倒成「本の先生」也不表示老師的書。",
    "source": {
      "kind": "jabiko-adapted",
      "id": "n5-grammar-no",
      "commit": "57524190e53d947cc0be8813af4d8cef60201f00",
      "batch": "2026-10-18-jabiko"
    },
    "scope": [
      "g-nouns",
      "g-to"
    ]
  },
  {
    "id": "drill/basic/cat-existence-roles",
    "courseId": "g-arimasu",
    "prompt": "「ここに 猫（ねこ）が います。」裡，「ここ」和「猫」分別告訴你什麼？",
    "options": [
      "在哪裡／有什麼動物",
      "有什麼動物／在哪裡",
      "什麼時候／多少錢"
    ],
    "readings": [
      "",
      "",
      ""
    ],
    "answer": 0,
    "explanation": "「ここに」說在這裡，「猫がいます」說有貓。整句是這裡有貓，沒有提到時間或價錢。",
    "source": {
      "kind": "jabiko-adapted",
      "id": "n5-grammar-ga-neko-iru",
      "commit": "57524190e53d947cc0be8813af4d8cef60201f00",
      "batch": "2026-10-18-jabiko"
    },
    "scope": [
      "g-arimasu"
    ],
    "promptReading": "koko ni neko ga imasu"
  },
  {
    "id": "drill/basic/action-place-hotel",
    "courseId": "g-ni-de",
    "prompt": "想說「在飯店喝水」，哪一句符合？",
    "options": [
      "ホテルで 水（みず）を 飲（の）みます。",
      "ホテルに 行（い）きます。",
      "水（みず）を 買（か）います。"
    ],
    "readings": [
      "hoteru de mizu o nomimasu",
      "hoteru ni ikimasu",
      "mizu o kaimasu"
    ],
    "answer": 0,
    "explanation": "「ホテルで」標出喝水的地方，第一句是完整的「在飯店喝水」。第二句是去飯店，第三句是買水，和題目要說的動作不同。",
    "source": {
      "kind": "jabiko-adapted",
      "id": "n5-grammar-de-toshokan",
      "commit": "57524190e53d947cc0be8813af4d8cef60201f00",
      "batch": "2026-10-18-jabiko"
    },
    "scope": [
      "g-ni-de",
      "g-nouns"
    ]
  },
  {
    "id": "drill/basic/destination-with-e",
    "courseId": "g-ni-de",
    "prompt": "「京都（きょうと）へ 行（い）きます。」中的「京都へ」說明什麼？",
    "options": [
      "要去的地方",
      "出發的地方",
      "搭的交通工具"
    ],
    "readings": [
      "",
      "",
      ""
    ],
    "answer": 0,
    "explanation": "「へ」在這裡標示前往的方向，讀作 e，所以要去京都。從京都出發用「京都から」；交通工具則是「バスで」這類說法。",
    "source": {
      "kind": "jabiko-adapted",
      "id": "n5-grammar-e-kyouto-iku",
      "commit": "57524190e53d947cc0be8813af4d8cef60201f00",
      "batch": "2026-10-18-jabiko"
    },
    "scope": [
      "g-ni-de",
      "g-transport"
    ],
    "promptReading": "kyouto e ikimasu"
  },
  {
    "id": "drill/basic/na-links-convenient",
    "courseId": "g-adj-na",
    "prompt": "「便利（べんり）です」改成放在名詞前，想說「方便的飯店」。哪一個正確？",
    "options": [
      "便利（べんり）な ホテル",
      "便利（べんり）の ホテル",
      "便利（べんり）です ホテル"
    ],
    "readings": [
      "benri na hoteru",
      "benri no hoteru",
      "benri desu hoteru"
    ],
    "answer": 0,
    "explanation": "「便利」是な形容詞，放在名詞前加「な」。「の」不是這個形容詞的接法；「です」是句尾的禮貌說法，不能這樣直接接在飯店前面。",
    "source": {
      "kind": "jabiko-adapted",
      "id": "n5-grammar-na",
      "commit": "57524190e53d947cc0be8813af4d8cef60201f00",
      "batch": "2026-10-18-jabiko"
    },
    "scope": [
      "g-adj-na",
      "g-nouns"
    ]
  },
  {
    "id": "drill/basic/until-friday",
    "courseId": "g-kara-made-time",
    "prompt": "「月曜日（げつようび）から 金曜日（きんようび）まで」表示哪一段時間？",
    "options": [
      "星期一到星期五",
      "星期五到星期一",
      "只有星期一和星期五"
    ],
    "readings": [
      "",
      "",
      ""
    ],
    "answer": 0,
    "explanation": "「から」標出起點，「まで」標出終點。這裡是從星期一到星期五的一段時間，不是倒過來，也不是只列出兩天。",
    "source": {
      "kind": "jabiko-adapted",
      "id": "n5-grammar-made-kuji-hataraku",
      "commit": "57524190e53d947cc0be8813af4d8cef60201f00",
      "batch": "2026-10-18-jabiko"
    },
    "scope": [
      "g-kara-made-time"
    ],
    "promptReading": "getsuyoubi kara kin'youbi made"
  },
  {
    "id": "drill/basic/reason-and-result-buy",
    "courseId": "g-kara-reason",
    "prompt": "「安（やす）いですから、買（か）います。」哪一個是原因，哪一個是決定？",
    "options": [
      "因為便宜／決定買",
      "因為買了／所以便宜",
      "因為很貴／決定不買"
    ],
    "readings": [
      "",
      "",
      ""
    ],
    "answer": 0,
    "explanation": "「から」前面的「安いです」是便宜這個原因；後面的「買います」是要買的決定。「高い」才是貴，「買いません」才是不買。",
    "source": {
      "kind": "jabiko-adapted",
      "id": "n5-grammar-kara-atama-itai",
      "commit": "57524190e53d947cc0be8813af4d8cef60201f00",
      "batch": "2026-10-18-jabiko"
    },
    "scope": [
      "g-kara-reason"
    ],
    "promptReading": "yasui desu kara, kaimasu"
  },
  {
    "id": "drill/basic/soshite-action-order",
    "courseId": "g-soshite-demo",
    "prompt": "「パンを 買（か）います。そして、うちに 帰（かえ）ります。」這裡的「そして」把兩個動作怎麼連起來？",
    "options": [
      "先買麵包，然後回家",
      "先回家，然後買麵包",
      "買麵包，但是不回家"
    ],
    "readings": [
      "",
      "",
      ""
    ],
    "answer": 0,
    "explanation": "「そして」除了補充另一點，也可以表示然後。這裡照順序說：先買麵包，然後回家；沒有把順序倒過來，也沒有說不回家。",
    "source": {
      "kind": "jabiko-adapted",
      "id": "n5-context-soshite",
      "commit": "57524190e53d947cc0be8813af4d8cef60201f00",
      "batch": "2026-10-18-jabiko"
    },
    "scope": [
      "g-soshite-demo",
      "g-te-sequence"
    ],
    "promptReading": "pan o kaimasu. soshite, uchi ni kaerimasu"
  },
  {
    "id": "drill/basic/but-still-buy",
    "courseId": "g-soshite-demo",
    "prompt": "想表達「很貴，但是還是要買」，哪句意思符合？",
    "options": [
      "高（たか）いです。でも、買（か）います。",
      "高（たか）いです。でも、買（か）いません。",
      "安（やす）いです。そして、買（か）います。"
    ],
    "readings": [
      "takai desu. demo, kaimasu",
      "takai desu. demo, kaimasen",
      "yasui desu. soshite, kaimasu"
    ],
    "answer": 0,
    "explanation": "第一句用「でも」轉折：雖然很貴，仍要買。第二句說不買；第三句說便宜，而且沒有用「但是」轉折，都不符合指定意思。",
    "source": {
      "kind": "jabiko-adapted",
      "id": "n5-context-demo",
      "commit": "57524190e53d947cc0be8813af4d8cef60201f00",
      "batch": "2026-10-18-jabiko"
    },
    "scope": [
      "g-soshite-demo"
    ]
  },
  {
    "id": "drill/basic/dakara-result-direction",
    "courseId": "g-dakara",
    "prompt": "價格太貴是原因，不買是決定。哪一句把順序說對了？",
    "options": [
      "高（たか）いです。だから、買（か）いません。",
      "買（か）いません。だから、高（たか）いです。",
      "高（たか）いです。だから、買（か）いました。"
    ],
    "readings": [
      "takai desu. dakara, kaimasen",
      "kaimasen. dakara, takai desu",
      "takai desu. dakara, kaimashita"
    ],
    "answer": 0,
    "explanation": "「だから」是所以，前面放原因、後面放結果。第一句是因為貴，所以不買；第二句把因果倒過來；第三句說已經買了。",
    "source": {
      "kind": "jabiko-adapted",
      "id": "n5-context-dakara",
      "commit": "57524190e53d947cc0be8813af4d8cef60201f00",
      "batch": "2026-10-18-jabiko"
    },
    "scope": [
      "g-dakara"
    ]
  },
  {
    "id": "drill/basic/request-slow-speech",
    "courseId": "g-te-kudasai",
    "prompt": "想請對方「慢慢說」，哪一句是請求？",
    "options": [
      "ゆっくり 話（はな）してください。",
      "ゆっくり 話（はな）します。",
      "ちょっと 待（ま）ってください。"
    ],
    "readings": [
      "yukkuri hanashite kudasai",
      "yukkuri hanashimasu",
      "chotto matte kudasai"
    ],
    "answer": 0,
    "explanation": "「話してください」用て形加「ください」請對方說話。第二句只說慢慢說話，沒有請求的「ください」；第三句是請等一下，動作不同。",
    "source": {
      "kind": "jabiko-adapted",
      "id": "n5-grammar-tekudasai-iu",
      "commit": "57524190e53d947cc0be8813af4d8cef60201f00",
      "batch": "2026-10-18-jabiko"
    },
    "scope": [
      "g-te-kudasai"
    ]
  },
  {
    "id": "drill/basic/buy-then-eat",
    "courseId": "g-te-sequence",
    "prompt": "想說「先買麵包，再吃麵包」，哪一句順序正確？",
    "options": [
      "パンを 買（か）ってから、食（た）べます。",
      "パンを 食（た）べてから、買（か）います。",
      "パンを 買（か）います。でも、食（た）べません。"
    ],
    "readings": [
      "pan o katte kara, tabemasu",
      "pan o tabete kara, kaimasu",
      "pan o kaimasu. demo, tabemasen"
    ],
    "answer": 0,
    "explanation": "「買ってから」是買完之後，後面再接吃。第二句把吃和買的順序倒過來；第三句則是會買，但是不吃。",
    "source": {
      "kind": "jabiko-adapted",
      "id": "n5-grammar-tekara-te-arau-taberu",
      "commit": "57524190e53d947cc0be8813af4d8cef60201f00",
      "batch": "2026-10-18-jabiko"
    },
    "scope": [
      "g-te-sequence"
    ]
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
