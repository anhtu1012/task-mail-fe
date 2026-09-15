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
  useMemo,
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
  CreateCardInput,
  INBOX_KEY,
  TodayStats,
  UpdateCardInput,
  byPosition,
  computePosition,
} from "@/models/board";
import { TaskPriority } from "@/models/task";
import { getApiErrorMessage } from "@/utils/client/apiError";
import { quickParse } from "@/utils/client/quickParse";
import { useStickyState } from "./useStickyState";

export const BOARD_QUERY_KEY = ["board", "snapshot"] as const;

// ==========================================
// HOÀN TÁC
// ==========================================
type UndoEntry = {
  label: string;
  undo: () => Promise<unknown>;
  redo: () => Promise<unknown>;
};

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

// ==========================================
// CONTEXT
// ==========================================
type BoardContextValue = {
  /** null khi chưa tải xong — component phải chịu được trạng thái này */
  board: Board | null;
  lists: BoardList[];
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
  addCard: (listId: string | null, text: string, atTop?: boolean) => void;
  updateCard: (cardId: string, patch: UpdateCardInput) => void;
  deleteCard: (cardId: string) => void;
  snoozeCard: (cardId: string, deadline: string | null, label: string) => void;
  toggleComplete: (cardId: string) => void;
  addList: (title: string) => void;
  renameList: (listId: string, title: string) => void;
  archiveList: (listId: string) => void;
  moveList: (listId: string, toIndex: number) => void;
  toggleStar: () => void;

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
  paletteOpen: boolean;
  setPaletteOpen: (v: boolean) => void;
};

const BoardContext = createContext<BoardContextValue | null>(null);

const EMPTY_TODAY: TodayStats = {
  overdue: 0,
  dueToday: 0,
  doneToday: 0,
  plannedMinutes: 0,
};

export function BoardProvider({ children }: { children: ReactNode }) {
  const { message } = App.useApp();
  const queryClient = useQueryClient();

  const [filter, setFilter] = useState<BoardFilter>(EMPTY_FILTER);
  const [fullscreen, setFullscreen] = useStickyState("board:fullscreen", false);
  const [agendaOpen, setAgendaOpen] = useStickyState("board:agenda", true);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Lịch sử hoàn tác là STATE chứ không phải ref: nút hoàn tác/làm lại đọc nó
  // lúc render, mà đọc ref trong render là sai (React không đảm bảo render lại).
  const [past, setPast] = useState<UndoEntry[]>([]);
  const [future, setFuture] = useState<UndoEntry[]>([]);

  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: BOARD_QUERY_KEY,
    queryFn: () => boardApi.snapshot(),
    // Thao tác kéo thả đã cập nhật lạc quan rồi, không cần tải lại liên tục
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  /** Sửa cache tại chỗ — mọi cập nhật lạc quan đều đi qua đây */
  const patchSnapshot = useCallback(
    (fn: (snap: BoardSnapshot) => BoardSnapshot) => {
      queryClient.setQueryData<BoardSnapshot>(BOARD_QUERY_KEY, (prev) =>
        prev ? fn(prev) : prev,
      );
    },
    [queryClient],
  );

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: BOARD_QUERY_KEY });
    // Lịch hôm nay là query riêng, không tự cập nhật theo snapshot
    queryClient.invalidateQueries({ queryKey: ["board", "agenda"] });
    // Các màn cũ (/tasks, /kanban, /dashboard) đọc cùng dữ liệu task
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
    queryClient.invalidateQueries({ queryKey: ["task-stats"] });
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
  const pushHistory = useCallback((entry: UndoEntry) => {
    setPast((prev) => [...prev, entry].slice(-HISTORY_LIMIT));
    setFuture([]);
  }, []);

  // ==========================================
  // DẪN XUẤT
  // ==========================================
  const derived = useMemo(() => {
    const today = new Date();
    const allLists = data?.lists ?? [];
    const lists = allLists.filter((l) => !l.archived).sort(byPosition);
    const cards = data?.cards ?? [];

    const cardsByList = new Map<string, CardSummary[]>();
    lists.forEach((l) => cardsByList.set(l.id, []));
    const inboxCards: CardSummary[] = [];

    cards.forEach((card) => {
      if (!matchesFilter(card, filter, today)) return;
      if (card.listId === null) inboxCards.push(card);
      else cardsByList.get(card.listId)?.push(card);
    });

    cardsByList.forEach((list) => list.sort(byPosition));
    inboxCards.sort(byPosition);

    const counts = data?.cardCounts ?? {};
    const totalByList = new Map<string, number>(
      lists.map((l) => [l.id, counts[l.id] ?? 0]),
    );

    return {
      lists,
      cardsByList,
      inboxCards,
      totalByList,
      inboxTotal: counts[INBOX_KEY] ?? 0,
      labelById: new Map((data?.labels ?? []).map((l) => [l.id, l])),
      cardById: new Map(cards.map((c) => [c.id, c])),
    };
  }, [data, filter]);

  /** Danh sách thẻ của một cột lấy từ cache gốc (chưa lọc) — dùng khi tính position */
  const rawSiblings = useCallback(
    (listId: string | null, excludeId?: string): CardSummary[] =>
      (data?.cards ?? [])
        .filter((c) => c.listId === listId && c.id !== excludeId)
        .sort(byPosition),
    [data],
  );

  // ==========================================
  // THAO TÁC
  // ==========================================
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

  const previewMove = useCallback(
    (cardId: string, toListId: string | null, toIndex: number) => {
      const card = derived.cardById.get(cardId);
      if (!card) return;
      const siblings = rawSiblings(toListId, cardId);
      const position = computePosition(
        siblings[toIndex - 1]?.position,
        siblings[toIndex]?.position,
      );
      if (card.listId === toListId && card.position === position) return;
      patchSnapshot((snap) => ({
        ...snap,
        cards: snap.cards.map((c) =>
          c.id === cardId ? { ...c, listId: toListId, position } : c,
        ),
      }));
    },
    [derived.cardById, rawSiblings, patchSnapshot],
  );

  const commitMove = useCallback(
    (cardId: string, from: { listId: string | null; position: number }) => {
      const card = derived.cardById.get(cardId);
      if (!card) return;
      // Kéo rồi thả về đúng chỗ cũ -> không có gì để ghi
      if (card.listId === from.listId && card.position === from.position) return;

      const to = { listId: card.listId, position: card.position };
      moveMutation.mutate({ cardId, ...to });
      pushHistory({
        label: "di chuyển việc",
        undo: () => boardApi.moveCard(cardId, from, true),
        redo: () => boardApi.moveCard(cardId, to, true),
      });
    },
    [derived.cardById, moveMutation, pushHistory],
  );

  const addCard = useCallback(
    (listId: string | null, text: string, atTop = false) => {
      // Tách hạn / ưu tiên / nhãn / thời lượng ngay từ dòng người dùng gõ.
      // Backend KHÔNG phân tích chuỗi tự nhiên (§4.2) nên việc này phải làm ở đây.
      const parsed = quickParse(text);
      const labelIds = parsed.labelSlugs
        .map((slug) => (data?.labels ?? []).find((l) => l.slug === slug)?.id)
        .filter((id): id is string => !!id);

      const siblings = rawSiblings(listId);
      const position = atTop
        ? computePosition(undefined, siblings[0]?.position)
        : computePosition(siblings.at(-1)?.position, undefined);

      const input: CreateCardInput = {
        title: parsed.title,
        position,
        deadline: parsed.deadline,
        priority: parsed.priority ?? TaskPriority.NORMAL,
        labelIds: labelIds.length ? labelIds : undefined,
        estimateMinutes: parsed.estimateMinutes ?? undefined,
      };

      boardApi
        .createCard(listId, input)
        .then((card) => {
          patchSnapshot((snap) => ({
            ...snap,
            cards: [...snap.cards, card],
            cardCounts: {
              ...snap.cardCounts,
              [listId ?? INBOX_KEY]: (snap.cardCounts[listId ?? INBOX_KEY] ?? 0) + 1,
            },
          }));
          pushHistory({
            label: "thêm việc",
            undo: () => boardApi.deleteCard(card.id),
            redo: () => boardApi.restoreCard(card.id, true),
          });
        })
        .catch(onFail);
    },
    [data, rawSiblings, patchSnapshot, pushHistory, onFail],
  );

  const updateCard = useCallback(
    (cardId: string, patch: UpdateCardInput) => {
      const before = derived.cardById.get(cardId);
      patchSnapshot((snap) => ({
        ...snap,
        cards: snap.cards.map((c) =>
          c.id === cardId
            ? {
                ...c,
                ...(patch.title !== undefined ? { title: patch.title } : {}),
                ...(patch.priority !== undefined ? { priority: patch.priority } : {}),
                ...(patch.cover !== undefined ? { cover: patch.cover } : {}),
                ...(patch.deadline !== undefined ? { deadline: patch.deadline } : {}),
                ...(patch.description !== undefined
                  ? { hasDescription: !!patch.description }
                  : {}),
              }
            : c,
        ),
      }));

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
          });
        })
        .catch(onFail);
    },
    [derived.cardById, patchSnapshot, pushHistory, onFail],
  );

  const deleteCard = useCallback(
    (cardId: string) => {
      const card = derived.cardById.get(cardId);
      patchSnapshot((snap) => ({
        ...snap,
        cards: snap.cards.filter((c) => c.id !== cardId),
      }));
      boardApi
        .deleteCard(cardId)
        .then(() => {
          message.success("Đã xoá việc");
          if (!card) return;
          pushHistory({
            label: "xoá việc",
            undo: () => boardApi.restoreCard(cardId, true),
            redo: () => boardApi.deleteCard(cardId),
          });
        })
        .catch(onFail);
    },
    [derived.cardById, patchSnapshot, pushHistory, onFail, message],
  );

  const snoozeCard = useCallback(
    (cardId: string, deadline: string | null, label: string) => {
      const before = derived.cardById.get(cardId)?.deadline ?? null;
      patchSnapshot((snap) => ({
        ...snap,
        cards: snap.cards.map((c) =>
          c.id === cardId ? { ...c, deadline, deadlineStatus: "IN_PROGRESS" } : c,
        ),
      }));
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
          });
        })
        .catch(onFail);
    },
    [derived.cardById, patchSnapshot, pushHistory, onFail],
  );

  const toggleComplete = useCallback(
    (cardId: string) => {
      const card = derived.cardById.get(cardId);
      if (!card) return;
      const wasDone = card.completedAt !== null;

      if (wasDone) {
        boardApi
          .reopenCard(cardId)
          .then((res) => {
            patchSnapshot((snap) => ({
              ...snap,
              cards: snap.cards.map((c) => (c.id === res.id ? res : c)),
            }));
            pushHistory({
              label: "mở lại việc",
              undo: () => boardApi.completeCard(cardId, true),
              redo: () => boardApi.reopenCard(cardId, true),
            });
          })
          .catch(onFail);
        return;
      }

      boardApi
        .completeCard(cardId)
        .then(({ completed, next }) => {
          patchSnapshot((snap) => ({
            ...snap,
            cards: [
              ...snap.cards.map((c) => (c.id === completed.id ? completed : c)),
              ...(next ? [next] : []),
            ],
          }));
          message.success(
            next
              ? `${completed.code} đã hoàn thành 🎉 — đã tạo lượt kế tiếp ${next.code}`
              : `${completed.code} đã hoàn thành 🎉`,
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

          pushHistory({
            label: "hoàn thành việc",
            undo: async () => {
              await boardApi.reopenCard(cardId, true);
              if (spawned) {
                await boardApi.deleteCard(spawned);
                spawned = null;
              }
            },
            redo: async () => {
              const again = await boardApi.completeCard(cardId);
              spawned = again.next?.id ?? null;
            },
          });
        })
        .catch(onFail);
    },
    [derived.cardById, patchSnapshot, pushHistory, onFail, message],
  );

  // ---------- danh sách ----------
  const addList = useCallback(
    (title: string) => {
      if (!data?.board) return;
      const last = [...derived.lists].sort(byPosition).at(-1);
      boardApi
        .createList(data.board.id, {
          title,
          position: computePosition(last?.position, undefined),
        })
        .then((list) => {
          patchSnapshot((snap) => ({ ...snap, lists: [...snap.lists, list] }));
        })
        .catch(onFail);
    },
    [data, derived.lists, patchSnapshot, onFail],
  );

  const renameList = useCallback(
    (listId: string, title: string) => {
      const before = derived.lists.find((l) => l.id === listId)?.title;
      patchSnapshot((snap) => ({
        ...snap,
        lists: snap.lists.map((l) => (l.id === listId ? { ...l, title } : l)),
      }));
      boardApi
        .updateList(listId, { title })
        .then(() => {
          if (before === undefined) return;
          pushHistory({
            label: "đổi tên danh sách",
            undo: () => boardApi.updateList(listId, { title: before }, true),
            redo: () => boardApi.updateList(listId, { title }, true),
          });
        })
        .catch(onFail);
    },
    [derived.lists, patchSnapshot, pushHistory, onFail],
  );

  const archiveList = useCallback(
    (listId: string) => {
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
            undo: () => boardApi.updateList(listId, { archived: false }, true),
            redo: () => boardApi.updateList(listId, { archived: true }, true),
          });
          invalidate();
        })
        .catch(onFail);
    },
    [patchSnapshot, pushHistory, onFail, message, invalidate],
  );

  const moveList = useCallback(
    (listId: string, toIndex: number) => {
      const others = derived.lists.filter((l) => l.id !== listId);
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
    [derived.lists, patchSnapshot, onFail],
  );

  const toggleStar = useCallback(() => {
    if (!data?.board) return;
    const next = !data.board.starred;
    patchSnapshot((snap) => ({ ...snap, board: { ...snap.board, starred: next } }));
    boardApi.updateBoard(data.board.id, { starred: next }).catch(onFail);
  }, [data, patchSnapshot, onFail]);

  // ---------- hoàn tác ----------
  const undo = useCallback(() => {
    const entry = past.at(-1);
    if (!entry) return;
    setPast((prev) => prev.slice(0, -1));
    setFuture((prev) => [entry, ...prev]);
    entry.undo().then(invalidate).catch(onFail);
  }, [past, invalidate, onFail]);

  const redo = useCallback(() => {
    const entry = future[0];
    if (!entry) return;
    setFuture((prev) => prev.slice(1));
    setPast((prev) => [...prev, entry]);
    entry.redo().then(invalidate).catch(onFail);
  }, [future, invalidate, onFail]);

  // ==========================================
  const value = useMemo<BoardContextValue>(
    () => ({
      board: data?.board ?? null,
      labels: data?.labels ?? [],
      today: data?.today ?? EMPTY_TODAY,
      ...derived,

      isLoading,
      isFetching,
      error,
      refetch,

      filter,
      setFilter,
      filterActive:
        !!filter.keyword ||
        filter.labelIds.length > 0 ||
        filter.overdueOnly ||
        filter.todayOnly,

      previewMove,
      commitMove,
      addCard,
      updateCard,
      deleteCard,
      snoozeCard,
      toggleComplete,
      addList,
      renameList,
      archiveList,
      moveList,
      toggleStar,

      undo,
      redo,
      canUndo: past.length > 0,
      canRedo: future.length > 0,
      lastLabel: past.at(-1)?.label ?? null,

      fullscreen,
      setFullscreen,
      agendaOpen,
      setAgendaOpen,
      paletteOpen,
      setPaletteOpen,
    }),
    [
      data,
      derived,
      isLoading,
      isFetching,
      error,
      refetch,
      filter,
      previewMove,
      commitMove,
      addCard,
      updateCard,
      deleteCard,
      snoozeCard,
      toggleComplete,
      addList,
      renameList,
      archiveList,
      moveList,
      toggleStar,
      undo,
      redo,
      past,
      future,
      fullscreen,
      setFullscreen,
      agendaOpen,
      setAgendaOpen,
      paletteOpen,
    ],
  );

  return <BoardContext.Provider value={value}>{children}</BoardContext.Provider>;
}

export function useBoard(): BoardContextValue {
  const ctx = useContext(BoardContext);
  if (!ctx) throw new Error("useBoard phải nằm trong <BoardProvider>");
  return ctx;
}
