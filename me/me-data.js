/* 練息手帳 /me — canonical 資料檔（meta A 同源：頁內不散寫文案）
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
    toolbox: { title: '平台工具', note: '想做什麼，就從哪裡開始。做過的可以標「對我有用」。', groups: [
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
      HRV: { kind: '練習', name: '身體能量（HRV）', doodle: 'heart', tool: 'hrv' },
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
    // 區塊收放（五個空間）：標題可以點，收成一行。closed 是一開始就收著的；sum 是收起來時標題旁邊那一句（沒有就不寫）。
    // 預設只收「說明性、偶爾才看」的：兩面鏡子、我的資料、平台以外的方法、別人看得到什麼、帶著自己的整理去。
    // 2026-11-25 使用者要「練習」以練習為主、岔路更少：「還開著的」也預設收成一行。
    // 2026-11-26「我的資料」不再是我的地圖裡的一塊：點頁首的登入鈕，帳號和我的資料一起打開。
    // 「所有工具」不收：還沒有紀錄的人，那是唯一的門。「練習」的狀態與靈感、剛剛做了、各種詢問不能收。
    fold: { open: '展開', close: '收起', all: '全部展開', closed: ['open', 'mir', 'rul', 'bri'],
      keys: ['open', 'thm', 'aro', 'prac', 'tools', 'sum', 'cap', 'rec', 'org', 'mir', 'cir', 'opn', 'rul', 'bri'],
      sum: { sum: '{n} 頁', rec: '{n} 筆', org: '視角與使用說明書', mir: '八態能格、優勢幸福力', tools: '呼吸、內在、認識自己' } },
    capsule: { minDays: 14, title: '再次遇見', ask: '現在再看，想補什麼' },
    // 使用說明書：跟著本人留下的東西長，沒有門檻
    manual: { title: '我的使用說明書', empty: '這一頁會跟著你留下的東西慢慢長出來。' },
    // 資料與公開：預設私人；上傳、給特定的人、公開都由本人逐項決定，可以收回
    privacy: { now: '現在，所有內容只存在這台裝置的瀏覽器裡。清除瀏覽器資料會一併消失。',
      cloud: '放了照片的隨手記存在練息場的雲端，用你的登入辨認，只有你看得到。你收進來的活動紀錄也在雲端：內容是你在活動問卷裡填的，由主辦方匯入，主辦方本來就看得到。其他內容只存在這台裝置；練習紀錄另外寫在下面。',
      choice: '要不要上傳、給特定的人看、或公開，每一項都由你決定，預設是不要。這些選項還沒開放；開放的時候會一項一項問你，也都收得回來。',
      download: '下載我的資料', downloadNote: '檔案裡有你全部的紀錄，要傳給誰由你決定。',
      practiceLocal: '練習紀錄（我的練習）存在這台裝置，清掉瀏覽器資料或換裝置就沒了，可以先下載一份。',
      practiceCloud: '練習紀錄（我的練習）存在練息場的雲端，用你的登入辨認，其他使用者看不到；平台管理者從後台看得到。',
      // 「我的資料」設定表：每一類一列。放哪裡、誰看得到的字都在這裡；哪一列是什麼狀態由 me-core.js 的 dataRows 決定。
      table: {
        lead: '預設都留在這台裝置。要放到雲端的，一項一項由你決定，也都搬得回來。',
        head: { name: '內容', where: '現在放在', who: '誰看得到', act: '可以做的事' },
        names: { states: '每天的狀態與註記', words: '隨手記（只有文字）', photos: '隨手記（有照片）', practice: '練習紀錄', acts: '活動紀錄', tools: '各工具的紀錄' },
        hints: { states: '今天怎麼樣、動力、發現、想探索的問題、使用說明書。', photos: '照片比較大，裝置放不下，所以有照片的那一筆放雲端。不放照片就不會上去。',
          acts: '你在活動問卷裡填的，由主辦方匯入。', tools: '呼吸、身體量測、問易、心情溫度計、八態能格等。由各工具自己保管，這一頁只是把這台裝置上的那一份讀出來。' },
        where: { device: '這台裝置', cloud: '練息場的雲端', none: '還沒有', out: '雲端，登入後才讀得到', tools: '這台裝置。在工具裡登入的話，有些工具會同步到工具自己的雲端。' },
        who: { me: '只有你', admin: '你。其他使用者看不到；平台管理者從後台看得到。', host: '你和主辦方。其他使用者看不到；平台管理者從後台看得到。', tools: '依各工具自己的說明。' },
        act: { tocloud: '改放雲端', tolocal: '搬回這台裝置', wipephotos: '全部刪掉', login: '登入後可以選', acts: '一筆一筆決定' },
        noCloud: '還不能放雲端',
        cloudAsk: '放到雲端之後，換裝置也看得到。其他使用者看不到；平台管理者從後台看得到。確定嗎？', cloudYes: '放到雲端',
        busy: '正在搬…',
        share: '給夥伴或其他人看的選項還沒開放。開放的時候會在這張表多一個選擇，預設仍然是只有你。'
      },
      wipe: '刪除這一頁的註記', wipeAsk: '確定刪除？各工具自己的紀錄不會被動到。', wipeYes: '確定刪除', wiped: '這一頁的註記刪掉了，工具的紀錄還在' },
    // 五個空間（資訊架構，取自構想稿第 04 節）。使用模式（主動記錄／活動串接／綜觀地圖）不放在同一層導覽：
    // 「記一句」每個空間都按得到；體驗足跡與生命地圖是「我的地圖」裡的切換。抵達時一律先到「練習」。
    // 2026-11-26 使用者改名：今天→練習（記錄都在這裡）、練習→總覽（總覽與分析，不記錄）、我的地圖→小練息們（平台工具）。網址代號不變。
    panes: [{ key: 'today', name: '練習', q: '今天練了什麼' }, { key: 'explore', name: '探索', q: '我對什麼感興趣' },
      { key: 'practice', name: '總覽', q: '練得怎麼樣' }, { key: 'mymap', name: '小練息們', q: '練息場的小工具' },
      { key: 'care', name: '陪伴', q: '誰可以支持我' }],
    subs: [{ key: 'trail', name: '體驗足跡' }, { key: 'overview', name: '生命地圖' }],
    quick: '記一筆',
    // 產品名稱（使用者 2026-11-25 定案）。
    name: '練息手帳',
    // 「練習」以練習為主（使用者 2026-11-25）：最上面是我的練習，再來是隨手記。狀態不再是主角，縮成一顆小按鈕。
    home: { monthNote: '留下就算，數字只跟自己比。', noteTitle: '隨手記', noteNote: '想到什麼就記。', noteHint: '一句話或一張照片都可以',
      stateBtn: '現在怎麼樣？', stateBtnOn: '今天：{s}', stateHint: '不知道要做什麼的時候，選一個狀態，會給你兩個可以做的。' },
    // 站外連結。線上課程目前是封測網址，正式上線前要換。
    links: { course: 'https://sandbox-courses.flow-af1.workers.dev/course', tutor: 'https://sandbox-courses.flow-af1.workers.dev/',
      booking: 'https://sandbox-courses.flow-af1.workers.dev/booking', site: 'https://www.jointoenjoy.com/' },
    explore: {
      // 想繼續探索的問題：可以陪很久的提問。觀察存成隨手記（掛著問題），所以體驗足跡也看得到。
      quest: { title: '想繼續探索的問題', note: '放在心上、慢慢看的提問。', tag: '持續探索中', line: '不是任務清單，也沒有完成率。這是一個可以陪伴你很久的提問。',
        since: '{d} 種下', write: '為它留下新觀察', list: '關聯紀錄', listN: '關聯紀錄 {n}', writePh: '這次看到了什麼？一句也可以。', save: '留下', cancel: '先不寫',
        none: '還沒有留下觀察。想到什麼，就回來寫一句。', saved: '留下了，總覽的紀錄也看得到', mark: '探索',
        rest: '先放下', rested: '先放下了，想到再拿回來', restList: '先放下的 {n} 個', back: '拿回來', del: '刪掉', delAsk: '刪掉這個問題？寫過的觀察會留在體驗足跡。', delYes: '確定刪掉', delNo: '不刪',
        newTitle: '新增一個想繼續探索的問題', newNote: '例如：什麼時候，我最能感覺自己真正放鬆？', placeholder: '我想慢慢理解……', add: '種下一個新問題', added: '種下了',
        same: '這個問題已經在上面了。', full: '先放下一個，再種新的。同時放在心上的最多 {n} 個。', empty: '還沒有種下問題。',
        goals: '項目裡訂的', goalsNote: '在「我的練習」各項目裡寫的目標或正在探索的。', goalGo: '到這個項目',
        tagAdd: '＋ 標籤', tagNew: '取一個新的', tagJoin: '加入', tagDrop: '拿掉標籤「{t}」', tagFilter: '用標籤看問題', tagAll: '全部', tagMax: 5,
        max: 12, chars: 80, obs: 300, show: 5, more: '到總覽看全部 {n} 筆' },
      // 「我的好奇」併進「想繼續探索的問題」（2026-11-25）：新的一律種成問題；以前記下的還看得到。
      curious: { title: '之前記下想靠近的事', note: '做了之後，到「練習」的「還開著的」補一句發現。', go: '到練習接著做' },
      themes: { title: '我在意的主題', note: '你自己取的標籤。', none: '在任一筆紀錄上加標籤，主題會出現在這裡。' },
      around: { title: '可以去看看的', note: '課程和活動在別的頁面，會另外開啟。' },
      cards: [
        { name: '線上課程', desc: '心理能量管理：內耗覺察、自我價值、人際界線、能量永續。每集 15 分鐘。', link: 'course', tag: '第一章已開放' },
        { name: '活動與工作坊', desc: '實體的五感體驗與療癒工作坊。', link: 'site', tag: '' },
        { name: '小練息們', desc: '練息場的工具：呼吸、身體、書寫、易經、測驗，共八個。', go: 'mymap', tag: '' },
        { name: 'AI 能量助教', desc: '四位助教，在線上課程裡陪你把剛聽懂的東西放進自己的情境。是練習工具，不是諮商。', link: 'tutor', tag: '' },
        { name: '能量教練預約', desc: '真人的談話引導或身心放鬆，二選一。', link: 'booking', tag: '' }],
      later: '師資介紹和別人的經驗還沒有放進來。別人的分享要先有同意的機制。' },
    // 練習空間只有兩塊（2026-11-25）：我的練習（自己的項目，底下附參加過的活動）與平台工具。
    // 「對我有用」不再是獨立一塊，直接標在工具卡片或活動上：標在最近那一筆紀錄，取消時整個方法的標記一起拿掉。
    practice: {
      outside: { title: '參加過的活動', count: '參加過 {n} 次，上次 {d}' },
      star: { on: '★ 對我有用', off: '標為對我有用' } },
    // 陪伴＝一起練：看得到有哪些團正在進行，可以發起，也可以參加別人的團；打卡、互相鼓勵、分享一句心得（使用者 2026-11-17）。
    // 守則取自構想稿第 08、13 節：沒有排名與連續天數、可以暫停、可以離開；個人紀錄不外露。
    // 需要登入與後端才能真的運作；目前只有示範模式可以操作。
    care: {
      title: '一起練', note: '看看有哪些團正在進行，加入一個，或自己揪一個。',
      mine: { title: '我參加的團', none: '還沒參加任何團。可以從下面加入一個，或在上面揪一個。' },
      open: { title: '正在進行的團', note: '開放加入的團。還沒加入時，只看得到團名、練什麼、幾個人。', none: '現在沒有開放加入的團。可以到上面揪一個。',
        join: '加入', full: '滿了', joined: '加入了。想練的時候來打卡就好。', day: '第 {d} 天／共 {n} 天', nolimit: '不設期限・第 {d} 天', today: '今天 {n} 個人練了' },
      max: 12,
      rules: { title: '別人看得到什麼', see: '團員看得到：你在團裡的名字、你今天練了、你自己選擇寫的那一句。',
        out: '還沒加入的人只看得到：團名、練什麼、幾個人、今天幾個人練了。心得只有團員看得到。',
        hide: '誰都看不到：你的狀態、身體能量、心情溫度計，和手帳裡其他的紀錄。',
        tone: '沒有排名，也不算連續天數。只看得到今天誰練了，不會列出誰沒練。想休息可以說一聲，隨時可以離開。',
        admin: '團和打卡存在練息場的雲端，平台管理者從後台看得到。揪團的人可以請團員離開、結束這個團。',
        nick: '我在團裡的名字', nickPh: '可以不是本名' },
      cheers: ['收到', '一起', '好耶', '辛苦了'],
      rhythms: ['每天', '一週三次', '想到就做'],
      spans: [{ d: 7, name: '七天' }, { d: 21, name: '二十一天' }, { d: 0, name: '不設期限' }],
      checkin: { btn: '打卡', ph: '想分享一句心得嗎？可以不寫', done: '你今天打過卡了。', keep: '寫下的那一句也會留在你自己的手帳裡。', go: '先去做' },
      rest: { on: '這週先休息', off: '我回來了', say: '這週先休息' },
      week: '這七天，團裡一起練了 {n} 次', today: '今天', none: '今天還沒有人打卡。可以當第一個。', leave: '離開這個團',
      create: { title: '揪團一起練', lead: '找幾個人一起練同一件事，自己訂多久、什麼節奏。', name: '取個名字', namePh: '例如：午休三口呼吸', what: '一起練什麼', own: '自己的方法（太極、散步……）',
        span: '多久', rhythm: '節奏', who: '誰可以加入', open: '開放加入', invite_only: '邀請制',
        openNote: '開放加入的團會出現在「正在進行的團」，任何人都能加入。邀請制只有拿到連結的人能加入。',
        go: '發起', invite: '複製邀請連結', made: '團開好了。' },
      tags: { open: '開放加入', closed: '邀請制' },
      locked: { title: '先登入', text: '一起練要讓團員看得到彼此，所以要先登入手帳。', demo: '先看示範長什麼樣子' },
      // 正式版（雲端）。團和打卡存在練息場的雲端。
      cloud: { login: '一起練要讓團員看得到彼此，所以要先登入手帳。', loginShort: '登入之後看得到正在進行的團。', invitedTitle: '有人邀請你一起練', invited: '登入之後就看得到是哪個團，再決定要不要加入。登入不等於加入。',
        verify: '信箱還沒驗證，驗證之後才能揪團或加入。到「練習」完成驗證。', offline: '這台裝置現在連不上雲端，一起練要連上才能用。',
        loading: '正在讀團…', fail: '讀不到團，請再試一次。', retry: '再試一次', err: '沒有成功，請再試一次。', denied: '沒有成功：這個動作不被允許，可能團已經結束或人滿了。',
        nickAsk: '我在團裡的名字（可以不是本名）', nickPh: '例如：小魚', joinOk: '確定加入', cancel: '不用了', ok: '知道了',
        inviteTitle: '有人邀請你加入「{n}」', inviteGone: '這個團已經結束，或連結不對。',
        copied: '邀請連結複製好了，傳給想一起的人。', copyFail: '複製不了，請手動複製：{u}',
        members: '團員 {n} 人', owner: '揪團的人', noName: '團員',
        leaveAsk: '離開之後，你在這個團打過的卡和寫的話會一起刪掉，團員就看不到了；你自己手帳裡的那一份還在。確定離開？', leaveYes: '確定離開', left: '離開了。你自己手帳裡的紀錄還在',
        end: '結束這個團', endAsk: '結束之後，所有團員都看不到這個團了。確定結束？', endYes: '確定結束', ended: '團結束了',
        kick: '請他離開', kickAsk: '請「{n}」離開？他在這個團打過的卡會一起刪掉。', kickYes: '確定', kicked: '請他離開了', stay: '先不要' },
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
    capture: { label: '隨手記', forState: '記下「{s}」的這一刻', placeholder: '一句話、一個詞都可以', keep: '記一筆', start: '這是我想靠近的事', note: '只有一句話時存在這台裝置；放了照片的那一筆會存到你的雲端。', useful: '你標過「對我有用」的' },
    // 靈感區：一句話，或幾張照片各自加註解。有照片的一筆存到本人的雲端（Firebase），只有本人看得到。
    // 上限與 firestore.rules 一致；改這裡要一起改規則。
    insp: { maxPhotos: 4, maxEdge: 1280, maxDataLen: 420000, maxCaption: 200, maxText: 500, saveTimeoutMs: 30000,
      slow: '還在存，網路比較慢。先不要關掉這一頁。', demoNote: '示範模式不會儲存。', keptLocal: '留下了',
      add: '加照片', needLogin: '登入後可以放照片', signIn: '用 Google 登入', signOut: '登出', signedIn: '{n} 已登入',
      cloudNote: '放了照片的這一筆會存到你的雲端，只有你看得到。', offline: '照片功能暫時連不上，可以先只記一句。',
      caption: '這張想說什麼（可以不寫）', remove: '拿掉', left: '往前', right: '往後', saving: '存的時候…',
      kept: '留下了，照片存到你的雲端', fail: '沒有存到，請再試一次。內容都還在。', photoCount: '{n} 張照片',
      deleted: '刪掉了', removed: '拿掉了', photoAlt: '照片', cancel: '取消',
      delPhoto: '拿掉這張', delIns: '刪除這一筆', delAsk: '確定刪除？雲端上的照片也會一起刪掉。', delYes: '確定刪除',
      full: '一筆最多 {n} 張', compressFail: '這張照片讀不出來，換一張試試',
      wipe: '刪除我在雲端的隨手記與照片', wipeAsk: '確定刪除？雲端上所有隨手記與照片都會刪掉，不能復原。', wipeYes: '確定刪除', wiped: '雲端的靈感與照片刪掉了',
      bad: { empty: '寫一句或放一張照片', text: '這一句太長了', count: '一筆最多 4 張', type: '只能放照片', size: '照片太大了', caption: '註解太長了' } },
    // 活動紀錄：參加者在活動問卷裡填的內容，由管理者匯入，本人登入後自己決定要不要收進手帳。
    // cols 是「只匯入這九欄」的白名單（比對試算表標題列的開頭）；其他欄位在瀏覽器裡就丟掉。上限與 firestore.rules 一致。
    act: { maxText: 2000, maxTitle: 100, maxUrl: 500, visAlt: '的主視覺',
      cols: { email: 'Email', preBody: '前測_身體狀態', preMood: '前測_情緒狀態', expect: '活動前期待', feeling: '過程感受',
        postBody: '後測_身體狀態', postMood: '後測_情緒狀態', takeaway: '最實用日常收穫', feedback: '心得與回饋' },
      sesCol: ['場次日期', '參加日期'],
      tlds: ['tw', 'com', 'net', 'org', 'edu', 'io', 'co', 'jp', 'hk', 'sg', 'us', 'uk', 'cn', 'me', 'app', 'dev'],
      flags: { missing: '沒有信箱', format: '信箱格式不對', tld: '信箱結尾可疑', dup: '同一場重複', score: '分數不在 1–10', blank: '沒有填問卷', noses: '還沒選場次', cols: '找不到欄位' },
      ask: '你參加過「{t}」（{d}），要收進手帳嗎？',
      // 問卷有寫東西的人：先讓他看到自己當時寫的那一句（原文，不改寫、不解讀），再問要不要收。
      quoteHead: '{d}，你參加了「{t}」。', quoteAsk: '要把這一頁收進手帳嗎？', quoteMax: 120,
      quoteLead: { expect: '去之前，你寫下：', feeling: '關於那天的過程，你寫下：', takeaway: '你說帶回來的是：', feedback: '活動之後，你寫下：' },
      backAsk: '收進手帳了。現在回頭看，想補一句嗎？', backPh: '一句就好，也可以不寫', backSave: '留下', backSkip: '先不用', backSaved: '補上了，在「體驗足跡」那一頁', backMax: 80, keep: '收進來', decline: '不用', later: '之後再說',
      declineAsk: '確定不用？雲端這一筆的內容會刪掉，只留下「這一場不用」的記號，之後不會再問。', declineYes: '確定不用', kept: '收進手帳了，在「體驗足跡」', declined: '好，這一筆不收。內容已經從雲端刪掉，只留下「這一場不用」的記號', demoDeclined: '好，這一筆不收。（示範模式，沒有東西被刪除）', fallbackTitle: '活動',
      fail: '沒有成功，請再試一次。', before: '活動前', after: '活動後', body: '身體', mood: '情緒',
      expect: '活動前期待', feeling: '過程感受', takeaway: '最實用日常收穫', feedback: '心得與回饋', photo: '看活動照片',
      drop: '從手帳拿掉', dropAsk: '確定拿掉？雲端這一筆的內容會刪掉，只留下「這一場不用」的記號，不能復原。', cancel: '取消',
      invite: '參加過練息場的活動？用報名的信箱登入，可以把你當時填的內容收進手帳。', inviteHide: '不用提醒',
      demoNote: '示範模式：這是虛構的活動紀錄，不會儲存。', from: '這是你在活動問卷裡填的內容。' },
    // 登入：Google 之外，可以用信箱加密碼。只有驗證過的信箱對得到活動紀錄。
    // 右上角的登入狀態。不登入也能用，所以沒登入時不催，只說登入多了什麼。
    acct: { label: '登入狀態', out: '未登入', outTitle: '還沒登入', outNote: '不登入也能用，紀錄留在這台裝置。登入後可以放照片、收活動紀錄，也可以把練習紀錄放到雲端。',
      inNote: '已登入', unverified: '信箱還沒驗證，到「練習」完成驗證。', demo: '示範模式', noName: '已登入',
      // 平台工具的登入（Google）和手帳雲端的登入是兩道。只在工具登入時，名字照樣顯示，並說清楚還差哪一步。
      toolNote: '你在練息場的工具已經登入。手帳的照片、活動紀錄和雲端備份用的是另一道登入，用同一個帳號再確認一次，之後就不會再問。',
      toolOpen: '用這個 Google 帳號確認', toolInvite: '你在練息場已經登入了。參加過活動的話，用同一個帳號再確認一次，就能把你當時填的內容收進手帳。',
      offline: '這台裝置現在連不上登入服務，紀錄照樣留在這台裝置。' },
    auth: { open: '用信箱登入', title: '用信箱登入', hint: '請用報名活動的信箱登入。', email: '信箱', pw: '密碼', pwNote: '至少 6 個字。',
      signIn: '登入', signUp: '第一次用，建立帳號', reset: '忘記密碼', resetSent: '重設密碼的信寄出了，也請看看垃圾信。',
      verifyNote: '驗證信已寄到 {e}，點信裡的連結就完成。也請看看垃圾信。', resend: '重寄驗證信', resent: '驗證信重寄了',
      refresh: '我驗證好了', notYet: '還沒收到驗證。點了信裡的連結之後再按一次。', close: '關閉',
      err: { 'auth/invalid-credential': '信箱或密碼不對。', 'auth/wrong-password': '信箱或密碼不對。', 'auth/user-not-found': '信箱或密碼不對。',
        'auth/email-already-in-use': '這個信箱已經有帳號了，請直接登入。', 'auth/weak-password': '密碼至少要 6 個字。',
        'auth/invalid-email': '信箱格式不對。', 'auth/too-many-requests': '試太多次了，請晚一點再試。', other: '沒有成功，請再試一次。' } },
    prac: {
      max: { name: 30, unit: 10, note: 500, title: 100, body: 20000, amount: 100000, goal: 60 },
      // AI 讀心得：自己按才送。url 是平台的 AI 代理（ven-i/worker.js 的 /me-read）。
      page: 30, recall: { recent: 3, star: 2, chars: 140, row: 16 },
      ai: { url: 'https://calm-sunset-97f8.simon-ec6.workers.dev/me-read', min: 3, maxChars: 12000, one: 2000 },
      units: ['分鐘', '次', '遍', '小時', '公里', '頁'],
      examples: [{ name: '太極', unit: '分鐘' }, { name: '靜坐', unit: '分鐘' }, { name: '呼吸', unit: '分鐘' }, { name: '書法', unit: '張' }, { name: '閱讀', unit: '頁' }],
      colors: ['#2F6BD8', '#34C8A0', '#FF9925', '#7A6BD8', '#E8690B', '#4CAF19'],
      // 項目可以挑的手繪圖示（檔案在 me/doodles/，k 是檔名）。只挑適合當練習項目的，不求全。
      icons: [{ k: 'b25', n: '太極' }, { k: 'b26', n: '弓步' }, { k: 'b32', n: '推手' }, { k: 'b13', n: '站樁' }, { k: 'b11', n: '靜坐' }, { k: 'b12', n: '呼吸' },
        { k: 'b14', n: '樹式' }, { k: 'b21', n: '下犬式' }, { k: 'b22', n: '戰士式' }, { k: 'b15', n: '嬰兒式' }, { k: 'b23', n: '扭轉' }, { k: 'b76', n: '躺著休息' },
        { k: 'b42', n: '閉眼' }, { k: 'b43', n: '聆聽' }, { k: 'b35', n: '雙手' }, { k: 'b36', n: '腳底' }, { k: 'b71', n: '心跳' }, { k: 'b73', n: '太極圖' }, { k: 'b75', n: '流動' },
        { k: 'a21', n: '散步' }, { k: 'e12', n: '山' }, { k: 'a31', n: '樹' }, { k: 'a26', n: '書寫' }, { k: 'a14', n: '閱讀' }, { k: 'a24', n: '一杯茶' }, { k: 'e24', n: '月亮' },
        { k: 'a55', n: '魚' }, { k: 'a61', n: '跳躍' }, { k: 'a63', n: '營火' }, { k: 'a15', n: '心' }, { k: 'e33', n: '新芽' },
        { k: 'c21', n: '雲手' }, { k: 'c23', n: '棍' }, { k: 'c28', n: '伸展' }, { k: 'c29', n: '側彎' }, { k: 'c2b', n: '坐姿前彎' },
        { k: 'c31', n: '跑步' }, { k: 'c32', n: '騎車' }, { k: 'c33', n: '游泳' }, { k: 'c34', n: '舉重' }, { k: 'c35', n: '伏地挺身' }, { k: 'c36', n: '壺鈴' }, { k: 'c37', n: '拳擊' }, { k: 'c38', n: '跳繩' }, { k: 'c39', n: '登山' },
        { k: 'c68', n: '吐氣' }, { k: 'c64', n: '唱誦' }, { k: 'c6a', n: '睡眠' }, { k: 'e41', n: '蓮花' }, { k: 'c5a', n: '脈輪' },
        { k: 'e52', n: '頌缽' }, { k: 'e53', n: '鑼' }, { k: 'c74', n: '鼓' }, { k: 'e54', n: '薩滿鼓' }, { k: 'e51', n: '手碟' }, { k: 'e63', n: '笛' }, { k: 'c7a', n: '琴' }, { k: 'e64', n: '風鈴' },
        { k: 'd31', n: '古箏' }, { k: 'd32', n: '吹笛' }, { k: 'd33', n: '吉他' }, { k: 'd62', n: '水晶缽' },
        { k: 'd21', n: '泡茶' }, { k: 'd22', n: '抹茶' }, { k: 'd23', n: '茶道' }, { k: 'd24', n: '書法' }, { k: 'd25', n: '畫畫' }, { k: 'd26', n: '寫生' }, { k: 'd27', n: '攝影' },
        { k: 'd41', n: '讀書' }, { k: 'd34', n: '圍棋' }, { k: 'd35', n: '象棋' }, { k: 'd36', n: '西洋棋' }, { k: 'd42', n: '疊石' }, { k: 'd43', n: '念珠' }, { k: 'd16', n: '線香' }, { k: 'd15', n: '精油' }, { k: 'e42', n: '園藝' },
        { k: 'd54', n: '按摩' }, { k: 'd55', n: '腳底按摩' }, { k: 'd51', n: '針灸' }, { k: 'd52', n: '艾灸' }, { k: 'd53', n: '拔罐' }, { k: 'd56', n: '刮痧' },
        { k: 'e44', n: '泡湯' }, { k: 'd12', n: '森林步道' }, { k: 'd13', n: '抱樹' }, { k: 'd75', n: '健行' }, { k: 'd63', n: '露營' }, { k: 'd64', n: '吊床' }, { k: 'd65', n: '觀星' },
        { k: 'd74', n: '攀岩' }, { k: 'd73', n: '衝浪' }, { k: 'd76', n: '獨木舟' }, { k: 'd77', n: '浮潛' }, { k: 'd72', n: '騎馬' }, { k: 'd71', n: '陪毛孩' },
        { k: 'e11', n: '日出' }, { k: 'e13', n: '森林' }, { k: 'e14', n: '瀑布' }, { k: 'e21', n: '溪流' }, { k: 'e22', n: '湖' }, { k: 'e23', n: '雲' }, { k: 'e31', n: '風' }, { k: 'e32', n: '浪' }, { k: 'e34', n: '葉子' }, { k: 'e43', n: '小路' },
        { k: 'e61', n: '口簧琴' }, { k: 'e62', n: '迪吉里杜管' }],
      // 圖示分門別類，挑的時候照這個順序一類一類排（ks 是上面的 k）。每個圖示只放一類。
      iconGroups: [
        { n: '身體與動作', ks: ['b25', 'b26', 'b32', 'b13', 'c21', 'c23', 'b14', 'b21', 'b22', 'b15', 'b23', 'c28', 'c29', 'c2b'] },
        { n: '運動', ks: ['a21', 'd75', 'c31', 'c32', 'c33', 'c34', 'c35', 'c36', 'c37', 'c38', 'c39', 'a61', 'd74', 'd73', 'd76', 'd77', 'd72'] },
        { n: '靜心與呼吸', ks: ['b11', 'b12', 'c68', 'b76', 'b42', 'c6a', 'e41', 'c5a', 'd42', 'd43', 'd16'] },
        { n: '聲音與音樂', ks: ['b43', 'c64', 'e52', 'e53', 'c74', 'e54', 'e51', 'd62', 'e63', 'd32', 'c7a', 'd31', 'd33', 'e64', 'e61', 'e62'] },
        { n: '茶、書寫與創作', ks: ['a24', 'd21', 'd22', 'd23', 'a26', 'd24', 'a14', 'd41', 'd25', 'd26', 'd27', 'd34', 'd35', 'd36'] },
        { n: '身體照顧', ks: ['d54', 'd55', 'b35', 'b36', 'd51', 'd52', 'd53', 'd56', 'd15', 'e44'] },
        { n: '自然與戶外', ks: ['e11', 'e12', 'e13', 'a31', 'd12', 'd13', 'e43', 'e14', 'e21', 'e22', 'e32', 'e23', 'e31', 'e34', 'e42', 'e33', 'e24', 'a55', 'a63', 'd63', 'd64', 'd65', 'd71'] },
        { n: '符號', ks: ['a15', 'b71', 'b73', 'b75'] }],
      iconOther: '其他',
      // 換過畫風的圖示：舊代號 → 新代號。已經挑了舊圖的項目自動顯示新圖，不用重挑。
      iconAlias: { a32: 'e12', a22: 'e24', a44: 'e33', c6c: 'e41', d14: 'e42', d11: 'e44', c76: 'e51', c71: 'e52', c73: 'e53', c75: 'e54', c79: 'e63', c7b: 'e64' },
      weeks: 12, months: 12,
      err: { name: '請填項目名稱（30 字以內）', unit: '請填單位（10 字以內）', date: '日期不對', future: '不能選未來的日子', amount: '請填大於 0 的數字', note: '這一句太長了（500 字以內）', title: '請填標題（100 字以內）', body: '內文太長了（20000 字以內）', goal: '這一句太長了（60 字以內）', empty: '先寫點什麼', fam: '至少填一格，要大於 0' },
      t: { title: '我的練習', note: '每個項目練得怎麼樣。點進去看分析與時間軸；要記一筆請到「練習」。',
        // 我的練習（練習空間最上面）
        empty: '還沒有項目。太極、靜坐、每天的散步……自己長期在練的事，都可以放進來，練完記一筆。', examples: '例如',
        add: '新增項目', addTitle: '新增一個練習項目', mgr: '項目設定', mgrNote: '新增項目，或調整原來項目的名稱、單位、圖示、顏色、小項目和封存。', mgrSet: '設定', mgrSetOf: '{n} 的設定', mgrClose: '收起', added: '「{n}」放進來了，練完就可以記一筆',
        last: '上次 {d}', never: '還沒有紀錄', month: '這個月 {n} 次・共 {s} {u}', monthNone: '這個月還沒有紀錄',
        archivedN: '已封存（{n}）',
        // 項目表單
        name: '名稱', namePh: '例如：太極', unit: '單位', unitOwn: '單位（也可以自己打）', unitPh: '自己打，例如：頁',
        icon: '圖示', iconNone: '不用圖示', color: '顏色', colorNames: ['藍', '青綠', '橘', '紫', '深橘', '綠'], save: '存起來', cancel: '取消', saved: '存起來了',
        // 記一筆
        log: '記一筆', logFor: '記一筆：{n}', quickTitle: '我的練習', quickNote: '按「記一筆」打數字。點項目看上次寫的。', quickGo: '看我的練習',
        amountFor: '數量（{u}）', notePh: '一句（可以不寫）', date: '日期', submit: '記下來',
        logged: '記下了：{n} {a} {u}', loggedOn: '記下了：{d} {n} {a} {u}', todayDid: '今天 {s} {u}',
        // 專區
        back: '回到總覽', unitIs: '單位：{u}', unitEdit: '改', archivedTag: '已封存', notFound: '找不到這個項目，可能已經刪掉了。',
        tabs: { log: '總覽', write: '紀錄與心得', set: '設定' }, tabsLabel: '這個項目的內容',
        // 紀錄分頁
        thisMonth: '這個月', allTime: '開始到現在', times: '次', total: '共 {s} {u}', since: '從 {d} 開始',
        noLogs: '還沒有紀錄。練完記一筆，或在月曆上點一天補記，這裡會慢慢長出你自己的月曆和長條圖。',
        cal: '月曆', ym: '{y} 年 {m} 月', prevMonth: '上個月', nextMonth: '下個月', monthSum: '這個月份 {n} 次・共 {s} {u}', monthEmpty: '這個月份沒有紀錄',
        wd: ['一', '二', '三', '四', '五', '六', '日'], dayAria: '{m} 月 {d} 日，{x}', dayHas: '{n} 筆，共 {s} {u}', dayNone: '沒有紀錄', todayAria: '（今天）',
        pickDay: '點一天，看那天記了什麼，也可以補記。', dayEmpty: '這一天沒有紀錄。', addOn: '在這天補記',
        edit: '修改', del: '刪除', delLogAsk: '確定刪除這一筆？', delYes: '確定刪除', deleted: '刪掉了',
        trend: '長條圖', byWeek: '每週', byMonth: '每月', chartCap: '每一根是那段時間的合計（{u}），只跟自己的紀錄放在一起看。',
        chartAltW: '最近 {c} 週，每週的合計：{list}', chartAltM: '最近 {c} 個月，每月的合計：{list}', chartNone: '這段時間沒有紀錄。',
        barAlt: '{w} {s} {u}', listSep: '、', weekOf: '{d} 那一週', monthOf: '{y} 年 {m} 月', barTip: '{w}：{n} 次，共 {s} {u}', thisWeekShort: '本週', thisMonthShort: '本月', monthShort: '{m}月',
        // 心得靈感分頁
        inspLabel: '關於「{n}」，想留下的一句', inspKeep: '留下', inspPhoto: '要放照片', inspKept: '留下了',
        inspNote: '只有一句話時存在這台裝置。要放照片，會帶你到「練習」的隨手記。', inspNone: '還沒有屬於這個項目的心得靈感。',
        // 筆記分頁
        notesNew: '新增筆記', notesNone: '還沒有筆記。招式的順序、老師說的話、自己的體會，都可以寫成一份。',
        noteTitle: '標題', noteTitlePh: '例如：二十四式的順序', noteBody: '內文', noteClose: '收起來', noteDel: '刪除這份筆記',
        noteDelAsk: '確定刪除這份筆記？不能復原。', updated: '最後修改 {d}',
        // 寫下的（心得、筆記、感想不分類，選好項目就寫，長短不拘；重要的可以標星星）
        writeLabel: '關於「{n}」，想寫什麼都可以，長短不拘', writeKeep: '留下', writeKept: '留下了', writeIn: '寫在',
        writeNone: '還沒有寫下什麼。招式的順序、老師說的話、今天的體會，都寫在這裡。',
        writeAll: '全部', writeStar: '只看星星', starNone: '還沒有標星星的。', star: '標成重要', unstar: '取消重要',
        writeEdit: '改', writeDel: '刪除', writeDelAsk: '確定刪除這一段？不能復原。', writeFromToday: '在「練習」留下的', writeCancel: '取消',
        // 目標，或正在探索的
        goal: '目標，或正在探索的（可以不寫）', goalPh: '例如：把二十四式打順／肩膀怎麼鬆', goalNone: '設一個目標，或寫下正在探索的', goalLabel: '正在探索', goalEdit: '改',
        // 大項目底下的小項目
        parent: '放在哪個項目底下', parentNone: '不放在別的項目底下', kids: '小項目', kidAdd: '新增小項目', kidAddTitle: '在「{n}」底下新增小項目',
        kidNote: '小項目有自己的單位和紀錄，數量各算各的。', kidsOf: '小項目：{list}', monthFam: '這個月 {n} 筆（含小項目）', backTo: '回到「{n}」',
        delKids: '底下的小項目會留著，變成獨立的項目。',
        // 有小項目的大項目：記一筆是一張表，各填各的；大項目頁是彙整
        whole: '{n}（整體）', wholeAdd: '不分小項目，記整體', loggedFam: '記下了：{n} {c} 筆', todayFam: '今天 {c} 筆',
        daysUnit: '天', unitSum: '{s} {u}', monthSumFam: '這個月份 {n} 筆', dayHasFam: '{n} 筆', barAltFam: '{w} {n} 筆',
        chartCapFam: '每一根是那段時間記了幾筆，只跟自己的紀錄放在一起看。',
        recent: '最近寫下的', recentAll: '看全部 {n} 段',
        writeFromLog: '記一筆時寫的・{a} {u}', writeGo: '到紀錄裡改', writeLogEdit: '到那一天改',
        quickEmpty: '長期在練的事可以放進來，練完記一筆。先挑一個：', quickOwn: '自己取一個',
        insTitle: '看得出來的', insNote: '照你的紀錄算出來的。只描述，不解釋原因。',
        ins: { monthMore: '這個月練了 {a} 天，比上個月多 {d} 天。', monthLess: '這個月練了 {a} 天，比上個月少 {d} 天。', monthSame: '這個月和上個月一樣，都是 {a} 天。', monthOnly: '這個月練了 {a} 天。',
          lastToday: '今天有練。', last: '上一次是 {d}，{n} 天前。', wd: '最常在{w}練，有 {n} 天。', gap: '隔最久的一次是 {d} 天（{a} 到 {b}）。',
          top: '最常記的是「{n}」，{c} 筆。', avg: '每次平均 {v} {u}，最多一次 {m} {u}。', wr: '寫下 {n} 段，其中 {s} 段標了星星。', wr0: '寫下 {n} 段。',
          tools: '平台工具另外留下：{list}。', toolOne: '{n} {c} 筆' },
        wdFull: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
        rcTitle: '心得筆記', rcNote: '練之前翻一下，接著上次的往下練。', rcGoal: '還在探索的', rcRecent: '最近寫下的', rcStar: '標了星星的',
        rcNone: '這個項目還沒寫過。練完寫一句，下次就能從這裡接著練。', rcWrite: '寫一段',
        // 「練習」一項一列：列上帶上次哪一天與最近一句；項目設定在原地展開，預設收著
        rowToday: '今天練了', zoneHint: '這裡是整理和分析。要記一筆或寫心得，回「練習」。', zoneGo: '回練習記一筆', qmgrNote: '單位選了就會存。名稱、圖示、小項目進「設定」改。', qunitOf: '{n}的單位', qunitDone: '{n}的單位改成「{u}」了',
        wMore: '再看更早的（還有 {n} 筆）', wfWords: '有寫字的', tlTool: '平台工具', tlNone: '這裡還沒有東西。記一筆，或在上面寫一段。',
        toolsLabel: '算進來的平台工具', toolsNote: '勾了之後，這些工具留下的紀錄會排進「紀錄與心得」。只並列，不和你記的數量加在一起。',
        aiTitle: '請 AI 讀一讀', aiNote: '把這個項目寫下的內容交給 AI，整理出反覆出現的主題和你還在問的問題。',
        aiBtn: '請 AI 讀一讀', aiFew: '寫下滿 {n} 段之後，才能請 AI 讀。現在有 {c} 段。',
        aiAsk: '會送出去的是：項目名稱、目標那一句、{n} 段寫下的文字（共 {c} 字）和上面那幾句統計。不會送出你的姓名、信箱和照片。內容交給平台的 AI 服務（Anthropic）處理，平台自己不存。',
        aiCut: '內容比較多，這次只送最近的 {n} 段。', aiYes: '送出，請 AI 讀', aiWait: 'AI 正在讀，大約半分鐘…',
        aiFail: 'AI 現在沒有回應，稍後再試。你寫的內容沒有變動。', aiLimit: '今天請 AI 讀的次數到了，明天再來。', aiDemo: '示範模式不會送出資料。',
        aiStamp: 'AI 讀後整理・僅供參考・沒有存下來，離開這一頁就不見', aiAgain: '再讀一次',
        kidSet: '底下再分小項目', kidSetNote: '例如太極底下分拳、劍、站樁。分了之後，數量記在小項目，這一頁變成彙整。', starFilter: '星星',
        setMore: '圖示、顏色、目標之後都可以在項目的「設定」裡改。',
        // 設定分頁
        setTitle: '名稱、單位、目標、圖示', unitWarn: '改單位不會換算以前記的數字。',
        archive: '封存', unarchive: '解除封存', archiveNote: '封存之後，「練習」不會出現它的快速鍵；紀錄都留著，隨時可以解除。',
        archivedDone: '封存了，紀錄都還在', unarchivedDone: '解除封存了',
        delItem: '刪除這個項目', delItemAsk: '確定刪除「{n}」？它的 {l} 筆紀錄、{k} 段寫下的會一起刪掉，不能復原。在「練習」留下、屬於它的隨手記會留著，只是不再標記這個項目。',
        fail: '沒有存到，請再試一次。內容都還在。',
        // 放雲端、搬回本機（登入之後才會出現）
        cloudAsk: '要把這台裝置上的練習紀錄（{n} 筆）放到雲端嗎？換裝置也看得到。其他使用者看不到；平台管理者從後台看得到。', askYes: '放到雲端', askNo: '留在這台裝置',
        importAsk: '這台裝置上有 {n} 筆練習紀錄，要一起放進去嗎？', importYes: '放進去', importNo: '先不要',
        upBusy: '正在放上去…', upFail: '這次沒有放上去。這台裝置上的紀錄都還在，沒有動，可以再試一次，或先不要。', upNo: '先不要', retry: '再試一次', uploaded: '放到雲端了',
        whereCloud: '練習紀錄放在雲端。', toLocal: '改成只存在這台裝置', whereLocal: '練習紀錄存在這台裝置。', toCloud: '改成放到雲端',
        downAsk: '把雲端的練習紀錄全部搬回這台裝置，雲端那一份會刪掉。確定嗎？', downYes: '確定搬回', downBusy: '正在搬回來…',
        downFail: '沒有讀到雲端的紀錄，什麼都沒有動，可以再試一次。', downDone: '搬回這台裝置了',
        wipeLeft: '練習紀錄已經在這台裝置上了，但雲端那一份沒刪乾淨，可以再試。', wipeRetry: '再刪一次', wipeDone: '雲端那一份刪乾淨了',
        needLogin: '登入後看得到你的練習紀錄。', useLocal: '先在這台裝置上用',
        loading: '正在讀取練習紀錄…', loadFail: '沒有讀到雲端的練習紀錄。', notReady: '練習紀錄還沒讀進來，請稍等一下再下載。',
        // 靈感框的項目選單
        memoItem: '屬於哪個項目', memoItemNone: '不屬於哪個項目',
        // 紀錄清單裡：同一個項目的紀錄串在一起看；記下之後也能補掛、改掛。
        itemFilter: '我的項目', itemOnly: '只看「{n}」的', itemPage: '到「{n}」的頁面', itemCount: '「{n}」的紀錄，{c} 筆。', itemAll: '看全部', itemSaved: '改好了', itemFail: '沒有改成，等一下再試。' },
      // 示範模式（?demo）的虛構資料；紀錄由 me-practice.js 用固定種子產生
      demo: {
        items: [{ id: 'pi-demo-taichi', name: '太極', unit: '分鐘', color: '#34C8A0', icon: 'b25', goal: '把二十四式打順' }, { id: 'pi-demo-sit', name: '靜坐', unit: '分鐘', color: '#7A6BD8', icon: 'b11', tools: 'xiaoqi,breathe' },
          { id: 'pi-demo-form', name: '二十四式', unit: '遍', color: '#34C8A0', icon: 'c21', parent: 'pi-demo-taichi' }],
        logNotes: { 'pi-demo-taichi': ['雲手比較順了', '下雨，在客廳練', '老師說腰再鬆一點', '練完整個人很安靜', '只練了起勢，也算'], 'pi-demo-sit': ['數息數到一半就亂了，拉回來就好', '腿麻得比上次晚'] },
        notes: [{ id: 'pn-demo-1', itemId: 'pi-demo-taichi', days: 9, title: '二十四式的順序', body: '起勢\n左右野馬分鬃\n白鶴亮翅\n左右摟膝拗步\n手揮琵琶\n……\n\n（示範筆記）' },
          { id: 'pn-demo-2', itemId: 'pi-demo-taichi', days: 31, title: '老師說的話', body: '鬆不是軟。\n先站穩，再動手。' },
          { id: 'pn-demo-3', itemId: 'pi-demo-sit', days: 16, title: '坐之前', body: '手機放到別的房間。\n先喝一口水。' }],
        memos: [{ itemId: 'pi-demo-taichi', days: 6, text: '雲手的時候，肩膀終於沒有聳起來。' }, { itemId: 'pi-demo-sit', days: 12, text: '坐完才發現，窗外一直有鳥在叫。' }]
      }
    },
    back: { days: 7, say: '隔了 {n} 天。想從哪裡開始都可以。' },
    search: { placeholder: '找一筆紀錄：方法、標籤、寫過的話', none: '找不到符合的紀錄。' },
    // 2026-11-25 使用者決定：手帳不放「鏡子不是算命」的聲明，也不常駐求助專線。專線由心情溫度計在需要時顯示。
    footer: {}
  };
})(window);
