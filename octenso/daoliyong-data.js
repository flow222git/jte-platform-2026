/* octenso/daoliyong-data.js — 道理用八卦矩陣 · 八態鏡解讀引擎 canonical
 * v1.0 · 2026-07-21
 *
 * 學理源頭:吳怡「整體生命哲學三角形(道、理、用)」(參考件 Integral_Philosophy_Triangle.pdf,本機)。
 * 用法:載入順序必須在 bagua-data.js 之後;之後以 window.OCTENSO_DAOLIYONG 取用。
 *       卦名/符號/五行/卦德不在此重複定義,一律以 key 回查 OCTENSO_BAGUA(meta A 同源)。
 * 場景:僅供「八態鏡解讀引擎端」(讀運作/局面)取用;測驗端(讀人/底色)維持八態能格讀法,勿混用。
 * 設計 spec:docs/superpowers/specs/2026-07-21-daoliyong-bagua-matrix-design.md(學理憲法增修)
 */
(function (g) {
  'use strict';

  if (!g.OCTENSO_BAGUA) {
    throw new Error('daoliyong-data.js 依賴 bagua-data.js,請先載入(meta A 同源)。');
  }

  // 三角形(道理用)定義——價值(真善美)× 四德(元亨利貞)× 三隅箴
  // 注意:TRIANGLE.li = 理(三角形隅),與卦 key 'li'(離)分屬不同 namespace。
  var TRIANGLE = {
    dao: {
      nm: '道', pos: '頂端(天)',
      essence: '最高境界/宇宙本體——無限、開放、自然且無形',
      value: '大美', virtue: '元(萬物創始)',
      jian: '勿流於玄妙空談——高遠境界必須落實為有益的德行'
    },
    li: {
      nm: '理', pos: '底端右角(地)',
      essence: '客觀法則/知與學——知識、理論、制度與原則',
      value: '真(客觀)', virtue: '亨(事物通達)',
      jian: '勿死守僵化教條——客觀知識必須保持靈活、留有餘地'
    },
    yong: {
      nm: '用', pos: '底端左角(人)',
      essence: '生命實踐/功夫——落實到人世間的實踐、轉化與應變',
      value: '善(人間美德)', virtue: '利與貞(造福與堅持)',
      jian: '實踐需通於自然——不可盲目功利,一切行動最終回歸天道'
    }
  };

  // 八模式——yao 由下而上:理(初爻)/用(二爻)/道(三爻);'yang'=剛健充實積極、'yin'=虛心柔軟順應
  var MODES = {
    qian: {
      k: 'qian', mode: '乾模式', epithet: '全陽驅動的剛健不息',
      yao: { li: 'yang', yong: 'yang', dao: 'yang' },
      trait: '底層實力最紮實充實,實踐上極積極的領導與行動力,通達無窮創造境界。',
      bestUse: '大開大闔、強力領導、突破性開創的局面。',
      blindspot: '過剛易折',
      guard: '發揮強勢領導時,必須加入陰爻思維,懂得適時退讓。',
      vsOcten: '同義——底色與本模式皆取開創/決策義。'
    },
    dui: {
      k: 'dui', mode: '兌模式', epithet: '外柔內剛的喜悅溝通',
      yao: { li: 'yang', yong: 'yang', dao: 'yin' },
      trait: '內在實力強(理陽)、行事動能正向(用陽),最高境界如湖水開闊、柔和、喜悅(道陰)。',
      bestUse: '溝通、公關談判、以親和力帶動高效執行的管理情境。',
      blindspot: '外在剛硬、給人壓迫感',
      guard: '刻意修練最外層如沐春風的柔悅姿態。',
      vsOcten: '同義——底色與本模式皆取交流/喜悅義。'
    },
    li: {
      k: 'li', mode: '離模式', epithet: '虛心附麗的團隊燃燒',
      yao: { li: 'yang', yong: 'yin', dao: 'yang' },
      trait: '理智底蘊清晰強大、理想宏大(上下皆陽),執行時須將自我「虛掉」(用陰),依附團隊才能發光。',
      bestUse: '高階智力密集的計畫、需依賴組織架構才能變現的局面。',
      blindspot: '過度自我與孤立',
      guard: '隨時警惕自視甚高,虛心依附團隊——火無柴必熄。',
      vsOcten: '側重不同——底色取光明義(洞見);本模式取附麗義(虛己依附)。'
    },
    zhen: {
      k: 'zhen', mode: '震模式', epithet: '謀定後動的柔和爆發',
      yao: { li: 'yang', yong: 'yin', dao: 'yin' },
      trait: '內在強爆發力與創新初衷(理陽),對外執行保持陰柔彈性(用陰),與環境和諧共振(道陰)。',
      bestUse: '推動顛覆性創新計畫,以柔和手腕降低阻力。',
      blindspot: '盲目暴衝、破壞關係',
      guard: '時時檢視「用」的層面是否保持足夠的陰柔與彈性。',
      vsOcten: '側重不同——底色取行動衝勁;本模式取外柔內動、謀定後動。'
    },
    xun: {
      k: 'xun', mode: '巽模式', epithet: '無孔不入的滲透影響',
      yao: { li: 'yin', yong: 'yang', dao: 'yang' },
      trait: '起步低調柔軟、潛伏打底(理陰),基礎穩固後展現強實踐力(用陽),風行草偃、無遠弗屆(道陽)。',
      bestUse: '進入陌生市場或複雜政治環境中的長線滲透策略。',
      blindspot: '太早出頭、缺乏耐心',
      guard: '起步階段必須確實潛伏,不能大張旗鼓而遭遇阻力。',
      vsOcten: '同義——底色與本模式皆取拓展/滲透義。'
    },
    kan: {
      k: 'kan', mode: '坎模式', epithet: '外柔內剛的度險誠信',
      yao: { li: 'yin', yong: 'yang', dao: 'yin' },
      trait: '基礎與結果皆險惡不可測(上下皆陰),唯在「用」上秉持最剛強的維心(絕對誠信與堅持)方能化險為夷。',
      bestUse: '危機處理、資源匱乏或局勢極度惡劣的存亡關頭。',
      blindspot: '隨波逐流、失去誠信',
      guard: '緊抓中爻的陽剛原則,不因環境險惡而使用詐術。',
      vsOcten: '側重不同——底色取水德(沉澱/恢復);本模式取險陷義(度險維心)。'
    },
    gen: {
      k: 'gen', mode: '艮模式', epithet: '知止沉穩的不動如山',
      yao: { li: 'yin', yong: 'yin', dao: 'yang' },
      trait: '內在修養與處世皆低調收斂不爭(理陰用陰),一切積累為了最高境界不可撼動的決斷與定力(道陽)。',
      bestUse: '局勢未明、需長期蟄伏累積實力、等待最後一擊的防守策略。',
      blindspot: '沉不住氣、輕舉妄動',
      guard: '忍受長期的不爭與寧靜,提早爆發便會前功盡棄。',
      vsOcten: '同義——底色喊停/界線,本模式多「蓄勢待發」一層。'
    },
    kun: {
      k: 'kun', mode: '坤模式', epithet: '全陰承載的包容孕育',
      yao: { li: 'yin', yong: 'yin', dao: 'yin' },
      trait: '底層極虛心謙卑,實踐包容不爭鋒,厚德載物、無私孕育萬物。',
      bestUse: '最高明的輔佐、後勤支援、需要凝聚共識的母性管理。',
      blindspot: '居功(生私心失厚德)',
      guard: '時刻保持無私,不生爭權奪利的私心。',
      vsOcten: '同義——底色與本模式皆取承接/滋養義。'
    }
  };

  g.OCTENSO_DAOLIYONG = {
    version: '1.0',
    SOURCE: '吳怡「整體生命哲學三角形(道、理、用)」;參考件 Integral_Philosophy_Triangle.pdf(本機)。',
    MOTTO: '化知識為德行,通萬變於大道。',
    SCENE_RULE: '同一卦,兩端讀法:八態能格測驗(讀人/底色)以正向心理學角度讀——先看見力量;八態鏡解讀引擎(讀運作/局面)以吳怡道理用矩陣為主——直言對策與死角。對「人」呈現時,永遠先正面(能格)、後對策(引擎),不可倒置。兩讀法同出卦德、只取義側重不同,不互相翻譯。鏡子非算命——策略腳本是參考,不是預測或指令。',
    PRINCIPLE: '以用為歸宿:理若不實踐為用,只是空洞學說。用必須反於道:一切運用最終回歸自然和諧,脫離道的用將走向盲目與毀滅。三隅箴:道勿流於玄妙空談、理勿死守僵化教條、用勿盲目功利而違自然。總則:留有餘地。',
    TRIANGLE: TRIANGLE,
    MODES: MODES,
    // 便利存取
    get: function (k) { return MODES[k]; },
    baguaOf: function (k) { return g.OCTENSO_BAGUA.BAGUA[k]; }
  };
})(typeof window !== 'undefined' ? window : this);
