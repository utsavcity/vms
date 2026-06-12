// Service worker — precaching, runtime caching, Web Push.
import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst } from 'workbox-strategies';
import { clientsClaim } from 'workbox-core';

self.skipWaiting();
clientsClaim();

precacheAndRoute(self.__WB_MANIFEST);

// Offline shell — serve the app shell for all navigations
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')));

// Network-first for Supabase (REST, auth, storage)
registerRoute(
  ({ url }) => url.hostname.endsWith('.supabase.co'),
  new NetworkFirst({ cacheName: 'supabase', networkTimeoutSeconds: 5 })
);

// Network-first for our backend API
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({ cacheName: 'api', networkTimeoutSeconds: 5 })
);

// Cache-first for Google Fonts
registerRoute(
  ({ url }) => url.hostname.includes('fonts.g'),
  new CacheFirst({ cacheName: 'fonts' })
);

// Web Push
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data?.json() || {}; } catch { data = { body: event.data?.text() }; }
  event.waitUntil(
    self.registration.showNotification(data.title || 'Utsav City', {
      body: data.body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: data.url || '/',
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow(event.notification.data || '/'));
});
