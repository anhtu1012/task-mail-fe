"use client";

/**
 * Store cho bảng công việc cá nhân, chạy trên MOCK.
 *
 * Mỗi action ở đây là 1 lời gọi API trong tương lai — tên action đặt trùng tên
 * endpoint trong docs/backend/board-spec.md, để lúc nối BE chỉ cần thay thân
 * reducer bằng mutation của React Query, component không đổi một dòng nào.
 */
import {
  ReactNode,
  createContext,
  useContext,
  useMemo,
  useReducer,
  useState,
} from "react";
import {
  Board,
  BoardCard,
  BoardLabel,
  BoardList,
  BoardSnapshot,
  byPosition,
  computePosition,
} from "@/models/board";
import { TaskCategory, TaskPriority } from "@/models/task";
import { getMockSnapshot } from "@/mocks/board.mock";
import { quickParse } from "@/utils/client/quickParse";
import { richTextToPlain } from "@/utils/client/richText";
import { useStickyState } from "./useStickyState";

// ==========================================
// ACTIONS
// ==========================================
export type BoardAction =
  /** PATCH /cards/:id/move */
  | { type: "MOVE_CARD"; cardId: string; toListId: string | null; toIndex: number }
  /** POST /lists/:id/cards — text đi qua quickParse để tách hạn/ưu tiên/nhãn */
  | { type: "ADD_CARD"; listId: string | null; text: string; atTop?: boolean }
  /** PATCH /cards/:id */
  | { type: "UPDATE_CARD"; cardId: string; patch: Partial<BoardCard> }
  /** DELETE /cards/:id */
  | { type: "DELETE_CARD"; cardId: string }
  /** PATCH /cards/:id/snooze — dời hạn sang mốc mới */
  | { type: "SNOOZE_CARD"; cardId: string; deadline: string | null; label: string }
  /** POST /boards/:id/lists */
  | { type: "ADD_LIST"; title: string }
  /** PATCH /lists/:id */
  | { type: "RENAME_LIST"; listId: string; title: string }
  /** PATCH /lists/:id { archived: true } */
  | { type: "ARCHIVE_LIST"; listId: string }
  /** PATCH /lists/:id/move */
  | { type: "MOVE_LIST"; listId: string; toIndex: number }
  /** PATCH /checklist-items/:id */
  | { type: "TOGGLE_CHECKLIST_ITEM"; cardId: string; itemId: string }
  /** POST /checklists/:id/items */
  | { type: "ADD_CHECKLIST_ITEM"; cardId: string; checklistId: string; content: string }
  /** DELETE /checklist-items/:id */
  | { type: "DELETE_CHECKLIST_ITEM"; cardId: string; itemId: string }
  /** POST /cards/:id/checklists */
  | { type: "ADD_CHECKLIST"; cardId: string; title: string }
  /** POST /cards/:id/notes */
  | { type: "ADD_NOTE"; cardId: string; content: string }
  /** DELETE /notes/:id */
  | { type: "DELETE_NOTE"; cardId: string; noteId: string }
  /** PATCH /cards/:id/complete */
  | { type: "TOGGLE_COMPLETE"; cardId: string }
  /** PATCH /boards/:id */
  | { type: "TOGGLE_STAR" };

// ==========================================
// HELPERS
// ==========================================
let idCounter = 0;
/** Id tạm cho bản ghi optimistic — BE trả id thật thì thay lại */
const tmpId = (prefix: string) => `${prefix}-tmp-${++idCounter}`;

/** Chỉ sinh khi người dùng thao tác, nên không ảnh hưởng SSR */
const now = () => new Date().toISOString();

/**
 * Tính position khi thả thẻ vào vị trí `toIndex` của danh sách đích.
 * Chỉ nhìn 2 hàng xóm -> đúng 1 row bị ghi, không re-index cả danh sách.
 */
const positionAt = (siblings: BoardCard[], toIndex: number): number =>
  computePosition(siblings[toIndex - 1]?.position, siblings[toIndex]?.position);

const replaceCard = (
  cards: BoardCard[],
  cardId: string,
  update: (card: BoardCard) => BoardCard,
): BoardCard[] =>
  cards.map((c) => (c.id === cardId ? { ...update(c), updatedAt: now() } : c));

/** Ghi một dòng nhật ký cho thẻ */
const logActivity = (
  card: BoardCard,
  action: BoardCard["activities"][number]["action"],
  message: string,
): BoardCard => ({
  ...card,
  activities: [
    ...card.activities,
    { id: tmpId("act"), cardId: card.id, action, message, createdAt: now() },
  ],
});

// ==========================================
// REDUCER
// ==========================================
function reducer(state: BoardSnapshot, action: BoardAction): BoardSnapshot {
  switch (action.type) {
    case "MOVE_CARD": {
      const card = state.cards.find((c) => c.id === action.cardId);
      if (!card) return state;

      // Anh em ở danh sách đích, đã bỏ chính thẻ đang kéo ra
      const siblings = state.cards
        .filter((c) => c.listId === action.toListId && c.id !== action.cardId)
        .sort(byPosition);

      const position = positionAt(siblings, action.toIndex);
      if (card.listId === action.toListId && card.position === position) return state;

      const changedList = card.listId !== action.toListId;
      const toName =
        action.toListId === null
          ? "Hộp thư đến"
          : (state.lists.find((l) => l.id === action.toListId)?.title ?? "danh sách khác");
      const fromName =
        card.listId === null
          ? "Hộp thư đến"
          : (state.lists.find((l) => l.id === card.listId)?.title ?? "danh sách cũ");

      return {
        ...state,
        cards: replaceCard(state.cards, action.cardId, (c) => {
          const moved = { ...c, listId: action.toListId, position };
          return changedList
            ? logActivity(moved, "CARD_MOVED", `Chuyển từ ${fromName} sang ${toName}`)
            : moved;
        }),
      };
    }

    case "ADD_CARD": {
      // Tách hạn / ưu tiên / nhãn / thời lượng ngay từ dòng người dùng gõ
      const parsed = quickParse(action.text);
      const labelIds = parsed.labelSlugs
        .map((slug) => state.labels.find((l) => l.slug === slug)?.id)
        .filter((id): id is string => !!id);

      const siblings = state.cards
        .filter((c) => c.listId === action.listId)
        .sort(byPosition);
      const id = tmpId("card");

      const card: BoardCard = {
        id,
        listId: action.listId,
        boardId: state.board.id,
        code: "Việc mới",
        title: parsed.title,
        description: null,
        position: positionAt(siblings, action.atTop ? 0 : siblings.length),
        labelIds,
        category: TaskCategory.WORK,
        priority: parsed.priority ?? TaskPriority.NORMAL,
        deadline: parsed.deadline,
        deadlineStatus: "IN_PROGRESS",
        completedAt: null,
        estimateMinutes: parsed.estimateMinutes,
        repeat: null,
        source: "MANUAL",
        sourceMail: null,
        cover: null,
        checklists: [],
        attachments: [],
        notes: [],
        activities: [
          {
            id: tmpId("act"),
            cardId: id,
            action: "CARD_CREATED",
            message: "Tạo việc",
            createdAt: now(),
          },
        ],
        createdAt: now(),
        updatedAt: now(),
      };
      return { ...state, cards: [...state.cards, card] };
    }

    case "UPDATE_CARD":
      return {
        ...state,
        cards: replaceCard(state.cards, action.cardId, (c) => ({ ...c, ...action.patch })),
      };

    case "SNOOZE_CARD":
      return {
        ...state,
        cards: replaceCard(state.cards, action.cardId, (c) =>
          logActivity(
            { ...c, deadline: action.deadline, deadlineStatus: "IN_PROGRESS" },
            "SNOOZED",
            `Dời hạn sang ${action.label}`,
          ),
        ),
      };

    case "DELETE_CARD":
      return { ...state, cards: state.cards.filter((c) => c.id !== action.cardId) };

    case "ADD_LIST": {
      const last = [...state.lists].sort(byPosition).at(-1);
      const list: BoardList = {
        id: tmpId("list"),
        boardId: state.board.id,
        title: action.title,
        position: computePosition(last?.position, undefined),
        archived: false,
        wipLimit: null,
        createdAt: now(),
      };
      return { ...state, lists: [...state.lists, list] };
    }

    case "RENAME_LIST":
      return {
        ...state,
        lists: state.lists.map((l) =>
          l.id === action.listId ? { ...l, title: action.title } : l,
        ),
      };

    case "ARCHIVE_LIST":
      return {
        ...state,
        lists: state.lists.map((l) =>
          l.id === action.listId ? { ...l, archived: true } : l,
        ),
        // Thẻ trong danh sách bị lưu trữ quay về Hộp thư đến thay vì biến mất
        cards: state.cards.map((c) =>
          c.listId === action.listId ? { ...c, listId: null } : c,
        ),
      };

    case "MOVE_LIST": {
      const ordered = state.lists.filter((l) => !l.archived).sort(byPosition);
      const others = ordered.filter((l) => l.id !== action.listId);
      const position = computePosition(
        others[action.toIndex - 1]?.position,
        others[action.toIndex]?.position,
      );
      return {
        ...state,
        lists: state.lists.map((l) =>
          l.id === action.listId ? { ...l, position } : l,
        ),
      };
    }

    case "TOGGLE_CHECKLIST_ITEM": {
      const card = state.cards.find((c) => c.id === action.cardId);
      const item = card?.checklists
        .flatMap((cl) => cl.items)
        .find((i) => i.id === action.itemId);
      return {
        ...state,
        cards: replaceCard(state.cards, action.cardId, (c) => {
          const next = {
            ...c,
            checklists: c.checklists.map((cl) => ({
              ...cl,
              items: cl.items.map((it) =>
                it.id === action.itemId ? { ...it, checked: !it.checked } : it,
              ),
            })),
          };
          // Chỉ ghi nhật ký khi tick, bỏ tick thì không ghi cho đỡ rác
          return item && !item.checked
            ? logActivity(next, "CHECKLIST_ITEM_CHECKED", `Hoàn thành mục “${item.content}”`)
            : next;
        }),
      };
    }

    case "ADD_CHECKLIST_ITEM":
      return {
        ...state,
        cards: replaceCard(state.cards, action.cardId, (c) => ({
          ...c,
          checklists: c.checklists.map((cl) =>
            cl.id !== action.checklistId
              ? cl
              : {
                  ...cl,
                  items: [
                    ...cl.items,
                    {
                      id: tmpId("item"),
                      checklistId: cl.id,
                      content: action.content,
                      checked: false,
                      position: computePosition(cl.items.at(-1)?.position, undefined),
                    },
                  ],
                },
          ),
        })),
      };

    case "DELETE_CHECKLIST_ITEM":
      return {
        ...state,
        cards: replaceCard(state.cards, action.cardId, (c) => ({
          ...c,
          checklists: c.checklists.map((cl) => ({
            ...cl,
            items: cl.items.filter((it) => it.id !== action.itemId),
          })),
        })),
      };

    case "ADD_CHECKLIST":
      return {
        ...state,
        cards: replaceCard(state.cards, action.cardId, (c) => ({
          ...c,
          checklists: [
            ...c.checklists,
            {
              id: tmpId("checklist"),
              cardId: c.id,
              title: action.title,
              position: computePosition(c.checklists.at(-1)?.position, undefined),
              items: [],
            },
          ],
        })),
      };

    case "ADD_NOTE":
      return {
        ...state,
        cards: replaceCard(state.cards, action.cardId, (c) => ({
          ...c,
          notes: [
            ...c.notes,
            {
              id: tmpId("note"),
              cardId: c.id,
              content: action.content,
              createdAt: now(),
              editedAt: null,
            },
          ],
        })),
      };

    case "DELETE_NOTE":
      return {
        ...state,
        cards: replaceCard(state.cards, action.cardId, (c) => ({
          ...c,
          notes: c.notes.filter((n) => n.id !== action.noteId),
        })),
      };

    case "TOGGLE_COMPLETE":
      return {
        ...state,
        cards: replaceCard(state.cards, action.cardId, (c) =>
          logActivity(
            { ...c, completedAt: c.completedAt ? null : now() },
            c.completedAt ? "CARD_REOPENED" : "CARD_COMPLETED",
            c.completedAt ? "Mở lại việc" : "Đánh dấu hoàn thành",
          ),
        ),
      };

    case "TOGGLE_STAR":
      return { ...state, board: { ...state.board, starred: !state.board.starred } };

    default:
      return state;
  }
}

// ==========================================
// LỊCH SỬ — HOÀN TÁC / LÀM LẠI
// ==========================================
/**
 * Kéo nhầm một thẻ qua cột khác là chuyện xảy ra liên tục, và không có cách nào
 * "kéo ngược lại cho đúng chỗ cũ" vì vị trí cũ đã mất. Vì vậy Ctrl+Z là tính
 * năng bắt buộc chứ không phải tiện ích.
 *
 * Lưu nguyên snapshot thay vì lưu action đảo ngược: mỗi snapshot chỉ là object
 * với vài mảng chia sẻ tham chiếu (reducer bất biến), nên 50 bước lịch sử
 * gần như không tốn thêm bộ nhớ.
 */
const HISTORY_LIMIT = 50;

type HistoryEntry = { snapshot: BoardSnapshot; label: string };

type HistoryState = {
  past: HistoryEntry[];
  present: BoardSnapshot;
  future: HistoryEntry[];
  /** Mô tả thao tác vừa thực hiện, để hiện trên nút hoàn tác */
  lastLabel: string | null;
};

/** Nhãn tiếng Việt cho từng thao tác — hiện trong tooltip "Hoàn tác ..." */
const ACTION_LABEL: Record<BoardAction["type"], string> = {
  MOVE_CARD: "di chuyển việc",
  ADD_CARD: "thêm việc",
  UPDATE_CARD: "sửa việc",
  DELETE_CARD: "xoá việc",
  SNOOZE_CARD: "dời hạn",
  ADD_LIST: "thêm danh sách",
  RENAME_LIST: "đổi tên danh sách",
  ARCHIVE_LIST: "lưu trữ danh sách",
  MOVE_LIST: "di chuyển danh sách",
  TOGGLE_CHECKLIST_ITEM: "tick việc cần làm",
  ADD_CHECKLIST_ITEM: "thêm mục",
  DELETE_CHECKLIST_ITEM: "xoá mục",
  ADD_CHECKLIST: "thêm danh sách việc cần làm",
  ADD_NOTE: "thêm ghi chú",
  DELETE_NOTE: "xoá ghi chú",
  TOGGLE_COMPLETE: "đổi trạng thái hoàn thành",
  TOGGLE_STAR: "đánh dấu sao",
};

type HistoryAction = BoardAction | { type: "UNDO" } | { type: "REDO" };

function historyReducer(state: HistoryState, action: HistoryAction): HistoryState {
  if (action.type === "UNDO") {
    const prev = state.past.at(-1);
    if (!prev) return state;
    return {
      past: state.past.slice(0, -1),
      present: prev.snapshot,
      future: [{ snapshot: state.present, label: prev.label }, ...state.future],
      lastLabel: state.past.at(-2)?.label ?? null,
    };
  }

  if (action.type === "REDO") {
    const next = state.future[0];
    if (!next) return state;
    return {
      past: [...state.past, { snapshot: state.present, label: next.label }],
      present: next.snapshot,
      future: state.future.slice(1),
      lastLabel: next.label,
    };
  }

  const present = reducer(state.present, action);
  // Reducer trả nguyên state cũ (thao tác không đổi gì) -> đừng ghi vào lịch sử
  if (present === state.present) return state;

  const label = ACTION_LABEL[action.type];
  return {
    past: [...state.past, { snapshot: state.present, label }].slice(-HISTORY_LIMIT),
    present,
    future: [],
    lastLabel: label,
  };
}

// ==========================================
// BỘ LỌC (client-side, sau này đẩy sang query param)
// ==========================================
export type BoardFilter = {
  keyword: string;
  labelIds: string[];
  /** Chỉ hiện việc quá hạn */
  overdueOnly: boolean;
  /** Chỉ hiện việc có hạn trong hôm nay */
  todayOnly: boolean;
};

const EMPTY_FILTER: BoardFilter = {
  keyword: "",
  labelIds: [],
  overdueOnly: false,
  todayOnly: false,
};

const isSameDay = (iso: string, ref: Date) => {
  const d = new Date(iso);
  return (
    d.getFullYear() === ref.getFullYear() &&
    d.getMonth() === ref.getMonth() &&
    d.getDate() === ref.getDate()
  );
};

const matchesFilter = (card: BoardCard, filter: BoardFilter, today: Date): boolean => {
  const kw = filter.keyword.trim().toLowerCase();
  if (
    kw &&
    !card.title.toLowerCase().includes(kw) &&
    !card.code.toLowerCase().includes(kw) &&
    !richTextToPlain(card.description).toLowerCase().includes(kw)
  ) {
    return false;
  }
  if (filter.labelIds.length && !card.labelIds.some((id) => filter.labelIds.includes(id))) {
    return false;
  }
  if (filter.overdueOnly && card.deadlineStatus !== "LATE") return false;
  if (filter.todayOnly && !(card.deadline && isSameDay(card.deadline, today))) return false;
  return true;
};

// ==========================================
// THỐNG KÊ HÔM NAY
// ==========================================
export type TodayStats = {
  overdue: number;
  dueToday: number;
  doneToday: number;
  /** Tổng thời lượng dự kiến của việc còn phải làm hôm nay (phút) */
  plannedMinutes: number;
};

// ==========================================
// CONTEXT
// ==========================================
type BoardContextValue = {
  board: Board;
  lists: BoardList[];
  labels: BoardLabel[];
  /** Thẻ đã lọc, nhóm theo listId, đã sắp theo position */
  cardsByList: Map<string, BoardCard[]>;
  /** Thẻ chưa phân loại (listId = null) — nguồn email/Zalo */
  inboxCards: BoardCard[];
  /** Tổng số thẻ mỗi danh sách TRƯỚC khi lọc, để hiện "3/12" khi đang bật lọc */
  totalByList: Map<string, number>;
  labelById: Map<string, BoardLabel>;
  cardById: Map<string, BoardCard>;
  today: TodayStats;
  filter: BoardFilter;
  setFilter: (next: BoardFilter) => void;
  filterActive: boolean;
  dispatch: (action: BoardAction) => void;

  /** Hoàn tác / làm lại */
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  lastLabel: string | null;

  /** Trạng thái giao diện, nhớ lại giữa các lần mở trang */
  fullscreen: boolean;
  setFullscreen: (v: boolean) => void;
  agendaOpen: boolean;
  setAgendaOpen: (v: boolean) => void;
  paletteOpen: boolean;
  setPaletteOpen: (v: boolean) => void;
};

const BoardContext = createContext<BoardContextValue | null>(null);

export function BoardProvider({ children }: { children: ReactNode }) {
  const [history, dispatch] = useReducer(historyReducer, undefined, () => ({
    past: [],
    present: getMockSnapshot(),
    future: [],
    lastLabel: null,
  }));
  const state = history.present;

  const [filter, setFilter] = useState<BoardFilter>(EMPTY_FILTER);
  const [fullscreen, setFullscreen] = useStickyState("board:fullscreen", false);
  const [agendaOpen, setAgendaOpen] = useStickyState("board:agenda", true);
  // Bảng lệnh luôn đóng khi mở trang — không phải thứ đáng nhớ lại
  const [paletteOpen, setPaletteOpen] = useState(false);

  const value = useMemo<BoardContextValue>(() => {
    // Mốc "hôm nay" chốt một lần cho cả lần tính này
    const today = new Date();
    const lists = state.lists.filter((l) => !l.archived).sort(byPosition);

    const cardsByList = new Map<string, BoardCard[]>();
    const totalByList = new Map<string, number>();
    lists.forEach((l) => {
      cardsByList.set(l.id, []);
      totalByList.set(l.id, 0);
    });

    const inboxCards: BoardCard[] = [];
    const stats: TodayStats = { overdue: 0, dueToday: 0, doneToday: 0, plannedMinutes: 0 };

    state.cards.forEach((card) => {
      const done = card.completedAt !== null;
      if (done && isSameDay(card.completedAt!, today)) stats.doneToday += 1;
      if (!done && card.deadlineStatus === "LATE") stats.overdue += 1;
      if (!done && card.deadline && isSameDay(card.deadline, today)) {
        stats.dueToday += 1;
        stats.plannedMinutes += card.estimateMinutes ?? 0;
      }

      if (card.listId === null) {
        if (matchesFilter(card, filter, today)) inboxCards.push(card);
        return;
      }
      totalByList.set(card.listId, (totalByList.get(card.listId) ?? 0) + 1);
      if (matchesFilter(card, filter, today)) cardsByList.get(card.listId)?.push(card);
    });

    cardsByList.forEach((list) => list.sort(byPosition));
    inboxCards.sort(byPosition);

    return {
      board: state.board,
      lists,
      labels: state.labels,
      cardsByList,
      inboxCards,
      totalByList,
      labelById: new Map(state.labels.map((l) => [l.id, l])),
      cardById: new Map(state.cards.map((c) => [c.id, c])),
      today: stats,
      filter,
      setFilter,
      filterActive:
        !!filter.keyword ||
        filter.labelIds.length > 0 ||
        filter.overdueOnly ||
        filter.todayOnly,
      dispatch,

      undo: () => dispatch({ type: "UNDO" }),
      redo: () => dispatch({ type: "REDO" }),
      canUndo: history.past.length > 0,
      canRedo: history.future.length > 0,
      lastLabel: history.lastLabel,

      fullscreen,
      setFullscreen,
      agendaOpen,
      setAgendaOpen,
      paletteOpen,
      setPaletteOpen,
    };
  }, [
    state,
    filter,
    history.past.length,
    history.future.length,
    history.lastLabel,
    fullscreen,
    setFullscreen,
    agendaOpen,
    setAgendaOpen,
    paletteOpen,
  ]);

  return <BoardContext.Provider value={value}>{children}</BoardContext.Provider>;
}

export function useBoard(): BoardContextValue {
  const ctx = useContext(BoardContext);
  if (!ctx) throw new Error("useBoard phải nằm trong <BoardProvider>");
  return ctx;
}
