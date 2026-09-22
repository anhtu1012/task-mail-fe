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

const title = "Task";
const description = "Task";
const { metadata } = siteMetadata({ title, description });
export { metadata };

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
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
