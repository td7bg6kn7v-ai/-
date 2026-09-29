const C = 'mushaf-v1';

self.addEventListener('install', e => {
  e.waitUntil(caches.open(C).then(c => c.addAll(['./', './index.html'])));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== C).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);
  const sameOrigin = u.origin === location.origin;
  const isFont = u.host === 'fonts.googleapis.com' || u.host === 'fonts.gstatic.com';
  // واجهة القرآن والصوت تمرّ مباشرة بدون تخزين هنا
  if (!sameOrigin && !isFont) return;

  if (req.mode === 'navigate') {
    // الصفحة: من الإنترنت أولًا، ومن الجهاز إذا لا يوجد اتصال
    e.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(C).then(c => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // باقي الملفات (الخطوط): من الجهاز أولًا
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      const copy = res.clone();
      caches.open(C).then(c => c.put(req, copy));
      return res;
    }))
  );
});
