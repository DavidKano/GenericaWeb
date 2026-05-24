const CACHE_NAME = 'generica-web-v3';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  // 1. Solo interceptar peticiones GET
  if (event.request.method !== 'GET') {
    return;
  }

  // 2. Solo interceptar protocolos HTTP o HTTPS (ignorar chrome-extension, etc.)
  if (!event.request.url.startsWith('http')) {
    return;
  }

  const url = new URL(event.request.url);

  // 3. BYPASS PARA FIREBASE / GOOGLE APIS
  // Al no hacer event.respondWith(), la petición se procesa directamente por el navegador (petición nativa).
  // Esto evita interrumpir las conexiones persistentes (Server-Sent Events / Long Polling / WebSockets) de Firestore.
  if (
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('identitytoolkit.googleapis.com') ||
    url.hostname.includes('firebase.googleapis.com') ||
    url.hostname.includes('firebaseapp.com') ||
    url.hostname.includes('googleapis.com')
  ) {
    return;
  }

  // 4. Lógica normal del Service Worker (Cache First)
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - retornar respuesta
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

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
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
