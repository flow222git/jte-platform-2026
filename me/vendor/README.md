# vendor

Firebase JS SDK 9.23.0 compat 版，原檔取自 `https://www.gstatic.com/firebasejs/9.23.0/`。
放在 repo 裡，是因為 `/me` 遵守「頁面不可有外部絕對網址 script」。版本與平台其他工具頁一致。
升級時三個檔一起換，並手動走一遍靈感區的登入與上傳。
登入時 Firebase 的彈出視窗會從 Google 載入登入所需的程式（apis.google.com 與登入網域）；這只在使用者按下登入之後發生，沒登入的訪客不會連到外部。
