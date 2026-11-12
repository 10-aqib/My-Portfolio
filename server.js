const http = require('http');
const fs = require('fs');
const path = require('path');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.webp': 'image/webp',
  '.mjs': 'text/javascript',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain',
  '.xml': 'application/xml'
};

const zlib = require('zlib');
const ROOT = path.resolve(__dirname);
const TEXT = new Set(['.html', '.js', '.mjs', '.css', '.json', '.svg', '.txt', '.xml']);

const requestHandler = (req, res) => {
  let cleanUrl;
  try { cleanUrl = decodeURIComponent(req.url.split('?')[0]); } catch (e) { cleanUrl = '/'; }
  const filePath = path.resolve(ROOT, '.' + (cleanUrl === '/' ? '/index.html' : cleanUrl));
  // Never serve files outside the project folder (blocks ../ traversal)
  if (filePath !== ROOT && !filePath.startsWith(ROOT + path.sep)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }
  const extname = path.extname(filePath).toLowerCase();
  const base = mimeTypes[extname] || 'application/octet-stream';
  const contentType = TEXT.has(extname) ? `${base}; charset=utf-8` : base;

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT' || error.code === 'EISDIR') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Server Error: ' + error.code);
      }
      return;
    }
    // Compress text like production hosting does, so local measurements are realistic
    const headers = { 'Content-Type': contentType, 'Cache-Control': 'no-cache', Vary: 'Accept-Encoding' };
    if (TEXT.has(extname) && /\bgzip\b/.test(req.headers['accept-encoding'] || '')) {
      headers['Content-Encoding'] = 'gzip';
      res.writeHead(200, headers);
      res.end(zlib.gzipSync(content));
      return;
    }
    res.writeHead(200, headers);
    res.end(content);
  });
};

const createPortListener = (port) => {
  const server = http.createServer(requestHandler);
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[Server] Port ${port} is in use, skipping...`);
    } else {
      console.error(`[Server] Error on port ${port}:`, err);
    }
  });
  server.listen(port, () => {
    console.log(`Portfolio Server running at http://localhost:${port}`);
  });
  return server;
};

// PORT env overrides; otherwise listen on 8080 (for VS Code launch.json) and 4173
if (process.env.PORT) {
  createPortListener(Number(process.env.PORT));
} else {
  createPortListener(8080);
  createPortListener(4173);
}
