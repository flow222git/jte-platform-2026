# 結果頁 v3.2 上正式頁(bagua-persona.html)實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 依 `docs/superpowers/specs/2026-07-23-report-v32-demo-design.md`,把 v3.2 結構(命名者名(卦)、雷達升主線可點、敘事總述先行、四系統加詳、移除速寫圓相圖)改上正式頁 `octenso/bagua-persona.html`。

**Architecture:** 新文案全部進新 canonical 資料檔 `octenso/bagua-report-v32-data.js`(meta A 同源);頁內只加「組裝」函式。地形判別重用既有 `pShapeKey()`(七型),映射到三種開場策略。`ensoSVG()` 函式保留(「能量印記」分享仍用),只從敘事區塊移除。

**Tech Stack:** 無框架 vanilla JS(ES5 風格,與頁面一致)、iframe 測試頁(title 寫 `RESULT pass=X fail=Y`)、headless chromium 驗證。

## Global Constraints

- 命名(2026-07-23 Simon 定案):**用 canonical 現行名**——開創者/承載者/行動者/協作者/洞見者/沉潛者/守界者/共鳴者;四系統=建構/推動/認知/調節。demo 裡的 明現者/交流者/拓展者/沉澱者/喊停者/承接者/驅動/覺察 一律**不採用**。
- 顯示格式:`者名(卦)`,如 `開創者(乾)`;態雅稱只在深讀層出現。
- C1:並列不捏因果;四系統僅四對待可講關係;僅雷風(震巽)雙高=張力,天地雙高=完整格局(和諧)。
- 頁面不可引入外部絕對網址 script;全形標點跟隨頁面既有文案風格(正式頁文案用全形逗號)。
- AI 伴讀區**不在本輪**(平台尚無伴讀功能,另立專案)。
- 工作分支:`octenso-report-v32`;每 task 一 commit。
- 測試跑法:`bagua-persona.test.html` / `bagua-report-v32-data.test.html` 用 headless chrome 開啟,讀 `<title>` 應為 `RESULT pass=N fail=0`。指令(本機無 python/node):
  `"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu --virtual-time-budget=8000 --dump-dom "file:///E:/Vscode/jte-platform-2026/octenso/<測試頁>" 2>/dev/null | grep -o "<title>[^<]*</title>"`
  (iframe 同源:file:// 下 chrome 需加 `--allow-file-access-from-files`。)

---

### Task 1: canonical 資料檔 `bagua-report-v32-data.js`

**Files:**
- Create: `octenso/bagua-report-v32-data.js`
- Test: `octenso/bagua-report-v32-data.test.html`

**Interfaces:**
- Produces: `window.REPORT_V32 = { PLAIN, SCENE, OPEN, SYS_DETAIL }`
  - `PLAIN[k] = {lamp:string, short:string}`(k=八卦 key:qian/kun/zhen/xun/kan/li/gen/dui)——零術語白話短語
  - `SCENE[k] = string`(8 個「如果這是你」場景段)+ `SCENE.pattern = string`(格局型 fallback)
  - `OPEN = {contrast:fn, peak:fn, level:fn}` 開場模板函式(吃 plain 短語,回 `{story, punch}`)
  - `SYS_DETAIL[sysKey] = {nm, l, r, pull, shapes:{left,right,bothHigh,bothLow,even}}`,每 shape=`{read, prac}`;sysKey=build/drive/aware/regulate

- [ ] **Step 1: 寫失敗測試頁**

`octenso/bagua-report-v32-data.test.html`(整檔):

```html
<!doctype html><html><head><meta charset="utf-8"><meta name="robots" content="noindex, nofollow"><title>PENDING</title>
<script src="bagua-report-v32-data.js"></script></head><body><pre id="out">running...</pre>
<script>
var pass=0,fail=0,log=[];
function ok(c,m){ if(c){pass++;} else {fail++; log.push('FAIL: '+m);} }
try{
  var R=window.REPORT_V32, EK=['qian','kun','zhen','xun','kan','li','gen','dui'];
  ok(!!R,'REPORT_V32 存在');
  // PLAIN:八態零術語短語,不得含卦名字元(零術語紀律)
  EK.forEach(function(k){
    ok(R.PLAIN[k] && R.PLAIN[k].lamp && R.PLAIN[k].short, 'PLAIN.'+k+' 完整');
    ok(!/[乾坤震巽坎離艮兌]/.test(R.PLAIN[k].lamp+R.PLAIN[k].short), 'PLAIN.'+k+' 零術語');
  });
  // SCENE:8+pattern
  EK.forEach(function(k){ ok(typeof R.SCENE[k]==='string' && R.SCENE[k].length>20, 'SCENE.'+k); });
  ok(typeof R.SCENE.pattern==='string','SCENE.pattern');
  // OPEN:三策略,回 {story,punch},story 零術語
  var o1=R.OPEN.contrast(R.PLAIN.qian,R.PLAIN.gen);
  ok(o1.story && o1.punch && !/[乾坤震巽坎離艮兌]/.test(o1.story+o1.punch),'OPEN.contrast 零術語');
  ok(o1.punch.indexOf(R.PLAIN.qian.short)>=0 && o1.punch.indexOf(R.PLAIN.gen.short)>=0,'contrast punch 含兩端短語');
  var o2=R.OPEN.peak([R.PLAIN.qian]); ok(o2.story && o2.punch,'OPEN.peak 單峰');
  var o2b=R.OPEN.peak([R.PLAIN.qian,R.PLAIN.li]); ok(o2b.story.indexOf(R.PLAIN.li.lamp)>=0,'OPEN.peak 雙峰含第二盞燈');
  ['high','low','mid'].forEach(function(b){ var o3=R.OPEN.level(b); ok(o3.story && o3.punch,'OPEN.level '+b); });
  // SYS_DETAIL:四系統 × 五形,名用 canonical
  var SYS={build:'建構',drive:'推動',aware:'認知',regulate:'調節'};
  Object.keys(SYS).forEach(function(s){
    var d=R.SYS_DETAIL[s];
    ok(d && d.nm===SYS[s], s+' 系統名='+SYS[s]);
    ok(d.pull && d.pull.length>10, s+'.pull');
    ['left','right','bothHigh','bothLow','even'].forEach(function(sh){
      ok(d.shapes[sh] && d.shapes[sh].read.length>30 && d.shapes[sh].prac.length>10, s+'.'+sh+' read+prac');
    });
  });
  // C1:僅推動(雷風)雙高文案可含「張力」;建構雙高不可
  ok(R.SYS_DETAIL.drive.shapes.bothHigh.read.indexOf('張力')>=0,'推動雙高=張力');
  ok(R.SYS_DETAIL.build.shapes.bothHigh.read.indexOf('張力')<0,'建構雙高非張力');
}catch(e){ fail++; log.push('EXC: '+e.message); }
document.title='RESULT pass='+pass+' fail='+fail;
document.getElementById('out').textContent=document.title+'\n'+log.join('\n');
</script></body></html>
```

- [ ] **Step 2: 跑測試確認失敗**

Run(Global Constraints 的 chrome 指令,目標 `bagua-report-v32-data.test.html`)
Expected: `RESULT pass=1 fail=N`(僅第一條 fail 前不會過,REPORT_V32 不存在 → EXC 或大量 fail)

- [ ] **Step 3: 寫資料檔**

`octenso/bagua-report-v32-data.js`(整檔;文案=v0.1 研究假設,Simon 終審可改字):

```js
/* 結果頁 v3.2 canonical 文案(meta A 同源)。命名:者名(卦)=canonical 現行名。
   spec: docs/superpowers/specs/2026-07-23-report-v32-demo-design.md */
(function(){
'use strict';
// 零術語白話短語:lamp=「這盞燈做什麼」;short=punch 句用的極短語
var PLAIN={
 qian:{lamp:'讓事情開始',short:'開始'},
 kun:{lamp:'把事情接住、穩穩做完',short:'接住'},
 zhen:{lamp:'說動就動、先跑第一步',short:'起步'},
 xun:{lamp:'把人和資源連起來、借力使力',short:'借力'},
 kan:{lamp:'沉下去慢想、不急著給答案',short:'慢想'},
 li:{lamp:'把事情看清楚、也說清楚',short:'看清楚'},
 gen:{lamp:'讓事情停下、說到此為止',short:'結束'},
 dui:{lamp:'跟人有來有往、把話說開',short:'交流'}
};
// 「如果這是你」場景段(依最高態;pattern=格局型)
var SCENE={
 qian:'如果這是你：會議結束前十分鐘，你又提了一個新方向，大家眼睛一亮——而上週開的三個頭，還各自躺在半路上。你熟悉這個時刻，不是嗎？',
 kun:'如果這是你：大家散會後，留下來把待辦一條條收好的，常常是你。事情經過你的手，就會被穩穩接住——只是你自己的那一格，常排在最後。',
 zhen:'如果這是你：別人還在討論可不可行，你已經先做了一個小樣出來。「先試再說」是你的口頭禪——偶爾，煞車聲也是別人幫你踩的。',
 xun:'如果這是你：一件事卡住了，你第一個念頭是「誰認識誰」。你總能從人脈與資源裡繞出一條路——只是路開太多條時，自己也會迷路。',
 kan:'如果這是你：熱烈的討論裡你話不多，回家路上答案才慢慢浮上來。你的想法常常晚到，但比較深——只是別人不一定等得到它出口。',
 li:'如果這是你：一團混亂的局，你三句話就把重點攤在桌上，大家豁然開朗。你是把事情變清楚的那個人——只是太快說破，偶爾也刺人。',
 gen:'如果這是你：大家越聊越遠時，說「先到這裡」的是你。你知道何時該停、何時該收——只是別人有時把你的界線，讀成了距離。',
 dui:'如果這是你：氣氛僵住的時候，把話接起來的人是你。你一開口，房間就活了——只是散場後，你偶爾分不清是充了電、還是漏了電。',
 pattern:'如果這是你：不同的場合，你像換了一個人——會議裡能拍板、聚會裡能暖場、獨處時也坐得住。沒有哪一面特別搶戲，是你的各面都上得了場。'
};
// 開場策略(吃 PLAIN 條目,回 {story,punch};全零術語)
var OPEN={
 contrast:function(a,b){ return {
   story:'這一個月，你身上最亮的一盞燈，是「'+a.lamp+'」；而最安靜的角落，是「'+b.lamp+'」。一邊常常出場，一邊幾乎沒有戲份，亮處與空處之間，像一道斷崖。',
   punch:'所以這份快照想先說的，只有一句：你不缺'+a.short+'，你缺的可能是'+b.short+'。'
 };},
 peak:function(list){
   var story = (list.length>=2)
     ? '這一個月，你身上最常亮的燈有兩盞：「'+list[0].lamp+'」和「'+list[1].lamp+'」。它們輪流出場、也常常同台——你的日子，多半是被這兩股力氣推著走的。'
     : '這一個月，你身上有一盞特別亮的燈：「'+list[0].lamp+'」。大部分的日子，都是它在前面帶路。';
   return {story:story, punch:'這份快照想先說的是：你最亮的地方很清楚——值得想的，是別讓其他的燈，一直待在暗處。'};
 },
 level:function(band){
   if(band==='high') return {story:'這一個月，你身上的燈幾乎全亮著——每一種力氣都在場上，沒有明顯偏廢，也沒有明顯空白。',punch:'這份快照想先說的是：你不缺火力，值得看顧的是電量。'};
   if(band==='low') return {story:'這一個月，你身上的燈都調得比較暗——不是沒有力氣，比較像整體在省電、在蓄能。',punch:'這份快照想先說的是：安靜不等於空，可能只是還沒到你要亮的時候。'};
   return {story:'這一個月，你身上的燈有亮有暗，但沒有哪一盞特別搶眼——遇到什麼場面，就開哪一盞，換得很自然。',punch:'這份快照想先說的是：你的本錢不在單點，而在換檔。'};
 }
};
// 四系統詳細白話(canonical 系統名;shapes:left=偏左極(l),right=偏右極(r),bothHigh,bothLow,even)
// C1:僅 drive(雷風)雙高寫「張力」;build(天地)雙高=完整格局。
var SYS_DETAIL={
 build:{nm:'建構',l:'qian',r:'kun',
  pull:'這一對管的是「事情怎麼從無到有、再從有到完」：一邊起頭開路，一邊接住做完。',
  shapes:{
   left:{read:'你的形狀偏起頭——「開始新的」比「把手上的做完」更常出現。日常大概長這樣：點子與新局你來，收尾與維運常需要別人接手；找得到接手的人，你的開創才會真的落地。',prac:'這週挑一件已經開頭的事，親手把它做到「完成」而不是「交出去」。'},
   right:{read:'你的形狀偏承接——事情到你手上就會被穩穩接住、做完。日常大概長這樣：你是大家放心託付的人，但主動開一個自己想要的局，比較少出現。',prac:'這週為自己起一個小小的頭——一件沒人交辦、純粹你想做的事。'},
   bothHigh:{read:'開創與承接都很活躍——能起頭也能收尾，是完整的建構格局。日常大概長這樣：一件事從發起到落地你都扛得動；要留意的只是總量，別什麼都自己包。',prac:'挑一件事，刻意只做「起頭」或只做「收尾」，把另一半留給別人。'},
   bothLow:{read:'開創與承接目前都比較安靜——這陣子你比較少主導事情的生滅，可能在觀望、也可能在休息。這不是缺陷，是這個系統正在待機。',prac:'從最小的事練手感：今天決定一件小事、並把它做完。'},
   even:{read:'起頭與收尾在你身上大致平衡——需要開局時開得了，需要守成時守得住,沒有明顯偏用哪一邊。',prac:'觀察一週：記下你何時在開頭、何時在收尾，看看是場面決定的，還是你選的。'}
  }},
 drive:{nm:'推動',l:'zhen',r:'xun',
  pull:'這一對管的是「事情用什麼速度往前」：一邊說動就動、先跑再修，一邊不硬碰硬、讓影響慢慢滲進去。',
  shapes:{
   left:{read:'你的形狀偏行動——有念頭就先動，速度是你的語言。日常大概長這樣：你常是第一個把手弄髒的人；比較少用的是繞路、借力、等時機的柔勁。',prac:'下一件事開始前，先問一句「誰能幫我省一半力」再動。'},
   right:{read:'你的形狀偏協作——你不硬推,習慣順著人與勢把事情帶到位。日常大概長這樣：你的影響是滲透式的,不知不覺就成了;比較少出現的是當面破題、直球對決。',prac:'這週挑一件小事,不鋪陳、不繞路,直接把第一步踩下去。'},
   bothHigh:{read:'這是八態裡唯一會標「張力」的一對——你的兩邊同時偏高，「想立刻衝」和「想慢慢佈局」常在同一件事上互相拉扯，有時會覺得自己又急又繞。這不是缺點，是兩種好用的前進方式擠在同一個油門上。',prac:'把手上的事分兩堆：一件「就是要快」的用衝的，一件「急不得」的刻意放慢。'},
   bothLow:{read:'行動與協作目前都比較安靜——事情往前的動能這陣子偏低，可能是累了，也可能是還沒遇到值得推的事。',prac:'選一件真心想要的小事，今天只推進十五分鐘就好。'},
   even:{read:'衝勁與柔勁在你身上大致平衡——該快的時候快得起來，該繞的時候繞得過去。',prac:'下次推進卡住時，先辨認：這裡需要的是加速，還是換路？'}
  }},
 aware:{nm:'認知',l:'kan',r:'li',
  pull:'這一對管的是「你怎麼把事情弄懂」：一邊沉下去慢想、不急著給答案，一邊攤在光下、看清楚也說清楚。',
  shapes:{
   left:{read:'你的形狀偏沉澱——答案在你心裡熟成，不急著出口。日常大概長這樣：你想得深、看得遠,但別人常不知道你在想什麼;你的洞見需要一個出口。',prac:'這週把一個想了很久的念頭，講給一個人聽——講出來，它才開始工作。'},
   right:{read:'你的形狀偏明現——事情到你手上，很快就被攤開、被講明白。日常大概長這樣：你是把混亂變清楚的人；比較少出現的，是關起門慢慢泡著想的時間。',prac:'下次遇到重要的問題，先不說第一個想法，讓它過一夜再講。'},
   bothHigh:{read:'沉澱與明現都很活躍——既能往深處想，也能把想清楚的說明白，相成而不相礙。要留意的是腦子的總轉速：想與說都全開時，最容易累的是你自己。',prac:'每天留十分鐘什麼都不想、什麼都不說，讓系統散熱。'},
   bothLow:{read:'沉澱與明現目前都比較安靜——這陣子你比較少深想、也比較少表達，像認知系統在待機。有時這是飽和後的自然休息。',prac:'從輸入開始暖機：讀一篇好文章，寫下一句你的想法。'},
   even:{read:'深想與說明在你身上大致平衡——想得夠、也說得出，理解與表達接得起來。',prac:'把這個平衡用出去：幫一個想不清楚的人，陪他想、再幫他說。'}
  }},
 regulate:{nm:'調節',l:'gen',r:'dui',
  pull:'這一對管的是「你和世界的開關」：一邊劃界線、說到此為止，一邊跟人有來有往、把話說開。',
  shapes:{
   left:{read:'你的形狀偏守界——你知道何時該停、何時說不,節奏握在自己手上。日常大概長這樣：你的界線清楚,別人不容易越;只是有時,門關久了,想進來的人也就不敲了。',prac:'這週主動開一次門：約一個想聊的人，把近況說開。'},
   right:{read:'你的形狀偏交流——跟人互動是你的充電方式,但「停下來」這個開關比較少被按。日常大概長這樣：訊息都回、邀約都接、行事曆越來越滿,而「不要」這個字很少出場。',prac:'這週練習說一次完整的「不」——不解釋太多、不補償、不改口。'},
   bothHigh:{read:'守界與交流都很活躍——開得了口、也守得住線，進退有節，是調節健康的樣子。要留意的只是切換的成本：收放太頻繁,也會磨。',prac:'把「開門時段」和「關門時段」排進行事曆，讓切換有節奏。'},
   bothLow:{read:'守界與交流目前都比較安靜——這陣子你既少社交、也少刻意設界，像與世界保持一個淡淡的距離。',prac:'從低劑量開始：傳一則訊息給一個想念的人，就好。'},
   even:{read:'收與放在你身上大致平衡——能熱絡也能獨處,能答應也能拒絕。',prac:'留意這個平衡的來源：是自然的節奏，還是勉強維持的禮貌？'}
  }}
};
window.REPORT_V32={PLAIN:PLAIN,SCENE:SCENE,OPEN:OPEN,SYS_DETAIL:SYS_DETAIL};
})();
```

- [ ] **Step 4: 跑測試確認通過**

Run: 同 Step 2 指令
Expected: `RESULT pass=N fail=0`(N≈60)

- [ ] **Step 5: Commit**

```bash
git add octenso/bagua-report-v32-data.js octenso/bagua-report-v32-data.test.html
git commit -m "feat: v3.2 canonical 文案資料檔(零術語開場/場景/四系統詳解)+測試"
```

---

### Task 2: 命名 helper `pn()` 與峰名卡標題

**Files:**
- Modify: `octenso/bagua-persona.html`(`fn1` 附近,約 :1464;`signatureTitle` :1477;`<head>` 加 script 標籤)
- Test: `octenso/bagua-persona.test.html`

**Interfaces:**
- Consumes: 頁內 `E`(既有)
- Produces: `pn(k)` → `'開創者(乾)'`(者名取自 `E[k].title` 的「·」後段);後續 task 全用它

- [ ] **Step 1: 加測試**(`bagua-persona.test.html` 在「4d」段後加)

```js
    // 5. v3.2 命名:pn() 者名(卦)
    ok(typeof w.pn==='function' && w.pn('qian')==='開創者(乾)','pn(qian)=開創者(乾), got '+(w.pn&&w.pn('qian')));
    ok(w.pn('li')==='洞見者(離)' && w.pn('gen')==='守界者(艮)' && w.pn('dui')==='共鳴者(兌)','pn canonical 名');
    // 峰名卡:單峰標題用 者名(卦)
    w.answers=new Array(24).fill(0);
    w.QUESTIONS.forEach(function(q,i){ if(q.k==='qian') w.answers[i]=5; });
    w.showResult();
    ok(d.querySelector('.tc-title').textContent.indexOf('開創者(乾)')>=0,'單峰峰名卡=開創者(乾)');
```

- [ ] **Step 2: 跑測試確認失敗**(chrome 指令,加 `--allow-file-access-from-files`)
Expected: 新增各條 FAIL(`pn` undefined)

- [ ] **Step 3: 實作**

`<head>` 內、頁面主 script 之前加(和其他 data script 並列):

```html
<script src="bagua-report-v32-data.js"></script>
```

`fn1` 定義後加:

```js
function pn(k){ var t=E[k].title.split('·'); return t[t.length-1].trim()+'('+E[k].nm+')'; } // 者名(卦):開創者(乾)
```

`signatureTitle` 中 single/dual 兩行改用 pn:

```js
  if(sig.kind==='single'){ var e=E[k[0]]; return {sym:e.sym, title:pn(k[0]), sub:'', essence:e.essence}; }
  if(sig.kind==='dual'){ var a=E[k[0]],b=E[k[1]];
    return {sym:a.sym+b.sym, title:pn(k[0])+'×'+pn(k[1]), sub:'兩個並重的主調，會交替出現',
      essence:a.essence+'　同時，「'+fn1(k[1])+'」也同樣鮮明——你不是單一性格，而是這兩種能量輪流主導。'}; }
```

(multi/pattern 標題不動。)既有測試 `title.textContent.indexOf('開創者')` 與 `'沉潛者'` 仍通過(pn 含者名)。

- [ ] **Step 4: 跑測試確認通過** Expected: `RESULT pass=N fail=0`
- [ ] **Step 5: Commit** `git add octenso/bagua-persona.html octenso/bagua-persona.test.html && git commit -m "feat: v3.2 命名 pn()=者名(卦),峰名卡標題套用"`

---

### Task 3: 雷達升主線+可點解釋卡

**Files:**
- Modify: `octenso/bagua-persona.html`(`buildRadar` :1102-1195;`radarCard` :1846;`showResult` :1920、:1967)
- Test: `octenso/bagua-persona.test.html`

**Interfaces:**
- Consumes: `pn(k)`、`REPORT_V32.PLAIN`、`pf.bands`(既有 like/label)、conf
- Produces: `radarCard(now)` 含 `<div id="radar-detail">`;`radarSelect(k,pf,conf)` 填解釋卡;`buildRadar` 每態包 `<g class="rgrp" data-k>` 可點

- [ ] **Step 1: 加測試**

```js
    // 6. v3.2 雷達:主線(不在 details 裡)、可點、解釋卡預設最高態
    var rw=d.getElementById('radar-wrap');
    ok(rw && !rw.closest('details'),'雷達在主線,不在折疊區');
    ok(d.querySelectorAll('#radar-wrap g.rgrp').length===8,'雷達 8 個可點群組');
    var rd=d.getElementById('radar-detail');
    ok(rd && rd.textContent.indexOf('開創者(乾)')>=0,'解釋卡預設最高態(乾) 者名(卦)');
    // 點擊換態
    var giLi=d.querySelector('#radar-wrap g.rgrp[data-k="li"]');
    giLi.dispatchEvent(new w.Event('click',{bubbles:true}));
    ok(rd.textContent.indexOf('洞見者(離)')>=0,'點離角 → 解釋卡換洞見者(離)');
    // 標籤=者名
    var labels=Array.prototype.map.call(d.querySelectorAll('#radar-wrap text.rlabel'),function(t){return t.textContent;});
    ok(labels.indexOf('開創者')>=0 && labels.indexOf('守界者')>=0,'雷達角標=者名');
```

- [ ] **Step 2: 跑測試確認失敗** Expected: 上列各條 FAIL

- [ ] **Step 3: 實作**

(a) `buildRadar` 的 dots+labels 迴圈:每態的 dot/label/score 包進 `<g>`:

```js
  EKEYS.forEach(function(k){
    var g=document.createElementNS(NS,'g');
    g.setAttribute('class','rgrp'); g.setAttribute('data-k',k); g.style.cursor='pointer';
    // …原本 append 到 svg 的 dot、tx、ts 改 append 到 g…
    tx.textContent=pn(k).split('(')[0];          // 角標=者名
    svg.appendChild(g);
  });
```

(b) `radarCard` 加解釋卡容器與提示:

```js
function radarCard(now){
  return '<div class="radar-card"><div class="radar-wrap" id="radar-wrap"></div>'
    +'<div class="share-hint" style="margin-top:6px">'+(now?'松綠實線＝你的底色　·　金色虛線＝此刻。':'越往外越強。')+'點任一個角，看那一態代表什麼。</div>'
    +'<div class="block" id="radar-detail" style="margin-top:10px;text-align:left"></div>'
  +'</div>';
}
```

(c) 新函式(放 `radarCard` 後):

```js
function radarSelect(k,pf,conf){
  var box=document.getElementById('radar-detail'); if(!box) return;
  var v=(pf&&pf.scores[k])||0, b=pf&&pf.bands[k];
  var plain=(window.REPORT_V32&&REPORT_V32.PLAIN[k])?REPORT_V32.PLAIN[k].lamp:'';
  var cf=conf?(conf[k]==='firm'?'篤定':conf[k]==='mixed'?'兩可':''):'';
  box.innerHTML='<div style="display:flex;align-items:baseline;gap:10px;flex-wrap:wrap">'
    +'<b style="color:var(--ink)">'+pn(k)+'</b><span style="color:var(--pine)">'+v+'</span>'
    +(b?'<span style="color:'+(b.like?'var(--gold)':'var(--muted)')+';font-size:12px">'+b.label+(b.like?'你':'')+'</span>':'')+'</div>'
    +'<div style="margin-top:6px">'+plain+'。</div>'
    +(cf?'<div style="font-size:12px;color:var(--muted);margin-top:5px">作答篤定度：'+cf+(cf==='兩可'?'——這一態解讀時請保留彈性。':'')+'</div>':'');
  document.querySelectorAll('#radar-wrap g.rgrp').forEach?null:0;
  var gs=document.querySelectorAll('#radar-wrap g.rgrp');
  for(var i=0;i<gs.length;i++){ gs[i].style.opacity=(gs[i].getAttribute('data-k')===k)?'1':'0.75'; }
}
```

(d) `showResult`:主 html 裡 :1920 那行 `'<details class="rsec"><summary>看雷達…'+radarCard(now)+'</details>'` 改為直接 `+radarCard(now)`,並**上移到 typecard(:1917 `</div>` 之後)與「怎麼讀這張圖」之間`;渲染後(:1967 `appendChild(buildRadar(...))` 之後)加:

```js
  var top0=pf?pf.ranked[0].k:topKey;
  radarSelect(top0,pf,conf);
  var gs=document.querySelectorAll('#radar-wrap g.rgrp');
  for(var gi=0;gi<gs.length;gi++){ (function(g){ g.addEventListener('click',function(){ radarSelect(g.getAttribute('data-k'),pf,conf); }); })(gs[gi]); }
```

- [ ] **Step 4: 跑測試確認通過**
- [ ] **Step 5: Commit** `git commit -am "feat: v3.2 雷達升主線,者名角標+點角出解釋卡"`

---

### Task 4: persona 敘事(總述先行,併四幕;移除速寫圓)

**Files:**
- Modify: `octenso/bagua-persona.html`(`portraitNarrative` :1269-1310;`showResult` :1919)
- Test: `octenso/bagua-persona.test.html`

**Interfaces:**
- Consumes: `pShapeKey(pf)`、`REPORT_V32.OPEN/PLAIN/SCENE`、既有 b1/b2/b3 生成、`pn(k)`、conf
- Produces: `portraitNarrative(pf,costItems,neutral,conf)` 回傳新結構區塊(h3=「整體的你」;開場 story+punch 零術語;不含 ensoSVG)。`ensoSVG` 函式**保留**(能量印記分享用)。

- [ ] **Step 1: 加測試**

```js
    // 7. v3.2 敘事:總述先行、零術語開場、無速寫圓、含場景段
    w.answers=new Array(24).fill(0);
    w.QUESTIONS.forEach(function(q,i){ if(q.k==='qian') w.answers[i]=5; });
    w.showResult();
    var nb=d.getElementById('narrative-open');
    ok(nb,'總述區存在');
    ok(!/[乾坤震巽坎離艮兌]/.test(nb.textContent),'總述零術語(不含卦名)');
    ok(d.querySelector('.punch'),'punch 句存在');
    var blk=d.getElementById('result').innerHTML;
    ok(blk.indexOf('整體的你')>=0,'敘事區標題=整體的你');
    ok(blk.indexOf('如果這是你')>=0,'含場景段');
    ok(!d.querySelector('#narrative-block svg'),'敘事區無圓相圖');
    ok(typeof w.ensoSVG==='function','ensoSVG 函式保留(能量印記)');
    // 順序:雷達 < 敘事 < 四個系統
    ok(blk.indexOf('radar-wrap')<blk.indexOf('整體的你'),'雷達在敘事前');
```

- [ ] **Step 2: 跑測試確認失敗**

- [ ] **Step 3: 實作** — `portraitNarrative` 改為(整函式替換;b1/b2/b3 三拍邏輯原樣保留):

```js
function portraitNarrative(pf, costItems, neutral, conf){
  if(!pf) return '';
  function q(k){return '「'+fn1(k)+'」';}
  // …(原 overs/unders、b1、b2、b3 生成程式碼原樣保留)…
  // ── v3.2 開場總述(零術語;地形→策略:jagged→contrast,峰型→peak,其餘→level)──
  var R=window.REPORT_V32, open=null;
  if(R){
    var shape=pShapeKey(pf), lead=pf.ranked[0].k, low=pf.ranked[pf.ranked.length-1].k;
    if(shape==='jagged') open=R.OPEN.contrast(R.PLAIN[lead],R.PLAIN[low]);
    else if(shape==='single'||shape==='dual'||shape==='multi') open=R.OPEN.peak(pf.leads.slice(0,2).map(function(k){return R.PLAIN[k];}));
    else open=R.OPEN.level(pf.level.band);
  }
  // 場景段:峰型用最高態場景,否則 pattern
  var sceneK=(pf.signature.kind==='pattern')?'pattern':pf.leads[0];
  var scene=(R&&R.SCENE[sceneK])||'';
  // 整體可信度一句(逐態細節在雷達解釋卡)
  var mixedN=0; if(conf){ EKEYS.forEach(function(k){ if(conf[k]==='mixed') mixedN++; }); }
  var trust=mixedN?('大部分的題目你答得乾脆，輪廓可以放心讀；有 '+mixedN+' 個態你答得比較猶豫（雷達上點開標「兩可」的那幾角），那些分數請當作大概的位置。')
                  :'這次的題目你都答得乾脆，這份輪廓可以放心讀。';
  return '<div class="block" id="narrative-block"><h3>整體的你</h3>'
    +(open?'<div id="narrative-open">'+open.story+'<span class="punch" style="display:block;margin-top:10px;color:var(--ink);font-weight:600">'+open.punch+'</span></div>':'')
    +'<div class="portrait" style="margin-top:12px">'+b1+'</div>'
    +'<div class="portrait" style="margin-top:11px">'+b2+'</div>'
    +'<div class="portrait" style="margin-top:11px">'+b3+'</div>'
    +(scene?'<div class="portrait" style="margin-top:11px">'+scene+'</div>':'')
    +'<div class="pair-foot" style="margin-top:10px">'+trust+'</div>'
  +'</div>';
}
```

`showResult` :1919 呼叫處補第四參數 `conf`;此區塊位置移到 `radarCard` 之後(承 Task 3 的順序調整)。

- [ ] **Step 4: 跑測試確認通過**
- [ ] **Step 5: Commit** `git commit -am "feat: v3.2 敘事總述先行(地形選開場)+場景段,速寫移除圓相圖"`

---

### Task 5: 四系統加詳

**Files:**
- Modify: `octenso/bagua-persona.html`(`systemsSection` :1866-1873)
- Test: `octenso/bagua-persona.test.html`

**Interfaces:**
- Consumes: `REPORT_V32.SYS_DETAIL`、`pn(k)`、`PAIR_EVEN_GAP`(=12)
- Produces: `systemsSection(sc)` 改為主線區塊:每系統=音量條(者名(卦)+數字)+結論 tag+詳細白話+小練習;原 `fourXiangHtml` 細節移入深讀折疊(Task 6)。

- [ ] **Step 1: 加測試**

```js
    // 8. v3.2 四系統加詳
    var sysB=d.getElementById('sys-detail');
    ok(sysB,'四系統詳解區存在');
    ok(sysB.textContent.indexOf('建構')>=0 && sysB.textContent.indexOf('調節')>=0,'含 canonical 系統名');
    ok(sysB.textContent.indexOf('小練習')>=0,'含小練習');
    ok(sysB.querySelectorAll('.pole-row').length===8,'8 條音量條');
    ok(sysB.textContent.indexOf('協作者(巽)')>=0,'音量條用 者名(卦)');
    // C1:乾坤雙高=完整格局非張力;震巽雙高=張力
    w.answers=new Array(24).fill(0);
    w.QUESTIONS.forEach(function(q,i){ if(q.k==='zhen'||q.k==='xun') w.answers[i]=5; });
    w.showResult();
    ok(d.getElementById('sys-detail').textContent.indexOf('張力')>=0,'震巽雙高 → 張力');
    w.answers=new Array(24).fill(0);
    w.QUESTIONS.forEach(function(q,i){ if(q.k==='qian'||q.k==='kun') w.answers[i]=5; });
    w.showResult();
    var sdt=d.getElementById('sys-detail').textContent;
    ok(sdt.indexOf('張力')<0,'乾坤雙高 → 不標張力');
```

- [ ] **Step 2: 跑測試確認失敗**

- [ ] **Step 3: 實作** — `systemsSection` 整函式替換:

```js
function systemsSection(sc){
  var R=window.REPORT_V32; if(!R) return '';
  function shapeOf(L,Rv){
    if(L>=60&&Rv>=60) return 'bothHigh';
    if(L<=40&&Rv<=40) return 'bothLow';
    if(Math.abs(L-Rv)<PAIR_EVEN_GAP) return 'even';
    return L>Rv?'left':'right';
  }
  function bar(k,v,on){
    return '<div class="pole-row" style="display:flex;align-items:center;gap:10px;margin:6px 0">'
      +'<span style="flex:none;width:6.8em;font-size:13px;color:var(--ink)">'+pn(k)+'</span>'
      +'<div style="flex:1;height:9px;background:var(--surface2);border-radius:5px;overflow:hidden"><i style="display:block;height:100%;border-radius:5px;width:'+v+'%;background:'+(on?'var(--pine)':'var(--line)')+';opacity:.8"></i></div>'
      +'<span style="flex:none;width:2em;text-align:right;font-family:ui-sans-serif,sans-serif;font-size:11.5px;color:var(--muted)">'+v+'</span></div>';
  }
  var TAG={left:'偏',right:'偏',bothHigh:'雙高',bothLow:'雙低',even:'均衡'};
  var html=Object.keys(R.SYS_DETAIL).map(function(s){
    var dta=R.SYS_DETAIL[s], L=sc[dta.l]||0, Rv=sc[dta.r]||0, sh=shapeOf(L,Rv), item=dta.shapes[sh];
    var tag=(sh==='left')?('偏'+fn1(dta.l)):(sh==='right')?('偏'+fn1(dta.r)):TAG[sh];
    var tens=(s==='drive'&&sh==='bothHigh');
    return '<div style="padding:18px 0;border-top:1px solid var(--surface2)">'
      +'<h4 style="font-size:15.5px;color:var(--ink);margin-bottom:8px">'+dta.nm+' · <b style="color:'+(tens?'var(--cinnabar)':'var(--pine)')+'">'+tag+(tens?'（張力）':'')+'</b></h4>'
      +bar(dta.l,L,sh==='left'||sh==='bothHigh')+bar(dta.r,Rv,sh==='right'||sh==='bothHigh')
      +'<div style="font-size:13px;color:var(--muted);margin-top:8px">'+dta.pull+'</div>'
      +'<div style="margin-top:8px">'+item.read+'</div>'
      +'<div style="margin-top:8px;padding-left:12px;border-left:2px solid var(--surface2);font-size:13.5px"><b style="color:var(--pine)">小練習</b>：'+item.prac+'</div>'
    +'</div>';
  }).join('');
  return '<div class="block" id="sys-detail"><h3>四個系統 · 你怎麼運作</h3>'+html
    +'<div class="pair-foot">這些是傾向、有程度，不是非此即彼；四對之中只有「推動（雷風）」雙高會互相較勁，其餘皆相成。</div>'
  +'</div>';
}
```

(原 `fourXiangHtml` 保留給深讀,Task 6 收納。)注意:`bothHigh` 的 read 文案含「張力」字樣者僅 drive——由 Task 1 測試保證。

- [ ] **Step 4: 跑測試確認通過**
- [ ] **Step 5: Commit** `git commit -am "feat: v3.2 四系統加詳(音量條+白話+小練習,雷風唯一張力)"`

---

### Task 6: 頁面順序定稿+深讀折疊瘦身

**Files:**
- Modify: `octenso/bagua-persona.html`(`showResult` html 組裝 :1905-1960)
- Test: `octenso/bagua-persona.test.html`

**Interfaces:**
- Consumes: 前五個 task 的所有組件
- Produces: 主線順序=fsbar → tendencyCard → 峰名卡 → 雷達 → 敘事 → 四系統 → 深讀折疊(八態輪廓/校準·剛剛好嗎/memo/工具) → 場景耗能等 → 分享。「怎麼讀這張圖」honest 區塊移到敘事之後、四系統之前。

- [ ] **Step 1: 加測試**

```js
    // 9. v3.2 順序與折疊
    var H=d.getElementById('result').innerHTML;
    var iRadar=H.indexOf('radar-wrap'), iNarr=H.indexOf('整體的你'), iSys=H.indexOf('sys-detail'), iOutline=H.indexOf('八態輪廓');
    ok(iRadar>0 && iRadar<iNarr && iNarr<iSys,'順序:雷達<敘事<四系統');
    ok(iSys<iOutline,'八態輪廓在四系統後(深讀)');
    var outlineEl=Array.prototype.find.call(d.querySelectorAll('details'),function(x){return x.textContent.indexOf('八態輪廓')>=0;});
    ok(!!outlineEl,'八態輪廓已收進折疊');
```

- [ ] **Step 2: 跑測試確認失敗**

- [ ] **Step 3: 實作** — `showResult` 組裝段改為:

```js
  var html=''
   +'<div class="fsbar">…(原樣)…</div>'
   +(tend?tendencyCard(tend):'')
   +'<div class="typecard" …>…(原樣)…</div>'
   +radarCard(now)
   +portraitNarrative(pf, …, …, conf)
   +'<div class="honest" …>怎麼讀這張圖…(原樣)</div>'
   +systemsSection(sc)
   +'<details class="rsec"><summary><span>深讀 · 八態輪廓<span class="rsum-hint">每態評價 · 高低與平衡 · 主調</span></span><span class="rchev">▾</span></summary><div class="rbody">'+outlineBlock(sc,pf,now,conf)+'</div></details>'
   +'<details class="rsec"><summary><span>深讀 · 剛剛好嗎<span class="rsum-hint">校準:亢/潛/中正</span></span><span class="rchev">▾</span></summary><div class="rbody">'+calibBlock(sc)+'</div></details>'
   +'<details class="rsec"><summary><span>深讀 · 四向度與提醒<span class="rsum-hint">四對細節 · 能量提醒</span></span><span class="rchev">▾</span></summary><div class="rbody">'+fourXiangHtml(sc)+memoBlockHtml(sc)+'</div></details>'
   +'<div class="block">…你最鮮明的能量(原樣,含 strengthsHtml)…</div>'
   +'<details class="rsec">…適合你的下一步(原樣)…</details>'
   +ctaBlock(sc,now)
   +'…場景耗能/facet-menu/feedback/sharev2/foot(原樣)…';
```

(「你最鮮明的能量」優勢/盲點/成長保留在主線敘事後——它是 L1 內容,不摺。若 `calibBlock`/`fourXiangHtml` 內層已有 details,外層包 details 仍可運作,不需改內層。)

- [ ] **Step 4: 跑全部測試確認通過**(`RESULT pass=N fail=0`,含既有 4b/4c/4e 各條)
- [ ] **Step 5: Commit** `git commit -am "feat: v3.2 正式頁順序定稿,深讀區收折疊"`

---

### Task 7: 分享檢視頁(view mode)同步

**Files:**
- Modify: `octenso/bagua-persona.html`(view 組裝 :1057-1069)
- Test: `octenso/bagua-persona.test.html`

**Interfaces:**
- Consumes: `pn`、新 `systemsSection`、`portraitNarrative`
- Produces: `#view` 分享頁同用 v3.2 命名與雷達(不加互動解釋卡以外的新結構;速寫圓同步移除——view 的 `full` 內容用 `systemsSection(sc)` 新版自動生效)。

- [ ] **Step 1: 加測試**

```js
    // 10. 分享檢視:命名同步,無圓相圖
    w.location.hash='';
    w.localStorage.setItem('bagua_persona_v1', JSON.stringify({scores:{qian:88,li:55,zhen:50,dui:45,kun:40,kan:35,gen:30,xun:52},ts:'X'}));
    // 直接呼叫 view 渲染路徑(頁內函式名依實作,約 :1050 showSharedReport / renderView)
    // 斷言:view html 不含 ensoSVG 圓、峰名含 者名(卦)
```

(進 Step 3 時先確認 view 渲染入口函式名,再把上面斷言補完整——view 入口在 :1050 附近,渲染到 `#result`。)

- [ ] **Step 2: 跑測試確認失敗**
- [ ] **Step 3: 實作** — :1062 `sig.title` 已由 Task 2 的 `signatureTitle` 自動變 `者名(卦)`;:1057-1058 `full` 中若引用 `portraitNarrative`/`ensoSVG` 圓,同步替換為新版函式輸出;確認 view 的 `radarCard(null)` 渲染後也呼叫 `radarSelect`+綁 click(與 showResult 同一段膠水,抽成 `bindRadar(pf,conf)` 供兩處共用)。
- [ ] **Step 4: 跑測試確認通過**
- [ ] **Step 5: Commit** `git commit -am "feat: v3.2 分享檢視頁同步(命名/雷達/無圓)"`

---

### Task 8: 全站驗證+文件+合併

**Files:**
- Modify: `octenso/COMPENDIUM.md`(結果頁一節加 v3.2 一行)、`docs/superpowers/specs/2026-07-23-report-v32-demo-design.md`(§4 遞延事項標記完成)

- [ ] **Step 1: 跑兩個測試頁**,皆須 `RESULT pass=N fail=0`
- [ ] **Step 2: headless 開 `bagua-persona.html` 本體**確認無 JS 錯誤(dump-dom 有 `id="cover"` 內容即可)
- [ ] **Step 3: 手測清單給 Simon**:作答一輪看單峰;用 `_dev-preview.html` 六個 preset 各看一輪(雙峰/雷風張力/多峰/平盤/低盤)
- [ ] **Step 4: 文件**:COMPENDIUM 結果頁段加「v3.2(2026-07-23):敘事先行上正式頁——命名者名(卦)、雷達主線可點、總述地形開場、四系統詳解;文案 canonical 於 bagua-report-v32-data.js」;spec §4 兩項標 ✅
- [ ] **Step 5: Commit** `git commit -am "docs: v3.2 正式頁完成,COMPENDIUM 與 spec 回填"`
- [ ] **Step 6: Simon 過目後**走 finishing-a-development-branch(merge main→Pages 部署)

---

## Self-Review 紀錄

- **Spec coverage:** §2 命名→Task 2;§3.2 雷達→Task 3;§3.3 敘事→Task 4;§3.4 四系統→Task 5;§3.5 折疊→Task 6;§4 圓相圖移除→Task 4(函式保留供能量印記);§4 canonical 回填→Task 1。伴讀=平台無此功能,明列 out of scope(Global Constraints)。
- **Placeholder scan:** Task 7 Step 1 斷言留待實作時確認 view 入口函式名——已明文寫出「先確認再補完整」的動作,非 TBD。其餘無。
- **Type consistency:** `pn(k)`/`radarSelect(k,pf,conf)`/`REPORT_V32.{PLAIN,SCENE,OPEN,SYS_DETAIL}`/`systemsSection(sc)` 各 task 引用一致。
