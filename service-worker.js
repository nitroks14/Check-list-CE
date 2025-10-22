self.addEventListener('install', event => {
    event.waitUntil(
        caches.open('checklist-cache').then(cache => {
            return cache.addAll([
                'index.html',
                'css/style.css',
                'js/app.js',
                'js/storage.js',
                'js/sync.js',
                'data/machines.json',
                'assets/logo.png'
            ]);
        })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});
