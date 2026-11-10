// PWA صفحه اصلی حذف شد — این سرویس‌ورکر فقط کش قدیمی را پاک و خودش را حذف می‌کند.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.claim())
  );
});
