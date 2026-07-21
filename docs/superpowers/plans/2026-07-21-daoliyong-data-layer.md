# 道理用矩陣 · Canonical 資料層 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 依 spec `docs/superpowers/specs/2026-07-21-daoliyong-bagua-matrix-design.md`,建立道理用八卦矩陣的 canonical 資料層(`octenso/daoliyong-data.js`)+ 結構驗證測試頁,並把憲法增修參照寫入既有文件。

**Architecture:** 新資料檔比照 `octenso/bagua-data.js`(IIFE、ES5、掛 window namespace),依賴並回查 `OCTENSO_BAGUA`,不重複定義卦名/符號/五行。測試頁比照 `octenso/bagua-catalog.test.html`(無 node,瀏覽器讀 title 的 `RESULT pass=X fail=Y`)。文件增修只加參照、不改原文。

**Tech Stack:** 純前端 ES5 JS、HTML 測試頁、`python -m http.server` + headless Chrome。

## Global Constraints

- 分支:`octenso/daoliyong-matrix`(已存在,spec 已 commit 於 `3eee1c0`)。
- JS 一律 ES5(`var`、function、IIFE、`'use strict'`),格式比照 `octenso/bagua-data.js`。
- 測試頁不可有外部絕對網址 script;無 node,結果寫入 `document.title` 為 `RESULT pass=X fail=Y`。
- `daoliyong-data.js` 載入順序必須在 `bagua-data.js` 之後;未載入 `OCTENSO_BAGUA` 時 `throw`。
- 卦名、符號、五行、卦德不得在新檔重複定義(meta A 同源,以 key 回查 `OCTENSO_BAGUA`)。
- 文案不用 emoji;canonical 字串(`SCENE_RULE`/`PRINCIPLE`/`MOTTO`)各頁只能引用、不得自寫。
- 測驗端(persona)讀法一字不動;本輪不做任何 UI 頁。
- `Integral_Philosophy_Triangle.pdf` 不 commit(使用者定案:保持本機參考件)。
- commit 訊息結尾加:`Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`。

---

### Task 1: canonical 資料層 `daoliyong-data.js` + 結構驗證測試頁

**Files:**
- Test: `octenso/daoliyong-data.test.html`(先寫,TDD)
- Create: `octenso/daoliyong-data.js`

**Interfaces:**
- Consumes: `window.OCTENSO_BAGUA`(`octenso/bagua-data.js` v1.0;`.BAGUA[k]`、`.get(k)`,八 key:`qian dui li zhen xun kan gen kun`)
- Produces: `window.OCTENSO_DAOLIYONG` — `{ version, SOURCE, MOTTO, SCENE_RULE, PRINCIPLE, TRIANGLE:{dao,li,yong}, MODES:{八卦 key}, get(k), baguaOf(k) }`;每 mode:`{ k, mode, epithet, yao:{li,yong,dao 各為 'yang'|'yin'}, trait, bestUse, blindspot, guard, vsOcten }`。後續教學頁/引擎頁皆讀此 namespace。

- [ ] **Step 1: 寫測試頁(會失敗)**

建立 `octenso/daoliyong-data.test.html`,完整內容:

```html
<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><title>daoliyong tests</title></head><body>
<pre id="log"></pre>
<script>
// 依賴宣告測試:先在「未載入 bagua-data.js」下載入 daoliyong-data.js,應 throw
window.__depErr = false;
window.addEventListener('error', function (e) {
  if (/bagua-data/.test(e.message || '')) window.__depErr = true;
}, true);
</script>
<script src="daoliyong-data.js"></script><!-- 第一次載入:無依賴,應 throw -->
<script src="bagua-data.js"></script>
<script src="daoliyong-data.js"></script><!-- 第二次載入:依賴齊,正常定義 -->
<script>
(function () {
  var pass = 0, fail = 0, log = document.getElementById('log');
  function t(name, ok) { if (ok) { pass++; } else { fail++; log.textContent += 'FAIL: ' + name + '\n'; } }
  var B = window.OCTENSO_BAGUA, D = window.OCTENSO_DAOLIYONG;
  var KEYS = ['qian', 'dui', 'li', 'zhen', 'xun', 'kan', 'gen', 'kun'];

  // 0) namespace 與依賴宣告
  t('dep throw without bagua-data', window.__depErr === true);
  t('namespace', !!D && D.version === '1.0');

  // 1) 爻參數結構驗證(最關鍵):真值表由下而上 [理(初), 用(二), 道(三)]
  var TRI = {
    qian: ['yang', 'yang', 'yang'], dui: ['yang', 'yang', 'yin'],
    li:   ['yang', 'yin',  'yang'], zhen: ['yang', 'yin',  'yin'],
    xun:  ['yin',  'yang', 'yang'], kan: ['yin',  'yang', 'yin'],
    gen:  ['yin',  'yin',  'yang'], kun: ['yin',  'yin',  'yin']
  };
  KEYS.forEach(function (k) {
    var m = D.MODES[k];
    t('yao ' + k + ' 理(初)', !!m && m.yao.li === TRI[k][0]);
    t('yao ' + k + ' 用(二)', !!m && m.yao.yong === TRI[k][1]);
    t('yao ' + k + ' 道(三)', !!m && m.yao.dao === TRI[k][2]);
  });

  // 2) key 與 OCTENSO_BAGUA 完全一致、無多無少
  var mk = Object.keys(D.MODES);
  t('MODES count 8', mk.length === 8);
  t('MODES keys = BAGUA keys', KEYS.every(function (k) { return !!D.MODES[k] && !!B.BAGUA[k]; }) &&
    mk.every(function (k) { return KEYS.indexOf(k) >= 0; }));

  // 3) 每模式全欄位非空;必有 blindspot+guard(條文三);vsOcten 八卦皆有
  KEYS.forEach(function (k) {
    var m = D.MODES[k];
    t(k + ' k', !!m && m.k === k);
    t(k + ' mode', !!m && typeof m.mode === 'string' && m.mode.length >= 3);
    t(k + ' epithet', !!m && typeof m.epithet === 'string' && m.epithet.length >= 6);
    t(k + ' trait', !!m && typeof m.trait === 'string' && m.trait.length >= 20);
    t(k + ' bestUse', !!m && typeof m.bestUse === 'string' && m.bestUse.length >= 8);
    t(k + ' blindspot', !!m && typeof m.blindspot === 'string' && m.blindspot.length >= 4);
    t(k + ' guard', !!m && typeof m.guard === 'string' && m.guard.length >= 8);
    t(k + ' vsOcten', !!m && typeof m.vsOcten === 'string' && m.vsOcten.length >= 10);
  });

  // 4) TRIANGLE 三隅齊備;canonical 字串關鍵語
  ['dao', 'li', 'yong'].forEach(function (c) {
    var o = D.TRIANGLE[c];
    t('TRIANGLE ' + c, !!o && ['nm', 'pos', 'essence', 'value', 'virtue', 'jian'].every(function (f) {
      return typeof o[f] === 'string' && o[f].length > 0;
    }));
  });
  t('SCENE_RULE 先正面', D.SCENE_RULE.indexOf('先正面') >= 0);
  t('SCENE_RULE 非算命', D.SCENE_RULE.indexOf('非算命') >= 0);
  t('PRINCIPLE 反於道', D.PRINCIPLE.indexOf('反於道') >= 0);
  t('PRINCIPLE 留有餘地', D.PRINCIPLE.indexOf('留有餘地') >= 0);
  t('SOURCE 吳怡', D.SOURCE.indexOf('吳怡') >= 0);
  t('MOTTO', typeof D.MOTTO === 'string' && D.MOTTO.length >= 8);

  // 5) helpers
  t('get()', D.get('kan') === D.MODES.kan && !D.get('nope'));
  t('baguaOf()', D.baguaOf('kan') === B.BAGUA.kan);

  document.title = 'RESULT pass=' + pass + ' fail=' + fail;
  log.textContent = 'RESULT pass=' + pass + ' fail=' + fail + '\n' + log.textContent;
})();
</script>
</body></html>
```

- [ ] **Step 2: 跑測試,確認失敗**

於 repo 根目錄(Git Bash):

```bash
python -m http.server 8123 &   # 背景啟動;結束後 kill
"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu \
  --dump-dom http://localhost:8123/octenso/daoliyong-data.test.html | grep -o "RESULT pass=[0-9]* fail=[0-9]*"
```

Expected: `RESULT pass=… fail=N`,**N > 0**(daoliyong-data.js 尚不存在,404;namespace 未定義)。
(若無 Chrome,可用 Edge:`"/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"` 同參數。)

- [ ] **Step 3: 實作 `octenso/daoliyong-data.js`**

完整內容(內容逐字依 spec §3/§4;爻參數與 Step 1 真值表逐爻相符):

```js
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
```

- [ ] **Step 4: 跑測試,確認全綠**

同 Step 2 指令。Expected: `RESULT pass=N fail=0`(N > 60)。跑完 kill 背景 http.server。

- [ ] **Step 5: Commit**

```bash
git add octenso/daoliyong-data.js octenso/daoliyong-data.test.html
git commit -m "octenso: 道理用矩陣 canonical 資料層 daoliyong-data.js(含爻參數結構驗證測試)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: 憲法增修參照 + COMPENDIUM 條目

**Files:**
- Modify: `docs/superpowers/specs/2026-06-19-octenso-bagua-model-calibration-design.md:5-6`(定位段之後加一行)
- Modify: `octenso/COMPENDIUM.md`(§1 末尾加 1.5;§9 決策史 timeline 加一列)

**Interfaces:**
- Consumes: Task 1 的檔名 `octenso/daoliyong-data.js`(參照文字中引用)
- Produces: 無程式介面;文件參照供人查閱

- [ ] **Step 1: 2026-06-19 學理憲法頂部加增修參照**

在該檔「本文為『憲法』——日後所有解讀文案…」這一行**之後、`---` 之前**,插入一行:

```markdown
增修條文(2026-07-21):見 `2026-07-21-daoliyong-bagua-matrix-design.md`——道理用八卦矩陣·八態鏡解讀引擎核心(雙軌場景:測驗端維持正向心理學讀法、引擎端以吳怡版道理用矩陣為主;canonical:`octenso/daoliyong-data.js`)。
```

原文其餘一字不動。

- [ ] **Step 2: COMPENDIUM.md §1 加 1.5 小節**

在 `### 1.4 機器可讀定義(states-schema,Define 層)` 小節結束後、`## 2. 解讀層(解讀憲法要點)` 之前,插入:

```markdown
### 1.5 道理用矩陣(引擎端·憲法增修,2026-07-21)

學理源頭:吳怡「整體生命哲學三角形(道、理、用)」。**三角形為體、八態為用**——八態鏡解讀引擎核心=三角形(道理用,縱向爻層)× 八態(橫向功能)。

- **雙軌場景**:測驗端(讀人/底色)=正向心理學讀法,維持原樣;引擎端(讀運作/局面)=吳怡版(坎=度險維心、震=謀定後動、離=附麗虛己)。次序律:對「人」先正面、後對策。
- **爻層**:初=理(地)、二=用(人)、三=道(天);陽=剛健、陰=柔順;三爻陰陽 → 八模式(各含特徵/最佳應用/死角/防範)。
- **心法**:以用為歸宿;用必須反於道;三隅箴(道勿空談、理勿僵化、用勿盲目功利)。
- 真相來源:`daoliyong-data.js`(canonical)+ specs/2026-07-21-daoliyong-bagua-matrix-design.md(憲法增修)。
```

- [ ] **Step 3: COMPENDIUM.md §9 決策史加一列**

在 `## 9. 決策史(timeline)` 表格中,依日期序(07-21 應為最末或依表內既有排序)加入:

```markdown
| 07-21 | **道理用矩陣·憲法增修**(三角形×八態=八態鏡引擎核心;雙軌場景定體;新 canonical `daoliyong-data.js`) |
```

- [ ] **Step 4: 驗證文件變更**

```bash
grep -n "daoliyong" docs/superpowers/specs/2026-06-19-octenso-bagua-model-calibration-design.md octenso/COMPENDIUM.md
```

Expected: 三處命中(憲法 1 行、COMPENDIUM 1.5 小節內、決策史 1 列——1.5 小節含兩次 `daoliyong` 亦可,重點是三個位置都有)。

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/specs/2026-06-19-octenso-bagua-model-calibration-design.md octenso/COMPENDIUM.md
git commit -m "docs: 學理憲法增修參照+COMPENDIUM 道理用矩陣條目

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: 既有測試不破壞(煙霧驗證)

**Files:**
- 無新增/修改;只執行

**Interfaces:**
- Consumes: Task 1 完成後的 repo 狀態
- Produces: 全綠證據,供 PR 描述引用

- [ ] **Step 1: 跑新測試 + 兩個既有代表測試**

```bash
python -m http.server 8123 &
for p in octenso/daoliyong-data.test.html octenso/bagua-catalog.test.html octenso/bagua-persona.test.html; do
  "/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu \
    --dump-dom "http://localhost:8123/$p" | grep -o "RESULT pass=[0-9]* fail=[0-9]*" | head -1
done
kill %1
```

Expected: 三行皆 `fail=0`(persona 既有 213 測試全綠;本輪未動 `bagua-data.js`,不應有任何波動)。

- [ ] **Step 2: 若有紅燈**

任何 `fail>0`:停下,回報輸出,不得為過測而改既有檔案(既有測試紅燈=本輪改動有誤,回查 Task 1/2 的 diff)。

- [ ] **Step 3: 完成回報**

無需 commit(無檔案變更)。回報三個測試頁的 RESULT 行,分支準備進入收尾(merge/PR 由 finishing-a-development-branch 流程處理,需使用者確認後才 push)。

---

## Self-Review(已執行)

1. **Spec coverage**:§5 資料層 → Task 1 Step 3;§6 測試五項 → Task 1 Step 1(0~5 全對應:爻真值表/key 一致/欄位非空+blindspot+guard+vsOcten/TRIANGLE+關鍵語/依賴 throw);§8 實作對應 → Task 2(參照行+COMPENDIUM)+ Task 3(全綠);「既有測試全綠不破壞」→ Task 3。§7 不做清單 → 本計畫無任何 UI/persona/lens/64卦/i18n 變更。無缺口。
2. **Placeholder scan**:無 TBD/TODO;所有程式碼與文案逐字在案。
3. **Type consistency**:namespace `OCTENSO_DAOLIYONG`、`MODES[k].yao.{li,yong,dao}`、helpers `get/baguaOf` 在 Task 1 測試與實作、Task 2 參照文字中一致;爻真值表與 MODES 逐卦核對相符(乾陽陽陽、兌陽陽陰、離陽陰陽、震陽陰陰、巽陰陽陽、坎陰陽陰、艮陰陰陽、坤陰陰陰)。
