# 八態鏡 v0.3.1 · 判讀紀律六律 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 依 spec `docs/superpowers/specs/2026-07-22-daoliyong-rules-031-design.md`,將六律(證據純化/雙訊號裁決/歸格例句庫/成爻門檻/次型註記/以小觀大)落入 schema、檢查器與 SKILL。

**Architecture:** schema 就地增修(guapan 加「判讀紀律」與「歸格例句庫」、liuyao 升級門檻補四階階梯、meta 升 0.3.1-draft),雙軌檢查器同步,SKILL 兩處微修,COMPENDIUM 一列。無 JS 變更;既有內容一字不動。

**Tech Stack:** YAML、Markdown、Node 煙霧、Python 正典(不本機執行)。

## Global Constraints

- 分支:`octenso/daoliyong-rules-031`(spec 已 commit `aec9c4c`)。
- 六律條文逐字依 spec §1(Simon 已核准,不得改寫)。
- schema 既有內容除 meta 兩處與指定插入外一字不動;繁中無 emoji;G1–G8 凍結。
- 本機 python 為 stub;本地驗證=node 煙霧+`npx --yes js-yaml`。
- commit 訊息結尾:`Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`。

---

### Task 1: schema 六律落地 + 檢查器雙軌

**Files:**
- Modify: `tools/smoke-daoliyong-lens-schema.mjs`(先改,TDD)
- Modify: `octenso/daoliyong-lens-schema-v0.2.yaml`
- Modify: `tools/check-daoliyong-lens-schema.py`(同步,不執行)

**Interfaces:**
- Produces: `guapan.判讀紀律{證據純化律/同爻雙訊號裁決/成爻門檻/素材次型註記/次型原則}`、`guapan.歸格例句庫[6]`、`liuyao.升級門檻` 含四階階梯、`meta.version=="0.3.1-draft"`。

- [ ] **Step 1: 改煙霧檢查(會失敗)**

1a. `ck('meta.version 0.3-draft', /version:\s*"0\.3-draft"/.test(t));` 改為:

```js
ck('meta.version 0.3.1-draft', /version:\s*"0\.3\.1-draft"/.test(t));
```

1b. 在「防複寫」區塊之前插入:

```js
// 判讀紀律六律(v0.3.1)
ck('判讀紀律區塊', has('判讀紀律:'));
ck('證據純化律', has('證據純化律') && has('這是誰的行為'));
ck('雙訊號裁決+爻疑', has('同爻雙訊號裁決') && has('爻疑'));
ck('成爻門檻:孤證', has('成爻門檻') && has('孤證'));
ck('素材次型四型', has('宣言型') && has('調查型') && has('內部報告型') && has('成功敘事型'));
ck('歸格例句庫', has('歸格例句庫:') && has('不敢休') && has('意義真空') && has('怎麼做都不夠好'));
ck('以小觀大四階', has('以小觀大') && has('半象') && has('爻象深讀') && has('局部深探'));
```

- [ ] **Step 2: 跑煙霧確認失敗**

`node tools/smoke-daoliyong-lens-schema.mjs` → Expected: 多條 FAIL,exit 1。

- [ ] **Step 3: 增修 schema**

3a. meta:`version: "0.3-draft"` → `version: "0.3.1-draft"`;`history` 值尾端接續:

```
;v0.3.1-draft 判讀紀律六律(雙盲#1 五缺口+Simon 以小觀大),博報堂裁定內坎(半象)
```

3b. `liuyao.升級門檻` 字串尾端(「…不由使用者選」之後)接續:

```
;不成階梯:六爻不成→局部深探(半象/爻象深讀,以小觀大明標其小)→三爻(全池)→不成
```

3c. 在 `liuyao` 區塊之後(guapan 尾端)插入:

```yaml
  判讀紀律:
    證據純化律: "引文計入某爻前先問『這是誰的行為』——判讀對象之外的行為者(委辦方/供應商/報告撰寫者)之品質,不得計入判讀對象任何爻。例:健檢量表之信效度嚴謹=承辦團隊之理,非受檢集團之理"
    同爻雙訊號裁決: "同一爻同現亢與溺訊號:(1)先重驗歸格(多數衝突源於歸格錯誤,如零餘地訊號常屬用層外溢);(2)重歸格後仍衝突=該爻判『動』確定,陰陽並列兩讀、標『爻疑』;兩讀各推卦,同卦則定,異卦則並列+補問(G8 不猜)"
    成爻門檻: "每爻 >=2 句獨立引文(不同段落)方成爻;孤證=該爻標『薄』不成爻"
    素材次型註記: ["宣言型(用層預期缺席)", "調查型(負向偏置)", "內部報告型(外池天生薄)", "成功敘事型(倖存偏置)"]
    次型原則: "宣告時附註次型,報告帶偏置聲明;預期缺席不列病理"
  歸格例句庫:
    - "『不敢休/筆電隨身』=用爻亢(輸出停不下)"
    - "『假期存在但無法放鬆』=道爻(餘地機制失效)"
    - "『被客戶時程牽走』=外用溺"
    - "『不知為何努力/意義真空』=道爻溺"
    - "『怎麼做都不夠好』=理爻溺(根基被評價體系牽走)"
    - "『方法論嚴謹』=僅當屬判讀對象自身(接證據純化律)"
```

- [ ] **Step 4: 跑煙霧+YAML 驗證確認全綠**

```bash
node tools/smoke-daoliyong-lens-schema.mjs
npx --yes js-yaml octenso/daoliyong-lens-schema-v0.2.yaml > /dev/null && echo "YAML OK"
```

Expected:`RESULT pass=70 fail=0`(原 63 中 version 改版仍 1 條+新增 7 條)+ `YAML OK`。

- [ ] **Step 5: 同步 python 檢查器(不執行)**

version 斷言改 `"0.3.1-draft"`;FORBIDDEN 掃描前插入:

```python
    jl = gp.get("判讀紀律", {})
    check("判讀紀律四鍵+次型原則", all(x in jl for x in ["證據純化律", "同爻雙訊號裁決", "成爻門檻", "素材次型註記", "次型原則"]))
    check("爻疑在位", "爻疑" in str(jl.get("同爻雙訊號裁決", "")))
    check("孤證不成爻", "孤證" in str(jl.get("成爻門檻", "")))
    check("次型四型", isinstance(jl.get("素材次型註記"), list) and len(jl["素材次型註記"]) == 4)
    gk = gp.get("歸格例句庫", [])
    check("歸格例句庫六條", isinstance(gk, list) and len(gk) >= 6)
    check("以小觀大階梯", "以小觀大" in str(ly.get("升級門檻", "")) and "半象" in str(ly.get("升級門檻", "")) and "爻象深讀" in str(ly.get("升級門檻", "")))
```

- [ ] **Step 6: Commit**

```bash
git add octenso/daoliyong-lens-schema-v0.2.yaml tools/smoke-daoliyong-lens-schema.mjs tools/check-daoliyong-lens-schema.py
git commit -m "octenso: schema 0.3.1——判讀紀律六律+歸格例句庫+以小觀大四階(雙盲修訂)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: SKILL 兩處 + COMPENDIUM + 全鏈路驗證

**Files:**
- Modify: `.claude/skills/bagua-lens/SKILL.md`(兩處)
- Modify: `octenso/COMPENDIUM.md`(決策史一列)

- [ ] **Step 1: SKILL ⑥段句首補紀律引用**

「⑥判卦與轉化參考(工作假說·待收斂,依 schema guapan 區塊):」改為:

```markdown
⑥判卦與轉化參考(工作假說·待收斂,依 schema guapan 區塊;判定悉依判讀紀律與歸格例句庫):
```

- [ ] **Step 2: SKILL 不成階梯四階**

「六爻不成退回三爻版並註明缺哪池哪爻」改為:

```markdown
六爻不成依四階階梯退回:局部深探(半象/爻象深讀,以小觀大)→三爻版→不成,並註明缺哪池哪爻
```

- [ ] **Step 3: COMPENDIUM 決策史加列**

「八態鏡 v4·六爻判卦」列之後加:

```markdown
| 07-22 | **八態鏡 v0.3.1·判讀紀律六律**(雙盲#1 出土五缺口+以小觀大;博報堂裁定內坎半象;證據純化/爻疑/成爻門檻/歸格例句庫/次型註記) |
```

- [ ] **Step 4: 全鏈路驗證**

```bash
node tools/smoke-daoliyong-lens-schema.mjs
grep -c "判讀紀律\|以小觀大" .claude/skills/bagua-lens/SKILL.md octenso/COMPENDIUM.md
git diff main --stat
git diff main -- octenso/octenso-states-schema-v0.1.yaml octenso/daoliyong-data.js | wc -l
```

Expected:煙霧 fail=0;兩檔皆命中 ≥1;diff 僅 spec/plan/schema/兩檢查器/SKILL/COMPENDIUM(7 檔);最後=0。

- [ ] **Step 5: Commit**

```bash
git add .claude/skills/bagua-lens/SKILL.md octenso/COMPENDIUM.md
git commit -m "skill+docs: 六律引用+不成階梯四階+COMPENDIUM 條目

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## 驗收備註

merge 後以新六律重判博報堂收官(半象內坎正式落地)。

## Self-Review(已執行)

1. Spec coverage:§1 六律 → Task 1 Step 3c(逐字)+3b(第六律階梯);§2 → 3a/3b/3c;§3 → Task 1 Steps 1/5+Task 2;§4 → 驗證步+無 JS。無缺口。
2. Placeholder scan:無。
3. Type consistency:鍵名(判讀紀律/歸格例句庫/爻疑/半象/爻象深讀)三處(YAML/smoke/python)一致;70=63+7 核算。
