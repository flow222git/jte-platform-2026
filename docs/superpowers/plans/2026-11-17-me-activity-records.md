# /me 活動紀錄串接 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 參加者登入 `/me` 後，被問要不要把自己參加過的活動紀錄收進手帳；管理者用匯入頁把試算表內容貼進雲端。

**Architecture:** 純邏輯（拆解貼上內容、信箱檢查、欄位白名單、匯入計畫、頁面轉換）放 `me/me-core.js` 並用 `me/me.test.html` 測。雲端讀寫與信箱登入放 `me/me-cloud.js`。`me/index.html` 只負責畫與接線；管理者匯入是獨立頁 `me/admin-import.html`。Firestore 一個集合 `activityRecords/{sessionId}__{email}`，規則用「已驗證的登入信箱等於這一筆的 email」把關。

**Tech Stack:** 無建置的靜態頁、ES5 風格 JS、Firebase compat SDK 9.23.0（已在 `me/vendor/`）、Firebase Auth（Google＋信箱密碼）、Firestore。專案 `lianxichang-me`。

**規格：** `docs/superpowers/specs/2026-11-17-me-activity-records-design.md`

## Global Constraints

- 回覆與文件用繁體中文；頁面文案全部進 `me/me-data.js`，頁內不散寫。不用 emoji。
- 頁面不可有外部絕對網址的 `<script>`。
- **只匯入這些欄位**：Email、前測身體、前測情緒、活動前期待、過程感受、後測身體、後測情緒、最實用日常收穫、心得與回饋。企業、姓名、部門、職級、身心狀態更了解、帶領者專業度與陪伴感、可帶回日常應用收穫、整體滿意度、推薦意願一律不進任何資料結構。
- **參加者的真實資料不進 repo**：測試資料、示範資料、計畫與 commit 訊息只用虛構內容與 `@example.com` 信箱。repo 裡不寫任何人的信箱。
- 前後測**並列顯示**，不算差距、不寫「進步」、不寫因果。
- 示範模式（`?demo`）不登入、不讀寫雲端、不寫 localStorage。
- `/me` 只寫自己的 `jte_me_v1`；活動紀錄不複製到本機。
- 文字欄位上限 2000 字；分數是 1–10 的整數或 `null`；`status` 只有 `pending`／`kept`／`declined`。
- 文件代號 `sessionId + '__' + email`；`sessionId` 格式 `^[0-9]{4}-[0-9]{2}-[0-9]{2}-[a-z0-9-]{1,30}$`；`email` 一律小寫去空白。
- 測試指令（repo 根目錄、Git Bash；`python` 在這台是空殼，一定要用這個直譯器）：
  ```bash
  PYTHONUTF8=1 PYTHONIOENCODING=utf-8 "/c/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe" jte-testrun.py me/me.test.html
  ```
  目前是 `DONE pass=54 fail=0`。
- 新的 `check(...)` 一律插在 `me/me.test.html` 的 `log('---');log('DONE pass='...` 那一行之前。
- commit 訊息結尾：`Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>`。不 push。

## File Structure

| 檔案 | 責任 |
|---|---|
| `me/me-data.js` | 新增 `act`（活動紀錄文案與上限）、`auth`（信箱登入文案）；改 `privacy.cloud` |
| `me/me-core.js` | 新增 `tsvRows`、`actDate`、`actEmail`、`actScore`、`actParse`、`actRecord`、`actDocId`、`actFlags`、`actPlan`、`actLines`、`actPage`；`buildPages` 收第三個參數；`hay` 找得到活動文字 |
| `me/me.test.html` | 上述函式的測試 |
| `me/me-cloud.js` | 信箱註冊／登入／重寄驗證／重設密碼／重新整理登入狀態；`listActs`、`decideAct`、`isAdmin`、`sessionActs`、`writeActs` |
| `firestore.rules` | `admins`、`activityRecords` 兩段（備份；實際發布由 Task 7 做） |
| `me/index.html` | 信箱登入對話框、「今天」的活動卡、體驗足跡的活動頁、下載與示範資料 |
| `me/admin-import.html` | 管理者匯入頁 |

試算表實際版面（2026-11-17 看過，供 Task 2 參考）：最上面每場一列 `活動日期 | 2026/11/05 | 活動照片連結 | https://… | 說明文字`；接著標題列（18 欄，含「姓名」「Email」）；之後每列一位。**沒有任何欄位標示哪一列屬於哪一場**，兩場共用分頁時要在匯入頁手動指定。報名但沒填問卷的列只有姓名與 Email。

---

### Task 1: 資料檔文案與上限

**Files:**
- Modify: `me/me-data.js`（`insp: {…},` 之後；`privacy.cloud`）
- Test: `me/me.test.html`

**Interfaces:**
- Produces: `JTE_ME_DATA.act`、`JTE_ME_DATA.auth`（下列鍵名，後面的 Task 直接取用）

- [ ] **Step 1: 寫會失敗的測試**

```js
check('活動紀錄：文案與上限都在資料檔',()=>{const A=D.act,U=D.auth;
  eq(A.maxText,2000);eq(A.maxTitle,100);eq(A.maxUrl,500);
  eq(A.cols.email,'Email');eq(A.cols.preBody,'前測_身體狀態');eq(A.cols.preMood,'前測_情緒狀態');eq(A.cols.expect,'活動前期待');eq(A.cols.feeling,'過程感受');
  eq(A.cols.postBody,'後測_身體狀態');eq(A.cols.postMood,'後測_情緒狀態');eq(A.cols.takeaway,'最實用日常收穫');eq(A.cols.feedback,'心得與回饋');
  eq(Object.keys(A.cols).length,9,'只有核准的九欄');
  ['ask','keep','decline','later','declineAsk','declineYes','kept','declined','fail','before','after','body','mood','expect','feeling','takeaway','feedback','photo','drop','dropAsk','invite','inviteHide','demoNote','from','cancel'].forEach(k=>ok(A[k],'act.'+k));
  ['missing','format','tld','dup','score','blank'].forEach(k=>ok(A.flags[k],'flags.'+k));
  ['open','title','hint','email','pw','pwNote','signIn','signUp','reset','resetSent','verifyNote','resend','resent','refresh','notYet','close'].forEach(k=>ok(U[k],'auth.'+k));
  ['auth/invalid-credential','auth/email-already-in-use','auth/weak-password','auth/invalid-email','auth/too-many-requests','other'].forEach(k=>ok(U.err[k],'err.'+k));
  ok(D.privacy.cloud.indexOf('活動紀錄')>-1);});
```

- [ ] **Step 2: 跑測試確認失敗**

預期：`FAIL 活動紀錄：文案與上限都在資料檔`，`DONE pass=54 fail=1`。

- [ ] **Step 3: 改資料檔**

在 `me/me-data.js` 的 `insp: { … bad: {…} },` 那一段之後、`back:` 之前加：

```js
    // 活動紀錄：參加者在活動問卷裡填的內容，由管理者匯入，本人登入後自己決定要不要收進手帳。
    // cols 是「只匯入這九欄」的白名單（比對試算表標題列的開頭）；其他欄位在瀏覽器裡就丟掉。上限與 firestore.rules 一致。
    act: { maxText: 2000, maxTitle: 100, maxUrl: 500,
      cols: { email: 'Email', preBody: '前測_身體狀態', preMood: '前測_情緒狀態', expect: '活動前期待', feeling: '過程感受',
        postBody: '後測_身體狀態', postMood: '後測_情緒狀態', takeaway: '最實用日常收穫', feedback: '心得與回饋' },
      tlds: ['tw', 'com', 'net', 'org', 'edu', 'io', 'co', 'jp', 'hk', 'sg', 'us', 'uk', 'cn', 'me', 'app', 'dev'],
      flags: { missing: '沒有信箱', format: '信箱格式不對', tld: '信箱結尾可疑', dup: '同一場重複', score: '分數不在 1–10', blank: '沒有填問卷' },
      ask: '你參加過「{t}」（{d}），要收進手帳嗎？', keep: '收進來', decline: '不用', later: '之後再說',
      declineAsk: '確定不用？雲端這一筆的內容會刪掉。', declineYes: '確定不用', kept: '收進手帳了，在「體驗足跡」', declined: '好，這一筆不收。內容已經從雲端刪掉',
      fail: '沒有成功，請再試一次。', before: '活動前', after: '活動後', body: '身體', mood: '情緒',
      expect: '活動前期待', feeling: '過程感受', takeaway: '最實用日常收穫', feedback: '心得與回饋', photo: '看活動照片',
      drop: '從手帳拿掉', dropAsk: '確定拿掉？雲端這一筆的內容會刪掉，不能復原。', cancel: '取消',
      invite: '參加過練息場的活動？用報名的信箱登入，可以把你當時填的內容收進手帳。', inviteHide: '不用提醒',
      demoNote: '示範模式：這是虛構的活動紀錄，不會儲存。', from: '這是你在活動問卷裡填的內容。' },
    // 登入：Google 之外，可以用信箱加密碼。只有驗證過的信箱對得到活動紀錄。
    auth: { open: '用信箱登入', title: '用信箱登入', hint: '請用報名活動的信箱登入。', email: '信箱', pw: '密碼', pwNote: '至少 6 個字。',
      signIn: '登入', signUp: '第一次用，建立帳號', reset: '忘記密碼', resetSent: '重設密碼的信寄出了，也請看看垃圾信。',
      verifyNote: '驗證信已寄到 {e}，點信裡的連結就完成。也請看看垃圾信。', resend: '重寄驗證信', resent: '驗證信重寄了',
      refresh: '我驗證好了', notYet: '還沒收到驗證。點了信裡的連結之後再按一次。', close: '關閉',
      err: { 'auth/invalid-credential': '信箱或密碼不對。', 'auth/wrong-password': '信箱或密碼不對。', 'auth/user-not-found': '信箱或密碼不對。',
        'auth/email-already-in-use': '這個信箱已經有帳號了，請直接登入。', 'auth/weak-password': '密碼至少要 6 個字。',
        'auth/invalid-email': '信箱格式不對。', 'auth/too-many-requests': '試太多次了，請晚一點再試。', other: '沒有成功，請再試一次。' } },
```

把 `privacy.cloud` 那一行改成：

```js
      cloud: '放了照片的靈感、你收進來的活動紀錄存在練息場的雲端，用你的登入辨認，只有你看得到；活動紀錄是你在活動問卷裡填的內容，由主辦方匯入。其他內容只存在這台裝置。',
```

- [ ] **Step 4: 跑測試確認通過**

預期：`DONE pass=55 fail=0`。（既有測試檢查 `D.privacy.cloud` 含「只有你看得到」，新文案保留了這幾個字。）

- [ ] **Step 5: Commit**

```bash
git add me/me-data.js me/me.test.html
git commit -m "feat(me): 活動紀錄與信箱登入的文案、欄位白名單進資料檔" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

---

### Task 2: 拆解貼上的試算表內容

**Files:**
- Modify: `me/me-core.js`（`fitSize` 之後加函式；最後的 `g.JteMe = {…}` 加匯出）
- Test: `me/me.test.html`

**Interfaces:**
- Consumes: `D.act.cols`、`D.act.tlds`（Task 1）
- Produces:
  - `M.tsvRows(text) -> string[][]`
  - `M.actDate(s) -> 'YYYY-MM-DD' | ''`
  - `M.actEmail(s, tlds) -> { email: string, flags: string[] }`（flags 是 `'missing'|'format'|'tld'`）
  - `M.actScore(v) -> { v: number|null, bad: boolean }`
  - `M.actParse(text, cols, tlds) -> { ok: boolean, sessions: [{date, photoUrl}], rows: [Row] }`
  - `Row = { line: number, email: string, flags: string[], pre: {body, mood}, post: {body, mood}, expect, feeling, takeaway, feedback }`（`flags` 另可含 `'score'`、`'blank'`）

- [ ] **Step 1: 寫會失敗的測試**

```js
const T='\t',ACT_HDR=['企業','姓名','部門','職級','Email','前測_身體狀態 (1-10)','前測_情緒狀態 (1-10)','活動前期待','過程感受','後測_身體狀態 (1-10)','後測_情緒狀態 (1-10)','身心狀態更了解 (1-10)','帶領者專業度與陪伴感 (1-10)','可帶回日常應用收穫 (1-10)','最實用日常收穫','整體滿意度 (1-10)','推薦意願 (1-10)','心得與回饋'].join(T);
const ACT_PASTE=['',['活動日期','2026/11/05','活動照片連結','https://photos.example.com/a','11/05 場次'].join(T),['活動日期','2026/11/06','活動照片連結','https://photos.example.com/b','11/06 場次'].join(T),ACT_HDR,'',
  ['甲公司','王小明','設計','一般員工',' Ming@Example.com ','4','5','想放鬆','"第一行\n第二行，有 ""引號"""','7','8','9','10','9','回家泡茶','10','10','很喜歡'].join(T),
  ['','李小華','','','hua@example.com.te','11','','','','','','','','','','','',''].join(T),
  ['','陳小美','','','mei@example.com','','','','','','','','','','','','',''].join(T),
  ['','林小強','','','','3','3','','還好','','','','','','','','',''].join(T)].join('\r\n');
check('tsvRows：分頁符號、引號裡的換行與雙引號、CRLF',()=>{const r=M.tsvRows('a\tb\r\n"x\ny"\t"他說 ""好"""\nlast');eq(r.length,3);eq(r[0].join('|'),'a|b');eq(r[1][0],'x\ny');eq(r[1][1],'他說 "好"');eq(r[2][0],'last');eq(M.tsvRows('').length,0);eq(M.tsvRows(null).length,0);});
check('actDate：斜線或連字號、補零；看不懂回空字串',()=>{eq(M.actDate('2026/11/05'),'2026-11-05');eq(M.actDate('2026-1-5'),'2026-01-05');eq(M.actDate(' 2026/11/06 '),'2026-11-06');eq(M.actDate('11/05'),'');eq(M.actDate('2026/13/01'),'');eq(M.actDate(''),'');});
check('actEmail：小寫去空白；沒有、格式不對、結尾可疑各有標記',()=>{const L=D.act.tlds;
  eq(M.actEmail(' Ming@Example.com ',L).email,'ming@example.com');eq(M.actEmail('a@b.com.tw',L).flags.length,0);
  eq(M.actEmail('',L).flags.join(),'missing');eq(M.actEmail('abc',L).flags.join(),'format');eq(M.actEmail('a b@c.com',L).flags.join(),'format');
  eq(M.actEmail('a@b.com.te',L).flags.join(),'tld');eq(M.actEmail('a@b.con',L).flags.join(),'tld');});
check('actScore：1–10 的整數；空的不算錯；其他標成不合格',()=>{eq(M.actScore('7').v,7);eq(M.actScore(' 10 ').v,10);eq(M.actScore('').v,null);eq(M.actScore('').bad,false);
  eq(M.actScore('11').bad,true);eq(M.actScore('0').bad,true);eq(M.actScore('7.5').bad,true);eq(M.actScore('很好').bad,true);eq(M.actScore('11').v,null);});
check('actParse：找到場次與標題列，只留核准欄位',()=>{const r=M.actParse(ACT_PASTE,D.act.cols,D.act.tlds);ok(r.ok);
  eq(r.sessions.length,2);eq(r.sessions[0].date,'2026-11-05');eq(r.sessions[0].photoUrl,'https://photos.example.com/a');eq(r.sessions[1].date,'2026-11-06');
  eq(r.rows.length,4);const a=r.rows[0];eq(a.email,'ming@example.com');eq(a.pre.body,4);eq(a.pre.mood,5);eq(a.post.body,7);eq(a.post.mood,8);
  eq(a.expect,'想放鬆');eq(a.feeling,'第一行\n第二行，有 "引號"');eq(a.takeaway,'回家泡茶');eq(a.feedback,'很喜歡');eq(a.flags.length,0);
  eq(Object.keys(a).sort().join(),'email,expect,feedback,feeling,flags,line,post,pre,takeaway');
  const s=JSON.stringify(r);['甲公司','王小明','李小華','設計','一般員工'].forEach(x=>ok(s.indexOf(x)<0,'leak '+x));ok(!/9|10/.test(JSON.stringify(a)),'評分（9、10）不進來');});
check('actParse：可疑的列有標記；沒填問卷的標 blank；沒有標題列回 ok=false',()=>{const r=M.actParse(ACT_PASTE,D.act.cols,D.act.tlds);
  eq(r.rows[1].flags.sort().join(),'score,tld');eq(r.rows[1].pre.body,null);eq(r.rows[2].flags.join(),'blank');eq(r.rows[3].flags.join(),'missing');
  eq(M.actParse('隨便貼的字',D.act.cols,D.act.tlds).ok,false);eq(M.actParse('',D.act.cols,D.act.tlds).rows.length,0);});
```

- [ ] **Step 2: 跑測試確認失敗**

預期：六個新測試 FAIL（`M.tsvRows is not a function` 等），`DONE pass=55 fail=6`。

- [ ] **Step 3: 實作**

在 `me/me-core.js` 的 `fitSize` 函式之後加：

```js
  // ── 活動紀錄：把管理者從試算表貼上的內容拆開。只留白名單欄位，其他在這裡就丟掉。 ──
  // 試算表複製出來是 TSV：欄位用 Tab 分，內容有換行或引號的儲存格會用雙引號包起來。
  function tsvRows(text) {
    var s = String(text == null ? '' : text), rows = [], row = [], cell = '', q = false, i, c;
    if (!s) return rows;
    for (i = 0; i < s.length; i++) {
      c = s.charAt(i);
      if (q) {
        if (c === '"') { if (s.charAt(i + 1) === '"') { cell += '"'; i++; } else q = false; }
        else cell += c;
      } else if (c === '"' && cell === '') q = true;
      else if (c === '\t') { row.push(cell); cell = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && s.charAt(i + 1) === '\n') i++;
        row.push(cell); cell = ''; rows.push(row); row = [];
      } else cell += c;
    }
    if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
    return rows;
  }
  function actDate(s) {
    var m = /^\s*(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})\s*$/.exec(String(s == null ? '' : s));
    if (!m || +m[2] < 1 || +m[2] > 12 || +m[3] < 1 || +m[3] > 31) return '';
    return m[1] + '-' + pad(+m[2]) + '-' + pad(+m[3]);
  }
  function actEmail(s, tlds) {
    var e = String(s == null ? '' : s).trim().toLowerCase();
    if (!e) return { email: '', flags: ['missing'] };
    if (!/^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(e)) return { email: e, flags: ['format'] };
    return { email: e, flags: arr(tlds).indexOf(e.slice(e.lastIndexOf('.') + 1)) < 0 ? ['tld'] : [] };
  }
  function actScore(v) {
    var s = String(v == null ? '' : v).trim();
    if (!s) return { v: null, bad: false };
    var n = /^\d{1,2}$/.test(s) ? +s : NaN;
    return n >= 1 && n <= 10 ? { v: n, bad: false } : { v: null, bad: true };
  }
  function actParse(text, cols, tlds) {
    var rows = tsvRows(text), sessions = [], out = [], hi = -1, idx = {}, i, r;
    function cellOf(row, k) { return idx[k] == null ? '' : String(row[idx[k]] == null ? '' : row[idx[k]]).trim(); }
    for (i = 0; i < rows.length; i++) {
      r = rows[i].map(function (x) { return String(x).trim(); });
      if (r.indexOf('Email') > -1 && r.indexOf('姓名') > -1) { hi = i; break; }
      var di = r.indexOf('活動日期'), pi = r.indexOf('活動照片連結');
      if (di > -1 && actDate(r[di + 1])) sessions.push({ date: actDate(r[di + 1]), photoUrl: pi > -1 ? safeUrl(r[pi + 1]) : '' });
    }
    if (hi < 0) return { ok: false, sessions: sessions, rows: [] };
    rows[hi].forEach(function (h, j) {
      h = String(h).trim();
      Object.keys(cols).forEach(function (k) { if (idx[k] == null && h.indexOf(cols[k]) === 0) idx[k] = j; });
    });
    for (i = hi + 1; i < rows.length; i++) {
      r = rows[i];
      if (!r.some(function (x) { return String(x).trim(); })) continue;
      var e = actEmail(cellOf(r, 'email'), tlds), flags = e.flags.slice(), bad = false, any = false;
      var sc = {}; ['preBody', 'preMood', 'postBody', 'postMood'].forEach(function (k) { var x = actScore(cellOf(r, k)); sc[k] = x.v; if (x.bad) bad = true; if (x.v !== null) any = true; });
      var tx = {}; ['expect', 'feeling', 'takeaway', 'feedback'].forEach(function (k) { tx[k] = cellOf(r, k); if (tx[k]) any = true; });
      if (bad) flags.push('score');
      if (!any && !bad && e.email) flags = ['blank'];
      out.push({ line: i + 1, email: e.email, flags: flags, pre: { body: sc.preBody, mood: sc.preMood }, post: { body: sc.postBody, mood: sc.postMood },
        expect: tx.expect, feeling: tx.feeling, takeaway: tx.takeaway, feedback: tx.feedback });
    }
    return { ok: true, sessions: sessions, rows: out };
  }
```

在檔案最後 `g.JteMe = { … inspCheck: inspCheck, fitSize: fitSize };` 的 `fitSize: fitSize` 後面加：

```js
, tsvRows: tsvRows, actDate: actDate, actEmail: actEmail, actScore: actScore, actParse: actParse
```

- [ ] **Step 4: 跑測試確認通過**

預期：`DONE pass=61 fail=0`。

- [ ] **Step 5: Commit**

```bash
git add me/me-core.js me/me.test.html
git commit -m "feat(me): 拆解貼上的活動試算表，只留核准欄位" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

---

### Task 3: 一列轉成紀錄、匯入計畫、頁面轉換

**Files:**
- Modify: `me/me-core.js`
- Test: `me/me.test.html`

**Interfaces:**
- Consumes: Task 2 的 `Row`；`D.act`
- Produces:
  - `M.actSessionOk(id) -> boolean`
  - `M.actDocId(sessionId, email) -> string`
  - `M.actRecord(row, ses, lim) -> Rec`，`ses = { sessionId, title, date, photoUrl }`，`lim = D.act`
  - `Rec = { email, sessionId, title, date, photoUrl, pre:{body,mood}, post:{body,mood}, expect, feeling, takeaway, feedback }`（沒有 `status`，寫入時才加）
  - `M.actDups(items) -> number[]`，`items = [{ sessionId, email }]`，回傳重複者（第二次以後）的索引
  - `M.actPlan(recs, existing) -> { writes: [{ id, data, isNew }], added, updated, skipped }`，`existing = { [docId]: { status } }`
  - `M.actLines(a, L) -> string[]`（`L = D.act`）
  - `M.actPage(a) -> page | null`，`a = Rec + { docId, status }`
  - `M.buildPages(daily, memos, acts)`：第三個參數是活動紀錄陣列，只有 `status === 'kept'` 的成為頁面

- [ ] **Step 1: 寫會失敗的測試**

```js
const SES={sessionId:'2026-11-05-tea',title:'茶席體驗',date:'2026-11-05',photoUrl:'https://photos.example.com/a'};
const AROW={line:6,email:'ming@example.com',flags:[],pre:{body:4,mood:5},post:{body:7,mood:8},expect:'想放鬆',feeling:'很安靜',takeaway:'回家泡茶',feedback:'很喜歡'};
check('場次代號與文件代號',()=>{ok(M.actSessionOk('2026-11-05-tea'));ok(!M.actSessionOk('2026-11-05'));ok(!M.actSessionOk('2026-11-05-茶席'));ok(!M.actSessionOk('2026-11-05-Tea'));ok(!M.actSessionOk(''));
  eq(M.actDocId('2026-11-05-tea','ming@example.com'),'2026-11-05-tea__ming@example.com');});
check('actRecord：只有核准欄位、文字截到上限、連結只收 http(s)',()=>{const r=M.actRecord(AROW,SES,D.act);
  eq(Object.keys(r).sort().join(),'date,email,expect,feedback,feeling,photoUrl,post,pre,sessionId,takeaway,title');
  eq(r.email,'ming@example.com');eq(r.title,'茶席體驗');eq(r.pre.body,4);eq(r.post.mood,8);eq(r.photoUrl,'https://photos.example.com/a');
  const big=M.actRecord(Object.assign({},AROW,{feedback:'x'.repeat(2500)}),Object.assign({},SES,{photoUrl:'javascript:alert(1)',title:'y'.repeat(150)}),D.act);
  eq(big.feedback.length,2000);eq(big.photoUrl,'');eq(big.title.length,100);});
check('actDups：同一場同一個信箱，第二次以後算重複',()=>{eq(M.actDups([{sessionId:'s1',email:'a@example.com'},{sessionId:'s2',email:'a@example.com'},{sessionId:'s1',email:'a@example.com'},{sessionId:'s1',email:'b@example.com'}]).join(),'2');eq(M.actDups([]).length,0);});
check('actPlan：新的是 pending、已有的保留狀態、選了不用的跳過',()=>{const mk=e=>M.actRecord(Object.assign({},AROW,{email:e}),SES,D.act);
  const p=M.actPlan([mk('new@example.com'),mk('kept@example.com'),mk('no@example.com')],{'2026-11-05-tea__kept@example.com':{status:'kept'},'2026-11-05-tea__no@example.com':{status:'declined'}});
  eq(p.added,1);eq(p.updated,1);eq(p.skipped,1);eq(p.writes.length,2);
  eq(p.writes[0].id,'2026-11-05-tea__new@example.com');eq(p.writes[0].data.status,'pending');ok(p.writes[0].isNew);
  eq(p.writes[1].data.status,'kept');ok(!p.writes[1].isNew);eq(p.writes[1].data.feeling,'很安靜');});
check('actLines：前後測並列，不算差距；沒有的那一項不寫',()=>{const L=D.act;
  eq(M.actLines({pre:{body:6,mood:5},post:{body:8,mood:7}},L).join('|'),'活動前　身體 6　情緒 5|活動後　身體 8　情緒 7');
  eq(M.actLines({pre:{body:6,mood:null},post:{body:null,mood:null}},L).join('|'),'活動前　身體 6');eq(M.actLines({},L).length,0);
  const s=M.actLines({pre:{body:6,mood:5},post:{body:8,mood:7}},L).join('');ok(!/[+＋]|進步|提升|差/.test(s),'不捏因果');});
check('buildPages：收進來的活動紀錄成為一頁；還沒決定與不用的不出現',()=>{const base=Object.assign({},M.actRecord(AROW,SES,D.act));
  const acts=[Object.assign({},base,{docId:'d1',status:'kept'}),Object.assign({},base,{docId:'d2',status:'pending'}),{docId:'d3',email:'x@example.com',sessionId:'s',status:'declined'}];
  const ps=M.buildPages({},[],acts);eq(ps.length,1);const p=ps[0];eq(p.id,'act-d1');eq(p.src,'Act');eq(p.kind,'活動');eq(p.title,'茶席體驗');eq(p.key,'2026-11-05');
  eq(p.link,'https://photos.example.com/a');eq(p.tool,'');eq(p.act.feeling,'很安靜');eq(p.act.pre.body,4);eq(p.photos.length,0);
  eq(M.buildPages({},[]).length,0,'第三個參數可以不給');eq(M.actPage({docId:'d',status:'kept',date:'亂寫'}),null);});
check('活動紀錄：搜尋找得到自己寫的話；方法視角收在「活動」；練習頁列為平台以外的方法',()=>{const ps=M.buildPages({},[],[Object.assign({},M.actRecord(AROW,SES,D.act),{docId:'d1',status:'kept'})]);
  eq(M.searchPages(ps,'回家泡茶',{},{}).length,1);eq(M.searchPages(ps,'茶席 安靜',{},{}).length,1);eq(M.searchPages(ps,'爬山',{},{}).length,0);
  eq(M.lensGroups('to',ps,{})[0].k,'活動');eq(M.practiceView(ps,{}).outside[0].name,'茶席體驗');});
```

- [ ] **Step 2: 跑測試確認失敗**

預期：七個新測試 FAIL，`DONE pass=61 fail=7`。

- [ ] **Step 3: 實作**

在 `me/me-core.js` 的 `actParse` 之後加：

```js
  function actSessionOk(id) { return /^\d{4}-\d{2}-\d{2}-[a-z0-9-]{1,30}$/.test(String(id || '')); }
  function actDocId(sessionId, email) { return String(sessionId) + '__' + String(email); }
  function cut(s, n) { return String(s == null ? '' : s).trim().slice(0, n); }
  function sc2(o) { o = o || {}; return { body: o.body == null ? null : o.body, mood: o.mood == null ? null : o.mood }; }
  // 一列＋場次 → 一筆要寫進雲端的紀錄。這裡列出的就是全部欄位，沒有別的。
  function actRecord(row, ses, lim) {
    return { email: String(row.email || ''), sessionId: String(ses.sessionId || ''), title: cut(ses.title, lim.maxTitle), date: String(ses.date || ''),
      photoUrl: safeUrl(ses.photoUrl).slice(0, lim.maxUrl), pre: sc2(row.pre), post: sc2(row.post),
      expect: cut(row.expect, lim.maxText), feeling: cut(row.feeling, lim.maxText), takeaway: cut(row.takeaway, lim.maxText), feedback: cut(row.feedback, lim.maxText) };
  }
  function actDups(items) {
    var seen = {}, out = [];
    arr(items).forEach(function (x, i) { var k = actDocId(x.sessionId, x.email); if (seen[k]) out.push(i); else seen[k] = 1; });
    return out;
  }
  // 匯入計畫：選了「不用」的跳過（不覆寫）；已有的保留原本的狀態；新的是 pending。
  function actPlan(recs, existing) {
    var writes = [], added = 0, updated = 0, skipped = 0;
    arr(recs).forEach(function (r) {
      var id = actDocId(r.sessionId, r.email), old = (existing || {})[id], data = {}, k;
      if (old && old.status === 'declined') { skipped++; return; }
      for (k in r) if (Object.prototype.hasOwnProperty.call(r, k)) data[k] = r[k];
      data.status = old ? (old.status || 'pending') : 'pending';
      if (old) updated++; else added++;
      writes.push({ id: id, data: data, isNew: !old });
    });
    return { writes: writes, added: added, updated: updated, skipped: skipped };
  }
  // 前後測並列：只把數字排在一起，不算差距、不解讀。
  function actLines(a, L) {
    function one(lab, o) {
      o = o || {};
      var p = [o.body != null && L.body + ' ' + o.body, o.mood != null && L.mood + ' ' + o.mood].filter(Boolean);
      return p.length ? lab + '　' + p.join('　') : '';
    }
    return [one(L.before, a && a.pre), one(L.after, a && a.post)].filter(Boolean);
  }
  function actPage(a) {
    if (!a || a.status !== 'kept' || !/^\d{4}-\d{2}-\d{2}$/.test(String(a.date || ''))) return null;
    var title = String(a.title || '活動');
    return { id: 'act-' + a.docId, key: a.date, src: 'Act', kind: '活動', title: title, label: title, doodle: 'mount', tool: '',
      text: String(a.feedback || a.takeaway || a.feeling || a.expect || '').slice(0, 40), sub: '', note: '', meta: [], feel: [], big: null,
      link: safeUrl(a.photoUrl), photos: [],
      act: { pre: sc2(a.pre), post: sc2(a.post), expect: String(a.expect || ''), feeling: String(a.feeling || ''), takeaway: String(a.takeaway || ''), feedback: String(a.feedback || '') } };
  }
```

改 `buildPages`：簽名改成 `function buildPages(daily, memos, acts) {`，並在 `ps.sort(` 那一行之前加：

```js
    arr(acts).forEach(function (a) { var p = actPage(a); if (p) ps.push(p); });
```

改 `hay`：在 `arr(p.photos).map(function (x) { return x && x.caption; })` 後面接上活動文字，整個函式變成：

```js
  function hay(p, a, t) {
    var j = (t && t.join) || {}, c = p.act || {};
    return [p.title, p.text, p.sub, p.note, p.label, p.kind].concat(arr(p.feel), arr(a && a.tags),
      arr(a && a.notes).map(function (n) { return n && n.text; }), [j.text, t && t.found], arr(t && t.why),
      arr(p.photos).map(function (x) { return x && x.caption; }), [c.expect, c.feeling, c.takeaway, c.feedback])
      .filter(Boolean).join('\n').toLowerCase();
  }
```

匯出加上：

```js
, actSessionOk: actSessionOk, actDocId: actDocId, actRecord: actRecord, actDups: actDups, actPlan: actPlan, actLines: actLines, actPage: actPage
```

- [ ] **Step 4: 跑測試確認通過**

預期：`DONE pass=68 fail=0`。

- [ ] **Step 5: Commit**

```bash
git add me/me-core.js me/me.test.html
git commit -m "feat(me): 活動紀錄轉成頁面、匯入計畫、前後測並列" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

---

### Task 4: 雲端層與安全規則

**Files:**
- Modify: `me/me-cloud.js`
- Modify: `firestore.rules`

**Interfaces:**
- Consumes: `JteMe.actDocId`、`JteMe.actPlan`
- Produces（`window.JteCloud` 新增）：
  - `user` 物件多兩個欄位：`verified: boolean`、`byPassword: boolean`
  - `signUpEmail(email, pw) -> Promise`（建立帳號並寄驗證信）
  - `signInEmail(email, pw) -> Promise`
  - `resendVerify() -> Promise`
  - `resetPw(email) -> Promise`
  - `refreshUser() -> Promise<user>`（重新讀驗證狀態與權杖，並再呼叫一次 `onUser`）
  - `listActs() -> Promise<Act[]>`，`Act = 文件內容 + { docId }`；沒登入或信箱沒驗證回 `[]`
  - `decideAct(act, status) -> Promise<Act>`，`status` 是 `'kept'|'pending'|'declined'`
  - `isAdmin() -> Promise<boolean>`
  - `sessionActs(sessionId) -> Promise<{ [docId]: { status } }>`（管理者）
  - `writeActs(writes) -> Promise<{ ok: number, failed: number }>`，`writes` 是 `actPlan().writes`

這一層依賴 Firebase，不進自動測試；Task 7 手動驗證。

- [ ] **Step 1: 改 `me/me-cloud.js`**

把 `var auth = null, db = null, user = null;` 改成：

```js
  var auth = null, db = null, user = null, onU = null;
  function shape(u) {
    return u ? { uid: u.uid, email: (u.email || '').toLowerCase(), name: u.displayName || u.email || '', verified: !!u.emailVerified,
      byPassword: (u.providerData || []).some(function (p) { return p && p.providerId === 'password'; }) } : null;
  }
```

把 `init` 裡的 `auth.onAuthStateChanged(...)` 整段改成：

```js
    onU = onUser;
    auth.onAuthStateChanged(function (u) { user = shape(u); onUser(user); });
```

在 `function signOut()` 之後加：

```js
  // 信箱＋密碼。建立帳號後寄驗證信；只有驗證過的信箱對得到活動紀錄。
  function signUpEmail(email, pw) {
    return auth.createUserWithEmailAndPassword(String(email).trim(), pw).then(function (c) { return c.user.sendEmailVerification(); });
  }
  function signInEmail(email, pw) { return auth.signInWithEmailAndPassword(String(email).trim(), pw); }
  function resendVerify() { if (!auth.currentUser) return Promise.reject(new Error('not-signed-in')); return auth.currentUser.sendEmailVerification(); }
  function resetPw(email) { return auth.sendPasswordResetEmail(String(email).trim()); }
  // 點了驗證信之後，要重新讀一次帳號並換新的權杖，規則才看得到「已驗證」。
  function refreshUser() {
    var u = auth.currentUser;
    if (!u) return Promise.resolve(null);
    return u.reload().then(function () { return auth.currentUser.getIdToken(true); }).then(function () {
      user = shape(auth.currentUser); if (onU) onU(user); return user;
    });
  }
```

在 `wipeAll` 之後加：

```js
  // ── 活動紀錄：activityRecords/{sessionId}__{email}。本人只讀得到 email 等於自己已驗證信箱的那幾筆。 ──
  function acts() { return db.collection('activityRecords'); }
  function listActs() {
    if (!user || !user.verified || !user.email) return Promise.resolve([]);
    return acts().where('email', '==', user.email).get().then(function (s) {
      var out = []; s.forEach(function (d) { var x = d.data(); x.docId = d.id; out.push(x); }); return out;
    });
  }
  function decideAct(act, status) {
    need();
    var now = g.firebase.firestore.FieldValue.serverTimestamp(), ref = acts().doc(act.docId);
    if (status === 'declined') {
      // 選「不用」：整筆改寫成只剩記號，內容欄位全部移除。
      return ref.set({ email: act.email, sessionId: act.sessionId, status: 'declined', decidedAt: now })
        .then(function () { return { docId: act.docId, email: act.email, sessionId: act.sessionId, status: 'declined' }; });
    }
    return ref.update({ status: status, decidedAt: now }).then(function () { act.status = status; return act; });
  }
  function isAdmin() {
    if (!user) return Promise.resolve(false);
    return db.collection('admins').doc(user.uid).get().then(function (d) { return d.exists; }, function () { return false; });
  }
  function sessionActs(sessionId) {
    need();
    return acts().where('sessionId', '==', sessionId).get().then(function (s) {
      var m = {}; s.forEach(function (d) { m[d.id] = { status: d.data().status || 'pending' }; }); return m;
    });
  }
  function writeActs(writes) {
    need();
    var now = g.firebase.firestore.FieldValue.serverTimestamp(), jobs = [], i;
    function run(part) {
      var b = db.batch();
      part.forEach(function (w) {
        var data = {}, k; for (k in w.data) if (Object.prototype.hasOwnProperty.call(w.data, k)) data[k] = w.data[k];
        data.importedAt = now;
        if (w.isNew) b.set(acts().doc(w.id), data); else b.set(acts().doc(w.id), data, { merge: true });
      });
      return b.commit().then(function () { return { ok: part.length, failed: 0 }; }, function () { return { ok: 0, failed: part.length }; });
    }
    for (i = 0; i < writes.length; i += 200) jobs.push(run(writes.slice(i, i + 200)));
    return Promise.all(jobs).then(function (rs) {
      return rs.reduce(function (a, r) { return { ok: a.ok + r.ok, failed: a.failed + r.failed }; }, { ok: 0, failed: 0 });
    });
  }
```

把最後的 `g.JteCloud = {…}` 改成：

```js
  g.JteCloud = { init: init, signIn: signIn, signOut: signOut, compress: compress, listInsp: listInsp,
    saveInsp: saveInsp, deletePhoto: deletePhoto, deleteInsp: deleteInsp, wipeAll: wipeAll,
    signUpEmail: signUpEmail, signInEmail: signInEmail, resendVerify: resendVerify, resetPw: resetPw, refreshUser: refreshUser,
    listActs: listActs, decideAct: decideAct, isAdmin: isAdmin, sessionActs: sessionActs, writeActs: writeActs };
```

檔頭註解第二行後面加一行：

```js
 * 活動紀錄在 activityRecords/{sessionId}__{email}：管理者匯入，本人（信箱已驗證）只讀得到自己的，並決定收不收。
```

- [ ] **Step 2: 改 `firestore.rules`**

在 `match /users/{uid}/photos/{id} { … }` 那一段之後、`// 其餘一律禁止` 之前加：

```
    // ── /me 活動紀錄（發布在專案 lianxichang-me）──
    // 管理者：admins/{uid} 有這一筆的帳號。這一筆由專案擁有者在 Console 手動建立，用戶端不能寫。
    function isAdmin() {
      return request.auth != null && exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }
    function myVerifiedEmail() {
      return request.auth != null && request.auth.token.email_verified == true ? request.auth.token.email : null;
    }
    function scoreOk(m) {
      return m is map && m.keys().hasOnly(['body', 'mood'])
        && (m.body == null || (m.body is int && m.body >= 1 && m.body <= 10))
        && (m.mood == null || (m.mood is int && m.mood >= 1 && m.mood <= 10));
    }
    // 上限與 me/me-data.js 的 act 一致。欄位清單就是全部：沒有姓名、企業、部門、職級，也沒有給主辦方的評分。
    function actOk(d, id) {
      return d.keys().hasOnly(['email', 'sessionId', 'title', 'date', 'photoUrl', 'pre', 'post', 'expect', 'feeling', 'takeaway', 'feedback', 'status', 'importedAt', 'decidedAt'])
        && d.email is string && d.email.size() <= 200 && d.email == d.email.lower()
        && d.sessionId is string && d.sessionId.matches('^[0-9]{4}-[0-9]{2}-[0-9]{2}-[a-z0-9-]{1,30}$')
        && id == d.sessionId + '__' + d.email
        && d.title is string && d.title.size() <= 100
        && d.date is string && d.date.matches('^[0-9]{4}-[0-9]{2}-[0-9]{2}$')
        && d.photoUrl is string && d.photoUrl.size() <= 500
        && scoreOk(d.pre) && scoreOk(d.post)
        && d.expect is string && d.expect.size() <= 2000
        && d.feeling is string && d.feeling.size() <= 2000
        && d.takeaway is string && d.takeaway.size() <= 2000
        && d.feedback is string && d.feedback.size() <= 2000;
    }
    match /admins/{uid} {
      allow get: if request.auth != null && request.auth.uid == uid;
      allow list, write: if false;
    }
    match /activityRecords/{id} {
      allow read: if isAdmin() || (myVerifiedEmail() != null && resource.data.email == myVerifiedEmail());
      // 管理者：新增一律是 pending；更新不能動本人的決定，也不能覆寫本人選了「不用」的那一筆。
      allow create: if isAdmin() && actOk(request.resource.data, id) && request.resource.data.status == 'pending';
      allow update: if (isAdmin() && actOk(request.resource.data, id)
                        && resource.data.status != 'declined' && request.resource.data.status == resource.data.status)
        // 本人：收進來／之後再說，只動 status 與 decidedAt
        || (myVerifiedEmail() != null && resource.data.email == myVerifiedEmail() && resource.data.status != 'declined'
            && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status', 'decidedAt'])
            && request.resource.data.status in ['kept', 'pending'])
        // 本人：不用 → 整筆只剩記號，內容全部移除
        || (myVerifiedEmail() != null && resource.data.email == myVerifiedEmail()
            && request.resource.data.keys().hasOnly(['email', 'sessionId', 'status', 'decidedAt'])
            && request.resource.data.email == resource.data.email && request.resource.data.sessionId == resource.data.sessionId
            && request.resource.data.status == 'declined');
      allow delete: if isAdmin();
    }

```

檔頭註解在「3. /me 靈感區…」那一項後面加一行：

```
//   4. /me 活動紀錄：activityRecords/{sessionId}__{email}、admins/{uid}，同樣只發布在 lianxichang-me。
```

- [ ] **Step 3: 檢查語法與既有測試**

```bash
"/c/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe" -c "import re,sys;s=open('firestore.rules',encoding='utf-8').read();print('braces',s.count('{')-s.count('}'),'parens',s.count('(')-s.count(')'))"
```

預期：`braces 0 parens 0`。再跑測試指令，預期仍是 `DONE pass=68 fail=0`。

在瀏覽器載入 `http://localhost:8765/me/?demo`，主控台不能有 `me-cloud.js` 的語法錯誤（示範模式不會呼叫雲端，但檔案會被解析）。

- [ ] **Step 4: Commit**

```bash
git add me/me-cloud.js firestore.rules
git commit -m "feat(me): 信箱登入與活動紀錄的雲端讀寫、安全規則" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

---

### Task 5: `/me` 頁面：信箱登入、活動卡、體驗足跡

**Files:**
- Modify: `me/index.html`

**Interfaces:**
- Consumes: `D.act`、`D.auth`（Task 1）；`M.actLines`、`M.buildPages(daily, memos, acts)`（Task 3）；`JteCloud.signUpEmail/signInEmail/resendVerify/resetPw/refreshUser/listActs/decideAct`、`user.verified`（Task 4）
- Produces: 頁面行為；`window.__me.S.acts` 供手動檢查

以下的「找到」都是用文字搜尋定位，不靠行號。

- [ ] **Step 1: 樣式**

在 `<style>` 裡 `dialog.zoom p{…}` 那一行之後加：

```css
.actbox{background:var(--blue-pale);border-color:transparent;box-shadow:none;margin:14px 0 4px;display:grid;gap:12px}
.actbox .acard{display:grid;gap:8px}
.actbox .acard+.acard{border-top:1px solid var(--line);padding-top:12px}
.actv{display:grid;gap:8px;margin:6px 0}
.actv p{white-space:pre-wrap}
.actv small{display:block;font-size:12px;font-weight:700;color:var(--ink-3)}
dialog.authdlg{border:1px solid var(--line);border-radius:var(--r-lg);padding:24px;max-width:min(92vw,400px);width:100%;background:var(--bg);color:inherit}
dialog.authdlg::backdrop{background:rgba(3,38,57,.5)}
dialog.authdlg form{display:grid;gap:10px}
dialog.authdlg .in{width:100%}
```

- [ ] **Step 2: HTML**

找到 `<div class="panel just" id="just" hidden></div>`，在它之後加一行：

```html
    <div class="panel actbox" id="actbox" hidden></div>
```

找到 `<dialog class="zoom" id="zoom">…</dialog>`，在它之後加：

```html
<dialog class="authdlg" id="authdlg" aria-labelledby="authttl"><form method="dialog" id="authform">
  <h2 id="authttl" style="font-size:20px"></h2><p class="note" id="authhint"></p>
  <label class="note" for="authmail" id="authmaill"></label><input class="in" id="authmail" type="email" autocomplete="email" maxlength="200">
  <label class="note" for="authpw" id="authpwl"></label><input class="in" id="authpw" type="password" autocomplete="current-password" maxlength="100">
  <p class="note" id="authpwn"></p><p class="note" id="autherr" role="alert"></p>
  <div class="row"><button class="btn fill" type="button" id="authin"></button><button class="btn" type="button" id="authup"></button></div>
  <div class="row"><button class="lnk" type="button" id="authreset"></button><button class="lnk" id="authclose"></button></div>
</form></dialog>
```

- [ ] **Step 3: 狀態與短名**

找到 `var S={pages:[],…,cwipe:false};`，把結尾的 `cwipe:false}` 改成：

```js
cwipe:false,acts:[],actLater:{},actAsk:null}
```

找到定義 `I` 的地方（`var I=D.insp` 或同一行內的 `I=D.insp`；用 `grep -n "I=D.insp" me/index.html` 找），在同一個 `var` 敘述後面加一行：

```js
var A=D.act,U=D.auth;
```

- [ ] **Step 4: 示範資料、登入列、活動卡**

找到 `function demoInsp(){…}` 那一行，在它之後加：

```js
function demoActs(){function mk(id,n,t,st){return {docId:id,email:'demo@example.com',sessionId:rel(n)+'-demo',title:t,date:rel(n),photoUrl:'',status:st,pre:{body:4,mood:5},post:{body:7,mood:7},expect:'想讓自己慢下來。',feeling:'茶湯入口的時候，肩膀自己鬆了。',takeaway:'每天下午泡一杯茶，先聞再喝。',feedback:'很久沒有這樣只做一件事。'}}
  return [mk('demo-a',6,'茶席體驗（示範）','pending'),mk('demo-b',20,'聲波放鬆（示範）','kept')]}
function authErr(e){var c=e&&e.code;return U.err[c]||U.err.other}
function openAuth(){$('#authttl').textContent=U.title;$('#authhint').textContent=U.hint;$('#authmaill').textContent=U.email;$('#authpwl').textContent=U.pw;$('#authpwn').textContent=U.pwNote;$('#authin').textContent=U.signIn;$('#authup').textContent=U.signUp;$('#authreset').textContent=U.reset;$('#authclose').textContent=U.close;$('#autherr').textContent='';$('#authpw').value='';$('#authdlg').showModal();$('#authmail').focus()}
function authDo(kind){var em=$('#authmail').value.trim(),pw=$('#authpw').value,er=$('#autherr');er.textContent='';
  if(!em){$('#authmail').focus();return}
  if(kind==='reset'){JteCloud.resetPw(em).then(function(){er.textContent=U.resetSent},function(e){er.textContent=authErr(e)});return}
  if(!pw){$('#authpw').focus();return}
  (kind==='up'?JteCloud.signUpEmail(em,pw):JteCloud.signInEmail(em,pw)).then(function(){$('#authdlg').close()},function(e){er.textContent=authErr(e)})}
function pendingActs(){return S.acts.filter(function(a){return a.status==='pending'&&!S.actLater[a.docId]})}
function renderActs(){var el=$('#actbox'),h='';
  if(!DEMO&&S.cloudOk&&!S.user&&O.prefs.actHint!==false)h='<p>'+esc(A.invite)+'</p><div class="row"><button class="btn sm fill" data-aa="google">'+I.signIn+'</button><button class="btn sm" data-aa="email">'+U.open+'</button><button class="lnk" data-aa="hide">'+A.inviteHide+'</button></div>';
  else if(!DEMO&&S.user&&!S.user.verified)h='<p>'+esc(U.verifyNote.replace('{e}',S.user.email))+'</p><div class="row"><button class="btn sm fill" data-aa="refresh">'+U.refresh+'</button><button class="lnk" data-aa="resend">'+U.resend+'</button><button class="lnk" data-aa="signout">'+I.signOut+'</button></div>';
  else h=pendingActs().map(function(a){var ask=S.actAsk===a.docId;return '<div class="acard" data-d="'+esc(a.docId)+'"><p><b>'+esc(A.ask.replace('{t}',a.title||'活動').replace('{d}',M.dlabel(a.date)))+'</b></p><p class="note">'+(DEMO?A.demoNote:A.from)+'</p>'+
    (ask?'<div class="row"><span class="note">'+A.declineAsk+'</span><button class="btn sm fill" data-aa="no2">'+A.declineYes+'</button><button class="lnk" data-aa="cancel">'+A.cancel+'</button></div>':'<div class="row"><button class="btn sm fill" data-aa="keep">'+A.keep+'</button><button class="btn sm" data-aa="no">'+A.decline+'</button><button class="lnk" data-aa="later">'+A.later+'</button></div>')+'</div>'}).join('');
  el.hidden=!h;el.innerHTML=h}
function setAct(a,status){return Promise.resolve().then(function(){if(DEMO){if(status==='declined')return {docId:a.docId,email:a.email,sessionId:a.sessionId,status:'declined'};a.status=status;return a}return JteCloud.decideAct(a,status)}).then(function(r){var i=S.acts.indexOf(a);if(i>-1)S.acts[i]=r;return r})}
```

把 `renderAuth` 最後一行（`a.innerHTML=S.user?…:…}`）改成（多了信箱登入的入口，以及未驗證時不重複顯示名稱以外的東西）：

```js
  a.innerHTML=S.user?esc(I.signedIn.replace('{n}',S.user.name))+' <button class="lnk" id="signout">'+I.signOut+'</button>':esc(I.needLogin)+' <button class="lnk pri" id="signin">'+I.signIn+'</button> <button class="lnk" id="emailin">'+U.open+'</button>'}
```

找到 `$('#authline').onclick=function(e){…}`，在函式本體最後（`if(e.target.id==='signout')JteCloud.signOut()` 之後、`}` 之前）加：

```js
;if(e.target.id==='emailin')openAuth()
```

- [ ] **Step 5: 讀雲端、畫頁面**

把 `loadCloud` 整個函式改成：

```js
function loadCloud(){if(!S.user||!window.JteCloud){S.cloud=[];S.acts=[];renderAll();return}
  var uid=S.user.uid;
  JteCloud.listInsp().then(function(l){if(!(S.user&&S.user.uid===uid))return;var ids={};l.forEach(function(x){ids[x.id]=1});S.cloud=S.cloud.filter(function(x){return !ids[x.id]}).concat(l);renderAll()}).catch(function(){if(S.user&&S.user.uid===uid)toast(I.offline)});
  JteCloud.listActs().then(function(l){if(!(S.user&&S.user.uid===uid))return;S.acts=l;renderAll()}).catch(function(){})}
```

在 `renderAll` 裡：

- `S.pages=M.buildPages(daily,O.memos.concat(S.cloud));` 改成 `S.pages=M.buildPages(daily,O.memos.concat(S.cloud),S.acts);`
- `renderJust();renderWelcome();` 改成 `renderJust();renderActs();renderWelcome();`

在 `rowHTML` 裡：

- 找到 `if(p.link)h+='<p class="note"><a href="'+esc(p.link)+'" target="_blank" rel="noopener">看活動照片</a></p>';`，在它**之前**加：

```js
  if(p.act){var al=M.actLines(p.act,A);h+='<div class="actv">'+al.map(function(x){return '<p>'+esc(x)+'</p>'}).join('')+['expect','feeling','takeaway','feedback'].map(function(k){return p.act[k]?'<p><small>'+A[k]+'</small>'+esc(p.act[k])+'</p>':''}).join('')+'<p class="note">'+A.from+'</p></div>'}
```

- 找到 `(S.cloud.some(function(c){return c.id===p.id})?'<button class="lnk" data-act="delins">'+I.delIns+'</button>':'')+'</div>';`，把 `+'</div>';` 之前接上：

```js
+(p.src==='Act'?'<button class="lnk" data-act="actdrop">'+A.drop+'</button>':'')
```

- 找到 `if(S.sub==='delins'&&…)h+=…;` 那一行，在它之後加：

```js
  if(S.sub==='actdrop'&&p.src==='Act')h+='<div class="row"><span class="note">'+A.dropAsk+'</span><button class="btn sm fill" data-act="actdropyes">'+A.declineYes+'</button><button class="lnk" data-act="actdrop">'+A.cancel+'</button></div>';
```

- [ ] **Step 6: 事件**

找到 `$('#list').onclick=function(e){…`，在 `if(k==='delins'){…return}` 那一行之後加：

```js
  if(k==='actdrop'){S.sub=S.sub==='actdrop'?null:'actdrop';renderList();return}
  if(k==='actdropyes'){var ar=S.acts.filter(function(x){return 'act-'+x.docId===id})[0];if(!ar||S.busyDel)return;S.busyDel=true;setAct(ar,'declined').then(function(){S.busyDel=false;forgetRec(id);S.open=null;S.sub=null;renderAll();toast(A.declined)},function(){S.busyDel=false;toast(A.fail)});return}
```

在 `$('#authline').onclick=…` 那一行之後加：

```js
$('#actbox').onclick=function(e){var b=e.target.closest('[data-aa]');if(!b)return;var k=b.dataset.aa,card=b.closest('.acard'),a=card&&S.acts.filter(function(x){return x.docId===card.dataset.d})[0];
  if(k==='google'){JteCloud.signIn().catch(function(e){if(e&&(e.code==='auth/popup-closed-by-user'||e.code==='auth/cancelled-popup-request'))return;toast(I.offline)});return}
  if(k==='email'){openAuth();return}
  if(k==='hide'){O.prefs.actHint=false;save();renderActs();return}
  if(k==='signout'){JteCloud.signOut();return}
  if(k==='resend'){JteCloud.resendVerify().then(function(){toast(U.resent)},function(e){toast(authErr(e))});return}
  if(k==='refresh'){JteCloud.refreshUser().then(function(u){if(!(u&&u.verified))toast(U.notYet)},function(){toast(A.fail)});return}
  if(!a)return;
  if(k==='later'){S.actLater[a.docId]=1;S.actAsk=null;renderActs();return}
  if(k==='no'){S.actAsk=a.docId;renderActs();return}
  if(k==='cancel'){S.actAsk=null;renderActs();return}
  if(S.busyDel)return;S.busyDel=true;
  setAct(a,k==='keep'?'kept':'declined').then(function(){S.busyDel=false;S.actAsk=null;renderAll();toast(k==='keep'?A.kept:A.declined)},function(){S.busyDel=false;toast(A.fail)})};
$('#authin').onclick=function(){authDo('in')};$('#authup').onclick=function(){authDo('up')};$('#authreset').onclick=function(){authDo('reset')};
// 在輸入框按 Enter 是登入，不是關掉對話框（表單的 method="dialog" 預設會關）。
$('#authform').addEventListener('keydown',function(e){if(e.key==='Enter'&&e.target.tagName==='INPUT'){e.preventDefault();authDo('in')}});
```

- [ ] **Step 7: 換帳號、示範模式、下載**

找到最後的開場那一行 `if(DEMO){S.cloud=demoInsp();S.cloudOk=true}else if(window.JteCloud){…}`：

- `if(DEMO){S.cloud=demoInsp();S.cloudOk=true}` 改成 `if(DEMO){S.cloud=demoInsp();S.acts=demoActs();S.cloudOk=true}`
- 換帳號清空那一段 `S.cloud=[];S.draft=[];S.cwipe=false;` 改成 `S.cloud=[];S.acts=[];S.actLater={};S.actAsk=null;S.draft=[];S.cwipe=false;`

在 `downloadData` 裡，把 `cloud_inspirations:S.cloud` 改成：

```js
cloud_inspirations:S.cloud,cloud_activities:S.acts.filter(function(a){return a.status==='kept'})
```

- [ ] **Step 8: 驗證**

跑測試指令，預期 `DONE pass=68 fail=0`。

用內建瀏覽器開 `http://localhost:8765/me/?demo`（預覽伺服器名稱 `jte-me-preview`），逐項確認：

1. 主控台沒有錯誤。
2. 「今天」上方有一張卡：「你參加過「茶席體驗（示範）」…要收進手帳嗎？」，三個按鈕。
3. 「我的地圖 → 體驗足跡」已經有「聲波放鬆（示範）」，打開看到兩行「活動前　身體 4　情緒 5」「活動後　身體 7　情緒 7」與四段文字，沒有任何「進步」「提升」字樣。
4. 按「收進來」→ 卡片消失、體驗足跡多一筆、出現提示。
5. 重新整理，按「不用」→ 出現確認 → 「確定不用」→ 卡片消失，體驗足跡沒有多。
6. 在已收進來的那一頁按「從手帳拿掉」→ 確認 → 那一頁消失。
7. `localStorage.getItem('jte_me_v1')` 在示範模式下沒有被寫入活動內容（執行 `JSON.stringify(localStorage).indexOf('茶湯入口')` 應為 `-1`）。
8. 開 `http://localhost:8765/me/`（非示範、未登入）：看到邀請卡與「用 Google 登入」「用信箱登入」；按「用信箱登入」開出對話框；按「不用提醒」後卡片消失，重新整理也不再出現。

- [ ] **Step 9: Commit**

```bash
git add me/index.html
git commit -m "feat(me): 信箱登入、活動紀錄先問本人再收進體驗足跡" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

---

### Task 6: 管理者匯入頁

**Files:**
- Create: `me/admin-import.html`

**Interfaces:**
- Consumes: `M.actParse`、`M.actRecord`、`M.actSessionOk`、`M.actDups`、`M.actPlan`、`M.actEmail`（Task 2、3）；`JteCloud.init/signIn/signOut/isAdmin/sessionActs/writeActs`（Task 4）；`D.act`
- Produces: 匯入頁。不放進任何導覽。

這一頁的文案是管理者工具用語，寫在頁內的 `T` 物件（單一出處），不進 `me-data.js`。

- [ ] **Step 1: 建立檔案**

```html
<!doctype html>
<html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>活動紀錄匯入｜練息場</title>
<style>
:root{--ink:#032639;--ink-3:#6B7686;--line:rgba(20,34,56,.14);--bg:#fff;--soft:#F6F8FB;--blue:#2F6BD8;--warn:#B4530A}
*{box-sizing:border-box}body{margin:0;background:var(--soft);color:var(--ink);font:15px/1.7 system-ui,"Noto Sans TC",sans-serif}
.wrap{max-width:1100px;margin:0 auto;padding:24px 16px 80px}h1{font-size:24px;margin:0 0 4px}h2{font-size:17px;margin:0 0 8px}
.panel{background:var(--bg);border:1px solid var(--line);border-radius:14px;padding:20px;margin-top:16px}
.note{font-size:13px;color:var(--ink-3)}.warn{color:var(--warn)}
.row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
button{font:inherit;border:1px solid var(--line);background:var(--bg);border-radius:999px;padding:7px 18px;font-weight:700;cursor:pointer;min-height:38px}
button.fill{background:var(--ink);color:#fff;border-color:var(--ink)}button:disabled{opacity:.5;cursor:default}
input,select,textarea{font:inherit;border:1px solid var(--line);border-radius:8px;padding:6px 10px;background:var(--soft);min-width:0}
textarea{width:100%;min-height:180px}
.ses{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px;padding:12px 0;border-top:1px solid var(--line)}
.ses label{display:grid;gap:2px;font-size:12.5px;font-weight:700;color:var(--ink-3)}
.tw{overflow-x:auto}table{border-collapse:collapse;width:100%;font-size:13.5px}th,td{border-top:1px solid var(--line);padding:6px 8px;text-align:left;vertical-align:top}
td.tx{max-width:220px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}tr.off{opacity:.45}td input{width:100%;min-width:190px}
</style></head><body>
<div class="wrap">
  <h1>活動紀錄匯入</h1><p class="note" id="lead"></p>
  <div class="panel" id="gate"></div>
  <div id="work" hidden>
    <div class="panel"><h2 id="h1"></h2><p class="note" id="n1"></p><textarea id="paste" aria-labelledby="h1"></textarea>
      <div class="row" style="margin-top:10px"><button class="fill" id="parse"></button><span class="note warn" id="perr" role="alert"></span></div></div>
    <div class="panel" id="p2" hidden><h2 id="h2"></h2><p class="note" id="n2"></p><div id="sess"></div></div>
    <div class="panel" id="p3" hidden><h2 id="h3"></h2><p class="note" id="n3"></p>
      <div class="row" id="bulk" style="margin:8px 0"></div><div class="tw"><table id="tbl"></table></div>
      <div class="row" style="margin-top:14px"><button class="fill" id="go"></button><span class="note" id="sum"></span></div>
      <p class="note" id="res" role="status" style="margin-top:10px"></p></div>
  </div>
</div>
<script src="me-data.js"></script>
<script src="me-core.js"></script>
<script src="vendor/firebase-app-compat.js"></script>
<script src="vendor/firebase-auth-compat.js"></script>
<script src="vendor/firebase-firestore-compat.js"></script>
<script src="me-cloud.js"></script>
<script>
(function(){
'use strict';
var D=window.JTE_ME_DATA,M=window.JteMe,A=D.act,esc=M.esc,$=function(s){return document.querySelector(s)};
var T={lead:'把試算表的活動整理貼進來，讓參加者登入後看到自己的那一筆。只會送出信箱、前後測、四段文字；姓名、企業、部門、職級與給主辦方的評分不會離開這個瀏覽器。',
  needLogin:'這一頁只有管理者能用。請先登入。',signIn:'用 Google 登入',signOut:'登出',notAdmin:'這個帳號不是管理者。這一頁只有管理者能用。',offline:'連不上雲端，請重新整理再試。',
  h1:'一、貼上',n1:'在試算表打開一場活動的分頁，全選（Ctrl+A）、複製、貼到下面。一次貼一個分頁。',parse:'拆解',noHeader:'找不到標題列。請確認貼上的內容包含「姓名」「Email」那一列。',
  h2:'二、場次',n2:'活動名稱與場次代號要自己填。場次代號只能用小寫英文、數字、連字號，例如 tea；同一場以後重貼要用同一個代號。',
  title:'活動名稱',date:'日期',slug:'場次代號',photo:'照片連結',idIs:'文件代號開頭：',
  h3:'三、預覽',n3:'只列出會送出的欄位。有標記的列預設略過，確認沒問題可以取消略過；信箱可以直接改。',
  skip:'略過',ses:'場次',email:'信箱',pre:'前測',post:'後測',text:'文字（開頭）',flag:'標記',all:'全部設為',
  go:'確認匯入',going:'匯入中…',sum:'會送出 {n} 筆，略過 {s} 筆',badSes:'場次還沒填完：每一場都要有活動名稱、日期與合格的場次代號，而且代號不能重複。',
  done:'完成。新增 {a} 筆、更新 {u} 筆、本人選了不用而跳過 {k} 筆、失敗 {f} 筆。',fail:'匯入失敗，請再試一次。'};
var S={user:null,admin:false,sessions:[],rows:[],busy:false};
$('#lead').textContent=T.lead;['h1','n1','h2','n2','h3','n3'].forEach(function(k){$('#'+k).textContent=T[k]});$('#parse').textContent=T.parse;$('#go').textContent=T.go;

function gate(){var g=$('#gate');$('#work').hidden=!S.admin;
  if(!S.user)g.innerHTML='<p>'+T.needLogin+'</p><div class="row"><button class="fill" id="in">'+T.signIn+'</button></div>';
  else g.innerHTML='<div class="row"><span>'+esc(S.user.email)+'</span><button id="out">'+T.signOut+'</button></div>'+(S.admin?'':'<p class="warn">'+T.notAdmin+'</p>')}
$('#gate').onclick=function(e){if(e.target.id==='in')JteCloud.signIn().catch(function(){});if(e.target.id==='out')JteCloud.signOut()};

function sid(s){return s.date+'-'+s.slug}
function sesOk(){var seen={};return S.sessions.length>0&&S.sessions.every(function(s){var id=sid(s);if(!s.title.trim()||!M.actSessionOk(id)||seen[id])return false;seen[id]=1;return true})}
function renderSes(){$('#sess').innerHTML=S.sessions.map(function(s,i){return '<div class="ses" data-i="'+i+'"><label>'+T.title+'<input data-k="title" maxlength="'+A.maxTitle+'" value="'+esc(s.title)+'"></label><label>'+T.date+'<input data-k="date" value="'+esc(s.date)+'" placeholder="2026-11-05"></label><label>'+T.slug+'<input data-k="slug" maxlength="30" value="'+esc(s.slug)+'" placeholder="tea"></label><label>'+T.photo+'<input data-k="photoUrl" maxlength="'+A.maxUrl+'" value="'+esc(s.photoUrl)+'"></label><span class="note">'+T.idIs+esc(sid(s))+'__</span></div>'}).join('')}
function flagsOf(r,i,dups){var f=r.flags.filter(function(x){return x==='score'||x==='blank'}).concat(M.actEmail(r.email,A.tlds).flags);if(dups.indexOf(i)>-1)f.push('dup');return f}
function dupIdx(){return M.actDups(S.rows.map(function(r){return {sessionId:r.skip?'skip-'+r.line:String(r.ses),email:r.email}}))}
function renderRows(){var dups=dupIdx(),opt=function(v){return S.sessions.map(function(s,i){return '<option value="'+i+'"'+(i===v?' selected':'')+'>'+esc(s.date+' '+s.title)+'</option>'}).join('')};
  $('#bulk').innerHTML=S.sessions.length>1?'<span class="note">'+T.all+'</span>'+S.sessions.map(function(s,i){return '<button data-all="'+i+'">'+esc(s.date)+'</button>'}).join(''):'';
  $('#tbl').innerHTML='<tr><th>'+T.skip+'</th>'+(S.sessions.length>1?'<th>'+T.ses+'</th>':'')+'<th>'+T.email+'</th><th>'+T.pre+'</th><th>'+T.post+'</th><th>'+T.text+'</th><th>'+T.flag+'</th></tr>'+
    S.rows.map(function(r,i){var f=flagsOf(r,i,dups),sc=function(o){return [o.body,o.mood].map(function(x){return x==null?'–':x}).join('／')};
      return '<tr data-i="'+i+'"'+(r.skip?' class="off"':'')+'><td><input type="checkbox" data-k="skip"'+(r.skip?' checked':'')+' aria-label="'+T.skip+'"></td>'+(S.sessions.length>1?'<td><select data-k="ses">'+opt(r.ses)+'</select></td>':'')+
        '<td><input data-k="email" maxlength="200" value="'+esc(r.email)+'" aria-label="'+T.email+'"></td><td>'+sc(r.pre)+'</td><td>'+sc(r.post)+'</td><td class="tx">'+esc((r.feedback||r.feeling||r.takeaway||r.expect||'').slice(0,30))+'</td><td class="warn">'+f.map(function(x){return esc(A.flags[x])}).join('、')+'</td></tr>'}).join('');
  var n=S.rows.filter(function(r){return !r.skip}).length;$('#sum').textContent=T.sum.replace('{n}',n).replace('{s}',S.rows.length-n)}

$('#parse').onclick=function(){var r=M.actParse($('#paste').value,A.cols,A.tlds);$('#perr').textContent=r.ok?'':T.noHeader;$('#p2').hidden=$('#p3').hidden=!r.ok;$('#res').textContent='';if(!r.ok)return;
  S.sessions=(r.sessions.length?r.sessions:[{date:'',photoUrl:''}]).map(function(s){return {title:'',date:s.date,slug:'',photoUrl:s.photoUrl}});
  S.rows=r.rows.map(function(x){x.ses=0;x.skip=x.flags.length>0;return x});
  M.actDups(S.rows.map(function(x){return {sessionId:'0',email:x.email}})).forEach(function(i){S.rows[i].skip=true});
  renderSes();renderRows()};
$('#sess').addEventListener('input',function(e){var k=e.target.dataset.k,box=e.target.closest('.ses');if(!k||!box)return;var s=S.sessions[+box.dataset.i];s[k]=e.target.value.trim();box.querySelector('span').textContent=T.idIs+sid(s)+'__'});
$('#sess').addEventListener('change',function(){renderRows()});
$('#tbl').addEventListener('change',function(e){var k=e.target.dataset.k,tr=e.target.closest('tr');if(!k||!tr)return;var r=S.rows[+tr.dataset.i];
  if(k==='skip')r.skip=e.target.checked;if(k==='ses')r.ses=+e.target.value;if(k==='email')r.email=M.actEmail(e.target.value,A.tlds).email;renderRows()});
$('#bulk').onclick=function(e){var b=e.target.closest('[data-all]');if(!b)return;S.rows.forEach(function(r){r.ses=+b.dataset.all});renderRows()};

$('#go').onclick=function(){if(S.busy)return;var res=$('#res');res.className='note';
  if(!sesOk()){res.className='note warn';res.textContent=T.badSes;return}
  var dups=dupIdx(),recs=[];
  S.rows.forEach(function(r,i){if(r.skip||dups.indexOf(i)>-1||M.actEmail(r.email,A.tlds).flags.some(function(f){return f!=='tld'}))return;var s=S.sessions[r.ses];
    recs.push(M.actRecord(r,{sessionId:sid(s),title:s.title,date:s.date,photoUrl:s.photoUrl},A))});
  S.busy=true;$('#go').disabled=true;$('#go').textContent=T.going;
  var ids={};recs.forEach(function(r){ids[r.sessionId]=1});
  Promise.all(Object.keys(ids).map(function(id){return JteCloud.sessionActs(id)})).then(function(ms){var ex={};ms.forEach(function(m){Object.keys(m).forEach(function(k){ex[k]=m[k]})});
    var p=M.actPlan(recs,ex);return JteCloud.writeActs(p.writes).then(function(w){var bad=w.failed;
      res.textContent=T.done.replace('{a}',bad?'?':p.added).replace('{u}',bad?'?':p.updated).replace('{k}',p.skipped).replace('{f}',bad);if(bad)res.className='note warn'})})
  .catch(function(){res.className='note warn';res.textContent=T.fail})
  .then(function(){S.busy=false;$('#go').disabled=false;$('#go').textContent=T.go})};

if(!window.JteCloud||!JteCloud.init(function(u){S.user=u;S.admin=false;gate();if(u)JteCloud.isAdmin().then(function(y){if(S.user&&S.user.uid===u.uid){S.admin=y;gate()}})})){$('#gate').textContent=T.offline}
})();
</script>
</body></html>
```

- [ ] **Step 2: 驗證**

1. 跑測試指令，仍是 `DONE pass=68 fail=0`。
2. `grep -n "<script src=\"http" me/admin-import.html` 沒有結果（沒有外部絕對網址 script）。
3. 用內建瀏覽器開 `http://localhost:8765/me/admin-import.html`：未登入時只看到「這一頁只有管理者能用。請先登入。」；主控台沒有錯誤。
4. 在主控台執行下面這段，用虛構資料確認拆解與預覽（不經過登入閘、不寫雲端）：

```js
document.querySelector('#work').hidden=false;
document.querySelector('#paste').value=['活動日期\t2026/11/05\t活動照片連結\t https://photos.example.com/a','活動日期\t2026/11/06\t活動照片連結\thttps://photos.example.com/b','企業\t姓名\t部門\t職級\tEmail\t前測_身體狀態 (1-10)\t前測_情緒狀態 (1-10)\t活動前期待\t過程感受\t後測_身體狀態 (1-10)\t後測_情緒狀態 (1-10)\t身心狀態更了解 (1-10)\t帶領者專業度與陪伴感 (1-10)\t可帶回日常應用收穫 (1-10)\t最實用日常收穫\t整體滿意度 (1-10)\t推薦意願 (1-10)\t心得與回饋','甲公司\t測試一\t設計\t員工\ta@example.com\t4\t5\t想放鬆\t很安靜\t7\t8\t9\t9\t9\t泡茶\t10\t10\t喜歡','\t測試二\t\t\tb@example.com.te\t3\t3\t\t還好\t5\t5\t\t\t\t\t\t\t','\t測試三\t\t\tc@example.com\t\t\t\t\t\t\t\t\t\t\t\t\t'].join('\n');
document.querySelector('#parse').click();
document.querySelector('#tbl').innerText;
```

   預期：出現兩個場次（日期已帶入、名稱與代號空白）；三列，第一列沒有標記、沒被略過；第二列標「信箱結尾可疑」且預設略過；第三列標「沒有填問卷」且預設略過；頁面上找不到「甲公司」「測試一」「設計」。場次沒填完時按「確認匯入」顯示「場次還沒填完…」，不會送出。

- [ ] **Step 3: Commit**

```bash
git add me/admin-import.html
git commit -m "feat(me): 管理者匯入頁：貼上、預覽、只送出核准欄位" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

---

### Task 7: 後台設定與真帳號驗證（由主控者與使用者一起做，不派給子代理）

這一段動到線上的 Firebase 專案與真實資料，每一步都要使用者在場、同意。

- [ ] **Step 1: 開啟信箱密碼登入**
  Firebase Console → 專案 `lianxichang-me` → Authentication → 登入方式 → 電子郵件／密碼 → 啟用（「電子郵件連結」不要開）。

- [ ] **Step 2: 發布規則**
  Firestore → 規則：把 `firestore.rules` 裡 `/me` 的四段（inspirations、photos、admins、activityRecords，連同那四個 function）與最後的「其餘一律禁止」發布到 `lianxichang-me`。`octenso_feedback`、`octenso/allowlist` 兩段是 jointoenjoy 的，不要貼過去。發布前先看一眼線上現有規則，確認只有靈感區那兩段。

- [ ] **Step 3: 建立管理者**
  使用者先用自己的帳號在 `/me` 登入一次。Authentication → 使用者 → 複製那個帳號的 UID。Firestore → 資料 → 新增集合 `admins`、文件代號＝那個 UID、欄位 `note`（字串）＝`owner`。

- [ ] **Step 4: 規則檢查（Firestore → 規則 → 規則測試區）**

| 模擬 | 預期 |
|---|---|
| 未登入 `get /activityRecords/x` | 拒絕 |
| 已登入、`email_verified: false`、讀自己信箱的那一筆 | 拒絕 |
| 已登入、已驗證、讀別人信箱的那一筆 | 拒絕 |
| 已登入、已驗證、讀自己信箱的那一筆 | 允許 |
| 非管理者 `create /activityRecords/…` | 拒絕 |
| 任何人 `create /admins/…` | 拒絕 |

- [ ] **Step 5: 走一遍（用使用者的帳號與一個測試信箱）**
  1. 管理者開 `http://localhost:8765/me/admin-import.html`，貼一場**真的**活動分頁，填活動名稱與場次代號，把兩場的列指定好，確認預覽裡沒有姓名、企業與評分，匯入。記下結果的數字。
  2. 同一份再貼一次、同一個代號：結果應該是「新增 0 筆、更新 N 筆」。
  3. 管理者自己的信箱若在名單裡：開 `/me`，看到「要收進手帳嗎」，收進來，在體驗足跡看到；「下載我的資料」的檔案裡有 `cloud_activities`。
  4. 測試信箱（要在名單裡，或暫時加一列）：用「信箱登入 → 建立帳號」，收驗證信，確認驗證前看不到任何活動卡；點連結後按「我驗證好了」，活動卡出現。
  5. 測試信箱選「不用」：Console 裡那一筆只剩 `email`、`sessionId`、`status`、`decidedAt`。再匯入一次同一場，結果「跳過 1 筆」，那一筆沒有被寫回內容。
  6. 用另一個不在名單裡的帳號登入：沒有活動卡；開匯入頁顯示「這個帳號不是管理者」。
  7. 記下驗證信有沒有進垃圾信、寄件者顯示什麼。

- [ ] **Step 6: 更新記憶與快照**
  把結果（哪些通過、哪些沒做）寫進本機記憶 `jte-me-photos-and-style-switch.md` 或另開一則；不要寫任何參加者的姓名、信箱或作答內容。

---

## 不在這份計畫裡的事

- 把「加照片」按鈕做得更明顯、登入連按兩次的防呆（先前提過，另外處理）。
- 驗證信的範本改成練息場的語氣（規格第 12 節第 3 項，待使用者決定）。
- 問卷加告知文字（第 12 節第 2 項）。
- 合併到 main：要等使用者開口，而且要先確認非 medialand 的 Google 帳號能登入。
