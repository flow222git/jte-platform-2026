# 練息場整合後台（Phase A）

## Context
現有 `admin.html` 是基礎後台（Google 登入＋`admins` 集合控管權限，有 總覽/活動/用戶/管理員 四頁），但：看不到每個使用者的實際記錄詳情（daily/linked/HRV）；活動上傳、HRV 匯入是各自獨立頁（`activity_import.html`、`hrv_import.html`）未整合；HRV 匯入還是寫死資料。使用者要一個能「看到所有資料、也能上傳活動資訊」的整合後台。

## 範圍決策（已確認）
- **Phase A 先做、做成 `admin-v2.html` 預覽**（不動線上 `admin.html`，確認後再取代）。
- **看＋上傳為主**；個人 daily 記錄以**唯讀**呈現（避免誤刪使用者資料）。可編輯/刪除僅限低風險的活動、管理員。
- Phase B（之後）：HRV 總覽＋真上傳、跨使用者記錄總瀏覽、匯入履歷/匯出。

## Phase A 模組
以 `admin.html` 為殼（沿用登入、`admins` 權限、Firestore init、topbar/sidebar、loadUsers、活動 CRUD）擴充：

1. **總覽儀表板（擴充）**：使用者/活動/管理員數，加 HRV 警示人數與來源分佈（hrv 匯入/活動/自註冊）。
2. **使用者總表＋個人詳情（新，核心）**：
   - 總表：email、姓名、org、來源、＋「查看」。沿用 `loadUsers()`，加搜尋/篩選。
   - 詳情：查詢 `users/{email}/daily` 子集合，依日期倒序呈現該使用者的 daily 時間軸與各 `source` 記錄（呼吸/小憩/HRV/活動/問易/卜易/書寫/TWCT），＋HRV 歷史、參與活動。**唯讀**。
3. **活動管理＋CSV 上傳（整合 activity_import）**：活動總表（編輯/刪除）＋把 `activity_import.html` 的 CSV 解析與匯入邏輯搬進後台（上傳名單 → 寫 `activities/{id}` 與各 `users/{email}/daily/{date}.linked[]`，沿用既有去重）。
4. **管理員管理（保留現成）**。

## 不做（Phase A）
- 不改個人 daily 記錄（唯讀）；不做 HRV 上傳（沿用舊頁，Phase B 再整合）；不做匯出/備份。

## 資料模型（沿用，不變）
`admins/{email}`、`users/{email}`、`users/{email}/daily/{date}`（moods/energy/note/tags/linked[]）、`activities/{id}`。各 source 欄位見研究記錄。

## 驗證
- headless：admin-v2 殼載入無 JS 錯、登入閘正常顯示。
- 線上（owner 帳號 flow@jointoenjoy.com 登入）：總覽數字、使用者總表、點使用者看詳情（daily/各記錄/HRV/活動）、活動 CSV 上傳成功寫入並在時間軸出現、管理員管理正常。
