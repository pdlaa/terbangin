const CACHE_VERSION = 'terbangin-v2';
const APP_SHELL = [
    '/',
    '/offline',
    '/customer/tickets',
    '/customer/flights',
    '/auth/login',
    '/auth/register',
];
const E_TICKET_CACHE = 'terbangin-eticket-pages';
const STATIC_CACHE = 'terbangin-static-v2';

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((k) => k !== CACHE_VERSION && k !== E_TICKET_CACHE && k !== STATIC_CACHE)
                    .map((k) => caches.delete(k))
            )
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    if (request.method !== 'GET') return;

    // API routes: network only (E-Ticket data handled via IndexedDB on client)
    if (url.pathname.startsWith('/api/')) return;

    // Static assets: cache first
    if (
        url.pathname.startsWith('/icons/') ||
        url.pathname.startsWith('/_next/static/') ||
        url.pathname.endsWith('.css') ||
        url.pathname.endsWith('.js') ||
        url.pathname.endsWith('.svg') ||
        url.pathname.endsWith('.woff2')
    ) {
        event.respondWith(
            caches.match(request).then((cached) => {
                if (cached) return cached;
                return fetch(request).then((response) => {
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
                    }
                    return response;
                });
            })
        );
        return;
    }

    // E-Ticket pages: network first, cache on success, fallback to cache then offline
    if (url.pathname.startsWith('/customer/tickets/') || url.pathname.startsWith('/customer/payment/')) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(E_TICKET_CACHE).then((cache) => cache.put(request, clone));
                    }
                    return response;
                })
                .catch(() =>
                    caches.match(request).then((cached) => cached || caches.match('/offline'))
                )
        );
        return;
    }

    // Navigation (including customer pages): network first, fallback to cache, then offline page
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
                    }
                    return response;
                })
                .catch(() =>
                    caches.match(request).then((cached) => cached || caches.match('/offline'))
                )
        );
    }
});