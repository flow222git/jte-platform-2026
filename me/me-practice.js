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
    lf: null, itf: null, nopen: '', wf: '', wn: 0, ai: null, rc: '', want: '', ask: '', busy: false, focus: '', select: false, user: null,
    mode: 'local', uid: null, gen: 0, cloudState: '', moving: '', moveErr: '', wipeLeft: false, cloudOff: false, authed: false, nnid: '' };
  var dirty = { box: false, quick: false, zone: false };
  var TABS = ['log', 'write', 'set'];

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
  // 項目前面那個記號：挑了圖示就畫圖示，沒有就是原本的色點。
  function iconOf(it) { var k = M.pracIcon(it && it.icon); k = (P.iconAlias || {})[k] || k; return k && P.icons.some(function (x) { return x.k === k; }) ? k : ''; }
  function iconSrc(k) { return 'doodles/' + k + '.webp'; }
  function sw(it) { var k = iconOf(it) || iconOf(itemById(parentId(it))); return k ? '<img class="pr-ico" src="' + iconSrc(k) + '" alt="" width="40" height="40">' : '<i class="pr-sw"></i>'; }
  // 圖示照類別排；沒被分到類別的收在最後
  function iconGroups() {
    var by = {}, used = {}, out;
    P.icons.forEach(function (x) { by[x.k] = x; });
    out = (P.iconGroups || []).map(function (gp) { return { n: gp.n, list: gp.ks.filter(function (k) { return by[k] && !used[k]; }).map(function (k) { used[k] = 1; return by[k]; }) }; });
    var rest2 = P.icons.filter(function (x) { return !used[x.k]; });
    if (rest2.length) out.push({ n: P.iconOther, list: rest2 });
    return out.filter(function (gp) { return gp.list.length; });
  }
  function cvars(it) { var c = safeColor((itemById(parentId(it)) || it).color); return ' style="--pc:' + c + ';--pt:' + tint(c, 0.16) + ';--pt2:' + tint(c, 0.32) + '"'; }
  function busy() { return st.busy || !!st.moving; }
  function announce(t) { if (live) { live.textContent = ''; setTimeout(function () { live.textContent = t; }, 30); } }

  // ── 資料 ──
  function items() { return st.data.items; }
  function itemById(id) { return items().filter(function (x) { return x.id === id; })[0] || null; }
  function logById(id) { return st.data.logs.filter(function (x) { return x.id === id; })[0] || null; }
  function noteById(id) { return st.data.notes.filter(function (x) { return x.id === id; })[0] || null; }
  function active() { return items().filter(function (x) { return !x.archived; }); }
  // 大項目與小項目
  function parentId(it) { return it ? M.pracParent(items(), it) : ''; }
  function kidsOf(id) { return M.pracKids(items(), id).filter(function (x) { return !x.archived; }); }
  function fullName(it) { var p = itemById(parentId(it)); return p ? p.name + '・' + it.name : it.name; }
  function famIds(it) { return parentId(it) ? [it.id] : [it.id].concat(kidsOf(it.id).map(function (x) { return x.id; })); }
  // 大項目後面緊跟它的小項目
  function ordered(list) {
    var out = [], used = {};
    list.forEach(function (x) {
      if (parentId(x)) return;
      out.push(x); used[x.id] = 1;
      list.forEach(function (k) { if (parentId(k) === x.id) { out.push(k); used[k.id] = 1; } });
    });
    list.forEach(function (x) { if (!used[x.id]) out.push(x); });
    return out;
  }
  function topLevel(list) { return list.filter(function (x) { var p = itemById(parentId(x)); return !p || p.archived !== x.archived; }); }
  function upsert(list, obj) {
    for (var i = 0; i < list.length; i++) if (list[i].id === obj.id) { list[i] = obj; return; }
    list.push(obj);
  }
  function drop(list, id) { return list.filter(function (x) { return x.id !== id; }); }
  function lastLogOf(itemId) {
    var best = null;
    st.data.logs.forEach(function (l) {
      if (l.itemId !== itemId) return;
      if (!best || l.date > best.date || (l.date === best.date && (l.at || 0) > (best.at || 0))) best = l;
    });
    return best;
  }
  function lastAmount(itemId) { var b = lastLogOf(itemId); return b ? M.pracFmt(b.amount) : ''; }
  // ── 一個項目可以有不只一種單位（2026-11-27）──
  // 主要單位在項目上（unit）；另外加的存在這台裝置（prefs.pracUnits）；每一筆記下它用的單位（和主要單位一樣就不另外記）。
  function extraUnits(it) { var p = C.O.prefs && C.O.prefs.pracUnits, a = p && typeof p === 'object' && it ? p[it.id] : null; return Array.isArray(a) ? a : []; }
  function unitsOf(it) { return M.pracUnits(it.unit, extraUnits(it), st.data.logs, it.id); }
  function luOf(l) { var it = itemById(l.itemId); return l.unit || (it ? it.unit : ''); }
  // 這個項目的紀錄實際用了哪些單位（各幾次、各合計多少）
  function logUnits(it) { return M.pracRollup(st.data.logs, items(), [it.id]).units; }
  // 紀錄只有一種單位時，合計用它來寫（可能不是主要單位）
  function uo(it) { var u = logUnits(it); return u.length === 1 ? u[0].unit : it.unit; }
  // 主要單位換了之後，另外加的清單裡不留同一個
  function tidyUnits(it) { var a = extraUnits(it), b = a.filter(function (u) { return u !== it.unit; }); if (b.length !== a.length) setOwn('pracUnits', it.id, b.length ? b : ''); }
  function todayText(itemId) {
    var by = {}, ord = [], it = itemById(itemId);
    st.data.logs.forEach(function (l) {
      if (l.itemId !== itemId || l.date !== C.TODAY) return;
      var u = l.unit || (it ? it.unit : '');
      if (!by[u]) { by[u] = { unit: u, sum: 0 }; ord.push(u); }
      by[u].sum += Number(l.amount) || 0;
    });
    return ord.length ? fill(T.todayMix, { s: unitsText(ord.map(function (u) { return { unit: u, sum: Math.round(by[u].sum * 10) / 10 }; })) }) : '';
  }
  function monthText(it) {
    var ru = M.pracRollup(st.data.logs, items(), [it.id], C.TODAY.slice(0, 7));
    if (!ru.n) return T.monthNone;
    return ru.units.length > 1 ? fill(T.monthMix, { n: ru.n, s: unitsText(ru.units) }) : fill(T.month, { n: ru.n, s: M.pracFmt(ru.units[0].sum), u: ru.units[0].unit });
  }
  // 記一筆時選這次的單位：全部並排成按鈕（下拉選單一次只看得到一個，會以為沒得選）
  function unitPick(name, us, lu, key, label) {
    return '<span class="chips pr-ups" role="group" aria-label="' + esc(label) + '" data-ug="1"><input type="hidden" name="' + esc(name) + '" value="' + esc(lu) + '"' + fk(key) + '>' +
      us.map(function (u) { var on = u === lu; return '<button type="button" class="chip' + (on ? ' on' : '') + '" data-pa="lunit" data-v="' + esc(u) + '" aria-pressed="' + on + '">' + esc(u) + '</button>'; }).join('') + '</span>';
  }
  function syncUps(g) {
    var inp = g.querySelector('input[type=hidden]'), v = inp ? inp.value : '';
    each(g.querySelectorAll('[data-pa=lunit]'), function (c) { var on = c.getAttribute('data-v') === v; c.classList.toggle('on', on); c.setAttribute('aria-pressed', String(on)); });
  }
  // 加單位的小編輯區：常用單位點了就加、再點拿掉；也可以自己填。改了馬上存。
  function uxHTML(it, where) {
    var all = unitsOf(it), cand = [], hid = 'pr-ux-' + where + '-' + it.id;
    P.units.concat(all).forEach(function (u) { if (u !== it.unit && cand.indexOf(u) < 0) cand.push(u); });
    return '<div class="pr-ux"><b id="' + esc(hid) + '">' + esc(fill(T.uxTitle, { n: it.name })) + '</b><p class="note">' + esc(T.uxNote) + '</p><div class="chips" role="group" aria-labelledby="' + esc(hid) + '">' +
      cand.map(function (u) { var on = all.indexOf(u) > -1; return '<button type="button" class="chip' + (on ? ' on' : '') + '" data-pa="uxt" data-id="' + esc(it.id) + '" data-u="' + esc(u) + '" aria-pressed="' + on + '"' + fk('ux-' + where + '-' + it.id + '-' + u) + '>' + esc(u) + '</button>'; }).join('') +
      '</div><div class="pr-uxrow"><input class="in pr-uxin" maxlength="' + P.max.unit + '" autocomplete="off" placeholder="' + esc(T.uxOwn) + '" aria-label="' + esc(T.uxOwn) + '"' + fk('uxi-' + where + '-' + it.id) + '>' +
      '<button type="button" class="btn sm" data-pa="uxadd" data-id="' + esc(it.id) + '"' + fk('uxa-' + where + '-' + it.id) + '>' + esc(T.uxOwnAdd) + '</button>' +
      (where === 'q' ? '<button type="button" class="lnk" data-pa="uxdone" data-id="' + esc(it.id) + '">' + esc(T.uxDone) + '</button>' : '') + '</div></div>';
  }
  function newItf(name, unit) { return { name: name, unit: unit, id: M.pracId('pi-') }; }
  // ── 各種練習的預設，與記一筆時多問的那一欄（書名、展名、菜名…）──
  // 那一欄叫什麼：本人在設定裡改過的優先（存在這台裝置的 prefs.pracAsk），其次是名稱對到的預設。有小項目的大項目不問。
  function kindOf(it) { return it ? M.pracKind(it.name, P.kinds) : null; }
  // 新項目的圖示：名稱配得到就用配到的，配不到用預設那一種的
  function iconFor(name) { var k = M.pracKind(name, P.kinds); return M.pracGuessIcon(name, P.icons) || (k && k.icon) || ''; }
  function askOwn(it) { var p = C.O.prefs && C.O.prefs.pracAsk; return p && typeof p === 'object' && typeof p[it.id] === 'string' ? p[it.id] : ''; }
  function askOf(it) {
    if (!it || !it.id || (!parentId(it) && kidsOf(it.id).length)) return '';
    return M.pracAsk(askOwn(it), kindOf(it), st.data.logs.some(function (l) { return l.itemId === it.id && l.what; }), T.whatAny);
  }
  // 本人對某個項目的調整（多問哪一欄、寫一段的提示）存在這台裝置：prefs.pracAsk、prefs.pracHint
  function setOwn(key, id, v) {
    if (!C.O.prefs || typeof C.O.prefs !== 'object') C.O.prefs = {};
    if (!C.O.prefs[key] || typeof C.O.prefs[key] !== 'object') C.O.prefs[key] = {};
    if (v) C.O.prefs[key][id] = v; else delete C.O.prefs[key][id];
    C.save();
  }
  function setAsk(id, v) { setOwn('pracAsk', id, v); }
  // 「寫一段」那塊空白裡淡淡的一行提示
  function hintOf(it) { var p = C.O.prefs && C.O.prefs.pracHint; return it && it.id ? M.pracHint(p && typeof p === 'object' && typeof p[it.id] === 'string' ? p[it.id] : '', kindOf(it)) : ''; }
  // 新增項目時可以直接點的：起頭的例子，加上各種練習的預設（已經有的項目不再列）
  function presets() {
    var out = P.examples.slice();
    P.kinds.forEach(function (k) { if (!out.some(function (x) { return x.name === k.n; })) out.push({ name: k.n, unit: k.unit }); });
    var F = g.JTE_FIRST_DATA, ex = F && F.q2 && F.q2.extra;
    (Array.isArray(ex) ? ex : []).forEach(function (e) { if (e && e.name && e.unit && !out.some(function (x) { return x.name === e.name; })) out.push({ name: e.name, unit: e.unit }); });
    return out.filter(function (x) { return !items().some(function (o) { return o.name === x.name; }); });
  }
  // 一段寫下的東西顯示成一行字：「哪一個」放前面
  function wline(w) { return (w.title ? w.title + ' ' : '') + (w.what ? w.what + (w.body ? '：' : '') : '') + (w.body || ''); }
  function picsOf(w) { return (w.photos || []).slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); }).filter(function (p) { return /^data:image\//.test(String(p.data || '')); }); }
  function minis(w) { var ph = picsOf(w); return ph.length ? '<span class="pr-minis">' + ph.map(function (p) { return '<img src="' + esc(p.data) + '" alt="' + esc(p.caption || D.insp.photoAlt) + '" loading="lazy">'; }).join('') + '</span>' : ''; }
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
      out.items.push({ id: x.id, name: x.name, unit: x.unit, color: x.color, icon: x.icon || '', parent: x.parent || '', goal: x.goal || '', tools: x.tools || '', archived: false, createdAt: ms(M.addDays(C.TODAY, -126 + j * 14)) });
    });
    if (Dm.items[2]) for (i = 20; i >= 0; i -= 3) out.logs.push({ id: 'pl-demo-f' + i, itemId: Dm.items[2].id, date: M.addDays(C.TODAY, -i), amount: 1 + (i % 2), note: '', at: ms(M.addDays(C.TODAY, -i)) + 7200000 });
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
    (Dm.whatLogs || []).forEach(function (x, j) { k = M.addDays(C.TODAY, -x.days); out.logs.push({ id: 'pl-demo-w' + j, itemId: x.itemId, date: k, amount: x.amount, note: x.note || '', what: x.what, at: ms(k) + 9000000 + j }); });
    Dm.notes.forEach(function (n) { out.notes.push({ id: n.id, itemId: n.itemId, title: n.title, body: n.body, star: !!n.star, updatedAt: ms(M.addDays(C.TODAY, -n.days)) }); });
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
  // 給「我的資料」設定表用：整批換地方。問過才會叫到這裡。
  function move(to) {
    if (C.DEMO || !st.uid || st.moving) return;
    st.ask = '';
    if (to === 'cloud') { if (st.mode !== 'cloud') upload(); }
    else if (st.mode === 'cloud') toLocal();
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
      else if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') s.vals[k] = el.value;
    }
    if (a && a.getAttribute && a.getAttribute('data-k') && map[a.getAttribute('data-k')] === a) {
      s.focus = a.getAttribute('data-k');
      try { s.sel = [a.selectionStart, a.selectionEnd]; } catch (e) { s.sel = null; }
    }
    return s;
  }
  function restore(s) {
    var map = keyed(), k, el;
    for (k in s.vals) if (map[k] && map[k].value !== s.vals[k]) {
      // 下拉選單：原本選的那一個還在才還原，不在就照新畫出來的
      if (map[k].tagName === 'SELECT' && !Array.prototype.some.call(map[k].options, function (o) { return o.value === s.vals[k]; })) continue;
      map[k].value = s.vals[k];
    }
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
  // 有小項目的大項目：最近記過的排前面；「整體」那一格只有記過、或本人點了才出現
  function lastAt(id) { var b = ''; st.data.logs.forEach(function (l) { if (l.itemId !== id) return; var k = l.date + ':' + (1e15 + (l.at || 0)); if (k > b) b = k; }); return b; }
  function isFam(f) { var it = f && itemById(f.item); return !!(it && !f.log && !parentId(it) && kidsOf(it.id).length); }
  function famRows(it, f) {
    var rows = kidsOf(it.id).slice();
    if ((f && f.whole) || st.data.logs.some(function (l) { return l.itemId === it.id; })) rows.push(it);
    return rows.sort(function (a, b) { var x = lastAt(a.id), y = lastAt(b.id); return x < y ? 1 : x > y ? -1 : 0; });
  }
  function famForm() {
    var f = st.lf, it = itemById(f.item), key = lfKey(), rows = famRows(it, f), date = f.date || C.TODAY, eid = 'pr-e-' + f.ctx;
    var h = '<form class="pr-log pr-fam" data-form="fam" novalidate' + cvars(it) + '>';
    h += rows.map(function (k) {
      var nm = k.id === it.id ? fill(T.whole, { n: it.name }) : k.name, us = unitsOf(k), last = lastLogOf(k.id), lu = last ? luOf(last) : k.unit;
      // 這一列的項目有不只一種單位：單位並排成按鈕，先選上次用的（這時整列不包成 label，裡面不只一個可以按的東西）
      var multi = us.length > 1, tag = multi ? 'div' : 'label';
      return '<' + tag + ' class="pr-famr"><span class="pr-famn">' + sw(k) + '<b>' + esc(nm) + '</b></span><span class="pr-amt"><input class="in" name="a-' + esc(k.id) + '" inputmode="decimal" autocomplete="off" maxlength="9" placeholder="' + esc(lastAmount(k.id)) +
        '" aria-label="' + esc(nm + ' ' + (multi ? T.amountAny : fill(T.amountFor, { u: k.unit }))) + '" aria-describedby="' + eid + '"' + fk(key + '-a-' + k.id) + '>' +
        (multi ? '' : '<span class="pr-unit" aria-hidden="true">' + esc(k.unit) + '</span>') + '</span>' +
        (multi ? unitPick('u-' + k.id, us, lu, key + '-u-' + k.id, nm + ' ' + T.unitPick) : '') + '</' + tag + '>';
    }).join('');
    if (rows.indexOf(it) < 0) h += '<button class="lnk pr-famw" type="button" data-pa="famwhole"' + fk('famw') + '>' + esc(T.wholeAdd) + '</button>';
    h += '<input class="in pr-lnote" name="note" maxlength="' + P.max.note + '" placeholder="' + esc(T.notePh) + '" aria-label="' + esc(T.notePh) + '"' + fk(key + '-n') + '>';
    h += '<div class="pr-lrow">' + (f.ctx === 'day' ? '<input type="hidden" name="date" value="' + esc(date) + '">'
      : '<label class="pr-date"><span>' + esc(T.date) + '</span><input class="in" type="date" name="date" max="' + esc(C.TODAY) + '" value="' + esc(date) + '"' + fk(key + '-d') + '></label>') +
      '<span class="pr-lbtn"><button class="btn fill" type="submit">' + esc(T.submit) + '</button><button class="lnk" type="button" data-pa="lcancel">' + esc(T.cancel) + '</button></span></div>';
    return h + '<p class="pr-err" id="' + eid + '" role="alert"></p></form>';
  }
  function logForm() {
    var f = st.lf, it = itemById(f.item), lg = f.log ? logById(f.log) : null, key = lfKey();
    if (!it) return '';
    if (isFam(f)) return famForm();
    var amt = lg ? M.pracFmt(lg.amount) : (lastAmount(it.id) || (P.ones.indexOf(it.unit) > -1 ? '1' : '')), date = lg ? lg.date : (f.date || C.TODAY), eid = 'pr-e-' + f.ctx;
    var us = unitsOf(it), last = lastLogOf(it.id), lu = lg ? luOf(lg) : (last ? luOf(last) : it.unit);
    var ask = askOf(it), wv = lg ? (lg.what || '') : '', whats = ask ? M.pracWhats(st.data.logs, it.id, P.recall.what) : [], pics = f.pics || [], canPic = !lg && C.photoOk();
    var h = '<form class="pr-log" data-form="log" novalidate' + cvars(it) + '>';
    // 多問的那一欄（書名、展名…）：記過的直接點
    if (ask) h += '<div class="pr-lrow pr-what"><input class="in pr-whatin" name="what" maxlength="' + P.max.what + '" autocomplete="off" placeholder="' + esc(ask) + '" aria-label="' + esc(ask) + '" value="' + esc(wv) + '"' + fk(key + '-w') + '>' +
      (whats.length ? '<span class="chips" role="group" aria-label="' + esc(fill(T.whatPick, { a: ask })) + '">' + whats.map(function (w) { return '<button type="button" class="chip' + (w === wv ? ' on' : '') + '" data-pa="what" data-v="' + esc(w) + '" aria-pressed="' + (w === wv) + '">' + esc(w) + '</button>'; }).join('') + '</span>' : '') + '</div>';
    h += '<div class="pr-lrow"><label class="pr-amt"><span class="pr-sr">' + (us.length > 1 ? esc(T.amountAny) : fillH(T.amountFor, { u: it.unit })) + '</span>' +
      '<input class="in" name="amount" inputmode="decimal" autocomplete="off" enterkeyhint="done" maxlength="9" value="' + esc(amt) + '" aria-describedby="' + eid + '"' + fk(key + '-a') + '>' +
      (us.length > 1 ? '</label>' + unitPick('unit', us, lu, key + '-u', T.unitPick)
        : '<span class="pr-unit" aria-hidden="true">' + esc(it.unit) + '</span></label>') +
      '<input class="in pr-lnote" name="note" maxlength="' + P.max.note + '" placeholder="' + esc(T.notePh) + '" aria-label="' + esc(T.notePh) + '" value="' + esc(lg ? lg.note : '') + '"' + fk(key + '-n') + '></div>';
    h += '<div class="pr-lrow">';
    if (f.ctx === 'day') h += '<input type="hidden" name="date" value="' + esc(date) + '">';
    else h += '<label class="pr-date"><span>' + esc(T.date) + '</span><input class="in" type="date" name="date" max="' + esc(C.TODAY) + '" value="' + esc(date) + '"' + fk(key + '-d') + '></label>';
    if (canPic) h += '<button class="btn sm pr-picbtn" type="button" data-pa="picadd"' + fk(key + '-p') + '>' + esc(D.insp.add + (pics.length ? fill(T.picCount, { n: pics.length, m: D.insp.maxPhotos }) : '')) + '</button><input type="file" class="pr-picin" accept="image/*" multiple hidden>';
    if (canPic && pics.length) h += '</div><div class="pr-thumbs pr-pics">' + pics.map(function (p, i) { return '<figure><img src="' + esc(p.data) + '" alt="' + esc(fill(T.picAlt, { n: i + 1 })) + '"><button class="lnk" type="button" data-pa="picdel" data-i="' + i + '"' + fk(key + '-pd' + i) + '>' + esc(T.picDel) + '</button></figure>'; }).join('') + '</div><p class="note">' + esc(T.picNote) + '</p><div class="pr-lrow">';
    h += '<span class="pr-lbtn"><button class="btn fill" type="submit">' + esc(T.submit) + '</button><button class="lnk" type="button" data-pa="lcancel">' + esc(T.cancel) + '</button></span></div>';
    h += '<p class="pr-err" id="' + eid + '" role="alert"></p></form>';
    return h;
  }
  function itemForm(mode, it) {
    var v = it || st.itf || {}, key = 'if-' + mode, unit = v.unit || '', color = safeColor(v.color || P.colors[items().length % P.colors.length]);
    if (!P.colors.some(function (c) { return c.toLowerCase() === color.toLowerCase(); })) color = P.colors[0];
    var h = '<form class="pr-iform" data-form="item" data-mode="' + mode + '" novalidate>';
    h += '<label class="pr-f"><span>' + esc(T.name) + '</span><input class="in" name="name" maxlength="' + P.max.name + '" autocomplete="off" placeholder="' + esc(T.namePh) + '" value="' + esc(v.name || '') + '"' + fk(key + '-name') + '></label>';
    if (mode === 'edit') h += '<label class="pr-f"><span>' + esc(T.goal) + '</span><input class="in" name="goal" maxlength="' + P.max.goal + '" autocomplete="off" placeholder="' + esc(T.goalPh) + '" value="' + esc(v.goal || '') + '"' + fk(key + '-goal') + '></label>';
    var tops = items().filter(function (x) { return !parentId(x) && x.id !== v.id && (!x.archived || x.id === v.parent); }), hasKids = mode === 'edit' && M.pracKids(items(), v.id).length > 0, par = mode === 'edit' ? parentId(v) : (v.parent || '');
    if (mode === 'edit' && !hasKids) h += '<label class="pr-f"><span>' + esc(T.askLabel) + '</span><input class="in" name="ask" maxlength="' + P.max.ask + '" autocomplete="off" placeholder="' + esc(T.askPh) + '" value="' + esc(askOf(v)) + '"' + fk(key + '-ask') + '></label><p class="note pr-fnote">' + esc(T.askNote) + '</p>';
    if (mode === 'edit') h += '<label class="pr-f"><span>' + esc(T.hintLabel) + '</span><input class="in" name="hint" maxlength="' + P.max.hint + '" autocomplete="off" placeholder="' + esc(T.hintPh) + '" value="' + esc(hintOf(v)) + '"' + fk(key + '-hint') + '></label><p class="note pr-fnote">' + esc(T.hintNote) + '</p>';
    if (mode === 'edit' && tops.length && !hasKids) h += '<label class="pr-f"><span>' + esc(T.parent) + '</span><select class="in" name="parent"' + fk(key + '-par') + '><option value="">' + esc(T.parentNone) + '</option>' +
      tops.map(function (x) { return '<option value="' + esc(x.id) + '"' + (x.id === par ? ' selected' : '') + '>' + esc(x.name) + '</option>'; }).join('') + '</select></label>';
    h += '<div class="pr-f"><span id="' + key + '-ul">' + esc(T.unit) + '</span><div class="pr-units"><div class="chips" role="group" aria-labelledby="' + key + '-ul">' +
      P.units.map(function (u) { var on = u === unit; return '<button type="button" class="chip' + (on ? ' on' : '') + '" data-pa="unit" data-u="' + esc(u) + '" aria-pressed="' + on + '">' + esc(u) + '</button>'; }).join('') +
      '</div><input class="in pr-uin" name="unit" maxlength="' + P.max.unit + '" autocomplete="off" placeholder="' + esc(T.unitPh) + '" aria-label="' + esc(T.unitOwn) + '" value="' + esc(unit) + '"' + fk(key + '-unit') + '></div></div>';
    if (mode === 'edit') h += uxHTML(v, 'f');
    if (mode === 'edit' && !par) h += '<div class="pr-f"><span id="' + key + '-cl">' + esc(T.color) + '</span><div class="pr-cols" role="radiogroup" aria-labelledby="' + key + '-cl">' +
      P.colors.map(function (c, i) { return '<label class="pr-col"><input type="radio" name="' + key + '-color" value="' + c + '"' + (c.toLowerCase() === color.toLowerCase() ? ' checked' : '') + fk(key + '-c' + i) + '><i style="background:' + c + '"></i><span class="pr-sr">' + esc(T.colorNames[i] || c) + '</span></label>'; }).join('') + '</div></div>';
    var ico = iconOf(v);
    if (mode === 'edit') h += '<div class="pr-f"><span id="' + key + '-il">' + esc(T.icon) + '</span><div class="pr-icons" role="radiogroup" aria-labelledby="' + key + '-il">' +
      '<label class="pr-icn" title="' + esc(T.iconNone) + '"><input type="radio" name="' + key + '-icon" value=""' + (ico ? '' : ' checked') + '><i class="pr-sw"></i><span class="pr-sr">' + esc(T.iconNone) + '</span></label>' +
      iconGroups().map(function (gp) {
        return '<b class="pr-icg">' + esc(gp.n) + '</b>' + gp.list.map(function (x) { return '<label class="pr-icn" title="' + esc(x.n) + '"><input type="radio" name="' + key + '-icon" value="' + x.k + '"' + (x.k === ico ? ' checked' : '') + '><img src="' + iconSrc(x.k) + '" alt="" width="40" height="40"><span class="pr-sr">' + esc(x.n) + '</span></label>'; }).join('');
      }).join('') + '</div></div>';
    if (mode === 'edit') { var tk = M.pracTools(v.tools).split(',');
      h += '<div class="pr-f"><span id="' + key + '-tl">' + esc(T.toolsLabel) + '</span><div class="pr-tools" role="group" aria-labelledby="' + key + '-tl">' +
        Object.keys(D.tools).map(function (k) { return '<label class="pr-tool"><input type="checkbox" name="tool" value="' + k + '"' + (tk.indexOf(k) > -1 ? ' checked' : '') + fk(key + '-t-' + k) + '><span>' + esc(D.tools[k].name) + '</span></label>'; }).join('') +
        '</div><p class="note">' + esc(T.toolsNote) + '</p></div>'; }
    if (mode === 'edit') h += '<p class="note">' + esc(T.unitWarn) + '</p>';
    if (mode === 'new' && !v.parent) h += '<div class="pr-ex"><span class="note">' + esc(T.examples) + '</span><div class="chips">' + presets().map(function (x, i) { return '<button type="button" class="chip" data-pa="pre" data-i="' + i + '">' + esc(x.name) + '・' + esc(x.unit) + '</button>'; }).join('') + '</div></div>';
    h += '<p class="pr-err" role="alert"></p><div class="row"><button class="btn fill" type="submit"' + fk(key + '-save') + '>' + esc(T.save) + '</button>' +
      (mode === 'new' ? '<button class="btn" type="button" data-pa="icancel">' + esc(T.cancel) + '</button>' : '') + '</div>' + (mode === 'new' ? '<p class="note">' + esc(T.setMore) + '</p>' : '') + '</form>';
    return h;
  }

  // ── 我的練習（練習空間） ──
  function cardHTML(it) {
    var last = M.pracLast(st.data.logs, it.id), t = M.pracTotals(st.data.logs, it.id, C.TODAY), on = st.lf && st.lf.ctx === 'card' && st.lf.item === it.id;
    var kids = parentId(it) ? [] : kidsOf(it.id), famN = t.month.n;
    kids.forEach(function (k) { var kl = M.pracLast(st.data.logs, k.id); if (kl > last) last = kl; famN += M.pracTotals(st.data.logs, k.id, C.TODAY).month.n; });
    var h = '<div class="pr-card' + (on ? ' on' : '') + (it.archived ? ' arch' : '') + '"' + cvars(it) + '>' +
      '<button class="pr-open" data-pa="open" data-id="' + esc(it.id) + '"' + fk('co-' + it.id) + '>' +
      '<span class="pr-name">' + sw(it) + esc(it.name) + '</span>' +
      '<span class="pr-meta">' + esc(last ? fill(T.last, { d: M.dlabel(last) }) : T.never) + '</span>' +
      '<span class="pr-meta">' + esc(kids.length ? (famN ? fill(T.monthFam, { n: famN }) : T.monthNone) : monthText(it)) + '</span>' +
      (kids.length ? '<span class="pr-meta pr-kidsl">' + esc(fill(T.kidsOf, { list: kids.map(function (k) { return k.name; }).join(T.listSep) })) + '</span>' : '') +
      (it.goal ? '<span class="pr-meta pr-goall">' + esc(T.goalLabel) + '：' + esc(it.goal) + '</span>' : '') + '</button>';
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
  // 項目設定：全部項目列在一起，每個都能進它的設定；新增也從這裡
  function mgrHTML() {
    var list = ordered(active()).concat(ordered(items().filter(function (x) { return x.archived; })));
    return '<div class="panel pr-newf pr-mgr"><h3 class="pr-h3">' + esc(T.mgr) + '</h3><p class="note">' + esc(T.mgrNote) + '</p><div>' + list.map(function (it) {
      return '<div class="pr-mrow' + (parentId(it) ? ' kid' : '') + '"' + cvars(it) + '>' + sw(it) + '<div><b>' + esc(it.name) + '</b><span class="note">' + esc(it.unit) + (it.archived ? '・' + esc(T.archivedTag) : '') + '</span></div><button class="btn sm" data-pa="iset" data-id="' + esc(it.id) + '" aria-label="' + esc(fill(T.mgrSetOf, { n: fullName(it) })) + '"' + fk('is-' + it.id) + '>' + esc(T.mgrSet) + '</button></div>';
    }).join('') + '</div><div class="row pr-gap"><button class="btn fill" data-pa="new"' + fk('new') + '><span aria-hidden="true">＋</span> ' + esc(T.add) + '</button><button class="lnk" data-pa="mgr">' + esc(T.mgrClose) + '</button></div></div>';
  }
  function renderBox() {
    var act = topLevel(active()), arch = items().filter(function (x) { return x.archived; }), h = '';
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
    if (!st.itf) h += '<button class="pr-card pr-new" data-pa="mgr" aria-expanded="' + !!st.mgr + '"' + fk('mgr') + '>' + esc(T.mgr) + '</button>';
    h += '</div>';
    if (st.mgr && !st.itf) h += mgrHTML();
    if (st.itf && !st.item) h += '<div class="panel pr-newf"><h3 class="pr-h3" id="pr-newh">' + esc(T.addTitle) + '</h3>' + itemForm('new') + '</div>';
    if (arch.length) h += '<details class="pr-arch"' + (st.archOpen ? ' open' : '') + '><summary' + fk('arch') + '>' + esc(fill(T.archivedN, { n: arch.length })) + '</summary><div class="pr-grid">' + arch.map(cardHTML).join('') + '</div></details>';
    box.innerHTML = h + whereHTML();
  }

  // ── 今天的快速鍵 ──
  // 「練習」一項一列（2026-11-26）：列上是上次哪一天與最近寫下的一句；點那一列才展開還在探索的、最近寫下的、標了星星的。
  function rowSub(it) {
    var f = M.pracInsights(st.data.logs, items(), famIds(it), C.TODAY), w = writings(it)[0];
    var t = w ? ((w.title ? w.title + ' ' : '') + w.body).replace(/\s+/g, ' ').trim() : '', max = P.recall.row, ids = famIds(it), lw = null;
    var when = f.n ? (f.sinceLast <= 0 ? T.rowToday : fill(T.last, { d: M.dlabel(f.last).split(' ')[0] })) : T.never;
    st.data.logs.forEach(function (l) { if (ids.indexOf(l.itemId) < 0) return; if (!lw || l.date > lw.date || (l.date === lw.date && (l.at || 0) > (lw.at || 0))) lw = l; });
    // 最近那一筆有「哪一個」就顯示它；那一句只在它就是這一筆寫的時候才跟著，免得張冠李戴
    if (lw && lw.what) return when + '・' + lw.what + (t && w.kind === 'log' && w.id === lw.id ? '・' + (t.length > max ? t.slice(0, max) + '…' : t) : '');
    return when + (t ? '・' + (t.length > max ? t.slice(0, max) + '…' : t) : '');
  }
  function rowDetail(cur) {
    var all = writings(cur), goals = famGoals(cur), recent = all.slice(0, P.recall.recent), shown = {}, stars;
    recent.forEach(function (w) { shown[w.id] = 1; });
    stars = all.filter(function (w) { return w.star && !shown[w.id]; }).slice(0, P.recall.star);
    function row(w) {
      var sub = w.itemId !== cur.id ? itemById(w.itemId) : null, t = (w.title ? w.title + ' ' : '') + w.body, max = P.recall.chars;
      return '<p class="pr-rc' + (w.star ? ' star' : '') + '"><small>' + esc(w.key ? M.dlabel(w.key) : '') + '</small><span>' + (sub ? '<span class="pr-itag">' + esc(sub.name) + '</span>' : '') + (w.what ? '<span class="pr-itag">' + esc(w.what) + '</span>' : '') + (w.star ? '★ ' : '') + esc(t.length > max ? t.slice(0, max) + '…' : t) + minis(w) + '</span></p>';
    }
    var h = '<div class="pr-rowbody">';
    if (goals.length) h += '<div class="pr-rcsec"><small>' + esc(T.rcGoal) + '</small>' + goals.map(function (x) { return '<p class="pr-rcgoal">' + (x.it.id !== cur.id ? '<span class="pr-itag">' + esc(x.it.name) + '</span>' : '') + esc(x.goal) + '</p>'; }).join('') + '</div>';
    if (recent.length) h += '<div class="pr-rcsec"><small>' + esc(T.rcRecent) + '</small>' + recent.map(row).join('') + '</div>';
    else h += '<p class="note">' + esc(T.rcNone) + '</p>';
    if (stars.length) h += '<div class="pr-rcsec"><small>' + esc(T.rcStar) + '</small>' + stars.map(row).join('') + '</div>';
    if (st.qw === cur.id) h += writeForm(cur, null);
    h += '<div class="row pr-gap"><button class="btn sm" data-pa="rcwrite" data-id="' + esc(cur.id) + '" aria-expanded="' + (st.qw === cur.id) + '"' + fk('rcw') + '>' + esc(T.rcWrite) + '</button>' +
      (all.length ? '<button class="lnk" data-pa="rcall" data-id="' + esc(cur.id) + '"' + fk('rca') + '>' + esc(fill(T.recentAll, { n: all.length })) + '</button>' : '') + '</div></div>';
    return h;
  }
  // 「練習」上的項目設定：預設收著，按了在原地展開。單位直接改；其他的進各項目的設定。
  function qmgrHTML() {
    return '<div class="pr-qmgr"><p class="note">' + esc(T.qmgrNote) + '</p>' + ordered(active()).map(function (it) {
      var us = P.units.slice(); if (us.indexOf(it.unit) < 0) us.unshift(it.unit);
      var more = unitsOf(it).slice(1), uxOn = st.qu === it.id;
      return '<div class="pr-mrow' + (parentId(it) ? ' kid' : '') + '"' + cvars(it) + '>' + sw(it) + '<div><b>' + esc(it.name) + '</b>' +
        '<button type="button" class="lnk pr-uxl" data-pa="uxopen" data-id="' + esc(it.id) + '" aria-expanded="' + uxOn + '"' + fk('uxo-' + it.id) + '>' + esc(more.length ? fill(T.uxAlso, { list: more.join(T.listSep) }) : T.uxAdd) + '</button></div>' +
        '<select class="in pr-qunit" data-qunit="' + esc(it.id) + '" aria-label="' + esc(fill(T.qunitOf, { n: fullName(it) })) + '"' + fk('qu-' + it.id) + '>' +
        us.map(function (u) { return '<option' + (u === it.unit ? ' selected' : '') + '>' + esc(u) + '</option>'; }).join('') + '</select>' +
        '<button class="btn sm" data-pa="iset" data-id="' + esc(it.id) + '" aria-label="' + esc(fill(T.mgrSetOf, { n: fullName(it) })) + '"' + fk('qs-' + it.id) + '>' + esc(T.mgrSet) + '</button></div>' + (uxOn ? uxHTML(it, 'q') : '');
    }).join('') + qpreHTML() + '<div class="row pr-gap"><button class="btn sm fill" data-pa="qnew"' + fk('qnew') + '><span aria-hidden="true">＋</span> ' + esc(T.quickOwn) + '</button><button class="lnk" data-pa="qmgr">' + esc(T.mgrClose) + '</button></div></div>';
  }
  // 平台先想好的練習：還沒加的列在項目設定裡，點一下就加進「我的練習」
  function qpreHTML() {
    var list = presets();
    if (!list.length) return '';
    return '<div class="pr-qpre"><b id="pr-qpre-h">' + esc(T.qpreTitle) + '</b><p class="note">' + esc(T.qpreNote) + '</p><div class="chips" role="group" aria-labelledby="pr-qpre-h">' + list.map(function (x, i) {
      var k = iconFor(x.name);
      return '<button type="button" class="chip" data-pa="qpre" data-i="' + i + '"' + fk('qpre' + i) + '>' + (k ? '<img src="' + iconSrc(k) + '" alt="" width="18" height="18">' : '') + esc(x.name) + '・' + esc(x.unit) + '</button>';
    }).join('') + '</div></div>';
  }
  // 這個項目和它底下小項目訂的「目標或正在探索的」
  function famGoals(it) {
    return famIds(it).map(function (id) { return itemById(id); }).filter(function (x) { return x && x.goal; }).map(function (x) { return { it: x, goal: x.goal }; });
  }
  function renderQuick() {
    var act = topLevel(active());
    if (pending() || restoring() || st.mode === 'out') { quick.hidden = true; quick.innerHTML = ''; return; }
    quick.hidden = false;
    if (!items().length) {
      // 還沒有任何項目：給一行入口，點範例就建好、直接記一筆
      quick.innerHTML = '<div class="panel pr-quick"><div class="pr-qhead"><b>' + esc(T.quickTitle) + '</b><span class="note">' + esc(T.quickEmpty) + '</span></div><div class="chips">' +
        P.examples.map(function (x, i) { return '<button type="button" class="chip" data-pa="qex" data-i="' + i + '"' + fk('qex' + i) + '>' + esc(x.name) + '</button>'; }).join('') +
        '<button type="button" class="chip" data-pa="qown"' + fk('qown') + '>' + esc(T.quickOwn) + '</button></div></div>';
      return;
    }
    if (!act.length) { quick.hidden = true; quick.innerHTML = ''; return; }
    var openId = st.lf && st.lf.ctx === 'quick' ? st.lf.item : '';
    quick.innerHTML = '<div class="panel pr-quick"><div class="pr-qhead"><b>' + esc(T.quickTitle) + '</b><span class="note">' + esc(T.quickNote) + '</span><button class="lnk" data-pa="qmgr" aria-expanded="' + !!st.qmgr + '"' + fk('qmgr') + '>' + esc(T.mgr) + '</button></div>' +
      (st.qmgr ? qmgrHTML() : '') +
      '<div class="pr-rows">' + act.map(function (it) {
        var on = openId === it.id, ex = st.qx === it.id, tt = todayText(it.id), fam = kidsOf(it.id), tc = 0;
        // 今天用了不只一種單位：那一句比較長，放到名稱下面一行，不擠掉名稱
        var wide = !fam.length && tt.indexOf(T.listSep) > -1;
        if (fam.length) { var fids = [it.id].concat(fam.map(function (x) { return x.id; })); st.data.logs.forEach(function (l) { if (l.date === C.TODAY && fids.indexOf(l.itemId) > -1) tc++; }); }
        return '<div class="pr-row' + (ex ? ' open' : '') + '"' + cvars(it) + '>' +
          '<button class="pr-rowmain" data-pa="qrow" data-id="' + esc(it.id) + '" aria-expanded="' + ex + '"' + fk('qr-' + it.id) + '>' + sw(it) + '<span class="pr-rowtxt"><b>' + esc(fullName(it)) + '</b><span>' + esc(rowSub(it)) + '</span></span></button>' +
          (fam.length ? (tc ? '<em>' + esc(fill(T.todayFam, { c: tc })) + '</em>' : '') : tt && !wide ? '<em>' + esc(tt) + '</em>' : '') +
          '<button class="btn sm pr-rowlog" data-pa="qopen" data-id="' + esc(it.id) + '" aria-expanded="' + on + '"' + fk('qp-' + it.id) + '>' + esc(T.log) + '</button>' +
          (wide ? '<em class="wide">' + esc(tt) + '</em>' : '') +
          (on ? '<div class="pr-rowform">' + logForm() + '</div>' : '') + (ex ? rowDetail(it) : '') + '</div>';
      }).join('') + '</div></div>';
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
    var zl = st.lf && st.lf.ctx === 'zone', par = itemById(parentId(it));
    var h = '<div class="pr-zhead"' + cvars(it) + '>' + (par ? '<button class="lnk pr-back" data-pa="open" data-id="' + esc(par.id) + '"' + fk('back') + '><span aria-hidden="true">‹ </span>' + esc(fill(T.backTo, { n: par.name })) + '</button>'
      : '<button class="lnk pr-back" data-pa="back"' + fk('back') + '><span aria-hidden="true">‹ </span>' + esc(T.back) + '</button>') +
      '<div class="pr-zt">' + sw(it) + '<h2 id="pr-zh" tabindex="-1"' + fk('zh') + '>' + esc(it.name) + '</h2>' +
      (it.archived ? '<span class="tag">' + esc(T.archivedTag) + '</span>' : '') + '</div>' +
      '<button class="btn" data-pa="gotoday"' + fk('zl') + '>' + esc(T.zoneGo) + '</button></div>';
    h += '<p class="pr-goal">' + (it.goal ? '<small>' + esc(T.goalLabel) + '</small><span>' + esc(it.goal) + '</span><button class="lnk" data-pa="goaledit"' + fk('ge') + '>' + esc(T.goalEdit) + '</button>'
      : '<button class="lnk" data-pa="goaledit"' + fk('ge') + '>' + esc(T.goalNone) + '</button>') + '</p>';
    if (!par) {
      var kids = M.pracKids(items(), it.id), adding = st.itf && st.itf.parent === it.id;
      if (kids.length || adding) h += '<div class="pr-kids"><b class="pr-h3">' + esc(T.kids) + '</b>' + kids.map(function (k) {
        var kt = M.pracTotals(st.data.logs, k.id, C.TODAY);
        return '<button class="pr-kid' + (k.archived ? ' arch' : '') + '" data-pa="open" data-id="' + esc(k.id) + '"' + cvars(k) + fk('kid-' + k.id) + '>' + sw(k) + '<b>' + esc(k.name) + '</b><span>' +
          esc(monthText(k)) + '</span></button>';
      }).join('') + (adding || it.archived ? '' : '<button class="pr-kid pr-kidadd" data-pa="kidnew"' + fk('kidnew') + '><span aria-hidden="true">＋</span> ' + esc(T.kidAdd) + '</button>') + '</div>';
      if (adding) h += '<div class="panel pr-newf"><h3 class="pr-h3">' + esc(fill(T.kidAddTitle, { n: it.name })) + '</h3>' + itemForm('new') + '<p class="note">' + esc(T.kidNote) + '</p></div>';
    }
    h += '<div class="pr-tabs" role="tablist" aria-label="' + esc(T.tabsLabel) + '">' + TABS.map(function (k) {
      var on = st.tab === k;
      return '<button role="tab" id="pr-tab-' + k + '" aria-controls="pr-tp" aria-selected="' + on + '" tabindex="' + (on ? 0 : -1) + '" data-pa="tab" data-t="' + k + '"' + fk('t-' + k) + '>' + esc(T.tabs[k]) + '</button>';
    }).join('') + '</div>';
    h += '<div class="panel pr-tp" id="pr-tp" role="tabpanel" tabindex="0" aria-labelledby="pr-tab-' + st.tab + '"' + cvars(it) + '>' +
      (st.tab === 'log' ? tabLog(it) : st.tab === 'write' ? tabWrite(it) : tabSet(it)) + '</div>';
    zone.innerHTML = h;
    if (st.tab === 'log') drawChart();
  }

  function famOf(it) {
    if (!it) return null;
    var k = parentId(it) ? [] : M.pracKids(items(), it.id);
    if (k.length) return [it.id].concat(k.map(function (x) { return x.id; }));
    // 沒有小項目、但紀錄用了不只一種單位：一樣照單位分開算（清單裡只有它自己）
    return logUnits(it).length > 1 ? [it.id] : null;
  }
  function unitsText(us) { return us.map(function (u) { return fill(T.unitSum, { s: M.pracFmt(u.sum), u: u.unit }); }).join(T.listSep); }
  // 最近寫下的：星星的排前面，最多三段
  function recentHTML(it) {
    var all = writings(it), pick;
    if (!all.length) return '';
    pick = all.filter(function (w) { return w.star; }).concat(all.filter(function (w) { return !w.star; })).slice(0, 3);
    return '<div class="pr-blk pr-recent"><div class="pr-chead"><h3 class="pr-h3">' + esc(T.recent) + '</h3><button class="lnk" data-pa="tab" data-t="write"' + fk('rall') + '>' + esc(fill(T.recentAll, { n: all.length })) + '</button></div>' +
      pick.map(function (w) { var t = wline(w); return '<p class="pr-rc' + (w.star ? ' star' : '') + '"><small>' + esc(w.key ? M.dlabel(w.key) : '') + '</small><span>' + (w.star ? '★ ' : '') + esc(t.length > 90 ? t.slice(0, 90) + '…' : t) + '</span></p>'; }).join('') + '</div>';
  }
  function toolsOf(it) {
    var seen = {}, out = [];
    famIds(it).forEach(function (id) { var x = itemById(id); M.pracTools(x && x.tools).split(',').forEach(function (k) { if (k && D.tools[k] && !seen[k]) { seen[k] = 1; out.push(k); } }); });
    return out;
  }
  function toolPages(it) {
    var ks = toolsOf(it);
    if (!ks.length || !C.getPages) return [];
    return C.getPages().filter(function (p) { return p && p.tool && ks.indexOf(p.tool) > -1; });
  }
  // 看得出來的：照紀錄算出來的幾句白話
  function insightLines(it) {
    var I = T.ins, f = M.pracInsights(st.data.logs, items(), famIds(it), C.TODAY), out = [], w = writings(it), tp = toolPages(it), x;
    if (f.n) {
      if (!f.hasPrev || !f.prevDays) out.push(fill(I.monthOnly, { a: f.moDays }));
      else if (f.moDays > f.prevDays) out.push(fill(I.monthMore, { a: f.moDays, d: f.moDays - f.prevDays }));
      else if (f.moDays < f.prevDays) out.push(fill(I.monthLess, { a: f.moDays, d: f.prevDays - f.moDays }));
      else out.push(fill(I.monthSame, { a: f.moDays }));
      out.push(f.sinceLast <= 0 ? I.lastToday : fill(I.last, { d: M.dlabel(f.last), n: f.sinceLast }));
      if (f.wd) out.push(fill(I.wd, { w: T.wdFull[f.wd.i], n: f.wd.n }));
      if (f.gap) out.push(fill(I.gap, { d: f.gap.days, a: slash(f.gap.from), b: slash(f.gap.to) }));
      if (f.top) { x = itemById(f.top.id); if (x) out.push(fill(I.top, { n: x.id === it.id ? fill(T.whole, { n: it.name }) : x.name, c: f.top.n })); }
      if (f.avg) out.push(fill(I.avg, { v: M.pracFmt(f.avg.v), u: f.avg.unit, m: M.pracFmt(f.avg.max) }));
    }
    if (w.length) { x = w.filter(function (a) { return a.star; }).length; out.push(x ? fill(I.wr, { n: w.length, s: x }) : fill(I.wr0, { n: w.length })); }
    if (tp.length) {
      var by = {}, ord = [];
      tp.forEach(function (p) { if (!by[p.tool]) { by[p.tool] = 0; ord.push(p.tool); } by[p.tool]++; });
      out.push(fill(I.tools, { list: ord.map(function (k) { return fill(I.toolOne, { n: D.tools[k].name, c: by[k] }); }).join(T.listSep) }));
    }
    return out;
  }
  function insightsHTML(it) {
    var ls = insightLines(it);
    if (!ls.length) return '';
    return '<div class="pr-blk pr-ins"><h3 class="pr-h3">' + esc(T.insTitle) + '</h3><ul>' + ls.map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('') + '</ul><p class="note">' + esc(T.insNote) + '</p></div>';
  }
  // 請 AI 讀：自己按才送；送出去的只有文字與統計，沒有姓名、信箱、照片。結果不存。
  function aiPack(it) {
    var A = P.ai, all = writings(it).filter(function (w) { return w.body; }), left = A.maxChars, notes = [], i, t;
    for (i = 0; i < all.length; i++) {
      t = ((all[i].title ? all[i].title + '\n' : '') + all[i].body).slice(0, A.one);
      if (t.length > left) break;
      left -= t.length; notes.push({ d: all[i].key || '', t: t, star: !!all[i].star });
    }
    return { total: all.length, chars: A.maxChars - left, body: { item: fullName(it), goal: it.goal || '', stats: insightLines(it).join(''), notes: notes } };
  }
  function aiHTML(it) {
    var a = st.ai && st.ai.item === it.id ? st.ai : null, pk = aiPack(it), h = '<div class="pr-blk pr-ai"><h3 class="pr-h3">' + esc(T.aiTitle) + '</h3>';
    if (pk.total < P.ai.min) return h + '<p class="note">' + esc(fill(T.aiFew, { n: P.ai.min, c: pk.total })) + '</p></div>';
    if (!a) return h + '<p class="note">' + esc(T.aiNote) + '</p><div class="row pr-gap"><button class="btn sm" data-pa="aiask"' + fk('aibtn') + '>' + esc(T.aiBtn) + '</button></div></div>';
    if (a.state === 'ask') return h + '<p class="pr-warn">' + esc(fill(T.aiAsk, { n: pk.body.notes.length, c: pk.chars })) + (pk.body.notes.length < pk.total ? esc(fill(T.aiCut, { n: pk.body.notes.length })) : '') + '</p>' +
      '<div class="row pr-gap"><button class="btn sm fill" data-pa="aigo"' + fk('aiyes') + '>' + esc(T.aiYes) + '</button><button class="lnk" data-pa="aino">' + esc(T.cancel) + '</button></div></div>';
    if (a.state === 'wait') return h + '<p class="note" role="status">' + esc(T.aiWait) + '</p></div>';
    if (a.state === 'fail') return h + '<p class="pr-warn" role="alert">' + esc(a.text || T.aiFail) + '</p><div class="row pr-gap"><button class="btn sm" data-pa="aiask"' + fk('aibtn') + '>' + esc(T.aiAgain) + '</button></div></div>';
    return h + '<p class="pr-aistamp">' + esc(T.aiStamp) + '</p><div class="pr-wbody pr-aiout" tabindex="-1"' + fk('aiout') + '>' + esc(a.text) + '</div><div class="row pr-gap"><button class="btn sm" data-pa="aiask"' + fk('aibtn') + '>' + esc(T.aiAgain) + '</button></div></div>';
  }
  function aiRun() {
    var it = itemById(st.item), id = st.item;
    if (!it) return;
    function done(state, text) { if (!st.ai || st.ai.item !== id) return; st.ai = { item: id, state: state, text: text }; st.focus = state === 'done' ? 'aiout' : 'aibtn'; render(true); }
    if (C.DEMO) { st.ai = { item: id, state: 'fail', text: T.aiDemo }; st.focus = 'aibtn'; render(true); return; }
    var body = aiPack(it).body;
    st.ai = { item: id, state: 'wait' }; render(true);
    timed(function () {
      return fetch(P.ai.url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(function (r) {
        return r.json().then(function (j) { return { status: r.status, j: j || {} }; }, function () { return { status: r.status, j: {} }; });
      });
    }, 90000).then(function (r) {
      if (r.status === 200 && typeof r.j.reply === 'string' && r.j.reply.trim()) done('done', r.j.reply.trim());
      else done('fail', r.status === 429 ? T.aiLimit : T.aiFail);
    }, function () { done('fail', T.aiFail); });
  }
  function tabLog(it) {
    var lg = st.data.logs, ids = famOf(it), h = '', has, t, mo, al;
    if (ids) {
      mo = M.pracRollup(lg, items(), ids, C.TODAY.slice(0, 7)); al = M.pracRollup(lg, items(), ids); has = al.n > 0;
      if (has) h += '<div class="pr-stats">' +
        '<div class="pr-stat"><small>' + esc(T.thisMonth) + '</small><p><b>' + mo.days + '</b> ' + esc(T.daysUnit) + '</p><span>' + esc(mo.n ? unitsText(mo.units) : T.monthNone) + '</span></div>' +
        '<div class="pr-stat"><small>' + esc(T.allTime) + '</small><p><b>' + al.days + '</b> ' + esc(T.daysUnit) + '</p><span>' + esc(unitsText(al.units)) + '<br>' + esc(fill(T.since, { d: slash(al.first) })) + '</span></div></div>';
    } else {
      t = M.pracTotals(lg, it.id, C.TODAY); has = t.all.n > 0;
      if (has) h += '<div class="pr-stats">' +
        '<div class="pr-stat"><small>' + esc(T.thisMonth) + '</small><p><b>' + t.month.n + '</b> ' + esc(T.times) + '</p><span>' + esc(fill(T.total, { s: M.pracFmt(t.month.sum), u: uo(it) })) + '</span></div>' +
        '<div class="pr-stat"><small>' + esc(T.allTime) + '</small><p><b>' + t.all.n + '</b> ' + esc(T.times) + '</p><span>' + esc(fill(T.total, { s: M.pracFmt(t.all.sum), u: uo(it) })) + '<br>' + esc(fill(T.since, { d: slash(t.all.first) })) + '</span></div></div>';
    }
    if (!has) h += '<p class="pr-invite">' + esc(T.noLogs) + '</p>';
    h += insightsHTML(it);
    h += byWhatHTML(it);
    h += recentHTML(it);
    h += '<div' + (has ? ' class="pr-two"' : '') + '><div class="pr-blk">' + calHTML(it) + '</div>';
    if (has) {
      var wk = st.chart === 'week';
      h += '<div class="pr-blk"><div class="pr-chead"><h3 class="pr-h3">' + esc(T.trend) + '</h3><div class="chips" role="group" aria-label="' + esc(T.trend) + '">' +
        '<button class="chip' + (wk ? ' on' : '') + '" data-pa="chart" data-c="week" aria-pressed="' + wk + '"' + fk('cw') + '>' + esc(T.byWeek) + '</button>' +
        '<button class="chip' + (!wk ? ' on' : '') + '" data-pa="chart" data-c="month" aria-pressed="' + !wk + '"' + fk('cm') + '>' + esc(T.byMonth) + '</button></div></div>' +
        '<div class="pr-chart" id="pr-chart"></div><p class="note pr-cap">' + esc(ids ? (ids.length > 1 ? T.chartCapFam : T.chartCapMix) : fill(T.chartCap, { u: uo(it) })) + '</p></div>';
    }
    return h + '</div>' + aiHTML(it);
  }
  // 照「哪一個」整理（哪本書讀了幾次、共幾頁）：只並列，最近記過的排前面
  function byWhatHTML(it) {
    var rows = M.pracByWhat(st.data.logs, items(), famIds(it)), top = P.recall.top;
    if (!rows.length) return '';
    return '<div class="pr-blk pr-bw"><h3 class="pr-h3">' + esc(fill(T.byWhat, { a: askOf(it) || T.whatAny })) + '</h3>' + rows.slice(0, top).map(function (r) {
      return '<p class="pr-bwrow"><b>' + esc(r.what) + '</b><span>' + esc(fill(T.bwRow, { n: r.n, s: unitsText(r.units) })) + '</span><small>' + esc(fill(T.last, { d: M.dlabel(r.last).split(' ')[0] })) + '</small></p>';
    }).join('') + (rows.length > top ? '<p class="note pr-gap">' + esc(fill(T.bwMore, { n: rows.length - top })) + '</p>' : '') + '</div>';
  }
  function nowYM() { var d = ymd(C.TODAY); return { y: d.y, m: d.m }; }
  function calHTML(it) {
    var ids = famOf(it), mo = M.pracMonth(st.data.logs, ids || it.id, st.calY, st.calM), cur = nowYM(), atNow = st.calY > cur.y || (st.calY === cur.y && st.calM >= cur.m), i, h;
    h = '<div class="pr-calnav"><button type="button" data-pa="cprev" aria-label="' + esc(T.prevMonth) + '"' + fk('cp') + '>‹</button>' +
      '<div><b>' + esc(fill(T.ym, { y: st.calY, m: st.calM })) + '</b><span class="note">' + esc(!mo.n ? T.monthEmpty : ids ? fill(T.monthSumFam, { n: mo.n }) : fill(T.monthSum, { n: mo.n, s: M.pracFmt(mo.sum), u: uo(it) })) + '</span></div>' +
      '<button type="button" data-pa="cnext" aria-label="' + esc(T.nextMonth) + '"' + (atNow ? ' disabled' : '') + fk('cn') + '>›</button></div>';
    h += '<div class="pr-cal">' + T.wd.map(function (w) { return '<span class="pr-wd" aria-hidden="true">' + esc(w) + '</span>'; }).join('');
    for (i = 0; i < mo.lead; i++) h += '<span></span>';
    mo.days.forEach(function (d) {
      var fut = d.key > C.TODAY, today = d.key === C.TODAY, sel = st.day === d.key;
      var aria = fill(T.dayAria, { m: st.calM, d: d.d, x: !d.n ? T.dayNone : ids ? fill(T.dayHasFam, { n: d.n }) : fill(T.dayHas, { n: d.n, s: M.pracFmt(d.sum), u: uo(it) }) }) + (today ? T.todayAria : '');
      h += '<button type="button" class="pr-day' + (d.n ? ' has' : '') + (today ? ' today' : '') + '" data-pa="day" data-d="' + d.key + '" aria-pressed="' + sel + '" aria-label="' + esc(aria) + '"' + (fut ? ' disabled' : '') + fk('d-' + d.key) + '>' +
        '<span>' + d.d + '</span>' + (d.n ? '<small>' + esc(ids ? String(d.n) : M.pracFmt(d.sum)) + '</small>' : '') + '</button>';
    });
    h += '</div>';
    return h + dayHTML(it);
  }
  function dayHTML(it) {
    if (!st.day) return '<p class="note pr-pick">' + esc(T.pickDay) + '</p>';
    var ids = famOf(it), rows = M.pracDayLogs(st.data.logs, ids || it.id, st.day), adding = st.lf && st.lf.ctx === 'day';
    var h = '<div class="pr-dayd"><h3 class="pr-h3">' + esc(M.dlabel(st.day)) + '</h3>';
    if (!rows.length && !adding) h += '<p class="note">' + esc(T.dayEmpty) + '</p>';
    rows.forEach(function (l) {
      if (st.lf && st.lf.ctx === 'edit' && st.lf.log === l.id) { h += '<div class="pr-lg ed">' + logForm() + '</div>'; return; }
      var asking = st.ask === 'log:' + l.id;
      var li = itemById(l.itemId) || it;
      h += '<div class="pr-lg"><b>' + esc(M.pracFmt(l.amount)) + '<small> ' + esc(luOf(l)) + '</small></b>' + (ids && ids.length > 1 ? '<span class="pr-itag">' + esc(li.id === it.id ? fill(T.whole, { n: it.name }) : li.name) + '</span>' : '') + '<span class="pr-lgn">' + (l.what ? '<span class="pr-itag">' + esc(l.what) + '</span>' : '') + esc(l.note) + '</span>' +
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
    var ids = famOf(it), src = ids || it.id, wk = st.chart === 'week', rows = wk ? M.pracWeeks(st.data.logs, src, C.TODAY, P.weeks) : M.pracMonths(st.data.logs, src, C.TODAY, P.months);
    function val(r) { return ids ? r.n : r.sum; }
    var W = Math.max(260, Math.floor(el.clientWidth || 320)), H = 196, top = 24, bot = 30, padX = 4, n = rows.length;
    var slot = (W - padX * 2) / n, bw = Math.min(40, slot * 0.64), max = 0, color = safeColor(it.color), alt = [], h = '';
    var every = slot < 34 ? 2 : 1, fs = slot < 28 ? 10 : 11.5;
    rows.forEach(function (r) { if (val(r) > max) max = val(r); });
    rows.forEach(function (r, i) {
      var cx = padX + slot * i + slot / 2, last = i === n - 1, lab, full, p;
      if (wk) { p = ymd(r.start); lab = last ? T.thisWeekShort : p.m + '/' + p.d; full = fill(T.weekOf, { d: M.dlabel(r.start) }); }
      else { p = r.ym.split('-').map(Number); lab = last ? T.thisMonthShort : fill(T.monthShort, { m: p[1] }); full = fill(T.monthOf, { y: p[0], m: p[1] }); }
      if (r.n) alt.push(ids ? fill(T.barAltFam, { w: full, n: r.n }) : fill(T.barAlt, { w: full, s: M.pracFmt(r.sum), u: uo(it) }));
      if (r.n && max) {
        var bh = Math.max(3, (val(r) / max) * (H - top - bot)), y = H - bot - bh;
        h += '<g><title>' + esc(ids ? fill(T.barAltFam, { w: full, n: r.n }) : fill(T.barTip, { w: full, n: r.n, s: M.pracFmt(r.sum), u: uo(it) })) + '</title>' +
          '<rect x="' + (cx - bw / 2).toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + bh.toFixed(1) + '" rx="' + Math.min(6, bw / 3).toFixed(1) + '" fill="' + color + '"/>' +
          '<text x="' + cx.toFixed(1) + '" y="' + (y - 6).toFixed(1) + '" text-anchor="middle" class="v" style="font-size:' + fs + 'px">' + esc(M.pracFmt(val(r))) + '</text></g>';
      }
      if (last || (n - 1 - i) % every === 0) h += '<text x="' + cx.toFixed(1) + '" y="' + (H - 9) + '" text-anchor="middle" class="x' + (last ? ' now' : '') + '" style="font-size:' + fs + 'px">' + esc(lab) + '</text>';
    });
    if (!alt.length) { el.innerHTML = '<p class="note pr-cq">' + esc(T.chartNone) + '</p>'; return; }
    el.innerHTML = '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(fill(wk ? T.chartAltW : T.chartAltM, { c: n, list: alt.join(T.listSep) })) + '">' +
      '<line x1="0" x2="' + W + '" y1="' + (H - bot + 0.5) + '" y2="' + (H - bot + 0.5) + '" class="base"/>' + h + '</svg>';
  }

  // ── 寫下的：心得、筆記、感想不分類，選好項目就寫；重要的標星星 ──
  // 來源有兩種：在這裡寫的（跟著「我的練習」放本機或雲端），和在「練習」留下、標了這個項目的隨手記（可以帶照片）。
  function writings(it) {
    var ids = famIds(it), ann = C.O.ann || {}, out = [], insp = C.getInsp();
    var join = M.pracPhotoJoin(st.data.logs.filter(function (l) { return l && ids.indexOf(l.itemId) > -1; }), insp);
    st.data.notes.forEach(function (n) {
      if (ids.indexOf(n.itemId) < 0) return;
      out.push({ id: n.id, kind: 'note', itemId: n.itemId, key: n.updatedAt ? M.keyOf(new Date(n.updatedAt)) : '', at: n.updatedAt || 0,
        title: n.title && n.title !== M.pracTitleOf(n.body) ? n.title : '', body: n.body || '', star: !!n.star, photos: [] });
    });
    insp.forEach(function (x) {
      if (!x || ids.indexOf(x.itemId) < 0 || join.used[String(x.id)]) return;
      out.push({ id: String(x.id), kind: 'memo', local: !x.cloud && C.O.memos.indexOf(x) > -1, itemId: x.itemId, key: x.key || '', at: 0, title: '', body: x.text || '', star: !!(ann[x.id] && ann[x.id].star), photos: x.photos || [] });
    });
    // 記一筆時順手寫的那一句，或那一筆放的照片
    st.data.logs.forEach(function (l) {
      if (!l || ids.indexOf(l.itemId) < 0) return;
      var li = itemById(l.itemId), ph = join.byLog[l.id] || [];
      if (!l.note && !ph.length) return;
      out.push({ id: l.id, kind: 'log', itemId: l.itemId, key: l.date, at: l.at || 0, title: '', body: l.note || '', what: l.what || '', star: !!(ann[l.id] && ann[l.id].star), photos: ph, amount: M.pracFmt(l.amount), unit: luOf(l) });
    });
    return out.sort(function (a, b) { return a.key < b.key ? 1 : a.key > b.key ? -1 : b.at - a.at; });
  }
  function timeline(it) {
    var ids = famIds(it), out = writings(it), has = {};
    out.forEach(function (w) { if (w.kind === 'log') has[w.id] = 1; });
    st.data.logs.forEach(function (l) {
      if (!l || has[l.id] || ids.indexOf(l.itemId) < 0) return;
      var li = itemById(l.itemId);
      out.push({ id: l.id, kind: 'plain', itemId: l.itemId, key: l.date, at: l.at || 0, title: '', body: '', what: l.what || '', star: false, photos: [], amount: M.pracFmt(l.amount), unit: luOf(l) });
    });
    toolPages(it).forEach(function (p) {
      out.push({ id: 'tp-' + p.id, kind: 'tool', itemId: it.id, key: p.key, at: 0, title: p.title || '', body: [p.text, p.sub].concat(p.meta || []).filter(Boolean).join('・'), star: false, photos: [] });
    });
    return out.sort(function (a, b) { return a.key < b.key ? 1 : a.key > b.key ? -1 : b.at - a.at; });
  }
  function writeForm(it, w) {
    var key = w ? 'we-' + w.id : 'wr-' + it.id, ids = famIds(it), h;
    h = '<form class="pr-wform" data-form="write" data-item="' + esc(it.id) + '" data-id="' + esc(w ? w.id : '') + '" data-kind="' + (w ? w.kind : 'note') + '" novalidate>';
    if (!w) h += '<label class="note" for="pr-write">' + fillH(T.writeLabel, { n: it.name }) + '</label>';
    if (!w && ids.length > 1) h += '<label class="pr-win"><span class="note">' + esc(T.writeIn) + '</span><select class="in" name="item"' + fk(key + '-i') + '>' +
      ids.map(function (id) { var x = itemById(id); return '<option value="' + esc(id) + '">' + esc(x.name) + '</option>'; }).join('') + '</select></label>';
    var hint = w ? '' : hintOf(it);
    h += '<textarea class="pr-ta pr-grow" ' + (w ? '' : 'id="pr-write" ') + 'name="body" maxlength="' + P.max.body + '"' + (hint ? ' placeholder="' + esc(fill(T.writeMaybe, { h: hint })) + '"' : '') + (w ? ' aria-label="' + esc(T.writeEdit) + '"' : '') + fk(key) + '>' + esc(w ? (w.title ? w.title + '\n' : '') + w.body : '') + '</textarea>' +
      '<p class="pr-err" role="alert"></p><div class="row"><button class="btn fill" type="submit">' + esc(w ? T.save : T.writeKeep) + '</button>' +
      (w ? '<button class="btn" type="button" data-pa="wclose">' + esc(T.writeCancel) + '</button>' : '<button class="btn" type="button" data-pa="photo">' + esc(T.inspPhoto) + '</button>') + '</div></form>';
    return h;
  }
  function tabWrite(it) {
    var all = timeline(it), words = all.filter(function (w) { return w.kind !== 'plain' && w.kind !== 'tool'; }), stars = all.filter(function (w) { return w.star; });
    var list = st.wf === '1' ? stars : st.wf === 'w' ? words : all, h = '<p class="note">' + esc(T.zoneHint) + '</p>';
    if (!all.length) return h + '<p class="note pr-gap">' + esc(T.tlNone) + '</p>';
    function chip(v, label) { var on = st.wf === v; return '<button class="chip' + (on ? ' on' : '') + '" data-pa="wfilter" data-v="' + v + '" aria-pressed="' + on + '"' + fk('wf' + (v || '0')) + '>' + esc(label) + '</button>'; }
    if (words.length < all.length || stars.length || st.wf) h += '<div class="chips pr-gap" role="group" aria-label="' + esc(T.tabs.write) + '">' + chip('', T.writeAll) +
      (words.length && words.length < all.length || st.wf === 'w' ? chip('w', T.wfWords) : '') + (stars.length || st.wf === '1' ? chip('1', '★ ' + T.writeStar) : '') + '</div>';
    if (!list.length) h += '<p class="note pr-gap">' + esc(st.wf === '1' ? T.starNone : T.writeNone) + '</p>';
    var shown = list.slice(0, st.wn || P.page);
    h += '<div class="pr-ws">' + shown.map(function (w) {
      var sub = w.itemId !== it.id ? itemById(w.itemId) : null, on = st.nopen === w.id, asking = st.ask === 'w:' + w.id;
      var ph = picsOf(w), wtag = w.what ? '<span class="pr-itag">' + esc(w.what) + '</span>' : '';
      if (w.kind === 'plain') return '<div class="pr-w plain"><div class="pr-whead"><small>' + esc(M.dlabel(w.key)) + '</small>' + (sub ? '<span class="pr-itag">' + esc(sub.name) + '</span>' : '') + wtag +
        '<b class="pr-wamt">' + esc(w.amount) + ' <small>' + esc(w.unit) + '</small></b><button class="lnk" data-pa="wlog" data-id="' + esc(w.id) + '"' + fk('wed-' + w.id) + '>' + esc(T.edit) + '</button></div></div>';
      if (w.kind === 'tool') return '<div class="pr-w tool"><div class="pr-whead"><small>' + esc(M.dlabel(w.key)) + '</small><span class="pr-itag">' + esc(w.title) + '</span><span class="note">' + esc(T.tlTool) + '</span></div>' +
        (w.body ? '<p class="pr-wbody">' + esc(w.body) + '</p>' : '') + '</div>';
      var r = '<div class="pr-w' + (w.star ? ' star' : '') + '"><div class="pr-whead"><small>' + esc(w.key ? M.dlabel(w.key) : '') + '</small>' +
        (sub ? '<span class="pr-itag">' + esc(sub.name) + '</span>' : '') + (w.kind === 'log' ? wtag : '') + (w.kind === 'memo' ? '<span class="note">' + esc(T.writeFromToday) + '</span>' : w.kind === 'log' ? '<span class="note">' + esc(fill(w.body ? T.writeFromLog : T.logOnly, { a: w.amount, u: w.unit })) + '</span>' : '') +
        '<button class="pr-star" data-pa="wstar" data-id="' + esc(w.id) + '" data-kind="' + w.kind + '" aria-pressed="' + w.star + '" aria-label="' + esc(w.star ? T.unstar : T.star) + '" title="' + esc(w.star ? T.unstar : T.star) + '"' + fk('ws-' + w.id) + '>' + (w.star ? '★' : '☆') + '</button></div>';
      if (on) return r + writeForm(it, w) + '</div>';
      r += (w.title ? '<b class="pr-wt">' + esc(w.title) + '</b>' : '') + (w.body ? '<p class="pr-wbody">' + esc(w.body) + '</p>' : '') +
        (ph.length ? '<div class="pr-thumbs">' + ph.map(function (p) { return '<figure><img src="' + esc(p.data) + '" alt="' + esc(p.caption || '') + '" loading="lazy">' + (p.caption ? '<figcaption>' + esc(p.caption) + '</figcaption>' : '') + '</figure>'; }).join('') + '</div>' : '');
      if (w.kind === 'log') r += '<div class="pr-wacts"><button class="lnk" data-pa="wlog" data-id="' + esc(w.id) + '"' + fk('wed-' + w.id) + '>' + esc(T.writeLogEdit) + '</button>' + (ph.length ? '<button class="lnk" data-pa="wgo"' + fk('wpg-' + w.id) + '>' + esc(T.picManage) + '</button>' : '') + '</div>';
      else if (w.kind === 'memo' && !w.local) r += '<div class="pr-wacts"><button class="lnk" data-pa="wgo"' + fk('wed-' + w.id) + '>' + esc(T.writeGo) + '</button></div>';
      else r += '<div class="pr-wacts">' + (asking ? '<span class="note">' + esc(T.writeDelAsk) + '</span><button class="btn sm fill" data-pa="wdelyes" data-id="' + esc(w.id) + '" data-kind="' + w.kind + '"' + fk('wy-' + w.id) + '>' + esc(T.delYes) + '</button><button class="lnk" data-pa="nask" data-back="' + esc('wd-' + w.id) + '">' + esc(T.cancel) + '</button>'
        : '<button class="lnk" data-pa="wedit" data-id="' + esc(w.id) + '"' + fk('wed-' + w.id) + '>' + esc(T.writeEdit) + '</button><button class="lnk" data-pa="wdel" data-id="' + esc(w.id) + '"' + fk('wd-' + w.id) + '>' + esc(T.writeDel) + '</button>') + '</div>';
      return r + '</div>';
    }).join('') + '</div>';
    if (shown.length < list.length) h += '<div class="row pr-gap"><button class="btn sm" data-pa="wmore"' + fk('wmore') + '>' + esc(fill(T.wMore, { n: list.length - shown.length })) + '</button></div>';
    return h;
  }

  function tabSet(it) {
    var nl = st.data.logs.filter(function (l) { return l.itemId === it.id; }).length, nn = st.data.notes.filter(function (n) { return n.itemId === it.id; }).length;
    var h = '<h3 class="pr-h3">' + esc(T.setTitle) + '</h3>' + itemForm('edit', it), hasKids = M.pracKids(items(), it.id).length > 0;
    if (!parentId(it) && !it.archived && !hasKids) h += '<div class="pr-blk"><p class="note">' + esc(T.kidSetNote) + '</p><div class="row pr-gap"><button class="btn sm" data-pa="kidnew"' + fk('kidset') + '>' + esc(T.kidSet) + '</button></div></div>';
    h += '<div class="pr-blk"><p class="note">' + esc(T.archiveNote) + '</p><div class="row pr-gap"><button class="btn sm" data-pa="arch"' + fk('ar') + '>' + esc(it.archived ? T.unarchive : T.archive) + '</button></div></div>';
    h += '<div class="pr-blk">' + (st.ask === 'item' ? '<p class="pr-warn">' + esc(fill(T.delItemAsk, { n: it.name, l: nl, k: nn }) + (hasKids ? T.delKids : '')) + '</p><div class="row pr-gap"><button class="btn sm fill" data-pa="idelyes"' + fk('iy') + '>' + esc(T.delYes) + '</button><button class="lnk" data-pa="nask" data-back="idel">' + esc(T.cancel) + '</button></div>'
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
      var msg = e && e.message === 'pic' ? T.picFail : T.fail;
      C.toast(msg);
      if (form) setErr(form, msg);
    });
  }
  function openLog(ctx, itemId, extra, back) {
    var f = { ctx: ctx, item: itemId, back: back };
    if (extra) { f.log = extra.log || ''; f.date = extra.date || ''; }
    if (!f.log) f.nid = M.pracId('pl-');
    st.lf = f; st.focus = lfKey() + '-a'; st.select = true; st.ask = '';
    if (isFam(f)) st.focus = lfKey() + '-a-' + famRows(itemById(itemId), f)[0].id;
  }
  function closeLog() { var b = st.lf && st.lf.back; st.lf = null; if (b) st.focus = b; }
  function submitLog(form) {
    var f = st.lf, it = f && itemById(f.item);
    if (!it) return;
    var old = f.log ? logById(f.log) : null, el = form.elements;
    // 那一欄沒顯示（設定裡關掉了）時，改舊紀錄不動它原本記的「哪一個」
    var r = M.pracLogCheck({ date: el.date.value, amount: el.amount.value, note: el.note.value, what: el.what ? el.what.value : (old ? old.what : ''), unit: el.unit ? el.unit.value : (old ? old.unit : '') }, C.TODAY, P.max);
    if (!r.ok) { setErr(form, P.err[r.err], r.err === 'future' || r.err === 'date' ? (el.date.type === 'hidden' ? '' : 'date') : r.err === 'note' ? 'note' : r.err === 'what' ? 'what' : 'amount'); return; }
    var lg = { id: old ? old.id : (f.nid || (f.nid = M.pracId('pl-'))), itemId: it.id, date: r.log.date, amount: r.log.amount, note: r.log.note, at: old ? (old.at || Date.now()) : Date.now() };
    if (r.log.what) lg.what = r.log.what;
    if (r.log.unit && r.log.unit !== it.unit) lg.unit = r.log.unit;
    // 照片先存（存成同項目、同一天的一筆隨手記）；存不成就停在表單上，這一筆也不記。存過了重試時不再存第二次。
    var pics = !old && f.pics && f.pics.length ? f.pics.slice() : null, job = Promise.resolve();
    if (pics && !f.picDone) job = timed(function () { return C.savePhotos({ key: lg.date, text: lg.what || '', itemId: it.id, photos: pics }); }, D.insp.saveTimeoutMs)
      .then(function () { f.picDone = true; }, function () { throw new Error('pic'); });
    run(form, job.then(function () { return store.putLog(lg); }), function () {
      upsert(st.data.logs, lg);
      var msg = lg.date === C.TODAY ? fill(T.logged, { n: it.name, a: M.pracFmt(lg.amount), u: lg.unit || it.unit }) : fill(T.loggedOn, { d: M.dlabel(lg.date), n: it.name, a: M.pracFmt(lg.amount), u: lg.unit || it.unit });
      if (f.ctx === 'zone' || f.ctx === 'day' || f.ctx === 'edit') { var d = ymd(lg.date); st.calY = d.y; st.calM = d.m; st.day = lg.date; }
      closeLog();
      if (f.ctx === 'edit') st.focus = 'le-' + lg.id;
      if (f.ctx === 'day') st.focus = 'da';
      C.toast(msg); announce(msg); render(true);
      if (pics) C.refresh();
    });
  }
  // 記一筆時挑的照片：縮小後先放在表單上，按「記下來」才存
  function onPics(inp) {
    var f = st.lf, I = D.insp, files;
    if (!f || !g.JteCloud) return;
    f.pics = f.pics || [];
    files = Array.prototype.slice.call(inp.files || [], 0, Math.max(0, I.maxPhotos - f.pics.length)); inp.value = '';
    files.reduce(function (pr, file) {
      return pr.then(function () {
        return g.JteCloud.compress(file, I).then(function (d) {
          if (st.lf !== f || f.pics.length >= I.maxPhotos) return;
          f.pics.push({ data: d, caption: '' }); f.picDone = false; render(true);
        }, function () { C.toast(I.compressFail); });
      });
    }, Promise.resolve());
  }
  function submitFam(form) {
    var f = st.lf, it = f && itemById(f.item);
    if (!it) return;
    var el = form.elements, rows = famRows(it, f), out = [], i, k, v, r;
    f.nids = f.nids || {};
    for (i = 0; i < rows.length; i++) {
      k = rows[i]; v = el['a-' + k.id] ? String(el['a-' + k.id].value).replace(/^\s+|\s+$/g, '') : '';
      if (!v) continue;
      r = M.pracLogCheck({ date: el.date.value, amount: v, note: out.length ? '' : el.note.value, unit: el['u-' + k.id] ? el['u-' + k.id].value : '' }, C.TODAY, P.max);
      if (!r.ok) { setErr(form, P.err[r.err], r.err === 'amount' ? 'a-' + k.id : r.err === 'note' ? 'note' : r.err === 'unit' ? 'u-' + k.id : el.date.type === 'hidden' ? '' : 'date'); return; }
      out.push({ id: f.nids[k.id] || (f.nids[k.id] = M.pracId('pl-')), itemId: k.id, date: r.log.date, amount: r.log.amount, note: r.log.note, at: Date.now() + out.length });
      if (r.log.unit && r.log.unit !== k.unit) out[out.length - 1].unit = r.log.unit;
    }
    if (!out.length) { setErr(form, P.err.fam, 'a-' + rows[0].id); return; }
    var chain = Promise.resolve();
    out.forEach(function (lg) { chain = chain.then(function () { return store.putLog(lg).then(function () { upsert(st.data.logs, lg); }); }); });
    run(form, chain, function () {
      var msg = fill(T.loggedFam, { n: it.name, c: out.length }), d = ymd(out[0].date);
      if (f.ctx === 'zone' || f.ctx === 'day') { st.calY = d.y; st.calM = d.m; st.day = out[0].date; }
      closeLog();
      if (f.ctx === 'day') st.focus = 'da';
      C.toast(msg); announce(msg); render(true);
    });
  }
  function submitItem(form) {
    var mode = form.getAttribute('data-mode'), el = form.elements, col = form.querySelector('input[name$="-color"]:checked'), ic = form.querySelector('input[name$="-icon"]:checked');
    var tks = []; each(form.querySelectorAll('input[name="tool"]:checked'), function (c) { tks.push(c.value); });
    var r = M.pracItemCheck({ name: el.name.value, unit: el.unit.value, color: col ? col.value : '', icon: ic ? ic.value : '', goal: el.goal ? el.goal.value : '', tools: tks,
      parent: el.parent ? el.parent.value : mode === 'new' && st.itf ? st.itf.parent : (itemById(st.item) || {}).parent }, P.max);
    if (!r.ok) { setErr(form, P.err[r.err], r.err); return; }
    var askV = el.ask ? M.pracWhat(el.ask.value) : null;
    if (askV !== null && askV.length > P.max.ask) { setErr(form, P.err.ask, 'ask'); return; }
    var hintV = el.hint ? M.pracWhat(el.hint.value) : null;
    if (hintV !== null && hintV.length > P.max.hint) { setErr(form, P.err.hint, 'hint'); return; }
    var it, selfId = mode === 'new' ? '' : st.item, pr = itemById(r.item.parent);
    // 只能放在「大項目」底下；自己底下已經有小項目的，不能再放到別人底下
    if (!pr || pr.id === selfId || parentId(pr) || (selfId && M.pracKids(items(), selfId).length)) r.item.parent = '';
    pr = itemById(r.item.parent);
    if (mode === 'new') it = { id: (st.itf && st.itf.id) || M.pracId('pi-'), name: r.item.name, unit: r.item.unit, color: pr ? safeColor(pr.color) : P.colors[topLevel(items()).length % P.colors.length],
      icon: iconFor(r.item.name), goal: '', parent: r.item.parent, archived: false, createdAt: Date.now() };
    else { it = copy(itemById(st.item)); it.name = r.item.name; it.unit = r.item.unit; it.color = pr ? safeColor(pr.color) : col ? safeColor(r.item.color) : safeColor(it.color); it.icon = r.item.icon; it.goal = r.item.goal; it.parent = r.item.parent; if (r.item.tools) it.tools = r.item.tools; else delete it.tools; }
    var askWas = mode === 'edit' ? askOf(itemById(st.item)) : '', hintWas = mode === 'edit' ? hintOf(itemById(st.item)) : '';
    run(form, store.putItem(it), function () {
      upsert(st.data.items, it);
      // 多問的那一欄有改才記：和預設一樣就不另外存，清空就是關掉
      if (askV !== null && askV !== askWas) { var kd = kindOf(it); setAsk(it.id, askV ? (kd && kd.ask === askV ? '' : askV) : '-'); }
      tidyUnits(it);
      if (hintV !== null && hintV !== hintWas) { var kh = kindOf(it); setOwn('pracHint', it.id, hintV ? (kh && kh.hint === hintV ? '' : hintV) : (kh && kh.hint ? '-' : '')); }
      if (mode === 'new') { st.itf = null; st.focus = st.item ? 'kid-' + it.id : 'cl-' + it.id; C.toast(fill(T.added, { n: it.name })); }
      else C.toast(T.saved);
      render(true); C.refresh();
    });
  }
  function submitWrite(form) {
    var id = form.getAttribute('data-id'), el = form.elements, old = id ? noteById(id) : null, ctx = form.getAttribute('data-item') || st.item, cur = itemById(ctx);
    var r = M.pracWriteCheck({ body: el.body.value }, P.max);
    if (!r.ok) { setErr(form, P.err[r.err], 'body'); return; }
    if (id && form.getAttribute('data-kind') === 'memo') {
      // 在「練習」留下、只存在這台裝置的隨手記：就地改
      C.editMemo(id, r.note.body); st.nopen = ''; st.focus = 'wed-' + id; C.toast(T.saved); announce(T.saved); render(true); return;
    }
    if (id && !old) return;
    var target = el.item && cur && famIds(cur).indexOf(el.item.value) > -1 ? el.item.value : ctx, n;
    if (old) { n = copy(old); n.title = r.note.title; n.body = r.note.body; }
    else n = { id: st.nnid || (st.nnid = M.pracId('pn-')), itemId: target, title: r.note.title, body: r.note.body, updatedAt: Date.now() };
    run(form, store.putNote(n), function () {
      upsert(st.data.notes, n); st.nopen = ''; st.nnid = ''; st.qw = ''; st.focus = old ? 'wed-' + n.id : st.item ? 'wr-' + st.item : 'qr-' + ctx;
      C.toast(old ? T.saved : T.writeKept); announce(old ? T.saved : T.writeKept); render(true); C.refresh();
    });
  }

  function onSubmit(e) {
    var form = e.target.closest('form[data-form]');
    if (!form) return;
    e.preventDefault();
    if (busy()) return;
    var k = form.getAttribute('data-form');
    if (k === 'log') submitLog(form);
    else if (k === 'item') submitItem(form);
    else if (k === 'write') submitWrite(form);
    else if (k === 'fam') submitFam(form);
  }
  // 「練習」的項目設定裡直接換單位：選了就存
  function onUnitPick(e) {
    if (e.target && e.target.classList && e.target.classList.contains('pr-picin')) { onPics(e.target); return; }
    var t = e.target, id = t && t.getAttribute && t.getAttribute('data-qunit'), it = id && itemById(id), x;
    if (!it || busy()) return;
    if (!t.value || t.value === it.unit || t.value.length > P.max.unit) return;
    x = copy(it); x.unit = t.value;
    run(null, store.putItem(x), function () { upsert(st.data.items, x); tidyUnits(x); st.focus = 'qu-' + x.id; C.toast(fill(T.qunitDone, { n: x.name, u: x.unit })); render(true); C.refresh(); });
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
      // 「練習」上的項目設定在原地開合；新增項目要填的東西多，帶到「練習」填
      case 'qmgr': st.qmgr = !st.qmgr; st.focus = 'qmgr'; break;
      case 'qrow': st.qx = st.qx === id ? '' : id; st.focus = 'qr-' + id; break;
      case 'qnew': st.itf = newItf('', ''); st.lf = null; st.mgr = false; st.qmgr = false; st.focus = 'if-new-name'; C.goPane('practice'); break;
      case 'mgr': st.mgr = !st.mgr; st.focus = 'mgr'; break;
      case 'iset': st.want = 'set'; st.mgr = false; C.goPane('practice-item-' + id); return;
      case 'new': st.itf = newItf('', ''); st.lf = null; st.focus = 'if-new-name'; break;
      case 'ex':
        x = P.examples[+b.getAttribute('data-i')];
        if (!x) return;
        form = b.closest('form');
        if (form) { form.elements.name.value = x.name; form.elements.unit.value = x.unit; syncUnits(form); return; }
        st.itf = newItf(x.name, x.unit); st.focus = 'if-new-save'; break;
      case 'icancel': st.focus = st.itf && st.itf.parent && st.item ? 'kidnew' : 'new'; if (!st.item) st.mgr = true; st.itf = null; break;
      case 'unit':
        form = b.closest('form');
        form.elements.unit.value = b.getAttribute('data-u'); syncUnits(form); return;
      // 新增項目：點一個預設，名稱和單位一起帶好
      case 'pre':
        x = presets()[+b.getAttribute('data-i')]; form = b.closest('form');
        if (!x || !form) return;
        form.elements.name.value = x.name; form.elements.unit.value = x.unit; form.setAttribute('data-au', x.unit); syncUnits(form); return;
      // 加單位：打開／收起某個項目的小編輯區；常用單位點了就加、再點拿掉；自己填的按「加」
      case 'uxopen': st.qu = st.qu === id ? '' : id; st.focus = 'uxo-' + id; break;
      case 'uxdone': st.qu = ''; st.focus = 'uxo-' + id; break;
      case 'uxt': case 'uxadd':
        x = itemById(id); if (!x) return;
        var uxl = extraUnits(x).slice(), uxin = a === 'uxadd' ? b.parentNode.querySelector('.pr-uxin') : null, uxu = M.pracWhat(a === 'uxadd' ? (uxin ? uxin.value : '') : b.getAttribute('data-u'));
        if (!uxu || uxu.length > P.max.unit) { C.toast(P.err.unit); if (uxin) uxin.focus(); return; }
        if (unitsOf(x).indexOf(uxu) > -1) {
          if (a === 'uxadd' || uxu === x.unit) { C.toast(T.uxSame); return; }
          if (logUnits(x).some(function (o) { return o.unit === uxu; })) { C.toast(fill(T.uxUsed, { u: uxu })); return; }
          uxl = uxl.filter(function (u) { return u !== uxu; });
        } else {
          if (uxl.length >= P.max.units) { C.toast(fill(T.uxFull, { n: P.max.units })); return; }
          uxl.push(uxu);
        }
        if (uxin) uxin.value = '';
        setOwn('pracUnits', x.id, uxl.length ? uxl : ''); st.focus = b.getAttribute('data-k') || ''; break;
      // 記一筆：點記過的「哪一個」就填進去，再點一次清掉
      case 'what':
        form = b.closest('form'); x = b.getAttribute('data-v');
        if (!form || !form.elements.what) return;
        form.elements.what.value = form.elements.what.value === x ? '' : x; syncWhat(form); return;
      // 記一筆：選這次的單位
      case 'lunit':
        x = b.closest('[data-ug]'); if (!x) return;
        x.querySelector('input[type=hidden]').value = b.getAttribute('data-v'); syncUps(x); return;
      case 'picadd':
        if (!st.lf || !C.photoReady()) return;
        if ((st.lf.pics || []).length >= D.insp.maxPhotos) { C.toast(fill(D.insp.full, { n: D.insp.maxPhotos })); return; }
        x = b.closest('form').querySelector('.pr-picin'); if (x) x.click();
        return;
      case 'picdel':
        if (!st.lf || !st.lf.pics) return;
        st.lf.pics.splice(+b.getAttribute('data-i'), 1); st.lf.picDone = false; st.focus = lfKey() + '-p'; break;
      case 'qopen': if (st.lf && st.lf.ctx === 'quick' && st.lf.item === id) closeLog(); else openLog('quick', id, null, 'qp-' + id); break;
      case 'copen': if (st.lf && st.lf.ctx === 'card' && st.lf.item === id) closeLog(); else openLog('card', id, null, 'cl-' + id); break;
      case 'zopen': if (st.lf && st.lf.ctx === 'zone') closeLog(); else openLog('zone', st.item, null, 'zl'); break;
      case 'dadd': openLog('day', st.item, { date: st.day }, 'da'); break;
      case 'ledit': x = logById(b.getAttribute('data-log')); if (!x) return; openLog('edit', x.itemId, { log: x.id }, 'le-' + x.id); break;
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
      case 'wedit': st.nopen = id; st.ask = ''; st.focus = 'we-' + id; break;
      case 'wclose': x = st.nopen; st.nopen = ''; st.focus = 'wed-' + x; break;
      case 'rcwrite': st.qw = st.qw === id ? '' : id; st.nnid = ''; st.focus = st.qw ? 'wr-' + id : 'rcw'; break;
      case 'rcall': st.want = 'tab'; C.goPane('practice-item-' + id); return;
      case 'gotoday': C.goPane('today'); return;
      case 'wmore': st.wn = (st.wn || P.page) + P.page; st.focus = 'wmore'; break;
      case 'wfilter': st.wf = b.getAttribute('data-v') || ''; st.wn = 0; st.nopen = ''; st.ask = ''; st.focus = 'wf' + (st.wf || '0'); break;
      case 'aiask': st.ai = { item: st.item, state: 'ask' }; st.focus = 'aiyes'; break;
      case 'aino': st.ai = null; st.focus = 'aibtn'; break;
      case 'aigo': aiRun(); return;
      case 'wdel': st.ask = 'w:' + id; st.nopen = ''; st.focus = 'wy-' + id; break;
      case 'wdelyes':
        if (b.getAttribute('data-kind') === 'memo') { C.dropMemo(id); st.ask = ''; st.focus = 'wr-' + st.item; C.toast(T.deleted); announce(T.deleted); break; }
        run(null, store.delNote(id), function () { st.data.notes = drop(st.data.notes, id); st.ask = ''; st.focus = 'wr-' + st.item; C.toast(T.deleted); announce(T.deleted); render(true); C.refresh(); });
        return;
      case 'wstar':
        st.focus = 'ws-' + id;
        if (b.getAttribute('data-kind') === 'note') {
          x = noteById(id); if (!x) return;
          x = copy(x); if (x.star) delete x.star; else x.star = true;
          run(null, store.putNote(x), function () { upsert(st.data.notes, x); render(true); C.refresh(); });
          return;
        }
        // 在「練習」留下的隨手記：星星和它的標籤一樣，記在這台裝置
        if (!C.O.ann) C.O.ann = {};
        x = C.O.ann[id] || (C.O.ann[id] = {});
        if (x.star) delete x.star; else x.star = true;
        C.save(); render(true); C.refresh(); return;
      case 'wgo': C.goPane('trail'); return;
      case 'wlog':
        x = logById(id); if (!x) return;
        st.tab = 'log'; st.day = x.date; st.calY = ymd(x.date).y; st.calM = ymd(x.date).m; st.nopen = ''; st.ask = '';
        openLog('edit', x.itemId, { log: x.id }, 'le-' + x.id); break;
      case 'famwhole': if (st.lf) { st.lf.whole = true; st.focus = lfKey() + '-a-' + st.lf.item; } break;
      case 'qown': st.itf = newItf('', ''); st.lf = null; st.focus = 'if-new-name'; C.goPane('practice'); return;
      case 'qex':
        x = P.examples[+b.getAttribute('data-i')];
        if (!x) return;
        x = { id: M.pracId('pi-'), name: x.name, unit: x.unit, color: P.colors[0], icon: iconFor(x.name), goal: '', parent: '', archived: false, createdAt: Date.now() };
        run(null, store.putItem(x), function () { upsert(st.data.items, x); openLog('quick', x.id, null, 'qp-' + x.id); C.toast(fill(T.added, { n: x.name })); render(true); C.refresh(); });
        return;
      // 項目設定裡點一個預設的練習：直接加進來，留在原地（接著可以改單位）
      case 'qpre':
        x = presets()[+b.getAttribute('data-i')];
        if (!x) return;
        x = { id: M.pracId('pi-'), name: x.name, unit: x.unit, color: P.colors[topLevel(items()).length % P.colors.length], icon: iconFor(x.name), goal: '', parent: '', archived: false, createdAt: Date.now() };
        run(null, store.putItem(x), function () { upsert(st.data.items, x); st.focus = 'qu-' + x.id; C.toast(fill(T.qpreAdded, { n: x.name })); announce(fill(T.qpreAdded, { n: x.name })); render(true); C.refresh(); });
        return;
      case 'goaledit': st.focus = 'if-edit-goal'; setTab('set'); return;
      case 'kidnew':
        if (!it) return;
        st.itf = newItf('', it.unit); st.itf.parent = it.id; st.itf.color = it.color; st.lf = null; st.focus = 'if-new-name'; break;
      case 'arch':
        if (!it) return;
        x = copy(it); x.archived = !it.archived;
        run(null, store.putItem(x), function () { upsert(st.data.items, x); st.focus = 'ar'; C.toast(x.archived ? T.archivedDone : T.unarchivedDone); render(true); });
        return;
      case 'idel': st.ask = 'item'; st.focus = 'iy'; break;
      case 'idelyes':
        if (!it) return;
        x = it.id;
        // 底下的小項目留著，變成獨立的項目
        var chain = Promise.resolve();
        M.pracKids(items(), x).forEach(function (k) {
          var c = copy(k); c.parent = '';
          chain = chain.then(function () { return store.putItem(c).then(function () { upsert(st.data.items, c); }); });
        });
        run(null, chain.then(function () { return store.delItem(x); }), function () {
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
  function syncWhat(form) {
    var v = form.elements.what.value;
    each(form.querySelectorAll('[data-pa=what]'), function (c) { var on = c.getAttribute('data-v') === v; c.classList.toggle('on', on); c.setAttribute('aria-pressed', String(on)); });
  }
  // 新增項目時邊打名稱邊配單位：名稱對到預設、單位還沒自己填過，就先帶預設的單位
  function autoUnit(form) {
    var u = form.elements.unit, k = M.pracKind(form.elements.name.value, P.kinds), was = form.getAttribute('data-au') || '';
    if (!u || (u.value && u.value !== was) || (!k && !was)) return;
    // 名稱改到對不上預設了：剛才自動帶的單位收回來，不留一個不相干的
    u.value = k ? k.unit : ''; form.setAttribute('data-au', u.value); syncUnits(form);
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
    if (e.key === 'Enter' && t.classList && t.classList.contains('pr-uxin')) { e.preventDefault(); var ub = t.parentNode.querySelector('[data-pa=uxadd]'); if (ub) ub.click(); return; }
    if (e.key === 'Escape' && st.lf && t.closest && t.closest('form[data-form=log]')) { e.preventDefault(); closeLog(); render(true); }
  }
  function onInput(e) {
    var t = e.target;
    if (t.getAttribute('aria-invalid')) t.removeAttribute('aria-invalid');
    if (t.name === 'unit' && t.form) syncUnits(t.form);
    if (t.name === 'what' && t.form) syncWhat(t.form);
    if (t.name === 'name' && t.form && t.form.getAttribute('data-mode') === 'new') autoUnit(t.form);
    if (t.classList && t.classList.contains('pr-grow')) { t.style.height = 'auto'; t.style.height = (t.scrollHeight + 2) + 'px'; }
  }

  // ── 對外介面 ──
  // 輸入欄位正被使用時，不整個重畫那一區（會斷掉輸入法組字、清掉錯誤訊息與選取）；
  // 自己的動作（送出、取消、切分頁…）傳 force 一定重畫。
  function focusIn(root) { var a = document.activeElement; return !!(a && a !== root && root.contains(a) && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)); }
  function render(force) {
    if (!inited) return;
    if (C.onState) C.onState();
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
    // 重畫後輸入框的字是還原回來的，記過的選項要跟著它亮
    roots().forEach(function (r) { each(r.querySelectorAll('form[data-form=log]'), function (f) { if (f.elements.what) syncWhat(f); }); each(r.querySelectorAll('[data-ug]'), syncUps); });
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
      st.item = id; st.tab = st.want === 'set' ? 'set' : st.want ? 'write' : 'log'; st.day = ''; st.ask = ''; st.nopen = ''; st.wf = ''; st.wn = 0; st.ai = null; st.itf = null; st.calY = cur.y; st.calM = cur.m;
      if (st.lf && st.lf.ctx !== 'quick') st.lf = null;
      st.focus = st.want === 'focus' ? 'wr-' + id : st.want === 'set' ? 't-set' : st.want ? 't-write' : 'zh'; st.want = '';
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
    var hh = $('#h-prac'), pn = $('#pracnote');
    if (hh) hh.textContent = T.title;
    if (pn) pn.textContent = T.note;
    live = document.createElement('div'); live.className = 'pr-sr'; live.setAttribute('aria-live', 'polite'); document.body.appendChild(live);
    if (C.DEMO) {
      store = demoStore(); st.data = demoData();
      P.demo.memos.forEach(function (x, i) { C.O.memos.push({ id: 'm-demo-p' + i, key: M.addDays(C.TODAY, -x.days), text: x.text, itemId: x.itemId }); });
    } else { store = localStore(); st.seen = C.O.prac; st.data = M.pracClean(C.O.prac); }
    var cur = nowYM(); st.calY = cur.y; st.calM = cur.m;
    [box, quick, zone].forEach(function (r) {
      r.addEventListener('click', onClick); r.addEventListener('submit', onSubmit);
      r.addEventListener('keydown', onKey); r.addEventListener('input', onInput); r.addEventListener('focusout', onFocusOut);
      r.addEventListener('change', onUnitPick);
    });
    var tm = null;
    window.addEventListener('resize', function () { clearTimeout(tm); tm = setTimeout(function () { if (st.item && st.tab === 'log' && !zone.hidden) drawChart(); }, 150); });
    inited = true;
  }
  function exportData() {
    return { items: st.data.items.map(copy), logs: st.data.logs.map(copy), notes: st.data.notes.map(copy) };
  }

  // 給 index.html 的靈感框、足跡、資料說明用
  function activeItems() { return ordered(active()).map(function (x) { return { id: x.id, name: fullName(x), goal: x.goal || '' }; }); }
  // 在項目頁寫下的，也排進「我的地圖」的紀錄（要改、要刪回項目頁）
  function notePages() {
    return st.data.notes.filter(function (n) { return n && n.body && itemById(n.itemId); }).map(function (n) {
      return { id: n.id, key: n.updatedAt ? M.keyOf(new Date(n.updatedAt)) : C.TODAY, text: n.body, itemId: n.itemId, pn: true };
    });
  }
  function starred(id) { var n = noteById(id); return !!(n && n.star); }
  function itemIcon(id) { var it = id ? itemById(id) : null, k = iconOf(it) || iconOf(itemById(parentId(it))); return k ? iconSrc(k) : ''; }
  function itemName(id) { var it = id ? itemById(id) : null; return it ? fullName(it) : ''; }
  function mode() { return store && store.kind === 'cloud' ? 'cloud' : store && store.kind === 'out' ? 'out' : 'local'; }

  // 一次加幾個項目（第一次進來的流程用）：[{name, unit, amount?}]。同名的不重複加；給了 amount 就順手記今天一筆。
  function quickAdd(list) {
    var chain = Promise.resolve();
    (list || []).forEach(function (x, i) {
      var r = M.pracItemCheck({ name: x.name, unit: x.unit, color: '' }, P.max);
      if (!r.ok) return;
      chain = chain.then(function () {
        if (st.data.items.some(function (o) { return o.name === r.item.name; })) return null;
        var it = { id: M.pracId('pi-'), name: r.item.name, unit: r.item.unit, color: P.colors[st.data.items.length % P.colors.length], icon: iconFor(r.item.name), archived: false, createdAt: Date.now() + i };
        return store.putItem(it).then(function () {
          upsert(st.data.items, it);
          if (!(x.amount > 0)) return null;
          var lg = { id: M.pracId('pl-'), itemId: it.id, date: C.TODAY, amount: x.amount, note: '', at: Date.now() };
          return store.putLog(lg).then(function () { upsert(st.data.logs, lg); });
        });
      });
    });
    return chain.then(function () { render(true); });
  }

  g.JtePrac = { init: init, render: render, setUser: setUser, handleHash: handleHash, exportData: exportData,
    items: activeItems, itemName: itemName, itemIcon: itemIcon, notePages: notePages, starred: starred, mode: mode, pending: pending, quickAdd: quickAdd,
    move: move, moving: function () { return st.moving; }, cloudOff: function () { return !!st.cloudOff; } };
})(window);
