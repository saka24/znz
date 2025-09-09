// SISI Chat Service Worker
const CACHE_NAME = 'sisi-chat-v1.0.0';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('SISI Chat Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching app shell...');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('SISI Chat cached successfully');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('SISI Chat Service Worker activating...');
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
    }).then(() => {
      console.log('SISI Chat Service Worker activated');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        
        return fetch(event.request).then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        });
      }
    )
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  let notificationData = {
    title: 'SISI Chat',
    body: 'You have a new notification',
    type: 'message'
  };
  
  if (event.data) {
    try {
      notificationData = event.data.json();
    } catch (e) {
      notificationData.body = event.data.text();
    }
  }
  
  const options = {
    body: notificationData.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      type: notificationData.type,
      ...notificationData.data
    },
    actions: getNotificationActions(notificationData.type),
    requireInteraction: notificationData.type === 'friend_request'
  };
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

function getNotificationActions(type) {
  switch (type) {
    case 'friend_request':
      return [
        {
          action: 'accept',
          title: 'Accept',
          icon: '/icons/icon-192x192.png'
        },
        {
          action: 'decline',
          title: 'Decline',
          icon: '/icons/icon-192x192.png'
        }
      ];
    case 'message':
      return [
        {
          action: 'reply',
          title: 'Reply',
          icon: '/icons/icon-192x192.png'
        },
        {
          action: 'view',
          title: 'View',
          icon: '/icons/icon-192x192.png'
        }
      ];
    default:
      return [
        {
          action: 'view',
          title: 'View',
          icon: '/icons/icon-192x192.png'
        }
      ];
  }
}

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  if (event.action === 'reply') {
    // Handle reply action
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'close') {
    // Handle close action
    event.notification.close();
  } else {
    // Handle notification click
    event.waitUntil(
      clients.matchAll().then((clientList) => {
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});

// Handle deep link navigation for QR codes
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'NAVIGATE_TO') {
    const url = event.data.url;
    event.waitUntil(
      clients.matchAll().then((clientList) => {
        if (clientList.length > 0) {
          // If app is already open, navigate to the URL
          clientList[0].navigate(url);
          return clientList[0].focus();
        } else {
          // If app is not open, open it with the URL
          return clients.openWindow(url);
        }
      })
    );
  }
});

// Background sync for offline message sending
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('Background sync triggered');
    event.waitUntil(
      // Sync offline messages when connection is restored
      syncOfflineMessages()
    );
  }
});

async function syncOfflineMessages() {
  // Implementation for syncing offline messages
  console.log('Syncing offline messages...');
  // This would sync with your backend when connection is restored
}