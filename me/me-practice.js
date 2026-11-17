/* 我的練習：本人自訂的練習項目、每次的紀錄、月曆、累計、長條圖、心得靈感、筆記。
 * 由 me/index.html 透過 window.JtePrac 接上（init／render／setUser／handleHash／exportData）。
 * 文案全部在 me-data.js 的 JTE_ME_DATA.prac.t；這裡不寫中文句子。
 * 資料讀寫一律經過 store（本機、雲端、示範）；畫面等寫入成功才更新。雲端的寫入失敗就顯示錯誤，不會改存本機。
 */
(function (g) {
  'use strict';
  var C, D, M, P, T, esc, store, inited = false;
  var box, quick, zone, secPrac, rest, live;
  // 畫面狀態：哪個項目的專區、哪個分頁、月曆的月份、哪一天、哪個表單開著
  var st = { data: { items: [], logs: [], notes: [] }, seen: null, item: '', tab: 'log', calY: 0, calM: 0, day: '', chart: 'week',
    lf: null, itf: null, nopen: '', ask: '', busy: false, focus: '', select: false, user: null,
    mode: 'local', uid: null, gen: 0, cloudState: '', moving: '', moveErr: '', wipeLeft: false, cloudOff: false, authed: false, nnid: '' };
  var dirty = { box: false, quick: false, zone: false };
  var TABS = ['log', 'insp', 'notes', 'set'];

  function $(s, r) { return (r || document).querySelector(s); }
  function each(list, fn) { Array.prototype.forEach.call(list, fn); }
  function fill(s, o) { return String(s).replace(/\{(\w+)\}/g, function (_, k) { return o[k] == null ? '' : String(o[k]); }); }
  function fillH(s, o) { var e = {}, k; for (k in o) if (Object.prototype.hasOwnProperty.call(o, k)) e[k] = esc(o[k]); return fill(s, e); }
  function fk(k) { return ' data-k="' + esc(k) + '"'; }
  function slash(key) { return String(key || '').replace(/-/g, '/'); }
  function ymd(key) { var p = String(key).split('-').map(Number); return { y: p[0], m: p[1], d: p[2] }; }
  function tint(hex, a) {
    var m = /^#?([0-9a-f]{6})$/i.exec(String(hex || '')), n, r, gg, b;
    if (!m) return '#EAF1FC';
    n = parseInt(m[1], 16); r = n >> 16 & 255; gg = n >> 8 & 255; b = n & 255;
    function mix(c) { var v = Math.round(255 - (255 - c) * a).toString(16); return v.length < 2 ? '0' + v : v; }
    return '#' + mix(r) + mix(gg) + mix(b);
  }
  function safeColor(c) { return /^#[0-9a-f]{6}$/i.test(String(c || '')) ? c : P.colors[0]; }
  function cvars(it) { var c = safeColor(it.color); return ' style="--pc:' + c + ';--pt:' + tint(c, 0.16) + ';--pt2:' + tint(c, 0.32) + '"'; }
  function busy() { return st.busy || !!st.moving; }
  function announce(t) { if (live) { live.textContent = ''; setTimeout(function () { live.textContent = t; }, 30); } }

  // ── 資料 ──
  function items() { return st.data.items; }
  function itemById(id) { return items().filter(function (x) { return x.id === id; })[0] || null; }
  function logById(id) { return st.data.logs.filter(function (x) { return x.id === id; })[0] || null; }
  function noteById(id) { return st.data.notes.filter(function (x) { return x.id === id; })[0] || null; }
  function active() { return items().filter(function (x) { return !x.archived; }); }
  function upsert(list, obj) {
    for (var i = 0; i < list.length; i++) if (list[i].id === obj.id) { list[i] = obj; return; }
    list.push(obj);
  }
  function drop(list, id) { return list.filter(function (x) { return x.id !== id; }); }
  function lastAmount(itemId) {
    var best = null;
    st.data.logs.forEach(function (l) {
      if (l.itemId !== itemId) return;
      if (!best || l.date > best.date || (l.date === best.date && (l.at || 0) > (best.at || 0))) best = l;
    });
    return best ? M.pracFmt(best.amount) : '';
  }
  function todaySum(itemId) {
    var s = 0, n = 0;
    st.data.logs.forEach(function (l) { if (l.itemId === itemId && l.date === C.TODAY) { n++; s += Number(l.amount) || 0; } });
    return n ? Math.round(s * 10) / 10 : 0;
  }
  function newItf(name, unit) { return { name: name, unit: unit, id: M.pracId('pi-') }; }
  function copy(x) { var o = {}, k; for (k in x) if (Object.prototype.hasOwnProperty.call(x, k)) o[k] = x[k]; return o; }

  // ── store：本機（jte_me_v1 的 prac）與示範（只在記憶體） ──
  function localStore() {
    function box2() { var p = M.pracClean(C.O.prac); C.O.prac = p; return p; }
    function put(coll) { return function (obj) { var p = box2(); upsert(p[coll], copy(obj)); C.save(); st.seen = C.O.prac; return Promise.resolve(obj); }; }
    function del(coll) { return function (id) { var p = box2(); p[coll] = drop(p[coll], id); C.save(); st.seen = C.O.prac; return Promise.resolve(id); }; }
    return { kind: 'local',
      load: function () { return Promise.resolve(M.pracClean(C.O.prac)); },
      putItem: put('items'), putLog: put('logs'), putNote: put('notes'), delLog: del('logs'), delNote: del('notes'),
      delItem: function (id) { C.O.prac = M.pracRemoveItem(box2(), id); C.save(); st.seen = C.O.prac; return Promise.resolve(id); } };
  }
  // 帶逾時的呼叫：沒網路馬上失敗，卡住太久也失敗（Firestore 離線時寫入會一直等）
  function timed(fn, ms) {
    return new Promise(function (ok, no) {
      var done = false, tm;
      function end(f) { return function (v) { if (done) return; done = true; clearTimeout(tm); f(v); }; }
      if (typeof navigator !== 'undefined' && navigator.onLine === false) { no(new Error('offline')); return; }
      tm = setTimeout(function () { end(no)(new Error('timeout')); }, ms);
      try { fn().then(end(ok), end(no)); } catch (e) { end(no)(e); }
    });
  }
  function emptyData() { return { items: [], logs: [], notes: [] }; }
  function errCode(e) { return (e && (e.code || e.message)) || 'error'; }
  function cloudStore(uid) {
    var me;
    function stale() { return st.uid !== uid || store !== me; }
    function call(fn) {
      return timed(function () { return fn(g.JteCloud); }, 20000).then(function (r) { if (stale()) throw new Error('stale'); return r; },
        function (e) { if (stale()) throw new Error('stale'); throw e; });
    }
    function put(kind) { return function (obj) { return call(function (c) { return c.pracPut(kind, obj); }); }; }
    function del(kind) { return function (id) { return call(function (c) { return c.pracDel(kind, id); }).then(function () { return id; }); }; }
    me = { kind: 'cloud',
      load: function () { return call(function (c) { return c.pracLoad(); }).then(function (d) { return M.pracClean(d); }); },
      putItem: put('items'), putLog: put('logs'), putNote: put('notes'), delLog: del('logs'), delNote: del('notes'),
      delItem: function (id) { return call(function (c) { return c.pracDelItem(id); }).then(function () { return id; }); } };
    return me;
  }
  function demoStore() {
    function ok(x) { return Promise.resolve(x); }
    return { kind: 'demo', load: function () { return ok(st.data); },
      putItem: ok, putLog: ok, putNote: ok, delLog: ok, delNote: ok, delItem: ok };
  }
  function demoData() {
    var Dm = P.demo, s = 20261118, out = { items: [], logs: [], notes: [] }, i, k, r, notes;
    function rnd() { s = (s * 9301 + 49297) % 233280; return s / 233280; }
    function ms(key) { var d = ymd(key); return new Date(d.y, d.m - 1, d.d, 7, 30).getTime(); }
    Dm.items.forEach(function (x, j) {
      out.items.push({ id: x.id, name: x.name, unit: x.unit, color: x.color, archived: false, createdAt: ms(M.addDays(C.TODAY, -126 + j * 14)) });
    });
    for (i = 125; i >= 0; i--) {
      k = M.addDays(C.TODAY, -i);
      // 太極：一週三、四次，20–40 分鐘
      r = rnd();
      if (r < 0.5) {
        notes = Dm.logNotes[Dm.items[0].id];
        out.logs.push({ id: 'pl-demo-t' + i, itemId: Dm.items[0].id, date: k, amount: 20 + 5 * Math.floor(rnd() * 5),
          note: rnd() < 0.12 ? notes[Math.floor(rnd() * notes.length)] : '', at: ms(k) + i });
      }
      // 靜坐：比較零星，10–20 分鐘
      r = rnd();
      if (r < 0.2 && i <= 111) {
        notes = Dm.logNotes[Dm.items[1].id];
        out.logs.push({ id: 'pl-demo-s' + i, itemId: Dm.items[1].id, date: k, amount: 10 + 5 * Math.floor(rnd() * 3),
          note: rnd() < 0.15 ? notes[Math.floor(rnd() * notes.length)] : '', at: ms(k) + 3600000 + i });
      }
    }
    Dm.notes.forEach(function (n) { out.notes.push({ id: n.id, itemId: n.itemId, title: n.title, body: n.body, updatedAt: ms(M.addDays(C.TODAY, -n.days)) }); });
    return out;
  }
  function syncLocal() {
    if (store.kind !== 'local' || C.O.prac === st.seen) return;
    st.seen = C.O.prac; st.data = M.pracClean(C.O.prac);
  }

  // ── 登入之後：本機或雲端 ──
  function prefs() { var p = C.O.prefs; return p && p.pracCloud && typeof p.pracCloud === 'object' ? p.pracCloud : {}; }
  function setPref(uid, v) {
    if (!C.O.prefs || typeof C.O.prefs !== 'object') C.O.prefs = {};
    if (!C.O.prefs.pracCloud || typeof C.O.prefs.pracCloud !== 'object') C.O.prefs.pracCloud = {};
    C.O.prefs.pracCloud[uid] = v; C.save();
  }
  function localCount() { var p = M.pracClean(C.O.prac); return p.items.length + p.logs.length + p.notes.length; }
  function hasCloudPref() { var p = prefs(), k; for (k in p) if (Object.prototype.hasOwnProperty.call(p, k) && p[k] === 'cloud') return true; return false; }
  // 以前選過放雲端的人，登入狀態還在還原時先顯示讀取中，免得閃出空的畫面
  function restoring() { return !C.DEMO && !st.authed && !!g.JteCloud && hasCloudPref(); }
  function pending() { return restoring() || (st.mode === 'cloud' && st.cloudState !== 'ready'); }
  function skipMap() { var p = C.O.prefs; return p && p.pracSkipImport && typeof p.pracSkipImport === 'object' ? p.pracSkipImport : {}; }
  function setSkip(uid) {
    if (!C.O.prefs || typeof C.O.prefs !== 'object') C.O.prefs = {};
    if (!C.O.prefs.pracSkipImport || typeof C.O.prefs.pracSkipImport !== 'object') C.O.prefs.pracSkipImport = {};
    C.O.prefs.pracSkipImport[uid] = true; C.save();
  }
  function useLocal() { store = localStore(); st.seen = C.O.prac; st.data = M.pracClean(C.O.prac); st.cloudState = ''; }
  function mergeData(a, b) {
    var out = emptyData();
    ['items', 'logs', 'notes'].forEach(function (k) {
      var seen = {};
      a[k].concat(b[k]).forEach(function (x) { if (!seen[x.id]) { seen[x.id] = 1; out[k].push(x); } });
    });
    return out;
  }
  function askVisible() { return st.mode === 'ask' && !st.cloudOff && !!st.uid && !st.moving && !st.moveErr && localCount() > 0; }
  function importVisible() { return st.mode === 'cloud' && st.cloudState === 'ready' && !!st.uid && !skipMap()[st.uid] && !st.moving && !st.moveErr && localCount() > 0; }
  function enterCloud(uid) {
    var gen = st.gen, me = cloudStore(uid);
    store = me; st.mode = 'cloud'; st.cloudState = 'loading'; st.data = emptyData();
    st.ask = ''; st.lf = null; st.itf = null; st.nopen = '';
    render(true);
    me.load().then(function (d) {
      if (gen !== st.gen) return;
      st.data = d; st.cloudState = 'ready'; C.refresh();
    }, function () {
      if (gen !== st.gen) return;
      st.cloudState = 'error'; C.toast(T.loadFail); render(true);
    });
  }
  // 本機的全部放上雲端；全部成功才清掉本機，有失敗就停下來、本機不動
  function upload() {
    var uid = st.uid, gen = st.gen, local = M.pracClean(C.O.prac);
    function fail(code) { if (gen !== st.gen) return; try { console.warn('practice upload failed:', code); } catch (e) { /* 沒有 console */ } st.moving = ''; st.moveErr = T.upFail; st.focus = 'retry'; render(true); }
    if (!uid || !g.JteCloud) return;
    st.moving = 'up'; st.moveErr = ''; render(true);
    timed(function () { return g.JteCloud.pracUpload(local); }, 60000).then(function (r) {
      if (gen !== st.gen) return;
      if (!r || r.failed) { fail(r && r.codes && r.codes.length ? r.codes.join(', ') : 'error'); return; }
      delete C.O.prac; setPref(uid, 'cloud');
      st.moving = ''; st.moveErr = ''; st.focus = 'new';
      C.toast(T.uploaded); enterCloud(uid);
    }, function (e) { fail(errCode(e)); });
  }
  // 把雲端的搬回本機：先寫進本機，再刪雲端；刪不乾淨就留著提醒
  function toLocal() {
    var uid = st.uid, gen = st.gen;
    function stop() { if (gen !== st.gen) return; st.moving = ''; st.focus = 'tl'; C.toast(T.downFail); render(true); }
    function finish(left) {
      if (gen !== st.gen) return;
      useLocal(); st.mode = 'local'; st.moving = ''; st.wipeLeft = left; st.focus = left ? 'wr' : 'new';
      C.toast(left ? T.wipeLeft : T.downDone); C.refresh();
    }
    if (!uid || !g.JteCloud) return;
    st.moving = 'down'; st.ask = ''; st.moveErr = ''; render(true);
    timed(function () { return g.JteCloud.pracLoad(); }, 30000).then(function (d) {
      if (gen !== st.gen || st.uid !== uid) return; // 這段時間換了帳號：不把前一個人的雲端資料寫進這台裝置
      var m = mergeData(M.pracClean(d), M.pracClean(C.O.prac));
      C.O.prac = m; setPref(uid, 'local');
      return timed(function () { return g.JteCloud.pracWipe(); }, 60000).then(function () { finish(false); }, function () { finish(true); });
    }, stop);
  }
  function wipeAgain() {
    var uid = st.uid, gen = st.gen;
    if (!uid || !g.JteCloud) return;
    st.moving = 'down'; render(true);
    timed(function () { return g.JteCloud.pracWipe(); }, 60000).then(function () {
      if (gen !== st.gen) return;
      st.moving = ''; st.wipeLeft = false; st.focus = 'new'; C.toast(T.wipeDone); render(true);
    }, function () {
      if (gen !== st.gen) return;
      st.moving = ''; st.focus = 'wr'; C.toast(T.wipeLeft); render(true);
    });
  }
  function setUser(user) {
    st.user = user || null;
    if (!inited || C.DEMO) return;
    var uid = user ? user.uid : null, was = !!store && store.kind === 'cloud', gen, pref, first = !st.authed;
    st.authed = true;
    if (uid === st.uid) { if (first) C.refresh(); return; }
    st.uid = uid; st.gen++; gen = st.gen; st.cloudOff = false;
    st.moving = ''; st.moveErr = ''; st.wipeLeft = false; st.ask = ''; st.lf = null; st.itf = null; st.nopen = '';
    if (!uid) {
      if (was) { store = { kind: 'out' }; st.mode = 'out'; st.data = emptyData(); st.cloudState = ''; }
      else { useLocal(); st.mode = 'local'; }
      C.refresh();
      return;
    }
    useLocal(); st.mode = 'local';
    pref = prefs()[uid];
    if (pref) {
      if (M.pracMode(prefs(), uid, false) === 'cloud') enterCloud(uid); else C.refresh();
      return;
    }
    // 沒問過：先看雲端有沒有；查不到就當作本機，這次不問
    if (!g.JteCloud || !g.JteCloud.pracHas) { C.refresh(); return; }
    g.JteCloud.pracHas().then(function (has) {
      if (gen !== st.gen) return;
      var m = M.pracMode(prefs(), uid, has);
      if (m === 'cloud') { setPref(uid, 'cloud'); enterCloud(uid); }
      else { st.mode = m; C.refresh(); }
    }, function () {
      // 查不到（多半是雲端規則還沒開）：維持本機，這次不問，也不顯示放雲端的入口
      if (gen !== st.gen) return;
      st.cloudOff = true; C.refresh();
    });
    C.refresh();
  }

  // ── 畫面重畫時保留輸入內容與焦點 ──
  function roots() { return [box, quick, zone]; }
  function keyed() {
    var map = {};
    roots().forEach(function (r) { each(r.querySelectorAll('[data-k]'), function (el) { map[el.getAttribute('data-k')] = el; }); });
    return map;
  }
  function snapshot() {
    var s = { vals: {}, checked: {}, focus: '', sel: null }, map = keyed(), k, el, a = document.activeElement;
    for (k in map) {
      el = map[k];
      if (el.type === 'radio') s.checked[k] = el.checked;
      else if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') s.vals[k] = el.value;
    }
    if (a && a.getAttribute && a.getAttribute('data-k') && map[a.getAttribute('data-k')] === a) {
      s.focus = a.getAttribute('data-k');
      try { s.sel = [a.selectionStart, a.selectionEnd]; } catch (e) { s.sel = null; }
    }
    return s;
  }
  function restore(s) {
    var map = keyed(), k, el;
    for (k in s.vals) if (map[k] && map[k].value !== s.vals[k]) map[k].value = s.vals[k];
    for (k in s.checked) if (map[k]) map[k].checked = s.checked[k];
    if (st.focus) {
      el = map[st.focus]; st.focus = '';
      if (el && !isHidden(el)) { el.focus(); if (st.select && el.select) el.select(); }
      st.select = false;
      return;
    }
    if (s.focus && map[s.focus] && document.activeElement !== map[s.focus]) {
      el = map[s.focus];
      try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); }
      if (s.sel && s.sel[0] != null) try { el.setSelectionRange(s.sel[0], s.sel[1]); } catch (e2) { /* 不是文字欄位 */ }
    }
  }
  function isHidden(el) { return !el.offsetParent && el.getClientRects().length === 0; }

  // ── 共用元件 ──
  function lfKey() { var f = st.lf; return f ? 'lf-' + f.ctx + '-' + f.item + '-' + (f.log || '') : ''; }
  // 記一筆的小表單：數量（自動聚焦、帶上一筆的數量）、一句、日期、記下來
  function logForm() {
    var f = st.lf, it = itemById(f.item), lg = f.log ? logById(f.log) : null, key = lfKey();
    if (!it) return '';
    var amt = lg ? M.pracFmt(lg.amount) : lastAmount(it.id), date = lg ? lg.date : (f.date || C.TODAY), eid = 'pr-e-' + f.ctx;
    var h = '<form class="pr-log" data-form="log" novalidate' + cvars(it) + '>';
    h += '<div class="pr-lrow"><label class="pr-amt"><span class="pr-sr">' + fillH(T.amountFor, { u: it.unit }) + '</span>' +
      '<input class="in" name="amount" inputmode="decimal" autocomplete="off" enterkeyhint="done" maxlength="9" value="' + esc(amt) + '" aria-describedby="' + eid + '"' + fk(key + '-a') + '>' +
      '<span class="pr-unit" aria-hidden="true">' + esc(it.unit) + '</span></label>' +
      '<input class="in pr-lnote" name="note" maxlength="' + P.max.note + '" placeholder="' + esc(T.notePh) + '" aria-label="' + esc(T.notePh) + '" value="' + esc(lg ? lg.note : '') + '"' + fk(key + '-n') + '></div>';
    h += '<div class="pr-lrow">';
    if (f.ctx === 'day') h += '<input type="hidden" name="date" value="' + esc(date) + '">';
    else h += '<label class="pr-date"><span>' + esc(T.date) + '</span><input class="in" type="date" name="date" max="' + esc(C.TODAY) + '" value="' + esc(date) + '"' + fk(key + '-d') + '></label>';
    h += '<span class="pr-lbtn"><button class="btn fill" type="submit">' + esc(T.submit) + '</button><button class="lnk" type="button" data-pa="lcancel">' + esc(T.cancel) + '</button></span></div>';
    h += '<p class="pr-err" id="' + eid + '" role="alert"></p></form>';
    return h;
  }
  function itemForm(mode, it) {
    var v = it || st.itf || {}, key = 'if-' + mode, unit = v.unit || '', color = safeColor(v.color || P.colors[items().length % P.colors.length]);
    if (!P.colors.some(function (c) { return c.toLowerCase() === color.toLowerCase(); })) color = P.colors[0];
    var h = '<form class="pr-iform" data-form="item" data-mode="' + mode + '" novalidate>';
    h += '<label class="pr-f"><span>' + esc(T.name) + '</span><input class="in" name="name" maxlength="' + P.max.name + '" autocomplete="off" placeholder="' + esc(T.namePh) + '" value="' + esc(v.name || '') + '"' + fk(key + '-name') + '></label>';
    h += '<div class="pr-f"><span id="' + key + '-ul">' + esc(T.unit) + '</span><div class="pr-units"><div class="chips" role="group" aria-labelledby="' + key + '-ul">' +
      P.units.map(function (u) { var on = u === unit; return '<button type="button" class="chip' + (on ? ' on' : '') + '" data-pa="unit" data-u="' + esc(u) + '" aria-pressed="' + on + '">' + esc(u) + '</button>'; }).join('') +
      '</div><input class="in pr-uin" name="unit" maxlength="' + P.max.unit + '" autocomplete="off" placeholder="' + esc(T.unitPh) + '" aria-label="' + esc(T.unitOwn) + '" value="' + esc(unit) + '"' + fk(key + '-unit') + '></div></div>';
    h += '<div class="pr-f"><span id="' + key + '-cl">' + esc(T.color) + '</span><div class="pr-cols" role="radiogroup" aria-labelledby="' + key + '-cl">' +
      P.colors.map(function (c, i) { return '<label class="pr-col"><input type="radio" name="' + key + '-color" value="' + c + '"' + (c.toLowerCase() === color.toLowerCase() ? ' checked' : '') + fk(key + '-c' + i) + '><i style="background:' + c + '"></i><span class="pr-sr">' + esc(T.colorNames[i] || c) + '</span></label>'; }).join('') + '</div></div>';
    if (mode === 'edit') h += '<p class="note">' + esc(T.unitWarn) + '</p>';
    if (mode === 'new') h += '<div class="pr-ex"><span class="note">' + esc(T.examples) + '</span><div class="chips">' + P.examples.map(function (x, i) { return '<button type="button" class="chip" data-pa="ex" data-i="' + i + '">' + esc(x.name) + '・' + esc(x.unit) + '</button>'; }).join('') + '</div></div>';
    h += '<p class="pr-err" role="alert"></p><div class="row"><button class="btn fill" type="submit"' + fk(key + '-save') + '>' + esc(T.save) + '</button>' +
      (mode === 'new' ? '<button class="btn" type="button" data-pa="icancel">' + esc(T.cancel) + '</button>' : '') + '</div></form>';
    return h;
  }

  // ── 我的練習（練習空間） ──
  function cardHTML(it) {
    var last = M.pracLast(st.data.logs, it.id), t = M.pracTotals(st.data.logs, it.id, C.TODAY), on = st.lf && st.lf.ctx === 'card' && st.lf.item === it.id;
    var h = '<div class="pr-card' + (on ? ' on' : '') + (it.archived ? ' arch' : '') + '"' + cvars(it) + '>' +
      '<button class="pr-open" data-pa="open" data-id="' + esc(it.id) + '"' + fk('co-' + it.id) + '>' +
      '<span class="pr-name"><i class="pr-sw"></i>' + esc(it.name) + '</span>' +
      '<span class="pr-meta">' + esc(last ? fill(T.last, { d: M.dlabel(last) }) : T.never) + '</span>' +
      '<span class="pr-meta">' + esc(t.month.n ? fill(T.month, { n: t.month.n, s: M.pracFmt(t.month.sum), u: it.unit }) : T.monthNone) + '</span></button>';
    if (!it.archived) h += '<button class="btn sm pr-clog" data-pa="copen" data-id="' + esc(it.id) + '" aria-expanded="' + on + '" aria-label="' + fillH(T.logFor, { n: it.name }) + '"' + fk('cl-' + it.id) + '>' + esc(T.log) + '</button>';
    if (on) h += logForm();
    return h + '</div>';
  }
  // 登入後的提示卡：放到雲端、把這台的紀錄放進去、失敗重試
  function noticeHTML() {
    var h = '';
    if (C.DEMO || !st.uid) return '';
    if (st.moving) return '<p class="note pr-moving" role="status">' + esc(st.moving === 'up' ? T.upBusy : T.downBusy) + '</p>';
    if (st.moveErr) return '<div class="panel pr-ask"><p class="pr-err" role="alert">' + esc(st.moveErr) + '</p><div class="row"><button class="btn fill" data-pa="upretry"' + fk('retry') + '>' + esc(T.retry) + '</button><button class="btn" data-pa="upno"' + fk('upno') + '>' + esc(T.upNo) + '</button></div></div>';
    if (st.wipeLeft) return '<div class="panel pr-ask"><p>' + esc(T.wipeLeft) + '</p><div class="row"><button class="btn" data-pa="wiperetry"' + fk('wr') + '>' + esc(T.wipeRetry) + '</button></div></div>';
    if (askVisible()) h = '<div class="panel pr-ask"><p>' + esc(fill(T.cloudAsk, { n: localCount() })) + '</p><div class="row"><button class="btn fill" data-pa="askyes"' + fk('askyes') + '>' + esc(T.askYes) + '</button><button class="btn" data-pa="askno"' + fk('askno') + '>' + esc(T.askNo) + '</button></div></div>';
    else if (importVisible()) h = '<div class="panel pr-ask"><p>' + esc(fill(T.importAsk, { n: localCount() })) + '</p><div class="row"><button class="btn fill" data-pa="impyes"' + fk('impyes') + '>' + esc(T.importYes) + '</button><button class="btn" data-pa="impno"' + fk('impno') + '>' + esc(T.importNo) + '</button></div></div>';
    return h;
  }
  // 最下面一行小字：現在放哪裡、怎麼換
  function whereHTML() {
    if (C.DEMO || !st.uid || st.moving || st.moveErr || st.wipeLeft) return '';
    if (st.mode === 'cloud') {
      if (st.ask === 'tolocal') return '<div class="pr-where"><span class="note">' + esc(T.downAsk) + '</span><button class="btn sm fill" data-pa="tolocalyes"' + fk('tly') + '>' + esc(T.downYes) + '</button><button class="lnk" data-pa="nask" data-back="tl">' + esc(T.cancel) + '</button></div>';
      return '<p class="note pr-where">' + esc(T.whereCloud) + ' <button class="lnk" data-pa="tolocal"' + fk('tl') + '>' + esc(T.toLocal) + '</button></p>';
    }
    if (askVisible()) return '';
    if (st.cloudOff) return '';
    return '<p class="note pr-where">' + esc(T.whereLocal) + ' <button class="lnk" data-pa="tocloud"' + fk('tc') + '>' + esc(T.toCloud) + '</button></p>';
  }
  function renderBox() {
    var act = active(), arch = items().filter(function (x) { return x.archived; }), h = '';
    if (restoring()) { box.innerHTML = '<p class="note pr-moving" role="status">' + esc(T.loading) + '</p>'; return; }
    if (st.mode === 'out') {
      box.innerHTML = '<div class="panel pr-empty"><p>' + esc(T.needLogin) + '</p><div class="row"><button class="btn" data-pa="uselocal"' + fk('ul') + '>' + esc(T.useLocal) + '</button></div></div>';
      return;
    }
    if (pending()) {
      box.innerHTML = st.cloudState === 'error'
        ? '<div class="panel pr-empty"><p role="alert">' + esc(T.loadFail) + '</p><div class="row"><button class="btn" data-pa="cretry"' + fk('cretry') + '>' + esc(T.retry) + '</button></div></div>'
        : '<p class="note pr-moving" role="status">' + esc(T.loading) + '</p>';
      return;
    }
    if (!items().length && !st.itf) {
      h = '<div class="panel pr-empty"><p>' + esc(T.empty) + '</p><div class="pr-ex"><span class="note">' + esc(T.examples) + '</span><div class="chips">' +
        P.examples.map(function (x, i) { return '<button type="button" class="chip" data-pa="ex" data-i="' + i + '">' + esc(x.name) + '・' + esc(x.unit) + '</button>'; }).join('') +
        '</div></div><div class="row"><button class="btn fill" data-pa="new"' + fk('new') + '>' + esc(T.add) + '</button></div></div>';
      box.innerHTML = noticeHTML() + h + whereHTML(); return;
    }
    h = noticeHTML() + '<div class="pr-grid">' + act.map(cardHTML).join('');
    if (!st.itf) h += '<button class="pr-card pr-new" data-pa="new"' + fk('new') + '><span aria-hidden="true">＋</span> ' + esc(T.add) + '</button>';
    h += '</div>';
    if (st.itf) h += '<div class="panel pr-newf"><h3 class="pr-h3" id="pr-newh">' + esc(T.addTitle) + '</h3>' + itemForm('new') + '</div>';
    if (arch.length) h += '<details class="pr-arch"' + (st.archOpen ? ' open' : '') + '><summary' + fk('arch') + '>' + esc(fill(T.archivedN, { n: arch.length })) + '</summary><div class="pr-grid">' + arch.map(cardHTML).join('') + '</div></details>';
    box.innerHTML = h + whereHTML();
  }

  // ── 今天的快速鍵 ──
  function renderQuick() {
    var act = active();
    quick.hidden = !act.length || pending();
    if (!act.length || pending()) { quick.innerHTML = ''; return; }
    var openId = st.lf && st.lf.ctx === 'quick' ? st.lf.item : '';
    quick.innerHTML = '<div class="panel pr-quick"><div class="pr-qhead"><b>' + esc(T.quickTitle) + '</b><span class="note">' + esc(T.quickNote) + '</span><button class="lnk" data-pa="gopr">' + esc(T.quickGo) + '</button></div>' +
      '<div class="pr-pills">' + act.map(function (it) {
        var on = openId === it.id, ts = todaySum(it.id);
        return '<button class="pr-pill" data-pa="qopen" data-id="' + esc(it.id) + '" aria-expanded="' + on + '"' + cvars(it) + fk('qp-' + it.id) + '><i class="pr-sw"></i><b>' + esc(it.name) + '</b><span>' + esc(T.log) + '</span>' +
          (ts ? '<em>' + esc(fill(T.todayDid, { s: M.pracFmt(ts), u: it.unit })) + '</em>' : '') + '</button>';
      }).join('') + '</div>' + (openId ? logForm() : '') + '</div>';
  }

  // ── 專區 ──
  function renderZone() {
    var open = !!st.item;
    zone.hidden = !open; secPrac.hidden = open; rest.hidden = open;
    if (!open) { zone.innerHTML = ''; return; }
    var it = itemById(st.item);
    if (!it) {
      zone.innerHTML = '<div class="pr-zhead"><button class="lnk pr-back" data-pa="back"' + fk('back') + '><span aria-hidden="true">‹ </span>' + esc(T.back) + '</button></div><div class="panel"><p class="note">' + esc(pending() ? T.loading : T.notFound) + '</p></div>';
      return;
    }
    var zl = st.lf && st.lf.ctx === 'zone';
    var h = '<div class="pr-zhead"' + cvars(it) + '><button class="lnk pr-back" data-pa="back"' + fk('back') + '><span aria-hidden="true">‹ </span>' + esc(T.back) + '</button>' +
      '<div class="pr-zt"><i class="pr-sw"></i><h2 id="pr-zh" tabindex="-1"' + fk('zh') + '>' + esc(it.name) + '</h2><span class="note">' + esc(fill(T.unitIs, { u: it.unit })) + '</span>' +
      (it.archived ? '<span class="tag">' + esc(T.archivedTag) + '</span>' : '') + '</div>' +
      '<button class="btn fill" data-pa="zopen" aria-expanded="' + zl + '"' + fk('zl') + '>' + esc(T.log) + '</button></div>';
    if (zl) h += '<div class="panel pr-zlog">' + logForm() + '</div>';
    h += '<div class="pr-tabs" role="tablist" aria-label="' + esc(T.tabsLabel) + '">' + TABS.map(function (k) {
      var on = st.tab === k;
      return '<button role="tab" id="pr-tab-' + k + '" aria-controls="pr-tp" aria-selected="' + on + '" tabindex="' + (on ? 0 : -1) + '" data-pa="tab" data-t="' + k + '"' + fk('t-' + k) + '>' + esc(T.tabs[k]) + '</button>';
    }).join('') + '</div>';
    h += '<div class="panel pr-tp" id="pr-tp" role="tabpanel" tabindex="0" aria-labelledby="pr-tab-' + st.tab + '"' + cvars(it) + '>' +
      (st.tab === 'log' ? tabLog(it) : st.tab === 'insp' ? tabInsp(it) : st.tab === 'notes' ? tabNotes(it) : tabSet(it)) + '</div>';
    zone.innerHTML = h;
    if (st.tab === 'log') drawChart();
  }

  function tabLog(it) {
    var lg = st.data.logs, t = M.pracTotals(lg, it.id, C.TODAY), h = '';
    if (!t.all.n) h += '<p class="pr-invite">' + esc(T.noLogs) + '</p>';
    else h += '<div class="pr-stats">' +
      '<div class="pr-stat"><small>' + esc(T.thisMonth) + '</small><p><b>' + t.month.n + '</b> ' + esc(T.times) + '</p><span>' + esc(fill(T.total, { s: M.pracFmt(t.month.sum), u: it.unit })) + '</span></div>' +
      '<div class="pr-stat"><small>' + esc(T.allTime) + '</small><p><b>' + t.all.n + '</b> ' + esc(T.times) + '</p><span>' + esc(fill(T.total, { s: M.pracFmt(t.all.sum), u: it.unit })) + '<br>' + esc(fill(T.since, { d: slash(t.all.first) })) + '</span></div></div>';
    h += '<div' + (t.all.n ? ' class="pr-two"' : '') + '><div class="pr-blk">' + calHTML(it) + '</div>';
    if (t.all.n) {
      var wk = st.chart === 'week';
      h += '<div class="pr-blk"><div class="pr-chead"><h3 class="pr-h3">' + esc(T.trend) + '</h3><div class="chips" role="group" aria-label="' + esc(T.trend) + '">' +
        '<button class="chip' + (wk ? ' on' : '') + '" data-pa="chart" data-c="week" aria-pressed="' + wk + '"' + fk('cw') + '>' + esc(T.byWeek) + '</button>' +
        '<button class="chip' + (!wk ? ' on' : '') + '" data-pa="chart" data-c="month" aria-pressed="' + !wk + '"' + fk('cm') + '>' + esc(T.byMonth) + '</button></div></div>' +
        '<div class="pr-chart" id="pr-chart"></div><p class="note pr-cap">' + esc(fill(T.chartCap, { u: it.unit })) + '</p></div>';
    }
    return h + '</div>';
  }
  function nowYM() { var d = ymd(C.TODAY); return { y: d.y, m: d.m }; }
  function calHTML(it) {
    var mo = M.pracMonth(st.data.logs, it.id, st.calY, st.calM), cur = nowYM(), atNow = st.calY > cur.y || (st.calY === cur.y && st.calM >= cur.m), i, h;
    h = '<div class="pr-calnav"><button type="button" data-pa="cprev" aria-label="' + esc(T.prevMonth) + '"' + fk('cp') + '>‹</button>' +
      '<div><b>' + esc(fill(T.ym, { y: st.calY, m: st.calM })) + '</b><span class="note">' + esc(mo.n ? fill(T.monthSum, { n: mo.n, s: M.pracFmt(mo.sum), u: it.unit }) : T.monthEmpty) + '</span></div>' +
      '<button type="button" data-pa="cnext" aria-label="' + esc(T.nextMonth) + '"' + (atNow ? ' disabled' : '') + fk('cn') + '>›</button></div>';
    h += '<div class="pr-cal">' + T.wd.map(function (w) { return '<span class="pr-wd" aria-hidden="true">' + esc(w) + '</span>'; }).join('');
    for (i = 0; i < mo.lead; i++) h += '<span></span>';
    mo.days.forEach(function (d) {
      var fut = d.key > C.TODAY, today = d.key === C.TODAY, sel = st.day === d.key;
      var aria = fill(T.dayAria, { m: st.calM, d: d.d, x: d.n ? fill(T.dayHas, { n: d.n, s: M.pracFmt(d.sum), u: it.unit }) : T.dayNone }) + (today ? T.todayAria : '');
      h += '<button type="button" class="pr-day' + (d.n ? ' has' : '') + (today ? ' today' : '') + '" data-pa="day" data-d="' + d.key + '" aria-pressed="' + sel + '" aria-label="' + esc(aria) + '"' + (fut ? ' disabled' : '') + fk('d-' + d.key) + '>' +
        '<span>' + d.d + '</span>' + (d.n ? '<small>' + esc(M.pracFmt(d.sum)) + '</small>' : '') + '</button>';
    });
    h += '</div>';
    return h + dayHTML(it);
  }
  function dayHTML(it) {
    if (!st.day) return '<p class="note pr-pick">' + esc(T.pickDay) + '</p>';
    var rows = M.pracDayLogs(st.data.logs, it.id, st.day), adding = st.lf && st.lf.ctx === 'day';
    var h = '<div class="pr-dayd"><h3 class="pr-h3">' + esc(M.dlabel(st.day)) + '</h3>';
    if (!rows.length && !adding) h += '<p class="note">' + esc(T.dayEmpty) + '</p>';
    rows.forEach(function (l) {
      if (st.lf && st.lf.ctx === 'edit' && st.lf.log === l.id) { h += '<div class="pr-lg ed">' + logForm() + '</div>'; return; }
      var asking = st.ask === 'log:' + l.id;
      h += '<div class="pr-lg"><b>' + esc(M.pracFmt(l.amount)) + '<small> ' + esc(it.unit) + '</small></b><span class="pr-lgn">' + esc(l.note) + '</span>' +
        (asking ? '<span class="pr-lga"><span class="note">' + esc(T.delLogAsk) + '</span><button class="btn sm fill" data-pa="ldelyes" data-log="' + esc(l.id) + '"' + fk('ly-' + l.id) + '>' + esc(T.delYes) + '</button><button class="lnk" data-pa="nask" data-back="' + esc('ld-' + l.id) + '">' + esc(T.cancel) + '</button></span>'
          : '<span class="pr-lga"><button class="lnk" data-pa="ledit" data-log="' + esc(l.id) + '"' + fk('le-' + l.id) + '>' + esc(T.edit) + '</button><button class="lnk" data-pa="ldel" data-log="' + esc(l.id) + '"' + fk('ld-' + l.id) + '>' + esc(T.del) + '</button></span>') + '</div>';
    });
    if (adding) h += '<div class="pr-lg ed">' + logForm() + '</div>';
    else h += '<div class="row"><button class="btn sm" data-pa="dadd"' + fk('da') + '>' + esc(T.addOn) + '</button></div>';
    return h + '</div>';
  }

  // 長條圖：頁內 SVG，依容器實際寬度畫，文字不會被縮放到看不清楚
  function drawChart() {
    var el = $('#pr-chart'), it = itemById(st.item);
    if (!el || !it) return;
    var wk = st.chart === 'week', rows = wk ? M.pracWeeks(st.data.logs, it.id, C.TODAY, P.weeks) : M.pracMonths(st.data.logs, it.id, C.TODAY, P.months);
    var W = Math.max(260, Math.floor(el.clientWidth || 320)), H = 196, top = 24, bot = 30, padX = 4, n = rows.length;
    var slot = (W - padX * 2) / n, bw = Math.min(40, slot * 0.64), max = 0, color = safeColor(it.color), alt = [], h = '';
    var every = slot < 34 ? 2 : 1, fs = slot < 28 ? 10 : 11.5;
    rows.forEach(function (r) { if (r.sum > max) max = r.sum; });
    rows.forEach(function (r, i) {
      var cx = padX + slot * i + slot / 2, last = i === n - 1, lab, full, p;
      if (wk) { p = ymd(r.start); lab = last ? T.thisWeekShort : p.m + '/' + p.d; full = fill(T.weekOf, { d: M.dlabel(r.start) }); }
      else { p = r.ym.split('-').map(Number); lab = last ? T.thisMonthShort : fill(T.monthShort, { m: p[1] }); full = fill(T.monthOf, { y: p[0], m: p[1] }); }
      if (r.n) alt.push(fill(T.barAlt, { w: full, s: M.pracFmt(r.sum), u: it.unit }));
      if (r.n && max) {
        var bh = Math.max(3, (r.sum / max) * (H - top - bot)), y = H - bot - bh;
        h += '<g><title>' + esc(fill(T.barTip, { w: full, n: r.n, s: M.pracFmt(r.sum), u: it.unit })) + '</title>' +
          '<rect x="' + (cx - bw / 2).toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + bh.toFixed(1) + '" rx="' + Math.min(6, bw / 3).toFixed(1) + '" fill="' + color + '"/>' +
          '<text x="' + cx.toFixed(1) + '" y="' + (y - 6).toFixed(1) + '" text-anchor="middle" class="v" style="font-size:' + fs + 'px">' + esc(M.pracFmt(r.sum)) + '</text></g>';
      }
      if (last || (n - 1 - i) % every === 0) h += '<text x="' + cx.toFixed(1) + '" y="' + (H - 9) + '" text-anchor="middle" class="x' + (last ? ' now' : '') + '" style="font-size:' + fs + 'px">' + esc(lab) + '</text>';
    });
    if (!alt.length) { el.innerHTML = '<p class="note pr-cq">' + esc(T.chartNone) + '</p>'; return; }
    el.innerHTML = '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(fill(wk ? T.chartAltW : T.chartAltM, { c: n, list: alt.join(T.listSep) })) + '">' +
      '<line x1="0" x2="' + W + '" y1="' + (H - bot + 0.5) + '" y2="' + (H - bot + 0.5) + '" class="base"/>' + h + '</svg>';
  }

  function tabInsp(it) {
    var list = M.pracInsp(C.getInsp(), it.id);
    var h = '<form class="pr-iinsp" data-form="insp" novalidate><label class="note" for="pr-insp">' + fillH(T.inspLabel, { n: it.name }) + '</label>' +
      '<textarea class="pr-ta sm" id="pr-insp" name="text" maxlength="500"' + fk('insp-' + it.id) + '></textarea>' +
      '<div class="row"><button class="btn fill" type="submit">' + esc(T.inspKeep) + '</button><button class="btn" type="button" data-pa="photo">' + esc(T.inspPhoto) + '</button></div>' +
      '<p class="note">' + esc(T.inspNote) + '</p></form>';
    h += '<div class="pr-blk">' + (list.length ? list.map(function (x) {
      var ph = (x.photos || []).slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
      return '<div class="pr-insp"><small>' + esc(M.dlabel(x.key)) + '</small>' + (x.text ? '<p>' + esc(x.text) + '</p>' : '') +
        (ph.length ? '<div class="pr-thumbs">' + ph.filter(function (p) { return /^data:image\//.test(String(p.data || '')); }).map(function (p) { return '<figure><img src="' + esc(p.data) + '" alt="' + esc(p.caption || '') + '" loading="lazy">' + (p.caption ? '<figcaption>' + esc(p.caption) + '</figcaption>' : '') + '</figure>'; }).join('') + '</div>' : '') + '</div>';
    }).join('') : '<p class="note">' + esc(T.inspNone) + '</p>') + '</div>';
    return h;
  }

  function noteForm(n, isNew) {
    var key = 'nf-' + (isNew ? 'new' : n.id), asking = !isNew && st.ask === 'note:' + n.id;
    return '<form class="pr-nform" data-form="note" data-id="' + esc(isNew ? '' : n.id) + '" novalidate>' +
      '<label class="pr-f"><span>' + esc(T.noteTitle) + '</span><input class="in" name="title" maxlength="' + P.max.title + '" placeholder="' + esc(T.noteTitlePh) + '" value="' + esc(isNew ? '' : n.title) + '"' + fk(key + '-t') + '></label>' +
      '<label class="pr-f"><span>' + esc(T.noteBody) + '</span><textarea class="pr-ta" name="body" maxlength="' + P.max.body + '"' + fk(key + '-b') + '>' + esc(isNew ? '' : n.body) + '</textarea></label>' +
      '<p class="pr-err" role="alert"></p><div class="row"><button class="btn fill" type="submit">' + esc(T.save) + '</button><button class="btn" type="button" data-pa="nclose">' + esc(T.noteClose) + '</button>' +
      (isNew ? '' : asking ? '<span class="note">' + esc(T.noteDelAsk) + '</span><button class="btn sm fill" type="button" data-pa="ndelyes"' + fk('ny-' + n.id) + '>' + esc(T.delYes) + '</button><button class="lnk" type="button" data-pa="nask" data-back="' + esc('nd-' + n.id) + '">' + esc(T.cancel) + '</button>'
        : '<button class="lnk" type="button" data-pa="ndel"' + fk('nd-' + n.id) + '>' + esc(T.noteDel) + '</button>') + '</div></form>';
  }
  function tabNotes(it) {
    var list = st.data.notes.filter(function (n) { return n.itemId === it.id; }).sort(function (a, b) { return (b.updatedAt || 0) - (a.updatedAt || 0); });
    var h = st.nopen === 'new' ? '<div class="pr-nnew">' + noteForm(null, true) + '</div>' : '<div class="row"><button class="btn sm fill" data-pa="nnew"' + fk('nn') + '>' + esc(T.notesNew) + '</button></div>';
    if (!list.length && st.nopen !== 'new') h += '<p class="note pr-gap">' + esc(T.notesNone) + '</p>';
    h += '<div class="pr-notes">' + list.map(function (n) {
      var on = st.nopen === n.id, d = n.updatedAt ? M.keyOf(new Date(n.updatedAt)) : '';
      return '<div class="pr-note' + (on ? ' on' : '') + '"><button class="pr-nrow" data-pa="nopen" data-id="' + esc(n.id) + '" aria-expanded="' + on + '"' + fk('no-' + n.id) + '><b>' + esc(n.title) + '</b>' +
        (d ? '<span>' + esc(fill(T.updated, { d: M.dlabel(d) })) + '</span>' : '') + '</button>' + (on ? noteForm(n, false) : '') + '</div>';
    }).join('') + '</div>';
    return h;
  }

  function tabSet(it) {
    var nl = st.data.logs.filter(function (l) { return l.itemId === it.id; }).length, nn = st.data.notes.filter(function (n) { return n.itemId === it.id; }).length;
    var h = '<h3 class="pr-h3">' + esc(T.setTitle) + '</h3>' + itemForm('edit', it);
    h += '<div class="pr-blk"><p class="note">' + esc(T.archiveNote) + '</p><div class="row pr-gap"><button class="btn sm" data-pa="arch"' + fk('ar') + '>' + esc(it.archived ? T.unarchive : T.archive) + '</button></div></div>';
    h += '<div class="pr-blk">' + (st.ask === 'item' ? '<p class="pr-warn">' + esc(fill(T.delItemAsk, { n: it.name, l: nl, k: nn })) + '</p><div class="row pr-gap"><button class="btn sm fill" data-pa="idelyes"' + fk('iy') + '>' + esc(T.delYes) + '</button><button class="lnk" data-pa="nask" data-back="idel">' + esc(T.cancel) + '</button></div>'
      : '<button class="lnk pr-danger" data-pa="idel"' + fk('idel') + '>' + esc(T.delItem) + '</button>') + '</div>';
    return h;
  }

  // ── 動作 ──
  function setErr(form, msg, field) {
    var e = form.querySelector('.pr-err');
    if (e) e.textContent = msg;
    var f = field && form.elements[field];
    if (f) { f.setAttribute('aria-invalid', 'true'); f.focus(); }
  }
  function run(form, p, ok) {
    st.busy = true;
    var btns = form ? form.querySelectorAll('button') : [];
    each(btns, function (b) { b.disabled = true; });
    p.then(function (r) { st.busy = false; ok(r); }, function (e) {
      st.busy = false; each(btns, function (b) { b.disabled = false; });
      if (e && e.message === 'stale') return; // 這段時間換了帳號，結果不算
      C.toast(T.fail);
      if (form) setErr(form, T.fail);
    });
  }
  function openLog(ctx, itemId, extra, back) {
    var f = { ctx: ctx, item: itemId, back: back };
    if (extra) { f.log = extra.log || ''; f.date = extra.date || ''; }
    if (!f.log) f.nid = M.pracId('pl-');
    st.lf = f; st.focus = lfKey() + '-a'; st.select = true; st.ask = '';
  }
  function closeLog() { var b = st.lf && st.lf.back; st.lf = null; if (b) st.focus = b; }
  function submitLog(form) {
    var f = st.lf, it = f && itemById(f.item);
    if (!it) return;
    var old = f.log ? logById(f.log) : null, el = form.elements;
    var r = M.pracLogCheck({ date: el.date.value, amount: el.amount.value, note: el.note.value }, C.TODAY, P.max);
    if (!r.ok) { setErr(form, P.err[r.err], r.err === 'future' || r.err === 'date' ? (el.date.type === 'hidden' ? '' : 'date') : r.err === 'note' ? 'note' : 'amount'); return; }
    var lg = { id: old ? old.id : (f.nid || (f.nid = M.pracId('pl-'))), itemId: it.id, date: r.log.date, amount: r.log.amount, note: r.log.note, at: old ? (old.at || Date.now()) : Date.now() };
    run(form, store.putLog(lg), function () {
      upsert(st.data.logs, lg);
      var msg = lg.date === C.TODAY ? fill(T.logged, { n: it.name, a: M.pracFmt(lg.amount), u: it.unit }) : fill(T.loggedOn, { d: M.dlabel(lg.date), n: it.name, a: M.pracFmt(lg.amount), u: it.unit });
      if (f.ctx === 'zone' || f.ctx === 'day' || f.ctx === 'edit') { var d = ymd(lg.date); st.calY = d.y; st.calM = d.m; st.day = lg.date; }
      closeLog();
      if (f.ctx === 'edit') st.focus = 'le-' + lg.id;
      if (f.ctx === 'day') st.focus = 'da';
      C.toast(msg); announce(msg); render(true);
    });
  }
  function submitItem(form) {
    var mode = form.getAttribute('data-mode'), el = form.elements, col = form.querySelector('input[type=radio]:checked');
    var r = M.pracItemCheck({ name: el.name.value, unit: el.unit.value, color: col ? col.value : '' }, P.max);
    if (!r.ok) { setErr(form, P.err[r.err], r.err); return; }
    var it;
    if (mode === 'new') it = { id: (st.itf && st.itf.id) || M.pracId('pi-'), name: r.item.name, unit: r.item.unit, color: safeColor(r.item.color), archived: false, createdAt: Date.now() };
    else { it = copy(itemById(st.item)); it.name = r.item.name; it.unit = r.item.unit; it.color = safeColor(r.item.color); }
    run(form, store.putItem(it), function () {
      upsert(st.data.items, it);
      if (mode === 'new') { st.itf = null; st.focus = 'cl-' + it.id; C.toast(fill(T.added, { n: it.name })); }
      else C.toast(T.saved);
      render(true);
    });
  }
  function submitNote(form) {
    var id = form.getAttribute('data-id'), el = form.elements, old = id ? noteById(id) : null;
    var r = M.pracNoteCheck({ title: el.title.value, body: el.body.value }, P.max);
    if (!r.ok) { setErr(form, P.err[r.err], r.err); return; }
    var n = { id: old ? old.id : (st.nnid || (st.nnid = M.pracId('pn-'))), itemId: st.item, title: r.note.title, body: r.note.body, updatedAt: Date.now() };
    run(form, store.putNote(n), function () { upsert(st.data.notes, n); st.nopen = ''; st.focus = 'no-' + n.id; C.toast(T.saved); render(true); });
  }
  function submitInsp(form) {
    var ta = form.elements.text, v = ta.value.replace(/^\s+|\s+$/g, '');
    if (!v) { ta.focus(); return; }
    ta.value = '';
    st.focus = 'insp-' + st.item;
    C.addMemo(v, st.item);
    C.toast(T.inspKept); announce(T.inspKept);
  }

  function onSubmit(e) {
    var form = e.target.closest('form[data-form]');
    if (!form) return;
    e.preventDefault();
    if (busy()) return;
    var k = form.getAttribute('data-form');
    if (k === 'log') submitLog(form);
    else if (k === 'item') submitItem(form);
    else if (k === 'note') submitNote(form);
    else if (k === 'insp') submitInsp(form);
  }
  function onClick(e) {
    var b = e.target.closest('[data-pa]');
    if (!b || busy()) return;
    var a = b.getAttribute('data-pa'), id = b.getAttribute('data-id') || '', it = st.item ? itemById(st.item) : null, form, x;
    switch (a) {
      case 'open': C.goPane('practice-item-' + id); return;
      case 'back': st.backTo = st.item; C.goPane('practice'); return;
      case 'gopr': C.goPane('practice'); return;
      case 'askyes': case 'impyes': case 'upretry': case 'tocloud': upload(); return;
      case 'upno': st.moveErr = ''; if (st.mode === 'ask') st.mode = 'local'; st.focus = 'new'; break;
      case 'askno': if (!st.uid) return; setPref(st.uid, 'local'); st.mode = 'local'; st.focus = 'new'; break;
      case 'impno': if (!st.uid) return; setSkip(st.uid); st.focus = 'new'; break;
      case 'tolocal': st.ask = 'tolocal'; st.focus = 'tly'; break;
      case 'tolocalyes': toLocal(); return;
      case 'wiperetry': wipeAgain(); return;
      case 'cretry': if (st.uid) enterCloud(st.uid); return;
      case 'uselocal': useLocal(); st.mode = 'local'; st.focus = 'new'; break;
      case 'new': st.itf = newItf('', ''); st.lf = null; st.focus = 'if-new-name'; break;
      case 'ex':
        x = P.examples[+b.getAttribute('data-i')];
        if (!x) return;
        form = b.closest('form');
        if (form) { form.elements.name.value = x.name; form.elements.unit.value = x.unit; syncUnits(form); return; }
        st.itf = newItf(x.name, x.unit); st.focus = 'if-new-save'; break;
      case 'icancel': st.itf = null; st.focus = 'new'; break;
      case 'unit':
        form = b.closest('form');
        form.elements.unit.value = b.getAttribute('data-u'); syncUnits(form); return;
      case 'qopen': if (st.lf && st.lf.ctx === 'quick' && st.lf.item === id) closeLog(); else openLog('quick', id, null, 'qp-' + id); break;
      case 'copen': if (st.lf && st.lf.ctx === 'card' && st.lf.item === id) closeLog(); else openLog('card', id, null, 'cl-' + id); break;
      case 'zopen': if (st.lf && st.lf.ctx === 'zone') closeLog(); else openLog('zone', st.item, null, 'zl'); break;
      case 'dadd': openLog('day', st.item, { date: st.day }, 'da'); break;
      case 'ledit': openLog('edit', st.item, { log: b.getAttribute('data-log') }, 'le-' + b.getAttribute('data-log')); break;
      case 'lcancel': closeLog(); break;
      case 'ldel': st.ask = 'log:' + b.getAttribute('data-log'); st.lf = null; st.focus = 'ly-' + b.getAttribute('data-log'); break;
      case 'nask': st.ask = ''; st.focus = b.getAttribute('data-back') || ''; break;
      case 'ldelyes':
        x = b.getAttribute('data-log');
        run(null, store.delLog(x), function () { st.data.logs = drop(st.data.logs, x); st.ask = ''; st.focus = 'da'; C.toast(T.deleted); announce(T.deleted); render(true); });
        return;
      case 'tab': setTab(b.getAttribute('data-t'), true); return;
      case 'cprev': if (--st.calM < 1) { st.calM = 12; st.calY--; } monthMoved(); st.focus = 'cp'; break;
      case 'cnext': if (++st.calM > 12) { st.calM = 1; st.calY++; } monthMoved(); st.focus = 'cn'; break;
      case 'day': st.day = st.day === b.getAttribute('data-d') ? '' : b.getAttribute('data-d'); if (st.lf && (st.lf.ctx === 'day' || st.lf.ctx === 'edit')) st.lf = null; st.ask = ''; break;
      case 'chart': st.chart = b.getAttribute('data-c'); st.focus = st.chart === 'week' ? 'cw' : 'cm'; break;
      case 'photo': if (it) C.startPhoto(it.id); return;
      case 'nnew': st.nopen = 'new'; st.nnid = M.pracId('pn-'); st.ask = ''; st.focus = 'nf-new-t'; break;
      case 'nopen': if (st.nopen === id) { st.nopen = ''; st.focus = 'no-' + id; } else { st.nopen = id; st.focus = 'nf-' + id + '-b'; } st.ask = ''; break;
      case 'nclose': x = st.nopen; st.nopen = ''; st.ask = ''; st.focus = x && x !== 'new' ? 'no-' + x : 'nn'; break;
      case 'ndel': st.ask = 'note:' + st.nopen; st.focus = 'ny-' + st.nopen; break;
      case 'ndelyes':
        x = st.nopen;
        run(null, store.delNote(x), function () { st.data.notes = drop(st.data.notes, x); st.nopen = ''; st.ask = ''; st.focus = 'nn'; C.toast(T.deleted); render(true); });
        return;
      case 'arch':
        if (!it) return;
        x = copy(it); x.archived = !it.archived;
        run(null, store.putItem(x), function () { upsert(st.data.items, x); st.focus = 'ar'; C.toast(x.archived ? T.archivedDone : T.unarchivedDone); render(true); });
        return;
      case 'idel': st.ask = 'item'; st.focus = 'iy'; break;
      case 'idelyes':
        if (!it) return;
        x = it.id;
        run(null, store.delItem(x), function () {
          st.data = M.pracRemoveItem(st.data, x);
          // 屬於這個項目的心得靈感留著，只拿掉標記
          C.O.memos = M.pracUnmark(C.O.memos, x); C.save();
          if (C.unmarkInsp) C.unmarkInsp(x);
          st.ask = ''; st.lf = null; st.backTo = ''; st.focus = 'new'; C.toast(T.deleted); C.goPane('practice'); C.refresh();
        });
        return;
      default: return;
    }
    render(true);
  }
  function monthMoved() { st.day = ''; st.ask = ''; if (st.lf && (st.lf.ctx === 'day' || st.lf.ctx === 'edit')) st.lf = null; }
  function syncUnits(form) {
    var v = form.elements.unit.value;
    each(form.querySelectorAll('[data-pa=unit]'), function (c) { var on = c.getAttribute('data-u') === v; c.classList.toggle('on', on); c.setAttribute('aria-pressed', String(on)); });
  }
  function setTab(k, focus) {
    if (TABS.indexOf(k) < 0) return;
    st.tab = k; st.ask = ''; st.nopen = '';
    if (st.lf && st.lf.ctx !== 'zone') st.lf = null;
    if (focus) st.focus = 't-' + k;
    render(true);
  }
  function onKey(e) {
    var t = e.target;
    if (t.getAttribute && t.getAttribute('role') === 'tab') {
      var i = TABS.indexOf(st.tab), n = -1;
      if (e.key === 'ArrowRight') n = (i + 1) % TABS.length;
      else if (e.key === 'ArrowLeft') n = (i + TABS.length - 1) % TABS.length;
      else if (e.key === 'Home') n = 0;
      else if (e.key === 'End') n = TABS.length - 1;
      if (n > -1) { e.preventDefault(); setTab(TABS[n], true); }
      return;
    }
    if (e.key === 'Escape' && st.lf && t.closest && t.closest('form[data-form=log]')) { e.preventDefault(); closeLog(); render(true); }
  }
  function onInput(e) {
    var t = e.target;
    if (t.getAttribute('aria-invalid')) t.removeAttribute('aria-invalid');
    if (t.name === 'unit' && t.form) syncUnits(t.form);
  }

  // ── 對外介面 ──
  // 輸入欄位正被使用時，不整個重畫那一區（會斷掉輸入法組字、清掉錯誤訊息與選取）；
  // 自己的動作（送出、取消、切分頁…）傳 force 一定重畫。
  function focusIn(root) { var a = document.activeElement; return !!(a && a !== root && root.contains(a) && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)); }
  function render(force) {
    if (!inited) return;
    syncLocal();
    if (st.lf && !itemById(st.lf.item)) st.lf = null;
    if (st.lf && st.lf.ctx === 'edit' && !logById(st.lf.log)) st.lf = null;
    var s = snapshot(), arch = box.querySelector('details.pr-arch');
    if (arch) st.archOpen = arch.open;
    function go(name, root, fn) {
      if (!force && focusIn(root)) { dirty[name] = true; return; }
      dirty[name] = false; fn();
    }
    go('box', box, renderBox); go('quick', quick, renderQuick); go('zone', zone, renderZone);
    restore(s);
  }
  function onFocusOut(e) {
    var root = e.currentTarget;
    if (e.relatedTarget && root.contains(e.relatedTarget)) return;
    setTimeout(function () { if ((dirty.box || dirty.quick || dirty.zone) && !focusIn(root)) render(); }, 300);
  }
  function handleHash(h) {
    var r = M.route(h), id = r.item || '';
    if (id) {
      if (st.item === id && !zone.hidden) return true;
      var cur = nowYM();
      st.item = id; st.tab = 'log'; st.day = ''; st.ask = ''; st.nopen = ''; st.calY = cur.y; st.calM = cur.m;
      if (st.lf && st.lf.ctx !== 'quick') st.lf = null;
      st.focus = 'zh';
      render(true);
      return true;
    }
    if (st.item || !zone.hidden) {
      var was = st.backTo; st.item = ''; st.backTo = ''; st.ask = ''; st.nopen = '';
      if (st.lf && st.lf.ctx !== 'quick' && st.lf.ctx !== 'card') st.lf = null;
      if (was && r.pane === 'practice') st.focus = 'co-' + was;
      render(true);
    }
    return false;
  }
  function init(ctx) {
    if (inited) return;
    C = ctx; D = ctx.D; M = ctx.M; P = D.prac; T = P.t; esc = M.esc;
    box = $('#pracbox'); quick = $('#pracquick'); zone = $('#praczone'); secPrac = $('#sec-prac'); rest = $('#pracrest');
    var hh = $('#h-prac'), pn = $('#pracnote'), ey = $('#sec-prac .eyebrow');
    if (hh) hh.textContent = T.title;
    if (pn) pn.textContent = T.note;
    if (ey) ey.textContent = T.eyebrow;
    live = document.createElement('div'); live.className = 'pr-sr'; live.setAttribute('aria-live', 'polite'); document.body.appendChild(live);
    if (C.DEMO) {
      store = demoStore(); st.data = demoData();
      P.demo.memos.forEach(function (x, i) { C.O.memos.push({ id: 'm-demo-p' + i, key: M.addDays(C.TODAY, -x.days), text: x.text, itemId: x.itemId }); });
    } else { store = localStore(); st.seen = C.O.prac; st.data = M.pracClean(C.O.prac); }
    var cur = nowYM(); st.calY = cur.y; st.calM = cur.m;
    [box, quick, zone].forEach(function (r) {
      r.addEventListener('click', onClick); r.addEventListener('submit', onSubmit);
      r.addEventListener('keydown', onKey); r.addEventListener('input', onInput); r.addEventListener('focusout', onFocusOut);
    });
    var tm = null;
    window.addEventListener('resize', function () { clearTimeout(tm); tm = setTimeout(function () { if (st.item && st.tab === 'log' && !zone.hidden) drawChart(); }, 150); });
    inited = true;
  }
  function exportData() {
    return { items: st.data.items.map(copy), logs: st.data.logs.map(copy), notes: st.data.notes.map(copy) };
  }

  // 給 index.html 的靈感框、足跡、資料說明用
  function activeItems() { return active().map(function (x) { return { id: x.id, name: x.name }; }); }
  function itemName(id) { var it = id ? itemById(id) : null; return it ? it.name : ''; }
  function mode() { return store && store.kind === 'cloud' ? 'cloud' : store && store.kind === 'out' ? 'out' : 'local'; }

  g.JtePrac = { init: init, render: render, setUser: setUser, handleHash: handleHash, exportData: exportData,
    items: activeItems, itemName: itemName, mode: mode, pending: pending };
})(window);
