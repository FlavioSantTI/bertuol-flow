// ========================================================
// Bertuol Odontologia • Service Worker Web Push Handler
// Versão: 1.2.0
// Recebe Notificações Push nativas com o app fechado
// ========================================================

const SW_VERSION = '1.2.0';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', function (event) {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Bertuol Odontologia', body: event.data.text() };
    }
  }

  const title = data.title || 'Bertuol Odontologia';
  const options = {
    body: data.body || 'Você recebeu um novo aviso da clínica Bertuol.',
    icon: data.icon || '/pwa-192x192.png',
    badge: data.badge || '/icon.svg',
    image: data.image || undefined,
    data: data.data || { url: '/paciente' },
    vibrate: [200, 100, 200, 100, 200],
    tag: data.tag || 'bertuol-notification',
    renotify: true,
    requireInteraction: true,
    actions: data.actions || [
      { action: 'open', title: 'Ver no App' },
      { action: 'close', title: 'Fechar' }
    ]
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const targetUrl = (event.notification.data && event.notification.data.url) || '/paciente';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
