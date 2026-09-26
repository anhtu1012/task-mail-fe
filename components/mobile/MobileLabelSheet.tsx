"use client";

/**
 * Gắn nhãn trên mobile — khung trượt từ dưới lên thay cho popover của desktop.
 *
 * Popover ~270px đặt cạnh thẻ thì trên điện thoại vừa chật vừa bị bàn phím che;
 * ở đây mỗi nhãn là một dòng cao 48px, bấm để bật/tắt, khung vẫn mở để gắn
 * tiếp nhiều nhãn. Gõ tên chưa có thì hiện nút tạo nhãn mới và gắn luôn.
 */
import { useState } from "react";
import { Drawer } from "antd";
import { Check, LoaderCircle, Plus, Search } from "lucide-react";
import { useBoard } from "@/components/board/BoardStore";
import { C } from "@/components/board/ui";
import { LABEL_COLORS } from "@/models/board";

export function MobileLabelSheet({
  cardId,
  onClose,
}: {
  /** null = đóng */
  cardId: string | null;
  onClose: () => void;
}) {
  return (
    <Drawer
      placement="bottom"
      open={cardId !== null}
      onClose={onClose}
      closable={false}
      size="auto"
      destroyOnHidden
      styles={{
        wrapper: { borderRadius: "20px 20px 0 0", overflow: "hidden" },
        body: { padding: "12px 16px calc(16px + env(safe-area-inset-bottom))" },
      }}
    >
      {cardId && <SheetBody cardId={cardId} onClose={onClose} />}
    </Drawer>
  );
}

function SheetBody({ cardId, onClose }: { cardId: string; onClose: () => void }) {
  const { labels, cardById, toggleCardLabel, createLabel } = useBoard();
  const [keyword, setKeyword] = useState("");
  const [creating, setCreating] = useState(false);

  // Đọc thẻ từ store mỗi lần render: bấm gắn là dấu tick cập nhật ngay
  const card = cardById.get(cardId);
  const selected = new Set(card?.labelIds ?? []);

  const kw = keyword.trim().toLowerCase();
  const visible = kw
    ? labels.filter(
        (l) => l.name.toLowerCase().includes(kw) || l.slug.includes(kw.replace(/\s/g, "")),
      )
    : labels;
  const exact = labels.some((l) => l.name.toLowerCase() === kw);

  const create = async () => {
    const name = keyword.trim();
    if (!name || creating) return;
    setCreating(true);
    // Màu theo tên — cùng một tên luôn ra cùng một màu, như ô thêm việc nhanh
    const seed = [...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
    const label = await createLabel({ name, color: LABEL_COLORS[seed % LABEL_COLORS.length] });
    setCreating(false);
    if (label) {
      toggleCardLabel(cardId, label.id);
      setKeyword("");
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="mx-auto w-10 h-1 rounded-full" style={{ background: C.border }} />
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[16px] font-bold" style={{ color: C.foreground }}>
            Gắn nhãn
          </div>
          {card && (
            <div className="text-[12.5px] truncate" style={{ color: C.mutedForeground }}>
              {card.title}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="h-9 px-4 rounded-xl border-0 cursor-pointer text-[14px] font-semibold text-white shrink-0"
          style={{ background: C.primary }}
        >
          Xong
        </button>
      </div>

      <label
        className="flex items-center gap-2 h-11 px-3 rounded-xl"
        style={{ border: `1px solid ${C.border}`, background: C.muted }}
      >
        <Search size={16} style={{ color: C.neutral500 }} />
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            e.preventDefault();
            // Có nhãn khớp thì bật/tắt nhãn đầu tiên, không có thì tạo mới
            if (visible[0]) {
              toggleCardLabel(cardId, visible[0].id);
              setKeyword("");
            } else void create();
          }}
          placeholder="Tìm hoặc tạo nhãn..."
          className="flex-1 min-w-0 bg-transparent border-0 outline-none text-[15px]"
          style={{ color: C.foreground }}
          enterKeyHint="done"
        />
      </label>

      <div className="flex flex-col max-h-[45vh] overflow-y-auto -mx-1">
        {visible.map((label) => {
          const active = selected.has(label.id);
          return (
            <button
              key={label.id}
              type="button"
              onClick={() => {
                navigator.vibrate?.(8);
                toggleCardLabel(cardId, label.id);
              }}
              className="flex items-center gap-3 h-12 px-2 mx-1 rounded-xl border-0 cursor-pointer text-left"
              style={{ background: active ? `${label.color}17` : "transparent" }}
            >
              <span className="size-4 rounded-full shrink-0" style={{ background: label.color }} />
              <span className="flex-1 min-w-0 truncate text-[15px]" style={{ color: C.foreground }}>
                {label.name}
              </span>
              <span
                className="grid place-items-center size-6 rounded-md shrink-0"
                style={{
                  border: `2px solid ${active ? label.color : C.border}`,
                  background: active ? label.color : "transparent",
                  color: "#fff",
                }}
              >
                {active && <Check size={14} strokeWidth={3} />}
              </span>
            </button>
          );
        })}

        {labels.length === 0 && !kw && (
          <div className="py-6 text-center text-[13.5px]" style={{ color: C.mutedForeground }}>
            Dự án chưa có nhãn nào — gõ tên ở trên để tạo nhãn đầu tiên.
          </div>
        )}
      </div>

      {kw && !exact && (
        <button
          type="button"
          onClick={() => void create()}
          disabled={creating}
          className="inline-flex items-center justify-center gap-2 h-11 rounded-xl cursor-pointer text-[14px] font-semibold disabled:opacity-60"
          style={{ border: `1px dashed ${C.primary300}`, background: "transparent", color: C.primary }}
        >
          {creating ? <LoaderCircle size={15} className="animate-spin" /> : <Plus size={15} />}
          Tạo nhãn “{keyword.trim()}”
        </button>
      )}
    </div>
  );
}
