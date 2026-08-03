# 八態鏡 v3 · 判卦引擎 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 依 spec `docs/superpowers/specs/2026-07-21-daoliyong-gua-engine-design.md`,實作三層判卦引擎:data.js 反查 helpers(guaOf/bianOf)、lens-schema 升 v0.2-draft(判卦區塊)、SKILL.md 接上⑥新規格與目標/TA 宣告。

**Architecture:** 零新增卦表——剛=陽、柔=陰,反查既有 `MODES[].yao` 得本卦;一爻變翻轉再反查得之卦。schema 改名 v0.2 並附加判卦區塊(剛柔判準/變爻判定律/量形圖/四律),整塊掛「工作假說·待收斂」;v0.1 既有內容一字不動。檢查器雙軌同步擴充。

**Tech Stack:** ES5 JS、HTML 測試頁(browser RESULT)、YAML、Python3+PyYAML(正典 checker)、Node(煙霧 checker)。

## Global Constraints

- 分支:`octenso/daoliyong-gua-engine`(已存在,spec 已 commit `80e37a1`)。
- ES5(var/function/IIFE);測試頁無外部 script、結果進 `document.title` 為 `RESULT pass=X fail=Y`。
- **剛=陽、柔=陰**;卦一律由 `MODES[].yao` 反查,helpers 為純查表、不產文案。
- schema v0.1 既有內容一字不動(僅 meta.version 升「0.2-draft」+加 history 一行);判卦區塊整塊標 `status: "工作假說·待收斂"`。
- canonical 聲明字串(逐字):「此卦由素材判讀推導,非起卦占斷;變爻是處方,不是預言。」
- 本機 python 為 stub 不可執行;本地驗證用 node 煙霧 checker 與 `npx --yes js-yaml`;python checker 為正典(CI/他機)。
- 文案繁體中文、不用 emoji;G1–G8 凍結。
- commit 訊息結尾:`Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`。

---

### Task 1: data.js 判卦 helpers + 全枚舉測試

**Files:**
- Modify: `octenso/daoliyong-data.test.html`(先加測試,TDD)
- Modify: `octenso/daoliyong-data.js`(版本 1.0→1.1、加 guaOf/bianOf)

**Interfaces:**
- Consumes: 既有 `MODES`(八卦 key,各含 `yao:{li,yong,dao}` 值 `'yang'|'yin'`)。
- Produces: `OCTENSO_DAOLIYONG.guaOf(li, yong, dao)` → 相符 MODES 條目或 `null`;`OCTENSO_DAOLIYONG.bianOf(k, yao)`(`yao ∈ 'li'|'yong'|'dao'`)→ 翻轉該爻後反查的 MODES 條目或 `null`;`version === '1.1'`。Task 2 的 schema 文字與 Task 3 的 SKILL.md 以此為引用依據。

- [ ] **Step 1: 修改測試頁(會失敗)**

於 `octenso/daoliyong-data.test.html`:

1a. 既有 namespace 斷言 `t('namespace', !!D && D.version === '1.0');` 改為:

```js
  t('namespace', !!D && D.version === '1.1');
```

1b. 在 `// 5) helpers` 區塊之後、`document.title = ...` 之前,插入:

```js
  // 6) 判卦 helpers(v1.1):8 組合全枚舉 + 24 條一爻變全枚舉(期望值由 TRI 真值表獨立推導)
  var FLIP = { yang: 'yin', yin: 'yang' };
  KEYS.forEach(function (k) {
    var y = TRI[k]; // [理(初), 用(二), 道(三)]
    var m = D.guaOf(y[0], y[1], y[2]);
    t('guaOf ' + k, !!m && m.k === k);
    ['li', 'yong', 'dao'].forEach(function (yao, i) {
      var e = y.slice(); e[i] = FLIP[e[i]];
      var expect = null, kk;
      for (kk in TRI) {
        if (TRI[kk][0] === e[0] && TRI[kk][1] === e[1] && TRI[kk][2] === e[2]) expect = kk;
      }
      var b = D.bianOf(k, yao);
      t('bianOf ' + k + '.' + yao + '→' + expect, !!b && b.k === expect);
    });
  });
  t('guaOf 無效值回 null', D.guaOf('yang', 'yang', 'x') === null);
  t('bianOf 無效參數回 null', D.bianOf('nope', 'li') === null && D.bianOf('kan', 'x') === null);
```

- [ ] **Step 2: 跑測試,確認失敗**

```bash
node -e "const h=require('http'),f=require('fs'),p=require('path');h.createServer((q,s)=>{const fp=p.join(process.cwd(),q.url.split('?')[0]);f.readFile(fp,(e,d)=>{if(e){s.writeHead(404);s.end()}else{s.writeHead(200,{'Content-Type':fp.endsWith('.js')?'text/javascript':'text/html; charset=utf-8'});s.end(d)}})}).listen(8125)" & sleep 2
"/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" --headless=new --disable-gpu --virtual-time-budget=5000 \
  --dump-dom http://localhost:8125/octenso/daoliyong-data.test.html 2>/dev/null | grep -oE "RESULT pass=[0-9]+ fail=[0-9]+" | head -1
kill %1
```

Expected: `fail>0`(version 仍 1.0、guaOf/bianOf 未定義)。

- [ ] **Step 3: 實作 helpers**

於 `octenso/daoliyong-data.js`:

3a. 檔頭註解版本行 `v1.0 · 2026-07-21` 改 `v1.1 · 2026-07-21(加判卦 helpers)`。

3b. 在 `g.OCTENSO_DAOLIYONG = {` 之前插入兩個函式:

```js
  // 判卦引擎 helpers(v1.1)——剛=陽、柔=陰;純查表、不產文案(機械推導律)
  function guaOf(li, yong, dao) {
    var k;
    for (k in MODES) {
      if (MODES[k].yao.li === li && MODES[k].yao.yong === yong && MODES[k].yao.dao === dao) {
        return MODES[k];
      }
    }
    return null;
  }
  function bianOf(k, yao) {
    var m = MODES[k];
    if (!m || !(yao === 'li' || yao === 'yong' || yao === 'dao')) return null;
    var flip = { yang: 'yin', yin: 'yang' };
    var y = { li: m.yao.li, yong: m.yao.yong, dao: m.yao.dao };
    y[yao] = flip[y[yao]];
    return guaOf(y.li, y.yong, y.dao);
  }
```

3c. namespace 內 `version: '1.0',` 改 `version: '1.1',`,並於 `baguaOf: ...` 之後加:

```js
    guaOf: guaOf,     // (li, yong, dao) 各 'yang'|'yin' → 本卦 MODES 條目
    bianOf: bianOf    // (卦 key, 'li'|'yong'|'dao') → 一爻變之卦 MODES 條目
```

- [ ] **Step 4: 跑測試,確認全綠**

同 Step 2 指令。Expected: `RESULT pass=137 fail=0`(既有 103 + guaOf 8 + bianOf 24 + 無效 2)。

- [ ] **Step 5: Commit**

```bash
git add octenso/daoliyong-data.js octenso/daoliyong-data.test.html
git commit -m "octenso: daoliyong-data v1.1 判卦 helpers(guaOf/bianOf)+32 條全枚舉測試

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: schema 升 v0.2-draft(判卦區塊)+ 檢查器雙軌擴充

**Files:**
- Modify: `tools/smoke-daoliyong-lens-schema.mjs`(先改,TDD:指向新檔名+新斷言)
- Rename+Modify: `octenso/daoliyong-lens-schema-v0.1.yaml` → `octenso/daoliyong-lens-schema-v0.2.yaml`(git mv 後附加判卦區塊)
- Modify: `tools/check-daoliyong-lens-schema.py`

**Interfaces:**
- Consumes: Task 1 的 helpers 名稱(schema 文字引用 `guaOf/bianOf` 與 `MODES[].yao` 反查)。
- Produces: v0.2 schema 頂層新增 `guapan` 區塊,鍵結構:`status/聲明/四律(非占卜律·機械推導律·主詞律·不預測律)/成卦門檻/剛柔判準(li·yong·dao 各 剛·柔·亢·溺,各含 樣態+信號)/變爻判定律(第一源_脈絡優先·第二源_宣告校正·第三源_菜單兜底·一爻變)/量形圖(頂點·形態·輸出)/宣告體系(必宣告·可選宣告·原則)`。Task 3 的 SKILL.md 指向新檔名。

- [ ] **Step 1: 改煙霧檢查(會失敗)**

於 `tools/smoke-daoliyong-lens-schema.mjs`:

1a. `readFileSync` 路徑改 `'../octenso/daoliyong-lens-schema-v0.2.yaml'`;錯誤訊息改 `'FAIL schema 檔不存在(v0.2)'`。

1b. `ck('meta.version 0.1', ...)` 改:

```js
ck('meta.version 0.2-draft', /version:\s*"0\.2-draft"/.test(t));
```

1c. 在「防複寫」區塊之前插入:

```js
// 判卦區塊(v0.2)
ck('guapan 區塊', has('guapan:'));
ck('工作假說標記', has('工作假說·待收斂'));
ck('canonical 聲明', has('此卦由素材判讀推導,非起卦占斷;變爻是處方,不是預言。'));
ck('四律齊', has('非占卜律') && has('機械推導律') && has('主詞律') && has('不預測律'));
ck('成卦門檻', has('成卦門檻') && has('不成卦'));
ck('剛柔判準三爻', has('剛柔判準:') && count('剛:') >= 3 && count('柔:') >= 3 && count('亢:') >= 3 && count('溺:') >= 3);
ck('變爻判定律三源', has('第一源_脈絡優先') && has('第二源_宣告校正') && has('第三源_菜單兜底'));
ck('一爻變', has('一爻變'));
ck('量形圖', has('量形圖') && has('趨韓非形') && has('非分數'));
ck('宣告體系', has('宣告體系') && has('目標') && has('TA'));
ck('反查引用 helpers', has('guaOf') || has('MODES[].yao'));
```

- [ ] **Step 2: 跑煙霧檢查,確認失敗**

```bash
node tools/smoke-daoliyong-lens-schema.mjs
```

Expected: `FAIL schema 檔不存在(v0.2)` + exit 1(檔案尚未改名)。

- [ ] **Step 3: 改名並附加判卦區塊**

```bash
git mv octenso/daoliyong-lens-schema-v0.1.yaml octenso/daoliyong-lens-schema-v0.2.yaml
```

3a. 修改 meta(僅此兩處,其餘一字不動):`version: "0.1"` → `version: "0.2-draft"`;在 `verdicts_ref` 行後加:

```yaml
  history: "v0.1 診斷層第一輪驗收完成(2 份真實素材+三值回饋,2026-07-21);v0.2-draft 新增判卦區塊(guapan),另計驗收"
```

3b. 檔尾(acceptance 區塊之後)附加:

```yaml

# -----------------------------------------------------
# 判卦引擎(v0.2 新增;整塊=工作假說·待收斂)
# 本卦→變爻→之卦;剛=陽、柔=陰,卦由 daoliyong-data.js 之 MODES[].yao 反查(guaOf/bianOf,機械推導)
# -----------------------------------------------------
guapan:
  status: "工作假說·待收斂"
  聲明: "此卦由素材判讀推導,非起卦占斷;變爻是處方,不是預言。"
  四律:
    非占卜律: "爻由判讀而來(每爻附引文)、變由診斷與宣告而來——無一絲隨機;報告必附上方聲明"
    機械推導律: "AI 只判剛柔與安動,卦由 MODES[].yao 反查(guaOf/bianOf)自動得出;不得跳過判定直接『感覺是某卦』;同素材同判定必同卦"
    主詞律: "卦名給運作不給人——『此局呈乾象』可以,『你是乾卦』不行(G4)"
    不預測律: "之卦是參考路徑,不是『將會變成』;死角是結構警訊,不是命運(G1);收斂前不進正式產品文案"
  成卦門檻: "三爻皆判得出剛柔(各附逐字引文,G5);任一爻證據不足=不成卦,明文聲明+缺哪爻+補問;⑥退回 bestUse 對照引用"
  剛柔判準:
    li:
      剛: { 樣態: "立場鮮明、根基自信", 信號: ["明確原則與標準宣告", "方法論有主張(『我們的做法是』)", "依據直陳不繞"] }
      柔: { 樣態: "虛心開放、根基謙遜", 信號: ["承認知識邊界", "假設保持開放", "多引他山之石", "『還在學/還在驗證』姿態"] }
      亢: { 樣態: "教條僵化(剛過極,動)", 信號: ["依據不容質疑", "唯我獨真", "標準僵死不隨境調——理箴『勿死守僵化教條』的現場版"] }
      溺: { 樣態: "根基失守(柔過極,動)", 信號: ["無主見、立場隨人搖擺", "什麼都『再看看』", "根基借來的沒還(新場域仍全靠舊場域的據)"] }
    yong:
      剛: { 樣態: "強推直取", 信號: ["直接執行、高速輸出", "正面對決", "大開大闔的行動風格"] }
      柔: { 樣態: "柔性手腕", 信號: ["繞道鋪陳、借力使力", "彈性調整", "以退為進"] }
      亢: { 樣態: "出手過極(剛過極,動)", 信號: ["輸出停不下(『高輸出、低復原』)", "硬碰硬四處樹敵", "過勞執行——用箴『不可盲目功利』的現場版"] }
      溺: { 樣態: "出手失守(柔過極,動)", 信號: ["鋪陳無限、始終不進正題", "應變到失去主軸", "行動被環境完全牽走"] }
    dao:
      剛: { 樣態: "進取格局", 信號: ["擴張的願景", "成就導向的頂層追求", "把天花板往上頂"] }
      柔: { 樣態: "開闊留白", 信號: ["不做絕、留退路與餘裕", "和諧共生視角", "長期自然節奏"] }
      亢: { 樣態: "格局繃死(剛過極,動)", 信號: ["零餘地、唯效率、竭澤而漁", "『假期也不敢休』", "撐到裂"] }
      溺: { 樣態: "格局空掉(柔過極,動)", 信號: ["玄談不落地、願景無錨", "躺平無為失去生機——道箴『勿流於玄妙空談』的現場版"] }
  學理註腳: "三隅箴各是某爻過極的警語——理箴=理亢、用箴=用亢、道箴=道溺;亢/溺表把每爻兩側過極補齊,與三隅箴並存不衝突"
  變爻判定律:
    第一源_脈絡優先: "呈亢或溺之爻即動爻,附『何以見動』引文;方向不預設(初爻起/上爻爆/中爻卡皆可能),素材說了算"
    第二源_宣告校正: "有目標+TA 宣告:動爻與目標同向直接定;多個動爻或動爻與目標指向不同,以宣告裁決並列註明『脈絡動爻在 X,目標指向 Y』"
    第三源_菜單兜底: "無動爻無宣告:列三條一爻變路徑各附一句適用時機,選擇權還給使用者(G8 不猜)"
    一爻變: "一律一爻變,多爻變不做——一次給一個功課,才是可執行的處方"
  量形圖:
    頂點: "⑤ presence 三段:有料=長、薄=中、缺席=短——離散判定等級,非分數"
    形態:
      完整三角: "三層有料=完整格局"
      道頂縮: "趨韓非形(引唯用無道/道箴語彙;原典不完整三角形之視覺化)"
      理頂縮: "空談形"
      用頂縮: "自產病形"
      多頂縮: "依缺席清單並列敘述"
    輸出: "⑤段附一句量形描述(例『理長用長道中——趨韓非形之初』);判讀報告網頁版依三段長度繪三角形,縮頂以虛線"
  宣告體系:
    必宣告: ["素材類型(八型)", "判讀對象"]
    可選宣告: ["目標", "TA(素材的受眾,非判讀對象,不對 TA 做人的評價,G4)"]
    原則: "宣告越齊、⑥越準;未宣告不猜(G8)"
```

- [ ] **Step 4: 跑煙霧檢查與 YAML 驗證,確認全綠**

```bash
node tools/smoke-daoliyong-lens-schema.mjs
npx --yes js-yaml octenso/daoliyong-lens-schema-v0.2.yaml > /dev/null && echo "YAML OK"
```

Expected: `RESULT pass=N fail=0`(N ≥ 49:原 38 條中 version 斷言改版仍 1 條+新增 11 條)+ `YAML OK`。

- [ ] **Step 5: 同步 python 正典檢查器**

於 `tools/check-daoliyong-lens-schema.py`:

5a. `SCHEMA` 路徑檔名改 `"daoliyong-lens-schema-v0.2.yaml"`;version 斷言改:

```python
    check("meta.version == 0.2-draft", str(meta.get("version")) == "0.2-draft", f"got {meta.get('version')!r}")
```

5b. 在 FORBIDDEN 掃描之前插入:

```python
    gp = doc.get("guapan", {})
    check("guapan 區塊在位", bool(gp))
    check("工作假說標記", "工作假說" in str(gp.get("status", "")))
    check("canonical 聲明", "非起卦占斷" in str(gp.get("聲明", "")))
    check("四律齊全", all(x in gp.get("四律", {}) for x in ["非占卜律", "機械推導律", "主詞律", "不預測律"]))
    check("成卦門檻", "不成卦" in str(gp.get("成卦門檻", "")))
    gr = gp.get("剛柔判準", {})
    check("剛柔判準三爻", sorted(gr.keys()) == sorted(["li", "yong", "dao"]), f"got {sorted(gr.keys())}")
    for yk in ["li", "yong", "dao"]:
        yy = gr.get(yk, {})
        check(f"剛柔 {yk} 四態", all(x in yy for x in ["剛", "柔", "亢", "溺"]))
        for st in ["剛", "柔", "亢", "溺"]:
            e = yy.get(st, {})
            check(f"剛柔 {yk}.{st} 樣態+信號", bool(e.get("樣態")) and isinstance(e.get("信號"), list) and len(e["信號"]) >= 2)
    by = gp.get("變爻判定律", {})
    check("變爻三源+一爻變", all(x in by for x in ["第一源_脈絡優先", "第二源_宣告校正", "第三源_菜單兜底", "一爻變"]))
    qx = gp.get("量形圖", {})
    check("量形圖齊", "非分數" in str(qx.get("頂點", "")) and "趨韓非形" in str(qx.get("形態", {}).get("道頂縮", "")) and bool(qx.get("輸出")))
    sd = gp.get("宣告體系", {})
    check("宣告體系", isinstance(sd.get("必宣告"), list) and len(sd["必宣告"]) == 2
          and isinstance(sd.get("可選宣告"), list) and len(sd["可選宣告"]) == 2)
```

(不執行——本機無 python;寫好即可,審查為防線。)

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "octenso: lens-schema 升 v0.2-draft——判卦區塊(剛柔判準/變爻判定律/量形圖/四律)+檢查器雙軌擴充

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: SKILL.md 修訂 + COMPENDIUM + 全鏈路驗證

**Files:**
- Modify: `.claude/skills/bagua-lens/SKILL.md`(四處)
- Modify: `octenso/COMPENDIUM.md`(1.5 補行+決策史列)

**Interfaces:**
- Consumes: Task 2 的新檔名 `daoliyong-lens-schema-v0.2.yaml`(本地路徑與 raw URL 共兩處)、`guapan` 規格。
- Produces: 升級後的 bagua-lens 行為(宣告目標/TA、⑥判卦輸出)。

- [ ] **Step 1: SKILL.md 檔名更新(兩處)**

流程步驟 1 中 `octenso/daoliyong-lens-schema-v0.1.yaml` 全部改為 `octenso/daoliyong-lens-schema-v0.2.yaml`(本地路徑一處+raw URL 一處)。

- [ ] **Step 2: SKILL.md 宣告步驟加目標/TA**

流程步驟 3 句尾(「不要自己猜(G8:使用者宣告,系統不猜)」之後)接續加:

```markdown
。另有兩項可選宣告:**目標**與 **TA**(素材的受眾,非判讀對象)——宣告越齊、⑥越準;未宣告不猜。
```

- [ ] **Step 3: SKILL.md ⑥段換新規格**

流程步驟 4 中既有「→⑥道理用參考(至多 2 個相應模式腳本,必附死角+防範;措辭「此局面可考慮」;相應性不足明寫「本次無合適對策參考」)」整段替換為:

```markdown
→⑥判卦與轉化參考(工作假說·待收斂,依 schema guapan 區塊):剛柔判定表(三爻各判剛/柔+安/動,每格附逐字引文)→本卦(以 guaOf 反查:卦名+副題+此局死角)→變爻(三源合流:脈絡動爻→宣告校正→菜單兜底)→之卦(以 bianOf 反查:轉化腳本+新死角);必附聲明「此卦由素材判讀推導,非起卦占斷;變爻是處方,不是預言。」;不成卦時明文聲明+缺哪爻+補問,⑥退回 bestUse 對照引用(至多 2 個、必附死角、寧缺勿濫);⑤段附量形描述一句
```

- [ ] **Step 4: SKILL.md backlog 第五類+紅線**

4a. 迭代模式「記進待辦」的第四類(三層判定分歧)之後加:

```markdown
   - **判卦分歧**:本卦不服/變爻不服/之卦不服分開記(三個部位校準訊號不同;候選:剛柔判準/變爻判定律)
```

4b. 進化紅線句中「三層定義與三隅箴同等待遇」之後接續加:

```markdown
;剛柔判準三表與變爻判定律亦同(動之前逐條經 Simon 核准)
```

- [ ] **Step 5: COMPENDIUM 補行+決策史**

5a. §1.5 內「透鏡端已接立體檢視」bullet 之後加:

```markdown
- **判卦引擎(2026-07-21,v0.2-draft·工作假說)**:⑥升級為本卦→變爻→之卦(剛=陽柔=陰,反查 `daoliyong-data.js` 之 guaOf/bianOf;一律一爻變;三角形量形圖);宣告體系加目標+TA(可選)。
```

5b. §9 決策史「八態鏡 v2·立體檢視」列之後加:

```markdown
| 07-21 | **八態鏡 v3·判卦引擎**(本卦→變爻→之卦;剛柔判準+變爻判定律三源;lens-schema 升 v0.2-draft·工作假說) |
```

- [ ] **Step 6: 全鏈路驗證**

```bash
node tools/smoke-daoliyong-lens-schema.mjs
grep -c "v0.1.yaml" .claude/skills/bagua-lens/SKILL.md
grep -c "guapan\|判卦" .claude/skills/bagua-lens/SKILL.md
git diff main --stat
git diff main -- octenso/octenso-states-schema-v0.1.yaml | wc -l
```

Expected:煙霧 `fail=0`;SKILL.md 中 `v0.1.yaml` 命中 **0**(全數改 v0.2);`判卦` 命中 ≥ 3;diff 範圍僅 spec/plan/schema(改名)/data.js/測試頁/兩檢查器/SKILL.md/COMPENDIUM;states-schema diff = 0。

- [ ] **Step 7: Commit**

```bash
git add .claude/skills/bagua-lens/SKILL.md octenso/COMPENDIUM.md
git commit -m "skill+docs: bagua-lens 接判卦引擎(⑥新規格/目標+TA 宣告)+COMPENDIUM 條目

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## 驗收備註(實作後)

merge 後第一件事(使用者指定):以 v3 引擎**重判A 集團總報告**(判卦+量形圖,網頁版)——即判卦區塊行為驗收素材 #1;回饋按本卦/變爻/之卦分開收。

## Self-Review(已執行)

1. **Spec coverage**:§1 helpers+改名 → Tasks 1/2;§2 剛柔三表 → Task 2 Step 3b(YAML 全文);§3 變爻判定律 → 同上;§4 輸出+宣告 → Task 3 Steps 2–3;§4.5 量形 → Task 2(schema)+Task 3(⑥文字);§5 四律 → Task 2(YAML)+聲明入 SKILL;§6 四處修訂 → Task 3;§7 測試 → Task 1(32 枚舉)+Task 2(檢查器);§8 不做 → 全計畫無多爻變/64卦/程度分/UI;§9 對應 → Tasks 1–3 齊。無缺口。
2. **Placeholder scan**:無 TBD/TODO;全部程式碼與插入文字逐字在案。
3. **Type consistency**:`guaOf(li,yong,dao)`/`bianOf(k,yao)` 簽名在 Task 1 實作、Task 1 測試、Task 2 schema 文字、Task 3 SKILL 文字一致;檔名 v0.2 在 Task 2 兩檢查器與 Task 3 SKILL 一致;canonical 聲明字串三處(schema/smoke/SKILL)逐字一致;預期測試數 137=103+8+24+2 核算無誤。
