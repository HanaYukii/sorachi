"use strict";

// Authoritative beginner content. IDs are explicit editorial identifiers, never array positions.
const Content = (() => {
  const rows = [
    [
      "a",
      "あ行",
      "あいうえお",
      "アイウエオ",
      [
        "a",
        "i",
        "u",
        "e",
        "o"
      ]
    ],
    [
      "ka",
      "か行",
      "かきくけこ",
      "カキクケコ",
      [
        "ka",
        "ki",
        "ku",
        "ke",
        "ko"
      ]
    ],
    [
      "sa",
      "さ行",
      "さしすせそ",
      "サシスセソ",
      [
        "sa",
        "shi",
        "su",
        "se",
        "so"
      ]
    ],
    [
      "ta",
      "た行",
      "たちつてと",
      "タチツテト",
      [
        "ta",
        "chi",
        "tsu",
        "te",
        "to"
      ]
    ],
    [
      "na",
      "な行",
      "なにぬねの",
      "ナニヌネノ",
      [
        "na",
        "ni",
        "nu",
        "ne",
        "no"
      ]
    ],
    [
      "ha",
      "は行",
      "はひふへほ",
      "ハヒフヘホ",
      [
        "ha",
        "hi",
        "fu",
        "he",
        "ho"
      ]
    ],
    [
      "ma",
      "ま行",
      "まみむめも",
      "マミムメモ",
      [
        "ma",
        "mi",
        "mu",
        "me",
        "mo"
      ]
    ],
    [
      "ya",
      "や行",
      "やゆよ",
      "ヤユヨ",
      [
        "ya",
        "yu",
        "yo"
      ]
    ],
    [
      "ra",
      "ら行",
      "らりるれろ",
      "ラリルレロ",
      [
        "ra",
        "ri",
        "ru",
        "re",
        "ro"
      ]
    ],
    [
      "wa",
      "わ・を・ん",
      "わをん",
      "ワヲン",
      [
        "wa",
        "o",
        "n"
      ]
    ],
    [
      "ga",
      "が行",
      "がぎぐげご",
      "ガギグゲゴ",
      [
        "ga",
        "gi",
        "gu",
        "ge",
        "go"
      ]
    ],
    [
      "za",
      "ざ行",
      "ざじずぜぞ",
      "ザジズゼゾ",
      [
        "za",
        "ji",
        "zu",
        "ze",
        "zo"
      ]
    ],
    [
      "da",
      "だ行",
      "だぢづでど",
      "ダヂヅデド",
      [
        "da",
        "ji",
        "zu",
        "de",
        "do"
      ]
    ],
    [
      "ba",
      "ば行",
      "ばびぶべぼ",
      "バビブベボ",
      [
        "ba",
        "bi",
        "bu",
        "be",
        "bo"
      ]
    ],
    [
      "pa",
      "ぱ行",
      "ぱぴぷぺぽ",
      "パピプペポ",
      [
        "pa",
        "pi",
        "pu",
        "pe",
        "po"
      ]
    ],
    [
      "kya",
      "きゃ・きゅ・きょ",
      [
        "きゃ",
        "きゅ",
        "きょ"
      ],
      [
        "キャ",
        "キュ",
        "キョ"
      ],
      [
        "kya",
        "kyu",
        "kyo"
      ]
    ],
    [
      "sha",
      "しゃ・しゅ・しょ",
      [
        "しゃ",
        "しゅ",
        "しょ"
      ],
      [
        "シャ",
        "シュ",
        "ショ"
      ],
      [
        "sha",
        "shu",
        "sho"
      ]
    ],
    [
      "cha",
      "ちゃ・ちゅ・ちょ",
      [
        "ちゃ",
        "ちゅ",
        "ちょ"
      ],
      [
        "チャ",
        "チュ",
        "チョ"
      ],
      [
        "cha",
        "chu",
        "cho"
      ]
    ],
    [
      "nya",
      "にゃ・にゅ・にょ",
      [
        "にゃ",
        "にゅ",
        "にょ"
      ],
      [
        "ニャ",
        "ニュ",
        "ニョ"
      ],
      [
        "nya",
        "nyu",
        "nyo"
      ]
    ],
    [
      "hya",
      "ひゃ・ひゅ・ひょ",
      [
        "ひゃ",
        "ひゅ",
        "ひょ"
      ],
      [
        "ヒャ",
        "ヒュ",
        "ヒョ"
      ],
      [
        "hya",
        "hyu",
        "hyo"
      ]
    ],
    [
      "mya",
      "みゃ・みゅ・みょ",
      [
        "みゃ",
        "みゅ",
        "みょ"
      ],
      [
        "ミャ",
        "ミュ",
        "ミョ"
      ],
      [
        "mya",
        "myu",
        "myo"
      ]
    ],
    [
      "rya",
      "りゃ・りゅ・りょ",
      [
        "りゃ",
        "りゅ",
        "りょ"
      ],
      [
        "リャ",
        "リュ",
        "リョ"
      ],
      [
        "rya",
        "ryu",
        "ryo"
      ]
    ],
    [
      "gya",
      "ぎゃ・ぎゅ・ぎょ",
      [
        "ぎゃ",
        "ぎゅ",
        "ぎょ"
      ],
      [
        "ギャ",
        "ギュ",
        "ギョ"
      ],
      [
        "gya",
        "gyu",
        "gyo"
      ]
    ],
    [
      "ja",
      "じゃ・じゅ・じょ",
      [
        "じゃ",
        "じゅ",
        "じょ"
      ],
      [
        "ジャ",
        "ジュ",
        "ジョ"
      ],
      [
        "ja",
        "ju",
        "jo"
      ]
    ],
    [
      "bya",
      "びゃ・びゅ・びょ",
      [
        "びゃ",
        "びゅ",
        "びょ"
      ],
      [
        "ビャ",
        "ビュ",
        "ビョ"
      ],
      [
        "bya",
        "byu",
        "byo"
      ]
    ],
    [
      "pya",
      "ぴゃ・ぴゅ・ぴょ",
      [
        "ぴゃ",
        "ぴゅ",
        "ぴょ"
      ],
      [
        "ピャ",
        "ピュ",
        "ピョ"
      ],
      [
        "pya",
        "pyu",
        "pyo"
      ]
    ]
  ];
  const grammar = [
    {
      "id": "g-identity",
      "type": "grammar",
      "title": "名詞句：〜は〜です",
      "subtitle": "說明「我是誰、這是什麼」",
      "steps": [
        {
          "title": "本課單字",
          "example": "わたし ／ がくせい",
          "reading": "watashi / gakusei",
          "meaning": "我 ／ 學生",
          "body": "先記住「我」和「學生」。像「學生、麵包、車站」這些表示人、東西或地方名稱的詞，叫做「名詞」。這課會用「學生」練習自我介紹。",
          "id": "g-identity/card/nouns"
        },
        {
          "title": "句型：A は B です",
          "example": "わたしは がくせいです。",
          "reading": "watashi wa gakusei desu",
          "meaning": "我是學生。",
          "body": "A、B 是可以換成其他詞的位置。這句把 A 換成「わたし」（我），B 換成「がくせい」（學生）。「は」標出正在說誰，也就是句子的主題；後面的「がくせいです」說明我是學生。「です」讓說法比較有禮貌。",
          "id": "g-identity/card/noun-sentence"
        },
        {
          "title": "這裡的 は 讀 wa",
          "example": "わたし は がくせい です。",
          "reading": "watashi wa gakusei desu",
          "meaning": "說到我：我是學生。",
          "body": "「は」這種放在詞後面、幫忙說明它在句中作用的小詞，叫做「助詞」。這句的「は」讀 wa，寫的仍是「は」，不是「わ」。先記住這個用法就好。",
          "id": "g-identity/card/topic-reading"
        }
      ],
      "questions": [
        {
          "prompt": "想說「我是學生」：わたし＿＿がくせいです。空格應放哪一個？",
          "options": [
            "は",
            "わ",
            "です"
          ],
          "readings": [
            "wa",
            "wa",
            "desu"
          ],
          "answer": 0,
          "explanation": "「は」標出主題「わたし」：わたしは がくせいです。這裡念 wa，但要寫「は」。",
          "id": "g-identity/question/sentence-ending"
        },
        {
          "prompt": "在「わたしは がくせいです。」裡，標出主題的「は」讀作什麼？",
          "options": [
            "ha",
            "wa",
            "ka"
          ],
          "answer": 1,
          "explanation": "這裡的「は」是標出主題的小詞，讀作 wa；寫法仍然是「は」。",
          "id": "g-identity/question/topic-reading"
        }
      ]
    },
    {
      "id": "g-question",
      "type": "grammar",
      "title": "疑問句：〜ですか",
      "subtitle": "用「か」表示疑問",
      "steps": [
        {
          "title": "說明：是學生",
          "example": "がくせいです。",
          "reading": "gakusei desu",
          "meaning": "是學生。",
          "body": "「がくせい」是學生，後面加「です」，就是比較有禮貌地說「是學生」。這句沒有發問。",
          "id": "g-question/card/statement"
        },
        {
          "title": "疑問句：〜ですか",
          "example": "がくせいですか。",
          "reading": "gakusei desu ka",
          "meaning": "是學生嗎？",
          "body": "在「です」後加上「か」，就能表示疑問。「か」讀作 ka；句尾也可以寫句號「。」，不用靠問號判斷。說話時常用上揚語調詢問，但會依情境改變，不一定都上揚。",
          "id": "g-question/card/question-particle"
        },
        {
          "title": "知道在說誰，就可以不說「你」",
          "example": "がくせいですか。",
          "reading": "gakusei desu ka",
          "meaning": "你是學生嗎？",
          "body": "例如正面對一個人、詢問他的身分時，這句就是「你是學生嗎？」。日文常把情境裡已經清楚的人省略，不必每句都加上「你」。",
          "id": "g-question/card/implicit-person"
        }
      ],
      "questions": [
        {
          "prompt": "對方剛說自己在上學，你接著說「がくせいですか」。這句話的意思是？",
          "options": [
            "你是學生嗎",
            "我是學生嗎",
            "我是學生"
          ],
          "answer": 0,
          "explanation": "「か」表示疑問；面對對方這樣說，是在確認對方是不是學生。情境清楚時，不必另外說出「你」。",
          "id": "g-question/question/question-meaning"
        },
        {
          "prompt": "想確認對方是不是學生，哪一句適合？",
          "options": [
            "わたしは がくせいです",
            "がくせいは わたしです",
            "がくせいですか"
          ],
          "readings": [
            "watashi wa gakusei desu",
            "gakusei wa watashi desu",
            "gakusei desu ka"
          ],
          "answer": 2,
          "explanation": "「がくせいですか」用句尾的「か」表示疑問。其他兩句是在說明，沒有「か」。",
          "id": "g-question/question/question-ending"
        }
      ]
    },
    {
      "id": "g-demo",
      "type": "grammar",
      "title": "指示詞：これ・それ・あれ",
      "subtitle": "這個、那個：看東西靠近誰",
      "steps": [
        {
          "title": "靠近我：これ",
          "example": "これは パンです。",
          "reading": "kore wa pan desu",
          "meaning": "這是麵包。",
          "body": "先認識「パン」：麵包。說眼前的物品時，靠近說話者自己的東西用「これ」。例如你拿在手上的麵包。",
          "id": "g-demo/card/near-speaker"
        },
        {
          "title": "靠近對方：それ",
          "example": "それは パンです。",
          "reading": "sore wa pan desu",
          "meaning": "那是麵包。（靠近對方）",
          "body": "物品靠近你正在說話的對象、離你較遠時，用「それ」。例如朋友在幾步外，拿著一個麵包。",
          "id": "g-demo/card/near-listener"
        },
        {
          "title": "離我們都遠：あれ",
          "example": "あれは パンです。",
          "reading": "are wa pan desu",
          "meaning": "那是麵包。（離兩人都遠）",
          "body": "物品離說話者和聽話者都遠時，用「あれ」。這裡介紹指眼前物品的用法，不用來稱呼人。",
          "id": "g-demo/card/far-from-both"
        }
      ],
      "questions": [
        {
          "prompt": "你拿著一個麵包，朋友站在離你幾步外。你向朋友介紹手上的麵包：＿＿は パンです。",
          "options": [
            "それ",
            "これ",
            "あれ"
          ],
          "readings": [
            "sore",
            "kore",
            "are"
          ],
          "answer": 1,
          "explanation": "麵包就在說話的你手上，靠近你自己，所以用「これ」。",
          "id": "g-demo/question/held-item"
        },
        {
          "prompt": "你和朋友站在一起。麵包放在房間另一頭，離你們兩人都很遠。你指著它說：＿＿は パンです。",
          "options": [
            "あれ",
            "それ",
            "これ"
          ],
          "readings": [
            "are",
            "sore",
            "kore"
          ],
          "answer": 0,
          "explanation": "麵包離說話的你和聽話的朋友都遠，所以用「あれ」。",
          "id": "g-demo/question/distant-item"
        },
        {
          "prompt": "朋友站在離你幾步外，手上拿著一個麵包。你指著朋友手上的麵包說：＿＿は パンです。",
          "options": [
            "これ",
            "あれ",
            "それ"
          ],
          "readings": [
            "kore",
            "are",
            "sore"
          ],
          "answer": 2,
          "explanation": "麵包靠近聽你說話的朋友、離你較遠，所以用「それ」。",
          "id": "g-demo/question/listener-item"
        }
      ]
    },
    {
      "id": "g-place",
      "type": "grammar",
      "title": "地點：ここ・そこ・あそこ・どこ",
      "subtitle": "問地點、回答在哪裡",
      "steps": [
        {
          "title": "四個地點詞",
          "example": "ここ ／ そこ ／ あそこ ／ どこ",
          "reading": "koko / soko / asoko / doko",
          "meaning": "這裡 ／ 那裡（你那邊）／ 那裡（遠處）／ 哪裡",
          "body": "ここ 是說話的人這邊，そこ 是聽的人那邊，あそこ 是離兩個人都遠的地方，どこ 用來問「哪裡」。分法和 これ／それ／あれ 一樣。",
          "id": "g-place/card/words"
        },
        {
          "title": "問在哪裡",
          "example": "すみません、トイレは どこですか。",
          "reading": "sumimasen, toire wa doko desu ka",
          "meaning": "不好意思，廁所在哪裡？",
          "body": "把要找的東西放在「は」前面，後面接「どこですか」。車站是「えき」（eki）：えきは どこですか。",
          "id": "g-place/card/question"
        },
        {
          "title": "回答在哪裡",
          "example": "あそこです。",
          "reading": "asoko desu",
          "meaning": "在那裡（遠處）。",
          "body": "回答時把 どこ 換成 ここ、そこ 或 あそこ。兩個人站在一起時，也可能用 ここ 指你們所在的這一帶；先記住基本分法就好。",
          "id": "g-place/card/answer"
        }
      ],
      "questions": [
        {
          "prompt": "你和朋友站在一起，廁所在離你們兩人都遠的地方。你指著說：トイレは＿＿です。",
          "options": [
            "あそこ",
            "ここ",
            "そこ"
          ],
          "readings": [
            "asoko",
            "koko",
            "soko"
          ],
          "answer": 0,
          "explanation": "離說話的你和聽的朋友都遠，用「あそこ」。「ここ」是自己這邊，「そこ」是對方那邊。",
          "id": "g-place/question/far"
        },
        {
          "prompt": "想問車站在哪裡：えき（車站）は＿＿ですか。",
          "options": [
            "どこ",
            "ここ",
            "あそこ"
          ],
          "readings": [
            "doko",
            "koko",
            "asoko"
          ],
          "answer": 0,
          "explanation": "問「哪裡」用「どこ」：えきは どこですか。「ここ」「あそこ」是指出地點，不是在問。",
          "id": "g-place/question/ask"
        },
        {
          "prompt": "店員站在離你幾步外，指著自己腳邊說「ここです」。你對店員說那個地方時，要用哪一個？",
          "options": [
            "そこ",
            "ここ",
            "どこ"
          ],
          "readings": [
            "soko",
            "koko",
            "doko"
          ],
          "answer": 0,
          "explanation": "對店員來說是自己這邊（ここ）；對你來說是對方那邊，所以是「そこ」。",
          "id": "g-place/question/listener"
        }
      ]
    },
    {
      "id": "g-kono",
      "type": "grammar",
      "title": "指示詞：この・その・あの・どの",
      "subtitle": "這個麵包、那個麵包、哪個麵包",
      "steps": [
        {
          "title": "これ 和 この",
          "example": "これは パンです。 ／ この パンです。",
          "reading": "kore wa pan desu / kono pan desu",
          "meaning": "這是麵包。／ 是這個麵包。",
          "body": "「これ」自己就能表示「這個」；要直接接東西的名稱時，用「この」：この パン＝這個麵包。パン 是名詞。「これ パン」不能這樣直接接。",
          "id": "g-kono/card/kore-kono"
        },
        {
          "title": "問哪一個：どれ、どの",
          "example": "どれですか。 ／ どの パンですか。",
          "reading": "dore desu ka / dono pan desu ka",
          "meaning": "哪一個？／ 哪一個麵包？",
          "body": "「どれ」單獨問哪一個；「どの」後面接名詞。指著東西回答「これです」或「この パンです」就可以。",
          "id": "g-kono/card/which"
        },
        {
          "title": "遠近和 これ 系列一樣",
          "example": "その パン ／ あの パン",
          "reading": "sono pan / ano pan",
          "meaning": "那個麵包（你那邊）／ 那個麵包（遠處）",
          "body": "「その」指對方那邊的東西，「あの」指離兩個人都遠的東西，和 それ、あれ 的分法相同。",
          "id": "g-kono/card/distance"
        }
      ],
      "questions": [
        {
          "prompt": "店員指著三個麵包，問你要哪一個：＿＿パンですか。",
          "options": [
            "どの",
            "どれ",
            "どこ"
          ],
          "readings": [
            "dono",
            "dore",
            "doko"
          ],
          "answer": 0,
          "explanation": "後面接著名詞「パン」，要用「どの」：どの パンですか。「どれ」不接名詞，「どこ」是問地點。",
          "id": "g-kono/question/dono"
        },
        {
          "prompt": "你手上拿著麵包，對朋友說：＿＿は パンです。",
          "options": [
            "これ",
            "この"
          ],
          "readings": [
            "kore",
            "kono"
          ],
          "answer": 0,
          "explanation": "空格後面接的是「は」，不是名詞，所以用可以單獨用的「これ」。",
          "id": "g-kono/question/kore"
        },
        {
          "prompt": "店員指著三個麵包，問你要哪一個：＿＿ですか。",
          "options": [
            "どれ",
            "どの",
            "どこ"
          ],
          "readings": [
            "dore",
            "dono",
            "doko"
          ],
          "answer": 0,
          "explanation": "後面沒有名詞，單獨問「哪一個」用「どれ」。「どの」後面一定要接名詞，「どこ」是問地點。",
          "id": "g-kono/question/dore"
        }
      ]
    },
    {
      "id": "g-kochira",
      "type": "grammar",
      "title": "方向與客氣說法：こちら・どちら",
      "subtitle": "這邊、那邊，比較客氣的問法",
      "steps": [
        {
          "title": "方向：こちら・そちら・あちら・どちら",
          "example": "こちら ／ そちら ／ あちら ／ どちら",
          "reading": "kochira / sochira / achira / dochira",
          "meaning": "這邊 ／ 那邊（你那邊）／ 那邊（遠處）／ 哪邊",
          "body": "和 ここ、そこ、あそこ、どこ 一樣看靠近誰，但こちら系列說的是方向或那一帶，語氣也比較客氣。「こちら」還能指人或自己這一方，之後再學。",
          "id": "g-kochira/card/words"
        },
        {
          "title": "店員常說：こちらです",
          "example": "こちらです。",
          "reading": "kochira desu",
          "meaning": "在這邊。／ 這邊請。",
          "body": "店員帶路或指出方向時常說「こちらです」：在這邊、這邊請。說的是往這一邊，比「ここです」客氣。",
          "id": "g-kochira/card/staff"
        },
        {
          "title": "客氣地問路：どちらですか",
          "example": "すみません、トイレは どちらですか。",
          "reading": "sumimasen, toire wa dochira desu ka",
          "meaning": "不好意思，廁所在哪邊？",
          "body": "問方向用「どちら」，比「どこ」客氣。「どちら」也能問「兩個裡的哪一個」，之後再學。",
          "id": "g-kochira/card/ask"
        }
      ],
      "questions": [
        {
          "prompt": "你問店員廁所在哪裡，店員往自己身後一指，說「こちらです」。意思最接近哪一個？",
          "options": [
            "在這邊。",
            "在那邊（遠處）。",
            "在哪裡？"
          ],
          "answer": 0,
          "explanation": "「こちら」指說話的人這一邊、這個方向，店員用它客氣地帶路：在這邊。遠處的那邊是「あちら」，「どちら」是在問。",
          "id": "g-kochira/question/staff"
        },
        {
          "prompt": "想客氣地問廁所在哪邊：トイレは＿＿ですか。",
          "options": [
            "どちら",
            "こちら",
            "あちら"
          ],
          "readings": [
            "dochira",
            "kochira",
            "achira"
          ],
          "answer": 0,
          "explanation": "問方向用「どちら」，比「どこ」客氣。「こちら」「あちら」是在指出方向，不是在問。",
          "id": "g-kochira/question/ask"
        },
        {
          "prompt": "店員指著走廊盡頭，離你們兩個人都遠的方向說：トイレは＿＿です。",
          "options": [
            "あちら",
            "こちら",
            "どちら"
          ],
          "readings": [
            "achira",
            "kochira",
            "dochira"
          ],
          "answer": 0,
          "explanation": "離雙方都遠的方向用「あちら」，遠近的分法和「あそこ」相同。「こちら」是說話的人這一邊，「どちら」是在問。",
          "id": "g-kochira/question/far"
        }
      ]
    },
    {
      "id": "g-who",
      "type": "grammar",
      "title": "疑問詞：だれ・なに・どこ",
      "subtitle": "問人、問東西、問地點",
      "steps": [
        {
          "title": "問人：だれ",
          "example": "あの ひとは だれですか。",
          "reading": "ano hito wa dare desu ka",
          "meaning": "那個人是誰？",
          "body": "問「誰」用「だれ」。回答時把 だれ 換成名字或身分，例如「がくせいです」。",
          "id": "g-who/card/dare"
        },
        {
          "title": "問東西：なん（なに）",
          "example": "これは なんですか。",
          "reading": "kore wa nan desu ka",
          "meaning": "這是什麼？",
          "body": "「何」在「です」前面念 なん：なんですか＝是什麼？其他位置有時念 なに、有時念 なん，之後遇到再學。",
          "id": "g-who/card/nan"
        },
        {
          "title": "四個疑問詞",
          "example": "だれ ／ なに ／ どこ ／ いつ",
          "reading": "dare / nani / doko / itsu",
          "meaning": "誰 ／ 什麼 ／ 哪裡 ／ 什麼時候",
          "body": "問人、東西、地點、時間各用不同的詞。「いつ」的回答要用到時間詞，之後的課再練。",
          "id": "g-who/card/words"
        }
      ],
      "questions": [
        {
          "prompt": "選出適合的詞：すみません、トイレは ＿＿ ですか。",
          "options": [
            "どこ",
            "だれ",
            "いつ",
            "なに"
          ],
          "readings": [
            "doko",
            "dare",
            "itsu",
            "nani"
          ],
          "answer": 0,
          "explanation": "問廁所在哪裡要問地點，「どこ（哪裡）」是問地點的疑問詞。「だれ（誰）」問人，廁所不是人；「いつ（什麼時候）」問時間，和位置無關；「なに（什麼）」問東西，在「です」前面念 なん，「トイレは なんですか」變成問廁所是什麼東西，意思不通。",
          "id": "g-who/question/jabiko-doko"
        },
        {
          "prompt": "朋友拿著一個你沒看過的東西。你問：それは ＿＿ ですか。",
          "options": [
            "なん",
            "だれ",
            "どこ"
          ],
          "readings": [
            "nan",
            "dare",
            "doko"
          ],
          "answer": 0,
          "explanation": "問東西用「なん」：それは なんですか。東西在朋友手上，所以用「それ」。「だれ」問人，「どこ」問地點。",
          "id": "g-who/question/nan"
        },
        {
          "prompt": "門口站著一位你不認識的人。你小聲問朋友：あの ひとは ＿＿ ですか。",
          "options": [
            "だれ",
            "なん",
            "どこ"
          ],
          "readings": [
            "dare",
            "nan",
            "doko"
          ],
          "answer": 0,
          "explanation": "問人用「だれ」：あの ひとは だれですか。「あの ひとは どこですか」是問那個人在哪裡，但人就站在門口；「なん」問東西。",
          "id": "g-who/question/dare"
        }
      ]
    },
    {
      "id": "g-negative",
      "type": "grammar",
      "title": "名詞句否定：〜じゃないです",
      "subtitle": "說「不是…」",
      "steps": [
        {
          "title": "不是…：じゃないです",
          "example": "わたしは がくせいじゃないです。",
          "reading": "watashi wa gakusei ja nai desu",
          "meaning": "我不是學生。",
          "body": "把「がくせいです」（是學生）的「です」換成「じゃないです」，就變成「不是學生」。這課先用人或東西的名稱練習；其他詞的「不…」之後再學。",
          "id": "g-negative/card/ja-nai"
        },
        {
          "title": "比較正式：じゃありません",
          "example": "これは パンじゃありません。",
          "reading": "kore wa pan ja arimasen",
          "meaning": "這不是麵包。",
          "body": "「じゃありません」和「じゃないです」意思一樣，聽起來比較正式一點，兩種都常聽到。",
          "id": "g-negative/card/ja-arimasen"
        },
        {
          "title": "回答「是不是」",
          "example": "がくせいですか。 ／ いいえ、がくせいじゃないです。",
          "reading": "gakusei desu ka / iie, gakusei ja nai desu",
          "meaning": "是學生嗎？／ 不，不是學生。",
          "body": "被問「〜ですか」時，不是就先說「いいえ」，再接「〜じゃないです」。",
          "id": "g-negative/card/answer"
        }
      ],
      "questions": [
        {
          "prompt": "你不是學生，想說「我不是學生」：わたしは がくせい＿＿。",
          "options": [
            "じゃないです",
            "です",
            "ですか"
          ],
          "readings": [
            "ja nai desu",
            "desu",
            "desu ka"
          ],
          "answer": 0,
          "explanation": "「不是…」用「じゃないです」：がくせいじゃないです。「です」是「是…」，「ですか」是在問。",
          "id": "g-negative/question/ja-nai"
        },
        {
          "prompt": "朋友指著一樣東西問「パンですか」。那不是麵包，你回答：いいえ、パン＿＿。",
          "options": [
            "じゃありません",
            "です",
            "ですか"
          ],
          "readings": [
            "ja arimasen",
            "desu",
            "desu ka"
          ],
          "answer": 0,
          "explanation": "說「不是麵包」用「パンじゃありません」。「いいえ、パンです」前面說不是、後面又說是麵包，前後矛盾；「ですか」是在發問。",
          "id": "g-negative/question/answer"
        },
        {
          "prompt": "「これは パンじゃありません。」是什麼意思？",
          "options": [
            "這不是麵包。",
            "這是麵包。",
            "這是麵包嗎？"
          ],
          "answer": 0,
          "explanation": "「じゃありません」是「不是…」：這不是麵包。",
          "id": "g-negative/question/meaning"
        }
      ]
    },
    {
      "id": "g-no",
      "type": "grammar",
      "title": "名詞連接：AのB",
      "subtitle": "我的傘、日文書",
      "steps": [
        {
          "title": "AのB：A 的 B",
          "example": "わたしの かさ",
          "reading": "watashi no kasa",
          "meaning": "我的傘",
          "body": "「の」把兩個名詞連起來，前面的名詞說明後面的名詞：わたしの かさ＝我的傘。",
          "id": "g-no/card/a-no-b"
        },
        {
          "title": "放進句子裡",
          "example": "これは わたしの かさです。",
          "reading": "kore wa watashi no kasa desu",
          "meaning": "這是我的傘。",
          "body": "「わたしの かさ」整個當作一個名詞，後面照樣接「です」。",
          "id": "g-no/card/sentence"
        },
        {
          "title": "の 不一定翻成「的」",
          "example": "にほんごの ほん",
          "reading": "nihongo no hon",
          "meaning": "日文書",
          "body": "「の」表示所屬、內容等關係，中文不一定翻成「的」：にほんごの ほん 是「日文書」。",
          "id": "g-no/card/not-always-de"
        }
      ],
      "questions": [
        {
          "prompt": "選出適合的詞：これは わたし ＿＿ かさです。",
          "options": [
            "の",
            "は",
            "を",
            "へ"
          ],
          "readings": [
            "no",
            "wa",
            "o",
            "e"
          ],
          "answer": 0,
          "explanation": "「わたしの かさ」就是「我的傘」，所以選「の」。這題先記住「AのB＝A 的 B」，用「の」表示是誰的東西。",
          "id": "g-no/question/jabiko-no"
        },
        {
          "prompt": "想說「我的麵包」：わたし＿＿パン",
          "options": [
            "の",
            "は",
            "です"
          ],
          "readings": [
            "no",
            "wa",
            "desu"
          ],
          "answer": 0,
          "explanation": "兩個名詞連在一起用「の」：わたしの パン。「は」會變成句子的主題；「です」放在句尾，不放在兩個名詞中間。",
          "id": "g-no/question/my-bread"
        },
        {
          "prompt": "「にほんごの ほん」最自然的意思是？",
          "options": [
            "日文書",
            "日本人",
            "我的書"
          ],
          "answer": 0,
          "explanation": "「にほんご」是日文，「ほん」是書；「の」在這裡表示內容，所以是「日文書」，不必翻成「日文的書」。",
          "id": "g-no/question/meaning"
        }
      ]
    },
    {
      "id": "g-nouns",
      "type": "grammar",
      "title": "常用名詞：ともだち・きっぷ・ホテル",
      "subtitle": "人、東西、地方各兩個詞",
      "steps": [
        {
          "title": "人：ともだち・せんせい",
          "example": "ともだち ／ せんせい",
          "reading": "tomodachi / sensei",
          "meaning": "朋友 ／ 老師",
          "body": "「せんせい」是老師，也用來稱呼醫生。叫老師時直接說「せんせい」就可以。",
          "id": "g-nouns/card/people"
        },
        {
          "title": "東西：きっぷ・かばん",
          "example": "きっぷ ／ かばん",
          "reading": "kippu / kaban",
          "meaning": "車票 ／ 包包",
          "body": "「きっぷ」的小 っ 要停一拍，念成 kip-pu。「かばん」是包包。",
          "id": "g-nouns/card/things"
        },
        {
          "title": "地方：みせ・ホテル",
          "example": "みせ ／ ホテル",
          "reading": "mise / hoteru",
          "meaning": "店 ／ 飯店",
          "body": "「みせ」是店家，「ホテル」是飯店。",
          "id": "g-nouns/card/places"
        },
        {
          "title": "放進學過的句子",
          "example": "これは わたしの きっぷです。 ／ ホテルは どこですか。",
          "reading": "kore wa watashi no kippu desu / hoteru wa doko desu ka",
          "meaning": "這是我的車票。／ 飯店在哪裡？",
          "body": "換成新學的名詞，前面學過的句子都能用。",
          "id": "g-nouns/card/sentences"
        }
      ],
      "questions": [
        {
          "prompt": "「せんせい」是什麼意思？",
          "options": [
            "老師",
            "朋友",
            "學生"
          ],
          "answer": 0,
          "explanation": "「せんせい」是老師。朋友是「ともだち」，學生是「がくせい」。",
          "id": "g-nouns/question/sensei"
        },
        {
          "prompt": "想說「這是我的車票」：これは わたしの＿＿です。",
          "options": [
            "きっぷ",
            "かばん",
            "みせ"
          ],
          "readings": [
            "kippu",
            "kaban",
            "mise"
          ],
          "answer": 0,
          "explanation": "車票是「きっぷ」。「かばん」是包包，「みせ」是店。",
          "id": "g-nouns/question/kippu"
        },
        {
          "prompt": "想問飯店在哪裡：＿＿は どこですか。",
          "options": [
            "ホテル",
            "ともだち",
            "せんせい"
          ],
          "readings": [
            "hoteru",
            "tomodachi",
            "sensei"
          ],
          "answer": 0,
          "explanation": "飯店是「ホテル」。「ともだち」是朋友，「せんせい」是老師。",
          "id": "g-nouns/question/hotel"
        }
      ]
    },
    {
      "id": "g-mo",
      "type": "grammar",
      "title": "也：〜も",
      "subtitle": "我也是學生",
      "steps": [
        {
          "title": "名字後面的 さん",
          "example": "たなかさん",
          "reading": "tanaka san",
          "meaning": "田中先生／小姐",
          "body": "「さん」接在別人的名字後面，男女都可以用；說自己的名字時不加。",
          "id": "g-mo/card/san"
        },
        {
          "title": "も：也",
          "example": "たなかさんは がくせいです。 ／ わたしも がくせいです。",
          "reading": "tanaka san wa gakusei desu / watashi mo gakusei desu",
          "meaning": "田中先生是學生。／ 我也是學生。",
          "body": "前面說過「Aは …です」，換成「Bも …です」就是「B 也是…」。「も」取代「は」，不會寫成「はも」。",
          "id": "g-mo/card/mo"
        },
        {
          "title": "東西也一樣",
          "example": "これも パンです。",
          "reading": "kore mo pan desu",
          "meaning": "這也是麵包。",
          "body": "指著另一樣東西說「これも」，表示和前面說的一樣。",
          "id": "g-mo/card/thing"
        }
      ],
      "questions": [
        {
          "prompt": "朋友說「わたしは がくせいです」。你也是學生：わたし＿＿ がくせいです。",
          "options": [
            "も",
            "は",
            "の"
          ],
          "readings": [
            "mo",
            "wa",
            "no"
          ],
          "answer": 0,
          "explanation": "和對方一樣，用「も」：わたしも がくせいです。用「は」只是在說自己，沒有「也」的意思；選「の」會變成「わたしの がくせいです」（是我的學生）。",
          "id": "g-mo/question/me-too"
        },
        {
          "prompt": "「これも パンです。」是什麼意思？",
          "options": [
            "這也是麵包。",
            "這是麵包。",
            "這不是麵包。"
          ],
          "answer": 0,
          "explanation": "「も」是「也」：這也是麵包。",
          "id": "g-mo/question/meaning"
        },
        {
          "prompt": "朋友說「これは パンです」。你指著朋友那邊的另一個麵包說：それ＿＿ パンです。",
          "options": [
            "も",
            "の",
            "か"
          ],
          "readings": [
            "mo",
            "no",
            "ka"
          ],
          "answer": 0,
          "explanation": "和前面說的一樣，用「も」：それも パンです。",
          "id": "g-mo/question/that-too"
        }
      ]
    },
    {
      "id": "g-to",
      "type": "grammar",
      "title": "和：AとB",
      "subtitle": "把名詞一個一個列出來",
      "steps": [
        {
          "title": "と：A 和 B",
          "example": "パンと みず",
          "reading": "pan to mizu",
          "meaning": "麵包和水",
          "body": "「と」把名詞連起來，像中文的「和」。當「和」用時只連名詞，不能用來連兩個句子（「と」還有其他用法，之後再學）。",
          "id": "g-to/card/to"
        },
        {
          "title": "指著東西說",
          "example": "これと それです。",
          "reading": "kore to sore desu",
          "meaning": "是這個和那個。",
          "body": "買東西時指著兩樣東西說，店員就知道你要哪些。",
          "id": "g-to/card/point"
        },
        {
          "title": "人也可以連",
          "example": "わたしと たなかさんは がくせいです。",
          "reading": "watashi to tanaka san wa gakusei desu",
          "meaning": "我和田中先生是學生。",
          "body": "「わたしと たなかさん」整個當作句子的主題，後面照樣接「は」。",
          "id": "g-to/card/people"
        }
      ],
      "questions": [
        {
          "prompt": "想說「麵包和水」：パン＿＿みず",
          "options": [
            "と",
            "の",
            "も"
          ],
          "readings": [
            "to",
            "no",
            "mo"
          ],
          "answer": 0,
          "explanation": "把兩個名詞列出來用「と」：パンと みず。「パンの みず」變成「麵包的水」；「も」是「也」，不是「和」。",
          "id": "g-to/question/and"
        },
        {
          "prompt": "「パンと みず」是什麼意思？",
          "options": [
            "麵包和水",
            "麵包的水",
            "麵包也是水"
          ],
          "answer": 0,
          "explanation": "「と」是「和」：麵包和水。",
          "id": "g-to/question/meaning"
        },
        {
          "prompt": "指著兩樣東西告訴店員：これ＿＿それです。",
          "options": [
            "と",
            "も",
            "の"
          ],
          "readings": [
            "to",
            "mo",
            "no"
          ],
          "answer": 0,
          "explanation": "要這個和那個，用「と」連起來：これと それです。「も」是「也」，不是「和」；「の」是「的」。",
          "id": "g-to/question/point"
        }
      ]
    },
    {
      "id": "g-kara-made",
      "type": "grammar",
      "title": "從哪裡到哪裡：から・まで",
      "subtitle": "起點和終點",
      "steps": [
        {
          "title": "から：起點",
          "example": "とうきょうから",
          "reading": "toukyou kara",
          "meaning": "從東京",
          "body": "「から」放在地點後面，表示從那裡出發。",
          "id": "g-kara-made/card/kara"
        },
        {
          "title": "まで：終點",
          "example": "きょうとまで",
          "reading": "kyouto made",
          "meaning": "到京都",
          "body": "「まで」放在地點後面，表示到那裡為止。買車票時說「京都まで」就是這個用法。",
          "id": "g-kara-made/card/made"
        },
        {
          "title": "從哪裡到哪裡",
          "example": "ここから えきまで",
          "reading": "koko kara eki made",
          "meaning": "從這裡到車站",
          "body": "起點用「から」、終點用「まで」，順序和中文的「從…到…」一樣。時間的「幾點到幾點」也用這兩個詞，學過時間之後再練。「から」接在地點後面是「從」；它也有「因為」的意思，那是接在句子後面，之後再學。",
          "id": "g-kara-made/card/both"
        }
      ],
      "questions": [
        {
          "prompt": "想說「從東京」：とうきょう＿＿",
          "options": [
            "から",
            "まで",
            "の"
          ],
          "readings": [
            "kara",
            "made",
            "no"
          ],
          "answer": 0,
          "explanation": "起點用「から」：とうきょうから。「まで」是終點，「とうきょうの」是「東京的」。",
          "id": "g-kara-made/question/kara"
        },
        {
          "prompt": "想說「到京都」：きょうと＿＿",
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
          "explanation": "終點用「まで」：きょうとまで。「から」是起點，「きょうとの」是「京都的」。",
          "id": "g-kara-made/question/made"
        },
        {
          "prompt": "「えきから ここまで」是什麼意思？",
          "options": [
            "從車站到這裡",
            "從這裡到車站",
            "因為車站在這裡"
          ],
          "answer": 0,
          "explanation": "「えきから」是從車站，「ここまで」是到這裡：從車站到這裡。這裡的「から」不是「因為」。",
          "id": "g-kara-made/question/meaning"
        }
      ]
    },
    {
      "id": "g-days",
      "type": "grammar",
      "title": "時間詞：きのう・きょう・あした",
      "subtitle": "昨天、今天、明天、現在",
      "steps": [
        {
          "title": "昨天、今天、明天",
          "example": "きのう ／ きょう ／ あした",
          "reading": "kinou / kyou / ashita",
          "meaning": "昨天 ／ 今天 ／ 明天",
          "body": "以今天為中心：前一天是 きのう，後一天是 あした。漢字寫成 昨日、今日、明日，先記讀音就好。",
          "id": "g-days/card/three-days"
        },
        {
          "title": "放進名詞句",
          "example": "あしたは やすみです。",
          "reading": "ashita wa yasumi desu",
          "meaning": "明天休假。",
          "body": "時間詞可以當句子的主題，後面照樣接「は」和「です」。「やすみ」是休假、休息；店家公休也用這個詞。說昨天的事，「です」要換成過去的說法，之後再學。",
          "id": "g-days/card/sentence"
        },
        {
          "title": "現在：いま",
          "example": "いまは やすみです。",
          "reading": "ima wa yasumi desu",
          "meaning": "現在是休息時間。",
          "body": "「いま」是現在這個時候。問「現在幾點」要用到數字，學過數字後再練。",
          "id": "g-days/card/now"
        },
        {
          "title": "問什麼時候：いつ",
          "example": "やすみは いつですか。 ／ あしたです。",
          "reading": "yasumi wa itsu desu ka / ashita desu",
          "meaning": "什麼時候休假？／ 明天。",
          "body": "「いつ」問什麼時候，回答時換成時間詞，後面接「です」。",
          "id": "g-days/card/itsu"
        }
      ],
      "questions": [
        {
          "prompt": "假設今天是 10 月 15 日。10 月 16 日要怎麼說？",
          "options": [
            "あした",
            "きのう",
            "きょう"
          ],
          "readings": [
            "ashita",
            "kinou",
            "kyou"
          ],
          "answer": 0,
          "explanation": "今天的後一天是「あした」（明天）。「きのう」是昨天，「きょう」是今天。",
          "id": "g-days/question/tomorrow"
        },
        {
          "prompt": "假設今天是 10 月 15 日。10 月 14 日要怎麼說？",
          "options": [
            "きのう",
            "あした",
            "いま"
          ],
          "readings": [
            "kinou",
            "ashita",
            "ima"
          ],
          "answer": 0,
          "explanation": "今天的前一天是「きのう」（昨天）。「あした」是明天，「いま」是現在，不是某一天。",
          "id": "g-days/question/yesterday"
        },
        {
          "prompt": "「あしたは やすみです。」是什麼意思？",
          "options": [
            "明天休假。",
            "今天休假。",
            "昨天休假。"
          ],
          "answer": 0,
          "explanation": "「あした」是明天，「やすみ」是休假：明天休假。今天是「きょう」，昨天是「きのう」。",
          "id": "g-days/question/meaning"
        },
        {
          "prompt": "想問朋友什麼時候休假：やすみは＿＿ですか。",
          "options": [
            "いつ",
            "いま",
            "どこ"
          ],
          "readings": [
            "itsu",
            "ima",
            "doko"
          ],
          "answer": 0,
          "explanation": "問什麼時候用「いつ」：やすみは いつですか。「やすみは いまですか」是問「現在是休息時間嗎？」；「どこ」問地點。",
          "id": "g-days/question/itsu"
        }
      ]
    },
    {
      "id": "g-day-parts",
      "type": "grammar",
      "title": "時間詞：あさ・ひる・よる",
      "subtitle": "早上、中午、晚上",
      "steps": [
        {
          "title": "一天的三個時段",
          "example": "あさ ／ ひる ／ よる",
          "reading": "asa / hiru / yoru",
          "meaning": "早上 ／ 中午 ／ 晚上",
          "body": "「あさ」是早上，「ひる」是中午，也可以指白天，「よる」是晚上。",
          "id": "g-day-parts/card/parts"
        },
        {
          "title": "明天早上",
          "example": "あしたの あさ",
          "reading": "ashita no asa",
          "meaning": "明天早上",
          "body": "把「あした」和「あさ」用「の」連起來，就是「明天早上」。",
          "id": "g-day-parts/card/with-no"
        },
        {
          "title": "放進句子裡",
          "example": "きょうの よるは やすみです。",
          "reading": "kyou no yoru wa yasumi desu",
          "meaning": "今天晚上休息。",
          "body": "「きょうの よる」整個當作句子的主題，後面照樣接「は」和「です」。",
          "id": "g-day-parts/card/sentence"
        }
      ],
      "questions": [
        {
          "prompt": "晚上 8 點左右，是一天的哪個時段？",
          "options": [
            "よる",
            "あさ",
            "ひる"
          ],
          "readings": [
            "yoru",
            "asa",
            "hiru"
          ],
          "answer": 0,
          "explanation": "晚上是「よる」。「あさ」是早上，「ひる」是中午。",
          "id": "g-day-parts/question/evening"
        },
        {
          "prompt": "想說「明天早上」：あした＿＿あさ",
          "options": [
            "の",
            "と",
            "も"
          ],
          "readings": [
            "no",
            "to",
            "mo"
          ],
          "answer": 0,
          "explanation": "兩個名詞連起來，前面說明後面，用「の」：あしたの あさ。「と」是「和」，「も」是「也」。",
          "id": "g-day-parts/question/no"
        },
        {
          "prompt": "「きょうの よる」是什麼意思？",
          "options": [
            "今天晚上",
            "今天早上",
            "昨天晚上"
          ],
          "answer": 0,
          "explanation": "「きょう」是今天，「よる」是晚上：今天晚上。早上是「あさ」，昨天是「きのう」。",
          "id": "g-day-parts/question/meaning"
        }
      ]
    },
    {
      "id": "g-weekdays",
      "type": "grammar",
      "title": "星期：げつようび～にちようび",
      "subtitle": "星期幾、問星期幾",
      "steps": [
        {
          "title": "星期一到星期五",
          "example": "げつようび ／ かようび ／ すいようび ／ もくようび ／ きんようび",
          "reading": "getsuyoubi / kayoubi / suiyoubi / mokuyoubi / kin'youbi",
          "meaning": "星期一 ／ 星期二 ／ 星期三 ／ 星期四 ／ 星期五",
          "body": "日文的星期依序用月、火、水、木、金、土、日，後面加「ようび」（曜日）。羅馬字 kin'youbi 的「'」表示 ん 和 よ 分開念，不是 にょ。",
          "id": "g-weekdays/card/weekdays"
        },
        {
          "title": "週末",
          "example": "どようび ／ にちようび",
          "reading": "doyoubi / nichiyoubi",
          "meaning": "星期六 ／ 星期日",
          "body": "星期六是 どようび（土），星期日是 にちようび（日）。",
          "id": "g-weekdays/card/weekend"
        },
        {
          "title": "問星期幾",
          "example": "きょうは なんようびですか。",
          "reading": "kyou wa nan'youbi desu ka",
          "meaning": "今天星期幾？",
          "body": "問星期幾用「なんようび」，回答時換成星期的說法，例如「もくようびです」。",
          "id": "g-weekdays/card/ask"
        }
      ],
      "questions": [
        {
          "prompt": "星期五怎麼說？",
          "options": [
            "きんようび",
            "げつようび",
            "もくようび"
          ],
          "readings": [
            "kin'youbi",
            "getsuyoubi",
            "mokuyoubi"
          ],
          "answer": 0,
          "explanation": "星期五用「金」：きんようび。げつようび 是星期一，もくようび 是星期四。",
          "id": "g-weekdays/question/friday"
        },
        {
          "prompt": "假設今天是星期一（げつようび）。明天是星期幾？",
          "options": [
            "かようび",
            "すいようび",
            "にちようび"
          ],
          "readings": [
            "kayoubi",
            "suiyoubi",
            "nichiyoubi"
          ],
          "answer": 0,
          "explanation": "星期一的下一天是星期二：かようび。すいようび 是星期三，にちようび 是星期日。",
          "id": "g-weekdays/question/next-day"
        },
        {
          "prompt": "想問今天星期幾：きょうは＿＿ですか。",
          "options": [
            "なんようび",
            "どようび",
            "なん"
          ],
          "readings": [
            "nan'youbi",
            "doyoubi",
            "nan"
          ],
          "answer": 0,
          "explanation": "問星期幾用「なんようび」：きょうは なんようびですか。「きょうは どようびですか」是問「今天是星期六嗎？」；只說「なん」是問「什麼」。",
          "id": "g-weekdays/question/ask"
        }
      ]
    },
    {
      "id": "g-numbers",
      "type": "grammar",
      "title": "數字：0～10",
      "subtitle": "先會數到十",
      "steps": [
        {
          "title": "1 到 5",
          "example": "いち ／ に ／ さん ／ よん ／ ご",
          "reading": "ichi / ni / san / yon / go",
          "meaning": "一 ／ 二 ／ 三 ／ 四 ／ 五",
          "body": "4 有 よん、し 兩種念法，單獨說數字時多用 よん。接在某些詞前面還會變成 よ（例如幾點、幾個人），之後再學。",
          "id": "g-numbers/card/one-five"
        },
        {
          "title": "6 到 10",
          "example": "ろく ／ なな ／ はち ／ きゅう ／ じゅう",
          "reading": "roku / nana / hachi / kyuu / juu",
          "meaning": "六 ／ 七 ／ 八 ／ 九 ／ 十",
          "body": "7 有 なな、しち，9 有 きゅう、く 兩種念法，單獨說數字時多用 なな、きゅう。說幾點時有特定的念法，之後學到再練。",
          "id": "g-numbers/card/six-ten"
        },
        {
          "title": "零",
          "example": "ゼロ",
          "reading": "zero",
          "meaning": "零",
          "body": "0 常說 ゼロ，也可以念 れい。",
          "id": "g-numbers/card/zero"
        }
      ],
      "questions": [
        {
          "prompt": "「さん」是數字幾？",
          "options": [
            "3",
            "4",
            "8"
          ],
          "answer": 0,
          "explanation": "「さん」是 3（接在名字後面的「さん」是另一個詞）。4 是 よん，8 是 はち。",
          "id": "g-numbers/question/san"
        },
        {
          "prompt": "數字 7 怎麼念？",
          "options": [
            "なな",
            "はち",
            "ろく"
          ],
          "readings": [
            "nana",
            "hachi",
            "roku"
          ],
          "answer": 0,
          "explanation": "7 念 なな，也可以念 しち。はち 是 8，ろく 是 6。",
          "id": "g-numbers/question/seven"
        },
        {
          "prompt": "「きゅう」是數字幾？",
          "options": [
            "9",
            "5",
            "1"
          ],
          "answer": 0,
          "explanation": "「きゅう」是 9（也念 く）。5 是 ご，1 是 いち。",
          "id": "g-numbers/question/kyuu"
        }
      ]
    },
    {
      "id": "g-prices",
      "type": "grammar",
      "title": "數字：十、百、千與價錢",
      "subtitle": "問多少錢、聽懂價格",
      "steps": [
        {
          "title": "十、百、千",
          "example": "じゅう ／ ひゃく ／ せん",
          "reading": "juu / hyaku / sen",
          "meaning": "十 ／ 一百 ／ 一千",
          "body": "在 じゅう、ひゃく、せん 前面加上 2～9，就是幾十、幾百、幾千，例如 にじゅう（20）、ごひゃく（500）。100 和 1000 直接說 ひゃく、せん，前面不加 いち。300、600、800 的讀音會變，下一張說明；3000（さんぜん）、8000（はっせん）也會變，之後再學。",
          "id": "g-prices/card/units"
        },
        {
          "title": "讀音會變的百位",
          "example": "さんびゃく ／ ろっぴゃく ／ はっぴゃく",
          "reading": "sanbyaku / roppyaku / happyaku",
          "meaning": "三百 ／ 六百 ／ 八百",
          "body": "這三個的 ひゃく 會變成 びゃく 或 ぴゃく，6 和 8 還多了小的 っ。其他的百位照規則念，例如 よんひゃく（400）、ななひゃく（700）。",
          "id": "g-prices/card/sound-change"
        },
        {
          "title": "價格：〜えん",
          "example": "ひゃくえん ／ せんえん",
          "reading": "hyaku en / sen en",
          "meaning": "100 日圓 ／ 1000 日圓",
          "body": "日圓是「えん」（円），接在數字後面。價格常寫成 100円 或 ¥100。4 日圓念 よえん，不念 よんえん。",
          "id": "g-prices/card/yen"
        },
        {
          "title": "問價格：いくら",
          "example": "これは いくらですか。 ／ ごひゃくえんです。",
          "reading": "kore wa ikura desu ka / gohyaku en desu",
          "meaning": "這個多少錢？／ 500 日圓。",
          "body": "「いくら」問多少錢。這課先練 1000 日圓以內的價格；位數從大到小接著念，例如 350 日圓是 さんびゃく ごじゅうえん。",
          "id": "g-prices/card/ikura"
        }
      ],
      "questions": [
        {
          "prompt": "「ひゃくえん」是多少錢？",
          "options": [
            "100 日圓",
            "1000 日圓",
            "10 日圓"
          ],
          "answer": 0,
          "explanation": "「ひゃく」是 100，所以是 100 日圓。1000 是 せん，10 是 じゅう。",
          "id": "g-prices/question/hyaku"
        },
        {
          "prompt": "500 日圓怎麼說？",
          "options": [
            "ごひゃくえん",
            "ごせんえん",
            "ごじゅうえん"
          ],
          "readings": [
            "gohyaku en",
            "gosen en",
            "gojuu en"
          ],
          "answer": 0,
          "explanation": "5 個 100 是 ごひゃく：ごひゃくえん。ごせん 是 5000，ごじゅう 是 50。",
          "id": "g-prices/question/gohyaku"
        },
        {
          "prompt": "300 日圓怎麼說？",
          "options": [
            "さんびゃくえん",
            "さんひゃくえん",
            "さんじゅうえん"
          ],
          "readings": [
            "sanbyaku en",
            "sanhyaku en",
            "sanjuu en"
          ],
          "answer": 0,
          "explanation": "300 的 ひゃく 要變成 びゃく：さんびゃくえん，不說 さんひゃくえん。さんじゅう 是 30。",
          "id": "g-prices/question/sanbyaku"
        },
        {
          "prompt": "想問這個多少錢：これは＿＿ですか。",
          "options": [
            "いくら",
            "なん",
            "どこ"
          ],
          "readings": [
            "ikura",
            "nan",
            "doko"
          ],
          "answer": 0,
          "explanation": "問價格用「いくら」。「なん」問是什麼東西，「どこ」問地點。",
          "id": "g-prices/question/ask"
        }
      ]
    },
    {
      "id": "g-counting",
      "type": "grammar",
      "title": "數東西：ひとつ～いつつ",
      "subtitle": "一個到五個、問幾個",
      "steps": [
        {
          "title": "一個到五個",
          "example": "ひとつ ／ ふたつ ／ みっつ ／ よっつ ／ いつつ",
          "reading": "hitotsu / futatsu / mittsu / yottsu / itsutsu",
          "meaning": "一個 ／ 兩個 ／ 三個 ／ 四個 ／ 五個",
          "body": "數一般的東西用這一組，和 いち、に、さん 的念法不同。點餐、買東西時常用到。",
          "id": "g-counting/card/tsu"
        },
        {
          "title": "幾個？多少錢？",
          "example": "いくつですか。 ／ いくらですか。",
          "reading": "ikutsu desu ka / ikura desu ka",
          "meaning": "幾個？／ 多少錢？",
          "body": "「いくつ」問數量（幾個），「いくら」問價錢（多少錢）。兩個只差最後一個音，聽的時候要注意。",
          "id": "g-counting/card/ikutsu"
        },
        {
          "title": "和名詞一起說",
          "example": "パンは いくつですか。 ／ みっつです。",
          "reading": "pan wa ikutsu desu ka / mittsu desu",
          "meaning": "麵包要幾個？／ 三個。",
          "body": "先說東西，再問或回答數量。",
          "id": "g-counting/card/thing"
        }
      ],
      "questions": [
        {
          "prompt": "想說「兩個」：＿＿です。",
          "options": [
            "ふたつ",
            "ひとつ",
            "みっつ"
          ],
          "readings": [
            "futatsu",
            "hitotsu",
            "mittsu"
          ],
          "answer": 0,
          "explanation": "兩個是「ふたつ」。ひとつ 是一個，みっつ 是三個。",
          "id": "g-counting/question/two"
        },
        {
          "prompt": "店員問「いくつですか」，是在問什麼？",
          "options": [
            "要幾個",
            "多少錢",
            "是什麼"
          ],
          "answer": 0,
          "explanation": "「いくつ」問數量（幾個）。問多少錢是「いくら」，問是什麼是「なん」。",
          "id": "g-counting/question/ikutsu"
        },
        {
          "prompt": "「よっつ」是幾個？",
          "options": [
            "四個",
            "三個",
            "五個"
          ],
          "answer": 0,
          "explanation": "「よっつ」是四個。みっつ 是三個，いつつ 是五個。",
          "id": "g-counting/question/yottsu"
        }
      ]
    },
    {
      "id": "g-people",
      "type": "grammar",
      "title": "人數：ひとり・ふたり・〜にん",
      "subtitle": "幾個人",
      "steps": [
        {
          "title": "一個人、兩個人",
          "example": "ひとり ／ ふたり",
          "reading": "hitori / futari",
          "meaning": "一個人 ／ 兩個人",
          "body": "一個人、兩個人的說法比較特別：ひとり、ふたり。",
          "id": "g-people/card/one-two"
        },
        {
          "title": "三個人以上：〜にん",
          "example": "さんにん ／ よにん ／ ごにん",
          "reading": "sannin / yonin / gonin",
          "meaning": "三個人 ／ 四個人 ／ 五個人",
          "body": "三個人以上用數字加「にん」（人）。四個人念 よにん，不念 よんにん。",
          "id": "g-people/card/nin"
        },
        {
          "title": "問幾個人",
          "example": "なんにんですか。 ／ ふたりです。",
          "reading": "nannin desu ka / futari desu",
          "meaning": "幾個人？／ 兩個人。",
          "body": "問人數用「なんにん」。餐廳店員常用更客氣的「なんめいさまですか」（何名様ですか），意思一樣，回答照樣說「ふたりです」。",
          "id": "g-people/card/ask"
        }
      ],
      "questions": [
        {
          "prompt": "三個人怎麼說？",
          "options": [
            "さんにん",
            "みっつ",
            "さん"
          ],
          "readings": [
            "sannin",
            "mittsu",
            "san"
          ],
          "answer": 0,
          "explanation": "三個人以上用「〜にん」：さんにん。「みっつ」是數東西的三個，「さん」只是數字 3。",
          "id": "g-people/question/three"
        },
        {
          "prompt": "店員問人數，你們是兩個人：＿＿です。",
          "options": [
            "ふたり",
            "ふたつ",
            "ににん"
          ],
          "readings": [
            "futari",
            "futatsu",
            "ninin"
          ],
          "answer": 0,
          "explanation": "兩個人是「ふたり」，是特別的說法，不說 ににん。「ふたつ」是數東西的兩個。",
          "id": "g-people/question/two"
        },
        {
          "prompt": "四個人怎麼說？",
          "options": [
            "よにん",
            "よんにん",
            "よっつ"
          ],
          "readings": [
            "yonin",
            "yonnin",
            "yottsu"
          ],
          "answer": 0,
          "explanation": "四個人固定念「よにん」，不念 よんにん。「よっつ」是數東西的四個。",
          "id": "g-people/question/four"
        }
      ]
    },
    {
      "id": "g-clock",
      "type": "grammar",
      "title": "幾點：〜じ・〜はん",
      "subtitle": "整點、半點、問幾點",
      "steps": [
        {
          "title": "整點：〜じ",
          "example": "いちじ ／ にじ ／ さんじ",
          "reading": "ichiji / niji / sanji",
          "meaning": "1 點 ／ 2 點 ／ 3 點",
          "body": "數字後面加「じ」（時）就是幾點。",
          "id": "g-clock/card/ji"
        },
        {
          "title": "要特別記的念法",
          "example": "よじ ／ しちじ ／ くじ",
          "reading": "yoji / shichiji / kuji",
          "meaning": "4 點 ／ 7 點 ／ 9 點",
          "body": "4 點念 よじ，7 點念 しちじ，9 點念 くじ。也有人把 7 點說成 ななじ。",
          "id": "g-clock/card/special"
        },
        {
          "title": "半點：〜はん",
          "example": "にじはん",
          "reading": "nijihan",
          "meaning": "2 點半",
          "body": "「はん」是半，接在幾點後面。",
          "id": "g-clock/card/han",
          "speech": "にじハン"
        },
        {
          "title": "問幾點",
          "example": "いま、なんじですか。 ／ さんじはんです。",
          "reading": "ima, nanji desu ka / sanjihan desu",
          "meaning": "現在幾點？／ 3 點半。",
          "body": "問幾點用「なんじ」。回答時說幾點，後面接「です」。",
          "id": "g-clock/card/ask",
          "speech": "いま、なんじですか。 ／ さんじハンです。"
        }
      ],
      "questions": [
        {
          "prompt": "4 點怎麼說？",
          "options": [
            "よじ",
            "よんじ",
            "しじ"
          ],
          "readings": [
            "yoji",
            "yonji",
            "shiji"
          ],
          "answer": 0,
          "explanation": "4 點固定念「よじ」，不念 よんじ 或 しじ。",
          "id": "g-clock/question/four"
        },
        {
          "prompt": "9 點怎麼說？",
          "options": [
            "くじ",
            "きゅうじ",
            "くじはん"
          ],
          "readings": [
            "kuji",
            "kyuuji",
            "kujihan"
          ],
          "answer": 0,
          "explanation": "9 點固定念「くじ」，不念 きゅうじ。くじはん 是 9 點半。",
          "id": "g-clock/question/nine"
        },
        {
          "prompt": "「にじはん」是幾點？",
          "options": [
            "2 點半",
            "2 點",
            "3 點半"
          ],
          "answer": 0,
          "explanation": "「にじ」是 2 點，「はん」是半：2 點半。只說「にじ」是 2 點整；3 點半是 さんじはん。",
          "id": "g-clock/question/han"
        },
        {
          "prompt": "想問現在幾點：いま、＿＿ですか。",
          "options": [
            "なんじ",
            "なんようび",
            "なんにん"
          ],
          "readings": [
            "nanji",
            "nan'youbi",
            "nannin"
          ],
          "answer": 0,
          "explanation": "問幾點用「なんじ」。なんようび 問星期幾，なんにん 問幾個人。",
          "id": "g-clock/question/ask"
        }
      ]
    },
    {
      "id": "g-kara-made-time",
      "type": "grammar",
      "title": "幾點到幾點：〜から〜まで",
      "subtitle": "時間的起點與終點",
      "steps": [
        {
          "title": "幾點到幾點",
          "example": "くじから ごじまで",
          "reading": "kuji kara goji made",
          "meaning": "從 9 點到 5 點",
          "body": "時間的起點接「から」，終點接「まで」，和地點的用法一樣。",
          "id": "g-kara-made-time/card/hours"
        },
        {
          "title": "星期幾到星期幾",
          "example": "げつようびから きんようびまで",
          "reading": "getsuyoubi kara kin'youbi made",
          "meaning": "從星期一到星期五",
          "body": "日子也一樣，起點接「から」，終點接「まで」。",
          "id": "g-kara-made-time/card/days"
        },
        {
          "title": "放進句子裡",
          "example": "ひるやすみは じゅうにじから いちじまでです。",
          "reading": "hiruyasumi wa juuniji kara ichiji made desu",
          "meaning": "午休是 12 點到 1 點。",
          "body": "「ひるやすみ」是午休（ひる＋やすみ），「じゅうにじ」是 12 點（じゅう＋に）。整句是名詞句：〜は 〜から 〜までです。",
          "id": "g-kara-made-time/card/sentence"
        }
      ],
      "questions": [
        {
          "prompt": "想說「從 9 點」：くじ＿＿",
          "options": [
            "から",
            "まで",
            "の"
          ],
          "readings": [
            "kara",
            "made",
            "no"
          ],
          "answer": 0,
          "explanation": "起點用「から」：くじから。「まで」是終點，「くじの」是「9 點的」。",
          "id": "g-kara-made-time/question/kara"
        },
        {
          "prompt": "朋友說「すいようびまで やすみです」，是什麼意思？",
          "options": [
            "休假到星期三。",
            "從星期三開始休假。",
            "只有星期三休假。"
          ],
          "answer": 0,
          "explanation": "「まで」是終點：休假到星期三為止。從星期三開始要說「すいようびから」；只有星期三休假不會用「まで」。",
          "id": "g-kara-made-time/question/meaning"
        },
        {
          "prompt": "店家營業到晚上 8 點：はちじ＿＿です。",
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
          "explanation": "終點用「まで」：はちじまで（到 8 點）。「はちじから」是從 8 點開始，「はちじの」是「8 點的」。",
          "id": "g-kara-made-time/question/made"
        }
      ]
    },
    {
      "id": "g-verbs",
      "type": "grammar",
      "title": "動作句：〜を 〜ます",
      "subtitle": "吃、喝、買",
      "steps": [
        {
          "title": "吃什麼：を",
          "example": "パンを たべます。",
          "reading": "pan o tabemasu",
          "meaning": "吃麵包。",
          "body": "「たべます」是吃。像吃、喝、買這些表示動作的詞，叫做「動詞」。日文先說吃的東西，再說動作：パンを たべます＝吃麵包。中間的「を」讀 o。",
          "id": "g-verbs/card/taberu"
        },
        {
          "title": "動詞放在後面",
          "example": "みずを のみます。",
          "reading": "mizu o nomimasu",
          "meaning": "喝水。",
          "body": "「たべます」是吃，「のみます」是喝。中文說「喝水」，日文把動詞放在後面：みずを のみます。這幾課的動詞都用禮貌的「〜ます」形。",
          "id": "g-verbs/card/nomu"
        },
        {
          "title": "買：かいます",
          "example": "パンを かいます。",
          "reading": "pan o kaimasu",
          "meaning": "買麵包。",
          "body": "「かいます」是買。吃什麼、喝什麼、買什麼，都用「を」接東西。",
          "id": "g-verbs/card/kau"
        }
      ],
      "questions": [
        {
          "prompt": "想說「喝水」：みず＿＿のみます。",
          "options": [
            "を",
            "の",
            "と"
          ],
          "readings": [
            "o",
            "no",
            "to"
          ],
          "answer": 0,
          "explanation": "喝的東西用「を」：みずを のみます。「みずの」是「水的」，「みずと」是「水和…」，都不能標出要喝的東西。",
          "id": "g-verbs/question/wo"
        },
        {
          "prompt": "「みずを かいます」是什麼意思？",
          "options": [
            "買水",
            "喝水",
            "買麵包"
          ],
          "answer": 0,
          "explanation": "「みず」是水，「かいます」是買：買水。喝是「のみます」，麵包是「パン」。",
          "id": "g-verbs/question/meaning"
        },
        {
          "prompt": "「みずを のみます」裡的「を」怎麼念？",
          "options": [
            "o",
            "wo",
            "wa"
          ],
          "answer": 0,
          "explanation": "當助詞的「を」一般念 o，和「お」同音。羅馬字有時寫成 wo，念法還是 o；wa 是助詞「は」的念法。",
          "id": "g-verbs/question/reading"
        }
      ]
    },
    {
      "id": "g-masen",
      "type": "grammar",
      "title": "動作句否定：〜ません",
      "subtitle": "不吃、不喝、不去",
      "steps": [
        {
          "title": "不做：ません",
          "example": "パンを たべません。",
          "reading": "pan o tabemasen",
          "meaning": "不吃麵包。",
          "body": "把「ます」換成「ません」，就是不做這個動作。",
          "id": "g-masen/card/masen"
        },
        {
          "title": "換個東西",
          "example": "コーヒーを のみません。",
          "reading": "koohii o nomimasen",
          "meaning": "不喝咖啡。",
          "body": "「コーヒー」是咖啡，片假名的「ー」是長音。",
          "id": "g-masen/card/coffee"
        },
        {
          "title": "回答要不要去",
          "example": "あした いきますか。 ／ いいえ、いきません。",
          "reading": "ashita ikimasu ka / iie, ikimasen",
          "meaning": "明天要去嗎？／ 不，不去。",
          "body": "「いきます」是去。被問「〜ますか」時，不做就回答「いいえ、〜ません」。",
          "id": "g-masen/card/answer"
        }
      ],
      "questions": [
        {
          "prompt": "想說「不喝水」：みずを のみ＿＿。",
          "options": [
            "ません",
            "ます",
            "ますか"
          ],
          "readings": [
            "masen",
            "masu",
            "masu ka"
          ],
          "answer": 0,
          "explanation": "不做這個動作用「ません」：のみません。「ます」是要喝，「ますか」是在問要不要喝。",
          "id": "g-masen/question/masen"
        },
        {
          "prompt": "朋友問「あした いきますか」。你不去：いいえ、＿＿。",
          "options": [
            "いきません",
            "いきます",
            "じゃないです"
          ],
          "readings": [
            "ikimasen",
            "ikimasu",
            "ja nai desu"
          ],
          "answer": 0,
          "explanation": "問「〜ますか」，不去就用動詞的否定：いいえ、いきません。「いいえ、いきます」前後矛盾；「じゃないです」是名詞句的「不是…」，不能代替動詞的否定。",
          "id": "g-masen/question/answer"
        },
        {
          "prompt": "「コーヒーを かいません。」是什麼意思？",
          "options": [
            "不買咖啡。",
            "買咖啡。",
            "不喝咖啡。"
          ],
          "answer": 0,
          "explanation": "「かいません」是不買：不買咖啡。買咖啡是「かいます」，不喝咖啡是「のみません」。",
          "id": "g-masen/question/meaning"
        }
      ]
    },
    {
      "id": "g-mashita",
      "type": "grammar",
      "title": "過去：〜ました・〜ませんでした",
      "subtitle": "昨天做了、昨天沒做",
      "steps": [
        {
          "title": "做了：ました",
          "example": "きのう パンを たべました。",
          "reading": "kinou pan o tabemashita",
          "meaning": "昨天吃了麵包。",
          "body": "把「ます」換成「ました」，就是過去做了這件事。「きのう」這類時間詞常放在句子前面。",
          "id": "g-mashita/card/mashita"
        },
        {
          "title": "沒做：ませんでした",
          "example": "きのう コーヒーを のみませんでした。",
          "reading": "kinou koohii o nomimasen deshita",
          "meaning": "昨天沒有喝咖啡。",
          "body": "過去沒做這件事，用「ませんでした」。",
          "id": "g-mashita/card/masen-deshita"
        },
        {
          "title": "四種說法對照",
          "example": "たべます ／ たべません ／ たべました ／ たべませんでした",
          "reading": "tabemasu / tabemasen / tabemashita / tabemasen deshita",
          "meaning": "吃 ／ 不吃 ／ 吃了 ／ 沒有吃",
          "body": "「ます」「ません」用在現在或之後（あした たべます＝明天要吃），「ました」「ませんでした」用在過去。",
          "id": "g-mashita/card/four-forms"
        }
      ],
      "questions": [
        {
          "prompt": "昨天喝了水：きのう みずを のみ＿＿。",
          "options": [
            "ました",
            "ます",
            "ません"
          ],
          "readings": [
            "mashita",
            "masu",
            "masen"
          ],
          "answer": 0,
          "explanation": "過去做了用「ました」：のみました。「ます」「ません」是現在或之後。",
          "id": "g-mashita/question/mashita"
        },
        {
          "prompt": "「きのう パンを たべませんでした。」是什麼意思？",
          "options": [
            "昨天沒有吃麵包。",
            "昨天吃了麵包。",
            "明天不吃麵包。"
          ],
          "answer": 0,
          "explanation": "「ませんでした」是過去沒做：昨天沒有吃麵包。吃了是「たべました」；明天不吃是「あした たべません」。",
          "id": "g-mashita/question/meaning"
        },
        {
          "prompt": "想說「昨天沒有去」：きのう いき＿＿。",
          "options": [
            "ませんでした",
            "ません",
            "ました"
          ],
          "readings": [
            "masen deshita",
            "masen",
            "mashita"
          ],
          "answer": 0,
          "explanation": "過去沒做用「ませんでした」。「ません」是現在或之後不做，「ました」是做了。",
          "id": "g-mashita/question/not-go"
        }
      ]
    },
    {
      "id": "g-ni-de",
      "type": "grammar",
      "title": "去哪裡、在哪裡做：に・へ・で",
      "subtitle": "目的地與動作的地點",
      "steps": [
        {
          "title": "去哪裡：に／へ",
          "example": "きょうとに いきます。 ／ きょうとへ いきます。",
          "reading": "kyouto ni ikimasu / kyouto e ikimasu",
          "meaning": "去京都。",
          "body": "要去的地方用「に」或「へ」，兩個都可以。中文說「去京都」，但日文要去的地方不用「を」。「へ」當助詞時念 e。",
          "speech": "きょうとに いきます。きょうとえ いきます。",
          "id": "g-ni-de/card/ni-e"
        },
        {
          "title": "在哪裡做：で",
          "example": "えきで パンを かいます。",
          "reading": "eki de pan o kaimasu",
          "meaning": "在車站買麵包。",
          "body": "做動作的地方用「で」：在車站買。",
          "id": "g-ni-de/card/de"
        },
        {
          "title": "比一比",
          "example": "えきに いきます。 ／ えきで かいます。",
          "reading": "eki ni ikimasu / eki de kaimasu",
          "meaning": "去車站。／ 在車站買。",
          "body": "「に」是要去的地方，「で」是做事情的地方。",
          "id": "g-ni-de/card/compare"
        }
      ],
      "questions": [
        {
          "prompt": "想說「在京都買咖啡」：きょうと＿＿コーヒーを かいます。",
          "options": [
            "で",
            "に",
            "を"
          ],
          "readings": [
            "de",
            "ni",
            "o"
          ],
          "answer": 0,
          "explanation": "做動作的地點用「で」：きょうとで かいます。「きょうとに」是要去京都；「を」已經接在買的東西「コーヒー」後面。",
          "id": "g-ni-de/question/de"
        },
        {
          "prompt": "「とうきょうに いきます」的「に」換成哪一個，意思幾乎不變？",
          "options": [
            "へ",
            "で",
            "を"
          ],
          "readings": [
            "e",
            "de",
            "o"
          ],
          "answer": 0,
          "explanation": "要去的地方可以用「に」或「へ」。「で」是做事情的地方；「を」接吃、喝、買的東西，要去的地方不用「を」。",
          "id": "g-ni-de/question/same"
        },
        {
          "prompt": "想說「去京都」：きょうと＿＿いきます。",
          "options": [
            "に",
            "で",
            "を"
          ],
          "readings": [
            "ni",
            "de",
            "o"
          ],
          "answer": 0,
          "explanation": "要去的地方用「に」（也可以用「へ」）。「で」是做事情的地方；「を」接吃、喝、買的東西，要去的地方不用「を」。",
          "id": "g-ni-de/question/go"
        }
      ]
    },
    {
      "id": "g-transport",
      "type": "grammar",
      "title": "交通工具：〜で いきます",
      "subtitle": "搭什麼去",
      "steps": [
        {
          "title": "搭什麼：〜で",
          "example": "でんしゃで いきます。",
          "reading": "densha de ikimasu",
          "meaning": "搭電車去。",
          "body": "交通工具後面接「で」，表示用什麼方式去。「でんしゃ」是電車。",
          "id": "g-transport/card/de"
        },
        {
          "title": "其他交通工具",
          "example": "バスで ／ タクシーで",
          "reading": "basu de / takushii de",
          "meaning": "搭公車 ／ 搭計程車",
          "body": "「バス」是公車、巴士，「タクシー」是計程車。走路去一般說「あるいて いきます」，之後再學。",
          "id": "g-transport/card/more"
        },
        {
          "title": "和地點一起說",
          "example": "きょうとに でんしゃで いきます。",
          "reading": "kyouto ni densha de ikimasu",
          "meaning": "搭電車去京都。",
          "body": "要去的地方用「に」（也可以用「へ」），交通工具用「で」。「えきで かいます」的「で」是做事情的地方，這裡的「で」是方式，要看前面接的是什麼。",
          "id": "g-transport/card/both"
        }
      ],
      "questions": [
        {
          "prompt": "想說「搭公車去」：バス＿＿いきます。",
          "options": [
            "で",
            "に",
            "を"
          ],
          "readings": [
            "de",
            "ni",
            "o"
          ],
          "answer": 0,
          "explanation": "交通工具用「で」：バスで いきます。「に」用在要去的地方；「を」接吃、喝、買的東西。",
          "id": "g-transport/question/bus"
        },
        {
          "prompt": "「タクシーで いきます」是什麼意思？",
          "options": [
            "搭計程車去",
            "搭公車去",
            "搭電車去"
          ],
          "answer": 0,
          "explanation": "「タクシー」是計程車，「で」是交通方式：搭計程車去。公車是「バス」，電車是「でんしゃ」。",
          "id": "g-transport/question/taxi"
        },
        {
          "prompt": "想說「搭電車去京都」：きょうと＿＿ でんしゃで いきます。",
          "options": [
            "に",
            "で",
            "を"
          ],
          "readings": [
            "ni",
            "de",
            "o"
          ],
          "answer": 0,
          "explanation": "要去的地方用「に」（也可以用「へ」）：きょうとに。「きょうとで」是在京都做事情，不是要去的地方；「を」接吃、喝、買的東西。",
          "id": "g-transport/question/place"
        }
      ]
    },
    {
      "id": "g-arimasu",
      "type": "grammar",
      "title": "有、在：あります・います",
      "subtitle": "東西用あります，人和動物用います",
      "steps": [
        {
          "title": "東西：あります",
          "example": "パンが あります。",
          "reading": "pan ga arimasu",
          "meaning": "有麵包。",
          "body": "東西「有、在」用「あります」，前面的「が」標出是什麼東西。「が」和「は」的差別之後再學。",
          "id": "g-arimasu/card/arimasu"
        },
        {
          "title": "人和動物：います",
          "example": "ねこが います。",
          "reading": "neko ga imasu",
          "meaning": "有貓。",
          "body": "人和動物用「います」，東西用「あります」。「ねこ」是貓。",
          "id": "g-arimasu/card/imasu"
        },
        {
          "title": "在哪裡有",
          "example": "あそこに トイレが あります。",
          "reading": "asoko ni toire ga arimasu",
          "meaning": "那裡有廁所。",
          "body": "在哪裡有，用「地點＋に」：あそこに。東西或人在的地方用「に」，做動作的地方用「で」。",
          "id": "g-arimasu/card/place"
        }
      ],
      "questions": [
        {
          "prompt": "想說「那裡有廁所」：あそこに トイレが＿＿。",
          "options": [
            "あります",
            "います",
            "です"
          ],
          "readings": [
            "arimasu",
            "imasu",
            "desu"
          ],
          "answer": 0,
          "explanation": "東西或設施用「あります」。「います」用在人和動物；「です」不能這樣接在「が」後面。",
          "id": "g-arimasu/question/arimasu"
        },
        {
          "prompt": "「あそこに たなかさんが います。」是什麼意思？",
          "options": [
            "田中先生在那裡。",
            "田中先生去那裡。",
            "田中先生在那裡買東西。"
          ],
          "answer": 0,
          "explanation": "「います」表示人在：田中先生在那裡。去是「いきます」，買是「かいます」。",
          "id": "g-arimasu/question/meaning"
        },
        {
          "prompt": "想說「車站有廁所」：えき＿＿トイレが あります。",
          "options": [
            "に",
            "で",
            "を"
          ],
          "readings": [
            "ni",
            "de",
            "o"
          ],
          "answer": 0,
          "explanation": "東西在的地方用「に」：えきに トイレが あります。「で」是做動作的地方（えきで かいます），「を」接動作的對象。",
          "id": "g-arimasu/question/ni"
        },
        {
          "prompt": "選出適合的詞：あそこに ねこ ＿＿ います。",
          "options": [
            "が",
            "を",
            "へ",
            "と"
          ],
          "readings": [
            "ga",
            "o",
            "e",
            "to"
          ],
          "answer": 0,
          "explanation": "「有、在」的句子用「が」標出是什麼：ねこが います。「を」接吃、喝、買的東西，「へ」是要去的地方，「と」是「和」，用來連接名詞。",
          "id": "g-arimasu/question/jabiko-ga"
        }
      ]
    },
    {
      "id": "g-position",
      "type": "grammar",
      "title": "位置：うえ・まえ・となり",
      "subtitle": "在什麼東西的哪一邊",
      "steps": [
        {
          "title": "上、下、裡面",
          "example": "うえ ／ した ／ なか",
          "reading": "ue / shita / naka",
          "meaning": "上面 ／ 下面 ／ 裡面",
          "body": "位置詞接在「名詞＋の」後面，例如「つくえの うえ」是桌子上面（つくえ＝桌子）。",
          "id": "g-position/card/three"
        },
        {
          "title": "前、後、旁邊、附近",
          "example": "まえ ／ うしろ ／ となり ／ ちかく",
          "reading": "mae / ushiro / tonari / chikaku",
          "meaning": "前面 ／ 後面 ／ 旁邊 ／ 附近",
          "body": "「となり」是緊鄰的旁邊、隔壁，「ちかく」是附近、不遠的地方。",
          "id": "g-position/card/four"
        },
        {
          "title": "放進句子裡",
          "example": "えきの まえに コンビニが あります。",
          "reading": "eki no mae ni konbini ga arimasu",
          "meaning": "車站前面有便利商店。",
          "body": "「えきの まえに」＝在車站前面。「コンビニ」是便利商店。",
          "id": "g-position/card/sentence"
        }
      ],
      "questions": [
        {
          "prompt": "想說「桌子上面」：つくえの＿＿",
          "options": [
            "うえ",
            "した",
            "なか"
          ],
          "readings": [
            "ue",
            "shita",
            "naka"
          ],
          "answer": 0,
          "explanation": "上面是「うえ」。「した」是下面，「なか」是裡面。",
          "id": "g-position/question/ue"
        },
        {
          "prompt": "「えきの ちかく」是什麼意思？",
          "options": [
            "車站附近",
            "車站裡面",
            "車站前面"
          ],
          "answer": 0,
          "explanation": "「ちかく」是附近：車站附近。裡面是「なか」，前面是「まえ」。",
          "id": "g-position/question/chikaku"
        },
        {
          "prompt": "車站隔壁就是便利商店：えきの＿＿に コンビニが あります。",
          "options": [
            "となり",
            "うしろ",
            "なか"
          ],
          "readings": [
            "tonari",
            "ushiro",
            "naka"
          ],
          "answer": 0,
          "explanation": "緊鄰的旁邊用「となり」。「うしろ」是後面，「なか」是裡面。",
          "id": "g-position/question/tonari"
        }
      ]
    },
    {
      "id": "g-adj-i",
      "type": "grammar",
      "title": "形容詞（一）：おおきい・たかい",
      "subtitle": "大小、貴和便宜",
      "steps": [
        {
          "title": "大、小",
          "example": "おおきい ／ ちいさい",
          "reading": "ookii / chiisai",
          "meaning": "大 ／ 小",
          "body": "描述大、小、貴、便宜這類樣子的詞，叫做「形容詞」。「おおきい」是大，「ちいさい」是小，這兩個屬於「い形容詞」。先記這兩個例子；不是所有以「い」結尾的詞都屬於這一類。",
          "id": "g-adj-i/card/size"
        },
        {
          "title": "放在句尾",
          "example": "この パンは おおきいです。",
          "reading": "kono pan wa ookii desu",
          "meaning": "這個麵包很大。",
          "body": "い形容詞放在句尾時，後面直接接「です」。",
          "id": "g-adj-i/card/desu"
        },
        {
          "title": "貴、便宜",
          "example": "たかい ／ やすい",
          "reading": "takai / yasui",
          "meaning": "貴（也有「高」的意思）／ 便宜",
          "body": "「たかい」說價錢時是貴，說山或大樓時是高，要看前後文。「やすい」是便宜。",
          "id": "g-adj-i/card/takai"
        },
        {
          "title": "放在名詞前面",
          "example": "おおきい パン ／ やすい コーヒー",
          "reading": "ookii pan / yasui koohii",
          "meaning": "大的麵包 ／ 便宜的咖啡",
          "body": "い形容詞直接放在名詞前面，中間不加「の」。",
          "id": "g-adj-i/card/before-noun"
        }
      ],
      "questions": [
        {
          "prompt": "「この コーヒーは たかいです。」最自然的意思是？",
          "options": [
            "這杯咖啡很貴。",
            "這杯咖啡很高。",
            "這杯咖啡很便宜。"
          ],
          "answer": 0,
          "explanation": "說咖啡時，「たかい」是價錢貴；說山或大樓時才是高。便宜是「やすい」。",
          "id": "g-adj-i/question/takai"
        },
        {
          "prompt": "想說「便宜的麵包」：＿＿ パン",
          "options": [
            "やすい",
            "たかい",
            "おおきい"
          ],
          "readings": [
            "yasui",
            "takai",
            "ookii"
          ],
          "answer": 0,
          "explanation": "便宜是「やすい」，直接放在名詞前面：やすい パン。「たかい」是貴，「おおきい」是大。",
          "id": "g-adj-i/question/yasui"
        },
        {
          "prompt": "想說「小的麵包」，哪一個正確？",
          "options": [
            "ちいさい パン",
            "ちいさいの パン",
            "ちいさです パン"
          ],
          "readings": [
            "chiisai pan",
            "chiisai no pan",
            "chiisa desu pan"
          ],
          "answer": 0,
          "explanation": "い形容詞直接放在名詞前面：ちいさい パン。中間不加「の」，「です」只放在句尾。",
          "id": "g-adj-i/question/no"
        }
      ]
    },
    {
      "id": "g-adj-neg",
      "type": "grammar",
      "title": "形容詞（二）：〜くないです、冷和暖",
      "subtitle": "不貴、冰的、冷的、溫暖的",
      "steps": [
        {
          "title": "不…：くないです",
          "example": "たかくないです。",
          "reading": "takaku nai desu",
          "meaning": "不貴。",
          "body": "い形容詞的否定：把最後的「い」換成「くないです」，たかい → たかくないです。「いい」（好）不照這個規則，之後再學。",
          "id": "g-adj-neg/card/kunai"
        },
        {
          "title": "放進句子裡",
          "example": "この パンは おおきくないです。",
          "reading": "kono pan wa ookiku nai desu",
          "meaning": "這個麵包不大。",
          "body": "おおきい → おおきくないです。名詞句的「じゃないです」不能接在い形容詞後面，不說「おおきいじゃないです」。",
          "id": "g-adj-neg/card/sentence"
        },
        {
          "title": "冰的、溫暖的、天氣冷",
          "example": "つめたい みず ／ あたたかい コーヒー ／ きょうは さむいです。",
          "reading": "tsumetai mizu / atatakai koohii / kyou wa samui desu",
          "meaning": "冰水 ／ 熱咖啡 ／ 今天很冷。",
          "body": "東西摸起來、喝起來冰用「つめたい」，天氣冷用「さむい」，兩個不要混用。「あたたかい」是溫暖，東西和天氣都能用；說飲料、食物時就是熱的（相對於冰的）。天氣很熱另有說法，之後再學。",
          "id": "g-adj-neg/card/cold"
        }
      ],
      "questions": [
        {
          "prompt": "想說「不貴」，哪一個正確？",
          "options": [
            "たかくないです",
            "たかいじゃないです",
            "たかいません"
          ],
          "readings": [
            "takaku nai desu",
            "takai ja nai desu",
            "takai masen"
          ],
          "answer": 0,
          "explanation": "把「い」換成「くないです」：たかくないです。「じゃないです」是名詞句的否定，「ません」是動詞的否定。",
          "id": "g-adj-neg/question/kunai"
        },
        {
          "prompt": "「つめたい みず」是什麼意思？",
          "options": [
            "冰水",
            "溫水",
            "很多水"
          ],
          "answer": 0,
          "explanation": "「つめたい」是摸起來冰：冰水。溫的、暖的是「あたたかい」；「很多水」和冷熱無關。",
          "id": "g-adj-neg/question/tsumetai"
        },
        {
          "prompt": "冬天戶外很冷，說天氣冷要用哪個詞？",
          "options": [
            "さむい",
            "つめたい",
            "あたたかい"
          ],
          "readings": [
            "samui",
            "tsumetai",
            "atatakai"
          ],
          "answer": 0,
          "explanation": "天氣冷用「さむい」。「つめたい」是東西摸起來冰，「あたたかい」是溫暖。",
          "id": "g-adj-neg/question/samui"
        }
      ]
    },
    {
      "id": "g-adj-na",
      "type": "grammar",
      "title": "形容詞（三）：しずか・べんり・きれい",
      "subtitle": "接名詞時加な的形容詞",
      "steps": [
        {
          "title": "句尾和名詞一樣",
          "example": "この へやは しずかです。",
          "reading": "kono heya wa shizuka desu",
          "meaning": "這個房間很安靜。",
          "body": "「しずか」（安靜）、「べんり」（方便）這類形容詞，句尾和名詞一樣接「です」。「へや」是房間。",
          "id": "g-adj-na/card/desu"
        },
        {
          "title": "放在名詞前面加な",
          "example": "しずかな へや ／ べんりな えき",
          "reading": "shizuka na heya / benri na eki",
          "meaning": "安靜的房間 ／ 方便的車站",
          "body": "放在名詞前面時要加「な」，所以叫な形容詞。",
          "id": "g-adj-na/card/na"
        },
        {
          "title": "否定：じゃないです",
          "example": "きれいじゃないです。",
          "reading": "kirei ja nai desu",
          "meaning": "不漂亮／不乾淨。",
          "body": "「きれい」是漂亮、乾淨。な形容詞的否定和名詞句一樣用「じゃないです」。「きれい」最後雖然是「い」，但它是な形容詞，不說 きれくないです。",
          "id": "g-adj-na/card/kirei"
        }
      ],
      "questions": [
        {
          "prompt": "想說「安靜的房間」：しずか＿＿へや",
          "options": [
            "な",
            "の",
            "い"
          ],
          "readings": [
            "na",
            "no",
            "i"
          ],
          "answer": 0,
          "explanation": "な形容詞放在名詞前面要加「な」：しずかな へや。「の」用來連接兩個名詞；「しずかい」不是日文。",
          "id": "g-adj-na/question/na"
        },
        {
          "prompt": "「きれい」的否定是哪一個？",
          "options": [
            "きれいじゃないです",
            "きれくないです",
            "きれいくないです"
          ],
          "readings": [
            "kirei ja nai desu",
            "kirekunai desu",
            "kireikunai desu"
          ],
          "answer": 0,
          "explanation": "「きれい」是な形容詞，否定用「じゃないです」。不能照「たかい → たかくない」那樣改。",
          "id": "g-adj-na/question/kirei"
        },
        {
          "prompt": "「べんりな えき」是什麼意思？",
          "options": [
            "方便的車站",
            "安靜的車站",
            "漂亮的車站"
          ],
          "answer": 0,
          "explanation": "「べんり」是方便：方便的車站。安靜是「しずか」，漂亮是「きれい」。",
          "id": "g-adj-na/question/meaning"
        }
      ]
    },
    {
      "id": "g-who-2",
      "type": "grammar",
      "title": "疑問詞（二）：どう與問法整理",
      "subtitle": "問怎麼樣，分清楚各種問法",
      "steps": [
        {
          "title": "問感覺：どう",
          "example": "この パンは どうですか。 ／ おいしいです。",
          "reading": "kono pan wa dou desu ka / oishii desu",
          "meaning": "這個麵包怎麼樣？／ 很好吃。",
          "body": "「どう」問感覺或狀態（怎麼樣），回答常用形容詞。「おいしい」是好吃。",
          "id": "g-who-2/card/dou"
        },
        {
          "title": "怎麼樣、怎麼去",
          "example": "どうですか。 ／ どうやって いきますか。",
          "reading": "dou desu ka / dou yatte ikimasu ka",
          "meaning": "怎麼樣？／ 怎麼去？",
          "body": "問方法（怎麼去）要說「どうやって」，和問感覺的「どう」不一樣。這裡先認得，之後再練。",
          "id": "g-who-2/card/dou-yatte"
        },
        {
          "title": "整理：問什麼用哪個",
          "example": "いつ ／ どこ ／ だれ ／ なん ／ いくら ／ いくつ ／ どう",
          "reading": "itsu / doko / dare / nan / ikura / ikutsu / dou",
          "meaning": "什麼時候 ／ 哪裡 ／ 誰 ／ 什麼 ／ 多少錢 ／ 幾個 ／ 怎麼樣",
          "body": "先想想對方會怎麼回答：回答時間用「いつ」，地點用「どこ」，價錢用「いくら」，數量用「いくつ」。「いくら」和「いくつ」只差最後一個音，要分清楚。",
          "id": "g-who-2/card/review"
        }
      ],
      "questions": [
        {
          "prompt": "對方回答「あしたです」。你剛才問的是：やすみは＿＿ですか。",
          "options": [
            "いつ",
            "いくら",
            "どこ"
          ],
          "readings": [
            "itsu",
            "ikura",
            "doko"
          ],
          "answer": 0,
          "explanation": "回答是時間（明天），問的就是「いつ」。「いくら」問價錢，「どこ」問地點。",
          "id": "g-who-2/question/itsu"
        },
        {
          "prompt": "朋友回答「おいしいです」。你剛才問的是：この パンは＿＿ですか。",
          "options": [
            "どう",
            "どこ",
            "いくつ"
          ],
          "readings": [
            "dou",
            "doko",
            "ikutsu"
          ],
          "answer": 0,
          "explanation": "回答是感覺（好吃），問的就是「どう」（怎麼樣）。「どこ」問地點，「いくつ」問幾個。",
          "id": "g-who-2/question/dou"
        },
        {
          "prompt": "店員回答「ひゃくえんです」。你剛才問的是：これは＿＿ですか。",
          "options": [
            "いくら",
            "いくつ",
            "どう"
          ],
          "readings": [
            "ikura",
            "ikutsu",
            "dou"
          ],
          "answer": 0,
          "explanation": "回答是價錢（100 日圓），問的就是「いくら」。「いくつ」問幾個，回答會是 ひとつ、ふたつ 這類數量；「どう」問感覺。",
          "id": "g-who-2/question/ikura"
        }
      ]
    },
    {
      "id": "g-soshite-demo",
      "type": "grammar",
      "title": "連接句子：そして・でも",
      "subtitle": "而且、但是",
      "steps": [
        {
          "title": "而且：そして",
          "example": "この パンは やすいです。 そして、おいしいです。",
          "reading": "kono pan wa yasui desu. soshite, oishii desu.",
          "meaning": "這個麵包很便宜。而且很好吃。",
          "body": "「そして」放在第二個句子的開頭，表示再加上一件同方向的事（例如兩個優點），像中文的「而且」。",
          "id": "g-soshite-demo/card/soshite"
        },
        {
          "title": "但是：でも",
          "example": "この パンは おいしいです。 でも、たかいです。",
          "reading": "kono pan wa oishii desu. demo, takai desu.",
          "meaning": "這個麵包很好吃。但是很貴。",
          "body": "「でも」表示前後相反，像中文的「但是」。「でも」還有其他用法，這裡先學「但是」。",
          "id": "g-soshite-demo/card/demo"
        },
        {
          "title": "動作的先後",
          "example": "きのう コーヒーを のみました。 そして、パンを たべました。",
          "reading": "kinou koohii o nomimashita. soshite, pan o tabemashita.",
          "meaning": "昨天喝了咖啡，然後吃了麵包。",
          "body": "「そして」也可以表示「然後」，把做過的事依序說出來。",
          "id": "g-soshite-demo/card/order"
        }
      ],
      "questions": [
        {
          "prompt": "安靜是優點，小是缺點：この へやは しずかです。＿＿、ちいさいです。",
          "options": [
            "でも",
            "そして"
          ],
          "readings": [
            "demo",
            "soshite"
          ],
          "answer": 0,
          "explanation": "一個優點接一個缺點，前後相反，用「でも」（但是）。「そして」是再加上同方向的事，例如兩個優點。",
          "id": "g-soshite-demo/question/demo"
        },
        {
          "prompt": "方便和乾淨都是優點：この えきは べんりです。＿＿、きれいです。",
          "options": [
            "そして",
            "でも"
          ],
          "readings": [
            "soshite",
            "demo"
          ],
          "answer": 0,
          "explanation": "兩個都是優點，是再加上同方向的事，用「そして」。「でも」用在前後相反，例如一個優點接一個缺點。",
          "id": "g-soshite-demo/question/soshite"
        },
        {
          "prompt": "「おいしいです。でも、たかいです。」裡的「でも」最接近哪個意思？",
          "options": [
            "但是",
            "而且",
            "所以"
          ],
          "answer": 0,
          "explanation": "前後相反（好吃／貴），「でも」是但是。「而且」是「そして」；「所以」是因果，好吃和貴之間沒有因果。",
          "id": "g-soshite-demo/question/meaning"
        }
      ]
    },
    {
      "id": "g-kara-reason",
      "type": "grammar",
      "title": "原因：〜から",
      "subtitle": "因為…所以…",
      "steps": [
        {
          "title": "因為…所以…",
          "example": "たかいですから、かいません。",
          "reading": "takai desu kara, kaimasen",
          "meaning": "因為很貴，所以不買。",
          "body": "完整的句子後面接「から」，表示原因：「…から、…」＝因為…，所以…。",
          "id": "g-kara-reason/card/reason"
        },
        {
          "title": "再一個例子",
          "example": "きょうは やすみですから、うちに います。",
          "reading": "kyou wa yasumi desu kara, uchi ni imasu",
          "meaning": "今天休假，所以在家。",
          "body": "「うち」是家。原因放前面，結果放後面。",
          "id": "g-kara-reason/card/example"
        },
        {
          "title": "兩種から",
          "example": "えきから ／ たかいですから",
          "reading": "eki kara / takai desu kara",
          "meaning": "從車站 ／ 因為很貴",
          "body": "名詞後面直接接「から」是起點（從…）；完整的句子（〜です、〜ます）後面接「から」才是原因。",
          "id": "g-kara-reason/card/compare"
        }
      ],
      "questions": [
        {
          "prompt": "「たかいですから、かいません。」是什麼意思？",
          "options": [
            "因為很貴，所以不買。",
            "從很貴的地方開始買。",
            "很貴，但是買了。"
          ],
          "answer": 0,
          "explanation": "句子後面的「から」是原因：因為很貴，所以不買。「從…」是名詞後面的「から」；「但是」是「でも」。",
          "id": "g-kara-reason/question/meaning"
        },
        {
          "prompt": "「とうきょうから」的「から」是什麼意思？",
          "options": [
            "從",
            "因為",
            "到"
          ],
          "answer": 0,
          "explanation": "名詞後面直接接「から」是起點：從東京。「因為」要接在完整的句子後面（〜ですから）；「到」是「まで」。",
          "id": "g-kara-reason/question/start"
        },
        {
          "prompt": "想說「今天休假，所以在家」：きょうは やすみです＿＿、うちに います。",
          "options": [
            "から",
            "まで",
            "でも"
          ],
          "readings": [
            "kara",
            "made",
            "demo"
          ],
          "answer": 0,
          "explanation": "原因用「から」：やすみですから。「でも」是但是，「まで」是到。",
          "id": "g-kara-reason/question/fill"
        }
      ]
    },
    {
      "id": "g-verb-forms",
      "type": "grammar",
      "title": "動詞原形與三類：のむ・たべる・する",
      "subtitle": "字典上的寫法，以及動詞怎麼分組",
      "steps": [
        {
          "title": "ます形和原形",
          "example": "たべます ／ たべる",
          "reading": "tabemasu / taberu",
          "meaning": "吃（禮貌說法）／ 吃（原形）",
          "body": "前面學的「〜ます」是禮貌的說法，叫「ます形」。字典上的寫法叫「原形」（辭書形），查字典或聽到比較隨意的說法時會用到。動詞分成三類，要看「ます」前面的音；下一課的て形也是看這個音來變。",
          "id": "g-verb-forms/card/plain"
        },
        {
          "title": "第一類：i 段換成 u 段",
          "example": "のみます → のむ ／ かいます → かう ／ いきます → いく",
          "reading": "nomimasu → nomu / kaimasu → kau / ikimasu → iku",
          "meaning": "喝 ／ 買 ／ 去",
          "body": "i 段是 i 結尾的音（い、き、み），u 段是 u 結尾的音（う、く、む）。第一類把「ます」前面 i 段的音，換成同一行 u 段的音：み→む、い→う、き→く。",
          "speech": "のみます、のむ。かいます、かう。いきます、いく。",
          "id": "g-verb-forms/card/group1"
        },
        {
          "title": "第二類與第三類",
          "example": "たべます → たべる ／ みます → みる ／ します → する ／ きます → くる",
          "reading": "tabemasu → taberu / mimasu → miru / shimasu → suru / kimasu → kuru",
          "meaning": "吃 ／ 看 ／ 做 ／ 來",
          "body": "第二類：把「ます」換成「る」。「ます」前面是 e 段（e 結尾，像「べ」be）的一定是第二類；i 段的大多是第一類，但「みます」「います」也是第二類（みる、いる），要個別記。第三類只有「します→する」「きます→くる」兩個。",
          "speech": "たべます、たべる。みます、みる。します、する。きます、くる。",
          "id": "g-verb-forms/card/group2-3"
        }
      ],
      "questions": [
        {
          "prompt": "「のみます」的原形是哪一個？",
          "options": [
            "のむ",
            "のみる",
            "のまる"
          ],
          "readings": [
            "nomu",
            "nomiru",
            "nomaru"
          ],
          "answer": 0,
          "explanation": "「のみます」是第一類，把「ます」前的 み 換成同一行的 む：のむ。「のみる」是把「ます」直接換成「る」，那是第二類的變法；「のまる」是把 み 換成 ま 再加「る」，兩種變法混在一起了。",
          "id": "g-verb-forms/question/nomu"
        },
        {
          "prompt": "「たべます」的原形是哪一個？",
          "options": [
            "たべる",
            "たぶ",
            "たべう"
          ],
          "readings": [
            "taberu",
            "tabu",
            "tabeu"
          ],
          "answer": 0,
          "explanation": "「ます」前面是 e 段的「べ」，屬於第二類，把「ます」換成「る」：たべる。「たぶ」「たべう」是照第一類改成 u 結尾的音，但「たべます」不是第一類。",
          "id": "g-verb-forms/question/taberu"
        },
        {
          "prompt": "「します」的原形是哪一個？",
          "options": [
            "する",
            "しる",
            "します"
          ],
          "readings": [
            "suru",
            "shiru",
            "shimasu"
          ],
          "answer": 0,
          "explanation": "「します」是第三類，原形是「する」，要個別記。照第二類把「ます」換成「る」會變成「しる」，那是另一個動詞（知る，知道）；「します」是ます形。",
          "id": "g-verb-forms/question/suru"
        }
      ]
    },
    {
      "id": "g-te-forms",
      "type": "grammar",
      "title": "て形（一）：動詞怎麼變",
      "subtitle": "不一定是把ます直接換成て",
      "steps": [
        {
          "title": "直接換成て",
          "example": "たべます → たべて ／ みます → みて",
          "reading": "tabemasu → tabete / mimasu → mite",
          "meaning": "吃 ／ 看",
          "body": "て形是動詞的另一種形，後面接「ください」可以請別人做事，也能把動作接起來（接下來兩課會學）。「ます」前面那個字讀音是 e 結尾（例如 たべます 的「べ」be），一定是把「ます」換成「て」。「みます」（看）的「み」是 i 結尾，也是直接換成「て」，要個別記。",
          "speech": "たべます、たべて。みます、みて。",
          "id": "g-te-forms/card/simple"
        },
        {
          "title": "會變音的",
          "example": "かいます → かって ／ のみます → のんで ／ まちます → まって",
          "reading": "kaimasu → katte / nomimasu → nonde / machimasu → matte",
          "meaning": "買 ／ 喝 ／ 等",
          "body": "多數「ます」前面是 い、ち、り 的動詞變成「って」，是 み、び、に 的變成「んで」。也有例外，像 みます → みて、います → いて，要個別記。",
          "speech": "かいます、かって。のみます、のんで。まちます、まって。",
          "id": "g-te-forms/card/sound"
        },
        {
          "title": "要另外記的",
          "example": "きます → きて ／ します → して ／ いきます → いって",
          "reading": "kimasu → kite / shimasu → shite / ikimasu → itte",
          "meaning": "來 ／ 做 ／ 去",
          "body": "「きます」（來）、「します」（做）變成 きて、して；「いきます」（去）也是例外，變成 いって。",
          "speech": "きます、きて。します、して。いきます、いって。",
          "id": "g-te-forms/card/irregular"
        }
      ],
      "questions": [
        {
          "prompt": "「たべます」的て形是哪一個？",
          "options": [
            "たべて",
            "たべって",
            "たべんで"
          ],
          "readings": [
            "tabete",
            "tabette",
            "tabende"
          ],
          "answer": 0,
          "explanation": "「たべます」的「べ」讀音是 e 結尾，直接把「ます」換成「て」：たべて。「って」「んで」是其他動詞的變法。",
          "id": "g-te-forms/question/tabete"
        },
        {
          "prompt": "「のみます」的て形是哪一個？",
          "options": [
            "のんで",
            "のみて",
            "のって"
          ],
          "readings": [
            "nonde",
            "nomite",
            "notte"
          ],
          "answer": 0,
          "explanation": "「ます」前面是「み」，照規則變成「んで」：のんで。「みます → みて」是要個別記的例外，不能套到「のみます」；「のって」是別的動詞的て形。",
          "id": "g-te-forms/question/nonde"
        },
        {
          "prompt": "「いきます」（去）的て形是哪一個？",
          "options": [
            "いって",
            "いきて",
            "いいて"
          ],
          "readings": [
            "itte",
            "ikite",
            "iite"
          ],
          "answer": 0,
          "explanation": "「いきます」（去）要另外記，て形是「いって」。「いきて」是直接把「ます」換成「て」，「去」不能這樣變；「いいて」不是日文。",
          "id": "g-te-forms/question/itte"
        }
      ]
    },
    {
      "id": "g-te-kudasai",
      "type": "grammar",
      "title": "て形（二）：〜てください",
      "subtitle": "請對方做某件事",
      "steps": [
        {
          "title": "請等一下",
          "example": "ちょっと まって ください。",
          "reading": "chotto matte kudasai",
          "meaning": "請等一下。",
          "body": "て形加上「ください」＝請（你）做…：まちます（等）→ まって ください。「ちょっと」是一下、稍微。",
          "id": "g-te-kudasai/card/matte"
        },
        {
          "title": "請說慢一點",
          "example": "ゆっくり はなして ください。",
          "reading": "yukkuri hanashite kudasai",
          "meaning": "請說慢一點。",
          "body": "「はなします」（說）的「し」不變音，直接把「ます」換成「て」：はなして。「ゆっくり」是慢慢地。旅遊常用語裡的「ゆっくり話してください」就是這一句。",
          "id": "g-te-kudasai/card/hanashite"
        },
        {
          "title": "請看這個",
          "example": "これを みて ください。",
          "reading": "kore o mite kudasai",
          "meaning": "請看這個。",
          "body": "指著手機畫面請對方看時可以這樣說。",
          "id": "g-te-kudasai/card/mite"
        }
      ],
      "questions": [
        {
          "prompt": "請對方等一下：ちょっと＿＿ ください。",
          "options": [
            "まって",
            "まちて",
            "まんで"
          ],
          "readings": [
            "matte",
            "machite",
            "mande"
          ],
          "answer": 0,
          "explanation": "「まちます」的「ち」變成「って」：まって，後面接「ください」。「まちて」是直接把「ます」換成「て」；「んで」是 み、び、に 那一組的變法。",
          "id": "g-te-kudasai/question/matte"
        },
        {
          "prompt": "「これを みて ください。」是什麼意思？",
          "options": [
            "請看這個。",
            "請等這個。",
            "請說這個。"
          ],
          "answer": 0,
          "explanation": "「みて」是「みます」（看）的て形：請看這個。等是「まって」，說是「はなして」。",
          "id": "g-te-kudasai/question/meaning"
        },
        {
          "prompt": "想請對方說慢一點：ゆっくり＿＿ ください。",
          "options": [
            "はなして",
            "はなしって",
            "はなします"
          ],
          "readings": [
            "hanashite",
            "hanashitte",
            "hanashimasu"
          ],
          "answer": 0,
          "explanation": "「はなします」的「し」不變音，て形是「はなして」，不會變成「しって」。「ください」前面要用て形，不用「ます」。",
          "id": "g-te-kudasai/question/hanashite"
        }
      ]
    },
    {
      "id": "g-te-sequence",
      "type": "grammar",
      "title": "て形（三）：先做…再…、〜てから",
      "subtitle": "動作的順序",
      "steps": [
        {
          "title": "先…然後…",
          "example": "パンを かって、うちに かえります。",
          "reading": "pan o katte, uchi ni kaerimasu",
          "meaning": "買麵包，然後回家。",
          "body": "用て形把動作接起來，照順序說：先買麵包，再回家。這裡的て形是「然後」，不是中文的「和」。「かって」是「かいます」的て形（い → って），「かえります」是回去。",
          "id": "g-te-sequence/card/te"
        },
        {
          "title": "做完…之後再…：てから",
          "example": "ごはんを たべてから、コーヒーを のみます。",
          "reading": "gohan o tabete kara, koohii o nomimasu",
          "meaning": "吃完飯之後再喝咖啡。",
          "body": "「〜てから」強調前一個動作做完，才做後一個。「ごはん」是飯。",
          "id": "g-te-sequence/card/tekara"
        },
        {
          "title": "三種から",
          "example": "えきから ／ たかいですから ／ たべてから",
          "reading": "eki kara / takai desu kara / tabete kara",
          "meaning": "從車站 ／ 因為很貴 ／ 吃完之後",
          "body": "名詞後面是起點，完整的句子後面是原因，て形後面是「…之後」。",
          "id": "g-te-sequence/card/three-kara"
        }
      ],
      "questions": [
        {
          "prompt": "「たべてから」是什麼意思？",
          "options": [
            "吃完之後",
            "因為吃了",
            "從吃開始"
          ],
          "answer": 0,
          "explanation": "て形後面的「から」是「…之後」：吃完之後。完整的句子後面的「から」才是因為，名詞後面的「から」才是從。",
          "id": "g-te-sequence/question/meaning"
        },
        {
          "prompt": "想說「買了麵包，然後回家」：パンを＿＿、うちに かえります。",
          "options": [
            "かって",
            "かいて",
            "かいます"
          ],
          "readings": [
            "katte",
            "kaite",
            "kaimasu"
          ],
          "answer": 0,
          "explanation": "「かいます」（買）的「い」變成「って」：かって。「かいて」是另一個動詞（かきます，寫）的て形，之後再學；句子中間還要接下一個動作，要用て形，不用「かいます」。",
          "id": "g-te-sequence/question/katte"
        },
        {
          "prompt": "「ごはんを たべてから、コーヒーを のみます。」先做哪件事？",
          "options": [
            "先吃飯",
            "先喝咖啡",
            "兩件同時做"
          ],
          "answer": 0,
          "explanation": "「たべてから」＝吃完之後，所以先吃飯，再喝咖啡。",
          "id": "g-te-sequence/question/order"
        }
      ]
    }
  ];
  // Grammar lessons are taught in array order and grouped into units on the grammar page. The plan lists what each lesson introduces and needs
  // (validate() checks examples only use taught words), which card to revisit after a wrong answer,
  // and where a ported question came from.
  const lessonPlan = {
    "g-identity": {
      "unit": "基本句子",
      "requires": [],
      "words": [
        "わたし",
        "がくせい"
      ],
      "grammar": [
        "は",
        "です"
      ],
      "review": {
        "g-identity/question/sentence-ending": "g-identity/card/noun-sentence",
        "g-identity/question/topic-reading": "g-identity/card/topic-reading"
      }
    },
    "g-question": {
      "unit": "基本句子",
      "requires": [
        "g-identity"
      ],
      "words": [],
      "grammar": [
        "か"
      ],
      "review": {
        "g-question/question/question-meaning": "g-question/card/implicit-person",
        "g-question/question/question-ending": "g-question/card/question-particle"
      }
    },
    "g-demo": {
      "unit": "基本句子",
      "requires": [
        "g-identity"
      ],
      "words": [
        "これ",
        "それ",
        "あれ",
        "パン"
      ],
      "grammar": [],
      "review": {
        "g-demo/question/held-item": "g-demo/card/near-speaker",
        "g-demo/question/distant-item": "g-demo/card/far-from-both",
        "g-demo/question/listener-item": "g-demo/card/near-listener"
      }
    },
    "g-place": {
      "unit": "基本句子",
      "requires": [
        "g-question",
        "g-demo"
      ],
      "words": [
        "ここ",
        "そこ",
        "あそこ",
        "どこ",
        "トイレ",
        "えき",
        "すみません"
      ],
      "grammar": [],
      "review": {
        "g-place/question/far": "g-place/card/words",
        "g-place/question/ask": "g-place/card/question",
        "g-place/question/listener": "g-place/card/words"
      }
    },
    "g-kono": {
      "unit": "基本句子",
      "requires": [
        "g-demo",
        "g-question",
        "g-place"
      ],
      "words": [
        "この",
        "その",
        "あの",
        "どの",
        "どれ"
      ],
      "grammar": [],
      "review": {
        "g-kono/question/dono": "g-kono/card/which",
        "g-kono/question/kore": "g-kono/card/kore-kono",
        "g-kono/question/dore": "g-kono/card/which"
      }
    },
    "g-kochira": {
      "unit": "基本句子",
      "requires": [
        "g-kono",
        "g-place"
      ],
      "words": [
        "こちら",
        "そちら",
        "あちら",
        "どちら"
      ],
      "grammar": [],
      "review": {
        "g-kochira/question/staff": "g-kochira/card/staff",
        "g-kochira/question/ask": "g-kochira/card/ask",
        "g-kochira/question/far": "g-kochira/card/words"
      }
    },
    "g-who": {
      "unit": "基本句子",
      "requires": [
        "g-place",
        "g-kono"
      ],
      "words": [
        "だれ",
        "なに",
        "なん",
        "いつ",
        "ひと"
      ],
      "grammar": [],
      "review": {
        "g-who/question/jabiko-doko": "g-who/card/words",
        "g-who/question/nan": "g-who/card/nan",
        "g-who/question/dare": "g-who/card/dare"
      },
      "sources": {
        "g-who/question/jabiko-doko": "Jabiko src/domain/exam/items/n5.ts n5-grammar-doko @31c96ab"
      }
    },
    "g-negative": {
      "unit": "基本句子",
      "requires": [
        "g-question",
        "g-demo"
      ],
      "words": [
        "いいえ"
      ],
      "grammar": [
        "じゃないです",
        "じゃありません"
      ],
      "review": {
        "g-negative/question/ja-nai": "g-negative/card/ja-nai",
        "g-negative/question/answer": "g-negative/card/answer",
        "g-negative/question/meaning": "g-negative/card/ja-arimasen"
      }
    },
    "g-no": {
      "unit": "基本句子",
      "requires": [
        "g-demo"
      ],
      "words": [
        "かさ",
        "にほんご",
        "ほん"
      ],
      "grammar": [
        "の"
      ],
      "review": {
        "g-no/question/jabiko-no": "g-no/card/a-no-b",
        "g-no/question/my-bread": "g-no/card/a-no-b",
        "g-no/question/meaning": "g-no/card/not-always-de"
      },
      "sources": {
        "g-no/question/jabiko-no": "Jabiko src/domain/exam/items/n5.ts n5-grammar-no @31c96ab"
      }
    },
    "g-nouns": {
      "unit": "基本句子",
      "requires": [
        "g-no",
        "g-place"
      ],
      "words": [
        "ともだち",
        "せんせい",
        "きっぷ",
        "かばん",
        "みせ",
        "ホテル"
      ],
      "grammar": [],
      "review": {
        "g-nouns/question/sensei": "g-nouns/card/people",
        "g-nouns/question/kippu": "g-nouns/card/things",
        "g-nouns/question/hotel": "g-nouns/card/places"
      }
    },
    "g-mo": {
      "unit": "基本句子",
      "requires": [
        "g-demo",
        "g-no",
        "g-question"
      ],
      "words": [
        "たなか",
        "さん"
      ],
      "grammar": [
        "も"
      ],
      "review": {
        "g-mo/question/me-too": "g-mo/card/mo",
        "g-mo/question/meaning": "g-mo/card/thing",
        "g-mo/question/that-too": "g-mo/card/thing"
      }
    },
    "g-to": {
      "unit": "基本句子",
      "requires": [
        "g-mo",
        "g-no"
      ],
      "words": [
        "みず"
      ],
      "grammar": [
        "と"
      ],
      "review": {
        "g-to/question/and": "g-to/card/to",
        "g-to/question/meaning": "g-to/card/to",
        "g-to/question/point": "g-to/card/point"
      }
    },
    "g-kara-made": {
      "unit": "基本句子",
      "requires": [
        "g-place",
        "g-no"
      ],
      "words": [
        "とうきょう",
        "きょうと"
      ],
      "grammar": [
        "から",
        "まで"
      ],
      "review": {
        "g-kara-made/question/kara": "g-kara-made/card/kara",
        "g-kara-made/question/made": "g-kara-made/card/made",
        "g-kara-made/question/meaning": "g-kara-made/card/both"
      }
    },
    "g-days": {
      "unit": "時間與數字",
      "requires": [
        "g-question",
        "g-who"
      ],
      "words": [
        "きのう",
        "きょう",
        "あした",
        "いま",
        "やすみ"
      ],
      "grammar": [],
      "review": {
        "g-days/question/tomorrow": "g-days/card/three-days",
        "g-days/question/yesterday": "g-days/card/three-days",
        "g-days/question/meaning": "g-days/card/sentence",
        "g-days/question/itsu": "g-days/card/itsu"
      }
    },
    "g-day-parts": {
      "unit": "時間與數字",
      "requires": [
        "g-days",
        "g-no",
        "g-to"
      ],
      "words": [
        "あさ",
        "ひる",
        "よる"
      ],
      "grammar": [],
      "review": {
        "g-day-parts/question/evening": "g-day-parts/card/parts",
        "g-day-parts/question/no": "g-day-parts/card/with-no",
        "g-day-parts/question/meaning": "g-day-parts/card/sentence"
      }
    },
    "g-weekdays": {
      "unit": "時間與數字",
      "requires": [
        "g-days",
        "g-who"
      ],
      "words": [
        "げつようび",
        "かようび",
        "すいようび",
        "もくようび",
        "きんようび",
        "どようび",
        "にちようび",
        "なんようび"
      ],
      "grammar": [],
      "review": {
        "g-weekdays/question/friday": "g-weekdays/card/weekdays",
        "g-weekdays/question/next-day": "g-weekdays/card/weekdays",
        "g-weekdays/question/ask": "g-weekdays/card/ask"
      }
    },
    "g-numbers": {
      "unit": "時間與數字",
      "requires": [],
      "words": [
        "いち",
        "に",
        "さん",
        "よん",
        "ご",
        "ろく",
        "なな",
        "はち",
        "きゅう",
        "じゅう",
        "ゼロ"
      ],
      "grammar": [],
      "review": {
        "g-numbers/question/san": "g-numbers/card/one-five",
        "g-numbers/question/seven": "g-numbers/card/six-ten",
        "g-numbers/question/kyuu": "g-numbers/card/six-ten"
      }
    },
    "g-prices": {
      "unit": "時間與數字",
      "requires": [
        "g-numbers",
        "g-demo",
        "g-question",
        "g-who"
      ],
      "words": [
        "ひゃく",
        "せん",
        "さんびゃく",
        "ろっぴゃく",
        "はっぴゃく",
        "えん",
        "いくら"
      ],
      "grammar": [],
      "review": {
        "g-prices/question/hyaku": "g-prices/card/yen",
        "g-prices/question/gohyaku": "g-prices/card/units",
        "g-prices/question/sanbyaku": "g-prices/card/sound-change",
        "g-prices/question/ask": "g-prices/card/ikura"
      }
    },
    "g-counting": {
      "unit": "時間與數字",
      "requires": [
        "g-prices"
      ],
      "words": [
        "ひとつ",
        "ふたつ",
        "みっつ",
        "よっつ",
        "いつつ",
        "いくつ"
      ],
      "grammar": [],
      "review": {
        "g-counting/question/two": "g-counting/card/tsu",
        "g-counting/question/ikutsu": "g-counting/card/ikutsu",
        "g-counting/question/yottsu": "g-counting/card/tsu"
      }
    },
    "g-people": {
      "unit": "時間與數字",
      "requires": [
        "g-counting",
        "g-who"
      ],
      "words": [
        "ひとり",
        "ふたり",
        "にん",
        "よにん",
        "なんにん"
      ],
      "grammar": [],
      "review": {
        "g-people/question/three": "g-people/card/nin",
        "g-people/question/two": "g-people/card/one-two",
        "g-people/question/four": "g-people/card/nin"
      }
    },
    "g-clock": {
      "unit": "時間與數字",
      "requires": [
        "g-numbers",
        "g-days",
        "g-weekdays",
        "g-people"
      ],
      "words": [
        "じ",
        "よじ",
        "しちじ",
        "くじ",
        "はん",
        "なんじ"
      ],
      "grammar": [],
      "review": {
        "g-clock/question/four": "g-clock/card/special",
        "g-clock/question/nine": "g-clock/card/special",
        "g-clock/question/han": "g-clock/card/han",
        "g-clock/question/ask": "g-clock/card/ask"
      }
    },
    "g-kara-made-time": {
      "unit": "時間與數字",
      "requires": [
        "g-kara-made",
        "g-clock",
        "g-weekdays",
        "g-day-parts"
      ],
      "words": [
        "ひるやすみ"
      ],
      "grammar": [],
      "review": {
        "g-kara-made-time/question/kara": "g-kara-made-time/card/hours",
        "g-kara-made-time/question/meaning": "g-kara-made-time/card/days",
        "g-kara-made-time/question/made": "g-kara-made-time/card/hours"
      }
    },
    "g-verbs": {
      "unit": "動作與地點",
      "requires": [
        "g-to"
      ],
      "words": [
        "たべ",
        "のみ",
        "かい"
      ],
      "grammar": [
        "を",
        "ます"
      ],
      "review": {
        "g-verbs/question/wo": "g-verbs/card/taberu",
        "g-verbs/question/meaning": "g-verbs/card/kau",
        "g-verbs/question/reading": "g-verbs/card/taberu"
      }
    },
    "g-masen": {
      "unit": "動作與地點",
      "requires": [
        "g-verbs",
        "g-negative",
        "g-days"
      ],
      "words": [
        "コーヒー",
        "いき"
      ],
      "grammar": [
        "ません"
      ],
      "review": {
        "g-masen/question/masen": "g-masen/card/masen",
        "g-masen/question/answer": "g-masen/card/answer",
        "g-masen/question/meaning": "g-masen/card/masen"
      }
    },
    "g-mashita": {
      "unit": "動作與地點",
      "requires": [
        "g-masen"
      ],
      "words": [],
      "grammar": [
        "ました",
        "ませんでした"
      ],
      "review": {
        "g-mashita/question/mashita": "g-mashita/card/mashita",
        "g-mashita/question/meaning": "g-mashita/card/masen-deshita",
        "g-mashita/question/not-go": "g-mashita/card/four-forms"
      }
    },
    "g-ni-de": {
      "unit": "動作與地點",
      "requires": [
        "g-masen",
        "g-kara-made"
      ],
      "words": [],
      "grammar": [
        "に",
        "へ",
        "で"
      ],
      "review": {
        "g-ni-de/question/de": "g-ni-de/card/de",
        "g-ni-de/question/same": "g-ni-de/card/ni-e",
        "g-ni-de/question/go": "g-ni-de/card/ni-e"
      }
    },
    "g-transport": {
      "unit": "動作與地點",
      "requires": [
        "g-ni-de"
      ],
      "words": [
        "でんしゃ",
        "バス",
        "タクシー"
      ],
      "grammar": [],
      "review": {
        "g-transport/question/bus": "g-transport/card/de",
        "g-transport/question/taxi": "g-transport/card/more",
        "g-transport/question/place": "g-transport/card/both"
      }
    },
    "g-arimasu": {
      "unit": "動作與地點",
      "requires": [
        "g-ni-de",
        "g-mo"
      ],
      "words": [
        "ねこ",
        "あります",
        "います"
      ],
      "grammar": [
        "が"
      ],
      "review": {
        "g-arimasu/question/arimasu": "g-arimasu/card/arimasu",
        "g-arimasu/question/meaning": "g-arimasu/card/imasu",
        "g-arimasu/question/ni": "g-arimasu/card/place",
        "g-arimasu/question/jabiko-ga": "g-arimasu/card/arimasu"
      },
      "sources": {
        "g-arimasu/question/jabiko-ga": "Jabiko src/domain/exam/items/n5.ts n5-grammar-ga-neko-iru @31c96ab"
      }
    },
    "g-position": {
      "unit": "動作與地點",
      "requires": [
        "g-arimasu"
      ],
      "words": [
        "うえ",
        "した",
        "なか",
        "まえ",
        "うしろ",
        "となり",
        "ちかく",
        "つくえ",
        "コンビニ"
      ],
      "grammar": [],
      "review": {
        "g-position/question/ue": "g-position/card/three",
        "g-position/question/chikaku": "g-position/card/four",
        "g-position/question/tonari": "g-position/card/four"
      }
    },
    "g-adj-i": {
      "unit": "形容詞與連接",
      "requires": [
        "g-kono",
        "g-masen"
      ],
      "words": [
        "おおきい",
        "ちいさい",
        "たかい",
        "やすい"
      ],
      "grammar": [],
      "review": {
        "g-adj-i/question/takai": "g-adj-i/card/takai",
        "g-adj-i/question/yasui": "g-adj-i/card/takai",
        "g-adj-i/question/no": "g-adj-i/card/before-noun"
      }
    },
    "g-adj-neg": {
      "unit": "形容詞與連接",
      "requires": [
        "g-adj-i",
        "g-days",
        "g-to"
      ],
      "words": [
        "たかく",
        "おおきく",
        "つめたい",
        "あたたかい",
        "さむい"
      ],
      "grammar": [
        "ないです"
      ],
      "review": {
        "g-adj-neg/question/kunai": "g-adj-neg/card/kunai",
        "g-adj-neg/question/tsumetai": "g-adj-neg/card/cold",
        "g-adj-neg/question/samui": "g-adj-neg/card/cold"
      }
    },
    "g-adj-na": {
      "unit": "形容詞與連接",
      "requires": [
        "g-adj-neg",
        "g-negative",
        "g-place"
      ],
      "words": [
        "しずか",
        "べんり",
        "きれい",
        "へや"
      ],
      "grammar": [
        "な"
      ],
      "review": {
        "g-adj-na/question/na": "g-adj-na/card/na",
        "g-adj-na/question/kirei": "g-adj-na/card/kirei",
        "g-adj-na/question/meaning": "g-adj-na/card/na"
      }
    },
    "g-who-2": {
      "unit": "形容詞與連接",
      "requires": [
        "g-who",
        "g-counting",
        "g-adj-i",
        "g-days"
      ],
      "words": [
        "どう",
        "どうやって",
        "おいしい"
      ],
      "grammar": [],
      "review": {
        "g-who-2/question/itsu": "g-who-2/card/review",
        "g-who-2/question/dou": "g-who-2/card/dou",
        "g-who-2/question/ikura": "g-who-2/card/review"
      }
    },
    "g-soshite-demo": {
      "unit": "形容詞與連接",
      "requires": [
        "g-adj-na",
        "g-who-2",
        "g-mashita"
      ],
      "words": [
        "そして",
        "でも"
      ],
      "grammar": [],
      "review": {
        "g-soshite-demo/question/demo": "g-soshite-demo/card/demo",
        "g-soshite-demo/question/soshite": "g-soshite-demo/card/soshite",
        "g-soshite-demo/question/meaning": "g-soshite-demo/card/demo"
      }
    },
    "g-kara-reason": {
      "unit": "形容詞與連接",
      "requires": [
        "g-soshite-demo",
        "g-kara-made",
        "g-arimasu"
      ],
      "words": [
        "うち"
      ],
      "grammar": [],
      "review": {
        "g-kara-reason/question/meaning": "g-kara-reason/card/reason",
        "g-kara-reason/question/start": "g-kara-reason/card/compare",
        "g-kara-reason/question/fill": "g-kara-reason/card/example"
      }
    },
    "g-verb-forms": {
      "unit": "動詞原形與て形",
      "requires": [
        "g-mashita",
        "g-arimasu"
      ],
      "words": [
        "たべる",
        "のむ",
        "かう",
        "いく",
        "みる",
        "する",
        "くる",
        "みます",
        "します",
        "きます",
        "いきます"
      ],
      "grammar": [
        "原形"
      ],
      "review": {
        "g-verb-forms/question/nomu": "g-verb-forms/card/group1",
        "g-verb-forms/question/taberu": "g-verb-forms/card/group2-3",
        "g-verb-forms/question/suru": "g-verb-forms/card/group2-3"
      }
    },
    "g-te-forms": {
      "unit": "動詞原形與て形",
      "requires": [
        "g-mashita",
        "g-arimasu",
        "g-verb-forms"
      ],
      "words": [
        "まちます",
        "たべて",
        "みて",
        "かって",
        "のんで",
        "まって",
        "きて",
        "して",
        "いって"
      ],
      "grammar": [
        "て形"
      ],
      "review": {
        "g-te-forms/question/tabete": "g-te-forms/card/simple",
        "g-te-forms/question/nonde": "g-te-forms/card/sound",
        "g-te-forms/question/itte": "g-te-forms/card/irregular"
      }
    },
    "g-te-kudasai": {
      "unit": "動詞原形與て形",
      "requires": [
        "g-te-forms",
        "g-demo"
      ],
      "words": [
        "ちょっと",
        "ください",
        "ゆっくり",
        "はなします",
        "はなして"
      ],
      "grammar": [],
      "review": {
        "g-te-kudasai/question/matte": "g-te-kudasai/card/matte",
        "g-te-kudasai/question/meaning": "g-te-kudasai/card/mite",
        "g-te-kudasai/question/hanashite": "g-te-kudasai/card/hanashite"
      }
    },
    "g-te-sequence": {
      "unit": "動詞原形與て形",
      "requires": [
        "g-te-kudasai",
        "g-kara-reason",
        "g-ni-de"
      ],
      "words": [
        "かえり",
        "ごはん"
      ],
      "grammar": [
        "から"
      ],
      "review": {
        "g-te-sequence/question/meaning": "g-te-sequence/card/tekara",
        "g-te-sequence/question/katte": "g-te-sequence/card/te",
        "g-te-sequence/question/order": "g-te-sequence/card/tekara"
      }
    }
  };
  // Special sounds that are not separate characters, taught on the kana page.
  const sounds = [
    {
      "id": "s-sokuon",
      "type": "grammar",
      "home": "kana",
      "title": "促音：小的 っ 停一拍",
      "subtitle": "きっぷ・おと／おっと・ネット",
      "steps": [
        {
          "title": "小的 っ：停一拍",
          "example": "きっぷ",
          "reading": "kippu",
          "meaning": "車票",
          "body": "把每一拍想成一次等長的拍手：き・っ・ぷ 共三拍，中間那拍先停住，不念 tsu。羅馬字寫成 kippu，中間的 pp 提醒你先停一下，再念 pu。",
          "id": "s-sokuon/card/kippu"
        },
        {
          "title": "有沒有停頓，意思不同",
          "example": "おと ／ おっと",
          "reading": "oto / otto",
          "meaning": "聲音 ／ 丈夫",
          "body": "「おと」念兩拍；「おっと」在 と 之前多停一拍，變成三拍，意思也跟著不同。",
          "id": "s-sokuon/card/oto-otto"
        },
        {
          "title": "片假名也用小的 ッ",
          "example": "ベッド ／ ネット",
          "reading": "beddo / netto",
          "meaning": "床 ／ 網路",
          "body": "片假名寫成小的「ッ」，用法一樣：在下一個音之前停一拍。",
          "id": "s-sokuon/card/katakana"
        }
      ],
      "questions": [
        {
          "prompt": "「きっぷ」（車票）的羅馬字是哪一個？",
          "options": [
            "kippu",
            "kipu",
            "kiipu"
          ],
          "answer": 0,
          "explanation": "正確是 kippu，中間的 pp 表示先停一拍，再念 pu。kipu 少了停頓；kiipu 是把 ki 拉長，和停頓不同。",
          "id": "s-sokuon/question/kippu"
        },
        {
          "prompt": "「おっと」（丈夫）和「おと」（聲音）念起來差在哪裡？",
          "options": [
            "中間多停一拍",
            "最後一個音拉長",
            "念法完全一樣"
          ],
          "answer": 0,
          "explanation": "小的 っ 讓 と 之前多停一拍，所以「おっと」是三拍；把音拉長是長音，不是促音。",
          "id": "s-sokuon/question/oto-otto"
        },
        {
          "prompt": "「ネット」（網路）的羅馬字是哪一個？",
          "options": [
            "netto",
            "neto",
            "neeto"
          ],
          "answer": 0,
          "explanation": "小的 ッ 讓 ト 之前停一拍，羅馬字寫成 tt：netto。neeto 是長音的寫法。",
          "id": "s-sokuon/question/netto"
        }
      ]
    },
    {
      "id": "s-long",
      "type": "grammar",
      "home": "kana",
      "title": "長音：把音拉長一拍",
      "subtitle": "おばあさん・コーヒー",
      "steps": [
        {
          "title": "把 ba 拉長成 baa",
          "example": "おばさん ／ おばあさん",
          "reading": "obasan / obaasan",
          "meaning": "阿姨 ／ 奶奶",
          "body": "「おばあさん」在 ば 後面多一個 あ，把 ba 拉長成 baa，多念一拍。中間不要停住，意思就從阿姨變成奶奶。羅馬字寫成 obaasan，aa 表示拉長。",
          "id": "s-long/card/obaasan"
        },
        {
          "title": "ei、ou 通常念成長音",
          "example": "がくせい ／ ありがとう",
          "reading": "gakusei / arigatou",
          "meaning": "學生 ／ 謝謝",
          "body": "e 結尾的字後面接 い、o 結尾的字後面接 う 時，通常念成拉長的 ee、oo：ga-ku-see、a-ri-ga-too。本站羅馬字照假名寫成 ei、ou。",
          "id": "s-long/card/ei-ou"
        },
        {
          "title": "片假名用「ー」",
          "example": "コーヒー ／ ケーキ",
          "reading": "koohii / keeki",
          "meaning": "咖啡 ／ 蛋糕",
          "body": "看到「ー」，就把前一個音多念一拍。例如 コーヒー 寫成 koohii，ko 和 hi 都要拉長，中間不要停住。",
          "id": "s-long/card/katakana"
        }
      ],
      "questions": [
        {
          "prompt": "「おばあさん」（奶奶）的羅馬字是哪一個？",
          "options": [
            "obaasan",
            "obasan",
            "obbasan"
          ],
          "answer": 0,
          "explanation": "ば 後面多一個 あ，要拉長一拍：obaasan。obasan 是「おばさん」（阿姨）；obbasan 是在 ば 之前停一拍，那是促音。",
          "id": "s-long/question/obaasan"
        },
        {
          "prompt": "片假名「コーヒー」裡的「ー」表示什麼？",
          "options": [
            "把前一個音拉長",
            "在下一個音之前停一拍",
            "這個符號不用發音"
          ],
          "answer": 0,
          "explanation": "「ー」是長音符號，要把前一個音多拉長一拍（koohii），不能省略不念。在下一個音之前停一拍的是小的 ッ。",
          "id": "s-long/question/bar"
        },
        {
          "prompt": "「ありがとう」最後的「とう」通常怎麼念？",
          "options": [
            "拉長成 too",
            "分開念成 to-u",
            "停一拍念成 tto"
          ],
          "answer": 0,
          "explanation": "と（to）後面接 う，通常念成拉長的 oo：a-ri-ga-too。羅馬字照假名寫成 arigatou。",
          "id": "s-long/question/arigatou"
        }
      ]
    }
  ];
  const phrasebook = [
    {
      "id": "basics",
      "title": "找人幫忙、聽不懂、忘了東西",
      "subtitle": "叫店員・再說一次・慢一點・指畫面・忘了東西",
      "steps": [
        {
          "title": "叫一下店員",
          "keywords": [
            [
              "すみません",
              "sumimasen",
              "不好意思"
            ]
          ],
          "body": "想請店員幫忙時，可以先說這個字，等對方回應再說需求。",
          "example": "すみません。",
          "reading": "sumimasen",
          "meaning": "不好意思。",
          "id": "phrase/basics/attention"
        },
        {
          "title": "請對方再說一次",
          "keywords": [
            [
              "もう一度（もういちど）",
              "mou ichido",
              "再一次"
            ]
          ],
          "body": "剛才沒聽清楚，說「もう一度」，對方通常就知道你想再聽一次。",
          "example": "もう一度、お願いします。",
          "reading": "mou ichido, onegaishimasu",
          "meaning": "麻煩再說一次。",
          "id": "phrase/basics/repeat"
        },
        {
          "title": "請對方慢一點",
          "keywords": [
            [
              "ゆっくり",
              "yukkuri",
              "慢慢地"
            ]
          ],
          "body": "對方說太快時，可以用這個詞請他放慢。",
          "example": "ゆっくり話してください。",
          "reading": "yukkuri hanashite kudasai",
          "meaning": "請慢一點說。",
          "id": "phrase/basics/slowly"
        },
        {
          "title": "聽不懂時",
          "keywords": [
            [
              "わかりません",
              "wakarimasen",
              "聽不懂／不知道"
            ]
          ],
          "body": "聽不懂時直接說，再接著請對方「もう一度」（再說一次）或「ゆっくり」（慢一點）。",
          "example": "すみません、わかりません。",
          "reading": "sumimasen, wakarimasen",
          "meaning": "不好意思，我聽不懂。",
          "polite": "すみません、日本語がよくわかりません。",
          "politeReading": "sumimasen, nihongo ga yoku wakarimasen",
          "politeMeaning": "不好意思，我不太懂日文。",
          "id": "phrase/basics/not-understood"
        },
        {
          "title": "指著手機畫面說",
          "keywords": [
            [
              "これです",
              "kore desu",
              "就是這個"
            ]
          ],
          "body": "指著手機上的地址、商品照片或訂單畫面說「これです」。找商品時可以說「これ、ありますか？」（kore, arimasu ka，有這個嗎？）。只說名詞，對方不一定知道你要做什麼，所以畫面要先給對方看。",
          "example": "これです。",
          "reading": "kore desu",
          "meaning": "就是這個。",
          "polite": "すみません、これはどこですか？",
          "politeReading": "sumimasen, kore wa doko desu ka",
          "politeMeaning": "不好意思，這個（地方）在哪裡？",
          "id": "phrase/basics/point"
        },
        {
          "title": "東西忘在車上或店裡",
          "keywords": [
            [
              "忘れ物（わすれもの）",
              "wasuremono",
              "遺失物"
            ],
            [
              "財布（さいふ）",
              "saifu",
              "錢包"
            ],
            [
              "スマホ",
              "sumaho",
              "手機"
            ]
          ],
          "body": "知道忘在哪裡時，用這句說地點和東西。把時間、地點（車站、路線、幾號車廂或店名）、顏色、品牌、裡面有什麼寫在手機上給站務員或店員看，有照片更好。失物登錄需要時間，也可能被送到失物中心或警察，查不到可以隔一段時間再問。",
          "example": "電車に財布を忘れました。",
          "reading": "densha ni saifu o wasuremashita",
          "meaning": "我把錢包忘在電車上了。",
          "id": "phrase/basics/left-behind"
        },
        {
          "title": "不知道掉在哪裡",
          "keywords": [
            [
              "なくしました",
              "nakushimashita",
              "弄丟了"
            ]
          ],
          "body": "不確定在哪裡弄丟時用這句；知道忘在哪裡，改說「〇〇に忘れました」。可以問車站、店家，也可以到派出所（交番，kouban）申報遺失（遺失届，ishitsu todoke）。失物可能還在鐵路公司，也可能已轉交警察，兩邊都可以問。",
          "example": "財布をなくしました。",
          "reading": "saifu o nakushimashita",
          "meaning": "我把錢包弄丟了。",
          "id": "phrase/basics/lost"
        },
        {
          "title": "回應與道謝",
          "keywords": [
            [
              "はい",
              "hai",
              "是／好"
            ],
            [
              "いいえ",
              "iie",
              "不是"
            ],
            [
              "ありがとう",
              "arigatou",
              "謝謝"
            ]
          ],
          "body": "確認選項時用「はい／いいえ」。受到幫忙後，可以說謝謝。",
          "example": "ありがとうございます。",
          "reading": "arigatou gozaimasu",
          "meaning": "謝謝您。",
          "id": "phrase/basics/thanks"
        }
      ]
    },
    {
      "id": "t-order",
      "title": "點餐：數量、冷熱、份量",
      "subtitle": "一到三份・熱的或冷的・一般份或大份",
      "steps": [
        {
          "title": "指著菜單選餐點",
          "keywords": [
            [
              "これ",
              "kore",
              "這個"
            ],
            [
              "お願いします",
              "onegaishimasu",
              "麻煩你／請幫我"
            ]
          ],
          "example": "これ、お願いします。",
          "reading": "kore, onegaishimasu",
          "meaning": "我要這個，麻煩你。",
          "body": "指著菜單上的餐點說「これ」，店員通常就知道你選哪一道。加上「お願いします」更有禮貌。",
          "id": "phrase/t-order/menu-item"
        },
        {
          "title": "點一份、兩份、三份",
          "keywords": [
            [
              "ひとつ",
              "hitotsu",
              "一個／一份"
            ],
            [
              "ふたつ",
              "futatsu",
              "兩個／兩份"
            ],
            [
              "みっつ",
              "mittsu",
              "三個／三份"
            ]
          ],
          "example": "これ、ふたつ。",
          "reading": "kore, futatsu",
          "meaning": "這個，兩份。",
          "body": "指著菜單上的同一道餐點，說數量，店員通常就能理解。要一份換成「ひとつ」，三份換成「みっつ」。「みっつ」的小「っ」要停頓一下。",
          "polite": "これ、ふたつお願いします。",
          "politeReading": "kore, futatsu onegaishimasu",
          "politeMeaning": "這個請給我兩份。",
          "id": "phrase/t-order/quantity"
        },
        {
          "title": "飲料：熱的、冰的",
          "keywords": [
            [
              "ホット",
              "hotto",
              "熱的"
            ],
            [
              "アイス",
              "aisu",
              "冰的"
            ]
          ],
          "example": "アイス。",
          "reading": "aisu",
          "meaning": "我要冰的。",
          "body": "已經選好飲料，店員確認冷熱時，回答「ホット」或「アイス」即可。這裡的「アイス」指冰飲。",
          "polite": "アイスでお願いします。",
          "politeReading": "aisu de onegaishimasu",
          "politeMeaning": "我要冰的，麻煩你。",
          "extra": {
            "title": "進階補充：點酒的喝法",
            "keywords": [
              [
                "ロック",
                "rokku",
                "加冰塊喝"
              ],
              [
                "ソーダ割り（ソーダわり）",
                "sooda wari",
                "加蘇打水喝"
              ]
            ],
            "example": "ロックで。 ／ ソーダ割りで。",
            "reading": "rokku de / sooda wari de",
            "meaning": "加冰。／加蘇打水。",
            "body": "已經選好威士忌或燒酎等酒款，店員問喝法時，可以這樣回答。「ロック」是酒加冰塊；「ソーダ割り」是酒加蘇打水。菜單上的「ハイボール」（haibooru）是威士忌加蘇打水。",
            "id": "phrase/t-order/extra/drink-style"
          },
          "id": "phrase/t-order/drink-temperature"
        },
        {
          "title": "烏龍麵：熱的、冷的",
          "keywords": [
            [
              "温かい（あたたかい）",
              "atatakai",
              "熱的／溫熱的"
            ],
            [
              "冷たい（つめたい）",
              "tsumetai",
              "冷的"
            ]
          ],
          "example": "温かいの。",
          "reading": "atatakai no",
          "meaning": "熱的那個。",
          "body": "點烏龍麵，店員確認要熱的還是冷的時，回答「温かい」或「冷たい」，通常就能理解。加上「の」就是「熱的／冷的那個」。",
          "polite": "温かいの、お願いします。",
          "politeReading": "atatakai no, onegaishimasu",
          "politeMeaning": "請給我熱的。",
          "id": "phrase/t-order/noodle-temperature"
        },
        {
          "title": "份量：一般份量、大份量",
          "keywords": [
            [
              "並盛（なみもり）",
              "namimori",
              "一般份量"
            ],
            [
              "大盛（おおもり）",
              "oomori",
              "大份量"
            ]
          ],
          "example": "並盛。",
          "reading": "namimori",
          "meaning": "一般份量。",
          "body": "例如點牛丼，菜單有列份量、店員詢問要哪一種時，回答「並盛」或「大盛」即可。「大盛」開頭的 o 音要拉長。",
          "polite": "並盛でお願いします。",
          "politeReading": "namimori de onegaishimasu",
          "politeMeaning": "請給我一般份量。",
          "id": "phrase/t-order/portion"
        }
      ]
    },
    {
      "id": "dining",
      "title": "內用外帶、用餐需求",
      "subtitle": "幾位・內用・外帶・水・不需要",
      "steps": [
        {
          "title": "進門時：幾位？",
          "keywords": [
            [
              "何名様（なんめいさま）",
              "nanmeisama",
              "幾位"
            ]
          ],
          "body": "進餐廳時店員常這樣問人數。比手指回答就可以，例如比出兩根手指；超過五人用兩隻手比。",
          "example": "何名様ですか？",
          "reading": "nanmeisama desu ka",
          "meaning": "請問幾位？",
          "id": "phrase/dining/party-size"
        },
        {
          "title": "內用還是外帶",
          "keywords": [
            [
              "店内（てんない）",
              "tennai",
              "內用"
            ],
            [
              "持ち帰り（もちかえり）",
              "mochikaeri",
              "外帶"
            ]
          ],
          "body": "店員問在哪裡吃時，直接回答其中一個即可。",
          "example": "持ち帰りでお願いします。",
          "reading": "mochikaeri de onegaishimasu",
          "meaning": "我要外帶，麻煩你。",
          "staffAsks": {
            "example": "店内でお召し上がりですか？",
            "reading": "tennai de omeshiagari desu ka",
            "meaning": "內用嗎？"
          },
          "id": "phrase/dining/takeout"
        },
        {
          "title": "想要水",
          "keywords": [
            [
              "お水（おみず）",
              "omizu",
              "水"
            ]
          ],
          "body": "在餐廳向店員表示想要水，可以說「お水」。",
          "example": "お水をお願いします。",
          "reading": "omizu o onegaishimasu",
          "meaning": "麻煩給我水。",
          "id": "phrase/dining/water"
        },
        {
          "title": "再來一杯或一碗",
          "keywords": [
            [
              "おかわり",
              "okawari",
              "續杯／再一碗"
            ]
          ],
          "body": "指著杯子或碗說，讓店員知道你想再來一份。是否能續、是否收費要依店家確認。",
          "example": "おかわりをお願いします。",
          "reading": "okawari o onegaishimasu",
          "meaning": "麻煩再給我一份。",
          "id": "phrase/dining/refill"
        },
        {
          "title": "回答不需要",
          "keywords": [
            [
              "いりません",
              "irimasen",
              "不需要"
            ]
          ],
          "body": "店員問要不要袋子、收據等物品時，可以用這句回答。「大丈夫です」（daijoubu desu）也可能表示婉拒，但依情境也能表示「沒問題」；要清楚表達不需要，可用「いりません」。超商店員問「温めますか？」時，不用加熱就回「大丈夫です」。",
          "example": "袋はいりません。",
          "reading": "fukuro wa irimasen",
          "meaning": "我不需要袋子。",
          "staffAsks": {
            "example": "温めますか？",
            "reading": "atatamemasu ka",
            "meaning": "（超商便當）要加熱嗎？"
          },
          "id": "phrase/dining/decline"
        }
      ]
    },
    {
      "id": "t-pay",
      "title": "結帳與付款",
      "subtitle": "刷卡・Suica・現金",
      "steps": [
        {
          "title": "吃完後要結帳",
          "keywords": [
            [
              "お会計（おかいけい）",
              "okaikei",
              "結帳"
            ],
            [
              "レジ",
              "reji",
              "收銀台"
            ]
          ],
          "example": "お会計。",
          "reading": "okaikei",
          "meaning": "結帳。",
          "body": "餐廳吃完，想請店員結帳時，可以說「お会計、お願いします」。有些餐廳需拿帳單到「レジ」（收銀台）付款，依店內指示即可。",
          "polite": "お会計、お願いします。",
          "politeReading": "okaikei, onegaishimasu",
          "politeMeaning": "麻煩幫我結帳。",
          "id": "phrase/t-pay/bill"
        },
        {
          "title": "刷卡或付現金",
          "keywords": [
            [
              "カード",
              "kaado",
              "信用卡／刷卡"
            ],
            [
              "現金（げんきん）",
              "genkin",
              "現金"
            ]
          ],
          "body": "店員問付款方式時，可以回答「カード」或「現金」。要明確指定信用卡，也可以說「クレジットカード」。",
          "example": "クレジットカードは使えますか？",
          "reading": "kurejitto kaado wa tsukaemasu ka",
          "meaning": "可以刷卡嗎？",
          "id": "phrase/t-pay/credit-cash"
        },
        {
          "title": "用西瓜卡付款",
          "keywords": [
            [
              "Suica（スイカ）",
              "suika",
              "西瓜卡／交通 IC 卡"
            ]
          ],
          "body": "付款前先看店家的支援標示，不確定時可問能不能使用。持 ICOCA 或 PASMO 時，把句中的 Suica 換成自己的卡名即可。",
          "example": "Suica は使えますか？",
          "reading": "suika wa tsukaemasu ka",
          "meaning": "可以用西瓜卡付款嗎？",
          "id": "phrase/t-pay/suica"
        }
      ]
    },
    {
      "id": "shopping",
      "title": "買東西",
      "subtitle": "價格・試穿・尺寸・決定・袋子・收據",
      "steps": [
        {
          "title": "問價格",
          "keywords": [
            [
              "いくら",
              "ikura",
              "多少錢"
            ]
          ],
          "body": "指著想買的商品詢問，對方才知道你在問哪一樣。",
          "example": "これはいくらですか？",
          "reading": "kore wa ikura desu ka",
          "meaning": "這個多少錢？",
          "id": "phrase/shopping/price"
        },
        {
          "title": "想試穿",
          "keywords": [
            [
              "試着（しちゃく）",
              "shichaku",
              "試穿"
            ]
          ],
          "body": "拿著想試的衣服問店員。",
          "example": "試着、いいですか？",
          "reading": "shichaku, ii desu ka",
          "meaning": "可以試穿嗎？",
          "polite": "試着してもいいですか？",
          "politeReading": "shichaku shite mo ii desu ka",
          "politeMeaning": "我可以試穿嗎？",
          "id": "phrase/shopping/try-on"
        },
        {
          "title": "尺寸：大一點、小一點",
          "keywords": [
            [
              "サイズ",
              "saizu",
              "尺寸"
            ],
            [
              "大きい（おおきい）",
              "ookii",
              "大"
            ],
            [
              "小さい（ちいさい）",
              "chiisai",
              "小"
            ]
          ],
          "body": "想換大一號，就問「大きいサイズ、ありますか？」。試穿後覺得太大，可以說「ちょっと大きいです」（chotto ookii desu，有點大），再把「大きい」換成「小さい」，問有沒有小一號的。",
          "example": "大きいサイズ、ありますか？",
          "reading": "ookii saizu, arimasu ka",
          "meaning": "有大一點的尺寸嗎？",
          "polite": "もう少し大きいサイズはありますか？",
          "politeReading": "mou sukoshi ookii saizu wa arimasu ka",
          "politeMeaning": "有再大一點的尺寸嗎？",
          "id": "phrase/shopping/size"
        },
        {
          "title": "決定買這個",
          "keywords": [
            [
              "これください",
              "kore kudasai",
              "我要這個"
            ]
          ],
          "body": "指著商品說就可以。",
          "example": "これ、ください。",
          "reading": "kore, kudasai",
          "meaning": "我要這個。",
          "id": "phrase/shopping/this-one"
        },
        {
          "title": "需要袋子",
          "keywords": [
            [
              "袋（ふくろ）",
              "fukuro",
              "袋子"
            ]
          ],
          "body": "結帳時說「袋」，可以讓店員知道你需要袋子。袋子可能另外收費。",
          "example": "袋をお願いします。",
          "reading": "fukuro o onegaishimasu",
          "meaning": "麻煩給我袋子。",
          "staffAsks": {
            "example": "袋はご利用ですか？",
            "reading": "fukuro wa goriyou desu ka",
            "meaning": "需要袋子嗎？"
          },
          "id": "phrase/shopping/bag"
        },
        {
          "title": "需要收據",
          "keywords": [
            [
              "レシート",
              "reshiito",
              "購物收據"
            ]
          ],
          "body": "結帳時，可以用這個詞索取一般購物收據。需要報帳用、寫抬頭的收據時，說「領収書（りょうしゅうしょ，ryoushuusho）」。",
          "example": "レシートをお願いします。",
          "reading": "reshiito o onegaishimasu",
          "meaning": "麻煩給我收據。",
          "id": "phrase/shopping/receipt"
        }
      ]
    },
    {
      "id": "lines",
      "title": "排隊、營業時間與景點入場",
      "subtitle": "排隊・等多久・到幾點・當日票・入口・拍照",
      "steps": [
        {
          "title": "這是在排隊嗎",
          "keywords": [
            [
              "並んでますか（ならんでますか）",
              "narandemasu ka",
              "在排隊嗎"
            ],
            [
              "最後尾（さいこうび）",
              "saikoubi",
              "隊伍最後面"
            ]
          ],
          "body": "看到人群不確定是不是隊伍時問。有些店要先取號或在名單上登記，先看門口的說明；隊伍最後面常有「最後尾」的牌子。",
          "example": "並んでますか？",
          "reading": "narandemasu ka",
          "meaning": "這是在排隊嗎？",
          "polite": "すみません、並んでいますか？",
          "politeReading": "sumimasen, narande imasu ka",
          "politeMeaning": "不好意思，請問是在排隊嗎？",
          "id": "phrase/lines/queue"
        },
        {
          "title": "要等多久",
          "keywords": [
            [
              "何分（なんぷん）",
              "nanpun",
              "幾分鐘"
            ],
            [
              "待ちます（まちます）",
              "machimasu",
              "等"
            ]
          ],
          "body": "對方可能回「5分」（gofun，5 分鐘）這類時間。聽不懂數字時，可以請對方寫下來：「書いてください」（kaite kudasai）。",
          "example": "何分くらい待ちますか？",
          "reading": "nanpun kurai machimasu ka",
          "meaning": "大概要等幾分鐘？",
          "id": "phrase/lines/wait"
        },
        {
          "title": "營業到幾點",
          "keywords": [
            [
              "何時まで（なんじまで）",
              "nanji made",
              "到幾點"
            ]
          ],
          "body": "問店家或景點營業到幾點，對方可能回「8時まで」（hachiji made，到 8 點）。和「要等多久」不同，這是問結束的時間。",
          "example": "何時までですか？",
          "reading": "nanji made desu ka",
          "meaning": "營業到幾點？",
          "id": "phrase/lines/hours"
        },
        {
          "title": "當日票與預約",
          "keywords": [
            [
              "当日券（とうじつけん）",
              "toujitsuken",
              "當日票"
            ],
            [
              "予約（よやく）",
              "yoyaku",
              "預約"
            ]
          ],
          "body": "沒有先買票時問這句；已經預約的話，直接出示預約畫面。要不要預約、票價多少，依景點而定。",
          "example": "当日券、ありますか？",
          "reading": "toujitsuken, arimasu ka",
          "meaning": "有當日票嗎？",
          "id": "phrase/lines/same-day"
        },
        {
          "title": "找入口",
          "keywords": [
            [
              "入口（いりぐち）",
              "iriguchi",
              "入口"
            ]
          ],
          "body": "漢字和中文一樣，但讀音不同：入口是 iriguchi，出口是 deguchi。",
          "example": "入口はどこですか？",
          "reading": "iriguchi wa doko desu ka",
          "meaning": "入口在哪裡？",
          "id": "phrase/lines/entrance"
        },
        {
          "title": "拍照前先問",
          "keywords": [
            [
              "写真（しゃしん）",
              "shashin",
              "照片"
            ],
            [
              "いいですか",
              "ii desu ka",
              "可以嗎"
            ]
          ],
          "body": "可以拍照不代表可以錄影或錄音，以現場標示和工作人員的回答為準。標示寫「撮影禁止」（satsuei kinshi）就是禁止拍攝。",
          "example": "写真、いいですか？",
          "reading": "shashin, ii desu ka",
          "meaning": "可以拍照嗎？",
          "polite": "写真を撮ってもいいですか？",
          "politeReading": "shashin o totte mo ii desu ka",
          "politeMeaning": "請問可以拍照嗎？",
          "id": "phrase/lines/photo"
        }
      ]
    },
    {
      "id": "t-place",
      "title": "找廁所、問位置",
      "subtitle": "廁所・車站・出口・電梯・置物櫃",
      "steps": [
        {
          "title": "找廁所",
          "keywords": [
            [
              "トイレ",
              "toire",
              "廁所"
            ],
            [
              "どこ",
              "doko",
              "哪裡"
            ]
          ],
          "example": "トイレ？",
          "reading": "toire?",
          "meaning": "廁所？",
          "body": "在店內可以先說「すみません」，再用疑問語氣說「トイレ？」。對方若不明白，可加上「どこ」，或用下面的完整說法。",
          "polite": "トイレはどこですか？",
          "politeReading": "toire wa doko desu ka",
          "politeMeaning": "廁所在哪裡？",
          "id": "phrase/t-place/toilet"
        },
        {
          "title": "找車站",
          "keywords": [
            [
              "駅（えき）",
              "eki",
              "車站"
            ],
            [
              "どこ",
              "doko",
              "哪裡"
            ]
          ],
          "example": "駅、どこですか？",
          "reading": "eki, doko desu ka",
          "meaning": "車站，在哪裡？",
          "body": "把「トイレ」換成「駅」，就能問車站在哪裡。也可以指著地圖上的車站，幫對方確認你想去哪。",
          "polite": "駅はどこですか？",
          "politeReading": "eki wa doko desu ka",
          "politeMeaning": "車站在哪裡？",
          "id": "phrase/t-place/station"
        },
        {
          "title": "看標示、找設施",
          "keywords": [
            [
              "出口（でぐち）",
              "deguchi",
              "出口"
            ],
            [
              "エレベーター",
              "erebeetaa",
              "電梯"
            ],
            [
              "改札（かいさつ）",
              "kaisatsu",
              "車站驗票閘門"
            ]
          ],
          "body": "記住這幾個名稱，找標示時用得上。問路時可以把名稱接在「どこですか」前面。",
          "example": "エレベーターはどこですか？",
          "reading": "erebeetaa wa doko desu ka",
          "meaning": "電梯在哪裡？",
          "id": "phrase/t-place/facilities"
        },
        {
          "title": "找置物櫃",
          "keywords": [
            [
              "ロッカー",
              "rokkaa",
              "置物櫃"
            ],
            [
              "空き（あき）",
              "aki",
              "空的、可使用"
            ]
          ],
          "body": "車站常寫「コインロッカー」。「空き」是空著、可用的意思，有些置物櫃能在面板或網站查空位。大小、價格、付款方式（硬幣、交通卡等）和能放幾天依設備而定，先看櫃子上的說明；超過期限，行李通常會被移到別處保管，領回要付費。",
          "example": "ロッカー、どこですか？",
          "reading": "rokkaa, doko desu ka",
          "meaning": "置物櫃在哪裡？",
          "polite": "コインロッカーはどこですか？",
          "politeReading": "koin rokkaa wa doko desu ka",
          "politeMeaning": "投幣式置物櫃在哪裡？",
          "id": "phrase/t-place/locker"
        },
        {
          "title": "行李放得進置物櫃嗎",
          "keywords": [
            [
              "入ります（はいります）",
              "hairimasu",
              "放得進去"
            ],
            [
              "スーツケース",
              "suutsukeesu",
              "行李箱"
            ],
            [
              "手荷物預かり（てにもつあずかり）",
              "tenimotsu azukari",
              "行李寄放處"
            ]
          ],
          "body": "同樣標「大」或「L」，各地的尺寸也可能不一樣。先看櫃門或螢幕上標的大小，跟行李的高度、厚度比一比。大行李箱可能只放得進最大的櫃子，也可能都放不下；這時可以找寫著「手荷物預かり」的有人寄放處，或請飯店保管（見「飯店與預約」）。",
          "example": "これ、入りますか？",
          "reading": "kore, hairimasu ka",
          "meaning": "這個放得進去嗎？",
          "speech": "これ、はいりますか？",
          "polite": "このスーツケースが入るロッカーはありますか？",
          "politeReading": "kono suutsukeesu ga hairu rokkaa wa arimasu ka",
          "politeMeaning": "有放得下這個行李箱的置物櫃嗎？",
          "politeSpeech": "この スーツケースが はいる ロッカーは ありますか？",
          "id": "phrase/t-place/locker-size"
        },
        {
          "title": "置物櫃打不開",
          "keywords": [
            [
              "開きません（あきません）",
              "akimasen",
              "打不開"
            ],
            [
              "鍵（かぎ）",
              "kagi",
              "鑰匙"
            ]
          ],
          "body": "指著櫃子或櫃號，對站務員或管理公司的人說這句。有些置物櫃站務員無法處理，要打櫃子或收據上的管理公司電話，客服也有服務時間。準備好鑰匙、收據或上鎖時用的交通卡，也可能要出示護照。超過使用時間，可能要先補付費用才能打開。",
          "example": "すみません、開きません。",
          "reading": "sumimasen, akimasen",
          "meaning": "不好意思，打不開。",
          "speech": "すみません、あきません。",
          "polite": "すみません、ロッカーが開きません。",
          "politeReading": "sumimasen, rokkaa ga akimasen",
          "politeMeaning": "不好意思，置物櫃打不開。",
          "politeSpeech": "すみません、ロッカーが あきません。",
          "id": "phrase/t-place/locker-stuck"
        }
      ]
    },
    {
      "id": "t-charge",
      "title": "交通卡加值",
      "subtitle": "チャージ・加值金額",
      "steps": [
        {
          "title": "請店員幫交通卡加值",
          "keywords": [
            [
              "チャージ",
              "chaaji",
              "加值"
            ],
            [
              "お願いします",
              "onegaishimasu",
              "麻煩你／請幫我"
            ]
          ],
          "example": "チャージ、お願いします。",
          "reading": "chaaji, onegaishimasu",
          "meaning": "麻煩幫我加值。",
          "body": "先到有人櫃檯出示交通卡，告訴店員加值金額。7-Eleven 與全家櫃檯加值使用現金，部分門市不提供服務。也可使用支援 Suica 的車站售票機；手機版需有對應設備。",
          "id": "phrase/t-charge/top-up"
        },
        {
          "title": "告訴店員加值金額",
          "keywords": [
            [
              "1000円（せんえん）",
              "sen en",
              "一千日圓"
            ],
            [
              "チャージ",
              "chaaji",
              "加值"
            ]
          ],
          "example": "1000円、お願いします。",
          "reading": "sen en, onegaishimasu",
          "meaning": "一千日圓，麻煩你。",
          "body": "店員已經知道你要加值時，接著說「1000円」就能表達金額：一千日圓。",
          "polite": "1000円、チャージお願いします。",
          "politeReading": "sen en, chaaji onegaishimasu",
          "politeMeaning": "麻煩加值一千日圓。",
          "id": "phrase/t-charge/amount"
        }
      ]
    },
    {
      "id": "transit",
      "title": "交通：買票與搭車",
      "subtitle": "單程・來回・對號座・月台・轉乘・下車",
      "steps": [
        {
          "title": "買票：到哪裡、單程或來回",
          "keywords": [
            [
              "きっぷ",
              "kippu",
              "車票"
            ],
            [
              "片道（かたみち）",
              "katamichi",
              "單程"
            ],
            [
              "往復（おうふく）",
              "oufuku",
              "來回"
            ]
          ],
          "body": "在售票處指著手機上的目的地，說「〇〇まで」（到〇〇），再加上「片道」。JR 從 2026 年 3 月 14 日起不賣來回票，要來回就買去程、回程兩張單程票；其他鐵路公司有的還賣「往復」。",
          "example": "京都まで、片道。",
          "reading": "kyouto made, katamichi",
          "meaning": "到京都，單程。",
          "polite": "京都まで、片道でお願いします。",
          "politeReading": "kyouto made, katamichi de onegaishimasu",
          "politeMeaning": "麻煩給我到京都的單程票。",
          "id": "phrase/transit/ticket"
        },
        {
          "title": "座位：對號座、自由座",
          "keywords": [
            [
              "指定席（していせき）",
              "shiteiseki",
              "對號座"
            ],
            [
              "自由席（じゆうせき）",
              "jiyuuseki",
              "自由座"
            ]
          ],
          "body": "指定席有固定座位；自由席不保證有位子。搭新幹線或 JR 特急，除了車票通常還要另買特急券（私鐵特急有的不用加價）；有些列車只有指定席，旺季也可能全車指定，以車站說明為準。",
          "example": "指定席で。",
          "reading": "shiteiseki de",
          "meaning": "要對號座。",
          "polite": "指定席でお願いします。",
          "politeReading": "shiteiseki de onegaishimasu",
          "politeMeaning": "麻煩給我對號座。",
          "id": "phrase/transit/seat"
        },
        {
          "title": "一日券、大人與小孩",
          "keywords": [
            [
              "一日券（いちにちけん）",
              "ichinichiken",
              "一日券"
            ],
            [
              "大人（おとな）",
              "otona",
              "成人票"
            ],
            [
              "子ども（こども）",
              "kodomo",
              "兒童票"
            ]
          ],
          "body": "票名也可能寫「一日乗車券」或「24時間券」：有的只限當天，有的從開始使用算 24 小時。能搭的範圍各家不同，買前先看清楚。兒童票也可能寫「小児（しょうに）」，幾歲算兒童看車站說明。站務員可能用「〜枚（まい）」問張數，回答ひとつ、ふたつ也可以。",
          "example": "一日券、大人ひとつ。",
          "reading": "ichinichiken, otona hitotsu",
          "meaning": "一日券，一張成人票。",
          "polite": "一日券を大人ひとつお願いします。",
          "politeReading": "ichinichiken o otona hitotsu onegaishimasu",
          "politeMeaning": "麻煩給我一張成人一日券。",
          "staffAsks": {
            "example": "何枚ですか？",
            "reading": "nanmai desu ka",
            "meaning": "要幾張？"
          },
          "id": "phrase/transit/day-pass"
        },
        {
          "title": "找月台：往哪裡、幾號線",
          "keywords": [
            [
              "ホーム",
              "hoomu",
              "月台"
            ],
            [
              "何番線（なんばんせん）",
              "nanbansen",
              "幾號月台"
            ],
            [
              "〜行き（ゆき）",
              "yuki",
              "往〜"
            ]
          ],
          "body": "站內標示常寫「〇番線」和「〇〇行き」。「〇〇行き」表示開往〇〇，〇〇通常是這班車的終點站；你要去的站如果在途中，看板上可能不會出現，要再確認停靠站或問站務員，例如「京都に行く電車は何番線ですか？」（往京都的車在幾號月台？）。",
          "example": "京都行き、何番線？",
          "reading": "kyouto yuki, nanbansen",
          "meaning": "往京都的車，在幾號月台？",
          "polite": "京都行きは何番線ですか？",
          "politeReading": "kyouto yuki wa nanbansen desu ka",
          "politeMeaning": "往京都的車在幾號月台？",
          "speech": "きょうとゆき、なんばんせん？",
          "politeSpeech": "きょうとゆきは なんばんせんですか？",
          "id": "phrase/transit/platform"
        },
        {
          "title": "上車前確認方向",
          "keywords": [
            [
              "この電車（このでんしゃ）",
              "kono densha",
              "這班車"
            ]
          ],
          "body": "指著列車問。只說站名，對方不一定知道你想問什麼，所以要說出「この電車」和目的地。",
          "example": "この電車、京都に行きますか？",
          "reading": "kono densha, kyouto ni ikimasu ka",
          "meaning": "這班車有到京都嗎？",
          "id": "phrase/transit/direction"
        },
        {
          "title": "轉乘",
          "keywords": [
            [
              "乗り換え（のりかえ）",
              "norikae",
              "轉乘"
            ]
          ],
          "body": "先讓對方看手機上的目的地或路線再問，對方比較容易回答。",
          "example": "乗り換え、どこですか？",
          "reading": "norikae, doko desu ka",
          "meaning": "在哪裡轉乘？",
          "polite": "京都まで行きたいです。どこで乗り換えますか？",
          "politeReading": "kyouto made ikitai desu. doko de norikaemasu ka",
          "politeMeaning": "我想到京都，要在哪裡轉乘？",
          "id": "phrase/transit/transfer"
        },
        {
          "title": "在哪一站下車",
          "keywords": [
            [
              "どの駅（どのえき）",
              "dono eki",
              "哪一站"
            ],
            [
              "降りる（おりる）",
              "oriru",
              "下車"
            ],
            [
              "次の駅（つぎのえき）",
              "tsugi no eki",
              "下一站"
            ]
          ],
          "body": "指著目的地問「どの駅？」（哪一站？）就夠了。對方可能回「次の駅」（下一站），再對照車廂裡的站名顯示就好。",
          "example": "どの駅で降りればいい？",
          "reading": "dono eki de orireba ii",
          "meaning": "要在哪一站下車？",
          "polite": "どの駅で降りればいいですか？",
          "politeReading": "dono eki de orireba ii desu ka",
          "politeMeaning": "我應該在哪一站下車？",
          "id": "phrase/transit/get-off"
        }
      ]
    },
    {
      "id": "hotel",
      "title": "飯店與預約",
      "subtitle": "入住・預約・退房・寄放與領回行李",
      "steps": [
        {
          "title": "辦理入住",
          "keywords": [
            [
              "チェックイン",
              "chekku in",
              "辦理入住"
            ]
          ],
          "body": "到飯店櫃檯說「チェックイン」，就能讓工作人員知道你的來意。",
          "example": "チェックインをお願いします。",
          "reading": "chekku in o onegaishimasu",
          "meaning": "麻煩幫我辦理入住。",
          "staffAsks": {
            "example": "パスポートをお願いします。",
            "reading": "pasupooto o onegaishimasu",
            "meaning": "麻煩出示護照。"
          },
          "id": "phrase/hotel/check-in"
        },
        {
          "title": "告訴對方已經預約",
          "keywords": [
            [
              "予約（よやく）",
              "yoyaku",
              "預約／訂位"
            ]
          ],
          "body": "在飯店或餐廳，說完已有預約，再報名字或出示預約畫面。報名字時說「予約した〇〇です」（yoyaku shita 〇〇 desu，我是預約的〇〇）。",
          "example": "予約しています。",
          "reading": "yoyaku shite imasu",
          "meaning": "我有預約。",
          "staffAsks": {
            "example": "お名前をお願いします。",
            "reading": "onamae o onegaishimasu",
            "meaning": "麻煩告訴我您的名字。"
          },
          "id": "phrase/hotel/reservation"
        },
        {
          "title": "退房、問退房時間",
          "keywords": [
            [
              "チェックアウト",
              "chekku auto",
              "退房"
            ],
            [
              "何時（なんじ）",
              "nanji",
              "幾點"
            ]
          ],
          "body": "退房時到櫃檯說「チェックアウト、お願いします」。想先確認時間，就用這句問。",
          "example": "チェックアウトは何時ですか？",
          "reading": "chekku auto wa nanji desu ka",
          "meaning": "幾點要退房？",
          "id": "phrase/hotel/check-out"
        },
        {
          "title": "寄放行李：入住前、退房後",
          "keywords": [
            [
              "荷物（にもつ）",
              "nimotsu",
              "行李"
            ],
            [
              "預けたい（あずけたい）",
              "azuketai",
              "想寄放"
            ]
          ],
          "body": "入住前要寄放，把完整說法的「チェックアウト後」（chekku auto go，退房後）換成「チェックイン前」（chekku in mae，入住前）。能不能寄放、要不要收費、幾點前要領回，依飯店而定。",
          "example": "荷物、預けたいです。",
          "reading": "nimotsu, azuketai desu",
          "meaning": "我想寄放行李。",
          "polite": "チェックアウト後、荷物を預けられますか？",
          "politeReading": "chekku auto go, nimotsu o azukeraremasu ka",
          "politeMeaning": "退房後可以寄放行李嗎？",
          "politeSpeech": "チェックアウトご、にもつを あずけられますか？",
          "id": "phrase/hotel/luggage"
        },
        {
          "title": "領回寄放的行李",
          "keywords": [
            [
              "受け取りたい（うけとりたい）",
              "uketoritai",
              "想領回"
            ]
          ],
          "body": "把寄物牌或收據給櫃檯看，再說這句。",
          "example": "荷物を受け取りたいです。",
          "reading": "nimotsu o uketoritai desu",
          "meaning": "我想領回行李。",
          "id": "phrase/hotel/pick-up"
        }
      ]
    },
    {
      "id": "live",
      "title": "演唱會、活動現場（選用）",
      "subtitle": "開場・整理番號・周邊販售・再入場・飲料費",
      "steps": [
        {
          "title": "開場和開演不一樣",
          "keywords": [
            [
              "開場（かいじょう）",
              "kaijou",
              "開放入場"
            ],
            [
              "開演（かいえん）",
              "kaien",
              "演出開始"
            ]
          ],
          "body": "日文的「開場」是開門讓人進場，和中文的「開場」（表演開始）不同；演出開始是「開演」。開場在前、開演在後，實際時間以主辦公告為準。",
          "example": "開場は何時ですか？",
          "reading": "kaijou wa nanji desu ka",
          "meaning": "幾點開放入場？",
          "id": "phrase/live/doors"
        },
        {
          "title": "整理番號：入場順序",
          "keywords": [
            [
              "整理番号（せいりばんごう）",
              "seiri bangou",
              "入場順序號碼"
            ],
            [
              "チケット",
              "chiketto",
              "票"
            ]
          ],
          "body": "整理番號是入場的排隊順序，不是座位號碼。指著票上的號碼問工作人員要排在哪裡。",
          "example": "この番号は、どこに並べばいいですか？",
          "reading": "kono bangou wa, doko ni narabeba ii desu ka",
          "meaning": "這個號碼要在哪裡排隊？",
          "id": "phrase/live/number"
        },
        {
          "title": "周邊販售排隊",
          "keywords": [
            [
              "物販（ぶっぱん）",
              "buppan",
              "周邊販售"
            ],
            [
              "最後尾（さいこうび）",
              "saikoubi",
              "隊伍最後面"
            ],
            [
              "売り切れ（うりきれ）",
              "urikire",
              "賣完"
            ]
          ],
          "body": "先找隊伍最後面再排；牌子寫「売り切れ」就是賣完了。想買的東西指著說「これ、ください」；付款方式見「結帳與付款」。",
          "example": "物販の最後尾はどこですか？",
          "reading": "buppan no saikoubi wa doko desu ka",
          "meaning": "周邊販售的隊伍最後面在哪裡？",
          "id": "phrase/live/merch"
        },
        {
          "title": "可以再入場嗎",
          "keywords": [
            [
              "再入場（さいにゅうじょう）",
              "sainyuujou",
              "再次入場"
            ]
          ],
          "body": "離場前先問。能不能再入場依每場規定。",
          "example": "再入場できますか？",
          "reading": "sainyuujou dekimasu ka",
          "meaning": "可以再次入場嗎？",
          "id": "phrase/live/re-entry"
        },
        {
          "title": "入場時的飲料費",
          "keywords": [
            [
              "ドリンク代（ドリンクだい）",
              "dorinku dai",
              "飲料費"
            ],
            [
              "ドリンクチケット",
              "dorinku chiketto",
              "飲料券"
            ]
          ],
          "body": "Live house 等場地入場時常另收飲料費，付了會拿到飲料券或代幣，再到吧台換飲料；不是每場都有，金額也依場地而定。",
          "example": "ドリンク代、いくらですか？",
          "reading": "dorinku dai, ikura desu ka",
          "meaning": "飲料費多少錢？",
          "id": "phrase/live/drink"
        }
      ]
    }
  ];
  const intro = {
    "lessons": [
      {
        "label": "先認識一下",
        "title": "貓、麵包、山，日文怎麼寫？",
        "intro": "先看三個例子，認識日文裡常見的三種寫法。",
        "content": "<div class=\"script-row word-examples\"><div class=\"script-cell\"><div class=\"character\" lang=\"ja\">ねこ</div><strong>貓</strong><p>這是平假名</p></div><div class=\"script-cell\"><div class=\"character\" lang=\"ja\">パン</div><strong>麵包</strong><p>這是片假名</p></div><div class=\"script-cell\"><div class=\"character\" lang=\"ja\">山</div><strong>山</strong><p>這是漢字</p></div></div>",
        "tip": "接下來分別介紹這三種寫法。",
        "id": "intro/card/three-scripts"
      },
      {
        "label": "平假名",
        "title": "先從平假名認識日文。",
        "intro": "平假名可以記錄日文的聲音。",
        "content": "<span class=\"word-type\">平假名</span><div class=\"example-large\"><span class=\"example-word\" lang=\"ja\">ねこ</span><span class=\"example-meaning\"><small>意思是</small>貓</span></div><p class=\"explain\"><strong lang=\"ja\">ね、こ</strong> 都是平假名。<br>這兩個字組在一起，就是「貓」。這裡先認識寫法，讀音可在五十音課練習。</p>",
        "tip": "五十音課會介紹各個平假名的讀音。",
        "id": "intro/card/hiragana"
      },
      {
        "label": "片假名",
        "title": "外來語，常會用到片假名。",
        "intro": "片假名常用來寫從其他語言借來的詞。",
        "className": "example-aqua",
        "content": "<span class=\"word-type\">片假名</span><div class=\"example-large\"><span class=\"example-word\" lang=\"ja\">パン</span><span class=\"example-meaning\"><small>意思是</small>麵包</span></div><p class=\"explain\"><strong lang=\"ja\">パン</strong> 使用片假名書寫。<br>外來語和外國人名，常會用到片假名。</p>",
        "tip": "片假名也有其他用途；這裡先以外來語為例。",
        "id": "intro/card/katakana"
      },
      {
        "label": "漢字",
        "title": "有些字，你可能已經認得。",
        "intro": "日文也使用漢字，像「山」「人」「日」。",
        "className": "example-orange",
        "content": "<span class=\"word-type\">漢字</span><div class=\"example-large\"><span class=\"example-word\" lang=\"ja\">山</span><span class=\"example-meaning\"><small>意思是</small>山</span></div><p class=\"explain\">漢字能幫助我們辨認詞的意思。<br>不過，<strong>看得懂字形，不代表日文讀音和中文一樣</strong>；讀音之後再學就好。</p><p class=\"explain\">三種文字會一起出現在日文裡。例如 <strong lang=\"ja\">日本のパン</strong>（日本的麵包）：「日本」是漢字、「の」是平假名、「パン」是片假名。</p>",
        "tip": "日文漢字的讀音需要另外學習，不能直接套用中文讀音。",
        "id": "intro/card/kanji"
      }
    ],
    "questions": {
      "4": {
        "title": "剛剛的「<span lang='ja'>ねこ</span>」，是哪種文字？",
        "word": "ねこ",
        "note": "剛才見過的「貓」",
        "options": [
          "平假名",
          "片假名",
          "漢字"
        ],
        "answer": 0,
        "correct": "沒錯，是平假名。",
        "explanation": "「ね、こ」都是平假名，組在一起表示「貓」。",
        "wrong": "再看一下提示。",
        "hint": "「ねこ」是剛才介紹平假名時的例子。再選一次就好。",
        "id": "intro/question/hiragana-example"
      },
      "5": {
        "title": "哪一句說明正確？",
        "options": [
          "平假名、片假名和漢字，是同一種文字的不同名稱。",
          "平假名、片假名和漢字，會一起出現在日文句子裡。",
          "平假名、片假名和漢字，分別屬於三種不同的語言。"
        ],
        "answer": 1,
        "correct": "對，它們會一起出現在日文裡。",
        "explanation": "這是日文裡的三種文字，不是同一種文字的別名，也不是三種不同語言；它們可以一起出現在句子裡。",
        "wrong": "再看一下提示。",
        "hint": "回想「日本のパン」：漢字、平假名和片假名，會一起出現在日文裡。",
        "id": "intro/question/mixed-scripts"
      }
    }
  };

  function canonical(value) {
    if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
    if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
    return JSON.stringify(value);
  }
  function revisionOf(course) {
    if (!course || typeof course !== 'object') return null;
    // FNV-1a 64 over canonical UTF-16 code units; a version tag permits later algorithm changes.
    let hash = 0xcbf29ce484222325n;
    const text = canonical(course);
    for (let i = 0; i < text.length; i++) {
      hash ^= BigInt(text.charCodeAt(i));
      hash = BigInt.asUintN(64, hash * 0x100000001b3n);
    }
    return `c1-${hash.toString(16).padStart(16, '0')}`;
  }
  function buildCourses(source) {
    const registry = Object.create(null);
    for (const course of [...source.grammar, ...source.sounds]) registry[course.id] = course;
    // Contracted sounds (きゃ) are two characters, so their rows list items instead of one string,
    // and their IDs join every code point (single characters keep their original u3042-style IDs).
    const items = (value) => [...value];
    const code = (character) => [...character].map((part) => part.codePointAt(0).toString(16)).join('-');
    for (const script of ['h', 'k']) {
      for (const [key, row, hiragana, katakana, readings] of source.rows) {
        const id = `${script}-${key}`;
        const letters = items(script === 'h' ? hiragana : katakana);
        const cards = letters.map((character, i) => ({
          id: `${id}/card/u${code(character)}`,
          character, reading: readings[i], spoken: items(hiragana)[i],
        }));
        registry[id] = {
          id, type: 'kana', script, row,
          title: `${script === 'h' ? '平假名' : '片假名'}・${row}`,
          letters, spoken: items(hiragana), readings,
          cards,
          questions: cards.map((card, i) => ({
            id: `${id}/question/u${code(card.character)}`,
            character: card.character, reading: card.reading,
            options: [...readings], answer: i,
          })),
        };
      }
    }
    return registry;
  }
  const data = { rows, grammar, lessonPlan, sounds, phrasebook, intro };
  // Kana row groups in teaching order; the kana page and home recommendation follow them.
  const rowGroups = Object.freeze({
    basic: Object.freeze(['a', 'ka', 'sa', 'ta', 'na', 'ha', 'ma', 'ya', 'ra', 'wa']),
    voiced: Object.freeze(['ga', 'za', 'da', 'ba', 'pa']),
    youon: Object.freeze(["kya", "sha", "cha", "nya", "hya", "mya", "rya", "gya", "ja", "bya", "pya"]),
  });
  // Titles of the retired #study/t-* courses, for history records saved without a title.
  // Their content now lives only in the phrasebook under the same ids.
  const retiredTitles = Object.freeze({"t-place":"問位置：廁所、車站","t-order":"點餐：品項、數量、冷熱與份量","t-pay":"結帳：請店員算錢","t-charge":"交通卡加值"});
  const courses = buildCourses(data);
  const getCourse = id => Object.hasOwn(courses, id) ? courses[id] : null;
  // Content is frozen, so each revision is hashed once; reloading kana rounds compares many of them.
  const revisions = new Map();
  const courseRevision = id => {
    if (id !== 'intro' && !Object.hasOwn(courses, id)) return null;
    if (!revisions.has(id)) revisions.set(id, id === 'intro' ? revisionOf({ id: 'intro', ...intro }) : revisionOf(courses[id]));
    return revisions.get(id);
  };

  // Immutable v1 migration baseline. Do not regenerate this map when content changes.
  const legacyCourseRevision = Object.freeze({
    "g-identity": "c1-eb1509160ab37eb6",
    "g-question": "c1-008a54ef1a1b8f14",
    "g-demo": "c1-8f44d9ea1c93e236",
    "t-place": "c1-eb50bde559db13a9",
    "t-order": "c1-d8d912f61aa286f9",
    "t-pay": "c1-013959d1f911ef92",
    "t-charge": "c1-74eada6aaa516a51",
    "h-a": "c1-abfe96b1ff0abfae",
    "h-ka": "c1-3162fda7be3c29f0",
    "h-sa": "c1-855d84a6c4f6031c",
    "h-ta": "c1-4460614206b123f0",
    "h-na": "c1-2a3c487e661471d6",
    "h-ha": "c1-5ed8bbc49bf91f7f",
    "h-ma": "c1-f3ba7c5d72d364c5",
    "h-ya": "c1-96701f8b2eafd6e2",
    "h-ra": "c1-87af57f90fa0f577",
    "h-wa": "c1-7852e0c829ce9ca8",
    "k-a": "c1-342b8ff659d9c5de",
    "k-ka": "c1-1801fb31b34b939e",
    "k-sa": "c1-d80b141cd5c24b2c",
    "k-ta": "c1-f693aafd0831c69e",
    "k-na": "c1-0a133f271bc26e60",
    "k-ha": "c1-359e5851f992cced",
    "k-ma": "c1-951ce51a56213267",
    "k-ya": "c1-0c90b4b5ffbde324",
    "k-ra": "c1-9c1b86ab5daf5ce1",
    "k-wa": "c1-38fc966ffb423720",
    "intro": "c1-fa69b4eb0c746fdb"
  });

  function validate(candidate = data) {
    const diagnostics = [];
    const fail = (path, message) => diagnostics.push(`${path}: ${message}`);
    const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
    const text = (value, path, language) => {
      if (typeof value !== 'string' || !value.trim()) { fail(path, 'required nonempty text'); return false; }
      if (language === 'ja' && !/[\u3040-\u30ff\u3400-\u9fff]/u.test(value)) fail(path, 'required Japanese text');
      if (language === 'zh' && !/[\u3400-\u9fff]/u.test(value)) fail(path, 'required Chinese text');
      if (language === 'reading' && !/[a-z]/i.test(value)) fail(path, 'required reading text');
      return true;
    };
    const list = (value, path) => {
      if (!Array.isArray(value) || !value.length) { fail(path, 'required nonempty array'); return []; }
      return value;
    };
    const identifier = (value, path, seen, kind) => {
      if (!text(value, path)) return;
      if (!/^[a-z0-9][a-z0-9/-]*$/.test(value)) fail(path, 'invalid stable id');
      if (seen.has(value)) fail(path, `duplicate ${kind} id ${value}`);
      seen.add(value);
    };
    function keywords(value, path) {
      const seen = new Set();
      list(value, path).forEach((tuple, i) => {
        const at = `${path}[${i}]`;
        if (!Array.isArray(tuple) || tuple.length !== 3) { fail(at, 'keyword must be a Japanese/reading/Chinese tuple'); return; }
        text(tuple[0], `${at}.Japanese`, 'ja'); text(tuple[1], `${at}.reading`, 'reading'); text(tuple[2], `${at}.meaning`, 'zh');
        const key = typeof tuple[0] === 'string' ? tuple[0].normalize('NFC').trim() : tuple[0];
        if (seen.has(key)) fail(at, 'duplicate keyword');
        seen.add(key);
      });
    }
    function card(value, path, seen, kind = 'card') {
      if (!record(value)) { fail(path, `invalid ${kind} object`); return; }
      identifier(value.id, `${path}.id`, seen, kind);
      text(value.title, `${path}.title`, 'zh');
      text(value.example, `${path}.example`, 'ja');
      text(value.reading, `${path}.reading`, 'reading');
      text(value.meaning, `${path}.meaning`, 'zh');
      text(value.body, `${path}.body`, 'zh');
      if (value.keywords !== undefined) keywords(value.keywords, `${path}.keywords`);
      if (['polite', 'politeReading', 'politeMeaning'].some(key => value[key] !== undefined)) {
        text(value.polite, `${path}.polite`, 'ja');
        text(value.politeReading, `${path}.politeReading`, 'reading');
        text(value.politeMeaning, `${path}.politeMeaning`, 'zh');
      }
      if (value.extra !== undefined) card(value.extra, `${path}.extra`, seen, kind);
      for (const key of ['speech', 'politeSpeech']) if (value[key] !== undefined && (typeof value[key] !== 'string' || !/^[\u3040-\u30ff\u3000-\u303f\uff01-\uff1f\s、。？！ー]+$/u.test(value[key]))) fail(`${path}.${key}`, 'speech text must be kana only');
      if (value.politeSpeech !== undefined && value.polite === undefined) fail(`${path}.politeSpeech`, 'politeSpeech needs polite');
      if (value.staffAsks !== undefined) {
        if (!record(value.staffAsks)) fail(`${path}.staffAsks`, 'invalid staff question');
        else { text(value.staffAsks.example, `${path}.staffAsks.example`, 'ja'); text(value.staffAsks.reading, `${path}.staffAsks.reading`, 'reading'); text(value.staffAsks.meaning, `${path}.staffAsks.meaning`, 'zh'); }
      }
    }
    function question(value, path, seen, introQuestion = false) {
      if (!record(value)) { fail(path, 'invalid question object'); return; }
      identifier(value.id, `${path}.id`, seen, 'question');
      text(introQuestion ? value.title : value.prompt, `${path}.${introQuestion ? 'title' : 'prompt'}`, 'zh');
      text(value.explanation, `${path}.explanation`, 'zh');
      const options = list(value.options, `${path}.options`);
      if (options.length < 2) fail(`${path}.options`, 'at least two options are required');
      options.forEach((option, i) => text(option, `${path}.options[${i}]`));
      const normalized = options.filter(option => typeof option === 'string').map(option => option.normalize('NFC').trim());
      if (new Set(normalized).size !== normalized.length) fail(`${path}.options`, 'options must be distinct');
      if (!Number.isInteger(value.answer) || value.answer < 0 || value.answer >= options.length) fail(`${path}.answer`, 'answer must identify an existing option');
      if (value.readings !== undefined && (!Array.isArray(value.readings) || value.readings.length !== options.length || !value.readings.every((reading, i) => text(reading, `${path}.readings[${i}]`, 'reading')))) fail(`${path}.readings`, 'readings must match options');
      if (introQuestion) {
        for (const key of ['correct', 'wrong', 'hint']) text(value[key], `${path}.${key}`, 'zh');
        if (value.word !== undefined) { text(value.word, `${path}.word`, 'ja'); text(value.note, `${path}.note`, 'zh'); }
      }
    }
    if (!record(candidate)) { fail('content', 'invalid root schema'); return diagnostics; }
    const expected = [
      ['a','あいうえお','アイウエオ','a i u e o'], ['ka','かきくけこ','カキクケコ','ka ki ku ke ko'],
      ['sa','さしすせそ','サシスセソ','sa shi su se so'], ['ta','たちつてと','タチツテト','ta chi tsu te to'],
      ['na','なにぬねの','ナニヌネノ','na ni nu ne no'], ['ha','はひふへほ','ハヒフヘホ','ha hi fu he ho'],
      ['ma','まみむめも','マミムメモ','ma mi mu me mo'], ['ya','やゆよ','ヤユヨ','ya yu yo'],
      ['ra','らりるれろ','ラリルレロ','ra ri ru re ro'], ['wa','わをん','ワヲン','wa o n'],
      // Voiced and semi-voiced rows. ぢ／づ sound the same as じ／ず, so they share ji／zu.
      ['ga','がぎぐげご','ガギグゲゴ','ga gi gu ge go'], ['za','ざじずぜぞ','ザジズゼゾ','za ji zu ze zo'],
      ['da','だぢづでど','ダヂヅデド','da ji zu de do'], ['ba','ばびぶべぼ','バビブベボ','ba bi bu be bo'],
      ['pa','ぱぴぷぺぽ','パピプペポ','pa pi pu pe po'],
      // Contracted sounds: a small ゃ／ゅ／ょ joins the i-column kana into one beat.
      ['kya','きゃ きゅ きょ','キャ キュ キョ','kya kyu kyo'],
      ['sha','しゃ しゅ しょ','シャ シュ ショ','sha shu sho'],
      ['cha','ちゃ ちゅ ちょ','チャ チュ チョ','cha chu cho'],
      ['nya','にゃ にゅ にょ','ニャ ニュ ニョ','nya nyu nyo'],
      ['hya','ひゃ ひゅ ひょ','ヒャ ヒュ ヒョ','hya hyu hyo'],
      ['mya','みゃ みゅ みょ','ミャ ミュ ミョ','mya myu myo'],
      ['rya','りゃ りゅ りょ','リャ リュ リョ','rya ryu ryo'],
      ['gya','ぎゃ ぎゅ ぎょ','ギャ ギュ ギョ','gya gyu gyo'],
      ['ja','じゃ じゅ じょ','ジャ ジュ ジョ','ja ju jo'],
      ['bya','びゃ びゅ びょ','ビャ ビュ ビョ','bya byu byo'],
      ['pya','ぴゃ ぴゅ ぴょ','ピャ ピュ ピョ','pya pyu pyo'],
    ];
    // Contracted rows list each two-character sound; the other rows are one string of single kana.
    const sameKana = (value, reference) => reference.includes(' ') ? Array.isArray(value) && value.join(' ') === reference : value === reference;
    const sourceRows = list(candidate.rows, 'rows');
    if (sourceRows.length !== expected.length) fail('rows', 'kana coverage requires twenty-six rows per script');
    const rowIds = new Set();
    sourceRows.forEach((row, i) => {
      if (!Array.isArray(row) || row.length !== 5) { fail(`rows[${i}]`, 'invalid kana row tuple'); return; }
      identifier(row[0], `rows[${i}].id`, rowIds, 'row');
      text(row[1], `rows[${i}].label`, 'ja');
      const reference = expected.find(item => item[0] === row[0]);
      if (!reference) { fail(`rows[${i}]`, 'unknown kana row'); return; }
      if (!sameKana(row[2], reference[1]) || !sameKana(row[3], reference[2])) fail(`rows[${i}]`, 'kana coverage/order must match the basic chart');
      if (!Array.isArray(row[4]) || row[4].join(' ') !== reference[3]) fail(`rows[${i}].readings`, 'kana readings must match the basic chart');
    });
    // Generated kana IDs occupy the same registry as authored courses.
    const courseIds = new Set(expected.flatMap(([key]) => [`h-${key}`, `k-${key}`]));
    const cardIds = new Set(), questionIds = new Set();
    for (const group of ['grammar', 'sounds']) {
      list(candidate[group], group).forEach((course, i) => {
        const path = `${group}[${i}]`;
        if (!record(course)) { fail(path, 'invalid course object'); return; }
        identifier(course.id, `${path}.id`, courseIds, 'course');
        if (course.type !== 'grammar') fail(`${path}.type`, 'course type must be grammar');
        if (course.group !== undefined) fail(`${path}.group`, 'travel content belongs in the phrasebook');
        if (group === 'sounds' ? course.home !== 'kana' : course.home !== undefined) fail(`${path}.home`, 'only special-sound lessons live on the kana page');
        // Storage treats h-*/k-* ids as kana rows when a records clear ends unfinished rounds.
        if (typeof course.id === 'string' && /^[hk]-/.test(course.id)) fail(`${path}.id`, 'h- and k- ids are reserved for kana rows');
        text(course.title, `${path}.title`, 'zh'); text(course.subtitle, `${path}.subtitle`);
        list(course.steps, `${path}.steps`).forEach((step, j) => card(step, `${path}.steps[${j}]`, cardIds));
        list(course.questions, `${path}.questions`).forEach((q, j) => question(q, `${path}.questions[${j}]`, questionIds));
        // Grammar lessons are open before kana practice, so kana options carry romaji (Chinese options need none).
        if (Array.isArray(course.questions)) course.questions.forEach((q, j) => { if (record(q) && Array.isArray(q.options) && q.options.some(option => /[぀-ヿ]/u.test(option)) && q.readings === undefined) fail(`${path}.questions[${j}].readings`, 'Japanese options require readings'); });
      });
    }
    // Lesson plan: every grammar lesson lists what it introduces and only uses taught words in its
    // examples and quoted prompts; requirements point to earlier lessons; review cards exist.
    const plan = record(candidate.lessonPlan) ? candidate.lessonPlan : (fail('lessonPlan', 'invalid lesson plan'), {});
    const lessonsInOrder = Array.isArray(candidate.grammar) ? candidate.grammar.filter(record) : [];
    const tokens = (id, seen = new Set()) => {
      if (seen.has(id) || !record(plan[id])) return [];
      seen.add(id);
      const own = [...(Array.isArray(plan[id].words) ? plan[id].words : []), ...(Array.isArray(plan[id].grammar) ? plan[id].grammar : [])];
      return [...own, ...(Array.isArray(plan[id].requires) ? plan[id].requires : []).flatMap(req => tokens(req, seen))];
    };
    lessonsInOrder.forEach((course, index) => {
      const entry = plan[course.id], path = `lessonPlan.${course.id}`;
      if (!record(entry)) { fail(path, 'every grammar lesson needs a plan entry'); return; }
      for (const key of ['requires', 'words', 'grammar']) if (!Array.isArray(entry[key])) fail(`${path}.${key}`, 'required array');
      // A unit is one run of lessons; the grammar page shows one heading per unit.
      if (typeof entry.unit === 'string' && entry.unit !== entry.unit.trim()) fail(`${path}.unit`, 'unit title has surrounding spaces');
      if (text(entry.unit, `${path}.unit`, 'zh') && index > 0 && plan[lessonsInOrder[index - 1].id]?.unit !== entry.unit && lessonsInOrder.slice(0, index).some(item => plan[item.id]?.unit === entry.unit)) fail(`${path}.unit`, 'lessons in a unit must be next to each other');
      for (const req of entry.requires || []) {
        const at = lessonsInOrder.findIndex(item => item.id === req);
        if (at < 0 || at >= index) fail(`${path}.requires`, `${req} must be an earlier lesson`);
      }
      const steps = Array.isArray(course.steps) ? course.steps : [], questions = Array.isArray(course.questions) ? course.questions : [];
      const cardsHere = new Set(steps.map(step => step?.id)), questionsHere = new Set(questions.map(item => item?.id));
      if (!record(entry.review)) fail(`${path}.review`, 'required review map');
      else {
        for (const id of questionsHere) if (!cardsHere.has(entry.review[id])) fail(`${path}.review`, `${id} needs a card to revisit`);
        for (const id of Object.keys(entry.review)) if (!questionsHere.has(id)) fail(`${path}.review`, `unknown question ${id}`);
      }
      if (entry.sources !== undefined && (!record(entry.sources) || Object.keys(entry.sources).some(id => !questionsHere.has(id) || !text(entry.sources[id], `${path}.sources`)))) fail(`${path}.sources`, 'sources must name this lesson\'s questions');
      const allowed = [...new Set(tokens(course.id))].sort((x, y) => y.length - x.length);
      const untaught = (value) => {
        let rest = String(value);
        for (const token of allowed) rest = rest.split(token).join(' ');
        return rest.replace(/[\s　、。？！「」（）／・〜…＿-]/gu, '');
      };
      // Examples and the correct option must use taught words only; distractors may show wrong forms.
      const texts = [...steps.flatMap(step => [step?.example, step?.polite]), ...questions.map(item => Array.isArray(item?.options) ? item.options[item.answer] : null)];
      for (const value of texts.filter(value => typeof value === 'string')) {
        const rest = untaught(value);
        if (/[\u3040-\u30ff\u3400-\u9fff]/u.test(rest) && /[\u3040-\u30ff]/u.test(value)) fail(`${path}`, `"${value}" uses words this lesson has not taught: ${rest}`);
      }
      // Prompts mix Chinese and Japanese, so only leftover kana counts there.
      for (const item of questions) {
        const kana = untaught(item?.prompt || '').replace(/[^\u3040-\u30ff]/gu, '');
        if (kana) fail(`${path}`, `"${item.prompt}" uses words this lesson has not taught: ${kana}`);
      }
    });
    for (const id of Object.keys(plan)) if (!lessonsInOrder.some(course => course.id === id)) fail(`lessonPlan.${id}`, 'unknown lesson');
    const categoryIds = new Set(), phraseIds = new Set();
    list(candidate.phrasebook, 'phrasebook').forEach((category, i) => {
      const path = `phrasebook[${i}]`;
      if (!record(category)) { fail(path, 'invalid phrasebook category'); return; }
      identifier(category.id, `${path}.id`, categoryIds, 'category');
      for (const key of ['questions', 'type', 'group']) if (category[key] !== undefined) fail(`${path}.${key}`, 'phrasebook categories are not quizzes or courses');
      text(category.title, `${path}.title`, 'zh'); text(category.subtitle, `${path}.subtitle`, 'zh');
      list(category.steps, `${path}.steps`).forEach((step, j) => {
        card(step, `${path}.steps[${j}]`, phraseIds, 'phrase');
        if (record(step) && step.keywords === undefined) fail(`${path}.steps[${j}].keywords`, 'phrase keywords are required');
      });
    });
    if (!record(candidate.intro)) fail('intro', 'invalid intro schema');
    else {
      const lessons = list(candidate.intro.lessons, 'intro.lessons');
      if (lessons.length !== 4) fail('intro.lessons', 'intro requires four cards');
      lessons.forEach((lesson, i) => {
        const path = `intro.lessons[${i}]`;
        if (!record(lesson)) { fail(path, 'invalid intro card'); return; }
        identifier(lesson.id, `${path}.id`, cardIds, 'card');
        for (const key of ['label','title','intro','tip']) text(lesson[key], `${path}.${key}`, 'zh');
        text(lesson.content, `${path}.content`, 'ja');
      });
      if (!record(candidate.intro.questions) || Object.keys(candidate.intro.questions).sort().join(',') !== '4,5') fail('intro.questions', 'intro questions must retain steps 4 and 5');
      else for (const [key, value] of Object.entries(candidate.intro.questions)) question(value, `intro.questions.${key}`, questionIds, true);
    }
    return diagnostics;
  }
  function deepFreeze(value) {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      Object.values(value).forEach(deepFreeze);
      Object.freeze(value);
    }
    return value;
  }
  deepFreeze(data); deepFreeze(courses);
  return Object.freeze({ rows, rowGroups, grammar, lessonPlan, sounds, phrasebook, intro, retiredTitles, courses, getCourse, courseRevision, revisionOf, legacyCourseRevision, validate });
})();
