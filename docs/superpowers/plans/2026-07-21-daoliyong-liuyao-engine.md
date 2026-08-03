# 八態鏡 v4 · 六爻判卦引擎 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 依 spec `docs/superpowers/specs/2026-07-21-daoliyong-liuyao-engine-design.md`,在 lens-schema 的 guapan 區塊內建立 liuyao 子區塊(內外分池×64 卦規則)、SKILL.md 接上六爻分支與第四真相源。

**Architecture:** 純規則層工程——schema 就地擴充(檔名不動,meta 升 0.3-draft)、SKILL 四處修訂、檢查器雙軌同步;**無 JS 變更**(64 卦反查由 AI 依 64 需求表查,卦名=內·外命名法表內即有)。三爻版(v3)一字不動,作為預設與退回路徑。

**Tech Stack:** YAML、Markdown、Node(煙霧 checker)、Python3+PyYAML(正典 checker,本機不執行)。

## Global Constraints

- 分支:`octenso/daoliyong-liuyao`(已存在,spec 已 commit `dbf3b1a`)。
- **檔名不動**:`octenso/daoliyong-lens-schema-v0.2.yaml` 就地擴充;僅 `meta.version` 升 `"0.3-draft"`、`meta.history` 延伸;guapan 既有內容(v3 三爻規則)一字不動。
- 排法 B 寫死:下卦=內(初=內理/二=內用/三=內道)、上卦=外(四=外理/五=外用/上=外道);排法 A 僅學理註。
- 雙假說印章字樣(逐字):「工作假說·待收斂(與 64 表 v0.1 待終審雙印章)」。
- 64 表路徑(逐字):`docs/superpowers/specs/2026-06-30-bagua-64-energy-demand-table.md`。
- 本機 python 為 stub;本地驗證=node 煙霧 checker+`npx --yes js-yaml`;python checker 為正典(CI/他機)。
- 文案繁體中文、不用 emoji;G1–G8 凍結;states-schema/測驗端/JS/HTML 一律不動。
- commit 訊息結尾:`Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`。

---

### Task 1: schema liuyao 子區塊 + 檢查器雙軌擴充

**Files:**
- Modify: `tools/smoke-daoliyong-lens-schema.mjs`(先改,TDD)
- Modify: `octenso/daoliyong-lens-schema-v0.2.yaml`(meta 兩處+guapan 內插入)
- Modify: `tools/check-daoliyong-lens-schema.py`(同步,不執行)

**Interfaces:**
- Consumes: 既有 guapan 區塊(v0.2,三爻判卦規則)。
- Produces: `guapan.liuyao` 子區塊,鍵結構:`status/排法/學理註/真相源/分池(內池·外池·歸池三原則)/升級門檻/動爻規則/召喚對照/輸出關係`;`guapan.剛柔判準註(絕對質性·亢溺判別)`;`meta.version == "0.3-draft"`。Task 2 的 SKILL.md 依此引用。

- [ ] **Step 1: 改煙霧檢查(會失敗)**

於 `tools/smoke-daoliyong-lens-schema.mjs`:

1a. `ck('meta.version 0.2-draft', /version:\s*"0\.2-draft"/.test(t));` 改為:

```js
ck('meta.version 0.3-draft', /version:\s*"0\.3-draft"/.test(t));
```

1b. 在「防複寫」區塊之前插入:

```js
// 六爻子區塊(v0.3)
ck('liuyao 子區塊', has('liuyao:'));
ck('雙假說印章', has('工作假說·待收斂(與 64 表 v0.1 待終審雙印章)'));
ck('排法 B 寫死', has('下卦=內在運作的理用道') && has('上卦=對外運作的理用道'));
ck('排法 A 學理註', has('排法 A') && has('萬物對應圖'));
ck('64 表真相源', has('docs/superpowers/specs/2026-06-30-bagua-64-energy-demand-table.md'));
ck('分池兩定義', has('內池:') && has('外池:'));
ck('歸池三原則', has('歸池三原則') && has('界隨對象移動') && has('行為的受向'));
ck('升級門檻', has('升級門檻') && has('六爻不成'));
ck('動爻規則四條', has('動爻規則') && has('照實全列') && has('宣告裁決優先') && has('靜卦'));
ck('動爻>=4 加註', has('菜單失焦'));
ck('召喚對照', has('召喚對照') && has('召喚而缺席=首要功課'));
ck('輸出關係', has('輸出關係') && has('三爻版省略'));
ck('剛柔判準註:絕對質性', has('絕對質性') && has('非相對比較'));
ck('剛柔判準註:亢溺判別', has('自驅過極=亢') && has('被外牽走=溺'));
```

- [ ] **Step 2: 跑煙霧檢查,確認失敗**

```bash
node tools/smoke-daoliyong-lens-schema.mjs
```

Expected: 多條 FAIL(liuyao 未寫入、version 仍 0.2-draft),exit 1。

- [ ] **Step 3: 擴充 schema**

於 `octenso/daoliyong-lens-schema-v0.2.yaml`:

3a. meta 兩處(其餘一字不動):`version: "0.2-draft"` → `version: "0.3-draft"`;`history` 值尾端接續(同一字串內):

```
;v0.3-draft 新增六爻子區塊(liuyao),v3 首判分歧(乾/兌)為立案案例
```

3b. 在 `guapan.宣告體系` 區塊之後(guapan 區塊尾端)插入:

```yaml
  剛柔判準註:
    絕對質性: "剛柔為絕對質性判定,非相對比較——不與他爻比強弱(相對形勢觀屬⑤量形圖);全剛/全柔之卦必須可達"
    亢溺判別: "亢與溺在過勞終點外觀相同(都停不下),判別=動力來源:自驅過極=亢(剛),被外牽走=溺(柔)"
  liuyao:
    status: "工作假說·待收斂(與 64 表 v0.1 待終審雙印章)"
    排法: "B:下卦=內在運作的理用道(初=內理/二=內用/三=內道)、上卦=對外運作的理用道(四=外理/五=外用/上=外道);六爻卦=內卦×外卦,以卦名(內·外)查 64 卦能量需求表"
    學理註: "排法 A(原典三才式:初二=理/三四=用/五六=天道,萬物對應圖之六爻對映)留作溯源註腳,不入引擎——同六判定不同堆法得不同卦,引擎寫死排法 B 以守機械推導律"
    真相源: "docs/superpowers/specs/2026-06-30-bagua-64-energy-demand-table.md(64 卦卦旨/時勢基調/召喚節制/經典依據;該表 v0.1 未經易學專家終審)"
    分池:
      內池: "判讀對象內部的運作——成員彼此如何對待、內部流程與制度、內部文化語言、自我要求與自我對話、內部資源調度(→內卦/下卦)"
      外池: "判讀對象對外部世界的運作——對客戶/市場/合作方/公眾的行為與姿態、對外承諾與表達、對外部環境變化的應對(→外卦/上卦)"
      歸池三原則:
        - "以判讀對象為界,界隨對象移動(對象=集團:員工彼此=內、客戶=外;對象=某 BU:其他 BU=外)"
        - "每句引文歸一池,歸池理由可追問(G5 延伸:引文+歸池依據)"
        - "模糊句以『行為的受向』判——動作作用在誰身上就歸哪池"
    升級門檻: "兩池各自撐起三爻剛柔判定(六格各附引文)→ 成六爻;任一池不足=退回三爻版(全素材合池),明文『六爻不成——某池證據不足』+補問;厚素材自動升級,不由使用者選"
    動爻規則:
      - "動爻照實全列,各附『何以見動』引文,不隱藏不挑選"
      - "轉化菜單=每動爻一條路(翻爻→之卦,64 表反查),附適用時機;宣告裁決優先(有目標/TA 引擎聚焦一條並說理由),無宣告菜單並列(G8 不猜)"
      - "動爻>=4:加註『局勢多處臨界,菜單失焦;建議宣告目標聚焦,或先處理①–④缺席警示』——不發明亂局占法"
      - "靜卦(零動爻):本卦即安,只給 64 表卦旨與召喚/節制作維持參考"
    召喚對照: "64 表『召喚/節制』×①–④ presence 交叉驗證——召喚而缺席=首要功課;召喚而有料=順勢可用;節制而正強=第一級警訊;咬不上=分歧素材記 backlog"
    輸出關係: "六爻成卦時三爻版省略(內外卦即兩個三爻模式,MODES 腳本直接可引);量形圖照舊;六爻不成整段退回三爻版"
```

- [ ] **Step 4: 跑煙霧檢查與 YAML 驗證,確認全綠**

```bash
node tools/smoke-daoliyong-lens-schema.mjs
npx --yes js-yaml octenso/daoliyong-lens-schema-v0.2.yaml > /dev/null && echo "YAML OK"
```

Expected: `RESULT pass=63 fail=0`(原 49 條中 version 斷言改版仍 1 條+新增 14 條)+ `YAML OK`。

- [ ] **Step 5: 同步 python 正典檢查器(不執行)**

於 `tools/check-daoliyong-lens-schema.py`,version 斷言改:

```python
    check("meta.version == 0.3-draft", str(meta.get("version")) == "0.3-draft", f"got {meta.get('version')!r}")
```

並在 FORBIDDEN 掃描之前插入:

```python
    zh = gp.get("剛柔判準註", {})
    check("剛柔判準註兩條", "非相對比較" in str(zh.get("絕對質性", "")) and "動力來源" in str(zh.get("亢溺判別", "")))
    ly = gp.get("liuyao", {})
    check("liuyao 子區塊在位", bool(ly))
    check("雙假說印章", "雙印章" in str(ly.get("status", "")))
    check("排法 B", "下卦=內在運作的理用道" in str(ly.get("排法", "")))
    check("排法 A 學理註", "排法 A" in str(ly.get("學理註", "")))
    check("64 表真相源", "2026-06-30-bagua-64-energy-demand-table.md" in str(ly.get("真相源", "")))
    fc = ly.get("分池", {})
    check("分池兩定義", bool(fc.get("內池")) and bool(fc.get("外池")))
    check("歸池三原則", isinstance(fc.get("歸池三原則"), list) and len(fc["歸池三原則"]) == 3)
    check("升級門檻", "六爻不成" in str(ly.get("升級門檻", "")))
    check("動爻規則四條", isinstance(ly.get("動爻規則"), list) and len(ly["動爻規則"]) == 4)
    check("召喚對照", "首要功課" in str(ly.get("召喚對照", "")))
    check("輸出關係", "三爻版省略" in str(ly.get("輸出關係", "")))
```

- [ ] **Step 6: Commit**

```bash
git add octenso/daoliyong-lens-schema-v0.2.yaml tools/smoke-daoliyong-lens-schema.mjs tools/check-daoliyong-lens-schema.py
git commit -m "octenso: lens-schema 升 0.3-draft——liuyao 子區塊(內外分池×64卦)+剛柔判準註+檢查器雙軌擴充

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: SKILL.md 修訂(四處)

**Files:**
- Modify: `.claude/skills/bagua-lens/SKILL.md`

**Interfaces:**
- Consumes: Task 1 的 `guapan.liuyao` 規格與 64 表路徑。
- Produces: 升級後的 bagua-lens 行為(六爻自動分支)。

- [ ] **Step 1: 步驟 1 真相源加第四份**

在「腳本與三角形文本:`octenso/daoliyong-data.js`…」那行之後加一行:

```markdown
   - 局卦層(六爻成卦時讀):`docs/superpowers/specs/2026-06-30-bagua-64-energy-demand-table.md`(64 卦需求表,v0.1 待終審)
```

並在 raw URL 清單末尾加:

```markdown
   - `https://raw.githubusercontent.com/flow222git/jte-platform-2026/main/docs/superpowers/specs/2026-06-30-bagua-64-energy-demand-table.md`
```

- [ ] **Step 2: 步驟 4 ⑥段補六爻分支**

在⑥段文字結尾(「…⑥退回 bestUse 對照引用(至多 2 個、必附死角、寧缺勿濫);⑤段附量形描述一句」)之後接續加:

```markdown
。素材厚時(內外兩池各撐三爻,依 schema guapan.liuyao 分池規則與升級門檻)自動升六爻版:分池剛柔判定表(6 格,每格剛柔+安動+引文+歸池依據)→本卦(內卦×外卦,查 64 需求表:卦旨/時勢基調/召喚節制/經典依據;內外卦各自的 MODES 腳本可引)→召喚對照(64 表召喚/節制×①–④presence:召喚而缺席=首要功課)→動爻+轉化菜單(依 liuyao 動爻規則)→之卦(64 表反查+新死角);掛雙假說印章;六爻成卦時三爻版省略;六爻不成退回三爻版並註明缺哪池
```

- [ ] **Step 3: backlog 判卦分歧補六爻**

「**判卦分歧**:本卦不服/變爻不服/之卦不服分開記(三個部位校準訊號不同;候選:剛柔判準/變爻判定律)」句尾接續加:

```markdown
;六爻:分池歸屬不服也記(候選:歸池三原則)
```

- [ ] **Step 4: 進化紅線補句**

紅線句「;剛柔判準三表與變爻判定律亦同(動之前逐條經 Simon 核准)」之後接續加:

```markdown
;分池規則與六爻規則亦同
```

- [ ] **Step 5: 驗證**

```bash
grep -c "64-energy-demand" .claude/skills/bagua-lens/SKILL.md
grep -c "六爻" .claude/skills/bagua-lens/SKILL.md
git diff --stat
```

Expected: `64-energy-demand` 命中 2(本地+raw URL);`六爻` ≥ 3;diff 僅 SKILL.md 一檔。重讀修訂後全文確認四處在位、G1–G8 未動。

- [ ] **Step 6: Commit**

```bash
git add .claude/skills/bagua-lens/SKILL.md
git commit -m "skill: bagua-lens 接六爻判卦——第四真相源(64 表)+⑥六爻自動分支

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: COMPENDIUM + 全鏈路驗證

**Files:**
- Modify: `octenso/COMPENDIUM.md`(1.5 補行+決策史列)

**Interfaces:**
- Consumes: Tasks 1–2 完成後的 repo 狀態。
- Produces: 文件索引+全綠證據。

- [ ] **Step 1: §1.5 補一行**

「**判卦引擎(2026-07-21,v0.2-draft·工作假說)**…」bullet 之後加:

```markdown
- **六爻升級(2026-07-21,0.3-draft·雙假說)**:厚素材自動升六爻——內外分池×三才剛柔=64 卦,接 64 卦能量需求表(召喚對照閉環);三爻版為預設與退回路徑。
```

- [ ] **Step 2: §9 決策史加一列**

「| 07-21 | **八態鏡 v3·判卦引擎**…」列之後加:

```markdown
| 07-21 | **八態鏡 v4·六爻判卦**(內外分池×64 卦;召喚對照閉環;雙假說印章;夬卦手演立案) |
```

- [ ] **Step 3: 全鏈路驗證**

```bash
node tools/smoke-daoliyong-lens-schema.mjs
grep -c "liuyao\|六爻" .claude/skills/bagua-lens/SKILL.md octenso/COMPENDIUM.md
git diff main --stat
git diff main -- octenso/octenso-states-schema-v0.1.yaml octenso/daoliyong-data.js | wc -l
```

Expected: 煙霧 `fail=0`;SKILL 與 COMPENDIUM 皆命中;diff 範圍僅 spec/plan/schema/兩檢查器/SKILL.md/COMPENDIUM(共 7 檔);states-schema 與 daoliyong-data.js diff = **0**。

- [ ] **Step 4: Commit**

```bash
git add octenso/COMPENDIUM.md
git commit -m "docs: COMPENDIUM 補八態鏡 v4 六爻條目

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## 驗收備註(實作後)

merge 後第一件事(使用者指定):**A 集團重判之二(六爻版)**——夬卦手演轉正式;回饋按分池/本卦/動爻/之卦/召喚對照五部位收。其後:公開素材校準計畫(backlog,「萬物可視引擎」路線)。

## Self-Review(已執行)

1. **Spec coverage**:§1 分池 → Task 1 Step 3b(YAML 全文);§2 六爻判定+動爻+剛柔補註 → 同上;§3 64 表接入+輸出結構 → Task 1(schema)+Task 2 Step 2(SKILL);§4 版號 → Task 1 Step 3a;§5 四處修訂 → Task 2;§6 檢查器 → Task 1 Steps 1/5、無 JS 變更全計畫成立;§7 不做 → 無多爻變/JS/爻辭內容;§8 對應 → Tasks 1–3。無缺口。
2. **Placeholder scan**:無 TBD/TODO;YAML、檢查器、SKILL、COMPENDIUM 文字全文在案。
3. **Type consistency**:`liuyao` 鍵結構(status/排法/學理註/真相源/分池/升級門檻/動爻規則/召喚對照/輸出關係)在 YAML、smoke(14 條)、python(12 條)三處鍵名一致;雙印章字樣、64 表路徑逐字一致;預期 63=49+14 核算(version 斷言改版非新增)。
