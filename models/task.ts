/**
 * Types + hằng số hiển thị cho toàn bộ domain Task (khớp API nestjs-auth-cms).
 */

// ==========================================
// ENUMS (khớp Prisma schema backend)
// ==========================================
export enum Role {
  USER = "USER",
  ADMIN = "ADMIN",
  SUPER_ADMIN = "SUPER_ADMIN",
}

export enum TaskPriority {
  LOW = "LOW",
  NORMAL = "NORMAL",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

export enum TaskStatus {
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  DONE = "DONE",
  CANCELLED = "CANCELLED",
}

export enum TaskCategory {
  WORK = "WORK",
  PERSONAL = "PERSONAL",
}

export type DeadlineStatus = "IN_PROGRESS" | "ON_TIME" | "LATE";

// ==========================================
// AUTH
// ==========================================
export type AuthTokenResponse = {
  accessToken: string;
  expiresIn: number; // giây
};

export type MeResponse = {
  id: string;
  email: string;
  role: Role;
};

// Error shape cố định từ global exception filter của backend
export type ApiErrorBody = {
  statusCode: number;
  errorCode: string;
  message: string | string[];
  path: string;
  timestamp: string;
};

// ==========================================
// TASK
// ==========================================
export type Task = {
  id: string;
  code: string; // "TSK-000123"
  title: string;
  description?: string | null;
  note?: string | null;
  taskTypeId?: string | null;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  deadlineStatus: DeadlineStatus;
  assigneeId: string;
  creatorId?: string | null;
  assignedAt?: string | null;
  deadline?: string | null;
  completedAt?: string | null;
  attachments: string[];
  sourceMailAccountId?: string | null; // != null => task tự tạo từ email
  createdAt: string;
  updatedAt: string;
};

export type TaskListResponse = {
  items: Task[];
  total: number;
  page: number;
  limit: number;
};

export type TaskStats = {
  totalCompleted: number;
  completedInMonth: number;
  completionRate: number; // %
  performance: number; // % on-time all-time
  performanceMonth: number; // % on-time tháng này
};

export type QueryTaskParams = {
  page?: number;
  limit?: number;
  status?: TaskStatus;
  priority?: TaskPriority;
  category?: TaskCategory;
  taskTypeId?: string;
  sourceMailAccountId?: string;
  assigneeId?: string; // chỉ ADMIN/SUPER_ADMIN
  from?: string; // ISO — deadline >=
  to?: string; // ISO — deadline <=
};

export type CreateTaskInput = {
  title: string;
  description?: string;
  note?: string;
  taskTypeId?: string;
  category?: TaskCategory;
  priority?: TaskPriority;
  assigneeId?: string;
  assignedAt?: string;
  deadline?: string;
  attachments?: string[];
};

export type UpdateTaskInput = Partial<CreateTaskInput> & {
  status?: TaskStatus;
  completedAt?: string;
};

// ==========================================
// TASK TYPE
// ==========================================
export type TaskType = {
  id: string;
  name: string;
  color: string; // hex
  createdAt: string;
  updatedAt: string;
};

export type SaveTaskTypeInput = { name?: string; color?: string };

// ==========================================
// MAIL / ZALO
// ==========================================
export type MailAccount = {
  id: string;
  provider: "GOOGLE";
  email: string;
  createdAt: string;
};

export type ZaloLinkCode = {
  code: string;
  expiresAt: string;
  botProfileUrl: string;
};

export type ZaloLinkStatus = {
  linked: boolean;
  linkedAt?: string;
};

export type ZaloBotStatus = {
  connected: boolean;
  botName?: string;
};

// ==========================================
// META HIỂN THỊ (label tiếng Việt + màu antd)
// ==========================================
export const STATUS_META: Record<
  TaskStatus,
  { label: string; color: string }
> = {
  [TaskStatus.TODO]: { label: "Chờ xử lý", color: "default" },
  [TaskStatus.IN_PROGRESS]: { label: "Đang làm", color: "processing" },
  [TaskStatus.DONE]: { label: "Hoàn thành", color: "success" },
  [TaskStatus.CANCELLED]: { label: "Đã huỷ", color: "error" },
};

export const PRIORITY_META: Record<
  TaskPriority,
  { label: string; color: string; weight: number }
> = {
  [TaskPriority.LOW]: { label: "Thấp", color: "#94a3b8", weight: 0 },
  [TaskPriority.NORMAL]: { label: "Bình thường", color: "#0ea5e9", weight: 1 },
  [TaskPriority.HIGH]: { label: "Cao", color: "#f4a261", weight: 2 },
  [TaskPriority.URGENT]: { label: "Khẩn cấp", color: "#e63946", weight: 3 },
};

export const CATEGORY_META: Record<TaskCategory, { label: string; color: string }> =
  {
    [TaskCategory.WORK]: { label: "Công việc", color: "geekblue" },
    [TaskCategory.PERSONAL]: { label: "Cá nhân", color: "purple" },
  };

export const DEADLINE_META: Record<
  DeadlineStatus,
  { label: string; color: string }
> = {
  IN_PROGRESS: { label: "Trong hạn", color: "blue" },
  ON_TIME: { label: "Đúng hạn", color: "green" },
  LATE: { label: "Trễ hạn", color: "red" },
};

export const ROLE_META: Record<Role, { label: string; color: string }> = {
  [Role.USER]: { label: "Nhân viên", color: "default" },
  [Role.ADMIN]: { label: "Quản trị", color: "gold" },
  [Role.SUPER_ADMIN]: { label: "Quản trị cấp cao", color: "volcano" },
};

export const isAdminRole = (role?: Role | null): boolean =>
  role === Role.ADMIN || role === Role.SUPER_ADMIN;

/** Map errorCode backend -> thông điệp tiếng Việt thân thiện */
export const ERROR_CODE_MESSAGES: Record<string, string> = {
  AUTH_INVALID_CREDENTIALS: "Email hoặc mật khẩu không đúng.",
  AUTH_ACCOUNT_NOT_ACTIVE: "Tài khoản của bạn đã bị khoá. Liên hệ quản trị viên.",
  AUTH_GOOGLE_ACCOUNT_ONLY:
    "Tài khoản này đăng ký bằng Google — hãy dùng nút \"Đăng nhập với Google\".",
  AUTH_EMAIL_ALREADY_EXISTS: "Email này đã được đăng ký.",
  AUTH_INVALID_REFRESH_TOKEN: "Phiên đăng nhập hết hạn, vui lòng đăng nhập lại.",
  AUTH_REFRESH_TOKEN_REUSED: "Phiên đăng nhập không hợp lệ, vui lòng đăng nhập lại.",
  AUTH_USER_NOT_FOUND: "Không tìm thấy tài khoản.",
};
