/* octenso/bagua-report-renderer.js — v3.2 共用 report renderer(核心四塊)
 * 獨立成檔、尚未被任何頁面引用(task-2)。之後(task-3 起)供 bagua-persona.html 等頁面改為呼叫。
 *
 * 用法：載入順序 bagua-data.js → profile.js → bagua-report-v32-data.js → bagua-report-renderer.js，
 *       之後以 window.OctensoReport 取用。
 *
 * 來源：以下函式與詞庫自 octenso/bagua-persona.html(現檔)複製並施固定替換規則搬入──
 *   signatureTitle、buildRadar、radarCard、radarSelect、bindRadar、
 *   portraitNarrative(→narrativeCore)、systemsSection(→systemsCore)、
 *   pShapeKey、READ_LEX、PAIR_BOTHHIGH、COST_GIST(僅 b2 所需 .o 欄位)。
 * 詳細替換規則見 docs/superpowers/specs/ 對應 SDD 設計文件與 .superpowers/sdd/task-2-report.md。
 */
(function () {
  'use strict';

  var D = window.OCTENSO_BAGUA;
  var R = window.REPORT_V32;
  var NS = 'http://www.w3.org/2000/svg';

  // 替換規則 1：EKEYS 為 renderer 內常數(順序照 persona 頁：clockwise from top)
  var EKEYS = ['qian', 'li', 'zhen', 'dui', 'kun', 'kan', 'gen', 'xun'];
  // 替換規則 4：PAIR_EVEN_GAP → EVEN_GAP=12
  var EVEN_GAP = 12;

  // 替換規則 2：pn(k)→D.pn(k)；fn1(k)→renderer 自帶(D.get(k).fn.split('／')[0])
  function pn(k) { return D.pn(k); }
  function fn1(k) { return D.get(k).fn.split('／')[0]; }

  // ── 地形判斷(自 pShapeKey 搬入，原樣) ──────────────────────
  function pShapeKey(pf) {
    var spread = (pf.ranked[0].v || 0) - (pf.ranked[pf.ranked.length - 1].v || 0), n = pf.leads.length, band = pf.level.band;
    if (pf.single) return 'single';
    if (n === 2) return 'dual';
    if (n >= 3) return 'multi';
    if (band === 'high' && spread <= 30) return 'plateau';
    if (band === 'low' && spread <= 30) return 'low';
    if (spread >= 50) return 'jagged';
    return 'balanced';
  }

  // 中正詞庫（解讀規則 spec §5）：mid＝用得好的樣子(拍1)；lever＝怎麼發揮；gap＝這股本身能帶來的(拍3)
  var READ_LEX = {
    qian: { mid: '能立方向、開局、作主', lever: '把這份開局的勁，放在你真正想長出來的事上', gap: '方向感與願景' },
    kun: { mid: '能承載、滋養，讓事情穩穩運轉', lever: '守住你願意承接的範圍，別把自己也賠進去', gap: '耐心、穩定，與接得住的底氣' },
    zhen: { mid: '有執行力，能把想法啟動、推著落地，卡關時用行動突破', lever: '把這股推力對準真正重要的事，讓它變成穩定的產出', gap: '啟動的勁與不拖延' },
    xun: { mid: '擅長連結資源、順勢鋪開，身段有彈性', lever: '在發散裡守住一個焦點，連結才不會散掉', gap: '向外觸及、把人與機會連起來的能力' },
    kan: { mid: '沉得住、想得深，獨處時能恢復充電', lever: '刻意守住安靜的時間，那是你判斷的底', gap: '沉著、定力，與把事情想透的空間' },
    li: { mid: '看得清，也能把看見的顯現出來、讓人理解', lever: '把你看清的東西，好好說出來、亮出來', gap: '洞察、表達，與讓想法被看見的力量' },
    gen: { mid: '守得住界線、知所進退', lever: '信任你喊停的判斷，該收的時候就收', gap: '設界線、喊卡、守住自己節奏的能力' },
    dui: { mid: '表達流暢、能與人互通，把話說開', lever: '把交流力，用在你真正想連結的關係上', gap: '把感受說出口、與人連結的能力' }
  };
  // 四對待「雙高」讀法（鍵為兩卦排序後 join；只有雷風＝張力，其餘和諧——對齊學理憲法）
  var PAIR_BOTHHIGH = {
    'kun|qian': '——開創與承接俱足，是完整的建構格局。',
    'xun|zhen': '——行動與拓展都旺，像雷風鼓盪：推力很強，偶爾也會彼此較勁。',
    'kan|li': '——既深又亮：能向內沉澱、也能向外明現，相成而不相礙。',
    'dui|gen': '——進退有節：守得住界線，也開得了口。'
  };
  // 能格「精華片語」（短、塞進敘事；僅 portraitNarrative b2 所需欄位 .o）
  var COST_GIST = {
    qian: { o: '什麼都想自己扛、抓著方向不放' },
    kun: { o: '把別人都接住、自己擺到最後' },
    zhen: { o: '衝太快、做白工，旁人跟不上' },
    xun: { o: '攤太開、收不回來' },
    li: { o: '太想被看見、給自己壓力' },
    kan: { o: '想太多、走不出來' },
    gen: { o: '界線太硬、把人也擋在外' },
    dui: { o: '社交太滿、話收不住' }
  };

  // ── Radar wheel(自 buildRadar 搬入)────────────────────────
  // 替換：E[k].pos→D.POLAR[k]；E[k].wx→D.get(k).wx；W[...]→D.W[...]；pn→D.pn
  function buildRadar(sc, topKey, nowNorm) {
    var cx = 200, cy = 200, baseR = 140;
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '-54 -46 508 500');
    // grid octagons
    [0.25, 0.5, 0.75, 1].forEach(function (f) {
      var pts = EKEYS.map(function (k) {
        var ux = (D.POLAR[k].x - cx) / baseR, uy = (D.POLAR[k].y - cy) / baseR;
        return (cx + ux * baseR * f) + ',' + (cy + uy * baseR * f);
      }).join(' ');
      var poly = document.createElementNS(NS, 'polygon');
      poly.setAttribute('points', pts);
      poly.setAttribute('fill', 'none');
      poly.setAttribute('stroke', 'var(--line)');
      poly.setAttribute('stroke-width', f === 1 ? 1.4 : 1);
      poly.setAttribute('opacity', f === 1 ? 0.9 : 0.5);
      svg.appendChild(poly);
    });
    // spokes
    EKEYS.forEach(function (k) {
      var ux = (D.POLAR[k].x - cx) / baseR, uy = (D.POLAR[k].y - cy) / baseR;
      var ln = document.createElementNS(NS, 'line');
      ln.setAttribute('x1', cx); ln.setAttribute('y1', cy);
      ln.setAttribute('x2', cx + ux * baseR); ln.setAttribute('y2', cy + uy * baseR);
      ln.setAttribute('stroke', 'var(--line)'); ln.setAttribute('stroke-width', 1); ln.setAttribute('opacity', 0.5);
      svg.appendChild(ln);
    });
    // score polygon (radius 30..140)
    function rOf(s) { return 30 + (s / 100) * 110; }
    var sp = EKEYS.map(function (k) {
      var ux = (D.POLAR[k].x - cx) / baseR, uy = (D.POLAR[k].y - cy) / baseR;
      var r = rOf(sc[k]);
      return (cx + ux * r) + ',' + (cy + uy * r);
    }).join(' ');
    var area = document.createElementNS(NS, 'polygon');
    area.setAttribute('points', sp);
    area.setAttribute('fill', 'rgba(53,97,79,.16)');
    area.setAttribute('stroke', 'var(--pine)');
    area.setAttribute('stroke-width', 2);
    svg.appendChild(area);
    // 此刻 overlay polygon (gold dashed)
    if (nowNorm) {
      var np = EKEYS.map(function (k) {
        var ux = (D.POLAR[k].x - cx) / baseR, uy = (D.POLAR[k].y - cy) / baseR;
        var r = rOf(nowNorm[k] || 0);
        return (cx + ux * r) + ',' + (cy + uy * r);
      }).join(' ');
      var narea = document.createElementNS(NS, 'polygon');
      narea.setAttribute('points', np);
      narea.setAttribute('fill', 'rgba(169,130,59,.10)');
      narea.setAttribute('stroke', 'var(--gold)');
      narea.setAttribute('stroke-width', 2);
      narea.setAttribute('stroke-dasharray', '5 4');
      svg.appendChild(narea);
      EKEYS.forEach(function (k) {
        var ux = (D.POLAR[k].x - cx) / baseR, uy = (D.POLAR[k].y - cy) / baseR;
        var r = rOf(nowNorm[k] || 0);
        var nd = document.createElementNS(NS, 'circle');
        nd.setAttribute('cx', cx + ux * r); nd.setAttribute('cy', cy + uy * r);
        nd.setAttribute('r', 3.5); nd.setAttribute('fill', 'var(--gold)'); nd.setAttribute('stroke', '#fff'); nd.setAttribute('stroke-width', 1);
        svg.appendChild(nd);
      });
    }
    // dots + labels
    EKEYS.forEach(function (k) {
      var b = D.get(k);
      var ux = (D.POLAR[k].x - cx) / baseR, uy = (D.POLAR[k].y - cy) / baseR;
      var r = rOf(sc[k]);
      var px = cx + ux * r, py = cy + uy * r;
      var grp = document.createElementNS(NS, 'g');
      grp.setAttribute('class', 'rgrp'); grp.setAttribute('data-k', k);
      var dot = document.createElementNS(NS, 'circle');
      dot.setAttribute('cx', px); dot.setAttribute('cy', py);
      dot.setAttribute('r', k === topKey ? 7 : 5);
      dot.setAttribute('fill', D.W[b.wx]);
      dot.setAttribute('stroke', '#fff'); dot.setAttribute('stroke-width', 1.5);
      grp.appendChild(dot);
      // label outside
      var lr = baseR + 22;
      var lx = cx + ux * lr, ly = cy + uy * lr;
      var anchor = ux > 0.35 ? 'start' : (ux < -0.35 ? 'end' : 'middle');
      if (anchor === 'start') lx += 2; else if (anchor === 'end') lx -= 2;
      ly += uy > 0.35 ? 12 : (uy < -0.35 ? -6 : 4);
      var tx = document.createElementNS(NS, 'text');
      tx.setAttribute('class', 'rlabel' + (k === topKey ? ' top' : ''));
      tx.setAttribute('x', lx); tx.setAttribute('y', ly); tx.setAttribute('text-anchor', anchor);
      tx.textContent = D.pn(k).split('(')[0];          // 角標=者名
      grp.appendChild(tx);
      var ts = document.createElementNS(NS, 'text');
      ts.setAttribute('class', 'rscore');
      ts.setAttribute('x', lx); ts.setAttribute('y', ly + 13); ts.setAttribute('text-anchor', anchor);
      ts.textContent = sc[k];
      grp.appendChild(ts);
      svg.appendChild(grp);
    });
    return svg;
  }

  // radarCard(now) 核心(自 persona.html 搬入，原樣)
  function radarCardCore(now) {
    return '<div class="radar-card"><div class="radar-wrap" id="radar-wrap"></div>'
      + '<div class="share-hint" style="margin-top:6px">' + (now ? '松綠實線＝你的底色　·　金色虛線＝此刻。' : '越往外越強。') + '點任一個角，看那一態代表什麼。</div>'
      + '<div class="block" id="radar-detail" style="margin-top:10px;text-align:left;display:none"></div>'
      + '</div>';
  }

  // 雷達解釋卡：點角切換(自 radarSelect 搬入)
  function radarSelect(k, pf, conf) {
    var box = document.getElementById('radar-detail'); if (!box) return;
    var v = (pf && pf.scores[k]) || 0, b = pf && pf.bands[k];
    var plain = (R && R.PLAIN[k]) ? R.PLAIN[k].lamp : '';
    var cf = conf ? (conf[k] === 'firm' ? '篤定' : conf[k] === 'mixed' ? '兩可' : '') : '';
    box.innerHTML = '<div style="display:flex;align-items:baseline;gap:10px;flex-wrap:wrap">'
      + '<b style="color:var(--ink)">' + D.pn(k) + '</b><span style="color:var(--pine)">' + v + '</span>'
      + (b ? '<span style="color:' + (b.like ? 'var(--gold)' : 'var(--muted)') + ';font-size:12px">' + b.label + (b.like ? '你' : '') + '</span>' : '') + '</div>'
      + '<div style="margin-top:6px">' + plain + '。</div>'
      + (cf ? '<div style="font-size:12px;color:var(--muted);margin-top:5px">作答篤定度：' + cf + (cf === '兩可' ? '——這一態解讀時請保留彈性。' : '') + '</div>' : '');
    box.style.display = 'block';
    var gs = document.querySelectorAll('#radar-wrap g.rgrp');
    for (var i = 0; i < gs.length; i++) { gs[i].style.opacity = (gs[i].getAttribute('data-k') === k) ? '1' : '0.75'; }
  }

  // 雷達互動膠水(自 bindRadar 搬入；改吃 ctx；併入 persona.html showResult 的 appendChild 行為)
  function bindRadar(ctx) {
    var wrap = document.getElementById('radar-wrap'); if (!wrap) return;
    var sc = ctx.scores || {};
    var nowNorm = (ctx.now && ctx.now.norm) || null;
    wrap.appendChild(buildRadar(sc, ctx.topKey, nowNorm));
    radarSelect(ctx.pf ? ctx.pf.ranked[0].k : ctx.topKey, ctx.pf, ctx.conf);
    wrap.classList.add('rint');
    var gs = wrap.querySelectorAll('g.rgrp');
    for (var gi = 0; gi < gs.length; gi++) {
      (function (elg) {
        elg.addEventListener('click', function () { radarSelect(elg.getAttribute('data-k'), ctx.pf, ctx.conf); });
      })(gs[gi]);
    }
  }

  // ── signatureTitle(自 persona.html 搬入,原樣;E[k].essence→R.ESSENCE[k]) ──
  function signatureTitle(pf) {
    var sig = pf.signature, k = sig.keys, lv = pf.level.band;
    if (sig.kind === 'single') { var e = D.get(k[0]); return { sym: e.sym, title: D.pn(k[0]), sub: '', essence: R.ESSENCE[k[0]] }; }
    if (sig.kind === 'dual') {
      var a = D.get(k[0]), b = D.get(k[1]);
      return {
        sym: a.sym + b.sym, title: D.pn(k[0]) + '×' + D.pn(k[1]), sub: '兩個並重的主調，會交替出現',
        essence: R.ESSENCE[k[0]] + '　同時，「' + fn1(k[1]) + '」也同樣鮮明——你不是單一性格，而是這兩種能量輪流主導。'
      };
    }
    if (sig.kind === 'multi') {
      return {
        sym: k.map(function (x) { return D.get(x).sym; }).join(''), title: k.map(function (x) { return D.get(x).nm; }).join('×') + ' · 多主調型', sub: k.length + ' 個主調並重',
        essence: '你有多個並重的主調（' + k.map(function (x) { return D.get(x).nm + '·' + fn1(x); }).join('、') + '）——是個多面、不被單一傾向定義的人。'
      };
    }
    var nm = lv === 'high' ? '高能多面型' : lv === 'low' ? '低調蓄能型' : '均衡型';
    var ess = lv === 'high' ? '你八種能量都用得不少、沒有特別偏廢——是個能量飽滿的多面手。'
      : lv === 'low' ? '你整體比較收著，最鮮明的也只是淡淡突出——像在蓄能，安靜地醞釀。'
        : '你各能量有高有低、但沒有單一主峰——均衡而有彈性，看情境換檔。';
    return { sym: D.get(pf.leads[0]).sym, title: nm, sub: '沒有單一主峰，以整體格局描述', essence: ess };
  }

  // pf 建置失敗(OctensoProfile 未載入)時的峰名卡後備來源(對齊 persona.html showResult 的 sig 後備邏輯)
  function sigOf(ctx) {
    if (ctx.pf) return signatureTitle(ctx.pf);
    var top = D.get(ctx.topKey);
    return { sym: top.sym, title: top.title, sub: '', essence: R.ESSENCE[ctx.topKey] || '' };
  }

  // 峰名卡 title 字串(binding 新增：供轉介/分享等只需標題的場景使用)
  function titleOf(ctx) { return sigOf(ctx).title; }

  // 峰名卡 html(typecard 標記,與 persona.html 現版逐字同構)
  function heroHtml(ctx, eyebrow) {
    var sig = sigOf(ctx);
    var top = D.get(ctx.topKey);
    var accent = D.W[top.wx];
    return '<div class="typecard" style="--accent:' + accent + '">'
      + '<div class="tc-eyebrow">' + (eyebrow || '你的能量格局') + '</div>'
      + '<div class="tc-sym">' + sig.sym + '</div>'
      + '<div class="tc-title">' + sig.title + '</div>'
      + (sig.sub ? '<div class="tc-eyebrow" style="margin:2px 0 8px;color:var(--pine)">' + sig.sub + '</div>' : '')
      + '<div class="tc-essence">' + sig.essence + '</div>'
      + '</div>';
  }

  function radarHtml(ctx) { return radarCardCore(ctx.now); }

  // ── narrativeCore(自 portraitNarrative 搬入；簽名改吃 ctx，overs/unders 直接用 ctx 上的，
  //    不再內算——原 costVerdict 分類迴圈不搬、已刪除)────────────
  function narrativeCore(ctx) {
    var pf = ctx.pf; if (!pf) return '';
    var conf = ctx.conf;
    var overs = ctx.overs || [], unders = ctx.unders || [];
    function q(k) { return '「' + fn1(k) + '」'; }
    // ── 拍1 優勢（中正強項·並存不捏因果，spec 拍1/C1/C3/C4）──
    var kind = pf.signature.kind, leads = pf.leads, b1;
    if (kind === 'pattern') {
      b1 = '你的能量分布算均衡，沒有特別獨大的一股——這本身是一種<b>彈性</b>：面對不同場面，你都接得住、換得了檔。';
    } else if (leads.length >= 2) {
      var a = leads[0], b = leads[1], pk = PAIR_BOTHHIGH[[a, b].sort().join('|')];
      b1 = '你最鮮明的是' + q(a) + '與' + q(b) + '——你' + READ_LEX[a].mid + '；同時也' + READ_LEX[b].mid + '。'
        + (pk || '') + ' 發揮：' + READ_LEX[a].lever + '；' + READ_LEX[b].lever + '。';
    } else {
      var a2 = leads[0]; b1 = '你最鮮明的是' + q(a2) + '——你' + READ_LEX[a2].mid + '。發揮：' + READ_LEX[a2].lever + '。';
    }
    // ── 拍2 能格（過用代價／中性，spec 拍2/C1/C2）──
    var b2;
    if (overs.length) {
      var g = COST_GIST[overs[0]] || {};
      b2 = '從你的校準看，' + q(overs[0]) + '目前用得有點過頭' + (g.o ? ('——容易' + g.o) : '') + '（這是這股<b>自己</b>的事，跟別股無關）。'
        + (overs.length > 1 ? (' ' + q(overs[1]) + '也是。') : '');
    } else if (ctx.neutral === 'flex') {
      b2 = '你這幾股用得很<b>平均</b>——而你也確認了，這是真的<b>平衡、有彈性</b>：面對不同場面，你都換得了檔、接得住。';
    } else if (ctx.neutral === 'undev') {
      b2 = '你這幾股用得很<b>平均</b>——你說還在摸索；那也好，表示你<b>最有可塑性</b>，正適合多方嘗試，慢慢長出自己最鮮明的那幾股。';
    } else if (!ctx.hasCost) {
      b2 = '你這幾股用得挺<b>平均</b>——可能是平衡、有彈性，也可能是還在摸索、還沒長開。';
    } else {
      b2 = '整體看，你這幾股用得大致剛好，沒有明顯過頭的一股。';
    }
    // ── 拍3 缺口（不足空間·只它自己的價值，spec 拍3/C1）──
    var gapK = (unders.length ? unders[0] : (pf.gaps[0] || pf.ranked[pf.ranked.length - 1].k));
    var b3 = '你最少動用的是' + q(gapK) + '——它能帶來' + READ_LEX[gapK].gap + '。這是你最有空間的地方，刻意給它一點練習，會讓你更完整。';
    // ── v3.2 開場總述(零術語;地形→策略:jagged→contrast,峰型→peak,其餘→level)──
    var open = null;
    if (R) {
      var shape = pShapeKey(pf), lead = pf.ranked[0].k, low = pf.ranked[pf.ranked.length - 1].k;
      if (shape === 'jagged') open = R.OPEN.contrast(R.PLAIN[lead], R.PLAIN[low]);
      else if (shape === 'single' || shape === 'dual' || shape === 'multi') open = R.OPEN.peak(pf.leads.slice(0, 2).map(function (k) { return R.PLAIN[k]; }));
      else open = R.OPEN.level(pf.level.band);
    }
    // 場景段:峰型用最高態場景,否則 pattern
    var sceneK = (pf.signature.kind === 'pattern') ? 'pattern' : pf.leads[0];
    var scene = (R && R.SCENE[sceneK]) || '';
    // 整體可信度一句(逐態細節在雷達解釋卡)
    var trust = '';
    if (conf) {
      var mixedN = 0; EKEYS.forEach(function (k) { if (conf[k] === 'mixed') mixedN++; });
      trust = mixedN ? ('大部分的題目你答得乾脆，輪廓可以放心讀；有 ' + mixedN + ' 個態你答得比較猶豫（雷達上點開標「兩可」的那幾角），那些分數請當作大概的位置。')
        : '這次的題目你都答得乾脆，這份輪廓可以放心讀。';
    }
    return '<div class="block" id="narrative-block"><h3>整體的你</h3>'
      + (open ? '<div id="narrative-open">' + open.story + '<span class="punch" style="display:block;margin-top:10px;color:var(--ink);font-weight:600">' + open.punch + '</span></div>' : '')
      + '<div class="portrait" style="margin-top:12px">' + b1 + '</div>'
      + '<div class="portrait" style="margin-top:11px">' + b2 + '</div>'
      + '<div class="portrait" style="margin-top:11px">' + b3 + '</div>'
      + (scene ? '<div class="portrait" style="margin-top:11px">' + scene + '</div>' : '')
      + (trust ? '<div class="pair-foot" style="margin-top:10px">' + trust + '</div>' : '')
      + '</div>';
  }
  function narrativeHtml(ctx) { return narrativeCore(ctx); }

  // ── systemsCore(自 systemsSection 搬入；改吃 ctx.scores；PAIR_EVEN_GAP→EVEN_GAP) ──
  function systemsCore(sc) {
    if (!R) return '';
    function shapeOf(L, Rv) {
      if (L >= 60 && Rv >= 60) return 'bothHigh';
      if (L <= 40 && Rv <= 40) return 'bothLow';
      if (Math.abs(L - Rv) < EVEN_GAP) return 'even';
      return L > Rv ? 'left' : 'right';
    }
    function bar(k, v, on) {
      return '<div class="pole-row" style="display:flex;align-items:center;gap:10px;margin:6px 0">'
        + '<span style="flex:none;width:6.8em;font-size:13px;color:var(--ink)">' + D.pn(k) + '</span>'
        + '<div style="flex:1;height:9px;background:var(--surface2);border-radius:5px;overflow:hidden"><i style="display:block;height:100%;border-radius:5px;width:' + v + '%;background:' + (on ? 'var(--pine)' : 'var(--line)') + ';opacity:.8"></i></div>'
        + '<span style="flex:none;width:2em;text-align:right;font-family:ui-sans-serif,sans-serif;font-size:11.5px;color:var(--muted)">' + v + '</span></div>';
    }
    var TAG = { left: '偏', right: '偏', bothHigh: '雙高', bothLow: '雙低', even: '均衡' };
    var html = Object.keys(R.SYS_DETAIL).map(function (s) {
      var dta = R.SYS_DETAIL[s], L = sc[dta.l] || 0, Rv = sc[dta.r] || 0, sh = shapeOf(L, Rv), item = dta.shapes[sh];
      var tag = (sh === 'left') ? ('偏' + fn1(dta.l)) : (sh === 'right') ? ('偏' + fn1(dta.r)) : TAG[sh];
      var tens = (s === 'drive' && sh === 'bothHigh');
      return '<div style="padding:18px 0;border-top:1px solid var(--surface2)">'
        + '<h4 style="font-size:15.5px;color:var(--ink);margin-bottom:8px">' + dta.nm + ' · <b style="color:' + (tens ? 'var(--cinnabar)' : 'var(--pine)') + '">' + tag + (tens ? '（張力）' : '') + '</b></h4>'
        + bar(dta.l, L, sh === 'left' || sh === 'bothHigh') + bar(dta.r, Rv, sh === 'right' || sh === 'bothHigh')
        + '<div style="font-size:13px;color:var(--muted);margin-top:8px">' + dta.pull + '</div>'
        + '<div style="margin-top:8px">' + item.read + '</div>'
        + '<div style="margin-top:8px;padding-left:12px;border-left:2px solid var(--surface2);font-size:13.5px"><b style="color:var(--pine)">小練習</b>：' + item.prac + '</div>'
        + '</div>';
    }).join('');
    return '<div class="block" id="sys-detail"><h3>四個系統 · 你怎麼運作</h3>' + html
      + '<div class="pair-foot">這些是傾向、有程度，不是非此即彼；四對之中只有「推動（雷風）」雙高會互相較勁，其餘皆相成。</div>'
      + '</div>';
  }
  function systemsHtml(ctx) { return systemsCore(ctx.scores || {}); }

  // ── build(input)→ctx：input={scores,conf,overs,unders,neutral,now,hasCost}；ctx=input+{pf,topKey} ──
  // hasCost：本輪是否有校準(cost)資料——對齊 persona.html portraitNarrative 原本的 `!costItems||!costItems.length`
  // 判斷，決定 narrativeCore b2 末兩分支走「還沒長開」或「大致剛好」；未提供時預設 false。
  function build(input) {
    input = input || {};
    var scores = input.scores || {};
    var pf = (window.OctensoProfile) ? window.OctensoProfile.build(scores) : null;
    var topKey = EKEYS[0];
    EKEYS.forEach(function (k) { if ((scores[k] || 0) > (scores[topKey] || 0)) topKey = k; });
    var ctx = {};
    for (var key in input) { if (Object.prototype.hasOwnProperty.call(input, key)) ctx[key] = input[key]; }
    ctx.pf = pf;
    ctx.topKey = topKey;
    ctx.hasCost = !!input.hasCost; // 校準資料是否存在(見 narrativeCore b2 末兩分支)；未給預設 false
    return ctx;
  }

  window.OctensoReport = {
    pn: pn,
    fn1: fn1,
    build: build,
    heroHtml: heroHtml,
    titleOf: titleOf,
    radarHtml: radarHtml,
    narrativeHtml: narrativeHtml,
    systemsHtml: systemsHtml,
    bindRadar: bindRadar
  };
})();
