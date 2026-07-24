# 共用 Renderer(v3.2 核心四塊)+v2 系命名統一 實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 依 `docs/superpowers/specs/2026-07-23-report-renderer-shared-design.md`,把 v3.2 報告核心四塊抽成 `octenso/bagua-report-renderer.js`,persona.html 與 persona-v2 共用;v2 系三頁命名統一到 canonical 者名。

**Architecture:** renderer 依賴 `OCTENSO_BAGUA`(D)+`REPORT_V32`(R)+`OctensoProfile`,對外 `window.OctensoReport = {pn, fn1, build, heroHtml, radarHtml, narrativeHtml, systemsHtml, bindRadar}`——各頁自己排順序、自己包外框,renderer 只產四塊的 HTML 與雷達互動。搬移分兩步:先建獨立 renderer(頁面未接),再切換 persona.html 並刪頁內副本,每步測試全綠。

**Tech Stack:** vanilla JS ES5、iframe 測試頁(title=`RESULT pass=X fail=Y`)、headless Chrome。

## Global Constraints

- 命名:canonical 者名取自 `OCTENSO_BAGUA.BAGUA[k].title`(「乾·開創者」無空格),顯示格式 `者名(卦)`;`fnShort`(開創/明現/交流/拓展/沉澱/喊停/承接/行動)僅作態功能短名(「偏X」標籤),**禁止組「X者」**。
- C1:僅推動(drive,雷風)雙高=張力;乾坤雙高=完整建構格局;並列不捏因果。
- persona.html 既有 271 條測試全綠=搬移驗收線;不得為遷就而弱化既有斷言;行為變更=超出範圍。
- conf 值域:renderer 吃 `'firm'|'mixed'`;v2 存檔為 `'sure'|'mixed'`,adapter 對映 sure→firm;conf=null(分享碼)→ 可信度句與篤定度列不出現。
- 頁面不可引入外部絕對網址 script;文案本輪不改(v0.1 研究假設·待考照掛)。
- 工作分支 `octenso-report-renderer`;每 task 一 commit;commit trailer `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`。
- 測試指令(無 python/node):
  `"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu --allow-file-access-from-files --virtual-time-budget=10000 --dump-dom "file:///E:/Vscode/jte-platform-2026/octenso/<測試頁>" 2>/dev/null | grep -o "<title>[^<]*</title>"`

---

### Task 1: canonical 命名 helper + ESSENCE 入資料檔

**Files:**
- Modify: `octenso/bagua-data.js`(:155-169 export 區)
- Modify: `octenso/bagua-report-v32-data.js`(檔尾 export 前)
- Test: `octenso/bagua-report-v32-data.test.html`

**Interfaces:**
- Produces: `OCTENSO_BAGUA.pn(k)` → `'開創者(乾)'`;`REPORT_V32.ESSENCE[k]`(峰名卡 essence 八句,自 persona.html `E[k].essence` 原文照搬)

- [ ] **Step 1: 加測試**(`bagua-report-v32-data.test.html`,在 SYS_DETAIL 檢查後、`}catch` 前加;該測試頁 `<head>` 補 `<script src="bagua-data.js"></script>`):

```js
  // canonical pn
  var D=window.OCTENSO_BAGUA;
  ok(D && typeof D.pn==='function','OCTENSO_BAGUA.pn 存在');
  ok(D.pn('qian')==='開創者(乾)' && D.pn('li')==='洞見者(離)' && D.pn('dui')==='共鳴者(兌)' && D.pn('xun')==='協作者(巽)','pn canonical 名');
  // ESSENCE:八句峰名卡文案
  EK.forEach(function(k){ ok(typeof R.ESSENCE[k]==='string' && R.ESSENCE[k].length>15,'ESSENCE.'+k); });
```

- [ ] **Step 2: 跑測試確認失敗**(pn undefined、ESSENCE undefined)
- [ ] **Step 3: 實作**

`bagua-data.js` export 物件內(`titleOf` 之後)加:

```js
    // 者名(卦):開創者(乾)——顯示命名單一來源(2026-07-23 renderer spec)
    pn: function (k) { var b = BAGUA[k]; return b ? b.title.split('·')[1] + '(' + b.nm + ')' : ''; }
```

`bagua-report-v32-data.js`:自 `octenso/bagua-persona.html` 的 `var E={...}`(~:476-509)把八個 `essence` 值原文照搬:

```js
// 峰名卡 essence(單峰型;自 persona 頁遷入 canonical,原文照搬)
var ESSENCE={
 qian:'你是天生的開創者——看得見方向，敢做決定。給你一張白紙，你能畫出藍圖、帶人往前。',
 li:'你是看得清的人——先想明白、看穿本質，常能指出別人沒注意到的關鍵。',
 zhen:'你是行動派——有念頭就衝，享受開始與突破的衝勁，是團隊的發動機。',
 dui:'你靠交流而發光——擅長把感受說出口、把人聚在一起，所到之處氣氛變熱。',
 kun:'你溫厚包容——是大家的依靠，擅長承接、支持，讓一切穩穩運轉。',
 kan:'你深沉內斂——擅長獨處、沉澱與反思，是沉得住氣、想得夠深的人。',
 gen:'你穩定可靠——知道何時該停、敢說不，守得住自己的節奏與界線。',
 xun:'你柔韌而有滲透力——擅長向外鋪開、串連資源，讓事情自然生長、影響擴散。'
};
```

並在 `window.REPORT_V32={...}` 加 `ESSENCE:ESSENCE`。(實作時以 persona.html 現檔為準逐句核對,以上為 2026-07-23 現值。)

- [ ] **Step 4: 跑測試確認通過**(pass≈75)
- [ ] **Step 5: Commit** `git add octenso/bagua-data.js octenso/bagua-report-v32-data.js octenso/bagua-report-v32-data.test.html && git commit -m "feat: canonical pn() 入 bagua-data.js;峰名卡 ESSENCE 入 v32 資料檔"`

---

### Task 2: 建 `bagua-report-renderer.js`(獨立,頁面未接)

**Files:**
- Create: `octenso/bagua-report-renderer.js`
- Test: `octenso/bagua-report-renderer.test.html`

**Interfaces:**
- Consumes: `OCTENSO_BAGUA`(W/BAGUA/POLAR/pn)、`REPORT_V32`(PLAIN/SCENE/OPEN/SYS_DETAIL/ESSENCE)、`OctensoProfile.build`
- Produces: `window.OctensoReport`:
  - `pn(k)`(委派 D.pn)、`fn1(k)`(=`BAGUA[k].fn.split('／')[0]`)
  - `build(input)` → ctx;input=`{scores, conf, overs, unders, neutral, now}`;ctx=input+`{pf, topKey}`(pf=OctensoProfile.build(scores) 或 null;topKey=分數最高 key)
  - `heroHtml(ctx, eyebrow)` → 峰名卡 html(typecard 標記,與 persona.html 現版逐字同構;eyebrow 預設「你的能量格局」)
  - `radarHtml(ctx)` → radarCard 標記(含 `#radar-wrap`、hint、`#radar-detail` display:none)
  - `narrativeHtml(ctx)` → `#narrative-block`「整體的你」
  - `systemsHtml(ctx)` → `#sys-detail` 四系統
  - `bindRadar(ctx)` → 建 SVG 進 `#radar-wrap`+rint+預設選取+click 綁定(含原 buildRadar/radarSelect 全部行為)

**實作方式=搬移**:以 `octenso/bagua-persona.html` 現檔為源,把下列函式與詞庫**複製**進 renderer(IIFE 包裝,'use strict'),並施以固定替換規則——
搬移清單(來源行號以現檔 grep 為準):`signatureTitle`、`buildRadar`、`radarCard`、`radarSelect`、`bindRadar`、`portraitNarrative`(改名 `narrativeHtml` 邏輯核)、`systemsSection`(改名 `systemsHtml` 邏輯核)、`pShapeKey`、詞庫 `READ_LEX`、`PAIR_BOTHHIGH`、`COST_GIST`(僅 portraitNarrative b2 所需欄位)。
替換規則:
1. `E[k].nm/sym/wx` → `D.get(k).nm/sym/wx`;`E[k].essence` → `R.ESSENCE[k]`;`E[k].pos` → `D.POLAR[k]`;`W[...]` → `D.W[...]`;`EKEYS` → renderer 內常數 `['qian','li','zhen','dui','kun','kan','gen','xun']`(順序照 persona 頁)。
2. `fn1(k)` → renderer 自帶(`D.get(k).fn.split('／')[0]`);`pn(k)` → `D.pn(k)`。
3. `portraitNarrative(pf,costItems,neutral,conf)` 簽名改 `narrativeCore(ctx)`:overs/unders 不再內算,直接用 `ctx.overs/ctx.unders`(原 costVerdict 分類迴圈**不搬**,刪除);其餘 b1/b2/b3/開場/場景/trust 邏輯原樣。
4. `systemsSection(sc)` 改吃 `ctx.scores`;`PAIR_EVEN_GAP` → renderer 常數 `EVEN_GAP=12`。
5. `bindRadar(pf,conf,fbK)` 改 `bindRadar(ctx)`:fbK=`ctx.topKey`,內部先 `buildRadar` appendChild 再綁(把 persona.html showResult 的 appendChild 行為併入)。
6. 所有 CSS class/id 名不變(tc-*、radar-wrap、radar-detail、rgrp、rint、narrative-block、narrative-open、punch、sys-detail、pole-row)。

- [ ] **Step 1: 寫測試頁**(整檔,載入順序 bagua-data.js → profile.js → bagua-report-v32-data.js → bagua-report-renderer.js;無 iframe,直接在本頁 DOM 放 `<div id="radar-wrap"></div><div id="radar-detail"></div>` 掛載):

```html
<!doctype html><html><head><meta charset="utf-8"><meta name="robots" content="noindex, nofollow"><title>PENDING</title>
<script src="bagua-data.js"></script><script src="profile.js"></script>
<script src="bagua-report-v32-data.js"></script><script src="bagua-report-renderer.js"></script>
</head><body><pre id="out">running...</pre>
<div id="mount"></div>
<script>
var pass=0,fail=0,log=[];
function ok(c,m){ if(c){pass++;} else {fail++; log.push('FAIL: '+m);} }
try{
  var RP=window.OctensoReport;
  ok(!!RP,'OctensoReport 存在');
  ok(RP.pn('li')==='洞見者(離)' && RP.pn('gen')==='守界者(艮)','pn canonical');
  ok(RP.fn1('li')==='明現','fn1 功能短名');
  // 斷崖型假資料(乾82 艮30 → jagged → 對比開場)
  var sc={qian:82,li:74,zhen:66,dui:58,kun:47,kan:41,gen:30,xun:63};
  var ctx=RP.build({scores:sc,conf:{qian:'firm',li:'mixed'},overs:['qian'],unders:['gen'],neutral:null,now:null});
  ok(ctx.pf && ctx.topKey==='qian','build ctx');
  var hero=RP.heroHtml(ctx);
  ok(hero.indexOf('開創者(乾)')>=0 && hero.indexOf('tc-title')>=0,'heroHtml 單峰者名(卦)');
  var nar=RP.narrativeHtml(ctx);
  ok(nar.indexOf('narrative-open')>=0 && nar.indexOf('整體的你')>=0,'narrativeHtml 結構');
  var openTxt=nar.split('narrative-open')[1].split('</div>')[0];
  ok(!/[乾坤震巽坎離艮兌]/.test(openTxt.replace(/<[^>]*>/g,'')),'開場零術語');
  ok(nar.indexOf('如果這是你')>=0,'場景段');
  ok(nar.indexOf('比較猶豫')>=0||nar.indexOf('答得乾脆')>=0,'conf 有值 → 可信度句');
  var nar2=RP.narrativeHtml(RP.build({scores:sc,conf:null,overs:[],unders:[],neutral:null,now:null}));
  ok(nar2.indexOf('答得乾脆')<0 && nar2.indexOf('比較猶豫')<0,'conf=null → 不虛稱');
  var sys=RP.systemsHtml(ctx);
  ok(sys.indexOf('sys-detail')>=0 && sys.indexOf('建構')>=0 && sys.indexOf('小練習')>=0,'systemsHtml');
  ok(sys.indexOf('協作者(巽)')>=0,'系統列 者名(卦)');
  var scT={qian:50,li:55,zhen:80,dui:52,kun:46,kan:44,gen:48,xun:78};
  ok(RP.systemsHtml(RP.build({scores:scT,conf:null,overs:[],unders:[],neutral:null,now:null})).indexOf('張力')>=0,'震巽雙高=張力');
  var scB={qian:80,li:55,zhen:50,dui:52,kun:78,kan:44,gen:48,xun:46};
  ok(RP.systemsHtml(RP.build({scores:scB,conf:null,overs:[],unders:[],neutral:null,now:null})).indexOf('張力')<0,'乾坤雙高≠張力');
  // 雷達掛載+互動
  document.getElementById('mount').innerHTML=RP.radarHtml(ctx);
  RP.bindRadar(ctx);
  ok(document.querySelectorAll('#radar-wrap g.rgrp').length===8,'雷達 8 組');
  ok(document.getElementById('radar-wrap').classList.contains('rint'),'rint 旗標');
  var rd=document.getElementById('radar-detail');
  ok(rd.style.display==='block' && rd.textContent.indexOf('開創者(乾)')>=0,'預設解釋卡=最高態');
  document.querySelector('#radar-wrap g.rgrp[data-k="li"]').dispatchEvent(new Event('click',{bubbles:true}));
  ok(rd.textContent.indexOf('洞見者(離)')>=0,'點角換態');
}catch(e){ fail++; log.push('EXC: '+e.message); }
document.title='RESULT pass='+pass+' fail='+fail;
document.getElementById('out').textContent=document.title+'\n'+log.join('\n');
</script></body></html>
```

- [ ] **Step 2: 跑測試確認失敗**(OctensoReport 不存在)
- [ ] **Step 3: 依搬移清單+替換規則實作 renderer**(逐函式自 persona.html 現檔複製後施替換;不改行為)
- [ ] **Step 4: 跑 renderer 測試至全綠;同時跑 persona 套件確認仍 271/0(此步尚未動 persona.html,應天然綠)**
- [ ] **Step 5: Commit** `git add octenso/bagua-report-renderer.js octenso/bagua-report-renderer.test.html && git commit -m "feat: 共用 renderer(v3.2 核心四塊)獨立成檔+單元測試"`

---

### Task 3: persona.html 切換至 renderer(刪頁內副本)

**Files:**
- Modify: `octenso/bagua-persona.html`
- Test: `octenso/bagua-persona.test.html`(既有 271 條=驗收;僅允許把直呼頁內函式的斷言改為等價的 renderer 斷言,逐條列於報告)

**Interfaces:**
- Consumes: `OctensoReport` 全 API
- Produces: persona.html 内 `pn/signatureTitle/buildRadar/radarCard/radarSelect/bindRadar/portraitNarrative/systemsSection/READ_LEX/PAIR_BOTHHIGH/COST_GIST/pShapeKey` 刪除;頁內 alias `var pn=OctensoReport.pn;`(測試 w.pn 相容);showResult/renderSharedReport 改組裝

- [ ] **Step 1: 先跑既有套件記錄基線 271/0**
- [ ] **Step 2: 實作切換**

(a) `<head>` script 區:`bagua-report-v32-data.js` 之前補 `<script src="bagua-data.js"></script>`,之後補 `<script src="bagua-report-renderer.js"></script>`(順序:bagua-data → profile.js(既有) → v32-data → renderer)。
(b) 刪除上列頁內函式與詞庫;加 aliases(測試與殘餘呼叫相容):

```js
var pn=OctensoReport.pn, radarCard=function(now){return OctensoReport.radarHtml({now:now});};
```

(radarCard alias 僅供 renderCtxResult 等非互動路徑沿用;若 radarHtml 需要 ctx.now 以外欄位,實作時以 `{now:now}` 最小 ctx 通過——radarHtml 只讀 now。)
(c) `showResult` 改:

```js
  var overs=[],unders=[];
  (function(){var r=calibResults(); if(r&&r.items){ r.items.forEach(function(it){var v=costVerdict(it.k,it.dir,it.avg);
    if(v.s==='過用')overs.push(it.k); else if(v.s==='不足')unders.push(it.k);});}})();
  var rctx=OctensoReport.build({scores:sc,conf:conf,overs:overs,unders:unders,
    neutral:(function(){var r=calibResults();return r&&r.neutral;})(),now:now});
  var sig=OctensoReport.heroHtml(rctx);            // 峰名卡(含 typecard 外框,eyebrow 預設)
  // html 組裝:... +sig +OctensoReport.radarHtml(rctx) +OctensoReport.narrativeHtml(rctx)
  //            +honest塊 +OctensoReport.systemsHtml(rctx) +(深讀折疊起全部原樣)
  // 渲染後:OctensoReport.bindRadar(rctx);  // 取代原 appendChild+bindRadar 兩行
```

注意:原 `sig` 物件曾用於 localStorage 存 title——heroHtml 回 html 字串,存檔 title 改用 `OctensoReport.build` ctx 提供?**不**:renderer 另補一個 `titleOf(ctx)` 小函式(回峰名卡標題字串,single/dual=pn 組,multi/pattern 照 signatureTitle 現規則),persona.html 存檔與 share 用它。此函式在 Task 2 一併輸出並測(`RP.titleOf(ctx)==='開創者(乾)'`)——**寫計畫時已定,Task 2 測試補一條**。
(d) `renderSharedReport` 同法改四塊+`bindRadar`。
(e) tendencyCard/honest 塊/深讀折疊/工具/分享/場景(renderCtxResult)全不動。

- [ ] **Step 3: 跑 persona 套件至 271/0**(允許的斷言改寫:直呼 `w.portraitNarrative`/`w.systemsSection`/`w.radarCard` 之類的條目改呼叫 `w.OctensoReport.*` 等價式,逐條列報告;結果 DOM 斷言一條都不許改)
- [ ] **Step 4: 跑 renderer 測試+v32-data 測試,皆綠**
- [ ] **Step 5: Commit** `git commit -am "refactor: persona.html 改吃共用 renderer,刪頁內四塊副本"`

---

### Task 4: persona-v2 換裝 v3.2

**Files:**
- Modify: `octenso/bagua-persona-v2.html`
- Test: `octenso/bagua-persona-v2.test.html`

**Interfaces:**
- Consumes: `OctensoReport` 全 API
- Produces: v2 `renderReport(sc,costSt,conf,fc)` 改為 adapter+四塊組裝;v2 頁內 `pn`(:414)、`signatureCard` 峰名組名、`radarSVG`、每態六級列表、錨定四系統段、二選一對照段、晶體連結按鈕刪除;分享碼+按鈕列保留

- [ ] **Step 1: 加測試**(v2 測試頁沿用其既有 harness 慣例;斷言:)

```js
    // v3.2 換裝
    var H=d.getElementById(/*v2 報告容器 id,實作時以現檔為準*/'report').innerHTML;
    ok(H.indexOf('narrative-block')>=0 && H.indexOf('sys-detail')>=0,'核心四塊出現');
    ok(H.indexOf('洞見者(離)')>=0||H.indexOf('開創者(乾)')>=0,'canonical 者名');
    ok(H.indexOf('明現者')<0 && H.indexOf('交流者')<0 && H.indexOf('拓展者')<0,'漂移名退場');
    ok(H.indexOf('二選一')<0,'二選一對照段退場');
    ok(H.indexOf('bagua-crystal')<0,'晶體連結退場');
    ok(d.querySelectorAll('#radar-wrap g.rgrp').length===8,'雷達互動');
    // sure→firm:v2 conf 存 sure;帶 sure 的 conf 渲染 → 可信度句出現
    // conf=null(分享碼)→ 無可信度句
```

(v2 測試頁的呼叫方式、容器 id、如何餵 conf——實作時以現檔為準補齊;斷言意圖如上,不得空斷言。)

- [ ] **Step 2: 跑 v2 套件確認新斷言失敗、既有綠**
- [ ] **Step 3: 實作**

(a) `<head>` 補 `<script src="bagua-report-v32-data.js"></script><script src="bagua-report-renderer.js"></script>`(bagua-data.js/profile.js 已載)。
(b) adapter:

```js
function toRendererInput(sc,costSt,conf,shared){
  var overs=[],unders=[];
  Object.keys(costSt||{}).forEach(function(k){ if(costSt[k]==='over')overs.push(k); else if(costSt[k]==='under')unders.push(k); });
  var cf=null;
  if(conf && !shared){ cf={}; Object.keys(conf).forEach(function(k){ cf[k]=conf[k]==='sure'?'firm':conf[k]; }); }
  return {scores:sc,conf:cf,overs:overs,unders:unders,neutral:null,now:null};
}
```

(c) `renderReport` 重寫:`var ctx=OctensoReport.build(toRendererInput(sc,costSt,conf,!conf));` → `heroHtml+radarHtml+narrativeHtml+systemsHtml` + 原分享碼/按鈕列(晶體按鈕刪),渲染後 `OctensoReport.bindRadar(ctx)`。刪除:radarSVG、每態六級迴圈、GATES 錨定段、fc 對照段、頁內 pn、reTitle 峰名組名相關。v2 頁其他區(題本流程/存檔/hybrid 進點)不動。
(d) 檔內殘留 `fnShort+'者'` 全數改 `OCTENSO_BAGUA.pn(k)`。

- [ ] **Step 4: 跑 v2 套件全綠;persona 套件回歸 271/0**
- [ ] **Step 5: Commit** `git commit -am "feat: persona-v2 換裝 v3.2 共用 renderer,特色段退場,命名 canonical"`

---

### Task 5: hybrid+crystal 命名統一

**Files:**
- Modify: `octenso/bagua-hybrid.html`(:259 peakName、:314 能格列、其餘 grep `fnShort+'者'`)
- Modify: `octenso/bagua-crystal.html`(grep `fnShort` 兩處)
- Test: `octenso/bagua-hybrid.test.html`、`octenso/bagua-crystal.test.html`

- [ ] **Step 1: 兩測試頁各加斷言**:渲染路徑產出含 canonical 者名(如 `洞見者`),且 `明現者/交流者/拓展者/沉澱者/喊停者/承接者` 不出現(斷言掛在各自現有 harness 的結果檢查點;實作時以現檔為準接線,不得空斷言)。
- [ ] **Step 2: 跑兩套件確認新斷言失敗**
- [ ] **Step 3: 實作**:兩檔所有 `B.get(k).fnShort+'者'`(含模板變體)改 `B.pn(k)`(B=OCTENSO_BAGUA;crystal 檔內叫法以現檔為準)。hybrid 連結與流程不動。
- [ ] **Step 4: 跑 hybrid/crystal/persona/v2/renderer/v32-data 六套件全綠**
- [ ] **Step 5: Commit** `git commit -am "feat: hybrid+crystal 命名統一 canonical 者名(卦)"`

---

### Task 6: 全站驗證+文件回填

**Files:**
- Modify: `octenso/COMPENDIUM.md`、`docs/superpowers/specs/2026-07-23-report-renderer-shared-design.md`

- [ ] **Step 1: 六個測試頁全跑一輪,記錄 RESULT 行(全 fail=0)**
- [ ] **Step 2: headless 開 persona/persona-v2/hybrid/crystal 四頁本體 smoke(無 JS 崩壞)**
- [ ] **Step 3: COMPENDIUM 補一行**:「共用 renderer(2026-07-23):v3.2 核心四塊抽 `bagua-report-renderer.js`,persona/persona-v2 共用;v2 系命名統一 canonical 者名(卦),fnShort 降級功能短名」。spec §5 表格各列補 ✅。
- [ ] **Step 4: Commit** `git commit -am "docs: 共用 renderer 完成,COMPENDIUM 與 spec 回填"`
- [ ] **Step 5: Simon 過目(本機六 preset+hybrid 跑一輪)後走 finishing-a-development-branch**

---

## Self-Review 紀錄

- **Spec coverage:** §2 檔案邊界→Task 2/3;§3 契約→Task 2(build input)+Task 3(c)/Task 4(b) adapters;§4 命名→Task 1+4(d)+5;§5 表→Task 3/4/5;§6 測試→各 task Step 1+Task 6;§7 風險(計分不混/二選一保碼不呈現/crystal 不孤兒)→Task 4(c) 只刪呈現、hybrid 連結不動。
- **Placeholder scan:** Task 4/5 的測試接線細節標明「實作時以現檔為準、不得空斷言」——為既有 harness 結構所限的明文動作,非 TBD;titleOf 於 Task 3 註記處已定義並回掛 Task 2 測試。
- **Type consistency:** `OctensoReport.{pn,fn1,build,heroHtml,radarHtml,narrativeHtml,systemsHtml,bindRadar,titleOf}` 各 task 一致;input/ctx 欄位名統一 scores/conf/overs/unders/neutral/now/pf/topKey。
