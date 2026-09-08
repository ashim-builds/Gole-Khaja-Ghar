// Gole Khaja Ghar - High-Priority Push Notification Service Worker Extension
// Ensures rich mobile app-like push notifications with loud vibration and direct action buttons.

self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    let data;
    try {
      data = event.data.json();
    } catch {
      data = { title: 'Gole Khaja Ghar', body: event.data.text() };
    }

    const title = data.title || '🍲 Gole Khaja Ghar Update';
    const body =
      data.body ||
      data.message ||
      'You have an update regarding your order at Gole Khaja Ghar.';
    const targetUrl =
      data.url ||
      (data.orderNumber ? `/orders/${data.orderNumber}` : data.linkUrl || '/');

    const options = {
      body,
      icon: data.icon || '/favicon-circle.png',
      badge: '/favicon-circle.png',
      image: data.image || undefined,
      data: {
        url: targetUrl,
        orderId: data.orderId,
        orderNumber: data.orderNumber,
        timestamp: Date.now(),
      },
      // Distinct mobile phone vibration pattern: Buzz - pause - Buzz - pause - Long Buzz
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

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.error('[SW-Push] Failed to show push notification:', err);
    event.waitUntil(
      self.registration.showNotification('🍲 Gole Khaja Ghar', {
        body: event.data ? event.data.text() : 'New order update received.',
        icon: '/favicon-circle.png',
        badge: '/favicon-circle.png',
        vibrate: [300, 100, 300],
      })
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing open tab if already at the domain
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          if ('navigate' in client) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Auto-resubscribe when subscription changes/expires
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    self.registration.pushManager
      .subscribe({ userVisibleOnly: true })
      .then((newSubscription) => {
        return fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscription: newSubscription.toJSON(),
            type: 'admin',
          }),
        });
      })
      .catch((err) => console.error('[SW-Push] Auto-resubscribe failed:', err))
  );
});
