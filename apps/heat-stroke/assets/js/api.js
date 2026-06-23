/**
 * HS API 模块
 * 负责 OpenWeatherMap API 的 URL 构建和请求
 */

// API 配置
const REQUEST_TIMEOUT = 12000; // 网络请求超时阈值(ms)

// 运行时解析 API Base URL
function resolveApiBase() {
    const runtimeBase = window.HS_API_BASE || window.__HS_API_BASE;
    const metaBase = document.querySelector('meta[name="hs-api-base"]')?.getAttribute('content');
    const configuredBase = runtimeBase || metaBase || '/api/openweather';
    if (configuredBase.includes('openweathermap.org')) {
        console.warn('生产天气请求必须通过 /api/openweather 代理，已忽略直连 API_BASE。');
        return '/api/openweather';
    }
    return configuredBase;
}

const API_KEY = '';
const API_BASE = resolveApiBase();

/**
 * 构建 API URL
 * @param {string} path - API 路径，如 /geo/1.0/direct
 * @param {object} params - 查询参数
 * @returns {string} 完整的 URL
 */
function buildApiUrl(path, params = {}) {
    const url = new URL(API_BASE, window.location.origin);
    url.searchParams.set('path', path);
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
    return url.toString();
}

/**
 * 带超时的 JSON 请求
 * @param {string} url - 请求 URL
 * @param {string} contextLabel - 上下文标签，用于错误信息
 * @returns {Promise<object>} JSON 响应
 */
async function fetchJson(url, contextLabel) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) {
            throw new Error(`${contextLabel}失败 (${response.status})`);
        }
        return await response.json();
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error(`${contextLabel}超时`);
        }
        throw error;
    } finally {
        clearTimeout(timeoutId);
    }
}

// 导出给其他模块使用
export { API_KEY, API_BASE, buildApiUrl, fetchJson };
