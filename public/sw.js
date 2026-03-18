self.addEventListener('push', (event) => {
  let payload = {
    title: 'Task reminder',
    body: 'You have a due task.',
    url: '/todo',
    tag: 'todo-reminder',
  };

  if (event.data) {
    try {
      payload = { ...payload, ...event.data.json() };
    } catch {
      payload.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/images/favicon/favicon.png',
      badge: '/images/favicon/favicon.png',
      tag: payload.tag,
      data: {
        url: payload.url || '/todo',
      },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      const targetUrl = event.notification.data?.url || '/todo';

      for (const client of windowClients) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }

      return undefined;
    }),
  );
});
