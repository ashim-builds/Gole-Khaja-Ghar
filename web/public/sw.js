// Gole Khaja Ghar Service Worker
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || 'Gole Khaja Ghar';
    const options = {
      body: data.body || data.message || 'You have an update regarding your order.',
      icon: data.icon || '/favicon-circle.png',
      badge: '/favicon-circle.png',
      data: {
        url: data.url || (data.orderNumber ? `/orders/${data.orderNumber}` : '/'),
      },
      vibrate: [200, 100, 200],
      tag: data.tag || 'gole-notification',
      renotify: true,
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    const text = event.data.text();
    event.waitUntil(
      self.registration.showNotification('Gole Khaja Ghar', {
        body: text,
        icon: '/favicon-circle.png',
        badge: '/favicon-circle.png',
      })
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
