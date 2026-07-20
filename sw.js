const CACHE_NAME = "dg-scorecard-v1";
const urlsToCache = [
  "index.html",
  "style.css",
  "script.js",
  "manifest.json",
  "icon.png"
];

// Mjukare installation: Cachar det som går även om en fil skulle fela
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.all(
        urlsToCache.map(url => {
          return cache.add(url).catch(err => console.log("Kunde inte cacha:", url, err));
        })
      );
    })
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});