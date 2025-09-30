// POS 系統 Service Worker
const CACHE_NAME = 'pos-system-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json'
];

// 安裝 Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('快取已開啟');
        // 只快取存在的資源，忽略錯誤
        return Promise.allSettled(
          urlsToCache.map(url => 
            cache.add(url).catch(err => {
              console.log('無法快取:', url);
              return null;
            })
          )
        );
      })
  );
  self.skipWaiting();
});

// 激活 Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('刪除舊快取:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 攔截請求
self.addEventListener('fetch', event => {
  // 跳過 chrome-extension 和其他非 http(s) 請求
  if (!event.request.url.startsWith('http')) {
    return;
  }

  // 跳過 CDN 資源（避免 CORS 問題）
  if (event.request.url.includes('cdnjs.cloudflare.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 如果快取中有，返回快取
        if (response) {
          return response;
        }
        
        // 否則從網路獲取
        return fetch(event.request).catch(err => {
          console.log('網路請求失敗:', event.request.url);
          // 返回一個簡單的離線頁面或空響應
          return new Response('離線模式', {
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
