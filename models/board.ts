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
import { DeadlineStatus, TaskCategory, TaskPriority, TaskStatus } from "./task";

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
  /** Không dấu — quick-add khớp "#baogia" theo trường này */
  slug: string;
};

// ==========================================
// THẺ
// ==========================================
export type CardSource = "MANUAL" | "EMAIL" | "ZALO";

export type RepeatRule = {
  unit: "DAY" | "WEEK" | "MONTH";
  interval: number;
};

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

export const repeatText = (rule: RepeatRule): string =>
  rule.interval === 1
    ? `Mỗi ${REPEAT_LABEL[rule.unit]}`
    : `Mỗi ${rule.interval} ${REPEAT_LABEL[rule.unit]}`;

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
