const CACHE_NAME = 'hivezone-v1';

// App shell routes to cache on install (Commonly visited standalone pages)
const APP_SHELL = [
    '/',
    '/dashboard',
    '/dashboard/chat',
    '/dashboard/search',
    '/dashboard/notifications',
    '/dashboard/profile',
    '/dashboard/settings',
];

// ─── Install: cache app shell resiliently ──────────────────────────────────
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            console.log('📦 Service Worker: Pre-caching App Shell');
            for (const url of APP_SHELL) {
                try {
                    await cache.add(url);
                } catch (err) {
                    console.warn(`⚠️ SW: Failed to cache ${url}. Skipping.`);
                }
            }
        })
    );
    self.skipWaiting();
});

// ─── Activate: clean old caches ─────────────────────────────────────────────
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// ─── Fetch strategy: Stale-While-Revalidate (SWR) ──────────────────────────
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // 1. Skip non-GET and browser-extension requests
    if (request.method !== 'GET') return;
    if (!url.protocol.startsWith('http')) return;

    // 2. Network-only: Supabase, OneSignal, API routes, analytics
    const networkOnly = [
        'supabase.co',
        'onesignal.com',
        '/api/',
        'vercel-insights',
        'vercel-analytics',
    ];
    if (networkOnly.some(p => url.href.includes(p))) return;

    // 3. Strategy: Stale-While-Revalidate (The Speed King)
    // We serve the cached version in 0ms, and update the cache in the background.
    event.respondWith(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.match(request).then((cachedResponse) => {
                const fetchPromise = fetch(request).then((networkResponse) => {
                    if (networkResponse.ok) {
                        cache.put(request, networkResponse.clone());
                    }
                    return networkResponse;
                }).catch(() => {
                    // Fail silently in background if offline
                });

                // Return cached version immediately if available, else wait for network
                return cachedResponse || fetchPromise;
            });
        })
    );
});
