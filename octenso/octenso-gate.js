/* Octenso 登入閘門（Google SSO ＋通行密碼）
   沿用平台 SSO：同網域共用 localStorage.jte_user_email、同一個 GSI client_id。

   2026-07-27 Simon 定案：**SSO 保留**（登入身分要留著，回饋與記錄用），
   拿掉的是「email 白名單」這道限制——改成登入後輸入一次通行密碼即可，
   不用每次有新人就去維護名單。

   授權順序：① Google 登入（拿身分）→ ② 通行密碼（拿使用權，只需輸入一次，之後記住）。

   ⚠️ 誠實限制：靜態站客戶端閘門＝軟性存取控制，非密碼學級安全
   （原始碼可下載、關 JS 可繞）。密碼以 SHA-256 存放而非明碼，只擋「檢視原始碼就看到密碼」；
   八位數字的雜湊在本機幾秒即可暴力還原，擋不住有心人。且密碼可被自由轉發——
   與舊版白名單相比，存取控制是「放寬」而非「加強」，要更強請走後端驗證。 */
(function(){
  // 測試/嵌入（iframe）內不啟用，避免擋住 .test.html 的 iframe 與正常嵌入
  if (window.self !== window.top) return;

  // ── 通行密碼（取代 email 白名單；SHA-256，非明碼）──
  var PASS_SHA256 = '82984a3444454a45d2be36468e295371bed2504a9b7fa8025a07e539fb25adbb';
  var PASS_KEY = 'octenso_pass_ok';            // 通過後記住，換頁／回訪不用重打
  var PASS_VAL = PASS_SHA256.slice(0, 12);
  var CLIENT_ID = '1052529942242-jvr7ik3f7r987l5lq889nrfkjheoovg7.apps.googleusercontent.com';

  function passOk(){ try{ return localStorage.getItem(PASS_KEY)===PASS_VAL; }catch(e){ return false; } }
  // SHA-256（Web Crypto；非 HTTPS 等無 subtle 的環境回傳 null，由呼叫端提示）
  function sha256Hex(str){
    if(window.crypto && crypto.subtle && window.TextEncoder){
      return crypto.subtle.digest('SHA-256', new TextEncoder().encode(str)).then(function(buf){
        return Array.prototype.map.call(new Uint8Array(buf), function(b){ return ('0'+b.toString(16)).slice(-2); }).join('');
      });
    }
    return Promise.resolve(null);
  }

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

  // JWT payload 是 base64url（含 - _、無 padding），atob 只認標準 base64，
  // 直接 atob 遇到含 - 或 _ 的 token 會丟例外 → 登入卡住。故先轉回標準 base64、補 padding，
  // 再以 UTF-8 解碼（中文名字才不會亂碼）。
  function decodeJwt(token){
    var s=String(token).split('.')[1].replace(/-/g,'+').replace(/_/g,'/');
    while(s.length%4) s+='=';
    var bin=atob(s), bytes=Uint8Array.from(bin,function(c){return c.charCodeAt(0);});
    return JSON.parse(new TextDecoder('utf-8').decode(bytes));
  }
  function onCred(resp){
    try{
      var p=decodeJwt(resp.credential);
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
    var host=paint('這是開發中的內部工具。<br>請先用 <b>Google 帳號</b>登入（用來記錄回饋），<br>下一步再輸入通行密碼。', false);
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

  var REVIEW_EMAIL='flow@jointoenjoy.com'; // 沒有密碼時，寄信索取
  // 通行密碼輸入畫面（取代原本的「不在白名單 → 申請使用權」）
  function askPass(email){
    var o=ensureOverlay(); lockScroll(); o.innerHTML='';
    var safe=String(email).replace(/[<>&]/g,'');
    var wrap=document.createElement('div'); wrap.style.cssText='max-width:330px';
    wrap.innerHTML='<img src="assets/enso.png" alt="" style="width:62px;height:62px;object-fit:contain;display:block;margin:0 auto 14px">'
      +'<div style="font-family:\'Jost\',ui-sans-serif,sans-serif;font-weight:200;font-size:30px;letter-spacing:.04em">Octenso</div>'
      +'<div style="font-weight:200;font-size:14px;letter-spacing:.34em;padding-left:.34em;margin:6px 0 20px">八 態 能 格</div>'
      +'<div style="font-size:13px;color:#857c6d;line-height:1.95;margin-bottom:18px">已登入 <b style="color:#23241f">'+safe+'</b><br>請輸入通行密碼進入（只需輸入一次）。</div>';
    var inp=document.createElement('input');
    inp.type='password'; inp.inputMode='numeric'; inp.autocomplete='off'; inp.placeholder='通行密碼';
    inp.setAttribute('aria-label','通行密碼');
    inp.style.cssText='width:100%;text-align:center;background:#f8f4ec;border:1px solid #bcb09a;border-radius:999px;'
      +'padding:11px 16px;font-size:15px;letter-spacing:.24em;color:#23241f;font-family:inherit;outline:none';
    wrap.appendChild(inp);
    var err=document.createElement('div');
    err.style.cssText='font-size:12.5px;color:#9d4b34;min-height:1.4em;margin-top:9px';
    wrap.appendChild(err);
    var btn=document.createElement('button'); btn.textContent='進入';
    btn.style.cssText='margin-top:6px;background:#23241f;color:#f4efe4;border:none;border-radius:999px;'
      +'padding:11px 34px;font-size:14px;letter-spacing:.06em;cursor:pointer;font-family:inherit';
    wrap.appendChild(btn);
    var ask=document.createElement('a');
    ask.href='mailto:'+REVIEW_EMAIL+'?subject='+encodeURIComponent('Octenso 通行密碼')
      +'&body='+encodeURIComponent('我想使用 Octenso ｜ 八態能格，想跟你要通行密碼。\n我的登入信箱：'+email+'\n');
    ask.textContent='沒有密碼？寄信索取';
    ask.style.cssText='display:block;margin:16px auto 0;color:#857c6d;font-size:12.5px;text-decoration:underline';
    wrap.appendChild(ask);
    var sw=document.createElement('button'); sw.textContent='換一個帳號';
    sw.style.cssText='display:block;margin:12px auto 0;background:none;border:none;color:#857c6d;font-size:12.5px;cursor:pointer;text-decoration:underline';
    sw.onclick=function(){
      try{ if(window.google&&google.accounts) google.accounts.id.disableAutoSelect(); }catch(e){}
      localStorage.removeItem('jte_user_email'); localStorage.removeItem('jte_user_name'); localStorage.removeItem('jte_user_picture');
      location.reload();
    };
    wrap.appendChild(sw);
    o.appendChild(wrap);
    setTimeout(function(){ try{ inp.focus(); }catch(e){} }, 30);
    function submit(){
      var v=String(inp.value||'').trim();
      if(!v){ err.textContent='請輸入密碼。'; return; }
      btn.disabled=true;
      sha256Hex(v).then(function(hex){
        if(hex && hex===PASS_SHA256){
          try{ localStorage.setItem(PASS_KEY, PASS_VAL); }catch(e){}
          reveal();
        } else {
          btn.disabled=false;
          err.textContent = hex ? '密碼不對，再試一次。' : '這個環境無法驗證密碼（需 HTTPS）。';
          inp.value=''; try{ inp.focus(); }catch(e){}
        }
      }).catch(function(){ btn.disabled=false; err.textContent='驗證時出了點問題，請重新整理再試。'; });
    }
    btn.onclick=submit;
    inp.addEventListener('keydown', function(e){
      if(e.key!=='Enter') return;
      if(e.isComposing||e.keyCode===229) return;   // 輸入法組字中不送出
      e.preventDefault(); submit();
    });
  }
  function check(){
    // 分享報告檢視（#r= ／ ?r=，B1/B2/B3）：唯讀、分享者自願公開，不需登入 → 直接放行
    if(/[#?&]r=B[123][0-9]{16,28}/i.test((location.hash||'')+(location.search||''))){ reveal(); return; }
    var email=(localStorage.getItem('jte_user_email')||'').trim().toLowerCase();
    if(!email){ showLogin(); return; }   // ① 先登入，拿身分（記錄用）
    if(passOk()){ reveal(); return; }    // ② 已通過密碼 → 放行
    askPass(email);                      // ② 尚未輸入密碼 → 要密碼
  }

  function start(){ lockScroll(); ensureOverlay(); check(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
