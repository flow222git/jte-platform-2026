// hrv-analyze.js — 相機 PPG 的 HRV 訊號處理（可測純函式）。掛 window.HrvAnalyze。
(function (root) {
  'use strict';
  function mean(a){ var s=0; for(var i=0;i<a.length;i++) s+=a[i]; return a.length?s/a.length:0; }
  function _median(a){ var s=a.slice().sort(function(x,y){return x-y;}), n=s.length, h=Math.floor(n/2); return n? (n%2 ? s[h] : (s[h-1]+s[h])/2) : 0; }
  // RR 偽差校正（給結果計算用；metricsFromRr 維持純公式）。兩道：
  // ①剔除偏離中位數 ±30% 的（漏拍倍長/假拍短間隔）②連續差濾波：跳動 >20% 前值的非生理跳動剔除。
  // RMSSD＝連續差的均方根，對掉訊號造成的假間隔極敏感，必須先清乾淨否則會灌爆到數百 ms。
  function cleanRr(rr){
    rr = (rr||[]).filter(function(x){ return x>0; });
    if (rr.length < 3) return rr;
    var med=_median(rr), lo=med*0.7, hi=med*1.3, band=[];
    for(var i=0;i<rr.length;i++){ if(rr[i]>=lo && rr[i]<=hi) band.push(rr[i]); }
    if (band.length < 2) return rr;
    var out=[band[0]];
    for(i=1;i<band.length;i++){ var prev=out[out.length-1]; if(Math.abs(band[i]-prev)/prev <= 0.20) out.push(band[i]); }
    return out.length>=2 ? out : band;
  }
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

  // 修剪開頭約 1.5 秒手指安定期 + 移動平均去基線 → 回傳 { ac, t, fs }
  function _prep(samples){
    samples = samples||[];
    if (samples.length < 10) return null;
    var t0 = samples[0].t, trimmed = [];
    for (var z=0;z<samples.length;z++){ if (samples[z].t - t0 >= 1500) trimmed.push(samples[z]); }
    if (trimmed.length < 10) trimmed = samples; // 資料太短就不修剪
    var v = trimmed.map(function(s){ return s.v; }), t = trimmed.map(function(s){ return s.t; });
    var dur = t[t.length-1]-t[0], fs = dur>0 ? (v.length-1)/(dur/1000) : 30;
    // 去趨勢視窗 ~2 秒（約 2 個心跳週期）：移動平均近乎為零→保留脈搏、只去掉慢漂移。
    // 原本 0.6 秒太短，會把脈搏一起平均掉、削弱振幅導致漏拍。
    var win = Math.max(5, Math.round(fs*1.0)), ac = [];
    for (var i=0;i<v.length;i++){
      var a=Math.max(0,i-win), b=Math.min(v.length-1,i+win), s=0,c=0;
      for(var k=a;k<=b;k++){ s+=v[k]; c++; }
      ac.push(v[i]-s/c);
    }
    return { ac:ac, t:t, fs:fs };
  }
  // 找脈搏峰：穩健門檻＝正向 AC 的 90 百分位之半（單一動作尖峰拉不動百分位、雜訊也壓不低它，
  // 取代原本「全域最大值×0.4」會被一個尖峰綁架而漏掉大部分心跳）。回傳 { beats, heights }。
  function _detect(samples){
    var pr=_prep(samples); if(!pr) return { beats:[], heights:[] };
    var ac=pr.ac, t=pr.t;
    var pos=[]; for(var j=0;j<ac.length;j++){ if(ac[j]>0) pos.push(ac[j]); }
    pos.sort(function(x,y){ return x-y; });
    var p90 = pos.length ? pos[Math.min(pos.length-1, Math.floor(pos.length*0.9))] : 0;
    var thr = p90*0.5;
    var beats=[], heights=[], lastT=-1e9;
    for(var p=1;p<ac.length-1;p++){
      if (ac[p]>thr && ac[p]>=ac[p-1] && ac[p]>ac[p+1] && (t[p]-lastT)>=300){
        beats.push(t[p]); heights.push(ac[p]); lastT=t[p];
      }
    }
    return { beats:beats, heights:heights };
  }
  // 自相關週期性分數(0~1)：真脈搏在 40-150bpm 對應 lag 有強自相關；雜訊接近 0。
  // 先 winsorize（以中位數絕對值×4 夾住離群暫態），否則單一大暫態會壟斷能量(c0)、把週期性壓成 0
  // ——即使脈搏其實很規律（真機實證：beats 13、好脈搏卻 per=0）。
  function _periodicity(ac, fs){
    var n=ac.length; if(n<20) return 0;
    var absv=new Array(n); for(var i=0;i<n;i++) absv[i]=Math.abs(ac[i]);
    var srt=absv.slice().sort(function(a,b){return a-b;});
    var medAbs=srt[Math.floor(n/2)]||0, cap=medAbs>0 ? medAbs*4 : Infinity;
    var x=new Array(n), m=0;
    for(i=0;i<n;i++){ var c=ac[i]; if(c>cap)c=cap; else if(c<-cap)c=-cap; x[i]=c; m+=c; }
    m/=n; for(i=0;i<n;i++) x[i]-=m;
    var c0=0; for(i=0;i<n;i++) c0+=x[i]*x[i]; if(c0<=0) return 0;
    var lagMin=Math.max(1,Math.round(fs*0.4)), lagMax=Math.round(fs*1.5), best=0;
    for(var lag=lagMin; lag<=lagMax && lag<n; lag++){
      var cc=0; for(var j=0;j+lag<n;j++) cc+=x[j]*x[j+lag];
      var r=cc/c0; if(r>best) best=r;
    }
    return best;
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
  // 訊號品質 green/yellow/red：核心是「有沒有真的週期性脈搏」（自相關），
  // 再看 RR 規律性與生理合理性。相機 PPG 脈衝高度本來就浮動，故不再用峰高一致性（太嚴苛→永遠紅）。
  function signalQuality(samples){
    var pr=_prep(samples); if(!pr) return 'red';
    var per=_periodicity(pr.ac, pr.fs);
    var d=_detect(samples), rr=rrFromBeats(d.beats);
    if (rr.length < 3 || per < 0.30) return 'red'; // 沒週期性＝雜訊（這是穩健的核心判斷）
    var hr = 60000/mean(rr);
    if (hr < 40 || hr > 150) return 'red';         // 不合生理／雜訊湊出的過快節律
    // 以週期性為準：真脈搏週期性強。不再用 rrCv 當門檻——漏拍會讓 RR 假性不規律、誤殺好訊號。
    if (per >= 0.42) return 'green';
    return 'yellow';
  }

  root.HrvAnalyze = {
    metricsFromRr: metricsFromRr, classify: classify, cleanRr: cleanRr,
    detectBeats: detectBeats, rrFromBeats: rrFromBeats, signalQuality: signalQuality,
    _mean: mean, _prep: _prep, _periodicity: _periodicity
  };
})(typeof window !== 'undefined' ? window : this);
