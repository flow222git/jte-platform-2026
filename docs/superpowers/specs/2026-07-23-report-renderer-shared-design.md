# 結果頁共用 Renderer 設計 — v3.2 核心四塊抽共用+v2 系命名統一

日期:2026-07-23 ｜ 狀態:設計定案,待實作 ｜ 前置:結果頁 v3.2 已上 `bagua-persona.html`(spec 2026-07-23-report-v32-demo-design.md)
發起:Simon——「hybrid 版本也是用這樣的結果頁嗎?」→ 同意抽共用 renderer 套到 v2 系

---

## 1. 背景與目標

v3.2 只改了基準版 `bagua-persona.html`;hybrid(伴讀版)的「完整報告」連到 `bagua-persona-v2.html`,那是一套獨立實作,且 v2 系(persona-v2/hybrid/crystal)用 `fnShort+者` 組者名(明現者/交流者/拓展者…),與 canonical 者名(洞見者/共鳴者/協作者…)形成命名體系分岔——demo 漂移名的真正源頭。

目標:**一份組裝、兩頁共用、命名單一來源**。

三方案(2026-07-23 Simon 選 A):
- **A 真共用(定案)**:抽 `bagua-report-renderer.js`,persona.html 與 persona-v2 都吃它+各自薄轉接層。
- B 單向引用(落選:組裝碼兩份必漂移)。
- C v2 退役直連(落選:兩套題本計分不可混)。

## 2. 檔案與邊界

新檔 `octenso/bagua-report-renderer.js`(canonical 引擎檔),負責 v3.2 報告**核心四塊**:

1. 峰名卡(signatureTitle 邏輯,單峰/雙峰=者名(卦),多峰/格局照 v3.2)
2. 雷達卡+互動(buildRadar 幾何、radarSelect 解釋卡、bindRadar,rint 互動旗標)
3. 「整體的你」敘事(pShapeKey 地形→OPEN 開場、三拍 b1/b2/b3、SCENE 場景、conf 可信度句)
4. 四系統詳解(SYS_DETAIL 五形判定、音量條、小練習;僅雷風雙高=張力)

隨函式搬入 renderer 的頁內詞庫:READ_LEX、PAIR_BOTHHIGH(三拍所需)。文案大宗仍在 `bagua-report-v32-data.js`,renderer 只組裝。

四塊之後屬各頁:persona.html 保留深讀折疊(八態輪廓/剛剛好嗎/四向度與提醒)、你最鮮明的能量、工具/場景/分享;persona-v2 換裝後=核心四塊+分享碼+按鈕。

## 3. 輸入契約(轉接層)

renderer 對外只有一個入口(名稱實作計畫定,形如 `ReportV32.render(mountEl, input)`),input:

```
{ scores: {qian..dui 0-100},
  conf: {k:'firm'|'mixed'}|null,     // 篤定度;null=分享碼重建,可信度句不出現
  overs: [k...], unders: [k...],     // 校準分類(頁面自己算好)
  neutral: 'flex'|'undev'|null,
  now: {norm:{...}}|null }           // 此刻 overlay(僅 persona.html 用)
```

- persona.html adapter:既有 computeScores/conf/calibResults 直餵。
- persona-v2 adapter:`sure→firm` 對映;costSt over/under→overs/unders;分享碼路徑 conf=null。
- renderer 不認識任何頁面內部結構、不碰計分。

## 4. 命名統一(v2 系三頁)

- `bagua-data.js` 新增 `pn(k)`:從 `title`(「乾·開創者」)取者名+卦 →「開創者(乾)」。掛在該檔的既有 export 上(實作時依該檔結構定)。
- persona.html 的頁內 `pn` 改為委派 canonical 版(頁內 E.title 與 bagua-data.js title 同值,以 bagua-data.js 為準;persona.html 補載 `bagua-data.js`)。
- persona-v2(:414 pn)、hybrid(對話三處 fnShort+者)、crystal(兩處)全改用 canonical `pn`。
- `fnShort`(開創/明現/交流…)降級為**態功能短名**:僅用於「偏X」等標籤,禁止再組「X者」。

## 5. 各頁改動摘要

| 頁 | 改動 |
|---|---|
| bagua-persona.html | 四塊組裝函式搬出至 renderer;補載 bagua-data.js;行為不變(271 條測試=搬移驗收) |
| bagua-persona-v2.html | renderReport 改呼叫 renderer;特色段退場:二選一對照、每態六級+雅稱列表、能量晶體連結、錨定式四系統敘事 |
| bagua-hybrid.html | 對話分段揭示的命名改 canonical;連結不動(完整報告仍→persona-v2) |
| bagua-crystal.html | 命名兩處改 canonical;其餘不動 |

## 6. 測試

- persona 套件(271 條)全綠不動搖=搬移的主要驗收;既有斷言不得為遷就而弱化。
- renderer 抽出後,persona 測試頁能直接對 window 上的 renderer 函式做單元斷言(pn/shapeOf 等)。
- `bagua-persona-v2.test.html` 補:核心四塊出現(narrative-block/sys-detail/radar rgrp)、canonical 命名(洞見者(離) 出現、明現者 不出現)、sure→firm 對映生效、conf=null 時無可信度句、特色段確實退場。
- hybrid/crystal 測試頁補命名斷言(canonical 者名出現、fnShort+者 組名不出現)。

## 7. 風險與誠實邊界

- 兩套題本計分互不相混;renderer 只吃分數。
- v2 二選一資料這輪起不再呈現;資料仍在分享碼格式內,未銷毀,日後可再議。
- crystal 自 v2 報告退場但 hybrid 仍直連,不成孤兒頁。
- persona.html 剛上線即再動,風險以「純機械搬移+測試全綠」控制;任何行為變更=超出本輪範圍。
- 文案不變(仍為 v0.1 研究假設·待考);本輪是架構與命名,不是文案輪。
