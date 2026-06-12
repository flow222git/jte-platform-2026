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

  root.JtePrivacy = {
    _setBackend: function (b){ _backend = b; },
    _reset: function (){ _backend = null; _dek = null; }
    // 其餘 API 於後續 Task 補上
  };
})(typeof window !== 'undefined' ? window : this);
