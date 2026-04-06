/**
 * ADVIST Service Worker
 * Enables offline functionality with caching and background sync
 */

const CACHE_NAME = 'advist-cache-v1';
const DYNAMIC_CACHE = 'advist-dynamic-v1';
const API_CACHE = 'advist-api-v1';

// Resources to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  // Add main JS/CSS bundles (will be injected by build process)
];

// API routes to cache
const CACHEABLE_API_ROUTES = [
  '/api/documents/',
  '/api/workflow-templates/',
  '/api/users/me/',
  '/api/organizations/',
  '/api/notifications/',
];

// API routes that should be synced when back online
const SYNCABLE_API_ROUTES = [
  '/api/documents/',
  '/api/workflow-instances/',
  '/api/notifications/',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );

  // Activate immediately
  self.skipWaiting();
});

// Activate event - clean old caches and stale assets
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');

  event.waitUntil(
    Promise.all([
      // Delete old named caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              return (
                name.startsWith('advist-') &&
                name !== CACHE_NAME &&
                name !== DYNAMIC_CACHE &&
                name !== API_CACHE
              );
            })
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      }),
      // Purge stale JS/CSS assets from cache to avoid module mismatch errors
      caches.open(CACHE_NAME).then(async (cache) => {
        const keys = await cache.keys();
        const assetKeys = keys.filter((req) => /\/assets\/.*\.(js|css)$/.test(new URL(req.url).pathname));
        // Verify each cached asset still exists on the server
        return Promise.all(
          assetKeys.map(async (req) => {
            try {
              const res = await fetch(req, { method: 'HEAD' });
              if (!res.ok) {
                console.log('[SW] Purging stale asset:', req.url);
                await cache.delete(req);
              }
            } catch {
              // Offline — keep cached version
            }
          })
        );
      }),
    ]).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(event.request));
    return;
  }

  // Handle document/file requests
  if (url.pathname.startsWith('/documents/') || url.pathname.startsWith('/files/')) {
    event.respondWith(handleDocumentRequest(event.request));
    return;
  }

  // Handle navigation requests (HTML pages)
  if (event.request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(event.request));
    return;
  }

  // Handle static assets
  event.respondWith(handleStaticRequest(event.request));
});

// Handle API requests - network first, cache fallback
async function handleApiRequest(request) {
  const url = new URL(request.url);

  // Only cache GET requests
  if (request.method !== 'GET') {
    // For mutations, try network and queue if offline
    return handleMutationRequest(request);
  }

  try {
    // Try network first
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.ok && isCacheableApiRoute(url.pathname)) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Network failed, try cache
    console.log('[SW] Network failed, trying cache for:', url.pathname);

    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline response for API
    return new Response(
      JSON.stringify({
        error: 'offline',
        message: 'Vous êtes hors ligne. Les données affichées peuvent ne pas être à jour.',
        cached: false,
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Handle mutation requests (POST, PUT, DELETE)
async function handleMutationRequest(request) {
  try {
    return await fetch(request);
  } catch (error) {
    // Queue for background sync
    console.log('[SW] Mutation request failed, queueing for sync');

    // Store in IndexedDB for later sync
    await queueForSync(request);

    return new Response(
      JSON.stringify({
        queued: true,
        message: 'Votre action a été enregistrée et sera synchronisée dès que vous serez en ligne.',
      }),
      {
        status: 202,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Handle document/file requests - cache first
async function handleDocumentRequest(request) {
  // Try cache first for documents
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    // Fetch in background to update cache
    fetchAndCache(request, DYNAMIC_CACHE);
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return new Response('Document non disponible hors ligne', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}

// Handle navigation requests
async function handleNavigationRequest(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch (error) {
    // Return cached index.html for SPA
    const cachedResponse = await caches.match('/index.html');
    if (cachedResponse) {
      return cachedResponse;
    }

    // Fallback to offline page
    return caches.match('/offline.html');
  }
}

// Handle static assets
// Hashed assets (JS/CSS with content hash) use cache-first since the hash guarantees uniqueness
// Non-hashed assets use network-first to always get the latest version
async function handleStaticRequest(request) {
  const url = new URL(request.url);
  const isHashedAsset = /\/assets\/.*-[a-zA-Z0-9]{8,}\.(js|css)$/.test(url.pathname);

  if (isHashedAsset) {
    // Hashed assets: cache-first (hash in filename = immutable content)
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } catch (error) {
      console.log('[SW] Failed to fetch hashed asset:', request.url);
      return new Response('Ressource non disponible', { status: 503 });
    }
  }

  // Non-hashed assets: network-first
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    console.log('[SW] Failed to fetch:', request.url);
    return new Response('Ressource non disponible', { status: 503 });
  }
}

// Helper: Fetch and cache in background
function fetchAndCache(request, cacheName) {
  fetch(request)
    .then((response) => {
      if (response.ok) {
        caches.open(cacheName).then((cache) => {
          cache.put(request, response);
        });
      }
    })
    .catch(() => {});
}

// Helper: Check if API route is cacheable
function isCacheableApiRoute(pathname) {
  return CACHEABLE_API_ROUTES.some((route) => pathname.startsWith(route));
}

// Background Sync
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync event:', event.tag);

  if (event.tag === 'advist-sync') {
    event.waitUntil(syncPendingRequests());
  }
});

// Sync pending requests from queue
async function syncPendingRequests() {
  const db = await openSyncDB();
  const tx = db.transaction('pending-requests', 'readonly');
  const store = tx.objectStore('pending-requests');
  const requests = await store.getAll();

  console.log('[SW] Syncing', requests.length, 'pending requests');

  for (const item of requests) {
    try {
      const response = await fetch(item.url, {
        method: item.method,
        headers: item.headers,
        body: item.body,
      });

      if (response.ok) {
        // Remove from queue
        const deleteTx = db.transaction('pending-requests', 'readwrite');
        await deleteTx.objectStore('pending-requests').delete(item.id);
        console.log('[SW] Synced request:', item.url);
      }
    } catch (error) {
      console.log('[SW] Failed to sync request:', item.url);
    }
  }

  // Notify clients
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({
      type: 'SYNC_COMPLETE',
      pending: requests.length,
    });
  });
}

// Queue request for background sync
async function queueForSync(request) {
  const db = await openSyncDB();
  const tx = db.transaction('pending-requests', 'readwrite');
  const store = tx.objectStore('pending-requests');

  const item = {
    id: Date.now(),
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body: await request.clone().text(),
    timestamp: new Date().toISOString(),
  };

  await store.add(item);

  // Register for background sync
  if ('sync' in self.registration) {
    await self.registration.sync.register('advist-sync');
  }
}

// IndexedDB for sync queue
function openSyncDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('advist-sync-db', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains('pending-requests')) {
        db.createObjectStore('pending-requests', { keyPath: 'id' });
      }
    };
  });
}

// Push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');

  const data = event.data ? event.data.json() : {};

  const options = {
    body: data.body || 'Nouvelle notification ADVIST',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: data,
    actions: data.actions || [
      { action: 'view', title: 'Voir' },
      { action: 'dismiss', title: 'Ignorer' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'ADVIST', options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click:', event.action);

  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      // Focus existing window if available
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }

      // Open new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

// Message handling from main app
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);

  switch (event.data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'CACHE_DOCUMENT':
      // Pre-cache a specific document for offline use
      cacheDocument(event.data.url);
      break;

    case 'CLEAR_CACHE':
      clearAllCaches();
      break;

    case 'GET_PENDING_COUNT':
      getPendingRequestCount().then((count) => {
        event.ports[0].postMessage({ count });
      });
      break;
  }
});

// Cache a document for offline use
async function cacheDocument(url) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    const response = await fetch(url);
    if (response.ok) {
      await cache.put(url, response);
      console.log('[SW] Document cached:', url);
    }
  } catch (error) {
    console.error('[SW] Failed to cache document:', error);
  }
}

// Clear all caches
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames
      .filter((name) => name.startsWith('advist-'))
      .map((name) => caches.delete(name))
  );
  console.log('[SW] All caches cleared');
}

// Get pending request count
async function getPendingRequestCount() {
  try {
    const db = await openSyncDB();
    const tx = db.transaction('pending-requests', 'readonly');
    const store = tx.objectStore('pending-requests');
    const count = await store.count();
    return count;
  } catch {
    return 0;
  }
}
