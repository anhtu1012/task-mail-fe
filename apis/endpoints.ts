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
  // Dự án — không gian làm việc cá nhân.
  // Hợp đồng: docs/backend/project-api-spec.md.
  // Backend CHƯA triển khai: `projectApi` bắt 404/501 để lùi về dữ liệu mock
  // lưu dưới máy. Gỡ ghi chú này khi backend deploy xong.
  PROJECTS: {
    ROOT: "/projects",
    DETAIL: (id: string) => `/projects/${id}`,
    DEFAULT: (id: string) => `/projects/${id}/default`,
    ARCHIVE: (id: string) => `/projects/${id}/archive`,
  },
  TASKS: {
    ROOT: "/tasks",
    STATS: "/tasks/stats",
    DETAIL: (id: string) => `/tasks/${id}`,
    COMPLETE: (id: string) => `/tasks/${id}/complete`,
  },
  BOARD: {
    ME_FULL: "/boards/me/full",
    ME_TODAY: "/boards/me/today",
    ME_AGENDA: "/boards/me/agenda",
    ME_SEARCH: "/boards/me/search",
    ME_LABELS: "/boards/me/labels",
    INBOX_CARDS: "/boards/me/inbox/cards",
    INBOX_REBALANCE: "/boards/me/inbox/rebalance",
    DETAIL: (id: string) => `/boards/${id}`,
    LISTS: (id: string) => `/boards/${id}/lists`,
  },
  LISTS: {
    DETAIL: (id: string) => `/lists/${id}`,
    MOVE: (id: string) => `/lists/${id}/move`,
    REBALANCE: (id: string) => `/lists/${id}/rebalance`,
    CARDS: (id: string) => `/lists/${id}/cards`,
  },
  CARDS: {
    INBOX_CREATE: "/tasks/inbox/cards",
    MOVE: (id: string) => `/tasks/${id}/move`,
    SNOOZE: (id: string) => `/tasks/${id}/snooze`,
    DETAIL: (id: string) => `/tasks/${id}/detail`,
    REOPEN: (id: string) => `/tasks/${id}/reopen`,
    RESTORE: (id: string) => `/tasks/${id}/restore`,
    LABELS: (id: string) => `/tasks/${id}/labels`,
    CHECKLISTS: (id: string) => `/tasks/${id}/checklists`,
    NOTES: (id: string) => `/tasks/${id}/notes`,
    ATTACHMENTS: (id: string) => `/tasks/${id}/attachments`,
  },
  CHECKLISTS: {
    DETAIL: (id: string) => `/checklists/${id}`,
    ITEMS: (id: string) => `/checklists/${id}/items`,
  },
  CHECKLIST_ITEMS: {
    DETAIL: (id: string) => `/checklist-items/${id}`,
  },
  NOTES: {
    DETAIL: (id: string) => `/notes/${id}`,
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
  // Cài đặt của người dùng — backend đã deploy.
  // Hợp đồng: docs/backend/theme-settings-api.md
  PREFERENCES: {
    THEME: "/me/preferences/theme",
  },
};
