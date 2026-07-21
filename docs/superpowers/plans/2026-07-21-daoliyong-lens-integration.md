# 八態鏡 v2 · 立體檢視引擎 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 依 spec `docs/superpowers/specs/2026-07-21-daoliyong-lens-integration-design.md`,建立三角形體檢的 canonical schema、修訂 bagua-lens SKILL.md 接上⑤⑥段輸出、補文件索引。

**Architecture:** 新增 `octenso/daoliyong-lens-schema-v0.1.yaml`(三層判準,結構比照 states-schema),配 python 正典檢查器(比照 `tools/check-states-schema.py`)+ node 煙霧檢查(本機 python 不可用時的 fallback)。SKILL.md 改為讀三份真相源、輸出加⑤⑥。states-schema 與所有 JS/HTML 一字不動。

**Tech Stack:** YAML、Python3+PyYAML(檢查器,正典)、Node(煙霧檢查)、Markdown。

## Global Constraints

- 分支:`octenso/daoliyong-lens`(已存在,spec 已 commit 於 `74d2f13`)。
- **不動**:`octenso/octenso-states-schema-v0.1.yaml`、G1–G8、任何 JS/HTML、測驗端。
- 新 schema **不得複寫**:八態定義(禁出現欄位名「主稱呼」「雅稱」「分支角色」「低載信號」「成熟表現」)與模式腳本內文(禁出現副題字樣如「剛健不息」「度險誠信」)——引用一律指名參照 `daoliyong-data.js`。
- G1–G8 以參照方式適用(`guardrails_ref`),不複製條文全文進新檔。
- 文案繁體中文、不用 emoji;半形斜線鍵名(如 `文件/BP`)比照 states-schema。
- 本機 `python`/`python3` 為 WindowsApps stub 不可執行;本地驗證一律用 node 煙霧檢查與 `npx --yes js-yaml`(YAML 語法驗證);python 檢查器為正典,於有 python3 的環境(CI/其他機器)執行。
- commit 訊息結尾加:`Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`。

---

### Task 1: 新 canonical schema + 雙軌檢查器

**Files:**
- Create: `tools/smoke-daoliyong-lens-schema.mjs`(node 煙霧檢查,先寫=測試)
- Create: `octenso/daoliyong-lens-schema-v0.1.yaml`(canonical)
- Create: `tools/check-daoliyong-lens-schema.py`(python 正典檢查器)

**Interfaces:**
- Consumes: `octenso/daoliyong-data.js` 的 `TRIANGLE`(真善美/四德/三隅箴文本)與 `MODES`(腳本)——僅指名參照,不讀取內容。
- Produces: `octenso/daoliyong-lens-schema-v0.1.yaml`,頂層鍵 `meta / layers(li·yong·dao) / sanyu_warnings(kongtan·zichanbing·weiyongwudao) / output_spec / acceptance`。Task 2 的 SKILL.md 以此路徑與 raw URL 參照。

- [ ] **Step 1: 寫 node 煙霧檢查(會失敗)**

建立 `tools/smoke-daoliyong-lens-schema.mjs`,完整內容:

```js
// 本地煙霧檢查——canonical 檢查器為 check-daoliyong-lens-schema.py(python3 環境執行);
// 本機 python 不可用時以本檔做結構把關。用法:node tools/smoke-daoliyong-lens-schema.mjs
import { readFileSync } from 'fs';

let t;
try {
  t = readFileSync(new URL('../octenso/daoliyong-lens-schema-v0.1.yaml', import.meta.url), 'utf8');
} catch (e) {
  console.log('FAIL schema 檔不存在');
  console.log('RESULT pass=0 fail=1');
  process.exit(1);
}

let pass = 0, fail = 0;
const ck = (name, ok) => { if (ok) { pass++; } else { fail++; console.log('FAIL  ' + name); } };
const has = (s) => t.includes(s);
const count = (s) => t.split(s).length - 1;

// meta 與誠實標記
ck('meta.version 0.1', /version:\s*"0\.1"/.test(t));
ck('研究假設標記', has('研究假設'));
ck('guardrails_ref 參照 G1–G8', has('guardrails_ref') && has('G1'));
ck('canonical_ref 指向 data.js', has('canonical_ref') && has('daoliyong-data.js'));

// 三層錨點(萬物對應圖)
ck('理 錨點', has('爻位: "地之位"') && has('價值: "真(客觀)"') && has('四德: "亨(事物通達)"'));
ck('用 錨點', has('爻位: "人之位"') && has('價值: "善(人間美德)"') && has('四德: "利與貞(造福與堅持)"'));
ck('道 錨點', has('爻位: "天之位"') && has('價值: "大美"') && has('四德: "元(萬物創始)"'));

// 三層欄位齊全(各出現 >= 3 次)
for (const f of ['核心提問:', '定位:', '識別信號:', '語言線索:', '行為線索:',
                 '正例引文形狀:', '缺席判定:', '混淆對照:', '禁止推論:']) {
  ck(`欄位 ${f} x3`, count(f) >= 3);
}
ck('行為線索三面 x3', count('會議:') >= 3 && count('文件/BP:') >= 3 && count('制度:') >= 3);

// 三隅箴警示
ck('空談警示', has('空談警示') && has('kongtan'));
ck('自產病警示', has('自產病警示') && has('zichanbing'));
ck('唯用無道警示', has('唯用無道警示') && has('weiyongwudao') && has('皆有料'));
ck('唯用無道守 G1', has('不預測'));

// 輸出規格
ck('第五段規格', has('三角形體檢') && has('一層不可省略'));
ck('第六段規格', has('至多 2') && has('此局面可考慮') && has('寧缺勿濫'));
ck('G7 適用範圍', has('interview') && has('observation'));

// 驗收
ck('acceptance 存在', has('acceptance:') && has('三值回饋'));

// 防複寫(八態專屬欄位與模式副題不得出現)
for (const bad of ['主稱呼', '雅稱', '分支角色', '低載信號', '成熟表現',
                   '剛健不息', '包容孕育', '柔和爆發', '滲透影響',
                   '度險誠信', '團隊燃燒', '不動如山', '喜悅溝通']) {
  ck(`防複寫:無「${bad}」`, !has(bad));
}

console.log('RESULT pass=' + pass + ' fail=' + fail);
process.exit(fail ? 1 : 0);
```

- [ ] **Step 2: 跑煙霧檢查,確認失敗**

```bash
node tools/smoke-daoliyong-lens-schema.mjs
```

Expected: `FAIL schema 檔不存在` + `RESULT pass=0 fail=1`,exit 1。

- [ ] **Step 3: 寫 canonical schema**

建立 `octenso/daoliyong-lens-schema-v0.1.yaml`,完整內容(逐字轉錄;內容依 spec §2 定案):

```yaml
# =====================================================
# 道理用透鏡層(三角形體檢)機器可讀定義
# daoliyong-lens-schema v0.1
# =====================================================
# 用途:八態鏡透鏡判讀之「⑤三角形體檢/⑥道理用參考」的唯一判準。
# 上游 spec:docs/superpowers/specs/2026-07-21-daoliyong-lens-integration-design.md
# 學理:吳怡「整體生命哲學三角形(道、理、用)」;萬物對應圖(真善美 × 元亨利貞 × 三才爻位)。
# 對齊北極星:meta A 同源/鏡子非算命/誠實邊界。
# 本檔只定「判準」;真善美/四德/三隅箴之 canonical 文本與八模式腳本在
# octenso/daoliyong-data.js(TRIANGLE/MODES),引用一律指名參照、不複寫內容。
# =====================================================

meta:
  version: "0.1"
  date: "2026-07-21"
  status: "研究假設·待考"
  scope: "透鏡層⑤⑥段專用;G7 型素材(interview/observation)不適用,不輸出⑤⑥"
  guardrails_ref: "octenso-states-schema-v0.1.yaml#guardrails——G1–G8 全部適用於本檔判讀,凍結、不複製、不覆寫"
  canonical_ref: "octenso/daoliyong-data.js——TRIANGLE(真善美/四德/三隅箴文本)、MODES(八模式腳本)"
  verdicts_ref: "presence 值域沿用 states-schema:有料/薄/缺席(缺席=無資料,≠弱)"

# -----------------------------------------------------
# 三層定義(縱向:理→用→道)
# 注意:layers.li = 三角形之「理」,與八態卦 key 'li'(離)分屬不同 namespace
# -----------------------------------------------------
layers:
  li:
    名: "理"
    爻位: "地之位"
    價值: "真(客觀)"
    四德: "亨(事物通達)"
    核心提問: "真嗎?——主張憑什麼站得住"
    定位: "根基:客觀知識、理論、原則與內在修養"
    識別信號:
      語言線索:
        - "引出處與數據來源"
        - "方法論被說出(這個結論怎麼得到的)"
        - "原則與價值觀宣告:『我們的依據是…』『這是我們的底線』"
        - "主張與反駁靠證據不靠音量"
      行為線索:
        會議: "主張附根據;分歧以證據對決"
        文件/BP: "市場/技術根據、驗證邏輯、團隊專業累積可查"
        制度: "立法理由與原則條文"
    正例引文形狀: "『我們定這個價,是根據三個月的成本數據與兩輪訪談』"
    缺席判定:
      定義: "通篇主張無根、原則真空、憑感覺定案"
      注意: "缺席=無資料,不得推論為『沒學問』(G5)"
    混淆對照:
      vs_kan_八態: "坎問『真正的問題在哪』(向未知取料);理層問『已有的答案憑什麼』(根基實不實)"
      vs_li_八態: "離管講得清不清(成像);理層管講的東西有沒有根(地基)"
    禁止推論:
      - "理有料 ≠ 結論正確(G1)"
      - "理缺席 ≠ 沒學問,僅=本次素材無資料(G5)"

  yong:
    名: "用"
    爻位: "人之位"
    價值: "善(人間美德)"
    四德: "利與貞(造福與堅持)"
    核心提問: "善嗎?——理有沒有化為造福與堅持的實踐"
    定位: "貫通:理被轉化為實踐——決議化為分工、知識落為動作、原則落為程序"
    識別信號:
      語言線索:
        - "決議化為分工:『所以具體我們就…』"
        - "知識轉為動作、原則落為程序"
        - "應變與轉化安排(理論碰到現實時的調整)"
        - "落地條件被盤點(誰做、何時、缺什麼)"
      行為線索:
        會議: "理據討論後有落地安排"
        文件/BP: "執行路徑與資源對接具體可查"
        制度: "條文有可執行程序與對應機制"
    正例引文形狀: "『這套方法下週先在 A 店試,兩週後看數據調整』"
    缺席判定:
      定義: "自產病:滿紙理論、無一落地;原則喊得響、程序付之闕如"
      注意: "缺席=無資料,不得推論為『光說不練』(G4/G5——主詞是運作)"
    混淆對照:
      vs_zhen_kun_八態: "八態看功能有無(有沒有人啟動/承接,橫向);用層看貫通與否(理有沒有被轉成行動,縱向)。同一句引文可同時餵兩邊,判的是不同問題"
      vs_xun_八態: "手腕與滲透是巽的功能;用層只問『理→行』的橋在不在"
    禁止推論:
      - "用有料 ≠ 執行力強(G1)"
      - "用缺席 ≠ 光說不練的人,僅=本次素材無資料(G4/G5)"

  dao:
    名: "道"
    爻位: "天之位"
    價值: "大美"
    四德: "元(萬物創始)"
    核心提問: "美嗎?——格局有沒有和諧與生生不息"
    定位: "餘地:回歸自然的開放無私;任何理與用最終須反於道"
    識別信號:
      語言線索:
        - "退路與留白:『留兩成餘裕』『不做絕』"
        - "長期與自然視角:『十年後還撐得住嗎』"
        - "無私與公共考量(超出己方利害的估量)"
        - "對極端化的自我節制"
      行為線索:
        會議: "有人把『贏太滿』擋下來;輸贏之外的關係被顧到"
        文件/BP: "風險留白、永續安排、不吃乾抹淨的設計"
        制度: "例外通道、日落條款、退出機制"
    正例引文形狀: "『合約讓兩個點給對方,關係比這一單大』"
    缺席判定:
      定義: "盲目功利、零餘地、唯效率、極端化"
      注意: "缺席=無資料,不得推論為『唯利是圖』(G4/G5)"
    混淆對照:
      vs_gen_八態: "艮是喊停定界(功能動作);道層是整體格局的和諧與餘地(境界取向)"
      vs_kun_八態: "坤是接住人與事(承接動作);道層的無私是格局判斷,不是承接行為"
    禁止推論:
      - "道有料 ≠ 這個案子高尚(G1)"
      - "道缺席 ≠ 唯利是圖的人,僅=本次素材無資料(G4/G5)"

# -----------------------------------------------------
# 三隅箴警示(結構層警訊;警語語彙引 TRIANGLE.*.jian,不另造)
# -----------------------------------------------------
sanyu_warnings:
  kongtan:
    名: "空談警示"
    觸發: "理缺席"
    說法: "道理懸空無根——高遠語彙滿場,主張查無依據"
  zichanbing:
    名: "自產病警示"
    觸發: "用缺席"
    說法: "理不落地——知識與原則未轉成任何實踐"
  weiyongwudao:
    名: "唯用無道警示"
    觸發: "道缺席,且理、用皆有料"
    說法: "韓非型結構:法則與操作推到極致而無餘地。原典明言此型走向僵化與危險;本鏡只指出結構,不預測此案結局(G1)"
    附註: "道缺席但理/用未皆強時,列一般『道層缺席』,不升級為本警示"

# -----------------------------------------------------
# 輸出規格(⑤⑥段;①–④段規格在 states-schema,不動)
# -----------------------------------------------------
output_spec:
  第五段_三角形體檢:
    - "理/用/道逐層列 presence(有料/薄/缺席),一層不可省略"
    - "每層判定附逐字引文(G5);引不出來=缺席(無資料)"
    - "後接三隅箴警示(有則列、無則不列)"
  第六段_道理用參考:
    - "依⑤體檢+③強態圖景,對照 MODES 各模式之最佳應用與特徵,引用至多 2 個相應腳本"
    - "每次引用必含:模式名+副題、選用理由(附素材引文)、腳本要點、死角+防範(必附——憲法條文三)"
    - "措辭固定『此局面可考慮』(憲法條文四);相應性不足時明寫『本次無合適對策參考』,寧缺勿濫"
    - "禁止:預測結局(G1)、模式排名或優劣比較(G6)、『你/他是某模式的人』(G4——主詞永遠是這份運作)"
  適用範圍: "interview/observation 型(G7 降級)不輸出⑤⑥,明文註記『依 G7 不適用』"

# -----------------------------------------------------
# 驗收計畫(本檔何時算立起來;與 states-schema 的 v0.2 之路分開計算)
# -----------------------------------------------------
acceptance:
  - "step1: 三層定義與三隅箴由 Simon 逐條核准(2026-07-21 spec 流程已核)"
  - "step2: 至少 2 份真實素材試判⑤⑥"
  - "step3: 收使用者三值回饋(很像/部分像/不太像+最有感與最不服的判定),分歧回填混淆對照"
  - "step4: 收斂後才考慮正式立項"
```

- [ ] **Step 4: 跑煙霧檢查與 YAML 語法驗證,確認全綠**

```bash
node tools/smoke-daoliyong-lens-schema.mjs
npx --yes js-yaml octenso/daoliyong-lens-schema-v0.1.yaml > /dev/null && echo "YAML OK"
```

Expected: `RESULT pass=N fail=0`(N ≥ 30)+ `YAML OK`。任一 FAIL 即修 schema,不改檢查。

- [ ] **Step 5: 寫 python 正典檢查器**

建立 `tools/check-daoliyong-lens-schema.py`,完整內容(格式比照 `check-states-schema.py`;本機無 python3,於 CI/有 python3 環境執行):

```python
#!/usr/bin/env python3
"""daoliyong-lens-schema 最小驗證:三層齊全、錨點正確、三隅箴在位、防複寫。
用法:python3 tools/check-daoliyong-lens-schema.py
輸出:逐項 PASS/FAIL + RESULT pass=X fail=Y(有 fail 則 exit 1)
本機無 python3 時,本地把關用 tools/smoke-daoliyong-lens-schema.mjs(node)。
"""
import sys, os, yaml

SCHEMA = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                      "octenso", "daoliyong-lens-schema-v0.1.yaml")

LAYERS = ["li", "yong", "dao"]
ANCHORS = {  # 名/爻位/價值/四德(萬物對應圖,一字不差)
    "li":   ("理", "地之位", "真(客觀)", "亨(事物通達)"),
    "yong": ("用", "人之位", "善(人間美德)", "利與貞(造福與堅持)"),
    "dao":  ("道", "天之位", "大美", "元(萬物創始)"),
}
REQUIRED_FIELDS = ["名", "爻位", "價值", "四德", "核心提問", "定位",
                   "識別信號", "正例引文形狀", "缺席判定", "混淆對照", "禁止推論"]
WARNINGS = {"kongtan": "空談警示", "zichanbing": "自產病警示", "weiyongwudao": "唯用無道警示"}
FORBIDDEN = ["主稱呼", "雅稱", "分支角色", "低載信號", "成熟表現",
             "剛健不息", "包容孕育", "柔和爆發", "滲透影響",
             "度險誠信", "團隊燃燒", "不動如山", "喜悅溝通"]

def main():
    ok, bad = 0, 0
    def check(name, cond, detail=""):
        nonlocal ok, bad
        if cond: ok += 1; print(f"PASS  {name}")
        else:    bad += 1; print(f"FAIL  {name}  {detail}")

    with open(SCHEMA, encoding="utf-8") as fh:
        raw = fh.read()
    doc = yaml.safe_load(raw)

    meta = doc.get("meta", {})
    check("meta.version == 0.1", str(meta.get("version")) == "0.1", f"got {meta.get('version')!r}")
    check("meta.status 掛研究假設", "研究假設" in str(meta.get("status", "")))
    check("guardrails_ref 指向 states-schema", "states-schema" in str(meta.get("guardrails_ref", "")))
    check("canonical_ref 指向 data.js", "daoliyong-data.js" in str(meta.get("canonical_ref", "")))

    layers = doc.get("layers", {})
    check("layers 三層齊全", sorted(layers.keys()) == sorted(LAYERS), f"got {sorted(layers.keys())}")
    for k in LAYERS:
        lay = layers.get(k, {})
        for f in REQUIRED_FIELDS:
            check(f"{k}.{f} 在位", f in lay)
        nm, yao, val, de = ANCHORS[k]
        check(f"{k} 錨點正確", lay.get("名") == nm and lay.get("爻位") == yao
              and lay.get("價值") == val and lay.get("四德") == de)
        sig = lay.get("識別信號", {})
        check(f"{k} 語言線索 >= 3", isinstance(sig.get("語言線索"), list) and len(sig["語言線索"]) >= 3)
        beh = sig.get("行為線索", {})
        check(f"{k} 行為線索三面", all(x in beh for x in ["會議", "文件/BP", "制度"]))
        check(f"{k} 混淆對照 >= 2", isinstance(lay.get("混淆對照"), dict) and len(lay["混淆對照"]) >= 2)
        check(f"{k} 禁止推論 >= 2", isinstance(lay.get("禁止推論"), list) and len(lay["禁止推論"]) >= 2)

    warns = doc.get("sanyu_warnings", {})
    check("三隅箴三條", sorted(warns.keys()) == sorted(WARNINGS.keys()), f"got {sorted(warns.keys())}")
    for wid, wname in WARNINGS.items():
        w = warns.get(wid, {})
        check(f"{wid} 名稱", w.get("名") == wname)
        check(f"{wid} 觸發與說法在位", bool(w.get("觸發")) and bool(w.get("說法")))
    check("唯用無道觸發=皆有料", "皆有料" in str(warns.get("weiyongwudao", {}).get("觸發", "")))
    check("唯用無道守 G1", "不預測" in str(warns.get("weiyongwudao", {}).get("說法", "")))

    spec = doc.get("output_spec", {})
    check("第五段規格在位", any("一層不可省略" in s for s in spec.get("第五段_三角形體檢", [])))
    six = " ".join(spec.get("第六段_道理用參考", []))
    check("第六段:至多 2", "至多 2" in six)
    check("第六段:必附死角", "死角" in six and "必附" in six)
    check("第六段:條文四措辭", "此局面可考慮" in six and "寧缺勿濫" in six)
    check("G7 適用範圍", "interview" in str(spec.get("適用範圍", "")))

    check("acceptance >= 3 步", isinstance(doc.get("acceptance"), list) and len(doc["acceptance"]) >= 3)

    for bad_s in FORBIDDEN:
        check(f"防複寫:無「{bad_s}」", bad_s not in raw)

    print(f"RESULT pass={ok} fail={bad}")
    sys.exit(1 if bad else 0)

if __name__ == "__main__":
    main()
```

- [ ] **Step 6: Commit**

```bash
git add octenso/daoliyong-lens-schema-v0.1.yaml tools/check-daoliyong-lens-schema.py tools/smoke-daoliyong-lens-schema.mjs
git commit -m "octenso: 道理用透鏡層 canonical schema(三角形體檢判準)+雙軌檢查器

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: SKILL.md 修訂(接上⑤⑥段)

**Files:**
- Modify: `.claude/skills/bagua-lens/SKILL.md`

**Interfaces:**
- Consumes: Task 1 的 `octenso/daoliyong-lens-schema-v0.1.yaml`(路徑與 raw URL 參照)。
- Produces: 升級後的 bagua-lens 流程(讀三份真相源、輸出⑤⑥)。

- [ ] **Step 1: 修訂流程步驟 1(讀三份真相源)**

以 Edit 將 SKILL.md 流程第 1 條整段替換為(原文其餘不動):

```markdown
1. **讀真相源(三份)**:
   - 八態判準:`octenso/octenso-states-schema-v0.1.yaml`
   - 三層判準:`octenso/daoliyong-lens-schema-v0.1.yaml`(⑤⑥段唯一依據)
   - 腳本與三角形文本:`octenso/daoliyong-data.js`(TRIANGLE/MODES,只引用不複寫)

   若本地找不到(skill 被安裝在 repo 之外),改抓 canonical 網址(單一真相源,更新所有安裝點自動跟上):
   - `https://raw.githubusercontent.com/flow222git/jte-platform-2026/main/octenso/octenso-states-schema-v0.1.yaml`
   - `https://raw.githubusercontent.com/flow222git/jte-platform-2026/main/octenso/daoliyong-lens-schema-v0.1.yaml`
   - `https://raw.githubusercontent.com/flow222git/jte-platform-2026/main/octenso/daoliyong-data.js`

   guardrails G1–G8 是硬規則,不可覆寫(對⑤⑥段同樣適用);verdicts 值域、context_declaration、output_spec 照辦。
```

- [ ] **Step 2: 修訂步驟 4(輸出加⑤⑥)**

在步驟 4 現有輸出序列「①缺席清單…→②失衡疑似…→③強態圖景→④四系統各一句小結」之後,同一條 bullet 內接續加上:

```markdown
→⑤三角形體檢(理/用/道逐層 presence+逐字引文,一層不可省略;後接三隅箴警示)→⑥道理用參考(至多 2 個相應模式腳本,必附死角+防範;措辭「此局面可考慮」;相應性不足明寫「本次無合適對策參考」)
```

並在該步驟的 G7 說明句(「interview/observation 依 G7 降級」)之後補上:

```markdown
;interview/observation 型不輸出⑤⑥(依 G7 不適用,報告中明文註記)
```

- [ ] **Step 3: 修訂迭代模式(backlog 擴為四類)**

在「記進待辦」的三類(判定分歧/語彙/schema 缺口)之後加第四類:

```markdown
   - **三層判定分歧**:⑤⑥段的判定或腳本引用被不服(候選:三層混淆對照/三隅箴門檻/引用規則)
```

- [ ] **Step 4: 修訂進化紅線**

在「進化觸發」條目的紅線句(「紅線:G1–G8 凍結;…」)內,「八態定義本體動之前必須逐條經 Simon 核准」之後補上:

```markdown
;三層定義與三隅箴同等待遇(daoliyong-lens-schema 修訂同走本流程,檢查器:python3 tools/check-daoliyong-lens-schema.py,本機無 python 用 node tools/smoke-daoliyong-lens-schema.mjs)
```

- [ ] **Step 5: 驗證修訂**

```bash
grep -c "daoliyong" .claude/skills/bagua-lens/SKILL.md
git diff --stat
```

Expected: `daoliyong` 命中 ≥ 5;diff 只有 SKILL.md 一檔。逐段重讀 SKILL.md 確認:三份真相源、⑤⑥、G7 排除、四類 backlog、紅線延伸皆在;G1–G8 原文未動。

- [ ] **Step 6: Commit**

```bash
git add .claude/skills/bagua-lens/SKILL.md
git commit -m "skill: bagua-lens 接道理用矩陣——讀三份真相源、輸出加⑤三角形體檢+⑥道理用參考

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: COMPENDIUM 索引 + 全鏈路一致性驗證

**Files:**
- Modify: `octenso/COMPENDIUM.md`(§1.5 補一行;§9 決策史加一列)

**Interfaces:**
- Consumes: Task 1 的 schema 路徑、Task 2 修訂後的 SKILL.md。
- Produces: 文件索引與收尾驗證證據。

- [ ] **Step 1: COMPENDIUM §1.5 補一行**

在 `### 1.5 道理用矩陣(引擎端·憲法增修,2026-07-21)` 小節的「真相來源」bullet 之前,加一行 bullet:

```markdown
- **透鏡端已接立體檢視(2026-07-21)**:八態鏡輸出加⑤三角形體檢+⑥道理用參考;三層判準=`daoliyong-lens-schema-v0.1.yaml`(v0.1 研究假設),見 specs/2026-07-21-daoliyong-lens-integration-design.md。
```

- [ ] **Step 2: COMPENDIUM §9 決策史加一列**

在 `| 07-21 | **道理用矩陣·憲法增修**…` 該列之後,加:

```markdown
| 07-21 | **八態鏡 v2·立體檢視**(透鏡接道理用:⑤三角形體檢+⑥腳本參考;新 canonical `daoliyong-lens-schema-v0.1.yaml`) |
```

- [ ] **Step 3: 全鏈路一致性驗證**

```bash
node tools/smoke-daoliyong-lens-schema.mjs
git diff main --stat
grep -l "daoliyong-lens-schema" .claude/skills/bagua-lens/SKILL.md octenso/COMPENDIUM.md docs/superpowers/specs/2026-07-21-daoliyong-lens-integration-design.md
git diff main -- octenso/octenso-states-schema-v0.1.yaml | wc -l
```

Expected:煙霧檢查 `fail=0`;diff 範圍僅 spec/plan/schema/兩支檢查器/SKILL.md/COMPENDIUM;三檔皆命中 `daoliyong-lens-schema`;states-schema diff 行數 = **0**(一字未動)。

- [ ] **Step 4: Commit**

```bash
git add octenso/COMPENDIUM.md
git commit -m "docs: COMPENDIUM 補八態鏡 v2 立體檢視條目

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## 驗收備註(實作後、merge 前後)

spec §2.3 的行為驗收(至少 2 份真實素材試判⑤⑥+三值回饋)需使用者提供素材,不在本計畫任務內;實作完成後由使用者擇日以「用八態鏡讀…」實測,回饋進 backlog。

## Self-Review(已執行)

1. **Spec coverage**:§2 三層+三隅箴+誠實驗收 → Task 1 Step 3(YAML 全文);§3 輸出規格 → YAML `output_spec` + Task 2 Step 2;§4 SKILL.md 四點 → Task 2 Steps 1–4;§5 檢查器 → Task 1 Steps 1/5(雙軌);§6 不做 → 全計畫無 states-schema/JS/HTML/UI 變更,Task 3 Step 3 以 `git diff main` 驗證;§7 實作對應 → Tasks 1–3 齊。真實素材驗收明列為計畫外(需使用者素材)。無缺口。
2. **Placeholder scan**:無 TBD/TODO;YAML、兩支檢查器、SKILL.md 修訂文字皆全文在案。
3. **Type consistency**:schema 頂層鍵 `meta/layers/sanyu_warnings/output_spec/acceptance` 與兩支檢查器逐鍵一致;三層 key `li/yong/dao`、警示 key `kongtan/zichanbing/weiyongwudao` 一致;錨點字串(真(客觀)/亨(事物通達)/善(人間美德)/利與貞(造福與堅持)/大美/元(萬物創始))在 YAML 與兩支檢查器逐字相同;FORBIDDEN 清單兩支檢查器一致;SKILL.md 引用的檔名與 raw URL 與 Task 1 產物一致。
