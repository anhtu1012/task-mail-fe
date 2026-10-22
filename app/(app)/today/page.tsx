"use client";

/**
 * Tab "Hôm nay" — màn mở đầu trên mobile: việc quá hạn và việc đến hạn hôm
 * nay, tick xong ngay tại chỗ. Dùng /boards/me/agenda (backend gom sẵn trên
 * toàn bảng) chứ không lọc từ /full, vì /full chỉ trả 20 thẻ đầu mỗi cột.
 * Desktop vẫn mở được, chỉ là bố cục một cột.
 */
import { useQuery } from "@tanstack/react-query";
import { Spin } from "antd";
import { CalendarCheck, RotateCw } from "lucide-react";
import dayjs from "dayjs";
import { boardApi } from "@/apis/board.api";
import { AGENDA_QUERY_KEY } from "@/components/board/BoardStore";
import { C } from "@/components/board/ui";
import { cardHref } from "@/components/mobile/links";
import { MobileCardRow } from "@/components/mobile/MobileCardRow";
import { useToggleComplete } from "@/components/mobile/useToggleComplete";
import { useCurrentProject } from "@/hooks/useProjects";
import { useBoardLabels } from "@/hooks/useTaskApp";
import { BoardLabel, CardSummary } from "@/models/board";
import { getApiErrorMessage } from "@/utils/client/apiError";

export default function TodayPage() {
  const { projectId, project } = useCurrentProject();
  const toggleComplete = useToggleComplete();
  const { labelById } = useBoardLabels();
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: AGENDA_QUERY_KEY,
    queryFn: () => boardApi.agenda(undefined, projectId ?? undefined),
    enabled: !!projectId,
    staleTime: 60_000,
  });

  const overdue = data?.overdue ?? [];
  const dueToday = data?.dueToday ?? [];
  const hours = Math.floor((data?.plannedMinutes ?? 0) / 60);
  const minutes = (data?.plannedMinutes ?? 0) % 60;

  return (
    <div className="flex flex-col gap-4 max-w-[720px] w-full mx-auto">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[13px] capitalize" style={{ color: C.mutedForeground }}>
            {dayjs().format("dddd, DD/MM")}
            {project ? ` · ${project.name}` : ""}
          </div>
          <div className="text-[22px] font-bold" style={{ color: C.foreground }}>
            Hôm nay
          </div>
        </div>
        <button
          type="button"
          aria-label="Tải lại"
          onClick={() => void refetch()}
          className="grid place-items-center size-9 rounded-xl border-0 cursor-pointer"
          style={{ background: C.muted, color: C.neutral700 }}
        >
          <RotateCw size={16} className={isFetching ? "animate-spin" : undefined} />
        </button>
      </div>

      {data && (
        <div className="grid grid-cols-3 gap-2">
          <Stat label="Quá hạn" value={overdue.length} tone={overdue.length ? C.danger : undefined} />
          <Stat label="Đến hạn" value={dueToday.length} />
          <Stat label="Xong hôm nay" value={data.doneToday} tone={C.success} />
        </div>
      )}
      {data && data.plannedMinutes > 0 && (
        <div className="text-[12.5px] -mt-2" style={{ color: C.mutedForeground }}>
          Dự kiến {hours > 0 ? `${hours} giờ ` : ""}
          {minutes > 0 ? `${minutes} phút` : ""} làm việc hôm nay
        </div>
      )}

      {error ? (
        <div className="text-center py-10 text-[14px]" style={{ color: C.danger }}>
          {getApiErrorMessage(error)}
        </div>
      ) : isLoading || !projectId ? (
        <div className="grid place-items-center py-16">
          <Spin />
        </div>
      ) : overdue.length === 0 && dueToday.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-14 text-center">
          <CalendarCheck size={36} style={{ color: C.success }} />
          <div className="font-semibold text-[15px]" style={{ color: C.foreground }}>
            Không còn việc nào đến hạn hôm nay
          </div>
          <div className="text-[13px]" style={{ color: C.mutedForeground }}>
            Bấm nút + ở dưới để thêm việc mới.
          </div>
        </div>
      ) : (
        <>
          <Section
            title="Quá hạn"
            cards={overdue}
            tone={C.danger}
            onToggle={toggleComplete}
            labelById={labelById}
          />
          <Section
            title="Đến hạn hôm nay"
            cards={dueToday}
            onToggle={toggleComplete}
            labelById={labelById}
          />
        </>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="rounded-2xl px-3 py-2.5" style={{ background: C.muted }}>
      <div className="text-[20px] font-bold tabular-nums" style={{ color: tone ?? C.foreground }}>
        {value}
      </div>
      <div className="text-[12px]" style={{ color: C.mutedForeground }}>
        {label}
      </div>
    </div>
  );
}

function Section({
  title,
  cards,
  tone,
  onToggle,
  labelById,
}: {
  title: string;
  cards: CardSummary[];
  tone?: string;
  onToggle: (card: CardSummary) => Promise<unknown>;
  labelById: Map<string, BoardLabel>;
}) {
  if (cards.length === 0) return null;
  return (
    <section className="flex flex-col gap-2">
      <div className="text-[13px] font-semibold uppercase tracking-wide" style={{ color: tone ?? C.neutral700 }}>
        {title} · {cards.length}
      </div>
      {cards.map((card) => (
        <MobileCardRow
          key={card.id}
          card={card}
          href={cardHref(card.boardId, card.id, "/today")}
          onToggleComplete={onToggle}
          labels={card.labelIds.flatMap((id) => labelById.get(id) ?? [])}
        />
      ))}
    </section>
  );
}
