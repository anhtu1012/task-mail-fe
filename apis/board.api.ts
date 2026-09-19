/**
 * Lớp gọi API của bảng công việc cá nhân.
 *
 * Bám sát docs/backend/board-api-contract.md. Vài điểm đã gài sẵn ở đây để
 * component không phải nhớ:
 *   - response trả THẲNG object, không có lớp bọc `{ success, data }` (§1.1);
 *   - body thừa field sẽ bị 400 vì backend bật `forbidNonWhitelisted` (§1.5),
 *     nên các hàm dưới đây chỉ gửi đúng field trong hợp đồng;
 *   - `?tz=` gửi kèm mọi endpoint có tính "hôm nay" (§3.2);
 *   - `?undo=true` cho thao tác hoàn tác để backend bỏ ghi nhật ký (§9).
 */
import {
  AgendaResponse,
  Board,
  BoardLabel,
  BoardList,
  BoardSnapshot,
  CardDetail,
  CardPage,
  CardSummary,
  Checklist,
  ChecklistItem,
  CompleteCardResponse,
  CreateCardInput,
  CreateListInput,
  MoveCardResult,
  CardNote,
  SearchResponse,
  UpdateCardInput,
  UpdateListInput,
  browserTimezone,
} from "@/models/board";
import { AxiosService } from "./axios.base";
import { API_ENDPOINTS } from "./endpoints";

/** Bỏ field undefined để không dính forbidNonWhitelisted và query rác */
const clean = <T extends object>(obj: T): Partial<T> => {
  const out: Record<string, unknown> = {};
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined) out[k] = v;
  });
  return out as Partial<T>;
};

/**
 * Nối `?undo=true` khi đang replay một thao tác Ctrl+Z.
 * Backend nhận cờ này ở MỌI endpoint ghi (kể cả nơi nó là no-op) nên FE không
 * phải nhớ chỗ nào hỗ trợ chỗ nào không. Chỉ `true` / `1` mới được tính là undo.
 */
const undoQuery = (undo?: boolean) => (undo ? "?undo=true" : "");

const params = (obj: Record<string, unknown>): URLSearchParams => {
  const search = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") search.set(k, String(v));
  });
  return search;
};

class BoardApi extends AxiosService {
  // ==========================================
  // BẢNG
  // ==========================================
  /**
   * Một lần gọi dựng cả màn. Backend tự tạo bảng ở lần gọi đầu tiên (§1.8).
   *
   * `projectId` là BẮT BUỘC về mặt sử dụng dù kiểu cho phép bỏ trống: mỗi dự
   * án có bảng riêng, thiếu tham số thì backend trả bảng mặc định của tài
   * khoản và người dùng sẽ thấy sai bảng sau khi đổi dự án. Xem
   * docs/backend/project-api-spec.md §6.
   */
  public snapshot(
    projectId?: string,
    cardsPerList = 20,
  ): Promise<BoardSnapshot> {
    return this.getWithParams<BoardSnapshot>(
      API_ENDPOINTS.BOARD.ME_FULL,
      params({ projectId, cardsPerList, tz: browserTimezone() }),
    );
  }

  public agenda(date?: string, projectId?: string): Promise<AgendaResponse> {
    return this.getWithParams<AgendaResponse>(
      API_ENDPOINTS.BOARD.ME_AGENDA,
      params({ date, projectId, tz: browserTimezone() }),
    );
  }

  public search(
    q: string,
    limit = 8,
    projectId?: string,
  ): Promise<SearchResponse> {
    return this.getWithParams<SearchResponse>(
      API_ENDPOINTS.BOARD.ME_SEARCH,
      params({ q, limit, projectId }),
    );
  }

  public updateBoard(
    id: string,
    input: { title?: string; starred?: boolean },
  ): Promise<Board> {
    return this.patch<Board, typeof input>(
      API_ENDPOINTS.BOARD.DETAIL(id),
      clean(input),
    );
  }

  // ==========================================
  // DANH SÁCH
  // ==========================================
  public createList(boardId: string, input: CreateListInput): Promise<BoardList> {
    return this.post<BoardList, CreateListInput>(
      API_ENDPOINTS.BOARD.LISTS(boardId),
      clean(input) as CreateListInput,
    );
  }

  public updateList(
    listId: string,
    input: UpdateListInput,
    undo = false,
  ): Promise<BoardList> {
    return this.patch<BoardList, UpdateListInput>(
      `${API_ENDPOINTS.LISTS.DETAIL(listId)}${undoQuery(undo)}`,
      clean(input),
    );
  }

  public moveList(listId: string, position: number): Promise<BoardList> {
    return this.patch<BoardList, { position: number }>(
      API_ENDPOINTS.LISTS.MOVE(listId),
      { position },
    );
  }

  public rebalanceList(listId: string): Promise<{ id: string; position: number }[]> {
    return this.post<{ id: string; position: number }[], object>(
      API_ENDPOINTS.LISTS.REBALANCE(listId),
      {},
    );
  }

  public rebalanceInbox(projectId?: string): Promise<{ id: string; position: number }[]> {
    return this.post<{ id: string; position: number }[], object>(
      `${API_ENDPOINTS.BOARD.INBOX_REBALANCE}${
        projectId ? `?projectId=${projectId}` : ""
      }`,
      {},
    );
  }

  /**
   * Tải tiếp khi cuộn trong một cột. `listId = null` nghĩa là Hộp thư đến.
   *
   * `projectId` chỉ có tác dụng ở nhánh Hộp thư đến — cột thì backend suy dự án
   * từ bảng chứa nó. Bỏ trống ở nhánh Hộp thư đến thì backend dùng dự án MẶC
   * ĐỊNH, tức là sẽ trả nhầm thẻ khi người dùng đang mở một dự án khác.
   */
  public listCards(
    listId: string | null,
    opts: { cursor?: number; limit?: number; projectId?: string } = {},
  ): Promise<CardPage> {
    const { projectId, ...rest } = opts;
    const url =
      listId === null
        ? API_ENDPOINTS.BOARD.INBOX_CARDS
        : API_ENDPOINTS.LISTS.CARDS(listId);
    return this.getWithParams<CardPage>(
      url,
      params(listId === null ? { ...rest, projectId } : rest),
    );
  }

  // ==========================================
  // THẺ
  // ==========================================
  public createCard(
    listId: string | null,
    input: CreateCardInput,
  ): Promise<CardSummary> {
    const url =
      listId === null
        ? API_ENDPOINTS.CARDS.INBOX_CREATE
        : API_ENDPOINTS.LISTS.CARDS(listId);
    return this.post<CardSummary, CreateCardInput>(url, clean(input) as CreateCardInput);
  }

  /**
   * `position` trong RESPONSE mới là chuẩn — nếu khe gửi lên đã bị chiếm,
   * backend tự dịch sang khe trống gần nhất (§4.1). Luôn ghi đè theo response.
   */
  public moveCard(
    cardId: string,
    body: { listId: string | null; position: number },
    undo = false,
  ): Promise<MoveCardResult> {
    return this.patch<MoveCardResult, typeof body>(
      `${API_ENDPOINTS.CARDS.MOVE(cardId)}${undoQuery(undo)}`,
      body,
    );
  }

  public snoozeCard(
    cardId: string,
    deadline: string | null,
    undo = false,
  ): Promise<CardSummary> {
    const query = params({ tz: browserTimezone(), undo: undo || undefined });
    return this.patch<CardSummary, { deadline: string | null }>(
      `${API_ENDPOINTS.CARDS.SNOOZE(cardId)}?${query.toString()}`,
      { deadline },
    );
  }

  public cardDetail(cardId: string): Promise<CardDetail> {
    return this.get<CardDetail>(API_ENDPOINTS.CARDS.DETAIL(cardId));
  }

  public updateCard(
    cardId: string,
    input: UpdateCardInput,
    undo = false,
  ): Promise<unknown> {
    return this.patch<unknown, UpdateCardInput>(
      `${API_ENDPOINTS.TASKS.DETAIL(cardId)}${undoQuery(undo)}`,
      clean(input),
    );
  }

  /**
   * Việc có `repeat` sẽ sinh luôn thẻ kế tiếp và trả trong `next`.
   * Với `undo = true` backend KHÔNG sinh thẻ lặp — dùng khi replay redo để
   * không nhân đôi việc.
   */
  public completeCard(cardId: string, undo = false): Promise<CompleteCardResponse> {
    return this.patch<CompleteCardResponse, object>(
      `${API_ENDPOINTS.TASKS.COMPLETE(cardId)}${undoQuery(undo)}`,
      {},
    );
  }

  public reopenCard(cardId: string, undo = false): Promise<CardSummary> {
    return this.patch<CardSummary, object>(
      `${API_ENDPOINTS.CARDS.REOPEN(cardId)}${undoQuery(undo)}`,
      {},
    );
  }

  /** Xoá mềm — khôi phục được bằng `restoreCard` (§9) */
  public deleteCard(cardId: string): Promise<void> {
    return this.delete<void>(API_ENDPOINTS.TASKS.DETAIL(cardId));
  }

  public restoreCard(cardId: string, undo = false): Promise<CardSummary> {
    return this.post<CardSummary, object>(
      `${API_ENDPOINTS.CARDS.RESTORE(cardId)}${undoQuery(undo)}`,
      {},
    );
  }

  public setCardLabels(cardId: string, labelIds: string[]): Promise<CardSummary> {
    return this.put<CardSummary, { labelIds: string[] }>(
      API_ENDPOINTS.CARDS.LABELS(cardId),
      { labelIds },
    );
  }

  // ==========================================
  // CHECKLIST · GHI CHÚ
  // ==========================================
  public addChecklist(cardId: string, title: string): Promise<Checklist> {
    return this.post<Checklist, { title: string }>(
      API_ENDPOINTS.CARDS.CHECKLISTS(cardId),
      { title },
    );
  }

  public deleteChecklist(checklistId: string): Promise<void> {
    return this.delete<void>(API_ENDPOINTS.CHECKLISTS.DETAIL(checklistId));
  }

  public addChecklistItem(
    checklistId: string,
    content: string,
    position?: number,
  ): Promise<ChecklistItem> {
    return this.post<ChecklistItem, { content: string; position?: number }>(
      API_ENDPOINTS.CHECKLISTS.ITEMS(checklistId),
      clean({ content, position }) as { content: string; position?: number },
    );
  }

  public updateChecklistItem(
    itemId: string,
    input: { checked?: boolean; content?: string; position?: number },
    undo = false,
  ): Promise<ChecklistItem> {
    return this.patch<ChecklistItem, typeof input>(
      `${API_ENDPOINTS.CHECKLIST_ITEMS.DETAIL(itemId)}${undoQuery(undo)}`,
      clean(input),
    );
  }

  public deleteChecklistItem(itemId: string): Promise<void> {
    return this.delete<void>(API_ENDPOINTS.CHECKLIST_ITEMS.DETAIL(itemId));
  }

  public addNote(cardId: string, content: string): Promise<CardNote> {
    return this.post<CardNote, { content: string }>(
      API_ENDPOINTS.CARDS.NOTES(cardId),
      { content },
    );
  }

  public deleteNote(noteId: string): Promise<void> {
    return this.delete<void>(API_ENDPOINTS.NOTES.DETAIL(noteId));
  }

  // ==========================================
  // NHÃN CỦA BẢNG
  // ==========================================
  /** Nhãn thuộc BẢNG, mà mỗi dự án một bảng -> thiếu `projectId` là lấy nhãn dự án mặc định */
  public labels(projectId?: string): Promise<BoardLabel[]> {
    return this.getWithParams<BoardLabel[]>(
      API_ENDPOINTS.BOARD.ME_LABELS,
      params({ projectId }),
    );
  }
}

export const boardApi = new BoardApi();
