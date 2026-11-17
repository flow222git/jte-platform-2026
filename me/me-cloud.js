/* 我的練息場 /me — 雲端靈感（Firebase Auth + Firestore）
 * 只有「放了照片的靈感」會進來。路徑以 uid 為鑰：users/{uid}/inspirations、users/{uid}/photos。
 * Firebase 專案是 lianxichang-me（/me 專用；平台其他工具用的是另一個專案 jointoenjoy，這裡不碰它）。
 * 依賴 vendor/ 的 firebase compat 與 canvas，不進自動測試；驗證方式見計畫 Task 7。 */
(function (g) {
  var CFG = { apiKey: 'AIzaSyCxogQ_5H43cRGl4QWXvHhWFYgwxM6bLHM', authDomain: 'lianxichang-me.firebaseapp.com', projectId: 'lianxichang-me',
    storageBucket: 'lianxichang-me.firebasestorage.app', messagingSenderId: '531763902352', appId: '1:531763902352:web:6f995c86625cf2cd4b2515' };
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
