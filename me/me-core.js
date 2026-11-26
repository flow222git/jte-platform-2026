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

  function buildPages(daily, memos, acts) {
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
      var pg = { id: String(m.id), key: m.key, src: ph.length ? 'Insp' : 'Memo', kind: '隨手記', title: '', label: text ? text.slice(0, 6) : '照片', doodle: '', tool: '',
        text: text, sub: '', note: '', meta: [], feel: [], big: null, link: '', photos: ph };
      if (m.itemId) pg.itemId = String(m.itemId);
      if (m.qid) pg.qid = String(m.qid);
      if (m.pn) pg.src = 'Note'; // 在項目頁寫下的：要改、要刪回項目頁
      ps.push(pg);
    });
    arr(acts).forEach(function (a) { var p = actPage(a); if (p) ps.push(p); });
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
    var h = String(hash || '').replace(/^#/, ''), mi = /^practice-item-([A-Za-z0-9_-]{1,40})$/.exec(h);
    if (mi) return { pane: 'practice', sub: 'trail', item: mi[1] };
    if (h === 'now') return { pane: 'today', sub: 'trail', item: '' };
    // 紀錄與這個月搬到「總覽」（practice）了；舊的足跡、地圖網址都帶到那裡
    if (h === 'trail' || h === 'map' || h === 'mymap-map' || h === 'mymap-trail') return { pane: 'practice', sub: 'trail', item: '' };
    return { pane: PANES.indexOf(h) > -1 ? h : 'today', sub: 'trail', item: '' };
  }
  function paneOf(hash) { return route(hash).pane; }
  function hashOf(pane) { return PANES.indexOf(pane) > -1 ? pane : 'today'; }
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
    if (e.length > 200 || !/^[^\s@\/]+@[^\s@.\/]+(\.[^\s@.\/]+)+$/.test(e)) return { email: e, flags: ['format'] };
    return { email: e, flags: arr(tlds).indexOf(e.slice(e.lastIndexOf('.') + 1)) < 0 ? ['tld'] : [] };
  }
  function actScore(v) {
    var s = String(v == null ? '' : v).trim();
    if (!s) return { v: null, bad: false };
    var n = /^\d{1,2}$/.test(s) ? +s : NaN;
    return n >= 1 && n <= 10 ? { v: n, bad: false } : { v: null, bad: true };
  }
  // text 可以是貼上的文字，也可以是已經拆好的二維陣列（從試算表讀來的）。sesCol 是「這一列屬於哪一場」的欄位名稱，可以不給。
  function actParse(text, cols, tlds, sesCol) {
    var rows = Object.prototype.toString.call(text) === '[object Array]' ? text : tsvRows(text), si = -1, sessions = [], out = [], hi = -1, idx = {}, i, r, visual = '';
    function cellOf(row, k) { return idx[k] == null ? '' : String(row[idx[k]] == null ? '' : row[idx[k]]).trim(); }
    for (i = 0; i < rows.length; i++) {
      r = arr(rows[i]).map(function (x) { return String(x).trim(); });
      if (r.indexOf('Email') > -1 && r.indexOf('姓名') > -1) { hi = i; break; }
      var di = r.indexOf('活動日期'), pi = r.indexOf('活動照片連結'), vi = r.indexOf('活動主視覺連結');
      if (vi > -1 && !visual) visual = safeUrl(r[vi + 1]); // 一個分頁一張主視覺，底下每一場共用
      if (di > -1 && actDate(r[di + 1])) sessions.push({ date: actDate(r[di + 1]), photoUrl: pi > -1 ? safeUrl(r[pi + 1]) : '' });
    }
    sessions.forEach(function (x) { x.visualUrl = visual; });
    if (hi < 0) return { ok: false, sessions: sessions, rows: [], missingCols: [] };
    rows[hi].forEach(function (h, j) {
      h = String(h).trim();
      Object.keys(cols).forEach(function (k) { if (idx[k] == null && h.indexOf(cols[k]) === 0) idx[k] = j; });
      if (sesCol && si < 0 && [].concat(sesCol).some(function (n) { return h.indexOf(n) === 0; })) si = j;
    });
    for (i = hi + 1; i < rows.length; i++) {
      r = arr(rows[i]);
      if (!r.some(function (x) { return String(x).trim(); })) continue;
      var e = actEmail(cellOf(r, 'email'), tlds), flags = e.flags.slice(), bad = false, any = false;
      var sc = {}; ['preBody', 'preMood', 'postBody', 'postMood'].forEach(function (k) { var x = actScore(cellOf(r, k)); sc[k] = x.v; if (x.bad) bad = true; if (x.v !== null) any = true; });
      var tx = {}; ['expect', 'feeling', 'takeaway', 'feedback'].forEach(function (k) { tx[k] = cellOf(r, k); if (tx[k]) any = true; });
      if (bad) flags.push('score');
      if (!any && !bad && e.email) flags.push('blank');
      out.push({ line: i + 1, email: e.email, flags: flags, pre: { body: sc.preBody, mood: sc.preMood }, post: { body: sc.postBody, mood: sc.postMood },
        expect: tx.expect, feeling: tx.feeling, takeaway: tx.takeaway, feedback: tx.feedback, sesDate: si < 0 ? '' : actDate(r[si]) });
    }
    return { ok: true, sessions: sessions, rows: out, hasSesCol: si > -1, missingCols: Object.keys(cols).filter(function (k) { return idx[k] == null; }) };
  }
  // 試算表網址 → 文件代號。
  function sheetId(url) {
    var m = /\/spreadsheets\/d\/([A-Za-z0-9_-]{20,})/.exec(String(url == null ? '' : url));
    return m ? m[1] : '';
  }
  // 分頁名稱 → 活動名稱：去掉開頭的月份（「11月 茶席」→「茶席」）。
  function actTabTitle(name) {
    var t = String(name == null ? '' : name).trim(), u = t.replace(/^\d{1,2}\s*月\s*/, '').trim();
    return u || t;
  }
  // 整份試算表（每個分頁 {gid,title,rows}）→ 場次與資料列。
  // 場次代號用分頁的 gid，分頁改名、搬順序都不變；同一個分頁裡同一天的第二場起加序號。
  // 多場的分頁靠「場次日期」欄對到場次，對不到的列 ses=-1。
  function actSheet(tabs, cols, tlds, sesCol) {
    var sessions = [], rows = [], problems = [];
    arr(tabs).forEach(function (tab) {
      var p = actParse(arr(tab && tab.rows), cols, tlds, sesCol), name = String(tab && tab.title || ''), base = sessions.length, seen = {};
      if (!p.ok) { problems.push({ tab: name, why: 'noHeader' }); return; }
      if (!p.sessions.length) { problems.push({ tab: name, why: 'noDate' }); return; }
      if (p.missingCols.length) problems.push({ tab: name, why: 'cols', cols: p.missingCols });
      if (p.sessions.length > 1 && !p.hasSesCol) problems.push({ tab: name, why: 'noSesCol' });
      p.sessions.forEach(function (x) {
        seen[x.date] = (seen[x.date] || 0) + 1;
        sessions.push({ title: actTabTitle(name), date: x.date, slug: 'g' + String(tab.gid).replace(/[^0-9a-z]/gi, '').toLowerCase() + (seen[x.date] > 1 ? '-' + seen[x.date] : ''), photoUrl: x.photoUrl, visualUrl: x.visualUrl || '', tab: name });
      });
      p.rows.forEach(function (r) {
        var k = -1, j;
        if (p.sessions.length === 1) k = 0;
        else if (r.sesDate) for (j = 0; j < p.sessions.length; j++) if (p.sessions[j].date === r.sesDate) { k = j; break; }
        r.ses = k < 0 ? -1 : base + k; r.tab = name; rows.push(r);
      });
    });
    return { sessions: sessions, rows: rows, problems: problems };
  }
  function actSessionOk(id) { return /^\d{4}-\d{2}-\d{2}-[a-z0-9-]{1,30}$/.test(String(id || '')); }
  function actDocId(sessionId, email) { return String(sessionId) + '__' + String(email); }
  function cut(s, n) { return String(s == null ? '' : s).trim().slice(0, n); }
  function sc2(o) { o = o || {}; return { body: o.body == null ? null : o.body, mood: o.mood == null ? null : o.mood }; }
  // 一列＋場次 → 一筆要寫進雲端的紀錄。這裡列出的就是全部欄位，沒有別的。
  function actRecord(row, ses, lim) {
    var rec = { email: String(row.email || ''), sessionId: String(ses.sessionId || ''), title: cut(ses.title, lim.maxTitle), date: String(ses.date || ''),
      photoUrl: safeUrl(ses.photoUrl).slice(0, lim.maxUrl), pre: sc2(row.pre), post: sc2(row.post),
      expect: cut(row.expect, lim.maxText), feeling: cut(row.feeling, lim.maxText), takeaway: cut(row.takeaway, lim.maxText), feedback: cut(row.feedback, lim.maxText) };
    var v = safeUrl(ses.visualUrl).slice(0, lim.maxUrl);
    if (v) rec.visualUrl = v; // 有主視覺才帶這個欄位
    return rec;
  }
  function actDups(items) {
    var seen = {}, out = [];
    arr(items).forEach(function (x, i) { var k = actDocId(x.sessionId, x.email); if (seen[k]) out.push(i); else seen[k] = 1; });
    return out;
  }
  // 預設有參加的人：每一場各補一筆只有活動資訊的紀錄；問卷裡已經有這個信箱的場次不重複補。
  // sessions（可以不給）：就算那一場沒有任何一列要送，也替預設參加的人補。
  function actAlso(emails, recs, lim, tlds, sessions) {
    var ses = {}, order = [], have = {}, seen = {}, list = [], out = [];
    arr(sessions).forEach(function (x) {
      if (x && x.sessionId && !ses[x.sessionId]) { ses[x.sessionId] = { sessionId: x.sessionId, title: x.title, date: x.date, photoUrl: x.photoUrl, visualUrl: x.visualUrl }; order.push(x.sessionId); }
    });
    arr(recs).forEach(function (r) {
      if (!ses[r.sessionId]) { ses[r.sessionId] = { sessionId: r.sessionId, title: r.title, date: r.date, photoUrl: r.photoUrl, visualUrl: r.visualUrl }; order.push(r.sessionId); }
      have[actDocId(r.sessionId, r.email)] = 1;
    });
    arr(emails).forEach(function (e) {
      var x = actEmail(e, tlds);
      if (!x.email || x.flags.indexOf('missing') >= 0 || x.flags.indexOf('format') >= 0 || seen[x.email]) return;
      seen[x.email] = 1; list.push(x.email);
    });
    order.forEach(function (id) { list.forEach(function (e) { if (!have[actDocId(id, e)]) out.push(actRecord({ email: e }, ses[id], lim)); }); });
    return out;
  }
  // 匯入計畫：選了「不用」的跳過（不覆寫）；已有的保留原本的狀態；新的是 pending。
  function actPlan(recs, existing) {
    var writes = [], added = 0, updated = 0, skipped = 0;
    arr(recs).forEach(function (r) {
      var id = actDocId(r.sessionId, r.email), old = (existing || {})[id], data = {}, k;
      if (old && old.status === 'declined') { skipped++; return; }
      for (k in r) if (Object.prototype.hasOwnProperty.call(r, k)) data[k] = r[k];
      data.status = old ? (old.status || 'pending') : 'pending';
      if (old) updated++; else added++;
      writes.push({ id: id, data: data, isNew: !old });
    });
    return { writes: writes, added: added, updated: updated, skipped: skipped };
  }
  // 前後測並列：只把數字排在一起，不算差距、不解讀。
  function actLines(a, L) {
    function one(lab, o) {
      o = o || {};
      var p = [o.body != null && L.body + ' ' + o.body, o.mood != null && L.mood + ' ' + o.mood].filter(Boolean);
      return p.length ? lab + '　' + p.join('　') : '';
    }
    return [one(L.before, a && a.pre), one(L.after, a && a.post)].filter(Boolean);
  }
  // 詢問卡上要給本人看的那一句：照「期待 → 過程 → 收穫 → 心得」的順序，取第一個有寫的；原文照放，只在太長時截斷。
  function actQuote(a, max) {
    var ks = ['expect', 'feeling', 'takeaway', 'feedback'], i, t, n = max || 120;
    for (i = 0; i < ks.length; i++) {
      t = String(a && a[ks[i]] || '').replace(/\s+/g, ' ').trim();
      if (t) return { k: ks[i], text: t.length > n ? t.slice(0, n) + '…' : t };
    }
    return null;
  }
  // 主視覺連結 → 可以直接顯示的圖片網址。Google 雲端硬碟的檔案連結換成縮圖網址（檔案要開「知道連結的人都能看」）；
  // 本來就是圖片檔的網址照用；其他的不顯示。
  function actImg(url, w) {
    var u = safeUrl(url), m = /^https:\/\/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:[^#]*&)?id=|thumbnail\?(?:[^#]*&)?id=)([A-Za-z0-9_-]{10,80})/.exec(u);
    if (m) return 'https://drive.google.com/thumbnail?id=' + m[1] + '&sz=w' + (w || 640);
    return /^https:\/\/[^\s"'<>]+\.(?:jpe?g|png|webp|gif)(?:\?[^\s"'<>]*)?$/i.test(u) ? u : '';
  }
  function actPage(a) {
    if (!a || a.status !== 'kept' || !/^\d{4}-\d{2}-\d{2}$/.test(String(a.date || ''))) return null;
    var title = String(a.title || '活動');
    return { id: 'act-' + a.docId, key: a.date, src: 'Act', kind: '活動', title: title, label: title, doodle: 'mount', tool: '',
      text: String(a.feedback || a.takeaway || a.feeling || a.expect || '').slice(0, 40), sub: '', note: '', meta: [], feel: [], big: null,
      link: safeUrl(a.photoUrl), visual: actImg(a.visualUrl, 640), photos: [],
      act: { pre: sc2(a.pre), post: sc2(a.post), expect: String(a.expect || ''), feeling: String(a.feeling || ''), takeaway: String(a.takeaway || ''), feedback: String(a.feedback || '') } };
  }
  // 搜尋：在本人看得到的文字裡找（標題、內容、標籤、補的話、起點、動力、發現）。
  function hay(p, a, t, names) {
    var j = (t && t.join) || {}, c = p.act || {};
    return [p.title, p.text, p.sub, p.note, p.label, p.kind, p.itemId && names && names[p.itemId]].concat(arr(p.feel), arr(a && a.tags),
      arr(a && a.notes).map(function (n) { return n && n.text; }), [j.text, t && t.found], arr(t && t.why),
      arr(p.photos).map(function (x) { return x && x.caption; }), [c.expect, c.feeling, c.takeaway, c.feedback])
      .filter(Boolean).join('\n').toLowerCase();
  }
  // 掛在「我的練習」某個項目上的紀錄：每個項目各有幾筆（names 是 項目代號→名稱；沒有名稱的不算）。
  function itemCounts(pages, names) {
    var m = {}, ord = [];
    arr(pages).forEach(function (p) {
      var id = p && p.itemId;
      if (!id || !names || !names[id]) return;
      if (!m[id]) { m[id] = 0; ord.push(id); }
      m[id]++;
    });
    return ord.map(function (id) { return { id: id, name: names[id], count: m[id] }; }).sort(function (a, b) { return b.count - a.count; });
  }
  function searchPages(pages, q, ann, triByRec, names) {
    var words = String(q || '').toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) return arr(pages);
    return arr(pages).filter(function (p) {
      var h = hay(p, (ann || {})[p.id], (triByRec || {})[p.id], names);
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
  // store（可省略）有的話，再帶出：本人有沒有在這個工具標過「對我有用」、最近寫下的一句發現。
  function toolUse(pages, store) {
    var m = {}, ann = (store && store.ann) || {}, byId = {};
    arr(pages).forEach(function (p) {
      byId[p.id] = p;
      if (!p.tool) return;
      var x = m[p.tool] || (m[p.tool] = { count: 0, last: '', useful: false, found: '', fk: '' });
      x.count++; if (p.key > x.last) x.last = p.key;
      if ((ann[p.id] || {}).useful) x.useful = true;
    });
    arr(store && store.tris).forEach(function (t) {
      var p = t && !t.dropped && t.found && byId[t.recId], x = p && p.tool && m[p.tool], k = t && (t.foundKey || t.key || '');
      if (x && k >= x.fk) { x.fk = k; x.found = String(t.found); }
    });
    return m;
  }
  // 在一個方法（某個工具，或某場活動的名稱）上標「對我有用」：標在最近一筆；取消時把這個方法每一筆的標記都拿掉。
  // pages 要是新到舊。沒有任何一筆時不做事，回 false。
  function markUseful(pages, ann, pick, on) {
    var ps = arr(pages).filter(pick);
    if (!ps.length || !ann) return false;
    if (on) (ann[ps[0].id] = ann[ps[0].id] || {}).useful = true;
    else ps.forEach(function (p) { if (ann[p.id]) ann[p.id].useful = false; });
    return true;
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

  // ── 我的練習：自訂項目的長期紀錄（純函式） ──
  function pracFmt(n) { return String(Math.round(Number(n) * 10) / 10); }
  function pracAmount(v, max) {
    var s = String(v == null ? '' : v).replace(/^\s+|\s+$/g, '');
    if (!s || !/^[+-]?(\d+\.?\d*|\.\d+)$/.test(s)) return null;
    var n = Number(s);
    if (!isFinite(n) || n <= 0 || n > max) return null;
    n = Math.round(n * 10) / 10;
    return n > 0 ? n : null;
  }
  function trimS(v) { return String(v == null ? '' : v).replace(/^\s+|\s+$/g, ''); }
  // 項目的手繪圖示：只收「a 到 e 加兩個字」這種代號（對到 me/doodles/ 的檔名），其他一律當作沒有。
  function pracIcon(v) { return /^[a-e][1-7][1-9a-c]$/.test(String(v || '')) ? String(v) : ''; }
  // 新增項目時依名稱配一個圖示：名稱一樣的最優先，其次是名稱裡包含圖示名（取最長的），再其次是圖示名包含名稱。
  function pracGuessIcon(name, icons) {
    var n = trimS(name), best = '', bl = 0, loose = '';
    if (!n) return '';
    arr(icons).forEach(function (x) {
      if (!x || !x.n) return;
      if (x.n === n) { best = x.k; bl = 999; return; }
      if (n.indexOf(x.n) > -1 && x.n.length > bl) { best = x.k; bl = x.n.length; }
      else if (!loose && n.length >= 2 && x.n.indexOf(n) > -1) loose = x.k;
    });
    return best || loose;
  }
  // 算進這個項目的平台工具：存成「a,b」這樣一串工具代號
  // 想繼續探索的問題：不是任務，沒有完成率。觀察就是掛了 qid 的隨手記。
  function questText(v, max) { return String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, max || 80); }
  function questAdd(list, text, now, opt) {
    var o = opt || {}, t = questText(text, o.chars), act = arr(list).filter(function (q) { return q && !q.rest; });
    if (!t) return { ok: false, why: 'empty' };
    if (act.some(function (q) { return q.text === t; })) return { ok: false, why: 'same' };
    if (act.length >= (o.max || 12)) return { ok: false, why: 'full' };
    var d = new Date(now);
    return { ok: true, quest: { id: 'q-' + (+d) + '-' + Math.random().toString(36).slice(2, 6), text: t, created: keyOf(d) } };
  }
  // 問題上的標籤：和紀錄共用同一組「我的主題」。回傳每個標籤掛了幾個問題，照第一次出現的順序。
  function questTags(list) {
    var out = [], at = {};
    arr(list).forEach(function (q) { arr(q && q.tags).forEach(function (t) { if (at[t] === undefined) { at[t] = out.length; out.push({ k: t, n: 0 }); } out[at[t]].n++; }); });
    return out;
  }
  function questTagSet(q, name, on, max) {
    var t = String(name == null ? '' : name).replace(/\s+/g, ' ').trim().slice(0, 8), cur = arr(q && q.tags).slice(), i = cur.indexOf(t);
    if (!t) return cur;
    if (on && i < 0 && cur.length < (max || 5)) cur.push(t);
    if (!on && i > -1) cur.splice(i, 1);
    return cur;
  }
  function questNotes(memos, qid) {
    var out = arr(memos).filter(function (m) { return m && m.qid && String(m.qid) === String(qid) && m.text; }).reverse();
    return out.map(function (m, i) { return { m: m, i: i }; }).sort(function (a, b) { return a.m.key < b.m.key ? 1 : a.m.key > b.m.key ? -1 : a.i - b.i; }).map(function (x) { return x.m; });
  }
  function pracTools(v) {
    var seen = {}, out = [];
    String(Array.isArray(v) ? v.join(',') : (v || '')).split(',').forEach(function (k) {
      k = k.trim();
      if (/^[a-z]{2,12}$/.test(k) && !seen[k] && out.length < 8) { seen[k] = 1; out.push(k); }
    });
    return out.join(',');
  }
  // 照紀錄算出來的幾件事。只有數字，句子由畫面那一層用文案組；只描述，不解釋原因。
  function pracInsights(logs, items, ids, todayKey) {
    ids = Array.isArray(ids) ? ids : [ids];
    var list = pracOf(logs, ids), seen = {}, days = [], unitOf = {}, per = {}, wd = [0, 0, 0, 0, 0, 0, 0], out, i;
    arr(items).forEach(function (it) { if (it) unitOf[it.id] = it.unit || ''; });
    list.forEach(function (l) { if (!seen[l.date]) { seen[l.date] = 1; days.push(l.date); } per[l.itemId] = (per[l.itemId] || 0) + 1; });
    days.sort();
    out = { n: list.length, days: days.length, last: days.length ? days[days.length - 1] : '', sinceLast: 0, moDays: 0, prevDays: 0, hasPrev: false, wd: null, gap: null, top: null, avg: null };
    if (!list.length) return out;
    out.sinceLast = daysBetween(out.last, todayKey);
    var ym = todayKey.slice(0, 7), t = toDate(todayKey), pv = new Date(t.getFullYear(), t.getMonth() - 1, 1), pym = pv.getFullYear() + '-' + pad(pv.getMonth() + 1);
    days.forEach(function (d) {
      if (d.slice(0, 7) === ym) out.moDays++; else { out.hasPrev = true; if (d.slice(0, 7) === pym) out.prevDays++; }
      wd[toDate(d).getDay()]++;
    });
    // 最常在星期幾：至少 6 天的紀錄，而且第一名比第二名多
    if (days.length >= 6) {
      var bi = 0, second = 0;
      for (i = 1; i < 7; i++) if (wd[i] > wd[bi]) bi = i;
      for (i = 0; i < 7; i++) if (i !== bi && wd[i] > second) second = wd[i];
      if (wd[bi] >= 3 && wd[bi] > second) out.wd = { i: bi, n: wd[bi] };
    }
    // 隔最久的一次
    if (days.length >= 3) {
      var g = { days: 0, from: '', to: '' };
      for (i = 1; i < days.length; i++) { var df = daysBetween(days[i - 1], days[i]); if (df > g.days) g = { days: df, from: days[i - 1], to: days[i] }; }
      if (g.days >= 3) out.gap = g;
    }
    // 最常記的那一個（大項目底下有小項目時）
    if (ids.length > 1) {
      var best = '', b2 = 0;
      ids.forEach(function (id) { if ((per[id] || 0) > (per[best] || 0)) best = id; });
      ids.forEach(function (id) { if (id !== best && (per[id] || 0) > b2) b2 = per[id]; });
      if (best && per[best] >= 2 && per[best] > b2) out.top = { id: best, n: per[best] };
    }
    // 每次平均：全部同一個單位才算
    var u = list[0].unit || unitOf[list[0].itemId] || '', same = list.every(function (l) { return (l.unit || unitOf[l.itemId] || '') === u; });
    if (same && list.length >= 2) {
      var sum = 0, mx = 0;
      list.forEach(function (l) { var a = Number(l.amount) || 0; sum += a; if (a > mx) mx = a; });
      out.avg = { unit: u, v: Math.round(sum / list.length * 10) / 10, max: mx };
    }
    return out;
  }
  function pracItemCheck(x, lim) {
    x = x || {};
    var item = { name: trimS(x.name), unit: trimS(x.unit), color: typeof x.color === 'string' ? x.color : '', icon: pracIcon(x.icon),
      goal: trimS(x.goal), parent: /^[A-Za-z0-9_-]{1,40}$/.test(String(x.parent || '')) ? String(x.parent) : '', tools: pracTools(x.tools) };
    var err = '';
    if (!item.name || item.name.length > lim.name) err = 'name';
    else if (!item.unit || item.unit.length > lim.unit) err = 'unit';
    else if (lim.goal && item.goal.length > lim.goal) err = 'goal';
    return { ok: !err, err: err, item: item };
  }
  function realDate(s) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
    var p = s.split('-').map(Number), d = new Date(p[0], p[1] - 1, p[2]);
    return d.getFullYear() === p[0] && d.getMonth() === p[1] - 1 && d.getDate() === p[2];
  }
  function pracLogCheck(x, todayKey, lim) {
    x = x || {};
    var date = String(x.date == null ? '' : x.date), amount = pracAmount(x.amount, lim.amount), note = trimS(x.note).replace(/[\r\n]+/g, ' '), what = pracWhat(x.what), unit = pracWhat(x.unit);
    var err = '';
    if (!realDate(date)) err = 'date';
    else if (date > todayKey) err = 'future';
    else if (amount === null) err = 'amount';
    else if (lim.what && what.length > lim.what) err = 'what';
    // 放雲端時「哪一個」和那一句合在同一欄（見 pracNotePack），所以兩個加起來不能超過那一欄的上限
    else if (unit.length > lim.unit) err = 'unit';
    else if (note.length + pracNotePack(what, '', unit).length > lim.note) err = 'note';
    return { ok: !err, err: err, log: { date: date, amount: amount, note: note, what: what, unit: unit } };
  }
  // ── 各種練習的預設與「哪一個」（書名、展名、菜名、茶款…）──
  // 名稱對到哪一種預設：名稱一樣的優先，其次是名稱裡含關鍵字（取最長的）。對不到回 null。
  function pracKind(name, kinds) {
    var n = trimS(name), best = null, bl = 0;
    if (!n) return null;
    arr(kinds).forEach(function (k) {
      if (!k || !k.n) return;
      if (k.n === n) { best = k; bl = 999; return; }
      arr(k.ks).concat([k.n]).forEach(function (w) { if (w && n.indexOf(w) > -1 && w.length > bl) { best = k; bl = w.length; } });
    });
    return best;
  }
  // 記一筆時多問的那一欄叫什麼。own 是本人在設定裡改的（'-' 是關掉）；沒改就照預設；
  // 沒有預設、但這個項目已經記過這一欄，就用通用的說法（any），免得記過的看不到。回空字串就是不問。
  function pracAsk(own, kind, used, any) {
    own = trimS(own);
    if (own === '-') return '';
    if (own) return own;
    if (kind && kind.ask) return kind.ask;
    return used ? String(any || '') : '';
  }
  // 「寫一段」空白框裡的那一行提示：本人改的優先（'-' 是不要提示），沒改就照預設，沒有預設就不提示。
  function pracHint(own, kind) {
    own = trimS(own);
    if (own === '-') return '';
    return own || String((kind && kind.hint) || '');
  }
  function pracWhat(v) { return trimS(v).replace(/\s+/g, ' '); }
  // 雲端的紀錄只有 note 一欄可以放字（規則不用改）：第一行是「哪一個」，後面用 tab 接這一筆用的單位（和項目的主要單位不同時才有），
  // 第二行是那一句；讀回來再拆開。舊紀錄的 note 沒有換行，照原樣是那一句。
  function pracNotePack(what, note, unit) {
    what = pracWhat(what); unit = pracWhat(unit); note = String(note == null ? '' : note).replace(/[\r\n]+/g, ' ');
    var head = what + (unit ? '\t' + unit : '');
    return head ? head + '\n' + note : note;
  }
  function pracNoteUnpack(s) {
    s = String(s == null ? '' : s);
    var i = s.indexOf('\n'), head;
    if (i < 0) return { what: '', unit: '', note: s };
    head = s.slice(0, i).split('\t');
    return { what: pracWhat(head[0]), unit: pracWhat(head[1]), note: s.slice(i + 1).replace(/[\r\n]+/g, ' ') };
  }
  // 一個項目用到的單位：主要單位在最前面，接著是本人另外加的，再來是紀錄裡出現過的。不重複。
  function pracUnits(primary, extras, logs, itemId) {
    var out = [];
    function add(u) { u = pracWhat(u); if (u && out.indexOf(u) < 0) out.push(u); }
    add(primary); arr(extras).forEach(add);
    arr(logs).forEach(function (l) { if (l && l.itemId === itemId && l.unit) add(l.unit); });
    return out;
  }
  // 這個項目記過哪些（最近的在前、不重複），給記一筆時直接點
  function pracWhats(logs, itemId, n) {
    var seen = {}, out = [];
    pracOf(logs, itemId).filter(function (l) { return pracWhat(l.what); })
      .sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : (b.at || 0) - (a.at || 0); })
      .forEach(function (l) { var w = pracWhat(l.what); if (!seen[w]) { seen[w] = 1; out.push(w); } });
    return n ? out.slice(0, n) : out;
  }
  // 照「哪一個」整理：幾次、同單位才加總的合計、最後一次是哪天。最近記過的排前面。只並列，不比較。
  function pracByWhat(logs, items, ids) {
    var by = {}, ord = [];
    pracOf(logs, ids).forEach(function (l) { var w = pracWhat(l.what); if (!w) return; if (!by[w]) { by[w] = []; ord.push(w); } by[w].push(l); });
    return ord.map(function (w) {
      var r = pracRollup(by[w], items, ids), last = '';
      by[w].forEach(function (l) { if (l.date > last) last = l.date; });
      return { what: w, n: r.n, days: r.days, units: r.units, first: r.first, last: last };
    }).sort(function (a, b) { return a.last < b.last ? 1 : a.last > b.last ? -1 : b.n - a.n; });
  }
  // 記一筆時放的照片，存成一筆「有照片的隨手記」（同項目、同一天，字是「哪一個」或空白）。
  // 顯示時把它併回那一天的那一筆；找不到對應的紀錄（例如紀錄刪了、改了日期）就照原樣自己一筆。
  function pracPhotoJoin(logs, memos) {
    var byLog = {}, used = {};
    arr(memos).forEach(function (m) {
      if (!m || !m.itemId || !arr(m.photos).length) return;
      var t = pracWhat(m.text), best = null;
      arr(logs).forEach(function (l) {
        if (!l || l.itemId !== m.itemId || l.date !== m.key) return;
        if (t && pracWhat(l.what) !== t) return;
        if (!best || (l.at || 0) > (best.at || 0)) best = l;
      });
      if (!best) return;
      used[String(m.id)] = best.id;
      byLog[best.id] = (byLog[best.id] || []).concat(m.photos);
    });
    return { byLog: byLog, used: used };
  }
  function pracNoteCheck(x, lim) {
    x = x || {};
    var note = { title: trimS(x.title), body: String(x.body == null ? '' : x.body) };
    var err = '';
    if (!note.title || note.title.length > lim.title) err = 'title';
    else if (note.body.length > lim.body) err = 'body';
    return { ok: !err, err: err, note: note };
  }
  // 大項目底下可以有小項目，只認一層：parent 不存在、指向自己、或指向另一個小項目，都當作沒有。
  function pracParent(items, it) {
    var id = it && it.parent, p;
    if (!id || id === it.id) return '';
    p = arr(items).filter(function (x) { return x && x.id === id; })[0];
    return p && !p.parent ? String(id) : '';
  }
  function pracKids(items, id) { return arr(items).filter(function (x) { return x && x.id !== id && pracParent(items, x) === id; }); }
  function pracFamily(items, id) { return [id].concat(pracKids(items, id).map(function (x) { return x.id; })); }
  // 寫下的：不分心得、筆記、感想，也不用標題，長短不拘。
  // 雲端規則要求每一筆有標題，所以自動拿內文第一行的開頭當標題（本人不會看到這一欄）。
  function pracTitleOf(body) {
    var ls = String(body == null ? '' : body).split('\n'), i, t;
    for (i = 0; i < ls.length; i++) { t = trimS(ls[i]); if (t) return t.slice(0, 30); }
    return '';
  }
  function pracWriteCheck(x, lim) {
    var body = String(x && x.body != null ? x.body : '').replace(/\s+$/, ''), err = '';
    if (!trimS(body)) err = 'empty';
    else if (body.length > lim.body) err = 'body';
    return { ok: !err, err: err, note: { title: pracTitleOf(body), body: body } };
  }
  function pracClean(p) {
    p = p || {};
    function keep(v) { return arr(v).filter(function (e) { return e && e.id; }); }
    return { items: keep(p.items), logs: keep(p.logs), notes: keep(p.notes) };
  }
  function pracLast(logs, itemId) {
    var last = '';
    arr(logs).forEach(function (l) { if (l && l.itemId === itemId && l.date > last) last = l.date; });
    return last;
  }
  function pracSum(list) {
    var n = 0, s = 0;
    list.forEach(function (l) { n++; s += Number(l.amount) || 0; });
    return { n: n, sum: Math.round(s * 10) / 10 };
  }
  // itemId 可以是一個代號，也可以是一串（大項目加它的小項目）
  function pracOf(logs, itemId) {
    var ids = Array.isArray(itemId) ? itemId : [itemId];
    return arr(logs).filter(function (l) { return l && ids.indexOf(l.itemId) > -1 && l.date; });
  }
  // 大項目的彙整：幾次、幾天，以及「同單位才加總」的合計（分鐘歸分鐘、遍歸遍）。ym 給了就只算那個月。
  function pracRollup(logs, items, ids, ym) {
    var unitOf = {}, by = {}, ord = [], days = {}, n = 0, first = '';
    arr(items).forEach(function (x) { if (x && x.id) unitOf[x.id] = String(x.unit || ''); });
    pracOf(logs, ids).forEach(function (l) {
      if (ym && l.date.slice(0, 7) !== ym) return;
      var u = l.unit || unitOf[l.itemId] || '';
      if (!by[u]) { by[u] = { unit: u, n: 0, sum: 0 }; ord.push(u); }
      by[u].n++; by[u].sum += Number(l.amount) || 0;
      days[l.date] = 1; n++;
      if (!first || l.date < first) first = l.date;
    });
    return { n: n, days: Object.keys(days).length, first: first,
      units: ord.map(function (u) { return { unit: u, n: by[u].n, sum: Math.round(by[u].sum * 10) / 10 }; }).sort(function (a, b) { return b.n - a.n; }) };
  }
  function pracMonth(logs, itemId, y, m) {
    var mine = pracOf(logs, itemId), first = new Date(y, m - 1, 1), count = new Date(y, m, 0).getDate();
    var days = [], d, key, rows, s, all = [];
    for (d = 1; d <= count; d++) {
      key = y + '-' + pad(m) + '-' + pad(d);
      rows = mine.filter(function (l) { return l.date === key; });
      s = pracSum(rows);
      days.push({ key: key, d: d, n: s.n, sum: s.sum });
      all = all.concat(rows);
    }
    s = pracSum(all);
    return { lead: (first.getDay() + 6) % 7, days: days, n: s.n, sum: s.sum };
  }
  function pracTotals(logs, itemId, todayKey) {
    var mine = pracOf(logs, itemId), ym = String(todayKey).slice(0, 7), first = '';
    mine.forEach(function (l) { if (!first || l.date < first) first = l.date; });
    var a = pracSum(mine), mo = pracSum(mine.filter(function (l) { return l.date.slice(0, 7) === ym; }));
    return { month: { n: mo.n, sum: mo.sum }, all: { n: a.n, sum: a.sum, first: first } };
  }
  function pracWeeks(logs, itemId, todayKey, count) {
    var mine = pracOf(logs, itemId), dow = (toDate(todayKey).getDay() + 6) % 7, cur = addDays(todayKey, -dow), out = [], i, st, en, s;
    for (i = count - 1; i >= 0; i--) {
      st = addDays(cur, -7 * i); en = addDays(st, 6);
      s = pracSum(mine.filter(function (l) { return l.date >= st && l.date <= en; }));
      out.push({ start: st, n: s.n, sum: s.sum });
    }
    return out;
  }
  function pracMonths(logs, itemId, todayKey, count) {
    var mine = pracOf(logs, itemId), p = String(todayKey).split('-').map(Number), out = [], i, d, ym, s;
    for (i = count - 1; i >= 0; i--) {
      d = new Date(p[0], p[1] - 1 - i, 1); ym = d.getFullYear() + '-' + pad(d.getMonth() + 1);
      s = pracSum(mine.filter(function (l) { return l.date.slice(0, 7) === ym; }));
      out.push({ ym: ym, n: s.n, sum: s.sum });
    }
    return out;
  }
  function pracDayLogs(logs, itemId, key) {
    return pracOf(logs, itemId).filter(function (l) { return l.date === key; })
      .sort(function (a, b) { return (a.at || 0) < (b.at || 0) ? -1 : (a.at || 0) > (b.at || 0) ? 1 : 0; });
  }
  function pracRemoveItem(p, itemId) {
    p = p || {};
    function not(e) { return !(e && e.itemId === itemId); }
    return { items: arr(p.items).filter(function (e) { return !(e && e.id === itemId); }), logs: arr(p.logs).filter(not), notes: arr(p.notes).filter(not) };
  }
  function pracUnmark(list, itemId) {
    return arr(list).map(function (e) {
      if (!e || e.itemId !== itemId) return e;
      var c = {}, k;
      for (k in e) if (Object.prototype.hasOwnProperty.call(e, k) && k !== 'itemId') c[k] = e[k];
      return c;
    });
  }
  function pracInsp(list, itemId) {
    return arr(list).filter(function (e) { return e && e.itemId === itemId; })
      .sort(function (a, b) { return a.key < b.key ? 1 : a.key > b.key ? -1 : 0; });
  }
  // 這個帳號的練習紀錄放哪裡：pref 是 { uid: 'cloud' | 'local' }，cloudHas 是雲端已經有項目
  function pracMode(pref, uid, cloudHas) {
    if (!uid) return 'local';
    var v = pref && typeof pref === 'object' ? pref[uid] : '';
    if (v === 'cloud') return 'cloud';
    if (v === 'local') return 'local';
    return cloudHas ? 'cloud' : 'ask';
  }
  // 我的資料：每一類現在放哪裡、誰看得到、能做什麼。只回傳代號，字在 me-data.js 的 privacy.table。
  // c: { demo, user（已登入且信箱驗證過）, prac: 'local'|'cloud'|'out', cloudOff, photos, acts }
  function dataRows(c) {
    c = c || {};
    var u = !!c.user, rows = [];
    function row(key, where, who, act) { rows.push({ key: key, where: where, who: who, act: c.demo ? '' : act }); }
    row('states', 'device', 'me', '');
    row('words', 'device', 'me', '');
    if (u) row('photos', 'cloud', 'admin', c.photos > 0 ? 'wipephotos' : ''); else row('photos', 'none', '', 'login');
    if (c.prac === 'cloud') row('practice', 'cloud', 'admin', 'tolocal');
    else if (c.prac === 'out') row('practice', 'out', '', 'login');
    else row('practice', 'device', 'me', u ? (c.cloudOff ? '' : 'tocloud') : 'login');
    if (u) row('acts', 'cloud', 'host', c.acts > 0 ? 'acts' : ''); else row('acts', 'none', '', 'login');
    row('tools', 'tools', 'tools', ''); // 各工具自己決定放哪裡：登入工具後有些會同步到工具自己的雲端，不能寫成只在裝置
    return rows;
  }
  // 各工具的每日紀錄有兩份：沒登入工具時寫在 jte_daily_v1，登入後寫在 jte_daily_<信箱>。
  // dailyKey 算出第二份的名稱（和各工具的算法一樣）；mergeDaily 把兩份排在一起，同一筆不重複。都只讀這台裝置。
  function dailyKey(email) { email = String(email || ''); return email ? 'jte_daily_' + email.replace(/[^a-zA-Z0-9]/g, '_') : ''; }
  function mergeDaily(a, b) {
    var out = {}, seen;
    function isDay(r) { return r && typeof r === 'object'; }
    function rid(l) { return l && (l.recordId || l.id) ? String(l.recordId || l.id) : ''; }
    [a, b].forEach(function (src) {
      if (!isDay(src)) return;
      Object.keys(src).forEach(function (k) {
        var r = src[k], o = out[k], i, id;
        if (!isDay(r)) return;
        if (!o) { o = out[k] = {}; for (i in r) if (Object.prototype.hasOwnProperty.call(r, i)) o[i] = r[i]; o.linked = arr(r.linked).slice(); o.moods = arr(r.moods).slice(); return; }
        seen = {}; o.linked.forEach(function (l) { id = rid(l); if (id) seen[id] = 1; });
        arr(r.linked).forEach(function (l) { id = rid(l); if (id && seen[id]) return; if (id) seen[id] = 1; o.linked.push(l); });
        arr(r.moods).forEach(function (m) { if (o.moods.indexOf(m) < 0) o.moods.push(m); });
        if (r.note && r.note !== o.note) o.note = o.note ? o.note + '\n' + r.note : r.note;
      });
    });
    return out;
  }
  // 區塊收放：本人動過就照本人的；沒動過的照預設（closed 是預設收起的那幾塊）。
  function foldState(pref, closed, key) {
    if (pref && typeof pref === 'object' && typeof pref[key] === 'boolean') return pref[key];
    return arr(closed).indexOf(key) > -1;
  }
  function pracId(prefix) {
    var r = '', i, c = 'abcdefghijklmnopqrstuvwxyz0123456789';
    for (i = 0; i < 6; i++) r += c.charAt(Math.floor(Math.random() * c.length));
    return prefix + Date.now().toString(36) + r;
  }

  g.JteMe = { pad: pad, keyOf: keyOf, dlabel: dlabel, mmss: mmss, esc: esc, safeUrl: safeUrl,
    toPage: toPage, buildPages: buildPages, hrvSeries: hrvSeries, monthCount: monthCount,
    addDays: addDays, daysBetween: daysBetween, triEnjoy: triEnjoy, triCorners: triCorners, triStage: triStage,
    linkTriangles: linkTriangles, capsulePick: capsulePick, manual: manual,
    circleView: circleView, circleDay: circleDay, isMember: isMember, openCircles: openCircles, swView: swView, toolUse: toolUse, markUseful: markUseful, paneOf: paneOf, route: route, hashOf: hashOf, practiceView: practiceView, justPick: justPick, lastSame: lastSame, searchPages: searchPages, lensGroups: lensGroups, inspCheck: inspCheck, fitSize: fitSize, tsvRows: tsvRows, actDate: actDate, actEmail: actEmail, actScore: actScore, actParse: actParse, actSessionOk: actSessionOk, actDocId: actDocId, actRecord: actRecord, actDups: actDups, actPlan: actPlan, actAlso: actAlso, sheetId: sheetId, actTabTitle: actTabTitle, actSheet: actSheet, actLines: actLines, actQuote: actQuote, actPage: actPage,
    pracFmt: pracFmt, pracAmount: pracAmount, pracItemCheck: pracItemCheck, pracLogCheck: pracLogCheck, pracNoteCheck: pracNoteCheck, pracClean: pracClean,
    pracLast: pracLast, pracMonth: pracMonth, pracTotals: pracTotals, pracWeeks: pracWeeks, pracMonths: pracMonths, pracDayLogs: pracDayLogs,
    pracRemoveItem: pracRemoveItem, pracUnmark: pracUnmark, pracInsp: pracInsp, pracMode: pracMode, pracId: pracId, dataRows: dataRows, dailyKey: dailyKey, mergeDaily: mergeDaily, foldState: foldState, itemCounts: itemCounts, pracIcon: pracIcon,
    pracKind: pracKind, pracAsk: pracAsk, pracHint: pracHint, pracWhat: pracWhat, pracNotePack: pracNotePack, pracNoteUnpack: pracNoteUnpack, pracUnits: pracUnits, pracWhats: pracWhats, pracByWhat: pracByWhat, pracPhotoJoin: pracPhotoJoin,
    pracParent: pracParent, pracKids: pracKids, pracFamily: pracFamily, pracTitleOf: pracTitleOf, pracWriteCheck: pracWriteCheck, pracRollup: pracRollup, pracGuessIcon: pracGuessIcon, pracTools: pracTools, pracInsights: pracInsights,
    actImg: actImg, questText: questText, questAdd: questAdd, questNotes: questNotes, questTags: questTags, questTagSet: questTagSet };
})(window);
