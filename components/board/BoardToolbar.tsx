"use client";

import { useState } from "react";
import dayjs from "dayjs";
import { Popover, Tooltip } from "antd";
import {
  AlertTriangle,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  Command,
  Filter,
  Inbox,
  Maximize2,
  Minimize2,
  Redo2,
  Search,
  Star,
  Timer,
  Undo2,
  X,
} from "lucide-react";
import TaskFormModal from "@/components/tasks/TaskFormModal";
import { ItemKind } from "@/models/task";
import { useBoard } from "./BoardStore";
import { C, G, LabelChip } from "./ui";
import styles from "./board.module.scss";

const fmtLoad = (min: number) =>
  min === 0 ? "—" : min < 60 ? `${min}p` : `${Math.floor(min / 60)}h${min % 60 ? min % 60 : ""}`;

export function BoardToolbar({ onOpenInbox }: { onOpenInbox?: () => void } = {}) {
  const {
    board,
    labels,
    filter,
    setFilter,
    filterActive,
    today,
    toggleStar,
    undo,
    redo,
    canUndo,
    canRedo,
    lastLabel,
    fullscreen,
    setFullscreen,
    agendaOpen,
    setAgendaOpen,
    setPaletteOpen,
  } = useBoard();

  const [creatingEvent, setCreatingEvent] = useState(false);

  const activeCount =
    filter.labelIds.length +
    (filter.keyword ? 1 : 0) +
    (filter.overdueOnly ? 1 : 0) +
    (filter.todayOnly ? 1 : 0);

  const toggleLabel = (id: string) =>
    setFilter({
      ...filter,
      labelIds: filter.labelIds.includes(id)
        ? filter.labelIds.filter((x) => x !== id)
        : [...filter.labelIds, id],
    });

  const clearFilter = () =>
    setFilter({ keyword: "", labelIds: [], overdueOnly: false, todayOnly: false });

  const filterPanel = (
    <div className="w-[min(264px,78vw)] flex flex-col gap-3.5 py-1">
      {/* Trên màn hình hẹp, ô tìm ngoài thanh công cụ bị ẩn -> để ở đây */}
      <div>
        <div
          className="text-[11px] font-semibold uppercase tracking-wide mb-1.5"
          style={{ color: C.mutedForeground }}
        >
          Tìm việc
        </div>
        <input
          value={filter.keyword}
          onChange={(e) => setFilter({ ...filter, keyword: e.target.value })}
          placeholder="Nhập từ khoá..."
          className="w-full h-8 px-2.5 rounded-lg text-[13px] outline-none"
          style={{ border: `1px solid ${C.muted}`, color: C.foreground }}
        />
      </div>

      <div>
        <div
          className="text-[11px] font-semibold uppercase tracking-wide mb-1.5"
          style={{ color: C.mutedForeground }}
        >
          Nhãn
        </div>
        <div className="flex flex-wrap gap-1.5">
          {labels.map((l) => {
            const on = filter.labelIds.includes(l.id);
            return (
              <button
                key={l.id}
                onClick={() => toggleLabel(l.id)}
                className="border-0 bg-transparent p-0 cursor-pointer rounded-md transition-opacity"
                style={{
                  opacity: on || !filter.labelIds.length ? 1 : 0.45,
                  boxShadow: on ? `0 0 0 2px ${C.primary}` : undefined,
                }}
              >
                <LabelChip label={l} />
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Check
          checked={filter.overdueOnly}
          onChange={(v) => setFilter({ ...filter, overdueOnly: v })}
          label="Chỉ việc quá hạn"
        />
        <Check
          checked={filter.todayOnly}
          onChange={(v) => setFilter({ ...filter, todayOnly: v })}
          label="Chỉ việc đến hạn hôm nay"
        />
      </div>

      {filterActive && (
        <button
          onClick={clearFilter}
          className="h-8 rounded-lg border-0 cursor-pointer text-[13px] flex items-center justify-center gap-1.5"
          style={{ background: C.muted, color: C.neutral700 }}
        >
          <X size={14} /> Xoá bộ lọc
        </button>
      )}
    </div>
  );

  return (
    <div
      className={`${styles.glassPanel} @container shrink-0 flex flex-wrap items-center gap-2 px-3 py-2 min-h-14`}
    >
      <span
        className="font-semibold text-[15.5px] truncate max-w-[140px] @xl:max-w-[200px]"
        style={{ color: G.text }}
      >
        {board?.title ?? "Bảng công việc"}
      </span>

      <Tooltip title={board?.starred ? "Bỏ đánh dấu sao" : "Đánh dấu sao"}>
        <button
          onClick={toggleStar}
          className="grid place-items-center size-7 shrink-0 rounded-md border-0 bg-transparent cursor-pointer hover:bg-white/15"
          /* stroke của SVG không hiểu var(), nên đặt màu qua CSS rồi để icon
             dùng currentColor */
          style={{ color: board?.starred ? C.warning : G.textMuted }}
        >
          <Star
            size={16}
            fill={board?.starred ? C.warning : "none"}
            stroke="currentColor"
          />
        </button>
      </Tooltip>

      {/* Hộp thư đến — panel bên trái bị ẩn dưới 768px, phải có lối vào khác */}
      {onOpenInbox && (
        <Tooltip title="Hộp thư đến">
          <button
            onClick={onOpenInbox}
            aria-label="Hộp thư đến"
            className={`${styles.glassGhost} md:hidden grid place-items-center size-8 shrink-0`}
          >
            <Inbox size={16} />
          </button>
        </Tooltip>
      )}

      {/* Chỉ số hôm nay — thứ duy nhất cần biết ngay khi mở bảng.
          Bấm vào là lọc luôn, không phải mở bộ lọc rồi tích. */}
      <div className="hidden @3xl:flex items-center gap-1.5 ml-1 shrink-0">
        <Stat
          icon={<AlertTriangle size={13} />}
          value={today.overdue}
          label="quá hạn"
          tone="danger"
          active={filter.overdueOnly}
          onClick={() =>
            setFilter({ ...filter, overdueOnly: !filter.overdueOnly, todayOnly: false })
          }
        />
        <Stat
          icon={<CalendarCheck size={13} />}
          value={today.dueToday}
          label="hôm nay"
          tone="primary"
          active={filter.todayOnly}
          onClick={() =>
            setFilter({ ...filter, todayOnly: !filter.todayOnly, overdueOnly: false })
          }
        />
        <Stat
          icon={<CheckCircle2 size={13} />}
          value={today.doneToday}
          label="đã xong"
          tone="success"
        />
        {today.plannedMinutes > 0 && (
          <Tooltip title="Tổng thời lượng dự kiến của việc đến hạn hôm nay">
            <span
              className="inline-flex items-center gap-1 h-7 px-2 rounded-lg text-[12px] font-medium whitespace-nowrap shrink-0"
              style={{ background: G.fill, color: G.textSoft }}
            >
              <Timer size={13} />
              {fmtLoad(today.plannedMinutes)}
            </span>
          </Tooltip>
        )}
      </div>

      <div className="flex-1" />

      <div className="relative hidden @2xl:block w-[170px] @5xl:w-[230px] shrink-0">
        <Search
          size={14}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: G.textMuted }}
        />
        <input
          data-board-search
          value={filter.keyword}
          onChange={(e) => setFilter({ ...filter, keyword: e.target.value })}
          placeholder="Tìm việc...  (/)"
          className={`${styles.glassInput} w-full h-8 pl-8 pr-2.5 text-[13px]`}
        />
      </div>

      {/*
        TẠO LỊCH HẸN — luôn hiện, không ẩn theo bề ngang.

        Trước đó lối vào duy nhất nằm trong khung "Lịch hôm nay", mà khung đó
        bị chặn bởi HAI lớp ẩn độc lập: chỉ hiện từ 768px bề ngang vùng canvas,
        và có thể bị đóng (trạng thái đóng còn được nhớ lại). Đóng một lần là
        mất hẳn đường tạo lịch hẹn — nút mở lại nó cũng chỉ hiện từ 1152px.

        Thanh công cụ thì luôn có mặt, nên lối vào đặt ở đây mới chắc chắn.
      */}
      <Tooltip title="Tạo lịch hẹn (có giờ bắt đầu — kết thúc)">
        <button
          onClick={() => setCreatingEvent(true)}
          aria-label="Tạo lịch hẹn"
          className={`${styles.glassGhost} flex items-center gap-1.5 h-8 px-2.5 shrink-0 text-[13px]`}
        >
          <CalendarClock size={15} />
          <span className="hidden @3xl:inline">Lịch hẹn</span>
        </button>
      </Tooltip>

      {/* Hoàn tác / làm lại — kéo nhầm thẻ là chuyện thường, phải sửa được ngay */}
      <div className="hidden @4xl:flex items-center gap-1 shrink-0">
        <Tooltip title={canUndo ? `Hoàn tác ${lastLabel ?? ""} (Ctrl+Z)` : "Chưa có gì để hoàn tác"}>
          <button
            onClick={undo}
            disabled={!canUndo}
            aria-label="Hoàn tác"
            className={`${styles.glassGhost} grid place-items-center size-8`}
            style={{ opacity: canUndo ? 1 : 0.35, cursor: canUndo ? "pointer" : "default" }}
          >
            <Undo2 size={16} />
          </button>
        </Tooltip>
        <Tooltip title="Làm lại (Ctrl+Shift+Z)">
          <button
            onClick={redo}
            disabled={!canRedo}
            aria-label="Làm lại"
            className={`${styles.glassGhost} grid place-items-center size-8`}
            style={{ opacity: canRedo ? 1 : 0.35, cursor: canRedo ? "pointer" : "default" }}
          >
            <Redo2 size={16} />
          </button>
        </Tooltip>
      </div>

      <Tooltip title="Bảng lệnh nhanh (Ctrl+K)">
        <button
          onClick={() => setPaletteOpen(true)}
          aria-label="Bảng lệnh nhanh"
          className={`${styles.glassGhost} hidden @5xl:grid place-items-center size-8 shrink-0`}
        >
          <Command size={16} />
        </button>
      </Tooltip>

      <Tooltip title={agendaOpen ? "Ẩn lịch hôm nay" : "Hiện lịch hôm nay"}>
        <button
          onClick={() => setAgendaOpen(!agendaOpen)}
          aria-label="Lịch hôm nay"
          /* Cùng ngưỡng với chính khung lịch (@3xl): nút bật/tắt mà hiện muộn
             hơn thứ nó bật/tắt thì có lúc panel ẩn mà không có cách nào gọi lại */
          className="hidden @3xl:grid place-items-center size-8 shrink-0 rounded-lg cursor-pointer"
          style={
            agendaOpen
              ? { background: "rgba(190,224,244,.9)", color: "#062b47", border: "1px solid rgba(190,224,244,.9)" }
              : { background: G.fill, color: G.textSoft, border: `1px solid ${G.line}` }
          }
        >
          <CalendarClock size={16} />
        </button>
      </Tooltip>

      {/* Toàn màn hình — ẩn sidebar và header của hệ thống */}
      <Tooltip title={fullscreen ? "Thoát toàn màn hình (F / Esc)" : "Toàn màn hình (F)"}>
        <button
          onClick={() => setFullscreen(!fullscreen)}
          className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg cursor-pointer text-[13px] font-medium whitespace-nowrap shrink-0"
          style={
            fullscreen
              ? { background: "rgba(190,224,244,.9)", color: "#062b47", border: "1px solid rgba(190,224,244,.9)" }
              : { background: G.fill, color: G.textSoft, border: `1px solid ${G.line}` }
          }
        >
          {fullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          <span className="hidden @6xl:inline">{fullscreen ? "Thu nhỏ" : "Toàn màn hình"}</span>
        </button>
      </Tooltip>

      <Popover content={filterPanel} title="Bộ lọc" trigger="click" placement="bottomRight">
        <button
          className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg cursor-pointer text-[13px] font-medium whitespace-nowrap shrink-0 transition-colors"
          style={
            filterActive
              ? {
                  background: "rgba(190,224,244,.9)",
                  color: "#062b47",
                  border: "1px solid rgba(190,224,244,.9)",
                }
              : { background: G.fill, color: G.textSoft, border: `1px solid ${G.line}` }
          }
        >
          <Filter size={14} />
          <span className="hidden @4xl:inline">Bộ lọc</span>
          {activeCount > 0 && (
            <span
              className="grid place-items-center min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold"
              style={{ background: "#062b47", color: "#fff" }}
            >
              {activeCount}
            </span>
          )}
        </button>
      </Popover>

      {/* Form tạo lịch hẹn — dùng lại đúng form của màn Công việc */}
      <TaskFormModal
        open={creatingEvent}
        onClose={() => setCreatingEvent(false)}
        defaultKind={ItemKind.EVENT}
        defaultDeadline={dayjs()}
      />
    </div>
  );
}

function Stat({
  icon,
  value,
  label,
  tone,
  active = false,
  onClick,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  tone: "danger" | "primary" | "success";
  active?: boolean;
  onClick?: () => void;
}) {
  const palette = {
    danger: { fg: G.danger, bg: G.dangerFill },
    primary: { fg: G.info, bg: G.infoFill },
    success: { fg: G.success, bg: G.successFill },
  }[tone];

  // Con số bằng 0 thì để xám — tránh bảng lúc nào cũng đỏ rực dù không có việc gấp
  const muted = value === 0;
  const Tag = onClick ? "button" : "span";

  return (
    <Tag
      onClick={onClick}
      className={`inline-flex items-center gap-1 h-7 px-2 rounded-lg text-[12px] font-medium border-0 whitespace-nowrap shrink-0 ${
        onClick ? "cursor-pointer" : ""
      }`}
      style={{
        background: muted ? G.fill : palette.bg,
        color: muted ? G.textMuted : palette.fg,
        boxShadow: active ? `0 0 0 2px ${palette.fg}` : undefined,
      }}
    >
      {icon}
      <span className="tabular-nums font-semibold">{value}</span>
      <span className="hidden @6xl:inline font-normal">{label}</span>
    </Tag>
  );
}

function Check({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label
      className="flex items-center gap-2 text-[13px] cursor-pointer"
      style={{ color: C.foreground }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ accentColor: C.primary, width: 15, height: 15 }}
      />
      {label}
    </label>
  );
}
