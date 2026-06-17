/* =====================================================================
   jte-userbar.js — 練息場全平台共用「使用者列」
   功能：每頁頂部顯示（左）回練息場、（右）登入資訊／登入鈕。
   設計：只讀寫共用的 localStorage（同網域 SSO），不重複初始化各頁的 GSI。
        登入/登出優先用頁面提供的 window.jteLogin / window.jteLogout，
        沒有的頁面才由本檔自行跳 Google 登入。
   用法：<script defer src="https://flow222git.github.io/jte-platform-2026/jte-userbar.js"></script>
   選項（在引入前可設定 window 變數）：
        window.JTE_USERBAR_HIDE_BACK = true  // 強制隱藏「回練息場」（首頁用）
   ===================================================================== */
(function(){
  if (window.__jteUserbarLoaded) return;
  window.__jteUserbarLoaded = true;

  var PLATFORM_URL = 'https://flow222git.github.io/jte-platform-2026/';
  var CLIENT_ID = '1052529942242-jvr7ik3f7r987l5lq889nrfkjheoovg7.apps.googleusercontent.com';

  function email(){ return localStorage.getItem('jte_user_email') || ''; }
  function uname(){ return localStorage.getItem('jte_user_name') || email(); }
  function upic(){ return localStorage.getItem('jte_user_picture') || ''; }

  // 是否處於大首頁（首頁不顯示「回練息場」）
  function isHome(){
    if (window.JTE_USERBAR_HIDE_BACK) return true;
    var p = location.pathname.replace(/\/+$/, '/');
    return /\/jte-platform-2026\/?$/.test(location.pathname) ||
           /\/jte-platform-2026\/index\.html$/.test(location.pathname);
  }

  function injectStyles(){
    if (document.getElementById('jte-userbar-style')) return;
    var s = document.createElement('style');
    s.id = 'jte-userbar-style';
    s.textContent = [
      '#jte-userbar{position:fixed;top:0;left:0;right:0;z-index:2147483600;display:flex;align-items:center;justify-content:space-between;',
      'padding:max(8px,env(safe-area-inset-top)) 10px 0;pointer-events:none;font-family:-apple-system,BlinkMacSystemFont,"Noto Sans TC",sans-serif}',
      '#jte-userbar a,#jte-userbar button{pointer-events:auto}',
      '.jte-ub-pill{display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,.86);',
      '-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);border:1px solid rgba(0,61,124,.14);',
      'border-radius:999px;padding:5px 11px;font-size:12px;line-height:1;color:#003D7C;text-decoration:none;',
      'box-shadow:0 2px 8px rgba(0,0,0,.10);cursor:pointer;white-space:nowrap}',
      '.jte-ub-pill:active{transform:scale(.97)}',
      '.jte-ub-avatar{width:20px;height:20px;border-radius:50%;object-fit:cover;background:#003D7C;color:#fff;',
      'display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;flex-shrink:0}',
      '.jte-ub-name{max-width:96px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:500}',
      '.jte-ub-menu{position:fixed;top:46px;right:10px;z-index:2147483601;background:#fff;border:1px solid rgba(0,61,124,.14);',
      'border-radius:14px;box-shadow:0 8px 28px rgba(0,0,0,.16);padding:12px 14px;min-width:180px;display:none;pointer-events:auto}',
      '.jte-ub-menu.open{display:block}',
      '.jte-ub-menu .em{font-size:11px;color:#6B7A8D;word-break:break-all;margin-bottom:10px;line-height:1.5}',
      '.jte-ub-menu .out{width:100%;background:#F2F4F7;border:none;border-radius:999px;padding:9px;font-size:12px;color:#003D7C;cursor:pointer;font-weight:600}',
      // —— 內嵌瀏覽器防呆卡 ——
      '#jte-inapp-help{position:fixed;top:46px;left:8px;right:8px;z-index:2147483602;pointer-events:none}',
      '.jte-iah-card{pointer-events:auto;max-width:440px;margin:0 auto;background:#fff;border:1px solid rgba(0,61,124,.18);',
      'border-radius:14px;box-shadow:0 8px 28px rgba(0,0,0,.18);padding:13px 15px;animation:jteIahIn .25s ease}',
      '@keyframes jteIahIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}',
      '.jte-iah-t{font-size:13.5px;font-weight:700;color:#003D7C;margin-bottom:6px}',
      '.jte-iah-b{font-size:12.5px;color:#3a3a32;line-height:1.7}',
      '.jte-iah-b b{color:#003D7C}',
      '.jte-iah-row{display:flex;gap:8px;margin-top:11px}',
      '.jte-iah-copy{flex:1;background:#003D7C;color:#fff;border:none;border-radius:999px;padding:9px;font-size:12.5px;font-weight:600;cursor:pointer}',
      '.jte-iah-x{background:#F2F4F7;color:#6B7A8D;border:none;border-radius:999px;padding:9px 16px;font-size:12.5px;cursor:pointer}'
    ].join('');
    document.head.appendChild(s);
  }

  function initial(){ var n = uname(); return (n && n[0] ? n[0] : '?').toUpperCase(); }

  function render(){
    injectStyles();
    var bar = document.getElementById('jte-userbar');
    if (!bar){
      bar = document.createElement('div');
      bar.id = 'jte-userbar';
      document.body.appendChild(bar);
    }
    var left = isHome() ? '<span></span>'
      : '<a class="jte-ub-pill" href="' + PLATFORM_URL + '" aria-label="回練息場">← 練息場</a>';

    var right;
    if (email()){
      var av = upic()
        ? '<img class="jte-ub-avatar" src="' + upic() + '" alt="">'
        : '<span class="jte-ub-avatar">' + initial() + '</span>';
      var shortName = (uname() || '').split('@')[0];
      right = '<button class="jte-ub-pill" id="jte-ub-user">' + av +
              '<span class="jte-ub-name">' + shortName + '</span></button>';
    } else {
      right = '<button class="jte-ub-pill" id="jte-ub-login">登入</button>';
    }
    bar.innerHTML = left + right;

    // menu（登入時）
    var menu = document.getElementById('jte-ub-menu');
    if (menu) menu.parentNode.removeChild(menu);
    if (email()){
      menu = document.createElement('div');
      menu.id = 'jte-ub-menu';
      menu.className = 'jte-ub-menu';
      menu.innerHTML = '<div class="em">' + (uname() || '') +
        (uname() !== email() ? '<br>' + email() : '') + '</div>' +
        '<button class="out" id="jte-ub-logout">登出</button>';
      document.body.appendChild(menu);

      document.getElementById('jte-ub-user').onclick = function(e){
        e.stopPropagation();
        menu.classList.toggle('open');
      };
      document.addEventListener('click', function(){ menu.classList.remove('open'); });
      document.getElementById('jte-ub-logout').onclick = doLogout;
    } else {
      document.getElementById('jte-ub-login').onclick = doLogin;
      // 未登入 + 內嵌瀏覽器 → 主動提示（在他點到白畫面之前）
      if (isInAppBrowser()) showInAppHelp();
    }
  }

  function watchLoginThenReload(){
    var was = email();
    var n = 0;
    var t = setInterval(function(){
      n++;
      if (email() && email() !== was){ clearInterval(t); location.reload(); }
      if (n > 600) clearInterval(t); // 最多盯 ~60s
    }, 100);
  }

  // —— 內嵌瀏覽器（App webview）偵測 + 防呆卡 ——
  // Google 禁止在 in-app webview 完成登入 → 會白畫面。偵測到就引導用 Safari/Chrome 開。
  function isInAppBrowser(){
    var ua = navigator.userAgent || '';
    if (/FBAN|FBAV|FB_IAB|Instagram|Line\/|Messenger|MicroMessenger|WeChat|Twitter|TikTok|musical_ly|; wv\)/i.test(ua)) return true;
    // iOS 的 in-app WKWebView 不含 "Safari/"；排除已知獨立瀏覽器
    if (/iPhone|iPad|iPod/i.test(ua) && !/Safari\//i.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua)) return true;
    return false;
  }
  window.jteIsInAppBrowser = isInAppBrowser; // 給各頁自己的登入流程也能用
  var _iahDismissed = false;
  function showInAppHelp(){
    if (_iahDismissed || document.getElementById('jte-inapp-help')) return;
    injectStyles();
    var url = location.href;
    var box = document.createElement('div');
    box.id = 'jte-inapp-help';
    box.innerHTML =
      '<div class="jte-iah-card">'
      + '<div class="jte-iah-t">⚠️ Google 登入要用瀏覽器開啟</div>'
      + '<div class="jte-iah-b">你正在 App 內建瀏覽器，Google 不允許在這裡登入（會白畫面）。請點畫面<b>右上角 ⋯ 或分享鈕</b>，選「<b>用 Safari／Chrome 開啟</b>」，再登入。</div>'
      + '<div class="jte-iah-row"><button class="jte-iah-copy" id="jte-iah-copy">複製網址</button>'
      + '<button class="jte-iah-x" id="jte-iah-x">知道了</button></div>'
      + '</div>';
    document.body.appendChild(box);
    document.getElementById('jte-iah-x').onclick = function(){ _iahDismissed = true; if (box.parentNode) box.parentNode.removeChild(box); };
    document.getElementById('jte-iah-copy').onclick = function(){
      var btn = this;
      function done(){ btn.textContent = '已複製 ✓'; setTimeout(function(){ btn.textContent = '複製網址'; }, 1800); }
      function fallback(){ var ta = document.createElement('textarea'); ta.value = url; ta.style.position='fixed'; ta.style.opacity='0'; document.body.appendChild(ta); ta.select(); try{ document.execCommand('copy'); }catch(e){} document.body.removeChild(ta); done(); }
      if (navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(url).then(done, fallback); } else fallback();
    };
  }
  window.jteShowInAppHelp = showInAppHelp;

  function doLogin(){
    // 0) 內嵌瀏覽器 → Google 登入會白畫面，先引導用真正的瀏覽器開
    if (isInAppBrowser()){ showInAppHelp(); return; }
    // 1) 頁面已有登入流程 → 用它（避免重複初始化 GSI）
    if (typeof window.jteLogin === 'function'){ window.jteLogin(); watchLoginThenReload(); return; }
    // 2) 否則由本檔自行跳 Google 登入
    selfGoogleLogin();
  }

  function doLogout(){
    if (typeof window.jteLogout === 'function'){ window.jteLogout(); return; }
    localStorage.removeItem('jte_user_email');
    localStorage.removeItem('jte_user_name');
    localStorage.removeItem('jte_user_picture');
    if (window.google && google.accounts) try{ google.accounts.id.disableAutoSelect(); }catch(e){}
    location.reload();
  }

  // —— 本檔自帶的 Google 登入（僅用於沒有自己登入流程的頁面）——
  var _selfInited = false;
  function _selfHandle(resp){
    try{
      var p = JSON.parse(atob(resp.credential.split('.')[1]));
      localStorage.setItem('jte_user_email', p.email);
      localStorage.setItem('jte_user_name', p.name || p.email);
      localStorage.setItem('jte_user_picture', p.picture || '');
      location.reload();
    }catch(e){ console.warn('userbar login parse failed', e); }
  }
  function selfGoogleLogin(){
    ensureGsi(function(){
      if (!_selfInited){
        _selfInited = true;
        google.accounts.id.initialize({ client_id: CLIENT_ID, ux_mode: 'popup', callback: _selfHandle });
      }
      google.accounts.id.prompt();
    });
  }
  function ensureGsi(cb){
    if (window.google && google.accounts){ cb(); return; }
    if (!document.getElementById('jte-gsi-sdk')){
      var sc = document.createElement('script');
      sc.id = 'jte-gsi-sdk';
      sc.src = 'https://accounts.google.com/gsi/client';
      sc.async = true; sc.defer = true;
      document.head.appendChild(sc);
    }
    var t = setInterval(function(){ if (window.google && google.accounts){ clearInterval(t); cb(); } }, 200);
  }

  // 對外：登入狀態變更後可手動重繪
  window.jteUserbarRefresh = render;

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
