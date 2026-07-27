/* octenso/bagua-v3-bank.js — 題本 v3(脈絡化/跨情境)canonical
 * v0.1-draft · 2026-07-27 · 碼前綴 B3
 *
 * 設計 spec:docs/superpowers/specs/2026-07-27-octenso-item-bank-v3-contextualized-design.md
 *
 * 與 v2 的差別:題數完全相同(24 量表題 + 4 二選一),但每題明確標定生活場域——
 *   ctx='task'  任務場域:有任務、有期限、有人等你交出東西的場合
 *   ctx='close' 親近場域:跟最親近的人相處時(伴侶/家人/最熟的朋友)
 *   ctx='gen'   泛用:不指定場合(頻率反向題,與 v2 逐字相同)
 * 目的:讓「同一個人在不同場合不一樣」從被丟掉的雜訊,變成報告讀得出來的訊號。
 *
 * ⚠ 題幹已改寫 ⇒ B3 與 B2 分數不可互比、不可併池(比照 B1×B2 既有規則)。
 * ⚠ 情境定義用「功能」不用「身分」——學生、家務照顧者、接案者、退休者皆答得了。
 *
 * 出題順序為「分區塊」(8 題任務 → 8 題親近 → 8 題頻率):FOR 文獻的做法是讓
 * 框架持續生效,分區塊比逐題跳換更能維持框架、體感也較穩。代價是可能出現
 * 區塊內反應定勢(整區答得一樣),試測時應檢查區塊內變異是否異常偏低。
 *
 * 量尺、二選一、能格校準、判讀文案一律沿用 OCTENSO_V2,不複寫(meta A 同源)。
 */
(function (g) {
  'use strict';

  if (!g.OCTENSO_V2) {
    throw new Error('bagua-v3-bank.js 依賴 bagua-v2-data.js,請先載入(meta A 同源)。');
  }

  // ── 題本 v3(24 題;kind: sc=微場景像我 / fq=頻率反向;ctx: task/close/gen)──
  // 排序:第一區塊=任務場域、第二區塊=親近場域、第三區塊=泛用頻率;
  // 區塊內順序 qian dui li xun zhen kan gen kun(與 v2 同)。
  var ITEMS = [
    // ── 區塊一:任務場域(有任務、有期限、有人等你交出東西)──
    { k: 'qian', kind: 'sc', ctx: 'task', t: '一件有期限、有人等著的事,討論繞了半天還是沒結論——我會忍不住跳出來說「不然就這樣做」。' },
    { k: 'dui',  kind: 'sc', ctx: 'task', t: '正事的場合氣氛僵住時(會議冷掉、大家都不出聲),把話接起來、讓氣氛重新流動的,常常是我。' },
    { k: 'li',   kind: 'sc', ctx: 'task', t: '討論正事的時候,大家還在繞,我常已經先看出「其實卡住的點在哪」。' },
    { k: 'xun',  kind: 'sc', ctx: 'task', t: '手上的事需要幫忙時,我腦中常自動跳出「可以找誰、可以借哪邊的資源」,然後真的去牽線。' },
    { k: 'zhen', kind: 'sc', ctx: 'task', t: '手上的事情卡住時,我寧可先做一版粗糙的出來試,也不想一直討論下去。' },
    { k: 'kan',  kind: 'sc', ctx: 'task', t: '遇到重要的決定,我習慣放一個晚上、多想幾天再回覆,不喜歡當場定案。' },
    { k: 'gen',  kind: 'sc', ctx: 'task', t: '事情做到我自己設定的程度,我就會收手——不會因為別人起鬨、或因為還有時間就再加碼。' },
    { k: 'kun',  kind: 'sc', ctx: 'task', t: '一件事快收尾時,留下來善後、確認每個環節都有人接住的,常常是我。' },
    // ── 區塊二:親近場域(跟最親近的人相處時)──
    { k: 'qian', kind: 'sc', ctx: 'close', t: '和最親近的人要一起安排什麼(出遊、聚餐、搬家…),一直沒人拍板——最後把日期、地點定下來的,常常是我。' },
    { k: 'dui',  kind: 'sc', ctx: 'close', t: '有開心的事,我第一個反應是告訴最親近的那個人——悶著反而難受。' },
    { k: 'li',   kind: 'sc', ctx: 'close', t: '做出自己滿意的東西、或遇到值得說的事,我會想第一個講給最親近的人聽、讓他看見。' },
    { k: 'xun',  kind: 'sc', ctx: 'close', t: '聽到最親近的人在找什麼(工作、房子、醫生…),我腦中常自動跳出「我認識誰可以幫上忙」。' },
    { k: 'zhen', kind: 'sc', ctx: 'close', t: '想到可以為最親近的人做點什麼,我常當天就動手——哪怕只是先傳個訊息、先買個東西。' },
    { k: 'kan',  kind: 'sc', ctx: 'close', t: '和最親近的人相處一段時間後,我需要抽身待一會兒、回到自己,才覺得電充回來了。' },
    { k: 'gen',  kind: 'sc', ctx: 'close', t: '就算是最親近的人開口,不想做的事我也能好好地說「這次先不了」,不太勉強自己。' },
    { k: 'kun',  kind: 'sc', ctx: 'close', t: '最親近的人臨時打來說心情很糟——就算手上有事,我通常還是會先聽他說完。' },
    // ── 區塊三:泛用頻率(反向已內建於分值;與 v2 逐字相同)──
    { k: 'qian', kind: 'fq', ctx: 'gen', t: '過去一個月,遇到該做決定的事,我先等等、看別人怎麼說的情況——' },
    { k: 'dui',  kind: 'fq', ctx: 'gen', t: '過去一個月,心裡有話想說、最後還是吞回去的情況——' },
    { k: 'li',   kind: 'fq', ctx: 'gen', t: '過去一個月,心裡有想法卻沒說出口,事後被別人講走、或根本沒人知道的情況——' },
    { k: 'xun',  kind: 'fq', ctx: 'gen', t: '過去一個月,明明開口借個力就能省事,我還是自己硬做完的情況——' },
    { k: 'zhen', kind: 'fq', ctx: 'gen', t: '過去一個月,想做的事一直拖著、遲遲沒踏出第一步的情況——' },
    { k: 'kan',  kind: 'fq', ctx: 'gen', t: '過去一個月,明明已經很累,還一直撐著、沒讓自己真正停下來的情況——' },
    { k: 'gen',  kind: 'fq', ctx: 'gen', t: '過去一個月,想拒絕、最後還是答應下來的情況——' },
    { k: 'kun',  kind: 'fq', ctx: 'gen', t: '過去一個月,別人跟我說煩惱時,我聽不到幾句就急著給建議、或想把話題帶開的情況——' }
  ];

  // ── 場域定義(施測指導語用;功能式,不用身分式)──
  var CTX = {
    task: {
      key: 'task', nm: '任務場域',
      def: '有任務、有期限、有人等你交出東西的場合',
      hint: '上班、唸書趕報告、接案、家務與照顧、志工、備考——想你自己最常遇到的那一種就好。'
    },
    close: {
      key: 'close', nm: '親近場域',
      def: '跟最親近的人相處的時候',
      hint: '伴侶、家人、最熟的那幾個朋友——想你心裡第一個浮現的那個人就好。'
    },
    gen: { key: 'gen', nm: '最近一個月', def: '不分場合,回想過去一個月實際發生的頻率', hint: '' }
  };

  // ── 區塊過場語(依區塊起始索引)──
  var BLOCKS = {
    0:  '先從「有任務的場合」開始——有期限、有人等你交出東西的那種場合。上班、唸書、接案、家務照顧都算,想你自己最常遇到的那一種就好。',
    8:  '換個場合。接下來這幾題,請想著「跟最親近的人相處」的時候——伴侶、家人、最熟的那幾個朋友,心裡第一個浮現的那個人就好。\n(同樣的能量,在不同場合本來就可能不一樣,答不一樣完全正常。)',
    16: '最後一圈,不分場合——問的是「過去一個月」實際發生的頻率。一樣憑直覺就好。'
  };

  // ── 落差門檻(v0.1 推論值,待試測校正)──
  // 單題階距 20 分(六點量尺),故需 ≥2 階才視為落差,避免一次點擊造成敘事。
  var SPREAD_MIN = 40;

  // ── 計分(整體分數與 v2 同法:每態三題平均)──
  function scores(answers) {
    var EK = g.OctensoProfile.EKEYS, SMAX = 5;
    var sum = {}, n = {};
    EK.forEach(function (k) { sum[k] = 0; n[k] = 0; });
    ITEMS.forEach(function (q, i) {
      var v = answers[i]; if (v == null) return;
      sum[q.k] += v; n[q.k]++;
    });
    var sc = {};
    EK.forEach(function (k) { sc[k] = n[k] ? Math.round(sum[k] / n[k] / SMAX * 100) : 0; });
    return sc;
  }

  // ── 跨情境落差:每態 task vs close(各一題)──
  // 回傳 { qian:{task,close,d,flag}, … };flag: 0=無落差 / 1=偏任務 / 2=偏親近
  function spread(answers) {
    var EK = g.OctensoProfile.EKEYS, SMAX = 5, out = {};
    var byCtx = {};
    ITEMS.forEach(function (q, i) {
      if (q.ctx !== 'task' && q.ctx !== 'close') return;
      var v = answers[i]; if (v == null) return;
      (byCtx[q.k] = byCtx[q.k] || {})[q.ctx] = Math.round(v / SMAX * 100);
    });
    EK.forEach(function (k) {
      var b = byCtx[k] || {};
      var t = b.task != null ? b.task : null, c = b.close != null ? b.close : null;
      var d = (t != null && c != null) ? (t - c) : null;
      var flag = 0;
      if (d != null && Math.abs(d) >= SPREAD_MIN) flag = d > 0 ? 1 : 2;
      out[k] = { task: t, close: c, d: d, flag: flag };
    });
    return out;
  }

  // ── B3 碼:'B3' + 16 位態分 + 8 位落差旗標 + 4 位二選一(0–5;9=無)= 30 碼 ──
  function encode(sc, sp, fc) {
    var EK = g.OctensoProfile.EKEYS, s = 'B3', i;
    EK.forEach(function (k) {
      var v = Math.max(0, Math.min(99, Math.round(sc[k] || 0)));
      s += (v < 10 ? '0' : '') + v;
    });
    EK.forEach(function (k) { s += String((sp && sp[k] && sp[k].flag) || 0); });
    for (i = 0; i < 4; i++) { var f = (fc && fc[i] != null) ? fc[i] : 9; s += String(f); }
    return s;
  }
  function decode(str) {
    str = (str || '').trim().toUpperCase().replace(/\s/g, '');
    if (str.indexOf('B3') !== 0 || str.length !== 30 || !/^[0-9]{28}$/.test(str.slice(2))) return null;
    var EK = g.OctensoProfile.EKEYS, sc = {}, sp = {}, fc = [], i;
    for (i = 0; i < 8; i++) sc[EK[i]] = parseInt(str.substr(2 + i * 2, 2), 10);
    for (i = 0; i < 8; i++) sp[EK[i]] = { flag: parseInt(str.charAt(18 + i), 10) || 0 };
    for (i = 0; i < 4; i++) { var d = parseInt(str.charAt(26 + i), 10); fc.push(d <= 5 ? d : null); }
    return { sc: sc, spread: sp, fc: fc, bank: 'v3', code: str };
  }

  // ── 落差敘事模板(只描述往哪邊偏,不解釋原因、不評好壞)──
  var SPREAD_READ = {
    none: '這一輪看下來,你的八股能量在兩種場合大致是同一個樣子——沒有哪一股明顯換了臉。',
    lead: '有幾股能量,你在兩種場合明顯不一樣——這不是測不準,這正是你的樣子:',
    task: '{N}:在有任務的場合明顯更亮,跟最親近的人相處時收著。',
    close: '{N}:跟最親近的人相處時明顯更亮,在有任務的場合收著。',
    honest: '落差只描述「在哪個場合更亮」,不解釋原因、也不評好壞;差距小於 ' + SPREAD_MIN + ' 分不視為落差。兩個場合各一題,看得出方向,但不足以談「變化幅度」。'
  };

  g.OCTENSO_V3_BANK = {
    version: '0.1-draft', bank: 'v3', codePrefix: 'B3',
    ITEMS: ITEMS, CTX: CTX, BLOCKS: BLOCKS,
    SPREAD_MIN: SPREAD_MIN, SPREAD_READ: SPREAD_READ,
    scores: scores, spread: spread, encode: encode, decode: decode
  };
})(typeof window !== 'undefined' ? window : this);
