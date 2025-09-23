const CACHE_NAME = "agro-cafe-cache-v" + new Date().getTime();
const urlsToCache = ["./","./index.html","./style.css","./app.js","./manifest.json","./icon.png"];
self.addEventListener("install", e => e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(urlsToCache))));
self.addEventListener("activate", e => e.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => {if (k!==CACHE_NAME) return caches.delete(k);}))))); 
self.addEventListener("fetch", e => e.respondWith(fetch(e.request).catch(() => caches.match(e.request))));
