// ═══════════════════════════════════════════════════════════════════════════════
// HiveZone Service Worker v2 — "Instant Media" Architecture
// ═══════════════════════════════════════════════════════════════════════════════
// Strategy:
//   - APP_SHELL:  Stale-While-Revalidate (fast navigation, background updates)
//   - IMAGES:     Cache-First with LRU eviction (instant media, 0ms re-scroll)
//   - API/AUTH:   Network-Only (never cache dynamic data)
// ═══════════════════════════════════════════════════════════════════════════════

const APP_CACHE = 'hivezone-app-v2';
const IMAGE_CACHE = 'hivezone-images-v1';
const IMAGE_CACHE_LIMIT = 500; // Max images to store before evicting oldest

// App shell routes to cache on install
const APP_SHELL = [
    '/',
    '/dashboard',
    '/dashboard/chat',
    '/dashboard/search',
    '/dashboard/notifications',
    '/dashboard/profile',
    '/dashboard/settings',
];

// Domains/paths that should NEVER be cached
const NETWORK_ONLY = [
    'supabase.co/rest',
    'supabase.co/auth',
    'supabase.co/realtime',
    'onesignal.com',
    '/api/',
    'vercel-insights',
    'vercel-analytics',
];

// Domains/paths that indicate an image asset
const IMAGE_ORIGINS = [
    'cdn.hivezone.co',
    'supabase.co/storage',
];

// File extensions treated as images
const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|gif|webp|avif|svg|bmp)(\?.*)?$/i;

// ─── Install: cache app shell ───────────────────────────────────────────────
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(APP_CACHE).then(async (cache) => {
            for (const url of APP_SHELL) {
                try {
                    await cache.add(url);
                } catch (err) {
                    console.warn(`[SW] Shell skip: ${url}`);
                }
            }
        })
    );
    self.skipWaiting();
});

// ─── Activate: clean old caches ─────────────────────────────────────────────
self.addEventListener('activate', (event) => {
    const VALID_CACHES = [APP_CACHE, IMAGE_CACHE];
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys.filter(k => !VALID_CACHES.includes(k)).map(k => caches.delete(k))
            )
        )
    );
    self.clients.claim();
});

// ─── Helper: Is this request for an image? ──────────────────────────────────
function isImageRequest(url) {
    // Check by origin
    if (IMAGE_ORIGINS.some(origin => url.href.includes(origin))) {
        // But exclude videos
        if (url.href.match(/\.(mp4|webm|ogg|mov|m4v|3gp|mkv)(\?.*)?$/i)) return false;
        return true;
    }
    // Check by extension
    if (url.href.match(IMAGE_EXTENSIONS)) return true;
    return false;
}

// ─── Helper: Enforce LRU cache size limit ───────────────────────────────────
async function trimCache(cacheName, maxItems) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length > maxItems) {
        // Delete oldest entries (FIFO order)
        const toDelete = keys.slice(0, keys.length - maxItems);
        await Promise.all(toDelete.map(key => cache.delete(key)));
    }
}

// ─── Fetch handler ──────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET and non-HTTP
    if (request.method !== 'GET') return;
    if (!url.protocol.startsWith('http')) return;

    // ── Network-Only: API, Auth, Analytics ──
    if (NETWORK_ONLY.some(p => url.href.includes(p))) return;

    // ── Cache-First: Images ──
    // This is the Instagram-grade strategy. Once an image is cached,
    // it's served in <5ms from disk. No network touch. No white flash.
    if (isImageRequest(url)) {
        event.respondWith(
            caches.open(IMAGE_CACHE).then(async (cache) => {
                const cached = await cache.match(request);
                if (cached) return cached;

                // Not cached yet — fetch from network, cache it, return it
                try {
                    const networkResponse = await fetch(request);
                    if (networkResponse.ok) {
                        // Clone before consuming the body
                        cache.put(request, networkResponse.clone());
                        // Evict old images in the background (non-blocking)
                        trimCache(IMAGE_CACHE, IMAGE_CACHE_LIMIT);
                    }
                    return networkResponse;
                } catch (err) {
                    // Offline and not cached — return a transparent pixel
                    return new Response(
                        'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
                        { headers: { 'Content-Type': 'image/gif' } }
                    );
                }
            })
        );
        return;
    }

    // ── Stale-While-Revalidate: Everything else (pages, JS, CSS) ──
    event.respondWith(
        caches.open(APP_CACHE).then((cache) => {
            return cache.match(request).then((cachedResponse) => {
                const fetchPromise = fetch(request).then((networkResponse) => {
                    if (networkResponse.ok) {
                        cache.put(request, networkResponse.clone());
                    }
                    return networkResponse;
                }).catch(() => {
                    // Offline fallback — do nothing, serve cache
                });

                return cachedResponse || fetchPromise;
            });
        })
    );
});
