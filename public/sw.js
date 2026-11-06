// Service worker tối giản: để cài game ra màn hình chính và hiện thông báo (kể cả trên Android).
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
// Luôn lấy bản mới từ mạng (game cần online để đồng bộ với người ấy)
self.addEventListener('fetch', () => {});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    const open = list.find(c => 'focus' in c);
    return open ? open.focus() : self.clients.openWindow(self.registration.scope);
  }));
});
