// public/sw.js

self.addEventListener("push", function (event) {
  const data = event.data.json();

  const options = {
    body: data.message || "Bạn có thông báo mới!",
    icon: "./images/avatar.png",
    badge: "./images/avatar.png",
    data: {
      url: data.url || "/",
    },
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "VolunteerHub", options)
  );
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});
