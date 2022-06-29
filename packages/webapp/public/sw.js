const cacheName = 'console';
const assetsToCache = [...new Set([self.location.pathname, '/'])].map((path) => self.location.origin + path);

self.addEventListener('activate', (event) => {
  event.waitUntil(self.registration.navigationPreload?.enable() || Promise.resolve());
});

self.addEventListener('install', () => {
  self.skipWaiting();
  self.caches.open(cacheName).then((cache) => {
    cache.addAll(assetsToCache);
  });
});

self.addEventListener('push', function (event) {
  let payload = {};
  try {
    payload = event.data.json();
  } catch (e) {
    payload = { title: event.data.text() };
  }
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      icon: '/logo-144.png',
      body: payload.body,
      data: payload.data,
    }),
  );
});

self.addEventListener('notificationclick', function (event) {
  if (event.notification.data?.url) {
    self.clients.openWindow(event.notification.data.url);
  }
  event.notification.close();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const requestUrl = new URL(request.url);
  const isSomeOrigin = requestUrl.origin === self.location.origin;
  const isApiFetch = (isSomeOrigin && requestUrl.pathname.startsWith('/api')) || requestUrl.origin.includes('api.');

  if (request.method !== 'GET') return;
  if (!isSomeOrigin && !isApiFetch) return;

  const getCache = () => self.caches.match(request, { ignoreSearch: request.mode === 'navigate' });

  event.respondWith(
    (async function () {
      const response = await event.preloadResponse;
      if (response) return response;

      return fetch(request, isSomeOrigin ? {} : { mode: 'cors', credentials: 'same-origin' })
        .then(async (response) => {
          if (response.ok) {
            const responseCache = response.clone();
            self.caches.open(cacheName).then((cache) => cache.put(request, responseCache));
            return response;
          } else {
            const cache = await getCache();
            return cache || response;
          }
        })
        .catch(async (err) => {
          const cache = await getCache();
          if (cache) {
            return cache;
          } else {
            throw err;
          }
        });
    })(),
  );
});
