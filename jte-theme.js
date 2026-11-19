/* 全站共用的風格切換：簡潔（simple，預設）／手帳（sketch）／手繪（doodle）。
   在 <head> 裡同步載入（不加 defer），頁面畫出來之前就把 <html data-theme> 設好，不會先閃一下另一種風格。
   偏好只存在這台裝置的 localStorage（jte_theme_v1），不上傳、不跟著帳號。
   規格：docs/superpowers/specs/2026-11-17-platform-style-switch-design.md */
(function (g) {
  'use strict';
  var KEY = 'jte_theme_v1';
  var NAMES = { simple: '簡潔', sketch: '手帳', doodle: '手繪' };
  var LABEL = '網站風格', WORD = '風格';
  var mounts = [];

  function normalize(v) { return typeof v === 'string' && Object.prototype.hasOwnProperty.call(NAMES, v) ? v : 'simple'; }
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
  function next(name) { var ks = Object.keys(NAMES); return ks[(ks.indexOf(normalize(name)) + 1) % ks.length]; }
  function paint(el) {
    var now = current(), nx = next(now);
    el.innerHTML = '<button type="button" data-theme-next="' + nx + '" aria-label="' + LABEL + '：現在是' + NAMES[now] + '，按一下換成' + NAMES[nx] + '">' + WORD + '<b>' + NAMES[now] + '</b></button>';
  }
  // 在指定的元素裡畫出一顆「風格」鈕，上面寫現在是哪一種，按一下換下一種。樣式由 jte-theme.css 的 .jte-theme-switch 提供。
  function mount(el) {
    if (!el) return;
    el.className = (el.className ? el.className + ' ' : '') + 'jte-theme-switch';
    el.setAttribute('role', 'group');
    el.setAttribute('aria-label', LABEL);
    el.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-theme-next]') : null;
      if (b) { set(b.getAttribute('data-theme-next')); var nb = el.querySelector('button'); if (nb && nb.focus) nb.focus(); }
    });
    mounts.push(el);
    paint(el);
  }

  apply(get());
  // 另一個分頁改了風格，這一頁跟著換。
  if (g.addEventListener) g.addEventListener('storage', function (e) { if (e.key === KEY) apply(normalize(e.newValue)); });

  g.JteTheme = { get: get, set: set, next: next, normalize: normalize, mount: mount, names: NAMES, KEY: KEY };
})(window);
