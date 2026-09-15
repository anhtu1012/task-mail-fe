"use client";

/**
 * Chi tiết một việc, hiện trong hộp thoại lớn đè lên bảng.
 *
 * Dữ liệu tải riêng qua `GET /tasks/:id/detail` (xem useCardDetail) chứ không
 * lấy từ snapshot của bảng — snapshot cố tình không mang mô tả / checklist /
 * ghi chú để không phình response.
 *
 * Cột phải là GHI CHÚ CỦA TÔI, không phải bình luận của người khác: đây là công
 * cụ cá nhân, thứ có giá trị là những gì mình tự nhắc mình.
 */
import { useState } from "react";
import { Dropdown, Progress, Spin } from "antd";
import {
  AlignLeft,
  ArrowLeft,
  Calendar,
  CheckSquare,
  ChevronDown,
  Clock,
  FileText,
  Hourglass,
  Image as ImageIcon,
  Link2,
  Mail,
  MoreHorizontal,
  Paperclip,
  Pencil,
  Plus,
  Repeat,
  StickyNote,
  Tag as TagIcon,
  Timer,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { COVER_PRESETS, CardDetail, Checklist, repeatText } from "@/models/board";
import { PRIORITY_META, TaskPriority } from "@/models/task";
import { isRichTextEmpty } from "@/utils/client/richText";
import { useBoard } from "./BoardStore";
import { useCardDetail } from "./useCardDetail";
import { SNOOZE_OPTIONS } from "./snooze";
import { RichTextEditor } from "./RichTextEditor";
import { C, LabelChip, fmtBytes, fmtDateTime, fmtShort } from "./ui";
import styles from "./board.module.scss";

const fmtDuration = (min: number) =>
  min < 60
    ? `${min} phút`
    : min % 60 === 0
      ? `${min / 60} giờ`
      : `${Math.floor(min / 60)}h${min % 60}`;

export function CardDetailView({
  cardId,
  onClose,
}: {
  cardId: string;
  onClose: () => void;
}) {
  const { lists, labelById, snoozeCard, toggleComplete, deleteCard } = useBoard();
  const detail = useCardDetail(cardId);
  const card = detail.card;

  if (detail.isLoading) {
    return (
      <div className="h-full grid place-items-center bg-white">
        <Spin />
      </div>
    );
  }

  if (!card) {
    return (
      <div className="h-full grid place-items-center bg-white">
        <div className="text-center">
          <div className="font-semibold mb-1" style={{ color: C.foreground }}>
            Không tải được việc này
          </div>
          <div className="text-[13px] mb-3" style={{ color: C.mutedForeground }}>
            Có thể nó đã bị xoá hoặc bạn không có quyền xem.
          </div>
          <button
            onClick={onClose}
            className="h-8 px-3 rounded-lg border-0 text-white text-[13px] cursor-pointer"
            style={{ background: C.primary }}
          >
            Quay lại bảng
          </button>
        </div>
      </div>
    );
  }

  const list = lists.find((l) => l.id === card.listId);
  const done = card.completedAt !== null;
  const overdue = card.deadlineStatus === "LATE" && !done;

  const labels = card.labelIds
    .map((id) => labelById.get(id))
    .filter((l): l is NonNullable<typeof l> => !!l);

  const snoozeMenu = {
    items: SNOOZE_OPTIONS.map((opt) => ({
      key: opt.key,
      danger: opt.key === "clear",
      label: (
        <span className="flex items-center justify-between gap-6">
          {opt.label}
          {opt.hint && (
            <span className="text-[11.5px]" style={{ color: C.mutedForeground }}>
              {opt.hint(new Date())}
            </span>
          )}
        </span>
      ),
      onClick: () => {
        const target = opt.resolve(new Date());
        snoozeCard(card.id, target ? target.toISOString() : null, opt.label.toLowerCase());
      },
    })),
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* ===== Thanh trên cùng ===== */}
      <div
        className="h-14 shrink-0 flex items-center gap-2 px-3 sm:px-4"
        style={{ borderBottom: `1px solid ${C.border}` }}
      >
        <button
          onClick={onClose}
          className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border-0 bg-transparent
            cursor-pointer text-[13px] hover:bg-[#f0f2f5]"
          style={{ color: C.neutral700 }}
        >
          <ArrowLeft size={16} />
          <span className="hidden sm:inline">Quay lại bảng</span>
        </button>

        <span
          className="font-mono text-[12px] px-2 h-6 grid place-items-center rounded-md shrink-0"
          style={{ background: C.muted, color: C.neutral700 }}
        >
          {card.code}
        </span>

        <span
          className="hidden md:inline-flex items-center gap-1 text-[12.5px]"
          style={{ color: C.mutedForeground }}
        >
          trong
          <span className="inline-flex items-center gap-0.5 font-medium" style={{ color: C.neutral700 }}>
            {list?.title ?? "Hộp thư đến"}
            <ChevronDown size={13} />
          </span>
        </span>

        <div className="flex-1" />

        {!done && (
          <Dropdown trigger={["click"]} placement="bottomRight" menu={snoozeMenu}>
            <button
              className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg cursor-pointer text-[13px]"
              style={{ background: "#fff", border: `1px solid ${C.border}`, color: C.neutral700 }}
            >
              <Hourglass size={14} />
              <span className="hidden sm:inline">Dời hạn</span>
            </button>
          </Dropdown>
        )}

        <button
          onClick={() => toggleComplete(card.id)}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border-0 cursor-pointer text-[13px] font-medium"
          style={
            done
              ? { background: C.success50, color: C.success }
              : { background: C.success, color: "#fff" }
          }
        >
          <CheckSquare size={14} />
          {done ? "Đã xong" : "Hoàn thành"}
        </button>

        <Dropdown
          trigger={["click"]}
          placement="bottomRight"
          menu={{
            items: [
              ...COVER_PRESETS.map((cover, i) => ({
                key: `cover-${i}`,
                label: (
                  <span className="flex items-center gap-2">
                    <span className="inline-block w-8 h-4 rounded" style={{ background: cover }} />
                    Ảnh bìa {i + 1}
                  </span>
                ),
                onClick: () => detail.updateCard.mutate({ cover }),
              })),
              {
                key: "no-cover",
                label: "Bỏ ảnh bìa",
                onClick: () => detail.updateCard.mutate({ cover: null }),
              },
              { type: "divider" as const },
              {
                key: "delete",
                danger: true,
                icon: <Trash2 size={14} />,
                label: "Xoá việc này",
                onClick: () => {
                  deleteCard(card.id);
                  onClose();
                },
              },
            ],
          }}
        >
          <button
            aria-label="Thao tác khác"
            className="grid place-items-center size-8 rounded-lg cursor-pointer"
            style={{ background: "#fff", border: `1px solid ${C.border}`, color: C.neutral700 }}
          >
            <MoreHorizontal size={16} />
          </button>
        </Dropdown>

        <button
          aria-label="Đóng"
          onClick={onClose}
          className="grid place-items-center size-8 rounded-lg border-0 bg-transparent cursor-pointer hover:bg-[#f0f2f5]"
          style={{ color: C.neutral700 }}
        >
          <X size={18} />
        </button>
      </div>

      {card.cover && <div className="shrink-0" style={{ background: card.cover, height: 88 }} />}

      {/* ===== Thân 2 cột ===== */}
      <div className={`${styles.cardDetailGrid} flex-1 min-h-0`}>
        <div className={`${styles.detailScroll} overflow-y-auto px-4 sm:px-8 py-6`}>
          <div className="max-w-[720px] mx-auto flex flex-col gap-6">
            <CardTitle card={card} done={done} detail={detail} />

            {/* Thuộc tính */}
            <div className="flex flex-wrap gap-x-8 gap-y-4">
              {card.deadline && (
                <Field icon={<Calendar size={13} />} label="Hạn chót">
                  <span
                    className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[13px] font-medium"
                    style={
                      overdue
                        ? { background: C.danger50, color: C.danger }
                        : done
                          ? { background: C.success50, color: C.success }
                          : { background: C.muted, color: C.neutral700 }
                    }
                  >
                    <Clock size={13} />
                    {fmtShort(card.deadline)}
                    {overdue && " · quá hạn"}
                  </span>
                </Field>
              )}

              <Field icon={<Zap size={13} />} label="Ưu tiên">
                <div className="flex gap-1">
                  {Object.values(TaskPriority).map((p) => {
                    const on = card.priority === p;
                    return (
                      <button
                        key={p}
                        onClick={() => detail.updateCard.mutate({ priority: p })}
                        className="h-7 px-2 rounded-lg text-[12px] font-medium border-0 cursor-pointer transition-colors"
                        style={{
                          background: on ? `${PRIORITY_META[p].color}1f` : C.muted,
                          color: on ? PRIORITY_META[p].color : C.mutedForeground,
                          boxShadow: on ? `inset 0 0 0 1px ${PRIORITY_META[p].color}55` : undefined,
                        }}
                      >
                        {PRIORITY_META[p].label}
                      </button>
                    );
                  })}
                </div>
              </Field>

              {card.estimateMinutes !== null && (
                <Field icon={<Timer size={13} />} label="Thời lượng">
                  <span
                    className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[13px]"
                    style={{ background: C.muted, color: C.neutral700 }}
                  >
                    {fmtDuration(card.estimateMinutes)}
                  </span>
                </Field>
              )}

              {card.repeat && (
                <Field icon={<Repeat size={13} />} label="Lặp lại">
                  <span
                    className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[13px]"
                    style={{ background: C.primary50, color: C.primary }}
                  >
                    {repeatText(card.repeat)}
                  </span>
                </Field>
              )}

              {labels.length > 0 && (
                <Field icon={<TagIcon size={13} />} label="Nhãn">
                  <span className="flex flex-wrap gap-1.5">
                    {labels.map((l) => (
                      <LabelChip key={l.id} label={l} />
                    ))}
                  </span>
                </Field>
              )}
            </div>

            {/* Nguồn — thứ Trello không có */}
            {card.source !== "MANUAL" && (
              <div
                className="rounded-xl p-3.5"
                style={{ background: C.primary50, border: `1px solid ${C.primary100}` }}
              >
                <div
                  className="flex items-center gap-2 text-[12.5px] font-semibold"
                  style={{ color: C.primary }}
                >
                  <Mail size={14} />
                  {card.source === "EMAIL"
                    ? "Việc này được tạo tự động từ email"
                    : "Việc này được tạo tự động từ tin nhắn Zalo"}
                </div>
                {card.attachmentLinks.length > 0 && (
                  <div className="text-[12px] mt-1.5" style={{ color: C.mutedForeground }}>
                    {card.attachmentLinks.length} liên kết bóc ra từ nội dung gốc
                  </div>
                )}
              </div>
            )}

            <DescriptionSection card={card} detail={detail} />

            {card.attachments.length > 0 && (
              <Section icon={<Paperclip size={16} />} title="Tệp đính kèm">
                <div className="flex flex-col gap-2">
                  {card.attachments.map((att) => (
                    <div key={att.id} className="flex items-center gap-3">
                      <span
                        className="grid place-items-center w-[62px] h-[42px] rounded-lg shrink-0 text-white"
                        style={{
                          background:
                            att.kind === "IMAGE"
                              ? "linear-gradient(135deg,#2d79a8,#0a436d)"
                              : C.neutral700,
                        }}
                      >
                        {att.kind === "IMAGE" ? (
                          <ImageIcon size={17} />
                        ) : att.kind === "LINK" ? (
                          <Link2 size={17} />
                        ) : (
                          <FileText size={17} />
                        )}
                      </span>
                      <div className="min-w-0">
                        <div className="text-[13.5px] font-medium truncate" style={{ color: C.foreground }}>
                          {att.name}
                        </div>
                        <div className="text-[12px]" style={{ color: C.mutedForeground }}>
                          {fmtDateTime(att.createdAt)}
                          {att.sizeBytes !== null && ` · ${fmtBytes(att.sizeBytes)}`}
                          {att.isCover && " · ảnh bìa"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {card.checklists.map((cl) => (
              <ChecklistBlock key={cl.id} checklist={cl} detail={detail} />
            ))}

            <button
              onClick={() => detail.addChecklist.mutate("Việc cần làm")}
              className="self-start inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border-0 text-[13px] cursor-pointer"
              style={{ background: C.muted, color: C.neutral700 }}
            >
              <Plus size={15} /> Thêm danh sách việc cần làm
            </button>
          </div>
        </div>

        <NotesColumn card={card} detail={detail} />
      </div>
    </div>
  );
}

type DetailApi = ReturnType<typeof useCardDetail>;

// ==========================================
// TIÊU ĐỀ
// ==========================================
function CardTitle({
  card,
  done,
  detail,
}: {
  card: CardDetail;
  done: boolean;
  detail: DetailApi;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(card.title);

  if (!editing) {
    return (
      <h1
        onClick={() => {
          setDraft(card.title);
          setEditing(true);
        }}
        className="m-0 text-[24px] font-bold leading-snug cursor-text rounded-lg px-2.5 py-1.5 -mx-2.5 hover:bg-[#f7f8fa]"
        style={{
          color: done ? C.mutedForeground : C.foreground,
          textDecoration: done ? "line-through" : undefined,
        }}
      >
        {card.title}
      </h1>
    );
  }

  return (
    <textarea
      autoFocus
      rows={2}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        const next = draft.trim();
        if (next && next !== card.title) detail.updateCard.mutate({ title: next });
        setEditing(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          e.currentTarget.blur();
        }
        if (e.key === "Escape") {
          setDraft(card.title);
          setEditing(false);
        }
      }}
      className="w-full resize-none rounded-lg px-2.5 py-1.5 text-[24px] font-bold outline-none"
      style={{
        color: C.foreground,
        border: `1px solid ${C.primary300}`,
        boxShadow: "0 0 0 3px rgba(10,67,109,.1)",
      }}
    />
  );
}

// ==========================================
// MÔ TẢ
// ==========================================
function DescriptionSection({ card, detail }: { card: CardDetail; detail: DetailApi }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(card.description ?? "");
  const hasDescription = !isRichTextEmpty(card.description);

  const open = () => {
    setDraft(card.description ?? "");
    setEditing(true);
  };

  const save = () => {
    detail.updateCard.mutate({
      description: isRichTextEmpty(draft) ? null : draft,
    });
    setEditing(false);
  };

  return (
    <Section
      icon={<AlignLeft size={16} />}
      title="Mô tả chi tiết"
      action={
        !editing && hasDescription ? (
          <button
            onClick={open}
            className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg border-0 text-[12.5px] cursor-pointer"
            style={{ background: C.muted, color: C.neutral700 }}
          >
            <Pencil size={13} /> Sửa
          </button>
        ) : null
      }
    >
      {editing ? (
        <div className="flex flex-col gap-2">
          <RichTextEditor autoFocus value={draft} onChange={setDraft} />
          <div className="flex items-center gap-2">
            <button
              onClick={save}
              className="h-8 px-3 rounded-lg border-0 text-white text-[13px] font-medium cursor-pointer"
              style={{ background: C.primary }}
            >
              Lưu
            </button>
            <button
              onClick={() => setEditing(false)}
              className="h-8 px-3 rounded-lg border-0 bg-transparent text-[13px] cursor-pointer hover:bg-[#f0f2f5]"
              style={{ color: C.neutral700 }}
            >
              Huỷ
            </button>
          </div>
        </div>
      ) : hasDescription ? (
        /* Chế độ đọc vẫn dùng Quill readOnly: HTML do backend/email sinh ra được
           Quill dựng lại theo đúng danh sách định dạng cho phép, không cắm thẳng
           HTML lạ vào DOM. */
        <div
          onClick={open}
          className="rounded-lg px-3 py-2.5 cursor-text transition-colors hover:bg-[#f7f8fa]"
        >
          <RichTextEditor readOnly value={card.description ?? ""} />
        </div>
      ) : (
        <button
          onClick={open}
          className="w-full text-left rounded-lg px-3 py-2.5 border-0 cursor-pointer text-[14px] min-h-[56px]"
          style={{ background: C.muted, color: C.mutedForeground }}
        >
          Thêm mô tả chi tiết hơn...
        </button>
      )}
    </Section>
  );
}

// ==========================================
// KHỐI DÙNG CHUNG
// ==========================================
function Field({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span
        className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide"
        style={{ color: C.mutedForeground }}
      >
        {icon}
        {label}
      </span>
      {children}
    </div>
  );
}

function Section({
  icon,
  title,
  action,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2" style={{ color: C.foreground }}>
        <span className="shrink-0">{icon}</span>
        <span className="font-semibold text-[15px] flex-1">{title}</span>
        {action}
      </div>
      <div>{children}</div>
    </div>
  );
}

// ==========================================
// CHECKLIST
// ==========================================
function ChecklistBlock({ checklist, detail }: { checklist: Checklist; detail: DetailApi }) {
  const [hideChecked, setHideChecked] = useState(false);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  const total = checklist.items.length;
  const doneCount = checklist.items.filter((i) => i.checked).length;
  const percent = total === 0 ? 0 : Math.round((doneCount / total) * 100);
  const visible = hideChecked ? checklist.items.filter((i) => !i.checked) : checklist.items;

  const addItem = () => {
    const content = draft.trim();
    if (!content) return;
    detail.addChecklistItem.mutate({ checklistId: checklist.id, content });
    setDraft("");
  };

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2">
        <CheckSquare size={16} className="shrink-0" style={{ color: C.foreground }} />
        <span className="font-semibold text-[15px] flex-1" style={{ color: C.foreground }}>
          {checklist.title}
        </span>
        {doneCount > 0 && (
          <button
            onClick={() => setHideChecked((v) => !v)}
            className="h-7 px-2.5 rounded-lg border-0 text-[12.5px] cursor-pointer"
            style={{ background: C.muted, color: C.neutral700 }}
          >
            {hideChecked ? `Hiện ${doneCount} mục đã xong` : "Ẩn mục đã xong"}
          </button>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[11.5px] tabular-nums w-8 shrink-0" style={{ color: C.mutedForeground }}>
            {percent}%
          </span>
          <Progress
            percent={percent}
            showInfo={false}
            size="small"
            strokeColor={percent === 100 ? C.success : C.primary300}
          />
        </div>

        {visible.map((item) => (
          <div
            key={item.id}
            className="group/item flex items-start gap-2 rounded-lg px-1.5 py-1 hover:bg-[#f7f8fa]"
          >
            <input
              type="checkbox"
              checked={item.checked}
              onChange={() =>
                detail.toggleChecklistItem.mutate({ itemId: item.id, checked: !item.checked })
              }
              className="mt-0.5 size-4 shrink-0 cursor-pointer"
              style={{ accentColor: C.primary }}
            />
            <span
              className="flex-1 text-[14px] leading-snug"
              style={{
                color: item.checked ? C.mutedForeground : C.foreground,
                textDecoration: item.checked ? "line-through" : undefined,
              }}
            >
              {item.content}
            </span>
            <button
              aria-label="Xoá mục"
              onClick={() => detail.deleteChecklistItem.mutate(item.id)}
              className="opacity-0 group-hover/item:opacity-100 grid place-items-center size-6
                rounded border-0 bg-transparent cursor-pointer"
              style={{ color: C.neutral500 }}
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}

        {adding ? (
          <div className="flex flex-col gap-2 mt-1">
            <textarea
              autoFocus
              rows={2}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  addItem();
                }
                if (e.key === "Escape") setAdding(false);
              }}
              placeholder="Thêm một mục..."
              className="w-full resize-none rounded-lg px-2.5 py-1.5 text-[14px] outline-none"
              style={{
                border: `1px solid ${C.primary300}`,
                boxShadow: "0 0 0 3px rgba(10,67,109,.1)",
                color: C.foreground,
              }}
            />
            <div className="flex gap-2">
              <button
                onClick={addItem}
                className="h-8 px-3 rounded-lg border-0 text-white text-[13px] cursor-pointer"
                style={{ background: C.primary }}
              >
                Thêm
              </button>
              <button
                onClick={() => setAdding(false)}
                className="h-8 px-3 rounded-lg border-0 bg-transparent text-[13px] cursor-pointer hover:bg-[#f0f2f5]"
                style={{ color: C.neutral700 }}
              >
                Huỷ
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="self-start h-8 px-3 mt-1 rounded-lg border-0 text-[13px] cursor-pointer"
            style={{ background: C.muted, color: C.neutral700 }}
          >
            Thêm một mục
          </button>
        )}
      </div>
    </div>
  );
}

// ==========================================
// GHI CHÚ CỦA TÔI
// ==========================================
function NotesColumn({ card, detail }: { card: CardDetail; detail: DetailApi }) {
  const [draft, setDraft] = useState("");
  const [showLog, setShowLog] = useState(false);

  const submit = () => {
    const content = draft.trim();
    if (!content) return;
    detail.addNote.mutate(content);
    setDraft("");
  };

  return (
    <div
      className={`${styles.detailScroll} overflow-y-auto px-4 py-5 flex flex-col gap-3`}
      style={{ borderLeft: `1px solid ${C.border}`, background: "#fbfcfd" }}
    >
      <div className="flex items-center gap-2">
        <StickyNote size={16} style={{ color: C.foreground }} />
        <span className="font-semibold text-[15px] flex-1" style={{ color: C.foreground }}>
          Ghi chú của tôi
        </span>
        {card.notes.length > 0 && (
          <span
            className="text-[11.5px] font-semibold tabular-nums px-1.5 h-5 grid place-items-center rounded-md"
            style={{ background: C.muted, color: C.neutral700 }}
          >
            {card.notes.length}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <textarea
          rows={draft ? 4 : 2}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
          }}
          placeholder="Ghi cho chính mình: đang vướng gì, lần sau làm khác thế nào..."
          className="w-full resize-none rounded-xl bg-white px-3 py-2.5 text-[13.5px] outline-none"
          style={{ border: `1px solid ${C.border}`, color: C.foreground }}
        />
        {draft.trim() && (
          <button
            onClick={submit}
            className="self-start h-8 px-3 rounded-lg border-0 text-white text-[13px] cursor-pointer"
            style={{ background: C.primary }}
          >
            Lưu ghi chú
          </button>
        )}
        <span className="text-[11px]" style={{ color: C.mutedForeground }}>
          Ctrl + Enter để lưu nhanh
        </span>
      </div>

      {card.notes.length === 0 && !draft && (
        <p className="text-[12.5px] leading-relaxed m-0" style={{ color: C.mutedForeground }}>
          Chưa có ghi chú nào. Chỗ này để bạn tự nhắc mình — không ai khác đọc được.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {card.notes.map((note) => (
          <div
            key={note.id}
            className="group/note rounded-xl bg-white px-3 py-2.5"
            style={{ border: `1px solid ${C.border}` }}
          >
            <div
              className="text-[13.5px] whitespace-pre-wrap leading-relaxed"
              style={{ color: C.foreground }}
            >
              {note.content}
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[11.5px]" style={{ color: C.mutedForeground }}>
                {fmtDateTime(note.createdAt)}
                {note.editedAt && " · đã sửa"}
              </span>
              <button
                aria-label="Xoá ghi chú"
                onClick={() => detail.deleteNote.mutate(note.id)}
                className="opacity-0 group-hover/note:opacity-100 grid place-items-center size-6
                  rounded border-0 bg-transparent cursor-pointer"
                style={{ color: C.neutral500 }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Nhật ký gập lại mặc định: thông tin tra cứu, không phải thông tin chính */}
      <div className="mt-1" style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
        <button
          onClick={() => setShowLog((v) => !v)}
          className="w-full flex items-center gap-1.5 h-7 px-1 rounded-lg border-0 bg-transparent
            cursor-pointer text-[12.5px] font-medium text-left"
          style={{ color: C.neutral700 }}
        >
          <ChevronDown
            size={14}
            style={{
              transform: showLog ? undefined : "rotate(-90deg)",
              transition: "transform .15s",
            }}
          />
          Nhật ký ({card.activities.length})
        </button>

        {showLog && (
          <div className="flex flex-col gap-2 mt-2 pl-1">
            {card.activities.map((entry) => (
              <div key={entry.id} className="flex flex-col">
                <span className="text-[12.5px] leading-snug" style={{ color: C.neutral700 }}>
                  {entry.message}
                </span>
                <span className="text-[11px]" style={{ color: C.mutedForeground }}>
                  {fmtDateTime(entry.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
