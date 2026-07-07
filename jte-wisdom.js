/* =====================================================================
   jte-wisdom.js — 練息場 · 東西方智慧語錄庫
   每一則：
     o     : 'east' | 'west'（東方 / 西方）
     x     : 中文（原典為主）
     x_en  : 英文
     x_ja  : 日文
     by    : 出處（中文），by_en / by_ja 對應語言
     act   : 對應行動 → 首頁輪播會轉成 CTA
             breathe(呼吸練習) observe(呼吸覺察) write(換位書寫)
             ask(問易) measure(HRV)
   新增語錄：直接往 JTE_WISDOM 陣列加一筆即可，其他不用改。

   window.jteWisdomPickIndex()
     回傳「這一次造訪」該顯示的語錄索引。
     用 localStorage 記住一份洗牌後的順序與進度：
     每次進站往前走一格 → 48 句輪完才會重複，輪完自動重新洗牌。
   ===================================================================== */
(function () {
  if (window.JTE_WISDOM) return;

  window.JTE_WISDOM = [
    /* ================= 東方智慧 ================= */
    {o:'east', by:'老子《道德經》', by_en:'Laozi, Tao Te Ching', by_ja:'老子『道徳経』', act:'ask',
     x:'知人者智，自知者明。',
     x_en:'Knowing others is intelligence; knowing yourself is true wisdom.',
     x_ja:'人を知る者は智、自らを知る者は明なり。'},
    {o:'east', by:'老子《道德經》', by_en:'Laozi, Tao Te Ching', by_ja:'老子『道徳経』', act:'breathe',
     x:'千里之行，始於足下。',
     x_en:'A journey of a thousand miles begins beneath your feet.',
     x_ja:'千里の行も、足下より始まる。'},
    {o:'east', by:'老子《道德經》', by_en:'Laozi, Tao Te Ching', by_ja:'老子『道徳経』', act:'breathe',
     x:'柔弱勝剛強。',
     x_en:'The soft and gentle overcomes the hard and strong.',
     x_ja:'柔弱は剛強に勝る。'},
    {o:'east', by:'老子《道德經》', by_en:'Laozi, Tao Te Ching', by_ja:'老子『道徳経』', act:'breathe',
     x:'重為輕根，靜為躁君。',
     x_en:'Stillness is the master of restlessness.',
     x_ja:'静けさは、焦りの主である。'},
    {o:'east', by:'孔子《論語》', by_en:'Confucius, The Analects', by_ja:'孔子『論語』', act:'write',
     x:'學而不思則罔，思而不學則殆。',
     x_en:'To learn without thinking is labour lost; to think without learning is perilous.',
     x_ja:'学びて思わざれば則ち罔し、思いて学ばざれば則ち殆し。'},
    {o:'east', by:'孔子《論語》', by_en:'Confucius, The Analects', by_ja:'孔子『論語』', act:'breathe',
     x:'知之者不如好之者，好之者不如樂之者。',
     x_en:'Knowing it is not as good as loving it; loving it is not as good as delighting in it.',
     x_ja:'これを知る者はこれを好む者に如かず、これを好む者はこれを楽しむ者に如かず。'},
    {o:'east', by:'孔子《論語》', by_en:'Confucius, The Analects', by_ja:'孔子『論語』', act:'write',
     x:'過而不改，是謂過矣。',
     x_en:'To make a mistake and not correct it — that is the real mistake.',
     x_ja:'過ちて改めざる、これを過ちという。'},
    {o:'east', by:'曾子《論語》', by_en:'Zengzi, The Analects', by_ja:'曾子『論語』', act:'write',
     x:'吾日三省吾身。',
     x_en:'Each day, I examine myself.',
     x_ja:'吾、日に三たび吾が身を省みる。'},
    {o:'east', by:'莊子', by_en:'Zhuangzi', by_ja:'荘子', act:'observe',
     x:'至人之用心若鏡，不將不迎，應而不藏。',
     x_en:'The sage’s mind is like a mirror: it neither chases nor clings — it reflects, and lets go.',
     x_ja:'至人の心は鏡のよう。追わず、迎えず、映して、留めない。'},
    {o:'east', by:'莊子', by_en:'Zhuangzi', by_ja:'荘子', act:'breathe',
     x:'虛室生白。',
     x_en:'An empty room fills with light.',
     x_ja:'空の部屋にこそ、光は満ちる。'},
    {o:'east', by:'孟子', by_en:'Mencius', by_ja:'孟子', act:'ask',
     x:'學問之道無他，求其放心而已矣。',
     x_en:'The way of learning is nothing else: it is to seek the heart we have let wander.',
     x_ja:'学問の道はほかでもない。放たれた心を求め戻すだけである。'},
    {o:'east', by:'佛陀《法句經》', by_en:'The Buddha, Dhammapada', by_ja:'ブッダ『法句経』', act:'observe',
     x:'心，是一切的先導。',
     x_en:'Mind precedes all things; mind is their chief.',
     x_ja:'心はすべてのものに先立ち、すべては心によってつくられる。'},
    {o:'east', by:'佛陀《法句經》', by_en:'The Buddha, Dhammapada', by_ja:'ブッダ『法句経』', act:'ask',
     x:'戰勝千軍萬馬，不如戰勝自己。',
     x_en:'Better than conquering a thousand battles is conquering yourself.',
     x_ja:'千の戦いに勝つより、自分に勝つ者こそ尊い。'},
    {o:'east', by:'六祖惠能《壇經》', by_en:'Huineng, Platform Sutra', by_ja:'六祖慧能『壇経』', act:'observe',
     x:'不是風動，不是幡動，仁者心動。',
     x_en:'Not the wind, not the flag — it is the mind that moves.',
     x_ja:'風が動くのでも、幡が動くのでもない。心が動くのだ。'},
    {o:'east', by:'趙州禪師', by_en:'Zen Master Zhaozhou', by_ja:'趙州禅師', act:'breathe',
     x:'平常心是道。',
     x_en:'Ordinary mind is the Way.',
     x_ja:'平常心これ道。'},
    {o:'east', by:'雲門禪師', by_en:'Zen Master Yunmen', by_ja:'雲門禅師', act:'breathe',
     x:'日日是好日。',
     x_en:'Every day is a good day.',
     x_ja:'日々是好日。'},
    {o:'east', by:'王陽明', by_en:'Wang Yangming', by_ja:'王陽明', act:'breathe',
     x:'知是行之始，行是知之成。',
     x_en:'Knowing is the beginning of doing; doing is the completion of knowing.',
     x_ja:'知は行の始まり、行は知の完成である。'},
    {o:'east', by:'王陽明', by_en:'Wang Yangming', by_ja:'王陽明', act:'write',
     x:'人須在事上磨，方立得住。',
     x_en:'We are polished by the affairs of life — that is how we learn to stand firm.',
     x_ja:'人は物事の中で磨かれてこそ、揺るがず立てる。'},
    {o:'east', by:'《菜根譚》', by_en:'Caigentan (Vegetable Root Discourse)', by_ja:'『菜根譚』', act:'observe',
     x:'風來疏竹，風過而竹不留聲。',
     x_en:'Wind sweeps through the bamboo; once it has passed, the bamboo holds no sound.',
     x_ja:'風が竹林を吹き抜けても、風が去れば竹は音を留めない。'},
    {o:'east', by:'《周易》', by_en:'I Ching (Book of Changes)', by_ja:'『易経』', act:'ask',
     x:'天行健，君子以自強不息。',
     x_en:'As heaven moves with unceasing vigor, the noble person keeps renewing their strength.',
     x_ja:'天の運行は健やかである。君子はそれに倣い、自ら強めて息まない。'},
    {o:'east', by:'蘇軾《定風波》', by_en:'Su Shi, Calming the Waves', by_ja:'蘇軾『定風波』', act:'write',
     x:'回首向來蕭瑟處，歸去，也無風雨也無晴。',
     x_en:'Looking back on the storm-swept road — heading home, there is neither rain nor shine.',
     x_ja:'来た道を振り返れば、帰り道には雨も風も、晴れさえもない。'},
    {o:'east', by:'陶淵明《飲酒》', by_en:'Tao Yuanming, Drinking Wine', by_ja:'陶淵明『飲酒』', act:'breathe',
     x:'問君何能爾？心遠地自偏。',
     x_en:'How can this be? When the heart is far away, the place grows quiet of itself.',
     x_ja:'なぜそれができるのか。心が遠ければ、住む場所もおのずと静かになる。'},
    {o:'east', by:'《大學》', by_en:'The Great Learning', by_ja:'『大学』', act:'breathe',
     x:'知止而后有定，定而后能靜，靜而后能安。',
     x_en:'Knowing where to stop brings steadiness; steadiness brings calm; calm brings peace.',
     x_ja:'止まるところを知って初めて定まり、定まって初めて静かになり、静かになって初めて安らぐ。'},
    {o:'east', by:'日本諺語', by_en:'Japanese proverb', by_ja:'日本のことわざ', act:'breathe',
     x:'跌倒七次，爬起來八次。',
     x_en:'Fall down seven times, get up eight.',
     x_ja:'七転び八起き。'},

    /* ================= 西方智慧 ================= */
    {o:'west', by:'蘇格拉底', by_en:'Socrates', by_ja:'ソクラテス', act:'write',
     x:'未經省察的人生，不值得活。',
     x_en:'The unexamined life is not worth living.',
     x_ja:'吟味されざる人生は、生きるに値しない。'},
    {o:'west', by:'德爾菲神諭', by_en:'Oracle of Delphi', by_ja:'デルポイの神託', act:'ask',
     x:'認識你自己。',
     x_en:'Know thyself.',
     x_ja:'汝自身を知れ。'},
    {o:'west', by:'赫拉克利特', by_en:'Heraclitus', by_ja:'ヘラクレイトス', act:'observe',
     x:'人不能兩次踏進同一條河。',
     x_en:'No one steps into the same river twice.',
     x_ja:'人は同じ川に二度入ることはできない。'},
    {o:'west', by:'柏拉圖', by_en:'Plato', by_ja:'プラトン', act:'ask',
     x:'最初也最偉大的勝利，是戰勝自己。',
     x_en:'The first and greatest victory is to conquer yourself.',
     x_ja:'最初にして最大の勝利は、自分自身に打ち勝つことである。'},
    {o:'west', by:'亞里斯多德', by_en:'Aristotle', by_ja:'アリストテレス', act:'write',
     x:'幸福，取決於我們自己。',
     x_en:'Happiness depends upon ourselves.',
     x_ja:'幸福は、私たち自身にかかっている。'},
    {o:'west', by:'馬可·奧理略《沉思錄》', by_en:'Marcus Aurelius, Meditations', by_ja:'マルクス・アウレリウス『自省録』', act:'breathe',
     x:'你能掌控的是自己的心，而不是外在的事。明白這一點，力量就來了。',
     x_en:'You have power over your mind — not outside events. Realize this, and you will find strength.',
     x_ja:'支配できるのは自分の心であって、外の出来事ではない。それに気づけば、力が湧いてくる。'},
    {o:'west', by:'馬可·奧理略《沉思錄》', by_en:'Marcus Aurelius, Meditations', by_ja:'マルクス・アウレリウス『自省録』', act:'observe',
     x:'生命的幸福，取決於你念頭的品質。',
     x_en:'The happiness of your life depends upon the quality of your thoughts.',
     x_ja:'人生の幸福は、思考の質によって決まる。'},
    {o:'west', by:'馬可·奧理略《沉思錄》', by_en:'Marcus Aurelius, Meditations', by_ja:'マルクス・アウレリウス『自省録』', act:'breathe',
     x:'把自己安放在當下。',
     x_en:'Confine yourself to the present.',
     x_ja:'自分を「今」にとどめよ。'},
    {o:'west', by:'塞內卡', by_en:'Seneca', by_ja:'セネカ', act:'write',
     x:'我們在想像中受的苦，往往多過現實。',
     x_en:'We suffer more often in imagination than in reality.',
     x_ja:'私たちは現実よりも、想像の中で苦しむことのほうが多い。'},
    {o:'west', by:'塞內卡《論生命之短暫》', by_en:'Seneca, On the Shortness of Life', by_ja:'セネカ『人生の短さについて』', act:'ask',
     x:'不是人生太短，而是我們浪費太多。',
     x_en:'It is not that we have a short time to live, but that we waste much of it.',
     x_ja:'人生が短いのではない。私たちが多くを浪費しているのだ。'},
    {o:'west', by:'愛比克泰德', by_en:'Epictetus', by_ja:'エピクテトス', act:'breathe',
     x:'重要的不是發生了什麼，而是你如何回應。',
     x_en:'It is not what happens to you, but how you respond, that matters.',
     x_ja:'大切なのは何が起きたかではなく、どう応じるかである。'},
    {o:'west', by:'愛比克泰德', by_en:'Epictetus', by_ja:'エピクテトス', act:'ask',
     x:'不能作自己主人的人，談不上自由。',
     x_en:'No one is free who is not master of themselves.',
     x_ja:'自分自身の主人でない者に、自由はない。'},
    {o:'west', by:'魯米', by_en:'Rumi', by_ja:'ルーミー', act:'write',
     x:'傷口，是光進入你的地方。',
     x_en:'The wound is the place where the light enters you.',
     x_ja:'傷こそが、光があなたに入ってくる場所。'},
    {o:'west', by:'魯米', by_en:'Rumi', by_ja:'ルーミー', act:'ask',
     x:'昨日的我聰明，想改變世界；今日的我智慧，正在改變自己。',
     x_en:'Yesterday I was clever, so I wanted to change the world. Today I am wise, so I am changing myself.',
     x_ja:'昨日の私は賢くて、世界を変えたかった。今日の私は智慧を得て、自分を変えている。'},
    {o:'west', by:'帕斯卡《思想錄》', by_en:'Pascal, Pensées', by_ja:'パスカル『パンセ』', act:'breathe',
     x:'人類的許多煩惱，都源於無法安靜地獨自坐在房間裡。',
     x_en:'Most of humanity’s troubles come from not being able to sit quietly in a room alone.',
     x_ja:'人間の問題の多くは、部屋でひとり静かに座っていられないことから生じる。'},
    {o:'west', by:'蒙田《隨筆集》', by_en:'Montaigne, Essays', by_ja:'モンテーニュ『エセー』', act:'ask',
     x:'世上最了不起的事，是懂得如何屬於自己。',
     x_en:'The greatest thing in the world is to know how to belong to oneself.',
     x_ja:'世界で最も偉大なことは、自分自身に属するすべを知っていることだ。'},
    {o:'west', by:'歌德', by_en:'Goethe', by_ja:'ゲーテ', act:'breathe',
     x:'沒有什麼比今天更珍貴。',
     x_en:'Nothing is worth more than this day.',
     x_ja:'今日という日ほど、価値あるものはない。'},
    {o:'west', by:'梭羅', by_en:'Henry David Thoreau', by_ja:'ソロー', act:'observe',
     x:'重要的不是你看著什麼，而是你看見了什麼。',
     x_en:'It’s not what you look at that matters, it’s what you see.',
     x_ja:'大切なのは何を眺めるかではなく、何を見るかである。'},
    {o:'west', by:'愛默生', by_en:'Ralph Waldo Emerson', by_ja:'エマソン', act:'breathe',
     x:'學習大自然的步調：她的祕密是耐心。',
     x_en:'Adopt the pace of nature: her secret is patience.',
     x_ja:'自然のリズムに倣おう。その秘密は忍耐である。'},
    {o:'west', by:'里爾克《給青年詩人的信》', by_en:'Rilke, Letters to a Young Poet', by_ja:'リルケ『若き詩人への手紙』', act:'write',
     x:'對心中所有未解的事保持耐心，試著去愛那些問題本身。',
     x_en:'Be patient toward all that is unsolved in your heart, and try to love the questions themselves.',
     x_ja:'心の中の解けないものすべてに辛抱強くあり、問いそのものを愛してみよう。'},
    {o:'west', by:'尼采', by_en:'Friedrich Nietzsche', by_ja:'ニーチェ', act:'ask',
     x:'知道為何而活的人，幾乎能承受任何一種生活。',
     x_en:'He who has a why to live can bear almost any how.',
     x_ja:'生きる「なぜ」を持つ者は、ほとんどどんな「いかに」にも耐えられる。'},
    {o:'west', by:'齊克果', by_en:'Søren Kierkegaard', by_ja:'キルケゴール', act:'write',
     x:'人生只能回頭理解，卻必須向前活。',
     x_en:'Life can only be understood backwards, but it must be lived forwards.',
     x_ja:'人生は振り返ることでしか理解できないが、前を向いてしか生きられない。'},
    {o:'west', by:'奧古斯丁', by_en:'Augustine of Hippo', by_ja:'アウグスティヌス', act:'observe',
     x:'人們遠行去讚嘆高山與大海，卻對自己不曾駐足驚嘆。',
     x_en:'People travel to wonder at mountains and seas, yet pass by themselves without wondering.',
     x_ja:'人は山や海に驚嘆するために旅をするのに、自分自身の前は驚きもせず通り過ぎる。'},
    {o:'west', by:'希波克拉底', by_en:'Hippocrates', by_ja:'ヒポクラテス', act:'measure',
     x:'我們身上的自然之力，才是疾病真正的醫者。',
     x_en:'The natural forces within us are the true healers of disease.',
     x_ja:'私たちの内にある自然の力こそ、病の真の治し手である。'}
  ];

  /* 每次造訪回傳不同語錄的索引：
     localStorage 存一份洗牌後的順序 + 進度指標，
     進站一次前進一格；整輪走完自動重新洗牌，開始新的一輪。 */
  var KEY = 'jte_wisdom_seq';

  function shuffle(n) {
    var a = [];
    for (var i = 0; i < n; i++) a.push(i);
    for (var i = n - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  window.jteWisdomPickIndex = function () {
    var n = window.JTE_WISDOM.length;
    var st = null;
    try { st = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}
    if (!st || !st.order || st.order.length !== n || typeof st.p !== 'number' || st.p < 0 || st.p >= n) {
      st = { order: shuffle(n), p: 0 };
    }
    var idx = st.order[st.p];
    st.p += 1;
    if (st.p >= n) st = { order: shuffle(n), p: 0 };   // 一輪結束，重新洗牌
    try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {}
    return idx;
  };
})();
