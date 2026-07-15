# states-schema Define 層補完 實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `octenso/octenso-states-schema-v0.1.yaml` 從「坎/離示範+六態 stub」補成八態完整版(命名以素材倉為準),並用合成素材乾跑雙 agent 判讀除錯。

**Architecture:** 單一 YAML 檔為主戰場;內容三層來源(素材倉照抄/A-11 過翻譯規則/依學理憲法新創作標`原始`);python3 驗證腳本守結構與護欄;乾跑產出存 specs 附件。

**Tech Stack:** YAML + python3(PyYAML 6.0.3 已裝)。無 node。

## Global Constraints

- 分支:`octenso/states-schema-complete`(已建,spec 已 commit)。
- 命名 canonical(素材倉術語對照表,一字不差):乾=開創者(乾)/展行、坤=承接者(坤)/承載、震=行動者(震)/啟動、巽=拓展者(巽)/滲透、坎=沉澱者(坎)/探索、離=明現者(離)/照見、艮=喊停者(艮)/定界、兌=交流者(兌)/共鳴。
- 英文候選(未定案,不上線):Manifest/Nurture/Awaken/Influence/Explore/Illuminate/Stabilize/Resonate。
- G1–G8 護欄**一字不動**;`verdicts`/`output_spec`/`working_hypotheses`/`acceptance` 區塊結構不動。
- 主詞永遠是「運作/分支」,禁用「這種人/你是/他是」;缺席≠弱;臨床邊緣字眼標`待審閱`。
- 版號只到 `0.1`(拿掉 -draft),**不升 v0.2**。
- 全程繁體中文;YAML 註解風格沿用現檔。

---

### Task 1: 驗證腳本(先立守門員)

**Files:**
- Create: `tools/check-states-schema.py`

**Interfaces:**
- Produces: CLI `python3 tools/check-states-schema.py`,輸出逐項 PASS/FAIL 與總結行 `RESULT pass=X fail=Y`,失敗時 exit code 1。後續每個 task 都用它驗收。

- [ ] **Step 1: 寫驗證腳本**

```python
#!/usr/bin/env python3
"""states-schema 最小驗證:結構齊全、護欄未動、命名與素材倉一致。
用法:python3 tools/check-states-schema.py
輸出:逐項 PASS/FAIL + RESULT pass=X fail=Y(有 fail 則 exit 1)
"""
import sys, os, yaml

SCHEMA = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                      "octenso", "octenso-states-schema-v0.1.yaml")

STATES = ["qian", "kun", "zhen", "xun", "kan", "li", "gen", "dui"]

# 素材倉術語對照表(canonical,一字不差)
NAMES = {
    "qian": ("開創者(乾)", "展行"), "kun": ("承接者(坤)", "承載"),
    "zhen": ("行動者(震)", "啟動"), "xun": ("拓展者(巽)", "滲透"),
    "kan": ("沉澱者(坎)", "探索"),  "li":  ("明現者(離)", "照見"),
    "gen": ("喊停者(艮)", "定界"),  "dui": ("交流者(兌)", "共鳴"),
}

# G1–G8 凍結副本(rule 字串一字不差)
GUARDRAILS = {
    "G1": "只診斷能量分佈,不預測成敗",
    "G2": "缺席優先於失衡,失衡優先於滿格",
    "G3": "前瞻檢查表為主,回溯敘事僅供教學且需標明",
    "G4": "分析單位是『運作』,主詞永遠不是『這種人』",
    "G5": "無證據即無判定",
    "G6": "禁止輸出清單",
    "G7": "面試/人事場景降級為觀察筆記",
    "G8": "時間視角可用,因果推移禁止",
}

REQUIRED_FIELDS = ["卦", "主稱呼", "雅稱", "英文候選", "系統", "分支角色",
                   "一句話", "核心提問", "識別信號", "缺席判定", "低載信號",
                   "失衡信號", "成熟表現", "混淆對照", "禁止推論"]

def main():
    ok, bad = 0, 0
    def check(name, cond, detail=""):
        nonlocal ok, bad
        if cond: ok += 1; print(f"PASS  {name}")
        else:    bad += 1; print(f"FAIL  {name}  {detail}")

    with open(SCHEMA, encoding="utf-8") as fh:
        doc = yaml.safe_load(fh)

    check("meta.version == 0.1", str(doc.get("meta", {}).get("version")) == "0.1",
          f"got {doc.get('meta', {}).get('version')!r}")
    check("meta.filled 八態全列", sorted(doc.get("meta", {}).get("filled", [])) == sorted(STATES))
    check("meta.stub 已清空", doc.get("meta", {}).get("stub", ["x"]) == [])

    gr = {g.get("id"): g.get("rule") for g in doc.get("guardrails", [])}
    for gid, rule in GUARDRAILS.items():
        check(f"護欄 {gid} 未動", gr.get(gid) == rule, f"got {gr.get(gid)!r}")

    for s in STATES:
        st = doc.get(s)
        if not isinstance(st, dict) or st.get("status") == "TODO":
            check(f"{s} 已補完", False, "仍是 stub"); continue
        missing = [f for f in REQUIRED_FIELDS if f not in st]
        check(f"{s} 欄位齊全", not missing, f"缺 {missing}")
        check(f"{s} 主稱呼 canonical", st.get("主稱呼") == NAMES[s][0],
              f"got {st.get('主稱呼')!r} want {NAMES[s][0]!r}")
        check(f"{s} 雅稱 canonical", st.get("雅稱") == NAMES[s][1],
              f"got {st.get('雅稱')!r}")
        sig = st.get("識別信號", {})
        check(f"{s} 語言線索>=3", isinstance(sig.get("語言線索"), list) and len(sig["語言線索"]) >= 3)
        check(f"{s} 行為線索三單位", isinstance(sig.get("行為線索"), dict)
              and {"會議", "文件/BP", "制度"} <= set(sig["行為線索"]))
        check(f"{s} 正例引文形狀", bool(sig.get("正例引文形狀")))
        check(f"{s} 混淆對照>=3", isinstance(st.get("混淆對照"), dict) and len(st["混淆對照"]) >= 3)
        check(f"{s} 禁止推論>=2", isinstance(st.get("禁止推論"), list) and len(st["禁止推論"]) >= 2)

    print(f"RESULT pass={ok} fail={bad}")
    sys.exit(1 if bad else 0)

if __name__ == "__main__":
    main()
```

- [ ] **Step 2: 跑腳本,確認現況 FAIL(紅燈先亮)**

Run: `python3 tools/check-states-schema.py`
Expected: `meta.version` FAIL(現值 0.1-draft)、六態 stub FAIL、`kan/li 主稱呼` FAIL(現值探索者/照見者)、坎/離結構項 PASS。exit 1。

- [ ] **Step 3: Commit**

```bash
git add tools/check-states-schema.py
git commit -m "test: states-schema 驗證腳本(結構/護欄/命名守門)"
```

---

### Task 2: 命名修正(坎/離主稱呼回 canonical)

**Files:**
- Modify: `octenso/octenso-states-schema-v0.1.yaml:66`(kan.主稱呼)、`:114`(li.主稱呼)

- [ ] **Step 1: 兩處修改**

`kan.主稱呼: "探索者(坎)"` → `"沉澱者(坎)"`(行內註解不動)
`li.主稱呼: "照見者(離)"` → `"明現者(離)"`

- [ ] **Step 2: 驗證**

Run: `python3 tools/check-states-schema.py`
Expected: `kan 主稱呼 canonical` 與 `li 主稱呼 canonical` 轉 PASS;六態與 meta 項仍 FAIL。

- [ ] **Step 3: Commit**

```bash
git add octenso/octenso-states-schema-v0.1.yaml
git commit -m "fix: 坎/離主稱呼回素材倉 canonical(沉澱者/明現者)"
```

---

### Task 3: 量產 乾/坤(建構系統)

**Files:**
- Modify: `octenso/octenso-states-schema-v0.1.yaml:160-161`(qian/kun 兩行 stub 換成完整區塊)

**Interfaces:**
- Consumes: 坎/離範本欄位結構(檔內 62–155 行)。
- Produces: qian/kun 完整定義,欄位名與坎/離一字不差(驗證腳本 REQUIRED_FIELDS 依賴)。

- [ ] **Step 1: 刪除 `qian:`/`kun:` 兩行 stub,原位貼入**

```yaml
# =====================================================
# 態定義:乾
# =====================================================
qian:
  卦: "☰ 乾"
  主稱呼: "開創者(乾)"
  雅稱: "展行"
  英文候選: "Manifest"          # 未定案,不上線
  系統: "建構系統(乾⇄坤)"
  分支角色: "定方向開新局——使不存在的開始存在,交給坤接住長成"
  一句話: "讓原本不存在的可能開始存在"
  核心提問: "未來可以成為什麼?"

  識別信號:                      # 狀態:原始(依學理憲法卦德「健·始」推導)
    語言線索:
      - "開局宣告:『我們來開一個新的…/這件事該由我們先做』"
      - "定方向:『目標是 X,往這裡走』,並說得出為什麼是這條路"
      - "把未來講成可著手的事,不是空願景"
      - "拍板並具名承擔:『就這麼定,結果我負責』"
    行為線索:
      會議: "有人定調、開局,把發散的討論收成一個方向決定"
      文件/BP: "有清楚的方向選擇(為何走這條路而非那條);開創主張有具名的拍板者"
      制度: "存在明確的決策權設計、新提案的立項通道"
    正例引文形狀: "『這個市場還沒人做,我們定第一版規格,三個月後上』"

  缺席判定:
    定義: "素材中無人定向、無開局主張"
    文件/BP 特別規則: "只有跟隨式敘述(別人做了所以我們做)而無自己的定向 → 缺席"
    注意: "缺席=無資料,不得推論為『此運作缺乏領導』(G5)"

  低載信號: "會而不決;方向由慣性決定;沒有人說得出『我們要去哪』"

  失衡信號:                      # 狀態:待審閱(A-11 過翻譯規則)
    描述: "乾分支過度激活:方向由單點壟斷、異見無入口;選項未攤開就收斂(急於拍板)"
    素材形狀: "會議紀錄只有結論沒有選項;每次定向都來自同一個聲音"

  成熟表現:                      # 狀態:待審閱
    描述: "開始,也懂得交棒——開局之後把方向交給承接,而不是抓住所有起點"

  混淆對照:
    vs_坤: "同系統雙分支:乾定方向、坤接住長成。開局=乾,落地=坤"
    vs_震: "都表現為『發動』。定向開創(往哪去)=乾,破局啟動(先動起來)=震"
    vs_巽: "都推進改變。開一個新局=乾(從無到有),把改變鋪進系統=巽(從有到深)"
    vs_坎: "都面向未來。開一條新路=乾(定向),探一條沒人走過的路徑=坎(未知本身)"

  禁止推論:
    - "乾有料 ≠ 這個案子有前景(G1)"
    - "乾缺席 ≠ 沒有企圖心,僅=本次素材無資料(G5)"

# =====================================================
# 態定義:坤
# =====================================================
kun:
  卦: "☷ 坤"
  主稱呼: "承接者(坤)"
  雅稱: "承載"
  英文候選: "Nurture"           # 未定案,不上線
  系統: "建構系統(乾⇄坤)"
  分支角色: "接住開始——讓乾開出的局落地、被撐住、長成"
  一句話: "讓開始真正長成"
  核心提問: "如何讓它真正落地?"

  識別信號:                      # 狀態:原始(依卦德「順·載物」推導)
    語言線索:
      - "承接宣告:『這塊我接/我來扛』"
      - "把決定翻成執行安排(誰做、何時、怎麼落地)"
      - "照顧到人:『這樣一線同事跑得動嗎?』"
      - "盤點現實條件:『要落地還缺什麼?』"
    行為線索:
      會議: "決定之後有人接走、化成分工與時程;較弱的聲音被接住"
      文件/BP: "營運與執行段落具體(不只講願景);資源盤點誠實"
      制度: "有承接與托底機制(新人導引、出事有人接、支援通道)"
    正例引文形狀: "『這案子我接,先盤人力,下週給落地版』"

  缺席判定:
    定義: "素材中全是方向與亮點,無人談怎麼接住、誰來扛"
    文件/BP 特別規則: "無營運計畫、無執行路徑 → 缺席,列警示(G2)"
    注意: "缺席=無資料,不得推論為『執行力差』(G5)"

  低載信號: "決而不行;每個決定都懸空;沒有人問執行細節"

  失衡信號:                      # 狀態:待審閱(A-11 過翻譯規則;「自我犧牲」屬臨床邊緣語彙,對外不用)
    描述: "坤分支過度激活:無界線地承接、來者不拒,主體性讓位"
    素材形狀: "同一單位承接所有新增工作;『好,我來』的頻率遠高於『這我接不了』"

  成熟表現:                      # 狀態:待審閱
    描述: "承載而不失去自己——接住之前,先看得見自己的界線"

  混淆對照:
    vs_乾: "同系統雙分支:乾定方向、坤接住長成。開局=乾,落地=坤"
    vs_艮: "都表現為『守』。守住界線把事擋在外=艮(定界),守住裡面把人事撐起來=坤(承載)"
    vs_兌: "都接住人。接住工作與現實=坤(承載),接住感受與話語=兌(回應)"

  禁止推論:
    - "坤有料 ≠ 這個團隊執行力強(G1)"
    - "坤缺席 ≠ 不肯付出,僅=本次素材無資料(G5)"
```

- [ ] **Step 2: 驗證**

Run: `python3 tools/check-states-schema.py`
Expected: qian/kun 全部子項 PASS;zhen/xun/gen/dui 與 meta 項仍 FAIL。

- [ ] **Step 3: Commit**

```bash
git add octenso/octenso-states-schema-v0.1.yaml
git commit -m "feat: states-schema 量產 乾/坤(建構系統)"
```

---

### Task 4: 量產 震/巽(推動系統)

**Files:**
- Modify: `octenso/octenso-states-schema-v0.1.yaml`(zhen/xun 兩行 stub 換完整區塊)

- [ ] **Step 1: 刪除 `zhen:`/`xun:` stub,原位貼入**

```yaml
# =====================================================
# 態定義:震
# =====================================================
zhen:
  卦: "☳ 震"
  主稱呼: "行動者(震)"
  雅稱: "啟動"
  英文候選: "Awaken"            # 未定案,不上線
  系統: "推動系統(震⇄巽)"
  分支角色: "打破平衡、直接發動——給系統第一推力,巽接手讓改變深入"
  一句話: "打破平衡,使生命重新流動"
  核心提問: "第一步是什麼?"

  識別信號:                      # 狀態:原始(依卦德「動·起·奮」推導)
    語言線索:
      - "催動:『先做再說/今天就開始』"
      - "把討論切成第一步:『所以我們現在先做哪一件?』"
      - "對停滯不耐:『這題我們已經談三週了』"
      - "打破現狀的提議(把大家從慣性裡搖醒)"
    行為線索:
      會議: "有人推動當場行動(當場定死線、當場分工);僵局被主動打破"
      文件/BP: "有已經做了的事(不只計畫);里程碑是動作,不是概念"
      制度: "有快速試錯通道、小步快跑機制"
    正例引文形狀: "『別再開會了,我今天下午就把 demo 做出來』"

  缺席判定:
    定義: "素材中無任何已發生或即將發生的動作"
    會議特別規則: "散會時沒有任何人帶走一個行動 → 震缺席(即使討論熱烈)"
    注意: "缺席=無資料,不得推論為『不會執行』(G5)"

  低載信號: "一切停在計畫;死線一延再延;沒有人動手"

  失衡信號:                      # 狀態:待審閱(A-11 過翻譯規則;「躁進」屬臨床邊緣語彙,對外不用)
    描述: "震分支過度激活:未經定向或探究即行動,動作彼此打架;新啟動不斷、無一收尾"
    素材形狀: "多頭並進且互相矛盾;每週都有新的『開始』,沒有一個走到第二步"

  成熟表現:                      # 狀態:待審閱
    描述: "行動有節奏,而非衝動——知道何時該第一個動,也說得出這一步為何而動"

  混淆對照:
    vs_巽: "同系統雙分支(唯一張力對):震直接動手、巽先鋪路。猛推=震,柔滲=巽"
    vs_乾: "都表現為『發動』。定向開創(往哪去)=乾,破局啟動(先動起來)=震"
    vs_艮: "對待軸一動一停,失衡時互為誤判:躁動被當執行力=震過載;僵止被當穩健=艮過載。判別:打破現狀=震,保住現狀=艮"

  禁止推論:
    - "震有料 ≠ 進度健康(G1)"
    - "震缺席 ≠ 懶散,僅=本次素材無資料(G5)"

# =====================================================
# 態定義:巽
# =====================================================
xun:
  卦: "☴ 巽"
  主稱呼: "拓展者(巽)"
  雅稱: "滲透"
  英文候選: "Influence"         # 未定案,不上線
  系統: "推動系統(震⇄巽)"
  分支角色: "鋪路滲透——讓震發動的改變進入系統、自然擴散"
  一句話: "真正的改變,不靠力量,而靠持續滲透"
  核心提問: "如何讓改變自然發生?"

  識別信號:                      # 狀態:原始(依卦德「入·順·風」推導)
    語言線索:
      - "鋪路:『我先跟 X 通個氣/先去鋪一下』"
      - "順著對方的語言講自己的事"
      - "把大改變拆成無感的小步"
      - "談風向與時機:『現在提正好/再等兩週』"
    行為線索:
      會議: "阻力在會前已被溝通消化;異見被繞道化解,而非正面衝撞"
      文件/BP: "有進入通路與人心的擴散路徑;合作網絡真實存在(可指名)"
      制度: "變革有醞釀期設計、內部溝通機制"
    正例引文形狀: "『我上週先分別跟三個部門聊過,今天這案子應該不會卡』"

  缺席判定:
    定義: "改變全靠命令與力量硬推,無任何鋪陳"
    文件/BP 特別規則: "推廣策略只有投放與轟炸、無通路與關係經營 → 缺席"
    注意: "缺席=無資料,不得推論為『不善溝通』(G5)"

  低載信號: "提案硬碰硬;沒有人經營風向;擴散只靠音量"

  失衡信號:                      # 狀態:待審閱(A-11 過翻譯規則)
    描述: "巽分支過度激活:為了進得去而失去立場;什麼都沾、隨對象搖擺(其究為躁)"
    素材形狀: "立場隨在場者改變;鋪陳無限延長,始終不進正題"

  成熟表現:                      # 狀態:待審閱
    描述: "柔軟而有中心——順著地形走,但知道自己要流去哪"

  混淆對照:
    vs_震: "同系統雙分支(唯一張力對):震直接動手、巽先鋪路。猛推=震,柔滲=巽"
    vs_兌: "都柔性靠近人。為了讓改變進入而靠近=巽(滲透有方向),為了彼此共鳴而靠近=兌(關係即目的)"
    vs_離: "都能改變他人想法。以澄清改變=離(你看清了),以滲透改變=巽(你被帶動了)"
    vs_乾: "都推進改變。開一個新局=乾(從無到有),把改變鋪進系統=巽(從有到深)"

  禁止推論:
    - "巽有料 ≠ 影響力=正當(G1;滲透可服務任何目的)"
    - "巽缺席 ≠ 沒有人脈,僅=本次素材無資料(G5)"
```

- [ ] **Step 2: 驗證**

Run: `python3 tools/check-states-schema.py`
Expected: zhen/xun 全 PASS;gen/dui 與 meta 項仍 FAIL。

- [ ] **Step 3: Commit**

```bash
git add octenso/octenso-states-schema-v0.1.yaml
git commit -m "feat: states-schema 量產 震/巽(推動系統)"
```

---

### Task 5: 量產 艮/兌(調節系統)

**Files:**
- Modify: `octenso/octenso-states-schema-v0.1.yaml`(gen/dui 兩行 stub 換完整區塊)

- [ ] **Step 1: 刪除 `gen:`/`dui:` stub,原位貼入**

```yaml
# =====================================================
# 態定義:艮
# =====================================================
gen:
  卦: "☶ 艮"
  主稱呼: "喊停者(艮)"
  雅稱: "定界"
  英文候選: "Stabilize"         # 未定案,不上線
  系統: "調節系統(艮⇄兌)"
  分支角色: "定界喊停——收住流動、形成邊界,使兌的往來有節"
  一句話: "停止,不是結束,而是形成新的邊界"
  核心提問: "什麼值得保留?"

  識別信號:                      # 狀態:原始(依卦德「止·成終成始」推導)
    語言線索:
      - "收束:『這個先到這裡/今天先收』"
      - "明確拒絕:『這個我們不做』"
      - "劃範圍:『這期只做 A,B 排除』"
      - "守住既有承諾,不被新事沖掉"
    行為線索:
      會議: "有人喊停發散、收斂議程;超載時有人把『不』說出口"
      文件/BP: "有明確的不做清單與範圍邊界;風險控管是真的擋過事,不是模板"
      制度: "有止損機制、結案程序、品質門檻(gate)"
    正例引文形狀: "『這功能很誘人,但這一版不做——寫進 backlog,關掉』"

  缺席判定:
    定義: "素材中無任何拒絕、邊界或正式的結束"
    制度特別規則: "只有開始的機制、沒有結束的機制(無結案/無止損)→ 缺席,列警示(G2)"
    注意: "缺席=無資料,不得推論為『沒有原則』(G5)"

  低載信號: "什麼都答應;範圍只增不減;沒有東西被正式結束"

  失衡信號:                      # 狀態:待審閱(A-11 過翻譯規則)
    描述: "艮分支過度激活:界線變成城牆——新資訊進不來,止住的東西再也不動(僵止)"
    素材形狀: "『以前就是這樣』高頻出現;所有新提案倒在同一道關卡前"

  成熟表現:                      # 狀態:待審閱
    描述: "知道何時停止——止是成終成始,停下的地方就是下一輪開始的地方"

  混淆對照:
    vs_兌: "同系統雙分支:艮收住關門、兌打開往來。設界=艮,連結=兌"
    vs_坤: "都表現為『守』。守住界線把事擋在外=艮(定界),守住裡面把人事撐起來=坤(承載)"
    vs_坎: "都可能表現為『停下來』。入未知而停=坎(還在動,往內動),設界而停=艮(定住,守住)"
    vs_震: "對待軸一動一停,失衡時互為誤判。判別:打破現狀=震,保住現狀=艮"

  禁止推論:
    - "艮有料 ≠ 治理良好(G1)"
    - "艮缺席 ≠ 沒有紀律,僅=本次素材無資料(G5)"

# =====================================================
# 態定義:兌
# =====================================================
dui:
  卦: "☱ 兌"
  主稱呼: "交流者(兌)"
  雅稱: "共鳴"
  英文候選: "Resonate"          # 未定案,不上線
  系統: "調節系統(艮⇄兌)"
  分支角色: "以悅往來——讓艮定出的邊界之間氣機流通"
  一句話: "交流讓生命產生新的可能"
  核心提問: "如何一起變得更好?"

  識別信號:                      # 狀態:原始(依卦德「說·悅·口」推導)
    語言線索:
      - "邀請:『大家覺得呢?/想聽聽你的想法』"
      - "接話讓交換繼續(對話有來有往,不是輪流獨白)"
      - "說出感受,並邀請對方的感受"
      - "把緊繃的氣氛講開"
    行為線索:
      會議: "發言分佈廣、彼此接話;分歧被講開,而非壓下"
      文件/BP: "有使用者/客戶的真實聲音(訪談引文);社群與關係資產可指名"
      制度: "回饋管道存在且真的有人回;有交流的儀式(覆盤、慶功)"
    正例引文形狀: "『我先說我的擔心,也想聽聽大家各自卡在哪』"

  缺席判定:
    定義: "素材通篇單向宣告,無任何交換"
    會議特別規則: "只有一人說話、其餘沉默 → 兌缺席(即使結論清楚)"
    注意: "缺席=無資料,不得推論為『團隊不和』(G5)"

  低載信號: "訊息單向;沒有人問別人怎麼想;平靜靠壓抑維持"

  失衡信號:                      # 狀態:待審閱(A-11 過翻譯規則)
    描述: "兌分支過度激活:說話為了被喜歡——分歧被和諧話術蓋掉,回饋失真"
    素材形狀: "會上一團和氣、會後決定被推翻;負面訊息從不出現在正式場合"

  成熟表現:                      # 狀態:待審閱
    描述: "真誠分享,而非討好——說真話,仍以悅接人"

  混淆對照:
    vs_艮: "同系統雙分支:艮收住關門、兌打開往來。設界=艮,連結=兌"
    vs_離: "都涉及表達。為了被理解而說=離,為了共鳴連結而說=兌。檢驗:拿掉聽眾情緒,內容還成立嗎?成立=離"
    vs_巽: "都柔性靠近人。為了讓改變進入而靠近=巽(滲透有方向),為了彼此共鳴而靠近=兌(關係即目的)"
    vs_坤: "都接住人。接住工作與現實=坤(承載),接住感受與話語=兌(回應)"

  禁止推論:
    - "兌有料 ≠ 心理安全良好(G1;和氣可能是失衡的表象)"
    - "兌缺席 ≠ 關係不好,僅=本次素材無資料(G5)"
```

- [ ] **Step 2: 驗證**

Run: `python3 tools/check-states-schema.py`
Expected: 八態全部子項 PASS;僅剩 meta 三項 FAIL。

- [ ] **Step 3: Commit**

```bash
git add octenso/octenso-states-schema-v0.1.yaml
git commit -m "feat: states-schema 量產 艮/兌(調節系統)"
```

---

### Task 6: meta / 版號更新(schema 轉正)

**Files:**
- Modify: `octenso/octenso-states-schema-v0.1.yaml:13-18`(meta 區塊)與檔頭註解第 3 行

- [ ] **Step 1: 更新 meta**

```yaml
meta:
  version: "0.1"
  date: "2026-07-15"
  scope: "透鏡層(會議紀錄/BP/制度/個人觀察筆記)優先;伴讀引用需另過語氣憲章"
  filled: ["qian", "kun", "zhen", "xun", "kan", "li", "gen", "dui"]
  stub: []
```

檔頭第 3 行 `# octenso-states-schema v0.1-draft` → `# octenso-states-schema v0.1`。
第 158 行附近的 stub 區段標題註解(`# 待填 stub(欄位同上,回 Claude Code 依素材倉量產)`)整段刪除(stub 已不存在)。

- [ ] **Step 2: 驗證全綠**

Run: `python3 tools/check-states-schema.py`
Expected: 全部 PASS,`RESULT pass=N fail=0`,exit 0。

- [ ] **Step 3: Commit**

```bash
git add octenso/octenso-states-schema-v0.1.yaml
git commit -m "feat: states-schema v0.1 轉正(八態完整,拿掉 draft)"
```

---

### Task 7: 乾跑素材+答案卡(合成)

**Files:**
- Create: `docs/superpowers/specs/2026-07-15-octenso-schema-dryrun/material.md`
- Create: `docs/superpowers/specs/2026-07-15-octenso-schema-dryrun/answer-key.md`

**Interfaces:**
- Produces: `material.md`(判讀 agent 唯一可讀的素材)、`answer-key.md`(標準答案,**只有主線程可讀,agent 不可讀**)。

- [ ] **Step 1: 寫 material.md**

內容=虛構新創「云杉智作」的 BP 節錄+產品週會紀錄,約 60 行。**埋點配置**(寫作時逐條對照下表埋進去,每個「有料」至少兩處可引用原文、「薄」恰好一處、「缺席」零處):

| 態 | 目標 | 埋法 |
|---|---|---|
| 乾 | 有料 | 創辦人定向句(只做法遵文審這條路+首年 20 家目標,具名拍板)×2 處 |
| 離 | 有料+失衡疑似 | 簡報極清楚、比喻漂亮、結論可複述;但 Q&A 對答流利卻**零證據**(失衡素材形狀) |
| 兌 | 有料 | 會議互相接話、邀請意見、把緊繃講開 ×2 處 |
| 震 | 薄 | 僅一句「下週先跑 5 家事務所試用」 |
| 坤 | 薄 | 僅一句「營運由 Amy 接」,無盤點細節 |
| 坎 | 缺席 | 全篇無未知承認、無驗證資料、無失敗紀錄;風險段是模板句 |
| 艮 | 缺席 | 無不做清單;會議中不斷加功能,無人擋 |
| 巽 | 缺席 | 推廣=「大量投放廣告」,無鋪路、無通路經營 |

- [ ] **Step 2: 寫 answer-key.md**

逐態列:目標判定(有料/薄/缺席)、埋的原文句(逐字)、失衡疑似=離(過載形狀+坎缺席=G2 首位警示組合)。

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/specs/2026-07-15-octenso-schema-dryrun/
git commit -m "test: 乾跑合成素材+答案卡(埋 3有料/2薄/3缺席+離過載)"
```

---

### Task 8: 雙 agent 盲判

**Files:**
- Create: `docs/superpowers/specs/2026-07-15-octenso-schema-dryrun/agent-A.md`
- Create: `docs/superpowers/specs/2026-07-15-octenso-schema-dryrun/agent-B.md`

- [ ] **Step 1: 同時派兩個獨立 general-purpose subagent**,prompt 完全相同(一字不差),各自回傳判讀全文,主線程分別存成 agent-A.md / agent-B.md:

> 你是八態透鏡判讀員。只讀兩個檔案:`octenso/octenso-states-schema-v0.1.yaml`(判讀依據)與 `docs/superpowers/specs/2026-07-15-octenso-schema-dryrun/material.md`(素材)。**禁止讀取該資料夾內其他任何檔案,禁止搜尋 repo 其他內容。**
> 嚴格依 schema 的 guardrails(G1–G8)與 output_spec 輸出判讀報告:①缺席清單(含補問建議)→②失衡疑似→③強態圖景→④四系統各一句小結。每一條判定必須附素材逐字引文(G5);引不出來判「缺席(無資料)」。主詞永遠是運作,不是人。不輸出總分、排名、建議、預測。直接回傳報告全文,勿加開場白。

- [ ] **Step 2: 確認兩份輸出皆含八態 presence 判定+引文**,存檔 commit:

```bash
git add docs/superpowers/specs/2026-07-15-octenso-schema-dryrun/agent-A.md docs/superpowers/specs/2026-07-15-octenso-schema-dryrun/agent-B.md
git commit -m "test: 乾跑雙 agent 盲判輸出"
```

---

### Task 9: 分歧分析+混淆對照回填

**Files:**
- Create: `docs/superpowers/specs/2026-07-15-octenso-schema-dryrun/analysis.md`
- Modify: `octenso/octenso-states-schema-v0.1.yaml`(僅混淆對照欄,視分歧而定)

- [ ] **Step 1: 寫 analysis.md**,固定格式:

```markdown
# 乾跑分歧分析
## presence 對照表
| 態 | 答案卡 | agent A | agent B | A=B? | A=key? | B=key? |
(八列)
## 一致率
- A⇄B presence 一致:N/8;A⇄key:N/8;B⇄key:N/8
- 失衡疑似(離)命中:A ○/✕、B ○/✕
## 分歧清單
每筆:態、兩邊判定、兩邊引文、研判根因(引文抓錯層?混淆對照缺一條?素材埋太淡?)
## 處置
每筆分歧 → 三選一:回填混淆對照(附新增文字)/素材問題(記錄不改 schema)/agent 未守規(記錄)
```

- [ ] **Step 2: 依處置回填混淆對照**(只動`混淆對照`欄;若乾跑無分歧則不改,在 analysis.md 記「無回填」)。

- [ ] **Step 3: 驗證+Commit**

Run: `python3 tools/check-states-schema.py` → Expected: 全綠。

```bash
git add docs/superpowers/specs/2026-07-15-octenso-schema-dryrun/analysis.md octenso/octenso-states-schema-v0.1.yaml
git commit -m "feat: 乾跑分歧分析+混淆對照回填"
```

---

### Task 10: COMPENDIUM 同步+收尾

**Files:**
- Modify: `octenso/COMPENDIUM.md`(§1.3 之後新增 §1.4;§9 決策史表尾加一列)

- [ ] **Step 1: §1.3 表格區塊結束、`---`(§2 之前)前插入**

```markdown
### 1.4 機器可讀定義(states-schema,Define 層)

`octenso/octenso-states-schema-v0.1.yaml`(v0.1,2026-07-15 八態補完)——所有 AI 應用(伴讀/透鏡)的唯一判讀依據:G1–G8 護欄、逐態識別信號/缺席判定/混淆對照。真相來源在原檔;命名以素材倉術語對照表為準(沉澱者/明現者定案)。升 v0.2 門檻=真實素材雙 agent 收斂達標(乾跑僅除錯,見 specs/2026-07-15-octenso-schema-dryrun/)。
```

- [ ] **Step 2: §9 決策史表尾(07-07 列之後)加**

```markdown
| 07-15 | **states-schema v0.1 八態補完**(Define 層;命名回 canonical 沉澱者/明現者;合成素材乾跑除錯;v0.2 留給真實素材收斂) |
```

- [ ] **Step 3: 最終驗證+push**

Run: `python3 tools/check-states-schema.py` → 全綠。
Run: `git push -u origin octenso/states-schema-complete`
PR 開立連結:`https://github.com/flow222git/jte-platform-2026/pull/new/octenso/states-schema-complete`(由 Simon 點開建立;標題:`octenso: states-schema v0.1 八態補完(Define 層)+乾跑除錯`)。

```bash
git add octenso/COMPENDIUM.md
git commit -m "docs: COMPENDIUM 同步 states-schema v0.1(§1.4+決策史)"
git push -u origin octenso/states-schema-complete
```

---

## Self-Review 紀錄

- Spec 覆蓋:①命名=Task 2;②六態=Task 3–5;③乾跑=Task 7–9;④版號 meta=Task 6;⑤驗證=Task 1(貫穿);COMPENDIUM=Task 10。無缺。
- 佔位掃描:六態 YAML 全文在計畫內;僅 Task 9 回填內容依乾跑結果而定(程序+格式+決策規則已定,非佔位)。
- 一致性:欄位名與坎/離範本一字不差;checker 的 REQUIRED_FIELDS/NAMES/GUARDRAILS 與 YAML 內容對齊;英文候選與素材倉表一致。
