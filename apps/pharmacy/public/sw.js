const CACHE_NAME = 'pharmacy-v1.0.0';
const STATIC_CACHE = 'pharmacy-static-v1.0.0';
const DYNAMIC_CACHE = 'pharmacy-dynamic-v1.0.0';

// 需要缓存的静态资源
const STATIC_ASSETS = ['/', '/index.html', '/manifest.json'];

// 需要缓存的路由
const CACHED_ROUTES = [
  '/dashboard',
  '/medicines',
  '/inventory',
  '/inbound',
  '/outbound',
  '/reports',
  '/users',
];

// 安装事件
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then(cache => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker installed');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Service Worker installation failed:', error);
      })
  );
});

// 激活事件
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches
      .keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker activated');
        return self.clients.claim();
      })
  );
});

// 拦截请求
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // 跳过非GET请求
  if (request.method !== 'GET') {
    return;
  }

  // 跳过API请求
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // 跳过Supabase请求
  if (url.hostname.includes('supabase.co')) {
    return;
  }

  // 跳过Chrome扩展请求
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // 处理导航请求（解决404问题的关键）
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          // 如果请求成功，返回响应
          if (response.ok) {
            return response;
          }
          // 如果是404或其他错误，返回缓存的index.html
          return caches.match('/index.html');
        })
        .catch(() => {
          // 如果网络请求失败，返回缓存的index.html
          console.log(
            'Network failed, serving cached index.html for:',
            request.url
          );
          return caches.match('/index.html');
        })
    );
    return;
  }

  // 处理静态资源
  event.respondWith(
    caches.match(request).then(response => {
      if (response) {
        return response;
      }

      return fetch(request)
        .then(response => {
          // 只缓存成功的响应
          if (
            !response ||
            response.status !== 200 ||
            response.type !== 'basic'
          ) {
            return response;
          }

          // 克隆响应用于缓存
          const responseToCache = response.clone();

          caches.open(DYNAMIC_CACHE).then(cache => {
            cache.put(request, responseToCache);
          });

          return response;
        })
        .catch(error => {
          console.error('Fetch failed:', error);
          throw error;
        });
    })
  );
});

// 处理消息
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// 错误处理
self.addEventListener('error', event => {
  console.error('Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', event => {
  console.error('Service Worker unhandled rejection:', event.reason);
});
