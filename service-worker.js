const CACHE_NAME = "gestor-cobros-v2";

const ARCHIVOS = [
    "./",
    "./index.html",
    "./styles.css",
    "./app.js",
    "./manifest.json"
];

self.addEventListener("install", event => {
    self.skipWaiting();

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(ARCHIVOS);
            })
    );
});

self.addEventListener("activate", event => {
    event.waitUntil(self.clients.claim());

    event.waitUntil(
        caches.keys().then(nombres => {
            return Promise.all(
                nombres
                    .filter(nombre => nombre !== CACHE_NAME)
                    .map(nombre => caches.delete(nombre))
            );
        })
    );
});

self.addEventListener("fetch", event => {
    event.respondWith(
        caches.match(event.request)
            .then(respuesta => {
                return respuesta || fetch(event.request);
            })
    );
});