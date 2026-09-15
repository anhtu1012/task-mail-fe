"use client";

/**
 * Bảng lệnh nhanh (Ctrl/⌘ + K).
 *
 * Với bảng vài trăm việc, tìm bằng mắt là chậm nhất. Gõ vài chữ rồi Enter là
 * mở thẳng việc cần tìm — không cần biết nó đang nằm ở cột nào. Ô này cũng gom
 * luôn các lệnh hay dùng để không phải nhớ chỗ bấm.
 *
 * Gõ nội dung rồi Ctrl+Enter là tạo luôn việc mới từ chính chuỗi đó (đi qua
 * quickParse như mọi ô nhập khác).
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CalendarCheck,
  CornerDownLeft,
  Inbox,
  Maximize2,
  Minimize2,
  Plus,
  Search,
  Undo2,
} from "lucide-react";
import { deaccent } from "@/utils/client/quickParse";
import { useBoard } from "./BoardStore";
import { richTextToPlain } from "@/utils/client/richText";
import { Badge, C, LabelChip, fmtShort } from "./ui";

type Command = {
  id: string;
  label: string;
  hint?: string;
  icon: React.ReactNode;
  run: () => void;
};

export function CommandPalette() {
  const { paletteOpen } = useBoard();
  // Chỉ mount khi mở -> mỗi lần mở là state mới tinh, không phải reset bằng effect
  return paletteOpen ? <PaletteBody /> : null;
}

function PaletteBody() {
  const router = useRouter();
  const {
    board,
    lists,
    cardById,
    labelById,
    filter,
    setFilter,
    setPaletteOpen,
    fullscreen,
    setFullscreen,
    canUndo,
    undo,
    lastLabel,
    dispatch,
  } = useBoard();

  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const cards = useMemo(() => Array.from(cardById.values()), [cardById]);

  const matchedCards = useMemo(() => {
    const q = deaccent(query.trim());
    if (!q) {
      // Chưa gõ gì -> gợi ý việc quá hạn và đến hạn sớm nhất
      return cards
        .filter((c) => !c.completedAt && c.deadline)
        .sort((a, b) => (a.deadline ?? "").localeCompare(b.deadline ?? ""))
        .slice(0, 6);
    }
    return cards
      .filter(
        (c) =>
          deaccent(c.title).includes(q) ||
          deaccent(c.code).includes(q) ||
          deaccent(richTextToPlain(c.description)).includes(q),
      )
      .slice(0, 8);
  }, [cards, query]);

  const commands = useMemo<Command[]>(() => {
    const all: Command[] = [
      {
        id: "new",
        label: query.trim() ? `Tạo việc: “${query.trim()}”` : "Tạo việc mới",
        hint: "Ctrl + Enter",
        icon: <Plus size={15} />,
        run: () => {
          const text = query.trim();
          if (!text) return;
          dispatch({ type: "ADD_CARD", listId: lists[0]?.id ?? null, text, atTop: true });
          setPaletteOpen(false);
        },
      },
      {
        id: "overdue",
        label: "Lọc việc quá hạn",
        icon: <AlertTriangle size={15} />,
        run: () => {
          setFilter({ ...filter, overdueOnly: !filter.overdueOnly, todayOnly: false });
          setPaletteOpen(false);
        },
      },
      {
        id: "today",
        label: "Lọc việc đến hạn hôm nay",
        icon: <CalendarCheck size={15} />,
        run: () => {
          setFilter({ ...filter, todayOnly: !filter.todayOnly, overdueOnly: false });
          setPaletteOpen(false);
        },
      },
      {
        id: "fullscreen",
        label: fullscreen ? "Thoát toàn màn hình" : "Toàn màn hình",
        hint: "F",
        icon: fullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />,
        run: () => {
          setFullscreen(!fullscreen);
          setPaletteOpen(false);
        },
      },
    ];

    if (canUndo) {
      all.push({
        id: "undo",
        label: lastLabel ? `Hoàn tác ${lastLabel}` : "Hoàn tác",
        hint: "Ctrl + Z",
        icon: <Undo2 size={15} />,
        run: () => {
          undo();
          setPaletteOpen(false);
        },
      });
    }

    const q = deaccent(query.trim());
    // Lệnh "tạo việc" luôn giữ lại vì nó dùng chính chuỗi đang gõ làm nội dung
    return q ? all.filter((c) => c.id === "new" || deaccent(c.label).includes(q)) : all;
  }, [
    query,
    filter,
    setFilter,
    fullscreen,
    setFullscreen,
    canUndo,
    lastLabel,
    undo,
    dispatch,
    lists,
    setPaletteOpen,
  ]);

  type Row =
    | { kind: "card"; id: string }
    | { kind: "command"; id: string; run: () => void };

  const rows = useMemo<Row[]>(
    () => [
      ...commands.map((c) => ({ kind: "command" as const, id: c.id, run: c.run })),
      ...matchedCards.map((c) => ({ kind: "card" as const, id: c.id })),
    ],
    [commands, matchedCards],
  );

  const activeIndex = Math.min(active, Math.max(rows.length - 1, 0));

  const runRow = (row: Row | undefined) => {
    if (!row) return;
    if (row.kind === "command") {
      row.run();
      return;
    }
    setPaletteOpen(false);
    router.push(`/boards/${board.id}/cards/${row.id}`);
  };

  // Cuộn dòng đang chọn vào tầm nhìn
  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-row="${activeIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  return (
    <div
      className="fixed inset-0 z-[1200] flex items-start justify-center pt-[12vh] px-4"
      style={{ background: "rgba(2,19,33,.5)", backdropFilter: "blur(3px)" }}
      onClick={() => setPaletteOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[620px] rounded-2xl bg-white overflow-hidden"
        style={{ boxShadow: "0 30px 80px rgba(2,19,33,.5)" }}
      >
        <div
          className="flex items-center gap-2.5 px-4 h-14"
          style={{ borderBottom: `1px solid ${C.border}` }}
        >
          <Search size={17} style={{ color: C.mutedForeground }} />
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((i) => Math.min(i + 1, rows.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((i) => Math.max(i - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                if ((e.ctrlKey || e.metaKey) && query.trim()) {
                  commands.find((c) => c.id === "new")?.run();
                  return;
                }
                runRow(rows[activeIndex]);
              } else if (e.key === "Escape") {
                setPaletteOpen(false);
              }
            }}
            placeholder="Tìm việc, hoặc gõ nội dung rồi Ctrl+Enter để tạo..."
            className="flex-1 h-9 border-0 outline-none text-[15px] bg-transparent"
            style={{ color: C.foreground }}
          />
          <kbd
            className="text-[11px] px-1.5 h-5 grid place-items-center rounded"
            style={{ background: C.muted, color: C.mutedForeground }}
          >
            Esc
          </kbd>
        </div>

        <div ref={listRef} className="max-h-[52vh] overflow-y-auto py-1.5">
          {commands.length > 0 && (
            <SectionLabel>Lệnh</SectionLabel>
          )}
          {commands.map((cmd, i) => (
            <Row
              key={cmd.id}
              index={i}
              activeIndex={activeIndex}
              onHover={setActive}
              onClick={() => cmd.run()}
            >
              <span style={{ color: C.neutral700 }}>{cmd.icon}</span>
              <span className="flex-1 text-[14px]" style={{ color: C.foreground }}>
                {cmd.label}
              </span>
              {cmd.hint && (
                <kbd
                  className="text-[11px] px-1.5 h-5 grid place-items-center rounded"
                  style={{ background: C.muted, color: C.mutedForeground }}
                >
                  {cmd.hint}
                </kbd>
              )}
            </Row>
          ))}

          {matchedCards.length > 0 && (
            <SectionLabel>{query.trim() ? "Việc khớp" : "Sắp đến hạn"}</SectionLabel>
          )}
          {matchedCards.map((card, i) => {
            const idx = commands.length + i;
            const list = lists.find((l) => l.id === card.listId);
            const overdue = card.deadlineStatus === "LATE" && !card.completedAt;
            return (
              <Row
                key={card.id}
                index={idx}
                activeIndex={activeIndex}
                onHover={setActive}
                onClick={() => runRow({ kind: "card", id: card.id })}
              >
                <span style={{ color: C.neutral500 }}>
                  {card.listId === null ? <Inbox size={15} /> : <CornerDownLeft size={15} />}
                </span>
                <span className="flex-1 min-w-0">
                  <span
                    className="block text-[14px] truncate"
                    style={{ color: C.foreground }}
                  >
                    {card.title}
                  </span>
                  <span
                    className="flex items-center gap-2 text-[12px] mt-0.5"
                    style={{ color: C.mutedForeground }}
                  >
                    {list?.title ?? "Hộp thư đến"}
                    {card.deadline && (
                      <Badge tone={overdue ? "danger" : "muted"}>
                        {fmtShort(card.deadline)}
                      </Badge>
                    )}
                  </span>
                </span>
                <span className="flex gap-1 shrink-0">
                  {card.labelIds.slice(0, 2).map((id) => {
                    const l = labelById.get(id);
                    return l ? <LabelChip key={id} label={l} size="sm" /> : null;
                  })}
                </span>
              </Row>
            );
          })}

          {rows.length === 0 && (
            <div
              className="px-4 py-6 text-center text-[13px]"
              style={{ color: C.mutedForeground }}
            >
              Không tìm thấy gì khớp “{query}”
            </div>
          )}
        </div>

        <div
          className="flex items-center gap-4 px-4 h-9 text-[11.5px]"
          style={{ borderTop: `1px solid ${C.border}`, color: C.mutedForeground }}
        >
          <span>↑↓ di chuyển</span>
          <span>↵ mở</span>
          <span>Ctrl+↵ tạo việc</span>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="px-4 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide"
      style={{ color: C.mutedForeground }}
    >
      {children}
    </div>
  );
}

function Row({
  index,
  activeIndex,
  onHover,
  onClick,
  children,
}: {
  index: number;
  activeIndex: number;
  onHover: (i: number) => void;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const on = index === activeIndex;
  return (
    <div
      data-row={index}
      onMouseEnter={() => onHover(index)}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2 cursor-pointer"
      style={{ background: on ? C.primary50 : undefined }}
    >
      {children}
    </div>
  );
}
