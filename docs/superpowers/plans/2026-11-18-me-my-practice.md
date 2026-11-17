# 我的練習 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** `/me` 多一塊「我的練習」：本人自訂項目（太極、靜坐……），每個項目有長期紀錄（月曆、累計、趨勢圖）、心得靈感、筆記；沒登入存本機，登入後問一次要不要放雲端。

**Architecture:** 純函式放 `me/me-core.js`（可測）；雲端讀寫放 `me/me-cloud.js`；畫面是新的獨立模組 `me/me-practice.js`＋`me/me-practice.css`，由 `me/index.html` 用一個小介面（`JtePrac.init/render/setUser/handleHash/exportData`）接上。模組內部用「store」抽象，本機與雲端各一個實作。

**Tech Stack:** 無建置的靜態頁、ES5 寫法（`var`、`function`，不用箭頭函式、不用 `let/const`、不用樣板字串；測試檔可以用箭頭函式）、Firebase compat SDK（已在 `me/vendor/`）、頁內 SVG。

**Spec:** `docs/superpowers/specs/2026-11-18-me-my-practice-design.md`（實作者要讀與自己任務有關的章節）。

## Global Constraints

- 所有 `/me` 頁面文案進 `me/me-data.js`（`JTE_ME_DATA.prac`），`me-practice.js` 與 `index.html` 裡不散寫中文句子。
- 繁體中文、不用 emoji、不加外部絕對網址的 `<script>`／`<link>`。
- 不寫「進步」「退步」「加油」「連續」「已經 N 天沒練」；不算連續天數、不設目標、不提醒；不同項目之間不合計、不比較、不畫在同一張圖。
- 測試與示範資料全用虛構內容；repo 裡不可出現任何人的信箱（測試用 `@example.com`）。
- 示範模式（`?demo`）不寫 localStorage、不讀寫雲端。
- 上限：項目名稱 30、單位 10、一句 500、筆記標題 100、筆記內文 20000、數量大於 0 且不超過 100000、最多一位小數；日期 `YYYY-MM-DD`、不能是未來。
- 測試指令（repo 根目錄、Git Bash；這台機器的 `python` 是空殼，一定要用這個路徑）：
  `PYTHONUTF8=1 PYTHONIOENCODING=utf-8 "/c/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe" jte-testrun.py me/me.test.html`
  開工前是 `DONE pass=70 fail=0`；每個任務結束時 fail 必須是 0。
- 每個任務一個 commit（訊息用繁體中文、`feat(me): …`，結尾加 `Co-Authored-By` 寫自己的模型）。不要 push。只動任務列出的檔案。

---

### Task 1: 資料層、文案、測試

**Files:** Modify `me/me-core.js`, `me/me-data.js`, `me/me.test.html`

**Produces（全部掛在 `JteMe` 上；`lim` = `JTE_ME_DATA.prac.max`）：**

- `pracFmt(n)` → 字串，最多一位小數、不留 `.0`（`3`→`'3'`、`1.5`→`'1.5'`、`0.1+0.2`→`'0.3'`）。
- `pracAmount(v, max)` → 數字（四捨五入到一位小數）或 `null`。空字串、非數字、`<=0`、`>max` 都是 `null`。接受字串 `'12'`、`' 1.5 '`。
- `pracItemCheck(x, lim)` → `{ ok, err, item:{ name, unit, color } }`。`name`、`unit` 去頭尾空白；`name` 空或超過 → `err:'name'`；`unit` 空或超過 → `err:'unit'`；`color` 原樣（字串，沒有就 `''`）。
- `pracLogCheck(x, todayKey, lim)` → `{ ok, err, log:{ date, amount, note } }`。`date` 不是真實存在的 `YYYY-MM-DD`（`2026-02-31` 不行）→ `'date'`；晚於 `todayKey` → `'future'`；數量不合 → `'amount'`；`note` 去頭尾空白後超過 → `'note'`。
- `pracNoteCheck(x, lim)` → `{ ok, err, note:{ title, body } }`。`title` 去頭尾空白，空或超過 → `'title'`；`body`（不去空白、保留換行）超過 → `'body'`。
- `pracClean(p)` → `{ items:[], logs:[], notes:[] }`，任何不是陣列的都變空陣列，丟掉沒有 `id` 的元素；輸入 `null` 也可以。
- `pracLast(logs, itemId)` → 這個項目最晚的 `date`，沒有回 `''`。
- `pracMonth(logs, itemId, y, m)`（`m` 1–12）→ `{ lead, days:[{ key, d, n, sum }], n, sum }`。`lead` 是當月 1 號前面要空幾格（**週一起算**，週一＝0、週日＝6）；`days` 每天一筆，`n` 筆數、`sum` 合計（四捨五入到一位小數）；最外層 `n`、`sum` 是整個月。
- `pracTotals(logs, itemId, todayKey)` → `{ month:{ n, sum }, all:{ n, sum, first } }`。`month` 是 `todayKey` 所在的月；`first` 是最早的 `date`，沒有回 `''`。
- `pracWeeks(logs, itemId, todayKey, count)` → 長度 `count` 的陣列，舊到新，最後一個是 `todayKey` 所在的週；每個 `{ start, n, sum }`，`start` 是那一週週一的 `YYYY-MM-DD`。沒有紀錄的週 `n:0,sum:0`。
- `pracMonths(logs, itemId, todayKey, count)` → 長度 `count`，舊到新，最後一個是 `todayKey` 所在的月；每個 `{ ym:'YYYY-MM', n, sum }`。
- `pracDayLogs(logs, itemId, key)` → 那一天的紀錄，依 `at` 舊到新。
- `pracRemoveItem(p, itemId)` → 新的 `{ items, logs, notes }`，拿掉這個項目與它的紀錄、筆記；不改動輸入。
- `pracUnmark(list, itemId)` → 新陣列，`itemId` 相符的元素複製一份並刪掉 `itemId` 欄位，其餘原樣。
- `pracInsp(list, itemId)` → `itemId` 相符的元素，依 `key`（日期字串）新到舊。
- `pracId(prefix)` → `prefix + Date.now().toString(36) + 隨機 6 碼`（這個不用是純函式）。
- `route(hash)`：`#practice-item-{id}` → `{ pane:'practice', sub:'trail', item:'{id}' }`（`id` 只接受 `[A-Za-z0-9_-]{1,40}`，不合就照舊當成不認得的網址回 `today`）。其他網址的回傳值加上 `item:''`。`paneOf('#practice-item-abc')` 是 `'practice'`。

**`me/me-data.js` 新增 `prac`：**

```js
prac: {
  max: { name: 30, unit: 10, note: 500, title: 100, body: 20000, amount: 100000 },
  units: ['分鐘', '遍', '次'],
  examples: [{ name: '太極', unit: '分鐘' }, { name: '靜坐', unit: '分鐘' }, { name: '呼吸', unit: '分鐘' }, { name: '書法', unit: '張' }],
  colors: ['#2F6BD8', '#34C8A0', '#FF9925', '#7A6BD8', '#E8690B', '#4CAF19'],
  weeks: 12, months: 12,
  err: { name: '請填項目名稱（30 字以內）', unit: '請填單位（10 字以內）', date: '日期不對', future: '不能選未來的日子', amount: '請填大於 0 的數字', note: '這一句太長了（500 字以內）', title: '請填標題（100 字以內）', body: '內文太長了（20000 字以內）' },
  t: { title: '我的練習', note: '你自己長期在練的事。項目自己訂，慢慢記。' }
}
```
（`t` 之後的任務會再加畫面文案。）不要改既有文案。

**Tests（加在 `me/me.test.html` 的 `log('---')` 之前，沿用檔內 `check(name, fn)` 的寫法）至少涵蓋：**

- `pracFmt`、`pracAmount`：`''`、`'abc'`、`0`、`-1`、`100000.1` 是 `null`；`'12'`→12；`1.26`→1.3；`100000`→100000。
- `pracItemCheck`：空名稱、31 字名稱、空單位、11 字單位；正常的會去空白。
- `pracLogCheck`：`2026-02-31`→`date`；明天→`future`；今天可以；數量 0→`amount`；501 字→`note`。
- `pracNoteCheck`：空標題、101 字標題、20001 字內文；內文的換行保留。
- `pracClean(null)` 回三個空陣列；丟掉沒有 `id` 的。
- `pracMonth`：2026 年 11 月 `lead` 是 6（11/1 是週日）、`days.length` 是 30；同一天兩筆 `n:2`、`sum` 是合計；別的項目的紀錄不算進來；`0.1+0.2` 的合計是 `0.3`。
- `pracTotals`：本月與全部分開算；`first` 是最早的日期；沒有紀錄時都是 0、`first:''`。
- `pracWeeks`：`todayKey` `2026-11-18`（週三）、`count` 3 → `start` 依序 `2026-11-02`、`2026-11-09`、`2026-11-16`；跨年：`todayKey` `2027-01-01`、`count` 2 → `2026-12-21`、`2026-12-28`；空的週 `n` 是 0。
- `pracMonths`：`2027-01-15`、`count` 3 → `2026-11`、`2026-12`、`2027-01`。
- `pracRemoveItem`：項目、紀錄、筆記一起消失，別的項目的留著，輸入沒被改動。
- `pracUnmark`、`pracInsp`。
- `route('#practice-item-abc')` 與 `route('#practice-item-a/b')`；既有的 `route` 測試仍然通過。
- `D.prac` 有 `max`、`units`、`examples`、`colors`、`err` 八個鍵、`t.title`。

**Commit:** `feat(me): 我的練習——資料層與測試`

---

### Task 2: 雲端讀寫與規則

**Files:** Modify `me/me-cloud.js`, `firestore.rules`

**Consumes:** `me-cloud.js` 既有的 `col(name)`（`users/{uid}/{name}`）、`need()`、`db`、`user`。

**Produces（掛在 `JteCloud` 上，全部回 Promise；沒登入就 reject `not-signed-in`）：**

- `KINDS = { items:'practiceItems', logs:'practiceLogs', notes:'practiceNotes' }`（內部用）。
- 欄位白名單（寫入時只取這些，`id` 不寫進文件內容，文件代號就是 `id`）：
  - items：`name, unit, color, archived(布林), createdAt(數字)`
  - logs：`itemId, date, amount, note, at(數字)`
  - notes：`itemId, title, body, updatedAt(數字)`
- `pracLoad()` → `{ items, logs, notes }`，每個元素是文件內容加上 `id`。
- `pracHas()` → 布林（`practiceItems` 取 1 筆）。
- `pracPut(kind, obj)` → `set` 文件 `obj.id`（整份覆寫），成功回 `obj`。
- `pracDel(kind, id)`。
- `pracDelItem(itemId)` → 查出這個項目的紀錄與筆記（`where('itemId','==',itemId)`），和項目本身一起用 batch 刪掉，每批最多 400。
- `pracUpload(p)` → 把 `{ items, logs, notes }` 全部 `set` 上去，每批最多 400、每批各自 `try`；回 `{ ok, failed, codes }`（`ok`／`failed` 是筆數，`codes` 是不重複的錯誤代碼）。
- `pracWipe()` → 三個集合全部刪掉（每批最多 400）。
- 靈感的項目標記：`saveInsp(ins)` 在 `ins.itemId` 有值時多寫 `itemId`；`listInsp()` 回傳的每一筆帶 `itemId`（沒有就 `''`）；新增 `setInspItem(ins, itemId)`：`itemId` 有值就 `update({ itemId })`，空的就用 `firebase.firestore.FieldValue.delete()` 拿掉；回更新後的 `ins`。

**`firestore.rules`**（加在 `/users/{uid}/photos` 之後；repo 的檔案是備份，不用發布）：

- 三個新集合：`allow read, delete: if request.auth != null && request.auth.uid == uid;`；`create, update` 另外要通過欄位檢查：
  - `practiceItems`：`keys().hasOnly(['name','unit','color','archived','createdAt'])`、`name` 字串 1–30、`unit` 字串 1–10、`color` 字串 ≤20、`archived` 布林、`createdAt` 數字。
  - `practiceLogs`：`hasOnly(['itemId','date','amount','note','at'])`、`itemId` 字串 1–40、`date` 符合 `^[0-9]{4}-[0-9]{2}-[0-9]{2}$`、`amount` 數字 `>0 && <=100000`、`note` 字串 ≤500、`at` 數字。
  - `practiceNotes`：`hasOnly(['itemId','title','body','updatedAt'])`、`itemId` 字串 1–40、`title` 字串 1–100、`body` 字串 ≤20000、`updatedAt` 數字。
  - 文件代號 `id.size() <= 40`。
- `inspirations` 既有規則：允許多一個選填欄位 `itemId`（字串、≤40）。先讀懂既有規則的寫法再改，不可放寬其他檢查。

**Verification:** 測試指令仍是 fail=0（這個任務不加測試，雲端要等真帳號驗證）；用一小段能辨認字串與註解的 Python 檢查 `me/me-cloud.js` 的 `{}`、`()`、`[]` 成對，`firestore.rules` 的 `{}`、`()` 成對。

**Commit:** `feat(me): 我的練習——雲端讀寫與安全規則`

---

### Task 3: 畫面（本機模式與示範模式）

**Files:** Create `me/me-practice.js`, `me/me-practice.css`; Modify `me/index.html`, `me/me-data.js`, `me/me.test.html`

這個任務決定大家愛不愛用，請把心力放在：**記一筆要快**（今天頁點一下、打數字、送出，三個動作以內）、**回頭看要有成就感但不催促**（月曆與趨勢圖清楚好看）、**手機寬度好用**（375px 不橫向捲動、按鈕好按）、鍵盤與螢幕閱讀器可用。視覺沿用 `me/index.html` 既有的設計元素（`.panel`、`.btn`、`.btn.fill`、`.btn.sm`、`.lnk`、`.chip`、`.note`、`.sec`、`.eyebrow`、`.in`、`.row`，以及 `:root` 的色票與圓角），新的樣式都寫在 `me/me-practice.css`、類名用 `pr-` 開頭。先讀 `me/index.html` 的 `<style>` 與「練習」「今天」兩個區塊再動手。

**Consumes:** Task 1 的全部函式與 `D.prac`。

**模組介面（`window.JtePrac`）：**

```js
JtePrac.init(ctx)      // 只呼叫一次
JtePrac.render()       // index.html 的 renderAll() 每次都會呼叫；要快、可重複呼叫
JtePrac.setUser(user)  // 登入狀態改變時呼叫（這個任務先存起來不用）
JtePrac.handleHash(h)  // 傳入 location.hash；是 #practice-item-{id} 就打開那個項目的專區並回 true，否則關掉專區回 false
JtePrac.exportData()   // 回 { items, logs, notes }（目前畫面上的資料），給「下載我的資料」
```

`ctx`（由 `index.html` 提供）：

```js
{ D: JTE_ME_DATA, M: JteMe, O: O,            // O 是 jte_me_v1 的內容物件；O.prac 可能不存在
  save: save,                                 // 寫回 localStorage（示範模式下什麼都不做）
  DEMO: DEMO, TODAY: TODAY, toast: toast,
  goPane: goPane,                             // goPane('practice-item-xxx')、goPane('practice')、goPane('today')
  getInsp: function(){ return O.memos.concat(S.cloud) },   // 全部靈感（本機＋雲端），元素有 id、key、text、itemId?、photos?
  addMemo: function(text, itemId){ ... },     // 新增一則只有文字的靈感（存本機、帶 itemId），做完會自己 renderAll
  startPhoto: function(itemId){ ... },        // 帶著項目跳到「今天」的靈感框（要放照片時用）
  refresh: renderAll }
```

**`index.html` 要改的地方（只做接線，邏輯都在模組裡）：**

1. `<head>` 加 `<link rel="stylesheet" href="me-practice.css">`；`me-cloud.js` 之後加 `<script src="me-practice.js"></script>`。
2. 「今天」：在 `.now` 那個 `<section>` 之後加 `<div id="pracquick" hidden></div>`。
3. 「練習」：`#view-practice` 最上面加 `<section aria-labelledby="h-prac" id="sec-prac"><div class="sec">…</div><div id="pracbox"></div></section>` 與 `<div id="praczone" hidden></div>`；把原有的幾個 `<section>` 包進 `<div id="pracrest">`。專區打開時 `#sec-prac` 與 `#pracrest` 隱藏、只顯示 `#praczone`。
4. `renderAll()` 裡呼叫 `JtePrac.render()`；`showPane(v)` 裡呼叫 `JtePrac.handleHash(v)`；啟動時 `JtePrac.init(ctx)`（在第一次 `renderAll()` 之前）。確認 `hashchange` 時會走到 `showPane`。
5. 實作 `ctx.addMemo`（`O.memos.push({ id:'m-'+Date.now(), key:TODAY, text:text, itemId:itemId })`、`save()`、`renderAll()`）與 `ctx.startPhoto`（記住 `S.capItem=itemId`、`goPane('today')`、focus `#memo`；這個任務只要做到跳過去並聚焦，項目的帶入在 Task 4）。
6. `wipeMine()` 清掉本機資料後，`O.prac` 也不見（它本來就 `delete` 全部鍵，確認即可）並呼叫 `JtePrac.render()`（經由 `renderAll`）。

**模組內部：**

- `store` 抽象，這個任務只做本機：`load()` 回 `M.pracClean(O.prac)`；`putItem/putLog/putNote(obj)`、`delLog/delNote(id)`、`delItem(id)`，每個都回 Promise（本機用 `Promise.resolve`），寫完 `O.prac = …; ctx.save()`。畫面一律「等 Promise 成功才更新」，失敗顯示 `D.prac.t.fail`、表單內容留著。Task 4 會加雲端的 `store`，所以不要在畫面程式裡直接碰 `O.prac`。
- 示範模式：`store` 用記憶體裡的虛構資料——兩個項目（太極／分鐘、靜坐／分鐘），過去約 4 個月、用固定種子產生的紀錄（太極每週 3–4 次、20–40 分鐘；靜坐較零星、10–20 分鐘），幾筆有一句心得，各一兩份筆記；另外示範的靈感裡有一兩則帶項目。不寫 localStorage。
- **我的練習（`#pracbox`）**：每個項目一張卡（顏色標記、名稱、上次練的日期、這個月「N 次・共 X 單位」）；整張卡可點、進專區；卡上有一顆「記一筆」。最後是「新增項目」。沒有項目時是一句說明＋例子（點了帶入名稱與單位）＋「新增項目」。已封存的收在最下面的「已封存」。
- **新增／編輯項目表單**：名稱、單位（三個可點的＋自己打）、顏色（色票圓點，`role="radiogroup"`）。錯誤訊息用 `D.prac.err`。
- **今天的快速鍵（`#pracquick`）**：一個 `.panel`，標題一小行，下面每個沒封存的項目一顆膠囊按鈕「太極　記一筆」。點了就地展開小表單：數量（`inputmode="decimal"`，自動聚焦，旁邊顯示單位；預設帶入這個項目上一筆的數量）、一句（選填）、日期（預設今天，可改）、「記下來」。送出後收起並 toast「記下了：太極 30 分鐘」之類（文案進資料檔）。Enter 可以送出。沒有項目時整塊 `hidden`。
- **專區（`#praczone`）**：上方「回到練習」＋項目名稱＋「記一筆」；四個分頁（`role="tablist"`）：
  - **紀錄**：累計（這個月 N 次・共 X；開始到現在 N 次・共 X・從 YYYY/MM/DD 開始）；月曆（週一開頭、可前後翻月、不能翻到未來的月份之後；有練的日子用項目顏色、顯示當天合計；今天有標示；點一天在下方列出那天每一筆，可改、可刪（刪除要再確認）、可在那天補記）；趨勢圖（頁內 SVG 長條圖、每週／每月切換、項目顏色、每根上方或 `<title>` 有數字、底下有簡短的座標標籤、圖有 `role="img"` 與文字替代說明）。沒有任何紀錄時顯示一句邀請，不顯示空圖。
  - **心得靈感**：一個文字框＋「留下」（呼叫 `ctx.addMemo(text, itemId)`）與「要放照片」（`ctx.startPhoto(itemId)`）；下面列 `M.pracInsp(ctx.getInsp(), itemId)`，每則顯示日期、文字、有照片的顯示縮圖（照片元素有 `data`、`caption`）。
  - **筆記**：列表（標題、最後修改日期，新的在上）；「新增筆記」；點一份展開成可編輯的標題＋內文（`textarea` 夠高、保留換行）、「存起來」「刪除」（要再確認）。
  - **設定**：改名稱／單位／顏色；改單位的提醒；封存／解除封存；刪除（要再確認，說清楚會刪掉幾筆紀錄、幾份筆記，心得靈感會留著）。刪除後 `goPane('practice')`。這個任務刪除項目時，本機 `O.memos` 用 `M.pracUnmark` 拿掉標記。
- 分頁狀態、月曆的月份、展開的表單都放在模組自己的狀態裡；`render()` 重畫後盡量把焦點還給剛才操作的元素，toast 區已經是 `aria-live`（確認既有的 `toast()` 是不是，不是就不用管）。
- 所有使用者輸入輸出到 HTML 前用 `M.esc`。

**文案：** 全部加進 `me/me-data.js` 的 `prac.t`。語氣比照既有文案（平實、短、不催促）。

**Tests（`me/me.test.html`）：** 加一個檢查：`me-practice.js` 的原始碼（用 `fetch('me-practice.js')` 取文字；看檔內其他測試怎麼做非同步，沒有先例就用同步 `XMLHttpRequest`）不含 `進步|退步|加油|連續`，且 `D.prac.t` 的所有字串值也不含這些字。

**Verification:**
1. 測試指令 fail=0。
2. `{}`、`()`、`[]` 成對檢查：`me/me-practice.js` 與 `me/index.html` 的行內 script。
3. `grep -n '<script src="http\|<link[^>]*href="http' me/index.html` 沒有輸出。
4. 有瀏覽器工具（`mcp__Claude_Browser__*`）的話：本機伺服器在 `http://localhost:8765/`。開 `http://localhost:8765/me/?demo#practice`，實際操作：看到兩張卡 → 進太極專區 → 月曆有記號、趨勢圖有長條、切換每週／每月 → 在某一天補記一筆 → 累計數字跟著變 → 寫一份筆記 → 回「今天」用快速鍵記一筆 → 寬度 375 再看一次沒有橫向捲動 → 主控台沒有新的錯誤。再開 `http://localhost:8765/me/#practice`（非示範；這個瀏覽器可能已經登入，**不要登入或登出**）：新增一個項目、記一筆、重新整理後還在；做完用設定裡的刪除把測試項目刪掉。報告裡附一張專區的截圖說明（文字描述即可）。沒有瀏覽器工具就明說。

**Commit:** `feat(me): 我的練習——項目、紀錄、月曆、趨勢圖、心得、筆記`

---

### Task 4: 雲端切換、靈感帶項目、下載、說明

**Files:** Modify `me/me-practice.js`, `me/me-practice.css`, `me/index.html`, `me/me-data.js`, `me/me.test.html`, `me/me-core.js`（只在需要純函式時）

**Consumes:** Task 2 的 `JteCloud.prac*`、`setInspItem`；Task 3 的模組與 `store` 抽象；`index.html` 既有的 `S.user`、`loadCloud()`、auth 回呼。

**要做的事（規格第 5.1、7.4、7.5 節）：**

1. **雲端 `store`**：`load` 用 `JteCloud.pracLoad()`；`put*`／`del*`／`delItem` 對應 `pracPut`／`pracDel`／`pracDelItem`。寫入失敗顯示錯誤、表單留著，**不改存本機**。模組在記憶體裡留一份目前的資料，寫入成功後更新記憶體再重畫，不用每次重讀雲端。
2. **模式判斷**（`setUser(user)` 與 `init` 時）：純函式 `M.pracMode(pref, uid, cloudHas)` → `'local' | 'cloud' | 'ask'`：
   - 沒有 `uid` → `'local'`
   - `pref[uid]==='cloud'` → `'cloud'`；`pref[uid]==='local'` → `'local'`
   - 沒問過：`cloudHas` 為真 → `'cloud'`；否則 `'ask'`
   其中 `pref` 是 `O.prefs.pracCloud`（物件，鍵是 uid）。加測試。
   - 登入後先 `JteCloud.pracHas()`（失敗就當作 `'local'` 並在這次工作階段不再問）。判斷成 `'cloud'` 且沒問過時，把 `pref[uid]='cloud'` 存起來。
   - `'ask'` 時資料仍用本機；只有在本機有至少一個項目時，在 `#pracbox` 最上面顯示詢問卡：說明＋「放到雲端」「留在這台裝置」。
   - 雲端模式而本機 `O.prac` 也有項目（別台裝置選過雲端、這台有本機紀錄）：顯示一張卡「這台裝置上有 N 筆練習紀錄，要一起放進去嗎」＋「放進去」「先不要」（先不要＝這次工作階段不再顯示）。
3. **搬上雲端**：`JteCloud.pracUpload(本機資料)`；`failed===0` 才 `delete O.prac`、`pref[uid]='cloud'`、`save()`、改用雲端 `store`、重新 `load`。有失敗就停下來、本機不動、顯示錯誤（含代碼）與「再試一次」。進行中按鈕停用、顯示「正在放上去…」。
4. **搬回本機**（設定分頁或 `#pracbox` 底部的一行小字入口，雲端模式才有）：再確認一次 → `pracLoad()` → 寫進 `O.prac`、`save()` → `pracWipe()` → `pref[uid]='local'`。`pracWipe` 失敗時本機已經有完整資料，顯示「雲端那一份沒刪乾淨，可以再試」。本機模式且已登入時，同一個位置是「改成放到雲端」。
5. **登出／換帳號**：`setUser(null)` 或 uid 改變時清掉記憶體裡的雲端資料。先前是雲端模式的帳號登出後，`#pracbox` 顯示 `D.prac.t.needLogin`，「今天」的快速鍵隱藏。之後這台裝置沒登入時照常可以用本機模式新增項目（那是另一份本機資料）。
6. **靈感帶項目**（`index.html` 的靈感框）：有至少一個沒封存的項目時，靈感框裡多一個 `<select id="memoitem">`（第一個選項是「不屬於哪個項目」）。`ctx.startPhoto(itemId)` 會預選它。按「留下」時：只有文字的寫進 `O.memos` 帶 `itemId`；有照片的把 `itemId` 傳給 `JteCloud.saveInsp`。留下後選單回到第一個選項。項目清單由 `JtePrac.items()`（新增的介面，回沒封存的 `{id,name}`）提供。
7. **足跡上的小標**：`buildPages` 產生的靈感頁如果有 `itemId`，頁面物件帶 `itemId`；`rowHTML` 在這種頁多顯示一個項目名稱的小標（項目不存在就不顯示）。加測試：`buildPages` 保留 `itemId`。
8. **刪除項目時的靈感**：本機 `O.memos` 用 `pracUnmark`；雲端的靈感（`S.cloud` 裡 `itemId` 相符的）逐筆 `JteCloud.setInspItem(ins, '')`，失敗不擋刪除。
9. **下載我的資料**：`downloadData()` 加 `practice: JtePrac.exportData()`。
10. **資料與公開說明**：`me-data.js` 的 `privacy` 加一段關於練習紀錄的說明，`renderData()` 顯示：本機模式一句（存在這台裝置，清瀏覽器資料或換裝置就沒了，可以先下載）、雲端模式一句（存在練息場的雲端、用你的登入辨認、其他使用者看不到、平台管理者從後台看得到）。**不要改動既有的 `privacy.cloud`／`privacy.now` 文字**（有測試在檢查）。
11. **示範模式**不受以上影響：永遠用示範的 `store`，不顯示詢問卡。

**Tests:** `pracMode` 的五種情況；`buildPages` 保留 `itemId`；`D.privacy` 新增的鍵存在且雲端那一句含「管理者」。

**Verification:** 同 Task 3 的 1–3；瀏覽器：`?demo` 下沒有詢問卡、靈感框有項目選單、選了太極留下一句後在太極專區的心得靈感分頁看得到；主控台沒有新的錯誤。**不要登入、登出、輸入帳密，不要按任何會寫雲端的按鈕**（雲端流程留給真帳號驗證）。

**Commit:** `feat(me): 我的練習——登入後可放雲端、靈感帶項目、下載與說明`

---

### Task 5（控制者自己做）: 整體審查、修正、瀏覽器實測、更新記憶

- 用最強的模型做整個分支（自 `62856bc` 起）的審查，一次派一個修正子代理處理全部發現。
- 內建瀏覽器實測示範模式與本機模式（手機寬度也要）。
- 雲端流程需要先發布新規則到 `lianxichang-me`，要使用者在場；列成待辦，不自己做。
