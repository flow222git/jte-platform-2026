/* Octenso 共用剖面引擎 — Phase 1（純資料層，不產生任何文案）
 *
 * 設計準繩：人性的判讀 × 理性的判斷。
 * 把 8 卦分數讀成「完整剖面」而非「單一最高卦標籤」：
 *   整體水平(level) + 4 向度(偏向×強度) + 主旋律(含並列) + 資源/缺口 + 五行剖面
 *
 * 為什麼分「水平×形狀」：坎90其他80 與 坎50其他20，argmax 都判「坎」，
 * 但前者高能量不會沈默、後者才會。先讀水平再讀形狀才準。
 *
 * 所有門檻集中在 TUNE，依量表解析度設定（每卦 3 題、一題 ≈ 11 分），方便日後校準。
 * 與既有頁面一致：EKEYS 順序、WX 對應、向度偏向邏輯（沿用 PAIR_EVEN_GAP）皆對齊。
 */
(function(global){
  'use strict';

  var EKEYS=['qian','li','zhen','dui','kun','kan','gen','xun']; // 順時針，與各頁一致
  var WX={qian:'metal',dui:'metal',li:'fire',zhen:'wood',xun:'wood',kan:'water',gen:'earth',kun:'earth'};
  var WX_ALL=['metal','wood','water','fire','earth'];

  // 四象 · 生命系統（古典錯卦配對：天地/雷風/水火/山澤）
  var PAIRS=[
    {key:'build',    xiang:'天地', sys:'建構系統', en:'Purpose Engine',    l:'qian', r:'kun', ln:'創造', rn:'承載'},
    {key:'drive',    xiang:'雷風', sys:'推動系統', en:'Action Engine',     l:'zhen', r:'xun', ln:'啟動', rn:'擴散'},
    {key:'aware',    xiang:'水火', sys:'認知系統', en:'Awareness Engine',  l:'kan',  r:'li',  ln:'收藏', rn:'顯現'},
    {key:'regulate', xiang:'山澤', sys:'調節系統', en:'Regulation Engine', l:'gen',  r:'dui', ln:'停止', rn:'交流'}
  ];

  // 可校準門檻
  var TUNE={
    LEAD_GAP:15,   // 最高與第二名差距 < 此值 → 並列主旋律（≈1.5 題，避免雜訊分高下）
    LEAD_MIN:60,   // 稱「單一主導」時最高卦需 ≥ 此值
    RES:60,        // 資源卦（你的強項）門檻
    GAP:40,        // 缺口卦（你較少用）門檻
    AXIS_EVEN:12,  // 向度偏向：|左-右| < 此值 → 平衡（沿用既有 PAIR_EVEN_GAP）
    AXIS_HI:60,    // 向度「雙高」：兩極皆 ≥
    AXIS_LO:40,    // 向度「雙低」：兩極皆 ≤
    LEVEL_HI:58,   // 整體水平：8 卦均值 ≥ → 高
    LEVEL_LO:42    // 均值 ≤ → 低
  };

  function clampScores(sc){
    var o={}; sc=sc||{};
    EKEYS.forEach(function(k){ var v=+sc[k]; o[k]=isFinite(v)?Math.max(0,Math.min(100,v)):0; });
    return o;
  }

  function ranked(sc){
    return EKEYS.map(function(k){ return {k:k, v:sc[k]||0}; })
                .sort(function(a,b){ return (b.v-a.v) || (EKEYS.indexOf(a.k)-EKEYS.indexOf(b.k)); });
  }

  function level(sc){
    var sum=0; EKEYS.forEach(function(k){ sum+=(sc[k]||0); });
    var mean=sum/EKEYS.length;
    return { mean:Math.round(mean), band:(mean>=TUNE.LEVEL_HI?'high':(mean<=TUNE.LEVEL_LO?'low':'mid')) };
  }

  function axes(sc){
    return PAIRS.map(function(p){
      var L=sc[p.l]||0, R=sc[p.r]||0, gap=Math.abs(L-R);
      var lean=(gap<TUNE.AXIS_EVEN)?'even':(L>R?'left':'right');
      var intensity;
      if(L>=TUNE.AXIS_HI && R>=TUNE.AXIS_HI) intensity='both-high';      // 兩種模式都很活躍／張力大
      else if(L<=TUNE.AXIS_LO && R<=TUNE.AXIS_LO) intensity='both-low';  // 這面向你比較少用
      else if(gap>=TUNE.AXIS_EVEN) intensity='single';                  // 明確偏一邊
      else intensity='mid';                                            // 中性、看情況
      return { key:p.key, xiang:p.xiang, sys:p.sys, en:p.en, l:p.l, r:p.r, ln:p.ln, rn:p.rn, left:L, right:R,
               lean:lean, gap:gap, sum:L+R, avg:Math.round((L+R)/2),
               leanName:(lean==='even'?null:(lean==='left'?p.ln:p.rn)), intensity:intensity };
    });
  }

  // 主旋律：最高卦 + 所有與它差距 < LEAD_GAP 的並列卦（可能 1~多個）
  function leads(rk){
    var out=[rk[0].k];
    for(var i=1;i<rk.length;i++){ if(rk[0].v-rk[i].v < TUNE.LEAD_GAP) out.push(rk[i].k); else break; }
    return out;
  }

  // 五行剖面：元素內取平均（金=乾兌、木=震巽、土=坤艮 各2卦；火=離、水=坎 各1卦），避免單卦元素被低估
  function elements(sc){
    var agg={}, cnt={}; WX_ALL.forEach(function(w){ agg[w]=0; cnt[w]=0; });
    EKEYS.forEach(function(k){ var w=WX[k]; agg[w]+=(sc[k]||0); cnt[w]++; });
    var out={}; WX_ALL.forEach(function(w){ out[w]=cnt[w]?Math.round(agg[w]/cnt[w]):0; });
    return out;
  }

  function topElement(el){ var t=WX_ALL[0]; WX_ALL.forEach(function(w){ if(el[w]>el[t]) t=w; }); return t; }

  // 每態六級評價：分數回推到最近的六點刻度（＝你那 3 題的平均選項）
  var BANDS=['完全不像','大致不像','有點不像','有點像','大致像','非常像'];
  function band(score){ var i=Math.round((+score||0)/100*5); i=Math.max(0,Math.min(5,i)); return {idx:i, label:BANDS[i], like:(i>=3)}; }
  function bands(sc){ var o={}; EKEYS.forEach(function(k){ o[k]=band(sc[k]); }); return o; }

  // persona 簽名：名字自適應形狀（不硬塞 1/8）。回傳 keys＋kind，標題文字由各頁用自己的卦資料組。
  //  single＝單一明顯主峰；dual/multi＝並列主峰；pattern＝沒有明顯主峰，改用格局型（看整體水平）
  function signature(pf){
    if(pf.single) return {kind:'single', keys:[pf.leads[0]]};
    if(pf.leads.length>=2) return {kind:(pf.leads.length===2?'dual':'multi'), keys:pf.leads.slice(0,3)};
    return {kind:'pattern', keys:pf.leads.slice(), level:pf.level.band};
  }

  function build(rawScores){
    var sc=clampScores(rawScores);
    var rk=ranked(sc), el=elements(sc), ld=leads(rk);
    var out={
      scores:sc,
      ranked:rk,
      level:level(sc),
      axes:axes(sc),
      leads:ld,
      single:(ld.length===1 && rk[0].v>=TUNE.LEAD_MIN), // 是否真有單一主導（否則並列／能量不足以稱主導）
      resources: rk.filter(function(o){ return o.v>=TUNE.RES; }).map(function(o){ return o.k; }),
      gaps: EKEYS.filter(function(k){ return (sc[k]||0)<TUNE.GAP; }),
      elements: el,
      topElement: topElement(el),
      bands: bands(sc)
    };
    out.signature = signature(out);
    return out;
  }

  global.OctensoProfile={
    EKEYS:EKEYS, WX:WX, WX_ALL:WX_ALL, PAIRS:PAIRS, TUNE:TUNE, BANDS:BANDS,
    build:build, clampScores:clampScores, ranked:ranked, level:level,
    axes:axes, leads:leads, elements:elements, topElement:topElement,
    band:band, bands:bands, signature:signature
  };
})(typeof window!=='undefined'?window:this);
