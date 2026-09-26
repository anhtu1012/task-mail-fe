"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { App, Button, Divider, Form, Input, Spin, Typography } from "antd";
import { CSegmented } from "@/components/ui";
import {
  CheckCircle2,
  Inbox,
  LockKeyhole,
  Mail,
  MailCheck,
  Send,
} from "lucide-react";
import { authApi, Credentials } from "@/apis/auth.api";
import { getApiErrorCode, getApiErrorMessage } from "@/utils/client/apiError";

type Mode = "login" | "register";

const FEATURES = [
  { icon: CheckCircle2, text: "Quản lý công việc, deadline & hiệu suất" },
  { icon: MailCheck, text: "Tự tạo task từ email Gmail có tiêu đề [TASK]" },
  { icon: Send, text: "Nhắc deadline tự động qua Zalo Bot" },
];

export default function LoginPage() {
  const router = useRouter();
  const { message } = App.useApp();
  const [mode, setMode] = useState<Mode>("login");
  const [submitting, setSubmitting] = useState(false);
  const [googleOnly, setGoogleOnly] = useState(false);
  // Đang thử khôi phục phiên bằng refresh_token trước khi hiện form
  const [restoring, setRestoring] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // Chỉ nhận đường dẫn nội bộ để tránh open-redirect qua ?from=
    const from = new URLSearchParams(window.location.search).get("from");
    const target =
      from && from.startsWith("/") && !from.startsWith("//")
        ? from
        : "/select-project";

    authApi.restoreSession().then((ok) => {
      if (cancelled) return;
      if (ok) router.replace(target);
      else setRestoring(false);
    });
    return () => {
      cancelled = true;
    };
  }, [router]);

  const onSubmit = async (values: Credentials) => {
    setSubmitting(true);
    setGoogleOnly(false);
    try {
      if (mode === "login") {
        await authApi.login(values);
        message.success("Đăng nhập thành công");
      } else {
        await authApi.register(values);
        message.success("Đăng ký thành công, chào mừng bạn!");
      }
      // Vào chọn dự án chứ không vào thẳng tổng quan: mọi truy vấn phía trong
      // đều cần projectId. Nếu đã có dự án mặc định, trang đó tự đi tiếp.
      router.replace("/select-project");
    } catch (error) {
      if (getApiErrorCode(error) === "AUTH_GOOGLE_ACCOUNT_ONLY") {
        setGoogleOnly(true);
      }
      message.error(getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  if (restoring) {
    return (
      <div className="app-themed-bg min-h-screen grid place-items-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="app-themed-bg min-h-screen flex">
      {/* Brand panel */}
      <div className="hidden lg:flex flex-col justify-between w-[44%] p-12 text-white bg-[linear-gradient(160deg,#0a436d_0%,#0d5a8f_55%,#0ea5e9_130%)]">
        <div className="flex items-center gap-3">
          <span className="grid place-items-center size-11 rounded-xl bg-white/15 backdrop-blur">
            <Inbox size={24} />
          </span>
          <span className="text-2xl font-bold tracking-tight">TaskBox</span>
        </div>

        <div>
          <h1 className="text-4xl font-extrabold leading-tight mb-4">
            Làm chủ công việc,
            <br />
            không bỏ lỡ deadline.
          </h1>
          <p className="text-white/75 text-base mb-10 max-w-md">
            Nền tảng quản lý công việc thông minh: theo dõi tiến độ, thống kê
            hiệu suất và kết nối Gmail, Zalo trong một nơi duy nhất.
          </p>
          <ul className="space-y-4">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-white/90">
                <span className="grid place-items-center size-8 rounded-lg bg-white/12">
                  <Icon size={17} />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-white/50 text-sm">
          © {new Date().getFullYear()} TaskBox — Quản lý công việc thông minh
        </p>
      </div>

      {/* Form panel */}
      <div className="flex-1 grid place-items-center p-6">
        <div className="w-full max-w-[420px] bg-white rounded-2xl border border-[#e2e8f0] shadow-[0_10px_40px_rgba(10,67,109,0.08)] p-8">
          <div className="mb-6 text-center">
            <Typography.Title level={3} style={{ marginBottom: 4 }}>
              {mode === "login" ? "Chào mừng trở lại 👋" : "Tạo tài khoản mới"}
            </Typography.Title>
            <Typography.Text type="secondary">
              {mode === "login"
                ? "Đăng nhập để tiếp tục quản lý công việc"
                : "Chỉ mất 30 giây để bắt đầu"}
            </Typography.Text>
          </div>

          <CSegmented
            block
            value={mode}
            onChange={(v) => setMode(v as Mode)}
            options={[
              { label: "Đăng nhập", value: "login" },
              { label: "Đăng ký", value: "register" },
            ]}
            style={{ marginBottom: 24 }}
          />

          {googleOnly && (
            <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
              Tài khoản này được tạo bằng Google. Hãy dùng nút{" "}
              <b>Đăng nhập với Google</b> bên dưới.
            </div>
          )}

          <Form<Credentials>
            layout="vertical"
            size="large"
            onFinish={onSubmit}
            requiredMark={false}
          >
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: "Vui lòng nhập email" },
                { type: "email", message: "Email không hợp lệ" },
              ]}
            >
              <Input
                prefix={<Mail size={16} className="text-slate-400" />}
                placeholder="ban@congty.com"
                autoComplete="email"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Mật khẩu"
              rules={[
                { required: true, message: "Vui lòng nhập mật khẩu" },
                { min: 8, message: "Mật khẩu tối thiểu 8 ký tự" },
              ]}
            >
              <Input.Password
                prefix={<LockKeyhole size={16} className="text-slate-400" />}
                placeholder="Tối thiểu 8 ký tự"
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
              />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              block
              loading={submitting}
              style={{ marginTop: 4, height: 44, fontWeight: 600 }}
            >
              {mode === "login" ? "Đăng nhập" : "Đăng ký"}
            </Button>
          </Form>

          <Divider plain style={{ margin: "20px 0" }}>
            <span className="text-slate-400 text-xs">HOẶC</span>
          </Divider>

          <Button
            block
            style={{ height: 44, fontWeight: 500 }}
            onClick={() => {
              window.location.href = authApi.googleLoginUrl();
            }}
            icon={
              // Google "G" logo
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
                />
              </svg>
            }
          >
            Đăng nhập với Google
          </Button>
        </div>
      </div>
    </div>
  );
}
