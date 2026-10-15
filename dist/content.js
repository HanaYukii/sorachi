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
          "answer": 2,
          "explanation": "麵包靠近聽你說話的朋友、離你較遠，所以用「それ」。",
          "id": "g-demo/question/listener-item"
        }
      ]
    }
  ];
  const travel = [
    {
      "id": "t-place",
      "type": "grammar",
      "group": "travel",
      "title": "問位置：廁所、車站",
      "subtitle": "トイレ・駅・どこ",
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
          "id": "t-place/card/toilet"
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
          "id": "t-place/card/station"
        }
      ],
      "questions": [
        {
          "prompt": "你想找廁所，先對店員說哪個關鍵字？",
          "options": [
            "トイレ",
            "駅",
            "どこ"
          ],
          "answer": 0,
          "explanation": "「トイレ」是廁所。「すみません」可先引起店員注意，「どこ」則是問哪裡。",
          "id": "t-place/question/toilet-keyword"
        },
        {
          "prompt": "「駅、どこですか？」中的「どこ」，是在問什麼？",
          "options": [
            "要一個",
            "在哪裡",
            "要結帳"
          ],
          "answer": 1,
          "explanation": "「どこ」是「哪裡」。把地點名稱放在前面，就能表達你想找哪個地方。",
          "id": "t-place/question/where-meaning"
        }
      ]
    },
    {
      "id": "t-order",
      "type": "grammar",
      "group": "travel",
      "title": "點餐：品項、數量、冷熱與份量",
      "subtitle": "これ・ふたつ・ホット・並盛",
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
          "id": "t-order/card/menu-item"
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
          "id": "t-order/card/quantity"
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
            "body": "已經選好威士忌或燒酎等酒款，店員問喝法時，可以這樣回答。「ロック」是酒加冰塊；「ソーダ割り」是酒加蘇打水。",
            "id": "t-order/extra/drink-style"
          },
          "id": "t-order/card/drink-temperature"
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
          "id": "t-order/card/noodle-temperature"
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
          "id": "t-order/card/portion"
        }
      ],
      "questions": [
        {
          "prompt": "你指著菜單上一道餐點說「これ」，是什麼意思？",
          "options": [
            "一份",
            "這個",
            "結帳"
          ],
          "answer": 1,
          "explanation": "「これ」是「這個」。指著品項，店員才知道你要的是哪一個。",
          "id": "t-order/question/item-reference"
        },
        {
          "prompt": "你指著菜單上的一道餐點，想要兩份，要說哪個？",
          "options": [
            "ひとつ",
            "みっつ",
            "ふたつ"
          ],
          "answer": 2,
          "explanation": "「ふたつ」是兩個或兩份。指著品項說「これ、ふたつ」，就是「這個，兩份」。",
          "id": "t-order/question/two-portions"
        }
      ]
    },
    {
      "id": "t-pay",
      "type": "grammar",
      "group": "travel",
      "title": "結帳：請店員算錢",
      "subtitle": "お会計（okaikei）・お願いします",
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
          "id": "t-pay/card/bill"
        },
        {
          "title": "在需求後加上禮貌用語",
          "keywords": [
            [
              "お願いします",
              "onegaishimasu",
              "麻煩你／請幫我"
            ],
            [
              "お会計（おかいけい）",
              "okaikei",
              "結帳"
            ]
          ],
          "example": "お会計、お願いします。",
          "reading": "okaikei, onegaishimasu",
          "meaning": "麻煩幫我結帳。",
          "body": "「お会計」是你要做的事，「お願いします」是「麻煩你」。先說需求，再加上這句就可以。",
          "id": "t-pay/card/polite-request"
        }
      ],
      "questions": [
        {
          "prompt": "吃完飯對店員說「お会計」，是在表達什麼需求？",
          "options": [
            "想結帳",
            "想加點餐點",
            "想找廁所"
          ],
          "answer": 0,
          "explanation": "「お会計」是結帳。可以說「お会計、お願いします」。",
          "id": "t-pay/question/bill-meaning"
        },
        {
          "prompt": "在「お会計、お願いします」中，「お願いします」有什麼作用？",
          "options": [
            "告訴店員要一份",
            "讓請求更有禮貌",
            "詢問廁所的位置"
          ],
          "answer": 1,
          "explanation": "需求是「お会計」，「お願いします」則是「麻煩你／請幫我」。",
          "id": "t-pay/question/request-politeness"
        }
      ]
    },
    {
      "id": "t-charge",
      "type": "grammar",
      "group": "travel",
      "title": "交通卡加值",
      "subtitle": "チャージ・1000円",
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
          "id": "t-charge/card/top-up"
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
          "id": "t-charge/card/amount"
        }
      ],
      "questions": [
        {
          "prompt": "在支援加值的超商櫃檯，出示交通卡說「チャージ」，是什麼意思？",
          "options": [
            "替手機充電",
            "買一張車票",
            "替交通卡加值"
          ],
          "answer": 2,
          "explanation": "在交通卡的情境裡，「チャージ」是加值；還要告訴店員金額。",
          "id": "t-charge/question/top-up-meaning"
        },
        {
          "prompt": "店員已知道你要加值。你說「1000円」，是在告訴他什麼？",
          "options": [
            "加值一千日圓",
            "要一千張卡",
            "問車站的位置"
          ],
          "answer": 0,
          "explanation": "「1000円」讀 sen en，是一千日圓。這裡用來說明加值金額。",
          "id": "t-charge/question/amount-meaning"
        }
      ]
    }
  ];
  const phrasebook = [
    {
      "id": "basics",
      "title": "找人幫忙、聽不懂時",
      "subtitle": "叫店員・再說一次・慢一點",
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
      "type": "grammar",
      "group": "travel",
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
            "body": "已經選好威士忌或燒酎等酒款，店員問喝法時，可以這樣回答。「ロック」是酒加冰塊；「ソーダ割り」是酒加蘇打水。",
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
      ],
      "questions": [
        {
          "prompt": "你指著菜單上一道餐點說「これ」，是什麼意思？",
          "options": [
            "一份",
            "這個",
            "結帳"
          ],
          "answer": 1,
          "explanation": "「これ」是「這個」。指著品項，店員才知道你要的是哪一個。",
          "id": "t-order/question/item-reference"
        },
        {
          "prompt": "你指著菜單上的一道餐點，想要兩份，要說哪個？",
          "options": [
            "ひとつ",
            "みっつ",
            "ふたつ"
          ],
          "answer": 2,
          "explanation": "「ふたつ」是兩個或兩份。指著品項說「これ、ふたつ」，就是「這個，兩份」。",
          "id": "t-order/question/two-portions"
        }
      ]
    },
    {
      "id": "dining",
      "title": "內用外帶、用餐需求",
      "subtitle": "內用・外帶・水・不需要",
      "steps": [
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
          "body": "店員問要不要袋子、收據等物品時，可以用這句回答。「大丈夫です」（daijoubu desu）也可能表示婉拒，但依情境也能表示「沒問題」；要清楚表達不需要，可用「いりません」。",
          "example": "袋はいりません。",
          "reading": "fukuro wa irimasen",
          "meaning": "我不需要袋子。",
          "id": "phrase/dining/decline"
        }
      ]
    },
    {
      "id": "t-pay",
      "type": "grammar",
      "group": "travel",
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
      ],
      "questions": [
        {
          "prompt": "吃完飯對店員說「お会計」，是在表達什麼需求？",
          "options": [
            "想結帳",
            "想加點餐點",
            "想找廁所"
          ],
          "answer": 0,
          "explanation": "「お会計」是結帳。可以說「お会計、お願いします」。",
          "id": "t-pay/question/bill-meaning"
        },
        {
          "prompt": "在「お会計、お願いします」中，「お願いします」有什麼作用？",
          "options": [
            "告訴店員要一份",
            "讓請求更有禮貌",
            "詢問廁所的位置"
          ],
          "answer": 1,
          "explanation": "需求是「お会計」，「お願いします」則是「麻煩你／請幫我」。",
          "id": "t-pay/question/request-politeness"
        }
      ]
    },
    {
      "id": "shopping",
      "title": "買東西",
      "subtitle": "價格・袋子・收據・試穿",
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
          "body": "結帳時，可以用這個詞索取一般購物收據。",
          "example": "レシートをお願いします。",
          "reading": "reshiito o onegaishimasu",
          "meaning": "麻煩給我收據。",
          "id": "phrase/shopping/receipt"
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
          "body": "拿著想試的衣服問店員。說「試着、いいですか？」就能表達想試穿。",
          "example": "試着してもいいですか？",
          "reading": "shichaku shite mo ii desu ka",
          "meaning": "可以試穿嗎？",
          "id": "phrase/shopping/try-on"
        }
      ]
    },
    {
      "id": "t-place",
      "type": "grammar",
      "group": "travel",
      "title": "找廁所、問位置",
      "subtitle": "廁所・車站・出口・電梯",
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
        }
      ],
      "questions": [
        {
          "prompt": "你想找廁所，先對店員說哪個關鍵字？",
          "options": [
            "トイレ",
            "駅",
            "どこ"
          ],
          "answer": 0,
          "explanation": "「トイレ」是廁所。「すみません」可先引起店員注意，「どこ」則是問哪裡。",
          "id": "t-place/question/toilet-keyword"
        },
        {
          "prompt": "「駅、どこですか？」中的「どこ」，是在問什麼？",
          "options": [
            "要一個",
            "在哪裡",
            "要結帳"
          ],
          "answer": 1,
          "explanation": "「どこ」是「哪裡」。把地點名稱放在前面，就能表達你想找哪個地方。",
          "id": "t-place/question/where-meaning"
        }
      ]
    },
    {
      "id": "t-charge",
      "type": "grammar",
      "group": "travel",
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
      ],
      "questions": [
        {
          "prompt": "在支援加值的超商櫃檯，出示交通卡說「チャージ」，是什麼意思？",
          "options": [
            "替手機充電",
            "買一張車票",
            "替交通卡加值"
          ],
          "answer": 2,
          "explanation": "在交通卡的情境裡，「チャージ」是加值；還要告訴店員金額。",
          "id": "t-charge/question/top-up-meaning"
        },
        {
          "prompt": "店員已知道你要加值。你說「1000円」，是在告訴他什麼？",
          "options": [
            "加值一千日圓",
            "要一千張卡",
            "問車站的位置"
          ],
          "answer": 0,
          "explanation": "「1000円」讀 sen en，是一千日圓。這裡用來說明加值金額。",
          "id": "t-charge/question/amount-meaning"
        }
      ]
    },
    {
      "id": "hotel",
      "title": "飯店與預約",
      "subtitle": "入住・已預約・寄放行李",
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
          "body": "在飯店或餐廳，說完已有預約，再告訴對方名字或出示訂單。",
          "example": "予約しています。",
          "reading": "yoyaku shite imasu",
          "meaning": "我有預約。",
          "id": "phrase/hotel/reservation"
        },
        {
          "title": "想寄放行李",
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
          "body": "指著行李說「荷物、預けたいです」，表達想寄放。單說「荷物」還沒有說明你需要什麼協助。",
          "example": "荷物を預けてもいいですか？",
          "reading": "nimotsu o azukete mo ii desu ka",
          "meaning": "可以寄放行李嗎？",
          "id": "phrase/hotel/luggage"
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
    for (const course of [...source.grammar, ...source.travel]) registry[course.id] = course;
    for (const script of ['h', 'k']) {
      for (const [key, row, hiragana, katakana, readings] of source.rows) {
        const id = `${script}-${key}`;
        const letters = [...(script === 'h' ? hiragana : katakana)];
        const cards = letters.map((character, i) => ({
          id: `${id}/card/u${character.codePointAt(0).toString(16)}`,
          character, reading: readings[i], spoken: [...hiragana][i],
        }));
        registry[id] = {
          id, type: 'kana', script, row,
          title: `${script === 'h' ? '平假名' : '片假名'}・${row}`,
          letters, spoken: [...hiragana], readings,
          cards,
          questions: cards.map((card, i) => ({
            id: `${id}/question/u${card.character.codePointAt(0).toString(16)}`,
            character: card.character, reading: card.reading,
            options: [...readings], answer: i,
          })),
        };
      }
    }
    return registry;
  }
  const data = { rows, grammar, travel, phrasebook, intro };
  const courses = buildCourses(data);
  const getCourse = id => Object.hasOwn(courses, id) ? courses[id] : null;
  const courseRevision = id => id === 'intro' ? revisionOf({ id: 'intro', ...intro }) : revisionOf(getCourse(id));

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
    ];
    const sourceRows = list(candidate.rows, 'rows');
    if (sourceRows.length !== expected.length) fail('rows', 'kana coverage requires ten rows per script');
    const rowIds = new Set();
    sourceRows.forEach((row, i) => {
      if (!Array.isArray(row) || row.length !== 5) { fail(`rows[${i}]`, 'invalid kana row tuple'); return; }
      identifier(row[0], `rows[${i}].id`, rowIds, 'row');
      text(row[1], `rows[${i}].label`, 'ja');
      const reference = expected.find(item => item[0] === row[0]);
      if (!reference) { fail(`rows[${i}]`, 'unknown kana row'); return; }
      if (row[2] !== reference[1] || row[3] !== reference[2]) fail(`rows[${i}]`, 'kana coverage/order must match the basic chart');
      if (!Array.isArray(row[4]) || row[4].join(' ') !== reference[3]) fail(`rows[${i}].readings`, 'kana readings must match the basic chart');
    });
    // Generated kana IDs occupy the same registry as authored courses.
    const courseIds = new Set(expected.flatMap(([key]) => [`h-${key}`, `k-${key}`]));
    const cardIds = new Set(), questionIds = new Set();
    for (const group of ['grammar', 'travel']) {
      list(candidate[group], group).forEach((course, i) => {
        const path = `${group}[${i}]`;
        if (!record(course)) { fail(path, 'invalid course object'); return; }
        identifier(course.id, `${path}.id`, courseIds, 'course');
        if (course.type !== 'grammar') fail(`${path}.type`, 'course type must be grammar');
        if (group === 'travel' && course.group !== 'travel') fail(`${path}.group`, 'travel group is required');
        text(course.title, `${path}.title`, 'zh'); text(course.subtitle, `${path}.subtitle`);
        list(course.steps, `${path}.steps`).forEach((step, j) => card(step, `${path}.steps[${j}]`, cardIds));
        list(course.questions, `${path}.questions`).forEach((q, j) => question(q, `${path}.questions[${j}]`, questionIds));
      });
    }
    const categoryIds = new Set(), phraseIds = new Set();
    list(candidate.phrasebook, 'phrasebook').forEach((category, i) => {
      const path = `phrasebook[${i}]`;
      if (!record(category)) { fail(path, 'invalid phrasebook category'); return; }
      identifier(category.id, `${path}.id`, categoryIds, 'category');
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
  return Object.freeze({ rows, grammar, travel, phrasebook, intro, courses, getCourse, courseRevision, revisionOf, legacyCourseRevision, validate });
})();
