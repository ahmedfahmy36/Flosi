const CACHE_NAME = 'flosy-cache-v1';

self.addEventListener('install', (e) => {
  // Skip waiting allows the service worker to activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (e) => {
  // A simple pass-through fetch that allows the browser to handle caching for now
  // but fulfills the PWA requirement of having a fetch handler.
  e.respondWith(
    fetch(e.request).catch(() => {
      return caches.match(e.request);
    })
  );
});
