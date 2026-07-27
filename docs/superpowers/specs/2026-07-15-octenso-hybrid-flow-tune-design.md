# hybrid 動線微調(直覺快照+「不像」轉介)設計

2026-07-15 · 與 Simon 對談定案

## 背景與目的

伴讀版(bagua-hybrid)實測後的三項體驗回饋:
1. 開場「收你的問題」讓使用者先自我設框,直覺快照失真——拿掉,回到「憑直覺照相,照完再談」。
2. 逐段核對的「不太像」目前只被收下(單向),浪費了最有價值的訊號——改成分辨入口:
   不像 ≠ 照壞了,可能是「情境的你」蓋過「底色的你」;順勢轉介 v1(底色版),
   把 v2 題本(微場景/最近一個月)與 v1 題本(底色特質)的分工講活,同時補上
   「v1 現役 vs 新世代」的轉介斷鏈。
3. v2 報告的四對「狀態分區小平面」(snapPlane)不好懂——移除,只留兩條音量條。

## 變更內容

### ① 開場直進指導語(octenso/bagua-hybrid.html + bagua-hybrid-data.js)
- 刪 askQuestion() 步驟與呼叫:hello 三句 → 「好,開始吧」→ 直接 bot(coreIntro) → stepCore()。
- 刪除死文案與死路徑(meta A 同源,不留死文案):
  CH.askIntro/askPlaceholder/askSend/askSkip/askEcho、CH.segEndAsk、CH.letterAsk;
  S.ask 欄位與 ground()/revealEnd()/letter() 中的 S.ask 分支。
- revealEnd 一律用 segEndNoAsk。

### ② 「不太像」轉介動線(bagua-hybrid.html + bagua-hybrid-data.js)
- askEcho 遇 'unlike':
  - 首次(全程只觸發一次):ackUnlike 後追問(新文案 CH.unlikeProbe,語意=
    「這面鏡子照的是最近一個月——這一段,會不會比較像某個情境裡的你?」),三選:
    a. 「對,比較像某個情境的我」(CH.unlikeCtx)→ 記 S.echoCtx=true,繼續;
       結尾 moduleAsk 前追加一句提醒(CH.ctxRemind):可用對境耗能模組測「場域要你什麼」。
    b. 「想測測看底色的我」(CH.unlikeBase)→ target=_blank 開 bagua-persona.html(v1),繼續本流程;
    c. 「先繼續」(CH.unlikeGo)→ 繼續。
  - 非首次:維持原 ackUnlike 短謝,不重複推銷。
- 結尾卡(revealEnd)加一顆 ghost 按鈕「底色版(第一版)」連 bagua-persona.html,
  錯過當下入口的人仍可轉介。
- 逐段核對其餘行為不變;S.echo 記錄格式不變(伴讀 grounding 沿用)。

### ③ 移除狀態分區小平面(octenso/bagua-persona-v2.html)
- 刪 snapPlane() 函式、四對區塊中的 +snapPlane(ax) 呼叫、
  「小平面圖:底圖分區就是判讀的門檻…」說明行、.splane CSS。
- 保留:兩條音量條(pole-row)、此刻的運作/判讀、fcCompareNote 文字註記。
- vector.js 與晶體/月照鏡不動(它們另有使用)。

### ④ 文案過 speak-human-tw
- 範圍:本次動到/新增的腳本文案(CH.hello、coreIntro、unlikeProbe 等新句)。
- 守則:半形標點慣例(octenso-protected.md)、受保護術語不動、鏡子隱喻限量、無 emoji。

## 不做的事
- 不動計分/題本/B2 碼(與 v2 同源不變)。
- 不動伴讀 Worker 與守則。
- 不把 v1 題目搬進 hybrid(轉介=連過去,不是內嵌)。
- 不動 v2 報告其他區塊。

## 驗證
- 測試頁更新:bagua-hybrid.test.html(開場無問句直進題目;unlike 首次出現轉介選項、
  次次不重複;結尾卡含底色版按鈕)、bagua-persona-v2.test.html(無 .splane;音量條仍在)。
- 工程慣例:python3 -m http.server + headless chromium 讀 title 的 RESULT pass/fail;
  頁面無外部絕對網址 script。

## 完成的定義
1. 三頁行為如上,舊 localStorage(含 S.ask 殘留)不炸。
2. 兩個 test 頁全綠;全站相關測試不退步。
3. 文案過 speak-human-tw;PR 進 main。
