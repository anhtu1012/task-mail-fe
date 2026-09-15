"use client";

/**
 * Dữ liệu và thao tác cho MỘT thẻ, tải riêng qua `GET /tasks/:id/detail`.
 *
 * Tách khỏi BoardStore vì `/boards/me/full` cố tình không trả mô tả / checklist /
 * ghi chú — trả kèm cho mọi thẻ sẽ khiến response phình lên vài MB.
 *
 * Mọi thao tác ở đây đều cập nhật lạc quan vào cache chi tiết, và khi cần thì
 * đồng bộ lại vài con số dẫn xuất trên thẻ ngoài canvas (số ghi chú, tiến độ
 * checklist) để hai chỗ không hiện lệch nhau.
 */
import { useCallback } from "react";
import { App } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { boardApi } from "@/apis/board.api";
import {
  BoardSnapshot,
  CardDetail,
  UpdateCardInput,
  computePosition,
} from "@/models/board";
import { getApiErrorMessage } from "@/utils/client/apiError";
import { isRichTextEmpty } from "@/utils/client/richText";
import { BOARD_QUERY_KEY } from "./BoardStore";

export const cardDetailKey = (cardId: string) => ["board", "card", cardId] as const;

export function useCardDetail(cardId: string) {
  const { message } = App.useApp();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: cardDetailKey(cardId),
    queryFn: () => boardApi.cardDetail(cardId),
    staleTime: 30_000,
  });

  const patchDetail = useCallback(
    (fn: (card: CardDetail) => CardDetail) => {
      queryClient.setQueryData<CardDetail>(cardDetailKey(cardId), (prev) =>
        prev ? fn(prev) : prev,
      );
    },
    [queryClient, cardId],
  );

  /** Đồng bộ các con số dẫn xuất sang thẻ ngoài canvas */
  const patchSummary = useCallback(
    (fn: (card: BoardSnapshot["cards"][number]) => BoardSnapshot["cards"][number]) => {
      queryClient.setQueryData<BoardSnapshot>(BOARD_QUERY_KEY, (prev) =>
        prev
          ? { ...prev, cards: prev.cards.map((c) => (c.id === cardId ? fn(c) : c)) }
          : prev,
      );
    },
    [queryClient, cardId],
  );

  const onFail = useCallback(
    (err: unknown) => {
      message.error(getApiErrorMessage(err));
      queryClient.invalidateQueries({ queryKey: cardDetailKey(cardId) });
    },
    [message, queryClient, cardId],
  );

  // ==========================================
  // MÔ TẢ / THUỘC TÍNH
  // ==========================================
  const updateCard = useMutation({
    mutationFn: (patch: UpdateCardInput) => boardApi.updateCard(cardId, patch),
    onMutate: (patch) => {
      patchDetail((card) => ({ ...card, ...patch } as CardDetail));
      if (patch.description !== undefined) {
        patchSummary((c) => ({ ...c, hasDescription: !isRichTextEmpty(patch.description) }));
      }
      if (patch.title !== undefined) patchSummary((c) => ({ ...c, title: patch.title! }));
      if (patch.priority !== undefined) patchSummary((c) => ({ ...c, priority: patch.priority! }));
      if (patch.cover !== undefined) patchSummary((c) => ({ ...c, cover: patch.cover ?? null }));
    },
    onError: onFail,
  });

  // ==========================================
  // CHECKLIST
  // ==========================================
  const addChecklist = useMutation({
    mutationFn: (title: string) => boardApi.addChecklist(cardId, title),
    onSuccess: (checklist) =>
      patchDetail((card) => ({ ...card, checklists: [...card.checklists, checklist] })),
    onError: onFail,
  });

  const addChecklistItem = useMutation({
    mutationFn: ({ checklistId, content }: { checklistId: string; content: string }) => {
      const list = query.data?.checklists.find((c) => c.id === checklistId);
      const position = computePosition(list?.items.at(-1)?.position, undefined);
      return boardApi.addChecklistItem(checklistId, content, position);
    },
    onSuccess: (item) => {
      patchDetail((card) => ({
        ...card,
        checklists: card.checklists.map((cl) =>
          cl.id === item.checklistId ? { ...cl, items: [...cl.items, item] } : cl,
        ),
      }));
      patchSummary((c) => ({ ...c, checklistTotal: c.checklistTotal + 1 }));
    },
    onError: onFail,
  });

  const toggleChecklistItem = useMutation({
    mutationFn: ({ itemId, checked }: { itemId: string; checked: boolean }) =>
      boardApi.updateChecklistItem(itemId, { checked }),
    onMutate: ({ itemId, checked }) => {
      patchDetail((card) => ({
        ...card,
        checklists: card.checklists.map((cl) => ({
          ...cl,
          items: cl.items.map((it) => (it.id === itemId ? { ...it, checked } : it)),
        })),
      }));
      patchSummary((c) => ({
        ...c,
        checklistDone: Math.max(0, c.checklistDone + (checked ? 1 : -1)),
      }));
    },
    onError: onFail,
  });

  const deleteChecklistItem = useMutation({
    mutationFn: (itemId: string) => boardApi.deleteChecklistItem(itemId),
    onMutate: (itemId) => {
      const removed = query.data?.checklists
        .flatMap((cl) => cl.items)
        .find((it) => it.id === itemId);
      patchDetail((card) => ({
        ...card,
        checklists: card.checklists.map((cl) => ({
          ...cl,
          items: cl.items.filter((it) => it.id !== itemId),
        })),
      }));
      patchSummary((c) => ({
        ...c,
        checklistTotal: Math.max(0, c.checklistTotal - 1),
        checklistDone: Math.max(0, c.checklistDone - (removed?.checked ? 1 : 0)),
      }));
    },
    onError: onFail,
  });

  // ==========================================
  // GHI CHÚ
  // ==========================================
  const addNote = useMutation({
    mutationFn: (content: string) => boardApi.addNote(cardId, content),
    onSuccess: (note) => {
      // Ghi chú mới nhất đứng đầu, giống thứ tự server trả
      patchDetail((card) => ({ ...card, notes: [note, ...card.notes] }));
      patchSummary((c) => ({ ...c, noteCount: c.noteCount + 1 }));
    },
    onError: onFail,
  });

  const deleteNote = useMutation({
    mutationFn: (noteId: string) => boardApi.deleteNote(noteId),
    onMutate: (noteId) => {
      patchDetail((card) => ({ ...card, notes: card.notes.filter((n) => n.id !== noteId) }));
      patchSummary((c) => ({ ...c, noteCount: Math.max(0, c.noteCount - 1) }));
    },
    onError: onFail,
  });

  return {
    card: query.data,
    isLoading: query.isLoading,
    error: query.error,
    updateCard,
    addChecklist,
    addChecklistItem,
    toggleChecklistItem,
    deleteChecklistItem,
    addNote,
    deleteNote,
  };
}
