// Service worker: precache the app shell, then serve same-origin requests
// stale-while-revalidate so the app works offline but still picks up updates.
const CACHE = 'smtracker-v1';
const PRECACHE = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './favicon.png',
    './icon-192.png',
    './manifest.json',
    './marketplace.html',
    './marketplace-data.json'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE).then(cache => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const req = event.request;
    if (req.method !== 'GET') return;
    const url = new URL(req.url);
    if (url.origin !== self.location.origin) return; // let CDN images/APIs pass through

    event.respondWith(
        caches.open(CACHE).then(cache =>
            cache.match(req).then(cached => {
                const fetched = fetch(req)
                    .then(response => {
                        if (response && response.ok) cache.put(req, response.clone());
                        return response;
                    })
                    .catch(() => cached);
                return cached || fetched;
            })
        )
    );
});
