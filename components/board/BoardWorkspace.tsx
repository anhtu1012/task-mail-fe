"use client";

/**
 * Inbox + thanh công cụ + canvas, tất cả trong một DndContext
 * để kéo được thẻ từ Inbox thẳng vào danh sách.
 *
 * Quy ước id vùng thả:
 *   - id của thẻ          -> thả cạnh thẻ đó
 *   - "list-drop-<listId>" -> thả vào thân danh sách (kể cả danh sách rỗng)
 *   - "inbox-drop"         -> trả thẻ về Hộp thư đến
 */
import { useCallback, useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { BoardCard, byPosition } from "@/models/board";
import { useBoard } from "./BoardStore";
import { BoardCanvas } from "./BoardCanvas";
import { BoardToolbar } from "./BoardToolbar";
import { CardTile } from "./CardTile";
import { InboxPanel } from "./InboxPanel";
import { AgendaPanel } from "./AgendaPanel";
import { CommandPalette } from "./CommandPalette";

const LIST_DROP_PREFIX = "list-drop-";
export const INBOX_DROP_ID = "inbox-drop";

export function BoardWorkspace() {
  const { lists, cardsByList, inboxCards, cardById, dispatch } = useBoard();
  const [activeCard, setActiveCard] = useState<BoardCard | null>(null);
  const [activeListId, setActiveListId] = useState<string | null>(null);

  // Ngưỡng 6px: dưới ngưỡng coi là click mở thẻ, trên ngưỡng mới tính là kéo.
  // Thiếu cái này thì mọi cú click vào thẻ đều bị nuốt thành thao tác kéo.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const cardsOf = useCallback(
    (listId: string | null): BoardCard[] =>
      listId === null ? inboxCards : (cardsByList.get(listId) ?? []),
    [cardsByList, inboxCards],
  );

  /** Giải mã id vùng thả -> danh sách đích, undefined nếu không phải vùng hợp lệ */
  const resolveListId = useCallback(
    (overId: string): string | null | undefined => {
      if (overId === INBOX_DROP_ID) return null;
      if (overId.startsWith(LIST_DROP_PREFIX)) return overId.slice(LIST_DROP_PREFIX.length);
      const overCard = cardById.get(overId);
      if (overCard) return overCard.listId;
      if (lists.some((l) => l.id === overId)) return overId;
      return undefined;
    },
    [cardById, lists],
  );

  const onDragStart = (event: DragStartEvent) => {
    const type = event.active.data.current?.type;
    if (type === "card") setActiveCard(cardById.get(String(event.active.id)) ?? null);
    if (type === "list") setActiveListId(String(event.active.id));
  };

  /**
   * Di chuyển thẻ ngay trong lúc kéo để người dùng thấy chỗ trống mở ra
   * đúng vị trí sẽ thả, chứ không phải đợi tới lúc nhả chuột.
   */
  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || active.data.current?.type !== "card") return;

    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    const toListId = resolveListId(overId);
    if (toListId === undefined) return;

    const siblings = cardsOf(toListId).filter((c) => c.id !== activeId);
    let toIndex = siblings.length;

    const overCard = cardById.get(overId);
    if (overCard) {
      const overIndex = siblings.findIndex((c) => c.id === overId);
      if (overIndex === -1) return;
      // Qua quá nửa chiều cao thẻ đích thì chèn xuống dưới nó
      const activeRect = active.rect.current.translated;
      const below =
        !!activeRect && activeRect.top > over.rect.top + over.rect.height / 2;
      toIndex = overIndex + (below ? 1 : 0);
    }

    dispatch({ type: "MOVE_CARD", cardId: activeId, toListId, toIndex });
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);
    setActiveListId(null);
    if (!over) return;

    // Thẻ đã đặt đúng chỗ trong onDragOver rồi, ở đây chỉ còn xử lý kéo danh sách
    if (active.data.current?.type !== "list") return;

    const activeId = String(active.id);
    const targetListId = resolveListId(String(over.id));
    if (targetListId === undefined || targetListId === null) return;

    const others = lists.filter((l) => l.id !== activeId).sort(byPosition);
    const toIndex = others.findIndex((l) => l.id === targetListId);
    if (toIndex === -1) return;

    dispatch({ type: "MOVE_LIST", listId: activeId, toIndex });
  };

  const activeListTitle = useMemo(
    () => lists.find((l) => l.id === activeListId)?.title,
    [lists, activeListId],
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={() => {
        setActiveCard(null);
        setActiveListId(null);
      }}
    >
      <div className="flex-1 min-h-0 flex gap-3">
        <InboxPanel />
        <div className="flex-1 min-w-0 flex flex-col gap-3">
          <BoardToolbar />
          <div className="flex-1 min-h-0 flex gap-3">
            <BoardCanvas />
            <AgendaPanel />
          </div>
        </div>
      </div>

      <CommandPalette />

      {/* Bản sao bay theo con trỏ — thẻ gốc để nguyên chỗ trống làm placeholder */}
      <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(.2,.8,.4,1)" }}>
        {activeCard && (
          <div className="w-[264px] rotate-2">
            <CardTile card={activeCard} overlay />
          </div>
        )}
        {activeListTitle && (
          <div
            className="w-[288px] rounded-xl bg-white px-3 py-2.5 rotate-1"
            style={{ boxShadow: "0 12px 28px rgba(10,67,109,.22)" }}
          >
            <span className="text-[14px] font-semibold text-[#333]">{activeListTitle}</span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
