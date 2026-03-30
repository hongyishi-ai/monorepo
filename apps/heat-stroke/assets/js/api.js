/**
 * HS API 模块
 * 负责 OpenWeatherMap API 的 URL 构建和请求
 */

// API 配置
const FALLBACK_API_KEY = '4d8fb5b93d4af21d66a2948710284366'; // OpenWeatherMap免费API密钥（前端演示用）
const REQUEST_TIMEOUT = 12000; // 网络请求超时阈值(ms)

// 运行时解析 API Key
function resolveApiKey() {
    const runtimeKey = window.HS_API_KEY || window.__HS_API_KEY;
    const metaKey = document.querySelector('meta[name="hs-api-key"]')?.getAttribute('content');
    const storedKey = localStorage.getItem('hs_api_key');
    if (!runtimeKey && !metaKey && !storedKey) {
        console.warn('使用内置演示 API Key，建议通过 window.HS_API_KEY 或 meta[name="hs-api-key"] 注入自己的密钥');
    }
    return runtimeKey || metaKey || storedKey || FALLBACK_API_KEY;
}

// 运行时解析 API Base URL
function resolveApiBase() {
    const runtimeBase = window.HS_API_BASE || window.__HS_API_BASE;
    const metaBase = document.querySelector('meta[name="hs-api-base"]')?.getAttribute('content');
    return runtimeBase || metaBase || 'https://api.openweathermap.org';
}

const API_KEY = resolveApiKey();
const API_BASE = resolveApiBase();

/**
 * 构建 API URL
 * @param {string} path - API 路径，如 /geo/1.0/direct
 * @param {object} params - 查询参数
 * @returns {string} 完整的 URL
 */
function buildApiUrl(path, params = {}) {
    const isProxy = !API_BASE.includes('openweathermap.org');
    if (isProxy) {
        const url = new URL(API_BASE, window.location.origin);
        url.searchParams.set('path', path);
        Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
        return url.toString();
    }
    const url = new URL(path, 'https://api.openweathermap.org');
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
    url.searchParams.set('appid', API_KEY);
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
