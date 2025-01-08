const CACHE_NAME = 'v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/script.js',
    '/series.js',
    '/movies.js',
    '/details.js',
    '/admin.js',
    '/style.css',
    '/media.css',
    '/admin.css',
    '/details.css',
    // أضف هنا أي ملفات أخرى تريد تخزينها مؤقتًا
];

// تثبيت Service Worker وتخزين الملفات مؤقتًا
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(ASSETS_TO_CACHE);
            })
    );
});

// تفعيل Service Worker وحذف الذاكرة المؤقتة القديمة
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});

// استرجاع الملفات من الذاكرة المؤقتة أو من الشبكة
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response; // استرجاع الملف من الذاكرة المؤقتة
                }
                return fetch(event.request); // استرجاع الملف من الشبكة
            })
    );
});	