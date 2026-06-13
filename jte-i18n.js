/* =====================================================================
   jte-i18n.js — 練息場全平台多語（zh 預設 / en / ja）
   設計：同網域共用 localStorage.jte_lang（跟 SSO 一樣一次切換全站同步）。
   用法：
     1) 頁面引入本檔：<script defer src="...jte-i18n.js"></script>
     2) 提供字典（zh 以原文為準，只需給 en/ja）：
          window.JTE_I18N = { en:{ key:'…' }, ja:{ key:'…' } };
     3) 靜態文字：在元素加屬性
          data-i18n="key"        → 換 textContent
          data-i18n-html="key"   → 換 innerHTML（譯文需自行確保安全）
          data-i18n-ph="key"     → 換 placeholder
          zh 時自動還原首次載入的原文，不需在字典放 zh。
     4) 動態文字（JS 產生）：用 jteT('key','中文原文')；並提供
          window.jteI18nApply(lang) 在語言切換時重繪動態內容。
   切換鈕：自帶一顆固定在右上（userbar 下方）的 中/EN/日 切換；
          只出現在有載入本檔的頁面（已翻譯的頁），不污染其他頁。
   ===================================================================== */
(function () {
  if (window.__jteI18nLoaded) return;
  window.__jteI18nLoaded = true;

  var LANGS = ['zh', 'en', 'ja'];
  var LABEL = { zh: '中', en: 'EN', ja: '日' };

  function dict() { return window.JTE_I18N || {}; }
  function curLang() {
    var l = localStorage.getItem('jte_lang') || 'zh';
    return LANGS.indexOf(l) >= 0 ? l : 'zh';
  }
  // 取譯文：zh 回 null（用原文）；en/ja 查字典，查無回 null（退回原文）
  function trans(key, l) {
    l = l || curLang();
    if (l === 'zh') return null;
    var d = dict()[l];
    return (d && d[key] != null) ? d[key] : null;
  }
  // 動態文字：回譯文，zh 或查無則回中文原文（zhText），再無則回 key
  window.jteT = function (key, zhText) {
    var v = trans(key);
    return v == null ? (zhText != null ? zhText : key) : v;
  };
  window.jteLang = curLang;

  function applyStatic(l) {
    var els = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el.__zh == null) el.__zh = el.textContent;
      var t = trans(el.getAttribute('data-i18n'), l);
      el.textContent = (l === 'zh' || t == null) ? el.__zh : t;
    }
    var h = document.querySelectorAll('[data-i18n-html]');
    for (var j = 0; j < h.length; j++) {
      var eh = h[j];
      if (eh.__zhHtml == null) eh.__zhHtml = eh.innerHTML;
      var th = trans(eh.getAttribute('data-i18n-html'), l);
      eh.innerHTML = (l === 'zh' || th == null) ? eh.__zhHtml : th;
    }
    var p = document.querySelectorAll('[data-i18n-ph]');
    for (var k = 0; k < p.length; k++) {
      var ep = p[k];
      if (ep.__zhPh == null) ep.__zhPh = ep.getAttribute('placeholder') || '';
      var tp = trans(ep.getAttribute('data-i18n-ph'), l);
      ep.setAttribute('placeholder', (l === 'zh' || tp == null) ? ep.__zhPh : tp);
    }
  }

  function apply() {
    var l = curLang();
    document.documentElement.setAttribute('lang', l === 'zh' ? 'zh-Hant' : l);
    applyStatic(l);
    if (typeof window.jteI18nApply === 'function') {
      try { window.jteI18nApply(l); } catch (e) { /* 頁面動態重繪自理 */ }
    }
    renderSwitcher();
  }

  window.jteSetLang = function (l) {
    if (LANGS.indexOf(l) < 0) l = 'zh';
    localStorage.setItem('jte_lang', l);
    apply();
  };

  // —— 語言切換鈕（固定右上、userbar 下方）——
  function injectStyles() {
    if (document.getElementById('jte-i18n-style')) return;
    var s = document.createElement('style');
    s.id = 'jte-i18n-style';
    s.textContent = [
      '#jte-langbar{position:fixed;top:max(44px,calc(env(safe-area-inset-top) + 40px));right:10px;z-index:2147483500;',
      'display:flex;gap:2px;background:rgba(255,255,255,.86);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);',
      'border:1px solid rgba(0,61,124,.14);border-radius:999px;padding:3px;box-shadow:0 2px 8px rgba(0,0,0,.10);',
      'font-family:-apple-system,BlinkMacSystemFont,"Noto Sans TC",sans-serif}',
      '#jte-langbar button{border:none;background:none;cursor:pointer;font-size:12px;line-height:1;color:#5b6270;',
      'padding:5px 9px;border-radius:999px;font-family:inherit}',
      '#jte-langbar button.on{background:#003D7C;color:#fff;font-weight:600}',
      '#jte-langbar button:active{transform:scale(.96)}'
    ].join('');
    document.head.appendChild(s);
  }
  function renderSwitcher() {
    injectStyles();
    var bar = document.getElementById('jte-langbar');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'jte-langbar';
      (document.body || document.documentElement).appendChild(bar);
    }
    var l = curLang();
    bar.innerHTML = LANGS.map(function (code) {
      return '<button type="button" data-lang="' + code + '"' + (code === l ? ' class="on"' : '') + '>' + LABEL[code] + '</button>';
    }).join('');
    var btns = bar.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) {
      btns[i].onclick = (function (code) { return function () { window.jteSetLang(code); }; })(btns[i].getAttribute('data-lang'));
    }
  }

  // 對外：頁面動態重繪後可手動重套靜態翻譯
  window.jteI18nRefresh = apply;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply);
  else apply();
})();
