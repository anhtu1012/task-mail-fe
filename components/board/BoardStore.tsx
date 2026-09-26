"use client";

/**
 * Store của bảng công việc — chạy trên API THẬT.
 *
 * Kiến trúc:
 *   - Một query duy nhất `GET /boards/me/full` dựng cả màn (§3.1 hợp đồng).
 *   - Mọi thao tác ghi đều cập nhật lạc quan thẳng vào cache trước, gọi API sau.
 *     Kéo thả mà phải đợi mạng thì cảm giác như bị treo.
 *   - Lỗi thì không tự vá lại cache bằng tay mà `invalidate` để tải lại sự thật
 *     từ server. Vá tay dễ tạo ra trạng thái lệch mà không ai phát hiện.
 *
 * Hoàn tác: KHÔNG lưu snapshot như bản mock nữa, vì dữ liệu giờ nằm ở server.
 * Mỗi thao tác tự đăng ký một cặp hàm nghịch đảo (undo/redo) gọi lại API —
 * backend đã làm sẵn `?undo=true`, `restore`, `reopen` đúng cho việc này (§9).
 */
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useDeferredValue,
  useMemo,
  useRef,
  useState,
} from "react";
import { App } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { boardApi } from "@/apis/board.api";
import {
  Board,
  BoardLabel,
  BoardList,
  BoardSnapshot,
  CardSummary,
  CardDetail,
  CreateCardInput,
  INBOX_KEY,
  LABEL_COLORS,
  SaveLabelInput,
  TodayStats,
  UpdateCardInput,
  byPosition,
  computePosition,
} from "@/models/board";
import { TaskPriority, TaskStatus } from "@/models/task";
import { useCurrentProject } from "@/hooks/useProjects";
import { getApiErrorMessage } from "@/utils/client/apiError";
import { quickParse } from "@/utils/client/quickParse";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  setAgendaOpen as setAgendaOpenRd,
  toggleAgendaOpen as toggleAgendaOpenRd,
  setInboxCollapsed as setInboxCollapsedRd,
  toggleInboxCollapsed as toggleInboxCollapsedRd,
} from "@/store/slices/boardView";
import { useStickyState } from "./useStickyState";
import { BOARD_QUERY_KEY } from "@/hooks/boardKeys";

/**
 * Khoá cache của bảng KHÔNG chứa projectId, dù mỗi dự án có một bảng riêng.
 *
 * Lý do: mọi cập nhật lạc quan trong file này vá thẳng vào khoá hằng số này.
 * Nhét projectId vào đây sẽ phải luồn nó qua vài chục chỗ mà chẳng được thêm
 * gì — vì `useSwitchProject` đã xoá sạch cache `["board", ...]` mỗi lần đổi dự
 * án, nên không bao giờ có chuyện bảng của dự án cũ còn nằm lại. Quay lại dự
 * án cũ thì `useSwitchProject` nạp bản cất (`boardStashKey`) để hiện ngay,
 * rồi tải lại ở nền.
 */
export { BOARD_QUERY_KEY };
/** Dòng ghi chú của tab "Ghi chú" (mobile). Đầu khoá "board" để đổi dự án là bị dọn cùng */
export const NOTES_FEED_KEY = ["board", "notes-feed"] as const;
/** Việc quá hạn + đến hạn hôm nay — dùng chung cho Lịch hôm nay và tab Hôm nay */
export const AGENDA_QUERY_KEY = ["board", "agenda"] as const;

/**
 * Khoá cache của MỘT thẻ đang mở chi tiết.
 *
 * Đặt ở đây chứ không ở `useCardDetail` vì cả hai chiều đều cần: hook chi tiết
 * ghi vào snapshot, và snapshot (hoàn thành / mở lại / sửa thẻ) phải ghi ngược
 * vào chi tiết. Để mỗi bên tự viết khoá là mở đường cho hai chuỗi lệch nhau.
 */
export const cardDetailKey = (cardId: string) =>
  ["board", "card", cardId] as const;

/**
 * Một thẻ vừa bấm thêm, chưa có id thật.
 *
 * Tồn tại vì tạo thẻ phải đi một vòng mạng (và đôi khi hai vòng, nếu quick-add
 * còn phải tạo nhãn mới trước). Trước đây trong quãng đó màn hình **không đổi
 * gì cả** — người dùng bấm Enter, không thấy gì, nên bấm tiếp và tạo ra hai
 * việc trùng nhau.
 *
 * Cố tình KHÔNG nhét một `CardSummary` giả vào cache: thẻ giả sẽ lọt vào bộ
 * lọc, phép đếm, kéo thả và cả Ctrl+Z. Đây là danh sách riêng, chỉ để vẽ.
 */
export type PendingAdd = {
  key: string;
  listId: string | null;
  title: string;
  atTop: boolean;
};

// ==========================================
// HOÀN TÁC
// ==========================================
type UndoEntry = {
  label: string;
  undo: () => Promise<unknown>;
  redo: () => Promise<unknown>;
  /**
   * Vá cache ngay tại chỗ cho bước hoàn tác / làm lại. Có thì màn hình đổi
   * tức thì và không phải tải lại cả snapshot; không có (bước mà chỉ server
   * biết kết quả, vd. lưu trữ cột) thì tải lại như cũ.
   */
  applyUndo?: () => void;
  applyRedo?: () => void;
};

/** Cột vừa bấm thêm, chưa có id thật — chỉ để vẽ, giống `PendingAdd` */
export type PendingList = { key: string; title: string };

const HISTORY_LIMIT = 50;

// ==========================================
// BỘ LỌC
// ==========================================
export type BoardFilter = {
  keyword: string;
  labelIds: string[];
  overdueOnly: boolean;
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

const matchesFilter = (card: CardSummary, filter: BoardFilter, today: Date): boolean => {
  const kw = filter.keyword.trim().toLowerCase();
  if (kw && !card.title.toLowerCase().includes(kw) && !card.code.toLowerCase().includes(kw)) {
    return false;
  }
  if (filter.labelIds.length && !card.labelIds.some((id) => filter.labelIds.includes(id))) {
    return false;
  }
  if (filter.overdueOnly && card.deadlineStatus !== "LATE") return false;
  if (filter.todayOnly && !(card.deadline && isSameDay(card.deadline, today))) return false;
  return true;
};

/** Phần của một bản vá `UpdateCardInput` mà thẻ ngoài canvas hiển thị được */
const summaryFields = (patch: UpdateCardInput): Partial<CardSummary> => ({
  ...(patch.title !== undefined ? { title: patch.title } : {}),
  ...(patch.priority !== undefined ? { priority: patch.priority } : {}),
  ...(patch.cover !== undefined ? { cover: patch.cover } : {}),
  ...(patch.deadline !== undefined ? { deadline: patch.deadline } : {}),
  ...(patch.description !== undefined ? { hasDescription: !!patch.description } : {}),
});

// ==========================================
// CONTEXT
// ==========================================
type BoardContextValue = {
  /** null khi chưa tải xong — component phải chịu được trạng thái này */
  board: Board | null;
  lists: BoardList[];
  /** Danh sách đã lưu trữ — snapshot vẫn trả về, chỉ ẩn khỏi bảng */
  archivedLists: BoardList[];
  labels: BoardLabel[];
  cardsByList: Map<string, CardSummary[]>;
  inboxCards: CardSummary[];
  /** Tổng thật mỗi cột từ `cardCounts` của server, không phải số thẻ đã tải */
  totalByList: Map<string, number>;
  inboxTotal: number;
  labelById: Map<string, BoardLabel>;
  cardById: Map<string, CardSummary>;
  today: TodayStats;

  isLoading: boolean;
  isFetching: boolean;
  error: unknown;
  refetch: () => void;

  filter: BoardFilter;
  setFilter: (next: BoardFilter) => void;
  filterActive: boolean;

  // --- thao tác ---
  /**
   * Chỉ sửa cache để thấy chỗ trống mở ra trong lúc kéo — KHÔNG gọi API.
   * onDragOver chạy liên tục, gọi API ở đây là bắn hàng chục request mỗi lần kéo.
   */
  previewMove: (cardId: string, toListId: string | null, toIndex: number) => void;
  /** Gọi một lần lúc thả, với vị trí gốc để còn hoàn tác được */
  commitMove: (cardId: string, from: { listId: string | null; position: number }) => void;
  /**
   * Bất đồng bộ vì có thể phải tạo nhãn mới trước khi tạo thẻ (quick-add gõ
   * "#nhãnchưacó"). Ô nhập `await` để hiện trạng thái đang lưu.
   */
  addCard: (listId: string | null, text: string, atTop?: boolean) => Promise<void>;
  /** Thẻ đang chờ server trả lời — cột vẽ ô mờ ở đúng chỗ nó sắp xuất hiện */
  pendingAdds: PendingAdd[];
  pendingLists: PendingList[];
  updateCard: (cardId: string, patch: UpdateCardInput) => void;
  deleteCard: (cardId: string) => void;
  snoozeCard: (cardId: string, deadline: string | null, label: string) => void;
  /** Trả về Promise để nút bấm hiện được trạng thái đang chờ */
  toggleComplete: (cardId: string) => Promise<void>;
  /** Chuyển thẻ xuống cuối một cột khác — lối đi không cần kéo thả */
  moveCardToList: (cardId: string, toListId: string | null) => void;
  addList: (title: string) => void;
  renameList: (listId: string, title: string) => void;
  archiveList: (listId: string) => void;
  /** Mở lại một danh sách đã lưu trữ (cột trở lại bảng, rỗng) */
  restoreList: (listId: string) => void;
  moveList: (listId: string, toIndex: number) => void;
  toggleStar: () => void;

  // --- nhãn ---
  createLabel: (input: {
    name: string;
    color: string;
    icon?: string | null;
  }) => Promise<BoardLabel | null>;
  updateLabel: (labelId: string, input: SaveLabelInput) => Promise<void>;
  deleteLabel: (labelId: string) => Promise<void>;
  /** Gắn nếu chưa có, gỡ nếu đã có — một nút bấm cho cả hai chiều */
  toggleCardLabel: (cardId: string, labelId: string) => void;

  /** Tải trang thẻ kế tiếp của một cột (`null` = Hộp thư đến) */
  loadMoreCards: (listId: string | null) => Promise<void>;
  loadingMore: string | null;

  // --- hoàn tác ---
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  lastLabel: string | null;

  // --- giao diện ---
  fullscreen: boolean;
  setFullscreen: (v: boolean) => void;
  agendaOpen: boolean;
  setAgendaOpen: (v: boolean) => void;
  toggleAgendaOpen: () => void;
  inboxCollapsed: boolean;
  setInboxCollapsed: (v: boolean) => void;
  toggleInboxCollapsed: () => void;
  paletteOpen: boolean;
  setPaletteOpen: (v: boolean) => void;
};

/**
 * Ba context thay vì một — lý do là hiệu năng, không phải thẩm mỹ.
 *
 * Trước đây mọi thứ nằm chung một `value`: vá một thẻ trong cache là tạo value
 * mới, và MỌI `CardTile` / `ListColumn` (đều gọi `useBoard()`) render lại dù
 * đã bọc `memo` — context đổi thì memo vô dụng. Kéo một thẻ = vài trăm thẻ vẽ
 * lại trên mỗi lần onDragOver.
 *
 *   - `ActionsContext`: chỉ hàm, tham chiếu KHÔNG BAO GIỜ đổi (hàm đọc cache
 *     trực tiếp qua `getSnap()` thay vì đóng gói `data` vào closure).
 *   - `MetaContext`: board / cột / nhãn — chỉ đổi khi chính chúng đổi, không
 *     đổi khi vá thẻ (patchSnapshot giữ nguyên tham chiếu `lists`, `labels`).
 *   - `BoardContext`: đầy đủ, cho các panel ít phần tử (thanh công cụ, Inbox...).
 *
 * Thẻ và cột chỉ đọc hai context đầu, nên vá một thẻ chỉ vẽ lại đúng thẻ đó.
 */
export type BoardActions = Pick<
  BoardContextValue,
  | "refetch"
  | "setFilter"
  | "previewMove"
  | "commitMove"
  | "addCard"
  | "updateCard"
  | "deleteCard"
  | "snoozeCard"
  | "toggleComplete"
  | "moveCardToList"
  | "addList"
  | "renameList"
  | "archiveList"
  | "restoreList"
  | "moveList"
  | "toggleStar"
  | "createLabel"
  | "updateLabel"
  | "deleteLabel"
  | "toggleCardLabel"
  | "loadMoreCards"
  | "undo"
  | "redo"
  | "setFullscreen"
  | "setAgendaOpen"
  | "toggleAgendaOpen"
  | "setInboxCollapsed"
  | "toggleInboxCollapsed"
  | "setPaletteOpen"
>;

export type BoardMeta = Pick<
  BoardContextValue,
  "board" | "lists" | "archivedLists" | "labels" | "labelById"
>;

/** Phần còn lại: dữ liệu thẻ, trạng thái tải, bộ lọc, lịch sử... */
type BoardState = Omit<BoardContextValue, keyof BoardActions | keyof BoardMeta>;

const BoardContext = createContext<BoardState | null>(null);
const ActionsContext = createContext<BoardActions | null>(null);
const MetaContext = createContext<BoardMeta | null>(null);

const EMPTY_TODAY: TodayStats = {
  overdue: 0,
  dueToday: 0,
  doneToday: 0,
  plannedMinutes: 0,
};

// Hằng số để `?? []` không sinh mảng mới mỗi lần render (làm vỡ useMemo)
const NO_LISTS: BoardList[] = [];
const NO_CARDS: CardSummary[] = [];
const NO_LABELS: BoardLabel[] = [];
const NO_COUNTS: Record<string, number> = {};

export function BoardProvider({ children }: { children: ReactNode }) {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const { projectId } = useCurrentProject();
  const dispatch = useAppDispatch();

  const [filter, setFilter] = useState<BoardFilter>(EMPTY_FILTER);
  /*
   * Ô tìm kiếm cập nhật `filter.keyword` trên từng phím, nhưng việc lọc lại cả
   * bảng dùng bản "hoãn" — React ưu tiên vẽ chữ vừa gõ trước, lọc sau. Thiếu
   * cái này thì gõ nhanh trên bảng vài trăm thẻ sẽ thấy chữ hiện trễ.
   */
  const deferredKeyword = useDeferredValue(filter.keyword);
  const [fullscreen, setFullscreen] = useStickyState("board:fullscreen", false);

  // Trạng thái mở/đóng của Lịch hôm nay và Hộp thư đến lưu trên Redux (có persist)
  const agendaOpen = useAppSelector((state) => state.boardView?.agendaOpen ?? true);
  const inboxCollapsed = useAppSelector((state) => state.boardView?.inboxCollapsed ?? false);

  const setAgendaOpen = useCallback(
    (open: boolean) => {
      dispatch(setAgendaOpenRd(open));
    },
    [dispatch],
  );

  const toggleAgendaOpen = useCallback(() => {
    dispatch(toggleAgendaOpenRd());
  }, [dispatch]);

  const setInboxCollapsed = useCallback(
    (collapsed: boolean) => {
      dispatch(setInboxCollapsedRd(collapsed));
    },
    [dispatch],
  );

  const toggleInboxCollapsed = useCallback(() => {
    dispatch(toggleInboxCollapsedRd());
  }, [dispatch]);

  const [paletteOpen, setPaletteOpen] = useState(false);
  /** Khoá cột đang tải trang kế tiếp — để đúng một nút hiện trạng thái chờ */
  const [loadingMore, setLoadingMore] = useState<string | null>(null);
  const [pendingAdds, setPendingAdds] = useState<PendingAdd[]>([]);
  const [pendingLists, setPendingLists] = useState<PendingList[]>([]);

  /*
   * Lịch sử hoàn tác nằm trong REF để `undo`/`redo`/`pushHistory` giữ tham
   * chiếu cố định (nếu là state, mỗi bước ghi sẽ tạo hàm undo mới -> context
   * hành động đổi -> cả bảng vẽ lại). Nút hoàn tác đọc bản chụp `historyUi`
   * là state, nên vẫn render lại đúng lúc — đọc ref trong render thì không.
   */
  const historyRef = useRef<{ past: UndoEntry[]; future: UndoEntry[] }>({
    past: [],
    future: [],
  });
  const [historyUi, setHistoryUi] = useState<{
    canUndo: boolean;
    canRedo: boolean;
    lastLabel: string | null;
  }>({ canUndo: false, canRedo: false, lastLabel: null });

  const syncHistory = useCallback(() => {
    const { past, future } = historyRef.current;
    setHistoryUi({
      canUndo: past.length > 0,
      canRedo: future.length > 0,
      lastLabel: past.at(-1)?.label ?? null,
    });
  }, []);

  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: BOARD_QUERY_KEY,
    queryFn: () => boardApi.snapshot(projectId ?? undefined),
    enabled: !!projectId,
    // Thao tác kéo thả đã cập nhật lạc quan rồi, không cần tải lại liên tục
    staleTime: 30_000,
    /*
     * Quay lại tab thì làm mới — TRỪ khi lệnh di chuyển thẻ (useMutation)
     * còn đang bay. Tải lại giữa chừng sẽ trả về trạng thái trước lệnh ghi:
     * thẻ vừa kéo nhảy về chỗ cũ rồi nhảy lại khi lệnh ghi xong.
     */
    refetchOnWindowFocus: () => queryClient.isMutating() === 0,
  });

  /** Đọc cache MỚI NHẤT — dùng trong hàm thao tác thay cho `data` của lần render */
  const getSnap = useCallback(
    () => queryClient.getQueryData<BoardSnapshot>(BOARD_QUERY_KEY),
    [queryClient],
  );

  /**
   * Tìm thẻ ở snapshot trước, không thấy thì hỏi cache chi tiết.
   *
   * Snapshot chỉ chứa 20 thẻ đầu mỗi cột, nên mở thẳng một thẻ bằng URL
   * (link chia sẻ, hoặc thẻ nằm sâu trong cột) thì nó KHÔNG có ở đó.
   */
  const findCard = useCallback(
    (cardId: string): CardSummary | undefined =>
      getSnap()?.cards.find((c) => c.id === cardId),
    [getSnap],
  );

  /**
   * Vá cache của thẻ đang mở chi tiết.
   *
   * Màn chi tiết đọc từ một query RIÊNG (`["board","card",id]`), không phải từ
   * snapshot. Thiếu bước này thì bấm "Hoàn thành" ngay trong màn chi tiết sẽ
   * đổi thẻ ngoài bảng nhưng chính màn đang mở vẫn hiện như chưa xong — cho
   * tới khi hết 30 giây staleTime. Đây đúng là lỗi người dùng báo.
   */
  const patchCardDetail = useCallback(
    (cardId: string, fn: (card: CardDetail) => CardDetail) => {
      queryClient.setQueryData<CardDetail>(cardDetailKey(cardId), (prev) =>
        prev ? fn(prev) : prev,
      );
    },
    [queryClient],
  );

  /**
   * Sửa cache tại chỗ — mọi cập nhật lạc quan đều đi qua đây.
   *
   * `cardCounts` (tổng thật mỗi cột) được tự bù theo chênh lệch số thẻ mỗi cột
   * trước/sau khi vá. Trước đây chỉ `addCard` tự cộng: xoá hay chuyển cột thì
   * cột cũ vẫn giữ tổng cũ, nên hiện "Tải thêm 1 việc" mà bấm vào chẳng có gì.
   * Tải trang kế tiếp thì truyền `recount: false` — thẻ đó vốn đã nằm trong tổng.
   */
  const patchSnapshot = useCallback(
    (
      fn: (snap: BoardSnapshot) => BoardSnapshot,
      { recount = true }: { recount?: boolean } = {},
    ) => {
      queryClient.setQueryData<BoardSnapshot>(BOARD_QUERY_KEY, (prev) => {
        if (!prev) return prev;
        const next = fn(prev);
        if (!recount || next.cards === prev.cards) return next;

        const delta = new Map<string, number>();
        const bump = (cards: CardSummary[], sign: 1 | -1) =>
          cards.forEach((c) => {
            const key = c.listId ?? INBOX_KEY;
            delta.set(key, (delta.get(key) ?? 0) + sign);
          });
        bump(prev.cards, -1);
        bump(next.cards, 1);

        let changed = false;
        const cardCounts = { ...next.cardCounts };
        delta.forEach((d, key) => {
          if (d === 0) return;
          changed = true;
          cardCounts[key] = Math.max(0, (cardCounts[key] ?? 0) + d);
        });
        return changed ? { ...next, cardCounts } : next;
      });
    },
    [queryClient],
  );

  /** Vá vài field của MỘT thẻ, ở cả snapshot lẫn cache chi tiết */
  const patchCard = useCallback(
    (cardId: string, fields: Partial<CardSummary>) => {
      patchSnapshot((snap) => ({
        ...snap,
        cards: snap.cards.map((c) => (c.id === cardId ? { ...c, ...fields } : c)),
      }));
      patchCardDetail(cardId, (detail) => ({ ...detail, ...fields }));
    },
    [patchSnapshot, patchCardDetail],
  );

  const removeCardLocal = useCallback(
    (cardId: string) =>
      patchSnapshot((snap) => ({
        ...snap,
        cards: snap.cards.filter((c) => c.id !== cardId),
      })),
    [patchSnapshot],
  );

  /** Đưa một thẻ (trở) lại snapshot — không nhân đôi nếu nó đã có mặt */
  const upsertCardLocal = useCallback(
    (card: CardSummary) =>
      patchSnapshot((snap) => ({
        ...snap,
        cards: [...snap.cards.filter((c) => c.id !== card.id), card],
      })),
    [patchSnapshot],
  );

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: BOARD_QUERY_KEY });
    // Lịch hôm nay là query riêng, không tự cập nhật theo snapshot
    queryClient.invalidateQueries({ queryKey: ["board", "agenda"] });
    // Các màn cũ (/tasks, /kanban, /dashboard) đọc cùng dữ liệu task
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
    queryClient.invalidateQueries({ queryKey: ["task-stats"] });
    // Thẻ dự án hiện số việc đang mở / trễ hạn -> ghi ở bảng cũng làm nó sai
    queryClient.invalidateQueries({ queryKey: ["projects"] });
  }, [queryClient]);

  /**
   * Làm mới những màn KHÁC sau khi ghi ở bảng.
   *
   * Cố tình không đụng `BOARD_QUERY_KEY`: snapshot vừa được vá lạc quan rồi,
   * tải lại nó là thêm một vòng mạng cho mỗi lần bấm — hoàn thành 10 việc là
   * 20 request, chạm ngay trần 20 req/60s của backend.
   *
   * Các khoá còn lại đang không hoạt động khi người dùng đứng ở bảng, nên
   * React Query chỉ đánh dấu cũ chứ không gọi API — miễn phí, mà mở sang trang
   * Công việc là thấy số đúng.
   */
  const invalidateOutside = useCallback(() => {
    [["tasks"], ["task"], ["task-stats"], ["projects"], ["board", "agenda"]].forEach(
      (queryKey) => queryClient.invalidateQueries({ queryKey }),
    );
  }, [queryClient]);

  const onFail = useCallback(
    (err: unknown) => {
      message.error(getApiErrorMessage(err));
      // Không vá cache bằng tay — tải lại sự thật từ server
      invalidate();
    },
    [message, invalidate],
  );

  /** Đăng ký một bước vào lịch sử hoàn tác */
  const pushHistory = useCallback(
    (entry: UndoEntry) => {
      const h = historyRef.current;
      h.past = [...h.past, entry].slice(-HISTORY_LIMIT);
      h.future = [];
      syncHistory();
    },
    [syncHistory],
  );

  // ==========================================
  // DẪN XUẤT
  // ==========================================
  /*
   * Tách từng phần theo đúng dữ liệu nguồn của nó. `patchSnapshot` giữ nguyên
   * tham chiếu `lists` / `labels` khi chỉ vá thẻ, nên `lists` và `labelById`
   * ở đây cũng giữ nguyên -> MetaContext không đổi -> thẻ không vẽ lại.
   */
  const rawLists = data?.lists ?? NO_LISTS;
  const rawCards = data?.cards ?? NO_CARDS;
  const labels = data?.labels ?? NO_LABELS;
  const counts = data?.cardCounts ?? NO_COUNTS;
  const board = data?.board ?? null;

  const lists = useMemo(
    () => rawLists.filter((l) => !l.archived).sort(byPosition),
    [rawLists],
  );
  const archivedLists = useMemo(
    () => rawLists.filter((l) => l.archived).sort(byPosition),
    [rawLists],
  );
  const labelById = useMemo(() => new Map(labels.map((l) => [l.id, l])), [labels]);
  const cardById = useMemo(() => new Map(rawCards.map((c) => [c.id, c])), [rawCards]);

  const { cardsByList, inboxCards } = useMemo(() => {
    const today = new Date();
    const effective = { ...filter, keyword: deferredKeyword };
    const byList = new Map<string, CardSummary[]>();
    lists.forEach((l) => byList.set(l.id, []));
    const inbox: CardSummary[] = [];

    rawCards.forEach((card) => {
      if (!matchesFilter(card, effective, today)) return;
      if (card.listId === null) inbox.push(card);
      else byList.get(card.listId)?.push(card);
    });

    byList.forEach((list) => list.sort(byPosition));
    inbox.sort(byPosition);
    return { cardsByList: byList, inboxCards: inbox };
  }, [rawCards, lists, filter, deferredKeyword]);

  const totalByList = useMemo(
    () => new Map<string, number>(lists.map((l) => [l.id, counts[l.id] ?? 0])),
    [lists, counts],
  );

  /** Danh sách thẻ của một cột lấy từ cache gốc (chưa lọc) — dùng khi tính position */
  const rawSiblings = useCallback(
    (listId: string | null, excludeId?: string): CardSummary[] =>
      (getSnap()?.cards ?? [])
        .filter((c) => c.listId === listId && c.id !== excludeId)
        .sort(byPosition),
    [getSnap],
  );

  /** Cột chưa lưu trữ theo thứ tự, đọc từ cache mới nhất */
  const activeLists = useCallback(
    () =>
      (getSnap()?.lists ?? []).filter((l) => !l.archived).sort(byPosition),
    [getSnap],
  );

  // ==========================================
  // THAO TÁC
  // ==========================================
  const setCardPosition = useCallback(
    (cardId: string, to: { listId: string | null; position: number }) =>
      patchSnapshot((snap) => ({
        ...snap,
        cards: snap.cards.map((c) => (c.id === cardId ? { ...c, ...to } : c)),
      })),
    [patchSnapshot],
  );

  const moveMutation = useMutation({
    mutationFn: ({
      cardId,
      listId,
      position,
      undoFlag,
    }: {
      cardId: string;
      listId: string | null;
      position: number;
      undoFlag?: boolean;
    }) => boardApi.moveCard(cardId, { listId, position }, undoFlag),
    onSuccess: (res) => {
      // position trong response mới là chuẩn — backend có thể đã dịch sang khe
      // trống gần nhất nếu khe gửi lên bị chiếm (§4.1)
      patchSnapshot((snap) => ({
        ...snap,
        cards: snap.cards.map((c) =>
          c.id === res.id
            ? { ...c, listId: res.listId, position: res.position, status: res.status }
            : c,
        ),
      }));
      if (res.warning === "LIST_WIP_EXCEEDED") {
        message.warning("Cột này đã vượt giới hạn việc đang chạy");
      }
    },
    onError: onFail,
  });
  // `useMutation` trả object mới mỗi render, còn `mutate` thì ổn định
  const moveCardMutate = moveMutation.mutate;

  const previewMove = useCallback(
    (cardId: string, toListId: string | null, toIndex: number) => {
      const card = findCard(cardId);
      if (!card) return;
      const siblings = rawSiblings(toListId, cardId);
      const position = computePosition(
        siblings[toIndex - 1]?.position,
        siblings[toIndex]?.position,
      );
      if (card.listId === toListId && card.position === position) return;
      setCardPosition(cardId, { listId: toListId, position });
    },
    [findCard, rawSiblings, setCardPosition],
  );

  const commitMove = useCallback(
    (cardId: string, from: { listId: string | null; position: number }) => {
      const card = findCard(cardId);
      if (!card) return;
      // Kéo rồi thả về đúng chỗ cũ -> không có gì để ghi
      if (card.listId === from.listId && card.position === from.position) return;

      const to = { listId: card.listId, position: card.position };
      moveCardMutate({ cardId, ...to });
      pushHistory({
        label: "di chuyển việc",
        undo: () => boardApi.moveCard(cardId, from, true),
        redo: () => boardApi.moveCard(cardId, to, true),
        applyUndo: () => setCardPosition(cardId, from),
        applyRedo: () => setCardPosition(cardId, to),
      });
    },
    [findCard, moveCardMutate, pushHistory, setCardPosition],
  );

  // ---------- nhãn ----------
  /*
   * Nhãn nằm trong `snapshot.labels`, nên mọi thao tác đều vá thẳng vào đó rồi
   * mới gọi API — giống hệt cách thẻ và cột đang làm. Riêng nhãn KHÔNG vào
   * lịch sử hoàn tác: Ctrl+Z ở màn này để dành cho thao tác trên thẻ, mà xoá
   * nhãn còn kéo theo việc gỡ nó khỏi mọi thẻ nên khôi phục nửa vời sẽ rối hơn
   * là giúp. Thay vào đó thao tác nhãn có hộp xác nhận.
   */
  const createLabel = useCallback(
    async (input: { name: string; color: string; icon?: string | null }) => {
      const boardId = getSnap()?.board.id;
      if (!boardId) return null;
      try {
        const label = await boardApi.createLabel(boardId, input);
        patchSnapshot((snap) => ({ ...snap, labels: [...snap.labels, label] }));
        return label;
      } catch (error) {
        onFail(error);
        return null;
      }
    },
    [getSnap, patchSnapshot, onFail],
  );

  const updateLabel = useCallback(
    async (labelId: string, input: SaveLabelInput) => {
      try {
        const label = await boardApi.updateLabel(labelId, input);
        patchSnapshot((snap) => ({
          ...snap,
          labels: snap.labels.map((l) => (l.id === label.id ? label : l)),
        }));
      } catch (error) {
        onFail(error);
      }
    },
    [patchSnapshot, onFail],
  );

  const deleteLabel = useCallback(
    async (labelId: string) => {
      try {
        await boardApi.deleteLabel(labelId);
        patchSnapshot((snap) => ({
          ...snap,
          labels: snap.labels.filter((l) => l.id !== labelId),
          // Gỡ khỏi mọi thẻ đang giữ nhãn này, y như backend vừa làm
          cards: snap.cards.map((c) =>
            c.labelIds.includes(labelId)
              ? { ...c, labelIds: c.labelIds.filter((id) => id !== labelId) }
              : c,
          ),
        }));
        message.success("Đã xoá nhãn");
      } catch (error) {
        onFail(error);
      }
    },
    [patchSnapshot, onFail, message],
  );

  const toggleCardLabel = useCallback(
    (cardId: string, labelId: string) => {
      /*
       * Đọc nhãn hiện tại từ SNAPSHOT, và lùi về cache chi tiết nếu thẻ không
       * nằm trong 20 thẻ đầu của cột — giống `toggleComplete`.
       */
      const card =
        findCard(cardId) ?? queryClient.getQueryData<CardDetail>(cardDetailKey(cardId));
      if (!card) return;

      const next = card.labelIds.includes(labelId)
        ? card.labelIds.filter((id) => id !== labelId)
        : [...card.labelIds, labelId];

      /*
       * PHẢI vá cả cache chi tiết (patchCard làm cả hai). Thiếu nó sinh ra một
       * lỗi nhìn rất khó hiểu: màn chi tiết đọc `labelIds` từ query riêng của
       * nó, nên bấm lần đầu thì nhãn ĐÃ được gắn ở máy chủ nhưng giao diện
       * không hiện dấu tích — người dùng bấm lại, lần này `next` thành mảng
       * rỗng và API xoá đúng cái nhãn vừa gắn. Triệu chứng nhìn thấy: "bấm
       * chọn nhãn không được, API gửi {labelIds: []}".
       */
      patchCard(cardId, { labelIds: next });

      boardApi.setCardLabels(cardId, next).catch(onFail);
    },
    [findCard, queryClient, patchCard, onFail],
  );

  /**
   * Chuyển thẻ sang cột khác KHÔNG cần kéo thả.
   *
   * Kéo thả trước đây là cách duy nhất, mà nó loại hẳn bàn phím, màn hình cảm
   * ứng nhỏ và cả trường hợp cột đích đang nằm ngoài vùng nhìn thấy (phải kéo
   * thẻ trong lúc canvas tự cuộn ngang — thao tác khó nhất của cả màn).
   *
   * Dùng lại đúng `previewMove` + `commitMove` của luồng kéo thả, nên lịch sử
   * hoàn tác, cập nhật lạc quan và cách tính `position` giống hệt.
   */
  const moveCardToList = useCallback(
    (cardId: string, toListId: string | null) => {
      const card = findCard(cardId);
      if (!card || card.listId === toListId) return;
      const from = { listId: card.listId, position: card.position };
      // Thả xuống cuối cột đích — chỗ dễ đoán nhất khi không tự chọn vị trí
      previewMove(cardId, toListId, rawSiblings(toListId, cardId).length);
      commitMove(cardId, from);
    },
    [findCard, previewMove, commitMove, rawSiblings],
  );

  const addCard = useCallback(
    async (listId: string | null, text: string, atTop = false) => {
      // Tách hạn / ưu tiên / nhãn / thời lượng ngay từ dòng người dùng gõ.
      // Backend KHÔNG phân tích chuỗi tự nhiên (§4.2) nên việc này phải làm ở đây.
      const parsed = quickParse(text);

      // Hiện ngay một ô mờ ở đúng cột, trước cả khi gọi API
      const pendingKey = `pending-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setPendingAdds((prev) => [
        ...prev,
        { key: pendingKey, listId, title: parsed.title, atTop },
      ]);

      /*
       * Nhãn chưa tồn tại thì TẠO LUÔN.
       *
       * Trước đây slug lạ bị lọc bỏ im lặng: gõ "#baogia" khi chưa có nhãn đó
       * thì việc vẫn được tạo nhưng không có nhãn nào, và không có thông báo
       * nào giải thích. Người dùng chỉ biết là "gõ nhãn không ăn".
       *
       * Màu chọn theo slug chứ không ngẫu nhiên: cùng một tên gõ ở hai máy sẽ
       * ra cùng một màu, và gõ lại nhãn vừa xoá không đổi màu lung tung.
       */
      const known = getSnap()?.labels ?? [];
      const labelIds: string[] = [];
      for (const slug of parsed.labelSlugs) {
        const existing = known.find((l) => l.slug === slug);
        if (existing) {
          labelIds.push(existing.id);
          continue;
        }
        const seed = [...slug].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
        const created = await createLabel({
          name: slug,
          color: LABEL_COLORS[seed % LABEL_COLORS.length],
        });
        if (created) labelIds.push(created.id);
      }

      const siblings = rawSiblings(listId);
      const position = atTop
        ? computePosition(undefined, siblings[0]?.position)
        : computePosition(siblings.at(-1)?.position, undefined);

      const input: CreateCardInput = {
        // Hộp thư đến không thuộc cột nào nên backend không suy ra được dự án
        projectId: listId === null ? (projectId ?? undefined) : undefined,
        title: parsed.title,
        position,
        deadline: parsed.deadline,
        priority: parsed.priority ?? TaskPriority.NORMAL,
        labelIds: labelIds.length ? labelIds : undefined,
        estimateMinutes: parsed.estimateMinutes ?? undefined,
      };

      // `await` để ô nhập biết lúc nào xong mà tắt trạng thái đang lưu
      await boardApi
        .createCard(listId, input)
        .then((card) => {
          upsertCardLocal(card);
          pushHistory({
            label: "thêm việc",
            undo: () => boardApi.deleteCard(card.id),
            redo: () => boardApi.restoreCard(card.id, true),
            applyUndo: () => removeCardLocal(card.id),
            applyRedo: () => upsertCardLocal(card),
          });
        })
        .catch(onFail)
        .finally(() => {
          // Gỡ ô mờ dù thành công hay lỗi — lỗi đã có thông báo riêng, để ô mờ
          // nằm lại vĩnh viễn thì tệ hơn nhiều
          setPendingAdds((prev) => prev.filter((p) => p.key !== pendingKey));
        });
    },
    [
      getSnap,
      projectId,
      createLabel,
      rawSiblings,
      upsertCardLocal,
      removeCardLocal,
      pushHistory,
      onFail,
    ],
  );

  const updateCard = useCallback(
    (cardId: string, patch: UpdateCardInput) => {
      const before = findCard(cardId);
      patchSnapshot((snap) => ({
        ...snap,
        cards: snap.cards.map((c) =>
          c.id === cardId ? { ...c, ...summaryFields(patch) } : c,
        ),
      }));
      // Thẻ có thể đang mở ở màn chi tiết (menu ⋯ đổi ưu tiên chẳng hạn) — màn
      // đó đọc từ query riêng nên phải vá cả hai, xem ghi chú ở toggleCardLabel
      patchCardDetail(cardId, (detail) => ({ ...detail, ...patch }));

      boardApi
        .updateCard(cardId, patch)
        .then(() => {
          if (!before) return;
          // Chỉ đảo lại đúng những field vừa sửa
          const inverse: UpdateCardInput = {};
          if (patch.title !== undefined) inverse.title = before.title;
          if (patch.priority !== undefined) inverse.priority = before.priority;
          if (patch.cover !== undefined) inverse.cover = before.cover;
          if (patch.deadline !== undefined) inverse.deadline = before.deadline;
          if (Object.keys(inverse).length === 0) return;
          pushHistory({
            label: "sửa việc",
            undo: () => boardApi.updateCard(cardId, inverse, true),
            redo: () => boardApi.updateCard(cardId, patch, true),
            applyUndo: () => patchCard(cardId, summaryFields(inverse)),
            applyRedo: () => patchCard(cardId, summaryFields(patch)),
          });
        })
        .catch(onFail);
    },
    [findCard, patchSnapshot, patchCardDetail, patchCard, pushHistory, onFail],
  );

  const deleteCard = useCallback(
    (cardId: string) => {
      const card = findCard(cardId);
      removeCardLocal(cardId);
      boardApi
        .deleteCard(cardId)
        .then(() => {
          if (!card) {
            message.success("Đã xoá việc");
            return;
          }
          const entry: UndoEntry = {
            label: "xoá việc",
            undo: () => boardApi.restoreCard(cardId, true),
            redo: () => boardApi.deleteCard(cardId),
            applyUndo: () => upsertCardLocal(card),
            applyRedo: () => removeCardLocal(cardId),
          };
          pushHistory(entry);

          /*
           * Xoá không hỏi lại (hỏi mỗi lần thì phiền), nhưng phải cứu được ngay
           * tại chỗ: Ctrl+Z thì người dùng chưa chắc biết. Bấm "Hoàn tác" ở đây
           * gỡ luôn bước này khỏi lịch sử, để Ctrl+Z sau đó không khôi phục lần hai.
           */
          const key = `deleted-${cardId}`;
          message.open({
            key,
            type: "success",
            duration: 6,
            content: (
              <span className="inline-flex items-center gap-3">
                Đã xoá “{card.title.length > 40 ? `${card.title.slice(0, 40)}…` : card.title}”
                <button
                  type="button"
                  className="border-0 bg-transparent p-0 font-semibold cursor-pointer"
                  style={{ color: "#0a436d" }}
                  onClick={() => {
                    message.destroy(key);
                    const h = historyRef.current;
                    h.past = h.past.filter((e) => e !== entry);
                    syncHistory();
                    // Thẻ hiện lại ngay, không đợi vòng mạng
                    upsertCardLocal(card);
                    entry.undo().then(invalidateOutside).catch(onFail);
                  }}
                >
                  Hoàn tác
                </button>
              </span>
            ),
          });
        })
        .catch(onFail);
    },
    [
      findCard,
      removeCardLocal,
      upsertCardLocal,
      pushHistory,
      syncHistory,
      onFail,
      message,
      invalidateOutside,
    ],
  );

  const snoozeCard = useCallback(
    (cardId: string, deadline: string | null, label: string) => {
      const prev = findCard(cardId);
      const before = prev?.deadline ?? null;
      const beforeStatus = prev?.deadlineStatus ?? "IN_PROGRESS";
      patchCard(cardId, { deadline, deadlineStatus: "IN_PROGRESS" });
      boardApi
        .snoozeCard(cardId, deadline)
        .then((card) => {
          patchSnapshot((snap) => ({
            ...snap,
            cards: snap.cards.map((c) => (c.id === card.id ? card : c)),
          }));
          pushHistory({
            label: `dời hạn sang ${label}`,
            undo: () => boardApi.snoozeCard(cardId, before, true),
            redo: () => boardApi.snoozeCard(cardId, deadline, true),
            applyUndo: () =>
              patchCard(cardId, { deadline: before, deadlineStatus: beforeStatus }),
            applyRedo: () =>
              patchCard(cardId, { deadline, deadlineStatus: card.deadlineStatus }),
          });
        })
        .catch(onFail);
    },
    [findCard, patchCard, patchSnapshot, pushHistory, onFail],
  );

  const toggleComplete = useCallback(
    (cardId: string): Promise<void> => {
      /*
       * Tìm thẻ ở snapshot trước, không thấy thì hỏi cache chi tiết. Bản cũ
       * `return` im lặng — người dùng bấm "Hoàn thành" và không có gì xảy ra,
       * cũng không có lỗi nào để lần ra.
       */
      const card =
        findCard(cardId) ?? queryClient.getQueryData<CardDetail>(cardDetailKey(cardId));
      if (!card) return Promise.resolve();
      const wasDone = card.completedAt !== null;
      const prevFields: Partial<CardSummary> = {
        status: card.status,
        completedAt: card.completedAt,
        deadlineStatus: card.deadlineStatus,
      };

      /*
       * LẠC QUAN: đổi ngay trên màn hình rồi mới gọi API. Đây là thao tác dùng
       * nhiều nhất của cả app — đợi 200–500ms mạng mới thấy dấu tích là cảm
       * giác "bấm không ăn". Lỗi thì onFail tải lại sự thật từ server.
       */
      patchCard(
        cardId,
        wasDone
          ? { completedAt: null, status: TaskStatus.TODO }
          : { completedAt: new Date().toISOString(), status: TaskStatus.DONE },
      );

      const fail = (err: unknown) => {
        onFail(err);
        queryClient.invalidateQueries({ queryKey: cardDetailKey(cardId) });
      };

      if (wasDone) {
        return boardApi
          .reopenCard(cardId)
          .then((res) => {
            patchSnapshot((snap) => ({
              ...snap,
              cards: snap.cards.map((c) => (c.id === res.id ? res : c)),
            }));
            patchCardDetail(cardId, (detail) => ({
              ...detail,
              status: res.status,
              completedAt: res.completedAt,
              deadlineStatus: res.deadlineStatus,
            }));
            invalidateOutside();
            pushHistory({
              label: "mở lại việc",
              // Không vá cục bộ khi hoàn tác: `complete` có thể sinh lượt kế
              // tiếp của việc lặp, chỉ server mới biết -> tải lại
              undo: () => boardApi.completeCard(cardId, true),
              redo: () => boardApi.reopenCard(cardId, true),
              applyRedo: () =>
                patchCard(cardId, {
                  status: res.status,
                  completedAt: res.completedAt,
                  deadlineStatus: res.deadlineStatus,
                }),
            });
          })
          .catch(fail);
      }

      return boardApi
        .completeCard(cardId)
        .then(({ completed, next }) => {
          patchSnapshot((snap) => ({
            ...snap,
            cards: [
              ...snap.cards.map((c) => (c.id === completed.id ? completed : c)),
              ...(next ? [next] : []),
            ],
          }));
          patchCardDetail(cardId, (detail) => ({
            ...detail,
            status: completed.status,
            completedAt: completed.completedAt,
            deadlineStatus: completed.deadlineStatus,
            // Việc lặp có thể được backend chuyển sang cột "Hoàn thành" nếu bảng
            // có cột ánh xạ DONE — lấy theo response chứ đừng đoán
            listId: completed.listId,
          }));
          invalidateOutside();
          message.success(
            next
              ? `${completed.code} đã hoàn thành — đã tạo lượt kế tiếp ${next.code}`
              : `${completed.code} đã hoàn thành`,
          );

          /**
           * Việc có `repeat` sinh ngay thẻ kế tiếp. Backend không lần ngược
           * được vì không lưu quan hệ cha–con, nên hoàn tác phải tự xoá thẻ đó
           * — nếu không, mỗi lần bấm nhầm "Hoàn thành" rồi Ctrl+Z lại để lại
           * một việc thừa trong bảng.
           *
           * `spawned` là biến đóng (closure) chứ không phải hằng số: redo gọi
           * lại `complete` sẽ sinh thẻ MỚI với id khác, phải ghi đè để lần
           * hoàn tác sau xoá đúng thẻ.
           */
          let spawned = next?.id ?? null;
          const from = { listId: card.listId, position: card.position };

          pushHistory({
            label: "hoàn thành việc",
            undo: async () => {
              await boardApi.reopenCard(cardId, true);
              if (spawned) {
                await boardApi.deleteCard(spawned);
                spawned = null;
              }
            },
            // Redo sinh thẻ kế tiếp mới -> không vá cục bộ, để tải lại
            redo: async () => {
              const again = await boardApi.completeCard(cardId);
              spawned = again.next?.id ?? null;
            },
            applyUndo: () => {
              patchCard(cardId, {
                ...prevFields,
                // Cột "Hoàn thành" có thể đã kéo thẻ đi — trả về chỗ cũ
                ...(completed.listId !== from.listId ? from : {}),
              });
              if (spawned) removeCardLocal(spawned);
            },
          });
        })
        .catch(fail);
    },
    [
      findCard,
      queryClient,
      patchCard,
      patchSnapshot,
      patchCardDetail,
      removeCardLocal,
      invalidateOutside,
      pushHistory,
      onFail,
      message,
    ],
  );

  // ---------- danh sách ----------
  const addList = useCallback(
    (title: string) => {
      const boardId = getSnap()?.board.id;
      if (!boardId) return;
      const last = activeLists().at(-1);
      // Cột mờ hiện ngay — trước đây bấm "Thêm" xong màn hình đứng im cả vòng mạng
      const key = `pending-list-${Date.now()}`;
      setPendingLists((prev) => [...prev, { key, title }]);
      boardApi
        .createList(boardId, {
          title,
          position: computePosition(last?.position, undefined),
        })
        .then((list) => {
          patchSnapshot((snap) => ({ ...snap, lists: [...snap.lists, list] }));
        })
        .catch(onFail)
        .finally(() => setPendingLists((prev) => prev.filter((p) => p.key !== key)));
    },
    [getSnap, activeLists, patchSnapshot, onFail],
  );

  const setListTitle = useCallback(
    (listId: string, title: string) =>
      patchSnapshot((snap) => ({
        ...snap,
        lists: snap.lists.map((l) => (l.id === listId ? { ...l, title } : l)),
      })),
    [patchSnapshot],
  );

  const renameList = useCallback(
    (listId: string, title: string) => {
      const before = getSnap()?.lists.find((l) => l.id === listId)?.title;
      setListTitle(listId, title);
      boardApi
        .updateList(listId, { title })
        .then(() => {
          if (before === undefined) return;
          pushHistory({
            label: "đổi tên danh sách",
            undo: () => boardApi.updateList(listId, { title: before }, true),
            redo: () => boardApi.updateList(listId, { title }, true),
            applyUndo: () => setListTitle(listId, before),
            applyRedo: () => setListTitle(listId, title),
          });
        })
        .catch(onFail);
    },
    [getSnap, setListTitle, pushHistory, onFail],
  );

  const archiveList = useCallback(
    (listId: string) => {
      // Nhớ thẻ nào đang ở cột này (và ở vị trí nào) để hoàn tác trả đúng chỗ.
      // Backend chỉ đẩy thẻ về Hộp thư đến, không ghi lại cột cũ. Chỉ nhớ được
      // thẻ đã tải — cột dài quá 20 thẻ thì phần chưa tải ở lại Hộp thư đến.
      const released = (getSnap()?.cards ?? [])
        .filter((c) => c.listId === listId)
        .map((c) => ({ id: c.id, position: c.position }));
      patchSnapshot((snap) => ({
        ...snap,
        lists: snap.lists.map((l) => (l.id === listId ? { ...l, archived: true } : l)),
        // Thẻ trong cột bị lưu trữ quay về Hộp thư đến, không thẻ nào bị xoá
        cards: snap.cards.map((c) => (c.listId === listId ? { ...c, listId: null } : c)),
      }));
      boardApi
        .updateList(listId, { archived: true })
        .then(() => {
          message.success("Đã lưu trữ danh sách, các việc quay về Hộp thư đến");
          pushHistory({
            label: "lưu trữ danh sách",
            undo: async () => {
              await boardApi.updateList(listId, { archived: false }, true);
              // Tuần tự chứ không song song: backend có trần tần suất ghi
              for (const card of released) {
                await boardApi.moveCard(card.id, { listId, position: card.position }, true);
              }
            },
            redo: () => boardApi.updateList(listId, { archived: true }, true),
          });
          invalidate();
        })
        .catch(onFail);
    },
    [getSnap, patchSnapshot, pushHistory, onFail, message, invalidate],
  );

  const restoreList = useCallback(
    (listId: string) => {
      patchSnapshot((snap) => ({
        ...snap,
        lists: snap.lists.map((l) => (l.id === listId ? { ...l, archived: false } : l)),
      }));
      boardApi
        .updateList(listId, { archived: false })
        .then(() => {
          message.success("Đã khôi phục danh sách");
          pushHistory({
            label: "khôi phục danh sách",
            undo: () => boardApi.updateList(listId, { archived: true }, true),
            redo: () => boardApi.updateList(listId, { archived: false }, true),
          });
          invalidate();
        })
        .catch(onFail);
    },
    [patchSnapshot, pushHistory, onFail, message, invalidate],
  );

  const moveList = useCallback(
    (listId: string, toIndex: number) => {
      const others = activeLists().filter((l) => l.id !== listId);
      const position = computePosition(
        others[toIndex - 1]?.position,
        others[toIndex]?.position,
      );
      patchSnapshot((snap) => ({
        ...snap,
        lists: snap.lists.map((l) => (l.id === listId ? { ...l, position } : l)),
      }));
      boardApi.moveList(listId, position).catch(onFail);
    },
    [activeLists, patchSnapshot, onFail],
  );

  const toggleStar = useCallback(() => {
    const current = getSnap()?.board;
    if (!current) return;
    const next = !current.starred;
    patchSnapshot((snap) => ({ ...snap, board: { ...snap.board, starred: next } }));
    boardApi.updateBoard(current.id, { starred: next }).catch(onFail);
  }, [getSnap, patchSnapshot, onFail]);

  // ---------- tải thêm thẻ ----------
  /*
   * `/full` chỉ trả 20 thẻ đầu mỗi cột. Không có hàm này thì thẻ thứ 21 trở đi
   * không có đường nào chạm tới: cột vẫn hiện "20/47" nhưng 27 thẻ kia biến mất
   * khỏi giao diện.
   *
   * Con trỏ là `position` của thẻ cuối ĐÃ TẢI, không phải số trang: thẻ được
   * chèn/kéo liên tục nên đánh số trang sẽ nhảy cóc hoặc lặp thẻ.
   */
  // Chặn gọi trùng khi cột tự tải lúc cuộn tới đáy (IntersectionObserver bắn
  // nhiều lần trước khi state `loadingMore` kịp render)
  const loadingMoreRef = useRef<string | null>(null);
  const loadMoreCards = useCallback(
    async (listId: string | null) => {
      const key = listId ?? INBOX_KEY;
      if (loadingMoreRef.current !== null) return;
      const cursor = rawSiblings(listId).at(-1)?.position;

      loadingMoreRef.current = key;
      setLoadingMore(key);
      try {
        const page = await boardApi.listCards(listId, {
          cursor,
          limit: 20,
          projectId: projectId ?? undefined,
        });
        patchSnapshot(
          (snap) => {
            const known = new Set(snap.cards.map((c) => c.id));
            const fresh = page.items.filter((c) => !known.has(c.id));
            return {
              ...snap,
              cards: [...snap.cards, ...fresh],
              // Nhân tiện lấy lại tổng thật từ server, xoá mọi sai lệch cũ
              cardCounts: { ...snap.cardCounts, [key]: page.total },
            };
          },
          { recount: false },
        );
      } catch (error) {
        onFail(error);
      } finally {
        loadingMoreRef.current = null;
        setLoadingMore(null);
      }
    },
    [rawSiblings, projectId, patchSnapshot, onFail],
  );

  // ---------- hoàn tác ----------
  /*
   * Bước nào biết tự vá cache (`applyUndo` / `applyRedo`) thì vá ngay rồi chỉ
   * làm mới các màn KHÁC — không tải lại cả snapshot. Trước đây mỗi Ctrl+Z là
   * ~5 request, bấm vài lần liền là chạm trần 20 req/60s của backend.
   */
  const undo = useCallback(() => {
    const h = historyRef.current;
    const entry = h.past.at(-1);
    if (!entry) return;
    h.past = h.past.slice(0, -1);
    h.future = [entry, ...h.future];
    syncHistory();
    entry.applyUndo?.();
    entry
      .undo()
      .then(entry.applyUndo ? invalidateOutside : invalidate)
      .catch(onFail);
  }, [syncHistory, invalidate, invalidateOutside, onFail]);

  const redo = useCallback(() => {
    const h = historyRef.current;
    const entry = h.future[0];
    if (!entry) return;
    h.future = h.future.slice(1);
    h.past = [...h.past, entry];
    syncHistory();
    entry.applyRedo?.();
    entry
      .redo()
      .then(entry.applyRedo ? invalidateOutside : invalidate)
      .catch(onFail);
  }, [syncHistory, invalidate, invalidateOutside, onFail]);

  // ==========================================
  const actions = useMemo<BoardActions>(
    () => ({
      refetch,
      setFilter,
      previewMove,
      commitMove,
      addCard,
      updateCard,
      deleteCard,
      snoozeCard,
      toggleComplete,
      moveCardToList,
      addList,
      renameList,
      archiveList,
      restoreList,
      moveList,
      toggleStar,
      createLabel,
      updateLabel,
      deleteLabel,
      toggleCardLabel,
      loadMoreCards,
      undo,
      redo,
      setFullscreen,
      setAgendaOpen,
      toggleAgendaOpen,
      setInboxCollapsed,
      toggleInboxCollapsed,
      setPaletteOpen,
    }),
    [
      refetch,
      previewMove,
      commitMove,
      addCard,
      updateCard,
      deleteCard,
      snoozeCard,
      toggleComplete,
      moveCardToList,
      addList,
      renameList,
      archiveList,
      restoreList,
      moveList,
      toggleStar,
      createLabel,
      updateLabel,
      deleteLabel,
      toggleCardLabel,
      loadMoreCards,
      undo,
      redo,
      setFullscreen,
      setAgendaOpen,
      toggleAgendaOpen,
      setInboxCollapsed,
      toggleInboxCollapsed,
    ],
  );

  const meta = useMemo<BoardMeta>(
    () => ({ board, lists, archivedLists, labels, labelById }),
    [board, lists, archivedLists, labels, labelById],
  );

  const state = useMemo<BoardState>(
    () => ({
      today: data?.today ?? EMPTY_TODAY,
      cardsByList,
      inboxCards,
      totalByList,
      inboxTotal: counts[INBOX_KEY] ?? 0,
      cardById,

      isLoading,
      isFetching,
      error,

      filter,
      filterActive:
        !!filter.keyword ||
        filter.labelIds.length > 0 ||
        filter.overdueOnly ||
        filter.todayOnly,

      pendingAdds,
      pendingLists,
      loadingMore,

      canUndo: historyUi.canUndo,
      canRedo: historyUi.canRedo,
      lastLabel: historyUi.lastLabel,

      fullscreen,
      agendaOpen,
      inboxCollapsed,
      paletteOpen,
    }),
    [
      data?.today,
      cardsByList,
      inboxCards,
      totalByList,
      counts,
      cardById,
      isLoading,
      isFetching,
      error,
      filter,
      pendingAdds,
      pendingLists,
      loadingMore,
      historyUi,
      fullscreen,
      agendaOpen,
      inboxCollapsed,
      paletteOpen,
    ],
  );

  return (
    <ActionsContext.Provider value={actions}>
      <MetaContext.Provider value={meta}>
        <BoardContext.Provider value={state}>{children}</BoardContext.Provider>
      </MetaContext.Provider>
    </ActionsContext.Provider>
  );
}

/**
 * Toàn bộ store. Tiện, nhưng render lại trên MỌI thay đổi của bảng — đừng dùng
 * trong thứ gì lặp theo thẻ/cột; dùng `useBoardActions` + `useBoardMeta`.
 */
export function useBoard(): BoardContextValue {
  const state = useContext(BoardContext);
  const actions = useContext(ActionsContext);
  const meta = useContext(MetaContext);
  if (!state || !actions || !meta) throw new Error("useBoard phải nằm trong <BoardProvider>");
  return useMemo(() => ({ ...actions, ...meta, ...state }), [actions, meta, state]);
}

/** Chỉ các hàm thao tác — tham chiếu cố định, không bao giờ gây render lại */
export function useBoardActions(): BoardActions {
  const ctx = useContext(ActionsContext);
  if (!ctx) throw new Error("useBoardActions phải nằm trong <BoardProvider>");
  return ctx;
}

/** Board / cột / nhãn — chỉ đổi khi chính chúng đổi, không đổi khi vá thẻ */
export function useBoardMeta(): BoardMeta {
  const ctx = useContext(MetaContext);
  if (!ctx) throw new Error("useBoardMeta phải nằm trong <BoardProvider>");
  return ctx;
}
