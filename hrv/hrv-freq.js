// hrv-freq.js — HRV 頻域分析（可測純函式）。掛 window.HrvFreq。
(function (root) {
  'use strict';
  function mean(a){ var s=0; for(var i=0;i<a.length;i++) s+=a[i]; return a.length?s/a.length:0; }
  function clamp(x,lo,hi){ return x<lo?lo:(x>hi?hi:x); }

  // RR 間隔(ms) → fs Hz 等間隔 tachogram（線性內插）
  function resampleRr(rr, fs){
    fs = fs||4;
    rr = (rr||[]).filter(function(v){ return v>0; });
    if (rr.length < 4) return { series:[], fs:fs };
    var x=[], y=[], t=0;
    for (var i=0;i<rr.length;i++){ x.push(t); y.push(rr[i]); t += rr[i]/1000; } // 第 i 拍時間(s)、值=rr[i]
    var T=x[x.length-1], n=Math.floor(T*fs), series=[], j=0;
    for (var k=0;k<n;k++){
      var tt=k/fs;
      while (j<x.length-2 && x[j+1]<tt) j++;
      var x0=x[j], x1=x[j+1], y0=y[j], y1=y[j+1];
      series.push(x1>x0 ? y0+(y1-y0)*(tt-x0)/(x1-x0) : y0);
    }
    return { series:series, fs:fs };
  }

  // 就地 radix-2 FFT（長度需 2 的次方）
  function fft(re, im){
    var n=re.length, i, j, bit;
    for (i=1, j=0; i<n; i++){
      for (bit=n>>1; j&bit; bit>>=1) j^=bit;
      j^=bit;
      if (i<j){ var tr=re[i]; re[i]=re[j]; re[j]=tr; var ti=im[i]; im[i]=im[j]; im[j]=ti; }
    }
    for (var len=2; len<=n; len<<=1){
      var ang=-2*Math.PI/len, wr=Math.cos(ang), wi=Math.sin(ang);
      for (i=0; i<n; i+=len){
        var cr=1, ci=0;
        for (j=0; j<len/2; j++){
          var ur=re[i+j], ui=im[i+j];
          var vr=re[i+j+len/2]*cr - im[i+j+len/2]*ci;
          var vi=re[i+j+len/2]*ci + im[i+j+len/2]*cr;
          re[i+j]=ur+vr; im[i+j]=ui+vi;
          re[i+j+len/2]=ur-vr; im[i+j+len/2]=ui-vi;
          var ncr=cr*wr-ci*wi; ci=cr*wi+ci*wr; cr=ncr;
        }
      }
    }
  }

  // 去均值＋Hanning 窗＋補零至 2 次方→FFT→週期圖→頻帶積分。回 {lf,hf,total,lfhf}
  function bandPowers(series, fs){
    fs = fs||4;
    var n0=(series||[]).length;
    if (n0 < 16) return { lf:0, hf:0, total:0, lfhf:0 };
    var m=mean(series), x=new Array(n0);
    for (var i=0;i<n0;i++) x[i]=series[i]-m;
    var winSq=0, re=[], im=[];
    for (i=0;i<n0;i++){ var w=0.5-0.5*Math.cos(2*Math.PI*i/(n0-1)); winSq+=w*w; re.push(x[i]*w); im.push(0); }
    var N=1; while(N<n0) N<<=1;
    while(re.length<N){ re.push(0); im.push(0); }
    fft(re, im);
    var df=fs/N, norm=1/(fs*winSq), lf=0, hf=0, total=0;
    for (var k=1;k<N/2;k++){
      var p=(re[k]*re[k]+im[k]*im[k])*norm, f=k*df;
      if (f>=0.0033 && f<0.40) total+=p*df;
      if (f>=0.04   && f<0.15) lf+=p*df;
      if (f>=0.15   && f<0.40) hf+=p*df;
    }
    return { lf:lf, hf:hf, total:total, lfhf: hf>0 ? lf/hf : 0 };
  }

  function scoreLog(x, lo, hi){ if(x<=0) return 0; return clamp(100*(Math.log(x)-Math.log(lo))/(Math.log(hi)-Math.log(lo)), 0, 100); }
  function scoreLin(x, lo, hi){ return clamp(100*(x-lo)/(hi-lo), 0, 100); }
  function lvl(s){ return s>=67?'high':(s>=34?'mid':'low'); }
  var LBL={high:'高',mid:'中',low:'低'};
  // 四指數的白話建議（依面向＋高低）
  var ADV={
    relax:{high:'副交感活躍，身體偏休息放鬆。',mid:'放鬆程度中等。',low:'放鬆訊號偏低，給自己一點喘息。'},
    stress:{high:'交感偏主導，壓力訊號較明顯，留意休息。',mid:'壓力張力中等。',low:'壓力訊號低，狀態平穩。'},
    vitality:{high:'整體自律神經活性高，活力充沛。',mid:'活力中等。',low:'整體活性偏低，可能累了或需要休息。'},
    flexibility:{high:'心率變化豐富，自律調節有彈性。',mid:'調節彈性中等。',low:'變化偏小，彈性較低。'}
  };
  function mk(face, score){ var l=lvl(score); return { score:Math.round(score), level:l, label:LBL[l], advice:ADV[face][l] }; }
  // 參考範圍＝相對校準的合理估值（非臨床常模）；hfnu/lfhf 為尺度無關較穩健
  function indices(bp, td){
    bp=bp||{}; td=td||{};
    var hfnu = (bp.lf+bp.hf)>0 ? bp.hf/(bp.lf+bp.hf) : 0;        // 副交感占比 0~1
    var relax = mk('relax', hfnu*100);
    var stress = mk('stress', scoreLin(bp.lfhf||0, 0.5, 4));
    var vitality = mk('vitality', scoreLog(bp.total||0, 100, 8000));
    var flexibility = mk('flexibility', scoreLog(td.sdnn||0, 10, 120));
    return { relax:relax, stress:stress, vitality:vitality, flexibility:flexibility };
  }

  root.HrvFreq = { resampleRr:resampleRr, fft:fft, bandPowers:bandPowers, indices:indices, _mean:mean, _clamp:clamp };
})(typeof window !== 'undefined' ? window : this);
