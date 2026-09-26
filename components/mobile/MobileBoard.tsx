"use client";

/**
 * Bảng công việc trên mobile — tab "Công việc".
 *
 * Bảng desktop là các cột xếp ngang và kéo thả; trên điện thoại cột chỉ còn
 * rộng một ngón tay, cuộn ngang lẫn vào cuộn dọc, kéo thả thì dễ bấm nhầm.
 * Ở đây mỗi lúc xem MỘT cột, đổi cột bằng dải chip ở trên; chuyển việc sang cột
 * khác bằng menu ⋯ của từng dòng thay cho kéo.
 */
import { useState } from "react";
import { Dropdown } from "antd";
import {
  ChevronDown,
  Inbox,
  LoaderCircle,
  MoreVertical,
  MoveRight,
  Plus,
  Trash2,
} from "lucide-react";
import { useBoard } from "@/components/board/BoardStore";
import { Composer } from "@/components/board/Composer";
import { C } from "@/components/board/ui";
import { cardHref } from "./links";
import { MobileCardRow } from "./MobileCardRow";

/** null = Hộp thư đến */
type ColumnKey = string | null;

export function MobileBoard() {
  const {
    board,
    lists,
    cardsByList,
    inboxCards,
    totalByList,
    inboxTotal,
    toggleComplete,
    moveCardToList,
    deleteCard,
    addCard,
    loadMoreCards,
    loadingMore,
    filterActive,
  } = useBoard();

  // Mặc định mở Hộp thư đến nếu có việc chờ phân loại, không thì cột đầu tiên.
  // `undefined` = chưa chọn; cột đã chọn bị lưu trữ/xoá thì cũng lùi về mặc định.
  const [picked, setPicked] = useState<ColumnKey | undefined>(undefined);
  const column: ColumnKey =
    picked !== undefined && (picked === null || lists.some((l) => l.id === picked))
      ? picked
      : inboxCards.length > 0
        ? null
        : (lists[0]?.id ?? null);
  const [adding, setAdding] = useState(false);

  const cards = column === null ? inboxCards : (cardsByList.get(column) ?? []);
  const total =
    column === null ? inboxTotal : (totalByList.get(column) ?? cards.length);
  const loadingKey = column ?? "inbox";

  const columns: { key: ColumnKey; title: string; count: number }[] = [
    { key: null, title: "Hộp thư đến", count: inboxTotal },
    ...lists.map((l) => ({
      key: l.id,
      title: l.title,
      count: totalByList.get(l.id) ?? 0,
    })),
  ];

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-3">
      {/* Dải chọn cột — cuộn ngang, chip đang chọn nổi bật */}
      <div className="-mx-1 px-1 flex gap-2 overflow-x-auto pb-1 shrink-0 [scrollbar-width:none]">
        {columns.map((col) => {
          const active = col.key === column;
          return (
            <button
              key={col.key ?? "inbox"}
              type="button"
              onClick={() => {
                setPicked(col.key);
                setAdding(false);
              }}
              className="shrink-0 inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full border-0 cursor-pointer
                text-[13.5px] font-medium whitespace-nowrap"
              style={{
                background: active ? "#ffffff" : "rgba(255,255,255,.18)",
                color: active ? C.primary : "#ffffff",
                boxShadow: active ? "0 6px 18px -8px rgba(0,0,0,.45)" : undefined,
              }}
            >
              {col.key === null && <Inbox size={14} />}
              <span className="max-w-[160px] truncate">{col.title}</span>
              <span className="tabular-nums opacity-70">{col.count}</span>
            </button>
          );
        })}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-2 pb-4">
        {cards.map((card) => (
          <MobileCardRow
            key={card.id}
            card={card}
            href={board ? cardHref(board.id, card.id) : "#"}
            onToggleComplete={(c) => toggleComplete(c.id)}
            actions={
              <Dropdown
                trigger={["click"]}
                placement="bottomRight"
                menu={{
                  items: [
                    {
                      key: "move",
                      icon: <MoveRight size={14} />,
                      label: "Chuyển tới",
                      children: columns
                        .filter((col) => col.key !== card.listId)
                        .map((col) => ({
                          key: `move-${col.key ?? "inbox"}`,
                          label: col.title,
                          onClick: () => moveCardToList(card.id, col.key),
                        })),
                    },
                    { type: "divider" as const },
                    {
                      key: "delete",
                      danger: true,
                      icon: <Trash2 size={14} />,
                      label: "Xoá việc",
                      onClick: () => deleteCard(card.id),
                    },
                  ],
                }}
              >
                <button
                  type="button"
                  aria-label="Thao tác"
                  className="grid place-items-center size-8 -mr-1 shrink-0 rounded-lg border-0 bg-transparent cursor-pointer"
                  style={{ color: C.neutral700 }}
                >
                  <MoreVertical size={17} />
                </button>
              </Dropdown>
            }
          />
        ))}

        {cards.length === 0 && (
          <div
            className="text-center py-10 text-[14px]"
            style={{ color: "rgba(255,255,255,.8)" }}
          >
            {filterActive ? "Không có việc nào khớp bộ lọc" : "Cột này chưa có việc nào"}
          </div>
        )}

        {!filterActive && cards.length < total && (
          <button
            type="button"
            onClick={() => void loadMoreCards(column)}
            disabled={loadingMore === loadingKey}
            className="inline-flex items-center justify-center gap-1.5 h-10 rounded-xl border-0 cursor-pointer
              text-[13.5px] font-medium disabled:opacity-60"
            style={{ background: "rgba(255,255,255,.2)", color: "#fff" }}
          >
            {loadingMore === loadingKey ? (
              <LoaderCircle size={14} className="animate-spin" />
            ) : (
              <ChevronDown size={14} />
            )}
            Tải thêm {Math.min(20, total - cards.length)} việc
          </button>
        )}

        {adding ? (
          <div className="rounded-2xl bg-white p-2">
            <Composer
              parse
              placeholder="Việc cần làm... (vd: Gọi khách mai 9h !gấp)"
              submitLabel="Thêm"
              onSubmit={(text) => addCard(column, text)}
              onCancel={() => setAdding(false)}
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-2 h-11 px-3 rounded-xl border-0 cursor-pointer text-[14px] font-medium"
            style={{ background: "rgba(255,255,255,.14)", color: "#fff" }}
          >
            <Plus size={16} /> Thêm việc vào cột này
          </button>
        )}
      </div>
    </div>
  );
}
