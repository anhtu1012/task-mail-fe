"use client";

import { useEffect } from "react";
import { startInstallTracking } from "./installPrompt";

/**
 * Mount một lần trong root layout: đăng ký service worker (trang offline) và
 * bắt sự kiện cài ứng dụng càng sớm càng tốt. Không vẽ gì.
 */
export default function PwaSetup() {
  useEffect(() => {
    startInstallTracking();

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .catch(() => {
          // Không có service worker thì chỉ mất trang offline — app vẫn chạy
        });
    }
  }, []);

  return null;
}
