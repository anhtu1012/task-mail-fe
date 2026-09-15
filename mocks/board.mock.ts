/**
 * Data mẫu cho bảng công việc cá nhân.
 *
 * Mọi mốc thời gian neo vào BASE (hằng số) chứ KHÔNG dùng Date.now() —
 * để SSR và client render ra cùng một chuỗi, tránh hydration mismatch.
 * Trạng thái quá hạn đọc từ `deadlineStatus` (dữ liệu tĩnh), không tính theo đồng hồ.
 */
import {
  Board,
  BoardCard,
  BoardLabel,
  BoardList,
  BoardSnapshot,
  POSITION_GAP,
} from "@/models/board";
import { TaskCategory, TaskPriority } from "@/models/task";

/** Mốc "hôm nay" của dữ liệu mẫu — đổi 1 chỗ là cả bảng dịch theo */
export const MOCK_TODAY = new Date("2026-09-15T08:00:00.000Z");

const at = (hours: number): string =>
  new Date(MOCK_TODAY.getTime() + hours * 3600_000).toISOString();

const days = (n: number) => n * 24;

// ==========================================
// NHÃN
// ==========================================
export const MOCK_LABELS: BoardLabel[] = [
  { id: "l1", boardId: "b1", name: "Khách hàng", color: "#e63946", slug: "khachhang" },
  { id: "l2", boardId: "b1", name: "Nội bộ", color: "#0a436d", slug: "noibo" },
  { id: "l3", boardId: "b1", name: "Hợp đồng", color: "#2a9d8f", slug: "hopdong" },
  { id: "l4", boardId: "b1", name: "Cần duyệt", color: "#f4a261", slug: "canduyet" },
  { id: "l5", boardId: "b1", name: "Kỹ thuật", color: "#2d79a8", slug: "kythuat" },
  { id: "l6", boardId: "b1", name: "Cá nhân", color: "#7c5cbf", slug: "canhan" },
];

// ==========================================
// BẢNG + DANH SÁCH
// ==========================================
export const MOCK_BOARD: Board = {
  id: "b1",
  title: "Bảng công việc của tôi",
  starred: true,
  createdAt: at(-days(60)),
  updatedAt: at(-2),
};

export const MOCK_LISTS: BoardList[] = [
  { id: "li1", boardId: "b1", title: "Hôm nay", position: POSITION_GAP * 1, archived: false, wipLimit: 5, createdAt: at(-days(60)) },
  { id: "li2", boardId: "b1", title: "Đang làm", position: POSITION_GAP * 2, archived: false, wipLimit: 3, createdAt: at(-days(60)) },
  { id: "li3", boardId: "b1", title: "Tuần này", position: POSITION_GAP * 3, archived: false, wipLimit: null, createdAt: at(-days(60)) },
  { id: "li4", boardId: "b1", title: "Sau này", position: POSITION_GAP * 4, archived: false, wipLimit: null, createdAt: at(-days(59)) },
  { id: "li5", boardId: "b1", title: "Hoàn thành", position: POSITION_GAP * 5, archived: false, wipLimit: null, createdAt: at(-days(59)) },
];

// Bìa dùng gradient vì CSP của dự án chỉ cho img-src 'self' data: blob:
export const COVER_PRESETS = [
  "linear-gradient(135deg,#0a436d,#2d79a8)",
  "linear-gradient(135deg,#2a9d8f,#218077)",
  "linear-gradient(135deg,#f4a261,#e08c3a)",
  "linear-gradient(135deg,#5196bf,#08375a)",
  "linear-gradient(135deg,#e63946,#a22530)",
  "linear-gradient(135deg,#94a3b8,#475569)",
];

// ==========================================
// THẺ
// ==========================================
type CardSeed = Omit<
  BoardCard,
  "boardId" | "checklists" | "attachments" | "notes" | "activities" | "createdAt" | "updatedAt"
> &
  Partial<
    Pick<BoardCard, "checklists" | "attachments" | "notes" | "activities" | "createdAt" | "updatedAt">
  >;

const seeds: CardSeed[] = [
  // ---------- HỘP THƯ ĐẾN (listId = null) ----------
  {
    id: "c1", listId: null, code: "TSK-000241",
    title: "Báo giá thiết bị nâng hạ Q4 — CTY Hải An",
    description: null, position: POSITION_GAP * 1,
    labelIds: ["l1"], category: TaskCategory.WORK,
    priority: TaskPriority.HIGH, deadline: at(days(2)), deadlineStatus: "IN_PROGRESS",
    completedAt: null, estimateMinutes: 45, repeat: null, source: "EMAIL",
    sourceMail: { accountEmail: "tupa@cehsoft.com", subject: "RE: Báo giá thiết bị nâng hạ Q4", receivedAt: at(-3) },
    cover: null,
  },
  {
    id: "c2", listId: null, code: "TSK-000242",
    title: "Xác nhận lịch nghiệm thu kho B3",
    description: null, position: POSITION_GAP * 2,
    labelIds: ["l1", "l4"], category: TaskCategory.WORK,
    priority: TaskPriority.URGENT, deadline: at(6), deadlineStatus: "IN_PROGRESS",
    completedAt: null, estimateMinutes: 15, repeat: null, source: "EMAIL",
    sourceMail: { accountEmail: "tupa@cehsoft.com", subject: "Lịch nghiệm thu kho B3 ngày 17/09", receivedAt: at(-5) },
    cover: null,
  },
  {
    id: "c3", listId: null, code: "TSK-000243",
    title: "Nhắc thanh toán đợt 2 hợp đồng HD-2026-018",
    description: null, position: POSITION_GAP * 3,
    labelIds: ["l3"], category: TaskCategory.WORK,
    priority: TaskPriority.NORMAL, deadline: null, deadlineStatus: "IN_PROGRESS",
    completedAt: null, estimateMinutes: null, repeat: null,
    source: "ZALO", sourceMail: null, cover: null,
  },
  {
    id: "c4", listId: null, code: "TSK-000244",
    title: "Gửi CV ứng viên vị trí kỹ sư vận hành",
    description: null, position: POSITION_GAP * 4,
    labelIds: ["l2"], category: TaskCategory.WORK,
    priority: TaskPriority.LOW, deadline: null, deadlineStatus: "IN_PROGRESS",
    completedAt: null, estimateMinutes: null, repeat: null, source: "EMAIL",
    sourceMail: { accountEmail: "tupa@cehsoft.com", subject: "Hồ sơ ứng viên — KS vận hành", receivedAt: at(-20) },
    cover: null,
  },

  // ---------- HÔM NAY ----------
  {
    id: "c10", listId: "li1", code: "TSK-000210",
    title: "Chốt phương án tích hợp hộp thư Gmail cho 3 tài khoản mới",
    description:
      "<h3>Hiện trạng</h3><p>Đã bật OAuth cho <strong>2/3</strong> tài khoản. Tài khoản kho vận còn chờ IT cấp quyền <em>delegate</em>.</p><h3>Việc còn lại</h3><ul><li>Kiểm thử luồng tạo việc tự động</li><li>Theo dõi hạn ngạch Pub/Sub</li></ul><blockquote>Nếu quá 17/09 chưa có quyền delegate thì bàn giao trước 2 tài khoản đã chạy được.</blockquote>",
    position: POSITION_GAP * 1,
    labelIds: ["l5"], category: TaskCategory.WORK,
    priority: TaskPriority.URGENT, deadline: at(4), deadlineStatus: "IN_PROGRESS",
    completedAt: null, estimateMinutes: 90, repeat: null,
    source: "MANUAL", sourceMail: null,
    cover: COVER_PRESETS[0],
    checklists: [
      {
        id: "cl1", cardId: "c10", title: "Các bước tích hợp", position: POSITION_GAP,
        items: [
          { id: "ci1", checklistId: "cl1", content: "Tạo OAuth client trên Google Cloud", checked: true, position: 1024 },
          { id: "ci2", checklistId: "cl1", content: "Cấu hình redirect URI cho môi trường staging", checked: true, position: 2048 },
          { id: "ci3", checklistId: "cl1", content: "Bật Gmail API + Pub/Sub watch", checked: true, position: 3072 },
          { id: "ci4", checklistId: "cl1", content: "Kiểm thử luồng tạo việc tự động từ mail đến", checked: false, position: 4096 },
          { id: "ci5", checklistId: "cl1", content: "Xin quyền delegate cho hộp thư kho vận", checked: false, position: 5120 },
        ],
      },
    ],
    attachments: [
      { id: "a1", cardId: "c10", name: "so-do-luong-tich-hop.png", kind: "IMAGE", url: "#", sizeBytes: 184320, createdAt: at(-26), isCover: true },
      { id: "a2", cardId: "c10", name: "Checklist bảo mật OAuth", kind: "LINK", url: "#", sizeBytes: null, createdAt: at(-25), isCover: false },
    ],
    notes: [
      { id: "n1", cardId: "c10", content: "IT nói cần thêm 1 ngày duyệt quyền delegate. Nếu mai chưa xong thì làm trước 2 tài khoản đã bật được, đừng chờ.", createdAt: at(-20), editedAt: null },
      { id: "n2", cardId: "c10", content: "Nhớ kiểm tra hạn ngạch Pub/Sub trước khi bật cho tài khoản thứ 3.", createdAt: at(-18), editedAt: null },
    ],
    activities: [
      { id: "ac1", cardId: "c10", action: "CARD_CREATED", message: "Tạo việc trong danh sách Hôm nay", createdAt: at(-days(3)) },
      { id: "ac2", cardId: "c10", action: "ATTACHMENT_ADDED", message: "Đính kèm so-do-luong-tich-hop.png", createdAt: at(-26) },
      { id: "ac3", cardId: "c10", action: "CHECKLIST_ITEM_CHECKED", message: "Hoàn thành mục “Bật Gmail API + Pub/Sub watch”", createdAt: at(-22) },
    ],
  },
  {
    id: "c11", listId: "li1", code: "TSK-000211",
    title: "Duyệt hợp đồng thuê xe nâng — bản sửa lần 3",
    description:
      "<p>Đối tác đã chỉnh điều khoản bảo trì theo góp ý của pháp chế.</p><p>Cần soát lại <strong>điều 7.2</strong> và <strong>phụ lục B</strong> trước khi trình ký.</p>",
    position: POSITION_GAP * 2,
    labelIds: ["l3", "l4"], category: TaskCategory.WORK,
    priority: TaskPriority.HIGH, deadline: at(-6), deadlineStatus: "LATE",
    completedAt: null, estimateMinutes: 30, repeat: null, source: "EMAIL",
    sourceMail: { accountEmail: "tupa@cehsoft.com", subject: "Hợp đồng thuê xe nâng v3", receivedAt: at(-days(1)) },
    cover: null,
    attachments: [
      { id: "a3", cardId: "c11", name: "HD-thue-xe-nang-v3.pdf", kind: "FILE", url: "#", sizeBytes: 942080, createdAt: at(-days(1)), isCover: false },
    ],
    notes: [
      { id: "n3", cardId: "c11", content: "Điều khoản 7.2 đã được pháp chế duyệt. Chỉ còn chờ chữ ký — đừng đọc lại từ đầu nữa.", createdAt: at(-12), editedAt: null },
    ],
  },
  {
    id: "c12", listId: "li1", code: "TSK-000212",
    title: "Gọi lại khách hàng Minh Phát về đơn hàng thiếu",
    description: null, position: POSITION_GAP * 3,
    labelIds: ["l1"], category: TaskCategory.WORK,
    priority: TaskPriority.NORMAL, deadline: at(3), deadlineStatus: "IN_PROGRESS",
    completedAt: null, estimateMinutes: 15, repeat: null,
    source: "MANUAL", sourceMail: null, cover: null,
  },
  {
    id: "c13", listId: "li1", code: "TSK-000215",
    title: "Tổng kết công việc cuối ngày",
    description: null, position: POSITION_GAP * 4,
    labelIds: ["l6"], category: TaskCategory.PERSONAL,
    priority: TaskPriority.LOW, deadline: at(10), deadlineStatus: "IN_PROGRESS",
    completedAt: null, estimateMinutes: 10,
    repeat: { unit: "DAY", interval: 1 },
    source: "MANUAL", sourceMail: null, cover: null,
  },

  // ---------- ĐANG LÀM ----------
  {
    id: "c20", listId: "li2", code: "TSK-000198",
    title: "Dựng báo cáo hiệu suất xử lý công việc theo phòng ban",
    description:
      "<p>Biểu đồ tỉ lệ đúng hạn theo tháng, tách theo phòng và theo loại công việc.</p><ol><li>Cột chồng theo tháng</li><li>Bộ lọc phòng ban</li><li>Xuất Excel</li></ol>",
    position: POSITION_GAP * 1,
    labelIds: ["l2", "l5"], category: TaskCategory.WORK,
    priority: TaskPriority.HIGH, deadline: at(days(3)), deadlineStatus: "IN_PROGRESS",
    completedAt: null, estimateMinutes: 180, repeat: null,
    source: "MANUAL", sourceMail: null,
    cover: COVER_PRESETS[3],
    checklists: [
      {
        id: "cl2", cardId: "c20", title: "Hạng mục", position: POSITION_GAP,
        items: [
          { id: "ci10", checklistId: "cl2", content: "Thống nhất công thức tính đúng hạn", checked: true, position: 1024 },
          { id: "ci11", checklistId: "cl2", content: "API tổng hợp theo phòng ban", checked: true, position: 2048 },
          { id: "ci12", checklistId: "cl2", content: "Biểu đồ cột chồng theo tháng", checked: false, position: 3072 },
          { id: "ci13", checklistId: "cl2", content: "Xuất Excel", checked: false, position: 4096 },
        ],
      },
    ],
    notes: [
      { id: "n4", cardId: "c20", content: "Dùng recharts cho phần biểu đồ để đồng bộ với trang Tổng quan.", createdAt: at(-30), editedAt: null },
    ],
  },
  {
    id: "c21", listId: "li2", code: "TSK-000201",
    title: "Kiểm thử luồng liên kết Zalo OA cho nhân viên hiện trường",
    description: null, position: POSITION_GAP * 2,
    labelIds: ["l5"], category: TaskCategory.WORK,
    priority: TaskPriority.NORMAL, deadline: at(days(1) + 2), deadlineStatus: "IN_PROGRESS",
    completedAt: null, estimateMinutes: 60, repeat: null,
    source: "MANUAL", sourceMail: null, cover: null,
    checklists: [
      {
        id: "cl3", cardId: "c21", title: "Ca kiểm thử", position: POSITION_GAP,
        items: [
          { id: "ci20", checklistId: "cl3", content: "Mã liên kết hết hạn sau 10 phút", checked: true, position: 1024 },
          { id: "ci21", checklistId: "cl3", content: "Liên kết trùng tài khoản bị chặn", checked: false, position: 2048 },
        ],
      },
    ],
  },

  // ---------- TUẦN NÀY ----------
  {
    id: "c30", listId: "li3", code: "TSK-000180",
    title: "Rà soát danh mục loại công việc, gộp các nhóm trùng",
    description: null, position: POSITION_GAP * 1,
    labelIds: ["l2"], category: TaskCategory.WORK,
    priority: TaskPriority.LOW, deadline: at(days(5)), deadlineStatus: "IN_PROGRESS",
    completedAt: null, estimateMinutes: 60, repeat: null,
    source: "MANUAL", sourceMail: null, cover: null,
  },
  {
    id: "c31", listId: "li3", code: "TSK-000183",
    title: "Chuẩn bị tài liệu đào tạo cho 8 nhân sự mới vào tháng 10",
    description:
      "<p>Gồm hướng dẫn <strong>đăng nhập</strong>, tạo công việc, kết nối hộp thư.</p><ul data-checked=\"false\"><li>Slide tổng quan</li><li>Video thao tác mẫu</li></ul>",
    position: POSITION_GAP * 2,
    labelIds: ["l2", "l4"], category: TaskCategory.WORK,
    priority: TaskPriority.NORMAL, deadline: at(days(6)), deadlineStatus: "IN_PROGRESS",
    completedAt: null, estimateMinutes: 240, repeat: null,
    source: "MANUAL", sourceMail: null,
    cover: COVER_PRESETS[2],
    attachments: [
      { id: "a4", cardId: "c31", name: "outline-dao-tao.docx", kind: "FILE", url: "#", sizeBytes: 45056, createdAt: at(-days(2)), isCover: false },
    ],
  },
  {
    id: "c32", listId: "li3", code: "TSK-000186",
    title: "Đặt lịch bảo trì định kỳ máy phát điện kho A",
    description: null, position: POSITION_GAP * 3,
    labelIds: [], category: TaskCategory.WORK,
    priority: TaskPriority.NORMAL, deadline: at(days(4)), deadlineStatus: "IN_PROGRESS",
    completedAt: null, estimateMinutes: 20,
    repeat: { unit: "MONTH", interval: 3 },
    source: "MANUAL", sourceMail: null, cover: null,
  },

  // ---------- SAU NÀY ----------
  {
    id: "c40", listId: "li4", code: "TSK-000150",
    title: "Nghiên cứu tự động gán loại công việc bằng nội dung email",
    description:
      "<p><em>Ý tưởng:</em> phân loại theo tiêu đề + người gửi, có <strong>ngưỡng tin cậy</strong> trước khi tự gán.</p><pre class=\"ql-syntax\">confidence &gt;= 0.8 -&gt; tự gán</pre><pre class=\"ql-syntax\">confidence &lt; 0.8 -&gt; để người dùng chọn</pre>",
    position: POSITION_GAP * 1,
    labelIds: ["l5"], category: TaskCategory.WORK,
    priority: TaskPriority.LOW, deadline: null, deadlineStatus: "IN_PROGRESS",
    completedAt: null, estimateMinutes: null, repeat: null,
    source: "MANUAL", sourceMail: null, cover: null,
  },
  {
    id: "c41", listId: "li4", code: "TSK-000155",
    title: "Đăng ký khám sức khoẻ định kỳ",
    description: null, position: POSITION_GAP * 2,
    labelIds: ["l6"], category: TaskCategory.PERSONAL,
    priority: TaskPriority.LOW, deadline: null, deadlineStatus: "IN_PROGRESS",
    completedAt: null, estimateMinutes: null,
    repeat: { unit: "MONTH", interval: 6 },
    source: "MANUAL", sourceMail: null, cover: null,
  },

  // ---------- HOÀN THÀNH ----------
  {
    id: "c50", listId: "li5", code: "TSK-000144",
    title: "Bàn giao 12 thiết bị đo cho tổ kỹ thuật",
    description: null, position: POSITION_GAP * 1,
    labelIds: ["l5"], category: TaskCategory.WORK,
    priority: TaskPriority.NORMAL, deadline: at(-days(2)), deadlineStatus: "ON_TIME",
    completedAt: at(-days(2) - 3), estimateMinutes: 45, repeat: null,
    source: "MANUAL", sourceMail: null, cover: null,
  },
  {
    id: "c51", listId: "li5", code: "TSK-000139",
    title: "Gửi biên bản họp tuần 37 cho các trưởng bộ phận",
    description: null, position: POSITION_GAP * 2,
    labelIds: ["l2"], category: TaskCategory.WORK,
    priority: TaskPriority.LOW, deadline: at(-days(4)), deadlineStatus: "LATE",
    completedAt: at(-days(3)), estimateMinutes: 15, repeat: null, source: "EMAIL",
    sourceMail: { accountEmail: "tupa@cehsoft.com", subject: "Biên bản họp tuần 37", receivedAt: at(-days(5)) },
    cover: null,
  },
  {
    id: "c52", listId: "li5", code: "TSK-000141",
    title: "Tổng kết công việc cuối ngày",
    description: null, position: POSITION_GAP * 3,
    labelIds: ["l6"], category: TaskCategory.PERSONAL,
    priority: TaskPriority.LOW, deadline: at(-days(1) + 10), deadlineStatus: "ON_TIME",
    completedAt: at(-days(1) + 10), estimateMinutes: 10,
    repeat: { unit: "DAY", interval: 1 },
    source: "MANUAL", sourceMail: null, cover: null,
  },
];

const MOCK_CARDS: BoardCard[] = seeds.map((seed) => ({
  ...seed,
  boardId: "b1",
  checklists: seed.checklists ?? [],
  attachments: seed.attachments ?? [],
  notes: seed.notes ?? [],
  activities: seed.activities ?? [
    {
      id: `ac-${seed.id}`,
      cardId: seed.id,
      action: "CARD_CREATED",
      message:
        seed.source === "EMAIL"
          ? "Tạo tự động từ hộp thư đến"
          : seed.source === "ZALO"
            ? "Tạo tự động từ tin nhắn Zalo"
            : "Tạo việc",
      createdAt: at(-days(4)),
    },
  ],
  createdAt: seed.createdAt ?? at(-days(4)),
  updatedAt: seed.updatedAt ?? at(-8),
}));

export const MOCK_SNAPSHOT: BoardSnapshot = {
  board: MOCK_BOARD,
  lists: MOCK_LISTS,
  labels: MOCK_LABELS,
  cards: MOCK_CARDS,
};

/** Trả bản sao sâu để reducer mutate thoải mái mà không bẩn module state */
export const getMockSnapshot = (): BoardSnapshot => structuredClone(MOCK_SNAPSHOT);
