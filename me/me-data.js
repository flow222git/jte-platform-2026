/* 我的練息場 /me — canonical 資料檔（meta A 同源：頁內不散寫文案）
 * 色票比照線上課程站的 design-system.css。
 * 三態文案與首頁提案 home-2026-proposal.html 的前門一致；首頁正式改版時兩邊應共讀這一份。
 */
(function (g) {
  'use strict';
  g.JTE_ME_DATA = {
    version: '0.1',
    // 工具：連結一律相對路徑，工具各自獨立、不內嵌
    tools: {
      breathe: { name: '呼吸覺察', href: '../BreatheAware/', desc: '即時看見你的呼吸狀態。' },
      xiaoqi: { name: '小憩・練息', href: '../xiaoqi/', desc: '15 種呼吸法，選一個現在做。' },
      hrv: { name: '心率變異 HRV', href: '../hrv/', desc: '手指貼鏡頭，一分鐘量身體狀態。' },
      wenyi: { name: '問易', href: '../ven-i/', desc: '從易經，回來看自己。' },
      write: { name: '心理位移書寫', href: '/writespace/', desc: '換個位置，把心裡的話寫出來。' },
      twct: { name: '溝通類型測驗', href: '/twct/', desc: '5 分鐘，看你在壓力下怎麼溝通。' },
      bsrs: { name: '心情溫度計', href: '../bsrs/', desc: '一分鐘，看看最近的情緒。' },
      octenso: { name: '八態能格', href: '../octenso/', desc: '25 題，照一面深一點的鏡子。' }
    },
    // 工具箱：沿用現行首頁的三組與說明文字，加上八態能格。工具各自獨立，這裡只是門。
    toolbox: { title: '所有工具', note: '想做什麼，就從哪裡開始。', groups: [
      { name: '呼吸・回到當下', tools: ['breathe', 'xiaoqi', 'hrv'] },
      { name: '內在・讀懂自己', tools: ['wenyi', 'write', 'octenso'] },
      { name: '認識自己', tools: ['twct', 'bsrs'] }] },
    // 優勢幸福力：實證量表（企業健檢）的個人報告，由本人照報告填入。與八態能格並列，不做對映。
    // 特質與 PERMA 的名稱取自使用者提供的報告截圖，尚待核對原始量表。心情溫度計那一段不收（分數留在報告裡）。
    sw: { name: '優勢幸福力', sub: '優勢韌力個人報告', note: '這是實證量表的結果，和八態能格排在一起，不互相對照。',
      empty: '做過優勢幸福力測驗的話，可以照報告把結果填進來，和其他紀錄放在一起。', fill: '填入我的結果', edit: '更新', clear: '清掉',
      strengths: ['務實謙遜', '真誠利他', '開放創造', '謹慎負責', '自信堅定', '活潑樂觀', '熱忱進取', '領導表達'],
      perma: { P: '正向情緒', E: '全心投入', R: '正向人際', M: '生命意義', A: '成就感' },
      top: '分數最高的三個', happy: '幸福指數', barNote: '長條只和你自己的最高分比。' },
    // 每日紀錄 linked[].source → 頁面類別／名稱／插畫／工具
    sources: {
      BreatheAware: { kind: '練習', name: '呼吸覺察', doodle: 'waves', tool: 'breathe' },
      BreathAware: { kind: '練習', name: '呼吸覺察', doodle: 'waves', tool: 'breathe' },
      XiaoQi: { kind: '練習', name: '小憩・練息', doodle: 'waves', tool: 'xiaoqi' },
      HRV: { kind: '練習', name: '身體能量', doodle: 'heart', tool: 'hrv' },
      HRVRecord: { kind: '練習', name: '心率變異', doodle: 'heart', tool: 'hrv' },
      WenYi: { kind: '內在', name: '問易', doodle: 'hex', tool: 'wenyi' },
      BuYi: { kind: '內在', name: '卜易', doodle: 'hex', tool: 'wenyi' },
      WriteSpace: { kind: '內在', name: '心理位移書寫', doodle: 'book', tool: 'write' },
      Activity: { kind: '活動', name: '活動', doodle: 'mount', tool: '' },
      TWCT: { kind: '認識', name: '溝通類型', doodle: 'face', tool: 'twct' },
      BSRS: { kind: '認識', name: '心情溫度計', doodle: '', tool: 'bsrs' }
    },
    kinds: ['活動', '練習', '內在', '認識', '隨手記'],
    // 此刻的狀態：先是兩個好的狀態（剛好、有勁），再是首頁前門的三態（空了、太滿、卡住）。
    // 每個狀態一句理解＋兩扇門；門可以是工具，也可以是「記一句」（note）。
    states: [
      { key: 'good', name: '剛好', desc: '不多不少，有餘裕。',
        say: '剛好的時候，不用特別做什麼。可以量一下身體，留下「好的時候長這樣」；或記下是什麼讓今天剛好。',
        doors: [{ tool: 'hrv', label: '量一下 HRV・留個樣子' }, { note: true, label: '記下今天為什麼剛好' }] },
      { key: 'keen', name: '有勁', desc: '有電，想做點什麼。',
        say: '有勁的時候，最適合靠近平常沒力氣碰的東西。照一面深一點的鏡子，或把想學的那件事先記下來。',
        doors: [{ tool: 'octenso', label: '八態能格・25 題深鏡' }, { note: true, label: '記下想靠近的事' }] },
      { key: 'empty', name: '空了', desc: '電量見底，提不起勁。身體先累了。',
        say: '先不急著解決任何事。空了的時候，第一步是把電充回來。量一下身體，然後跟著呼吸休息。',
        doors: [{ tool: 'hrv', label: '量一下 HRV・1 分鐘' }, { tool: 'breathe', label: '呼吸覺察・回到當下' }] },
      { key: 'full', name: '太滿', desc: '事情與情緒都超載，停不下來。',
        say: '滿出來的時候，需要的不是更多方法，是一個縫隙。先用十分鐘把壓卸掉，再想界線的事。',
        doors: [{ tool: 'xiaoqi', label: '小憩・練息 10 分鐘' }, { tool: 'bsrs', label: '心情溫度計・1 分鐘' }] },
      { key: 'stuck', name: '卡住', desc: '說不清哪裡不對，就是卡卡的。',
        say: '卡住，常是某股能量用過了頭，或還沒長開。照一面深一點的鏡子，看看此刻的你長什麼形狀。',
        doors: [{ tool: 'octenso', label: '八態能格・25 題深鏡' }, { tool: 'wenyi', label: '問易・看看這個處境' }] }
    ],
    // Enjoy：五個字母共用，底下的字由本人改
    perma: {
      order: ['P', 'E', 'R', 'M', 'A'],
      words: { P: '開心', E: '忘我', R: '有人一起', M: '對我重要', A: '學會了' },
      colors: { P: '#FF9925', E: '#FFDC2D', R: '#2F6BD8', M: '#4CAF19', A: '#7A6BD8' }
    },
    hrvLevel: { high: '充足', mid: '平穩', low: '偏低' },
    // 三角形：起點（看見現在的自己，因好奇、需要或共鳴而想靠近）＋做了什麼（方法）＋發現（意義與轉化）。
    // 這是循環，不是結業：發現可以成為下一個起點。內核不寫在介面上。
    join: { circle: '一起練', ask: '或是，看到什麼讓你想靠近？', placeholder: '例如：同事的手沖咖啡', curious: '好奇', blank: '起點還沒寫', from: '從上一次的發現長出來' },
    joinColors: { good: '#DAF54A', keen: '#FFB866', empty: '#BAB5FF', full: '#FFC3FE', stuck: '#A9EFFF', curious: '#B0D98B', from: '#C5DBF7', circle: '#99DAFF' },
    // 動力：我為何願意開始。詞取自構想稿的 Join 定義與各練習的參與動力，只是起頭；本人可以不選，也可以寫自己的。不拿來替人分類。
    why: { ask: '為什麼想開始', own: '或用自己的話', words: ['好奇', '需要', '有共鳴', '馬上能用', '自己掌控', '想精進', '對我有意義', '想跟人連結', '想創造', '想表達'] },
    // 轉化：我發現什麼改變。自己的一句話為主，五個幸福用字只是參考。
    found: { ask: '這次發現了什麼', placeholder: '一句就好。沒有也可以。', again: '從這裡再開始', color: '#032639',
      first: '三個角都有了。這次的發現，可以是下一個起點。', next: '三個角都有了' },
    kindColors: { '活動': '#34C8A0', '練習': '#3786E6', '內在': '#003864', '認識': '#FFDC2D', '隨手記': '#E8690B' },
    // 探索期：第一次來，手帳是空的
    welcome: { title: '這本手帳還是空的', say: '先照一面鏡子，或記下一件讓你好奇的事。剩下的會自己慢慢長出來。',
      doors: [{ tool: 'octenso', label: '八態能格・25 題', why: '想看看自己的底色' }, { tool: 'hrv', label: '量一次身體・1 分鐘', why: '想知道身體現在怎麼樣' }] },
    // 養成期：舊紀錄不定期回來
    capsule: { minDays: 14, title: '再次遇見', ask: '現在再看，想補什麼' },
    // 使用說明書：跟著本人留下的東西長，沒有門檻
    manual: { title: '我的使用說明書', empty: '這一頁會跟著你留下的東西慢慢長出來。' },
    // 資料與公開：預設私人；上傳、給特定的人、公開都由本人逐項決定，可以收回
    privacy: { now: '現在，所有內容只存在這台裝置的瀏覽器裡。清除瀏覽器資料會一併消失。',
      cloud: '放了照片的靈感存在你登入的 Google 帳號底下，只有你看得到；其他內容只存在這台裝置。',
      choice: '要不要上傳、給特定的人看、或公開，每一項都由你決定，預設是不要。這些選項還沒開放；開放的時候會一項一項問你，也都收得回來。',
      download: '下載我的資料', downloadNote: '檔案裡有你全部的紀錄，要傳給誰由你決定。',
      wipe: '刪除這一頁的註記', wipeAsk: '確定刪除？各工具自己的紀錄不會被動到。', wipeYes: '確定刪除', wiped: '這一頁的註記刪掉了，工具的紀錄還在' },
    // 五個空間（資訊架構，取自構想稿第 04 節）。使用模式（主動記錄／活動串接／綜觀地圖）不放在同一層導覽：
    // 「記一句」每個空間都按得到；體驗足跡與生命地圖是「我的地圖」裡的切換。抵達時一律先到「今天」。
    panes: [{ key: 'today', name: '今天', q: '我現在怎麼樣' }, { key: 'explore', name: '探索', q: '我對什麼感興趣' },
      { key: 'practice', name: '練習', q: '什麼對我有效' }, { key: 'mymap', name: '我的地圖', q: '認識了什麼樣的自己' },
      { key: 'care', name: '陪伴', q: '誰可以支持我' }],
    subs: [{ key: 'trail', name: '體驗足跡' }, { key: 'overview', name: '生命地圖' }],
    quick: '記一句',
    // 站外連結。線上課程目前是封測網址，正式上線前要換。
    links: { course: 'https://sandbox-courses.flow-af1.workers.dev/course', tutor: 'https://sandbox-courses.flow-af1.workers.dev/',
      booking: 'https://sandbox-courses.flow-af1.workers.dev/booking', site: 'https://www.jointoenjoy.com/' },
    explore: {
      curious: { title: '我的好奇', note: '看到什麼讓你想靠近，先記下來。', placeholder: '例如：同事的手沖咖啡', add: '記下來', none: '還沒有記過。' },
      themes: { title: '我在意的主題', note: '你自己取的標籤。', none: '在任一筆紀錄上加標籤，主題會出現在這裡。' },
      around: { title: '可以去看看的', note: '課程和活動在別的頁面，會另外開啟。' },
      cards: [
        { name: '線上課程', desc: '心理能量管理：內耗覺察、自我價值、人際界線、能量永續。每集 15 分鐘。', link: 'course', tag: '第一章已開放' },
        { name: '活動與工作坊', desc: '實體的五感體驗與療癒工作坊。', link: 'site', tag: '' },
        { name: '所有工具', desc: '呼吸、身體、書寫、易經、測驗，共八個。', go: 'practice', tag: '' },
        { name: 'AI 能量助教', desc: '四位助教，在線上課程裡陪你把剛聽懂的東西放進自己的情境。是練習工具，不是諮商。', link: 'tutor', tag: '' },
        { name: '能量教練預約', desc: '真人的談話引導或身心放鬆，二選一。', link: 'booking', tag: '' }],
      later: '師資介紹和別人的經驗還沒有放進來。別人的分享要先有同意的機制。' },
    practice: {
      works: { title: '對我有效的', note: '你自己標過「對我有用」的方法。', none: '在紀錄上標「對我有用」，方法會收到這裡。' },
      outside: { title: '平台以外的方法', note: '太極、聲音、藝術、自然……參加過的活動會出現在這裡，也可以標「對我有用」。', none: '還沒有活動紀錄。' },
      review: '用「方法」的角度看全部紀錄' },
    // 陪伴＝一起練：看得到有哪些團正在進行，可以發起，也可以參加別人的團；打卡、互相鼓勵、分享一句心得（使用者 2026-11-17）。
    // 守則取自構想稿第 08、13 節：沒有排名與連續天數、可以暫停、可以離開；個人紀錄不外露。
    // 需要登入與後端才能真的運作；目前只有示範模式可以操作。
    care: {
      title: '一起練', note: '看看有哪些團正在進行，加入一個，或自己發起。',
      mine: { title: '我參加的團', none: '還沒參加任何團。可以從下面加入一個，或自己發起。' },
      open: { title: '正在進行的團', note: '開放加入的團。還沒加入時，只看得到團名、練什麼、幾個人。', none: '現在沒有開放加入的團。可以發起一個。',
        join: '加入', full: '滿了', joined: '加入了。想練的時候來打卡就好。', day: '第 {d} 天／共 {n} 天', nolimit: '不設期限・第 {d} 天', today: '今天 {n} 個人練了' },
      max: 12,
      rules: { title: '別人看得到什麼', see: '團員看得到：你在團裡的名字、你今天練了、你自己選擇寫的那一句。',
        out: '還沒加入的人只看得到：團名、練什麼、幾個人、今天幾個人練了。心得只有團員看得到。',
        hide: '誰都看不到：你的狀態、身體能量、心情溫度計，和手帳裡其他的紀錄。',
        tone: '沒有排名，也不算連續天數。只看得到今天誰練了，不會列出誰沒練。想休息可以說一聲，隨時可以離開。',
        nick: '我在團裡的名字', nickPh: '可以不是本名' },
      cheers: ['收到', '一起', '好耶', '辛苦了'],
      rhythms: ['每天', '一週三次', '想到就做'],
      spans: [{ d: 7, name: '七天' }, { d: 21, name: '二十一天' }, { d: 0, name: '不設期限' }],
      checkin: { btn: '打卡', ph: '想分享一句心得嗎？可以不寫', done: '你今天打過卡了。', keep: '寫下的那一句也會留在你自己的手帳裡。', go: '先去做' },
      rest: { on: '這週先休息', off: '我回來了', say: '這週先休息' },
      week: '這七天，團裡一起練了 {n} 次', today: '今天', none: '今天還沒有人打卡。可以當第一個。', leave: '離開這個團',
      create: { title: '發起一個團', name: '取個名字', namePh: '例如：午休三口呼吸', what: '一起練什麼', own: '自己的方法（太極、散步……）',
        span: '多久', rhythm: '節奏', who: '誰可以加入', open: '開放加入', invite_only: '邀請制',
        openNote: '開放加入的團會出現在「正在進行的團」，任何人都能加入。邀請制只有拿到連結的人能加入。',
        go: '發起', invite: '複製邀請連結', made: '團開好了。' },
      tags: { open: '開放加入', closed: '邀請制' },
      locked: { title: '還沒開放', text: '一起練要讓夥伴看得到彼此，所以需要登入。登入和同步還沒接上，這裡先放示範給你看。', demo: '看示範長什麼樣子' },
      bring: { title: '帶著自己的整理去', note: '要帶什麼、給誰看，都由你決定。這些檔案只在你的裝置上產生。' } },
    // 視角：同一批紀錄，換一個角來分組
    lens: [{ key: 'mine', name: '我的主題', q: '我在意什麼', none: ['還沒有主題', '在任一筆紀錄上加一個標籤'] },
      { key: 'join', name: '起點', q: '我通常從哪裡開始', none: ['還沒寫過起點', '在紀錄上補「當時為什麼來」'] },
      { key: 'to', name: '方法', q: '什麼對我有效', none: ['還沒有練習或活動的紀錄', '做過的會出現在這裡'] },
      { key: 'enjoy', name: '我的幸福', q: '什麼讓我覺得值得', none: ['還沒貼過幸福用字', '在紀錄上貼一個'] },
      { key: 'oct', name: '八態能格', q: '', none: ['', ''] }],
    // 剛做完回來：趁還記得，只問一件事
    just: { title: '剛剛做了', ask: '趁還記得，這次發現了什麼？', skip: '先不寫' },
    // 需要的當下：同一個狀態，上次自己做了什麼
    last: { title: '你上次「{s}」的時候', note: '這是你自己留下的紀錄，不是建議。', again: '再做一次' },
    capture: { label: '靈感', forState: '記下「{s}」的這一刻', placeholder: '一句話、一個詞都可以', keep: '留下', start: '這是我想靠近的事', note: '只有一句話時存在這台裝置；放了照片的那一筆會存到你的雲端。「想靠近的事」會留成一個起點，之後做了可以接回來。', useful: '你標過「對我有用」的' },
    // 靈感區：一句話，或幾張照片各自加註解。有照片的一筆存到本人的雲端（Firebase），只有本人看得到。
    // 上限與 firestore.rules 一致；改這裡要一起改規則。
    insp: { maxPhotos: 4, maxEdge: 1280, maxDataLen: 420000, maxCaption: 200, maxText: 500, saveTimeoutMs: 30000,
      add: '加照片', needLogin: '登入後可以放照片', signIn: '用 Google 登入', signOut: '登出', signedIn: '{n} 已登入',
      cloudNote: '放了照片的這一筆會存到你的雲端，只有你看得到。', offline: '照片功能暫時連不上，可以先只記一句。',
      caption: '這張想說什麼（可以不寫）', remove: '拿掉', left: '往前', right: '往後', saving: '存的時候…',
      kept: '留下了，照片存到你的雲端', fail: '沒有存到，請再試一次。內容都還在。', photoCount: '{n} 張照片',
      deleted: '刪掉了', removed: '拿掉了', photoAlt: '照片', cancel: '取消',
      delPhoto: '拿掉這張', delIns: '刪除這一筆', delAsk: '確定刪除？雲端上的照片也會一起刪掉。', delYes: '確定刪除',
      full: '一筆最多 {n} 張', compressFail: '這張照片讀不出來，換一張試試',
      wipe: '刪除我在雲端的靈感與照片', wipeAsk: '確定刪除？雲端上所有靈感與照片都會刪掉，不能復原。', wipeYes: '確定刪除', wiped: '雲端的靈感與照片刪掉了',
      bad: { empty: '寫一句或放一張照片', text: '這一句太長了', count: '一筆最多 4 張', type: '只能放照片', size: '照片太大了', caption: '註解太長了' } },
    back: { days: 7, say: '隔了 {n} 天。想從哪裡開始都可以。' },
    search: { placeholder: '找一筆紀錄：方法、標籤、寫過的話', none: '找不到符合的紀錄。' },
    honest: '這一頁只把你留下的東西排在一起，不代表它們之間有因果。這裡是鏡子，不是算命。',
    crisis: '如果你正經歷明顯困擾：安心專線 1925・生命線 1995・張老師 1980'
  };
})(window);
