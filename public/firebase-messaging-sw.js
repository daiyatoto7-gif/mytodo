// Firebase Messaging Service Worker
// Used in development (when next-pwa is disabled) and as FCM fallback.
// In production, next-pwa's sw.js (with worker/index.js merged) is used instead.

self.addEventListener('push', (event) => {
  if (!event.data) return

  let data
  try {
    data = event.data.json()
  } catch {
    data = { notification: { title: 'タスクリマインダー', body: event.data.text() } }
  }

  const title = data.notification?.title ?? 'タスクリマインダー'
  const options = {
    body: data.notification?.body ?? '',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    data: {
      url: data.fcmOptions?.link ?? data.data?.url ?? '/',
    },
    tag: data.data?.taskId ?? 'reminder',
    renotify: true,
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/'

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) {
            client.navigate(url)
            return client.focus()
          }
        }
        return clients.openWindow(url)
      })
  )
})
