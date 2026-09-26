/**
 * Types cho bảng công việc cá nhân.
 *
 * ĐỊNH HƯỚNG: công cụ CÁ NHÂN, không phải bảng cộng tác — không có thành viên,
 * không có người được giao, không có bình luận của người khác. Thứ thay thế là
 * "ghi chú của tôi" (CardNote) và nhật ký thao tác của chính mình.
 *
 * NGUỒN SỰ THẬT: docs/backend/board-api-contract.md. Mọi hình dạng dưới đây lấy
 * từ DTO backend đã code xong, không phải đề xuất.
 *
 * Điểm quan trọng nhất: có HAI mức dữ liệu thẻ.
 *   CardSummary — dùng ở canvas, lịch, tìm kiếm. KHÔNG có mô tả/checklist/ghi chú.
 *   CardDetail  — chỉ lấy khi mở một thẻ, qua GET /tasks/:id/detail.
 * Trộn hai thứ này là lỗi hay gặp nhất: canvas sẽ tưởng thẻ không có checklist
 * chỉ vì `/full` không trả về chúng.
 */
import {
  DeadlineStatus,
  RepeatRule,
  TaskCategory,
  TaskPriority,
  TaskStatus,
} from "./task";

/** Luật lặp dùng chung — định nghĩa ở `models/task`, xuất lại cho tiện dùng */
export type { RepeatRule };

// ==========================================
// POSITION
// ==========================================
/**
 * Thứ tự thẻ trong danh sách / danh sách trong bảng.
 * Float gap-1024: chèn giữa 2 phần tử = trung bình cộng -> chỉ 1 row bị ghi.
 */
export const POSITION_GAP = 1024;
export const POSITION_EPSILON = 0.001;

// ==========================================
// BẢNG / DANH SÁCH / NHÃN
// ==========================================
export type Board = {
  id: string;
  title: string;
  starred: boolean;
  createdAt: string;
  updatedAt: string;
};

export type BoardList = {
  id: string;
  boardId: string;
  title: string;
  position: number;
  archived: boolean;
  wipLimit: number | null;
  /** Kéo thẻ vào cột này thì task nhận luôn status đó. null = không đụng tới */
  mapsToStatus: TaskStatus | null;
  createdAt: string;
};

export type BoardLabel = {
  id: string;
  boardId: string;
  name: string;
  color: string; // hex
  /** Tên icon trong LABEL_ICONS. null = nhãn chỉ có màu (mọi nhãn cũ đều vậy) */
  icon: string | null;
  /** Không dấu — quick-add khớp "#baogia" theo trường này */
  slug: string;
};

/**
 * Icon hợp lệ của nhãn — phải khớp `LABEL_ICONS` của backend.
 *
 * Danh sách ĐÓNG ở cả hai đầu: backend trả 400 cho tên lạ, còn ở đây nó quyết
 * định component nào được import. Thêm icon mới thì sửa CẢ HAI nơi, nếu không
 * nhãn tạo được nhưng ô icon trống trơn.
 */
export const LABEL_ICONS = [
  "tag",
  "star",
  "flag",
  "bell",
  "heart",
  "zap",
  "phone",
  "mail",
  "users",
  "folder",
  "coins",
  "bug",
] as const;

export type LabelIcon = (typeof LABEL_ICONS)[number];

/** Bảng màu gợi ý khi tạo nhãn — đủ tương phản trên nền kính của bảng */
export const LABEL_COLORS = [
  "#e63946",
  "#f4a261",
  "#2a9d8f",
  "#0ea5e9",
  "#7c3aed",
  "#d946ef",
  "#64748b",
  "#0a436d",
] as const;

export type SaveLabelInput = {
  name?: string;
  color?: string;
  /** null = gỡ icon. undefined = không đụng tới */
  icon?: string | null;
};

// ==========================================
// THẺ
// ==========================================
export type CardSource = "MANUAL" | "EMAIL" | "ZALO";


/** Thẻ rút gọn — dùng ở /full, /agenda, /search, /lists/:id/cards và mọi response ghi */
export type CardSummary = {
  id: string;
  /** null = đang ở Hộp thư đến */
  listId: string | null;
  boardId: string;
  code: string;
  title: string;
  position: number;
  labelIds: string[];
  priority: TaskPriority;
  category: TaskCategory;
  status: TaskStatus;
  deadline: string | null;
  deadlineStatus: DeadlineStatus;
  completedAt: string | null;
  estimateMinutes: number | null;
  repeat: RepeatRule | null;
  source: CardSource;
  cover: string | null;

  /** Dẫn xuất — backend tính sẵn để canvas không phải tải quan hệ con */
  hasDescription: boolean;
  attachmentCount: number;
  noteCount: number;
  checklistDone: number;
  checklistTotal: number;
};

// ==========================================
// QUAN HỆ CON — chỉ có ở /tasks/:id/detail
// ==========================================
export type ChecklistItem = {
  id: string;
  checklistId: string;
  content: string;
  checked: boolean;
  position: number;
  checkedAt: string | null;
};

export type Checklist = {
  id: string;
  taskId: string;
  title: string;
  position: number;
  items: ChecklistItem[];
};

export type CardNote = {
  id: string;
  taskId: string;
  content: string;
  createdAt: string;
  editedAt: string | null;
};

export type CardAttachment = {
  id: string;
  taskId: string;
  name: string;
  kind: "IMAGE" | "FILE" | "LINK";
  url: string;
  sizeBytes: number | null;
  isCover: boolean;
  createdAt: string;
};

export type ActivityAction =
  | "CARD_CREATED"
  | "CARD_MOVED"
  | "CARD_COMPLETED"
  | "CARD_REOPENED"
  | "DUE_CHANGED"
  | "SNOOZED"
  | "CHECKLIST_ITEM_CHECKED"
  | "ATTACHMENT_ADDED"
  | "NOTE_ADDED";

export type CardActivity = {
  id: string;
  taskId: string;
  action: ActivityAction;
  /** Câu tiếng Việt backend đã ghép sẵn — FE hiển thị nguyên văn */
  message: string;
  createdAt: string;
};

/** Thẻ đầy đủ — GET /tasks/:id/detail */
export type CardDetail = CardSummary & {
  description: string | null;
  note: string | null;
  taskTypeId: string | null;
  /** Mảng String[] cũ trên Task (link bóc từ email) — KHÁC `attachments` */
  attachmentLinks: string[];
  checklists: Checklist[];
  attachments: CardAttachment[];
  notes: CardNote[];
  activities: CardActivity[];
  createdAt: string;
  updatedAt: string;
};

// ==========================================
// RESPONSE TỔNG HỢP
// ==========================================
export type TodayStats = {
  overdue: number;
  dueToday: number;
  doneToday: number;
  plannedMinutes: number;
};

export type BoardSnapshot = {
  board: Board;
  /** Gồm cả danh sách đã lưu trữ — FE tự lọc */
  lists: BoardList[];
  labels: BoardLabel[];
  /** Mảng phẳng mọi cột, FE tự nhóm theo listId */
  cards: CardSummary[];
  /** Tổng THẬT của mỗi cột; khoá Hộp thư đến là "inbox"; cột rỗng không có khoá */
  cardCounts: Record<string, number>;
  today: TodayStats;
};

export type CardPage = {
  items: CardSummary[];
  /** position của thẻ cuối; null = đã hết */
  nextCursor: number | null;
  total: number;
};

export type AgendaResponse = {
  date: string;
  overdue: CardSummary[];
  dueToday: CardSummary[];
  /**
   * CHÚ Ý: hai số này bằng đúng số của /boards/me/today, tức tính trên toàn bộ
   * việc đến hạn hôm nay kể cả việc đã quá hạn — KHÔNG phải tổng của mảng
   * `dueToday` bên trên. Đừng tự cộng lại.
   */
  plannedMinutes: number;
  doneToday: number;
};

/** GET /boards/me/notes — một ghi chú kèm thẻ chứa nó */
export type NoteFeedItem = CardNote & {
  card: {
    id: string;
    code: string;
    title: string;
    status: TaskStatus;
    /** null = đang ở Hộp thư đến */
    listTitle: string | null;
  };
};

export type NotesFeed = {
  items: NoteFeedItem[];
  /** Truyền vào `before` để lấy trang kế; null = hết */
  nextCursor: string | null;
};

export type SearchResponse = {
  items: CardSummary[];
  total: number;
};

/** PATCH /tasks/:id/move — chỉ trả những gì đã đổi */
export type MoveCardResult = {
  id: string;
  listId: string | null;
  position: number;
  status: TaskStatus;
  updatedAt: string;
  /** Vắng mặt khi không có cảnh báo (không phải null) */
  warning?: "LIST_WIP_EXCEEDED";
};

/** PATCH /tasks/:id/complete */
export type CompleteCardResponse = {
  completed: CardSummary;
  /** null nếu việc không lặp */
  next: CardSummary | null;
};

// ==========================================
// BODY GỬI LÊN
// ==========================================
export type CreateCardInput = {
  /**
   * Dự án nhận thẻ. Chỉ cần gửi khi tạo ở Hộp thư đến (POST /tasks/inbox/cards)
   * — tạo trong một cột thì backend suy ra từ bảng chứa cột đó.
   */
  projectId?: string;
  title: string;
  position?: number;
  deadline?: string | null;
  priority?: TaskPriority;
  category?: TaskCategory;
  labelIds?: string[];
  estimateMinutes?: number | null;
  description?: string | null;
  repeat?: RepeatRule | null;
  cover?: string | null;
};

export type UpdateCardInput = Partial<
  Pick<
    CardDetail,
    "title" | "description" | "priority" | "category" | "deadline" | "cover" | "estimateMinutes"
  >
> & {
  /**
   * Đổi trạng thái việc. Đi cùng endpoint `PATCH /tasks/:id` như mọi field
   * khác ở đây.
   *
   * KHÔNG dùng để đánh dấu HOÀN THÀNH: `PATCH` có đặt `completedAt` nhưng
   * **không** sinh lượt lặp kế tiếp — chỉ `/tasks/:id/complete` làm việc đó.
   * Hoàn thành phải đi qua `toggleComplete`.
   */
  status?: TaskStatus;
  repeat?: RepeatRule | null;
  labelIds?: string[];
};

export type CreateListInput = {
  title: string;
  position?: number;
  mapsToStatus?: TaskStatus | null;
  wipLimit?: number | null;
};

export type UpdateListInput = {
  title?: string;
  wipLimit?: number | null;
  archived?: boolean;
  mapsToStatus?: TaskStatus | null;
};

// ==========================================
// HELPERS
// ==========================================
export const computePosition = (prev?: number, next?: number): number => {
  if (prev === undefined && next === undefined) return POSITION_GAP;
  if (prev === undefined) return next! - POSITION_GAP;
  if (next === undefined) return prev + POSITION_GAP;
  return (prev + next) / 2;
};

/** Hai position sát nhau quá -> cần gọi rebalance cho cả cột */
export const needsRebalance = (prev?: number, next?: number): boolean =>
  prev !== undefined &&
  next !== undefined &&
  Math.abs(next - prev) < POSITION_EPSILON;

export const byPosition = <T extends { position: number }>(a: T, b: T) =>
  a.position - b.position;

export const REPEAT_LABEL: Record<RepeatRule["unit"], string> = {
  DAY: "ngày",
  WEEK: "tuần",
  MONTH: "tháng",
};

/** Nhãn thứ trong tuần, index = 0 (CN) .. 6 (T7) — khớp quy ước của backend */
export const WEEKDAY_LABELS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

/**
 * Câu mô tả luật lặp bằng tiếng Việt, gồm cả phần nâng cao.
 * Ví dụ: "Mỗi 2 tuần vào T2, T5 · còn 3 lượt"
 */
/**
 * Câu mô tả luật lặp bằng tiếng Việt.
 *
 * `anchor` là hạn chót của việc — cần cho đúng một trường hợp, nhưng là trường
 * hợp phổ biến nhất: lặp theo TUẦN mà không chọn thứ nào. Khi đó luật bám theo
 * thứ của hạn chót, và nếu không nói ra thì người dùng chỉ thấy "Mỗi tuần" rồi
 * phải tự suy từ ngày tháng xem là thứ mấy.
 *
 * Tương tự với THÁNG không chọn ngày: "Mỗi tháng" -> "Mỗi tháng vào ngày 28".
 */
export const repeatText = (
  rule: RepeatRule,
  anchor?: string | null,
): string => {
  const every =
    rule.interval === 1
      ? `Mỗi ${REPEAT_LABEL[rule.unit]}`
      : `Mỗi ${rule.interval} ${REPEAT_LABEL[rule.unit]}`;

  const parts = [every];
  const anchorDate = anchor ? new Date(anchor) : null;

  if (rule.unit === "WEEK") {
    const days = rule.weekdays?.length
      ? [...rule.weekdays].sort((a, b) => a - b)
      : anchorDate
        ? [anchorDate.getDay()]
        : [];
    const labels = days.map((d) => WEEKDAY_LABELS[d]).filter(Boolean);
    if (labels.length) parts.push(`vào ${labels.join(", ")}`);
  }

  if (rule.unit === "MONTH") {
    const day = rule.dayOfMonth ?? anchorDate?.getDate();
    if (day) parts.push(`vào ngày ${day}`);
  }

  const head = parts.join(" ");

  if (rule.remaining !== null && rule.remaining !== undefined) {
    /*
     * `remaining` đếm số lượt CÒN LẠI SAU lượt hiện tại — quy ước của backend.
     * Chữ "nữa" là thứ duy nhất phân biệt được "còn 3 lượt (tính cả lượt này)"
     * với "còn 3 lượt nữa", mà hai cách hiểu đó lệch nhau đúng một lần lặp.
     */
    return rule.remaining === 0
      ? `${head} · lượt cuối`
      : `${head} · còn ${rule.remaining} lượt nữa`;
  }
  if (rule.until) {
    const until = new Date(rule.until);
    return `${head} · tới ${until.getDate()}/${until.getMonth() + 1}/${until.getFullYear()}`;
  }
  return head;
};

/**
 * Nhịp lặp viết cực ngắn, để in lên thẻ ngoài bảng.
 *
 * Khác `repeatText` ở mục đích: hàm kia viết đủ câu cho người ĐỌC KỸ (màn chi
 * tiết, tooltip), hàm này viết cho người ĐỌC LƯỚT một cột hai chục thẻ. Nên nó
 * bỏ hẳn phần kết thúc ("còn 2 lượt nữa") — thông tin đó không đổi cách bạn
 * nhìn cột việc hôm nay.
 *
 * Chọn thứ quá nhiều thì gộp thành "4 ngày/tuần": liệt kê đủ bảy thứ sẽ dài
 * hơn cả tiêu đề việc.
 */
export const repeatShort = (
  rule: RepeatRule,
  anchor?: string | null,
): string => {
  const anchorDate = anchor ? new Date(anchor) : null;

  if (rule.unit === "DAY") {
    return rule.interval === 1 ? "hằng ngày" : `mỗi ${rule.interval} ngày`;
  }

  if (rule.unit === "WEEK") {
    const days = rule.weekdays?.length
      ? [...rule.weekdays].sort((a, b) => a - b)
      : anchorDate
        ? [anchorDate.getDay()]
        : [];
    const labels = days.map((d) => WEEKDAY_LABELS[d]).filter(Boolean);
    const when =
      labels.length === 0
        ? "hằng tuần"
        : labels.length > 3
          ? `${labels.length} ngày/tuần`
          : labels.join(", ");
    return rule.interval === 1 ? when : `${rule.interval} tuần · ${when}`;
  }

  const day = rule.dayOfMonth ?? anchorDate?.getDate();
  if (rule.interval === 1) return day ? `ngày ${day}/tháng` : "hằng tháng";
  return `mỗi ${rule.interval} tháng`;
};

export const checklistProgress = (card: CardDetail) => {
  const items = card.checklists.flatMap((c) => c.items);
  return { done: items.filter((i) => i.checked).length, total: items.length };
};

/** Múi giờ trình duyệt — gửi kèm mọi endpoint có tính "hôm nay" */
export const browserTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Ho_Chi_Minh";
  } catch {
    return "Asia/Ho_Chi_Minh";
  }
};

/** Khoá của Hộp thư đến trong `cardCounts` */
export const INBOX_KEY = "inbox";

/**
 * Ảnh bìa dựng sẵn. Dùng gradient CSS chứ không dùng ảnh vì CSP của dự án chỉ
 * cho `img-src 'self' data: blob:` — ảnh ngoài domain sẽ bị trình duyệt chặn.
 */
export const COVER_PRESETS = [
  "linear-gradient(135deg,#0a436d,#2d79a8)",
  "linear-gradient(135deg,#2a9d8f,#218077)",
  "linear-gradient(135deg,#f4a261,#e08c3a)",
  "linear-gradient(135deg,#5196bf,#08375a)",
  "linear-gradient(135deg,#e63946,#a22530)",
  "linear-gradient(135deg,#94a3b8,#475569)",
];
