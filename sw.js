/* ==========================================================================
   MR. LOLO — Service Worker
   --------------------------------------------------------------------------
   Hace que la tienda abra al instante en la segunda visita y funcione sin
   conexión.

   Estrategia (prioriza que los precios siempre estén al día):

     · Navegación, HTML, JS, CSS y manifest
                   → red primero, caché como respaldo. Si cambiás un precio
                     y volvés a subir el archivo, se ve al instante.
     · Imágenes    → caché primero, y se refrescan en segundo plano
                     (pesan más y casi nunca cambian).

   Las rutas son relativas: funciona igual en la raíz del dominio o dentro
   de una subcarpeta (por ejemplo, GitHub Pages: /mr-lolo/).

   Al reemplazar archivos, subí el número de VERSION para que los navegadores
   que ya visitaron la tienda descarten la caché anterior.
   ========================================================================== */

const VERSION = 'mrlolo-v3';
const CACHE = `${VERSION}-estaticos`;

const BASE = new URL('./', self.location);
const url = (ruta) => new URL(ruta, BASE).toString();

/* Solo lo mínimo para abrir la tienda sin conexión. */
const ESENCIALES = [
  url('./'),
  url('index.html'),
  url('manifest.webmanifest'),
  url('assets/css/app.css'),
  url('assets/js/app.js'),
  url('assets/js/data.js'),
  url('assets/js/qr.js'),
  url('assets/js/tetris.js'),
  url('assets/img/logo.svg'),
  url('assets/img/icono-192.png'),
  url('assets/img/alfajor-havanna.webp'),
  url('assets/img/mogul-gomitas.webp'),
  url('assets/img/lays-clasicas.webp'),
  url('assets/img/coca-cola-lata.webp'),
  url('assets/img/oreo-pack.webp'),
  url('assets/img/beldent.webp'),
];

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        // addAll falla entero si un solo archivo falla: los agregamos de a uno.
        Promise.all(
          ESENCIALES.map((u) => cache.add(u).catch(() => null))
        )
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((claves) => Promise.all(claves.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (evento) => {
  const { request } = evento;
  if (request.method !== 'GET') return;

  const destino = new URL(request.url);
  if (destino.origin !== self.location.origin) return;

  const guardarEnCache = (peticion, respuesta) => {
    if (respuesta && respuesta.status === 200 && respuesta.type === 'basic') {
      const copia = respuesta.clone();
      caches.open(CACHE).then((cache) => cache.put(peticion, copia)).catch(() => null);
    }
  };

  // Todo lo que define el contenido (HTML, JS, CSS, manifest): red primero.
  if (request.mode === 'navigate' || esDelArmazon(destino.pathname)) {
    evento.respondWith(
      fetch(request)
        .then((respuesta) => {
          guardarEnCache(request, respuesta);
          return respuesta;
        })
        .catch(() =>
          caches.match(request).then((r) => r || (request.mode === 'navigate' ? caches.match(url('index.html')) : undefined))
        )
    );
    return;
  }

  // Imágenes: caché primero con refresco en segundo plano.
  evento.respondWith(
    caches.match(request).then((enCache) => {
      const red = fetch(request)
        .then((respuesta) => {
          guardarEnCache(request, respuesta);
          return respuesta;
        })
        .catch(() => enCache);
      return enCache || red;
    })
  );
});

function esDelArmazon(ruta) {
  return /\.(?:js|mjs|css|webmanifest|html)$/i.test(ruta) || ruta.endsWith('/');
}
