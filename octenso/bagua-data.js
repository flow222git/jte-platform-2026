/* octenso/bagua-data.js — 八態能格 · 八卦定義單一真相來源（canonical）
 * v1.0 · 2026-07-05
 *
 * 用法：各頁在使用它的 script 之前載入 <script src="bagua-data.js"></script>，
 *       之後以 window.OCTENSO_BAGUA 取用；**勿在各頁另行定義八卦 data**。
 *
 * 權威值（2026-07-05 一致性稽核定案）：
 *   - 極性配對 = 先天錯卦（乾⇄坤、離⇄坎、震⇄巽、艮⇄兌）
 *   - 循環標籤 = 功能任務語言（cyclePhase），節氣為後天流行來源、不入表層
 *   - 兌人格型名 = 共鳴者
 *   - 題數 = 25
 *   - 功能名 = 主措辭（開創／明現／行動／喊停／拓展／交流／沉澱／承接）
 * 設計 spec：docs/superpowers/specs/2026-07-05-octenso-bagua-canonical-data-design.md
 */
(function (g) {
  'use strict';

  // 五行色（低彩度，只在需要分辨能量時展開）
  var W = { metal: '#b0996a', wood: '#5f7d4a', water: '#4d6b86', fire: '#9d4b34', earth: '#a98238' };

  // 八卦定義（by key）——欄位超集，各頁取所需子集
  var BAGUA = {
    qian: {
      k: 'qian', sym: '☰', nm: '乾', pin: 'qián', wx: 'metal',
      fn: '開創／決策', fnShort: '開創',
      state: '規劃、領導、開創', over: '控制欲、獨斷、脫離現實', under: '缺方向、缺願景',
      struct: '純陽 ☰ — 全是動能，主開創',
      pairKey: 'kun', cyclePhase: '決斷',
      title: '乾·開創者', titleEn: 'The Initiator',
      nature: '天', virtue: '健（剛健）', family: '父', body: '首（頭）', animal: '馬', dir: '西北', season: '秋冬之交',
      spirit: '「天行健，君子以自強不息。」乾是創生的原動力、宇宙運行不息的力量，為開創、決斷、領導之源。',
      person: '天生的領導者與開創者，目標感強、敢做決定、推得動事情。要學的是放手與柔軟（坤）。',
      classic: '純陽至剛，象天運行不息——對應「開創／決策」：開創、領導、自強不息。',
      remind: '能開創、能決斷；但真正的剛健，是知道何時放手、何時讓別人接手。'
    },
    dui: {
      k: 'dui', sym: '☱', nm: '兌', pin: 'duì', wx: 'metal',
      fn: '交流／分享', fnShort: '交流',
      state: '對話、連結、人際', over: '過度社交、討好、空談', under: '封閉、不願表達',
      struct: '上陰 ☱ — 開口向外，主喜悅表達',
      pairKey: 'gen', cyclePhase: '交流',
      title: '兌·共鳴者', titleEn: 'The Resonator',
      nature: '澤', virtue: '悅（喜悅）', family: '少女', body: '口', animal: '羊', dir: '西', season: '秋',
      spirit: '「麗澤，兌；君子以朋友講習。」兌是喜悅與溝通，是人與人交流、分享、彼此滋潤的能量。',
      person: '開朗健談、擅長連結、帶來歡樂氣氛。要學的是深度與留白（巽、坎）。',
      classic: '澤水滋潤大地，象喜悅與交流——對應「交流／分享」：表達、共鳴、令人愉悅。',
      remind: '表達與交流帶來喜悅；但說出口之外，也要懂得留白與傾聽。'
    },
    li: {
      k: 'li', sym: '☲', nm: '離', pin: 'lí', wx: 'fire',
      fn: '明現／覺察', fnShort: '明現',
      state: '洞察、理解、看見', over: '過度分析、想太多', under: '看不清方向',
      struct: '中陰 ☲ — 光向外照，主顯明',
      pairKey: 'kan', cyclePhase: '明現',
      title: '離·洞見者', titleEn: 'The Seer',
      nature: '火', virtue: '麗（附麗、光明）', family: '中女', body: '目（眼）', animal: '雉', dir: '南', season: '夏',
      spirit: '「明兩作，離；大人以繼明照于四方。」離是光明與覺察，是看見、理解、使事物顯明的能量，也象徵文明與智慧。',
      person: '敏銳、善分析、看得透徹。要學的是行動與沉澱（震、坎），別困在想。',
      classic: '火附於物而生光明，象明察與依附——對應「明現／覺察」：看見、洞察、使事物顯明。',
      remind: '看得清是天賦；但別困在「想清楚」——有些事要先動，才會明白。'
    },
    zhen: {
      k: 'zhen', sym: '☳', nm: '震', pin: 'zhèn', wx: 'wood',
      fn: '行動／突破', fnShort: '行動',
      state: '行動、冒險、開始', over: '衝動、焦躁、停不下來', under: '拖延、不敢開始',
      struct: '初陽 ☳ — 動能剛萌生，主行動',
      pairKey: 'xun', cyclePhase: '行動',
      title: '震·行動者', titleEn: 'The Doer',
      nature: '雷', virtue: '動（震動、奮起）', family: '長男', body: '足（腳）', animal: '龍', dir: '東', season: '春',
      spirit: '「洊雷，震；君子以恐懼脩省。」震是奮起與開端——雷出地奮、萬物萌生，是打破沉寂、行動、突破的能量。',
      person: '行動派、有衝勁、勇於開始與冒險。要學的是暫停與界線（艮）。',
      classic: '雷出地奮，象奮起與開端——對應「行動／突破」：行動、冒險、打破沉寂。',
      remind: '敢開始很可貴；但真正的力量，是衝得出去、也停得下來。'
    },
    xun: {
      k: 'xun', sym: '☴', nm: '巽', pin: 'xùn', wx: 'wood',
      fn: '拓展／連結', fnShort: '拓展',
      state: '推廣、成長、合作', over: '擴張失控、分心', under: '缺資源連結',
      struct: '初陰 ☴ — 柔入滲透，主連結拓展',
      pairKey: 'zhen', cyclePhase: '拓展',
      title: '巽·協作者', titleEn: 'The Collaborator',
      nature: '風', virtue: '入（順入、滲透）', family: '長女', body: '股（大腿）', animal: '雞', dir: '東南', season: '春夏之交',
      spirit: '「隨風，巽；君子以申命行事。」巽是順入與滲透，像風無所不入、像木漸漸生長，是協調、連結、順勢推進的能量。',
      person: '柔軟有彈性、善協調與滲透、能把資源串起來。要學的是聚焦與界線（艮）。',
      classic: '風無孔不入，象柔順滲透——對應「拓展／連結」：協調、滲透、順勢推進。',
      remind: '柔能滲透、能連結；但記得收斂焦點，攤太開反而抓不住重點。'
    },
    kan: {
      k: 'kan', sym: '☵', nm: '坎', pin: 'kǎn', wx: 'water',
      fn: '沉澱／恢復', fnShort: '沉澱',
      state: '沉澱、休息、反思', over: '內耗、逃避、過度退縮', under: '不會休息、不會恢復',
      struct: '中陽 ☵ — 力量藏於內，主沉澱',
      pairKey: 'li', cyclePhase: '沉澱',
      title: '坎·沉潛者', titleEn: 'The Deep Diver',
      nature: '水', virtue: '陷（險陷，亦主智）', family: '中男', body: '耳', animal: '豕（豬）', dir: '北', season: '冬',
      spirit: '「水洊至，習坎；君子以常德行，習教事。」坎是險陷也是智慧與信實——水雖陷於險，卻流動不息、就下不爭，是沉潛、內省、蓄力的能量。',
      person: '深沉內斂、想得深、耐得住沉潛。要學的是明現與行動（離、震），別讓退縮變逃避。',
      classic: '水行於險而不失其信，象沉潛蓄力——對應「沉澱／恢復」：內省、休養、蓄勢。',
      remind: '懂得沉潛與休息，是力量的源頭；但別讓退縮變成逃避。'
    },
    gen: {
      k: 'gen', sym: '☶', nm: '艮', pin: 'gèn', wx: 'earth',
      fn: '喊停／界線', fnShort: '喊停',
      state: '結束、拒絕、定界', over: '固執、停滯、不變通', under: '無法喊停、無法拒絕',
      struct: '上陽 ☶ — 動到頂被止住，主喊停',
      pairKey: 'dui', cyclePhase: '喊停',
      title: '艮·守界者', titleEn: 'The Anchor',
      nature: '山', virtue: '止（靜止）', family: '少男', body: '手', animal: '狗', dir: '東北', season: '冬春之交',
      spirit: '「兼山，艮；君子以思不出其位。」艮是靜止與守界——山靜止不移，是知道何時該停、守住分寸、安住當下的能量。',
      person: '穩定可靠、有原則、守得住界線與節奏。要學的是行動與彈性（震）。',
      classic: '山靜止不動，象知止守界——對應「喊停／界線」：適可而止、守住分寸。',
      remind: '知道何時停、何時說不，是難得的清醒；但別讓喊停變成卡死不動。'
    },
    kun: {
      k: 'kun', sym: '☷', nm: '坤', pin: 'kūn', wx: 'earth',
      fn: '承接／滋養', fnShort: '承接',
      state: '接納、支持、穩定', over: '過度承擔、失去自我', under: '缺耐心、缺穩定',
      struct: '純陰 ☷ — 全是承接，主涵養',
      pairKey: 'qian', cyclePhase: '承接',
      title: '坤·承載者', titleEn: 'The Nurturer',
      nature: '地', virtue: '順（柔順）', family: '母', body: '腹', animal: '牛', dir: '西南', season: '夏秋之交',
      spirit: '「地勢坤，君子以厚德載物。」坤是大地般的承接與滋養——柔順而能容、能成全萬物，是包容、支持、孕育的能量。',
      person: '溫厚包容、有耐心、是大家的依靠。要學的是為自己開創與設界（乾、艮）。',
      classic: '純陰至柔，象大地厚德載物——對應「承接／滋養」：包容、支持、滋養萬物。',
      remind: '能涵容、能支持，是深厚的力量；但承接別人之前，先把自己接住。'
    }
  };

  // 認識八卦（view5）展示順序：乾兌離震巽坎艮坤
  var ORDER = ['qian', 'dui', 'li', 'zhen', 'xun', 'kan', 'gen', 'kun'];

  // 極性輪盤座標（view1）——四直徑皆先天錯卦（對極成直徑）
  var POLAR = {
    qian: { x: 200, y: 60 }, li: { x: 299, y: 101 }, zhen: { x: 340, y: 200 }, dui: { x: 299, y: 299 },
    kun: { x: 200, y: 340 }, kan: { x: 101, y: 299 }, gen: { x: 101, y: 101 }, xun: { x: 60, y: 200 }
  };

  // 四組極性對＝先天錯卦（陰陽全反）＋功能對比＋四象系統名
  var POLARITY_PAIRS = [
    { sys: '建構', a: 'qian', b: 'kun', label: '開創 ⇄ 承接', contrast: '主動開創 ⇄ 承接載住' },
    { sys: '認知', a: 'li', b: 'kan', label: '明現 ⇄ 沉澱', contrast: '向外明現顯 ⇄ 向內沉澱藏' },
    { sys: '推動', a: 'zhen', b: 'xun', label: '行動 ⇄ 拓展', contrast: '一鼓作氣猛推 ⇄ 細水長流柔滲' },
    { sys: '調節', a: 'gen', b: 'dui', label: '喊停 ⇄ 交流', contrast: '收住喊停內守 ⇄ 打開交流外放' }
  ];

  // 循環（後天流行·帝出乎震）順序；節氣為此順序的來源、不入表層標籤
  var CYCLE_ORDER = ['zhen', 'xun', 'li', 'kun', 'dui', 'qian', 'kan', 'gen'];

  // 人格測驗題數（離 4 題＝見＋顯兩面，其餘 8 卦各 3）
  var QUESTION_COUNT = 25;

  // 誠實邊界（各頁文案共用，避免措辭漂移）
  var HONEST = '這是一面認識自己與關係的鏡子，不是算命、不是命定——能量會流動，也可以成長。';

  g.OCTENSO_BAGUA = {
    version: '1.0',
    W: W,
    BAGUA: BAGUA,
    ORDER: ORDER,
    POLAR: POLAR,
    POLARITY_PAIRS: POLARITY_PAIRS,
    CYCLE_ORDER: CYCLE_ORDER,
    QUESTION_COUNT: QUESTION_COUNT,
    HONEST: HONEST,
    // 便利存取
    get: function (k) { return BAGUA[k]; },
    pairOf: function (k) { return BAGUA[k] && BAGUA[BAGUA[k].pairKey]; },
    titleOf: function (k) { return BAGUA[k] && BAGUA[k].title; }
  };
})(typeof window !== 'undefined' ? window : this);
