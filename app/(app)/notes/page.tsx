"use client";

/**
 * Tab "Ghi chú" — mọi ghi chú trên mọi thẻ của dự án đang mở, mới nhất trước.
 *
 * Ghi chú vốn nằm rải rác trong từng thẻ: muốn xem lại "hôm qua mình vướng gì"
 * phải nhớ nó ở thẻ nào. Màn này gom lại thành một dòng thời gian, nhóm theo
 * ngày; bấm vào một ghi chú là mở đúng thẻ chứa nó.
 */
import { useMemo } from "react";
import Link from "next/link";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Spin } from "antd";
import { ChevronRight, RotateCw, StickyNote } from "lucide-react";
import dayjs from "dayjs";
import { boardApi } from "@/apis/board.api";
import { NOTES_FEED_KEY } from "@/components/board/BoardStore";
import { C } from "@/components/board/ui";
import { cardHref, useBoardId } from "@/components/mobile/links";
import { useCurrentProject } from "@/hooks/useProjects";
import { NoteFeedItem } from "@/models/board";
import { STATUS_META } from "@/models/task";
import { getApiErrorMessage } from "@/utils/client/apiError";

function dayLabel(iso: string): string {
  const d = dayjs(iso);
  if (d.isSame(dayjs(), "day")) return "Hôm nay";
  if (d.isSame(dayjs().subtract(1, "day"), "day")) return "Hôm qua";
  return d.format("dddd, DD/MM/YYYY");
}

export default function NotesPage() {
  const { projectId } = useCurrentProject();
  const boardId = useBoardId();
  const { data, error, isLoading, isFetching, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } =
    useInfiniteQuery({
      queryKey: NOTES_FEED_KEY,
      queryFn: ({ pageParam }) => boardApi.notesFeed(pageParam ?? undefined, projectId ?? undefined),
      initialPageParam: null as string | null,
      getNextPageParam: (last) => last.nextCursor,
      enabled: !!projectId,
      staleTime: 30_000,
    });

  const groups = useMemo(() => {
    const out: { label: string; items: NoteFeedItem[] }[] = [];
    (data?.pages ?? [])
      .flatMap((p) => p.items)
      .forEach((note) => {
        const label = dayLabel(note.createdAt);
        const last = out.at(-1);
        if (last?.label === label) last.items.push(note);
        else out.push({ label, items: [note] });
      });
    return out;
  }, [data]);

  return (
    <div className="flex flex-col gap-4 max-w-[720px] w-full mx-auto">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[22px] font-bold" style={{ color: C.foreground }}>
            Ghi chú
          </div>
          <div className="text-[13px]" style={{ color: C.mutedForeground }}>
            Ghi chú trên mọi việc, mới nhất trước
          </div>
        </div>
        <button
          type="button"
          aria-label="Tải lại"
          onClick={() => void refetch()}
          className="grid place-items-center size-9 rounded-xl border-0 cursor-pointer"
          style={{ background: C.muted, color: C.neutral700 }}
        >
          <RotateCw size={16} className={isFetching && !isFetchingNextPage ? "animate-spin" : undefined} />
        </button>
      </div>

      {error ? (
        <div className="text-center py-10 text-[14px]" style={{ color: C.danger }}>
          {getApiErrorMessage(error)}
        </div>
      ) : isLoading || !projectId ? (
        <div className="grid place-items-center py-16">
          <Spin />
        </div>
      ) : groups.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-14 text-center">
          <StickyNote size={36} style={{ color: C.neutral500 }} />
          <div className="font-semibold text-[15px]" style={{ color: C.foreground }}>
            Chưa có ghi chú nào
          </div>
          <div className="text-[13px] max-w-[300px]" style={{ color: C.mutedForeground }}>
            Mở một việc và viết vào mục &quot;Ghi chú của tôi&quot; — mọi ghi chú sẽ hiện ở đây.
          </div>
        </div>
      ) : (
        <>
          {groups.map((group) => (
            <section key={group.label} className="flex flex-col gap-2">
              <div className="text-[13px] font-semibold capitalize" style={{ color: C.neutral700 }}>
                {group.label}
              </div>
              {group.items.map((note) => (
                <NoteRow key={note.id} note={note} boardId={boardId} />
              ))}
            </section>
          ))}

          {hasNextPage && (
            <button
              type="button"
              onClick={() => void fetchNextPage()}
              disabled={isFetchingNextPage}
              className="h-10 rounded-xl border-0 cursor-pointer text-[13.5px] font-medium disabled:opacity-60"
              style={{ background: C.muted, color: C.neutral700 }}
            >
              {isFetchingNextPage ? "Đang tải..." : "Xem ghi chú cũ hơn"}
            </button>
          )}
        </>
      )}
    </div>
  );
}

function NoteRow({ note, boardId }: { note: NoteFeedItem; boardId: string | null }) {
  const body = (
    <div
      className="flex flex-col gap-2 px-3.5 py-3 rounded-2xl bg-white"
      style={{ border: `1px solid ${C.border}` }}
    >
      <div
        className="text-[14.5px] leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere]"
        style={{ color: C.foreground }}
      >
        {note.content}
      </div>
      <div className="flex items-center gap-2 text-[12px] min-w-0" style={{ color: C.mutedForeground }}>
        <span className="font-mono shrink-0">{note.card.code}</span>
        <span className="truncate flex-1 min-w-0 font-medium" style={{ color: C.neutral800 }}>
          {note.card.title}
        </span>
        <span className="shrink-0">
          {dayjs(note.createdAt).format("HH:mm")}
          {note.editedAt ? " · đã sửa" : ""}
        </span>
        <ChevronRight size={14} className="shrink-0" />
      </div>
      <div className="text-[11.5px] -mt-1" style={{ color: C.neutral500 }}>
        {note.card.listTitle ?? "Hộp thư đến"} · {STATUS_META[note.card.status].label}
      </div>
    </div>
  );

  // Chưa biết id bảng (snapshot chưa về) thì hiện thẻ tĩnh, không dựng link hỏng
  return boardId ? (
    <Link href={cardHref(boardId, note.card.id, "/notes")} className="no-underline">
      {body}
    </Link>
  ) : (
    body
  );
}
