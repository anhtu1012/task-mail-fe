/**
 * Quản lý toàn bộ đường dẫn API của dự án (backend nestjs-auth-cms).
 * Backend KHÔNG có global prefix — gọi thẳng /auth/login, /tasks, ...
 */
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    REFRESH: "/auth/refresh-token",
    LOGOUT: "/auth/logout",
    ME: "/auth/me",
    GOOGLE: "/auth/google",
    GOOGLE_CALLBACK: "/auth/google/callback",
    // Backend chưa có 2 endpoint dưới — giữ key để interceptors không vỡ,
    // KHÔNG dựng UI cho tới khi backend bổ sung.
    FORGOT_PASSWORD: "/auth/forgot-password",
    RESET_PASSWORD: "/auth/reset-password",
  },
  TASKS: {
    ROOT: "/tasks",
    STATS: "/tasks/stats",
    DETAIL: (id: string) => `/tasks/${id}`,
    COMPLETE: (id: string) => `/tasks/${id}/complete`,
  },
  TASK_TYPES: {
    ROOT: "/task-types",
    DETAIL: (id: string) => `/task-types/${id}`,
  },
  MAIL_ACCOUNTS: {
    ROOT: "/mail-accounts",
    GOOGLE_CONNECT: "/mail-accounts/google/connect",
    DETAIL: (id: string) => `/mail-accounts/${id}`,
  },
  ZALO_ACCOUNTS: {
    LINK_CODE: "/zalo-accounts/link-code",
    ME: "/zalo-accounts/me",
  },
  ZALO_BOT: {
    STATUS: "/zalo-bot/status",
  },
};
