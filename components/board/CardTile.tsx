"use client";

import { CSSProperties, memo } from "react";
import { useRouter } from "next/navigation";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Dropdown } from "antd";
import {
  AlignLeft,
  CheckSquare,
  Clock,
  Hourglass,
  Paperclip,
  Repeat,
  StickyNote,
  Timer,
} from "lucide-react";
import { BoardCard, checklistProgress, repeatText } from "@/models/board";
import { PRIORITY_META, TaskPriority } from "@/models/task";
import { useBoard } from "./BoardStore";
import { SNOOZE_OPTIONS } from "./snooze";
import { isRichTextEmpty } from "@/utils/client/richText";
import { Badge, G, LabelChip, SourceIcon, fmtShort } from "./ui";
import styles from "./board.module.scss";

type Props = {
  card: BoardCard;
  /** Thẻ đang bay theo con trỏ trong DragOverlay — không gắn sortable, không click */
  overlay?: boolean;
};

const fmtDuration = (min: number) =>
  min < 60 ? `${min}p` : min % 60 === 0 ? `${min / 60}h` : `${Math.floor(min / 60)}h${min % 60}`;

function CardTileBase({ card, overlay = false }: Props) {
  const router = useRouter();
  const { labelById, board, dispatch } = useBoard();

  const { setNodeRef, attributes, listeners, transform, transition, isDragging } =
    useSortable({
      id: card.id,
      data: { type: "card", listId: card.listId },
      disabled: overlay,
    });

  const done = card.completedAt !== null;
  const overdue = card.deadlineStatus === "LATE" && !done;
  const { done: checkDone, total: checkTotal } = checklistProgress(card);
  // Chỉ Cao/Khẩn cấp mới có chấm ưu tiên — thẻ nào cũng có thì chấm mất tác dụng
  const showPriority =
    card.priority === TaskPriority.URGENT || card.priority === TaskPriority.HIGH;

  const style: CSSProperties = overlay
    ? { cursor: "grabbing" }
    : {
        transform: CSS.Translate.toString(transform),
        transition,
        // Thẻ gốc ẩn đi khi đang kéo — bản nhìn thấy là DragOverlay
        opacity: isDragging ? 0 : 1,
      };

  const labels = card.labelIds
    .map((id) => labelById.get(id))
    .filter((l): l is NonNullable<typeof l> => !!l);

  // Quill lưu ô trống thành "<p><br></p>" nên phải lọc, nếu không thẻ nào cũng
  // hiện icon "có mô tả"
  const hasDescription = !isRichTextEmpty(card.description);

  const hasMeta =
    !!card.deadline ||
    hasDescription ||
    !!card.repeat ||
    card.estimateMinutes !== null ||
    card.attachments.length > 0 ||
    card.notes.length > 0 ||
    checkTotal > 0 ||
    card.source !== "MANUAL";

  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      style={style}
      {...(overlay ? {} : attributes)}
      {...(overlay ? {} : listeners)}
      onClick={overlay ? undefined : () => router.push(`/boards/${board.id}/cards/${card.id}`)}
      className={`${styles.card} ${overlay ? styles.cardOverlay : ""} ${done ? styles.cardDone : ""} group/card relative overflow-hidden cursor-pointer`}
      role="button"
      tabIndex={overlay ? -1 : 0}
      aria-label={`${card.code} — ${card.title}`}
    >
      {card.cover && <div style={{ background: card.cover, height: 32 }} />}

      {/* Hoãn nhanh — chỉ hiện khi rê vào thẻ, để không làm rối lúc đọc lướt */}
      {!overlay && !done && (
        <Dropdown
          trigger={["click"]}
          placement="bottomRight"
          menu={{
            items: SNOOZE_OPTIONS.map((opt) => ({
              key: opt.key,
              danger: opt.key === "clear",
              label: (
                <span className="flex items-center justify-between gap-6">
                  {opt.label}
                  {opt.hint && (
                    <span className="text-[11.5px]" style={{ color: "#808080" }}>
                      {opt.hint(new Date())}
                    </span>
                  )}
                </span>
              ),
              onClick: () => {
                const target = opt.resolve(new Date());
                dispatch({
                  type: "SNOOZE_CARD",
                  cardId: card.id,
                  deadline: target ? target.toISOString() : null,
                  label: opt.label.toLowerCase(),
                });
              },
            })),
          }}
        >
          <button
            aria-label="Dời hạn"
            title="Dời hạn"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="absolute top-1.5 right-1.5 z-10 grid place-items-center size-6 rounded-md
              border-0 cursor-pointer opacity-0 group-hover/card:opacity-100 focus-visible:opacity-100
              transition-opacity"
            style={{
              background: "rgba(255,255,255,.22)",
              border: "1px solid rgba(255,255,255,.3)",
              color: G.text,
            }}
          >
            <Hourglass size={13} />
          </button>
        </Dropdown>
      )}

      <div className="px-2.5 py-2 flex flex-col gap-1.5">
        {labels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {labels.map((l) => (
              <LabelChip key={l.id} label={l} size="sm" onGlass />
            ))}
          </div>
        )}

        {/* Tiêu đề là thứ đậm nhất trên thẻ */}
        <div className="flex items-start gap-1.5 pr-5">
          {showPriority && (
            <span
              title={`Ưu tiên: ${PRIORITY_META[card.priority].label}`}
              className="mt-[5px] rounded-full shrink-0"
              style={{
                width: 4,
                height: 4,
                background: PRIORITY_META[card.priority].color,
                boxShadow: `0 0 0 2px ${PRIORITY_META[card.priority].color}33`,
              }}
            />
          )}
          <span
            className="text-[13.5px] font-medium leading-[1.45]"
            style={{
              color: done ? G.textMuted : G.text,
              textDecoration: done ? "line-through" : undefined,
            }}
          >
            {card.title}
          </span>
        </div>

        {hasMeta && (
          <div className="flex items-center flex-wrap gap-x-2.5 gap-y-1">
            <SourceIcon source={card.source} onGlass />

            {card.deadline && (
              <Badge
                onGlass
                tone={overdue ? "danger" : done ? "success" : "muted"}
                title={overdue ? "Đã quá hạn" : "Hạn chót"}
              >
                <Clock size={11.5} />
                {fmtShort(card.deadline)}
              </Badge>
            )}

            {card.estimateMinutes !== null && (
              <Badge onGlass title="Thời lượng dự kiến">
                <Timer size={11.5} />
                {fmtDuration(card.estimateMinutes)}
              </Badge>
            )}

            {card.repeat && (
              <Badge onGlass tone="primary" title={repeatText(card.repeat)}>
                <Repeat size={11.5} />
              </Badge>
            )}

            {checkTotal > 0 && (
              <Badge
                onGlass
                tone={checkDone === checkTotal ? "success" : "muted"}
                title="Tiến độ việc cần làm"
              >
                <CheckSquare size={11.5} />
                {checkDone}/{checkTotal}
              </Badge>
            )}

            {hasDescription && (
              <Badge onGlass title="Việc có mô tả">
                <AlignLeft size={11.5} />
              </Badge>
            )}

            {card.attachments.length > 0 && (
              <Badge onGlass title={`${card.attachments.length} tệp đính kèm`}>
                <Paperclip size={11.5} />
                {card.attachments.length}
              </Badge>
            )}

            {card.notes.length > 0 && (
              <Badge onGlass title={`${card.notes.length} ghi chú`}>
                <StickyNote size={11.5} />
                {card.notes.length}
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** Bảng có thể vài trăm thẻ — memo để kéo 1 thẻ không render lại toàn bộ */
export const CardTile = memo(CardTileBase);
