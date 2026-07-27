# hybrid 接開場四卡 實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** v3 開場四卡搬家到 hybrid(資料進 bagua-hybrid-data.js 單一真相源),hybrid 開頭接上四卡儀式,v3 改讀新家、行為不變。

**Architecture:** 純既有頁面修改;INTRO 資料由 v3-data 移到 hybrid-data(v3 已載 hybrid-data,零新依賴);hybrid 移植 v3 的開場 CSS/JS 三函式。

**Tech Stack:** 原生 JS;TESTRUN=python3 -m http.server 8899(於 octenso/)+ headless Chrome 讀 title(controller 執行;implementer 環境無 Chrome,只做靜態驗證)。

## Global Constraints

- 分支:`octenso/hybrid-intro`(已建)。
- 四卡文案**原樣搬移一字不動**;不動題本/計分/v1/v2/Worker。
- meta A 同源:INTRO 只存一份(hybrid-data);v3-data 刪除後不得殘留。
- reduced-motion CSS 必須一併移植;無 emoji;無外部絕對網址 script。
- TESTRUN 指令同前計畫(--headless=new --virtual-time-budget=60000 --dump-dom 讀 title)。

---

### Task 1: INTRO 搬家(hybrid-data ← v3-data;v3 改讀新家)

**Files:**
- Modify: `octenso/bagua-hybrid-data.js`(export 區前加 INTRO 四項)
- Modify: `octenso/bagua-v3-data.js:14-32,79`(刪 INTRO 區與 export 四鍵)
- Modify: `octenso/bagua-v3.html:551,561,562,570`(X3.INTRO* → H.INTRO*)
- Test: `octenso/bagua-v3.test.html:17-19`(X3.INTRO → H.INTRO;該檔需已載 bagua-hybrid-data.js,若無則補 script 標籤)

**Interfaces:**
- Produces: `OCTENSO_HYBRID.INTRO`(4 卡陣列,欄位 kicker/motif/t/s)、`INTRO_NEXT`、`INTRO_GO`、`INTRO_SKIP`(Task 2 依賴)。

- [ ] **Step 1: 紅燈**——`bagua-v3.test.html` 17-19 行三條斷言把 `X3.INTRO` 改 `H.INTRO`(檔頭確認有 `var H=window.OCTENSO_HYBRID` 或同義取用;若無,補 `var H=window.OCTENSO_HYBRID;`,並確認該測試頁 script 載入清單含 `bagua-hybrid-data.js`,若無則在 `bagua-v3-data.js` 之前補上)。跑不了瀏覽器就先用 node-free 靜態確認:`grep -c "H.INTRO" octenso/bagua-v3.test.html` 應=3。

- [ ] **Step 2: 搬資料**——`bagua-hybrid-data.js`:在 `var CTXD_SCALE` 之前插入(從 v3-data 原樣搬,含註解):

```js
  // ── 開場四卡(進場施測語:安定→站位→怎麼答→接下來;2026-07-15 自 v3-data 搬入,單一真相源)──
  var INTRO = [
    { kicker: '安定', motif: 'breathe',
      t: '先停一下,\n深呼吸。',
      s: '這不是考試——\n沒有好答案,也沒有人在打分數。' },
    { kicker: '這是在看誰', motif: 'orbit',
      t: '是你最放鬆時\n自然的樣子。',
      s: '沒人要求你的時候,你會怎麼反應——\n不是你想成為的樣子,\n也不是工作、家庭要你扮的角色。' },
    { kicker: '怎麼答', motif: 'compass',
      t: '憑第一個\n冒出來的直覺。',
      s: '別想太多——\n直覺,往往比想出來的答案\n更接近真正的你。' },
    { kicker: '接下來', motif: 'ring8',
      t: '這一次,\n有人陪你一起看。',
      s: '答完不會只丟給你一份報告——\n伴讀會一段一段陪你讀,\n你隨時可以說「不像我」。' }
  ];
  var INTRO_NEXT = '下一步';
  var INTRO_GO = '開始對話 →';
  var INTRO_SKIP = '直接開始';
```

並在 `g.OCTENSO_HYBRID = {` 物件加:

```js
    INTRO: INTRO, INTRO_NEXT: INTRO_NEXT, INTRO_GO: INTRO_GO, INTRO_SKIP: INTRO_SKIP,
```

- [ ] **Step 3: v3-data 刪除**——刪 14-32 行 INTRO 區塊與 79 行 export 的 `INTRO: INTRO, INTRO_NEXT: INTRO_NEXT, INTRO_GO: INTRO_GO, INTRO_SKIP: INTRO_SKIP,`。`grep -c "INTRO" octenso/bagua-v3-data.js` 應=0。

- [ ] **Step 4: v3.html 改讀新家**——`:551` `cards=X3.INTRO` → `cards=H.INTRO`;`:561` `X3.INTRO_NEXT` → `H.INTRO_NEXT`;`:562` `X3.INTRO_SKIP` → `H.INTRO_SKIP`;`:570` 兩處 `X3.INTRO_GO`/`X3.INTRO_NEXT` → `H.*`(確認 v3.html 內 `H` 變數=OCTENSO_HYBRID 已存在,line 126 已載檔、變數宣告處確認)。`grep -c "X3.INTRO" octenso/bagua-v3.html` 應=0。

- [ ] **Step 5: 靜態驗證+Commit**(controller 會補跑 TESTRUN v3 期望 26/0):

```bash
python3 - <<'PY'
import re
d=open('octenso/bagua-hybrid-data.js',encoding='utf-8').read()
assert d.count('kicker:')==4 and 'INTRO_GO' in d, 'INTRO 未搬齊'
v=open('octenso/bagua-v3-data.js',encoding='utf-8').read()
assert 'INTRO' not in v, 'v3-data 殘留 INTRO'
print('OK')
PY
git add octenso/bagua-hybrid-data.js octenso/bagua-v3-data.js octenso/bagua-v3.html octenso/bagua-v3.test.html
git commit -m "refactor: 開場四卡 INTRO 搬家至 hybrid-data(單一真相源),v3 改讀新家"
```

---

### Task 2: hybrid 接開場四卡

**Files:**
- Modify: `octenso/bagua-hybrid.html`(CSS、body、JS 三函式、入口)
- Test: `octenso/bagua-hybrid.test.html`

**Interfaces:**
- Consumes: Task 1 的 `H.INTRO`/`H.INTRO_NEXT`/`H.INTRO_GO`/`H.INTRO_SKIP`。

- [ ] **Step 1: 紅燈**——`bagua-hybrid.test.html`:

資料斷言(「轉介文案 ×8」之後):

```js
  t('開場四卡已搬入 hybrid-data', H.INTRO && H.INTRO.length===4 && H.INTRO[3].t.indexOf('陪')>=0 && H.INTRO_GO.length>2);
```

E2E:walker 頂部(取 opt 之前)加開場卡處理:

```js
    var inext=doc.getElementById('intro-next');
    if(inext && !doc.getElementById('intro').classList.contains('hide')){ inext.click(); return; }
```

`assertAll` 加:

```js
    t('e2e 開場卡出現過', txt.indexOf('深呼吸')>=0);
    t('e2e 開場卡已收起', doc.getElementById('intro').classList.contains('hide'));
```

- [ ] **Step 2: hybrid.html CSS**——在既有 `.prog` 規則前插入 v3 的開場 CSS(原樣):

```css
  /* ── 開場四卡(進場施測語;自 v3 移植)── */
  #intro{max-width:440px;margin:14px auto 0;text-align:center}
  .icard{display:none;animation:ifade .6s ease}
  .icard.on{display:block}
  @keyframes ifade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
  .imotif{height:96px;display:flex;align-items:center;justify-content:center;margin-bottom:20px}
  .ikicker{font-family:"Jost",ui-sans-serif,sans-serif;font-size:10.5px;letter-spacing:.2em;color:var(--muted);text-transform:uppercase;margin-bottom:16px}
  .it{font-family:"Songti TC","Noto Serif TC",serif;font-weight:500;font-size:22px;line-height:1.7;letter-spacing:.03em;color:var(--ink);white-space:pre-line}
  .is{font-size:15px;color:var(--ink-soft);line-height:1.95;margin-top:13px;white-space:pre-line}
  .idots{display:flex;gap:8px;justify-content:center;margin:30px 0 20px}
  .idots i{width:7px;height:7px;border-radius:50%;background:var(--hair);transition:.3s}
  .idots i.on{background:var(--gold);width:20px;border-radius:4px}
  .inav{display:flex;align-items:center;justify-content:center;gap:16px}
  .iback{font-family:"Jost",ui-sans-serif,sans-serif;font-size:12px;letter-spacing:.1em;color:var(--muted);background:none;border:none;cursor:pointer;opacity:.7}
  .iback:hover{opacity:1}.iback.hide{visibility:hidden}
  .iskip{display:block;margin:14px auto 0;font-size:11.5px;color:var(--muted);background:none;border:none;cursor:pointer;letter-spacing:.08em}
  .iskip:hover{color:var(--ink)}
  .ibreathe{transform-origin:center;animation:ibr 3.4s ease-in-out infinite}
  @keyframes ibr{0%,100%{transform:scale(.82);opacity:.55}50%{transform:scale(1);opacity:1}}
  @media (prefers-reduced-motion:reduce){.ibreathe{animation:none}.icard{animation:none}}
```

- [ ] **Step 3: hybrid.html body**——`<div class="prog">` 改 `<div class="prog hide" id="prog">`;其前插 `<div id="intro"></div>`;`<div id="chat">` 改 `<div id="chat" class="hide">`;`<div class="honest" id="honest">` 加 `hide` class。

- [ ] **Step 4: hybrid.html JS**——在 `begin()` 之前插入 v3 的三段(原樣,esc/$ 已存在):

```js
// ── 開場四卡(進場施測語;呼吸動畫;自 v3 移植,資料=H.INTRO)──
function motifSvg(kind){
  var s='<svg width="96" height="96" viewBox="0 0 96 96">';
  if(kind==='breathe'){
    s+='<g class="ibreathe"><circle cx="48" cy="48" r="14" fill="none" stroke="var(--gold)" stroke-width="1.4"/>'
      +'<circle cx="48" cy="48" r="26" fill="none" stroke="var(--gold)" stroke-width="1" opacity=".5"/>'
      +'<circle cx="48" cy="48" r="38" fill="none" stroke="var(--gold)" stroke-width="1" opacity=".25"/></g>';
  } else if(kind==='orbit'){
    s+='<circle cx="48" cy="48" r="30" fill="none" stroke="var(--gold)" stroke-width="1.6" stroke-dasharray="160 26" stroke-linecap="round" transform="rotate(20 48 48)"/>'
      +'<circle cx="48" cy="48" r="4" fill="var(--gold)"/>';
  } else if(kind==='compass'){
    s+='<circle cx="48" cy="48" r="6" fill="var(--gold)"/><g stroke="var(--gold)" stroke-width="1.4" stroke-linecap="round" opacity=".7">'
      +'<line x1="48" y1="25" x2="48" y2="15"/><line x1="48" y1="71" x2="48" y2="81"/>'
      +'<line x1="25" y1="48" x2="15" y2="48"/><line x1="71" y1="48" x2="81" y2="48"/>'
      +'<line x1="32" y1="32" x2="25" y2="25"/><line x1="64" y1="64" x2="71" y2="71"/>'
      +'<line x1="64" y1="32" x2="71" y2="25"/><line x1="32" y1="64" x2="25" y2="71"/></g>';
  } else { // ring8:八點成環
    for(var i=0;i<8;i++){var a=(-90+i*45)*Math.PI/180,x=48+Math.cos(a)*34,y=48+Math.sin(a)*34;
      s+='<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="3.4" fill="var(--gold)" opacity="'+(0.35+0.08*i).toFixed(2)+'"/>';}
  }
  return s+'</svg>';
}
function buildIntro(done){
  var wrap=$('intro'),idx=0,cards=H.INTRO;
  var h='';
  cards.forEach(function(c,i){
    h+='<div class="icard'+(i===0?' on':'')+'"><div class="imotif">'+motifSvg(c.motif)+'</div>'
      +'<div class="ikicker">'+esc(c.kicker)+'</div>'
      +'<div class="it">'+esc(c.t)+'</div>'
      +'<div class="is">'+esc(c.s)+'</div></div>';
  });
  h+='<div class="idots">'+cards.map(function(_,i){return '<i'+(i===0?' class="on"':'')+'></i>';}).join('')+'</div>'
    +'<div class="inav"><button class="iback hide" id="intro-back">← 上一步</button>'
    +'<button class="btn" id="intro-next">'+esc(H.INTRO_NEXT)+'</button></div>'
    +'<button class="iskip" id="intro-skip">'+esc(H.INTRO_SKIP)+'</button>';
  wrap.innerHTML=h;
  var els=wrap.querySelectorAll('.icard'),dots=wrap.querySelectorAll('.idots i');
  var next=$('intro-next'),back=$('intro-back');
  function show(i){
    els[idx].classList.remove('on');idx=i;els[idx].classList.add('on');
    for(var j=0;j<els.length;j++)dots[j].className=(j===idx?'on':'');
    back.className='iback'+(idx===0?' hide':'');
    next.textContent=(idx===els.length-1)?H.INTRO_GO:H.INTRO_NEXT;
  }
  function finish(){wrap.classList.add('hide');done();}
  next.onclick=function(){ if(idx<els.length-1)show(idx+1); else finish(); };
  back.onclick=function(){ if(idx>0)show(idx-1); };
  $('intro-skip').onclick=finish;
}
function reveal(){ // 開場結束→亮出聊天介面
  $('prog').classList.remove('hide');
  $('chat').classList.remove('hide');
  $('honest').classList.remove('hide');
}
```

- [ ] **Step 5: hybrid.html 入口改**——現有尾段:

```js
var saved=load();
if(saved&&saved.phase&&saved.phase!=='hello'&&saved.phase!=='talk'){
  S=saved;
  $('intro').classList.add('hide');reveal();
  bot(CH.resume);
  askOpts([{t:CH.resumeGo,v:'go',cls:'primary'},{t:CH.resumeReset,v:'reset'}],function(o){
    if(o.v==='reset'){
      S={phase:'hello',idx:0,answers:new Array(NB).fill(null),fcAns:new Array(NF).fill(null),
         flags:[],costQ:[],costAns:[],costIdx:0,mods:{},echo:{},unlikeAsked:false,echoCtx:false};
      save();begin();return;
    }
    if(S.phase==='core'){stage('core');stepCore();}
    else if(S.phase==='cost'){stage('cost');stepCost();}
    else{stage('summary');toSummary();}
  });
} else if(saved&&saved.phase==='talk'){
  S=saved;$('intro').classList.add('hide');reveal();stage('summary');toSummary();
} else {
  buildIntro(function(){reveal();begin();});
}
```

(即:兩個 resume 分支加 `$('intro').classList.add('hide');reveal();`,全新使用者走 buildIntro→reveal→begin。注意 prog 進度條函式 `prog()` 名稱與新 id="prog" 元素不衝突——函式操作的是 `prog-i`,原樣即可。)

- [ ] **Step 6: 靜態驗證+Commit**(controller 補跑 TESTRUN hybrid+v3 全綠後才算完):

```bash
grep -c "buildIntro\|motifSvg\|reveal" octenso/bagua-hybrid.html   # 應 >=6(定義+呼叫)
git add octenso/bagua-hybrid.html octenso/bagua-hybrid.test.html
git commit -m "feat(hybrid): 接開場四卡(安定→站位→直覺→陪讀),resume 不重播"
```

---

## Self-Review 紀錄

- Spec 覆蓋:搬家=Task 1;接開場=Task 2;文案零改寫=兩 task 皆原樣搬;驗證=紅綠燈+controller TESTRUN。
- 佔位掃描:全部實碼。
- 一致性:H.INTRO* 鍵名四處一致;id(intro/intro-next/intro-back/intro-skip/prog)與 CSS/測試一致;esc/$ 皆為 hybrid 既有函式。
