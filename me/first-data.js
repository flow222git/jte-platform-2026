/* 「第一次進來」的文案與選項（/me 首頁的第一次流程用）。
   狀態名稱、練習項目的例子、顏色都沿用 me-data.js；兩本外觀的名稱沿用 jte-theme.js。這裡只放這個流程自己的字。
   回答只存在這台裝置：狀態進今天、項目進「我的練習」；問過一次就不再問（jte_me_v1.prefs.first）。 */
(function (g) {
  'use strict';
  g.JTE_FIRST_DATA = {
    hello: '這本手帳還是空的。點幾下，把它變成你的。',
    skipAll: '我用過了，直接進去',
    pick: {
      h: '先挑一本',
      note: '三本的內容一樣，只是紙和字不同。之後隨時可以在右上角換。',
      books: [
        { key: 'simple', line: '白紙，乾淨的字。' },
        { key: 'sketch', line: '米色的紙，手寫的字。' },
        { key: 'doodle', line: '粗粗的筆線，麥克筆的顏色。' }
      ],
      sample: '今天，剛好。'
    },
    skip: '先跳過',
    done: '好了',
    step: '{n}／3',
    q1: {
      h: '現在怎麼樣？',
      note: '不用懂任何理論，選一個最接近的。',
      block: '今天',
      door: '想做點什麼的話'
    },
    q2: {
      h: '你平常有在練什麼嗎？',
      note: '可以選好幾個，也可以自己打。沒有也很正常。',
      extra: [{ name: '瑜珈', unit: '分鐘' }, { name: '走路', unit: '分鐘' }],
      own: '自己打一個', ownAdd: '加上', ownUnit: '次',
      none: '還沒有',
      block: '我的練習',
      blockNote: '進去之後，練完可以在這裡記一筆。單位可以再改。',
      noneBlock: '先試一分鐘',
      noneNote: '跟著圓，吸氣、吐氣，三次就好。做完就是你的第一筆。',
      start: '開始', inhale: '吸氣', exhale: '吐氣',
      breathItem: { name: '呼吸', unit: '次', amount: 3 },
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
      eventNote: '進去之後用報名的信箱登入，會把你當時寫的那一頁拿回來。',
      welcome: '歡迎。慢慢來。'
    },
    end: {
      h: '這就是你的首頁。',
      note: '上面每一塊都是你剛才點出來的。之後都可以改，也可以再加。',
      empty: '你都先跳過了，所以這裡是空的。這也可以，之後想到再放。',
      go: '好，開始用',
      back: '重來一次'
    }
  };
})(window);
