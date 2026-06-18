# Octenso 解讀引擎 · 整體側寫（holistic portrait）設計 spec

整理日期：2026-06-18 ｜ 對象：`octenso/bagua-persona.html` 的解讀引擎
目標：把現在散落的整體描述，整併成**一段完整、有溫度、把人當一個完整的人來講的「整體側寫」**，並把**能格**織入。

---

## 0. 現況問題

看完分數＋四向度後，「整體人格描述」現在**拆在三塊、且偏模板**：
- **型卡 essence**（`signatureTitle`）：一句型的精華。
- **整合 · 立體的你**（`integratedBlock`）：兩行＝輪廓（`shapeRead` 形狀×均衡）＋系統之間（`systemsRead` L2）。
- **人物速寫**（`buildPortrait`）：**固定句型填空**——「最鮮明的是〔最強2股〕…最少用〔最弱2股〕」＋固定收尾。

→ 讀起來不是「一個完整的人」，而是散的、公式化的。

---

## 1. 目標：一段「整體側寫」

**一段流動敘事、約 3 個 beat**，把多個訊號織成有溫度的人物側寫，並以**比喻收尾**。

1. **主調開場**：你核心是誰——型／主調（`signature`＋`leads`）＋整體水平（`level.band`）＋形狀（單峰/雙峰/多峰/均衡）。多峰者點出「不只一股、能換檔」。
2. **立體張力**：能量怎麼互相拉扯——系統之間（`systemsRead`／雙高張力 `FOURXIANG_TENSION`）＋**能格·過用**（若有：點名「X 用得有點過頭——〔怎麼收〕」）。
3. **強弱與成長＋比喻收尾**：靠哪幾股、哪幾股還沒長開（溫暖非評價）＋**能格·不足**（若有：「X 還沒長開、而且正在讓你累——〔怎麼補〕」）＋一句**比喻**把整個人收束（保留）。

### 範例（目標感，引擎用規則合成這種文字）
> 你是個能量飽滿、不被單一傾向定義的人。最鮮明的是「行動」——有念頭就想往前，敢開始、帶得動人；但你不只這股，開創、展現、交流也都在線上，讓你能換檔、面對不同場面都接得住。
>
> 這份飽滿也帶著張力：你既想衝得快、又想被看見、還想把事情鋪開——能量很滿。而從你的校準看，「行動」目前用得有點過頭——容易做白工、把人推著走；「喊停」還沒長開、而且正在讓你累——你不太替自己踩剎車。
>
> 整體來說，你像一台馬力強、檔位多的車——本錢在彈性與爆發；把「煞車」也練起來，你會又快又穩。

---

## 2. 織入的訊號（來源）

| 訊號 | 來源 | 用在 |
|---|---|---|
| 型／主調 kind+leads | `pf.signature`, `pf.leads`, `E[k].fn/state/essence` | beat 1 |
| 整體水平 | `pf.level.band`（high/mid/low）, `pf.level.mean` | beat 1 語氣 |
| 形狀 | `shapeRead(pf)`（單峰/雙峰/多峰/均衡） | beat 1＋比喻 |
| 系統之間 | `systemsRead(pf)`／`FOURXIANG_TENSION` 雙高 | beat 2 |
| 最強/最弱 | `pf.resources` / `pf.gaps`（fn 名） | beat 3 |
| **能格** 過用/適中/不足 | `calibResults()` ＋ `costVerdict(k,dir,avg)`（`COST` 的 `aOver/aUnder`） | beat 2（過用）＋ beat 3（不足） |

---

## 3. 能格織入 ＋ 退回機制

- **有能格資料**（`bagua_cost_v1` 存在）：beat 2 點名「過用」、beat 3 點名「不足」，用 `costVerdict` 的判定＋建議精華；「適中」可一句肯定（強而剛好）。
- **沒有能格資料**（全適中跳過校準、或分享報告 `#r=` 未帶能格）：beat 2/3 **自動退回分數版**——用 `pf.resources`/`pf.gaps` 的「最強/最弱、還沒長開」描述，不報錯、讀起來仍完整。
- 判斷：`calibResults()` 回 null 或 items 空 → 走退回版。

---

## 4. 合成策略（規則、非 LLM）

- 每個「訊號狀態」配**多套措辭片段**＋連接詞，依 profile 選用並串接，讓不同人讀起來不同（非單一模板填空）。
- 變化維度：型 kind（single/dual/multi/pattern）× level（high/mid/low）× shape × 有無能格。
- **比喻庫**（beat 3 收尾，依 shape×level 選，各 1–2 變體）：
  - 多峰·高 → 「馬力強、檔位多的車」
  - 多峰·中 → 「各聲部都在的樂團」
  - 單峰·高 → 「磨得很利的一把刀」／「聚焦的一道光」
  - 雙峰 → 「交替的兩股潮汐」
  - 均衡·中 → 「調得很勻的光」／「有深度又平靜的一池水」
  - 低／蓄能 → 「正在蓄水的水庫」／「還在醞釀的種子」
- 語氣：暖、第二人稱、非評價、貼「鏡子非算命」北極星；長度約 3 段、每段 2–3 句。

---

## 5. 放置與吸收

- **新「整體側寫」**放在型卡（與雷達）之後、細節區塊之前，顯眼。
- **吸收（移除）**：舊「人物速寫」（`buildPortrait` 那段）＋「整合 · 立體的你」（`integratedBlock`）——兩者都是合成描述，由新側寫取代。
- **保留為深讀細節**（順序在側寫之後）：八態輪廓剖面、四個系統、能格·調校、你最鮮明的能量（優勢/盲點/成長）、能量提醒、下一步。
- **型卡**：保留 sym＋title＋sub＋短 essence（作為「標題級」精華）；整體側寫是其下的完整敘事。
- **分享報告 `#r=`**（`renderSharedReport`）：也改用新側寫（走能格退回版，因 URL 不帶能格資料）。

### 新結果頁順序
型卡 → 雷達 → **整體側寫** → 八態輪廓剖面 → 四個系統 → 能格·調校 → 你最鮮明的能量 → 能量提醒 → 下一步 → 分享 → 用出去 → 結語。

---

## 6. 實作

- 新函式（如 `portraitNarrative(pf, opts)`）：回三段 HTML；`opts` 帶能格 items（無則退回）。
- `showResult`：以 `portraitNarrative` 取代 `buildPortrait` 呼叫與 `integratedBlock` 呼叫；調整區塊順序。
- `renderSharedReport`：同樣改用，傳無能格 → 退回版。
- 保留 `shapeRead`/`systemsRead`/`signatureTitle`/`costVerdict` 等既有純函式（側寫內部複用）。
- 舊 `buildPortrait`/`integratedBlock` 可移除或留作內部片段來源（plan 階段定）。

---

## 7. 測試（無 node，延伸 persona 測試）

- `portraitNarrative` 對多種 profile 皆回非空三段：single/dual/multi/pattern × high/mid/low。
- 有能格 → 含「過用」/「不足」字樣與對應建議精華；無能格 → 走退回版（含「最少動用/還沒長開」、不含能格字樣、不報錯）。
- 比喻收尾存在（依 shape×level）。
- 結果頁不再出現舊「人物速寫」「整合 · 立體的你」標題；側寫區塊 render 在型卡之後。
- 分享報告 `#r=` 用退回版側寫且 render 正常。
- persona 既有測試全綠（含先前 199）。

---

## 8. 待 plan 階段定（皆有預設）

- 型卡 essence 是否再縮短（預設：保留短句當標題級）。
- 舊 `buildPortrait`/`integratedBlock` 移除 vs 留作片段（預設：留其文字當側寫片段來源，UI 不再單獨呈現）。
- 比喻庫的最終用字（草稿如 §4，待潤）。
- commit 結尾：`Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`。
