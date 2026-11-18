/* 全站共用的風格切換：簡潔（simple，預設）／手帳（sketch）。
   在 <head> 裡同步載入（不加 defer），頁面畫出來之前就把 <html data-theme> 設好，不會先閃一下另一種風格。
   偏好只存在這台裝置的 localStorage（jte_theme_v1），不上傳、不跟著帳號。
   規格：docs/superpowers/specs/2026-11-17-platform-style-switch-design.md */
(function (g) {
  'use strict';
  var KEY = 'jte_theme_v1';
  var NAMES = { simple: '簡潔', sketch: '手帳' };
  var LABEL = '網站風格';
  var mounts = [];

  function normalize(v) { return v === 'sketch' ? 'sketch' : 'simple'; }
  function read() { try { return g.localStorage.getItem(KEY); } catch (e) { return null; } }
  function get() { return normalize(read()); }
  function apply(name) {
    var d = g.document && g.document.documentElement;
    if (d) d.setAttribute('data-theme', name);
    mounts.forEach(paint);
  }
  function set(name) {
    var n = normalize(name);
    try { g.localStorage.setItem(KEY, n); } catch (e) { /* 不能存就只在這一次有效 */ }
    apply(n);
    return n;
  }
  function current() {
    var d = g.document && g.document.documentElement;
    return normalize(d && d.getAttribute('data-theme'));
  }
  function paint(el) {
    var now = current(), h = '';
    Object.keys(NAMES).forEach(function (k) {
      h += '<button type="button" data-theme-pick="' + k + '" aria-pressed="' + (k === now) + '">' + NAMES[k] + '</button>';
    });
    el.innerHTML = h;
  }
  // 在指定的元素裡畫出切換鈕（簡潔｜手帳）。樣式由 jte-theme.css 的 .jte-theme-switch 提供。
  function mount(el) {
    if (!el) return;
    el.className = (el.className ? el.className + ' ' : '') + 'jte-theme-switch';
    el.setAttribute('role', 'group');
    el.setAttribute('aria-label', LABEL);
    el.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-theme-pick]') : null;
      if (b) set(b.getAttribute('data-theme-pick'));
    });
    mounts.push(el);
    paint(el);
  }

  apply(get());
  // 另一個分頁改了風格，這一頁跟著換。
  if (g.addEventListener) g.addEventListener('storage', function (e) { if (e.key === KEY) apply(normalize(e.newValue)); });

  g.JteTheme = { get: get, set: set, normalize: normalize, mount: mount, names: NAMES, KEY: KEY };
})(window);
