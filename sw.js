const CACHE_NAME = 'finance-hub-cache-v3';
const urlsToCache = [
  '/',
  '/index.html',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
  'https://aistudiocdn.com/react@19.1.1',
  'https://aistudiocdn.com/react-dom@19.1.1/client',
  'https://aistudiocdn.com/@google/genai@1.17.0',
  'https://aistudiocdn.com/@supabase/supabase-js@2.58.0'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  // We only want to cache GET requests.
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Handle share target fetch
  if (event.request.url.includes('?shared_text=')) {
    event.respondWith(Response.redirect('/'));
    event.waitUntil(async function() {
      const client = await self.clients.get(event.clientId);
      const url = new URL(event.request.url);
      const sharedText = url.searchParams.get('shared_text');
      if (client) {
        client.postMessage({ type: 'shared-text', text: sharedText });
      }
    }());
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        return fetch(event.request).then(
          response => {
            // Check if we received a valid response
            if(!response || response.status !== 200 || response.type !== 'basic' && response.type !== 'cors') {
              return response;
            }

            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
    );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();

  const action = event.action;
  const billId = event.notification.data?.billId;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      const openClient = clientList.find(client => client.url === self.location.origin + '/' && 'focus' in client);

      if (action === 'mark_as_paid' && billId) {
        if (openClient) {
            openClient.postMessage({ action: 'mark_as_paid', id: billId });
            return openClient.focus();
        } else if (clients.openWindow) {
            return clients.openWindow('/').then(client => {
                // Wait a bit for the client to be ready to receive messages
                setTimeout(() => {
                    client.postMessage({ action: 'mark_as_paid', id: billId });
                }, 1000);
            });
        }
      } else {
        if (openClient) {
            return openClient.focus();
        } else if (clients.openWindow) {
            return clients.openWindow('/');
        }
      }
    })
  );
});