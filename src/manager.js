/**
 * Workspace Manager — управление workspace
 *
 * Каждый workspace = отдельный DATA_DIR с собственным SQLite.
 * "main" — особый: он НЕ использует DATA_DIR, запускает 9router как есть.
 * Переключение: остановить 9router → запустить с DATA_DIR (или без).
 */
const fs = require('fs');
const path = require('path');
const net = require('net');
const os = require('os');
const { execSync, spawn } = require('child_process');
const { getWorkspacesDir } = require('./config');

const ORIGINAL_DATA_DIR = path.join(process.env.APPDATA, '9router');

// Путь к 9router CLI
const N9ROUTER_CLI = path.join(process.env.APPDATA, 'npm', 'node_modules', '9router', 'cli.js');

// ============================================================
// Внутренние утилиты
// ============================================================

function wsDir(name) {
  return path.join(getWorkspacesDir(), name);
}

function configPath(name) {
  return path.join(wsDir(name), 'config.json');
}

function readConfig(name) {
  const p = configPath(name);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

function writeConfig(name, cfg) {
  fs.writeFileSync(configPath(name), JSON.stringify(cfg, null, 2));
}

function dataDirFor(name) {
  // "main" всегда использует оригинальный DATA_DIR пользователя
  if (name === 'main') return ORIGINAL_DATA_DIR;
  return path.join(wsDir(name), 'data');
}

// ============================================================
// Управление 9router процессом
// ============================================================

function getPidByPort(port) {
  try {
    const output = execSync(`netstat -ano | findstr :${port}`, {
      encoding: 'utf8', shell: true, timeout: 5000
    }).trim();
    const lines = output.split('\n').filter(l => l.includes('LISTENING'));
    if (lines.length > 0) {
      const parts = lines[0].trim().split(/\s+/);
      return parts[parts.length - 1];
    }
  } catch {}
  return null;
}

function killProcess(pid) {
  try {
    execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore', timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}

function isPortOpen(port) {
  try {
    const sock = net.createConnection(port, '127.0.0.1');
    sock.end();
    sock.destroy();
    return true;
  } catch {
    return false;
  }
}

function waitForPortClose(port, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (!isPortOpen(port)) return true;
    const waitUntil = Date.now() + 200;
    while (Date.now() < waitUntil) {}
  }
  return false;
}

function waitForPortOpen(port, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (isPortOpen(port)) return true;
    const waitUntil = Date.now() + 200;
    while (Date.now() < waitUntil) {}
  }
  return false;
}

/**
 * Остановить 9router, если запущен
 */
function stop9router() {
  const pid = getPidByPort(20128);
  if (!pid) return true;
  
  killProcess(pid);
  const ok = waitForPortClose(20128, 5000);
  return ok;
}

/**
 * Запустить 9router. Если name === 'main' — без DATA_DIR (оригинальные данные).
 */
function start9router(name) {
  if (!fs.existsSync(N9ROUTER_CLI)) {
    throw new Error(`9router не найден: ${N9ROUTER_CLI}. Установи: npm install -g 9router`);
  }

  const env = { ...process.env };

  // Для "main" не ставим DATA_DIR — 9router сам найдет %APPDATA%\9router
  // Для остальных — ставим DATA_DIR на папку workspace
  if (name !== 'main') {
    env.DATA_DIR = dataDirFor(name);
  }

  const child = spawn(process.execPath, [N9ROUTER_CLI, '--no-browser', '--tray'], {
    stdio: 'ignore',
    detached: true,
    windowsHide: true,
    env,
  });
  child.unref();

  return waitForPortOpen(20128, 30000);
}

// ============================================================
// Основные функции
// ============================================================

function listWorkspaces() {
  const dir = getWorkspacesDir();
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(name => fs.statSync(path.join(dir, name)).isDirectory())
    .map(name => {
      const cfg = readConfig(name) || {};
      return {
        name,
        // Если workspace не активен — показываем 'stopped', даже если в конфиге 'running'
        status: cfg.isActive ? (cfg.status || 'running') : 'stopped',
        isActive: cfg.isActive || false,
        createdAt: cfg.createdAt || null,
      };
    });
}

function createWorkspace(name) {
  if (!name || !/^[a-zA-Z0-9_-]+$/.test(name)) {
    throw new Error('Invalid workspace name. Use only a-z, A-Z, 0-9, -, _');
  }

  const dir = wsDir(name);
  if (fs.existsSync(dir)) {
    throw new Error(`Workspace "${name}" already exists`);
  }

  fs.mkdirSync(dir, { recursive: true });

  // Для "main" не создаем data/ — он использует оригинальный %APPDATA%\9router
  if (name !== 'main') {
    fs.mkdirSync(dataDirFor(name), { recursive: true });
    fs.mkdirSync(path.join(dataDirFor(name), 'db'), { recursive: true });
  }

  const cfg = {
    name,
    status: 'created',
    isActive: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  writeConfig(name, cfg);

  return cfg;
}

/**
 * Переключить workspace:
 * 1. Остановить 9router
 * 2. Запустить с DATA_DIR от workspace (или без, для "main")
 */
function switchWorkspace(name) {
  const cfg = readConfig(name);
  if (!cfg) throw new Error(`Workspace "${name}" not found`);

  // Деактивировать все + сбросить статус на stopped
  const all = listWorkspaces();
  all.forEach(w => {
    const c = readConfig(w.name);
    if (c) { c.isActive = false; c.status = 'stopped'; writeConfig(w.name, c); }
  });

  // Остановить 9router если запущен
  stop9router();

  // Запустить 9router
  const ok = start9router(name);

  cfg.isActive = true;
  cfg.status = ok ? 'running' : 'error';
  cfg.updatedAt = new Date().toISOString();
  writeConfig(name, cfg);

  return { message: `Switched to workspace "${name}"`, active: name };
}

function getActiveWorkspace() {
  const all = listWorkspaces();
  return all.find(w => w.isActive) || null;
}

function deleteWorkspace(name) {
  if (name === 'main') {
    throw new Error('Cannot delete default "main" workspace');
  }

  const cfg = readConfig(name);
  if (cfg && cfg.isActive) {
    throw new Error('Cannot delete active workspace. Switch to another first.');
  }

  const dir = wsDir(name);
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }

  return { message: `Workspace "${name}" deleted` };
}

module.exports = {
  listWorkspaces,
  createWorkspace,
  switchWorkspace,
  getActiveWorkspace,
  deleteWorkspace,
  readConfig,
  wsDir,
  dataDirFor,
  stop9router,
  start9router,
};
