/* 八態素材倉(對境迴圈 M1)——共用模組:儲存 API + 收錄 opt-in 區塊
   北極星:素材只存本機 localStorage,不上傳;寫回=使用者按下才發生(opt-in)。
   之後的個人八態鏡(M4)從這裡讀。收錄 UI 文案只寫在此(meta A 同源),各頁掛載不重寫。
   注意:問易(ven-i)與 octenso 頁同源(flow222git.github.io),localStorage 互通。 */
(function(){
'use strict';
var KEY='octenso_corpus_v1';
var MAX_ENTRIES=300, MAX_TEXT=8000;

function load(){ try{ var a=JSON.parse(localStorage.getItem(KEY)||'[]'); return Array.isArray(a)?a:[]; }catch(e){ return []; } }
function save(list){ try{ localStorage.setItem(KEY,JSON.stringify(list)); return true; }catch(e){ return false; } }

function add(o){
  var text=String((o&&o.text)||'').trim();
  if(!text) return {ok:false,reason:'empty'};
  if(text.length>MAX_TEXT) text=text.slice(0,MAX_TEXT)+'…(超長截斷)';
  var list=load();
  if(list.length>=MAX_ENTRIES) return {ok:false,reason:'full'};
  var e={ id:'c'+Date.now()+Math.random().toString(36).slice(2,7),
    ts:new Date().toISOString(),
    source:String((o&&o.source)||''), label:String((o&&o.label)||''), text:text };
  list.push(e);
  if(!save(list)) return {ok:false,reason:'storage'};
  return {ok:true,id:e.id,count:list.length};
}
function remove(id){ var list=load().filter(function(e){return e.id!==id;}); save(list); return list.length; }
function clearAll(){ try{ localStorage.removeItem(KEY); }catch(e){} }
function count(){ return load().length; }
function totalChars(){ return load().reduce(function(s,e){return s+(e.text||'').length;},0); }

/* 收錄 opt-in 區塊。opts={source,label,getText,viewerHref}
   getText 在按下當下才呼叫(拿到最新的感想欄內容)。 */
function mountOptIn(container,opts){
  opts=opts||{};
  var href=opts.viewerHref||'bagua-corpus.html';
  var box=document.createElement('div');
  box.className='octenso-corpus-optin';
  box.style.cssText='margin-top:14px;padding:14px 16px;border:1px dashed rgba(125,115,95,.5);border-radius:12px;font-size:13px;line-height:1.9';
  box.innerHTML=
    '<div class="oc-t" style="margin-bottom:2px">這段話,收進你的八態素材嗎?</div>'
    +'<div style="font-size:12px;opacity:.72;margin-bottom:10px">只收你自己寫下的字(問題與感想),存在這台裝置、不上傳;之後可用八態鏡照出跨次的個人規律。隨時可看、可刪。</div>'
    +'<div class="oc-row" style="display:flex;gap:8px;flex-wrap:wrap">'
    +'<button type="button" class="oc-yes" style="font:inherit;font-size:13px;padding:8px 20px;border-radius:999px;border:1px solid currentColor;background:none;color:inherit;cursor:pointer">收進素材</button>'
    +'<button type="button" class="oc-no" style="font:inherit;font-size:13px;padding:8px 14px;border:none;background:none;color:inherit;opacity:.6;cursor:pointer">先不用</button></div>'
    +'<div class="oc-done" style="display:none;font-size:12.5px;margin-top:4px"></div>';
  var row=box.querySelector('.oc-row'), done=box.querySelector('.oc-done');
  function show(msg,hideRow){
    done.innerHTML=msg; done.style.display='block';
    if(hideRow) row.style.display='none';
  }
  box.querySelector('.oc-yes').onclick=function(){
    var t=(opts.getText&&opts.getText())||'';
    var r=add({source:opts.source,label:opts.label,text:t});
    if(r.ok){ show('已收進素材倉(目前 '+r.count+' 段)· <a href="'+href+'" style="color:inherit">打開素材倉</a>',true); return; }
    if(r.reason==='empty'){ show('這次沒有寫下文字——有想留的話再收就好。',false); return; }
    if(r.reason==='full'){ show('素材倉滿了('+MAX_ENTRIES+' 段)——先到 <a href="'+href+'" style="color:inherit">素材倉</a> 整理再收。',true); return; }
    show('這台裝置的儲存空間不夠,沒收成。',true);
  };
  box.querySelector('.oc-no').onclick=function(){ show('好,這次不收。',true); };
  container.appendChild(box);
  return box;
}

window.OctensoCorpus={ KEY:KEY, MAX_ENTRIES:MAX_ENTRIES, MAX_TEXT:MAX_TEXT,
  add:add, list:load, remove:remove, clear:clearAll, count:count, totalChars:totalChars,
  mountOptIn:mountOptIn };
})();
