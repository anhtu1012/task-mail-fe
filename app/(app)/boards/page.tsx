"use client";

import Link from "next/link";
import { Plus, Star } from "lucide-react";
import { MOCK_BOARD, MOCK_LISTS, MOCK_SNAPSHOT } from "@/mocks/board.mock";
import { C } from "@/components/board/ui";

/** Trang chọn bảng — hiện chỉ có một bảng mẫu, nhưng giữ đúng cấu trúc route cho sau này. */
export default function BoardsIndexPage() {
  const cardCount = MOCK_SNAPSHOT.cards.filter((c) => c.listId !== null).length;
  const inboxCount = MOCK_SNAPSHOT.cards.length - cardCount;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <Link
          href={`/boards/${MOCK_BOARD.id}`}
          className="rounded-xl overflow-hidden bg-white no-underline transition-shadow hover:shadow-[0_4px_16px_rgba(10,67,109,.12)]"
          style={{ border: `1px solid ${C.border}` }}
        >
          <div
            className="h-20 relative"
            style={{ background: "linear-gradient(135deg,#0a436d,#2d79a8)" }}
          >
            {MOCK_BOARD.starred && (
              <Star
                size={16}
                fill={C.warning}
                stroke={C.warning}
                className="absolute top-2.5 right-2.5"
              />
            )}
          </div>
          <div className="px-3 py-2.5">
            <div className="font-semibold text-[14px]" style={{ color: C.foreground }}>
              {MOCK_BOARD.title}
            </div>
            <div className="text-[12px] mt-0.5" style={{ color: C.mutedForeground }}>
              {MOCK_LISTS.length} danh sách · {cardCount} thẻ · {inboxCount} chờ phân loại
            </div>
          </div>
        </Link>

        <button
          className="rounded-xl h-[126px] flex flex-col items-center justify-center gap-1.5 cursor-pointer
            bg-transparent transition-colors hover:bg-white"
          style={{ border: `1px dashed ${C.borderDark}`, color: C.neutral700 }}
        >
          <Plus size={20} />
          <span className="text-[13px] font-medium">Tạo bảng mới</span>
        </button>
      </div>

      <p className="text-[12.5px] leading-relaxed max-w-[620px] m-0" style={{ color: C.mutedForeground }}>
        Màn này đang chạy trên dữ liệu mẫu trong <code>mocks/board.mock.ts</code>. Hợp
        đồng dữ liệu và danh sách endpoint cần backend bổ sung nằm ở{" "}
        <code>docs/backend/board-spec.md</code>.
      </p>
    </div>
  );
}
