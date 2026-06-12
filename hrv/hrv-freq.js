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

  root.HrvFreq = { resampleRr:resampleRr, fft:fft, _mean:mean, _clamp:clamp };
})(typeof window !== 'undefined' ? window : this);
