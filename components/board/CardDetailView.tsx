"use client";

/**
 * Chi tiết một việc, hiện trong hộp thoại lớn đè lên bảng.
 *
 * Dùng chung cho 2 nơi: modal (bấm từ bảng, route bị intercept) và trang riêng
 * (mở thẳng link / F5). Nhờ vậy link của việc luôn chia sẻ được mà không phải
 * viết hai lần giao diện.
 *
 * Cột phải là GHI CHÚ CỦA TÔI — không phải bình luận của người khác. Đây là
 * công cụ cá nhân: thứ có giá trị là những gì mình tự nhắc mình, kèm nhật ký
 * thao tác của chính mình để nhớ lại đã xử lý việc này thế nào.
 */
import { useState } from "react";
import { Dropdown, Progress } from "antd";
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
import { BoardCard, repeatText } from "@/models/board";
import { PRIORITY_META, TaskPriority } from "@/models/task";
import { COVER_PRESETS } from "@/mocks/board.mock";
import { useBoard } from "./BoardStore";
import { SNOOZE_OPTIONS } from "./snooze";
import { RichTextEditor } from "./RichTextEditor";
import { isRichTextEmpty } from "@/utils/client/richText";
import { C, LabelChip, fmtBytes, fmtDateTime, fmtShort } from "./ui";
import styles from "./board.module.scss";

const fmtDuration = (min: number) =>
  min < 60
    ? `${min} phút`
    : min % 60 === 0
      ? `${min / 60} giờ`
      : `${Math.floor(min / 60)}h${min % 60}`;

export function CardDetailView({
  card,
  onClose,
}: {
  card: BoardCard;
  onClose: () => void;
}) {
  const { lists, labelById, dispatch } = useBoard();
  const list = lists.find((l) => l.id === card.listId);
  const done = card.completedAt !== null;
  const overdue = card.deadlineStatus === "LATE" && !done;

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(card.title);
  const [editingDesc, setEditingDesc] = useState(false);
  const [descDraft, setDescDraft] = useState(card.description ?? "");

  const hasDescription = !isRichTextEmpty(card.description);

  const openDescEditor = () => {
    setDescDraft(card.description ?? "");
    setEditingDesc(true);
  };

  const saveDesc = () => {
    dispatch({
      type: "UPDATE_CARD",
      cardId: card.id,
      patch: { description: isRichTextEmpty(descDraft) ? null : descDraft },
    });
    setEditingDesc(false);
  };

  const cancelDesc = () => {
    setDescDraft(card.description ?? "");
    setEditingDesc(false);
  };

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
        dispatch({
          type: "SNOOZE_CARD",
          cardId: card.id,
          deadline: target ? target.toISOString() : null,
          label: opt.label.toLowerCase(),
        });
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
          <span
            className="inline-flex items-center gap-0.5 font-medium"
            style={{ color: C.neutral700 }}
          >
            {list?.title ?? "Hộp thư đến"}
            <ChevronDown size={13} />
          </span>
        </span>

        <div className="flex-1" />

        {/* Dời hạn — thao tác hay dùng nhất nên để ngoài, không giấu trong menu */}
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
          onClick={() => dispatch({ type: "TOGGLE_COMPLETE", cardId: card.id })}
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
                onClick: () => dispatch({ type: "UPDATE_CARD", cardId: card.id, patch: { cover } }),
              })),
              {
                key: "no-cover",
                label: "Bỏ ảnh bìa",
                onClick: () =>
                  dispatch({ type: "UPDATE_CARD", cardId: card.id, patch: { cover: null } }),
              },
              { type: "divider" as const },
              {
                key: "delete",
                danger: true,
                icon: <Trash2 size={14} />,
                label: "Xoá việc này",
                onClick: () => {
                  dispatch({ type: "DELETE_CARD", cardId: card.id });
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

      {/* ===== Thân 2 cột, mỗi cột cuộn riêng ===== */}
      <div className={`${styles.cardDetailGrid} flex-1 min-h-0`}>
        {/* ---------- Cột trái ---------- */}
        <div className={`${styles.detailScroll} overflow-y-auto px-4 sm:px-8 py-6`}>
          <div className="max-w-[720px] mx-auto flex flex-col gap-6">
            {editingTitle ? (
              <textarea
                autoFocus
                rows={2}
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onBlur={() => {
                  const next = titleDraft.trim();
                  if (next) {
                    dispatch({ type: "UPDATE_CARD", cardId: card.id, patch: { title: next } });
                  } else {
                    setTitleDraft(card.title);
                  }
                  setEditingTitle(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    e.currentTarget.blur();
                  }
                  if (e.key === "Escape") {
                    setTitleDraft(card.title);
                    setEditingTitle(false);
                  }
                }}
                className="w-full resize-none rounded-lg px-2.5 py-1.5 text-[24px] font-bold outline-none"
                style={{
                  color: C.foreground,
                  border: `1px solid ${C.primary300}`,
                  boxShadow: "0 0 0 3px rgba(10,67,109,.1)",
                }}
              />
            ) : (
              <h1
                onClick={() => {
                  setTitleDraft(card.title);
                  setEditingTitle(true);
                }}
                className="m-0 text-[24px] font-bold leading-snug cursor-text rounded-lg px-2.5 py-1.5 -mx-2.5 hover:bg-[#f7f8fa]"
                style={{
                  color: done ? C.mutedForeground : C.foreground,
                  textDecoration: done ? "line-through" : undefined,
                }}
              >
                {card.title}
              </h1>
            )}

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
                        onClick={() =>
                          dispatch({
                            type: "UPDATE_CARD",
                            cardId: card.id,
                            patch: { priority: p },
                          })
                        }
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

            {/* Nguồn email — thứ Trello không có */}
            {card.sourceMail && (
              <div
                className="rounded-xl p-3.5"
                style={{ background: C.primary50, border: `1px solid ${C.primary100}` }}
              >
                <div
                  className="flex items-center gap-2 text-[12.5px] font-semibold mb-1.5"
                  style={{ color: C.primary }}
                >
                  <Mail size={14} /> Việc này được tạo tự động từ email
                </div>
                <div className="text-[13.5px] font-medium" style={{ color: C.foreground }}>
                  {card.sourceMail.subject}
                </div>
                <div className="text-[12px] mt-0.5" style={{ color: C.mutedForeground }}>
                  {card.sourceMail.accountEmail} · nhận lúc{" "}
                  {fmtDateTime(card.sourceMail.receivedAt)}
                </div>
              </div>
            )}

            {/* Mô tả — chỉ hiện trình soạn thảo khi bấm vào */}
            <Section
              icon={<AlignLeft size={16} />}
              title="Mô tả chi tiết"
              action={
                !editingDesc && hasDescription ? (
                  <button
                    onClick={openDescEditor}
                    className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg border-0 text-[12.5px] cursor-pointer"
                    style={{ background: C.muted, color: C.neutral700 }}
                  >
                    <Pencil size={13} /> Sửa
                  </button>
                ) : null
              }
            >
              {editingDesc ? (
                <div className="flex flex-col gap-2">
                  <RichTextEditor autoFocus value={descDraft} onChange={setDescDraft} />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={saveDesc}
                      className="h-8 px-3 rounded-lg border-0 text-white text-[13px] font-medium cursor-pointer"
                      style={{ background: C.primary }}
                    >
                      Lưu
                    </button>
                    <button
                      onClick={cancelDesc}
                      className="h-8 px-3 rounded-lg border-0 bg-transparent text-[13px] cursor-pointer hover:bg-[#f0f2f5]"
                      style={{ color: C.neutral700 }}
                    >
                      Huỷ
                    </button>
                  </div>
                </div>
              ) : hasDescription ? (
                /* Chế độ đọc: vẫn là Quill nhưng readOnly, nên nội dung HTML do
                   backend/email sinh ra được Quill lọc lại theo đúng danh sách
                   định dạng cho phép — không cắm thẳng HTML lạ vào DOM. */
                <div
                  onClick={openDescEditor}
                  className="rounded-lg px-3 py-2.5 cursor-text transition-colors hover:bg-[#f7f8fa]"
                  style={{ border: `1px solid transparent` }}
                >
                  <RichTextEditor readOnly value={card.description ?? ""} />
                </div>
              ) : (
                <button
                  onClick={openDescEditor}
                  className="w-full text-left rounded-lg px-3 py-2.5 border-0 cursor-pointer text-[14px] min-h-[56px]"
                  style={{ background: C.muted, color: C.mutedForeground }}
                >
                  Thêm mô tả chi tiết hơn...
                </button>
              )}
            </Section>

            {/* Đính kèm */}
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
                        <div
                          className="text-[13.5px] font-medium truncate"
                          style={{ color: C.foreground }}
                        >
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
              <ChecklistBlock key={cl.id} cardId={card.id} checklist={cl} />
            ))}

            <button
              onClick={() =>
                dispatch({ type: "ADD_CHECKLIST", cardId: card.id, title: "Việc cần làm" })
              }
              className="self-start inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border-0 text-[13px] cursor-pointer"
              style={{ background: C.muted, color: C.neutral700 }}
            >
              <Plus size={15} /> Thêm danh sách việc cần làm
            </button>
          </div>
        </div>

        {/* ---------- Cột phải: ghi chú của tôi ---------- */}
        <NotesColumn card={card} />
      </div>
    </div>
  );
}

// ==========================================
// CÁC KHỐI CON
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
  /** Nút/ghi chú hiện bên phải tiêu đề mục */
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

function ChecklistBlock({
  cardId,
  checklist,
}: {
  cardId: string;
  checklist: BoardCard["checklists"][number];
}) {
  const { dispatch } = useBoard();
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
    dispatch({ type: "ADD_CHECKLIST_ITEM", cardId, checklistId: checklist.id, content });
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
          <span
            className="text-[11.5px] tabular-nums w-8 shrink-0"
            style={{ color: C.mutedForeground }}
          >
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
              onChange={() => dispatch({ type: "TOGGLE_CHECKLIST_ITEM", cardId, itemId: item.id })}
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
              onClick={() => dispatch({ type: "DELETE_CHECKLIST_ITEM", cardId, itemId: item.id })}
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

function NotesColumn({ card }: { card: BoardCard }) {
  const { dispatch } = useBoard();
  const [draft, setDraft] = useState("");
  const [showLog, setShowLog] = useState(false);

  const submit = () => {
    const content = draft.trim();
    if (!content) return;
    dispatch({ type: "ADD_NOTE", cardId: card.id, content });
    setDraft("");
  };

  const notes = [...card.notes].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const log = [...card.activities].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

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
        {notes.length > 0 && (
          <span
            className="text-[11.5px] font-semibold tabular-nums px-1.5 h-5 grid place-items-center rounded-md"
            style={{ background: C.muted, color: C.neutral700 }}
          >
            {notes.length}
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

      {notes.length === 0 && !draft && (
        <p className="text-[12.5px] leading-relaxed m-0" style={{ color: C.mutedForeground }}>
          Chưa có ghi chú nào. Chỗ này để bạn tự nhắc mình — không ai khác đọc được.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {notes.map((note) => (
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
              </span>
              <button
                aria-label="Xoá ghi chú"
                onClick={() => dispatch({ type: "DELETE_NOTE", cardId: card.id, noteId: note.id })}
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

      {/* Nhật ký gập lại mặc định: đây là thông tin tra cứu, không phải thông tin chính */}
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
          Nhật ký ({log.length})
        </button>

        {showLog && (
          <div className="flex flex-col gap-2 mt-2 pl-1">
            {log.map((entry) => (
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
