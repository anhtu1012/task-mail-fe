"use client";
/**
 * Gắn nhãn cho thẻ, và quản lý luôn danh sách nhãn của bảng.
 *
 * Gộp hai việc vào một popover là có chủ đích: lúc người dùng cần một nhãn mới
 * là đúng lúc họ đang gắn nhãn. Tách ra thành một trang "quản lý nhãn" riêng
 * thì họ phải rời thẻ đang mở, tạo nhãn, rồi quay lại tìm chỗ cũ.
 *
 * Ba chế độ trong cùng một khung:
 *   - danh sách: bấm một dòng = gắn/gỡ nhãn khỏi thẻ;
 *   - tạo mới: nhập tên, chọn màu, chọn icon;
 *   - sửa: như tạo mới, thêm nút xoá.
 *
 * Nhãn thuộc BẢNG, mà mỗi dự án một bảng — sửa hay xoá ở đây là đổi cho mọi
 * thẻ trong dự án này, nên nút xoá có hộp xác nhận nói rõ điều đó.
 */
import { useState } from "react";
import { Button, Input, Popconfirm, Popover, Tooltip } from "antd";
import { Check, Pencil, Plus, Tag, Trash2, X } from "lucide-react";
import {
  BoardLabel,
  LABEL_COLORS,
  LABEL_ICONS,
} from "@/models/board";
import { useBoard } from "./BoardStore";
import LabelIcon from "./LabelIcon";
import { C } from "./ui";

type Mode = { kind: "list" } | { kind: "create" } | { kind: "edit"; label: BoardLabel };

export default function LabelPicker({
  cardId,
  selectedIds,
  children,
}: {
  cardId: string;
  selectedIds: string[];
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      trigger="click"
      placement="bottomLeft"
      content={<PickerBody cardId={cardId} selectedIds={selectedIds} />}
      styles={{ content: { padding: 10, width: 268 } }}
    >
      {children}
    </Popover>
  );
}

function PickerBody({
  cardId,
  selectedIds,
}: {
  cardId: string;
  selectedIds: string[];
}) {
  const { labels, toggleCardLabel, deleteLabel } = useBoard();
  const [mode, setMode] = useState<Mode>({ kind: "list" });
  const [keyword, setKeyword] = useState("");

  if (mode.kind !== "list") {
    return (
      <LabelForm
        label={mode.kind === "edit" ? mode.label : undefined}
        // Tạo từ ô tìm kiếm thì điền sẵn thứ người dùng vừa gõ
        initialName={mode.kind === "create" ? keyword.trim() : undefined}
        onDone={() => setMode({ kind: "list" })}
      />
    );
  }

  const kw = keyword.trim().toLowerCase();
  const visible = kw
    ? labels.filter(
        (l) =>
          l.name.toLowerCase().includes(kw) || l.slug.includes(kw.replace(/\s/g, "")),
      )
    : labels;

  return (
    <div className="flex flex-col gap-2">
      <Input
        size="small"
        allowClear
        autoFocus
        placeholder="Tìm hoặc tạo nhãn..."
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />

      <div className="flex flex-col gap-0.5 max-h-[232px] overflow-auto">
        {visible.map((label) => {
          const active = selectedIds.includes(label.id);
          return (
            <div key={label.id} className="flex items-center gap-1 group/row">
              <button
                type="button"
                onClick={() => toggleCardLabel(cardId, label.id)}
                className="flex-1 min-w-0 flex items-center gap-2 h-8 px-2 rounded-lg border-0 cursor-pointer text-left"
                style={{
                  background: active ? `${label.color}1f` : "transparent",
                  color: C.neutral700,
                }}
              >
                <span
                  className="grid place-items-center size-5 rounded shrink-0 text-white"
                  style={{ background: label.color }}
                >
                  <LabelIcon name={label.icon} size={12} />
                </span>
                <span className="flex-1 min-w-0 truncate text-[13px]">
                  {label.name}
                </span>
                {active && <Check size={14} color="#2a9d8f" />}
              </button>
              <Tooltip title="Sửa nhãn">
                <button
                  type="button"
                  aria-label={`Sửa nhãn ${label.name}`}
                  onClick={() => setMode({ kind: "edit", label })}
                  className="grid place-items-center size-6 rounded border-0 bg-transparent cursor-pointer
                    opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100 transition-opacity"
                  style={{ color: C.neutral500 }}
                >
                  <Pencil size={13} />
                </button>
              </Tooltip>
              <Popconfirm
                title="Xoá nhãn này?"
                description="Nhãn sẽ bị gỡ khỏi mọi việc trong dự án."
                okText="Xoá"
                cancelText="Huỷ"
                okButtonProps={{ danger: true }}
                onConfirm={() => deleteLabel(label.id)}
              >
                <button
                  type="button"
                  aria-label={`Xoá nhãn ${label.name}`}
                  className="grid place-items-center size-6 rounded border-0 bg-transparent cursor-pointer
                    opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100 transition-opacity"
                  style={{ color: "#e63946" }}
                >
                  <Trash2 size={13} />
                </button>
              </Popconfirm>
            </div>
          );
        })}

        {visible.length === 0 && (
          <div
            className="py-3 text-center text-[12.5px]"
            style={{ color: C.neutral500 }}
          >
            {labels.length === 0
              ? "Dự án này chưa có nhãn nào"
              : "Không có nhãn nào khớp"}
          </div>
        )}
      </div>

      <Button
        size="small"
        icon={<Plus size={14} />}
        onClick={() => setMode({ kind: "create" })}
        block
      >
        {keyword.trim() ? `Tạo nhãn "${keyword.trim()}"` : "Tạo nhãn mới"}
      </Button>
    </div>
  );
}

/** Form dùng chung cho tạo và sửa — khác nhau đúng một nút xoá và nhãn nút lưu */
function LabelForm({
  label,
  initialName,
  onDone,
}: {
  label?: BoardLabel;
  initialName?: string;
  onDone: () => void;
}) {
  const { createLabel, updateLabel } = useBoard();
  const [name, setName] = useState(label?.name ?? initialName ?? "");
  const [color, setColor] = useState(label?.color ?? LABEL_COLORS[0]);
  // `null` là giá trị hợp lệ: nhãn không icon, chỉ có màu
  const [icon, setIcon] = useState<string | null>(label?.icon ?? null);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      if (label) {
        await updateLabel(label.id, { name: trimmed, color, icon });
      } else {
        await createLabel({ name: trimmed, color, icon });
      }
      onDone();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold" style={{ color: C.neutral700 }}>
          {label ? "Sửa nhãn" : "Nhãn mới"}
        </span>
        <button
          type="button"
          aria-label="Quay lại danh sách"
          onClick={onDone}
          className="grid place-items-center size-6 rounded border-0 bg-transparent cursor-pointer"
          style={{ color: C.neutral500 }}
        >
          <X size={14} />
        </button>
      </div>

      <Input
        size="small"
        autoFocus
        maxLength={60}
        placeholder="Tên nhãn"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onPressEnter={submit}
      />

      <div>
        <div className="text-[11.5px] mb-1.5" style={{ color: C.neutral500 }}>
          Màu
        </div>
        <div className="flex flex-wrap gap-1.5">
          {LABEL_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Màu ${c}`}
              onClick={() => setColor(c)}
              className="size-6 rounded-md border-0 cursor-pointer"
              style={{
                background: c,
                outline: color === c ? "2px solid #0f172a" : "none",
                outlineOffset: 2,
              }}
            />
          ))}
        </div>
      </div>

      <div>
        <div className="text-[11.5px] mb-1.5" style={{ color: C.neutral500 }}>
          Biểu tượng
        </div>
        <div className="flex flex-wrap gap-1.5">
          {/* Ô đầu tiên = không icon, để gỡ được icon đã chọn */}
          <button
            type="button"
            aria-label="Không dùng biểu tượng"
            onClick={() => setIcon(null)}
            className="grid place-items-center size-7 rounded-md cursor-pointer"
            style={{
              border: `1px solid ${icon === null ? "#0f172a" : C.border}`,
              background: "#fff",
              color: C.neutral500,
            }}
          >
            <Tag size={13} style={{ opacity: 0.35 }} />
          </button>
          {LABEL_ICONS.map((ic) => (
            <button
              key={ic}
              type="button"
              aria-label={`Biểu tượng ${ic}`}
              onClick={() => setIcon(ic)}
              className="grid place-items-center size-7 rounded-md cursor-pointer"
              style={{
                border: `1px solid ${icon === ic ? "#0f172a" : C.border}`,
                background: icon === ic ? color : "#fff",
                color: icon === ic ? "#fff" : C.neutral700,
              }}
            >
              <LabelIcon name={ic} size={13} />
            </button>
          ))}
        </div>
      </div>

      <Button
        type="primary"
        size="small"
        block
        loading={saving}
        disabled={!name.trim()}
        onClick={submit}
      >
        {label ? "Lưu nhãn" : "Tạo nhãn"}
      </Button>
    </div>
  );
}
