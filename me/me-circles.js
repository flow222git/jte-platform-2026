/* 我的練息場 /me — 一起練（正式版）
 * 雲端位置（Firebase 專案 lianxichang-me，和手帳其他雲端資料同一個）：
 *   circles/{cid}                    團：團名、練什麼、節奏、期限、開放或邀請制、團員 uid、每人最後打卡日（lastIn）
 *   circles/{cid}/members/{uid}      團員：團裡的名字、這週先休息
 *   circles/{cid}/checkins/{日期_uid} 打卡：那一句、鼓勵詞
 * 還沒加入的人只讀得到團本身（團名、人數、今天幾個人練了）；團員和打卡只有團員讀得到。規則在 repo 根目錄 firestore.rules。
 * 讀進來之後轉成和示範版一樣的形狀，畫面共用同一套：
 *   { id, name, tool, what, rhythm, span, start, open, owner, ended, members:[{id,name,resting}], checkins:[{id,who,k,at,text,cheers}] }
 * 依賴 vendor/ 的 firebase compat（由 me-cloud.js 初始化），不進自動測試。 */
(function (g) {
  'use strict';
  function fb() { return g.firebase; }
  function ready() { var f = fb(); return !!(f && f.apps && f.apps.length && f.auth && f.firestore); }
  function db() { return fb().firestore(); }
  function FV() { return fb().firestore.FieldValue; }
  function me() {
    var u = ready() && fb().auth().currentUser;
    if (!u) { var e = new Error('login'); e.code = 'circle/login'; throw e; }
    return u.uid;
  }
  function col() { return db().collection('circles'); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function safe(fn) { try { return Promise.resolve(fn()); } catch (e) { return Promise.reject(e); } }

  // 團本身（任何登入的人都讀得到的那一層）。今天練了幾個人，只能從 lastIn 數。
  function shape(d) {
    var x = d.data() || {}, ids = Array.isArray(x.members) ? x.members : [], last = x.lastIn || {};
    return { id: d.id, name: String(x.name || ''), tool: String(x.tool || ''), what: String(x.what || ''), rhythm: String(x.rhythm || ''),
      span: +x.span || 0, start: String(x.start || ''), open: !!x.open, owner: String(x.owner || ''), ended: !!x.ended, ids: ids,
      members: ids.map(function (id) { return { id: id, name: '' }; }),
      checkins: Object.keys(last).map(function (id) { return { id: 'last-' + id, who: id, k: String(last[id]), at: '', text: '', cheers: {} }; }) };
  }
  // 團員才讀得到的那一層：名字、休息、這七天的打卡。
  function fill(c, since) {
    var ref = col().doc(c.id);
    return Promise.all([ref.collection('members').get(), ref.collection('checkins').where('k', '>=', since).get()]).then(function (r) {
      var ms = {};
      r[0].forEach(function (d) { var x = d.data() || {}; ms[d.id] = { id: d.id, name: String(x.nick || ''), resting: !!x.resting }; });
      c.members = c.ids.map(function (id) { return ms[id] || { id: id, name: '' }; });
      c.checkins = [];
      r[1].forEach(function (d) {
        var x = d.data() || {}, t = x.at && x.at.toDate ? x.at.toDate() : null, k = String(x.k || '');
        c.checkins.push({ id: d.id, who: String(x.uid || ''), k: k, at: k + 'T' + (t ? pad(t.getHours()) + ':' + pad(t.getMinutes()) + ':' + pad(t.getSeconds()) : '00:00:00'),
          text: String(x.text || ''), cheers: x.cheers || {} });
      });
      return c;
    });
  }
  function mine(since) {
    return safe(function () {
      var u = me();
      return col().where('members', 'array-contains', u).get().then(function (s) {
        var out = []; s.forEach(function (d) { var c = shape(d); if (!c.ended) out.push(c); });
        return Promise.all(out.map(function (c) { return fill(c, since); }));
      });
    });
  }
  function openList(limit) {
    return safe(function () {
      me();
      return col().where('open', '==', true).limit(limit || 40).get().then(function (s) {
        var out = []; s.forEach(function (d) { var c = shape(d); if (!c.ended) out.push(c); }); return out;
      });
    });
  }
  // 邀請連結：知道團的代號就讀得到團本身（邀請制也是），還沒加入看不到團員與打卡。
  function one(cid) {
    return safe(function () {
      me();
      if (!/^[A-Za-z0-9]{10,40}$/.test(String(cid || ''))) return null;
      return col().doc(cid).get().then(function (d) { return d.exists ? shape(d) : null; }, function () { return null; });
    });
  }
  function create(c, nick) {
    return safe(function () {
      var u = me(), ref = col().doc(), b = db().batch(), now = FV().serverTimestamp();
      b.set(ref, { name: c.name, tool: c.tool || '', what: c.what || '', rhythm: c.rhythm || '', span: +c.span || 0, start: c.start, open: !!c.open,
        owner: u, members: [u], lastIn: {}, ended: false, createdAt: now });
      b.set(ref.collection('members').doc(u), { nick: nick, resting: false, joinedAt: now });
      return b.commit().then(function () { return ref.id; });
    });
  }
  function join(cid, nick) {
    return safe(function () {
      var u = me(), ref = col().doc(cid), b = db().batch();
      b.update(ref, { members: FV().arrayUnion(u) });
      b.set(ref.collection('members').doc(u), { nick: nick, resting: false, joinedAt: FV().serverTimestamp() });
      return b.commit();
    });
  }
  // 一天一次：打卡的文件代號就是「日期_uid」。同時把自己那一格 lastIn 改成今天，還沒加入的人才數得到今天幾個人練了。
  function checkin(cid, day, text) {
    return safe(function () {
      var u = me(), ref = col().doc(cid), b = db().batch(), up = {};
      b.set(ref.collection('checkins').doc(day + '_' + u), { uid: u, k: day, text: text || '', cheers: {}, at: FV().serverTimestamp() });
      up['lastIn.' + u] = day;
      b.update(ref, up);
      return b.commit();
    });
  }
  function cheer(cid, kid, word) {
    return safe(function () {
      var u = me(), up = {};
      up['cheers.' + u] = word ? word : FV().delete();
      return col().doc(cid).collection('checkins').doc(kid).update(up);
    });
  }
  function rest(cid, on) { return safe(function () { return col().doc(cid).collection('members').doc(me()).update({ resting: !!on }); }); }
  function nick(cids, name) {
    return safe(function () {
      var u = me();
      return Promise.all((cids || []).map(function (cid) { return col().doc(cid).collection('members').doc(u).update({ nick: name }).catch(function () {}); }));
    });
  }
  // 離開或被請離開：先刪這個人在團裡的打卡，再刪團員資料、把他從團裡拿掉。
  function drop(cid, who) {
    var ref = col().doc(cid);
    return ref.collection('checkins').where('uid', '==', who).get().then(function (s) {
      var jobs = []; s.forEach(function (d) { jobs.push(d.ref.delete()); }); return Promise.all(jobs);
    }).then(function () {
      var b = db().batch(), up = { members: FV().arrayRemove(who) };
      up['lastIn.' + who] = FV().delete();
      b.delete(ref.collection('members').doc(who));
      b.update(ref, up);
      return b.commit();
    });
  }
  function leave(cid) { return safe(function () { return drop(cid, me()); }); }
  function kick(cid, who) { return safe(function () { me(); return drop(cid, who); }); }
  function end(cid) { return safe(function () { me(); return col().doc(cid).update({ ended: true }); }); }

  g.JteCircles = { ready: ready, mine: mine, openList: openList, one: one, create: create, join: join, checkin: checkin, cheer: cheer,
    rest: rest, nick: nick, leave: leave, kick: kick, end: end };
})(window);
