// Service Worker simple pour cache de l'app (PWA) et support optional periodic background sync
const CACHE_NAME = 'checklist-app-v1';
const ASSETS = [
  '/', '/index.html', '/styles.css', '/app.js', '/manifest.json'
];

// Install: cache app shell
self.addEventListener('install', ev => {
  ev.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate: cleanup old caches
self.addEventListener('activate', ev => {
  ev.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

// Fetch: cache-first for app shell, network-first for dynamic JSON (checklists)
self.addEventListener('fetch', ev => {
  const url = new URL(ev.request.url);
  // For checklists.json (dynamic) prefer network then fallback to cache
  if(url.pathname.endsWith('checklists.json') || url.href.includes('/raw.githubusercontent.com/')){
    ev.respondWith(fetch(ev.request).catch(()=> caches.match(ev.request)));
    return;
  }
  // For others, respond with cache falling back to network
  ev.respondWith(
    caches.match(ev.request).then(res => res || fetch(ev.request))
  );
});

// Optional: listen to periodic sync (if supported)
self.addEventListener('periodicsync', event => {
  if(event.tag === 'daily-stats-sync'){
    event.waitUntil(handlePeriodicSync());
  }
});

async function handlePeriodicSync(){
  // This Service Worker cannot access localStorage directly.
  // One strategy: postMessage to clients to request a sync (clients must implement message listener)
  const clientsList = await self.clients.matchAll({includeUncontrolled:true});
  for(const c of clientsList){
    c.postMessage({type:'REQUEST_DAILY_SYNC'});
  }
}
