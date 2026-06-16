/* Octenso 登入閘門（Google SSO ＋白名單）
   沿用平台 SSO：同網域共用 localStorage.jte_user_email、同一個 GSI client_id。
   ⚠️ 誠實限制：靜態站客戶端閘門＝軟性存取控制，非密碼學級安全（原始碼可下載、關 JS 可繞）。 */
(function(){
  // 測試/嵌入（iframe）內不啟用，避免擋住 .test.html 的 iframe 與正常嵌入
  if (window.self !== window.top) return;

  // ── 白名單（小寫比對）。要放行誰就加進來 ──
  var ALLOW = ['flow@jointoenjoy.com'];
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

  function check(){
    var email=localStorage.getItem('jte_user_email');
    if(allowed(email)){ reveal(); return; }
    if(email){ paint('帳號 <b>'+String(email).replace(/[<>&]/g,'')+'</b> 沒有進入權限。<br>請改用授權的帳號。', true); }
    else { showLogin(); }
  }

  function start(){ lockScroll(); ensureOverlay(); check(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
