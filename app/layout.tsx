/* eslint-disable @typescript-eslint/ban-ts-comment */
import AppProvider from "@/contexts/Provider";
import {
  BACKGROUNDS,
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
} from "@/libs/theme/presets";
import siteMetadata from "@/libs/siteMetaData";
import "react-data-grid/lib/styles.css";
import "../styles/rdg-override.css";
import "../styles/globals.css";
import "../styles/_index.scss";

import { Be_Vietnam_Pro } from "next/font/google";
import BugReportButton from "@/components/global/BugReportButton/BugReportButton";
import PwaSetup from "@/components/global/InstallApp/PwaSetup";
import type { Viewport } from "next";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-be-vietnam-pro",
});

/**
 * Chạy đồng bộ ở <head>: đọc lựa chọn trong localStorage rồi ghi thẳng các
 * biến CSS quan trọng lên <html>. Chỉ đặt những biến quyết định hình ảnh đầu
 * tiên nhìn thấy — phần còn lại do ThemeProvider bổ sung ngay sau khi hydrate.
 */
const themeBootstrapScript = `(function(){try{
var KEY=${JSON.stringify(THEME_STORAGE_KEY)};
var DEF=${JSON.stringify(DEFAULT_THEME)};
var BG=${JSON.stringify(
  Object.fromEntries(
    BACKGROUNDS.map((b) => [
      b.id,
      { image: b.image, color: b.color, tone: b.tone },
    ]),
  ),
)};
var raw=localStorage.getItem(KEY);
var t=raw?Object.assign({},DEF,JSON.parse(raw)):DEF;
var bg=BG[t.background]||BG[DEF.background];
var w=function(a){return 'rgba(255,255,255,'+a+')'};
var p=Math.min(1,Math.max(0.5,Number(t.surfaceOpacity)||DEF.surfaceOpacity));
var c=Math.min(0.85,Math.max(0.1,p*0.55));
var r=document.documentElement;
r.style.setProperty('--app-bg-image',bg.image);
r.style.setProperty('--app-bg-color',bg.color);
r.style.setProperty('--surface',w(p));
r.style.setProperty('--surface-card',w(c));
r.style.setProperty('--surface-head',w(Math.min(0.9,c*1.3)));
r.style.setProperty('--surface-hover',w(Math.min(0.92,c*1.5)));
r.style.setProperty('--surface-blur',t.surfaceBlur+'px');
r.style.setProperty('--accent',t.accent);
r.dataset.tone=bg.tone;
}catch(e){}})();`;

const title = "TaskBox — Quản lý Công việc & Tự động hoá";
const description = "Nền tảng TaskBox: Biến email thành công việc, nhắc deadline tự động qua Zalo Bot.";
const { metadata: baseMetadata } = siteMetadata({ title, description });

export const metadata = {
  ...baseMetadata,
  applicationName: "TaskBox",
  // Google Search Console xác minh quyền sở hữu domain (bắt buộc cho OAuth
  // consent screen): dán mã từ thẻ <meta name="google-site-verification"> vào env
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION && {
    verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION },
  }),
  // iPhone: "Thêm vào MH chính" mở toàn màn hình như app, dùng icon riêng
  appleWebApp: {
    capable: true,
    title: "TaskBox",
    statusBarStyle: "black-translucent",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  // Màu thanh trạng thái / thanh địa chỉ trên điện thoại — cùng màu thanh điều hướng
  themeColor: "#0a2c47",
  width: "device-width",
  initialScale: 1,
  // Cho nội dung tràn dưới tai thỏ / thanh home của iPhone; thanh tab tự chừa
  // chỗ bằng env(safe-area-inset-bottom)
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const lang = "vi";

  return (
    <html
      lang={lang}
      suppressHydrationWarning={true}
      className={beVietnamPro.variable}
    >
      <head title="">
        <link rel="icon" href="/images" sizes="any" />
        {/* Áp giao diện đã lưu TRƯỚC khi React dựng cây, nếu không mở trang
            sẽ thấy nháy nền mặc định một nhịp rồi mới đổi */}
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
      </head>
      <body suppressHydrationWarning={true} className={beVietnamPro.className}>
        <AppProvider>
          {children}
          <BugReportButton />
          <PwaSetup />
        </AppProvider>
      </body>
    </html>
  );
}
