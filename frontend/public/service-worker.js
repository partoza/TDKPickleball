const CACHE_NAME = 'tdk-pwa-cache-v5';
const offlineResponse = () => new Response('The app is temporarily offline.', {
  status: 503,
  statusText: 'Offline',
  headers: { 'Content-Type': 'text/plain; charset=utf-8' }
});

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled([
        '/',
        '/index.html',
        '/manifest.json',
        '/widget-manifest.json',
        '/assets/images/tdk-icon.png',
        '/assets/images/loading.png'
      ].map((asset) => cache.add(asset)));
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) return;
  const url = new URL(event.request.url);
  if (url.pathname === '/manifest.json' || url.pathname === '/widget-manifest.json') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(async () => (await caches.match(event.request)) || offlineResponse())
    );
    return;
  }
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(async () => (await caches.match('/index.html')) || offlineResponse()));
    return;
  }
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request).catch(() => offlineResponse()))
  );
});
