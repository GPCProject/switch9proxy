/**
 * Чтение SQLite из workspace
 * Извлекает провайдеров, ключи, email из БД 9router
 */
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

/**
 * Прочитать SQLite из workspace
 * @param {string} dataDir — путь к data/ директории workspace
 * @returns {Promise<{providers: Array, stats: Object|null}>}
 */
async function readWorkspaceDb(dataDir) {
  const dbPath = path.join(dataDir, 'db', 'data.sqlite');
  if (!fs.existsSync(dbPath)) {
    return { providers: [], stats: null };
  }

  let SQL, db;
  try {
    SQL = await initSqlJs();
    const buf = fs.readFileSync(dbPath);
    db = new SQL.Database(buf);

    const providers = readProviders(db);
    const stats = readUsageStats(db);
    return { providers, stats };
  } catch (e) {
    // Если БД повреждена или нет таблиц — возвращаем пустой результат
    console.error(`[db-reader] Ошибка чтения ${dbPath}:`, e.message);
    return { providers: [], stats: null };
  } finally {
    if (db) try { db.close(); } catch {}
  }
}

/**
 * Чтение провайдеров из providerConnections
 */
function readProviders(db) {
  let result;
  try {
    result = db.exec(`
      SELECT id, provider, authType, name, email, priority, isActive, data
      FROM providerConnections
      ORDER BY provider, priority
    `);
  } catch {
    return [];
  }

  if (!result.length) return [];

  return result[0].values.map(row => {
    const [id, provider, authType, name, email, priority, isActive, dataJson] = row;
    let data = {};
    try { data = JSON.parse(dataJson || '{}'); } catch {}

    // Парсим credits из data для Kiro
    let credits = null;
    if (data.credits && typeof data.credits === 'object') {
      credits = data.credits;
    }

    // Email может быть в providerSpecificData (AWS OAuth)
    const psd = data.providerSpecificData || {};
    const resolvedEmail = email || data.email || psd.email || null;

    // Error индикация
    const errorCode = data.errorCode || null;
    const lastError = data.lastError || null;
    const lastErrorAt = data.lastErrorAt || null;
    const backoffLevel = data.backoffLevel != null ? data.backoffLevel : null;

    // ModelLock статусы — все ключи modelLock_*
    const modelLocks = [];
    for (const [key, val] of Object.entries(data)) {
      if (key.startsWith('modelLock_') && val) {
        modelLocks.push({
          model: key.replace('modelLock_', ''),
          lockedUntil: val,
        });
      }
    }

    return {
      id,
      provider,
      authType,
      name,
      email: resolvedEmail,
      priority,
      isActive: !!isActive,
      credits,
      errorCode,
      lastError,
      lastErrorAt,
      backoffLevel,
      modelLocks,
      data,
    };
  });
}

/**
 * Чтение статистики использования
 */
function readUsageStats(db) {
  try {
    // Общая статистика
    const totalResult = db.exec(`
      SELECT
        COUNT(*) as totalRequests,
        COALESCE(SUM(promptTokens), 0) as totalPrompt,
        COALESCE(SUM(completionTokens), 0) as totalCompletion,
        COALESCE(SUM(cost), 0) as totalCost
      FROM usageHistory
    `);

    // По провайдерам
    const byProviderResult = db.exec(`
      SELECT
        provider,
        COUNT(*) as requests,
        COALESCE(SUM(promptTokens), 0) as promptTokens,
        COALESCE(SUM(completionTokens), 0) as completionTokens,
        COALESCE(SUM(cost), 0) as cost
      FROM usageHistory
      WHERE provider IS NOT NULL
      GROUP BY provider
      ORDER BY requests DESC
    `);

    // За сегодня
    const todayResult = db.exec(`
      SELECT
        COUNT(*) as requests,
        COALESCE(SUM(promptTokens), 0) as promptTokens,
        COALESCE(SUM(completionTokens), 0) as completionTokens,
        COALESCE(SUM(cost), 0) as cost
      FROM usageHistory
      WHERE date(timestamp) = date('now')
    `);

    // За неделю
    const weekResult = db.exec(`
      SELECT
        COUNT(*) as requests,
        COALESCE(SUM(promptTokens), 0) as promptTokens,
        COALESCE(SUM(completionTokens), 0) as completionTokens,
        COALESCE(SUM(cost), 0) as cost
      FROM usageHistory
      WHERE timestamp >= datetime('now', '-7 days')
    `);

    const total = totalResult.length ? totalResult[0].values[0] : [0, 0, 0, 0];
    const today = todayResult.length ? todayResult[0].values[0] : [0, 0, 0, 0];
    const week = weekResult.length ? weekResult[0].values[0] : [0, 0, 0, 0];

    const byProvider = byProviderResult.length
      ? byProviderResult[0].values.map(row => ({
          provider: row[0],
          requests: row[1],
          promptTokens: row[2],
          completionTokens: row[3],
          cost: row[4],
        }))
      : [];

    return {
      totalRequests: total[0],
      totalTokens: Number(total[1]) + Number(total[2]),
      totalCost: total[3],
      today: {
        requests: today[0],
        tokens: Number(today[1]) + Number(today[2]),
      },
      week: {
        requests: week[0],
        tokens: Number(week[1]) + Number(week[2]),
      },
      byProvider,
    };
  } catch (e) {
    console.error('[db-reader] Ошибка чтения статистики:', e.message);
    return null;
  }
}

module.exports = { readWorkspaceDb, readProviders, readUsageStats };
