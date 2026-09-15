/**
 * Types cho màn Board (bảng công việc cá nhân).
 *
 * ĐỊNH HƯỚNG: đây là công cụ CÁ NHÂN, không phải bảng cộng tác.
 * Không có thành viên, không có người được giao, không có bình luận của người khác.
 * Thứ thay thế là "ghi chú của tôi" (CardNote) và nhật ký thao tác của chính mình.
 *
 * QUAN TRỌNG: đây là contract FE đang chạy trên MOCK (mocks/board.mock.ts).
 * Mọi field đều ánh xạ 1-1 sang schema/endpoint backend cần bổ sung —
 * xem docs/backend/board-spec.md.
 */
import { DeadlineStatus, TaskCategory, TaskPriority, TaskStatus } from "./task";

// ==========================================
// POSITION
// ==========================================
/**
 * Thứ tự thẻ trong danh sách / danh sách trong bảng.
 * Float gap-1024: chèn giữa 2 phần tử = trung bình cộng -> chỉ update 1 row.
 * Khi khoảng cách 2 vị trí liền kề < POSITION_EPSILON -> gọi rebalance.
 */
export const POSITION_GAP = 1024;
export const POSITION_EPSILON = 0.001;

// ==========================================
// BOARD / LIST
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
  /** Danh sách đã lưu trữ thì ẩn khỏi canvas nhưng không xoá dữ liệu */
  archived: boolean;
  /** Giới hạn WIP — vượt thì header danh sách đổi màu cảnh báo. null = không giới hạn */
  wipLimit: number | null;
  createdAt: string;
};

// ==========================================
// NHÃN
// ==========================================
export type BoardLabel = {
  id: string;
  boardId: string;
  name: string;
  color: string; // hex
  /** Từ khoá để quick-add nhận diện (#baogia) — không dấu, không khoảng trắng */
  slug: string;
};

// ==========================================
// CHECKLIST
// ==========================================
export type ChecklistItem = {
  id: string;
  checklistId: string;
  content: string;
  checked: boolean;
  position: number;
};

export type Checklist = {
  id: string;
  cardId: string;
  title: string;
  position: number;
  items: ChecklistItem[];
};

// ==========================================
// ĐÍNH KÈM
// ==========================================
export type CardAttachment = {
  id: string;
  cardId: string;
  name: string;
  /** Ảnh thì render preview, còn lại render icon file */
  kind: "IMAGE" | "FILE" | "LINK";
  url: string;
  sizeBytes: number | null;
  createdAt: string;
  isCover: boolean;
};

// ==========================================
// GHI CHÚ CÁ NHÂN + NHẬT KÝ
// ==========================================
/** Ghi chú của chính mình trên thẻ — thay cho "bình luận" của bản cộng tác */
export type CardNote = {
  id: string;
  cardId: string;
  content: string;
  createdAt: string;
  editedAt: string | null;
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

/** Nhật ký thao tác của chính mình, câu chữ ở ngôi thứ nhất */
export type CardActivity = {
  id: string;
  cardId: string;
  action: ActivityAction;
  /** Câu mô tả backend render sẵn, ví dụ "Chuyển từ Hôm nay sang Đang làm" */
  message: string;
  createdAt: string;
};

// ==========================================
// THẺ
// ==========================================
/** Nguồn tạo thẻ — điểm khác biệt sản phẩm */
export type CardSource = "MANUAL" | "EMAIL" | "ZALO";

/** Quy tắc lặp lại — công việc định kỳ tự sinh thẻ mới khi hoàn thành */
export type RepeatRule = {
  /** Mỗi `interval` đơn vị */
  unit: "DAY" | "WEEK" | "MONTH";
  interval: number;
};

export type BoardCard = {
  id: string;
  /** null = đang nằm ở Hộp thư đến, chưa được xếp vào danh sách nào */
  listId: string | null;
  boardId: string;
  code: string; // "TSK-000123"
  title: string;
  description: string | null;
  position: number;

  labelIds: string[];

  category: TaskCategory;
  priority: TaskPriority;
  deadline: string | null;
  deadlineStatus: DeadlineStatus;
  completedAt: string | null;
  /** Thời lượng dự kiến (phút) — dùng để cộng tải trong ngày */
  estimateMinutes: number | null;
  /** Quy tắc lặp, null = việc một lần */
  repeat: RepeatRule | null;

  source: CardSource;
  /** Chỉ có khi source = EMAIL */
  sourceMail: {
    accountEmail: string;
    subject: string;
    receivedAt: string;
  } | null;

  /** CSS gradient hoặc màu bìa. null = thẻ không có bìa */
  cover: string | null;

  checklists: Checklist[];
  attachments: CardAttachment[];
  notes: CardNote[];
  activities: CardActivity[];

  createdAt: string;
  updatedAt: string;
};

/** Payload gọn cho canvas — BE nên trả bản này ở /boards/:id/full, KHÔNG trả full card */
export type BoardCardSummary = Pick<
  BoardCard,
  | "id"
  | "listId"
  | "boardId"
  | "code"
  | "title"
  | "position"
  | "labelIds"
  | "priority"
  | "category"
  | "deadline"
  | "deadlineStatus"
  | "completedAt"
  | "estimateMinutes"
  | "repeat"
  | "source"
  | "cover"
> & {
  /**
   * Backend trả kèm để FE không phải suy ra từ listId.
   * Kéo thẻ sang cột có `mapsToStatus` thì giá trị này đổi theo.
   */
  status: TaskStatus;
  hasDescription: boolean;
  attachmentCount: number;
  noteCount: number;
  checklistDone: number;
  checklistTotal: number;
};

/**
 * Response của `PATCH /tasks/:id/complete`.
 *
 * Endpoint này ĐÃ ĐỔI HÌNH DẠNG: trước trả thẳng task, nay bọc trong `completed`
 * để còn chỗ trả `next` — thẻ kế tiếp sinh ra khi việc có quy tắc lặp.
 * Xem docs/backend/board-api-contract.md mục 4.5.
 */
export type CompleteCardResponse = {
  completed: BoardCardSummary;
  /** null nếu việc không lặp */
  next: BoardCardSummary | null;
};

// ==========================================
// SNAPSHOT (response của GET /boards/:id/full)
// ==========================================
export type BoardSnapshot = {
  board: Board;
  lists: BoardList[];
  labels: BoardLabel[];
  cards: BoardCard[];
};

// ==========================================
// HELPERS
// ==========================================
export const checklistProgress = (card: BoardCard) => {
  const items = card.checklists.flatMap((c) => c.items);
  const done = items.filter((i) => i.checked).length;
  return { done, total: items.length };
};

/**
 * Tính position để chèn thẻ vào giữa prev và next.
 * prev/next = undefined nghĩa là chèn ở đầu/cuối danh sách.
 */
export const computePosition = (prev?: number, next?: number): number => {
  if (prev === undefined && next === undefined) return POSITION_GAP;
  if (prev === undefined) return next! - POSITION_GAP;
  if (next === undefined) return prev + POSITION_GAP;
  return (prev + next) / 2;
};

/** Khi 2 position sát nhau quá -> FE báo BE rebalance lại cả danh sách */
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
