"use client";

import { useEffect } from "react";
import { Button, Typography } from "antd";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import "@/styles/pages/error.scss";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error("App Error:", error);
  }, [error]);

  return (
    <div className="error__page">
      <div className="error__content">
        <div className="error__illustration">
          <AlertTriangle size={48} className="error__icon" />
        </div>
        <Typography.Title level={1} className="title">
          OOP!
        </Typography.Title>
        <Typography.Text className="title-des">
          Đã xảy ra sự cố
        </Typography.Text>
        <Typography.Paragraph className="des">
          Trang hiện tại đang gặp lỗi không xác định. Bạn có thể thử tải lại hoặc quay về trang chủ.
        </Typography.Paragraph>
        {error.digest && (
          <span className="digest-code">Mã lỗi: {error.digest}</span>
        )}
        <div className="error__actions">
          <Button
            type="primary"
            icon={<RotateCcw size={15} />}
            className="btn-refresh"
            onClick={() => reset()}
          >
            Làm mới trang
          </Button>
          <Button
            icon={<Home size={15} />}
            className="btn-home"
            onClick={() => router.push("/")}
          >
            Về trang chủ
          </Button>
        </div>
      </div>
    </div>
  );
}
