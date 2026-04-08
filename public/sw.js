const CACHE_NAME = 'hivezone-v1';

// App shell routes to cache on install
const APP_SHELL = [
    '/',
    '/dashboard',
    '/dashboard/chat',
    '/dashboard/feed',
    '/dashboard/gigs',
    '/dashboard/search',
    '/dashboard/notifications',
    '/dashboard/profile',
    '/dashboard/settings',
];

// ─── Install: cache app shell ───────────────────────────────────────────────
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
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

// ─── Fetch strategy ─────────────────────────────────────────────────────────
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

    // 3. Cache-first for static assets (_next/static, fonts, images, icons)
    if (
        url.pathname.startsWith('/_next/static') ||
        url.pathname.startsWith('/fonts') ||
        url.pathname.match(/\.(png|jpg|jpeg|svg|webp|ico|woff|woff2|otf|ttf)$/)
    ) {
        event.respondWith(
            caches.match(request).then(cached => {
                if (cached) return cached;
                return fetch(request).then(response => {
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
                    }
                    return response;
                });
            })
        );
        return;
    }

    // 4. Network-first for HTML navigation — fallback to cache when offline
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then(response => {
                    // Cache the fresh page
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
                    }
                    return response;
                })
                .catch(() => {
                    // Offline: serve cached version of this page, or fallback to /dashboard
                    return caches.match(request)
                        || caches.match('/dashboard')
                        || caches.match('/');
                })
        );
        return;
    }

    // 5. Network-first for everything else, cache as fallback
    event.respondWith(
        fetch(request)
            .then(response => {
                if (response.ok) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
                }
                return response;
            })
            .catch(() => caches.match(request))
    );
});
