// hrv-sentence.js — HRV 結果頁「一句話先行」的句庫與組句規則（canonical：文案只在這裡改）。掛 window.HrvSentence。
// 規格：docs/superpowers/specs/2026-10-30-hrv-sentence-first-result-design.md
// 原則：句子由固定規則從數字組出（同樣輸入一定得到同樣句子，可追溯）；用「看起來」只反映、不預測、
// 不給處方、不說好壞；比較對象永遠是使用者自己（第一次不比、建立中比「前幾次」、之後比「平常」）。
// 英、日文譯文在 hrv/index.html 的 JTE_I18N，以這裡的 key 對應；中文以這裡為準。
(function (root) {
  'use strict';
  var TARGET = 7;     // 第幾次起有「你的常態範圍」
  var RECENT = 14;    // 常態範圍取最近幾筆

  // —— 句庫（中文原文）——
  var T = {
    'sent.lab.today':   '今天的你',
    'sent.lab.first':   '第一次量測',
    'sent.u.usual':     '你平常',
    'sent.u.recent':    '你前幾次',
    'sent.main.first':  '這是你的第一次，先認識你的心跳。',
    'sent.sub.first':   '還沒有「你的平常」可以比，所以這次只說這一分鐘看到了什麼。',
    'sent.main.slow':   '你的呼吸慢下來了，心跳也跟著大幅起伏。',
    'sent.sub.slow':    '這是身體的煞車在作用，看起來正在放鬆下來。',
    'sent.main.mixed':  '身體有點累，但心跳還很穩。',
    'sent.main.fasthr': '恢復得不錯，但心跳比平常快。',
    'sent.main.high':   '你看起來很有活力。',
    'sent.main.mid':    '跟%U差不多，穩穩的。',
    'sent.main.low':    '身體看起來有點累。',
    'sent.main.recdip': '大致穩穩的，只是恢復得沒有%U那麼好。',
    'sent.main.recup':  '大致穩穩的，恢復得比%U好一點。',
    'sent.rec.above':   '恢復的訊號比%U高',
    'sent.rec.in':      '恢復的訊號跟%U差不多',
    'sent.rec.below':   '恢復的訊號比%U低一些',
    'sent.hr.below':    '心跳比%U慢，偏安定',
    'sent.hr.in':       '心跳跟%U一樣',
    'sent.hr.above':    '心跳比%U快',
    'sent.sub.join':    '%A，%B。',
    'sent.br.slow':     '呼吸很慢',
    'sent.br.calm':     '呼吸平緩',
    'sent.br.normal':   '呼吸速度一般',
    'sent.br.fast':     '呼吸偏快',
    'sent.rh.stable':   '規律',
    'sent.rh.some':     '有些起伏',
    'sent.rh.irregular':'不太規律',
    'sent.br.join':     '%A、%B',
    'sent.rsa.clue':    '心跳跟著呼吸明顯起伏',
    'sent.first.rsa':   '吸氣時心跳快一點、吐氣時慢一點',
    'sent.first.saved': '你的第一筆記錄已經存好了',
    'sent.first.next':  '再量 %N 次，就能看出你的平常',
    'sent.build.next':  '再量 %N 次，就能看出你的常態範圍',
    // 分區（數字和它的意思）
    'zone.energy.0': '偏低',          'zone.energy.0.d': '比你平常累，身體還在恢復',
    'zone.energy.1': '平穩',          'zone.energy.1.d': '跟你平常差不多',
    'zone.energy.2': '充足',          'zone.energy.2.d': '恢復得不錯，有餘裕',
    'zone.rmssd.0':  '低於你的常態',  'zone.rmssd.0.d':  '身體休息、修復的訊號比平常少',
    'zone.rmssd.1':  '在你的常態內',  'zone.rmssd.1.d':  '跟你平常一樣',
    'zone.rmssd.2':  '高於你的常態',  'zone.rmssd.2.d':  '身體休息、修復的訊號比平常多',
    'zone.hr.0':     '比你平常慢',    'zone.hr.0.d':     '心跳偏安定',
    'zone.hr.1':     '跟你平常一樣',  'zone.hr.1.d':     '心跳跟平常一樣穩',
    'zone.hr.2':     '比你平常快',    'zone.hr.2.d':     '身體還沒完全靜下來',
    'zone.breath.0': '慢速',          'zone.breath.0.d': '很慢、很深，常見於呼吸練習',
    'zone.breath.1': '平緩',          'zone.breath.1.d': '比多數人慢一點',
    'zone.breath.2': '一般',          'zone.breath.2.d': '多數人安靜時的速度',
    'zone.breath.3': '偏快',          'zone.breath.3.d': '呼吸比較快'
  };
  function idT(k, zh){ return zh; }
  function say(t, key, vars){
    var s=t(key, T[key]);
    for (var v in (vars||{})) s=s.split(v).join(vars[v]);
    return s;
  }

  // —— 個人常態範圍：最近 RECENT 筆，中位數為中心，半寬＝max(相對下限, 絕對下限, (P80−P20)/2) ——
  function _pct(s, p){ var i=(s.length-1)*p, a=Math.floor(i), b=Math.ceil(i); return s[a]+(s[b]-s[a])*(i-a); }
  function rangeFrom(values, opt){
    opt=opt||{};
    var v=(values||[]).filter(function(x){ return x>0 && isFinite(x); }).slice(-RECENT);
    if (!v.length) return null;
    var s=v.slice().sort(function(a,b){ return a-b; }), mid=_pct(s,0.5);
    var hw=Math.max((_pct(s,0.8)-_pct(s,0.2))/2, (opt.rel||0)*mid, opt.abs||0);
    return { lo:mid-hw, hi:mid+hw, mid:mid };
  }
  function position(v, r){ return v<r.lo ? 'below' : (v>r.hi ? 'above' : 'in'); }
  function stageOf(n){ return n<=0 ? 'first' : (n<TARGET-1 ? 'building' : 'established'); }
  function remaining(n){ return Math.max(0, TARGET-(n+1)); }

  function breathPhrase(b, t){
    var r=b.rate, w= r<8 ? 'sent.br.slow' : (r<12 ? 'sent.br.calm' : (r<=18 ? 'sent.br.normal' : 'sent.br.fast'));
    var h= b.cv<0.15 ? 'sent.rh.stable' : (b.cv<0.30 ? 'sent.rh.some' : 'sent.rh.irregular');
    return say(t,'sent.br.join',{ '%A':say(t,w), '%B':say(t,h) });
  }

  // 組句。inp：{ stage, energy:'high'|'mid'|'low', rec:'below'|'in'|'above', hr:'below'|'in'|'above',
  //             breath:{rate,rsa,cv}|null, remaining }。t(key, 中文)：翻譯函式（選填）。
  // 回 { tone:'first'|'high'|'mid'|'low', lab, main, sub, clues:[] }
  function compose(inp, t){
    t=t||idT; inp=inp||{};
    var U={ '%U': say(t, inp.stage==='building' ? 'sent.u.recent' : 'sent.u.usual') };
    var br=inp.breath||null, clues=[];
    if (inp.stage==='first'){
      if (br){ clues.push(breathPhrase(br,t)); if (br.rsa>=2) clues.push(say(t,'sent.first.rsa')); }
      else clues.push(say(t,'sent.first.saved'));
      clues.push(say(t,'sent.first.next',{ '%N':String(inp.remaining!=null?inp.remaining:TARGET-1) }));
      return { tone:'first', lab:say(t,'sent.lab.first'), main:say(t,'sent.main.first'), sub:say(t,'sent.sub.first'), clues:clues };
    }
    var recP=say(t,'sent.rec.'+(inp.rec||'in'),U), hrP=say(t,'sent.hr.'+(inp.hr||'in'),U);
    var sub=say(t,'sent.sub.join',{ '%A':recP, '%B':hrP }), main;
    var slow = br && br.rate<8 && br.rsa>=5;
    if (slow){
      main=say(t,'sent.main.slow'); sub=say(t,'sent.sub.slow');
      clues.push(breathPhrase(br,t), say(t,'sent.rsa.clue'), recP);
    } else {
      if (inp.rec==='below' && inp.hr==='below') main=say(t,'sent.main.mixed');
      else if (inp.rec==='above' && inp.hr==='above') main=say(t,'sent.main.fasthr');
      // 能量平穩但恢復力偏離：主句要跟恢復力色帶一致，不能只說「跟平常差不多」
      else if (inp.energy==='mid' && inp.rec==='below') main=say(t,'sent.main.recdip',U);
      else if (inp.energy==='mid' && inp.rec==='above') main=say(t,'sent.main.recup',U);
      else main=say(t,'sent.main.'+(inp.energy==='high'||inp.energy==='low' ? inp.energy : 'mid'),U);
      clues.push(recP, hrP);
      if (br) clues.push(breathPhrase(br,t));
    }
    if (inp.stage==='building' && inp.remaining>0) clues.push(say(t,'sent.build.next',{ '%N':String(inp.remaining) }));
    return { tone:(inp.energy==='high'||inp.energy==='low') ? inp.energy : 'mid', lab:say(t,'sent.lab.today'), main:main, sub:sub, clues:clues };
  }

  // —— 分區：有方向的用紅黃綠（黃＝跟你平常一樣、綠＝較有餘裕、紅＝較累）；呼吸沒有好壞，用深淺藍 ——
  // band：{ upTo, incl（含上限）, label, desc, color }；min/max 為色帶兩端。
  function _bands(kind, uppers, colors, t, incl){
    return uppers.map(function(u,i){
      return { upTo:u, incl:!!(incl&&incl[i]), label:say(t,'zone.'+kind+'.'+i), desc:say(t,'zone.'+kind+'.'+i+'.d'), color:colors[i] };
    });
  }
  function zones(kind, range, v, t){
    t=t||idT;
    if (kind==='energy') return { kind:kind, min:0, max:100, bands:_bands(kind,[45,75,100],['red','yellow','green'],t,[0,0,1]) };
    if (kind==='breath') return { kind:kind, min:3, max:25, bands:_bands(kind,[8,12,18,Infinity],['blue4','blue3','blue2','blue1'],t,[0,0,1,0]) };
    if (!range) return null;
    var w=range.hi-range.lo, lo=range.lo-0.9*w, hi=range.hi+0.9*w;
    if (v!=null){ lo=Math.min(lo, v-0.1*w); hi=Math.max(hi, v+0.1*w); }
    var colors = kind==='hr' ? ['green','yellow','red'] : ['red','yellow','green'];
    return { kind:kind, min:Math.max(0,lo), max:hi, bands:_bands(kind,[range.lo,range.hi,Infinity],colors,t,[0,1,0]) };
  }
  function zoneIndex(z, v){
    for (var i=0;i<z.bands.length-1;i++){ var b=z.bands[i]; if (v<b.upTo || (b.incl && v<=b.upTo)) return i; }
    return z.bands.length-1;
  }

  root.HrvSentence = { TARGET:TARGET, TEXT:T, rangeFrom:rangeFrom, position:position, stageOf:stageOf, remaining:remaining,
    compose:compose, zones:zones, zoneIndex:zoneIndex, breathPhrase:breathPhrase };
})(typeof window !== 'undefined' ? window : this);
