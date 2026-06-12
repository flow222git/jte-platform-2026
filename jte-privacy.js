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
    try { root.sessionStorage.setItem(k, v); if (remember) root.localStorage.setItem(k, v); }
    catch(e){ try { root.console && root.console.warn('jte-privacy: 無法寫入 DEK 快取（storage 失敗）'); } catch(e2){} }
  }
  // 掃除所有 jte_dek_ 開頭的快取 key（防跨帳號殘留）
  function _purgeAllDek(){
    [root.sessionStorage, root.localStorage].forEach(function (st){
      try {
        var rm = [];
        for (var i = 0; i < st.length; i++){ var k = st.key(i); if (k && k.indexOf('jte_dek_') === 0) rm.push(k); }
        rm.forEach(function (k){ st.removeItem(k); });
      } catch(e){}
    });
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

  // —— 私密欄位加解密（用 session DEK，逐欄位 chain）——
  function encryptPrivate(obj){
    var dek = _loadCachedDek();
    if (!dek) return Promise.reject(new Error('locked'));
    var keys = Object.keys(obj || {}), out = {}, chain = Promise.resolve();
    keys.forEach(function (k){ chain = chain.then(function (){ return root.JteCrypto.encryptField(dek, String(obj[k])).then(function (f){ out[k] = f; }); }); });
    return chain.then(function (){ return out; });
  }
  function decryptPrivate(obj){
    var dek = _loadCachedDek();
    if (!dek) return Promise.reject(new Error('locked'));
    var keys = Object.keys(obj || {}), out = {}, chain = Promise.resolve();
    keys.forEach(function (k){
      var v = obj[k];
      if (v && typeof v === 'object' && v.iv && v.ct){
        chain = chain.then(function (){ return root.JteCrypto.decryptField(dek, v).then(function (p){ out[k] = p; }).catch(function (){ out[k] = null; }); });
      } else { out[k] = v; } // 非密文（向後相容明文）原樣保留
    });
    return chain.then(function (){ return out; });
  }

  // ===================================================================
  //  DOM modal（設定／解鎖／重設）—— 視覺風格參照 jte-userbar.js
  //  每個對外方法回傳 Promise：完成 resolve、取消 reject(new Error('cancelled'))。
  //  modal 開啟時把當前 resolve/reject 掛到模組變數，測試鉤子 _modalSubmitX
  //  即呼叫對應 _doX 後 resolve 並關閉 modal（讓測試可程式驅動、不靠人手點）。
  // ===================================================================
  var _doc = root.document;
  var _modalEl = null, _modalResolve = null, _modalReject = null;
  var _recoveryConfirm = null; // 恢復碼畫面顯示後，等同使用者按「完成」的動作（測試鉤子用）

  function injectStyles(){
    if (!_doc || _doc.getElementById('jte-privacy-style')) return;
    var s = _doc.createElement('style');
    s.id = 'jte-privacy-style';
    s.textContent = [
      '#jte-privacy-overlay{position:fixed;inset:0;z-index:2147483640;background:rgba(8,20,38,.46);',
      '-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;',
      'padding:18px;font-family:-apple-system,BlinkMacSystemFont,"Noto Sans TC",sans-serif}',
      '#jte-privacy-modal{background:#fff;border-radius:18px;box-shadow:0 18px 50px rgba(0,0,0,.28);',
      'width:100%;max-width:360px;padding:22px 22px 18px;box-sizing:border-box;color:#1f2d3d}',
      '#jte-privacy-modal h3{margin:0 0 6px;font-size:17px;color:#003D7C;font-weight:700}',
      '#jte-privacy-modal p.sub{margin:0 0 16px;font-size:12.5px;color:#6B7A8D;line-height:1.6}',
      '#jte-privacy-modal label{display:block;font-size:12px;color:#003D7C;margin:10px 0 4px;font-weight:600}',
      '#jte-privacy-modal input[type=password],#jte-privacy-modal input[type=text]{width:100%;box-sizing:border-box;',
      'border:1px solid rgba(0,61,124,.22);border-radius:10px;padding:10px 12px;font-size:14px;color:#1f2d3d;outline:none}',
      '#jte-privacy-modal input:focus{border-color:#003D7C}',
      '#jte-privacy-modal .err{color:#C0392B;font-size:12px;margin:8px 0 0;min-height:0}',
      '#jte-privacy-modal .row{display:flex;align-items:center;gap:7px;margin:12px 0 0;font-size:12.5px;color:#43536B}',
      '#jte-privacy-modal .row input{width:auto;margin:0}',
      '#jte-privacy-modal .reccode{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:15px;letter-spacing:1px;',
      'background:#F2F6FB;border:1px dashed rgba(0,61,124,.30);border-radius:10px;padding:12px;text-align:center;',
      'color:#003D7C;word-break:break-all;margin:6px 0 4px}',
      '#jte-privacy-modal .btns{display:flex;gap:8px;margin-top:18px}',
      '#jte-privacy-modal button{flex:1;border:none;border-radius:999px;padding:11px;font-size:13.5px;font-weight:600;cursor:pointer}',
      '#jte-privacy-modal button:disabled{opacity:.5;cursor:not-allowed}',
      '#jte-privacy-modal .primary{background:#003D7C;color:#fff}',
      '#jte-privacy-modal .ghost{background:#F2F4F7;color:#003D7C}',
      '#jte-privacy-modal .link{background:none;color:#003D7C;text-decoration:underline;font-size:12.5px;padding:8px 0;flex:0 0 auto;font-weight:500}'
    ].join('');
    _doc.head.appendChild(s);
  }

  function _closeModal(){
    if (_modalEl && _modalEl.parentNode) _modalEl.parentNode.removeChild(_modalEl);
    _modalEl = null; _modalResolve = null; _modalReject = null; _recoveryConfirm = null;
  }
  function _openOverlay(){
    injectStyles();
    var ov = _doc.createElement('div');
    ov.id = 'jte-privacy-overlay';
    var card = _doc.createElement('div');
    card.id = 'jte-privacy-modal';
    ov.appendChild(card);
    _doc.body.appendChild(ov);
    _modalEl = ov; // overlay 為移除單位
    return card;
  }
  function _cancel(){
    var rej = _modalReject;
    _closeModal();
    if (rej) rej(new Error('cancelled'));
  }
  function _resolveWith(val){
    var res = _modalResolve;
    _closeModal();
    if (res) res(val);
  }

  function _esc(s){ return String(s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }

  function _downloadRecovery(code){
    try {
      var blob = new root.Blob(['練息場 私密同步 恢復碼\n\n' + code + '\n\n忘記密語時用它重設；我們沒有副本。'], { type: 'text/plain' });
      var url = root.URL.createObjectURL(blob);
      var a = _doc.createElement('a');
      a.href = url; a.download = 'jte-recovery-code.txt';
      _doc.body.appendChild(a); a.click(); _doc.body.removeChild(a);
      setTimeout(function(){ try { root.URL.revokeObjectURL(url); } catch(e){} }, 1000);
    } catch(e){}
  }

  // —— 恢復碼顯示畫面（啟用/重設成功後）——
  function _showRecoveryScreen(card, code, onDone){
    card.innerHTML =
      '<h3>已啟用私密同步</h3>' +
      '<p class="sub">請妥善保存下面的恢復碼。忘記密語時，只有它能幫你重設——我們沒有副本。</p>' +
      '<div class="reccode" id="jte-rec">' + _esc(code) + '</div>' +
      '<div class="row"><input type="checkbox" id="jte-rec-saved"><label for="jte-rec-saved" style="margin:0;font-weight:500;color:#43536B">我已安全保存恢復碼</label></div>' +
      '<p class="err" id="jte-rec-err"></p>' +
      '<div class="btns">' +
        '<button class="ghost" id="jte-rec-dl" type="button">下載 .txt</button>' +
        '<button class="primary" id="jte-rec-ok" type="button" disabled>完成</button>' +
      '</div>';
    var dl = card.querySelector('#jte-rec-dl');
    var ok = card.querySelector('#jte-rec-ok');
    var cb = card.querySelector('#jte-rec-saved');
    dl.onclick = function(){ _downloadRecovery(code); };
    cb.onchange = function(){ ok.disabled = !cb.checked; };
    ok.onclick = function(){ if (!cb.checked) return; onDone(); };
    // 測試鉤子用：等同使用者勾「我已保存」＋按「完成」。
    // 仍走真實閘門：先勾選 checkbox（解除 disabled），再走 onclick 路徑（含 cb.checked 判斷）。
    _recoveryConfirm = function(){
      cb.checked = true; ok.disabled = false; // 等同使用者勾選
      ok.onclick();                            // 走與真人相同的完成路徑（含閘門判斷）
      return Promise.resolve(true);
    };
  }

  // —— enable() ——
  function _buildEnable(card){
    card.innerHTML =
      '<h3>啟用私密同步</h3>' +
      '<p class="sub">設定一組密語來保護你的私密書寫。密語只留在你的裝置，伺服器無法解開內容。</p>' +
      '<label for="jte-en-p1">密語（至少 8 字）</label>' +
      '<input type="password" id="jte-en-p1" autocomplete="new-password">' +
      '<label for="jte-en-p2">再次輸入密語</label>' +
      '<input type="password" id="jte-en-p2" autocomplete="new-password">' +
      '<p class="err" id="jte-en-err"></p>' +
      '<div class="btns">' +
        '<button class="ghost" id="jte-en-cancel" type="button">取消</button>' +
        '<button class="primary" id="jte-en-ok" type="button">下一步</button>' +
      '</div>';
    card.querySelector('#jte-en-cancel').onclick = _cancel;
    card.querySelector('#jte-en-ok').onclick = function(){
      var p1 = card.querySelector('#jte-en-p1').value;
      var p2 = card.querySelector('#jte-en-p2').value;
      _submitEnable(p1, p2);
    };
  }
  function _submitEnable(p1, p2){
    if (!_modalEl) return Promise.reject(new Error('no-modal'));
    var card = _modalEl.querySelector('#jte-privacy-modal');
    var err = card.querySelector('#jte-en-err');
    function fail(msg){ if (err) err.textContent = msg; return Promise.reject(new Error(msg)); }
    if (!p1 || p1.length < 8) return fail('密語至少 8 個字');
    if (p1 !== p2) return fail('兩次密語不一致');
    if (err) err.textContent = '';
    return _doEnable(p1).then(function (recoveryCode){
      _showRecoveryScreen(card, recoveryCode, function(){ _resolveWith(true); });
      return recoveryCode;
    }).catch(function (e){ if (err) err.textContent = '啟用失敗，請再試一次'; throw e; });
  }
  // 測試鉤子用：等同使用者在恢復碼畫面勾「我已保存」＋按「完成」。
  // 走真實閘門：未顯示恢復碼畫面或未勾選 → reject，程式中不存在任何繞過閘門的捷徑。
  function _confirmRecoverySaved(){
    if (typeof _recoveryConfirm !== 'function') return Promise.reject(new Error('no-recovery-screen'));
    return _recoveryConfirm();
  }

  // —— unlock() ＋ 忘記密語→恢復 ——
  function _buildUnlock(card){
    card.innerHTML =
      '<h3>解鎖私密同步</h3>' +
      '<p class="sub">輸入你的密語以解鎖這台裝置上的私密內容。</p>' +
      '<label for="jte-un-p">密語</label>' +
      '<input type="password" id="jte-un-p" autocomplete="current-password">' +
      '<div class="row"><input type="checkbox" id="jte-un-remember"><label for="jte-un-remember" style="margin:0;font-weight:500;color:#43536B">記住這台裝置（信任的私人裝置才勾）</label></div>' +
      '<p class="err" id="jte-un-err"></p>' +
      '<div class="btns">' +
        '<button class="ghost" id="jte-un-cancel" type="button">取消</button>' +
        '<button class="primary" id="jte-un-ok" type="button">解鎖</button>' +
      '</div>' +
      '<div style="text-align:center"><button class="link" id="jte-un-forgot" type="button">忘記密語？用恢復碼重設</button></div>';
    card.querySelector('#jte-un-cancel').onclick = _cancel;
    card.querySelector('#jte-un-ok').onclick = function(){
      var pw = card.querySelector('#jte-un-p').value;
      var rem = card.querySelector('#jte-un-remember').checked;
      _submitUnlock(pw, rem);
    };
    card.querySelector('#jte-un-forgot').onclick = function(){ _buildRecover(card); };
  }
  function _submitUnlock(pw, remember){
    if (!_modalEl) return Promise.reject(new Error('no-modal'));
    var card = _modalEl.querySelector('#jte-privacy-modal');
    var err = card.querySelector('#jte-un-err');
    if (err) err.textContent = '';
    return _doUnlock(pw, !!remember).then(function (){ _resolveWith(true); return true; })
      .catch(function (e){ if (err) err.textContent = '密語不對，請再試一次'; throw e; });
  }

  function _buildRecover(card){
    card.innerHTML =
      '<h3>用恢復碼重設密語</h3>' +
      '<p class="sub">輸入啟用時保存的恢復碼，並設定一組新密語。</p>' +
      '<label for="jte-rc-code">恢復碼</label>' +
      '<input type="text" id="jte-rc-code" autocomplete="off" spellcheck="false">' +
      '<label for="jte-rc-p1">新密語（至少 8 字）</label>' +
      '<input type="password" id="jte-rc-p1" autocomplete="new-password">' +
      '<label for="jte-rc-p2">再次輸入新密語</label>' +
      '<input type="password" id="jte-rc-p2" autocomplete="new-password">' +
      '<p class="err" id="jte-rc-err"></p>' +
      '<div class="btns">' +
        '<button class="ghost" id="jte-rc-cancel" type="button">取消</button>' +
        '<button class="primary" id="jte-rc-ok" type="button">重設並解鎖</button>' +
      '</div>';
    card.querySelector('#jte-rc-cancel').onclick = _cancel;
    card.querySelector('#jte-rc-ok').onclick = function(){
      _submitRecover(card.querySelector('#jte-rc-code').value,
                     card.querySelector('#jte-rc-p1').value,
                     card.querySelector('#jte-rc-p2').value);
    };
  }
  function _submitRecover(code, p1, p2){
    if (!_modalEl) return Promise.reject(new Error('no-modal'));
    var card = _modalEl.querySelector('#jte-privacy-modal');
    var err = card.querySelector('#jte-rc-err');
    function fail(msg){ if (err) err.textContent = msg; return Promise.reject(new Error(msg)); }
    if (!code) return fail('請輸入恢復碼');
    if (!p1 || p1.length < 8) return fail('新密語至少 8 個字');
    if (p1 !== p2) return fail('兩次新密語不一致');
    if (err) err.textContent = '';
    return _doRecover(code, p1).then(function (){ _resolveWith(true); return true; })
      .catch(function (e){ if (err) err.textContent = '恢復碼不對或重設失敗'; throw e; });
  }

  // —— changePassphrase()：先確保解鎖，再輸入新密語 ×2 ——
  function _buildChange(card){
    card.innerHTML =
      '<h3>更換密語</h3>' +
      '<p class="sub">設定一組新密語。舊密語將失效；恢復碼仍可用。</p>' +
      '<label for="jte-ch-p1">新密語（至少 8 字）</label>' +
      '<input type="password" id="jte-ch-p1" autocomplete="new-password">' +
      '<label for="jte-ch-p2">再次輸入新密語</label>' +
      '<input type="password" id="jte-ch-p2" autocomplete="new-password">' +
      '<p class="err" id="jte-ch-err"></p>' +
      '<div class="btns">' +
        '<button class="ghost" id="jte-ch-cancel" type="button">取消</button>' +
        '<button class="primary" id="jte-ch-ok" type="button">更換</button>' +
      '</div>';
    card.querySelector('#jte-ch-cancel').onclick = _cancel;
    card.querySelector('#jte-ch-ok').onclick = function(){
      _submitChange(card.querySelector('#jte-ch-p1').value, card.querySelector('#jte-ch-p2').value);
    };
  }
  function _submitChange(p1, p2){
    if (!_modalEl) return Promise.reject(new Error('no-modal'));
    var card = _modalEl.querySelector('#jte-privacy-modal');
    var err = card.querySelector('#jte-ch-err');
    function fail(msg){ if (err) err.textContent = msg; return Promise.reject(new Error(msg)); }
    if (!p1 || p1.length < 8) return fail('新密語至少 8 個字');
    if (p1 !== p2) return fail('兩次新密語不一致');
    if (err) err.textContent = '';
    return _doChange(p1).then(function (){ _resolveWith(true); return true; })
      .catch(function (e){ if (err) err.textContent = '更換失敗，請再試一次'; throw e; });
  }

  function enable(){
    return new Promise(function (resolve, reject){
      _closeModal();
      _modalResolve = resolve; _modalReject = reject;
      _buildEnable(_openOverlay());
    });
  }
  function unlock(){
    return new Promise(function (resolve, reject){
      _closeModal();
      _modalResolve = resolve; _modalReject = reject;
      _buildUnlock(_openOverlay());
    });
  }
  function changePassphrase(){
    var self = root.JtePrivacy;
    var start = self.isUnlocked() ? Promise.resolve(true) : unlock();
    return start.then(function (){
      return new Promise(function (resolve, reject){
        _closeModal();
        _modalResolve = resolve; _modalReject = reject;
        _buildChange(_openOverlay());
      });
    });
  }

  // —— 公開 API（無條件導出，正式站使用）——
  root.JtePrivacy = {
    isEnabled: function (){ return loadBlob().then(function (x){ return !!x; }); },
    isUnlocked: function (){ return !!_loadCachedDek(); },
    lock: function (){ _dek = null; _purgeAllDek(); },
    encryptPrivate: encryptPrivate, decryptPrivate: decryptPrivate,
    enable: enable, unlock: unlock, changePassphrase: changePassphrase
  };

  // —— 測試／內部鉤子：只有測試旗標開啟時才掛上 global，正式站不存在 ——
  // （測試頁在載入本檔的 <script> 前用 inline script 設 window.__JTE_PRIVACY_TEST = true）
  if (root.__JTE_PRIVACY_TEST === true){
    root.JtePrivacy._setBackend = function (b){ _backend = b; };
    root.JtePrivacy._reset = function (){ _backend = null; _dek = null; _closeModal(); };
    root.JtePrivacy._doEnable = _doEnable;
    root.JtePrivacy._doUnlock = _doUnlock;
    root.JtePrivacy._doRecover = _doRecover;
    root.JtePrivacy._doChange = _doChange;
    // modal 測試鉤子：等同使用者在 modal 內按送出
    root.JtePrivacy._modalSubmitEnable = function (p1, p2){ return _submitEnable(p1, p2); };
    root.JtePrivacy._modalConfirmRecoverySaved = function (){ return _confirmRecoverySaved(); };
    root.JtePrivacy._modalSubmitUnlock = function (pw, remember){ return _submitUnlock(pw, remember); };
    root.JtePrivacy._modalSubmitRecover = function (code, p1, p2){ return _submitRecover(code, p1, p2); };
    root.JtePrivacy._modalSubmitChange = function (p1, p2){ return _submitChange(p1, p2); };
  }

  // —— 模組載入時：若已登出（無 jte_user_email），掃除所有殘留 DEK 快取 ——
  try {
    if (!(root.localStorage.getItem('jte_user_email') || '').trim()) _purgeAllDek();
  } catch(e){}
})(typeof window !== 'undefined' ? window : this);
