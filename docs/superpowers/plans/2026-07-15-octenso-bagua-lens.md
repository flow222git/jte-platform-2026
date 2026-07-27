# 八態鏡(bagua-lens)實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** schema 升 0.1.1(素材脈絡宣告+八態逐列)、Worker 加 /lens、內部工具頁 bagua-lens.html+測試。

**Architecture:** schema 仍為單一真相源(前端 fetch YAML 原文隨請求送 Worker,Worker 不存副本);Worker 沿用 path 路由/限流/cache_control 既有模式;頁面走 octenso 家規(宣紙+gate)。

**Tech Stack:** 原生 JS;python3+PyYAML(checker);TESTRUN=headless Chrome 讀 title(controller 執行;implementer 只做靜態驗證)。

## Global Constraints

- 分支:`octenso/bagua-lens`(已建,spec 已 commit)。
- **G1–G8 與八態定義一字不動**;只加 `context_declaration`、改 `output_spec`/`meta`。
- Worker URL base:`https://calm-sunset-97f8.simon-ec6.workers.dev`(lens 路徑=`/lens`)。
- 半形標點;無 emoji;頁面無外部絕對網址 script(fonts CSS link 可,循全站慣例)。
- 素材/報告不落 Worker 儲存;localStorage only。
- TESTRUN 指令同前計畫(--headless=new --virtual-time-budget=30000)。

---

### Task 1: schema 0.1.1 + checker 同步

**Files:**
- Modify: `octenso/octenso-states-schema-v0.1.yaml`(meta、output_spec、新增 context_declaration)
- Modify: `tools/check-states-schema.py`

**Interfaces:**
- Produces: `context_declaration.types` 八鍵:`brainstorm/decision/retro/routine/bp/policy/interview/observation`(Task 2 的白名單、Task 3 的下拉皆依此)。

- [ ] **Step 1: checker 先改(紅燈)**——`tools/check-states-schema.py`:
  - `check("meta.version == 0.1", ...)` 改為 `== "0.1.1"`(訊息文字同步)。
  - guardrails 檢查後加:

```python
    cd = doc.get("context_declaration", {})
    CTX_TYPES = ["brainstorm", "decision", "retro", "routine", "bp", "policy", "interview", "observation"]
    check("context_declaration 八型齊全", isinstance(cd.get("types"), dict)
          and all(t in cd["types"] for t in CTX_TYPES))
    check("context_declaration 原則含使用者宣告", "使用者宣告" in str(cd.get("原則", "")))
```

  跑 `python3 tools/check-states-schema.py` → 預期 FAIL(version 與 context_declaration 兩處)。

- [ ] **Step 2: schema 編輯**

2a. meta 區:

```yaml
meta:
  version: "0.1.1"            # 0.1 + 素材脈絡宣告/八態逐列(乾跑修訂);未達 v0.2 收斂門檻(仍需真實素材雙 agent 收斂達標)
  date: "2026-07-15"
  scope: "透鏡層(會議紀錄/BP/制度/個人觀察筆記)優先;伴讀引用需另過語氣憲章"
  filled: ["qian", "kun", "zhen", "xun", "kan", "li", "gen", "dui"]
  stub: []
```

2b. `verdicts` 區塊之後、`# 態定義:乾` 之前插入:

```yaml
# -----------------------------------------------------
# 素材脈絡宣告(判讀前由使用者宣告素材類型;系統不猜——同 WH1 模式,受 G8 管轄)
# 依據:2026-07-15 真實素材首測,動腦會之坎發散被誤標失衡(Simon 回饋定案)
# -----------------------------------------------------
context_declaration:
  原則: "素材類型由使用者宣告,系統不猜;拿對的尺量對的會。報告開頭須註明宣告類型。"
  types:
    brainstorm:
      label: "動腦會(發想/意見收集)"
      調整: "坎的發散與不收斂為本型態功能,不標失衡;坤、艮、巽缺席=本型態預期,列於「本型態預期之缺席」不進首位警示;震薄=預期"
    decision:
      label: "決策會"
      調整: "艮缺席(無人擋範圍)、坤缺席(無人接)升首位警示;散會無人帶走行動=震缺席照標;乾缺席(無人拍板)列警示"
    retro:
      label: "覆盤會/檢討會"
      調整: "坎缺席(無真實檢討、無失敗紀錄)升首位警示;離缺席(無綜整結論)列警示"
    routine:
      label: "例行會"
      調整: "依 G2 預設順序,無型態調整"
    bp:
      label: "BP/提案文件"
      調整: "依各態既有『文件/BP 特別規則』(坎:驗證資料;坤:營運計畫;巽:通路經營)"
    policy:
      label: "制度/流程文件"
      調整: "以各態『制度』行為線索為主要證據面;艮缺席(只有開始沒有結束機制)照 G2 列警示"
    interview:
      label: "面試筆記"
      調整: "依 G7 全程降級:僅輸出已收集/尚無資料之態與補問建議,不做失衡標記、不做評價"
    observation:
      label: "個人觀察筆記"
      調整: "比照 G7 精神降級:僅列 presence 與補問,不輸出失衡疑似(單一觀察者素材,失衡判定證據力不足)"
  enforce: "缺席之「警示/本型態預期」分級依上表;brainstorm/interview/observation 型不輸出失衡疑似段(標記為『本型態不適用』)"
```

2c. `output_spec` 的 `每態輸出` 第一條之前加一條、`報告結構` 改寫:

```yaml
output_spec:
  每態輸出:
    - "八態逐一列 presence 判定(有料/薄/缺席),一態不可省略"
    - "presence 判定(有料/薄/缺席)+ 逐字證據引文(G5)"
    - "失衡疑似 flag(如有),僅內部;對外語彙待審閱"
  報告結構: "開頭註明宣告類型 → ①缺席清單(依 context_declaration 分「警示」與「本型態預期」,含補問建議)→ ②失衡疑似(型態不適用則註明)→ ③強態圖景 → ④系統層小結(四系統各一句:這一段的流動狀況)"
  語氣: "過 speak-human-tw 校對;負面清單(罐頭同理心/說教深度腔/金句公式)適用"
  絕不輸出: "總分/排名/建議錄取/投資建議/成敗預測/人格標籤(G6)"
```

- [ ] **Step 3: 綠燈**——`python3 tools/check-states-schema.py` → 全 PASS `fail=0`。

- [ ] **Step 4: Commit**

```bash
git add octenso/octenso-states-schema-v0.1.yaml tools/check-states-schema.py
git commit -m "feat(schema): 0.1.1 素材脈絡宣告八型+八態逐列(乾跑與真實首測修訂)"
```

---

### Task 2: Worker /lens

**Files:**
- Modify: `ven-i/worker.js`

**Interfaces:**
- Consumes: Task 1 的八型 key(白名單)。
- Produces: `POST /lens` 收 `{material, schema, contextType, contextLabel}` 回 `{reading}`;錯誤 `{error}`。

- [ ] **Step 1: 在 `OCTENSO_FIRST_USER` 常數之後插入**

```js
/* ============================================================
   八態鏡(/lens):透鏡判讀——讀運作,不讀人。
   schema 由前端隨請求送入(單一真相源=repo 的 YAML;Worker 不存副本)。
   素材與報告皆不落檔(北極星:作答不上傳;內部工具連摘要都不存)。
   ============================================================ */
const LENS_MODEL = 'claude-sonnet-5';
const LENS_MAX_TOKENS = 2500;
const LENS_DAILY_LIMIT_PER_IP = 20;
const LENS_CONTEXT_TYPES = ['brainstorm', 'decision', 'retro', 'routine', 'bp', 'policy', 'interview', 'observation'];

const LENS_SYSTEM = `你是「八態鏡」透鏡判讀員,隸屬練息場(Join to Enjoy)。你讀的是「運作」——一場會議、一份文件如何運作——永遠不是「人」。
你必須嚴格依照後附的 states-schema(機器可讀定義)判讀:guardrails G1–G8 為硬規則,不可覆寫;verdicts 值域、context_declaration 型態調整、output_spec 輸出結構照辦。
鐵則摘要(違反任何一條=判讀無效):
- 每一條判定必須附素材逐字引文(G5);引不出來=判「缺席(無資料)」。缺席≠弱。
- 八態(乾坤震巽坎離艮兌)逐一列出 presence 判定(有料/薄/缺席),一態都不可省略。
- 主詞永遠是「這場會議/這份文件/某分支的運作」;禁用「你是/他是/這種人」(G4)。
- 不輸出總分、排名、建議錄取、投資建議、成敗預測、人格標籤(G1/G6)。
- 使用者已宣告素材類型:依 schema 的 context_declaration 調整缺席分級(警示/本型態預期)與失衡段是否輸出;interview/observation 依 G7 降級。
- 報告第一行:「素材類型(使用者宣告):{類型} · AI 判讀 · 引文可查」。
- 語氣:平實、具體;繁體中文;半形標點;不用 emoji;禁罐頭同理心、說教深度腔、金句公式。
輸出結構(照 output_spec):①缺席清單(分「警示」與「本型態預期」,含補問建議)→②失衡疑似(型態不適用則寫「本型態不適用」)→③強態圖景→④四系統各一句小結。`;

async function handleLens(request, env, corsHeaders) {
  if (env.RATE_LIMIT) {
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const today = new Date().toISOString().slice(0, 10);
    const key = `lens:${ip}:${today}`;
    const count = parseInt((await env.RATE_LIMIT.get(key)) || '0', 10);
    if (count >= LENS_DAILY_LIMIT_PER_IP) {
      return json({ error: '今日判讀次數已達上限,明天再來。' }, 429, corsHeaders);
    }
    await env.RATE_LIMIT.put(key, String(count + 1), { expirationTtl: 86400 });
  }
  let payload;
  try { payload = await request.json(); }
  catch { return json({ error: 'Invalid JSON' }, 400, corsHeaders); }
  const { material, schema, contextType, contextLabel } = payload;
  if (typeof material !== 'string' || !material.trim() || material.length > 20000) {
    return json({ error: '素材為空或超過 20000 字。' }, 400, corsHeaders);
  }
  if (typeof schema !== 'string' || schema.length < 1000 || schema.length > 20000) {
    return json({ error: 'schema 載入異常。' }, 400, corsHeaders);
  }
  if (!LENS_CONTEXT_TYPES.includes(contextType)) {
    return json({ error: '素材類型未宣告。' }, 400, corsHeaders);
  }
  const system = [
    { type: 'text', text: LENS_SYSTEM, cache_control: { type: 'ephemeral' } },
    { type: 'text', text: 'states-schema 全文如下:\n───\n' + schema + '\n───', cache_control: { type: 'ephemeral' } },
  ];
  const userPrompt = '素材類型(使用者宣告):' + contextType + '(' + String(contextLabel || '').slice(0, 40) + ')\n素材全文如下:\n───\n' + material + '\n───\n請依 schema 與宣告類型輸出判讀報告。';
  const apiResponse = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: LENS_MODEL,
      max_tokens: LENS_MAX_TOKENS,
      system,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });
  if (!apiResponse.ok) {
    const errText = await apiResponse.text();
    console.error('Anthropic API error (lens):', apiResponse.status, errText);
    return json({ error: '八態鏡暫時無法判讀,請稍後再試。', detail: `${apiResponse.status}: ${errText.slice(0, 400)}` }, 502, corsHeaders);
  }
  const data = await apiResponse.json();
  const text = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n');
  return json({ reading: text }, 200, corsHeaders);
}
```

- [ ] **Step 2: fetch 路由加一段**(`/octenso` 判斷之後):

```js
    if (new URL(request.url).pathname === '/lens') {
      return handleLens(request, env, corsHeaders);
    }
```

- [ ] **Step 3: 靜態驗證+Commit**(無 node,無法本地跑 worker;部署後實測):

```bash
python3 - <<'PY'
src=open('ven-i/worker.js',encoding='utf-8').read()
assert src.count('handleLens')==2 and "'/lens'" in src and 'LENS_CONTEXT_TYPES' in src
assert src.count('cache_control')>=6, 'lens system 未掛快取'
print('OK')
PY
git add ven-i/worker.js
git commit -m "feat(worker): /lens 透鏡判讀(schema 隨請求送入,不落檔,獨立限流)"
```

---

### Task 3: bagua-lens.html 頁面

**Files:**
- Create: `octenso/bagua-lens.html`

**Interfaces:**
- Consumes: Task 1 八型(下拉)、Task 2 `/lens` API。
- Produces: `window.LENS={buildPayload,renderReport,HISTORY_KEY,HARVEST_KEY}`(Task 4 測試依賴)。

- [ ] **Step 1: 建立頁面(完整內容)**

```html
<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<script defer src="octenso-gate.js"></script>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Jost:wght@200;300;400&family=Noto+Sans+TC:wght@200;300;400&display=swap" rel="stylesheet">
<title>八態鏡 · 透鏡判讀(內部工具)</title>
<!--
  八態鏡(2026-07-15;內部工具,未接導覽,2-3 人使用)
  讀運作,不讀人。判讀依據=octenso-states-schema(單一真相源,前端 fetch 隨請求送 Worker)。
  素材與報告不上傳不儲存(Worker 即時判讀不落檔);結果只留 localStorage。
-->
<style>
  :root{--bg:#f4efe4;--surface:#f8f4ec;--surface2:#efe9dc;--ink:#23241f;--ink-soft:#3a3a32;--muted:#6f6657;
    --line:#d2c7b4;--hair:#bcb09a;--pine:#35614f;--cinnabar:#9d4b34;--gold:#a9823b}
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:var(--bg);color:var(--ink-soft);font-family:"Noto Sans TC",ui-sans-serif,system-ui,sans-serif;
    font-weight:300;line-height:1.9;font-size:15px;max-width:680px;margin:0 auto;padding:26px 20px 80px}
  .eyebrow{font-family:"Jost",ui-sans-serif,sans-serif;font-size:11px;letter-spacing:.26em;color:var(--muted);
    text-transform:uppercase;text-align:center;margin-bottom:10px}
  h1{font-weight:200;font-size:24px;letter-spacing:.14em;color:var(--ink);text-align:center;margin-bottom:6px}
  .sub{text-align:center;color:var(--muted);font-size:12.5px;letter-spacing:.05em;margin-bottom:12px}
  .draft{display:block;width:fit-content;margin:0 auto 22px;text-align:center;font-size:11.5px;color:var(--cinnabar);
    border:1px solid var(--cinnabar);border-radius:999px;padding:3px 14px;letter-spacing:.1em}
  .lbl{font-size:13px;letter-spacing:.14em;color:var(--muted);margin:22px 0 8px}
  textarea{width:100%;min-height:220px;background:var(--surface);border:1px solid var(--hair);border-radius:10px;
    padding:12px 14px;color:var(--ink);font-size:14px;font-family:inherit;line-height:1.8;resize:vertical}
  textarea:focus,select:focus{outline:none;border-color:var(--ink)}
  select{width:100%;background:var(--surface);border:1px solid var(--hair);border-radius:10px;
    padding:11px 14px;color:var(--ink);font-size:14px;font-family:inherit}
  .btn{display:inline-block;font-size:14px;font-weight:300;letter-spacing:.08em;padding:11px 28px;cursor:pointer;
    border:1px solid var(--ink);border-radius:999px;color:var(--ink);background:transparent;transition:.2s;margin-top:16px}
  .btn:hover{background:var(--ink);color:var(--bg)}
  .btn:disabled{opacity:.4;cursor:default}
  .btn.ghost{border-color:var(--hair);color:var(--muted);font-size:12.5px;padding:8px 18px}
  .btn.ghost:hover{border-color:var(--ink);color:var(--ink);background:transparent}
  #status{font-size:12.5px;color:var(--muted);margin-top:10px;min-height:1.6em}
  #status.err{color:var(--cinnabar)}
  #report{display:none;margin-top:26px;background:var(--surface);border:1px solid var(--line);border-radius:14px;
    padding:20px 20px;white-space:pre-line;font-size:14px;line-height:2}
  .stamp{font-size:11.5px;color:var(--muted);letter-spacing:.06em;border-bottom:1px solid var(--line);
    padding-bottom:10px;margin-bottom:12px}
  .honest{font-size:12px;color:var(--muted);line-height:1.9;padding-left:14px;border-left:1px solid var(--hair);margin-top:26px}
  .rule{height:1px;background:var(--line);margin:34px 0}
  .hint{font-size:12px;color:var(--muted);margin-top:6px}
  input.harvest{width:100%;background:var(--surface);border:1px solid var(--hair);border-radius:10px;
    padding:10px 13px;color:var(--ink);font-size:13.5px;font-family:inherit}
  #histlist{list-style:none}
  #histlist li{padding:9px 2px;border-bottom:1px solid var(--surface2);font-size:13px;cursor:pointer}
  #histlist li:hover{color:var(--ink)}
  #histlist .ht{font-family:"Jost",sans-serif;font-size:10.5px;color:var(--hair);margin-right:8px}
</style></head>
<body>
<div class="eyebrow">Octenso · Lens · Internal</div>
<h1>八態鏡</h1>
<div class="sub">讀運作,不讀人——貼上素材,宣告它是什麼,鏡子照給你看</div>
<span class="draft">內部工具 · schema v0.1 研究假設待考</span>

<div class="lbl">素材(會議紀錄/BP/制度/觀察筆記;語音轉文字原稿可直接貼)</div>
<textarea id="mat" placeholder="貼上素材全文…"></textarea>

<div class="lbl">這份素材是——(宣告類型,判讀的尺依此調整)</div>
<select id="ctype">
  <option value="brainstorm">動腦會(發想/意見收集)</option>
  <option value="decision">決策會</option>
  <option value="retro">覆盤會/檢討會</option>
  <option value="routine">例行會</option>
  <option value="bp">BP/提案文件</option>
  <option value="policy">制度/流程文件</option>
  <option value="interview">面試筆記(自動降級為觀察模式)</option>
  <option value="observation">個人觀察筆記</option>
</select>

<button class="btn" id="run">照一下</button>
<div id="status"></div>

<div id="report"><div class="stamp">AI 判讀 · 引文可查 · 依 states-schema v0.1(研究假設待考)</div><div id="rbody"></div>
  <button class="btn ghost" id="copy" style="margin-top:14px">複製報告</button>
</div>

<div id="harvestwrap" style="display:none">
  <div class="lbl">語彙收割(選填:哪句你會換個說法?寫下來,收進素材倉)</div>
  <input class="harvest" id="harvest" placeholder="例:『低載』我會說『還沒開機』…">
  <button class="btn ghost" id="hsave">存一句</button><span class="hint" id="hmsg"></span>
</div>

<div class="rule"></div>
<div class="lbl">最近判讀(只在這台裝置)</div>
<ul id="histlist"></ul>

<div class="honest">素材即時判讀、不上傳不儲存;報告只留在此裝置(最近 10 筆)。判讀是 AI 依 schema 產生,每條判定附素材原文引文,請自行核對。缺席=素材沒給,不等於弱;主詞永遠是運作,不是人。</div>

<script>
(function(){
'use strict';
var $=function(id){return document.getElementById(id);};
var API='https://calm-sunset-97f8.simon-ec6.workers.dev/lens';
var SCHEMA_URL='octenso-states-schema-v0.1.yaml';
var HISTORY_KEY='lens_history', HARVEST_KEY='lens_harvest';
var CTYPES={brainstorm:'動腦會(發想/意見收集)',decision:'決策會',retro:'覆盤會/檢討會',routine:'例行會',
  bp:'BP/提案文件',policy:'制度/流程文件',interview:'面試筆記',observation:'個人觀察筆記'};
var schemaText='';
fetch(SCHEMA_URL).then(function(r){return r.text();}).then(function(t){schemaText=t;})
  .catch(function(){$('status').textContent='schema 載入失敗——重新整理試試。';$('status').className='err';});

function buildPayload(material,schema,ctype){
  return {material:material,schema:schema,contextType:ctype,contextLabel:CTYPES[ctype]||ctype};
}
function loadHist(){try{return JSON.parse(localStorage.getItem(HISTORY_KEY))||[];}catch(e){return [];}}
function saveHist(list){try{localStorage.setItem(HISTORY_KEY,JSON.stringify(list.slice(0,10)));}catch(e){}}
function renderReport(text){
  $('rbody').textContent=text;
  $('report').style.display='block';
  $('harvestwrap').style.display='block';
  $('report').scrollIntoView({block:'start',behavior:'smooth'});
}
function renderHist(){
  var ul=$('histlist');ul.innerHTML='';
  loadHist().forEach(function(h){
    var li=document.createElement('li');
    li.innerHTML='<span class="ht">'+h.time.slice(5,16).replace('T',' ')+' · '+(CTYPES[h.ctype]||h.ctype)+'</span>'+
      h.head.replace(/[<>&]/g,function(c){return {'<':'&lt;','>':'&gt;','&':'&amp;'}[c];});
    li.onclick=function(){renderReport(h.reading);};
    ul.appendChild(li);
  });
}
$('run').onclick=function(){
  var mat=$('mat').value.trim(),ctype=$('ctype').value;
  if(!mat){$('status').textContent='先貼素材。';$('status').className='err';return;}
  if(!schemaText){$('status').textContent='schema 還在載入,等一下再按。';$('status').className='err';return;}
  $('run').disabled=true;$('status').className='';$('status').textContent='照鏡子中……(約 30–60 秒)';
  fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify(buildPayload(mat,schemaText,ctype))})
  .then(function(r){return r.json();})
  .then(function(d){
    if(!d.reading)throw new Error(d.error||'empty');
    renderReport(d.reading);
    var list=loadHist();
    list.unshift({time:new Date().toISOString(),ctype:ctype,head:mat.slice(0,80),reading:d.reading});
    saveHist(list);renderHist();
    $('status').textContent='';
  })
  .catch(function(e){$('status').textContent='判讀失敗:'+(e.message||'請稍後再試');$('status').className='err';})
  .then(function(){$('run').disabled=false;});
};
$('copy').onclick=function(){
  try{navigator.clipboard.writeText($('rbody').textContent);$('status').textContent='已複製。';}catch(e){}
};
$('hsave').onclick=function(){
  var v=$('harvest').value.trim();if(!v)return;
  var list=[];try{list=JSON.parse(localStorage.getItem(HARVEST_KEY))||[];}catch(e){}
  list.push({time:new Date().toISOString(),note:v});
  try{localStorage.setItem(HARVEST_KEY,JSON.stringify(list));}catch(e){}
  $('harvest').value='';$('hmsg').textContent='收了,謝謝。';
};
renderHist();
window.LENS={buildPayload:buildPayload,renderReport:renderReport,HISTORY_KEY:HISTORY_KEY,HARVEST_KEY:HARVEST_KEY,CTYPES:CTYPES};
document.body.setAttribute('data-ready','1');
})();
</script>
</body></html>
```

- [ ] **Step 2: 靜態驗證+Commit**

```bash
grep -c "buildPayload\|data-ready\|octenso-gate" octenso/bagua-lens.html   # >=4
git add octenso/bagua-lens.html
git commit -m "feat: 八態鏡內部工具頁(貼素材+宣告類型→判讀報告;不落檔)"
```

---

### Task 4: 測試頁 + COMPENDIUM

**Files:**
- Create: `octenso/bagua-lens.test.html`
- Modify: `octenso/COMPENDIUM.md`(§9 決策史加一列;§1.4 尾補一句)

- [ ] **Step 1: 測試頁(完整內容;mock fetch,不打真 API)**

```html
<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><title>lens tests</title></head><body>
<pre id="log"></pre>
<div id="frames"></div>
<script>
(function(){
  var pass=0, fail=0, log=document.getElementById('log');
  function t(name, ok){ if(ok){pass++;} else {fail++; log.textContent+='FAIL: '+name+'\n'; } }
  var f=document.createElement('iframe');
  f.style.cssText='width:760px;height:900px';
  f.src='bagua-lens.html';
  document.getElementById('frames').appendChild(f);
  var tries=0;
  var timer=setInterval(function(){
    tries++;
    var doc=null,win=null;
    try{ doc=f.contentDocument; win=f.contentWindow; }catch(e){}
    if(!doc||!doc.body||doc.body.getAttribute('data-ready')!=='1'){ if(tries>200){clearInterval(timer);t('page ready',false);finish();} return; }
    clearInterval(timer);
    var L=win.LENS;
    t('LENS 介面外露', !!L && typeof L.buildPayload==='function');
    t('八型下拉齊全', doc.querySelectorAll('#ctype option').length===8
      && ['brainstorm','decision','retro','routine','bp','policy','interview','observation']
         .every(function(v){return !!doc.querySelector('#ctype option[value="'+v+'"]');}));
    var p=L.buildPayload('素材文字','schema文字','brainstorm');
    t('payload 組裝', p.material==='素材文字' && p.schema==='schema文字'
      && p.contextType==='brainstorm' && p.contextLabel.indexOf('動腦會')===0);
    t('interview 標降級', doc.querySelector('#ctype option[value="interview"]').textContent.indexOf('降級')>=0);
    // renderReport + 歷史/收割 localStorage 讀寫
    L.renderReport('測試報告內容');
    t('報告渲染', doc.getElementById('rbody').textContent==='測試報告內容'
      && doc.getElementById('report').style.display==='block');
    t('誠實印章', doc.getElementById('report').textContent.indexOf('AI 判讀 · 引文可查')>=0);
    t('誠實區:不上傳/主詞是運作', doc.body.textContent.indexOf('不上傳不儲存')>=0
      && doc.body.textContent.indexOf('主詞永遠是運作')>=0);
    try{
      win.localStorage.setItem(L.HARVEST_KEY,'[]');
      doc.getElementById('harvest').value='測試收割句';
      doc.getElementById('hsave').click();
      var hv=JSON.parse(win.localStorage.getItem(L.HARVEST_KEY));
      t('語彙收割寫入', hv.length===1 && hv[0].note==='測試收割句');
    }catch(e){ t('語彙收割寫入', false); }
    t('gate 腳本掛載', !!doc.querySelector('script[src="octenso-gate.js"]'));
    t('無外部絕對網址 script', [].every.call(doc.querySelectorAll('script[src]'),
      function(s){return s.getAttribute('src').indexOf('http')!==0;}));
    finish();
  },120);
  function finish(){
    document.title='RESULT pass='+pass+' fail='+fail;
    log.textContent='RESULT pass='+pass+' fail='+fail+'\n'+log.textContent;
  }
})();
</script>
</body></html>
```

(注意:此測試不觸發 `#run` 的真實 fetch;schema fetch 在同站測試伺服器下會成功載入,無妨。)

- [ ] **Step 2: COMPENDIUM**——§1.4 段末補一句、§9 表尾(07-15 列之後)加一列:

§1.4 段末加:

```markdown
0.1.1(同日):+素材脈絡宣告八型(context_declaration)、八態逐列輸出;判讀工具=octenso/bagua-lens.html(內部)。
```

§9 加:

```markdown
| 07-15 | **八態鏡上線(內部)**:schema 0.1.1(脈絡宣告八型)+Worker /lens+bagua-lens 頁;語彙庫改拉式收割,不預建 |
```

- [ ] **Step 3: 綠燈+回歸+Commit+push**(controller 跑 TESTRUN:bagua-lens 全綠;checker 全綠;hybrid/v3/v2 不動不需跑):

```bash
python3 tools/check-states-schema.py
git add octenso/bagua-lens.test.html octenso/COMPENDIUM.md
git commit -m "test+docs: 八態鏡測試頁+COMPENDIUM 同步"
git push -u origin octenso/bagua-lens
```

---

## Self-Review 紀錄

- Spec 覆蓋:①schema 0.1.1=Task 1;②/lens=Task 2;③頁面=Task 3;④驗證=Task 4+controller TESTRUN;部署後真實素材實測=merge 後手動(spec 完成定義 2)。
- 佔位掃描:全實碼。
- 一致性:八型 key 在 schema/worker 白名單/頁面下拉/測試四處一致;`buildPayload` 簽名與測試一致;API 路徑 `/lens` 與 worker 路由一致;`LENS` 外露鍵與測試引用一致。
