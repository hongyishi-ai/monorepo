/**
 * HS 缓存模块
 * 负责 localStorage 缓存管理
 */

const CACHE_TTL_MS = 10 * 60 * 1000; // 缓存10分钟
const CACHE_PREFIX = 'hs-weather-cache:';

/**
 * 构建缓存键
 * @param {string} namespace - 命名空间，如 'current', 'forecast'
 * @param {string} key - 缓存键
 * @returns {string} 完整的缓存键
 */
function buildCacheKey(namespace, key) {
    return `${CACHE_PREFIX}${namespace}:${key}`;
}

/**
 * 读取缓存
 * @param {string} cacheKey - 缓存键
 * @returns {object|null} 缓存数据或 null
 */
function readCache(cacheKey) {
    try {
        const raw = localStorage.getItem(cacheKey);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || !parsed.timestamp || !parsed.data) return null;
        return parsed;
    } catch (error) {
        console.warn('读取缓存失败', error);
        return null;
    }
}

/**
 * 写入缓存
 * @param {string} cacheKey - 缓存键
 * @param {object} data - 要缓存的数据
 */
function writeCache(cacheKey, data) {
    try {
        localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data }));
    } catch (error) {
        console.warn('写入缓存失败', error);
    }
}

/**
 * 带缓存的 JSON 请求
 * @param {string} url - 请求 URL
 * @param {string} cacheKey - 缓存键
 * @param {string} contextLabel - 上下文标签
 * @param {function} fetchFn - 获取数据的函数 (url, contextLabel) => Promise
 * @returns {Promise<object>} JSON 数据
 */
async function fetchJsonWithCache(url, cacheKey, contextLabel, fetchFn) {
    const cached = readCache(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return cached.data;
    }
    try {
        const data = await fetchFn(url, contextLabel);
        writeCache(cacheKey, data);
        return data;
    } catch (error) {
        if (cached) {
            console.warn(`${contextLabel}失败，使用缓存数据`, error);
            return cached.data;
        }
        throw error;
    }
}

// 导出给其他模块使用
export { CACHE_TTL_MS, CACHE_PREFIX, buildCacheKey, readCache, writeCache, fetchJsonWithCache };
