"use client";

import { useCallback, useMemo, useState } from "react";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { Dropdown } from "antd";
import { Archive, ArchiveRestore, LoaderCircle, Plus } from "lucide-react";
import { PendingAdd, useBoard } from "./BoardStore";
import { Composer } from "./Composer";
import { ListColumn } from "./ListColumn";
import { useBoardShortcuts } from "./useBoardShortcuts";
import { G } from "./ui";
import styles from "./board.module.scss";

const NO_CARDS: never[] = [];
const NO_PENDING: never[] = [];

export function BoardCanvas() {
  const {
    lists,
    archivedLists,
    cardsByList,
    totalByList,
    pendingAdds,
    pendingLists,
    loadingMore,
    filterActive,
    addList,
    restoreList,
    undo,
    redo,
    setPaletteOpen,
    fullscreen,
    setFullscreen,
  } = useBoard();
  const [addingList, setAddingList] = useState(false);
  // Danh sách đang được phím tắt N yêu cầu mở ô nhập
  const [quickAddListId, setQuickAddListId] = useState<string | null>(null);

  // Ổn định tham chiếu: hàm inline sẽ làm memo của mọi cột mất tác dụng
  const onAutoAddDone = useCallback(() => setQuickAddListId(null), []);

  const pendingByList = useMemo(() => {
    const map = new Map<string, PendingAdd[]>();
    pendingAdds.forEach((p) => {
      if (p.listId === null) return;
      map.set(p.listId, [...(map.get(p.listId) ?? []), p]);
    });
    return map;
  }, [pendingAdds]);

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
              cards={cardsByList.get(list.id) ?? NO_CARDS}
              total={totalByList.get(list.id) ?? 0}
              pending={pendingByList.get(list.id) ?? NO_PENDING}
              loadingMore={loadingMore === list.id}
              filterActive={filterActive}
              autoAdd={quickAddListId === list.id}
              onAutoAddDone={onAutoAddDone}
            />
          ))}
        </SortableContext>

        {/* Cột đang tạo — hiện ngay tên vừa gõ trong lúc chờ server */}
        {pendingLists.map((p) => (
          <div
            key={p.key}
            aria-busy="true"
            className={`${styles.column} shrink-0 self-start flex items-center gap-2 px-3 h-11 opacity-60`}
            style={{ color: G.text }}
          >
            <LoaderCircle size={13} className="animate-spin shrink-0" />
            <span className="text-[13.5px] font-semibold truncate">{p.title}</span>
          </div>
        ))}

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

          {/*
            Danh sách đã lưu trữ. Trước đây lưu trữ là mất hút: không có chỗ nào
            xem lại, chỉ Ctrl+Z ngay lúc đó mới cứu được.
          */}
          {archivedLists.length > 0 && (
            <Dropdown
              trigger={["click"]}
              placement="bottomLeft"
              menu={{
                items: archivedLists.map((l) => ({
                  key: l.id,
                  icon: <ArchiveRestore size={14} />,
                  label: (
                    <span className="flex items-center justify-between gap-6">
                      <span className="truncate max-w-[180px]">{l.title}</span>
                      <span className="text-[11.5px]" style={{ color: "#808080" }}>
                        Khôi phục
                      </span>
                    </span>
                  ),
                  onClick: () => restoreList(l.id),
                })),
              }}
            >
              <button
                title="Khôi phục một danh sách về bảng. Các việc cũ của nó đang nằm ở Hộp thư đến."
                className={`${styles.glassBtn} w-full flex items-center gap-2 h-9 px-3 mt-2
                  text-[12.5px] font-medium text-left opacity-80 hover:opacity-100`}
              >
                <Archive size={14} /> Đã lưu trữ ({archivedLists.length})
              </button>
            </Dropdown>
          )}
        </div>
      </div>
    </div>
  );
}
