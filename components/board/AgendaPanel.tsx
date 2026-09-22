"use client";

/**
 * Lịch hôm nay — cột bên phải, xếp việc đến hạn trong ngày theo giờ.
 *
 * Gọi `GET /boards/me/agenda` chứ KHÔNG gom từ dữ liệu của `/full`: `/full` chỉ
 * trả 20 thẻ đầu mỗi cột, mà việc đến hạn hôm nay nằm rải rác ở mọi cột và có
 * thể rơi ngoài 20 thẻ đó. Gom ở client sẽ thiếu việc mà màn vẫn trông bình
 * thường — loại lỗi rất khó phát hiện.
 */
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Tooltip } from "antd";
import dayjs from "dayjs";
import {
  AlertTriangle,
  CalendarClock,
  PanelRightClose,
  Plus,
  Timer,
} from "lucide-react";
import { boardApi } from "@/apis/board.api";
import { useCurrentProject } from "@/hooks/useProjects";
import { useTasks } from "@/hooks/useTaskApp";
import TaskDetailDrawer from "@/components/tasks/TaskDetailDrawer";
import TaskFormModal from "@/components/tasks/TaskFormModal";
import { CardSummary } from "@/models/board";
import { ItemKind, PRIORITY_META, Task } from "@/models/task";
import { useBoard } from "./BoardStore";
import { G } from "./ui";
import styles from "./board.module.scss";

/** Khung giờ làm việc hiển thị trên trục */
const DAY_END = 20;

const fmtDuration = (min: number) =>
  min < 60 ? `${min}p` : min % 60 === 0 ? `${min / 60}h` : `${Math.floor(min / 60)}h${min % 60}`;

export function AgendaPanel() {
  const router = useRouter();
  const { board, agendaOpen, setAgendaOpen } = useBoard();

  const { projectId } = useCurrentProject();
  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState<Task | null>(null);
  /** Lịch hẹn đang sửa — mở lại form ở chế độ sửa, giữ nguyên khung giờ cũ */
  const [editing, setEditing] = useState<Task | null>(null);

  /*
   * Lịch hẹn hôm nay. Hỏi `/tasks` chứ không hỏi API bảng: sự kiện không thuộc
   * bảng nào (`boardId = null`), nên endpoint bảng sẽ không bao giờ trả về.
   */
  const today = dayjs();
  const { data: appointmentData } = useTasks({
    kind: ItemKind.EVENT,
    from: today.startOf("day").toISOString(),
    to: today.endOf("day").toISOString(),
    limit: 20,
  });
  const appointments = useMemo(
    () =>
      (appointmentData?.items ?? [])
        .filter((e) => e.startAt)
        .sort((a, b) => dayjs(a.startAt!).valueOf() - dayjs(b.startAt!).valueOf()),
    [appointmentData],
  );
  const { data, isLoading } = useQuery({
    queryKey: ["board", "agenda"],
    queryFn: () => boardApi.agenda(undefined, projectId ?? undefined),
    staleTime: 60_000,
    enabled: agendaOpen && !!projectId,
  });

  const slots = useMemo(() => {
    // Gom theo giờ để không vẽ 13 dòng trống khi chỉ có 2 việc
    const byHour = new Map<number, CardSummary[]>();
    (data?.dueToday ?? []).forEach((c) => {
      if (!c.deadline) return;
      const h = new Date(c.deadline).getHours();
      if (!byHour.has(h)) byHour.set(h, []);
      byHour.get(h)!.push(c);
    });
    return [...byHour.entries()].sort((a, b) => a[0] - b[0]);
  }, [data]);

  const load = useMemo(() => {
    const now = new Date();
    // Số phút còn lại tới cuối khung giờ làm việc
    const remaining = Math.max(0, (DAY_END - now.getHours()) * 60 - now.getMinutes());
    // plannedMinutes lấy nguyên của server — nó tính trên TOÀN BỘ việc đến hạn
    // hôm nay kể cả việc đã quá hạn, không phải tổng của mảng dueToday.
    const planned = data?.plannedMinutes ?? 0;
    return { planned, remaining, over: planned > remaining && remaining > 0 };
  }, [data]);

  if (!agendaOpen) return null;

  const open = (id: string) => board && router.push(`/boards/${board.id}/cards/${id}`);
  const overdue = data?.overdue ?? [];

  return (
    /*
     * Ngưỡng hiện panel hạ từ @5xl (1024px) xuống @3xl (768px).
     *
     * Với Hộp thư đến chiếm 292px bên trái, vùng canvas hiếm khi vượt 1024px
     * trên màn 1440 — nên panel này (và cả mục Lịch hẹn trong đó) gần như
     * không bao giờ hiện, trông như tính năng không tồn tại.
     */
    <div className={`${styles.glassPanel} w-[264px] shrink-0 hidden @3xl:flex flex-col overflow-hidden`}>
      <div
        className="flex items-center gap-2 px-3 h-11 shrink-0"
        style={{ borderBottom: `1px solid ${G.line}` }}
      >
        <CalendarClock size={16} style={{ color: G.info }} />
        <span className="font-semibold text-[13.5px] flex-1" style={{ color: G.text }}>
          Lịch hôm nay
        </span>
        <Tooltip title="Ẩn lịch">
          <button
            onClick={() => setAgendaOpen(false)}
            className="grid place-items-center size-7 rounded-md border-0 bg-transparent
              hover:bg-white/15 cursor-pointer"
            style={{ color: G.textSoft }}
          >
            <PanelRightClose size={15} />
          </button>
        </Tooltip>
      </div>

      {/* Tải trong ngày */}
      <div className="px-3 py-2.5 shrink-0" style={{ borderBottom: `1px solid ${G.line}` }}>
        <div className="flex items-center justify-between text-[12px]">
          <span style={{ color: G.textMuted }}>Đã xếp</span>
          <span className="font-semibold tabular-nums" style={{ color: G.text }}>
            {fmtDuration(load.planned)} / còn {fmtDuration(load.remaining)}
          </span>
        </div>
        <div
          className="mt-1.5 h-1.5 rounded-full overflow-hidden"
          style={{ background: "rgba(255,255,255,.16)" }}
        >
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(100, load.remaining ? (load.planned / load.remaining) * 100 : 100)}%`,
              background: load.over ? G.danger : G.success,
            }}
          />
        </div>
        {load.over && (
          <div
            className="mt-1.5 flex items-start gap-1.5 text-[11.5px] leading-snug"
            style={{ color: G.danger }}
          >
            <AlertTriangle size={12} className="shrink-0 mt-0.5" />
            Xếp nhiều hơn thời gian còn lại — nên dời bớt sang mai.
          </div>
        )}
      </div>

      {/*
        LỊCH HẸN HÔM NAY.

        Sự kiện cố tình không nằm trên bảng (bảng là nơi làm việc, không phải
        nơi xem lịch — xem `docs/backend/calendar-events.md`), nhưng "hôm nay
        mấy giờ có hẹn" lại là thứ phải biết TRƯỚC KHI xếp việc trong ngày.
        Nên nó thuộc về đúng chỗ này: khung lịch hôm nay, ngay trên danh sách
        việc đến hạn.
      */}
      <div className="px-3 py-2.5 shrink-0" style={{ borderBottom: `1px solid ${G.line}` }}>
        <div className="flex items-center gap-2 mb-1.5">
          <span
            className="text-[11px] font-semibold uppercase tracking-wide flex-1"
            style={{ color: G.textMuted }}
          >
            Lịch hẹn ({appointments.length})
          </span>
          <Tooltip title="Thêm lịch hẹn hôm nay">
            <button
              onClick={() => setCreating(true)}
              className="grid place-items-center size-6 rounded-md border-0 bg-transparent
                hover:bg-white/15 cursor-pointer"
              style={{ color: G.textSoft }}
            >
              <Plus size={14} />
            </button>
          </Tooltip>
        </div>

        {appointments.length === 0 ? (
          <div className="text-[11.5px]" style={{ color: G.textFaint }}>
            Hôm nay không có hẹn nào.
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {appointments.map((event) => (
              <button
                key={event.id}
                onClick={() => setViewing(event)}
                className="flex items-center gap-2 h-7 px-2 rounded-md border-0 cursor-pointer text-left"
                style={{ background: "rgba(255,255,255,.12)" }}
              >
                <span
                  className="text-[11px] font-semibold tabular-nums shrink-0"
                  style={{ color: G.info }}
                >
                  {event.allDay
                    ? "cả ngày"
                    : dayjs(event.startAt!).format("HH:mm")}
                </span>
                <span
                  className="flex-1 min-w-0 truncate text-[12px]"
                  style={{ color: G.text }}
                >
                  {event.title}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={`${styles.scrollArea} flex-1 min-h-0 overflow-y-auto px-3 py-2.5 flex flex-col gap-3`}>
        {isLoading && (
          <div className="text-[12.5px] text-center mt-4" style={{ color: G.textMuted }}>
            Đang tải lịch...
          </div>
        )}

        {overdue.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <div
              className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide"
              style={{ color: G.danger }}
            >
              <AlertTriangle size={12} />
              Quá hạn ({overdue.length})
            </div>
            {overdue.map((c) => (
              <AgendaItem key={c.id} card={c} onOpen={open} overdue />
            ))}
          </div>
        )}

        {slots.map(([hour, cards]) => (
          <div key={hour} className="flex flex-col gap-1.5">
            <div
              className="flex items-center gap-2 text-[11px] font-semibold tabular-nums"
              style={{ color: G.textMuted }}
            >
              {String(hour).padStart(2, "0")}:00
              <span className="flex-1 h-px" style={{ background: G.line }} />
            </div>
            {cards.map((c) => (
              <AgendaItem key={c.id} card={c} onOpen={open} />
            ))}
          </div>
        ))}

        {!isLoading && overdue.length === 0 && slots.length === 0 && (
          <div className="mt-6 text-center flex flex-col items-center gap-2">
            <span
              className="grid place-items-center size-11 rounded-full"
              style={{ background: "rgba(255,255,255,.14)", color: G.text }}
            >
              <CalendarClock size={20} />
            </span>
            <span className="text-[12.5px] leading-relaxed" style={{ color: G.textMuted }}>
              Hôm nay không có việc nào đến hạn. Đặt hạn cho việc bằng cách gõ
              “mai 9h” khi thêm.
            </span>
          </div>
        )}
      </div>

      {/* Dùng lại đúng form của màn Công việc — mở sẵn ở chế độ Lịch hẹn */}
      <TaskFormModal
        open={creating || !!editing}
        task={editing}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        defaultKind={ItemKind.EVENT}
        defaultDeadline={dayjs()}
      />
      <TaskDetailDrawer
        task={viewing}
        onClose={() => setViewing(null)}
        /*
         * Sửa lịch hẹn: đóng ngăn xem rồi MỞ FORM ở chế độ sửa.
         *
         * Bản đầu tôi chỉ đóng ngăn xem — nghĩa là bấm nút bút chì không làm
         * gì cả, và không còn đường nào để đổi khung giờ của một lịch hẹn.
         */
        onEdit={(task) => {
          setViewing(null);
          setEditing(task);
        }}
      />
    </div>
  );
}

function AgendaItem({
  card,
  onOpen,
  overdue = false,
}: {
  card: CardSummary;
  onOpen: (id: string) => void;
  overdue?: boolean;
}) {
  const time = card.deadline
    ? new Date(card.deadline).toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <button
      onClick={() => onOpen(card.id)}
      className="w-full text-left rounded-lg px-2 py-1.5 border-0 cursor-pointer transition-colors"
      style={{
        background: overdue ? "rgba(230,57,70,.18)" : "rgba(255,255,255,.12)",
        borderLeft: `3px solid ${PRIORITY_META[card.priority].color}`,
      }}
    >
      <div className="text-[12.5px] leading-snug line-clamp-2" style={{ color: G.text }}>
        {card.title}
      </div>
      <div
        className="flex items-center gap-2 mt-1 text-[11px] tabular-nums"
        style={{ color: overdue ? G.danger : G.textMuted }}
      >
        {time}
        {card.estimateMinutes !== null && (
          <span className="inline-flex items-center gap-0.5">
            <Timer size={10} />
            {fmtDuration(card.estimateMinutes)}
          </span>
        )}
      </div>
    </button>
  );
}
