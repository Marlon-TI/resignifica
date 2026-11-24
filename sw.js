/* Service worker: guarda só os arquivos do app para funcionar offline. Nunca armazena dados do usuário. */
const CACHE = 'resignifica-v0.1.1';
const ASSETS = [
  './', 'index.html', 'manifest.webmanifest', 'css/styles.css',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'vendor/jspdf.umd.min.js',
  'js/util.js', 'js/crypto.js', 'js/store.js', 'js/content.js', 'js/views-auth.js', 'js/views-main.js',
  'js/views-record.js', 'js/views-journey.js', 'js/report.js', 'js/demo.js', 'js/views-profile.js', 'js/app.js',
];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((r) => r || fetch(e.request)));
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window' }).then((cs) => (cs[0] ? cs[0].focus() : self.clients.openWindow('./#/momento'))));
});
