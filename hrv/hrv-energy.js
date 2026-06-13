// hrv-energy.js — 「身體能量」分數（lnRMSSD + 靜息 HR vs 個人 baseline）。掛 window.HrvEnergy。
// Bayesian 混合弱母體先驗，讓第一次量測就有合理分數、隨次數越來越個人化。相對參考、非醫療。
(function (root) {
  'use strict';
  var POP_LN_MEAN=3.6, POP_LN_SD=0.55, POP_HR_MEAN=70, POP_HR_SD=10, K=2, RECENT=14, CONF_N=7;
  function clamp(x,lo,hi){ return x<lo?lo:(x>hi?hi:x); }
  function sum(a){ var s=0; for(var i=0;i<a.length;i++) s+=a[i]; return s; }
  // history：[{rmssd,hr,ts}...]（本次之前的過去量測）。取近 RECENT 次。
  // 平均＝個人與弱母體先驗混合（K 小→快速個人化，「你的平常」落在分數中間）。
  // SD＝用固定母體 SD：不去估資料少時不穩的個人 SD（會被縮小而放大 z、害「平常」誤判成高）。
  function baselineFrom(history){
    var h=(history||[]).filter(function(r){ return r && r.rmssd>0; }).slice(-RECENT);
    var lns=h.map(function(r){ return Math.log(r.rmssd); });
    var hrs=h.filter(function(r){ return r.hr>0; }).map(function(r){ return r.hr; });
    var n=lns.length;
    return {
      effLnMean:(sum(lns)+K*POP_LN_MEAN)/(n+K),
      effLnSd: POP_LN_SD,
      effHrMean:(sum(hrs)+K*POP_HR_MEAN)/(hrs.length+K),
      effHrSd: POP_HR_SD,
      n:n
    };
  }
  var LBL={high:'高',mid:'中',low:'低'};
  function lvl3(z){ return z>=0.6?'high':(z>=-0.6?'mid':'low'); }
  var ADV={ high:'身體能量充足，恢復得不錯，好好把握今天。', mid:'和你平常差不多，穩穩的。', low:'能量偏低，今天多留點空間給自己休息。' };
  var ELBL={ high:'充足', mid:'平穩', low:'偏低' };
  function energyScore(today, baseline){
    today=today||{}; baseline=baseline||baselineFrom([]);
    var rmssd=today.rmssd>0?today.rmssd:0, hr=today.hr>0?today.hr:0;
    if(!(rmssd>0)) return { score:0, level:'low', label:'偏低', advice:'', confidence:'building', n:baseline.n||0, recovery:null, calm:null };
    var zR=(Math.log(rmssd)-baseline.effLnMean)/baseline.effLnSd;
    var zH=hr>0?(hr-baseline.effHrMean)/baseline.effHrSd:0;
    var z=0.75*zR + 0.25*(-zH);
    var score=Math.round(clamp(60+z*16, 0, 100));
    var level= score>=75?'high':(score>=45?'mid':'low');
    return {
      score:score, level:level, label:ELBL[level], advice:ADV[level],
      confidence:(baseline.n>=CONF_N?'ok':'building'), n:baseline.n||0,
      recovery:{ level:lvl3(zR), label:LBL[lvl3(zR)] },
      calm:{ level:lvl3(-zH), label:LBL[lvl3(-zH)] }
    };
  }
  root.HrvEnergy = { baselineFrom:baselineFrom, energyScore:energyScore, _CONF_N:CONF_N };
})(typeof window !== 'undefined' ? window : this);
