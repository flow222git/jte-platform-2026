// bsrs-score.js — 心情溫度計 BSRS 計分與記錄分層（可測純函式）
// 依賴 window.JtePrivacy（加解密/合併部分）。掛 window.BsrsScore。
(function (root) {
  'use strict';
  var QUESTIONS = [
    { key:'q1', text:'感覺緊張不安' },
    { key:'q2', text:'覺得容易苦惱或動怒' },
    { key:'q3', text:'感覺憂鬱、心情低落' },
    { key:'q4', text:'覺得比不上別人' },
    { key:'q5', text:'睡眠困難，譬如難以入睡、易醒或早醒' },
    { key:'q6', text:'有「自殺」的想法', supplementary:true }
  ];
  var OPTIONS = ['完全沒有','輕微','中等','厲害','非常厲害'];
  var LEVELS = {
    good:     { label:'身心適應狀況良好', advice:'你最近的狀態還不錯，繼續照顧自己。' },
    mild:     { label:'輕度情緒困擾',     advice:'找信任的家人朋友聊聊、抒發一下，會有幫助。' },
    moderate: { label:'中度情緒困擾',     advice:'建議尋求心理諮商或專業協助，陪自己走一段。' },
    severe:   { label:'重度情緒困擾',     advice:'建議尋求精神科治療或心理諮商，你值得被好好接住。' }
  };
  function levelOf(total){ return total<=5?'good':total<=9?'mild':total<=14?'moderate':'severe'; }
  function score(answers){
    var a = (answers||[]).map(function(x){ return Number(x)||0; });
    var total = (a[0]||0)+(a[1]||0)+(a[2]||0)+(a[3]||0)+(a[4]||0);
    var item6 = a[5]||0;
    var level = levelOf(total);
    var crisis = total>=15 || item6>=2;
    return { total:total, item6:item6, level:level, levelLabel:LEVELS[level].label, advice:LEVELS[level].advice, crisis:crisis };
  }

  root.BsrsScore = { QUESTIONS:QUESTIONS, OPTIONS:OPTIONS, LEVELS:LEVELS, score:score };
})(typeof window !== 'undefined' ? window : this);
