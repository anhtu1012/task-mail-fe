"use client";

import { useCallback, useState } from "react";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { useBoard } from "./BoardStore";
import { Composer } from "./Composer";
import { ListColumn } from "./ListColumn";
import { useBoardShortcuts } from "./useBoardShortcuts";
import styles from "./board.module.scss";

export function BoardCanvas() {
  const { lists, cardsByList, addList, undo, redo, setPaletteOpen, fullscreen, setFullscreen } =
    useBoard();
  const [addingList, setAddingList] = useState(false);
  // Danh sách đang được phím tắt N yêu cầu mở ô nhập
  const [quickAddListId, setQuickAddListId] = useState<string | null>(null);

  const firstListId = lists[0]?.id ?? null;
  useBoardShortcuts({
    onNewCard: useCallback(() => setQuickAddListId(firstListId), [firstListId]),
    onUndo: undo,
    onRedo: redo,
    onPalette: useCallback(() => setPaletteOpen(true), [setPaletteOpen]),
    onFullscreen: useCallback(
      () => setFullscreen(!fullscreen),
      [fullscreen, setFullscreen],
    ),
  });

  return (
    <div className={`${styles.canvasScroll} flex-1 min-h-0 overflow-x-auto overflow-y-hidden pb-2`}>
      <div className="flex items-start gap-3 h-full">
        <SortableContext items={lists.map((l) => l.id)} strategy={horizontalListSortingStrategy}>
          {lists.map((list) => (
            <ListColumn
              key={list.id}
              list={list}
              cards={cardsByList.get(list.id) ?? []}
              autoAdd={quickAddListId === list.id}
              onAutoAddDone={() => setQuickAddListId(null)}
            />
          ))}
        </SortableContext>

        {/* Ô thêm danh sách — luôn đứng cuối hàng */}
        <div className="w-[min(288px,82vw)] shrink-0 self-start">
          {addingList ? (
            <div className={`${styles.glassPanel} p-2`}>
              <Composer
                placeholder="Nhập tên danh sách..."
                submitLabel="Thêm danh sách"
                onSubmit={(title) => addList(title)}
                onCancel={() => setAddingList(false)}
              />
            </div>
          ) : (
            <button
              onClick={() => setAddingList(true)}
              className={`${styles.glassBtn} w-full flex items-center gap-2 h-11 px-3
                text-[13.5px] font-medium text-left`}
            >
              <Plus size={16} /> Thêm danh sách
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
