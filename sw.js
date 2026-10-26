// Service Worker: macht die App offline nutzbar.
// Strategie: zuerst Netzwerk ohne HTTP-Cache (damit Updates sofort ankommen), bei Offline aus dem Cache.
const CACHE = 'rk-v44';
const SHELL = [
  './',
  'index.html',
  'style.css',
  'rules.js',
  'app.js',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'decks/index.json',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    // no-cache: am Server nachfragen statt den 10-Minuten-HTTP-Cache von GitHub Pages zu nutzen
    fetch(req.mode === 'navigate' ? req.url : req, { cache: 'no-cache' })
      .then(res => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('index.html')))
  );
});
