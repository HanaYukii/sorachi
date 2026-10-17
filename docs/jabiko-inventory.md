# Jabiko 題目盤點（#39、#89）

目前基準：2026-10-17，SoraChi 48 堂句型、150 題課內題，加上 50 題獨立刷題題目，共 200 題。下方 #39 的 35 課盤點保留作歷史紀錄；最新判斷以本文件末尾 #89 為準。

- 來源：Jabiko（唯讀參考）`src/domain/exam/items/n5.ts`，commit `31c96ab`（2026-10-11）。
- 授權：Jabiko repo 沒有授權檔。它的文件說明這些題目是自撰的，參考公開資料只取題型與範圍，沒有複製題幹。使用者在 2026-10-16 允許移植最基礎的題目。所以只搬自撰題，並在 `content.js` 的 `lessonPlan.<課>.sources` 記錄原題 ID。
- 判斷依據：SoraChi 目前教過的內容（五十音、35 課句型）；「先教再考」；題目答案唯一、干擾項合理。

## 分類

| 類別 | 題數 | 結論 |
| --- | --- | --- |
| 文法 `n5-grammar-*` | 37 | 3 題直接沿用；其餘多半是題幹有漢字或還沒教的詞，或 SoraChi 已有同考點題目（見下表） |
| 詞彙 `n5-vocab-*` | 46 | 暫不引入：動詞與形容詞課上線後逐題看過，題幹都有還沒教的詞或漢字（例如 のどが かわいたので、せんせい、毎晩），選項也多半是還沒教的詞 |
| 用法 `n5-usage-*` | 21 | 暫不引入：四個完整句子比較用法，需要動詞、形容詞與連接 |
| 文脈 `n5-context-*` | 17 | 暫不引入：接續詞（そして、でも…）等 #67 |
| 語順 `n5-order-*` | 14 | 暫不引入：需要動詞句 |
| 漢字 `n5-kanji-*` | 59 | 暫不引入：SoraChi 還沒教漢字 |
| 同義 `n5-syn-*` | 20 | 暫不引入：需要較多詞彙 |

## 文法題逐題

| 原題 ID | 考點 | 結論 | SoraChi 位置 |
| --- | --- | --- | --- |
| `n5-grammar-no` | の（所屬） | 直接沿用：題幹、選項保留，加一行作答指示；解說改成本站用語 | `g-no/question/jabiko-no` |
| `n5-grammar-doko` | どこ | 直接沿用：題幹、選項保留，加一行作答指示；解說改成本站用語，並補「何 在 です 前念 なん」 | `g-who/question/jabiko-doko` |
| `n5-grammar-ha-watashi-gakusei` | は | 已有同考點題（わたし＿＿がくせいです），不重複 | `g-identity` |
| `n5-grammar-ka` | か | 已有同考點題（〜ですか），不重複 | `g-question` |
| `n5-grammar-ga-neko-iru` | が（存在） | 直接沿用：題幹、選項保留，加一行作答指示；解說改成本站用語 | `g-arimasu/question/jabiko-ga` |
| `n5-grammar-mo-watashi-iku` | も | 先不沿用：題幹有漢字（田中、行きます），已有同考點題 | `g-mo` |
| `n5-grammar-to-tomodachi-au` | と（一起做） | 等先備：「和誰一起做」的 と 還沒教，あいます 也還沒教 | — |
| `n5-grammar-wo-pan` | を | 先不沿用：題幹有漢字（毎朝、食べます），已有同考點題 | `g-verbs` |
| `n5-grammar-de-toshokan` | で（動作地點） | 先不沿用：題幹的 図書館、本、読みます 還沒教，已有同考點題 | `g-ni-de` |
| `n5-grammar-e-kyouto-iku` | へ | 先不沿用：題幹有漢字，選項的 が 下一課才教，已有同考點題 | `g-ni-de` |
| `n5-grammar-ni-shichiji-okiru` | に（時間） | 等先備：時間點的 に 還沒教 | — |
| `n5-grammar-made-kuji-hataraku` | まで（時間） | 先不沿用：題幹的 けさ、はたらきました 還沒教，已有同考點題 | `g-kara-made-time` |
| `n5-grammar-kara-atama-itai` | から（原因） | 先不沿用：題幹的 あたま、いたい 還沒教，已有同考點題 | `g-kara-reason` |
| `n5-grammar-dare-party-kuru` | だれ | 等先備：題幹用過去式「来ましたか」 | #63 之後 |
| `n5-grammar-tekudasai-iu` | てください | 先不沿用：題幹的 もう一度、言います 還沒教，已有同考點題 | `g-te-kudasai` |
| `n5-grammar-tekara-te-arau-taberu` | てから | 先不沿用：題幹的 手、あらいます 還沒教，已有同考點題 | `g-te-sequence` |
| `n5-grammar-na` | な形容詞＋名詞 | 先不沿用：題幹的 とても、こうえん 還沒教，已有同考點題 | `g-adj-na` |
| `n5-grammar-kute` | 〜くて | 等先備：形容詞的て形還沒教 | — |
| 其餘文法題 | ています、たい、ませんか、より、だけ、ね、よ、ましょう、ながら 等 | 等對應的課（還沒排） | — |


## #89：48 課重新盤點與第一批獨立刷題

來源 Jabiko `57524190e53d947cc0be8813af4d8cef60201f00`；只讀 `src/domain/exam/items/n5.ts`、`n4.ts` 與現有 SoraChi lessonPlan。這次不再直接複製整題：沿用考點，移除陌生詞，或改成判讀句子作用。既有三題直接移植留在課內，本批不更動。以下逐課列出現有題目及加題，48 課均已對照；未加題不是課程未完成。

| 課程 | 現有題數 | 本批加題 |
| --- | ---: | --- |
| g-identity：名詞句：〜は〜です | 2 | 保留原題；本批不重複增加 |
| g-question：疑問句：〜ですか | 2 | student-answer |
| g-demo：指示詞：これ・それ・あれ | 3 | 保留原題；本批不重複增加 |
| g-place：地點：ここ・そこ・あそこ・どこ | 3 | 保留原題；本批不重複增加 |
| g-kono：指示詞：この・その・あの・どの | 3 | 保留原題；本批不重複增加 |
| g-kochira：方向與客氣說法：こちら・どちら | 3 | 保留原題；本批不重複增加 |
| g-who：疑問詞：だれ・なに・どこ | 3 | ask-name-object |
| g-negative：名詞句否定：〜じゃないです | 3 | 保留原題；本批不重複增加 |
| g-no：名詞連接：AのB | 3 | owner-direction |
| g-nouns：常用名詞：ともだち・きっぷ・ホテル | 3 | buy-ticket |
| g-mo：也：〜も | 3 | also-going |
| g-kochira-2：こちら：介紹人、自己這一方 | 3 | 保留原題；本批不重複增加 |
| g-to：和：AとB | 3 | 保留原題；本批不重複增加 |
| g-kara-made：從哪裡到哪裡：から・まで | 3 | 保留原題；本批不重複增加 |
| g-days：時間詞：きのう・きょう・あした | 4 | 保留原題；本批不重複增加 |
| g-day-parts：時間詞：あさ・ひる・よる | 3 | 保留原題；本批不重複增加 |
| g-weekdays：星期：げつようび～にちようび | 3 | 保留原題；本批不重複增加 |
| g-numbers：數字：0～10 | 3 | 保留原題；本批不重複增加 |
| g-prices：數字：十、百、千與價錢 | 4 | price-reading |
| g-counting：數東西：ひとつ～いつつ | 3 | two-things-not-people |
| g-people：人數：ひとり・ふたり・〜にん | 3 | people-question-answer |
| g-clock：幾點：〜じ・〜はん | 4 | 保留原題；本批不重複增加 |
| g-minutes：幾分：〜ふん・〜ぷん | 4 | 保留原題；本批不重複增加 |
| g-kara-made-time：幾點到幾點：〜から〜まで | 3 | hours-range |
| g-dates：日期（一）：〜がつ・〜にち | 4 | 保留原題；本批不重複增加 |
| g-dates-2：日期（二）：ついたち～いつか | 4 | 保留原題；本批不重複增加 |
| g-dates-3：日期（三）：むいか～とおか・はつか | 4 | 保留原題；本批不重複增加 |
| g-verbs：動作句：〜を 〜ます | 3 | bread-action、drink-action |
| g-masen：動作句否定：〜ません | 3 | 保留原題；本批不重複增加 |
| g-mashita：過去：〜ました・〜ませんでした | 3 | past-or-now |
| g-ni-de：去哪裡、在哪裡做：に・へ・で | 3 | 保留原題；本批不重複增加 |
| g-transport：交通工具：〜で いきます | 3 | location-versus-transport |
| g-arimasu：有、在：あります・います | 4 | 保留原題；本批不重複增加 |
| g-position：位置：うえ・まえ・となり | 3 | 保留原題；本批不重複增加 |
| g-adj-i：形容詞（一）：おおきい・たかい | 3 | bigger-bag |
| g-adj-neg：形容詞（二）：〜くないです、冷和暖 | 3 | negative-price |
| g-adj-na：形容詞（三）：しずか・べんり・きれい | 3 | 保留原題；本批不重複增加 |
| g-who-2：疑問詞（二）：どう與問法整理 | 3 | 保留原題；本批不重複增加 |
| g-soshite-demo：連接句子：そして・でも | 3 | 保留原題；本批不重複增加 |
| g-kara-reason：原因：〜から | 3 | 保留原題；本批不重複增加 |
| g-dakara：原因（二）：だから・〜ので | 3 | 保留原題；本批不重複增加 |
| g-kedo：連接句子（二）：〜けど | 3 | 保留原題；本批不重複增加 |
| g-verb-forms：動詞原形與三類：のむ・たべる・する | 3 | 保留原題；本批不重複增加 |
| g-te-forms：て形（一）：動詞怎麼變 | 3 | 保留原題；本批不重複增加 |
| g-te-kudasai：て形（二）：〜てください | 3 | permission-not-request |
| g-te-sequence：て形（三）：先做…再…、〜てから | 3 | sequence-before-coffee |
| g-te-iru：て形（四）：〜ています | 3 | doing-now |
| g-te-mo-ii：て形（五）：〜てもいいですか | 3 | 保留原題；本批不重複增加 |

### 18 題逐題驗收與來源

逐題人工檢查：正確選項符合題幹唯一語境，干擾項可用中文白話說明差別；日文已補假名及羅馬音。全部只用本站已教過的詞與用法，混合刷題可跨課，不表示單一前期課已教完所有干擾選項。每題記錄相關課與來源；不改課後題目、courseRevision 或歷史分數。

| ID（drill/basic/） | 來源／決定 | 檢查重點 |
| --- | --- | --- |
| student-answer | 本站自撰 | 對方問你是不是學生，你確實是學生。哪個回答符合？ |
| ask-name-object | 本站自撰 | 朋友拿著一樣你不認識的東西。想問「那是什麼？」，選哪一句？ |
| owner-direction | 本站自撰 | 「先生（せんせい）の かばん」指的是什麼？ |
| also-going | n5-grammar-mo-watashi-iku：改寫 | 田中先生要去，你也要去。「我也要去」怎麼說？ |
| buy-ticket | 本站自撰 | 想說「我要買車票」，要選哪一句？ |
| bread-action | n5-grammar-wo-pan：改寫 | 「パンを 食（た）べます。」哪個詞表示吃的東西？ |
| drink-action | n5-vocab-nomimasu-mizu：改寫 | 想表達「喝水」，選哪個動作？水（みず）を＿＿。 |
| past-or-now | 本站自撰 | 想說「昨天買了車票」，哪一句符合？ |
| location-versus-transport | 本站自撰 | 「バスで 京都（きょうと）に 行（い）きます。」哪個詞說明搭什麼交通工具？ |
| hours-range | n5-grammar-made-kuji-hataraku：改寫 | 「九時（くじ）から 一時（いちじ）まで」裡，哪個詞標出結束時間？ |
| two-things-not-people | 本站自撰 | 買兩個麵包，想先說「兩個」，要用哪一個？ |
| people-question-answer | 本站自撰 | 店員問「何人（なんにん）ですか」。你一個人，怎麼回答？ |
| price-reading | 本站自撰 | 價錢寫「600円」。哪個讀法正確？ |
| bigger-bag | n5-vocab-ookii-kaban：改寫 | 包包太小，你想要大的包包。要選哪一個？ |
| negative-price | 本站自撰 | 「この パンは 高（たか）くないです。」意思是？ |
| doing-now | n5-grammar-teimasu-shinbun：改寫 | 朋友正在喝咖啡，你要描述他眼前的動作，選哪一句？ |
| permission-not-request | 本站自撰 | 店員說「ここで 待（ま）ってください」。他是在表達什麼？ |
| sequence-before-coffee | 本站自撰 | 「コーヒーを 飲（の）んでから、パンを 食（た）べます。」哪件事在後面做？ |

### 改寫與暫緩的理由

- `n5-grammar-mo-watashi-iku`：改成中文情境選整句；行く／ません 已教，檢查「也去」與「也不去」。
- `n5-grammar-wo-pan`：移除「毎朝」，改問句中吃的東西，避免又一題填 を。
- `n5-vocab-nomimasu-mizu`：移除「のどがかわいたので」，用中文指定「喝水」；不讓陌生情境句成為解題門檻。
- `n5-grammar-made-kuji-hataraku`：去掉未教的「けさ／はたらきました」，改辨識時間範圍哪個詞標出終點。
- `n5-vocab-ookii-kaban`：去掉「たくさん入るので／とても」，用中文說明要大包包，選項只用已教的大、小、便宜。
- `n5-grammar-teimasu-shinbun`：原題 父／新聞／読む 未教，改成喝咖啡的整句與過去、許可句比較。並非直接照抄原題不自然的干擾片段。
- `n5-grammar-de-toshokan`、`n5-grammar-tekudasai-iu`、`n5-grammar-tekara-te-arau-taberu`：圖書館／読む、言う、洗う尚未在本站教；現有題已涵蓋相應形式，本批不硬搬。
- `n5-grammar-ni-shichiji-okiru`、`n5-grammar-to-tomodachi-au`：時間點的 に、會面對象的 と 及動詞未教；與動作地點 に／名詞並列 と 不同，暫緩。
- N5 的 たい、ませんか、より、だけ、ね、よ、ましょう、ながら：先補課再出題，本批暫緩。
- N4 抽選基礎候選如 たことがある、たほうがいい、なければならない、ながら、のに、たら；本站尚未教完整形式與所需詞彙，暫緩，不因標 N4 就先搬。未逐題審完 Jabiko 全部 N4 題庫。
- 漢字讀音題不直接移植：本站重點先辨識詞義與基本句子；以漢字附假名呈現新題，不把未教漢字當門檻。
- #41 詞彙小課保留自身驗收範圍；本批只新增已教考點的刷題題目。


## 第二批：200 題目標

使用者在第一批上線後要求補到 200 題。本批新增 32 題，均為本站自撰，來源批次 `2026-10-17-200`；沒有再直接移植 Jabiko 題幹。先核對既有 48 課的 lessonPlan 和 168 題，優先補尚未練到的基本讀音或不同問法。逐題核對語意、唯一正解、日文讀音與中文解釋；不加入尚未教的文法。

| ID（drill/basic/） | 關聯課 | 本題考點／情境 |
| --- | --- | --- |
| sore-listener-view | g-demo | 朋友站在離你幾步外，指著你手上的麵包說「それ」。他指的是哪一個？ |
| kono-before-noun | g-kono | 你拿著一本書，想說「這本書」。哪個說法可以直接放在「本」前面？ |
| dare-answer-person | g-who | 朋友問「あの 人（ひと）は 誰（だれ）ですか」。哪個回答是在說那個人是誰？ |
| two-negative-forms | g-negative | 哪一句和「学生（がくせい）じゃありません」意思相同？ |
| to-lists-two-items | g-to | 想把麵包和水列在一起，哪個說法表示「麵包和水」？ |
| ima-now | g-days | 「今（いま）」指的是什麼時候？ |
| weekday-answer | g-weekdays | 對方問「何曜日（なんようび）ですか」。哪個回答是在說星期幾？ |
| zero-reading | g-numbers | 「ゼロ」是哪個數字？ |
| thousand-yen | g-prices | 「千円（せんえん）」是多少日圓？ |
| three-things | g-counting | 買三個麵包，先說「三個」要用哪個詞？ |
| seven-thirty | g-clock | 「七時半（しちじはん）」是幾點？ |
| one-minute | g-minutes | 「1 分」的讀音是哪一個？ |
| september-reading | g-dates | 「9 月」的讀音是哪一個？ |
| fourth-date | g-dates-2 | 每月的「4 日」怎麼念？ |
| june-sixth | g-dates-3 | 「6 月 6 日」怎麼念？ |
| decline-drink | g-masen | 朋友問你要不要喝咖啡。你想說「我不喝」，選哪一句？ |
| past-negative-meaning | g-mashita | 「昨日（きのう）、行（い）きませんでした。」是什麼意思？ |
| ni-and-de-two-roles | g-ni-de | 想說「去車站，在車站買車票」。兩個空格依序放什麼？駅（えき）＿＿行（い）きます。駅（えき）＿＿切符（きっぷ）を 買（か）います。 |
| imasu-living-thing | g-arimasu | 想說「車站有一隻貓」。空格放哪一個？駅（えき）に＿＿が います。 |
| under-the-desk | g-position | 「机（つくえ）の 下（した）」是哪個位置？ |
| not-big | g-adj-neg | 「この 部屋（へや）は 大（おお）きくないです。」是什麼意思？ |
| na-sentence-ending | g-adj-na | 想說「這個房間很安靜」，句尾哪個說法正確？この 部屋（へや）は＿＿。 |
| how-to-get-there | g-who-2 | 朋友回答「バスで 行（い）きます」。你剛才是在問「怎麼去」，哪句合適？ |
| soshite-two-good-points | g-soshite-demo | 談到一個麵包，朋友說「安（やす）いです。そして、おいしいです」。他覺得怎麼樣？ |
| reason-before-kara | g-kara-reason | 「寒（さむ）いですから、うちに います。」待在家的原因是什麼？ |
| node-because | g-dakara | 「寒（さむ）いですので、うちに います。」裡的「ので」連接了哪種關係？ |
| kedo-small-convenient | g-kedo | 「この 部屋（へや）は 小（ちい）さいですけど、便利（べんり）です。」意思是？ |
| kuru-dictionary-form | g-verb-forms | 「来（き）ます」（來）的原形是哪一個？ |
| kite-te-form | g-te-forms | 「来（き）ます」（來）的て形是哪一個？ |
| kudasai-request-marker | g-te-kudasai | 「ちょっと 待（ま）ってください。」哪個部分讓這句變成「請你等一下」的請求？ |
| ongoing-versus-future | g-te-iru | 想明確說「現在正在等」，空格放哪一個？今（いま）、待（ま）って＿＿。 |
| permission-positive-reply | g-te-mo-ii | 你問可不可以吃這個，對方回答「はい、どうぞ」。意思最接近哪一個？ |
