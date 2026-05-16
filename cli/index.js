#!/usr/bin/env node
/**
 * CLI для Workspace Manager
 */
const { program } = require('commander');
const manager = require('../src/manager');
const { startApi } = require('../src/api');

program
  .name('workspace-manager')
  .description('Управление workspace для 9router. Переключение между профилями.');

program
  .command('list')
  .description('Список workspace')
  .action(() => {
    try {
      const list = manager.listWorkspaces();
      const active = manager.getActiveWorkspace();
      console.log('\n  📦 Workspaces:\n');
      list.forEach(w => {
        const mark = w.isActive ? '👉' : '  ';
        console.log(`  ${mark} ${w.name} (${w.status})${w.isActive ? ' ACTIVE' : ''}`);
      });
      console.log();
    } catch (e) {
      console.error(`\n  ❌ Error: ${e.message}\n`);
    }
  });

program
  .command('create <name>')
  .description('Создать новый workspace')
  .action((name) => {
    try {
      const result = manager.createWorkspace(name);
      console.log(`\n  ✅ Workspace "${name}" created`);
      console.log(`  📁 ${manager.wsDir(name)}`);
      console.log(`  🌐 Открой http://localhost:20128 и настрой провайдеров\n`);
    } catch (e) {
      console.error(`\n  ❌ Error: ${e.message}\n`);
    }
  });

program
  .command('switch <name>')
  .description('Переключиться на другой workspace')
  .action((name) => {
    try {
      const result = manager.switchWorkspace(name);
      console.log(`\n  🔄 ${result.message}`);
      console.log(`  🌐 http://localhost:20128 (тот же порт, другой DATA_DIR)\n`);
    } catch (e) {
      console.error(`\n  ❌ Error: ${e.message}\n`);
    }
  });

program
  .command('delete <name>')
  .description('Удалить workspace (кроме main)')
  .action((name) => {
    try {
      const result = manager.deleteWorkspace(name);
      console.log(`\n  🗑️ ${result.message}\n`);
    } catch (e) {
      console.error(`\n  ❌ Error: ${e.message}\n`);
    }
  });

program
  .command('daemon')
  .description('Запустить API сервер для управления')
  .action(() => {
    console.log('\n  🚀 Starting Workspace Manager API...\n');
    startApi();
  });

program.parse(process.argv);

// Если нет команд — показать help
if (!process.argv.slice(2).length) {
  program.help();
}
