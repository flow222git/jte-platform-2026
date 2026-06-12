// jte-crypto.js — 全平台私密書寫共用加密核心（信封加密）
// 純函式：只在 bytes/strings 間運算，不碰 localStorage/Firestore/DOM。
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

  // setup 暫時版（Task 3 補完整 blob）：先只回傳 dek 供欄位測試
  async function setup(passphrase){
    return { dek: rand(32) };
  }

  root.JteCrypto = { setup, encryptField, decryptField, _b64: b64, _ub64: ub64, _ITER: ITER, _rand: rand };
})(typeof window !== 'undefined' ? window : this);
