/* Octenso 共用功能切換列（全站統一導覽）
 * 注入一條「切換其他功能」的細框 pill 列到每頁底部，讓使用者從任何單元
 * 都能一鍵切到：底色測驗 / 雙人合盤 / 測一個局 / 職業配對 / 團隊合盤 / 我的記錄。
 * 設計：細框、墨字、留白（對齊 DESIGN-PRINCIPLES 與全站按鈕）。
 * 與 octenso-gate.js 同樣在 iframe 內略過（測試頁用 iframe 載入，避免干擾斷言）。
 */
(function(){
  'use strict';
  if(window.self!==window.top) return;        // iframe（測試）內不注入
  if(document.getElementById('oc-nav')) return; // 防重複

  // 目前頁面檔名
  var path=(location.pathname||'');
  var file=path.substring(path.lastIndexOf('/')+1) || 'index.html';
  if(file==='') file='index.html';

  // 切換目的地（雙人合盤 → persona 並自動開合盤；其餘為各工具）
  var ITEMS=[
    {file:'bagua-persona.html', href:'bagua-persona.html',          label:'底色測驗'},
    {file:'__compat__',         href:'bagua-persona.html#compat',   label:'雙人合盤'},
    {file:'bagua-field.html',   href:'bagua-field.html',            label:'測一個局'},
    {file:'bagua-career.html',  href:'bagua-career.html',           label:'職業配對'},
    {file:'bagua-team.html',    href:'bagua-team.html',             label:'團隊合盤'},
    {file:'bagua-records.html', href:'bagua-records.html',          label:'我的記錄'}
  ];

  // 樣式（用各頁既有 token：--ink / --hair / --surface / --muted / --line）
  var css=''
    +'#oc-nav{max-width:600px;margin:34px auto 6px;padding:18px 16px 4px;border-top:1px solid var(--line,#d2c7b4);'
    +'font-family:ui-sans-serif,system-ui,sans-serif;text-align:center}'
    +'#oc-nav .oc-lab{font-size:11px;letter-spacing:.18em;color:var(--muted,#857c6d);text-transform:uppercase;margin-bottom:12px}'
    +'#oc-nav .oc-pills{display:flex;flex-wrap:wrap;gap:9px;justify-content:center}'
    +'#oc-nav a.oc-pill,#oc-nav span.oc-pill{display:inline-block;font-size:13px;letter-spacing:.04em;'
    +'padding:8px 16px;border-radius:999px;border:1px solid var(--hair,#bcb09a);background:transparent;'
    +'color:var(--ink,#23241f);text-decoration:none;transition:background .15s,border-color .15s}'
    +'#oc-nav a.oc-pill:hover{background:var(--surface,#fffdf6);border-color:var(--ink,#23241f)}'
    +'#oc-nav span.oc-pill.cur{color:var(--muted,#857c6d);border-color:var(--line,#d2c7b4);background:var(--surface,#fffdf6);cursor:default}'
    +'#oc-nav .oc-fb{margin-top:16px;font-size:12.5px}'
    +'#oc-nav .oc-fb a{color:var(--pine,#35614f);text-decoration:none;border-bottom:1px solid var(--hair,#bcb09a);padding-bottom:1px}'
    +'#oc-nav .oc-fb a:hover{border-bottom-color:var(--pine,#35614f)}';

  var st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);

  var nav=document.createElement('nav');
  nav.id='oc-nav'; nav.setAttribute('aria-label','切換其他功能');

  var pills=ITEMS.map(function(it){
    var isCur=(it.file===file); // 目前頁 → 不可點，標示為當前
    if(isCur) return '<span class="oc-pill cur" aria-current="page">'+it.label+'</span>';
    return '<a class="oc-pill" href="'+it.href+'">'+it.label+'</a>';
  }).join('');

  nav.innerHTML='<div class="oc-lab">切換其他功能</div><div class="oc-pills">'+pills+'</div>'
    +'<div class="oc-fb">這是測試版 · <a href="octenso-feedback.html">給我們一點回饋 →</a></div>';
  document.body.appendChild(nav);
})();
