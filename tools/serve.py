"""Yerel önizleme sunucusu: Vercel'deki cleanUrls davranışını taklit eder.
Kullanım: python3 tools/serve.py [port]   →  http://localhost:8000/tr
/api/teklif yerelde yoktur; form 404 alır ve kullanıcıyı WhatsApp'a yönlendirir (beklenen davranış).
"""
import http.server, os, sys, functools, gzip, io

ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'public')


class H(http.server.SimpleHTTPRequestHandler):
    def send_head(self):
        path = self.path.split('?', 1)[0].split('#', 1)[0]
        if path == '/':
            self.send_response(307); self.send_header('Location', '/tr'); self.end_headers(); return None
        fs = os.path.join(ROOT, path.lstrip('/'))
        if not os.path.exists(fs) or os.path.isdir(fs):
            for cand in (fs + '.html', os.path.join(fs, 'index.html')):
                if os.path.isfile(cand):
                    self.path = '/' + os.path.relpath(cand, ROOT)
                    break
            else:
                self.path = '/404.html'
                f = open(os.path.join(ROOT, '404.html'), 'rb')
                self.send_response(404); self.send_header('Content-Type', 'text/html; charset=utf-8'); self.end_headers(); return f
        return self._maybe_gzip()

    def _maybe_gzip(self):
        # Vercel gibi metin dosyalarını sıkıştırarak gönder
        fs = self.translate_path(self.path)
        if os.path.isfile(fs) and fs.endswith(('.html', '.css', '.js', '.xml', '.json', '.txt')) and 'gzip' in self.headers.get('Accept-Encoding', ''):
            data = gzip.compress(open(fs, 'rb').read(), 6)
            self.send_response(200)
            self.send_header('Content-Type', self.guess_type(fs))
            self.send_header('Content-Encoding', 'gzip')
            self.send_header('Content-Length', str(len(data)))
            self.end_headers()
            return io.BytesIO(data)
        return super().send_head()

    def log_message(self, *a):
        pass


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    http.server.ThreadingHTTPServer(('127.0.0.1', port), functools.partial(H, directory=ROOT)).serve_forever()
