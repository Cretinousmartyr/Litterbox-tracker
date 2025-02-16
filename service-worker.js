const CACHE_NAME = "litter-box-cache-v1";
const urlsToCache = [
  "/", // caches the root (adjust if your GitHub Pages site is in a subfolder)
  "/index.html",
  "/styles.css",
  "/app.js",
];

// Install event – cache essential files.
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Fetch event – serve cached assets if available.
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      // Return cached response if found, else fetch from network.
      return response || fetch(event.request);
    })
  );
});
