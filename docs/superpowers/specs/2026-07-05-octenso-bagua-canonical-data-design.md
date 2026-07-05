# Octenso 八卦定義 · 單一真相來源（canonical data）設計 v0.1

整理日期：2026-07-05 ｜ 類型：架構重構設計 spec（起頭草案，待 brainstorm 細化）
緣起：一致性稽核（[[2026-07-05-octenso-consistency-audit-decisions]]）發現八卦定義散在多頁，改一個「兌型名」要追 6 個檔還會漏——根因是**沒有單一真相來源**。本 spec 設計把八卦定義集中成一份 canonical，各頁引用，改一處全站同步。
定位：這是 Route B 守則②「八態與問易共用一套八卦定義，否則漂移」落到**文案／資料層**。

---

## 0. 問題（為什麼要做）

這次稽核暴露的漂移，全部同一根因——每頁各自維護八卦 data：
- **兌型名**「連結者」散在 persona/map/guide/records/team/i18n **6 頁**。
- **極性配對**兩套（功能極性 vs 錯卦）並存於同頁與跨頁。
- **題數** 24/25 在 4 頁不一。
- **循環標籤**在 map/guide 各寫各的。

只要定義不集中，每次改動都要人工追全站、且必漏。

## 1. 目標

一份 `bagua-data.js`（純 JS 常數，無框架、無 build），各頁 `<script src>` 引用共用常數，**刪除各頁本地重複定義**。改一處 → 全站同步。

## 2. 現況散佈（已知，待完整盤點＝Step 0）

| 檔 | 目前各自定義的八卦 data |
|---|---|
| `bagua-map.html` | `BAGUA[]`（fn/phase/pair/struct/state/over/under/remind/wx）、`CLASSIC`、`GUA8`、`PERSONA_TITLE`、`POLAR`、`CYCLE_ORDER` |
| `bagua-persona.html` | 型別 data（title/essence/str/blind/grow/tools/pos）＋`QUESTIONS`(25) |
| `bagua-records.html`、`bagua-team.html` | 型名 title + pos |
| `bagua-i18n.html` | 型名 中/英/日 翻譯 |
| 待盤點 | `bagua-field`、`bagua-career`、`octenso-journey`、`index` 等 |

## 3. Canonical 結構（初版）

`octenso/bagua-data.js`，掛全域 `OCTENSO_BAGUA`，含：

- **`BAGUA[8]`**，每卦一物件：
  `{ k, sym, nm, pin, wx(五行色), fn(功能名), pairKey(錯卦對), pairContrast(功能對比句), phase(循環任務語言), struct(陰陽結構), state/over/under(三態), title(人格型名), titleI18n{en,ja}, classic{nature,quality,family,body,animal,dir,season,spirit}, remind }`
- **衍生常數**：`POLAR`（極性輪盤座標，四直徑＝錯卦）、`CYCLE_ORDER`（後天流行序）、`POLARITY_PAIRS`（四組錯卦對＋功能對比）、`QUESTION_COUNT`(25)。
- （可選）**誠實邊界文案常數**（鏡子非算命…）也集中，避免各頁措辭漂移。

以本次稽核定案為權威值：錯卦骨架、兌·共鳴者、25 題、循環用功能任務語言。

## 4. 技術方案

- 純前端：各頁 head 加 `<script src="bagua-data.js"></script>`（相對路徑），其後改用 `OCTENSO_BAGUA.*`。
- 各頁移除本地 `BAGUA`/型名/`QUESTIONS` 定義，改引用。
- 無 build 工具、無模組系統——用全域常數即可（符合本專案 no-node 慣例）。

## 5. 漸進遷移（可測、不一次全改）

0. **完整盤點**：grep 全 octenso 的八卦 data 定義點（`var BAGUA`、`title:'`、`fn:'`、`QUESTIONS`、五行色…），列出所有散佈與欄位差異。
1. **建 `bagua-data.js`**：彙整為欄位超集，值以稽核定案為準。
2. **逐頁遷移**：一頁改引用＋刪本地定義，每頁改完跑其 `*.test.html`（綠燈基準 persona136 / records96 / team86 / field44 / career29）確認行為不變，再下一頁。
3. **i18n**：型名翻譯併入或另表引用。
4. 全部遷移後，單一來源生效；日後改定義只動 `bagua-data.js`。

## 6. 風險與注意

- **欄位不齊**：map 最全、records/team 精簡 → canonical 取超集，各頁用所需子集。
- **登入閘頁**（map/guide/persona）無法 headless 測視覺 → 靠 `*.test.html` 邏輯基準把關。
- **script 載入順序／相對路徑**：data.js 需在使用它的 script 前載入。
- 漸進遷移、逐頁測試，避免一次大改破壞多頁。

## 7. 開放問題（待 brainstorm）

- `bagua-data.js` 放 `octenso/` 還是 `octenso/data/`？
- 全域名 `OCTENSO_BAGUA` 可否？
- i18n 併入 data.js 還是獨立檔？
- 「工具推薦（tools）」「誠實邊界文案」要不要也一起集中？
- 是否連 Route B 的 64 卦需求表、OCTAFORM 轉換表也逐步納入同一資料層（更大願景）？

---

**狀態**：v0.1 起頭草案。下一步＝先跑 Step 0 完整盤點，再細化 canonical 欄位與遷移順序。
相關：[[2026-07-05-octenso-consistency-audit-decisions]]、[[2026-06-30-bagua-64-energy-demand-table]]、[[2026-07-01-octaform-v0.6-intervention-design]]
