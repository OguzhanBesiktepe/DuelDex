// DuelDex Service Worker — handles Web Push notifications.
// Receives price alert pushes and shows them as native Android/desktop notifications.

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data?.json() ?? {};
  } catch {
    data = { title: "DuelDex Alert", body: event.data?.text() ?? "" };
  }

  const title = data.title ?? "DuelDex Price Alert";
  const options = {
    body: data.body ?? "",
    icon: data.icon ?? "/icon-192x192.png",
    badge: "/icon-192x192.png",
    data: { url: data.url ?? "/" },
    vibrate: [200, 100, 200],
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // If the app is already open, focus it and navigate
        for (const client of clientList) {
          if ("focus" in client) {
            client.focus();
            if ("navigate" in client) client.navigate(url);
            return;
          }
        }
        // Otherwise open a new window
        if (clients.openWindow) return clients.openWindow(url);
      })
  );
});
