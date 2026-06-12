#!/usr/bin/env python3
# jte-testrun.py — 通用瀏覽器自我測試 runner（只用 Python3 標準函式庫）
# 用法：python3 jte-testrun.py <page.html>
#   例：python3 jte-testrun.py jte-privacy.test.html
#
# 以 jte-crypto-testrun.py 為範本，改成接受「測試頁」參數，行為不變：
#   1. 起一個隨機埠 http server 服務本目錄，並額外接受 POST /__result
#      （把 body 寫到暫存檔、標記完成）；
#   2. 用真實時間背景啟動 headless Chrome 指向 http://localhost:<port>/<page>
#      （不用 --virtual-time-budget，實測它會在 WebCrypto async 跑完前就退出）；
#   3. 輪詢結果出現後，印出測試頁回報的 PASS/FAIL/DONE 文字、kill Chrome 與 server、清暫存檔；
#   4. 若出現 FAIL 或逾時則 exit code 非 0，全綠則 exit 0。
#
# 逾時 90s：modal 測試含多次 PBKDF2（ITER=600000），給足時間。

import http.server
import os
import re
import signal
import socketserver
import subprocess
import sys
import tempfile
import threading
import time

HERE = os.path.dirname(os.path.abspath(__file__))
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
POLL_TIMEOUT = 90.0   # modal 測試含多次 PBKDF2，給足輪詢逾時
POLL_INTERVAL = 0.5

result_path = os.path.join(tempfile.gettempdir(), 'jte-testrun-result.txt')
done_event = threading.Event()


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=HERE, **kwargs)

    def do_POST(self):
        if self.path == '/__result':
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length).decode('utf-8', 'replace')
            try:
                with open(result_path, 'w', encoding='utf-8') as f:
                    f.write(body)
            finally:
                done_event.set()
            self.send_response(204)
            self.end_headers()
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, *args):
        pass  # 安靜


def main():
    if len(sys.argv) < 2:
        print('用法：python3 jte-testrun.py <page.html>')
        return 2
    test_page = sys.argv[1]

    # 清掉舊暫存檔
    if os.path.exists(result_path):
        os.remove(result_path)

    httpd = socketserver.TCPServer(('127.0.0.1', 0), Handler)
    httpd.allow_reuse_address = True
    port = httpd.server_address[1]
    server_thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    server_thread.start()

    url = 'http://127.0.0.1:%d/%s' % (port, test_page)
    profile_dir = tempfile.mkdtemp(prefix='jte-testrun-chrome-')
    chrome_args = [
        CHROME,
        '--headless=new',
        '--no-sandbox',
        '--disable-gpu',
        '--no-first-run',
        '--no-default-browser-check',
        '--user-data-dir=' + profile_dir,
        url,
    ]
    chrome = subprocess.Popen(
        chrome_args,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    exit_code = 0
    body = ''
    deadline = time.time() + POLL_TIMEOUT
    while time.time() < deadline:
        if done_event.wait(POLL_INTERVAL):
            break
    if done_event.is_set() and os.path.exists(result_path):
        with open(result_path, 'r', encoding='utf-8') as f:
            body = f.read()
    else:
        body = ''

    # 收尾：kill Chrome 與 server
    try:
        chrome.send_signal(signal.SIGTERM)
        chrome.wait(timeout=10)
    except Exception:
        try:
            chrome.kill()
        except Exception:
            pass
    httpd.shutdown()
    httpd.server_close()

    # 清暫存檔與 profile
    if os.path.exists(result_path):
        os.remove(result_path)
    try:
        import shutil
        shutil.rmtree(profile_dir, ignore_errors=True)
    except Exception:
        pass

    if not body:
        print('TIMEOUT 未在 %ds 內收到測試結果' % int(POLL_TIMEOUT))
        return 1

    # 印出 PASS/FAIL/DONE 文字
    for line in body.splitlines():
        if line.startswith('PASS') or line.startswith('FAIL') or line.startswith('DONE'):
            print(line)

    if 'FAIL' in body:
        exit_code = 1
    m = re.search(r'DONE pass=(\d+) fail=(\d+)', body)
    if m and int(m.group(2)) > 0:
        exit_code = 1
    if not m:
        exit_code = 1
    return exit_code


if __name__ == '__main__':
    sys.exit(main())
