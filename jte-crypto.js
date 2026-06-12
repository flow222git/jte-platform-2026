// jte-crypto.js — 全平台私密書寫共用加密核心（信封加密）
// 載入：<script defer src="https://flow222git.github.io/jte-platform-2026/jte-crypto.js"></script>
// 純函式：只在 bytes/strings 間運算，不碰 localStorage/Firestore/DOM（整合屬 Plan 2）。
// API（皆 async，掛 window.JteCrypto）：
//   setup(passphrase) -> { blob, recoveryCode, dek }
//   unlockWithPassphrase(passphrase, blob) -> Uint8Array(32)   // 錯密語拋例外
//   unlockWithRecovery(recoveryCode, blob) -> Uint8Array(32)   // 碼可含/不含分隔線
//   rewrapPassphrase(dek, newPassphrase, blob) -> blob'
//   encryptField(dek, str) -> { iv, ct }   // 每次隨機 iv
//   decryptField(dek, {iv,ct}) -> str
// blob 可 JSON 序列化，安全存 Firestore；DEK 與密語/恢復碼明文絕不離開瀏覽器。
(function (root) {
  'use strict';
  const TE = new TextEncoder();
  const TD = new TextDecoder();
  const ITER = 250000;

  function rand(n){ return crypto.getRandomValues(new Uint8Array(n)); }
  function b64(bytes){ let s = ''; for (const b of bytes) s += String.fromCharCode(b); return btoa(s); }
  function ub64(str){ const bin = atob(str); const u = new Uint8Array(bin.length); for (let i=0;i<bin.length;i++) u[i] = bin.charCodeAt(i); return u; }

  async function importDek(dekBytes){
    return crypto.subtle.importKey('raw', dekBytes, { name: 'AES-GCM' }, false, ['encrypt','decrypt']);
  }
  async function encryptField(dekBytes, plaintext){
    const key = await importDek(dekBytes);
    const iv = rand(12);
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, TE.encode(plaintext));
    return { iv: b64(iv), ct: b64(new Uint8Array(ct)) };
  }
  async function decryptField(dekBytes, field){
    const key = await importDek(dekBytes);
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: ub64(field.iv) }, key, ub64(field.ct));
    return TD.decode(pt);
  }

  function normalizeCode(code){ return String(code).replace(/[^A-Za-z0-9]/g, '').toUpperCase(); }

  function generateRecoveryCode(){
    const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 32 字元、去除易混的 I O 0 1；32 整除 256 故無 modulo bias
    const r = rand(20);
    let s = '';
    for (let i = 0; i < 20; i++){ s += A[r[i] % A.length]; if (i % 5 === 4 && i < 19) s += '-'; }
    return s;
  }

  async function deriveWrapKey(secret, saltBytes){
    const base = await crypto.subtle.importKey('raw', TE.encode(secret), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: saltBytes, iterations: ITER, hash: 'SHA-256' },
      base,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }
  async function wrapDEK(dekBytes, wrapKey){
    const iv = rand(12);
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, wrapKey, dekBytes);
    return { iv: b64(iv), ct: b64(new Uint8Array(ct)) };
  }
  async function unwrapDEK(wrap, wrapKey){
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: ub64(wrap.iv) }, wrapKey, ub64(wrap.ct));
    return new Uint8Array(pt); // 錯鑰匙時 decrypt 直接拋 OperationError
  }

  async function setup(passphrase){
    const dek = rand(32);
    const salt = rand(16);
    const recoveryCode = generateRecoveryCode();
    const passKey = await deriveWrapKey(passphrase, salt);
    const recKey  = await deriveWrapKey(normalizeCode(recoveryCode), salt);
    const blob = {
      v: 1,
      salt: b64(salt),
      kdf: { name: 'PBKDF2', iterations: ITER, hash: 'SHA-256' },
      wrapPass: await wrapDEK(dek, passKey),
      wrapRec:  await wrapDEK(dek, recKey)
    };
    return { blob, recoveryCode, dek };
  }
  async function unlockWithPassphrase(passphrase, blob){
    const key = await deriveWrapKey(passphrase, ub64(blob.salt));
    return unwrapDEK(blob.wrapPass, key);
  }
  async function unlockWithRecovery(recoveryCode, blob){
    const key = await deriveWrapKey(normalizeCode(recoveryCode), ub64(blob.salt));
    return unwrapDEK(blob.wrapRec, key);
  }
  async function rewrapPassphrase(dekBytes, newPassphrase, blob){
    const passKey = await deriveWrapKey(newPassphrase, ub64(blob.salt));
    return Object.assign({}, blob, { wrapPass: await wrapDEK(dekBytes, passKey) });
  }

  root.JteCrypto = {
    setup, unlockWithPassphrase, unlockWithRecovery, rewrapPassphrase,
    encryptField, decryptField, generateRecoveryCode,
    _normalizeCode: normalizeCode
  };
})(typeof window !== 'undefined' ? window : this);
