// Budge service worker: works offline, shows notifications.
const CACHE = 'budge-de3ffa72';
const ASSETS = ["./", "index.html", "style.css?v=de3ffa72", "app.js?v=de3ffa72", "vendor/preact-htm.js", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/badge-96.png", "icons/favicon.svg"];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (req.mode === 'navigate') {
    // Fresh page when online, saved copy when offline.
    e.respondWith(fetch(req).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put('index.html', copy)); return r; })
      .catch(() => caches.match('index.html')));
    return;
  }
  if (url.origin === location.origin || url.host.endsWith('fonts.googleapis.com') || url.host.endsWith('fonts.gstatic.com')) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
      if (r.ok || r.type === 'opaque') { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return r;
    })));
  }
});
// Ready for real reminders later (a small server sends these).
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) { d = { body: e.data && e.data.text() }; }
  e.waitUntil(Promise.all([
    self.registration.showNotification(d.title || 'Anything to log today?', {
      body: d.body || 'Tap to add what you spent.', icon: 'icons/icon-192.png', badge: 'icons/badge-96.png', tag: 'daily', data: { url: d.url || './?add=1' }
    }),
    self.navigator && self.navigator.setAppBadge ? self.navigator.setAppBadge(1).catch(() => {}) : null
  ]));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const target = new URL((e.notification.data && e.notification.data.url) || './', self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) if ('focus' in c) { c.navigate(target); return c.focus(); }
    return self.clients.openWindow(target);
  }));
});
