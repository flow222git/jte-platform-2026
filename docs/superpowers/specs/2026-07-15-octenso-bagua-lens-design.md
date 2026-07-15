# 八態鏡(bagua-lens)透鏡判讀引擎網頁 設計

2026-07-15 · 與 Simon 對談定案

## 背景與目的

透鏡層(讀運作不讀人)已有 Define 層(states-schema v0.1 八態完整、乾跑除錯畢、
真實會議首測完成)。下一步把判讀變成 2-3 人內部可用的網頁工具:貼素材 → 宣告
類型 → 八態判讀報告(引文可查)。

**時序定案:不預建語彙資料庫。** 理由:schema 本身已是判讀語彙庫核心;預建內容
無真實判讀校準必漂(前例:型錄未上線、藝術競稿未收斂);語彙庫改為「從真實判讀
收割進素材倉」的拉式生長。真正前置=乾跑抓出的兩條 v0.2 待辦,併入本輪。

**北極星張力(Simon 已知情點頭):** 透鏡判讀=AI 讀自由文本,無法純規則組裝;
守法=G1–G8 護欄+output_spec 固定結構+逐條逐字引文(可追溯),報告明標
「AI 判讀 · 引文可查」。

## 變更內容

### ① schema 升 0.1.1(octenso/octenso-states-schema-v0.1.yaml)
- 新增 `context_declaration` 區塊:素材類型由使用者宣告(同 WH1 模式,受 G8 管轄),
  八型:動腦會/決策會/覆盤會/例行會/BP/制度文件/面試筆記/個人觀察筆記。
  每型定義缺席/失衡的分級調整(如:動腦會→坎發散不標失衡、坤艮缺席=本型態預期;
  決策會→艮坤缺席升首位警示;面試筆記/觀察筆記→依 G7 降級)。
- `output_spec` 明訂「八態逐一列 presence,一態不可省略」與「報告開頭註明宣告類型」。
- meta.version → "0.1.1"(誠實註明:未達 v0.2 收斂門檻,v0.2 仍需真實素材收斂達標);
  G1–G8 與八態定義一字不動。
- `tools/check-states-schema.py` 同步:version 期望、context_declaration 八型齊全檢查。

### ② Worker 加 /lens 路徑(ven-i/worker.js)
- 沿用既有模式:path 路由(`/lens`)、獨立限流(`lens:` 每 IP 每日 20)、
  CORS 白名單不動、金鑰只在雲端。
- payload:`{material, schema, contextType, contextLabel}`;
  護欄:material ≤ 20000 字、schema ≤ 20000、contextType 白名單驗證。
- **meta A 同源**:schema 由前端 fetch 同站 YAML 原文隨請求送入,Worker 不存副本;
  system=[LENS_SYSTEM 守則 + schema 原文],皆掛 cache_control。
- LENS_SYSTEM 鐵則:G5 逐字引文、八態逐列、主詞是運作、G1/G6 禁輸出、
  依 context_declaration 調級、G7 降級、開頭標「素材類型(使用者宣告)· AI 判讀 · 引文可查」、
  語氣負面清單(罐頭同理/說教腔/金句公式)。
- model=claude-sonnet-5、max_tokens=2500;回 `{reading}`。

### ③ 頁面 octenso/bagua-lens.html
- noindex + octenso-gate 白名單(內部工具等級,不接導覽)。
- 介面:素材 textarea → 類型下拉(八型)→「判讀」→ 報告渲染(①缺席(警示/本型態預期
  分開)→②失衡疑似→③強態圖景→④四系統小結;pre-line 文字即可,不做花式排版)。
- 誠實印章:「AI 判讀 · 引文可查 · v0.1 研究假設待考;素材即時判讀、不儲存,
  結果只留在此裝置」。素材與報告皆不落 Worker/KV。
- localStorage:最近 10 筆(素材前 80 字+類型+報告+時間)。
- 語彙收割:報告下方一格「這句怎麼說更好」輸入,存 localStorage(`lens_harvest`),
  之後由 Claude Code 收割進素材倉。
- 視覺:宣紙/墨/松綠,同 octenso 家規,無 emoji。

### ④ 驗證
- `octenso/bagua-lens.test.html`:gate 前提下的 UI 結構、prompt/payload 組裝函式
  (contextType 進 payload、schema 文字有帶上)、localStorage 歷史與收割讀寫;
  LLM 呼叫不進 CI(headless 斷言到 fetch 前為止,mock fetch)。
- checker 全綠;worker 改動部署後以真實素材實測一次,對照今日人工盲判結果。

## 不做的事
- 預建語彙轉譯資料庫(拉式收割取代)。
- 多人管理/分享連結/雲端歷史/對外語氣打磨。
- 判讀結果回傳落檔(北極星:素材不上傳;內部工具連摘要都不存)。
- v1/v2/hybrid/問易 行為不動。

## 完成的定義
1. schema 0.1.1+checker 全綠;八態定義與 G1–G8 一字未動。
2. /lens 部署後,貼今日真實會議稿+宣告「動腦會」→ 報告不再誤標坎失衡、
   坤艮列「本型態預期」,八態逐列,每條有引文。
3. lens 頁+test 全綠;PR 進 main;COMPENDIUM 決策史一行。
