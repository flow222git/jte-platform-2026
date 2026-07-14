/* octenso/vector.js — 向量函式層(canonical 引擎)
 * v0.1 · 2026-07-13 · 依 docs/superpowers/specs/2026-07-13-octenso-vector-functions-design.md
 *
 * 物件:八態向量 v ∈ [0,100]^8;四大系統座標=同一資訊的換底
 *   傾向 tilt = 左分支 − 右分支;開度 open = 兩分支平均
 * 函式:delta(重測差異)/similarity(形狀相似)——只做變化、相似、比對;
 *   不做加權求和、排名配權、文案混合(spec §4 否決紀錄)。
 * 誠實:NOISE 以內屬測量誤差,不敘事;描述位移,不解釋原因、不評好壞。
 */
(function (g) {
  'use strict';
  var P = g.OctensoProfile;
  var EKEYS = P.EKEYS, PAIRS = P.PAIRS;

  var NOISE = 8;          // v0.1 假設;重測信度資料進來後校正
  var D_FLOW = 6, D_SHIFT = 14; // 整體移動量分檔(RMS)

  // ── 四大系統座標(換底;免費取得)──
  function gateCoords(sc) {
    var out = {};
    PAIRS.forEach(function (p) {
      var l = sc[p.l] || 0, r = sc[p.r] || 0;
      out[p.key] = { tilt: l - r, open: Math.round((l + r) / 2 * 10) / 10 };
    });
    return out;
  }

  // ── 狀態分區:五種判讀=(傾向×開度)平面上的幾何分區 ──
  // 門檻同 profile.js TUNE(AXIS_HI/AXIS_LO/AXIS_EVEN),v0.1 待試測校正。
  // 判定順序與 profile.axes() 一致:先雙高、再雙低、再優勢分支、其餘=輪流。
  function tune() {
    var T = (P && P.TUNE) || {};
    return { HI: T.AXIS_HI || 60, LO: T.AXIS_LO || 40, EVEN: T.AXIS_EVEN || 12 };
  }
  function stateRegion(tilt, open) {
    var T = tune(), at = Math.abs(tilt);
    if (open >= T.HI + at / 2) return 'bothHigh';
    if (open <= T.LO - at / 2) return 'bothLow';
    if (at >= T.EVEN) return tilt > 0 ? 'leanL' : 'leanR';
    return 'mid';
  }
  // 分區底圖多邊形(資料座標 [tilt, open];頁面自行投影成像素)
  function regionShapes() {
    var T = tune();
    var tH = 2 * (100 - T.HI), tL = 2 * T.LO, E = T.EVEN;
    return {
      bothHigh: [[-tH, 100], [0, T.HI], [tH, 100]],
      bothLow: [[-tL, 0], [0, T.LO], [tL, 0]],
      leanL: [[E, T.HI + E / 2], [tH, 100], [100, 100], [100, 0], [tL, 0], [E, T.LO - E / 2]],
      leanR: [[-E, T.HI + E / 2], [-tH, 100], [-100, 100], [-100, 0], [-tL, 0], [-E, T.LO - E / 2]],
      mid: [[-E, T.HI + E / 2], [0, T.HI], [E, T.HI + E / 2], [E, T.LO - E / 2], [0, T.LO], [-E, T.LO - E / 2]]
    };
  }

  // ── 函式一:重測差異 Δ(prev → curr)──
  function delta(prev, curr) {
    var d = {}, sum2 = 0;
    EKEYS.forEach(function (k) {
      var dv = (curr[k] || 0) - (prev[k] || 0);
      d[k] = dv; sum2 += dv * dv;
    });
    var D = Math.round(Math.sqrt(sum2 / EKEYS.length) * 10) / 10;
    var moved = EKEYS.filter(function (k) { return Math.abs(d[k]) >= NOISE; })
      .sort(function (a, b) { return Math.abs(d[b]) - Math.abs(d[a]); })
      .map(function (k) { return { k: k, d: d[k] }; });
    var g1 = gateCoords(prev), g2 = gateCoords(curr), gates = {};
    PAIRS.forEach(function (p) {
      var a = g1[p.key], b = g2[p.key];
      gates[p.key] = {
        tilt1: a.tilt, tilt2: b.tilt, dTilt: b.tilt - a.tilt,
        open1: a.open, open2: b.open, dOpen: Math.round((b.open - a.open) * 10) / 10
      };
    });
    return {
      d: d, D: D,
      band: D < D_FLOW ? 'steady' : (D <= D_SHIFT ? 'flow' : 'shift'),
      moved: moved, gates: gates
    };
  }

  // ── 函式二:形狀相似(去水平後餘弦;水平差另報)──
  function similarity(a, b) {
    function center(v) {
      var m = 0; EKEYS.forEach(function (k) { m += (v[k] || 0); }); m /= EKEYS.length;
      return { arr: EKEYS.map(function (k) { return (v[k] || 0) - m; }), mean: m };
    }
    var ca = center(a), cb = center(b), dot = 0, na = 0, nb = 0;
    for (var i = 0; i < EKEYS.length; i++) {
      dot += ca.arr[i] * cb.arr[i]; na += ca.arr[i] * ca.arr[i]; nb += cb.arr[i] * cb.arr[i];
    }
    var shape = (na && nb) ? Math.round(dot / Math.sqrt(na * nb) * 100) / 100 : null;
    return { shape: shape, levelDiff: Math.round((cb.mean - ca.mean) * 10) / 10 };
  }

  // ── Δ 敘事模板(描述位移;不解因、不評好壞)──
  var VREAD = {
    steady: '這段時間,你的形狀很穩——大致是同一個你。',
    flow: '有些流動——幾股能量換了位置,值得看一眼。',
    shift: '明顯的移動——你的能量地形變了不少。',
    stateUp: '{N} 長了 {D}',
    stateDown: '{N} 收了 {D}',
    gateTilt: '{G}系統:優勢分支往「{P}」移了 {D}。',
    gateOpenUp: '{G}系統:整體張力升了 {D}。',
    gateOpenDown: '{G}系統:整體張力降了 {D}。',
    noneMoved: '所有變化都在測量誤差內(±{NOISE})——這段時間的你,大致是同一個形狀。',
    honest: '對照的是兩張快照之間的位移——只描述「移了多少、往哪移」,不解釋原因、不評好壞;差異小於 {NOISE} 屬測量誤差,不視為變化。快照會流動,這正是再測的意義。',
    crossBank: '這兩串分享碼來自不同題本(B1 與 B2),分數不能直接相減——請用同一版題本的兩次結果對照。'
  };

  g.OctensoVector = {
    NOISE: NOISE, D_FLOW: D_FLOW, D_SHIFT: D_SHIFT,
    gateCoords: gateCoords, delta: delta, similarity: similarity,
    stateRegion: stateRegion, regionShapes: regionShapes,
    VREAD: VREAD
  };
})(typeof window !== 'undefined' ? window : this);
