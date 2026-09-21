// Gole Khaja Ghar Service Worker
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { title: '🍲 Gole Khaja Ghar', body: event.data.text() };
    }
  }

  const title = data.title || '🍲 Gole Khaja Ghar Update';
  const body =
    data.body ||
    data.message ||
    'You have an update regarding your order at Gole Khaja Ghar.';
  const targetUrl =
    data.url ||
    (data.orderNumber ? `/order/${data.orderNumber}` : data.linkUrl || '/');

  const options = {
    body,
    icon: data.icon || '/favicon-circle.png',
    badge: data.badge || '/favicon-circle.png',
    image: data.image || undefined,
    data: {
      url: targetUrl,
      orderId: data.orderId,
      orderNumber: data.orderNumber,
      timestamp: Date.now(),
    },
    vibrate: [300, 100, 300, 100, 400],
    tag: data.tag || `gkg-${data.orderNumber || Date.now()}`,
    renotify: true,
    requireInteraction: true,
    silent: false,
    actions: [
      {
        action: 'open',
        title: '👉 View Order',
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(title, options).catch((err) => {
      console.warn('[SW] showNotification with actions failed, trying fallback:', err);
      return self.registration.showNotification(title, {
        body,
        icon: '/favicon-circle.png',
        badge: '/favicon-circle.png',
        vibrate: [300, 100, 300],
        tag: `gkg-${Date.now()}`,
        data: { url: targetUrl },
      });
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          if ('navigate' in client) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
