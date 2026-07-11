"use client";

import { Button, Result } from "antd";
import { useRouter } from "next/navigation";

export default function ForbiddenPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen grid place-items-center bg-[#f7f8fa]">
      <Result
        status="403"
        title="403 — Không có quyền truy cập"
        subTitle="Bạn không có quyền thực hiện thao tác này. Liên hệ quản trị viên nếu cần cấp quyền."
        extra={
          <Button type="primary" onClick={() => router.push("/dashboard")}>
            Về trang chính
          </Button>
        }
      />
    </div>
  );
}
