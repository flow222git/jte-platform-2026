/* Octenso 登入閘門（Google SSO ＋白名單）
   沿用平台 SSO：同網域共用 localStorage.jte_user_email、同一個 GSI client_id。
   ⚠️ 誠實限制：靜態站客戶端閘門＝軟性存取控制，非密碼學級安全（原始碼可下載、關 JS 可繞）。 */
(function(){
  // 測試/嵌入（iframe）內不啟用，避免擋住 .test.html 的 iframe 與正常嵌入
  if (window.self !== window.top) return;

  // ── 白名單（小寫比對）──
  // 失效保險：核心團隊寫死在此，即使 allowlist.json 載入失敗也永遠進得去。
  // 其餘所有人（含 flfm0137 等）由單一來源 allowlist.json 管理（見下方 fetchExtras）。
  var ALLOW = ['flow@jointoenjoy.com','simon@medialand.tw','dabo@jointoenjoy.com','lyn.hsieh@gmail.com','liluyu.tw@gmail.com'];
  var CLIENT_ID = '1052529942242-jvr7ik3f7r987l5lq889nrfkjheoovg7.apps.googleusercontent.com';

  function allowed(email){ return !!email && ALLOW.indexOf(String(email).trim().toLowerCase()) >= 0; }

  var ov=null;
  function lockScroll(){ try{ document.documentElement.style.overflow='hidden'; }catch(e){} }
  function unlock(){ try{ document.documentElement.style.overflow=''; }catch(e){} }
  function ensureOverlay(){
    if(ov) return ov;
    ov=document.createElement('div');
    ov.id='octenso-gate';
    ov.style.cssText='position:fixed;inset:0;z-index:2147483647;background:#f4efe4;display:flex;'
      +'align-items:center;justify-content:center;text-align:center;padding:30px;'
      +'font-family:"Noto Sans TC",ui-sans-serif,sans-serif;color:#23241f';
    (document.body||document.documentElement).appendChild(ov);
    return ov;
  }
  function reveal(){ if(ov&&ov.parentNode) ov.parentNode.removeChild(ov); ov=null; unlock(); }

  function paint(msg, showSwitch){
    var o=ensureOverlay(); lockScroll(); o.innerHTML='';
    var wrap=document.createElement('div'); wrap.style.cssText='max-width:330px';
    wrap.innerHTML='<img src="assets/enso.png" alt="" style="width:62px;height:62px;object-fit:contain;display:block;margin:0 auto 14px">'
      +'<div style="font-family:\'Jost\',ui-sans-serif,sans-serif;font-weight:200;font-size:30px;letter-spacing:.04em">Octenso</div>'
      +'<div style="font-weight:200;font-size:14px;letter-spacing:.34em;padding-left:.34em;margin:6px 0 22px">八 態 能 格</div>'
      +'<div style="font-size:13px;color:#857c6d;line-height:1.95;margin-bottom:20px">'+msg+'</div>';
    var host=document.createElement('div'); host.style.cssText='display:flex;justify-content:center'; wrap.appendChild(host);
    if(showSwitch){
      var sw=document.createElement('button'); sw.textContent='換一個帳號';
      sw.style.cssText='margin-top:16px;background:none;border:1px solid #bcb09a;border-radius:999px;padding:8px 18px;font-size:13px;color:#857c6d;cursor:pointer';
      sw.onclick=function(){
        try{ if(window.google&&google.accounts) google.accounts.id.disableAutoSelect(); }catch(e){}
        localStorage.removeItem('jte_user_email'); localStorage.removeItem('jte_user_name'); localStorage.removeItem('jte_user_picture');
        location.reload();
      };
      wrap.appendChild(sw);
    }
    o.appendChild(wrap);
    return host;
  }

  function onCred(resp){
    try{
      var p=JSON.parse(atob(resp.credential.split('.')[1]));
      localStorage.setItem('jte_user_email', p.email);
      if(p.name) localStorage.setItem('jte_user_name', p.name);
      if(p.picture) localStorage.setItem('jte_user_picture', p.picture);
    }catch(e){}
    check();
  }
  function loadGSI(cb){
    if(window.google&&google.accounts) return cb();
    var s=document.createElement('script'); s.src='https://accounts.google.com/gsi/client'; s.async=true; s.defer=true;
    s.onload=cb; document.head.appendChild(s);
  }
  function showLogin(){
    var host=paint('這是內部開發中的工具。<br>請用<b>授權的 Google 帳號</b>登入後進入。', false);
    loadGSI(function(){
      var n=0, t=setInterval(function(){
        if(window.google&&google.accounts){ clearInterval(t);
          try{
            google.accounts.id.initialize({client_id:CLIENT_ID, callback:onCred, auto_select:false});
            google.accounts.id.renderButton(host,{theme:'outline',size:'large',width:260,text:'signin_with',locale:'zh-TW'});
          }catch(e){ host.innerHTML='<div style="font-size:12px;color:#9d4b34">登入元件載入失敗，請重新整理。</div>'; }
        } else if(++n>40){ clearInterval(t); host.innerHTML='<div style="font-size:12px;color:#9d4b34">連不上 Google 登入，請檢查網路後重新整理。</div>'; }
      },150);
    });
  }

  // 白名單改為「程式碼管理」：讀同資料夾的 allowlist.json（單一來源，要增減改該檔即可）
  function fetchExtras(cb){
    try{
      fetch('allowlist.json',{cache:'no-store'}).then(function(r){return r.ok?r.json():[];}).then(function(arr){
        var out=(Array.isArray(arr)?arr:[]).map(function(e){return String(e||'').trim().toLowerCase();});
        cb(out);
      }).catch(function(){ cb([]); });
    }catch(e){ cb([]); }
  }
  var REVIEW_EMAIL='flow@jointoenjoy.com'; // 使用權申請寄到這裡（審核者）
  function denied(email){
    var o=ensureOverlay(); lockScroll(); o.innerHTML='';
    var safe=String(email).replace(/[<>&]/g,'');
    var wrap=document.createElement('div'); wrap.style.cssText='max-width:340px';
    wrap.innerHTML='<img src="assets/enso.png" alt="" style="width:62px;height:62px;object-fit:contain;display:block;margin:0 auto 14px">'
      +'<div style="font-family:\'Jost\',ui-sans-serif,sans-serif;font-weight:200;font-size:30px;letter-spacing:.04em">Octenso</div>'
      +'<div style="font-weight:200;font-size:14px;letter-spacing:.34em;padding-left:.34em;margin:6px 0 20px">八 態 能 格</div>'
      +'<div style="font-size:13px;color:#857c6d;line-height:1.95;margin-bottom:20px">帳號 <b style="color:#23241f">'+safe+'</b> 目前沒有使用權。<br>想使用的話，寄信申請，審核通過後就能進。</div>';
    var req=document.createElement('a');
    req.href='mailto:'+REVIEW_EMAIL+'?subject='+encodeURIComponent('Octenso 使用權申請')
      +'&body='+encodeURIComponent('我想使用 Octenso ｜ 八態能格。\n我的登入信箱：'+email+'\n\n（麻煩審核後把我加進白名單，謝謝！）');
    req.textContent='✉ 申請使用權';
    req.style.cssText='display:inline-block;background:#23241f;color:#f4efe4;text-decoration:none;border-radius:999px;padding:11px 26px;font-size:14px;letter-spacing:.04em';
    wrap.appendChild(req);
    var sw=document.createElement('button'); sw.textContent='換一個帳號';
    sw.style.cssText='display:block;margin:16px auto 0;background:none;border:none;color:#857c6d;font-size:12.5px;cursor:pointer;text-decoration:underline';
    sw.onclick=function(){
      try{ if(window.google&&google.accounts) google.accounts.id.disableAutoSelect(); }catch(e){}
      localStorage.removeItem('jte_user_email'); localStorage.removeItem('jte_user_name'); localStorage.removeItem('jte_user_picture');
      location.reload();
    };
    wrap.appendChild(sw);
    o.appendChild(wrap);
  }

  function check(){
    // 分享報告檢視（#r=／?r=）：唯讀、分享者自願公開，不需登入 → 直接放行
    if(/[#?&]r=B1[0-9]{16}/i.test((location.hash||'')+(location.search||''))){ reveal(); return; }
    var email=(localStorage.getItem('jte_user_email')||'').trim().toLowerCase();
    if(!email){ showLogin(); return; }
    if(allowed(email)){ reveal(); return; }            // 內建固定名單 → 直接放行
    fetchExtras(function(extra){                        // 否則查 Firestore 額外名單
      if(extra.indexOf(email)>=0) reveal(); else denied(email);
    });
  }

  function start(){ lockScroll(); ensureOverlay(); check(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
