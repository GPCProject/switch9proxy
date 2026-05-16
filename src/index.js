/**
 * Workspace Manager — точка входа
 *
 * Управляет изолированными workspace для 9router.
 * Каждый workspace = свой DATA_DIR со своими провайдерами и ключами.
 * Переключение: остановить 9router → подменить DATA_DIR → запустить 9router.
 *
 * Пользователь всегда работает через localhost:20128.
 * Меняется только то, какие ключи и провайдеры видит 9router.
 */

const { ensureDirs } = require('./config');
const { createWorkspace, listWorkspaces } = require('./manager');
const { startApi } = require('./api');

function main() {
  // Создаем директории
  ensureDirs();

  // При первом запуске — создать workspace "main" (без активации, только папки)
  const list = listWorkspaces();
  if (list.length === 0) {
    console.log('[workspace-manager] Первый запуск: создаю workspace "main"...');
    createWorkspace('main');
    console.log('[workspace-manager] Workspace "main" создан.');
    console.log('[workspace-manager] Открой http://localhost:20129 и нажми "Switch" для запуска.');
  }

  // Запускаем API + дашборд (работает без Docker)
  startApi();
}

main();
