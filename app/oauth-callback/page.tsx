"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Spin, Typography } from "antd";
import { authApi } from "@/apis/auth.api";

/**
 * Trang trung gian nhận accessToken từ Google OAuth:
 * BE redirect về ${FRONTEND_URL}/oauth-callback?accessToken=<jwt>&expiresIn=<s>
 */
function OAuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const accessToken = searchParams.get("accessToken");
    if (accessToken) {
      authApi.persistToken(accessToken);
      router.replace("/select-project");
    } else {
      router.replace("/login");
    }
  }, [router, searchParams]);

  return (
    <div className="app-themed-bg min-h-screen grid place-items-center">
      <div className="flex flex-col items-center gap-4">
        <Spin size="large" />
        <Typography.Text type="secondary">
          Đang hoàn tất đăng nhập Google...
        </Typography.Text>
      </div>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={null}>
      <OAuthCallbackInner />
    </Suspense>
  );
}
