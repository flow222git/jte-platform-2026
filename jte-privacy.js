// jte-privacy.js — 全平台私密書寫共用「隱私同步整合層」
// 載入：<script defer src="https://flow222git.github.io/jte-platform-2026/jte-privacy.js"></script>
// 依賴 window.JteCrypto（jte-crypto.js）與 firebase（9.23 compat，各頁已載入）。
// 把 DEK 與密語明文留在使用者裝置；Firestore 只存包好的金鑰 blob。
(function (root) {
  'use strict';
  if (root.__jtePrivacyLoaded) return;
  root.__jtePrivacyLoaded = true;

  var _backend = null; // {db, email} —— 測試可注入；正式由 _liveBackend() 取得
  var _dek = null;     // 當前 session 的 DEK（Uint8Array），未解鎖為 null

  function _liveBackend(){
    var email = (root.localStorage.getItem('jte_user_email') || '').toLowerCase().trim();
    var db = (root.firebase && root.firebase.firestore) ? root.firebase.firestore() : null;
    return { db: db, email: email };
  }
  function backend(){ return _backend || _liveBackend(); }

  // —— Firestore blob 存取（users/{email}.crypto）——
  function loadBlob(){
    var b = backend();
    if (!b.db || !b.email) return Promise.resolve(null);
    return b.db.collection('users').doc(b.email).get()
      .then(function (snap){ return (snap.exists && snap.data() && snap.data().crypto) || null; })
      .catch(function (){ return null; });
  }
  function saveBlob(blob){
    var b = backend();
    if (!b.db || !b.email) return Promise.reject(new Error('no-user'));
    return b.db.collection('users').doc(b.email).set({ crypto: blob }, { merge: true });
  }

  // —— session DEK 快取（記憶體＋sessionStorage；remember 另寫 localStorage）——
  function _dekKey(){ return 'jte_dek_' + backend().email; }
  function _b64(u){ var s=''; for (var i=0;i<u.length;i++) s+=String.fromCharCode(u[i]); return btoa(s); }
  function _ub64(str){ var bin=atob(str), u=new Uint8Array(bin.length); for (var i=0;i<bin.length;i++) u[i]=bin.charCodeAt(i); return u; }
  function _cacheDek(dek, remember){
    _dek = dek; var k=_dekKey(), v=_b64(dek);
    try { root.sessionStorage.setItem(k, v); if (remember) root.localStorage.setItem(k, v); } catch(e){}
  }
  function _loadCachedDek(){
    if (_dek) return _dek;
    try { var v = root.localStorage.getItem(_dekKey()) || root.sessionStorage.getItem(_dekKey());
          if (v) { _dek = _ub64(v); } } catch(e){}
    return _dek;
  }

  // —— 非 DOM 核心邏輯（modal 只負責收輸入再呼叫這些）——
  function _doEnable(passphrase){
    return root.JteCrypto.setup(passphrase).then(function (s){
      return saveBlob(s.blob).then(function (){ _cacheDek(s.dek, false); return s.recoveryCode; });
    });
  }
  function _doUnlock(passphrase, remember){
    return loadBlob().then(function (blob){
      if (!blob) return Promise.reject(new Error('not-enabled'));
      return root.JteCrypto.unlockWithPassphrase(passphrase, blob).then(function (dek){ _cacheDek(dek, !!remember); return true; });
    });
  }
  function _doRecover(recoveryCode, newPassphrase){
    return loadBlob().then(function (blob){
      if (!blob) return Promise.reject(new Error('not-enabled'));
      return root.JteCrypto.unlockWithRecovery(recoveryCode, blob).then(function (dek){
        return root.JteCrypto.rewrapPassphrase(dek, newPassphrase, blob).then(function (nb){
          return saveBlob(nb).then(function (){ _cacheDek(dek, false); return true; });
        });
      });
    });
  }
  function _doChange(newPassphrase){
    var dek = _loadCachedDek();
    if (!dek) return Promise.reject(new Error('locked'));
    return loadBlob().then(function (blob){
      return root.JteCrypto.rewrapPassphrase(dek, newPassphrase, blob).then(function (nb){ return saveBlob(nb).then(function (){ return true; }); });
    });
  }

  root.JtePrivacy = {
    _setBackend: function (b){ _backend = b; },
    _reset: function (){ _backend = null; _dek = null; },
    isEnabled: function (){ return loadBlob().then(function (x){ return !!x; }); },
    isUnlocked: function (){ return !!_loadCachedDek(); },
    lock: function (){ _dek = null; try { root.sessionStorage.removeItem(_dekKey()); root.localStorage.removeItem(_dekKey()); } catch(e){} },
    _doEnable: _doEnable, _doUnlock: _doUnlock, _doRecover: _doRecover, _doChange: _doChange
    // 其餘 API 於後續 Task 補上
  };
})(typeof window !== 'undefined' ? window : this);
