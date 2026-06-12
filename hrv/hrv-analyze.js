// hrv-analyze.js — 相機 PPG 的 HRV 訊號處理（可測純函式）。掛 window.HrvAnalyze。
(function (root) {
  'use strict';
  function mean(a){ var s=0; for(var i=0;i<a.length;i++) s+=a[i]; return a.length?s/a.length:0; }
  function metricsFromRr(rr){
    rr = (rr||[]).filter(function(x){ return x>0; });
    if (rr.length < 2) return { hr:0, rmssd:0, sdnn:0, n:rr.length };
    var mr = mean(rr);
    var sq=0; for(var i=1;i<rr.length;i++){ var d=rr[i]-rr[i-1]; sq+=d*d; }
    var rmssd = Math.sqrt(sq/(rr.length-1));
    var vs=0; for(var j=0;j<rr.length;j++){ var dv=rr[j]-mr; vs+=dv*dv; }
    var sdnn = Math.sqrt(vs/rr.length);
    return { hr: 60000/mr, rmssd: rmssd, sdnn: sdnn, n: rr.length };
  }
  var STATES = {
    relaxed:  { state:'relaxed',  advice:'身體現在偏放鬆，這個狀態很好，記得它的感覺。' },
    balanced: { state:'balanced', advice:'平衡的狀態。要更鬆一點，可以試著放慢吐氣。' },
    tense:    { state:'tense',    advice:'身體有點緊。慢慢深呼吸幾次，吐氣拉長，再看看。' }
  };
  function classify(m){
    var r = (m&&m.rmssd)||0;
    var key = r>=50 ? 'relaxed' : r>=25 ? 'balanced' : 'tense';
    return STATES[key];
  }
  root.HrvAnalyze = { metricsFromRr: metricsFromRr, classify: classify, _mean: mean };
})(typeof window !== 'undefined' ? window : this);
