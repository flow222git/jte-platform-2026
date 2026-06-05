// ═══════════════════════════════════════════
// Breeeeeathe~ 呼吸覺察
// ═══════════════════════════════════════════
var CLIENT_ID='1052529942242-jvr7ik3f7r987l5lq889nrfkjheoovg7.apps.googleusercontent.com';
var SEGMENT_SECONDS=15;
var HIST_KEY='jte_breathe_history';
var FREQ_G=196.00, FREQ_C=130.81;

// 呼吸法設定
var GUIDED={
  resonance:{name:'諧振呼吸',sub:'調節自主神經系統',inhale:5.5,holdIn:0,exhale:5.5,holdOut:0,
    info:'研究顯示，每分鐘 6 次的呼吸頻率（0.1Hz），最能有效調節自主神經系統，提升心率變異性（HRV），讓身心進入諧振狀態。',
    guideInhale:'讓空氣自然流入',guideExhale:'不需要用力，讓呼吸自己延長就好'},
  box:{name:'箱式呼吸',sub:'軍事與運動心理學的抗壓技術',inhale:4,holdIn:4,exhale:4,holdOut:4,
    info:'吸 4 秒、屏息 4 秒、吐 4 秒、屏息 4 秒，形成完整的「呼吸方塊」。常用於高壓情境下穩定身心。',
    guideInhale:'讓腹部先擴張，胸口後跟上',guideExhale:'把肩膀的緊繃也送出去',guideHold:'讓氣靜靜停在身體裡'},
  counting:{name:'數息法',sub:'延長吐氣，啟動放鬆',inhale:4,holdIn:0,exhale:6,holdOut:0,
    info:'吸氣 4 秒、吐氣 6 秒。吐氣比吸氣長，能啟動副交感神經，讓身體進入放鬆狀態。',
    guideInhale:'安靜地吸氣',guideExhale:'緩緩把氣吐長，心中默數'}
};

// 狀態
var S={
  mode:null, active:false, startAt:0,
  currentSide:null, events:[],
  cur:{inhaleStartAt:0,inhaleEndAt:0,exhaleStartAt:0,exhaleEndAt:0},
  timerInt:null, audioCtx:null, currentOsc:null,
  wavePoints:[], waveRAF:null, activePhaseInt:null,
  // guided
  guidedDuration:5, guidedTimeout:null, guidedEndTimeout:null
};

// ═══ 音效 ═══
function initAudio(){
  if(!S.audioCtx){try{S.audioCtx=new (window.AudioContext||window.webkitAudioContext)();}catch(e){}}
  if(S.audioCtx&&S.audioCtx.state==='suspended')S.audioCtx.resume();
}
function playTone(freq){
  if(!S.audioCtx)return;
  stopTone();
  var ctx=S.audioCtx,now=ctx.currentTime;
  var master=ctx.createGain();
  master.gain.setValueAtTime(0,now);
  master.gain.linearRampToValueAtTime(0.16,now+0.1);
  master.connect(ctx.destination);
  var harmonics=[1,2,3,4],gains=[1,0.5,0.25,0.12],oscs=[];
  harmonics.forEach(function(h,i){
    var osc=ctx.createOscillator(),g=ctx.createGain();
    osc.type='sine';osc.frequency.value=freq*h;g.gain.value=gains[i];
    osc.connect(g);g.connect(master);osc.start(now);oscs.push(osc);
  });
  S.currentOsc={oscs:oscs,master:master};
}
function stopTone(){
  if(S.currentOsc){
    var ctx=S.audioCtx,now=ctx.currentTime;
    try{
      S.currentOsc.master.gain.linearRampToValueAtTime(0,now+0.12);
      var oscs=S.currentOsc.oscs;
      setTimeout(function(){oscs.forEach(function(o){try{o.stop()}catch(e){}})},150);
    }catch(e){}
    S.currentOsc=null;
  }
}

// ═══ 工具 ═══
function avg(a){return a.length?a.reduce(function(x,y){return x+y},0)/a.length:0;}
function std(a){if(a.length<2)return 0;var m=avg(a);return Math.sqrt(avg(a.map(function(x){return (x-m)*(x-m)})));}
function clamp(v,lo,hi){return Math.max(lo,Math.min(hi,v));}
function todayKey(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}

// ═══════════════════════════════════════════
// 自然偵測
// ═══════════════════════════════════════════
function openDetect(){
  S.mode='natural';
  document.getElementById('detect-screen').classList.add('active');
  resetDetectUI();
}
function resetDetectUI(){
  document.getElementById('orb-idle').style.display='block';
  document.getElementById('orb-active').classList.remove('show');
  document.getElementById('detect-go').style.display='inline-block';
  document.getElementById('detect-end').style.display='none';
  document.getElementById('detect-timer').style.display='none';
  document.getElementById('detect-eyebrow').textContent='HOW TO USE';
  document.getElementById('orb-left').classList.remove('lit');
  document.getElementById('orb-right').classList.remove('lit');
}

function startDetect(){
  S.active=true;S.startAt=Date.now();S.events=[];S.currentSide=null;
  S.cur={inhaleStartAt:0,inhaleEndAt:0,exhaleStartAt:0,exhaleEndAt:0};
  S.wavePoints=[];
  initAudio();

  document.getElementById('orb-idle').style.display='none';
  document.getElementById('orb-active').classList.add('show');
  document.getElementById('detect-go').style.display='none';
  document.getElementById('detect-end').style.display='inline-block';
  document.getElementById('detect-timer').style.display='block';
  document.getElementById('detect-eyebrow').textContent='覺察中';
  document.getElementById('orb-phase').textContent='開始吸氣';
  document.getElementById('orb-state').textContent='';

  initWaveCanvas();
  bindOrbTouch();
  S.timerInt=setInterval(updateDetectTimer,200);
}

function updateDetectTimer(){
  var sec=Math.floor((Date.now()-S.startAt)/1000);
  document.getElementById('detect-timer').textContent=Math.floor(sec/60)+':'+String(sec%60).padStart(2,'0');
}

function bindOrbTouch(){
  var left=document.getElementById('orb-left');
  var right=document.getElementById('orb-right');
  var orb=document.getElementById('orb');

  var si=function(e){e.preventDefault();onInhaleStart();orb.classList.add('pressed');left.classList.add('lit');};
  var ei=function(e){e.preventDefault();onInhaleEnd();orb.classList.remove('pressed');left.classList.remove('lit');};
  var se=function(e){e.preventDefault();onExhaleStart();orb.classList.add('pressed');right.classList.add('lit');};
  var ee=function(e){e.preventDefault();onExhaleEnd();orb.classList.remove('pressed');right.classList.remove('lit');};

  left.ontouchstart=si;left.ontouchend=ei;left.ontouchcancel=ei;
  left.onmousedown=si;left.onmouseup=ei;left.onmouseleave=function(e){if(S.currentSide==='inhale')ei(e);};
  right.ontouchstart=se;right.ontouchend=ee;right.ontouchcancel=ee;
  right.onmousedown=se;right.onmouseup=ee;right.onmouseleave=function(e){if(S.currentSide==='exhale')ee(e);};
}

// 四相偵測
function onInhaleStart(){
  var now=Date.now();
  if(S.cur.inhaleStartAt&&S.cur.exhaleEndAt)finalizeCycle(now);
  S.currentSide='inhale';S.cur.inhaleStartAt=now;
  pushWave(1);startActivePhase(1);playTone(FREQ_G);
  document.getElementById('orb-phase').textContent='吸氣';
}
function onInhaleEnd(){
  S.currentSide=null;S.cur.inhaleEndAt=Date.now();
  stopActivePhase();pushWave(0.5);stopTone();
  document.getElementById('orb-phase').textContent='屏息';
}
function onExhaleStart(){
  S.currentSide='exhale';S.cur.exhaleStartAt=Date.now();
  pushWave(0);startActivePhase(0);playTone(FREQ_C);
  document.getElementById('orb-phase').textContent='吐氣';
}
function onExhaleEnd(){
  S.currentSide=null;S.cur.exhaleEndAt=Date.now();
  stopActivePhase();pushWave(0.5);stopTone();
  document.getElementById('orb-phase').textContent='屏息';
}
function finalizeCycle(cycleEndAt){
  var c=S.cur;
  if(!c.inhaleStartAt||!c.inhaleEndAt||!c.exhaleStartAt||!c.exhaleEndAt){
    S.cur={inhaleStartAt:cycleEndAt,inhaleEndAt:0,exhaleStartAt:0,exhaleEndAt:0};return;
  }
  var inhaleDuration=(c.inhaleEndAt-c.inhaleStartAt)/1000;
  var holdAfterInhale=(c.exhaleStartAt-c.inhaleEndAt)/1000;
  var exhaleDuration=(c.exhaleEndAt-c.exhaleStartAt)/1000;
  var holdAfterExhale=(cycleEndAt-c.exhaleEndAt)/1000;
  var cycleDuration=inhaleDuration+holdAfterInhale+exhaleDuration+holdAfterExhale;
  S.events.push({
    inhaleDuration:inhaleDuration,holdAfterInhaleDuration:holdAfterInhale,
    exhaleDuration:exhaleDuration,holdAfterExhaleDuration:holdAfterExhale,
    holdDuration:holdAfterInhale+holdAfterExhale,cycleDuration:cycleDuration,
    relStart:(c.inhaleStartAt-S.startAt)/1000,
    isValid:(inhaleDuration>=0.4&&exhaleDuration>=0.4)
  });
  S.cur={inhaleStartAt:cycleEndAt,inhaleEndAt:0,exhaleStartAt:0,exhaleEndAt:0};
}

// 波形
function pushWave(phase){if(S.active)S.wavePoints.push({t:Date.now()-S.startAt,phase:phase});}
function startActivePhase(phase){stopActivePhase();S.activePhaseInt=setInterval(function(){if(S.active)S.wavePoints.push({t:Date.now()-S.startAt,phase:phase});},120);}
function stopActivePhase(){if(S.activePhaseInt){clearInterval(S.activePhaseInt);S.activePhaseInt=null;}}

var waveCanvas,waveCtx;
function initWaveCanvas(){
  waveCanvas=document.getElementById('waveform');
  waveCtx=waveCanvas.getContext('2d');
  var dpr=window.devicePixelRatio||1;
  waveCanvas.width=waveCanvas.offsetWidth*dpr;
  waveCanvas.height=waveCanvas.offsetHeight*dpr;
  if(S.waveRAF)cancelAnimationFrame(S.waveRAF);
  drawWave();
}
function phaseY(phase,H){var pad=H*0.2;return pad+(H-2*pad)*(1-phase);}
function drawWave(){
  if(!S.active)return;
  var W=waveCanvas.width,H=waveCanvas.height,dpr=window.devicePixelRatio||1;
  waveCtx.clearRect(0,0,W,H);
  var now=Date.now()-S.startAt,windowMs=16000;
  var livePhase=S.currentSide==='inhale'?1:S.currentSide==='exhale'?0:0.5;
  var visible=S.wavePoints.concat([{t:now,phase:livePhase}]);
  var startT=Math.max(0,now-windowMs);
  if(visible.length>=2){
    waveCtx.beginPath();var first=true;
    for(var i=0;i<visible.length;i++){
      var p=visible[i];if(p.t<startT)continue;
      var x=((p.t-startT)/windowMs)*W,y=phaseY(p.phase,H);
      if(first){waveCtx.moveTo(x,y);first=false;}
      else{var prev=visible[i-1];var px=((prev.t-startT)/windowMs)*W;waveCtx.lineTo(px+1,y);waveCtx.lineTo(x,y);}
    }
    waveCtx.lineTo(W,phaseY(livePhase,H));
    waveCtx.strokeStyle='rgba(255,255,255,0.85)';
    waveCtx.lineWidth=2*dpr;waveCtx.lineCap='round';waveCtx.lineJoin='round';waveCtx.stroke();
  }
  S.waveRAF=requestAnimationFrame(drawWave);
}

function endDetect(){
  S.active=false;
  clearInterval(S.timerInt);stopActivePhase();
  if(S.waveRAF)cancelAnimationFrame(S.waveRAF);
  stopTone();
  if(S.cur.inhaleStartAt&&S.cur.exhaleEndAt)finalizeCycle(Date.now());
  document.getElementById('detect-screen').classList.remove('active');
  var analysis=analyze(S.events,(Date.now()-S.startAt)/1000);
  renderReport(analysis);
  showPage('report');
}

// ═══════════════════════════════════════════
// 分析（含前中後三段）
// ═══════════════════════════════════════════
function analyze(events,totalSec){
  var valid=events.filter(function(e){return e.isValid;});
  var inhales=valid.map(function(e){return e.inhaleDuration;});
  var exhales=valid.map(function(e){return e.exhaleDuration;});
  var holds=valid.map(function(e){return e.holdDuration;});
  var cycles=valid.map(function(e){return e.cycleDuration;});
  var avgInhale=avg(inhales),avgExhale=avg(exhales),avgHold=avg(holds),avgCycle=avg(cycles);
  var breathRate=avgCycle>0?60/avgCycle:0;
  var holdFraction=avgCycle>0?avgHold/avgCycle:0;
  var cv=avgCycle>0?std(cycles)/avgCycle:0;
  var stabilityScore=clamp(100-cv*100,0,100);
  var exhaleInhaleRatio=avgInhale>0?avgExhale/avgInhale:0;
  var ihe=avgInhale>0?('1 : '+(avgHold/avgInhale).toFixed(2)+' : '+(avgExhale/avgInhale).toFixed(2)):'—';

  var segments=buildSegments(valid,totalSec);
  var thirds=buildThirds(valid);  // 前中後三段
  var pattern=judgePattern({breathRate:breathRate,avgInhale:avgInhale,avgExhale:avgExhale,stabilityScore:stabilityScore,exhaleInhaleRatio:exhaleInhaleRatio,hasDiscomfort:false});
  var transition=judgeTransition(thirds,valid,inhales,exhales);

  return {validCount:valid.length,totalCount:events.length,totalSec:totalSec,
    avgInhale:avgInhale,avgExhale:avgExhale,avgHold:avgHold,avgCycle:avgCycle,
    breathRate:breathRate,holdFraction:holdFraction,stabilityScore:stabilityScore,
    exhaleInhaleRatio:exhaleInhaleRatio,ihe:ihe,segments:segments,thirds:thirds,
    pattern:pattern,transition:transition};
}

function buildSegments(valid,totalSec){
  var segs=[],nSeg=Math.max(1,Math.ceil(totalSec/SEGMENT_SECONDS));
  for(var i=0;i<nSeg;i++){
    var lo=i*SEGMENT_SECONDS,hi=(i+1)*SEGMENT_SECONDS;
    var inSeg=valid.filter(function(e){return e.relStart>=lo&&e.relStart<hi;});
    if(!inSeg.length)continue;
    var cyc=inSeg.map(function(e){return e.cycleDuration;});
    var ac=avg(cyc),cvSeg=ac>0?std(cyc)/ac:0;
    segs.push({idx:i,breathCount:inSeg.length,breathRate:ac>0?60/ac:0,
      avgInhale:avg(inSeg.map(function(e){return e.inhaleDuration;})),
      avgHold:avg(inSeg.map(function(e){return e.holdDuration;})),
      avgExhale:avg(inSeg.map(function(e){return e.exhaleDuration;})),
      stabilityScore:clamp(100-cvSeg*100,0,100)});
  }
  return segs;
}

// 前中後三段
function buildThirds(valid){
  if(valid.length<3)return null;
  var n=valid.length,third=Math.floor(n/3);
  var parts=[valid.slice(0,third),valid.slice(third,third*2),valid.slice(third*2)];
  return parts.map(function(part,i){
    var cyc=part.map(function(e){return e.cycleDuration;});
    var ac=avg(cyc),cvP=ac>0?std(cyc)/ac:0;
    return {label:['前段','中段','後段'][i],count:part.length,
      breathRate:ac>0?60/ac:0,stabilityScore:clamp(100-cvP*100,0,100),
      avgInhale:avg(part.map(function(e){return e.inhaleDuration;})),
      avgExhale:avg(part.map(function(e){return e.exhaleDuration;}))};
  });
}

function judgePattern(m){
  if(m.hasDiscomfort||m.breathRate<5)return {key:'overcontrol',label:'過度控制型',hero:'warn',text:'你可能正在過度控制呼吸。請先停止練習，回到自然呼吸。'};
  if(m.breathRate>18&&m.avgInhale<1.5&&m.avgExhale<2&&m.stabilityScore<70)return {key:'shallow',label:'疑似淺快節奏',hero:'warn',text:'呼吸呈現短而快的時序型態，建議先放慢吐氣。'};
  if(m.breathRate>16)return {key:'fast',label:'偏急促型',hero:'warn',text:'呼吸偏快，可能處於較高警覺或緊繃狀態。'};
  if(m.exhaleInhaleRatio<1.05&&m.breathRate>12)return {key:'shortexhale',label:'吐氣偏短型',hero:'blue',text:'吐氣時間偏短，建議讓吐氣比吸氣多 1 到 2 秒。'};
  if(m.avgInhale>m.avgExhale*1.2)return {key:'inhaledom',label:'吸氣主導型',hero:'blue',text:'吸氣相對較長，建議不要刻意吸太滿，把重點放在自然吐氣。'};
  if(m.stabilityScore<60)return {key:'unstable',label:'節奏不穩型',hero:'blue',text:'呼吸節奏忽快忽慢，建議先建立固定節奏。'};
  if(m.breathRate>=5&&m.breathRate<=7&&m.stabilityScore>=75)return {key:'resonance',label:'慢速共振型',hero:'green',text:'呼吸接近慢速穩定區間，可作為共振呼吸入門。'};
  if(m.breathRate>=8&&m.breathRate<=12&&m.stabilityScore>=70)return {key:'stable',label:'穩定自然型',hero:'green',text:'呼吸節奏相對穩定，可進一步練習吐氣延長。'};
  return {key:'observe',label:'自然觀察型',hero:'gold',text:'目前呼吸沒有明顯單一特徵，建議持續觀察並建立個人基準。'};
}

function judgeTransition(thirds,valid,inhales,exhales){
  if(!thirds||valid.length<4)return {key:'insufficient',text:'本次有效呼吸次數較少，暫不判斷呼吸狀態轉變。'};
  var first=thirds[0],last=thirds[2];
  var rateDelta=last.breathRate-first.breathRate;
  var stabDelta=last.stabilityScore-first.stabilityScore;
  var inhaleCv=avg(inhales)>0?std(inhales)/avg(inhales):0;
  var exhaleCv=avg(exhales)>0?std(exhales)/avg(exhales):0;
  if(rateDelta<=-3)return {key:'slowing',tone:'good',text:'你一開始的呼吸較快，後段有逐漸放慢，代表練習中出現調節效果。'};
  if(rateDelta>=3)return {key:'speeding',tone:'warn',text:'你的呼吸在後段變快，可能是用力、分心或身體不適的訊號。'};
  if(stabDelta>=15)return {key:'stabilizing',tone:'good',text:'前段呼吸起伏較明顯，後段穩定度提升，代表節奏逐漸被身體接住。'};
  if(stabDelta<=-15)return {key:'destabilizing',tone:'warn',text:'後段呼吸穩定度下降，可能代表練習時間過長、注意力轉移或節奏設定不太適合。'};
  if(inhaleCv>0.3||exhaleCv>0.3)return {key:'varied',tone:'',text:'你的吸氣或吐氣長短變化較大，呈現有時較深、有時較淺的時序型態。'};
  return {key:'consistent',tone:'',text:'本次練習中呼吸頻率、吸吐時間與穩定度沒有明顯大幅轉變，整體節奏相對一致。'};
}

// ═══════════════════════════════════════════
// 指定呼吸法
// ═══════════════════════════════════════════
function openGuidedSetup(key){
  S.mode=key;
  var g=GUIDED[key];
  document.getElementById('gs-title').textContent=g.name;
  document.getElementById('gs-subtitle').textContent=g.sub;
  document.getElementById('gs-info').textContent=g.info;
  document.getElementById('gs-slider').value=5;
  document.getElementById('gs-dur-val').textContent=5;
  S.guidedDuration=5;
  document.getElementById('guided-setup').classList.add('active');
}
function updateDuration(v){S.guidedDuration=parseInt(v);document.getElementById('gs-dur-val').textContent=v;}
function closeGuidedSetup(){document.getElementById('guided-setup').classList.remove('active');}

function startGuided(){
  closeGuidedSetup();
  initAudio();
  S.active=true;S.startAt=Date.now();
  var g=GUIDED[S.mode];
  document.getElementById('gp-mode').textContent=g.name;
  document.getElementById('gp-guide').textContent='';
  var screen=document.getElementById('guided-screen');
  screen.className='guided-screen active';

  var totalMs=S.guidedDuration*60*1000;
  S.timerInt=setInterval(function(){
    var remain=Math.max(0,totalMs-(Date.now()-S.startAt));
    var sec=Math.ceil(remain/1000);
    document.getElementById('gp-timer').textContent=String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0');
  },200);

  // 四相循環
  var phases=[
    {name:'吸',full:'吸 氣',dur:g.inhale,bg:'inhale',freq:FREQ_G,guide:g.guideInhale},
    {name:'屏',full:'屏 息',dur:g.holdIn,bg:'',freq:null,guide:g.guideHold||'讓氣停留'},
    {name:'吐',full:'吐 氣',dur:g.exhale,bg:'exhale',freq:FREQ_C,guide:g.guideExhale},
    {name:'屏',full:'屏 息',dur:g.holdOut,bg:'',freq:null,guide:g.guideHold||'感受身體的空'}
  ].filter(function(p){return p.dur>0;});

  var idx=0;
  function runPhase(){
    if(!S.active)return;
    var ph=phases[idx%phases.length];idx++;
    document.getElementById('gp-cue').textContent=ph.name;
    document.getElementById('gp-phase-sub').textContent=ph.full;
    document.getElementById('gp-guide').textContent=ph.guide;
    var sc=document.getElementById('guided-screen');
    sc.className='guided-screen active'+(ph.bg?' '+ph.bg:'');
    if(ph.freq)playTone(ph.freq);else stopTone();
    var bar=document.getElementById('gp-progress');
    bar.style.transition='none';bar.style.width='0%';
    setTimeout(function(){bar.style.transition='width '+ph.dur+'s linear';bar.style.width='100%';},30);
    S.guidedTimeout=setTimeout(runPhase,ph.dur*1000);
  }
  runPhase();

  // 時間到自動結束
  S.guidedEndTimeout=setTimeout(function(){endGuided();},totalMs);
}

function endGuided(){
  S.active=false;
  clearInterval(S.timerInt);
  if(S.guidedTimeout)clearTimeout(S.guidedTimeout);
  if(S.guidedEndTimeout)clearTimeout(S.guidedEndTimeout);
  stopTone();
  document.getElementById('guided-screen').className='guided-screen';
  renderGuidedReport((Date.now()-S.startAt)/1000);
  showPage('report');
}

// ═══════════════════════════════════════════
// 報告：自然偵測
// ═══════════════════════════════════════════
var _last=null, _rstate={feelings:[],discomforts:[],note:''};

function renderReport(a){
  _last=a;_rstate={feelings:[],discomforts:[],note:''};
  var el=document.getElementById('report-content');
  var html='';

  html+='<div class="report-hero '+a.pattern.hero+'">'+
    '<div class="report-mode">自然偵測 · '+Math.floor(a.totalSec/60)+'分'+Math.round(a.totalSec%60)+'秒 · '+a.validCount+' 次有效呼吸</div>'+
    '<div class="report-pattern">'+a.pattern.label+'</div>'+
    '<div class="report-pattern-desc">'+a.pattern.text+'</div></div>';

  html+='<div class="metrics">'+
    metric(a.breathRate.toFixed(1),'次/分','呼吸頻率')+
    metric(Math.round(a.stabilityScore),'分','穩定度')+
    metric(a.avgInhale.toFixed(1),'秒','平均吸氣')+
    metric(a.avgExhale.toFixed(1),'秒','平均吐氣')+'</div>';

  if(a.holdFraction>0.4)
    html+='<div class="insight warn" style="margin-bottom:14px"><i class="ti ti-alert-triangle"></i> 本次屏息占整個呼吸週期的比例較高（'+Math.round(a.holdFraction*100)+'%）。若有頭暈、胸悶、麻或呼吸困難，請停止練習並回到自然呼吸。</div>';

  // 前中後三段
  if(a.thirds){
    var t=a.thirds;
    html+='<div class="card"><div class="card-title"><i class="ti ti-timeline"></i>前 · 中 · 後 變化</div>'+
      '<div class="segments-3">'+
      seg3(t[0])+'<div class="seg3-arrow">›</div>'+seg3(t[1])+'<div class="seg3-arrow">›</div>'+seg3(t[2])+
      '</div>'+
      '<div class="insight '+(a.transition.tone||'')+'">'+a.transition.text+'</div></div>';
  }else{
    html+='<div class="card"><div class="card-title"><i class="ti ti-timeline"></i>呼吸狀態轉變</div>'+
      '<div class="insight">'+a.transition.text+'</div></div>';
  }

  // 圖表
  if(a.segments.length>=2){
    html+='<div class="card"><div class="collapse-head" onclick="toggleCollapse(this)"><span class="ch-title">📊 完整過程趨勢</span><i class="ti ti-chevron-down collapse-chevron"></i></div>'+
      '<div class="collapse-body">'+
      '<div style="font-size:10px;color:var(--t3);margin:10px 0 4px">呼吸頻率（次/分）</div>'+chartRate(a.segments)+
      '<div style="font-size:10px;color:var(--t3);margin:14px 0 4px">吸氣 / 屏息 / 吐氣（秒）</div>'+chartIHE(a.segments)+
      '<div style="font-size:10px;color:var(--t3);margin:14px 0 4px">穩定度</div>'+chartStab(a.segments)+
      '</div></div>';
  }

  // 詳細數據
  html+='<div class="card"><div class="collapse-head" onclick="toggleCollapse(this)"><span class="ch-title">🔍 詳細數據</span><i class="ti ti-chevron-down collapse-chevron"></i></div>'+
    '<div class="collapse-body"><div style="padding-top:12px">'+
    drow('有效呼吸次數',a.validCount+' / '+a.totalCount+' 次')+
    drow('平均週期',a.avgCycle.toFixed(1)+' 秒')+
    drow('平均屏息',a.avgHold.toFixed(1)+' 秒')+
    drow('吸:屏:吐 比例',a.ihe)+
    drow('屏息占比',Math.round(a.holdFraction*100)+'%')+
    drow('吐吸比',a.exhaleInhaleRatio.toFixed(2))+
    '</div></div></div>';

  html+=feelingSection()+discomfortSection()+noteSection();
  html+='<button class="save-btn" onclick="trySave()">儲存這次練習</button>';
  html+='<button class="ghost-btn" onclick="showPage(\'home\')">不儲存，回首頁</button>';
  el.innerHTML=html;
}

function seg3(t){
  return '<div class="seg3"><div class="seg3-label">'+t.label+'</div>'+
    '<div class="seg3-rate">'+t.breathRate.toFixed(1)+'</div><div class="seg3-unit">次/分</div>'+
    '<div class="seg3-stab">穩定 '+Math.round(t.stabilityScore)+'</div></div>';
}

// ═══════════════════════════════════════════
// 報告：指定呼吸法（簡化）
// ═══════════════════════════════════════════
function renderGuidedReport(totalSec){
  _last={guided:true,totalSec:totalSec};_rstate={feelings:[],discomforts:[],note:''};
  var g=GUIDED[S.mode];
  var mins=Math.floor(totalSec/60),secs=Math.round(totalSec%60);
  var el=document.getElementById('report-content');
  var html='';
  html+='<div class="report-hero green">'+
    '<div class="report-mode">'+g.name+'</div>'+
    '<div class="report-pattern">練習完成</div>'+
    '<div class="report-pattern-desc">你跟著節奏完成了 '+mins+' 分 '+secs+' 秒的 '+g.name+'。給自己一點時間，感受身體現在的狀態。</div></div>';
  html+='<div class="metrics">'+
    metric(mins+':'+String(secs).padStart(2,'0'),'','練習時長')+
    metric(g.name.slice(0,4),'','呼吸法')+'</div>';
  html+=feelingSection()+discomfortSection()+noteSection();
  html+='<button class="save-btn" onclick="trySave()">儲存這次練習</button>';
  html+='<button class="ghost-btn" onclick="showPage(\'home\')">不儲存，回首頁</button>';
  el.innerHTML=html;
}

// ═══ 共用報告片段 ═══
function metric(v,u,l){return '<div class="metric"><div class="metric-val">'+v+' <span class="unit">'+u+'</span></div><div class="metric-lbl">'+l+'</div></div>';}
function drow(k,v){return '<div class="detail-row"><span>'+k+'</span><span>'+v+'</span></div>';}
function feelingSection(){
  return '<div class="card"><div class="card-title"><i class="ti ti-mood-smile"></i>練習後感受</div>'+
    '<div style="font-size:11px;color:var(--t3);margin-bottom:8px">這次練習帶來什麼變化？</div>'+
    '<div class="feeling-grid">'+['輕鬆很多','稍微放鬆','沒什麼變化','還是緊繃','有點疲倦','更清醒了','心跳變慢','頭腦清晰'].map(function(f){return '<div class="feeling-opt" onclick="toggleFeeling(this)">'+f+'</div>';}).join('')+'</div></div>';
}
function discomfortSection(){
  return '<div class="card"><div class="card-title"><i class="ti ti-alert-circle"></i>有沒有不適？</div>'+
    '<div class="feeling-grid">'+['頭暈','胸悶','麻','呼吸困難','恐慌'].map(function(d){return '<div class="feeling-opt discomfort-opt" onclick="toggleDiscomfort(this)">'+d+'</div>';}).join('')+'</div></div>';
}
function noteSection(){
  return '<div class="card"><div class="card-title"><i class="ti ti-note"></i>備註</div><textarea class="report-ta" id="report-note" rows="2" placeholder="想記下什麼嗎？"></textarea></div>';
}
function toggleFeeling(el){el.classList.toggle('selected');var f=el.textContent.trim();var i=_rstate.feelings.indexOf(f);if(i>-1)_rstate.feelings.splice(i,1);else _rstate.feelings.push(f);}
function toggleDiscomfort(el){el.classList.toggle('selected');var d=el.textContent.trim();var i=_rstate.discomforts.indexOf(d);if(i>-1)_rstate.discomforts.splice(i,1);else _rstate.discomforts.push(d);}
function toggleCollapse(head){head.nextElementSibling.classList.toggle('open');head.querySelector('.collapse-chevron').classList.toggle('open');}

// ═══ SVG 圖表 ═══
function chartRate(segs){var vals=segs.map(function(s){return s.breathRate;});return lineChart(segs,vals,Math.max(20,Math.ceil(Math.max.apply(null,vals))),'#003D7C');}
function chartStab(segs){return lineChart(segs,segs.map(function(s){return s.stabilityScore;}),100,'#4CAF19');}
function lineChart(segs,vals,maxV,color){
  var W=300,H=110,pad={l:30,r:10,t:10,b:18},n=vals.length;
  var iw=W-pad.l-pad.r,ih=H-pad.t-pad.b;
  var x=function(i){return pad.l+(n<=1?iw/2:iw*i/(n-1));};
  var y=function(v){return pad.t+ih*(1-v/maxV);};
  var svg='<svg class="chart-svg" viewBox="0 0 '+W+' '+H+'" xmlns="http://www.w3.org/2000/svg">';
  for(var g=0;g<=2;g++){var gy=pad.t+ih*g/2;svg+='<line x1="'+pad.l+'" y1="'+gy+'" x2="'+(W-pad.r)+'" y2="'+gy+'" stroke="#EEF3F9"/>';svg+='<text x="'+(pad.l-4)+'" y="'+(gy+3)+'" text-anchor="end" font-size="8" fill="#8A95A5">'+Math.round(maxV*(1-g/2))+'</text>';}
  svg+='<polyline points="'+vals.map(function(v,i){return x(i)+','+y(v);}).join(' ')+'" fill="none" stroke="'+color+'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
  vals.forEach(function(v,i){svg+='<circle cx="'+x(i)+'" cy="'+y(v)+'" r="3" fill="'+color+'"/>';});
  segs.forEach(function(s,i){svg+='<text x="'+x(i)+'" y="'+(H-4)+'" text-anchor="middle" font-size="8" fill="#8A95A5">'+(i*SEGMENT_SECONDS)+'s</text>';});
  return svg+'</svg>';
}
function chartIHE(segs){
  var W=300,H=120,pad={l:30,r:10,t:10,b:18},n=segs.length;
  var iw=W-pad.l-pad.r,ih=H-pad.t-pad.b;
  var maxV=Math.max(8,Math.ceil(Math.max.apply(null,segs.map(function(s){return Math.max(s.avgInhale,s.avgExhale,s.avgHold);}))));
  var x=function(i){return pad.l+(n<=1?iw/2:iw*i/(n-1));};
  var y=function(v){return pad.t+ih*(1-v/maxV);};
  var svg='<svg class="chart-svg" viewBox="0 0 '+W+' '+H+'" xmlns="http://www.w3.org/2000/svg">';
  for(var g=0;g<=2;g++){var gy=pad.t+ih*g/2;svg+='<line x1="'+pad.l+'" y1="'+gy+'" x2="'+(W-pad.r)+'" y2="'+gy+'" stroke="#EEF3F9"/>';svg+='<text x="'+(pad.l-4)+'" y="'+(gy+3)+'" text-anchor="end" font-size="8" fill="#8A95A5">'+Math.round(maxV*(1-g/2))+'</text>';}
  [{k:'avgInhale',c:'#4CAF19'},{k:'avgHold',c:'#A8C9EE'},{k:'avgExhale',c:'#003D7C'}].forEach(function(ser){
    svg+='<polyline points="'+segs.map(function(s,i){return x(i)+','+y(s[ser.k]);}).join(' ')+'" fill="none" stroke="'+ser.c+'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
    segs.forEach(function(s,i){svg+='<circle cx="'+x(i)+'" cy="'+y(s[ser.k])+'" r="2.5" fill="'+ser.c+'"/>';});
  });
  segs.forEach(function(s,i){svg+='<text x="'+x(i)+'" y="'+(H-4)+'" text-anchor="middle" font-size="8" fill="#8A95A5">'+(i*SEGMENT_SECONDS)+'s</text>';});
  svg+='</svg><div class="chart-legend"><span class="chart-leg"><span class="dot" style="background:#4CAF19"></span>吸氣</span><span class="chart-leg"><span class="dot" style="background:#A8C9EE"></span>屏息</span><span class="chart-leg"><span class="dot" style="background:#003D7C"></span>吐氣</span></div>';
  return svg;
}

// ═══════════════════════════════════════════
// Firebase + 登入 + 儲存
// ═══════════════════════════════════════════
var _db=null;
function initFirebase(){
  if(typeof firebase==='undefined'){setTimeout(initFirebase,200);return;}
  try{
    if(firebase.apps.length===0){
      firebase.initializeApp({apiKey:"AIzaSyBRZ1TNVMxOeJfyvGz4HhdlBzlKL0GIAfg",authDomain:"jointoenjoy.firebaseapp.com",projectId:"jointoenjoy",storageBucket:"jointoenjoy.firebasestorage.app",messagingSenderId:"978242729427",appId:"1:978242729427:web:ab31364f21c67c2ab56b26"});
    }
    _db=firebase.firestore();
  }catch(e){console.warn('Firebase init failed',e);}
}

function handleCredential(resp){
  var p=JSON.parse(atob(resp.credential.split('.')[1]));
  localStorage.setItem('jte_user_email',p.email);
  localStorage.setItem('jte_user_name',p.name||p.email);
  localStorage.setItem('jte_user_picture',p.picture||'');
  if(window.google&&google.accounts)google.accounts.id.disableAutoSelect();
  renderNavUser();
  document.getElementById('login-modal').classList.remove('active');
  if(_pendingSave){_pendingSave();_pendingSave=null;}
}
function renderNavUser(){
  var el=document.getElementById('nav-user');
  var email=localStorage.getItem('jte_user_email');
  var pic=localStorage.getItem('jte_user_picture');
  if(email){el.innerHTML=pic?'<img src="'+pic+'" alt="">':'<span style="font-size:11px;color:var(--p)">'+email.split('@')[0]+'</span>';el.onclick=null;}
  else{el.innerHTML='<button style="background:var(--p);color:white;border:none;padding:5px 12px;border-radius:999px;font-size:11px;cursor:pointer;font-family:Inter,sans-serif">登入</button>';el.onclick=openLoginModal;}
}
function openLoginModal(){
  _pendingSave=null;
  document.getElementById('login-modal').classList.add('active');
  setTimeout(function(){if(window.google&&google.accounts){var b=document.getElementById('login-gsi-btn');b.innerHTML='';google.accounts.id.renderButton(b,{theme:'filled_blue',size:'large',width:300,text:'signin_with',locale:'zh-TW'});}},100);
}

var _pendingSave=null;
function trySave(){
  _rstate.note=document.getElementById('report-note').value;
  if(localStorage.getItem('jte_user_email')){doSave();}
  else{_pendingSave=doSave;document.getElementById('login-modal').classList.add('active');
    setTimeout(function(){if(window.google&&google.accounts){var b=document.getElementById('login-gsi-btn');if(!b.hasChildNodes())google.accounts.id.renderButton(b,{theme:'filled_blue',size:'large',width:300,text:'signin_with',locale:'zh-TW'});}},100);}
}
function skipLogin(){document.getElementById('login-modal').classList.remove('active');if(_pendingSave){_pendingSave();_pendingSave=null;}}

function doSave(){
  var a=_last,now=new Date(),record,linkData;
  if(a.guided){
    record={id:'breathe-'+Date.now(),timestamp:now.toISOString(),mode:S.mode,modeLabel:GUIDED[S.mode].name,durationSec:Math.round(a.totalSec),guided:true,patternLabel:GUIDED[S.mode].name,feelings:_rstate.feelings,discomforts:_rstate.discomforts,note:_rstate.note};
    linkData={source:'BreatheAware',recordId:record.id,measureDate:'',mode:S.mode,modeLabel:record.modeLabel,durationSec:record.durationSec,guided:true,patternLabel:record.modeLabel,feelings:record.feelings,note:record.note};
  }else{
    record={id:'breathe-'+Date.now(),timestamp:now.toISOString(),mode:'natural',modeLabel:'自然偵測',durationSec:Math.round(a.totalSec),breathRate:parseFloat(a.breathRate.toFixed(1)),avgInhale:parseFloat(a.avgInhale.toFixed(1)),avgExhale:parseFloat(a.avgExhale.toFixed(1)),avgHold:parseFloat(a.avgHold.toFixed(1)),stabilityScore:Math.round(a.stabilityScore),ihe:a.ihe,holdFraction:parseFloat(a.holdFraction.toFixed(2)),patternKey:a.pattern.key,patternLabel:a.pattern.label,transitionKey:a.transition.key,thirds:a.thirds,feelings:_rstate.feelings,discomforts:_rstate.discomforts,note:_rstate.note,validCount:a.validCount};
    linkData={source:'BreatheAware',recordId:record.id,measureDate:'',mode:'natural',modeLabel:'自然偵測',durationSec:record.durationSec,breathRate:record.breathRate,avgInhale:record.avgInhale,avgExhale:record.avgExhale,stabilityScore:record.stabilityScore,ihe:record.ihe,patternKey:record.patternKey,patternLabel:record.patternLabel,feelings:record.feelings,note:record.note};
  }
  var hist=[];try{hist=JSON.parse(localStorage.getItem(HIST_KEY)||'[]');}catch(e){}
  hist.unshift(record);localStorage.setItem(HIST_KEY,JSON.stringify(hist.slice(0,100)));
  try{
    var email=localStorage.getItem('jte_user_email');
    var jteKey=email?'jte_daily_'+email.replace(/[^a-zA-Z0-9]/g,'_'):'jte_daily_v1';
    var tk=todayKey();linkData.measureDate=tk;
    var all=JSON.parse(localStorage.getItem(jteKey)||'{}');
    var rec=all[tk]||{moods:[],energy:5,note:'',tags:[],linked:[],createdAt:new Date().toISOString()};
    if(!rec.linked)rec.linked=[];
    rec.linked.push(linkData);rec.updatedAt=new Date().toISOString();
    all[tk]=rec;localStorage.setItem(jteKey,JSON.stringify(all));
    if(_db&&email)_db.collection('users').doc(email.toLowerCase()).collection('daily').doc(tk).set(rec,{merge:true}).catch(function(e){console.warn('Firestore sync failed',e);});
  }catch(e){console.warn('writeback failed',e);}
  toast('已儲存並同步 ✓');
  setTimeout(function(){showPage('history');},1000);
}

// ═══ 歷史 ═══
function renderHistory(){
  var hist=[];try{hist=JSON.parse(localStorage.getItem(HIST_KEY)||'[]');}catch(e){}
  var listEl=document.getElementById('hist-list'),cmpEl=document.getElementById('hist-compare');
  if(!hist.length){listEl.innerHTML='<div style="text-align:center;padding:32px;color:var(--t3);font-size:12px">還沒有練習紀錄<br>從首頁開始你的第一次呼吸覺察吧</div>';cmpEl.innerHTML='';return;}
  var withData=hist.filter(function(r){return !r.guided&&r.breathRate;}).slice(0,7);
  if(withData.length){
    cmpEl.innerHTML='<div class="card"><div class="card-title"><i class="ti ti-chart-bar"></i>最近 '+withData.length+' 次覺察平均</div><div class="metrics" style="margin-bottom:0">'+
      metric(avg(withData.map(function(r){return r.breathRate;})).toFixed(1),'次/分','平均頻率')+
      metric(Math.round(avg(withData.map(function(r){return r.stabilityScore;}))),'分','平均穩定度')+'</div></div>';
  }else cmpEl.innerHTML='';
  var html='';
  hist.forEach(function(r){
    var d=new Date(r.timestamp);
    var ds=(d.getMonth()+1)+'/'+d.getDate()+' '+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');
    var mins=Math.floor(r.durationSec/60),secs=r.durationSec%60;
    if(r.guided){
      html+='<div class="hist-item"><div class="hist-top"><span class="hist-date">'+ds+' · '+r.modeLabel+'</span><span class="hist-tag" style="background:var(--gp);color:var(--g)">跟練</span></div><div class="hist-stats"><div class="hist-stat"><strong>'+mins+':'+String(secs).padStart(2,'0')+'</strong> 時長</div>'+(r.feelings&&r.feelings.length?'<div class="hist-stat" style="color:var(--g)">'+r.feelings[0]+'</div>':'')+'</div></div>';
    }else{
      html+='<div class="hist-item"><div class="hist-top"><span class="hist-date">'+ds+' · 自然偵測</span><span class="hist-tag">'+r.patternLabel+'</span></div><div class="hist-stats"><div class="hist-stat"><strong>'+r.breathRate+'</strong> 次/分</div><div class="hist-stat"><strong>'+r.stabilityScore+'</strong> 穩定度</div>'+(r.feelings&&r.feelings.length?'<div class="hist-stat" style="color:var(--g)">'+r.feelings[0]+'</div>':'')+'</div></div>';
    }
  });
  listEl.innerHTML=html;
}

// ═══ 頁面切換 ═══
function showPage(p){
  document.querySelectorAll('.page').forEach(function(el){el.classList.remove('active');});
  document.getElementById('page-'+p).classList.add('active');
  document.querySelectorAll('.nav-tab').forEach(function(t){t.classList.remove('active');});
  if(p==='home')document.querySelectorAll('.nav-tab')[0].classList.add('active');
  if(p==='history'){document.querySelectorAll('.nav-tab')[1].classList.add('active');renderHistory();}
  window.scrollTo(0,0);
}
function toast(msg){var t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');setTimeout(function(){t.classList.remove('show');},2200);}

// ═══ 初始化 ═══
window.addEventListener('load',function(){
  initFirebase();renderNavUser();
  var t=setInterval(function(){
    if(window.google&&google.accounts){clearInterval(t);
      google.accounts.id.initialize({client_id:CLIENT_ID,callback:handleCredential,auto_select:false});
    }
  },300);
});
