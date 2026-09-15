"use client";

/**
 * Hộp thư đến — thẻ chưa được xếp vào danh sách nào (listId = null).
 * Khác biệt so với Trello: thẻ ở đây phần lớn do hệ thống tự sinh từ email / Zalo,
 * người dùng chỉ việc kéo sang danh sách phù hợp.
 */
import { PointerEvent as ReactPointerEvent, useCallback, useRef, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Tooltip } from "antd";
import {
  Globe,
  Inbox,
  Mail,
  MessageCircle,
  PanelLeftClose,
  PanelLeftOpen,
  Smartphone,
} from "lucide-react";
import { useBoard } from "./BoardStore";
import { CardTile } from "./CardTile";
import { Composer } from "./Composer";
import { INBOX_DROP_ID } from "./BoardWorkspace";
import { G } from "./ui";
import styles from "./board.module.scss";

const MIN_WIDTH = 248;
const MAX_WIDTH = 420;

export function InboxPanel() {
  const { inboxCards, dispatch } = useBoard();
  const [width, setWidth] = useState(292);
  const [collapsed, setCollapsed] = useState(false);
  const [adding, setAdding] = useState(false);
  const draggingSplitter = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const { setNodeRef, isOver } = useDroppable({ id: INBOX_DROP_ID, data: { type: "inbox" } });

  // Kéo thanh dọc để đổi bề rộng; nghe trên window để không mất chuột khi ra ngoài.
  // Tính theo độ lệch so với lúc bắt đầu (không lấy clientX tuyệt đối) vì panel
  // không còn dính mép trái màn hình khi nằm trong layout có sidebar.
  const onSplitterDown = useCallback(
    (e: ReactPointerEvent) => {
      e.preventDefault();
      draggingSplitter.current = true;
      startX.current = e.clientX;
      startWidth.current = width;

      const onMove = (ev: PointerEvent) => {
        if (!draggingSplitter.current) return;
        const next = startWidth.current + (ev.clientX - startX.current);
        setWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, next)));
      };
      const onUp = () => {
        draggingSplitter.current = false;
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [width],
  );

  if (collapsed) {
    return (
      <div
        className={`${styles.glassPanel} w-11 shrink-0 hidden md:flex flex-col items-center pt-2.5 gap-3`}
      >
        <Tooltip title="Mở Hộp thư đến" placement="right">
          <button
            onClick={() => setCollapsed(false)}
            className="grid place-items-center size-8 rounded-md border-0 bg-transparent
              hover:bg-white/15 cursor-pointer"
            style={{ color: G.textSoft }}
          >
            <PanelLeftOpen size={17} />
          </button>
        </Tooltip>
        <div className="relative">
          <Inbox size={17} style={{ color: G.textMuted }} />
          {inboxCards.length > 0 && (
            <span
              className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 grid place-items-center
                rounded-full text-white text-[10px] font-bold"
              style={{ background: "rgba(163,209,235,.85)", color: "#062b47" }}
            >
              {inboxCards.length}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="hidden md:flex shrink-0" style={{ width }}>
      <div
        className={`${styles.glassPanel} flex-1 min-w-0 flex flex-col overflow-hidden`}
      >
        {/* Header */}
        <div
          className="flex items-center gap-2 px-3 h-11 shrink-0"
          style={{ borderBottom: `1px solid ${G.line}` }}
        >
          <Inbox size={16} style={{ color: G.info }} />
          <span className="font-semibold text-[13.5px] flex-1" style={{ color: G.text }}>
            Hộp thư đến
          </span>
          <span
            className="text-[11.5px] font-semibold tabular-nums px-1.5 h-5 grid place-items-center rounded-md"
            style={{ color: G.textSoft, background: G.fill }}
          >
            {inboxCards.length}
          </span>
          <Tooltip title="Thu gọn">
            <button
              onClick={() => setCollapsed(true)}
              className="grid place-items-center size-7 rounded-md border-0 bg-transparent
                hover:bg-white/15 cursor-pointer"
              style={{ color: G.textSoft }}
            >
              <PanelLeftClose size={15} />
            </button>
          </Tooltip>
        </div>

        {/* Ô thêm thẻ nhanh — luôn ở trên cùng */}
        <div className="px-2 pt-2 shrink-0">
          {adding ? (
            <Composer
              parse
              placeholder="Việc cần làm... (vd: Gọi khách hàng mai 9h !gấp)"
              submitLabel="Thêm"
              onSubmit={(text) => dispatch({ type: "ADD_CARD", listId: null, text, atTop: true })}
              onCancel={() => setAdding(false)}
            />
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="w-full h-8 px-2.5 rounded-lg cursor-pointer text-left text-[13px] transition-colors"
              style={{
                background: G.fill,
                border: `1px solid ${G.line}`,
                color: G.textMuted,
              }}
            >
              Thêm việc cần làm...
            </button>
          )}
        </div>

        {/* Danh sách thẻ */}
        <div
          ref={setNodeRef}
          className={`${styles.scrollArea} flex-1 min-h-0 overflow-y-auto p-2 flex flex-col gap-2 transition-colors`}
          style={{ background: isOver ? "rgba(255,255,255,.1)" : undefined }}
        >
          <SortableContext
            items={inboxCards.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            {inboxCards.map((card) => (
              <CardTile key={card.id} card={card} />
            ))}
          </SortableContext>

          {inboxCards.length === 0 && <EmptyInbox />}
        </div>
      </div>

      {/* Thanh kéo giãn */}
      <div
        onPointerDown={onSplitterDown}
        role="separator"
        aria-orientation="vertical"
        aria-label="Kéo để đổi bề rộng hộp thư đến"
        className="w-1.5 shrink-0 cursor-col-resize rounded-full transition-colors hover:bg-white/50"
      />
    </div>
  );
}

function EmptyInbox() {
  const sources = [
    { icon: <Mail size={15} />, label: "Email" },
    { icon: <MessageCircle size={15} />, label: "Zalo" },
    { icon: <Globe size={15} />, label: "Trình duyệt" },
    { icon: <Smartphone size={15} />, label: "Di động" },
  ];
  return (
    <div className="mt-5 px-1 text-center flex flex-col items-center gap-2.5">
      <span
        className="grid place-items-center size-12 rounded-full"
        style={{ background: "rgba(255,255,255,.14)", color: G.text }}
      >
        <Inbox size={22} />
      </span>
      <span className="font-semibold text-[13.5px]" style={{ color: G.text }}>
        Tổng hợp việc cần làm
      </span>
      <span className="text-[12px] leading-relaxed" style={{ color: G.textMuted }}>
        Gửi email hoặc nhắn Zalo — việc sẽ tự rơi vào đây, bạn chỉ cần kéo sang
        danh sách phù hợp.
      </span>
      <div className="mt-1 grid grid-cols-2 gap-1.5 w-full">
        {sources.map((s) => (
          <span
            key={s.label}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[11.5px]"
            style={{ background: G.fill, color: G.textSoft }}
          >
            {s.icon}
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}
