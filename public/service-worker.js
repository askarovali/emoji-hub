const CACHE_NAME = 'emoji-hub-cache-v1';
const URLS = [
    '/',                   // index.html
    '/index.html',
    '/catalog.html',
    '/moodboard.html',
    '/style.css',
    '/catalog.js',
    '/moodboard.js',
    '/manifest.json',
    '/icons/icon-192.png',
    '/icons/icon-512.png'
];

// Install: pre-cache the app shell
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(URLS))
    );
    self.skipWaiting();
});

// Activate: purge old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys
                    .filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            )
        )
    );
    self.clients.claim();
});


self.addEventListener('fetch', event => {
    // только навигационные переходы по ссылкам / ввод URL
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request) // сперва пробуем сеть
                .catch(() => {
                    // если сеть недоступна — отдаем нужную страницу из кеша
                    const url = new URL(event.request.url);
                    if (url.pathname.endsWith('/catalog.html')) {
                        return caches.match('/catalog.html');
                    }
                    if (url.pathname.endsWith('/moodboard.html')) {
                        return caches.match('/moodboard.html');
                    }
                    // всё остальное — index.html
                    return caches.match('/index.html');
                })
        );
        return;
    }

    // остальные запросы (скрипты, стили, изображения и т.д.) — кеш-первый
    event.respondWith(
        caches.match(event.request)
            .then(cached => {
                return cached || fetch(event.request);
            })
    );
});