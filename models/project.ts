/**
 * Types cho Dự án (Project).
 *
 * ĐỊNH HƯỚNG: dự án là KHÔNG GIAN LÀM VIỆC CÁ NHÂN — cách người dùng tự chia
 * nhóm công việc của chính mình ("Khách hàng A", "Việc nhà", "Học tập"). KHÔNG
 * có thành viên, không mời ai, không phân quyền. Điều này giữ đúng định hướng
 * "công cụ cá nhân" đã ghi ở đầu `models/board.ts` — đừng thêm `members` vào
 * đây mà không đổi cả hai chỗ.
 *
 * Hệ quả kiến trúc quan trọng: `projectId` là **lớp phân vùng dữ liệu**, không
 * phải một bộ lọc bình thường. Mọi truy vấn task/board đều phải kèm nó; task
 * của dự án này không bao giờ lọt sang dự án khác.
 *
 * NGUỒN SỰ THẬT: docs/backend/project-api-spec.md.
 */

// ==========================================
// DỮ LIỆU
// ==========================================
export type Project = {
  id: string;
  /** Mã ngắn hiển thị ở chip/mã task: "KHA", "HOME" — backend tự sinh nếu FE không gửi */
  code: string;
  name: string;
  description?: string | null;
  /** Hex — dùng cho chấm màu ở thanh điều hướng và thẻ chọn dự án */
  color: string;
  /** Tên icon trong bộ lucide-react, xem PROJECT_ICONS bên dưới */
  icon: string;
  /** Dự án mặc định mở sau khi đăng nhập. Mỗi người có tối đa MỘT */
  isDefault: boolean;
  /** Lưu trữ = ẩn khỏi bộ chọn nhưng KHÔNG xoá dữ liệu */
  archived: boolean;
  /** Backend tính sẵn để trang chọn dự án khỏi phải gọi /tasks cho từng dự án */
  stats?: ProjectStats;
  createdAt: string;
  updatedAt: string;
};

export type ProjectStats = {
  totalTasks: number;
  openTasks: number;
  overdueTasks: number;
  /** ISO — lần cuối có thay đổi trong dự án, dùng để sắp "gần đây nhất" */
  lastActivityAt: string | null;
};

export type ProjectListResponse = {
  items: Project[];
  total: number;
};

export type CreateProjectInput = {
  name: string;
  code?: string;
  description?: string;
  color?: string;
  icon?: string;
  isDefault?: boolean;
};

/**
 * KHÔNG có `isDefault`: `PATCH /projects/:id` không nhận field đó và
 * `forbidNonWhitelisted` sẽ trả 400. Đặt dự án mặc định đi qua endpoint riêng
 * (`PUT /projects/:id/default` — `projectApi.setDefault`) vì nó ghi cả vào các
 * dự án khác. Xem docs/backend/project-api-spec.md §3.4.
 */
export type UpdateProjectInput = Omit<
  Partial<CreateProjectInput>,
  "isDefault"
> & {
  archived?: boolean;
};

export type QueryProjectParams = {
  /** Mặc định false — bộ chọn dự án không hiện dự án đã lưu trữ */
  includeArchived?: boolean;
};

// ==========================================
// HẰNG SỐ HIỂN THỊ
// ==========================================
/** Bảng màu gợi ý khi tạo dự án — đủ tương phản trên nền thanh điều hướng tối */
export const PROJECT_COLORS = [
  "#0a436d",
  "#0ea5e9",
  "#2a9d8f",
  "#7c3aed",
  "#e63946",
  "#f4a261",
  "#d946ef",
  "#475569",
] as const;

/**
 * Tên icon hợp lệ. Giữ danh sách đóng để backend validate được, và để FE không
 * phải nạp cả bộ lucide chỉ vì người dùng gõ tay một cái tên lạ.
 */
export const PROJECT_ICONS = [
  "folder",
  "briefcase",
  "home",
  "rocket",
  "target",
  "book",
  "heart",
  "users",
] as const;

export type ProjectIcon = (typeof PROJECT_ICONS)[number];

/** Trần dự án HOẠT ĐỘNG mỗi người (dự án đã lưu trữ không tính) — backend §6 */
export const PROJECT_LIMIT = 30;
/** Từ mốc này trở đi thì nhắc người dùng, đừng để họ gõ xong mới báo lỗi */
export const PROJECT_LIMIT_WARN_AT = 25;

export const DEFAULT_PROJECT_COLOR = PROJECT_COLORS[0];
export const DEFAULT_PROJECT_ICON: ProjectIcon = "folder";

/** Mã lỗi riêng của dự án — khớp §7 docs/backend/project-api-spec.md */
export const PROJECT_ERROR_MESSAGES: Record<string, string> = {
  PROJECT_NOT_FOUND: "Không tìm thấy dự án, hoặc dự án không thuộc về bạn.",
  PROJECT_CODE_TAKEN: "Mã dự án này đã được dùng, hãy chọn mã khác.",
  PROJECT_NAME_TAKEN: "Bạn đã có một dự án trùng tên.",
  PROJECT_LIMIT_REACHED: "Bạn đã đạt giới hạn số dự án.",
  PROJECT_LAST_ONE: "Không thể xoá dự án cuối cùng — phải còn ít nhất một.",
  PROJECT_NOT_EMPTY:
    "Dự án vẫn còn công việc. Hãy chuyển hoặc xoá hết công việc trước, hoặc chọn lưu trữ thay vì xoá.",
  PROJECT_ARCHIVED: "Dự án đã được lưu trữ, không thể thêm việc mới.",
};

/**
 * Sinh mã 3–4 ký tự từ tên, bỏ dấu tiếng Việt.
 * Dùng khi người dùng không tự nhập mã. Backend cũng có hàm tương đương và
 * **backend mới là nơi quyết định** — FE chỉ gợi ý trong ô nhập.
 */
export const suggestProjectCode = (name: string): string => {
  const plain = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, " ")
    .trim();
  if (!plain) return "";
  const words = plain.split(/\s+/);
  if (words.length >= 2) {
    return words
      .slice(0, 4)
      .map((w) => w[0])
      .join("");
  }
  return words[0].slice(0, 4);
};
