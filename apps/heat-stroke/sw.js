// 缓存名称和版本
const CACHE_NAME = 'hongys-cache-v3';

// 需要缓存的资源列表
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/css/tailwind.css',
  '/assets/css/styles.css',
  '/assets/js/script.js',
  '/assets/images/favicon.ico',
  // pages 目录下的所有 HTML 页面
  '/heat-stroke/pages/8-4-6-rule',
  '/pages/热指数查询.html',
  '/heat-stroke/pages/heat-tolerance',
  '/pages/热射病现场处置.html',
  '/heat-stroke/pages/challenge',
  '/heat-stroke/pages/diagnosis-treatment-guideline',
  '/heat-stroke/pages/core-temperature-cooling',
  '/heat-stroke/pages/treatment-system-consensus',
  '/heat-stroke/pages/about'
];

// 安装 Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('已打开缓存');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
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
    .then(() => self.clients.claim())
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
