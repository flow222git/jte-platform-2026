# 練息場大首頁重設計

## Context
舊首頁身兼「行銷落地頁」與「每日使用 App」兩種角色互相搶版面，工具發現性零散（6 個工具 3 種排版）、CTA 重複、存在開發徽章與佔位。經研究全平台工具與品牌後重設計首頁，使用者拍板定案。

## 決策（已採用）
- **最上方＝金句／研究文案輪播**：取自小憩 90 句金句精選 20 句 ＋ 5 句研究/科學味文案，每 6.5 秒淡入淡出輪播；標籤切換 DAILY REFLECTION／RESEARCH·科學。
- **工具依意圖分組**（一致雙欄卡）：呼吸·回到當下（呼吸覺察、小憩）；內在·讀懂自己（問易·卜卦、心理位移書寫）；認識自己（溝通類型測驗）。移除開發徽章（Phase 3／新版）。
- **移除「今日 Daily Check」功能**：刪除 page-daily 區塊與所有入口（頂部 nav「今日」、nav CTA、金句/週信卡 CTA、bnav「今日」、HRV 卡）。
- **日曆保留**為記錄時間軸（彙整各工具 linked 記錄）；底部 nav 佔位「紀錄」一併移除，導覽簡化為 首頁／日曆／設定。
- 各「我的記錄」入口改指向日曆（cal）。

## 不做（維持）
- 既有 app 機制（日曆、設定、Firebase/登入、userbar、showDayDetail 的問易/卜易渲染）皆保留。
- Daily Check 的死函式（writebackHRV/renderHRVCard/saveDC/loadDC/setDCDate）保留為休眠（已無呼叫點、不會執行），可日後清理。

## 實作
- 由舊 `index.html` 複製後改寫，最終覆蓋為正式 `index.html`（保留所有非 daily 的 JS/頁面）。
- show() 的 nav-btn 索引同步改為 `{landing:0,cal:1}`；移除載入時 ENERGY INIT IIFE 與 setDCDate() 呼叫、visibilitychange 內 page-daily 判斷。

## 驗證
- headless 渲染：金句輪播出現（JS 完整執行無錯）、page-daily 已移除、無「今日 Check」字樣、工具三組、bnav＝首頁/日曆/設定、banner CTA＝查看我的記錄。
- 線上走查：首頁輪播、點工具可進入、日曆顯示記錄、登入資訊與回首頁（userbar）正常。

## 後續可做
- 清理 daily 死函式；舊呼吸版本檔（breathaware/、breathe_index）淘汰；WriteSpace 寫入時間軸。
