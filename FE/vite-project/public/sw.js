// public/sw.js

self.addEventListener("push", function (event) {
  console.log("[SW] Push event fired:", event);

  if (!event.data) {
    console.warn("[SW] Push event received with no data");
    return;
  }

  let payload;
  try {
    payload = event.data.json();
  } catch (e) {
    console.error("[SW] Cannot parse push data:", e);
    return;
  }

  console.log("[SW] Push payload:", payload);

  const title = payload.title || "VolunteerHub";
  const body =
    payload.body || payload.message || "Bạn có thông báo mới từ VolunteerHub.";

  const options = {
    body,
    icon: "/icons/icon-192x192.png",
    badge: "/icons/badge-72x72.png",
    data: {
      url: payload.url || "/notifications",
      ...(payload.data || {}),
    },
    actions: payload.actions || [
      { action: "view", title: "Xem" },
      { action: "dismiss", title: "Đóng" },
    ],
  };

  event.waitUntil(
    (async () => {
      await self.registration.showNotification(title, options);

      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      console.log(
        "[SW] Posting NEW_NOTIFICATION to clients:",
        allClients.length
      );

      for (const client of allClients) {
        client.postMessage({
          type: "NEW_NOTIFICATION",
          notification: payload,
        });
      }
    })()
  );
});
