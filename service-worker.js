const CACHE_NAME = "gestor-cobros-v3";

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
        fetch(event.request)
            .then(respuesta => {
                if (event.request.method === "GET" && respuesta.ok) {
                    const copia = respuesta.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, copia);
                    });
                }

                return respuesta;
            })
            .catch(() => caches.match(event.request))
    );
});