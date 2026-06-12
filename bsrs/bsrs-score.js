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

  // —— 記錄分層（比照 ven-i-privacy.js，私密欄位改 BSRS）——
  var PRIVATE_FIELDS = ['score','level','answers','item6'];
  function _pickPrivate(rec){ var p={}; PRIVATE_FIELDS.forEach(function(f){ if(rec[f]!==undefined&&rec[f]!==null&&rec[f]!=='') p[f]=(typeof rec[f]==='object')?JSON.stringify(rec[f]):String(rec[f]); }); return p; }
  // 產生「可上雲」版本：可分析欄位明文保留；私密欄位→解鎖則加密進 priv、未解鎖則整個略去
  function toCloudRec(rec){
    var out={}; Object.keys(rec).forEach(function(k){ if(PRIVATE_FIELDS.indexOf(k)===-1) out[k]=rec[k]; });
    if(!root.JtePrivacy||!root.JtePrivacy.isUnlocked()) return Promise.resolve(out);
    var priv=_pickPrivate(rec); if(!Object.keys(priv).length) return Promise.resolve(out);
    return root.JtePrivacy.encryptPrivate(priv).then(function(enc){ out.priv=enc; return out; });
  }
  function _coerce(v){ if(typeof v!=='string') return v; try{ return JSON.parse(v); }catch(e){ return v; } }
  // 把雲端 days 併入本機 days：依 recordId 去重（本機優先），雲端獨有者解密 priv 後併入
  function mergeCloud(localAll, cloudDays){
    var result=JSON.parse(JSON.stringify(localAll||{})), seen={};
    Object.keys(result).forEach(function(d){ (result[d].linked||[]).forEach(function(r){ var k=r.recordId||r.id; if(k) seen[k]=true; }); });
    var unlocked=root.JtePrivacy&&root.JtePrivacy.isUnlocked(), chain=Promise.resolve();
    Object.keys(cloudDays||{}).forEach(function(d){ (cloudDays[d].linked||[]).forEach(function(cr){
      var key=cr.recordId||cr.id; if(key&&seen[key]) return; if(key) seen[key]=true;
      chain=chain.then(function(){
        var rec={}; Object.keys(cr).forEach(function(k){ if(k!=='priv') rec[k]=cr[k]; });
        if(unlocked&&cr.priv){ return root.JtePrivacy.decryptPrivate(cr.priv).then(function(p){ Object.keys(p).forEach(function(f){ if(p[f]!=null) rec[f]=(f==='answers')?_coerce(p[f]):(f==='score'||f==='item6')?Number(p[f]):p[f]; }); _push(result,d,rec); }); }
        _push(result,d,rec);
      });
    }); });
    return chain.then(function(){ return result; });
  }
  function _push(all,d,rec){ if(!all[d]) all[d]={linked:[]}; if(!all[d].linked) all[d].linked=[]; all[d].linked.push(rec); }

  root.BsrsScore = { QUESTIONS:QUESTIONS, OPTIONS:OPTIONS, LEVELS:LEVELS, score:score, PRIVATE_FIELDS:PRIVATE_FIELDS, toCloudRec:toCloudRec, mergeCloud:mergeCloud };
})(typeof window !== 'undefined' ? window : this);
