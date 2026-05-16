# switch9proxy

**Переключатель профилей для 9router.**  
Позволяет иметь несколько независимых рабочих пространств (workspace) для AI-роутера.  
Каждый workspace — свои API-ключи, свои провайдеры, свои OAuth-токены.

Зачем это нужно:
- Есть **Kiro** с 50 кредитами. Кредиты кончились — переключился на другой workspace с другим Builder ID
- Есть **OpenCode** — он смотрит на IP. Переключил workspace — он думает что ты новый пользователь
- Есть **OpenRouter** с разными ключами. Разные workspace = разные ключи

Ничего не трогает в оригинальном 9router. Просто рестартует его с другой папкой `DATA_DIR`.

---

## Как работает

9router хранит все данные в SQLite: провайдеры, ключи, статистику.  
Путь к этой БД задаётся через переменную окружения `DATA_DIR`.

switch9proxy делает просто:
1. **Останавливает** 9router (kill процесса на порту 20128)
2. **Меняет** `DATA_DIR` на нужный workspace
3. **Запускает** 9router снова

Workspace `main` использует оригинальную папку `%APPDATA%\9router` — твои родные данные.  
Остальные workspace создаются в `~/.workspace-manager/workspaces/` с чистой БД.

В дашборде можно:
- Создать workspace — `create work`
- Посмотреть что внутри без переключения — клик по карточке
- Переключиться — кнопка `Switch`
- Удалить — кнопка `Del` (кроме main)

---

## Стек

| Компонент | Технология |
|-----------|-----------|
| backend | Node.js, plain `http` module |
| database | SQLite via `sql.js` |
| frontend | vanilla JS, одно `index.html` |
| CLI | Commander.js |
| dashboard style | cyberpunk, JetBrains Mono, CSS variables |

Никаких Express, React, Docker, TypeScript.  
Минимум зависимостей. Просто работает.

---

## Установка

```bash
# 9router должен быть установлен глобально
npm install -g 9router

# Клонируем switch9proxy
git clone https://github.com/GPCProject/switch9proxy.git
cd switch9proxy
npm install

# Запуск
npm start
```

Открой в браузере: **http://localhost:20129**

---

## Использование

```
npm start                # Запустить дашборд
node cli/index.js list   # Список workspace
node cli/index.js create work  # Создать
node cli/index.js switch work  # Переключить
```

---

## API

```
GET  /api/workspaces                      — список workspace
GET  /api/workspace/providers?name=X      — провайдеры workspace X
GET  /api/workspace/stats?name=X          — статистика workspace X
PUT  /api/workspace/switch                — переключить {name:"stealth"}
POST /api/workspaces                      — создать {name:"stealth"}
DELETE /api/workspaces/:name              — удалить
```

---

## Структура проекта

```
switch9proxy/
├── src/
│   ├── index.js       # точка входа
│   ├── config.js      # пути, порты
│   ├── manager.js     # управление workspace (stop/start 9router)
│   ├── api.js         # REST API
│   └── db-reader.js   # чтение SQLite (провайдеры, статистика)
├── cli/index.js       # CLI команды
├── web/index.html     # дашборд (все в одном файле)
├── package.json
├── LICENSE            # MIT
├── README.md          # этот файл
├── CONTRIBUTING.md    # как помогать проекту
└── .gitignore
```

---

## Это первая версия

**v0.1.0 — beta.**  
Возможны баги, особенно при переключении workspace и чтении БД.  
Если что-то пошло не так — открывай Issue на GitHub.

Известные проблемы:
- После переключения нужно подождать ~5-10 секунд — 9router перезапускается и инициализирует БД
- Статистика показывает данные только если есть таблица `usageHistory` (пустые workspace — пустая статистика)
- ModelLock сбрасываются при перезагрузке страницы (не сохраняются между сессиями)

---

## Как помочь проекту

Pull Request'ы приветствуются.  
Форкаешь → делаешь изменения → открываешь PR.  
Лицензия MIT — можно коммерческое использование.

Подробнее: [`CONTRIBUTING.md`](CONTRIBUTING.md)

---

## Roadmap

Полный план разработки: [`ROADMAP.md`](ROADMAP.md)

| Phase | Что | Статус |
|-------|-----|--------|
| 1 | Core — workspace, switch, безопасность | ✅ |
| 2 | Dashboard — провайдеры, статистика, cyberpunk | ✅ |
| 2.1 | Bugfixes — статусы, ModelLock, RU/EN | ✅ |
| 3 | GitHub — OpenSource, README, LICENSE | ✅ |
| **4** | **Proxy per workspace** — свой прокси для каждого профиля | 📝 план |
| 5 | Future — ключи, автозапуск, WebSocket | 📝 backlog |

**Следующее: Proxy per workspace** — 9router умеет работать через прокси через `PATCH /api/settings`. Добавим в дашборд тумблер On/Off и поле URL для каждого workspace.

---

**MIT © [GPCProject](https://github.com/GPCProject)**

---

# switch9proxy — English

**Profile switcher for 9router.**  
Multiple isolated workspaces for AI router. Each workspace has its own API keys, providers, OAuth tokens.

Why:
- **Kiro** has 50 credits. Credits ran out — switch to another workspace with different Builder ID
- **OpenCode** checks IP. Switch workspace — it thinks you're a new user
- **OpenRouter** with different keys. Different workspaces = different keys

Doesn't touch original 9router. Just restarts it with another `DATA_DIR`.

## How it works

9router stores all data in SQLite. Path to DB is set via `DATA_DIR` env.  

switch9proxy:
1. **Stops** 9router (kill process on port 20128)
2. **Changes** `DATA_DIR` to target workspace
3. **Starts** 9router again

Workspace `main` uses original `%APPDATA%\9router` folder.  
Other workspaces created in `~/.workspace-manager/workspaces/` with clean DB.

## Tech Stack

| Component | Technology |
|-----------|-----------|
| backend | Node.js, plain `http` module |
| database | SQLite via `sql.js` |
| frontend | vanilla JS, single `index.html` |
| CLI | Commander.js |
| dashboard | cyberpunk, JetBrains Mono, CSS variables |

No Express, React, Docker, TypeScript.

## Install

```bash
npm install -g 9router
git clone https://github.com/GPCProject/switch9proxy.git
cd switch9proxy
npm install
npm start
```

Open: **http://localhost:20129**

## API

```
GET  /api/workspaces                      — list workspaces
GET  /api/workspace/providers?name=X      — providers for workspace X
GET  /api/workspace/stats?name=X          — stats for workspace X
PUT  /api/workspace/switch                — switch {name:"stealth"}
POST /api/workspaces                      — create {name:"stealth"}
DELETE /api/workspaces/:name              — delete
```

## v0.1.0 — beta

Bugs possible. Open an Issue on GitHub if something breaks.

## Roadmap

Full plan: [`ROADMAP.md`](ROADMAP.md)

| Phase | What | Status |
|-------|------|--------|
| 1 | Core — workspace, switch, security | ✅ |
| 2 | Dashboard — providers, stats, cyberpunk | ✅ |
| 2.1 | Bugfixes — statuses, ModelLock, RU/EN | ✅ |
| 3 | GitHub — OpenSource, README, LICENSE | ✅ |
| **4** | **Proxy per workspace** — separate proxy for each profile | 📝 plan |
| 5 | Future — keys, autostart, WebSocket | 📝 backlog |

**Next: Proxy per workspace** — 9router supports proxy via `PATCH /api/settings`. Add toggle + URL field for each workspace.

## Contributing

Pull Requests welcome. Fork → changes → PR.
MIT license.

**MIT © [GPCProject](https://github.com/GPCProject)**
