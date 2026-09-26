"use client";

import { CSSProperties, memo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Dropdown, Tooltip } from "antd";
import {
  AlignLeft,
  Ban,
  Check,
  CheckSquare,
  Circle,
  CircleDot,
  Clock,
  Flag,
  Hourglass,
  LoaderCircle,
  MoreHorizontal,
  MoveRight,
  Paperclip,
  RotateCcw,
  StickyNote,
  Timer,
  Trash2,
} from "lucide-react";
import { CardSummary } from "@/models/board";
import {
  PRIORITY_META,
  STATUS_META,
  TaskPriority,
  TaskStatus,
} from "@/models/task";

/** Trạng thái -> sắc thái của <Badge> trên nền kính */
const STATUS_TONE: Record<
  TaskStatus,
  "muted" | "primary" | "success" | "danger"
> = {
  [TaskStatus.TODO]: "muted",
  [TaskStatus.IN_PROGRESS]: "primary",
  [TaskStatus.DONE]: "success",
  [TaskStatus.CANCELLED]: "danger",
};
import { useBoard } from "./BoardStore";
import { SNOOZE_OPTIONS } from "./snooze";
import { Badge, G, LabelChip, SourceIcon, fmtShort } from "./ui";
import styles from "./board.module.scss";

type Props = {
  card: CardSummary;
  /** Thẻ đang bay theo con trỏ trong DragOverlay — không gắn sortable, không click */
  overlay?: boolean;
};

/**
 * Số nhãn hiện kèm chữ trên một thẻ. Quá ba cái thì hàng nhãn bắt đầu xuống
 * dòng và đẩy tiêu đề xuống — mà tiêu đề mới là thứ cần đọc trước.
 */
const MAX_VISIBLE_LABELS = 3;

const fmtDuration = (min: number) =>
  min < 60 ? `${min}p` : min % 60 === 0 ? `${min / 60}h` : `${Math.floor(min / 60)}h${min % 60}`;

function CardTileBase({ card, overlay = false }: Props) {
  const router = useRouter();
  const {
    labelById,
    board,
    lists,
    snoozeCard,
    toggleComplete,
    moveCardToList,
    updateCard,
    deleteCard,
  } = useBoard();
  /** Đang chờ máy chủ trả lời cho đúng thẻ này — để nút không im lìm */
  const [completing, setCompleting] = useState(false);

  const { setNodeRef, attributes, listeners, transform, transition, isDragging } =
    useSortable({
      id: card.id,
      data: { type: "card", listId: card.listId },
      disabled: overlay,
    });

  const done = card.completedAt !== null;
  const overdue = card.deadlineStatus === "LATE" && !done;
  // Số liệu dẫn xuất do backend tính sẵn — canvas không tải quan hệ con
  const checkDone = card.checklistDone;
  const checkTotal = card.checklistTotal;
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

  /*
   * Không còn cờ `hasMeta`: trạng thái luôn có mặt nên hàng phụ luôn được vẽ.
   * Giữ lại biến chỉ để biết thẻ có thông tin gì ngoài trạng thái hay không —
   * dùng cho khoảng cách dòng.
   */
  const hasOtherMeta =
    !!card.deadline ||
    card.hasDescription ||
    card.estimateMinutes !== null ||
    card.attachmentCount > 0 ||
    card.noteCount > 0 ||
    checkTotal > 0 ||
    card.source !== "MANUAL";

  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      style={style}
      {...(overlay ? {} : attributes)}
      {...(overlay ? {} : listeners)}
      onClick={
        overlay || !board
          ? undefined
          : () => router.push(`/boards/${board.id}/cards/${card.id}`)
      }
      className={`${styles.card} ${overlay ? styles.cardOverlay : ""} ${done ? styles.cardDone : ""} group/card relative overflow-hidden cursor-pointer`}
      role="button"
      tabIndex={overlay ? -1 : 0}
      aria-label={`${card.code} — ${card.title}`}
    >
      {card.cover && <div style={{ background: card.cover, height: 32 }} />}

      {/*
        Hoàn thành ngay trên thẻ.

        Trước đây chỉ mở chi tiết thẻ mới đánh dấu xong được — thao tác hay
        dùng nhất của cả màn lại là thao tác tốn nhiều cú bấm nhất. Nút hiện
        khi rê vào thẻ (và khi có focus bàn phím) nên vẫn không làm rối lúc đọc
        lướt.
      */}
      {!overlay && (
        <button
          aria-label={done ? "Mở lại việc" : "Đánh dấu hoàn thành"}
          title={done ? "Mở lại việc" : "Đánh dấu hoàn thành"}
          disabled={completing}
          onClick={(e) => {
            // Không để click nổi lên thẻ (thẻ đang mở trang chi tiết)
            e.stopPropagation();
            setCompleting(true);
            void toggleComplete(card.id).finally(() => setCompleting(false));
          }}
          // dnd-kit lắng nghe pointerdown trên thẻ: không chặn thì bấm nút
          // thành ra kéo thẻ
          onPointerDown={(e) => e.stopPropagation()}
          className={`absolute top-1.5 z-10 grid place-items-center size-6 rounded-md
            cursor-pointer transition-opacity focus-visible:opacity-100
            ${done ? "opacity-100" : "opacity-0 group-hover/card:opacity-100"}`}
          style={{
            right: done ? 34 : 62, // chừa chỗ cho menu ⋯ (và nút dời hạn khi chưa xong)
            background: done ? "rgba(42,157,143,.16)" : "rgba(255,255,255,.22)",
            border: `1px solid ${done ? "rgba(42,157,143,.4)" : "rgba(255,255,255,.3)"}`,
            color: done ? "#2a9d8f" : G.text,
          }}
        >
          {completing ? (
            <LoaderCircle size={13} className="animate-spin" />
          ) : done ? (
            <RotateCcw size={12.5} />
          ) : (
            <Check size={14} />
          )}
        </button>
      )}

      {/*
        Menu thao tác — lối đi thay cho kéo thả.

        Chuyển cột trước đây BẮT BUỘC phải kéo: không dùng được bằng bàn phím,
        rất khó trên màn hình nhỏ, và càng khó khi cột đích nằm ngoài vùng nhìn
        thấy. Menu này làm cùng việc đó bằng hai cú bấm.
      */}
      {!overlay && (
        <div
          className="contents"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {/* Menu của antd render qua portal nhưng sự kiện React vẫn nổi theo cây
              component lên thẻ: không chặn thì bấm "Xoá việc" xong lại mở trang
              chi tiết, và pointerdown trong menu thành ra kéo thẻ. */}
          <Dropdown
            trigger={["click"]}
            placement="bottomRight"
            menu={{
              items: [
                {
                  key: "move",
                  icon: <MoveRight size={14} />,
                  label: "Chuyển tới",
                  children: [
                    ...lists
                      .filter((l) => l.id !== card.listId)
                      .map((l) => ({
                        key: `move-${l.id}`,
                        label: l.title,
                        onClick: () => moveCardToList(card.id, l.id),
                      })),
                    ...(card.listId !== null
                      ? [
                          {
                            key: "move-inbox",
                            label: "Hộp thư đến",
                            onClick: () => moveCardToList(card.id, null),
                          },
                        ]
                      : []),
                  ],
                },
                {
                  key: "priority",
                  icon: <Flag size={14} />,
                  label: "Mức ưu tiên",
                  children: Object.values(TaskPriority).map((p) => ({
                    key: `priority-${p}`,
                    label: (
                      <span className="flex items-center gap-2">
                        <span
                          className="inline-block size-2 rounded-full"
                          style={{ background: PRIORITY_META[p].color }}
                        />
                        {PRIORITY_META[p].label}
                      </span>
                    ),
                    disabled: p === card.priority,
                    onClick: () => updateCard(card.id, { priority: p }),
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
              aria-label="Thao tác khác"
              title="Thao tác khác"
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
              <MoreHorizontal size={13} />
            </button>
          </Dropdown>
        </div>
      )}

      {/* Hoãn nhanh — chỉ hiện khi rê vào thẻ, để không làm rối lúc đọc lướt */}
      {!overlay && !done && (
        <div
          className="contents"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
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
                  snoozeCard(
                    card.id,
                    target ? target.toISOString() : null,
                    opt.label.toLowerCase(),
                  );
                },
              })),
            }}
          >
            <button
              aria-label="Dời hạn"
              title="Dời hạn"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              className="absolute top-1.5 right-[34px] z-10 grid place-items-center size-6 rounded-md
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
        </div>
      )}

      <div className="px-2.5 py-2 flex flex-col gap-1.5">
        {/*
          Nhãn: hiện tối đa ba cái có chữ, phần dư gom thành "+N".

          Trước đây vẽ hết — thẻ có sáu nhãn thì riêng hàng nhãn đã cao hơn cả
          tiêu đề, và tiêu đề mới là thứ người ta đọc để nhận ra việc. Ba cái
          đầu vẫn đủ để nhận diện, phần dư vẫn xem được: rê chuột vào "+N" ra
          danh sách đầy đủ, mà bấm vào thẻ thì màn chi tiết hiện trọn.
        */}
        {labels.length > 0 && (
          <div className="flex flex-wrap items-center gap-1">
            {labels.slice(0, MAX_VISIBLE_LABELS).map((l) => (
              <LabelChip key={l.id} label={l} size="sm" onGlass />
            ))}

            {labels.length > MAX_VISIBLE_LABELS && (
              <Tooltip
                title={
                  <span className="flex flex-col gap-0.5">
                    {labels.slice(MAX_VISIBLE_LABELS).map((l) => (
                      <span key={l.id} className="flex items-center gap-1.5">
                        <span
                          className="inline-block size-2 rounded-full shrink-0"
                          style={{ background: l.color }}
                        />
                        {l.name}
                      </span>
                    ))}
                  </span>
                }
              >
                <span
                  className="inline-flex items-center h-[18px] px-1.5 rounded-md text-[10.5px] font-semibold cursor-default"
                  style={{
                    background: "rgba(255,255,255,.22)",
                    border: `1px solid ${G.line}`,
                    color: G.text,
                  }}
                >
                  +{labels.length - MAX_VISIBLE_LABELS}
                </span>
              </Tooltip>
            )}
          </div>
        )}

        {/* Tiêu đề là thứ đậm nhất trên thẻ */}
        {/*
          Chừa chỗ cho các nút nổi ở góc phải: thẻ đã xong luôn hiện 2 nút,
          thẻ chưa xong hiện 3 nút khi rê chuột — không chừa thì tiêu đề dài
          bị nút đè lên.
        */}
        <div
          className={`flex items-start gap-1.5 ${
            done
              ? "pr-[58px]"
              : "pr-5 group-hover/card:pr-[86px] group-focus-within/card:pr-[86px]"
          }`}
        >
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
            className="min-w-0 text-[13.5px] font-medium leading-[1.45] [overflow-wrap:anywhere]"
            style={{
              color: done ? G.textMuted : G.text,
              textDecoration: done ? "line-through" : undefined,
            }}
          >
            {card.title}
          </span>
        </div>

        <div
          className={`flex items-center flex-wrap gap-x-2.5 ${
            hasOtherMeta ? "gap-y-1" : ""
          }`}
        >
            <SourceIcon source={card.source} onGlass />

            {/*
              Trạng thái — LUÔN hiện, kể cả "Chờ xử lý".

              Bản đầu tôi ẩn trạng thái mặc định cho đỡ rối, nhưng như vậy thẻ
              không có huy hiệu lại thành mơ hồ: không rõ là chưa làm hay là
              giao diện chưa kịp tải. Hiện đủ bốn trạng thái, và "Chờ xử lý"
              dùng sắc thái mờ nhất để không tranh chỗ với tiêu đề.
            */}
            <Badge
              onGlass
              tone={STATUS_TONE[card.status]}
              title={`Trạng thái: ${STATUS_META[card.status].label}`}
            >
              {card.status === TaskStatus.CANCELLED ? (
                <Ban size={11.5} />
              ) : card.status === TaskStatus.DONE ? (
                <CheckSquare size={11.5} />
              ) : card.status === TaskStatus.IN_PROGRESS ? (
                <CircleDot size={11.5} />
              ) : (
                <Circle size={11.5} />
              )}
              {STATUS_META[card.status].label}
            </Badge>

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

            {card.hasDescription && (
              <Badge onGlass title="Việc có mô tả">
                <AlignLeft size={11.5} />
              </Badge>
            )}

            {card.attachmentCount > 0 && (
              <Badge onGlass title={`${card.attachmentCount} tệp đính kèm`}>
                <Paperclip size={11.5} />
                {card.attachmentCount}
              </Badge>
            )}

            {card.noteCount > 0 && (
              <Badge onGlass title={`${card.noteCount} ghi chú`}>
                <StickyNote size={11.5} />
                {card.noteCount}
              </Badge>
            )}
        </div>
      </div>
    </div>
  );
}

/** Bảng có thể vài trăm thẻ — memo để kéo 1 thẻ không render lại toàn bộ */
export const CardTile = memo(CardTileBase);
