// https://github.com/microsoft/TypeScript/issues/14877
// https://github.com/microsoft/TypeScript/issues/11781
/// <reference lib="webworker" />

/**
 * @type {ServiceWorkerGlobalScope}
 */
const sw = self;

const cacheName = 'console';
const assetsToCache = [...new Set([sw.location.pathname, '/'])].map((path) => sw.location.origin + path);

sw.addEventListener('activate', (event) => {
  event.waitUntil(sw.registration.navigationPreload?.enable() || Promise.resolve());
});

sw.addEventListener('install', () => {
  sw.skipWaiting();
  sw.caches.open(cacheName).then((cache) => {
    cache.addAll(assetsToCache);
  });
});

sw.addEventListener('push', function (event) {
  let payload = {};
  try {
    payload = event.data.json();
  } catch (e) {
    payload = { title: event.data.text() };
  }
  event.waitUntil(
    sw.registration.showNotification(payload.title, {
      icon: '/logo-144.png',
      body: payload.body,
      data: payload.data,
    }),
  );
});

sw.addEventListener('notificationclick', function (event) {
  if (event.notification.data?.url) {
    sw.clients.openWindow(event.notification.data.url);
  }
  event.notification.close();
});

sw.addEventListener('fetch', (event) => {
  const { request } = event;
  const requestUrl = new URL(request.url);
  const isSomeOrigin = requestUrl.origin === sw.location.origin;
  const isApiFetch = (isSomeOrigin && requestUrl.pathname.startsWith('/api')) || requestUrl.origin.includes('api.');

  if (request.method !== 'GET') return;
  if (!isSomeOrigin && !isApiFetch) return;

  const getCache = () => sw.caches.match(request, { ignoreSearch: request.mode === 'navigate' });

  event.respondWith(
    (async function () {
      const response = await event.preloadResponse;
      if (response) return response;

      return fetch(request, isSomeOrigin ? {} : { mode: 'cors', credentials: 'same-origin' })
        .then(async (response) => {
          if (response.ok) {
            const responseCache = response.clone();
            sw.caches.open(cacheName).then((cache) => cache.put(request, responseCache));
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
