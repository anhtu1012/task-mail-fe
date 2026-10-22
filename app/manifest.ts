import type { MetadataRoute } from "next";

/**
 * Web App Manifest — thứ khiến trình duyệt cho phép "Cài đặt ứng dụng" /
 * "Thêm vào màn hình chính". Next tự phục vụ ở /manifest.webmanifest và tự
 * chèn <link rel="manifest"> vào <head>.
 *
 * Mở từ biểu tượng trên màn hình chính thì vào thẳng tab "Hôm nay" — màn hay
 * dùng nhất trên điện thoại. Chưa đăng nhập thì layout tự đẩy về /login.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "TaskBox — Quản lý công việc",
    short_name: "TaskBox",
    description: "Biến email thành công việc, nhắc hạn tự động qua Zalo.",
    lang: "vi",
    start_url: "/today",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    // Cùng màu thanh điều hướng — màn chờ lúc mở app không bị chớp trắng
    background_color: "#0a2c47",
    theme_color: "#0a2c47",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Hôm nay", url: "/today", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Ghi chú", url: "/notes", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
