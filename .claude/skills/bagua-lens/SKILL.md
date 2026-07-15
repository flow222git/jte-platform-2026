---
name: bagua-lens
description: 八態鏡透鏡判讀——用 states-schema 讀「運作」(會議紀錄/BP/制度/觀察筆記),不讀人。觸發:「用八態鏡讀」「透鏡判讀」「照一下這份(素材)」;素材可為貼上文字、檔案路徑、公開網址或 Google Drive 連結。不要用於:個人測驗解讀(那是 bagua-persona/hybrid 的事)、任何要求排名/評分/錄取建議的場景(G6 禁止,直接婉拒並說明)。
---

# 八態鏡(透鏡判讀)

讀運作,不讀人。判讀的**唯一依據**是 canonical schema,本 skill 不複寫任何定義(meta A 同源)。

## 流程

1. **讀 schema**:`octenso/octenso-states-schema-v0.1.yaml` 全文。guardrails G1–G8 是硬規則,不可覆寫;verdicts 值域、context_declaration、output_spec 照辦。
2. **取素材**:貼上文字直接用;公開網址→抓取轉純文字;Google Drive 連結→用 Drive 工具讀取。語音轉文字原稿錯字多,以語意為準,引文照原文抄錄。
3. **要求宣告素材類型**(八型:brainstorm/decision/retro/routine/bp/policy/interview/observation)。使用者沒說就先問一句,**不要自己猜**(G8:使用者宣告,系統不猜)。
4. **判讀輸出**(照 output_spec):
   - 第一行:「素材類型(使用者宣告):X · AI 判讀 · 引文可查」
   - 八態逐一列 presence(有料/薄/缺席),一態不可省略;每條判定附**逐字引文**(G5),引不出來=缺席(無資料)
   - ①缺席清單(依 context_declaration 分「警示/本型態預期」,含補問建議)→②失衡疑似(型態不適用則註明)→③強態圖景→④四系統各一句小結
   - 主詞永遠是「這場會議/這份文件的運作」;禁「你是/他是/這種人」(G4);禁總分/排名/建議錄取/投資建議/預測(G1/G6);interview/observation 依 G7 降級
5. **正式收斂測試**(使用者要求時):派兩個獨立 subagent 盲判(prompt 一字不差、互不知對方、只准讀 schema+素材),對答案算 presence 一致率與引文重疊,分歧回填 schema 混淆對照。
6. **語彙收割**:判讀後使用者改過的措辭、順手的好句,提議收進 `docs/octenso/material-pool.md`(狀態標`原始`,走既有出貨動線)。

## 誠實邊界

- schema v0.1 研究假設待考;升 v0.2 需真實素材雙盲收斂達標(schema acceptance 區塊)。
- 回溯性閱讀一律加註「不構成因果宣稱」(G3)。
- 真實素材(含人名/機密)不 commit 進 git;存 scratchpad 判讀即可。
