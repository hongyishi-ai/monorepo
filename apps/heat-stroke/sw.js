// 缓存名称和版本
const CACHE_NAME = 'hongys-cache-v2';

// 需要缓存的资源列表
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/css/styles.css',
  '/assets/js/script.js',
  '/assets/images/favicon.ico',
  // pages 目录下的所有 HTML 页面
  '/pages/8-4-6黄金法则.html',
  '/pages/热指数查询.html',
  '/pages/热耐力评估.html',
  '/pages/热射病现场处置.html',
  '/pages/热射病通关挑战.html',
  '/pages/中国热射病诊断与治疗指南.html',
  '/pages/热射病核心体温监测与降温方法.html',
  '/pages/热射病救治体系建设标准专家共识.html',
  '/pages/关于本项目.html'
];

// 安装 Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('已打开缓存');
        return cache.addAll(urlsToCache);
      })
  );
});

// 激活 Service Worker
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 拦截请求并使用缓存
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 缓存有响应则使用缓存
        if (response) {
          return response;
        }
        
        // 复制请求
        const fetchRequest = event.request.clone();
        
        // 发起网络请求
        return fetch(fetchRequest).then(
          response => {
            // 检查响应是否有效
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // 复制响应
            const responseToCache = response.clone();
            
            // 将响应添加到缓存
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
              
            return response;
          }
        );
      })
  );
}); 