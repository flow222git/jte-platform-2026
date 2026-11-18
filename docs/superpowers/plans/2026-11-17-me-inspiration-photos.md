# 靈感區加照片 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `/me`「今天」右邊的「記一句」改成「靈感」：可以只寫一句（存本機），也可以放最多 4 張照片、各自加註解（整筆存到本人的雲端，只有本人看得到）。

**Architecture:** 純函式（驗證、縮圖尺寸、把雲端靈感併入頁面、搜尋註解）加進 `me/me-core.js`，可自動測試。Firebase 登入、Firestore 讀寫、canvas 壓縮放在新檔 `me/me-cloud.js`，不進自動測試、手動驗證。畫面與事件仍在 `me/index.html` 的內嵌 script，沿用現有寫法。所有文案與上限進 `me/me-data.js` 的 `insp`。

**Tech Stack:** 原生 JS（ES5 風格，與現有檔案一致）、Firebase compat SDK 9.23.0（app / auth / firestore，放進 repo）、Firestore、canvas `toDataURL('image/jpeg')`。

**規格：** `docs/superpowers/specs/2026-11-17-me-inspiration-photos-design.md`

## Global Constraints

- 一筆最多 **4** 張照片；最長邊 **1280 px**；照片 data URL 長度上限 **420,000** 字元（約 300 KB）；註解上限 **200** 字；文字上限 **500** 字。
- 照片只收 `data:image/jpeg;base64,` 開頭（存雲端時）；頁面顯示只收 `data:image/` 開頭。
- Firestore 路徑以 Firebase Auth `uid` 為鑰：`users/{uid}/inspirations/{insId}`、`users/{uid}/photos/{photoId}`。不用 email。
- 只有文字的一筆照舊存本機 `jte_me_v1.memos`；有照片的一筆整筆存雲端。
- 只有本人能讀寫自己的資料；不給一起練的團員看。
- 頁面不可有外部絕對網址 script：Firebase 程式檔放 `me/vendor/`。
- 文案與數字一律進 `me/me-data.js`，頁內不散寫（meta A 同源）。
- 示範模式（`?demo`）不登入、不寫入本機或雲端。
- 不用 emoji。
- 測試指令（Windows 這台）：
  `PYTHONUTF8=1 "C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe" jte-testrun.py me/me.test.html`（在 repo 根目錄執行）。Mac 上是 `python3 jte-testrun.py me/me.test.html`。
- commit 與 push 要使用者開口才做（使用者已同意這份計畫的 commit；push 另外問）。

## 檔案

| 檔案 | 動作 | 責任 |
|---|---|---|
| `me/me-data.js` | 改 | 新增 `insp`（上限與文案）；`capture.label` 改「靈感」；`privacy.cloud` |
| `me/me-core.js` | 改 | 新增 `inspCheck`、`fitSize`；`buildPages` 收照片；`hay` 收註解；`lensGroups` 方法視角略過 `Insp` |
| `me/me.test.html` | 改 | 新增上述測試 |
| `me/vendor/firebase-*-compat.js` | 新 | Firebase SDK 9.23.0 三個檔 |
| `me/me-cloud.js` | 新 | `window.JteCloud`：登入、讀寫、刪除、壓縮 |
| `me/index.html` | 改 | 靈感區畫面、登入列、照片在足跡的顯示與刪除、下載與雲端刪除 |
| `firestore.rules` | 改 | 新增 `users/{uid}/inspirations`、`users/{uid}/photos` 規則 |
| `docs/superpowers/specs/2026-11-17-me-living-sketchbook-design.md` | 改 | 5.3、5.7 補一句指向新規格 |

---

### Task 1: 資料檔的上限與文案

**Files:**
- Modify: `me/me-data.js`（`privacy` 物件、`capture` 那一行，以及在 `back:` 之前插入 `insp`）
- Test: `me/me.test.html`

**Interfaces:**
- Produces: `JTE_ME_DATA.insp`，欄位如下，後面每個任務都用它：
  `maxPhotos:4, maxEdge:1280, maxDataLen:420000, maxCaption:200, maxText:500`，以及文案鍵 `add, needLogin, signIn, signOut, signedIn, cloudNote, offline, caption, remove, left, right, saving, kept, fail, photoCount, delPhoto, delIns, delAsk, delYes, full, compressFail, wipe, wipeAsk, wipeYes, wiped, bad:{empty,text,count,type,size,caption}`。
  `JTE_ME_DATA.privacy.cloud`（字串）。

- [ ] **Step 1: 寫會失敗的測試**

在 `me/me.test.html` 的 `log('---');` 那一行之前加入：

```js
check('資料檔：靈感區的上限與文案',()=>{const I=D.insp;eq(I.maxPhotos,4);eq(I.maxEdge,1280);eq(I.maxDataLen,420000);eq(I.maxCaption,200);eq(I.maxText,500);
  ['add','needLogin','signIn','signOut','signedIn','cloudNote','offline','caption','remove','left','right','saving','kept','fail','photoCount','delPhoto','delIns','delAsk','delYes','full','compressFail','wipe','wipeAsk','wipeYes','wiped'].forEach(k=>ok(I[k],k));
  ['empty','text','count','type','size','caption'].forEach(k=>ok(I.bad[k],'bad.'+k));eq(D.capture.label,'靈感');ok(D.privacy.cloud.indexOf('只有你看得到')>-1);
  ok(I.cloudNote.indexOf('只有你看得到')>-1);});
```

- [ ] **Step 2: 跑測試確認失敗**

Run: 見 Global Constraints 的測試指令。
Expected: `FAIL 資料檔：靈感區的上限與文案`，最後一行 `DONE pass=48 fail=1`。

- [ ] **Step 3: 改資料檔**

`me/me-data.js` 的 `capture:` 那一行整行換成：

```js
    capture: { label: '靈感', forState: '記下「{s}」的這一刻', placeholder: '一句話、一個詞都可以', keep: '留下', start: '這是我想靠近的事', note: '只有一句話時存在這台裝置；放了照片的那一筆會存到你的雲端。「想靠近的事」會留成一個起點，之後做了可以接回來。', useful: '你標過「對我有用」的' },
```

在 `back:` 那一行之前插入：

```js
    // 靈感區：一句話，或幾張照片各自加註解。有照片的一筆存到本人的雲端（Firebase），只有本人看得到。
    // 上限與 firestore.rules 一致；改這裡要一起改規則。
    insp: { maxPhotos: 4, maxEdge: 1280, maxDataLen: 420000, maxCaption: 200, maxText: 500,
      add: '加照片', needLogin: '登入後可以放照片', signIn: '用 Google 登入', signOut: '登出', signedIn: '{n} 已登入',
      cloudNote: '放了照片的這一筆會存到你的雲端，只有你看得到。', offline: '照片功能暫時連不上，可以先只記一句。',
      caption: '這張想說什麼（可以不寫）', remove: '拿掉', left: '往前', right: '往後', saving: '存的時候…',
      kept: '留下了，照片存到你的雲端', fail: '沒有存到，請再試一次。內容都還在。', photoCount: '{n} 張照片',
      delPhoto: '拿掉這張', delIns: '刪除這一筆', delAsk: '確定刪除？雲端上的照片也會一起刪掉。', delYes: '確定刪除',
      full: '一筆最多 {n} 張', compressFail: '這張照片讀不出來，換一張試試',
      wipe: '刪除我在雲端的靈感與照片', wipeAsk: '確定刪除？雲端上所有靈感與照片都會刪掉，不能復原。', wipeYes: '確定刪除', wiped: '雲端的靈感與照片刪掉了',
      bad: { empty: '寫一句或放一張照片', text: '這一句太長了', count: '一筆最多 4 張', type: '只能放照片', size: '照片太大了', caption: '註解太長了' } },
```

在 `privacy:` 物件裡、`now:` 那一項後面加一項：

```js
      cloud: '放了照片的靈感存在你登入的 Google 帳號底下，只有你看得到；其他內容只存在這台裝置。',
```

- [ ] **Step 4: 跑測試確認通過**

Expected: `DONE pass=49 fail=0`。

- [ ] **Step 5: Commit**

```bash
git add me/me-data.js me/me.test.html
git commit -m "me: 靈感區的上限與文案進 me-data.js"
```

---

### Task 2: 資料層純函式

**Files:**
- Modify: `me/me-core.js`（`buildPages` 的 memos 迴圈、`hay`、`lensGroups` 的 `to` 分支、新增 `inspCheck`、`fitSize`、匯出）
- Test: `me/me.test.html`

**Interfaces:**
- Consumes: `D.insp`（Task 1）。
- Produces:
  - `JteMe.inspCheck(ins, lim) -> {ok:boolean, why:''|'empty'|'text'|'count'|'type'|'size'|'caption'}`。`ins = {text, photos:[{data, caption}]}`，`lim = D.insp`。
  - `JteMe.fitSize(w, h, maxEdge) -> {w, h}`（整數，等比縮小；本來就小於上限則原樣）。
  - `JteMe.buildPages(daily, memos)`：memos 的元素可以帶 `photos:[{id,data,caption,order}]`。有照片的頁 `src:'Insp'`、`photos` 依 `order` 排序、只收 `data:image/` 開頭；沒文字時 `label:'照片'`。所有頁面都有 `photos` 陣列（沒有就是 `[]`）。
  - `JteMe.searchPages`：照片註解也搜得到。
  - `JteMe.lensGroups('to', …)`：略過 `src` 為 `Day`、`Memo`、`Insp` 的頁。

- [ ] **Step 1: 寫會失敗的測試**

在 Task 1 加的測試後面加入：

```js
const JP='data:image/jpeg;base64,AAAA';
check('靈感驗證：有一句或有照片才算；張數、類型、大小、註解、字數都有上限',()=>{const L=D.insp,c=x=>M.inspCheck(x,L).why;
  eq(M.inspCheck({text:'好酷'},L).ok,true);eq(M.inspCheck({text:'',photos:[{data:JP}]},L).ok,true);
  eq(c({text:'  '}),'empty');eq(c(null),'empty');eq(c({photos:[]}),'empty');
  eq(c({text:'x'.repeat(501)}),'text');
  eq(c({photos:[1,2,3,4,5].map(()=>({data:JP}))}),'count');
  eq(c({photos:[{data:'data:image/png;base64,AAAA'}]}),'type');eq(c({photos:[{data:'javascript:alert(1)'}]}),'type');
  eq(c({photos:[{data:JP+'A'.repeat(420001)}]}),'size');
  eq(c({photos:[{data:JP,caption:'x'.repeat(201)}]}),'caption');eq(M.inspCheck({photos:[{data:JP,caption:'x'.repeat(200)}]},L).ok,true);});
check('縮圖尺寸：等比縮到最長邊，本來就小的不放大',()=>{const a=M.fitSize(4032,3024,1280);eq(a.w,1280);eq(a.h,960);const b=M.fitSize(1000,3000,1280);eq(b.w,427);eq(b.h,1280);const s=M.fitSize(800,600,1280);eq(s.w,800);eq(s.h,600);});
check('buildPages：有照片的靈感成為一頁，照片照順序、只收圖片；只有照片沒有字也算',()=>{
  const ps=M.buildPages({},[{id:'ins-1',key:'2026-11-12',text:'',cloud:true,photos:[{id:'b',data:'data:image/jpeg;base64,B',caption:'二',order:1},{id:'a',data:'data:image/jpeg;base64,A',caption:'一',order:0},{id:'x',data:'javascript:alert(1)',order:2}]},{id:'m1',key:'2026-11-11',text:'只有字'}]);
  eq(ps.length,2);const p=ps[0];eq(p.src,'Insp');eq(p.kind,'隨手記');eq(p.label,'照片');eq(p.photos.map(x=>x.id).join(),'a,b');eq(p.photos[0].caption,'一');
  eq(ps[1].src,'Memo');eq(ps[1].photos.length,0);
  eq(M.buildPages({},[{id:'ins-2',key:'2026-11-12',photos:[{id:'x',data:'javascript:alert(1)'}]}]).length,0,'只有壞照片不成頁');});
check('搜尋：找得到照片註解',()=>{const ps=M.buildPages({},[{id:'ins-1',key:'2026-11-12',text:'散步',photos:[{id:'a',data:JP,caption:'河堤的夕陽',order:0}]}]);
  eq(M.searchPages(ps,'夕陽',{},{}).length,1);eq(M.searchPages(ps,'散步 河堤',{},{}).length,1);eq(M.searchPages(ps,'山',{},{}).length,0);});
check('視角：方法視角不收靈感',()=>{const ps=M.buildPages({},[{id:'ins-1',key:'2026-11-12',text:'x',photos:[{id:'a',data:JP,order:0}]}]);eq(M.lensGroups('to',ps,{}).length,0);});
```

- [ ] **Step 2: 跑測試確認失敗**

Expected: 五個新 check 都 FAIL（`M.inspCheck is not a function` 等），`DONE pass=49 fail=5`。

- [ ] **Step 3: 實作**

`me/me-core.js`：把 `buildPages` 裡的 memos 迴圈（`arr(memos).forEach(function (m) {` 起到對應的 `});`）整段換成：

```js
    arr(memos).forEach(function (m) {
      if (!m) return;
      var ph = arr(m.photos).filter(function (x) { return x && /^data:image\//.test(String(x.data || '')); })
        .slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); })
        .map(function (x) { return { id: String(x.id), data: String(x.data), caption: String(x.caption || '') }; });
      var text = String(m.text || '');
      if (!text && !ph.length) return;
      ps.push({ id: String(m.id), key: m.key, src: ph.length ? 'Insp' : 'Memo', kind: '隨手記', title: '', label: text ? text.slice(0, 6) : '照片', doodle: '', tool: '',
        text: text, sub: '', note: '', meta: [], feel: [], big: null, link: '', photos: ph });
    });
```

同一個函式裡，每日備註那一頁（`id: 'day-' + k` 那個物件）的結尾 `link: '' }` 改成 `link: '', photos: [] }`。

`toPage` 開頭組頁面物件 `var p = { … big: null, link: '' };` 那一行，結尾改成 `big: null, link: '', photos: [] };`。

把 `hay` 換成：

```js
  function hay(p, a, t) {
    var j = (t && t.join) || {};
    return [p.title, p.text, p.sub, p.note, p.label, p.kind].concat(arr(p.feel), arr(a && a.tags),
      arr(a && a.notes).map(function (n) { return n && n.text; }), [j.text, t && t.found], arr(t && t.why),
      arr(p.photos).map(function (x) { return x && x.caption; }))
      .filter(Boolean).join('\n').toLowerCase();
  }
```

`lensGroups` 裡 `to` 分支那一行的 `if (p.src === 'Day' || p.src === 'Memo') return;` 改成：

```js
if (p.src === 'Day' || p.src === 'Memo' || p.src === 'Insp') return;
```

在 `hay` 之前加入：

```js
  // 靈感：有一句或有照片才算。上限來自 me-data.js 的 insp，與 firestore.rules 一致。
  function inspCheck(ins, lim) {
    if (!ins || typeof ins !== 'object') return { ok: false, why: 'empty' };
    var text = String(ins.text || '').trim(), ph = arr(ins.photos);
    if (!text && !ph.length) return { ok: false, why: 'empty' };
    if (text.length > lim.maxText) return { ok: false, why: 'text' };
    if (ph.length > lim.maxPhotos) return { ok: false, why: 'count' };
    for (var i = 0; i < ph.length; i++) {
      var d = String((ph[i] || {}).data || '');
      if (d.indexOf('data:image/jpeg;base64,') !== 0) return { ok: false, why: 'type' };
      if (d.length > lim.maxDataLen) return { ok: false, why: 'size' };
      if (String(ph[i].caption || '').length > lim.maxCaption) return { ok: false, why: 'caption' };
    }
    return { ok: true, why: '' };
  }
  function fitSize(w, h, maxEdge) {
    var m = Math.max(w, h);
    if (!(m > maxEdge)) return { w: w, h: h };
    var r = maxEdge / m;
    return { w: Math.round(w * r), h: Math.round(h * r) };
  }
```

匯出：在 `g.JteMe = {` 那個物件的最後（`lensGroups: lensGroups` 後面）加 `, inspCheck: inspCheck, fitSize: fitSize`。

- [ ] **Step 4: 跑測試確認通過**

Expected: `DONE pass=54 fail=0`。舊的 48 項也都要過。

- [ ] **Step 5: Commit**

```bash
git add me/me-core.js me/me.test.html
git commit -m "me-core: 靈感驗證、縮圖尺寸、照片併入頁面與搜尋"
```

---

### Task 3: Firebase 程式檔放進 repo

**Files:**
- Create: `me/vendor/firebase-app-compat.js`、`me/vendor/firebase-auth-compat.js`、`me/vendor/firebase-firestore-compat.js`、`me/vendor/README.md`

**Interfaces:**
- Produces: 載入後有全域 `firebase`，含 `firebase.auth()`、`firebase.firestore()`、`firebase.auth.GoogleAuthProvider`、`firebase.firestore.FieldValue`。

- [ ] **Step 1: 下載三個檔（9.23.0，與其他工具頁同版）**

```bash
mkdir -p me/vendor
for n in app auth firestore; do curl -fsSL -o me/vendor/firebase-$n-compat.js https://www.gstatic.com/firebasejs/9.23.0/firebase-$n-compat.js; done
wc -c me/vendor/*.js
```

Expected: 三個檔都存在，各約 20 KB／150 KB／350 KB。任何一個是 0 位元組或內容是 HTML 錯誤頁就停下回報。

- [ ] **Step 2: 寫 `me/vendor/README.md`**

```markdown
# vendor

Firebase JS SDK 9.23.0 compat 版，原檔取自 `https://www.gstatic.com/firebasejs/9.23.0/`。
放在 repo 裡，是因為 `/me` 遵守「頁面不可有外部絕對網址 script」。版本與平台其他工具頁一致。
升級時三個檔一起換，並手動走一遍靈感區的登入與上傳。
```

- [ ] **Step 3: 確認測試頁不受影響**

Run 測試指令。Expected: `DONE pass=54 fail=0`（測試頁不載入 vendor）。

- [ ] **Step 4: Commit**

```bash
git add me/vendor
git commit -m "me: Firebase SDK 9.23.0 compat 放進 me/vendor"
```

---

### Task 4: 雲端模組 `me-cloud.js`

**Files:**
- Create: `me/me-cloud.js`

**Interfaces:**
- Consumes: 全域 `firebase`（Task 3）、`JteMe.fitSize`（Task 2）。
- Produces: `window.JteCloud`：
  - `init(onUser: (user|null) => void) -> boolean`：Firebase 沒載入時回 `false`。`user = {uid, email, name}`。
  - `signIn() -> Promise`、`signOut() -> Promise`
  - `compress(file: File, lim) -> Promise<string>`（JPEG data URL，長度 ≤ `lim.maxDataLen`）
  - `listInsp() -> Promise<Array<{id:'ins-'+docId, docId, key, text, cloud:true, photos:[{id,data,caption,order}]}>>`
  - `saveInsp({key, text, photos:[{data, caption}]}) -> Promise<同上單筆>`
  - `deletePhoto(ins, photoId) -> Promise<ins|null>`（回傳更新後的靈感；沒字也沒照片了就整筆刪掉並回 `null`）
  - `deleteInsp(ins) -> Promise`
  - `wipeAll() -> Promise`

- [ ] **Step 1: 寫 `me/me-cloud.js`**

```js
/* 我的練息場 /me — 雲端靈感（Firebase Auth + Firestore）
 * 只有「放了照片的靈感」會進來。路徑以 uid 為鑰：users/{uid}/inspirations、users/{uid}/photos。
 * 依賴 vendor/ 的 firebase compat 與 canvas，不進自動測試；驗證方式見計畫 Task 7。 */
(function (g) {
  var CFG = { apiKey: 'AIzaSyBRZ1TNVMxOeJfyvGz4HhdlBzlKL0GIAfg', authDomain: 'jointoenjoy.firebaseapp.com', projectId: 'jointoenjoy',
    storageBucket: 'jointoenjoy.firebasestorage.app', messagingSenderId: '978242729427', appId: '1:978242729427:web:ab31364f21c67c2ab56b26' };
  var auth = null, db = null, user = null;

  function init(onUser) {
    var f = g.firebase;
    if (!f || !f.auth || !f.firestore) return false;
    if (!f.apps.length) f.initializeApp(CFG);
    auth = f.auth(); db = f.firestore();
    auth.getRedirectResult().catch(function () {});
    auth.onAuthStateChanged(function (u) {
      user = u ? { uid: u.uid, email: u.email || '', name: u.displayName || u.email || '' } : null;
      onUser(user);
    });
    return true;
  }
  function signIn() {
    var p = new g.firebase.auth.GoogleAuthProvider();
    return auth.signInWithPopup(p).catch(function (e) {
      var c = e && e.code;
      if (c === 'auth/popup-blocked' || c === 'auth/operation-not-supported-in-this-environment') return auth.signInWithRedirect(p);
      throw e;
    });
  }
  function signOut() { return auth.signOut(); }
  function col(name) { return db.collection('users').doc(user.uid).collection(name); }
  function need() { if (!user) throw new Error('not-signed-in'); }

  function loadImg(file) {
    return new Promise(function (ok, no) {
      var u = URL.createObjectURL(file), im = new Image();
      im.onload = function () { URL.revokeObjectURL(u); ok(im); };
      im.onerror = function () { URL.revokeObjectURL(u); no(new Error('decode')); };
      im.src = u;
    });
  }
  // 畫進 canvas 再輸出 JPEG：同時縮小與去掉 EXIF（含拍攝地點）。
  function compress(file, lim) {
    return loadImg(file).then(function (im) {
      var edge = lim.maxEdge, q = 0.85;
      for (;;) {
        var s = g.JteMe.fitSize(im.naturalWidth, im.naturalHeight, edge), c = document.createElement('canvas');
        c.width = s.w; c.height = s.h;
        var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, s.w, s.h); x.drawImage(im, 0, 0, s.w, s.h);
        var d = c.toDataURL('image/jpeg', q);
        if (d.length <= lim.maxDataLen) return d;
        if (q > 0.5) q = Math.max(0.5, Math.round((q - 0.1) * 100) / 100);
        else { edge = Math.round(edge * 0.8); if (edge < 320) throw new Error('size'); }
      }
    });
  }

  function listInsp() {
    if (!user) return Promise.resolve([]);
    return Promise.all([col('inspirations').get(), col('photos').get()]).then(function (r) {
      var by = {}, out = [];
      r[1].forEach(function (d) { var x = d.data(); (by[x.insId] = by[x.insId] || []).push({ id: d.id, data: x.data, caption: x.caption || '', order: x.order || 0 }); });
      r[0].forEach(function (d) { var x = d.data(); out.push({ id: 'ins-' + d.id, docId: d.id, key: x.key, text: x.text || '', cloud: true, photos: by[d.id] || [] }); });
      return out;
    });
  }
  function saveInsp(ins) {
    need();
    var ref = col('inspirations').doc(), b = db.batch(), now = g.firebase.firestore.FieldValue.serverTimestamp(), ids = [];
    var photos = ins.photos.map(function (p, i) {
      var pr = col('photos').doc(); ids.push(pr.id);
      b.set(pr, { insId: ref.id, data: p.data, caption: p.caption || '', order: i, createdAt: now });
      return { id: pr.id, data: p.data, caption: p.caption || '', order: i };
    });
    b.set(ref, { key: ins.key, text: ins.text || '', photos: ids, createdAt: now });
    return b.commit().then(function () { return { id: 'ins-' + ref.id, docId: ref.id, key: ins.key, text: ins.text || '', cloud: true, photos: photos }; });
  }
  function deletePhoto(ins, photoId) {
    need();
    var left = ins.photos.filter(function (p) { return p.id !== photoId; }), b = db.batch();
    b.delete(col('photos').doc(photoId));
    if (!left.length && !ins.text) { b.delete(col('inspirations').doc(ins.docId)); return b.commit().then(function () { return null; }); }
    b.update(col('inspirations').doc(ins.docId), { photos: left.map(function (p) { return p.id; }) });
    return b.commit().then(function () { ins.photos = left; return ins; });
  }
  function deleteInsp(ins) {
    need();
    var b = db.batch();
    ins.photos.forEach(function (p) { b.delete(col('photos').doc(p.id)); });
    b.delete(col('inspirations').doc(ins.docId));
    return b.commit();
  }
  function wipeAll() {
    need();
    return Promise.all([col('inspirations').get(), col('photos').get()]).then(function (r) {
      var refs = [];
      r.forEach(function (s) { s.forEach(function (d) { refs.push(d.ref); }); });
      var jobs = [];
      for (var i = 0; i < refs.length; i += 400) {
        var b = db.batch();
        refs.slice(i, i + 400).forEach(function (x) { b.delete(x); });
        jobs.push(b.commit());
      }
      return Promise.all(jobs);
    });
  }

  g.JteCloud = { init: init, signIn: signIn, signOut: signOut, compress: compress, listInsp: listInsp,
    saveInsp: saveInsp, deletePhoto: deletePhoto, deleteInsp: deleteInsp, wipeAll: wipeAll };
})(window);
```

- [ ] **Step 2: 語法檢查**

在內建瀏覽器開 `http://localhost:8765/me/me.test.html`（預覽伺服器 `jte-me-preview`），用 javascript 工具執行：

```js
await new Promise((ok,no)=>{const s=document.createElement('script');s.src='me-cloud.js';s.onload=ok;s.onerror=no;document.head.appendChild(s)});typeof JteCloud.init
```

Expected: `"function"`，主控台沒有錯誤。

- [ ] **Step 3: Commit**

```bash
git add me/me-cloud.js
git commit -m "me: 雲端靈感模組(登入、壓縮、讀寫、刪除)"
```

---

### Task 5: 靈感區畫面與留下

**Files:**
- Modify: `me/index.html`

**Interfaces:**
- Consumes: `D.insp`、`JteMe.inspCheck`（Task 1–2）、`JteCloud`（Task 4）。
- Produces（後面 Task 6 用）：`S.user`（`null` 或 `{uid,email,name}`）、`S.cloud`（雲端靈感陣列，形狀同 `JteCloud.listInsp`）、`S.draft`（`[{data, caption}]`）、函式 `renderPics()`、`renderAuth()`、`loadCloud()`。

- [ ] **Step 1: 載入程式檔**

`<script src="me-core.js"></script>` 之後加：

```html
<script src="vendor/firebase-app-compat.js"></script>
<script src="vendor/firebase-auth-compat.js"></script>
<script src="vendor/firebase-firestore-compat.js"></script>
<script src="me-cloud.js"></script>
```

- [ ] **Step 2: 畫面骨架**

`<textarea id="memo" maxlength="120"></textarea>` 之後插入：

```html
          <div class="pics" id="pics"></div>
          <div class="row picrow" style="margin-top:10px"><button class="btn sm" id="addpic" type="button"></button><input type="file" id="picin" accept="image/*" multiple hidden><span class="note" id="authline"></span></div>
```

CSS：在 `@media(pointer:coarse)` 那一行之前加：

```css
.pics{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:10px;margin-top:10px}
.pics:empty{display:none}
.pic{display:flex;flex-direction:column;gap:6px}
.pic img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:var(--r-sm);border:1px solid var(--line)}
.pic .in{font-size:13px;padding:6px 8px}
.pic .row{gap:4px}
.photos{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;margin:10px 0}
.photos figure{margin:0}
.photos .ph{display:block;padding:0;border:0;background:none;cursor:zoom-in;width:100%}
.photos img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:var(--r-sm);border:1px solid var(--line)}
.photos figcaption{font-size:13px;color:var(--ink-3);margin-top:4px}
dialog.zoom{border:0;padding:0;background:transparent;max-width:min(92vw,1280px)}
dialog.zoom::backdrop{background:rgba(3,38,57,.82)}
dialog.zoom img{max-width:100%;max-height:82vh;display:block;border-radius:var(--r-sm)}
dialog.zoom p{color:#fff;margin:8px 2px 0;font-size:14px}
```

（`--ink-3`、`--line`、`--r-sm` 是 `index.html` 既有的變數。）

在 `<div class="toast" id="toast" hidden></div>` 之後加：

```html
<dialog class="zoom" id="zoom"><form method="dialog"><button class="ph" style="border:0;background:none;padding:0;cursor:zoom-out"><img id="zoomimg" alt=""></button></form><p id="zoomcap"></p></dialog>
```

- [ ] **Step 3: 狀態、示範資料、登入**

`var S={` 那一行的物件最後（`capFor:null` 後面）加 `,user:null,cloud:[],draft:[],cloudOk:false,delIns:false,cwipe:false`。

在 `function toast(` 那一行之後加入：

```js
/* 靈感區：草稿照片、登入、雲端靈感 */
var I=D.insp;
function demoPic(bg,fg,w){return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect width="400" height="400" fill="'+bg+'"/><circle cx="'+w+'" cy="170" r="70" fill="'+fg+'"/><rect y="280" width="400" height="120" fill="'+fg+'" opacity=".45"/></svg>')}
function demoInsp(){return [{id:'ins-demo-1',key:rel(2),text:'河堤散步，風很舒服。',cloud:true,photos:[{id:'dp1',data:demoPic('#A9EFFF','#2F6BD8',140),caption:'傍晚的河堤',order:0},{id:'dp2',data:demoPic('#FFC3FE','#FF9925',260),caption:'',order:1}]}]}
function renderAuth(){var a=$('#authline'),b=$('#addpic');b.textContent=I.add+(S.draft.length?'（'+S.draft.length+'/'+I.maxPhotos+'）':'');
  if(DEMO){a.textContent='';return}
  if(!S.cloudOk){a.textContent=I.offline;b.disabled=true;return}
  b.disabled=false;
  a.innerHTML=S.user?esc(I.signedIn.replace('{n}',S.user.name))+' <button class="lnk" id="signout">'+I.signOut+'</button>':esc(I.needLogin)+' <button class="lnk pri" id="signin">'+I.signIn+'</button>'}
function renderPics(){$('#pics').innerHTML=S.draft.map(function(d,i){return '<div class="pic" data-i="'+i+'"><img src="'+esc(d.data)+'" alt=""><input class="in" maxlength="'+I.maxCaption+'" value="'+esc(d.caption)+'" placeholder="'+esc(I.caption)+'" aria-label="'+esc(I.caption)+'"><div class="row">'+(i?'<button class="lnk" data-pa="left">'+I.left+'</button>':'')+(i<S.draft.length-1?'<button class="lnk" data-pa="right">'+I.right+'</button>':'')+'<button class="lnk" data-pa="remove">'+I.remove+'</button></div></div>'}).join('');
  $('#keepnote').textContent=DEMO?'示範模式不會儲存。':(S.draft.length?I.cloudNote:D.capture.note);renderAuth()}
function syncCaps(){$$('#pics .pic').forEach(function(el){var d=S.draft[+el.dataset.i];if(d)d.caption=el.querySelector('.in').value.trim()})}
function loadCloud(){if(!S.user||!window.JteCloud){S.cloud=[];renderAll();return}
  JteCloud.listInsp().then(function(l){S.cloud=l;renderAll()}).catch(function(){toast(I.offline)})}
```

（`rel`、`esc`、`$`、`$$` 是 `index.html` 既有的函式。）

- [ ] **Step 4: 把雲端靈感併進頁面**

`renderAll` 裡的 `S.pages=M.buildPages(daily,O.memos);` 改成：

```js
S.pages=M.buildPages(daily,O.memos.concat(S.cloud));
```

- [ ] **Step 5: 事件**

`$('#keep').onclick=` 整行換成：

```js
$('#keep').onclick=function(){var v=$('#memo').value.trim();syncCaps();if(S.draft.length){keepInsp(v);return}
  if(!v){$('#memo').focus();return}var mid='m-'+Date.now();O.memos.push({id:mid,key:TODAY,text:v});if(S.capFor){newTri({kind:'state',state:S.capFor},'',mid);S.capFor=null;capLabel()}save();$('#memo').value='';renderAll();toast('留下了')};
function keepInsp(v){var ins={key:TODAY,text:v,photos:S.draft.map(function(d){return {data:d.data,caption:d.caption}})},chk=M.inspCheck(ins,I);
  if(!chk.ok){toast(I.bad[chk.why]||I.bad.empty);return}
  if(DEMO){S.cloud.unshift({id:'ins-demo-'+Date.now(),key:TODAY,text:v,cloud:true,photos:ins.photos.map(function(p,i){return {id:'dp-'+Date.now()+i,data:p.data,caption:p.caption,order:i}})});afterKeep();return}
  if(!S.user){toast(I.needLogin);return}
  var k=$('#keep');k.disabled=true;k.textContent=I.saving;
  JteCloud.saveInsp(ins).then(function(saved){S.cloud.unshift(saved);afterKeep()}).catch(function(){toast(I.fail)}).then(function(){k.disabled=false;k.textContent=D.capture.keep})}
function afterKeep(){var id=S.cloud[0].id;if(S.capFor){newTri({kind:'state',state:S.capFor},'',id);S.capFor=null;capLabel();save()}
  $('#memo').value='';S.draft=[];renderPics();renderAll();toast(DEMO?'留下了':I.kept)}
$('#addpic').onclick=function(){if(S.draft.length>=I.maxPhotos){toast(I.full.replace('{n}',I.maxPhotos));return}
  if(!DEMO&&!S.user){JteCloud.signIn().catch(function(){toast(I.offline)});return}$('#picin').click()};
$('#picin').onchange=function(){var fs=Array.prototype.slice.call(this.files||[],0,I.maxPhotos-S.draft.length);this.value='';syncCaps();
  fs.reduce(function(pr,f){return pr.then(function(){return JteCloud.compress(f,I).then(function(d){S.draft.push({data:d,caption:''});renderPics()}).catch(function(){toast(I.compressFail)})})},Promise.resolve())};
$('#pics').onclick=function(e){var b=e.target.closest('[data-pa]');if(!b)return;syncCaps();var i=+b.closest('.pic').dataset.i,a=b.dataset.pa,d=S.draft;
  if(a==='remove')d.splice(i,1);if(a==='left'&&i>0)d.splice(i-1,0,d.splice(i,1)[0]);if(a==='right'&&i<d.length-1)d.splice(i+1,0,d.splice(i,1)[0]);renderPics()};
$('#authline').onclick=function(e){if(e.target.id==='signin')JteCloud.signIn().catch(function(){toast(I.offline)});if(e.target.id==='signout')JteCloud.signOut()};
```

注意：示範模式也用 `JteCloud.compress`（只在本機縮圖，不上傳）；`compress` 不需要登入。

`$('#jkeep').onclick=` 不改（「這是我想靠近的事」只收文字；有草稿照片時它照舊只用文字）。

- [ ] **Step 6: 開場**

開場區（`renderAll();` 那一行之前）加入：

```js
if(DEMO){S.cloud=demoInsp();S.cloudOk=true}else if(window.JteCloud){S.cloudOk=JteCloud.init(function(u){S.user=u;renderAuth();renderData();loadCloud()})}
renderPics();
```

並把開場那行 `if(DEMO)$('#keepnote').textContent='示範模式不會儲存。';` 刪掉（改由 `renderPics` 處理）。

- [ ] **Step 7: 跑自動測試**

Expected: `DONE pass=54 fail=0`。

- [ ] **Step 8: 示範模式手動檢查**

開 `http://localhost:8765/me/?demo`：
1. 「今天」右邊標題是「靈感」，有「加照片」。
2. 按「加照片」選兩張本機圖片 → 出現兩張縮圖、各有註解欄、可以往前往後、可以拿掉。
3. 寫一句、加註解、按「留下」→ 輸入框和縮圖清空，跳「留下了」。
4. 主控台沒有錯誤（字體 403 與 Google 帳號清單那兩則是既有的，可忽略）。

- [ ] **Step 9: Commit**

```bash
git add me/index.html
git commit -m "me: 靈感區可以放照片、加註解，登入後存到雲端"
```

---

### Task 6: 照片在足跡出現、刪除、下載

**Files:**
- Modify: `me/index.html`（`rowHTML`、`#list` 點擊處理、`renderData`、`downloadData`、`#data` 點擊處理）

**Interfaces:**
- Consumes: `S.cloud`、`S.user`、`JteCloud.deletePhoto/deleteInsp/wipeAll`、`D.insp`、`D.privacy.cloud`。

- [ ] **Step 1: 紀錄列表顯示照片**

`rowHTML` 裡 `var x=` 那一行換成：

```js
  var ph=p.photos||[],x=(p.big!=null?'<b>'+esc(p.big)+'</b>':'')+esc(p.text||((a.notes||[])[0]||{}).text||p.sub||(ph.length?I.photoCount.replace('{n}',ph.length):''));
```

`if(p.note)h+='<p>'+esc(p.note)+'</p>';` 之後加：

```js
  if(ph.length)h+='<div class="photos">'+ph.map(function(z){return '<figure><button class="ph" data-act="zoom" data-pid="'+esc(z.id)+'"><img src="'+esc(z.data)+'" alt="'+esc(z.caption||'照片')+'" loading="lazy"></button>'+(z.caption?'<figcaption>'+esc(z.caption)+'</figcaption>':'')+(p.src==='Insp'?'<button class="lnk" data-act="delpic" data-pid="'+esc(z.id)+'">'+I.delPhoto+'</button>':'')+'</figure>'}).join('')+'</div>';
```

在 `h+='<div class="acts">` 那一行的結尾 `'</div>';` 之前，加入刪除整筆的按鈕：把該行最後的 `+'</div>';` 改成：

```js
+(p.src==='Insp'?'<button class="lnk" data-act="delins">'+I.delIns+'</button>':'')+'</div>';
```

並在 `if(S.sub==='motive'&&t)h+=whyHTML(t);` 之後加：

```js
  if(S.sub==='delins')h+='<div class="row"><span class="note">'+I.delAsk+'</span><button class="btn sm fill" data-act="delyes">'+I.delYes+'</button><button class="lnk" data-act="delins">取消</button></div>';
```

- [ ] **Step 2: 點擊處理**

`$('#list').onclick` 裡，`var tr=S.triByRec[id];` 之後加：

```js
  var ci=S.cloud.filter(function(c){return c.id===id})[0];
  if(k==='zoom'){var z=(S.byId[id].photos||[]).filter(function(q){return q.id===act.dataset.pid})[0];if(z){$('#zoomimg').src=z.data;$('#zoomimg').alt=z.caption||'照片';$('#zoomcap').textContent=z.caption;$('#zoom').showModal()}return}
  if(k==='delins'){S.sub=S.sub==='delins'?null:'delins';renderList();return}
  if(k==='delyes'&&ci){(DEMO?Promise.resolve():JteCloud.deleteInsp(ci)).then(function(){S.cloud.splice(S.cloud.indexOf(ci),1);S.open=null;S.sub=null;renderAll();toast('刪掉了')}).catch(function(){toast(I.fail)});return}
  if(k==='delpic'&&ci){(DEMO?Promise.resolve(ci.text||ci.photos.length>1?(ci.photos=ci.photos.filter(function(q){return q.id!==act.dataset.pid}),ci):null):JteCloud.deletePhoto(ci,act.dataset.pid)).then(function(r){if(!r)S.cloud.splice(S.cloud.indexOf(ci),1);renderAll();toast('拿掉了')}).catch(function(){toast(I.fail)});return}
```

- [ ] **Step 3: 我的資料：說明、下載、刪除雲端**

`renderData` 整行換成：

```js
function renderData(){var p=D.privacy;$('#data').innerHTML='<p>'+p.now+'</p>'+(S.user?'<p class="note" style="margin-top:6px">'+p.cloud+'</p>':'')+'<p class="note" style="margin-top:6px">'+p.choice+'</p><div class="row" style="margin-top:14px"><button class="btn sm" id="dl">'+p.download+'</button>'+(S.wipe?'<span class="note">'+p.wipeAsk+'</span><button class="btn sm fill" id="wipeyes">'+p.wipeYes+'</button><button class="lnk" id="wipeno">取消</button>':'<button class="lnk" id="wipe">'+p.wipe+'</button>')+'</div>'
  +(S.user?'<div class="row" style="margin-top:10px">'+(S.cwipe?'<span class="note">'+I.wipeAsk+'</span><button class="btn sm fill" id="cwipeyes">'+I.wipeYes+'</button><button class="lnk" id="cwipeno">取消</button>':'<button class="lnk" id="cwipe">'+I.wipe+'</button>')+'</div>':'')}
```

`downloadData` 裡 `bagua_persona_v1:persona||null` 改成 `bagua_persona_v1:persona||null,cloud_inspirations:S.cloud`。

`$('#data').onclick` 整行換成：

```js
$('#data').onclick=function(e){var id=e.target.id;if(id==='dl')downloadData();if(id==='wipe'){S.wipe=true;renderData()}if(id==='wipeno'){S.wipe=false;renderData()}if(id==='wipeyes')wipeMine();
  if(id==='cwipe'){S.cwipe=true;renderData()}if(id==='cwipeno'){S.cwipe=false;renderData()}
  if(id==='cwipeyes'){JteCloud.wipeAll().then(function(){S.cloud=[];S.cwipe=false;renderAll();toast(I.wiped)}).catch(function(){toast(I.fail)})}};
```

- [ ] **Step 4: 跑自動測試**

Expected: `DONE pass=54 fail=0`。

- [ ] **Step 5: 示範模式手動檢查**

開 `http://localhost:8765/me/?demo#mymap`：
1. 兩天前那一筆「河堤散步」顯示「河堤散步，風很舒服。」；點開看到兩張照片、第一張下面有「傍晚的河堤」。
2. 點照片放大，再點一下關掉。
3. 「拿掉這張」少一張；「刪除這一筆」先問一次，確定後整筆不見。
4. 搜尋「夕陽」找不到、「河堤」找得到。
5. 生命地圖的「方法」視角沒有這一筆。

- [ ] **Step 6: Commit**

```bash
git add me/index.html
git commit -m "me: 照片在體驗足跡顯示、放大、刪除，下載與雲端刪除"
```

---

### Task 7: 安全規則、文件、真帳號驗證

**Files:**
- Modify: `firestore.rules`
- Modify: `docs/superpowers/specs/2026-11-17-me-living-sketchbook-design.md`

- [ ] **Step 1: 規則**

在 `firestore.rules` 的 `// 其餘一律禁止` 那一段之前加入：

```
    // /me 靈感區：放了照片的靈感，只有本人能讀寫（以 Firebase Auth uid 為鑰）。
    // 上限與 me/me-data.js 的 insp 一致。
    match /users/{uid}/inspirations/{id} {
      allow read, delete: if request.auth != null && request.auth.uid == uid;
      allow create, update: if request.auth != null && request.auth.uid == uid
        && request.resource.data.keys().hasOnly(['key', 'text', 'photos', 'createdAt'])
        && request.resource.data.text is string && request.resource.data.text.size() <= 500
        && request.resource.data.key is string && request.resource.data.key.matches('^[0-9]{4}-[0-9]{2}-[0-9]{2}$')
        && request.resource.data.photos is list && request.resource.data.photos.size() <= 4;
    }
    match /users/{uid}/photos/{id} {
      allow read, delete: if request.auth != null && request.auth.uid == uid;
      allow create: if request.auth != null && request.auth.uid == uid
        && request.resource.data.keys().hasOnly(['insId', 'data', 'caption', 'order', 'createdAt'])
        && request.resource.data.data is string && request.resource.data.data.size() <= 420000
        && request.resource.data.data.matches('^data:image/jpeg;base64,.*')
        && request.resource.data.caption is string && request.resource.data.caption.size() <= 200
        && request.resource.data.order is int;
      allow update: if false;
    }
```

檔頭註解第 4–7 行補一句：`3. /me 靈感區：users/{uid}/inspirations、users/{uid}/photos，用 Firebase Auth。`

- [ ] **Step 2: 主規格補指向**

`2026-11-17-me-living-sketchbook-design.md` 的 5.3 節「**寫**」那一點後面加：

```markdown
- **例外：放了照片的靈感**存到本人的雲端（Firebase Auth + Firestore），見 `2026-11-17-me-inspiration-photos-design.md`。
```

5.7 節「這一版做到的」那一段後面加：

```markdown
2026-11-17 起，放了照片的靈感是第一個上雲端的內容：放照片就是選擇上雲端，只有本人看得到，可以刪除與下載。
```

- [ ] **Step 3: 跑自動測試**

Expected: `DONE pass=54 fail=0`。

- [ ] **Step 4: Commit**

```bash
git add firestore.rules docs/superpowers/specs/2026-11-17-me-living-sketchbook-design.md
git commit -m "rules: /me 靈感區只有本人能讀寫；主規格補指向"
```

- [ ] **Step 5: 交給使用者在 Firebase 後台做（不可代做）**

告訴使用者：
1. Authentication → 登入方式 → 開啟 Google。
2. Authentication → 設定 → 授權網域：加入 `flow222git.github.io`、`localhost`。
3. Firestore → 規則：**先把線上現有規則複製下來對照**，只把 Step 1 的兩個 `match` 區塊加進去再發布。不要直接用 repo 的 `firestore.rules` 整份覆蓋：檔頭寫明它只是備份，線上規則可能還有現行首頁同步要用的部分，整份覆蓋可能弄壞其他工具。

- [ ] **Step 6: 真帳號手動驗證（後台設定完成後）**

在 `http://localhost:8765/me/`（不加 demo）：
1. 沒登入：可以只記一句；「加照片」旁是「用 Google 登入」。
2. 登入後放 2 張照片加註解、留下 → 體驗足跡出現；重新整理後還在。
3. 換另一個瀏覽器登入同一帳號 → 看得到這一筆。
4. 拿掉一張、刪除整筆 → 重新整理後確實不見。
5. 用另一個 Google 帳號登入 → 看不到前一個帳號的靈感。
6. 「下載我的資料」的 JSON 有 `cloud_inspirations`。
7. 「刪除我在雲端的靈感與照片」要按兩次，之後雲端沒有任何靈感。
8. 拔網路按「留下」→ 跳「沒有存到，請再試一次」，輸入框與照片都還在。

---

## 自我檢查對照（規格 → 任務）

| 規格 | 任務 |
|---|---|
| 2 畫面（標題、加照片、4 張、註解、順序） | 1、5 |
| 3 登入（popup／redirect、沒登入可記一句、顯示帳號與登出） | 4、5 |
| 4.1 只有字存本機、有照片存雲端、留下前寫明 | 5（`cloudNote`） |
| 4.2 Firestore 結構 | 4 |
| 4.3 1280 px、300 KB、去 EXIF | 2（`fitSize`）、4（`compress`） |
| 4.4 安全規則 | 7 |
| 4.5 刪除、下載、雲端刪除兩次確認 | 6 |
| 5 足跡顯示、放大、搜尋註解、仍可貼標籤 | 2、6 |
| 6 示範模式 | 5、6 |
| 7 vendor、分層、失敗保留內容 | 3、4、5 |
| 8 後台設定 | 7 |
| 9 驗證 | 每個任務的測試、7 |
