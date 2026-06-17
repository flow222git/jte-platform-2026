/* Octenso 全站統一導覽（唯一一套，放在每頁底部）
 * 把所有功能分三組——測驗 / 認識 / 我的——讓使用者從任何頁一鍵到任何功能，
 * 並補上「回八態能格首頁」與回饋入口。學習頁(系統圖/說明/FAQ/歷程)也一起在內，雙向可達。
 * 設計：細框、墨字、留白（對齊 DESIGN-PRINCIPLES 與全站按鈕）。
 * 與 octenso-gate.js 同樣在 iframe 內略過（測試頁用 iframe 載入，避免干擾斷言）。
 */
(function(){
  'use strict';
  if(window.self!==window.top) return;        // iframe（測試）內不注入
  if(document.getElementById('oc-nav')) return; // 防重複

  var path=(location.pathname||'');
  var file=path.substring(path.lastIndexOf('/')+1) || 'index.html';
  if(file==='') file='index.html';

  // 三組功能（雙人合盤 → persona 並自動開合盤）
  var GROUPS=[
    {lab:'測驗', items:[
      {file:'bagua-persona.html', href:'bagua-persona.html',        label:'底色測驗'},
      {file:'bagua-field.html',   href:'bagua-field.html',          label:'測一個局'},
      {file:'bagua-career.html',  href:'bagua-career.html',         label:'職業配對'},
      {file:'__compat__',         href:'bagua-persona.html#compat', label:'雙人合盤'},
      {file:'bagua-team.html',    href:'bagua-team.html',           label:'團隊合盤'}
    ]},
    {lab:'認識', items:[
      {file:'bagua-map.html',      href:'bagua-map.html',      label:'系統圖'},
      {file:'bagua-guide.html',    href:'bagua-guide.html',    label:'說明 · FAQ'},
      {file:'octenso-journey.html',href:'octenso-journey.html',label:'專案歷程'}
    ]},
    {lab:'我的', items:[
      {file:'bagua-records.html', href:'bagua-records.html', label:'我的記錄'}
    ]}
  ];

  var css=''
    +'#oc-nav{max-width:600px;margin:40px auto 8px;padding:20px 16px 4px;border-top:1px solid var(--line,#d2c7b4);'
    +'font-family:ui-sans-serif,system-ui,sans-serif;text-align:center}'
    +'#oc-nav .oc-grp{margin-bottom:15px}'
    +'#oc-nav .oc-glab{font-size:10px;letter-spacing:.22em;color:var(--muted,#857c6d);text-transform:uppercase;margin-bottom:8px}'
    +'#oc-nav .oc-pills{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}'
    +'#oc-nav a.oc-pill,#oc-nav span.oc-pill{display:inline-block;font-size:13px;letter-spacing:.04em;'
    +'padding:7px 15px;border-radius:999px;border:1px solid var(--hair,#bcb09a);background:transparent;'
    +'color:var(--ink,#23241f);text-decoration:none;transition:background .15s,border-color .15s}'
    +'#oc-nav a.oc-pill:hover{background:var(--surface,#fffdf6);border-color:var(--ink,#23241f)}'
    +'#oc-nav span.oc-pill.cur{color:var(--muted,#857c6d);border-color:var(--line,#d2c7b4);background:var(--surface,#fffdf6);cursor:default}'
    +'#oc-nav .oc-foot{margin-top:14px;padding-top:14px;border-top:1px solid var(--line,#d2c7b4);font-size:12.5px;color:var(--muted,#857c6d)}'
    +'#oc-nav .oc-foot a{color:var(--pine,#35614f);text-decoration:none;border-bottom:1px solid var(--hair,#bcb09a);padding-bottom:1px}'
    +'#oc-nav .oc-foot a:hover{border-bottom-color:var(--pine,#35614f)}'
    +'#oc-nav .oc-sep{color:var(--hair,#bcb09a);margin:0 9px}';
  var st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);

  function pill(it){
    if(it.file===file) return '<span class="oc-pill cur" aria-current="page">'+it.label+'</span>';
    return '<a class="oc-pill" href="'+it.href+'">'+it.label+'</a>';
  }
  var groupsHtml=GROUPS.map(function(g){
    return '<div class="oc-grp"><div class="oc-glab">'+g.lab+'</div>'
      +'<div class="oc-pills">'+g.items.map(pill).join('')+'</div></div>';
  }).join('');

  // 首頁連結（在門面時標示為當前、不可點）
  var isHome=(file==='index.html');
  var homeHtml=isHome ? '<span style="color:var(--muted,#857c6d)">八態能格首頁</span>'
                      : '<a href="index.html">← 八態能格首頁</a>';

  var nav=document.createElement('nav');
  nav.id='oc-nav'; nav.setAttribute('aria-label','八態能格 導覽');
  nav.innerHTML=groupsHtml
    +'<div class="oc-foot">'+homeHtml+'<span class="oc-sep">·</span>'
    +'測試版 <a href="octenso-feedback.html">給我們回饋 →</a></div>';
  document.body.appendChild(nav);
})();
