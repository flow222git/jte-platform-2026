// hrv-analyze.js — 相機 PPG 的 HRV 訊號處理（可測純函式）。掛 window.HrvAnalyze。
(function (root) {
  'use strict';
  function mean(a){ var s=0; for(var i=0;i<a.length;i++) s+=a[i]; return a.length?s/a.length:0; }
  function _clamp01(x){ return x<0?0:(x>1?1:x); }
  // 鏡頭覆蓋設定（集中一處，方便依機型實測微調；門檻 min 供鎖定閘門用）。
  //   rgLo/rgHi：紅/綠比的 0→1 映射端點；cvHi/cvLo：變異係數（低=均勻）的 0→1 映射端點；
  //   brLo/brHi：亮度端點；wRg/wUni/wBr：三項權重；min：判定「已蓋好」的分數門檻。
  var COV_CFG={ rgLo:1.2, rgHi:2.2, cvHi:0.30, cvLo:0.10, brLo:20, brHi:60, wRg:0.45, wUni:0.40, wBr:0.15, min:0.55 };
  // 鏡頭覆蓋分數 0~1：判斷「這顆鏡頭是不是被手指蓋住」（量測前對位回饋與鎖定閘門）。
  // 蓋住＋閃光燈的鏡頭有三個好認的特徵，全用每幀已算的統計、零額外成本：
  //   1) 紅/綠比 rg＝R/G 高：光穿過組織，紅被放行、綠藍被吸收（最強判別）。
  //   2) 空間均勻度：紅通道變異係數 cv 低＝整片紅一片（沒蓋會有場景細節→cv 高）。
  //   3) 亮度：R 有一定亮度（排除「暗房沒東西蓋」的近黑畫面）。
  // R,G＝中央區塊紅/綠平均(0~255)；cv＝紅通道標準差/平均；cfg 可傳入覆寫（預設 COV_CFG）。
  function coverageScore(R, G, cv, cfg){
    cfg=cfg||COV_CFG;
    R=+R||0; G=+G||0; cv=+cv||0;
    var rg=R/((G||0)+1);
    var rgS=_clamp01((rg-cfg.rgLo)/(cfg.rgHi-cfg.rgLo));
    var uniS=_clamp01((cfg.cvHi-cv)/(cfg.cvHi-cfg.cvLo));
    var brightS=_clamp01((R-cfg.brLo)/(cfg.brHi-cfg.brLo));
    return rgS*cfg.wRg + uniS*cfg.wUni + brightS*cfg.wBr;
  }
  function _median(a){ var s=a.slice().sort(function(x,y){return x-y;}), n=s.length, h=Math.floor(n/2); return n? (n%2 ? s[h] : (s[h-1]+s[h])/2) : 0; }
  // 溫和偽差校正：只剔除偏離中位數 ±30% 的粗大偽差（漏拍倍長/假拍短間隔），
  // 保留真實逐拍變異。頻域分析要的就是變異，故進階用這版。
  function cleanRrGentle(rr){
    rr = (rr||[]).filter(function(x){ return x>0; });
    if (rr.length < 3) return rr;
    var med=_median(rr), lo=med*0.7, hi=med*1.3, band=[];
    for(var i=0;i<rr.length;i++){ if(rr[i]>=lo && rr[i]<=hi) band.push(rr[i]); }
    return band.length>=2 ? band : rr;
  }
  // 嚴格偽差校正（給快測 RMSSD 用）：溫和版＋連續差濾波（跳動 >20% 前值的非生理跳動剔除）。
  // RMSSD＝連續差的均方根，對掉訊號造成的假間隔極敏感，必須清乾淨否則會灌爆到數百 ms。
  function cleanRr(rr){
    var band=cleanRrGentle(rr);
    if (band.length < 2) return rr;
    var out=[band[0]];
    for(var i=1;i<band.length;i++){ var prev=out[out.length-1]; if(Math.abs(band[i]-prev)/prev <= 0.20) out.push(band[i]); }
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

  // 二階 Butterworth biquad 係數（RBJ cookbook，Q=1/√2）。type 'lp'|'hp'；fc 逼近 Nyquist 時回 null（略過該級）。
  function _biquad(type, fc, fs){
    if (!(fs>0) || !(fc>0) || fc >= fs*0.5*0.95) return null;
    var w0=2*Math.PI*fc/fs, cs=Math.cos(w0), al=Math.sin(w0)/(2*Math.SQRT1_2), a0=1+al, b0, b1, b2;
    if (type==='lp'){ b0=(1-cs)/2; b1=1-cs; b2=(1-cs)/2; }
    else { b0=(1+cs)/2; b1=-(1+cs); b2=(1+cs)/2; }
    return { b0:b0/a0, b1:b1/a0, b2:b2/a0, a1:-2*cs/a0, a2:(1-al)/a0 };
  }
  // 單向 biquad（直接 II 型轉置）；狀態以 x[0] 的穩態初始化，壓低起始暫態（同 scipy lfilter_zi）。
  function _biquadRun(c, x){
    var n=x.length, y=new Array(n); if(!n) return y;
    var x0=x[0], den=1+c.a1+c.a2, y0=den!==0 ? x0*(c.b0+c.b1+c.b2)/den : 0;
    var z2=c.b2*x0 - c.a2*y0, z1=y0 - c.b0*x0;
    for (var i=0;i<n;i++){
      var xi=x[i], yi=c.b0*xi + z1;
      z1 = c.b1*xi - c.a1*yi + z2;
      z2 = c.b2*xi - c.a2*yi;
      y[i]=yi;
    }
    return y;
  }
  // 零相位濾波（filtfilt）：前向＋反向各跑一次，相位抵消、波峰時間不偏移。
  // 兩端做奇對稱延伸（padLen 點）吸收邊界暫態，濾完再切掉。
  function _filtfilt(c, x, padLen){
    var n=x.length; if (!c || n<3) return x.slice();
    padLen=Math.max(0, Math.min(n-1, padLen|0));
    var ext=[], i;
    for (i=padLen;i>=1;i--) ext.push(2*x[0]-x[i]);
    for (i=0;i<n;i++) ext.push(x[i]);
    for (i=n-2;i>=n-1-padLen;i--) ext.push(2*x[n-1]-x[i]);
    var y=_biquadRun(c, ext).reverse();
    y=_biquadRun(c, y).reverse();
    return y.slice(padLen, padLen+n);
  }
  // 修剪開頭約 1.5 秒手指安定期 + 零相位帶通（0.5–4 Hz）去基線 → 回傳 { ac, t, fs }
  function _prep(samples){
    samples = samples||[];
    if (samples.length < 10) return null;
    var t0 = samples[0].t, trimmed = [];
    for (var z=0;z<samples.length;z++){ if (samples[z].t - t0 >= 1500) trimmed.push(samples[z]); }
    if (trimmed.length < 10) trimmed = samples; // 資料太短就不修剪
    var v0 = trimmed.map(function(s){ return s.v; }), t0s = trimmed.map(function(s){ return s.t; });
    var dur = t0s[t0s.length-1]-t0s[0], fs = dur>0 ? (v0.length-1)/(dur/1000) : 30;
    // IIR 假設等間隔取樣：去重複幀後時間軸會有空洞、出幀也有抖動 → 先線性內插到 fs 的等間隔網格。
    var v=v0, t=t0s;
    if (dur>0){
      var N=v0.length, step=dur/(N-1), j=0; v=new Array(N); t=new Array(N);
      for (var k=0;k<N;k++){
        var tt=t0s[0]+k*step;
        while (j<N-2 && t0s[j+1]<tt) j++;
        var ta=t0s[j], tb=t0s[j+1];
        v[k]= tb>ta ? v0[j]+(v0[j+1]-v0[j])*(tt-ta)/(tb-ta) : v0[j];
        t[k]=tt;
      }
    }
    // 二階 Butterworth 高通 0.5 Hz（去呼吸/手指壓力慢漂移）＋低通 4 Hz（去高頻雜訊），各跑 filtfilt。
    // 取代原本 ±1 秒移動平均：移動平均的頻率響應有大旁瓣、壓不掉高頻雜訊，波峰較毛。
    var pad=Math.round(fs*2);
    var ac=_filtfilt(_biquad('hp', 0.5, fs), v, pad);
    ac=_filtfilt(_biquad('lp', 4.0, fs), ac, pad);
    return { ac:ac, t:t, fs:fs };
  }
  // 找脈搏峰：穩健門檻＝正向 AC 的 90 百分位之半（單一動作尖峰拉不動百分位、雜訊也壓不低它，
  // 取代原本「全域最大值×0.4」會被一個尖峰綁架而漏掉大部分心跳）。回傳 { beats, heights }。
  function _detect(samples){
    var pr=_prep(samples); if(!pr) return { beats:[], heights:[] };
    var ac=pr.ac, t=pr.t, fs=pr.fs;
    var pos=[]; for(var j=0;j<ac.length;j++){ if(ac[j]>0) pos.push(ac[j]); }
    pos.sort(function(x,y){ return x-y; });
    var p90 = pos.length ? pos[Math.min(pos.length-1, Math.floor(pos.length*0.9))] : 0;
    var thr = p90*0.5;
    // 1) 收集所有超過門檻的區域極大值（候選峰，記 index 供次幀內插）
    var cand=[];
    for(var p=1;p<ac.length-1;p++){
      if (ac[p]>thr && ac[p]>=ac[p-1] && ac[p]>ac[p+1]) cand.push({ p:p, t:t[p], h:ac[p] });
    }
    // 2) 不應期內「最高峰優先」非極大抑制：主收縮峰最高→勝出；較矮的重搏切跡落在窗內→被壓掉。
    //    動態不應期＝主週期(自相關)×0.6：對重搏切跡免疫——切跡必在一個週期內，不管心率高低都被壓掉。
    //    （固定 380ms 在低心率時，切跡可能落在 380ms 之後而漏壓 → HR 仍偏快。）
    var pp=_periodicity(ac, fs);
    var REFRACT = pp.periodMs>0 ? Math.max(360, Math.min(1100, Math.round(pp.periodMs*0.6))) : 380;
    var order=cand.slice().sort(function(a,b){ return b.h-a.h; }); // 高→低
    var picked=[];
    for(var i=0;i<order.length;i++){
      var ok=true;
      for(var k=0;k<picked.length;k++){ if(Math.abs(order[i].t-picked[k].t)<REFRACT){ ok=false; break; } }
      if(ok) picked.push(order[i]);
    }
    picked.sort(function(a,b){ return a.t-b.t; });
    // 3) 次幀內插：用相鄰樣本的拋物線頂點精修波峰時間，解 30fps 量化（RMSSD 才不被量化抖動灌大）
    var beats=[], heights=[];
    for(var q=0;q<picked.length;q++){
      var pi=picked[q].p, bt=t[pi];
      if(pi>0 && pi<ac.length-1){
        var A=ac[pi-1], B=ac[pi], C=ac[pi+1], den=A-2*B+C;
        if(den!==0){ var dl=0.5*(A-C)/den; if(dl<=1 && dl>=-1){ bt=t[pi]+dl*(dl>=0?(t[pi+1]-t[pi]):(t[pi]-t[pi-1])); } }
      }
      beats.push(bt); heights.push(picked[q].h);
    }
    return { beats:beats, heights:heights };
  }
  // 自相關週期性分數(0~1)：真脈搏在 40-150bpm 對應 lag 有強自相關；雜訊接近 0。
  // 先 winsorize（以中位數絕對值×4 夾住離群暫態），否則單一大暫態會壟斷能量(c0)、把週期性壓成 0
  // ——即使脈搏其實很規律（真機實證：beats 13、好脈搏卻 per=0）。
  function _periodicity(ac, fs){
    var n=ac.length; if(n<20) return {r:0,periodMs:0};
    var absv=new Array(n); for(var i=0;i<n;i++) absv[i]=Math.abs(ac[i]);
    var srt=absv.slice().sort(function(a,b){return a-b;});
    var medAbs=srt[Math.floor(n/2)]||0, cap=medAbs>0 ? medAbs*4 : Infinity;
    var x=new Array(n), m=0;
    for(i=0;i<n;i++){ var c=ac[i]; if(c>cap)c=cap; else if(c<-cap)c=-cap; x[i]=c; m+=c; }
    m/=n; for(i=0;i<n;i++) x[i]-=m;
    var c0=0; for(i=0;i<n;i++) c0+=x[i]*x[i]; if(c0<=0) return {r:0,periodMs:0};
    var lagMin=Math.max(1,Math.round(fs*0.4)), lagMax=Math.round(fs*1.5), best=0, bestLag=0;
    for(var lag=lagMin; lag<=lagMax && lag<n; lag++){
      var cc=0; for(var j=0;j+lag<n;j++) cc+=x[j]*x[j+lag];
      var r=cc/c0; if(r>best){ best=r; bestLag=lag; }
    }
    return { r:best, periodMs: (bestLag>0 && fs>0) ? bestLag/fs*1000 : 0 };
  }
  function detectBeats(samples){ return _detect(samples).beats; }
  // 長錄音用：切成 winSec 秒一段、各用「局部門檻」偵測再串接。單一全域門檻會被高振幅段
  // 撐高、漏掉弱段落的心跳（2 分鐘量測常見）；分段後弱段也抓得到。
  function detectBeatsWindowed(samples, winSec){
    winSec = winSec || 30;
    samples = samples || [];
    if (samples.length < 10) return detectBeats(samples);
    var t0=samples[0].t, tEnd=samples[samples.length-1].t, beats=[], start=t0;
    while (start < tEnd){
      var end=start+winSec*1000, seg=[];
      for (var i=0;i<samples.length;i++){ if (samples[i].t>=start && samples[i].t<end) seg.push(samples[i]); }
      if (seg.length>=10){
        var b=_detect(seg).beats;
        for (var j=0;j<b.length;j++){ if (beats.length===0 || b[j]-beats[beats.length-1]>=300) beats.push(b[j]); }
      }
      start=end;
    }
    return beats;
  }
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
    var per=_periodicity(pr.ac, pr.fs).r;
    var d=_detect(samples), rr=rrFromBeats(d.beats);
    if (per < 0.30) return 'red';                  // 沒週期性＝雜訊（核心判斷）
    if (rr.length < 3) return 'yellow';            // 有週期但拍數還少＝收訊中（不判紅，否則會一直重置鎖定→難鎖）
    var hr = 60000/mean(rr);
    if (hr < 40 || hr > 150) return 'red';         // 不合生理／雜訊湊出的過快節律
    // 以週期性為準：真脈搏週期性強。不再用 rrCv 當門檻——漏拍會讓 RR 假性不規律、誤殺好訊號。
    if (per >= 0.42) return 'green';
    return 'yellow';
  }

  // 長錄音穩健聚合（給進階 2 分鐘用）：切成 winSec 秒一段，每段各自品質把關，
  // 只收「品質非紅、HR 合理」時段的 RR（溫和清理後）。壞時段直接丟掉——
  // 避免雜訊段污染 HR（兩次量同條件卻 88 vs 69）與心跳數（綠燈卻被誤擋）。
  // 回 { rr:[...], good:好時段數, bad:壞時段數 }。
  function rrFromGoodWindows(samples, winSec){
    winSec = winSec || 15;
    samples = samples || [];
    if (samples.length < 10) return { rr:[], good:0, bad:0 };
    var t0=samples[0].t, tEnd=samples[samples.length-1].t, allRr=[], good=0, bad=0, start=t0;
    while (start < tEnd){
      var end=start+winSec*1000, seg=[];
      for (var i=0;i<samples.length;i++){ if (samples[i].t>=start && samples[i].t<end) seg.push(samples[i]); }
      if (seg.length >= 10){
        if (signalQuality(seg) !== 'red'){
          var rr=cleanRrGentle(rrFromBeats(detectBeats(seg)));
          var hr=rr.length ? 60000/mean(rr) : 0;
          if (hr>=40 && hr<=150){ for(var j=0;j<rr.length;j++) allRr.push(rr[j]); good++; }
          else bad++;
        } else bad++;
      }
      start=end;
    }
    return { rr:allRr, good:good, bad:bad };
  }

  // 頻域專用：回「最長一段連續好窗」的 RR（不跨壞窗拼接）。
  // 頻域把不連續好窗接起來會在 tachogram 接縫注入相位跳變、污染低頻(LF)；
  // 故頻域改以最長連續段為準。逐窗品質把關：好窗延續當前連續段，壞窗/空窗中斷之。
  // 回 { rr:最長段的 RR, spanMs:該段總時長, good, bad }。
  function rrFromLongestGoodRun(samples, winSec){
    winSec = winSec || 15;
    samples = samples || [];
    if (samples.length < 10) return { rr:[], spanMs:0, good:0, bad:0 };
    var t0=samples[0].t, tEnd=samples[samples.length-1].t, good=0, bad=0, start=t0;
    var curRr=[], curSpan=0, bestRr=[], bestSpan=0;      // 當前連續段 vs 目前最長段
    while (start < tEnd){
      var end=start+winSec*1000, seg=[];
      for (var i=0;i<samples.length;i++){ if (samples[i].t>=start && samples[i].t<end) seg.push(samples[i]); }
      var winOk=false, winRr=null;
      if (seg.length >= 10){
        if (signalQuality(seg) !== 'red'){
          var rr=cleanRrGentle(rrFromBeats(detectBeats(seg)));
          var hr=rr.length ? 60000/mean(rr) : 0;
          if (hr>=40 && hr<=150){ winOk=true; winRr=rr; good++; } else bad++;
        } else bad++;
      }
      if (winOk){
        for(var j=0;j<winRr.length;j++){ curRr.push(winRr[j]); curSpan+=winRr[j]; }
        if (curSpan>bestSpan){ bestSpan=curSpan; bestRr=curRr.slice(); }
      } else { curRr=[]; curSpan=0; }                    // 壞窗/空窗中斷連續段
      start=end;
    }
    return { rr:bestRr, spanMs:bestSpan, good:good, bad:bad };
  }

  // —— 取樣前處理 ——
  // 去重複幀（rAF 備援路徑用）：紅綠平均與上一幀完全相同＝同一張相機影格被重複讀取；時間不遞增也丟。
  function dropDuplicateFrames(samples){
    samples=samples||[]; var out=[];
    for (var i=0;i<samples.length;i++){
      var s=samples[i], p=out.length ? out[out.length-1] : null;
      if (p && (s.t<=p.t || (s.v===p.v && s.g===p.g))) continue;
      out.push(s);
    }
    return out;
  }
  // 通道選擇：閃光燈下紅光常飽和（平頂、脈搏被削掉），此時綠光反而有脈搏。
  // 紅、綠各跑 _prep＋_periodicity，取週期性分數高者；差 <0.05 視為相近→選紅（沿用既有校準）。
  // 回 { channel:'r'|'g', samples:[{t,v}], scoreR, scoreG }。
  function pickChannel(samples){
    samples=samples||[];
    var r=[], g=[], hasG=samples.length>0;
    for (var i=0;i<samples.length;i++){
      var s=samples[i]; r.push({ t:s.t, v:s.v });
      if (typeof s.g==='number' && isFinite(s.g)) g.push({ t:s.t, v:s.g }); else hasG=false;
    }
    var pr=_prep(r), sr=pr ? _periodicity(pr.ac, pr.fs).r : 0;
    if (!hasG) return { channel:'r', samples:r, scoreR:sr, scoreG:0 };
    var pg=_prep(g), sg=pg ? _periodicity(pg.ac, pg.fs).r : 0;
    return (sg - sr >= 0.05) ? { channel:'g', samples:g, scoreR:sr, scoreG:sg }
                             : { channel:'r', samples:r, scoreR:sr, scoreG:sg };
  }

  // —— 偽差「標記」而非「刪除」——
  // 刪掉異常間隔再串接，會讓 RMSSD 把原本不相鄰的兩拍當相鄰比較；改為保留完整序列＋valid 旗標。
  // rr 中的 NaN＝結構性斷點（壞窗缺口）：不算偽差（不進 artifactRate 分母），但切斷相鄰關係。
  var SUCC_RESET=3; // 連續被「相鄰差 >20%」擋下這麼多次就重設錨點，避免錨點偏掉後整串誤殺
  function _markIntervals(rr){
    var n=rr.length, valid=new Array(n), inRange=[], i;
    for (i=0;i<n;i++){ valid[i]=isFinite(rr[i]) && rr[i]>=300 && rr[i]<=2000; if (valid[i]) inRange.push(rr[i]); }
    if (inRange.length){
      var med=_median(inRange), lo=med*0.7, hi=med*1.3;
      for (i=0;i<n;i++){ if (valid[i] && (rr[i]<lo || rr[i]>hi)) valid[i]=false; }
    }
    var prev=null, rej=0;
    for (i=0;i<n;i++){
      if (!isFinite(rr[i])){ prev=null; rej=0; continue; }   // 斷點後重新起錨
      if (!valid[i]) continue;
      if (prev!=null && Math.abs(rr[i]-prev)/prev > 0.20){
        valid[i]=false;
        if (++rej>=SUCC_RESET){ prev=null; rej=0; }
        continue;
      }
      prev=rr[i]; rej=0;
    }
    return { rr:rr, valid:valid };
  }
  // 由 beats（ms 時間點）產生完整 RR 與 valid：<300/>2000ms、偏離中位數 ±30%、與前一有效間隔差 >20% → 無效。
  function markRr(beats){
    beats=beats||[]; var rr=[];
    for (var i=1;i<beats.length;i++) rr.push(beats[i]-beats[i-1]);
    return _markIntervals(rr);
  }
  // HR/SDNN 只用有效間隔；RMSSD 只算「相鄰兩間隔皆有效」的連續差。
  // 回 { hr, rmssd, sdnn, n(有效數), artifactRate(無效比例), pairs(RMSSD 用到的連續差數) }。
  function metricsFromMarked(rr, valid){
    rr=rr||[]; valid=valid||[];
    var vals=[], total=0, bad=0, sq=0, pairs=0;
    for (var i=0;i<rr.length;i++){
      if (!isFinite(rr[i])) continue;
      total++;
      if (valid[i]) vals.push(rr[i]); else bad++;
      if (i>0 && valid[i] && valid[i-1]){ var d=rr[i]-rr[i-1]; sq+=d*d; pairs++; }
    }
    var art = total ? bad/total : 0;
    if (vals.length < 2) return { hr:0, rmssd:0, sdnn:0, n:vals.length, artifactRate:art, pairs:pairs };
    var mr=mean(vals), vs=0;
    for (var j=0;j<vals.length;j++){ var dv=vals[j]-mr; vs+=dv*dv; }
    return { hr:60000/mr, rmssd: pairs ? Math.sqrt(sq/pairs) : 0, sdnn:Math.sqrt(vs/vals.length),
             n:vals.length, artifactRate:art, pairs:pairs };
  }
  // 頻域用：無效間隔（含斷點）以前後最近有效值線性內插補上（兩端取最近有效值），不刪除→時間軸不被壓縮。
  function interpolateMarked(rr, valid){
    rr=rr||[]; valid=valid||[];
    var n=rr.length, out=new Array(n), idx=[], i;
    for (i=0;i<n;i++){ if (valid[i] && isFinite(rr[i])) idx.push(i); }
    if (!idx.length) return [];
    var k=0;
    for (i=0;i<n;i++){
      while (k<idx.length-1 && idx[k+1]<=i) k++;
      if (valid[i] && isFinite(rr[i])){ out[i]=rr[i]; continue; }
      var a=idx[k], b=idx[k+1];
      if (i<a || b==null) out[i]=rr[i<a ? a : idx[idx.length-1]];
      else out[i]=rr[a]+(rr[b]-rr[a])*(i-a)/(b-a);
    }
    return out;
  }
  // 逐窗掃描（標記版共用）：品質判定與 rrFromGoodWindows 相同；好窗的心跳在「前延 1.5 秒＋後延 1 秒」
  // 的擴充段上偵測，只收落在本窗 [start,end) 的拍——_prep 修掉的是前延那段，接縫兩拍的間隔就是真實 RR，
  // 窗界附近的峰也不會因缺鄰點而漏掉。回 [{ ok, empty, beats }]。
  function _scanWindows(samples, winSec){
    winSec=winSec||15; samples=samples||[];
    var wins=[]; if (samples.length<10) return wins;
    var t0=samples[0].t, tEnd=samples[samples.length-1].t, start=t0;
    while (start < tEnd){
      var end=start+winSec*1000, seg=[], ext=[];
      for (var i=0;i<samples.length;i++){
        var tt=samples[i].t;
        if (tt>=start && tt<end) seg.push(samples[i]);
        if (tt>=start-1500 && tt<end+1000) ext.push(samples[i]);
      }
      var w={ ok:false, empty:seg.length<10, beats:[] };
      if (!w.empty && signalQuality(seg)!=='red'){
        var rr=cleanRrGentle(rrFromBeats(detectBeats(seg)));
        var hr=rr.length ? 60000/mean(rr) : 0;
        if (hr>=40 && hr<=150){
          w.ok=true;
          var b=detectBeats(ext);
          for (var j=0;j<b.length;j++){ if (b[j]>=start && b[j]<end) w.beats.push(b[j]); }
        }
      }
      wins.push(w); start=end;
    }
    return wins;
  }
  // 標記版好窗聚合（結果頁 HR/RMSSD 用）：只收好窗的拍；中間隔著壞窗/空窗處插 NaN 斷點（不跨缺口相鄰）。
  // 回 { rr, valid, good, bad }。
  function rrMarkedFromGoodWindows(samples, winSec){
    var wins=_scanWindows(samples, winSec), rr=[], good=0, bad=0, last=null, brk=false;
    for (var i=0;i<wins.length;i++){
      var w=wins[i];
      if (!w.ok){ if (!w.empty) bad++; brk=true; continue; }
      good++;
      for (var j=0;j<w.beats.length;j++){
        var b=w.beats[j];
        if (last!=null) rr.push(brk ? NaN : b-last);
        brk=false; last=b;
      }
    }
    var mk=_markIntervals(rr);
    return { rr:mk.rr, valid:mk.valid, good:good, bad:bad };
  }
  // 標記版最長連續好窗（頻域用）：連續好窗的拍串成一段，取時間跨度最長者。回 { rr, valid, spanMs, good, bad }。
  function rrMarkedFromLongestGoodRun(samples, winSec){
    var wins=_scanWindows(samples, winSec), good=0, bad=0, cur=[], best=[], bestSpan=0;
    for (var i=0;i<wins.length;i++){
      var w=wins[i];
      if (w.ok){
        good++;
        for (var j=0;j<w.beats.length;j++) cur.push(w.beats[j]);
        var span=cur.length>1 ? cur[cur.length-1]-cur[0] : 0;
        if (span>bestSpan){ bestSpan=span; best=cur.slice(); }
      } else { if (!w.empty) bad++; cur=[]; }
    }
    var mk=markRr(best);
    return { rr:mk.rr, valid:mk.valid, spanMs:bestSpan, good:good, bad:bad };
  }

  root.HrvAnalyze = {
    metricsFromRr: metricsFromRr, classify: classify, cleanRr: cleanRr, cleanRrGentle: cleanRrGentle,
    detectBeats: detectBeats, detectBeatsWindowed: detectBeatsWindowed, rrFromGoodWindows: rrFromGoodWindows, rrFromLongestGoodRun: rrFromLongestGoodRun, rrFromBeats: rrFromBeats, signalQuality: signalQuality,
    coverageScore: coverageScore, COV_CFG: COV_CFG,
    dropDuplicateFrames: dropDuplicateFrames, pickChannel: pickChannel,
    markRr: markRr, metricsFromMarked: metricsFromMarked, interpolateMarked: interpolateMarked,
    rrMarkedFromGoodWindows: rrMarkedFromGoodWindows, rrMarkedFromLongestGoodRun: rrMarkedFromLongestGoodRun,
    _mean: mean, _prep: _prep, _periodicity: _periodicity
  };
})(typeof window !== 'undefined' ? window : this);
