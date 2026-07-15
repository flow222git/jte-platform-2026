# hybrid 動線微調 實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** bagua-hybrid 開場直進指導語、「不太像」首次轉介(情境/底色 v1)、v2 報告移除狀態分區小平面。

**Architecture:** 三個既有頁面的行為修改,無新檔;文案全在 canonical 資料檔(bagua-hybrid-data.js),頁內不散寫;測試=既有兩個 .test.html 頁(title 回報 RESULT)。

**Tech Stack:** 原生 JS(無框架、無 node);測試:python3 -m http.server + headless Chrome 讀 title。

## Global Constraints

- 分支:`octenso/hybrid-flow-tune`(已建,spec 已 commit)。
- 不動:計分/題本/B2 碼、伴讀 Worker、v1 頁、vector.js 本體、G 系護欄。
- 文案(已過 speak-human-tw,一字不差使用):
  - `unlikeProbe`: `想多問一句:這份結果照的是「最近一個月」的你。這一段,會不會其實比較像某個情境裡的你?像是工作中的你,或感情裡的你。`
  - `unlikeCtx`: `對,比較像某個情境的我`
  - `unlikeBase`: `想測測看底色的我`
  - `unlikeGo`: `先繼續`
  - `unlikeCtxAck`: `好,我記著。題目問的是最近的日常;情境裡的你,等等有小關卡可以看。`
  - `unlikeBaseAck`: `底色版開在新分頁了。這裡我們先繼續,兩邊可以對照著看。`
  - `ctxRemind`: `剛剛你提到,有一段比較像「情境裡的你」。下面的對境耗能小關卡,測的就是那個場域正在需要你什麼。`
  - `baseBtn`: `底色版(第一版)`
- 半形標點慣例;無 emoji;頁面不可有外部絕對網址 script。
- 測試指令(記為 TESTRUN,兩頁通用;跑前先 `pkill -f "http.server 8899"` 清舊伺服器):

```bash
cd /Users/chenchiehyi/vscode/jte-platform-2026/octenso
python3 -m http.server 8899 &>/dev/null & SRV=$!
sleep 1
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu \
  --virtual-time-budget=60000 --dump-dom "http://localhost:8899/<PAGE>.test.html" 2>/dev/null \
  | grep -o '<title>[^<]*</title>'
kill $SRV
```

預期輸出:`<title>RESULT pass=N fail=0</title>`(N 依頁而定)。

---

### Task 1: 開場直進+死文案清理(hybrid)

**Files:**
- Modify: `octenso/bagua-hybrid-data.js`(CHAT 物件)
- Modify: `octenso/bagua-hybrid.html:116-117`(S 初始)、`:304-305`(revealEnd)、`:447`(ground)、`:479`(letter)、`:503-532`(askQuestion/begin)、`:538-540`(reset)
- Test: `octenso/bagua-hybrid.test.html`

**Interfaces:**
- Produces: `begin()` 直接進 core;`S.ask` 欄位消失(Task 2 的 S 初始以本 task 版本為基礎)。

- [ ] **Step 0: 基線**——先跑 TESTRUN(bagua-hybrid),記下現況 `pass=N fail=0` 的 N(預期全綠;若基線就有 fail,停下回報)。

- [ ] **Step 1: 改測試(紅燈)**——`bagua-hybrid.test.html`:

第 17 行改為(askIntro 改斷言不存在):

```js
  t('衡鑑式欄位', H.CHAT.askIntro===undefined && H.CHAT.segAsk.length===3 && H.CHAT.ackUnlike.indexOf('珍貴')>=0 && H.CHAT.letterTitle.indexOf('今天的整理')>=0);
  t('開場問句已移除', ['askIntro','askPlaceholder','askSend','askSkip','askEcho','segEndAsk','letterAsk'].every(function(k){return H.CHAT[k]===undefined;}));
```

E2E `assertAll` 內加兩條(放在「e2e 過場語出現」之前):

```js
    t('e2e 無開場問句', txt.indexOf('最想多了解自己')<0);
    t('e2e 指導語直出', txt.indexOf('想著「最近一個月的日常」')>=0);
```

- [ ] **Step 2: 跑測試確認紅燈**

Run: TESTRUN(bagua-hybrid)
Expected: `fail>0`(衡鑑式欄位/開場問句已移除 兩條 FAIL;E2E 兩條此時 PASS 與否不拘)。

- [ ] **Step 3: 改 bagua-hybrid-data.js**——CHAT 物件刪除七個鍵(整行刪):`askIntro`、`askPlaceholder`、`askSend`、`askSkip`、`askEcho`、`segEndAsk`、`letterAsk`。其餘不動。

- [ ] **Step 4: 改 bagua-hybrid.html**

4a. S 初始(116-117 行)`ask:null,` 拿掉:

```js
var S={phase:'hello',idx:0,answers:new Array(NB).fill(null),fcAns:new Array(NF).fill(null),
       flags:[],costQ:[],costAns:[],costIdx:0,mods:{},echo:{}};
```

4b. `revealEnd` 首行(305)改:

```js
  bot(CH.segEndNoAsk);
```

4c. `ground()` 刪除這一行(447):

```js
  if(S.ask)L.push('【使用者帶來的問題】'+S.ask+'——請在對話中回應它。');
```

4d. `letter()` 刪除這一行(479):

```js
  if(S.ask)L.push(CH.letterAsk.replace('{Q}',S.ask));
```

4e. 刪除整個 `askQuestion()` 函式(503-526 行,含其上註解「開場收『你的問題』」),`begin()` 改:

```js
function begin(){
  CH.hello.forEach(function(t){bot(t);});
  askOpts([{t:CH.startBtn,v:'go',cls:'primary'}],function(){
    bot(CH.coreIntro);stage('core');stepCore();
  });
}
```

4f. resume 的 reset 物件(538-540)同步拿掉 `ask:null`:

```js
      S={phase:'hello',idx:0,answers:new Array(NB).fill(null),fcAns:new Array(NF).fill(null),
         flags:[],costQ:[],costAns:[],costIdx:0,mods:{},echo:{}};
```

(舊 localStorage 若殘留 ask 欄位:load() 只驗 answers 長度,多餘欄位無害,不需遷移。)

- [ ] **Step 5: 跑測試綠燈**

Run: TESTRUN(bagua-hybrid)
Expected: `RESULT pass=N+3 fail=0`(原 N 因第 17 行仍是 1 條、新增「開場問句已移除」+ E2E 2 條 = +3;以實跑為準,fail 必須=0)。

- [ ] **Step 6: Commit**

```bash
git add octenso/bagua-hybrid.html octenso/bagua-hybrid-data.js octenso/bagua-hybrid.test.html
git commit -m "feat(hybrid): 開場直進指導語,移除收問句步驟與死文案"
```

---

### Task 2: 「不太像」轉介動線(hybrid)

**Files:**
- Modify: `octenso/bagua-hybrid-data.js`(CHAT 加 8 鍵)
- Modify: `octenso/bagua-hybrid.html`(askEcho、S 初始、revealEnd、reset)
- Test: `octenso/bagua-hybrid.test.html`

**Interfaces:**
- Consumes: Task 1 後的 begin()/S 形狀。
- Produces: `S.unlikeAsked`(bool)、`S.echoCtx`(bool);CH 新鍵名如 Global Constraints 所列。

- [ ] **Step 1: 改測試(紅燈)**——`bagua-hybrid.test.html`:

資料斷言(加在「界線句」之後):

```js
  t('轉介文案 ×8', ['unlikeProbe','unlikeCtx','unlikeBase','unlikeGo','unlikeCtxAck','unlikeBaseAck','ctxRemind','baseBtn'].every(function(k){return H.CHAT[k]&&H.CHAT[k].length>2;}));
  t('轉介 probe 講最近一個月', H.CHAT.unlikeProbe.indexOf('最近一個月')>=0);
```

E2E 改走「第一段核對答不太像→選情境→其餘答很像」:walker 的點擊邏輯(50-51 行)改為:

```js
    var opt=doc.querySelector('.opts-live .opt');
    if(opt && clicks<80){
      clicks++;
      var opts=[].slice.call(doc.querySelectorAll('.opts-live .opt'));
      var unlike=null,ctx=null;
      opts.forEach(function(b){
        if(b.textContent==='不太像')unlike=b;
        if(b.textContent===H.CHAT.unlikeCtx)ctx=b;
      });
      if(unlike && !unlikeDone){unlikeDone=true;unlike.click();return;}
      if(ctx){ctx.click();return;}
      opt.click();return;
    }
```

並在 walker 變數區(40 行)加 `var unlikeDone=false;`。

`assertAll` 內:第 68 行改+新增:

```js
    t('e2e 分段核對:峰名=不太像,其餘=很像', St.echo.peak==='unlike' && St.echo.gate==='like' && St.echo.level==='like');
    t('e2e 轉介 probe 出現一次', txt.indexOf('會不會其實比較像某個情境裡的你')>=0);
    t('e2e 選了情境→ack+結尾提醒', txt.indexOf('好,我記著')>=0 && txt.indexOf('對境耗能小關卡,測的就是')>=0);
    t('e2e 結尾卡有底色版按鈕', !!doc.querySelector('a.btn.ghost[href="bagua-persona.html"]'));
    t('e2e 狀態旗標', St.unlikeAsked===true && St.echoCtx===true);
```

(第 69 行「收到,謝謝你」斷言保留——gate/level 段仍答很像。)

- [ ] **Step 2: 跑測試確認紅燈**

Run: TESTRUN(bagua-hybrid)
Expected: 轉介文案/E2E 新斷言 FAIL。

- [ ] **Step 3: 改 bagua-hybrid-data.js**——CHAT 物件在 `ackUnlike` 之後插入(文案一字不差用 Global Constraints 版本):

```js
    unlikeProbe: '想多問一句:這份結果照的是「最近一個月」的你。這一段,會不會其實比較像某個情境裡的你?像是工作中的你,或感情裡的你。',
    unlikeCtx: '對,比較像某個情境的我',
    unlikeBase: '想測測看底色的我',
    unlikeGo: '先繼續',
    unlikeCtxAck: '好,我記著。題目問的是最近的日常;情境裡的你,等等有小關卡可以看。',
    unlikeBaseAck: '底色版開在新分頁了。這裡我們先繼續,兩邊可以對照著看。',
    ctxRemind: '剛剛你提到,有一段比較像「情境裡的你」。下面的對境耗能小關卡,測的就是那個場域正在需要你什麼。',
    baseBtn: '底色版(第一版)',
```

- [ ] **Step 4: 改 bagua-hybrid.html**

4a. S 初始與 reset 物件各加兩旗標(兩處同步):

```js
       flags:[],costQ:[],costAns:[],costIdx:0,mods:{},echo:{},unlikeAsked:false,echoCtx:false};
```

4b. `askEcho` 全函式替換:

```js
function askEcho(key,next){
  askOpts(CH.segAsk.map(function(t,i){return{t:t,v:['like','part','unlike'][i]};}),function(o){
    S.echo[key]=o.v;save();
    if(o.v==='unlike'&&!S.unlikeAsked){
      S.unlikeAsked=true;save();
      bot(CH.ackUnlike);
      bot(CH.unlikeProbe);
      askOpts([{t:CH.unlikeCtx,v:'ctx'},{t:CH.unlikeBase,v:'base'},{t:CH.unlikeGo,v:'go'}],function(o2){
        if(o2.v==='ctx'){S.echoCtx=true;save();bot(CH.unlikeCtxAck);}
        else if(o2.v==='base'){try{window.open('bagua-persona.html','_blank');}catch(e){}bot(CH.unlikeBaseAck);}
        next();
      });
      return;
    }
    bot(o.v==='like'?CH.ackLike:o.v==='part'?CH.ackPart:CH.ackUnlike);
    next();
  });
}
```

4c. `revealEnd`:結尾卡 links 加 ghost 按鈕(晶體按鈕後):

```js
    +'<a class="btn ghost" href="bagua-persona.html">'+esc(CH.baseBtn)+'</a></div>','cardmsg');
```

並在 `bot(CH.moduleAsk);` 前加:

```js
  if(S.echoCtx)bot(CH.ctxRemind);
```

- [ ] **Step 5: 跑測試綠燈**

Run: TESTRUN(bagua-hybrid)
Expected: `fail=0`(pass 數以實跑為準)。

- [ ] **Step 6: Commit**

```bash
git add octenso/bagua-hybrid.html octenso/bagua-hybrid-data.js octenso/bagua-hybrid.test.html
git commit -m "feat(hybrid): 不太像首次轉介動線(情境/底色v1)+結尾底色版入口"
```

---

### Task 3: 移除狀態分區小平面(v2)

**Files:**
- Modify: `octenso/bagua-persona-v2.html:100-102`(CSS)、`:405-429`(snapPlane)、`:575`(呼叫)、`:582`(說明行)
- Test: `octenso/bagua-persona-v2.test.html:77-80`

**Interfaces:**
- Consumes: 無(獨立頁)。

- [ ] **Step 0: 基線**——TESTRUN(bagua-persona-v2)記錄現況全綠 N。

- [ ] **Step 1: 改測試(紅燈)**——`bagua-persona-v2.test.html` 第 77-80 行的 B2 case:
  - `expects` 陣列移除三個字串:`'同強'`、`'低載'`、`'判讀的門檻'`。
  - `dom` 兩條改為反斷言:

```js
     dom:[{n:'狀態分區小平面已移除', f:function(doc){return doc.querySelectorAll('svg.splane').length===0;}}],
```

- [ ] **Step 2: 跑測試確認紅燈**

Run: TESTRUN(bagua-persona-v2)
Expected: `狀態分區小平面已移除` FAIL(頁面還有 4 張)。

- [ ] **Step 3: 改 bagua-persona-v2.html**
  - 刪 `snapPlane()` 整個函式(405-429 行,含其上「狀態分區小平面」註解)。
  - 575 行 `+'</div>'+snapPlane(ax)+'</div>'` → `+'</div></div>'`。
  - 刪 582 行整行(「小平面圖:底圖分區就是判讀的門檻…」)。
  - 刪 CSS `102: .pair .splane{flex:none}`(`.duo/.bars` 保留,音量條自然滿版)。
  - 檢查 `grep -n "OctensoVector\|vector.js" octenso/bagua-persona-v2.html`:若 snapPlane 是唯一使用處,連同 `<script src="vector.js">`(如有)一併移除;若頁面本無載入 vector.js(snapPlane 取 window 全域、由他頁載入),則無事。把檢查結果寫進報告。

- [ ] **Step 4: 跑測試綠燈**

Run: TESTRUN(bagua-persona-v2)
Expected: `fail=0`。

- [ ] **Step 5: 回歸**——再跑一次 TESTRUN(bagua-hybrid)確認 Task 1/2 未被影響(hybrid 結尾連到 v2 的連結仍在)。
Expected: `fail=0`。

- [ ] **Step 6: Commit + push**

```bash
git add octenso/bagua-persona-v2.html octenso/bagua-persona-v2.test.html
git commit -m "feat(v2): 移除狀態分區小平面,四對只留音量條"
git push -u origin octenso/hybrid-flow-tune
```

---

## Self-Review 紀錄

- Spec 覆蓋:①=Task 1;②=Task 2;③=Task 3;④文案已在計畫內定稿(過 speak-human-tw);⑤兩 test 頁=各 task 的紅綠燈。無缺。
- 佔位掃描:所有步驟含完整程式碼與文案;無 TBD。
- 一致性:CH 鍵名(unlikeProbe 等 8 鍵)在 data/html/test 三處拼寫一致;S 旗標 unlikeAsked/echoCtx 在初始/reset/askEcho/assertAll 一致;TESTRUN 兩頁共用。
