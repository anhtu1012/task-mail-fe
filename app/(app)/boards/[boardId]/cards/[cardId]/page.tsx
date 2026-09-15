"use client";

/**
 * Trang đầy đủ của một việc — chỉ chạy khi mở thẳng link hoặc tải lại trang,
 * vì điều hướng từ trong bảng đã bị @modal/(.)cards/[cardId] chặn lại.
 * Cũng chiếm trọn màn hình để giống hệt lúc mở từ bảng.
 */
import { use } from "react";
import { useRouter } from "next/navigation";
import { CardDetailView } from "@/components/board/CardDetailView";
import { useBoard } from "@/components/board/BoardStore";
import { C } from "@/components/board/ui";

export default function CardPage({
  params,
}: {
  params: Promise<{ boardId: string; cardId: string }>;
}) {
  const { boardId, cardId } = use(params);
  const router = useRouter();
  const { cardById } = useBoard();
  const card = cardById.get(cardId);

  const backToBoard = () => router.push(`/boards/${boardId}`);

  if (!card) {
    return (
      <div className="grid place-items-center py-16">
        <div
          className="bg-white rounded-xl px-6 py-5 text-center"
          style={{ border: `1px solid ${C.border}` }}
        >
          <div className="font-semibold mb-1" style={{ color: C.foreground }}>
            Không tìm thấy việc này
          </div>
          <div className="text-[13px] mb-3" style={{ color: C.mutedForeground }}>
            Có thể nó đã bị xoá hoặc chuyển sang bảng khác.
          </div>
          <button
            onClick={backToBoard}
            className="h-8 px-3 rounded-lg border-0 text-white text-[13px] cursor-pointer"
            style={{ background: C.primary }}
          >
            Quay lại bảng
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center p-3 sm:p-6"
      style={{ background: "rgba(2,19,33,.55)" }}
    >
      <div
        className="w-full max-w-[1120px] h-full max-h-[92vh] rounded-2xl overflow-hidden bg-white"
        style={{ boxShadow: "0 30px 80px rgba(2,19,33,.5)" }}
      >
        <CardDetailView card={card} onClose={backToBoard} />
      </div>
    </div>
  );
}
