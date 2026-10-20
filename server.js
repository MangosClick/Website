// Minimal static file server: `node server.js` then open http://localhost:4173
const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// GROQ_API_KEY for the chat bubble can live in a .env file next to this one
try { process.loadEnvFile(path.join(__dirname, '.env')); } catch { /* no .env: chat runs offline */ }
const chat = require('./api/chat');

const PORT = process.env.PORT || 4173;
const ROOT = __dirname;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.ttf': 'font/ttf', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.json': 'application/json',
};
const TEXT = new Set(['.html', '.css', '.js', '.svg', '.json']);

// Only the public site is served: top-level pages, assets/ and demos/.
// Everything else (Memory/, backup/, api/, node_modules/, .env, server code, notes) stays private.
const isPublic = (rel) => {
  const parts = rel.split(path.sep);
  if (parts.some((p) => p.startsWith('.'))) return false;
  if (parts.length === 1) return /\.(html|ico)$/.test(rel);
  return parts[0] === 'assets' || parts[0] === 'demos';
};

const HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'SAMEORIGIN',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https://picsum.photos https://fastly.picsum.photos",
    "connect-src 'self'",
    'frame-src https://www.google.com https://maps.google.com',
    "object-src 'none'", "base-uri 'self'", "form-action 'self'", "frame-ancestors 'self'",
  ].join('; '),
};

function notFound(req, res) {
  fs.readFile(path.join(ROOT, '404.html'), (err, page) => {
    res.writeHead(404, { ...HEADERS, 'Content-Type': TYPES['.html'] });
    res.end(err || req.method === 'HEAD' ? undefined : page);
  });
}

http.createServer((req, res) => {
  let urlPath;
  try { urlPath = decodeURIComponent(req.url.split('?')[0]); } catch { res.writeHead(400); return res.end(); }
  if (urlPath === '/api/chat') return chat(req, res);
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405, { Allow: 'GET, HEAD' }); return res.end(); }

  // Folder URLs (e.g. /demos/halden/) serve that folder's index.html
  const file = path.join(ROOT, urlPath.endsWith('/') ? urlPath + 'index.html' : urlPath);
  const rel = path.relative(ROOT, file);
  if (rel.startsWith('..') || path.isAbsolute(rel) || urlPath.includes('\0') || !isPublic(rel)) return notFound(req, res);

  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) return notFound(req, res);
    const ext = path.extname(file).toLowerCase();
    // Always revalidate so edits show up at once; unchanged files answer 304 with no body
    const etag = `"${st.size.toString(36)}-${st.mtimeMs.toString(36)}"`;
    const head = { ...HEADERS, 'Content-Type': TYPES[ext] || 'application/octet-stream', 'Cache-Control': 'no-cache', ETag: etag };
    if (req.headers['if-none-match'] === etag) { res.writeHead(304, head); return res.end(); }
    fs.readFile(file, (e2, data) => {
      if (e2) return notFound(req, res);
      if (TEXT.has(ext) && data.length > 1024 && /\bgzip\b/.test(req.headers['accept-encoding'] || '')) {
        data = zlib.gzipSync(data);
        head['Content-Encoding'] = 'gzip';
        head.Vary = 'Accept-Encoding';
      }
      head['Content-Length'] = data.length;
      res.writeHead(200, head);
      res.end(req.method === 'HEAD' ? undefined : data);
    });
  });
}).listen(PORT, () => console.log(`MANGOS site running at http://localhost:${PORT}`));
