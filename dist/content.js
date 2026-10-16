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
      "subtitle": "名詞句的基本結構",
      "steps": [
        {
          "title": "本課單字",
          "example": "わたし ／ がくせい",
          "reading": "watashi / gakusei",
          "meaning": "我 ／ 學生",
          "body": "本課用這兩個詞，練習自我介紹。",
          "id": "g-identity/card/nouns"
        },
        {
          "title": "句型：A は B です",
          "example": "わたしは がくせいです。",
          "reading": "watashi wa gakusei desu",
          "meaning": "我是學生。",
          "body": "「わたし」是我，「がくせい」是學生。「は」標出這句話的主題，也就是正在談的「我」；後面的「がくせいです」說明我是學生。「です」是較禮貌的句尾。",
          "id": "g-identity/card/noun-sentence"
        },
        {
          "title": "助詞 は 的讀音",
          "example": "わたし は がくせい です。",
          "reading": "watashi wa gakusei desu",
          "meaning": "說到我：我是學生。",
          "body": "這裡的「は」標出我們正在說誰，要讀成 wa。雖然念 wa，寫的仍是「は」，不是「わ」。",
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
          "readings": ["wa","wa","desu"],
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
          "title": "敘述句：〜です",
          "example": "がくせいです。",
          "reading": "gakusei desu",
          "meaning": "是學生。",
          "body": "「がくせい」是學生，「です」讓這個名詞句以比較禮貌的方式結尾。這句話是在說明，不是在發問。",
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
          "title": "情境清楚時，可省略人稱",
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
          "readings": ["watashi wa gakusei desu","gakusei wa watashi desu","gakusei desu ka"],
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
      "subtitle": "依物品的位置選擇指示詞",
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
          "readings": ["sore","kore","are"],
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
          "readings": ["are","sore","kore"],
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
          "readings": ["kore","are","sore"],
          "answer": 2,
          "explanation": "麵包靠近聽你說話的朋友、離你較遠，所以用「それ」。",
          "id": "g-demo/question/listener-item"
        }
      ]
    }
  ];
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
          "body": "小字的「っ」本身不發音，在下一個音之前停一拍。羅馬字把下一個子音寫兩次：ki-p-pu。",
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
          "explanation": "小的 っ 讓下一個子音寫兩次：kippu。kipu 少了停頓；kiipu 是把 き 拉長，那是長音。",
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
          "title": "重複母音就是拉長",
          "example": "おばさん ／ おばあさん",
          "reading": "obasan / obaasan",
          "meaning": "阿姨 ／ 奶奶",
          "body": "「おばあさん」在 ば 後面多一個 あ，把 ba 拉長成 baa，多一拍，意思就從阿姨變成奶奶。羅馬字把母音寫兩次：obaasan。",
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
          "body": "片假名用長音符號「ー」把前一個音拉長，羅馬字寫成兩個母音。",
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
          "body": "知道忘在哪裡時，用這句說地點和東西。給站務員或店員看搭車的時間、方向或照片，再補充顏色，比較容易找到。",
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
          "body": "不確定在哪裡弄丟時用這句；知道忘在哪裡，改說「〇〇に忘れました」。可以向車站、店家或派出所（交番，kouban）詢問。",
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
          "body": "車站常寫「コインロッカー」，標「空き」的是空櫃。大小、價格、付款方式和能放多久依設備而定，先看櫃子上的說明。想把行李寄在飯店，見「飯店與預約」。",
          "example": "ロッカー、どこですか？",
          "reading": "rokkaa, doko desu ka",
          "meaning": "置物櫃在哪裡？",
          "polite": "コインロッカーはどこですか？",
          "politeReading": "koin rokkaa wa doko desu ka",
          "politeMeaning": "投幣式置物櫃在哪裡？",
          "id": "phrase/t-place/locker"
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
          "body": "指著櫃子或櫃號說這句。可以找附近的站務員，或看櫃子上寫的管理公司聯絡方式；把鑰匙、收據或上鎖時用的交通卡一起拿給對方看。",
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
          "body": "在售票處指著手機上的目的地，說「〇〇まで」（到〇〇），再加上片道或往復就可以。",
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
          "body": "指定席有固定座位；自由席不保證有位子。搭特急或新幹線時，除了車票通常還要另買特急券，有些列車也只有指定席，實際規定以車站說明為準。",
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
          "body": "票名也可能寫「一日乗車券」，兒童票在售票機上也可能寫「小児（しょうに）」。每種一日券能搭的區域和路線不同，買之前先看清楚範圍；幾歲算兒童以車站說明為準。站務員可能用「〜枚（まい）」算張數，回答ひとつ、ふたつ也聽得懂。",
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
  const data = { rows, grammar, sounds, phrasebook, intro };
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
  return Object.freeze({ rows, rowGroups, grammar, sounds, phrasebook, intro, retiredTitles, courses, getCourse, courseRevision, revisionOf, legacyCourseRevision, validate });
})();
