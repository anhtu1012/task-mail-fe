"use client";

/**
 * Trang đầy đủ của một việc — chỉ chạy khi mở thẳng link hoặc tải lại trang,
 * vì điều hướng từ trong bảng đã bị @modal/(.)cards/[cardId] chặn lại.
 */
import { use } from "react";
import { useRouter } from "next/navigation";
import { CardDetailView } from "@/components/board/CardDetailView";

export default function CardPage({
  params,
}: {
  params: Promise<{ boardId: string; cardId: string }>;
}) {
  const { boardId, cardId } = use(params);
  const router = useRouter();

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center p-3 sm:p-6"
      style={{ background: "rgba(2,19,33,.55)" }}
    >
      <div
        className="w-full max-w-[1120px] h-full max-h-[92vh] rounded-2xl overflow-hidden bg-white"
        style={{ boxShadow: "0 30px 80px rgba(2,19,33,.5)" }}
      >
        <CardDetailView
          cardId={cardId}
          onClose={() => router.push(`/boards/${boardId}`)}
        />
      </div>
    </div>
  );
}
