/* eslint-disable @typescript-eslint/ban-ts-comment */
import AppProvider from "@/contexts/Provider";
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

const title = "Task - Terminal Operating System";
const description = "Task - Terminal Operating System";
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
        <link rel="icon" href="/images/CEH-LOGO.png" sizes="any" />
      </head>
      <body suppressHydrationWarning={true} className={beVietnamPro.className}>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
