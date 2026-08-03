---
name: bagua-lens
description: 八態鏡透鏡判讀——用 states-schema 讀「運作」(會議紀錄/BP/制度/觀察筆記),不讀人。觸發:「用八態鏡讀」「透鏡判讀」「照一下這份(素材)」;素材可為貼上文字、檔案路徑、公開網址或 Google Drive 連結。不要用於:個人測驗解讀(那是 bagua-persona/hybrid 的事)、任何要求排名/評分/錄取建議的場景(G6 禁止,直接婉拒並說明)。
---

# 八態鏡(透鏡判讀)

讀運作,不讀人。判讀的**唯一依據**是 canonical schema,本 skill 不複寫任何定義(meta A 同源)。

## 流程

1. **讀真相源(四份,各檔全文)**:
   - 八態判準:`octenso/octenso-states-schema-v0.1.yaml`
   - 三層判準:`octenso/daoliyong-lens-schema-v0.2.yaml`(⑤⑥段唯一依據)
   - 腳本與三角形文本:`octenso/daoliyong-data.js`(TRIANGLE/MODES,只引用不複寫)
   - 局卦層(六爻成卦時讀):`docs/superpowers/specs/2026-06-30-bagua-64-energy-demand-table.md`(64 卦需求表,v0.1 待終審)

   若本地找不到(skill 被安裝在 repo 之外),改抓 canonical 網址(單一真相源,更新所有安裝點自動跟上):
   - `https://raw.githubusercontent.com/flow222git/jte-platform-2026/main/octenso/octenso-states-schema-v0.1.yaml`
   - `https://raw.githubusercontent.com/flow222git/jte-platform-2026/main/octenso/daoliyong-lens-schema-v0.2.yaml`
   - `https://raw.githubusercontent.com/flow222git/jte-platform-2026/main/octenso/daoliyong-data.js`
   - `https://raw.githubusercontent.com/flow222git/jte-platform-2026/main/docs/superpowers/specs/2026-06-30-bagua-64-energy-demand-table.md`

   guardrails G1–G8 是硬規則,不可覆寫(對⑤⑥段同樣適用);verdicts 值域、context_declaration、output_spec 照辦。
2. **取素材**:貼上文字直接用;公開網址→抓取轉純文字;Google Drive 連結→用 Drive 工具讀取。語音轉文字原稿錯字多,以語意為準,引文照原文抄錄。
3. **要求宣告素材類型**(八型:brainstorm/decision/retro/routine/bp/policy/interview/observation)。使用者沒說就先問一句,**不要自己猜**(G8:使用者宣告,系統不猜)。另有兩項可選宣告:**目標**與 **TA**(素材的受眾,非判讀對象)——宣告越齊、⑥越準;未宣告不猜。
4. **判讀輸出**(照 output_spec):
   - 第一行:「素材類型(使用者宣告):X · AI 判讀 · 引文可查」
   - 八態逐一列 presence(有料/薄/缺席),一態不可省略;每條判定附**逐字引文**(G5),引不出來=缺席(無資料)
   - ①缺席清單(依 context_declaration 分「警示/本型態預期」,含補問建議)→②失衡疑似(型態不適用則註明)→③強態圖景→④四系統各一句小結→⑤三角形體檢(理/用/道逐層 presence+逐字引文,一層不可省略;後接三隅箴警示,⑤段附量形描述一句)→⑥判卦與轉化參考(工作假說·待收斂,依 schema guapan 區塊;判定悉依判讀紀律與歸格例句庫):剛柔判定表(三爻各判剛/柔+安/動,每格附逐字引文)→本卦(以 guaOf 反查:卦名+副題+此局死角)→變爻(三源合流:脈絡動爻→宣告校正→菜單兜底)→之卦(以 bianOf 反查:轉化腳本+新死角);必附聲明「此卦由素材判讀推導,非起卦占斷;變爻是處方,不是預言。」;不成卦時明文聲明+缺哪爻+補問,⑥退回 bestUse 對照引用(至多 2 個、必附死角、寧缺勿濫)。素材厚時(內外兩池各撐三爻,依 schema guapan.liuyao 分池規則與升級門檻)自動升六爻版:分池剛柔判定表(6 格,每格剛柔+安動+引文+歸池依據)→本卦(內卦×外卦,查 64 需求表:卦旨/時勢基調/召喚節制/經典依據;內外卦各自的 MODES 腳本可引)→召喚對照(64 表召喚/節制×①–④presence:召喚而缺席=首要功課;三態全文依 schema)→動爻+轉化菜單(依 liuyao 動爻規則)→之卦(64 表反查+新死角);掛雙假說印章;六爻成卦時三爻版省略;六爻不成依四階階梯退回:局部深探(半象/爻象深讀,以小觀大)→三爻版→不成,並註明缺哪池哪爻;判讀收尾必附道理用總綰(三層各一句判定/樣貌/功課+總綰一句;未及之層明文「素材不及,待補」)
   - **雙軌輸出**(2026-07-22 定案):正式交付分兩軌——**白話版**(給素材主人/決策者:答案先行、行動標題、紅綠燈道理用、每個發現「這代表什麼/該注意什麼/怎麼做」三件套+一句原話、先力量後缺口,全部技術判定收進附錄摺疊區)與**深讀版**(校準與專業用:完整判定過程)。呈現規範七條見 `octenso/daoliyong-lens-sop.md`。
   - 主詞永遠是「這場會議/這份文件的運作」;禁「你是/他是/這種人」(G4);禁總分/排名/建議錄取/投資建議/預測(G1/G6);interview/observation 依 G7 降級;interview/observation 型不輸出⑤⑥(依 G7 不適用,報告中明文註記)
5. **正式收斂測試**(使用者要求時):派兩個獨立 subagent 盲判(prompt 一字不差、互不知對方、只准讀 schema+素材),對答案算 presence 一致率與引文重疊,分歧回填 schema 混淆對照。
6. **語彙收割**:判讀後使用者改過的措辭、順手的好句,提議收進 `docs/octenso/material-pool.md`(狀態標`原始`,走既有出貨動線)。

## 迭代模式(每次判讀後必走——鏡子靠這個變準)

7. **收三值回饋**:判讀交付後問使用者(含⑤⑥段)——整體「很像/部分像/不太像」?哪一條判定最有感、哪一條最不服(記下他的原話與理由)。素材提供者不在場時,請使用者代收(同測試手冊的會議閱讀玩法)。
8. **記進待辦**:把當次收穫寫入記憶 `octenso-schema-v02-backlog`(既有條目補證據、新問題開新條)。**寫任何一筆之前先過去識別規則**(見誠實邊界)——素材一進紀錄就等於準備入庫,代號要在當下決定,不能事後補。分三類:
   - **判定分歧**:使用者不服的判定+理由(候選:混淆對照/門檻/型態調整)
   - **語彙**:使用者的改寫(候選:material-pool)
   - **schema 缺口**:判讀時自己卡住或引文找不到判準的地方
   - **三層判定分歧**:⑤⑥段的判定或腳本引用被不服(候選:三層混淆對照/三隅箴門檻/引用規則)
   - **判卦分歧**:本卦不服/變爻不服/之卦不服分開記(三個部位校準訊號不同;候選:剛柔判準/變爻判定律);六爻:分池歸屬不服也記(候選:歸池三原則)
9. **進化觸發**:使用者說「進化一下八態鏡」(或同義)時——把累積待辦整理成 schema 修訂提案給使用者過目,核准後修訂、跑 `python3 tools/check-states-schema.py` 與相關迴歸、開分支 PR。紅線:G1–G8 凍結;八態定義本體動之前必須逐條經 Simon 核准;三層定義與三隅箴同等待遇(daoliyong-lens-schema 修訂同走本流程,檢查器:python3 tools/check-daoliyong-lens-schema.py,本機無 python 用 node tools/smoke-daoliyong-lens-schema.mjs);剛柔判準三表與變爻判定律亦同(動之前逐條經 Simon 核准);分池規則與六爻規則亦同;混淆對照只增不減;版號=內容修訂走 0.1.x,**升 0.2 唯一途徑是真實素材雙盲收斂達標**(schema acceptance)。

## 誠實邊界

- schema v0.1 研究假設待考;升 v0.2 需真實素材雙盲收斂達標(schema acceptance 區塊)。
- 回溯性閱讀一律加註「不構成因果宣稱」(G3)。
- 真實素材(含人名/機密)不 commit 進 git;存 scratchpad 判讀即可。
- **去識別規則(repo 為 public,恆守)**:客戶、合作方、未公開素材一律代號記錄(A 集團、B 公司、C 案…),對照表**不入 repo**;**公開文獻案照實記名**(股東信、事故調查報告、傳記、公開治理紀錄——本來就公開,記名才可迴測)。永不入庫:逐字引文、客戶營運數字與量表統計、報價與商務條件、判讀報告連結、可回推規模的具體筆數。去識別後的校準紀錄收在 `octenso/CALIBRATION.md`(該檔檔頭即本規則)。
  **「入庫」包含 commit message、PR 標題與本文、issue 與 review 留言**——不只檔案內容。曾發生檔案已代號化、commit message 卻照抄真名的情形(2026-08-03 修);推之前把要寫的訊息也過一次這條規則。
