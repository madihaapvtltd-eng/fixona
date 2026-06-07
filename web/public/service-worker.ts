// Service Worker for Fixora PWA
// Handles push notifications when app is closed

/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

// Cache name
const CACHE_NAME = 'fixora-v1';

// Files to cache
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/storyset-illustrations/Maintenance-amico.svg',
  '/storyset-illustrations/Working-rafiki.svg',
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch from network
      return response || fetch(event.request);
    })
  );
});

// Push notification event - show notification when app is closed
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  
  const options: NotificationOptions = {
    body: data.message || 'New notification',
    icon: '/fixora-logo.png',
    badge: '/fixora-badge.png',
    tag: data.tag || 'default',
    requireInteraction: true,
    actions: [
      {
        action: 'open',
        title: 'Open App',
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
      },
    ],
    data: {
      url: data.url || '/',
      workOrderId: data.workOrderId,
      type: data.type,
    },
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Fixora Notification', options)
  );
});

// Notification click event - open app when notification is clicked
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const notificationData = event.notification.data;
  let url = notificationData?.url || '/';
  
  // If work order ID is provided, navigate to that work order
  if (notificationData?.workOrderId) {
    url = `/work-orders/${notificationData.workOrderId}`;
  }

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // If app is already open, focus it
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        // If app is not open, open new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      })
    );
  }
});

// Background sync for offline support
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-work-orders') {
    event.waitUntil(syncWorkOrders());
  }
});

async function syncWorkOrders() {
  // Try to sync pending updates when back online
  const pendingUpdates = await getPendingUpdates();
  
  for (const update of pendingUpdates) {
    try {
      // Attempt to sync each pending update
      console.log('Syncing update:', update);
    } catch (error) {
      console.error('Failed to sync update:', update, error);
    }
  }
}

async function getPendingUpdates(): Promise<any[]> {
  // Get pending updates from IndexedDB or localStorage
  return [];
}

// Periodic background sync for notifications (when supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-notifications') {
    event.waitUntil(checkNewNotifications());
  }
});

async function checkNewNotifications() {
  // Check for new notifications periodically
  // This requires the app to have periodic background sync permission
  console.log('Checking for new notifications...');
}

export {};
