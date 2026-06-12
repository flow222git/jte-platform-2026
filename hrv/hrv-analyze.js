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

  // 移動平均去基線 → 取 AC，找局部極大（脈搏峰），自適應門檻 + 不應期。
  // 回傳 { beats:[t...], heights:[ac峰高...] }（heights 供品質判斷用）。
  function _detect(samples){
    samples = samples||[];
    if (samples.length < 10) return { beats:[], heights:[] };
    var v = samples.map(function(s){ return s.v; }), t = samples.map(function(s){ return s.t; });
    var win = 15, ac = [];
    for (var i=0;i<v.length;i++){
      var a=Math.max(0,i-win), b=Math.min(v.length-1,i+win), s=0,c=0;
      for(var k=a;k<=b;k++){ s+=v[k]; c++; }
      ac.push(v[i]-s/c); // 去趨勢
    }
    var mx=0; for(var j=0;j<ac.length;j++) if(ac[j]>mx) mx=ac[j];
    var thr = mx*0.4;
    var beats=[], heights=[], lastT=-1e9;
    for(var p=1;p<ac.length-1;p++){
      if (ac[p]>thr && ac[p]>=ac[p-1] && ac[p]>ac[p+1] && (t[p]-lastT)>=300){
        beats.push(t[p]); heights.push(ac[p]); lastT=t[p];
      }
    }
    return { beats:beats, heights:heights };
  }
  function detectBeats(samples){ return _detect(samples).beats; }
  function rrFromBeats(beats){
    var rr=[];
    for(var i=1;i<beats.length;i++){
      var d=beats[i]-beats[i-1];
      if (d>=300 && d<=2000) rr.push(d); // 偽差過濾
    }
    return rr;
  }
  // 變異係數（母體標準差/平均）
  function _cv(a){
    if (!a.length) return 1;
    var m=mean(a); if (m<=0) return 1;
    var vs=0; for(var i=0;i<a.length;i++){ var d=a[i]-m; vs+=d*d; }
    return Math.sqrt(vs/a.length)/m;
  }
  // 訊號品質 green/yellow/red：乾淨脈搏同時具備「RR 規律」與「脈衝高度一致」；
  // 雜訊兩者皆亂。任一明顯偏離→誠實降級，不硬給數字。
  function signalQuality(samples){
    var d=_detect(samples), rr=rrFromBeats(d.beats);
    if (rr.length < 3) return 'red';
    var rrCv = _cv(rr);          // 人體短時 RR CV 一般 <0.1；雜訊偏高
    var htCv = _cv(d.heights);   // 乾淨脈衝高度一致(<0.1)；雜訊峰高散亂(>0.15)
    if (rrCv < 0.12 && htCv < 0.12) return 'green';
    if (rrCv < 0.22 && htCv < 0.18) return 'yellow';
    return 'red';
  }

  root.HrvAnalyze = {
    metricsFromRr: metricsFromRr, classify: classify,
    detectBeats: detectBeats, rrFromBeats: rrFromBeats, signalQuality: signalQuality,
    _mean: mean
  };
})(typeof window !== 'undefined' ? window : this);
