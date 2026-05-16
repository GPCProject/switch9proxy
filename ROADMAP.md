# Roadmap — switch9proxy

[████████████░░░░░░░░░░░░░░░░░░] 55%

## Phase 1: Core ✅

| Этап | Статус |
|------|--------|
| Архитектура Workspace Manager | ✅ |
| Создание/удаление workspace | ✅ |
| Переключение workspace (restart 9router) | ✅ |
| Безопасное управление процессом (netstat + PID) | ✅ |
| Защита "main" workspace (оригинальные данные) | ✅ |

## Phase 2: Dashboard Enhancement ✅

| Этап | Статус |
|------|--------|
| db-reader.js (чтение SQLite) | ✅ |
| API endpoints /providers, /stats | ✅ |
| Cyberpunk UI redesign | ✅ |
| Провайдеры в дашборде | ✅ |
| Статистика токенов/запросов/стоимость | ✅ |
| Привязанные аккаунты (email) | ✅ |
| Анти-лавинный polling | ✅ |
| Обработка ошибок БД (try-catch) | ✅ |
| Архитектор: обновление роадмапа | ✅ |
| Тестировщик: 4 бага найдено и исправлено | ✅ |
| Логгер: фиксация изменений | ✅ |
| Бэкапер: backup_005.zip | ✅ |

## Phase 2.1: Bugfixes + Features ✅

| Этап | Статус | Priority |
|------|--------|----------|
| Фикс статусов workspace (running только у активного) | ✅ | HIGH |
| Error индикация провайдеров (401/429/402 подсветка) | ✅ | HIGH |
| ModelLock статусы (заблокированные модели) | ✅ | MEDIUM |
| Auto-OAuth при переключении (incognito окно для Kiro) | ✅ | LOW |
| Переключалка языков (RU/EN) | ✅ | LOW |

## Phase 3: GitHub/OpenSource ✅

| Этап | Статус |
|------|--------|
| .gitignore | ✅ |
| LICENSE (MIT) | ✅ |
| README (RU + EN) | ✅ |
| CONTRIBUTING.md | ✅ |
| Push на GitHub | ✅ |
| Профиль GPCProject обновлён | ✅ |

## Phase 4: Proxy + Installer 📝 PLAN

| Этап | Статус | Priority |
|------|--------|----------|
| **🔴 Proxy per workspace** — свой прокси для каждого профиля | 📝 | HIGH |
| **🟢 install.bat** — скрипт установки | 📝 | LOW |

### Детали: Proxy per workspace

9router имеет API: `PATCH /api/settings` c полями:
- `outboundProxyEnabled` — вкл/выкл прокси
- `outboundProxyUrl` — URL прокси (http://proxy.example.com:8080)
- `outboundNoProxy` — исключения (localhost,127.0.0.1)

**Реализация:**
- Прокси-настройки в `config.json` каждого workspace
- В дашборде: тумблер + поле URL в карточке workspace
- Новые endpoint'ы: `GET /api/workspace/proxy`, `PUT /api/workspace/proxy`
- При Switch: если в workspace есть прокси → отправить `PATCH /api/settings`
- При изменении прокси в дашборде → отправить `PATCH /api/settings` сразу

## Phase 5: Future Features 📝 BACKLOG

| Этап | Статус | Priority |
|------|--------|----------|
| **Менеджер API ключей** — добавлять/удалять провайдеров из дашборда | 📝 BACKLOG | MEDIUM |
| **Provider key tester** — тест ключа прямо из дашборда | 📝 BACKLOG | MEDIUM |
| **Автозапуск Windows** — в трей при старте системы | 📝 BACKLOG | LOW |
| **WebSocket вместо polling** — push-уведомления, не 5с опрос | 📝 BACKLOG | LOW |
| **Экспорт статистики** — CSV/PDF выгрузка | 📝 BACKLOG | LOW |
| **История переключений** — лог когда и на что переключался | 📝 BACKLOG | LOW |
| **Тёмная/светлая тема** — переключатель | 📝 BACKLOG | LOW |
| **Multi-language** — больше языков (ES, DE, FR) | 📝 BACKLOG | LOW |
| **Docker support** — возможность запускать switch9proxy в контейнере | 📝 BACKLOG | LOW |

---

## Legend

| Mark | Meaning |
|------|---------|
| ✅ | Done |
| 📝 PLAN | Распланировано, готово к реализации |
| 📝 BACKLOG | Идея, не распланировано |
| ❌ | Not started |
| 🔴 | HIGH — срочно |
| 🟡 | MEDIUM — средне |
| 🟢 | LOW — можно позже |

## Progress

```
Phase 1: Core                      ████████████████████ 100% ✅
Phase 2: Dashboard Enhancement     ████████████████████ 100% ✅
Phase 2.1: Bugfixes + Features     ████████████████████ 100% ✅
Phase 3: GitHub/OpenSource         ████████████████████ 100% ✅
Phase 4: Proxy + Installer         ██░░░░░░░░░░░░░░░░░░   0% 📝
Phase 5: Future Features           ██░░░░░░░░░░░░░░░░░░   0% 📝
```

**Overall: 55%** (упал из-за добавления новых фаз)
