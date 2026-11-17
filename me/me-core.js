/* 我的練息場 /me — 純資料層（不碰 DOM、不寫入任何工具的資料）
 * 讀：jte_daily_v1（各工具的每日紀錄）。寫：只有本頁自己的 jte_me_v1（標籤／Enjoy／補一句／隨手記）。
 */
(function (g) {
  'use strict';
  var D = g.JTE_ME_DATA;
  function pad(n) { return String(n).padStart(2, '0'); }
  function keyOf(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function dlabel(k) {
    var p = String(k).split('-').map(Number);
    return p[1] + '/' + pad(p[2]) + ' 週' + '日一二三四五六'.charAt(new Date(p[0], p[1] - 1, p[2]).getDay());
  }
  function mmss(s) { return Math.floor(s / 60) + ' 分 ' + pad(s % 60) + ' 秒'; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function safeUrl(u) { return /^https?:\/\//.test(String(u || '')) ? String(u) : ''; }
  function arr(v) { return Array.isArray(v) ? v : []; }

  // 一筆工具紀錄 → 一頁。欄位照原樣取，不換算、不解讀。
  function toPage(key, l, i) {
    var m = l && D.sources[l.source];
    if (!m) return null;
    var p = { id: String(l.recordId || l.id || (l.source + '-' + key + '-' + i)), key: key, src: l.source,
      kind: m.kind, title: m.name, label: m.name, doodle: m.doodle, tool: m.tool,
      text: '', sub: '', note: '', meta: [], feel: arr(l.feelings), big: null, link: '', photos: [] };
    var dur = l.durationSec ? mmss(l.durationSec) : '';
    switch (l.source) {
      case 'BreatheAware':
        p.text = l.patternLabel || '';
        p.meta = [l.breathRate && '每分鐘 ' + l.breathRate + ' 次', l.stabilityScore && '穩定度 ' + l.stabilityScore, dur, l.ihe && '吸屏吐 ' + l.ihe];
        break;
      case 'BreathAware':
        p.text = l.stateLabel || '';
        p.meta = [l.bpm && '每分鐘 ' + l.bpm + ' 次', l.breathCount && l.breathCount + ' 次呼吸', dur];
        break;
      case 'XiaoQi':
        p.text = l.modeName || l.modeKey || ''; p.label = p.text || p.label; p.meta = [dur];
        break;
      case 'HRV':
        p.big = (l.energy == null ? null : l.energy); p.text = D.hrvLevel[l.level] || '';
        p.meta = [l.hr && '心率 ' + l.hr, l.rmssd && 'RMSSD ' + l.rmssd + ' ms']; p.feel = arr(l.tags);
        break;
      case 'HRVRecord':
        p.text = l.assessmentTitle || ''; p.sub = l.assessmentLevel || ''; p.note = l.note || '';
        p.meta = [l.stressIndex && '壓力 ' + l.stressIndex, l.emotionalFlexibility && '情緒靈活 ' + l.emotionalFlexibility,
          l.relaxationIndex && '放鬆 ' + l.relaxationIndex, l.vitalityIndex && '活力 ' + l.vitalityIndex];
        break;
      case 'WenYi':
        p.text = [l.mainHex, l.toneLabel].filter(Boolean).join('・'); p.label = l.mainHex ? '問易・' + l.mainHex : '問易';
        p.sub = l.topic ? '主題：' + l.topic : ''; p.note = [l.summary, l.note].filter(Boolean).join('　');
        break;
      case 'BuYi':
        p.text = [l.ben, l.bian].filter(Boolean).join('，之卦 ');
        p.sub = [l.changingLabel, l.question && '問：' + l.question].filter(Boolean).join('　'); p.note = l.note || '';
        break;
      case 'WriteSpace':
        p.text = l.topic || '一次書寫'; p.note = l.excerpt || ''; p.label = '書寫';
        break;
      case 'Activity':
        p.title = l.activityName || '活動'; p.label = p.title; p.sub = l.org || ''; p.note = l.description || ''; p.link = safeUrl(l.photoUrl);
        break;
      case 'TWCT':
        p.text = l.typeName ? '你是 ' + l.typeName : '做了一次';
        break;
      case 'BSRS': // 分數與作答留在工具裡，這一頁只記「量過」
        p.text = '量了一次'; p.sub = '結果留在工具裡，這裡不顯示分數。';
        break;
    }
    p.meta = p.meta.filter(Boolean);
    return p;
  }

  function buildPages(daily, memos) {
    var ps = [];
    Object.keys(daily || {}).forEach(function (k) {
      var r = daily[k];
      if (!r || typeof r !== 'object' || !/^\d{4}-\d{2}-\d{2}$/.test(k)) return;
      if (r.note || arr(r.moods).length) {
        ps.push({ id: 'day-' + k, key: k, src: 'Day', kind: '隨手記', title: '', label: String(r.note || '今日').slice(0, 6), doodle: '', tool: '',
          text: r.note || '', sub: arr(r.moods).length ? '狀態：' + r.moods.join('・') : '', note: '', meta: [], feel: [], big: null, link: '', photos: [] });
      }
      arr(r.linked).forEach(function (l, i) { var p = toPage(k, l, i); if (p) ps.push(p); });
    });
    arr(memos).forEach(function (m) {
      if (!m) return;
      var ph = arr(m.photos).filter(function (x) { return x && /^data:image\//.test(String(x.data || '')); })
        .slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); })
        .map(function (x) { return { id: String(x.id), data: String(x.data), caption: String(x.caption || '') }; });
      var text = String(m.text || '');
      if (!text && !ph.length) return;
      ps.push({ id: String(m.id), key: m.key, src: ph.length ? 'Insp' : 'Memo', kind: '隨手記', title: '', label: text ? text.slice(0, 6) : '照片', doodle: '', tool: '',
        text: text, sub: '', note: '', meta: [], feel: [], big: null, link: '', photos: ph });
    });
    ps.sort(function (a, b) { return a.key < b.key ? 1 : a.key > b.key ? -1 : 0; });
    return ps;
  }

  // 身體能量的時間序列（舊到新）。只並列，不解讀。
  function hrvSeries(daily) {
    var out = [];
    Object.keys(daily || {}).sort().forEach(function (k) {
      arr((daily[k] || {}).linked).forEach(function (l) {
        if (l && l.source === 'HRV' && isFinite(+l.energy) && l.energy !== null && l.energy !== '') out.push({ key: k, energy: +l.energy, level: l.level || '' });
      });
    });
    return out;
  }
  function monthCount(pages, y, m) {
    var pre = y + '-' + pad(m + 1) + '-';
    return pages.filter(function (p) { return p.key.indexOf(pre) === 0; }).length;
  }

  function toDate(k) { var p = String(k).split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); }
  function addDays(k, n) { var d = toDate(k); d.setDate(d.getDate() + n); return keyOf(d); }
  function daysBetween(a, b) { return Math.round((toDate(b) - toDate(a)) / 864e5); }

  // 三角形：起點（join，動力 why 掛在上面）→ 做了什麼（recId 指向一筆紀錄）→ 發現（found 一句話，或貼在紀錄上的幸福用字）
  // 三個角可以用任何順序補上。這是循環不是結業：發現可以成為下一個起點（join.kind === 'from'）。
  function triEnjoy(t, ann) { var a = t && t.recId && ann && ann[t.recId]; return arr(a && a.enjoy); }
  function triCorners(t, ann) {
    var j = t && t.join;
    return { join: !!(j && j.kind && j.kind !== 'blank'), to: !!(t && t.recId), enjoy: !!(t && (t.found || triEnjoy(t, ann).length)) };
  }
  function triStage(t, ann) {
    var c = triCorners(t, ann);
    if (!c.to) return 'join';
    if (!c.enjoy) return 'to';
    return c.join ? 'whole' : 'nojoin';
  }
  // 走進一扇門之後回來：把還開著、指定了工具的三角形，接到之後才出現的那筆紀錄上（最早的一筆）。
  function linkTriangles(tris, pages) {
    var used = {}, out = [];
    arr(tris).forEach(function (t) { if (t && t.recId) used[t.recId] = 1; });
    arr(tris).forEach(function (t) {
      if (!t || t.recId || t.dropped || !t.tool) return;
      var c = arr(pages).filter(function (p) { return p.tool === t.tool && p.key >= t.key && arr(t.before).indexOf(p.id) < 0 && !used[p.id]; });
      if (!c.length) return;
      var p = c[c.length - 1]; t.recId = p.id; used[p.id] = 1; out.push(t.id);
    });
    return out;
  }
  // 再次遇見：只從夠久以前的紀錄裡挑，同一天挑到同一筆。
  function capsulePick(pages, todayKey, minDays, seed) {
    var cut = addDays(todayKey, -minDays);
    var c = arr(pages).filter(function (p) { return p.key <= cut && (p.text || p.title); });
    return c.length ? c[Math.abs(seed) % c.length] : null;
  }
  // 使用說明書：只彙整本人自己標過的東西，不推論。
  function manual(pages, store) {
    var ann = (store && store.ann) || {}, seen = {}, useful = [], cnt = {}, last = null;
    arr(pages).forEach(function (p) {
      var a = ann[p.id] || {};
      if (a.useful && (p.tool || p.kind === '活動') && !seen[p.label]) { seen[p.label] = 1; useful.push(p.label); }
      arr(a.enjoy).forEach(function (k) { cnt[k] = (cnt[k] || 0) + 1; });
      arr(a.notes).forEach(function (n) { if (n && n.text && (!last || n.k > last.k)) last = { k: n.k, text: n.text }; });
    });
    var themes = arr(store && store.themes).map(function (t) {
      return { n: t.n, count: arr(pages).filter(function (p) { return arr((ann[p.id] || {}).tags).indexOf(t.n) > -1; }).length };
    }).filter(function (t) { return t.count > 0; }).sort(function (a, b) { return b.count - a.count; });
    var enjoy = Object.keys(cnt).map(function (k) { return { k: k, count: cnt[k] }; }).sort(function (a, b) { return b.count - a.count; });
    // 讓我願意開始的、我發現的：只列本人選過或寫過的字，不歸類
    var wc = {}, worder = [], founds = [];
    arr(store && store.tris).forEach(function (t) {
      if (!t || t.dropped) return;
      arr(t.why).forEach(function (w) { if (!w) return; if (!wc[w]) { wc[w] = 0; worder.push(w); } wc[w]++; });
      if (t.found) founds.push({ k: t.foundKey || t.key || '', text: String(t.found) });
    });
    var whys = worder.map(function (w) { return { w: w, count: wc[w] }; }).sort(function (a, b) { return b.count - a.count; });
    founds.sort(function (a, b) { return a.k < b.k ? 1 : a.k > b.k ? -1 : 0; });
    return { useful: useful, themes: themes, enjoy: enjoy, lastNote: last, whys: whys, founds: founds };
  }

  // ── 使用時機與視角（純邏輯，頁面只負責畫） ──
  // 五個空間與網址。沒指定或不認得就到「今天」。「我的地圖」裡有體驗足跡與生命地圖兩個切換。
  // 舊網址 #now／#trail／#map 仍然可用。
  var PANES = ['today', 'explore', 'practice', 'mymap', 'care'];
  function route(hash) {
    var h = String(hash || '').replace(/^#/, '');
    if (h === 'now') return { pane: 'today', sub: 'trail' };
    if (h === 'trail') return { pane: 'mymap', sub: 'trail' };
    if (h === 'map' || h === 'mymap-map') return { pane: 'mymap', sub: 'overview' };
    return { pane: PANES.indexOf(h) > -1 ? h : 'today', sub: 'trail' };
  }
  function paneOf(hash) { return route(hash).pane; }
  function hashOf(pane, sub) { return pane === 'mymap' && sub === 'overview' ? 'mymap-map' : (PANES.indexOf(pane) > -1 ? pane : 'today'); }
  // 練習：每個方法（工具或活動）做過幾次、上次哪一天、本人有沒有標對我有用、最近一句發現。
  function practiceView(pages, store) {
    var ann = (store && store.ann) || {}, m = {}, ord = [], byId = {};
    arr(pages).forEach(function (p) {
      byId[p.id] = p;
      if (!(p.tool || p.kind === '活動')) return;
      var k = p.title, x = m[k];
      if (!x) { x = m[k] = { name: k, tool: p.tool || '', outside: !p.tool, count: 0, last: '', useful: false, found: '', fk: '' }; ord.push(k); }
      x.count++;
      if (p.key > x.last) x.last = p.key;
      if ((ann[p.id] || {}).useful) x.useful = true;
    });
    arr(store && store.tris).forEach(function (t) {
      var p = t && !t.dropped && t.found && byId[t.recId], x = p && m[p.title], k = t && (t.foundKey || t.key || '');
      if (x && k >= x.fk) { x.fk = k; x.found = String(t.found); }
    });
    var all = ord.map(function (k) { return m[k]; });
    return { works: all.filter(function (x) { return x.useful; }), outside: all.filter(function (x) { return x.outside; }) };
  }
  // 剛剛：今天才出現、還沒有三角形也沒貼過幸福用字、沒被略過的工具或活動紀錄（最上面那一筆）。
  function justPick(pages, triByRec, ann, todayKey, skipIds) {
    var c = arr(pages).filter(function (p) {
      return p.key === todayKey && (p.tool || p.kind === '活動') && !(triByRec && triByRec[p.id]) &&
        arr(skipIds).indexOf(p.id) < 0 && !arr(((ann || {})[p.id] || {}).enjoy).length;
    });
    return c.length ? c[0] : null;
  }
  // 同一個狀態，上次做了什麼、發現什麼。只把本人的紀錄排出來，不推薦。
  function lastSame(tris, byId, state, n) {
    return arr(tris).filter(function (t) {
      return t && !t.dropped && t.join && t.join.kind === 'state' && t.join.state === state && t.recId && byId && byId[t.recId];
    }).sort(function (a, b) { return a.key < b.key ? 1 : a.key > b.key ? -1 : 0; }).slice(0, n || 2)
      .map(function (t) { return { t: t, p: byId[t.recId] }; });
  }
  // 靈感：有一句或有照片才算。上限來自 me-data.js 的 insp，與 firestore.rules 一致。
  function inspCheck(ins, lim) {
    if (!ins || typeof ins !== 'object') return { ok: false, why: 'empty' };
    var text = String(ins.text || '').trim(), ph = arr(ins.photos);
    if (!text && !ph.length) return { ok: false, why: 'empty' };
    if (text.length > lim.maxText) return { ok: false, why: 'text' };
    if (ph.length > lim.maxPhotos) return { ok: false, why: 'count' };
    for (var i = 0; i < ph.length; i++) {
      var d = String((ph[i] || {}).data || '');
      if (d.indexOf('data:image/jpeg;base64,') !== 0) return { ok: false, why: 'type' };
      if (d.length > lim.maxDataLen) return { ok: false, why: 'size' };
      if (String(ph[i].caption || '').length > lim.maxCaption) return { ok: false, why: 'caption' };
    }
    return { ok: true, why: '' };
  }
  function fitSize(w, h, maxEdge) {
    var m = Math.max(w, h);
    if (!(m > maxEdge)) return { w: w, h: h };
    var r = maxEdge / m;
    return { w: Math.max(1, Math.round(w * r)), h: Math.max(1, Math.round(h * r)) };
  }
  // ── 活動紀錄：把管理者從試算表貼上的內容拆開。只留白名單欄位，其他在這裡就丟掉。 ──
  // 試算表複製出來是 TSV：欄位用 Tab 分，內容有換行或引號的儲存格會用雙引號包起來。
  function tsvRows(text) {
    var s = String(text == null ? '' : text), rows = [], row = [], cell = '', q = false, i, c;
    if (!s) return rows;
    for (i = 0; i < s.length; i++) {
      c = s.charAt(i);
      if (q) {
        if (c === '"') { if (s.charAt(i + 1) === '"') { cell += '"'; i++; } else q = false; }
        else cell += c;
      } else if (c === '"' && cell === '') q = true;
      else if (c === '\t') { row.push(cell); cell = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && s.charAt(i + 1) === '\n') i++;
        row.push(cell); cell = ''; rows.push(row); row = [];
      } else cell += c;
    }
    if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
    return rows;
  }
  function actDate(s) {
    var m = /^\s*(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})\s*$/.exec(String(s == null ? '' : s));
    if (!m || +m[2] < 1 || +m[2] > 12 || +m[3] < 1 || +m[3] > 31) return '';
    return m[1] + '-' + pad(+m[2]) + '-' + pad(+m[3]);
  }
  function actEmail(s, tlds) {
    var e = String(s == null ? '' : s).trim().toLowerCase();
    if (!e) return { email: '', flags: ['missing'] };
    if (!/^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(e)) return { email: e, flags: ['format'] };
    return { email: e, flags: arr(tlds).indexOf(e.slice(e.lastIndexOf('.') + 1)) < 0 ? ['tld'] : [] };
  }
  function actScore(v) {
    var s = String(v == null ? '' : v).trim();
    if (!s) return { v: null, bad: false };
    var n = /^\d{1,2}$/.test(s) ? +s : NaN;
    return n >= 1 && n <= 10 ? { v: n, bad: false } : { v: null, bad: true };
  }
  function actParse(text, cols, tlds) {
    var rows = tsvRows(text), sessions = [], out = [], hi = -1, idx = {}, i, r;
    function cellOf(row, k) { return idx[k] == null ? '' : String(row[idx[k]] == null ? '' : row[idx[k]]).trim(); }
    for (i = 0; i < rows.length; i++) {
      r = rows[i].map(function (x) { return String(x).trim(); });
      if (r.indexOf('Email') > -1 && r.indexOf('姓名') > -1) { hi = i; break; }
      var di = r.indexOf('活動日期'), pi = r.indexOf('活動照片連結');
      if (di > -1 && actDate(r[di + 1])) sessions.push({ date: actDate(r[di + 1]), photoUrl: pi > -1 ? safeUrl(r[pi + 1]) : '' });
    }
    if (hi < 0) return { ok: false, sessions: sessions, rows: [] };
    rows[hi].forEach(function (h, j) {
      h = String(h).trim();
      Object.keys(cols).forEach(function (k) { if (idx[k] == null && h.indexOf(cols[k]) === 0) idx[k] = j; });
    });
    for (i = hi + 1; i < rows.length; i++) {
      r = rows[i];
      if (!r.some(function (x) { return String(x).trim(); })) continue;
      var e = actEmail(cellOf(r, 'email'), tlds), flags = e.flags.slice(), bad = false, any = false;
      var sc = {}; ['preBody', 'preMood', 'postBody', 'postMood'].forEach(function (k) { var x = actScore(cellOf(r, k)); sc[k] = x.v; if (x.bad) bad = true; if (x.v !== null) any = true; });
      var tx = {}; ['expect', 'feeling', 'takeaway', 'feedback'].forEach(function (k) { tx[k] = cellOf(r, k); if (tx[k]) any = true; });
      if (bad) flags.push('score');
      if (!any && !bad && e.email) flags = ['blank'];
      out.push({ line: i + 1, email: e.email, flags: flags, pre: { body: sc.preBody, mood: sc.preMood }, post: { body: sc.postBody, mood: sc.postMood },
        expect: tx.expect, feeling: tx.feeling, takeaway: tx.takeaway, feedback: tx.feedback });
    }
    return { ok: true, sessions: sessions, rows: out };
  }
  // 搜尋：在本人看得到的文字裡找（標題、內容、標籤、補的話、起點、動力、發現）。
  function hay(p, a, t) {
    var j = (t && t.join) || {};
    return [p.title, p.text, p.sub, p.note, p.label, p.kind].concat(arr(p.feel), arr(a && a.tags),
      arr(a && a.notes).map(function (n) { return n && n.text; }), [j.text, t && t.found], arr(t && t.why),
      arr(p.photos).map(function (x) { return x && x.caption; }))
      .filter(Boolean).join('\n').toLowerCase();
  }
  function searchPages(pages, q, ann, triByRec) {
    var words = String(q || '').toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) return arr(pages);
    return arr(pages).filter(function (p) {
      var h = hay(p, (ann || {})[p.id], (triByRec || {})[p.id]);
      return words.every(function (w) { return h.indexOf(w) > -1; });
    });
  }
  // 視角：同一批紀錄，換一個角來分組。mine＝自取主題、join＝起點、to＝方法、enjoy＝幸福用字。
  function lensGroups(lens, pages, store) {
    var ann = (store && store.ann) || {}, m = {}, ord = [];
    function put(k, p) { if (!m[k]) { m[k] = []; ord.push(k); } if (m[k].indexOf(p) < 0) m[k].push(p); }
    if (lens === 'mine') {
      return arr(store && store.themes).map(function (t) {
        return { k: t.n, ps: arr(pages).filter(function (p) { return arr((ann[p.id] || {}).tags).indexOf(t.n) > -1; }) };
      });
    }
    var byId = {}; arr(pages).forEach(function (p) { byId[p.id] = p; });
    if (lens === 'join') {
      arr(store && store.tris).forEach(function (t) {
        var p = t && !t.dropped && byId[t.recId]; if (!p || !triCorners(t, ann).join) return;
        put(t.join.kind === 'state' ? t.join.state : t.join.kind === 'circle' ? 'circle' : 'curious', p);
      });
    } else if (lens === 'to') {
      arr(pages).forEach(function (p) { if (p.src === 'Day' || p.src === 'Memo' || p.src === 'Insp') return; put(p.kind === '活動' ? '活動' : p.title, p); });
    } else if (lens === 'enjoy') {
      arr(pages).forEach(function (p) { arr((ann[p.id] || {}).enjoy).forEach(function (k) { put(k, p); }); });
    } else return [];
    return ord.map(function (k) { return { k: k, ps: m[k] }; }).sort(function (a, b) { return b.ps.length - a.ps.length; });
  }

  // 優勢幸福力：本人照報告填入的結果。只整理成好讀的順序，不換算、不對映到別的工具。
  function num(v, lo, hi) { var n = (v === '' || v == null) ? NaN : +v; return isFinite(n) && n >= lo && n <= hi ? n : null; }
  function swView(sw, names, permaOrder) {
    sw = sw || {};
    var st = arr(names).map(function (n) { return { n: n, v: num((sw.strengths || {})[n], 0, 999) }; })
      .filter(function (x) { return x.v !== null; }).sort(function (a, b) { return b.v - a.v; });
    var pe = arr(permaOrder).map(function (k) { return { k: k, v: num((sw.perma || {})[k], 0, 100) }; }).filter(function (x) { return x.v !== null; });
    var happy = num(sw.happy, 0, 5), year = num(sw.year, 1900, 2999);
    return { strengths: st, top: st.slice(0, 3), perma: pe, happy: happy, year: year, any: !!(st.length || pe.length || happy !== null) };
  }
  // 每個工具做過幾次、上次是哪一天
  function toolUse(pages) {
    var m = {};
    arr(pages).forEach(function (p) { if (!p.tool) return; var x = m[p.tool] || (m[p.tool] = { count: 0, last: '' }); x.count++; if (p.key > x.last) x.last = p.key; });
    return m;
  }

  // 一起練：一個圈在今天與這七天的樣子。只數「練了」，不排名、不算誰沒練。
  function circleView(c, today, meId) {
    var ins = arr(c && c.checkins), days = [], i, k, from = addDays(today, -6);
    function on(key) { return ins.filter(function (x) { return x && x.k === key; }); }
    for (i = 6; i >= 0; i--) {
      k = addDays(today, -i);
      var who = {}; on(k).forEach(function (x) { who[x.who] = 1; });
      days.push({ k: k, count: Object.keys(who).length });
    }
    var feed = on(today).slice().sort(function (a, b) { return String(a.at || '') < String(b.at || '') ? 1 : -1; });
    return { days: days, today: feed, weekCount: ins.filter(function (x) { return x && x.k >= from && x.k <= today; }).length,
      mine: feed.some(function (x) { return x.who === meId; }),
      resting: arr(c && c.members).filter(function (m) { return m && m.resting; }).map(function (m) { return m.name; }),
      size: arr(c && c.members).length };
  }

  // 團進行到第幾天、結束了沒
  function circleDay(c, today) {
    var d = c && c.start ? daysBetween(c.start, today) + 1 : 1, span = (c && +c.span) || 0;
    if (d < 1) d = 1;
    return { day: d, span: span, ended: !!(span && d > span) };
  }
  function isMember(c, meId) { return arr(c && c.members).some(function (m) { return m && m.id === meId; }); }
  // 正在進行、開放加入、我還沒參加的團。對還沒加入的人只給團名、內容與人數這類彙總，不給任何人的心得。
  function openCircles(circles, meId, today, max) {
    return arr(circles).filter(function (c) { return c && c.open && !isMember(c, meId) && !circleDay(c, today).ended; }).map(function (c) {
      var v = circleView(c, today, meId), d = circleDay(c, today);
      return { id: c.id, name: c.name, tool: c.tool || '', what: c.what || '', rhythm: c.rhythm || '', size: v.size, todayCount: v.days[6].count,
        day: d.day, span: d.span, full: !!(max && v.size >= max) };
    });
  }

  g.JteMe = { pad: pad, keyOf: keyOf, dlabel: dlabel, mmss: mmss, esc: esc, safeUrl: safeUrl,
    toPage: toPage, buildPages: buildPages, hrvSeries: hrvSeries, monthCount: monthCount,
    addDays: addDays, daysBetween: daysBetween, triEnjoy: triEnjoy, triCorners: triCorners, triStage: triStage,
    linkTriangles: linkTriangles, capsulePick: capsulePick, manual: manual,
    circleView: circleView, circleDay: circleDay, isMember: isMember, openCircles: openCircles, swView: swView, toolUse: toolUse, paneOf: paneOf, route: route, hashOf: hashOf, practiceView: practiceView, justPick: justPick, lastSame: lastSame, searchPages: searchPages, lensGroups: lensGroups, inspCheck: inspCheck, fitSize: fitSize, tsvRows: tsvRows, actDate: actDate, actEmail: actEmail, actScore: actScore, actParse: actParse };
})(window);
