/**
 * 红医师热射病防治 - 主脚本
 *
 * 代码组织结构:
 * 1. 常量与配置 (API_KEY, API_BASE, CACHE_*)
 * 2. API 模块 (buildApiUrl, fetchJson)
 * 3. 缓存模块 (buildCacheKey, readCache, writeCache, fetchJsonWithCache)
 * 4. UI 初始化与事件绑定
 * 5. 热射病预防检查清单
 * 6. 滚动动画
 * 7. 地理位置与天气数据
 * 8. 图表与热指数计算
 * 9. 健康提示与警告
 *
 * 模块化说明:
 * - api.js: API 配置和请求
 * - cache.js: 缓存管理
 * - charts.js: 图表绘制 (如有独立版本)
 */

// ========== 1. 常量与配置 ==========
const FALLBACK_API_KEY = '4d8fb5b93d4af21d66a2948710284366'; // OpenWeatherMap免费API密钥（前端演示用）
const API_KEY = (function() {
    const runtimeKey = window.HS_API_KEY || window.__HS_API_KEY;
    const metaKey = document.querySelector('meta[name="hs-api-key"]')?.getAttribute('content');
    const storedKey = localStorage.getItem('hs_api_key');
    if (!runtimeKey && !metaKey && !storedKey) {
        console.warn('使用内置演示 API Key，建议通过 window.HS_API_KEY 或 meta[name="hs-api-key"] 注入自己的密钥');
    }
    return runtimeKey || metaKey || storedKey || FALLBACK_API_KEY;
})();
const API_BASE = (function() {
    const runtimeBase = window.HS_API_BASE || window.__HS_API_BASE;
    const metaBase = document.querySelector('meta[name="hs-api-base"]')?.getAttribute('content');
    return runtimeBase || metaBase || 'https://api.openweathermap.org';
})();
const REQUEST_TIMEOUT = 12000; // 网络请求超时阈值(ms)
const CACHE_TTL_MS = 10 * 60 * 1000; // 缓存10分钟
const CACHE_PREFIX = 'hs-weather-cache:';
const FALLBACK_CITY = '北京'; // 定位失败时的兜底城市
let chart; // 图表对象

// ========== 2. API 模块 ==========
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

// 初始化返回顶部按钮
function initBackToTop() {
    const backToTopBtn = document.getElementById('backToTopBtn');
    if (!backToTopBtn) return;
    
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            backToTopBtn.classList.remove('opacity-0', 'translate-y-10');
            backToTopBtn.classList.add('opacity-100', 'translate-y-0');
        } else {
            backToTopBtn.classList.remove('opacity-100', 'translate-y-0');
            backToTopBtn.classList.add('opacity-0', 'translate-y-10');
        }
    });
    
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

function showErrorState(message) {
    const loadingEl = document.getElementById('loading');
    const weatherInfoEl = document.getElementById('weather-info');
    const alertEl = document.getElementById('heat-index-alert');
    if (loadingEl) {
        loadingEl.textContent = message;
        loadingEl.classList.remove('hidden');
    }
    if (weatherInfoEl) {
        weatherInfoEl.classList.add('hidden');
    }
    if (alertEl) {
        alertEl.classList.add('hidden');
    }
}

function setLocationLabel(text) {
    const locationEl = document.getElementById('location-display');
    if (locationEl) {
        locationEl.textContent = text;
    }
}

function resolveApiKey() {
    const runtimeKey = window.HS_API_KEY || window.__HS_API_KEY;
    const metaKey = document.querySelector('meta[name="hs-api-key"]')?.getAttribute('content');
    const storedKey = localStorage.getItem('hs_api_key');
    if (!runtimeKey && !metaKey && !storedKey) {
        console.warn('使用内置演示 API Key，建议通过 window.HS_API_KEY 或 meta[name=\"hs-api-key\"] 注入自己的密钥');
    }
    return runtimeKey || metaKey || storedKey || FALLBACK_API_KEY;
}

function resolveApiBase() {
    const runtimeBase = window.HS_API_BASE || window.__HS_API_BASE;
    const metaBase = document.querySelector('meta[name=\"hs-api-base\"]')?.getAttribute('content');
    return runtimeBase || metaBase || 'https://api.openweathermap.org';
}

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

function buildCacheKey(namespace, key) {
    return `${CACHE_PREFIX}${namespace}:${key}`;
}

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

function writeCache(cacheKey, data) {
    try {
        localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data }));
    } catch (error) {
        console.warn('写入缓存失败', error);
    }
}

async function fetchJsonWithCache(url, cacheKey, contextLabel) {
    const cached = readCache(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return cached.data;
    }
    try {
        const data = await fetchJson(url, contextLabel);
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

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', () => {
    // 检查Framer Motion和Chart.js是否可用
    if (!window.Chart) {
        console.error('Chart.js未加载，图表将无法显示');
        const chartContainer = document.querySelector('.chart-container');
        if (chartContainer) {
            chartContainer.innerHTML = '<div class="text-center text-red-500">图表库加载失败，请刷新页面重试</div>';
        }
    }
    
    // 注册Chart.js的annotation插件
    if (window.Chart) {
        const annotationPlugin = window.ChartAnnotation || window['chartjs-plugin-annotation'];
        if (annotationPlugin) {
            Chart.register(annotationPlugin);
        } else {
            console.error('Chart.js的annotation插件未加载，热指数等级区域将无法显示');
        }
    }
    
    // 获取用户位置
    getUserLocation();
    
    // 刷新按钮点击事件
    document.getElementById('refresh-btn').addEventListener('click', getUserLocation);
    
    // 搜索按钮点击事件
    document.getElementById('search-btn').addEventListener('click', searchLocation);
    
    // 输入框回车事件
    document.getElementById('location-input').addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            searchLocation();
        }
    });
    
    // 手动计算热指数按钮点击事件
    document.getElementById('calculate-hi-btn').addEventListener('click', calculateManualHeatIndex);
    
    // 手动输入温度和湿度的回车事件
    document.getElementById('manual-temp').addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            document.getElementById('manual-humidity').focus();
        }
    });
    
    document.getElementById('manual-humidity').addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            calculateManualHeatIndex();
        }
    });
    
    // 初始化热射病预防检查清单
    initPreventionChecklist();
    
    // 初始化滚动动画
    initScrollAnimations();
    
    // 返回顶部
    initBackToTop();
});

// 初始化热射病预防检查清单
function initPreventionChecklist() {
    // 获取所有复选框
    const checkboxes = document.querySelectorAll('.checklist-checkbox');
    const resetButton = document.getElementById('reset-checklist');
    const countDisplay = document.getElementById('checklist-count');
    const summaryBox = document.getElementById('checklist-summary');
    const preventionList = document.getElementById('prevention-checklist');
    
    // 从本地存储加载保存的状态
    loadChecklistState();
    
    // 为每个复选框添加事件监听器
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const listItem = this.closest('.checklist-item');
            
            // 切换完成状态样式
            if (this.checked) {
                listItem.classList.add('completed');
            } else {
                listItem.classList.remove('completed');
            }
            
            // 更新计数和保存状态
            updateChecklistCount();
            saveChecklistState();
            
            // 检查是否所有项目都被选中，如果是则折叠清单
            const checked = document.querySelectorAll('.checklist-checkbox:checked').length;
            const total = checkboxes.length;
            
            if (checked === total) {
                // 折叠清单的动画
                const motionAPI = window.motion || window.framerMotion;
                if (motionAPI) {
                    motionAPI.animate(preventionList, 
                        { height: [preventionList.scrollHeight + 'px', '0px'] }, 
                        { duration: 0.5, easing: 'ease-in-out' }
                    ).finished.then(() => {
                        preventionList.style.display = 'none';
                    });
                } else {
                    // 如果没有动画API，直接隐藏
                    preventionList.style.display = 'none';
                }
            } else if (preventionList.style.display === 'none') {
                // 如果清单被隐藏但不是所有项都被选中，则展开
                preventionList.style.display = '';
                const motionAPI = window.motion || window.framerMotion;
                if (motionAPI) {
                    motionAPI.animate(preventionList, 
                        { height: ['0px', preventionList.scrollHeight + 'px'] }, 
                        { duration: 0.5, easing: 'ease-in-out' }
                    );
                }
            }
        });
    });
    
    // 重置按钮事件
    resetButton.addEventListener('click', function() {
        // 如果清单被隐藏，先显示它
        if (preventionList.style.display === 'none') {
            preventionList.style.display = '';
            // 使用动画展开
            const motionAPI = window.motion || window.framerMotion;
            if (motionAPI) {
                motionAPI.animate(preventionList, 
                    { height: ['0px', 'auto'] }, 
                    { duration: 0.5, easing: 'ease-in-out' }
                );
            }
        }
        
        // 强制清除本地存储的状态
        localStorage.removeItem('preventionChecklist');
        
        // 遍历所有复选框并取消选中
        for (let i = 0; i < checkboxes.length; i++) {
            checkboxes[i].checked = false;
            checkboxes[i].closest('.checklist-item').classList.remove('completed');
        }
        
        // 更新计数和保存状态
        updateChecklistCount();
        
        // 隐藏总结框
        summaryBox.classList.add('hidden');
        
        // 添加动画效果
        const motionAPI = window.motion || window.framerMotion;
        if (motionAPI) {
            checkboxes.forEach((checkbox, index) => {
                const listItem = checkbox.closest('.checklist-item');
                motionAPI.animate(listItem, 
                    { x: [-5, 0], opacity: [0.5, 1] }, 
                    { duration: 0.3, delay: index * 0.05 }
                );
            });
        }
    });
    
    // 初始化计数
    updateChecklistCount();
    
    // 检查初始状态是否所有项目都被选中，如果是则折叠清单
    const checked = document.querySelectorAll('.checklist-checkbox:checked').length;
    const total = checkboxes.length;
    
    if (checked === total) {
        preventionList.style.display = 'none';
    }
}

// 更新检查清单完成数量
function updateChecklistCount() {
    const total = document.querySelectorAll('.checklist-checkbox').length;
    const checked = document.querySelectorAll('.checklist-checkbox:checked').length;
    const countDisplay = document.getElementById('checklist-count');
    const summaryBox = document.getElementById('checklist-summary');
    const preventionList = document.getElementById('prevention-checklist');
    
    // 更新计数显示
    countDisplay.textContent = `${checked}/${total}`;
    
    // 添加计数变化的动画效果
    const motionAPI = window.motion || window.framerMotion;
    if (motionAPI) {
        motionAPI.animate(countDisplay, 
            { scale: [1.2, 1] }, 
            { duration: 0.3 }
        );
    }
    
    // 根据检查状态显示或隐藏总结信息
    if (checked === total) {
        summaryBox.classList.remove('hidden');
        summaryBox.querySelector('h4').textContent = '预防措施已全部到位';
        summaryBox.querySelector('p').textContent = '您已完成所有热射病预防检查项目，降低了热射病发生风险。';
        summaryBox.querySelector('i').classList.remove('fa-exclamation-triangle');
        summaryBox.querySelector('i').classList.add('fa-check-circle');
        summaryBox.classList.remove('border-brand-orange');
        summaryBox.classList.add('border-green-500');
        summaryBox.querySelector('i').classList.remove('text-brand-orange');
        summaryBox.querySelector('i').classList.add('text-green-500');
    } else if (checked > 0) {
        summaryBox.classList.remove('hidden');
        summaryBox.querySelector('h4').textContent = '预防措施未全部到位';
        summaryBox.querySelector('p').textContent = '请确保所有预防措施到位，以降低发生热射病的风险。';
        summaryBox.querySelector('i').classList.add('fa-exclamation-triangle');
        summaryBox.querySelector('i').classList.remove('fa-check-circle');
        summaryBox.classList.add('border-brand-orange');
        summaryBox.classList.remove('border-green-500');
        summaryBox.querySelector('i').classList.add('text-brand-orange');
        summaryBox.querySelector('i').classList.remove('text-green-500');
    } else {
        summaryBox.classList.add('hidden');
    }
    
    // 为总结框添加显示动画
    if (!summaryBox.classList.contains('hidden') && motionAPI) {
        motionAPI.animate(summaryBox, 
            { y: [10, 0], opacity: [0, 1] }, 
            { duration: 0.4 }
        );
    }
}

// 保存检查清单状态到本地存储
function saveChecklistState() {
    const checkboxes = document.querySelectorAll('.checklist-checkbox');
    const state = {};
    
    checkboxes.forEach(checkbox => {
        state[checkbox.id] = checkbox.checked;
    });
    
    localStorage.setItem('preventionChecklist', JSON.stringify(state));
}

// 从本地存储加载检查清单状态
function loadChecklistState() {
    const savedState = localStorage.getItem('preventionChecklist');
    if (!savedState) return;
    
    try {
        const state = JSON.parse(savedState);
        const checkboxes = document.querySelectorAll('.checklist-checkbox');
        
        checkboxes.forEach(checkbox => {
            if (state[checkbox.id]) {
                checkbox.checked = true;
                checkbox.closest('.checklist-item').classList.add('completed');
            }
        });
        
        // 更新计数
        updateChecklistCount();
    } catch (e) {
        console.error('加载检查清单状态失败:', e);
    }
}

// 初始化滚动动画
function initScrollAnimations() {
    // 获取所有需要动画的元素
    const animatedItems = document.querySelectorAll('.animated-item');
    
    // 确保所有元素初始状态是不可见的，但不影响布局
    animatedItems.forEach(item => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(30px)';
    });
    
    // 如果支持Intersection Observer API
    if ('IntersectionObserver' in window) {
        // 创建观察者实例
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                // 当元素进入视口
                if (entry.isIntersecting) {
                    // 添加可见类名触发动画
                    entry.target.classList.add('visible');
                    // 元素显示后不再观察
                    observer.unobserve(entry.target);
                    
                    // 触发自定义事件，用于Framer Motion动画
                    const visibleEvent = new CustomEvent('visible');
                    entry.target.dispatchEvent(visibleEvent);
                    
                    // 如果Framer Motion不可用，使用CSS渐变
                    if (!window.motion && !window.framerMotion) {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }
                }
            });
        }, {
            // 配置选项
            threshold: 0.1, // 元素10%进入视口时触发
            rootMargin: '0px 0px -50px 0px' // 视口底部向上偏移50px
        });
        
        // 开始观察每个元素
        animatedItems.forEach(item => {
            observer.observe(item);
        });
    } else {
        // 如果浏览器不支持Intersection Observer，则直接显示所有元素
        animatedItems.forEach(item => {
            item.classList.add('visible');
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
            // 触发自定义事件
            const visibleEvent = new CustomEvent('visible');
            item.dispatchEvent(visibleEvent);
        });
    }
    
    // 使用Framer Motion添加更高级的动画效果
    // 检查Framer Motion是否可用（CDN引入后可能是window.motion或window.framerMotion对象）
    const motionAPI = window.motion || window.framerMotion;
    
    if (motionAPI) {
        // 为标题添加渐入和上移动画
        const header = document.querySelector('header');
        if (header) {
            motionAPI.animate(header, {
                opacity: [0, 1],
                y: [50, 0]
            }, {
                duration: 1,
                easing: 'ease-out'
            });
        }
        
        // 为Bento Grid中的每个元素添加交错动画
        const bentoItems = document.querySelectorAll('.animated-item');
        bentoItems.forEach((item, index) => {
            // 当元素进入视口时添加动画
            item.addEventListener('visible', () => {
                motionAPI.animate(item, {
                    opacity: [0, 1],
                    y: [30, 0],
                    scale: [0.95, 1]
                }, {
                    duration: 0.8,
                    delay: index * 0.1,
                    easing: [0.25, 0.1, 0.25, 1] // 自定义缓动函数，类似于cubic-bezier
                });
            });
        });
        
        // 为图表添加特殊动画
        const chartContainer = document.querySelector('.chart-container');
        if (chartContainer) {
            chartContainer.addEventListener('visible', () => {
                motionAPI.animate(chartContainer, {
                    opacity: [0, 1],
                    scale: [0.9, 1]
                }, {
                    duration: 1.2,
                    easing: 'ease-out'
                });
            });
        }
    } else {
        // 如果Framer Motion不可用，确保元素仍然可见
        console.log('Framer Motion不可用，使用CSS过渡动画');
        
        // 显示所有元素
        animatedItems.forEach(item => {
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
        });
    }
}

// 获取用户地理位置
function getUserLocation() {
    // 显示加载状态
    showLoadingState('正在获取位置...');
    
    // 检查浏览器是否支持地理位置API
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            // 成功获取位置
            (position) => {
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;
                
                // 获取位置名称
                getLocationName(latitude, longitude);
                
                // 获取天气数据
                getWeatherData(latitude, longitude);
            },
            // 获取位置失败
            (error) => {
                handleLocationError(error);
            },
            // 选项
            { timeout: 10000 }
        );
    } else {
        // 浏览器不支持地理位置API
        setLocationLabel('您的浏览器不支持地理位置功能');
        showErrorState(`无法获取位置信息，正在尝试默认城市 ${FALLBACK_CITY}`);
        fetchWeatherByCity(FALLBACK_CITY, true);
    }
}

// 根据坐标获取位置名称
async function getLocationName(latitude, longitude) {
    try {
        const cacheKey = buildCacheKey('reverse', `${latitude.toFixed(2)},${longitude.toFixed(2)}`);
        const data = await fetchJsonWithCache(
            buildApiUrl('/geo/1.0/reverse', { lat: latitude, lon: longitude, limit: 1 }),
            cacheKey,
            '获取位置名称'
        );
        if (Array.isArray(data) && data.length > 0) {
            const location = data[0];
            const locationName = `${location.name}${location.state ? ', ' + location.state : ''}, ${location.country}`;
            setLocationLabel(`当前位置: ${locationName}`);
        } else {
            setLocationLabel(`当前位置: 纬度 ${latitude.toFixed(2)}, 经度 ${longitude.toFixed(2)}`);
        }
    } catch (error) {
        console.error('获取位置名称失败:', error);
        setLocationLabel(`当前位置: 纬度 ${latitude.toFixed(2)}, 经度 ${longitude.toFixed(2)}`);
    }
}

// 搜索位置
async function searchLocation() {
    const locationInput = document.getElementById('location-input').value.trim();
    
    if (!locationInput) {
        alert('请输入城市名称');
        return;
    }
    
    await fetchWeatherByCity(locationInput);
}

async function fetchWeatherByCity(cityName, isFallback = false) {
    showLoadingState(`正在搜索 "${cityName}" 的天气数据...`);
    try {
        const cacheKey = buildCacheKey('direct', cityName.toLowerCase());
        const data = await fetchJsonWithCache(
            buildApiUrl('/geo/1.0/direct', { q: cityName, limit: 1 }),
            cacheKey,
            '搜索位置'
        );
        if (!Array.isArray(data) || data.length === 0) {
            setLocationLabel('未找到该位置');
            showErrorState('无法找到该位置的天气数据，请检查输入并重试');
            return;
        }
        
        const location = data[0];
        const latitude = location.lat;
        const longitude = location.lon;
        const locationName = `${location.name}${location.state ? ', ' + location.state : ''}, ${location.country}`;
        setLocationLabel(`${isFallback ? '默认城市' : '查询位置'}: ${locationName}`);
        
        await getWeatherData(latitude, longitude);
    } catch (error) {
        console.error('搜索位置失败:', error);
        showErrorState(isFallback ? '默认城市数据获取失败，请稍后再试' : '搜索位置失败，请稍后再试');
    }
}

// 显示加载状态
function showLoadingState(message) {
    const loadingEl = document.getElementById('loading');
    const weatherEl = document.getElementById('weather-info');
    const alertEl = document.getElementById('heat-index-alert');
    if (loadingEl) {
        loadingEl.classList.remove('hidden');
        loadingEl.textContent = message;
    }
    if (weatherEl) {
        weatherEl.classList.add('hidden');
    }
    if (alertEl) {
        alertEl.classList.add('hidden');
    }
    setLocationLabel(message);
}

// 获取天气数据
function getWeatherData(latitude, longitude) {
    // 并行获取当前天气与预报
    return Promise.all([
        getCurrentWeather(latitude, longitude),
        getHourlyForecast(latitude, longitude)
    ]);
}

// 获取当前天气数据
async function getCurrentWeather(latitude, longitude) {
    try {
        const cacheKey = buildCacheKey('current', `${latitude.toFixed(2)},${longitude.toFixed(2)}`);
        const data = await fetchJsonWithCache(
            buildApiUrl('/data/2.5/weather', { lat: latitude, lon: longitude, units: 'metric', lang: 'zh_cn' }),
            cacheKey,
            '获取当前天气数据'
        );
        if (!data || !data.main || !Array.isArray(data.weather) || !data.weather[0]) {
            throw new Error('天气数据不完整');
        }
        displayCurrentWeather(data);
    } catch (error) {
        console.error('获取当前天气数据失败:', error);
        showErrorState('获取天气数据失败，请稍后再试');
    }
}

// 获取24小时预报数据
async function getHourlyForecast(latitude, longitude) {
    try {
        const cacheKey = buildCacheKey('forecast', `${latitude.toFixed(2)},${longitude.toFixed(2)}`);
        const data = await fetchJsonWithCache(
            buildApiUrl('/data/2.5/forecast', { lat: latitude, lon: longitude, units: 'metric', lang: 'zh_cn' }),
            cacheKey,
            '获取小时预报数据'
        );
        const hourlyData = Array.isArray(data?.list) ? data.list.slice(0, 8) : [];
        if (hourlyData.length === 0) {
            throw new Error('小时预报为空');
        }
        displayHourlyForecast(hourlyData);
    } catch (error) {
        console.error('获取小时预报数据失败:', error);
        const chartContainer = document.querySelector('.chart-container');
        if (chartContainer) {
            chartContainer.innerHTML = '<div class="text-center text-gray-400">小时级预报暂不可用</div>';
        }
    }
}

// 显示当前天气信息
function displayCurrentWeather(data) {
    const weather = Array.isArray(data.weather) ? data.weather[0] : null;
    if (!weather || !data.main) {
        showErrorState('当前天气数据不完整');
        return;
    }
    
    // 隐藏加载提示，显示天气信息
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('weather-info').classList.remove('hidden');
    
    // 设置天气图标
    const iconCode = weather.icon;
    const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    document.getElementById('weather-icon').src = iconUrl;
    document.getElementById('weather-description').textContent = weather.description || '';
    
    // 设置温度、湿度和风速
    const temperature = data.main.temp;
    const humidity = data.main.humidity;
    if (typeof temperature !== 'number' || typeof humidity !== 'number') {
        showErrorState('当前天气数据异常');
        return;
    }
    document.getElementById('temperature').textContent = `${temperature.toFixed(1)}°C`;
    document.getElementById('humidity').textContent = `${humidity}%`;
    const windSpeed = data.wind && typeof data.wind.speed === 'number' ? data.wind.speed : '--';
    document.getElementById('wind-speed').textContent = `${windSpeed} m/s`;
    
    // 计算并显示热指数
    const heatIndex = calculateHeatIndex(temperature, humidity);
    document.getElementById('heat-index').textContent = `${heatIndex.toFixed(1)}°C`;
    
    // 显示热指数警告
    displayHeatIndexAlert(heatIndex);
    
    // 更新健康提示
    updateHealthTips(heatIndex);
}

// 显示24小时预报
function displayHourlyForecast(hourlyData) {
    if (!Array.isArray(hourlyData) || hourlyData.length === 0) {
        const chartContainer = document.querySelector('.chart-container');
        if (chartContainer) {
            chartContainer.innerHTML = '<div class="text-center text-gray-400">暂无预报数据</div>';
        }
        return;
    }
    
    // 准备图表数据
    const labels = [];
    const temperatures = [];
    const heatIndices = [];
    const humidities = [];
    
    hourlyData.forEach(item => {
        // 格式化时间
        const date = new Date(item.dt * 1000);
        const hours = date.getHours();
        const formattedTime = `${hours}:00`;
        
        // 收集数据
        labels.push(formattedTime);
        temperatures.push(item.main.temp);
        humidities.push(item.main.humidity);
        
        // 计算热指数
        const heatIndex = calculateHeatIndex(item.main.temp, item.main.humidity);
        heatIndices.push(heatIndex);
    });
    
    // 创建图表
    createHeatIndexChart(labels, temperatures, heatIndices, humidities);
}

// 创建热指数图表
function createHeatIndexChart(labels, temperatures, heatIndices, humidities) {
    // 获取图表容器
    const canvas = document.getElementById('heat-index-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // 如果已有图表实例，销毁它
    if (chart) {
        chart.destroy();
    }
    
    // 检查Chart.js是否可用
    if (!window.Chart) {
        console.error('Chart.js未加载，无法创建图表');
        return;
    }
    
    // 创建新图表
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: '热指数 (°C)',
                    data: heatIndices,
                    borderColor: '#FF6B00', // 使用品牌橙色
                    backgroundColor: 'rgba(255, 107, 0, 0.1)',
                    borderWidth: 3,
                    pointBackgroundColor: '#FF6B00',
                    pointBorderColor: '#FF6B00',
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    tension: 0.3,
                    fill: false,
                    order: 1 // 确保热指数在最前
                },
                {
                    label: '温度 (°C)',
                    data: temperatures,
                    borderColor: 'rgba(255, 255, 255, 0.7)',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    pointBackgroundColor: 'rgba(255, 255, 255, 0.7)',
                    pointBorderColor: 'rgba(255, 255, 255, 0.7)',
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    tension: 0.3,
                    fill: false,
                    order: 2
                },
                {
                    label: '湿度 (%)',
                    data: humidities,
                    borderColor: 'rgba(100, 149, 237, 0.7)',
                    backgroundColor: 'rgba(100, 149, 237, 0.1)',
                    borderWidth: 2,
                    borderDash: [3, 3],
                    pointBackgroundColor: 'rgba(100, 149, 237, 0.7)',
                    pointBorderColor: 'rgba(100, 149, 237, 0.7)',
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    tension: 0.3,
                    fill: false,
                    yAxisID: 'y1',
                    order: 3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(17, 24, 39, 0.8)', // Dark background for tooltip
                    titleColor: '#E5E7EB',
                    bodyColor: '#E5E7EB',
                    borderColor: '#FF6B00',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += context.parsed.y.toFixed(1);
                                if (context.datasetIndex === 2) {
                                    label += '%'; // 湿度单位
                                } else {
                                    label += '°C'; // 温度和热指数单位
                                }
                            }
                            return label;
                        }
                    }
                },
                legend: {
                    position: 'top',
                    labels: {
                        color: '#E5E7EB' // 图例文字颜色
                    }
                },
                annotation: {
                    annotations: {
                        // 舒适区域 (< 27°C)
                        comfortable: {
                            type: 'box',
                            yMin: 0,
                            yMax: 27,
                            backgroundColor: 'rgba(107, 114, 128, 0.3)',
                            borderColor: 'transparent',
                            label: {
                                display: true,
                                content: '舒适',
                                position: 'start',
                                color: '#D1D5DB', // Gray-300
                                font: { size: 10 }
                            }
                        },
                        // 注意区域 (27-32°C)
                        caution: {
                            type: 'box',
                            yMin: 27,
                            yMax: 32,
                            backgroundColor: 'rgba(209, 213, 219, 0.3)',
                            borderColor: 'transparent',
                            label: {
                                display: true,
                                content: '注意',
                                position: 'start',
                                color: '#F3F4F6', // Gray-100
                                font: { size: 10 }
                            }
                        },
                        // 警惕区域 (32-41°C)
                        extreme_caution: {
                            type: 'box',
                            yMin: 32,
                            yMax: 41,
                            backgroundColor: 'rgba(255, 165, 0, 0.3)',
                            borderColor: 'transparent',
                            label: {
                                display: true,
                                content: '警惕',
                                position: 'start',
                                color: '#FFEDD5', // Orange-100
                                font: { size: 10 }
                            }
                        },
                        // 危险区域 (41-54°C)
                        danger: {
                            type: 'box',
                            yMin: 41,
                            yMax: 54,
                            backgroundColor: 'rgba(255, 107, 0, 0.4)',
                            borderColor: 'transparent',
                            label: {
                                display: true,
                                content: '危险',
                                position: 'start',
                                color: '#FFEDD5', // Orange-100
                                font: { size: 10 }
                            }
                        },
                        // 极度危险区域 (>54°C)
                        extreme_danger: {
                            type: 'box',
                            yMin: 54,
                            backgroundColor: 'rgba(239, 68, 68, 0.4)',
                            borderColor: 'transparent',
                            label: {
                                display: true,
                                content: '极度危险',
                                position: 'start',
                                color: '#FECACA', // Red-200
                                font: { size: 10 }
                            }
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: '温度 / 热指数 (°C) / 湿度 (%)',
                        color: '#E5E7EB' // Y轴标题颜色
                    },
                    ticks: {
                        color: '#E5E7EB' // Y轴刻度文字颜色
                    },
                    grid: {
                        color: 'rgba(107, 114, 128, 0.2)' // Y轴网格线颜色
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: '时间 (未来24小时)',
                        color: '#E5E7EB' // X轴标题颜色
                    },
                    ticks: {
                        color: '#E5E7EB' // X轴刻度文字颜色
                    },
                    grid: {
                        color: 'rgba(107, 114, 128, 0.2)' // X轴网格线颜色
                    }
                }
            }
        }
    });
}

// 计算热指数
function calculateHeatIndex(temperature, humidity) {
    // 首先将摄氏度转换为华氏度
    const tempF = (temperature * 9/5) + 32;
    
    // 使用美国国家气象局的热指数公式
    let heatIndexF = -42.379 + 
                     2.04901523 * tempF + 
                     10.14333127 * humidity - 
                     0.22475541 * tempF * humidity - 
                     0.00683783 * tempF * tempF - 
                     0.05481717 * humidity * humidity + 
                     0.00122874 * tempF * tempF * humidity + 
                     0.00085282 * tempF * humidity * humidity - 
                     0.00000199 * tempF * tempF * humidity * humidity;
    
    // 如果热指数低于80°F，使用简化公式
    if (tempF < 80) {
        heatIndexF = 0.5 * (tempF + 61.0 + ((tempF - 68.0) * 1.2) + (humidity * 0.094));
    }
    
    // 将华氏度转回摄氏度
    const heatIndexC = (heatIndexF - 32) * 5/9;
    
    return heatIndexC;
}

// 显示热指数警告 (调整颜色以适应深色主题)
function displayHeatIndexAlert(heatIndex) {
    const alertElement = document.getElementById('heat-index-alert');
    alertElement.classList.remove('hidden');
    alertElement.classList.add('p-3', 'rounded-md', 'text-sm', 'font-medium', 'mt-4'); // 添加一些Tailwind类
    
    // 根据热指数级别设置不同的警告
    if (heatIndex < 27) {
        alertElement.textContent = '当前热指数处于舒适范围';
        alertElement.className = 'p-3 rounded-md text-sm font-medium mt-4 bg-gray-700 text-gray-200';
    } else if (heatIndex < 32) {
        alertElement.textContent = '注意：可能感到轻微不适';
        alertElement.className = 'p-3 rounded-md text-sm font-medium mt-4 bg-yellow-700 text-yellow-100';
    } else if (heatIndex < 41) {
        alertElement.textContent = '警惕：可能导致热痉挛和热疲劳';
        alertElement.className = 'p-3 rounded-md text-sm font-medium mt-4 bg-orange-600 text-orange-100';
    } else if (heatIndex < 54) {
        alertElement.textContent = '危险：可能导致热疲劳，长时间暴露可能导致中暑';
        alertElement.className = 'p-3 rounded-md text-sm font-medium mt-4 bg-red-600 text-red-100';
    } else {
        alertElement.textContent = '极度危险：可能导致热射病/中暑';
        alertElement.className = 'p-3 rounded-md text-sm font-medium mt-4 bg-red-800 text-red-100';
    }
}

// 更新健康提示
function updateHealthTips(heatIndex) {
    const tipsList = document.getElementById('health-tips-list');
    tipsList.innerHTML = ''; // 清空现有提示
    
    let tips = [];
    
    // 根据热指数级别提供不同的健康建议
    if (heatIndex < 27) {
        tips = [
            '当前热指数处于舒适范围，适合正常活动',
            '保持正常的水分摄入',
            '可以正常进行户外活动'
        ];
    } else if (heatIndex < 32) {
        tips = [
            '对于敏感人群可能感到不适',
            '进行剧烈活动时注意休息',
            '保持适当的水分摄入',
            '尽量避免长时间暴露在阳光下'
        ];
    } else if (heatIndex < 41) {
        tips = [
            '注意可能出现热痉挛和热疲劳',
            '减少户外活动时间，特别是在阳光直射时',
            '增加水分摄入，每小时至少喝一杯水',
            '穿着轻便、浅色、宽松的衣物',
            '注意观察身体不适症状'
        ];
    } else if (heatIndex < 54) {
        tips = [
            '危险！可能导致热疲劳',
            '避免户外活动，尤其是剧烈运动',
            '待在阴凉处或有空调的环境中',
            '大量补充水分和电解质',
            '密切关注老人、儿童和有慢性病的人',
            '如出现头晕、恶心、皮肤发热但不出汗的症状，立即就医'
        ];
    } else {
        tips = [
            '极度危险！可能导致热射病',
            '取消所有户外活动',
            '待在有空调的环境中',
            '如必须外出，限制在短时间内并避免剧烈活动',
            '密切关注自己和他人的健康状况',
            '如出现高热、意识模糊、皮肤干热症状，立即就医'
        ];
    }
    
    // 添加提示到列表
    tips.forEach(tip => {
        const li = document.createElement('li');
        li.textContent = tip;
        tipsList.appendChild(li);
    });
}

// 处理位置错误
function handleLocationError(error) {
    let errorMessage = '位置获取失败';
    switch(error.code) {
        case error.PERMISSION_DENIED:
            errorMessage = '用户拒绝了位置请求。请允许浏览器获取位置信息以使用此功能。';
            break;
        case error.POSITION_UNAVAILABLE:
            errorMessage = '位置信息不可用。请检查您的设备设置。';
            break;
        case error.TIMEOUT:
            errorMessage = '获取位置请求超时。请稍后再试。';
            break;
        case error.UNKNOWN_ERROR:
            errorMessage = '发生未知错误。请稍后再试。';
            break;
    }
    
    setLocationLabel('位置获取失败');
    showErrorState(`${errorMessage}，正在尝试默认城市 ${FALLBACK_CITY}`);
    console.error('位置错误:', errorMessage);
    fetchWeatherByCity(FALLBACK_CITY, true);
}


// 手动计算热指数
function calculateManualHeatIndex() {
    const tempInput = document.getElementById('manual-temp');
    const humidityInput = document.getElementById('manual-humidity');
    const resultContainer = document.getElementById('manual-result');
    const hiValueElement = document.getElementById('manual-hi-value');
    const hiLevelElement = document.getElementById('manual-hi-level');
    const hiTipsElement = document.getElementById('manual-hi-tips');
    
    // 获取输入值
    const temperature = parseFloat(tempInput.value);
    const humidity = parseFloat(humidityInput.value);
    
    // 验证输入
    if (isNaN(temperature) || isNaN(humidity)) {
        alert('请输入有效的温度和湿度值');
        return;
    }
    
    if (temperature < 0 || temperature > 50) {
        alert('温度应在0-50°C范围内');
        return;
    }
    
    if (humidity < 0 || humidity > 100) {
        alert('湿度应在0-100%范围内');
        return;
    }
    
    // 计算热指数
    const heatIndex = calculateHeatIndex(temperature, humidity);
    
    // 显示结果
    hiValueElement.textContent = `${heatIndex.toFixed(1)}°C`;
    resultContainer.classList.remove('hidden');
    
    // 设置热指数级别
    let levelText = '';
    let levelColor = '';
    let tips = [];
    
    if (heatIndex < 27) {
        levelText = '舒适';
        levelColor = 'bg-green-600 text-green-100';
        tips = [
            '当前热指数处于舒适范围，适合正常活动',
            '保持正常的水分摄入',
            '可以正常进行户外活动'
        ];
    } else if (heatIndex < 32) {
        levelText = '注意';
        levelColor = 'bg-yellow-500 text-yellow-100';
        tips = [
            '对于敏感人群可能感到不适',
            '进行剧烈活动时注意休息',
            '保持适当的水分摄入',
            '尽量避免长时间暴露在阳光下'
        ];
    } else if (heatIndex < 41) {
        levelText = '警惕';
        levelColor = 'bg-orange-500 text-orange-100';
        tips = [
            '注意可能出现热痉挛和热疲劳',
            '减少户外活动时间，特别是在阳光直射时',
            '增加水分摄入，每小时至少喝一杯水',
            '穿着轻便、浅色、宽松的衣物',
            '注意观察身体不适症状'
        ];
    } else if (heatIndex < 54) {
        levelText = '危险';
        levelColor = 'bg-red-600 text-red-100';
        tips = [
            '危险！可能导致热疲劳',
            '避免户外活动，尤其是剧烈运动',
            '待在阴凉处或有空调的环境中',
            '大量补充水分和电解质',
            '密切关注老人、儿童和有慢性病的人',
            '如出现头晕、恶心、皮肤发热但不出汗等症状，立即就医'
        ];
    } else {
        levelText = '极度危险';
        levelColor = 'bg-red-800 text-red-100';
        tips = [
            '极度危险！可能导致热射病',
            '取消所有户外活动',
            '待在有空调的环境中',
            '如必须外出，限制在短时间内并避免剧烈活动',
            '密切关注自己和他人的健康状况',
            '如出现高热、意识模糊、皮肤干热症状，立即就医'
        ];
    }
    
    // 更新UI
    hiLevelElement.textContent = levelText;
    hiLevelElement.className = `px-4 py-1 rounded-full text-sm font-semibold ${levelColor}`;
    
    // 清空并添加提示
    hiTipsElement.innerHTML = '';
    tips.forEach(tip => {
        const tipElement = document.createElement('div');
        tipElement.className = 'mb-1';
        tipElement.textContent = `• ${tip}`;
        hiTipsElement.appendChild(tipElement);
    });
}
