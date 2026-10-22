/*
 * Service worker của TaskBox.
 *
 * Cố tình KHÔNG cache dữ liệu hay mã nguồn: việc, ghi chú đổi liên tục, phục
 * vụ bản cũ từ cache còn tệ hơn báo lỗi mạng — và cache tài nguyên của Next
 * rất dễ kẹt người dùng ở bản build cũ. Việc duy nhất nó làm: mất mạng mà mở
 * app thì hiện trang "Không có kết nối" thay cho màn khủng long của trình duyệt.
 *
 * Đổi nội dung offline.html thì tăng VERSION để thiết bị tải bản mới.
 */
const VERSION = "v1";
const CACHE = `taskbox-offline-${VERSION}`;
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll([OFFLINE_URL, "/icons/icon-192.png"]))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  // Chỉ can thiệp lúc mở trang; API, ảnh, JS... đi thẳng ra mạng như bình thường
  if (event.request.mode !== "navigate") return;
  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(OFFLINE_URL).then((res) => res || Response.error()),
    ),
  );
});
