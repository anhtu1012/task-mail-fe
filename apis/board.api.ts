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
  /** Một lần gọi dựng cả màn. Backend tự tạo bảng ở lần gọi đầu tiên (§1.8). */
  public snapshot(cardsPerList = 20): Promise<BoardSnapshot> {
    return this.getWithParams<BoardSnapshot>(
      API_ENDPOINTS.BOARD.ME_FULL,
      params({ cardsPerList, tz: browserTimezone() }),
    );
  }

  public agenda(date?: string): Promise<AgendaResponse> {
    return this.getWithParams<AgendaResponse>(
      API_ENDPOINTS.BOARD.ME_AGENDA,
      params({ date, tz: browserTimezone() }),
    );
  }

  public search(q: string, limit = 8): Promise<SearchResponse> {
    return this.getWithParams<SearchResponse>(
      API_ENDPOINTS.BOARD.ME_SEARCH,
      params({ q, limit }),
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

  public updateList(listId: string, input: UpdateListInput): Promise<BoardList> {
    return this.patch<BoardList, UpdateListInput>(
      API_ENDPOINTS.LISTS.DETAIL(listId),
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

  public rebalanceInbox(): Promise<{ id: string; position: number }[]> {
    return this.post<{ id: string; position: number }[], object>(
      API_ENDPOINTS.BOARD.INBOX_REBALANCE,
      {},
    );
  }

  /** Tải tiếp khi cuộn trong một cột. `listId = null` nghĩa là Hộp thư đến. */
  public listCards(
    listId: string | null,
    opts: { cursor?: number; limit?: number } = {},
  ): Promise<CardPage> {
    const url =
      listId === null
        ? API_ENDPOINTS.BOARD.INBOX_CARDS
        : API_ENDPOINTS.LISTS.CARDS(listId);
    return this.getWithParams<CardPage>(url, params({ ...opts }));
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
    const query = undo ? "?undo=true" : "";
    return this.patch<MoveCardResult, typeof body>(
      `${API_ENDPOINTS.CARDS.MOVE(cardId)}${query}`,
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

  public updateCard(cardId: string, input: UpdateCardInput): Promise<unknown> {
    return this.patch<unknown, UpdateCardInput>(
      API_ENDPOINTS.TASKS.DETAIL(cardId),
      clean(input),
    );
  }

  public completeCard(cardId: string): Promise<CompleteCardResponse> {
    return this.patch<CompleteCardResponse, object>(
      API_ENDPOINTS.TASKS.COMPLETE(cardId),
      {},
    );
  }

  public reopenCard(cardId: string): Promise<CardSummary> {
    return this.patch<CardSummary, object>(API_ENDPOINTS.CARDS.REOPEN(cardId), {});
  }

  /** Xoá mềm — khôi phục được bằng `restoreCard` (§9) */
  public deleteCard(cardId: string): Promise<void> {
    return this.delete<void>(API_ENDPOINTS.TASKS.DETAIL(cardId));
  }

  public restoreCard(cardId: string): Promise<CardSummary> {
    return this.post<CardSummary, object>(API_ENDPOINTS.CARDS.RESTORE(cardId), {});
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
    const query = undo ? "?undo=true" : "";
    return this.patch<ChecklistItem, typeof input>(
      `${API_ENDPOINTS.CHECKLIST_ITEMS.DETAIL(itemId)}${query}`,
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
  public labels(): Promise<BoardLabel[]> {
    return this.get<BoardLabel[]>(API_ENDPOINTS.BOARD.ME_LABELS);
  }
}

export const boardApi = new BoardApi();
