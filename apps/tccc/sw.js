// 缓存名称和版本号
const CACHE_NAME = 'tccc-flow-cache-v1';

// 需要缓存的资源列表（必需资源）
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/css/tailwind.css',
  '/assets/css/fontawesome-shim.css',
  '/sw.js',
  '/pwa-register.js',
  '/offline.html',
  '/README.md',
  '/pages/TCCC标准流程.html',
  '/pages/TCCC静脉通路与止血酸.html',
  '/pages/TCCC骨盆绑带流程.html',
  '/pages/TCCC呼吸管理算法.html',
  '/pages/TFC气道算法.html',
  '/pages/TFC大出血算法.html',
  '/pages/TCCC流程框架.html',
  '/pages/TCCC战伤流程数据.js'
];

// 可选缓存资源（如果不存在也不会导致安装失败）
const optionalUrlsToCache = [
  '/icons/favicon.ico',
  '/icons/apple-touch-icon.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-192-maskable.png',
  '/icons/icon-512-maskable.png',
  '/icons/app-icon.svg'
];

// Service Worker 安装事件，缓存必需资源
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('缓存必需资源');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('尝试缓存可选资源');
        return caches.open(CACHE_NAME).then(cache => {
          // 使用Promise.allSettled来尝试缓存可选资源，但不会因为失败而中断安装
          return Promise.allSettled(
            optionalUrlsToCache.map(url => 
              fetch(url)
                .then(response => {
                  if (response.ok) {
                    return cache.put(url, response);
                  }
                  console.log(`跳过不可用的可选资源: ${url}`);
                })
                .catch(error => {
                  console.log(`无法缓存可选资源: ${url}`, error);
                })
            )
          );
        });
      })
      .then(() => self.skipWaiting()) // 确保新的Service Worker立即激活
  );
});

// Service Worker 激活事件，清理旧缓存
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('删除旧缓存:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // 接管所有客户端
  );
});

// 拦截网络请求，优先使用缓存响应
self.addEventListener('fetch', event => {
  // 排除不需要缓存的请求
  if (
    event.request.method !== 'GET' || 
    event.request.url.includes('chrome-extension://') ||
    event.request.url.includes('extension://') ||
    event.request.url.includes('data:')
  ) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 如果在缓存中找到了资源，直接返回
        if (response) {
          return response;
        }
        
        // 克隆请求，因为请求只能使用一次
        const fetchRequest = event.request.clone();
        
        // 尝试从网络获取资源
        return fetch(fetchRequest)
          .then(response => {
            // 检查响应是否有效
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // 克隆响应，因为响应体只能使用一次
            const responseToCache = response.clone();
            
            // 将新获取的资源添加到缓存
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
              
            return response;
          })
          .catch(error => {
            console.log('请求资源失败:', error);
            
            // 网络请求失败时的处理
            if (event.request.mode === 'navigate') {
              // 如果是导航请求（访问页面），返回缓存中的离线页面
              return caches.match('/offline.html');
            } 
            
            // 对于资源请求，检查是否有可替代资源
            if (event.request.url.includes('.png') || 
                event.request.url.includes('.jpg') || 
                event.request.url.includes('.ico')) {
              // 图像资源失败时，可以返回一个占位图像
              return caches.match('/icons/app-icon.svg');
            }
            
            // 其他类型的请求失败时，返回一个错误响应
            return new Response('网络连接失败，无法获取资源', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// 后台同步事件处理
self.addEventListener('sync', event => {
  if (event.tag === 'sync-update') {
    // 当有网络连接时执行更新操作
    console.log('执行后台同步');
  }
});

// 推送通知事件处理
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: '/icons/app-icon.svg'
      })
    );
  }
});

// 通知点击事件处理
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('./')
  );
}); 
