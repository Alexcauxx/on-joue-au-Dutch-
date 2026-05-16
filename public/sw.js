/**
 * Service Worker — Dutch App
 *
 * Stratégie :
 * - Cache les fichiers statiques (HTML, JS, CSS, images)
 * - Réseau prioritaire pour les appels Supabase
 * - Affiche l'app même sans connexion (cache en fallback)
 */

const CACHE_NAME = 'dutch-app-v1'

// Fichiers à mettre en cache au démarrage
const PRECACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
]

// ── Installation : pré-cacher les fichiers essentiels ─────────
self.addEventListener('install', event => {
  console.log('[SW] Installation')
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  )
})

// ── Activation : nettoyer les anciens caches ──────────────────
self.addEventListener('activate', event => {
  console.log('[SW] Activation')
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME)
          .map(k => { console.log('[SW] Suppression ancien cache:', k); return caches.delete(k) })
      )
    ).then(() => self.clients.claim())
  )
})

// ── Fetch : stratégie selon le type de requête ────────────────
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Laisser passer les appels Supabase (toujours réseau)
  if (url.hostname.includes('supabase')) return

  // Laisser passer les requêtes non-GET
  if (request.method !== 'GET') return

  event.respondWith(
    caches.match(request).then(cached => {
      // Requête réseau en parallèle pour mettre à jour le cache
      const networkFetch = fetch(request)
        .then(response => {
          if (response.ok && response.type !== 'opaque') {
            const clone = response.clone()
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone))
          }
          return response
        })
        .catch(() => null)

      // Retourner le cache immédiatement si disponible, sinon attendre le réseau
      return cached || networkFetch
    })
  )
})
