/* 「第一次進來」試作頁（me/first.html）的文案與選項。
   狀態名稱、練習項目的例子、顏色都沿用 me-data.js，這裡只放這一頁自己的字。
   試作：這一頁不儲存任何東西，也不會影響 /me 的首頁。 */
(function (g) {
  'use strict';
  g.JTE_FIRST_DATA = {
    stamp: '試作 v0.1・這一頁不會儲存任何東西，重新整理就回到最前面。',
    title: '練息生手帳',
    pick: {
      h: '先挑一本',
      note: '兩本的內容一樣，只是紙和字不同。之後隨時可以換。',
      books: [
        { key: 'clean', name: '簡潔', line: '白紙，乾淨的字。' },
        { key: 'sketch', name: '手帳', line: '米色的紙，手寫的字。' }
      ],
      sample: '今天，剛好。',
      swap: '換一本'
    },
    skip: '先跳過',
    done: '好了',
    again: '重來一次',
    step: '{n}／3',
    q1: {
      h: '現在怎麼樣？',
      note: '不用懂任何理論，選一個最接近的。',
      block: '今天',
      said: '你選了「{s}」。',
      door: '想做點什麼的話',
      doorNote: '試作頁不會真的打開工具。'
    },
    q2: {
      h: '你平常有在練什麼嗎？',
      note: '可以選好幾個，也可以自己打。沒有也很正常。',
      extra: ['瑜珈', '走路'],
      own: '自己打一個',
      ownAdd: '加上',
      none: '還沒有',
      block: '我的練習',
      log: '記一筆',
      logged: '今天 1 次',
      noneBlock: '先試一分鐘',
      noneNote: '跟著圓，吸氣、吐氣，三次就好。做完就是你的第一筆。',
      start: '開始',
      inhale: '吸氣',
      exhale: '吐氣',
      breathed: '做完了。這是你的第一筆：呼吸，三次。',
      later: '之後再說'
    },
    q3: {
      h: '你是怎麼來的？',
      note: '只是想知道要不要幫你把活動那一頁拿回來。',
      opts: [
        { key: 'event', name: '參加過活動' },
        { key: 'friend', name: '朋友提過' },
        { key: 'self', name: '自己逛到' }
      ],
      block: '你參加過的活動',
      eventHead: '茶席體驗（示範）',
      eventLead: '去之前，你寫下：',
      eventQuote: '想讓自己慢下來。',
      eventNote: '這一句是示範。正式版會請你登入，把你自己當時寫的那一頁拿回來。',
      welcome: '歡迎。慢慢來。'
    },
    end: {
      h: '這就是你的首頁。',
      note: '上面每一塊都是你剛才點出來的。之後都可以改，也可以再加。',
      empty: '你三題都跳過了，所以這裡是空的。這也可以，之後想到再放。',
      real: '去看現在的手帳'
    }
  };
})(window);
