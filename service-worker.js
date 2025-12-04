// Service Worker for PWA offline support
const CACHE_NAME = 'survey-pwa-v1';
const urlsToCache = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './db.js',
    './sync.js',
    './config.js',
    './species.json',
    './manifest.json',
    './icons/icon-192.png',
    './icons/icon-512.png',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
    'https://unpkg.com/dexie@3.2.4/dist/dexie.min.js'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Caching app shell');
                return cache.addAll(urlsToCache);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    const { request } = event;

    // Skip cross-origin requests
    if (!request.url.startsWith(self.location.origin)) {
        // For external resources, try network first, then cache
        event.respondWith(
            fetch(request)
                .catch(() => caches.match(request))
        );
        return;
    }

    // For API calls (Google Sheets), always use network
    if (request.url.includes('script.google.com') || request.url.includes('googleapis.com')) {
        event.respondWith(
            fetch(request).catch(() => {
                return new Response(JSON.stringify({ error: 'Offline' }), {
                    headers: { 'Content-Type': 'application/json' }
                });
            })
        );
        return;
    }

    // Cache-first strategy for app resources
    event.respondWith(
        caches.match(request)
            .then((response) => {
                if (response) {
                    return response;
                }

                return fetch(request).then((response) => {
                    // Don't cache if not a success response
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // Clone the response
                    const responseToCache = response.clone();

                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, responseToCache);
                    });

                    return response;
                });
            })
            .catch(() => {
                // Return offline page for navigation requests
                if (request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
            })
    );
});

// Background Sync event
self.addEventListener('sync', (event) => {
    console.log('Background sync event:', event.tag);

    if (event.tag === 'sync-surveys') {
        event.waitUntil(syncSurveys());
    }
});

// Sync function for background sync
async function syncSurveys() {
    try {
        console.log('Background sync: syncing surveys...');

        // Send message to all clients to trigger sync
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({
                type: 'BACKGROUND_SYNC',
                action: 'sync-surveys'
            });
        });

        return Promise.resolve();
    } catch (error) {
        console.error('Background sync failed:', error);
        return Promise.reject(error);
    }
}

// Listen for messages from the app
self.addEventListener('message', (event) => {
    console.log('Service Worker received message:', event.data);

    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
