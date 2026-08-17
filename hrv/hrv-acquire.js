// hrv-acquire.js — 量測前「訊號擷取」的狀態驅動引導（可測純函式）。掛 window.HrvAcquire。
// 動機：新手卡在紅燈時不知道自己哪一步沒做對。把黑箱拆成三關（蓋鏡頭→光線→脈搏），
// 依每幀診斷值即時判定「現在卡在哪一關」，引導文字跟著狀態走、不跟著秒數輪播。
(function (root) {
  'use strict';

  // 分關門檻（集中一處方便依機型實測微調；與 hrv-analyze COV_CFG 的精神一致但獨立——
  // 這裡只做「引導」判定，不做鎖定閘門，寧可寬鬆早點打勾、由脈搏關把最後品質關）。
  var CFG = {
    rgMin: 1.2,   // 紅/綠比 ≥ 此值 → 光有穿過手指組織（蓋住的最強判別）
    cvMax: 0.35,  // 紅通道空間變異係數 ≤ 此值 → 整片均勻（沒蓋會有場景細節）
    satMin: 0.6,  // 紅飽和比例 ≥ 此值 → 開燈壓滿的全飽和畫面（rg 比會失效，靠這條認定蓋住）
    rMin: 20      // 紅光均值 ≥ 此值 → 亮度足夠出訊號（無 torch 暗處會低於此）
  };

  // 分關即時檢查。diag={R,G,cv,sat}，quality='red'|'yellow'|'green'（HrvAnalyze.signalQuality）。
  // 回 { cover, light, pulse, focus }；focus = 第一個未過的關（'cover'|'light'|'pulse'|'ok'）。
  function checks(diag, quality) {
    diag = diag || {};
    var R = +diag.R || 0, G = +diag.G || 0, cv = (diag.cv == null) ? 1 : +diag.cv, sat = +diag.sat || 0;
    var rg = R / (G + 1);
    var cover = (rg >= CFG.rgMin && cv <= CFG.cvMax) || sat >= CFG.satMin;
    var light = cover && (R >= CFG.rMin || sat >= CFG.satMin);
    var pulse = quality === 'yellow' || quality === 'green';
    var focus = !cover ? 'cover' : (!light ? 'light' : (!pulse ? 'pulse' : 'ok'));
    return { cover: cover, light: light, pulse: pulse, focus: focus };
  }

  // 內嵌瀏覽器偵測：這類 webview 的 getUserMedia 常直接不可用（相機開不了的大宗）。
  function detectInApp(ua) {
    ua = String(ua || '');
    if (/\bLine\//i.test(ua)) return 'line';
    if (/FBAN|FBAV|FB_IAB/i.test(ua)) return 'facebook';
    if (/Instagram/i.test(ua)) return 'instagram';
    if (/MicroMessenger/i.test(ua)) return 'wechat';
    return null;
  }

  function _v(x, unk) { return (x == null || x === '') ? (unk || '?') : String(x); }

  // 診斷摘要（給「卡住了？」面板一鍵複製）：純環境與訊號數據、無任何個資。
  // 欄位缺漏一律印 '?'，不丟例外——這段跑在最挫折的時刻，絕不能再壞。
  function buildReport(info) {
    info = info || {};
    var L = [];
    L.push('[HRV 診斷] ' + _v(info.when));
    L.push('UA: ' + _v(info.ua));
    L.push('螢幕: ' + _v(info.screenW) + 'x' + _v(info.screenH) + ' @' + _v(info.dpr) + 'x  lang:' + _v(info.lang));
    L.push('in-app 瀏覽器: ' + (info.inApp ? info.inApp : '無'));
    L.push('鏡頭清單: ' + (info.cams && info.cams.length ? info.cams.join(' | ') : '?'));
    L.push('選中鏡頭: ' + _v(info.picked) + '  重抓:' + (info.reacq ? 'Y' : 'N'));
    L.push('torch: ' + (info.torchOk === true ? '有開' : (info.torchOk === false ? '不支援/沒開' : '?')) + '  穩定鎖: ' + _v(info.stab));
    L.push('訊號: R=' + _v(info.R) + ' G=' + _v(info.G) + ' cv=' + _v(info.cv) + ' sat=' + _v(info.sat) + ' 品質=' + _v(info.quality));
    L.push('卡住關卡: ' + _v(info.focus) + '  已等待: ' + _v(info.waitedSec) + ' 秒');
    return L.join('\n');
  }

  root.HrvAcquire = { checks: checks, detectInApp: detectInApp, buildReport: buildReport, CFG: CFG };
})(typeof window !== 'undefined' ? window : this);
