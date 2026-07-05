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

## 2. 現況散佈（Step 0 完整盤點，2026-07-05）

八卦 data **全在 `octenso/`**（根目錄 octenso-*.html 無）。各類散佈：

| 資料類別 | 主定義 | 也散在（重複／漂移風險） |
|---|---|---|
| BAGUA 主陣列（最全） | `bagua-map` | — |
| 古典 CLASSIC／GUA8 | `bagua-map` | — |
| 極性 POLAR／pair／CYCLE | `bagua-map` | `octenso-wheel-min`（本次已補修為錯卦） |
| 型名 title | `bagua-map` | persona／guide／team／records／i18n（＋persona/records/team 的 `.test.html`） |
| 功能名 fn | `bagua-map` | persona／field／career／team／records（＋wheel-min **措辭異**：創造/覺察/啟動/界線） |
| 五行色 wx | `bagua-map` | persona／field／career／team／records |
| 三態 over／under | `bagua-map` | persona／team |
| 型別描述 essence/blind/grow/tools | `bagua-persona` | —（唯一） |
| QUESTIONS 題庫 | `bagua-persona` | field／octenso-feedback（待確認是否同題庫） |
| i18n 翻譯 | `bagua-i18n` | —（唯一） |

**關鍵洞見**：
1. **`bagua-map` ＝事實上的主定義**（BAGUA+CLASSIC+GUA8+POLAR+CYCLE+型名+fn+wx+三態全在它）→ canonical 直接從它抽出最省。
2. 散最廣＝**型名（9 處）、fn（6+ 頁）、wx（6 頁）**→ 最會漂移（這次兌型名即是），優先讓各頁引用。
3. **功能名有兩套措辭**：主定義（開創/明現/行動/喊停/拓展）vs `wheel-min`（創造/覺察/啟動/界線/連結）→ canonical 須定一套。
4. **測試頁（`.test.html`）也含 data** → 遷移須決定：引用 canonical 或保留獨立 fixture。
5. QUESTIONS 散 persona/field/feedback → 須確認是否同一題庫。

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

0. ✅ **完整盤點**（見 §2）。
1. ✅ **建 `bagua-data.js`**（2026-07-05，已 push）：彙整欄位超集、值採稽核定案；掛 `window.OCTENSO_BAGUA`、未改任何頁引用；JavaScriptCore 驗證通過（8 卦／25 題／錯卦 pairKey／共鳴者／循環決斷／4 極性對）。
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

## 8. Step 2 試點勘查發現（bagua-records，2026-07-05，尚未遷移）

遷移比「抽 data」深——逐頁會觸發定義對齊，且部分 test 固化了舊定義、需一併更新：
1. **fn 措辭漂移**：records 的 `li` 寫「展現／覺察」（canonical＝明現／覺察）。
2. **pos 是功能極性佈局**：records 雷達 `pos` 的 gen/xun 仍舊佈局 → 遷移時 **pos 保留各頁本地**（雷達佈局不動），只抽 sym/nm/wx/fn/title。
3. **對極語意衝突（關鍵）**：records `strategyFor` 補「對極」用**功能極性**（兌⇄巽），且 `bagua-records.test.html:130` 斷言「補對極 巽 (dui⇄xun)」；canonical＝**錯卦**（兌⇄艮）。→ 遷移須把對極統一到錯卦（兌·交流 補 艮·喊停，比補巽·拓展更實用），並**同步更新該 test 斷言**。

**結論**：Step 2 ≠「抽 data、保 test 綠」，而是「對齊 canonical 定義（含對極統一為錯卦）＋更新受影響的 test 斷言」。且需先建**可靠的 no-node headless test runner**（async iframe＋gate＋讀結果）。逐頁、配測試、擇整段時間做。

---

**狀態（2026-07-05）**：Step 0 盤點 ✅｜Step 1 canonical `bagua-data.js` ✅（已 push、JSC 驗證通過）｜Step 2 逐頁遷移待擇日專門做（見 §8）。
相關：[[2026-07-05-octenso-consistency-audit-decisions]]、[[2026-06-30-bagua-64-energy-demand-table]]、[[2026-07-01-octaform-v0.6-intervention-design]]
