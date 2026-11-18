/* 我的練息場 /me — 雲端靈感（Firebase Auth + Firestore）
 * 只有「放了照片的靈感」會進來。路徑以 uid 為鑰：users/{uid}/inspirations、users/{uid}/photos。
 * 活動紀錄在 activityRecords/{sessionId}__{email}：管理者匯入，本人（信箱已驗證）只讀得到自己的，並決定收不收。
 * Firebase 專案是 lianxichang-me（/me 專用；平台其他工具用的是另一個專案 jointoenjoy，這裡不碰它）。
 * 依賴 vendor/ 的 firebase compat 與 canvas，不進自動測試；驗證方式見計畫 Task 7。 */
(function (g) {
  var CFG = { apiKey: 'AIzaSyCxogQ_5H43cRGl4QWXvHhWFYgwxM6bLHM', authDomain: 'lianxichang-me.firebaseapp.com', projectId: 'lianxichang-me',
    storageBucket: 'lianxichang-me.firebasestorage.app', messagingSenderId: '531763902352', appId: '1:531763902352:web:6f995c86625cf2cd4b2515' };
  var auth = null, db = null, user = null, onU = null;
  function shape(u) {
    return u ? { uid: u.uid, email: (u.email || '').toLowerCase(), name: u.displayName || u.email || '', verified: !!u.emailVerified,
      byPassword: (u.providerData || []).some(function (p) { return p && p.providerId === 'password'; }) } : null;
  }

  function init(onUser) {
    var f = g.firebase;
    if (!f || !f.auth || !f.firestore) return false;
    if (!f.apps.length) f.initializeApp(CFG);
    auth = f.auth(); db = f.firestore();
    auth.getRedirectResult().catch(function () {});
    onU = onUser;
    auth.onAuthStateChanged(function (u) { user = shape(u); onUser(user); });
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
  // 信箱＋密碼。建立帳號後寄驗證信；只有驗證過的信箱對得到活動紀錄。
  function signUpEmail(email, pw) {
    return auth.createUserWithEmailAndPassword(String(email).trim(), pw).then(function (c) { return c.user.sendEmailVerification().catch(function () {}); });
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
      r[0].forEach(function (d) { var x = d.data(); out.push({ id: 'ins-' + d.id, docId: d.id, key: x.key, text: x.text || '', itemId: x.itemId || '', cloud: true, photos: by[d.id] || [] }); });
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
    var main = { key: ins.key, text: ins.text || '', photos: ids, createdAt: now };
    if (ins.itemId) main.itemId = ins.itemId;
    b.set(ref, main);
    return b.commit().then(function () { return { id: 'ins-' + ref.id, docId: ref.id, key: ins.key, text: ins.text || '', itemId: ins.itemId || '', cloud: true, photos: photos }; });
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

  // 沒登入時回 rejected Promise，不同步 throw。
  function safe(fn) { try { return Promise.resolve(fn()); } catch (e) { return Promise.reject(e); } }

  // 靈感掛到某個練習項目；itemId 空的就拿掉標記。
  function setInspItem(ins, itemId) {
    return safe(function () {
      need();
      var upd = { itemId: itemId ? itemId : g.firebase.firestore.FieldValue.delete() };
      return col('inspirations').doc(ins.docId).update(upd).then(function () { ins.itemId = itemId || ''; return ins; });
    });
  }

  // ── 我的練習：users/{uid}/practiceItems|practiceLogs|practiceNotes。文件代號就是 id，id 不寫進內容。 ──
  var KINDS = { items: 'practiceItems', logs: 'practiceLogs', notes: 'practiceNotes' };
  var FIELDS = {
    items: ['name', 'unit', 'color', 'archived', 'createdAt', 'icon'],
    logs: ['itemId', 'date', 'amount', 'note', 'at'],
    notes: ['itemId', 'title', 'body', 'updatedAt']
  };
  // 規則要求每個欄位都在；呼叫端沒給的補上預設值，免得整筆被擋。
  var DEFAULTS = { icon: '', name: '', unit: '', color: '', archived: false, createdAt: 0, itemId: '', date: '', amount: 0, note: '', at: 0, title: '', body: '', updatedAt: 0 };
  function pick(kind, obj) {
    var out = {}, f = FIELDS[kind], i;
    for (i = 0; i < f.length; i++) {
      if (f[i] === 'icon' && !obj.icon) continue; // 圖示是選填的：沒挑就不寫這一欄
      out[f[i]] = obj[f[i]] !== undefined ? obj[f[i]] : DEFAULTS[f[i]];
    }
    return out;
  }
  function pracLoad() {
    return safe(function () {
      need();
      var ks = ['items', 'logs', 'notes'];
      return Promise.all(ks.map(function (k) { return col(KINDS[k]).get(); })).then(function (r) {
        var out = { items: [], logs: [], notes: [] };
        r.forEach(function (s, i) { s.forEach(function (d) { var x = d.data(); x.id = d.id; out[ks[i]].push(x); }); });
        return out;
      });
    });
  }
  function pracHas() {
    return safe(function () { need(); return col(KINDS.items).limit(1).get().then(function (s) { return !s.empty; }); });
  }
  function pracPut(kind, obj) {
    return safe(function () {
      need();
      if (!KINDS[kind]) throw new Error('bad-kind');
      return col(KINDS[kind]).doc(obj.id).set(pick(kind, obj)).then(function () { return obj; });
    });
  }
  function pracDel(kind, id) {
    return safe(function () { need(); if (!KINDS[kind]) throw new Error('bad-kind'); return col(KINDS[kind]).doc(id).delete(); });
  }
  // 把一串 ref 分批（每批最多 400）刪掉。
  function delRefs(refs) {
    var jobs = [], i;
    for (i = 0; i < refs.length; i += 400) {
      var b = db.batch();
      refs.slice(i, i + 400).forEach(function (x) { b.delete(x); });
      jobs.push(b.commit());
    }
    return Promise.all(jobs);
  }
  function delRefsSeq(refs) {
    var chain = Promise.resolve(), i;
    function one(part) { return function () { var b = db.batch(); part.forEach(function (x) { b.delete(x); }); return b.commit(); }; }
    for (i = 0; i < refs.length; i += 400) chain = chain.then(one(refs.slice(i, i + 400)));
    return chain;
  }
  function pracDelItem(itemId) {
    return safe(function () {
      need();
      return Promise.all([col(KINDS.logs).where('itemId', '==', itemId).get(), col(KINDS.notes).where('itemId', '==', itemId).get()]).then(function (r) {
        var refs = [];
        r.forEach(function (s) { s.forEach(function (d) { refs.push(d.ref); }); });
        // 先刪紀錄與筆記，都成功了才刪項目本身，失敗時不會留下沒有項目的紀錄。
        return delRefs(refs).then(function () { return col(KINDS.items).doc(itemId).delete(); });
      });
    });
  }
  // 一批一批依序寫（上一批成功才寫下一批）；先紀錄、再筆記、項目最後。
  // pracHas() 看的是項目，所以項目是最後一個落地的：中途失敗的話，下次載入不會被當成「雲端已經有資料」而自動切過去。
  function pracUpload(p) {
    return safe(function () {
      need();
      var batches = [], i;
      ['logs', 'notes', 'items'].forEach(function (k) {
        var ops = [];
        ((p && p[k]) || []).forEach(function (o) { ops.push({ ref: col(KINDS[k]).doc(o.id), data: pick(k, o) }); });
        for (i = 0; i < ops.length; i += 400) batches.push(ops.slice(i, i + 400));
      });
      var res = { ok: 0, failed: 0, codes: [] }, dead = false;
      function add(c) { if (res.codes.indexOf(c) < 0) res.codes.push(c); }
      function run(part) {
        if (dead) { res.failed += part.length; return Promise.resolve(); }
        var b;
        try {
          b = db.batch();
          part.forEach(function (w) { b.set(w.ref, w.data); });
        } catch (e) { dead = true; res.failed += part.length; add(e && e.code || 'error'); return Promise.resolve(); }
        return b.commit().then(function () { res.ok += part.length; }, function (e) { dead = true; res.failed += part.length; add(e && e.code || 'error'); });
      }
      return batches.reduce(function (chain, part) { return chain.then(function () { return run(part); }); }, Promise.resolve()).then(function () { return res; });
    });
  }
  // 清掉雲端的練習資料：先紀錄與筆記，項目最後（中途失敗時，項目還在，下次還看得到有東西沒刪乾淨）。
  function pracWipe() {
    return safe(function () {
      need();
      return Promise.all(['logs', 'notes', 'items'].map(function (k) { return col(KINDS[k]).get(); })).then(function (r) {
        var groups = r.map(function (s) { var refs = []; s.forEach(function (d) { refs.push(d.ref); }); return refs; });
        return groups.reduce(function (chain, refs) { return chain.then(function () { return delRefsSeq(refs); }); }, Promise.resolve());
      });
    });
  }

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
      var b;
      try {
        b = db.batch();
        part.forEach(function (w) {
          var data = {}, k; for (k in w.data) if (Object.prototype.hasOwnProperty.call(w.data, k)) data[k] = w.data[k];
          data.importedAt = now;
          if (w.isNew) b.set(acts().doc(w.id), data); else b.set(acts().doc(w.id), data, { merge: true });
        });
      } catch (e) { return Promise.resolve({ ok: 0, failed: part.length, codes: [e && e.code || 'error'] }); }
      return b.commit().then(function () { return { ok: part.length, failed: 0, codes: [] }; }, function (e) { return { ok: 0, failed: part.length, codes: [e && e.code || 'error'] }; });
    }
    for (i = 0; i < writes.length; i += 20) jobs.push(run(writes.slice(i, i + 20)));
    return Promise.all(jobs).then(function (rs) {
      return rs.reduce(function (a, r) {
        r.codes.forEach(function (c) { if (a.codes.indexOf(c) < 0) a.codes.push(c); });
        return { ok: a.ok + r.ok, failed: a.failed + r.failed, codes: a.codes };
      }, { ok: 0, failed: 0, codes: [] });
    });
  }

  // ── 試算表（管理者匯入頁用）：用登入中的 Google 帳號多要一個「查看試算表」的權限，只讀不寫。 ──
  function sheetToken() {
    need();
    var p = new g.firebase.auth.GoogleAuthProvider();
    p.addScope('https://www.googleapis.com/auth/spreadsheets.readonly');
    if (user.email) p.setCustomParameters({ login_hint: user.email });
    return auth.currentUser.reauthenticateWithPopup(p).then(function (r) {
      var t = r && r.credential && r.credential.accessToken;
      if (!t) { var e = new Error('no-token'); e.code = 'sheets/no-token'; throw e; }
      return t;
    });
  }
  function readSheet(id, token) {
    var base = 'https://sheets.googleapis.com/v4/spreadsheets/' + encodeURIComponent(id), opt = { headers: { Authorization: 'Bearer ' + token } };
    function json(r) { if (!r.ok) { var e = new Error('sheets-' + r.status); e.code = 'sheets/' + r.status; throw e; } return r.json(); }
    return fetch(base + '?fields=' + encodeURIComponent('sheets.properties(sheetId,title)'), opt).then(json).then(function (m) {
      var ps = (m.sheets || []).map(function (x) { return x.properties; });
      if (!ps.length) return [];
      var q = ps.map(function (p) { return 'ranges=' + encodeURIComponent("'" + String(p.title).replace(/'/g, "''") + "'"); }).join('&');
      return fetch(base + '/values:batchGet?majorDimension=ROWS&valueRenderOption=FORMATTED_VALUE&' + q, opt).then(json).then(function (v) {
        return ps.map(function (p, i) { return { gid: String(p.sheetId), title: String(p.title), rows: ((v.valueRanges || [])[i] || {}).values || [] }; });
      });
    });
  }

  g.JteCloud = { init: init, signIn: signIn, signOut: signOut, compress: compress, listInsp: listInsp,
    saveInsp: saveInsp, deletePhoto: deletePhoto, deleteInsp: deleteInsp, wipeAll: wipeAll,
    signUpEmail: signUpEmail, signInEmail: signInEmail, resendVerify: resendVerify, resetPw: resetPw, refreshUser: refreshUser,
    listActs: listActs, decideAct: decideAct, isAdmin: isAdmin, sessionActs: sessionActs, writeActs: writeActs, sheetToken: function () { return safe(sheetToken); }, readSheet: readSheet,
    setInspItem: setInspItem, pracLoad: pracLoad, pracHas: pracHas, pracPut: pracPut, pracDel: pracDel, pracDelItem: pracDelItem,
    pracUpload: pracUpload, pracWipe: pracWipe };
})(window);
