// Serves the production build at /pumpkio9-website/ like GitHub Pages does,
// including the SPA fallback to index.html. Usage: npm run preview
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'build');
const BASE = '/pumpkio9-website';
const PORT = Number(process.env.PORT) || 5055;
const TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.mp4': 'video/mp4',
  '.webp': 'image/webp',
  '.txt': 'text/plain',
};

if (!fs.existsSync(ROOT)) {
  console.error('No build found. Run `npm run build` first.');
  process.exit(1);
}

http
  .createServer((req, res) => {
    const urlPath = decodeURIComponent(req.url.split('?')[0]);
    if (!urlPath.startsWith(BASE)) {
      res.writeHead(302, { Location: `${BASE}/` });
      return res.end();
    }
    let file = path.normalize(path.join(ROOT, urlPath.slice(BASE.length)));
    if (!file.startsWith(ROOT)) {
      res.writeHead(403);
      return res.end();
    }
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      file = path.join(ROOT, 'index.html');
    }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  })
  .listen(PORT, () => console.log(`Preview: http://localhost:${PORT}${BASE}/`));
