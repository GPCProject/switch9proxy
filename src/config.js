/**
 * Config — управление конфигурацией Workspace Manager
 */
const path = require('path');
const fs = require('fs');
const os = require('os');

const APP_DIR = path.join(os.homedir(), '.workspace-manager');
const WORKSPACES_DIR = path.join(APP_DIR, 'workspaces');
const GATEWAY_PORT = 20129;

function ensureDirs() {
  [APP_DIR, WORKSPACES_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

function getWorkspacesDir() { return WORKSPACES_DIR; }
function getGatewayPort() { return GATEWAY_PORT; }

module.exports = { ensureDirs, getWorkspacesDir, getGatewayPort, APP_DIR };
