console.log("Service Worker loaded successfully!");

self.addEventListener("install", (event) => {
  console.log("Service Worker installed");
  self.skipWaiting(); // Activate immediately
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker activated");
  event.waitUntil(self.clients.claim()); // Take control immediately
});

self.addEventListener("push", function (event) {
  console.log("Push event received:", event);

  if (!event.data) {
    console.log("Push event but no data");
    return;
  }

  try {
    const data = event.data.json();
    console.log("Push data:", data);

    const options = {
      body: data.body || "You have a new notification",
      icon: data.icon || "/icons/icon-192x192.png",
      badge: data.badge || "/icons/badge-72x72.png",
      image: data.image,
      data: data.data || {},
      actions: data.actions || [
        {
          action: "view",
          title: "Xem",
        },
        {
          action: "dismiss",
          title: "Đóng",
        },
      ],
      vibrate: [200, 100, 200],
      tag: data.tag || "volunteerhub-notification",
    };

    event.waitUntil(
      self.registration.showNotification(data.title || "VolunteerHub", options)
    );
  } catch (error) {
    console.error("Error processing push:", error);

    // Fallback notification
    event.waitUntil(
      self.registration.showNotification("VolunteerHub", {
        body: "You have a new notification",
        icon: "/icons/icon-192x192.png",
      })
    );
  }
});

self.addEventListener("notificationclick", function (event) {
  console.log("Notification click:", event.notification);
  event.notification.close();

  if (event.action === "view") {
    const url = event.notification.data?.url || "/notifications";
    event.waitUntil(clients.openWindow(url));
  } else if (event.action === "dismiss") {
    // Do nothing, notification is already closed
  } else {
    // Default action when notification is clicked (not action buttons)
    const url = event.notification.data?.url || "/";
    event.waitUntil(clients.openWindow(url));
  }
});

self.addEventListener("pushsubscriptionchange", function (event) {
  console.log("Subscription changed:", event);
  event.waitUntil(
    self.registration.pushManager
      .subscribe({
        userVisibleOnly: true,
        applicationServerKey:
          event.oldSubscription.options.applicationServerKey,
      })
      .then(function (subscription) {
        console.log("New subscription:", subscription);
        return fetch("/api/push/subscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            subscription: subscription,
          }),
        });
      })
  );
});
