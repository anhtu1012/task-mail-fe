"use client";

import { memo, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Dropdown } from "antd";
import {
  ChevronDown,
  GripVertical,
  LoaderCircle,
  MoreHorizontal,
  Plus,
} from "lucide-react";
import { BoardList, CardSummary } from "@/models/board";
import { useBoard } from "./BoardStore";
import { CardTile } from "./CardTile";
import { PendingCardTile } from "./PendingCardTile";
import { Composer } from "./Composer";
import { G } from "./ui";
import styles from "./board.module.scss";

type Props = {
  list: BoardList;
  cards: CardSummary[];
  /** Phím tắt N yêu cầu mở ô thêm việc ở danh sách này */
  autoAdd?: boolean;
  onAutoAddDone?: () => void;
};

function ListColumnBase({ list, cards, autoAdd = false, onAutoAddDone }: Props) {
  const {
    addCard,
    renameList,
    archiveList,
    totalByList,
    filterActive,
    loadMoreCards,
    loadingMore,
    pendingAdds,
  } = useBoard();
  /**
   * Ô thêm việc mở ở đâu: cuối cột (mặc định) hay đầu cột.
   *
   * Có nút "+" ở đầu cột vì việc gấp thường phải nằm trên cùng. Trước đây chỉ
   * thêm được ở cuối rồi phải kéo thẻ ngược lên — thêm một thao tác cho đúng
   * cái trường hợp đang vội nhất.
   */
  const [adding, setAdding] = useState<null | "top" | "bottom">(null);
  const [renaming, setRenaming] = useState(false);
  const [draftTitle, setDraftTitle] = useState(list.title);

  // Cả cột là 1 phần tử sortable (kéo đổi thứ tự danh sách)
  const {
    setNodeRef: setListRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: list.id, data: { type: "list" } });

  // Vùng thả riêng để thả được vào danh sách rỗng (SortableContext rỗng không nhận)
  const { setNodeRef: setBodyRef, isOver } = useDroppable({
    id: `list-drop-${list.id}`,
    data: { type: "list-body", listId: list.id },
  });

  // Dẫn xuất chứ không setState trong effect — tránh render lồng
  const composerAt = adding ?? (autoAdd ? "bottom" : null);

  const pending = pendingAdds.filter((p) => p.listId === list.id);
  const total = totalByList.get(list.id) ?? cards.length;
  const overWip = list.wipLimit !== null && cards.length > list.wipLimit;

  return (
    <div
      ref={setListRef}
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
      className={`${styles.column} ${isOver ? styles.columnOver : ""} group/list shrink-0 self-start flex flex-col max-h-full`}
      {...attributes}
    >
      {/* ===== Header ===== */}
      <div
        className="flex items-center gap-1 px-2.5 h-11 shrink-0"
        style={{ borderBottom: `1px solid ${G.line}` }}
      >
        <button
          {...listeners}
          aria-label="Kéo để đổi thứ tự danh sách"
          className="grid place-items-center size-5 shrink-0 rounded border-0 bg-transparent
            cursor-grab active:cursor-grabbing opacity-0 group-hover/list:opacity-100 focus-visible:opacity-100
            transition-opacity"
          style={{ color: G.textFaint }}
        >
          <GripVertical size={13} />
        </button>

        {renaming ? (
          <input
            autoFocus
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            onBlur={() => {
              const next = draftTitle.trim();
              if (next && next !== list.title) {
                renameList(list.id, next);
              } else {
                setDraftTitle(list.title);
              }
              setRenaming(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
              if (e.key === "Escape") {
                setDraftTitle(list.title);
                setRenaming(false);
              }
            }}
            className="flex-1 min-w-0 h-7 px-2 rounded-md text-[13.5px] font-semibold outline-none"
            style={{
              color: G.text,
              background: "rgba(255,255,255,.2)",
              border: "1px solid rgba(190,224,244,.85)",
              boxShadow: "0 0 0 3px rgba(163,209,235,.25)",
            }}
          />
        ) : (
          <button
            onClick={() => setRenaming(true)}
            className="flex-1 min-w-0 text-left h-7 px-1 rounded-md text-[13.5px] font-semibold
              bg-transparent border-0 cursor-pointer hover:bg-white/15 truncate"
            style={{ color: G.text }}
          >
            {list.title}
          </button>
        )}

        <span
          className="text-[11.5px] font-semibold tabular-nums px-1.5 h-5 grid place-items-center rounded-md shrink-0"
          style={
            overWip
              ? { color: G.warning, background: G.warningFill }
              : { color: G.textSoft, background: G.fill }
          }
          title={
            overWip
              ? `Vượt giới hạn ${list.wipLimit} thẻ đang chạy`
              : list.wipLimit !== null
                ? `Giới hạn ${list.wipLimit} thẻ`
                : undefined
          }
        >
          {/* Hiện "đã tải / tổng thật" bất cứ khi nào hai số khác nhau — vì lọc,
              hoặc vì /full chỉ trả 20 thẻ đầu mỗi cột. Chỉ hiện một số thì
              người dùng tưởng cột chỉ có ngần đó việc. */}
          {total !== cards.length ? `${cards.length}/${total}` : cards.length}
        </span>

        <button
          type="button"
          aria-label={`Thêm việc vào đầu ${list.title}`}
          title="Thêm việc lên đầu cột"
          onClick={() => setAdding("top")}
          className="grid place-items-center size-6 shrink-0 rounded-md border-0 bg-transparent cursor-pointer
            opacity-0 group-hover/list:opacity-100 focus-visible:opacity-100 transition-opacity hover:bg-white/15"
          style={{ color: G.textSoft }}
        >
          <Plus size={14} />
        </button>

        <Dropdown
          trigger={["click"]}
          menu={{
            items: [
              { key: "rename", label: "Đổi tên danh sách", onClick: () => setRenaming(true) },
              { key: "add", label: "Thêm việc", onClick: () => setAdding("bottom") },
              { type: "divider" as const },
              {
                key: "archive",
                danger: true,
                label: "Lưu trữ danh sách",
                onClick: () => archiveList(list.id),
              },
            ],
          }}
        >
          <button
            aria-label="Thao tác với danh sách"
            className="grid place-items-center size-7 shrink-0 rounded-md border-0 bg-transparent
              hover:bg-white/15 cursor-pointer"
            style={{ color: G.textSoft }}
          >
            <MoreHorizontal size={15} />
          </button>
        </Dropdown>
      </div>

      {/* ===== Thẻ ===== */}
      <div
        ref={setBodyRef}
        /*
          Chiều cao co theo cột (cột đã có `max-h-full`), không đóng đinh
          `calc(100vh - 260px)` như trước: con số đó đúng với đúng một bố cục,
          còn ở chế độ toàn màn hình hoặc màn hình thấp thì cột bị cắt cụt hoặc
          tràn ra ngoài khung.
        */
        className={`${styles.scrollArea} flex-1 min-h-0 flex flex-col gap-2 p-2 overflow-y-auto`}
      >
        {composerAt === "top" && (
          <Composer
            parse
            placeholder="Việc cần làm... (vd: Gọi khách hàng mai 9h !gấp)"
            submitLabel="Thêm lên đầu"
            onSubmit={(text) => addCard(list.id, text, true)}
            onCancel={() => setAdding(null)}
          />
        )}

        {/* Thẻ đang tạo, thêm ở đầu cột */}
        {pending
          .filter((p) => p.atTop)
          .map((p) => (
            <PendingCardTile key={p.key} title={p.title} />
          ))}

        <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <CardTile key={card.id} card={card} />
          ))}
        </SortableContext>

        {pending
          .filter((p) => !p.atTop)
          .map((p) => (
            <PendingCardTile key={p.key} title={p.title} />
          ))}

        {/*
          `/full` chỉ trả 20 thẻ đầu mỗi cột. Không có nút này thì thẻ thứ 21
          trở đi không có đường nào chạm tới — đầu cột vẫn ghi "20/47" nhưng 27
          thẻ kia không hiện ở đâu cả.

          Ẩn khi đang lọc: lúc đó `cards` là tập đã lọc còn `total` là tổng thô,
          nên so hai số sẽ luôn lệch và nút hiện vĩnh viễn.
        */}
        {!filterActive && cards.length < total && (
          <button
            type="button"
            onClick={() => loadMoreCards(list.id)}
            disabled={loadingMore === list.id}
            className="flex items-center justify-center gap-1.5 h-8 rounded-lg cursor-pointer
              text-[12.5px] font-medium disabled:opacity-60"
            style={{
              border: `1px dashed ${G.line}`,
              background: "transparent",
              color: G.text,
            }}
          >
            {loadingMore === list.id ? (
              <LoaderCircle size={13} className="animate-spin" />
            ) : (
              <ChevronDown size={13} />
            )}
            Tải thêm {Math.min(20, total - cards.length)} việc
          </button>
        )}

        {cards.length === 0 && pending.length === 0 && (
          <div
            className="grid place-items-center h-[68px] rounded-lg text-[12px] transition-colors"
            style={
              isOver
                ? {
                    border: "1px dashed rgba(190,224,244,.9)",
                    background: "rgba(255,255,255,.12)",
                    color: G.text,
                  }
                : { border: `1px dashed ${G.line}`, color: G.textMuted }
            }
          >
            {filterActive && total > 0 ? (
              "Không khớp bộ lọc"
            ) : (
              /* Bấm được, không chỉ là chữ: cột rỗng là lúc người dùng cần
                 thêm việc nhất, bắt họ đi tìm nút ở cuối cột là thừa */
              <button
                type="button"
                onClick={() => setAdding("bottom")}
                className="w-full h-full rounded-lg border-0 bg-transparent cursor-pointer text-[12px]"
                style={{ color: "inherit" }}
              >
                Kéo việc vào đây, hoặc bấm để thêm
              </button>
            )}
          </div>
        )}
      </div>

      {/* ===== Footer ===== */}
      <div className="px-2 pb-2 shrink-0">
        {composerAt === "bottom" ? (
          <Composer
            parse
            placeholder="Việc cần làm... (vd: Gọi khách hàng mai 9h !gấp)"
            submitLabel="Thêm việc"
            onSubmit={(text) => addCard(list.id, text)}
            onCancel={() => {
              setAdding(null);
              onAutoAddDone?.();
            }}
          />
        ) : (
          <button
            onClick={() => setAdding("bottom")}
            className="w-full flex items-center gap-2 h-8 px-2 rounded-lg border-0 bg-transparent
              text-[13px] cursor-pointer text-left hover:bg-white/15 transition-colors"
            style={{ color: G.textSoft }}
          >
            <Plus size={15} /> Thêm việc
          </button>
        )}
      </div>
    </div>
  );
}

export const ListColumn = memo(ListColumnBase);
