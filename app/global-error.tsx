"use client";

import { useEffect } from "react";
import { AlertOctagon, Home, RotateCcw } from "lucide-react";
import "@/styles/pages/global-error.scss";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Error:", error);
  }, [error]);

  return (
    <html lang="vi" className="global-error__html">
      <body className="global-error__body">
        <div className="global-error__container">
          <div className="global-error__card">
            <div className="global-error__badge">
              <AlertOctagon size={36} />
            </div>
            <h1 className="global-error__title">Đã xảy ra sự cố nghiêm trọng</h1>
            <p className="global-error__message">
              Hệ thống gặp sự cố ngoài dự kiến trong ứng dụng. Bạn có thể thử tải lại hoặc quay về trang chủ.
            </p>
            {error.digest && (
              <div className="global-error__digest">
                Mã lỗi: {error.digest}
              </div>
            )}
            <div className="global-error__actions">
              <button
                type="button"
                className="global-error__btn-primary"
                onClick={() => reset()}
              >
                <RotateCcw size={15} /> Thử lại
              </button>
              <button
                type="button"
                className="global-error__btn-secondary"
                onClick={() => {
                  window.location.href = "/";
                }}
              >
                <Home size={15} /> Về trang chủ
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
