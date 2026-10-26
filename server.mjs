import http from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
const root = resolve('.');
const port = Number(process.env.PORT || 3000);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.json': 'application/json' };
http.createServer((req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const path = resolve(root, '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
    if (!path.startsWith(root + sep) || /(?:^|[\\/])\./.test(path.slice(root.length))) { res.writeHead(403); res.end(); return; }
    const stat = statSync(path);
    if (!stat.isFile()) throw new Error('Not a file');
    res.writeHead(200, { 'Content-Type': types[extname(path)] || 'application/octet-stream', 'Content-Length': stat.size, 'X-Content-Type-Options': 'nosniff' });
    createReadStream(path).pipe(res);
  } catch { res.writeHead(404); res.end('Página não encontrada'); }
}).listen(port, '127.0.0.1', () => console.log(`Doce & Cia pronta em http://localhost:${port}`));
