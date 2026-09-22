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
import { TaskPriority } from "@/models/task";
import { useCurrentProject } from "@/hooks/useProjects";
import { getApiErrorMessage } from "@/utils/client/apiError";
import { quickParse } from "@/utils/client/quickParse";
import { useStickyState } from "./useStickyState";

/**
 * Khoá cache của bảng KHÔNG chứa projectId, dù mỗi dự án có một bảng riêng.
 *
 * Lý do: mọi cập nhật lạc quan trong file này vá thẳng vào khoá hằng số này.
 * Nhét projectId vào đây sẽ phải luồn nó qua vài chục chỗ mà chẳng được thêm
 * gì — vì `useSwitchProject` đã xoá sạch cache `["board", ...]` mỗi lần đổi dự
 * án, nên không bao giờ có chuyện bảng của dự án cũ còn nằm lại. Cái giá duy
 * nhất là quay lại dự án cũ thì phải tải lại bảng.
 */
export const BOARD_QUERY_KEY = ["board", "snapshot"] as const;

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
  /**
   * Bất đồng bộ vì có thể phải tạo nhãn mới trước khi tạo thẻ (quick-add gõ
   * "#nhãnchưacó"). Ô nhập `await` để hiện trạng thái đang lưu.
   */
  addCard: (listId: string | null, text: string, atTop?: boolean) => Promise<void>;
  /** Thẻ đang chờ server trả lời — cột vẽ ô mờ ở đúng chỗ nó sắp xuất hiện */
  pendingAdds: PendingAdd[];
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
  const { projectId } = useCurrentProject();

  const [filter, setFilter] = useState<BoardFilter>(EMPTY_FILTER);
  const [fullscreen, setFullscreen] = useStickyState("board:fullscreen", false);
  const [agendaOpen, setAgendaOpen] = useStickyState("board:agenda", true);
  const [paletteOpen, setPaletteOpen] = useState(false);
  /** Khoá cột đang tải trang kế tiếp — để đúng một nút hiện trạng thái chờ */
  const [loadingMore, setLoadingMore] = useState<string | null>(null);
  const [pendingAdds, setPendingAdds] = useState<PendingAdd[]>([]);

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
    queryFn: () => boardApi.snapshot(projectId ?? undefined),
    enabled: !!projectId,
    // Thao tác kéo thả đã cập nhật lạc quan rồi, không cần tải lại liên tục
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

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
      if (!data?.board) return null;
      try {
        const label = await boardApi.createLabel(data.board.id, input);
        patchSnapshot((snap) => ({ ...snap, labels: [...snap.labels, label] }));
        return label;
      } catch (error) {
        onFail(error);
        return null;
      }
    },
    [data, patchSnapshot, onFail],
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
        derived.cardById.get(cardId) ??
        queryClient.getQueryData<CardDetail>(cardDetailKey(cardId));
      if (!card) return;

      const next = card.labelIds.includes(labelId)
        ? card.labelIds.filter((id) => id !== labelId)
        : [...card.labelIds, labelId];

      patchSnapshot((snap) => ({
        ...snap,
        cards: snap.cards.map((c) =>
          c.id === cardId ? { ...c, labelIds: next } : c,
        ),
      }));

      /*
       * PHẢI vá cả cache chi tiết. Thiếu dòng này sinh ra một lỗi nhìn rất khó
       * hiểu: màn chi tiết đọc `labelIds` từ query riêng của nó, nên bấm lần
       * đầu thì nhãn ĐÃ được gắn ở máy chủ nhưng giao diện không hiện dấu tích
       * — người dùng bấm lại, lần này `next` thành mảng rỗng và API xoá đúng
       * cái nhãn vừa gắn. Triệu chứng nhìn thấy: "bấm chọn nhãn không được, API
       * gửi {labelIds: []}".
       */
      patchCardDetail(cardId, (detail) => ({ ...detail, labelIds: next }));

      boardApi.setCardLabels(cardId, next).catch(onFail);
    },
    [derived.cardById, queryClient, patchSnapshot, patchCardDetail, onFail],
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
      const card = derived.cardById.get(cardId);
      if (!card || card.listId === toListId) return;
      const from = { listId: card.listId, position: card.position };
      // Thả xuống cuối cột đích — chỗ dễ đoán nhất khi không tự chọn vị trí
      previewMove(cardId, toListId, rawSiblings(toListId, cardId).length);
      commitMove(cardId, from);
    },
    [derived.cardById, previewMove, commitMove, rawSiblings],
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
      const known = data?.labels ?? [];
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
        .catch(onFail)
        .finally(() => {
          // Gỡ ô mờ dù thành công hay lỗi — lỗi đã có thông báo riêng, để ô mờ
          // nằm lại vĩnh viễn thì tệ hơn nhiều
          setPendingAdds((prev) => prev.filter((p) => p.key !== pendingKey));
        });
    },
    [
      data,
      projectId,
      createLabel,
      rawSiblings,
      patchSnapshot,
      pushHistory,
      onFail,
    ],
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
          });
        })
        .catch(onFail);
    },
    [derived.cardById, patchSnapshot, patchCardDetail, pushHistory, onFail],
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
      patchCardDetail(cardId, (detail) => ({
        ...detail,
        deadline,
        deadlineStatus: "IN_PROGRESS",
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
    [derived.cardById, patchSnapshot, patchCardDetail, pushHistory, onFail],
  );

  const toggleComplete = useCallback(
    (cardId: string): Promise<void> => {
      /*
       * Tìm thẻ ở snapshot trước, không thấy thì hỏi cache chi tiết.
       *
       * Snapshot chỉ chứa 20 thẻ đầu mỗi cột, nên mở thẳng một thẻ bằng URL
       * (link chia sẻ, hoặc thẻ nằm sâu trong cột) thì nó KHÔNG có ở đó. Bản
       * cũ `return` im lặng — người dùng bấm "Hoàn thành" và không có gì xảy
       * ra, cũng không có lỗi nào để lần ra.
       */
      const card =
        derived.cardById.get(cardId) ??
        queryClient.getQueryData<CardDetail>(cardDetailKey(cardId));
      if (!card) return Promise.resolve();
      const wasDone = card.completedAt !== null;

      if (wasDone) {
        return boardApi
          .reopenCard(cardId)
          .then((res) => {
            patchSnapshot((snap) => ({
              ...snap,
              cards: snap.cards.map((c) => (c.id === res.id ? res : c)),
            }));
            patchCardDetail(cardId, (card) => ({
              ...card,
              status: res.status,
              completedAt: res.completedAt,
              deadlineStatus: res.deadlineStatus,
            }));
            invalidateOutside();
            pushHistory({
              label: "mở lại việc",
              undo: () => boardApi.completeCard(cardId, true),
              redo: () => boardApi.reopenCard(cardId, true),
            });
          })
          .catch(onFail);
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
          patchCardDetail(cardId, (card) => ({
            ...card,
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
    [
      derived.cardById,
      queryClient,
      patchSnapshot,
      patchCardDetail,
      invalidateOutside,
      pushHistory,
      onFail,
      message,
    ],
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

  // ---------- tải thêm thẻ ----------
  /*
   * `/full` chỉ trả 20 thẻ đầu mỗi cột. Không có hàm này thì thẻ thứ 21 trở đi
   * không có đường nào chạm tới: cột vẫn hiện "20/47" nhưng 27 thẻ kia biến mất
   * khỏi giao diện.
   *
   * Con trỏ là `position` của thẻ cuối ĐÃ TẢI, không phải số trang: thẻ được
   * chèn/kéo liên tục nên đánh số trang sẽ nhảy cóc hoặc lặp thẻ.
   */
  const loadMoreCards = useCallback(
    async (listId: string | null) => {
      const key = listId ?? INBOX_KEY;
      const loaded = (data?.cards ?? [])
        .filter((c) => c.listId === listId)
        .sort(byPosition);
      const cursor = loaded.at(-1)?.position;

      setLoadingMore(key);
      try {
        const page = await boardApi.listCards(listId, {
          cursor,
          limit: 20,
          projectId: projectId ?? undefined,
        });
        patchSnapshot((snap) => {
          const known = new Set(snap.cards.map((c) => c.id));
          const fresh = page.items.filter((c) => !known.has(c.id));
          return { ...snap, cards: [...snap.cards, ...fresh] };
        });
      } catch (error) {
        onFail(error);
      } finally {
        setLoadingMore(null);
      }
    },
    [data, projectId, patchSnapshot, onFail],
  );

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
      pendingAdds,
      moveCardToList,
      updateCard,
      deleteCard,
      snoozeCard,
      toggleComplete,
      addList,
      renameList,
      archiveList,
      moveList,
      toggleStar,

      createLabel,
      updateLabel,
      deleteLabel,
      toggleCardLabel,
      loadMoreCards,
      loadingMore,

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
      pendingAdds,
      moveCardToList,
      updateCard,
      deleteCard,
      snoozeCard,
      toggleComplete,
      addList,
      renameList,
      archiveList,
      moveList,
      toggleStar,
      createLabel,
      updateLabel,
      deleteLabel,
      toggleCardLabel,
      loadMoreCards,
      loadingMore,
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
