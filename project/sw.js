// Installability-only service worker — no caching, no offline support.
// The app stays "still connected to the internet": every request is passed
// straight through to the network. This exists purely because some browsers
// (notably desktop/Android Chrome) require an active service worker with a
// fetch handler before they'll offer to install a page as an app.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
