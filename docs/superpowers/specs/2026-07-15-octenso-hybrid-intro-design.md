# hybrid 接開場四卡(完整儀式感)設計

2026-07-15 · Simon 核可

## 背景與目的

hybrid(伴讀版,主推)目前一進頁直接聊天氣泡;v3 的開場四卡(安定→這是在看誰→
怎麼答→接下來;呼吸/軌道/羅盤/八點環金線動畫、可跳過、支援 reduced-motion)
是為「進場安定+施測語」設計,且末卡文案本就是伴讀版語境(「有人陪你一起看…
你隨時可以說『不像我』」)。把四卡接到 hybrid 開頭,完整體驗=四卡 → hello 三句
→ 開始吧 → 直覺作答。

## 變更內容

1. **INTRO 搬家(meta A 同源,單一真相源)**
   - `bagua-v3-data.js` 的 INTRO/INTRO_NEXT/INTRO_GO/INTRO_SKIP 四個資料原樣搬到
     `bagua-hybrid-data.js`(hybrid=主推的家),v3-data 刪除之。
   - `bagua-v3.html` 引用改 `H.INTRO`/`H.INTRO_NEXT`/`H.INTRO_GO`/`H.INTRO_SKIP`
     (v3 已載 hybrid-data,零新增依賴);`bagua-v3.test.html` 的 X3.INTRO 斷言同步改 H.INTRO。
2. **hybrid 接開場**(`bagua-hybrid.html`)
   - 移植 v3 的開場 CSS(#intro/.icard/.imotif/.ikicker/.it/.is/.idots/.inav/.iback/
     .iskip/.ibreathe + keyframes + reduced-motion)與 JS(motifSvg/buildIntro/reveal)。
   - body 加 `<div id="intro"></div>`;prog/chat/honest 初始加 `hide`(v3 同款)。
   - 入口:全新使用者 → buildIntro(→reveal→begin());有存檔 → intro 直接 hide、
     reveal 後走原 resume 邏輯(不重播四卡)。
   - talkbar 原本就 hide,不變。
3. **文案零改寫**:四卡文字原樣搬,不重寫、不再過潤稿(已是定稿)。

## 不做的事
- 不動題本/計分/B2 碼、v1/v2 頁、Worker、四卡文案內容。
- 不做 hybrid 專屬新卡片或新動畫。

## 驗證
- `bagua-hybrid.test.html`:資料斷言 H.INTRO×4(含末卡「陪」);E2E walker 先走四卡
  (點 #intro-next 直到進 hello),斷言開場卡文字出現(「深呼吸」)且 reveal 後聊天可續走。
- `bagua-v3.test.html`:INTRO 斷言改讀 H.INTRO,26/0 不退步。
- 工程慣例 TESTRUN(headless Chrome 讀 title);無外部 script。

## 完成的定義
1. hybrid 全新進入=四卡→hello→題目;resume 不重播;跳過鍵有效。
2. v3 行為不變(讀新家資料);兩 test 頁+回歸全綠。
3. PR 進 main。
