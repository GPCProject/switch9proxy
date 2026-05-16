/**
 * REST API + Static files для Workspace Manager
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const { getGatewayPort } = require('./config');
const manager = require('./manager');
const { readWorkspaceDb } = require('./db-reader');

const WEB_DIR = path.join(__dirname, '..', 'web');
const WEB_INDEX = path.join(WEB_DIR, 'index.html');

/**
 * Раздать статический файл или index.html
 */
function serveStatic(res, reqPath) {
  // Все не-API пути отдают index.html (SPA-friendly)
  const filePath = reqPath === '/' || reqPath.startsWith('/api/') ? null : path.join(WEB_DIR, reqPath.substring(1));
  
  if (filePath && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const mime = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.svg': 'image/svg+xml',
    };
    res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' });
    res.end(fs.readFileSync(filePath));
  } else {
    // Отдаем index.html для всех не-API путей
    if (fs.existsSync(WEB_INDEX)) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(fs.readFileSync(WEB_INDEX));
    } else {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('Workspace Manager API. Open / for web UI.');
    }
  }
}

function parsePath(pathname) {
  // /api/workspaces/stealth -> { resource: 'workspaces', name: 'stealth' }
  const parts = pathname.split('/').filter(Boolean);
  return parts;
}

function startApi() {
  const port = getGatewayPort();
  
  const server = http.createServer((req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const parsed = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const method = req.method;
    const pathname = parsed.pathname;
    const parts = parsePath(pathname);

    // API маршруты
    if (parts[0] === 'api') {
      try {
        // GET /api/workspaces
        if (method === 'GET' && parts[1] === 'workspaces' && parts.length === 2) {
          const list = manager.listWorkspaces();
          const active = manager.getActiveWorkspace();
          json(res, { workspaces: list, active: active ? active.name : null });
        
        // GET /api/workspace/active
        } else if (method === 'GET' && pathname === '/api/workspace/active') {
          const active = manager.getActiveWorkspace();
          json(res, { active });
        
        // GET /api/workspace/providers — провайдеры workspace (активного или по ?name=)
        } else if (method === 'GET' && pathname === '/api/workspace/providers') {
          const wsName = parsed.searchParams.get('name') || (manager.getActiveWorkspace() || {}).name;
          if (!wsName) { error(res, 404, 'no workspace specified'); return; }
          const cfg = manager.readConfig(wsName);
          if (!cfg) { error(res, 404, `workspace "${wsName}" not found`); return; }
          const dataDir = manager.dataDirFor(wsName);
          readWorkspaceDb(dataDir).then(data => {
            json(res, { workspace: wsName, providers: data.providers, stats: data.stats });
          }).catch(e => {
            error(res, 500, e.message);
          });
        
        // GET /api/workspace/stats — статистика workspace (активного или по ?name=)
        } else if (method === 'GET' && pathname === '/api/workspace/stats') {
          const wsName = parsed.searchParams.get('name') || (manager.getActiveWorkspace() || {}).name;
          if (!wsName) { error(res, 404, 'no workspace specified'); return; }
          const cfg = manager.readConfig(wsName);
          if (!cfg) { error(res, 404, `workspace "${wsName}" not found`); return; }
          const dataDir = manager.dataDirFor(wsName);
          readWorkspaceDb(dataDir).then(data => {
            json(res, { workspace: wsName, stats: data.stats });
          }).catch(e => {
            error(res, 500, e.message);
          });

        // PUT /api/workspace/switch
        } else if (method === 'PUT' && pathname === '/api/workspace/switch') {
          body(req, (data) => {
            if (!data.name) { error(res, 400, 'name required'); return; }
            const result = manager.switchWorkspace(data.name);
            json(res, result);
          });
        
        // POST /api/workspaces
        } else if (method === 'POST' && parts[1] === 'workspaces' && parts.length === 2) {
          body(req, (data) => {
            if (!data.name) { error(res, 400, 'name required'); return; }
            const result = manager.createWorkspace(data.name);
            json(res, result, 201);
          });
        
        // DELETE /api/workspaces/:name
        } else if (method === 'DELETE' && parts[1] === 'workspaces' && parts.length === 3) {
          const name = parts[2];
          if (!name) { error(res, 400, 'name required'); return; }
          const result = manager.deleteWorkspace(name);
          json(res, result);
        
        } else {
          error(res, 404, 'not found');
        }
      } catch (e) {
        error(res, 500, e.message);
      }
    } else {
      // Статика
      serveStatic(res, pathname);
    }
  });

  server.listen(port, '127.0.0.1', () => {
    console.log(`[workspace-manager] Сайт: http://localhost:${port}`);
    console.log(`[workspace-manager] API:  http://localhost:${port}/api/workspaces`);
  });
}

// ============================================================
// Утилиты
// ============================================================

function json(res, data, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data, null, 2));
}

function error(res, status, message) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: message }));
}

function body(req, cb) {
  let data = '';
  req.on('data', chunk => data += chunk);
  req.on('end', () => {
    try { cb(JSON.parse(data)); }
    catch { cb({}); }
  });
}

module.exports = { startApi };
